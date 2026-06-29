# prequalifier_RS Supabase setup

Robert Salippo's demo. Currently SHARES the existing prequalifier
Supabase project (`eqkdwxqtwmgeraaoylml`) for speed. Transcripts are
isolated by tenant_id (slug `prequalifier_RS`).

To move it to a dedicated Supabase project later: create a new project,
apply the base migrations from `supabase/migrations/`, apply
`prequalifier/prequalifications-schema.sql`, then this folder's
`seed-tenant.sql`. Update the Vercel envs to point at the new project.

## Apply order (against the prequalifier Supabase project, today)

1. This folder's `seed-tenant.sql` (already applied via REST during the
   first deploy).

That's it. No additional schema needed because the prequalifier
project already has everything the engine needs.
