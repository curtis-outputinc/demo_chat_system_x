import Link from 'next/link';
import type { ReactNode } from 'react';

interface MetricTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  accent?: boolean;
}

export function MetricTile({ label, value, hint, href, accent }: MetricTileProps) {
  const inner = (
    <div
      className="rounded-2xl border p-5 h-full transition-colors"
      style={{
        background: accent ? 'var(--admin-accent-dim)' : 'var(--admin-bg-tile)',
        borderColor: accent ? 'var(--admin-accent)' : 'var(--admin-border)',
      }}
    >
      <div
        className="text-[11px] uppercase tracking-[0.15em] font-semibold"
        style={{ color: 'var(--admin-fg-subtle)' }}
      >
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
          {hint}
        </div>
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}
