// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardDeck from '@/components/CardDeck';
import type { QueueCardInput } from '@/lib/core/deck';

beforeEach(() => {
  // ⛔ jsdom ⛔ אינו מממש `matchMedia`, ו-`<Flashcard>` קורא לו ללא תנאי ב-mount
  // (`prefers-reduced-motion`). בלי הסטאב הזה כל mount נופל לפני שנמדד דבר — אותו
  // סטאב בדיוק שב-`ArenaBattle.dom.test.tsx`.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/**
 * 📍 **`T-394` — «נותרו 5» הוא מספר בלי מכנה.**
 *
 * 🔬 **נמדד `C-0659` בדפדפן חי על `/dev/deck` (‏`next start`, 375×780), ⛔ ולא שוער:**
 * `[role="progressbar"]` ⇒ **0** · `<progress>` ⇒ **0** · כל מה שהמסך אמר על המיקום
 * בסבב הוא `<span data-remaining="5">נותרו 5</span>`. ⇒ לומד שפותח «מנת היום» ⛔ אינו
 * יודע אם הוא בתחילת הסבב או בסופו — וזו בדיוק ההחלטה שהמסך מבקש ממנו.
 *
 * ⛔ **וזה נמדד ב-DOM, ⛔ ולא במקור** (`F-224`): `CardDeck.test.ts` הוא שומר-מקור
 * בסביבת `node`, ⇒ הוא יכול להעיד ש**המחרוזת** קיימת בקובץ ו⛔ לא שהיא **מרונדרת**
 * עם המספרים הנכונים. `[role="progressbar"]` הוא בדיוק הסוג של טענה שגְרֶפּ ⛔ אינו סוגר.
 */
const card = (id: string, headword: string): QueueCardInput => ({
  word_id: id,
  direction: 'recognition',
  is_first_encounter: true,
  sense: {
    headword,
    translation_he: 'מילה',
    examples: { supportive: `The ${headword} is a fixture.`, neutral: '' },
    needs_human_review: false,
  },
  review: { next_review_at: null, interval_days: 0 },
});

const deckOf = (n: number) =>
  Array.from({ length: n }, (_, i) => card(`fixture-${i}`, `word${i}`));

const noop = () => Promise.resolve();

describe('📍 T-394 — המיקום בסבב הוא מספר עם מכנה, ⛔ ולא מספר לבד', () => {
  it('🔑 `[role="progressbar"]` = 1 (היה 0), עם valuenow/valuemax אמיתיים', () => {
    render(<CardDeck deck="due" cards={deckOf(20)} onGraded={noop} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(1);
    const bar = bars[0]!;
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('20');
  });

  it('🔑 «מתוך» נמדד ב-DOM, והמכנה הוא אורך החפיסה — ⛔ אפס מספר חדש', () => {
    const { container } = render(<CardDeck deck="due" cards={deckOf(20)} onGraded={noop} />);
    const position = container.querySelector('[data-deck-position]');
    expect(position?.textContent).toBe('1 מתוך 20');
    // ⛔ «נותרו» ⛔ לא הוחלף — שתי המחרוזות אומרות שני דברים שונים.
    expect(container.querySelector('[data-remaining]')?.textContent).toBe('נותרו 20');
  });

  it('♿ הצבע ⛔ אינו הערוץ היחיד — `aria-valuetext` נושא את אותה מחרוזת שהעין קוראת', () => {
    const { container } = render(<CardDeck deck="due" cards={deckOf(7)} onGraded={noop} />);
    const bar = screen.getByRole('progressbar');
    const seen = container.querySelector('[data-deck-position]')?.textContent;
    expect(bar.getAttribute('aria-valuetext')).toBe(seen);
  });

  it('⛔ חפיסה של כרטיס אחד ⛔ אינה «1 מתוך 0», ו⛔ אינה מחלקת באפס', () => {
    const { container } = render(<CardDeck deck="due" cards={deckOf(1)} onGraded={noop} />);
    expect(container.querySelector('[data-deck-position]')?.textContent).toBe('1 מתוך 1');
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('⛔ ⛔ לא ניקוד, ⛔ לא רצף ו⛔ לא XP — זהו מיקום, ⛔ ולא תגמול (`D-050`)', () => {
    const { container } = render(<CardDeck deck="due" cards={deckOf(20)} onGraded={noop} />);
    const header = container.querySelector('header')!;
    for (const invented of ['רצף', 'ניקוד', 'XP', '%', 'כל הכבוד']) {
      expect(header.textContent, `"${invented}" is a claim no decision makes`).not.toContain(
        invented,
      );
    }
  });
});
