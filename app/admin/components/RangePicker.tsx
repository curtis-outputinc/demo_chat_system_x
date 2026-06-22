'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const RANGES: Array<{ token: string; label: string }> = [
  { token: 'today', label: 'Today' },
  { token: 'this_week', label: 'This week' },
  { token: 'last_week', label: 'Last week' },
  { token: 'this_month', label: 'This month' },
  { token: 'last_7d', label: 'Last 7 days' },
  { token: 'last_30d', label: 'Last 30 days' },
];

interface RangePickerProps {
  basePath: string;
  currentToken: string;
}

// Native <select> dropdown styled to match the metric tile "baby teal" surface
// (admin-accent-dim background, admin-accent border). Replaces the previous
// row of buttons so the header reads cleaner with more whitespace.
export function RangePicker({ basePath, currentToken }: RangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setRange(token: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('range', token);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold">
      <span
        className="uppercase tracking-[0.15em]"
        style={{ color: 'var(--admin-fg-subtle)' }}
      >
        Date range
      </span>
      <select
        value={currentToken}
        onChange={(e) => setRange(e.target.value)}
        className="rounded-md px-3 py-1.5 text-xs font-semibold border outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]"
        style={{
          background: 'var(--admin-range-bg)',
          borderColor: 'var(--admin-accent)',
          color: 'var(--admin-range-fg)',
        }}
      >
        {RANGES.map((r) => (
          <option key={r.token} value={r.token}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}
