import Link from 'next/link';
import { getAdminBase } from '@/lib/admin-base';
import { getSupabaseService } from '@/lib/supabase';
import { resolveAdminTenantSlug } from '@/lib/admin-tenant';
import {
  getCountsBundle,
  getTopUserQuestions,
  getTopUnansweredQuestions,
  getTopPagesByEngagement,
  getConversationVolumeByDay,
  getLeadFunnel,
} from '@/lib/insights/queries';
import { parseRange, formatLong } from '@/lib/insights/dates';
import { SectionCard } from './components/SectionCard';
import { MetricTile } from './components/MetricTile';
import { EmptyState } from './components/EmptyState';
import { RangePicker } from './components/RangePicker';
import { VolumeLine, PagesBar, FunnelPie } from './components/ChartTile';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SearchParams {
  range?: string;
  tenant?: string;
}

export default async function InsightsDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const rangeToken = sp.range ?? 'last_7d';
  const range = parseRange(rangeToken);
  const base = await getAdminBase();

  const slug = await resolveAdminTenantSlug(sp);
  const supabase = getSupabaseService();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!tenant) {
    return (
      <EmptyState
        title="Tenant not found in Supabase."
        description={`The 'tenants' table doesn't have a row for slug '${slug}'. Add it via the Supabase SQL editor before the dashboard can show insights.`}
      />
    );
  }

  const [counts, topQuestions, topUnanswered, topPages, volume, funnel] = await Promise.all([
    getCountsBundle(tenant.id, range.start, range.end),
    getTopUserQuestions(tenant.id, range.start, range.end, 8),
    getTopUnansweredQuestions(tenant.id, range.start, range.end, 8),
    getTopPagesByEngagement(tenant.id, range.start, range.end, 10),
    getConversationVolumeByDay(tenant.id, range.start, range.end),
    getLeadFunnel(tenant.id, range.start, range.end),
  ]);

  const hasNoData = counts.conversations === 0 && counts.messages === 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            Insights
          </h1>
          <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
            {range.label} · {formatLong(range.start)} to {formatLong(range.end)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RangePicker basePath={base || '/'} currentToken={rangeToken} />
          <Link
            href={`${base}/reports?range=${encodeURIComponent(rangeToken)}`}
            className="px-3 py-1.5 rounded-md text-xs font-semibold border"
            style={{
              borderColor: 'var(--admin-accent)',
              background: 'var(--admin-accent)',
              color: '#001210',
            }}
          >
            Generate AI report
          </Link>
        </div>
      </header>

      {hasNoData ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--admin-fg)' }}>
            No conversation data in this range yet.
          </h2>
          <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: 'var(--admin-fg-muted)' }}>
            Once the chatbot starts having conversations, the dashboard fills in automatically.
            You can use the command bar above to ask anything once data lands. The tiles, charts,
            and reports all read directly from Supabase.
          </p>
        </div>
      ) : null}

      <section
        id="metrics"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <MetricTile
          label="Conversations"
          value={counts.conversations}
          hint={range.label}
          href={`${base}/conversations?range=${encodeURIComponent(rangeToken)}`}
          accent
        />
        <MetricTile
          label="Messages"
          value={counts.messages}
          hint={`avg ${counts.avg_messages_per_conversation} / conv`}
        />
        <MetricTile
          label="Unanswered"
          value={counts.unanswered}
          hint="flagged turns"
          href={`${base}/conversations?range=${encodeURIComponent(rangeToken)}&unanswered=1`}
        />
        <MetricTile
          label="Leads"
          value={counts.leads}
          hint={`${funnel.lead_capture_rate}% capture`}
          href={`${base}/leads?range=${encodeURIComponent(rangeToken)}`}
        />
        <MetricTile
          label="Bookings"
          value={counts.bookings}
          hint={`${funnel.booking_rate}% booking`}
          href={`${base}/bookings?range=${encodeURIComponent(rangeToken)}`}
        />
        <MetricTile
          label="Avg msgs / conv"
          value={counts.avg_messages_per_conversation}
          hint="signal of depth"
        />
      </section>

      {volume.length > 0 && (
        <section id="volume">
          <VolumeLine data={volume} />
        </section>
      )}

      <section id="funnel" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelPie data={funnel} />
        {topPages.length > 0 && <PagesBar data={topPages} />}
      </section>

      <section id="top-questions" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Top customer questions"
          subtitle="Coarse signal. The AI report clusters these semantically."
          action={
            <Link
              href={`${base}/conversations?range=${encodeURIComponent(rangeToken)}`}
              className="text-xs underline"
              style={{ color: 'var(--admin-link)' }}
            >
              browse
            </Link>
          }
        >
          {topQuestions.length === 0 ? (
            <EmptyState
              title="No questions yet."
              description="Once visitors start chatting, the top patterns surface here."
            />
          ) : (
            <ol className="space-y-2">
              {topQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span
                    className="font-bold min-w-[2rem]"
                    style={{ color: 'var(--admin-accent)' }}
                  >
                    {q.count}×
                  </span>
                  <span style={{ color: 'var(--admin-fg)' }}>{q.question}</span>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <SectionCard
          id="top-unanswered"
          title="Top unanswered questions"
          subtitle="These are the highest-value signals. Each one is a knowledge gap or a website-clarity issue."
          action={
            <Link
              href={`${base}/conversations?range=${encodeURIComponent(rangeToken)}&unanswered=1`}
              className="text-xs underline"
              style={{ color: 'var(--admin-link)' }}
            >
              browse
            </Link>
          }
        >
          {topUnanswered.length === 0 ? (
            <EmptyState
              title="No unanswered flagged."
              description="Either no flagged turns yet, or the chatbot is handling everything in this period."
            />
          ) : (
            <ol className="space-y-2">
              {topUnanswered.map((q, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span
                    className="font-bold min-w-[2rem]"
                    style={{ color: 'var(--admin-warning)' }}
                  >
                    {q.count}×
                  </span>
                  <Link
                    href={
                      q.example_conversation_id
                        ? `${base}/conversations/${q.example_conversation_id}`
                        : '#'
                    }
                    style={{ color: 'var(--admin-fg)' }}
                    className="hover:underline"
                  >
                    {q.question}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </section>

      <section id="pages">
        <SectionCard
          title="Page engagement"
          subtitle="Where on the site the chatbot is being used. Pages with high unanswered counts are pages that need website-clarity work."
        >
          {topPages.length === 0 ? (
            <EmptyState
              title="No page context recorded."
              description="The embed widget passes the host page path to the chatbot. This populates once visitors land on different pages."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wider"
                  style={{ color: 'var(--admin-fg-subtle)' }}
                >
                  <th className="py-2 pr-4">Page</th>
                  <th className="py-2 pr-4">Conversations</th>
                  <th className="py-2 pr-4">Messages</th>
                  <th className="py-2">Unanswered</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p, i) => (
                  <tr
                    key={i}
                    className="border-t hover:bg-[var(--admin-tile-hover)]"
                    style={{ borderColor: 'var(--admin-border)' }}
                  >
                    <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--admin-fg)' }}>
                      <Link
                        href={`${base}/conversations?range=${encodeURIComponent(rangeToken)}&page=${encodeURIComponent(p.page)}`}
                        className="hover:underline"
                      >
                        {p.page}
                      </Link>
                    </td>
                    <td className="py-2 pr-4" style={{ color: 'var(--admin-fg)' }}>
                      {p.conversation_count}
                    </td>
                    <td className="py-2 pr-4" style={{ color: 'var(--admin-fg-muted)' }}>
                      {p.message_count}
                    </td>
                    <td className="py-2" style={{ color: 'var(--admin-warning)' }}>
                      {p.unanswered_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      </section>
    </div>
  );
}
