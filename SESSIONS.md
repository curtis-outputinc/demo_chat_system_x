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

