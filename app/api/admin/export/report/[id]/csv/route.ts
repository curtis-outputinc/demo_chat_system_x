import { NextRequest } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { rowsToCsv } from '@/lib/insights/exporters';
import type { ReportRecord, QuestionEntry, PageEngagementEntry, SuggestedAction } from '@/lib/insights/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * CSV export of a report's structured sections. One workbook-style CSV file
 * with section dividers so it opens cleanly in Excel and the operator can copy
 * each section out as needed.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = getSupabaseService();
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!report) {
    return new Response('Report not found', { status: 404 });
  }

  const r = report as ReportRecord;
  const blocks: string[] = [];

  blocks.push(
    rowsToCsv(
      ['Field', 'Value'],
      [
        ['Type', r.type],
        ['Label', r.label ?? ''],
        ['Period start', r.range_start],
        ['Period end', r.range_end],
        ['Conversations', r.conversation_count],
        ['Messages', r.message_count],
        ['Leads', r.lead_count],
        ['Bookings', r.booking_count],
        ['Unanswered', r.unanswered_count],
        ['Avg msgs / conv', r.avg_messages_per_conversation ?? 0],
        ['Sentiment', r.sentiment ?? ''],
      ],
    ),
  );
  blocks.push('');
  blocks.push('Summary');
  blocks.push(`"${(r.summary ?? '').replace(/"/g, '""')}"`);
  blocks.push('');
  blocks.push('Top customer questions');
  blocks.push(
    rowsToCsv(
      ['count', 'question'],
      ((r.top_questions ?? []) as QuestionEntry[]).map((q) => [q.count, q.question]),
    ),
  );
  blocks.push('');
  blocks.push('Top unanswered questions');
  blocks.push(
    rowsToCsv(
      ['count', 'question'],
      ((r.top_unanswered ?? []) as QuestionEntry[]).map((q) => [q.count, q.question]),
    ),
  );
  blocks.push('');
  blocks.push('Page engagement');
  blocks.push(
    rowsToCsv(
      ['page', 'conversations', 'messages', 'unanswered'],
      ((r.top_pages ?? []) as PageEngagementEntry[]).map((p) => [
        p.page,
        p.conversation_count,
        p.message_count,
        p.unanswered_count,
      ]),
    ),
  );
  blocks.push('');
  blocks.push('Suggested actions');
  blocks.push(
    rowsToCsv(
      ['priority', 'title', 'rationale', 'source'],
      ((r.suggested_actions ?? []) as SuggestedAction[]).map((a) => [
        a.priority ?? 'medium',
        a.title,
        a.rationale,
        a.source,
      ]),
    ),
  );

  const csv = blocks.join('\n');
  const filename = `output-insights-${id.slice(0, 8)}.csv`;
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
