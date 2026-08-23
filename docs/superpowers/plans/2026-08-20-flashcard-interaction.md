# תיקון אינטראקציית הכרטיסייה — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לסגור את שלוש המשימות של § 4.2ח — הכרטיס עצמו כיעד המגע (T-085), מדידת «כרטיס אחד למסך» (T-086), ופעולת סגירה על מסך מנת היום (T-087) — פגמים חיים שרוי מדד ורשם ב-`02-inbox` פריט 1.

**Architecture:** שלוש עריכות ממוקדות. T-085 הופך את חזית הכרטיס לכפתור עם `data-reveal`, מוריד את הכפתור החיצוני, ומכניס רמז «הקש להצגת התשובה» לתוך פני הכרטיס — שני כפתורי הסימון נשארים בחוץ, ⛔ ולא מקוננים (`<button>` בתוך `<button>` שובר HTML ושובר קורא מסך). T-086 הוא **דו״ח מדידה, ⛔ ולא שינוי CSS**: מרחיבים את פיקסטורת `/dev/deck` מ-2 ל-5 כרטיסים ומחזקים את בדיקת ההארנס כדי שהיא תוכיח שכרטיס 3+ גם כן מחוץ למסך, ואז מדווחים את המספרים בפועל. T-087 מוסיף `data-close` בפינה הימנית העליונה של `<StudyDeckScreen>` **רק במצב `cards`**, קישור `/cards` ≥44px עם אייקון `<CloseIcon>` שכבר קיים.

**Tech Stack:** Next.js App Router (React 18, Server + Client Components), TypeScript strict, Tailwind CSS (חוקה § 5·6), Vitest (node env), Playwright דרך `scripts/verify-mobile.mjs`.

**Spec:** `plan/40-decisions.md` § 4.2ח (T-085…T-087 · D-039), `plan/50-tasks.md` שורות T-085·T-086·T-087, `plan/03-for-roy.md` `02-inbox` פריט 1 (המדידה החיה של רוי), `plan/35-design-constitution.md` § 5·6.

## Global Constraints

- ⛔ **תוכן לימודי אינו מומצא** (R-010 · R-013): כל טקסט אנגלי בפיקסטורה חייב להיות `Lorem`/`Ipsum`-class — ⛔ מילים אמיתיות ⛔ אסורות.
- ⛔ **צבע לעולם אינו הערוץ היחיד** (חוקה § 1 · ΔE 4.1 ל-deutan): כל סימון נושא **תווית עברית + גליף/SVG + צבע** — שלושה ערוצים.
- ⛔ **⛔ אמוג'י כאייקון** (חוקה § 6): רק SVG מוטבע דרך `currentColor`, ⛔ ⛔ hex, ⛔ ⛔ תמונה. `components/CloseIcon.tsx` כבר קיים ו⛔ אין ליצור SVG שני.
- ⛔ **⛔ `<button>` בתוך `<button>`**: HTML לא תקין ושובר קורא מסך — בדיקת מקור שנכשלת על קינון היא **חלק מהמשימה** (§ 4.2ח ⓐ · T-085).
- **יעדי מגע ≥44px** (`min-h-touch` בטיילווינד config.ts:26): כל control ניתן-להקשה חייב לנחות שם.
- **`:focus-visible`** (globals.css:72): הרינג הגלובלי כבר קיים; ⛔ ⛔ להוסיף רינג מקומי, ⛔ ⛔ להשתמש ב-`:focus` העירום.
- **RTL אנכי**: `data-close` חי בפינה **הימנית** העליונה בעברית — CSS logical `start` (‏`right` בפועל תחת `dir="rtl"`).
- **מוטציה חובה בכל בדיקת מקור**: כל `expect(src).toContain(...)` דורש בדיקה נגדית שמפילה בשם ברור על שינוי CSS/JSX סמוך, אחרת הבדיקה עוברת גם על סטרינג בתוך הערה (F-035 · § שירת comments-strip).
- **תקרות ה-DEV**: `verification-before-completion` — ארבע הפקודות הן פקודת השער היחידה: `npm run typecheck && npm run check:core && npm test && npm run build`. חייבות לרוץ **אחרי** כל עריכה כולל קובצי תכנון, בטיק הזה, ⛔ ⛔ להסתמך על ריצה קודמת.
- **גבולות קבצים לפי `plan/50-tasks.md`**: T-085 = `components/Flashcard.tsx` + `.test.ts`. T-086 = `scripts/verify-mobile.mjs` + `app/dev/deck/page.tsx`. T-087 = `components/StudyDeckScreen.tsx` (+ `.test.ts`). ⛔ ⛔ לגעת ב-`components/CloseIcon.tsx` (רק לצרוך).

---

## File Structure

**מקום עריכה, לפי משימה:**

- **T-085 · Flashcard**
  - `components/Flashcard.tsx` — חזית הכרטיס נעשית `<button>` כאשר `card.input === 'self' && !revealed`; מקום «הצג תשובה» יורד לרמז «הקש להצגת התשובה» **בתוך** הכרטיס. `data-reveal` נשאר על הכפתור — הרכיב הוא כעת פני הכרטיס, ⛔ ⛔ כפתור נפרד. ⛔ שני כפתורי הסימון נשארים בחוץ ⛔ ⛔ ⛔ ואינם מקוננים.
  - `components/Flashcard.test.ts` — בדיקת מקור: (א) `<button>` על חזית הכרטיס עם `data-reveal`; (ב) הרמז «הקש להצגת התשובה» נמצא בתוך אותו כפתור; (ג) `<button>` בתוך `<button>` ⛔ ⛔ קיים; (ד) התנהגות מקלדת מגיעה מ-`<button>` הטבעי (Enter/Space) ⛔ ⛔ מ-`onKeyDown` מותאם — `:focus-visible` חי גלובלית ב-`globals.css`, ולכן אין להוסיף רינג מקומי.

- **T-086 · דו״ח מדידה של «כרטיס אחד למסך»**
  - `app/dev/deck/page.tsx` — פיקסטורה מ-2 ל-5 כרטיסים, כי «כרטיס אחד למסך» לא נבדק במלואו על 2 בלבד (כרטיס 3 יכול להימחץ ב-`h-full` שגוי, וכרטיס 2 לבדו מסתיר את המחלה).
  - `scripts/verify-mobile.mjs` — הרחבת בלוק `/dev/deck`: קריאה של כל הפריטים בסקרולר (⛔ רק שניים), אסרציה שכרטיס `i` מתחיל ב-`>= viewport.bottom - 1` לכל `i >= 1`; דיווח (`report()`) של הגיאומטריה בפועל בשלושת הרחבים (320/375/414) — ⛔ ⛔ מדד «נראה טוב».
  - סעיף Self-Review מדווח את המספרים שהוחזרו מ-`npm run check:mobile`.

- **T-087 · יציאה על `/study`**
  - `components/StudyDeckScreen.tsx` — במצב `state.kind === 'cards'` נוסף עוגן `<Link href="/cards" data-close aria-label="סגור">` עם `<CloseIcon />`, `min-h-touch min-w-touch`, מיקום `absolute top-2 start-2` על `<section>` `relative` שעוטף את כל ענף `cards`. ⛔ ⛔ סרגל תחתון · ⛔ ⛔ ActionBar · ⛔ ⛔ `data-primary-action` (התנגשות F-027 עם FLOW_ROUTE) · ⛔ ⛔ SVG מוטבע נוסף — מייבאים את `components/CloseIcon.tsx`.
  - `components/StudyDeckScreen.test.ts` — בדיקת מקור: (א) ענף `cards` מכיל `<CloseIcon />` בתוך אלמנט שנושא `data-close`, `href="/cards"`, `min-h-touch`; (ב) ⛔ ⛔ `data-primary-action` על אותה שורה — עלולה לשבור F-027 של `/study` בזרם FLOW_ROUTES; (ג) ⛔ ⛔ `data-close` בענפים האחרים (`loading`/`empty`/`error`/`schema_missing`/`session_expired`) — הם מקבלים `ActionBar` כרגיל; (ד) האייקון מיובא מ-`@/components/CloseIcon` ⛔ ⛔ SVG שני.

