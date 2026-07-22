// Web Component wrapper — <hebrew-date-picker>. No framework required.
//
//   import 'hebrew-datepicker/webcomponent';
//   import 'hebrew-datepicker/style.css';
//   <hebrew-date-picker calendar="hebrew" show-parasha></hebrew-date-picker>
//
// Renders into light DOM so the global stylesheet applies. Listen for the
// `change` event; read/write the `.value` property for ranges/objects.
import { DatePicker } from '../core/picker';
import type {
  PickerOptions,
  PickerResult,
  CalendarType,
  SelectionMode,
  Precision,
  PickerLabels,
  ISODate,
  TimeFormat,
  TimeStyle,
  PickerSize,
  Lang,
  Theme
} from '../core/types';

type WCValue = ISODate | { start: ISODate; end: ISODate } | null;

const BOOL_ATTRS = [
  'inline',
  'highlight-shabbat',
  'highlight-holidays',
  'show-parasha',
  'outside-days',
  'show-tooltips',
  'diaspora',
  'time',
  'seconds',
  'rounded',
  'header-border',
  'compact',
  'close-on-select',
  'presets'
];
const OBSERVED = ['calendar', 'mode', 'precision', 'value', 'min', 'max', 'time-format', 'time-style', 'lang', 'theme', 'primary-color', 'size', ...BOOL_ATTRS];

export class HebrewDatePickerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return OBSERVED;
  }

  private picker: DatePicker | null = null;
  private _value: WCValue = null;
  private _labels: Partial<PickerLabels> | undefined;

  connectedCallback(): void {
    if (this.hasAttribute('value') && this._value == null) {
      this._value = this.getAttribute('value');
    }
    this.render();
  }

  disconnectedCallback(): void {
    this.picker?.destroy();
    this.picker = null;
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null): void {
    if (name === 'value') this._value = val;
    if (this.isConnected) this.render();
  }

  /** Current value (string ISO, or {start,end} for range mode). */
  get value(): WCValue {
    return this._value;
  }
  set value(v: WCValue) {
    this._value = v;
    if (this.isConnected) this.render();
  }

  /** Override visible labels (property only — objects can't be attributes). */
  set labels(l: Partial<PickerLabels> | undefined) {
    this._labels = l;
    if (this.isConnected) this.render();
  }
  get labels(): Partial<PickerLabels> | undefined {
    return this._labels;
  }

  private boolAttr(name: string): boolean | undefined {
    if (!this.hasAttribute(name)) return undefined;
    const v = this.getAttribute(name);
    return v !== 'false' && v !== '0';
  }

  private options(): PickerOptions {
    return {
      calendar: (this.getAttribute('calendar') as CalendarType) || undefined,
      mode: (this.getAttribute('mode') as SelectionMode) || undefined,
      precision: (this.getAttribute('precision') as Precision) || undefined,
      min: this.getAttribute('min'),
      max: this.getAttribute('max'),
      highlightShabbat: this.boolAttr('highlight-shabbat'),
      highlightHolidays: this.boolAttr('highlight-holidays'),
      showParasha: this.boolAttr('show-parasha'),
      outsideDays: this.boolAttr('outside-days'),
      showTooltips: this.boolAttr('show-tooltips'),
      diaspora: this.boolAttr('diaspora'),
      time: this.boolAttr('time'),
      seconds: this.boolAttr('seconds'),
      timeFormat: (this.getAttribute('time-format') as TimeFormat) || undefined,
      timeStyle: (this.getAttribute('time-style') as TimeStyle) || undefined,
      lang: (this.getAttribute('lang') as Lang) || undefined,
      theme: (this.getAttribute('theme') as Theme) || undefined,
      rounded: this.boolAttr('rounded'),
      headerBorder: this.boolAttr('header-border'),
      primaryColor: this.getAttribute('primary-color') || undefined,
      size: (this.getAttribute('size') as PickerSize) || undefined,
      compact: this.boolAttr('compact'),
      closeOnSelect: this.boolAttr('close-on-select'),
      presets: this.boolAttr('presets'),
      labels: this._labels,
      value: this._value
    };
  }

  private render(): void {
    this.picker?.destroy();
    this.innerHTML = '';
    this.picker = new DatePicker({
      ...this.options(),
      inline: true,
      onSelect: (r: PickerResult) => {
        this._value = 'iso' in r ? r.iso : { start: r.start, end: r.end };
        this.dispatchEvent(
          new CustomEvent<PickerResult>('change', {
            detail: r,
            bubbles: true,
            composed: true
          })
        );
      }
    }).mount(this);
  }
}

/** Register the element (idempotent). Call with a custom tag name if desired. */
export function defineHebrewDatePicker(tag = 'hebrew-date-picker'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, HebrewDatePickerElement);
  }
}

// Auto-register on import (browser only).
defineHebrewDatePicker();

export * from '../core/index';
