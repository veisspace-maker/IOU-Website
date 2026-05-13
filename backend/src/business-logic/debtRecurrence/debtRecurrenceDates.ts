import { addMonths, startOfMonth } from 'date-fns';

/** Parse YYYY-MM-DD as a local calendar date at midnight. */
export function parseLocalDateOnly(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) {
    throw new Error(`Invalid date (expected YYYY-MM-DD): ${isoDate}`);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) {
    throw new Error(`Invalid date: ${isoDate}`);
  }
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    throw new Error(`Invalid calendar date: ${isoDate}`);
  }
  return dt;
}

export function formatLocalDateOnly(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/** Calendar day in month, clamped to last day of month (e.g. day 31 in Feb → 28/29). */
export function occurrenceDateInMonth(year: number, month1Based: number, dayOfMonth: number): Date {
  const lastDay = new Date(year, month1Based, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);
  return new Date(year, month1Based - 1, day, 0, 0, 0, 0);
}

/** YYYYMMDD integer for reliable date-only ordering. */
export function dayKey(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export type DueMonthPeriod = { year: number; month: number; occurrenceDate: Date };

/**
 * Months for which an occurrence exists, is not after `today`, is on/after `startDate`,
 * and is on/before `endDate` when endDate is set.
 */
export function enumerateDueMonths(params: {
  startDate: Date;
  endDate: Date | null;
  dayOfMonth: number;
  today: Date;
}): DueMonthPeriod[] {
  const { startDate, endDate, dayOfMonth, today } = params;
  const startKey = dayKey(startDate);
  const todayKey = dayKey(today);
  const endKey = endDate ? dayKey(endDate) : null;

  const out: DueMonthPeriod[] = [];

  let cursor = startOfMonth(startDate);
  const lastMonthStart = startOfMonth(today);

  while (cursor.getTime() <= lastMonthStart.getTime()) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const occurrenceDate = occurrenceDateInMonth(year, month, dayOfMonth);

    if (dayKey(occurrenceDate) < startKey) {
      cursor = addMonths(cursor, 1);
      continue;
    }
    if (dayKey(occurrenceDate) > todayKey) {
      cursor = addMonths(cursor, 1);
      continue;
    }
    if (endKey !== null && dayKey(occurrenceDate) > endKey) {
      cursor = addMonths(cursor, 1);
      continue;
    }

    out.push({ year, month, occurrenceDate });
    cursor = addMonths(cursor, 1);
  }

  return out;
}