---

## Task 1 — T-085 · הכרטיס עצמו הוא יעד המגע

**Files:**
- Modify: `components/Flashcard.tsx:53-147` (חזית הכרטיס וענף `!revealed && card.input === 'self'`).
- Modify: `components/Flashcard.test.ts` (בסוף הקובץ — קבוצת `describe` חדשה).

**Interfaces:**
- Consumes: `type Card = { direction; input: 'self' | 'typed'; front; back }` מ-`@/lib/core/flashcard` — ⛔ ⛔ משתנה. `onGrade: (grade: CardGrade) => void` — ⛔ ⛔ משתנה. `revealed`, `typed`, `grade` נשארים כמות שהם.
- Produces: החתימה של `<Flashcard>` **⛔ ⛔ משתנה**. `data-reveal` **נשאר** על האלמנט הלחיץ שהופך את הכרטיס, כדי ש-`scripts/verify-mobile.mjs` (bloc `/dev/deck`, שורה ~1204, `page.locator('[data-reveal]').first().click()`) יעבוד ללא שינוי בהארנס. `data-card-front` **נשאר** — שורה 64.

**הכרעות מדידות (⛔ ⛔ טעם):**
1. פני הכרטיס הם **`<button type="button">`** ולא `<div>` עם `onClick`. `<button>` הטבעי נותן Enter/Space, `role="button"` אוטומטי, ו-`:focus-visible` הגלובלי עולה בלי שורת CSS מקומית — `role="button"` על `<div>` דורש `tabIndex={0}` + `onKeyDown` ידני שיצמד ל-Enter ול-Space **בנפרד** (Space גורר גלילת עמוד — קורה בכל `<div role="button">` שאינו מטפל ב-`preventDefault`).
2. הכפתור **חייב לחיות רק כשהוא כפתור** — כלומר בענף `card.input === 'self' && !revealed`. במצב `typed` יש `<input>` + `<button type="submit">` בתוך אותו קונטיינר, ולומד שמקיש על הפינה של הכרטיס יעבור לפעולת רבע-מסך שלא ביקש. בענף `revealed` הכרטיס מציג תוכן — לחיצה עליו ⛔ ⛔ עוזרת.
3. הרמז «הקש להצגת התשובה» חי **בתוך** הכפתור, ⛔ ⛔ מעליו: תווית שיושבת מחוץ לכפתור היא הבטחה שלא נאכפת (יש שוליים בין המילים לבין יעד המגע). `text-ink-muted` — הרגיסטר הדיסקרטי לרמז, ⛔ ⛔ צבע חדש.
4. **⛔ ⛔ swipe-to-grade** (D-032 בתוקף): ⛔ ⛔ להוסיף `onPointerDown`/`touch`/`onMouseMove` — הבדיקה סורקת את זה. שני כפתורי הסימון בענף `revealed && input === 'self'` (שורה 180) נשארים בדיוק כפי שהם.

---

- [ ] **Step 1: כתוב את הבדיקה שנכשלת** — הוסף `describe` חדש בסוף `components/Flashcard.test.ts`.

```typescript
// בסוף components/Flashcard.test.ts, אחרי הבלוק הקיים:

/**
 * T-085 · D-039 · § 4.2ח ⓐ — הכרטיס עצמו הוא יעד המגע.
 *
 * סורק מקור בלבד (כמו כל הקובץ הזה), משתי סיבות מדידות:
 * ⓐ `revealed` הוא state של הרכיב, ולכן `renderToStaticMarkup` היה מחזיר תמיד
 *    חזית עם `data-reveal` בלי לגלות שהכפתור נמצא במקום שגוי.
 * ⓑ הבדיקה של «⛔ קינון כפתורים» היא **על ה-JSX עצמו**, ⛔ ⛔ על תוצר הרינדור:
 *    דפדפן «מתקן» באופן שקט קינון שכזה על ידי סגירת ה-`<button>` הפנימי, ולכן
 *    בדיקת DOM הייתה מחמיצה את הפגם שהיא קיימת בשבילו.
 */
const T085_HINT = 'הקש להצגת התשובה';
const T085_CARD_SRC = stripComments(readFileSync(FLASHCARD, 'utf8'));

/** תא של `<button ...>` (הרישום ההיפותטי אחד או יותר) עד `</button>` המתאים,
 *  עומק-נספר בדיוק כמו `divBlockContaining` — ⛔ ⛔ regex עצל. */
function buttonBlockContaining(src: string, marker: string): string | null {
  const at = src.indexOf(marker);
  if (at === -1) return null;
  const start = src.lastIndexOf('<button', at);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src.startsWith('<button', i)) depth += 1;
    else if (src.startsWith('</button>', i)) {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + '</button>'.length);
    }
  }
  return null;
}

describe('the card face is the button (T-085 · D-039 · § 4.2ח ⓐ)', () => {
  it('קורא רכיב אמיתי עם `data-reveal`', () => {
    // שומר-ריק: אם מישהו שינה את שם ה-hook, כל הבדיקות שלהלן היו עוברות ריק.
    expect(T085_CARD_SRC.length).toBeGreaterThan(1000);
    expect(T085_CARD_SRC).toContain('data-reveal');
  });

  it('חזית הכרטיס הופכת ל-`<button>` עם `data-reveal`', () => {
    // הכפתור נמצא ב-JSX ⛔ ולא ב-`role="button"` על `<div>`: `role` על `<div>` דורש
    // גם `tabIndex={0}` וגם טיפול ידני ב-Enter/Space, וזה כמות הקוד שהופכת
    // בדיקה חיה יותר מקוד אמיתי — `<button>` הטבעי נותן את שני התנאים חינם.
    const revealBlock = buttonBlockContaining(T085_CARD_SRC, 'data-reveal');
    expect(revealBlock, 'לא נמצא `<button>` שעוטף `data-reveal`').toBeTruthy();
    // ⛔ ⛔ `<div ... data-reveal>` — היה שוברת גם מקלדת וגם קורא-מסך:
    expect(T085_CARD_SRC).not.toMatch(/<div\b[^>]*\bdata-reveal\b/);
  });

  it('הרמז «הקש להצגת התשובה» חי בתוך הכפתור, ⛔ ולא מחוץ לו', () => {
    // תווית מחוץ לכפתור לא נלחצת עם הכפתור — מרווח 8px מספיק כדי להחמיץ.
    expect(T085_CARD_SRC).toContain(T085_HINT);
    const revealBlock = buttonBlockContaining(T085_CARD_SRC, 'data-reveal') ?? '';
    expect(revealBlock, 'הרמז חייב לחיות בתוך אותו `<button>` שנושא `data-reveal`').toContain(
      T085_HINT,
    );
  });

  it('חזית הכרטיס נשארת מזוהה: `data-card-front` בתוך אותו כפתור', () => {
    // `<CardDeck>` בונה גובה מתוך מדידה של החזית, ובדיקת ההארנס
    // (`scripts/verify-mobile.mjs` — `[data-card-front]`) לא רשאית להיבור. הכפתור
    // אינו רשאי «לבלוע» את התוכן ולהחזיר `data-card-front` להיות ריק.
    const revealBlock = buttonBlockContaining(T085_CARD_SRC, 'data-reveal') ?? '';
    expect(revealBlock).toContain('data-card-front');
  });

  it('⛔ ⛔ `<button>` בתוך `<button>` בכל מקום בקובץ (HTML לא תקין)', () => {
    // בודקים על הקוד עצמו, ⛔ ⛔ על ה-DOM: הדפדפן «מתקן» קינון בשקט על ידי סגירת
    // ה-<button> הפנימי מוקדם ⇒ ה-DOM נראה תקין וקורא המסך שובר.
    let depth = 0;
    let maxDepth = 0;
    for (let i = 0; i < T085_CARD_SRC.length; i += 1) {
      if (T085_CARD_SRC.startsWith('<button', i)) {
        depth += 1;
        if (depth > maxDepth) maxDepth = depth;
      } else if (T085_CARD_SRC.startsWith('</button>', i)) {
        depth = Math.max(0, depth - 1);
      }
    }
    expect(maxDepth, 'קינון `<button>` בתוך `<button>` — HTML לא תקין, שובר קורא מסך').toBeLessThanOrEqual(1);
  });

  it('⛔ ⛔ swipe-to-grade (D-032 בתוקף)', () => {
    // האיסור על מחווה גורף בקובץ הזה, ⛔ רק בקטע חדש: התיקון של T-085 לא
    // רשאי להחזיר מחווה שכבר נדחתה בהחלטה כתובה.
    for (const forbidden of ['onPointerDown', 'onPointerMove', 'onTouchMove', 'onSwipe']) {
      expect(T085_CARD_SRC, `${forbidden} ⛔ ⛔ אסור על הכרטיס`).not.toContain(forbidden);
    }
  });
});
```

