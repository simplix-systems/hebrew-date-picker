// Holiday / Rosh Chodesh / Parashat tests against the real compiled library.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getHoliday,
  getParasha,
  getDayEvents,
  getMonthsForYear,
  hebToGreg,
  buildYear
} from '../lib-cjs/core/index.js';

const PARASHA_COUNT = 54;

test('holiday detection (religious only)', () => {
  // 25 Kislev 5785 -> Chanukah (2024-12-26)
  assert.equal(getHoliday(new Date(2024, 11, 26, 12))?.type, 'chanukah');
  // Tu BiShvat 5785: 15 Shevat
  const tu = hebToGreg(5785, 'Shevat', 15);
  assert.equal(getHoliday(tu)?.name, 'ט״ו בשבט');
});

test('Purim falls in Adar (common) / Adar II (leap)', () => {
  // 5785 common -> Adar; 5784 leap -> Adar II
  const purimCommon = hebToGreg(5785, 'Adar', 14);
  assert.equal(getHoliday(purimCommon)?.name, 'פורים');
  const purimLeap = hebToGreg(5784, 'Adar II', 14);
  assert.equal(getHoliday(purimLeap)?.name, 'פורים');
});

test('every Shabbat of a year gets a parasha or a festival label', () => {
  // Walk every Saturday across several Hebrew years; none should be unlabeled.
  for (let y = 5780; y <= 5795; y++) {
    const tishri = buildYear(y).months.find((m) => m.num === 'Tishri');
    const start = new Date(tishri.firstGreg);
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
    for (let i = 0; i < 380; i++, d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 6) continue;
      const events = getDayEvents(d);
      const shabbat = events.find((e) => e.type === 'shabbat');
      assert.ok(shabbat, `no shabbat event on ${d.toDateString()}`);
    }
  }
});

test('combined parashot appear (e.g. Vayakhel-Pekudei has a hyphen)', () => {
  // In common years several pairs combine; assert at least one hyphenated label.
  let foundCombo = false;
  const tishri = buildYear(5785).months.find((m) => m.num === 'Tishri');
  const d = new Date(tishri.firstGreg.getFullYear(), tishri.firstGreg.getMonth(), tishri.firstGreg.getDate(), 12);
  for (let i = 0; i < 380; i++, d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 6) continue;
    const p = getParasha(d);
    if (p && p.includes('-')) { foundCombo = true; break; }
  }
  assert.ok(foundCombo, 'expected at least one combined parasha in 5785');
});

test('Rosh Chodesh on the 1st of a month (not Tishri)', () => {
  const rc = getDayEvents(hebToGreg(5786, 'Shevat', 1)).find((e) => e.type === 'roshchodesh');
  assert.ok(rc && rc.name.startsWith('ראש חודש'));
});

test('no Israeli State holidays are present', () => {
  // Yom HaAtzmaut area (5 Iyar) must NOT yield a holiday.
  const iyar5 = hebToGreg(5786, 'Iyar', 5);
  const h = getHoliday(iyar5);
  assert.ok(!h || !/עצמאות|שואה|זיכרון|ירושלים/.test(h.name));
});
