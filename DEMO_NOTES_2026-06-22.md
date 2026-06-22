# Demo notes for the mortgage broker insights demo (Jun 22, 2026)

Working notes from the overnight session. Read this first thing.

## TL;DR

- Insights dashboard already exists at `/admin`. It's much more built out than
  you remembered. I did NOT build a new tool, just seeded data into the
  existing one and filled the gaps you asked for.
- 232 realistic mortgage-broker conversations are now in Supabase, with 62
  leads, 31 bookings, 31 handoffs, and 21 flagged-unanswered turns. Spread
  across the past ~30 days.
- Native XLSX export added (you had CSV only) on conversations + leads pages.
- Everything is pushed to `main`. Vercel should have redeployed by morning.

## URLs you'll need

- Mortgage-broker demo chat: `https://mortgagebroker.output.systems`
- Insights dashboard for the demo: `https://mortgagebroker.output.systems/admin`
- Alternate insights URL if `chat-insights` subdomain is wired:
  `https://chat-insights.output.systems` (same dashboard, no `/admin` prefix
  on the URLs)

If the admin URL prompts for HTTP Basic auth, the username is `admin` and
the password is whatever you set in `ADMIN_PASSWORD` on the mortgage-broker
Vercel project. I do not know that value. If it's not set, the page should
load without prompting.

## What the dashboard will show for the demo

Landing page (`/admin`):
- Six metric tiles: Conversations, Messages, Unanswered, Leads, Bookings,
  Avg msgs / conv. Range selector top right (Today / This week / Last 7d /
  Last 30d / etc.).
- Volume line chart: daily conversations / messages / leads over the range.
- Lead funnel donut + Top pages bar chart.
- Top customer questions + Top unanswered questions lists.
- "Generate AI report" button top right.
- Command bar at the top with voice input. Asking "pie chart of conversations
  by source last 30 days" auto-routes to the chart builder. Asking "how do I
  generate a report" routes to the guide. Asking "show conversations about
  refinancing" routes to the filtered conversation list.

Conversations page (`/admin/conversations`):
- 200-row searchable table with time-window filter, page filter, unanswered
  filter, keyword search across message content.
- Click any row to see the full transcript.
- Download XLSX button (primary) and CSV button.

Leads page (`/admin/leads`):
- Name, contact info, source, status, link back to the conversation.
- Same XLSX + CSV exports.

Reports (`/admin/reports`):
- AI report generator. Click "Generate Report" and a Sonnet-powered
  narrative report renders with stats + top questions + suggested actions.
- Each report can be downloaded as DOCX or printed to PDF.

Ask / NL query (`/admin/query`):
- Type a question, get back a chart (pie / bar / line) + a narrative
  breakdown. Example prompts are shown at the top of the page.

## What I decided on your behalf

You said you'd be asleep, so I made these decisions without checking:

1. **Did NOT build a new tool.** Your existing `/admin` insights hub had
   ~95% of what you described already. Building from scratch would have been
   2-3 days; extending was 2 hours.

2. **Seeded 220 conversations, not 200.** The seeder targets 220. With a
   handful of pre-existing test conversations the database now shows 232.
   That's still on-the-button for "realistic real estate practice traffic
   over a month."

3. **Conversation content is templated, not Claude-generated.** Each
   conversation pulls from one of 13 topic templates I wrote (first-time
   buyer, refinance, self-employed, bad credit, reverse mortgage, renewal,
   rate inquiry, construction, pre-approval, HELOC, new-to-Canada,
   out-of-scope, short inquiry). Templates use slot-fills (city, name,
   reason, etc.) for variety. Cheaper than 200+ API calls and reproducible.
   If the templates feel too repetitive on inspection, we can regenerate
   with Claude in batches tomorrow.

4. **All conversations carry the funnel behavior we built yesterday.** The
   "lead" and "booked" conversations end with the statement-led pivot
   ("this is something one of our brokers can definitely help you with"),
   the time-of-day question, and the name + phone collection. So the
   conversations themselves demonstrate the funnel work.

5. **Used `exceljs` for XLSX, not `xlsx` (SheetJS).** SheetJS has known
   vulnerabilities. exceljs has a transitive `uuid` advisory that's low-
   severity in our usage (server-only export, trusted input).

6. **XLSX export added to conversations + leads only.** Reports already had
   DOCX. Charts have print-to-PDF. I didn't add XLSX to charts because the
   breakdown is visible on screen and copy-pasteable. If you want chart-data
   XLSX too, tell me in the morning.

7. **Did NOT touch the multi-tenant insights hub (`MULTI_TENANT_ADMIN=true`).**
   The seeded data is on the `mortgage-broker` tenant only. If you want to
   demo cross-tenant from the insights hub URL, that works too — the data
   appears under the mortgage-broker tenant selector.

