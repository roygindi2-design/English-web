// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import ArenaAvatar, { FACING_HE, ITEM_LABELS_HE } from '@/components/ArenaAvatar';
import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';
import { ARENA_CHARACTERS } from '@/lib/core/arenaCharacter';

/**
 * 🎒 **⟦19/09 · `C-0727`⟧ שתי התנגשויות שנמדדו **על המסך**, ⛔ ולא נחשדו בקוד.**
 *
 * ‏`ArenaAvatar.test.ts` קורא את **המקור** — והוא ⛔ אינו יכול לראות מה קורה כששתי
 * שכבות נופלות על אותה משבצת. שתי אלה נראו רק כשהדמויות צוירו לבושות:
 * ① **קסדה על הקוסם** ציירה כיפת פלדה **מעל** הכובע המחודד — שני כיסויי ראש.
 * ② **מגפיים על ה`צל`** צוירו **בתוך הזנב** של דמות ש⛔ אין לה רגליים.
 * ⇒ הבדיקה כאן **מרנדרת** את שש הדמויות לבושות בכל חמשת הפריטים, כי זו הצורה
 * היחידה שבה «שתי שכבות על אותה משבצת» היא טענה שאפשר למדוד.
 */
afterEach(cleanup);

const ALL = [...ARCADE_ITEMS];

/**
 * 🥋 **⟦21/09 · `C-0755` · `T-444`⟧ מי **לובש** ציוד — רשימה מפורשת, ⛔ ולא נגזרת.**
 *
 * ⚠️ **הכרעת רוי על הנווד, מילה במילה:** «**נסתרים עליה בלבד**». ⇒ הנווד מצייר
 * ⛔ **אפס** פריט, ושש האחרות ⛔ לא נגעו. ⛔ **וזו ⛔ אינה החרגה נוחה מבדיקה
 * שהאדימה:** הבדיקה שמתחתיה היא זו שמוכיחה שהציוד ⛔ אינו מצויר עליה, ⇒ הטענה
 * **התחלקה לשתיים**, ⛔ ולא נחלשה.
 */
const DRESSED = ARENA_CHARACTERS.filter((c) => c !== 'wanderer');

function avatar(character: (typeof ARENA_CHARACTERS)[number], items: readonly string[]) {
  const { container } = render(<ArenaAvatar role="hero" items={items} character={character} />);
  const svg = container.querySelector('svg');
  expect(svg).not.toBeNull();
  return svg as SVGSVGElement;
}

const layer = (svg: SVGSVGElement, name: string) => svg.querySelector(`[data-arena-layer="${name}"]`);

