'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import type { Account, AccountFormValues, AccountType } from '@/types/account';
import AccountForm from './components/account-form';

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

const TYPE_LABEL: Record<AccountType, string> = {
  CUSTOMER: 'Müşteri',
  SUPPLIER: 'Tedarikçi',
  OTHER: 'Diğer',
};

const TYPE_BADGE: Record<AccountType, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  SUPPLIER: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-700',
};

function formatBalance(balance: number): { text: string; className: string; label: string } {
  const formatted = Math.abs(balance).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (balance > 0) {
    return {
      text: `${formatted} ₺`,
      className: 'text-green-600 font-semibold',
      label: 'Alacaklı',
    };
  }
  if (balance < 0) {
    return {
      text: `${formatted} ₺`,
      className: 'text-red-600 font-semibold',
      label: 'Borçlu',
    };
  }
  return {
    text: `0,00 ₺`,
    className: 'text-gray-500',
    label: '',
  };
}

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
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountType | ''>('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | undefined>(undefined);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;

      const res = await apiClient.get<Account[]>('/accounts', params);
      setAccounts(res.data);
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
        err instanceof ApiClientError ? err.message : 'Cari hesaplar yüklenemedi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter]);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  async function handleCreate(values: AccountFormValues) {
    await apiClient.post<Account>('/accounts', values);
    setModalOpen(false);
    setPage(1);
    void fetchAccounts();
  }

  async function handleEdit(values: AccountFormValues) {
    if (!editTarget) return;
    await apiClient.patch<Account>(`/accounts/${editTarget.id}`, values);
    setModalOpen(false);
    setEditTarget(undefined);
    void fetchAccounts();
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu cari hesabı silmek istediğinizden emin misiniz?')) return;
    setIsDeleting(id);
    try {
      await apiClient.delete<Account>(`/accounts/${id}`);
      void fetchAccounts();
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

  function openEdit(account: Account) {
    setEditTarget(account);
    setModalOpen(true);
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTypeFilter(e.target.value as AccountType | '');
    setPage(1);
  }

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cari Hesaplar</h1>
            <p className="mt-1 text-sm text-gray-500">
              {meta.total > 0 ? `${meta.total} cari hesap` : 'Henüz cari hesap yok'}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yeni Cari Hesap
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Ad, kod veya vergi no ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={handleTypeChange}
            className={inputClass}
          >
            <option value="">Tüm Türler</option>
            <option value="CUSTOMER">Müşteri</option>
            <option value="SUPPLIER">Tedarikçi</option>
            <option value="OTHER">Diğer</option>
          </select>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Yükleniyor...
            </div>
          ) : loadError ? (
            <div className="py-16 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <button
                type="button"
                onClick={() => void fetchAccounts()}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Tekrar dene
              </button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              {debouncedSearch || typeFilter
                ? 'Arama kriterlerine uygun cari hesap bulunamadı.'
                : 'Henüz cari hesap eklenmemiş.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad / Unvan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tür
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bakiye
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => {
                    const balanceInfo = formatBalance(
                      (account as Account & { balance?: number }).balance ?? 0,
                    );
                    return (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600">{account.code}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/accounts/${account.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {account.name}
                          </Link>
                          {account.phone && (
                            <p className="text-xs text-gray-400 mt-0.5">{account.phone}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[account.type]}`}
                          >
                            {TYPE_LABEL[account.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={balanceInfo.className}>{balanceInfo.text}</span>
                          {balanceInfo.label && (
                            <span
                              className={`ml-2 text-xs ${
                                balanceInfo.label === 'Alacaklı'
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }`}
                            >
                              {balanceInfo.label}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(account)}
                              className="text-sm text-gray-600 hover:text-gray-900"
                            >
                              Düzenle
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => void handleDelete(account.id)}
                              disabled={isDeleting === account.id}
                              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDeleting === account.id ? 'Siliniyor...' : 'Sil'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              <span className="font-medium">{meta.total}</span> cari hesap
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

      <Modal
        isOpen={modalOpen}
        title={editTarget ? 'Cari Hesabı Düzenle' : 'Yeni Cari Hesap'}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(undefined);
        }}
      >
        <AccountForm
          initialData={editTarget}
          onSubmit={editTarget ? handleEdit : handleCreate}
          onCancel={() => {
            setModalOpen(false);
            setEditTarget(undefined);
          }}
          submitLabel={editTarget ? 'Güncelle' : 'Ekle'}
        />
      </Modal>
    </>
  );
}
