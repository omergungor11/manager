import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProductCategoryDto } from './dto/create-product-category.dto';
import type { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ────────────────────────────────────────────────────────────

  async findAllCategories(tenantId: string) {
    return this.prisma.productCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(tenantId: string, data: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: {
        tenantId,
        name: data.name,
      },
    });
  }

  async updateCategory(id: string, data: UpdateProductCategoryDto) {
    const category = await this.prisma.productCategory.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: { name: data.name },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new NotFoundException('Product category not found');
    }

    if (category._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category that has products. Reassign or delete the products first.',
      );
    }

    return this.prisma.productCategory.delete({ where: { id } });
  }

  // ─── Products ──────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: QueryProductDto) {
    const {
      search,
      categoryId,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where = {
      tenantId,
      deletedAt: null,
      ...(categoryId ? { categoryId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { sku: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product || product.deletedAt !== null) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(tenantId: string, data: CreateProductDto) {
    if (data.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { tenantId_sku: { tenantId, sku: data.sku } },
      });

      if (existing) {
        throw new ConflictException(`A product with SKU "${data.sku}" already exists`);
      }
    }

    return this.prisma.product.create({
      data: {
        tenantId,
        name: data.name,
        categoryId: data.categoryId ?? null,
        sku: data.sku ?? null,
        unit: data.unit ?? 'adet',
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        minStock: data.minStock ?? 0,
        isActive: data.isActive ?? true,
      },
      include: { category: true },
    });
  }

  async update(id: string, data: UpdateProductDto) {
    const product = await this.findById(id);

    if (data.sku !== undefined && data.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({
        where: { tenantId_sku: { tenantId: product.tenantId, sku: data.sku } },
      });

      if (existing) {
        throw new ConflictException(`A product with SKU "${data.sku}" already exists`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
        ...(data.salePrice !== undefined ? { salePrice: data.salePrice } : {}),
        ...(data.minStock !== undefined ? { minStock: data.minStock } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: { category: true },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getLowStockProducts(tenantId: string) {
    // Prisma does not support field-to-field comparisons in where clauses,
    // so we use a raw query to compare currentStock < minStock.
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        tenantId: string;
        name: string;
        sku: string | null;
        unit: string;
        currentStock: string;
        minStock: string;
        isActive: boolean;
      }>
    >`
      SELECT
        id,
        tenant_id AS "tenantId",
        name,
        sku,
        unit,
        current_stock AS "currentStock",
        min_stock AS "minStock",
        is_active AS "isActive",
        category_id AS "categoryId"
      FROM products
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND is_active = true
        AND current_stock < min_stock
      ORDER BY name ASC
    `;
  }
}
