// jewish-events.ts - Religious Jewish holidays, Rosh Chodesh and Parashat HaShavua.
//
// Scope: traditional/religious dates ONLY. Modern Israeli State observances
// (Yom HaAtzmaut, Yom HaShoah, Yom HaZikaron, Yom Yerushalayim) are intentionally
// excluded — only Torah/rabbinic dates such as Chanukah, Purim, Tu BiShvat, etc.
//
// Calendar: Eretz Yisrael custom (single-day Yom Tov; Shmini Atzeret = Simchat
// Torah on 22 Tishri).
import {
  gregToHebParts,
  buildYear,
  hebMonthName,
  hebToGreg
} from './hebrew';
import type { JewishEvent } from './types';

/** Options affecting which events are returned. */
export interface EventsOptions {
  /** Diaspora (chutz la'aretz) custom: 2-day Yom Tov + Diaspora parashot. */
  diaspora?: boolean;
}

// Holidays keyed by Intl Hebrew month id, then Hebrew day-of-month.
const HOLIDAYS: Record<string, Record<number, JewishEvent>> = {
  Tishri: {
    1: { name: 'ראש השנה א׳', type: 'yomtov' },
    2: { name: 'ראש השנה ב׳', type: 'yomtov' },
    3: { name: 'צום גדליה', type: 'fast' },
    10: { name: 'יום הכיפורים', type: 'yomtov' },
    15: { name: 'סוכות א׳', type: 'yomtov' },
    16: { name: 'חוה״מ סוכות', type: 'cholhamoed' },
    17: { name: 'חוה״מ סוכות', type: 'cholhamoed' },
    18: { name: 'חוה״מ סוכות', type: 'cholhamoed' },
    19: { name: 'חוה״מ סוכות', type: 'cholhamoed' },
    20: { name: 'חוה״מ סוכות', type: 'cholhamoed' },
    21: { name: 'הושענא רבה', type: 'cholhamoed' },
    22: { name: 'שמיני עצרת / שמחת תורה', type: 'yomtov' }
  },
  Kislev: {
    25: { name: 'חנוכה א׳', type: 'chanukah' },
    26: { name: 'חנוכה ב׳', type: 'chanukah' },
    27: { name: 'חנוכה ג׳', type: 'chanukah' },
    28: { name: 'חנוכה ד׳', type: 'chanukah' },
    29: { name: 'חנוכה ה׳', type: 'chanukah' },
    30: { name: 'חנוכה ו׳', type: 'chanukah' }
  },
  Tevet: {
    1: { name: 'חנוכה', type: 'chanukah' },
    2: { name: 'חנוכה', type: 'chanukah' },
    3: { name: 'חנוכה', type: 'chanukah' },
    10: { name: 'עשרה בטבת', type: 'fast' }
  },
  Shevat: {
    15: { name: 'ט״ו בשבט', type: 'minor' }
  },
  Adar: {
    13: { name: 'תענית אסתר', type: 'fast' },
    14: { name: 'פורים', type: 'minor' },
    15: { name: 'שושן פורים', type: 'minor' }
  },
  'Adar I': {
    14: { name: 'פורים קטן', type: 'minor' },
    15: { name: 'שושן פורים קטן', type: 'minor' }
  },
  'Adar II': {
    13: { name: 'תענית אסתר', type: 'fast' },
    14: { name: 'פורים', type: 'minor' },
    15: { name: 'שושן פורים', type: 'minor' }
  },
  Nisan: {
    14: { name: 'ערב פסח', type: 'minor' },
    15: { name: 'פסח א׳', type: 'yomtov' },
    16: { name: 'חוה״מ פסח', type: 'cholhamoed' },
    17: { name: 'חוה״מ פסח', type: 'cholhamoed' },
    18: { name: 'חוה״מ פסח', type: 'cholhamoed' },
    19: { name: 'חוה״מ פסח', type: 'cholhamoed' },
    20: { name: 'חוה״מ פסח', type: 'cholhamoed' },
    21: { name: 'שביעי של פסח', type: 'yomtov' }
  },
  Iyar: {
    14: { name: 'פסח שני', type: 'minor' },
    18: { name: 'ל״ג בעומר', type: 'minor' }
  },
  Sivan: {
    6: { name: 'שבועות', type: 'yomtov' }
  },
  Tammuz: {
    17: { name: 'י״ז בתמוז', type: 'fast' }
  },
  Av: {
    9: { name: 'תשעה באב', type: 'fast' },
    15: { name: 'ט״ו באב', type: 'minor' }
  }
};


