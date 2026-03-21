import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PriceService } from './price.service';
import { UpdatePriceDto } from './dto/update-price.dto';
import { BulkUpdatePriceDto } from './dto/bulk-update-price.dto';

@ApiTags('Product Prices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('products')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Patch(':id/price')
  @RequirePermissions('stock:update')
  @ApiOperation({ summary: 'Update the cost and/or sale price of a product' })
  async updatePrice(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePriceDto,
  ) {
    const product = await this.priceService.updatePrice(id, userId, dto);
    return { data: product };
  }

  @Post('bulk-price')
  @RequirePermissions('stock:update')
  @ApiOperation({ summary: 'Bulk update prices for multiple products' })
  async bulkUpdatePrices(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkUpdatePriceDto,
  ) {
    const results = await this.priceService.bulkUpdatePrices(userId, dto.items);
    return { data: results };
  }

  @Get(':id/price-history')
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'Get price change history for a product' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records to return (default 50)' })
  async getPriceHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const history = await this.priceService.getPriceHistory(
      id,
      limit !== undefined ? parseInt(limit, 10) : undefined,
    );
    return { data: history };
  }

  @Get(':id/margin')
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'Get margin information for a product' })
  async getMargin(@Param('id') id: string) {
    const margin = await this.priceService.getMargin(id);
    return { data: margin };
  }
}
