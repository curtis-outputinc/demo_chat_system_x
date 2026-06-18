import Link from 'next/link';
import { getAdminBase } from '@/lib/admin-base';
import { getSupabaseService } from '@/lib/supabase';
import { resolveAdminTenantSlug } from '@/lib/admin-tenant';
import { parseRange, formatDateTime } from '@/lib/insights/dates';
import { EmptyState } from '../components/EmptyState';
import { GenerateReportButton } from './GenerateReportButton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SearchParams {
  range?: string;
  tenant?: string;
}

export default async function ReportsList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const rangeToken = sp.range ?? 'last_7d';
  const base = await getAdminBase();

  const slug = await resolveAdminTenantSlug(sp);
  const supabase = getSupabaseService();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!tenant) return <EmptyState title="Tenant not configured." />;

  const { data: reports } = await supabase
    .from('reports')
    .select(
      'id, type, label, status, range_start, range_end, conversation_count, lead_count, summary, finished_at, created_at',
    )
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = reports ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            Reports
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
            AI-generated insight reports across windowed conversations
          </p>
        </div>
        <GenerateReportButton defaultRange={rangeToken} base={base} />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No reports yet."
          description="Click Generate Report to run the first AI summary over a date range, or use the command bar to ask: 'summarize this week.'"
        />
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: 'var(--admin-fg-subtle)' }}
              >
                <th className="py-3 pl-5 pr-4">Generated</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Period</th>
                <th className="py-3 pr-4">Convs</th>
                <th className="py-3 pr-4">Leads</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-5">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t hover:bg-[var(--admin-tile-hover)]"
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  <td className="py-2 pl-5 pr-4 text-xs" style={{ color: 'var(--admin-fg)' }}>
                    {formatDateTime((r.finished_at as string) ?? (r.created_at as string))}
                  </td>
                  <td className="py-2 pr-4 text-xs">
                    <span
                      className="px-2 py-0.5 rounded uppercase tracking-wider border text-[10px]"
                      style={{
                        borderColor: 'var(--admin-border)',
                        background: 'var(--admin-bg-tile)',
                        color: 'var(--admin-fg-muted)',
                      }}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
                    {formatDateTime(r.range_start as string)} -{' '}
                    {formatDateTime(r.range_end as string)}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg)' }}>
                    {r.conversation_count}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg)' }}>
                    {r.lead_count}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={r.status as string} />
                  </td>
                  <td className="py-2 pr-5">
                    <Link
                      href={`${base}/reports/${r.id}`}
                      className="text-xs underline"
                      style={{ color: 'var(--admin-link)' }}
                    >
                      view
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = 'var(--admin-info)';
  if (status === 'complete') color = 'var(--admin-success)';
  if (status === 'failed') color = 'var(--admin-danger)';
  if (status === 'running') color = 'var(--admin-accent)';
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {status}
    </span>
  );
}
