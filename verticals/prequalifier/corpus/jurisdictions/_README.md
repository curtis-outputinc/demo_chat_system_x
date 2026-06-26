# Jurisdiction-scoped corpus

This folder holds regulatory and program corpus organized by jurisdiction.
The leading-underscore name means the corpus loader SKIPS this file
itself; only the markdown inside the jurisdiction subfolders is loaded.

## Convention (Option A)

Each subfolder is named with an ISO-style code that identifies the
jurisdiction:

- `CA/` — Canada, federal. Anything that applies Canada-wide goes here
  (e.g. OSFI guidelines, federal CMHC rules, federal income tax rules,
  PCMLTFA / FINTRAC obligations). One source of truth per regulation.
- `CA-ON/`, `CA-BC/`, `CA-AB/`, etc. — Canadian provinces. Only the
  rules that are genuinely provincial belong here (provincial regulator
  policy, land transfer tax tables, provincial first-time buyer
  programs, foreclosure / power-of-sale procedure, mortgage broker
  licensing rules).
- `US/` — United States, federal. (Not used yet.)
- `US-CA/`, `US-WA/`, `US-NY/`, etc. — US states. (Not used yet.)

## Why no duplication of federal into province folders

Federal rules apply across all provinces. When a federal rule is also
needed for an Ontario broker (which it always is), the engine loads `CA/`
AND `CA-ON/` together for that deployment. The federal file does not
need to be copied into each province folder.

Single source of truth means OSFI / CMHC / federal updates happen in one
file, not N copies.

## Current loader behavior vs future loader behavior

Today: the corpus loader walks the entire `corpus/` tree recursively, so
every file under every jurisdiction subfolder is loaded into every
conversation. That is correct for the demo at
`prequalify.output.systems`, which intentionally shows broad coverage.

Future: when the first paid broker deploys for a specific jurisdiction,
the engine grows a `JURISDICTION` config (set per-tenant or per-deploy)
and the loader filters jurisdiction subfolders to load only `CA/` plus
the active province (e.g. `CA/` + `CA-ON/`). Until that change ships,
no per-deployment filtering happens.

## Adding a new jurisdiction

1. Create the subfolder under `jurisdictions/` with the ISO-style code.
2. Drop regulation and program corpus files inside it. Plain factual
   markdown, no marketing tone, no specific rates that change over time
   (those live in `verticals/prequalifier/rules/<JURISDICTION>.json`).
3. If the new jurisdiction is a Canadian province, do NOT copy any
   federal CA/ files into it. The engine will load both folders when the
   deploy is configured for that province.
