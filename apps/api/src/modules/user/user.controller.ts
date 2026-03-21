import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'List all users for the current tenant' })
  async findAll(@CurrentTenant() tenant: TenantContext) {
    const users = await this.userService.findAll(tenant.id);
    return { data: users };
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get a user by ID' })
  async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return { data: user };
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  @ApiOperation({ summary: 'Update a user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.userService.update(id, dto);
    return { data: user };
  }

  @Patch(':id/role')
  @RequirePermissions('user:update', 'role:update')
  @ApiOperation({ summary: 'Assign a role to a user' })
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ) {
    const user = await this.userService.assignRole(id, dto.roleId);
    return { data: user };
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  @ApiOperation({ summary: 'Soft delete a user' })
  async delete(@Param('id') id: string) {
    const user = await this.userService.softDelete(id);
    return { data: user };
  }
}
