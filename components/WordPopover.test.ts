import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  POPOVER_GAP,
  POPOVER_GUTTER,
  POPOVER_MAX_WIDTH,
  popoverPlacement,
  popoverWidthFor,
  stolenWordCount,
} from './WordPopover';

/**
 * T-290 · `D-209` · closes `F-167`.
 *
 * ⛔ The failure this file exists against: the component is *named* `WordPopover`,
 * so every earlier test, review and citation read "popover ✓" while the markup was
 * `mt-2 w-full` — a flow block under the paragraph. **The name replaced the
 * behaviour.** ⇒ these tests measure geometry and markup, never the name.
 *
 * ✔ proves: the placement maths centres on the tapped word, clamps at both screen
 *   edges, and flips above the word when the space below cannot hold the box.
 * ✔ proves: the rendered element is taken out of flow (`position: 'absolute'`), so
 *   opening it cannot push a single paragraph — the whole point of F-167.
 * ✘ cannot prove: the pixel result in a real browser. Vitest's environment is
 *   `node` and lays nothing out. That measurement is the live walk (`MF-2`, at
 *   320 · 375 · 414), and it is recorded in the delivery line of the row.
 */

const CARD = { containerWidth: 335, containerHeight: 400, popoverHeight: 180 } as const;

describe('popoverWidthFor', () => {
  it('never exceeds the max width on a roomy card', () => {
    expect(popoverWidthFor(600)).toBe(POPOVER_MAX_WIDTH);
  });

  it('leaves a gutter on both sides of a narrow card — 320px is the narrowest MF-2 width', () => {
    // 320px viewport ⇒ the body card is narrower still; it must never be wider than its parent.
    expect(popoverWidthFor(280)).toBe(280 - POPOVER_GUTTER * 2);
  });

  it('never returns a negative width', () => {
    expect(popoverWidthFor(4)).toBe(0);
  });
});

describe('popoverPlacement — the box is anchored to the word, not to the paragraph', () => {
  it('centres on the tapped word when there is room on both sides', () => {
    const width = popoverWidthFor(CARD.containerWidth);
    const { left, placement } = popoverPlacement(
      { top: 40, bottom: 70, centerX: 167 },
      CARD,
    );
    expect(left).toBe(Math.round(167 - width / 2));
    expect(placement).toBe('below');
  });

  it('clamps at the start edge instead of spilling off-screen', () => {
    const { left } = popoverPlacement({ top: 40, bottom: 70, centerX: 10 }, CARD);
    expect(left).toBe(POPOVER_GUTTER);
  });

  it('clamps at the end edge instead of spilling off-screen', () => {
    const width = popoverWidthFor(CARD.containerWidth);
    const { left } = popoverPlacement({ top: 40, bottom: 70, centerX: 330 }, CARD);
    expect(left).toBe(CARD.containerWidth - width - POPOVER_GUTTER);
  });

  it('sits one gap under the word — ⛔ not under the whole paragraph', () => {
    const { top } = popoverPlacement({ top: 40, bottom: 70, centerX: 167 }, CARD);
    expect(top).toBe(70 + POPOVER_GAP);
    // the paragraph is 400 tall; a flow block would have started at 400.
    expect(top).toBeLessThan(CARD.containerHeight);
  });

  it('flips above the word when the space below cannot hold it', () => {
    const { top, placement } = popoverPlacement(
      { top: 300, bottom: 330, centerX: 167 },
      CARD,
    );
    expect(placement).toBe('above');
    expect(top).toBe(300 - POPOVER_GAP - CARD.popoverHeight);
  });

  it('stays below when neither side fits — ⛔ never a negative top', () => {
    const tight = { containerWidth: 335, containerHeight: 120, popoverHeight: 180 } as const;
    const { top, placement } = popoverPlacement({ top: 10, bottom: 40, centerX: 167 }, tight);
    expect(placement).toBe('below');
    expect(top).toBeGreaterThanOrEqual(0);
  });
});

describe('the markup is out of flow — the guard the name defeated', () => {
  const source = readFileSync(new URL('./WordPopover.tsx', import.meta.url), 'utf8');

  it("positions the box absolutely, so opening it moves no text", () => {
    expect(source).toContain("position: 'absolute'");
  });

  it('⛔ no longer carries the full-width flow-block classes', () => {
    expect(source).not.toContain('mt-2 w-full rounded-2xl');
  });

  it('renders nothing at all without an anchor — ⛔ no unanchored fallback block', () => {
    expect(source).toContain('if (anchor === null) return null;');
  });
});

/**
 * T-319 · WCAG 2.2 AA «Focus Not Obscured (Minimum)» · המשך של T-290.
 *
 * ⛔ **הנסיגה שהבדיקות של T-290 ⛔ לא יכלו לראות:** הן הוכיחו ש-`position: absolute`
 * ⛔ אינו דוחף טקסט — וזה נכון. מה שהן ⛔ לא מדדו הוא שאותו `absolute` **מכסה**:
 * מדידה חיה ב-C-0561 (Chromium 375×780, `/dev/story`) החזירה `stolen = 3` מתוך 7.
 *
 * ✔ מוכיח: החשבון שמגדיר «נגנבה» — מרכז המילה בתוך מלבן החלונית — ושכיבוי
 *   האינטראקטיביות (`inert`) מאפס אותו **בהגדרה**, ⛔ ולא במקרה.
 * ✔ מוכיח: הפסקה אכן מקבלת `inert` בדיוק כשהחלונית פתוחה, ש`Escape` והקשה בחוץ
 *   סוגרים, ושהסגירה מחזירה מיקוד למילה שהוקשה — ⛔ ולא לראש הדף.
 * ✘ ⛔ אינו מוכיח: הפיקסלים בדפדפן חי. `vitest` כאן הוא `node` ו⛔ אינו פורס דבר;
 *   המדידה הזאת היא ההליכה החיה, והיא רשומה בשורת המסירה של השורה.
 */
