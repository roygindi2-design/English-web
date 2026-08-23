# מסך שיעור שאפשר לענות בו · `לימודים` כמסך ארבעת המשטחים · `אני` עם פעולה אמיתית

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לסגור את שלוש המשימות שהופכות שלושה מסכים מ«טקסט שאי-אפשר לפעול בו» למסכים שהלומד עושה בהם משהו — **T-143** (מסך השיעור נעשה ניתן למענה) · **T-144** (`לימודים` מציגה את ארבעת המשטחים ונוקבת במוזנח) · **T-145** (`אני` מפסיקה להציע «יציאה» כפעולה הראשית).

**Architecture:** שלוש ההכרעות החדשות יורדות ל-**שכבה טהורה** (`lib/core/lesson.ts` · `lib/core/surfaces.ts`) שאין בה React, DOM, שעון או רשת; הקריאות מהדאטהבייס יושבות ב**עמודי `app/(tabs)/…`** כפי שהן יושבות שם היום, ⛔ ולא ברכיבים; והרכיבים (`LessonScreen` · `StudiesScreen` · `MeScreen`) נשארים פונקציה של הפרופים שלהם, כך ששתי פיקסטורות `app/dev/…` ממשיכות למדוד בדיוק את המרקאפ של המסך האמיתי (F-027 סיבה 2). **⛔ אפס עמודה חדשה · אפס מיגרציה · אפס נקודת קצה חדשה** — שלוש המשימות נגזרות מעמודות שכבר קיימות (`word_progress.updated_at` · `world_posts.created_at` · `arcade_runs.finished_at` · `stories`).

**Tech Stack:** Next.js App Router (RSC) · TypeScript ללא `any` · Tailwind (טוקנים של `plan/35-design-constitution.md`) · Vitest ב-node ⛔ ללא jsdom (ולכן בדיקת רכיב = **סריקת מקור**) · Playwright דרך `npm run check:mobile` (גאומטריה).

**Spec:** `plan/40-decisions.md` § 4.2יד (‏T-143 · T-144) · § 4.2טז (‏T-145) · D-077 · D-078 · D-079 · D-083 · D-034 · D-046 · D-048 · D-050 · § 1.13 · R-018 · שורות `T-143` · `T-144` · `T-145` ב-`plan/50-tasks.md`.

## Global Constraints

מוחלות על **כל** משימה בתוכנית הזאת, ⛔ גם אם אינן חוזרות בגוף הצעד:

1. **`/lib/core/` טהור.** ⛔ אפס `react` · `window` · `document` · `localStorage` · `fetch` · `process.env` · `new Date()` · `Math.random()`. נאכף ב-`npm run check:core`.
2. **⛔ רכיב ממשק אינו ניגש לדאטהבייס.** הקריאה חיה בעמוד (`app/(tabs)/…/page.tsx`), הרכיב מקבל פרופים. זהו הדפוס הקיים בשני העמודים שהתוכנית נוגעת בהם.
3. **⛔ אפס תוכן לימודי בקוד.** ‏`components/LessonScreen.tsx` נבדק על **אפס תו עברי** — הבדיקה קיימת ו⛔ אינה מוחלשת.
4. **R-018 / R-010:** ⛔ אין ללמד את בחינת מאל"ו ואין להעתיק ממנה. מותר ללמד **סוג שאלה כתופעה לשונית** (§ 1.13 ⓑ).
5. **D-050 · R-012 · T-032:** ⛔ אפס נקודות · אפס מטבע · אפס XP · אפס לוח תוצאות · אפס רצף יומי · אפס תווית «נכון/לא נכון» כערך.
6. **D-046 · D-082:** משטח/אריח שאינו זמין מוצג **עם מספר**, ⛔ ולעולם לא `«—»`.
7. **§ 4.4.3:** ⛔ אין הערכת מוכנות ואין ציון חזוי.
8. **Mobile-First 375px · יעד מגע ≥ 44px (`min-h-touch`) · RTL · TypeScript ללא `any`.**
9. **היום הוא היום של הלומד:** `LEARNER_TIME_ZONE = 'Asia/Jerusalem'` ו-`toIsoDateInZone` ב-`lib/core/onboarding.ts`. ⛔ אין להשוות ל-UTC ו⛔ אין להמציא אזור זמן שני.
10. **הסדר מחייב** (§ 4.2יד): **T-143 קודמת ל-T-144.** ⛔ אין טעם לשלוח לומד למסך שאי-אפשר לענות בו.
11. **פקודת האימות המלאה** אחרי כל משימה: `npm run typecheck && npm run check:core && npm test && npm run build`. ⛔ אין טענת «עובר» בלי הרצה טרייה באותה הודעה.

---

## מפת הקבצים

| קובץ | אחריות | משימה |
|---|---|---|
| `lib/core/lesson.ts` (**חדש**) | מצב הבחירה של השיעור כפונקציה טהורה: איזו אפשרות נבחרה בפריט, ואיזה הסבר נחשף | 1 |
| `lib/core/lesson.test.ts` (**חדש**) | בדיקות התנהגות אמיתיות למודול הטהור | 1 |
| `components/LessonScreen.tsx` (שינוי) | האפשרות נעשית `<button>` בן ≥44px; ההסבר נחשף אחרי בחירה | 1 |
| `components/LessonScreen.test.ts` (שינוי) | סריקת מקור: אפס `<li>` כאפשרות · אפס תו עברי (קיים) | 1 |
| `scripts/verify-mobile.mjs` (שינוי) | שער `/dev/lesson`: ≥3 לחיצים ≥44px · אפס הסבר לפני בחירה. שער `/dev/tabs/studies`: ≥400 תווים · ≥4 יעדי ניווט | 1 · 2 |
| `lib/core/surfaces.ts` (**חדש**) | ארבעת המשטחים, תוויותיהם, ובחירת **המשטח המוזנח** — טהור | 2 |
| `lib/core/surfaces.test.ts` (**חדש**) | בדיקות התנהגות + שער נגד סחיפת תוויות מול `TabBar`/`worldApps` | 2 |
| `lib/supabase/stories.ts` (**חדש**) | `readStoriesAtLevel` — הוצאה של `readStories` מתוך `app/api/world/status/route.ts`, כדי שההגדרה תחיה **פעם אחת** | 2 |
| `app/api/world/status/route.ts` (שינוי) | קורא ל-`readStoriesAtLevel` במקום להחזיק עותק | 2 |
| `lib/supabase/surfacesTouched.ts` (**חדש**) | `readSurfacesTouchedToday` — שלוש קריאות קיימות, ⛔ אפס עמודה חדשה | 2 |
| `components/StudiesScreen.tsx` (שינוי) | ארבעה משטחים + שורת המשטח המוזנח | 2 |
| `components/StudiesScreen.test.ts` (שינוי) | ⛔ אפס «—» · אפס «נקודות»/«XP»/«רצף» · ארבעה משטחים | 2 |
| `app/(tabs)/studies/page.tsx` · `app/dev/tabs/studies/page.tsx` (שינוי) | הקריאה והפיקסטורה | 2 |
| `components/MeScreen.tsx` (שינוי) | `data-primary-action` יורד מהיציאה ועובר להמשך הלמידה; שלוש הספירות | 3 |
| `components/MeScreen.test.ts` (שינוי/חדש) | סריקת מקור: הסימון ⛔ אינו על טופס ה-logout; היציאה נשארת | 3 |
| `app/(tabs)/me/page.tsx` · `app/dev/tabs/me/page.tsx` (שינוי) | הקריאה והפיקסטורה | 3 |

---

## Task 1 — T-143 · מסך השיעור נעשה ניתן למענה

**Files:**
- Create: `lib/core/lesson.ts`
- Create: `lib/core/lesson.test.ts`
- Modify: `components/LessonScreen.tsx`
- Modify: `components/LessonScreen.test.ts`
- Modify: `scripts/verify-mobile.mjs` (בלוק `route === '/dev/lesson'`)

**Interfaces:**
- Consumes: `EnWord` · `EnText` · `EnTextSegment` מ-`@/components/EnWord` (קיימים, ⛔ ללא שינוי).
- Produces:
```ts
// lib/core/lesson.ts
export interface LessonChoiceFacts { readonly id: string; readonly why: string }
export type LessonSelection = Readonly<Record<string, string>>;   // itemId -> choiceId
export const EMPTY_LESSON_SELECTION: LessonSelection;
export function chooseInLesson(
  selection: LessonSelection, itemId: string, choiceId: string,
): LessonSelection;
export function selectedChoiceId(selection: LessonSelection, itemId: string): string | null;
export function whyForChoice(
  choices: readonly LessonChoiceFacts[], choiceId: string | null,
): string | null;
```
`LessonChoice` שבקומפוננטה מקיים את `LessonChoiceFacts` **מבנית** — ⛔ ולכן `lib/core` ⛔ אינו מייבא מ-`components/` והטוהר נשמר.

