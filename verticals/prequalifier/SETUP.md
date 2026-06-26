# Prequalifier vertical: setup notes

This vertical is structurally a sibling of `mortgage-broker/`, but it ships as
its OWN production demo at `prequalify.output.systems` and runs against its
OWN Supabase project (separate from the shared demo Supabase the other
verticals share). It is the first vertical here that is also intended to be
duplicated onto real broker websites, so its data plane is isolated by design.

## What is different from a normal vertical

1. Separate Supabase project. Create a fresh Supabase project for the
   prequalifier. Do NOT use the shared demo Supabase. This vertical's tenant
   row, conversations, leads, and (later) prequalification records all live
   in the separate project.
2. Do not add this vertical to `supabase/seed-tenants.sql`. That file only
   seeds the shared demo Supabase. The prequalifier's tenant row is seeded
   directly against its own Supabase project (snippet below).
3. Separate Vercel project, with its own Supabase env vars pointing at the
   new Supabase project (snippet below).

## One-time Supabase setup (against the new project)

The full bundle lives in `supabase/prequalifier/`. Apply against the new
prequalifier Supabase project, in order:

1. Base engine schema. Run, in order, each file under `supabase/migrations/`:
   - `20260430000001_initial_chatbot_schema.sql`
   - `20260509000001_chatbot_v1_features.sql`
   - `20260606000001_insights_reports.sql`

2. Prequalifier-specific schema. Run:
   - `supabase/prequalifier/prequalifications-schema.sql`

   This adds the `prequalifications` table with first-class columns for the
   borrower-side interview output (goal, property, mortgage size, timeline
   and urgency, income shape, credit range, debts, bucket read, score,
   retention), plus its RLS policy and updated_at trigger.

3. Tenant seed. Run:
   - `supabase/prequalifier/seed-tenant.sql`

   Inserts the single `prequalifier` tenant row. Slug MUST match the
   VERTICAL env var exactly.

Note: the base initial migration also seeds an `output` tenant row. That row
will land in this project too and is unused here. Harmless, ignore it. Do
not delete it manually since re-running the base migration would just put it
back. The engine filters everything by the `prequalifier` slug.

## Vercel env (one project per vertical)

Set in the new Vercel project that points at `prequalify.output.systems`.
A complete reference template lives at `.env.prequalifier.local` in the
repo root — copy each value into the Vercel Project Settings.

Required:

- `VERTICAL=prequalifier`
- `SUPABASE_URL=<new prequalifier project URL>`
- `SUPABASE_SERVICE_ROLE_KEY=<new project service role key>` (server-only)
- `ANTHROPIC_API_KEY=<can be shared or fresh>`

Recommended:

- `NEXT_PUBLIC_SITE_URL=https://prequalify.output.systems`
- `RESEND_API_KEY=<can be shared or fresh>`

Optional (sensible defaults exist):

- `RESEND_FROM_EMAIL` (default: `connect@output.systems`)
- `HANDOFF_RECIPIENT` (default: `connect@output.systems` — point at the
  broker's address for the prequalifier)
- `CALCOM_WEBHOOK_SECRET` (only if you wire up Cal.com)
- `CRON_SECRET` (only if you enable cron jobs)

The Supabase values MUST point at the new prequalifier project, NOT the
shared demo Supabase. Mixing them would point the prequalifier deploy at
the wrong database.

Note: the engine uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
directly (server-only). The browser does not talk to Supabase, so there
is no `NEXT_PUBLIC_SUPABASE_*` to set.

## Deferred engine work (not in this scaffold)

The vertical files (config.json, behaviors.md, corpus/) make the prequalifier
run a real structured interview in chat from day 1. The pieces still to
build at the engine level, in their own change-sets:

- Intake-state tracking server-side, so we know which interview fields have
  been captured and which are still open.
- Richer lead schema (borrower scenario, lender bucket A/B/private, property
  snapshot, income shape, credit range, debts, urgency, computed score).
- Scoring module that runs at handoff and produces the broker synopsis.
- Email/SMS handoff to the broker with the synopsis (Resend already in
  stack; SMS is new).
- "Prequalifications" view on the admin dashboard: list, score, payload
  detail, contact action.
- PII retention job: keep first name + phone only, scheduled deletion after
  a window the brokerage controls.

Decide the lead-schema shape before wiring the dashboard view; everything
else hangs off it.
