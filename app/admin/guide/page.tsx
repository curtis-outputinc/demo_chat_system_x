import { Suspense } from 'react';
import { GuideAsker } from './GuideAsker';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SearchParams {
  q?: string;
}

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const question = sp.q ?? '';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
          User Guide
        </h1>
        <p className="text-base mt-2" style={{ color: 'var(--admin-fg)' }}>
          How to use this dashboard. You can also ask the command bar at the top "how do I..."
          and you'll get an answer that lands right here.
        </p>
      </header>

      {question && (
        <Suspense
          fallback={
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
            >
              <p style={{ color: 'var(--admin-fg)' }}>Thinking about your question…</p>
            </div>
          }
        >
          <GuideAsker question={question} />
        </Suspense>
      )}

      <GuideSection title="The command bar (top of every page)" anchor="command-bar">
        <p>
          The big text box at the top of every admin page is the command bar. Type anything in it.
          It will figure out what you want and either show you a chart, jump to a filtered list,
          start a report, or open this guide.
        </p>
        <p>You can also click the mic icon to speak instead of type.</p>
        <Examples>
          <li>"pie chart of pricing questions this week"</li>
          <li>"summarize the last 30 days"</li>
          <li>"show me conversations about refunds last week"</li>
          <li>"top unanswered this week"</li>
          <li>"how do I download a report"</li>
        </Examples>
      </GuideSection>

      <GuideSection title="Insights (the home page)" anchor="insights">
        <p>
          The home page is at <code>/admin</code>. It shows your dashboard at a glance: how many
          conversations, leads, bookings, and unanswered questions in the date range you picked.
        </p>
        <p>
          Pick a date range with the buttons in the top right: Today, This week, Last week, This
          month, Last 7 days, Last 30 days. Weeks run Monday to Sunday.
        </p>
        <p>
          Below the tiles you see charts and lists. Click on a tile to jump to a filtered list of
          the conversations that count was based on.
        </p>
      </GuideSection>

      <GuideSection title="Reports (AI summaries)" anchor="reports">
        <p>
          A report is an AI-written summary of a date range. It pulls patterns out of the
          conversations and tells you the top questions, top unanswered questions, page issues,
          and suggested next actions.
        </p>
        <ol>
          <li>Open the Reports page from the nav.</li>
          <li>Pick a date range from the dropdown.</li>
          <li>Click "Generate report".</li>
          <li>Wait 30 to 90 seconds for the AI to finish.</li>
          <li>When it lands, you'll see the full report.</li>
        </ol>
        <p>
          From a finished report you can download as DOCX, download as CSV, or print to PDF using
          the browser print dialog.
        </p>
        <p>
          Every Monday at 12:00 UTC, a weekly report is generated automatically for the prior week.
        </p>
      </GuideSection>

      <GuideSection title="Conversations" anchor="conversations">
        <p>
          Every chat someone has with the bot lands here. Filter by date range, by page path, by
          unanswered only, or by a keyword from a message.
        </p>
        <p>
          Click "view" on a row to see the full transcript. Click "Download CSV" at the top to
          export the filtered list as a spreadsheet.
        </p>
      </GuideSection>

      <GuideSection title="Leads and Bookings" anchor="leads">
        <p>
          When someone shares their name, email, and phone in the chat, they show up in Leads.
          When someone books a call via Cal.com, they show up in Bookings.
        </p>
        <p>
          Both pages have a date range picker. From a row you can click "view" to see the
          conversation that produced the lead or booking. Leads also has a CSV export.
        </p>
      </GuideSection>

      <GuideSection title="Ask (custom charts)" anchor="ask">
        <p>
          The Ask page builds a custom chart for you. Type a chart-shaped question in the command
          bar. The system picks the right chart type and data, then writes a breakdown.
        </p>
        <Examples>
          <li>"pie chart of conversations that asked about pricing this week"</li>
          <li>"pie chart of the lead funnel this month"</li>
          <li>"bar chart of top customer questions last 30 days"</li>
          <li>"bar chart of conversations by page last week"</li>
          <li>"line chart of conversation volume last 30 days"</li>
        </Examples>
        <p>
          Below the chart you get a Summary section, a Breakdown with one card per segment
          (color, label, count, percentage, optional note), and Key observations the AI pulled
          out of the data.
        </p>
        <p>The "Download summary (PDF)" button at the top prints the whole result as a PDF.</p>
      </GuideSection>

      <GuideSection title="Theme toggle" anchor="theme">
        <p>
          The sun or moon icon in the top right of the header flips the dashboard between dark
          theme and light theme. The choice is saved in your browser.
        </p>
      </GuideSection>

      <GuideSection title="Tips" anchor="tips">
        <ul>
          <li>Use the command bar more than you click around. It's faster.</li>
          <li>If something looks stale after a deploy, hard-reload (Ctrl + Shift + R).</li>
          <li>Reports are saved. Old ones live on /admin/reports forever.</li>
          <li>The "How do I..." command opens this guide with an AI answer at the top.</li>
        </ul>
      </GuideSection>
    </div>
  );
}

function GuideSection({
  title,
  anchor,
  children,
}: {
  title: string;
  anchor: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchor}
      className="rounded-2xl border p-6 space-y-3"
      style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
    >
      <h2 className="text-lg font-bold" style={{ color: 'var(--admin-fg)' }}>
        {title}
      </h2>
      <div className="space-y-3 text-base leading-relaxed" style={{ color: 'var(--admin-fg)' }}>
        {children}
      </div>
    </section>
  );
}

function Examples({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className="rounded-lg border p-4 space-y-1.5"
      style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-tile)' }}
    >
      {children}
    </ul>
  );
}
