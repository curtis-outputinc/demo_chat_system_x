import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminBase } from '@/lib/admin-base';
import { getSupabaseService } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ConversationRow {
  id: string;
  source: string | null;
  page_context: string | null;
  outcome: string | null;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  visitor_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  anonymized_at: string | null;
}

interface MessageRow {
  id: string;
  role: string;
  content: string;
  flagged_unanswered: boolean;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

export default async function ConversationDetail({ params }: PageProps) {
  const { id } = await params;
  const base = await getAdminBase();
  const supabase = getSupabaseService();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!conversation) {
    notFound();
  }

  const { data: messagesData } = await supabase
    .from('messages')
    .select('id, role, content, flagged_unanswered, model, input_tokens, output_tokens, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  const conv = conversation as ConversationRow;
  const messages = (messagesData ?? []) as MessageRow[];

  return (
    <main className="min-h-screen bg-black text-white p-6 sm:p-10">
      <Link href={base || '/'} className="text-[#1ae0cb] underline text-sm mb-6 inline-block">
        ← back to admin
      </Link>

      <header className="mb-8 border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold mb-3">Conversation transcript</h1>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Row label="Started" value={formatDate(conv.started_at)} />
          <Row label="Source" value={conv.source ?? 'website'} />
          <Row label="Page" value={conv.page_context ?? '/'} mono />
          <Row label="Outcome" value={conv.outcome ?? 'in flight'} />
          <Row label="Messages" value={String(messages.length)} />
          <Row label="Visitor ID" value={conv.visitor_id ?? '(anon)'} mono />
          <Row label="IP" value={conv.ip_address ?? '(none)'} mono />
          <Row
            label="Anonymized"
            value={conv.anonymized_at ? formatDate(conv.anonymized_at) : 'no'}
          />
        </dl>
      </header>

      <section className="space-y-6 max-w-3xl">
        {messages.length === 0 ? (
          <p className="text-white/50 text-sm">No messages.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id}>
              <div className="flex items-center gap-3 mb-2 text-xs text-white/50">
                <span
                  className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                    m.role === 'user'
                      ? 'bg-[#1ae0cb]/15 text-[#1ae0cb] border border-[#1ae0cb]/30'
                      : 'bg-white/5 border border-white/10 text-white/70'
                  }`}
                >
                  {m.role}
                </span>
                <span>{formatDate(m.created_at)}</span>
                {m.flagged_unanswered && (
                  <span className="text-amber-400 text-xs">flagged unanswered</span>
                )}
                {m.input_tokens != null && m.output_tokens != null && (
                  <span className="text-white/40 text-xs">
                    {m.input_tokens} in / {m.output_tokens} out
                  </span>
                )}
              </div>
              <div className="text-white/90 leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</dt>
      <dd className={`text-white/85 ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
