# Reverse mortgages in Canada

A reverse mortgage is a loan secured by the borrower's home that does
not require monthly payments. Interest accrues against the home's
equity, and the loan is settled when the borrower sells, moves out
permanently, or passes away.

Canada has two main reverse mortgage providers: HomeEquity Bank
(CHIP product family) and Equitable Bank. Both are federally
regulated. Under OSFI's clarification on innovative
real-estate-secured lending (see
`osfi-heloc-clp-clarification.md`), reverse mortgages are treated as
HELOCs for B-20 risk-management purposes.

## Source URLs

- HomeEquity Bank CHIP Reverse Mortgage:
  https://www.homeequitybank.ca/products/chip-reverse-mortgage/
- HomeEquity Bank CHIP Open (short-term reverse):
  https://www.homeequitybank.ca/products/chip-open/
- HomeEquity Bank CHIP Max (higher equity access):
  https://www.homeequitybank.ca/products/chip-max/
- HomeEquity Bank CHIP fact sheet (PDF):
  https://www.homeequitybank.ca/wp-content/uploads/HomEquity-Bank_CHIP-Reverse-Mortgage-Fact-Sheet_MBD_071316.pdf
- Equitable Bank reverse mortgage eligibility:
  https://www.equitablebank.ca/reverse-mortgage/learn/reverse-mortgage-eligibility

Note: at the time this file was loaded, all four homeequitybank.ca
pages and the CHIP PDF returned 403 to the fetcher, so CHIP-specific
terms (rate type, prepayment penalties, fee schedule, maximum LTV by
age tier, and the differences between CHIP / CHIP Open / CHIP Max)
are NOT captured here. They need to be loaded from a different source
or pasted in directly.

## The general reverse mortgage framework

A reverse mortgage is structured to:

- Pay the borrower a tax-free lump sum, scheduled advances, or a line
  of credit, secured against the home.
- Charge interest that compounds against the loan balance.
- NOT require monthly principal-and-interest payments.
- Come due when the borrower sells the home, moves out permanently,
  passes away, or in some products defaults on the loan covenants
  (failure to pay taxes, insurance, or maintain the property).

OSFI treats the non-amortizing component of a reverse mortgage at the
65% LTV ceiling the same way it treats HELOCs (see
`osfi-heloc-clp-clarification.md`).

## Equitable Bank reverse mortgage (captured)

### Eligibility

- Minimum age: 55.
- Borrower must occupy the property as their primary residence at
  least 6 months annually.
- Property minimum value: $250,000.
- Eligible property types: single-family detached, condo, duplex, row
  house, semi-detached, townhouse.
- Ineligible property types: modular homes, cottages, secondary
  residences.
- Geographic restriction: major urban centres in Alberta, British
  Columbia, Ontario, or Quebec only.

### Borrowing capacity

- Maximum borrowable: up to 59% of home value.
- The older the borrower, the more cash can be accessed (standard
  reverse-mortgage actuarial framing).
- No income or credit score requirements stated.

### Loan structure

- No required monthly payments.
- Funds advanced as tax-free cash.
- Can be used to pay off an existing mortgage as part of the funding.
- Application to funding: as little as 30 days.
- Conditional approval possible within 1 business day.

### Equitable Bank's framing

- The provider markets reverse mortgages as having simpler eligibility
  than a personal loan or a HELOC, because reverse mortgages don't
  hinge on income or credit score in the same way.

## CHIP (HomeEquity Bank) — placeholder

HomeEquity Bank offers three CHIP products:

- CHIP Reverse Mortgage: the flagship product.
- CHIP Open: a short-term reverse mortgage product (typical use:
  bridge funding or a planned short-horizon equity takeout).
- CHIP Max: a higher equity access tier.

Specific eligibility, maximum LTV by age, rate types, prepayment
penalty schedule, and fee structure for each of the three products
were NOT captured. The bot should acknowledge CHIP exists and is one
of the two major Canadian reverse mortgage product families, and
direct the borrower to a broker for current CHIP terms.

## When a reverse mortgage is and is not appropriate

(Framework guidance derived from OSFI's treatment of HELOCs and from
the general reverse mortgage product structure.)

Appropriate consideration when:

- Borrower is 55 or older and has substantial home equity.
- Borrower wants to stay in the home long-term.
- Borrower needs tax-free cash without monthly payment obligations.
- Borrower has income / credit limits that make a HELOC, refinance,
  or alt-lender mortgage harder to qualify for.
- Borrower's goal is to age in place, fund retirement living costs,
  pay off existing debt, help family members, or similar.

Concerns the bot should raise (not block, but mention) when:

- The borrower has heirs who expect the home equity. Reverse mortgages
  consume equity over time as interest compounds.
- The borrower is considering moving soon. Closing costs and
  prepayment penalties can make a short-horizon reverse mortgage
  expensive relative to a HELOC or bridge.
- The borrower has high-value short-term needs that exceed the
  product's maximum borrowable percentage. A reverse mortgage's LTV
  ceiling is conservative.
- The borrower could qualify for a conventional refinance, HELOC, or
  alt-lender mortgage at a lower rate. Reverse mortgage rates are
  typically higher than HELOC rates.

## What this corpus file is not

- It is not a complete CHIP product breakdown; CHIP specifics need to
  be loaded from a source the fetcher can access or pasted in.
- It is not specific reverse mortgage rates, which vary by provider,
  product, age tier, and date.
- It is not the OSFI HELOC framework, which is in
  `osfi-heloc-clp-clarification.md` and applies to the non-amortizing
  components of reverse mortgages.
- It is not legal, tax, or financial advice on whether a reverse
  mortgage is appropriate for any specific borrower.
