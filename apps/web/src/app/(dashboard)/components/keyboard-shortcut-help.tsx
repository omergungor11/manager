'use client';

import { useEffect, useCallback } from 'react';
import { useKeyboardShortcuts, getRegisteredShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SHORTCUTS: Array<{ display: string; label: string }> = [
  { display: 'F2', label: 'Yeni İş Emri Oluştur' },
  { display: 'F3', label: 'Plaka Aramaya Odaklan' },
  { display: 'Ctrl+K', label: 'Genel Arama Aç' },
  { display: 'Esc', label: 'Modalı / Formu Kapat' },
  { display: '?', label: 'Klavye Kısayol Yardımını Aç' },
];

export default function KeyboardShortcutHelp({
  isOpen,
  onClose,
}: KeyboardShortcutHelpProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useKeyboardShortcuts({
    Escape: {
      label: 'Kapat',
      display: 'Esc',
      handler: handleClose,
    },
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Merge registered shortcuts with the default list for display
  const registered = getRegisteredShortcuts();
  const displayShortcuts =
    registered.length > 0
      ? registered.map((s) => ({ display: s.display, label: s.label }))
      : DEFAULT_SHORTCUTS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-help-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 id="shortcut-help-title" className="text-lg font-semibold text-gray-900">
            Klavye Kısayolları
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="space-y-2">
          {displayShortcuts.map((shortcut, index) => (
            <li
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm text-gray-700">{shortcut.label}</span>
              <kbd className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 border border-gray-300 text-xs font-mono text-gray-700 font-semibold">
                {shortcut.display}
              </kbd>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-gray-400 text-center">
          Input alanlarında bazı kısayollar devre dışıdır.
        </p>
      </div>
    </div>
  );
}
