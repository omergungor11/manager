'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollParam {
  name: string;
  value: number;
  description: string | null;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Param Row ────────────────────────────────────────────────────────────────

function ParamRow({
  param,
  onSave,
}: {
  param: PayrollParam;
  onSave: (name: string, value: number) => Promise<void>;
}) {
  const [editValue, setEditValue] = useState(String(param.value));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isDirty = parseFloat(editValue) !== param.value;

  async function handleSave() {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed)) {
      setError('Geçerli bir sayı girin.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(param.name, parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Kayıt başarısız.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-900">{param.name}</p>
        {param.description && (
          <p className="mt-0.5 text-xs text-gray-400">{param.description}</p>
        )}
      </td>
      <td className="px-6 py-4 w-52">
        <div className="space-y-1">
          <input
            type="number"
            step="0.001"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError(null);
              setSaved(false);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(param.updatedAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {saved ? (
          <span className="text-sm text-green-600 font-medium">Kaydedildi</span>
        ) : (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !isDirty}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayrollSettingsPage() {
  const [params, setParams] = useState<PayrollParam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchParams = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<PayrollParam[]>('/payroll/params');
      setParams(res.data);
    } catch (err) {
      setLoadError(
        err instanceof ApiClientError ? err.message : 'Parametreler yüklenemedi.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchParams();
  }, [fetchParams]);

  async function handleSave(name: string, value: number) {
    const res = await apiClient.put<PayrollParam>(`/payroll/params/${encodeURIComponent(name)}`, { value });
    // Update the local param with the fresh server value
    setParams((prev) =>
      prev.map((p) => (p.name === name ? res.data : p)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bordro Ayarları</h1>
        <p className="mt-1 text-sm text-gray-500">
          SGK oranları, ihtiyat sandığı, vergi dilimleri ve asgari ücret parametreleri
        </p>
      </div>

      {/* Params table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Yükleniyor...</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchParams()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Tekrar dene
            </button>
          </div>
        ) : params.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Parametre bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parametre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Değer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Güncelleme
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {params.map((param) => (
                  <ParamRow key={param.name} param={param} onSave={handleSave} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-800">
          Parametre değişiklikleri yeni oluşturulan bordrolar için geçerli olacaktır.
          Mevcut bordrolar etkilenmez.
        </p>
      </div>
    </div>
  );
}
