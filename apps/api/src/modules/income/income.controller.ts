import {
  Controller,
  Get,
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
import { IncomeService } from './income.service';
import { QueryIncomeDto, INCOME_CATEGORIES } from './dto/query-income.dto';

@ApiTags('Income')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  // ------------------------------------------------------------------
  // Summary — declared before query routes to avoid route conflicts
  // ------------------------------------------------------------------

  @Get('summary')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Monthly income summary grouped by category' })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2026 })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 3, description: '1-12' })
  async getMonthlySummary(
    @CurrentTenant() tenant: TenantContext,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const summary = await this.incomeService.getMonthlySummary(
      tenant.id,
      Number(year),
      Number(month),
    );

    return { data: summary };
  }

  // ------------------------------------------------------------------
  // List — no POST endpoint; income is created only through payments
  // ------------------------------------------------------------------

  @Get()
  @RequirePermissions('report:read')
  @ApiOperation({
    summary: 'List income records with pagination and filters. Income entries are created automatically when payments are recorded — no manual entry is allowed.',
  })
  @ApiQuery({ name: 'category', required: false, enum: INCOME_CATEGORIES })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryIncomeDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.incomeService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }
}
