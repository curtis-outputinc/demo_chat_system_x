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
  const opener = pick([
    `Hi, my partner and I want to buy our first place in ${city}. We have ${downPaymentSituation}. Where do we even start?`,
    `hey, me and my partner are looking at buying our first home in ${city}. we have ${downPaymentSituation}. not sure where to start`,
    `we want to buy our first home in ${city}, have ${downPaymentSituation} ready. what do we do first?`,
  ]);
  return [
    { role: 'user', content: opener },
    {
      role: 'assistant',
      content: `Nice, big step. The first thing to do is get pre-qualified. That tells you the max price you can shop at, based on your income, credit, savings, and any debts you have. With less than 20% down, your mortgage needs insurance, and the minimum down payment depends on the price. Are you both on regular paychecks, or is one of you self-employed?`,
    },
    {
      role: 'user',
      content: pick([
        `Both on regular paychecks. What about the FHSA, should we be using that?`,
        `both T4. is the FHSA something we should look at`,
        `both salaried. how does the fhsa fit in`,
      ]),
    },
    {
      role: 'assistant',
      content: `Yes, if you haven't opened one already. The FHSA lets each of you put in up to $8,000 a year, with a $40,000 lifetime cap. When you pull the money out for your first home, it's tax free. As a couple you can stack up to $80,000 plus any growth, on top of what you can pull from your RRSP under the Home Buyers' Plan. Have you opened FHSAs yet?`,
    },
  ];
}

function topicRefinance(slots) {
  const { reason } = slots;
  const opener = pick([
    `I'm thinking about refinancing. ${reason}. Is now a good time?`,
    `thinking about refinancing - ${reason}. is now a decent time?`,
    `looking to refinance because ${reason}. good idea right now?`,
  ]);
  return [
    { role: 'user', content: opener },
    {
      role: 'assistant',
      content: `Depends on a few things: how much you still owe, the rate you're paying now, the penalty to break early if you're mid-term, and what you want the refinance to do for you. In Canada you can refinance up to 80% of your home's value. Do you know roughly what your current rate is and where you are in your term?`,
    },
    {
      role: 'user',
      content: pick([
        `We're about two years into a five year fixed at 5.4%. What's the break penalty likely to be?`,
        `about 2 years into a 5 year fixed at 5.4. how bad is the penalty usually`,
        `2yrs into 5yr fixed @ 5.4%. what kind of penalty am i looking at`,
      ]),
    },
    {
      role: 'assistant',
      content: `On a fixed mortgage with a big bank, the penalty is usually the higher of two numbers: three months of interest, or the IRD (the rate-difference penalty). The IRD can swing a lot based on how rates have moved since you signed, and every lender does it a bit differently. We can run real numbers for you on a quick call and compare staying put vs. breaking and refinancing.`,
    },
  ];
}

