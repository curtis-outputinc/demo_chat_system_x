import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { parseRange } from '@/lib/insights/dates';
import { generateReport } from '@/lib/insights/report-generator';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface Body {
  range_token?: string;
  type?: 'weekly' | 'monthly' | 'on_demand' | 'ad_hoc_query';
  focus?: string;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body is fine */
  }

  const rangeToken = body.range_token ?? 'last_7d';
  const range = parseRange(rangeToken);
  const type = body.type ?? 'on_demand';

  const supabase = getSupabaseService();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'tenant_not_found' }, { status: 404 });
  }

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      tenant_id: tenant.id,
      type,
      label: range.label,
      range_start: range.start.toISOString(),
      range_end: range.end.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !report) {
    return NextResponse.json(
      { error: error?.message ?? 'failed to create report row' },
      { status: 500 },
    );
  }

  // Kick off generation asynchronously. The user gets the report id immediately
  // and the dashboard polls for completion.
  after(async () => {
    try {
      await generateReport(report.id as string, {
        tenantId: tenant.id as string,
        rangeStart: range.start,
        rangeEnd: range.end,
        rangeLabel: range.label,
      });
    } catch (err) {
      console.error('background report generation failed', err);
    }
  });

  return NextResponse.json({ report_id: report.id });
}
