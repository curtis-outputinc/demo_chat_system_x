'use client';

import { useEffect, useState } from 'react';

interface HelpAnswer {
  answer: string;
  steps: string[];
  tips: string[];
  related_section?: string;
}

export function GuideAsker({ question }: { question: string }) {
  const [answer, setAnswer] = useState<HelpAnswer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAnswer(null);

    fetch('/api/admin/help/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ answer: HelpAnswer }>;
      })
      .then((data) => {
        if (!cancelled) setAnswer(data.answer);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'request failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [question]);

  if (loading) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--admin-accent)', background: 'var(--admin-accent-dim)' }}
      >
        <p className="text-base" style={{ color: 'var(--admin-fg)' }}>
          Thinking about: <span className="italic">{question}</span>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--admin-danger)', background: 'var(--admin-bg-elevated)' }}
      >
        <p className="text-sm" style={{ color: 'var(--admin-fg)' }}>
          Something went wrong asking the AI for help: {error}
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--admin-fg)' }}>
          You can still scroll down to read the guide.
        </p>
      </div>
    );
  }

  if (!answer) return null;

  return (
    <div
      className="rounded-2xl border p-6 space-y-4"
      style={{ borderColor: 'var(--admin-accent)', background: 'var(--admin-accent-dim)' }}
    >
      <div>
        <p
          className="text-xs uppercase tracking-[0.15em] font-bold mb-2"
          style={{ color: 'var(--admin-fg)' }}
        >
          You asked
        </p>
        <p className="text-base italic" style={{ color: 'var(--admin-fg)' }}>
          {question}
        </p>
      </div>

      <div>
        <p
          className="text-xs uppercase tracking-[0.15em] font-bold mb-2"
          style={{ color: 'var(--admin-fg)' }}
        >
          Answer
        </p>
        <p className="text-base leading-relaxed" style={{ color: 'var(--admin-fg)' }}>
          {answer.answer}
        </p>
      </div>

      {answer.steps && answer.steps.length > 0 && (
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] font-bold mb-2"
            style={{ color: 'var(--admin-fg)' }}
          >
            Steps
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-base" style={{ color: 'var(--admin-fg)' }}>
            {answer.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {answer.tips && answer.tips.length > 0 && (
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] font-bold mb-2"
            style={{ color: 'var(--admin-fg)' }}
          >
            Tips
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-base" style={{ color: 'var(--admin-fg)' }}>
            {answer.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {answer.related_section && (
        <p className="text-sm" style={{ color: 'var(--admin-fg)' }}>
          Scroll down to read the full <span className="font-semibold">{answer.related_section}</span> section.
        </p>
      )}
    </div>
  );
}
