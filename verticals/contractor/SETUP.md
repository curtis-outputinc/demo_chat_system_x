# Contractor vertical: setup notes

This vertical ships as its own production demo at
`contractor.output.systems` and runs against its own Supabase project
(separate from the shared demo Supabase the other verticals share).
Same pattern as the prequalifier vertical.

## What this vertical covers

Three trades, one demo brand: plumbing, HVAC, and electrical. The
brand is "Contractor Demo." Many real contractor businesses do more
than one of these, so the vertical lumps them rather than shipping
three separate demos. The behaviors file teaches the bot how to
detect which trade a question touches and how to route emergencies.

Service area is Canada and the US. No jurisdiction-specific
licensing rules are baked into the bot. All work in the brand
narrative is performed by licensed professionals.

## One-time Supabase setup

Create a dedicated Supabase project for this vertical. Suggested
name: "Contractor Demo" (or `demo-contractor`). Then apply, in
order, against the new project:

1. Base engine schema, in `supabase/migrations/`, in order:
   - `20260430000001_initial_chatbot_schema.sql`
   - `20260509000001_chatbot_v1_features.sql`
   - `20260606000001_insights_reports.sql`

2. Tenant seed:
   - `supabase/contractor/seed-tenant.sql`

   Inserts the single `contractor` tenant row. Slug MUST match the
   VERTICAL env var exactly.

The base initial migration also seeds an `output` tenant row. That
row will land in this project too and is unused. Harmless.

## Vercel env

Set in the new Vercel project that points at
`contractor.output.systems`. A complete reference template lives at
`.env.contractor.local` in the repo root. Copy each value into the
Vercel Project Settings.

Required:

- `VERTICAL=contractor`
- `SUPABASE_URL=<new Contractor project URL>`
- `SUPABASE_SERVICE_ROLE_KEY=<new project service role key>` (server-only)
- `ANTHROPIC_API_KEY=<can be shared or fresh>`

Recommended:

- `NEXT_PUBLIC_SITE_URL=https://contractor.output.systems`
- `RESEND_API_KEY=<can be shared or fresh>`

Optional:

- `RESEND_FROM_EMAIL` (default: `connect@output.systems`)
- `HANDOFF_RECIPIENT` (default: `connect@output.systems` — point at
  the contractor's email when running for a real customer)
- `CALCOM_WEBHOOK_SECRET` (only if you wire Cal.com bookings)
- `CRON_SECRET` (only if you enable cron jobs)

The Supabase values MUST point at the new contractor project, NOT
the shared demo Supabase. Mixing them would point this deploy at
the wrong database.

## Corpus

Starts empty. The bot still runs because the engine and
`behaviors.md` together give it enough framing to acknowledge
trades, flag emergencies, and route to the booking flow. To make
the demo feel real, drop markdown documents into
`verticals/contractor/corpus/` covering:

- Services offered per trade (plumbing services, HVAC services,
  electrical services)
- Service area (cities, provinces / states, response coverage)
- Hours and after-hours / emergency policy
- General pricing posture (free estimates, flat-rate vs hourly,
  diagnostic fees, etc.) — without quoting specific numbers
- Booking and scheduling process
- Licensing and insurance overview
- Common Q&A across the three trades

Files starting with `_` or `.` are ignored by the loader.

## Deploy steps (once Supabase + envs are ready)

1. Create new Vercel project `demo-contractor` in
   `curtis-outputincs-projects`.
2. Set all env vars from `.env.contractor.local` in production env.
3. `vercel link --project demo-contractor --yes` from the repo root
   (after backing up the existing `.vercel/project.json`).
4. `vercel deploy --prod --yes`.
5. Add custom domain: `vercel domains add contractor.output.systems`.
6. Alias the deployment to the custom domain explicitly.
7. Restore the original `.vercel/project.json`.

DNS: CNAME `contractor.output.systems` → `cname.vercel-dns.com` at
Hostinger (same as the other demos).
