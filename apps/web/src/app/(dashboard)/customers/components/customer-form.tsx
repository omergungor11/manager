'use client';

import { useState } from 'react';
import type { Customer, CustomerFormValues } from '@/types/customer';

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const EMPTY_FORM: CustomerFormValues = {
  name: '',
  type: 'individual',
  phone: '',
  email: '',
  address: '',
  taxId: '',
  notes: '',
};

function toFormValues(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    type: customer.type,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    taxId: customer.taxId ?? '',
    notes: customer.notes ?? '',
  };
}

export default function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Kaydet',
}: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormValues>(
    initialData ? toFormValues(initialData) : EMPTY_FORM,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Partial<Record<keyof CustomerFormValues, string>> = {};

    if (!form.name.trim()) {
      next.name = 'Ad zorunludur.';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Geçerli bir e-posta adresi girin.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CustomerFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const inputErrorClass =
    'w-full rounded-md border border-red-400 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError !== null && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Ad */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Ad / Unvan <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Ahmet Yılmaz"
            className={errors.name ? inputErrorClass : inputClass}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Tip */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Müşteri Tipi
          </label>
          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="individual">Bireysel</option>
            <option value="company">Kurumsal</option>
          </select>
        </div>

        {/* Telefon */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+90 533 123 45 67"
            className={inputClass}
          />
        </div>

        {/* E-posta */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="ornek@email.com"
            className={errors.email ? inputErrorClass : inputClass}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Vergi No / TC No */}
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
            {form.type === 'company' ? 'Vergi No' : 'TC Kimlik No'}
          </label>
          <input
            id="taxId"
            name="taxId"
            type="text"
            value={form.taxId}
            onChange={handleChange}
            placeholder={form.type === 'company' ? '1234567890' : '12345678901'}
            className={inputClass}
          />
        </div>

        {/* Adres */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Adres
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            placeholder="Lefkoşa, Kıbrıs"
            className={inputClass}
          />
        </div>
      </div>

      {/* Notlar */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notlar
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          placeholder="Müşteri hakkında notlar..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