**Design note (⛔ אינו טעם — זה מה שהמפרט מרשה ומה שהוא אוסר):**
§ 4.2יד: «האפשרות היא יעד מגע ≥44px, ואחרי הבחירה מוצג **הסבר קצר**». ⇒ היום `choice.why` מוצג **תמיד**; אחרי המשימה הוא מוצג **רק** לאפשרות שנבחרה. ⛔ **אין שדה `isCorrect` ואין להוסיף אחד** — T-143ⓒ אוסר תווית ערך; המסך מציג את ה-`why` של מה שנבחר, וזה כל המנגנון. **הקשה על אפשרות אחרת מחליפה את הבחירה** — זו הקריאה המינימלית של «בחירה», ⛔ ואין נעילה, ⛔ אין מונה ו⛔ אין «סופי».

- [ ] **Step 1 — כתוב את הבדיקה הנופלת של השכבה הטהורה**

צור `lib/core/lesson.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  EMPTY_LESSON_SELECTION,
  chooseInLesson,
  selectedChoiceId,
  whyForChoice,
  type LessonChoiceFacts,
} from './lesson';

const CHOICES: readonly LessonChoiceFacts[] = [
  { id: 'a', why: 'הסבר א׳' },
  { id: 'b', why: 'הסבר ב׳' },
  { id: 'c', why: 'הסבר ג׳' },
];

describe('lesson selection — T-143 · § 4.2יד', () => {
  it('⛔ אין בחירה בהתחלה, ולכן ⛔ אין הסבר', () => {
    expect(selectedChoiceId(EMPTY_LESSON_SELECTION, 'item-1')).toBeNull();
    expect(whyForChoice(CHOICES, null)).toBeNull();
  });

  it('בחירה נרשמת לפריט שלה בלבד', () => {
    const s = chooseInLesson(EMPTY_LESSON_SELECTION, 'item-1', 'b');
    expect(selectedChoiceId(s, 'item-1')).toBe('b');
    expect(selectedChoiceId(s, 'item-2')).toBeNull();
  });

  it('⛔ אינו משנה את האובייקט שקיבל — המצב הקודם שורד', () => {
    const before = chooseInLesson(EMPTY_LESSON_SELECTION, 'item-1', 'b');
    const after = chooseInLesson(before, 'item-2', 'c');
    expect(before).toEqual({ 'item-1': 'b' });
    expect(after).toEqual({ 'item-1': 'b', 'item-2': 'c' });
    expect(after).not.toBe(before);
  });

  it('הקשה על אפשרות אחרת באותו פריט מחליפה — ⛔ ואינה מוסיפה שנייה', () => {
    const s = chooseInLesson(chooseInLesson(EMPTY_LESSON_SELECTION, 'item-1', 'b'), 'item-1', 'c');
    expect(s).toEqual({ 'item-1': 'c' });
  });

  it('ההסבר שנחשף הוא של האפשרות שנבחרה, ⛔ ולא הראשון ברשימה', () => {
    expect(whyForChoice(CHOICES, 'c')).toBe('הסבר ג׳');
    expect(whyForChoice(CHOICES, 'a')).toBe('הסבר א׳');
  });

  it('מזהה שאינו ברשימה מחזיר null — ⛔ ולא זורק ו⛔ לא מחרוזת ריקה', () => {
    expect(whyForChoice(CHOICES, 'zzz')).toBeNull();
  });
});
```

- [ ] **Step 2 — הרץ ואמת שהיא נופלת**

Run: `npx vitest run lib/core/lesson.test.ts`
Expected: FAIL — `Failed to resolve import "./lesson"`.

- [ ] **Step 3 — כתוב את המימוש המינימלי**

צור `lib/core/lesson.ts`:

```ts
/**
 * ‏T-143 · § 4.2יד — מצב הבחירה של מסך השיעור, כפונקציה טהורה.
 *
 * ⛔ אפס React · DOM · שעון · אקראיות · רשת. ⛔ ואפס תו עברי בתוצאה: כל מחרוזת
 * שנחשפת ללומד מגיעה מ-`why` שהגיע כפרופ, ⛔ ואינה נכתבת כאן (T-089 · R-018).
 *
 * ⛔ **אין כאן `isCorrect` ואין להוסיף:** T-143ⓒ אוסר תווית ערך «נכון/לא נכון»,
 * והמנגנון היחיד הוא «מה שנבחר מסביר את עצמו» (D-050).
 */

export interface LessonChoiceFacts {
  readonly id: string;
  readonly why: string;
}

/** ‏itemId → choiceId. ⛔ מפה ⛔ ולא מזהה יחיד: § 4.2ט נותנת 1–3 פריטים במסך אחד. */
export type LessonSelection = Readonly<Record<string, string>>;

export const EMPTY_LESSON_SELECTION: LessonSelection = Object.freeze({});

/** ⛔ מחזיר אובייקט חדש — הקורא הוא `useState`, ומוטציה שם ⛔ אינה מרנדרת מחדש. */
export function chooseInLesson(
  selection: LessonSelection,
  itemId: string,
  choiceId: string,
): LessonSelection {
  return { ...selection, [itemId]: choiceId };
}

export function selectedChoiceId(selection: LessonSelection, itemId: string): string | null {
  return selection[itemId] ?? null;
}

/** ⛔ `null` ⛔ ולא מחרוזת ריקה: «טרם בחר» ו«בחר ואין הסבר» ⛔ אינם אותו מצב. */
export function whyForChoice(
  choices: readonly LessonChoiceFacts[],
  choiceId: string | null,
): string | null {
  if (choiceId === null) return null;
  return choices.find((choice) => choice.id === choiceId)?.why ?? null;
}
```

- [ ] **Step 4 — הרץ ואמת שהיא עוברת**

Run: `npx vitest run lib/core/lesson.test.ts`
Expected: PASS — 6 בדיקות.

- [ ] **Step 5 — הרץ את שער הטוהר**

Run: `npm run check:core`
Expected: `/lib/core purity: OK`

- [ ] **Step 6 — הוסף את הבדיקות הנופלות על מקור הרכיב**

ב-`components/LessonScreen.test.ts`, הוסף `describe` חדש **בסוף הקובץ** (⛔ אל תיגע בבדיקות הקיימות — «אפס תו עברי» נשארת כלשונה):

```ts
describe('T-143 · § 4.2יד — האפשרות נעשית יעד מגע שאפשר לבחור בו', () => {
  it('⛔ אפס `<li>` כאפשרות — נשאר בדיוק אחד, עוטף הפריט', () => {
    const openTags = CODE.match(/<li\b/g) ?? [];
    expect(openTags.length, 'each choice must be a <button>, not a list item').toBe(1);
  });

  it('כל אפשרות היא `<button type="button">` מסומן, בעל מטפל הקשה', () => {
    expect(CODE).toMatch(/<button[\s\S]{0,300}?data-lesson-choice/);
    expect(CODE).toMatch(/<button[\s\S]{0,300}?type="button"/);
    expect(CODE).toMatch(/onClick=\{\(\) =>/);
  });

  it('האפשרות נושאת את רצפת יעד המגע של החוקה', () => {
    const choiceBlock = CODE.slice(CODE.indexOf('data-lesson-choice'));
    expect(choiceBlock, 'a choice below 44px is not a target').toContain('min-h-touch');
  });

  it('ההכרעה מי נבחר ומה נחשף מגיעה מהשכבה הטהורה — ⛔ ואינה משוכפלת ב-JSX', () => {
    expect(CODE).toContain("from '@/lib/core/lesson'");
    for (const fn of ['chooseInLesson', 'selectedChoiceId', 'whyForChoice']) {
      expect(CODE, `${fn} is not used`).toContain(fn);
    }
    // ⛔ אין השוואת מזהים ידנית ברכיב — זו בדיוק ההגדרה השנייה ש-lib/core מונע.
    expect(CODE).not.toMatch(/choice\.id === /);
  });

  it('ההסבר ⛔ אינו מרונדר בלי בחירה — הוא תלוי בתוצאת `whyForChoice`', () => {
    expect(CODE).toContain('data-lesson-why');
    expect(CODE).toMatch(/why !== null \?/);
  });
});
```

- [ ] **Step 7 — הרץ ואמת שחמש הבדיקות נופלות**

Run: `npx vitest run components/LessonScreen.test.ts`
Expected: FAIL — `expected 4 to be 1` (שני `<li>` פתוחים היום, ה-`map` מייצר עוד אחד) ו-`expected … to match /<button…data-lesson-choice/`.

- [ ] **Step 8 — כתוב את הרכיב**

ב-`components/LessonScreen.tsx`:

ⓐ הוסף בראש הקובץ, **לפני** ה-imports:

```tsx
'use client';
```

ⓑ עדכן את בלוק ההערה בראש הקובץ — הפסקה «⛔ אינו `'use client'`: אין כאן מצב ואין מטפל אירועים» **בטלה**, והחלף אותה ב:

```
 * ⚠️ `'use client'` מ-T-143: § 4.2יד נותנת למסך **בחירה** — «האפשרות היא יעד מגע
 * ≥44px, ואחרי הבחירה מוצג הסבר קצר». ⛔ זו ⛔ אינה החלטת מסך של Dev, היא שורת
 * מפרט חתומה (D-078). ⛔ **ומה ש⛔ לא השתנה:** `phase` נשאר **פרופ** ⛔ ולא
 * `useState` — מה שמקדם את הלומד מ-ⓒ ל-ⓓ עדיין אינו במפרט, ו-F-099 נשאר פתוח.
 * המצב היחיד ברכיב הוא `selection`, וההכרעות עליו חיות ב-`lib/core/lesson.ts`.
```

