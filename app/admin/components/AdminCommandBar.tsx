'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { CommandResult } from '@/lib/insights/types';

type FeedbackKind = 'info' | 'success' | 'warn' | 'error';

interface FeedbackState {
  kind: FeedbackKind;
  message: string;
  action?: { label: string; href: string };
}

export function AdminCommandBar({ base }: { base: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const home = base || '/';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  // Feedback is transient — clear it whenever the operator navigates to a new
  // page so stale "Opening chart builder…" / "Generating report…" messages
  // don't linger after the destination has loaded.
  useEffect(() => {
    setFeedback(null);
  }, [pathname]);

  // Voice input via MediaRecorder + Whisper (no browser-played bells).
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSpeechSupported(
      typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined',
    );
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    };
  }, []);

  async function startListening() {
    if (typeof window === 'undefined') return;
    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn('command bar mic access blocked', err);
      return;
    }
    micStreamRef.current = stream;
    recordedChunksRef.current = [];

    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''];
    let mimeType = '';
    for (const c of candidates) {
      if (c === '' || (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(c))) {
        mimeType = c;
        break;
      }
    }

    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (err) {
      console.warn('command bar MediaRecorder init failed', err);
      stream.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      return;
    }

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      micStreamRef.current = null;

      const chunks = recordedChunksRef.current;
      recordedChunksRef.current = [];
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size === 0) {
        setIsRecording(false);
        return;
      }

      setIsRecording(false);
      setIsTranscribing(true);
      try {
        const filename = (recorder.mimeType || '').includes('mp4') ? 'recording.mp4' : 'recording.webm';
        const fd = new FormData();
        fd.append('audio', blob, filename);
        const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { text?: string };
        const transcript = (json.text ?? '').trim();
        if (transcript) {
          setInput((prev) => {
            const sep = prev && !/\s$/.test(prev) ? ' ' : '';
            return prev + sep + transcript;
          });
        }
      } catch (err) {
        console.warn('command bar transcription failed', err);
      } finally {
        setIsTranscribing(false);
      }
    };

    mediaRecorderRef.current = recorder;
    try {
      recorder.start();
      setIsRecording(true);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      mediaRecorderRef.current = null;
    }
  }

  function stopListening() {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    } else {
      setIsRecording(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isRecording) stopListening();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    setLoading(true);
    setFeedback({ kind: 'info', message: 'Thinking…' });

    try {
      // Detect help intent first ("how do I", "how can I", "what is the", "user guide", "help me", "user manual").
      // Route to /admin/guide?q=<question>. The guide page renders both the static guide and an AI answer.
      if (/(?:^|\s)(how (do|can|to)\b|user guide|user manual|help me|what is the|where do i)/i.test(trimmed)) {
        setFeedback({ kind: 'success', message: 'Opening guide…' });
        setTimeout(() => router.push(`${base}/guide?q=${encodeURIComponent(trimmed)}`), 250);
        return;
      }
      // Detect chart intent (pie/bar/line/donut/graph/visualize/chart of/show me a chart) and
      // route straight to /admin/query, which calls the chart endpoint with full
      // Sonnet-powered breakdown. Falls through to the normal command classifier
      // for everything else.
      if (/(?:^|\s)(pie chart|bar chart|line chart|donut|graph|visualize|chart of|chart for|show me a chart)/i.test(trimmed)) {
        setFeedback({ kind: 'success', message: 'Opening chart builder…' });
        setTimeout(() => router.push(`${base}/query?q=${encodeURIComponent(trimmed)}`), 250);
        return;
      }
      const res = await fetch('/api/admin/insights/command', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { command: CommandResult };
      routeCommand(data.command);
    } catch (err) {
      console.error('command bar submit failed', err);
      setFeedback({
        kind: 'error',
        message: 'Something went wrong. Try again or rephrase.',
      });
    } finally {
      setLoading(false);
    }
  }

  function routeCommand(cmd: CommandResult) {
    switch (cmd.intent) {
      case 'summarize_period': {
        const range = cmd.summarize?.range_token ?? 'last_7d';
        setFeedback({
          kind: 'info',
          message: `Generating insight report for ${prettyRange(range)}…`,
        });
        kickOffReport(range, cmd.summarize?.focus);
        return;
      }
      case 'find_pattern': {
        const range = cmd.pattern?.range_token ?? 'last_7d';
        const kw = cmd.pattern?.keyword ?? '';
        setFeedback({
          kind: 'success',
          message: `Showing conversations mentioning "${kw}" (${prettyRange(range)}).`,
        });
        setTimeout(() => {
          router.push(
            `${base}/conversations?range=${encodeURIComponent(range)}&q=${encodeURIComponent(kw)}`,
          );
        }, 600);
        return;
      }
      case 'filter_conversations': {
        const params = new URLSearchParams();
        if (cmd.filter?.range_token) params.set('range', cmd.filter.range_token);
        if (cmd.filter?.unanswered_only) params.set('unanswered', '1');
        if (cmd.filter?.page_context) params.set('page', cmd.filter.page_context);
        if (cmd.filter?.keyword) params.set('q', cmd.filter.keyword);
        setFeedback({ kind: 'success', message: 'Opening filtered conversations…' });
        setTimeout(() => {
          router.push(`${base}/conversations?${params.toString()}`);
        }, 600);
        return;
      }
      case 'show_top_questions': {
        const range = cmd.top?.range_token ?? 'last_7d';
        setTimeout(() => router.push(`${home}?range=${encodeURIComponent(range)}#top-questions`), 400);
        setFeedback({ kind: 'success', message: `Top questions for ${prettyRange(range)}.` });
        return;
      }
      case 'show_top_unanswered': {
        const range = cmd.top?.range_token ?? 'last_7d';
        setTimeout(
          () => router.push(`${home}?range=${encodeURIComponent(range)}#top-unanswered`),
          400,
        );
        setFeedback({ kind: 'success', message: `Top unanswered for ${prettyRange(range)}.` });
        return;
      }
      case 'show_page_engagement': {
        const range = cmd.range_token ?? 'last_7d';
        setTimeout(() => router.push(`${home}?range=${encodeURIComponent(range)}#pages`), 400);
        setFeedback({ kind: 'success', message: `Page engagement for ${prettyRange(range)}.` });
        return;
      }
      case 'show_lead_funnel': {
        const range = cmd.range_token ?? 'last_7d';
        setTimeout(() => router.push(`${home}?range=${encodeURIComponent(range)}#funnel`), 400);
        setFeedback({ kind: 'success', message: `Lead funnel for ${prettyRange(range)}.` });
        return;
      }
      case 'show_conversation_volume': {
        const range = cmd.range_token ?? 'last_30d';
        setTimeout(() => router.push(`${home}?range=${encodeURIComponent(range)}#volume`), 400);
        setFeedback({ kind: 'success', message: `Conversation volume for ${prettyRange(range)}.` });
        return;
      }
      case 'unclear':
      default: {
        setFeedback({
          kind: 'warn',
          message: cmd.clarification ?? 'Could you rephrase that?',
        });
      }
    }
  }

  async function kickOffReport(range_token: string, focus: string | undefined) {
    try {
      const res = await fetch('/api/admin/insights/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ range_token, focus, type: 'on_demand' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { report_id: string };
      setFeedback({
        kind: 'success',
        message: 'Report kicked off. Opening it now.',
        action: { label: 'View', href: `${base}/reports/${data.report_id}` },
      });
      setTimeout(() => router.push(`${base}/reports/${data.report_id}`), 600);
    } catch (err) {
      console.error('command bar report kick failed', err);
      setFeedback({ kind: 'error', message: 'Could not start the report. Try again.' });
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask anything — e.g., "pie chart of pricing questions this week" or "how do I generate a report"'
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 pr-12 text-sm border focus:outline-none focus:ring-2"
            style={{
              background: 'var(--admin-input-bg)',
              borderColor: 'var(--admin-input-border)',
              color: 'var(--admin-fg)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setInput('');
            }}
          />
          {speechSupported && (
            <button
              type="button"
              onClick={isRecording ? stopListening : startListening}
              disabled={isTranscribing}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 disabled:opacity-50"
              style={{ color: isRecording ? 'var(--admin-danger)' : 'var(--admin-fg-muted)' }}
              aria-label={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing' : 'Start voice input'}
              title={isRecording ? 'Stop' : 'Voice input'}
            >
              {isRecording ? (
                <svg
                  className="animate-pulse"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label={loading ? 'Sending' : 'Send'}
          title="Send"
          className="rounded-lg p-2.5 disabled:opacity-40 transition-opacity inline-flex items-center justify-center"
          style={{
            background: 'var(--admin-accent)',
            color: '#ffffff',
          }}
        >
          {loading ? (
            <span className="text-sm font-semibold">…</span>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </form>
      {feedback && (
        <div
          className="mt-2 text-xs flex items-center gap-2"
          style={{ color: feedbackColor(feedback.kind) }}
        >
          <span>{feedback.message}</span>
          {feedback.action && (
            <a
              href={feedback.action.href}
              className="underline font-semibold"
              style={{ color: 'var(--admin-link)' }}
            >
              {feedback.action.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function feedbackColor(kind: FeedbackKind): string {
  switch (kind) {
    case 'success':
      return 'var(--admin-success)';
    case 'warn':
      return 'var(--admin-warning)';
    case 'error':
      return 'var(--admin-danger)';
    default:
      return 'var(--admin-info)';
  }
}

function prettyRange(token: string): string {
  switch (token) {
    case 'today':
      return 'today';
    case 'this_week':
      return 'this week';
    case 'last_week':
      return 'last week';
    case 'this_month':
      return 'this month';
    case 'last_7d':
      return 'the last 7 days';
    case 'last_30d':
      return 'the last 30 days';
    default:
      if (token.includes('..')) return token;
      return 'the selected range';
  }
}
