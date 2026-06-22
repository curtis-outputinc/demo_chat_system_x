import { NextRequest } from 'next/server';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { parseRange } from '@/lib/insights/dates';
import { rowsToCsv, rowsToXlsxBuffer } from '@/lib/insights/exporters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rangeToken = url.searchParams.get('range') ?? 'last_30d';
  const unansweredOnly = url.searchParams.get('unanswered') === '1';
  const page = url.searchParams.get('page');
  const q = url.searchParams.get('q');
  const format = url.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const range = parseRange(rangeToken);

  const supabase = getSupabaseService();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();
  if (!tenant) {
    return new Response('Tenant not found', { status: 404 });
  }

  let query = supabase
    .from('conversations')
    .select('id, source, page_context, outcome, started_at, message_count, anonymized_at')
    .eq('tenant_id', tenant.id)
    .gte('started_at', range.start.toISOString())
    .lte('started_at', range.end.toISOString())
    .order('started_at', { ascending: false })
    .limit(5000);

  if (page) query = query.eq('page_context', page);
  let rows = (await query).data ?? [];

  if (unansweredOnly && rows.length > 0) {
    const ids = rows.map((c) => c.id as string);
    const { data: flagged } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', ids)
      .eq('flagged_unanswered', true);
    const flaggedSet = new Set((flagged ?? []).map((m) => m.conversation_id as string));
    rows = rows.filter((c) => flaggedSet.has(c.id as string));
  }

  if (q && rows.length > 0) {
    const ids = rows.map((c) => c.id as string);
    const { data: hits } = await supabase
      .from('messages')
      .select('conversation_id')
      .ilike('content', `%${q}%`)
      .in('conversation_id', ids);
    const hitSet = new Set((hits ?? []).map((m) => m.conversation_id as string));
    rows = rows.filter((c) => hitSet.has(c.id as string));
  }

  const headers = ['id', 'started_at', 'source', 'page_context', 'outcome', 'message_count'];
  const dataRows = rows.map((r) => [
    r.id as string,
    r.started_at as string,
    r.source ?? '',
    r.page_context ?? '',
    r.outcome ?? '',
    r.message_count as number,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === 'xlsx') {
    const buffer = await rowsToXlsxBuffer('Conversations', headers, dataRows);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="conversations-${rangeToken}-${stamp}.xlsx"`,
      },
    });
  }

  const csv = rowsToCsv(headers, dataRows);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="conversations-${rangeToken}-${stamp}.csv"`,
    },
  });
}
