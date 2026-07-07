// dates.ts - Gregorian helpers + ISO <-> Date conversion.
import { getGlobalConfig } from './config';
import type { ISODate } from './types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** "YYYY-MM-DD" → local Date (or null). */
export function parseISO(s: ISODate | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Local Date → "YYYY-MM-DD". */
export function toISO(date: Date | null | undefined): ISODate {
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Localized Gregorian month names (long) for the configured locale. */
export function gregMonthNames(): string[] {
  const fmt = new Intl.DateTimeFormat(getGlobalConfig().locale, {
    month: 'long'
  });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2021, i, 1)));
}

/** Strip time → midnight local. */
export function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Compare two ISO dates: -1, 0, 1. Empty strings sort first. */
export function compareISO(a: ISODate, b: ISODate): number {
  if (a === b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a < b ? -1 : 1;
}
