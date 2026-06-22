'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const RANGE_OPTIONS: Array<{ token: string; label: string }> = [
  { token: 'today', label: 'Today' },
  { token: 'this_week', label: 'This week' },
  { token: 'last_week', label: 'Last week' },
  { token: 'this_month', label: 'This month' },
  { token: 'last_7d', label: 'Last 7 days' },
  { token: 'last_30d', label: 'Last 30 days' },
];

interface GenerateReportMenuProps {
  defaultRange: string;
  base: string;
}

// Single button + dropdown menu. Click the button, pick a date range, and the
// component kicks off a new AI insight report for that range and navigates to
// it. Styling matches the user-requested look: white surface, teal border,
// teal text. No green pill.
export function GenerateReportMenu({ defaultRange, base }: GenerateReportMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click and Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function generate(rangeToken: string) {
    setLoading(rangeToken);
    setError(null);
    setOpen(false);
    try {
      const res = await fetch('/api/admin/insights/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ range_token: rangeToken, type: 'on_demand' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { report_id: string };
      router.push(`${base}/reports/${data.report_id}`);
    } catch (err) {
      console.error('generate report failed', err);
      setError(err instanceof Error ? err.message : 'unknown error');
      setLoading(null);
    }
  }

  // Sort so the currently-selected dashboard range shows first.
  const sortedOptions = [
    ...RANGE_OPTIONS.filter((r) => r.token === defaultRange),
    ...RANGE_OPTIONS.filter((r) => r.token !== defaultRange),
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading !== null}
        aria-haspopup="menu"
        aria-expanded={open}
        className="px-3 py-1.5 rounded-md text-xs font-semibold border inline-flex items-center gap-2 disabled:opacity-50"
        style={{
          background: 'var(--admin-bg-tile)',
          borderColor: 'var(--admin-accent)',
          color: 'var(--admin-accent)',
        }}
      >
        {loading ? 'Generating…' : 'Generate AI report'}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="2,3.5 5,6.5 8,3.5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border shadow-lg overflow-hidden z-40"
          style={{
            background: 'var(--admin-bg-elevated)',
            borderColor: 'var(--admin-border-strong)',
          }}
        >
          <div
            className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] font-semibold border-b"
            style={{
              color: 'var(--admin-fg-subtle)',
              borderColor: 'var(--admin-border)',
            }}
          >
            Generate report for
          </div>
          <ul className="py-1">
            {sortedOptions.map((opt) => (
              <li key={opt.token}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => generate(opt.token)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--admin-tile-hover)]"
                  style={{ color: 'var(--admin-fg)' }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="absolute right-0 mt-2 text-xs" style={{ color: 'var(--admin-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
