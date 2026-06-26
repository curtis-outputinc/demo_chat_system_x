# OSFI Minimum Qualifying Rate (MQR) for uninsured mortgages (Federal Canada)

OSFI's stress test rule for uninsured residential mortgages. Read
alongside the main B-20 file (`osfi-b20-residential-mortgage-underwriting.md`)
which covers the MQR concept; this file is the canonical OSFI page for
the rule itself.

## Source URL

- https://www.osfi-bsif.gc.ca/en/supervision/financial-institutions/banks/minimum-qualifying-rate-uninsured-mortgages

## The MQR formula

Lenders must qualify borrowers for uninsured mortgages using an
interest rate equal to the GREATER of:

- the mortgage contract rate plus 2%, or
- 5.25% (the Superintendent's floor).

Per the canonical OSFI page (last modified January 29, 2026), the 2%
buffer and the 5.25% floor remain in effect.

## Who the MQR applies to

- Federally-regulated financial institutions (FRFIs) when underwriting
  uninsured residential mortgages.
- The Department of Finance applied the same MQR formula to insured
  mortgages, so the test applies across both insured and uninsured
  origination at FRFIs.

## Important exception: same-lender-type switches

The MQR does NOT apply when a borrower switches an uninsured mortgage
from one federally-regulated lender to another, PROVIDED:

- the amortization period is not increased, AND
- the loan amount is not increased.

In effect, a straight switch (lender shop, no equity take-out, no
amortization extension) does not retrigger the stress test. The
borrower stays qualified at their original underwriting.

## Why the MQR exists

The MQR ensures borrowers can sustain mortgage payments despite
negative financial shocks (interest rate increases, income loss). It
exists to reduce mortgage delinquency and default risk in the FRFI
system and protect Canada's financial stability. Real-estate-secured
lending is a large concentration on FRFI balance sheets, so qualifying
borrowers conservatively is a system-wide risk management tool, not
just an institutional one.

## Review and change cadence

OSFI reviews both the buffer and the floor at least annually. Inputs to
that review:

- Data from Canadian financial institutions.
- Housing vulnerability indicators.
- Broader economic conditions.
- Input from the Department of Finance Canada and the Bank of Canada.

Because the floor and buffer can change, the assistant should rely on
the live values in the prequalifier's rules config for any
calculations. The values above (2%, 5.25%) reflect the canonical OSFI
page as of the last modification date.

## What this corpus file is not

- It is not the full B-20 guideline; see
  `osfi-b20-residential-mortgage-underwriting.md`.
- It is not the MQR for insured mortgages (the same formula applies via
  the Department of Finance, but this page is OSFI's rule for
  uninsured).
- It is not a guide to how a specific lender prices the contract rate;
  the MQR is applied to whatever rate the borrower contracts at.