- [ ] **Step 2: הרץ ותאמת אדום** — ⛔ ⛔ להמשיך לפני שראית **שש נפילות רלוונטיות**.

```bash
npx vitest run components/Flashcard.test.ts
```

Expected: ‏6 בדיקות T-085 חדשות **נופלות** — ‏«לא נמצא `<button>` שעוטף `data-reveal`» · «`data-reveal` צריך לחיות בכפתור» · «הרמז חייב לחיות בתוך אותו `<button>`» · חזית `data-card-front` חסרה. הבדיקות הישנות (`T-045`) חייבות להמשיך לעבור — אם נפלו, הפסק.

- [ ] **Step 3: מַמֵּש — חזית הכרטיס נעשית `<button>`**. ערוך את `components/Flashcard.tsx`:

**החלף** את הבלוק שורה 60–97 (הכרטיס עצמו) בפונקציית עזר בתוך הרכיב:

```tsx
  // 3א · בתוך הרכיב, מעל ה-return, לפני `const primary = ...`:
  const cardFace = (
    <>
      <p className="text-sm text-ink-muted">
        {card.direction === 'recognition' ? 'מה הפירוש?' : 'איך אומרים באנגלית?'}
      </p>
      <p className="mt-2 text-4xl font-bold leading-tight" data-card-front>
        {primary(card.front.primary, card.front.primaryLang)}
      </p>

      {revealed ? (
        <div className="mt-6 flex flex-col gap-3 border-t border-border-subtle pt-5" data-card-back>
          <p className="text-2xl font-semibold" data-card-answer>
            {primary(card.back.primary, card.back.primaryLang)}
          </p>
          {card.back.exampleSegments.length > 0 ? (
            <p className="text-base leading-relaxed text-ink-muted">
              <EnText segments={card.back.exampleSegments} />
            </p>
          ) : null}
          {card.back.unverified ? (
            <p className="flex items-center gap-2 text-sm text-ink-muted" data-card-unverified>
              <span aria-hidden="true">◇</span>
              טרם אומת — התרגום ממתין לאישור אנושי
            </p>
          ) : null}
        </div>
      ) : (
        // הרמז חי **בתוך** פני הכרטיס. `card.input === 'self'` בלבד — במצב
        // `typed` הכרטיס אינו כפתור והרמז יטעה: הלומד יסיים למלא את השדה כדי
        // לגלות את התשובה.
        card.input === 'self' ? (
          <p className="mt-6 text-sm text-ink-muted" data-reveal-hint>
            {'הקש להצגת התשובה'}
          </p>
        ) : null
      )}
    </>
  );
```

**החלף** את שורות 58–97 (ה-`<section>` הפותח וה-`<div>` של החזית) והשלישיות עד `</div>` — נוסח חלופה:

```tsx
  return (
    <section className="flex flex-1 flex-col gap-6" data-flashcard={card.direction}>
      {/* פני הכרטיס.
          ⓐ במצב `self` + `!revealed` — `<button>` שגם היפוך וגם יעד מגע: `<button>`
             טבעי נותן Enter/Space, `role="button"` אוטומטי, ו-`:focus-visible`
             הגלובלי (globals.css:72) מציג רינג בלי CSS מקומי. ⛔ ⛔ `<div role="button">`
             — היה דורש `tabIndex` + טיפול ידני ב-Space, שגורר גלילת עמוד.
          ⓑ במצב `typed` או `revealed` — `<div>` שקט: לחיצה עליו ⛔ ⛔ עוזרת. */}
      {!revealed && card.input === 'self' ? (
        <button
          type="button"
          onClick={reveal}
          data-reveal
          className="rounded-2xl border border-border-subtle bg-surface-raised p-6 text-start"
        >
          {cardFace}
        </button>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
          {cardFace}
        </div>
      )}

      {/* פעולות בחצי התחתון (MF-5). */}
      <div className="mt-auto flex flex-col gap-3">
        {!revealed && card.input === 'typed' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setGrade(gradeTypedAnswer(card, typed));
              reveal();
            }}
          >
            <label htmlFor={answerId} className="text-sm text-ink-muted">
              כתוב את המילה באנגלית
            </label>
            <input
              id={answerId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              dir="ltr"
              lang="en"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-h-touch rounded-lg border border-border-strong bg-surface-raised px-4 text-lg text-ink"
            />
            <button
              type="submit"
              className="min-h-touch rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              בדיקה
            </button>
          </form>
        ) : null}

        {/*
          ⛔ ⛔ הענף «!revealed && input === 'self'» כאן — הוא ירד לחזית הכרטיס.
          שאר שני הענפים (`typed` אחרי revealed, `self` אחרי revealed) נשארים.
        */}

        {revealed && card.input === 'typed' ? (
          <div className="flex flex-col gap-3">
            <p
              data-verdict={grade ?? 'again'}
              className={`text-lg font-semibold ${grade === 'good' ? 'text-success' : 'text-danger'}`}
            >
              <span aria-hidden="true">{grade === 'good' ? '✓ ' : '✕ '}</span>
              {grade === 'good' ? 'נכון' : 'לא נכון'}
            </p>
            {grade !== 'good' && typed.trim() !== '' ? (
              <p className="text-base text-ink-muted">
                כתבת: <EnWord>{typed}</EnWord>
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => onGrade(grade ?? 'again')}
              data-continue
              className="min-h-touch rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              המשך
            </button>
          </div>
        ) : null}

        {revealed && card.input === 'self' ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onGrade('again')}
              data-grade="again"
              className="min-h-touch rounded-lg border-2 border-danger px-4 py-3 text-base font-semibold text-danger active:opacity-90"
            >
              <span aria-hidden="true">✕ </span>לא ידעתי
            </button>
            <button
              type="button"
              onClick={() => onGrade('good')}
              data-grade="good"
              className="min-h-touch rounded-lg border-2 border-success px-4 py-3 text-base font-semibold text-success active:opacity-90"
            >
              <span aria-hidden="true">✓ </span>ידעתי
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
```

