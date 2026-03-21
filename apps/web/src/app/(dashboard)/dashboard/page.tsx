import type { Metadata } from 'next';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { WorkOrderListItem } from '@/types/work-order';

export const metadata: Metadata = {
  title: 'Dashboard',
};

// ------------------------------------------------------------------- types ---

interface DashboardStats {
  todayWorkOrders: number;
  openInvoices: number;
  lowStockItems: number;
  monthlyRevenue: number;
}

interface RecentWorkOrder {
  id: string;
  orderNo: string;
  customerName: string;
  licensePlate: string;
  status: string;
  createdAt: string;
}

// ------------------------------------------------------------------ status --

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Bekliyor',
  IN_PROGRESS: 'Devam Ediyor',
  WAITING_PARTS: 'Parça Bekleniyor',
  COMPLETED: 'Tamamlandı',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

// ----------------------------------------------------------------- fetcher ---

async function fetchDashboardData(): Promise<{
  stats: DashboardStats;
  recentWorkOrders: RecentWorkOrder[];
}> {
  try {
    const [workOrdersRes] = await Promise.allSettled([
      apiClient.get<{ items: WorkOrderListItem[]; total: number }>('/api/v1/work-orders', {
        limit: 5,
        orderBy: 'createdAt',
        orderDir: 'desc',
      }),
    ]);

    const recentWorkOrders: RecentWorkOrder[] =
      workOrdersRes.status === 'fulfilled'
        ? workOrdersRes.value.data.items.map((wo) => ({
            id: wo.id,
            orderNo: wo.orderNo,
            customerName: wo.customer.name,
            licensePlate: wo.vehicle.licensePlate,
            status: wo.status,
            createdAt: wo.createdAt,
          }))
        : [];

    // Placeholder stats — replace with real API calls when endpoints are ready
    const stats: DashboardStats = {
      todayWorkOrders: recentWorkOrders.filter((wo) => {
        const today = new Date().toDateString();
        return new Date(wo.createdAt).toDateString() === today;
      }).length,
      openInvoices: 0,
      lowStockItems: 0,
      monthlyRevenue: 0,
    };

    return { stats, recentWorkOrders };
  } catch {
    return {
      stats: { todayWorkOrders: 0, openInvoices: 0, lowStockItems: 0, monthlyRevenue: 0 },
      recentWorkOrders: [],
    };
  }
}

// ---------------------------------------------------------------- components -

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentClass,
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${accentClass}`}>
          {icon}
        </div>
      </div>
    </Link>
  );
}

// ------------------------------------------------------------------- icons ---

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconArchive({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );
}

function IconCurrency({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function IconUserPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// -------------------------------------------------------------------- page ---

export default async function DashboardPage() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Günaydın' : now.getHours() < 18 ? 'İyi günler' : 'İyi akşamlar';
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { stats, recentWorkOrders } = await fetchDashboardData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{greeting}, Yönetici</h2>
        <p className="mt-1 text-sm text-gray-500 capitalize">{dateStr}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Bugünkü İş Emirleri"
          value={stats.todayWorkOrders}
          subtitle="Bugün oluşturulan"
          accentClass="bg-blue-50 text-blue-600"
          href="/work-orders"
          icon={<IconClipboard className="w-6 h-6" />}
        />
        <StatCard
          title="Açık Faturalar"
          value={stats.openInvoices}
          subtitle="Ödeme bekleyen"
          accentClass="bg-yellow-50 text-yellow-600"
          href="/invoices"
          icon={<IconReceipt className="w-6 h-6" />}
        />
        <StatCard
          title="Düşük Stok"
          value={stats.lowStockItems}
          subtitle="Kritik seviyede ürün"
          accentClass="bg-red-50 text-red-600"
          href="/stock"
          icon={<IconArchive className="w-6 h-6" />}
        />
        <StatCard
          title="Aylık Gelir"
          value={
            stats.monthlyRevenue > 0
              ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.monthlyRevenue)
              : '—'
          }
          subtitle={`${now.toLocaleDateString('tr-TR', { month: 'long' })} ayı`}
          accentClass="bg-green-50 text-green-600"
          href="/finance"
          icon={<IconCurrency className="w-6 h-6" />}
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/work-orders/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <IconPlus className="w-4 h-4" />
            Yeni İş Emri
            <kbd className="hidden sm:inline text-xs font-mono bg-blue-700 px-1.5 py-0.5 rounded">F2</kbd>
          </Link>
          <Link
            href="/vehicles"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <IconSearch className="w-4 h-4 text-gray-400" />
            Plaka Ara
            <kbd className="hidden sm:inline text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">F3</kbd>
          </Link>
          <Link
            href="/customers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <IconUserPlus className="w-4 h-4 text-gray-400" />
            Yeni Müşteri
          </Link>
        </div>
      </div>

      {/* Recent work orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Son İş Emirleri</h3>
          <Link
            href="/work-orders"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Tümünü Gör
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentWorkOrders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <IconClipboard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Henüz iş emri bulunmuyor.</p>
            <Link
              href="/work-orders/new"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <IconPlus className="w-4 h-4" />
              İlk iş emrini oluştur
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    İş Emri
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plaka
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-5 py-3" aria-hidden="true" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentWorkOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-blue-600">
                      {wo.orderNo}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-900">{wo.customerName}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {wo.licensePlate}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[wo.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {STATUS_LABEL[wo.status] ?? wo.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Date(wo.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
