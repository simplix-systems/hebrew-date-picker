// types.ts - Public type definitions for hebrew-datepicker

/** Which calendar tab is shown first / used as the default. */
export type CalendarType = 'gregorian' | 'hebrew';

/** Single date or a start–end range. */
export type SelectionMode = 'single' | 'range';

/** The precision the user is allowed to pick. */
export type Precision = 'day' | 'month' | 'year';

/** 12-hour or 24-hour clock for the time picker. */
export type TimeFormat = '12' | '24';

/**
 * Time-picker presentation:
 * - 'native'   — the device/OS time picker (`<input type="time">`)
 * - 'dropdown' — hour/minute select menus  (alias: 'normal')
 * - 'stepper'  — up/down steppers
 * - 'clock'    — Material-style analog clock dial  (alias: 'mobile')
 */
export type TimeStyle = 'native' | 'dropdown' | 'stepper' | 'clock' | 'normal' | 'mobile';

/** Overall picker size. */
export type PickerSize = 'sm' | 'md' | 'lg';

/** Built-in UI language (selects the label preset + default locale). */
export type Lang = 'he' | 'en';

/** Color theme: 'light' (default), 'dark', or 'auto' (follow the OS/browser). */
export type Theme = 'light' | 'dark' | 'auto';

/** A date encoded as a local "YYYY-MM-DD" ISO string (no timezone). */
export type ISODate = string;

/** Parts of a Hebrew date. `month` is the Intl identifier, e.g. "Tishri", "Adar I". */
export interface HebrewParts {
  year: number;
  /** Intl en-u-ca-hebrew month identifier, e.g. "Nisan", "Adar I", "Adar II". */
  month: string;
  day: number;
}

/** A Hebrew month descriptor for a specific Hebrew year. */
export interface HebrewMonth {
  /** Intl identifier (stable across the year), e.g. "Tishri". */
  num: string;
  /** Localized long name, e.g. "תשרי". */
  name: string;
  /** Gregorian Date of day 1 of this month. */
  firstGreg: Date;
  /** Number of days in this Hebrew month (29 or 30). */
  days: number;
}

export type JewishEventType =
  | 'yomtov'
  | 'cholhamoed'
  | 'fast'
  | 'minor'
  | 'chanukah'
  | 'roshchodesh'
  | 'shabbat';

export interface JewishEvent {
  name: string;
  type: JewishEventType;
}

/** The value emitted on selection. */
export interface SingleResult {
  /** Selected date as ISO "YYYY-MM-DD", or '' when cleared. */
  iso: ISODate;
  /** Which calendar tab was active when the date was committed. */
  type: CalendarType;
}

export interface RangeResult {
  start: ISODate;
  end: ISODate;
  type: CalendarType;
}

export type PickerResult = SingleResult | RangeResult;

/** Labels — every visible string can be overridden. */
export interface PickerLabels {
  gregorianTab: string;
  hebrewTab: string;
  today: string;
  clear: string;
  confirm: string;
  rangeStart: string;
  rangeEnd: string;
  pickMonth: string;
  pickYear: string;
  prevMonth: string;
  nextMonth: string;
  prevYear: string;
  nextYear: string;
  /** Tooltip for the “jump a whole year back” button in the day grid. */
  jumpPrevYear: string;
  /** Tooltip for the “jump a whole year forward” button in the day grid. */
  jumpNextYear: string;
  hebrewPreview: string;
  gregorianPreview: string;
  weekdays: string[]; // length 7, Sunday-first
}

