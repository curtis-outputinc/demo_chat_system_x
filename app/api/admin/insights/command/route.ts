import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { classifyCommand } from '@/lib/insights/command-classifier';

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

  if (!body.input || typeof body.input !== 'string' || body.input.trim().length === 0) {
    return NextResponse.json({ error: 'input_required' }, { status: 400 });
  }

  const trimmed = body.input.trim().slice(0, 600);

  try {
    const command = await classifyCommand(trimmed);
    const duration = Date.now() - start;

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
          intent: command.intent,
          parsed_params: command as unknown as Record<string, unknown>,
          duration_ms: duration,
          status: command.intent === 'unclear' ? 'unclear' : 'complete',
        });
      }
    } catch (auditErr) {
      console.warn('command bar audit log failed', auditErr);
    }

    return NextResponse.json({ command });
  } catch (err) {
    console.error('command bar failed', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'unknown',
        command: {
          intent: 'unclear',
          clarification: "Could you try that again?",
        },
      },
      { status: 200 },
    );
  }
}
