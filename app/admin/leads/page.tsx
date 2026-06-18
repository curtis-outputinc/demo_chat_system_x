import Link from 'next/link';
import { getAdminBase } from '@/lib/admin-base';
import { getSupabaseService } from '@/lib/supabase';
import { resolveAdminTenantSlug } from '@/lib/admin-tenant';
import { parseRange, formatDateTime } from '@/lib/insights/dates';
import { RangePicker } from '../components/RangePicker';
import { EmptyState } from '../components/EmptyState';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SearchParams {
  range?: string;
  source?: string;
  tenant?: string;
}

export default async function LeadsList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const rangeToken = sp.range ?? 'last_30d';
  const range = parseRange(rangeToken);
  const base = await getAdminBase();

  const slug = await resolveAdminTenantSlug(sp);
  const supabase = getSupabaseService();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!tenant) return <EmptyState title="Tenant not configured." />;

  let query = supabase
    .from('leads')
    .select('id, name, email, phone, source, status, conversation_id, created_at', {
      count: 'exact',
    })
    .eq('tenant_id', tenant.id)
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())
    .order('created_at', { ascending: false })
    .limit(200);

  if (sp.source) query = query.eq('source', sp.source);

  const { data: leads, count } = await query;
  const rows = leads ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            Leads
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
            {rows.length} shown of {count ?? rows.length} in {range.label}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RangePicker basePath={`${base}/leads`} currentToken={rangeToken} />
          <a
            href={`/api/admin/export/leads?range=${encodeURIComponent(rangeToken)}`}
            className="px-3 py-1.5 rounded-md text-xs font-semibold border"
            style={{
              borderColor: 'var(--admin-border)',
              background: 'var(--admin-bg-tile)',
              color: 'var(--admin-fg)',
            }}
          >
            Download CSV
          </a>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No leads in this range."
          description="When a visitor shares their contact details via the locked two-option flow, the lead lands here."
        />
      ) : (
        <div
          className="rounded-2xl border overflow-x-auto"
          style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: 'var(--admin-fg-subtle)' }}
              >
                <th className="py-3 pl-5 pr-4">Captured</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Source</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-5">Conversation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr
                  key={l.id}
                  className="border-t hover:bg-[var(--admin-tile-hover)]"
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  <td className="py-2 pl-5 pr-4" style={{ color: 'var(--admin-fg)' }}>
                    {formatDateTime(l.created_at as string)}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg)' }}>
                    {l.name ?? '—'}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg-muted)' }}>
                    {l.email ?? '—'}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg-muted)' }}>
                    {l.phone ?? '—'}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border"
                      style={{
                        borderColor: 'var(--admin-border)',
                        background: 'var(--admin-bg-tile)',
                        color: 'var(--admin-fg-muted)',
                      }}
                    >
                      {l.source}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
                    {l.status}
                  </td>
                  <td className="py-2 pr-5">
                    {l.conversation_id ? (
                      <Link
                        href={`${base}/conversations/${l.conversation_id}`}
                        className="text-xs underline"
                        style={{ color: 'var(--admin-link)' }}
                      >
                        view
                      </Link>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--admin-fg-subtle)' }}>
                        —
                      </span>
                    )}
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
