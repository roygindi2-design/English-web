import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-045 · D-024 guard — the "טרם אומת" marker on the back of the card.
 *
 * This file does NOT render React. The Vitest environment is `node` on purpose
 * (see vitest.config.ts), and the marker is only reachable after the learner
 * reveals the answer — `revealed` is component state, so a static
 * `renderToStaticMarkup` would emit a card with no `data-card-back` block at all
 * and every assertion below would pass vacuously. Adding jsdom plus a
 * click-driver to reach one paragraph is a dependency this repo has so far paid
 * zero of, so the claim is split in two instead:
 *
 *   ✔ proved in lib/core/flashcard.test.ts: `back.unverified` is true exactly
 *     when the sense needs review, and `front.unverified` never is — in both
 *     directions. That is the behaviour.
 *   ✔ proved here: the marker markup exists exactly once, sits INSIDE the
 *     `data-card-back` block, is gated on `card.back.unverified`, and carries a
 *     text label rather than a colour or a glyph alone.
 *   ✔ proved in scripts/verify-mobile.mjs: a real engine reveals `/dev/card`
 *     (whose fixture is the one unverified card in the repo) and finds exactly
 *     one `[data-card-unverified]` inside `[data-card-back]`, carrying text
 *     after the glyph is stripped, and none inside `[data-card-front]`.
 *   ✘ still NOT proved: the marker under a direction other than recognition in
 *     a real engine — `/dev/card/typed` is verified on purpose, so that the
 *     unmarked back is measured too. The core test covers that direction.
 *
 * The three together are what make it a measurement: the source scan cannot see
 * a runtime bug in `buildCard`, the core test cannot see a marker rendered next
 * to the front, and neither can see a paragraph that paints empty. Deleting any
 * one of them leaves a hole this comment names.
 */

const FLASHCARD = join('components', 'Flashcard.tsx');
const MARKER = 'טרם אומת';

/**
 * The full text of the JSX element that carries `marker`, from its own `<div`
 * to the matching `</div>`.
 *
 * Depth-counted rather than lazily matched, for the reason EnWord.test.ts
 * records about JSX: `<div[\s\S]*?</div>` stops at the FIRST close tag, which
 * for a block containing any nested div is the wrong one, and the test then
 * silently measures a prefix of the block it meant to measure.
 */
function divBlockContaining(src: string, marker: string): string | null {
  const at = src.indexOf(marker);
  if (at === -1) return null;
  const start = src.lastIndexOf('<div', at);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    if (src.startsWith('<div', i)) depth += 1;
    else if (src.startsWith('</div>', i)) {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + '</div>'.length);
    }
  }
  return null;
}

/**
 * Comments out. Measured, not tidiness: mutation 5 of this task replaced the real
 * `{card.back.unverified ? (` gate with `{revealed ? (` and ALL SIX tests stayed
 * green, because the explanatory JSX comment directly above the marker contains
 * the string `card.back.unverified` and sits inside the same block. A scan that
 * can be satisfied by prose is not a scan.
 */
function stripComments(text: string): string {
  return withoutComments(text);
}

const src = stripComments(readFileSync(FLASHCARD, 'utf8'));

