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
  unanswered?: string;
  page?: string;
  q?: string;
  source?: string;
  tenant?: string;
}

export default async function ConversationsList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const rangeToken = sp.range ?? 'last_30d';
  const range = parseRange(rangeToken);
  const unansweredOnly = sp.unanswered === '1';
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
    .from('conversations')
    .select('id, source, page_context, outcome, started_at, message_count, anonymized_at, metadata', {
      count: 'exact',
    })
    .eq('tenant_id', tenant.id)
    .gte('started_at', range.start.toISOString())
    .lte('started_at', range.end.toISOString())
    .order('started_at', { ascending: false })
    .limit(200);

  if (sp.page) query = query.eq('page_context', sp.page);
  if (sp.source) query = query.eq('source', sp.source);

  const { data: conversations, count } = await query;
  let rows = conversations ?? [];

  // For 'unanswered_only' filter we do a second query to get conversation ids
  // that contain at least one flagged_unanswered message.
  if (unansweredOnly && rows.length > 0) {
    const ids = rows.map((c) => c.id);
    const { data: flagged } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', ids)
      .eq('flagged_unanswered', true);
    const flaggedSet = new Set((flagged ?? []).map((m) => m.conversation_id as string));
    rows = rows.filter((c) => flaggedSet.has(c.id as string));
  }

  // Keyword search on messages
  if (sp.q && rows.length > 0) {
    const { data: hits } = await supabase
      .from('messages')
      .select('conversation_id')
      .ilike('content', `%${sp.q}%`)
      .in('conversation_id', rows.map((c) => c.id));
    const hitSet = new Set((hits ?? []).map((m) => m.conversation_id as string));
    rows = rows.filter((c) => hitSet.has(c.id as string));
  }

  const csvUrl =
    `/api/admin/export/conversations?range=${encodeURIComponent(rangeToken)}` +
    (unansweredOnly ? '&unanswered=1' : '') +
    (sp.page ? `&page=${encodeURIComponent(sp.page)}` : '') +
    (sp.q ? `&q=${encodeURIComponent(sp.q)}` : '');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            Conversations
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
            {rows.length} shown of {count ?? rows.length} in {range.label}
            {sp.page ? ` · page=${sp.page}` : ''}
            {unansweredOnly ? ' · only conversations with unanswered turns' : ''}
            {sp.q ? ` · matching "${sp.q}"` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RangePicker basePath={`${base}/conversations`} currentToken={rangeToken} />
          <a
            href={csvUrl}
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

      <FiltersBar current={sp} base={base} />

      {rows.length === 0 ? (
        <EmptyState title="No conversations match these filters." />
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
                <th className="py-3 pl-5 pr-4">Started</th>
                <th className="py-3 pr-4">Source</th>
                <th className="py-3 pr-4">Page</th>
                <th className="py-3 pr-4">Outcome</th>
                <th className="py-3 pr-4">Msgs</th>
                <th className="py-3 pr-5">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hover:bg-[var(--admin-tile-hover)]"
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  <td className="py-2 pl-5 pr-4" style={{ color: 'var(--admin-fg)' }}>
                    {formatDateTime(c.started_at as string)}
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
                      {c.source ?? 'website'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
                    {c.page_context ?? '/'}
                  </td>
                  <td className="py-2 pr-4 text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
                    {c.outcome ?? '(open)'}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg-muted)' }}>
                    {c.message_count}
                  </td>
                  <td className="py-2 pr-5">
                    <Link
                      href={`${base}/conversations/${c.id}`}
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

function FiltersBar({ current, base }: { current: SearchParams; base: string }) {
  return (
    <form
      action={`${base}/conversations`}
      method="GET"
      className="flex flex-wrap gap-2 items-center rounded-xl border p-3"
      style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-tile)' }}
    >
      <input type="hidden" name="range" defaultValue={current.range ?? 'last_30d'} />
      <input
        type="text"
        name="q"
        placeholder="Search message text…"
        defaultValue={current.q ?? ''}
        className="rounded-md px-3 py-1.5 text-xs border"
        style={{
          background: 'var(--admin-bg-elevated)',
          borderColor: 'var(--admin-border)',
          color: 'var(--admin-fg)',
        }}
      />
      <input
        type="text"
        name="page"
        placeholder="Page path (e.g., /pricing)"
        defaultValue={current.page ?? ''}
        className="rounded-md px-3 py-1.5 text-xs border w-44"
        style={{
          background: 'var(--admin-bg-elevated)',
          borderColor: 'var(--admin-border)',
          color: 'var(--admin-fg)',
        }}
      />
      <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
        <input
          type="checkbox"
          name="unanswered"
          value="1"
          defaultChecked={current.unanswered === '1'}
        />
        Unanswered only
      </label>
      <button
        type="submit"
        className="ml-auto px-3 py-1.5 rounded-md text-xs font-semibold"
        style={{ background: 'var(--admin-accent)', color: '#001210' }}
      >
        Apply
      </button>
    </form>
  );
}
