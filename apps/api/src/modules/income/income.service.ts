import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryIncomeDto, IncomeCategory } from './dto/query-income.dto';

@Injectable()
export class IncomeService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Internal — called by PaymentService only (no manual entry allowed)
  // ------------------------------------------------------------------

  async createFromPayment(
    tenantId: string,
    paymentId: string,
    invoiceId: string,
    amount: number,
    category: IncomeCategory,
  ) {
    return this.prisma.income.create({
      data: {
        tenantId,
        category,
        amount,
        description: `Payment ${paymentId} for invoice ${invoiceId}`,
        invoiceId,
        paymentId,
        date: new Date(),
      },
    });
  }

  // ------------------------------------------------------------------
  // Query
  // ------------------------------------------------------------------

  async findAll(tenantId: string, query: QueryIncomeDto) {
    const { category, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const where = {
      tenantId,
      ...(category ? { category } : {}),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.income.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          category: true,
          amount: true,
          description: true,
          invoiceId: true,
          paymentId: true,
          accountId: true,
          date: true,
          createdAt: true,
        },
      }),
      this.prisma.income.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMonthlySummary(tenantId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // exclusive upper bound

    const rows = await this.prisma.income.groupBy({
      by: ['category'],
      where: {
        tenantId,
        date: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const total = rows.reduce(
      (acc, row) => acc + Number(row._sum.amount ?? 0),
      0,
    );

    const byCategory = rows.map((row) => ({
      category: row.category,
      total: Number(row._sum.amount ?? 0),
      count: row._count.id,
    }));

    return {
      year,
      month,
      total,
      byCategory,
    };
  }
}
