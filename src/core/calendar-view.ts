// calendar-view.ts - Renders a single Hebrew or Gregorian calendar grid into a
// host element and emits a pick. Used by DatePicker for both single and range.
import {
  gregToHebParts,
  hebToGreg,
  getMonthsForYear,
  hebDayGematria,
  hebYearGematria,
  hebYearGematriaFull,
  hebFullString
} from './hebrew';
import { getDayEvents } from './jewish-events';
import { toISO, parseISO, gregMonthNames, compareISO } from './dates';
import type {
  CalendarType,
  Precision,
  PickerLabels,
  ISODate,
  JewishEvent
} from './types';

export interface CalendarViewOptions {
  type: CalendarType;
  precision: Precision;
  labels: PickerLabels;
  locale: string;
  highlightShabbat: boolean;
  highlightHolidays: boolean;
  showParasha: boolean;
  showTooltips: boolean;
  diaspora: boolean;
  min: ISODate | null;
  max: ISODate | null;
  /** Initial date (ISO). */
  value: ISODate | null;
  /** Show the leading/trailing days of the previous/next month (greyed, still
   * selectable). When off, those cells are blank and the grid uses only the
   * rows it needs (5, or 6 for months that overflow). */
  outsideDays?: boolean;
  /** Commit handler — receives ISO date. */
  onPick: (iso: ISODate) => void;
  /** Live-change handler (selection moved but not committed), receives ISO. */
  onChange?: (iso: ISODate) => void;
  /** Range endpoints to highlight across the grid (range mode). */
  rangeStart?: ISODate | null;
  rangeEnd?: ISODate | null;
  /** Double-click a day (range mode): collapse the range to that single day. */
  onDblPick?: (iso: ISODate) => void;
  /** Whether to mark the value's day as selected (false in range columns). */
  markSelected?: boolean;
  /** Range mode: hovering a day mid-pick (used by the picker to preview the
   * prospective range across BOTH calendars). Receives the hovered ISO. */
  onHover?: (iso: ISODate) => void;
  /** Range mode: the pointer left this calendar (picker clears/refreshes preview). */
  onHoverEnd?: () => void;
}

type GridView = null | 'months' | 'years';

/** How many years a year-grid block shows (fixed window). */
const YEAR_BLOCK = 20;

const EVENT_TYPE_CLASS: Record<string, string> = {
  yomtov: 'hdp-evt-yomtov',
  cholhamoed: 'hdp-evt-cholhamoed',
  fast: 'hdp-evt-fast',
  minor: 'hdp-evt-minor',
  chanukah: 'hdp-evt-chanukah',
  roshchodesh: 'hdp-evt-roshchodesh',
  shabbat: 'hdp-evt-shabbat'
};

export class CalendarView {
  private root: HTMLElement;
  private opt: CalendarViewOptions;
  private greg: Date;
  private heb: { year: number; month: string; day: number };
  private gridView: GridView = null;
  /** Start year of the visible 20-year block (years view). null = derive from selection. */
  private yearBlockStart: number | null = null;
  /** Last day-cell click, for manual double-click detection. */
  private lastClick: { iso: ISODate; t: number } | null = null;

  constructor(root: HTMLElement, opt: CalendarViewOptions) {
    this.root = root;
    this.opt = opt;
    const init = opt.value ? parseISO(opt.value) : null;
    this.greg = init || new Date();
    this.heb = { ...gregToHebParts(this.greg) };
    if (opt.precision === 'month') this.gridView = 'months';
    else if (opt.precision === 'year') this.gridView = 'years';
    this.root.classList.add('hdp-cal');
    this.root.classList.add(opt.type === 'hebrew' ? 'hdp-cal-hebrew' : 'hdp-cal-greg');
    this.root.tabIndex = 0;
    this.root.addEventListener('keydown', this.onKey);
    this.root.addEventListener('mouseleave', () => {
      if (this.opt.rangeStart && !this.opt.rangeEnd) {
        if (this.opt.onHoverEnd) this.opt.onHoverEnd();
        else this.clearPreview();
      }
    });
    this.render();
  }

  destroy(): void {
    this.root.removeEventListener('keydown', this.onKey);
    this.root.innerHTML = '';
    hideTip();
  }

  getISO(): ISODate {
    if (this.opt.type === 'gregorian') {
      if (this.opt.precision === 'year') return toISO(new Date(this.greg.getFullYear(), 0, 1));
      return this.opt.precision === 'month'
        ? toISO(new Date(this.greg.getFullYear(), this.greg.getMonth(), 1))
        : toISO(this.greg);
    }
    if (this.opt.precision === 'year') {
      // First day of the Hebrew year (1 Tishrei).
      const firstMonth = getMonthsForYear(this.heb.year)[0].num;
      const dy = hebToGreg(this.heb.year, firstMonth, 1);
      return dy ? toISO(dy) : '';
    }
    const d =
      this.opt.precision === 'month'
        ? hebToGreg(this.heb.year, this.heb.month, 1)
        : hebToGreg(this.heb.year, this.heb.month, this.heb.day);
    return d ? toISO(d) : '';
  }

