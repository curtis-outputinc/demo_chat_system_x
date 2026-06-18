import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { answerHelpQuestion } from '@/lib/insights/help-answer';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Body {
  question: string;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const trimmed = (body.question ?? '').trim().slice(0, 600);
  if (!trimmed) return NextResponse.json({ error: 'question_required' }, { status: 400 });

  try {
    const answer = await answerHelpQuestion(trimmed);
    const durationMs = Date.now() - start;

    // Audit log.
    try {
      const supabase = getSupabaseService();
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', TENANT_SLUG)
        .single();
      if (tenant) {
        await supabase.from('ai_query_log').insert({
          tenant_id: tenant.id,
          raw_input: trimmed,
          intent: 'help',
          parsed_params: { question: trimmed },
          response_summary: answer.answer.slice(0, 200),
          response_data: { answer },
          duration_ms: durationMs,
          status: 'complete',
        });
      }
    } catch (auditErr) {
      console.warn('help audit log failed', auditErr);
    }

    return NextResponse.json({ status: 'complete', answer });
  } catch (err) {
    console.error('help endpoint failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}
