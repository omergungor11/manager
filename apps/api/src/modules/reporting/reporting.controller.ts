import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
import { ReportingService } from './reporting.service';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // -------------------------------------------------------------------------
  // GET /reports/income-expense
  // -------------------------------------------------------------------------

  @Get('income-expense')
  @RequirePermissions('report:read')
  @ApiOperation({
    summary: 'Income & expense report with net profit and category breakdown',
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getIncomeExpenseReport(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ReportQueryDto,
  ) {
    const report = await this.reportingService.getIncomeExpenseReport(
      tenant.id,
      query.dateFrom,
      query.dateTo,
    );
    return { data: report };
  }

  // -------------------------------------------------------------------------
  // GET /reports/profit-loss
  // -------------------------------------------------------------------------

  @Get('profit-loss')
  @RequirePermissions('report:read')
  @ApiOperation({
    summary:
      'Profit & loss report — revenue, COGS, gross profit, operating expenses, net profit',
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getProfitLossReport(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ReportQueryDto,
  ) {
    const report = await this.reportingService.getProfitLossReport(
      tenant.id,
      query.dateFrom,
      query.dateTo,
    );
    return { data: report };
  }

  // -------------------------------------------------------------------------
  // GET /reports/stock
  // -------------------------------------------------------------------------

  @Get('stock')
  @RequirePermissions('report:read')
  @ApiOperation({
    summary:
      'Stock report — low stock alerts, most sold products, total stock value, inventory turnover',
  })
  async getStockReport(@CurrentTenant() tenant: TenantContext) {
    const report = await this.reportingService.getStockReport(tenant.id);
    return { data: report };
  }

  // -------------------------------------------------------------------------
  // GET /reports/customers
  // -------------------------------------------------------------------------

  @Get('customers')
  @RequirePermissions('report:read')
  @ApiOperation({
    summary:
      'Customer report — top customers by revenue, new customer count, breakdown by type',
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getCustomerReport(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ReportQueryDto,
  ) {
    const report = await this.reportingService.getCustomerReport(
      tenant.id,
      query.dateFrom,
      query.dateTo,
    );
    return { data: report };
  }

  // -------------------------------------------------------------------------
  // GET /reports/vehicles
  // -------------------------------------------------------------------------

  @Get('vehicles')
  @RequirePermissions('report:read')
  @ApiOperation({
    summary:
      'Vehicle report — most serviced vehicles, breakdown by brand, average service frequency',
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  async getVehicleReport(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ReportQueryDto,
  ) {
    const report = await this.reportingService.getVehicleReport(
      tenant.id,
      query.dateFrom,
      query.dateTo,
    );
    return { data: report };
  }
}