// Diaspora (chutz la'aretz) second-day Yom Tov overlay. Applied on top of the
// Eretz-Yisrael table when `diaspora` is set. Only the differing days appear.
const HOLIDAYS_DIASPORA: Record<string, Record<number, JewishEvent>> = {
  Tishri: {
    16: { name: 'סוכות ב׳', type: 'yomtov' },
    22: { name: 'שמיני עצרת', type: 'yomtov' },
    23: { name: 'שמחת תורה', type: 'yomtov' }
  },
  Nisan: {
    16: { name: 'פסח ב׳', type: 'yomtov' },
    22: { name: 'אחרון של פסח', type: 'yomtov' }
  },
  Sivan: {
    7: { name: 'שבועות ב׳', type: 'yomtov' }
  }
};

/** Holiday for a Gregorian date (with fast-day postponement rules), or null. */
export function getHoliday(
  date: Date,
  opts: EventsOptions = {}
): JewishEvent | null {
  const p = gregToHebParts(date);
  const monthHolidays = HOLIDAYS[p.month];
  let holiday: JewishEvent | null = (monthHolidays && monthHolidays[p.day]) || null;
  if (opts.diaspora) {
    const d = HOLIDAYS_DIASPORA[p.month];
    if (d && d[p.day]) holiday = d[p.day];
  }

  if (date.getDay() === 6) {
    // On Shabbat the fast is not observed; revert to Shabbat display.
    if (
      (p.month === 'Tishri' && p.day === 3) ||
      (p.month === 'Tammuz' && p.day === 17) ||
      (p.month === 'Av' && p.day === 9) ||
      ((p.month === 'Adar' || p.month === 'Adar II') && p.day === 13)
    ) {
      holiday = null;
    }
  } else {
    if (date.getDay() === 0) {
      // Sunday postponements
      if (p.month === 'Tishri' && p.day === 4) {
        const prev = new Date(date);
        prev.setDate(prev.getDate() - 1);
        if (prev.getDay() === 6) return { name: 'צום גדליה (נדחה)', type: 'fast' };
      }
      if (p.month === 'Tammuz' && p.day === 18) {
        const prev = new Date(date);
        prev.setDate(prev.getDate() - 1);
        if (prev.getDay() === 6) return { name: 'י״ז בתמוז (נדחה)', type: 'fast' };
      }
      if (p.month === 'Av' && p.day === 10) {
        const prev = new Date(date);
        prev.setDate(prev.getDate() - 1);
        if (prev.getDay() === 6) return { name: 'תשעה באב (נדחה)', type: 'fast' };
      }
    }
    if (date.getDay() === 4) {
      // Taanit Esther brought forward to Thursday 11 Adar when 13 is Shabbat.
      if ((p.month === 'Adar' || p.month === 'Adar II') && p.day === 11) {
        const d13 = new Date(date);
        d13.setDate(d13.getDate() + 2);
        if (d13.getDay() === 6) return { name: 'תענית אסתר (מוקדם)', type: 'fast' };
      }
    }
  }
  return holiday;
}

/** Rosh Chodesh for a Gregorian date, or null. */
export function getRoshChodesh(date: Date): JewishEvent | null {
  const p = gregToHebParts(date);
  if (p.day === 1) {
    if (p.month === 'Tishri') return null; // Rosh Hashanah, not "Rosh Chodesh"
    return { name: 'ראש חודש ' + hebMonthName(date), type: 'roshchodesh' };
  }
  if (p.day === 30) {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const np = gregToHebParts(next);
    if (np.day === 1 && np.month !== 'Tishri') {
      return { name: 'ראש חודש ' + hebMonthName(next), type: 'roshchodesh' };
    }
  }
  return null;
}

// ===== Parashat HaShavua =====
const PARASHOT: (string | null)[] = [
  null, 'בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח',
  'וישב', 'מקץ', 'ויגש', 'ויחי', 'שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים',
  'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי', 'ויקרא', 'צו', 'שמיני', 'תזריע',
  'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי', 'במדבר', 'נשא',
  'בהעלותך', 'שלח', 'קרח', 'חוקת', 'בלק', 'פינחס', 'מטות', 'מסעי', 'דברים',
  'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבוא', 'נצבים', 'וילך',
  'האזינו', 'וזאת הברכה'
];

