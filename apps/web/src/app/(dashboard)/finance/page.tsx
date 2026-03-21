'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';
import ExpenseForm from './components/expense-form';
import type { Expense, ExpenseFormValues } from './components/expense-form';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface IncomeRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  source: string | null;
}

interface SummaryCategory {
  category: string;
  total: number;
}

interface Summary {
  categories: SummaryCategory[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return (
    '₺' +
    Math.abs(amount).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Kapat"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  meta,
  page,
  isLoading,
  onPageChange,
  label,
}: {
  meta: Meta;
  page: number;
  isLoading: boolean;
  onPageChange: (p: number) => void;
  label: string;
}) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-700">
        Sayfa <span className="font-medium">{meta.page}</span>
        {' / '}
        <span className="font-medium">{meta.totalPages}</span>
        {' — '}
        <span className="font-medium">{meta.total}</span> {label}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || isLoading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Önceki
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
          disabled={page >= meta.totalPages || isLoading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LIMIT = 20;

type Tab = 'gelirler' | 'giderler';

export default function FinancePage() {
  const { year: curYear, month: curMonth } = currentYearMonth();

  // Summary state
  const [incomeSummary, setIncomeSummary] = useState<Summary | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Active tab
  const [tab, setTab] = useState<Tab>('gelirler');

  // Date range filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Income list state
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [incomeMeta, setIncomeMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [incomePage, setIncomePage] = useState(1);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeError, setIncomeError] = useState<string | null>(null);

  // Expense list state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseMeta, setExpenseMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [expensePage, setExpensePage] = useState(1);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Expense modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // ─── Fetch summary ──────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [incRes, expRes] = await Promise.all([
        apiClient.get<Summary>('/income/summary', { year: curYear, month: curMonth }),
        apiClient.get<Summary>('/expenses/summary', { year: curYear, month: curMonth }),
      ]);
      setIncomeSummary(incRes.data);
      setExpenseSummary(expRes.data);
    } catch {
      // non-critical — summary cards stay empty
    } finally {
      setSummaryLoading(false);
    }
  }, [curYear, curMonth]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  // ─── Fetch incomes ──────────────────────────────────────────────────────────

  const fetchIncomes = useCallback(async () => {
    setIncomeLoading(true);
    setIncomeError(null);
    try {
      const params: Record<string, string | number> = { page: incomePage, limit: LIMIT };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await apiClient.get<IncomeRecord[]>('/income', params);
      setIncomes(res.data);
      if (res.meta) {
        setIncomeMeta({
          total: res.meta.total ?? 0,
          page: res.meta.page ?? 1,
          limit: res.meta.limit ?? LIMIT,
          totalPages: res.meta.totalPages ?? 0,
        });
      }
    } catch (err) {
      setIncomeError(
        err instanceof ApiClientError ? err.message : 'Gelirler yüklenemedi.',
      );
    } finally {
      setIncomeLoading(false);
    }
  }, [incomePage, dateFrom, dateTo]);

  useEffect(() => {
    if (tab === 'gelirler') void fetchIncomes();
  }, [tab, fetchIncomes]);

  // ─── Fetch expenses ─────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    setExpenseLoading(true);
    setExpenseError(null);
    try {
      const params: Record<string, string | number> = { page: expensePage, limit: LIMIT };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await apiClient.get<Expense[]>('/expenses', params);
      setExpenses(res.data);
      if (res.meta) {
        setExpenseMeta({
          total: res.meta.total ?? 0,
          page: res.meta.page ?? 1,
          limit: res.meta.limit ?? LIMIT,
          totalPages: res.meta.totalPages ?? 0,
        });
      }
    } catch (err) {
      setExpenseError(
        err instanceof ApiClientError ? err.message : 'Giderler yüklenemedi.',
      );
    } finally {
      setExpenseLoading(false);
    }
  }, [expensePage, dateFrom, dateTo]);

  useEffect(() => {
    if (tab === 'giderler') void fetchExpenses();
  }, [tab, fetchExpenses]);

  // ─── Expense CRUD ────────────────────────────────────────────────────────────

  async function handleCreateExpense(values: ExpenseFormValues) {
    await apiClient.post<Expense>('/expenses', values);
    setModalOpen(false);
    setExpensePage(1);
    void fetchExpenses();
    void fetchSummary();
  }

  async function handleEditExpense(values: ExpenseFormValues) {
    if (!editTarget) return;
    await apiClient.patch<Expense>(`/expenses/${editTarget.id}`, values);
    setModalOpen(false);
    setEditTarget(undefined);
    void fetchExpenses();
    void fetchSummary();
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Bu gideri silmek istediğinizden emin misiniz?')) return;
    setIsDeleting(id);
    try {
      await apiClient.delete<unknown>(`/expenses/${id}`);
      void fetchExpenses();
      void fetchSummary();
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Silme işlemi başarısız.');
    } finally {
      setIsDeleting(null);
    }
  }

  function openCreate() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditTarget(expense);
    setModalOpen(true);
  }

  function handleFilterChange() {
    setIncomePage(1);
    setExpensePage(1);
  }

  // ─── Derived values ──────────────────────────────────────────────────────────

  const totalIncome = incomeSummary?.total ?? 0;
  const totalExpense = expenseSummary?.total ?? 0;
  const netProfit = totalIncome - totalExpense;

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finans</h1>
          <p className="mt-1 text-sm text-gray-500">Gelir ve gider yönetimi</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Toplam Gelir */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-medium text-green-700">Toplam Gelir</p>
            <p className="mt-2 text-2xl font-bold text-green-800">
              {summaryLoading ? '...' : formatMoney(totalIncome)}
            </p>
            <p className="mt-1 text-xs text-green-600">Bu ay</p>
          </div>

          {/* Toplam Gider */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">Toplam Gider</p>
            <p className="mt-2 text-2xl font-bold text-red-800">
              {summaryLoading ? '...' : formatMoney(totalExpense)}
            </p>
            <p className="mt-1 text-xs text-red-600">Bu ay</p>
          </div>

          {/* Net Kar/Zarar */}
          <div
            className={`rounded-lg border p-5 ${
              netProfit >= 0
                ? 'border-blue-200 bg-blue-50'
                : 'border-orange-200 bg-orange-50'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}
            >
              Net {netProfit >= 0 ? 'Kar' : 'Zarar'}
            </p>
            <p
              className={`mt-2 text-2xl font-bold ${
                netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'
              }`}
            >
              {summaryLoading ? '...' : formatMoney(netProfit)}
            </p>
            <p
              className={`mt-1 text-xs ${
                netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}
            >
              Bu ay
            </p>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç Tarihi</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                handleFilterChange();
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş Tarihi</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                handleFilterChange();
              }}
              className={inputClass}
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                handleFilterChange();
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Filtreyi Temizle
            </button>
          )}
        </div>

        {/* Tabs */}
        <div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              {(
                [
                  { key: 'gelirler', label: 'Gelirler' },
                  { key: 'giderler', label: 'Giderler' },
                ] as { key: Tab; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-4">
            {/* ── Gelirler tab ── */}
            {tab === 'gelirler' && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {incomeLoading ? (
                    <div className="py-16 text-center text-sm text-gray-500">Yükleniyor...</div>
                  ) : incomeError ? (
                    <div className="py-16 text-center">
                      <p className="text-sm text-red-600">{incomeError}</p>
                      <button
                        type="button"
                        onClick={() => void fetchIncomes()}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Tekrar dene
                      </button>
                    </div>
                  ) : incomes.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                      Bu dönemde gelir kaydı bulunamadı.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kaynak</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {incomes.map((income) => (
                            <tr key={income.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(income.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  {income.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                {income.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-700">
                                {formatMoney(income.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {income.source ?? <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <Pagination
                  meta={incomeMeta}
                  page={incomePage}
                  isLoading={incomeLoading}
                  onPageChange={setIncomePage}
                  label="gelir"
                />
              </div>
            )}

            {/* ── Giderler tab ── */}
            {tab === 'giderler' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Yeni Gider
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {expenseLoading ? (
                    <div className="py-16 text-center text-sm text-gray-500">Yükleniyor...</div>
                  ) : expenseError ? (
                    <div className="py-16 text-center">
                      <p className="text-sm text-red-600">{expenseError}</p>
                      <button
                        type="button"
                        onClick={() => void fetchExpenses()}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Tekrar dene
                      </button>
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                      Bu dönemde gider kaydı bulunamadı.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(expense.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                  {expense.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                {expense.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-700">
                                {formatMoney(expense.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(expense)}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                  >
                                    Düzenle
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteExpense(expense.id)}
                                    disabled={isDeleting === expense.id}
                                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isDeleting === expense.id ? 'Siliniyor...' : 'Sil'}
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

                <Pagination
                  meta={expenseMeta}
                  page={expensePage}
                  isLoading={expenseLoading}
                  onPageChange={setExpensePage}
                  label="gider"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense modal */}
      <Modal
        isOpen={modalOpen}
        title={editTarget ? 'Gideri Düzenle' : 'Yeni Gider'}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(undefined);
        }}
      >
        <ExpenseForm
          initialData={editTarget}
          onSubmit={editTarget ? handleEditExpense : handleCreateExpense}
          onCancel={() => {
            setModalOpen(false);
            setEditTarget(undefined);
          }}
          submitLabel={editTarget ? 'Güncelle' : 'Gider Ekle'}
        />
      </Modal>
    </>
  );
}
