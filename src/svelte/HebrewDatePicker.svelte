<script>
  // Svelte 4/5 wrapper around the framework-agnostic core.
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { DatePicker, parseISO, hebFullString, getGlobalConfig } from '@simplix-systems/hebrew-date-picker';

  /** @type {string | {start:string,end:string} | null} */
  export let value = null;
  export let calendar = undefined;
  export let mode = 'single';
  export let precision = 'day';
  export let inline = false;
  export let displayCalendar = undefined;
  export let placeholder = '';
  export let min = null;
  export let max = null;
  export let highlightShabbat = undefined;
  export let highlightHolidays = undefined;
  export let showParasha = undefined;
  export let diaspora = undefined;
  export let time = undefined;
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

  function opts() {
    return {
      calendar, mode, precision, min, max,
      highlightShabbat, highlightHolidays, showParasha, showTooltips, diaspora, time, timeFormat, timeStyle, primaryColor, theme, size, compact, closeOnSelect, labels,
      value,
      onSelect: (r) => {
        value = 'iso' in r ? r.iso : { start: r.start, end: r.end };
        dispatch('change', { value, result: r });
      }
    };
  }

  function render() {
    if (!host) return;
    picker?.destroy();
    picker = new DatePicker({ ...opts(), inline: true }).mount(host);
  }

  let inputEl;
  function open() {
    if (!inputEl) return;
    picker?.close();
    picker = new DatePicker({ ...opts(), inline: false }).open(inputEl);
  }

  // Display text for the input (popup mode).
  function fmtOne(iso) {
    if (!iso) return '';
    const d = parseISO(String(iso).split('T')[0]);
    if (!d) return '';
    const cal = displayCalendar ?? getGlobalConfig().displayCalendar;
    return cal === 'hebrew' ? hebFullString(d) : d.toLocaleDateString(getGlobalConfig().locale);
  }
  $: display = mode === 'range' && value && typeof value === 'object'
    ? `${fmtOne(value.start)} – ${fmtOne(value.end)}`
    : fmtOne(typeof value === 'string' ? value : '');

  onMount(() => { if (inline) render(); });
  onDestroy(() => picker?.destroy());

  // re-render the inline calendar when reactive inputs change
  $: if (host && inline) {
    void [calendar, mode, precision, min, max, highlightShabbat, highlightHolidays, showParasha, showTooltips, diaspora];
    render();
  }
</script>

{#if inline}
  <div bind:this={host} class="hdp-host"></div>
{:else}
  <span class="hdp-field" on:click={open}>
    <svg class="hdp-cal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
    <input bind:this={inputEl} class="hdp-input" readonly value={display} {placeholder} on:click={open} on:focus={open} />
  </span>
{/if}
