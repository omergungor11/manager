'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, ApiClientError } from '@/lib/api';
import type {
  Account,
  AccountBalance,
  AccountFormValues,
  AccountTransaction,
  TransactionFormValues,
  AccountType,
} from '@/types/account';
import AccountForm from '../components/account-form';
import TransactionForm from '../components/transaction-form';

type Tab = 'info' | 'transactions' | 'linked';

const TYPE_LABEL: Record<AccountType, string> = {
  CUSTOMER: 'Müşteri',
  SUPPLIER: 'Tedarikçi',
  OTHER: 'Diğer',
};

const TYPE_BADGE: Record<AccountType, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  SUPPLIER: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-700',
};

interface TransactionMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LinkedCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

const TRANSACTION_LIMIT = 20;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function BalanceCard({ balance }: { balance: number }) {
  const isPositive = balance > 0;
  const isNegative = balance < 0;

  return (
    <div
      className={`rounded-lg border px-6 py-4 ${
        isPositive
          ? 'border-green-200 bg-green-50'
          : isNegative
            ? 'border-red-200 bg-red-50'
            : 'border-gray-200 bg-gray-50'
      }`}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Güncel Bakiye</p>
      <p
        className={`mt-1 text-3xl font-bold ${
          isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'
        }`}
      >
        {formatMoney(Math.abs(balance))} ₺
      </p>
      {(isPositive || isNegative) && (
        <p
          className={`mt-1 text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isPositive ? 'Alacaklı' : 'Borçlu'}
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">
        {value ?? <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}

function Modal({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Kapat"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);

  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [txMeta, setTxMeta] = useState<TransactionMeta>({
    total: 0,
    page: 1,
    limit: TRANSACTION_LIMIT,
    totalPages: 0,
  });
  const [txPage, setTxPage] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const [linkedCustomers, setLinkedCustomers] = useState<LinkedCustomer[]>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);

  // Load account + balance
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);

    Promise.all([
      apiClient.get<Account>(`/accounts/${id}`),
      apiClient.get<AccountBalance>(`/accounts/${id}/balance`),
    ])
      .then(([accountRes, balanceRes]) => {
        setAccount(accountRes.data);
        setBalance(balanceRes.data.balance);
      })
      .catch((err) => {
        setLoadError(
          err instanceof ApiClientError ? err.message : 'Cari hesap yüklenemedi.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // Load transactions
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await apiClient.get<AccountTransaction[]>(
        `/accounts/${id}/transactions`,
        { page: txPage, limit: TRANSACTION_LIMIT },
      );
      setTransactions(res.data);
      if (res.meta) {
        setTxMeta({
          total: res.meta.total ?? 0,
          page: res.meta.page ?? 1,
          limit: res.meta.limit ?? TRANSACTION_LIMIT,
          totalPages: res.meta.totalPages ?? 0,
        });
      }
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, [id, txPage]);

  useEffect(() => {
    if (activeTab !== 'transactions') return;
    void fetchTransactions();
  }, [activeTab, fetchTransactions]);

  // Load linked customers
  useEffect(() => {
    if (activeTab !== 'linked') return;
    setLinkedLoading(true);
    apiClient
      .get<LinkedCustomer[]>(`/accounts/${id}/customers`)
      .then((res) => setLinkedCustomers(res.data))
      .catch(() => setLinkedCustomers([]))
      .finally(() => setLinkedLoading(false));
  }, [activeTab, id]);

  async function handleEdit(values: AccountFormValues) {
    await apiClient.patch<Account>(`/accounts/${id}`, values);
    const res = await apiClient.get<Account>(`/accounts/${id}`);
    setAccount(res.data);
    setEditModalOpen(false);
  }

  async function handleDelete() {
    if (!confirm('Bu cari hesabı silmek istediğinizden emin misiniz?')) return;
    try {
      await apiClient.delete<Account>(`/accounts/${id}`);
      router.push('/accounts');
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Silme başarısız.');
    }
  }

  async function handleNewTransaction(values: TransactionFormValues) {
    await apiClient.post<AccountTransaction>(`/accounts/${id}/transactions`, {
      type: values.type,
      amount: parseFloat(values.amount),
      description: values.description || null,
      date: values.date,
    });
    setTxModalOpen(false);
    // Refresh balance
    const balanceRes = await apiClient.get<AccountBalance>(`/accounts/${id}/balance`);
    setBalance(balanceRes.data.balance);
    // Refresh transactions if on that tab
    if (activeTab === 'transactions') {
      void fetchTransactions();
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Bilgiler' },
    { key: 'transactions', label: 'Hesap Hareketleri' },
    { key: 'linked', label: 'İlişkili Müşteriler' },
  ];

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">Yükleniyor...</div>
    );
  }

  if (loadError || !account) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-600">{loadError ?? 'Cari hesap bulunamadı.'}</p>
        <Link
          href="/accounts"
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
          <Link href="/accounts" className="hover:text-gray-900">
            Cari Hesaplar
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{account.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[account.type]}`}
                >
                  {TYPE_LABEL[account.type]}
                </span>
                <span className="font-mono text-sm text-gray-400">{account.code}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Kayıt: {formatDate(account.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTxModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Yeni Hareket
            </button>
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

        {/* Balance card */}
        <BalanceCard balance={balance} />

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
              <InfoRow label="Ad / Unvan" value={account.name} />
              <InfoRow label="Kod" value={account.code} />
              <InfoRow label="Tür" value={TYPE_LABEL[account.type]} />
              <InfoRow label="Telefon" value={account.phone} />
              <InfoRow label="E-posta" value={account.email} />
              <InfoRow label="Adres" value={account.address} />
              <InfoRow label="Vergi / TC Kimlik No" value={account.taxId} />
              <InfoRow label="Notlar" value={account.notes} />
              <InfoRow label="Son güncelleme" value={formatDate(account.updatedAt)} />
            </dl>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              {txLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">Yükleniyor...</div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Henüz hesap hareketi bulunmuyor.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tarih
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Açıklama
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Borç
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Alacak
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bakiye
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {formatDate(tx.date)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {tx.description ?? <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {tx.type === 'DEBIT' ? (
                                <span className="text-red-600 font-medium">
                                  {formatMoney(tx.amount)} ₺
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {tx.type === 'CREDIT' ? (
                                <span className="text-green-600 font-medium">
                                  {formatMoney(tx.amount)} ₺
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span
                                className={
                                  tx.runningBalance > 0
                                    ? 'text-green-600 font-semibold'
                                    : tx.runningBalance < 0
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-500'
                                }
                              >
                                {formatMoney(Math.abs(tx.runningBalance))} ₺
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Transaction pagination */}
                  {txMeta.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                      <p className="text-sm text-gray-700">
                        Sayfa <span className="font-medium">{txMeta.page}</span>
                        {' / '}
                        <span className="font-medium">{txMeta.totalPages}</span>
                        {' — '}
                        <span className="font-medium">{txMeta.total}</span> hareket
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                          disabled={txPage <= 1 || txLoading}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Önceki
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxPage((p) => Math.min(txMeta.totalPages, p + 1))}
                          disabled={txPage >= txMeta.totalPages || txLoading}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Linked customers Tab */}
          {activeTab === 'linked' && (
            <div>
              {linkedLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">Yükleniyor...</div>
              ) : linkedCustomers.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Bu cari hesaba bağlı müşteri bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Müşteri Adı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telefon
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          E-posta
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {linkedCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/customers/${c.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {c.phone ?? <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {c.email ?? <span className="text-gray-400">—</span>}
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

      {/* Edit modal */}
      <Modal
        isOpen={editModalOpen}
        title="Cari Hesabı Düzenle"
        onClose={() => setEditModalOpen(false)}
      >
        <AccountForm
          initialData={account}
          onSubmit={handleEdit}
          onCancel={() => setEditModalOpen(false)}
          submitLabel="Güncelle"
        />
      </Modal>

      {/* New transaction modal */}
      <Modal
        isOpen={txModalOpen}
        title="Yeni Hareket"
        onClose={() => setTxModalOpen(false)}
      >
        <TransactionForm
          onSubmit={handleNewTransaction}
          onCancel={() => setTxModalOpen(false)}
        />
      </Modal>
    </>
  );
}
