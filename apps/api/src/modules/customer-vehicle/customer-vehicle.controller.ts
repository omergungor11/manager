import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { CustomerVehicleService } from './customer-vehicle.service';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { TransferVehicleDto } from './dto/transfer-vehicle.dto';

@ApiTags('Customer Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller()
export class CustomerVehicleController {
  constructor(
    private readonly customerVehicleService: CustomerVehicleService,
  ) {}

  @Get('customers/:customerId/vehicles')
  @RequirePermissions('customer:read')
  @ApiOperation({ summary: "List all active vehicles assigned to a customer" })
  async getCustomerVehicles(@Param('customerId') customerId: string) {
    const data = await this.customerVehicleService.getCustomerVehicles(customerId);
    return { data };
  }

  @Get('vehicles/:vehicleId/owners')
  @RequirePermissions('vehicle:read')
  @ApiOperation({ summary: "List all owners (current and historical) of a vehicle" })
  async getVehicleOwners(@Param('vehicleId') vehicleId: string) {
    const data = await this.customerVehicleService.getVehicleOwners(vehicleId);
    return { data };
  }

  @Post('customers/:customerId/vehicles')
  @RequirePermissions('customer:update')
  @ApiOperation({ summary: "Assign a vehicle to a customer" })
  async assignVehicle(
    @Param('customerId') customerId: string,
    @Body() dto: AssignVehicleDto,
  ) {
    const data = await this.customerVehicleService.assignVehicle(customerId, dto);
    return { data };
  }

  @Delete('customers/:customerId/vehicles/:vehicleId')
  @RequirePermissions('customer:update')
  @ApiOperation({ summary: "Unassign a vehicle from a customer (soft unlink)" })
  async unassignVehicle(
    @Param('customerId') customerId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    const data = await this.customerVehicleService.unassignVehicle(customerId, vehicleId);
    return { data };
  }

  @Post('vehicles/transfer')
  @RequirePermissions('vehicle:update')
  @ApiOperation({ summary: "Transfer a vehicle to a new owner (transactional)" })
  async transferVehicle(@Body() dto: TransferVehicleDto) {
    const data = await this.customerVehicleService.transferVehicle(dto);
    return { data };
  }

  @Patch('customers/:customerId/vehicles/:vehicleId/primary')
  @RequirePermissions('customer:update')
  @ApiOperation({ summary: "Set a vehicle as primary for a customer" })
  async setPrimary(
    @Param('customerId') customerId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    const data = await this.customerVehicleService.setPrimary(customerId, vehicleId);
    return { data };
  }
}