ⓒ הוסף לייבוא:

```tsx
import { useState } from 'react';
import {
  EMPTY_LESSON_SELECTION,
  chooseInLesson,
  selectedChoiceId,
  whyForChoice,
  type LessonSelection,
} from '@/lib/core/lesson';
```

ⓓ בתוך `LessonScreen`, מיד לפני ה-`return`:

```tsx
  const [selection, setSelection] = useState<LessonSelection>(EMPTY_LESSON_SELECTION);
```

ⓔ החלף את **כל** בלוק `<ul className="flex list-none flex-col gap-2 p-0">…</ul>` הפנימי (רשימת האפשרויות) ב:

```tsx
                <div className="flex flex-col gap-2">
                  {item.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      data-lesson-choice
                      onClick={() => setSelection((current) => chooseInLesson(current, item.id, choice.id))}
                      className="flex min-h-touch w-full items-center rounded-lg border border-border-subtle px-4 py-3 text-start active:opacity-90"
                    >
                      <EnWord className="text-lg">{choice.text}</EnWord>
                    </button>
                  ))}
                </div>
```

ⓕ מיד **אחרי** ה-`</div>` הזה, בתוך אותו `<li>` של הפריט, הוסף את ההסבר. חשב אותו פעם אחת: הקדם לפני ה-`return` של ה-`map` את שתי השורות, כלומר הפוך את גוף ה-`map` של הפריטים ל-block:

```tsx
            {items.slice(0, LESSON_MAX_ITEMS).map((item) => {
              const why = whyForChoice(item.choices, selectedChoiceId(selection, item.id));
              return (
                <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border-subtle p-4">
                  <EnText segments={item.prompt} className="text-lg leading-relaxed" />
                  {/* … בלוק ה-<div> של האפשרויות מ-ⓔ … */}
                  {why !== null ? (
                    <p data-lesson-why className="text-base leading-relaxed text-ink-muted">
                      {why}
                    </p>
                  ) : null}
                </li>
              );
            })}
```

⛔ **`choice.why` ⛔ אינו מרונדר עוד בתוך הכפתור** — זה כל ההבדל בין «הסבר שנחשף» ל«פסקה שתמיד שם».

- [ ] **Step 9 — הרץ את שתי סוויטות הבדיקה**

Run: `npx vitest run components/LessonScreen.test.ts lib/core/lesson.test.ts`
Expected: PASS בשתיהן. ⚠️ אם «אפס תו עברי» נופלת — הכנסת מחרוזת עברית לרכיב; הסר אותה, ⛔ אל תחליש את הבדיקה.

- [ ] **Step 10 — הוסף את שער הגאומטריה ל-`check:mobile`**

ב-`scripts/verify-mobile.mjs`, מיד **אחרי** הבלוק `if (route === '/dev/deck/done') { … }` (סביב שורה 1392), הוסף:

```js
      // T-143 · § 4.2יד — «⛔ אין פריט תרגול בלי יעד מגע». שלוש טענות, וכולן
      // על פיקסלים ⛔ ולא על מרקאפ: האפשרויות קיימות, האגודל מגיע לכל אחת,
      // ו⛔ אין הסבר על המסך לפני שהלומד בחר (הסבר שמוצג תמיד אינו הסבר).
      if (route === '/dev/lesson') {
        const lesson = await page.evaluate(() => {
          const choices = [...document.querySelectorAll('main [data-lesson-choice]')];
          return {
            count: choices.length,
            small: choices.filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            }).length,
            whys: document.querySelectorAll('main [data-lesson-why]').length,
          };
        });
        check(
          lesson.count >= 3,
          `${at} the lesson offers at least 3 tappable choices`,
          `found ${lesson.count} [data-lesson-choice]`,
        );
        check(
          lesson.small === 0,
          `${at} every lesson choice clears ${MIN_TAP}px`,
          `${lesson.small} of ${lesson.count} are below the floor`,
        );
        check(
          lesson.whys === 0,
          `${at} no explanation is on screen before a choice is made`,
          `found ${lesson.whys} [data-lesson-why]`,
        );
      }
```

⛔ **אל תשתמש ב-`44` בתוך ה-`check` הראשון** — `MIN_TAP` הוא הקבוע, והוא כבר בהיקף.
⚠️ **הליטרל `44` בתוך `page.evaluate` הכרחי:** ה-callback רץ בדפדפן ו⛔ אינו רואה את הסקופ של Node.

- [ ] **Step 11 — הרץ את הארנס**

Run: `npm run check:mobile`
Expected: `✓` בכל שלושת הרוחבים, ובכללם תשע השורות החדשות (3 בדיקות × 320/375/414). ⛔ אפס `✗`.

- [ ] **Step 12 — הרץ את ארבע פקודות האימות**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: `tsc` 0 שגיאות · `/lib/core purity: OK` · כל הבדיקות ירוקות · `next build` יוצא 0.

- [ ] **Step 13 — קומיט**

```bash
git add lib/core/lesson.ts lib/core/lesson.test.ts components/LessonScreen.tsx \
        components/LessonScreen.test.ts scripts/verify-mobile.mjs
git commit -m "loop(DEV): T-143 מסך השיעור נעשה ניתן למענה — האפשרות היא כפתור 44px וההסבר נחשף אחרי בחירה"
```

---

## Task 2 — T-144 · `לימודים` נעשית מסך ארבעת המשטחים

**Files:**
- Create: `lib/core/surfaces.ts` · `lib/core/surfaces.test.ts`
- Create: `lib/supabase/stories.ts`
- Create: `lib/supabase/surfacesTouched.ts`
- Modify: `app/api/world/status/route.ts` (‏`readStories` יוצא לקובץ המשותף)
- Modify: `components/StudiesScreen.tsx` · `components/StudiesScreen.test.ts`
- Modify: `app/(tabs)/studies/page.tsx` · `app/dev/tabs/studies/page.tsx`
- Modify: `scripts/verify-mobile.mjs`

**Interfaces:**
- Consumes: מ-Task 1 — כלום. מ-`lib/core/worldApps.ts`: `WORLD_APP_LABEL_HE` · `WORLD_APP_HREF` · `LEARNING_PRIORITY` · `storiesTooFewNoteHe` (הפונקציה בשורה 98 שמחזירה «נדרשים N סיפורים ברמה שלך, יש M» — **בדוק את שמה המדויק ב-`lib/core/worldApps.ts` לפני השימוש** והשתמש בשם שקיים; ⛔ אל תיצור שנייה). מ-`lib/core/onboarding.ts`: `LEARNER_TIME_ZONE` · `toIsoDateInZone`.
- Produces:
```ts
// lib/core/surfaces.ts
export type SurfaceId = 'cards' | 'arena' | 'library' | 'compose';
export const SURFACE_LABEL_HE: Readonly<Record<SurfaceId, string>>;
export const SURFACE_HREF: Readonly<Record<SurfaceId, string>>;
export const NEGLECT_PRIORITY: readonly SurfaceId[];        // ['cards','arena','library','compose']
export const SURFACE_GRID_ORDER: readonly SurfaceId[];      // סדר התצוגה
export function neglectedSurface(input: {
  readonly touchedToday: readonly SurfaceId[];
  readonly unavailable: readonly SurfaceId[];
}): SurfaceId | null;
export function neglectHeadlineHe(surface: SurfaceId | null): string;

// lib/supabase/surfacesTouched.ts
export async function readSurfacesTouchedToday(
  supabase: SupabaseRouteClient, userId: string, dayStartIso: string,
): Promise<readonly SurfaceId[]>;

// lib/supabase/stories.ts
export async function readStoriesAtLevel(
  supabase: SupabaseRouteClient, userId: string,
): Promise<{ required: number; atLevel: number | null } | null>;
```

**Design note — מאין «נגעת היום», ⛔ ובלי עמודה חדשה (נמדד על הסכימה):**

| משטח | המקור הקיים | הקובץ |
|---|---|---|
| `cards` (כרטיסיות) | `word_progress.updated_at` | `0003b_provenance_telemetry.sql:95` |
| `compose` (הרכבה) | `world_posts.created_at` | `0007_world_schema.sql:46` |
| `arena` (זירה) | `arcade_runs.finished_at` | `0014_arcade.sql:57` |
| `library` (ספרייה) | **⛔ אין מסלול מוצר** — `/world/story` טרם קיים (T-136) ⇒ המשטח **לא זמין**, ומוצג עם המספר של `stories` ⛔ ולא «—» (§ 4.2יד · D-046) | `0018_stories.sql` |

⇒ **⛔ אפס `alter table` · אפס מדד חדש · אפס נקודת קצה חדשה** (T-144ⓓ). הקריאה יושבת ב-`app/(tabs)/studies/page.tsx`, שקורא לדאטהבייס כבר היום.

