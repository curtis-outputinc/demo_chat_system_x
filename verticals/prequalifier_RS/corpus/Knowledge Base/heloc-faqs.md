# Home Equity Lines of Credit (HELOC): Frequently Asked Questions

Plain-language Q&A reference for the kinds of questions borrowers ask
about HELOCs in Canada. Synthesized from two AI-generated sources
(Gemini and ChatGPT), deduplicated semantically, plus 50 additional
borrower-facing questions added. The OSFI HELOC / Combined Loan Plan
rules are in `jurisdictions/CA/osfi-heloc-clp-clarification.md`; the
canonical B-20 framework is in `jurisdictions/CA/osfi-b20-residential-mortgage-underwriting.md`.

## How the agent should use this file

These Q&As give the agent background context for HELOC conversations.
Typical thresholds noted (65% standalone HELOC LTV cap, 80% combined
LTV ceiling, 680+ credit for prime, $1,200-$2,000 setup costs,
7.99-11.99% private rates) are general market context, not quotes.
Real values vary by lender and date.

The agent should NOT quote a specific current prime rate, current
HELOC rate, or specific lender pricing. Those live in the rules
config and change with the Bank of Canada.

## Provenance

- Source 1: AI-generated Q&As (Gemini), 50 items.
- Source 2: AI-generated Q&As (ChatGPT), 50 items. Both cite
  Canada.ca and OSFI sources, which align with our canonical
  corpus files. After semantic deduplication, merged.
- Plus 50 additional borrower-facing questions written.

---

## Category 1: HELOC Fundamentals

1. What is a HELOC?
A Home Equity Line of Credit. A revolving credit facility secured
by your home's equity. Like a credit card with a high limit: borrow,
repay, borrow again, pay interest only on what you actually draw.

2. What does HELOC stand for?
Home Equity Line of Credit.

3. How does a HELOC work?
The lender approves a credit limit based on your home value,
mortgage balance, income, credit, and debts. You draw funds as
needed, and you pay interest only on the drawn portion.

4. Is a HELOC the same as a mortgage?
No. A mortgage is a fixed loan amount with scheduled principal-and-
interest payments. A HELOC is revolving credit with optional
interest-only minimum payments.

5. Is a HELOC the same as a second mortgage?
Not quite. A traditional second mortgage is a lump-sum loan
registered behind the first mortgage. A HELOC is a revolving credit
line that can be registered in first or second position depending
on whether you have an existing mortgage.

6. Is a HELOC secured debt?
Yes. It's secured by your home, with the lender registering an
interest against the property. Missed payments can put the home at
risk.

7. What is a "readvanceable mortgage"?
A synchronized product where your mortgage and HELOC are tied
together under a single lien. As you pay down the mortgage
principal, the HELOC's available limit automatically increases by
the same amount.

8. How does a HELOC differ from a regular line of credit?
A regular (unsecured) line of credit has no collateral, lower
limits, higher rates, and stricter credit requirements. A HELOC is
secured by your home, has much higher limits, lower rates, and the
home is at risk on default.

---

## Category 2: LTV Caps and Limits

9. What is the maximum percentage of my home I can borrow on a standalone HELOC?
Under Canadian banking guidelines and OSFI rules, the revolving
standalone HELOC component is capped at 65% LTV.

10. Can I combine a HELOC with a mortgage to borrow more than 65%?
Yes, through a readvanceable mortgage. Combined mortgage + HELOC
can go up to 80% LTV total, but the revolving (HELOC) component
itself can never exceed 65%. The portion above 65% must be
amortizing and non-readvanceable.

11. How does the formula work?
Maximum standalone revolving credit = appraised home value × 65%.
Maximum combined footprint (mortgage + HELOC) = appraised home
value × 80%.

12. What is the minimum equity required for a HELOC in Ontario?
For HELOC combined with a mortgage (readvanceable): minimum 20%
equity (LTV at or below 80%). For a completely standalone HELOC
without a mortgage: minimum 35% equity (LTV at or below 65%).

