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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { CurrentTenant, type TenantContext } from '../tenant/tenant.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class TerminateEmployeeDto {
  @ApiProperty({ example: '2024-12-31', description: 'Termination date' })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;
}

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @RequirePermissions('employee:read')
  @ApiOperation({ summary: 'List employees with pagination, search and filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or phone' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'terminated'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryEmployeeDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.employeeService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  @Get(':id')
  @RequirePermissions('employee:read')
  @ApiOperation({ summary: 'Get an employee by ID' })
  async findById(@Param('id') id: string) {
    const employee = await this.employeeService.findById(id);
    return { data: employee };
  }

  @Post()
  @RequirePermissions('employee:create')
  @ApiOperation({ summary: 'Create a new employee' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateEmployeeDto,
  ) {
    const employee = await this.employeeService.create(tenant.id, dto);
    return { data: employee };
  }

  @Patch(':id')
  @RequirePermissions('employee:update')
  @ApiOperation({ summary: 'Update an employee' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const employee = await this.employeeService.update(id, dto);
    return { data: employee };
  }

  @Delete(':id')
  @RequirePermissions('employee:delete')
  @ApiOperation({ summary: 'Delete an employee' })
  async remove(@Param('id') id: string) {
    const employee = await this.employeeService.terminate(id, new Date().toISOString());
    return { data: employee };
  }

  @Patch(':id/terminate')
  @RequirePermissions('employee:update')
  @ApiOperation({ summary: 'Terminate an employee — sets status to terminated and records end date' })
  @ApiBody({ type: TerminateEmployeeDto })
  async terminate(
    @Param('id') id: string,
    @Body() dto: TerminateEmployeeDto,
  ) {
    const employee = await this.employeeService.terminate(id, dto.endDate);
    return { data: employee };
  }

  @Patch(':id/activate')
  @RequirePermissions('employee:update')
  @ApiOperation({ summary: 'Re-activate a terminated or inactive employee' })
  async activate(@Param('id') id: string) {
    const employee = await this.employeeService.activate(id);
    return { data: employee };
  }
}
