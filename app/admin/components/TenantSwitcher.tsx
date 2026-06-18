'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export interface TenantOption {
  slug: string;
  name: string;
}

interface Props {
  tenants: TenantOption[];
  defaultSlug: string;
}

/**
 * Dropdown that switches the active tenant on the multi-tenant insights hub.
 * Writes ?tenant=<slug> to the URL and triggers a server-component refresh so
 * every admin page re-queries against the new tenant.
 */
export function TenantSwitcher({ tenants, defaultSlug }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get('tenant') ?? defaultSlug;

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value;
      const sp = new URLSearchParams(params.toString());
      sp.set('tenant', next);
      router.push(`${pathname}?${sp.toString()}`);
    },
    [params, pathname, router],
  );

  if (tenants.length === 0) return null;

  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium">
      <span style={{ color: 'var(--admin-fg-subtle)' }}>Vertical</span>
      <select
        value={current}
        onChange={onChange}
        className="rounded-md border px-2 py-1 text-sm"
        style={{
          background: 'var(--admin-bg-elevated)',
          borderColor: 'var(--admin-border)',
          color: 'var(--admin-fg)',
        }}
      >
        {tenants.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
