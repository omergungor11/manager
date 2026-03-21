import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import type { UpdateCashRegisterDto } from './dto/update-cash-register.dto';
import type { CreateRegisterTransactionDto } from './dto/create-register-transaction.dto';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async findRegisterOrFail(id: string, tenantId?: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
    });

    if (!register) {
      throw new NotFoundException('Cash register not found');
    }

    if (tenantId && register.tenantId !== tenantId) {
      throw new NotFoundException('Cash register not found');
    }

    return register;
  }

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  async findAll(tenantId: string) {
    return this.prisma.cashRegister.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        tenantId: true,
        name: true,
        type: true,
        balance: true,
        accountNo: true,
        bankName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            referenceType: true,
            referenceId: true,
            balanceAfter: true,
            date: true,
            createdAt: true,
          },
        },
      },
    });

    if (!register) {
      throw new NotFoundException('Cash register not found');
    }

    return register;
  }

  async create(tenantId: string, data: CreateCashRegisterDto) {
    return this.prisma.cashRegister.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        accountNo: data.accountNo ?? null,
        bankName: data.bankName ?? null,
      },
    });
  }

  async update(id: string, data: UpdateCashRegisterDto) {
    await this.findRegisterOrFail(id);

    return this.prisma.cashRegister.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.accountNo !== undefined ? { accountNo: data.accountNo } : {}),
        ...(data.bankName !== undefined ? { bankName: data.bankName } : {}),
      },
    });
  }

  // ------------------------------------------------------------------
  // Transactions
  // ------------------------------------------------------------------

  async createTransaction(tenantId: string, data: CreateRegisterTransactionDto) {
    const register = await this.findRegisterOrFail(data.cashRegisterId, tenantId);

    if (data.type === 'TRANSFER') {
      if (!data.targetRegisterId) {
        throw new BadRequestException(
          'targetRegisterId is required for TRANSFER transactions',
        );
      }

      if (data.targetRegisterId === data.cashRegisterId) {
        throw new BadRequestException(
          'Source and target registers must be different for a TRANSFER',
        );
      }

      const target = await this.findRegisterOrFail(data.targetRegisterId, tenantId);

      const sourceBalanceAfter = Number(register.balance) - data.amount;
      const targetBalanceAfter = Number(target.balance) + data.amount;

      return this.prisma.$transaction(async (tx) => {
        // Debit the source register
        const sourceTx = await tx.cashRegisterTransaction.create({
          data: {
            tenantId,
            cashRegisterId: register.id,
            type: 'out',
            amount: data.amount,
            description: data.description,
            referenceType: data.referenceType ?? 'transfer',
            referenceId: data.referenceId ?? data.targetRegisterId,
            balanceAfter: sourceBalanceAfter,
            date: new Date(),
          },
        });

        await tx.cashRegister.update({
          where: { id: register.id },
          data: { balance: sourceBalanceAfter },
        });

        // Credit the target register
        await tx.cashRegisterTransaction.create({
          data: {
            tenantId,
            cashRegisterId: target.id,
            type: 'in',
            amount: data.amount,
            description: data.description,
            referenceType: data.referenceType ?? 'transfer',
            referenceId: data.referenceId ?? sourceTx.id,
            balanceAfter: targetBalanceAfter,
            date: new Date(),
          },
        });

        await tx.cashRegister.update({
          where: { id: target.id },
          data: { balance: targetBalanceAfter },
        });

        return sourceTx;
      });
    }

    // Standard IN / OUT
    const balanceDelta = data.type === 'IN' ? data.amount : -data.amount;
    const balanceAfter = Number(register.balance) + balanceDelta;

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.cashRegisterTransaction.create({
        data: {
          tenantId,
          cashRegisterId: register.id,
          type: data.type.toLowerCase(),
          amount: data.amount,
          description: data.description,
          referenceType: data.referenceType ?? null,
          referenceId: data.referenceId ?? null,
          balanceAfter,
          date: new Date(),
        },
      });

      await tx.cashRegister.update({
        where: { id: register.id },
        data: { balance: balanceAfter },
      });

      return transaction;
    });
  }

  async getTransactions(registerId: string, page: number, limit: number) {
    await this.findRegisterOrFail(registerId);

    const [items, total] = await Promise.all([
      this.prisma.cashRegisterTransaction.findMany({
        where: { cashRegisterId: registerId },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          cashRegisterId: true,
          type: true,
          amount: true,
          description: true,
          referenceType: true,
          referenceId: true,
          balanceAfter: true,
          date: true,
          createdAt: true,
        },
      }),
      this.prisma.cashRegisterTransaction.count({
        where: { cashRegisterId: registerId },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDailyReport(tenantId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const registers = await this.prisma.cashRegister.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        transactions: {
          where: {
            date: { gte: dayStart, lte: dayEnd },
          },
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    const summary = registers.map((register) => {
      const totalIn = register.transactions
        .filter((t) => t.type === 'in')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const totalOut = register.transactions
        .filter((t) => t.type === 'out')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const transferIn = register.transactions
        .filter((t) => t.type === 'transfer_in')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      const transferOut = register.transactions
        .filter((t) => t.type === 'transfer_out')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      return {
        registerId: register.id,
        name: register.name,
        type: register.type,
        currentBalance: Number(register.balance),
        day: {
          totalIn,
          totalOut,
          transferIn,
          transferOut,
          net: totalIn - totalOut,
          transactionCount: register.transactions.length,
        },
      };
    });

    return {
      date: dayStart,
      registers: summary,
    };
  }
}
