// React wrapper.
import { useRef, useEffect, useCallback } from 'react';
import { DatePicker } from '../core/picker';
import { DateInput } from '../core/date-input';
import type { WrapperValue } from '../shared/bind';
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
  seconds?: boolean;
  openOnInputClick?: boolean;
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
  const pickerRef = useRef<DatePicker | null>(null);
  const fieldRef = useRef<DateInput | null>(null);
  const valueRef = useRef<WrapperValue>(value);
  valueRef.current = value;

  // Structural options — everything EXCEPT the value.
  const structural = () => ({
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
    displayCalendar: props.displayCalendar,
    openOnInputClick: props.openOnInputClick,
    time: props.time,
    seconds: props.seconds,
    timeFormat: props.timeFormat,
    timeStyle: props.timeStyle,
    primaryColor: props.primaryColor,
    theme: props.theme,
    size: props.size,
    compact: props.compact,
    closeOnSelect: props.closeOnSelect,
    labels: props.labels
  });
  const sig = JSON.stringify(structural());

  const handleSelect = useCallback(
    (r: PickerResult) => {
      const v: WrapperValue = 'iso' in r ? r.iso : { start: r.start, end: r.end };
      onChange?.(v, r);
    },
    [onChange]
  );

  // Build / rebuild on structural changes only (not on `value`, so typing keeps focus).
  useEffect(() => {
    if (!hostRef.current) return;
    pickerRef.current?.destroy();
    pickerRef.current = null;
    fieldRef.current?.destroy();
    fieldRef.current = null;
    const opts = { ...structural(), value: valueRef.current, onSelect: handleSelect };
    if (inline) {
      pickerRef.current = new DatePicker({ ...opts, inline: true }).mount(hostRef.current);
    } else {
      fieldRef.current = new DateInput({ ...opts, placeholder }).mount(hostRef.current);
    }
    return () => {
      pickerRef.current?.destroy();
      fieldRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline, sig, placeholder, handleSelect]);

  // Sync external value changes in place.
  useEffect(() => {
    if (inline) pickerRef.current?.setValue(value ?? null);
    else fieldRef.current?.setValue(value ?? null);
  }, [value, inline]);

  return <div ref={hostRef} className={className ?? (inline ? 'hdp-host' : 'hdp-input-host')} />;
}

export default HebrewDatePicker;
export * from '../core/index';
