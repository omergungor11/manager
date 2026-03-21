import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import type { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import type { CreateServiceDefinitionDto } from './dto/create-service-definition.dto';
import type { UpdateServiceDefinitionDto } from './dto/update-service-definition.dto';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Categories ---

  async findAllCategories(tenantId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
      include: { services: true },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: { services: true },
    });

    if (!category) {
      throw new NotFoundException(`Service category with id "${id}" not found`);
    }

    return category;
  }

  async createCategory(tenantId: string, data: CreateServiceCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(id: string, data: UpdateServiceCategoryDto) {
    await this.findCategoryById(id);

    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { services: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Service category with id "${id}" not found`);
    }

    if (category._count.services > 0) {
      throw new BadRequestException(
        'Cannot delete category with attached service definitions. Remove or reassign services first.',
      );
    }

    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  // --- Service Definitions ---

  async findAllServices(tenantId: string, categoryId?: string) {
    return this.prisma.serviceDefinition.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { name: 'asc' },
      include: { category: true },
    });
  }

  async findServiceById(id: string) {
    const service = await this.prisma.serviceDefinition.findUnique({
      where: { id },
      include: {
        category: true,
        products: {
          include: { product: true },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service definition with id "${id}" not found`);
    }

    return service;
  }

  async createService(tenantId: string, data: CreateServiceDefinitionDto) {
    // Verify category belongs to the same tenant
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || category.tenantId !== tenantId) {
      throw new NotFoundException(`Service category with id "${data.categoryId}" not found`);
    }

    return this.prisma.serviceDefinition.create({
      data: {
        tenantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        defaultPrice: data.defaultPrice,
        estimatedDuration: data.estimatedDuration,
        isActive: data.isActive ?? true,
      },
      include: { category: true },
    });
  }

  async updateService(id: string, data: UpdateServiceDefinitionDto) {
    await this.findServiceById(id);

    return this.prisma.serviceDefinition.update({
      where: { id },
      data: {
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.defaultPrice !== undefined && { defaultPrice: data.defaultPrice }),
        ...(data.estimatedDuration !== undefined && { estimatedDuration: data.estimatedDuration }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { category: true },
    });
  }

  async deleteService(id: string) {
    await this.findServiceById(id);

    return this.prisma.serviceDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
