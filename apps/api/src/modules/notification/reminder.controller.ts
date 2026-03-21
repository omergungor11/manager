import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/tenant.guard';
import { CurrentTenant, type TenantContext } from '../tenant/tenant.decorator';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermissions } from '../rbac/rbac.decorator';
import { ReminderService } from './reminder.service';
import { CreateReminderRuleDto } from './dto/create-reminder-rule.dto';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@RequirePermissions('settings:manage')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  // ------------------------------------------------------------------
  // Reminder Rules — CRUD
  // ------------------------------------------------------------------

  @Post('reminder-rules')
  @ApiOperation({ summary: 'Create a new reminder rule' })
  async createRule(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateReminderRuleDto,
  ) {
    const rule = await this.reminderService.createRule(tenant.id, dto);
    return { data: rule };
  }

  @Get('reminder-rules')
  @ApiOperation({ summary: 'List all reminder rules for the tenant' })
  async findAllRules(@CurrentTenant() tenant: TenantContext) {
    const rules = await this.reminderService.findAllRules(tenant.id);
    return { data: rules };
  }

  @Patch('reminder-rules/:id')
  @ApiOperation({ summary: 'Update a reminder rule' })
  @ApiParam({ name: 'id', description: 'ReminderRule UUID' })
  async updateRule(
    @Param('id') id: string,
    @Body() dto: Partial<CreateReminderRuleDto>,
  ) {
    const rule = await this.reminderService.updateRule(id, dto);
    return { data: rule };
  }

  @Delete('reminder-rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reminder rule' })
  @ApiParam({ name: 'id', description: 'ReminderRule UUID' })
  async deleteRule(@Param('id') id: string): Promise<void> {
    await this.reminderService.deleteRule(id);
  }

  // ------------------------------------------------------------------
  // Reminder processing & upcoming
  // ------------------------------------------------------------------

  @Post('reminders/process')
  @ApiOperation({
    summary:
      'Trigger reminder processing for the tenant — finds eligible work orders and sends notifications',
  })
  async processReminders(@CurrentTenant() tenant: TenantContext) {
    const result = await this.reminderService.processReminders(tenant.id);
    return { data: result };
  }

  @Get('reminders/upcoming')
  @ApiOperation({
    summary: 'List pending reminders due in the next 7 days',
  })
  async getUpcomingReminders(@CurrentTenant() tenant: TenantContext) {
    const reminders = await this.reminderService.getUpcomingReminders(tenant.id);
    return { data: reminders };
  }
}