  setValue(iso: ISODate | null): void {
    const d = iso ? parseISO(iso) : null;
    if (d) {
      this.greg = d;
      this.heb = { ...gregToHebParts(d) };
      this.render();
    }
  }

  focus(): void {
    this.root.focus();
  }

  /** Update the highlighted range without changing the visible month. */
  setRange(start: ISODate | null, end: ISODate | null): void {
    this.opt.rangeStart = start;
    this.opt.rangeEnd = end;
    this.render();
  }

  /** Public: highlight the prospective range [a, b] on this calendar's cells
   * (used by the picker to mirror the hover preview across both calendars). */
  previewFrom(aIso: ISODate, bIso: ISODate): void {
    this.applyPreview(aIso, bIso);
  }

  /** Public: clear any hover preview, restoring the committed range highlight. */
  clearPreviewPublic(): void {
    this.clearPreview();
  }

  private applyRange(cell: HTMLElement, iso: ISODate): void {
    const a = this.opt.rangeStart || '';
    const b = this.opt.rangeEnd || '';
    if (a && b) {
      const lo = compareISO(a, b) <= 0 ? a : b;
      const hi = lo === a ? b : a;
      if (iso === lo) cell.classList.add('is-range-start');
      if (iso === hi) cell.classList.add('is-range-end');
      if (iso === lo && iso === hi) cell.classList.add('is-range-single');
      if (compareISO(iso, lo) > 0 && compareISO(iso, hi) < 0) {
        cell.classList.add('is-in-range');
      }
    } else if (a && iso === a) {
      cell.classList.add('is-range-start');
    }
  }

  private applyPreview(aIso: ISODate, bIso: ISODate): void {
    const lo = compareISO(aIso, bIso) <= 0 ? aIso : bIso;
    const hi = lo === aIso ? bIso : aIso;
    this.root.querySelectorAll('.hdp-cell').forEach((cell) => {
      const ds = (cell as HTMLElement).dataset.iso;
      if (!ds) return;
      cell.classList.remove('is-in-range', 'is-range-end', 'is-range-start', 'is-range-single');
      if (ds === lo) cell.classList.add('is-range-start');
      if (ds === hi && hi !== lo) cell.classList.add('is-range-end');
      if (compareISO(ds, lo) > 0 && compareISO(ds, hi) < 0) cell.classList.add('is-in-range');
    });
  }

  private clearPreview(): void {
    this.root.querySelectorAll('.hdp-cell').forEach((cell) => {
      const ds = (cell as HTMLElement).dataset.iso;
      if (!ds) return;
      cell.classList.remove('is-in-range', 'is-range-end', 'is-range-start', 'is-range-single');
      this.applyRange(cell as HTMLElement, ds);
    });
  }

  private wireDay(cell: HTMLButtonElement, iso: ISODate): void {
    cell.dataset.iso = iso;
    this.applyRange(cell, iso);
    // Range hover preview: once a start is picked (and no end yet), hovering a
    // day shows the prospective range before the user clicks.
    cell.addEventListener('mouseenter', () => {
      if (this.opt.onDblPick && this.opt.rangeStart && !this.opt.rangeEnd) {
        // Let the picker coordinate the preview across BOTH calendars; fall back
        // to a local-only preview when used standalone.
        if (this.opt.onHover) this.opt.onHover(iso);
        else this.applyPreview(this.opt.rangeStart, iso);
      }
    });
    cell.addEventListener('mousedown', (e) => {
      // Keep focus on the calendar root (not the cell button) so the keyboard
      // handler keeps receiving keys after a mouse selection.
      e.preventDefault();
      this.root.focus();
    });
    // Double-click is detected manually (by date + timing) rather than via the
    // native `dblclick`, because a single click re-renders the grid and replaces
    // this element — which would stop the native dblclick from ever firing.
  }

  /** Run a day's single-click action, detecting a double-click (same day within
   * ~350ms) and dispatching onDblPick instead — robust across grid rebuilds. */
  private activate(iso: ISODate, single: () => void): void {
    const now = Date.now();
    if (this.lastClick && this.lastClick.iso === iso && now - this.lastClick.t < 350) {
      this.lastClick = null;
      if (this.opt.onDblPick && !this.isDisabled(iso)) {
        this.opt.onDblPick(iso);
        return;
      }
    }
    this.lastClick = { iso, t: now };
    single();
  }

  private commit(): void {
    this.opt.onPick(this.getISO());
  }
  private changed(): void {
    if (this.opt.onChange) this.opt.onChange(this.getISO());
  }

  private isDisabled(iso: ISODate): boolean {
    if (this.opt.min && compareISO(iso, this.opt.min) < 0) return true;
    if (this.opt.max && compareISO(iso, this.opt.max) > 0) return true;
    return false;
  }

  // ===== Rendering =====
  private render(): void {
    // Preserve keyboard focus across grid rebuilds: if focus is currently on
    // the calendar root (or any cell inside it — e.g. right after a mouse
    // click), restore it to the root so arrow-key navigation keeps working.
    const keepFocus =
      typeof document !== 'undefined' &&
      (document.activeElement === this.root ||
        this.root.contains(document.activeElement));
    // A rebuild destroys the cell the tooltip was anchored to — hide it so it
    // doesn't linger over a now-stale position (e.g. after keyboard nav).
    hideTip();
    this.root.innerHTML = '';
    if (this.opt.type === 'gregorian') this.renderGreg();
    else this.renderHeb();
    if (keepFocus) this.root.focus();
  }

