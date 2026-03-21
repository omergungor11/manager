import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LookupService {
  constructor(private readonly prisma: PrismaService) {}

  async lookupByPlate(tenantId: string, plate: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        tenantId_licensePlate: { tenantId, licensePlate: plate },
      },
    });

    if (!vehicle || vehicle.deletedAt !== null) {
      throw new NotFoundException(
        `No vehicle found with plate "${plate}"`,
      );
    }

    const [ownerLink, lastServices] = await Promise.all([
      this.prisma.customerVehicle.findFirst({
        where: { vehicleId: vehicle.id, until: null },
        include: { customer: true },
        orderBy: { isPrimary: 'desc' },
      }),
      this.prisma.workOrder.findMany({
        where: { vehicleId: vehicle.id, tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
    ]);

    return {
      vehicle,
      customer: ownerLink?.customer ?? null,
      lastServices,
    };
  }

  async searchByPlate(tenantId: string, partialPlate: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        tenantId,
        deletedAt: null,
        licensePlate: { contains: partialPlate, mode: 'insensitive' },
      },
      take: 10,
      orderBy: { licensePlate: 'asc' },
    });

    const results = await Promise.all(
      vehicles.map(async (vehicle) => {
        const ownerLink = await this.prisma.customerVehicle.findFirst({
          where: { vehicleId: vehicle.id, until: null },
          include: { customer: true },
          orderBy: { isPrimary: 'desc' },
        });

        return {
          vehicle,
          customer: ownerLink?.customer ?? null,
        };
      }),
    );

    return results;
  }
}
