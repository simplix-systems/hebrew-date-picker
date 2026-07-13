// Vue 3 wrapper (works in Nuxt 3 — import client-side or via a plugin).
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from 'vue';
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

export const HebrewDatePicker = defineComponent({
  name: 'HebrewDatePicker',
  props: {
    modelValue: { type: [String, Object] as PropType<WrapperValue>, default: null },
    calendar: { type: String as PropType<CalendarType>, default: undefined },
    mode: { type: String as PropType<SelectionMode>, default: 'single' },
    precision: { type: String as PropType<Precision>, default: 'day' },
    inline: { type: Boolean, default: false },
    min: { type: String as PropType<ISODate>, default: null },
    max: { type: String as PropType<ISODate>, default: null },
    highlightShabbat: { type: Boolean, default: undefined },
    highlightHolidays: { type: Boolean, default: undefined },
    showParasha: { type: Boolean, default: undefined },
    diaspora: { type: Boolean, default: undefined },
    displayCalendar: { type: String as PropType<CalendarType>, default: undefined },
    time: { type: Boolean, default: undefined },
    timeFormat: { type: String as PropType<'12' | '24'>, default: undefined },
    timeStyle: { type: String as PropType<'native' | 'dropdown' | 'stepper' | 'clock' | 'normal' | 'mobile'>, default: undefined },
    primaryColor: { type: String, default: undefined },
    theme: { type: String as PropType<Theme>, default: undefined },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: undefined },
    compact: { type: Boolean, default: undefined },
    closeOnSelect: { type: Boolean, default: undefined },
    showTooltips: { type: Boolean, default: undefined },
    labels: { type: Object as PropType<Partial<PickerLabels>>, default: undefined },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const hostRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    let inline: DatePicker | null = null;
    let popup: DatePicker | null = null;

    const optionProps = () => ({
      calendar: props.calendar,
      mode: props.mode,
      precision: props.precision,
      min: props.min,
      max: props.max,
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
      value: props.modelValue
    });

    const onSelect = (r: PickerResult) => {
      const v: WrapperValue = 'iso' in r ? r.iso : { start: r.start, end: r.end };
      emit('update:modelValue', v);
      emit('change', r);
    };

    const mountInline = () => {
      if (!hostRef.value) return;
      inline?.destroy();
      inline = new DatePicker({ ...buildOptions(optionProps(), onSelect), inline: true }).mount(hostRef.value);
    };

    onMounted(() => {
      if (props.inline) mountInline();
    });
    onBeforeUnmount(() => {
      inline?.destroy();
      popup?.close();
    });
    watch(
      () => JSON.stringify(optionProps()),
      () => { if (props.inline) mountInline(); }
    );

    const displayText = () =>
      formatDisplay(props.modelValue, resolveDisplayCalendar(props), props.mode) || props.placeholder;

    const openPicker = () => {
      if (!inputRef.value) return;
      popup?.close();
      popup = openPopup(inputRef.value, { ...buildOptions(optionProps(), onSelect) });
    };

    return () =>
      props.inline
        ? h('div', { ref: hostRef, class: 'hdp-host' })
        : h('span', { class: 'hdp-field', onClick: openPicker }, [
            h('svg', {
              class: 'hdp-cal-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
              'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'
            }, [
              h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2' }),
              h('path', { d: 'M16 2v4M8 2v4M3 10h18' })
            ]),
            h('input', {
              ref: inputRef,
              class: 'hdp-input',
              readonly: true,
              value: displayText(),
              placeholder: props.placeholder,
              onClick: openPicker,
              onFocus: openPicker
            })
          ]);
  }
});

export default HebrewDatePicker;
export * from '../core/index';