  private makeHeader(
    titleNodes: HTMLElement[],
    onPrev: () => void,
    onNext: () => void,
    prevTip: string,
    nextTip: string,
    yearNav?: { onPrev: () => void; onNext: () => void; prevTip: string; nextTip: string }
  ): void {
    const head = el('div', 'hdp-head');
    const navBtn = (cls: string, html: string, tip: string, fn: () => void): HTMLButtonElement => {
      const b = el('button', cls) as HTMLButtonElement;
      b.type = 'button';
      b.innerHTML = html;
      if (this.opt.showTooltips) b.title = tip;
      b.onclick = (e) => { e.stopPropagation(); fn(); };
      return b;
    };
    // Outer year-jump (« ») then inner month nav (‹ ›); the title sits between.
    if (yearNav) head.appendChild(navBtn('hdp-nav hdp-nav-year', '&#171;', yearNav.prevTip, yearNav.onPrev));
    head.appendChild(navBtn('hdp-nav', '&#8249;', prevTip, onPrev));
    const title = el('div', 'hdp-title');
    titleNodes.forEach((n) => title.appendChild(n));
    head.appendChild(title);
    head.appendChild(navBtn('hdp-nav', '&#8250;', nextTip, onNext));
    if (yearNav) head.appendChild(navBtn('hdp-nav hdp-nav-year', '&#187;', yearNav.nextTip, yearNav.onNext));
    this.root.appendChild(head);
  }

  private weekdayRow(): void {
    const wk = el('div', 'hdp-weekdays');
    this.opt.labels.weekdays.forEach((w) => {
      const c = el('div', 'hdp-wd');
      c.textContent = w;
      wk.appendChild(c);
    });
    this.root.appendChild(wk);
  }

  private decorateDayCell(cell: HTMLButtonElement, date: Date): void {
    if (date.getDay() === 6 && this.opt.highlightShabbat) {
      cell.classList.add('hdp-shabbat');
    }
    if (this.opt.highlightHolidays || this.opt.showParasha) {
      const events = getDayEvents(date, { diaspora: this.opt.diaspora });
      const display: JewishEvent[] = [];
      for (const ev of events) {
        if (ev.type === 'shabbat') {
          if (this.opt.showParasha) display.push(ev);
        } else if (this.opt.highlightHolidays) {
          display.push(ev);
          cell.classList.add('hdp-holiday');
          const typeClass = EVENT_TYPE_CLASS[ev.type];
          if (typeClass) cell.classList.add(typeClass);
        }
      }
      if (display.length) {
        attachTip(cell, display);
      }
      // small dot marker if any holiday/rosh chodesh present
      if (this.opt.highlightHolidays && events.some((e) => e.type !== 'shabbat')) {
        const dot = el('span', 'hdp-dot');
        cell.appendChild(dot);
      }
    }
  }

