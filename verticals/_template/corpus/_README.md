# Knowledge base for this vertical

Drop the demo business's knowledge here as plain markdown files (`.md`). Every
`.md` file in this folder (and subfolders) is loaded at request time and
concatenated onto the system prompt. There is no ingest step and no embeddings.

This file starts with an underscore (`_README.md`), so the loader SKIPS it.
Anything you want the assistant to know must be in a file that does NOT start
with `_` or `.`.

## Suggested files (one topic each)

Adapt to the trade. A typical set:

- `about-and-scope.md` - who the business is, what it does, what it does not.
- `services.md` - the services or product areas offered.
- `process.md` - what happens after someone reaches out; typical steps.
- `pricing.md` - how pricing or fees work, in general terms.
- `common-questions.md` - the questions customers actually ask.
- `for-businesses.md` - the professional-side / owner-facing knowledge.

## Rules of thumb

- Write facts plainly. The assistant rephrases; it does not recite.
- Only include things you want the assistant to say. If it is not here, the
  assistant says it does not have that detail and offers a next step.
- Do not name the underlying technology or vendors anywhere in here.
- Keep the whole corpus under ~100K tokens.
