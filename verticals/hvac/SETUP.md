# HVAC vertical: setup notes

This vertical ships as its own production demo at
`hvac.output.systems` and runs against its own Supabase project
(separate from the shared demo Supabase the other verticals share).
Same pattern as the prequalifier and contractor verticals.

## What this vertical covers

Heating, cooling, and ventilation only. Deliberately narrower than
the multi-trade `contractor` vertical (plumbing + HVAC + electrical),
which stays in place for prospects who run all three trades. This
one is for shops that focus on HVAC.

Service area is Canada and the US. No jurisdiction-specific
licensing rules are baked into the bot. All work in the brand
narrative is performed by licensed HVAC technicians.

## One-time Supabase setup

Create a dedicated Supabase project for this vertical. Suggested
name: "HVAC Demo" (or `hvac-chat-demo`). Then apply, in order,
against the new project:

1. Base engine schema, in `supabase/migrations/`, in order:
   - `20260430000001_initial_chatbot_schema.sql`
   - `20260509000001_chatbot_v1_features.sql`
   - `20260606000001_insights_reports.sql`

2. Tenant seed:
   - `supabase/hvac/seed-tenant.sql`

   Inserts the `hvac` tenant row. Slug MUST match the VERTICAL env
   var exactly.

The base initial migration also seeds an `output` tenant row. That
row will land in this project too and is unused. Harmless.

## Vercel env

Set in the new Vercel project that points at `hvac.output.systems`.
A complete reference template lives at `.env.hvac.local` in the
repo root. Copy each value into the Vercel Project Settings.

Required:

- `VERTICAL=hvac`
- `SUPABASE_URL=<new HVAC project URL>`
- `SUPABASE_SERVICE_ROLE_KEY=<new project service role key>` (server-only)
- `ANTHROPIC_API_KEY=<shared with other demos>`

Recommended:

- `NEXT_PUBLIC_SITE_URL=https://hvac.output.systems`
- `RESEND_API_KEY=<shared or fresh>`

Optional:

- `RESEND_FROM_EMAIL` (default: `connect@output.systems`)
- `HANDOFF_RECIPIENT` (default: `connect@output.systems`; point at
  the shop's inbox when running for a real customer)
- `CALCOM_WEBHOOK_SECRET` (only if you wire Cal.com bookings)
- `CRON_SECRET` (only if you enable cron jobs)

The Supabase values MUST point at the new HVAC project, NOT the
shared demo Supabase. Mixing them would point this deploy at the
wrong database.

## Corpus

Starts empty. The bot still runs because the engine and
`behaviors.md` together give it enough framing to acknowledge the
trade, flag emergencies (gas smell, CO alarm, no-heat in cold,
etc.), and route to the booking flow. To make the demo feel real,
drop markdown documents into `verticals/hvac/corpus/` covering:

- Services (heating, cooling, ventilation, indoor air quality,
  controls, maintenance plans)
- Service area (cities, provinces / states)
- Hours and after-hours / emergency policy
- General pricing posture (free estimates, diagnostic fee policy,
  service call minimums) - without quoting specific numbers
- Rebates and financing (federal / provincial / state / utility
  incentives you commonly help clients access)
- Booking and scheduling process
- Licensing and insurance overview
- Common Q&A (repair vs replace, sizing basics, filter cadence,
  heat pump questions, etc.)

Files starting with `_` or `.` are ignored by the loader.

## Deploy steps (once Supabase + envs are ready)

1. Create Vercel project `demo-hvac` in `curtis-outputincs-projects`.
2. Set all env vars from `.env.hvac.local` in the production
   environment.
3. Add Hostinger CNAME `hvac` -> `cname.vercel-dns.com`.
4. `vercel deploy --prod --yes` from a folder linked to
   `demo-hvac`. Framework auto-detects.
5. Add custom domain: `vercel domains add hvac.output.systems`.
6. Alias the deployment to the custom domain explicitly.
