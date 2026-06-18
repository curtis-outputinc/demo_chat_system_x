'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RecipeResult } from '@/lib/insights/chart-recipes';
import type { ChartNarrative } from '@/lib/insights/chart-narrator';

const PALETTE = [
  'var(--admin-chart-1)',
  'var(--admin-chart-2)',
  'var(--admin-chart-3)',
  'var(--admin-chart-4)',
  'var(--admin-chart-5)',
  '#9fff66',
  '#fb7185',
  '#a78bfa',
];

interface ChartResultViewProps {
  chart: RecipeResult;
  narrative: ChartNarrative;
  userQuestion: string;
  rangeLabel: string;
}

export function ChartResultView({ chart, narrative, userQuestion, rangeLabel }: ChartResultViewProps) {
  return (
    <div className="report-print-wrapper space-y-6">
      <header className="space-y-1">
        <p
          className="text-xs uppercase tracking-[0.15em] font-semibold"
          style={{ color: 'var(--admin-fg)' }}
        >
          Ask · {rangeLabel}
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-fg)' }}>
          {narrative.title}
        </h1>
        <p className="text-sm italic" style={{ color: 'var(--admin-fg)' }}>
          You asked: {userQuestion}
        </p>
      </header>

      <div className="no-print flex flex-wrap gap-2">
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border"
          style={{
            borderColor: 'var(--admin-border)',
            background: 'var(--admin-bg-tile)',
            color: 'var(--admin-fg)',
          }}
        >
          Download summary (PDF)
        </button>
      </div>

      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
      >
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(chart)}
          </ResponsiveContainer>
        </div>
      </section>

      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
      >
        <h2
          className="text-xs uppercase tracking-[0.15em] font-semibold mb-3"
          style={{ color: 'var(--admin-fg)' }}
        >
          Summary
        </h2>
        <p className="text-base leading-relaxed" style={{ color: 'var(--admin-fg)' }}>
          {narrative.summary}
        </p>
      </section>

      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
      >
        <h2
          className="text-xs uppercase tracking-[0.15em] font-semibold mb-4"
          style={{ color: 'var(--admin-fg)' }}
        >
          Breakdown ({chart.total} total)
        </h2>
        <div className="space-y-3">
          {narrative.segments.map((seg, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg border"
              style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-tile)' }}
            >
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0 mt-1"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-base" style={{ color: 'var(--admin-fg)' }}>
                    {seg.label}
                  </span>
                  <span className="text-sm tabular-nums" style={{ color: 'var(--admin-fg)' }}>
                    {seg.count} ({seg.percentage}%)
                  </span>
                </div>
                {seg.note && (
                  <p className="text-sm mt-1" style={{ color: 'var(--admin-fg)' }}>
                    {seg.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {narrative.observations && narrative.observations.length > 0 && (
        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-elevated)' }}
        >
          <h2
            className="text-xs uppercase tracking-[0.15em] font-semibold mb-3"
            style={{ color: 'var(--admin-fg)' }}
          >
            Key observations
          </h2>
          <ul className="space-y-2">
            {narrative.observations.map((o, i) => (
              <li key={i} className="flex gap-3 text-base" style={{ color: 'var(--admin-fg)' }}>
                <span
                  className="font-bold flex-shrink-0"
                  style={{ color: 'var(--admin-accent)' }}
                >
                  →
                </span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function renderChart(chart: RecipeResult): React.ReactElement {
  switch (chart.chart_type) {
    case 'pie':
    case 'donut':
      return renderPie(chart);
    case 'line':
      return renderLine(chart);
    case 'bar':
    default:
      return renderBar(chart);
  }
}

function renderPie(chart: RecipeResult): React.ReactElement {
  const isDonut = chart.chart_type === 'donut';
  return (
    <PieChart>
      <Pie
        data={chart.data}
        cx="50%"
        cy="50%"
        outerRadius={130}
        innerRadius={isDonut ? 70 : 0}
        dataKey="value"
        label={(d: { name?: string; value?: number; percent?: number }) =>
          `${d.name} (${d.value})`
        }
        labelLine={false}
      >
        {chart.data.map((_, i) => (
          <Cell key={`cell-${i}`} fill={PALETTE[i % PALETTE.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          background: 'var(--admin-bg-elevated)',
          border: '1px solid var(--admin-border)',
          borderRadius: 8,
          color: 'var(--admin-fg)',
          fontSize: 14,
        }}
      />
    </PieChart>
  );
}

function renderBar(chart: RecipeResult): React.ReactElement {
  const hasSeries = chart.series && chart.series.length > 1;
  if (hasSeries) {
    // Combine series data so each x-axis label gets values for each series.
    const merged = chart.data.map((d) => {
      const row: Record<string, string | number> = { name: d.name };
      for (const s of chart.series!) {
        const point = s.data.find((p) => p.name === d.name);
        row[s.name] = point?.value ?? 0;
      }
      return row;
    });
    return (
      <BarChart data={merged}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} angle={-20} textAnchor="end" height={70} />
        <YAxis tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} />
        <Tooltip
          contentStyle={{
            background: 'var(--admin-bg-elevated)',
            border: '1px solid var(--admin-border)',
            borderRadius: 8,
            color: 'var(--admin-fg)',
            fontSize: 14,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 14, color: 'var(--admin-chart-text)' }} />
        {chart.series!.map((s, i) => (
          <Bar key={s.name} dataKey={s.name} fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    );
  }
  return (
    <BarChart data={chart.data}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" />
      <XAxis dataKey="name" tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} angle={-20} textAnchor="end" height={70} interval={0} />
      <YAxis tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} />
      <Tooltip
        contentStyle={{
          background: 'var(--admin-bg-elevated)',
          border: '1px solid var(--admin-border)',
          borderRadius: 8,
          color: 'var(--admin-fg)',
          fontSize: 14,
        }}
      />
      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
        {chart.data.map((_, i) => (
          <Cell key={`cell-${i}`} fill={PALETTE[i % PALETTE.length]} />
        ))}
      </Bar>
    </BarChart>
  );
}

function renderLine(chart: RecipeResult): React.ReactElement {
  if (chart.series && chart.series.length > 0) {
    const merged = chart.data.map((d) => {
      const row: Record<string, string | number> = { name: d.name };
      for (const s of chart.series!) {
        const point = s.data.find((p) => p.name === d.name);
        row[s.name] = point?.value ?? 0;
      }
      return row;
    });
    return (
      <LineChart data={merged}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} />
        <YAxis tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} />
        <Tooltip
          contentStyle={{
            background: 'var(--admin-bg-elevated)',
            border: '1px solid var(--admin-border)',
            borderRadius: 8,
            color: 'var(--admin-fg)',
            fontSize: 14,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 14, color: 'var(--admin-chart-text)' }} />
        {chart.series.map((s, i) => (
          <Line key={s.name} type="monotone" dataKey={s.name} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    );
  }
  return (
    <LineChart data={chart.data}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" />
      <XAxis dataKey="name" tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} />
      <YAxis tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} />
      <Tooltip
        contentStyle={{
          background: 'var(--admin-bg-elevated)',
          border: '1px solid var(--admin-border)',
          borderRadius: 8,
          color: 'var(--admin-fg)',
          fontSize: 14,
        }}
      />
      <Line type="monotone" dataKey="value" stroke={PALETTE[0]} strokeWidth={2} dot />
    </LineChart>
  );
}
