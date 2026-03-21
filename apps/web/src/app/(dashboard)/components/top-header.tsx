'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SearchModal from './search-modal';
import KeyboardShortcutHelp from './keyboard-shortcut-help';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

// ------------------------------------------------------------------ helpers --

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/work-orders': 'İş Emirleri',
  '/work-orders/new': 'Yeni İş Emri',
  '/customers': 'Müşteriler',
  '/vehicles': 'Araçlar',
  '/services': 'Hizmetler',
  '/products': 'Ürünler',
  '/stock': 'Stok',
  '/invoices': 'Faturalar',
  '/accounts': 'Cari Hesaplar',
  '/finance': 'Finans',
  '/employees': 'Çalışanlar',
  '/payroll': 'Bordro',
  '/notifications': 'Bildirimler',
  '/reports': 'Raporlar',
};

function resolveTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname] as string;
  // Prefix match (longest wins)
  const segments = Object.keys(ROUTE_TITLES)
    .filter((k) => pathname.startsWith(k) && k !== '/dashboard')
    .sort((a, b) => b.length - a.length);
  return (segments[0] ? ROUTE_TITLES[segments[0]] : null) ?? 'Manager';
}

// ------------------------------------------------------------------- icons ---

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconQuestion({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ---------------------------------------------------------------- component ---

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = resolveTitle(pathname);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);

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
        const plateInput =
          (document.querySelector('[data-plate-search]') as HTMLInputElement | null) ??
          (document.querySelector('input[placeholder*="plaka" i]') as HTMLInputElement | null);
        if (plateInput) {
          plateInput.focus();
          plateInput.select();
        }
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
        else if (isUserMenuOpen) setIsUserMenuOpen(false);
      },
    },
  });

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
        {/* Left: mobile hamburger + page title */}
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle — handled via a simple state in this component */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Menüyü aç"
            onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
          >
            <IconMenu className="w-5 h-5" />
          </button>

          <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
        </div>

        {/* Right: search + help + user */}
        <div className="flex items-center gap-2">
          {/* Search button — desktop */}
          <button
            type="button"
            onClick={openSearch}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors min-w-[160px]"
            aria-label="Arama (Ctrl+K)"
          >
            <IconSearch className="w-4 h-4 shrink-0" />
            <span>Ara...</span>
            <kbd className="ml-auto text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-gray-300">
              Ctrl+K
            </kbd>
          </button>

          {/* Search button — mobile */}
          <button
            type="button"
            onClick={openSearch}
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Arama"
          >
            <IconSearch className="w-5 h-5" />
          </button>

          {/* Keyboard shortcuts help */}
          <button
            type="button"
            onClick={openHelp}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Klavye kısayolları"
            title="Klavye kısayolları (?)"
          >
            <IconQuestion className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <IconUser className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">Yönetici</p>
                <p className="text-xs text-gray-500 mt-0.5">admin@manager.app</p>
              </div>
              <IconChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Yönetici</p>
                  <p className="text-xs text-gray-500 mt-0.5">admin@manager.app</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <IconSettings className="w-4 h-4 text-gray-400" />
                  Ayarlar
                </button>
                <button
                  type="button"
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <IconLogout className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay — we drive visibility here */}
      {isMobileSidebarOpen && (
        <MobileSidebarOverlay onClose={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
      <KeyboardShortcutHelp isOpen={isHelpOpen} onClose={closeHelp} />
    </>
  );
}

// ----------------------------------------------- mobile sidebar overlay ---
// Inline minimal sidebar for mobile so we don't need cross-component state

import { navSections } from './sidebar';
import Link from 'next/link';

function MobileSidebarOverlay({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    const base = href.split('?')[0];
    return pathname.startsWith(base ?? href);
  }

  return (
    <div className="md:hidden fixed inset-0 z-40 flex">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside className="relative flex flex-col w-64 bg-gray-900 z-50 shadow-2xl overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Manager</span>
        </div>

        <nav className="flex-1 py-4 space-y-6 px-3">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors
                          ${active
                            ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 pl-[6px]'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-100'
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
