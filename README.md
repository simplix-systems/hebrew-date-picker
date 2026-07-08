<div align="center">

# 🗓️ @simplix-systems/hebrew-date-picker

**A beautiful, fully-featured Hebrew & Gregorian date picker.**

Dual calendar · Holidays · Parashat HaShavua · Range selection · Keyboard shortcuts · RTL

[**▶ Live demo**](https://simplix-systems.github.io/hebrew-date-picker/) · [עברית 🇮🇱](./README.he.md) · Works with **Vue · Nuxt · React · Svelte · Angular** · Zero runtime dependencies

</div>

---

## ✨ Features

- **Two calendars in one** — switch between a Hebrew (`עברי`) and Gregorian (`לועזי`) view with a tab.
- **Real Hebrew calendar** — gematria years and days (`תשפ״ו`, `ט״ו`), leap years (`אדר א׳`/`אדר ב׳`), built on the platform `Intl` engine, so there are **no runtime dependencies** and no data tables to keep up to date.
- **Range mode** — two months side by side; choose a start in one and an end in the other.
- **Month-only mode** — for "choose a month" flows, hide the day grid entirely.
- **Year-only mode** — for "choose a year" flows, show just the year grid.
- **Religious Jewish events** (Torah/rabbinic only — *never* modern State holidays):
  - Holiday highlighting with tooltips (Chanukah, Purim, Tu BiShvat, Pesach, Shavuot, Sukkot, fasts…).
  - **Parashat HaShavua** on every Shabbat, including combined portions (e.g. *Vayakhel-Pekudei*) and festival Shabbatot.
  - Rosh Chodesh and fast-day postponements.
- **Shabbat highlighting**.
- **Keyboard shortcuts** with tooltips on every control.
- **Global config file** — set your defaults once.
- **Themeable** via CSS variables; ships with a dark theme.
- **TypeScript** types for everything.

## 📦 Installation

```bash
npm install @simplix-systems/hebrew-date-picker
```

Then import the stylesheet once, anywhere in your app:

```js
import '@simplix-systems/hebrew-date-picker/style.css';
```

---

## 🚀 Quick start

### Vue 3 / Nuxt 3

```vue
<script setup>
import { HebrewDatePicker } from '@simplix-systems/hebrew-date-picker/vue';
import '@simplix-systems/hebrew-date-picker/style.css';
import { ref } from 'vue';

const date = ref('2026-06-16'); // ISO "YYYY-MM-DD"
</script>

<template>
  <HebrewDatePicker v-model="date" calendar="hebrew" :show-parasha="true" />
</template>
```

> **Nuxt:** the component is browser-only. Either wrap it in `<ClientOnly>` or
> register it in a `~/plugins/hebrew-datepicker.client.ts` plugin (see
> [Global configuration](#-global-configuration)).

### React

```tsx
import { useState } from 'react';
import { HebrewDatePicker } from '@simplix-systems/hebrew-date-picker/react';
import '@simplix-systems/hebrew-date-picker/style.css';

export default function App() {
  const [date, setDate] = useState('2026-06-16');
  return <HebrewDatePicker value={date} onChange={(v) => setDate(v)} calendar="hebrew" />;
}
```

### Svelte

```svelte
<script>
  import { HebrewDatePicker } from '@simplix-systems/hebrew-date-picker/svelte';
  import '@simplix-systems/hebrew-date-picker/style.css';
  let date = '2026-06-16';
</script>

<HebrewDatePicker bind:value={date} calendar="hebrew" />
```

### Angular (standalone component)

```ts
import { Component } from '@angular/core';
import { HebrewDatePickerComponent } from '@simplix-systems/hebrew-date-picker/angular';

@Component({
  standalone: true,
  imports: [HebrewDatePickerComponent],
  template: `<hebrew-date-picker [(value)]="date" calendar="hebrew"></hebrew-date-picker>`
})
export class DemoComponent {
  date = '2026-06-16';
}
```

Add `import '@simplix-systems/hebrew-date-picker/style.css';` to your global styles, or to `angular.json` → `styles`.

### Web Component (no framework)

```html
<link rel="stylesheet" href="node_modules/@simplix-systems/hebrew-date-picker/dist/hebrew-datepicker.css" />
<script type="module">
  import '@simplix-systems/hebrew-date-picker/webcomponent'; // registers <hebrew-date-picker>
</script>

<hebrew-date-picker calendar="hebrew" show-parasha highlight-holidays></hebrew-date-picker>
<script>
  document.querySelector('hebrew-date-picker')
    .addEventListener('change', (e) => console.log(e.detail)); // { iso, type } or { start, end, type }
</script>
```

Boolean attributes: `inline`, `highlight-shabbat`, `highlight-holidays`, `show-parasha`, `show-tooltips`, `diaspora`. For ranges or custom `labels`, set the `.value` / `.labels` **properties** in JS. See `examples/demo.html` for a full showcase.

**No build tool?** Use the standalone global build with a classic `<script>` (works over `file://`):

```html
<link rel="stylesheet" href="@simplix-systems/hebrew-date-picker/dist/hebrew-datepicker.css" />
<script src="@simplix-systems/hebrew-date-picker/dist/hebrew-datepicker.global.js"></script>
<hebrew-date-picker calendar="hebrew"></hebrew-date-picker>
<!-- window.HebrewDatePicker also exposes DatePicker, setGlobalConfig, etc. -->
```

### Plain JavaScript (the core, no framework)

```js
import { DatePicker } from '@simplix-systems/hebrew-date-picker';
import '@simplix-systems/hebrew-date-picker/style.css';

// Inline:
new DatePicker({ calendar: 'hebrew', showParasha: true,
  onSelect: (r) => console.log(r) }).mount(document.getElementById('cal'));

// Or as a popup anchored to an input:
const input = document.querySelector('#date-input');
input.addEventListener('click', () => {
  new DatePicker({ value: input.value, onSelect: (r) => (input.value = r.iso) }).open(input);
});
```

---

## ⚙️ Options / flags

Every option works as a prop (Vue/React/Svelte/Angular) and as a `DatePicker` constructor option.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `calendar` | `'gregorian' \| 'hebrew'` | `'hebrew'` | Default/primary calendar tab. |
| `mode` | `'single' \| 'range'` | `'single'` | Single date or a start–end range (two calendars). |
| `precision` | `'day' \| 'month' \| 'year'` | `'day'` | `'month'` shows only the month grid (pick whole months); `'year'` shows only the year grid (pick whole years). |
| `inline` | `boolean` | `true` (component) | Render inline, or as a popup. |
| `value` | `string \| { start, end } \| null` | `null` | Initial value. ISO `"YYYY-MM-DD"`; object in range mode. |
| `min` / `max` | `string \| null` | `null` | Earliest / latest selectable date (ISO). |
| `highlightShabbat` | `boolean` | `true` | Tint Saturdays. |
| `highlightHolidays` | `boolean` | `true` | Mark religious holidays + show tooltips. |
| `showParasha` | `boolean` | `true` | Show the weekly Torah portion on Shabbat. |
| `outsideDays` | `boolean` | `false` | Show the previous/next month's days in the grid (greyed, still selectable). |
| `showTooltips` | `boolean` | `true` | Show keyboard-shortcut tooltips on controls. |
| `diaspora` | `boolean` | `false` | Diaspora (chutz la'aretz) custom: 2-day Yom Tov + Diaspora parashot. |
| `displayCalendar` | `'hebrew' \| 'gregorian'` | `'hebrew'` | Calendar shown in the input after selection (popup/input modes). |
| `time` | `boolean` | `false` | Add a time picker. Committed values become `"YYYY-MM-DDTHH:mm"` (per endpoint in range mode). |
| `seconds` | `boolean` | `false` | Also pick seconds (`"YYYY-MM-DDTHH:mm:ss"`). Requires `time`. |
| `timeFormat` | `'12' \| '24'` | `'24'` | 12- or 24-hour clock. |
| `timeStyle` | `'native' \| 'dropdown' \| 'stepper' \| 'clock'` | `'dropdown'` | `native` = the device/OS time picker; `dropdown` = select menus; `stepper` = up/down steppers; `clock` = analog clock dial. (`normal`→dropdown, `mobile`→clock still accepted.) |
| `lang` | `'he' \| 'en'` | `'he'` | UI language (label preset + default locale); `labels` still override. |
| `rounded` | `boolean` | `false` | Circular day cells instead of square. |
| `headerBorder` | `boolean` | `true` | Draw a border around the header nav arrows and month/year pills. Set `false` for a borderless header (nothing else changes). |
| `primaryColor` | `string` | — | Accent color for the confirm button & selected day (any CSS color). |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Color theme. `'auto'` follows the OS/browser preference. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Overall picker size. |
| `compact` | `boolean` | `false` | Minimal layout: hides the secondary date, subtitle and preview. |
| `closeOnSelect` | `boolean` | `true` | Close the popup when a day is picked (ignored when `time` is on — confirm with OK). |
| `labels` | `Partial<PickerLabels>` | — | Override any visible text (see below). |

**Events / binding**

- Vue: `v-model` + `@change="(result) => …"`.
- React: `onChange={(value, result) => …}`.
- Svelte: `bind:value` + `on:change`.
- Angular: `[(value)]` (also implements `ControlValueAccessor`, so it works with `formControlName`) + `(change)`.

The emitted **result** is `{ iso, type }` for a single date, or `{ start, end, type }` for a range, where `type` is the calendar that was active.

### Month-only example

```html
<HebrewDatePicker v-model="month" precision="month" calendar="hebrew" />
```

### Year-only example

```html
<HebrewDatePicker v-model="year" precision="year" calendar="hebrew" />
```

`precision="year"` opens straight to the year grid and commits as soon as a year
is picked (`iso` is the first day of that year — 1 Jan for Gregorian, 1 Tishrei
for Hebrew).

### Range example

```html
<HebrewDatePicker v-model="range" mode="range" />
<!-- range === { start: "2026-06-01", end: "2026-06-30" } -->
```

---

## ⌨️ Keyboard shortcuts

| Key | Day grid | Month grid | Year grid |
| --- | --- | --- | --- |
| `← / →` | ± 1 day | ± 1 month | ± 1 year |
| `↑ / ↓` | ± 1 week | ± 1 row | ± 1 row |
| `PageUp` / `PageDown` | ± 1 month | ± 1 year | ± 24-year block |
| `Home` / `End` | first / last of month | Jan / Dec (Tishri / Elul) | block edges |
| `Enter` | confirm selection | | |
| `Esc` | close popup | | |

> Layout is **RTL**, so `→` moves to the *previous* day and `←` to the *next* — matching the visual direction.

Hover any navigation arrow, month pill or year pill to see a tooltip naming the target (e.g. *"Next month — ניסן (PgDn)"*).

---

## 🛠️ Global configuration

Set defaults once and every picker inherits them. Per-instance props always win.

```ts
import { setGlobalConfig } from '@simplix-systems/hebrew-date-picker';

setGlobalConfig({
  calendar: 'hebrew',        // default tab everywhere
  highlightHolidays: true,
  highlightShabbat: true,
  showParasha: true,
  showTooltips: true,
  locale: 'he-IL',           // used for Gregorian month names + previews
  labels: {                  // override any text
    today: 'היום',
    confirm: 'בחר',
    rangeStart: 'מתאריך',
    rangeEnd: 'עד תאריך'
  }
});
```

**Nuxt 3** — `plugins/hebrew-datepicker.client.ts`:

```ts
import { setGlobalConfig } from '@simplix-systems/hebrew-date-picker';
export default defineNuxtPlugin(() => {
  setGlobalConfig({ calendar: 'hebrew' });
});
```

`getGlobalConfig()` returns the current snapshot; `resetGlobalConfig()` restores library defaults.

### Overridable labels

`gregorianTab`, `hebrewTab`, `today`, `clear`, `confirm`, `rangeStart`, `rangeEnd`, `pickMonth`, `pickYear`, `prevMonth`, `nextMonth`, `prevYear`, `nextYear`, `hebrewPreview`, `gregorianPreview`, `weekdays` (array of 7, Sunday-first).

---

## 🎨 Theming

Override any CSS variable on the `.hdp` root, or add the `hdp-dark` class.

```css
.hdp {
  --hdp-primary: #2563eb;
  --hdp-radius: 16px;
  --hdp-shabbat-bg: #fff7ed;
  --hdp-holiday: #b91c1c;
}
```

| Variable | Purpose |
| --- | --- |
| `--hdp-primary` / `--hdp-primary-soft` | Accent + hover/selection tint |
| `--hdp-bg` / `--hdp-text` / `--hdp-muted` | Surface and text colors |
| `--hdp-border` | Borders |
| `--hdp-today` | Today outline |
| `--hdp-shabbat-bg` | Shabbat day background |
| `--hdp-holiday` | Holiday text/marker color |
| `--hdp-radius` / `--hdp-radius-sm` | Corner radii |
| `--hdp-row-h` | Day-grid row height (≈50px at `md`); the months/years grids follow it so the popup keeps a stable height. |

---

## 💡 Use cases

- **Hebrew-date forms** — yahrzeits, brit/bar-mitzvah dates, anniversaries by Hebrew date.
- **Shul / community apps** — show the parasha and holidays right in the picker.
- **Booking / reporting ranges** — pick a Hebrew or Gregorian date range with two calendars.
- **Month pickers** — monthly budgets or reports (`precision="month"`).
- **Year pickers** — yearly summaries or Hebrew-year selectors (`precision="year"`).
- **Bilingual products** — let each user default to the calendar they think in via global config.

---

## 🧠 Using the calendar engine directly

The core exports the calendar primitives, handy for building custom UIs:

```ts
import {
  gregToHebParts, hebToGreg, getMonthsForYear,
  hebYearGematria, hebDayGematria,
  getDayEvents, getParasha, getHoliday
} from '@simplix-systems/hebrew-date-picker';

gregToHebParts(new Date(2026, 5, 16)); // { year: 5786, month: 'Sivan', day: ... }
hebYearGematria(5786);                 // "תשפ״ו"
getParasha(new Date('2026-06-13'));    // weekly portion for that Shabbat (or null)
```

---

## 📅 A note on accuracy

The Hebrew calendar is computed from the platform `Intl` Hebrew calendar, so conversions match the host environment's Unicode data. Holiday and Parashat logic defaults to the **Eretz Yisrael** custom (single-day Yom Tov; Shmini Atzeret = Simchat Torah on 22 Tishri). Set `diaspora: true` for the two-day Yom Tov / Diaspora parashot cycle. The package ships with a test suite (`npm test`) that verifies round-trip conversions, leap-year handling and Parashat assignment across many years.

## 📄 License

MIT © Eli