// Combinable parasha pairs by first-parasha number, grouped by the segment of
// the year they live in (between the immovable festival anchors).
const SEG2_PAIRS = [42, 39]; // Matot-Masei (combines first), then Chukat-Balak
const SEG3_PAIRS = [51]; // Nitzavim-Vayelech

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function toISOlocal(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// A Shabbat that coincides with a Yom Tov / Chol HaMoed reads the festival
// portion, NOT the weekly parasha — so it does not consume a parasha slot.
// Returns the festival-Shabbat label, or null for an ordinary Shabbat.
function festivalShabbatLabel(date: Date, diaspora: boolean): string | null {
  const p = gregToHebParts(date);
  if (p.month === 'Tishri') {
    if (p.day === 1 || p.day === 2) return 'שבת ראש השנה';
    if (p.day === 10) return 'שבת יום הכיפורים';
    if (p.day === 15) return 'שבת סוכות';
    if (diaspora && p.day === 16) return 'שבת סוכות';
    if (p.day >= 16 && p.day <= 21) return 'שבת חול המועד סוכות';
    if (p.day === 22) return 'שבת שמיני עצרת';
    if (diaspora && p.day === 23) return 'שבת שמחת תורה';
  }
  if (p.month === 'Nisan') {
    if (p.day === 15) return 'שבת פסח';
    if (diaspora && p.day === 16) return 'שבת פסח';
    if (p.day >= 16 && p.day <= 20) return 'שבת חול המועד פסח';
    if (p.day === 21) return 'שבת שביעי של פסח';
    if (diaspora && p.day === 22) return 'שבת אחרון של פסח';
  }
  if (p.month === 'Sivan') {
    if (p.day === 6) return 'שבת שבועות';
    if (diaspora && p.day === 7) return 'שבת שבועות';
  }
  return null;
}

const yearParashaCache: Record<string, Record<string, string>> = {};

// Build the weekly-parasha schedule for a Torah-reading year (Bereishit after
// Simchat Torah of `hebYear` through Simchat Torah of `hebYear`+1).
//
// Method: festival-anchored segment counting. Three immovable anchors pin the
// schedule — Bamidbar (the Shabbat before Shavuot), Devarim (the Shabbat before
// Tisha B'Av) and the run-up to Rosh Hashanah. Within each segment the number
// of combined pairs is forced by counting the available (non-festival)
// Shabbatot, which automatically yields the correct leap-year behaviour and the
// Israel/Diaspora divergence. V'Zot HaBracha (54) is read only on Simchat Torah
// and never appears on a Shabbat, so the weekly cycle covers parashot 1..53.
function buildYearParashot(
  hebYear: number,
  diaspora: boolean
): Record<string, string> {
  const cacheKey = `${hebYear}:${diaspora ? 'd' : 'i'}`;
  if (yearParashaCache[cacheKey]) return yearParashaCache[cacheKey];

  const info = buildYear(hebYear);
  const tishri = info.months.find((m) => m.num === 'Tishri');
  if (!tishri) return {};

  // Simchat Torah is 22 Tishri in Israel, 23 in the Diaspora. Bereishit is the
  // first Shabbat strictly after it.
  const stOffset = diaspora ? 23 : 22;
  const d23 = new Date(tishri.firstGreg);
  d23.setDate(d23.getDate() + stOffset);
  const firstShabbat = new Date(d23);
  while (firstShabbat.getDay() !== 6) firstShabbat.setDate(firstShabbat.getDate() + 1);

  const nextInfo = buildYear(hebYear + 1);
  const nextTishri = nextInfo.months.find((m) => m.num === 'Tishri')!;
  const endDate = new Date(nextTishri.firstGreg);
  endDate.setDate(endDate.getDate() + (stOffset - 1)); // Simchat Torah next year

  const all: Date[] = [];
  const cur = new Date(firstShabbat);
  while (cur <= endDate) {
    all.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }

  const result: Record<string, string> = {};
  // Festival Shabbatot: label them and remove from the parasha-bearing list.
  const R: Date[] = [];
  for (const s of all) {
    const fest = festivalShabbatLabel(s, diaspora);
    if (fest) result[toISOlocal(s)] = fest;
    else R.push(s);
  }

  // The one fully reliable internal anchor: Devarim (44) is read on the Shabbat
  // on or immediately before Tisha B'Av (10 Av). (Shavuot is NOT used as an
  // anchor because the portion before it is Bamidbar in common years but Nasso
  // in many leap years.) Nitzavim (51) and the cycle end give the tail.
  const av10 = hebToGreg(hebYear, 'Av', 10);
  const av10t = av10 ? av10.getTime() : Infinity;
  let idxDevarim = -1;
  R.forEach((d, i) => {
    if (d.getTime() < av10t) idxDevarim = i;
  });

  const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const combinedSet = new Set<number>();

  // --- Segment A: parashot 1..44 (Bereishit .. Devarim) ---
  // The four "spring" pairs (Vayakhel-Pekudei, Tazria-Metzora, Acharei-Kedoshim,
  // Behar-Bechukotai) are combined in common (12-month) years and separate in
  // leap (13-month) years. Any remaining combinations needed in segment A are
  // the "summer" pairs, applied as Matot-Masei first, then Chukat-Balak.
  const slotsA = idxDevarim + 1; // reading Shabbatot for portions 1..44
  let needA = clamp(44 - slotsA, 0, 6);
  const spring = info.leap ? [] : [22, 27, 29, 32];
  // Take as many spring pairs as needed (normally all 4 in a common year).
  const springUsed = Math.min(spring.length, needA);
  for (let i = 0; i < springUsed; i++) combinedSet.add(spring[i]);
  needA -= springUsed;
  for (let i = 0; i < needA && i < SEG2_PAIRS.length; i++) {
    combinedSet.add(SEG2_PAIRS[i]); // [42 Matot-Masei, 39 Chukat-Balak]
  }

  // --- Segment B: parashot 45..53 (Vaetchanan .. Haazinu) ---
  // Only Nitzavim-Vayelech (51) may combine; forced by the tail Shabbat count.
  const slotsB = R.length - 1 - idxDevarim;
  const cB = clamp(9 - slotsB, 0, SEG3_PAIRS.length);
  for (let i = 0; i < cB; i++) combinedSet.add(SEG3_PAIRS[i]);

  let paraIdx = 1;
  for (const shab of R) {
    if (paraIdx > 53) break; // V'Zot HaBracha (54) is read on Simchat Torah only
    const iso = toISOlocal(shab);
    if (combinedSet.has(paraIdx)) {
      result[iso] = PARASHOT[paraIdx] + '-' + PARASHOT[paraIdx + 1];
      paraIdx += 2;
    } else {
      result[iso] = PARASHOT[paraIdx]!;
      paraIdx += 1;
    }
  }

  yearParashaCache[cacheKey] = result;
  return result;
}

/** Parashat HaShavua label for a Shabbat (Saturday), or null otherwise. */
export function getParasha(
  date: Date,
  opts: EventsOptions = {}
): string | null {
  if (date.getDay() !== 6) return null;
  const diaspora = !!opts.diaspora;
  const p = gregToHebParts(date);
  // A Shabbat on/before Simchat Torah belongs to the previous year's cycle.
  const stDay = diaspora ? 23 : 22;
  let cycleYear = p.year;
  if (p.month === 'Tishri' && p.day <= stDay) cycleYear = p.year - 1;
  const schedule = buildYearParashot(cycleYear, diaspora);
  return schedule[toISOlocal(date)] || null;
}

/** All religious events for a date: holiday, Rosh Chodesh, Shabbat (+parasha). */
export function getDayEvents(
  date: Date,
  opts: EventsOptions = {}
): JewishEvent[] {
  const out: JewishEvent[] = [];
  const holiday = getHoliday(date, opts);
  if (holiday) out.push(holiday);
  const rc = getRoshChodesh(date);
  if (rc) out.push(rc);
  if (date.getDay() === 6) {
    const parasha = getParasha(date, opts);
    // Festival-Shabbat labels already include the word "שבת"; parasha names
    // do not, so only prepend it for the weekly portion.
    const name = !parasha
      ? 'שבת'
      : parasha.startsWith('שבת')
        ? parasha
        : 'שבת ' + parasha;
    out.push({ name, type: 'shabbat' });
  }
  return out;
}
