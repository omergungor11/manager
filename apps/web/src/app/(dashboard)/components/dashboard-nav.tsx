'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import KeyboardShortcutHelp from './keyboard-shortcut-help';
import SearchModal from './search-modal';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Müşteriler' },
  { href: '/vehicles', label: 'Araçlar' },
  { href: '/services', label: 'Hizmetler' },
  { href: '/products', label: 'Ürünler' },
  { href: '/stock', label: 'Stok' },
  { href: '/work-orders', label: 'İş Emirleri' },
  { href: '/invoices', label: 'Faturalar' },
  { href: '/employees', label: 'Çalışanlar' },
  { href: '/finance', label: 'Finans' },
  { href: '/payroll', label: 'Bordro' },
  { href: '/notifications', label: 'Bildirimler' },
  { href: '/reports', label: 'Raporlar' },
];

export default function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Plate search ref — F3 focuses this
  const plateInputRef = useRef<HTMLInputElement | null>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);

  const focusPlateSearch = useCallback(() => {
    // Try to find the plate input in the current page
    const plateInput =
      plateInputRef.current ??
      (document.querySelector('[data-plate-search]') as HTMLInputElement | null) ??
      (document.querySelector('input[placeholder*="plaka" i]') as HTMLInputElement | null) ??
      (document.querySelector('input[placeholder*="Plaka" ]') as HTMLInputElement | null);

    if (plateInput) {
      plateInput.focus();
      plateInput.select();
    }
  }, []);

  useKeyboardShortcuts({
    F2: {
      label: 'Yeni İş Emri Oluştur',
      display: 'F2',
      handler: (e) => {
        e.preventDefault();
        router.push('/work-orders/new');
      },
    },
    F3: {
      label: 'Plaka Aramaya Odaklan',
      display: 'F3',
      handler: (e) => {
        e.preventDefault();
        focusPlateSearch();
      },
    },
    'ctrl+k': {
      label: 'Genel Arama Aç',
      display: 'Ctrl+K',
      handler: (e) => {
        e.preventDefault();
        openSearch();
      },
    },
    '?': {
      label: 'Klavye Kısayollarını Göster',
      display: '?',
      handler: (e) => {
        e.preventDefault();
        openHelp();
      },
    },
    Escape: {
      label: 'Modalı Kapat',
      display: 'Esc',
      handler: () => {
        if (isSearchOpen) closeSearch();
        else if (isHelpOpen) closeHelp();
        else if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      },
    },
  });

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: logo + desktop nav */}
            <div className="flex items-center gap-8 min-w-0">
              <Link
                href="/dashboard"
                className="text-lg font-bold text-gray-900 shrink-0"
              >
                Manager
              </Link>
              <div className="hidden md:flex gap-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: search button + shortcuts hint + hamburger */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search button */}
              <button
                type="button"
                onClick={openSearch}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors min-w-[140px] hidden sm:flex"
                aria-label="Arama (Ctrl+K)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <span>Ara</span>
                <kbd className="ml-auto text-xs font-mono bg-white px-1 rounded border border-gray-300">
                  Ctrl+K
                </kbd>
              </button>

              {/* Mobile search icon */}
              <button
                type="button"
                onClick={openSearch}
                className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Arama"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </button>

              {/* Help shortcut hint (desktop only) */}
              <button
                type="button"
                onClick={openHelp}
                className="hidden md:flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Klavye kısayolları (?)"
                title="Klavye kısayolları"
              >
                <span className="text-sm font-mono font-bold">?</span>
              </button>

              {/* Hamburger (mobile) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <div
          id="mobile-menu"
          className={`md:hidden border-t border-gray-200 bg-white transition-all duration-200 overflow-hidden ${
            isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-gray-100">
              <Link
                href="/work-orders/new"
                className="block px-4 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors text-center"
              >
                Yeni İş Emri
              </Link>
            </div>

            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); openHelp(); }}
              className="w-full text-left px-4 py-3 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Klavye Kısayolları
            </button>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
      <KeyboardShortcutHelp isOpen={isHelpOpen} onClose={closeHelp} />
    </>
  );
}
