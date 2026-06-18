# Knowledge base for the insurance broker demo

Drop the demo brokerage's knowledge here as plain markdown files (`.md`).
Every `.md` file in this folder (and subfolders) is loaded at request time
and concatenated onto the system prompt. No ingest step, no embeddings.

This file is named with a leading underscore (`_README.md`), so the loader
SKIPS it. Anything you actually want the chatbot to know must be in a file
that does NOT start with `_` or `.`.

## Suggested files to create (one topic each)

- `about-and-scope.md` — who the brokerage is, what it handles, where it operates
- `personal-insurance.md` — home, auto, tenants, condo, umbrella in general terms
- `life-and-disability.md` — term, whole, universal, disability, critical illness, long-term care
- `health-and-supplemental.md` — health, dental, vision, travel, supplemental
- `business-insurance.md` — commercial, liability, BOP, workers comp, cyber, professional liability, key person
- `claims-process.md` — how claims generally work; not a coaching guide
- `common-questions.md` — the questions clients actually ask
- `for-brokerages.md` — value-pitch content for the broker side
- `service-area.md` — US + Canada coverage; never assume a single market
- `privacy.md` — privacy posture
- `contact-hours.md` — hours, locations, how to reach the brokerage

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only put things you want the assistant to say. If it isn't here, the
  assistant will say it doesn't have that detail and offer to connect the
  visitor.
- Do not put specific premiums, coverage decisions, carrier recommendations,
  or active-claim coaching in here. Those are for the broker and the
  underwriter; the assistant is rule-bound to refuse them anyway.
