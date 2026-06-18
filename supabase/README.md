# Supabase, output.systems

Database schema and migrations for the Intelligent Chatbot Systems backend.

## Project

- **Project name:** `output.systems`
- **Project ref:** `avydyhvjgowihirxzybb`
- **Region:** `aws-1-us-west-2`
- **Connection details:** in `.env.local` (gitignored)

## Schema overview

| Table | Purpose |
|---|---|
| `tenants` | Multi-tenant root. Output Systems is one tenant; customer deployments add more rows. |
| `conversations` | One row per chatbot session (visitor + page context + outcome). |
| `messages` | Individual turns within a conversation (user / assistant / system). |
| `leads` | Captured contact info + qualification result + routing decision. Unified pipeline across capture surfaces. |
| `bookings` | Meetings scheduled (Cal.com webhook). Includes prep brief. |
| `handoffs` | The "every call starts warm" feature, summary + flagged questions delivered to the team when a visitor books. |
| `corpus_documents` | Markdown files from `docs/chatbot-context/` ingested for chatbot retrieval. |
| `corpus_embeddings` | (Phase 2 / RAG, scaffolded but commented out) pgvector embeddings for retrieval beyond prompt-cache scale. |

Multi-tenant by `tenant_id` on every table. RLS enabled with default deny-all for `anon`; the chatbot backend uses the `service_role` key and bypasses RLS.

## Applying the migration

The migration file is `migrations/20260430000001_initial_chatbot_schema.sql`. Two ways to apply it:

### Option A, Supabase dashboard SQL editor (no CLI needed)

1. Go to the [Supabase dashboard](https://supabase.com/dashboard) → output.systems project
2. Open **SQL Editor** in the left nav
3. Click **New query**
4. Paste the entire contents of `migrations/20260430000001_initial_chatbot_schema.sql`
5. Click **Run**

You should see "Success. No rows returned" and the tables appear under **Database → Tables**.

### Option B, Supabase CLI

```bash
# One-time install
npm install -g supabase

# One-time link to the project (paste your project ref when prompted)
supabase link --project-ref avydyhvjgowihirxzybb

# Apply migrations
supabase db push
```

The CLI is more useful as we add migrations over time; the dashboard is fine for this first run.

## What gets added next

Future migrations (each as its own file in `migrations/` with a timestamp prefix):

- **Authenticated user roles**, when the team needs login access to view conversations and handoffs
- **RLS policy refinement**, once authenticated roles exist, scope visibility per tenant
- **pgvector extension + RAG embeddings**, when the corpus exceeds prompt-cache scale (~100K tokens)
- **Tenant-specific brand and voice config**, when we deploy for customer commissions

## Required env vars

In `.env.local`:

```
DATABASE_URL=postgresql://postgres.avydyhvjgowihirxzybb:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.avydyhvjgowihirxzybb:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://avydyhvjgowihirxzybb.supabase.co
SUPABASE_ANON_KEY=[from Supabase dashboard → Project Settings → API]
SUPABASE_SERVICE_ROLE_KEY=[from Supabase dashboard → Project Settings → API, server-only, never expose]
```

The chatbot backend uses `SUPABASE_SERVICE_ROLE_KEY` for full data access; the embed widget never sees this key.
