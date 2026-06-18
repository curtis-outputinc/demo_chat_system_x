# Vertical Buildout Guide

What we need from you to build a new vertical at parity with `injury-lawyer`.

Everything brand-and-engine related (brand name, trade label, accent color,
logo, site URL, `config.json`, `behaviors.md` structure, file layout,
deployment) is standardized and handled by Claude Code. The brand name is
always `<Trade> Demo` (e.g. "Mortgage Broker Demo", "Immigration Law Demo").

The only thing that changes per vertical is the **context**. Give us these
four documents and we build the corpus, the behaviors, and the rest.

## The four inputs

1. **Questions and answers**
   A bank of the questions this trade's customers actually ask, with plain
   answers. 100-200+ is ideal. This becomes the backbone of the corpus.

2. **Behavioral parameters**
   How the assistant should behave for this trade. Tone, identity, hard
   rules and regulatory boundaries (what it must never say), how to handle
   pushy visitors, how the client lens differs from the professional lens.
   The structure mirrors `injury-lawyer/behaviors.md`; only the
   trade-specific content changes.

3. **Trade context document**
   The full picture of what the trade does and what this demo business can
   help with. What the business is, what services or matters it covers,
   what it does not, how its process generally works, and the language the
   trade uses. This is what the assistant draws on to sound credible.

4. **Privacy posture**
   How sensitive the visitor's situation is, what the assistant can and
   cannot say about privacy, and whether the connect flow should be
   booking-only (sensitive) or share-or-book (normal lead-gen).

## What we do with them

From those four inputs, Claude Code produces the same corpus shape as
`injury-lawyer/corpus/`: an about-and-scope file, a services file, a process
file, a fees file, a common-questions file, a for-firms file, a privacy
file, a `contact-hours.md`, and a trade-specific guidance file. Then we
fill in `config.json` and `behaviors.md` and the deployment using the
standard pattern.

## Default office hours

Every vertical's `contact-hours.md` should state the office hours and make
clear that the chat itself is always available. Default office hours when
the prospect hasn't specified: **Monday to Friday, 8:30 AM to 4:30 PM**.

For **legal verticals (lawyer of any kind)**, the file must also include
the line that general questions which do not require legal advice are
welcome at any hour, and that anything needing legal advice is handled by
a lawyer during office hours. This is the protective wording that
distinguishes the chat from giving legal advice off-hours. Copy the pattern
in `injury-lawyer/corpus/contact-hours.md` or
`immigration-lawyer/corpus/contact-hours.md`.

For **non-legal verticals (mortgage broker, real estate agent, contractor,
etc.)**, the legal-advice carve-out is not needed; just state office hours
and that the chat answers general questions any time.

## Reference

`verticals/injury-lawyer/` is the canonical build. When in doubt about how
the four inputs translate into corpus files, mirror that vertical.
