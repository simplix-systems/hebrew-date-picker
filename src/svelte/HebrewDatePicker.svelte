<script>
  // Svelte 4/5 wrapper around the framework-agnostic core.
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { DatePicker } from 'hebrew-datepicker';

  /** @type {string | {start:string,end:string} | null} */
  export let value = null;
  export let calendar = undefined;
  export let mode = 'single';
  export let precision = 'day';
  export let inline = true;
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

  onMount(() => { if (inline) render(); });
  onDestroy(() => picker?.destroy());

  // re-render when reactive inputs change
  $: if (host && inline) {
    void [calendar, mode, precision, min, max, highlightShabbat, highlightHolidays, showParasha, showTooltips, diaspora];
    render();
  }
</script>

<div bind:this={host} class="hdp-host"></div>
