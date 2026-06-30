# Sessions

A running log of work sessions on demo_chat_system.

## 2026-06-11 — Engine scaffold (multi-vertical)

Stood up the demo_chat_system engine by adapting the proven chatbot from
`02 output-systems-website-chatbot-build` into a multi-vertical template.

- Copied the engine (Next.js 16 app, lib, supabase schema, admin, insights, embed).
- Added `lib/vertical.ts` config layer; `VERTICAL` env var selects the vertical
  and doubles as the Supabase tenant slug (`TENANT_SLUG`, renamed from
  `OUTPUT_TENANT_SLUG` across 17 files).
- Made the corpus loader vertical-aware (`verticals/<v>/corpus`).
- Split the system prompt: universal `lib/default-behaviors.ts` + per-vertical
  `behaviors.md` + active-lens instruction + corpus, composed in
  `lib/system-prompt.ts` `buildSystemPrompt(mode)`.
- Added the two-mode lens (Client side / {Trade} side) to `Chat.tsx` and threaded
  `mode` through `/api/chat`.
- Config-drove branding: Chat, page, layout metadata, lead/handoff email tags,
  filter messages.
- Stubbed `verticals/injury-lawyer/` (config, behaviors, corpus README).
- Verified: `tsc --noEmit` clean, `next build` green (11 static pages).

Open items captured in `NEEDED.md` (values/content) and `VERIFY.md` (decisions).

## 2026-06-12 to 2026-06-13 — injury-lawyer build

Built the injury-lawyer vertical end to end: a curated knowledge corpus,
injury-specific behavior rules, a config-driven split landing layout, a
per-vertical contact-flow knob, and a reusable vertical scaffold. Verified
locally (typecheck, production build, and live chat smoke tests all pass).

### Local test URL

http://localhost:3000  (start with `npm run dev`)

### Credentials added

