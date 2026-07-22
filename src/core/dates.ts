// dates.ts - Gregorian helpers + ISO <-> Date conversion.
import { getGlobalConfig } from './config';
import type { ISODate } from './types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Split an ISO date (year may be negative, e.g. "-3760-09-07") into numbers. */
function splitISO(s: ISODate): [number, number, number] | null {
  const m = String(s).match(/^(-?\d+)-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

/** "YYYY-MM-DD" → local Date (or null). Supports negative (BCE) years. */
export function parseISO(s: ISODate | null | undefined): Date | null {
  if (!s) return null;
  const p = splitISO(s);
  if (!p || !p[1] || !p[2] || isNaN(p[0])) return null;
  const d = new Date(p[0], p[1] - 1, p[2]);
  d.setFullYear(p[0]); // undo the 0–99 → 19xx remap of the Date(year, …) form
  return d;
}

/** Local Date → "YYYY-MM-DD". Negative (BCE) years keep their sign: "-3760-09-07". */
export function toISO(date: Date | null | undefined): ISODate {
  if (!date) return '';
  const y = date.getFullYear();
  const ys = y < 0 ? '-' + String(-y).padStart(4, '0') : String(y).padStart(4, '0');
  return `${ys}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The Hebrew calendar epoch — 1 Tishrei of Hebrew year 1, i.e. 7 September
 * 3761 BCE (proleptic Gregorian, astronomical year -3760). This is the hard
 * floor of the picker: earlier dates can't be selected or navigated to.
 */
export const MIN_DATE: Date = (() => {
  const d = new Date(2000, 8, 7);
  d.setFullYear(-3760);
  return d;
})();
export const MIN_ISO: ISODate = toISO(MIN_DATE);

/** Clamp a Date to the supported floor (the Hebrew epoch). */
export function clampToMin(d: Date): Date {
  return d.getTime() < MIN_DATE.getTime() ? new Date(MIN_DATE) : d;
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

/** Compare two ISO dates: -1, 0, 1. Empty strings sort first. Numeric-aware,
 * so negative (BCE) years order correctly ("-3760-…" < "-0100-…" < "2026-…"). */
export function compareISO(a: ISODate, b: ISODate): number {
  if (a === b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  const pa = splitISO(a);
  const pb = splitISO(b);
  if (pa && pb) {
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
    }
    // Same calendar day — fall through to compare any trailing time part.
  }
  return a < b ? -1 : a > b ? 1 : 0;
}