describe('C-0727 — הציוד על הדמויות', () => {
  it('כל הדמויות מציירות עם כל חמשת הפריטים — ⛔ בלי זריקה ו⛔ בלי שכבה ריקה', () => {
    for (const c of ARENA_CHARACTERS) {
      const svg = avatar(c, ALL);
      // ⛔ שכבה ריקה ⛔ אינה מצוירת — כל `[data-arena-layer]` נושא צורה.
      for (const g of svg.querySelectorAll('[data-arena-layer]')) {
        expect(g.querySelector('path, rect, circle, ellipse'), `${c} · ${g.getAttribute('data-arena-layer')}`)
          .not.toBeNull();
      }
    }
  });

  it('🎩 קסדה **מחליפה** את כיסוי הראש של הדמות — ⛔ ואינה נערמת עליו', () => {
    for (const c of DRESSED) {
      const bare = avatar(c, []);
      const ownHeadgear = layer(bare, 'headgear')?.querySelector('[data-arena-character]') ?? null;
      cleanup();
      const helmed = avatar(c, ['helmet']);
      const head = layer(helmed, 'headgear');
      expect(head, `${c} — קסדה חייבת לצייר`).not.toBeNull();
      expect(head?.querySelector('[data-arena-equipment]'), `${c} — הקסדה עצמה`).not.toBeNull();
      // ⛔ **כשלדמות יש כיסוי ראש משלה — הוא ⛔ אינו מצויר מתחת לקסדה.**
      if (ownHeadgear !== null) {
        expect(head?.querySelector('[data-arena-character]'), `${c} — כובע מתחת לקסדה`).toBeNull();
      }
      cleanup();
    }
  });

  it('🎩 ⛔ והכלל ⛔ אינו «ציוד מנצח שכבה» — הפנס והדגל ⛔ אינם מוחקים זרוע', () => {
    // 🔬 זו הטעות שהכלל הרחב היה עושה: `offHand`/`mainHand` נושאים את **הזרוע**
    //    של הקוסם ואת הגולה שלו, ⛔ ולא «מה שחובשים».
    const svg = avatar('wizard', ['lantern', 'banner']);
    expect(layer(svg, 'offHand')?.querySelector('[data-arena-character]')).not.toBeNull();
    expect(layer(svg, 'mainHand')?.querySelector('[data-arena-character]')).not.toBeNull();
  });

  it('👻 ל`צל` ⛔ אין רגליים ⇒ ⛔ אין לו מגפיים, ולשאר **יש**', () => {
    expect(layer(avatar('shade', ['boots']), 'boots')).toBeNull();
    cleanup();
    for (const c of DRESSED.filter((x) => x !== 'shade')) {
      expect(layer(avatar(c, ['boots']), 'boots'), `${c}`).not.toBeNull();
      cleanup();
    }
  });

  it('✨ רסיסי ה`צל` שורדים קסדה — הם ⛔ אינם כיסוי ראש', () => {
    const svg = avatar('shade', ['helmet']);
    expect(layer(svg, 'chest')?.querySelector('[data-arena-character]')).not.toBeNull();
  });

  it('⛔ הציוד ⛔ אינו מצויר עוד כקו — כל פריט הוא **עצם מלא**', () => {
    // 🔬 הפגם: הקו נפתר בזירה ל-`--arena-night`, רקע הבמה ⇒ `1.00:1`.
    const svg = avatar('warrior', ALL);
    const eq = [...svg.querySelectorAll('[data-arena-equipment]')];
    expect(eq.length).toBeGreaterThan(0);
    for (const g of eq) {
      expect(g.getAttribute('stroke'), 'ציוד ⛔ אינו נצבע בקו').toBeNull();
      expect(g.getAttribute('fill')).not.toBe('none');
    }
  });

  it('השם הנגיש מונה את מה שלבוש — ⛔ ולא רק את הדמות', () => {
    const svg = avatar('warrior', ALL);
    const label = svg.getAttribute('aria-label') ?? '';
    for (const item of ALL) expect(label).toContain(ITEM_LABELS_HE[item]);
  });

  /**
   * 🥋 **⟦21/09 · `C-0755` · `T-444`⟧ החצי השני של הטענה שהתחלקה.**
   *
   * 🔴 **⛔ שתי טענות ו⛔ לא אחת, וזה בכוונה:** ⓐ שעל הנווד ⛔ אין ציוד, ⓑ שעל שש
   * האחרות **יש** — כי בדיקה שרק מחריגה דמות ⛔ אינה מודדת דבר, והיא הייתה
   * עוברת גם אילו הציוד היה נמחק מכולן.
   */
  it('🥋 על הנווד הציוד **נסתר** — ⛔ ועל שש האחרות הוא **מצויר**', () => {
    const bare = avatar('wanderer', ALL);
    expect(bare.querySelectorAll('[data-arena-equipment]').length).toBe(0);
    // ⛔ **ו⛔ לא «דמות ריקה»:** החתימה שלה מצוירת במלואה.
    expect(bare.querySelectorAll('[data-arena-character="wanderer"]').length).toBeGreaterThan(0);
    cleanup();
    for (const c of DRESSED) {
      expect(avatar(c, ALL).querySelectorAll('[data-arena-equipment]').length, `${c}`)
        .toBeGreaterThan(0);
      cleanup();
    }
  });

  /**
   * 🔴 **והשם הנגיש הולך אחרי הציור, ⛔ ולא אחרי הקלט.** לומד שקורא מסך היה
   * שומע «נווד, קסדה, גלימה, פנס, מגפיים, דגל» מול דמות ש⛔ אין עליה דבר.
   */
  /**
   * 🦵 **⟦21/09 · `C-0755` · `T-444`⟧ הרגל מפוצלת בברך **כבר עכשיו**, ⛔ ולא בסבב הבא.**
   *
   * 🔴 **וזו ⛔ אינה בדיקה של ציור — זו בדיקה של **מבנה**:** `T-444` ג׳ עוטפת את
   * השוק ואת הכף ב-`<g>` מקונן כדי שהברך תתקפל, ⇒ אם הרגל תצויר אי-פעם כצורה
   * **אחת**, הסבב הבא ⛔ לא יוכל לעטוף דבר ואיש ⛔ לא יראה זאת עד שהאנימציה
   * תישבר. ⛔ **ו⛔ אין כאן פיצול שכבה**: `legs` נשארה שכבה אחת ב-`LAYER_ORDER`.
   */
  it('🦵 רגל הנווד היא **ירך · שוק · כף** לכל צד — ⛔ ולא צורה אחת', () => {
    const legs = layer(avatar('wanderer', []), 'legs');
    expect(legs).not.toBeNull();
    expect(legs?.querySelectorAll('path').length, 'שישה נתיבים — שלושה לכל צד').toBe(6);
    // ⛔ **ו⛔ אין מפרק עדיין** — `T-444` ב׳ היא **מבנה סטטי** בלבד.
    expect(legs?.querySelector('[data-arena-joint]')).toBeNull();
  });

  it('🥋 השם הנגיש של הנווד ⛔ אינו מונה פריט שאיש ⛔ אינו רואה', () => {
    const label = avatar('wanderer', ALL).getAttribute('aria-label') ?? '';
    for (const item of ALL) expect(label, item).not.toContain(ITEM_LABELS_HE[item]);
    expect(label).toContain('נווד');
  });
});

