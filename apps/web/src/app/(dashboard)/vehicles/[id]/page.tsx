'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import VehicleForm from '../components/vehicle-form';
import type {
  Vehicle,
  ServiceHistoryItem,
  ServiceHistoryMeta,
  VehicleFormData,
} from '../types';

type TabId = 'info' | 'service-history' | 'ownership';

const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandi',
  INVOICED: 'Faturalandi',
  CANCELLED: 'Iptal',
};

const WORK_ORDER_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  INVOICED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vehicleId = params.id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([]);
  const [serviceHistoryMeta, setServiceHistoryMeta] =
    useState<ServiceHistoryMeta | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  // Fetch vehicle
  useEffect(() => {
    setLoadingVehicle(true);
    setVehicleError(null);
    apiClient
      .get<Vehicle>(`/vehicles/${vehicleId}`)
      .then((res) => setVehicle(res.data))
      .catch((err) => {
        setVehicleError(
          err instanceof ApiClientError
            ? err.message
            : 'Arac yuklenirken bir hata olustu.',
        );
      })
      .finally(() => setLoadingVehicle(false));
  }, [vehicleId]);

  // Fetch service history when tab is active
  const fetchServiceHistory = useCallback(
    async (page: number) => {
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        const res = await apiClient.get<ServiceHistoryItem[]>(
          `/vehicles/${vehicleId}/service-history`,
          { page, limit: 10 },
        );
        setServiceHistory(res.data);
        if (res.meta) {
          setServiceHistoryMeta(res.meta as ServiceHistoryMeta);
        }
      } catch (err) {
        setHistoryError(
          err instanceof ApiClientError
            ? err.message
            : 'Servis gecmisi yuklenirken hata olustu.',
        );
      } finally {
        setLoadingHistory(false);
      }
    },
    [vehicleId],
  );

  useEffect(() => {
    if (activeTab === 'service-history') {
      void fetchServiceHistory(historyPage);
    }
  }, [activeTab, historyPage, fetchServiceHistory]);

  async function handleEdit(formData: VehicleFormData) {
    setIsSubmitting(true);
    try {
      const payload = {
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        brandId: formData.brandId || undefined,
        modelId: formData.modelId || undefined,
        brandName: formData.brandName || undefined,
        modelName: formData.modelName || undefined,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        color: formData.color || undefined,
        vin: formData.vin || undefined,
        currentKm: parseInt(formData.currentKm, 10) || 0,
        notes: formData.notes || undefined,
      };
      const res = await apiClient.patch<Vehicle>(`/vehicles/${vehicleId}`, payload);
      setVehicle(res.data);
      setIsEditing(false);
    } catch (err) {
      setIsSubmitting(false);
      throw err instanceof ApiClientError
        ? new Error(err.message)
        : new Error('Arac guncellenemedi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Bu araci silmek istediginizden emin misiniz?')) return;
    try {
      await apiClient.delete(`/vehicles/${vehicleId}`);
      router.push('/vehicles');
    } catch (err) {
      alert(
        err instanceof ApiClientError
          ? err.message
          : 'Arac silinirken bir hata olustu.',
      );
    }
  }

  if (loadingVehicle) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">Yukluyor...</div>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-3">
          {vehicleError ?? 'Arac bulunamadi.'}
        </p>
        <Link href="/vehicles" className="text-sm text-blue-600 hover:text-blue-800">
          Arac listesine don
        </Link>
      </div>
    );
  }

  const vehicleTitle = [vehicle.brandName, vehicle.modelName]
    .filter(Boolean)
    .join(' ');

  const formInitialData: Partial<VehicleFormData> = {
    licensePlate: vehicle.licensePlate,
    brandId: vehicle.brandId ?? '',
    modelId: vehicle.modelId ?? '',
    brandName: vehicle.brandName ?? '',
    modelName: vehicle.modelName ?? '',
    year: vehicle.year != null ? String(vehicle.year) : '',
    color: vehicle.color ?? '',
    vin: vehicle.vin ?? '',
    currentKm: String(vehicle.currentKm),
    notes: vehicle.notes ?? '',
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'info', label: 'Bilgiler' },
    { id: 'service-history', label: 'Servis Gecmisi' },
    { id: 'ownership', label: 'Sahiplik Gecmisi' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/vehicles" className="hover:text-gray-700">
          Araclar
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium font-mono">
          {vehicle.licensePlate}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            {vehicle.licensePlate}
          </h1>
          {vehicleTitle && (
            <p className="mt-1 text-gray-600">
              {vehicleTitle}
              {vehicle.year != null && (
                <span className="ml-2 text-gray-400">({vehicle.year})</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Duzenle
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                Sil
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick info cards */}
      {!isEditing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Renk
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {vehicle.color ?? '—'}
            </dd>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mevcut Km
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {vehicle.currentKm.toLocaleString('tr-TR')} km
            </dd>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sasi No
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900 font-mono text-xs">
              {vehicle.vin ?? '—'}
            </dd>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sahip
            </dt>
            <dd className="mt-1 text-sm font-semibold text-gray-900">
              {vehicle.currentOwner?.name ?? (
                <span className="text-gray-400">Sahipsiz</span>
              )}
            </dd>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isEditing && (
        <>
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab: Bilgiler */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {vehicle.currentOwner && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900 mb-3">
                    Mevcut Sahip
                  </h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs text-gray-500">Ad Soyad</dt>
                      <dd className="mt-0.5 text-sm font-medium text-gray-900">
                        {vehicle.currentOwner.name}
                      </dd>
                    </div>
                    {vehicle.currentOwner.phone && (
                      <div>
                        <dt className="text-xs text-gray-500">Telefon</dt>
                        <dd className="mt-0.5 text-sm font-medium text-gray-900">
                          {vehicle.currentOwner.phone}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Arac Bilgileri
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-500">Plaka</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900 font-mono">
                    {vehicle.licensePlate}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Marka</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {vehicle.brandName ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Model</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {vehicle.modelName ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Yil</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {vehicle.year ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Renk</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {vehicle.color ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Mevcut Km</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {vehicle.currentKm.toLocaleString('tr-TR')} km
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Sasi No (VIN)</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900 font-mono text-xs">
                    {vehicle.vin ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Kayit Tarihi</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {formatDate(vehicle.createdAt)}
                  </dd>
                </div>
              </dl>

              {vehicle.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <dt className="text-xs text-gray-500 mb-1">Notlar</dt>
                  <dd className="text-sm text-gray-800 whitespace-pre-wrap">
                    {vehicle.notes}
                  </dd>
                </div>
              )}
            </div>
          )}

          {/* Tab: Servis Gecmisi */}
          {activeTab === 'service-history' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {serviceHistoryMeta && (
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600">
                  {serviceHistoryMeta.lastServiceDate && (
                    <span>
                      Son Servis:{' '}
                      <strong className="text-gray-900">
                        {formatDate(serviceHistoryMeta.lastServiceDate)}
                      </strong>
                    </span>
                  )}
                  {serviceHistoryMeta.lastServiceKm != null && (
                    <span>
                      Son Servis Km:{' '}
                      <strong className="text-gray-900">
                        {serviceHistoryMeta.lastServiceKm.toLocaleString('tr-TR')} km
                      </strong>
                    </span>
                  )}
                  <span className="ml-auto text-gray-400">
                    Toplam {serviceHistoryMeta.total} kayit
                  </span>
                </div>
              )}

              {loadingHistory ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Yukluyor...
                </div>
              ) : historyError ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-red-600 mb-2">{historyError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchServiceHistory(historyPage)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Tekrar dene
                  </button>
                </div>
              ) : serviceHistory.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Servis gecmisi bulunamadi.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Is Emri No
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Durum
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tarih
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Km
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tutar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {serviceHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                              <Link href={`/work-orders/${item.id}`}>
                                {item.orderNo}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                  WORK_ORDER_STATUS_COLORS[item.status] ??
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {WORK_ORDER_STATUS_LABELS[item.status] ??
                                  item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(
                                item.completedAt ?? item.createdAt,
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.currentKm != null
                                ? `${item.currentKm.toLocaleString('tr-TR')} km`
                                : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.totalAmount != null
                                ? `${item.totalAmount.toLocaleString('tr-TR', {
                                    minimumFractionDigits: 2,
                                  })} TL`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* History pagination */}
                  {serviceHistoryMeta && serviceHistoryMeta.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Sayfa {historyPage} / {serviceHistoryMeta.totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setHistoryPage((p) => p - 1)}
                          disabled={historyPage <= 1}
                          className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Onceki
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryPage((p) => p + 1)}
                          disabled={historyPage >= serviceHistoryMeta.totalPages}
                          className="px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Sahiplik Gecmisi */}
          {activeTab === 'ownership' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {!vehicle.ownerships || vehicle.ownerships.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Sahiplik gecmisi bulunamadi.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Sahip
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Baslangic
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Bitis
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Durum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vehicle.ownerships.map((ownership) => (
                        <tr key={ownership.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ownership.customer.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(ownership.startDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(ownership.endDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {ownership.endDate == null ? (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                Mevcut Sahip
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                Eski Sahip
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit form */}
      {isEditing && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Araci Duzenle
          </h2>
          <VehicleForm
            initialData={formInitialData}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            isSubmitting={isSubmitting}
            submitLabel="Guncelle"
          />
        </div>
      )}
    </div>
  );
}
