// React wrapper.
import { useRef, useEffect, useCallback } from 'react';
import { DatePicker } from '../core/picker';
import { buildOptions, formatDisplay, openPopup, resolveDisplayCalendar, type WrapperValue } from '../shared/bind';
import type {
  CalendarType,
  SelectionMode,
  Precision,
  Theme,
  PickerResult,
  PickerLabels,
  ISODate
} from '../core/types';

export interface HebrewDatePickerProps {
  value?: WrapperValue;
  onChange?: (value: WrapperValue, result: PickerResult) => void;
  calendar?: CalendarType;
  mode?: SelectionMode;
  precision?: Precision;
  inline?: boolean;
  min?: ISODate | null;
  max?: ISODate | null;
  highlightShabbat?: boolean;
  highlightHolidays?: boolean;
  showParasha?: boolean;
  showTooltips?: boolean;
  diaspora?: boolean;
  displayCalendar?: CalendarType;
  time?: boolean;
  timeFormat?: '12' | '24';
  timeStyle?: 'native' | 'dropdown' | 'stepper' | 'clock' | 'normal' | 'mobile';
  primaryColor?: string;
  theme?: Theme;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  closeOnSelect?: boolean;
  labels?: Partial<PickerLabels>;
  placeholder?: string;
  className?: string;
}

export function HebrewDatePicker(props: HebrewDatePickerProps) {
  const { value = null, onChange, inline = false, placeholder = '', className } = props;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<DatePicker | null>(null);

  const options = useCallback(
    () => ({
      calendar: props.calendar,
      mode: props.mode ?? 'single',
      precision: props.precision ?? 'day',
      min: props.min ?? null,
      max: props.max ?? null,
      highlightShabbat: props.highlightShabbat,
      highlightHolidays: props.highlightHolidays,
      showParasha: props.showParasha,
      showTooltips: props.showTooltips,
      diaspora: props.diaspora,
      time: props.time,
      timeFormat: props.timeFormat,
      timeStyle: props.timeStyle,
      primaryColor: props.primaryColor,
      theme: props.theme,
      size: props.size,
      compact: props.compact,
      closeOnSelect: props.closeOnSelect,
      labels: props.labels,
      value
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(props), value]
  );

  const handleSelect = useCallback(
    (r: PickerResult) => {
      const v: WrapperValue = 'iso' in r ? r.iso : { start: r.start, end: r.end };
      onChange?.(v, r);
    },
    [onChange]
  );

  useEffect(() => {
    if (!inline || !hostRef.current) return;
    pickerRef.current?.destroy();
    pickerRef.current = new DatePicker({
      ...buildOptions(options(), handleSelect),
      inline: true
    }).mount(hostRef.current);
    return () => pickerRef.current?.destroy();
  }, [inline, options, handleSelect]);

  if (inline) {
    return <div ref={hostRef} className={className ?? 'hdp-host'} />;
  }

  const open = () => {
    if (!inputRef.current) return;
    pickerRef.current?.close();
    pickerRef.current = openPopup(inputRef.current, buildOptions(options(), handleSelect));
  };

  // Custom className opts out of the built-in field chrome (icon + border).
  if (className) {
    return (
      <input
        ref={inputRef}
        className={className}
        readOnly
        value={formatDisplay(value, resolveDisplayCalendar(props), props.mode) || ''}
        placeholder={placeholder}
        onClick={open}
        onFocus={open}
      />
    );
  }

  return (
    <span className="hdp-field" onClick={open}>
      <svg className="hdp-cal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <input
        ref={inputRef}
        className="hdp-input"
        readOnly
        value={formatDisplay(value, resolveDisplayCalendar(props), props.mode) || ''}
        placeholder={placeholder}
        onClick={open}
        onFocus={open}
      />
    </span>
  );
}

export default HebrewDatePicker;
export * from '../core/index';
