# Supabase bundle for the prequalifier vertical

This directory holds the SQL bundle for the prequalifier's OWN Supabase
project (named `prequalifier`). It is not part of the shared demo Supabase
that the other verticals share, which is why it lives outside
`supabase/migrations/`.

## Apply order, against the prequalifier Supabase project

Run these three steps against the new prequalifier Supabase project, in
order, using the SQL editor in the Supabase dashboard (or the Supabase
CLI if you have it linked):

1. **Base engine schema.** Paste and run, in order, each file under
   `supabase/migrations/`:
   - `20260430000001_initial_chatbot_schema.sql`
   - `20260509000001_chatbot_v1_features.sql`
   - `20260606000001_insights_reports.sql`

   These create the universal engine tables (tenants, conversations,
   messages, leads, bookings, handoffs, corpus_documents, rate_limits,
   reports, ai_query_log) and their RLS policies. They are the same files
   every demo Supabase runs.

2. **Prequalifier-specific schema.** Paste and run:
   - `prequalifications-schema.sql`

   This adds the `prequalifications` table (first-class columns for the
   borrower-side interview output: goal, property, mortgage size,
   timeline / urgency, income shape, credit range, debts, bucket read,
   score, retention) plus RLS and triggers.

3. **Tenant seed.** Paste and run:
   - `seed-tenant.sql`

   This inserts the single `prequalifier` tenant row whose slug matches
   the `VERTICAL` env var.

## Note on the legacy 'output' tenant row

The base initial migration also seeds a row for slug `output`. That row
ends up in this project too and is unused here. Harmless, ignore it. Do
not delete it manually because re-running the migration would just put it
back. The engine filters everything by the `prequalifier` slug.

## After this is done

- Wire the new Supabase project's URL / anon key / service role key into
  the Vercel project for `prequalify.output.systems` (see
  `verticals/prequalifier/SETUP.md`).
- Confirm the chat flow can write to `conversations` / `messages`
  end-to-end before turning on the prequalification writes.

## Future migrations against this project

Add them as numbered SQL files in this directory. Apply them in order via
the Supabase SQL editor or CLI. Keep this directory the single source of
truth for the prequalifier Supabase project's schema beyond the shared
base migrations.