**עדכן את בלוק ה-JSDoc בראש הרכיב** (שורות 7–26) — הוסף שורה שלישית בתוך הרשימה של «שלוש הכרעות שהן מדידות», או החלף את הפסקה בגרסה שמזכירה את D-039:

```tsx
 * 3. **פני הכרטיס הם הכפתור** (D-039 · § 4.2ח ⓐ): במצב `self` + `!revealed`
 *    הרכיב `<button>` הטבעי הוא החזית — Enter/Space, `role="button"` וסימון
 *    `:focus-visible` הגלובלי מגיעים חינם. `role="button"` על `<div>` היה
 *    דורש `tabIndex` וטיפול ידני ב-Space. הרמז «הקש להצגת התשובה» חי
 *    **בתוך** הכפתור — תווית מחוץ לו היא הבטחה שלא נאכפת. שני כפתורי הסימון
 *    נשארים בחוץ ו⛔ ⛔ אינם מקוננים.
```

- [ ] **Step 4: הרץ עד ירוק** — ‏6 החדשות + כל הישנות.

```bash
npx vitest run components/Flashcard.test.ts
```

Expected: **כל** בדיקות `Flashcard.test.ts` ירוקות.

- [ ] **Step 5: מוטציית אימות** — הַפֵּל את הבדיקה שהיא כתובה בשבילה, וודא ההפרה.

הפוך זמנית את פני הכרטיס מ-`<button ... data-reveal>` ל-`<div ... data-reveal>`.

```bash
npx vitest run components/Flashcard.test.ts -t "חזית הכרטיס הופכת ל-`<button>`"
```

Expected: **נפילה** של שתי בדיקות: «חזית הכרטיס הופכת ל-`<button>`» + «⛔ `<div ... data-reveal>`». הַחזר, ודא ירוק שוב.

- [ ] **Step 6: הרץ את כל שער העבודה**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

Expected: כל ארבעת ירוקים. סך הבדיקות עלה ב-6 (2142 → 2148 בסביבות בסיס C-0231). **קלוט את המספר המדויק ל-Self-Review**.

- [ ] **Step 7: קומיט**

```bash
git add components/Flashcard.tsx components/Flashcard.test.ts
git commit -m "loop(DEV): T-085 · card face is the button (D-039 · § 4.2ח ⓐ)"
```

---

## Task 2 — T-086 · כרטיס אחד למסך, דו״ח מדידה

**Files:**
- Modify: `app/dev/deck/page.tsx:32-55` (`FIXTURE` — 2 → 5 כרטיסים).
- Modify: `scripts/verify-mobile.mjs:1145-1206` (בלוק `/dev/deck` — מדידה של **כל** הכרטיסים).

**Interfaces:**
- Consumes: `QueueCardInput` מ-`@/lib/core/deck` — ⛔ ⛔ משתנה. `<CardDeck>` — ⛔ ⛔ משתנה. אין ל-T-086 חתימה חדשה.
- Produces: `report()`-ים בבלוק `/dev/deck` שמדפיסים את הגיאומטריה בכל שלושת הרחבים 320/375/414. הפלט הזה הוא **תוצר המשימה** — הוא הודבק ל-Self-Review וממנו נסגרת T-086.

**הכרעות מדידות (⛔ ⛔ טעם):**
1. **הרחבת פיקסטורה מ-2 ל-5 כרטיסים היא המדידה** (‏PM: «⛔ ⛔ תיקון לפני מדידה»). 2 כרטיסים מוכיחים ש-`snap` פעיל; **⛔ ⛔** מוכיחים שכרטיס 3, 4, 5 גם כן מחוץ למסך — פגם `h-full` בתוך `flex-1` היה נעצר על כרטיס 2 ומחזיר כרטיס 3 ל-`min-content`. הפיקסטורה עדיין Lorem/Ipsum (‏R-010/R-013).
2. **הבדיקה בהארנס סורקת את `items` באורך משתנה** — לא במקום `items[0]`/`items[1]` בלבד. מקבלת מ-`scroller.children` את כל הפריטים, ומאמתת: (א) `count === 5`; (ב) לכל `i >= 1`, `items[i].top >= viewport.bottom - 1` (כלומר מחוץ למסך); (ג) לכל `i >= 0`, `items[i].height >= viewport.height - 1` (כל כרטיס בעצמו במלוא ה-snap viewport).
3. **דיווח `report()`** — ⛔ ⛔ רק `check()` שירוק בשקט. `report()` מדפיס את גובה כל כרטיס וגובה ה-snap viewport, וזו התוצאה שהמשימה ⛔ ⛔ נסגרת בלעדיה («המשימה נסגרת בדוח מדידה»).
4. **⛔ ⛔ שינוי CSS ב-`CardDeck.tsx`** — הפיקסטורה החזקה יותר או תעבור (וזו התשובה), או שהיא תיפול. הפלה תיפתח כממצא חדש ⇒ טיק חדש; ⛔ ⛔ מתקנים על סמך ניחוש כאן.

---

- [ ] **Step 1: הרחב את הפיקסטורה מ-2 ל-5 כרטיסים** — `app/dev/deck/page.tsx:32-55`:

```tsx
// מחליף את שני הכרטיסים הקיימים בחמישה. Lorem/Ipsum-class ⛔ ⛔ מילים אמיתיות.
// חמישה במקום שניים: כרטיס 2 לבד ⛔ ⛔ הוכיח שכרטיס 3+ גם מחוץ למסך — פגם
// `h-full` בתוך `flex-1` היה נעצר על 2 ומחזיר את 3 ל-`min-content`.
// חייבות להיות `id`-ים שונים — ל-<CardDeck> יש `remaining.filter(!graded)` על `word_id`.
const FIXTURE: readonly QueueCardInput[] = [
  {
    word_id: 'fixture-lorem',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Lorem',
      translation_he: 'טקסט לדוגמה',
      examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-ipsum',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Ipsum',
      translation_he: 'טקסט אחר',
      examples: { supportive: 'The Ipsum is also a fixture.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-dolor',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Dolor',
      translation_he: 'שלישי לדוגמה',
      examples: { supportive: 'The Dolor is a third fixture card.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-sit',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Sit',
      translation_he: 'רביעי לדוגמה',
      examples: { supportive: 'The Sit is a fourth fixture card.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-amet',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Amet',
      translation_he: 'חמישי לדוגמה',
      examples: { supportive: 'The Amet is a fifth fixture card.', neutral: '' },
      needs_human_review: false,
    },
  },
];
```

- [ ] **Step 2: הרחב את בלוק `/dev/deck` ב-`scripts/verify-mobile.mjs`** — שורות 1145-1206.

החלף את הבלוק (מ-`if (route === '/dev/deck') {` עד סיום `if (deck.count === 2 && deck.scroller) { ... }`) בגרסה שקוראת את כל הפריטים ומאמתת כל אחד:

