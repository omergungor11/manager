'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { VehicleBrand, VehicleModel, VehicleFormData } from '../types';

interface VehicleFormProps {
  initialData?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const EMPTY_FORM: VehicleFormData = {
  licensePlate: '',
  brandId: '',
  modelId: '',
  brandName: '',
  modelName: '',
  year: '',
  color: '',
  vin: '',
  currentKm: '0',
  notes: '',
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

export default function VehicleForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Kaydet',
}: VehicleFormProps) {
  const [form, setForm] = useState<VehicleFormData>({
    ...EMPTY_FORM,
    ...initialData,
  });
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingBrands(true);
    apiClient
      .get<VehicleBrand[]>('/vehicle-brands')
      .then((res) => setBrands(res.data))
      .catch(() => setBrands([]))
      .finally(() => setLoadingBrands(false));
  }, []);

  useEffect(() => {
    if (!form.brandId) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    setForm((prev) => ({ ...prev, modelId: '', modelName: '' }));
    apiClient
      .get<VehicleModel[]>(`/vehicle-brands/${form.brandId}/models`)
      .then((res) => setModels(res.data))
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [form.brandId]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'brandId') {
      const selected = brands.find((b) => b.id === value);
      setForm((prev) => ({
        ...prev,
        brandId: value,
        brandName: selected?.name ?? '',
        modelId: '',
        modelName: '',
      }));
    }

    if (name === 'modelId') {
      const selected = models.find((m) => m.id === value);
      setForm((prev) => ({
        ...prev,
        modelId: value,
        modelName: selected?.name ?? '',
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata olustu.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Plaka */}
        <div>
          <label
            htmlFor="licensePlate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Plaka <span className="text-red-500">*</span>
          </label>
          <input
            id="licensePlate"
            name="licensePlate"
            type="text"
            required
            value={form.licensePlate}
            onChange={handleChange}
            placeholder="34 ABC 123"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Marka */}
        <div>
          <label
            htmlFor="brandId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Marka
          </label>
          {loadingBrands ? (
            <div className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-400">
              Yukluyor...
            </div>
          ) : (
            <select
              id="brandId"
              name="brandId"
              value={form.brandId}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Seciniz --</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Model */}
        <div>
          <label
            htmlFor="modelId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Model
          </label>
          {loadingModels ? (
            <div className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-400">
              Yukluyor...
            </div>
          ) : (
            <select
              id="modelId"
              name="modelId"
              value={form.modelId}
              onChange={handleChange}
              disabled={!form.brandId || models.length === 0}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Seciniz --</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          )}
          {form.brandId && !loadingModels && models.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Bu marka icin model bulunamadi. Manuel girebilirsiniz.
            </p>
          )}
        </div>

        {/* Manuel model adı (marka seçilmemişse veya modeller yoksa) */}
        {(!form.brandId || (!loadingModels && models.length === 0)) && (
          <div>
            <label
              htmlFor="modelName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Model Adi (Manuel)
            </label>
            <input
              id="modelName"
              name="modelName"
              type="text"
              value={form.modelName}
              onChange={handleChange}
              placeholder="Corolla"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Yıl */}
        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Yil
          </label>
          <select
            id="year"
            name="year"
            value={form.year}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Seciniz --</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Renk */}
        <div>
          <label
            htmlFor="color"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Renk
          </label>
          <input
            id="color"
            name="color"
            type="text"
            value={form.color}
            onChange={handleChange}
            placeholder="Beyaz"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Şasi No */}
        <div>
          <label
            htmlFor="vin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sasi No (VIN)
          </label>
          <input
            id="vin"
            name="vin"
            type="text"
            value={form.vin}
            onChange={handleChange}
            placeholder="JT2BF22K1W0012345"
            maxLength={17}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Km */}
        <div>
          <label
            htmlFor="currentKm"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Mevcut Km
          </label>
          <input
            id="currentKm"
            name="currentKm"
            type="number"
            min={0}
            value={form.currentKm}
            onChange={handleChange}
            placeholder="75000"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Notlar */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notlar
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          placeholder="Araç hakkında notlar..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iptal
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
