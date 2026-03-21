'use client';

import { useState, useEffect } from 'react';
import type { PaymentFormValues, PaymentMethod } from '@/types/invoice';

interface PaymentModalProps {
  isOpen: boolean;
  remainingAmount: number;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
  onClose: () => void;
}

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Nakit' },
  { value: 'CARD', label: 'Kredi Kartı' },
  { value: 'BANK_TRANSFER', label: 'Havale / EFT' },
  { value: 'ACCOUNT', label: 'Cari Hesap' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PaymentModal({
  isOpen,
  remainingAmount,
  onSubmit,
  onClose,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(remainingAmount > 0 ? remainingAmount.toFixed(2) : '');
      setMethod('CASH');
      setDate(todayIso());
      setNotes('');
      setError(null);
    }
  }, [isOpen, remainingAmount]);

  // Keyboard close
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Geçerli bir tutar girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ amount, method, date, notes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme kaydedilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="payment-modal-title" className="text-base font-semibold text-gray-900">
            Ödeme Kaydet
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

        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="pay-amount" className="block text-sm font-medium text-gray-700 mb-1">
              Tutar (₺) <span className="text-red-500">*</span>
            </label>
            <input
              id="pay-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              required
              placeholder="0,00"
            />
            {remainingAmount > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Kalan tutar:{' '}
                <span className="font-medium text-gray-700">
                  ₺{remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pay-method" className="block text-sm font-medium text-gray-700 mb-1">
              Ödeme Yöntemi <span className="text-red-500">*</span>
            </label>
            <select
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className={inputClass}
              required
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pay-date" className="block text-sm font-medium text-gray-700 mb-1">
              Tarih <span className="text-red-500">*</span>
            </label>
            <input
              id="pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="pay-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              id="pay-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Opsiyonel açıklama..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Vazgec
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
