/**
 * Chart narrative generator.
 *
 * Takes a recipe result (chart data + total) and the original user question.
 * Calls Sonnet to produce a structured breakdown: per-segment labels,
 * counts, percentages, key observations.
 */

import { getAnthropic, REPORT_MODEL, parseClaudeJSON, extractText } from '@/lib/anthropic';
import type { RecipeResult } from './chart-recipes';

export interface ChartSegment {
  label: string;
  count: number;
  percentage: number;
  note?: string;
}

export interface ChartNarrative {
  title: string;
  summary: string;
  segments: ChartSegment[];
  observations: string[];
}

const NARRATOR_PROMPT = `You are an analyst writing a short, sharp breakdown of a chart for Curtis Grier-Coward, founder of Output Systems. He's looking at the Output Systems internal admin dashboard.

You'll receive:
- The user's natural-language question (what they wanted to see)
- The chart type
- The raw chart data (label + value pairs)
- The total

Return strict JSON. No prose. No markdown fences. Just the JSON object:

{
  "title": "Short, clear chart title. 8 to 12 words.",
  "summary": "1 to 2 sentence direct answer to what the chart shows. Plain language. No hedging.",
  "segments": [
    {
      "label": "The segment name as shown on the chart",
      "count": 12,
      "percentage": 24.0,
      "note": "Optional one-sentence note about this segment. What it means."
    }
  ],
  "observations": [
    "2 to 4 short bullet observations the operator can act on. Each one is one sentence. Specific. No filler."
  ]
}

Rules:
- Percentages are out of the total. Round to one decimal.
- Order segments by count descending unless the chart type is line (then preserve the input order, which is chronological).
- For pie/donut/bar charts, every input row becomes one segment.
- For line charts, segments can describe the overall shape (peak day, lowest day, average) rather than every point.
- If the total is 0, write a summary that says so honestly and skip observations.
- Don't say "as you can see" or any other filler that references the chart.
- Don't invent data not in the input.`;

export async function narrateChart(
  recipe: RecipeResult,
  userQuestion: string,
): Promise<ChartNarrative> {
  const anthropic = getAnthropic();
  const inputBlock = formatInput(recipe, userQuestion);

  const result = await anthropic.messages.create({
    model: REPORT_MODEL,
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: NARRATOR_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: inputBlock }],
  });

  const text = extractText(result);
  try {
    const parsed = parseClaudeJSON<ChartNarrative>(text);
    // Validate segment percentages roughly match counts. The model is good at
    // arithmetic but we double-check to keep the dashboard honest.
    if (recipe.total > 0) {
      for (const seg of parsed.segments) {
        const recomputed = Number(((seg.count / recipe.total) * 100).toFixed(1));
        if (Math.abs(recomputed - seg.percentage) > 0.5) {
          seg.percentage = recomputed;
        }
      }
    }
    return parsed;
  } catch (err) {
    console.error('chart narrator parse failed', err);
    return fallbackNarrative(recipe);
  }
}

function formatInput(recipe: RecipeResult, userQuestion: string): string {
  const lines: string[] = [];
  lines.push(`User question: ${userQuestion}`);
  lines.push(`Chart type: ${recipe.chart_type}`);
  lines.push(`Chart title (seed): ${recipe.title}`);
  lines.push(`Total: ${recipe.total}`);
  lines.push('');
  lines.push('Data rows:');
  for (const d of recipe.data) {
    const pct = recipe.total > 0 ? ((d.value / recipe.total) * 100).toFixed(1) : '0.0';
    lines.push(`- ${d.name}: ${d.value} (${pct}%)`);
  }
  if (recipe.series && recipe.series.length > 0) {
    lines.push('');
    lines.push('Additional series:');
    for (const s of recipe.series) {
      const seriesTotal = s.data.reduce((acc, p) => acc + p.value, 0);
      lines.push(`- ${s.name}: total ${seriesTotal}`);
    }
  }
  lines.push('');
  lines.push('Now produce the JSON breakdown.');
  return lines.join('\n');
}

function fallbackNarrative(recipe: RecipeResult): ChartNarrative {
  return {
    title: recipe.title,
    summary:
      recipe.total > 0
        ? `Showing ${recipe.total} total across ${recipe.data.length} segment${recipe.data.length === 1 ? '' : 's'}.`
        : 'No data in this range.',
    segments: recipe.data.map((d) => ({
      label: d.name,
      count: d.value,
      percentage: recipe.total > 0 ? Number(((d.value / recipe.total) * 100).toFixed(1)) : 0,
    })),
    observations: [],
  };
}
