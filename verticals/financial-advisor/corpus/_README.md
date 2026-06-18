# Knowledge base for the financial advisor demo

Drop the demo practice's knowledge here as plain markdown files (`.md`).
Every `.md` file in this folder (and subfolders) is loaded at request time
and concatenated onto the system prompt. No ingest step, no embeddings.

This file is named with a leading underscore (`_README.md`), so the loader
SKIPS it. Anything you actually want the chatbot to know must be in a file
that does NOT start with `_` or `.`.

## Suggested files to create (one topic each)

- `about-and-scope.md` — who the practice is, what it handles, where it operates
- `services.md` — financial planning, investment management, retirement, estate, tax-aware investing
- `process.md` — what happens after a prospect reaches out (intake to ongoing relationship)
- `fees-and-pricing.md` — how fees work in general terms (no specific quotes)
- `accounts-and-products.md` — account types in general terms (RRSPs, TFSAs, RESPs, RRIFs in Canada; 401(k), IRA, Roth, 529, HSA in US)
- `common-questions.md` — the questions clients actually ask
- `for-advisors.md` — value-pitch content for the advisor side
- `service-area.md` — US + Canada coverage; never assume a single market
- `privacy.md` — privacy posture
- `contact-hours.md` — hours, locations, how to reach the practice

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only put things you want the assistant to say. If it isn't here, the
  assistant will say it doesn't have that detail and offer to connect the
  visitor.
- Do not put specific returns, allocations, projected income figures, or
  client-specific advice in here. Those vary by client and date, and the
  assistant is rule-bound to refuse them anyway.