  // ----- Gregorian -----
  private renderGreg(): void {
    const cur = this.greg;
    const curY = cur.getFullYear();
    const curM = cur.getMonth();
    const curD = cur.getDate();
    const monthNames = gregMonthNames();
    const L = this.opt.labels;

    const mBtn = pill(monthNames[curM], L.pickMonth, () => {
      this.gridView = 'months';
      this.render();
    });
    const yBtn = pill(String(curY), L.pickYear, () => {
      this.gridView = 'years';
      this.yearBlockStart = null;
      this.render();
    });

    if (this.gridView === 'months') {
      this.makeHeader(
        [pill(String(curY), L.pickYear, () => { this.gridView = 'years'; this.yearBlockStart = null; this.render(); })],
        () => this.shiftGregYear(-1),
        () => this.shiftGregYear(1),
        `${L.prevYear} (PgUp)`,
        `${L.nextYear} (PgDn)`
      );
      this.renderGregMonthsGrid(curY, curM, curD);
      return;
    }
    if (this.gridView === 'years') {
      const start = this.gregBlockStart(curY);
      this.makeHeader(
        [yearRangeLabel(start)],
        () => this.pageGregYearBlock(-1),
        () => this.pageGregYearBlock(1),
        'PgUp',
        'PgDn'
      );
      this.renderGregYearsGrid(start, curY, curM, curD);
      return;
    }

    this.makeHeader(
      [mBtn, yBtn],
      () => this.shiftGregMonth(-1),
      () => this.shiftGregMonth(1),
      `${L.prevMonth} (PgUp)`,
      `${L.nextMonth} (PgDn)`,
      {
        onPrev: () => this.shiftGregYear(-1),
        onNext: () => this.shiftGregYear(1),
        prevTip: `${L.jumpPrevYear} (Shift+PgUp)`,
        nextTip: `${L.jumpNextYear} (Shift+PgDn)`
      }
    );

    // Hebrew span subtitle
    const sub = el('div', 'hdp-sub');
    sub.textContent = this.gregHebSubtitle(curY, curM);
    this.root.appendChild(sub);

    this.weekdayRow();

    const grid = el('div', 'hdp-grid');
    const firstWd = new Date(curY, curM, 1).getDay();
    const lastDay = new Date(curY, curM + 1, 0).getDate();
    const rows = Math.ceil((firstWd + lastDay) / 7);
    const total = rows * 7;
    const today = new Date();
    for (let i = 0; i < total; i++) {
      const dayNum = i - firstWd + 1; // <=0 prev month, 1..lastDay this, >lastDay next
      const inMonth = dayNum >= 1 && dayNum <= lastDay;
      if (!inMonth && !this.opt.outsideDays) {
        grid.appendChild(el('div', 'hdp-cell is-blank'));
        continue;
      }
      const date = new Date(curY, curM, dayNum);
      const iso = toISO(date);
      const cell = el('button', 'hdp-cell') as HTMLButtonElement;
      cell.type = 'button';
      if (!inMonth) cell.classList.add('is-outside');
      if (inMonth && this.opt.markSelected !== false && dayNum === curD) cell.classList.add('is-selected');
      if (sameDay(today, date)) cell.classList.add('is-today');
      if (this.isDisabled(iso)) cell.classList.add('is-disabled');
      cell.innerHTML = `<span class="hdp-num">${date.getDate()}</span><span class="hdp-gem-sm">${hebDayGematria(gregToHebParts(date).day)}</span>`;
      this.decorateDayCell(cell, date);
      this.wireDay(cell, iso);
      cell.onclick = (e) => {
        e.stopPropagation();
        if (this.isDisabled(iso)) return;
        this.activate(iso, () => {
          this.greg = date;
          this.heb = { ...gregToHebParts(date) };
          this.render(); // reflect the new selection in the DOM immediately
          this.commit();
        });
      };
      grid.appendChild(cell);
    }
    this.root.appendChild(grid);
    this.preview();
  }

  private renderGregMonthsGrid(curY: number, curM: number, curD: number): void {
    const grid = el('div', 'hdp-mygrid hdp-mygrid-m');
    gregMonthNames().forEach((n, i) => {
      const c = el('button', 'hdp-mycell' + (i === curM ? ' is-selected' : '')) as HTMLButtonElement;
      c.type = 'button';
      c.textContent = n;
      c.onclick = (e) => {
        e.stopPropagation();
        const lastD = new Date(curY, i + 1, 0).getDate();
        this.greg = new Date(curY, i, Math.min(curD, lastD));
        this.heb = { ...gregToHebParts(this.greg) };
        if (this.opt.precision === 'month') {
          this.commit();
        } else {
          this.gridView = null;
          this.render();
        }
      };
      grid.appendChild(c);
    });
    this.root.appendChild(grid);
    this.preview();
  }

  private renderGregYearsGrid(start: number, selY: number, curM: number, curD: number): void {
    const grid = el('div', 'hdp-mygrid hdp-mygrid-y');
    for (let y = start; y <= start + YEAR_BLOCK - 1; y++) {
      const c = el('button', 'hdp-mycell' + (y === selY ? ' is-selected' : '')) as HTMLButtonElement;
      c.type = 'button';
      c.textContent = String(y);
      c.onclick = (e) => {
        e.stopPropagation();
        const lastD = new Date(y, curM + 1, 0).getDate();
        this.greg = new Date(y, curM, Math.min(curD, lastD));
        this.heb = { ...gregToHebParts(this.greg) };
        if (this.opt.precision === 'year') {
          this.render(); // reflect the new selection immediately
          this.commit();
        } else {
          this.gridView = 'months';
          this.yearBlockStart = null;
          this.render();
        }
      };
      grid.appendChild(c);
    }
    this.root.appendChild(grid);
    this.preview();
  }

  private gregHebSubtitle(curY: number, curM: number): string {
    const start = gregToHebParts(new Date(curY, curM, 1));
    const lastDay = new Date(curY, curM + 1, 0).getDate();
    const end = gregToHebParts(new Date(curY, curM, lastDay));
    const sName = getMonthsForYear(start.year).find((m) => m.num === start.month);
    const eName = getMonthsForYear(end.year).find((m) => m.num === end.month);
    if (!sName || !eName) return '';
    // Subtitle shows the full year with the millennium prefix, e.g. ה׳תשפ״ו
    // (the pills/headers keep the short form).
    if (start.year === end.year && start.month === end.month) {
      return `${sName.name} ${hebYearGematriaFull(start.year)}`;
    }
    return `${sName.name} – ${eName.name} ${hebYearGematriaFull(end.year)}`;
  }

