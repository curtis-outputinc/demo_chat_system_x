# CMHC mortgage loan insurance (Federal Canada)

This corpus file is the comprehensive base for CMHC homeownership
mortgage loan insurance. It covers what the insurance is, when it is
required, the federal property and down payment rules, LTV ceilings,
debt service and qualifying rate rules, credit floor, amortization,
eligibility, and property location requirements. Program-specific
overlays (self-employed, newcomers, and the wider program catalog) live
in their own files in this folder.

CMHC (Canada Mortgage and Housing Corporation) is a federal Crown
corporation and one of the mortgage default insurers in Canada. Private
insurers (e.g. Sagen, Canada Guaranty) operate on a parallel framework
with similar rules. OSFI's B-20 (see
`osfi-b20-residential-mortgage-underwriting.md`) requires lenders to
meet the chosen insurer's requirements to keep insurance valid.

## Source URLs

- CMHC Purchase program (canonical professional page):
  https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs/purchase
- All homeowner programs overview:
  https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs
- General requirements to qualify (consumer):
  https://www.cmhc-schl.gc.ca/consumers/home-buying/mortgage-loan-insurance-for-consumers/what-are-the-general-requirements-to-qualify-for-homeowner-mortgage-loan-insurance
- What is mortgage loan insurance (consumer):
  https://www.cmhc-schl.gc.ca/consumers/home-buying/mortgage-loan-insurance-for-consumers/what-is-mortgage-loan-insurance
- CMHC mortgage loan insurance explained (2025 Observer article):
  https://www.cmhc-schl.gc.ca/observer/2025/cmhc-mortgage-loan-insurance-explained
- CMHC Quick Reference (PDF, dated 2025-08-27):
  https://assets.cmhc-schl.gc.ca/sf/project/cmhc/pdfs/factsheets/new/cmhc-quick-reference.pdf

## What CMHC mortgage loan insurance is

- An insurance policy that protects the lender if the borrower stops
  paying the mortgage. It does NOT protect the borrower.
- Allows a borrower to buy a home with a down payment as low as 5% and
  still qualify for a mortgage.
- Required when a borrower's down payment is less than 20% of the home's
  purchase price (i.e. LTV above 80%).

## How the premium works

- The premium is the cost of the insurance.
- Paid by the lender and typically passed through to the borrower.
- Can be paid in full at closing, or added to the mortgage and
  amortized.
- The premium is a percentage of the total mortgage amount.
- The rate is driven by LTV: the higher the LTV, the higher the rate.
- Published rates range from 0.60% to 4.50% of the mortgage amount.
- A non-traditional down payment surcharge applies to high-LTV (90.01%
  to 95%) homeowner loans where the down payment comes from a
  non-traditional source (see "Down payment sources" below).
- Exact rate per LTV band lives in the prequalifier's rules config; the
  assistant should not quote a specific band rate from memory.
- Provincial sales tax (PST) may apply to the premium in some provinces
  and is paid by the borrower at closing. Provincial PST rules belong
  in the province's rules config, not here.

## When CMHC mortgage loan insurance is required

Required when both are true:

- Down payment is less than 20% of the home's purchase price.
- Home's purchase price is $1.5M or less.

Equivalently: LTV above 80% on a home priced at $1.5M or less.

## When CMHC mortgage loan insurance is NOT required (or not available)

- Down payment of 20% or more (LTV at or below 80%): insurance is not
  required, though it may still be available subject to the property
  cap for that LTV band (see next section).
- Home priced over $1.5M: not eligible for CMHC mortgage loan insurance
  at all; a minimum 20% down payment applies and the loan is
  conventional uninsured.

## Property value caps by program (canonical CMHC source)

The property cap depends on which CMHC product applies and the LTV:

- Homeowner Purchase, LTV at or below 80% (conventional CMHC-insured):
  property value must be less than $1,000,000.
- Homeowner Purchase, LTV above 80% (high-ratio insured): property
  value must be less than $1,500,000.
- Small Rental (2 to 4 units, non-owner-occupied): property value must
  be less than $1,000,000.
- Homeowner Refinance (owner-occupied, for secondary suite
  construction): lending value or as-improved property value must be
  less than $2,000,000.

## Minimum down payment rules (homeowner purchase)

For homes priced less than $1.5M, the federal down payment minimum is
tiered:

- Homes priced at $500,000 or less: minimum 5%.
- Homes priced between $500,000 and $1,499,999: 5% on the first
  $500,000 plus 10% on the amount above $500,000.
- Homes priced at $1.5M or more: minimum 20% (CMHC insurance not
  available).

For 3-4 unit owner-occupied homeowner purchase: minimum 10% down.

For Small Rental Loans (2-4 units, non-owner-occupied): minimum 20%
down.

## LTV ceilings by program

- Homeowner Purchase, 1-2 units (owner-occupied): up to 95% LTV.
- Homeowner Purchase, 3-4 units (owner-occupied): up to 90% LTV.
- Small Rental (2-4 units, non-owner-occupied): up to 80% LTV.
- Homeowner Refinance (owner-occupied, up to 4 units): up to 90% LTV.

## Down payment sources

Traditional sources (always acceptable):

- Savings.
- Proceeds from the sale of a property.
- Non-repayable financial gift from a relative.

