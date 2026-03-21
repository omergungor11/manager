'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncomeExpenseData {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  incomeByCategory: Array<{ category: string; amount: number }>;
  expenseByCategory: Array<{ category: string; amount: number }>;
}

interface ProfitLossData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
}

interface StockReportData {
  lowStockItems: number;
  mostSoldProducts: Array<{ name: string; qty: number; revenue: number }>;
  totalStockValue: number;
  inventoryTurnover: number;
}

interface CustomerReportData {
  topCustomers: Array<{ id: string; name: string; revenue: number; orderCount: number }>;
  newCustomersCount: number;
  byType: Array<{ type: string; count: number }>;
}

interface VehicleReportData {
  mostServiced: Array<{ plate: string; brand: string; model: string; count: number }>;
  byBrand: Array<{ brand: string; count: number }>;
  avgFrequency: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(value);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type RangePreset = 'this-month' | 'last-month' | 'this-year' | 'custom';

function presetToDates(preset: RangePreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  switch (preset) {
    case 'this-month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { dateFrom: isoDate(from), dateTo: isoDate(to) };
    }
    case 'last-month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { dateFrom: isoDate(from), dateTo: isoDate(to) };
    }
    case 'this-year': {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = new Date(now.getFullYear(), 11, 31);
      return { dateFrom: isoDate(from), dateTo: isoDate(to) };
    }
    default: {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { dateFrom: isoDate(from), dateTo: isoDate(to) };
    }
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  children,
  loading,
  error,
}: {
  title: string;
  children: React.ReactNode;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-5 py-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Yükleniyor...</div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-red-500">{error}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}) {
  const valueClass =
    highlight === 'positive'
      ? 'text-green-600 font-semibold'
      : highlight === 'negative'
        ? 'text-red-600 font-semibold'
        : 'text-gray-900 font-medium';

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}

