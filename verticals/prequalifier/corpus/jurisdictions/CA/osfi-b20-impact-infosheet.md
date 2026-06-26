# OSFI B-20 Impact Infosheet (Federal Canada)

Supplementary commentary to the OSFI B-20 Guideline. Source: OSFI
Information Sheet, January 12, 2023. See the main B-20 corpus file
(`osfi-b20-residential-mortgage-underwriting.md`) for the underlying
guideline.

## Source URL

- Infosheet, full text: https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/infosheet-residential-mortgage-underwriting-practices-procedures-guideline-b-20

The infosheet itself is largely macro-prudential analysis with
historical FRFI monitoring statistics (household debt trends, GDS / LTI
proportions over time, mortgage rate trajectories, variable-rate
adoption, amortization-length drift) intended for OSFI's institutional
audience. None of that statistical content is in this file because none
of it informs a borrower-side prequalification. What is captured below
is the small set of concrete rule clarifications and risk-framing
thresholds that supplement B-20.

## Minimum Qualifying Rate (the stress test), as of June 1, 2021

- The Minimum Qualifying Rate (MQR) for all uninsured residential
  mortgages is the GREATER of:
  - the mortgage contractual rate plus 2%, or
  - 5.25% (the Superintendent's floor).
- The Minister of Finance applied the same MQR test to insured
  residential mortgages, so the floor and buffer apply across both
  insured and uninsured.
- The 5.25% floor and the 2% buffer are values from the January 2023
  infosheet. They can change. The assistant should never quote a current
  floor or buffer from this corpus; the live values are kept in the
  prequalifier's rules config.

## Risk-framing thresholds FRFIs use beyond B-20's formal lines

- LTV greater than 75% on an uninsured mortgage is treated as
  "relatively high ratio" for FRFI risk monitoring. This is distinct
  from the formal 80% insured / uninsured legal line set by B-20.
- LTI (loan-to-income) ratio above 4.5x is treated as a high-leverage
  flag in FRFI monitoring. The proportion of new uninsured originations
  above 4.5x roughly doubled from mid-2018 to early 2022, which OSFI
  flagged as a vulnerability when rates rose.
- These thresholds are monitoring heuristics, not bright-line approval
  rules. The assistant can reference them when explaining why an
  A-lender might treat an otherwise-conforming file with caution.

## How borrowers typically respond to higher rates (context for the assistant)

OSFI's commentary identifies the patterns borrowers use when debt
servicing costs rise. The assistant can use these patterns to interpret
what a visitor is telling it about their situation:

- Existing borrowers: reduce savings and spending, refinance and
  extend amortization, reduce debt servicing costs via consolidation or
  rate-shopping.
- New borrowers: buy a less expensive dwelling, increase the down
  payment, or delay the purchase.

## What this corpus file is not

- It is not the historical statistical record from the infosheet
  (household debt trends 1990-2022, GDS / LTI / amortization /
  variable-rate proportions, rate trajectories). Those values are not
  prequalification-relevant.
- It is not the current MQR floor or buffer. The January 2023 values
  are captured above as historical reference; current values live in
  the prequalifier's rules config.
- It is not OSFI's policy expectations for FRFIs (RMUP, ICAAP, capital,
  stress testing as an institution). Those are in the main B-20 file.
