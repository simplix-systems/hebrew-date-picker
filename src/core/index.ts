// hebrew-datepicker — framework-agnostic core entry point.
export { DatePicker } from './picker';
export { CalendarView } from './calendar-view';
export {
  setGlobalConfig,
  getGlobalConfig,
  resetGlobalConfig,
  DEFAULT_LABELS,
  DEFAULT_LABELS_EN,
  langPreset
} from './config';

// Calendar engine (handy for building custom UIs)
export {
  gregToHebParts,
  hebToGreg,
  getMonthsForYear,
  buildYear,
  isLeapYear,
  hebDayGematria,
  hebYearGematria,
  hebYearGematriaFull,
  hebFullString,
  hebMonthName,
  hebMonthYearLabel
} from './hebrew';

export {
  getHoliday,
  getRoshChodesh,
  getParasha,
  getDayEvents
} from './jewish-events';

export {
  parseISO,
  toISO,
  gregMonthNames,
  compareISO
} from './dates';

export type {
  CalendarType,
  SelectionMode,
  Precision,
  Lang,
  Theme,
  TimeFormat,
  TimeStyle,
  PickerSize,
  ISODate,
  HebrewParts,
  HebrewMonth,
  JewishEvent,
  JewishEventType,
  SingleResult,
  RangeResult,
  PickerResult,
  PickerLabels,
  PickerOptions,
  GlobalConfig
} from './types';
