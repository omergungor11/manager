import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto';
import type { QueryVehicleDto } from './dto/query-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryVehicleDto) {
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'licensePlate',
      sortOrder = 'asc',
    } = query;

    const where = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              {
                licensePlate: { contains: search, mode: 'insensitive' as const },
              },
              { brandName: { contains: search, mode: 'insensitive' as const } },
              { modelName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        customers: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!vehicle || vehicle.deletedAt !== null) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async findByPlate(tenantId: string, licensePlate: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { tenantId_licensePlate: { tenantId, licensePlate } },
    });

    if (!vehicle || vehicle.deletedAt !== null) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async create(tenantId: string, data: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: {
        tenantId_licensePlate: { tenantId, licensePlate: data.licensePlate },
      },
    });

    if (existing && existing.deletedAt === null) {
      throw new ConflictException(
        `A vehicle with license plate "${data.licensePlate}" already exists`,
      );
    }

    return this.prisma.vehicle.create({
      data: {
        tenantId,
        licensePlate: data.licensePlate,
        brandId: data.brandId ?? null,
        modelId: data.modelId ?? null,
        brandName: data.brandName ?? null,
        modelName: data.modelName ?? null,
        year: data.year ?? null,
        color: data.color ?? null,
        vin: data.vin ?? null,
        currentKm: data.currentKm ?? 0,
        notes: data.notes ?? null,
      },
    });
  }

  async update(id: string, data: UpdateVehicleDto) {
    await this.findById(id);

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.licensePlate !== undefined && {
          licensePlate: data.licensePlate,
        }),
        ...(data.brandId !== undefined && { brandId: data.brandId }),
        ...(data.modelId !== undefined && { modelId: data.modelId }),
        ...(data.brandName !== undefined && { brandName: data.brandName }),
        ...(data.modelName !== undefined && { modelName: data.modelName }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.vin !== undefined && { vin: data.vin }),
        ...(data.currentKm !== undefined && { currentKm: data.currentKm }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
