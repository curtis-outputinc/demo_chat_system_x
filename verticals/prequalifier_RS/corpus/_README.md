# Knowledge base for the prequalifier demo

Drop knowledge here as plain markdown files (`.md`). Every `.md` file in
this folder (and subfolders) is loaded at request time and concatenated
onto the system prompt. No ingest step, no embeddings.

This file is named with a leading underscore (`_README.md`), so the loader
SKIPS it. Anything you actually want the prequalifier to know must be in a
file that does NOT start with `_` or `.`.

## What lives where

- Top-level files (`about-and-scope.md`, `service-area.md`, `privacy.md`,
  `contact-hours.md`, `for-brokerages.md`) describe the prequalifier
  itself: who it is for, what it covers, how it handles privacy, what the
  broker-side pitch is.
- `Knowledge Base/` holds the mortgage knowledge the bot draws on when
  answering a borrower's questions. It is broader than the mortgage-broker
  vertical because this prequalifier explicitly covers conventional,
  alternative (B-lender / MIC), and private lending.

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only put things you want the assistant to say. If it is not here, the
  assistant will say it does not have that detail and offer to connect
  the visitor with a broker.
- Do not put specific interest rates, payment amounts, qualifying
  amounts, or lender-specific approval criteria in here. Those vary by
  lender, borrower, and date, and the assistant is rule-bound to refuse
  them anyway.
- The borrower-side prequalification interview is driven by
  `behaviors.md`, not by corpus files. Corpus answers the visitor's
  questions; behaviors runs the interview.
