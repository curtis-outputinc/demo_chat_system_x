/**
 * Conversation handoff email.
 *
 * Fires when a Cal.com booking webhook lands. Sends a structured briefing to
 * connect@output.systems so the team walks into every call already informed.
 *
 * Format locked by Curtis on 2026-05-09:
 *   Subject: New booking — [name] from [company] — [meeting time]
 *   Body: lead, meeting, stated context (verbatim quote), summary,
 *         flagged questions, talking points, pages visited, transcript link.
 */

import { Resend } from 'resend';
import { getSupabaseService, TENANT_SLUG } from './supabase';
import { generateHandoffSummary } from './handoff-summary';
import { loadVerticalConfig } from './vertical';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set.');
  resendClient = new Resend(apiKey);
  return resendClient;
}

export interface HandoffPayload {
  bookingId: string;
  conversationId: string | null;
  leadId: string | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  attendeeCompany: string | null;
  meetingTime: string | null;
  meetingTimezone?: string | null;
  meetingType?: string | null;
}

/**
 * Sends the handoff email and writes a handoffs row to Supabase.
 * Returns the handoff record id, or null if sending was skipped (no Resend key).
 */
export async function sendHandoffEmail(payload: HandoffPayload): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('handoff: RESEND_API_KEY missing, skipping email');
    return null;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'connect@output.systems';
  const toAddress = process.env.HANDOFF_RECIPIENT ?? 'connect@output.systems';
  const adminBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chat.output.systems';

  const config = await loadVerticalConfig();

  const summary = payload.conversationId
    ? await generateHandoffSummary(payload.conversationId)
    : null;

  const subject = `[${config.brandName}] ${formatSubject(payload)}`;
  const body = formatBody(payload, summary, adminBaseUrl);

  const resend = getResend();
  const result = await resend.emails.send({
    from: `${config.brandName} Assistant <${fromAddress}>`,
    to: [toAddress],
    subject,
    text: body,
  });

  if (result.error) {
    console.error('handoff send failed', result.error);
    throw new Error(`Resend failed: ${result.error.message}`);
  }

  // Persist the handoff record.
  const supabase = getSupabaseService();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();

  if (!tenant) {
    console.error('handoff: tenant not found, email sent but record not persisted');
    return null;
  }

  const { data: handoff, error: handoffError } = await supabase
    .from('handoffs')
    .insert({
      tenant_id: tenant.id,
      conversation_id: payload.conversationId,
      booking_id: payload.bookingId,
      lead_id: payload.leadId,
      summary: summary?.summary ?? '(no transcript)',
      flagged_questions: summary?.flaggedQuestions ?? [],
      topics: summary?.topics ?? [],
      sentiment: summary?.sentiment ?? null,
      delivered_to: toAddress,
      delivered_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (handoffError) {
    console.error('handoff record insert failed', handoffError);
    return null;
  }

  return handoff?.id ?? null;
}

function formatSubject(payload: HandoffPayload): string {
  const name = payload.attendeeName ?? 'unknown';
  const company = payload.attendeeCompany ? ` from ${payload.attendeeCompany}` : '';
  const time = payload.meetingTime
    ? new Date(payload.meetingTime).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: payload.meetingTimezone ?? 'America/Vancouver',
      })
    : 'time TBD';
  return `New booking, ${name}${company}, ${time}`;
}

function formatBody(
  payload: HandoffPayload,
  summary: Awaited<ReturnType<typeof generateHandoffSummary>> | null,
  adminBaseUrl: string,
): string {
  const lines: string[] = [];

  // Lead
  const leadParts: string[] = [];
  if (payload.attendeeName) leadParts.push(payload.attendeeName);
  if (payload.attendeeEmail) leadParts.push(payload.attendeeEmail);
  if (payload.attendeeCompany) leadParts.push(payload.attendeeCompany);
  lines.push(`Lead: ${leadParts.join(' · ') || '(not provided)'}`);

  // Meeting
  const meetingTime = payload.meetingTime
    ? new Date(payload.meetingTime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: payload.meetingTimezone ?? 'America/Vancouver',
      })
    : 'time TBD';
  const tz = payload.meetingTimezone ? ` (${payload.meetingTimezone})` : '';
  lines.push(`Meeting: ${meetingTime}${tz}`);
  if (payload.meetingType) lines.push(`Type: ${payload.meetingType}`);

  lines.push('');

  // Stated context (verbatim quote, if we have one)
  if (summary?.statedContext) {
    lines.push('Their stated context (in their words):');
    lines.push(`"${summary.statedContext}"`);
    lines.push('');
  }

  // Conversation summary
  if (summary?.summary) {
    lines.push('Conversation summary:');
    lines.push(summary.summary);
    lines.push('');
  } else {
    lines.push('Conversation summary: (no transcript, booked directly)');
    lines.push('');
  }

  // Flagged unanswered questions
  if (summary?.flaggedQuestions && summary.flaggedQuestions.length > 0) {
    lines.push('Flagged unanswered questions (highest priority):');
    for (const q of summary.flaggedQuestions) {
      lines.push(`- ${q}`);
    }
    lines.push('');
  }

  // Suggested talking points
  if (summary?.talkingPoints && summary.talkingPoints.length > 0) {
    lines.push('Suggested talking points for the call:');
    for (const point of summary.talkingPoints) {
      lines.push(`- ${point}`);
    }
    lines.push('');
  }

  // Pages visited
  if (summary?.pagesVisited && summary.pagesVisited.length > 0) {
    lines.push(`Pages they visited: ${summary.pagesVisited.join(', ')}`);
    lines.push('');
  }

  // Transcript link
  if (payload.conversationId) {
    lines.push(
      `Full transcript: ${adminBaseUrl}/admin/conversations/${payload.conversationId}`,
    );
  }

  return lines.join('\n');
}
