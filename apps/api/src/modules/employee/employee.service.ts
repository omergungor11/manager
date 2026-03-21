import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { QueryEmployeeDto } from './dto/query-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryEmployeeDto) {
    const {
      search,
      status,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
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
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async create(tenantId: string, data: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        tcNo: data.tcNo,
        position: data.position,
        department: data.department,
        startDate: new Date(data.startDate),
        grossSalary: data.grossSalary,
        userId: data.userId,
      },
    });
  }

  async update(id: string, data: UpdateEmployeeDto) {
    await this.findById(id);

    const { startDate, ...rest } = data;

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
      },
    });
  }

  async terminate(id: string, endDate: string) {
    await this.findById(id);

    return this.prisma.employee.update({
      where: { id },
      data: {
        status: 'terminated',
        endDate: new Date(endDate),
      },
    });
  }

  async activate(id: string) {
    await this.findById(id);

    return this.prisma.employee.update({
      where: { id },
      data: {
        status: 'active',
        endDate: null,
      },
    });
  }
}
