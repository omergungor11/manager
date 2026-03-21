'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';
import ReminderRuleForm, {
  type ReminderRule,
  type ReminderRuleFormValues,
} from './components/reminder-rule-form';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
type NotificationChannel = 'sms' | 'email' | 'whatsapp';
type NotificationType = string;

interface Notification {
  id: string;
  createdAt: string;
  channel: NotificationChannel;
  type: NotificationType;
  recipient: string;
  status: NotificationStatus;
}

interface NotificationStats {
  byStatus: Array<{ status: NotificationStatus; count: number }>;
  byChannel: Array<{ channel: NotificationChannel; count: number }>;
  total: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type Tab = 'notifications' | 'rules';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<NotificationStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  SENT: 'bg-green-100 text-green-700 border border-green-200',
  FAILED: 'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_LABEL: Record<NotificationStatus, string> = {
  PENDING: 'Bekliyor',
  SENT: 'Gönderildi',
  FAILED: 'Başarısız',
};

const CHANNEL_BADGE: Record<NotificationChannel, string> = {
  sms: 'bg-blue-100 text-blue-700 border border-blue-200',
  email: 'bg-purple-100 text-purple-700 border border-purple-200',
  whatsapp: 'bg-green-100 text-green-700 border border-green-200',
};

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  sms: 'SMS',
  email: 'E-posta',
  whatsapp: 'WhatsApp',
};

