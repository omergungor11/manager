import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  manager: [
    'customer:create', 'customer:read', 'customer:update', 'customer:delete',
    'vehicle:create', 'vehicle:read', 'vehicle:update', 'vehicle:delete',
    'work_order:create', 'work_order:read', 'work_order:update', 'work_order:delete',
    'invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete',
    'payment:create', 'payment:read', 'payment:update', 'payment:delete',
    'stock:create', 'stock:read', 'stock:update', 'stock:delete',
    'employee:create', 'employee:read', 'employee:update', 'employee:delete',
    'payroll:create', 'payroll:read', 'payroll:update', 'payroll:delete',
    'account:create', 'account:read', 'account:update', 'account:delete',
    'report:read',
  ],
  technician: [
    'work_order:read', 'work_order:update',
    'customer:read', 'vehicle:read', 'stock:read',
  ],
  cashier: [
    'invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete',
    'payment:create', 'payment:read', 'payment:update', 'payment:delete',
    'customer:read', 'vehicle:read', 'work_order:read',
    'account:read', 'report:read',
  ],
};

export async function seedDemoTenantData(prisma: PrismaClient) {
  console.log('  → Seeding demo tenant data...');

  // Find demo tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
  });

  if (!tenant) {
    throw new Error('Demo tenant not found — run seedTenants first');
  }

  // Create default roles
  const roles: Record<string, string> = {};

  for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: { tenantId: tenant.id, name: roleName },
      },
      update: { permissions },
      create: {
        tenantId: tenant.id,
        name: roleName,
        permissions,
        isDefault: true,
      },
    });
    roles[roleName] = role.id;
    console.log(`    ✓ Role: ${roleName}`);
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'admin@demo.manager.app' },
    },
    update: {
      name: 'Admin',
      roleId: roles['admin'],
      status: 'active',
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.manager.app',
      password: hashedPassword,
      name: 'Admin',
      roleId: roles['admin'],
      status: 'active',
    },
  });

  console.log('    ✓ Admin user: admin@demo.manager.app / Admin123!');
}
