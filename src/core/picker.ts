// picker.ts - The DatePicker controller: tabs, single/range, popup/inline,
// action bar, value management. Wraps one or two CalendarView grids.
import { CalendarView, removeTip } from './calendar-view';
import { buildClockTime } from './time-clock';
import { getGlobalConfig, DEFAULT_LABELS_EN } from './config';
import { toISO, compareISO } from './dates';
import type {
  CalendarType,
  PickerOptions,
  PickerLabels,
  PickerResult,
  ISODate,
  SelectionMode,
  Precision,
  TimeFormat,
  TimeStyle,
  PickerSize,
  Lang,
  Theme
} from './types';

interface Resolved {
  calendar: CalendarType;
  mode: SelectionMode;
  precision: Precision;
  inline: boolean;
  min: ISODate | null;
  max: ISODate | null;
  highlightShabbat: boolean;
  highlightHolidays: boolean;
  showParasha: boolean;
  showTooltips: boolean;
  outsideDays: boolean;
  diaspora: boolean;
  time: boolean;
  seconds: boolean;
  timeFormat: TimeFormat;
  timeStyle: TimeStyle;
  rounded: boolean;
  headerBorder: boolean;
  primaryColor: string;
  theme: Theme;
  size: PickerSize;
  compact: boolean;
  closeOnSelect: boolean;
  labels: PickerLabels;
  locale: string;
  onSelect?: (r: PickerResult) => void;
  onClose?: () => void;
}

/**
 * Choose black or white text to sit ON a background color, by its YIQ
 * luminance (per the classic contrast heuristic). Resolves any CSS color
 * (hex / rgb / named) via a throwaway element; falls back to white.
 */
