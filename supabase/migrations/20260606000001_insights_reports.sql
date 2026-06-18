-- =============================================
-- Insights and reports schema for the admin dashboard
-- =============================================
-- Adds two new objects:
--   reports        : AI-generated insight reports (weekly, monthly, on-demand, ad-hoc)
--   ai_query_log   : audit log of natural-language commands run from the dashboard
--
-- Existing tables used unchanged:
--   conversations, messages, leads, bookings, handoffs, tenants

-- =============================================
-- REPORTS
-- =============================================
-- One row per generated insight report. Generation is asynchronous, kicked off
-- by the dashboard's "Generate Insights" button or by the scheduled weekly cron.
-- Status moves pending -> running -> complete | failed. Sections are JSONB so the
-- report viewer can render any shape without schema migrations as we evolve the
-- template.

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null default 'on_demand' check (type in ('weekly','monthly','on_demand','ad_hoc_query')),
  label text,
  range_start timestamptz not null,
  range_end timestamptz not null,
  status text not null default 'pending' check (status in ('pending','running','complete','failed')),
  -- Aggregates filled in before the AI pass for reproducibility.
  conversation_count integer default 0,
  message_count integer default 0,
  lead_count integer default 0,
  booking_count integer default 0,
  unanswered_count integer default 0,
  avg_messages_per_conversation numeric,
  -- AI-produced narrative and structured sections.
  summary text,
  top_questions jsonb default '[]'::jsonb,
  top_unanswered jsonb default '[]'::jsonb,
  top_pages jsonb default '[]'::jsonb,
  suggested_actions jsonb default '[]'::jsonb,
  sentiment text,
  raw_response text,
  -- Lifecycle metadata.
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_tenant_idx on reports(tenant_id);
create index if not exists reports_status_idx on reports(tenant_id, status);
create index if not exists reports_range_idx on reports(tenant_id, range_start desc, range_end desc);
create index if not exists reports_type_idx on reports(tenant_id, type);
create index if not exists reports_created_idx on reports(tenant_id, created_at desc);

-- =============================================
-- AI QUERY LOG
-- =============================================
-- Each natural-language command run from the admin dashboard's command bar gets
-- a row here. Includes the parsed intent, the tools called, and the response.
-- Lets us see what the operator asked for and improve the intent classifier over
-- time.

create table if not exists ai_query_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  raw_input text not null,
  intent text,
  parsed_params jsonb default '{}'::jsonb,
  tools_called jsonb default '[]'::jsonb,
  response_summary text,
  response_data jsonb default '{}'::jsonb,
  result_count integer,
  duration_ms integer,
  status text default 'complete' check (status in ('complete','failed','unclear')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_query_log_tenant_idx on ai_query_log(tenant_id);
create index if not exists ai_query_log_created_idx on ai_query_log(tenant_id, created_at desc);
create index if not exists ai_query_log_intent_idx on ai_query_log(tenant_id, intent);

-- =============================================
-- RLS
-- =============================================
alter table reports enable row level security;
alter table ai_query_log enable row level security;

drop policy if exists deny_all_reports_anon on reports;
create policy deny_all_reports_anon on reports for all to anon using (false);

drop policy if exists deny_all_ai_query_log_anon on ai_query_log;
create policy deny_all_ai_query_log_anon on ai_query_log for all to anon using (false);

-- =============================================
-- Triggers
-- =============================================
drop trigger if exists reports_updated_at on reports;
create trigger reports_updated_at before update on reports
  for each row execute function set_updated_at();
