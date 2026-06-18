import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * The vertical config layer.
 *
 * Every demo deploy serves exactly one vertical (injury-lawyer, mortgage-broker,
 * real-estate, etc.), chosen by the VERTICAL env var. The engine code in app/ and
 * lib/ is identical across verticals; everything that differs lives in
 *   verticals/<VERTICAL>/config.json   (this file)
 *   verticals/<VERTICAL>/behaviors.md  (tone + behavioral patterns)
 *   verticals/<VERTICAL>/corpus/*.md   (knowledge base)
 *
 * This module loads config.json on the server, caches it, and exposes a
 * client-safe subset (getPublicConfig) that server components pass to the Chat
 * client component as props. Nothing here is secret — secrets stay in env.
 */

export const ACTIVE_VERTICAL = process.env.VERTICAL ?? 'demo';

export interface ModeCopy {
  /** Button label, e.g. "Client side" or "Lawyer side". */
  label: string;
  /** One-line explanation under the button. */
  blurb: string;
  /** Opening line the chat shows when this mode is active. */
  greeting: string;
  /** Suggested-question chips for this mode. */
  chips: string[];
}

export interface ApprovedLink {
  url: string;
  label: string;
}

/** The full config (server-side). All fields are non-secret. */
export interface VerticalConfig {
  /** Slug, equals the VERTICAL env var and the Supabase tenant slug. */
  vertical: string;
  /** The demo business name shown to visitors, e.g. "Riverside Injury Law". */
  brandName: string;
  /** The trade/profession, lowercased, e.g. "injury lawyer". Used in copy. */
  trade: string;
  /** What WE call the product when the prospect explores in professional mode. */
  productName: string;
  /** Accent color (hex). Defaults to the template teal. */
  accentColor: string;
  /** Path under public/ for the brand logo (used on the configured theme). */
  logoPath: string;
  /** Logo variant for a dark background, used when the split layout is dark. */
  logoDark: string;
  /** Public site URL for this deploy, e.g. https://lawyers.output.systems. */
  siteUrl: string;
  /** Cal.com (or other) booking link. */
  bookingUrl: string;
  /** Privacy policy URL shown in the chat footer (optional). */
  privacyUrl: string;
  /** Consent line shown above the opening greeting. */
  consentText: string;
  /** The two demo lenses. `client` label is constant; `professional` swaps per trade. */
  modes: {
    client: ModeCopy;
    professional: ModeCopy;
  };
  /** URLs the chatbot is allowed to surface, with friendly labels for the UI. */
  approvedLinks: ApprovedLink[];
  /** Vendor names the chatbot must never reveal (post-flight leak detection). */
  forbiddenVendors: string[];
  /**
   * How the assistant offers to connect a visitor with the business.
   * "book-and-share" (default): the locked two-option flow (share details in
   * chat or book a call). "book-only": booking link only, never collect or
   * forward personal details in chat. Use for sensitive verticals.
   */
  contactFlow: 'book-and-share' | 'book-only';
  /** Public landing layout. "centered" (default) or "split" (hero left, chat right). */
  layout: 'centered' | 'split';
  /** Visual theme for the public chat surface. "dark" (default) or "light". */
  theme: 'dark' | 'light';
  /** Path under public/ for the split-layout hero image. Empty = solid panel. */
  heroImage: string;
  /**
   * Optional disclaimer block rendered below the booking button on the empty
   * state. `checkbox` shows next to a purely visual (non-enforcing) checkbox;
   * `footer` is a plain statement below it. Omit to hide entirely.
   */
  disclaimer?: {
    checkbox: string;
    footer?: string;
  };
}

/** The client-safe subset handed to browser components. Currently == full config (no secrets). */
export type PublicVerticalConfig = VerticalConfig;

const DEFAULT_ACCENT = '#1ae0cb';

// Fallback used when verticals/<VERTICAL>/config.json is missing or partial, so
// the app still boots (dev, typecheck, first deploy before a vertical is wired).
const DEFAULT_CONFIG: VerticalConfig = {
  vertical: ACTIVE_VERTICAL,
  brandName: 'Demo Business',
  trade: 'business',
  productName: 'intelligent website assistant',
  accentColor: DEFAULT_ACCENT,
  logoPath: '/logo.png',
  logoDark: '/logo.png',
  siteUrl: 'https://demo.output.systems',
  bookingUrl: 'https://cal.com/output-systems',
  privacyUrl: '',
  consentText:
    'By chatting, you consent to your messages being used to answer your questions and follow up if you book a call. This is a demonstration system.',
  modes: {
    client: {
      label: 'Client side',
      blurb: 'Ask what your customers would ask.',
      greeting: 'Hi, how can I help you today?',
      chips: [
        'What are your hours?',
        'Where are you located?',
        'How do I get started?',
        'Can you help with my situation?',
      ],
    },
    professional: {
      label: 'Owner side',
      blurb: 'See how this assistant works for your business.',
      greeting: 'Hey, want to see how this assistant could work for your business?',
      chips: [
        'How would this help my business?',
        'What can it do?',
        'How does it handle my customers?',
        'What does it cost?',
      ],
    },
  },
  approvedLinks: [],
  contactFlow: 'book-and-share',
  layout: 'centered',
  theme: 'dark',
  heroImage: '',
  forbiddenVendors: [
    'Anthropic',
    'Claude',
    'Supabase',
    'Vercel',
    'Next.js',
    'Resend',
    'Twilio',
    'Voyage',
    'OpenAI',
    'GPT-4',
    'GPT-5',
    'pgvector',
  ],
};

let cached: VerticalConfig | null = null;

function deepMergeConfig(base: VerticalConfig, override: Partial<VerticalConfig>): VerticalConfig {
  return {
    ...base,
    ...override,
    modes: {
      client: { ...base.modes.client, ...(override.modes?.client ?? {}) },
      professional: { ...base.modes.professional, ...(override.modes?.professional ?? {}) },
    },
    approvedLinks: override.approvedLinks ?? base.approvedLinks,
    forbiddenVendors: override.forbiddenVendors ?? base.forbiddenVendors,
  };
}

/**
 * Loads and caches the active vertical's config.json, merged over DEFAULT_CONFIG
 * so a partial config is always safe. Server-only (reads the filesystem).
 */
export async function loadVerticalConfig(): Promise<VerticalConfig> {
  if (cached) return cached;

  const configPath = path.join(process.cwd(), 'verticals', ACTIVE_VERTICAL, 'config.json');
  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<VerticalConfig>;
    cached = deepMergeConfig(DEFAULT_CONFIG, { ...parsed, vertical: ACTIVE_VERTICAL });
  } catch {
    // No config yet (or unreadable) — run on safe defaults.
    cached = { ...DEFAULT_CONFIG, vertical: ACTIVE_VERTICAL };
  }
  return cached;
}

/** Client-safe config for passing into browser components as props. */
export async function getPublicConfig(): Promise<PublicVerticalConfig> {
  return loadVerticalConfig();
}