  private shiftGregMonth(delta: number): void {
    const nd = new Date(this.greg.getFullYear(), this.greg.getMonth() + delta, 1);
    const lastD = new Date(nd.getFullYear(), nd.getMonth() + 1, 0).getDate();
    this.greg = new Date(nd.getFullYear(), nd.getMonth(), Math.min(this.greg.getDate(), lastD));
    this.heb = { ...gregToHebParts(this.greg) };
    this.render();
  }
  private shiftGregYear(delta: number): void {
    const ny = this.greg.getFullYear() + delta;
    const lastD = new Date(ny, this.greg.getMonth() + 1, 0).getDate();
    this.greg = new Date(ny, this.greg.getMonth(), Math.min(this.greg.getDate(), lastD));
    this.heb = { ...gregToHebParts(this.greg) };
    this.render();
  }
  /** Resolve the 20-year block start for the years grid (aligned to YEAR_BLOCK). */
  private gregBlockStart(selY: number): number {
    if (this.yearBlockStart === null) this.yearBlockStart = Math.floor(selY / YEAR_BLOCK) * YEAR_BLOCK;
    return this.yearBlockStart;
  }
  /** Page the visible 20-year block (and move the selection with it). */
  private pageGregYearBlock(dir: number): void {
    this.yearBlockStart = this.gregBlockStart(this.greg.getFullYear()) + dir * YEAR_BLOCK;
    this.shiftGregYear(dir * YEAR_BLOCK);
  }

  // ----- Hebrew -----
  private renderHeb(): void {
    const L = this.opt.labels;
    const months = getMonthsForYear(this.heb.year);
    const curMonth = months.find((m) => m.num === this.heb.month) || months[0];
    this.heb.month = curMonth.num;

    const mBtn = pill(curMonth.name, L.pickMonth, () => {
      this.gridView = 'months';
      this.render();
    });
    const yBtn = pill(hebYearGematria(this.heb.year), L.pickYear, () => {
      this.gridView = 'years';
      this.yearBlockStart = null;
      this.render();
    });

    if (this.gridView === 'months') {
      this.makeHeader(
        [pill(hebYearGematria(this.heb.year), L.pickYear, () => { this.gridView = 'years'; this.yearBlockStart = null; this.render(); })],
        () => this.shiftHebYear(-1),
        () => this.shiftHebYear(1),
        `${L.prevYear} - ${hebYearGematria(this.heb.year - 1)} (PgUp)`,
        `${L.nextYear} - ${hebYearGematria(this.heb.year + 1)} (PgDn)`
      );
      this.renderHebMonthsGrid();
      return;
    }
    if (this.gridView === 'years') {
      const start = this.hebBlockStart(this.heb.year);
      this.makeHeader(
        [yearRangeLabelHeb(start)],
        () => this.pageHebYearBlock(-1),
        () => this.pageHebYearBlock(1),
        'PgUp',
        'PgDn'
      );
      this.renderHebYearsGrid(start);
      return;
    }

    const prevInfo = this.neighborHebMonth(-1);
    const nextInfo = this.neighborHebMonth(1);
    this.makeHeader(
      [mBtn, yBtn],
      () => this.shiftHebMonth(-1),
      () => this.shiftHebMonth(1),
      `${L.prevMonth} - ${prevInfo.name} (PgUp)`,
      `${L.nextMonth} - ${nextInfo.name} (PgDn)`,
      {
        onPrev: () => this.hebYearJump(-1),
        onNext: () => this.hebYearJump(1),
        prevTip: `${L.jumpPrevYear} - ${hebYearGematria(this.heb.year - 1)} (Shift+PgUp)`,
        nextTip: `${L.jumpNextYear} - ${hebYearGematria(this.heb.year + 1)} (Shift+PgDn)`
      }
    );

    const sub = el('div', 'hdp-sub');
    sub.textContent = this.hebGregSubtitle(curMonth);
    this.root.appendChild(sub);

    this.weekdayRow();

    const grid = el('div', 'hdp-grid');
    const firstGreg = hebToGreg(this.heb.year, this.heb.month, 1);
    const firstWd = firstGreg ? firstGreg.getDay() : 0;
    const base = firstGreg
      ? new Date(firstGreg.getFullYear(), firstGreg.getMonth(), firstGreg.getDate())
      : new Date();
    const rows = Math.ceil((firstWd + curMonth.days) / 7);
    const total = rows * 7;
    const todayHeb = gregToHebParts(new Date());
    for (let i = 0; i < total; i++) {
      const offset = i - firstWd; // day-1 offset from the 1st of the month
      const gr = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
      const parts = gregToHebParts(gr);
      const inMonth = parts.year === this.heb.year && parts.month === this.heb.month;
      if (!inMonth && !this.opt.outsideDays) {
        grid.appendChild(el('div', 'hdp-cell is-blank'));
        continue;
      }
      const iso = toISO(gr);
      const cell = el('button', 'hdp-cell') as HTMLButtonElement;
      cell.type = 'button';
      if (!inMonth) cell.classList.add('is-outside');
      if (inMonth && this.opt.markSelected !== false && parts.day === this.heb.day) {
        cell.classList.add('is-selected');
      }
      if (todayHeb.year === parts.year && todayHeb.month === parts.month && todayHeb.day === parts.day) {
        cell.classList.add('is-today');
      }
      if (this.isDisabled(iso)) cell.classList.add('is-disabled');
      cell.innerHTML = `<span class="hdp-gem">${hebDayGematria(parts.day)}</span><span class="hdp-num">${gr.getDate()}</span>`;
      this.decorateDayCell(cell, gr);
      this.wireDay(cell, iso);
      cell.onclick = (e) => {
        e.stopPropagation();
        if (this.isDisabled(iso)) return;
        this.activate(iso, () => {
          this.heb = { ...parts };
          this.greg = gr;
          this.render(); // reflect the new selection in the DOM immediately
          this.commit();
        });
      };
      grid.appendChild(cell);
    }
    this.root.appendChild(grid);
    this.preview();
  }

