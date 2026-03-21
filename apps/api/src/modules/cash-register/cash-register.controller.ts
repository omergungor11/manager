import {
  Body,
  Controller,
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
import { CashRegisterService } from './cash-register.service';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';
import { CreateRegisterTransactionDto } from './dto/create-register-transaction.dto';

@ApiTags('Cash Registers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('cash-registers')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  // ------------------------------------------------------------------
  // Daily report — declared before :id routes to avoid route conflicts
  // ------------------------------------------------------------------

  @Get('daily-report')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'Daily summary of all cash registers for a given date' })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    format: 'date',
    example: '2026-03-21',
    description: 'Report date (ISO date string)',
  })
  async getDailyReport(
    @CurrentTenant() tenant: TenantContext,
    @Query('date') date: string,
  ) {
    const report = await this.cashRegisterService.getDailyReport(
      tenant.id,
      new Date(date),
    );

    return { data: report };
  }

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  @Get()
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'List all active cash registers with current balances' })
  async findAll(@CurrentTenant() tenant: TenantContext) {
    const registers = await this.cashRegisterService.findAll(tenant.id);
    return { data: registers };
  }

  @Get(':id')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'Get a cash register by ID with recent transactions' })
  @ApiParam({ name: 'id', description: 'Cash register UUID' })
  async findById(@Param('id') id: string) {
    const register = await this.cashRegisterService.findById(id);
    return { data: register };
  }

  @Post()
  @RequirePermissions('account:create')
  @ApiOperation({ summary: 'Create a new cash register (cash or bank account)' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateCashRegisterDto,
  ) {
    const register = await this.cashRegisterService.create(tenant.id, dto);
    return { data: register };
  }

  @Patch(':id')
  @RequirePermissions('account:update')
  @ApiOperation({ summary: 'Update a cash register' })
  @ApiParam({ name: 'id', description: 'Cash register UUID' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCashRegisterDto,
  ) {
    const register = await this.cashRegisterService.update(id, dto);
    return { data: register };
  }

  // ------------------------------------------------------------------
  // Transactions
  // ------------------------------------------------------------------

  @Post(':id/transactions')
  @RequirePermissions('account:create')
  @ApiOperation({
    summary: 'Record a cash movement (IN, OUT, or TRANSFER between registers)',
  })
  @ApiParam({ name: 'id', description: 'Source cash register UUID' })
  async createTransaction(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: CreateRegisterTransactionDto,
  ) {
    // Enforce that the URL param and body are consistent
    const transaction = await this.cashRegisterService.createTransaction(
      tenant.id,
      { ...dto, cashRegisterId: id },
    );
    return { data: transaction };
  }

  @Get(':id/transactions')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'Paginated list of transactions for a cash register' })
  @ApiParam({ name: 'id', description: 'Cash register UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const { items, total, totalPages } =
      await this.cashRegisterService.getTransactions(
        id,
        Number(page),
        Number(limit),
      );

    return {
      data: items,
      meta: { total, page: Number(page), limit: Number(limit), totalPages },
    };
  }
}
