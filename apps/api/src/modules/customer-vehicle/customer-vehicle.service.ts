import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AssignVehicleDto } from './dto/assign-vehicle.dto';
import type { TransferVehicleDto } from './dto/transfer-vehicle.dto';

@Injectable()
export class CustomerVehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerVehicles(customerId: string) {
    return this.prisma.customerVehicle.findMany({
      where: {
        customerId,
        until: null,
      },
      include: {
        vehicle: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { since: 'asc' }],
    });
  }

  async getVehicleOwners(vehicleId: string) {
    return this.prisma.customerVehicle.findMany({
      where: { vehicleId },
      include: {
        customer: true,
      },
      orderBy: { since: 'desc' },
    });
  }

  async assignVehicle(customerId: string, data: AssignVehicleDto) {
    const existing = await this.prisma.customerVehicle.findUnique({
      where: {
        customerId_vehicleId: {
          customerId,
          vehicleId: data.vehicleId,
        },
      },
    });

    if (existing && existing.until === null) {
      throw new ConflictException(
        'Vehicle is already assigned to this customer',
      );
    }

    if (data.isPrimary) {
      await this.prisma.customerVehicle.updateMany({
        where: { customerId, isPrimary: true, until: null },
        data: { isPrimary: false },
      });
    }

    if (existing) {
      return this.prisma.customerVehicle.update({
        where: {
          customerId_vehicleId: {
            customerId,
            vehicleId: data.vehicleId,
          },
        },
        data: {
          isPrimary: data.isPrimary ?? false,
          since: new Date(),
          until: null,
        },
        include: { vehicle: true },
      });
    }

    return this.prisma.customerVehicle.create({
      data: {
        customerId,
        vehicleId: data.vehicleId,
        isPrimary: data.isPrimary ?? false,
      },
      include: { vehicle: true },
    });
  }

  async unassignVehicle(customerId: string, vehicleId: string) {
    const link = await this.prisma.customerVehicle.findUnique({
      where: {
        customerId_vehicleId: { customerId, vehicleId },
      },
    });

    if (!link || link.until !== null) {
      throw new NotFoundException(
        'Active vehicle assignment not found for this customer',
      );
    }

    return this.prisma.customerVehicle.update({
      where: {
        customerId_vehicleId: { customerId, vehicleId },
      },
      data: { until: new Date() },
      include: { vehicle: true },
    });
  }

  async transferVehicle(data: TransferVehicleDto) {
    const { vehicleId, newCustomerId } = data;

    const activeLink = await this.prisma.customerVehicle.findFirst({
      where: { vehicleId, until: null },
    });

    return this.prisma.$transaction(async (tx) => {
      if (activeLink) {
        await tx.customerVehicle.update({
          where: {
            customerId_vehicleId: {
              customerId: activeLink.customerId,
              vehicleId,
            },
          },
          data: { until: new Date() },
        });
      }

      const existingLink = await tx.customerVehicle.findUnique({
        where: {
          customerId_vehicleId: { customerId: newCustomerId, vehicleId },
        },
      });

      if (existingLink) {
        return tx.customerVehicle.update({
          where: {
            customerId_vehicleId: { customerId: newCustomerId, vehicleId },
          },
          data: {
            isPrimary: false,
            since: new Date(),
            until: null,
          },
          include: { vehicle: true, customer: true },
        });
      }

      return tx.customerVehicle.create({
        data: {
          customerId: newCustomerId,
          vehicleId,
          isPrimary: false,
        },
        include: { vehicle: true, customer: true },
      });
    });
  }

  async setPrimary(customerId: string, vehicleId: string) {
    const link = await this.prisma.customerVehicle.findUnique({
      where: {
        customerId_vehicleId: { customerId, vehicleId },
      },
    });

    if (!link || link.until !== null) {
      throw new NotFoundException(
        'Active vehicle assignment not found for this customer',
      );
    }

    await this.prisma.customerVehicle.updateMany({
      where: { customerId, isPrimary: true, until: null },
      data: { isPrimary: false },
    });

    return this.prisma.customerVehicle.update({
      where: {
        customerId_vehicleId: { customerId, vehicleId },
      },
      data: { isPrimary: true },
      include: { vehicle: true },
    });
  }
}
