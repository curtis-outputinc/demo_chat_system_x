/**
 * Content filters for the chatbot.
 *
 * Pre-flight runs on the visitor's input before it reaches Claude.
 * Post-flight runs on Claude's output before it reaches the visitor.
 *
 * Both are cheap regex/heuristic checks. They are not foolproof, the system
 * prompt is the primary defense; these are belt-and-suspenders.
 */

// =============================================
// Pre-flight: visitor input
// =============================================

export interface PreFlightResult {
  /** True if the message should be blocked entirely. */
  blocked: boolean;
  /** Human-readable reason if blocked, used for logging. */
  reason?: string;
  /** Public-facing fallback the chatbot should return instead of calling Claude. */
  publicMessage?: string;
}

const MAX_USER_MESSAGE_LENGTH = 4000;

/**
 * Common prompt-injection patterns. Not exhaustive, but catches the obvious
 * "ignore previous instructions" attempts. The system prompt itself does the
 * real work of constraining behavior.
 */
const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i, label: 'ignore-previous' },
  { pattern: /disregard\s+(all\s+)?(previous|prior|above|the)\s+(instructions|prompts|rules|system)/i, label: 'disregard-previous' },
  { pattern: /you\s+are\s+now\s+(?:a|an|the|in|free|jailbroken|no longer|unrestricted)/i, label: 'role-switch' },
  { pattern: /act\s+as\s+(?:if\s+)?(?:dan|jailbroken|an?\s+unrestricted|an?\s+ai\s+with\s+no)/i, label: 'roleplay-jailbreak' },
  { pattern: /forget\s+(everything|all|that\s+you|your\s+instructions)/i, label: 'forget-instructions' },
  { pattern: /repeat\s+(your|the|all)\s+(system\s+)?(prompt|instructions|rules)/i, label: 'reveal-prompt' },
  { pattern: /print\s+(your|the|all)\s+(system\s+)?(prompt|instructions|rules)/i, label: 'reveal-prompt' },
  { pattern: /what\s+(are|were)\s+your\s+(original|initial|system)\s+instructions/i, label: 'reveal-prompt' },
  { pattern: /<\|im_start\|>|<\|im_end\|>/i, label: 'control-token' },
];

/**
 * Off-topic patterns. Lighter touch — these don't block, they just redirect
 * the chatbot to deflect. Politics, religion, current events, etc.
 */
const DEFLECT_PATTERNS: RegExp[] = [
  /\b(?:trump|biden|harris|election|democrat|republican|liberal|conservative|abortion)\b/i,
  /\b(?:bitcoin|ethereum|crypto|nft|memecoin|doge\s*coin)\b/i,
];

export function preFlightCheck(message: string): PreFlightResult {
  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return {
      blocked: true,
      reason: 'empty',
      publicMessage: "Looks like that came through empty. What's on your mind?",
    };
  }

  if (trimmed.length > MAX_USER_MESSAGE_LENGTH) {
    return {
      blocked: true,
      reason: 'too-long',
      publicMessage:
        "That's a long one, can you summarize the core question in a few sentences? Or book a call below and we can dig into the details there.",
    };
  }

  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        blocked: true,
        reason: `injection:${label}`,
        publicMessage:
          "I'm here to answer questions about this business and how we can help. Anything I can help with on that?",
      };
    }
  }

  return { blocked: false };
}

/**
 * Returns true when a deflect topic is detected. Doesn't block; the calling
 * code can decide to add a hint to the system message or just let Claude
 * handle it (the system prompt already says to deflect).
 */
export function isOffTopic(message: string): boolean {
  return DEFLECT_PATTERNS.some((re) => re.test(message));
}

// =============================================
// Post-flight: assistant output
// =============================================

export interface PostFlightResult {
  /** Cleaned message (em dashes stripped, etc). */
  cleaned: string;
  /** Issues detected — purely for logging, not for blocking. */
  issues: string[];
}

/**
 * Vendor names behind the demo stack. Same across every vertical (it's our
 * tech, not the demo business's). If the chatbot leaks any of these, we log it
 * but don't redact (redaction would make replies incoherent); a logged leak
 * prompts a corpus/behavior tightening.
 */
const FORBIDDEN_VENDORS = [
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
];

/**
 * Hype words explicitly forbidden by CLAUDE.md §3 / §10.
 */
const HYPE_WORDS = [
  /\brevolutionary\b/i,
  /\bgame-changing\b/i,
  /\bnext-generation\b/i,
  /\bcutting-edge\b/i,
  /\bunleash\b/i,
  /\bunlock\s+potential\b/i,
];

export function postFlightClean(text: string): PostFlightResult {
  const issues: string[] = [];

  // Strip em dashes (forbidden in customer-facing chatbot output per CLAUDE.md §3).
  let cleaned = text;
  if (cleaned.includes('—')) {
    issues.push('em-dash');
    cleaned = cleaned.replace(/\s*—\s*/g, ', ');
  }

  // Detect (don't redact) forbidden vendor names.
  for (const vendor of FORBIDDEN_VENDORS) {
    const re = new RegExp(`\\b${vendor.replace(/\./g, '\\.')}\\b`, 'i');
    if (re.test(cleaned)) {
      issues.push(`vendor-leak:${vendor}`);
    }
  }

  // Detect hype words.
  for (const re of HYPE_WORDS) {
    if (re.test(cleaned)) {
      issues.push(`hype:${re.source}`);
    }
  }

  return { cleaned, issues };
}