function onPrimaryColor(color: string): string {
  try {
    if (typeof document === 'undefined') return '#ffffff';
    const probe = document.createElement('span');
    probe.style.color = color;
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    const m = rgb.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return '#ffffff';
    const [r, g, b] = m.map(Number);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? '#111827' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

export class DatePicker {
  private opt: Resolved;
  private panel!: HTMLElement;
  private type: CalendarType;
  private views: CalendarView[] = [];
  private startISO: ISODate;
  private endISO: ISODate;
  private startTime = '00:00';
  private endTime = '00:00';
  private lang: Lang;
  private previewClearTimer: ReturnType<typeof setTimeout> | null = null;
  private detachers: Array<() => void> = [];
  private originalValue: PickerOptions['value'];
  /** Which range column the user last interacted with ('start' = leading, 'end' = trailing). */
  private lastFocusedCol: 'start' | 'end' = 'start';

  constructor(options: PickerOptions = {}) {
    const g = getGlobalConfig();
    // Resolve the UI language: English uses the EN label preset + en-US locale;
    // Hebrew keeps the (possibly globally-customized) labels/locale. Per-instance
    // `labels` always win.
    const lang = options.lang ?? g.lang;
    this.lang = lang;
    const isEn = lang === 'en';
    const baseLabels: PickerLabels = isEn ? DEFAULT_LABELS_EN : g.labels;
    const seconds = options.seconds ?? g.seconds;
    this.opt = {
      calendar: options.calendar ?? g.calendar,
      mode: options.mode ?? 'single',
      precision: options.precision ?? 'day',
      inline: options.inline ?? false,
      min: options.min ?? null,
      max: options.max ?? null,
      highlightShabbat: options.highlightShabbat ?? g.highlightShabbat,
      highlightHolidays: options.highlightHolidays ?? g.highlightHolidays,
      showParasha: options.showParasha ?? g.showParasha,
      showTooltips: options.showTooltips ?? g.showTooltips,
      outsideDays: options.outsideDays ?? g.outsideDays,
      diaspora: options.diaspora ?? g.diaspora,
      time: options.time ?? g.time,
      seconds,
      timeFormat: options.timeFormat ?? g.timeFormat,
      timeStyle: options.timeStyle ?? g.timeStyle,
      rounded: options.rounded ?? g.rounded,
      headerBorder: options.headerBorder ?? g.headerBorder,
      primaryColor: options.primaryColor ?? g.primaryColor,
      theme: options.theme ?? 'light',
      size: options.size ?? g.size,
      compact: options.compact ?? g.compact,
      closeOnSelect: options.closeOnSelect ?? g.closeOnSelect,
      labels: { ...baseLabels, ...(options.labels || {}) },
      locale: isEn ? 'en-US' : g.locale,
      onSelect: options.onSelect,
      onClose: options.onClose
    };
    this.type = this.opt.calendar;
    this.originalValue = options.value ?? null;
    const v = options.value;
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const defTime = seconds ? '00:00:00' : '00:00';
    const split = (iso: string): [ISODate, string] => {
      if (iso && iso.includes('T')) {
        const [d, t] = iso.split('T');
        const parts = (t || '').split(':').map((x) => parseInt(x, 10));
        const h = pad2(parts[0] || 0), m = pad2(parts[1] || 0), s = pad2(parts[2] || 0);
        return [d, seconds ? `${h}:${m}:${s}` : `${h}:${m}`];
      }
      return [iso || '', defTime];
    };
    if (v && typeof v === 'object') {
      [this.startISO, this.startTime] = split(v.start || '');
      [this.endISO, this.endTime] = split(v.end || '');
    } else {
      [this.startISO, this.startTime] = split((v as ISODate) || '');
      this.endISO = '';
    }
  }

  // ===== Mounting =====

  /** Render inline into a container element. Returns this. */
  mount(container: HTMLElement): this {
    this.opt.inline = true;
    this.buildPanel();
    container.appendChild(this.panel);
    this.applyContrast();
    return this;
  }

  /**
   * Set --hdp-on-primary (black/white) from the RESOLVED --hdp-primary, whether
   * it came from the primaryColor option or a stylesheet/theme (e.g. Filament).
   * Runs once the panel is in the DOM so the CSS variable is resolvable.
   */
  private applyContrast(): void {
    if (typeof getComputedStyle === 'undefined' || !this.panel) return;
    const primary = getComputedStyle(this.panel).getPropertyValue('--hdp-primary').trim();
    if (primary) this.panel.style.setProperty('--hdp-on-primary', onPrimaryColor(primary));
  }

  /** Open as a popup anchored to `anchor`. Returns this. */
  open(anchor: HTMLElement): this {
    this.close();
    this.opt.inline = false;
    this.buildPanel();
    document.body.appendChild(this.panel);
    this.applyContrast();
    this.position(anchor);

    const reposition = () => this.position(anchor);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    this.detachers.push(() => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    });

    const outside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!this.panel.contains(t) && t !== anchor && !anchor.contains(t)) this.close();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close();
    };
    setTimeout(() => {
      document.addEventListener('mousedown', outside, true);
      document.addEventListener('keydown', esc);
    }, 0);
    this.detachers.push(() => {
      document.removeEventListener('mousedown', outside, true);
      document.removeEventListener('keydown', esc);
    });

    if (this.views[0]) this.views[0].focus();
    return this;
  }

  /** Close a popup / tear down. */
  close(): void {
    if (this.previewClearTimer !== null) {
      clearTimeout(this.previewClearTimer);
      this.previewClearTimer = null;
    }
    this.detachers.forEach((d) => d());
    this.detachers = [];
    this.views.forEach((v) => v.destroy());
    this.views = [];
    removeTip(); // never leave an orphaned day tooltip in the DOM
    if (this.panel && this.panel.parentElement && !this.opt.inline) {
      this.panel.remove();
    }
    if (this.opt.onClose) this.opt.onClose();
  }

  /** Remove everything (inline or popup). */
  destroy(): void {
    if (this.previewClearTimer !== null) {
      clearTimeout(this.previewClearTimer);
      this.previewClearTimer = null;
    }
    this.detachers.forEach((d) => d());
    this.detachers = [];
    this.views.forEach((v) => v.destroy());
    this.views = [];
    removeTip();
    if (this.panel) this.panel.remove();
  }

  /** Switch the UI language at runtime ('he' ⇄ 'en'); flips RTL/LTR and labels. */
  setLang(lang: Lang): void {
    if (lang === this.lang) return;
    this.lang = lang;
    const isEn = lang === 'en';
    const g = getGlobalConfig();
    this.opt.labels = isEn ? { ...DEFAULT_LABELS_EN } : { ...g.labels };
    this.opt.locale = isEn ? 'en-US' : g.locale;
    if (this.panel) {
      this.panel.dir = isEn ? 'ltr' : 'rtl';
      this.panel.classList.toggle('hdp-ltr', isEn);
      this.renderPanel();
    }
  }

  /** Switch the color theme at runtime ('light' | 'dark' | 'auto'). */
  setTheme(theme: Theme): void {
    if (theme === this.opt.theme) return;
    this.opt.theme = theme;
    if (this.panel) {
      this.panel.classList.toggle('hdp-dark', theme === 'dark');
      this.panel.classList.toggle('hdp-theme-auto', theme === 'auto');
    }
  }

  getValue(): PickerResult {
    return this.result();
  }

  /**
   * Programmatically set the picker's value while it stays open, WITHOUT
   * reopening or stealing focus (so it can mirror an external input the user is
   * typing into). Accepts an ISO date/datetime, a {start,end} range, or null to
   * clear. Does not emit `onSelect`.
   */
  setValue(value: ISODate | { start: ISODate; end: ISODate } | null): void {
    const datePart = (iso: string): ISODate => (iso && iso.includes('T') ? iso.split('T')[0] : iso || '');
    if (value && typeof value === 'object') {
      this.startISO = datePart(value.start || '');
      this.endISO = datePart(value.end || '');
    } else {
      this.startISO = datePart((value as ISODate) || '');
      this.endISO = '';
    }
    if (this.opt.mode === 'range') {
      this.views[0]?.setValue(this.startISO || null);
      this.views[this.views.length - 1]?.setValue(this.endISO || null);
      this.refreshRange();
    } else {
      this.views[0]?.setValue(this.startISO || null);
    }
  }

  // ===== Build =====
  private buildPanel(): void {
    this.panel = document.createElement('div');
    const ltr = this.lang === 'en';
    this.panel.className =
      'hdp' +
      (this.opt.inline ? ' hdp-inline' : ' hdp-popup') +
      ' hdp-size-' + this.opt.size +
      (this.opt.compact ? ' hdp-compact' : '') +
      (this.opt.rounded ? ' hdp-rounded' : '') +
      (this.opt.headerBorder ? '' : ' hdp-head-plain') +
      (this.opt.theme === 'dark' ? ' hdp-dark' : '') +
      (this.opt.theme === 'auto' ? ' hdp-theme-auto' : '') +
      (ltr ? ' hdp-ltr' : '');
    this.panel.dir = ltr ? 'ltr' : 'rtl';
    if (this.opt.primaryColor) {
      this.panel.style.setProperty('--hdp-primary', this.opt.primaryColor);
      this.panel.style.setProperty(
        '--hdp-primary-soft',
        `color-mix(in srgb, ${this.opt.primaryColor} 14%, transparent)`
      );
      // Pick black/white for text drawn ON the accent, by its YIQ luminance, so a
      // light custom primaryColor keeps the selected-day text readable.
      this.panel.style.setProperty('--hdp-on-primary', onPrimaryColor(this.opt.primaryColor));
    }
    this.renderPanel();
  }

  private renderPanel(): void {
    this.panel.innerHTML = '';
    this.views.forEach((v) => v.destroy());
    this.views = [];

    // Tabs (skip when monthOnly still shows tabs; tabs switch calendar system)
    const tabs = document.createElement('div');
    tabs.className = 'hdp-tabs';
    const order: CalendarType[] =
      this.opt.calendar === 'hebrew' ? ['hebrew', 'gregorian'] : ['gregorian', 'hebrew'];
    order.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hdp-tab' + (this.type === t ? ' is-active' : '');
      b.textContent = t === 'gregorian' ? this.opt.labels.gregorianTab : this.opt.labels.hebrewTab;
      b.onclick = (e) => {
        e.stopPropagation();
        this.type = t;
        this.renderPanel();
      };
      tabs.appendChild(b);
    });
    this.panel.appendChild(tabs);

    const body = document.createElement('div');
    body.className = 'hdp-body' + (this.opt.mode === 'range' ? ' hdp-range' : '');
    this.panel.appendChild(body);

    if (this.opt.mode === 'range') {
      body.appendChild(this.buildRangeColumn('start'));
      body.appendChild(this.buildRangeColumn('end'));
    } else {
      const col = document.createElement('div');
      col.className = 'hdp-col';
      // The calendar renders into its OWN element (it clears that element on
      // every re-render). The time control is a sibling in the column, so a
      // day click no longer wipes it out.
      const grid = document.createElement('div');
      col.appendChild(grid);
      this.views.push(this.makeView(grid, this.startISO, (iso) => {
        this.startISO = iso;
        if (!this.opt.time && this.opt.closeOnSelect) this.commitClose();
        else this.emit();
      }, {
        // Double-clicking a day always picks it and closes — even when
        // closeOnSelect is false or a time picker is shown.
        onDblPick: (iso) => this.onSingleDbl(iso)
      }));
      if (this.opt.time) {
        col.appendChild(
          this.buildTimeControl(() => this.startTime, (t) => { this.startTime = t; this.emit(); })
        );
      }
      body.appendChild(col);
    }

    this.panel.appendChild(this.buildActions());
  }

  private buildRangeColumn(which: 'start' | 'end'): HTMLElement {
    const col = document.createElement('div');
    col.className = 'hdp-col';
    // Remember which column the user last touched, so the "Today" action knows
    // whether it should land in the start or the end calendar.
    const track = () => { this.lastFocusedCol = which; };
    col.addEventListener('mousedown', track, true);
    col.addEventListener('focusin', track);
    const label = document.createElement('div');
    label.className = 'hdp-col-label';
    label.textContent = which === 'start' ? this.opt.labels.rangeStart : this.opt.labels.rangeEnd;
    col.appendChild(label);
    const grid = document.createElement('div');
    col.appendChild(grid);
    const initial =
      which === 'start'
        ? this.startISO || null
        : this.endISO || this.nextMonthISO(this.startISO);
    const [lo, hi] = this.rangeForDisplay();
    this.views.push(
      this.makeView(grid, initial || '', (iso) => this.onRangeClick(iso, which), {
        rangeStart: lo,
        rangeEnd: hi,
        onDblPick: (iso) => this.onRangeDbl(iso),
        markSelected: false,
        // Mirror the hover preview across BOTH calendars (not just the one the
        // pointer is over): hovering a day in either grid highlights the whole
        // prospective range in both.
        onHover: (iso) => this.previewAll(iso),
        onHoverEnd: () => this.scheduleClearPreview()
      })
    );
    if (this.opt.time) {
      const getT = which === 'start' ? () => this.startTime : () => this.endTime;
      const setT = which === 'start'
        ? (t: string) => { this.startTime = t; this.emit(); }
        : (t: string) => { this.endTime = t; this.emit(); };
      col.appendChild(this.buildTimeControl(getT, setT));
    }
    return col;
  }

  // Range selection has two phases:
  //  1) BEFORE a full range exists — a click *sequence*: the first click sets
  //     the start, the second sets the end. This works within a single calendar
  //     (click day A then day B in the same grid) or across both.
  //  2) AFTER a full range exists — *column-aware* adjustment: a click in the
  //     start calendar moves the START (keeping the end), a click in the end
  //     calendar moves the END (keeping the start). So clicking inside an
  //     existing range shrinks it from that side instead of wiping it.
  // Endpoints are normalised so start ≤ end.
  private onRangeClick(iso: ISODate, which: 'start' | 'end'): void {
    const complete = !!this.startISO && !!this.endISO;
    if (!complete) {
      if (!this.startISO) this.startISO = iso;
      else this.endISO = iso;
    } else if (which === 'start') {
      this.startISO = iso;
    } else {
      this.endISO = iso;
    }
    if (this.startISO && this.endISO && compareISO(this.startISO, this.endISO) > 0) {
      const t = this.startISO; this.startISO = this.endISO; this.endISO = t;
    }
    this.refreshRange();
    this.emit();
    if (this.startISO && this.endISO && !this.opt.time && this.opt.closeOnSelect) {
      this.commitClose();
    }
  }

  private onRangeDbl(iso: ISODate): void {
    this.startISO = iso;
    this.endISO = iso;
    this.refreshRange();
    // Double-click always commits + closes, regardless of closeOnSelect / time.
    this.emit();
    if (!this.opt.inline) this.close();
  }

  // Single mode: double-clicking a day picks it and closes the popup, even when
  // closeOnSelect is false or a time picker is shown.
  private onSingleDbl(iso: ISODate): void {
    this.startISO = iso;
    this.emit();
    if (!this.opt.inline) this.close();
  }

  // For highlighting: when only one endpoint is chosen, that endpoint is the
  // range start and the end is null (so the views know we're mid-pick and can
  // show the hover preview). When both are set, return them sorted.
  private rangeForDisplay(): [ISODate | null, ISODate | null] {
    if (this.startISO && this.endISO) {
      const [a, b] = this.sortedRange();
      return [a, b];
    }
    return [this.startISO || this.endISO || null, null];
  }

  private refreshRange(): void {
    const [lo, hi] = this.rangeForDisplay();
    this.views.forEach((v) => v.setRange(lo, hi));
    this.updateRangeHint();
  }

  // Show the prospective range (start → hovered) on BOTH calendars while the
  // pointer is over either grid (mid-pick: a start is chosen, no end yet).
  private previewAll(iso: ISODate): void {
    if (this.previewClearTimer !== null) {
      clearTimeout(this.previewClearTimer);
      this.previewClearTimer = null;
    }
    // Preview only while exactly one endpoint is chosen; anchor from it.
    const bothSet = !!this.startISO && !!this.endISO;
    const anchor = this.startISO || this.endISO;
    if (anchor && !bothSet) {
      this.views.forEach((v) => v.previewFrom(anchor, iso));
    }
  }
  // Defer the clear so moving the pointer from one calendar to the other (which
  // fires mouseleave then mouseenter) doesn't flash the highlight off.
  private scheduleClearPreview(): void {
    if (this.previewClearTimer !== null) clearTimeout(this.previewClearTimer);
    this.previewClearTimer = setTimeout(() => {
      this.views.forEach((v) => v.clearPreviewPublic());
      this.previewClearTimer = null;
    }, 60);
  }

  private makeView(
    host: HTMLElement,
    value: ISODate,
    onPick: (iso: ISODate) => void,
    rangeOpts?: {
      rangeStart?: ISODate | null;
      rangeEnd?: ISODate | null;
      onDblPick?: (iso: ISODate) => void;
      markSelected?: boolean;
      onHover?: (iso: ISODate) => void;
      onHoverEnd?: () => void;
    }
  ): CalendarView {
    return new CalendarView(host, {
      type: this.type,
      precision: this.opt.precision,
      labels: this.opt.labels,
      locale: this.opt.locale,
      highlightShabbat: this.opt.highlightShabbat,
      highlightHolidays: this.opt.highlightHolidays,
      showParasha: this.opt.showParasha,
      showTooltips: this.opt.showTooltips,
      outsideDays: this.opt.outsideDays,
      diaspora: this.opt.diaspora,
      min: this.opt.min,
      max: this.opt.max,
      value: value || null,
      onPick,
      ...rangeOpts
    });
  }

  private timeStyleNorm(): 'native' | 'dropdown' | 'stepper' | 'clock' {
    switch (this.opt.timeStyle) {
      case 'native': return 'native';
      case 'stepper': return 'stepper';
      case 'clock':
      case 'mobile': return 'clock';
      default: return 'dropdown';
    }
  }

  // Time picker control (per column). Styles: native | dropdown | stepper | clock.
  private buildTimeControl(get: () => string, set: (t: string) => void): HTMLElement {
    const is12 = this.opt.timeFormat === '12';
    const withSec = this.opt.seconds;
    const style = this.timeStyleNorm();
    if (style === 'clock') return buildClockTime({ is12, seconds: withSec, get, set });
    if (style === 'native') return buildNativeTime(get, set, withSec);

    const wrap = ce('div', 'hdp-time hdp-time-' + style);
    const parse = (): [number, number, number] => {
      const p = (get() || '').split(':').map((n) => parseInt(n, 10));
      return [isNaN(p[0]) ? 0 : p[0], isNaN(p[1]) ? 0 : p[1], isNaN(p[2]) ? 0 : p[2]];
    };
    const p2 = (n: number) => String(n).padStart(2, '0');
    const store = (h: number, m: number, s: number) => {
      const H = ((h % 24) + 24) % 24;
      const M = ((m % 60) + 60) % 60;
      const S = ((s % 60) + 60) % 60;
      set(withSec ? `${p2(H)}:${p2(M)}:${p2(S)}` : `${p2(H)}:${p2(M)}`);
      render();
    };
    const colonNode = () => {
      const c = ce('span', 'hdp-time-colon');
      c.textContent = ':';
      return c;
    };
    const render = () => {
      wrap.innerHTML = '';
      const [hh, mm, ss] = parse();
      const dispHour = is12 ? ((hh + 11) % 12) + 1 : hh;
      const ampm = hh < 12 ? 'AM' : 'PM';

      if (style === 'stepper') {
        wrap.appendChild(stepper(
          dispHour,
          (delta) => store(hh + delta, mm, ss),
          (v) => store(is12 ? to24(v, ampm) : v, mm, ss),
          is12 ? 1 : 0,
          is12 ? 12 : 23
        ));
        wrap.appendChild(colonNode());
        wrap.appendChild(stepper(mm, (delta) => store(hh, mm + delta, ss), (v) => store(hh, v, ss), 0, 59));
        if (withSec) {
          wrap.appendChild(colonNode());
          wrap.appendChild(stepper(ss, (delta) => store(hh, mm, ss + delta), (v) => store(hh, mm, v), 0, 59));
        }
        if (is12) {
          const t = ce('button', 'hdp-time-ampm') as HTMLButtonElement;
          t.type = 'button';
          t.textContent = ampm;
          t.onclick = (e) => { e.stopPropagation(); store((hh + 12) % 24, mm, ss); };
          wrap.appendChild(t);
        }
      } else {
        // dropdown selects
        const hourSel = sel(
          range(is12 ? 1 : 0, is12 ? 12 : 23).map((v) => [String(v).padStart(2, '0'), v]),
          dispHour,
          (v) => store(is12 ? to24(Number(v), ampm) : Number(v), mm, ss)
        );
        const minSel = sel(
          range(0, 59).map((v) => [String(v).padStart(2, '0'), v]),
          mm,
          (v) => store(hh, Number(v), ss)
        );
        wrap.appendChild(hourSel);
        wrap.appendChild(colonNode());
        wrap.appendChild(minSel);
        if (withSec) {
          wrap.appendChild(colonNode());
          wrap.appendChild(sel(
            range(0, 59).map((v) => [String(v).padStart(2, '0'), v]),
            ss,
            (v) => store(hh, mm, Number(v))
          ));
        }
        if (is12) {
          wrap.appendChild(sel([['AM', 'AM'], ['PM', 'PM']] as [string, string][], ampm, (v) => {
            store(to24(dispHour, String(v)), mm, ss);
          }));
        }
      }
    };
    render();
    return wrap;
  }

  private buildActions(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'hdp-actions';
    const L = this.opt.labels;

    const clear = btn('hdp-btn hdp-btn-ghost', L.clear, () => {
      this.startISO = '';
      this.endISO = '';
      // wipe the range highlight from both calendars (stays open in inline mode)
      this.refreshRange();
      if (this.opt.onSelect) this.opt.onSelect(this.result());
      if (!this.opt.inline) this.close();
    });

    const today = btn('hdp-btn hdp-btn-ghost', L.today, () => {
      const iso = toISO(new Date());
      if (this.opt.mode === 'range') {
        // Behave like clicking "today" as the next natural pick in the range
        // sequence: with nothing chosen yet it lands in the start (leading)
        // calendar; once a start exists (mid-pick) it lands in the end calendar
        // and completes the range. On an already-complete range, adjust whichever
        // column the user last touched.
        const complete = !!this.startISO && !!this.endISO;
        const which: 'start' | 'end' = !complete
          ? (this.startISO ? 'end' : 'start')
          : this.lastFocusedCol;
        const viewIdx = which === 'start' ? 0 : this.views.length - 1;
        this.views[viewIdx]?.setValue(iso); // navigate that grid to today first
        this.onRangeClick(iso, which);
      } else {
        this.startISO = iso;
        this.views[0]?.setValue(iso);
        this.emit();
      }
    });

    const ok = btn('hdp-btn hdp-btn-primary', L.confirm, () => this.commitClose());
    if (this.opt.showTooltips) ok.title = `${L.confirm} (Enter)`;

    actions.appendChild(clear);
    actions.appendChild(today);
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    actions.appendChild(spacer);
    if (this.opt.mode === 'range') {
      const hint = document.createElement('div');
      hint.className = 'hdp-range-hint';
      actions.appendChild(hint);
    }
    actions.appendChild(ok);
    return actions;
  }

  private updateRangeHint(): void {
    const hint = this.panel.querySelector('.hdp-range-hint');
    if (!hint) return;
    if (this.startISO && this.endISO) {
      const [a, b] = this.sortedRange();
      hint.textContent = `${a} ← ${b}`;
    } else {
      hint.textContent = '';
    }
  }

  private sortedRange(): [ISODate, ISODate] {
    if (compareISO(this.startISO, this.endISO) <= 0) return [this.startISO, this.endISO];
    return [this.endISO, this.startISO];
  }

  private combine(date: ISODate, time: string): ISODate {
    if (!date) return '';
    return this.opt.time ? `${date}T${time}` : date;
  }

  private result(): PickerResult {
    if (this.opt.mode === 'range') {
      let aDT = this.combine(this.startISO, this.startTime);
      let bDT = this.combine(this.endISO, this.endTime);
      if (aDT && bDT && compareISO(aDT, bDT) > 0) {
        const t = aDT; aDT = bDT; bDT = t;
      }
      return { start: aDT, end: bDT, type: this.type };
    }
    return { iso: this.combine(this.startISO, this.startTime), type: this.type };
  }

  private emit(): void {
    if (this.opt.onSelect) this.opt.onSelect(this.result());
  }

  private commitClose(): void {
    this.emit();
    if (!this.opt.inline) this.close();
  }

  private nextMonthISO(base: ISODate): ISODate {
    const d = base ? new Date(base) : new Date();
    const day = d.getDate();
    const nd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const lastD = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
    nd.setDate(Math.min(day, lastD));
    return toISO(nd);
  }

  // ===== Popup positioning =====
  private position(anchor: HTMLElement): void {
    const r = anchor.getBoundingClientRect();
    const pw = this.panel.offsetWidth;
    const ph = this.panel.offsetHeight;
    let top = r.bottom + 6;
    let left = r.left;
    if (r.bottom + ph > window.innerHeight - 10) top = Math.max(8, r.top - ph - 6);
    const maxTop = Math.max(8, window.innerHeight - ph - 8);
    top = Math.max(8, Math.min(top, maxTop));
    if (left + pw > window.innerWidth - 10) left = Math.max(8, window.innerWidth - pw - 10);
    if (left < 8) left = 8;
    this.panel.style.position = 'fixed';
    this.panel.style.top = top + 'px';
    this.panel.style.left = left + 'px';
  }

  /** Suppress unused-warning for stored original value (kept for re-init). */
  protected _origin(): PickerOptions['value'] {
    return this.originalValue;
  }
}

