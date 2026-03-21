import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Manager — Dashboard',
};

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
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <span className="text-lg font-bold text-gray-900">Manager</span>
              <div className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
