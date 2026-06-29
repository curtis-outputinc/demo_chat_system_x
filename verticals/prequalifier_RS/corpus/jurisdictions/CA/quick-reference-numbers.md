# Quick reference: numbers, percentages, thresholds, and structural rules

A consolidated cheatsheet of every numeric threshold and structural
rule from the prequalifier corpus, organized by topic so the assistant
can quote a number fast without traversing the full corpus tree.

Every entry here ALSO lives in a topic-specific corpus file with full
context, the source URL, and any nuance. This file is a reference;
the topic files are the explanation.

The assistant should NEVER quote a specific live rate (current
qualifying-rate floor, current premium per LTV band, current Ontario
LTT bracket schedule, current bank prime, etc.) from this file. Those
values change. The structural rules below (the 80% insured /
uninsured line, the 65% HELOC cap, the 39 / 44 DSR ceilings, etc.)
are stable framework and safe to cite.

---

## LTV (loan-to-value) ceilings

### Federal / OSFI structural lines

- 80% LTV: the legal line between conventional uninsured and
  high-ratio insured for residential mortgages.
- 65% LTV: maximum for the non-amortizing component of a HELOC, per
  B-20.
- 65% LTV: OSFI's maximum for non-conforming residential mortgages
  (loans with insufficient income verification, low credit scores,
  high DSR, illiquid property, or other clear deficiencies).
- 75% LTV: FRFI risk-monitoring threshold for "relatively high ratio"
  on uninsured originations (not a hard rule, an OSFI watch level).
- 4.5x LTI: high-leverage flag in OSFI monitoring (not a hard rule).

### CMHC insured homeowner products

- Up to 95% LTV: 1-2 unit owner-occupied homeowner purchase.
- Up to 90% LTV: 3-4 unit owner-occupied homeowner purchase.
- Up to 80% LTV: small rental (2-4 units, non-owner-occupied).
- Up to 90% LTV: CMHC Homeowner Refinance (owner-occupied, for
  secondary suite construction).

### Combined Loan Plans (CLPs) under B-20

- 80% LTV: overall plan ceiling (matches the uninsured legal max).
- 65% LTV: cap on the non-amortizing component within the CLP.
- Anything above 65% LTV in the plan must be amortizing AND
  non-readvanceable; principal paydown above 65% must shrink the
  overall authorized plan limit.

### Alternative and private lending (market practice, not OSFI rule)

- B-lender alt mortgages: typically capped 75-80% LTV depending on
  product and lender.
- Private 1st mortgages: typically capped 75% LTV.
- Private 2nd (combined with existing 1st): typically capped 80-85%
  combined LTV.
- These figures are market practice; exact ceilings vary by lender
  and file.

---

## CMHC property value caps

- Conventional CMHC-insured homeowner (LTV at or below 80%): property
  value LESS THAN $1,000,000.
- High-ratio CMHC-insured homeowner (LTV above 80%): property value
  LESS THAN $1,500,000.
- Small Rental (2-4 units, non-owner-occupied): property value LESS
  THAN $1,000,000.
- Homeowner Refinance (secondary suite construction): lending value /
  as-improved property value LESS THAN $2,000,000.
- Above $1,500,000: not eligible for CMHC mortgage loan insurance at
  all; 20% minimum down payment applies and the loan is conventional
  uninsured.

---

## Down payment minimums (Canada federal)

### Homeowner purchase, homes under $1.5M

- Homes priced at $500,000 or less: minimum 5%.
- Homes priced between $500,000 and $1,499,999: 5% on the first
  $500,000 PLUS 10% on the amount above $500,000.
- Homes priced at $1.5M or more: minimum 20%.
- 3-4 unit owner-occupied homeowner purchase: minimum 10%.

### Small Rental (2-4 units, non-owner-occupied)

- Minimum 20%.

### Down payment source rules

Traditional sources (always acceptable):

- Savings.
- Proceeds from sale of a property.
- Non-repayable financial gift from a relative.

Non-traditional sources (limited eligibility):

- Unsecured personal loans or unsecured lines of credit.
- Available ONLY for 1-2 unit purchase loans at 90.01% to 95% LTV,
  for borrowers with a strong history of managing credit.
- NOT available to non-permanent residents.
- NOT available under chattel loan insurance program.
- Triggers a higher premium surcharge at the 90.01-95% LTV band.

Not acceptable as down payment:

- Cash-back or incentive / rebate payments from the lender or
  builder.

---

## Debt service ratios (CMHC / OSFI standard)

- GDS (Gross Debt Service) maximum: 39%.
  - Includes: principal + interest, property taxes, heat, 50% of
    condo fees (where applicable).
  - Site or ground rent (chattel / leasehold loans): 100% included.
