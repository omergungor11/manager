import type { PrismaClient } from '@prisma/client';

const BRANDS_AND_MODELS = [
  {
    name: 'Toyota',
    country: 'Japan',
    models: ['Corolla', 'Camry', 'Yaris', 'RAV4', 'Land Cruiser', 'Hilux', 'C-HR', 'Auris'],
  },
  {
    name: 'Honda',
    country: 'Japan',
    models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz', 'City'],
  },
  {
    name: 'Hyundai',
    country: 'South Korea',
    models: ['i10', 'i20', 'i30', 'Elantra', 'Tucson', 'Santa Fe', 'Kona', 'Accent'],
  },
  {
    name: 'Kia',
    country: 'South Korea',
    models: ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'Stonic', 'Seltos'],
  },
  {
    name: 'Volkswagen',
    country: 'Germany',
    models: ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'Jetta', 'Caddy', 'Transporter'],
  },
  {
    name: 'BMW',
    country: 'Germany',
    models: ['3 Series', '5 Series', 'X1', 'X3', 'X5', '1 Series'],
  },
  {
    name: 'Mercedes-Benz',
    country: 'Germany',
    models: ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'Vito', 'Sprinter'],
  },
  {
    name: 'Audi',
    country: 'Germany',
    models: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
  },
  {
    name: 'Ford',
    country: 'USA',
    models: ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Ranger', 'Transit', 'Puma'],
  },
  {
    name: 'Renault',
    country: 'France',
    models: ['Clio', 'Megane', 'Kadjar', 'Captur', 'Symbol', 'Fluence', 'Talisman'],
  },
  {
    name: 'Fiat',
    country: 'Italy',
    models: ['500', 'Punto', 'Egea', 'Doblo', 'Panda', 'Tipo', 'Linea'],
  },
  {
    name: 'Peugeot',
    country: 'France',
    models: ['208', '301', '308', '2008', '3008', '5008', 'Partner'],
  },
  {
    name: 'Citroen',
    country: 'France',
    models: ['C3', 'C4', 'C-Elysee', 'Berlingo', 'C5 Aircross'],
  },
  {
    name: 'Nissan',
    country: 'Japan',
    models: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Navara', 'Note'],
  },
  {
    name: 'Mitsubishi',
    country: 'Japan',
    models: ['L200', 'ASX', 'Outlander', 'Eclipse Cross', 'Colt'],
  },
  {
    name: 'Suzuki',
    country: 'Japan',
    models: ['Swift', 'Vitara', 'S-Cross', 'Jimny', 'Ignis'],
  },
  {
    name: 'Dacia',
    country: 'Romania',
    models: ['Sandero', 'Duster', 'Logan', 'Jogger'],
  },
  {
    name: 'Skoda',
    country: 'Czech Republic',
    models: ['Fabia', 'Octavia', 'Superb', 'Karoq', 'Kodiaq'],
  },
  {
    name: 'Seat',
    country: 'Spain',
    models: ['Ibiza', 'Leon', 'Arona', 'Ateca'],
  },
  {
    name: 'Opel',
    country: 'Germany',
    models: ['Corsa', 'Astra', 'Mokka', 'Crossland', 'Grandland'],
  },
];

export async function seedVehicleBrands(prisma: PrismaClient) {
  console.log('  → Seeding vehicle brands & models...');

  let brandCount = 0;
  let modelCount = 0;

  for (const brandData of BRANDS_AND_MODELS) {
    const brand = await prisma.vehicleBrand.upsert({
      where: { name: brandData.name },
      update: { country: brandData.country },
      create: {
        name: brandData.name,
        country: brandData.country,
      },
    });

    brandCount++;

    for (const modelName of brandData.models) {
      await prisma.vehicleModel.upsert({
        where: {
          brandId_name: { brandId: brand.id, name: modelName },
        },
        update: {},
        create: {
          brandId: brand.id,
          name: modelName,
        },
      });
      modelCount++;
    }
  }

  console.log(`    ✓ ${brandCount} brands, ${modelCount} models seeded`);
}
