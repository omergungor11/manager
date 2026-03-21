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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @RequirePermissions('customer:read')
  @ApiOperation({ summary: 'List customers with pagination, search and filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, phone or taxId' })
  @ApiQuery({ name: 'type', required: false, enum: ['individual', 'company'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryCustomerDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.customerService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get(':id')
  @RequirePermissions('customer:read')
  @ApiOperation({ summary: 'Get a customer by ID' })
  async findById(@Param('id') id: string) {
    const customer = await this.customerService.findById(id);
    return { data: customer };
  }

  @Post()
  @RequirePermissions('customer:create')
  @ApiOperation({ summary: 'Create a new customer' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    const customer = await this.customerService.create(tenant.id, userId, dto);
    return { data: customer };
  }

  @Patch(':id')
  @RequirePermissions('customer:update')
  @ApiOperation({ summary: 'Update a customer' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.customerService.update(id, userId, dto);
    return { data: customer };
  }

  @Delete(':id')
  @RequirePermissions('customer:delete')
  @ApiOperation({ summary: 'Soft delete a customer' })
  async softDelete(@Param('id') id: string) {
    const customer = await this.customerService.softDelete(id);
    return { data: customer };
  }
}
