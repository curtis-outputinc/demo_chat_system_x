'use client';

import { useEffect, useState } from 'react';
import { ChartResultView } from '../components/ChartResultView';
import type { RecipeResult } from '@/lib/insights/chart-recipes';
import type { ChartNarrative } from '@/lib/insights/chart-narrator';

interface ChartResponseComplete {
  status: 'complete';
  user_question: string;
  range_label: string;
  range_token: string;
  recipe_name: string;
  chart: RecipeResult;
  narrative: ChartNarrative;
}

interface ChartResponseUnclear {
  status: 'unclear';
  clarification: string;
}

interface ChartResponseError {
  status: 'error';
  error: string;
}

type ChartResponse = ChartResponseComplete | ChartResponseUnclear | ChartResponseError;

export function QueryRunner({ question }: { question: string }) {
  const [result, setResult] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    fetch('/api/admin/insights/chart', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: question }),
    })
      .then(async (res) => {
        if (!res.ok && res.status !== 400) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ChartResponse>;
      })
      .then((data) => {
        if (!cancelled) setResult(data);
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
        className="rounded-2xl border p-12 text-center"
        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
      >
        <p className="text-base" style={{ color: 'var(--admin-fg)' }}>
          Generating chart for: <span className="italic">{question}</span>
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--admin-fg)' }}>
          Picking the right data, running the query, and writing the breakdown…
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
        <h2 className="text-base font-semibold" style={{ color: 'var(--admin-fg)' }}>
          Something went wrong
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--admin-fg)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (!result) return null;

  if (result.status === 'unclear') {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--admin-warning)', background: 'var(--admin-bg-elevated)' }}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--admin-fg)' }}>
          Quick clarification
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--admin-fg)' }}>
          {result.clarification}
        </p>
        <p className="text-xs mt-4" style={{ color: 'var(--admin-fg)' }}>
          You asked: {question}
        </p>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--admin-danger)', background: 'var(--admin-bg-elevated)' }}
      >
        <p className="text-sm" style={{ color: 'var(--admin-fg)' }}>
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <ChartResultView
      chart={result.chart}
      narrative={result.narrative}
      userQuestion={result.user_question}
      rangeLabel={result.range_label}
    />
  );
}
