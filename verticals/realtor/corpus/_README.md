# Knowledge base for the realtor demo

Drop the demo brokerage's knowledge here as plain markdown files (`.md`). Every
`.md` file in this folder (and subfolders) is loaded at request time and
concatenated onto the system prompt. No ingest step, no embeddings.

This file is named with a leading underscore (`_README.md`), so the loader
SKIPS it. Anything you actually want the chatbot to know must be in a file that
does NOT start with `_` or `.`.

## Suggested files to create (one topic each)

- `about-and-scope.md` — who the brokerage is, what it handles, where it operates
- `services.md` — buyer representation, listing, rentals, relocations, investment, etc.
- `process.md` — what happens after a visitor reaches out (steps for buyers and sellers)
- `fees-and-commissions.md` — how commissions and fees work in general terms
- `common-questions.md` — the questions buyers and sellers actually ask
- `for-brokerages.md` — value-pitch content for the agent side (lead handling, after-hours coverage, insights)
- `contact-hours.md` — hours, locations, how to reach the brokerage
- `privacy.md` — privacy posture (kept private and secure, used only by the brokerage)

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only put things you want the assistant to say. If it isn't here, the assistant
  will say it doesn't have that detail and offer to connect the visitor.
- Do not put specific valuations, market predictions, or local tax/disclosure
  rules in here. Those vary by market and per-property, and the assistant is
  rule-bound to refuse them anyway.