**Design note — סדר `NEGLECT_PRIORITY`, ⛔ ולמה הוא ⛔ אינו המצאה:**
§ 4.2יד נוקבת ב«המשטח שלא נגעת בו היום» ב**יחיד**, ו⛔ אינה אומרת מה קורה כששניים לא נגועים. הכלל שנבחר: `['cards', 'arena', 'library', 'compose']` — `cards` ראשון כי `/cards` הוא **הפעולה הראשית שהמסך הזה כבר משלח אליה היום** (`StudiesScreen.tsx`, `data-primary-action`), ושלושת הבאים הם `LEARNING_PRIORITY` מ-`lib/core/worldApps.ts` בסדרם (‏`arcade`→`arena` · `library` · `compose`), בהשמטת `collected` שאינו משטח למידה. ⛔ **הפער עצמו נרשם כ-`F-118` נגד ה-PM** (בהמשך התוכנית) ⛔ ואינו חוסם.

- [ ] **Step 1 — אמת את שמות המקור לפני שאתה כותב שורה**

Run: `grep -n "סיפורים ברמה שלך\|export function\|export const" lib/core/worldApps.ts | head -30`
רשום לעצמך את **השם המדויק** של הפונקציה שמחזירה «נדרשים N סיפורים ברמה שלך, יש M» ואת השם המדויק של `LEARNING_PRIORITY`. ⛔ אל תנחש שם ו⛔ אל תיצור מחרוזת שנייה.

- [ ] **Step 2 — כתוב את הבדיקה הנופלת של השכבה הטהורה**

צור `lib/core/surfaces.test.ts` (החלף `storiesTooFewNoteHe` בשם שמצאת בצעד 1, אם הוא שונה):

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  NEGLECT_PRIORITY,
  SURFACE_GRID_ORDER,
  SURFACE_HREF,
  SURFACE_LABEL_HE,
  neglectHeadlineHe,
  neglectedSurface,
  type SurfaceId,
} from './surfaces';
import { WORLD_APP_HREF, WORLD_APP_LABEL_HE } from './worldApps';

const ALL: readonly SurfaceId[] = ['cards', 'arena', 'library', 'compose'];

describe('ארבעת המשטחים — T-144 · § 4.2יד', () => {
  it('ארבעה משטחים בדיוק, ⛔ ולא שלושה ולא חמישה', () => {
    expect(SURFACE_GRID_ORDER.length).toBe(4);
    expect([...SURFACE_GRID_ORDER].sort()).toEqual([...ALL].sort());
    expect([...NEGLECT_PRIORITY].sort()).toEqual([...ALL].sort());
  });

  it('⛔ אין הגדרה שנייה לתווית או ליעד — שלושה מהם באים מ-`worldApps`', () => {
    expect(SURFACE_LABEL_HE.compose).toBe(WORLD_APP_LABEL_HE.compose);
    expect(SURFACE_LABEL_HE.arena).toBe(WORLD_APP_LABEL_HE.arcade);
    expect(SURFACE_LABEL_HE.library).toBe(WORLD_APP_LABEL_HE.library);
    expect(SURFACE_HREF.compose).toBe(WORLD_APP_HREF.compose);
    expect(SURFACE_HREF.arena).toBe(WORLD_APP_HREF.arcade);
    expect(SURFACE_HREF.library).toBe(WORLD_APP_HREF.library);
  });

  it('«כרטיסיות» היא בדיוק התווית שהסרגל כבר משלם עליה — ⛔ ולא מילה נרדפת', () => {
    const tabBar = readFileSync('components/TabBar.tsx', 'utf8');
    expect(tabBar, 'the tab and the surface must be the same word').toContain(SURFACE_LABEL_HE.cards);
    expect(SURFACE_HREF.cards).toBe('/cards');
  });

  it('נגעת בכולם ⇒ ⛔ אין משטח מוזנח', () => {
    expect(neglectedSurface({ touchedToday: ALL, unavailable: [] })).toBeNull();
  });

  it('משטח שאינו זמין ⛔ אינו מוצע — גם כשלא נגעת בו', () => {
    expect(
      neglectedSurface({ touchedToday: ['cards', 'arena'], unavailable: ['library'] }),
    ).toBe('compose');
  });

  it('שניים לא נגועים ⇒ נבחר הראשון בסדר, ⛔ ולא בהגרלה', () => {
    const twice = () => neglectedSurface({ touchedToday: ['cards'], unavailable: [] });
    expect(twice()).toBe('arena');
    expect(twice()).toBe('arena');
  });

  it('לא נגעת בכלום ⇒ `cards` — הפעולה שהמסך כבר משלח אליה', () => {
    expect(neglectedSurface({ touchedToday: [], unavailable: [] })).toBe('cards');
  });

  it('הכותרת נוקבת בשם המשטח, ו⛔ אין כותרת של «כלום» בלי משטח', () => {
    expect(neglectHeadlineHe('compose')).toContain(SURFACE_LABEL_HE.compose);
    expect(neglectHeadlineHe(null)).not.toContain('undefined');
    expect(neglectHeadlineHe(null).length).toBeGreaterThan(0);
  });

  it('⛔ אפס מדד משחוק בקוד המקור (D-050 · R-012 · T-032)', () => {
    const src = readFileSync('lib/core/surfaces.ts', 'utf8');
    for (const banned of ['נקודות', 'XP', 'רצף יומי', 'מטבע', 'לוח תוצאות']) {
      expect(src, `${banned} is a D-050 metric`).not.toContain(banned);
    }
    expect(src, 'D-046 · D-082: an em dash is never an unlock condition').not.toContain('—');
  });
});
```

- [ ] **Step 3 — הרץ ואמת שהיא נופלת**

Run: `npx vitest run lib/core/surfaces.test.ts`
Expected: FAIL — `Failed to resolve import "./surfaces"`.

- [ ] **Step 4 — כתוב את המודול הטהור**

צור `lib/core/surfaces.ts`:

```ts
/**
 * ‏T-144 · § 4.2יד · D-083 — ארבעת משטחי הלמידה שכבר בנינו, ובחירת המוזנח.
 *
 * ⛔ טהור: אפס React · DOM · שעון · רשת · env. «היום» מגיע כארגומנט מהעמוד,
 * שקורא את השעון באזור הזמן של הלומד (`LEARNER_TIME_ZONE`).
 *
 * ⛔ **אפס משחוק:** אין כאן נקודות, מטבע, XP, לוח תוצאות ורצף — D-050 מדד
 * g=0.840 בלי ניקוד מול g=0.340 עם, ו-R-012 מדד נטישה על כל אלמנט לחץ.
 * הפלט היחיד הוא **משוב כשירות**: שם המשטח שלא נגעת בו היום.
 *
 * ⛔ **ואין כאן «רצועות» ואין יחס זמן:** § 4.2יד קובעת שבלי קריאה חוזרת של S15
 * המסך מדבר על **ארבעת המשטחים שלנו בשמם**. ⛔ שם רצועה מהזיכרון אסור.
 * ⚠️ M7 (Webb 2008): המנגנון מאזן **פעילויות**, ⛔ ולא חזרות על אותה מילה.
 */
import { WORLD_APP_HREF, WORLD_APP_LABEL_HE } from './worldApps';

export type SurfaceId = 'cards' | 'arena' | 'library' | 'compose';

/** «כרטיסיות» ⛔ אינו במפת `worldApps` — הוא לשונית, והשער ב-`surfaces.test.ts`
 *  אוכף שהמחרוזת זהה לזו שב-`components/TabBar.tsx`. */
const CARDS_LABEL_HE = 'כרטיסיות';

export const SURFACE_LABEL_HE: Readonly<Record<SurfaceId, string>> = {
  cards: CARDS_LABEL_HE,
  arena: WORLD_APP_LABEL_HE.arcade,
  library: WORLD_APP_LABEL_HE.library,
  compose: WORLD_APP_LABEL_HE.compose,
};

export const SURFACE_HREF: Readonly<Record<SurfaceId, string>> = {
  cards: '/cards',
  arena: WORLD_APP_HREF.arcade,
  library: WORLD_APP_HREF.library,
  compose: WORLD_APP_HREF.compose,
};

/** סדר התצוגה: הלשונית הקיימת ראשונה, ואז סדר הפתיחה של הרשת. */
export const SURFACE_GRID_ORDER: readonly SurfaceId[] = ['cards', 'compose', 'arena', 'library'];

/**
 * הסדר שבו נבחר המוזנח. ⛔ ⛔ הגרלה ו⛔ ⛔ שעון — פונקציה של הארגומנטים בלבד.
 * ‏`cards` ראשון כי `/cards` הוא הפעולה הראשית שהמסך הזה כבר משלח אליה היום;
 * השלושה הבאים הם `LEARNING_PRIORITY` (‏`lib/core/worldApps.ts`) בסדרם, בלי
 * `collected` שאינו משטח למידה. ⚠️ הפער — «מה כששניים לא נגועים» ⛔ אינו במפרט —
 * נרשם כ-F-118 נגד ה-PM.
 */
