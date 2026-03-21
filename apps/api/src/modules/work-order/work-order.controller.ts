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
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { CurrentTenant, type TenantContext } from '../tenant/tenant.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { AddWorkOrderItemDto } from './dto/add-work-order-item.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';

@ApiTags('Work Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('work-orders')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Get()
  @RequirePermissions('work_order:read')
  @ApiOperation({ summary: 'List work orders with pagination and filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'vehicleId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryWorkOrderDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.workOrderService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get(':id')
  @RequirePermissions('work_order:read')
  @ApiOperation({ summary: 'Get a work order by ID with all relations' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  async findById(@Param('id') id: string) {
    const workOrder = await this.workOrderService.findById(id);
    return { data: workOrder };
  }

  @Post()
  @RequirePermissions('work_order:create')
  @ApiOperation({ summary: 'Create a new work order with initial items' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateWorkOrderDto,
  ) {
    const workOrder = await this.workOrderService.create(tenant.id, dto);
    return { data: workOrder };
  }

  @Patch(':id')
  @RequirePermissions('work_order:update')
  @ApiOperation({ summary: 'Update work order basic fields (technician, km, tax rate, notes)' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    const workOrder = await this.workOrderService.update(id, dto);
    return { data: workOrder };
  }

  @Post(':id/items')
  @RequirePermissions('work_order:update')
  @ApiOperation({ summary: 'Add an item to a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddWorkOrderItemDto,
  ) {
    const workOrder = await this.workOrderService.addItem(id, dto);
    return { data: workOrder };
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('work_order:update')
  @ApiOperation({ summary: 'Remove an item from a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiParam({ name: 'itemId', description: 'Work order item UUID' })
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const workOrder = await this.workOrderService.removeItem(id, itemId);
    return { data: workOrder };
  }
}
