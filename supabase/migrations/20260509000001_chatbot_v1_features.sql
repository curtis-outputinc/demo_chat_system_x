-- Chatbot v1 features: rate limiting, source tagging, retention metadata.
-- Adds the tables and columns the Phase 1 chatbot needs to ship.
--
-- Apply via Supabase dashboard SQL editor or `supabase db push`.

set search_path to public;

-- =============================================
-- RATE LIMITS
-- =============================================
-- One row per /api/chat hit. Used by lib/rate-limit.ts to count requests
-- per IP in a rolling 60-minute window.
--
-- Rows older than ~2 hours are useless; pruned by the anonymize cron.

create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  endpoint text not null default '/api/chat',
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_ip_window_idx
  on rate_limits(ip, created_at desc);
create index if not exists rate_limits_created_idx
  on rate_limits(created_at);

alter table rate_limits enable row level security;

drop policy if exists deny_all_rate_limits_anon on rate_limits;
create policy deny_all_rate_limits_anon on rate_limits for all to anon using (false);

-- =============================================
-- CONVERSATIONS, source tagging
-- =============================================
-- Source identifies where the visitor came from: website (default),
-- websummit (?ref=websummit URL param), page:lead-management (visitor
-- on a specific system page), etc. Stored on the conversation row for
-- analytics queries.

alter table conversations
  add column if not exists source text default 'website';

create index if not exists conversations_source_idx on conversations(tenant_id, source);

-- =============================================
-- CONVERSATIONS, retention metadata
-- =============================================
-- anonymized_at marks when the 90-day cron stripped PII from a conversation.
-- After anonymization, visitor_id, ip_address, user_agent, and any embedded
-- PII in messages are scrubbed; conversation content stays for analytics.

alter table conversations
  add column if not exists anonymized_at timestamptz;

create index if not exists conversations_anonymized_idx
  on conversations(tenant_id, anonymized_at);

-- =============================================
-- MESSAGES, anonymization marker
-- =============================================

alter table messages
  add column if not exists anonymized_at timestamptz;

-- =============================================
-- LEADS, retention metadata
-- =============================================

alter table leads
  add column if not exists anonymized_at timestamptz;
