import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import type { QueryInvoiceDto } from './dto/query-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /**
   * Generates the next sequential invoice number scoped to the tenant.
   * Format: INV-00001, INV-00002, …
   *
   * Reads the highest existing invoiceNo for the tenant, extracts the
   * numeric suffix, increments it, and left-pads to 5 digits.
   */
  async generateInvoiceNo(tenantId: string): Promise<string> {
    const last = await this.prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { invoiceNo: 'desc' },
      select: { invoiceNo: true },
    });

    let next = 1;

    if (last?.invoiceNo) {
      const parts = last.invoiceNo.split('-');
      const num = Number.parseInt(parts[parts.length - 1] ?? '0', 10);
      if (!Number.isNaN(num)) {
        next = num + 1;
      }
    }

    return `INV-${String(next).padStart(5, '0')}`;
  }

  // ------------------------------------------------------------------
  // Invoice CRUD
  // ------------------------------------------------------------------

  /**
   * Creates an invoice from a completed work order in a single transaction.
   *
   * Steps:
   * 1. Validate the work order exists and has COMPLETED status.
   * 2. Copy all WorkOrderItems to InvoiceItems.
   * 3. Calculate subtotal, taxAmount, and total from work order figures.
   * 4. Set the work order status to INVOICED.
   * 5. Return the created invoice with all relations.
   */
  async createFromWorkOrder(tenantId: string, data: CreateInvoiceDto) {
    const invoiceNo = await this.generateInvoiceNo(tenantId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch and validate work order
      const workOrder = await tx.workOrder.findUnique({
        where: { id: data.workOrderId },
        include: {
          items: true,
        },
      });

      if (!workOrder) {
        throw new NotFoundException('Work order not found');
      }

      if (workOrder.tenantId !== tenantId) {
        throw new NotFoundException('Work order not found');
      }

      if (workOrder.status !== 'COMPLETED') {
        throw new BadRequestException(
          `Work order must be in COMPLETED status to be invoiced (current status: ${workOrder.status})`,
        );
      }

      // 2. Build invoice items from work order items
      const invoiceItems = workOrder.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }));

      // 3. Use totals from the work order (already calculated)
      const subtotal = Number(workOrder.subtotal);
      const taxRate = Number(workOrder.taxRate);
      const taxAmount = Number(workOrder.taxAmount);
      const total = Number(workOrder.total);

      // 4. Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNo,
          workOrderId: data.workOrderId,
          customerId: workOrder.customerId,
          accountId: data.accountId ?? null,
          dueDate: data.dueDate ?? null,
          subtotal,
          taxRate,
          taxAmount,
          total,
          paidAmount: 0,
          status: 'DRAFT',
          items: {
            create: invoiceItems,
          },
        },
        include: {
          items: true,
          customer: true,
          workOrder: {
            include: {
              vehicle: true,
            },
          },
          account: true,
          payments: true,
        },
      });

      // 5. Mark work order as INVOICED
      await tx.workOrder.update({
        where: { id: data.workOrderId },
        data: { status: 'INVOICED' },
      });

      return invoice;
    });
  }

  /**
   * Returns a paginated list of invoices for the tenant with optional filters.
   * Includes customer relation for list display.
   */
  async findAll(tenantId: string, query: QueryInvoiceDto) {
    const {
      status,
      customerId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: true,
          account: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Returns a single invoice by ID with all relations:
   * items, customer, workOrder (with vehicle), account, and payments.
   */
  async findById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        workOrder: {
          include: {
            vehicle: true,
          },
        },
        account: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Cancels an invoice by setting its status to CANCELLED.
   * Also reverses the work order status back to COMPLETED.
   * Cannot cancel an already-paid or already-cancelled invoice.
   */
  async cancelInvoice(id: string) {
    const invoice = await this.findById(id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a fully paid invoice');
    }

    return this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          items: true,
          customer: true,
          workOrder: {
            include: { vehicle: true },
          },
          account: true,
          payments: true,
        },
      });

      // Reverse the work order status back to COMPLETED
      await tx.workOrder.update({
        where: { id: invoice.workOrderId },
        data: { status: 'COMPLETED' },
      });

      return cancelled;
    });
  }
}
