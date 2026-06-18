# New vertical setup form

This folder is the scaffold for a new demo vertical. It is NOT a live vertical
(the leading underscore keeps it out of the way, and the engine only ever loads
the folder named by the VERTICAL env var). Treat this like `.env.local.example`:
copy it, then fill in the blanks.

## How to use

1. Copy this whole folder to `verticals/<your-vertical-slug>/`. The slug is
   lowercase with dashes, for example `mortgage-broker`. It must match the
   VERTICAL env var and the Supabase tenant slug exactly.
2. Fill in `config.json` (every field is listed below).
3. Fill in `behaviors.md` (how the assistant should behave for this trade).
4. Drop the knowledge into `corpus/` as plain markdown (see `corpus/_README.md`).
   Delete `corpus/_README.md` is not required; files starting with `_` are
   ignored by the loader.
5. Seed the tenant row: add one line to `supabase/seed-tenants.sql` and run it
   against the Supabase project (see "Outside this folder" below).
6. Set the env for this deploy (see "Outside this folder").

## config.json fields

These are wired and used by the engine today:

- brandName: the demo business name shown to visitors. Example: "Demo Injury Law".
- trade: the profession, lowercased. Example: "injury lawyer", "mortgage broker".
- productName: what we call the product in professional mode. Usually leave as
  "intelligent website chat system".
- accentColor: hex accent for buttons, the input border, and links. Example: "#1ae0cb".
- logoPath: path under public/ for the logo. Use a logo that reads on the panel
  background (a dark logo for a light theme, a light logo for a dark theme).
- siteUrl: the public URL of this deploy. Example: "https://lawyers.output.systems".
- bookingUrl: the booking link (Cal.com or similar).
- privacyUrl: optional privacy policy URL shown in the footer. Leave "" to hide it.
- consentText: the consent line shown above the opening greeting.
- contactFlow: how the assistant offers to connect a visitor.
    "book-and-share" - the two-option flow: share name/email/phone in chat to be
      passed to the team, OR book a call. Use for normal lead-gen verticals.
    "book-only" - booking link only; the assistant never collects or forwards
      personal details in chat. Use for sensitive verticals (e.g. injury law)
      where the conversation should stay private and not be handed off.
- layout: "centered" (logo header above a single-column chat) or "split" (a hero
  image panel on the left, logo + chat on the right).
- theme: "dark" (black background, light text) or "light" (light panel, dark
  text). The split layout's left panel is always dark; theme controls the chat
  panel.
- heroImage: for the split layout, a path under public/ for the left-panel image.
  Leave "" to show a solid dark panel until an image is ready.
- modes.client and modes.professional: the two demo lenses.
    label: the button text. The client label is usually "Client side"; the
      professional label swaps per trade, e.g. "Lawyer side", "Broker side".
    blurb: one line under the button.
    greeting: the opening line when that lens is active.
    chips: 4 suggested starter questions for that lens.
- approvedLinks: URLs the assistant is allowed to surface, each as
  {"url": "...", "label": "..."}. The booking URL is always allowed; add others
  here. Leave [] if none.

Inherited automatically (do not add unless you need to extend them):

- forbiddenVendors: the list of vendor/stack names the assistant must never
  reveal. A sensible base list is built in. Only add a "forbiddenVendors" array
  to config.json if this vertical introduces a new vendor name to suppress; it
  REPLACES the base list, so include the base names too if you set it.

## behaviors.md

Tone, positioning, and the trade-specific HOW. The universal rules (length,
plain prose, never reveal the stack, the connect flow) are already handled by
the engine. Only add what is specific to this trade. See the injury-lawyer
behaviors.md for a worked example.

## corpus/

The knowledge base. Every .md file here is loaded onto the prompt at request
time. Write facts plainly; the assistant rephrases. Keep it under ~100K tokens.

## Outside this folder (per deploy)

- Tenant row: in `supabase/seed-tenants.sql`, add
    insert into tenants (slug, name, domain) values
      ('<your-vertical-slug>', '<Brand Name>', '<domain>')
      on conflict (slug) do nothing;
  then run it against the Supabase project after migrations are applied.
- Env (one Vercel project per vertical): set VERTICAL=<your-vertical-slug> and
  NEXT_PUBLIC_SITE_URL=<siteUrl>. The Anthropic and Supabase keys are shared
  across all verticals (multi-tenant); only VERTICAL and the public URL differ.

## Later

This file is the interim version of the internal "new vertical" form. The plan
is a dashboard form that writes these same fields, so this stays the source of
truth for what a vertical needs.
