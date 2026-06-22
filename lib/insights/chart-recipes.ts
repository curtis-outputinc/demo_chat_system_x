/**
 * Chart recipes.
 *
 * Each recipe is a deterministic data fetcher. The command bar classifier picks
 * a recipe by name + params. The /api/admin/insights/chart endpoint runs the
 * recipe and pipes its result into Sonnet for narrative breakdown.
 *
 * Recipes are intentionally finite. The AI never writes SQL; it selects from
 * this list of safe lookups.
 */

import { getSupabaseService } from '@/lib/supabase';
import { getCountsBundle, getConversationVolumeByDay, getTopUserQuestions, getTopUnansweredQuestions, getTopPagesByEngagement, getLeadFunnel } from './queries';

export interface ChartDatum {
  name: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  data: ChartDatum[];
}

export interface RecipeResult {
  chart_type: 'pie' | 'bar' | 'line' | 'donut';
  title: string;
  data: ChartDatum[];
  total: number;
  // Optional secondary series for multi-line line charts.
  series?: ChartSeries[];
  // Suggested x-axis label for bar/line.
  x_label?: string;
  y_label?: string;
}

export type RecipeName =
  | 'keyword_split'
  | 'by_page'
  | 'by_source'
  | 'by_outcome'
  | 'volume_daily'
  | 'volume_hourly'
  | 'funnel'
  | 'top_questions'
  | 'top_unanswered'
  | 'top_pages_engagement';

export interface RecipeParams {
  recipe: RecipeName;
  chart_type: 'pie' | 'bar' | 'line' | 'donut';
  keyword?: string;
  limit?: number;
  tenant_id: string;
  range_start: Date;
  range_end: Date;
  range_label: string;
}

export async function runRecipe(params: RecipeParams): Promise<RecipeResult> {
  switch (params.recipe) {
    case 'keyword_split':
      return runKeywordSplit(params);
    case 'by_page':
      return runByPage(params);
    case 'by_source':
      return runBySource(params);
    case 'by_outcome':
      return runByOutcome(params);
    case 'volume_daily':
      return runVolumeDaily(params);
    case 'volume_hourly':
      return runVolumeHourly(params);
    case 'funnel':
      return runFunnel(params);
    case 'top_questions':
      return runTopQuestions(params);
    case 'top_unanswered':
      return runTopUnanswered(params);
    case 'top_pages_engagement':
      return runTopPagesEngagement(params);
    default:
      throw new Error(`Unknown recipe: ${params.recipe}`);
  }
}

async function runKeywordSplit(params: RecipeParams): Promise<RecipeResult> {
  if (!params.keyword) throw new Error('keyword required for keyword_split');
  const supabase = getSupabaseService();
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('tenant_id', params.tenant_id)
    .gte('started_at', params.range_start.toISOString())
    .lte('started_at', params.range_end.toISOString());

  if (!convs || convs.length === 0) {
    return {
      chart_type: params.chart_type,
      title: `Conversations mentioning "${params.keyword}" vs others, ${params.range_label}`,
      data: [
        { name: `Mentioned "${params.keyword}"`, value: 0 },
        { name: `Did not mention "${params.keyword}"`, value: 0 },
      ],
      total: 0,
    };
  }

  const ids = convs.map((c) => c.id as string);
  const { data: hits } = await supabase
    .from('messages')
    .select('conversation_id')
    .ilike('content', `%${params.keyword}%`)
    .in('conversation_id', ids);
  const hitSet = new Set((hits ?? []).map((m) => m.conversation_id as string));
  const total = ids.length;
  const matched = hitSet.size;

  return {
    chart_type: params.chart_type,
    title: `Conversations mentioning "${params.keyword}" vs others, ${params.range_label}`,
    data: [
      { name: `Mentioned "${params.keyword}"`, value: matched },
      { name: `Did not mention`, value: total - matched },
    ],
    total,
  };
}

async function runByPage(params: RecipeParams): Promise<RecipeResult> {
  const pages = await getTopPagesByEngagement(
    params.tenant_id,
    params.range_start,
    params.range_end,
    params.limit ?? 8,
  );
  const total = pages.reduce((acc, p) => acc + p.conversation_count, 0);
  return {
    chart_type: params.chart_type,
    title: `Conversations by page, ${params.range_label}`,
    data: pages.map((p) => ({ name: p.page, value: p.conversation_count })),
    total,
    x_label: 'Page',
    y_label: 'Conversations',
  };
}

