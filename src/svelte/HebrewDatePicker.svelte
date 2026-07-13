<script>
  // Svelte 4/5 wrapper around the framework-agnostic core.
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { DatePicker, DateInput } from '@simplix-systems/hebrew-date-picker';

  /** @type {string | {start:string,end:string} | null} */
  export let value = null;
  export let calendar = undefined;
  export let mode = 'single';
  export let precision = 'day';
  export let inline = false;
  export let displayCalendar = undefined;
  export let openOnInputClick = undefined;
  export let placeholder = '';
  export let min = null;
  export let max = null;
  export let highlightShabbat = undefined;
  export let highlightHolidays = undefined;
  export let showParasha = undefined;
  export let diaspora = undefined;
  export let time = undefined;
  export let seconds = undefined;
  export let timeFormat = undefined;
  export let timeStyle = undefined;
  export let primaryColor = undefined;
  export let theme = undefined;
  export let size = undefined;
  export let compact = undefined;
  export let closeOnSelect = undefined;
  export let showTooltips = undefined;
  export let labels = undefined;

  const dispatch = createEventDispatcher();
  let host;
  let picker = null;
  let field = null;
  let mounted = false;
  let sig = '';

  function structural() {
    return {
      calendar, mode, precision, min, max, highlightShabbat, highlightHolidays, showParasha,
      showTooltips, diaspora, displayCalendar, openOnInputClick, time, seconds, timeFormat,
      timeStyle, primaryColor, theme, size, compact, closeOnSelect, labels
    };
  }

  function onSelect(r) {
    value = 'iso' in r ? r.iso : { start: r.start, end: r.end };
    dispatch('change', { value, result: r });
  }

  function build() {
    if (!host) return;
    picker?.destroy(); picker = null;
    field?.destroy(); field = null;
    sig = JSON.stringify([inline, structural(), placeholder]);
    const opts = { ...structural(), value, onSelect };
    if (inline) picker = new DatePicker({ ...opts, inline: true }).mount(host);
    else field = new DateInput({ ...opts, placeholder }).mount(host);
  }

  onMount(() => { mounted = true; build(); });
  onDestroy(() => { picker?.destroy(); field?.destroy(); });

  // Rebuild only when a structural option (or inline / placeholder) changes.
  $: if (mounted) {
    const s = JSON.stringify([inline, structural(), placeholder]);
    if (s !== sig) build();
  }
  // Push value changes into the existing instance (so typing/focus survive).
  $: if (mounted && (picker || field)) {
    void value;
    if (inline) picker?.setValue(value ?? null);
    else field?.setValue(value ?? null);
  }
</script>

<div bind:this={host} class={inline ? 'hdp-host' : 'hdp-input-host'}></div>
