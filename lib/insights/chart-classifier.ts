/**
 * Chart request classifier.
 *
 * Takes the operator's raw natural-language request and returns a recipe name
 * + chart type + params. The /api/admin/insights/chart endpoint runs the
 * recipe and returns chart data + narrative.
 *
 * Two-call pipeline:
 *  1. Haiku picks the recipe + chart type + range + (optional) keyword.
 *  2. After the recipe runs, Sonnet produces the breakdown narrative.
 */

import { getAnthropic, HAIKU_MODEL, parseClaudeJSON, extractText } from '@/lib/anthropic';
import type { RecipeName } from './chart-recipes';

const CHART_CLASSIFIER_PROMPT = `You translate a natural-language chart request from the Output Systems admin into a chart recipe + parameters.

Available recipes (pick exactly one):
- "keyword_split" : compare conversations that mention a keyword vs those that don't. Requires "keyword".
- "by_page" : group conversations by page context.
- "by_source" : group conversations by the source greeting tag.
- "by_outcome" : group conversations by their outcome field.
- "volume_daily" : daily conversation volume over the range. Best for line charts.
- "volume_hourly" : hour-of-day distribution. Best for bar charts.
- "funnel" : conversations -> leads -> bookings. Best for pie or donut.
- "top_questions" : top user questions by count.
- "top_unanswered" : top flagged-unanswered questions.
- "top_pages_engagement" : top pages with both conversation and unanswered counts.

Range tokens (pick the closest):
- "today"
- "this_week" (Mon-Sun per Curtis preference)
- "last_week"
- "this_month"
- "last_7d"
- "last_30d"
- ISO range like "2026-06-01..2026-06-07"

Chart types: "pie" | "bar" | "line" | "donut".

If the user did not specify a chart type, infer it:
- keyword_split, by_source, by_outcome, funnel -> pie
- by_page, top_questions, top_unanswered, top_pages_engagement, volume_hourly -> bar
- volume_daily -> line

If the user did not specify a range, default to "last_7d".

Output strict JSON. No prose. No markdown.

{
  "recipe": "keyword_split",
  "chart_type": "pie",
  "range_token": "this_week",
  "keyword": "pricing",
  "limit": 10,
  "user_question": "verbatim copy of the user's input, max 200 chars"
}

Only include "keyword" when the recipe is keyword_split. Only include "limit" for top-N recipes (default 10). Always include "user_question".

If the request is ambiguous or doesn't match a recipe, return:
{ "recipe": "unclear", "clarification": "One short, friendly clarifying question." }`;

export interface ChartClassification {
  recipe: RecipeName | 'unclear';
  chart_type?: 'pie' | 'bar' | 'line' | 'donut';
  range_token?: string;
  keyword?: string;
  limit?: number;
  user_question?: string;
  clarification?: string;
}

export async function classifyChartRequest(rawInput: string): Promise<ChartClassification> {
  const anthropic = getAnthropic();
  const result = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 500,
    system: [
      {
        type: 'text',
        text: CHART_CLASSIFIER_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: rawInput }],
  });

  const text = extractText(result);
  try {
    return parseClaudeJSON<ChartClassification>(text);
  } catch (err) {
    console.error('chart classifier parse failed', err);
    return {
      recipe: 'unclear',
      clarification: "I couldn't parse that into a chart. Try something like 'pie chart of pricing questions this week' or 'bar chart of top pages last 30 days'.",
    };
  }
}
