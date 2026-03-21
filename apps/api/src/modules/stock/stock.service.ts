import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import type { BulkStockEntryDto } from './dto/bulk-stock-entry.dto';
import type { QueryStockDto } from './dto/query-stock.dto';

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
}
