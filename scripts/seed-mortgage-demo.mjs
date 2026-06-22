#!/usr/bin/env node
// Seed the mortgage-broker tenant with a realistic batch of demo data for
// client-facing dashboard demos. Generates ~200 conversations spread across
// the past 30 days, with a believable distribution of leads, bookings,
// flagged-unanswered turns, page contexts, and sources.
//
// Re-running this script wipes the prior seeded batch (identified by
// metadata.seed_batch === BATCH_TAG) before inserting fresh rows, so iterating
// on tone or volume is safe.
//
// Usage: node scripts/seed-mortgage-demo.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const envText = readFileSync(join(root, '.env.local'), 'utf-8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2];
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  env[m[1]] = v;
}

const supabaseUrl = env.SUPABASE_PROJECT_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_PROJECT_URL or SUPABASE_SERVICE_ROLE in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TENANT_SLUG = 'mortgage-broker';
const BATCH_TAG = 'mortgage-demo-2026-06';
const TOTAL_CONVERSATIONS = 220;

// ----------------------------------------------------------------------------
// Inventories
// ----------------------------------------------------------------------------

const FIRST_NAMES = [
  'Sarah', 'Jamal', 'Priya', 'Marcus', 'Aisha', 'David', 'Olivia', 'Wei',
  'Fatima', 'James', 'Hannah', 'Carlos', 'Linda', 'Tariq', 'Ben', 'Emma',
  'Ravi', 'Sophie', 'Anika', 'Daniel', 'Yuki', 'Lucia', 'Anthony', 'Maya',
  'Felix', 'Ngozi', 'Adrienne', 'Kavi', 'Ines', 'Madison', 'Justin', 'Caroline',
  'Hyun-Ji', 'Diego', 'Beatrice', 'Robert', 'Sienna', 'Sanjay', 'Mei', 'Omar',
  'Talia', 'Connor', 'Zara', 'Henrik', 'Amara', 'Vivian', 'Jordan', 'Camila',
  'Lukas', 'Naomi', 'Devon', 'Rebecca', 'Imani', 'Theo', 'Charlotte', 'Aaron',
  'Nadia', 'Eli', 'Grace', 'Pablo', 'Indira', 'Sebastien', 'Tessa', 'Mateo',
  'Lily', 'Kofi', 'Marie', 'Brendan', 'Yara', 'Ibrahim', 'Chloe', 'Damon',
];

const LAST_NAMES = [
  'Mitchell', 'Okafor', 'Sharma', 'Chen', 'Khan', 'Tremblay', 'Rossi', 'Zhang',
  'Hassan', 'Wilson', 'Goldberg', 'Mendoza', 'Park', 'Ali', 'Murphy', 'Lefebvre',
  'Patel', 'Dubois', 'Singh', 'Cohen', 'Tanaka', 'Romano', 'Russo', 'Reddy',
  'Schmidt', 'Adeyemi', 'Garcia', 'Dumont', 'Nair', 'Castillo', 'Silva',
  "O'Brien", 'Beaulieu', 'Hernandez', 'Olsen', 'Hamilton', 'Wright', 'Kumar',
  'Beauchamp', 'Nguyen', 'Pearson', 'Coleman', 'Saunders', 'Yamamoto',
  'Iqbal', 'Antonov', 'Petrov', 'Mwangi', 'Anderson', 'Bouchard',
];

const ONTARIO_CITIES = [
  'Toronto', 'Mississauga', 'Brampton', 'Hamilton', 'Ottawa', 'London',
  'Markham', 'Vaughan', 'Kitchener', 'Windsor', 'Oakville', 'Burlington',
  'Barrie', 'Guelph', 'Kingston', 'Whitby', 'Ajax', 'Pickering', 'Cambridge',
  'St. Catharines', 'Niagara Falls', 'Waterloo', 'Oshawa', 'Richmond Hill',
];

const PAGE_CONTEXTS = [
  ['/', 0.45],
  ['/services', 0.15],
  ['/rates', 0.12],
  ['/first-time-buyers', 0.10],
  ['/refinancing', 0.08],
  ['/about', 0.04],
  ['/faq', 0.03],
  ['/self-employed', 0.03],
];

const SOURCES = [
  ['website', 0.58],
  ['ref:google', 0.22],
  ['ref:facebook', 0.10],
  ['ref:referral', 0.06],
  ['ref:instagram', 0.04],
];

