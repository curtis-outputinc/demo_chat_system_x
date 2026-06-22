/**
 * Safe SQL query primitives for the insights dashboard.
 *
 * Each function takes typed inputs, calls Supabase with parameterized queries,
 * and returns typed results. The command-bar tool layer wraps these so Claude
 * can call them without ever writing raw SQL.
 *
 * All functions accept a tenant_id and operate within that tenant's data only.
 */

import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import type { QuestionEntry, PageEngagementEntry } from './types';

export async function getTenantId(): Promise<string | null> {
  const supabase = getSupabaseService();
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();
  return data?.id ?? null;
}

// -----------------------------------------------------------------------------
// Counts and aggregates
// -----------------------------------------------------------------------------

export async function getConversationCount(
  tenantId: string,
  start: Date,
  end: Date,
  pageContextFilter?: string,
): Promise<number> {
  const supabase = getSupabaseService();
  let query = supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('started_at', start.toISOString())
    .lte('started_at', end.toISOString());
  if (pageContextFilter) {
    query = query.eq('page_context', pageContextFilter);
  }
  const { count } = await query;
  return count ?? 0;
}

export async function getMessageCount(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const supabase = getSupabaseService();
  const { count } = await supabase
    .from('messages')
    .select('id, conversations!inner(tenant_id)', { count: 'exact', head: true })
    .eq('conversations.tenant_id', tenantId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  return count ?? 0;
}

export async function getLeadCount(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const supabase = getSupabaseService();
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  return count ?? 0;
}

export async function getBookingCount(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const supabase = getSupabaseService();
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  return count ?? 0;
}

export async function getUnansweredCount(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const supabase = getSupabaseService();
  const { count } = await supabase
    .from('messages')
    .select('id, conversations!inner(tenant_id)', { count: 'exact', head: true })
    .eq('conversations.tenant_id', tenantId)
    .eq('flagged_unanswered', true)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());
  return count ?? 0;
}

export interface CountsBundle {
  conversations: number;
  messages: number;
  leads: number;
  bookings: number;
  unanswered: number;
  avg_messages_per_conversation: number;
}