- TDS (Total Debt Service) maximum: 44%.
  - Includes: GDS plus all other debt obligations.
- Both calculated using the QUALIFYING rate (the MQR), not the
  contract rate.

### TDS treatment of other debts (CMHC standard)

- Unsecured revolving credit (credit cards, unsecured LOCs):
  qualifying monthly payment is AT LEAST 3% of the outstanding
  balance (or the actual minimum payment, whichever is higher).
- Secured lines of credit: qualifying payment calculated as the
  amount that would amortize the outstanding balance over 25 years
  at the contract rate or the qualifying rate (whichever is greater).
- Car loans, personal loans, student loans, child support, other
  recurring debts: use the actual scheduled payment.

### Rental income treatment (CMHC standard, owner-occupied insured)

- Owner-occupied insured purchases: up to 50% of GROSS rental
  income from the property can form part of qualifying income.
  Property taxes and heat stay on the GDS/TDS expense side.
- Two-unit owner-occupied (with secondary suite): up to 100% of
  gross rental income from the secondary suite counts toward
  qualifying income.
- Investment properties NOT subject to the current application: net
  rental income (after expenses) counts toward qualifying income.

GDS / TDS bucket nuance (market practice):

- A-lender / conventional: 39 / 44 standard, some lenders run
  slightly tighter for higher-risk files.
- Alt-lender (B-side): often 45 / 50 or similar relaxed limits in
  exchange for higher rate and lender fees. Specific limits vary by
  lender.
- Private: DSRs largely irrelevant; equity-driven underwriting.

---

## Qualifying interest rate (MQR / stress test)

- Formula: GREATER of (contract rate + 2%) OR 5.25% floor.
- Applies to: uninsured mortgages at FRFIs (per OSFI), and to insured
  mortgages (Minister of Finance applied the same formula).
- Reviewed at least annually by OSFI; floor and buffer can change.
  Current values live in the prequalifier's rules config.

### Exception: lender switch carve-out

- MQR is NOT required when a borrower switches an uninsured mortgage
  from one federally-regulated lender to another, PROVIDED:
  - amortization period is NOT increased, AND
  - loan amount is NOT increased.
- Effect: a straight switch (no equity takeout, no amortization
  extension) does not retrigger the stress test.

---

## Credit floors

- CMHC: 600 minimum credit score for at least one borrower or
  guarantor.
- Alternative methods accepted for borrowers with no Canadian credit
  history (examples: newcomers to Canada, recent graduates):
  international credit reports, letter of reference from financial
  institution in country of origin.

### Market-practice credit floors (not OSFI / CMHC rules)

- A-lender prime: typically 680+ (some products as low as 600).
- B-lender alt: typically 550+ (lower acceptable at low LTV).
- Private: effectively no credit floor; equity and exit strategy
  drive the file.

---

## Amortization caps (CMHC homeowner)

- Standard maximum: 25 years.
- Maximum 30 years when BOTH are true:
  - LTV is greater than 80% (insured high-ratio), AND
  - the borrower is either (i) a first-time homebuyer OR (ii)
    purchasing a newly built home.
- The 30-year option is also branded as CMHC Home Start.
- Small Rental (2-4 units, non-owner-occupied): max 25 years.
- Homeowner Refinance (secondary suite construction): max 30 years.

---

## CMHC premium framework

- Range: 0.60% to 4.50% of the total mortgage amount (homeowner
  loans).
- Higher LTV = higher premium rate.
- Non-traditional down payment surcharge applies at 90.01% to 95% LTV
  (4.50% vs 4.00% for traditional DP at that band).
- Premium can be paid in full at closing or added to the mortgage and
  amortized.
- Provincial sales tax (PST) may apply to the premium in some
  provinces; paid by the borrower at closing.
- Exact rate per LTV band lives in the prequalifier's rules config;
  the assistant should not quote a specific per-band rate from
  memory.

### Eco premium refunds (homeowner)

- CMHC Eco Plus: 25% partial premium refund for buying or building
  climate-friendly housing using CMHC-insured financing.
- CMHC Eco Improvement: 25% partial premium refund for investing a
  minimum of $20,000 in energy efficiency improvements to a
  CMHC-insured property.

---

## CMHC Portability

- Reduces or eliminates the premium payable on a new insured loan when
  a repeat insured borrower purchases a subsequent home.
- Specific premium credit mechanics confirmed by the lender at the
  time of the new application.

---

## CMHC Self-Employed specifics

- 24 months operating business OR 24 months in same line of work
  (recommended). Flexibilities exist for shorter histories.
- Income gross-up for sole prop / partnership: 15%.
- Alternative: add-back approach, limited to these eligible
  deductions ONLY:
  - business-use-of-home expenses,
  - motor-vehicle expenses,
  - capital cost allowances (CCA).
