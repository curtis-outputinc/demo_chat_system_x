-- Initial schema for the Intelligent Chatbot Systems backend.
-- Designed multi-tenant from day one so the same schema deploys for customer engagements later.

set search_path to public;

-- =============================================
-- TENANTS
-- =============================================
-- Each Output deployment (including Output Systems itself) is a tenant.
-- Customer commissions get their own tenant rows.

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  domain text,
  brand_config jsonb default '{}'::jsonb,
  voice_profile jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the Output Systems tenant.
insert into tenants (slug, name, domain)
  values ('output', 'Output Systems', 'output.systems')
  on conflict (slug) do nothing;

-- =============================================
-- CONVERSATIONS
-- =============================================
-- One row per visitor chat session. Identified by visitor_id (cookie / session token).

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  visitor_id text,
  page_context text,
  referrer text,
  user_agent text,
  ip_address inet,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  message_count integer not null default 0,
  outcome text check (outcome in ('completed', 'booked', 'escalated', 'abandoned', null)),
  metadata jsonb default '{}'::jsonb
);

create index if not exists conversations_tenant_idx on conversations(tenant_id);
create index if not exists conversations_visitor_idx on conversations(tenant_id, visitor_id);
create index if not exists conversations_started_idx on conversations(tenant_id, started_at desc);
create index if not exists conversations_outcome_idx on conversations(tenant_id, outcome);

-- =============================================
-- MESSAGES
-- =============================================
-- One row per turn in a conversation (visitor message OR chatbot reply).

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  flagged_unanswered boolean default false,
  retrieval_chunks jsonb,
  model text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages(conversation_id, created_at);
create index if not exists messages_flagged_idx on messages(conversation_id) where flagged_unanswered = true;

-- =============================================
-- LEADS
-- =============================================
-- Captured contact info + qualification.
-- Multi-channel: chatbot, form, social, ad, voicemail — unified pipeline.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  name text,
  email text,
  phone text,
  company text,
  source text not null default 'chatbot',
  qualification_result jsonb default '{}'::jsonb,
  qualification_score numeric check (qualification_score >= 0 and qualification_score <= 100),
  routing_decision text,
  status text not null default 'new' check (status in ('new', 'qualified', 'routed', 'closed', 'unqualified', 'duplicate')),
  raw_payload jsonb default '{}'::jsonb,
  enrichment jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_tenant_idx on leads(tenant_id);
create index if not exists leads_email_idx on leads(tenant_id, email);
create index if not exists leads_status_idx on leads(tenant_id, status);
create index if not exists leads_created_idx on leads(tenant_id, created_at desc);
create index if not exists leads_source_idx on leads(tenant_id, source);

-- =============================================
-- BOOKINGS
-- =============================================
-- Meetings scheduled (typically via Cal.com webhook).

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  cal_booking_id text unique,
  attendee_email text,
  attendee_name text,
  attendee_company text,
  meeting_time timestamptz,
  meeting_duration_minutes integer,
  meeting_type text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'no_show', 'canceled', 'rescheduled')),
  prep_brief jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_tenant_idx on bookings(tenant_id);
create index if not exists bookings_lead_idx on bookings(lead_id);
create index if not exists bookings_meeting_time_idx on bookings(tenant_id, meeting_time);
create index if not exists bookings_status_idx on bookings(tenant_id, status);

-- =============================================
-- HANDOFFS
-- =============================================
-- The "every call starts warm" feature.
-- When a visitor books a call after talking to the chatbot, a handoff record is generated:
--   - 1-paragraph conversation summary
--   - flagged unanswered questions
--   - topics discussed
--   - sent to the team via email so they walk into the call prepared

create table if not exists handoffs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  summary text not null,
  flagged_questions jsonb default '[]'::jsonb,
  topics jsonb default '[]'::jsonb,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative', 'mixed', null)),
  delivered_to text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists handoffs_tenant_idx on handoffs(tenant_id);
create index if not exists handoffs_conversation_idx on handoffs(conversation_id);
create index if not exists handoffs_booking_idx on handoffs(booking_id);

-- =============================================
-- CORPUS DOCUMENTS
-- =============================================
-- The chatbot's knowledge base — markdown files from docs/chatbot-context/ ingested here.
-- For Phase 1: stored as full markdown documents (passed to Anthropic prompt cache).
-- For Phase 2 (RAG): chunks + embeddings in corpus_embeddings table (scaffolded below, commented out).

create table if not exists corpus_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  path text not null,
  title text,
  content text not null,
  content_hash text,
  metadata jsonb default '{}'::jsonb,
  ingested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, path)
);

create index if not exists corpus_documents_tenant_idx on corpus_documents(tenant_id);
create index if not exists corpus_documents_updated_idx on corpus_documents(tenant_id, updated_at desc);

-- =============================================
-- CORPUS EMBEDDINGS (Phase 2 — RAG scaffold, currently unused)
-- =============================================
-- Activate when corpus exceeds prompt-cache scale (~100K tokens).
-- Requires pgvector extension. Uncomment block + run `create extension vector;` first.

-- create extension if not exists vector;
--
-- create table if not exists corpus_embeddings (
--   id uuid primary key default gen_random_uuid(),
--   document_id uuid not null references corpus_documents(id) on delete cascade,
--   chunk_index integer not null,
--   chunk_text text not null,
--   embedding vector(1024),
--   metadata jsonb default '{}'::jsonb,
--   created_at timestamptz not null default now(),
--   unique(document_id, chunk_index)
-- );
--
-- create index if not exists corpus_embeddings_document_idx on corpus_embeddings(document_id);
-- create index if not exists corpus_embeddings_vector_idx on corpus_embeddings using ivfflat (embedding vector_cosine_ops);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
-- Service role bypasses RLS (used by the chatbot backend).
-- Anonymous and authenticated roles get scoped policies.
-- Refine these when authenticated user roles get added.

alter table tenants enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table leads enable row level security;
alter table bookings enable row level security;
alter table handoffs enable row level security;
alter table corpus_documents enable row level security;

-- Default deny-all for anon — refine when public chat embed is wired.
-- (The chatbot backend uses service_role key and bypasses RLS.)

drop policy if exists deny_all_tenants_anon on tenants;
create policy deny_all_tenants_anon on tenants for all to anon using (false);

drop policy if exists deny_all_conversations_anon on conversations;
create policy deny_all_conversations_anon on conversations for all to anon using (false);

drop policy if exists deny_all_messages_anon on messages;
create policy deny_all_messages_anon on messages for all to anon using (false);

drop policy if exists deny_all_leads_anon on leads;
create policy deny_all_leads_anon on leads for all to anon using (false);

drop policy if exists deny_all_bookings_anon on bookings;
create policy deny_all_bookings_anon on bookings for all to anon using (false);

drop policy if exists deny_all_handoffs_anon on handoffs;
create policy deny_all_handoffs_anon on handoffs for all to anon using (false);

drop policy if exists deny_all_corpus_anon on corpus_documents;
create policy deny_all_corpus_anon on corpus_documents for all to anon using (false);

-- =============================================
-- updated_at TRIGGER (touches updated_at automatically on UPDATE)
-- =============================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenants_updated_at on tenants;
create trigger tenants_updated_at before update on tenants
  for each row execute function set_updated_at();

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();

drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

drop trigger if exists corpus_documents_updated_at on corpus_documents;
create trigger corpus_documents_updated_at before update on corpus_documents
  for each row execute function set_updated_at();
