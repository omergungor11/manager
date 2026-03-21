import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AddWorkOrderItemDto } from './dto/add-work-order-item.dto';
import type { CreateWorkOrderDto } from './dto/create-work-order.dto';
import type { QueryWorkOrderDto } from './dto/query-work-order.dto';
import type { UpdateWorkOrderDto } from './dto/update-work-order.dto';

@Injectable()
export class WorkOrderService {
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
