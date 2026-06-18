import { Suspense } from 'react';
import { QueryRunner } from './QueryRunner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SearchParams {
  q?: string;
}

export default async function QueryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const question = sp.q ?? '';

  if (!question) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            Ask for a chart
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--admin-fg)' }}>
            Use the command bar above to ask a question. Examples below.
          </p>
        </header>
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--admin-fg)' }}>
            Try one of these
          </h2>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--admin-fg)' }}>
            <li>"Pie chart of conversations that asked about pricing this week"</li>
            <li>"Pie chart of the lead funnel this month"</li>
            <li>"Bar chart of top customer questions last 30 days"</li>
            <li>"Bar chart of top unanswered questions this week"</li>
            <li>"Bar chart of conversations by page last week"</li>
            <li>"Bar chart of conversations by hour of day this week"</li>
            <li>"Line chart of conversation volume last 30 days"</li>
            <li>"Pie chart of conversations by source today"</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div style={{ color: 'var(--admin-fg)' }}>Loading…</div>}>
      <QueryRunner question={question} />
    </Suspense>
  );
}
