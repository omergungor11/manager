import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CurrentTenant, type TenantContext } from '../tenant/tenant.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { StockService } from './stock.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { BulkStockEntryDto } from './dto/bulk-stock-entry.dto';
import { QueryStockDto } from './dto/query-stock.dto';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // ─── Stock Entries ─────────────────────────────────────────────────────────

  @Post('entries')
  @RequirePermissions('stock:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a stock entry and record an IN movement' })
  async createEntry(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateStockEntryDto,
  ) {
    const entry = await this.stockService.createEntry(tenant.id, dto);
    return { data: entry };
  }

  @Post('entries/bulk')
  @RequirePermissions('stock:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk create stock entries for multiple products in a single transaction',
  })
  async bulkCreateEntries(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: BulkStockEntryDto,
  ) {
    const entries = await this.stockService.bulkCreateEntries(tenant.id, dto);
    return { data: entries };
  }

  @Get('entries')
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'List stock entries with pagination' })
  @ApiQuery({ name: 'productId', required: false, description: 'Filter by product ID', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20)' })
  async getEntries(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryStockDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.stockService.getEntries(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  // ─── Stock Movements ───────────────────────────────────────────────────────

  @Get('movements')
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'List stock movements with pagination' })
  @ApiQuery({ name: 'productId', required: false, description: 'Filter by product ID', format: 'uuid' })
  @ApiQuery({ name: 'type', required: false, enum: ['IN', 'OUT', 'ADJUST'], description: 'Filter by movement type' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20)' })
  async getMovements(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryStockDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.stockService.getMovements(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }
}