function ce(tag: string, cls?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}
function to24(displayHour: number, ampm: string): number {
  const base = displayHour % 12;
  return ampm === 'PM' ? base + 12 : base;
}
function sel(
  options: [string, number | string][],
  value: number | string,
  onChange: (v: number | string) => void
): HTMLSelectElement {
  const s = document.createElement('select');
  s.className = 'hdp-time-sel';
  options.forEach(([label, val]) => {
    const o = document.createElement('option');
    o.value = String(val);
    o.textContent = label;
    if (val === value) o.selected = true;
    s.appendChild(o);
  });
  s.onchange = (e) => {
    e.stopPropagation();
    const raw = (e.target as HTMLSelectElement).value;
    const num = Number(raw);
    onChange(isNaN(num) || raw === 'AM' || raw === 'PM' ? raw : num);
  };
  s.onclick = (e) => e.stopPropagation();
  return s;
}
function stepper(
  value: number,
  step: (delta: number) => void,
  setVal: (v: number) => void,
  min: number,
  max: number
): HTMLElement {
  const col = ce('div', 'hdp-time-spin');
  const up = ce('button', 'hdp-time-step') as HTMLButtonElement;
  up.type = 'button';
  up.textContent = '\u25B2';
  up.onclick = (e) => { e.stopPropagation(); step(1); };
  const val = ce('input', 'hdp-time-val') as HTMLInputElement;
  val.type = 'text';
  val.inputMode = 'numeric';
  val.value = String(value).padStart(2, '0');
  val.onclick = (e) => e.stopPropagation();
  val.onchange = (e) => {
    e.stopPropagation();
    let n = parseInt((e.target as HTMLInputElement).value, 10);
    if (isNaN(n)) n = min;
    n = Math.max(min, Math.min(max, n));
    setVal(n);
  };
  const down = ce('button', 'hdp-time-step') as HTMLButtonElement;
  down.type = 'button';
  down.textContent = '\u25BC';
  down.onclick = (e) => { e.stopPropagation(); step(-1); };
  col.appendChild(up);
  col.appendChild(val);
  col.appendChild(down);
  return col;
}

function buildNativeTime(get: () => string, set: (t: string) => void, withSec = false): HTMLElement {
  const wrap = ce('div', 'hdp-time hdp-time-native');
  const inp = ce('input', 'hdp-time-input') as HTMLInputElement;
  inp.type = 'time';
  inp.step = withSec ? '1' : '60'; // step=1 makes the OS control expose seconds
  const [h, m, s] = (get() || '00:00').split(':');
  const p = (x: string | undefined) => (x || '00').padStart(2, '0');
  inp.value = withSec ? `${p(h)}:${p(m)}:${p(s)}` : `${p(h)}:${p(m)}`;
  inp.onclick = (e) => e.stopPropagation();
  inp.onchange = (e) => { e.stopPropagation(); if (inp.value) set(inp.value); };
  wrap.appendChild(inp);
  return wrap;
}

function btn(cls: string, text: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = text;
  b.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };
  return b;
}
