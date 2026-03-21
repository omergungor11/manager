import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAccountDto } from './dto/create-account.dto';
import type { UpdateAccountDto } from './dto/update-account.dto';
import type { QueryAccountDto } from './dto/query-account.dto';
import type { CreateTransactionDto } from './dto/create-transaction.dto';

// Account type values stored in the DB are uppercase to match the schema comment
const TYPE_MAP: Record<'customer' | 'supplier' | 'other', string> = {
  customer: 'CUSTOMER',
  supplier: 'SUPPLIER',
  other: 'OTHER',
};

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async generateCode(tenantId: string): Promise<string> {
    const count = await this.prisma.account.count({ where: { tenantId } });
    return `ACC-${String(count + 1).padStart(5, '0')}`;
  }

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  async findAll(tenantId: string, query: QueryAccountDto) {
    const {
      search,
      type,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where = {
      tenantId,
      deletedAt: null,
      ...(type ? { type: TYPE_MAP[type] } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { taxId: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          balance: true,
          creditLimit: true,
          phone: true,
          email: true,
          address: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.account.count({ where }),
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
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        customers: {
          include: {
            customer: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    if (!account || account.deletedAt !== null) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async create(tenantId: string, data: CreateAccountDto) {
    const code = await this.generateCode(tenantId);

    return this.prisma.account.create({
      data: {
        tenantId,
        code,
        name: data.name,
        type: TYPE_MAP[data.type],
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
      },
    });
  }

  async update(id: string, data: UpdateAccountDto) {
    await this.findById(id);

    const updateData: Record<string, unknown> = { ...data };

    // Map the type enum value to its DB representation when provided
    if (data.type !== undefined) {
      updateData['type'] = TYPE_MAP[data.type];
    }

    return this.prisma.account.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string) {
    const account = await this.findById(id);

    // Only allow deletion when balance is exactly 0
    if (Number(account.balance) !== 0) {
      throw new BadRequestException(
        'Cannot delete an account with a non-zero balance',
      );
    }

    return this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ------------------------------------------------------------------
  // Balance
  // ------------------------------------------------------------------

  async getBalance(accountId: string): Promise<{ balance: number }> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { balance: true, deletedAt: true },
    });

    if (!account || account.deletedAt !== null) {
      throw new NotFoundException('Account not found');
    }

    return { balance: Number(account.balance) };
  }

  // ------------------------------------------------------------------
  // Transactions
  // ------------------------------------------------------------------

  async createTransaction(tenantId: string, data: CreateTransactionDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
      select: { id: true, balance: true, deletedAt: true, tenantId: true },
    });

    if (!account || account.deletedAt !== null || account.tenantId !== tenantId) {
      throw new NotFoundException('Account not found');
    }

    const currentBalance = Number(account.balance);
    const delta =
      data.type === 'DEBIT' ? data.amount : -data.amount;
    const balanceAfter = currentBalance + delta;

    const [transaction] = await this.prisma.$transaction([
      this.prisma.accountTransaction.create({
        data: {
          tenantId,
          accountId: data.accountId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          referenceType: data.referenceType ?? null,
          referenceId: data.referenceId ?? null,
          balanceAfter,
          date: data.date ?? new Date(),
        },
      }),
      this.prisma.account.update({
        where: { id: data.accountId },
        data: { balance: balanceAfter },
      }),
    ]);

    return transaction;
  }

  async getTransactions(accountId: string, page: number, limit: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, deletedAt: true },
    });

    if (!account || account.deletedAt !== null) {
      throw new NotFoundException('Account not found');
    }

    const where = { accountId };

    const [items, total] = await Promise.all([
      this.prisma.accountTransaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.accountTransaction.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ------------------------------------------------------------------
  // Customer link
  // ------------------------------------------------------------------

  async linkCustomer(
    accountId: string,
    customerId: string,
    isDefault: boolean,
  ) {
    // Validate account exists
    await this.findById(accountId);

    // When isDefault is true, clear the existing default for this customer
    if (isDefault) {
      await this.prisma.customerAccount.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.customerAccount.upsert({
      where: {
        customerId_accountId: { customerId, accountId },
      },
      update: { isDefault },
      create: { customerId, accountId, isDefault },
    });
  }
}
