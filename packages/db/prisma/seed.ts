import { PrismaClient } from '@prisma/client';
import { seedTenants } from './seeds/tenants';
import { seedVehicleBrands } from './seeds/vehicle-brands';
import { seedDemoTenantData } from './seeds/demo-tenant';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed tenants (public schema)
  await seedTenants(prisma);

  // 2. Seed vehicle brands & models (public schema)
  await seedVehicleBrands(prisma);

  // 3. Seed demo tenant data (tenant schema - users, roles)
  await seedDemoTenantData(prisma);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
