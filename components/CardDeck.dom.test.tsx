// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

/**
 * 📍 **`T-400` · `F-272` · `D-260` — «נשארו N מילים ברמה», המספר השני של הרנדר.**
 *
 * 🔬 **נמדד `C-0663` ואומת `C-0664`, ⛔ ולא שוער:**
 * `grep -n 'summary|unseen|levels/summary' components/StudyDeckScreen.tsx` ⇒ **0** ⇒
 * המספר ⛔ לא היה בזיכרון של המסך, ו-`render_video_A.py:391` מצייר אותו בכל פריים של
 * `kol-A-03-card.png`. ⇒ `T-394`ⓒ נשארה פתוחה **על המספר הזה בלבד**.
 *
 * ⛔ **וזה נמדד ב-DOM, ⛔ ולא במקור** (`F-224`): `CardDeck.test.ts` הוא שומר-מקור
 * בסביבת `node` ⇒ הוא יכול להעיד שהמחרוזת בקובץ, ⛔ ולא שהיא מרונדרת עם המספר הנכון,
 * ⛔ ולא שהיא **נעדרת** כשאין מספר. שני הצדדים האלה הם כל השורה.
 */
describe('📍 T-400 — שורת הכף־רגל נושאת את «נשארו N מילים ברמה»', () => {
  it('🔑 המספר מרונדר כלשונו כשהשרת החזיר אותו', () => {
    const { container } = render(
      <CardDeck deck="level" cards={deckOf(20)} onGraded={noop} unseenInLevel={314} />,
    );
    const foot = container.querySelector('[data-level-unseen]');
    expect(foot?.textContent).toBe('נשארו 314 מילים ברמה');
    expect(foot?.getAttribute('data-level-unseen')).toBe('314');
  });

  it('⛔ אין שדה ⇒ ⛔ אין שורה — ⛔ ולא «נשארו 0»', () => {
    const { container } = render(<CardDeck deck="level" cards={deckOf(20)} onGraded={noop} />);
    expect(container.querySelector('[data-level-unseen]')).toBeNull();
    expect(container.textContent).not.toContain('מילים ברמה');
  });

  it('🔑 `0` הוא תשובה ⛔ ולא היעדר — «⛔ לא נשארה מילה שלא נראתה» מוצג', () => {
    const { container } = render(
      <CardDeck deck="level" cards={deckOf(3)} onGraded={noop} unseenInLevel={0} />,
    );
    expect(container.querySelector('[data-level-unseen]')?.textContent).toBe(
      'נשארו 0 מילים ברמה',
    );
  });

  it('⛔ השורה ⛔ אינה ילד של הבמה — ילד נמוך מהבמה מאדים את `check:mobile`', () => {
    const { container } = render(
      <CardDeck deck="level" cards={deckOf(5)} onGraded={noop} unseenInLevel={314} />,
    );
    const stage = container.querySelector('[data-deck-viewport]')!;
    expect(stage.querySelector('[data-level-unseen]')).toBeNull();
    expect(container.querySelector('[data-level-unseen]')?.parentElement).toBe(
      container.querySelector('[data-card-deck]'),
    );
  });

  it('⛔ ⛔ ואינו «נותרו» שני — שני המספרים חיים יחד ואומרים שני דברים', () => {
    const { container } = render(
      <CardDeck deck="level" cards={deckOf(20)} onGraded={noop} unseenInLevel={314} />,
    );
    // הסבב: 20 כרטיסים על השולחן. הרמה: 314 מילים שטרם נפגשו. ⛔ אין ביניהם קשר.
    expect(container.querySelector('[data-remaining]')?.textContent).toBe('נותרו 20');
    expect(container.querySelector('[data-level-unseen]')?.textContent).toBe(
      'נשארו 314 מילים ברמה',
    );
  });
});

/**
 * 🔁 **`T-514` · `D-300` — «עוד 20 מילים» בסוף סבב «סינון מילים».** Measured in the DOM,
 * ⛔ not in the source: the claim is what the finish state RENDERS — exactly one primary
 * action, and a tap that reaches `onMore` once however many times the finger lands.
 */
