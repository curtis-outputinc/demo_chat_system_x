# CLAUDE.md — demo_chat_system

This file lives at the repo root. Claude Code reads it on every session.

## What this project is

A multi-vertical engine for **intelligent website chat demos**. We sell intelligent
website chat systems to professionals (injury lawyers, mortgage brokers, real
estate agents, etc.). For outreach, each prospect gets a link to a live demo
tailored to their trade.

**One engine, many verticals.** The app code in `app/` and `lib/` is identical
across every vertical. Everything that differs per vertical lives in
`verticals/<vertical>/`. There is no copy-paste-per-vertical; improving the
engine once improves every demo.

```
app/        the engine (chat UI, streaming /api/chat, admin, embed, insights)
lib/        engine libraries
verticals/
  injury-lawyer/
    config.json    brand, modes, links, booking URL, theme
    behaviors.md   tone + behavioral patterns for this vertical
    corpus/        knowledge base (markdown, loaded onto the prompt)
supabase/   schema migrations + per-vertical tenant seed
```

## How a vertical is selected

The `VERTICAL` env var picks the active vertical (e.g. `injury-lawyer`). It is
also the Supabase **tenant slug** every query filters on. One Vercel project =
one vertical = one subdomain = one tenant row. Adding a vertical means: add a
`verticals/<name>/` folder, seed its tenant row (`supabase/seed-tenants.sql`),
and create a new Vercel project with `VERTICAL=<name>` + its own env.

## The two-mode demo

The prospect can explore the demo through two optional lenses, switchable any
time (see `lib/system-prompt.ts` `modeInstruction` and the switcher in
`app/components/Chat.tsx`):
- **Client side** — as one of the business's own customers.
- **{Trade} side** (e.g. "Lawyer side") — as the owner evaluating the assistant.

Mode is a tone + retrieval-scope hint, never a hard wall. Labels come from
`config.modes`.

## Stack (do not swap)

- Next.js 16 App Router (this is **not** older Next.js — check before assuming APIs)
- React 19, TypeScript strict, Tailwind 4 (PostCSS plugin, no tailwind.config.js)
- `@anthropic-ai/sdk` for model calls, `@supabase/supabase-js` for persistence
- `resend` for lead/handoff email. Deployed on Vercel (Node runtime, streaming).

## Rules

1. **No emojis anywhere.** Not in code, comments, chatbot replies, or commits.
2. **No em dashes in user-facing output.** Post-flight strips them; don't add them in templates.
3. **No markdown formatting in chatbot replies.** Plain prose only.
4. **Never reveal the tech stack to visitors.** Never name Anthropic, Claude, Supabase, Vercel, Resend, Next.js, etc. The demo business's own tools are fine.
5. **Default to 2-3 sentence replies**, grade 6-7 reading level, friendly but professional.
6. **Never invent context.** If a vertical's corpus doesn't cover something, acknowledge it and offer to save the question or book a call. Never guess prices, hours, names, deadlines.
7. **Streaming is required.** `/api/chat` returns newline-delimited JSON events.
8. **Service-role Supabase key is server-only.** Never expose to the browser, never log, never put in `NEXT_PUBLIC_*`.
9. **Default to no code comments.** Only comment the non-obvious WHY.

## Where behavior comes from

`lib/system-prompt.ts` `buildSystemPrompt(mode)` composes:
`defaultBehaviors(config)` (universal, in `lib/default-behaviors.ts`)
+ the vertical's `behaviors.md`
+ the active-lens instruction
+ the vertical's `corpus/`.

The `<<<SUBMIT_LEAD>>>...<<<END_SUBMIT>>>` marker in `default-behaviors.ts` is
parsed verbatim by `app/api/chat/route.ts`. Don't change one without the other.

## When the user gives you context for a vertical

Drop knowledge markdown into `verticals/<vertical>/corpus/`. Put HOW-to-behave
guidance into `verticals/<vertical>/behaviors.md`. Put brand/links/booking into
`verticals/<vertical>/config.json`. Files starting with `_` or `.` in corpus/
are ignored by the loader.

## When something is unclear

Ask, unless explicitly told to proceed autonomously. Don't invent business
facts, testimonials, pricing, or industries a demo brand serves.
