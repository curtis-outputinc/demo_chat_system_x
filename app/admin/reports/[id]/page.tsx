import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminBase } from '@/lib/admin-base';
import { getSupabaseService } from '@/lib/supabase';
import { StatusPoller } from '../../components/StatusPoller';
import { ReportViewer } from '../../components/ReportViewer';
import type { ReportRecord } from '@/lib/insights/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ReportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const base = await getAdminBase();
  const supabase = getSupabaseService();
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!report) return notFound();

  const r = report as ReportRecord;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link
          href={`${base}/reports`}
          className="text-xs underline"
          style={{ color: 'var(--admin-link)' }}
        >
          ← Back to reports
        </Link>
      </div>

      {r.status !== 'complete' && (
        <StatusPoller reportId={r.id} initialStatus={r.status} />
      )}

      {r.status === 'failed' && (
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--admin-danger)', background: 'var(--admin-bg-elevated)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--admin-fg)' }}>
            Report generation failed
          </h2>
          {r.error_message && (
            <p className="mt-2 text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
              {r.error_message}
            </p>
          )}
        </div>
      )}

      {r.status === 'complete' && <ReportViewer report={r} base={base} />}

      {(r.status === 'pending' || r.status === 'running') && (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
        >
          <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
            Output Systems is analyzing conversations from this window. The page will refresh
            automatically when the report is ready.
          </p>
        </div>
      )}
    </div>
  );
}
