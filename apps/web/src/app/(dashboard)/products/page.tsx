'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Product, ProductCategory } from '@/types/product';

const UNITS: Record<string, string> = {
  adet: 'Adet',
  lt: 'Litre',
  kg: 'Kg',
  mt: 'Metre',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get<ProductCategory[]>('/product-categories');
      setCategories(res.data);
    } catch {
      // categories are optional for filtering, silently fail
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Product[]>('/products', {
        search: search || undefined,
        categoryId: categoryId || undefined,
        page,
        limit: 20,
      });
      setProducts(res.data);
      if (res.meta) {
        setMeta({
          page: res.meta.page ?? 1,
          limit: res.meta.limit ?? 20,
          total: res.meta.total ?? 0,
          totalPages: res.meta.totalPages ?? 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urunler yuklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, page]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  async function handleDelete(id: string) {
    try {
      await apiClient.delete(`/products/${id}`);
      setDeleteConfirm(null);
      void fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urun silinemedi.');
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setPage(1);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Urunler</h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta.total} urun kayitli
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Yeni Urun
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Urun ara (ad, SKU)..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tum Kategoriler</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Yukleniyor...
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">Urun bulunamadi.</p>
            <Link
              href="/products/new"
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Ilk urunu ekle
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Birim</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Alis Fiyati</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Satis Fiyati</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Stok</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Min Stok</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const isLowStock = product.currentStock < product.minStock;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLowStock && (
                            <span
                              className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                              title="Dusuk stok uyarisi"
                            />
                          )}
                          <Link
                            href={`/products/${product.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {product.sku ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {product.category?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {UNITS[product.unit] ?? product.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(product.salePrice)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.currentStock}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {product.minStock}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/products/${product.id}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Detay
                          </Link>
                          <Link
                            href={`/products/${product.id}/edit`}
                            className="text-xs text-gray-600 hover:underline"
                          >
                            Duzenle
                          </Link>
                          {deleteConfirm === product.id ? (
                            <span className="flex items-center gap-1">
                              <button
                                onClick={() => void handleDelete(product.id)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Evet
                              </button>
                              <span className="text-gray-300">/</span>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs text-gray-500 hover:underline"
                              >
                                Hayir
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Sil
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Toplam {meta.total} urun — Sayfa {meta.page} / {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Onceki
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page === meta.totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