  private renderHebMonthsGrid(): void {
    const months = getMonthsForYear(this.heb.year);
    const grid = el('div', 'hdp-mygrid hdp-mygrid-m');
    months.forEach((m) => {
      const c = el('button', 'hdp-mycell' + (m.num === this.heb.month ? ' is-selected' : '')) as HTMLButtonElement;
      c.type = 'button';
      c.textContent = m.name;
      c.onclick = (e) => {
        e.stopPropagation();
        this.heb.month = m.num;
        if (this.heb.day > m.days) this.heb.day = m.days;
        const gr = hebToGreg(this.heb.year, this.heb.month, this.heb.day);
        if (gr) this.greg = gr;
        if (this.opt.precision === 'month') {
          this.commit();
        } else {
          this.gridView = null;
          this.render();
        }
      };
      grid.appendChild(c);
    });
    this.root.appendChild(grid);
    this.preview();
  }

  private renderHebYearsGrid(start: number): void {
    const grid = el('div', 'hdp-mygrid hdp-mygrid-y');
    for (let y = start; y <= start + YEAR_BLOCK - 1; y++) {
      const c = el('button', 'hdp-mycell' + (y === this.heb.year ? ' is-selected' : '')) as HTMLButtonElement;
      c.type = 'button';
      c.textContent = hebYearGematria(y);
      c.onclick = (e) => {
        e.stopPropagation();
        this.heb.year = y;
        const ms = getMonthsForYear(y);
        if (!ms.find((m) => m.num === this.heb.month)) this.heb.month = ms[0].num;
        if (this.opt.precision === 'year') {
          const gr = hebToGreg(this.heb.year, ms[0].num, 1);
          if (gr) this.greg = gr;
          this.render(); // reflect the new selection immediately
          this.commit();
        } else {
          this.gridView = 'months';
          this.yearBlockStart = null;
          this.render();
        }
      };
      grid.appendChild(c);
    }
    this.root.appendChild(grid);
    this.preview();
  }

  private hebBlockStart(selY: number): number {
    if (this.yearBlockStart === null) this.yearBlockStart = Math.floor(selY / YEAR_BLOCK) * YEAR_BLOCK;
    return this.yearBlockStart;
  }
  private pageHebYearBlock(dir: number): void {
    this.yearBlockStart = this.hebBlockStart(this.heb.year) + dir * YEAR_BLOCK;
    this.shiftHebYear(dir * YEAR_BLOCK);
  }

  private neighborHebMonth(delta: number): { year: number; month: string; name: string } {
    let yr = this.heb.year;
    let list = getMonthsForYear(yr);
    let idx = list.findIndex((m) => m.num === this.heb.month);
    if (idx < 0) idx = 0;
    idx += delta;
    if (idx < 0) {
      yr -= 1;
      list = getMonthsForYear(yr);
      idx = list.length - 1;
    } else if (idx >= list.length) {
      yr += 1;
      list = getMonthsForYear(yr);
      idx = 0;
    }
    return { year: yr, month: list[idx].num, name: list[idx].name };
  }

  private hebGregSubtitle(curMonth: { num: string; days: number }): string {
    const gFirst = hebToGreg(this.heb.year, this.heb.month, 1);
    const gLast = hebToGreg(this.heb.year, this.heb.month, curMonth.days);
    if (!gFirst || !gLast) return '';
    const ms = gregMonthNames();
    if (gFirst.getFullYear() === gLast.getFullYear() && gFirst.getMonth() === gLast.getMonth()) {
      return `${ms[gFirst.getMonth()]} ${gFirst.getFullYear()}`;
    }
    return `${ms[gFirst.getMonth()]} – ${ms[gLast.getMonth()]} ${gLast.getFullYear()}`;
  }

  private shiftHebMonth(delta: number): void {
    const n = this.neighborHebMonth(delta);
    this.heb.year = n.year;
    this.heb.month = n.month;
    const cur = getMonthsForYear(n.year).find((m) => m.num === n.month)!;
    if (this.heb.day > cur.days) this.heb.day = cur.days;
    this.render();
  }
  private shiftHebYear(delta: number): void {
    this.heb.year += delta;
    const ms = getMonthsForYear(this.heb.year);
    if (!ms.find((m) => m.num === this.heb.month)) this.heb.month = ms[0].num;
    this.render();
  }
  /** Day-view full-year jump (keeps the selected day, clamped to the month). */
  private hebYearJump(delta: number): void {
    this.heb.year += delta;
    const ms = getMonthsForYear(this.heb.year);
    const cur = ms.find((m) => m.num === this.heb.month) || ms[0];
    this.heb.month = cur.num;
    if (this.heb.day > cur.days) this.heb.day = cur.days;
    const gr = hebToGreg(this.heb.year, this.heb.month, this.heb.day);
    if (gr) this.greg = gr;
    this.render();
  }