13. Can I get a HELOC on a property that's completely paid off?
Yes. This is a Standalone First-Position HELOC. Replaces a
traditional mortgage and gives you an open interest-only credit
facility representing up to 65% of the unencumbered home value.

14. Is a HELOC a first or second mortgage on my title?
If you have no other debts on the home, the HELOC sits in first
position. If you add a HELOC behind an existing first mortgage with
a different lender, it registers as a second charge.

15. How much can I borrow with a HELOC overall?
Canada.ca confirms that with a HELOC, you may borrow up to 65% of
the home's value. Combined mortgage + HELOC plans may total up to
80% LTV with the structural amortization rules above.

16. How do I calculate my available HELOC room?
Quick estimate: home value × 65% minus your current mortgage
balance. Example: home worth $900,000, mortgage balance $450,000.
65% of $900K = $585,000. Less $450K mortgage = roughly $135,000 of
estimated HELOC room before fees.

17. What if I already owe more than 65% of my home value?
A standalone HELOC may not be available. A broker can review
whether a refinance, combined readvanceable plan, or second
mortgage works instead.

18. What if I owe more than 80% of my home value?
Hard stop. Additional home-secured borrowing is generally not
available because there's not enough remaining equity for the
lender to take security against.

---

## Category 3: Interest Rates and Payments

19. Are HELOC interest rates fixed or variable?
Almost universally variable. Calculated as a premium over the
lender's prime lending rate (e.g., Prime + 0.50%, Prime + 1.00%).

20. What is the typical HELOC rate today?
The HELOC rate equals the lender's prime rate plus a margin of
roughly 0.50% to 1.00%. The current prime rate and exact margin
live in the rules config, not in this corpus. The agent should not
quote a specific current rate from memory.

21. What is the minimum monthly payment on a HELOC?
Most Canadian lenders require an interest-only monthly payment
calculated on the daily balance you've drawn. If your balance is $0,
your mandatory payment is $0.

22. Can I lock part of my variable HELOC into a fixed rate?
Yes. Most modern major banks offer Fixed-Rate Term Segments. You
can lock a specific drawn balance (e.g., $50,000 for a renovation)
into a structured amortizing fixed-rate sub-account within your
HELOC.

23. Are there prepayment penalties if I pay off the HELOC balance?
No. Because a HELOC is fully open, you can pay down the entire
balance at any moment with zero prepayment penalties.

24. How is daily interest calculated on a HELOC?
Daily interest charge = (outstanding balance × annual interest
rate) / 365. Added to your statement monthly.

25. Can the interest rate change without my permission?
Yes. Variable rates change automatically when the Bank of Canada or
the lender adjusts the prime rate.

26. Can I set up automatic principal payments?
Yes. While interest-only is the mandatory minimum, you can
configure your bank to automatically pay down set principal amounts
each month.

27. Can my HELOC payment change?
Yes. If the interest rate changes or your drawn balance changes,
the required payment changes.

---

## Category 4: Qualification

28. Do I have to pass the stress test for a HELOC?
Yes. Under B-20 rules, federally regulated lenders must apply the
Minimum Qualifying Rate (greater of contract + 2% or 5.25%) to
HELOC qualification. The stress test exemption for straight lender
switches (November 2023) does not apply to new HELOC origination.

29. Why is qualifying for a HELOC so difficult even with lots of equity?
Banks calculate stress-test debt ratios assuming the entire
approved HELOC limit is maxed out, using a hypothetical 25-year
amortization. If your income can't support that imaginary payment,
the file is declined regardless of equity.

30. What credit score do major banks want for a HELOC?
680+ to approve. Below 650, traditional institutional options
become limited; below 600, you're typically routed to alternative
or private equity HELOCs.

31. Can I qualify for a HELOC if I'm self-employed?
Yes, but traditional banks require 2 years of clean NOAs. If your
write-offs reduce your reported income heavily, you may need
alternative stated-income or bank-statement equity programs.

32. What documents do I need for a HELOC application?
Current mortgage statement, property tax bill, homeowners insurance
verification, ID, recent pay stubs or T4s. Self-employed adds tax
documents and possibly business financials.

