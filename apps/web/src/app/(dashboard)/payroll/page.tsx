'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type PayrollStatus = 'draft' | 'approved' | 'paid';

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  grossSalary: number;
  sgkEmployee: number;
  providentEmployee: number;
  incomeTax: number;
  netSalary: number;
  status: PayrollStatus;
}

interface PayrollReport {
  totalGross: number;
  totalNet: number;
  totalSgk: number;
  totalProvident: number;
  totalTax: number;
  count: number;
  byStatus: Record<PayrollStatus, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return (
    '₺' +
    amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

const STATUS_LABEL: Record<PayrollStatus, string> = {
  draft: 'Taslak',
  approved: 'Onaylı',
  paid: 'Ödendi',
};

const STATUS_CLASS: Record<PayrollStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
};

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LIMIT = 20;

export default function PayrollPage() {
  const { year: curYear, month: curMonth } = currentYearMonth();

  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [selectedYear, setSelectedYear] = useState(curYear);

  // List state
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Report state
  const [report, setReport] = useState<PayrollReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ─── Fetch payrolls ─────────────────────────────────────────────────────────

  const fetchPayrolls = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<PayrollRecord[]>('/payroll', {
        month: selectedMonth,
        year: selectedYear,
        page,
        limit: LIMIT,
      });
      setRecords(res.data);
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
        err instanceof ApiClientError ? err.message : 'Bordro listesi yüklenemedi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, page]);

  useEffect(() => {
    void fetchPayrolls();
  }, [fetchPayrolls]);

  // ─── Fetch report ────────────────────────────────────────────────────────────

  const fetchReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await apiClient.get<PayrollReport>('/payroll/report', {
        month: selectedMonth,
        year: selectedYear,
      });
      setReport(res.data);
    } catch {
      // non-critical
    } finally {
      setReportLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function handleBulkCreate() {
    if (
      !confirm(
        `${MONTHS[selectedMonth - 1]} ${selectedYear} için tüm çalışanlara bordro oluşturulsun mu?`,
      )
    )
      return;

    setBulkLoading(true);
    try {
      await apiClient.post<unknown>('/payroll/bulk', {
        month: selectedMonth,
        year: selectedYear,
      });
      void fetchPayrolls();
      void fetchReport();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Toplu bordro oluşturulamadı.');
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await apiClient.patch<PayrollRecord>(`/payroll/${id}/approve`, {});
      void fetchPayrolls();
      void fetchReport();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Onaylama başarısız.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePay(id: string) {
    if (!confirm('Bu bordroyu ödendi olarak işaretlemek istiyor musunuz?')) return;
    setActionLoading(id);
    try {
      await apiClient.patch<PayrollRecord>(`/payroll/${id}/pay`, {});
      void fetchPayrolls();
      void fetchReport();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Ödeme işareti başarısız.');
    } finally {
      setActionLoading(null);
    }
  }

  function handleMonthChange(month: number, year: number) {
    setSelectedMonth(month);
    setSelectedYear(year);
    setPage(1);
  }

  const years = Array.from({ length: 5 }, (_, i) => curYear - 2 + i);

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bordro</h1>
          <p className="mt-1 text-sm text-gray-500">Maaş ve ödeme yönetimi</p>
        </div>
        <button
          type="button"
          onClick={() => void handleBulkCreate()}
          disabled={bulkLoading}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {bulkLoading ? 'Oluşturuluyor...' : 'Toplu Bordro Oluştur'}
        </button>
      </div>

      {/* Month/year selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(Number(e.target.value), selectedYear)}
          className={inputClass}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => handleMonthChange(selectedMonth, Number(e.target.value))}
          className={inputClass}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Brüt</p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {reportLoading ? '...' : formatMoney(report?.totalGross ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Net</p>
          <p className="mt-2 text-xl font-bold text-green-700">
            {reportLoading ? '...' : formatMoney(report?.totalNet ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam SGK</p>
          <p className="mt-2 text-xl font-bold text-blue-700">
            {reportLoading ? '...' : formatMoney(report?.totalSgk ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam İhtiyat</p>
          <p className="mt-2 text-xl font-bold text-purple-700">
            {reportLoading ? '...' : formatMoney(report?.totalProvident ?? 0)}
          </p>
        </div>
      </div>

      {/* Payroll table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Yükleniyor...</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchPayrolls()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Tekrar dene
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Bu dönem için bordro kaydı bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Çalışan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Brüt</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SGK</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İhtiyat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vergi</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{record.employeeName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatMoney(record.grossSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatMoney(record.sgkEmployee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatMoney(record.providentEmployee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      {formatMoney(record.incomeTax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-700">
                      {formatMoney(record.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[record.status]}`}
                      >
                        {STATUS_LABEL[record.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => void handleApprove(record.id)}
                            disabled={actionLoading === record.id}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === record.id ? '...' : 'Onayla'}
                          </button>
                        )}
                        {record.status === 'approved' && (
                          <>
                            {record.status === 'approved' && actionLoading !== record.id && (
                              <span className="text-gray-300">|</span>
                            )}
                            <button
                              type="button"
                              onClick={() => void handlePay(record.id)}
                              disabled={actionLoading === record.id}
                              className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === record.id ? '...' : 'Öde'}
                            </button>
                          </>
                        )}
                        {record.status === 'paid' && (
                          <span className="text-xs text-gray-400">Tamamlandı</span>
                        )}
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
            Sayfa <span className="font-medium">{meta.page}</span>
            {' / '}
            <span className="font-medium">{meta.totalPages}</span>
            {' — '}
            <span className="font-medium">{meta.total}</span> kayıt
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
