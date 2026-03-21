'use client';

import Link from 'next/link';
import type { Vehicle } from '../types';

interface VehicleTableProps {
  vehicles: Vehicle[];
  onDelete?: (id: string) => void;
  isDeleting?: string | null;
}

export default function VehicleTable({
  vehicles,
  onDelete,
  isDeleting,
}: VehicleTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Araç bulunamadı.
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
              Plaka
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Marka / Model
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Yil
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Renk
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Km
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Sahip
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Islemler</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 font-mono"
                >
                  {vehicle.licensePlate}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {[vehicle.brandName, vehicle.modelName]
                  .filter(Boolean)
                  .join(' ') || (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {vehicle.year ?? <span className="text-gray-400">—</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {vehicle.color ?? <span className="text-gray-400">—</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {vehicle.currentKm.toLocaleString('tr-TR')} km
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {vehicle.currentOwner?.name ?? (
                  <span className="text-gray-400">Sahipsiz</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/vehicles/${vehicle.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Detay
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(vehicle.id)}
                      disabled={isDeleting === vehicle.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting === vehicle.id ? 'Siliniyor...' : 'Sil'}
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