function StatusBadge({ status }: { status: NotificationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CHANNEL_BADGE[channel] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {CHANNEL_LABEL[channel] ?? channel}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stats cards
// ---------------------------------------------------------------------------

function StatsCards({
  stats,
  loading,
}: {
  stats: NotificationStats | null;
  loading: boolean;
}) {
  function countByStatus(status: NotificationStatus): number {
    if (!stats) return 0;
    return stats.byStatus.find((s) => s.status === status)?.count ?? 0;
  }

  const cards = [
    {
      label: 'Gönderilen',
      value: countByStatus('SENT'),
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200',
    },
    {
      label: 'Bekleyen',
      value: countByStatus('PENDING'),
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 border-yellow-200',
    },
    {
      label: 'Başarısız',
      value: countByStatus('FAILED'),
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
    },
    {
      label: 'Toplam',
      value: stats?.total ?? 0,
      color: 'text-gray-900',
      bg: 'bg-gray-50 border-gray-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border px-4 py-4 ${card.bg}`}
        >
          <p className="text-xs text-gray-500">{card.label}</p>
          {loading ? (
            <div className="h-8 w-12 mt-1 rounded bg-gray-200 animate-pulse" />
          ) : (
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notification list tab
// ---------------------------------------------------------------------------

const LIMIT = 20;

function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      if (channelFilter) params.channel = channelFilter;

      const res = await apiClient.get<Notification[]>('/notifications', params);
      setNotifications(res.data);
      if (res.meta) {
        setMeta({
          total: res.meta.total ?? 0,
          page: res.meta.page ?? 1,
          limit: res.meta.limit ?? LIMIT,
          totalPages: res.meta.totalPages ?? 0,
        });
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Bildirimler yüklenemedi.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, channelFilter]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function handleSend(id: string) {
    setSendingId(id);
    try {
      await apiClient.post<Notification>(`/notifications/${id}/send`, {});
      void fetchNotifications();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Gönderim başarısız.');
    } finally {
      setSendingId(null);
    }
  }

  const selectClass =
    'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setStatusFilter(e.target.value as NotificationStatus | '');
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">Tüm Durumlar</option>
          <option value="PENDING">Bekliyor</option>
          <option value="SENT">Gönderildi</option>
          <option value="FAILED">Başarısız</option>
        </select>

        <select
          value={channelFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setChannelFilter(e.target.value as NotificationChannel | '');
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">Tüm Kanallar</option>
          <option value="sms">SMS</option>
          <option value="email">E-posta</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Tekrar dene
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Bildirim bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kanal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tür</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Alıcı</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Durum</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(n.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ChannelBadge channel={n.channel} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{n.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{n.recipient}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {n.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => void handleSend(n.id)}
                          disabled={sendingId === n.id}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {sendingId === n.id ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Sayfa{' '}
            <span className="font-medium">{meta.page}</span>
            {' / '}
            <span className="font-medium">{meta.totalPages}</span>
            {' — '}
            <span className="font-medium">{meta.total}</span> bildirim
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages || loading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reminder rules tab
// ---------------------------------------------------------------------------

function ReminderRulesTab() {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ReminderRule | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ReminderRule[]>('/reminder-rules');
      setRules(res.data);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Hatırlatma kuralları yüklenemedi.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  async function handleCreate(values: ReminderRuleFormValues) {
    await apiClient.post<ReminderRule>('/reminder-rules', values);
    setShowForm(false);
    void fetchRules();
  }

  async function handleEdit(values: ReminderRuleFormValues) {
    if (!editTarget) return;
    await apiClient.patch<ReminderRule>(`/reminder-rules/${editTarget.id}`, values);
    setEditTarget(undefined);
    setShowForm(false);
    void fetchRules();
  }

  async function handleToggleActive(rule: ReminderRule) {
    setTogglingId(rule.id);
    try {
      await apiClient.patch<ReminderRule>(`/reminder-rules/${rule.id}`, {
        isActive: !rule.isActive,
      });
      void fetchRules();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Durum güncellenemedi.');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bu kuralı silmek istediğinizden emin misiniz?')) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/reminder-rules/${id}`);
      void fetchRules();
    } catch (err) {
      window.alert(err instanceof ApiClientError ? err.message : 'Kural silinemedi.');
    } finally {
      setDeletingId(null);
    }
  }

  function openCreate() {
    setEditTarget(undefined);
    setShowForm(true);
  }

  function openEdit(rule: ReminderRule) {
    setEditTarget(rule);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(undefined);
  }

  const CHANNEL_LABEL_MAP: Record<string, string> = {
    sms: 'SMS',
    email: 'E-posta',
    whatsapp: 'WhatsApp',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {rules.length > 0 ? `${rules.length} kural tanımlanmış` : 'Henüz kural yok'}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yeni Kural
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {editTarget ? 'Kuralı Düzenle' : 'Yeni Hatırlatma Kuralı'}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Kapat"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-5 py-5">
            <ReminderRuleForm
              initialData={editTarget}
              onSubmit={editTarget ? handleEdit : handleCreate}
              onCancel={closeForm}
              submitLabel={editTarget ? 'Güncelle' : 'Oluştur'}
            />
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void fetchRules()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Tekrar dene
            </button>
          </div>
        ) : rules.length === 0 && !showForm ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">Henüz hatırlatma kuralı tanımlanmamış.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              İlk kuralı oluştur
            </button>
          </div>
        ) : rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Hizmet</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Gün Sonra</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Kanal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Mesaj Şablonu</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Aktif</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 text-xs font-medium">
                      {rule.serviceId}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{rule.daysAfter} gün</td>
                    <td className="px-4 py-3">
                      <ChannelBadge channel={rule.channel} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {rule.messageTemplate}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={rule.isActive}
                        onClick={() => void handleToggleActive(rule)}
                        disabled={togglingId === rule.id}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 ${
                          rule.isActive ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            rule.isActive ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(rule)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(rule.id)}
                          disabled={deletingId === rule.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {deletingId === rule.id ? 'Siliniyor...' : 'Sil'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiClient.get<NotificationStats>('/notifications/stats');
      setStats(res.data);
    } catch {
      // Non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'notifications', label: 'Bildirimler' },
    { id: 'rules', label: 'Hatırlatma Kuralları' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gönderilen ve bekleyen bildirimler, hatırlatma kuralları
        </p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'notifications' ? <NotificationsTab /> : <ReminderRulesTab />}
        </div>
      </div>
    </div>
  );
}
