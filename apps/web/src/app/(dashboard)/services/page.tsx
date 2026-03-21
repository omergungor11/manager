'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type {
  ServiceCategory,
  Service,
  CreateCategoryPayload,
  CreateServicePayload,
} from './types';
import CategoryForm from './components/category-form';
import ServiceForm from './components/service-form';

type ModalState =
  | { type: 'none' }
  | { type: 'add-category' }
  | { type: 'edit-category'; category: ServiceCategory }
  | { type: 'add-service' }
  | { type: 'edit-service'; service: Service };

function formatPrice(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`;
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (selectFirst = false) => {
    try {
      setLoadingCategories(true);
      const res = await apiClient.get<ServiceCategory[]>('/service-categories');
      setCategories(res.data);
      if (selectFirst && res.data.length > 0) {
        setSelectedCategoryId(res.data[0]?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategoriler yüklenemedi.');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadServices = useCallback(async (categoryId: string) => {
    try {
      setLoadingServices(true);
      const res = await apiClient.get<Service[]>('/services', { categoryId });
      setServices(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hizmetler yüklenemedi.');
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories(true);
  }, [loadCategories]);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      void loadServices(selectedCategoryId);
    } else {
      setServices([]);
    }
  }, [selectedCategoryId, loadServices]);

  const handleCategorySubmit = async (payload: CreateCategoryPayload) => {
    if (modal.type === 'edit-category') {
      await apiClient.patch<ServiceCategory>(
        `/service-categories/${modal.category.id}`,
        payload,
      );
    } else {
      await apiClient.post<ServiceCategory>('/service-categories', payload);
    }
    setModal({ type: 'none' });
    await loadCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    try {
      setDeletingId(id);
      await apiClient.delete(`/service-categories/${id}`);
      if (selectedCategoryId === id) {
        setSelectedCategoryId(null);
      }
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleServiceSubmit = async (payload: CreateServicePayload) => {
    const servicePayload = {
      ...payload,
      categoryId: payload.categoryId || selectedCategoryId,
    };
    if (modal.type === 'edit-service') {
      await apiClient.patch<Service>(`/services/${modal.service.id}`, servicePayload);
    } else {
      await apiClient.post<Service>('/services', servicePayload);
    }
    setModal({ type: 'none' });
    if (selectedCategoryId !== null) {
      await loadServices(selectedCategoryId);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Bu hizmeti devre dışı bırakmak istediğinizden emin misiniz?')) return;
    try {
      setDeletingId(id);
      await apiClient.delete(`/services/${id}`);
      if (selectedCategoryId !== null) {
        await loadServices(selectedCategoryId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hizmet silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedCategory =
    selectedCategoryId !== null
      ? categories.find((c) => c.id === selectedCategoryId) ?? null
      : null;

  const isModalOpen = modal.type !== 'none';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hizmet Katalogu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Servis kategorilerini ve hizmetlerini yönetin.
        </p>
      </div>

      {error !== null && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700 font-medium"
          >
            Kapat
          </button>
        </div>
      )}

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Left panel: Categories */}
        <div className="w-72 flex-shrink-0 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Kategoriler
            </h2>
            <button
              type="button"
              onClick={() => setModal({ type: 'add-category' })}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Ekle
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingCategories ? (
              <div className="py-8 text-center text-sm text-gray-400">
                Yükleniyor...
              </div>
            ) : categories.length === 0 ? (
              <div className="py-8 px-4 text-center text-sm text-gray-400">
                Henüz kategori yok.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors ${
                        selectedCategoryId === cat.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                      <div
                        className="flex items-center gap-1 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setModal({ type: 'edit-category', category: cat })
                          }
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Düzenle"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCategory(cat.id)}
                          disabled={deletingId === cat.id}
                          className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                          title="Sil"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right panel: Services */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {selectedCategory !== null ? selectedCategory.name : 'Hizmetler'}
            </h2>
            {selectedCategoryId !== null && (
              <button
                type="button"
                onClick={() => setModal({ type: 'add-service' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Yeni Hizmet
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedCategoryId === null ? (
              <div className="py-16 text-center text-sm text-gray-400">
                Hizmetleri görmek için bir kategori seçin.
              </div>
            ) : loadingServices ? (
              <div className="py-16 text-center text-sm text-gray-400">
                Yükleniyor...
              </div>
            ) : services.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                Bu kategoride henüz hizmet yok.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Hizmet Adı
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fiyat
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Süre
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Durum
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">İşlemler</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/services/${svc.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {svc.name}
                        </Link>
                        {svc.description !== null && svc.description !== '' && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {svc.description}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(svc.defaultPrice)} TL
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {formatDuration(svc.estimatedDuration ?? null)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            svc.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {svc.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setModal({ type: 'edit-service', service: svc })
                            }
                            className="text-gray-500 hover:text-blue-600"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteService(svc.id)}
                            disabled={deletingId === svc.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            {deletingId === svc.id ? '...' : 'Devre Dışı'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModal({ type: 'none' })}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {modal.type === 'add-category' && 'Yeni Kategori'}
                {modal.type === 'edit-category' && 'Kategori Düzenle'}
                {modal.type === 'add-service' && 'Yeni Hizmet'}
                {modal.type === 'edit-service' && 'Hizmet Düzenle'}
              </h3>
            </div>
            <div className="px-6 py-5">
              {(modal.type === 'add-category' ||
                modal.type === 'edit-category') && (
                <CategoryForm
                  initialData={
                    modal.type === 'edit-category' ? modal.category : undefined
                  }
                  onSubmit={handleCategorySubmit}
                  onCancel={() => setModal({ type: 'none' })}
                />
              )}
              {(modal.type === 'add-service' ||
                modal.type === 'edit-service') && (
                <ServiceForm
                  categories={categories}
                  initialData={
                    modal.type === 'edit-service' ? modal.service : undefined
                  }
                  defaultCategoryId={selectedCategoryId ?? undefined}
                  onSubmit={handleServiceSubmit}
                  onCancel={() => setModal({ type: 'none' })}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
