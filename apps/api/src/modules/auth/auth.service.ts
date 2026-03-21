import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { PrismaService } from '../prisma/prisma.service';
import type { RegisterTenantDto } from './dto/register-tenant.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, tenantSlug: string) {
    await this.prisma.setTenantSchema(tenantSlug);

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(
      user.id,
      user.tenantId,
      user.email,
      user.role?.name ?? 'user',
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        status: user.status,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto, tenantId: string, tenantSlug: string) {
    await this.prisma.setTenantSchema(tenantSlug);

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const defaultRole = await this.prisma.role.findFirst({
      where: { name: 'cashier' },
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
        status: 'active',
        ...(defaultRole ? { role: { connect: { id: defaultRole.id } } } : {}),
      },
      include: { role: true },
    });

    const tokens = this.generateTokens(
      user.id,
      user.tenantId,
      user.email,
      user.role?.name ?? 'user',
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        phone: user.phone,
        status: user.status,
        role: user.role,
      },
    };
  }

  async registerTenant(dto: RegisterTenantDto) {
    await this.prisma.resetToPublic();

    const existingTenant = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM public.tenants WHERE slug = $1 LIMIT 1`,
      dto.slug,
    );

    if (existingTenant.length > 0) {
      throw new ConflictException(`Tenant with slug "${dto.slug}" already exists`);
    }

    const tenant = await this.prisma.$queryRawUnsafe<{ id: string; slug: string; name: string }[]>(
      `INSERT INTO public.tenants (name, slug, status) VALUES ($1, $2, 'active') RETURNING id, slug, name`,
      dto.tenantName,
      dto.slug,
    );

    const tenantRecord = tenant[0]!;
    const schemaName = `tenant_${dto.slug}`;

    // Create tenant schema by cloning from template "tenant" schema
    await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // Clone tables from the "tenant" template schema
    const tables = await this.prisma.$queryRawUnsafe<{ tablename: string }[]>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'tenant'`,
    );

    for (const table of tables) {
      await this.prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "${schemaName}"."${table.tablename}" (LIKE "tenant"."${table.tablename}" INCLUDING ALL)`,
      );
    }

    // Switch to the new tenant schema
    await this.prisma.setTenantSchema(dto.slug);

    // Create default roles
    const adminRole = await this.prisma.role.create({
      data: {
        tenantId: tenantRecord.id,
        name: 'admin',
        permissions: ['*'],
        isDefault: false,
      },
    });

    await this.prisma.role.createMany({
      data: [
        {
          tenantId: tenantRecord.id,
          name: 'cashier',
          permissions: ['pos:read', 'pos:write', 'sales:read', 'sales:write'],
          isDefault: true,
        },
        {
          tenantId: tenantRecord.id,
          name: 'mechanic',
          permissions: ['jobs:read', 'jobs:write', 'inventory:read'],
          isDefault: false,
        },
      ],
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash(dto.adminPassword, BCRYPT_ROUNDS);

    const adminUser = await this.prisma.user.create({
      data: {
        tenantId: tenantRecord.id,
        email: dto.adminEmail,
        password: hashedPassword,
        name: dto.adminName,
        status: 'active',
        roleId: adminRole.id,
      },
      include: { role: true },
    });

    const tokens = this.generateTokens(adminUser.id, tenantRecord.id, adminUser.email, 'admin');

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tenant: {
        id: tenantRecord.id,
        slug: tenantRecord.slug,
        name: tenantRecord.name,
      },
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user || user.status !== 'active' || user.deletedAt) {
        throw new UnauthorizedException('User is not active or does not exist');
      }

      const tokens = this.generateTokens(
        user.id,
        user.tenantId,
        user.email,
        user.role?.name ?? 'user',
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || user.status !== 'active' || user.deletedAt) {
      return null;
    }

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private generateTokens(userId: string, tenantId: string, email: string, role: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, tenantId, email, role },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    return { accessToken, refreshToken };
  }
}
