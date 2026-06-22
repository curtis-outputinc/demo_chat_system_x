import { NextRequest } from 'next/server';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { parseRange } from '@/lib/insights/dates';
import { rowsToCsv, rowsToXlsxBuffer } from '@/lib/insights/exporters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rangeToken = url.searchParams.get('range') ?? 'last_30d';
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

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, email, phone, company, source, status, conversation_id, created_at')
    .eq('tenant_id', tenant.id)
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())
    .order('created_at', { ascending: false })
    .limit(5000);

  const headers = ['id', 'created_at', 'name', 'email', 'phone', 'company', 'source', 'status', 'conversation_id'];
  const dataRows = (leads ?? []).map((l) => [
    l.id as string,
    l.created_at as string,
    l.name ?? '',
    l.email ?? '',
    l.phone ?? '',
    l.company ?? '',
    l.source as string,
    l.status as string,
    l.conversation_id ?? '',
  ]);

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === 'xlsx') {
    const buffer = await rowsToXlsxBuffer('Leads', headers, dataRows);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="leads-${rangeToken}-${stamp}.xlsx"`,
      },
    });
  }

  const csv = rowsToCsv(headers, dataRows);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${rangeToken}-${stamp}.csv"`,
    },
  });
}