  // ===== Preview =====
  private preview(): void {
    let node = this.root.querySelector('.hdp-preview') as HTMLElement | null;
    if (!node) {
      node = el('div', 'hdp-preview');
      this.root.appendChild(node);
    }
    if (this.opt.type === 'gregorian') {
      node.textContent = `${this.opt.labels.hebrewPreview}: ${hebFullString(this.greg)}`;
    } else {
      const g = hebToGreg(this.heb.year, this.heb.month, this.heb.day);
      node.textContent = `${this.opt.labels.gregorianPreview}: ${g ? g.toLocaleDateString(this.opt.locale) : '—'}`;
    }
  }

  // ===== Keyboard =====
  private onKey = (e: KeyboardEvent): void => {
    const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'];
    if (e.key === 'Enter') {
      e.preventDefault();
      // In a drill-down view, Enter goes one level deeper instead of committing.
      if (this.gridView === 'years') {
        if (this.opt.precision === 'year') {
          this.commit();
        } else {
          this.gridView = 'months';
          this.render();
        }
      } else if (this.gridView === 'months') {
        if (this.opt.precision === 'month') {
          this.commit();
        } else {
          this.gridView = null;
          this.render();
        }
      } else {
        this.commit();
      }
      return;
    }
    if (!arrows.includes(e.key)) return;
    e.preventDefault();

    // Sub-views
    if (this.gridView === 'months') {
      this.keyMonths(e);
      return;
    }
    if (this.gridView === 'years') {
      this.keyYears(e);
      return;
    }
    // Day grid
    if (this.opt.type === 'gregorian') {
      let dt = new Date(this.greg.getFullYear(), this.greg.getMonth(), this.greg.getDate());
      if (e.key === 'ArrowRight') dt.setDate(dt.getDate() - 1);
      else if (e.key === 'ArrowLeft') dt.setDate(dt.getDate() + 1);
      else if (e.key === 'ArrowUp') dt.setDate(dt.getDate() - 7);
      else if (e.key === 'ArrowDown') dt.setDate(dt.getDate() + 7);
      else if (e.key === 'PageUp') { if (e.shiftKey) dt.setFullYear(dt.getFullYear() - 1); else dt.setMonth(dt.getMonth() - 1); }
      else if (e.key === 'PageDown') { if (e.shiftKey) dt.setFullYear(dt.getFullYear() + 1); else dt.setMonth(dt.getMonth() + 1); }
      else if (e.key === 'Home') dt = new Date(dt.getFullYear(), dt.getMonth(), 1);
      else if (e.key === 'End') dt = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
      this.greg = dt;
      this.heb = { ...gregToHebParts(dt) };
      this.render();
      this.changed();
    } else {
      let gr = hebToGreg(this.heb.year, this.heb.month, this.heb.day);
      if (!gr) return;
      gr = new Date(gr.getFullYear(), gr.getMonth(), gr.getDate());
      if (e.key === 'PageUp' && e.shiftKey) { this.hebYearJump(-1); this.changed(); return; }
      if (e.key === 'PageDown' && e.shiftKey) { this.hebYearJump(1); this.changed(); return; }
      if (e.key === 'ArrowRight') gr.setDate(gr.getDate() - 1);
      else if (e.key === 'ArrowLeft') gr.setDate(gr.getDate() + 1);
      else if (e.key === 'ArrowUp') gr.setDate(gr.getDate() - 7);
      else if (e.key === 'ArrowDown') gr.setDate(gr.getDate() + 7);
      else if (e.key === 'PageUp') gr.setDate(gr.getDate() - 29);
      else if (e.key === 'PageDown') gr.setDate(gr.getDate() + 29);
      else if (e.key === 'Home') { this.heb.day = 1; this.render(); this.changed(); return; }
      else if (e.key === 'End') {
        const cm = getMonthsForYear(this.heb.year).find((m) => m.num === this.heb.month);
        if (cm) this.heb.day = cm.days;
        this.render();
        this.changed();
        return;
      }
      this.greg = gr;
      this.heb = { ...gregToHebParts(gr) };
      this.render();
      this.changed();
    }
  };

