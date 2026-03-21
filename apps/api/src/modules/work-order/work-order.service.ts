import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AddWorkOrderItemDto } from './dto/add-work-order-item.dto';
import type { ChangeStatusDto } from './dto/change-status.dto';
import type { CreateWorkOrderDto } from './dto/create-work-order.dto';
import type { QueryWorkOrderDto } from './dto/query-work-order.dto';
import type { UpdateWorkOrderDto } from './dto/update-work-order.dto';

// Allowed forward transitions. INVOICED and CANCELLED are terminal states
// and cannot be transitioned away from manually.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // only INVOICED is possible, but only via invoice creation
  INVOICED: [],
  CANCELLED: [],
};

@Injectable()
export class WorkOrderService {
  private readonly logger = new Logger(WorkOrderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates the next sequential order number for the tenant.
   * Format: WO-00001, WO-00002, …
   *
   * Reads the highest existing orderNo for the tenant, extracts the numeric
   * suffix, increments it, and left-pads to 5 digits.
   */
  async generateOrderNo(tenantId: string): Promise<string> {
    const last = await this.prisma.workOrder.findFirst({
      where: { tenantId },
      orderBy: { orderNo: 'desc' },
      select: { orderNo: true },
    });

    let next = 1;

    if (last?.orderNo) {
      const parts = last.orderNo.split('-');
      const num = Number.parseInt(parts[parts.length - 1] ?? '0', 10);
      if (!Number.isNaN(num)) {
        next = num + 1;
      }
    }

    return `WO-${String(next).padStart(5, '0')}`;
  }

  /**
   * Returns a paginated list of work orders for the tenant with optional
   * filters. Includes customer and vehicle relations.
   */
  async findAll(tenantId: string, query: QueryWorkOrderDto) {
    const {
      status,
      customerId,
      vehicleId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: true,
          vehicle: true,
        },
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a single work order by ID with all relations:
   * customer, vehicle, technician, items (with serviceDefinition and product).
   */
  async findById(id: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        technician: true,
        items: {
          include: {
            serviceDefinition: true,
            product: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return workOrder;
  }

  /**
   * Creates a work order together with its initial items in a single
   * transaction. Calculates item totals, subtotal, taxAmount, and total.
   */
  async create(tenantId: string, data: CreateWorkOrderDto) {
    const orderNo = await this.generateOrderNo(tenantId);

    return this.prisma.$transaction(async (tx) => {
      const taxRate = data.taxRate ?? 0;

      // Calculate per-item totals and aggregate subtotal
      const itemsWithTotals = data.items.map((item) => ({
        ...item,
        itemTotal: item.quantity * item.unitPrice,
      }));

      const subtotal = itemsWithTotals.reduce((acc, i) => acc + i.itemTotal, 0);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const workOrder = await tx.workOrder.create({
        data: {
          tenantId,
          orderNo,
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          technicianId: data.technicianId ?? null,
          currentKm: data.currentKm ?? null,
          taxRate,
          notes: data.notes ?? null,
          subtotal,
          taxAmount,
          total,
          status: 'DRAFT',
          items: {
            create: itemsWithTotals.map((item) => ({
              type: item.type,
              serviceDefinitionId: item.serviceDefinitionId ?? null,
              productId: item.productId ?? null,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.itemTotal,
            })),
          },
        },
        include: {
          customer: true,
          vehicle: true,
          technician: true,
          items: {
            include: {
              serviceDefinition: true,
              product: true,
            },
          },
        },
      });

      return workOrder;
    });
  }

  /**
   * Updates basic fields (technicianId, currentKm, taxRate, notes) only.
   * When taxRate changes the totals are recalculated.
   */
  async update(id: string, data: UpdateWorkOrderDto) {
    await this.findById(id);

    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        ...(data.technicianId !== undefined ? { technicianId: data.technicianId } : {}),
        ...(data.currentKm !== undefined ? { currentKm: data.currentKm } : {}),
        ...(data.taxRate !== undefined ? { taxRate: data.taxRate } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    // Recalculate totals whenever taxRate is part of the update
    if (data.taxRate !== undefined) {
      return this.recalculateTotals(id);
    }

    return updated;
  }

  /**
   * Adds a single item to an existing work order and recalculates totals.
   */
  async addItem(workOrderId: string, data: AddWorkOrderItemDto) {
    await this.findById(workOrderId);

    const itemTotal = data.quantity * data.unitPrice;

    await this.prisma.workOrderItem.create({
      data: {
        workOrderId,
        type: data.type,
        serviceDefinitionId: data.serviceDefinitionId ?? null,
        productId: data.productId ?? null,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        total: itemTotal,
      },
    });

    return this.recalculateTotals(workOrderId);
  }

  /**
   * Removes an item from a work order and recalculates totals.
   */
  async removeItem(workOrderId: string, itemId: string) {
    // Verify work order exists
    await this.findById(workOrderId);

    const item = await this.prisma.workOrderItem.findFirst({
      where: { id: itemId, workOrderId },
    });

    if (!item) {
      throw new NotFoundException('Work order item not found');
    }

    await this.prisma.workOrderItem.delete({ where: { id: itemId } });

    return this.recalculateTotals(workOrderId);
  }

  /**
   * Changes the status of a work order after validating the transition is
   * permitted.
   *
   * Side-effects:
   *   DRAFT/IN_PROGRESS → COMPLETED  — sets completedAt and deducts stock.
   *   IN_PROGRESS/COMPLETED → CANCELLED — reverses previously deducted stock.
   *
   * All mutations run inside a single Prisma interactive transaction so that
   * a partial stock update never leaves the order in an inconsistent state.
   */
  async changeStatus(id: string, tenantId: string, data: ChangeStatusDto) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, tenantId },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const current = workOrder.status;
    const target = data.status;

    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(target)) {
      throw new BadRequestException(
        `Cannot transition work order from ${current} to ${target}. ` +
          `Allowed transitions from ${current}: [${allowed.join(', ') || 'none'}].`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        status: target,
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      };

      if (target === 'COMPLETED') {
        updateData['completedAt'] = new Date();
        await this.deductStockForOrder(id, tenantId, tx);
      }

      if (target === 'CANCELLED' && (current === 'IN_PROGRESS' || current === 'COMPLETED')) {
        await this.reverseStockForOrder(id, tenantId, tx);
      }

      return tx.workOrder.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          vehicle: true,
          technician: true,
          items: {
            include: {
              serviceDefinition: true,
              product: true,
            },
          },
        },
      });
    });
  }

  /**
   * For each WorkOrderItem of type 'product', creates an OUT StockMovement
   * and decrements Product.currentStock atomically inside the provided
   * transaction context.
   *
   * Logs a warning (but does NOT throw) when an item's stock would go below
   * zero — the movement is still recorded so the shortfall is visible in the
   * audit trail.
   */
  async deductStockForOrder(
    workOrderId: string,
    tenantId: string,
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<void> {
    const productItems = await tx.workOrderItem.findMany({
      where: { workOrderId, type: 'product', productId: { not: null } },
      select: { productId: true, quantity: true, description: true },
    });

    for (const item of productItems) {
      const productId = item.productId as string;
      const qty = Number(item.quantity);

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { currentStock: true, name: true },
      });

      if (!product) {
        this.logger.warn(
          `deductStockForOrder: product ${productId} not found, skipping.`,
        );
        continue;
      }

      const newStock = Number(product.currentStock) - qty;

      if (newStock < 0) {
        this.logger.warn(
          `deductStockForOrder: insufficient stock for product "${product.name}" ` +
            `(id: ${productId}). Requested ${qty}, available ${product.currentStock}. ` +
            `Stock will go negative — movement recorded for audit.`,
        );
      }

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          type: 'OUT',
          quantity: qty,
          referenceType: 'work_order',
          referenceId: workOrderId,
          reason: `Work order completed: ${item.description}`,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });
    }
  }

  /**
   * Reverses the stock deductions previously recorded for this work order by
   * creating IN StockMovements and incrementing Product.currentStock.
   * Called when a work order is cancelled after stock was already deducted
   * (i.e. when cancelling from IN_PROGRESS or COMPLETED).
   */
  async reverseStockForOrder(
    workOrderId: string,
    tenantId: string,
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<void> {
    const productItems = await tx.workOrderItem.findMany({
      where: { workOrderId, type: 'product', productId: { not: null } },
      select: { productId: true, quantity: true, description: true },
    });

    for (const item of productItems) {
      const productId = item.productId as string;
      const qty = Number(item.quantity);

      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { currentStock: true },
      });

      if (!product) {
        this.logger.warn(
          `reverseStockForOrder: product ${productId} not found, skipping reversal.`,
        );
        continue;
      }

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          type: 'IN',
          quantity: qty,
          referenceType: 'work_order',
          referenceId: workOrderId,
          reason: `Work order cancelled — reversing stock: ${item.description}`,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: Number(product.currentStock) + qty },
      });
    }
  }

  /**
   * Sums all item totals for the work order, applies the stored taxRate,
   * updates subtotal, taxAmount, and total fields, then returns the full
   * work order record with relations.
   */
  async recalculateTotals(workOrderId: string) {
    const items = await this.prisma.workOrderItem.findMany({
      where: { workOrderId },
      select: { total: true },
    });

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { taxRate: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const subtotal = items.reduce((acc, item) => acc + Number(item.total), 0);
    const taxRate = Number(workOrder.taxRate);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: { subtotal, taxAmount, total },
      include: {
        customer: true,
        vehicle: true,
        technician: true,
        items: {
          include: {
            serviceDefinition: true,
            product: true,
          },
        },
      },
    });
  }
}
