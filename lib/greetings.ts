/**
 * Greeting + suggested chips logic for the chatbot.
 *
 * Resolution order:
 *   1. Page path (e.g. /services/customer-interaction-system) — page-aware variant
 *   2. Default — generic V2 opener + default chips
 *
 * V2 default greeting and chips locked by Curtis. Page variants will be rebuilt
 * as the V2 website rolls out per-page surfaces.
 */

export interface GreetingContext {
  /** The pathname the visitor is on (e.g. "/services/customer-interaction-system"). May be null on direct /chat or /embed visits. */
  pagePath?: string | null;
  /** A `ref` URL param if present. Retained for source tagging on conversations. */
  refParam?: string | null;
}

export interface Greeting {
  /** First message the chatbot shows (assistant-side). */
  text: string;
  /** 4 suggested-question buttons shown alongside the greeting. */
  chips: string[];
  /** Source tag persisted to conversations.metadata.source for analytics. */
  source: string;
}

const DEFAULT_CHIPS = [
  'I need a chatbot for my website',
  'I want to reduce customer service time',
  'I need my staff to find information faster',
  'I am not sure what I need yet',
];

const DEFAULT_GREETING: Greeting = {
  text: 'Hey, what is the bottleneck you are trying to solve?',
  chips: DEFAULT_CHIPS,
  source: 'website',
};

/**
 * Per-page variants. Match by substring against the lowercased pagePath.
 * Order matters — first match wins, so put more-specific entries earlier.
 *
 * V1 system-specific variants removed during V2 launch. Rebuild here when
 * V2 website pages (per-product pages, etc.) ship.
 */
const PAGE_VARIANTS: { match: string; greeting: Greeting }[] = [];

/**
 * Resolves the greeting for a visitor based on page path. The path is matched
 * against PAGE_VARIANTS (first match wins); falls back to DEFAULT_GREETING.
 */
export function getGreeting(ctx: GreetingContext): Greeting {
  if (ctx.pagePath) {
    const lowerPath = ctx.pagePath.toLowerCase();
    for (const variant of PAGE_VARIANTS) {
      if (lowerPath.includes(variant.match)) {
        return variant.greeting;
      }
    }
  }

  return DEFAULT_GREETING;
}
