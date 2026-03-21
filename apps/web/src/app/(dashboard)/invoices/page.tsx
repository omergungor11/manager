'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import type { InvoiceListItem, InvoiceStatus } from '@/types/invoice';

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

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

const STATUS_FILTER_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'Tumu' },
  { value: 'DRAFT', label: 'Taslak' },
  { value: 'SENT', label: 'Gonderildi' },
  { value: 'PAID', label: 'Odendi' },
  { value: 'PARTIALLY_PAID', label: 'Kismi Odeme' },
  { value: 'OVERDUE', label: 'Vadesi Gecmis' },
  { value: 'CANCELLED', label: 'Iptal' },
];

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await apiClient.get<InvoiceListItem[]>('/invoices', params);
      setInvoices(res.data);
      if (res.meta) {
        setMeta({
          total: res.meta.total ?? 0,
          page: res.meta.page ?? 1,
          limit: res.meta.limit ?? LIMIT,
          totalPages: res.meta.totalPages ?? 0,
        });
      }
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : 'Faturalar yuklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatusFilter(e.target.value as InvoiceStatus | '');
    setPage(1);
  }

  function handleDateFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDateFrom(e.target.value);
    setPage(1);
  }

  function handleDateToChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDateTo(e.target.value);
    setPage(1);
  }

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturalar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {meta.total > 0 ? `${meta.total} fatura` : 'Henuz fatura yok'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className={inputClass}
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-sm text-gray-600 whitespace-nowrap">
            Baslangic:
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="date-to" className="text-sm text-gray-600 whitespace-nowrap">
            Bitis:
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={handleDateToChange}
            className={inputClass}
          />
        </div>

        {(statusFilter || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Yukleniyor...</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchInvoices()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Tekrar dene
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {statusFilter || dateFrom || dateTo
              ? 'Arama kriterlerine uygun fatura bulunamadi.'
              : 'Henuz fatura bulunmuyor.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fatura No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Musteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vade
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Odenen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kalan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Islemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-sm font-mono font-medium text-blue-600 hover:text-blue-800"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {invoice.customer?.name ?? <span className="text-gray-400">—</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatMoney(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {formatMoney(invoice.paidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span
                        className={
                          invoice.remainingAmount > 0
                            ? 'text-red-600 font-medium'
                            : 'text-gray-500'
                        }
                      >
                        {formatMoney(invoice.remainingAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[invoice.status]}`}
                      >
                        {STATUS_LABEL[invoice.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Detay
                        </Link>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => downloadPdf(invoice.id, invoice.invoiceNumber)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          PDF Indir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Sayfa{' '}
            <span className="font-medium">{meta.page}</span>
            {' / '}
            <span className="font-medium">{meta.totalPages}</span>
            {' — '}
            <span className="font-medium">{meta.total}</span> fatura
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Onceki
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
