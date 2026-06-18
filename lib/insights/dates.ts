/**
 * Date helpers for the insights dashboard.
 *
 * Convention: ISO weeks (Monday start) per operator preference.
 * Helpers return UTC dates for consistency with timestamptz columns.
 */

export type DateRange = { start: Date; end: Date; label: string };

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // Monday-start
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfWeek(date: Date = new Date()): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(-1);
  return end;
}

export function startOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

export function endOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  d.setMilliseconds(-1);
  return d;
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function thisWeek(): DateRange {
  return { start: startOfWeek(), end: endOfWeek(), label: 'This week' };
}

export function lastWeek(): DateRange {
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  return { start: startOfWeek(lastWeekDate), end: endOfWeek(lastWeekDate), label: 'Last week' };
}

export function thisMonth(): DateRange {
  return { start: startOfMonth(), end: endOfMonth(), label: 'This month' };
}

export function today(): DateRange {
  return { start: startOfDay(), end: endOfDay(), label: 'Today' };
}

export function last7Days(): DateRange {
  return { start: startOfDay(daysAgo(7)), end: endOfDay(), label: 'Last 7 days' };
}

export function last30Days(): DateRange {
  return { start: startOfDay(daysAgo(30)), end: endOfDay(), label: 'Last 30 days' };
}

/**
 * Parse a range string from URL parameters into a DateRange.
 *
 * Supported tokens:
 *   today, this_week, last_week, this_month, last_7d, last_30d
 *   2026-01-01..2026-01-31 (literal ISO date range)
 *
 * Defaults to last_7d when token is missing or unrecognized.
 */
export function parseRange(token: string | null | undefined): DateRange {
  switch (token) {
    case 'today':
      return today();
    case 'this_week':
      return thisWeek();
    case 'last_week':
      return lastWeek();
    case 'this_month':
      return thisMonth();
    case 'last_30d':
      return last30Days();
    case 'last_7d':
      return last7Days();
    default:
      if (token && token.includes('..')) {
        const [s, e] = token.split('..');
        const start = new Date(s);
        const end = new Date(e);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return {
            start: startOfDay(start),
            end: endOfDay(end),
            label: `${formatShort(start)} to ${formatShort(end)}`,
          };
        }
      }
      return last7Days();
  }
}

export function formatShort(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatLong(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
