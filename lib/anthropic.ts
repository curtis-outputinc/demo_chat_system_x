import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set in the environment.');
  }
  client = new Anthropic({ apiKey });
  return client;
}

// Primary chatbot model. Heavy quality work.
export const CHATBOT_MODEL = 'claude-sonnet-4-6';

// Cheap, fast model for intent classification and short routing decisions.
export const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

// Heavy analysis model for full report generation.
export const REPORT_MODEL = 'claude-sonnet-4-6';

/**
 * Tolerant JSON parser for Claude output. Tries: raw, fenced ```json ... ```,
 * then the substring between the first { and last }. Throws with a preview if
 * all candidates fail.
 */
export function parseClaudeJSON<T = unknown>(text: string): T {
  const trimmed = text.trim();

  // Try raw.
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }

  // Try fenced ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }

  // Try substring between first { and last }.
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      /* fall through */
    }
  }

  throw new Error(
    `Could not parse Claude output as JSON. First 500 chars: ${trimmed.slice(0, 500)}`,
  );
}

/**
 * Extracts text from a Claude messages.create response. Joins all text blocks
 * with newlines.
 */
export function extractText(result: Anthropic.Message): string {
  return result.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .filter((s) => s.length > 0)
    .join('\n');
}
