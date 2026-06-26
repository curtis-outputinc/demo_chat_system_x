# Ontario Land Transfer Tax (LTT) and First-Time Homebuyer refund

Ontario's land transfer tax applies to most property purchases in the
province. The first-time homebuyer refund partially offsets it for
qualifying buyers.

## Source URLs

- LTT overview: https://www.ontario.ca/document/land-transfer-tax
- First-time homebuyer refund: https://www.ontario.ca/document/land-transfer-tax/land-transfer-tax-refunds-first-time-homebuyers

## What Ontario LTT is

- Provincial tax payable when a transfer of land is registered in
  Ontario.
- Based on the amount paid for the land, plus any mortgage or debt
  assumed as part of the purchase arrangement.
- Buyer pays. Due at closing / on registration.
- If registration does not occur within 30 days of closing, a Return
  form must be submitted to the Ministry of Finance within 30 days.

## Rate brackets

The Ontario LTT is tiered: rate increases with the value of the
property. The exact rate per bracket and the dollar thresholds for
each bracket are kept in the prequalifier's rules config for Ontario
(`rules/CA-ON.json`) so values stay current. The assistant should not
quote a specific Ontario LTT rate from memory.

## First-Time Homebuyer LTT Refund

The first-time homebuyer refund partially offsets the provincial LTT
for qualifying first-time purchasers.

- Maximum refund: $4,000 for transactions on or after January 1, 2017
  ($2,000 for transactions before that date).
- The $4,000 cap means a qualifying first-time buyer pays no
  provincial LTT on the first $368,000 of the home's value.

### Eligibility

- Applicant must be at least 18 years old.
- Applicant must NEVER have owned an eligible home anywhere in the
  world, at any time.
- If the applicant has a spouse, the spouse must NOT have owned a home
  anywhere in the world during the marriage.
- For purchase agreements after November 14, 2016: the applicant must
  be a Canadian citizen or permanent resident of Canada at the time
  the transaction closes. An 18-month grace period exists after
  closing to obtain that status.
- The applicant must occupy the home as their principal residence
  within nine months of the date of transfer.

### Qualifying home types

- Detached house.
- Semi-detached house.
- Townhouse.
- Condominium.
- Co-operative housing share.
- Mobile home.
- Duplex, triplex, fourplex.
- Manufactured home meeting specific standards.

### How to claim

- Claim at registration, either electronically or via paper affidavit.
- Or apply later through the Ministry of Finance online services
  portal (no login credentials required).
- Deadline to apply for the refund: 18 months after the date of
  registration.

### Supporting documents

- Registered conveyance copies.
- Purchase agreement.
- Statement of adjustments.
- Occupancy proof (utility bills are NOT accepted).
- Citizenship or permanent residency documentation.

## Toronto Municipal Land Transfer Tax (MLTT)

The City of Toronto levies its own MUNICIPAL LTT on top of the
provincial LTT for property transfers within Toronto city limits.
Specific MLTT brackets and the Toronto FTHB rebate are kept in the
prequalifier's rules config for Toronto-specific deployments. The
assistant should note that buyers in Toronto pay both provincial and
municipal LTT.

## Other LTT exemptions (full list at the source)

The provincial LTT has additional exemptions for:

- Certain spouse-to-spouse transfers.
- Individual-to-family-business-corporation transfers.
- Farmed land transfers between family members.
- Life lease transfers from non-profits or charities.

These are narrow; most purchases do not qualify for them.

## Other refund deadlines

- First-time homebuyer refund: 18 months after date of registration.
- All other LTT refund requests: 4 years.

## What this corpus file is not

- It is not the specific LTT rate brackets and dollar thresholds.
  Those live in the rules config.
- It is not the Non-Resident Speculation Tax (NRST) which applies
  separately on top of LTT for non-resident buyers. See
  `ontario-nrst.md`.
- It is not the Toronto MLTT bracket table.
- It is not legal advice on a specific transfer.
