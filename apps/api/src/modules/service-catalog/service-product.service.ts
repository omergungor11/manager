import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AddServiceProductDto } from './dto/add-service-product.dto';
import type { UpdateServiceProductDto } from './dto/update-service-product.dto';

@Injectable()
export class ServiceProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductsForService(serviceDefinitionId: string) {
    await this.assertServiceExists(serviceDefinitionId);

    return this.prisma.serviceProduct.findMany({
      where: { serviceDefinitionId },
      include: {
        product: true,
      },
      orderBy: { product: { name: 'asc' } },
    });
  }

  async addProduct(serviceDefinitionId: string, data: AddServiceProductDto) {
    await this.assertServiceExists(serviceDefinitionId);

    const existing = await this.prisma.serviceProduct.findUnique({
      where: {
        serviceDefinitionId_productId: {
          serviceDefinitionId,
          productId: data.productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Product with id "${data.productId}" is already linked to this service definition`,
      );
    }

    return this.prisma.serviceProduct.create({
      data: {
        serviceDefinitionId,
        productId: data.productId,
        defaultQuantity: data.defaultQuantity,
      },
      include: {
        product: true,
      },
    });
  }

  async updateQuantity(
    serviceDefinitionId: string,
    productId: string,
    data: UpdateServiceProductDto,
  ) {
    const link = await this.findLinkOrThrow(serviceDefinitionId, productId);

    return this.prisma.serviceProduct.update({
      where: { id: link.id },
      data: { defaultQuantity: data.defaultQuantity },
      include: {
        product: true,
      },
    });
  }

  async removeProduct(serviceDefinitionId: string, productId: string) {
    const link = await this.findLinkOrThrow(serviceDefinitionId, productId);

    return this.prisma.serviceProduct.delete({
      where: { id: link.id },
    });
  }

  async getSuggestedProducts(serviceDefinitionId: string) {
    await this.assertServiceExists(serviceDefinitionId);

    return this.prisma.serviceProduct.findMany({
      where: { serviceDefinitionId },
      include: {
        product: true,
      },
      orderBy: { product: { name: 'asc' } },
    });
  }

  // --- Private helpers ---

  private async assertServiceExists(serviceDefinitionId: string) {
    const service = await this.prisma.serviceDefinition.findUnique({
      where: { id: serviceDefinitionId },
    });

    if (!service) {
      throw new NotFoundException(
        `Service definition with id "${serviceDefinitionId}" not found`,
      );
    }
  }

  private async findLinkOrThrow(serviceDefinitionId: string, productId: string) {
    const link = await this.prisma.serviceProduct.findUnique({
      where: {
        serviceDefinitionId_productId: {
          serviceDefinitionId,
          productId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException(
        `Product with id "${productId}" is not linked to service definition "${serviceDefinitionId}"`,
      );
    }

    return link;
  }
}
