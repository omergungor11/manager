'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, type GlobalStats, type Tenant } from '../../../lib/api';

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900 text-green-300',
  inactive: 'bg-yellow-900 text-yellow-300',
  suspended: 'bg-red-900 text-red-300',
  deleted: 'bg-gray-700 text-gray-400',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Ucretsiz',
  pro: 'Pro',
  enterprise: 'Kurumsal',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, tenantsRes] = await Promise.all([
          adminApi.getGlobalStats(),
          adminApi.getTenants({ limit: 5 }),
        ]);
        setStats(statsRes.data);
        setTenants(tenantsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veri yuklenemedi');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Yukleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-6">
        <p className="text-red-300 font-medium">Hata: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
        <p className="text-gray-400 text-sm">Platform genel bakis</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Toplam Tenant"
          value={stats?.totalTenants ?? 0}
          color="text-white"
        />
        <StatCard
          label="Aktif Tenant"
          value={stats?.activeTenants ?? 0}
          color="text-green-400"
        />
        <StatCard
          label="Toplam Kullanici"
          value={stats?.totalUsers ?? 0}
          color="text-indigo-400"
        />
      </div>

      {/* Recent tenants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Son Tenantlar</h3>
          <Link
            href="/tenants"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Tamamini Gor &rarr;
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {tenants.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Henuz tenant yok.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="hover:text-indigo-400 transition-colors"
                      >
                        {tenant.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {tenant.slug}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tenant.status] ?? 'bg-gray-700 text-gray-300'}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
