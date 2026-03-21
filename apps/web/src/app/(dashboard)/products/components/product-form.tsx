'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { Product, ProductCategory, CreateProductDto } from '@/types/product';

const UNITS = [
  { value: 'adet', label: 'Adet' },
  { value: 'lt', label: 'Litre' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'mt', label: 'Metre' },
];

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(product);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [form, setForm] = useState<CreateProductDto>({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    categoryId: product?.categoryId ?? '',
    unit: product?.unit ?? 'adet',
    costPrice: product?.costPrice ?? 0,
    salePrice: product?.salePrice ?? 0,
    minStock: product?.minStock ?? 0,
    isActive: product?.isActive ?? true,
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiClient.get<ProductCategory[]>('/product-categories');
        setCategories(res.data);
      } catch {
        // not critical
      }
    }
    void fetchCategories();
  }, []);

  function updateField<K extends keyof CreateProductDto>(
    key: K,
    value: CreateProductDto[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    setAddingCategory(true);
    try {
      const res = await apiClient.post<ProductCategory>('/product-categories', {
        name: newCategory.trim(),
      });
      setCategories((prev) => [...prev, res.data]);
      updateField('categoryId', res.data.id);
      setNewCategory('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori eklenemedi.');
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Urun adi zorunludur.');
      return;
    }
    if (form.salePrice < form.costPrice) {
      setError('Satis fiyati alis fiyatindan dusuk olamaz.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload: CreateProductDto = {
      ...form,
      sku: form.sku?.trim() || undefined,
      categoryId: form.categoryId?.trim() || undefined,
    };

    try {
      if (isEditing && product) {
        await apiClient.patch<Product>(`/products/${product.id}`, payload);
        router.push(`/products/${product.id}`);
      } else {
        const res = await apiClient.post<Product>('/products', payload);
        router.push(`/products/${res.data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  const marginAmount = form.salePrice - form.costPrice;
  const marginPercent =
    form.costPrice > 0 ? (marginAmount / form.costPrice) * 100 : 0;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urun Adi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ornek: Motor Yagi 5W-40"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU / Kod
            </label>
            <input
              type="text"
              value={form.sku ?? ''}
              onChange={(e) => updateField('sku', e.target.value)}
              placeholder="Ornek: YAG-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birim
            </label>
            <select
              value={form.unit}
              onChange={(e) => updateField('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <div className="flex gap-2">
              <select
                value={form.categoryId ?? ''}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Kategori secin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Quick add category */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Yeni kategori ekle..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddCategory();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => void handleAddCategory()}
                disabled={!newCategory.trim() || addingCategory}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-40"
              >
                {addingCategory ? '...' : 'Ekle'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durum
            </label>
            <select
              value={form.isActive ? 'true' : 'false'}
              onChange={(e) => updateField('isActive', e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Fiyatlandirma</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alis Fiyati (TL)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => updateField('costPrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satis Fiyati (TL)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.salePrice}
              onChange={(e) => updateField('salePrice', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Margin Preview */}
        {form.costPrice > 0 && form.salePrice > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">Kar:</span>{' '}
              <span className={`font-medium ${marginAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marginAmount >= 0 ? '+' : ''}{marginAmount.toFixed(2)} TL
              </span>
            </div>
            <div>
              <span className="text-gray-500">Kar Marji:</span>{' '}
              <span className={`font-medium ${marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                %{marginPercent.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stock */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Stok Ayarlari</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Stok Seviyesi
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={form.minStock}
              onChange={(e) => updateField('minStock', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Bu seviyenin altina dusunce uyari gosterilir.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Iptal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : isEditing ? 'Guncelle' : 'Urun Olustur'}
        </button>
      </div>
    </form>
  );
}
