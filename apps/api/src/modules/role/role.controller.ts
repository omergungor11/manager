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
import { CurrentTenant, type TenantContext } from '../tenant/tenant.decorator';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'List all roles for the current tenant' })
  async findAll(@CurrentTenant() tenant: TenantContext) {
    const roles = await this.roleService.findAll(tenant.id);
    return { data: roles };
  }

  @Get(':id')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get a role by ID' })
  async findById(@Param('id') id: string) {
    const role = await this.roleService.findById(id);
    return { data: role };
  }

  @Post()
  @RequirePermissions('role:create')
  @ApiOperation({ summary: 'Create a new role' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateRoleDto,
  ) {
    const role = await this.roleService.create(tenant.id, dto);
    return { data: role };
  }

  @Patch(':id')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: 'Update a role' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const role = await this.roleService.update(id, dto);
    return { data: role };
  }

  @Delete(':id')
  @RequirePermissions('role:delete')
  @ApiOperation({ summary: 'Delete a role' })
  async delete(@Param('id') id: string) {
    const role = await this.roleService.delete(id);
    return { data: role };
  }
}
