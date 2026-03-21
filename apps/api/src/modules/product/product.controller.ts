import {
  Body,
  Controller,
  Delete,
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
import { CurrentTenant, type TenantContext } from '../tenant/tenant.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { ProductService } from './product.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

// ─── Product Categories ───────────────────────────────────────────────────────

@ApiTags('Product Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'List all product categories for the tenant' })
  async findAll(@CurrentTenant() tenant: TenantContext) {
    const categories = await this.productService.findAllCategories(tenant.id);
    return { data: categories };
  }

  @Post()
  @RequirePermissions('stock:create')
  @ApiOperation({ summary: 'Create a new product category' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateProductCategoryDto,
  ) {
    const category = await this.productService.createCategory(tenant.id, dto);
    return { data: category };
  }

  @Patch(':id')
  @RequirePermissions('stock:update')
  @ApiOperation({ summary: 'Update a product category' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    const category = await this.productService.updateCategory(id, dto);
    return { data: category };
  }

  @Delete(':id')
  @RequirePermissions('stock:delete')
  @ApiOperation({ summary: 'Delete a product category (only if no products are assigned)' })
  async delete(@Param('id') id: string) {
    const category = await this.productService.deleteCategory(id);
    return { data: category };
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'List products with pagination, search and filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or SKU' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryProductDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.productService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get('low-stock')
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'Get products whose current stock is below minimum stock threshold' })
  async getLowStock(@CurrentTenant() tenant: TenantContext) {
    const items = await this.productService.getLowStockProducts(tenant.id);
    return { data: items };
  }

  @Get(':id')
  @RequirePermissions('stock:read')
  @ApiOperation({ summary: 'Get a product by ID' })
  async findById(@Param('id') id: string) {
    const product = await this.productService.findById(id);
    return { data: product };
  }

  @Post()
  @RequirePermissions('stock:create')
  @ApiOperation({ summary: 'Create a new product' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateProductDto,
  ) {
    const product = await this.productService.create(tenant.id, dto);
    return { data: product };
  }

  @Patch(':id')
  @RequirePermissions('stock:update')
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productService.update(id, dto);
    return { data: product };
  }

  @Delete(':id')
  @RequirePermissions('stock:delete')
  @ApiOperation({ summary: 'Soft delete a product' })
  async softDelete(@Param('id') id: string) {
    const product = await this.productService.softDelete(id);
    return { data: product };
  }
}
