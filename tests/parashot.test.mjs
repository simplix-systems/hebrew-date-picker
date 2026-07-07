// Parashat HaShavua verified against hebcal.com authoritative data.
// Covers: a full leap year (5782, all pairs separate), a non-leap summer
// (5783: Matot-Masei combined, Chukat-Balak separate), and the famous
// 5782 Israel/Diaspora divergence (8th-day Pesach on Shabbat).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getParasha, getDayEvents, hebToGreg, buildYear } from '../lib-cjs/core/index.js';

const PARASHOT = [
  null, 'בראשית','נח','לך לך','וירא','חיי שרה','תולדות','ויצא','וישלח','וישב','מקץ','ויגש','ויחי',
  'שמות','וארא','בא','בשלח','יתרו','משפטים','תרומה','תצוה','כי תשא','ויקהל','פקודי','ויקרא','צו','שמיני',
  'תזריע','מצורע','אחרי מות','קדושים','אמור','בהר','בחוקותי','במדבר','נשא','בהעלותך','שלח','קרח','חוקת',
  'בלק','פינחס','מטות','מסעי','דברים','ואתחנן','עקב','ראה','שופטים','כי תצא','כי תבוא','נצבים','וילך',
  'האזינו','וזאת הברכה'
];
const idxOf = (n) => PARASHOT.indexOf(n);
const idxAt = (isoDate, diaspora) => {
  const p = getParasha(new Date(isoDate + 'T12:00:00'), { diaspora });
  return p ? p.split('-').map((s) => idxOf(s.trim())) : null;
};

// hebcal Israel 5782 (Gregorian 2022) — a leap year: every pair is SEPARATE.
const ISRAEL_2022 = {
  '2022-01-01': 14, '2022-01-08': 15, '2022-01-15': 16, '2022-01-22': 17, '2022-01-29': 18,
  '2022-02-05': 19, '2022-02-12': 20, '2022-02-19': 21, '2022-02-26': 22, '2022-03-05': 23,
  '2022-03-12': 24, '2022-03-19': 25, '2022-03-26': 26, '2022-04-02': 27, '2022-04-09': 28,
  '2022-04-23': 29, '2022-04-30': 30, '2022-05-07': 31, '2022-05-14': 32, '2022-05-21': 33,
  '2022-05-28': 34, '2022-06-04': 35, '2022-06-11': 36, '2022-06-18': 37, '2022-06-25': 38,
  '2022-07-02': 39, '2022-07-09': 40, '2022-07-16': 41, '2022-07-23': 42, '2022-07-30': 43,
  '2022-08-06': 44, '2022-08-13': 45, '2022-08-20': 46, '2022-08-27': 47, '2022-09-03': 48,
  '2022-09-10': 49, '2022-09-17': 50, '2022-09-24': 51, '2022-10-01': 52, '2022-10-08': 53,
  '2022-10-22': 1, '2022-10-29': 2, '2022-11-05': 3, '2022-11-12': 4, '2022-11-19': 5,
  '2022-11-26': 6, '2022-12-03': 7, '2022-12-10': 8, '2022-12-17': 9, '2022-12-24': 10, '2022-12-31': 11
};
// hebcal Israel 5783 summer (non-leap): Chukat & Balak SEPARATE, Matot-Masei COMBINED.
const ISRAEL_2023_SUMMER = {
  '2023-07-01': 40, '2023-07-08': 41, '2023-07-15': [42, 43], '2023-07-22': 44, '2023-07-29': 45
};
// hebcal Diaspora 5782 spring: one week BEHIND Israel (the divergence).
const DIASPORA_2022 = {
  '2022-05-07': 30, '2022-05-14': 31, '2022-05-21': 32, '2022-05-28': 33
};

function checkSet(name, table, diaspora) {
  test(`matches hebcal: ${name}`, () => {
    for (const [date, exp] of Object.entries(table)) {
      const want = Array.isArray(exp) ? exp : [exp];
      const got = idxAt(date, diaspora);
      assert.deepEqual(got, want, `${date}: got ${got && got.map((i) => PARASHOT[i])}, want ${want.map((i) => PARASHOT[i])}`);
    }
  });
}
checkSet('Israel 5782 (leap, all separate)', ISRAEL_2022, false);
checkSet('Israel 5783 summer (Matot-Masei combined)', ISRAEL_2023_SUMMER, false);
checkSet('Diaspora 5782 divergence', DIASPORA_2022, true);

test('V\'Zot HaBracha never appears on a Shabbat (Israel + Diaspora, 5780-5800)', () => {
  for (const dia of [false, true]) {
    for (let y = 5780; y <= 5800; y++) {
      const t = buildYear(y).months.find((m) => m.num === 'Tishri');
      const d = new Date(t.firstGreg.getFullYear(), t.firstGreg.getMonth(), t.firstGreg.getDate(), 12);
      for (let i = 0; i < 400; i++, d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 6) continue;
        const par = getParasha(d, { diaspora: dia });
        assert.ok(!par || !par.includes('וזאת הברכה'), `VeZot on ${d.toDateString()}`);
      }
    }
  }
});

test('Shabbat Chol HaMoed Pesach has no weekly parasha', () => {
  for (const dia of [false, true]) {
    for (let y = 5780; y <= 5800; y++) {
      for (let day = 16; day <= 20; day++) {
        const g = hebToGreg(y, 'Nisan', day);
        if (!g || g.getDay() !== 6) continue;
        const ev = getDayEvents(g, { diaspora: dia }).find((e) => e.type === 'shabbat');
        assert.ok(/פסח/.test(ev.name), `${y} Nisan ${day} labeled ${ev.name}`);
      }
    }
  }
});

test('every Shabbat is labeled (parasha or festival)', () => {
  for (const dia of [false, true]) {
    for (let y = 5781; y <= 5795; y++) {
      const t = buildYear(y).months.find((m) => m.num === 'Tishri');
      const d = new Date(t.firstGreg.getFullYear(), t.firstGreg.getMonth(), t.firstGreg.getDate(), 12);
      for (let i = 0; i < 380; i++, d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 6) continue;
        const sh = getDayEvents(d, { diaspora: dia }).find((e) => e.type === 'shabbat');
        assert.ok(sh, `unlabeled Shabbat ${d.toDateString()}`);
      }
    }
  }
});
