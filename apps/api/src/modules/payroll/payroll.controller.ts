import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { PayrollService } from './payroll.service';
import { PayrollParamsService } from './payroll-params.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { BulkCreatePayrollDto } from './dto/bulk-create-payroll.dto';
import { QueryPayrollDto } from './dto/query-payroll.dto';
import { UpdatePayrollParamDto } from './dto/update-payroll-param.dto';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ReportQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year!: number;

  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  month!: number;
}

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly paramsService: PayrollParamsService,
  ) {}

  // POST /payroll/calculate — preview, no save
  @Post('calculate')
  @RequirePermissions('payroll:read')
  @ApiOperation({ summary: 'Preview payroll calculation for a given gross salary — no record created' })
  async calculate(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CalculatePayrollDto,
  ) {
    const result = await this.payrollService.calculatePreview(dto.grossSalary, tenant.id);
    return { data: result };
  }

  // GET /payroll/report — monthly summary (must come before /:id)
  @Get('report')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Monthly payroll summary report for all employees' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  async getMonthlyReport(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ReportQueryDto,
  ) {
    const result = await this.payrollService.getMonthlyReport(
      tenant.id,
      query.year,
      query.month,
    );
    return { data: result };
  }

  // GET /payroll/params — list all params
  @Get('params')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'List all payroll parameters for the tenant' })
  async getParams(@CurrentTenant() tenant: TenantContext) {
    const params = await this.paramsService.findAll(tenant.id);
    return { data: params };
  }

  // PUT /payroll/params/:name — upsert a param
  @Put('params/:name')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Create or update a payroll parameter (e.g. sgk_employee_rate)' })
  @ApiParam({ name: 'name', example: 'sgk_employee_rate' })
  async upsertParam(
    @CurrentTenant() tenant: TenantContext,
    @Param('name') name: string,
    @Body() dto: UpdatePayrollParamDto,
  ) {
    const param = await this.paramsService.upsertParam(
      tenant.id,
      name,
      dto.value,
    );
    return { data: param };
  }

  // POST /payroll — create single
  @Post()
  @RequirePermissions('payroll:create')
  @ApiOperation({ summary: 'Create a payroll record for a single employee and month' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreatePayrollDto,
  ) {
    const payroll = await this.payrollService.createPayroll(tenant.id, dto);
    return { data: payroll };
  }

  // POST /payroll/bulk — create for all active employees
  @Post('bulk')
  @RequirePermissions('payroll:create')
  @ApiOperation({ summary: 'Create payroll records for all active employees in one month' })
  async bulkCreate(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: BulkCreatePayrollDto,
  ) {
    const result = await this.payrollService.bulkCreatePayroll(tenant.id, dto);
    return { data: result };
  }

  // GET /payroll — list
  @Get()
  @RequirePermissions('payroll:read')
  @ApiOperation({ summary: 'List payroll records with optional filters and pagination' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'approved', 'paid'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryPayrollDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.payrollService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  // GET /payroll/:id — get one
  @Get(':id')
  @RequirePermissions('payroll:read')
  @ApiOperation({ summary: 'Get a single payroll record by ID' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  async findById(@Param('id') id: string) {
    const payroll = await this.payrollService.findById(id);
    return { data: payroll };
  }

  // PATCH /payroll/:id/approve
  @Patch(':id/approve')
  @RequirePermissions('payroll:update')
  @ApiOperation({ summary: 'Approve a draft payroll record' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  async approve(@Param('id') id: string) {
    const payroll = await this.payrollService.approvePayroll(id);
    return { data: payroll };
  }

  // PATCH /payroll/:id/pay
  @Patch(':id/pay')
  @RequirePermissions('payroll:update')
  @ApiOperation({ summary: 'Mark an approved payroll record as paid' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  async markPaid(@Param('id') id: string) {
    const payroll = await this.payrollService.markPaid(id);
    return { data: payroll };
  }
}