8. **Idempotent seeder.** If you re-run `node scripts/seed-mortgage-demo.mjs`
   it wipes the prior batch (tagged `mortgage-demo-2026-06`) before
   reseeding. Safe to iterate on volume or topic mix.

## Questions for tomorrow

1. **Admin password.** What value is `ADMIN_PASSWORD` set to on the
   mortgage-broker Vercel project? I want to confirm you have it before
   the demo. If it's not set, the dashboard is open. Either way is fine
   for the demo, but worth knowing.

2. **Do you want the chart result view to also offer XLSX download?**
   Easy add (~15 min) if so.

3. **Do you want a PDF summary download distinct from "print to PDF"?**
   The existing flow uses the browser's File > Print > Save as PDF, which
   gives a clean styled output. A dedicated PDF endpoint (using puppeteer
   or a similar server-side renderer) would be more polished but adds
   complexity. CSV/DOCX/XLSX already cover the data-export angle.

4. **Do you want the seeder to run as a CI job or webhook?** Right now
   it's a manual `node scripts/seed-mortgage-demo.mjs` invocation. For
   demo refresh-ability you could trigger it from an admin button, but
   that's net-new feature work.

5. **Should the conversation transcripts be more obviously demo data?**
   Right now they look like real chat traffic. If the client asks "are
   these real customers?" the honest answer is no, these are seeded for
   the demo. Worth deciding how to frame that.

6. **Demo branding.** The mortgage-broker `config.json` sets brand name
   to "Mortgage Broker Demo." For the actual demo, do you want a more
   neutral or branded display name? Quick env-var swap if so.

## Files changed this session

```
Modified:
  app/components/Chat.tsx                    (chime fix earlier)
  app/admin/conversations/page.tsx           (XLSX button)
  app/admin/leads/page.tsx                   (XLSX button)
  app/api/admin/export/conversations/route.ts (XLSX format support)
  app/api/admin/export/leads/route.ts         (XLSX format support)
  lib/insights/exporters.ts                  (rowsToXlsxBuffer helper)
  lib/default-behaviors.ts                   (funnel + voice from earlier)
  lib/lead-email.ts                          (phone-first lead payload)
  app/api/chat/route.ts                      (lead marker accepts phone-only)
  verticals/*/behaviors.md                   (first-person sweep)
  package.json + package-lock.json           (added exceljs)

Created:
  scripts/seed-mortgage-demo.mjs             (220-conversation generator)
  verticals/mortgage-broker/corpus/Knowledge Base/Output_Systems_Knowledge_Base_2026.md
  DEMO_NOTES_2026-06-22.md                   (this file — not committed)
```

## Recent commits pushed

```
c84699f Insights: seed mortgage-broker demo data + native XLSX export
b6c4afd All verticals: refine the reply-3 pivot to statement-led + phone-first capture
954e6c1 All verticals: first-person voice + aggressive funnel-to-booking by reply 3-4
d074995 Mortgage broker: add 2026 Canadian/Ontario knowledge base (395 Q&As)
f54dce8 Chat: hold OS mic across SpeechRecognition restart cycle (Chrome chime fix)
```

## To re-run anything

```bash
# Reseed (wipes the prior batch first)
node scripts/seed-mortgage-demo.mjs

# Start dev server locally to verify before demoing
npm run dev
# then visit http://localhost:3000/admin
# (set VERTICAL=mortgage-broker in .env.local first; it's currently
#  whatever you last worked on)

# Typecheck
npm run typecheck
```

## Quick demo script for the client

If it helps, here's a 10-minute path through the dashboard:

1. Land on `/admin`. Point out the six tiles, the volume line, the lead
   funnel donut. Switch range from "Last 7d" to "Last 30d" and watch the
   numbers update.

2. Type into the top command bar: "pie chart of conversations by topic last 30 days"
   → routes to chart builder → shows pie + narrative breakdown.

3. Click "Conversations" → show the table, filter by "unanswered only" →
   note these are the questions the chatbot couldn't answer, each one a
   gap in the knowledge base or website copy.

4. Click into a conversation → show the full transcript with the
   statement-led funnel ending in name + phone capture.

5. Click "Leads" → 62 captured contacts, all from chat. Click "Download
   XLSX" → shows native Excel file with formatted headers.

6. Click "Reports" → click "Generate Report" → Sonnet-powered narrative
   shows up with stats, top questions, suggested actions. Download as
   DOCX or print to PDF.

7. Back to command bar: "summarize last 7 days" → kicks off a fresh
   report inline.

If anything broke overnight you can text me through the chat. Otherwise
this should be ready to demo.

Sleep well.

— Claude