const TIME_OF_DAY_REPLIES = [
  'mornings work best, around 9 or 10',
  'after work, anywhere between 5 and 7',
  'lunchtime, around noon if possible',
  'afternoon, 2 or 3pm',
  'evenings, after 6',
  'early afternoon ideally',
  'late morning, 11ish',
  'any time before 4',
];

// ----------------------------------------------------------------------------
// Topic templates. Each returns a series of {role, content, flagged?} turns
// when invoked with the slot-fills. Templates are loosely tied to corpus
// topics so the demo reflects real broker traffic.
// ----------------------------------------------------------------------------

function topicFirstTimeBuyer(slots) {
  const { city, downPaymentSituation } = slots;
  return [
    {
      role: 'user',
      content: `Hi, my partner and I are looking at buying our first place in ${city}. We have ${downPaymentSituation}. Where do we even start?`,
    },
    {
      role: 'assistant',
      content: `Congrats, that is an exciting step. The first place to start is figuring out your maximum purchase price by getting pre-qualified, because that depends on your income, credit, debts, and the down payment you have ready. With less than twenty percent down the mortgage has to be default-insured, and there are specific minimums depending on the price. Are you both employed on regular T4 income, or is one of you self-employed?`,
    },
    {
      role: 'user',
      content: `Both T4. What about the FHSA, is that something we should be using?`,
    },
    {
      role: 'assistant',
      content: `Yes, definitely worth looking at if you have not already opened them. The First Home Savings Account lets each of you contribute up to eight thousand a year, up to a forty thousand lifetime max, and withdrawals for a first home purchase are tax free. Two people can combine, so as a couple you can pull out eighty thousand plus any growth, on top of what you can use from an RRSP under the Home Buyers' Plan. Have you opened FHSAs yet, or is this something you would be starting?`,
    },
  ];
}

function topicRefinance(slots) {
  const { reason } = slots;
  return [
    {
      role: 'user',
      content: `I'm thinking about refinancing. ${reason}. Is now a good time?`,
    },
    {
      role: 'assistant',
      content: `It can be, but the right answer depends on a few things: how much is left on your current mortgage, the rate you are paying now, the penalty to break early if you are mid-term, and what you are trying to accomplish with the refinance. Refinancing in Canada lets you go up to eighty percent of your home's appraised value. Do you know roughly what your current rate is and where you are in your term?`,
    },
    {
      role: 'user',
      content: `We're about two years into a five year fixed at 5.4%. What's the break penalty likely to be?`,
    },
    {
      role: 'assistant',
      content: `On a fixed mortgage with a major bank, the penalty is typically the greater of three months of interest or the Interest Rate Differential. The IRD can swing widely depending on how rates have moved since you signed, and the exact formula varies by lender. We can run actual numbers for you on a quick call, comparing the break-and-refinance math against staying put or doing a blend-and-extend.`,
    },
  ];
}

function topicSelfEmployed(slots) {
  return [
    {
      role: 'user',
      content: `I run my own business and my accountant writes off everything she can, so my reported income is low. Can I still get a mortgage?`,
    },
    {
      role: 'assistant',
      content: `Yes, you have options. Traditional A lenders look at your Line 15000 income from your tax returns, so heavy write-offs can hurt qualifying there. But alternative lenders run programs where they evaluate twelve to twenty-four months of business bank statements and add back paper depreciation to get a truer picture of cash flow. A lenders typically want two years of operating history and clean Notice of Assessments showing no balance owing to CRA. How long has the business been running, and are your personal and corporate taxes filed up to date?`,
    },
    {
      role: 'user',
      content: `Business is four years old, taxes are clean. Personal income is around 45k on paper but the business actually does about 180k.`,
    },
    {
      role: 'assistant',
      content: `Good, that is a strong story to work with. Four years of operating history and a clean CRA profile clear the basics, and the gap between paper income and real cash flow is exactly what alternative bank statement programs are designed to handle. Real numbers come out of pulling your bank statements and a deeper look. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicBadCredit(slots) {
  return [
    {
      role: 'user',
      content: `My credit score is around 580 after a rough year. Am I just out of luck on buying a home?`,
    },
    {
      role: 'assistant',
      content: `Not at all. With a score in that range, the major banks would likely decline, but alternative B lenders work specifically with credit profiles between 500 and 620 and look at the story behind the score, not just the number. They typically need at least twenty percent down because mortgage default insurance is reserved for prime lending. The plan is usually to use a one to three year alt mortgage to graduate back to an A lender once the credit is rebuilt. Do you know roughly how much you have saved for a down payment?`,
    },
    {
      role: 'user',
      content: `Around 60k. I'm looking at places in the 350-400k range.`,
    },
    {
      role: 'assistant',
      content: `That puts you in the ballpark, since sixty thousand is roughly fifteen to seventeen percent down at that price. To get to the twenty percent minimum that alternative lenders need, you would either need a bit more down or a gifted contribution from immediate family, or to look at slightly lower priced homes. This is the kind of file one of our brokers handles all the time. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicReverseMortgage(slots) {
  return [
    {
      role: 'user',
      content: `My parents are in their seventies, paid-off house in Mississauga worth maybe 1.2M. They want to free up cash but don't want to sell. Reverse mortgage?`,
    },
    {
      role: 'assistant',
      content: `Reverse mortgages can be a good fit in exactly that situation. Homeowners aged 55 or older can convert up to fifty-five percent of their home equity to tax-free cash with no required monthly payments, and they keep full ownership of the home. The two main providers in Ontario are HomeEquity Bank with the CHIP product, and Equitable Bank. Interest accrues against the balance over time, so the math is different from a regular mortgage. Have they thought about how much they would want to access, or whether they would prefer a lump sum versus a line of credit style?`,
    },
    {
      role: 'user',
      content: `They were thinking around 200k as a starting point.`,
    },
    {
      role: 'assistant',
      content: `That is well within range for a 1.2 million home and people in their seventies. The exact maximum depends on the age of the youngest borrower on title, the home's appraised value, and the property type. There is also a no-negative-equity guarantee so they can never owe more than the home is worth at sale. This is exactly something one of our brokers can walk them through properly. What's the best time of day for someone to reach out to them?`,
    },
  ];
}

