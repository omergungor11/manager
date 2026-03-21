import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { LookupService } from './lookup.service';

@ApiTags('Lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('lookup')
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Get('plate/:plate')
  @RequirePermissions('vehicle:read')
  @ApiOperation({
    summary: 'Exact plate lookup — returns vehicle, current owner, last 5 work orders',
  })
  @ApiParam({
    name: 'plate',
    description: 'Exact license plate (e.g. 07BH888)',
  })
  async lookupByPlate(
    @CurrentTenant() tenant: TenantContext,
    @Param('plate') plate: string,
  ) {
    const result = await this.lookupService.lookupByPlate(tenant.id, plate);
    return { data: result };
  }

  @Get('plate-search')
  @RequirePermissions('vehicle:read')
  @ApiOperation({
    summary: 'Partial plate search — up to 10 matches with current owner (autocomplete/debounce)',
  })
  @ApiQuery({
    name: 'q',
    description: 'Partial license plate string',
    required: true,
  })
  async searchByPlate(
    @CurrentTenant() tenant: TenantContext,
    @Query('q') q: string,
  ) {
    const results = await this.lookupService.searchByPlate(tenant.id, q ?? '');
    return { data: results };
  }
}
