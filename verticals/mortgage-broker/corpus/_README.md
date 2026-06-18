# Knowledge base for the mortgage broker demo

Drop the demo brokerage's knowledge here as plain markdown files (`.md`).
Every `.md` file in this folder (and subfolders) is loaded at request time
and concatenated onto the system prompt. No ingest step, no embeddings.

This file is named with a leading underscore (`_README.md`), so the loader
SKIPS it. Anything you actually want the chatbot to know must be in a file
that does NOT start with `_` or `.`.

## Suggested files to create (one topic each)

- `about-and-scope.md` — who the brokerage is, what it handles, where it operates
- `products.md` — product types (fixed, variable, ARMs, HELOC, refi, bridge, private)
- `qualification.md` — how qualification works at a general level
- `process.md` — what happens after a borrower reaches out (steps from intake to funding)
- `documents.md` — what lenders typically review at the document stage
- `rates-and-pricing.md` — how rates and pricing work in general terms (no specific quotes)
- `common-questions.md` — the questions borrowers actually ask
- `for-brokerages.md` — value-pitch content for the broker side
- `service-area.md` — US + Canada coverage; never assume a single market
- `privacy.md` — privacy posture
- `contact-hours.md` — hours, locations, how to reach the brokerage

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only put things you want the assistant to say. If it isn't here, the
  assistant will say it doesn't have that detail and offer to connect the
  visitor.
- Do not put specific interest rates, payment amounts, qualifying amounts, or
  lender-specific approval criteria in here. Those vary by lender, borrower,
  and date, and the assistant is rule-bound to refuse them anyway.