/** Horizontal bar: filled fraction relative to max */
function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 truncate max-w-[160px]">{label}</span>
        <span className="text-xs font-medium text-gray-900">{formatCurrency(value)}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function IncomeExpenseSection({
  data,
  loading,
  error,
}: {
  data: IncomeExpenseData | null;
  loading: boolean;
  error: string | null;
}) {
  const maxVal = data
    ? Math.max(data.totalIncome, data.totalExpense, 1)
    : 1;

  return (
    <SectionCard title="Gelir-Gider Ozeti" loading={loading} error={error}>
      {data && (
        <div className="space-y-4">
          {/* Comparison bars */}
          <div className="space-y-1">
            <BarRow
              label="Toplam Gelir"
              value={data.totalIncome}
              max={maxVal}
              color="bg-green-500"
            />
            <BarRow
              label="Toplam Gider"
              value={data.totalExpense}
              max={maxVal}
              color="bg-red-400"
            />
          </div>

          {/* Net profit highlight */}
          <div
            className={`rounded-lg px-4 py-3 text-center ${
              data.netProfit >= 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p className="text-xs text-gray-500 mb-0.5">Net Kar / Zarar</p>
            <p
              className={`text-2xl font-bold ${
                data.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {formatCurrency(data.netProfit)}
            </p>
          </div>

          {/* Category breakdown */}
          {data.incomeByCategory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Gelir Kategorileri
              </p>
              {data.incomeByCategory.map((cat) => (
                <BarRow
                  key={cat.category}
                  label={cat.category}
                  value={cat.amount}
                  max={data.totalIncome}
                  color="bg-emerald-400"
                />
              ))}
            </div>
          )}

          {data.expenseByCategory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Gider Kategorileri
              </p>
              {data.expenseByCategory.map((cat) => (
                <BarRow
                  key={cat.category}
                  label={cat.category}
                  value={cat.amount}
                  max={data.totalExpense}
                  color="bg-orange-400"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function ProfitLossSection({
  data,
  loading,
  error,
}: {
  data: ProfitLossData | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <SectionCard title="Kar / Zarar Tablosu" loading={loading} error={error}>
      {data && (
        <div className="space-y-0">
          <StatRow label="Ciro (Hasılat)" value={formatCurrency(data.revenue)} />
          <StatRow label="Satılan Malın Maliyeti (SMM)" value={formatCurrency(data.cogs)} />
          <StatRow
            label="Brüt Kar"
            value={formatCurrency(data.grossProfit)}
            highlight={data.grossProfit >= 0 ? 'positive' : 'negative'}
          />
          <StatRow label="Faaliyet Giderleri" value={formatCurrency(data.operatingExpenses)} />
          <div className="mt-2 pt-2 border-t border-gray-200">
            <StatRow
              label="Net Kar / Zarar"
              value={formatCurrency(data.netProfit)}
              highlight={data.netProfit >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function StockReportSection({
  data,
  loading,
  error,
}: {
  data: StockReportData | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <SectionCard title="Stok Durumu" loading={loading} error={error}>
      {data && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`rounded-lg px-3 py-3 border ${
                data.lowStockItems > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <p className="text-xs text-gray-500">Düsük Stok</p>
              <p
                className={`text-2xl font-bold mt-0.5 ${
                  data.lowStockItems > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {data.lowStockItems}
              </p>
              <p className="text-xs text-gray-400">ürün</p>
            </div>
            <div className="rounded-lg px-3 py-3 border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">Toplam Stok Degeri</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {formatCurrency(data.totalStockValue)}
              </p>
              <p className="text-xs text-gray-400">Devir: {data.inventoryTurnover.toFixed(1)}x</p>
            </div>
          </div>

          {/* Most sold */}
          {data.mostSoldProducts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                En Çok Satan Ürünler
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2 text-xs font-medium text-gray-500">Ürün</th>
                      <th className="pb-2 text-xs font-medium text-gray-500 text-right">Adet</th>
                      <th className="pb-2 text-xs font-medium text-gray-500 text-right">Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.mostSoldProducts.slice(0, 8).map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-1.5 text-gray-900 text-xs">{p.name}</td>
                        <td className="py-1.5 text-right text-gray-600 text-xs">{p.qty}</td>
                        <td className="py-1.5 text-right text-gray-900 font-medium text-xs">
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function CustomerReportSection({
  data,
  loading,
  error,
}: {
  data: CustomerReportData | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <SectionCard title="Müsteri Raporu" loading={loading} error={error}>
      {data && (
        <div className="space-y-4">
          {/* New customers */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex-1 text-center">
              <p className="text-xs text-gray-500">Yeni Müsteri</p>
              <p className="text-3xl font-bold text-blue-600 mt-0.5">{data.newCustomersCount}</p>
              <p className="text-xs text-gray-400">bu dönemde</p>
            </div>
            {data.byType.length > 0 && (
              <div className="flex-1 space-y-1">
                {data.byType.map((t) => (
                  <div key={t.type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 text-xs">
                      {t.type === 'individual' ? 'Bireysel' : t.type === 'company' ? 'Kurumsal' : t.type}
                    </span>
                    <span className="font-medium text-gray-900 text-xs">{t.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top customers */}
          {data.topCustomers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                En Yüksek Ciro — Top 5
              </p>
              <div className="space-y-0">
                {data.topCustomers.slice(0, 5).map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.orderCount} siparis</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(c.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function VehicleReportSection({
  data,
  loading,
  error,
}: {
  data: VehicleReportData | null;
  loading: boolean;
  error: string | null;
}) {
  const maxBrandCount = data ? Math.max(...data.byBrand.map((b) => b.count), 1) : 1;

  return (
    <SectionCard title="Araç Raporu" loading={loading} error={error}>
      {data && (
        <div className="space-y-4">
          {/* Avg frequency */}
          <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3 text-center">
            <p className="text-xs text-gray-500">Ortalama Servis Sıklığı</p>
            <p className="text-2xl font-bold text-purple-700 mt-0.5">{data.avgFrequency.toFixed(1)}x</p>
            <p className="text-xs text-gray-400">araç başına / dönem</p>
          </div>

          {/* Most serviced */}
          {data.mostServiced.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                En Çok Servis Gören Araçlar
              </p>
              <div className="space-y-0">
                {data.mostServiced.slice(0, 5).map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{v.plate}</p>
                        <p className="text-xs text-gray-400">{v.brand} {v.model}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {v.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand distribution */}
          {data.byBrand.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Marka Dağılımı
              </p>
              <div className="space-y-1">
                {data.byBrand.slice(0, 8).map((b) => (
                  <BarRow
                    key={b.brand}
                    label={b.brand}
                    value={b.count}
                    max={maxBrandCount}
                    color="bg-purple-400"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PRESET_LABELS: Record<RangePreset, string> = {
  'this-month': 'Bu Ay',
  'last-month': 'Geçen Ay',
  'this-year': 'Bu Yıl',
  custom: 'Özel Aralık',
};

export default function ReportsPage() {
  const [preset, setPreset] = useState<RangePreset>('this-month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const effectiveDates = useCallback((): { dateFrom: string; dateTo: string } => {
    if (preset === 'custom' && customFrom && customTo) {
      return { dateFrom: customFrom, dateTo: customTo };
    }
    return presetToDates(preset);
  }, [preset, customFrom, customTo]);

  // Report data state
  const [incomeExpense, setIncomeExpense] = useState<IncomeExpenseData | null>(null);
  const [incomeExpenseLoading, setIncomeExpenseLoading] = useState(false);
  const [incomeExpenseError, setIncomeExpenseError] = useState<string | null>(null);

  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [profitLossLoading, setProfitLossLoading] = useState(false);
  const [profitLossError, setProfitLossError] = useState<string | null>(null);

  const [stockReport, setStockReport] = useState<StockReportData | null>(null);
  const [stockReportLoading, setStockReportLoading] = useState(false);
  const [stockReportError, setStockReportError] = useState<string | null>(null);

  const [customerReport, setCustomerReport] = useState<CustomerReportData | null>(null);
  const [customerReportLoading, setCustomerReportLoading] = useState(false);
  const [customerReportError, setCustomerReportError] = useState<string | null>(null);

  const [vehicleReport, setVehicleReport] = useState<VehicleReportData | null>(null);
  const [vehicleReportLoading, setVehicleReportLoading] = useState(false);
  const [vehicleReportError, setVehicleReportError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    const { dateFrom, dateTo } = effectiveDates();
    if (!dateFrom || !dateTo) return;

    const dateParams = { dateFrom, dateTo };

    // Income-Expense
    setIncomeExpenseLoading(true);
    setIncomeExpenseError(null);
    apiClient
      .get<IncomeExpenseData>('/reports/income-expense', dateParams)
      .then((res) => setIncomeExpense(res.data))
      .catch((err) =>
        setIncomeExpenseError(
          err instanceof ApiClientError ? err.message : 'Gelir-gider verisi yüklenemedi.',
        ),
      )
      .finally(() => setIncomeExpenseLoading(false));

    // Profit-Loss
    setProfitLossLoading(true);
    setProfitLossError(null);
    apiClient
      .get<ProfitLossData>('/reports/profit-loss', dateParams)
      .then((res) => setProfitLoss(res.data))
      .catch((err) =>
        setProfitLossError(
          err instanceof ApiClientError ? err.message : 'Kar/zarar verisi yüklenemedi.',
        ),
      )
      .finally(() => setProfitLossLoading(false));

    // Stock
    setStockReportLoading(true);
    setStockReportError(null);
    apiClient
      .get<StockReportData>('/reports/stock')
      .then((res) => setStockReport(res.data))
      .catch((err) =>
        setStockReportError(
          err instanceof ApiClientError ? err.message : 'Stok raporu yüklenemedi.',
        ),
      )
      .finally(() => setStockReportLoading(false));

    // Customers
    setCustomerReportLoading(true);
    setCustomerReportError(null);
    apiClient
      .get<CustomerReportData>('/reports/customers', dateParams)
      .then((res) => setCustomerReport(res.data))
      .catch((err) =>
        setCustomerReportError(
          err instanceof ApiClientError ? err.message : 'Müşteri raporu yüklenemedi.',
        ),
      )
      .finally(() => setCustomerReportLoading(false));

    // Vehicles
    setVehicleReportLoading(true);
    setVehicleReportError(null);
    apiClient
      .get<VehicleReportData>('/reports/vehicles', dateParams)
      .then((res) => setVehicleReport(res.data))
      .catch((err) =>
        setVehicleReportError(
          err instanceof ApiClientError ? err.message : 'Araç raporu yüklenemedi.',
        ),
      )
      .finally(() => setVehicleReportLoading(false));
  }, [effectiveDates]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const { dateFrom, dateTo } = effectiveDates();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {dateFrom} — {dateTo}
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex flex-wrap gap-2 items-center">
          {(Object.keys(PRESET_LABELS) as RangePreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                preset === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}

          {preset === 'custom' && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <input
                type="date"
                value={customFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomFrom(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTo(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => void fetchReports()}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
              >
                Uygula
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseSection
          data={incomeExpense}
          loading={incomeExpenseLoading}
          error={incomeExpenseError}
        />
        <ProfitLossSection
          data={profitLoss}
          loading={profitLossLoading}
          error={profitLossError}
        />
        <StockReportSection
          data={stockReport}
          loading={stockReportLoading}
          error={stockReportError}
        />
        <CustomerReportSection
          data={customerReport}
          loading={customerReportLoading}
          error={customerReportError}
        />
      </div>

      {/* Vehicle report — full width */}
      <VehicleReportSection
        data={vehicleReport}
        loading={vehicleReportLoading}
        error={vehicleReportError}
      />
    </div>
  );
}
