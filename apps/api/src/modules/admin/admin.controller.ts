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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { Roles } from '../rbac/rbac.decorator';
import { AdminService } from './admin.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles('super_admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---- Global stats ----

  @Get('stats')
  @ApiOperation({ summary: 'Global platform istatistikleri' })
  async getGlobalStats() {
    const stats = await this.adminService.getGlobalStats();
    return { data: stats };
  }

  // ---- Tenant CRUD ----

  @Get('tenants')
  @ApiOperation({ summary: 'Tüm tenantları listele (sayfalı)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
  })
  @ApiQuery({
    name: 'plan',
    required: false,
    enum: ['free', 'pro', 'enterprise'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAllTenants(@Query() query: QueryTenantDto) {
    const { items, total, page, limit, totalPages } =
      await this.adminService.findAllTenants(query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Tenant detayı getir' })
  async findTenantById(@Param('id') id: string) {
    const tenant = await this.adminService.findTenantById(id);
    return { data: tenant };
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Yeni tenant oluştur' })
  async createTenant(@Body() dto: CreateTenantDto) {
    const tenant = await this.adminService.createTenant(dto);
    return { data: tenant };
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Tenant güncelle (dondur/aktifleştir/askıya al)' })
  async updateTenant(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    const tenant = await this.adminService.updateTenant(id, dto);
    return { data: tenant };
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Tenant sil (soft delete — status=deleted)' })
  async deleteTenant(@Param('id') id: string) {
    const tenant = await this.adminService.deleteTenant(id);
    return { data: tenant };
  }

  // ---- Tenant stats ----

  @Get('tenants/:id/stats')
  @ApiOperation({ summary: 'Tenant istatistiklerini getir (kullanıcı, iş emri, fatura)' })
  async getTenantStats(@Param('id') id: string) {
    const stats = await this.adminService.getTenantStats(id);
    return { data: stats };
  }
}
