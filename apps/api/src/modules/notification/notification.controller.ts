import {
  Body,
  Controller,
  Get,
  Param,
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
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ------------------------------------------------------------------
  // Stats — declared before /:id to avoid route conflict
  // ------------------------------------------------------------------

  @Get('stats')
  @RequirePermissions('settings:manage')
  @ApiOperation({
    summary: 'Get notification counts grouped by status and channel',
  })
  async getStats(@CurrentTenant() tenant: TenantContext) {
    const stats = await this.notificationService.getStats(tenant.id);
    return { data: stats };
  }

  // ------------------------------------------------------------------
  // Create & list
  // ------------------------------------------------------------------

  /**
   * Creates a notification record (status: PENDING).
   * Pass `send: true` in the query string to immediately attempt delivery.
   */
  @Post()
  @RequirePermissions('settings:manage')
  @ApiOperation({
    summary:
      'Create a notification record and optionally trigger immediate send',
  })
  @ApiQuery({
    name: 'send',
    required: false,
    type: Boolean,
    description: 'Set to true to trigger send immediately after creation',
  })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateNotificationDto,
    @Query('send') sendImmediately?: string,
  ) {
    const notification = await this.notificationService.create(tenant.id, dto);

    if (sendImmediately === 'true' || sendImmediately === '1') {
      const sent = await this.notificationService.send(notification.id);
      return { data: sent };
    }

    return { data: notification };
  }

  @Get()
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'List notifications with pagination and filters' })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: ['sms', 'email', 'whatsapp', 'push'],
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['reminder', 'invoice', 'payment', 'general'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'SENT', 'FAILED'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: QueryNotificationDto,
  ) {
    const { items, total, page, limit, totalPages } =
      await this.notificationService.findAll(tenant.id, query);

    return {
      data: items,
      meta: { total, page, limit, totalPages },
    };
  }

  // ------------------------------------------------------------------
  // Single record operations
  // ------------------------------------------------------------------

  @Get(':id')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Get a single notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async findById(@Param('id') id: string) {
    const notification = await this.notificationService.findById(id);
    return { data: notification };
  }

  @Post(':id/send')
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Trigger send for a specific notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async send(@Param('id') id: string) {
    const notification = await this.notificationService.send(id);
    return { data: notification };
  }
}
