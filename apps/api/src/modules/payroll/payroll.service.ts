import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import type { CreatePayrollDto } from './dto/create-payroll.dto';
import type { BulkCreatePayrollDto } from './dto/bulk-create-payroll.dto';
import type { QueryPayrollDto } from './dto/query-payroll.dto';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: PayrollCalculationService,
  ) {}

  // ── Preview (no persistence) ────────────────────────────────────────────────

  async calculatePreview(grossSalary: number, tenantId: string) {
    const params = await this.calculator.getParams(tenantId);
    return this.calculator.calculate(grossSalary, params);
  }

  // ── Single payroll ──────────────────────────────────────────────────────────

  async createPayroll(tenantId: string, data: CreatePayrollDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const existing = await this.prisma.payroll.findUnique({
      where: {
        tenantId_employeeId_month_year: {
          tenantId,
          employeeId: data.employeeId,
          month: data.month,
          year: data.year,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Payroll already exists for this employee for ${data.month}/${data.year}`,
      );
    }

    const params = await this.calculator.getParams(tenantId);
    const result = this.calculator.calculate(
      Number(employee.grossSalary),
      params,
    );

    return this.prisma.payroll.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
        grossSalary: result.grossSalary,
        sgkEmployee: result.sgkEmployee,
        sgkEmployer: result.sgkEmployer,
        providentEmployee: result.providentEmployee,
        providentEmployer: result.providentEmployer,
        incomeTax: result.incomeTax,
        netSalary: result.netSalary,
        status: 'draft',
      },
      include: { employee: true },
    });
  }

  // ── Bulk payroll — all active employees ─────────────────────────────────────

  async bulkCreatePayroll(tenantId: string, data: BulkCreatePayrollDto) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, status: 'active' },
    });

    if (employees.length === 0) {
      return { created: 0, skipped: 0, records: [] };
    }

    const params = await this.calculator.getParams(tenantId);
    const results: Awaited<ReturnType<typeof this.prisma.payroll.create>>[] = [];
    let skipped = 0;

    for (const employee of employees) {
      const alreadyExists = await this.prisma.payroll.findUnique({
        where: {
          tenantId_employeeId_month_year: {
            tenantId,
            employeeId: employee.id,
            month: data.month,
            year: data.year,
          },
        },
      });

      if (alreadyExists) {
        skipped++;
        continue;
      }

      const calc = this.calculator.calculate(Number(employee.grossSalary), params);

      const record = await this.prisma.payroll.create({
        data: {
          tenantId,
          employeeId: employee.id,
          month: data.month,
          year: data.year,
          grossSalary: calc.grossSalary,
          sgkEmployee: calc.sgkEmployee,
          sgkEmployer: calc.sgkEmployer,
          providentEmployee: calc.providentEmployee,
          providentEmployer: calc.providentEmployer,
          incomeTax: calc.incomeTax,
          netSalary: calc.netSalary,
          status: 'draft',
        },
        include: { employee: true },
      });

      results.push(record);
    }

    return { created: results.length, skipped, records: results };
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: QueryPayrollDto) {
    const { employeeId, month, year, status, page = 1, limit = 20 } = query;

    const where = {
      tenantId,
      ...(employeeId ? { employeeId } : {}),
      ...(month !== undefined ? { month } : {}),
      ...(year !== undefined ? { year } : {}),
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payroll.findMany({
        where,
        include: { employee: { select: { id: true, name: true, position: true } } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payroll.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!payroll) {
      throw new NotFoundException('Payroll record not found');
    }

    return payroll;
  }

  // ── Status transitions ──────────────────────────────────────────────────────

  async approvePayroll(id: string) {
    const payroll = await this.findById(id);

    if (payroll.status !== 'draft') {
      throw new BadRequestException(
        `Cannot approve a payroll with status "${payroll.status}". Only draft payrolls can be approved.`,
      );
    }

    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'approved' },
      include: { employee: true },
    });
  }

  async markPaid(id: string) {
    const payroll = await this.findById(id);

    if (payroll.status !== 'approved') {
      throw new BadRequestException(
        `Cannot mark a payroll as paid with status "${payroll.status}". Only approved payrolls can be marked as paid.`,
      );
    }

    return this.prisma.payroll.update({
      where: { id },
      data: { status: 'paid' },
      include: { employee: true },
    });
  }

  // ── Monthly summary report ──────────────────────────────────────────────────

  async getMonthlyReport(tenantId: string, year: number, month: number) {
    const records = await this.prisma.payroll.findMany({
      where: { tenantId, year, month },
      include: {
        employee: { select: { id: true, name: true, position: true, department: true } },
      },
    });

    const sum = (field: keyof (typeof records)[0]) =>
      records.reduce((acc, r) => acc + Number(r[field] ?? 0), 0);

    const round = (v: number) => Math.round(v * 100) / 100;

    return {
      year,
      month,
      employeeCount: records.length,
      totals: {
        grossSalary: round(sum('grossSalary')),
        sgkEmployee: round(sum('sgkEmployee')),
        sgkEmployer: round(sum('sgkEmployer')),
        providentEmployee: round(sum('providentEmployee')),
        providentEmployer: round(sum('providentEmployer')),
        incomeTax: round(sum('incomeTax')),
        netSalary: round(sum('netSalary')),
      },
      byStatus: {
        draft: records.filter((r) => r.status === 'draft').length,
        approved: records.filter((r) => r.status === 'approved').length,
        paid: records.filter((r) => r.status === 'paid').length,
      },
      records,
    };
  }
}
