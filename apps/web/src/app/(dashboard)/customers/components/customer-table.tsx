'use client';

import Link from 'next/link';
import type { Customer } from '@/types/customer';

interface CustomerTableProps {
  customers: Customer[];
  onDelete?: (id: string) => void;
  isDeleting?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  individual: 'Bireysel',
  company: 'Kurumsal',
};

export default function CustomerTable({
  customers,
  onDelete,
  isDeleting,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Müşteri bulunamadı.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Ad / Unvan
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tip
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Telefon
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              E-posta
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">İşlemler</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {customer.name}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    customer.type === 'company'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {TYPE_LABEL[customer.type] ?? customer.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {customer.phone ?? <span className="text-gray-400">—</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {customer.email ?? <span className="text-gray-400">—</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-4">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Detay
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(customer.id)}
                      disabled={isDeleting === customer.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting === customer.id ? 'Siliniyor...' : 'Sil'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
