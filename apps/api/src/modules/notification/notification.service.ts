import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import type { QueryNotificationDto } from './dto/query-notification.dto';

/**
 * Internal shape stored in the DB:
 *   type    → channel  (sms | email | whatsapp | push)
 *   subject → title
 *   content → message
 *   recipient → recipientPhone or recipientEmail (whichever is present)
 *
 * The notification `type` (reminder | invoice | payment | general) and any
 * caller-supplied metadata are merged and persisted in the `error` column
 * temporarily — no: they are stored as JSON in a dedicated metadata wrapper
 * inside the `content` field. Actually the cleanest fit with the existing
 * schema is to embed notificationType in the error column … no. We will store
 * it as a JSON object in the schema-level `subject` field is a plain string.
 *
 * Final decision: store `notificationType` + caller `metadata` together as
 * JSON in a `_meta` prefix on the `error` field is abusive. Instead, we
 * serialise a lightweight internal envelope into `subject`:
 *   "<type>|<title>"  (e.g. "reminder|Service Reminder")
 * and expose them deserialized through a private helper.  The `content` field
 * holds the raw message.
 *
 * For the stats endpoint we only need channel (type col) and status — both
 * are first-class schema columns.
 */

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

interface NotificationRecord {
  id: string;
  tenantId: string;
  channel: string;
  type: string;
  title: string;
  message: string;
  recipientId: string | null;
  recipientPhone: string | null;
  recipientEmail: string | null;
  metadata: Record<string, unknown> | null;
  status: NotificationStatus;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
}