Non-traditional sources (purchase loans only, limited eligibility):

- Unsecured personal loans or unsecured lines of credit, where the down
  payment is arm's length and not tied to the purchase and sale of the
  property.
- Available only for 1-2 unit homeowner loans, 90.01% to 95% LTV, for
  borrowers with a strong history of managing credit.
- NOT available to non-permanent residents.
- NOT available under the chattel loan insurance program.
- A non-traditional down payment triggers a higher premium rate at the
  90.01% to 95% LTV band.

## Creditworthiness

- At least one borrower or guarantor must have a minimum credit score
  of 600.
- CMHC may consider alternative methods of establishing
  creditworthiness for borrowers without a credit history. Examples
  include newcomers to Canada and recent graduates.

## Debt service ratios

- GDS (Gross Debt Service) maximum threshold: 39%.
- TDS (Total Debt Service) maximum threshold: 44%.
- GDS includes principal, interest, property taxes, heat, and 50% of
  condo fees (where applicable).
- TDS includes GDS plus all other debt obligations.

## Qualifying interest rate (the stress test)

- GDS and TDS must be calculated using an interest rate equal to the
  GREATER of:
  - the contract interest rate plus 2%, or
  - 5.25% (the Superintendent's minimum qualifying rate floor).
- The 5.25% floor and the 2% buffer can change over time. The assistant
  should never quote a specific floor or buffer from this corpus; the
  live values are kept in the prequalifier's rules config.
- Eligible rate types: fixed, capped variable, standard variable, and
  adjustable.

## Amortization

- Maximum amortization is 25 years.
- Maximum amortization is 30 years when BOTH of the following are true:
  - LTV is greater than 80% (insured high-ratio), AND
  - the borrower is either (i) a first-time homebuyer OR (ii)
    purchasing a newly built home.
- The 30-year option is also known as CMHC Home Start.
- For the Homeowner Refinance product, the maximum amortization is 30
  years.
- For Small Rental Loans, the maximum amortization is 25 years.

## Eligibility

- Canadian citizens.
- Permanent residents of Canada.
- Non-permanent residents who are legally authorized to work in Canada
  (e.g. work permit holders), for homeowner purchase and refinance
  loans only.
- All borrowers must be exempt from the Prohibition on the Purchase of
  Residential Property by Non-Canadians Act for the property to be
  eligible.

## Property location and condition requirements

- Property must be located in Canada.
- Property must be suitable for and available for full-time, year-round
  occupancy.
- Property must have year-round vehicular access (including properties
  on islands accessed via a vehicular bridge or ferry).

## Closing costs guidance (CMHC's general benchmark)

CMHC's consumer guidance suggests borrowers budget for closing costs
in the range of 1.5% to 4% of the purchase price, including legal
fees, transfer taxes, and adjustments. The actual figure varies by
province (land transfer tax rates differ, Toronto adds municipal LTT,
etc.) and by the specific transaction (mortgage discharge fees,
inspection, appraisal, title insurance).

For Ontario-specific closing costs (provincial LTT brackets, Toronto
MLTT, first-time buyer LTT refund), see the Ontario corpus files.

## Worked example (insurance required because LTV above 80%)

A home costs $750,000 and the borrower has $60,000 saved.

Required down payment:

- 5% of $500,000 = $25,000.
- 10% of $250,000 (the amount above $500,000) = $25,000.
- Minimum total = $50,000.

The borrower's $60,000 meets the minimum but is still less than 20%
($150,000), so mortgage loan insurance is required.

- Down payment is 8% of $750,000.
- Mortgage amount = $750,000 - $60,000 = $690,000.
- At an 8% down payment, the published premium rate is 4%.
- Premium = $690,000 x 4% = $27,600.
- The premium may be paid at closing or added to the mortgage and
  amortized.

## Summary, condensed

- Down payment less than 20% on a home at or below $1.5M: insurance
  required.
- Down payment 20% or more: insurance not required (may still be
  available subject to the property cap for the LTV band).
- Home over $1.5M: not eligible for CMHC insurance; 20% minimum down.
- LTV ceilings: 95% (1-2 unit owner-occupied), 90% (3-4 unit
  owner-occupied), 80% (small rental), 90% (refinance).
- Debt service ceilings: GDS 39%, TDS 44%.
- Qualifying rate: greater of contract + 2% or 5.25%.
- Credit floor: 600 for at least one borrower or guarantor.
- Amortization: 25 years standard, 30 years for first-time buyers OR
  new builds when LTV is above 80% (Home Start). Refinance allows 30
  years.

## What this corpus file is not

- It is not the current full premium rate table per LTV band. The
  published range (0.60% to 4.50%) is documented above; exact band
  rates live in the prequalifier's rules config and are kept current
  there.
- It is not a description of private insurers' specific premium
  schedules (Sagen, Canada Guaranty); those parallel CMHC's framework.
- It is not provincial PST-on-premium rules; those are per-province and
  live in the province's rules config.
- It is not a list of all CMHC programs and overlays; see
  `cmhc-program-catalog.md`.
- It is not the detailed self-employed or newcomers eligibility
  framework; those are in their dedicated overlay files.
- It is not legal or financial advice for any individual borrower.
