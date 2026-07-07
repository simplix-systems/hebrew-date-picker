// Angular wrapper — a standalone component + ControlValueAccessor.
// Works with Angular 15+ (standalone components). Import directly:
//   import { HebrewDatePickerComponent } from 'hebrew-datepicker/angular';
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
import { buildOptions, openPopup, type WrapperValue } from '../shared/bind';
import type {
  CalendarType,
  SelectionMode,
  Precision,
  Theme,
  PickerResult,
  PickerLabels,
  ISODate
} from '../core/types';

@Component({
  selector: 'hebrew-date-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="hdp-host"></div>`,
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
  @Input() inline = true;
  @Input() min: ISODate | null = null;
  @Input() max: ISODate | null = null;
  @Input() highlightShabbat?: boolean;
  @Input() highlightHolidays?: boolean;
  @Input() showParasha?: boolean;
  @Input() diaspora?: boolean;
  @Input() time?: boolean;
  @Input() timeFormat?: '12' | '24';
  @Input() timeStyle?: 'native' | 'dropdown' | 'stepper' | 'clock' | 'normal' | 'mobile';
  @Input() primaryColor?: string;
  @Input() theme?: Theme;
  @Input() size?: 'sm' | 'md' | 'lg';
  @Input() compact?: boolean;
  @Input() closeOnSelect?: boolean;
  @Input() showTooltips?: boolean;
  @Input() labels?: Partial<PickerLabels>;

  @Output() valueChange = new EventEmitter<WrapperValue>();
  @Output() change = new EventEmitter<PickerResult>();

  private picker: DatePicker | null = null;
  private onCVAChange: (v: WrapperValue) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.inline) this.render();
  }

  ngOnChanges(): void {
    if (this.inline && this.host) this.render();
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
  }

  // ControlValueAccessor
  writeValue(v: WrapperValue): void {
    this.value = v;
    if (this.inline && this.host) this.render();
  }
  registerOnChange(fn: (v: WrapperValue) => void): void { this.onCVAChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  /** Open as a popup anchored to the given element (non-inline usage). */
  openAt(anchor: HTMLElement): void {
    this.picker?.close();
    this.picker = openPopup(anchor, buildOptions(this.opts(), (r) => this.emit(r)));
  }

  private opts() {
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
      time: this.time,
      timeFormat: this.timeFormat,
      timeStyle: this.timeStyle,
      primaryColor: this.primaryColor,
      theme: this.theme,
      size: this.size,
      compact: this.compact,
      closeOnSelect: this.closeOnSelect,
      labels: this.labels,
      value: this.value
    };
  }

  private emit(r: PickerResult): void {
    const v: WrapperValue = 'iso' in r ? r.iso : { start: r.start, end: r.end };
    this.value = v;
    this.valueChange.emit(v);
    this.change.emit(r);
    this.onCVAChange(v);
    this.onTouched();
  }

  private render(): void {
    this.picker?.destroy();
    this.picker = new DatePicker({
      ...buildOptions(this.opts(), (r) => this.emit(r)),
      inline: true
    }).mount(this.host.nativeElement);
  }
}

export * from '../core/index';