  private keyMonths(e: KeyboardEvent): void {
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      const dir = e.key === 'PageUp' ? -1 : 1;
      if (this.opt.type === 'gregorian') this.shiftGregYear(dir);
      else this.shiftHebYear(dir);
      return;
    }
    if (this.opt.type === 'gregorian') {
      let mi = this.greg.getMonth();
      if (e.key === 'ArrowRight') mi -= 1;
      else if (e.key === 'ArrowLeft') mi += 1;
      else if (e.key === 'ArrowUp') mi -= 3;
      else if (e.key === 'ArrowDown') mi += 3;
      else if (e.key === 'Home') mi = 0;
      else if (e.key === 'End') mi = 11;
      let yy = this.greg.getFullYear();
      while (mi < 0) { mi += 12; yy -= 1; }
      while (mi > 11) { mi -= 12; yy += 1; }
      const lastD = new Date(yy, mi + 1, 0).getDate();
      this.greg = new Date(yy, mi, Math.min(this.greg.getDate(), lastD));
      this.heb = { ...gregToHebParts(this.greg) };
    } else {
      const months = getMonthsForYear(this.heb.year);
      let idx = months.findIndex((m) => m.num === this.heb.month);
      if (idx < 0) idx = 0;
      if (e.key === 'ArrowRight') idx -= 1;
      else if (e.key === 'ArrowLeft') idx += 1;
      else if (e.key === 'ArrowUp') idx -= 3;
      else if (e.key === 'ArrowDown') idx += 3;
      else if (e.key === 'Home') idx = 0;
      else if (e.key === 'End') idx = months.length - 1;
      let yy = this.heb.year;
      let list = months;
      while (idx < 0) { yy -= 1; list = getMonthsForYear(yy); idx += list.length; }
      while (idx >= list.length) { idx -= list.length; yy += 1; list = getMonthsForYear(yy); }
      this.heb.year = yy;
      this.heb.month = list[idx].num;
    }
    this.render();
    this.changed();
  }

  private keyYears(e: KeyboardEvent): void {
    const greg = this.opt.type === 'gregorian';
    const sel = greg ? this.greg.getFullYear() : this.heb.year;
    const start = greg ? this.gregBlockStart(sel) : this.hebBlockStart(sel);
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      const dir = e.key === 'PageUp' ? -1 : 1;
      this.yearBlockStart = start + dir * YEAR_BLOCK;
      if (greg) this.shiftGregYear(dir * YEAR_BLOCK);
      else this.shiftHebYear(dir * YEAR_BLOCK);
      this.changed();
      return;
    }
    let dy = 0;
    if (e.key === 'ArrowRight') dy = -1;
    else if (e.key === 'ArrowLeft') dy = 1;
    else if (e.key === 'ArrowUp') dy = -4; // 4 columns
    else if (e.key === 'ArrowDown') dy = 4;
    else if (e.key === 'Home') dy = start - sel;
    else if (e.key === 'End') dy = start + YEAR_BLOCK - 1 - sel;
    const newSel = sel + dy;
    // Keep the 20-year window fixed; only page it when the selection leaves it.
    let bs = start;
    while (newSel < bs) bs -= YEAR_BLOCK;
    while (newSel > bs + YEAR_BLOCK - 1) bs += YEAR_BLOCK;
    this.yearBlockStart = bs;
    if (greg) this.shiftGregYear(dy);
    else this.shiftHebYear(dy);
    this.changed();
  }
}

// ===== styled hover tooltip (replaces native title for day events) =====
let tipEl: HTMLElement | null = null;
function ensureTip(): HTMLElement {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'hdp-tip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
  }
  return tipEl;
}
/** Hide the shared tooltip (e.g. on grid rebuild / keyboard navigation). */
export function hideTip(): void {
  if (tipEl) tipEl.classList.remove('is-visible');
}
/** Remove the shared tooltip from the DOM entirely (on picker close/destroy). */
export function removeTip(): void {
  if (tipEl) {
    tipEl.remove();
    tipEl = null;
  }
}
function attachTip(cell: HTMLElement, events: JewishEvent[]): void {
  const show = () => {
    const tip = ensureTip();
    tip.innerHTML = '';
    events.forEach((e) => {
      const row = document.createElement('div');
      row.className = 'hdp-tip-row hdp-tip-' + e.type;
      const dot = document.createElement('span');
      dot.className = 'hdp-tip-dot';
      const txt = document.createElement('span');
      txt.textContent = e.name;
      row.appendChild(dot);
      row.appendChild(txt);
      tip.appendChild(row);
    });
    tip.classList.add('is-visible');
    const r = cell.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    let top = r.top - tr.height - 8;
    if (top < 4) top = r.bottom + 8;
    let left = r.left + r.width / 2 - tr.width / 2;
    left = Math.max(6, Math.min(left, window.innerWidth - tr.width - 6));
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  };
  const hide = () => {
    if (tipEl) tipEl.classList.remove('is-visible');
  };
  cell.addEventListener('mouseenter', show);
  cell.addEventListener('mouseleave', hide);
  cell.addEventListener('focus', show, true);
  cell.addEventListener('blur', hide, true);
}

// ===== tiny DOM helpers =====
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}
function pill(text: string, tip: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', 'hdp-pill') as HTMLButtonElement;
  b.type = 'button';
  b.textContent = text;
  b.title = tip;
  b.onclick = (e) => { e.stopPropagation(); onClick(); };
  return b;
}
function yearRangeLabel(start: number): HTMLElement {
  const span = el('div', 'hdp-title-text');
  span.textContent = `${start} – ${start + YEAR_BLOCK - 1}`;
  return span;
}
function yearRangeLabelHeb(start: number): HTMLElement {
  const span = el('div', 'hdp-title-text');
  span.textContent = `${hebYearGematria(start)} – ${hebYearGematria(start + YEAR_BLOCK - 1)}`;
  return span;
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
