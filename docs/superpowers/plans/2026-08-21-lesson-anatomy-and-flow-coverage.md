# אנטומיית מסך השיעור + כיסוי הארנס לשתי לשוניות — תוכנית מימוש

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לבנות את `<LessonScreen>` כמבנה טהור מונע-פרופים עם שתי פיקסטורות נמדדות (T-089), ולהרחיב את `check:mobile` כך ששתי לשוניות הפיקסטורה `/dev/tabs/studies` ו-`/dev/tabs/cards` נמדדות בשלוש הבדיקות של F-027 ובנחיתת ההקשה (T-091) — **⛔ בלי להחליש ולו בדיקה אחת קיימת**.

**Architecture:** ‏`<LessonScreen>` הוא רכיב **חסר-מצב** שכל מחרוזת גלויה בו מגיעה כפרופ, ולכן ⛔ אין בו ולו תו עברי אחד ו⛔ אין בו תוכן לימודי — בדיוק כמו `<StudiesScreen>` שמקבל `headline` ו-`<LevelScan>` שמקבל `initialWords`. שני מסלולי פיקסטורה (`/dev/lesson` · `/dev/lesson/done`) מרנדרים את שני מצבי ה-`phase`, בתקדים המדויק של `/dev/deck` ו-`/dev/deck/done`. בצד הארנס, בלוק בדיקות F-027 נחתך מ-`FLOW_ROUTES` לרשימה חדשה `PRIMARY_ACTION_ROUTES`, כי הבדיקה `no tab bar on a flow screen` — שיושבת באותו בלוק — **מובטחת ליפול** על כל מסלול לשונית (ראה «הסתירה הנמדדת» למטה).

**Tech Stack:** Next.js App Router · React Server Components · TypeScript (⛔ ללא `any`) · Tailwind · vitest (סביבת node, ⛔ אין jsdom ⇒ בדיקות **שומר מקור** ולא רינדור) · Playwright דרך `scripts/verify-mobile.mjs`.

**Spec:**

- `plan/40-decisions.md` § 4.2ט (‏T-089 · T-090 · תוכנית ה-UX)
- `plan/50-tasks.md` שורות T-089 · T-091
- `plan/35-design-constitution.md` (§ 1 צבע · § 2 טיפוגרפיה · § 4 מרווחים)
- `plan/60-findings.md` — F-027 (שלוש סיבות המבוי הסתום) · F-098 · F-099 (נפתחו בטיק התכנון הזה)

---

## Global Constraints

הדרישות האלה חלות על **כל** משימה בתוכנית. ערכים מדויקים, מועתקים מהמקור:

- **גופנים:** Heebo (כותרות) · Assistant (גוף) · Noto Sans Hebrew (גיבוי). ⛔ אסורים: Inter · Roboto · Open Sans · Geist · Clash Display · PP Editorial New · Comic Neue · Baloo 2 (חוקה § 2).
- **רדיוסים — שלושה בלבד:** `rounded-md` שדות ותגיות · `rounded-lg` כפתורים · `rounded-2xl` כרטיסיות (חוקה § 3).
- **⛔ `justify-center` על מכולת עמוד ראשית — אסור.** עיגון למעלה. זה F-011 והוא חזר כ-F-016 (חוקה § 4).
- **⛔ `h-screen` אסור** — `min-h-[100dvh]` בלבד. **⛔ אפס גלילה אופקית ב-375px.** יעד מגע ≥ **44px** (חוקה § 4).
- **⛔ ערך hex גולמי בתוך `components/`** — הכל דרך אסימוני `lib/core/palette.ts`. ⛔ אמוג׳י כאייקון. ⛔ גרדיאנט סגול/אינדיגו (חוקה § 6).
- **⛔ צבע לעולם אינו הערוץ היחיד** — כל בקרה נושאת גם תווית עברית (חוקה § 1).
- **כל מילה אנגלית בתוך טקסט עברי עוברת דרך `<EnWord>` או `<EnText>`** — המקום היחיד שכותב `lang="en"` (חוקה § 2, `components/EnWord.tsx`).
- **⛔ אסור להמציא תוכן לימודי.** ⛔ אסור לצטט, לתרגם או לפרפרז ולו שורה אחת ממאל"ו — **גם לא בפיקסטורה** (R-010 · R-018 · `RULES § 0.1.2 ו׳`).
- **⛔ אסור להחליש בדיקה קיימת** כדי להעביר מסך. בדיקה שנופלת = ממצא, ⛔ לא הזדמנות לרכך תנאי.
- **⛔ `/lib/core` טהור** — אפס React/window/document/localStorage/fetch/process.env. (התוכנית הזו ⛔ אינה נוגעת ב-`lib/core` בכלל.)
- **פקודת האימות המלאה, בכל משימה:** `npm run typecheck && npm run check:core && npm test && npm run build` ולאחריה `npm run check:mobile` בכל משימה שנוגעת בארנס או בפיקסטורה.

---

## Two measured facts this plan rests on

שתי עובדות נמדדו בטיק התכנון מהמקור עצמו, ⛔ ולא הונחו:

### א׳ · הסתירה: מסלול לשונית ⛔ אינו יכול להיכנס ל-`FLOW_ROUTES` כפי שהוא

`scripts/verify-mobile.mjs` — בתוך `if (FLOW_ROUTES.includes(route)) { … }` יושבת גם השורה:

```js
const strayTabBar = await page.evaluate(() => document.querySelectorAll('[data-tab-bar]').length);
check(strayTabBar === 0, `${at} no tab bar on a flow screen`, `found ${strayTabBar}`);
```

`app/dev/tabs/studies/page.tsx` ו-`app/dev/tabs/cards/page.tsx` מרנדרים שניהם `<TabBar />`, ו-`components/TabBar.tsx:167` נושא `data-tab-bar="true"`. במקביל `TAB_ROUTES` **דורש** שהסרגל יהיה שם (`check(tabs.present, …)`). ⇒ הוספה נאיבית של שני המסלולים ל-`FLOW_ROUTES` מפילה `no tab bar on a flow screen` **בוודאות, בשלושת הרוחבים** — שש נפילות — ומעמידה את המבצע בפני הפיתוי להחליש בדיקה. **⛔ אין להחליש אותה.** הפתרון בתוכנית הזו הוא **חיתוך**, ⛔ ולא ריכוך: בלוק F-027 עובר ל-`PRIMARY_ACTION_ROUTES`, ובדיקת סרגל-הלשוניות-התועה נשארת קשורה ל-`FLOW_ROUTES` בלבד. זה **מרחיב** כיסוי ו⛔ אינו מוותר על דבר. נרשם כ-**F-098**.

### ב׳ · `FLOW_ARRIVAL` ⛔ אינו תלוי ב-`FLOW_ROUTES`

באותו קובץ, לולאת הנחיתה נכתבה כ-`const arrival = FLOW_ARRIVAL[route]` — **ללא** תנאי חברות ב-`FLOW_ROUTES`. ⇒ «יעד נקוב לכל אחד» שבשורת T-091 ניתן לאספקה דרך `FLOW_ARRIVAL` לבדו, ובלי קשר להכרעת חלק א׳.

