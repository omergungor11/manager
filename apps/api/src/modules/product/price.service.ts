import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdatePriceDto } from './dto/update-price.dto';
import type { BulkPriceItemDto } from './dto/bulk-update-price.dto';

@Injectable()
export class PriceService {
  constructor(private readonly prisma: PrismaService) {}

  async updatePrice(productId: string, userId: string, data: UpdatePriceDto) {
    if (data.costPrice === undefined && data.salePrice === undefined) {
      throw new BadRequestException('At least one of costPrice or salePrice must be provided');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.deletedAt !== null) {
      throw new NotFoundException('Product not found');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: productId },
        data: {
          ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
          ...(data.salePrice !== undefined ? { salePrice: data.salePrice } : {}),
        },
        include: { category: true },
      }),
      this.prisma.priceHistory.create({
        data: {
          productId,
          costPrice: data.costPrice ?? product.costPrice,
          salePrice: data.salePrice ?? product.salePrice,
          changedBy: userId,
        },
      }),
    ]);

    return updated;
  }

  async bulkUpdatePrices(userId: string, items: BulkPriceItemDto[]) {
    const results: Array<{ productId: string; success: boolean; error?: string }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.costPrice === undefined && item.salePrice === undefined) {
          results.push({
            productId: item.productId,
            success: false,
            error: 'At least one of costPrice or salePrice must be provided',
          });
          continue;
        }

        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product || product.deletedAt !== null) {
          results.push({
            productId: item.productId,
            success: false,
            error: 'Product not found',
          });
          continue;
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            ...(item.costPrice !== undefined ? { costPrice: item.costPrice } : {}),
            ...(item.salePrice !== undefined ? { salePrice: item.salePrice } : {}),
          },
        });

        await tx.priceHistory.create({
          data: {
            productId: item.productId,
            costPrice: item.costPrice ?? product.costPrice,
            salePrice: item.salePrice ?? product.salePrice,
            changedBy: userId,
          },
        });

        results.push({ productId: item.productId, success: true });
      }
    });

    return results;
  }

  async getPriceHistory(productId: string, limit = 50) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.deletedAt !== null) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { changedAt: 'desc' },
      take: limit,
    });
  }

  async getMargin(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.deletedAt !== null) {
      throw new NotFoundException('Product not found');
    }

    const costPrice = Number(product.costPrice);
    const salePrice = Number(product.salePrice);
    const marginAmount = salePrice - costPrice;
    const marginPercent = salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : 0;

    return {
      costPrice,
      salePrice,
      marginAmount: Math.round(marginAmount * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
    };
  }
}