/** Options that configure a single picker instance. */
export interface PickerOptions {
  /** Default / primary calendar. Default: 'gregorian'. */
  calendar?: CalendarType;
  /** Single date or range. Default: 'single'. */
  mode?: SelectionMode;
  /** 'day' (default), 'month' to pick whole months only, or 'year' to pick whole years only. */
  precision?: Precision;
  /** Render inline into the host element instead of as a popup. */
  inline?: boolean;
  /** Initial value(s). ISO string, or {start,end} for range mode. */
  value?: ISODate | { start: ISODate; end: ISODate } | null;
  /** Earliest selectable date (ISO). */
  min?: ISODate | null;
  /** Latest selectable date (ISO). */
  max?: ISODate | null;
  /** Highlight Saturdays (Shabbat). Default: from global config. */
  highlightShabbat?: boolean;
  /** Mark Jewish holidays (religious only — never State holidays). Default: from global config. */
  highlightHolidays?: boolean;
  /** Show the weekly Torah portion (Parashat HaShavua) on Shabbat. Default: from global config. */
  showParasha?: boolean;
  /**
   * Show the leading/trailing days of the previous and next month (greyed, but
   * still selectable). When off (default), those cells are blank and the grid
   * shows only the rows it needs (5 normally, 6 for months that overflow).
   */
  outsideDays?: boolean;
  /**
   * Use the Diaspora (chutz la'aretz) custom: second-day Yom Tov and the
   * Diaspora Parashat HaShavua schedule. Default: false (Eretz Yisrael).
   */
  diaspora?: boolean;
  /** Show keyboard-shortcut tooltips on nav controls. Default: true. */
  showTooltips?: boolean;
  /**
   * Which calendar to show in the input field after selection (popup/component
   * input modes). 'hebrew' (default) shows the Hebrew date, 'gregorian' the
   * civil date of the same day.
   */
  displayCalendar?: CalendarType;
  /** Enable a time picker. When on, committed values are 'YYYY-MM-DDTHH:mm'. */
  time?: boolean;
  /** Also pick seconds (committed values become 'YYYY-MM-DDTHH:mm:ss'). Requires `time`. */
  seconds?: boolean;
  /** 12- or 24-hour clock for the time picker. Default '24'. */
  timeFormat?: TimeFormat;
  /** Time picker style: 'normal' (dropdowns) or 'mobile' (analog clock). Default 'normal'. */
  timeStyle?: TimeStyle;
  /** Built-in UI language ('he' default | 'en'). Selects labels + default locale; `labels`/`locale` still override. */
  lang?: Lang;
  /** Round (circular) day cells instead of square. Default false. */
  rounded?: boolean;
  /**
   * Draw a border around the header nav arrows and the month/year pills.
   * Default true. Set false for a borderless header (e.g. to blend into a
   * Filament panel) — nothing else about the grid or highlights changes.
   */
  headerBorder?: boolean;
  /** Accent color — used for the confirm button and the selected day. Any CSS color. */
  primaryColor?: string;
  /** Color theme: 'light' (default), 'dark', or 'auto' (follow the OS/browser). */
  theme?: Theme;
  /** Overall size. Default 'md'. */
  size?: PickerSize;
  /** Compact / minimal layout: hides the secondary date, subtitle and preview. */
  compact?: boolean;
  /** Close the popup when a day is picked. Default true (ignored when `time` is on — then the OK button confirms). */
  closeOnSelect?: boolean;
  /** Input-field layer only (DateInput / wrappers): does clicking the input open the
   * picker? Honored for a Gregorian display (Hebrew always opens). Default true. */
  openOnInputClick?: boolean;
  /** Override any visible label. */
  labels?: Partial<PickerLabels>;
  /** Called whenever a value is committed. */
  onSelect?: (result: PickerResult) => void;
  /** Called when the popup closes (popup mode only). */
  onClose?: () => void;
}

/** Global defaults applied to every picker unless overridden per-instance. */
export interface GlobalConfig {
  calendar: CalendarType;
  highlightShabbat: boolean;
  highlightHolidays: boolean;
  showParasha: boolean;
  showTooltips: boolean;
  /** Show previous/next month days in the grid (greyed, selectable). Default false. */
  outsideDays: boolean;
  /** Diaspora custom (2-day Yom Tov + Diaspora parashot). Default false. */
  diaspora: boolean;
  /** Calendar shown in the input after selection. Default 'hebrew'. */
  displayCalendar: CalendarType;
  /** Enable time picking by default. Default false. */
  time: boolean;
  /** Pick seconds by default. Default false. */
  seconds: boolean;
  /** Default clock. Default '24'. */
  timeFormat: TimeFormat;
  /** Default time picker style. Default 'normal'. */
  timeStyle: TimeStyle;
  /** Built-in UI language. Default 'he'. */
  lang: Lang;
  /** Round (circular) day cells by default. Default false. */
  rounded: boolean;
  /** Draw a border around the header nav/pills by default. Default true. */
  headerBorder: boolean;
  /** Default accent color (empty = library default). */
  primaryColor: string;
  /** Default size. Default 'md'. */
  size: PickerSize;
  /** Default compact layout. Default false. */
  compact: boolean;
  /** Close popup on pick. Default true. */
  closeOnSelect: boolean;
  /** BCP-47 locale used for Gregorian month names + previews. Default 'he-IL'. */
  locale: string;
  labels: PickerLabels;
}
