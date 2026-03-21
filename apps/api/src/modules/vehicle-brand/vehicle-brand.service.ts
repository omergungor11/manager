import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehicleBrandService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllBrands() {
    return this.prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findModelsByBrand(brandId: string) {
    const brand = await this.prisma.vehicleBrand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Vehicle brand not found');
    }

    return this.prisma.vehicleModel.findMany({
      where: { brandId },
      orderBy: { name: 'asc' },
    });
  }

  async searchBrands(query: string) {
    return this.prisma.vehicleBrand.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
