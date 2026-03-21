'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';
import type { Customer, CustomerFormValues, CustomerType } from '@/types/customer';
import CustomerTable from './components/customer-table';
import CustomerModal from './components/customer-modal';

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | undefined>(undefined);

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

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: LIMIT,
        sortBy: 'name',
        sortOrder: 'asc',
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;

      const res = await apiClient.get<Customer[]>('/customers', params);
      setCustomers(res.data);
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
        err instanceof ApiClientError ? err.message : 'Müşteriler yüklenemedi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  async function handleCreate(values: CustomerFormValues) {
    await apiClient.post<Customer>('/customers', values);
    setModalOpen(false);
    setPage(1);
    void fetchCustomers();
  }

  async function handleEdit(values: CustomerFormValues) {
    if (!editTarget) return;
    await apiClient.patch<Customer>(`/customers/${editTarget.id}`, values);
    setModalOpen(false);
    setEditTarget(undefined);
    void fetchCustomers();
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;
    setIsDeleting(id);
    try {
      await apiClient.delete<Customer>(`/customers/${id}`);
      void fetchCustomers();
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

  function openEdit(customer: Customer) {
    setEditTarget(customer);
    setModalOpen(true);
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTypeFilter(e.target.value as CustomerType | '');
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
            <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
            <p className="mt-1 text-sm text-gray-500">
              {meta.total > 0 ? `${meta.total} müşteri` : 'Henüz müşteri yok'}
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
            Yeni Müşteri
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
              placeholder="Ad, telefon veya vergi no ile ara..."
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
            <option value="">Tüm Tipler</option>
            <option value="individual">Bireysel</option>
            <option value="company">Kurumsal</option>
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
                onClick={() => void fetchCustomers()}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Tekrar dene
              </button>
            </div>
          ) : (
            <CustomerTable
              customers={customers}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
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
              <span className="font-medium">{meta.total}</span> müşteri
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

      {/* Modal */}
      <CustomerModal
        isOpen={modalOpen}
        title={editTarget ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}
        customer={editTarget}
        onSubmit={editTarget ? handleEdit : handleCreate}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(undefined);
        }}
      />
    </>
  );
}
