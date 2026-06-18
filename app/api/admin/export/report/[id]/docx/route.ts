import { NextRequest } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';
import { reportToDocxBuffer } from '@/lib/insights/exporters';
import type { ReportRecord } from '@/lib/insights/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = getSupabaseService();
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!report) {
    return new Response('Report not found', { status: 404 });
  }

  const buffer = await reportToDocxBuffer(report as ReportRecord);
  const filename = `output-insights-${id.slice(0, 8)}.docx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
