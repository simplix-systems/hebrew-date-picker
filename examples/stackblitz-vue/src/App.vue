<script setup>
import { ref, computed } from 'vue';
import { HebrewDatePicker } from '@simplix-systems/hebrew-date-picker/vue';

const single = ref(null);
const range = ref(null);
const inputValue = ref(null);

const rangeText = computed(() => {
  const v = range.value;
  if (!v || (!v.start && !v.end)) return '—';
  return `${v.start || '—'} → ${v.end || '—'}`;
});
</script>

<template>
  <div class="page">
    <h1>בורר תאריך עברי · Vue</h1>
    <p class="sub">
      <code>@simplix-systems/hebrew-date-picker</code> — לוח עברי ולועזי עם חגים,
      פרשת השבוע, טווחים מהירים ועוד.
    </p>

    <section>
      <h2>תאריך בודד (inline)</h2>
      <HebrewDatePicker v-model="single" inline calendar="hebrew" />
      <p class="out">נבחר: <b>{{ single || '—' }}</b></p>
    </section>

    <section>
      <h2>טווח + טווחים מהירים (presets)</h2>
      <HebrewDatePicker v-model="range" inline mode="range" :presets="true" calendar="hebrew" />
      <p class="out">טווח: <b>{{ rangeText }}</b></p>
    </section>

    <section>
      <h2>שדה קלט (popup)</h2>
      <HebrewDatePicker v-model="inputValue" placeholder="בחירת תאריך" />
      <p class="out">נבחר: <b>{{ inputValue || '—' }}</b></p>
    </section>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, 'Segoe UI', Arial, sans-serif;
  background: #eef1f7;
  color: #111827;
}
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px;
}
h1 {
  font-size: 26px;
  margin: 0 0 4px;
}
.sub {
  color: #6b7280;
  margin: 0 0 24px;
}
section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 20px;
  overflow-x: auto;
}
h2 {
  font-size: 15px;
  margin: 0 0 12px;
}
.out {
  margin: 12px 0 0;
  font-size: 14px;
  color: #374151;
}
.out b {
  color: #4c5fd8;
  font-variant-numeric: tabular-nums;
}
</style>
