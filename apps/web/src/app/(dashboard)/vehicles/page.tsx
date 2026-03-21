'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import VehicleTable from './components/vehicle-table';
import type { Vehicle } from './types';

interface VehicleMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [meta, setMeta] = useState<VehicleMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVehicles = useCallback(
    async (searchValue: string, pageValue: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<Vehicle[]>('/vehicles', {
          search: searchValue || undefined,
          page: pageValue,
          limit: PAGE_SIZE,
        });
        setVehicles(res.data);
        if (res.meta) {
          setMeta({
            total: res.meta.total ?? 0,
            page: res.meta.page ?? pageValue,
            limit: res.meta.limit ?? PAGE_SIZE,
            totalPages: res.meta.totalPages ?? 1,
          });
        }
      } catch (err) {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Araclar yuklenirken bir hata olustu.',
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    void fetchVehicles(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);
    setPage(1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchVehicles(value, 1);
    }, 400);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    void fetchVehicles(search, newPage);
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu araci silmek istediginizden emin misiniz?')) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert(
        err instanceof ApiClientError
          ? err.message
          : 'Arac silinirken bir hata olustu.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  const startItem = (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Araclar</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500">
              Toplam {meta.total.toLocaleString('tr-TR')} arac
            </p>
          )}
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Yeni Arac
        </Link>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Plaka, marka veya model ile ara..."
          className="w-full max-w-md rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Yukluyor...
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button
              type="button"
              onClick={() => void fetchVehicles(search, page)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Tekrar dene
            </button>
          </div>
        ) : (
          <VehicleTable
            vehicles={vehicles}
            onDelete={handleDelete}
            isDeleting={deletingId}
          />
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            {startItem}–{endItem} / {meta.total.toLocaleString('tr-TR')} sonuc
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Onceki
            </button>
            <span className="px-3 py-1.5">
              {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
