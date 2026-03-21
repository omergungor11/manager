'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Product, StockMovement, CreateStockEntryDto } from '@/types/product';

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

const INITIAL_FORM: Omit<CreateStockEntryDto, 'productId'> & { productId: string } = {
  productId: '',
  quantity: 1,
  unitCost: 0,
  invoiceNo: '',
  notes: '',
};

export default function StockDashboardPage() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      productSearch === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(productSearch.toLowerCase()),
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lowStockRes, movementsRes, productsRes] = await Promise.all([
        apiClient.get<Product[]>('/products/low-stock'),
        apiClient.get<StockMovement[]>('/stock/movements', { limit: 10 }),
        apiClient.get<Product[]>('/products', { limit: 100 }),
      ]);
      setLowStockProducts(lowStockRes.data);
      setRecentMovements(movementsRes.data);
      setProducts(productsRes.data);
    } catch {
      // partial failures are ok
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function updateForm<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (entryError) setEntryError(null);
    if (entrySuccess) setEntrySuccess(false);
  }

  async function handleQuickEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productId) {
      setEntryError('Urun secmelisiniz.');
      return;
    }
    if (form.quantity <= 0) {
      setEntryError('Miktar 0\'dan buyuk olmalidir.');
      return;
    }

    setEntryLoading(true);
    setEntryError(null);
    try {
      await apiClient.post('/stock/entries', {
        productId: form.productId,
        quantity: form.quantity,
        unitCost: form.unitCost,
        invoiceNo: form.invoiceNo?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      setEntrySuccess(true);
      setForm(INITIAL_FORM);
      setProductSearch('');
      void fetchData();
    } catch (err) {
      setEntryError(err instanceof Error ? err.message : 'Stok girisi yapilamadi.');
    } finally {
      setEntryLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Yonetimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stok giris, sayim ve hareketler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/stock/entry"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Toplu Giris
          </Link>
          <Link
            href="/stock/count"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Stok Sayimi
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Low stock + Quick entry */}
        <div className="lg:col-span-1 space-y-6">
          {/* Low stock alerts */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Dusuk Stok Uyarilari</h2>
              {lowStockProducts.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Yukleniyor...</div>
            ) : lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Tum urunler yeterli stokta.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {lowStockProducts.map((p) => (
                  <li key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/products/${p.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Min: {p.minStock} {p.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {p.currentStock} {p.unit}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick stock entry */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Hizli Stok Girisi</h2>

            {entrySuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm mb-3">
                Stok girisi basariyla kaydedildi.
              </div>
            )}
            {entryError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                {entryError}
              </div>
            )}

            <form onSubmit={(e) => void handleQuickEntry(e)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Urun <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Urun ara..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    if (!e.target.value) updateForm('productId', '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {productSearch && filteredProducts.length > 0 && !form.productId && (
                  <ul className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
                    {filteredProducts.slice(0, 8).map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            updateForm('productId', p.id);
                            updateForm('unitCost', p.costPrice);
                            setProductSearch(p.name);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
                        >
                          <span>{p.name}</span>
                          <span className="text-gray-400 text-xs">{p.sku ?? ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Miktar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={form.quantity}
                    onChange={(e) => updateForm('quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Birim Maliyet (TL)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitCost}
                    onChange={(e) => updateForm('unitCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fatura No
                </label>
                <input
                  type="text"
                  value={form.invoiceNo ?? ''}
                  onChange={(e) => updateForm('invoiceNo', e.target.value)}
                  placeholder="Ornek: INV-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={form.notes ?? ''}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  rows={2}
                  placeholder="Ek aciklama..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={entryLoading || !form.productId}
                className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {entryLoading ? 'Kaydediliyor...' : 'Stok Girisi Yap'}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Recent movements */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Son Stok Hareketleri</h2>
            </div>
            {loading ? (
              <div className="py-16 text-center text-gray-400 text-sm">Yukleniyor...</div>
            ) : recentMovements.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                Henuz stok hareketi yok.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Tarih</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Urun</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Tip</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Miktar</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Aciklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(m.date)}
                        </td>
                        <td className="px-4 py-3">
                          {m.product ? (
                            <Link
                              href={`/products/${m.productId}`}
                              className="text-gray-900 hover:text-blue-600 font-medium"
                            >
                              {m.product.name}
                            </Link>
                          ) : (
                            <span className="text-gray-500 text-xs font-mono">{m.productId}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${MOVEMENT_TYPE_COLOR[m.type] ?? 'bg-gray-100 text-gray-600'}`}>
                            {MOVEMENT_TYPE_LABEL[m.type] ?? m.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${m.type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                          {m.type === 'OUT' ? '-' : '+'}{m.quantity}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {m.reason ?? m.referenceType ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
