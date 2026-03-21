import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import type { CreateReminderRuleDto } from './dto/create-reminder-rule.dto';

/**
 * ReminderService handles rule-based reminder scheduling for tenants.
 *
 * Flow:
 *   1. Tenant creates ReminderRules tied to a ServiceDefinition.
 *   2. processReminders() runs (cron or manual) to find completed work orders
 *      that match a rule's daysAfter window and creates notifications.
 *   3. Idempotency: a Reminder record is created per work-order+rule pair
 *      before sending so duplicate runs are skipped.
 */
@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ------------------------------------------------------------------
  // Rule CRUD
  // ------------------------------------------------------------------

  async createRule(tenantId: string, data: CreateReminderRuleDto) {
    return this.prisma.reminderRule.create({
      data: {
        tenantId,
        serviceDefinitionId: data.serviceDefinitionId,
        name: data.name,
        daysAfter: data.daysAfter,
        channel: data.channel,
        messageTemplate: data.messageTemplate,
        isActive: data.isActive ?? true,
      },
      include: { serviceDefinition: { select: { id: true, name: true } } },
    });
  }

  async findAllRules(tenantId: string) {
    return this.prisma.reminderRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { serviceDefinition: { select: { id: true, name: true } } },
    });
  }

  async updateRule(
    id: string,
    data: Partial<CreateReminderRuleDto>,
  ) {
    await this.findRuleOrThrow(id);
    return this.prisma.reminderRule.update({
      where: { id },
      data: {
        ...(data.serviceDefinitionId !== undefined && {
          serviceDefinitionId: data.serviceDefinitionId,
        }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.daysAfter !== undefined && { daysAfter: data.daysAfter }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.messageTemplate !== undefined && {
          messageTemplate: data.messageTemplate,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { serviceDefinition: { select: { id: true, name: true } } },
    });
  }

  async deleteRule(id: string): Promise<void> {
    await this.findRuleOrThrow(id);
    await this.prisma.reminderRule.delete({ where: { id } });
  }

  // ------------------------------------------------------------------
  // Reminder processing
  // ------------------------------------------------------------------

  /**
   * Find all active rules for the tenant and for each rule find completed
   * work orders whose completion date is exactly `daysAfter` days ago
   * (within a 24-hour window to tolerate slight scheduling drift).
   *
   * Idempotent: if a Reminder record already exists for the work-order+rule
   * pair, the work order is skipped.
   *
   * Returns a summary of how many notifications were created and sent.
   */
  async processReminders(
    tenantId: string,
  ): Promise<{ processed: number; skipped: number; failed: number }> {
    const rules = await this.prisma.reminderRule.findMany({
      where: { tenantId, isActive: true },
      include: { serviceDefinition: true },
    });

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const rule of rules) {
      // Calculate the target completion date window
      const now = new Date();
      const windowStart = new Date(now);
      windowStart.setDate(windowStart.getDate() - rule.daysAfter - 1);
      const windowEnd = new Date(now);
      windowEnd.setDate(windowEnd.getDate() - rule.daysAfter);

      // Find completed work orders for the matching service in the window
      const workOrders = await this.prisma.workOrder.findMany({
        where: {
          tenantId,
          status: 'completed',
          completedAt: { gte: windowStart, lt: windowEnd },
          ...(rule.serviceDefinitionId
            ? {
                items: {
                  some: {
                    serviceDefinitionId: rule.serviceDefinitionId,
                  },
                },
              }
            : {}),
        },
        include: {
          customer: true,
          vehicle: true,
          reminders: { select: { id: true } },
        },
      });

      for (const wo of workOrders) {
        // Idempotency check: skip if we already created a reminder for this WO
        // We store a JSON marker in the Reminder.message field to identify the rule
        const alreadySent = await this.prisma.reminder.findFirst({
          where: {
            tenantId,
            workOrderId: wo.id,
            message: { contains: `rule:${rule.id}` },
          },
        });

        if (alreadySent) {
          skipped++;
          continue;
        }

        // Resolve customer contact details
        const customer = wo.customer;
        const vehicle = wo.vehicle;
        const phone = customer.phone ?? '';
        const email = customer.email ?? '';

        // Interpolate the message template
        const message = this.interpolate(rule.messageTemplate, {
          customerName: customer.name,
          vehiclePlate: vehicle?.licensePlate ?? '',
          serviceName: rule.serviceDefinition?.name ?? '',
        });

        // Create the Reminder record first (idempotency anchor)
        const reminderDate = new Date();
        const reminderRecord = await this.prisma.reminder.create({
          data: {
            tenantId,
            workOrderId: wo.id,
            customerId: customer.id,
            vehicleId: vehicle?.id ?? null,
            reminderDate,
            type: 'service_due',
            status: 'pending',
            channel: rule.channel,
            message: `rule:${rule.id} | ${message}`,
          },
        });

        // Determine the recipient contact based on channel
        const recipientPhone =
          rule.channel === 'sms' || rule.channel === 'whatsapp'
            ? phone || undefined
            : undefined;
        const recipientEmail =
          rule.channel === 'email' ? email || undefined : undefined;

        try {
          // Create and immediately send the notification
          const notification = await this.notificationService.create(tenantId, {
            recipientId: customer.id,
            recipientPhone,
            recipientEmail,
            channel: rule.channel as 'sms' | 'email' | 'whatsapp',
            type: 'reminder',
            title: `Service Reminder: ${rule.serviceDefinition?.name ?? 'Service'}`,
            message,
            metadata: JSON.stringify({
              reminderId: reminderRecord.id,
              workOrderId: wo.id,
              ruleId: rule.id,
            }),
          });

          await this.notificationService.send(notification.id);

          // Mark the Reminder record as sent
          await this.prisma.reminder.update({
            where: { id: reminderRecord.id },
            data: { status: 'sent', sentAt: new Date() },
          });

          processed++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Failed to send reminder ${reminderRecord.id} for work order ${wo.id}: ${msg}`,
          );

          await this.prisma.reminder.update({
            where: { id: reminderRecord.id },
            data: { status: 'cancelled' },
          });

          failed++;
        }
      }
    }

    this.logger.log(
      `processReminders(${tenantId}): processed=${processed} skipped=${skipped} failed=${failed}`,
    );

    return { processed, skipped, failed };
  }

  /**
   * Returns Reminder records whose reminderDate falls within the next 7 days
   * and are still in pending status.
   */
  async getUpcomingReminders(tenantId: string) {
    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    return this.prisma.reminder.findMany({
      where: {
        tenantId,
        status: 'pending',
        reminderDate: { gte: now, lte: in7Days },
      },
      orderBy: { reminderDate: 'asc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        vehicle: { select: { id: true, licensePlate: true, brandName: true, modelName: true } },
        workOrder: { select: { id: true, status: true } },
      },
    });
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async findRuleOrThrow(id: string) {
    const rule = await this.prisma.reminderRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('ReminderRule not found');
    return rule;
  }

  /**
   * Replace {{variable}} placeholders in a template string.
   * Unknown variables are left untouched.
   */
  private interpolate(
    template: string,
    vars: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return Object.prototype.hasOwnProperty.call(vars, key)
        ? (vars[key] ?? `{{${key}}}`)
        : `{{${key}}}`;
    });
  }
}