---

## File Structure

| קובץ | אחריות | משימה |
|---|---|---|
| `components/LessonScreen.tsx` | **חדש.** ארבעת הבלוקים של § 4.2ט כמבנה חסר-מצב. מייצא `LessonItem` · `LessonChoice` · `LessonPhase` · `LESSON_MAX_ITEMS` · `LESSON_EXIT_HREF`. | 1 |
| `components/LessonScreen.test.ts` | **חדש.** שומר מקור: אפס עברית · אפס תוכן · ארבעה בלוקים · מכסת 3 · עיגון למעלה · `<EnText>`. | 1 |
| `app/dev/lesson/page.tsx` | **חדש.** פיקסטורת פריסה, `phase="items"`, שלושה פריטים. ⛔ אינה מסך מוצר. | 2 |
| `app/dev/lesson/done/page.tsx` | **חדש.** אותה פיקסטורה, `phase="done"` — הבלוק ⓓ ⛔ אינו נגיש מהמסלול שמעליו. | 2 |
| `scripts/verify-mobile.mjs` | **שינוי.** ⓐ שני מסלולי `/dev/lesson*` ל-`ROUTES` (משימה 2) · ⓑ `PRIMARY_ACTION_ROUTES` (משימה 3) · ⓒ שתי רשומות `FLOW_ARRIVAL` + רשומת `EXPECTED_CONSOLE` (משימה 4). | 2·3·4 |
| `scripts/verify-mobile.test.ts` | **שינוי.** שומר מקור לכל אחד משלושת השינויים לעיל. | 2·3·4 |

---

### Task 1: `<LessonScreen>` — ארבעת הבלוקים, מבנה בלבד

**Files:**

- Create: `components/LessonScreen.tsx`
- Test: `components/LessonScreen.test.ts`

**Interfaces:**

- Consumes: `EnText` ו-`EnTextSegment` מ-`components/EnWord.tsx` (קיימים, ⛔ אין לשנותם).
- Produces — החתימות המדויקות שמשימה 2 מייבאת:

```ts
export interface LessonChoice {
  readonly id: string;
  /** האפשרות עצמה. אנגלית ⇒ עוברת דרך <EnWord>. */
  readonly text: string;
  /** המשפט העברי «למה המסיח הזה מפתה» (§ 4.2ט שאלה 3). ⛔ אף פעם לא null בפיקסטורה. */
  readonly why: string;
}

export interface LessonItem {
  readonly id: string;
  /** משפט התרגול, מקוטע לפי היסטים — התקדים הוא exampleSegments של buildCard. */
  readonly prompt: readonly EnTextSegment[];
  readonly choices: readonly LessonChoice[];
}

export type LessonPhase = 'items' | 'done';

export interface LessonScreenProps {
  readonly questionTypeTitle: string;
  readonly explanation: string;
  readonly items: readonly LessonItem[];
  readonly phase: LessonPhase;
  readonly doneTitle: string;
  readonly doneExitLabel: string;
}

export const LESSON_MAX_ITEMS = 3;
export const LESSON_EXIT_HREF = '/studies';

export default function LessonScreen(props: LessonScreenProps): React.JSX.Element;
```

**למה כל מחרוזת היא פרופ, וזו ⛔ לא העדפה:** שורת T-089 אומרת «הפריטים מגיעים כפרופ מטבלאות התוכן ו⛔ אינם מוקשחים בקוד — מסך שמכיל תוכן לימודי בקוד הוא בדיוק ההפרה שמדור 2 קיים כדי למנוע». מחרוזת עברית **אחת** בקובץ הזה הופכת את הבדיקה בצעד 1 מטענה חדה לטענה שצריך לנמק בכל טיק. הכלל «אפס תו עברי בקובץ» הוא הניסוח היחיד של הדרישה הזאת שמכונה יכולה לאכוף.

**⛔ מה שהמשימה הזאת ⛔ אינה בונה, וזה מוצהר ⛔ ולא מוסתר:** ⛔ אין מעבר בין `items` ל-`done` · ⛔ אין סימון תשובה · ⛔ אין ניקוד · ⛔ אין «הבא». `phase` הוא **פרופ** ⛔ ולא מצב, כי «מה מקדם את הלומד מ-ⓒ ל-ⓓ» הוא החלטת מסך של ה-PM ו-§ 4.2ט שותקת בה. הפער נרשם כ-**F-099** ו⛔ לא הומצא כאן.

- [ ] **Step 1: Write the failing test**

צור `components/LessonScreen.test.ts` עם התוכן הבא **במלואו**:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * ‏T-089 · § 4.2ט — אנטומיית מסך השיעור. **מבנה בלבד, אפס תוכן.**
 *
 * שומר מקור ו⛔ לא בדיקת רינדור: סביבת vitest היא node ו-jsdom ⛔ אינו מותקן
 * במכוון (`vitest.config.ts`). גאומטריה היא עבודתו של `check:mobile`, דרך שתי
 * הפיקסטורות `/dev/lesson` ו-`/dev/lesson/done` (משימה 2).
 */
const SRC = readFileSync('components/LessonScreen.tsx', 'utf8');

