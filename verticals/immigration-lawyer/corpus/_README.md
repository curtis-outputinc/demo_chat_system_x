# Knowledge base for the immigration-lawyer demo

Drop the demo firm's knowledge here as plain markdown files (`.md`). Every `.md`
file in this folder (and subfolders) is loaded at request time and concatenated
onto the system prompt. No ingest step, no embeddings.

This file is named with a leading underscore (`_README.md`), so the loader
SKIPS it. Anything you actually want the chatbot to know must be in a file that
does NOT start with `_` or `.`.

## Files in this corpus

- `about-and-scope.md` — who the firm is and what the assistant covers
- `immigration-pathways.md` — the visa categories and matter types the firm
  handles (Canada and US)
- `process.md` — what happens after someone reaches out and how a case
  typically moves
- `fees.md` — how fees and government filing costs generally work
- `common-questions.md` — the most-asked visitor questions and how to handle
  them
- `for-firms.md` — professional-side knowledge for firms evaluating the
  assistant
- `privacy.md` — what the assistant can say about privacy and what it must
  deflect
- `after-a-refusal-or-notice.md` — guidance for the vertical's most
  time-sensitive situations (refusals, removal orders, procedural fairness
  letters)

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only put things you want the assistant to say. If it isn't here, the
  assistant will say it doesn't have that detail and offer to connect the
  visitor.
- Keep it under ~100K tokens total (prompt-cache scale). Beyond that, switch
  to retrieval (RAG) before adding more.
