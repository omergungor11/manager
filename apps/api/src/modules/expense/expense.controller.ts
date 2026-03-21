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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { EXPENSE_CATEGORIES } from './dto/create-expense.dto';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  // ------------------------------------------------------------------
  // Summary — declared before :id routes to avoid route conflicts
  // ------------------------------------------------------------------

  @Get('summary')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'Monthly expense summary grouped by category' })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2026 })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 3, description: '1–12' })
  async getMonthlySummary(
    @CurrentTenant() tenant: TenantContext,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const summary = await this.expenseService.getMonthlySummary(
      tenant.id,
      Number(year),
      Number(month),
    );

    return { data: summary };
  }

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  @Get()
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'List expenses with pagination and filters' })
  @ApiQuery({ name: 'category', required: false, enum: EXPENSE_CATEGORIES })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryExpenseDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.expenseService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get(':id')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  async findById(@Param('id') id: string) {
    const expense = await this.expenseService.findById(id);
    return { data: expense };
  }

  @Post()
  @RequirePermissions('account:create')
  @ApiOperation({
    summary: 'Create an expense. When accountId is provided, a DEBIT AccountTransaction is also created.',
  })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateExpenseDto,
  ) {
    const expense = await this.expenseService.create(tenant.id, dto);
    return { data: expense };
  }

  @Patch(':id')
  @RequirePermissions('account:update')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    const expense = await this.expenseService.update(id, dto);
    return { data: expense };
  }

  @Delete(':id')
  @RequirePermissions('account:delete')
  @ApiOperation({ summary: 'Hard delete an expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  async delete(@Param('id') id: string) {
    const expense = await this.expenseService.delete(id);
    return { data: expense };
  }
}
