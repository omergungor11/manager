import { PrismaClient } from '@prisma/client';

export async function seedTenants(prisma: PrismaClient) {
  console.log('  → Seeding tenants...');

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {
      name: 'Demo Oto Servis',
      status: 'active',
      plan: 'pro',
    },
    create: {
      name: 'Demo Oto Servis',
      slug: 'demo',
      status: 'active',
      plan: 'pro',
      settings: {
        currency: 'TRY',
        timezone: 'Europe/Istanbul',
        language: 'tr',
        taxRate: 20,
      },
    },
  });

  console.log(`    ✓ Tenant created: ${demoTenant.name} (${demoTenant.id})`);

  return demoTenant;
}
