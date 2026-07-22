// Angular wrapper — a standalone component + ControlValueAccessor.
// Works with Angular 15+ (standalone components). Import directly:
//   import { HebrewDatePickerComponent } from '@simplix-systems/hebrew-date-picker/angular';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  forwardRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
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
  PickerOptions,
  RangePreset,
  ISODate
} from '../core/types';

@Component({
  selector: 'hebrew-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // A single host element; the core mounts either the inline calendar or the
  // input field (icon + clear + masked typing) into it.
  template: `<div #host [class]="inline ? 'hdp-host' : 'hdp-input-host'"></div>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HebrewDatePickerComponent),
      multi: true
    }
  ]
})
export class HebrewDatePickerComponent
  implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor
{
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;

  @Input() value: WrapperValue = null;
  @Input() calendar?: CalendarType;
  @Input() mode: SelectionMode = 'single';
  @Input() precision: Precision = 'day';
  @Input() inline = false;
  @Input() displayCalendar?: CalendarType;
  @Input() openOnInputClick?: boolean;
  @Input() placeholder = '';
  @Input() min: ISODate | null = null;
  @Input() max: ISODate | null = null;
  @Input() highlightShabbat?: boolean;
  @Input() highlightHolidays?: boolean;
  @Input() showParasha?: boolean;
  @Input() diaspora?: boolean;
  @Input() time?: boolean;
  @Input() seconds?: boolean;
  @Input() timeFormat?: '12' | '24';
  @Input() timeStyle?: 'native' | 'dropdown' | 'stepper' | 'clock' | 'normal' | 'mobile';
  @Input() primaryColor?: string;
  @Input() theme?: Theme;
  @Input() size?: 'sm' | 'md' | 'lg';
  @Input() compact?: boolean;
  @Input() closeOnSelect?: boolean;
  @Input() showTooltips?: boolean;
  @Input() presets?: boolean | RangePreset[];
  @Input() labels?: Partial<PickerLabels>;

  @Output() valueChange = new EventEmitter<WrapperValue>();
  @Output() change = new EventEmitter<PickerResult>();

  private picker: DatePicker | null = null;
  private field: DateInput | null = null;
  private sig = '';
  private onCVAChange: (v: WrapperValue) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.build();
  }

  ngOnChanges(): void {
    if (!this.picker && !this.field) return; // first build happens in ngAfterViewInit
    if (this.structuralSig() !== this.sig) this.build();
    else this.applyValue();
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
    this.field?.destroy();
  }

  // ControlValueAccessor
  writeValue(v: WrapperValue): void {
    this.value = v;
    this.applyValue();
  }
  registerOnChange(fn: (v: WrapperValue) => void): void { this.onCVAChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  private structural(): PickerOptions {
    return {
      calendar: this.calendar,
      mode: this.mode,
      precision: this.precision,
      min: this.min,
      max: this.max,
      highlightShabbat: this.highlightShabbat,
      highlightHolidays: this.highlightHolidays,
      showParasha: this.showParasha,
      showTooltips: this.showTooltips,
      diaspora: this.diaspora,
      displayCalendar: this.displayCalendar,
      openOnInputClick: this.openOnInputClick,
      time: this.time,
      seconds: this.seconds,
      timeFormat: this.timeFormat,
      timeStyle: this.timeStyle,
      primaryColor: this.primaryColor,
      theme: this.theme,
      size: this.size,
      compact: this.compact,
      closeOnSelect: this.closeOnSelect,
      presets: this.presets,
      labels: this.labels
    };
  }

  private structuralSig(): string {
    return JSON.stringify([this.inline, this.structural(), this.placeholder]);
  }

  private emit(r: PickerResult): void {
    const v: WrapperValue = 'iso' in r ? r.iso : { start: r.start, end: r.end };
    this.value = v;
    this.valueChange.emit(v);
    this.change.emit(r);
    this.onCVAChange(v);
    this.onTouched();
  }

  private applyValue(): void {
    if (this.inline) this.picker?.setValue(this.value ?? null);
    else this.field?.setValue(this.value ?? null);
  }

  private build(): void {
    if (!this.host) return;
    this.picker?.destroy();
    this.picker = null;
    this.field?.destroy();
    this.field = null;
    this.sig = this.structuralSig();
    const opts = { ...this.structural(), value: this.value, onSelect: (r: PickerResult) => this.emit(r) };
    if (this.inline) {
      this.picker = new DatePicker({ ...opts, inline: true }).mount(this.host.nativeElement);
    } else {
      this.field = new DateInput({ ...opts, placeholder: this.placeholder }).mount(this.host.nativeElement);
    }
  }
}

export * from '../core/index';