function topicSelfEmployed(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `I run my own business and my accountant writes off everything she can, so my reported income is low. Can I still get a mortgage?`,
        `self employed here. my accountant writes off a ton so my taxable income is low. can i still get a mortgage?`,
        `i'm self-employed. accountant writes off as much as possible so on paper i look broke lol. is a mortgage doable?`,
      ]),
    },
    {
      role: 'assistant',
      content: `Yes. Big banks usually look at the income on your tax return, so heavy write-offs can hurt you there. But alternative lenders run programs where they look at 12 to 24 months of business bank statements instead, and add back things like vehicle write-offs to get a real picture of your cash flow. Big banks usually want 2 years of business history and a clean tax record with no balance owing to CRA. How long has the business been running, and are your taxes filed and paid up?`,
    },
    {
      role: 'user',
      content: pick([
        `Business is four years old, taxes are clean. Personal income is around 45k on paper but the business actually does about 180k.`,
        `4 years in, taxes clean. paper income around 45k, real business does close to 180k`,
        `business is 4yrs old, taxes paid up. shows 45k on my return but actually pulls in about 180k`,
      ]),
    },
    {
      role: 'assistant',
      content: `Good, that's a strong story to work with. Four years in business plus clean taxes covers the basics, and the gap between paper income and real cash flow is exactly what bank statement programs are built for. Real numbers come out of pulling your statements and taking a closer look. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicBadCredit(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `My credit score is around 580 after a rough year. Am I just out of luck on buying a home?`,
        `credit score is around 580 after a tough year. am i done as far as buying a home?`,
        `my score is sitting around 580 right now. is buying a house basically off the table`,
      ]),
    },
    {
      role: 'assistant',
      content: `Not at all. At that score, the big banks would likely say no, but B lenders work with scores from about 500 to 620 and care more about the story behind the number than the number itself. They usually need at least 20% down, because the kind of insurance that lets you put less down doesn't kick in at those scores. The usual play is to use a 1 to 3 year mortgage with them while you rebuild credit, and then move back to a big bank. How much do you have saved for a down payment?`,
    },
    {
      role: 'user',
      content: pick([
        `Around 60k. I'm looking at places in the 350-400k range.`,
        `around 60k saved. places i'm looking at are 350-400k`,
        `~60k. looking around 350-400k`,
      ]),
    },
    {
      role: 'assistant',
      content: `That puts you close. 60k on a 350 to 400k home is about 15 to 17% down. To get to the 20% B lenders need, you'd either need a bit more saved, a gift from family, or to look at lower priced homes. This is the kind of file one of our brokers handles all the time. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicReverseMortgage(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `My parents are in their seventies, paid-off house in Mississauga worth maybe 1.2M. They want to free up cash but don't want to sell. Reverse mortgage?`,
        `my parents are in their 70s, house in mississauga is paid off, worth around 1.2m. they want cash but don't want to sell. is a reverse mortgage worth looking at?`,
        `parents are in their 70s, own a 1.2m place outright in mississauga. they want some cash without selling. reverse mortgage a fit?`,
      ]),
    },
    {
      role: 'assistant',
      content: `Could be a good fit. People 55 or older can pull up to 55% of their home's value out as tax-free cash, with no monthly payments. They keep the house. The two main lenders in Ontario are HomeEquity Bank (the CHIP product) and Equitable Bank. Interest adds to the balance over time, so the math is different from a regular mortgage. Have they thought about how much they'd want to access, and whether they'd take it all at once or as a line of credit?`,
    },
    {
      role: 'user',
      content: pick([
        `They were thinking around 200k as a starting point.`,
        `they're thinking around 200k to start`,
        `200k to start was the number they had in mind`,
      ]),
    },
    {
      role: 'assistant',
      content: `That's well within range for a 1.2M home with people in their 70s. The exact max depends on the age of the youngest owner, the home's appraised value, and the property type. There's also a no-negative-equity guarantee, so they can never owe more than the home is worth when it sells. This is exactly something one of our brokers can walk them through. What's the best time of day for someone to reach out to them?`,
    },
  ];
}

