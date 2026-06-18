/**
 * Insight report generation pipeline.
 *
 * Takes a date range and a tenant, pulls the conversation samples and aggregate
 * counts, sends them to Claude Sonnet with a locked-template prompt, parses the
 * structured JSON response, and writes the resulting sections back to the
 * report row in Supabase.
 */

import { getSupabaseService } from '@/lib/supabase';
import { getAnthropic, REPORT_MODEL, parseClaudeJSON, extractText } from '@/lib/anthropic';
import {
  getCountsBundle,
  getTopUserQuestions,
  getTopUnansweredQuestions,
  getTopPagesByEngagement,
  getConversationSamples,
} from './queries';
import type { ReportSections, QuestionEntry, PageEngagementEntry, SuggestedAction } from './types';

const REPORT_SYSTEM_PROMPT = `You are an analyst generating an insight report for Output Systems, a company that builds Intelligent Interaction Systems for small and mid-sized businesses. Your job is to look at a window of chatbot conversations on output.systems and produce a structured insight report.

Be sharp, specific, and honest. Do not pad. If the data is thin, say so. The report goes to Curtis Grier-Coward (founder) so he can make decisions about the website, the chatbot's knowledge base, and the business.

Output JSON in exactly this shape. No prose, no markdown. JSON only.

{
  "summary": "2-4 sentence narrative summary of the period. Plain language.",
  "top_questions": [
    { "question": "The most common question, as the visitor phrased it", "count": 7 }
  ],
  "top_unanswered": [
    { "question": "A question the chatbot could not fully answer", "count": 3 }
  ],
  "top_pages": [
    { "page": "/pricing", "conversation_count": 12, "message_count": 80, "unanswered_count": 4 }
  ],
  "suggested_actions": [
    {
      "title": "Add team-size pricing examples to /pricing",
      "rationale": "Five visitors asked about team-size pricing this week and the chatbot deflected each time.",
      "source": "Top unanswered: 'pricing for team of 5'",
      "priority": "high"
    }
  ],
  "sentiment": "neutral | mostly_positive | mixed | concerned | one-line nuance"
}

Rules:
- Top questions: cluster semantically similar phrasings into one entry. Use the most representative phrasing.
- Top unanswered: do the same. These are the highest-value items because they reveal knowledge gaps.
- Page engagement: include up to the top 5 pages.
- Suggested actions: 3 to 6 actions. Each must reference a specific signal from the data (a question, an unanswered cluster, a page issue). Priority levels: high, medium, low.
- Sentiment: one short string. If there's nothing to read into, say "insufficient_data".
- Do not invent. If a category has nothing, return an empty array for that field.`;

interface ReportInputs {
  tenantId: string;
  rangeStart: Date;
  rangeEnd: Date;
  rangeLabel: string;
}

export async function generateReport(reportId: string, inputs: ReportInputs): Promise<void> {
  const supabase = getSupabaseService();

  await supabase
    .from('reports')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', reportId);

  try {
    // 1. Gather aggregates and samples.
    const [counts, topQuestions, topUnanswered, topPages, samples] = await Promise.all([
      getCountsBundle(inputs.tenantId, inputs.rangeStart, inputs.rangeEnd),
      getTopUserQuestions(inputs.tenantId, inputs.rangeStart, inputs.rangeEnd, 20),
      getTopUnansweredQuestions(inputs.tenantId, inputs.rangeStart, inputs.rangeEnd, 20),
      getTopPagesByEngagement(inputs.tenantId, inputs.rangeStart, inputs.rangeEnd, 10),
      getConversationSamples(inputs.tenantId, inputs.rangeStart, inputs.rangeEnd, 40, 16),
    ]);

    // 2. Stash counts before the AI pass so they're saved even if AI fails.
    await supabase
      .from('reports')
      .update({
        conversation_count: counts.conversations,
        message_count: counts.messages,
        lead_count: counts.leads,
        booking_count: counts.bookings,
        unanswered_count: counts.unanswered,
        avg_messages_per_conversation: counts.avg_messages_per_conversation,
      })
      .eq('id', reportId);

    // 3. Format input for Claude.
    const inputBlock = formatInputBlock(
      inputs.rangeStart,
      inputs.rangeEnd,
      inputs.rangeLabel,
      counts,
      topQuestions,
      topUnanswered,
      topPages,
      samples,
    );

    // 4. Call Sonnet.
    const anthropic = getAnthropic();
    const result = await anthropic.messages.create({
      model: REPORT_MODEL,
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: REPORT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: inputBlock,
        },
      ],
    });

    const text = extractText(result);
    let sections: ReportSections;
    try {
      sections = parseClaudeJSON<ReportSections>(text);
    } catch (err) {
      console.error('report-generator: failed to parse Claude JSON', err);
      // Fall back to a minimal sections object with whatever we computed.
      sections = {
        summary: `Could not parse the AI summary for this period. The raw counts are available above. Error: ${err instanceof Error ? err.message : 'unknown'}`,
        top_questions: topQuestions,
        top_unanswered: topUnanswered,
        top_pages: topPages,
        suggested_actions: [],
        sentiment: null,
      };
    }

    // 5. Save the sections.
    await supabase
      .from('reports')
      .update({
        status: 'complete',
        finished_at: new Date().toISOString(),
        summary: sections.summary ?? null,
        top_questions: sections.top_questions ?? [],
        top_unanswered: sections.top_unanswered ?? [],
        top_pages: sections.top_pages ?? topPages,
        suggested_actions: sections.suggested_actions ?? [],
        sentiment: sections.sentiment ?? null,
        raw_response: text,
      })
      .eq('id', reportId);
  } catch (error) {
    console.error('report-generator: failed', error);
    await supabase
      .from('reports')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'unknown error',
      })
      .eq('id', reportId);
  }
}