describe('T-319 · stolenWordCount — «נגנבה» הוא חשבון, ⛔ ולא עין', () => {
  const POPOVER = { top: 400, bottom: 616, left: 24, right: 312 } as const;
  const wordAt = (top: number, left: number) => ({
    top,
    bottom: top + 24,
    left,
    right: left + 40,
  });

  it('סופרת מילה שמרכזה יושב בתוך מלבן החלונית', () => {
    expect(stolenWordCount(POPOVER, [wordAt(480, 100)], true)).toBe(1);
  });

  it('⛔ אינה סופרת מילה מעל החלונית ו⛔ לא מילה מתחתיה', () => {
    expect(stolenWordCount(POPOVER, [wordAt(300, 100), wordAt(700, 100)], true)).toBe(0);
  });

  it('⛔ אינה סופרת מילה שנמצאת בטווח האנכי אך **לצד** החלונית', () => {
    expect(stolenWordCount(POPOVER, [wordAt(480, 330)], true)).toBe(0);
  });

  it('משחזרת את המדידה החיה: 3 מתוך 7 נגנבו כשהפסקה עדיין אינטראקטיבית', () => {
    const words = [
      wordAt(300, 100),
      wordAt(340, 60),
      wordAt(430, 100),
      wordAt(470, 140),
      wordAt(510, 80),
      wordAt(660, 100),
      wordAt(700, 140),
    ];
    expect(stolenWordCount(POPOVER, words, true)).toBe(3);
  });

  it('🔴 ⛔ ומאפסת אותה כשהפסקה `inert` — זה מה שסוגר את הקריטריון', () => {
    const words = [wordAt(430, 100), wordAt(470, 140), wordAt(510, 80)];
    expect(stolenWordCount(POPOVER, words, true)).toBe(3);
    expect(stolenWordCount(POPOVER, words, false)).toBe(0);
  });
});

describe('T-319 · ההתנהגות, ⛔ ולא הכוונה — נמדדת על המקור', () => {
  const popover = readFileSync(new URL('./WordPopover.tsx', import.meta.url), 'utf8');
  const screen = readFileSync(new URL('./StoryScreen.tsx', import.meta.url), 'utf8');

  /**
   * ⚠️ **⟦עודכן C-0634 · `T-240`⟧ «כשהחלונית פתוחה» הפך ל«כשהחלונית פתוחה **על
   * הפסקה**», ⛔ וזו ⛔ אינה הרפיה.** מאז `T-240` החלונית יכולה להיפתח גם על הכותרת,
   * ואז היא ⛔ אינה מכסה ולו מילה אחת בפסקה ⇒ `inert` על הפסקה היה **גונב** ללומד
   * את גוף הסיפור בלי סיבה. ⛔ הקריטריון של `T-319` ⓒ — «מילה מתחת לחלונית ⛔ אינה
   * מציגה את עצמה כיעד» — נשמר על **שני** המשטחים, כל אחד מול החלונית שלו.
   */
  it('ⓒ פסקת הקריאה `inert` בדיוק כשהחלונית פתוחה עליה', () => {
    expect(screen).toContain("inert={openLemma !== null && openSurface === 'body'}");
    // ⛔ והכותרת נושאת את אותו תנאי בדיוק, מול המשטח שלה.
    expect(screen).toContain("openLemma !== null && openSurface === 'title' ? { inert: true }");
  });

  it('ⓐ `Escape` סוגר', () => {
    expect(screen).toContain("if (e.key === 'Escape') closePopover();");
  });

  it('ⓐ והסגירה מחזירה את המיקוד למילה שהוקשה — ⛔ ולא לראש הדף', () => {
    expect(screen).toContain('if (el !== null && el.isConnected) el.focus();');
    expect(screen).toContain('tappedWordRef.current = event.currentTarget;');
    // 🔴 ⛔ ו⛔ לא בתוך `closePopover`: שם הפסקה עדיין `inert`, ו-`focus()` נבלע.
    //    נמדד חי — `focusIsTappedWord: false` — ⛔ ולא הוסק.
    expect(screen).toContain('useLayoutEffect(() => {\n    if (openLemma !== null) return;');
  });

  it('ⓑ הקשה מחוץ לחלונית סוגרת אותה', () => {
    expect(screen).toContain("target.closest('[data-word-popover]')");
  });

  it('ⓑ ו⛔ אינה נבלעת — ⛔ אין `preventDefault` ו⛔ אין מאזין `capture`', () => {
    expect(screen).not.toContain("addEventListener('pointerdown', onPointerDown, true)");
    const handler = screen.slice(
      screen.indexOf('const onPointerDown'),
      screen.indexOf("document.addEventListener('keydown'"),
    );
    expect(handler).not.toContain('preventDefault');
    expect(handler).not.toContain('stopPropagation');
  });

  it('⛔ ⛔ אין מלכודת מיקוד — זו חלונית, ⛔ לא מודאל', () => {
    expect(popover).not.toContain('aria-modal');
    expect(screen).not.toContain('focus-trap');
  });

  it('ⓓ ⛔ אף פקד בחלונית ⛔ אינו מכבה את טבעת המיקוד הגלובלית', () => {
    expect(popover).not.toContain('outline-none');
    expect(popover).not.toContain('focus:outline-0');
  });

  it('קורא-מסך מקבל מה להכריז כשהחלונית נפתחת', () => {
    expect(popover).toContain('role="dialog"');
  });

  it('⛔ והעיגון ⛔ לא נסוג — `D-209`/`F-167` עומדים', () => {
    expect(popover).toContain("position: 'absolute'");
  });
});
