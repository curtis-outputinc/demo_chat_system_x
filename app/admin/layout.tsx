import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { getAdminBase } from '@/lib/admin-base';
import { isMultiTenantAdmin, listAdminTenants, resolveAdminTenantSlug } from '@/lib/admin-tenant';
import { ThemeToggle } from './components/ThemeToggle';
import { AdminCommandBar } from './components/AdminCommandBar';
import { TenantSwitcher } from './components/TenantSwitcher';

const NAV_ITEMS: Array<{ seg: string; label: string }> = [
  { seg: '', label: 'Insights' },
  { seg: '/conversations', label: 'Conversations' },
  { seg: '/leads', label: 'Leads' },
  { seg: '/reports', label: 'Reports' },
  { seg: '/bookings', label: 'Bookings' },
  { seg: '/query', label: 'Ask' },
  { seg: '/guide', label: 'Guide' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const base = await getAdminBase();
  const home = base || '/';
  const multiTenant = isMultiTenantAdmin();
  const tenants = multiTenant ? await listAdminTenants() : [];
  const defaultTenantSlug = multiTenant ? await resolveAdminTenantSlug({}) : '';
  return (
    <div className="admin-shell flex flex-col min-h-screen">
      <header
        className="border-b sticky top-0 z-30 backdrop-blur no-print"
        style={{
          background: 'color-mix(in srgb, var(--admin-bg) 90%, transparent)',
          borderColor: 'var(--admin-border)',
        }}
      >
        <div className="max-w-[95vw] mx-auto px-6 py-3 flex items-center gap-6 flex-wrap">
          <Link
            href={home}
            className="flex items-center gap-3 group"
            style={{ color: 'var(--admin-fg)' }}
          >
            <Image
              src="/logo.png"
              alt="Output"
              width={140}
              height={42}
              className="h-8 w-auto admin-logo-dark"
              priority
            />
            <Image
              src="/logo-light.png"
              alt="Output"
              width={140}
              height={42}
              className="h-8 w-auto admin-logo-light"
              priority
            />
            <span
              className="text-xs uppercase tracking-[0.2em] font-bold hidden sm:inline"
              style={{ color: 'var(--admin-fg-subtle)' }}
            >
              Insights
            </span>
          </Link>
          <nav className="flex items-center gap-1 ml-2 flex-wrap">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.seg || 'home'}
                href={item.seg ? `${base}${item.seg}` : home}
                className="px-3 py-1.5 text-sm rounded-md transition-colors"
                style={{ color: 'var(--admin-fg-muted)' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {multiTenant && tenants.length > 0 ? (
              <TenantSwitcher tenants={tenants} defaultSlug={defaultTenantSlug} />
            ) : null}
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-[95vw] mx-auto px-6 pb-4">
          <AdminCommandBar base={base} />
        </div>
      </header>
      <main className="flex-1 max-w-[95vw] w-full mx-auto px-6 py-8">{children}</main>
      <footer
        className="border-t py-4 text-center text-xs no-print"
        style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-fg-subtle)' }}
      >
        Output Systems · Insights dashboard
      </footer>
    </div>
  );
}
