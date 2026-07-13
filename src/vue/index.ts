// Vue 3 wrapper (works in Nuxt 3 — import client-side or via a plugin).
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from 'vue';
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
    seconds: { type: Boolean, default: undefined },
    openOnInputClick: { type: Boolean, default: undefined },
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
    let picker: DatePicker | null = null;
    let field: DateInput | null = null;

    // Structural options — everything EXCEPT the value (so a value change updates
    // in place instead of rebuilding, which would drop focus mid-typing).
    const structural = (): PickerOptions => ({
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

    const onSelect = (r: PickerResult) => {
      const v: WrapperValue = 'iso' in r ? r.iso : { start: r.start, end: r.end };
      emit('update:modelValue', v);
      emit('change', r);
    };

    const build = () => {
      if (!hostRef.value) return;
      picker?.destroy(); picker = null;
      field?.destroy(); field = null;
      const opts = { ...structural(), value: props.modelValue, onSelect };
      if (props.inline) {
        picker = new DatePicker({ ...opts, inline: true }).mount(hostRef.value);
      } else {
        field = new DateInput({ ...opts, placeholder: props.placeholder }).mount(hostRef.value);
      }
    };

    onMounted(build);
    onBeforeUnmount(() => { picker?.destroy(); field?.destroy(); });
    // Rebuild only on structural / mode changes.
    watch(() => JSON.stringify([props.inline, structural(), props.placeholder]), build);
    // Value changes update in place.
    watch(() => props.modelValue, (v) => {
      if (props.inline) picker?.setValue(v ?? null);
      else field?.setValue(v ?? null);
    });

    return () => h('div', { ref: hostRef, class: props.inline ? 'hdp-host' : 'hdp-input-host' });
  }
});

export default HebrewDatePicker;
export * from '../core/index';
