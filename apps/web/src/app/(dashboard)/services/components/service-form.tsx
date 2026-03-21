'use client';

import { useState } from 'react';
import type { Service, ServiceCategory, CreateServicePayload } from '../types';

interface ServiceFormProps {
  categories: ServiceCategory[];
  initialData?: Service;
  defaultCategoryId?: string;
  onSubmit: (payload: CreateServicePayload) => Promise<void>;
  onCancel: () => void;
}

export default function ServiceForm({
  categories,
  initialData,
  defaultCategoryId,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId ?? defaultCategoryId ?? '',
  );
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [defaultPrice, setDefaultPrice] = useState(
    initialData?.defaultPrice !== undefined ? String(initialData.defaultPrice) : '',
  );
  const [estimatedDuration, setEstimatedDuration] = useState(
    initialData?.estimatedDuration !== undefined && initialData.estimatedDuration !== null
      ? String(initialData.estimatedDuration)
      : '',
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError('Kategori seçimi zorunludur.');
      return;
    }
    if (!name.trim()) {
      setError('Hizmet adı zorunludur.');
      return;
    }
    if (defaultPrice === '' || isNaN(Number(defaultPrice))) {
      setError('Geçerli bir fiyat giriniz.');
      return;
    }

    const payload: CreateServicePayload = {
      categoryId,
      name: name.trim(),
      description: description.trim() || undefined,
      defaultPrice: Number(defaultPrice),
      estimatedDuration:
        estimatedDuration !== '' ? Number(estimatedDuration) : undefined,
      isActive,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error !== null && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="svc-category"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Kategori <span className="text-red-500">*</span>
        </label>
        <select
          id="svc-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">Kategori seçiniz</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="svc-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Hizmet Adı <span className="text-red-500">*</span>
        </label>
        <input
          id="svc-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Örn: Yağ Değişimi"
        />
      </div>

      <div>
        <label
          htmlFor="svc-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Açıklama
        </label>
        <textarea
          id="svc-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Hizmet detayları"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="svc-price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fiyat (TL) <span className="text-red-500">*</span>
          </label>
          <input
            id="svc-price"
            type="number"
            min={0}
            step="0.01"
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label
            htmlFor="svc-duration"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tahmini Süre (dk)
          </label>
          <input
            id="svc-duration"
            type="number"
            min={0}
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Örn: 60"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((prev) => !prev)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isActive ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {isActive ? 'Aktif' : 'Pasif'}
        </span>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Kaydediliyor...' : initialData ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