/**
 * 🎭 **⟦19/09 · `C-0731` · `T-432` · `D-269` ② · `38 § 1א`⟧ הדמות מגבה.**
 *
 * 🔬 **מה שזה סוגר, ⛔ ולא רק מה שרוי ביקש:** `38 § 5` סימן את «האביר **מגבו**»
 * שברנדר כ«מוחלף», בעוד **ארבעת** רנדרי הקרב מציירים גיבור מגבו ⇒ המסמך והרנדר
 * סתרו זה את זה מאז 23/08. `38 § 1א` סוגר את הסתירה: **חזיתי כברירת מחדל,
 * בקרב בלבד מגב** — הנימוק המקורי נשמר במלואו.
 *
 * 🔴 **ו⛔ זו ⛔ אינה דמות שנייה — וזו הטענה הכבדה כאן.** בדיקה שסופרת «יש גב»
 * ⛔ אינה מודדת דבר; מה שמכריע הוא שה**שלד** נשאר: אותן שכבות, אותם עוגנים,
 * ⛔ ואף שכבה חדשה ב-`LAYER_ORDER`.
 */
describe('C-0731 · T-432 — הדמות מגבה', () => {
  const facing = (c: (typeof ARENA_CHARACTERS)[number] | null, f: 'front' | 'back') => {
    const { container } = render(
      <ArenaAvatar role="hero" items={[]} character={c} facing={f} />,
    );
    return container.querySelector('svg') as SVGSVGElement;
  };
  const eyes = (svg: SVGSVGElement) => svg.querySelectorAll('[data-arena-eye]').length;
  const layers = (svg: SVGSVGElement) =>
    [...svg.querySelectorAll('[data-arena-layer]')].map((g) => g.getAttribute('data-arena-layer'));

  it('🔴 מגב ⇒ ⛔ אפס עיניים · מלפנים ⇒ יש — **בכל שש הדמויות ובשלד**', () => {
    for (const c of [null, ...ARENA_CHARACTERS]) {
      expect(eyes(facing(c, 'front')), `${String(c)} — מלפנים`).toBeGreaterThan(0);
      cleanup();
      expect(eyes(facing(c, 'back')), `${String(c)} — מגב`).toBe(0);
      cleanup();
    }
  });

  it('⛔ ברירת המחדל היא **חזיתית** — `38 § 1` ⛔ לא נמחק, הוא **צומצם**', () => {
    const { container } = render(<ArenaAvatar role="hero" items={[]} />);
    expect(container.querySelectorAll('[data-arena-eye]').length).toBeGreaterThan(0);
  });

  it('🔴 ⛔ ⛔ לא דמות שנייה — השלד **נשאר**, ו⛔ אף שכבה ⛔ לא נוספה', () => {
    // 🔬 זו הטענה שמונעת «גב» שהוא למעשה ציור נפרד: השכבות מגב הן **תת-קבוצה**
    //    של השכבות מלפנים, ⛔ ואין בהן ולו אחת שהחזית ⛔ אינה מכירה.
    for (const c of [null, ...ARENA_CHARACTERS]) {
      const front = new Set(layers(facing(c, 'front')));
      cleanup();
      const backs = layers(facing(c, 'back'));
      cleanup();
      for (const l of backs) expect(front.has(l), `${String(c)} · ${String(l)} — שכבה שאין בחזית`).toBe(true);
      // ⛔ והגב ⛔ אינו ריק: דמות שמאבדת את כל שכבותיה היא **באג**, ⛔ לא גב.
      expect(backs.length, `${String(c)} — הגב ⛔ אינו ריק`).toBeGreaterThan(2);
    }
  });

  it('סמל החזה הוא **חזית** ⇒ ⛔ אינו מצויר מאחור, ו⛔ הגוף **כן**', () => {
    const backSkeleton = facing(null, 'back');
    expect(backSkeleton.querySelector('[data-arena-layer="chest"]')).toBeNull();
    expect(backSkeleton.querySelector('[data-arena-layer="body"]')).not.toBeNull();
    cleanup();
    expect(facing(null, 'front').querySelector('[data-arena-layer="chest"]')).not.toBeNull();
  });

  it('🪞 משבצות היד משתקפות — ⛔ והשלד ⛔ אינו', () => {
    // 🔬 הפגם ש-`scaleX(-1)` על הדמות כולה היה עושה: הוא היה הופך גם את תפר הגב.
    const svg = facing(null, 'back');
    const mirrored = [...svg.querySelectorAll('[data-arena-layer]')]
      .filter((g) => g.getAttribute('transform') !== null)
      .map((g) => g.getAttribute('data-arena-layer'));
    expect(mirrored.every((l) => l === 'mainHand' || l === 'offHand'), mirrored.join(',')).toBe(true);
    expect(svg.getAttribute('transform'), 'הדמות כולה ⛔ אינה משתקפת').toBeNull();
  });

  it('🔴 הכיוון נאמר ב**מילים** — חוקה § 1, ⛔ ולא צורה בלבד', () => {
    // ⛔ לומד שקורא מסך ⛔ אינו רואה שהדמות הסתובבה.
    expect(facing('warrior', 'back').getAttribute('aria-label')).toContain(FACING_HE.back);
    cleanup();
    expect(facing('warrior', 'front').getAttribute('aria-label')).not.toContain(FACING_HE.back);
  });

  it('⛔ הגב ⛔ אינו «ראש בלי עיניים» — יש שיער עורף ויש תפר', () => {
    // 🔬 ראש בלי עיניים נקרא **תקלה**; ראש מכוסה שיער מעל עורף נקרא **גב**.
    const svg = facing(null, 'back');
    const head = svg.querySelector('[data-arena-layer="head"]');
    expect(head?.querySelectorAll('ellipse[data-arena-part="hair"]').length, 'מסת שיער העורף')
      .toBeGreaterThan(0);
    const body = svg.querySelector('[data-arena-layer="body"]');
    cleanup();
    const frontBody = facing(null, 'front').querySelector('[data-arena-layer="body"]');
    expect(
      (body?.querySelectorAll('rect').length ?? 0),
      'תפר עמוד השדרה — צורה שהחזית ⛔ אינה מציירת',
    ).toBeGreaterThan(frontBody?.querySelectorAll('rect').length ?? 0);
  });

  it('הקרב מצייר מגב — ⛔ ושלושת מסכי הציוד ⛔ לא', () => {
    const stage = readFileSync('components/ArenaStage.tsx', 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    expect(stage).toMatch(/role="hero"[^/]*facing="back"/);
    // ⛔ **היריב נשאר חזיתי** — הוא זה שהלומד מסתכל עליו.
    expect(stage).not.toMatch(/role="enemy"[^/]*facing="back"/);
    for (const screen of [
      'components/ArenaHome.tsx',
      'components/ArenaCharacterChoice.tsx',
      'components/ArenaSummary.tsx',
    ]) {
      expect(readFileSync(screen, 'utf8'), `${screen} — הציוד נבחן כאן`).not.toContain('facing="back"');
    }
  });
});
