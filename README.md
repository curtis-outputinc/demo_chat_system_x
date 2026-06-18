# demo_chat_system

A multi-vertical engine for **intelligent website chat demos**. One engine,
one folder per vertical (injury lawyer, mortgage broker, real estate, etc.).
Each vertical deploys to its own subdomain (e.g. `lawyers.output.systems`) as a
separate Vercel project, all from this one repo.

## How it works

- `app/` + `lib/` — the engine. Identical for every vertical.
- `verticals/<name>/` — everything that differs per vertical:
  - `config.json` — brand name, trade, the two mode labels, booking URL, theme, links
  - `behaviors.md` — tone and behavioral patterns for the trade
  - `corpus/` — the knowledge base (plain markdown, loaded onto the prompt)
- The `VERTICAL` env var selects the active vertical and doubles as the Supabase
  tenant slug.

The prospect explores the demo through two optional, switchable lenses:
**Client side** (as their own customer) and **{Trade} side** (as the owner
evaluating the assistant).

## Run locally

```bash
npm install
# fill in .env.local (VERTICAL is preset to injury-lawyer)
npm run dev
```

Type-check: `npm run typecheck`. Build: `npm run build`.

## Add a new vertical

1. `cp -r verticals/injury-lawyer verticals/<new-vertical>` and edit `config.json`
   (set `brandName`, `trade`, `modes.professional.label`, `siteUrl`, `bookingUrl`).
2. Fill `behaviors.md` and drop knowledge into `corpus/`.
3. Add a tenant row in `supabase/seed-tenants.sql` (slug must equal `<new-vertical>`)
   and run it against the Supabase project.
4. Create a new Vercel project from this repo with `VERTICAL=<new-vertical>` and
   its own env vars; point the subdomain at it.

## Project status

See `NEEDED.md` for the values and context still required to go live, and
`VERIFY.md` for decisions made autonomously that are worth a human check.
