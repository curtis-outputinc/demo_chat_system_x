import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily retention job. Runs as a Vercel Cron at /api/cron/anonymize.
 *
 * Add to vercel.json:
 *   {
 *     "crons": [
 *       { "path": "/api/cron/anonymize", "schedule": "0 7 * * *" }
 *     ]
 *   }
 *
 * What it does:
 *   1. Anonymizes conversations older than 90 days that haven't been anonymized yet.
 *      - clears visitor_id, ip_address, user_agent on the conversation
 *      - marks anonymized_at on the conversation row
 *      - keeps message content (for analytics) but marks anonymized_at on each message
 *   2. Anonymizes leads older than 90 days (clears name, email, phone) so they
 *      cannot be linked back to a person.
 *   3. Prunes rate_limits rows older than 2 hours (no retention reason to keep).
 *
 * Manual deletion (PIPEDA right-to-erasure) happens out-of-band via the admin UI
 * or direct SQL — this cron only handles automatic 90-day anonymization.
 *
 * Auth: protected by CRON_SECRET. Vercel Cron sets the Authorization header
 * automatically when configured with that secret. Manual triggers must include
 * the Bearer token.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseService();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const rateCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const stats = {
    conversationsAnonymized: 0,
    messagesAnonymized: 0,
    leadsAnonymized: 0,
    rateLimitsPruned: 0,
  };

  // 1. Anonymize old conversations.
  const { data: oldConversations } = await supabase
    .from('conversations')
    .select('id')
    .lt('started_at', cutoff)
    .is('anonymized_at', null)
    .limit(500);

  if (oldConversations && oldConversations.length > 0) {
    const ids = oldConversations.map((c) => c.id);

    const { error: convError } = await supabase
      .from('conversations')
      .update({
        visitor_id: null,
        ip_address: null,
        user_agent: null,
        anonymized_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (convError) {
      console.error('cron anonymize conversations failed', convError);
    } else {
      stats.conversationsAnonymized = ids.length;
    }

    // Mark messages anonymized too. Content stays for analytics (it doesn't
    // contain PII that we know of; the system prompt prevents the chatbot from
    // soliciting it).
    const { error: msgError, count: msgCount } = await supabase
      .from('messages')
      .update({ anonymized_at: new Date().toISOString() }, { count: 'exact' })
      .in('conversation_id', ids)
      .is('anonymized_at', null);

    if (msgError) {
      console.error('cron anonymize messages failed', msgError);
    } else {
      stats.messagesAnonymized = msgCount ?? 0;
    }
  }

  // 2. Anonymize old leads.
  const { data: oldLeads } = await supabase
    .from('leads')
    .select('id')
    .lt('created_at', cutoff)
    .is('anonymized_at', null)
    .limit(500);

  if (oldLeads && oldLeads.length > 0) {
    const ids = oldLeads.map((l) => l.id);
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        name: null,
        email: null,
        phone: null,
        anonymized_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (leadError) {
      console.error('cron anonymize leads failed', leadError);
    } else {
      stats.leadsAnonymized = ids.length;
    }
  }

  // 3. Prune old rate limit records (no analytic value past 2h).
  const { error: rateError, count: rateCount } = await supabase
    .from('rate_limits')
    .delete({ count: 'exact' })
    .lt('created_at', rateCutoff);

  if (rateError) {
    console.error('cron prune rate_limits failed', rateError);
  } else {
    stats.rateLimitsPruned = rateCount ?? 0;
  }

  console.info('cron anonymize complete', stats);
  return NextResponse.json({ ok: true, stats });
}
