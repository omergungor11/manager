import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { PrismaService } from '../prisma/prisma.service';

const DEFAULT_DEV_SCHEMA = 'tenant';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const slug = this.extractSlug(req);

    if (!slug || slug === 'localhost') {
      req.tenant = {
        id: 'dev',
        slug: 'dev',
        name: 'Development',
        schema: DEFAULT_DEV_SCHEMA,
      };
      await this.prisma.$executeRawUnsafe(`SET search_path TO "${DEFAULT_DEV_SCHEMA}", "public"`);
      return next();
    }

    const tenant = await this.prisma.$queryRawUnsafe<{ id: string; slug: string; name: string }[]>(
      `SELECT id, slug, name, status FROM public.tenants WHERE slug = $1 LIMIT 1`,
      slug,
    );

    if (!tenant.length) {
      throw new NotFoundException(`Tenant "${slug}" not found`);
    }

    const record = tenant[0] as { id: string; slug: string; name: string; status: string };

    if (record.status !== 'active') {
      throw new ForbiddenException(`Tenant "${slug}" is not active`);
    }

    const schema = `tenant_${record.slug}`;

    req.tenant = {
      id: record.id,
      slug: record.slug,
      name: record.name,
      schema,
    };

    await this.prisma.$executeRawUnsafe(`SET search_path TO "${schema}", "public"`);

    next();
  }

  private extractSlug(req: Request): string | undefined {
    const headerSlug = req.headers['x-tenant-slug'] as string | undefined;
    if (headerSlug) {
      return headerSlug;
    }

    const host = req.headers['host'];
    if (host) {
      const parts = host.split('.');
      if (parts.length > 2) {
        return parts[0];
      }
      if (parts.length <= 2) {
        const hostname = parts[0].split(':')[0];
        if (hostname === 'localhost') {
          return 'localhost';
        }
      }
    }

    return undefined;
  }
}
