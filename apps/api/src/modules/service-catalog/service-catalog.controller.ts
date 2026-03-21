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
import { ServiceCatalogService } from './service-catalog.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { CreateServiceDefinitionDto } from './dto/create-service-definition.dto';
import { UpdateServiceDefinitionDto } from './dto/update-service-definition.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller()
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  // --- Service Categories ---

  @ApiTags('Service Categories')
  @Get('service-categories')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'List all service categories for the tenant' })
  async findAllCategories(@CurrentTenant() tenant: TenantContext) {
    const categories = await this.serviceCatalogService.findAllCategories(tenant.id);
    return { data: categories };
  }

  @ApiTags('Service Categories')
  @Get('service-categories/:id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Get a service category by ID' })
  async findCategoryById(@Param('id') id: string) {
    const category = await this.serviceCatalogService.findCategoryById(id);
    return { data: category };
  }

  @ApiTags('Service Categories')
  @Post('service-categories')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Create a new service category' })
  async createCategory(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateServiceCategoryDto,
  ) {
    const category = await this.serviceCatalogService.createCategory(tenant.id, dto);
    return { data: category };
  }

  @ApiTags('Service Categories')
  @Patch('service-categories/:id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Update a service category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    const category = await this.serviceCatalogService.updateCategory(id, dto);
    return { data: category };
  }

  @ApiTags('Service Categories')
  @Delete('service-categories/:id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Delete a service category (only if no services attached)' })
  async deleteCategory(@Param('id') id: string) {
    const category = await this.serviceCatalogService.deleteCategory(id);
    return { data: category };
  }

  // --- Service Definitions ---

  @ApiTags('Services')
  @Get('services')
  @RequirePermissions('work_order:read')
  @ApiOperation({ summary: 'List service definitions, optionally filtered by category' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by service category UUID' })
  async findAllServices(
    @CurrentTenant() tenant: TenantContext,
    @Query('categoryId') categoryId?: string,
  ) {
    const services = await this.serviceCatalogService.findAllServices(tenant.id, categoryId);
    return { data: services };
  }

  @ApiTags('Services')
  @Get('services/:id')
  @RequirePermissions('work_order:read')
  @ApiOperation({ summary: 'Get a service definition by ID (includes category and products)' })
  async findServiceById(@Param('id') id: string) {
    const service = await this.serviceCatalogService.findServiceById(id);
    return { data: service };
  }

  @ApiTags('Services')
  @Post('services')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Create a new service definition' })
  async createService(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateServiceDefinitionDto,
  ) {
    const service = await this.serviceCatalogService.createService(tenant.id, dto);
    return { data: service };
  }

  @ApiTags('Services')
  @Patch('services/:id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Update a service definition' })
  async updateService(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDefinitionDto,
  ) {
    const service = await this.serviceCatalogService.updateService(id, dto);
    return { data: service };
  }

  @ApiTags('Services')
  @Delete('services/:id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Deactivate a service definition (soft delete)' })
  async deleteService(@Param('id') id: string) {
    const service = await this.serviceCatalogService.deleteService(id);
    return { data: service };
  }
}