async function runBySource(params: RecipeParams): Promise<RecipeResult> {
  const supabase = getSupabaseService();
  const { data: convs } = await supabase
    .from('conversations')
    .select('source')
    .eq('tenant_id', params.tenant_id)
    .gte('started_at', params.range_start.toISOString())
    .lte('started_at', params.range_end.toISOString());

  const counts = new Map<string, number>();
  for (const c of convs ?? []) {
    const k = (c.source as string | null) ?? 'website';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const data = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return {
    chart_type: params.chart_type,
    title: `Conversations by source, ${params.range_label}`,
    data,
    total,
    x_label: 'Source',
    y_label: 'Conversations',
  };
}

async function runByOutcome(params: RecipeParams): Promise<RecipeResult> {
  const supabase = getSupabaseService();
  const { data: convs } = await supabase
    .from('conversations')
    .select('outcome')
    .eq('tenant_id', params.tenant_id)
    .gte('started_at', params.range_start.toISOString())
    .lte('started_at', params.range_end.toISOString());

  const counts = new Map<string, number>();
  for (const c of convs ?? []) {
    const k = (c.outcome as string | null) ?? 'in_flight';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const data = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return {
    chart_type: params.chart_type,
    title: `Conversations by outcome, ${params.range_label}`,
    data,
    total,
    x_label: 'Outcome',
    y_label: 'Conversations',
  };
}

async function runVolumeDaily(params: RecipeParams): Promise<RecipeResult> {
  const points = await getConversationVolumeByDay(
    params.tenant_id,
    params.range_start,
    params.range_end,
  );
  return {
    chart_type: params.chart_type,
    title: `Conversation volume per day, ${params.range_label}`,
    data: points.map((p) => ({ name: p.date, value: p.conversations })),
    total: points.reduce((acc, p) => acc + p.conversations, 0),
    series: [
      { name: 'conversations', data: points.map((p) => ({ name: p.date, value: p.conversations })) },
      { name: 'leads', data: points.map((p) => ({ name: p.date, value: p.leads })) },
      { name: 'bookings', data: points.map((p) => ({ name: p.date, value: p.bookings })) },
    ],
    x_label: 'Date',
    y_label: 'Count',
  };
}

async function runVolumeHourly(params: RecipeParams): Promise<RecipeResult> {
  const supabase = getSupabaseService();
  const { data: convs } = await supabase
    .from('conversations')
    .select('started_at')
    .eq('tenant_id', params.tenant_id)
    .gte('started_at', params.range_start.toISOString())
    .lte('started_at', params.range_end.toISOString());

  const buckets = new Array<number>(24).fill(0);
  for (const c of convs ?? []) {
    const d = new Date(c.started_at as string);
    buckets[d.getHours()] += 1;
  }
  const data: ChartDatum[] = buckets.map((value, hour) => ({
    name: `${hour.toString().padStart(2, '0')}:00`,
    value,
  }));
  return {
    chart_type: params.chart_type,
    title: `Conversations by hour of day, ${params.range_label}`,
    data,
    total: data.reduce((acc, d) => acc + d.value, 0),
    x_label: 'Hour',
    y_label: 'Conversations',
  };
}

async function runFunnel(params: RecipeParams): Promise<RecipeResult> {
  const f = await getLeadFunnel(params.tenant_id, params.range_start, params.range_end);
  return {
    chart_type: params.chart_type,
    title: `Lead funnel, ${params.range_label}`,
    data: [
      { name: 'Conversations only', value: Math.max(f.conversations - f.leads, 0) },
      { name: 'Leads captured (no booking)', value: Math.max(f.leads - f.bookings, 0) },
      { name: 'Bookings', value: f.bookings },
    ],
    total: f.conversations,
  };
}

async function runTopQuestions(params: RecipeParams): Promise<RecipeResult> {
  const limit = params.limit ?? 10;
  const qs = await getTopUserQuestions(
    params.tenant_id,
    params.range_start,
    params.range_end,
    limit,
  );
  return {
    chart_type: params.chart_type,
    title: `Top ${qs.length} customer questions, ${params.range_label}`,
    data: qs.map((q) => ({
      name: q.question.length > 60 ? q.question.slice(0, 57) + '…' : q.question,
      value: q.count,
    })),
    total: qs.reduce((acc, q) => acc + q.count, 0),
    x_label: 'Question',
    y_label: 'Count',
  };
}

async function runTopUnanswered(params: RecipeParams): Promise<RecipeResult> {
  const limit = params.limit ?? 10;
  const qs = await getTopUnansweredQuestions(
    params.tenant_id,
    params.range_start,
    params.range_end,
    limit,
  );
  return {
    chart_type: params.chart_type,
    title: `Top ${qs.length} unanswered questions, ${params.range_label}`,
    data: qs.map((q) => ({
      name: q.question.length > 60 ? q.question.slice(0, 57) + '…' : q.question,
      value: q.count,
    })),
    total: qs.reduce((acc, q) => acc + q.count, 0),
    x_label: 'Question',
    y_label: 'Count',
  };
}

async function runTopPagesEngagement(params: RecipeParams): Promise<RecipeResult> {
  const pages = await getTopPagesByEngagement(
    params.tenant_id,
    params.range_start,
    params.range_end,
    params.limit ?? 10,
  );
  return {
    chart_type: params.chart_type,
    title: `Top pages by engagement, ${params.range_label}`,
    data: pages.map((p) => ({ name: p.page, value: p.conversation_count })),
    total: pages.reduce((acc, p) => acc + p.conversation_count, 0),
    series: [
      {
        name: 'Conversations',
        data: pages.map((p) => ({ name: p.page, value: p.conversation_count })),
      },
      {
        name: 'Unanswered',
        data: pages.map((p) => ({ name: p.page, value: p.unanswered_count })),
      },
    ],
    x_label: 'Page',
    y_label: 'Count',
  };
}

// Used by getCountsBundle path — re-export for the chart-data endpoint if it
// needs an at-a-glance counts call.
export { getCountsBundle };
