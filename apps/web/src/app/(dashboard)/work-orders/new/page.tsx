'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, ApiClientError } from '@/lib/api';
import type {
  PlateSearchVehicle,
  LookupVehicleResult,
  CreateWorkOrderPayload,
  CreateWorkOrderItemPayload,
  WorkOrderItemType,
} from '@/types/work-order';
import type { WorkOrder } from '@/types/work-order';
import type { Service, ServiceProduct } from '@/app/(dashboard)/services/types';
import type { Employee } from '@/types/employee';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface DraftItem {
  key: string;
  type: WorkOrderItemType;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

function newKey() {
  return Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NewWorkOrderPage() {
  const router = useRouter();

  // --- Plate search ---
  const [plateQuery, setPlateQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlateSearchVehicle[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Selected vehicle / customer ---
  const [selectedVehicle, setSelectedVehicle] = useState<PlateSearchVehicle | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupVehicleResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // --- Step 3: KM ---
  const [currentKm, setCurrentKm] = useState('');

  // --- Step 4: Items ---
  const [items, setItems] = useState<DraftItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceProductsLoading, setServiceProductsLoading] = useState(false);

  // Manual product add form
  const [manualDesc, setManualDesc] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualPrice, setManualPrice] = useState('');

  // --- Step 5: Notes / technician ---
  const [notes, setNotes] = useState('');
  const [technicians, setTechnicians] = useState<Employee[]>([]);
  const [techsLoading, setTechsLoading] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');

  // --- Submit ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Plate search with debounce
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const q = plateQuery.trim().toUpperCase();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchLoading(true);
      apiClient
        .get<PlateSearchVehicle[]>('/lookup/plate-search', { q })
        .then((res) => {
          setSearchResults(res.data);
          setSearchOpen(true);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [plateQuery]);

  // ---------------------------------------------------------------------------
  // Lookup full vehicle info when one is selected
  // ---------------------------------------------------------------------------

  function selectVehicle(vehicle: PlateSearchVehicle) {
    setSelectedVehicle(vehicle);
    setPlateQuery(vehicle.licensePlate);
    setSearchOpen(false);
    setLookupLoading(true);
    setLookupResult(null);
    apiClient
      .get<LookupVehicleResult>(`/lookup/plate/${encodeURIComponent(vehicle.licensePlate)}`)
      .then((res) => setLookupResult(res.data))
      .catch(() => setLookupResult(null))
      .finally(() => setLookupLoading(false));
  }

  // ---------------------------------------------------------------------------
  // Load services & technicians
  // ---------------------------------------------------------------------------

  const loadServices = useCallback(() => {
    setServicesLoading(true);
    apiClient
      .get<Service[]>('/services')
      .then((res) => setServices(res.data))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  const loadTechnicians = useCallback(() => {
    setTechsLoading(true);
    apiClient
      .get<Employee[]>('/employees', { status: 'active', limit: 100 })
      .then((res) => setTechnicians(res.data))
      .catch(() => setTechnicians([]))
      .finally(() => setTechsLoading(false));
  }, []);

  useEffect(() => {
    loadServices();
    loadTechnicians();
  }, [loadServices, loadTechnicians]);

  // ---------------------------------------------------------------------------
  // Add service (with its default products)
  // ---------------------------------------------------------------------------

  async function handleAddService() {
    const service = services.find((s) => s.id === selectedServiceId);
    if (!service) return;

    // Add the service line
    const serviceItem: DraftItem = {
      key: newKey(),
      type: 'SERVICE',
      serviceId: service.id,
      productId: null,
      description: service.name,
      quantity: 1,
      unitPrice: service.defaultPrice,
    };

    const newItems: DraftItem[] = [serviceItem];

    // Fetch related products
    setServiceProductsLoading(true);
    try {
      const res = await apiClient.get<ServiceProduct[]>(`/services/${service.id}/products`);
      for (const sp of res.data) {
        if (sp.product) {
          newItems.push({
            key: newKey(),
            type: 'PRODUCT',
            serviceId: null,
            productId: sp.productId,
            description: sp.product.name,
            quantity: sp.defaultQuantity,
            unitPrice: sp.product.salePrice,
          });
        }
      }
    } catch {
      // ignore, just add the service without products
    } finally {
      setServiceProductsLoading(false);
    }

    setItems((prev) => [...prev, ...newItems]);
    setSelectedServiceId('');
  }

  // ---------------------------------------------------------------------------
  // Add manual product line
  // ---------------------------------------------------------------------------

  function handleAddManual() {
    const desc = manualDesc.trim();
    const qty = parseFloat(manualQty);
    const price = parseFloat(manualPrice.replace(',', '.'));
    if (!desc || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) return;

    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        type: 'PRODUCT',
        serviceId: null,
        productId: null,
        description: desc,
        quantity: qty,
        unitPrice: price,
      },
    ]);
    setManualDesc('');
    setManualQty('1');
    setManualPrice('');
  }

  // ---------------------------------------------------------------------------
  // Item field updates
  // ---------------------------------------------------------------------------

  function updateItemQty(key: string, value: string) {
    const n = parseFloat(value.replace(',', '.'));
    if (isNaN(n) || n <= 0) return;
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, quantity: n } : it)),
    );
  }

  function updateItemPrice(key: string, value: string) {
    const n = parseFloat(value.replace(',', '.'));
    if (isNaN(n) || n < 0) return;
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, unitPrice: n } : it)),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  // ---------------------------------------------------------------------------
  // Grand total
  // ---------------------------------------------------------------------------

  const grandTotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;

    const customer =
      lookupResult?.customer ?? selectedVehicle.currentOwner;

    if (!customer) {
      setSubmitError('Müşteri bilgisi bulunamadı. Lütfen önce müşteri/araç oluşturun.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const orderItems: CreateWorkOrderItemPayload[] = items.map((it) => ({
      type: it.type,
      serviceId: it.serviceId ?? undefined,
      productId: it.productId ?? undefined,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));

    const payload: CreateWorkOrderPayload = {
      customerId: customer.id,
      vehicleId: selectedVehicle.id,
      currentKm: currentKm ? parseInt(currentKm, 10) : undefined,
      technicianId: selectedTechId || undefined,
      notes: notes.trim() || undefined,
      items: orderItems,
    };

    try {
      const res = await apiClient.post<WorkOrder>('/work-orders', payload);
      router.push(`/work-orders/${res.data.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError ? err.message : 'İş emri oluşturulamadı.',
      );
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const customer = lookupResult?.customer ?? selectedVehicle?.currentOwner ?? null;
  const canSubmit = !!selectedVehicle && !!customer && !isSubmitting;

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-6 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/work-orders" className="hover:text-gray-900">
            İş Emirleri
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Yeni İş Emri</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">Yeni İş Emri</h1>

        {/* ------------------------------------------------------------------ */}
        {/* Step 1 + 2: Plate lookup                                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Araç Seçimi</h2>

          <div className="relative">
            <label htmlFor="plate-input" className="block text-sm font-medium text-gray-700 mb-1">
              Plaka
            </label>
            <input
              id="plate-input"
              type="text"
              placeholder="34 ABC 123"
              value={plateQuery}
              onChange={(e) => {
                setPlateQuery(e.target.value.toUpperCase());
                setSelectedVehicle(null);
                setLookupResult(null);
              }}
              className={inputClass + ' font-mono uppercase'}
              autoComplete="off"
            />

            {/* Search loading indicator */}
            {searchLoading && (
              <p className="mt-1 text-xs text-gray-500">Aranıyor...</p>
            )}

            {/* Dropdown results */}
            {searchOpen && searchResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-lg max-h-60 overflow-auto">
                {searchResults.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => selectVehicle(v)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3"
                    >
                      <span className="font-mono font-semibold text-gray-900 text-sm">
                        {v.licensePlate}
                      </span>
                      <span className="text-sm text-gray-500 flex-1">
                        {[v.brandName, v.modelName].filter(Boolean).join(' ')}
                        {v.year ? ` (${v.year})` : ''}
                      </span>
                      {v.currentOwner && (
                        <span className="text-xs text-gray-400">{v.currentOwner.name}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {searchOpen && searchResults.length === 0 && !searchLoading && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-lg px-4 py-3 text-sm text-gray-500">
                Plaka bulunamadı.{' '}
                <Link href="/vehicles/new" className="text-blue-600 hover:text-blue-800">
                  Yeni araç/müşteri oluştur
                </Link>
              </div>
            )}
          </div>

          {/* Lookup loading */}
          {lookupLoading && (
            <p className="text-sm text-gray-500">Müşteri bilgileri yükleniyor...</p>
          )}

          {/* Selected vehicle + customer info */}
          {selectedVehicle && !lookupLoading && (
            <div className="rounded-md bg-gray-50 border border-gray-200 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Araç
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-900">
                    {selectedVehicle.licensePlate}
                  </p>
                  <p className="text-sm text-gray-600">
                    {[selectedVehicle.brandName, selectedVehicle.modelName]
                      .filter(Boolean)
                      .join(' ') || 'Marka/model bilgisi yok'}
                    {selectedVehicle.year ? ` (${selectedVehicle.year})` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Mevcut Km: {selectedVehicle.currentKm.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Müşteri
                  </p>
                  {customer ? (
                    <>
                      <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="text-sm text-orange-600">Araç sahibi bulunamadı.</p>
                      <Link
                        href="/customers/new"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Yeni müşteri/araç oluştur
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Last services */}
              {lookupResult && lookupResult.lastServices.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Son Servisler
                  </p>
                  <div className="space-y-1">
                    {lookupResult.lastServices.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs text-gray-600">
                        <Link href={`/work-orders/${s.id}`} className="font-mono text-blue-600 hover:text-blue-800">
                          {s.orderNo}
                        </Link>
                        <span>{new Date(s.createdAt).toLocaleDateString('tr-TR')}</span>
                        <span>
                          {s.totalAmount != null ? formatMoney(s.totalAmount) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Step 3: KM                                                         */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Kilometre Bilgisi</h2>
          <div>
            <label htmlFor="current-km" className="block text-sm font-medium text-gray-700 mb-1">
              Mevcut Km <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <input
              id="current-km"
              type="number"
              min="0"
              placeholder="Örn: 85000"
              value={currentKm}
              onChange={(e) => setCurrentKm(e.target.value)}
              className={inputClass + ' max-w-xs'}
            />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Step 4: Items                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Hizmet ve Ürünler</h2>

          {/* Add service */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Hizmet Ekle</p>
            <div className="flex gap-3">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className={inputClass + ' flex-1'}
                disabled={servicesLoading}
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
                disabled={!selectedServiceId || serviceProductsLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {serviceProductsLoading ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>

          {/* Add manual product */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Manuel Ürün / Kalem Ekle</p>
            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Açıklama"
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className={inputClass + ' col-span-5'}
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Adet"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
                className={inputClass + ' col-span-2'}
              />
              <input
                type="text"
                placeholder="Birim Fiyat"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                className={inputClass + ' col-span-3'}
              />
              <button
                type="button"
                onClick={handleAddManual}
                disabled={!manualDesc.trim() || !manualPrice}
                className="col-span-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Items table */}
          {items.length > 0 ? (
            <div className="overflow-x-auto -mx-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Adet
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Birim Fiyat
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Toplam
                    </th>
                    <th className="px-6 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td className="px-6 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.type === 'SERVICE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.type === 'SERVICE' ? 'Hizmet' : 'Ürün'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(item.key, e.target.value)}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ml-auto block"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(item.key, e.target.value)}
                          className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ml-auto block"
                        />
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatMoney(item.quantity * item.unitPrice)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="text-red-500 hover:text-red-700"
                          title="Kalemi kaldır"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Genel Toplam
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900 whitespace-nowrap">
                      {formatMoney(grandTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6 border border-dashed border-gray-300 rounded-md">
              Henüz kalem eklenmedi.
            </p>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Step 5: Notes + Technician                                         */}
        {/* ------------------------------------------------------------------ */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Ek Bilgiler</h2>

          <div>
            <label htmlFor="technician" className="block text-sm font-medium text-gray-700 mb-1">
              Teknisyen <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <select
              id="technician"
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className={inputClass + ' max-w-xs'}
              disabled={techsLoading}
            >
              <option value="">
                {techsLoading ? 'Yükleniyor...' : 'Teknisyen seçin...'}
              </option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.position ? ` — ${t.position}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notlar <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="İş emriyle ilgili notlar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass + ' resize-none'}
            />
          </div>
        </section>

        {/* Submit error */}
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/work-orders"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Vazgec
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Oluşturuluyor...' : 'İş Emri Oluştur'}
          </button>
        </div>
      </div>
    </form>
  );
}
