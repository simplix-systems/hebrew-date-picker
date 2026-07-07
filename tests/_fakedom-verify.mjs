// Sandbox-only sanity driver (no jsdom available here). Drives the REAL
// compiled picker through a tiny DOM shim to confirm date+time combination.
// The shipped, authoritative test is picker-dom.test.mjs (jsdom).
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = []; this.style = {}; this._cls = new Set();
    this.attributes = {}; this._text = ''; this._html = '';
    this.parentNode = null; this.listeners = {}; this.dataset = {};
  }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._cls].join(' '); }
  get classList() {
    const c = this._cls;
    return {
      add: (...x) => x.forEach((k) => k && c.add(k)),
      remove: (...x) => x.forEach((k) => c.delete(k)),
      contains: (k) => c.has(k),
      toggle: (k, f) => { if (f === undefined) { c.has(k) ? c.delete(k) : c.add(k); } else { f ? c.add(k) : c.delete(k); } }
    };
  }
  appendChild(ch) { ch.parentNode = this; this.children.push(ch); return ch; }
  append(...ch) { ch.forEach((c) => this.appendChild(c)); }
  set innerHTML(v) { if (v === '') this.children = []; this._html = v; }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = v; this.children = []; }
  get textContent() { return this._text; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
  set dir(v) { this.attributes.dir = v; }
  set tabIndex(v) { this.attributes.tabIndex = v; }
  set type(v) { this._type = v; } get type() { return this._type; }
  set value(v) { this._value = v; } get value() { return this._value; }
  set selected(v) { this._selected = v; }
  set inputMode(v) { this._im = v; }
  set onclick(f) { this._onclick = f; } get onclick() { return this._onclick; }
  set ondblclick(f) { this._ondblclick = f; }
  set onchange(f) { this._onchange = f; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  removeEventListener(t, f) { if (this.listeners[t]) this.listeners[t] = this.listeners[t].filter((g) => g !== f); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((c) => c !== this); }
  focus() {}
  getBoundingClientRect() { return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }; }
  contains(n) { return n === this || this.children.some((c) => c.contains && c.contains(n)); }
  _walk() { const out = [this]; this.children.forEach((c) => c._walk && out.push(...c._walk())); return out; }
  querySelector(sel) { return this._query(sel)[0] || null; }
  querySelectorAll(sel) { return this._query(sel); }
  _query(sel) {
    const last = sel.trim().split(/\s+/).pop();
    const match = (el) => last.split('.').every((p, i) => (i === 0 ? (p === '' || el.tagName === p.toUpperCase()) : el._cls.has(p)));
    return this._walk().slice(1).filter(match);
  }
}
global.document = { createElement: (t) => new El(t), body: new El('body') };
global.window = { addEventListener() {}, removeEventListener() {}, innerWidth: 1000, innerHeight: 800 };

const { DatePicker } = await import('../lib-cjs/core/index.js');
const ev = { stopPropagation() {} };
let pass = 0, fail = 0;
const ok = (n, c) => (c ? pass++ : (fail++, console.log('FAIL', n)));

// 1) single date + time (24h): default time 00:00
{
  let res = null;
  const host = new El('div');
  new DatePicker({ inline: true, time: true, timeFormat: '24', calendar: 'gregorian', value: '2026-06-16', onSelect: (r) => (res = r) }).mount(host);
  // change hour to 14, minute to 30
  const sels = host.querySelectorAll('.hdp-time-sel');
  sels[0].value = '14'; sels[0]._onchange({ target: sels[0], stopPropagation() {} });
  const sels2 = host.querySelectorAll('.hdp-time-sel');
  sels2[1].value = '30'; sels2[1]._onchange({ target: sels2[1], stopPropagation() {} });
  host.querySelector('.hdp-btn-primary')._onclick(ev);
  ok('single 24h time -> 2026-06-16T14:30 (got ' + (res && res.iso) + ')', res && res.iso === '2026-06-16T14:30');
}

// 2) no time option -> plain date
{
  let res = null;
  const host = new El('div');
  new DatePicker({ inline: true, calendar: 'gregorian', value: '2026-06-16', onSelect: (r) => (res = r) }).mount(host);
  host.querySelector('.hdp-btn-primary')._onclick(ev);
  ok('no time -> 2026-06-16 (got ' + (res && res.iso) + ')', res && res.iso === '2026-06-16');
}

// 3) range + time: each endpoint keeps its own time
{
  let res = null;
  const host = new El('div');
  new DatePicker({ inline: true, mode: 'range', time: true, timeFormat: '24', calendar: 'gregorian', value: { start: '2026-06-10', end: '2026-06-20' }, onSelect: (r) => (res = r) }).mount(host);
  const sels = host.querySelectorAll('.hdp-time-sel'); // [startH,startM,endH,endM]
  sels[0].value = '9'; sels[0]._onchange({ target: sels[0], stopPropagation() {} });
  const s2 = host.querySelectorAll('.hdp-time-sel');
  s2[3].value = '45'; s2[3]._onchange({ target: s2[3], stopPropagation() {} });
  host.querySelector('.hdp-btn-primary')._onclick(ev);
  ok('range times start=09:00 end=...:45 (got ' + JSON.stringify(res) + ')',
    res && res.start === '2026-06-10T09:00' && /T\d\d:45$/.test(res.end));
}

// extra: 12h AM/PM and cell click
{
  let res=null; const host=new El('div');
  new DatePicker({inline:true,time:true,timeFormat:'12',calendar:'gregorian',value:'2026-06-16',onSelect:r=>res=r}).mount(host);
  const s=host.querySelectorAll('.hdp-time-sel'); // hour,min,ampm
  s[0].value='7'; s[0]._onchange({target:s[0],stopPropagation(){}});
  const s2=host.querySelectorAll('.hdp-time-sel'); s2[1].value='5'; s2[1]._onchange({target:s2[1],stopPropagation(){}});
  const s3=host.querySelectorAll('.hdp-time-sel'); s3[2].value='PM'; s3[2]._onchange({target:s3[2],stopPropagation(){}});
  host.querySelector('.hdp-btn-primary')._onclick({stopPropagation(){}});
  console.log('12h 7:05 PM ->', res.iso, res.iso==='2026-06-16T19:05'?'OK':'FAIL');
}
console.log(fail ? `\n${fail} FAIL` : `\nAll ${pass} core picker DOM checks passed`);
process.exit(fail ? 1 : 0);