export const NEGLECT_PRIORITY: readonly SurfaceId[] = ['cards', 'arena', 'library', 'compose'];

export function neglectedSurface(input: {
  readonly touchedToday: readonly SurfaceId[];
  readonly unavailable: readonly SurfaceId[];
}): SurfaceId | null {
  const touched = new Set(input.touchedToday);
  const blocked = new Set(input.unavailable);
  return NEGLECT_PRIORITY.find((id) => !touched.has(id) && !blocked.has(id)) ?? null;
}

const ALL_TOUCHED_HE = 'היום נגעת בכל ארבעת המשטחים.';

/** ⛔ «היום לא ...» ⛔ ולא «אתה מזניח»: משוב כשירות ⛔ אינו נזיפה (D-050). */
export function neglectHeadlineHe(surface: SurfaceId | null): string {
  if (surface === null) return ALL_TOUCHED_HE;
  return `היום עוד לא היית ב${SURFACE_LABEL_HE[surface]}.`;
}
```

⚠️ **בדוק ש-`ALL_TOUCHED_HE` ו-`neglectHeadlineHe` ⛔ אינם מכילים `—`** — הבדיקה בצעד 2 אוכפת זאת.

- [ ] **Step 5 — הרץ ואמת שהיא עוברת + הרץ את שער הטוהר**

Run: `npx vitest run lib/core/surfaces.test.ts && npm run check:core`
Expected: 9 בדיקות ירוקות · `/lib/core purity: OK`

- [ ] **Step 6 — קומיט ביניים**

```bash
git add lib/core/surfaces.ts lib/core/surfaces.test.ts
git commit -m "loop(DEV): T-144ⓐ השכבה הטהורה של ארבעת המשטחים ובחירת המוזנח"
```

- [ ] **Step 7 — הוצא את `readStories` לקובץ משותף (⛔ בלי לשנות התנהגות)**

צור `lib/supabase/stories.ts` והעבר אליו את הפונקציה `readStories` מ-`app/api/world/status/route.ts` **מילה במילה**, בשינויים הבאים בלבד: שמה `readStoriesAtLevel`, היא מיוצאת, קידומת הלוג נעשית `[stories]`, וה-imports (`parseLevel` מ-`@/lib/core/levelSummary`, `STORIES_REQUIRED` — **השתמש בשם שמיובא היום ב-`world/status/route.ts`**, `createRouteClient` מ-`@/lib/supabase/auth`) נלקחים מאותם מקורות. השאר את כל בלוקי ההערה כלשונם — הם מתעדים למה הכישלון רך.

ב-`app/api/world/status/route.ts`: מחק את גוף `readStories`, והחלף את הקריאה אליה ב-`readStoriesAtLevel(supabase, user.id)` עם ייבוא מ-`@/lib/supabase/stories`.

- [ ] **Step 8 — הרץ את סוויטת `world/status` ואמת שאין רגרסיה**

Run: `npx vitest run app/api/world && npm run typecheck`
Expected: PASS · 0 שגיאות טיפוס. ⚠️ אם בדיקה קיימת סורקת את מקור `route.ts` ומחפשת `readStories` — עדכן אותה לשם החדש ו⛔ אל תמחק את האסרציה.

- [ ] **Step 9 — כתוב את קורא «נגעת היום»**

צור `lib/supabase/surfacesTouched.ts`:

```ts
/**
 * ‏T-144 — «באילו משטחים הלומד נגע היום», משלוש עמודות **שכבר קיימות**.
 *
 * ⛔ אפס עמודה חדשה · אפס טבלה חדשה · אפס מדד חדש (T-144ⓓ):
 *   כרטיסיות → `word_progress.updated_at`   (0003b)
 *   הרכבה    → `world_posts.created_at`     (0007)
 *   זירה     → `arcade_runs.finished_at`    (0014)
 * «הספרייה» ⛔ אינה כאן: `/world/story` טרם קיים (T-136), ולכן היא **לא זמינה**
 * ⛔ ולא «לא נגעת בה» — שני מצבים שונים, והמסך מציג לה מספר (§ 4.2יד · D-046).
 *
 * ⛔ **כישלון קריאה ⛔ אינו 503 ו⛔ אינו «לא נגעת».** הוא יורד ללוג והמשטח
 * מושמט מהרשימה — כלומר במקרה הגרוע המסך מציע משטח שהלומד כבר ביקר בו היום.
 * זו הטעות הזולה; «נגעת בהכל» על קריאה שנפלה היה מסתיר מהלומד את כל המסך.
 *
 * `dayStartIso` מגיע מהקורא — השעון נשאר בקצה (‏`LEARNER_TIME_ZONE`).
 */
import type { SurfaceId } from '@/lib/core/surfaces';
import type { createRouteClient } from '@/lib/supabase/auth';

type RouteClient = ReturnType<typeof createRouteClient>;

const PROBES: readonly {
  readonly surface: SurfaceId;
  readonly table: string;
  readonly column: string;
}[] = [
  { surface: 'cards', table: 'word_progress', column: 'updated_at' },
  { surface: 'compose', table: 'world_posts', column: 'created_at' },
  { surface: 'arena', table: 'arcade_runs', column: 'finished_at' },
];

export async function readSurfacesTouchedToday(
  supabase: RouteClient,
  userId: string,
  dayStartIso: string,
): Promise<readonly SurfaceId[]> {
  const touched: SurfaceId[] = [];
  for (const probe of PROBES) {
    // `head: true` — הקיום הוא כל התשובה, ⛔ ואין שורה על החוט.
    const { count, error } = await supabase
      .from(probe.table)
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte(probe.column, dayStartIso)
      .limit(1);
    if (error) {
      console.error(`[surfacesTouched] ${probe.table} read failed:`, error.message);
      continue;
    }
    if ((count ?? 0) > 0) touched.push(probe.surface);
  }
  return touched;
}
```

⚠️ **אמת ש-`world_posts` נושא `user_id`** — Run: `grep -n "user_id" supabase/migrations/0007_world_schema.sql | head`. אם השם שונה, תקן את `PROBES` ואת `select`/`eq` בהתאם, ⛔ ואל תשאיר שם מנוחש.

- [ ] **Step 10 — כתוב את הבדיקה הנופלת של הרכיב**

ב-`components/StudiesScreen.test.ts`, הוסף `describe` בסוף הקובץ:

```ts
describe('T-144 · § 4.2יד — ארבעת המשטחים', () => {
  it('ארבעת המשטחים מגיעים מהשכבה הטהורה, ⛔ ואינם כתובים ברכיב', () => {
    expect(CODE).toContain("from '@/lib/core/surfaces'");
    expect(CODE).toContain('SURFACE_GRID_ORDER');
    expect(CODE).toContain('SURFACE_LABEL_HE');
    expect(CODE).toContain('SURFACE_HREF');
  });

  it('⛔ אפס מדד משחוק על המסך (D-050 · R-012 · T-032)', () => {
    for (const banned of ['נקודות', 'XP', 'רצף יומי', 'מטבע', 'לוח תוצאות']) {
      expect(CODE, `${banned} is a D-050 metric`).not.toContain(banned);
    }
  });

  it('⛔ אפס «—» כתנאי פתיחה (D-046 · D-082)', () => {
    expect(CODE, 'a locked surface carries a number, never an em dash').not.toContain('—');
  });

  it('משטח לא זמין מקבל את משפט המספר ⛔ ואינו קישור', () => {
    expect(CODE).toContain('data-surface');
    expect(CODE).toMatch(/unavailable/);
  });

  it('המשטח המוזנח נוקב בשם, וההכרעה ⛔ אינה משוכפלת ב-JSX', () => {
    expect(CODE).toContain('neglectHeadlineHe');
    expect(CODE).not.toContain('NEGLECT_PRIORITY');
  });
});
```

⚠️ **אם `components/StudiesScreen.test.ts` ⛔ אינו מגדיר `CODE`** — העתק את שלוש השורות של `withoutComments` מ-`components/LessonScreen.test.ts` לראש הקובץ, בדיוק כלשונן.

- [ ] **Step 11 — הרץ ואמת שהיא נופלת**

Run: `npx vitest run components/StudiesScreen.test.ts`
Expected: FAIL — `expected … to contain "from '@/lib/core/surfaces'"`.

- [ ] **Step 12 — כתוב את הרכיב**

החלף את גוף `components/StudiesScreen.tsx` ב:

```tsx
/**
 * גוף לשונית `לימודים` — T-144 · § 4.2יד · D-077 · D-083.
 *
 * ⛔ אפס קריאת סשן ואפס גישה לדאטהבייס: הכל מגיע כפרופים מ-`app/(tabs)/studies`,
 * וזה מה שמאפשר לפיקסטורה `/dev/tabs/studies` להיות **אותו מרקאפ** (F-027 סיבה 2).
 *
 * ⛔ **אפס נקודות · מטבע · XP · לוח תוצאות · רצף** (D-050 · R-012 · T-032).
 * המספר היחיד שזז הוא זה שכבר קיים במוצר, וההודעה היחידה היא **משוב כשירות**.
 *
 * ⛔ **ואין כאן «רצועות»** — § 4.2יד: בלי קריאה חוזרת של S15 המסך מדבר על
 * ארבעת המשטחים שלנו בשמם.
 */
