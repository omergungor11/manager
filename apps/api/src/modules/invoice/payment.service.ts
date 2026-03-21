import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';

// Map DTO method values (lowercase) to DB stored values (uppercase)
const METHOD_MAP: Record<string, string> = {
  cash: 'CASH',
  card: 'CARD',
  transfer: 'TRANSFER',
  account: 'ACCOUNT',
};

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves invoice status after a payment is applied.
   *
   * - PAID: paidAmount >= total
   * - PARTIALLY_PAID: 0 < paidAmount < total
   * - SENT: paidAmount === 0 and current status was SENT
   * - Otherwise keep existing status (e.g. DRAFT → DRAFT)
   */
  private resolveStatus(
    currentStatus: string,
    total: number,
    newPaidAmount: number,
  ): string {
    if (newPaidAmount >= total) return 'PAID';
    if (newPaidAmount > 0) return 'PARTIALLY_PAID';
    return currentStatus;
  }

  /**
   * Creates a payment for an invoice and updates financial state in a single
   * transaction.
   *
   * Steps:
   * 1. Validate the invoice exists, belongs to tenant, and is not cancelled.
   * 2. Ensure payment does not exceed the remaining balance.
   * 3. Create the Payment record.
   * 4. Update invoice paidAmount and status (PAID | PARTIALLY_PAID).
   * 5. If method is 'account' and invoice has an accountId, create an
   *    AccountTransaction (debit — money coming in against the cari account).
   */
  async createPayment(tenantId: string, data: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch and validate invoice
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId },
        select: {
          id: true,
          tenantId: true,
          status: true,
          total: true,
          paidAmount: true,
          accountId: true,
          invoiceNo: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.tenantId !== tenantId) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw new BadRequestException('Cannot add payment to a cancelled invoice');
      }

      if (invoice.status === 'PAID') {
        throw new BadRequestException('Invoice is already fully paid');
      }

      const total = Number(invoice.total);
      const currentPaid = Number(invoice.paidAmount);
      const remaining = total - currentPaid;

      // 2. Validate payment amount
      if (data.amount > remaining) {
        throw new BadRequestException(
          `Payment amount (${data.amount}) exceeds remaining balance (${remaining.toFixed(2)})`,
        );
      }

      const newPaidAmount = currentPaid + data.amount;
      const newStatus = this.resolveStatus(invoice.status, total, newPaidAmount);

      // 3. Create Payment record
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: METHOD_MAP[data.method] ?? data.method.toUpperCase(),
          notes: data.notes ?? null,
          date: data.date ?? new Date(),
        },
      });

      // 4. Update invoice paidAmount and status
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      // 5. Create AccountTransaction if method is 'account' and invoice has an accountId
      if (data.method === 'account' && invoice.accountId) {
        const account = await tx.account.findUnique({
          where: { id: invoice.accountId },
          select: { id: true, balance: true },
        });

        if (account) {
          // Debit the account (customer is paying off their debt — reduces outstanding balance)
          // Convention: debit = money going out from the account's perspective (reduces balance)
          const currentBalance = Number(account.balance);
          const balanceAfter = currentBalance - data.amount;

          await tx.accountTransaction.create({
            data: {
              tenantId,
              accountId: invoice.accountId,
              type: 'debit',
              amount: data.amount,
              description: `Payment for invoice ${invoice.invoiceNo}`,
              referenceType: 'payment',
              referenceId: payment.id,
              balanceAfter,
              date: data.date ?? new Date(),
            },
          });

          await tx.account.update({
            where: { id: invoice.accountId },
            data: { balance: balanceAfter },
          });
        }
      }

      return payment;
    });
  }

  /**
   * Returns all payments for a given invoice, ordered by date descending.
   */
  async getPayments(invoiceId: string) {
    // Verify invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { date: 'desc' },
    });
  }
}
