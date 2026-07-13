// date-input.ts — a complete, framework-agnostic input field that opens the
// DatePicker as a popup. Renders: a calendar icon, the formatted value, a clear
// (×) button, and — for a Gregorian day in single mode — inline typing with a
// masked DD/MM/YYYY (forced dir="ltr" so the mask reads correctly inside an RTL
// page). All framework wrappers mount this in "input" mode.
import { DatePicker } from './picker';
import { parseISO, toISO } from './dates';
import { hebFullString, hebMonthYearLabel, hebYearGematriaFull, gregToHebParts } from './hebrew';
import { getGlobalConfig } from './config';
import type { PickerOptions, PickerResult, ISODate } from './types';

export interface DateInputOptions extends PickerOptions {
  /** Placeholder shown when empty. */
  placeholder?: string;
}

const CAL_ICON =
  '<svg class="hdp-cal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';

const p2 = (n: number): string => String(n).padStart(2, '0');

// Masked DD/MM/YYYY (no underscores): auto-insert "/" and clamp day 1–31 / month 1–12.
function maskDate(text: string): string {
  const dg = String(text).replace(/\D/g, '').slice(0, 8);
  let day = dg.slice(0, 2), mon = dg.slice(2, 4);
  const yr = dg.slice(4, 8);
  if (day.length === 2) day = p2(Math.min(31, Math.max(1, +day)));
  if (mon.length === 2) mon = p2(Math.min(12, Math.max(1, +mon)));
  let s = day;
  if (dg.length >= 2) s += '/' + mon;
  if (dg.length >= 4) s += '/' + yr;
  return s;
}

function parseTyped(text: string): ISODate | '' {
  const m = String(text).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? toISO(d) : '';
}

// Flexible parse for PASTED Gregorian text: DD/MM/YYYY, D.M.YYYY, YYYY-MM-DD…
function parseGregFlexible(text: string): ISODate | '' {
  text = String(text).trim();
  let m = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (m) { const d = new Date(+m[3], +m[2] - 1, +m[1]); if (d.getDate() === +m[1] && d.getMonth() === +m[2] - 1) return toISO(d); }
  m = text.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/);
  if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3]); if (d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]) return toISO(d); }
  return '';
}

export class DateInput {
  private opt: DateInputOptions;
  private value: PickerOptions['value'];
  private wrap!: HTMLElement;
  private input!: HTMLInputElement;
  private clearBtn!: HTMLButtonElement;
  private picker: DatePicker | null = null;
  private isOpen = false;
  private readonly isRange: boolean;
  private readonly editable: boolean;
  private readonly openByInputClick: boolean;

  constructor(opt: DateInputOptions = {}) {
    this.opt = opt;
    this.value = opt.value ?? null;
    this.isRange = opt.mode === 'range';
    const gregDisplay = (opt.displayCalendar ?? getGlobalConfig().displayCalendar) === 'gregorian';
    this.editable = gregDisplay && (opt.precision ?? 'day') === 'day' && !this.isRange;
    // openOnInputClick honored only for a Gregorian display (Hebrew always opens).
    this.openByInputClick = !gregDisplay || opt.openOnInputClick !== false;
  }

