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
  tenant?: string;
}

export default async function BookingsList({
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

  const { data: bookings, count } = await supabase
    .from('bookings')
    .select(
      'id, attendee_name, attendee_email, attendee_company, meeting_time, meeting_type, status, conversation_id, created_at',
      { count: 'exact' },
    )
    .eq('tenant_id', tenant.id)
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = bookings ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            Bookings
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
            {rows.length} shown of {count ?? rows.length} in {range.label}
          </p>
        </div>
        <RangePicker basePath={`${base}/bookings`} currentToken={rangeToken} />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No bookings in this range."
          description="Bookings arrive via the Cal.com webhook on output.systems."
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
                <th className="py-3 pl-5 pr-4">Booked</th>
                <th className="py-3 pr-4">Attendee</th>
                <th className="py-3 pr-4">Company</th>
                <th className="py-3 pr-4">Meeting time</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-5">Conversation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.id}
                  className="border-t hover:bg-[var(--admin-tile-hover)]"
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  <td className="py-2 pl-5 pr-4" style={{ color: 'var(--admin-fg)' }}>
                    {formatDateTime(b.created_at as string)}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg)' }}>
                    <div>{b.attendee_name ?? '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--admin-fg-subtle)' }}>
                      {b.attendee_email}
                    </div>
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg-muted)' }}>
                    {b.attendee_company ?? '—'}
                  </td>
                  <td className="py-2 pr-4" style={{ color: 'var(--admin-fg-muted)' }}>
                    {b.meeting_time ? formatDateTime(b.meeting_time as string) : '—'}
                  </td>
                  <td className="py-2 pr-4 text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
                    {b.meeting_type ?? '—'}
                  </td>
                  <td className="py-2 pr-4 text-xs" style={{ color: 'var(--admin-fg-muted)' }}>
                    {b.status}
                  </td>
                  <td className="py-2 pr-5">
                    {b.conversation_id ? (
                      <Link
                        href={`${base}/conversations/${b.conversation_id}`}
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
