'use client';

import { useState } from 'react';
import { ApiClientError } from '@/lib/api';
import type { Employee, EmployeeFormValues } from '@/types/employee';

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const EMPTY_FORM: EmployeeFormValues = {
  name: '',
  phone: '',
  email: '',
  tcNo: '',
  position: '',
  department: '',
  startDate: '',
  grossSalary: 0,
};

function toFormValues(employee: Employee): EmployeeFormValues {
  return {
    name: employee.name,
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    tcNo: employee.tcNo ?? '',
    position: employee.position ?? '',
    department: employee.department ?? '',
    startDate: employee.startDate.slice(0, 10),
    grossSalary: employee.grossSalary,
  };
}

function formatSalaryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return num.toLocaleString('tr-TR');
}

export default function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Kaydet',
}: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeFormValues>(
    initialData ? toFormValues(initialData) : EMPTY_FORM,
  );
  const [salaryDisplay, setSalaryDisplay] = useState<string>(
    initialData ? initialData.grossSalary.toLocaleString('tr-TR') : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Partial<Record<keyof EmployeeFormValues, string>> = {};

    if (!form.name.trim()) {
      next.name = 'Ad Soyad zorunludur.';
    }
    if (!form.startDate) {
      next.startDate = 'Başlangıç tarihi zorunludur.';
    }
    if (form.grossSalary <= 0) {
      next.grossSalary = 'Brüt maaş sıfırdan büyük olmalıdır.';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Geçerli bir e-posta adresi girin.';
    }
    if (form.tcNo && !/^\d{11}$/.test(form.tcNo)) {
      next.tcNo = 'TC Kimlik No 11 haneli olmalıdır.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof EmployeeFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSalaryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setSalaryDisplay(formatSalaryInput(e.target.value));
    setForm((prev) => ({ ...prev, grossSalary: num }));
    if (errors.grossSalary) {
      setErrors((prev) => ({ ...prev, grossSalary: undefined }));
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
      setServerError(
        err instanceof ApiClientError ? err.message : 'Bir hata oluştu.',
      );
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
        {/* Ad Soyad */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Ad Soyad <span className="text-red-500">*</span>
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
            placeholder="ahmet@ornek.com"
            className={errors.email ? inputErrorClass : inputClass}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* TC Kimlik No */}
        <div>
          <label htmlFor="tcNo" className="block text-sm font-medium text-gray-700 mb-1">
            TC / Kimlik No
          </label>
          <input
            id="tcNo"
            name="tcNo"
            type="text"
            maxLength={11}
            value={form.tcNo}
            onChange={handleChange}
            placeholder="12345678901"
            className={errors.tcNo ? inputErrorClass : inputClass}
          />
          {errors.tcNo && (
            <p className="mt-1 text-xs text-red-600">{errors.tcNo}</p>
          )}
        </div>

        {/* Pozisyon */}
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Pozisyon
          </label>
          <input
            id="position"
            name="position"
            type="text"
            value={form.position}
            onChange={handleChange}
            placeholder="Usta, Çırak, Muhasebeci..."
            className={inputClass}
          />
        </div>

        {/* Departman */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Departman
          </label>
          <input
            id="department"
            name="department"
            type="text"
            value={form.department}
            onChange={handleChange}
            placeholder="Servis, Muhasebe, Yönetim..."
            className={inputClass}
          />
        </div>

        {/* Başlangıç Tarihi */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Başlangıç Tarihi <span className="text-red-500">*</span>
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            value={form.startDate}
            onChange={handleChange}
            className={errors.startDate ? inputErrorClass : inputClass}
          />
          {errors.startDate && (
            <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
          )}
        </div>

        {/* Brüt Maaş */}
        <div>
          <label htmlFor="grossSalary" className="block text-sm font-medium text-gray-700 mb-1">
            Brüt Maaş (₺) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
              ₺
            </span>
            <input
              id="grossSalary"
              name="grossSalary"
              type="text"
              inputMode="numeric"
              value={salaryDisplay}
              onChange={handleSalaryChange}
              placeholder="0"
              className={`${errors.grossSalary ? inputErrorClass : inputClass} pl-7`}
            />
          </div>
          {errors.grossSalary && (
            <p className="mt-1 text-xs text-red-600">{errors.grossSalary}</p>
          )}
        </div>
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
