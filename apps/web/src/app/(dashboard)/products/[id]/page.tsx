'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Product, PriceHistory, StockMovement, ProductMargin } from '@/types/product';

type Tab = 'bilgiler' | 'fiyat-gecmisi' | 'stok-hareketleri';

const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  IN: 'Giris',
  OUT: 'Cikis',
  ADJUST: 'Duzeltme',
};

const MOVEMENT_TYPE_COLOR: Record<string, string> = {
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
  ADJUST: 'bg-yellow-100 text-yellow-700',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params['id'] as string;

  const [activeTab, setActiveTab] = useState<Tab>('bilgiler');
  const [product, setProduct] = useState<Product | null>(null);
  const [margin, setMargin] = useState<ProductMargin | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsMeta, setMovementsMeta] = useState({ page: 1, totalPages: 1 });
  const [movementsPage, setMovementsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productRes, marginRes] = await Promise.all([
        apiClient.get<Product>(`/products/${id}`),
        apiClient.get<ProductMargin>(`/products/${id}/margin`),
      ]);
      setProduct(productRes.data);
      setMargin(marginRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urun yuklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPriceHistory = useCallback(async () => {
    try {
      const res = await apiClient.get<PriceHistory[]>(`/products/${id}/price-history`);
      setPriceHistory(res.data);
    } catch {
      // silently fail on tab data
    }
  }, [id]);

  const fetchMovements = useCallback(async () => {
    try {
      const res = await apiClient.get<StockMovement[]>(`/stock/movements`, {
        productId: id,
        page: movementsPage,
        limit: 20,
      });
      setMovements(res.data);
      if (res.meta) {
        setMovementsMeta({
          page: res.meta.page ?? 1,
          totalPages: res.meta.totalPages ?? 1,
        });
      }
    } catch {
      // silently fail
    }
  }, [id, movementsPage]);

  useEffect(() => {
    void fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (activeTab === 'fiyat-gecmisi') void fetchPriceHistory();
    if (activeTab === 'stok-hareketleri') void fetchMovements();
  }, [activeTab, fetchPriceHistory, fetchMovements]);

  async function handleDelete() {
    if (!confirm('Bu urunu silmek istediginizden emin misiniz?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/products/${id}`);
      router.push('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urun silinemedi.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Yukleniyor...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-24">
        <p className="text-red-600 text-sm mb-4">{error ?? 'Urun bulunamadi.'}</p>
        <Link href="/products" className="text-blue-600 hover:underline text-sm">
          Urunlere don
        </Link>
      </div>
    );
  }

  const isLowStock = product.currentStock < product.minStock;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/products" className="hover:text-gray-700">
              Urunler
            </Link>
            <span>/</span>
            <span>{product.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {product.name}
            {!product.isActive && (
              <span className="text-sm font-normal px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                Pasif
              </span>
            )}
          </h1>
          {product.sku && (
            <p className="text-sm text-gray-500 font-mono mt-1">SKU: {product.sku}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/products/${id}/edit`}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Duzenle
          </Link>
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Alis Fiyati</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(product.costPrice)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Satis Fiyati</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(product.salePrice)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs mb-1 ${isLowStock ? 'text-red-500' : 'text-gray-500'}`}>
            Mevcut Stok {isLowStock && '(Dusuk!)'}
          </p>
          <p className={`text-lg font-bold ${isLowStock ? 'text-red-700' : 'text-gray-900'}`}>
            {product.currentStock} {product.unit}
          </p>
        </div>
        {margin && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Kar Marji</p>
            <p className={`text-lg font-bold ${margin.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              %{margin.marginPercent.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400">{formatCurrency(margin.marginAmount)} kazanc</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {(
            [
              { key: 'bilgiler', label: 'Bilgiler' },
              { key: 'fiyat-gecmisi', label: 'Fiyat Gecmisi' },
              { key: 'stok-hareketleri', label: 'Stok Hareketleri' },
            ] as { key: Tab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Bilgiler */}
      {activeTab === 'bilgiler' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-sm text-gray-500">Kategori</dt>
              <dd className="text-sm font-medium text-gray-900 mt-1">
                {product.category?.name ?? '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Birim</dt>
              <dd className="text-sm font-medium text-gray-900 mt-1">{product.unit}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Minimum Stok</dt>
              <dd className="text-sm font-medium text-gray-900 mt-1">
                {product.minStock} {product.unit}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Durum</dt>
              <dd className="mt-1">
                {product.isActive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Pasif
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Olusturulma</dt>
              <dd className="text-sm font-medium text-gray-900 mt-1">
                {formatDate(product.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Son Guncelleme</dt>
              <dd className="text-sm font-medium text-gray-900 mt-1">
                {formatDate(product.updatedAt)}
              </dd>
            </div>
          </dl>

          {margin && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Fiyat Analizi</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Alis</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatCurrency(margin.costPrice)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Satis</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatCurrency(margin.salePrice)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Kar Tutari</p>
                  <p className={`text-sm font-medium mt-0.5 ${margin.marginAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(margin.marginAmount)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Kar Marji</p>
                  <p className={`text-sm font-medium mt-0.5 ${margin.marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    %{margin.marginPercent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Fiyat Gecmisi */}
      {activeTab === 'fiyat-gecmisi' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {priceHistory.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
              Fiyat gecmisi bulunamadi.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tarih</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Alis Fiyati</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Satis Fiyati</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Degistiren</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priceHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{formatDate(h.changedAt)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(h.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(h.salePrice)}</td>
                    <td className="px-4 py-3 text-gray-500">{h.changedBy ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Stok Hareketleri */}
      {activeTab === 'stok-hareketleri' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {movements.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Stok hareketi bulunamadi.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tarih</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Tip</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Miktar</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Kaynak</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Aciklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{formatDate(m.date)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MOVEMENT_TYPE_COLOR[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {MOVEMENT_TYPE_LABEL[m.type] ?? m.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${m.type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                        {m.type === 'OUT' ? '-' : '+'}{m.quantity} {product.unit}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {m.referenceType ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.reason ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {movementsMeta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4 text-sm">
              <button
                onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                disabled={movementsMeta.page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Onceki
              </button>
              <button
                onClick={() => setMovementsPage((p) => Math.min(movementsMeta.totalPages, p + 1))}
                disabled={movementsMeta.page === movementsMeta.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