function formatInputBlock(
  start: Date,
  end: Date,
  label: string,
  counts: Awaited<ReturnType<typeof getCountsBundle>>,
  topQuestions: QuestionEntry[],
  topUnanswered: QuestionEntry[],
  topPages: PageEngagementEntry[],
  samples: Awaited<ReturnType<typeof getConversationSamples>>,
): string {
  const lines: string[] = [];
  lines.push(`Period: ${label}`);
  lines.push(`Range: ${start.toISOString()} to ${end.toISOString()}`);
  lines.push('');
  lines.push('=== Aggregate counts ===');
  lines.push(`Conversations: ${counts.conversations}`);
  lines.push(`Messages: ${counts.messages}`);
  lines.push(`Leads captured: ${counts.leads}`);
  lines.push(`Bookings: ${counts.bookings}`);
  lines.push(`Unanswered flagged: ${counts.unanswered}`);
  lines.push(`Average messages per conversation: ${counts.avg_messages_per_conversation}`);
  lines.push('');

  lines.push('=== Top user questions (coarse string clustering, raw signal) ===');
  if (topQuestions.length === 0) {
    lines.push('(no user questions in period)');
  } else {
    for (const q of topQuestions.slice(0, 20)) {
      lines.push(`[${q.count}x] ${q.question}`);
    }
  }
  lines.push('');

  lines.push('=== Top flagged-unanswered questions (preceding user message) ===');
  if (topUnanswered.length === 0) {
    lines.push('(no flagged unanswered messages in period)');
  } else {
    for (const q of topUnanswered.slice(0, 20)) {
      lines.push(`[${q.count}x] ${q.question}`);
    }
  }
  lines.push('');

  lines.push('=== Page engagement (top by conversation_count) ===');
  if (topPages.length === 0) {
    lines.push('(no page context recorded in period)');
  } else {
    for (const p of topPages.slice(0, 10)) {
      lines.push(
        `${p.page}: ${p.conversation_count} conversations, ${p.message_count} messages, ${p.unanswered_count} unanswered`,
      );
    }
  }
  lines.push('');

  lines.push('=== Conversation samples (highest message_count first, up to 40) ===');
  if (samples.length === 0) {
    lines.push('(no conversations in period)');
  } else {
    for (const c of samples.slice(0, 40)) {
      lines.push(
        `--- Conversation ${c.id} (page=${c.page_context ?? '/'}, msgs=${c.message_count}, outcome=${c.outcome ?? 'in flight'}) ---`,
      );
      for (const m of c.messages) {
        const tag = m.role === 'user' ? 'U' : 'A';
        const flag = m.flagged_unanswered ? ' [unanswered]' : '';
        const content = m.content.replace(/\s+/g, ' ').slice(0, 240);
        lines.push(`${tag}${flag}: ${content}`);
      }
      lines.push('');
    }
  }

  lines.push('Now produce the JSON report.');
  return lines.join('\n');
}
