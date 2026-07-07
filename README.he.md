<div align="center" dir="rtl">

# 🗓️ @simplix-systems/hebrew-date-picker

**בורר תאריכים עברי ולועזי — יפה, מלא ביכולות.**

לוח כפול · חגים · פרשת השבוע · בחירת טווח · קיצורי מקלדת · RTL

[**▶ הדגמה חיה**](https://simplix-systems.github.io/hebrew-date-picker/) · [English 🇬🇧](./README.md) · עובד עם **Vue · Nuxt · React · Svelte · Angular** · ללא תלויות זמן-ריצה

</div>

<div dir="rtl">

---

## ✨ יכולות

- **שני לוחות באחד** — מעבר בלחיצה בין תצוגה עברית (`עברי`) ולועזית (`לועזי`).
- **לוח עברי אמיתי** — שנים וימים בגימטריה (`תשפ״ו`, `ט״ו`), שנים מעוברות (`אדר א׳`/`אדר ב׳`), מבוסס על מנוע ה-`Intl` של הדפדפן/Node — ולכן **בלי תלויות** ובלי טבלאות נתונים לתחזק.
- **מצב טווח (range)** — שני חודשים זה לצד זה; בוחרים תאריך התחלה באחד ותאריך סיום בשני, ומקבלים טווח ממוין.
- **מצב חודשים בלבד** — להסתרת רשת הימים כשצריך לבחור רק חודש.
- **מצב שנים בלבד** — הצגת רשת השנים בלבד כשצריך לבחור רק שנה.
- **מועדים יהודיים** (תורניים/הלכתיים בלבד — *לעולם לא* חגי מדינה מודרניים):
  - הדגשת חגים עם טולטיפ (חנוכה, פורים, ט״ו בשבט, פסח, שבועות, סוכות, צומות…).
  - **פרשת השבוע** בכל שבת, כולל פרשיות מחוברות (כגון *ויקהל-פקודי*) וטיפול בשבתות שחלות בחג.
  - ראש חודש ודחיית צומות.
- **הדגשת שבתות**.
- **קיצורי מקלדת** עם טולטיפ על כל פקד.
- **קובץ הגדרות גלובלי** — מגדירים ברירות מחדל פעם אחת.
- **ניתן לעיצוב** דרך משתני CSS; כולל ערכת נושא כהה.
- טיפוסי **TypeScript** מלאים.

## 📦 התקנה

```bash
npm install @simplix-systems/hebrew-date-picker
```

ייבוא גיליון הסגנון פעם אחת, בכל מקום באפליקציה:

```js
import '@simplix-systems/hebrew-date-picker/style.css';
```

---

## 🚀 התחלה מהירה

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

> **ב-Nuxt:** הרכיב רץ בצד-לקוח בלבד. עוטפים ב-`<ClientOnly>` או רושמים אותו
> בפלאגין `~/plugins/hebrew-datepicker.client.ts` (ראו [הגדרות גלובליות](#️-הגדרות-גלובליות)).

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

### Angular (רכיב standalone)

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

מוסיפים `import '@simplix-systems/hebrew-date-picker/style.css';` לסגנונות הגלובליים, או ל-`angular.json` → `styles`.

### Web Component (ללא פריימוורק)

```html
<link rel="stylesheet" href="node_modules/@simplix-systems/hebrew-date-picker/dist/hebrew-datepicker.css" />
<script type="module">
  import '@simplix-systems/hebrew-date-picker/webcomponent'; // רושם את <hebrew-date-picker>
</script>

<hebrew-date-picker calendar="hebrew" show-parasha highlight-holidays></hebrew-date-picker>
<script>
  document.querySelector('hebrew-date-picker')
    .addEventListener('change', (e) => console.log(e.detail)); // { iso, type } או { start, end, type }
</script>
```

מאפיינים בוליאניים: `inline`, `highlight-shabbat`, `highlight-holidays`, `show-parasha`, `show-tooltips`, `diaspora`. עבור טווח או `labels` מותאם — קבעו את ה-`.value` / `.labels` כ-**properties** ב-JS. ראו `examples/demo.html` להדגמה מלאה.

**אין כלי build?** השתמשו בבנייה הגלובלית עם `<script>` רגיל (עובד גם מ-`file://`):

```html
<link rel="stylesheet" href="@simplix-systems/hebrew-date-picker/dist/hebrew-datepicker.css" />
<script src="@simplix-systems/hebrew-date-picker/dist/hebrew-datepicker.global.js"></script>
<hebrew-date-picker calendar="hebrew"></hebrew-date-picker>
<!-- window.HebrewDatePicker חושף גם DatePicker, setGlobalConfig וכו' -->
```

### JavaScript טהור (הליבה, ללא פריימוורק)

```js
import { DatePicker } from '@simplix-systems/hebrew-date-picker';
import '@simplix-systems/hebrew-date-picker/style.css';

// מוטמע (inline):
new DatePicker({ calendar: 'hebrew', showParasha: true,
  onSelect: (r) => console.log(r) }).mount(document.getElementById('cal'));

// או כחלונית קופצת מעוגנת לאינפוט:
const input = document.querySelector('#date-input');
input.addEventListener('click', () => {
  new DatePicker({ value: input.value, onSelect: (r) => (input.value = r.iso) }).open(input);
});
```

---

## ⚙️ אפשרויות / דגלים

כל אפשרות עובדת גם כ-prop (Vue/React/Svelte/Angular) וגם כאופציה ל-`DatePicker`.

| אפשרות | טיפוס | ברירת מחדל | תיאור |
| --- | --- | --- | --- |
| `calendar` | `'gregorian' \| 'hebrew'` | `'hebrew'` | הלוח הראשי/ברירת המחדל. |
| `mode` | `'single' \| 'range'` | `'single'` | תאריך בודד או טווח התחלה–סיום (שני לוחות). |
| `precision` | `'day' \| 'month' \| 'year'` | `'day'` | `'month'` מציג רק את רשת החודשים (בחירת חודשים בלבד); `'year'` מציג רק את רשת השנים (בחירת שנים בלבד). |
| `inline` | `boolean` | `true` (רכיב) | תצוגה מוטמעת, או חלונית קופצת. |
| `value` | `string \| { start, end } \| null` | `null` | ערך התחלתי. ISO `"YYYY-MM-DD"`; אובייקט במצב טווח. |
| `min` / `max` | `string \| null` | `null` | התאריך המוקדם/המאוחר ביותר לבחירה (ISO). |
| `highlightShabbat` | `boolean` | `true` | הדגשת שבתות. |
| `highlightHolidays` | `boolean` | `true` | סימון חגים תורניים + טולטיפ. |
| `showParasha` | `boolean` | `true` | הצגת פרשת השבוע בשבת. |
| `outsideDays` | `boolean` | `false` | הצגת ימי החודש הקודם/הבא בתוך הלוח (באפור, ניתנים לבחירה). |
| `lang` | `'he' \| 'en'` | `'he'` | שפת הממשק (תוויות + locale ברירת מחדל); `labels` עדיין גובר. |
| `seconds` | `boolean` | `false` | בחירת שניות גם (`"YYYY-MM-DDTHH:mm:ss"`). דורש `time`. |
| `rounded` | `boolean` | `false` | תאי ימים עגולים במקום מרובעים. |
| `clean` | `boolean` | `false` | עיצוב נקי בסגנון פילאמנט: תאים ללא מסגרת, הדגשת יום עגולה, גוונים אפורים וצבע primary. |
| `showTooltips` | `boolean` | `true` | טולטיפ של קיצורי מקלדת על הפקדים. |
| `diaspora` | `boolean` | `false` | מנהג חו״ל: 2 ימים טובים + פרשיות לפי חו״ל. |
| `displayCalendar` | `'hebrew' \| 'gregorian'` | `'hebrew'` | הלוח שיוצג ב-input לאחר הבחירה (מצב popup/input). |
| `time` | `boolean` | `false` | הוספת בורר שעה. הערך שמתקבל הופך ל-`"YYYY-MM-DDTHH:mm"` (לכל קצה בטווח). |
| `timeFormat` | `'12' \| '24'` | `'24'` | שעון 12 או 24 שעות. |
| `timeStyle` | `'native' \| 'dropdown' \| 'stepper' \| 'clock'` | `'dropdown'` | `native` = בורר השעה של המכשיר; `dropdown` = תפריטים; `stepper` = חצים ▲▼; `clock` = שעון אנלוגי. (`normal`→dropdown, `mobile`→clock עדיין נתמכים.) |
| `primaryColor` | `string` | — | צבע ההדגשה לכפתור האישור וליום הנבחר (כל צבע CSS). |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | ערכת צבע. `'auto'` עוקב אחרי העדפת מערכת ההפעלה/הדפדפן. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | גודל כללי של הבורר. |
| `compact` | `boolean` | `false` | תצוגה מינימלית: מסתיר תאריך משני, כותרת משנה ותצוגה מקדימה. |
| `closeOnSelect` | `boolean` | `true` | סגירת החלונית הקופצת בעת בחירת יום (מתעלם כש-`time` פעיל — אישור דרך הכפתור). |
| `labels` | `Partial<PickerLabels>` | — | דריסת כל טקסט גלוי (ראו למטה). |

**אירועים / קישור ערך**

- Vue: ‏`v-model` + ‏`@change="(result) => …"`.
- React: ‏`onChange={(value, result) => …}`.
- Svelte: ‏`bind:value` + ‏`on:change`.
- Angular: ‏`[(value)]` (וגם ‏`ControlValueAccessor`, כך שעובד עם ‏`formControlName`) + ‏`(change)`.

ה-**result** שמוחזר הוא `{ iso, type }` לתאריך בודד, או `{ start, end, type }` לטווח — כש-`type` הוא הלוח שהיה פעיל.

### דוגמה — חודשים בלבד

```html
<HebrewDatePicker v-model="month" precision="month" calendar="hebrew" />
```

### דוגמה — שנים בלבד

```html
<HebrewDatePicker v-model="year" precision="year" calendar="hebrew" />
```

`precision="year"` נפתח ישר לרשת השנים ומבצע בחירה מיד עם לחיצה על שנה (ה-`iso`
הוא היום הראשון של אותה שנה — 1 בינואר לגרגוריאני, א׳ בתשרי לעברי).

### דוגמה — טווח

```html
<HebrewDatePicker v-model="range" mode="range" />
<!-- range === { start: "2026-06-01", end: "2026-06-30" } -->
```

---

## ⌨️ קיצורי מקלדת

| מקש | רשת ימים | רשת חודשים | רשת שנים |
| --- | --- | --- | --- |
| `← / →` | ‎± יום | ‎± חודש | ‎± שנה |
| `↑ / ↓` | ‎± שבוע | ‎± שורה | ‎± שורה |
| `PageUp` / `PageDown` | ‎± חודש | ‎± שנה | ‎± בלוק 24 שנים |
| `Home` / `End` | תחילת/סוף החודש | ינואר/דצמבר (תשרי/אלול) | קצות הבלוק |
| `Enter` | אישור הבחירה | | |
| `Esc` | סגירת החלונית | | |

> הפריסה היא **RTL**, ולכן `→` עובר ליום ה*קודם* ו-`←` ליום ה*הבא* — בהתאם לכיוון הוויזואלי.

מעבר עכבר מעל חץ ניווט, גלולת חודש או גלולת שנה מציג טולטיפ עם היעד (למשל *"חודש הבא — ניסן (PgDn)"*).

---

## 🛠️ הגדרות גלובליות

מגדירים ברירות מחדל פעם אחת וכל בורר יורש אותן. props ברמת המופע תמיד גוברים.

```ts
import { setGlobalConfig } from '@simplix-systems/hebrew-date-picker';

setGlobalConfig({
  calendar: 'hebrew',        // לשונית ברירת מחדל בכל מקום
  highlightHolidays: true,
  highlightShabbat: true,
  showParasha: true,
  showTooltips: true,
  locale: 'he-IL',           // לשמות חודשים לועזיים ולתצוגה המקדימה
  labels: {                  // דריסת טקסטים
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

‏`getGlobalConfig()` מחזיר את ההגדרות הנוכחיות; ‏`resetGlobalConfig()` מאפס לברירות המחדל.

### טקסטים שניתן לדרוס

‏`gregorianTab`, `hebrewTab`, `today`, `clear`, `confirm`, `rangeStart`, `rangeEnd`, `pickMonth`, `pickYear`, `prevMonth`, `nextMonth`, `prevYear`, `nextYear`, `hebrewPreview`, `gregorianPreview`, `weekdays` (מערך של 7, ראשון תחילה).

---

## 🎨 עיצוב (Theming)

דורסים כל משתנה CSS על שורש `.hdp`, או מוסיפים את המחלקה `hdp-dark`.

```css
.hdp {
  --hdp-primary: #2563eb;
  --hdp-radius: 16px;
  --hdp-shabbat-bg: #fff7ed;
  --hdp-holiday: #b91c1c;
}
```

| משתנה | תפקיד |
| --- | --- |
| `--hdp-primary` / `--hdp-primary-soft` | צבע הדגשה + ריחוף/בחירה |
| `--hdp-bg` / `--hdp-text` / `--hdp-muted` | צבעי משטח וטקסט |
| `--hdp-border` | מסגרות |
| `--hdp-today` | מסגרת "היום" |
| `--hdp-shabbat-bg` | רקע יום שבת |
| `--hdp-holiday` | צבע טקסט/סימון חג |
| `--hdp-radius` / `--hdp-radius-sm` | עיגול פינות |
| `--hdp-row-h` | גובה שורה בלוח הימים (כ-50px ב-`md`); רשת החודשים/השנים נגזרת ממנו כדי שגובה החלון יישאר יציב. |

---

## 💡 שימושים (Use cases)

- **טפסים בתאריך עברי** — יארצייטים, ברית/בר-מצווה, ימי שנה לפי תאריך עברי.
- **אפליקציות קהילה/בית כנסת** — להציג פרשה וחגים ישירות בבורר.
- **טווחי הזמנות/דוחות** — בחירת טווח תאריכים עברי או לועזי בשני לוחות.
- **בוררי חודשים** — תקציבים או דוחות חודשיים (`precision="month"`).
- **בוררי שנים** — סיכומים שנתיים או בוררי שנה עברית (`precision="year"`).
- **מוצרים דו-לשוניים** — לתת לכל משתמש ברירת מחדל ללוח שבו הוא חושב, דרך ההגדרות הגלובליות.

---

## 🧠 שימוש ישיר במנוע הלוח

הליבה מייצאת את פונקציות הלוח, נוח לבניית ממשקים מותאמים:

```ts
import {
  gregToHebParts, hebToGreg, getMonthsForYear,
  hebYearGematria, hebDayGematria,
  getDayEvents, getParasha, getHoliday
} from '@simplix-systems/hebrew-date-picker';

gregToHebParts(new Date(2026, 5, 16)); // { year: 5786, month: 'Sivan', day: ... }
hebYearGematria(5786);                 // "תשפ״ו"
getParasha(new Date('2026-06-13'));    // פרשת השבוע לאותה שבת (או null)
```

---

## 📅 הערה על דיוק

הלוח העברי מחושב ממנוע ה-`Intl` של הסביבה, כך שההמרות תואמות את נתוני ה-Unicode של הסביבה. לוגיקת החגים והפרשות נוהגת כברירת מחדל כמנהג **ארץ ישראל** (יום-טוב אחד; שמיני עצרת = שמחת תורה בכ״ב תשרי). עם `diaspora: true` מתקבל מחזור חו״ל (2 ימים טובים ופרשיות חו״ל). החבילה כוללת בדיקות (`npm test`) המאמתות המרות הלוך-ושוב, שנים מעוברות, ושיבוץ פרשות לאורך שנים רבות.

## 📄 רישיון

MIT © Eli

</div>
