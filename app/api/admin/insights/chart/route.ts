import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { parseRange } from '@/lib/insights/dates';
import { classifyChartRequest } from '@/lib/insights/chart-classifier';
import { runRecipe, type RecipeName } from '@/lib/insights/chart-recipes';
import { narrateChart } from '@/lib/insights/chart-narrator';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Body {
  input: string;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const rawInput = (body.input ?? '').trim().slice(0, 600);
  if (!rawInput) return NextResponse.json({ error: 'input_required' }, { status: 400 });

  const supabase = getSupabaseService();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();
  if (!tenant) return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });

  // 1. Classify intent + extract params via Haiku.
  const classification = await classifyChartRequest(rawInput);

  if (classification.recipe === 'unclear') {
    return NextResponse.json({
      status: 'unclear',
      clarification:
        classification.clarification ??
        "I couldn't turn that into a chart. Try 'pie chart of pricing questions this week'.",
    });
  }

  const recipeName = classification.recipe as RecipeName;
  const range = parseRange(classification.range_token ?? 'last_7d');
  const chartType = classification.chart_type ?? defaultChartTypeFor(recipeName);

  // 2. Run the recipe to get raw chart data.
  let recipe;
  try {
    recipe = await runRecipe({
      recipe: recipeName,
      chart_type: chartType,
      keyword: classification.keyword,
      limit: classification.limit,
      tenant_id: tenant.id as string,
      range_start: range.start,
      range_end: range.end,
      range_label: range.label,
    });
  } catch (err) {
    console.error('chart recipe failed', err);
    return NextResponse.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'recipe_failed',
      },
      { status: 500 },
    );
  }

  // 3. Generate breakdown via Sonnet.
  const userQuestion = classification.user_question ?? rawInput;
  const narrative = await narrateChart(recipe, userQuestion);

  const durationMs = Date.now() - start;

  // 4. Audit log.
  try {
    await supabase.from('ai_query_log').insert({
      tenant_id: tenant.id,
      raw_input: rawInput,
      intent: 'generate_chart',
      parsed_params: {
        recipe: classification.recipe,
        chart_type: chartType,
        range_token: classification.range_token,
        keyword: classification.keyword,
      },
      response_summary: narrative.title,
      response_data: { recipe, narrative },
      result_count: recipe.total,
      duration_ms: durationMs,
      status: 'complete',
    });
  } catch (auditErr) {
    console.warn('chart audit log failed', auditErr);
  }

  return NextResponse.json({
    status: 'complete',
    user_question: userQuestion,
    range_label: range.label,
    range_token: classification.range_token ?? 'last_7d',
    recipe_name: classification.recipe,
    chart: recipe,
    narrative,
  });
}

function defaultChartTypeFor(recipe: RecipeName): 'pie' | 'bar' | 'line' {
  switch (recipe) {
    case 'volume_daily':
      return 'line';
    case 'keyword_split':
    case 'by_source':
    case 'by_outcome':
    case 'funnel':
      return 'pie';
    default:
      return 'bar';
  }
}
