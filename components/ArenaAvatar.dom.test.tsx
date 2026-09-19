// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ArenaAvatar, { ITEM_LABELS_HE } from '@/components/ArenaAvatar';
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

function avatar(character: (typeof ARENA_CHARACTERS)[number], items: readonly string[]) {
  const { container } = render(<ArenaAvatar role="hero" items={items} character={character} />);
  const svg = container.querySelector('svg');
  expect(svg).not.toBeNull();
  return svg as SVGSVGElement;
}

const layer = (svg: SVGSVGElement, name: string) => svg.querySelector(`[data-arena-layer="${name}"]`);

describe('C-0727 — הציוד על שש הדמויות', () => {
  it('כל שש הדמויות מציירות עם כל חמשת הפריטים — ⛔ בלי זריקה ו⛔ בלי שכבה ריקה', () => {
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
    for (const c of ARENA_CHARACTERS) {
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
    for (const c of ARENA_CHARACTERS.filter((x) => x !== 'shade')) {
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
});