In `.env.local`: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, VERTICAL=injury-lawyer. (Anthropic key page:
https://console.anthropic.com/settings/keys)

### Architecture clarifications (confirmed)

- Knowledge base = flat markdown files in `verticals/<v>/corpus/`, loaded onto
  the prompt on every request. No database, no embeddings, no training. Same
  locally and live. (The `corpus_embeddings` table stays commented out.)
- Runtime data (conversations, messages, leads, bookings, insights) = Supabase,
  shared multi-tenant. One database for local and live; `.env.local` already
  points at the real project.
- Live hosting = Vercel (one project per vertical; only VERTICAL and
  NEXT_PUBLIC_SITE_URL differ, the Anthropic and Supabase keys are shared). The
  corpus files deploy with the code to Vercel and run there 24/7; the local
  machine is not involved once deployed.

### Content and behavior decisions (locked)

- Jurisdiction: location-agnostic. The bot never states a specific law,
  deadline, or limitation period; it says these vary by location and the firm
  confirms.
- Hard numbers: genericized (no fee percentages, no deadline figures). The user
  will request client-side numbers later if wanted.
- Privacy: the bot says conversations are "kept private and secure," never "not
  stored," and never names where/how data is stored. Data is framed as used only
  for the firm's own analysis. Detailed privacy questions route to "contact the
  firm."
- First-turn privacy reassurance: the bot opens its first substantive answer
  with a one-line privacy reassurance, then answers in the same message.
- Sensitive info: when a visitor shares specifics, the bot advises taking those
  to a lawyer directly and never offers to forward them.
- Contact flow for injury = book-only (booking link only; no in-chat detail
  collection and no lead handoff). Other verticals keep the two-option
  (book-and-share) default.

### What was built

Corpus (`verticals/injury-lawyer/corpus/`): about-and-scope, practice-areas,
process, fees, after-an-injury, common-questions, privacy, for-firms.

Behaviors: `verticals/injury-lawyer/behaviors.md` rewritten with the
injury-specific HOW (tone, privacy reassurance, legal boundaries,
location-agnostic handling, emergency priority, two-mode emphasis, book-only).

Engine:
- `lib/vertical.ts`: added config fields contactFlow, layout, theme, heroImage,
  with safe defaults that preserve current behavior for all other verticals.
- `lib/default-behaviors.ts`: the connect flow now branches on contactFlow
  (book-and-share vs book-only).
- `app/page.tsx`: config-driven layout, centered (default) vs split.
- `app/components/Chat.tsx`: theme-aware via CSS variables. Dark verticals look
  unchanged; light renders dark text on a white panel.

Assets: `public/logo-light.png` (Output Systems black logo for the white panel);
injury config logoPath points to it.

Injury config (`verticals/injury-lawyer/config.json`): contactFlow book-only,
layout split, theme light, heroImage "" (solid black placeholder), logoPath
/logo-light.png.

Scaffold: `verticals/_template/` (config.json, behaviors.md, corpus/_README.md,
SETUP.md). Copy this folder to start a new vertical. SETUP.md is the interim
fill-in form before a future dashboard form.

### Verified

- `npm run typecheck`: clean.
- `npm run build`: success; homepage prerenders as static.
- Live chat smoke tests on localhost:3000: privacy line fires; answers are
  location-agnostic and plain prose; book-only connect points to booking with no
  request for name/email/phone. conversationId is null because the DB is not yet
  migrated (graceful degradation confirmed).

### Pending (needs the user)

1. Database: apply the three files in `supabase/migrations/` and run
   `supabase/seed-tenants.sql` in the Supabase dashboard SQL editor (or
   `supabase db push` with the DB password). Until then there is no conversation
   storage, admin dashboard, or insights. The chat itself works without it.
2. Hero image: drop a file in `public/` and set `heroImage` in the injury
   config; the left panel renders it automatically.
3. Optional blank env (only if those features are wanted): ADMIN_PASSWORD,
   CRON_SECRET, CALCOM_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL. Resend/lead-email is
   unused under book-only.
4. Source docs in `corpus_context/` (and `_extracted/`) at the repo root are not
   loaded by the engine; safe to delete after review.

### Review notes (decisions made autonomously, flag if you disagree)

- Logo on white = Output Systems black logo; the firm name "Demo Injury Law"
  also shows as a heading, so both appear.
- Accent teal kept for buttons; a darker teal is used for links/text on white
  for legibility.
- Mobile: the black left panel shows as a roughly 30%-height band placeholder
  until an image is added.
- The privacy wording is a one-line edit in `behaviors.md` under "First-turn
  privacy reassurance" if you want to tune it.

### How to run

- `npm run dev`  ->  http://localhost:3000
- `npm run build` and `npm run typecheck` for checks.

All changes from this session were left uncommitted for review before anything
lands in git.

## 2026-06-15 — Immigration vertical, mobile UI overhaul, Vercel project rebuild

### What landed (live in production)

**Injury-lawyer (https://injurylaw.output.systems) — WORKING:**
- Mobile UI overhaul: image hero (45vh) on top with dark gradient blanket;
  header overlaid on the gradient in dark styling (dark logo, white brand
  title, glassy white-bordered "Book A Free / Discovery Call" 2-line button,
  white theme toggle). Chat panel below with content top-aligned (no more
  giant white gap pushing Book An Appointment off screen).
- Desktop unchanged: sticky left-third image with diagonal clip-path
  (`polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 50%)`), chat panel right
  two-thirds, header inline in the chat panel.
- Light-mode darkening: `--fg-muted` solid `#0a0a0a` (mode blurbs, inactive
  mode-button text); `--fg-faint` 0.75 (placeholder, "thinking"); brand title
  `text-black`; theme-toggle `text-neutral-800`.
- Desktop fonts +2px via `globals.css` `@media (min-width: 768px)` overrides
  for `text-xs..text-2xl`. Admin shell unaffected (more-specific selectors).
- Mobile overflow guard: `html, body { overflow-x: hidden; max-width: 100vw }`.
- Mode buttons: removed `w-1/2` (was rendering ~25% inside `grid-cols-2`).
- Image hardening: added `sizes`, `quality=90` (registered in `next.config.ts`
  `images.qualities`), wrapped in a `relative` inner div so `fill` has a valid
  parent (the outer aside stays `sticky` for desktop scroll behavior).

**Immigration-lawyer vertical (new):**
- Full vertical added: `verticals/immigration-lawyer/{config.json,
  behaviors.md, corpus/*, immigration_lawyer_context_corpus/Doc1..Doc5.docx,
  _DEPLOY.md}`.
- 8 corpus files (about-and-scope, immigration-pathways, process, fees,
  common-questions, for-firms, privacy, after-a-refusal-or-notice) sourced
  from the 5 Doc*.docx inputs.
- Supabase tenant row appended for `immigrationlaw.output.systems`.
- `contactFlow: "book-and-share"` (Doc 2 §E29 + Doc 4 explicitly require chat
  contact collection with CASL consent — deliberate deviation from
  injury-lawyer's `book-only`).
- Reuses the injury-lawyer hero image until a dedicated one is supplied.

**`verticals/BUILDOUT_GUIDE.md`** — tight spec (40 lines) for the 4 inputs
needed to add a new vertical: Q&A bank, behavioral parameters, trade context,
privacy posture. Everything else (brand/engine/deploy) is standardized.

### The Vercel saga (resolved for injury, blocked on immigration)

The original snapshot commit `00730f89` accidentally committed all 17,698
`node_modules` files + `.vercel/` to git. Vercel was choking on the 190MB
clone — every push hung at 0ms build duration. Untracked them in commit
`b4134fa8` (repo went from 17,854 tracked files to 154), but that alone
didn't unstick the existing project's build queue.

Resolution: **deleted the original `demo-injurylaw` Vercel project and
recreated it from scratch via CLI** (`npx vercel link --yes --project
demo-injurylaw --scope curtis-outputincs-projects`). New project deploys
correctly in ~30s. Env vars copied from `.env.local` via `printf %s | vercel
env add NAME production` (6 vars: ANTHROPIC_API_KEY, SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, VERTICAL=injury-lawyer,
NEXT_PUBLIC_SITE_URL). `injurylaw.output.systems` aliased successfully.

**Immigration project — RESOLVED, also live:**

- `demo-immigrationlaw` project created and linked.
- Env vars copied (same 6, with `VERTICAL=immigration-lawyer` and
  `NEXT_PUBLIC_SITE_URL=https://immigrationlaw.output.systems`).
- Deploy succeeded (READY state).
- Alias to `immigrationlaw.output.systems` succeeded; SSL cert issued.
- DNS A record for `immigrationlaw` → `76.76.21.21` propagated in Hostinger.
- Initially blocked by Vercel Authentication (default for new projects on
  this team): production returned HTTP 401 with the SSO wall. REST API
  attempts to PATCH `ssoProtection` all returned `invalidToken` because the
  CLI auth-file token isn't accepted by the REST API.
- **Unblock:** `npx vercel project protection disable demo-immigrationlaw
  --sso` (dedicated CLI subcommand — I missed it on the first scan of
  `vercel project --help`). One command, fixed instantly.
- https://immigrationlaw.output.systems now returns HTTP 200, serves
  "Immigration Law Demo", contains the new mobile hero markup.

### What to do when picking this up

Both verticals are live with the new mobile UI:

- https://injurylaw.output.systems
- https://immigrationlaw.output.systems

**To verify on phone (Ctrl+Shift+R / pull-to-refresh):**

- https://injurylaw.output.systems on phone (Ctrl+Shift+R / pull-to-refresh).
- Should show: mobile hero image with dark header overlay, brand stacked left,
  glassy book button + theme toggle right, chat content top-aligned in white
  panel below, "Book An Appointment" visible without scrolling.

**.env.local on the next machine:**

This is gitignored and isn't in the repo. On the other laptop, copy
`C:\Projects\03 chat-output-systems\.env.local` into the project root, then
append:

```
VERTICAL=immigration-lawyer  (or injury-lawyer, depending which to dev)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The Anthropic/Supabase/Resend keys are shared multi-tenant. Only `VERTICAL`
differs per dev session.

**.vercel/ linkage:**

Currently linked to `demo-immigrationlaw`. To switch the local CLI to operate
on injury instead: `rm -rf .vercel && npx vercel link --yes --project
demo-injurylaw --scope curtis-outputincs-projects`. `.vercel/` is gitignored
so it won't travel with the repo.

### Reference: working CLI flow for setting up a new vertical's Vercel project

```bash
# 1. Link / create
rm -rf .vercel
npx vercel link --yes --project demo-<verticalname> --scope curtis-outputincs-projects

# 2. Copy 6 env vars (extract from .env.local, set VERTICAL + SITE_URL explicitly)
extract() { grep -E "^${1}=" .env.local | head -1 | sed -E "s/^${1}=//" | sed 's/^"//;s/"$//' ; }
printf '%s' "$(extract ANTHROPIC_API_KEY)" | npx vercel env add ANTHROPIC_API_KEY production
printf '%s' "$(extract SUPABASE_URL)" | npx vercel env add SUPABASE_URL production
printf '%s' "$(extract SUPABASE_SERVICE_ROLE_KEY)" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
printf '%s' "$(extract RESEND_API_KEY)" | npx vercel env add RESEND_API_KEY production
printf '%s' "<vertical-slug>" | npx vercel env add VERTICAL production
printf '%s' "https://<subdomain>.output.systems" | npx vercel env add NEXT_PUBLIC_SITE_URL production

# 3. Deploy
npx vercel --prod --yes

# 4. Alias the domain (must exist as DNS A record -> 76.76.21.21)
npx vercel alias set https://<deploy-url> <subdomain>.output.systems

# 5. Disable Vercel Authentication (otherwise production returns 401 on the
#    custom domain — default protection is on for newly-created projects).
npx vercel project protection disable demo-<verticalname> --sso
```

## 2026-06-17 — Analytics hub at insights.output.systems

Shipped a unified analytics dashboard that reads conversations / messages /
leads / bookings across every vertical from one URL, with a tenant-switcher
dropdown. The hub is its own Vercel project (`output-insights-hub`); the
existing demo projects keep their own per-vertical `/admin`.

### What landed

**Supabase**
- Applied the three migrations (`20260430..initial_chatbot_schema.sql`,
  `20260509..chatbot_v1_features.sql`, `20260606..insights_reports.sql`) plus
  `seed-tenants.sql` against the live Supabase project via a one-off
  `scripts/run-migrations.mjs` (Node pg client, reads `DIRECT_URL` from
  `.env.local`). Re-runnable. Tenants table now has rows for `injury-lawyer`,
  `immigration-lawyer`, and the legacy `output` row.
- Without this, every `/admin` page rendered the "Tenant not found" empty
  state. The page also had a hardcoded error message saying slug `'output'`
  was missing; it now interpolates the actual unresolved slug.

**Multi-tenant admin layer**
- New `lib/admin-tenant.ts` with:
  - `isMultiTenantAdmin()` — true when env `MULTI_TENANT_ADMIN=true`.
  - `listAdminTenants()` — pulls non-legacy tenants from the DB (cached).
  - `resolveAdminTenantSlug(searchParams)` — in hub mode reads `?tenant=<slug>`
    against the allowlist; falls back to first listed tenant. In single-tenant
    mode just returns the existing `TENANT_SLUG` (= `VERTICAL` env).
- All admin pages (`/admin`, `/admin/conversations`, `/admin/leads`,
  `/admin/bookings`, `/admin/reports`) now call `resolveAdminTenantSlug(sp)`
  instead of importing `TENANT_SLUG` directly. Chat-runtime code (api/chat,
  api/cal-webhook, lib/handoff-email) still uses `TENANT_SLUG` because each
  demo deploy is single-tenant for chat.
- `lib/insights/queries.ts:getTenantId()` still uses `TENANT_SLUG`. Admin
  pages bypass it (they look up the tenant id directly with the resolved slug,
  then pass `tenant.id` into each query). The chart/command/generate API
  routes still use it — they'll return data for the default tenant on the hub.
  Listed as a follow-up if per-call tenant switching is needed there.

**Tenant switcher UI**
- New client component `app/admin/components/TenantSwitcher.tsx`. Reads
  current `tenant` from URL params, writes back via `router.push` on change.
- `app/admin/layout.tsx` renders it next to the theme toggle only when
  `isMultiTenantAdmin()` is true and the tenant list is non-empty.

**Auth gate**
- `middleware.ts` now does HTTP Basic auth (`admin:$ADMIN_PASSWORD`) when:
  - `MULTI_TENANT_ADMIN=true` (the hub — gates every path, covers the bare
    `*.vercel.app` URL so the team URL is not publicly browsable).
  - The host is on the insights prefix list.
  - OR the path starts with `/admin` (the per-demo dashboards).
- If `ADMIN_PASSWORD` is unset, auth is skipped — keeps local dev frictionless.
- Per-demo deploys (`demo-injurylaw`, `demo-immigrationlaw`) had
  `ADMIN_PASSWORD` env added and were redeployed so their `/admin` is now
  also gated.

**Insights host detection**
- `lib/insights-host.ts` now matches multiple prefixes (`chat-insights`,
  `insights`) — used by middleware to rewrite bare paths into the `/admin`
  route tree on the hub.

**New Vercel project**
- `output-insights-hub`. Same engine code. Env vars:
  `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY`, `ADMIN_PASSWORD`, `MULTI_TENANT_ADMIN=true`,
  `VERTICAL=injury-lawyer` (default tenant), `NEXT_PUBLIC_SITE_URL`.
- SSO project protection disabled (`vercel project protection disable
  output-insights-hub --sso`).
- Currently reachable at `https://output-insights-26e035555-curtis-outputincs-projects.vercel.app`.
- Custom domain alias to `insights.output.systems` is **deferred until DNS
  propagates** — Curtis needs to add A record `insights -> 76.76.21.21` in
  Hostinger. Cert issuance failed twice on the alias-set during this session
  because the DNS doesn't resolve yet. Once it does, re-run:
  ```
  npx vercel alias set https://output-insights-26e035555-curtis-outputincs-projects.vercel.app insights.output.systems
  ```

### Adding a future vertical to the hub

1. Build the vertical as usual under `verticals/<slug>/` + a new `demo-<slug>`
   Vercel project + its `injurylaw.output.systems`-style subdomain.
2. Add a row in `supabase/seed-tenants.sql` and re-run it (or run a one-off
   INSERT). The new vertical appears in the hub's dropdown automatically.
3. Optional: when adding mortgage-broker etc. that aren't lawyers, don't
   forget the `disclaimer` config block doesn't apply.

### Smoke-tested 2026-06-17

| Path | Expected | Got |
|---|---|---|
| `injurylaw.output.systems/` | 200 (chat) | 200 |
| `injurylaw.output.systems/admin` no auth | 401 | 401 |
| `injurylaw.output.systems/admin` with auth | 200 | 200 |
| `immigrationlaw.output.systems/` | 200 | 200 |
| `immigrationlaw.output.systems/admin` no auth | 401 | 401 |
| `immigrationlaw.output.systems/admin` with auth | 200 | 200 |
| `output-insights-...vercel.app/` no auth | 401 | 401 |
| `output-insights-...vercel.app/` with auth | 200 | 200 |
| `.../conversations` (bare path rewrites to admin/conversations) | 200 | 200 |
| `.../leads` (same) | 200 | 200 |
| Tenant dropdown rendered | 2 `<option>` rows | injury + immigration |
| `?tenant=injury-lawyer` and `?tenant=immigration-lawyer` switch | both work | both work |

### Known limitations / follow-ups

- **DNS still pending**: `insights.output.systems` will 404 until the A record
  is added at Hostinger. Hub is reachable at the Vercel URL meanwhile.
- **API route tenant switching**: `/api/admin/insights/{chart,command,generate}`
  and the export routes still read `TENANT_SLUG` from env. On the hub they'll
  return data for the default tenant (`VERTICAL=injury-lawyer`). The
  dashboard pages themselves correctly switch via the dropdown.
- **No Google Analytics yet**: phase 2 per Curtis. The hub is the natural home
  for piping per-vertical traffic data in once we wire that up.

## 2026-06-17 — Realtor vertical scaffold

Third vertical added: `realtor` at https://realtor.output.systems. Scaffolded
with placeholder corpus in the same voice as injury/immigration; Curtis will
replace the corpus with real Q&A content next.

### What landed

**Vertical content** (`verticals/realtor/`)
- `config.json`: brandName "Realtor Demo", trade "real estate agent",
  `professional.label` "Agent side", `contactFlow: "book-and-share"`,
  `layout: "split"`, `theme: "light"`, reuses the injury hero image and the
  shared Cal.com booking URL. Disclaimer rewritten for realtor context
  ("does not create a representation agreement", compliance footer references
  jurisdiction/regulatory rules rather than legal jurisdiction).
- `behaviors.md`: adapted from injury — same first-turn privacy line, same
  two-mode pattern, but replaces legal boundaries with real-estate
  boundaries (no specific valuations, no market predictions, no commission
  percentages, no tax/mortgage/legal advice), and replaces "emergency and
  medical safety" with "urgency and timing" (offer expiry, inspection
  periods, closing dates).
- 8 placeholder corpus files (about-and-scope, services, process,
  fees-and-commissions, common-questions, for-brokerages, privacy,
  contact-hours) written as plain prose in the same voice as injury. To be
  replaced when Curtis sends the real Q&A.

**Database**
- Added a `realtor` row to `supabase/seed-tenants.sql` and re-ran
  `scripts/run-migrations.mjs`. The `tenants` table now has 4 rows:
  output (legacy, filtered from admin), injury-lawyer, immigration-lawyer,
  realtor.

**Vercel project**
- `demo-realtor` linked + 7 env vars: ANTHROPIC_API_KEY, SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ADMIN_PASSWORD,
  VERTICAL=realtor, NEXT_PUBLIC_SITE_URL=https://realtor.output.systems.
- SSO disabled. Aliased to `realtor.output.systems` (cert issued in 16s).

### Auto-pickup by insights hub

Confirmed: `insights.output.systems` dropdown now lists all three (Immigration
Law Demo, Injury Law Demo, Realtor Demo) without any hub redeploy. The hub's
`listAdminTenants()` queries the tenants table at request time, so a fresh
warm Lambda picks up the new row.

### Smoke-tested 2026-06-17

| Check | Result |
|---|---|
| realtor.output.systems homepage | 200 |
| realtor.output.systems/admin no-auth | 401 |
| realtor.output.systems/admin with auth | 200 |
| Brand "Realtor Demo" renders | yes |
| "Agent side" mode label | yes |
| Disclaimer text rendered | yes |
| Realtor option in insights hub dropdown | yes |

### Pending

- Corpus content: Curtis will send Q&A from Gemini + ChatGPT to replace the
  placeholders in `verticals/realtor/corpus/`.

## 2026-06-17 — Realtor corpus content drop (overnight build)

Replaced placeholder corpus with deduplicated Gemini + ChatGPT Q&A banks
(~300 source Q&A), added 100 supplementary Q&A, and fed the two source docs
(PDF GTA operational guide + 20-page DOCX knowledge base) as direct corpus.

### Disclaimer copy (locked per Curtis)

- Top (next to checkbox): "This AI chat agent provides general information
  only. It does not provide financial or legal advice, and using it does not
  create a realtor-client relationship."
- Footer: "AI chat systems we build for Realtors are custom-designed to comply
  with the jurisdiction the real estate agent serves in."

### Corpus file layout (`verticals/realtor/corpus/`)

| File | Source |
|---|---|
| `_README.md` | scaffold note (loader skips files starting with `_`) |
| `about-and-scope.md` | unchanged from initial scaffold |
| `buying.md` | merged Gemini buying + ChatGPT buyer sections, deduped, rewritten in realtor demo voice |
| `selling.md` | merged Gemini selling + ChatGPT seller sections |
| `mortgages-and-financing.md` | merged Gemini financing + ChatGPT mortgage sections, no specific rates |
| `listings-showings-and-property-evaluation.md` | merged Gemini listings + ChatGPT property value |
| `offers-negotiation-and-closing.md` | merged Gemini offers + ChatGPT closing |
| `condos-hoa-and-rentals.md` | condo/HOA + rental Q&A in one file |
| `investment-property.md` | investor Q&A from DOCX page 15 + new |
| `neighbourhoods-and-relocation.md` | from DOCX page 16 + relocation Q&A |
| `working-with-the-agent.md` | merged agent + chatbot service Q&A |
| `additional-considerations.md` | 100 supplementary Q&A I authored covering pre-construction, estates, divorce, accessibility, co-buying, foreign buyers, off-market, vacant land, climate risk, sustainability, smart homes |
| `regional-context-toronto-gta.md` | adapted from the PDF — TRREB, double Land Transfer Tax, NRST, Condo Act, status certificates, GTA neighbourhoods |
| `operational-guide.md` | condensed from the 20-page DOCX — operating boundaries, agency, intake, escalation, compliance, fair housing, safe response patterns |
| `contact-hours.md` | unchanged |
| `privacy.md` | unchanged |
| `for-brokerages.md` | unchanged |

Total corpus ~104 KB (~25 K tokens), within Anthropic prompt-cache scale per
CLAUDE.md guidance.

### What I deliberately did NOT include in corpus

- Specific dollar amounts and percentages from the Gemini/ChatGPT banks that
  could read as financial advice (down payment percentages, capital gains
  exemption thresholds, exact commission percentages, "20% to avoid PMI"
  style claims). Replaced with "varies", "the lawyer/lender confirms", or
  redirects to a real consultation. Matches the behaviors.md rule and the
  new disclaimer.

### Source docs in `scripts/`

- `scripts/run-migrations.mjs` — re-runnable migration + seed runner (added in
  the analytics-hub session).
- The DOCX was extracted via inline Node XML parsing (one-off); extraction
  artifact was cleaned up.

### Smoke-tested 2026-06-17 (overnight)

| Check | Result |
|---|---|
| `realtor.output.systems/` HTTP | 200 |
| `realtor.output.systems/admin` no-auth | 401 |
| `realtor.output.systems/admin` with auth | 200 |
| Brand renders "Realtor Demo" | yes |
| Placeholder "How can I help you" | yes |
| "Agent side" mode label | yes |
| Disclaimer top "realtor-client relationship" | rendered |
| Disclaimer footer "jurisdiction the real estate agent serves" | rendered |
| `/api/chat` end-to-end (live model call) | streams real GTA-aware answer |

Sample chat: asked "What is the GTA land transfer tax?" — assistant opened
with the first-turn privacy line, then correctly explained Toronto's double
land transfer tax (provincial + municipal), mentioned first-time buyer
rebates without quoting specific percentages, deferred exact amounts to the
lawyer, and asked a clarifying question about whether the buyer is in
Toronto specifically or elsewhere in the GTA. Behaviour matches the corpus
and behaviors.md rules.

### Insights hub status

`realtor` tenant row was already in Supabase from the scaffold step. Hub
dropdown at `insights.output.systems` already shows all three (Immigration
Law Demo, Injury Law Demo, Realtor Demo). No hub redeploy was needed.

### Known follow-ups

- About-and-scope.md still uses generic "brokerage" language. If Curtis wants
  to lean further into a GTA-specific positioning on the public page, that
  file is the one to edit (the rest already pulls in the regional context
  from `regional-context-toronto-gta.md`).
- behaviors.md was not modified in this drop. Worth reviewing if "no specific
  numbers" conflicts with corpus ranges in practice; the assistant currently
  errs on the side of redirecting specifics to the agent, which seems right.

## 2026-06-17 (late) — Realtor location-handling fix + Send button restyle

Two small follow-ups after the realtor went live.

**Service area: US + Canada, no single default market**

- New corpus file `verticals/realtor/corpus/service-area.md`. The brokerage
  serves the US and Canada through multiple offices; the assistant must ask
  the visitor where they are looking before answering any location-specific
  question.
- `behaviors.md` updated: added "Service area and location handling" section.
  If visitor names Toronto/GTA, use the rich `regional-context-toronto-gta.md`
  detail. If visitor names any other US or Canadian market (California,
  Seattle, Vancouver, Yellowknife, Florida, etc.), say the brokerage has
  offices that serve that area and answer in general terms. If visitor names
  a market outside the US or Canada (Mexico, UK, etc.), politely explain the
  brokerage does not serve that market and offer a referral.
- `regional-context-toronto-gta.md` now has a leading note clarifying it is
  reference material for Toronto-specific inquiries, not the default
  assumption.

**Send button dark-mode restyle** (shared engine change, redeployed to
injury, immigration, realtor)

- Dark mode `--btn` background changed from `lighten(accent, 0.4)` (pale
  teal) to `#000000` (black).
- Dark mode `--btn-fg` changed from `#ffffff` (white) to `accent` (bright
  teal).
- Dark mode `--btn-border` already `accent` (bright teal).
- Light mode untouched: black icon on pale teal bg, no border.
- Result in dark mode: black button body with a 3px teal border and a teal
  arrow icon (and "Send" text on desktop). Visible against the black panel.

## 2026-06-17 (late, before sleep) — Mortgage broker scaffold

Fourth vertical scaffolded: `mortgage-broker` at
https://mortgagebroker.output.systems. Built tonight so Curtis can drop the
real 150 Q&A in the morning.

### What landed

- **Vertical content (`verticals/mortgage-broker/`)**: config.json,
  behaviors.md, and 6 corpus scaffolding files (about-and-scope, service-area,
  privacy, contact-hours, for-brokerages, _README). The placeholder
  corpus from the original `_template`-based scaffold was overwritten.
  Brand: "Mortgage Broker Demo". Trade: "mortgage broker". Professional
  mode label: "Broker side". `contactFlow: "book-and-share"`.
  `layout: "split"`. `theme: "light"`. Reuses the injury hero image and the
  shared Cal.com link.
- **Disclaimer**: top reads "This AI chat agent provides general information
  only. It does not provide financial, legal, or tax advice, and using it
  does not create a broker-client relationship." Footer reads "AI chat
  systems we build for mortgage brokers are custom-designed to comply with
  the jurisdiction the broker is licensed to operate in."
- **behaviors.md**: full vertical-specific rules. Hard rules: never quote a
  specific rate, monthly payment, qualifying amount, approval guarantee,
  rate hold, or closing timeline; never give tax/legal/investment/insurance
  advice; never collect sensitive documents in chat. Service area: US +
  Canada via licensed brokers in multiple markets, ask first.
- **Supabase**: row `('mortgage-broker', 'Mortgage Broker Demo',
  'mortgagebroker.output.systems')` added to `seed-tenants.sql` and inserted
  via the migration script. The tenants table now has 5 rows including the
  legacy `output` row.
- **Vercel project `demo-mortgagebroker`**: linked, 7 env vars pushed
  (ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY, ADMIN_PASSWORD, VERTICAL=mortgage-broker,
  NEXT_PUBLIC_SITE_URL=https://mortgagebroker.output.systems). Deployed.
  SSO protection disabled.

### Pending — must happen in the morning

1. **DNS**: Curtis needs to add the A record at Hostinger:
   `mortgagebroker` → `76.76.21.21` (TTL 3600). Until then, the alias to
   `mortgagebroker.output.systems` fails on cert issuance.
2. **Run alias**: once DNS propagates (5-60 min), re-run from the linked
   demo-mortgagebroker folder:
   `npx vercel alias set https://demo-mortgagebroker-48hggkrb0-curtis-outputincs-projects.vercel.app mortgagebroker.output.systems`
3. **Drop in real corpus**: replace/extend the scaffolding corpus files with
   Curtis's 150 Q&A and supplementary documents, then redeploy
   (`npx vercel --prod --yes` from the linked folder).

### Smoke-tested tonight (team URL — DNS-independent)

| Check | Result |
|---|---|
| `demo-mortgagebroker-48hggkrb0-...vercel.app/` HTTP | 200 |
| `/admin` no-auth | 401 |
| `/admin` with auth | 200 |
| Brand "Mortgage Broker Demo" | rendered |
| Placeholder "How can I help you" | rendered |
| "Broker side" mode label | rendered |
| Disclaimer top "broker-client relationship" | rendered |
| Disclaimer footer "jurisdiction the broker is licensed" | rendered |

### Insights hub auto-pickup

The mortgage-broker tenant row was inserted into Supabase, so the hub
dropdown at `insights.output.systems` will list all 4 verticals on the next
request (Immigration Law Demo, Injury Law Demo, Mortgage Broker Demo, Realtor
Demo). No hub redeploy needed; the hub queries the tenants table at request
time.

## 2026-06-26 — Prequalify dashboard, behavior fix, contractor vertical

Three deliverables in a single overnight session.

### 1. Prequalify dashboard — live at prequalify-dashboard.output.systems

New standalone Next.js 16 read-only dashboard for the prequalifier
transcripts. Lives in its own repo folder: `C:/Projects/06_prequalify_dashboard/`.
Reads the prequalifier Supabase (`wttjenjvgyssbxmdtzsw`… no, that's
contractor — prequalifier is `eqkdwxqtwmgeraaoylml`). Does NOT touch the
engine.

Surface:
- `/` Conversations view: 3 KPI tiles, line chart of volume over time,
  transcript list + drill-in pane
- `/leads` Leads view: list of captured leads with name / phone / email /
  best-time, clicking a lead opens its source transcript
- Top nav switches between Conversations and Leads
- Date range picker, dark / light theme toggle
- "Ask AI" command bar (top right) with Anthropic tool-use loop: can
  summarize, list transcripts, fetch a single thread, compute top topic
  word frequencies, and render pie / bar / line charts inline on demand

Routes:
- `GET /` (static), `GET /leads` (static)
- `GET /api/data?range=<preset>` Conversations payload
- `GET /api/leads?range=<preset>` Leads payload
- `GET /api/transcript?id=<uuid>` Single thread
- `POST /api/chat` Anthropic tool-use loop

Vercel project: `prequalify-dashboard` (curtis-outputincs-projects). Custom
domain wired to `prequalify-dashboard.output.systems`. Envs in production:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
`TENANT_SLUG=prequalifier`.

Lesson learned: do NOT pre-create the Vercel project with `vercel project
add`. That sets Framework Preset = "Other" and the build serves 404. Always
`vercel deploy --prod --yes` from the folder so the CLI auto-detects
Next.js. Memory note saved.

Patched in passing: `conversations.message_count` is never written by the
chat engine's `persistTurn`, so the dashboard derives counts from the
messages table. Real engine fix is still pending in `04_demo_chat_system_x`.

### 2. Prequalify chatbot — intent detection fix (live)

Reported issue: `prequalify.output.systems` opened every reply with the
qualification batch ("where is the property, and is it primary / second /
investment") even when the visitor asked an informational question like
"can you give me info on HELOCs?".

Fix: rewrote `verticals/prequalifier/behaviors.md` to read intent BEFORE
launching the qualification flow. Two intents now formally distinguished:

- Informational: "what is X", "how does Y work", "how long does Z take",
  "info on…" — bot answers the question, optionally does a small country
  clarifier only when the answer differs by country
- Transactional: "I want to refinance", "I'm trying to get a HELOC", "can
  you help me qualify" — bot runs the full prequalification flow

Sections updated to gate on transactional intent:
- First-turn opener structure
- Jurisdiction qualification
- Product questions (HELOC / refinance / reverse mortgage / second mortgage)
- "Borrower side: how to run the prequalification"

Smoke test post-deploy: "can you give me info on Helocs?" now returns a
real HELOC explanation (revolving credit, 65 / 80 LTV caps, variable
rates) ending with "Want me to go deeper on any part of that, or were you
mostly curious how it works?" No more property-location interrogation.

### 3. Contractor vertical — scaffolded and deployed (empty corpus)

New vertical covering plumbing, HVAC, and electrical trades under one
brand. Many real contractors do more than one trade, so they're lumped
rather than three separate demos. Live at `contractor.output.systems`.

Files added:
- `verticals/contractor/config.json` — "Contractor Demo" brand, two
  modes ("Customer side" / "Contractor side"), chips covering all three
  trades
- `verticals/contractor/behaviors.md` — identity, trade detection by
  keyword (plumbing / HVAC / electrical), emergency response pattern
  (gas smell → leave + 911 + then book; sparking outlet → kill breaker;
  active flood → main shutoff), tone, hard rules (no specific pricing,
  no diagnostic-by-chat, no DIY repair steps), client + contractor
  side guidance, explicit "when the corpus is empty" instructions so
  the bot stays useful pre-corpus
- `verticals/contractor/SETUP.md` — full setup runbook
- `verticals/contractor/corpus/_README.md` — list of corpus files to
  drop in once content is ready (corpus is intentionally empty for now)
- `.env.contractor.local` — env reference template at repo root
- `supabase/contractor/seed-tenant.sql` — tenant insert
- `supabase/contractor/README.md` — apply order

Infrastructure:
- Supabase: dedicated project `contractor-chat-demo`, project ref
  `wttjenjvgyssbxmdtzsw`. Base migrations + contractor tenant seed
  applied. Tenant row verified via REST.
- Vercel: new project `demo-contractor`. All 5 envs set in production
  (VERTICAL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
  NEXT_PUBLIC_SITE_URL). Deployed at
  `demo-contractor-el32w1ffe-curtis-outputincs-projects.vercel.app` and
  aliased to `contractor.output.systems`.
- DNS: Hostinger CNAME `contractor` → `cname.vercel-dns.com`.

Live smoke test:
- `GET /` → 200
- `POST /api/chat` with "my water heater is leaking" → bot replied:
  "That's definitely something we want to look at quickly. A leaking
  water heater can range from a minor drip at a valve to something
  more serious, and it's worth knowing how bad the leak is right now.
  Is water actively pooling or flowing, or is it more of a slow drip?"
  Exactly the urgency-aware triage pattern the behaviors file defined.

Outstanding for this vertical:
- Drop the real corpus markdown into `verticals/contractor/corpus/`
  when content is ready. Files starting with `_` are ignored, so
  `_README.md` stays in place. Recommended files listed in that README.
- After corpus drops, redeploy from a folder linked to demo-contractor
  with `vercel deploy --prod --yes`.

### Local Vercel link housekeeping

The repo folder's `.vercel/project.json` was linked to demo-insurancebroker
at the start of the session. To run a contractor deploy, the .vercel
folder was renamed to `.vercel.insurancebroker_bak`. After the contractor
project was created, the folder relinked itself to demo-contractor.
Restoring the original link is left as a follow-up — `vercel link
--project demo-insurancebroker --yes` from the repo root any time, or
just rename `.vercel.insurancebroker_bak` back over `.vercel`.

### Issues encountered

- IDE save conflict on `.env.contractor.local`: Claude wrote the
  Anthropic key from the chat side while the user had the file open,
  which triggered "The content of the file is newer." in the IDE. The
  user re-pasted Supabase values into chat and Claude wrote them
  directly. Resolved.
- Vercel framework auto-detection only fires on `vercel deploy`, not
  `vercel project add`. Same lesson as the dashboard project; noted in
  the dashboard infra memory.

### Next session pickup points

1. Drop contractor corpus when content is ready, redeploy.
2. Engine fix: have `persistTurn` increment `conversations.message_count`
   so the prequalify dashboard does not have to derive it.
3. Engine fix: persist mode toggles (Client / Broker) on the conversation
   so the prequalify dashboard's transcript view can show inline mode
   markers. User asked for this but the engine does not write the field.

## 2026-06-29 — Prequalifier length tightening + prequalifier_RS (Robert Silipo demo) launch

Three deliverables in one session.

### 1. Prequalifier reply length tightened

Replies were running 4-5 sentences too often. Rewrote the length
rules in `verticals/prequalifier/behaviors.md`:

- Yes/no questions: one short sentence (or just "yes"/"no" when obvious)
- Normal questions: 2-3 sentences, the default
- Questions needing more context: up to 4 sentences, never 5+
- Calibration ("familiar" / "walk me through") now bounded by the
  new range too

Added a self-check: "would removing a sentence still let the
visitor understand the answer? If yes, remove it." Five places
referencing "2 to 5 sentences" were rewritten in one pass.

Live on prequalify.output.systems. Smoke tests:
- "do you handle reverse mortgages?" → 2-sentence yes with privacy
  line + intent-aware follow-up
- "how does a HELOC work?" → 4-sentence factual explanation with
  Canadian caps + open follow-up

### 2. prequalifier_RS vertical — Robert Silipo's demo

Robert Silipo (note the spelling: S-I-L-I-P-O, the website is
authoritative) is a real mortgage broker. He gets his own
branded demo at https://rs-mortgage-solutions.output.systems.

Setup:
- `verticals/prequalifier_RS/` started as an exact duplicate of
  `verticals/prequalifier/`. The slug is `prequalifier_RS` (with
  underscore and capital R-S, deliberate).
- `config.json` swaps in brandName "RS Mortgage Solutions" and
  siteUrl `https://rs-mortgage-solutions.output.systems`.
  Everything else (corpus, behaviors, modes, accent color) was
  carried over unchanged.
- `supabase/prequalifier_RS/seed-tenant.sql` inserts the
  `prequalifier_RS` tenant row into the existing prequalifier
  Supabase. Sharing for speed; can be split off to a dedicated
  Supabase later.
- New Vercel project `demo-prequalifier-rs` in
  curtis-outputincs-projects.
- All 5 envs set in production: VERTICAL=prequalifier_RS,
  SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (same as the existing
  prequalifier Supabase), ANTHROPIC_API_KEY (shared), and
  NEXT_PUBLIC_SITE_URL=https://rs-mortgage-solutions.output.systems.
- Hostinger CNAME for `rs-mortgage-solutions` → `cname.vercel-dns.com`
  is in place, attached to the project, SSL cert provisioned.

### 3. Robert's website context captured to corpus

All public pages of rsmortgagesolutions.ca scraped and written to
`verticals/prequalifier_RS/corpus/website_context.md`. Verbatim
text in blockquotes so the bot picks up Robert's voice without
parroting:

- Home page (with all four testimonials in full and the operational
  facts block)
- About page (hero, multi-disciplinary approach, why clients
  choose, services list, service area)
- Services overview page (9 service blurbs)
- Alternative Lending page (with the B-Lender FAQ Q+A verbatim)
- First-Time Home Buyer page
- Private Mortgages page (with private mortgage FAQ Q+A verbatim)
- Mortgage Refinance page
- Reverse Mortgages page
- Bad Credit Mortgage page
- Self-Employed Mortgages page
- Service Areas page (with the three sub-region groupings: Durham
  Core, GTA, Western GTA & Halton/Peel)
- Contact page (canonical phone, email, address, hours; agent info
  with FSRA + MA license numbers)

Two service-menu pages were not scraped (Renewals/Switch,
Construction/Land Loans) because the user did not provide those
URLs. Their short blurbs from the services overview already cover
basic questions; full pages can be added later.

Plus a new `government-and-industry-resources.md` file aggregating:
- CMHC Purchase program (full premium schedule, LTV tiers, GDS/TDS
  limits, down payment rules, $1.5M max purchase price, 30-year
  amortization eligibility, credit score floor 600)
- CMHC Government of Canada programs for homebuyers (HBP, FHSA,
  GST/HST rebate, Home Buyers' Amount overview)
- CREA REALTOR vs real estate agent (code of ethics, MLS, FINTRAC
  obligations, why mortgage agents and REALTORS work alongside)

Three canada.ca URLs (FCAC buying-home, FCAC mortgages, CRA
first-time GST/HST rebate) returned 403 from the WebFetch tool;
their substance is already covered by existing corpus files
(first-time-buyer-faqs, ontario-hst-new-housing-rebate,
cmhc-mortgage-loan-insurance, osfi-mqr-uninsured-mortgages). Noted
in the file for a future scrape pass.

### Corpus audit (requested by user)

User asked to confirm coverage of laws/regulations behind:
construction loans, self-employed mortgages, first-time home
buyers. All three are well-covered:

- Construction loans: `Knowledge Base/construction-loan-faqs.md`
  has a dedicated Category 6 on the Ontario Construction Act
  (10% statutory holdback), plus Tarion warranty, HCRA builder
  licensing, owner-builder exemption, construction lien rules.
- Self-employed: `Knowledge Base/self-employed-mortgage-faqs.md`
  + `jurisdictions/CA/cmhc-self-employed-program.md` (federal CMHC
  rules) + OSFI B-20 / MQR files.
- First-time buyers: `Knowledge Base/first-time-buyer-faqs.md`
  covers FHSA, HBP, Ontario LTT rebate, 30-year amortization.
  Plus the CA-ON jurisdiction files on land transfer tax, HST
  new housing rebate, and NRST.

Optional follow-up: no standalone `jurisdictions/CA/fhsa-*.md` or
`hbp-*.md` files exist (the topics live inside the FAQ). Could
add canonical files if desired; not blocking.

### Live smoke test (post-deploy)

`POST /api/chat` with "what are your hours?" on
rs-mortgage-solutions.output.systems →

> We're open Monday to Friday, 9:00 AM to 6:00 PM. Evenings and
> weekends are available by appointment. Want to book a time to
> chat, or is there something I can help you with right now?

Two-sentence answer with the exact hours from the contact page +
soft pivot to booking. Length rule + website context both working.

### Next session pickup points

1. Robert's site has 2 more service pages we haven't scraped
   (Renewals/Switch, Construction/Land Loans) if their URLs come
   in.
2. Try the chat-onboarder Playwright crawler for the 3 canada.ca
   URLs that 403'd the WebFetch tool.
3. User flagged a content inconsistency on Robert's site:
   "20+ years real estate investing" (home page) vs "15+ years
   land development" (services page). Both are now in the corpus
   verbatim. If user wants the bot to standardize one, the
   behavior rule belongs in behaviors.md, not the corpus.
4. Consider whether prequalifier_RS should move to its own
   dedicated Supabase project later (currently shares the
   prequalifier Supabase with the main demo). Split is a config
   + env swap once Robert wants real client transcripts isolated.

## 2026-06-29 (late) — Demos hub at demos.output.systems + mic chime trade-off

### 1. Mic chime suppression attempt (reverted)

Tried suppressing Chrome's SpeechRecognition acquire/release chime by
holding a `navigator.mediaDevices.getUserMedia({audio:true})` stream
open across the recognition session. The chime did go silent, but
Chrome's SpeechRecognition then captured no audio (held-open
MediaStream and SpeechRecognition compete for the mic input). User
tested live and reported "mic turns red but nothing is recorded."

Reverted both `app/components/Chat.tsx` and
`app/admin/components/AdminCommandBar.tsx` to the original behavior.
The chime is back, but recording works. Documented in commit.

Open question for a future pass: pre-acquire getUserMedia, register a
recognition.onstart handler that stops the held tracks once
SpeechRecognition has the mic, and re-acquire on the auto-restart
cycle. Untested.

### 2. Demos hub expanded to all 9 verticals at demos.output.systems

Hub now lists every demo, not just the three with custom domains.
`ANALYTICS_DEMOS` env var was extended to include:
- Mortgage Prequalifier Demo (prequalify.output.systems)
- RS Mortgage Solutions (rs-mortgage-solutions.output.systems)
- Contractor Demo (contractor.output.systems)
- Mortgage Broker Demo (demo-mortgagebroker.vercel.app)
- Insurance Broker Demo (demo-insurancebroker.vercel.app)
- Financial Advisor Demo (demo-financialadvisor.vercel.app)
- Injury Law Demo (demo-injurylaw.vercel.app)
- Immigration Law Demo (demo-immigrationlaw.vercel.app)
- Realtor Demo (demo-realtor-dun.vercel.app)

The six new verticals all share the demo Supabase
(iypkjckvrgfnijvfpuyy). The two prequalifier flavors share their own
dedicated Supabase (eqkdwxqtwmgeraaoylml). Contractor has its own
(wttjenjvgyssbxmdtzsw).

### 3. Per-tile QR code page

Each tile in Demos mode now has two buttons:

- "Open chat" - opens demo.siteUrl in a new tab
- "QR code" - navigates to /qr/[demoId]

The new `/qr/[demoId]` route renders a large QR code that anyone can
scan to open the demo on their phone. Uses the `qrcode` npm package
to render SVG client-side (no third-party API dependency).

Bottom of the QR page has an "Open demo" button and a "Back to demos"
link.

### 4. Engine redeploy

The mic revert was redeployed to all 9 demo Vercel projects so every
live demo records audio again. Custom-domain aliases re-pointed.

### Live state

- demos.output.systems = hub
- demo-analytics.output.systems = aliased to the same project, still works
- All 9 demos recording audio (with Chrome chime back)
- QR code page reachable at /qr/<demoId> for each of the 9 demos

## 2026-06-30 — Voice input hidden across all 9 demos

The user repeatedly asked for "bell only on button press, never on
silence pause" on mobile. Several iterations attempted to deliver
this:

1. Original Web Speech API + onend auto-restart: bell on every
   silence pause (worst).
2. Removed the auto-restart: bell at start and at natural end. Still
   not "only on button press" because the natural-end bell fires on
   silence, not user action.
3. getUserMedia trick to hold the mic open: silenced the chime but
   broke recording (held-open MediaStream starved SpeechRecognition).
4. Rewrote to MediaRecorder + OpenAI Whisper: would have delivered
   exactly the user's spec (zero browser-played bells on any path)
   but requires an OpenAI API key the user explicitly declined.

The honest summary the user got: on mobile Chrome, the Web Speech
API has a hard-coded acquire/release tone that fires every time
Chrome ends the session, and Chrome ends the session on each
prolonged silence even with `continuous=true`. The only way to
deliver "no bells on silence" on mobile is to abandon SpeechRecognition
and use server-side STT (Whisper, Groq, Cloudflare AI, etc.). The
user is not paying for that vendor for now.

Decision: hide the mic button across all 9 demos until a clean
approach is funded. `app/components/Chat.tsx` and
`app/admin/components/AdminCommandBar.tsx` now force
`setSpeechSupported(false)` in their feature-detection useEffect.
All other voice code (MediaRecorder, getUserMedia, /api/transcribe
route) is intentionally left in place so re-enabling is a one-line
revert of the setSpeechSupported call.

Redeployed to all 9 demo Vercel projects. The chat input still
works for keyboard typing on every demo; the mic icon is gone.

### Re-enabling later

To restore voice input with the silent MediaRecorder + server STT
approach:
1. Set `OPENAI_API_KEY` (or Groq / Cloudflare equivalent) on every
   demo Vercel project.
2. Optionally swap the upstream URL in `/api/transcribe/route.ts` if
   not using OpenAI.
3. Revert the `setSpeechSupported(false)` line in both Chat.tsx and
   AdminCommandBar.tsx back to the feature-detection logic that's
   commented above the override.

To restore the Web Speech API approach (accepting the mobile bell):
1. Revert the `setSpeechSupported(false)` line.
2. Replace the MediaRecorder-based toggleMic with the prior
   SpeechRecognition implementation (search git history for the
   `recognitionRef` removal commit).

