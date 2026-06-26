# OSFI clarification on HELOCs and Combined Loan Plans under B-20 (Federal Canada)

OSFI guidance clarifying how Guideline B-20 applies to innovative
real-estate-secured lending products: Combined Loan Plans (CLPs),
HELOCs, and similar bundled structures. Read alongside the main B-20
file (`osfi-b20-residential-mortgage-underwriting.md`).

## Source URL

- https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/clarification-treatment-innovative-real-estate-secured-lending-products-under-guideline-b-20

## What a Combined Loan Plan (CLP) is

A CLP is a residential mortgage product that merges multiple loan
segments into a single structure on the same property. Defining
features:

- A single collateral dollar charge on the property supports multiple
  segments or components.
- Authorized borrowing limits for the segments depend on balances of
  other loans inside the plan.
- The whole plan is underwritten as one combined credit under an
  overall limit.
- The most common form: a traditional amortizing mortgage blended with
  a revolving line of credit (HELOC) under one collateral charge.

CLPs are sold under various lender brand names (some lenders market
them as "all-in-one" or "readvanceable" mortgages).

## LTV rules specific to CLPs and HELOC components

- The non-amortizing (revolving) HELOC component is capped at 65% LTV.
  Any portion above 65% LTV must be amortizing AND non-readvanceable.
- The overall CLP cannot exceed 80% LTV (the legal maximum for
  uninsured residential mortgages).
- Principal repayments on the portion ABOVE 65% LTV must trigger a
  matching reduction in the overall authorized CLP limit, until the
  combined plan drops to 65% LTV across all segments.

Practical implication for the bot: a borrower who has a
readvanceable mortgage cannot rebuild their available HELOC room back
to 80% LTV after paying down the amortizing portion. The amortizing
paydown shrinks the overall plan ceiling, not the HELOC sub-account.

## Other products that B-20 treats as HELOCs

OSFI treats the following as HELOCs for purposes of the heightened
risk-management expectations:

- Reverse mortgages.
- Non-amortizing (revolving) credit products secured by residential
  property, regardless of how the lender brands them.

This means reverse mortgages and similar revolving products inherit
the HELOC rules from B-20 (65% authorized LTV ceiling on the
non-amortizing component, heightened monitoring expectations).

## Underwriting expectation

The institution must demonstrate that CLPs are underwritten with
prudent risk management practices aligned with the institution's risk
appetite. This is the same expectation B-20 applies to all
residential mortgage products; CLPs do not get a relaxed standard
simply because the structure is innovative.

## What this corpus file is not

- It is not the full text of B-20; see
  `osfi-b20-residential-mortgage-underwriting.md`.
- It is not a list of which lenders offer CLPs or readvanceable
  mortgages.
- It is not specific to a particular bundled product brand.
