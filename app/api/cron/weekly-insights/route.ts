import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { lastWeek } from '@/lib/insights/dates';
import { generateReport } from '@/lib/insights/report-generator';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Weekly cron entry point. Scheduled in vercel.json to run every Monday at
 * 12:00 UTC (around 7-8 AM Eastern). Generates a "last week" report for the
 * Output Systems tenant.
 *
 * Optional secret check: if CRON_SECRET is set, the route requires a matching
 * Authorization: Bearer <secret> header. Vercel's cron pings include this when
 * configured in the project.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const range = lastWeek();
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
      type: 'weekly',
      label: range.label,
      range_start: range.start.toISOString(),
      range_end: range.end.toISOString(),
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !report) {
    return NextResponse.json(
      { error: error?.message ?? 'failed to insert report' },
      { status: 500 },
    );
  }

  after(async () => {
    try {
      await generateReport(report.id as string, {
        tenantId: tenant.id as string,
        rangeStart: range.start,
        rangeEnd: range.end,
        rangeLabel: range.label,
      });
    } catch (err) {
      console.error('weekly cron report failed', err);
    }
  });

  return NextResponse.json({ ok: true, report_id: report.id });
}
