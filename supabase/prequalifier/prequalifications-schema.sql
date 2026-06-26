-- Prequalifications schema for the prequalifier vertical.
--
-- Applied against the prequalifier Supabase project AFTER the base engine
-- migrations in supabase/migrations/. See supabase/prequalifier/README.md
-- for the full apply order.
--
-- One row per borrower-side prequalification interview, linked to the
-- conversation it came from. The borrower never sees the score or bucket
-- read; both are written for the broker dashboard only.

set search_path to public;

-- =============================================
-- PREQUALIFICATIONS
-- =============================================

create table if not exists prequalifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,

  -- Minimal contact, captured only at the end of the interview when the
  -- visitor wants a broker callback. No last name, no email, no address,
  -- no identifiers.
  first_name text,
  phone text,

  -- Goal
  goal text check (goal in (
    'purchase_first',
    'purchase_move_up',
    'refinance',
    'renewal',
    'equity_takeout',
    'switch',
    'construction',
    'other'
  )),

  -- Property snapshot
  property_type text check (property_type in (
    'detached',
    'semi',
    'town',
    'condo_low_rise',
    'condo_high_rise',
    'multi_unit',
    'rural',
    'acreage',
    'mixed_use',
    'leasehold',
    'mobile',
    'other'
  )),
  property_occupancy text check (property_occupancy in (
    'owner_occupied',
    'second_home',
    'rental',
    'investment'
  )),
  property_value_estimate numeric,
  property_market text,
  property_country text check (property_country in ('US', 'CA', 'other')),

  -- Mortgage size
  mortgage_amount numeric,
  down_payment_amount numeric,
  down_payment_percent numeric,
  currency text check (currency in ('USD', 'CAD')),

  -- Timeline + urgency
  target_close_date date,
  renewal_date date,
  urgency text check (urgency in (
    'not_urgent',
    'within_month',
    'within_week',
    'within_days',
    'overdue'
  )),

  -- Income shape (categorical buckets, not exact figures)
  employment_type text check (employment_type in (
    'employed',
    'self_employed',
    'contract',
    'commission',
    'retired',
    'multiple',
    'other'
  )),
  years_in_role numeric,
  household_income_range text check (household_income_range in (
    'under_50k',
    '50k_100k',
    '100k_200k',
    '200k_500k',
    '500k_plus',
    'prefer_not_say',
    'unknown'
  )),

  -- Credit
  credit_range text check (credit_range in (
    'excellent',
    'good',
    'fair',
    'poor',
    'unknown',
    'prefer_not_say'
  )),

  -- Debts
  monthly_debts_estimate numeric,
  has_consumer_proposal boolean,
  has_bankruptcy boolean,

  -- Bucket read (assistant's read of which lending bucket fits, NEVER
  -- shown to the borrower)
  bucket_read text check (bucket_read in (
    'conventional',
    'alternative',
    'private',
    'too_early_to_say'
  )),
  bucket_reasoning text,

  -- Score (0-100, only set once intake_complete = true)
  score integer check (score is null or (score >= 0 and score <= 100)),
  score_breakdown jsonb default '{}'::jsonb,

  -- Flags + unusual circumstances captured during the interview
  -- e.g. ['new_to_credit', 'foreign_income', 'co_signer',
  --       'rural_property', 'private_second_in_place', 'power_of_sale']
  flags jsonb default '[]'::jsonb,
  notes text,

  -- Intake state
  intake_complete boolean not null default false,
  fields_collected jsonb default '[]'::jsonb,

  -- Handoff state
  handoff_sent_at timestamptz,
  handoff_channel text check (handoff_channel in ('email', 'sms', 'both', 'none')),
  handoff_payload jsonb default '{}'::jsonb,
  broker_notified_at timestamptz,

  -- Retention
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  anonymized_at timestamptz,
  -- delete_after is the soft deadline a retention cron honors; when reached
  -- the row is either deleted or first_name / phone are nulled out.
  delete_after timestamptz
);

-- One prequalification per conversation. Enforced so the engine cannot
-- accidentally write duplicates if the same conversation is re-processed.
create unique index if not exists prequalifications_conversation_unique
  on prequalifications(conversation_id);

create index if not exists prequalifications_tenant_idx
  on prequalifications(tenant_id);

create index if not exists prequalifications_created_idx
  on prequalifications(tenant_id, created_at desc);

-- Sort by score for the dashboard's ranked list. Partial so incomplete
-- intakes are not in the index.
create index if not exists prequalifications_score_idx
  on prequalifications(tenant_id, score desc)
  where intake_complete = true;

create index if not exists prequalifications_bucket_idx
  on prequalifications(tenant_id, bucket_read)
  where intake_complete = true;

create index if not exists prequalifications_urgency_idx
  on prequalifications(tenant_id, urgency)
  where intake_complete = true;

create index if not exists prequalifications_handoff_idx
  on prequalifications(tenant_id, handoff_sent_at)
  where handoff_sent_at is null and intake_complete = true;

create index if not exists prequalifications_delete_after_idx
  on prequalifications(delete_after)
  where delete_after is not null;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
-- Service role bypasses (used by the engine). Anon is denied.

alter table prequalifications enable row level security;

drop policy if exists deny_all_prequalifications_anon on prequalifications;
create policy deny_all_prequalifications_anon on prequalifications
  for all to anon using (false);

-- =============================================
-- updated_at TRIGGER
-- =============================================
-- Reuses the set_updated_at() function created in the base initial migration.

drop trigger if exists prequalifications_updated_at on prequalifications;
create trigger prequalifications_updated_at before update on prequalifications
  for each row execute function set_updated_at();