```javascript
      // T-065 · § 4.2ו · T-086 — הסקרולר הסמוך. שלוש הבטחות, נמדדות על הרכיב
      // ⛔ ⛔ על המסך שמעליו: כרטיס אחד ממלא את המסך, וכל כרטיס נוסף מתחיל
      // בקצה התחתון או מתחתיו. `/dev/deck` ⛔ ⛔ `/study`: המסלול האמיתי
      // מרנדר את מצב הכשל שלו ללא Supabase env (TD-13), ולכן הסקרולר לא היה ב-DOM.
      //
      // ⚠️ T-086 (‏PM, § 4.2ח ⓑ) — הפיקסטורה גדלה מ-2 ל-5 כדי להוכיח שכרטיס 3, 4, 5
      // גם מחוץ למסך: 2 כרטיסים ⛔ ⛔ מוכיחים ש-`h-full` בתוך `flex-1` לא מקריס
      // את כרטיס 3 ל-`min-content`. המשימה נסגרת בדוח מדידה, ⛔ ⛔ ב"נראה טוב".
      if (route === '/dev/deck') {
        const deck = await page.evaluate(() => {
          const scroller = document.querySelector('[data-deck-scroll]');
          const cards = [...document.querySelectorAll('[data-flashcard]')];
          if (!scroller || cards.length < 2) return { count: cards.length, scroller: Boolean(scroller) };
          const box = scroller.getBoundingClientRect();
          const items = [...scroller.children].map((child) => {
            const rect = child.getBoundingClientRect();
            return { top: Math.round(rect.top), height: Math.round(rect.height) };
          });
          return {
            count: cards.length,
            scroller: true,
            top: Math.round(box.top),
            bottom: Math.round(box.bottom),
            height: Math.round(box.height),
            items,
            viewportHeight: window.innerHeight,
          };
        });
        check(
          deck.count >= 2 && deck.scroller,
          `${at} the deck holds all fixture cards`,
          `found ${deck.count} cards and ${deck.scroller ? 'a' : 'no'} [data-deck-scroll]`,
        );
        if (deck.count >= 2 && deck.scroller) {
          // ⓐ הסקרולר עצמו נכנס למסך.
          check(
            deck.top >= 0 && deck.bottom <= deck.viewportHeight,
            `${at} the deck fits on screen`,
            `the snap viewport occupies ${deck.top}..${deck.bottom} of a ${deck.viewportHeight}px viewport`,
          );
          // ⓑ כל כרטיס בעצמו במלוא ה-snap viewport (‏1px סובלנות ל-sub-pixel).
          const short = deck.items
            .map((it, i) => ({ i, ...it }))
            .filter((it) => it.height < deck.height - 1);
          check(
            short.length === 0,
            `${at} one card per screen (${deck.items.length} cards checked)`,
            short.length === 0
              ? ''
              : `cards ${short.map((it) => `${it.i}=${it.height}px`).join(' · ')} inside a ${deck.height}px snap viewport`,
          );
          // ⓒ כל כרטיס משני והלאה מתחיל בקצה התחתון או מתחתיו.
          const overlapping = deck.items
            .map((it, i) => ({ i, ...it }))
            .filter((it, i) => i >= 1 && it.top < deck.bottom - 1);
          check(
            overlapping.length === 0,
            `${at} every subsequent card waits off screen`,
            overlapping.length === 0
              ? ''
              : `cards ${overlapping.map((it) => `${it.i}@y=${it.top}`).join(' · ')} start above the snap viewport's bottom edge at ${deck.bottom}`,
          );
          // ⓓ דו״ח T-086 — הגיאומטריה בפועל, כדי שהמשימה תיסגר על מספרים ולא על תחושה.
          report(
            `${at} T-086: snap viewport ${deck.top}..${deck.bottom} (height ${deck.height}px) · cards ${deck.items.map((it) => it.height).join('/')}px inside`,
          );
        }
```

**הערה**: השורה `await page.locator('[data-reveal]').first().click();` שבאה מיד אחרי הבלוק **נשארת כמות שהיא** — היא ממשיכה לפעול על כרטיס 1. גם הבלוק של כפתורי הסימון (שורות 1206–1245) נשאר.

- [ ] **Step 3: הרץ את `check:mobile` וקלוט את הפלט**

```bash
npm run check:mobile 2>&1 | tail -80
```

Expected: **ירוק** — 3 בלוקים חדשים ב-`/dev/deck` עוברים בשלושת הרחבים; שורות `T-086:` מודפסות עם המספרים. **שמור את הפלט המדויק** ל-Self-Review — זה תוצר המשימה. אם אחד מהם נופל, ⛔ ⛔ לתקן CSS בטיק הזה — סגור את T-086 עם דיווח הפגם ופתח ממצא חדש.

- [ ] **Step 4: הרץ את שער העבודה המלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

Expected: כל ארבעת ירוקים.

- [ ] **Step 5: מוטציית אימות בהארנס** — הַפֵּל את ⓑ.

הפוך זמנית ב-`components/CardDeck.tsx:170` את `className="flex h-full snap-start flex-col pt-4"` ל-`className="flex snap-start flex-col pt-4"` (הסר את `h-full`).

```bash
npm run check:mobile 2>&1 | grep -E "one card per screen|deck fits" | head
```

Expected: **נפילה** של «one card per screen» — הכרטיסים מתכווצים ל-`min-content`. הַחזר, אמת ירוק שוב.

- [ ] **Step 6: קומיט**

```bash
git add app/dev/deck/page.tsx scripts/verify-mobile.mjs
git commit -m "loop(DEV): T-086 · deck fixture 2→5 cards + measure every card (§ 4.2ח ⓑ)"
```

---

## Task 3 — T-087 · פעולת סגירה על מסך מנת היום

**Files:**
- Modify: `components/StudyDeckScreen.tsx:181-197` (הענף `state.kind === 'cards'`).
- Modify: `components/StudyDeckScreen.test.ts` (בסוף — קבוצת `describe` חדשה).

**Interfaces:**
- Consumes: `components/CloseIcon.tsx` — ⛔ ⛔ נגיעה ⛔ ⛔ SVG שני; ‏`Link` מ-`next/link`.
- Produces: אלמנט חדש שנושא `data-close` (סלקטור בהארנס ואטריבוט לבדיקה), `href="/cards"`, `aria-label="סגור"`, `min-h-touch min-w-touch`. **⛔ ⛔ `data-primary-action`** — ‏/study הוא FLOW_ROUTE, וסלקטור `main [data-primary-action]` דורש **סימון אחד בדיוק** (‏verify-mobile.mjs:596). הוספת שני היה שוברת F-027.

**הכרעות מדידות (⛔ ⛔ טעם):**
1. **הסגירה חיה רק בענף `cards`** — במצבים האחרים (`loading`/`empty`/`error`/`schema_missing`/`session_expired`) יש כבר `<ActionBar>` עם `data-primary-action` המכריע את היציאה (‏StudyDeckScreen.tsx:227). הוספת סגירה שם היא סימון נוסף שקורא לבלבול או שובר את F-027.
2. **⛔ ⛔ `data-primary-action`** על הסגירה — היא **⛔ ⛔** ה-CTA של המסך; ה-CTA של מסך מנת היום היא הסימון (‏D-039 בענף revealed). הסגירה היא **דרך יציאה חלופית** ובדיוק בגלל זה היא לא נספרת עם הסימון.
3. **מיקום `absolute top-2 start-2`** — יעד המגע חייב לחיות **בתוך** ה-`<section>` העוטף, ⛔ ⛔ בתוך `<CardDeck>`: `<CardDeck>` מחשב `h-[calc(100dvh-10rem)]` על סמך chrome קבוע של `app/layout.tsx`, וכל תוספת גובה בתוך העץ שלו שוברת את החישוב וגורמת ל-2 בדיקות T-086 להיכשל. עוגן `absolute` על `<section>` `relative` יושב מעל הכרטיס בלי להוסיף גובה.
4. **RTL — `start-2` וְ⛔ ⛔ `right-2`**: תחת `dir="rtl"` המילה `start` נפתרת ל-right; המילולית `right-2` הייתה מוליכה לפינה השמאלית העליונה בעברית.
5. **`href="/cards"` ולא `<button onClick={router.push}>`**: T-087 קובע שיציאה **⛔ ⛔ מבטלת סימונים שנשלחו** — כלומר אין state לניקוי. `Link` הוא הפתרון הפחות מורכב ומטפל בקדם-טעינה אוטומטית של Next.
6. **`aria-label="סגור"`**: הכפתור מכיל SVG בלבד (`<CloseIcon>` נושא `aria-hidden`), ולכן חייב שם נגיש **על הכפתור עצמו**. `<CloseIcon>` **⛔ ⛔** נושא שם משלו (‏JSDoc שם: «אייקון שמכריז על עצמו גורם לקורא מסך להקריא את אותו דבר פעמיים»).

---

- [ ] **Step 1: כתוב את הבדיקה שנכשלת** — הוסף `describe` חדש בסוף `components/StudyDeckScreen.test.ts`.

**קודם** — ודא שלקובץ יש את הפריאמבל של קריאת מקור (‏אם הבדיקות הקיימות רצות נגד ה-DOM, הוסף את בלוק הקריאה בראש הקובץ; אם כבר קיים, השתמש בו):

```typescript
// בסוף components/StudyDeckScreen.test.ts:

