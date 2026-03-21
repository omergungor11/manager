'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Product } from '@/types/product';

interface EntryLine {
  id: string;
  productId: string;
  productSearch: string;
  quantity: number;
  unitCost: number;
  invoiceNo: string;
  notes: string;
}

function makeId(): string {
  return Math.random().toString(36).slice(2);
}

function makeLine(): EntryLine {
  return {
    id: makeId(),
    productId: '',
    productSearch: '',
    quantity: 1,
    unitCost: 0,
    invoiceNo: '',
    notes: '',
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function StockEntryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<EntryLine[]>([makeLine()]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await apiClient.get<Product[]>('/products', { limit: 500 });
        setProducts(res.data);
      } catch {
        // silently fail
      }
    }
    void fetchProducts();
  }, []);

  function getFilteredProducts(search: string): Product[] {
    if (!search) return products.slice(0, 10);
    const q = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q),
      )
      .slice(0, 10);
  }

  function updateLine<K extends keyof EntryLine>(
    lineId: string,
    key: K,
    value: EntryLine[K],
  ) {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [key]: value } : l)),
    );
    if (error) setError(null);
  }

  function selectProduct(lineId: string, product: Product) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              productId: product.id,
              productSearch: product.name,
              unitCost: product.costPrice,
            }
          : l,
      ),
    );
    setActiveDropdown(null);
  }

  function addLine() {
    setLines((prev) => [...prev, makeLine()]);
  }

  function removeLine(lineId: string) {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }

  const totalCost = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const invalid = lines.find((l) => !l.productId);
    if (invalid) {
      setError('Tum satirlarda urun secilmis olmalidir.');
      return;
    }
    const zeroQty = lines.find((l) => l.quantity <= 0);
    if (zeroQty) {
      setError('Tum miktarlar 0\'dan buyuk olmalidir.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await Promise.all(
        lines.map((l) =>
          apiClient.post('/stock/entries', {
            productId: l.productId,
            quantity: l.quantity,
            unitCost: l.unitCost,
            invoiceNo: l.invoiceNo.trim() || undefined,
            notes: l.notes.trim() || undefined,
          }),
        ),
      );
      setSuccess(true);
      setTimeout(() => {
        router.push('/stock');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stok girisi yapilamadi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/stock" className="hover:text-gray-700">
              Stok
            </Link>
            <span>/</span>
            <span>Toplu Stok Girisi</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Toplu Stok Girisi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Birden fazla urun icin stok girisi yapin.
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          Stok girisleri basariyla kaydedildi. Yonlendiriliyor...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        {/* Lines */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-64">
                    Urun <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">
                    Miktar <span className="text-red-500">*</span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">
                    Birim Maliyet
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">
                    Toplam
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">
                    Fatura No
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notlar</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line) => {
                  const filtered = getFilteredProducts(line.productSearch);
                  const showDropdown =
                    activeDropdown === line.id &&
                    !line.productId &&
                    filtered.length > 0;

                  return (
                    <tr key={line.id} className="align-top">
                      {/* Product search */}
                      <td className="px-4 py-2 relative">
                        <input
                          type="text"
                          value={line.productSearch}
                          onChange={(e) => {
                            updateLine(line.id, 'productSearch', e.target.value);
                            updateLine(line.id, 'productId', '');
                            setActiveDropdown(line.id);
                          }}
                          onFocus={() => setActiveDropdown(line.id)}
                          onBlur={() => {
                            setTimeout(() => setActiveDropdown(null), 150);
                          }}
                          placeholder="Urun ara..."
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {showDropdown && (
                          <ul className="absolute z-10 left-4 right-4 top-full mt-1 border border-gray-200 rounded-lg bg-white shadow-md max-h-40 overflow-y-auto">
                            {filtered.map((p) => (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  onMouseDown={() => selectProduct(line.id, p)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
                                >
                                  <span>{p.name}</span>
                                  <span className="text-gray-400 text-xs">{p.sku ?? ''}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* Unit cost */}
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitCost}
                          onChange={(e) =>
                            updateLine(line.id, 'unitCost', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* Line total */}
                      <td className="px-4 py-2 text-right text-gray-700 font-medium pt-3.5 text-xs">
                        {formatCurrency(line.quantity * line.unitCost)}
                      </td>

                      {/* Invoice no */}
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={line.invoiceNo}
                          onChange={(e) => updateLine(line.id, 'invoiceNo', e.target.value)}
                          placeholder="INV-001"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={line.notes}
                          onChange={(e) => updateLine(line.id, 'notes', e.target.value)}
                          placeholder="Aciklama..."
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* Remove */}
                      <td className="px-4 py-2 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                          className="text-gray-300 hover:text-red-500 disabled:opacity-20 text-lg leading-none"
                          title="Satiri kaldir"
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add line */}
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              type="button"
              onClick={addLine}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Satir Ekle
            </button>
          </div>
        </div>

        {/* Footer: total + actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{lines.length}</span> urun |{' '}
            Toplam Maliyet:{' '}
            <span className="font-bold text-gray-900">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/stock"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Iptal
            </Link>
            <button
              type="submit"
              disabled={saving || success}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Kaydediliyor...' : 'Stok Girislerini Kaydet'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
