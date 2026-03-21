import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import type { BulkStockEntryDto } from './dto/bulk-stock-entry.dto';
import type { QueryStockDto } from './dto/query-stock.dto';
import type { StockDeductionDto } from './dto/stock-deduction.dto';
import type { WorkOrderDeductionDto } from './dto/work-order-deduction.dto';
import type { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import type { BulkStockAdjustmentDto } from './dto/bulk-stock-adjustment.dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a single stock entry, records an IN movement, and increments
   * the product's currentStock — all within a single transaction.
   */
  async createEntry(tenantId: string, data: CreateStockEntryDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${data.productId}" not found`);
    }

    const entryDate = data.date ? new Date(data.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.stockEntry.create({
        data: {
          tenantId,
          productId: data.productId,
          quantity: data.quantity,
          unitCost: data.unitCost,
          supplierId: data.supplierId ?? null,
          invoiceNo: data.invoiceNo ?? null,
          date: entryDate,
          notes: data.notes ?? null,
        },
        include: { product: true },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          type: 'IN',
          quantity: data.quantity,
          referenceType: 'stock_entry',
          referenceId: entry.id,
          reason: data.notes ?? null,
          date: entryDate,
        },
      });

      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: { increment: data.quantity } },
      });

      return entry;
    });
  }

  /**
   * Creates multiple stock entries in a single transaction.
   * Each entry gets its own StockMovement (type IN) and increments
   * the corresponding product's currentStock.
   */
  async bulkCreateEntries(tenantId: string, data: BulkStockEntryDto) {
    const productIds = [...new Set(data.entries.map((e) => e.productId))];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, deletedAt: null },
      select: { id: true },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const missing = productIds.find((id) => !foundIds.has(id));

    if (missing) {
      throw new NotFoundException(`Product with id "${missing}" not found`);
    }

    const sharedDate = data.date ? new Date(data.date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const entries: Awaited<ReturnType<typeof tx.stockEntry.create>>[] = [];

      for (const item of data.entries) {
        const entryDate = sharedDate;

        const entry = await tx.stockEntry.create({
          data: {
            tenantId,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            supplierId: item.supplierId ?? null,
            invoiceNo: item.invoiceNo ?? null,
            date: entryDate,
            notes: item.notes ?? null,
          },
          include: { product: true },
        });

        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            referenceType: 'stock_entry',
            referenceId: entry.id,
            reason: item.notes ?? null,
            date: entryDate,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });

        entries.push(entry);
      }

      return entries;
    });
  }

  /**
   * Returns a paginated list of stock entries for the tenant,
   * optionally filtered by productId.
   */
  async getEntries(
    tenantId: string,
    query: Pick<QueryStockDto, 'productId' | 'page' | 'limit'>,
  ) {
    const { productId, page = 1, limit = 20 } = query;

    const where = {
      tenantId,
      ...(productId ? { productId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.stockEntry.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: true },
      }),
      this.prisma.stockEntry.count({ where }),
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
   * Returns a paginated list of stock movements for the tenant,
   * optionally filtered by productId and/or movement type.
   */
  async getMovements(
    tenantId: string,
    query: Pick<QueryStockDto, 'productId' | 'type' | 'page' | 'limit'>,
  ) {
    const { productId, type, page = 1, limit = 20 } = query;

    const where = {
      tenantId,
      ...(productId ? { productId } : {}),
      ...(type ? { type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: true },
      }),
      this.prisma.stockMovement.count({ where }),
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
   * Deducts a quantity from a single product's stock and records an OUT movement.
   * If the product does not have sufficient stock the deduction still proceeds
   * (non-blocking), but a `warning` flag is returned so the caller can surface
   * the information to the user.
   */
  async deductStock(tenantId: string, data: StockDeductionDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${data.productId}" not found`);
    }

    const deductionDate = new Date();
    const currentStock = Number(product.currentStock);
    const insufficientStock = currentStock < data.quantity;

    const movement = await this.prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          type: 'OUT',
          quantity: data.quantity,
          referenceType: 'manual',
          referenceId: null,
          reason: data.reason ?? null,
          date: deductionDate,
        },
        include: { product: true },
      });

      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: { decrement: data.quantity } },
      });

      return mov;
    });

    return {
      movement,
      warning: insufficientStock
        ? `Insufficient stock for product "${product.name}": had ${currentStock}, deducted ${data.quantity}`
        : null,
    };
  }

  /**
   * Deducts multiple products for a completed work order within a single
   * transaction. Each item gets its own OUT movement with referenceType
   * 'work_order'. Returns a summary of what was deducted and any items
   * where the stock was insufficient (non-blocking warnings).
   */
  async deductForWorkOrder(tenantId: string, data: WorkOrderDeductionDto) {
    const productIds = data.items.map((i) => i.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, deletedAt: null },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const missing = productIds.find((id) => !productMap.has(id));
    if (missing) {
      throw new NotFoundException(`Product with id "${missing}" not found`);
    }

    const deductionDate = new Date();

    const movements = await this.prisma.$transaction(async (tx) => {
      const results: Awaited<ReturnType<typeof tx.stockMovement.create>>[] = [];

      for (const item of data.items) {
        const mov = await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            referenceType: 'work_order',
            referenceId: data.workOrderId,
            reason: null,
            date: deductionDate,
          },
          include: { product: true },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        results.push(mov);
      }

      return results;
    });

    const warnings: string[] = [];
    const deducted = movements.map((mov, idx) => {
      const item = data.items[idx]!;
      const product = productMap.get(item.productId)!;
      const currentStock = Number(product.currentStock);

      if (currentStock < item.quantity) {
        warnings.push(
          `Insufficient stock for product "${product.name}": had ${currentStock}, deducted ${item.quantity}`,
        );
      }

      return mov;
    });

    return { deducted, warnings };
  }

  /**
   * Returns the current stock level for a list of products.
   * Optionally accepts a requested quantity per product so the caller can
   * determine whether there is enough stock before performing an operation.
   */
  async checkStockAvailability(
    tenantId: string,
    productIds: string[],
    requestedMap?: Map<string, number>,
  ) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, deletedAt: null },
      select: { id: true, name: true, currentStock: true },
    });

    return products.map((p) => {
      const currentStock = Number(p.currentStock);
      const requested = requestedMap?.get(p.id);

      return {
        productId: p.id,
        productName: p.name,
        currentStock,
        ...(requested !== undefined
          ? { requested, sufficient: currentStock >= requested }
          : {}),
      };
    });
  }

  // ─── Stock Counting & Adjustment ──────────────────────────────────────────

  /**
   * Compares the physical count (actualQuantity) with the system's
   * currentStock, creates an ADJUST movement for the difference, and
   * updates Product.currentStock — all in a single transaction.
   */
  async adjustStock(tenantId: string, data: StockAdjustmentDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${data.productId}" not found`);
    }

    const previousStock = Number(product.currentStock);
    const actualStock = data.actualQuantity;
    const difference = actualStock - previousStock;

    const movement = await this.prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          type: 'ADJUST',
          quantity: difference,
          referenceType: 'adjustment',
          referenceId: null,
          reason: data.reason,
          date: new Date(),
        },
        include: { product: true },
      });

      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: actualStock },
      });

      return mov;
    });

    return { productId: data.productId, previousStock, actualStock, difference, movement };
  }

  /**
   * Applies multiple stock adjustments within a single transaction.
   * Each item is compared against the current system stock, an ADJUST movement
   * is created for the difference, and Product.currentStock is updated.
   */
  async bulkAdjustStock(tenantId: string, data: BulkStockAdjustmentDto) {
    const productIds = [...new Set(data.items.map((i) => i.productId))];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, deletedAt: null },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const missing = productIds.find((id) => !productMap.has(id));
    if (missing) {
      throw new NotFoundException(`Product with id "${missing}" not found`);
    }

    const adjustmentDate = new Date();

    return this.prisma.$transaction(async (tx) => {
      const results: {
        productId: string;
        previousStock: number;
        actualStock: number;
        difference: number;
        movement: Awaited<ReturnType<typeof tx.stockMovement.create>>;
      }[] = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        const previousStock = Number(product.currentStock);
        const actualStock = item.actualQuantity;
        const difference = actualStock - previousStock;

        const movement = await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'ADJUST',
            quantity: difference,
            referenceType: 'adjustment',
            referenceId: null,
            reason: item.reason,
            date: adjustmentDate,
          },
          include: { product: true },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: actualStock },
        });

        results.push({ productId: item.productId, previousStock, actualStock, difference, movement });
      }

      return results;
    });
  }

  /**
   * Returns all active products with their current stock levels, ordered by
   * name — intended for use during a physical stock count.
   */
  async getStockCount(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        currentStock: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
