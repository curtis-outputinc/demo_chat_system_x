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
import type { ReactNode } from 'react';

const CHART_COLORS = [
  'var(--admin-chart-1)',
  'var(--admin-chart-2)',
  'var(--admin-chart-3)',
  'var(--admin-chart-4)',
  'var(--admin-chart-5)',
];

interface ChartTileProps {
  title: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
}

export function ChartTile({ title, subtitle, height = 240, children }: ChartTileProps) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--admin-bg-tile)', borderColor: 'var(--admin-border)' }}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--admin-fg)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--admin-fg-subtle)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface VolumeLineProps {
  data: Array<{ date: string; conversations: number; leads: number; bookings: number }>;
}

export function VolumeLine({ data }: VolumeLineProps) {
  return (
    <ChartTile title="Daily volume" subtitle="Conversations, leads, and bookings per day" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" />
        <XAxis dataKey="date" tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }} />
        <YAxis
          tick={{ fill: 'var(--admin-chart-text)', fontSize: 13 }}
          allowDecimals={false}
        />
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
        <Line type="monotone" dataKey="conversations" stroke="var(--admin-chart-1)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="leads" stroke="var(--admin-chart-3)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="bookings" stroke="var(--admin-chart-5)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartTile>
  );
}

interface PagesBarProps {
  data: Array<{ page: string; conversation_count: number; unanswered_count: number }>;
}

export function PagesBar({ data }: PagesBarProps) {
  const trimmed = data.slice(0, 8).map((d) => ({
    ...d,
    page: d.page.length > 20 ? '…' + d.page.slice(-19) : d.page,
  }));
  return (
    <ChartTile title="Page engagement" subtitle="Conversations by page (with unanswered overlay)" height={260}>
      <BarChart data={trimmed}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" />
        <XAxis dataKey="page" tick={{ fill: 'var(--admin-chart-text)', fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={70} />
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
        <Bar dataKey="conversation_count" fill="var(--admin-chart-1)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="unanswered_count" fill="var(--admin-chart-4)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartTile>
  );
}

interface FunnelPieProps {
  data: { conversations: number; leads: number; bookings: number };
}

export function FunnelPie({ data }: FunnelPieProps) {
  const pieData = [
    { name: 'Conversations only', value: Math.max(data.conversations - data.leads, 0) },
    { name: 'Captured leads (no booking)', value: Math.max(data.leads - data.bookings, 0) },
    { name: 'Bookings', value: data.bookings },
  ].filter((d) => d.value > 0);
  return (
    <ChartTile title="Lead funnel" subtitle="Conversations → leads → bookings" height={260}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          dataKey="value"
          label={(d: any) => `${d.name}: ${d.value}`}
          labelLine={false}
        >
          {pieData.map((_entry, i) => (
            <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
    </ChartTile>
  );
}
