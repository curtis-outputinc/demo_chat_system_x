# CMHC homeownership program catalog (Federal Canada)

CMHC offers a family of mortgage loan insurance products for
homeowners. They share the base framework documented in
`cmhc-mortgage-loan-insurance.md` (LTV ceilings, down payment tiers,
DSR limits, MQR / stress test, credit floor, amortization rules,
eligibility, property location requirements). Each program below
extends the base with its own purpose and any specific overlays.

The assistant can name and briefly describe any of these programs. For
programs with their own dedicated corpus file, the assistant should
defer to that file for details. For programs without dedicated files,
the assistant should describe the program at this catalog level and
direct the visitor to ask a broker for specifics.

## Source URLs

- All homeowner programs overview:
  https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs
- CMHC Premium Calculator (consumer-facing):
  https://www.cmhc-schl.gc.ca/consumers/home-buying/calculators/mortgage-loan-insurance-premium-calculator
- CMHC Quick Reference (PDF, dated 2025-08-27):
  https://assets.cmhc-schl.gc.ca/sf/project/cmhc/pdfs/factsheets/new/cmhc-quick-reference.pdf

## The 10 homeownership programs

### CMHC Purchase

The canonical homeowner purchase product. Enables a borrower to buy
with a minimum 5% down payment from flexible sources. The base file
(`cmhc-mortgage-loan-insurance.md`) covers the Purchase program in
full because it is the program every other one extends.

### CMHC Improvement

For borrowers building new homes or purchasing an existing property
with planned improvements. Allows the purchase and the new
construction or improvement financing to be combined. Advancing
options: single advance for improvement costs at or below 10% of
as-improved value; progress advances for new construction or
improvements above 10% of as-improved value. Full Service progress
validation by CMHC for up to four consecutive advances at no cost;
Basic Service is lender-validated without CMHC pre-approval.

### CMHC Newcomers

For permanent residents and non-permanent residents with work
authorization. Accepts alternative methods of establishing
creditworthiness (international credit reports, letter of reference
from the borrower's financial institution in their country of origin)
where Canadian credit history is limited. See
`cmhc-newcomers-program.md` for the full overlay.

### CMHC Self-Employed

For sole proprietors, partnerships, and incorporated borrowers. Income
verified through T1 General + NOA or Proof of Income. Sole prop and
partnership income may be grossed up by 15% or supported by an
"add-back" of specific eligible deductions. Twenty-four months
operating the business or in the same line of work is recommended,
with additional flexibilities for shorter histories. See
`cmhc-self-employed-program.md` for the full overlay.

### CMHC Portability

Reduces or eliminates the premium payable on the new insured loan when
a repeat insured borrower purchases a subsequent home. Designed to
save costs for borrowers who already paid an insurance premium on a
prior CMHC-insured mortgage. Specific eligibility and premium credit
mechanics are confirmed by the lender at the time of the new
application.

### CMHC Income Property

For real estate investors purchasing rental property. Provides
financing choice across markets. Owner-occupancy is not required.
Specifics of LTV, property cap, and amortization differ from the
homeowner products and are confirmed by the broker on a per-file
basis.

### CMHC Home Start

The 30-year amortization product. Available when LTV is greater than
80% AND the borrower is either a first-time homebuyer OR purchasing a
newly built home. Often referenced informally as "the 30-year option"
on high-ratio insured purchases.

### CMHC Refinance

For existing homeowners funding the construction of a secondary suite.
Up to 4 units (including the existing unit or units). LTV up to 90%.
Lending value up to $2M. Amortization up to 30 years.

### CMHC Second Home

For the purchase of a second residence (vacation property or similar).
Eligibility, LTV, and amortization rules differ from the primary
homeowner products and are confirmed at the broker level.

### CMHC Prefab Plus

For the financing of prefabricated, modular, and manufactured homes.
The assistant should treat prefab and modular financing as available
through CMHC but defer to the broker for specifics on which property
configurations qualify.

## Eco features (premium refunds)

### CMHC Eco Plus

Partial premium refund of 25%, paid directly to the borrower, when the
borrower either buys or builds climate-friendly housing using
CMHC-insured financing. Eligibility tied to specific energy efficiency
standards confirmed at the lender level.

### CMHC Eco Improvement

Partial premium refund of 25%, paid directly to the borrower, when the
borrower invests a minimum of $20,000 in energy efficiency
improvements to a CMHC-insured property.

## Programs that are NOT homeowner programs

CMHC also offers commercial, multi-unit rental, and Indigenous housing
products. Those are outside the prequalifier's scope and should not be
discussed; redirect to a CMHC commercial broker if asked.

## What this catalog is not

- It is not the full eligibility detail for each program; for programs
  beyond Purchase, Self-Employed, and Newcomers, the catalog gives the
  bot enough to acknowledge the program exists without inventing
  specifics.
- It is not premium schedules; those live in the rules config.
- It is not a list of every CMHC product line ever offered; only
  current homeowner programs and the Eco features are catalogued here.