33. What are the standard GDS/TDS limits for HELOC underwriting?
Institutional lenders apply standard caps: GDS at 39% and TDS at
44% based on gross income, with the HELOC's maxed-out payment
included in the math.

34. Can I get a bank HELOC with active CRA tax arrears?
No. Banks require taxes up to date and any active CRA tax liens
fully cleared before registering a revolving line of credit on
title.

35. Will credit card balances reduce my HELOC limit?
Yes. High credit card balances inflate your TDS ratio, which
automatically reduces the remaining income capacity banks use to
calculate your approved HELOC limit.

36. Do I need income to qualify for a HELOC?
Yes, almost always. Even though the HELOC is secured by your home,
lenders need to verify you can manage the payments. Pure
equity-based HELOCs without income verification are usually only
available through private lenders.

37. Can I qualify if I'm retired?
Yes. Pension income, CPP, OAS, RRIF/LIF withdrawals, investment
income, or rental income all count. The lender reviews stability
and total qualifying amount.

38. Can I qualify if I'm on disability?
Yes if the disability income is stable and documented. Long-term
disability insurance, WSIB, CPP-D all count.

39. Can I qualify if I'm unemployed?
Difficult through traditional lenders without documented income.
Some private lenders may consider equity-only HELOCs but at higher
cost.

---

## Category 5: The OSFI 65% Rule Specifics

40. What does the OSFI rule change say about readvanceable HELOCs?
Under the finalized OSFI rules: in a readvanceable mortgage, the
portion above 65% LTV must be amortizing and non-readvanceable.
Principal payments while total debt is above 65% LTV do not
increase available HELOC room.

41. How does the 65% rule work for a $1M home?
Combined mortgage + HELOC up to $800,000 (80%). But the revolving
HELOC limit tops out at $650,000 (65%). The $150,000 gap between
65% and 80% must be structured as a traditional amortizing loan
that permanently shrinks as you pay.

42. Do principal payments increase my HELOC limit once I'm below 65% LTV?
Yes. Once total combined debt drops below 65% of property value,
the readvanceable mechanism activates, and available credit expands
with every principal payment.

43. Does the 65% cap apply retroactively to my old HELOC?
No. Existing HELOC accounts established before the rule rollout are
generally grandfathered. The rule applies to new setups,
modifications, refinances, or product switches done now.

44. Why did OSFI restrict readvanceable HELOCs?
To prevent persistent lifelong debt cycles. Limiting the automatic
re-borrowing room ensures highly leveraged homeowners are forced to
pay down real principal.

45. Can the bank reduce my HELOC limit if the market drops?
Yes. A HELOC is a callable demand loan facility. If a market
correction reduces the home's market valuation, banks can lower
your credit limit or freeze the account to protect their capital
exposure.

46. Does an unused HELOC limit damage my credit score?
No, the opposite. A large empty credit line lowers your overall
credit utilization ratio, which signals excellent credit management
and can lift your score.

47. Can the lender freeze my HELOC if my income or credit drops?
Yes. Lenders periodically review active portfolios. A score drop,
collection marks, or missed mortgage payments can trigger an
instant freeze of further draws without warning.

---

## Category 6: Practical Uses

