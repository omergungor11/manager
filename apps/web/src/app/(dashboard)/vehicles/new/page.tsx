'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiClientError } from '@/lib/api';
import VehicleForm from '../components/vehicle-form';
import type { VehicleFormData, Vehicle } from '../types';

export default function NewVehiclePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: VehicleFormData) {
    setIsSubmitting(true);
    try {
      const payload = {
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        brandId: formData.brandId || undefined,
        modelId: formData.modelId || undefined,
        brandName: formData.brandName || undefined,
        modelName: formData.modelName || undefined,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        color: formData.color || undefined,
        vin: formData.vin || undefined,
        currentKm: parseInt(formData.currentKm, 10) || 0,
        notes: formData.notes || undefined,
      };
      const res = await apiClient.post<Vehicle>('/vehicles', payload);
      router.push(`/vehicles/${res.data.id}`);
    } catch (err) {
      setIsSubmitting(false);
      throw err instanceof ApiClientError
        ? new Error(err.message)
        : new Error('Arac kaydedilemedi.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/vehicles" className="hover:text-gray-700">
          Araclar
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Yeni Arac</span>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni Arac Ekle</h1>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <VehicleForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/vehicles')}
            isSubmitting={isSubmitting}
            submitLabel="Arac Ekle"
          />
        </div>
      </div>
    </div>
  );
}