describe('the unverified marker lives on the back of the card (T-045 · D-024)', () => {
  it('reads a real component file with a real back block', () => {
    // A vacuity guard. An empty read, or a renamed hook attribute, would make
    // every assertion below pass against nothing — the failure mode F-016 rode
    // in on.
    expect(src.length).toBeGreaterThan(1000);
    expect(src).toContain('data-card-back');
    expect(src).toContain('data-card-front');
  });

  it('renders the marker inside the back block, never outside it', () => {
    const block = divBlockContaining(src, MARKER);
    expect(block, 'the marker paragraph is not inside any div').toBeTruthy();
    expect(block, 'the marker must sit in the block gated by `revealed`').toContain(
      'data-card-back',
    );

    // Belt and braces: the marker's index must fall inside the back block's own
    // span. A marker placed next to the front, inside some other wrapper that
    // happened to mention data-card-back, would clear the assertion above.
    const backBlock = divBlockContaining(src, 'data-card-back') ?? '';
    expect(backBlock).toContain(MARKER);
  });

  it('renders the marker exactly once', () => {
    // Twice means the front got one too, or a copy survived a refactor. Either
    // way the "back only" claim is no longer true of the file.
    expect(src.split(MARKER).length - 1).toBe(1);
  });

  it('gates the marker on card.back.unverified and nothing else', () => {
    // Not `sense.needsHumanReview`, not a prop, not a second boolean: TD-11 is
    // the recorded cost of re-deriving a card property inside React, and here the
    // drift would put the flag on the wrong face rather than merely out of date.
    const block = divBlockContaining(src, MARKER) ?? '';
    // The whole conditional expression, not the bare identifier: `card.back.unverified`
    // appearing ANYWHERE in the block — in a sibling condition, or in prose before the
    // comments were stripped — is not evidence that it is what opens this branch.
    const gate = block.search(/\{\s*card\.back\.unverified\s*\?/);
    expect(gate, 'the marker must be opened by `{card.back.unverified ? …}`').toBeGreaterThan(-1);
    expect(gate, 'the condition must come before the text it guards').toBeLessThan(
      block.indexOf(MARKER),
    );
    // …and no second condition may reopen the branch between the gate and the text.
    const between = block.slice(gate + 1, block.indexOf(MARKER));
    expect(between, 'a different boolean gates the marker after all').not.toMatch(
      /\{\s*[A-Za-z_$][\w.$]*\s*\?/,
    );
    expect(block, 'the flag must not be read off the sense inside React').not.toContain(
      'needsHumanReview',
    );
  });

  it('carries a text label, never colour alone', () => {
    // The rule T-041 established and the palette records: --success and --danger
    // separate by only ΔE 4.1 for a deutan reader, so no state in this product is
    // ever signalled by colour alone. The marker states itself in words.
    expect(src).toMatch(/טרם אומת/);
    const block = divBlockContaining(src, MARKER) ?? '';
    const paragraph = block.slice(block.lastIndexOf('<p', block.indexOf(MARKER)));
    expect(paragraph, 'the marker text must be a sentence, not a bare two-word tag').toMatch(
      /טרם אומת\s*—/,
    );
    // A decorative glyph is a second channel, not a replacement for the sentence,
    // so it stays out of the accessibility tree.
    expect(paragraph).toContain('aria-hidden="true"');
  });

  it('introduces no colour token for the marker', () => {
    // The palette has 11 tokens and none of them means "warning" (lib/core/palette.ts).
    // Inventing one here would be a design decision taken in a component file,
    // and plan/35-design-constitution.md is the only place that may take it.
    const block = divBlockContaining(src, MARKER) ?? '';
    const paragraph = block.slice(block.lastIndexOf('<p', block.indexOf(MARKER)));
    expect(paragraph, 'the discreet register is text-ink-muted').toContain('text-ink-muted');
    for (const forbidden of ['text-danger', 'text-success', 'text-brand', 'warning', 'amber', 'yellow']) {
      expect(paragraph, `${forbidden} is not a token this product has`).not.toContain(forbidden);
    }
  });
});

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
/** T-293ⓒ — the lean lives in CSS, ⛔ not in the component ⇒ the guard has to read the CSS. */
const GLOBALS_CSS = readFileSync(join('app', 'globals.css'), 'utf8');

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

  /**
   * 🔴 **הפוכה 26/08 — D-090ⓑ · T-157.** הבדיקה כאן אסרה **כל מטפל תנועה** בנימוק
   * «D-042ⓒ: הכרטיס ⛔ אינו נגרר». ⛔ **D-090ⓑ הפכה בדיוק את הסעיף הזה**: נמדד ש-
   * `SWIPE_FEEDBACK_MAX_PX = 8` הוא משוב שהלומד ⛔ אינו מרגיש, והכרטיס עוקב עכשיו אחרי
   * האצבע **1:1**. ⇒ הנימוק חדל להתקיים, ⛔ והבדיקה ⛔ לא נמחקה — היא מודדת עכשיו את מה
   * ש**כן** נשאר אסור, וזה **חד יותר** ממה שהיה:
   *
   * ⓐ **הגרירה עוברת בשכבה הטהורה** (`dragOffset`) ⛔ ואינה מחושבת ב-JSX — שם היא הייתה
   *   נבדקת רק בדפדפן, ⛔ ואף פעם לא בגבול שלה (מספר לא-סופי · reduced-motion).
   * ⓑ ⛔ **אפס `onTouchMove`/`onTouchStart`/`onDrag`** — מטפלי מגע מקבילים ל-Pointer הם
   *   מסלול שני לאותה מחווה, וזה בדיוק מה ש-D-042 אוסרת.
   * ⓒ **מחווה שנחטפה חוזרת** — `onPointerCancel` חייב להתקיים, אחרת כרטיס נשאר תלוי
   *   באמצע המסך בלי שאיש דירג אותו.
   */
  it('T-157 · D-090ⓑ — הגרירה עוברת בשכבה הטהורה, ⛔ ואין מסלול מגע שני', () => {
    expect(T085_CARD_SRC, 'הכרטיס חייב לעקוב אחרי האצבע — D-090ⓑ').toContain('onPointerMove');
    expect(T085_CARD_SRC, 'ההכרעה חיה ב-lib/core/swipeGrade.ts').toContain('dragOffset(');
    expect(T085_CARD_SRC, 'מחווה שנחטפה חייבת להחזיר את הכרטיס').toContain('onPointerCancel');
    for (const forbidden of ['onTouchMove', 'onTouchStart', 'onDrag']) {
      expect(T085_CARD_SRC, `${forbidden} ⇒ מסלול שני לאותה מחווה — D-042 אוסרת`).not.toContain(
        forbidden,
      );
    }
  });

  /** ⛔ מוטציה: תקרת שמונת הפיקסלים ⛔ לא תחזור. */
  it('MUTATION: ⛔ אין תקרה קשיחה על ההיסט של הגרירה', () => {
    const pure = readFileSync('lib/core/swipeGrade.ts', 'utf8');
    expect(pure).not.toContain('SWIPE_FEEDBACK_MAX_PX');
    // ⛔ ולא `Math.min`/`Math.max` על ההיסט: 1:1 פירושו ⛔ אין חיתוך.
    const start = pure.indexOf('export function dragOffset');
    expect(start).toBeGreaterThan(-1);
    const body = pure.slice(start, pure.indexOf('\n}', start));
    expect(body).not.toMatch(/Math\.(min|max|sign)/);
  });

  /**
   * T-293ⓐⓓ (PM, 12/09 — Roy's observation 11/09, `F-217`) — REPLACES the `sr-only` half of
   * T-259ⓕ, and keeps the other half word for word. Measured in Chromium 375×780 on
   * `/dev/card`: `sr-only focus:not-sr-only` renders these two at **1×1 px, transparent** ⇒
   * for a sighted learner the swipe was the ⛔ ONLY grade channel, which `D-042` forbids in
   * so many words. ⇒ they are visible, ≥44px, and ⛔ still exactly two buttons with exactly
   * the same names and the same handler — the accessible channel ⛔ did ⛔ not shrink.
   * ⛔ `display: none` / `hidden` would remove them from the accessibility tree too.
   */
  it('T-293ⓐ — שני כפתורי הדירוג נראים ללומד רואה, ≥44px, ⛔ ולא sr-only', () => {
    for (const grade of ['good', 'again'] as const) {
      const at = T085_CARD_SRC.indexOf(`data-grade="${grade}"`);
      expect(at, `data-grade="${grade}" חייב להתקיים`).toBeGreaterThan(-1);
      const open = T085_CARD_SRC.lastIndexOf('<button', at);
      const close = T085_CARD_SRC.indexOf('</button>', at);
      const block = T085_CARD_SRC.slice(open, close);
      // 🔴 תרחיש הכשל של `F-217`: הכפתור חוזר להיות `sr-only` ⇒ 1×1 פיקסל, והמחווה שבה
      // להיות הערוץ היחיד — בדיוק מה ש-`D-042` אוסרת, ו-`check:mobile` ⛔ אינו רואה.
      expect(block, 'כפתור דירוג ⛔ אינו חוזר ל-sr-only').not.toMatch(/(?<![\w-])sr-only\b/);
      expect(block, 'יעד המגע ≥44px ⛔ ולא רק בפוקוס').toMatch(/(?<![\w-])min-h-touch\b/);
      // ⛔ the Tailwind class `hidden` (display:none) — ⛔ not the `aria-hidden` on the glyph,
      // which is exactly what keeps the glyph out of the accessible name.
      expect(block).not.toMatch(/(?<![\w-])hidden\b/);
    }
    // ⓓ — ⛔ עדיין בדיוק שני כפתורי דירוג, ⛔ ולא מסלול שני שנפתח עם הנראות.
    expect(T085_CARD_SRC.match(/data-grade="/g)?.length).toBe(2);
    expect(T085_CARD_SRC).toContain('לא ידעתי');
    expect(T085_CARD_SRC).toContain('ידעתי');
  });

  it('D-042 — המחווה קוראת ל-onGrade, ⛔ ולא למסלול שני', () => {
    // ⛔ `resolveSwipe` הוא היחיד שמכריע, ו-`onGrade` הוא היחיד שמסמן: שתי
    // המחרוזות ⛔ אינן מספיקות בנפרד, ולכן שתיהן נדרשות באותה בדיקה.
    expect(T085_CARD_SRC).toContain('resolveSwipe');
    expect(T085_CARD_SRC).toContain('onPointerUp');
    expect(T085_CARD_SRC).toContain('onPointerDown');
    // ⛔ אפס לוגיקת ציון מקומית: הציון מגיע מהמודול הטהור ונמסר כמו שהוא.
    expect(T085_CARD_SRC).not.toMatch(/onGrade\(\s*['"]good['"]\s*\)\s*;?\s*\/\/\s*swipe/);
  });

  /**
   * D-150 (סוגר את F-102) — `render_video_A.py:373`: `# RTL: "ידעתי" on the right`,
   * ו-`:374` מציב את «ידעתי» ב-`bx = 30 + bw + 14` (הימני). תחת `dir="rtl"` פריט
   * ה-grid הראשון יושב מימין ⇒ «ידעתי» חייבת להיות הראשונה.
   * ⛔ שתי הטענות באותו `it` בכוונה: הן אותה טענה. כפתור שהתהפך בלי המחווה, או
   * מחווה שהתהפכה בלי הכפתור, הם בדיוק אותו באג בכיוון ההפוך.
   */
  it('D-150 — «ידעתי» היא פריט ה-grid הראשון, והמחווה ימינה מסכימה איתה', () => {
    const good = T085_CARD_SRC.indexOf('data-grade="good"');
    const again = T085_CARD_SRC.indexOf('data-grade="again"');
    expect(good).toBeGreaterThan(-1);
    expect(again).toBeGreaterThan(-1);
    expect(good, '«ידעתי» ⛔ אינה הכפתור הראשון ב-grid').toBeLessThan(again);

    const pure = readFileSync('lib/core/swipeGrade.ts', 'utf8');
    expect(pure, 'המחווה ימינה ⛔ אינה `good` יותר').toContain("dx > 0 ? 'good' : 'again'");
  });

  /**
   * F-106 — התוכנית הכתיבה כאן `expect(SRC).not.toContain('preventDefault')` וניבאה
   * שהיא «עוברת כבר עכשיו». ⛔ היא ⛔ אינה יכולה לעבור: `onSubmit` של טופס ההקלדה
   * קורא `e.preventDefault()` מאז T-085, וזו קריאה **נכונה ולא קשורה** — בלעדיה
   * הטופס מרענן את העמוד. אסרציה שאפשר לספק רק במחיקת קוד עובד ⛔ אינה שומר.
   * ⛔ הבדיקה ⛔ לא הוחלשה — היא **כוונה לטענה שהיא התכוונה אליה**: D-042ⓒ אוסרת
   * ביטול ברירת מחדל **במטפל מחווה**, כי זה מה שהורג גלילה. הטופס ⛔ אינו מחווה.
   */
  it('D-042ⓒ — ⛔ אפס `preventDefault` במטפל מחווה (הטופס ⛔ אינו מחווה)', () => {
    const hits: number[] = [];
    for (let i = T085_CARD_SRC.indexOf('preventDefault'); i !== -1; i = T085_CARD_SRC.indexOf('preventDefault', i + 1)) {
      hits.push(i);
    }
    expect(hits.length, 'שומר-ריק: אם אין ולו קריאה אחת, הבדיקה ⛔ אינה מודדת דבר').toBe(1);
    for (const at of hits) {
      // המטפל העוטף הוא זה שנפתח אחרון לפני הקריאה. ⛔ `onPointer*` לפני `onSubmit`
      // פירושו ביטול ברירת מחדל בתוך מחווה — בדיוק מה ש-D-042ⓒ אוסרת.
      expect(
        T085_CARD_SRC.lastIndexOf('onSubmit', at),
        '`preventDefault` בתוך מטפל מצביע ⇒ הגלילה מתה (D-042ⓒ)',
      ).toBeGreaterThan(T085_CARD_SRC.lastIndexOf('onPointer', at));
    }
  });

  it('D-042ⓒ — ⛔ אפס גלילה אופקית שנוצרת בקובץ עצמו', () => {
    expect(T085_CARD_SRC).not.toContain('overflow-x');
    expect(T085_CARD_SRC).not.toContain('touch-action');
  });

  it('⛔ אפס `style={{}}` — ההיזון חי ב-CSS, בתקדים [data-arena-stage]', () => {
    expect(T085_CARD_SRC).not.toContain('style={{');
    expect(T085_CARD_SRC).toContain('data-swipe');
  });

  /**
   * T-233 · `apple-design` § 1 · § 2 — the drag offset is written to the node, ⛔ not
   * to React state. Measured C-0371: `setDragX` on every `pointermove` re-rendered the
   * whole card subtree to move one `translateX` (a ProMotion device sends up to 120
   * events a second). The offset goes through a `ref` and is coalesced to one write
   * per frame with `requestAnimationFrame`; the pending frame is cancelled on
   * `up`/`cancel`, otherwise a stale offset lands AFTER the card was reset.
   * ⛔ `dragOffset` still decides in the pure layer — this moves the WRITE, not the rule.
   * ⛔ The `data-dragging` hook stays: `globals.css:279` switches the transition off
   * through it, and a transition on a per-frame value is lag between finger and card.
   */
  it('T-233ⓐ — ההיסט נכתב לצומת דרך `ref` ומאוחד לפריים, ⛔ ולא דרך state', () => {
    expect(T085_CARD_SRC, 'ההיסט ⛔ אינו state — כל `pointermove` רינדר את כל הכרטיס').not.toContain(
      'setDragX',
    );
    expect(T085_CARD_SRC, 'ההיסט ⛔ אינו מוזן כ-`style` prop').not.toContain('style={');
    expect(T085_CARD_SRC, 'כתיבה אחת לפריים').toContain('requestAnimationFrame(');
    expect(T085_CARD_SRC, 'פריים תלוי מתבטל בשחרור, אחרת היסט ישן נוחת אחרי האיפוס').toContain(
      'cancelAnimationFrame(',
    );
    expect(T085_CARD_SRC, 'ההכרעה נשארת בשכבה הטהורה').toContain('dragOffset(');
    expect(T085_CARD_SRC, 'הוו של `globals.css` — המעבר כבוי בזמן הגרירה').toContain('data-dragging');
  });

  /**
   * T-233 · `apple-design` § 2 — `setPointerCapture`, the precedent is
   * `components/SpellCard.tsx:79`. Without it a finger that leaves the section stops
   * delivering `pointermove`/`pointerup`, and the card hangs mid-gesture with nobody
   * grading it. Released explicitly on `up`/`cancel`.
   *
   * ⚠️ **Measured in Chromium (C-0488), ⛔ not assumed:** capture set on the parent
   * `<section>` retargets the following `click` to the section — a tap on a child
   * `<button>` never reaches the button's handler.
   *
   * 🔴 **⟦REWRITTEN 13/09 · `T-292`⟧ הטענה שלמעלה נכונה; **המנגנון** שהיא נעלה היה שגוי.**
   * היא דרשה שני דברים: ⓐ `closest('…button…')` ב-`pointerdown`, ⓑ שה-`setPointerCapture`
   * יֵשב **בתוך** `onPointerDown`. 🔬 **ונמדד חי 13/09 ב-`/dev/deck` ב-390×844:** כפתור
   * החשיפה הוא **342×475** — *כל פני הכרטיס* — ולכן ⓐ החריג **כל נקודת מגע אפשרית**
   * וההחלקה לפני חשיפה ⛔ מעולם לא התחילה. זה מה שרוי דיווח עליו.
   * ⇒ **הטענה ⛔ לא נזנחה — המנגנון הוחלף במנגנון חזק יותר לאותה מטרה:** הלכידה
   * נדחית עד ש-`|dx|` חוצה סף (⛔ ולא ב-`down`) ⇒ **הקשה ⛔ אינה נלכדת כלל**, ולכן
   * ה-`click` מגיע לכפתור **בלי** שום רשימת החרגה; והחריגה שנשארה מכסה את פקדי
   * הדירוג בלבד, שהם יעד שהלומד מכוון אליו.
   * 📎 המדידה החיה: `/dev/card/swap` מקליק `[data-grade="good"]` אחרי חשיפה,
   * ו-`/dev/deck` מודד עכשיו גם הקשה שחושפת וגם רעד מתחת לסף (`T-292`).
   */
  it('T-292 — הלכידה אחרי הסף, ⛔ ולא ב-`pointerdown`, כדי שהקשה תגיע לכפתור', () => {
    expect(T085_CARD_SRC, 'התקדים: SpellCard.tsx:79').toContain('setPointerCapture(');
    expect(T085_CARD_SRC, 'שחרור מפורש ב-up/cancel').toContain('releasePointerCapture(');
    // ⓐ הסף קיים, והוא מספר ⛔ ולא תחושה.
    expect(T085_CARD_SRC, 'סף היסטרזיס מוצהר (apple-design § 10)').toMatch(
      /CAPTURE_THRESHOLD_PX\s*=\s*\d+/,
    );
    // ⓑ ⛔ והלכידה ⛔ אינה ב-`pointerdown` — זו בדיוק ההיפוך.
    const down = T085_CARD_SRC.indexOf('onPointerDown');
    const move = T085_CARD_SRC.indexOf('onPointerMove');
    const capture = T085_CARD_SRC.indexOf('setPointerCapture(');
    expect(down).toBeGreaterThan(-1);
    expect(move).toBeGreaterThan(down);
    expect(capture, '`setPointerCapture` חייב לשבת אחרי הסף, ב-`onPointerMove`').toBeGreaterThan(
      move,
    );
    // ⓒ ופקדי הדירוג ⛔ עדיין מוחרגים — הם יעד, ⛔ ולא משטח.
    expect(T085_CARD_SRC, 'פקדי הדירוג נשארים ערוץ משל עצמם').toMatch(
      /closest\(\s*['"][^'"]*data-grade[^'"]*['"]\s*\)/,
    );
    // ⓓ ⛔ ו«button» ⛔ אינו חוזר לרשימה: הוא מה שחסם את המחווה.
    expect(T085_CARD_SRC, '⛔ `button` ברשימת ההחרגה מחזיר את הפגם').not.toMatch(
      /closest\(\s*['"][^'"]*\bbutton\b[^'"]*['"]\s*\)/,
    );
  });

  /**
   * T-293ⓑ — REPLACES the direction-teaching sentence. Once the two buttons are visible and
   * labelled (test above), a sentence that spells the gesture out is the interface
   * explaining what it could simply show. What is left is a hint that the shortcut EXISTS.
   * ⛔ And it names ⛔ no physical direction on purpose: `F-102` measured «ימינה» ambiguous
   * under RTL, and `T-293ⓒ` answers it by pointing — the destination button leans while the
   * finger is down (`data-swipe-preview`, globals.css).
   */
  it('T-293ⓑ — הרמז קצר, מפנה אל הכפתורים, ו⛔ אינו מלמד כיוון פיזי', () => {
    const at = T085_CARD_SRC.indexOf('data-swipe-hint');
    expect(at).toBeGreaterThan(-1);
    const block = T085_CARD_SRC.slice(at, T085_CARD_SRC.indexOf('</p>', at));
    expect(block).toContain('להחליק');
    // 🔴 תרחיש הכשל: ההוראה הישנה חוזרת ⇒ הממשק גם מראה וגם מסביר, והמשפט האפור
    // חוזר להיות הערוץ שנקרא לפני הכפתורים.
    expect(block, 'הרמז ⛔ אינו נוקב בכיוון פיזי').not.toMatch(/ימינה|שמאלה/);
    // ⛔ `block` פותח בתוך תגית ⇒ חותכים מהסוגר הראשון, אחרת המחלקות נספרות כטקסט.
    const text = block
      .slice(block.indexOf('>') + 1)
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(text.length, 'רמז, ⛔ ולא הוראה').toBeLessThanOrEqual(60);
  });

  /**
   * T-293ⓒ · `apple-design` § 8 — the destination leans DURING the drag, so the learner sees
   * where the card is going before letting go. Compositor-only (`check:motion` rule ⓐ).
   */
  it('T-293ⓒ — כפתור היעד נשען בזמן הגרירה, ו⛔ בשתי תכונות שהקומפוזיטור מריץ', () => {
    const at = GLOBALS_CSS.indexOf('[data-flashcard] [data-grade]');
    expect(at, 'חייב להתקיים כלל נשען על כפתורי הדירוג').toBeGreaterThan(-1);
    const block = GLOBALS_CSS.slice(at, at + 900);
    expect(block).toMatch(/transition:[^;]*opacity/);
    // 🔴 תרחיש הכשל: מישהו מוסיף `background-color` או `border-color` למעבר ⇒ צביעה
    // בכל פריים, בדיוק מה ש-`check:motion` ⓐ נועד לתפוס.
    expect(block).not.toMatch(/transition:[^;]*(background|border|color\s|box-shadow)/);
    for (const grade of ['good', 'again'] as const) {
      expect(GLOBALS_CSS).toContain(`[data-flashcard][data-swipe-preview='${grade}'] [data-grade='${grade}']`);
    }
  });

  it('T-259ⓑ — two badges on the card face, text + glyph + colour, ⛔ never colour alone (שכבה א׳)', () => {
    for (const grade of ['good', 'again'] as const) {
      const at = T085_CARD_SRC.indexOf(`data-swipe-badge="${grade}"`);
      expect(at, `badge ${grade}`).toBeGreaterThan(-1);
      const block = T085_CARD_SRC.slice(T085_CARD_SRC.lastIndexOf('<span', at), T085_CARD_SRC.indexOf('</span>', at));
      expect(block).toContain('aria-hidden="true"');
      expect(block).toContain(grade === 'good' ? 'text-success' : 'text-danger');
      expect(block).toContain(grade === 'good' ? '✓' : '✕');
      expect(block).toContain(grade === 'good' ? 'ידעתי' : 'לא ידעתי');
    }
    expect((T085_CARD_SRC.match(/data-swipe-badge=/g) ?? []).length).toBe(2);
  });

  it('T-259ⓑ — the preview is `resolveSwipe`, written in the pointermove path, ⛔ not a second rule', () => {
    const move = T085_CARD_SRC.indexOf('onPointerMove=');
    const cancel = T085_CARD_SRC.indexOf('onPointerCancel=');
    const block = T085_CARD_SRC.slice(move, cancel);
    expect(block).toContain('resolveSwipe(');
    expect(T085_CARD_SRC).toContain('data-swipe-preview');
    // The preview must NEVER call onGrade: it is a look-ahead, not a verdict.
    expect(block).not.toContain('onGrade(');
  });

  /**
   * 🎴 **⟦`T-325` — נוסה, נמדד, ו⛔ לא נלקח.⟧**
   *
   * 🔬 **`T-325` ניסתה להחליף אותו ב-`aspect-[315/372]` (יחס הרנדר,
   * `render_video_A.py:326`) כדי לסגור את פגם ① — «דד-ספייס»: `flex-1` מדד
   * **475px** ב-390×844 מול ~150px תוכן. ⛔ והשער סירב, ⛔ ולא הסוכן:**
   * `npm run check:mobile` נושא ערובה בשם «the card fills its viewport» והאדים
   * ב-320 · 375 · 414 (‏«cards 0=367px inside a 535px card viewport»), ועוד
   * `scrollHeight 556 מול clientHeight 535` ב-414 — כלומר `T-294` נשברה.
   * ⇒ `flex-1` הוא **ערובה נמדדת**, ⛔ לא ברירת מחדל, ופגם ① ⛔ אינו נסגר בלי
   * הכרעה על הערובה הזאת ⇒ `F-269`.
   */
  it('T-259ⓓ — the face fills the deck slot (flex-1) and the height stays CardDeck’s calc', () => {
    const faces = T085_CARD_SRC.match(/rounded-2xl border border-border-subtle bg-surface-raised[^"]*"/g) ?? [];
    expect(faces.length).toBe(2);
    for (const face of faces) {
      expect(face).toContain('flex-1');
      expect(face).toContain('text-center');
      expect(face).toContain('relative');
    }
    // ⛔ והאינווריאנט המקורי, מילה במילה: ⛔ אפס גובה בפיקסלים בקובץ הזה, וה-`calc`
    //    נשאר אצל `<CardDeck>`.
    expect(T085_CARD_SRC).not.toContain('h-[calc(');
    expect(readFileSync(join('components', 'CardDeck.tsx'), 'utf8')).toContain('h-[calc(100dvh-10rem)]');
  });

  /**
   * 🎴 **`T-325`ⓐ — ההגבהה נמדדת, ⛔ ולא מוצהרת.** נמדד לפני השורה ב-390×844:
   * `getComputedStyle(card).boxShadow === 'none'`. הכלל עצמו ב-`app/globals.css`
   * (‏`[data-card-face]` ⇒ `--glow-brand`), ⇒ מה שנמדד **כאן** הוא שהפנים נושאים את
   * הווים — ו-`data-glow` הוא מה שמכניס אותם לתקציב ב3 שנספר ב-`verify-mobile`.
   */
  it('T-325ⓐ — שני הפנים נושאים `data-card-face` ו-`data-glow`, ⛔ ואין שלישי', () => {
    expect((T085_CARD_SRC.match(/data-card-face/g) ?? []).length).toBe(2);
    expect((T085_CARD_SRC.match(/data-glow="true"/g) ?? []).length).toBe(2);
    // ⛔ פנים אחד בכל רגע ⇒ זוהר אחד. הענפים הם `? :` על אותו תנאי, ⛔ ולא שני ענפים
    //    שיכולים להיצבע יחד.
    expect(readFileSync(join('app', 'globals.css'), 'utf8')).toContain('[data-card-face] {');
  });

  it('T-259ⓔ — the reveal button is byte-for-byte the native <button> (⛔ not a div, ⛔ not a gesture)', () => {
    expect(T085_CARD_SRC).toMatch(/<button\s+type="button"\s+onClick=\{reveal\}\s+data-reveal/);
    expect(T085_CARD_SRC).not.toContain('role="button"');
  });

  it('T-259ⓘ — CardDeck no longer calls the buttons «the canonical channel»; it names T-259', () => {
    const deck = readFileSync(join('components', 'CardDeck.tsx'), 'utf8');
    expect(deck).not.toContain('canonical channel');
    expect(deck).toContain('T-259');
    const decisions = readFileSync(join('plan', '40-decisions.md'), 'utf8');
    const d150 = decisions.indexOf('### D-150');
    expect(decisions.slice(d150, d150 + 2500)).toContain('T-259ⓕ');
  });

  it('T-243 — the release is a spring from lib/core/spring, with the velocity of the finger', () => {
    const up = T085_CARD_SRC.indexOf('onPointerUp=');
    const block = T085_CARD_SRC.slice(up, T085_CARD_SRC.indexOf('{/* פני הכרטיס', up));
    expect(block).toContain('releaseVelocity(');
    expect(block).toContain('swipeExitX(');
    // The curve itself is computed in the one `release` helper every path shares (under the
    // threshold · over it · not taken · cancelled) — ⛔ never inline per handler.
    expect(block).toContain('release(');
    expect(T085_CARD_SRC).toContain('releaseCurve(');
    expect(T085_CARD_SRC).toContain('--kol-release-ms');
    expect(T085_CARD_SRC).toContain('--kol-release-ease');
    // The samples that feed the velocity come from pointermove, stamped by the EVENT.
    const move = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('onPointerMove='), T085_CARD_SRC.indexOf('onPointerCancel='));
    expect(move).toContain('pushSample(');
    expect(move).toContain('e.timeStamp');
    // ⛔ No clock in the gesture path. (`Date.now()` after mount for the DECAY level is T-100's
    // and sits outside every pointer handler — measured by the slice, ⛔ not by the whole file.)
    const gesture = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('onPointerDown='), T085_CARD_SRC.indexOf('{/* פני הכרטיס'));
    expect(gesture).not.toContain('Date.now()');
    expect(gesture).not.toContain('setTimeout(');
  });

  it('T-243 · apple-design § 3 — a pointerdown mid-flight starts from the PRESENTATION value', () => {
    const down = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('onPointerDown='), T085_CARD_SRC.indexOf('onPointerMove='));
    // The presentation value is read in ONE helper (`presentationX`: computed transform →
    // `DOMMatrixReadOnly`), and `pointerdown` hands it to the drag as `baseX`.
    expect(down).toContain('presentationX(');
    const helper = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('const presentationX'), T085_CARD_SRC.indexOf('onPointerDown='));
    expect(helper).toContain('getComputedStyle(');
    expect(helper).toContain('DOMMatrixReadOnly(');
    expect(T085_CARD_SRC).toMatch(/dragOffset\(\{[^}]*baseX/);
  });

  it('T-259 — the pose during the drag is the render’s (swipePose), ⛔ not a bare translateX', () => {
    const write = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('const writeDrag'), T085_CARD_SRC.indexOf('const resetDrag'));
    expect(write).toContain('swipeTransform(swipePose(');
    expect(write).not.toContain('`translateX(');
  });

  it('T-259 — a grade the consumer did not take brings the card back (onGrade may return a promise)', () => {
    expect(T085_CARD_SRC).toMatch(/onGrade:\s*\(grade: CardGrade\) => void \| Promise<void>/);
    const up = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('onPointerUp='));
    expect(up).toContain('Promise.resolve(onGrade(resolved))');
  });

  it('שכבה א׳ — reduced motion: releaseCurve receives the live preference, ⛔ not a constant', () => {
    expect(T085_CARD_SRC).toMatch(/releaseCurve\(\{[^}]*reducedMotion/);
  });
});

describe('T-100 · D-043 — הדעיכה על הכרטיס', () => {
  it('התווית העברית מגיעה מהמודול הטהור ⛔ ואינה מוקלדת שוב', () => {
    expect(T085_CARD_SRC).toContain('DECAY_LABEL');
    expect(T085_CARD_SRC).not.toContain('הגיע זמן לחזור');
  });

  it('שתי חזיתות הכרטיס — שתיהן נושאות את הדעיכה', () => {
    // הפנים מוטבעות פעמיים במכוון (ראה ההערה של T-085); דעיכה על אחת מהן
    // בלבד הייתה אומרת שהלומד רואה אותה לפני החשיפה ⛔ ולא אחריה, או להפך.
    expect(T085_CARD_SRC.split('data-decay').length - 1).toBeGreaterThanOrEqual(2);
  });

  it('⛔ הדעיכה ⛔ אינה נוגעת בשורה המשנית — היא שוברת 4.5:1 (עובדה ד׳)', () => {
    // ⛔ אין `data-decay` על אף אלמנט שנושא `text-ink-muted`.
    for (const line of T085_CARD_SRC.split('\n')) {
      if (line.includes('data-decay')) {
        expect(line, 'דעיכה על text-ink-muted שוברת רצפת ניגודיות').not.toContain('text-ink-muted');
      }
    }
  });

  it('⛔ אפס שדה חדש: הרכיב קורא next_review_at ו-interval_days ⛔ ותו לא', () => {
    expect(T085_CARD_SRC).toContain('decayLevel');
    for (const invented of ['decayed_at', 'decay_level', 'is_decayed', 'staleness']) {
      expect(T085_CARD_SRC, `${invented} — D-043 אוסרת שדה מתמיד`).not.toContain(invented);
    }
  });
});

/**
 * The balanced-brace region opened by `open`, `open` included — the same extractor
 * `CardDeck.test.ts` uses, for the same reason: containment is the claim, ⛔ not distance.
 */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected to find ${open} in Flashcard.tsx`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open} in Flashcard.tsx`);
}

/**
 * T-066 · D-156 · D-169 — the «משפטים» item on THIS card, as a third `input` branch.
 * ⛔ Not a new component: D-169 forbids one, and every guard below reads `Flashcard.tsx`.
 * The plan's five guards, plus one: the choice front is drawn by the SAME `data-card-front`
 * node the word decks use, so `check:mobile` measures it through the same selector.
 */
describe('T-066 — the choice card (D-156 · D-169)', () => {
  const CODE = T085_CARD_SRC;

  it('draws the options as native buttons ≥44px, each inside <EnWord>', () => {
    const region = braceRegion(CODE, "{card.input === 'choice' && !revealed ? (");
    expect(region).toContain('data-option');
    expect(region).toContain('min-h-touch');
    expect(region).toContain('<EnWord>{option}</EnWord>');
  });

  it('a tapped option grades AND reveals in one handler — D-024, no second button before the answer', () => {
    const region = braceRegion(CODE, "{card.input === 'choice' && !revealed ? (");
    expect(region).toContain('setGrade(gradeChoice(card, option))');
    expect(region).toContain('reveal()');
  });

  it('after the answer the options stay in the DOM, aria-disabled — Layer A', () => {
    const region = braceRegion(CODE, "{card.input === 'choice' && revealed ? (");
    expect(region).toContain('aria-disabled="true"');
    expect(region).toContain('data-continue');
  });

  it('the blank is a frame, ⛔ never the answer text before the tap', () => {
    expect(CODE).toContain('data-stem-blank');
    expect(CODE).toMatch(/data-stem-blank[\s\S]{0,200}ZERO_WIDTH_SPACE/);
  });

  /**
   * ⚠️ **⟦13/09 · `T-292`⟧ הטענה ⛔ לא נחלשה — החצי שנפל הוא ⛔ לא זה שהיא מודדת.**
   * הביטוי היה `revealed && card.input === 'self'`, והטענה הזאת קראה אותו **כמחרוזת
   * שלמה**. ‏`T-292` הסיר את `revealed` (ההחלקה חיה מהפיקסל הראשון, הכרעת רוי) ⇒
   * המחרוזת השתנתה, ⛔ **והכלל ⛔ לא**: כרטיס `choice` ⛔ עדיין ⛔ אינו מחליק, מפני
   * ש-`card.input === 'self'` הוא בדיוק מה שמוציא אותו.
   * ⇒ ⛔ **ולכן היא ⛔ אינה מעודכנת למחרוזת החדשה** — מחרוזת מדויקת נשברת בכל עריכה
   * שכנה ומלמדת לעדכן במקום למדוד. היא מודדת עכשיו **את הכלל**: `self` נדרש, ו-
   * `revealed` ⛔ אינו רשאי לחזור לשער הזה בלי שמישהו יקרא את השורה הזאת.
   */
  it('⛔ the choice card never activates the swipe', () => {
    const line = /const swipeActive = ([^;]+);/.exec(CODE);
    expect(line, 'swipeActive must stay one declared expression').not.toBeNull();
    const expression = line![1];
    expect(expression, "only an input === 'self' card may swipe").toContain(
      "card.input === 'self'",
    );
    expect(expression, '⛔ `revealed` ⛔ אינו שער ההחלקה יותר (T-292)').not.toContain('revealed');
  });

  it('the choice front lives in the shared `data-card-front` node, and the back carries the Hebrew', () => {
    expect(CODE).toContain('data-card-secondary');
    const front = CODE.indexOf('data-stem-blank');
    const node = CODE.lastIndexOf('data-card-front', front);
    expect(node, 'the stem must sit inside a data-card-front paragraph').toBeGreaterThan(-1);
    expect(front - node).toBeLessThan(600);
  });
});
