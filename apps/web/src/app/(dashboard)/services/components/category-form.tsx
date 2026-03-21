'use client';

import { useState } from 'react';
import type { ServiceCategory, CreateCategoryPayload } from '../types';

interface CategoryFormProps {
  initialData?: ServiceCategory;
  onSubmit: (payload: CreateCategoryPayload) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [sortOrder, setSortOrder] = useState(
    initialData?.sortOrder !== undefined ? String(initialData.sortOrder) : '0',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Kategori adı zorunludur.');
      return;
    }

    const payload: CreateCategoryPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      sortOrder: sortOrder !== '' ? Number(sortOrder) : undefined,
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
          htmlFor="cat-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Kategori Adı <span className="text-red-500">*</span>
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Örn: Motor Bakımı"
        />
      </div>

      <div>
        <label
          htmlFor="cat-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Açıklama
        </label>
        <textarea
          id="cat-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Kategori hakkında kısa açıklama"
        />
      </div>

      <div>
        <label
          htmlFor="cat-sort-order"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Sıralama
        </label>
        <input
          id="cat-sort-order"
          type="number"
          min={0}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Küçük sayı listede üstte görünür.
        </p>
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
