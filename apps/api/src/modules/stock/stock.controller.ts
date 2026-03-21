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
import { StockDeductionDto } from './dto/stock-deduction.dto';
import { WorkOrderDeductionDto } from './dto/work-order-deduction.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { BulkStockAdjustmentDto } from './dto/bulk-stock-adjustment.dto';

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

  // ─── Stock Deductions ──────────────────────────────────────────────────────

  @Post('deduct')
  @RequirePermissions('stock:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually deduct stock for a product and record an OUT movement',
    description: 'Deduction is non-blocking: if stock is insufficient the operation still completes but a warning is returned.',
  })
  async deductStock(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: StockDeductionDto,
  ) {
    const result = await this.stockService.deductStock(tenant.id, dto);
    return { data: result };
  }

  @Post('deduct-work-order')
  @RequirePermissions('stock:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deduct stock for multiple products consumed by a completed work order',
    description: 'All deductions run in a single transaction. Items with insufficient stock are listed in the warnings array.',
  })
  async deductForWorkOrder(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: WorkOrderDeductionDto,
  ) {
    const result = await this.stockService.deductForWorkOrder(tenant.id, dto);
    return { data: result };
  }

  @Post('check-availability')
  @RequirePermissions('stock:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check current stock levels for a list of products',
    description: 'Optionally include requested quantities per product to receive a sufficient flag.',
  })
  async checkAvailability(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { productIds: string[] },
  ) {
    const result = await this.stockService.checkStockAvailability(tenant.id, body.productIds);
    return { data: result };
  }

  // ─── Stock Counting & Adjustment ──────────────────────────────────────────

  @Get('count')
  @RequirePermissions('stock:read')
  @ApiOperation({
    summary: 'Get all products with current stock levels for physical counting',
    description: 'Returns every active product (name, SKU, unit, currentStock) ordered by name. Use this as the baseline before a physical count.',
  })
  async getStockCount(@CurrentTenant() tenant: TenantContext) {
    const products = await this.stockService.getStockCount(tenant.id);
    return { data: products };
  }

  @Post('adjust')
  @RequirePermissions('stock:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust stock for a single product after a physical count',
    description: 'Compares actualQuantity with currentStock, creates an ADJUST movement for the difference, and updates the product stock.',
  })
  async adjustStock(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: StockAdjustmentDto,
  ) {
    const result = await this.stockService.adjustStock(tenant.id, dto);
    return { data: result };
  }

  @Post('adjust/bulk')
  @RequirePermissions('stock:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk adjust stock for multiple products after a physical count',
    description: 'All adjustments run in a single transaction. Each item gets its own ADJUST movement and the product currentStock is updated.',
  })
  async bulkAdjustStock(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: BulkStockAdjustmentDto,
  ) {
    const results = await this.stockService.bulkAdjustStock(tenant.id, dto);
    return { data: results };
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
