import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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
  return text.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
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
   * F-103 · D-042 · T-099 — הבדיקה הקודמת כאן אסרה מחווה בנימוק «D-032 בתוקף».
   * D-042 הפכה את D-032 במפורש, ולכן הנימוק חדל להתקיים. ⛔ הבדיקה ⛔ לא הוחלשה:
   * מה שהיא מודדת עכשיו **חד יותר** — לא «אין מחווה» אלא «המחווה היא קיצור, ⛔ לא
   * ערוץ, ⛔ לא גרירה, ⛔ ולא מסלול שני».
   */
  it('D-042ⓒ — ⛔ ⛔ גרירה: אין מטפל תנועה בכל הקובץ', () => {
    for (const forbidden of ['onPointerMove', 'onTouchMove', 'onTouchStart', 'onDrag']) {
      expect(T085_CARD_SRC, `${forbidden} ⇒ הכרטיס נגרר עם האצבע — D-042ⓒ אוסרת`).not.toContain(
        forbidden,
      );
    }
  });

  it('D-042 — שני הכפתורים נשארים הערוץ הקנוני', () => {
    expect(T085_CARD_SRC).toContain('data-grade="again"');
    expect(T085_CARD_SRC).toContain('data-grade="good"');
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
});
