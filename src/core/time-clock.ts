// time-clock.ts - A Material-style analog clock time picker (the 'clock' time
// style). Pick the hour on the dial, then the minute, with an AM/PM toggle for
// 12-hour mode and an inner ring for 13–24 in 24-hour mode.
//
// Minutes (and seconds) can be picked to an EXACT value — click anywhere on the
// dial (the value is read from the pointer angle), or use the −/+ fine stepper
// below the dial. The numbered markers are only guides at the 5-unit positions.
const NS = 'http://www.w3.org/2000/svg';

function svg(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(NS, tag) as SVGElement;
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
}
function ce(tag: string, cls?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

export interface ClockParams {
  is12: boolean;
  /** Also pick seconds (get/set strings are "HH:mm:ss"). */
  seconds?: boolean;
  get: () => string; // "HH:mm" or "HH:mm:ss" (24h internally)
  set: (t: string) => void; // receives the same shape it was given
}

const SIZE = 220;
const C = SIZE / 2;
const R_OUTER = 90;
const R_INNER = 58;

export function buildClockTime(p: ClockParams): HTMLElement {
  const wrap = ce('div', 'hdp-clock');
  const withSec = !!p.seconds;
  let mode: 'hours' | 'minutes' | 'seconds' = 'hours';

  const pad = (n: number) => String(n).padStart(2, '0');
  const parse = (): [number, number, number] => {
    const a = (p.get() || '00:00').split(':').map((n) => parseInt(n, 10));
    return [isNaN(a[0]) ? 0 : a[0], isNaN(a[1]) ? 0 : a[1], isNaN(a[2]) ? 0 : a[2]];
  };
  const store = (h: number, m: number, s: number) => {
    const H = ((h % 24) + 24) % 24;
    const M = ((m % 60) + 60) % 60;
    const S = ((s % 60) + 60) % 60;
    p.set(withSec ? `${pad(H)}:${pad(M)}:${pad(S)}` : `${pad(H)}:${pad(M)}`);
    render();
  };

  function numNode(
    label: string,
    angleDeg: number,
    radius: number,
    active: boolean,
    onPick: () => void
  ): SVGElement {
    const rad = (angleDeg * Math.PI) / 180;
    const x = C + radius * Math.cos(rad);
    const y = C + radius * Math.sin(rad);
    const g = svg('g', { class: 'hdp-clock-num' + (active ? ' is-active' : '') });
    (g as unknown as SVGElement).setAttribute('tabindex', '-1');
    const circ = svg('circle', { cx: x, cy: y, r: 15, class: 'hdp-clock-numbg' });
    const txt = svg('text', {
      x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'hdp-clock-txt'
    });
    txt.textContent = label;
    g.appendChild(circ);
    g.appendChild(txt);
    (g as unknown as { onclick: (e: Event) => void }).onclick = (e: Event) => {
      e.stopPropagation();
      onPick();
    };
    return g;
  }

  function render(): void {
    wrap.innerHTML = '';
    const [hh, mm, ss] = parse();
    const dispH = p.is12 ? ((hh + 11) % 12) + 1 : hh;
    const ampm = hh < 12 ? 'AM' : 'PM';

    // ----- header (digital) -----
    const head = ce('div', 'hdp-clock-head');
    const digit = (text: string, on: boolean, onClick: () => void): HTMLButtonElement => {
      const b = ce('button', 'hdp-clock-digit' + (on ? ' is-active' : '')) as HTMLButtonElement;
      b.type = 'button';
      b.textContent = text;
      b.onclick = (e) => { e.stopPropagation(); onClick(); };
      return b;
    };
    const colon = () => { const c = ce('span', 'hdp-clock-colon'); c.textContent = ':'; return c; };
    head.appendChild(digit(pad(dispH), mode === 'hours', () => { mode = 'hours'; render(); }));
    head.appendChild(colon());
    head.appendChild(digit(pad(mm), mode === 'minutes', () => { mode = 'minutes'; render(); }));
    if (withSec) {
      head.appendChild(colon());
      head.appendChild(digit(pad(ss), mode === 'seconds', () => { mode = 'seconds'; render(); }));
    }
    if (p.is12) {
      const ap = ce('div', 'hdp-clock-ampm');
      (['AM', 'PM'] as const).forEach((t) => {
        const b = ce('button', 'hdp-clock-ap' + (ampm === t ? ' is-active' : '')) as HTMLButtonElement;
        b.type = 'button';
        b.textContent = t;
        b.onclick = (e) => {
          e.stopPropagation();
          const base = hh % 12;
          store(t === 'PM' ? base + 12 : base, mm, ss);
        };
        ap.appendChild(b);
      });
      head.appendChild(ap);
    }
    wrap.appendChild(head);

    // ----- dial -----
    const s = svg('svg', { width: SIZE, height: SIZE, viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'hdp-clock-dial' });
    s.appendChild(svg('circle', { cx: C, cy: C, r: C - 4, class: 'hdp-clock-face' }));
    s.appendChild(svg('circle', { cx: C, cy: C, r: 3, class: 'hdp-clock-center' }));

    let handAngle: number | null = null;
    let handR = R_OUTER;
    const hand = svg('line', { x1: C, y1: C, x2: C, y2: C, class: 'hdp-clock-hand' });
    s.appendChild(hand);
    const setHand = (angleDeg: number, r: number) => { handAngle = angleDeg; handR = r; };

    // Click anywhere on the dial in minute/second mode → exact value from angle.
    if (mode === 'minutes' || mode === 'seconds') {
      (s as unknown as { onclick: (e: MouseEvent) => void }).onclick = (e: MouseEvent) => {
        const rect = (s as unknown as SVGGraphicsElement).getBoundingClientRect();
        const scale = rect.width ? SIZE / rect.width : 1;
        const x = (e.clientX - rect.left) * scale - C;
        const y = (e.clientY - rect.top) * scale - C;
        let ang = (Math.atan2(y, x) * 180) / Math.PI; // 0 = +x (3 o'clock)
        ang = (ang + 90 + 360) % 360; // 0 = top, clockwise
        const val = Math.round(ang / 6) % 60; // 0..59
        if (mode === 'minutes') store(hh, val, ss);
        else store(hh, mm, val);
      };
    }

    if (mode === 'hours') {
      for (let pos = 1; pos <= 12; pos++) {
        const ang = pos * 30 - 90;
        const outActive = p.is12 ? dispH === pos : hh === pos;
        s.appendChild(numNode(String(pos).padStart(2, '0'), ang, R_OUTER, outActive, () => {
          if (p.is12) {
            const base = pos % 12;
            store(ampm === 'PM' ? base + 12 : base, mm, ss);
          } else {
            store(pos, mm, ss);
          }
          mode = 'minutes';
          render();
        }));
        if (outActive) setHand(ang, R_OUTER);
        if (!p.is12) {
          const innVal = pos === 12 ? 0 : pos + 12;
          const innActive = hh === innVal;
          s.appendChild(numNode(String(innVal).padStart(2, '0'), ang, R_INNER, innActive, () => {
            store(innVal, mm, ss);
            mode = 'minutes';
            render();
          }));
          if (innActive) setHand(ang, R_INNER);
        }
      }
    } else {
      // minutes / seconds — draw a visible selector dot at the EXACT value (even
      // between the 5-unit markers), then the markers on top; the nearest marker
      // is rendered white where the dot covers it.
      const cur = mode === 'minutes' ? mm : ss;
      const exactAng = ((cur * 6 - 90) * Math.PI) / 180;
      s.appendChild(svg('circle', {
        cx: C + R_OUTER * Math.cos(exactAng),
        cy: C + R_OUTER * Math.sin(exactAng),
        r: 16,
        class: 'hdp-clock-sel'
      }));
      const nearest = (Math.round(cur / 5) * 5) % 60;
      const d = Math.abs(cur - nearest);
      const covered = Math.min(d, 60 - d) <= 2;
      for (let pos = 0; pos < 12; pos++) {
        const v = pos * 5;
        const ang = pos * 30 - 90;
        const onValue = mode === 'minutes' ? (vv: number) => store(hh, vv, ss) : (vv: number) => store(hh, mm, vv);
        s.appendChild(numNode(String(v).padStart(2, '0'), ang, R_OUTER, v === nearest && covered, () => onValue(v)));
      }
      setHand(cur * 6 - 90, R_OUTER);
    }

    if (handAngle !== null) {
      const rad = (handAngle * Math.PI) / 180;
      hand.setAttribute('x2', String(C + handR * Math.cos(rad)));
      hand.setAttribute('y2', String(C + handR * Math.sin(rad)));
    }
    wrap.appendChild(s);

    // ----- fine stepper for the active unit (exact ±1 / type-in control) -----
    if (mode !== 'hours') {
      const fine = ce('div', 'hdp-clock-fine');
      const cur = mode === 'minutes' ? mm : ss;
      const apply = (v: number) => (mode === 'minutes' ? store(hh, v, ss) : store(hh, mm, v));
      const minus = ce('button', 'hdp-clock-fine-btn') as HTMLButtonElement;
      minus.type = 'button';
      minus.textContent = '−';
      minus.onclick = (e) => { e.stopPropagation(); apply(cur - 1); };
      const val = ce('input', 'hdp-clock-fine-val') as HTMLInputElement;
      val.type = 'text';
      val.inputMode = 'numeric';
      val.value = pad(cur);
      val.onclick = (e) => e.stopPropagation();
      val.onchange = (e) => {
        e.stopPropagation();
        let n = parseInt((e.target as HTMLInputElement).value, 10);
        if (isNaN(n)) n = 0;
        apply(((n % 60) + 60) % 60);
      };
      const plus = ce('button', 'hdp-clock-fine-btn') as HTMLButtonElement;
      plus.type = 'button';
      plus.textContent = '+';
      plus.onclick = (e) => { e.stopPropagation(); apply(cur + 1); };
      const lbl = ce('span', 'hdp-clock-fine-label');
      lbl.textContent = mode === 'minutes' ? 'min' : 'sec';
      fine.appendChild(minus);
      fine.appendChild(val);
      fine.appendChild(plus);
      fine.appendChild(lbl);
      wrap.appendChild(fine);
    }
  }

  render();
  return wrap;
}
