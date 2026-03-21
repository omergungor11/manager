'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Service {
  id: string;
  name: string;
}

export interface ReminderRuleFormValues {
  serviceId: string;
  daysAfter: number;
  channel: 'sms' | 'email' | 'whatsapp';
  messageTemplate: string;
  isActive: boolean;
}

export interface ReminderRule extends ReminderRuleFormValues {
  id: string;
  createdAt: string;
}

interface ReminderRuleFormProps {
  initialData?: ReminderRule;
  onSubmit: (values: ReminderRuleFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANNEL_OPTIONS: Array<{ value: ReminderRuleFormValues['channel']; label: string }> = [
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'E-posta' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const VARIABLE_HINTS = [
  { variable: '{{customerName}}', description: 'Müşteri adı' },
  { variable: '{{vehiclePlate}}', description: 'Araç plakası' },
  { variable: '{{serviceName}}', description: 'Hizmet adı' },
];

const EMPTY_FORM: ReminderRuleFormValues = {
  serviceId: '',
  daysAfter: 30,
  channel: 'sms',
  messageTemplate: '',
  isActive: true,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReminderRuleForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Kaydet',
}: ReminderRuleFormProps) {
  const [form, setForm] = useState<ReminderRuleFormValues>(() =>
    initialData
      ? {
          serviceId: initialData.serviceId,
          daysAfter: initialData.daysAfter,
          channel: initialData.channel,
          messageTemplate: initialData.messageTemplate,
          isActive: initialData.isActive,
        }
      : EMPTY_FORM,
  );

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ReminderRuleFormValues, string>>>({});

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const res = await apiClient.get<Service[]>('/services', { limit: 100 });
      setServices(res.data);
    } catch {
      // Non-critical; leave empty
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  function updateField<K extends keyof ReminderRuleFormValues>(
    key: K,
    value: ReminderRuleFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (submitError) setSubmitError(null);
  }

  function insertVariable(variable: string) {
    updateField('messageTemplate', form.messageTemplate + variable);
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof ReminderRuleFormValues, string>> = {};
    if (!form.serviceId) errs.serviceId = 'Hizmet seçmelisiniz.';
    if (form.daysAfter < 1) errs.daysAfter = 'En az 1 gün olmalıdır.';
    if (!form.messageTemplate.trim()) errs.messageTemplate = 'Mesaj şablonu boş olamaz.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError ? err.message : 'Kural kaydedilemedi.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const errorInputClass =
    'w-full rounded-md border border-red-400 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {submitError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Service */}
      <div>
        <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">
          Hizmet <span className="text-red-500">*</span>
        </label>
        <select
          id="serviceId"
          value={form.serviceId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('serviceId', e.target.value)}
          disabled={servicesLoading}
          className={errors.serviceId ? errorInputClass : inputClass}
        >
          <option value="">
            {servicesLoading ? 'Yükleniyor...' : 'Hizmet seçin...'}
          </option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.serviceId && (
          <p className="mt-1 text-xs text-red-600">{errors.serviceId}</p>
        )}
      </div>

      {/* Days after + Channel */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="daysAfter" className="block text-sm font-medium text-gray-700 mb-1">
            Kaç Gün Sonra <span className="text-red-500">*</span>
          </label>
          <input
            id="daysAfter"
            type="number"
            min={1}
            max={365}
            value={form.daysAfter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('daysAfter', parseInt(e.target.value, 10) || 1)}
            className={errors.daysAfter ? errorInputClass : inputClass}
          />
          {errors.daysAfter && (
            <p className="mt-1 text-xs text-red-600">{errors.daysAfter}</p>
          )}
        </div>

        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
            Kanal <span className="text-red-500">*</span>
          </label>
          <select
            id="channel"
            value={form.channel}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateField('channel', e.target.value as ReminderRuleFormValues['channel'])
            }
            className={inputClass}
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message template */}
      <div>
        <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700 mb-1">
          Mesaj Şablonu <span className="text-red-500">*</span>
        </label>

        {/* Variable hints */}
        <div className="mb-2 flex flex-wrap gap-1">
          {VARIABLE_HINTS.map((hint) => (
            <button
              key={hint.variable}
              type="button"
              title={hint.description}
              onClick={() => insertVariable(hint.variable)}
              className="inline-flex items-center rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-mono text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {hint.variable}
            </button>
          ))}
          <span className="text-xs text-gray-400 self-center ml-1">
            — şablona eklemek için tıklayın
          </span>
        </div>

        <textarea
          id="messageTemplate"
          rows={4}
          value={form.messageTemplate}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('messageTemplate', e.target.value)}
          placeholder="Örn: Sayın {{customerName}}, {{vehiclePlate}} plakalı aracınızın {{serviceName}} hizmetini tekrar almanızın zamanı gelmiştir."
          className={`${errors.messageTemplate ? errorInputClass : inputClass} resize-none`}
        />
        {errors.messageTemplate && (
          <p className="mt-1 text-xs text-red-600">{errors.messageTemplate}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Karakter sayısı: {form.messageTemplate.length}
        </p>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Kural Aktif</p>
          <p className="text-xs text-gray-400">
            Pasif kuralar otomatik hatırlatma göndermez.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.isActive}
          onClick={() => updateField('isActive', !form.isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            form.isActive ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {submitting ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