48. Can I use a HELOC for renovations?
Yes, one of the most common uses. The flexibility to draw as
construction progresses (only paying interest on what's drawn)
makes HELOC well-suited to staged renovation projects.

49. Can I use a HELOC to consolidate debt?
Yes, if approved. HELOC interest is typically much lower than
credit card or unsecured line of credit interest, so consolidation
can lower monthly debt service. The trade-off: unsecured debt now
becomes secured against the home.

50. Can I use a HELOC to pay off credit cards?
Yes if approved. Reducing credit card balances also improves your
credit utilization ratio, which can lift the credit score.

51. Can I use a HELOC to pay CRA debt?
Possibly, if the lender approves the file. CRA debt and any liens
must be reviewed; some lenders won't approve a HELOC while
CRA-related issues are unresolved.

52. Can I use a HELOC for emergency funds?
Yes. Many homeowners keep a HELOC available as a backup source of
funds. Because there's no payment if you don't draw, it's a low-
cost safety net.

53. Can I use a HELOC for a down payment on a second property?
Yes. Pulling cash from a HELOC on your primary residence to fund a
down payment on a rental property, vacation home, or cottage is
common.

54. Can I use a HELOC for business expenses?
Yes, though most planners recommend caution. Securing business
borrowing against your personal home means business failure can
threaten your home.

55. Can I use a HELOC for tuition or education?
Yes, the funds can be used for any purpose. Most planners
recommend lower-interest student loan programs first, then HELOC if
needed.

56. Can I use a HELOC to invest in the stock market?
Yes. If you use HELOC funds to invest in income-producing assets
(dividend stocks, mutual funds in non-registered accounts), the
interest may be tax-deductible per the CRA "purpose test." Consult
an accountant.

57. What is the "Smith Manoeuvre"?
A legal Canadian tax strategy. Using a readvanceable mortgage,
take the principal paydown room generated from your regular
mortgage payment, draw it from the HELOC, and invest it into
dividend-paying stocks. Over time, this converts non-deductible
mortgage debt into tax-deductible investment debt.

58. Is HELOC interest tax-deductible?
Depends on the "Purpose Test" set by CRA. Used for income-producing
investments: deductible. Used for personal renovations, cars, or
trips: not deductible.

---

## Category 7: Setup, Costs, and Mechanics

59. What are the typical setup costs for a HELOC?
$1,200 to $2,000 typical. Covers a new property appraisal
($400-$600), legal registration fees to place the collateral charge
on title ($600-$1,000), and administrative file setup fees.

60. Why is the appraisal needed?
The lender needs to confirm the current property value to set the
maximum credit limit. Most HELOC setups require a fresh appraisal.

61. Can I use my debit card to spend cash from my HELOC?
Yes, most major Canadian banks allow you to link your HELOC to
your debit card, write dedicated cheques against the balance, or
move funds via the mobile banking app.

62. What is a "collateral charge" mortgage?
A mortgage charge registered for a higher amount than the actual
loan (often 100% or 125% of property value). This allows the credit
limit to expand later without requiring legal registration of a new
charge. HELOCs are typically registered as collateral charges.

63. Why does a HELOC need a collateral charge?
So the credit limit can grow in the future without paying for a
new mortgage registration. This is the mechanism that makes
readvanceable HELOCs work.

64. Can I transfer my HELOC to a new lender for free at renewal?
No. Unlike a standard mortgage switch (often free), moving a
collateral HELOC to a new lender requires full legal discharge and
new title registration. Expect standard legal and appraisal setup
fees.

65. What happens to my HELOC if I sell my home?
The HELOC is paid out from sale proceeds at closing, like any
other mortgage. The lawyer registers a discharge from title.

66. What happens to my HELOC if my home value changes?
Higher value can increase your room (subject to bank re-evaluation).
Lower value can trigger a credit limit reduction or freeze under
the bank's callable demand right.

---

## Category 8: Alternative and Private HELOCs

67. What should I do if my bank rejects my HELOC application?
Connect with a licensed broker. If you failed the bank's strict
B-20 income stress test, the broker can route the application to
specialized alternative credit unions or private equity lenders who
focus on equity rather than rigid income ratios.

68. Can I get a private equity-based HELOC?
Yes. Private lenders offer specialized Equity Lines of Credit that
bypass traditional stress tests and tax document checks. They
extend capital based on property value, location density, and
equity spread.

69. What rates do private or second-position HELOCs charge?
Higher than prime banks. Typically 7.99-11.99% plus an upfront
broker/lender fee of 2-4% of the loan amount.

70. Can I get a private equity HELOC with credit below 550?
Yes. Purely private equity lenders don't enforce minimum credit
scores. Healthy equity cushion (LTV under 70%) in a marketable
urban market can secure approval.

71. Can a private HELOC pay off large CRA tax debt?
Yes, often a common tactical use. Quick equity access clears CRA
debts and liens, restoring financial standing so the borrower can
qualify with traditional banks down the road.

72. How fast can an alternative or private HELOC fund?
With appraisal in hand and clear title, as fast as 3-5 business
days.

---

## Category 9: HELOC vs Other Products

73. Is a HELOC better than a refinance?
Depends on the goal. HELOC: best for flexible on-demand access (pay
interest only on what you draw). Refinance: best for a lump sum,
debt consolidation, or restructuring the mortgage.

74. Is a HELOC better than a second mortgage?
HELOC is revolving (open) and offers flexibility. A second
mortgage is a one-time lump sum with set payments. For known
amounts: second mortgage. For ongoing variable needs: HELOC.

75. Is a HELOC better than a personal line of credit?
HELOC is cheaper (lower rate) and higher limit (secured by home).
Personal LOC is unsecured, higher rate, lower limit, but doesn't
put the home at risk.

76. Is a HELOC better than a credit card?
Lower interest rate, much higher limit, but secured by your home.
Credit cards: smaller limits, much higher rates, but no home at
risk. For larger borrowing: HELOC. For small short-term: credit
card.

77. Is a HELOC better than a reverse mortgage?
Depends on age and income. HELOC requires income to qualify and
needs monthly interest payments. Reverse mortgage (55+ only)
requires no income and no monthly payments. HELOC is usually
cheaper if you can qualify.

---

## Category 10: Property Types and Specific Scenarios

78. Can I get a HELOC on a condo?
Yes. The lender reviews unit value, condo fees, building condition,
location, and marketability.

79. Can I get a HELOC on a rental property?
Possibly. Some lenders offer HELOCs on rental properties but rules
are typically stricter than for primary residences. Rental income
may or may not count toward qualifying.

80. Can I get a HELOC on a rural property?
Possibly, with more lender review. Location, acreage, well and
septic systems, resale market, and appraisal support all matter.

81. Can I get a HELOC on a vacation home or cottage?
Possibly, but more difficult. Lenders prefer primary residences.
Vacation homes face stricter equity requirements and may have
lower LTV caps.

82. Can I get a HELOC on a co-op?
Generally no. Co-ops are not freehold property and lenders rarely
extend HELOCs against co-op shares.

83. Can I get a HELOC on leased land?
Generally no. HELOCs require freehold ownership of the underlying
land.

---

## Category 11: Application, Renewal, and Closing

84. What information do I need to provide for a HELOC review?
Estimated property value, current mortgage balance, existing HELOC
balance (if any), income, employment type, credit score range,
debts, property type, and desired credit amount.

85. How long does HELOC approval take?
Standalone HELOC: typically 2-4 weeks. Faster if combined with an
existing mortgage at the same lender. Private equity HELOCs can be
faster (3-5 business days with all docs ready).

86. Does the HELOC need to renew?
The HELOC itself is typically open-ended. Some lenders may review
your account periodically (every 1-5 years) to confirm continued
qualification, but the HELOC doesn't have a maturity date like a
mortgage.

87. Can I convert my HELOC balance to a fixed mortgage later?
Yes, often. Most readvanceable products allow you to convert all or
part of a HELOC balance into an amortizing fixed-rate mortgage
sub-account.

88. What happens if I want to close my HELOC permanently?
Request a formal payout statement, clear any remaining balance,
and have your lawyer register a mortgage discharge with the land
registry to remove the lien from your title.

89. Can I increase my HELOC limit later?
Possibly. The lender re-evaluates your home value, mortgage
balance, income, credit, and debts. An increase is treated similar
to a new application.

90. What if I never use my HELOC?
That's fine. No drawn balance means no interest charges and no
required payment. The credit limit simply sits available for future
use.

---

## Category 12: Additional borrower questions

91. Will applying for a HELOC affect my credit score?
A small short-term dip from the hard credit pull. Long-term, an
unused or low-balance HELOC tends to be neutral or positive for
your credit profile.

92. Can my spouse and I have separate HELOCs on the same home?
Generally no. The home can have one collateral charge that backs a
single HELOC product. Both spouses can be on the same HELOC.

93. Can a non-spouse co-applicant be on my HELOC?
Yes, depending on title structure. If multiple people own the home
on title, the HELOC application can include them all.

94. What if I want to add my spouse to an existing HELOC?
Treated as a modification. The lender re-runs the file with the
spouse's income and credit included. May require new ILA.

95. Does my home insurance need updating when I add a HELOC?
Yes. The lender becomes an additional loss payee on the home
insurance policy, similar to a mortgage.

96. Can I get a HELOC if I'm currently in mortgage arrears?
Very difficult. Active arrears usually disqualify a borrower from
new credit until the arrears are resolved.

97. Can a HELOC be assumed by a new buyer when I sell?
Generally no. HELOCs are paid out at closing when the home is
sold; the buyer applies for their own financing.

98. What's the maximum HELOC limit a Canadian bank will offer?
The cap is structural (65% LTV on standalone, 80% combined). On a
high-value home, this can mean hundreds of thousands or even
millions of dollars in available credit. Subject to income
qualification.

99. Can I have a HELOC and a regular line of credit simultaneously?
Yes. They're separate products. Banks may consider both when
calculating your overall debt exposure.

100. Should I get a HELOC even if I don't need the money now?
Many financial planners recommend it. The setup cost is one-time;
having available credit creates flexibility for future needs
without applying under stress later.

101. What is "interest capitalization" on a HELOC?
If you don't pay the monthly interest, it can be added to your
balance, eating into your available credit. Most lenders require
the minimum interest payment to avoid this.

102. Can my bank close my HELOC if I never use it?
Some lenders may cancel unused accounts after long periods of
inactivity. Drawing even a small amount periodically can keep the
account active.

103. Can I get a HELOC if I have a private mortgage on my home?
Difficult. The private mortgage holds first position, and the
HELOC would need to register behind it. Few lenders will offer a
HELOC behind a private mortgage.

104. Does the HELOC payment go up if I draw more?
Yes. Interest is calculated on the drawn balance, so more drawn =
higher interest payment.

105. Can I use a HELOC to bridge between selling and buying?
Yes. A HELOC on your current home can fund the deposit or down
payment on your new home while you wait for the current sale to
close. Pay off the HELOC when the sale completes.

106. What is the difference between a HELOC and a HELOAN?
HELOC is revolving. HELOAN (Home Equity Loan) is a lump-sum loan
with set payments. HELOAN is less common in Canada than the US;
most Canadian "home equity" borrowing is structured as HELOC or
second mortgage.

107. Will the lender review my account periodically?
Some lenders do annual or periodic account reviews to confirm
continued eligibility. The lender can reduce the limit, freeze the
account, or change terms based on the review.

108. Can I use my HELOC to pay my mortgage?
Technically yes, but be cautious. Drawing from one home-secured
debt to pay another doesn't reduce overall debt and can be a sign
of cash flow distress that lenders monitor.

109. What is "negative amortization" risk on a HELOC?
If you only make minimum interest payments and the balance keeps
growing (e.g., from new draws), the principal never reduces. Long-
term, this can erode equity without building anything.

110. Can a mortgage broker help me get a HELOC?
Yes. Brokers compare HELOC products across multiple lenders and
can route alternative or private files when bank options fail.

---

## What this corpus file is not

- It is not the OSFI HELOC and Combined Loan Plan technical rules;
  see `jurisdictions/CA/osfi-heloc-clp-clarification.md`.
- It is not B-20 framework detail; see
  `jurisdictions/CA/osfi-b20-residential-mortgage-underwriting.md`.
- It is not legal, tax, or financial advice for any specific
  borrower's situation. The "purpose test" for interest deductibility
  and the Smith Manoeuvre have tax implications a qualified
  accountant should review.
- It is not a guarantee of approval, current rate, or specific
  product terms.
- The typical thresholds noted (setup cost ranges, private rate
  ranges, prime + margin ranges) are market context as of the
  authoring date, not current quotes.
- Specific current values (current prime rate, current Bank of
  Canada policy rate, current HELOC margins) live in the rules
  config.