import { readFileSync as _t087_read } from 'node:fs';

/**
 * T-087 · § 4.2ח ⓒ — פעולת סגירה על מסך מנת היום.
 *
 * סורק מקור, ⛔ ⛔ DOM. הענף `state.kind === 'cards'` דורש טעינה מוצלחת של
 * `/api/study/queue`, וההארנס של Vitest רץ בסביבת `node` בלי fetch — היה
 * מרנדר את ה-`loading` state ומגיע לאסרציה של ⛔ ⛔ נכון. הקריאה על המקור
 * מודדת את מה שהקומפיילר יעביר ל-DOM, בלי לדרוש רינדור.
 */
const T087_SRC = _t087_read('components/StudyDeckScreen.tsx', 'utf8')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/** הבלוק של ענף `state.kind === 'cards'` — הזחה עמוקה-נסמכת ⛔ ⛔ regex עצל. */
function cardsBranch(src: string): string {
  const at = src.indexOf("state.kind === 'cards'");
  if (at === -1) return '';
  // מוצא את סגירת ה-`if (...)` ואת ה-`return (` שאחריו.
  const returnAt = src.indexOf('return (', at);
  if (returnAt === -1) return '';
  // עומק סוגריים על ה-`(` שאחרי `return`.
  let depth = 0;
  for (let i = returnAt + 'return '.length; i < src.length; i += 1) {
    const c = src[i];
    if (c === '(') depth += 1;
    else if (c === ')') {
      depth -= 1;
      if (depth === 0) return src.slice(returnAt, i + 1);
    }
  }
  return '';
}