import Link from 'next/link';

import {
  SURFACE_GRID_ORDER,
  SURFACE_HREF,
  SURFACE_LABEL_HE,
  neglectHeadlineHe,
  type SurfaceId,
} from '@/lib/core/surfaces';

export interface StudiesScreenProps {
  readonly headline: string;
  /** המשטח שהמסך נוקב בו. `null` ⇒ נגעת בכולם. */
  readonly neglected: SurfaceId | null;
  /** משטח → המשפט שמסביר למה אינו זמין, **עם מספר** (D-046). ⛔ ללא «—». */
  readonly unavailable: Readonly<Partial<Record<SurfaceId, string>>>;
}

export default function StudiesScreen({
  headline,
  neglected,
  unavailable,
}: StudiesScreenProps): React.JSX.Element {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">{headline}</h1>

      <p data-studies-neglect className="text-lg leading-relaxed text-ink">
        {neglectHeadlineHe(neglected)}
      </p>

      <ul className="flex list-none flex-col gap-3 p-0">
        {SURFACE_GRID_ORDER.map((id) => {
          const note = unavailable[id] ?? null;
          return (
            <li key={id} data-surface={id}>
              {note === null ? (
                <Link
                  href={SURFACE_HREF[id]}
                  {...(id === neglected ? { 'data-primary-action': 'true' } : {})}
                  className={
                    id === neglected
                      ? 'flex min-h-touch w-full items-center justify-between rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90'
                      : 'flex min-h-touch w-full items-center justify-between rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90'
                  }
                >
                  {SURFACE_LABEL_HE[id]}
                </Link>
              ) : (
                <div className="flex min-h-touch flex-col justify-center rounded-lg border border-border-subtle px-5 py-3">
                  <span className="text-lg text-ink-muted">{SURFACE_LABEL_HE[id]}</span>
                  <span className="text-base text-ink-muted">{note}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

⚠️ **פעולה ראשית אחת בדיוק:** `data-primary-action` יושב על **המשטח המוזנח בלבד**. כש-`neglected === null` ⛔ **אין** פעולה ראשית, והשער `exactly one primary action` ב-`check:mobile` ייפול. ⇒ **הפיקסטורה חייבת לתת `neglected` שאינו `null`** (צעד 14), וזה גם המצב הכן: לומד שנגע בכל הארבעה ⛔ אינו צריך שנשלח אותו לחמישי.

- [ ] **Step 13 — חבר את העמוד האמיתי**

ב-`app/(tabs)/studies/page.tsx`, אחרי חישוב `headline` והשורה `const today = …`, הוסף:

```tsx
  // תחילת היום של הלומד, ⛔ ולא חצות UTC: הוא לומד ביום הישראלי (C-0032).
  // `today` הוא כבר YYYY-MM-DD באזור שלו, ולכן זו המרה ⛔ ולא קריאת שעון שנייה.
  const dayStartIso = new Date(`${today}T00:00:00${jerusalemOffset(today)}`).toISOString();

  const touchedToday = await readSurfacesTouchedToday(supabase, user.id, dayStartIso);
  const stories = await readStoriesAtLevel(supabase, user.id);

  // «הספרייה» ⛔ אינה זמינה עד T-136, ומוצגת **עם מספר** ⛔ ולא «—» (§ 4.2יד).
  const unavailable: Partial<Record<SurfaceId, string>> = {
    library:
      stories === null
        ? storiesTooFewNoteHe(STORIES_PER_LEVEL, 0)
        : storiesTooFewNoteHe(stories.required, stories.atLevel ?? 0),
  };

  const neglected = neglectedSurface({ touchedToday, unavailable: ['library'] });

  return <StudiesScreen headline={headline} neglected={neglected} unavailable={unavailable} />;
```

⚠️ **`jerusalemOffset` ⛔ אינו קיים ו⛔ אין להמציא אותו.** במקומו השתמש בהמרה שאין בה הזחה ידנית — הוסף ל-`lib/core/onboarding.ts` **פונקציה טהורה אחת**:

```ts
/** תחילת היום `isoDate` באזור `timeZone`, כרגע UTC. ⛔ אפס טבלת הזחות בקוד:
 *  ההזחה נמדדת מהאזור עצמו דרך `Intl`, ולכן שעון קיץ ⛔ אינו שובר אותה. */
export function zonedDayStart(isoDate: string, timeZone: string): Date {
  const guess = new Date(`${isoDate}T00:00:00Z`);
  const seen = new Date(
    new Intl.DateTimeFormat('en-US', {
      timeZone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(guess).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6Z'),
  );
  return new Date(guess.getTime() - (seen.getTime() - guess.getTime()));
}
```

והוסף ל-`lib/core/onboarding.test.ts` בדיקה נופלת **לפני** המימוש:

```ts
it('תחילת היום היא חצות בירושלים, ⛔ ולא חצות UTC', () => {
  // 2026-08-23 בישראל הוא UTC+3 ⇒ חצות מקומית = 21:00Z של היום הקודם.
  expect(zonedDayStart('2026-08-23', 'Asia/Jerusalem').toISOString())
    .toBe('2026-08-22T21:00:00.000Z');
  // ובחורף UTC+2 ⇒ 22:00Z.
  expect(zonedDayStart('2026-01-15', 'Asia/Jerusalem').toISOString())
    .toBe('2026-01-14T22:00:00.000Z');
});
```

ואז בעמוד: `const dayStartIso = zonedDayStart(today, LEARNER_TIME_ZONE).toISOString();`

- [ ] **Step 14 — עדכן את הפיקסטורה**

ב-`app/dev/tabs/studies/page.tsx`, החלף את הרינדור ב:

```tsx
/** ⛔ ערכים קבועים ⛔ ולא קריאה: פיקסטורה שתלויה ביום שבו היא רצה הופכת את
 *  מספרי הארנס לבלתי-משוחזרים. הבחירה כאן מודדת את ההרכב **הגבוה ביותר**:
 *  משטח מוזנח קיים (⇒ פעולה ראשית אחת) ומשטח לא-זמין עם משפט מספר. */
const SAMPLE_NEGLECTED = 'compose' as const;
const SAMPLE_UNAVAILABLE = { library: 'נדרשים 3 סיפורים ברמה שלך, יש 1' } as const;

export default function DevTabsStudiesPage() {
  return (
    <>
      <StudiesScreen
        headline={daysUntilExamHe(daysUntilExam(SAMPLE_EXAM_DATE, SAMPLE_TODAY))}
        neglected={SAMPLE_NEGLECTED}
        unavailable={SAMPLE_UNAVAILABLE}
      />
      <TabBar />
    </>
  );
}
```

⚠️ **המחרוזת בפיקסטורה ⛔ אינה תוכן לימודי** — היא משפט המבנה של D-046, זהה לנוסח שהפונקציה מייצרת.
⚠️ **`FLOW_ARRIVAL['/dev/tabs/studies']` ב-`scripts/verify-mobile.mjs` מצפה שהפעולה הראשית תוביל ל-`/login`** (‏`/cards` נחסם ב-`proxy.ts` בלי env). ‏`SAMPLE_NEGLECTED = 'compose'` שולח ל-`/world/compose` ⇒ **בדוק ב-`proxy.ts` אם `/world/compose` ב-`PROTECTED_SCREENS`.** אם כן — הרשומה נשארת כלשונה. אם לא — שנה את `SAMPLE_NEGLECTED` ל-`'cards'` (‏`/cards` מוגן בוודאות, וזה בדיוק מה שהרשומה מתעדת). ⛔ **אל תחליש את הרשומה ב-`FLOW_ARRIVAL`.**

- [ ] **Step 15 — הוסף את שער התוכן ל-`check:mobile`**

ב-`scripts/verify-mobile.mjs`, בתוך הבלוק הקיים שמטפל ב-`TAB_ROUTES` (או מיד אחרי בלוק `/dev/lesson` מ-Task 1), הוסף:

```js
      // T-144 · D-077 — «מסך הנחיתה ⛔ אינו כפתור». שתי טענות שאי-אפשר לרצות
      // בלי תוכן אמיתי: הטקסט המרונדר, ⛔ ולא המרקאפ, ומספר היעדים שאפשר לצאת
      // אליהם. 116 תווים ופעולה אחת הם המדידה שפתחה את D-077.
      if (route === '/dev/tabs/studies') {
        const studies = await page.evaluate(() => ({
          chars: (document.querySelector('main')?.textContent ?? '').trim().length,
          exits: document.querySelectorAll('main a[href], main [data-surface]').length,
          surfaces: document.querySelectorAll('main [data-surface]').length,
        }));
        check(
          studies.chars >= 400,
          `${at} the לימודים tab carries real content`,
          `${studies.chars} chars of rendered text — D-077 measured 116`,
        );
        check(
          studies.surfaces === 4,
          `${at} all four learning surfaces are on the screen`,
          `found ${studies.surfaces} [data-surface]`,
        );
      }
```

- [ ] **Step 16 — הרץ את הארנס**

Run: `npm run check:mobile`
Expected: `✓` בשלושת הרוחבים. ⚠️ אם `the לימודים tab carries real content` נופלת ב-`chars` — ⛔ **אל תרפד במחרוזות**; הוסף למשטחים את המשפט המסביר שכבר קיים (‏`unavailable`) או בדוק שהפיקסטורה באמת מרנדרת את ארבעתם.

- [ ] **Step 17 — הרץ את ארבע פקודות האימות**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: `tsc` 0 שגיאות · `/lib/core purity: OK` · הכל ירוק · `next build` יוצא 0.

- [ ] **Step 18 — קומיט**

```bash
git add lib/core/surfaces.ts lib/core/surfaces.test.ts lib/core/onboarding.ts \
        lib/core/onboarding.test.ts lib/supabase/stories.ts lib/supabase/surfacesTouched.ts \
        app/api/world/status/route.ts components/StudiesScreen.tsx \
        components/StudiesScreen.test.ts "app/(tabs)/studies/page.tsx" \
        app/dev/tabs/studies/page.tsx scripts/verify-mobile.mjs
git commit -m "loop(DEV): T-144 לימודים נעשית מסך ארבעת המשטחים — משוב כשירות בלי ניקוד"
```

---

## Task 3 — T-145 · `אני` מקבלת פעולה אמיתית

**Files:**
- Modify: `components/MeScreen.tsx`
- Modify/Create: `components/MeScreen.test.ts`
- Modify: `app/(tabs)/me/page.tsx` · `app/dev/tabs/me/page.tsx`

**Interfaces:**
- Consumes: מ-Task 2 — `SurfaceId` · `SURFACE_HREF` · `SURFACE_LABEL_HE` · `neglectedSurface` · `readSurfacesTouchedToday` · `readStoriesAtLevel` · `zonedDayStart`. מהקיים — `summarizeLevel`/`LevelSummary` ב-`lib/core/levelSummary.ts`.
- Produces: `MeScreen` מקבל שני פרופים נוספים:
```ts
readonly neglected: SurfaceId | null;
readonly levelCounts: { readonly level: string; readonly known: number;
  readonly inReviewList: number; readonly unseen: number } | null;
```

**⚠️ פער מדידה שנמדד ו⛔ אינו נפתר כאן (נרשם כ-`F-117`):**
שורת T-145 מבקשת «`check:mobile` ⇒ פעולה ראשית עדיין קיימת בצפייה הראשונה». נמדד: `scripts/verify-mobile.mjs:177` — `PRIMARY_ACTION_ROUTES = [...FLOW_ROUTES, '/dev/tabs/studies', '/dev/tabs/cards']`, ו-`/dev/tabs/me` ⛔ **אינו שם**, וההערה בשורות 174-175 אומרת מפורשות: «⛔ `/dev/tabs/me` ⛔ אינו כאן ובכוונה … והשלישית היא שורת משימה של ה-PM ⛔ ולא הרחבה שסוכן מוסיף לעצמו». ⇒ ⛔ **אל תוסיף את המסלול לרשימה.** האימות במשימה הזאת הוא **סריקת מקור** (צעד 1), והפער נרשם ל-PM.

- [ ] **Step 1 — כתוב את הבדיקות הנופלות**

ב-`components/MeScreen.test.ts` (אם אינו קיים — צור אותו עם אותו ראש `readFileSync`/`withoutComments` כמו `components/LessonScreen.test.ts`, על `components/MeScreen.tsx`), הוסף:

```ts
describe('T-145 · § 4.2טז — הפעולה הראשית מפסיקה להיות היציאה', () => {
  it('⛔ `data-primary-action` ⛔ אינו על כפתור היציאה', () => {
    const logout = CODE.slice(CODE.indexOf('action="/logout"'));
    expect(logout, 'signing out is not the main thing to do here').not.toContain(
      'data-primary-action',
    );
  });

  it('היציאה נשארת במסך — ⛔ ואינה מוסרת (F-027)', () => {
    expect(CODE).toContain('action="/logout"');
    expect(CODE).toContain('SIGN_OUT_HE');
  });

  it('הפעולה הראשית היא המשך למידה, מאותה גוזרת של T-144', () => {
    expect(CODE).toContain("from '@/lib/core/surfaces'");
    expect(CODE).toContain('SURFACE_HREF');
    const primary = CODE.slice(CODE.indexOf('data-primary-action'));
    expect(primary.slice(0, 400)).toContain('SURFACE_HREF');
  });

  it('שלוש הספירות של D-034 מוצגות, ⛔ ואף אחת ⛔ אינה מחושבת כאן', () => {
    for (const field of ['known', 'inReviewList', 'unseen']) {
      expect(CODE, `${field} is not rendered`).toContain(field);
    }
    expect(CODE).not.toContain('classifyProgress');
    expect(CODE).not.toContain('summarizeLevel');
  });

  it('⛔ אין הערכת מוכנות ואין ציון חזוי (§ 4.4.3)', () => {
    for (const banned of ['מוכנות', 'ציון חזוי', 'צפוי']) {
      expect(CODE, `${banned} has no measurement behind it`).not.toContain(banned);
    }
  });
});
```

- [ ] **Step 2 — הרץ ואמת שהיא נופלת**

Run: `npx vitest run components/MeScreen.test.ts`
Expected: FAIL — הבדיקה הראשונה נופלת (`data-primary-action` יושב היום בתוך בלוק ה-`form`).

- [ ] **Step 3 — עדכן את הרכיב**

ב-`components/MeScreen.tsx`:

ⓐ הוסף לייבוא:

```tsx
import {
  SURFACE_HREF,
  SURFACE_LABEL_HE,
  type SurfaceId,
} from '@/lib/core/surfaces';
```

ⓑ הוסף שתי קבועות עברית ליד הקיימות:

```tsx
const CONTINUE_PREFIX_HE = 'המשך ל';
const LEVEL_KNOWN_HE = 'ידוע';
const LEVEL_IN_REVIEW_HE = 'ברשימת החזרה';
const LEVEL_UNSEEN_HE = 'טרם נראה';
```

ⓒ הרחב את חתימת הפרופים:

```tsx
export interface LevelCounts {
  readonly level: string;
  readonly known: number;
  readonly inReviewList: number;
  readonly unseen: number;
}

export default function MeScreen({
  wordsLearned,
  goal,
  neglected,
  levelCounts,
}: {
  wordsLearned: number | null;
  goal: LearnerGoal;
  neglected: SurfaceId | null;
  levelCounts: LevelCounts | null;
}): React.JSX.Element {
```

ⓓ מיד אחרי בלוק `wordsLearned`, הוסף את שלוש הספירות (⛔ מוסתרות לגמרי כש-`null` — כותרת מעל אזור ריק היא F-011 בשם אחר, בדיוק כמו `data-goal-block`):

```tsx
      {levelCounts !== null && (
        <section className="flex flex-col gap-1" data-level-counts>
          <h2 className="text-lg font-semibold text-ink">{levelCounts.level}</h2>
          <p className="text-lg text-ink-muted">
            {LEVEL_KNOWN_HE}: {levelCounts.known}
          </p>
          <p className="text-lg text-ink-muted">
            {LEVEL_IN_REVIEW_HE}: {levelCounts.inReviewList}
          </p>
          <p className="text-lg text-ink-muted">
            {LEVEL_UNSEEN_HE}: {levelCounts.unseen}
          </p>
        </section>
      )}
```

ⓔ מיד **לפני** הקישור ל-`/sources`, הוסף את הפעולה הראשית:

```tsx
      {neglected !== null && (
        <Link
          href={SURFACE_HREF[neglected]}
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          {CONTINUE_PREFIX_HE}
          {SURFACE_LABEL_HE[neglected]}
        </Link>
      )}
```

ⓕ **הסר** את `data-primary-action="true"` מכפתור ה-`<button type="submit">` שבתוך `<form action="/logout">`, ⛔ **בלי לגעת בשום דבר אחר בטופס**. עדכן את בלוק ההערה שמעליו והוסף שורה:

```
      ⚠️ T-145 · D-079: `data-primary-action` ירד מכאן. הפעולה הבולטת בלשונית
      הפרופיל ⛔ אינה «לעזוב», והשער ⛔ אינו סיבה לסמן מסך ריק — נתנו למסך
      פעולה אמיתית במקום לפתוח את השער.
```

- [ ] **Step 4 — הרץ ואמת שהיא עוברת**

Run: `npx vitest run components/MeScreen.test.ts`
Expected: PASS — 5 בדיקות.

- [ ] **Step 5 — חבר את העמוד האמיתי**

ב-`app/(tabs)/me/page.tsx`, אחרי קריאת ה-`profile`, הוסף:

```tsx
  const today = toIsoDateInZone(new Date(), LEARNER_TIME_ZONE);
  const dayStartIso = zonedDayStart(today, LEARNER_TIME_ZONE).toISOString();
  const touchedToday = await readSurfacesTouchedToday(supabase, user.id, dayStartIso);
  // «הספרייה» לא זמינה עד T-136 — אותו קלט בדיוק שהמסך `לימודים` מקבל,
  // ⛔ ולא גוזרת שנייה (§ 4.2טז: «אותה גוזרת של T-144»).
  const neglected = neglectedSurface({ touchedToday, unavailable: ['library'] });
```

ולשלוש הספירות — קרא ל-`GET /api/levels/summary` **לא** מהעמוד; במקום זה חזור על הדפוס שכבר קיים בעמוד: שליפת `word_progress` ובניית `summarizeLevel`. ⚠️ **⛔ אל תשכפל את הלוגיקה** — פתח את `app/api/levels/summary/route.ts`, העתק את **הבלוק המדויק** של `PROGRESS_SELECT` · `bandOf` · `MAX_PROGRESS_ROWS` לקובץ משותף `lib/supabase/levelProgress.ts` ויצא ממנו `readLevelSummary(supabase, userId)`, ואז קרא לו **משני המקומות**. ⛔ שתי הגדרות מקבילות של אותה ספירה הן בדיוק מה ש-§ 4.2ז אוסר.

לבסוף:

```tsx
  return (
    <MeScreen
      wordsLearned={…}
      goal={…}
      neglected={neglected}
      levelCounts={levelCounts}
    />
  );
```

- [ ] **Step 6 — עדכן את הפיקסטורה**

ב-`app/dev/tabs/me/page.tsx` הוסף שני קבועים ומסור אותם:

```tsx
/** ⛔ ערכים קבועים ⛔ ולא קריאה — ההרכב הגבוה ביותר של המסך נמדד. */
const SAMPLE_NEGLECTED = 'cards' as const;
const SAMPLE_LEVEL_COUNTS = { level: 'A2', known: 189, inReviewList: 18, unseen: 108 } as const;

export default function DevTabsMePage() {
  return (
    <>
      <MeScreen
        wordsLearned={SAMPLE_WORDS_LEARNED}
        goal={SAMPLE_GOAL}
        neglected={SAMPLE_NEGLECTED}
        levelCounts={SAMPLE_LEVEL_COUNTS}
      />
      <TabBar />
    </>
  );
}
```

- [ ] **Step 7 — הרץ את הארנס**

Run: `npm run check:mobile`
Expected: `✓` בשלושת הרוחבים. ⚠️ המסך גדל — אם `no horizontal scroll at 320px` או שער גובה כלשהו נופל, **תקן את הפריסה** (‏`truncate` · `flex-wrap`), ⛔ אל תסיר תוכן שהמפרט מחייב.

- [ ] **Step 8 — הרץ את ארבע פקודות האימות**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: הכל ירוק.

- [ ] **Step 9 — עדכן את התיעוד וקומיט**

⛔ `docs/api-contract.md` **⛔ אינו משתנה** — התוכנית הזאת ⛔ לא הוסיפה ולא שינתה נקודת קצה.
עדכן `plan/30-architecture.md` בשורה אחת על שלושת המודולים החדשים (‏`lib/core/lesson.ts` · `lib/core/surfaces.ts` · `lib/supabase/surfacesTouched.ts`).

```bash
git add components/MeScreen.tsx components/MeScreen.test.ts "app/(tabs)/me/page.tsx" \
        app/dev/tabs/me/page.tsx lib/supabase/levelProgress.ts \
        app/api/levels/summary/route.ts plan/30-architecture.md
git commit -m "loop(DEV): T-145 אני מקבלת פעולה אמיתית — הסימון יורד מהיציאה ושלוש הספירות עולות"
```

---

## סגירה — מה נרשם ל-PM כשהתוכנית מבוצעת

⛔ **שני הפריטים האלה ⛔ אינם חוסמים אף אחת משלוש המשימות**, ונרשמים ב-`plan/60-findings.md` בטיק שבו הם נתקלים:

- **F-117 🟡** — שורת `T-145` מכתיבה אימות ב-`check:mobile` על פעולה ראשית ב-`/dev/tabs/me`, וההערה החיה ב-`scripts/verify-mobile.mjs:174-175` **אוסרת על ה-Dev** להוסיף את המסלול ל-`PRIMARY_ACTION_ROUTES` («שורת משימה של ה-PM ⛔ ולא הרחבה שסוכן מוסיף לעצמו»). ⇒ הבדיקה שנכתבה בשורת המשימה ⛔ אינה ניתנת להרצה כלשונה. **ההכרעה של ה-PM:** או שורת משימה שמוסיפה את המסלול, או ניסוח שמסתפק בסריקת מקור.
- **F-118 🟡** — § 4.2יד נוקבת ב«המשטח שלא נגעת בו היום» ב**יחיד**, ו⛔ אינה מכריעה מה קורה כששניים או שלושה לא נגועים. ⇒ סדר הבחירה נקבע בקוד (`NEGLECT_PRIORITY`) מתוך שני מקורות קיימים (הפעולה הראשית שהמסך משלח אליה היום · `LEARNING_PRIORITY`), ⛔ ולא הוכרע במפרט. **ההכרעה של ה-PM:** לאשר את הסדר בשורת T-144 או לנקוב באחר.

## Self-Review

**כיסוי המפרט:**

| דרישה | היכן היא מבוצעת |
|---|---|
| T-143ⓐ יעד מגע ≥44px | Task 1 · צעדים 8ⓔ · 10 |
| T-143ⓑ הסבר אחרי בחירה, על סוג השאלה בלבד | Task 1 · צעדים 3 (`whyForChoice`) · 8ⓕ · שער «אין הסבר לפני בחירה» בצעד 10 |
| T-143ⓒ ⛔ אין ניקוד/מונה/תווית ערך | Task 1 · Design note + Global Constraint 5; ⛔ לא נוסף שדה `isCorrect` |
| T-143ⓓ ⛔ אין «דוגמה פתורה» | ⛔ לא נבנתה — התוכנית ⛔ אינה מוסיפה שום בלוק חדש למסך |
| T-143 «⛔ ההסברים מגיעים כפרופ» | הבדיקה «אפס תו עברי» נשארת ו⛔ אינה מוחלשת (Task 1 · צעד 9) |
| T-144ⓐ ארבעה משטחים + קישור | Task 2 · צעדים 4 · 12 |
| T-144ⓑ נוקב במשטח המוזנח | `neglectedSurface` · `neglectHeadlineHe` (צעד 4) |
| T-144ⓒ ⛔ אפס משחוק | בדיקת «אפס מדד משחוק» בשני מקומות (צעדים 2 · 10) |
| T-144ⓓ ⛔ אפס מדד ואפס עמודה | טבלת המקורות בראש Task 2 — שלוש עמודות קיימות, אפס `alter table` |
| T-144ⓔ לא זמין ⇒ עם מספר, ⛔ לא «—» | `unavailable` + בדיקת `not.toContain('—')` (צעדים 2 · 10 · 13) |
| T-144 דרישת S15 החוסמת | ⛔ **לא נקרא ⇒ המסך מדבר על ארבעת המשטחים בשמם** — כלשון § 4.2יד. ⛔ אין מילה «רצועה» באף קובץ בתוכנית |
| T-144 סייג M7 | המנגנון מאזן **פעילויות** — `SurfaceId`, ⛔ ולא מילים |
| T-144 מדד הצלחה ⓒ (≥400 תווים · ≥4 יעדים) | Task 2 · צעד 15 |
| T-145ⓐ הסימון יורד מהיציאה | Task 3 · צעד 3ⓕ + בדיקה 1 |
| T-145ⓑ אותה גוזרת של T-144 | Task 3 · צעד 5 קורא ל-`neglectedSurface` ⛔ ולא לגוזרת שנייה |
| T-145ⓒ היציאה נשארת | Task 3 · בדיקה 2 |
| T-145ⓓ שלוש הספירות של D-034 | Task 3 · צעדים 3ⓓ · 5 (‏`readLevelSummary` משותף) |
| T-145ⓔ ⛔ אין מוכנות/ציון חזוי | Task 3 · בדיקה 5 |

**סריקת מצייני מקום:** ⛔ אין «TODO» · אין «טיפול בשגיאות מתאים» · אין «בדיקות כמו במשימה N». שלושת המקומות שבהם התוכנית מורה **לאמת שם לפני שימוש** (‏`storiesTooFewNoteHe` · `STORIES_REQUIRED` · `world_posts.user_id`) הם מדידה מפורשת בת דקה עם פקודת `grep` כתובה, ⛔ ולא ניחוש שנדחה.

**עקביות טיפוסים:** `SurfaceId` · `SURFACE_HREF` · `SURFACE_LABEL_HE` · `neglectedSurface` · `neglectHeadlineHe` מוגדרים ב-Task 2 צעד 4 ונצרכים ב-Task 2 צעד 12 וב-Task 3 צעדים 3 · 5 — באותם שמות בדיוק. `readSurfacesTouchedToday` (Task 2 צעד 9) נצרך ב-Task 2 צעד 13 וב-Task 3 צעד 5 עם אותה חתימה בת שלושה ארגומנטים. `zonedDayStart` מוגדר ב-Task 2 צעד 13 ונצרך שוב ב-Task 3 צעד 5.