describe('🔁 T-514 — «עוד 20 מילים» בסוף הסבב', () => {
  it('🔑 עם `onMore` — פעולה ראשית אחת בדיוק, והיא «עוד», ו«חזרה» משנית', () => {
    const onMore = vi.fn();
    const { container } = render(
      <CardDeck deck="level" cards={[]} onGraded={noop} onMore={onMore} />,
    );
    const primary = container.querySelectorAll('[data-primary-action]');
    expect(primary).toHaveLength(1);
    expect(primary[0]?.textContent).toBe('עוד 20 מילים');
    const back = screen.getByRole('link', { name: 'חזרה לכרטיסיות' });
    expect(back.hasAttribute('data-primary-action')).toBe(false);
    expect(back.getAttribute('href')).toBe('/cards');
  });

  it('הקשה קוראת ל-`onMore` פעם אחת — ⛔ והקשה שנייה ⛔ אינה שולחת בקשה שנייה (ⓓ)', () => {
    const onMore = vi.fn();
    render(<CardDeck deck="level" cards={[]} onGraded={noop} onMore={onMore} />);
    const more = screen.getByRole('button', { name: 'עוד 20 מילים' });
    fireEvent.click(more);
    fireEvent.click(more);
    expect(onMore).toHaveBeenCalledTimes(1);
    expect(more.getAttribute('aria-disabled')).toBe('true');
  });

  it('`moreLabelHe` מחליף את התווית (`T-515`)', () => {
    render(
      <CardDeck deck="level" cards={[]} onGraded={noop} onMore={vi.fn()} moreLabelHe="עוד 35 מילים" />,
    );
    expect(screen.getByRole('button', { name: 'עוד 35 מילים' })).toBeTruthy();
  });

  it('⛔ בלי `onMore` — ⛔ אין כפתור «עוד», ו«חזרה» היא הפעולה הראשית כמו היום', () => {
    const { container } = render(<CardDeck deck="level" cards={[]} onGraded={noop} />);
    expect(container.querySelector('[data-deck-more]')).toBeNull();
    const primary = container.querySelectorAll('[data-primary-action]');
    expect(primary).toHaveLength(1);
    expect(primary[0]?.textContent).toBe('חזרה לכרטיסיות');
  });
});

/**
 * 🃏 `T-516` · `kol-A-03-card` — the header says WHERE the learner is before it says how to
 * leave. **Failure scenario:** mid-round the learner cannot tell which screen or level they
 * are on, and the loudest thing on top is the exit; or the chip lands and the exit is lost,
 * leaving the round with ⛔ no way out.
 */
describe('🃏 T-516 — title row: screen name · level chip · a secondary exit', () => {
  const EXIT = { href: '/cards', labelHe: 'חזרה לכרטיסיות' } as const;

  it('🔑 renders «כרטיסיות» as the heading and the served band in the chip, with the exit kept', () => {
    const { container } = render(
      <CardDeck
        deck="level"
        cards={deckOf(5)}
        onGraded={noop}
        exit={EXIT}
        titleHe="כרטיסיות"
        levelBand="A1"
      />,
    );
    const title = container.querySelector('h1[data-deck-title]');
    expect(title?.textContent).toBe('כרטיסיות');
    const chip = container.querySelector('[data-level-chip]');
    expect(chip?.getAttribute('data-level-chip')).toBe('A1');
    // ⛔ colour is not the only channel: the band is text, spoken with «רמה» before it,
    // and it is English inside `<EnWord>` (English language tag, left-to-right).
    expect(chip?.textContent).toBe('רמה A1');
    const band = chip?.querySelector('[dir="ltr"]');
    expect(band?.getAttribute('lang')).toMatch(/^en$/);
    expect(band?.textContent).toBe('A1');
    // The chip shares the title's row — the render draws them on one line.
    expect(chip?.parentElement).toBe(title?.parentElement);
    // ⛔ The exit is demoted, ⛔ never removed: exactly one, written, a 44px class.
    const exits = container.querySelectorAll('[data-deck-exit]');
    expect(exits).toHaveLength(1);
    expect(exits[0]?.textContent).toBe('חזרה לכרטיסיות');
    expect(exits[0]?.className).toContain('min-h-touch');
    expect(exits[0]?.className).not.toContain('text-base');
    expect(exits[0]?.hasAttribute('data-primary-action')).toBe(false);
  });

  it('⛔ no band ⇒ ⛔ no chip — a level nobody served is ⛔ not drawn', () => {
    const { container } = render(
      <CardDeck deck="unknown" cards={deckOf(3)} onGraded={noop} exit={EXIT} titleHe="לא ידעתי" />,
    );
    expect(container.querySelector('h1[data-deck-title]')?.textContent).toBe('לא ידעתי');
    expect(container.querySelector('[data-level-chip]')).toBeNull();
    expect(container.querySelectorAll('[data-deck-exit]')).toHaveLength(1);
  });

  it('⛔ «מנת היום» is ⛔ not printed twice when it is already the title', () => {
    const { container } = render(
      <CardDeck deck="due" cards={deckOf(3)} onGraded={noop} exit={EXIT} titleHe="מנת היום" />,
    );
    expect((container.textContent?.match(/מנת היום/g) ?? []).length).toBe(1);
  });

  it('no title ⇒ the header reads as before — the exit alone on its row, ⛔ no heading', () => {
    const { container } = render(<CardDeck deck="due" cards={deckOf(3)} onGraded={noop} exit={EXIT} />);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelectorAll('[data-deck-exit]')).toHaveLength(1);
    expect((container.textContent?.match(/מנת היום/g) ?? []).length).toBe(1);
  });
});
