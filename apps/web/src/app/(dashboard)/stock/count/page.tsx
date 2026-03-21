'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Product } from '@/types/product';

interface CountLine {
  productId: string;
  product: Product;
  actualQty: string; // string for controlled input
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function StockCountPage() {
  const [countLines, setCountLines] = useState<CountLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [countDate] = useState(new Date());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Product[]>('/stock/count');
      setCountLines(
        res.data.map((p) => ({
          productId: p.id,
          product: p,
          actualQty: String(p.currentStock),
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Urunler yuklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  function updateActualQty(productId: string, value: string) {
    setCountLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, actualQty: value } : l,
      ),
    );
    if (error) setError(null);
  }

  const filteredLines = countLines.filter(
    (l) =>
      search === '' ||
      l.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.product.sku ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  // Lines that have a discrepancy
  const discrepantLines = countLines.filter((l) => {
    const actual = parseFloat(l.actualQty);
    return !isNaN(actual) && actual !== l.product.currentStock;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const invalidLine = countLines.find((l) => {
      const v = parseFloat(l.actualQty);
      return isNaN(v) || v < 0;
    });

    if (invalidLine) {
      setError(
        `Gecersiz miktar: ${invalidLine.product.name}. Tum miktarlar gecerli ve negatif olmayan bir sayi olmalidir.`,
      );
      return;
    }

    // Only submit adjustments for products with differences
    const adjustments = discrepantLines.map((l) => ({
      productId: l.productId,
      newQty: parseFloat(l.actualQty),
      difference: parseFloat(l.actualQty) - l.product.currentStock,
    }));

    if (adjustments.length === 0) {
      setError('Hicbir fark bulunamadi. Sayim zaten guncel.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // POST each adjustment as a stock entry or stock movement
      await Promise.all(
        adjustments.map((adj) =>
          apiClient.post('/stock/entries', {
            productId: adj.productId,
            quantity: Math.abs(adj.difference),
            unitCost: 0,
            notes: `Stok sayimi duzeltmesi — ${formatDate(countDate)}`,
          }),
        ),
      );
      setSuccess(true);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sayim gonderilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Yukleniyor...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/stock" className="hover:text-gray-700">
              Stok
            </Link>
            <span>/</span>
            <span>Stok Sayimi</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Sayimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sayim tarihi: {formatDate(countDate)}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-500">Toplam Urun</p>
          <p className="text-2xl font-bold text-gray-900">{countLines.length}</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Stok sayimi basariyla kaydedildi. {discrepantLines.length} urun guncellendi.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Summary banner */}
      {discrepantLines.length > 0 && !submitted && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
          <span>
            <strong>{discrepantLines.length}</strong> urunde fark tespit edildi.
          </span>
          <span className="text-yellow-600">
            Sayimi gondermeden once kontrol edin.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Urun ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Urun</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Birim</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Sistem Stok</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-36">
                    Gercek Miktar
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Fark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Urun bulunamadi.
                    </td>
                  </tr>
                ) : (
                  filteredLines.map((line) => {
                    const actual = parseFloat(line.actualQty);
                    const diff = isNaN(actual) ? null : actual - line.product.currentStock;
                    const hasDiff = diff !== null && diff !== 0;
                    const isNegativeDiff = diff !== null && diff < 0;

                    return (
                      <tr
                        key={line.productId}
                        className={hasDiff ? 'bg-yellow-50/50' : 'hover:bg-gray-50'}
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/products/${line.productId}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {line.product.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">
                          {line.product.sku ?? '-'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {line.product.category?.name ?? '-'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{line.product.unit}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">
                          {line.product.currentStock}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={line.actualQty}
                            onChange={(e) =>
                              updateActualQty(line.productId, e.target.value)
                            }
                            disabled={submitted}
                            className={`w-full px-3 py-1.5 border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                              hasDiff
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-300'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {diff === null ? (
                            <span className="text-gray-300">-</span>
                          ) : diff === 0 ? (
                            <span className="text-green-500 text-xs">Esit</span>
                          ) : (
                            <span
                              className={`font-medium text-sm ${isNegativeDiff ? 'text-red-600' : 'text-blue-600'}`}
                            >
                              {diff > 0 ? '+' : ''}{diff.toFixed(3)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discrepancy summary */}
        {discrepantLines.length > 0 && !submitted && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Fark Ozeti ({discrepantLines.length} urun)
            </h3>
            <div className="space-y-1.5">
              {discrepantLines.map((l) => {
                const actual = parseFloat(l.actualQty);
                const diff = actual - l.product.currentStock;
                return (
                  <div key={l.productId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{l.product.name}</span>
                    <span className={`font-medium ${diff < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {l.product.currentStock} &rarr; {actual} ({diff > 0 ? '+' : ''}{diff.toFixed(3)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/stock"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Iptal
          </Link>
          <button
            type="submit"
            disabled={submitting || submitted || discrepantLines.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting
              ? 'Gondiriliyor...'
              : submitted
              ? 'Gonderildi'
              : `Sayimi Gonder (${discrepantLines.length} duzeltme)`}
          </button>
        </div>
      </form>
    </div>
  );
}