function topicRenewal(slots) {
  const { weeks } = slots;
  return [
    {
      role: 'user',
      content: pick([
        `My renewal is coming up in ${weeks} weeks and the bank sent me a letter with a rate that seems high. Should I just sign it?`,
        `renewal is in ${weeks} weeks, bank sent a letter with a rate that looks high. should i just sign or no?`,
        `${weeks} weeks until renewal. the bank's offer feels high. sign it or shop around?`,
      ]),
    },
    {
      role: 'assistant',
      content: `Not without shopping first. Those letters usually show the bank's posted rate, not their best one. There's also a rule right now that lets you switch to a different lender at renewal without redoing the stress test, which gives you real leverage. We can hold a rate for you up to 120 days before your renewal date. What rate is the letter showing, and are you on a fixed or variable right now?`,
    },
    {
      role: 'user',
      content: pick([
        `Fixed, they're offering 5.79%. I'm at 4.49% right now.`,
        `fixed. they're offering 5.79 - i'm on 4.49 now`,
        `5.79 fixed offered. currently at 4.49`,
      ]),
    },
    {
      role: 'assistant',
      content: `That offer is well above where the market is on renewals your size right now. We work with lenders who would likely beat that by a decent chunk on a straight switch, with no extra paperwork. The fastest move is getting a real competing quote in front of you. This is something one of our brokers handles every day. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicRateInquiry(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `What's your best rate right now for a five year fixed?`,
        `whats your best 5 year fixed rate?`,
        `best 5yr fixed you can do right now?`,
        `lowest rate you can get me on a 5 year fixed`,
      ]),
    },
    {
      role: 'assistant',
      content: `Honest answer: I can't quote a rate here. Live rates move with the market and with your specific situation (credit, down payment, property type, insured or not, lender, term). What I can say is the gap between posted bank rates and what gets written through brokers is real, especially on insured purchases and renewals. Are you looking at a purchase, a refinance, or a renewal?`,
    },
    {
      role: 'user',
      content: pick([
        `Purchase, putting 20% down on a 700k condo in Toronto.`,
        `purchase. 20% down on a 700k condo in toronto`,
        `buying. toronto condo around 700k, 20% down`,
      ]),
    },
    {
      role: 'assistant',
      content: `Good profile. 20% down on a 700k Toronto condo is clean, and there's a lot of competition for files like that. The condo itself also matters (reserve fund, owner-occupied ratio, building age), so the final rate gets locked once we know the building. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicConstruction(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `We bought a lot in Halton and want to build a custom home, around 1.4M total cost. Looking for construction financing.`,
        `bought a lot in halton. want to build, total cost around 1.4m. need construction financing`,
        `we have a lot in halton and are building custom. 1.4m total. looking at construction loans`,
      ]),
    },
    {
      role: 'assistant',
      content: `Construction mortgages work differently from regular ones. The money is released in stages as the build hits milestones, usually 3 to 5 draws (foundation, lockup, drywall, finished). In Ontario the lender also holds back 10% of every draw for 60 days after substantial completion, in case any subtrades file a lien. Most prime lenders fund up to 75 or 80% of the total build cost. Are you using a Tarion-registered builder, or building yourself?`,
    },
    {
      role: 'user',
      content: pick([
        `Tarion registered. Builder estimate is in.`,
        `tarion-registered builder, estimate is in`,
        `going with a tarion builder. estimate is done`,
      ]),
    },
    {
      role: 'assistant',
      content: `Good, that opens up regular A-lender options. The other big thing they'll want is a fixed-price contract with the builder, plus 10 to 20% of the build cost set aside in case things go over. This is exactly the kind of file one of our brokers handles regularly. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicPreapproval(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `How does pre-approval work? My realtor is pushing me to get one before we keep looking.`,
        `how does a pre-approval work? realtor is pushing me to get one`,
        `whats the deal with pre-approval. our agent wants us to get one`,
      ]),
    },
    {
      role: 'assistant',
      content: `A pre-approval is a full review of your income, credit, debts, and down payment, and it locks in a rate for 90 to 120 days so a market jump doesn't hurt you. It's not the same as final approval - the lender still needs to look at the actual home you choose. Your realtor is right that having one makes your offer stronger, especially in a busy market. Do you have a sense of your price range and timeline?`,
    },
    {
      role: 'user',
      content: pick([
        `Looking up to 800k, want to be in something by spring.`,
        `up to 800k, hoping to be in a place by spring`,
        `looking up to about 800. want to move by spring`,
      ]),
    },
    {
      role: 'assistant',
      content: `That timeline gives you room to do this right. To start a pre-approval we'd need your last two pay stubs, employment letters, your last two tax filings (Notices of Assessment), and proof of your down payment. The conversation usually takes about 30 minutes. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicHELOC(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `Considering pulling some equity out of our house to invest. How does a HELOC work?`,
        `thinking about pulling equity from our home to invest. how does a heloc work`,
        `want to pull some equity for investing. how do helocs work`,
      ]),
    },
    {
      role: 'assistant',
      content: `A HELOC is a line of credit tied to your home equity. You only pay interest on what you actually pull out. On its own it caps at 65% of your home's value, but if you combine it with a regular mortgage you can go up to 80%, as long as the line part stays at 65 or below. There's also a Canadian strategy called the Smith Manoeuvre that uses a special kind of HELOC to make the interest tax-deductible when the money is used for investments. Are you using the equity just for investing, or also for renos or paying down debt?`,
    },
    {
      role: 'user',
      content: pick([
        `Strictly investments. Pretty interested in the Smith Manoeuvre.`,
        `just investing. smith manoeuvre is on my radar`,
        `investments only. interested in the smith manoeuvre`,
      ]),
    },
    {
      role: 'assistant',
      content: `Good, that's exactly the use case it's built for. The setup details matter though, especially keeping the investment loan separate from personal balances so the CRA actually accepts the deduction. This is something one of our brokers walks people through often. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicNewToCanada(slots) {
  return [
    {
      role: 'user',
      content: pick([
        `I moved to Canada from India eight months ago on a work permit. Can I buy a house here?`,
        `moved to canada from india 8 months ago on a work permit. can i buy a house here yet?`,
        `i'm on a canadian work permit, been here 8 months. is it possible to buy a home?`,
      ]),
    },
    {
      role: 'assistant',
      content: `Yes, and the rules have changed in your favor recently. People on a Canadian work permit can get an insured mortgage (under 20% down) if they meet the same credit and employment rules a permanent resident would. There are also New to Canada programs through alternative lenders that don't lean as hard on your Canadian credit history if you have 20% down ready. How long have you been working in Canada, and roughly how much have you saved?`,
    },
    {
      role: 'user',
      content: pick([
        `Working at the same company since I arrived, full time T4. Saved around 75k.`,
        `same company since i arrived, full-time. saved about 75k`,
        `been at the same job since i got here. about 75k saved`,
      ]),
    },
    {
      role: 'assistant',
      content: `That's a workable profile. 8 months on the same job plus 75k saved opens up options in both regular and alternative programs, depending on the price point and the area. This is something one of our brokers can definitely help you with. What's the best time of day for someone to reach out to you?`,
    },
  ];
}

function topicOutOfScope(slots) {
  // Visitor asks something off-corpus; assistant declines + redirects.
  const offerings = [
    {
      user: `can you give me legal advice on disputing a property assessment?`,
      assistant: `That one needs a real estate lawyer, not us. The appeal process is different in every city. We're happy to help with anything mortgage related though, like refinancing, renewals, or pulling equity out. Is there anything on that side I can help with?`,
    },
    {
      user: `what stocks should I invest in right now?`,
      assistant: `Not something I can help with. That's a question for a licensed financial advisor who knows your full picture. We stick to the mortgage side. Anything mortgage related I can help with?`,
    },
    {
      user: `can you tell me the exact penalty if I break my mortgage today?`,
      assistant: `Exact penalty numbers depend on your lender, your contract rate, today's posted rates, and how much time is left on your term. The only way to get the real number is to call your lender or check your latest statement. Once you have it, we can walk through the math on a call. Want me to set one up?`,
      flagged: true,
    },
  ];
  const choice = offerings[Math.floor(Math.random() * offerings.length)];
  return [
    { role: 'user', content: choice.user },
    {
      role: 'assistant',
      content: choice.assistant,
      flagged: choice.flagged === true,
    },
  ];
}

function topicShortInquiry() {
  // Short visitor exits — abandoned conversation.
  const inquiries = [
    'just looking, thanks',
    'do you guys do mortgages?',
    'hi',
    'what hours are you open',
    'mortgage rates?',
    'do you do renewals',
    'hey',
    'are you guys real',
  ];
  const choice = inquiries[Math.floor(Math.random() * inquiries.length)];
  return [
    { role: 'user', content: choice },
    {
      role: 'assistant',
      content: `Hey, yes, mortgages are what we do. First-time purchases, refinancing, renewals, self-employed files, all of it. What's bringing you here today?`,
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
    'about 45k saved between us',
    '70k from a recent inheritance',
    'around 30k saved, our parents might help with another 20',
    'a 50k gift from family plus 25k of our own',
    'around 100k from selling our old place',
    'about 25k saved, not sure if that\'s enough',
    'roughly 60k between savings and a gift',
  ];
  return pick(options);
}

function refinanceReason() {
  const options = [
    "rates are different now and we still have a couple years to go",
    'we want to roll some credit card debt into the mortgage',
    "the kitchen needs a redo and we'd rather not use a credit line",
    'thinking about pulling equity to buy a rental',
    "we want to pay off a car loan that's eating our budget",
    'just want to pull some equity for flexibility',
    "rates have moved and we're curious what's possible",
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
      content: `Awesome. Two quick things before I pass this along. I forgot to ask your name earlier, what's your name? And what's the best phone number to reach out to you? It'll be a no-obligation call, just to chat through your situation.`,
    });
    turns.push({
      role: 'user',
      content: `${slots.visitor.name}, ${slots.visitor.phone}`,
    });
    turns.push({
      role: 'assistant',
      content: `Got it, thanks ${slots.visitor.name.split(' ')[0]}. I'll pass this along and one of our brokers will reach out around the time you mentioned. Anything you'd want them to know ahead of the call?`,
    });

    if (terminalState === 'booked') {
      turns.push({
        role: 'user',
        content: pick([
          `actually i'd rather just pick a time myself if i can`,
          `can i just book a time directly?`,
          `is there a link i can use to pick the time myself`,
        ]),
      });
      turns.push({
        role: 'assistant',
        content: `Of course. You can pick a time that works for you here: https://cal.com/output-systems/mortgage. We'll be ready when you are.`,
      });
    } else {
      turns.push({
        role: 'user',
        content: pick([
          'no that covers it, thank you',
          "just that we'd like to talk soon",
          `we have a pre-approval with another lender, just want a second look`,
          `nothing else really, just straight talk would be great`,
          `nope thanks`,
          `just keen to get going`,
        ]),
      });
      turns.push({
        role: 'assistant',
        content: pick([
          `Perfect, I'll add that to the note. Talk soon.`,
          `Got it. Talk soon.`,
          `Sounds good. We'll be in touch.`,
        ]),
      });
    }
  } else if (terminalState === 'abandoned') {
    // Just stop after the last assistant turn, sometimes with a short visitor reply.
    if (Math.random() < 0.3) {
      turns.push({ role: 'user', content: pick(['ok', 'thx', 'hmm', 'sure', '?', 'k', 'cool']) });
    }
  } else if (terminalState === 'unanswered') {
    // Add an unanswered visitor question at the end.
    turns.push({
      role: 'user',
      content: pick([
        'do you have a calculator for the exact penalty on my mortgage?',
        'what is the lowest rate i could possibly get tomorrow',
        'can you tell me which lender will approve my file for sure',
        'is my house going to go up in value next year',
        'will i be approved',
        `whats the cheapest rate possible right now`,
      ]),
    });
    turns.push({
      role: 'assistant',
      content: `Honestly that one needs a real look at your file. One of our brokers can dig in on a quick, no-obligation call. Want me to set one up?`,
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
