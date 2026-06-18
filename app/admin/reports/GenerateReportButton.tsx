'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const RANGE_OPTIONS = [
  { token: 'today', label: 'Today' },
  { token: 'this_week', label: 'This week' },
  { token: 'last_week', label: 'Last week' },
  { token: 'this_month', label: 'This month' },
  { token: 'last_7d', label: 'Last 7 days' },
  { token: 'last_30d', label: 'Last 30 days' },
];

export function GenerateReportButton({
  defaultRange,
  base,
}: {
  defaultRange: string;
  base: string;
}) {
  const router = useRouter();
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trigger() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/insights/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ range_token: range, type: 'on_demand' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { report_id: string };
      router.push(`${base}/reports/${data.report_id}`);
    } catch (err) {
      console.error('generate report failed', err);
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={range}
        onChange={(e) => setRange(e.target.value)}
        disabled={loading}
        className="rounded-md px-3 py-1.5 text-xs border"
        style={{
          background: 'var(--admin-bg-tile)',
          borderColor: 'var(--admin-border)',
          color: 'var(--admin-fg)',
        }}
      >
        {RANGE_OPTIONS.map((o) => (
          <option key={o.token} value={o.token}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        onClick={trigger}
        disabled={loading}
        className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50"
        style={{
          background: 'var(--admin-accent)',
          color: '#001210',
        }}
      >
        {loading ? 'Starting…' : 'Generate report'}
      </button>
      {error && (
        <span className="text-xs" style={{ color: 'var(--admin-danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
