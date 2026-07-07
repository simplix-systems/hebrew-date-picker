// config.ts - Global configuration for hebrew-datepicker (defaults incl. outsideDays)
//
// Consumers can set global defaults once (e.g. in a Nuxt/Vite plugin or app
// entry point) and every picker instance will inherit them. Per-instance
// options always win over globals.
import type { GlobalConfig, PickerLabels, Lang } from './types';

/** Hebrew labels (the default). */
export const DEFAULT_LABELS: PickerLabels = {
  gregorianTab: 'לועזי',
  hebrewTab: 'עברי',
  today: 'היום',
  clear: 'נקה',
  confirm: 'אישור',
  rangeStart: 'מתאריך',
  rangeEnd: 'עד תאריך',
  pickMonth: 'בחירת חודש',
  pickYear: 'בחירת שנה',
  prevMonth: 'חודש קודם',
  nextMonth: 'חודש הבא',
  prevYear: 'שנה קודמת',
  nextYear: 'שנה הבאה',
  jumpPrevYear: 'שנה אחורה',
  jumpNextYear: 'שנה קדימה',
  hebrewPreview: 'עברי',
  gregorianPreview: 'לועזי',
  weekdays: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
};

/** English labels. */
export const DEFAULT_LABELS_EN: PickerLabels = {
  gregorianTab: 'Gregorian',
  hebrewTab: 'Hebrew',
  today: 'Today',
  clear: 'Clear',
  confirm: 'OK',
  rangeStart: 'From',
  rangeEnd: 'To',
  pickMonth: 'Pick month',
  pickYear: 'Pick year',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  prevYear: 'Previous year',
  nextYear: 'Next year',
  jumpPrevYear: 'Previous year',
  jumpNextYear: 'Next year',
  hebrewPreview: 'Hebrew',
  gregorianPreview: 'Gregorian',
  weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
};

/** Label preset + default locale for a built-in language. */
export function langPreset(lang: Lang): { labels: PickerLabels; locale: string } {
  return lang === 'en'
    ? { labels: { ...DEFAULT_LABELS_EN }, locale: 'en-US' }
    : { labels: { ...DEFAULT_LABELS }, locale: 'he-IL' };
}

const globalConfig: GlobalConfig = {
  calendar: 'hebrew',
  highlightShabbat: true,
  highlightHolidays: true,
  showParasha: true,
  showTooltips: true,
  outsideDays: false,
  diaspora: false,
  displayCalendar: 'hebrew',
  time: false,
  seconds: false,
  timeFormat: '24',
  timeStyle: 'normal',
  lang: 'he',
  rounded: false,
  clean: false,
  primaryColor: '',
  size: 'md',
  compact: false,
  closeOnSelect: true,
  locale: 'he-IL',
  labels: { ...DEFAULT_LABELS }
};

/**
 * Merge partial settings into the global config. Call once at app startup.
 *
 * @example
 * import { setGlobalConfig } from 'hebrew-datepicker';
 * setGlobalConfig({ calendar: 'hebrew', showParasha: false });
 */
export function setGlobalConfig(
  partial: Partial<Omit<GlobalConfig, 'labels'>> & {
    labels?: Partial<PickerLabels>;
  }
): GlobalConfig {
  if (partial.labels) {
    globalConfig.labels = { ...globalConfig.labels, ...partial.labels };
    delete (partial as { labels?: unknown }).labels;
  }
  Object.assign(globalConfig, partial);
  return getGlobalConfig();
}

/** Read a snapshot of the current global config. */
export function getGlobalConfig(): GlobalConfig {
  return { ...globalConfig, labels: { ...globalConfig.labels } };
}

/** Reset everything back to library defaults (mainly for tests). */
export function resetGlobalConfig(): void {
  setGlobalConfig({
    calendar: 'hebrew',
    highlightShabbat: true,
    highlightHolidays: true,
    showParasha: true,
    showTooltips: true,
    outsideDays: false,
    diaspora: false,
    displayCalendar: 'hebrew',
    time: false,
    seconds: false,
    timeFormat: '24',
    timeStyle: 'normal',
    lang: 'he',
    rounded: false,
    primaryColor: '',
    size: 'md',
    compact: false,
    closeOnSelect: true,
    locale: 'he-IL',
    labels: { ...DEFAULT_LABELS }
  });
}