  mount(host: HTMLElement): this {
    const wrap = document.createElement('span');
    wrap.className = 'hdp-field';
    wrap.innerHTML =
      CAL_ICON +
      '<input class="hdp-input" type="text" inputmode="numeric" />' +
      '<button class="hdp-clear" type="button" tabindex="-1" aria-label="clear">×</button>';
    const icon = wrap.querySelector('.hdp-cal-icon') as SVGElement;
    this.input = wrap.querySelector('.hdp-input') as HTMLInputElement;
    this.clearBtn = wrap.querySelector('.hdp-clear') as HTMLButtonElement;

    this.input.readOnly = false; // never readonly, so paste works
    this.input.placeholder = this.opt.placeholder ?? '';
    if (this.editable) this.input.dir = 'ltr'; // DD/MM/YYYY reads L-to-R even in RTL

    icon.addEventListener('click', (e) => { e.stopPropagation(); this.open(); });
    if (this.openByInputClick) {
      this.input.addEventListener('click', () => this.open());
      this.input.addEventListener('focus', () => this.open());
    }
    this.input.addEventListener('paste', (e) => {
      const txt = (e.clipboardData || (window as unknown as { clipboardData?: DataTransfer }).clipboardData)?.getData('text') || '';
      const iso = parseGregFlexible(txt);
      if (iso) { e.preventDefault(); this.commit(iso); if (this.picker) this.picker.setValue(iso); }
    });
    if (this.editable) {
      this.input.addEventListener('input', () => this.onType());
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); const iso = parseTyped(maskDate(this.input.value)); if (iso) { this.commit(iso); this.refresh(); this.close(); } }
      });
      this.input.addEventListener('blur', () => setTimeout(() => this.refresh(), 150));
    } else {
      // block typed characters (keep click / paste / navigation)
      this.input.addEventListener('keydown', (e) => {
        if (!e.ctrlKey && !e.metaKey && e.key.length === 1) e.preventDefault();
      });
    }
    this.clearBtn.addEventListener('click', (e) => { e.stopPropagation(); this.commit(null); this.refresh(); this.close(); });

    host.appendChild(wrap);
    this.wrap = wrap;
    this.refresh();
    return this;
  }

  /** Programmatically set the value (e.g. from a framework model). */
  setValue(v: PickerOptions['value']): void {
    this.value = v ?? null;
    if (!(this.editable && document.activeElement === this.input)) this.refresh();
    this.picker?.setValue(v ?? null);
  }

  getValue(): PickerOptions['value'] {
    return this.value;
  }

  destroy(): void {
    this.picker?.destroy();
    this.picker = null;
    this.wrap?.remove();
  }

  close(): void {
    this.picker?.close();
  }

  // ---- internals ----
  private onType(): void {
    const caret = this.input.selectionStart ?? this.input.value.length;
    const before = this.input.value;
    const masked = maskDate(before);
    if (masked !== before) {
      const digitsBefore = before.slice(0, caret).replace(/\D/g, '').length;
      this.input.value = masked;
      let idx = 0, seen = 0;
      while (idx < masked.length && seen < digitsBefore) { if (/\d/.test(masked[idx])) seen++; idx++; }
      try { this.input.setSelectionRange(idx, idx); } catch { /* noop */ }
    }
    this.clearBtn.classList.toggle('is-shown', !!this.input.value);
    const iso = parseTyped(this.input.value);
    if (iso) { this.commit(iso); if (this.picker) this.picker.setValue(iso); else this.open(); }
  }

  private commit(v: PickerOptions['value']): void {
    this.value = v;
    if (this.opt.onSelect) this.opt.onSelect(this.result());
  }

  private result(): PickerResult {
    if (this.isRange) {
      const r = (this.value && typeof this.value === 'object') ? this.value : { start: '', end: '' };
      return { start: r.start, end: r.end, type: (this.opt.calendar ?? getGlobalConfig().calendar) };
    }
    return { iso: (typeof this.value === 'string' ? this.value : ''), type: (this.opt.calendar ?? getGlobalConfig().calendar) };
  }

  private open(): void {
    if (this.isOpen) return;
    this.picker = new DatePicker({
      ...this.opt,
      inline: false,
      value: this.value ?? null,
      onClose: () => { this.isOpen = false; },
      onSelect: (r: PickerResult) => {
        this.value = 'iso' in r ? r.iso : { start: r.start, end: r.end };
        if (this.opt.onSelect) this.opt.onSelect(r);
        if (!(this.editable && document.activeElement === this.input)) this.refresh();
      }
    }).open(this.input);
    this.isOpen = true;
  }

  private hasValue(): boolean {
    if (this.isRange) return !!(this.value && typeof this.value === 'object' && (this.value.start || this.value.end));
    return !!this.value;
  }

  private fmtOne(iso: ISODate): string {
    if (!iso) return '';
    const d = parseISO(iso.split('T')[0]);
    if (!d) return '';
    const cal = this.opt.displayCalendar ?? getGlobalConfig().displayCalendar;
    const prec = this.opt.precision ?? 'day';
    const t = this.opt.time && iso.includes('T') ? ' ' + iso.split('T')[1].slice(0, this.opt.seconds ? 8 : 5) : '';
    if (prec === 'year') return cal === 'hebrew' ? hebYearGematriaFull(gregToHebParts(d).year) : String(d.getFullYear());
    if (prec === 'month') return cal === 'hebrew' ? hebMonthYearLabel(d) : `${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
    if (cal === 'hebrew') return hebFullString(d) + t;
    return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}` + t;
  }

  private refresh(): void {
    if (this.isRange) {
      const v = (this.value && typeof this.value === 'object') ? this.value : { start: '', end: '' };
      this.input.value = (v.start || v.end) ? `${this.fmtOne(v.start)} – ${this.fmtOne(v.end)}` : '';
    } else {
      this.input.value = this.fmtOne(typeof this.value === 'string' ? this.value : '');
    }
    this.clearBtn.classList.toggle('is-shown', this.hasValue());
  }
}
