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
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { NgIf } from '@angular/common';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DatePicker } from '../core/picker';
import { getGlobalConfig } from '../core/config';
import { buildOptions, openPopup, formatDisplay, type WrapperValue } from '../shared/bind';
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
  imports: [NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="inline" #host class="hdp-host"></div>
    <span *ngIf="!inline" class="hdp-field" (click)="open()">
      <svg class="hdp-cal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <input #inputEl class="hdp-input" readonly [value]="displayText()" [placeholder]="placeholder" (click)="open()" (focus)="open()" />
    </span>
  `,
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
  @ViewChild('host') host?: ElementRef<HTMLElement>;
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  @Input() value: WrapperValue = null;
  @Input() calendar?: CalendarType;
  @Input() mode: SelectionMode = 'single';
  @Input() precision: Precision = 'day';
  @Input() inline = false;
  @Input() displayCalendar?: CalendarType;
  @Input() placeholder = '';
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

  constructor(private cdr: ChangeDetectorRef) {}

  /** Text shown in the input (popup mode), in the display calendar. */
  displayText(): string {
    const cal = this.displayCalendar ?? getGlobalConfig().displayCalendar;
    return formatDisplay(this.value, cal, this.mode) || '';
  }

  /** Open the popup, anchored to the input. */
  open(): void {
    if (!this.inputEl) return;
    this.picker?.close();
    this.picker = openPopup(this.inputEl.nativeElement, buildOptions(this.opts(), (r) => this.emit(r)));
  }

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
    else this.cdr.markForCheck(); // refresh the input text (popup mode, OnPush)
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
    this.cdr.markForCheck(); // refresh the input text under OnPush
  }

  private render(): void {
    if (!this.host) return;
    this.picker?.destroy();
    this.picker = new DatePicker({
      ...buildOptions(this.opts(), (r) => this.emit(r)),
      inline: true
    }).mount(this.host.nativeElement);
  }
}

export * from '../core/index';
