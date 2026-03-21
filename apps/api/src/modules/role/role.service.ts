import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ROLE_PERMISSIONS } from '../rbac/permissions.constant';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async create(tenantId: string, data: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Role "${data.name}" already exists`);
    }

    return this.prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        permissions: data.permissions,
        isDefault: false,
      },
    });
  }

  async update(id: string, data: UpdateRoleDto) {
    const role = await this.findById(id);

    if (role.isDefault && data.name && data.name !== role.name) {
      throw new BadRequestException('Cannot rename a default role');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
      },
    });
  }

  async delete(id: string) {
    const role = await this.findById(id);

    if (role.isDefault) {
      throw new BadRequestException('Cannot delete a default role');
    }

    const usersWithRole = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (usersWithRole > 0) {
      throw new BadRequestException(
        `Cannot delete role: ${usersWithRole} user(s) are still assigned to it`,
      );
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }

  async createDefaultRoles(tenantId: string) {
    const roles = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(
      ([name, permissions]) => ({
        tenantId,
        name,
        permissions,
        isDefault: true,
      }),
    );

    return this.prisma.$transaction(
      roles.map((role) =>
        this.prisma.role.create({ data: role }),
      ),
    );
  }
}
