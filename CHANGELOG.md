# Changelog

All notable changes to **hebrew-datepicker** are documented here.
This project follows [Semantic Versioning](https://semver.org/) and the
[Keep a Changelog](https://keepachangelog.com/) format.

## Unreleased

### Added
- **`DateInput`** — a framework-agnostic input field that opens the picker as a
  popup: calendar icon, clear (×) button, and — for a Gregorian day in single
  mode — inline **masked typing** (`DD/MM/YYYY`) forced to `dir="ltr"` so the mask
  reads correctly inside an RTL page. Paste a Gregorian date in any display and it
  parses. All wrappers mount it in input mode. Exported for direct use.
- **`openOnInputClick`** option — whether clicking the input opens the picker
  (Gregorian display only; Hebrew always opens). `false` = open via the icon.
- **`placeholder`** on the input.

### Fixed
- **Missing input border (framework wrappers).** `.hdp-input` is rendered
  *outside* the `.hdp` panel, where the `--hdp-*` variables aren't in scope; the
  `var()` calls had no fallback, so the `border`/`background` shorthands became
  invalid and the border disappeared. Every property now carries a fallback.

### Changed (breaking)
- **Wrappers now default to an input + popup** (icon + clear + masked typing)
  instead of an inline calendar: `inline` defaults to `false` in the Vue, React,
  Svelte and Angular wrappers. Clicking the input **or the calendar icon** opens
  the picker. Pass `inline` for the old inline-calendar behaviour.

## [1.11.0] — 2026-06-22

### Added
- **`clean` skin** — a new minimal, **Filament-native look**: borderless cells, circular day/selection/today/holiday highlights, grey-scale chrome and the primary accent (inspired by the `alephdev/filament-hebrew-date` design). All colours come from the `--hdp-*` variables, so under the Filament theme they resolve to Filament's own tokens. Off by default (the standalone package keeps its richer look); enable with `clean: true`. **The Filament field turns it on by default** (`->clean(false)` to opt out).
- **`hebYearGematriaFull(year)`** export — the Hebrew year *with* the millennium prefix, e.g. `5786 → "ה׳תשפ״ו"`, `6786 → "ו׳תשפ״ו"`. The calendar **subtitle** now uses it (the pills/headers keep the short `תשפ״ו` form).
- **Double-click to pick & close.** Double-clicking a day now selects it and closes the popup **regardless of `closeOnSelect`** (and even when a time picker is shown) — in both single and range mode.

### Fixed
- **Header no longer breaks on long month names.** With a wide label such as a leap-year *Adar I* (אדר א׳), the month/year pills used to wrap to a second line and crowd the nav arrows. The pills now stay on one line, the `«` `‹` `›` `»` arrows keep a fixed position and width, and the header spacing was tightened so the month and year always fit (md included).

## [1.10.1] — 2026-06-22

### Fixed
- **Mouse selection now shows immediately.** Clicking a day in single mode marks it selected in the calendar right away (previously the highlight only appeared after you moved with the keyboard).
- **Range picking is two-phased and non-destructive.** Before a full range exists, a click *sequence* (day A then day B, even in the same calendar) sets the range. Once a full range exists, a click adjusts only the clicked side's endpoint and keeps the other (so clicking inside the range shrinks it instead of clearing it).
- **Clear wipes the range highlight** from both calendars (it previously left the highlighted days in inline mode).
- **`rounded` cells are uniform circles.** Range endpoints/in-range days are now the **same size** as ordinary day circles (no oversized pill), gaps between circles are tighter, and the holiday dot sits in the corner instead of overlapping the number.
- **Header nav no longer overlaps the title** (`md`) and no longer spills past the frame (`sm`): the `‹ › « »` buttons never shrink, and the panel clips to its border.

### Removed
- The in-picker **language toggle button** — language is controlled by the `lang` option (and `setLang()`), so the extra button was redundant.

### Filament
- The plugin now **bundles the core straight from the sibling package's source** (`src/core` + `src/styles`) — so `npm run build` always ships the latest logic with no manual re-vendor step (it falls back to the vendored `resources/picker/` files for a standalone copy).

## [1.10.0] — 2026-06-22

### Added
- **Live language toggle.** A small `EN` / `עב` button in the action bar switches the UI between Hebrew and English **at runtime** — and flips the whole picker between **RTL and LTR**. In LTR (English) the range calendars read left-to-right: the start calendar is on the **left**, the end on the right. Also exposed programmatically: `picker.setLang('en' | 'he')`.

### Changed
- **Bigger Gregorian day number.** In the Gregorian view the civil day number (`.hdp-num`) is now the large, full-contrast primary figure (the small Hebrew gematria sits beneath it).
- **Analog clock — the selector is always visible.** Picking a minute/second that isn't a multiple of 5 now shows a filled selector dot at the exact position (previously nothing was drawn between the 5-marks); the nearest number turns white where the dot covers it.

### Fixed
- **No more orphaned tooltips.** The day-event tooltip is removed from the DOM when the picker closes, and hidden whenever the grid rebuilds — so it no longer lingers after a date is chosen, or stays stuck over an old day after you navigate with the arrow keys.
- **Range re-selection keeps the other endpoint.** With a range already chosen, clicking another day no longer wipes the whole selection: a click in the start calendar moves the **start** (keeping the end), a click in the end calendar moves the **end** (keeping the start). Endpoints are auto-ordered so start ≤ end.
- **Nothing overflows the frame.** The header buttons (and the years grid) could spill past the left edge in `sm` (and the years grid in `md`); the panel now clips to its rounded border, the header controls are sized down in `sm`, and the month/year grids are constrained to the frame width.
- **Round cells are actually round** (not ellipses) — they're now sized as squares (the column width) centred in the row, so `rounded` shows clean circles regardless of `--hdp-row-h`. The range pill's rounded ends now follow the text direction (correct in both RTL and LTR).
- **Readable hover text.** Hovering a (non-selected) day keeps the number dark and legible on the light hover tint, including holiday days whose number is normally tinted.

## [1.9.0] — 2026-06-21

### Added
- **`lang` option (`'he'` | `'en'`)** — built-in i18n. Selects a Hebrew or English label preset and a sensible default locale (`he-IL` / `en-US`). Per-instance `labels` still override individual strings.
- **`seconds` option** — the time picker can now pick seconds; committed values become `"YYYY-MM-DDTHH:mm:ss"`. Works in the dropdown, stepper, native and clock styles.
- **`rounded` option** — circular day cells instead of square.
- **Year-jump nav** — the day grid header now has `«` / `»` buttons (just outside the month `‹` / `›` arrows) that jump a whole year back/forward. Keyboard: **Shift+PageUp / Shift+PageDown**.
- All of the above are also exposed on the Web Component (`lang`, `seconds`, `rounded`, `outside-days` attributes) and the Filament field (`->lang()`, `->seconds()`, `->rounded()`, `->outsideDays()`).

### Changed
- **`size: 'sm'` is now genuinely small** — much shorter day rows and smaller month/day/year cells and fonts (previously `sm` was only slightly smaller than `md`).
- **Analog clock — exact minutes/seconds.** You can now pick *any* minute (and second), not just multiples of 5: click anywhere on the dial (the value is read from the pointer angle) or use the −/＋ (and type-in) fine control below the dial. The hand points to the exact value even between the 5-unit markers.

### Fixed
- **Range hover preview now spans BOTH calendars.** While picking a range, moving the pointer onto the second (left) calendar highlighted only that calendar; the first (right) calendar's in-range days went dark. The preview is now coordinated across both grids (with a small debounce so crossing between them doesn't flicker).

## [1.8.0] — 2026-06-21

### Added
- **`outsideDays` option** — show the leading/trailing days of the previous and next month inside the grid, greyed out but still selectable (clicking one jumps to that month). Off by default.

### Changed
- **Grid height is now per-row, not a fixed 6 rows.** The day grid uses only the rows the month needs — **5 rows** for most months, **6** only for months that overflow (the popup then grows downward), and even **4** for a short February that starts on Sunday. Each row is a fixed height (`--hdp-row-h`, ~50px at `md`). The **months** and **years** grids are sized to match a 5-row day view, so switching between the day, months and years views keeps the popup the **same height**. The old `--hdp-grid-h` variable was replaced by `--hdp-row-h`.
- **Years grid is now a fixed 20-year block** (aligned to the decade, e.g. 2020–2039) instead of a window that always re-centred on the selection. The selected year is highlighted wherever it falls in the block (no longer pinned to the left). Arrow keys move the selection **within** the block; crossing the top/bottom edge pages to the previous/next 20 years. `PageUp`/`PageDown` and the header arrows page by 20.

### Fixed
- **Enter in the months / years view now drills down instead of committing.** Pressing Enter on a month opens that month's day grid (and only then does Enter on a day select it); pressing Enter on a year opens the months grid. Previously Enter in the months view silently committed the day that happened to be selected behind the scenes. (In `precision: "month"` mode, Enter on a month still commits, as before.)

### Removed
- The **Parashat HaShavua banner** that appeared under the calendar on a selected Shabbat. (The parasha still shows in the day-cell tooltips when `showParasha` is on.)

## [1.7.1] — 2026-06-16

### Fixed
- **Range hover preview** now actually shows. After picking the first day, hovering a later day highlights the prospective range (start → hovered) before you click. (The bug: when only one endpoint was set, the sorted range put the empty string first, so the views received `rangeStart=''`/`rangeEnd=<day>` and never entered the "picking" state. Now a single chosen endpoint is treated as the start with a null end.) Covered by a jsdom test.
- **`stepper` time style** now lays the hour and minute spinners **side by side** instead of stacked. (The wrap and the individual spinners shared the `hdp-time-stepper` class, so `flex-direction: column` was applied to the wrap too; the spinner element was renamed to `hdp-time-spin`.)

## [1.7.0] — 2026-06-16

### Added
- **Two more time-picker styles.** `timeStyle` now accepts four values:
  - **`native`** — the device/OS time picker (`<input type="time">`), so it looks like the platform: the browser's control on desktop, the Android wheel on Android, the iOS picker on Apple. 12/24h follows the device locale.
  - **`stepper`** — the previous ▲/▼ stepper design (restored).
  - **`dropdown`** (alias `normal`) — hour/minute select menus.
  - **`clock`** (alias `mobile`) — the analog clock dial.
  The demo now lets you switch between all four.

## [1.6.0] — 2026-06-16

### Fixed
- **Restored the stylesheet** — a truncated write had cut the CSS in half, breaking the action buttons, tooltip, time picker and dark theme. The full stylesheet is back.

### Added
- **Range hover preview** — after picking the first day in range mode, hovering over later days shows the prospective range before you click.
- **`closeOnSelect`** option (default `true`) — whether picking a day closes the popup. When a time picker is shown, the OK button confirms instead.
- The range **second (left) calendar now shows the next month** by default, instead of repeating the same month.
- **Interactive demo upgrades** — a `showInput` toggle (popup opens from a date input), a masked `DD/MM/YYYY` field you can type into (with a calendar icon on the right and a clear ✕ on the left for RTL), `displayCalendar` and `closeOnSelect` toggles, and a link to the keyboard-shortcut test page.

### Changed
- **Sizing model** — `size` / `compact` now change the **grid height** (`md` 204px, `sm` 180px, `compact` 164px) and the day/months/years grids all fill the same area, so the popup stays a **stable size** (the day grid always renders 6 rows). The previous fixed min-height/width constraints were removed.
- Picking a day (or changing the time) now emits the value **live**, so consumers see the selection update even before pressing OK (fixes the result not updating in time mode).

## [1.5.0] — 2026-06-16

### Fixed
- **Keyboard navigation stopped after a mouse click.** Clicking a day moved focus to the cell button; the first arrow rebuilt the grid and destroyed it, dropping focus to `<body>` so further keys were ignored. Focus is now preserved on the calendar grid across rebuilds (and a mouse selection keeps focus on the grid), so the keyboard keeps working. Covered by a jsdom regression test.
- **Unreadable text when hovering a selected/holiday day.** Hovering a selected (or range-endpoint) cell lightened its background while the text stayed white — white-on-light. Selected/range cells now keep their solid background on hover.

### Added
- **`primaryColor`** option — set the accent color (confirm button + selected day) to any CSS color.
- **`size`** option (`'sm' | 'md' | 'lg'`) and **`compact`** option (minimal layout that hides the secondary date, subtitle and preview).
- **Stable popup size** — the panel no longer shrinks when you open the months/years grid (no more "jump"); the calendar reserves the day-view height (~280×460).
- **Interactive demo** — `examples/demo.html` is now a single playground: radios/checkboxes/color picker for every prop, with the picker and a code snippet updating live.

### Changed
- The `'mobile'` time style is an **analog clock dial** (added in 1.4.0); docs updated accordingly.

## [1.4.0] — 2026-06-16

### Added
- **Analog clock time picker** for the `'mobile'` time style — a Material-style dial: pick the hour, then the minute, with an AM/PM toggle (12-hour) or an inner ring for 13–24 (24-hour). (The `'normal'` style keeps the dropdowns.)
- **`examples/keyboard-test.html`** — a single, auto-focused inline picker with a live key readout and shortcut reference, for testing keyboard navigation in isolation.

### Tests
- **`tests/picker-dom.test.mjs`** — real DOM tests (jsdom) that mount the picker and assert date + time combine into `"YYYY-MM-DDTHH:mm"` on commit (single, range, 12h→24h conversion, day-cell click). The suite skips gracefully if `jsdom` isn't installed and runs in CI.

## [1.3.0] — 2026-06-16

### Added
- **Time picker** — new `time` option. When enabled, committed values become `"YYYY-MM-DDTHH:mm"` (and each endpoint in range mode has its own time). Configurable with `timeFormat` (`'12'` | `'24'`) and `timeStyle` (`'normal'` dropdowns | `'mobile'` touch steppers).

### Changed
- **Range selection** now uses a click-sequence that works **within a single calendar** as well as across both: first click sets the start, the next sets the end (a click before the start restarts there).

### Fixed
- **Styled tooltip was transparent** — it is appended to `<body>`, outside `.hdp`, so the `--hdp-*` CSS variables didn't resolve. It now uses explicit colors and is always readable.
- **Dark theme:** month/year pills (`.hdp-pill`) now use the themed text color, so their text is visible on the dark surface.

## [1.2.0] — 2026-06-16

### Fixed
- **Parashat HaShavua rewritten and verified against hebcal.com.** The previous priority-based combination heuristic was replaced with festival-anchored segment counting. This fixes three real bugs:
  - **Shabbat Chol HaMoed Pesach** (and all Yom Tov / Chol HaMoed Shabbatot) no longer consume a weekly portion — they now read the festival reading, so e.g. *Shemini* correctly falls the following week.
  - **V'Zot HaBracha** is read only on Simchat Torah and never appears on a Shabbat.
  - **Leap-year combinations** are now correct (spring pairs separate; Matot-Masei before Chukat-Balak), as is the **Israel ⇄ Diaspora divergence** (e.g. 5782). Verified against hebcal for full leap and common years, Israel and Diaspora.
- Festival-Shabbat names are now specific (e.g. *שבת חול המועד פסח*, *שבת שמיני עצרת*) instead of a generic label, and no longer double the word *שבת*.

### Added
- **Range visual selection** — the chosen range is now highlighted across both calendars (start / end / in-range). **Double-clicking** a day collapses the range to that single day. Picking an end earlier than the start **reorders** automatically (it becomes the new start) and both grids update live.
- **Styled holiday tooltip** — day-cell holiday/parasha info now shows in a designed popup with colored markers, replacing the native browser `title` tooltip.
- **`displayCalendar` option** (`'hebrew'` default | `'gregorian'`) — controls whether the input shows the Hebrew or civil date after selection (Vue/React input modes).

## [1.1.0] — 2026-06-16

### Added
- **Web Component** — a framework-free `<hebrew-date-picker>` custom element (`hebrew-datepicker/webcomponent`). Attributes mirror the options; emits a `change` event; `.value` property supports ranges.
- **Standalone global build** — `dist/hebrew-datepicker.global.js`, a minified IIFE for plain `<script>` usage (no bundler, works over `file://`). Auto-registers the element and exposes `window.HebrewDatePicker`.
- **Diaspora (chutz la'aretz) mode** — new `diaspora` flag. Adds second-day Yom Tov (סוכות ב׳, פסח ב׳, שבועות ב׳, שמיני עצרת/שמחת תורה split) and switches the Parashat HaShavua schedule to the Diaspora cycle, including the Israel/Diaspora divergence after a festival that falls on Shabbat.
- **`examples/demo.html`** — a standalone showcase of every mode (Hebrew, Gregorian, range, month-only, diaspora, dark popup).
- **CI** — GitHub Actions workflow running type-check, tests and build across Node 18/20/22 and a **timezone matrix** (UTC, Asia/Jerusalem, America/New_York, Pacific/Auckland). New `node:test` suites run against the real compiled library.

### Changed
- **Default calendar is now Hebrew** (was Gregorian). Override per-instance or via `setGlobalConfig({ calendar: 'gregorian' })`.

### Fixed
- **Daylight Saving Time bug** in the calendar engine: month boundaries were computed by stepping `+86400000 ms`, which skips/doubles a day across DST transitions and produced wrong month lengths and failed round-trips in timezones with DST (e.g. Asia/Jerusalem). The engine now iterates at local noon using `setDate()`. This fixes the previously failing tests.
- Parashat HaShavua could leave one Shabbat unlabeled in some years; the tail-of-cycle Tishri festival Shabbatot are now excluded correctly.

## [1.0.0] — 2026-06-16

### Added
- **Dual calendar** — switchable Hebrew (לוח עברי) and Gregorian (לוח לועזי) tabs in a single picker.
- **Hebrew calendar engine** built on the platform `Intl` APIs — zero runtime dependencies. Gematria year/day rendering (e.g. `תשפ״ו`, `ט״ו`), correct leap-year (`Adar I` / `Adar II`) handling, and month/year drill-down grids.
- **Range mode** — two calendars side by side; pick a start date in one and an end date in the other to produce a sorted range.
- **Month-only mode** (`precision: "month"`) for flows that only need a month/year.
- **Religious Jewish events**
  - Holiday highlighting (`highlightHolidays`) — Torah/rabbinic dates only: Chanukah, Purim, Tu BiShvat, Pesach, Shavuot, Sukkot, the fast days, etc. **Modern Israeli State observances are intentionally excluded.**
  - Fast-day postponement rules (Shabbat → Sunday; Ta'anit Esther → Thursday).
  - Rosh Chodesh detection (incl. the 30th-of-month case).
  - **Parashat HaShavua** (`showParasha`) for every Shabbat, with combined-parasha logic (e.g. ויקהל-פקודי) and festival-Shabbat handling.
- **Shabbat highlighting** (`highlightShabbat`).
- **Keyboard navigation** with tooltips: arrow keys to move by day/week, `PageUp`/`PageDown` by month/year, `Home`/`End`, `Enter` to confirm, `Esc` to close.
- **Global configuration** via `setGlobalConfig()` — set defaults once (calendar system, highlighting, locale, labels) and every instance inherits them.
- **Framework wrappers**: Vue 3 (Nuxt-ready), React, Svelte and Angular — all built on one shared vanilla core. The core can also be used directly in plain JS.
- **Theming** through `--hdp-*` CSS variables, plus a built-in `.hdp-dark` theme.
- Full **RTL** layout and TypeScript types for the entire public API.

[1.0.0]: https://example.com/eli/hebrew-datepicker/releases/tag/v1.0.0
