import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollParamsService {
  constructor(private readonly prisma: PrismaService) {}

  // List all params for a tenant (latest effectiveFrom first)
  async findAll(tenantId: string) {
    return this.prisma.payrollParams.findMany({
      where: { tenantId },
      orderBy: [{ name: 'asc' }, { effectiveFrom: 'desc' }],
    });
  }

  // Create or update (upsert by tenantId + name + effectiveFrom)
  async upsertParam(
    tenantId: string,
    name: string,
    value: number,
    effectiveFrom: Date = new Date(),
  ) {
    return this.prisma.payrollParams.upsert({
      where: {
        // Prisma requires a unique compound or single field — PayrollParams has
        // no compound unique on (tenantId, name, effectiveFrom) in the schema,
        // so we fall back to create-or-update by id. We try to find an existing
        // record first and update it; otherwise create.
        id: await this.resolveId(tenantId, name, effectiveFrom),
      },
      update: {
        value: String(value),
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        name,
        value: String(value),
        effectiveFrom,
      },
    });
  }

  // Get the params that are effective at a given date (defaults to now)
  async getEffectiveParams(tenantId: string, date: Date = new Date()) {
    const rows = await this.prisma.payrollParams.findMany({
      where: {
        tenantId,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Deduplicate — keep latest effectiveFrom per param name
    const seen = new Set<string>();
    return rows.filter((row) => {
      if (seen.has(row.name)) return false;
      seen.add(row.name);
      return true;
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private async resolveId(
    tenantId: string,
    name: string,
    effectiveFrom: Date,
  ): Promise<string> {
    // Find existing param with same tenant + name + effectiveFrom day
    const existing = await this.prisma.payrollParams.findFirst({
      where: {
        tenantId,
        name,
        effectiveFrom: {
          gte: new Date(effectiveFrom.toDateString()),
          lt: new Date(
            new Date(effectiveFrom.toDateString()).getTime() + 86_400_000,
          ),
        },
      },
    });
    // Return existing id to trigger update, or a dummy that triggers create
    return existing?.id ?? 'new-record-will-be-created';
  }
}
