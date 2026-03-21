'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi, type Tenant } from '../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-900 text-green-300',
  inactive: 'bg-yellow-900 text-yellow-300',
  suspended: 'bg-red-900 text-red-300',
  deleted: 'bg-gray-700 text-gray-400',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Ücretsiz',
  pro: 'Pro',
  enterprise: 'Kurumsal',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  suspended: 'Askıda',
  deleted: 'Silindi',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getTenants({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit,
      });
      setTenants(res.data);
      const meta = res.meta as { total?: number } | undefined;
      setTotal(meta?.total ?? res.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFreeze(id: string) {
    setActionLoading(id);
    try {
      await adminApi.updateTenant(id, { status: 'suspended' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleActivate(id: string) {
    setActionLoading(id);
    try {
      await adminApi.updateTenant(id, { status: 'active' });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" tenant'ını silmek istediğinize emin misiniz?`)) {
      return;
    }
    setActionLoading(id);
    try {
      await adminApi.deleteTenant(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Tenantlar</h2>
          <p className="text-gray-400 text-sm">Toplam {total} tenant</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Yeni Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Ad veya slug ile ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="inactive">Pasif</option>
          <option value="suspended">Askıda</option>
          <option value="deleted">Silindi</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tenant bulunamadı.</div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Oluşturulma
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  İşlemler
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
                      {STATUS_LABELS[tenant.status] ?? tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {new Date(tenant.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="px-3 py-1 text-xs text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 rounded-md transition-colors"
                      >
                        Detay
                      </Link>
                      {tenant.status === 'active' ? (
                        <button
                          type="button"
                          disabled={actionLoading === tenant.id}
                          onClick={() => void handleFreeze(tenant.id)}
                          className="px-3 py-1 text-xs text-yellow-300 border border-yellow-800 hover:border-yellow-600 rounded-md transition-colors disabled:opacity-50"
                        >
                          Dondur
                        </button>
                      ) : tenant.status === 'suspended' ? (
                        <button
                          type="button"
                          disabled={actionLoading === tenant.id}
                          onClick={() => void handleActivate(tenant.id)}
                          className="px-3 py-1 text-xs text-green-300 border border-green-800 hover:border-green-600 rounded-md transition-colors disabled:opacity-50"
                        >
                          Aktifleştir
                        </button>
                      ) : null}
                      {tenant.status !== 'deleted' && (
                        <button
                          type="button"
                          disabled={actionLoading === tenant.id}
                          onClick={() => void handleDelete(tenant.id, tenant.name)}
                          className="px-3 py-1 text-xs text-red-300 border border-red-900 hover:border-red-700 rounded-md transition-colors disabled:opacity-50"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Geri
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              İleri
            </button>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function CreateTenantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('free');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createTenant({ name: name.trim(), slug: slug.trim(), plan });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oluşturma başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Yeni Tenant</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            &#x2715;
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ad <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              placeholder="Örnek Oto Servis"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Slug <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="ornek-oto"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Subdomain olarak kullanılır: {slug || 'slug'}.manager.app
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="free">Ücretsiz</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Kurumsal</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
