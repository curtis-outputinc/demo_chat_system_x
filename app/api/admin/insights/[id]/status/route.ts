import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = getSupabaseService();
  const { data: report } = await supabase
    .from('reports')
    .select('id, status, conversation_count, lead_count, error_message, finished_at')
    .eq('id', id)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json(report);
}
