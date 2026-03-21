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
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { ServiceHistoryQueryDto } from './dto/service-history-query.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  @RequirePermissions('vehicle:read')
  @ApiOperation({ summary: 'List vehicles with pagination and search' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by licensePlate, brandName, or modelName',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryVehicleDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.vehicleService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get('plate/:plate')
  @RequirePermissions('vehicle:read')
  @ApiOperation({ summary: 'Look up a vehicle by license plate' })
  @ApiParam({ name: 'plate', description: 'License plate number' })
  async findByPlate(
    @CurrentTenant() tenant: TenantContext,
    @Param('plate') plate: string,
  ) {
    const vehicle = await this.vehicleService.findByPlate(tenant.id, plate);
    return { data: vehicle };
  }

  @Get(':id/service-history')
  @RequirePermissions('vehicle:read')
  @ApiOperation({
    summary: 'Get paginated work-order history for a vehicle',
    description:
      'Returns all work orders for the vehicle ordered by creation date descending. ' +
      'Meta includes lastServiceDate and lastServiceKm derived from the most recent COMPLETED order.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getServiceHistory(
    @Param('id') id: string,
    @Query() query: ServiceHistoryQueryDto,
  ) {
    const { page = 1, limit = 20 } = query;
    const { items, total, totalPages, lastServiceDate, lastServiceKm } =
      await this.vehicleService.getServiceHistory(id, page, limit);

    return {
      data: items,
      meta: { total, page, limit, totalPages, lastServiceDate, lastServiceKm },
    };
  }

  @Get(':id')
  @RequirePermissions('vehicle:read')
  @ApiOperation({ summary: 'Get a vehicle by ID (includes customer relations)' })
  async findById(@Param('id') id: string) {
    const vehicle = await this.vehicleService.findById(id);
    return { data: vehicle };
  }

  @Post()
  @RequirePermissions('vehicle:create')
  @ApiOperation({ summary: 'Create a new vehicle' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateVehicleDto,
  ) {
    const vehicle = await this.vehicleService.create(tenant.id, dto);
    return { data: vehicle };
  }

  @Patch(':id')
  @RequirePermissions('vehicle:update')
  @ApiOperation({ summary: 'Update a vehicle' })
  async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    const vehicle = await this.vehicleService.update(id, dto);
    return { data: vehicle };
  }

  @Delete(':id')
  @RequirePermissions('vehicle:delete')
  @ApiOperation({ summary: 'Soft delete a vehicle' })
  async softDelete(@Param('id') id: string) {
    const vehicle = await this.vehicleService.softDelete(id);
    return { data: vehicle };
  }
}
