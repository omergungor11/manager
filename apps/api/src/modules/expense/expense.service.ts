import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';
import type { QueryExpenseDto } from './dto/query-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  async findAll(tenantId: string, query: QueryExpenseDto) {
    const {
      category,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

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
      this.prisma.expense.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          category: true,
          amount: true,
          description: true,
          supplierId: true,
          accountId: true,
          receiptUrl: true,
          date: true,
          createdAt: true,
          account: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        account: {
          select: { id: true, code: true, name: true, type: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async create(tenantId: string, data: CreateExpenseDto) {
    const expenseDate = data.date ?? new Date();

    // When an accountId is supplied, create the AccountTransaction inside a
    // Prisma interactive transaction so both writes succeed or fail together.
    if (data.accountId) {
      const accountId: string = data.accountId;
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        select: { id: true, balance: true, deletedAt: true, tenantId: true },
      });

      if (!account || account.deletedAt !== null || account.tenantId !== tenantId) {
        throw new NotFoundException('Account not found');
      }

      const currentBalance = Number(account.balance);
      // A business expense increases what is owed to the supplier, so we
      // record a DEBIT on their cari hesap (balance increases for them).
      const balanceAfter = currentBalance + data.amount;

      return this.prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            tenantId,
            category: data.category,
            amount: data.amount,
            description: data.description,
            supplierId: data.supplierId ?? null,
            accountId,
            date: expenseDate,
          },
        });

        await tx.accountTransaction.create({
          data: {
            tenantId,
            accountId,
            type: 'DEBIT',
            amount: data.amount,
            description: data.description,
            referenceType: 'expense',
            referenceId: expense.id,
            balanceAfter,
            date: expenseDate,
          },
        });

        await tx.account.update({
          where: { id: accountId },
          data: { balance: balanceAfter },
        });

        return expense;
      });
    }

    // No account link — simple insert.
    return this.prisma.expense.create({
      data: {
        tenantId,
        category: data.category,
        amount: data.amount,
        description: data.description,
        supplierId: data.supplierId ?? null,
        accountId: null,
        date: expenseDate,
      },
    });
  }

  async update(id: string, data: UpdateExpenseDto) {
    await this.findById(id);

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.supplierId !== undefined ? { supplierId: data.supplierId } : {}),
        ...(data.accountId !== undefined ? { accountId: data.accountId } : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
        ...(data.notes !== undefined ? { receiptUrl: data.notes } : {}),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.expense.delete({ where: { id } });
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------

  async getMonthlySummary(tenantId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // exclusive upper bound

    const rows = await this.prisma.expense.groupBy({
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
