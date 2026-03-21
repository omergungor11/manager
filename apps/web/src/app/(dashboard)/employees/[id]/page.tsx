'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, ApiClientError } from '@/lib/api';
import type { Employee, EmployeeFormValues, EmployeeStatus } from '@/types/employee';
import EmployeeForm from '../components/employee-form';

type Tab = 'info' | 'payroll';

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  terminated: 'İşten Ayrılan',
};

const STATUS_CLASS: Record<EmployeeStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(amount: number): string {
  return '₺' + amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showEditModal, setShowEditModal] = useState(false);

  // Terminate modal state
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationDate, setTerminationDate] = useState('');
  const [isTerminating, setIsTerminating] = useState(false);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  // Activate state
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    apiClient
      .get<Employee>(`/employees/${id}`)
      .then((res) => setEmployee(res.data))
      .catch((err) => {
        setLoadError(
          err instanceof ApiClientError ? err.message : 'Çalışan yüklenemedi.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleEdit(values: EmployeeFormValues) {
    await apiClient.patch<Employee>(`/employees/${id}`, values);
    const res = await apiClient.get<Employee>(`/employees/${id}`);
    setEmployee(res.data);
    setShowEditModal(false);
  }

  async function handleTerminate() {
    if (!terminationDate) {
      setTerminateError('İşten çıkış tarihi zorunludur.');
      return;
    }
    setIsTerminating(true);
    setTerminateError(null);
    try {
      await apiClient.patch<Employee>(`/employees/${id}/terminate`, {
        terminationDate,
      });
      const res = await apiClient.get<Employee>(`/employees/${id}`);
      setEmployee(res.data);
      setShowTerminateModal(false);
      setTerminationDate('');
    } catch (err) {
      setTerminateError(
        err instanceof ApiClientError ? err.message : 'İşten çıkarma başarısız.',
      );
    } finally {
      setIsTerminating(false);
    }
  }

  async function handleActivate() {
    if (!confirm('Bu çalışanı aktifleştirmek istediğinizden emin misiniz?')) return;
    setIsActivating(true);
    try {
      await apiClient.patch<Employee>(`/employees/${id}/activate`, {});
      const res = await apiClient.get<Employee>(`/employees/${id}`);
      setEmployee(res.data);
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Aktifleştirme başarısız.');
    } finally {
      setIsActivating(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Bilgiler' },
    { key: 'payroll', label: 'Bordro Geçmişi' },
  ];

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Yükleniyor...
      </div>
    );
  }

  if (loadError || !employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-600">{loadError ?? 'Çalışan bulunamadı.'}</p>
        <Link
          href="/employees"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800"
        >
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
          <Link href="/employees" className="hover:text-gray-900">
            Çalışanlar
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{employee.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[employee.status]}`}
              >
                {STATUS_LABEL[employee.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {employee.position
                ? `${employee.position}${employee.department ? ` — ${employee.department}` : ''}`
                : employee.department ?? 'Pozisyon belirtilmemiş'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Düzenle
            </button>

            {employee.status !== 'terminated' && (
              <button
                type="button"
                onClick={() => {
                  setTerminationDate('');
                  setTerminateError(null);
                  setShowTerminateModal(true);
                }}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                İşten Çıkar
              </button>
            )}

            {(employee.status === 'inactive' || employee.status === 'terminated') && (
              <button
                type="button"
                onClick={() => void handleActivate()}
                disabled={isActivating}
                className="rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isActivating ? 'İşlem yapılıyor...' : 'Aktifleştir'}
              </button>
            )}
          </div>
        </div>

        {/* Info card summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Brüt Maaş</p>
            <p className="text-base font-semibold text-gray-900">
              {formatMoney(employee.grossSalary)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Başlangıç Tarihi</p>
            <p className="text-base font-semibold text-gray-900">
              {formatDate(employee.startDate)}
            </p>
          </div>
          {employee.terminationDate && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">Ayrılış Tarihi</p>
              <p className="text-base font-semibold text-gray-900">
                {formatDate(employee.terminationDate)}
              </p>
            </div>
          )}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Son Güncelleme</p>
            <p className="text-base font-semibold text-gray-900">
              {formatDate(employee.updatedAt)}
            </p>
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
          {activeTab === 'info' && (
            <dl className="divide-y divide-gray-200">
              <InfoRow label="Ad Soyad" value={employee.name} />
              <InfoRow label="Pozisyon" value={employee.position} />
              <InfoRow label="Departman" value={employee.department} />
              <InfoRow label="Telefon" value={employee.phone} />
              <InfoRow label="E-posta" value={employee.email} />
              <InfoRow label="TC / Kimlik No" value={employee.tcNo} />
              <InfoRow label="Başlangıç Tarihi" value={formatDate(employee.startDate)} />
              {employee.terminationDate && (
                <InfoRow label="Ayrılış Tarihi" value={formatDate(employee.terminationDate)} />
              )}
              <InfoRow label="Brüt Maaş" value={formatMoney(employee.grossSalary)} />
              <InfoRow label="Durum" value={STATUS_LABEL[employee.status]} />
              <InfoRow label="Kayıt Tarihi" value={formatDate(employee.createdAt)} />
            </dl>
          )}

          {activeTab === 'payroll' && (
            <div className="py-16 text-center text-sm text-gray-500">
              Bordro geçmişi henüz mevcut değil.
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowEditModal(false)}
          />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Çalışanı Düzenle</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
              <EmployeeForm
                initialData={employee}
                onSubmit={handleEdit}
                onCancel={() => setShowEditModal(false)}
                submitLabel="Değişiklikleri Kaydet"
              />
            </div>
          </div>
        </div>
      )}

      {/* Terminate modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowTerminateModal(false)}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">İşten Çıkar</h2>
              <button
                type="button"
                onClick={() => setShowTerminateModal(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{employee.name}</span> adlı çalışanın işine son vermek istediğinizden emin misiniz?
              </p>

              {terminateError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {terminateError}
                </div>
              )}

              <div>
                <label
                  htmlFor="terminationDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  İşten Çıkış Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  id="terminationDate"
                  type="date"
                  value={terminationDate}
                  onChange={(e) => {
                    setTerminationDate(e.target.value);
                    setTerminateError(null);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTerminateModal(false)}
                  disabled={isTerminating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => void handleTerminate()}
                  disabled={isTerminating}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTerminating ? 'İşleniyor...' : 'İşten Çıkar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