/** C-0032/C-0071/C-0072: שומר שהערה יכולה לספק ⛔ אינו שומר. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<LessonScreen> — ארבעת הבלוקים של § 4.2ט (T-089)', () => {
  /**
   * ⛔ הטענה החזקה של המשימה כולה: **אפס תו עברי בקוד**. כל מחרוזת גלויה
   * מגיעה כפרופ, ולכן תוכן לימודי ⛔ אינו יכול להתיישב כאן — גם לא «רק
   * ככותרת», גם לא «רק בפיקסטורה שהועתקה פנימה».
   */
  it('⛔ אינו מחזיק ולו תו עברי אחד — כל מחרוזת גלויה היא פרופ', () => {
    const hebrew = CODE.match(/[֐-׿]/g) ?? [];
    expect(hebrew.join(''), 'Hebrew literal in the component = product copy Dev does not write').toBe('');
  });

  it('מרנדר את ארבעת הבלוקים, כל אחד מסומן כדי שהארנס ימצא אותו', () => {
    expect(CODE).toContain('data-lesson-type');
    expect(CODE).toContain('data-lesson-explanation');
    expect(CODE).toContain('data-lesson-items');
    expect(CODE).toContain('data-lesson-done');
  });

  it('מקבל את ששת הפרופים בשמם ו⛔ אינו גוזר אף אחד מהם', () => {
    for (const prop of [
      'questionTypeTitle',
      'explanation',
      'items',
      'phase',
      'doneTitle',
      'doneExitLabel',
    ]) {
      expect(CODE, `${prop} is not read`).toContain(prop);
    }
    // ⛔ אפס שעון, אפס אקראיות, אפס קריאת רשת — הרכיב הוא פונקציה של הפרופים שלו.
    expect(CODE).not.toContain('new Date');
    expect(CODE).not.toContain('Math.random');
    expect(CODE).not.toContain('fetch(');
    expect(CODE).not.toContain('apiGet');
  });

  /**
   * «1–3 פריטי תרגול» היא מכסה, ⛔ לא הצעה. החיתוך נעשה על הקבוע המיוצא ⛔ ולא
   * על ליטרל: ליטרל הוא עותק שני של אותו מספר שיכול לסחוף ממנו בשקט (התקדים
   * הוא INSTITUTION_MAX_LENGTH ב-C-0081).
   */
  it('חותך את הפריטים ב-LESSON_MAX_ITEMS ⛔ ולא בליטרל', () => {
    expect(CODE).toContain('export const LESSON_MAX_ITEMS = 3');
    expect(CODE).toMatch(/items\.slice\(0,\s*LESSON_MAX_ITEMS\)/);
    expect(CODE).not.toMatch(/items\.slice\(0,\s*3\)/);
  });

  it('מעביר כל אנגלית דרך העטיפה היחידה שכותבת lang=en (חוקה § 2)', () => {
    expect(CODE).toContain('EnText');
    expect(CODE).toContain('EnWord');
    expect(CODE).not.toContain('lang="en"');
    expect(CODE).not.toContain('dir="ltr"');
  });

  /**
   * ⓓ הוא בלוק ולא מסך שני, ו-`phase` הוא פרופ ולא מצב: המעבר בין השניים הוא
   * החלטת מסך של ה-PM ש-§ 4.2ט שותקת בה (F-099). ⛔ אין להמציא אותו כאן.
   */
  it('מפריד את שני המצבים על הפרופ phase ⛔ ואינו מחזיק מצב משלו', () => {
    expect(CODE).toMatch(/phase === 'done'/);
    expect(CODE).toMatch(/phase === 'items'/);
    expect(CODE).not.toContain('useState');
    expect(CODE).not.toContain('onClick');
    expect(CODE).not.toContain("'use client'");
  });

  it('יוצא ל-לשונית לימודים דרך קבוע מיוצא (§ 4.2ט שאלה 6)', () => {
    expect(CODE).toContain("export const LESSON_EXIT_HREF = '/studies'");
    expect(CODE).toContain('href={LESSON_EXIT_HREF}');
  });

  /**
   * ⛔ `/dev/lesson` ⛔ אינו ב-FLOW_ROUTES ואינו ב-PRIMARY_ACTION_ROUTES, ולכן
   * איש אינו מודד «בדיוק סימון אחד למסך» כאן. סימון שאיש אינו מודד הוא סימון
   * שיסחף — התקדים המדויק הוא `<AppGrid>` (C-0200).
   */
  it('⛔ אפס data-primary-action ו⛔ אפס ActionBar', () => {
    expect(CODE).not.toContain('data-primary-action');
    expect(CODE).not.toContain('ActionBar');
  });

  it('מעגן את העמודה למעלה ⛔ ולעולם אינו ממרכז אותה (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ אינו טוען טענת מוכנות או ציון (4.4.3 · R-002)', () => {
    for (const forbidden of ['%', 'score', 'readiness']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  it('מחזיק בדיוק כותרת h1 אחת — היררכיית כותרות לקורא מסך', () => {
    expect((CODE.match(/<h1/g) ?? []).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails for the right reason**

```bash
npx vitest run components/LessonScreen.test.ts
```

צפוי: **FAIL** — ‏`ENOENT: no such file or directory, open 'components/LessonScreen.tsx'`. ⛔ אם הוא נופל מסיבה אחרת, עצור: הבדיקה לא מודדת את מה שהיא מתיימרת.

- [ ] **Step 3: Write the component**

צור `components/LessonScreen.tsx`:

```tsx
/**
 * ‏T-089 · § 4.2ט — אנטומיית מסך השיעור. ⛔ מבנה בלבד, ⛔ אפס תוכן לימודי.
 *
 * ארבעה בלוקים, בסדר ש-§ 4.2ט קובעת: ⓐ כותרת סוג השאלה ⓑ הסבר בעברית
 * ⓒ 1–3 פריטי תרגול ⓓ מסך הסיום.
 *
 * ⛔ אין בקובץ הזה ולו תו עברי אחד, וזו הדרישה ⛔ ולא סגנון: שורת T-089 קובעת
 * שהפריטים מגיעים כפרופ מטבלאות התוכן ו⛔ אינם מוקשחים בקוד. כותרת עברית אחת
 * שנשתלת כאן היא בדיוק תוכן לימודי בקוד, וזו ההפרה שמדור 2 קיים כדי למנוע.
 * הבדיקה שלצד הקובץ אוכפת «אפס תו עברי», כי זה הניסוח היחיד שמכונה יכולה למדוד.
 *
 * ⛔ הרכיב חסר מצב לגמרי: `phase` הוא פרופ ⛔ ולא `useState`. מה שמקדם את
 * הלומד מ-ⓒ ל-ⓓ — סימון תשובה, «הבא», ניקוד — ⛔ אינו בשום מקום ב-§ 4.2ט,
 * והמצאתו כאן הייתה החלטת מסך שאינה בסמכות Dev. נרשם כ-F-099.
 *
 * ⛔ אינו `'use client'`: אין כאן מצב ואין מטפל אירועים — אותו נימוק בדיוק
 * כמו `<EnWord>`.
 */
import Link from 'next/link';
import EnWord, { EnText, type EnTextSegment } from '@/components/EnWord';

export interface LessonChoice {
  readonly id: string;
  /** האפשרות עצמה — אנגלית, ולכן היא עוברת דרך <EnWord>. */
  readonly text: string;
  /**
   * המשפט העברי «למה המסיח הזה מפתה». § 4.2ט שאלה 3: «טעות מציגה **למה**
   * המסיח מפתה — זה כל השיעור». ⛔ מתי הוא נחשף הוא החלטת מסך שאין לה מקור
   * (F-099); כאן הוא **נוכח תמיד**, כי מבנה שמסתיר שדה אינו מבנה שנמדד.
   */
  readonly why: string;
}

export interface LessonItem {
  readonly id: string;
  /**
   * משפט התרגול, מקוטע. התקדים הוא `exampleSegments` של `buildCard`: מי שמפצל
   * לפי רווחים במקום לפי היסטים מרנדר מילים דבוקות על מסך הלומד (TD-11).
   */
  readonly prompt: readonly EnTextSegment[];
  readonly choices: readonly LessonChoice[];
}

export type LessonPhase = 'items' | 'done';

export interface LessonScreenProps {
  readonly questionTypeTitle: string;
  readonly explanation: string;
  readonly items: readonly LessonItem[];
  readonly phase: LessonPhase;
  readonly doneTitle: string;
  readonly doneExitLabel: string;
}

/** § 4.2ט: «1–3 פריטי תרגול». מכסה, ⛔ לא הצעה. */
export const LESSON_MAX_ITEMS = 3;

/** § 4.2ט שאלה 6: «מגיעים מלשונית לימודים, יוצאים במסך הסיום». */
export const LESSON_EXIT_HREF = '/studies';

export default function LessonScreen({
  questionTypeTitle,
  explanation,
  items,
  phase,
  doneTitle,
  doneExitLabel,
}: LessonScreenProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-6">
      {/* ⓐ — הכותרת היחידה של המסך. שתי h1 על מסך אחד שוברות את היררכיית
          הכותרות לקורא מסך. */}
      <h1 data-lesson-type className="text-3xl font-bold leading-tight">
        {questionTypeTitle}
      </h1>

      {phase === 'items' ? (
        <>
          {/* ⓑ — ההסבר. `leading-relaxed` ⛔ ולא גופן גדול יותר: החוקה קפואה
              על סולם הטיפוגרפיה, וריפוד הוא הערוץ שנשאר. */}
          <p data-lesson-explanation className="text-lg leading-relaxed text-ink">
            {explanation}
          </p>

          {/* ⓒ — 1–3 פריטים. החיתוך על הקבוע ⛔ ולא על ליטרל. */}
          <ul data-lesson-items className="flex list-none flex-col gap-6 p-0">
            {items.slice(0, LESSON_MAX_ITEMS).map((item) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border-subtle p-4">
                <EnText segments={item.prompt} className="text-lg leading-relaxed" />
                <ul className="flex list-none flex-col gap-2 p-0">
                  {item.choices.map((choice) => (
                    <li key={choice.id} className="flex flex-col gap-1">
                      <EnWord className="text-lg">{choice.text}</EnWord>
                      <span className="text-base leading-relaxed text-ink-muted">{choice.why}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {phase === 'done' ? (
        // ⓓ — מסך הסיום, כבלוק ⛔ ולא כמסלול שני. היציאה היא קישור אחד,
        // ⛔ בלי `data-primary-action`: המסלול ⛔ אינו ב-PRIMARY_ACTION_ROUTES,
        // וסימון שאיש אינו מודד הוא סימון שיסחף (התקדים: <AppGrid>, C-0200).
        <div data-lesson-done className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold leading-tight">{doneTitle}</h2>
          <Link
            href={LESSON_EXIT_HREF}
            className="flex min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
          >
            {doneExitLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
npx vitest run components/LessonScreen.test.ts
```

צפוי: **PASS**, ‏11 בדיקות.

- [ ] **Step 5: Run three mutations and record that each kills a test BY NAME**

⛔ אל תדלג. בדיקה שלא נמדדה מול מוטציה היא טענה, ⛔ לא שומר. הרץ כל אחת, רשום את **שם** הבדיקה שנפלה, ושחזר את הקובץ:

1. החלף את `{questionTypeTitle}` במחרוזת עברית קשיחה ⇒ חייבת ליפול **«⛔ אינו מחזיק ולו תו עברי אחד»**.
2. החלף `items.slice(0, LESSON_MAX_ITEMS)` ב-`items.slice(0, 3)` ⇒ חייבת ליפול **«חותך את הפריטים ב-LESSON_MAX_ITEMS»**.
3. החלף `<EnText segments={item.prompt} …/>` ב-`<span lang="en" dir="ltr">` ידני ⇒ חייבת ליפול **«מעביר כל אנגלית דרך העטיפה היחידה»**.

- [ ] **Step 6: Full verification**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

צפוי: `tsc` **0** שגיאות · `/lib/core purity: OK` · ספירת הבדיקות **+11** מהבסיס · `next build` יוצא **0**.

- [ ] **Step 7: Commit**

```bash
git add components/LessonScreen.tsx components/LessonScreen.test.ts
git commit -m "loop(DEV): T-089 <LessonScreen> anatomy — four blocks, zero content"
```

---

### Task 2: שתי פיקסטורות `/dev/lesson` ו-`/dev/lesson/done`, ונמדדות

**Files:**

- Create: `app/dev/lesson/page.tsx`
- Create: `app/dev/lesson/done/page.tsx`
- Modify: `scripts/verify-mobile.mjs` — מערך `ROUTES` (‏`scripts/verify-mobile.mjs:25-124`)
- Test: `scripts/verify-mobile.test.ts` (הוספת בלוק `describe`)

**Interfaces:**

- Consumes ממשימה 1: `LessonScreen` (ברירת מחדל) · `LessonItem` · `LessonScreenProps`.
- Produces: שני מסלולים במערך `ROUTES` שכל המדידות הגנריות (אפס גלילה אופקית · `dir=rtl` · `lang=he` · 44px · קונסולה נקייה) רצות עליהם בשלושת הרוחבים 320/375/414.

**⚠️ למה שתי פיקסטורות ו⛔ לא אחת:** `phase` הוא פרופ, ולכן בלוק ⓓ ⛔ אינו נגיש מהמסלול של ⓒ. התקדים המדויק בריפו הוא `/dev/deck` מול `/dev/deck/done` — «מסך הסיום ⛔ אינו נגיש דרך המסלול שמעליו, ולכן הפיקסטורה מרנדרת אותו ישירות».

**⛔ מחרוזות הפיקסטורה ⛔ אינן תוכן לימודי.** האנגלית היא מילות פריסה ניטרליות; העברית היא תוויות מבנה. ⛔ אין בהן ולו הד אחד למאל"ו (R-018), ⛔ אין הסבר דקדוקי אמיתי, ⛔ ואין «נכון/לא נכון».

- [ ] **Step 1: Write the failing harness guard**

הוסף לסוף `scripts/verify-mobile.test.ts`:

```ts
/**
 * ‏T-089 — בלי שתי השורות האלה בארנס, אנטומיית מסך השיעור ⛔ מעולם לא נמדדת
 * ב-320/375/414, והטענה «אפס גלילה אופקית» עליה היא הצהרה ⛔ ולא מדידה.
 */
describe('the lesson anatomy is measured at all three widths (T-089)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('names both lesson fixtures in ROUTES', () => {
    expect(source).toContain("'/dev/lesson',");
    expect(source).toContain("'/dev/lesson/done',");
  });

  /**
   * ⛔ אין להן רשומת EXPECTED_CONSOLE, וזה השקט שמוכיח שהן מקבלות את הפריטים
   * כ-prop ו⛔ אינן מבקשות מהשרת דבר. רשומה שתופיע כאן מאוחר יותר פירושה
   * שהפיקסטורה התחילה לרשת — כלומר שהמדידה חזרה בשקט למסך הכשל.
   */
  it('⛔ grants them no console allowance — they request nothing', () => {
    const expected = source.slice(source.indexOf('const EXPECTED_CONSOLE'));
    expect(expected).not.toContain('/dev/lesson');
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

```bash
npx vitest run scripts/verify-mobile.test.ts
```

צפוי: **FAIL** על `names both lesson fixtures in ROUTES`. הבדיקה השנייה **עוברת** כבר עכשיו — היא רַצֶ׳ט, ⛔ ולא טענה על שינוי.

- [ ] **Step 3: Create the two fixtures**

`app/dev/lesson/page.tsx`:

```tsx
import LessonScreen, { type LessonItem } from '@/components/LessonScreen';

/**
 * פיקסטורת פריסה ל-`check:mobile`. ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * ⚠️ **בלי הפיקסטורה האנטומיה לעולם אינה נמדדת:** אין עדיין מסלול מוצר לשיעור
 * (T-090 חסומה ב-R-018), ולכן `<LessonScreen>` ⛔ אינו מרונדר בשום מקום שהארנס
 * מגיע אליו. הפיקסטורה מקבלת את הפריטים כ-prop ו⛔ אינה מבקשת מהשרת דבר ⇒
 * ⛔ אין לה רשומה ב-`EXPECTED_CONSOLE`, והשקט הזה הוא ההוכחה.
 *
 * ⛔ **המחרוזות כאן ⛔ אינן תוכן לימודי.** האנגלית היא מילות פריסה, העברית היא
 * תוויות מבנה. ⛔ אין כאן ולו הד אחד לפריט, לניסוח או להסבר של מאל"ו (R-018),
 * ⛔ ואין טענה דקדוקית שאיש לא מדד — «דוגמה א׳» ⛔ אינו כלל לשוני.
 */
const ITEMS: readonly LessonItem[] = [
  {
    id: 'fixture-1',
    prompt: [
      { text: 'The ', isTarget: false },
      { text: 'report', isTarget: true },
      { text: ' was finished on time.', isTarget: false },
    ],
    choices: [
      { id: 'fixture-1-a', text: 'summary', why: 'אפשרות ראשונה — טקסט פריסה' },
      { id: 'fixture-1-b', text: 'document', why: 'אפשרות שנייה — טקסט פריסה' },
      { id: 'fixture-1-c', text: 'schedule', why: 'אפשרות שלישית — טקסט פריסה' },
    ],
  },
  {
    id: 'fixture-2',
    prompt: [
      { text: 'She ', isTarget: false },
      { text: 'decided', isTarget: true },
      { text: ' to wait for the second answer.', isTarget: false },
    ],
    choices: [
      { id: 'fixture-2-a', text: 'agreed', why: 'אפשרות ראשונה — טקסט פריסה' },
      { id: 'fixture-2-b', text: 'refused', why: 'אפשרות שנייה — טקסט פריסה' },
      { id: 'fixture-2-c', text: 'continued', why: 'אפשרות שלישית — טקסט פריסה' },
    ],
  },
  {
    id: 'fixture-3',
    prompt: [
      { text: 'Most of the members ', isTarget: false },
      { text: 'agreed', isTarget: true },
      { text: ' with the plan.', isTarget: false },
    ],
    choices: [
      { id: 'fixture-3-a', text: 'all', why: 'אפשרות ראשונה — טקסט פריסה' },
      { id: 'fixture-3-b', text: 'some', why: 'אפשרות שנייה — טקסט פריסה' },
      { id: 'fixture-3-c', text: 'none', why: 'אפשרות שלישית — טקסט פריסה' },
    ],
  },
];

export default function DevLessonPage() {
  return (
    <LessonScreen
      questionTypeTitle="כותרת סוג השאלה"
      explanation="פסקת הסבר לבדיקת פריסה. השורה הזאת קיימת כדי שהבלוק יקבל גובה אמיתי בשלושת הרוחבים, ⛔ ואינה טענה לשונית."
      items={ITEMS}
      phase="items"
      doneTitle="כותרת הסיום"
      doneExitLabel="חזרה ללימודים"
    />
  );
}
```

`app/dev/lesson/done/page.tsx`:

```tsx
import LessonScreen from '@/components/LessonScreen';

/**
 * פיקסטורת פריסה ל-`check:mobile`, ואותו נימוק בדיוק כמו `/dev/deck/done`:
 * `phase` הוא פרופ, ולכן בלוק הסיום ⛔ אינו נגיש מ-`/dev/lesson` — הפיקסטורה
 * מרנדרת אותו ישירות. ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * `items` ריק במכוון: הבלוק הזה ⛔ אינו מציג פריטים, ופיקסטורה שממלאת אותם
 * הייתה מודדת מסך שהמוצר לעולם אינו מצייר.
 */
export default function DevLessonDonePage() {
  return (
    <LessonScreen
      questionTypeTitle="כותרת סוג השאלה"
      explanation="⛔ אינו מוצג במצב הזה."
      items={[]}
      phase="done"
      doneTitle="כותרת הסיום"
      doneExitLabel="חזרה ללימודים"
    />
  );
}
```

- [ ] **Step 4: Add both routes to `ROUTES`**

ב-`scripts/verify-mobile.mjs`, **מיד אחרי** השורה `'/dev/deck/skeleton',` הוסף:

```js
  // T-089 · § 4.2ט — אנטומיית מסך השיעור. ⛔ אין עדיין מסלול מוצר: T-090 (התוכן)
  // חסומה ב-R-018, ולכן `<LessonScreen>` ⛔ אינו מרונדר בשום מקום שהארנס מגיע
  // אליו, וכל טענה על 320/375/414 עליו הייתה הצהרה. שתי שורות ו⛔ לא אחת, מאותו
  // נימוק בדיוק כמו `/dev/deck` מול `/dev/deck/done`: `phase` הוא prop, ולכן בלוק
  // הסיום ⛔ אינו נגיש מהמסלול שמעליו. שתיהן מקבלות את הפריטים כ-prop ואינן
  // מבקשות מהשרת דבר ⇒ ⛔ אין להן רשומה ב-EXPECTED_CONSOLE.
  '/dev/lesson',
  '/dev/lesson/done',
```

- [ ] **Step 5: Run the guard and verify it passes**

```bash
npx vitest run scripts/verify-mobile.test.ts
```

צפוי: **PASS**.

- [ ] **Step 6: Full verification including the browser harness**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```

צפוי: `check:mobile` מסיים **ok**, ו**ספירת הבדיקות שלו עולה** מול הבסיס (שתי שורות × שלושה רוחבים × הבדיקות הגנריות). ⛔ רשום את המספר הישן ואת החדש בדיווח — «עבר» בלי מספר ⛔ אינו ראיה שהשורות באמת נמדדו.

⚠️ **אם `no horizontal scroll` נופל ב-320px** — זה ממצא אמיתי על הרכיב (חוקה § 4), ⛔ ולא סיבה להוריד את המסלול מהרשימה. תקן ברוחב של הבלוק (`min-w-0` / `break-words`), ⛔ לא בהחלשת הבדיקה.

- [ ] **Step 7: Commit**

```bash
git add app/dev/lesson scripts/verify-mobile.mjs scripts/verify-mobile.test.ts
git commit -m "loop(DEV): T-089 lesson fixtures measured at 320/375/414"
```

---

### Task 3: `PRIMARY_ACTION_ROUTES` — בדיקות F-027 על שתי הלשוניות, בלי להחליש דבר

**Files:**

- Modify: `scripts/verify-mobile.mjs:150` (‏`FLOW_ROUTES`) ו-בלוק הבדיקות שמתחיל ב-`if (FLOW_ROUTES.includes(route)) {`
- Test: `scripts/verify-mobile.test.ts`

**Interfaces:**

- Produces: קבוע חדש ברמת המודול —

```js
const PRIMARY_ACTION_ROUTES = [...FLOW_ROUTES, '/dev/tabs/studies', '/dev/tabs/cards'];
```

**זה השינוי המדויק, ולמה:** בלוק ה-F-027 מכיל היום **חמש** קבוצות בדיקה, ורק אחת מהן היא טענה על «מסך זרימה» ולא על «מסך עם פעולה»:

| הבדיקה | מה היא טוענת | לאן היא עוברת |
|---|---|---|
| `exactly one primary action` | סימון אחד למסך | `PRIMARY_ACTION_ROUTES` |
| `primary action is hit-testable` | האגודל מגיע אליה | `PRIMARY_ACTION_ROUTES` |
| `primary action reachable by scrolling` | היא אינה חתוכה | `PRIMARY_ACTION_ROUTES` |
| `primary action visible without scrolling` | היא במסך הראשון | `PRIMARY_ACTION_ROUTES` |
| `no tab bar on a flow screen` | **מסך זרימה ⛔ אינו נושא סרגל לשוניות** (D-028) | **נשאר `FLOW_ROUTES`** |
| `action bar does not cover the licence link` · `adjacent tap targets >= 8px` | סרגל תחתון וצפיפות | **נשארות `FLOW_ROUTES`** — ⛔ מחוץ לתחולת T-091 |

⛔ **אין לצרף את שלוש התחתונות לשתי הלשוניות בטיק הזה.** T-091 מבקשת «יעד נקוב» ואת שלוש בדיקות F-027, ⛔ לא סריקת צפיפות חדשה על שני מסכים שלא נמדדו בה מעולם. הרחבה כזאת עלולה להפיל בדיקה על פגם אמיתי ולערבב שתי עבודות בטיק אחד; אם היא רצויה — זו שורת משימה חדשה של ה-PM.

- [ ] **Step 1: Write the failing guard**

הוסף ל-`scripts/verify-mobile.test.ts`:

```ts
/**
 * ‏T-091 · F-098 — שתי לשוניות הפיקסטורה מקבלות את שלוש בדיקות F-027, ⛔ ובלי
 * שאף בדיקה קיימת תיחלש.
 *
 * ⚠️ הסתירה שנמדדה בטיק התכנון: `no tab bar on a flow screen` יושבת באותו בלוק,
 * ושתי הלשוניות מרנדרות `<TabBar />` (‏`data-tab-bar`) — כלומר הוספה ל-FLOW_ROUTES
 * מפילה אותה בוודאות, בשש נקודות. הבדיקה שלמטה היא מה שמונע מהיד הבאה «לפתור»
 * את זה בהחלשה.
 */
describe('the F-027 primary-action checks cover the tab fixtures (T-091 · F-098)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('declares a list that is FLOW_ROUTES plus the two tab fixtures', () => {
    expect(source).toMatch(
      /const PRIMARY_ACTION_ROUTES = \[\s*\.\.\.FLOW_ROUTES,\s*'\/dev\/tabs\/studies',\s*'\/dev\/tabs\/cards',?\s*\]/,
    );
  });

  it('gates the primary-action block on that list and ⛔ not on FLOW_ROUTES', () => {
    expect(source).toContain('if (PRIMARY_ACTION_ROUTES.includes(route)) {');
    expect(source).toContain('exactly one primary action');
  });

  /**
   * ⛔ THE POINT OF THIS WHOLE TASK. `no tab bar on a flow screen` is a claim
   * about a FLOW screen (D-028) and a tab screen is a destination, not a step.
   * If a later hand moves it under PRIMARY_ACTION_ROUTES it fails six times and
   * the cheapest way out is to delete it. This pins it where it belongs.
   */
  it('keeps "no tab bar on a flow screen" bound to FLOW_ROUTES', () => {
    expect(source).toContain('if (FLOW_ROUTES.includes(route)) {');
    const flowOnly = source.slice(source.lastIndexOf('if (FLOW_ROUTES.includes(route)) {'));
    expect(flowOnly).toContain('no tab bar on a flow screen');
    const primaryBlock = source.slice(
      source.indexOf('if (PRIMARY_ACTION_ROUTES.includes(route)) {'),
      source.lastIndexOf('if (FLOW_ROUTES.includes(route)) {'),
    );
    expect(primaryBlock).not.toContain('no tab bar on a flow screen');
    expect(primaryBlock).toContain('exactly one primary action');
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

```bash
npx vitest run scripts/verify-mobile.test.ts
```

צפוי: **FAIL** על שלוש הבדיקות (`PRIMARY_ACTION_ROUTES` אינו קיים).

- [ ] **Step 3: Declare the list**

מיד אחרי הצהרת `FLOW_ROUTES` (‏`scripts/verify-mobile.mjs:150`) הוסף:

```js
/**
 * T-091 · F-098 — היכן נמדדות שלוש בדיקות F-027 («סימון אחד · האגודל מגיע · במסך הראשון»).
 *
 * ⚠️ ⛔ ⛔ אינו `FLOW_ROUTES`, וזו מדידה ⛔ ולא טעם: באותו בלוק יושבת גם
 * `no tab bar on a flow screen`, ושתי לשוניות הפיקסטורה מרנדרות `<TabBar />`
 * (`components/TabBar.tsx:167`, `data-tab-bar="true"`) — בעוד `TAB_ROUTES` **דורש**
 * שהסרגל יהיה שם. הוספה נאיבית של השתיים ל-`FLOW_ROUTES` מפילה את הבדיקה ההיא
 * בוודאות, שש פעמים (שני מסלולים × שלושה רוחבים), והדרך הזולה החוצה היא להחליש
 * אותה. ⇒ הבלוק נחתך במקום, ו-D-028 נשארת קשורה ל-`FLOW_ROUTES` בלבד.
 *
 * מסך לשונית הוא **יעד** ⛔ ולא צעד בזרימה — בדיוק הנימוק שבגללו `/sources` ו-`/offline`
 * ⛔ אינם ב-`FLOW_ROUTES`. מה שכן נכון עליו הוא שהוא מחזיק **פעולה מסומנת אחת** שהאגודל
 * מגיע אליה בלי גלילה, וזה מה שנמדד כאן. `02-inbox` פריט 9 של רוי: «לתת לצוות עיניים».
 *
 * ⛔ `/dev/tabs/me` ⛔ אינו כאן ובכוונה: T-091 נוקבת בשתי לשוניות, והשלישית היא
 * שורת משימה של ה-PM ⛔ ולא הרחבה שסוכן מוסיף לעצמו.
 */
const PRIMARY_ACTION_ROUTES = [...FLOW_ROUTES, '/dev/tabs/studies', '/dev/tabs/cards'];
```

- [ ] **Step 4: Split the block**

ב-`scripts/verify-mobile.mjs`, שנה את פתיחת הבלוק מ-

```js
      if (FLOW_ROUTES.includes(route)) {
```

ל-

```js
      if (PRIMARY_ACTION_ROUTES.includes(route)) {
```

ואז **סגור** את הבלוק הזה מיד אחרי `report(\`${at} primary action …\`)` — כלומר אחרי הקבוצה של ארבע הבדיקות — ופתח בלוק שני:

```js
      }

      // D-028 · צפיפות · סרגל תחתון — טענות על **מסך זרימה**, ⛔ לא על מסך עם פעולה.
      // ⛔ נשארות על FLOW_ROUTES: מסך לשונית נושא סרגל לשוניות בהגדרה (TAB_ROUTES דורש
      // זאת), ולכן `no tab bar on a flow screen` עליו הייתה סתירה ⛔ ולא מדידה (F-098).
      if (FLOW_ROUTES.includes(route)) {
```

⚠️ **הכל מה שהיה בין `report(...)` לסוף הבלוק המקורי — בדיקת `footer`, `strayTabBar` ו-`tooClose` — נשאר כפי שהוא בתוך הבלוק השני. ⛔ אין לשנות ולו תו אחד בגופן.**

- [ ] **Step 5: Run the guard**

```bash
npx vitest run scripts/verify-mobile.test.ts
```

צפוי: **PASS**.

- [ ] **Step 6: Run the browser harness — this is where the claim is settled**

```bash
npm run build && npm run check:mobile
```

צפוי: **ok**, וב-24 בדיקות יותר מהבסיס (שני מסלולים × שלושה רוחבים × ארבע בדיקות).

⚠️ **התוצאה שאינה נוחה, ומה עושים בה:** אם `/dev/tabs/cards @…px exactly one primary action` מדווח `found 0`, הסיבה היא **תזמון ⛔ ולא פגם**: הקישור היחיד שם הוא מצב ה-`dead` של `<DeckSelector>` (`data-deck-empty` → `DECK_ALL_EMPTY_HREF = '/study'`), והוא נכנס ל-DOM רק אחרי ששתי הקריאות ל-`/api/study/queue` נכשלות ב-503. הארנס טוען עם `waitUntil: 'networkidle'`, ולכן זה **אמור** להיות מיושב.
⛔ אם הוא בכל זאת מדווח `found 0` או `found 2` — **עצור, אל תתקן את הרכיב, ואל תגע בבדיקה.** זה ממצא ממחלקת F-027 על `<LevelMapScreen>`: פתח שורת ממצא עם המספר המדויק ועם הרוחב, החזר את המסלול מ-`PRIMARY_ACTION_ROUTES`, והמשך למשימה 4 עם `/dev/tabs/studies` בלבד. **מסך שאין בו פעולה מסומנת אחת הוא בדיוק המבוי הסתום שרוי דיווח עליו — הבדיקה עשתה את עבודתה.**

- [ ] **Step 7: One mutation, recorded**

הוסף זמנית `'/dev/tabs/studies'` גם ל-`FLOW_ROUTES` והרץ `npm run check:mobile`. חייב ליפול על **`no tab bar on a flow screen`** — זו המדידה שמוכיחה ש-F-098 אמיתי ⛔ ולא נטען. שחזר את הקובץ.

- [ ] **Step 8: Commit**

```bash
git add scripts/verify-mobile.mjs scripts/verify-mobile.test.ts
git commit -m "loop(DEV): T-091 PRIMARY_ACTION_ROUTES — F-027 checks reach the tab fixtures"
```

---

### Task 4: יעד נקוב לכל אחת מהשתיים

**Files:**

- Modify: `scripts/verify-mobile.mjs` — `FLOW_ARRIVAL` (‏`:172`) ו-`EXPECTED_CONSOLE`
- Test: `scripts/verify-mobile.test.ts`

**Interfaces:**

- Consumes: מבנה הרשומה הקיים — `{ kind: 'navigates', to, marker, why }` · `{ kind: 'announces', text, why }` · `{ kind: 'refetches', request, why }` · השדה הרשות `settles`.
- Produces: שתי רשומות חדשות ב-`FLOW_ARRIVAL` ורשומה אחת ב-`EXPECTED_CONSOLE['/dev/tabs/cards']`.

**שני היעדים, נמדדים ⛔ ולא מונחים:**

| מסלול | הפעולה המסומנת | לאן היא באמת מגיעה בהרצה הזאת | למה |
|---|---|---|---|
| `/dev/tabs/studies` | «התחלת מנה יומית» → `/cards` (`components/StudiesScreen.tsx:31`) | **`/login`** | `proxy.ts:28` — `/cards` ב-`PROTECTED_SCREENS`, ולארנס אין env של Supabase ⇒ 307 ל-`/login?expired=1`. `pathname` הוא `/login`. |
| `/dev/tabs/cards` | «פתיחת הכרטיסיות» → `/study` (`lib/core/deckTiles.ts:33`) | **`/study`** | `/study` ⛔ אינו ב-`PROTECTED_SCREENS` ⇒ נטען, במצב הכשל 503 שלו. |

⛔ **אין להחליש `kind` כדי שמסך יעבור** — שתיהן `navigates`, הצורה החזקה.

**⚠️ הדליפה שחייבת טיפול, ⛔ ולא הפתעה בהרצה:** ההקשה ב-`/dev/tabs/cards` נוחתת על `/study`, ש**מבקש** `GET /api/study/queue?deck=due` ומקבל 503 מהחוזה שלו עצמו. הלולאה עדיין נמצאת במסלול `/dev/tabs/cards`, ולכן הקו נספר שם ומפיל `clean console`. הרשומות הקיימות שם מקושרות ל-`deck=due&limit=1` ול-`deck=unknown&limit=1` ⇒ ⛔ אינן מכסות אותו. נדרשת רשומה **חדשה, צרה, ומקושרת לסוף המחרוזת** — הארנס בונה כל שורה כ-``${m.text()} @${m.location().url}`` (‏`scripts/verify-mobile.mjs:485`), ולכן `$` באמת נועל את סוף הכתובת ומונע מהרשומה לבלוע גם `?deck=due&limit=1`.

- [ ] **Step 1: Write the failing guard**

הוסף ל-`scripts/verify-mobile.test.ts`:

```ts
/**
 * ‏T-091, החצי השני של F-027: ההקשה **מגיעה** לאיפשהו. `02-inbox` פריט 9.
 * ‏`FLOW_ARRIVAL` נקרא ב-`const arrival = FLOW_ARRIVAL[route]` בלי תנאי חברות
 * ב-`FLOW_ROUTES`, ולכן שתי הרשומות האלה נמדדות בזכות עצמן.
 */
describe('both tab fixtures declare where their tap lands (T-091)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const arrival = source.slice(
    source.indexOf('const FLOW_ARRIVAL'),
    source.indexOf('const EXPECTED_CONSOLE'),
  );

  it('/dev/tabs/studies names /login — the redirect proxy.ts forces without env', () => {
    const entry = arrival.slice(arrival.indexOf("'/dev/tabs/studies':"));
    expect(entry).toContain("kind: 'navigates'");
    expect(entry).toContain("to: '/login'");
    expect(entry).toContain("marker: 'input[name=\"email\"]'");
  });

  it('/dev/tabs/cards names /study and the request that landing fires', () => {
    const entry = arrival.slice(arrival.indexOf("'/dev/tabs/cards':"));
    expect(entry).toContain("kind: 'navigates'");
    expect(entry).toContain("to: '/study'");
    expect(entry).toContain("marker: '[data-action-bar]'");
    expect(entry).toContain("settles: '/api/study/queue?deck=due'");
  });

  /**
   * ⛔ NOT a blanket exemption for the route. The landing on `/study` fires ONE
   * request the harness itself makes impossible, and the entry is keyed to that
   * exact URL and pinned with `$` so it cannot also swallow `?deck=due&limit=1`
   * — the request `<DeckSelector>` makes on the route itself.
   */
  it('allows exactly the one 503 that landing on /study causes', () => {
    const expected = source.slice(source.indexOf('const EXPECTED_CONSOLE'));
    const block = expected.slice(expected.indexOf("'/dev/tabs/cards':"));
    expect(block).toContain('\\/api\\/study\\/queue\\?deck=due$');
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

```bash
npx vitest run scripts/verify-mobile.test.ts
```

צפוי: **FAIL**, שלוש בדיקות.

- [ ] **Step 3: Add the two arrivals**

בתוך `FLOW_ARRIVAL`, אחרי הרשומה של `'/world/compose'`, הוסף:

```js
  // T-091 · `02-inbox` פריט 9 — «לתת לצוות עיניים» על שתי לשוניות שהמדידה מעולם
  // לא נגעה בהן. ⛔ שתיהן `navigates`, הצורה החזקה: `kind` ⛔ אינו נחלש כדי
  // שמסך יעבור.
  //
  // ⛔ `/login` ולא `/cards`, וזו מדידה: `proxy.ts:28` מחזיק את `/cards`
  // ב-`PROTECTED_SCREENS`, ולארנס אין env של Supabase ⇒ הבקשה נענית 307
  // ל-`/login?expired=1`. לכתוב כאן `/cards` היה מייצר בדיקה שנכשלת תמיד על
  // התנהגות **נכונה** של המוצר.
  '/dev/tabs/studies': {
    kind: 'navigates',
    to: '/login',
    marker: 'input[name="email"]',
    why: 'the tab’s one action is a Link to /cards, which proxy.ts redirects to /login without Supabase env — so what is measured is that the tap really moves the router',
  },
  // ⛔ הפעולה המסומנת כאן היא מצב ה-`dead` של `<DeckSelector>` — כל שלושת
  // האריחים מושבתים כי שתי הקריאות ל-`/api/study/queue` נכשלות ב-503 — ולכן
  // היעד הוא `DECK_ALL_EMPTY_HREF` (`lib/core/deckTiles.ts:33`), כלומר `/study`.
  // `[data-action-bar]` ⛔ ולא טקסט: כתובת לבדה היא טענה על הנתב, והסמן הוא
  // הטענה על המסך — מסלול שמרנדר גבול שגיאה נושא את אותה כתובת בדיוק.
  '/dev/tabs/cards': {
    kind: 'navigates',
    to: '/study',
    marker: '[data-action-bar]',
    why: 'the only marked action in the all-decks-dead state is the link to /study; landing there is what proves the tap is not a dead end',
    // הבקשה שהנחיתה גורמת. בלי לנקוב בה, ה-503 שלה נספר על המסלול הזה אחרי
    // שהלולאה כבר עברה הלאה — בדיוק הייחוס השגוי שנמדד ב-C-0134.
    settles: '/api/study/queue?deck=due',
  },
```

- [ ] **Step 4: Add the console allowance**

ב-`EXPECTED_CONSOLE`, בתוך המערך של `'/dev/tabs/cards'`, הוסף כשורה אחרונה:

```js
    // T-091: ההקשה נוחתת על `/study`, שמבקש את התור **בלי** `limit` ומקבל 503
    // מהחוזה שלו עצמו. ⛔ פטור למסלול: `$` נועל את סוף הכתובת, ולכן הרשומה
    // הזאת ⛔ אינה יכולה לבלוע גם את `?deck=due&limit=1` — הבקשה ש-`<DeckSelector>`
    // עושה על המסלול עצמו, ושכבר יש לה רשומה משלה למעלה. 401 או 500 על אותה
    // כתובת עדיין מפילים.
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=due$/,
```

- [ ] **Step 5: Run the guard**

```bash
npx vitest run scripts/verify-mobile.test.ts
```

צפוי: **PASS**.

- [ ] **Step 6: Run the harness — the only place these entries are real**

```bash
npm run build && npm run check:mobile
```

צפוי, בשלושת הרוחבים:

```
ok /dev/tabs/studies @375px tap arrives at /login
ok /dev/tabs/studies @375px /login really rendered
ok /dev/tabs/cards @375px tap arrives at /study
ok /dev/tabs/cards @375px /study really rendered
```

⚠️ **אם `clean console` נופל על `/dev/tabs/cards`** — קרא את הכתובת המדויקת בפלט לפני שאתה נוגע במשהו. אם היא `?deck=due` — הרשומה של צעד 4 לא נוסחה נכון. אם היא כתובת **אחרת**, זו בקשה שאיש לא ידע עליה: זה ממצא, ⛔ ולא רשומה נוספת שמשתיקה אותה.

- [ ] **Step 7: Two mutations, recorded**

1. שנה `to: '/login'` ל-`to: '/cards'` ⇒ `tap arrives at /cards` חייבת ליפול עם `landed on /login`. שחזר.
2. מחק את שורת `settles` מ-`/dev/tabs/cards` והרץ פעמיים ⇒ הקו של `/api/study/queue?deck=due` חייב להופיע **לסירוגין** על המסלול **הבא** ברשימה. זו בדיוק הראיה של C-0134, ואם היא ⛔ אינה מופיעה — רשום שלא הצלחת לשחזר, ⛔ אל תטען שהיא הופיעה. שחזר.

- [ ] **Step 8: Full verification**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```

⛔ הדבק את ארבע השורות האמיתיות בדיווח. «אמור לעבוד» · «נראה תקין» · «עבר קודם» — אסורים.

- [ ] **Step 9: Commit**

```bash
git add scripts/verify-mobile.mjs scripts/verify-mobile.test.ts
git commit -m "loop(DEV): T-091 named arrivals for both tab fixtures"
```

---

## Self-check — הרץ אותה על עצמך לפני שאתה מסמן את התוכנית כבוצעה

1. **`git diff` מול הטענה.** לכל שורת «עבר» בדיווח יש פלט פקודה **מהטיק הזה**. דיווח של סוכן משנה מאומת מול `git diff` ⛔ ולא מול מה שהוא אמר.
2. **⛔ אף בדיקה קיימת לא נחלשה.** הרץ `git diff scripts/verify-mobile.mjs` וודא ששלוש הבדיקות `no tab bar on a flow screen` · `action bar does not cover the licence link` · `adjacent tap targets >= 8px apart` נמצאות **מילה במילה** כפי שהיו, בתוך בלוק `FLOW_ROUTES`.
3. **אפס תו עברי ב-`components/LessonScreen.tsx`** — הטענה שכל התוכן הוא פרופ. `grep -c '[֐-׿]' components/LessonScreen.tsx` על הקובץ **אחרי** הפשטת הערות.
4. **`docs/api-contract.md` ⛔ אינו משתנה** — התוכנית הזאת ⛔ אינה נוגעת בנקודות קצה.
5. **המספרים בדיווח.** ספירת `npm test` לפני ואחרי · ספירת `check:mobile` לפני ואחרי. תוכנית שסיפקה כיסוי ואינה יכולה לנקוב בכמה — לא מדדה אותו.
6. **שתי שורות המשימה.** T-089 ✅ אחרי משימה 2 · T-091 ✅ אחרי משימה 4. ⛔ אל תסמן שורה שרק חלקה נסגר.
