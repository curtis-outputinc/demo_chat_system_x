# Knowledge base for the injury-lawyer demo

Drop the demo firm's knowledge here as plain markdown files (`.md`). Every `.md`
file in this folder (and subfolders) is loaded at request time and concatenated
onto the system prompt. No ingest step, no embeddings.

This file is named with a leading underscore (`_README.md`), so the loader
SKIPS it. Anything you actually want the chatbot to know must be in a file that
does NOT start with `_` or `.`.

## Suggested files to create (one topic each)

- `about.md` — who the firm is, history, attorneys, where they practice
- `practice-areas.md` — the case types they handle (car accidents, slip and
  fall, medical malpractice, etc.)
- `process.md` — what happens after someone reaches out, the steps of a case
- `fees.md` — how fees work (e.g. free consultation, contingency / no win no fee)
- `faqs.md` — the questions clients actually ask
- `contact-hours.md` — hours, locations, how to reach them, service area

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only put things you want the assistant to say. If it isn't here, the assistant
  will say it doesn't have that detail and offer to connect the visitor.
- Keep it under ~100K tokens total (prompt-cache scale). Beyond that, switch to
  retrieval (RAG) before adding more.
