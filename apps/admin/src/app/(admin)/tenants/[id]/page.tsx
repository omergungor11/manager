'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, type Tenant, type TenantStats } from '../../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900 text-green-300 border-green-700',
  inactive: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  suspended: 'bg-red-900 text-red-300 border-red-700',
  deleted: 'bg-gray-700 text-gray-400 border-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  suspended: 'Askıda',
  deleted: 'Silindi',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Ücretsiz',
  pro: 'Pro',
  enterprise: 'Kurumsal',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-3 border-b border-gray-700 last:border-0">
      <dt className="w-40 flex-shrink-0 text-sm text-gray-400">{label}</dt>
      <dd className="flex-1 text-sm text-white">{value}</dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString('tr-TR')}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadTenant() {
    try {
      const res = await adminApi.getTenant(id);
      setTenant(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tenant yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res = await adminApi.getTenantStats(id);
      setStats(res.data);
    } catch {
      // Stats may not be available if schema doesn't exist yet
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    void loadTenant();
    void loadStats();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!tenant) return;
    setActionLoading(true);
    try {
      const res = await adminApi.updateTenant(id, { status: newStatus });
      setTenant(res.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!tenant) return;
    if (
      !confirm(
        `"${tenant.name}" tenant'ını kalıcı olarak silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.deleteTenant(id);
      router.push('/tenants');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silme başarısız');
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-6">
        <p className="text-red-300 font-medium">Hata: {error ?? 'Tenant bulunamadı'}</p>
        <Link
          href="/tenants"
          className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
        >
          &larr; Geri dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/tenants" className="hover:text-white transition-colors">
          Tenantlar
        </Link>
        <span>/</span>
        <span className="text-white">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{tenant.name}</h2>
          <p className="text-gray-400 text-sm font-mono mt-1">{tenant.slug}</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[tenant.status] ?? 'bg-gray-700 text-gray-300 border-gray-600'}`}
        >
          {STATUS_LABELS[tenant.status] ?? tenant.status}
        </span>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Istatistikler
        </h3>
        {statsLoading ? (
          <p className="text-gray-400 text-sm">Istatistikler yükleniyor...</p>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Kullanıcı" value={stats.users} color="text-indigo-400" />
            <StatCard label="Is Emri" value={stats.workOrders} color="text-blue-400" />
            <StatCard label="Fatura" value={stats.invoices} color="text-green-400" />
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Istatistikler henüz mevcut degil (schema olusturulmamis olabilir).
          </p>
        )}
      </div>

      {/* Tenant info */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tenant Bilgileri</h3>
        <dl>
          <InfoRow label="ID" value={<span className="font-mono text-xs text-gray-300">{tenant.id}</span>} />
          <InfoRow label="Ad" value={tenant.name} />
          <InfoRow label="Slug" value={<span className="font-mono">{tenant.slug}</span>} />
          <InfoRow
            label="Domain"
            value={tenant.domain ?? <span className="text-gray-500 italic">Ayarlanmamis</span>}
          />
          <InfoRow label="Plan" value={PLAN_LABELS[tenant.plan] ?? tenant.plan} />
          <InfoRow
            label="Durum"
            value={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tenant.status] ?? ''}`}
              >
                {STATUS_LABELS[tenant.status] ?? tenant.status}
              </span>
            }
          />
          <InfoRow
            label="Olusturulma"
            value={new Date(tenant.createdAt).toLocaleString('tr-TR')}
          />
          <InfoRow
            label="Güncellenme"
            value={new Date(tenant.updatedAt).toLocaleString('tr-TR')}
          />
        </dl>
      </div>

      {/* Actions */}
      {tenant.status !== 'deleted' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Islemler</h3>
          <div className="flex flex-wrap gap-3">
            {tenant.status === 'active' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleStatusChange('suspended')}
                className="px-4 py-2 text-sm font-medium text-yellow-300 border border-yellow-800 hover:border-yellow-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Dondur (Askıya Al)
              </button>
            )}

            {tenant.status === 'suspended' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleStatusChange('active')}
                className="px-4 py-2 text-sm font-medium text-green-300 border border-green-800 hover:border-green-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Aktifleştir
              </button>
            )}

            {tenant.status === 'active' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleStatusChange('inactive')}
                className="px-4 py-2 text-sm font-medium text-gray-300 border border-gray-600 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50"
              >
                Pasif Yap
              </button>
            )}

            {tenant.status === 'inactive' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleStatusChange('active')}
                className="px-4 py-2 text-sm font-medium text-green-300 border border-green-800 hover:border-green-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Aktifleştir
              </button>
            )}

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => void handleDelete()}
              className="px-4 py-2 text-sm font-medium text-red-300 border border-red-900 hover:border-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Tenant'ı Sil
            </button>
          </div>
          {actionLoading && (
            <p className="text-sm text-gray-400 mt-3">İşlem yapılıyor...</p>
          )}
        </div>
      )}
    </div>
  );
}
