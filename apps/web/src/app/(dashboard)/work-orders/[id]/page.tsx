'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import type {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderItemType,
  UpdateWorkOrderStatusPayload,
  CreateWorkOrderItemPayload,
} from '@/types/work-order';
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  VALID_TRANSITIONS,
} from '@/types/work-order';
import type { Service, ServiceProduct } from '@/app/(dashboard)/services/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

// Status transition button styles
const TRANSITION_BUTTON_CLASS: Partial<Record<WorkOrderStatus, string>> = {
  IN_PROGRESS: 'bg-blue-600 text-white hover:bg-blue-700',
  COMPLETED: 'bg-green-600 text-white hover:bg-green-700',
  INVOICED: 'bg-purple-600 text-white hover:bg-purple-700',
  CANCELLED: 'border border-red-300 text-red-700 hover:bg-red-50',
};

// ---------------------------------------------------------------------------
// Add item form (embedded)
// ---------------------------------------------------------------------------

interface AddItemFormProps {
  services: Service[];
  servicesLoading: boolean;
  onAddService: (serviceId: string) => Promise<void>;
  onAddManual: (payload: CreateWorkOrderItemPayload) => Promise<void>;
  isAdding: boolean;
}

function AddItemForm({
  services,
  servicesLoading,
  onAddService,
  onAddManual,
  isAdding,
}: AddItemFormProps) {
  const [mode, setMode] = useState<'service' | 'manual'>('service');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [manualType, setManualType] = useState<WorkOrderItemType>('PRODUCT');
  const [manualDesc, setManualDesc] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualPrice, setManualPrice] = useState('');

  async function handleAddService() {
    if (!selectedServiceId) return;
    await onAddService(selectedServiceId);
    setSelectedServiceId('');
  }

  async function handleAddManual() {
    const desc = manualDesc.trim();
    const qty = parseFloat(manualQty.replace(',', '.'));
    const price = parseFloat(manualPrice.replace(',', '.'));
    if (!desc || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) return;
    await onAddManual({
      type: manualType,
      description: desc,
      quantity: qty,
      unitPrice: price,
    });
    setManualDesc('');
    setManualQty('1');
    setManualPrice('');
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('service')}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'service'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Hizmet
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manuel Kalem
        </button>
      </div>

      {mode === 'service' ? (
        <div className="flex gap-3">
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className={inputClass + ' flex-1'}
            disabled={servicesLoading || isAdding}
          >
            <option value="">
              {servicesLoading ? 'Yükleniyor...' : 'Hizmet seçin...'}
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatMoney(s.defaultPrice)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleAddService()}
            disabled={!selectedServiceId || isAdding}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isAdding ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-2">
          <select
            value={manualType}
            onChange={(e) => setManualType(e.target.value as WorkOrderItemType)}
            className={inputClass + ' col-span-2'}
            disabled={isAdding}
          >
            <option value="PRODUCT">Ürün</option>
            <option value="SERVICE">Hizmet</option>
          </select>
          <input
            type="text"
            placeholder="Açıklama"
            value={manualDesc}
            onChange={(e) => setManualDesc(e.target.value)}
            className={inputClass + ' col-span-4'}
            disabled={isAdding}
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Adet"
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            className={inputClass + ' col-span-2'}
            disabled={isAdding}
          />
          <input
            type="text"
            placeholder="Birim Fiyat"
            value={manualPrice}
            onChange={(e) => setManualPrice(e.target.value)}
            className={inputClass + ' col-span-2'}
            disabled={isAdding}
          />
          <button
            type="button"
            onClick={() => void handleAddManual()}
            disabled={!manualDesc.trim() || !manualPrice || isAdding}
            className="col-span-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info row helper
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-3.5">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [showStatusNotes, setShowStatusNotes] = useState<WorkOrderStatus | null>(null);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Load order
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    apiClient
      .get<WorkOrder>(`/work-orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        setLoadError(
          err instanceof ApiClientError ? err.message : 'İş emri yüklenemedi.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // Load services
  useEffect(() => {
    setServicesLoading(true);
    apiClient
      .get<Service[]>('/services')
      .then((res) => setServices(res.data))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  // ---------------------------------------------------------------------------
  // Status transition
  // ---------------------------------------------------------------------------

  async function handleStatusChange(newStatus: WorkOrderStatus) {
    if (newStatus === 'CANCELLED' || newStatus === 'INVOICED') {
      // Show notes input before confirming
      setShowStatusNotes(newStatus);
      return;
    }
    await commitStatusChange(newStatus, '');
  }

  async function commitStatusChange(newStatus: WorkOrderStatus, notes: string) {
    setIsChangingStatus(true);
    setStatusError(null);
    const payload: UpdateWorkOrderStatusPayload = { status: newStatus };
    if (notes.trim()) payload.notes = notes.trim();
    try {
      const res = await apiClient.patch<WorkOrder>(`/work-orders/${id}/status`, payload);
      setOrder(res.data);
      setShowStatusNotes(null);
      setStatusNotes('');
    } catch (err) {
      setStatusError(
        err instanceof ApiClientError ? err.message : 'Durum güncellenemedi.',
      );
    } finally {
      setIsChangingStatus(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Add item
  // ---------------------------------------------------------------------------

  async function handleAddService(serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    setIsAddingItem(true);
    setAddItemError(null);

    // First add the service
    const servicePayload: CreateWorkOrderItemPayload = {
      type: 'SERVICE',
      serviceId: service.id,
      description: service.name,
      quantity: 1,
      unitPrice: service.defaultPrice,
    };

    try {
      let res = await apiClient.post<WorkOrder>(`/work-orders/${id}/items`, servicePayload);
      setOrder(res.data);

      // Then add related products
      try {
        const spRes = await apiClient.get<ServiceProduct[]>(`/services/${serviceId}/products`);
        for (const sp of spRes.data) {
          if (sp.product) {
            const productPayload: CreateWorkOrderItemPayload = {
              type: 'PRODUCT',
              productId: sp.productId,
              description: sp.product.name,
              quantity: sp.defaultQuantity,
              unitPrice: sp.product.salePrice,
            };
            res = await apiClient.post<WorkOrder>(`/work-orders/${id}/items`, productPayload);
            setOrder(res.data);
          }
        }
      } catch {
        // ignore errors when loading service products
      }
    } catch (err) {
      setAddItemError(
        err instanceof ApiClientError ? err.message : 'Kalem eklenemedi.',
      );
    } finally {
      setIsAddingItem(false);
    }
  }

  async function handleAddManual(payload: CreateWorkOrderItemPayload) {
    setIsAddingItem(true);
    setAddItemError(null);
    try {
      const res = await apiClient.post<WorkOrder>(`/work-orders/${id}/items`, payload);
      setOrder(res.data);
    } catch (err) {
      setAddItemError(
        err instanceof ApiClientError ? err.message : 'Kalem eklenemedi.',
      );
    } finally {
      setIsAddingItem(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Remove item
  // ---------------------------------------------------------------------------

  async function handleRemoveItem(itemId: string) {
    if (!confirm('Bu kalemi silmek istediğinizden emin misiniz?')) return;
    setRemovingItemId(itemId);
    try {
      const res = await apiClient.delete<WorkOrder>(`/work-orders/${id}/items/${itemId}`);
      setOrder(res.data);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Kalem silinemedi.');
    } finally {
      setRemovingItemId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">Yükleniyor...</div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-600">{loadError ?? 'İş emri bulunamadı.'}</p>
        <Link href="/work-orders" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800">
          Listeye dön
        </Link>
      </div>
    );
  }

  const validTransitions = VALID_TRANSITIONS[order.status];
  const isEditable = order.status === 'DRAFT' || order.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/work-orders" className="hover:text-gray-900">
          Is Emirleri
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium font-mono">{order.orderNo}</span>
      </nav>

      {/* -------------------------------------------------------------------- */}
      {/* Header                                                               */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.orderNo}</h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE_CLASS[order.status]}`}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Oluşturulma: {formatDate(order.createdAt)}
            {order.completedAt && ` · Tamamlandı: ${formatDate(order.completedAt)}`}
            {order.invoicedAt && ` · Faturalandı: ${formatDate(order.invoicedAt)}`}
          </p>
        </div>

        {/* Status transition buttons */}
        {validTransitions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {validTransitions.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                onClick={() => void handleStatusChange(nextStatus)}
                disabled={isChangingStatus}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  TRANSITION_BUTTON_CLASS[nextStatus] ??
                  'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {STATUS_LABEL[nextStatus]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status change notes dialog */}
      {showStatusNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-yellow-800">
            Durum &quot;{STATUS_LABEL[showStatusNotes]}&quot; olarak değiştirilecek. Not eklemek ister misiniz?
          </p>
          <textarea
            rows={2}
            placeholder="Not (isteğe bağlı)..."
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            className={inputClass + ' resize-none'}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void commitStatusChange(showStatusNotes, statusNotes)}
              disabled={isChangingStatus}
              className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {isChangingStatus ? 'Güncelleniyor...' : 'Onayla'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowStatusNotes(null);
                setStatusNotes('');
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Vazgec
            </button>
          </div>
        </div>
      )}

      {statusError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {statusError}
        </p>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Customer + Vehicle info                                              */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Musteri</h2>
          </div>
          <dl className="divide-y divide-gray-100">
            <InfoRow label="Ad" value={order.customer.name} />
            <InfoRow label="Telefon" value={order.customer.phone} />
            <InfoRow label="E-posta" value={order.customer.email} />
          </dl>
          <div className="px-6 py-3">
            <Link
              href={`/customers/${order.customerId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Musteri sayfasina git
            </Link>
          </div>
        </div>

        {/* Vehicle */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Arac</h2>
          </div>
          <dl className="divide-y divide-gray-100">
            <InfoRow
              label="Plaka"
              value={
                <span className="font-mono font-bold">{order.vehicle.licensePlate}</span>
              }
            />
            <InfoRow
              label="Marka / Model"
              value={
                [order.vehicle.brandName, order.vehicle.modelName].filter(Boolean).join(' ') ||
                null
              }
            />
            <InfoRow label="Yil" value={order.vehicle.year?.toString() ?? null} />
            <InfoRow
              label="Km (giris)"
              value={
                order.currentKm != null
                  ? `${order.currentKm.toLocaleString('tr-TR')} km`
                  : null
              }
            />
            {order.technician && (
              <InfoRow label="Teknisyen" value={order.technician.name} />
            )}
          </dl>
          <div className="px-6 py-3">
            <Link
              href={`/vehicles/${order.vehicleId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Arac sayfasina git
            </Link>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notlar</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Items                                                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Hizmet ve Urunler
            <span className="ml-2 text-gray-400 font-normal">({order.items.length} kalem)</span>
          </h2>
          {isEditable && (
            <button
              type="button"
              onClick={() => setShowAddItem((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Kalem Ekle
            </button>
          )}
        </div>

        {/* Add item form */}
        {isEditable && showAddItem && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
            <AddItemForm
              services={services}
              servicesLoading={servicesLoading}
              onAddService={handleAddService}
              onAddManual={handleAddManual}
              isAdding={isAddingItem}
            />
            {addItemError && (
              <p className="text-sm text-red-600">{addItemError}</p>
            )}
          </div>
        )}

        {/* Items table */}
        {order.items.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Henuz kalem eklenmemis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aciklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Adet
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Toplam
                  </th>
                  {isEditable && <th className="px-6 py-3 w-12" />}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.type === 'SERVICE'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.type === 'SERVICE' ? 'Hizmet' : 'Urun'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                      {item.quantity.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatMoney(item.totalPrice)}
                    </td>
                    {isEditable && (
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => void handleRemoveItem(item.id)}
                          disabled={removingItemId === item.id}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50"
                          title="Kalemi kaldır"
                        >
                          {removingItemId === item.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals summary */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Ara Toplam</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>KDV</span>
              <span>{formatMoney(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900">
              <span>Genel Toplam</span>
              <span>{formatMoney(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