function topicRenewal(slots) {
  const { weeks } = slots;
  return [
    {
      role: 'user',
      content: `My renewal is coming up in ${weeks} weeks and the bank sent me a letter with a rate that seems high. Should I just sign it?`,
    },
    {
      role: 'assistant',
      content: `Not without shopping first. Initial renewal letters typically show the bank's posted or standard retail rates, not their best discretionary rate. Renewing borrowers also have real leverage right now because both insured and uninsured borrowers can do a straight switch to a new lender without re-running the stress test. We can lock a rate hold up to one hundred and twenty days before your renewal date. What rate is the letter showing, and are you on a fixed or variable right now?`,
    },
    {
      role: 'user',
      content: `Fixed, they're offering 5.79%. I'm at 4.49% right now.`,
    },
    {
      role: 'assistant',
      content: `That posted offer is well above what is being written in the market right now for a renewal of your size. We work with lenders who would be likely beating that materially on a straight switch with no extra qualification. The faster move is getting an actual competing quote in front of you. This is something one of our brokers handles every day. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicRateInquiry(slots) {
  return [
    {
      role: 'user',
      content: `What's your best rate right now for a five year fixed?`,
    },
    {
      role: 'assistant',
      content: `Honest answer is I cannot quote a specific rate here. Live rates move with market conditions and with the borrower's profile (credit, down payment, property type, insured vs uninsured, lender, term). What I can say is the spread between posted bank rates and what is actually written through brokers tends to be meaningful, especially on insured purchases and renewals. Are you looking at a purchase, refinance, or a renewal?`,
    },
    {
      role: 'user',
      content: `Purchase, putting 20% down on a 700k condo in Toronto.`,
    },
    {
      role: 'assistant',
      content: `Got it, conventional twenty percent down on a 700k Toronto condo is a clean profile and there is a competitive market for that file. Building characteristics also matter on a condo (reserve fund health, owner-occupied ratio, age of the building), so the right rate gets locked once we know the property. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicConstruction(slots) {
  return [
    {
      role: 'user',
      content: `We bought a lot in Halton and want to build a custom home, around 1.4M total cost. Looking for construction financing.`,
    },
    {
      role: 'assistant',
      content: `Construction mortgages work differently from standard purchases. Funds get advanced in stages as construction milestones are hit, usually three to five draws across foundation, lockup, drywall, and completion. Ontario also has a mandatory ten percent lien holdback on every draw under the Construction Act, released sixty days after substantial completion if no liens are filed. Most prime lenders fund up to seventy-five or eighty percent of total cost on construction. Are you working with a Tarion-registered builder, or self-building?`,
    },
    {
      role: 'user',
      content: `Tarion registered. Builder estimate is in.`,
    },
    {
      role: 'assistant',
      content: `Good, that opens up traditional A-lender construction options. The other big requirement is a fixed-price contract with the builder, plus a contingency fund usually ten to twenty percent of the build cost in reserve for cost overruns. This is exactly the kind of file one of our brokers handles regularly. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicPreapproval(slots) {
  return [
    {
      role: 'user',
      content: `How does pre-approval work? My realtor is pushing me to get one before we keep looking.`,
    },
    {
      role: 'assistant',
      content: `A formal pre-approval is a full review of your income, credit, debts, and down payment by a lender, and locks in a specific rate hold (usually 90 to 120 days) so a market move doesn't hurt you. It is not the same as final approval. The lender still has to review the actual property before they fund. Your realtor is right that having one strengthens your offer, especially in competitive markets. Do you have a sense of price range and timeline, or are you still narrowing it down?`,
    },
    {
      role: 'user',
      content: `Looking up to 800k, want to be in something by spring.`,
    },
    {
      role: 'assistant',
      content: `That timeline gives you room to do this properly. To get a pre-approval moving we'd need a clean look at your last two pay stubs, employment letters, the last two Notices of Assessment, and proof of the down payment. That conversation usually takes about thirty minutes. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicHELOC(slots) {
  return [
    {
      role: 'user',
      content: `Considering pulling some equity out of our house to invest. How does a HELOC work?`,
    },
    {
      role: 'assistant',
      content: `A HELOC is a revolving line of credit secured against home equity, where you only pay interest on the amount actually drawn. As a standalone, it is capped at sixty-five percent loan to value of the home, but a combined mortgage and HELOC structure can go up to eighty percent loan to value as long as the revolving portion stays at sixty-five or below. There is also a specific Canadian strategy called the Smith Manoeuvre that uses a re-advanceable HELOC to convert non-deductible mortgage interest into tax-deductible investment loan interest. Are you using the equity strictly for investments, or also for renovations or debt consolidation?`,
    },
    {
      role: 'user',
      content: `Strictly investments. Pretty interested in the Smith Manoeuvre.`,
    },
    {
      role: 'assistant',
      content: `Good, that is exactly the use case it is built for, but the structural details are important to get right, especially around segregating the investment loan from personal balances so the CRA accepts the deduction. This is something one of our brokers walks people through regularly. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicNewToCanada(slots) {
  return [
    {
      role: 'user',
      content: `I moved to Canada from India eight months ago on a work permit. Can I buy a house here?`,
    },
    {
      role: 'assistant',
      content: `Yes, and rules have changed in your favor recently. Under current regulations, temporary residents with a valid Canadian work permit can access insured financing (under twenty percent down) if they meet the same credit and employment rules a permanent resident would. There are also specific New to Canada programs through alternative lenders that put less weight on domestic credit history if you have a twenty percent down payment available. How long are you employed in Canada, and roughly how much do you have saved for a down payment?`,
    },
    {
      role: 'user',
      content: `Working at the same company since I arrived, full time T4. Saved around 75k.`,
    },
    {
      role: 'assistant',
      content: `That is a workable profile. Eight months of clean Canadian employment plus seventy-five thousand opens up options in both prime and alternative programs depending on the price point and where you are looking. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicOutOfScope(slots) {
  // Visitor asks something off-corpus; assistant declines + redirects.
  const offerings = [
    {
      user: `Can you give me legal advice on disputing a property assessment?`,
      assistant: `I'm not able to give legal advice on a property assessment dispute, that one needs a real estate lawyer who can review the assessment and the appeal process for your municipality. We can absolutely help with anything mortgage related though, refinancing, renewals, equity takeout. Is there a mortgage angle I can help with?`,
    },
    {
      user: `What stocks should I invest in right now?`,
      assistant: `That is not something I can advise on, investment advice needs to come from a licensed financial advisor who knows your overall picture. We're here for the mortgage side. Is there anything mortgage related I can help with?`,
    },
    {
      user: `Can you tell me the exact penalty if I break my mortgage today?`,
      assistant: `Exact penalty numbers depend on your specific lender's IRD calculation, your contract rate, current posted rates, and the time remaining, so the only way to get an accurate figure is to call your lender or look at your most recent annual statement. We can walk through the math on a call once you have it. Want me to set that up?`,
      flagged: true,
    },
  ];
  return offerings[Math.floor(Math.random() * offerings.length)].user
    ? (() => {
        const choice = offerings[Math.floor(Math.random() * offerings.length)];
        return [
          { role: 'user', content: choice.user },
          {
            role: 'assistant',
            content: choice.assistant,
            flagged: choice.flagged === true,
          },
        ];
      })()
    : [];
}

function topicShortInquiry() {
  // Short visitor exits — abandoned conversation.
  const inquiries = [
    'Just looking, thanks',
    'Do you guys do mortgages?',
    'hi',
    'what hours are you open',
    'mortgage rates?',
  ];
  const choice = inquiries[Math.floor(Math.random() * inquiries.length)];
  return [
    { role: 'user', content: choice },
    {
      role: 'assistant',
      content: `Hi, yes, mortgages are exactly what we work on, everything from first-time purchases to refinancing, renewals, self-employed files, and alternative situations. What's bringing you here today?`,
    },
  ];
}

// Each topic returns a base set of turns. The lead funnel + capture
// are added on top by completeConversation().
const TOPIC_GENERATORS = [
  { name: 'first_time_buyer', weight: 18, gen: topicFirstTimeBuyer },
  { name: 'refinance', weight: 15, gen: topicRefinance },
  { name: 'self_employed', weight: 10, gen: topicSelfEmployed },
  { name: 'bad_credit', weight: 8, gen: topicBadCredit },
  { name: 'reverse_mortgage', weight: 6, gen: topicReverseMortgage },
  { name: 'renewal', weight: 12, gen: topicRenewal },
  { name: 'rate_inquiry', weight: 10, gen: topicRateInquiry },
  { name: 'construction', weight: 4, gen: topicConstruction },
  { name: 'preapproval', weight: 8, gen: topicPreapproval },
  { name: 'heloc', weight: 4, gen: topicHELOC },
  { name: 'new_to_canada', weight: 4, gen: topicNewToCanada },
  { name: 'out_of_scope', weight: 5, gen: topicOutOfScope },
  { name: 'short_inquiry', weight: 7, gen: topicShortInquiry },
];

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(weightedArr) {
  const total = weightedArr.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [val, w] of weightedArr) {
    roll -= w;
    if (roll <= 0) return val;
  }
  return weightedArr[weightedArr.length - 1][0];
}

function pickTopic() {
  const total = TOPIC_GENERATORS.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * total;
  for (const t of TOPIC_GENERATORS) {
    roll -= t.weight;
    if (roll <= 0) return t;
  }
  return TOPIC_GENERATORS[0];
}

function randomTimestampInPastDays(daysBack) {
  // Spread across the past `daysBack` days. Weighted toward business hours
  // (9am-7pm) and weekdays, but not exclusively.
  const now = Date.now();
  const dayOffset = Math.floor(Math.random() * daysBack);
  const date = new Date(now - dayOffset * 24 * 60 * 60 * 1000);

  // Weekday weighting: 80% weekdays, 20% weekend
  const day = date.getDay();
  if ((day === 0 || day === 6) && Math.random() > 0.2) {
    // Bump to Monday
    date.setDate(date.getDate() + (day === 0 ? 1 : 2));
  }

  // Hour weighting: 75% business hours (8am-8pm), 25% rest of day
  const businessHours = Math.random() < 0.75;
  const hour = businessHours
    ? 8 + Math.floor(Math.random() * 12)
    : Math.floor(Math.random() * 24);
  date.setHours(hour);
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));
  return date;
}

function pickName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function nameToEmail(name) {
  const parts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const providers = ['gmail.com', 'gmail.com', 'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.ca', 'icloud.com'];
  const sep = Math.random() < 0.5 ? '.' : '';
  return `${parts[0]}${sep}${parts[parts.length - 1]}${Math.floor(Math.random() * 90) + 10}@${pick(providers)}`;
}

function randomPhone() {
  const areas = ['416', '647', '437', '905', '289', '365', '613', '519', '226', '548'];
  const a = pick(areas);
  const b = String(Math.floor(Math.random() * 900) + 100);
  const c = String(Math.floor(Math.random() * 9000) + 1000);
  return `(${a}) ${b}-${c}`;
}

function randomVisitorId() {
  return 'v_' + Math.random().toString(36).slice(2, 12);
}

function downPaymentSituation() {
  const options = [
    'about 45k saved up between us',
    '70k from a recent inheritance',
    'roughly 30k saved and our parents might help with another 20',
    'a gift of 50k from family plus 25k of our own',
    'around 100k from selling our old place',
    'about 25k saved and we are not sure if that is enough',
  ];
  return pick(options);
}

function refinanceReason() {
  const options = [
    'rates are different now and our renewal is two years out',
    'we want to consolidate some credit card debt',
    'kitchen needs a redo and we would rather not use a credit line',
    'thinking about pulling equity to buy a rental',
    'we want to pay off a car loan that is eating our budget',
    'we just want to access some equity for general flexibility',
  ];
  return pick(options);
}

// ----------------------------------------------------------------------------
// Conversation completion: appends the funnel turns + capture turns +
// outcome, based on the desired terminal state.
// ----------------------------------------------------------------------------

function completeConversation(baseTurns, terminalState, slots) {
  const turns = [...baseTurns];

  if (terminalState === 'lead' || terminalState === 'booked') {
    // Visitor replies with their best time, then assistant collects name + phone.
    turns.push({ role: 'user', content: pick(TIME_OF_DAY_REPLIES) });
    turns.push({
      role: 'assistant',
      content: `Awesome. Two quick things before I pass this along: I forgot to ask your name earlier, what can I call you? And what's the best phone number for us to reach you at?`,
    });
    turns.push({
      role: 'user',
      content: `${slots.visitor.name}, ${slots.visitor.phone}`,
    });
    turns.push({
      role: 'assistant',
      content: `Got it, thanks ${slots.visitor.name.split(' ')[0]}. I'll pass this along to our team and one of our brokers will reach out at the time you mentioned. Anything else you want them to know before the call?`,
    });

    if (terminalState === 'booked') {
      turns.push({
        role: 'user',
        content: `Actually I'd rather just pick a time directly if I can.`,
      });
      turns.push({
        role: 'assistant',
        content: `Of course. You can pick a time that works for you here: https://cal.com/output-systems/mortgage. We'll be ready for you.`,
      });
    } else {
      turns.push({
        role: 'user',
        content: pick([
          'no that covers it, thank you',
          "just that we'd prefer to talk to someone soon",
          'we are pre-approved with another lender but want a second opinion',
          'just want straight talk, no pressure',
        ]),
      });
      turns.push({
        role: 'assistant',
        content: `Perfect, I'll include that in the brief. Talk soon.`,
      });
    }
  } else if (terminalState === 'abandoned') {
    // Just stop after the last assistant turn, sometimes with a flagged
    // last visitor message (one-word reply).
    if (Math.random() < 0.3) {
      turns.push({ role: 'user', content: pick(['ok', 'thx', 'hmm', 'sure', '?']) });
    }
  } else if (terminalState === 'unanswered') {
    // Add an unanswered visitor question at the end.
    turns.push({
      role: 'user',
      content: pick([
        'do you have a calculator for the exact penalty on my specific mortgage?',
        'what is the absolute lowest rate i could possibly get tomorrow',
        'can you tell me which specific lender will approve my file',
        'is my house value going to go up next year',
      ]),
    });
    turns.push({
      role: 'assistant',
      content: `Honestly that one needs a real review of your file (and in some cases external data we do not have on hand). One of our brokers can dig into specifics on a call. Want me to set that up?`,
      flagged: true,
    });
  }

  return turns;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function getTenant() {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', TENANT_SLUG)
    .single();
  if (error || !data) {
    console.error('Tenant not found:', TENANT_SLUG, error);
    process.exit(1);
  }
  return data;
}

async function wipePriorBatch(tenantId) {
  console.log(`Wiping prior batch tagged "${BATCH_TAG}" for tenant ${tenantId}...`);

  // Find conversations from this batch.
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .filter('metadata->>seed_batch', 'eq', BATCH_TAG);

  if (!conversations || conversations.length === 0) {
    console.log('  No prior batch to clean.');
    return;
  }

  const convIds = conversations.map((c) => c.id);
  console.log(`  Found ${convIds.length} prior batch conversations, deleting...`);

  // Cascading delete: messages and handoffs cascade on conversation delete.
  // Leads and bookings have ON DELETE SET NULL on conversation_id, so they
  // get orphaned. Delete the dependent rows tagged with the same batch
  // explicitly via metadata or via conversation_id IN list.
  await supabase.from('bookings').delete().in('conversation_id', convIds);
  await supabase.from('handoffs').delete().in('conversation_id', convIds);
  await supabase.from('leads').delete().in('conversation_id', convIds);
  await supabase.from('conversations').delete().in('id', convIds);
  console.log('  Wipe complete.');
}

function generateConversation(index, tenantId) {
  // Pick a topic, build base turns, then decide on a terminal state.
  const topic = pickTopic();

  // Slot fills (some topics use these, some ignore).
  const slots = {
    city: pick(ONTARIO_CITIES),
    downPaymentSituation: downPaymentSituation(),
    reason: refinanceReason(),
    weeks: pick(['3', '5', '6', '7', '8', '10']),
    visitor: {
      name: pickName(),
      phone: randomPhone(),
    },
  };

  const baseTurns = topic.gen(slots);
  if (baseTurns.length === 0) {
    // Topic produced nothing; fall back to short_inquiry.
    return generateConversation(index, tenantId);
  }

  // Decide the terminal state. Distribution targets:
  //   ~12% booked   ~17% lead (no booking)   ~10% unanswered-flagged   ~25% abandoned
  //   ~36% completed (full helpful exchange, no capture)
  let terminalState;
  if (topic.name === 'short_inquiry') {
    // Short inquiries almost always abandon.
    terminalState = Math.random() < 0.85 ? 'abandoned' : 'lead';
  } else if (topic.name === 'out_of_scope') {
    // Out of scope often has unanswered flag, sometimes lead.
    const r = Math.random();
    terminalState = r < 0.45 ? 'unanswered' : r < 0.65 ? 'abandoned' : r < 0.85 ? 'completed' : 'lead';
  } else {
    const r = Math.random();
    terminalState =
      r < 0.12 ? 'booked'
      : r < 0.30 ? 'lead'
      : r < 0.40 ? 'unanswered'
      : r < 0.60 ? 'abandoned'
      : 'completed';
  }

  const turns = completeConversation(baseTurns, terminalState, slots);

  // Timestamp + per-turn timing.
  const startedAt = randomTimestampInPastDays(30);
  const turnIntervalSec = 25 + Math.random() * 90;
  const messages = turns.map((t, i) => ({
    role: t.role,
    content: t.content,
    flagged_unanswered: t.flagged === true,
    model: t.role === 'assistant' ? 'claude-sonnet-4-6' : null,
    input_tokens: t.role === 'assistant' ? 800 + Math.floor(Math.random() * 1200) : null,
    output_tokens: t.role === 'assistant' ? 80 + Math.floor(Math.random() * 200) : null,
    created_at: new Date(startedAt.getTime() + i * turnIntervalSec * 1000).toISOString(),
  }));

  const lastMessageAt = new Date(messages[messages.length - 1].created_at);
  const outcome = (() => {
    switch (terminalState) {
      case 'booked':
        return 'booked';
      case 'lead':
        return 'escalated';
      case 'completed':
        return 'completed';
      case 'unanswered':
        return Math.random() < 0.5 ? 'abandoned' : 'completed';
      case 'abandoned':
      default:
        return 'abandoned';
    }
  })();

  const conversation = {
    tenant_id: tenantId,
    visitor_id: randomVisitorId(),
    page_context: pickWeighted(PAGE_CONTEXTS),
    referrer: Math.random() < 0.4 ? 'https://www.google.com/' : null,
    user_agent: pick([
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; SM-G998U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
    ]),
    ip_address: null,
    started_at: startedAt.toISOString(),
    ended_at: lastMessageAt.toISOString(),
    message_count: messages.length,
    outcome,
    source: pickWeighted(SOURCES),
    metadata: { seed_batch: BATCH_TAG, topic: topic.name, terminal: terminalState },
  };

  return { conversation, messages, terminalState, slots, topic: topic.name };
}

async function insertConversation(record) {
  const { conversation, messages, terminalState, slots } = record;

  const { data: convRow, error: convErr } = await supabase
    .from('conversations')
    .insert(conversation)
    .select('id')
    .single();
  if (convErr) throw new Error('conversation insert failed: ' + convErr.message);
  const conversationId = convRow.id;

  // Insert messages.
  const messagesWithConvId = messages.map((m) => ({
    conversation_id: conversationId,
    role: m.role,
    content: m.content,
    flagged_unanswered: m.flagged_unanswered,
    model: m.model,
    input_tokens: m.input_tokens,
    output_tokens: m.output_tokens,
    created_at: m.created_at,
  }));
  const { error: msgErr } = await supabase.from('messages').insert(messagesWithConvId);
  if (msgErr) throw new Error('messages insert failed: ' + msgErr.message);

  let leadId = null;

  // If terminal state implies contact capture, create a lead.
  if (terminalState === 'lead' || terminalState === 'booked') {
    const visitorName = slots.visitor.name;
    const { data: leadRow, error: leadErr } = await supabase
      .from('leads')
      .insert({
        tenant_id: conversation.tenant_id,
        conversation_id: conversationId,
        name: visitorName,
        email: Math.random() < 0.55 ? nameToEmail(visitorName) : null, // ~55% give email too
        phone: slots.visitor.phone,
        source: 'chatbot',
        status: terminalState === 'booked' ? 'routed' : 'new',
        raw_payload: {
          seed_batch: BATCH_TAG,
          bestTime: messages.find((m) => m.role === 'user' && TIME_OF_DAY_REPLIES.includes(m.content))?.content,
        },
        created_at: conversation.ended_at,
        updated_at: conversation.ended_at,
      })
      .select('id')
      .single();
    if (leadErr) throw new Error('lead insert failed: ' + leadErr.message);
    leadId = leadRow.id;
  }

  // If booked, create a booking row + handoff.
  if (terminalState === 'booked') {
    const endedAt = new Date(conversation.ended_at);
    const meetingTime = new Date(endedAt.getTime() + (1 + Math.random() * 14) * 24 * 60 * 60 * 1000);
    // Push meeting time to a business hour
    meetingTime.setHours(9 + Math.floor(Math.random() * 8), Math.random() < 0.5 ? 0 : 30, 0, 0);

    const { data: bookingRow, error: bookErr } = await supabase
      .from('bookings')
      .insert({
        tenant_id: conversation.tenant_id,
        conversation_id: conversationId,
        lead_id: leadId,
        cal_booking_id: 'demo_' + Math.random().toString(36).slice(2, 14),
        attendee_name: slots.visitor.name,
        attendee_email: nameToEmail(slots.visitor.name),
        attendee_company: null,
        meeting_time: meetingTime.toISOString(),
        meeting_duration_minutes: 30,
        meeting_type: 'Mortgage discovery call',
        status: meetingTime.getTime() < Date.now() ? pick(['completed', 'completed', 'no_show']) : 'scheduled',
        prep_brief: { seed_batch: BATCH_TAG, topic: record.topic },
      })
      .select('id')
      .single();
    if (bookErr) throw new Error('booking insert failed: ' + bookErr.message);

    // Handoff summary.
    const summaryByTopic = {
      first_time_buyer: 'First-time buyer couple looking in their target city, T4 income on both sides, exploring FHSA and HBP strategy. Wants pre-qualification numbers.',
      refinance: 'Existing homeowner mid-term on a fixed mortgage, exploring refinance vs blend-and-extend.',
      self_employed: 'Self-employed borrower with strong revenue but low declared income, candidate for bank statement program.',
      bad_credit: 'Credit-impaired borrower with twenty percent down, looking at alternative B lending with a credit rebuild path.',
      reverse_mortgage: 'Senior household with significant equity, exploring CHIP-style reverse mortgage for liquidity.',
      renewal: 'Mortgage renewal coming up, current lender offering above-market rate. Strong candidate for a straight switch.',
      rate_inquiry: 'Rate shopper with 20% down on a Toronto condo purchase, full pre-qual conversation needed.',
      construction: 'Custom build on owned lot, Tarion-registered builder, looking for construction draw financing.',
      preapproval: 'Buyer in 30 to 90 day window, wants formal pre-approval and rate hold.',
      heloc: 'Equity-rich borrower exploring HELOC for investment use, mentioned Smith Manoeuvre.',
      new_to_canada: 'Newcomer borrower with valid work permit, employed eight-plus months, has savings for down payment.',
      out_of_scope: 'Borrower had an out-of-scope question; redirected to mortgage discussion.',
    };
    const summary = summaryByTopic[record.topic] || 'Mortgage conversation ready for follow-up.';
    const { error: hoErr } = await supabase.from('handoffs').insert({
      tenant_id: conversation.tenant_id,
      conversation_id: conversationId,
      booking_id: bookingRow.id,
      lead_id: leadId,
      summary,
      topics: [record.topic.replace(/_/g, ' ')],
      flagged_questions: [],
      sentiment: pick(['positive', 'positive', 'neutral', 'positive']),
      delivered_to: 'connect@output.systems',
      delivered_at: conversation.ended_at,
    });
    if (hoErr) throw new Error('handoff insert failed: ' + hoErr.message);
  }
}

async function main() {
  console.log(`Seeding ${TOTAL_CONVERSATIONS} mortgage-broker demo conversations...`);
  const tenant = await getTenant();
  console.log(`Tenant: ${tenant.slug} (${tenant.id})`);

  await wipePriorBatch(tenant.id);

  const stats = { booked: 0, lead: 0, unanswered: 0, abandoned: 0, completed: 0 };

  for (let i = 0; i < TOTAL_CONVERSATIONS; i++) {
    const record = generateConversation(i, tenant.id);
    await insertConversation(record);
    stats[record.terminalState] = (stats[record.terminalState] || 0) + 1;
    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/${TOTAL_CONVERSATIONS} inserted`);
    }
  }

  console.log('\nDone. Terminal-state distribution:');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k.padEnd(12)} ${v}`);
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
