import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCustomerDto } from './dto/create-customer.dto';
import type { UpdateCustomerDto } from './dto/update-customer.dto';
import type { QueryCustomerDto } from './dto/query-customer.dto';

export interface PaginatedCustomers {
  items: Awaited<ReturnType<CustomerService['findAll']>>['items'];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryCustomerDto) {
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
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              { taxId: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
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
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || customer.deletedAt !== null) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(tenantId: string, userId: string, data: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        tenantId,
        createdBy: userId,
        updatedBy: userId,
        type: data.type ?? 'individual',
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxId: data.taxId,
        notes: data.notes,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateCustomerDto) {
    await this.findById(id);

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
