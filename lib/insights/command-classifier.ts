/**
 * Natural-language command bar intent classifier.
 *
 * Single Haiku call: takes the operator's raw input, returns a structured
 * JSON intent the dashboard can route on. Lifted from the lead finder
 * scaffolding pattern (Part 7), adapted to insight-dashboard verbs.
 */

import { getAnthropic, HAIKU_MODEL, parseClaudeJSON, extractText } from '@/lib/anthropic';
import type { CommandResult } from './types';

const CLASSIFIER_SYSTEM_PROMPT = `You are the intent classifier for the Output Systems admin command bar. The operator types or speaks a natural-language request. Return a single JSON object that the dashboard can route on.

Supported intents:
- "summarize_period" — operator wants an AI-generated insight report over a range. Trigger words: "summarize", "what happened", "weekly report", "give me a summary", "what were the patterns".
- "find_pattern" — operator wants to find conversations matching a keyword or theme. Trigger words: "find", "show me conversations about", "anyone asking about".
- "filter_conversations" — operator wants to navigate to a filtered conversation list. Trigger words: "show me", "all conversations on", "unanswered conversations from".
- "show_top_questions" — operator wants the top user questions in a range.
- "show_top_unanswered" — operator wants the top unanswered (flagged) questions.
- "show_page_engagement" — operator wants engagement by page.
- "show_lead_funnel" — operator wants the lead funnel (conversations to leads to bookings).
- "show_conversation_volume" — operator wants the volume over time chart.
- "unclear" — operator's intent is ambiguous; ask for clarification.

Range tokens (use the closest match):
- "today"
- "this_week" (Monday to Sunday)
- "last_week"
- "this_month"
- "last_7d"
- "last_30d"
- ISO range "2026-06-01..2026-06-07" if the operator gave specific dates

Output JSON shape (only include fields relevant to the intent):

{
  "intent": "summarize_period",
  "summarize": { "range_token": "this_week", "focus": "optional, what to emphasize" }
}

{
  "intent": "find_pattern",
  "pattern": { "keyword": "pricing", "range_token": "last_7d" }
}

{
  "intent": "filter_conversations",
  "filter": { "range_token": "last_7d", "unanswered_only": true, "page_context": "/pricing" }
}

{
  "intent": "show_top_questions",
  "top": { "range_token": "this_week", "limit": 10, "unanswered_only": false }
}

{
  "intent": "show_top_unanswered",
  "top": { "range_token": "this_week", "limit": 10 }
}

{
  "intent": "show_page_engagement",
  "range_token": "this_week"
}

{
  "intent": "show_lead_funnel",
  "range_token": "this_week"
}

{
  "intent": "show_conversation_volume",
  "range_token": "last_30d"
}

{
  "intent": "unclear",
  "clarification": "One short, friendly sentence asking what they meant."
}

Rules:
- JSON only. No prose. No markdown fences.
- Pick exactly one intent. When in doubt between two, pick the more specific one.
- Default range_token is "last_7d" if the operator didn't specify a range.
- Keyword should be lowercased and stripped of punctuation.
- For unclear, write a short clarifying question, not a refusal.`;

export async function classifyCommand(rawInput: string): Promise<CommandResult> {
  const anthropic = getAnthropic();
  const result = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 400,
    system: [
      {
        type: 'text',
        text: CLASSIFIER_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: rawInput,
      },
    ],
  });

  const text = extractText(result);
  try {
    return parseClaudeJSON<CommandResult>(text);
  } catch (err) {
    console.error('command-classifier parse failed', err);
    return {
      intent: 'unclear',
      clarification: "I couldn't quite parse that. Could you try again?",
    };
  }
}
