# Immigration Lawyer Demo — deploy handoff

This file is the morning handoff for the immigration-lawyer vertical. It's
prefixed with `_` so it sits next to the live folders without affecting the
engine.

## Local URL (right now)

A dev server was started against `VERTICAL=immigration-lawyer` and confirmed
serving "Immigration Law Demo" at:

    http://localhost:3000

If the process is no longer running when you open this, restart it from the
repo root with:

    VERTICAL=immigration-lawyer npm run dev

Then open http://localhost:3000 and switch between Client side and Lawyer
side to spot-check both lenses.

For the chat replies to actually work (not just the UI), the usual
`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
`RESEND_API_KEY` env vars need to be set in `.env.local` the same way they
are for injury-lawyer.

## What was built (parity with injury-lawyer)

- `verticals/immigration-lawyer/config.json` — brand, modes, links. Reuses
  the injury-lawyer hero image at `/images/injury-lawyer/lawyer-handshake.jpg`
  until a dedicated image is supplied; `heroImage` is the only field to swap
  when the new image lands.
- `verticals/immigration-lawyer/behaviors.md` — full behavioral rules adapted
  from Doc 2, mirroring the injury-lawyer section structure.
- `verticals/immigration-lawyer/corpus/` — eight markdown files:
  about-and-scope, immigration-pathways, process, fees, common-questions,
  for-firms, privacy, after-a-refusal-or-notice.
- `supabase/seed-tenants.sql` — added the `immigration-lawyer` tenant row
  with domain `immigrationlaw.output.systems`. Run the new insert against the
  Supabase project after the next migration apply.
- The original five `.docx` context documents are preserved in
  `immigration_lawyer_context_corpus/`. A `.txt` copy of each lives in
  `_extracted/` so the source is searchable without Word.

One deliberate deviation from injury-lawyer: `contactFlow` is `book-and-share`
(not `book-only`). The behavioral and privacy documents explicitly require
collecting first name, last name, email, phone, preferred contact method, and
a brief matter description in chat (Doc 2 §E29, Doc 4 §1 Bucket B), so that
flow had to be on. Visuals, layout, theme, accent color, and logo paths are
identical to injury-lawyer.

## Hostinger DNS — add `immigrationlaw.output.systems` to Vercel

The CNAME isn't in Hostinger yet. Once the Vercel project is created, do this:

1. Log in to Hostinger and open hPanel.
2. Go to **Domains** in the left sidebar, then click **Manage** next to
   `output.systems`.
3. Open the **DNS / Nameservers** section (sometimes labelled "DNS Zone
   Editor").
4. Add a new record:
   - **Type:** CNAME
   - **Name:** `immigrationlaw`
   - **Target / Points to:** `cname.vercel-dns.com`
   - **TTL:** 14400 (or leave the default)
5. Save the record.

The full hostname being created is `immigrationlaw.output.systems`. This
mirrors how `injurylaw.output.systems` is configured.

## Vercel side

1. Create a new Vercel project for this vertical (or import the same repo as
   a new project, the way injury-lawyer is set up).
2. Set the project environment variables:
   - `VERTICAL=immigration-lawyer`
   - `NEXT_PUBLIC_SITE_URL=https://immigrationlaw.output.systems`
   - Anthropic, Supabase, and Resend keys are shared across all verticals; copy
     the same values from the injury-lawyer Vercel project.
3. Project Settings → **Domains** → Add Domain → enter
   `immigrationlaw.output.systems`. Vercel will verify the CNAME (give it a
   few minutes to propagate from Hostinger).
4. Trigger a deploy. The first deploy will populate the new domain once DNS
   resolves.

## Supabase

After your next `supabase db push` (or whatever the deploy step is for
migrations), run the new insert in `supabase/seed-tenants.sql` against the
project so the `immigration-lawyer` tenant row exists. Without that row,
every query for this vertical will return empty results.

## Open items for you

- Drop a dedicated hero image into
  `public/images/immigration-lawyer/<filename>` and swap the `heroImage`
  path in `config.json`. Right now it borrows the injury-lawyer image.
- Smoke-test both modes in the browser once env vars are wired up. The
  client lens should pass the urgency stress test ("I have a removal order
  next Tuesday") by stopping general Q&A and pivoting to connect. The
  lawyer lens should probe for intake gaps before suggesting the call.
