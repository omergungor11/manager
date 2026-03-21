'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import type {
  Invoice,
  InvoicePayment,
  InvoiceStatus,
  PaymentFormValues,
  PaymentMethod,
} from '@/types/invoice';
import PaymentModal from '../components/payment-modal';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gonderildi',
  PAID: 'Odendi',
  PARTIALLY_PAID: 'Kismi Odeme',
  OVERDUE: 'Vadesi Gecmis',
  CANCELLED: 'Iptal',
};

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Nakit',
  CARD: 'Kredi Karti',
  BANK_TRANSFER: 'Havale / EFT',
  ACCOUNT: 'Cari Hesap',
};

function formatMoney(value: number): string {
  return `\u20BA${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function downloadPdf(invoiceId: string, invoiceNumber: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  fetch(`${apiBase}/invoices/${invoiceId}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error('PDF indirilemedi.');
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fatura-${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((err: unknown) => {
      alert(err instanceof Error ? err.message : 'PDF indirilemedi.');
    });
}

function SummaryRow({
  label,
  value,
  bold = false,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: 'red' | 'green';
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
      <span
        className={`text-sm ${
          bold ? 'font-bold text-gray-900' : ''
        } ${
          highlight === 'red'
            ? 'text-red-600 font-semibold'
            : highlight === 'green'
              ? 'text-green-600 font-semibold'
              : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [invoiceRes, paymentsRes] = await Promise.all([
        apiClient.get<Invoice>(`/invoices/${id}`),
        apiClient.get<InvoicePayment[]>(`/invoices/${id}/payments`),
      ]);
      setInvoice(invoiceRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      setLoadError(
        err instanceof ApiClientError ? err.message : 'Fatura yuklenemedi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchInvoice();
  }, [fetchInvoice]);

  async function handleCancel() {
    if (
      !confirm(
        'Bu faturayı iptal etmek istediginizden emin misiniz? Bu islem geri alinamaz.',
      )
    ) {
      return;
    }
    setIsCancelling(true);
    try {
      const res = await apiClient.patch<Invoice>(`/invoices/${id}/cancel`, {});
      setInvoice(res.data);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Iptal islemi basarisiz.');
    } finally {
      setIsCancelling(false);
    }
  }

  async function handlePaymentSubmit(values: PaymentFormValues) {
    const amount = parseFloat(values.amount.replace(',', '.'));
    await apiClient.post(`/invoices/${id}/payments`, {
      amount,
      method: values.method,
      date: values.date,
      notes: values.notes || undefined,
    });
    setPaymentModalOpen(false);
    void fetchInvoice();
  }

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-gray-500">Yukleniyor...</div>;
  }

  if (loadError || !invoice) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-600">{loadError ?? 'Fatura bulunamadi.'}</p>
        <Link
          href="/invoices"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
        >
          Listeye don
        </Link>
      </div>
    );
  }

  const isCancelled = invoice.status === 'CANCELLED';
  const canCancel = !isCancelled && invoice.status !== 'PAID';
  const canPay = !isCancelled && invoice.remainingAmount > 0;

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/invoices" className="hover:text-gray-900">
            Faturalar
          </Link>
          <span>/</span>
          <span className="font-mono text-gray-900 font-medium">{invoice.invoiceNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[invoice.status]}`}
              >
                {STATUS_LABEL[invoice.status]}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>Tarih: {formatDate(invoice.issueDate)}</span>
              {invoice.dueDate && (
                <span>Vade: {formatDate(invoice.dueDate)}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canPay && (
              <button
                type="button"
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Odeme Kaydet
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadPdf(invoice.id, invoice.invoiceNumber)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              PDF Indir
            </button>
            {canCancel && (
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={isCancelling}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Iptal ediliyor...' : 'Iptal Et'}
              </button>
            )}
          </div>
        </div>

        {/* Two-column info area */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Musteri Bilgileri
            </h2>
            {invoice.customer ? (
              <div className="space-y-1">
                <p className="text-base font-medium text-gray-900">
                  {invoice.customer.name}
                </p>
                {invoice.customer.phone && (
                  <p className="text-sm text-gray-500">{invoice.customer.phone}</p>
                )}
                {invoice.customer.email && (
                  <p className="text-sm text-gray-500">{invoice.customer.email}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Musteri bilgisi yok</p>
            )}
          </div>

          {/* Work order */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Ilgili Is Emri
            </h2>
            {invoice.workOrder ? (
              <Link
                href={`/work-orders/${invoice.workOrder.id}`}
                className="text-base font-medium text-blue-600 hover:text-blue-800"
              >
                {invoice.workOrder.orderNumber}
              </Link>
            ) : (
              <p className="text-sm text-gray-400">Is emri bagli degil</p>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Fatura Kalemleri</h2>
          </div>
          {invoice.items.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Kalem bulunamadi.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aciklama
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miktar
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Birim Fiyat
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toplam
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {item.quantity.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                        {formatMoney(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="ml-auto max-w-xs divide-y divide-gray-100">
              <SummaryRow label="Ara Toplam" value={formatMoney(invoice.subtotal)} />
              <SummaryRow label="KDV" value={formatMoney(invoice.taxAmount)} />
              <SummaryRow
                label="Genel Toplam"
                value={formatMoney(invoice.totalAmount)}
                bold
              />
              <SummaryRow
                label="Odenen"
                value={formatMoney(invoice.paidAmount)}
                highlight="green"
              />
              <SummaryRow
                label="Kalan Tutar"
                value={formatMoney(invoice.remainingAmount)}
                highlight={invoice.remainingAmount > 0 ? 'red' : undefined}
                bold={invoice.remainingAmount > 0}
              />
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Odeme Gecmisi</h2>
            {payments.length > 0 && (
              <span className="text-xs text-gray-500">{payments.length} odeme</span>
            )}
          </div>
          {payments.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Henuz odeme kaydedilmemis.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yontem
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notlar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {METHOD_LABEL[payment.method]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatMoney(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {payment.notes ?? <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        remainingAmount={invoice.remainingAmount}
        onSubmit={handlePaymentSubmit}
        onClose={() => setPaymentModalOpen(false)}
      />
    </>
  );
}
