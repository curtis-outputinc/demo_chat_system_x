# Decisions I made on my own, worth a human check

You were away and asked me to decide and log anything uncertain here. None of
these break the build; they're judgment calls.

## Architecture / naming

1. **The "template" is the shared engine, not a copied folder.** `app/` + `lib/`
   are written once; per-vertical differences live in `verticals/<name>/`. No
   copy-paste-per-vertical. (Confirm you're happy with this over duplicating the
   whole app per vertical.)
2. **Renamed `OUTPUT_TENANT_SLUG` -> `TENANT_SLUG`**, now driven by the `VERTICAL`
   env var (one deploy = one vertical = one tenant). Touched 17 files.
3. **Folder name** is still `04_demo_chat_system_template` on disk; the package is
   named `demo_chat_system`. Rename the folder if you want it to match (I can't
   rename my own working directory mid-session).

## Visual theme (most likely thing you'll want to change)

4. **Kept the dark + teal theme for all verticals in this pass.** `accentColor`
   exists in config and is exposed as a `--accent` CSS variable, but the UI still
   uses the hardcoded teal Tailwind classes. Reason: Tailwind 4's JIT can't
   generate classes from dynamic values, and half-converting risks visual breakage.
   Wiring true per-vertical accent color is a clean follow-up once you give colors.
5. **Logo is a single `public/logo.png`** (currently the Output logo) set via
   `config.logoPath`. You mentioned light/dark logos: decide whether you want
   light/dark swapping (the app has a dark background, so the dark-bg logo is the
   one that shows). I can add light/dark logo handling on request.

## Branding scope

6. **Customer-facing surfaces are fully config-driven** (chat UI, replies,
   metadata, embed). **The internal admin dashboard + insights reports still say
   "Output Systems"** in places. That's intentional: those are behind admin auth
   and only you see them for your own demo business. Say the word if you want them
   genericized per vertical too.

## Placeholder content to confirm

7. **`brandName` = "Demo Injury Law"** (placeholder). Confirm the real (or
   intentionally fictional) demo firm name.
8. **`bookingUrl` defaults to `https://cal.com/output-systems`.** Confirm the
   booking link to use for the lawyer demo.
9. **Consent text** is generic and notes it's a "demonstration system." The old
   build referenced PIPEDA; I removed that since the demo brand isn't Output.
   Confirm the consent/legal wording you want.

## Behavior / model

10. **Demos are set to `noindex, nofollow`** (search engines won't list them).
    Confirm you don't want them indexed.
11. **Model kept as `claude-sonnet-4-6`, `max_tokens: 600`** from the original
    engine for chat replies. Confirm, or I can move chat to a different model.
12. **Greeting model changed:** greetings/chips now come from `config.modes`
    (per lens) instead of the old page-path greetings. `lib/greetings.ts` now only
    feeds the conversation "source" tag for analytics.

## Minor / technical follow-ups

13. **Next.js 16 deprecation:** the `middleware.ts` file convention is deprecated
    in favor of `proxy.ts`. It still works (build is green, just a warning). Rename
    when convenient.
14. **Embed bubble copy is static** ("Chat with us" / "CHAT") because `embed.js` is
    vanilla JS served per deploy and can't read config at runtime. Edit per vertical
    if you embed on external sites. (The primary demo path is the full-page chat on
    the subdomain, which is fully config-driven.)
15. **`corpus/` for injury-lawyer is empty** (only an ignored `_README.md`). Until
    you add knowledge files, the assistant will honestly say it lacks details.