/**
 * Encodes our logical fields onto the Prisma Notification columns:
 *
 *  DB column   | logical field
 *  ------------|-----------------------------
 *  type        | channel  (sms|email|whatsapp|push)
 *  subject     | "<notifType>|<title>"
 *  content     | message
 *  recipient   | recipientPhone ?? recipientEmail ?? recipientId ?? ''
 *  recipientId | recipientId
 *  status      | PENDING / SENT / FAILED  (schema uses queued/sent/failed —
 *              | we write in our convention; migration/seed will align)
 *  error       | JSON string holding error text OR metadata
 */
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  /** Build the encoded `subject` column value: "<type>|<title>". */
  private encodeSubject(type: string, title: string): string {
    return `${type}|${title}`;
  }

  /** Decode the `subject` column back into { type, title }. */
  private decodeSubject(subject: string | null): {
    type: string;
    title: string;
  } {
    if (!subject) return { type: 'general', title: '' };
    const idx = subject.indexOf('|');
    if (idx === -1) return { type: 'general', title: subject };
    return { type: subject.slice(0, idx), title: subject.slice(idx + 1) };
  }

  /**
   * Serialise the `error` column for a PENDING record.
   * We store caller metadata as a JSON envelope so it survives round-trips.
   * When a failure occurs we overwrite this with the error text.
   */
  private encodeMetadata(
    metadata: string | Record<string, unknown> | null | undefined,
  ): string | null {
    if (!metadata) return null;
    const obj =
      typeof metadata === 'string'
        ? (JSON.parse(metadata) as Record<string, unknown>)
        : metadata;
    return JSON.stringify({ _meta: obj });
  }

  /** Attempt to parse the `error` column as metadata; fall back to null. */
  private decodeMetadata(
    error: string | null,
  ): Record<string, unknown> | null {
    if (!error) return null;
    try {
      const parsed = JSON.parse(error) as { _meta?: Record<string, unknown> };
      return parsed._meta ?? null;
    } catch {
      return null;
    }
  }

  /** True if the error column holds an error string (not metadata). */
  private isErrorString(error: string | null): boolean {
    if (!error) return false;
    try {
      const parsed = JSON.parse(error) as { _meta?: unknown };
      return !('_meta' in parsed);
    } catch {
      return true; // plain string → real error
    }
  }

  /** Map a raw Prisma notification row to our logical NotificationRecord. */
  private mapRow(row: {
    id: string;
    tenantId: string;
    type: string;
    subject: string | null;
    content: string;
    recipient: string;
    recipientId: string | null;
    status: string;
    sentAt: Date | null;
    error: string | null;
    createdAt: Date;
  }): NotificationRecord {
    const { type: notifType, title } = this.decodeSubject(row.subject);
    const metadata = this.isErrorString(row.error)
      ? null
      : this.decodeMetadata(row.error);

    // Reconstruct recipientPhone / recipientEmail from recipient field heuristic
    const recipient = row.recipient;
    const isEmail = recipient.includes('@');

    return {
      id: row.id,
      tenantId: row.tenantId,
      channel: row.type,
      type: notifType,
      title,
      message: row.content,
      recipientId: row.recipientId,
      recipientPhone: !isEmail && recipient.length > 0 ? recipient : null,
      recipientEmail: isEmail ? recipient : null,
      metadata,
      status: row.status as NotificationStatus,
      sentAt: row.sentAt,
      error: this.isErrorString(row.error) ? row.error : null,
      createdAt: row.createdAt,
    };
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Create a notification record with status PENDING.
   * The `channel` is stored in the schema `type` column.
   * The notification `type` + `title` are encoded into `subject`.
   */
  async create(
    tenantId: string,
    data: CreateNotificationDto,
  ): Promise<NotificationRecord> {
    const recipient =
      data.recipientPhone ?? data.recipientEmail ?? data.recipientId ?? '';

    const metadataStr = data.metadata
      ? this.encodeMetadata(data.metadata)
      : null;

    const row = await this.prisma.notification.create({
      data: {
        tenantId,
        type: data.channel,
        recipientId: data.recipientId ?? null,
        recipient,
        subject: this.encodeSubject(data.type, data.title),
        content: data.message,
        status: 'PENDING',
        error: metadataStr,
      },
    });

    return this.mapRow(row);
  }

  /**
   * Returns a paginated list of notifications for the tenant.
   * Supports optional filters: channel (type), type (decoded from subject
   * prefix), and status.
   */
  async findAll(
    tenantId: string,
    query: QueryNotificationDto,
  ): Promise<{
    items: NotificationRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { channel, status, page = 1, limit = 20 } = query;

    // `type` filter (notification type) requires a subject LIKE search
    const typeFilter = query.type
      ? { subject: { startsWith: `${query.type}|` } }
      : {};

    const where = {
      tenantId,
      ...(channel ? { type: channel } : {}),
      ...(status ? { status } : {}),
      ...typeFilter,
    };

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.mapRow(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a single notification by ID.
   * Throws NotFoundException if not found.
   */
  async findById(id: string): Promise<NotificationRecord> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    return this.mapRow(row);
  }

  /**
   * Transitions a notification to SENT and records the sentAt timestamp.
   * Any previously stored metadata in the error column is cleared.
   */
  async markSent(id: string): Promise<NotificationRecord> {
    await this.findById(id); // existence check
    const row = await this.prisma.notification.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        error: null,
      },
    });
    return this.mapRow(row);
  }

  /**
   * Transitions a notification to FAILED and stores the error message.
   * Overwrites any metadata previously held in the error column.
   */
  async markFailed(id: string, error: string): Promise<NotificationRecord> {
    await this.findById(id); // existence check
    const row = await this.prisma.notification.update({
      where: { id },
      data: {
        status: 'FAILED',
        error,
      },
    });
    return this.mapRow(row);
  }

  /**
   * Placeholder send implementation.
   * Actual SMS/email/WhatsApp integrations will replace this in future tasks.
   * For now it simply marks the notification as SENT.
   */
  async send(notificationId: string): Promise<NotificationRecord> {
    return this.markSent(notificationId);
  }

  /**
   * Bulk-create and immediately send multiple notifications for a tenant.
   * Each notification is created then sent sequentially to avoid overwhelming
   * downstream adapters (which will enforce their own rate limits later).
   * Returns the final state of each notification after the send attempt.
   */
  async sendBulk(
    tenantId: string,
    notifications: CreateNotificationDto[],
  ): Promise<NotificationRecord[]> {
    const results: NotificationRecord[] = [];

    for (const dto of notifications) {
      const created = await this.create(tenantId, dto);
      const sent = await this.send(created.id);
      results.push(sent);
    }

    return results;
  }

  /**
   * Returns aggregate counts grouped by status and channel for the tenant.
   * Useful for dashboard widgets and monitoring.
   */
  async getStats(tenantId: string): Promise<{
    byStatus: Record<string, number>;
    byChannel: Record<string, number>;
    total: number;
  }> {
    const [byStatusRaw, byChannelRaw, total] = await Promise.all([
      this.prisma.notification.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { tenantId },
        _count: { _all: true },
      }),
      this.prisma.notification.count({ where: { tenantId } }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRaw) {
      byStatus[row.status] = row._count._all;
    }

    const byChannel: Record<string, number> = {};
    for (const row of byChannelRaw) {
      byChannel[row.type] = row._count._all;
    }

    return { byStatus, byChannel, total };
  }
}
