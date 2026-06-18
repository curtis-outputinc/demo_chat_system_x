# What I need from you to take this live

The engine is built and passes type-check and a production build. Below is
everything that still needs real values or content. Nothing here blocks the code;
it's data, secrets, and copy.

## 1. Secrets / env values (fill in `.env.local`, and set the same in Vercel)

- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from the new
  `demo_chat_system` Supabase project (Settings -> API)
- `CALCOM_WEBHOOK_SECRET` — Cal.com webhook signing secret (only if using booking handoff)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (verified sender), `HANDOFF_RECIPIENT`
  (where lead/booking emails go)
- `ADMIN_PASSWORD` — password to gate the `/admin` dashboard
- `CRON_SECRET` — any random string; Vercel Cron uses it
- `NEXT_PUBLIC_SITE_URL` — this deploy's public URL, e.g. `https://lawyers.output.systems`

`VERTICAL=injury-lawyer` is already set.

## 2. Supabase

- Create the `demo_chat_system` project.
- Apply the three migrations in `supabase/migrations/` (in order).
- Run `supabase/seed-tenants.sql` so the `injury-lawyer` tenant row exists.
  Without it, chat still works but conversations and leads won't be saved.

## 3. Injury-lawyer demo content (in `verticals/injury-lawyer/`)

- `config.json`: confirm/replace `brandName` (currently placeholder "Demo Injury
  Law"), set the real `bookingUrl`, `siteUrl`, and `privacyUrl` if any. Mode
  labels are set (Client side / Lawyer side).
- `behaviors.md`: fill the placeholder sections with the real tone/positioning.
- `corpus/`: add the actual firm knowledge as `.md` files (about, practice areas,
  fees, process, FAQs, hours). Right now the corpus is EMPTY, so the assistant
  will say it doesn't have details and offer to connect. See `corpus/_README.md`.

## 4. Branding assets

- Replace `public/logo.png` with the vertical's logo (you mentioned light/dark
  logos). Decide how to handle light vs dark, see VERIFY.md item on theming.
- If you want a per-vertical accent color instead of the default teal, give me
  the hex and I'll wire `accentColor` through the UI (see VERIFY.md).

## 5. Hosting / infra

- GitHub repo named `demo_chat_system` (this folder).
- Vercel project for this vertical with `VERTICAL=injury-lawyer` + the env above.
- Point the subdomain (e.g. `lawyers.output.systems`) in Hostinger DNS at Vercel.
- Cal.com booking link + webhook pointed at `<site>/api/cal-webhook` (if using).

## 6. Per future vertical (mortgage-broker, etc.)

Copy `verticals/injury-lawyer/`, edit `config.json` + content, add a tenant row
to `seed-tenants.sql`, create a new Vercel project with that `VERTICAL`. No code
changes. See README.md.
