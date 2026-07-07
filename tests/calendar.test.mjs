// Tests the REAL compiled library (lib-cjs, produced by `npm run pretest`).
// Run with `node --test`. Designed to pass under any TZ (CI runs a TZ matrix).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gregToHebParts,
  hebToGreg,
  getMonthsForYear,
  buildYear,
  isLeapYear,
  hebYearGematria,
  hebDayGematria
} from '../lib-cjs/core/index.js';

const toISO = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

test('round-trip greg -> heb -> greg for ~11 years of days (DST-safe)', () => {
  // Step with setDate (noon) so the TEST itself is DST-safe; this exercises
  // buildYear/hebToGreg, which must also be DST-safe.
  const d = new Date(2020, 0, 1, 12);
  const end = new Date(2031, 0, 1, 12);
  let count = 0;
  for (; d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
    const p = gregToHebParts(d);
    const back = hebToGreg(p.year, p.month, p.day);
    assert.ok(back, 'hebToGreg returned null');
    assert.equal(toISO(back), toISO(d), `round-trip failed on ${toISO(d)}`);
    count++;
  }
  assert.ok(count > 4000);
});

test('every Hebrew month has 29 or 30 days', () => {
  for (let y = 5775; y <= 5800; y++) {
    for (const m of getMonthsForYear(y)) {
      assert.ok(m.days === 29 || m.days === 30, `${y} ${m.num} had ${m.days} days`);
    }
  }
});

test('Hebrew year length is 353–385 days', () => {
  for (let y = 5775; y <= 5800; y++) {
    const total = getMonthsForYear(y).reduce((a, m) => a + m.days, 0);
    assert.ok(total >= 353 && total <= 385, `${y} length ${total}`);
  }
});

test('leap years have Adar I & Adar II; common years have Adar', () => {
  assert.equal(isLeapYear(5784), true);
  assert.equal(isLeapYear(5785), false);
  const ly = getMonthsForYear(5784).map((m) => m.num);
  assert.ok(ly.includes('Adar I') && ly.includes('Adar II'));
  assert.ok(getMonthsForYear(5785).map((m) => m.num).includes('Adar'));
  // exactly 12 or 13 months
  assert.ok([12, 13].includes(getMonthsForYear(5786).length));
});

test('known anchors', () => {
  let p = gregToHebParts(new Date(2023, 8, 16, 12)); // Rosh Hashanah 5784
  assert.deepEqual([p.year, p.month, p.day], [5784, 'Tishri', 1]);
  p = gregToHebParts(new Date(2024, 3, 23, 12)); // Pesach 5784
  assert.equal(p.month, 'Nisan');
  assert.equal(p.day, 15);
  p = gregToHebParts(new Date(2024, 11, 26, 12)); // 25 Kislev (Chanukah)
  assert.equal(p.month, 'Kislev');
  assert.equal(p.day, 25);
});

test('gematria formatting', () => {
  assert.equal(hebYearGematria(5786), 'תשפ״ו');
  assert.equal(hebDayGematria(15), 'ט״ו');
  assert.equal(hebDayGematria(16), 'ט״ז');
  assert.equal(hebDayGematria(1), 'א׳');
});

test('buildYear is cached and stable', () => {
  const a = buildYear(5786);
  const b = buildYear(5786);
  assert.equal(a, b);
});
