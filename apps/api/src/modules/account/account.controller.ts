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
  ApiBody,
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
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { QueryAccountDto } from './dto/query-account.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------

  @Get()
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'List accounts with pagination, search and type filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, phone, email, or taxId' })
  @ApiQuery({ name: 'type', required: false, enum: ['customer', 'supplier', 'other'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryAccountDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.accountService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get(':id')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'Get an account by ID, including recent transactions' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  async findById(@Param('id') id: string) {
    const account = await this.accountService.findById(id);
    return { data: account };
  }

  @Post()
  @RequirePermissions('account:create')
  @ApiOperation({ summary: 'Create a new cari hesap (account)' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateAccountDto,
  ) {
    const account = await this.accountService.create(tenant.id, dto);
    return { data: account };
  }

  @Patch(':id')
  @RequirePermissions('account:update')
  @ApiOperation({ summary: 'Update an account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const account = await this.accountService.update(id, dto);
    return { data: account };
  }

  @Delete(':id')
  @RequirePermissions('account:delete')
  @ApiOperation({ summary: 'Soft delete an account (only allowed when balance is 0)' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  async softDelete(@Param('id') id: string) {
    const account = await this.accountService.softDelete(id);
    return { data: account };
  }

  // ------------------------------------------------------------------
  // Balance
  // ------------------------------------------------------------------

  @Get(':id/balance')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'Get current balance of an account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  async getBalance(@Param('id') id: string) {
    const balance = await this.accountService.getBalance(id);
    return { data: balance };
  }

  // ------------------------------------------------------------------
  // Transactions
  // ------------------------------------------------------------------

  @Post(':id/transactions')
  @RequirePermissions('account:create')
  @ApiOperation({ summary: 'Create a debit or credit transaction for an account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiBody({ type: CreateTransactionDto })
  async createTransaction(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: CreateTransactionDto,
  ) {
    // Enforce the route param as the accountId — body value is overridden
    dto.accountId = id;
    const transaction = await this.accountService.createTransaction(tenant.id, dto);
    return { data: transaction };
  }

  @Get(':id/transactions')
  @RequirePermissions('account:read')
  @ApiOperation({ summary: 'List paginated transactions for an account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactions(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.accountService.getTransactions(
      id,
      Number(page),
      Number(limit),
    );

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  // ------------------------------------------------------------------
  // Customer link
  // ------------------------------------------------------------------

  @Post(':id/link-customer')
  @RequirePermissions('account:update')
  @ApiOperation({ summary: 'Link a customer to this account' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerId'],
      properties: {
        customerId: { type: 'string', format: 'uuid' },
        isDefault: { type: 'boolean', default: false },
      },
    },
  })
  async linkCustomer(
    @Param('id') id: string,
    @Body('customerId') customerId: string,
    @Body('isDefault') isDefault = false,
  ) {
    const link = await this.accountService.linkCustomer(id, customerId, isDefault);
    return { data: link };
  }
}
