'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatusPollerProps {
  reportId: string;
  initialStatus: 'pending' | 'running' | 'complete' | 'failed';
}

export function StatusPoller({ reportId, initialStatus }: StatusPollerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'complete' || status === 'failed') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = await fetch(`/api/admin/insights/${reportId}/status`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { status: typeof status; error_message?: string };
        if (cancelled) return;
        setStatus(data.status);
        if (data.error_message) setError(data.error_message);
        if (data.status === 'pending' || data.status === 'running') {
          timer = setTimeout(tick, 3500);
        } else {
          router.refresh();
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'unknown error');
        timer = setTimeout(tick, 5000);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reportId, status, router]);

  if (status === 'complete') return null;

  return (
    <div
      className="rounded-2xl border px-5 py-4 flex items-center gap-3"
      style={{
        background: 'var(--admin-accent-dim)',
        borderColor: 'var(--admin-accent)',
      }}
    >
      {status === 'failed' ? (
        <>
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--admin-danger)' }}
          />
          <div className="text-sm font-semibold" style={{ color: 'var(--admin-fg)' }}>
            Report generation failed.{' '}
            {error && (
              <span className="font-normal" style={{ color: 'var(--admin-fg-muted)' }}>
                {error}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--admin-accent)' }}
          />
          <div className="text-sm" style={{ color: 'var(--admin-fg)' }}>
            <span className="font-semibold">
              {status === 'pending' ? 'Queued.' : 'Analyzing conversations…'}
            </span>{' '}
            <span style={{ color: 'var(--admin-fg-muted)' }}>
              This typically takes 30 to 90 seconds.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
