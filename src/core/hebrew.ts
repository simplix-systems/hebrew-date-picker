// hebrew.ts - Hebrew calendar engine built on the platform Intl APIs.
//
// Uses Intl.DateTimeFormat('…-u-ca-hebrew', …) which is available in all
// modern browsers and Node 14+. Zero runtime dependencies.
import type { HebrewMonth, HebrewParts } from './types';
import { getGlobalConfig } from './config';

const fmtNum = new Intl.DateTimeFormat('en-u-ca-hebrew', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric'
});

function hebMonthFmt(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(getGlobalConfig().locale + '-u-ca-hebrew', {
    month: 'long'
  });
}

// ===== Gematria =====
const G_HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
const G_TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const G_ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];

function gematriaThree(n: number): string {
  let h = Math.floor(n / 100);
  const rest = n % 100;
  let out = '';
  while (h > 9) {
    out += 'תתק';
    h -= 9;
  }
  out += G_HUNDREDS[h];
  const t = Math.floor(rest / 10);
  const o = rest % 10;
  // 15 → טו, 16 → טז (avoid spelling Divine names יה / יו)
  if (t === 1 && o === 5) out += 'טו';
  else if (t === 1 && o === 6) out += 'טז';
  else out += G_TENS[t] + G_ONES[o];
  return out;
}

function insertGershayim(s: string): string {
  if (s.length === 0) return s;
  if (s.length === 1) return s + '׳';
  return s.slice(0, -1) + '״' + s.slice(-1);
}

/** Convert a Hebrew year (e.g. 5786) to gematria, e.g. "תשפ״ו". Thousands stripped. */
export function hebYearGematria(y: number): string {
  const inThousand = y % 1000;
  if (inThousand === 0) return String(y);
  return insertGershayim(gematriaThree(inThousand));
}

/**
 * Hebrew year WITH the thousands (millennium) prefix, e.g.
 * 5786 → "ה׳תשפ״ו" (the ה׳ marks the 5th millennium), 6786 → "ו׳תשפ״ו".
 * Falls back to the plain form for years outside the א׳–ט׳ (1000–9999) range.
 */
export function hebYearGematriaFull(y: number): string {
  const thousands = Math.floor(y / 1000);
  const rest = y % 1000;
  if (thousands < 1 || thousands > 9) return hebYearGematria(y);
  const prefix = G_ONES[thousands] + '׳';
  if (rest === 0) return prefix;
  return prefix + insertGershayim(gematriaThree(rest));
}

/** Convert a Hebrew day-of-month (1–30) to gematria with geresh/gershayim. */
export function hebDayGematria(d: number): string {
  if (d < 1 || d > 30) return String(d);
  if (d === 15) return 'ט״ו';
  if (d === 16) return 'ט״ז';
  if (d < 10) return G_ONES[d] + '׳';
  if (d === 10) return 'י׳';
  if (d === 20) return 'כ׳';
  if (d === 30) return 'ל׳';
  const t = Math.floor(d / 10);
  const o = d % 10;
  return G_TENS[t] + '״' + G_ONES[o];
}

function toInt(v: string): number {
  const m = String(v).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : NaN;
}

/** Gregorian Date → Hebrew parts (year, Intl month id, day). */
export function gregToHebParts(date: Date): HebrewParts {
  const parts = fmtNum.formatToParts(date);
  return {
    year: toInt(parts.find((p) => p.type === 'year')!.value),
    month: parts.find((p) => p.type === 'month')!.value,
    day: toInt(parts.find((p) => p.type === 'day')!.value)
  };
}

/** Localized long month name for a Gregorian Date, e.g. "ניסן". */
export function hebMonthName(date: Date): string {
  return hebMonthFmt().format(date);
}

/** Full Hebrew label, e.g. "ט״ו ניסן תשפ״ו". */
export function hebFullString(date: Date): string {
  const p = gregToHebParts(date);
  return `${hebDayGematria(p.day)} ${hebMonthName(date)} ${hebYearGematria(p.year)}`;
}

// ===== Year structure (cached per Hebrew year) =====
const yearCache: Record<number, { months: HebrewMonth[]; leap: boolean }> = {};

/** Build (and cache) the month list for a Hebrew year. */
export function buildYear(hebYear: number): {
  months: HebrewMonth[];
  leap: boolean;
} {
  if (yearCache[hebYear]) return yearCache[hebYear];
  const baseGreg = hebYear - 3761;
  // Iterate at local noon and step with setDate() so Daylight-Saving-Time
  // transitions can never skip or double a calendar day (a ±1h shift around
  // midnight would otherwise corrupt month lengths). See tests/timezone.
  // NOTE: use setFullYear() so years 0–99 CE are NOT remapped to 1900–1999 by
  // the Date(year, …) two-digit-year rule (that broke Hebrew years 3761–3860).
  const from = new Date(baseGreg, 7, 1, 12); // Aug 1, 12:00
  from.setFullYear(baseGreg);
  const to = new Date(baseGreg + 1, 10, 30, 12); // Nov 30 of next year, 12:00
  to.setFullYear(baseGreg + 1);

  const months: HebrewMonth[] = [];
  let cur: HebrewMonth | null = null;
  for (
    const d = new Date(from);
    d.getTime() <= to.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    const p = gregToHebParts(d);
    if (p.year !== hebYear) {
      if (cur) {
        months.push(cur);
        cur = null;
      }
      if (months.length > 0) break;
      continue;
    }
    if (!cur || cur.num !== p.month) {
      if (cur) months.push(cur);
      cur = {
        num: p.month,
        name: hebMonthName(d),
        firstGreg: new Date(d),
        days: 1
      };
    } else {
      cur.days++;
    }
  }
  if (cur && !months.includes(cur)) months.push(cur);
  const info = { months, leap: months.length === 13 };
  yearCache[hebYear] = info;
  return info;
}

/** Hebrew (year, monthId, day) → Gregorian Date. Returns null for unknown month. */
export function hebToGreg(
  hebYear: number,
  monthNum: string,
  day: number
): Date | null {
  const info = buildYear(hebYear);
  const m = info.months.find((mm) => mm.num === monthNum);
  if (!m) return null;
  const clamped = Math.max(1, Math.min(m.days, day));
  const d = new Date(m.firstGreg);
  d.setDate(d.getDate() + (clamped - 1));
  return d;
}

export function getMonthsForYear(hebYear: number): HebrewMonth[] {
  return buildYear(hebYear).months;
}

export function isLeapYear(hebYear: number): boolean {
  return buildYear(hebYear).leap;
}

/** Month+year header in gematria, e.g. "תשרי תשפ״ו". */
export function hebMonthYearLabel(date: Date): string {
  const p = gregToHebParts(date);
  return `${hebMonthName(date)} ${hebYearGematria(p.year)}`;
}
