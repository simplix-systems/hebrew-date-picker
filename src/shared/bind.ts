// shared/bind.ts - Shared glue used by all framework wrappers.
// Keeps each wrapper paper-thin: build options from props, format display text.
import { DatePicker } from '../core/picker';
import { parseISO, hebFullString } from '../core/index';
import { getGlobalConfig } from '../core/config';
import type { PickerOptions, PickerResult, ISODate } from '../core/types';

export type WrapperValue = ISODate | { start: ISODate; end: ISODate } | null;

export interface WrapperProps extends Omit<PickerOptions, 'value' | 'onSelect' | 'onClose'> {
  value?: WrapperValue;
}

/** Resolve the calendar used for the input display text. */
export function resolveDisplayCalendar(
  props: WrapperProps
): 'gregorian' | 'hebrew' {
  return props.displayCalendar ?? getGlobalConfig().displayCalendar;
}

export function buildOptions(
  props: WrapperProps,
  onSelect: (r: PickerResult) => void
): PickerOptions {
  return { ...props, value: props.value ?? null, onSelect };
}

/** Human-readable text for an input field, in the active calendar system. */
export function formatDisplay(
  value: WrapperValue,
  calendar: 'gregorian' | 'hebrew' = getGlobalConfig().calendar,
  mode: 'single' | 'range' = 'single'
): string {
  const fmtOne = (iso: ISODate): string => {
    if (!iso) return '';
    const d = parseISO(iso);
    if (!d) return '';
    if (calendar === 'hebrew') return hebFullString(d);
    return d.toLocaleDateString(getGlobalConfig().locale);
  };
  if (mode === 'range' && value && typeof value === 'object') {
    const s = fmtOne(value.start);
    const e = fmtOne(value.end);
    if (!s && !e) return '';
    return `${s} – ${e}`;
  }
  return fmtOne(typeof value === 'string' ? value : '');
}

/** Mount an inline picker. Returns a disposer. */
export function mountInline(
  host: HTMLElement,
  options: PickerOptions
): { picker: DatePicker; destroy: () => void } {
  const picker = new DatePicker({ ...options, inline: true }).mount(host);
  return { picker, destroy: () => picker.destroy() };
}

/** Open a popup picker anchored to an element. Returns the instance. */
export function openPopup(anchor: HTMLElement, options: PickerOptions): DatePicker {
  return new DatePicker({ ...options, inline: false }).open(anchor);
}
