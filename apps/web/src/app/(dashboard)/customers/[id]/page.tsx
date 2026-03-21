'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, ApiClientError } from '@/lib/api';
import type { Customer, CustomerFormValues } from '@/types/customer';
import CustomerModal from '../components/customer-modal';

type Tab = 'info' | 'vehicles' | 'history';

const TYPE_LABEL: Record<string, string> = {
  individual: 'Bireysel',
  company: 'Kurumsal',
};

interface CustomerVehicle {
  id: string;
  licensePlate: string;
  brandName?: string | null;
  modelName?: string | null;
  year?: number | null;
  color?: string | null;
  currentKm: number;
}

interface ServiceHistoryItem {
  id: string;
  orderNo: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  totalAmount?: number | null;
  description?: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const [history, setHistory] = useState<ServiceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    apiClient
      .get<Customer>(`/customers/${id}`)
      .then((res) => setCustomer(res.data))
      .catch((err) => {
        setLoadError(
          err instanceof ApiClientError ? err.message : 'Müşteri yüklenemedi.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'vehicles' || !customer) return;
    setVehiclesLoading(true);
    apiClient
      .get<CustomerVehicle[]>(`/customers/${id}/vehicles`)
      .then((res) => setVehicles(res.data))
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false));
  }, [activeTab, id, customer]);

  useEffect(() => {
    if (activeTab !== 'history' || !customer) return;
    setHistoryLoading(true);
    apiClient
      .get<ServiceHistoryItem[]>(`/customers/${id}/work-orders`)
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [activeTab, id, customer]);

  async function handleEdit(values: CustomerFormValues) {
    await apiClient.patch<Customer>(`/customers/${id}`, values);
    const res = await apiClient.get<Customer>(`/customers/${id}`);
    setCustomer(res.data);
    setEditModalOpen(false);
  }

  async function handleDelete() {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await apiClient.delete<Customer>(`/customers/${id}`);
      router.push('/customers');
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Silme başarısız.');
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Bilgiler' },
    { key: 'vehicles', label: 'Araçlar' },
    { key: 'history', label: 'Servis Geçmişi' },
  ];

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Yükleniyor...
      </div>
    );
  }

  if (loadError || !customer) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-600">{loadError ?? 'Müşteri bulunamadı.'}</p>
        <Link href="/customers" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800">
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/customers" className="hover:text-gray-900">
            Müşteriler
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{customer.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  customer.type === 'company'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {TYPE_LABEL[customer.type] ?? customer.type}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Kayıt: {formatDate(customer.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sil
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <dl className="divide-y divide-gray-200">
              <InfoRow label="Ad / Unvan" value={customer.name} />
              <InfoRow label="Tip" value={TYPE_LABEL[customer.type] ?? customer.type} />
              <InfoRow label="Telefon" value={customer.phone} />
              <InfoRow label="E-posta" value={customer.email} />
              <InfoRow label="Adres" value={customer.address} />
              <InfoRow
                label={customer.type === 'company' ? 'Vergi No' : 'TC Kimlik No'}
                value={customer.taxId}
              />
              <InfoRow label="Notlar" value={customer.notes} />
              <InfoRow label="Son güncelleme" value={formatDate(customer.updatedAt)} />
            </dl>
          )}

          {/* Vehicles Tab */}
          {activeTab === 'vehicles' && (
            <div>
              {vehiclesLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Yükleniyor...
                </div>
              ) : vehicles.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Bu müşteriye ait araç bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plaka
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Marka / Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Yıl
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Km
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/vehicles/${v.id}`}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800 font-mono"
                            >
                              {v.licensePlate}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {[v.brandName, v.modelName].filter(Boolean).join(' ') || (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {v.year ?? <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {v.currentKm.toLocaleString('tr-TR')} km
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Service History Tab */}
          {activeTab === 'history' && (
            <div>
              {historyLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Yükleniyor...
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Servis geçmişi bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İş Emri No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/work-orders/${item.id}`}
                              className="text-sm font-mono text-blue-600 hover:text-blue-800"
                            >
                              {item.orderNo}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.totalAmount != null
                              ? `${item.totalAmount.toLocaleString('tr-TR')} ₺`
                              : <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CustomerModal
        isOpen={editModalOpen}
        title="Müşteriyi Düzenle"
        customer={customer}
        onSubmit={handleEdit}
        onClose={() => setEditModalOpen(false)}
      />
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">
        {value ?? <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}