- Add-back verification: audited financial statements, OR financial
  statements with a Review Engagement Report by a practicing
  accountant, OR T2125 with NOA.
- No premium surcharge for self-employed (same base premium schedule
  as Purchase).

---

## CMHC Newcomers specifics

- Permanent residents: no minimum residency period; full access to
  all CMHC homeowner programs on the same terms as Canadian citizens.
- Non-permanent residents (work permit holders):
  - Must be legally authorized to work in Canada.
  - Limited to 1-4 unit properties with at least one owner-occupied
    unit.
  - Must be exempt from the Prohibition on the Purchase of
    Residential Property by Non-Canadians Act.
  - NOT eligible for non-traditional down payment sources.

---

## Closing costs guidance (CMHC general benchmark)

- 1.5% to 4% of the purchase price.
- Includes legal fees, transfer taxes, adjustments.
- Actual figure varies by province (LTT rates differ, Toronto adds
  municipal LTT, etc.) and by transaction (discharge fees,
  inspection, appraisal, title insurance).

---

## HELOC specifics (B-20)

- 65% LTV maximum on the non-amortizing (revolving) component.
- Revolving credit secured by residential property; regular minimum
  payments generally required.
- HELOC review trigger: material decline in property value or
  material change in borrower's financial condition triggers a review
  of the authorized amount.
- Reverse mortgages and other non-amortizing revolving products
  secured by residential property are TREATED AS HELOCs by OSFI
  (inherit the 65% authorized cap and heightened monitoring).

---

## Combined Loan Plan (CLP) specifics

- Overall LTV cap: 80% (uninsured legal max).
- Non-amortizing component cap: 65% LTV.
- Anything above 65% LTV must be amortizing AND non-readvanceable.
- Principal repayments on the portion above 65% LTV must trigger a
  matching reduction in the overall authorized CLP limit, until the
  combined plan drops to 65% LTV.

---

## Reverse mortgages (Equitable Bank specifics; CHIP terms not
captured)

- Minimum age: 55.
- Must occupy as primary residence at least 6 months annually.
- Minimum home value (Equitable): $250,000.
- Maximum borrowable (Equitable): up to 59% of home value, with older
  borrowers eligible for more.
- No monthly payment requirement.
- No income or credit score requirements.
- Geographic restriction (Equitable): major urban centres in Alberta,
  British Columbia, Ontario, or Quebec only.
- Eligible property types (Equitable): single-family detached, condo,
  duplex, row house, semi-detached, townhouse.
- Ineligible property types (Equitable): modular homes, cottages,
  secondary residences.
- Treated as HELOC under B-20 (65% authorized LTV cap on
  non-amortizing component).
- CHIP (HomeEquity Bank) specifics (CHIP, CHIP Open, CHIP Max) NOT
  captured at corpus load time; defer to broker.

---

## Ontario Land Transfer Tax (LTT)

### Rate brackets

- Tiered by purchase price.
- Exact bracket schedule and per-bracket percentages live in
  `rules/CA-ON.json` (not in this file because the schedule can
  change with provincial budget updates).

### First-Time Homebuyer LTT Refund

- Maximum refund: $4,000 for transactions on or after January 1, 2017
  ($2,000 for transactions before that).
- $4,000 cap means no LTT on the first $368,000 for a qualifying
  first-time buyer.

### FTHB eligibility

- Applicant must be at least 18 years old.
- Applicant must NEVER have owned an eligible home anywhere in the
  world, at any time.
- If applicant has a spouse, the spouse must NOT have owned a home
  anywhere in the world during the marriage.
- For purchase agreements after November 14, 2016: must be a Canadian
  citizen or permanent resident at closing (18-month grace period to
  obtain status).
- Must occupy the home as principal residence within 9 months of
  transfer.

### Refund application deadlines

- First-time homebuyer refund: 18 months from date of registration.
- All other LTT refund requests: 4 years.

### Toronto Municipal LTT (MLTT)

- The City of Toronto levies its OWN MUNICIPAL LTT on top of the
  provincial LTT for transfers within Toronto city limits.
- Specific MLTT brackets and Toronto FTHB rebate live in the
  Toronto-specific rules config.

---

## Ontario Non-Resident Speculation Tax (NRST)

- Current rate: 25% of the value of the consideration.
- Rate became 25% effective October 25, 2022.
- Applies to foreign nationals, foreign corporations (or
  Canadian-incorporated corporations controlled by foreign entities),
  and taxable trustees.
- If ANY ONE transferee is a foreign entity: NRST applies to 100% of
  the transaction value (not prorated).
- Geographic scope: province-wide across Ontario.
- In ADDITION to the regular Ontario LTT (separate, not compounded).
- Applies to designated land with 1-6 single-family residences,
  including (as of March 27, 2024) parking and storage units in
  condominium complexes.