export async function getCountsBundle(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<CountsBundle> {
  const [conversations, messages, leads, bookings, unanswered] = await Promise.all([
    getConversationCount(tenantId, start, end),
    getMessageCount(tenantId, start, end),
    getLeadCount(tenantId, start, end),
    getBookingCount(tenantId, start, end),
    getUnansweredCount(tenantId, start, end),
  ]);
  const avg_messages_per_conversation =
    conversations > 0 ? Number((messages / conversations).toFixed(2)) : 0;
  return { conversations, messages, leads, bookings, unanswered, avg_messages_per_conversation };
}

// -----------------------------------------------------------------------------
// Top-N lookups
// -----------------------------------------------------------------------------

/**
 * Returns top user messages by exact text match. Coarse first pass; the
 * AI-generated reports can cluster semantically similar questions afterward.
 */
export async function getTopUserQuestions(
  tenantId: string,
  start: Date,
  end: Date,
  limit: number = 10,
): Promise<QuestionEntry[]> {
  const supabase = getSupabaseService();
  const { data } = await supabase
    .from('messages')
    .select('id, content, conversation_id, conversations!inner(tenant_id)')
    .eq('conversations.tenant_id', tenantId)
    .eq('role', 'user')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .limit(2000);

  if (!data) return [];

  // Cluster by trimmed lowercase prefix to catch slight variations.
  const counts = new Map<string, QuestionEntry>();
  for (const row of data) {
    const key = (row.content as string).trim().toLowerCase().slice(0, 120);
    if (!key) continue;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        question: (row.content as string).trim().slice(0, 200),
        count: 1,
        example_message_id: row.id as string,
        example_conversation_id: row.conversation_id as string,
      });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Returns assistant turns flagged unanswered (the chatbot acknowledged it
 * could not fully answer). For each, pulls the user message that preceded it.
 */
export async function getTopUnansweredQuestions(
  tenantId: string,
  start: Date,
  end: Date,
  limit: number = 10,
): Promise<QuestionEntry[]> {
  const supabase = getSupabaseService();
  const { data } = await supabase
    .from('messages')
    .select('id, content, conversation_id, created_at, conversations!inner(tenant_id)')
    .eq('conversations.tenant_id', tenantId)
    .eq('flagged_unanswered', true)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  if (!data) return [];

  // Get the matching user-question that preceded each flagged assistant turn.
  const counts = new Map<string, QuestionEntry>();
  for (const row of data) {
    const { data: prevUserMsg } = await supabase
      .from('messages')
      .select('id, content')
      .eq('conversation_id', row.conversation_id)
      .eq('role', 'user')
      .lt('created_at', row.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const question = prevUserMsg
      ? (prevUserMsg.content as string).trim().slice(0, 200)
      : '(no preceding user message)';
    const key = question.toLowerCase().slice(0, 120);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        question,
        count: 1,
        example_message_id: prevUserMsg?.id ?? (row.id as string),
        example_conversation_id: row.conversation_id as string,
      });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getTopPagesByEngagement(
  tenantId: string,
  start: Date,
  end: Date,
  limit: number = 10,
): Promise<PageEngagementEntry[]> {
  const supabase = getSupabaseService();
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, page_context, message_count')
    .eq('tenant_id', tenantId)
    .gte('started_at', start.toISOString())
    .lte('started_at', end.toISOString());

  if (!convs) return [];

  const byPage = new Map<string, PageEngagementEntry>();
  for (const c of convs) {
    const page = (c.page_context as string | null) ?? '/';
    const existing = byPage.get(page);
    if (existing) {
      existing.conversation_count += 1;
      existing.message_count += (c.message_count as number) ?? 0;
    } else {
      byPage.set(page, {
        page,
        conversation_count: 1,
        message_count: (c.message_count as number) ?? 0,
        unanswered_count: 0,
      });
    }
  }

  // Add unanswered counts per page.
  const { data: unanswered } = await supabase
    .from('messages')
    .select('conversation_id, conversations!inner(page_context, tenant_id)')
    .eq('conversations.tenant_id', tenantId)
    .eq('flagged_unanswered', true)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (unanswered) {
    for (const row of unanswered) {
      // Access the joined row, supabase returns conversations as object or array
      const convObj = row.conversations as unknown as { page_context: string | null };
      const page = convObj?.page_context ?? '/';
      const existing = byPage.get(page);
      if (existing) existing.unanswered_count += 1;
    }
  }

  return Array.from(byPage.values())
    .sort((a, b) => b.conversation_count - a.conversation_count)
    .slice(0, limit);
}

// -----------------------------------------------------------------------------
// Funnel and time-of-day
// -----------------------------------------------------------------------------

export interface FunnelStats {
  conversations: number;
  conversations_with_lead: number;
  leads: number;
  bookings: number;
  lead_capture_rate: number;
  booking_rate: number;
}

export async function getLeadFunnel(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<FunnelStats> {
  const supabase = getSupabaseService();
  const conversations = await getConversationCount(tenantId, start, end);
  const leads = await getLeadCount(tenantId, start, end);
  const bookings = await getBookingCount(tenantId, start, end);

  const { count: conversationsWithLead } = await supabase
    .from('leads')
    .select('conversation_id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .not('conversation_id', 'is', null);

  return {
    conversations,
    conversations_with_lead: conversationsWithLead ?? 0,
    leads,
    bookings,
    lead_capture_rate: conversations > 0 ? Number(((leads / conversations) * 100).toFixed(1)) : 0,
    booking_rate: conversations > 0 ? Number(((bookings / conversations) * 100).toFixed(1)) : 0,
  };
}

export interface VolumePoint {
  date: string;
  conversations: number;
  leads: number;
  bookings: number;
}

// Daily counts for the dashboard volume line chart. Returns conversations,
// leads, and bookings per day. Messages used to be on this chart too but
// pushed the Y-axis 10x higher than the others (one conversation = many
// messages), making leads/bookings unreadable. Kept off this surface.
export async function getConversationVolumeByDay(
  tenantId: string,
  start: Date,
  end: Date,
): Promise<VolumePoint[]> {
  const supabase = getSupabaseService();
  const { data: convs } = await supabase
    .from('conversations')
    .select('started_at')
    .eq('tenant_id', tenantId)
    .gte('started_at', start.toISOString())
    .lte('started_at', end.toISOString())
    .order('started_at', { ascending: true });

  const { data: leads } = await supabase
    .from('leads')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const { data: bookings } = await supabase
    .from('bookings')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const byDay = new Map<string, VolumePoint>();
  function ensureDay(day: string): VolumePoint {
    let row = byDay.get(day);
    if (!row) {
      row = { date: day, conversations: 0, leads: 0, bookings: 0 };
      byDay.set(day, row);
    }
    return row;
  }
  for (const c of convs ?? []) {
    ensureDay((c.started_at as string).slice(0, 10)).conversations += 1;
  }
  for (const l of leads ?? []) {
    ensureDay((l.created_at as string).slice(0, 10)).leads += 1;
  }
  for (const b of bookings ?? []) {
    ensureDay((b.created_at as string).slice(0, 10)).bookings += 1;
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// -----------------------------------------------------------------------------
// Keyword search
// -----------------------------------------------------------------------------

export interface MessageHit {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export async function searchMessagesByKeyword(
  tenantId: string,
  keyword: string,
  start: Date,
  end: Date,
  limit: number = 50,
): Promise<MessageHit[]> {
  const supabase = getSupabaseService();
  const { data } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, created_at, conversations!inner(tenant_id)')
    .eq('conversations.tenant_id', tenantId)
    .ilike('content', `%${keyword}%`)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((m) => ({
    id: m.id as string,
    conversation_id: m.conversation_id as string,
    role: m.role as string,
    content: m.content as string,
    created_at: m.created_at as string,
  }));
}

// -----------------------------------------------------------------------------
// Conversation samples for AI summarization
// -----------------------------------------------------------------------------

export interface ConversationSample {
  id: string;
  started_at: string;
  page_context: string | null;
  message_count: number;
  outcome: string | null;
  messages: Array<{ role: string; content: string; flagged_unanswered: boolean | null }>;
}

export async function getConversationSamples(
  tenantId: string,
  start: Date,
  end: Date,
  maxConversations: number = 50,
  maxMessagesPerConversation: number = 20,
): Promise<ConversationSample[]> {
  const supabase = getSupabaseService();
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, started_at, page_context, message_count, outcome')
    .eq('tenant_id', tenantId)
    .gte('started_at', start.toISOString())
    .lte('started_at', end.toISOString())
    .order('message_count', { ascending: false })
    .limit(maxConversations);

  if (!convs) return [];

  const samples: ConversationSample[] = [];
  for (const c of convs) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('role, content, flagged_unanswered')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: true })
      .limit(maxMessagesPerConversation);

    samples.push({
      id: c.id as string,
      started_at: c.started_at as string,
      page_context: (c.page_context as string | null) ?? null,
      message_count: (c.message_count as number) ?? 0,
      outcome: (c.outcome as string | null) ?? null,
      messages: (msgs ?? []).map((m) => ({
        role: m.role as string,
        content: m.content as string,
        flagged_unanswered: (m.flagged_unanswered as boolean | null) ?? null,
      })),
    });
  }
  return samples;
}
