'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import type { Customer } from '@/types/customer';
import type { WorkOrderListItem } from '@/types/work-order';

// ------------------------------------------------------------------ types ---

interface VehicleSearchResult {
  id: string;
  licensePlate: string;
  brandName: string | null;
  modelName: string | null;
  currentOwner: { id: string; name: string } | null;
}

type ResultGroup = 'customer' | 'vehicle' | 'work-order';

interface SearchResult {
  id: string;
  group: ResultGroup;
  title: string;
  subtitle: string;
  href: string;
}

const GROUP_LABEL: Record<ResultGroup, string> = {
  customer: 'Müşteriler',
  vehicle: 'Araçlar',
  'work-order': 'İş Emirleri',
};

// ----------------------------------------------------------------- helpers --

function customerToResult(c: Customer): SearchResult {
  return {
    id: `customer-${c.id}`,
    group: 'customer',
    title: c.name,
    subtitle: [c.phone, c.email].filter(Boolean).join(' · ') || 'Müşteri',
    href: `/customers/${c.id}`,
  };
}

function vehicleToResult(v: VehicleSearchResult): SearchResult {
  const label = [v.brandName, v.modelName].filter(Boolean).join(' ') || 'Araç';
  return {
    id: `vehicle-${v.id}`,
    group: 'vehicle',
    title: v.licensePlate,
    subtitle: `${label}${v.currentOwner ? ` — ${v.currentOwner.name}` : ''}`,
    href: `/vehicles/${v.id}`,
  };
}

function workOrderToResult(wo: WorkOrderListItem): SearchResult {
  return {
    id: `work-order-${wo.id}`,
    group: 'work-order',
    title: wo.orderNo,
    subtitle: `${wo.customer.name} · ${wo.vehicle.licensePlate}`,
    href: `/work-orders/${wo.id}`,
  };
}

// ---------------------------------------------------------------- component --

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const q = query.trim();

        const [customersRes, vehiclesRes, workOrdersRes] = await Promise.allSettled([
          apiClient.get<{ items: Customer[] }>('/api/v1/customers', { search: q, limit: 5 }),
          apiClient.get<{ items: VehicleSearchResult[] }>('/api/v1/vehicles', { search: q, limit: 5 }),
          apiClient.get<{ items: WorkOrderListItem[] }>('/api/v1/work-orders', { search: q, limit: 5 }),
        ]);

        const gathered: SearchResult[] = [];

        if (customersRes.status === 'fulfilled') {
          customersRes.value.data.items.forEach((c) => gathered.push(customerToResult(c)));
        }
        if (vehiclesRes.status === 'fulfilled') {
          vehiclesRes.value.data.items.forEach((v) => gathered.push(vehicleToResult(v)));
        }
        if (workOrdersRes.status === 'fulfilled') {
          workOrdersRes.value.data.items.forEach((wo) => gathered.push(workOrderToResult(wo)));
        }

        setResults(gathered);
        setActiveIndex(-1);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigateTo = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[activeIndex];
        if (activeIndex >= 0 && selected) {
          navigateTo(selected.href);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [results, activeIndex, navigateTo, onClose],
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  // Group results for display
  const grouped = (Object.keys(GROUP_LABEL) as ResultGroup[]).reduce<
    Record<ResultGroup, SearchResult[]>
  >(
    (acc, group) => {
      acc[group] = results.filter((r) => r.group === group);
      return acc;
    },
    { customer: [], vehicle: [], 'work-order': [] },
  );

  const hasResults = results.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center border-b border-gray-200 px-4">
          <svg
            className="w-5 h-5 text-gray-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            id={labelId}
            ref={inputRef}
            type="search"
            className="flex-1 px-3 py-4 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
            placeholder="Müşteri, plaka veya iş emri ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {isLoading && (
            <svg
              className="w-4 h-4 text-gray-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Aranıyor..."
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Aramayı kapat"
          >
            <kbd className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">
              Esc
            </kbd>
          </button>
        </div>

        {/* Results */}
        {query.trim().length >= 2 && (
          <div className="max-h-96 overflow-y-auto">
            {!hasResults && !isLoading && (
              <p className="py-8 text-center text-sm text-gray-500">
                &quot;{query}&quot; için sonuç bulunamadı.
              </p>
            )}

            {hasResults && (
              <ul ref={listRef} role="listbox" aria-label="Arama sonuçları">
                {(Object.entries(grouped) as Array<[ResultGroup, SearchResult[]]>).map(
                  ([group, items]) => {
                    if (items.length === 0) return null;
                    return (
                      <li key={group}>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                          {GROUP_LABEL[group]}
                        </div>
                        <ul>
                          {items.map((result) => {
                            const flatIndex = results.indexOf(result);
                            const isActive = flatIndex === activeIndex;
                            return (
                              <li
                                key={result.id}
                                role="option"
                                aria-selected={isActive}
                              >
                                <button
                                  type="button"
                                  onClick={() => navigateTo(result.href)}
                                  className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 transition-colors ${
                                    isActive
                                      ? 'bg-blue-50 text-blue-900'
                                      : 'hover:bg-gray-50 text-gray-900'
                                  }`}
                                >
                                  <span className="text-sm font-medium">{result.title}</span>
                                  <span className="text-xs text-gray-500">{result.subtitle}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  },
                )}
              </ul>
            )}
          </div>
        )}

        {/* Footer hint */}
        {query.trim().length < 2 && (
          <div className="px-4 py-3 flex items-center gap-4 text-xs text-gray-400">
            <span>
              <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">↑</kbd>{' '}
              <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">↓</kbd>{' '}
              gezin
            </span>
            <span>
              <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">Enter</kbd>{' '}
              seç
            </span>
            <span>
              <kbd className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">Esc</kbd>{' '}
              kapat
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
