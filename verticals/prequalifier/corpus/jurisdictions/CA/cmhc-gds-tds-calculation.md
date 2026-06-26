# CMHC GDS / TDS calculation rules (Federal Canada)

The precise formulas CMHC uses for Gross Debt Service (GDS) and Total
Debt Service (TDS) ratios on insured residential mortgages. Read
alongside the base CMHC file (`cmhc-mortgage-loan-insurance.md`) which
covers the 39 / 44 ceilings; this file covers what goes INTO the
calculation and how.

## Source URL

- https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/calculating-gds-tds

## The formulas

GDS = (Principal + Interest + Taxes + Heat) / Gross Annual Income

TDS = (Principal + Interest + Taxes + Heat + Other Debt Obligations) /
Gross Annual Income

Maximum allowable ratios for CMHC-insured files:

- GDS: 39%.
- TDS: 44%.

## GDS components in detail

### Principal and interest

- Based on the applicable amortization period and the loan amount,
  including the CMHC insurance premium itself.
- Calculated at the qualifying interest rate, defined as the GREATER
  of (contract rate + 2%) or 5.25%. See
  `osfi-mqr-uninsured-mortgages.md`.

### Property taxes

- Full amount included.

### Heat costs

- When actual heat-cost records are available, those are used.
- When records are not available, the heat cost used must be a
  reasonable estimate taking into consideration factors such as
  property size, location, and type of heating system.
- The corpus does NOT capture a specific dollar or percentage
  default for unknown heat costs; CMHC leaves that to lender
  judgment.

### Condominium fees

- 50% of the condominium fees must be included in the GDS (and TDS)
  calculations.
- This rule applies to standard condo units.

### Site or ground rent (chattel or leasehold loans)

- 100% of site or ground rent is included (not 50%).

## TDS-specific additions: "Other Debt Obligations"

In addition to all GDS components, TDS includes:

- Credit card payments.
- Lines of credit payments.
- Personal loan payments.
- Car loan payments.
- Any other recurring debt obligation.

### Unsecured revolving credit (credit cards, unsecured LOCs)

- At least 3% of the outstanding balance is used as the monthly
  payment for qualifying purposes.
- This is a floor: if the actual minimum payment is higher than 3% of
  the outstanding balance, the higher amount applies.

### Secured lines of credit

- Required payment amount for qualifying purposes is calculated as
  payments that would amortize the outstanding balance over 25 years
  at the contract rate (or the benchmark / qualifying rate, whichever
  is greater).

## Rental income treatment

### Owner-occupied insured purchases

- Up to 50% of gross rental income from the property can form part
  of the borrower's gross annual income for qualification purposes.
- Property taxes and heat are excluded from the income side when
  using this rule (they remain on the expense side of the GDS/TDS
  calculation).

### Two-unit owner-occupied properties (secondary suite)

- Up to 100% of gross rental income from the secondary suite can be
  counted toward gross annual income.

### Investment properties NOT subject to the current mortgage application

- Net rental income (after expenses) counts toward the borrower's
  gross annual income for qualifying purposes.

## What this corpus file is not

- It is not the current full MQR floor and buffer; see
  `osfi-mqr-uninsured-mortgages.md` and the rules config.
- It is not the lender-overlay treatment of debts (some lenders apply
  stricter rules than CMHC requires; those vary by lender).
- It is not a guide to alt-lender or private-lender DSR treatment;
  those buckets often relax these rules in exchange for higher rates
  and lender fees.
- It is not the federal income tax treatment of rental income; this
  file describes qualifying-income treatment, not tax treatment.
- It is not legal or financial advice for any individual borrower.