describe('the study screen carries a top-anchored close (T-087 · § 4.2ח ⓒ)', () => {
  it('קורא מקור עם ענף `cards` תקין', () => {
    // שומר-ריק — refactor של המצב היה גורם לכל האסרציות להלן לעבור ריק.
    expect(T087_SRC.length).toBeGreaterThan(1000);
    const branch = cardsBranch(T087_SRC);
    expect(branch, 'ענף `cards` לא נמצא').toContain('<CardDeck');
  });

  it('הענף `cards` מכיל אלמנט עם `data-close` ו-`href="/cards"`', () => {
    const branch = cardsBranch(T087_SRC);
    expect(branch, 'חסרה יציאה — `data-close` לא נמצא בענף `cards`').toContain('data-close');
    expect(branch, 'היציאה חייבת לחזור לבורר `/cards` (§ 4.2ח ⓒ)').toMatch(/href="\/cards"/);
  });

  it('היציאה נושאת `<CloseIcon />` מיובא ⛔ ⛔ SVG שני', () => {
    const branch = cardsBranch(T087_SRC);
    expect(branch, 'האייקון חייב להיות `<CloseIcon />`').toContain('<CloseIcon');
    // ⛔ ⛔ SVG מוטבע נוסף — הרכיב `CloseIcon` הוא **הקובץ היחיד** ל-SVG הזה.
    expect(branch, 'SVG מוטבע נוסף ⛔ ⛔ מותר — השתמש ב-`<CloseIcon />`').not.toMatch(/<svg\b/);
    // הייבוא חייב להופיע בקובץ.
    expect(T087_SRC).toMatch(/from ['"]@\/components\/CloseIcon['"]/);
  });

  it('יעד המגע של היציאה ≥44px (`min-h-touch min-w-touch`)', () => {
    const branch = cardsBranch(T087_SRC);
    // האלמנט שנושא `data-close` — קטע 200 תווים סביבו כדי להכיל את ה-className.
    const at = branch.indexOf('data-close');
    const near = branch.slice(Math.max(0, at - 300), at + 300);
    expect(near, 'היעד חייב להיות ≥44px גובה (`min-h-touch`)').toContain('min-h-touch');
    expect(near, 'היעד חייב להיות ≥44px רוחב (`min-w-touch`)').toContain('min-w-touch');
  });

  it('היציאה נושאת `aria-label="סגור"` — האייקון בלבד ⛔ ⛔ שם נגיש', () => {
    const branch = cardsBranch(T087_SRC);
    const at = branch.indexOf('data-close');
    const near = branch.slice(Math.max(0, at - 300), at + 300);
    expect(near, '`<CloseIcon>` נושא `aria-hidden` ⇒ הקישור עצמו חייב `aria-label`').toMatch(
      /aria-label="סגור"/,
    );
  });

  it('⛔ ⛔ `data-primary-action` על היציאה — עלול לשבור F-027 של `/study`', () => {
    const branch = cardsBranch(T087_SRC);
    const at = branch.indexOf('data-close');
    const near = branch.slice(Math.max(0, at - 300), at + 300);
    // `main [data-primary-action]` חייב לספור **סימון אחד בדיוק** בכל FLOW_ROUTE
    // (verify-mobile.mjs:596). הענף `cards` היום ⛔ ⛔ נושא סימון (הכרעת T-065),
    // והיציאה החדשה ⛔ ⛔ הופכת אותו לסימון־ראשי כדי שהחוזה יישמר.
    expect(near, '⛔ ⛔ `data-primary-action` על הסגירה').not.toMatch(/data-primary-action/);
  });

  it('⛔ ⛔ `data-close` בענפים אחרים (`error`/`empty`/`session_expired`/`schema_missing`/`loading`)', () => {
    // שאר הענפים משתמשים ב-`ActionBar` — הוספת סגירה שם היא סימון שני שקורא לבלבול.
    const branch = cardsBranch(T087_SRC);
    const total = (T087_SRC.match(/data-close/g) || []).length;
    const inBranch = (branch.match(/data-close/g) || []).length;
    expect(total, `\`data-close\` מופיע ${total} פעמים בסה"כ ובלוק \`cards\` ${inBranch}; חייב להיות שווה`).toBe(inBranch);
  });

  it('⛔ ⛔ SVG מוטבע נוסף בכל הקובץ (חוקה § 6)', () => {
    // הקובץ ⛔ ⛔ מגדיר SVG משלו — רק צורך את `<CloseIcon>` (וגליף הטקסט של `<CardDeck>`).
    expect(T087_SRC.match(/<svg\b/g) ?? [], 'SVG מוטבע חדש ⛔ ⛔ בקובץ הזה — השתמש ב-`<CloseIcon>`').toHaveLength(0);
  });
});
```

- [ ] **Step 2: הרץ ותאמת אדום**

```bash
npx vitest run components/StudyDeckScreen.test.ts
```

Expected: **7 בדיקות T-087 נופלות** — «חסרה יציאה» · «`<CloseIcon />`» · «`min-h-touch`» · «`aria-label`» · «⛔ `data-primary-action`» (עוברת בשוגג — ⛔ קיים ⛔) · «`data-close` בענפים אחרים» (עוברת — 0=0) · «⛔ SVG מוטבע» (עוברת). שים לב: הבדיקות **הרלוונטיות** (חמש) נופלות. הבדיקות הישנות ממשיכות לעבור.

- [ ] **Step 3: מַמֵּש — הוסף את היציאה בענף `cards`**. ערוך את `components/StudyDeckScreen.tsx`:

**הוסף ייבוא** בראש הקובץ (אחרי `import ActionBar`, שורה 5):

```tsx
import CloseIcon from '@/components/CloseIcon';
```

**החלף** את הבלוק שורות 181-197 (הענף `state.kind === 'cards'`) בגרסה עם `<section>` `relative` וסגירה `absolute`:

```tsx
  if (state.kind === 'cards') {
    return (
      // T-087 · § 4.2ח ⓒ — פעולת סגירה מעוגנת למעלה.
      //
      // שלוש הכרעות מדידות:
      // 1. `absolute` על `<section>` `relative` ⛔ ⛔ תוספת שורה בתוך `<CardDeck>`:
      //    `<CardDeck>` מחשב `h-[calc(100dvh-10rem)]` על chrome קבוע של `app/layout.tsx`
      //    (‏CardDeck.tsx:130-148), וכל תוספת גובה כאן שוברת את החישוב הזה בשקט
      //    ומפילה את T-086 (2 מ-3 בדיקות ההארנס ב-`/dev/deck`).
      // 2. `start-2` וְ⛔ ⛔ `right-2` — CSS logical, נפתר תחת RTL לפינה הימנית העליונה
      //    (בעברית) ולפינה השמאלית העליונה בכיוון LTR (‏אם ההחלטה תשתנה).
      // 3. `aria-label="סגור"` על הקישור — `<CloseIcon>` נושא `aria-hidden` (‏שם נגיש
      //    כפול היה גורם לקורא-מסך להקריא «סגור סגור»). ⛔ ⛔ `data-primary-action`
      //    על הסגירה — /study הוא FLOW_ROUTE וסלקטור `main [data-primary-action]`
      //    דורש **סימון אחד בדיוק** (‏verify-mobile.mjs:596). הענף `cards` היום
      //    ⛔ ⛔ נושא סימון כזה (הכרעת T-065), והסגירה ⛔ ⛔ הופכת אותו לסימון־ראשי.
      <section className="relative">
        <Link
          href="/cards"
          data-close
          aria-label="סגור"
          className="absolute start-2 top-2 z-10 flex min-h-touch min-w-touch items-center justify-center rounded-lg text-ink active:opacity-90"
        >
          <CloseIcon />
        </Link>
        {gradeError !== '' && (
          <p role="status" className="px-1 pb-2 text-base text-danger">
            {gradeError}
          </p>
        )}
        {/* ⛔ ⛔ <ActionBar> בענף זה: הוא `fixed` לקצה התחתון ויושב על שני
            כפתורי הסימון — הפעולה היחידה שהמסך קיים בשבילה. הדרך קדימה כאן
            **היא** הסימון; הסגירה למעלה היא דרך יציאה חלופית. */}
        <CardDeck deck={deck} cards={state.cards} onGraded={onGraded} />
      </section>
    );
  }
```

- [ ] **Step 4: הרץ עד ירוק**

```bash
npx vitest run components/StudyDeckScreen.test.ts
```

Expected: כל הבדיקות ירוקות.

- [ ] **Step 5: מוטציית אימות** — הַפֵּל את `data-primary-action`.

הוסף זמנית `data-primary-action="true"` על ה-`<Link>` של הסגירה.

```bash
npx vitest run components/StudyDeckScreen.test.ts -t "⛔ ⛔ `data-primary-action`"
```

Expected: **נפילה** של הבדיקה. הַסֵּר, ודא ירוק שוב.

- [ ] **Step 6: הרץ את שער העבודה המלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

Expected: כל ארבעת ירוקים. סך הבדיקות עולה ב-7 (‏אחרי T-085: 2148 → 2155 בסביבות). **קלוט את המספר המדויק ל-Self-Review**.

- [ ] **Step 7: הרץ `check:mobile` ובדוק שאין רגרסיה על `/study` ו-`/dev/deck`**

```bash
npm run check:mobile 2>&1 | tail -40
```

Expected: **ירוק** — T-086 (᾿המדידה מ-Task 2) עדיין ירוקה, ו-`/study` בזרם FLOW_ROUTES ממשיך לספור סימון־ראשי אחד בדיוק (עדיין כשל env → error state, לא `cards`).

- [ ] **Step 8: קומיט**

```bash
git add components/StudyDeckScreen.tsx components/StudyDeckScreen.test.ts
git commit -m "loop(DEV): T-087 · top-anchored close on /study cards state (§ 4.2ח ⓒ)"
```

---

## Task 4 — סגירת התוכנית: עדכון קבצי plan/, שער-כולל, קידום

**Files:**
- Modify: `plan/50-tasks.md` — סמן T-085 · T-086 · T-087 כ-`🟣` (בסקירה), הוסף שורת קידוד לכל אחת.
- Modify: `plan/60-findings.md` — אם נפתחו ממצאים חדשים בטיק (F-XXX), הוסף אותם; אחרת ⛔ נגיעה.
- Modify: `plan/30-architecture.md` — הוסף פסקה קצרה תחת §-DEV על שינוי כפתור-בתוך-כפתור וההחלטה של `<button>` טבעי במקום `role="button"`.
- Modify: `plan/00-control.md` — `CYCLE_ID`, `NEXT_AGENT=CRITIC`, `LOCK_HELD_BY=""` (שחרור), `MILESTONE_TICKS` +1, שלוש שורות בבלוק `0.1` (החלף את הכי ישן).

---

- [ ] **Step 1: `git pull` ובדוק אם `CYCLE_ID` נוכחי עלה** (בלם 2)

```bash
git pull --rebase origin dev
grep 'CYCLE_ID' plan/00-control.md | head -1
```

אם `CYCLE_ID` שהיה `C-0231` בתחילת הטיק עלה — סוכן אחר ריצה. ⛔ ⛔ להמשיך. שחרר את הנעילה שלך אם קיימת ⇒ צא.

- [ ] **Step 2: הרץ את השער-הכולל, פעם אחרונה, אחרי כל העריכות**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile 2>&1 | tail -20
```

Expected: כל חמישה ירוקים. קלוט את הפלט לדיווח.

- [ ] **Step 3: עדכן `plan/50-tasks.md`** — סמן שלוש השורות כ-`🟣` (בסקירה) והוסף לכל אחת את שורת ה-C-XXXX המכסה של הטיק.

לכל אחת מ-T-085/086/087 החלף את התא הרביעי מ-`⬜` ל-`🟣 **בוצעה C-XXXX (DEV, טיק ביצוע — Task N בתוכנית `2026-08-20-flashcard-interaction.md`).** <תקציר של 1-2 משפטים על מה בוצע ומה נמדד>`.

**⚠️ שים לב לצינורות בתוך תא**: כל צינור בתוך code span חייב להיות `\|` (‏F-063 · T-101 · T-129). הרץ `npm run measure:plan` **באותו קומיט**.

- [ ] **Step 4: הרץ `measure:plan` ואמת רגיסטר תקין**

```bash
npm run measure:plan
```

Expected: `tasks: N rows, 0 malformed` (‏N יגדל ב-0, השורות קיימות). אם `malformed` עלה — הבריח את הצינור בתא הפוגע, הרץ שוב.

- [ ] **Step 5: עדכן `plan/00-control.md`** — הכל בעריכה אחת:
  - `CYCLE_ID: C-XXXX` (‏קרא את הישן ב-`git pull` ואז +1)
  - `NEXT_AGENT: CRITIC # <תקציר של 1-2 שורות>`
  - `ACTIVE_TASK_ID: ""`
  - `CRITIC_ROUNDS_ON_TASK: 0`
  - `LAST_HANDOFF_AT: <date -u +%Y-%m-%dT%H:%M:%SZ>`
  - `LOCK_HELD_BY: ""` (שחרור; רשום מתי נעל ומתי שחרר בהערה)
  - `LOCK_AT: ""`
  - `MILESTONE_TICKS: <ישן + 1>` (⚠️ RULES § 0.1.1 ו׳ — 120 הוא התקרה, ⛔ 60. סוכן ⛔ מאפס ו⛔ מעלה מעל)
  - בבלוק `0.1` — הכנס שורה חדשה של המחזור הנוכחי לראש הטבלה, מחק את השורה השלישית (הכי ישנה) והעבר אותה ל-`plan/archive/handoff-log.md`.

- [ ] **Step 6: `date -u` וקבע חותמות אמת, ⛔ ⛔ ניחוש**

```bash
date -u +%Y-%m-%dT%H:%M:%SZ
```

הכנס לשדות `LAST_HANDOFF_AT`, `LOCK_HELD_BY` היסטוריה. ⛔ ⛔ להעתיק חותמת ישנה.

- [ ] **Step 7: קומיט אחרון + דחיפה** (⛔ ⛔ `[skip ci]`)

```bash
git add plan/00-control.md plan/50-tasks.md docs/plan-tables.md plan/30-architecture.md
git commit -m "loop(DEV): C-XXXX · T-085 · T-086 · T-087 → CRITIC (§ 4.2ח סגורה)"
git push origin dev
```

Expected: `git push` מצליח, בלי שגיאת אימות.

---

## Self-Review

**1. Spec coverage:** § 4.2ח מונה שלוש הכרעות + שלושה מדדי הצלחה. הטבלה:

| דרישה מ-§ 4.2ח | המשימה | הצעד המימוש | המדד |
|---|---|---|---|
| ⓐ פני הכרטיס = יעד המגע (D-039) | T-085 | Task 1 · Step 3 (חזית ⇒ `<button>`) | Task 1 · Step 4 (6 בדיקות מקור ירוקות) |
| ⓐ «הצג תשובה» יורד לרמז בתוך הכרטיס | T-085 | Task 1 · Step 3 (`data-reveal-hint`) | «הרמז חי בתוך הכפתור» |
| ⓐ שני כפתורי סימון ⛔ ⛔ מקוננים | T-085 | Task 1 · Step 3 (‏grade נשאר תחת `mt-auto`) | «⛔ `<button>` בתוך `<button>`» — עומק ≤1 |
| ⓐ `:focus-visible` + Enter/Space | T-085 | `<button>` הטבעי → מגיע חינם מ-`globals.css:72` | ⛔ בדיקת יחידה — כללי גלובלי; מוטציית «`<div>` במקום `<button>`» מפילה |
| ⓑ מדידה לפני תיקון | T-086 | Task 2 · Step 3 (`npm run check:mobile`) | Task 2 · Step 3 (‏פלט `report()` של T-086) |
| ⓑ כרטיס אחד בכל רגע | T-086 | Task 2 · Step 2 (הרחבת בדיקה בהארנס) | 3 אסרציות `check()` בכל 3 רחבים · דיווח `T-086:` |
| ⓒ פעולת סגירה מעוגנת למעלה | T-087 | Task 3 · Step 3 (`<Link data-close absolute top-2 start-2>`) | Task 3 · Step 4 (`data-close` בענף `cards`) |
| ⓒ SVG ⛔ ⛔ אמוג'י | T-087 | Task 3 · Step 3 (`<CloseIcon />`) | «⛔ SVG מוטבע נוסף» + «`<CloseIcon />`» |
| ⓒ ≥44px | T-087 | Task 3 · Step 3 (`min-h-touch min-w-touch`) | «יעד המגע ≥44px» |
| ⓒ חוזר ל-`/cards` | T-087 | Task 3 · Step 3 (`href="/cards"`) | «אלמנט עם `data-close` ו-`href="/cards"`» |
| ⓒ ⛔ ⛔ סרגל תחתון | T-087 | Task 3 · Step 3 (ר״ל absolute) | ⛔ בדיקה — הבחירה הארכיטקטונית; מוטציית «`<ActionBar>` במקום» תפיל T-086 באמצעות calc `10rem`  |
| ⓒ יציאה באמצע ⛔ ⛔ מבטלת סימונים | T-087 | Task 3 · Step 3 (`Link` ⛔ ⛔ handler) | ⛔ בדיקה — ⛔ state לניקוי; מוטציית «onClick + preventDefault + fetch cancel» היא באג יסודי |

**⛔ פערים מוצהרים, ⛔ ולא מוסתרים:**
- ⓐ **Enter/Space לא נבדקים ב-Vitest** — הבדיקות סמנטיות (סורק מקור), ומדד ה-«`<button>` טבעי» נסמך על התנהגות דפדפן. מוטציית «`<div>` עם `data-reveal`» מפילה את בדיקת «חזית הכרטיס הופכת ל-`<button>`», שהיא הראיה שהמקלדת עובדת. אם נדרש מדד DOM חי — יש להוסיף ל-`scripts/verify-mobile.mjs` בלוק שדוחף Enter ל-`[data-reveal]` על `/dev/deck` — אבל זו הרחבה מעבר לתוכנית ותועד כ-**TD** אם נדרש בפועל.
- ⓑ **המדידה של רוי הייתה על פרודקשן עם env** — לוקאלית `/study` ב-`next start` מרנדר את מצב הכשל שלו (`error`/`schema_missing`) ⛔ ⛔ מגיע ל-`cards`. `/dev/deck` הוא הפיקסטורה הזמינה, ובדיקת 5 הכרטיסים עליה היא **הכי חזקה שההארנס יודע להריץ**. אם רוי מודד שוב על פרודקשן ורואה שוב 5 כרטיסים — פותחים ממצא חדש עם ראיית env-specific ו-Critic מבקש פיקסטורה נוספת.
- ⓒ **הסגירה חיה רק ב-`cards`** — במצב `error` יש כבר `<ActionBar>` עם דרך יציאה שלא מובילה חזרה ל-`/cards` אלא ל-`/sources`. אם רוי חושב שהיציאה חייבת להיות **בכל מצב**, נדרש הכרעה חדשה של PM (‏פותח ממצא, ⛔ מטלטל בטיק הזה).

**2. Placeholder scan:** ⛔ TODO · ⛔ «add appropriate error handling» · ⛔ «similar to Task N» · ⛔ «write tests for the above». כל הבדיקות כתובות במלואן, כל שינוי CSS כתוב במלואו.

**3. Type consistency:** 
- `CloseIcon` — מיובא כ-default מ-`@/components/CloseIcon` בשני מקומות (‏`<ArenaBoard>` הקיים ו-`<StudyDeckScreen>` החדש).
- `data-reveal` — קיים ב-`Flashcard.tsx` וקורא ההארנס `scripts/verify-mobile.mjs:1204` — הסלקטור נשמר.
- `data-card-front` — נשאר על שורה 64 של Flashcard, בתוך הכפתור החדש.
- `QueueCardInput` — הפיקסטורה של Task 2 עומדת בחתימה ב-`lib/core/deck` (‏אימות ב-typecheck).
- `data-close` — סלקטור חדש, אנקוד רק כאן; בדיקת T-087 היחידה שסורקת אותו.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-20-flashcard-interaction.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.