- Multi-unit apartment buildings with 7+ units are exempt.

### NRST rebates

- Permanent Resident Rebate (full refund): foreign national becomes
  permanent resident within 4 years of purchase; must occupy as
  principal residence; apply within 180 days of becoming PR.
- Industrial Use Rebate: property reclassified into industrial / large
  industrial / aggregate extraction within 6 years.
- General refunds: submit within 4 years of NRST payment.

### NRST rebates that EXPIRED March 31, 2025 (no longer available)

- International student NRST rebate.
- Foreign national working in Ontario NRST rebate.
- Both applied only to purchases under agreements dated on or before
  March 29, 2022.

---

## Ontario HST New Housing Rebate

### HST framework

- Total HST on new homes in Ontario: 13% (8% provincial + 5% federal).
- HST applies to NEW homes (builder-built or substantially renovated)
  and to all new home purchases nationally via the federal portion.
- HST generally does NOT apply to resale homes between individuals.

### Existing base rebate

- Up to $24,000 relief on the provincial portion for eligible
  purchasers (including non-first-time buyers and higher-value
  properties).

### 2025 Fall Statement: FTHB relief on NEW homes

- Removes the FULL 8% provincial portion of HST for first-time
  homebuyers on qualifying NEW homes.
- Applies to new homes valued up to $1M; relief decreases for
  higher-valued properties.
- Combined with federal relief, the full 13% HST is removed for
  qualifying first-time buyers on a sub-$1M new home.
- Must be acquired as primary residence.
- Effective for purchase agreements dated May 27, 2025 or later.

### 2026 Ontario Budget: enhanced rebate for ALL eligible buyers

- Homes up to $1M: 100% of the provincial portion, up to $80,000
  relief.
- Homes $1M to $1.5M: capped at $80,000.
- Homes $1.5M to $1.85M: linear decrease to $24,000.
- Homes above $1.85M: $24,000 baseline.
- Eligibility timelines (builder-built homes): purchase agreement
  between April 1, 2026 and March 31, 2027; construction begins by
  December 31, 2028; substantially complete by December 31, 2031.
- Eligibility timelines (owner-built homes): construction begins April
  1, 2026 to March 31, 2027; complete by December 31, 2029.

---

## Legal interest-rate ceiling (Criminal Code s.347)

- Current criminal interest rate ceiling: 35% effective annual rate.
- Was previously 60%; lowered effective recent amendments (statute
  last amended March 26, 2026).
- The ceiling counts ALL fees together: contract interest + lender
  fee + broker fee + any commission, penalty, or similar charge.
- Mortgage carve-outs from the calculation: property taxes excluded,
  required deposit balances excluded.
- Insurance charges excluded if the insurance face amount does not
  exceed the credit advanced.
- Practical impact: matters mainly for private mortgage files where
  rate + lender fee + broker fee can stack toward the ceiling.
- Penalties for charging above 35%: indictable (up to 5 years) or
  summary ($25,000 fine, up to 2 years less one day).

## Private mortgage default insurers (parallel to CMHC)

- Two private insurers operate alongside CMHC: Sagen Canada and
  Canada Guaranty.
- Both operate on a framework parallel to CMHC (high-ratio insurance
  for sub-20% down, similar product lines for self-employed /
  newcomers / etc.).
- Lenders choose the insurer; borrowers do not pick directly.
- Specific LTV maximums, premium tables, and per-product
  underwriting criteria for Sagen and Canada Guaranty are not
  captured in the public corpus and live with their professional
  lender documentation.

## Historical reference values (do not quote as current)

These are values captured from source documents at specific points in
time; current values may differ and live in the rules config.

- OSFI MQR floor at January 2023 (B-20 Impact Infosheet): 5.25%.
- OSFI MQR buffer at January 2023 (B-20 Impact Infosheet): 2% above
  contract rate.
- OSFI MQR floor at January 2026 (canonical OSFI page last
  modification): still 5.25%.
- OSFI MQR buffer at January 2026 (canonical OSFI page): still 2%
  above contract rate.

The 5.25% floor and 2% buffer have been stable since June 1, 2021,
per the OSFI infosheet.

---

## What this cheatsheet is not

- It is not a substitute for the topic-specific corpus files; each
  topic file has the source URL, the nuance, and the framing the bot
  uses to explain things in plain language.
- It is not the rules config. The rules config holds the LIVE values
  the scoring engine uses (current MQR floor, current premium per
  LTV band, current Ontario LTT bracket schedule, current Toronto
  MLTT, jurisdiction-specific overlays).
- It is not legal, tax, or financial advice for any individual
  borrower.
- It is not exhaustive. Provincial regulators outside Ontario, US
  states, and lender-specific overlays are out of scope until those
  jurisdictions are loaded.
