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

export function RangePicker({ basePath, currentToken }: RangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setRange(token: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('range', token);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {RANGES.map((r) => {
        const active = r.token === currentToken;
        return (
          <button
            key={r.token}
            onClick={() => setRange(r.token)}
            className="px-3 py-1 rounded-md text-xs font-semibold border transition-colors"
            style={
              active
                ? {
                    background: 'var(--admin-accent)',
                    borderColor: 'var(--admin-accent)',
                    color: '#001210',
                  }
                : {
                    background: 'var(--admin-bg-tile)',
                    borderColor: 'var(--admin-border)',
                    color: 'var(--admin-fg-muted)',
                  }
            }
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
