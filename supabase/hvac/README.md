# HVAC Supabase setup

This vertical runs against its own Supabase project (separate from
the shared demo Supabase the other verticals use). Same pattern as
the prequalifier and contractor verticals.

## Apply order (against the new HVAC Supabase project)

1. Base engine schema, run each file in `supabase/migrations/` in
   order:
   - `20260430000001_initial_chatbot_schema.sql`
   - `20260509000001_chatbot_v1_features.sql`
   - `20260606000001_insights_reports.sql`

2. Tenant seed (this folder):
   - `seed-tenant.sql`

That's it. No HVAC-specific tables are needed.
