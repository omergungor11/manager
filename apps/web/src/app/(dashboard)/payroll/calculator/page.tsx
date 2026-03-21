'use client';

import { useState, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalculationResult {
  grossSalary: number;
  sgkEmployee: number;
  sgkEmployer: number;
  providentEmployee: number;
  providentEmployer: number;
  incomeTax: number;
  netSalary: number;
  totalEmployerCost: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return (
    '₺' +
    amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatPercent(part: number, total: number): string {
  if (total === 0) return '0%';
  return ((part / total) * 100).toFixed(1) + '%';
}

// ─── Breakdown Row ─────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  amount,
  total,
  color,
  sign,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
  sign?: '-' | '+';
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${color}`}
            style={{ width: `${Math.min(100, (amount / (total || 1)) * 100)}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 w-10 text-right">
          {formatPercent(amount, total)}
        </span>
        <span className={`text-sm font-semibold w-28 text-right ${sign === '-' ? 'text-red-600' : sign === '+' ? 'text-green-600' : 'text-gray-900'}`}>
          {sign === '-' ? '-' : sign === '+' ? '+' : ''}{formatMoney(amount)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayrollCalculatorPage() {
  const [grossInput, setGrossInput] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (grossSalary: number) => {
    if (grossSalary <= 0) {
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<CalculationResult>('/payroll/calculate', { grossSalary });
      setResult(res.data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Hesaplama başarısız.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleGrossChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setGrossInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      void calculate(parsed);
    } else {
      setResult(null);
      setError(null);
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maaş Hesaplayıcı</h1>
        <p className="mt-1 text-sm text-gray-500">
          Brüt maaştan net maaşa kesintileri hesaplayın
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input panel */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Brüt Maaş Girin</h2>
          <div>
            <label htmlFor="grossSalary" className="block text-sm font-medium text-gray-700 mb-1">
              Brüt Maaş (₺)
            </label>
            <input
              id="grossSalary"
              type="number"
              min="0"
              step="0.01"
              value={grossInput}
              onChange={handleGrossChange}
              placeholder="Örn: 25000"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading && (
            <p className="mt-4 text-sm text-gray-500">Hesaplanıyor...</p>
          )}

          {result && !isLoading && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Özet</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Brüt Maaş</span>
                  <span className="font-medium text-gray-900">{formatMoney(result.grossSalary)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Toplam Kesinti</span>
                  <span className="font-medium text-red-600">
                    -{formatMoney(result.grossSalary - result.netSalary)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Net Maaş</span>
                  <span className="text-lg font-bold text-green-700">{formatMoney(result.netSalary)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Breakdown panel */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Kesinti Detayı</h2>

          {!result && !isLoading && (
            <div className="py-12 text-center text-sm text-gray-400">
              Hesaplama sonuçları burada görüntülenecek.
            </div>
          )}

          {isLoading && (
            <div className="py-12 text-center text-sm text-gray-500">Yükleniyor...</div>
          )}

          {result && !isLoading && (
            <div>
              {/* Flow: Brüt → deductions → Net */}
              <div className="space-y-1">
                <BreakdownRow
                  label="Brüt Maaş"
                  amount={result.grossSalary}
                  total={result.grossSalary}
                  color="bg-gray-600"
                />
                <BreakdownRow
                  label="SGK Primi (Çalışan)"
                  amount={result.sgkEmployee}
                  total={result.grossSalary}
                  color="bg-orange-400"
                  sign="-"
                />
                <BreakdownRow
                  label="İhtiyat Sandığı (Çalışan)"
                  amount={result.providentEmployee}
                  total={result.grossSalary}
                  color="bg-purple-400"
                  sign="-"
                />
                <BreakdownRow
                  label="Gelir Vergisi"
                  amount={result.incomeTax}
                  total={result.grossSalary}
                  color="bg-red-400"
                  sign="-"
                />
                <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-800">Net Maaş</span>
                  <span className="text-xl font-bold text-green-700">{formatMoney(result.netSalary)}</span>
                </div>
              </div>

              {/* Employer cost */}
              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-3">
                  İşveren Maliyeti
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">SGK Primi (İşveren)</span>
                    <span className="font-medium text-blue-900">{formatMoney(result.sgkEmployer)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">İhtiyat Sandığı (İşveren)</span>
                    <span className="font-medium text-blue-900">{formatMoney(result.providentEmployer)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between">
                    <span className="text-sm font-semibold text-blue-900">Toplam İşveren Maliyeti</span>
                    <span className="text-base font-bold text-blue-900">{formatMoney(result.totalEmployerCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
