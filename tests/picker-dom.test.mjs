// Real DOM tests for the picker (jsdom). Verifies that date + time combine
// into "YYYY-MM-DDTHH:mm" on commit, in single and range modes.
//
// Requires the `jsdom` devDependency. If it isn't installed (e.g. an offline
// sandbox), the suite is skipped rather than failing.
import { test } from 'node:test';
import assert from 'node:assert/strict';

let JSDOM = null;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  test('picker DOM (skipped — jsdom not installed)', { skip: true }, () => {});
}

if (JSDOM) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.MouseEvent = dom.window.MouseEvent;

  const { DatePicker } = await import('../lib-cjs/core/index.js');

  const mount = (opts) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let result = null;
    new DatePicker({ inline: true, ...opts, onSelect: (r) => (result = r) }).mount(host);
    return { host, get: () => result };
  };
  const setSelect = (el, value) => {
    el.value = String(value);
    el.dispatchEvent(new window.Event('change', { bubbles: true }));
  };
  const ok = (host) => host.querySelector('.hdp-btn-primary');

  test('single date + 24h time commits YYYY-MM-DDTHH:mm', () => {
    const { host, get } = mount({ time: true, timeFormat: '24', calendar: 'gregorian', value: '2026-06-16' });
    const sels = host.querySelectorAll('.hdp-time-sel');
    setSelect(sels[0], '14'); // hours
    setSelect(host.querySelectorAll('.hdp-time-sel')[1], '30'); // minutes
    ok(host).click();
    assert.equal(get().iso, '2026-06-16T14:30');
  });

  test('without time option, value stays a plain date', () => {
    const { host, get } = mount({ calendar: 'gregorian', value: '2026-06-16' });
    ok(host).click();
    assert.equal(get().iso, '2026-06-16');
  });

  test('12h time converts AM/PM to 24h on commit', () => {
    const { host, get } = mount({ time: true, timeFormat: '12', calendar: 'gregorian', value: '2026-06-16' });
    const sels = host.querySelectorAll('.hdp-time-sel'); // [hour(1-12), minute, AM/PM]
    setSelect(sels[0], '7');
    setSelect(host.querySelectorAll('.hdp-time-sel')[1], '5');
    setSelect(host.querySelectorAll('.hdp-time-sel')[2], 'PM');
    ok(host).click();
    assert.equal(get().iso, '2026-06-16T19:05');
  });

  test('range keeps an independent time per endpoint', () => {
    const { host, get } = mount({
      mode: 'range', time: true, timeFormat: '24', calendar: 'gregorian',
      value: { start: '2026-06-10', end: '2026-06-20' }
    });
    const sels = host.querySelectorAll('.hdp-time-sel'); // start[H,M], end[H,M]
    setSelect(sels[0], '9');
    setSelect(host.querySelectorAll('.hdp-time-sel')[3], '45');
    ok(host).click();
    const r = get();
    assert.equal(r.start, '2026-06-10T09:00');
    assert.match(r.end, /^2026-06-20T\d\d:45$/);
  });

  test('keyboard keeps working after a mouse click (focus stays on the grid)', () => {
    const { host } = mount({ calendar: 'gregorian', value: '2026-06-16' });
    const root = host.querySelector('.hdp-cal');
    root.focus();
    const cellOf = (n) => [...host.querySelectorAll('.hdp-cell')]
      .find((c) => c.querySelector('.hdp-num')?.textContent === String(n));
    // mousedown should keep focus on the grid root (not the cell button)
    cellOf(10).dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    assert.equal(document.activeElement, root, 'focus should remain on the calendar root');
    cellOf(10).click(); // selects June 10 internally
    // two more arrow presses must keep navigating (RTL: ArrowLeft = next day)
    const press = (key) => document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    press('ArrowLeft');
    press('ArrowLeft');
    const sel = host.querySelector('.hdp-cell.is-selected .hdp-num').textContent;
    assert.equal(sel, '12', 'selection should advance to 12 (10 -> 11 -> 12)');
  });

  test('clicking a day cell updates the committed date', () => {
    const { host, get } = mount({ calendar: 'gregorian', value: '2026-06-16' });
    const cells = [...host.querySelectorAll('.hdp-cell')].filter((c) => !c.classList.contains('is-blank'));
    const ten = cells.find((c) => c.querySelector('.hdp-num')?.textContent === '10');
    ten.click();
    ok(host).click();
    assert.equal(get().iso, '2026-06-10');
  });

  test('range hover preview highlights the prospective range', () => {
    const { host } = mount({ mode: 'range', calendar: 'gregorian', value: { start: '2026-06-20', end: '' } });
    const grid0 = host.querySelectorAll('.hdp-col')[0];
    const cellOf = (iso) => [...grid0.querySelectorAll('.hdp-cell')].find((c) => c.dataset.iso === iso);
    cellOf('2026-06-10').click(); // picks day 10 as the (only) start
    cellOf('2026-06-15').dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: true }));
    assert.ok(cellOf('2026-06-12').classList.contains('is-in-range'), 'day 12 should preview as in-range');
    assert.ok(cellOf('2026-06-15').classList.contains('is-range-end'), 'hovered day should be the range end');
    assert.ok(cellOf('2026-06-10').classList.contains('is-range-start'), 'picked day should be the range start');
  });
}
