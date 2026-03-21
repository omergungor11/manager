import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTenantDto } from './dto/create-tenant.dto';
import type { UpdateTenantDto } from './dto/update-tenant.dto';
import type { QueryTenantDto } from './dto/query-tenant.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTenants(query: QueryTenantDto) {
    const { search, status, plan, page = 1, limit = 20 } = query;

    const where: Record<string, unknown> = {};

    if (status) {
      where['status'] = status;
    }

    if (plan) {
      where['plan'] = plan;
    }

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant bulunamadı: ${id}`);
    }

    return tenant;
  }

  async createTenant(data: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException(
        `Bu slug zaten kullanılıyor: ${data.slug}`,
      );
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        plan: data.plan ?? 'free',
        status: data.status ?? 'active',
      },
    });

    // Create tenant schema in the database
    const schemaName = `tenant_${tenant.slug}`;
    await this.prisma.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );

    return tenant;
  }

  async updateTenant(id: string, data: UpdateTenantDto) {
    await this.findTenantById(id);

    if (data.slug) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Bu slug zaten kullanılıyor: ${data.slug}`,
        );
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.plan !== undefined ? { plan: data.plan } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  async deleteTenant(id: string) {
    await this.findTenantById(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'deleted' },
    });
  }

  async getTenantStats(id: string) {
    const tenant = await this.findTenantById(id);
    const schemaName = `tenant_${tenant.slug}`;

    // Query tenant-specific tables using raw SQL since they are in a separate schema
    const [userCount, workOrderCount, invoiceCount] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<{ count: string }>>(
        `SELECT COUNT(*)::text as count FROM "${schemaName}"."users" WHERE deleted_at IS NULL`,
      ),
      this.prisma.$queryRawUnsafe<Array<{ count: string }>>(
        `SELECT COUNT(*)::text as count FROM "${schemaName}"."work_orders" WHERE deleted_at IS NULL`,
      ),
      this.prisma.$queryRawUnsafe<Array<{ count: string }>>(
        `SELECT COUNT(*)::text as count FROM "${schemaName}"."invoices" WHERE deleted_at IS NULL`,
      ),
    ]);

    return {
      tenantId: id,
      tenantName: tenant.name,
      users: Number((userCount as Array<{ count: string }>)[0]?.count ?? 0),
      workOrders: Number(
        (workOrderCount as Array<{ count: string }>)[0]?.count ?? 0,
      ),
      invoices: Number(
        (invoiceCount as Array<{ count: string }>)[0]?.count ?? 0,
      ),
    };
  }

  async getGlobalStats() {
    const [totalTenants, activeTenants] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'active' } }),
    ]);

    // Count users across all tenant schemas
    const tenants = await this.prisma.tenant.findMany({
      select: { slug: true },
      where: { status: { not: 'deleted' } },
    });

    let totalUsers = 0;

    for (const tenant of tenants) {
      try {
        const schemaName = `tenant_${tenant.slug}`;
        const result = await this.prisma.$queryRawUnsafe<
          Array<{ count: string }>
        >(
          `SELECT COUNT(*)::text as count FROM "${schemaName}"."users" WHERE deleted_at IS NULL`,
        );
        totalUsers += Number(result[0]?.count ?? 0);
      } catch {
        // Schema may not exist yet for newly created tenants
      }
    }

    return {
      totalTenants,
      activeTenants,
      totalUsers,
    };
  }
}
