'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import type {
  WorkOrderListItem,
  WorkOrderStatus,
  WorkOrderListParams,
} from '@/types/work-order';
import { STATUS_LABEL, STATUS_BADGE_CLASS } from '@/types/work-order';

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

type StatusFilter = WorkOrderStatus | '';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'DRAFT', label: 'Taslak' },
  { value: 'IN_PROGRESS', label: 'Devam Eden' },
  { value: 'COMPLETED', label: 'Tamamlanan' },
  { value: 'INVOICED', label: 'Faturalanan' },
  { value: 'CANCELLED', label: 'İptal' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(amount: number): string {
  return (
    '₺' +
    amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrderListItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params: WorkOrderListParams = {
        page,
        limit: LIMIT,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get<WorkOrderListItem[]>('/work-orders', params as Record<string, string | number | boolean | undefined | null>);
      setOrders(res.data);
      if (res.meta) {
        setMeta({
          total: res.meta.total ?? 0,
          page: res.meta.page ?? 1,
          limit: res.meta.limit ?? LIMIT,
          totalPages: res.meta.totalPages ?? 0,
        });
      }
    } catch (err) {
      setLoadError(
        err instanceof ApiClientError ? err.message : 'İş emirleri yüklenemedi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  function handleStatusTab(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İş Emirleri</h1>
          <p className="mt-1 text-sm text-gray-500">
            {meta.total > 0 ? `${meta.total} iş emri` : 'Henüz iş emri yok'}
          </p>
        </div>
        <Link
          href="/work-orders/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yeni İş Emri
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusTab(tab.value)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Yükleniyor...</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Tekrar dene
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {statusFilter
              ? `"${STATUS_LABEL[statusFilter as WorkOrderStatus]}" durumunda iş emri bulunamadı.`
              : 'Henüz iş emri oluşturulmamış.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Araç (Plaka)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teknisyen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/work-orders/${order.id}`}
                        className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {order.orderNo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                      {order.customer.phone && (
                        <p className="text-xs text-gray-500">{order.customer.phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {order.vehicle.licensePlate}
                      </span>
                      {(order.vehicle.brandName ?? order.vehicle.modelName) && (
                        <p className="text-xs text-gray-500">
                          {[order.vehicle.brandName, order.vehicle.modelName]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[order.status]}`}
                      >
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.technician?.name ?? (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatMoney(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/work-orders/${order.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Detay
                      </Link>
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
            <span className="font-medium">{meta.total}</span> iş emri
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
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
