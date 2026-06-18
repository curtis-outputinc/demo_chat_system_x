'use client';

import Link from 'next/link';
import type { ReportRecord } from '@/lib/insights/types';
import { formatDateTime } from '@/lib/insights/dates';

interface ReportViewerProps {
  report: ReportRecord;
  base: string;
}

export function ReportViewer({ report, base }: ReportViewerProps) {
  const periodLabel = report.label ?? `${formatDateTime(report.range_start)} - ${formatDateTime(report.range_end)}`;

  return (
    <div className="report-print-wrapper space-y-8">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            Insight Report
          </h1>
          <div className="text-xs flex gap-3" style={{ color: 'var(--admin-fg-subtle)' }}>
            <span>Type: {report.type}</span>
            <span>·</span>
            <span>Generated {report.finished_at ? formatDateTime(report.finished_at) : '—'}</span>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
          {periodLabel}
        </p>
      </header>

      <div className="no-print flex flex-wrap gap-2">
        <a
          href={`/api/admin/export/report/${report.id}/docx`}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border"
          style={{
            borderColor: 'var(--admin-border)',
            color: 'var(--admin-fg)',
            background: 'var(--admin-bg-tile)',
          }}
        >
          Download as DOCX
        </a>
        <a
          href={`/api/admin/export/report/${report.id}/csv`}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border"
          style={{
            borderColor: 'var(--admin-border)',
            color: 'var(--admin-fg)',
            background: 'var(--admin-bg-tile)',
          }}
        >
          Download as CSV
        </a>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border"
          style={{
            borderColor: 'var(--admin-border)',
            color: 'var(--admin-fg)',
            background: 'var(--admin-bg-tile)',
          }}
        >
          Print to PDF
        </button>
      </div>

      <section
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 rounded-2xl border p-4"
        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
      >
        <Stat label="Conversations" value={report.conversation_count} />
        <Stat label="Messages" value={report.message_count} />
        <Stat label="Leads" value={report.lead_count} />
        <Stat label="Bookings" value={report.booking_count} />
        <Stat label="Unanswered" value={report.unanswered_count} />
        <Stat label="Avg msgs / conv" value={report.avg_messages_per_conversation ?? '—'} />
      </section>

      {report.summary && (
        <Section title="Summary">
          <p
            className="text-base leading-relaxed whitespace-pre-line"
            style={{ color: 'var(--admin-fg)' }}
          >
            {report.summary}
          </p>
        </Section>
      )}

      {report.top_questions && report.top_questions.length > 0 && (
        <Section title="Top customer questions" subtitle={`${report.top_questions.length} clusters`}>
          <ol className="space-y-2 list-decimal pl-5">
            {report.top_questions.map((q, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--admin-fg)' }}>
                <span
                  className="inline-block min-w-[2.5rem] font-semibold mr-2"
                  style={{ color: 'var(--admin-accent)' }}
                >
                  {q.count}×
                </span>
                {q.question}
                {q.example_conversation_id && (
                  <Link
                    href={`${base}/conversations/${q.example_conversation_id}`}
                    className="ml-2 text-xs underline"
                    style={{ color: 'var(--admin-link)' }}
                  >
                    open example
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {report.top_unanswered && report.top_unanswered.length > 0 && (
        <Section
          title="Top unanswered questions"
          subtitle="These are the most valuable signals. Each is a knowledge-base gap or a website-clarity issue."
        >
          <ol className="space-y-2 list-decimal pl-5">
            {report.top_unanswered.map((q, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--admin-fg)' }}>
                <span
                  className="inline-block min-w-[2.5rem] font-semibold mr-2"
                  style={{ color: 'var(--admin-warning)' }}
                >
                  {q.count}×
                </span>
                {q.question}
                {q.example_conversation_id && (
                  <Link
                    href={`${base}/conversations/${q.example_conversation_id}`}
                    className="ml-2 text-xs underline"
                    style={{ color: 'var(--admin-link)' }}
                  >
                    open example
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {report.top_pages && report.top_pages.length > 0 && (
        <Section title="Page engagement">
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
              {report.top_pages.map((p, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--admin-border)' }}>
                  <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--admin-fg)' }}>
                    {p.page}
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
        </Section>
      )}

      {report.suggested_actions && report.suggested_actions.length > 0 && (
        <Section
          title="Suggested actions"
          subtitle="Each action references a specific signal from this period's data."
        >
          <div className="space-y-3">
            {report.suggested_actions.map((a, i) => (
              <div
                key={i}
                className="rounded-lg border p-4"
                style={{
                  borderColor: 'var(--admin-border)',
                  background: 'var(--admin-bg-tile)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      background: priorityColor(a.priority),
                      color: '#001210',
                    }}
                  >
                    {a.priority ?? 'medium'}
                  </span>
                  <h4 className="text-sm font-semibold" style={{ color: 'var(--admin-fg)' }}>
                    {a.title}
                  </h4>
                </div>
                <p className="text-sm" style={{ color: 'var(--admin-fg-muted)' }}>
                  {a.rationale}
                </p>
                {a.source && (
                  <p className="text-xs mt-2 italic" style={{ color: 'var(--admin-fg-subtle)' }}>
                    Source: {a.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {report.sentiment && (
        <Section title="Sentiment">
          <p className="text-sm" style={{ color: 'var(--admin-fg)' }}>
            {report.sentiment}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--admin-fg)' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--admin-fg-subtle)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[0.15em] font-semibold"
        style={{ color: 'var(--admin-fg-subtle)' }}
      >
        {label}
      </div>
      <div className="text-lg font-bold mt-0.5" style={{ color: 'var(--admin-fg)' }}>
        {value}
      </div>
    </div>
  );
}

function priorityColor(p?: string): string {
  switch (p) {
    case 'high':
      return 'var(--admin-danger)';
    case 'medium':
      return 'var(--admin-warning)';
    case 'low':
      return 'var(--admin-info)';
    default:
      return 'var(--admin-warning)';
  }
}
