// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ArenaShell from '@/components/ArenaShell';

/**
 * ⟦20/09 · `C-0743` · `F-287`⟧ — **הציוד שהלומד זכה בו נלבש בקרב, ⛔ ולא נזרק במעטפת.**
 *
 * 🔬 **למה ⛔ לא סריקת מקור, ובמפורש.** ‏`components/ArenaShell.test.ts` רץ ב-environment
 * `node` ומודד שמחרוזות **כתובות בקובץ**. טענה כזאת הייתה נשארת ירוקה גם אילו
 * `setItems` נקרא ו-`items` ⛔ לא הועבר, וגם אילו `ArenaAvatar` ⛔ לא צייר דבר מהמלאי.
 * ⇒ הקובץ הזה מרכיב את **המעטפת האמיתית**, עם `fetch` מזויף בדפוס
 * `components/ArenaBattle.dom.test.tsx`, ומודד את ה-DOM בקצה השרשרת.
 *
 * 🔴 **וזו בדיוק המדידה שפתחה את הממצא ב-`C-0712`, הפוכה:** אז נספר
 * `[data-arena-part]` בקרב חי והוחזר **שיער בלבד** ⇒ `arena-sway` על הגלימה ותנועת
 * ההמשך על הנשק — שתי אנימציות שנבנו ב-`T-216`/`T-366` — ⛔ מעולם ⛔ לא היה להן על מה
 * לחול. כאן נמדד הכיוון ההפוך: **גלימה על הגיבור**.
 *
 * ⛔ **ושתי הטענות נמדדות יחד, כי אחת בלעדי השנייה ⛔ אינה ההכרעה:** הגיבור לובש את
 * המצטבר **והיריב נשאר עירום** (`C-0742`, PM) — הציוד הוא **פרס** (`37 § 9`), וליריב
 * ⛔ אין מלאי.
 */

const HOME = {
  ok: true,
  arcadeLevel: 7,
  wins: 3,
  /* ⛔ `cape` ⛔ ולא `helmet`: הקסדה יושבת ב-`headgear`, והגלימה היא הפריט שנושא
     `data-arena-part="cape"` — הצומת שהאנימציה של א4 מחפשת. */
  unlockedItems: ['cape'],
  character: 'warrior',
  lastRound: null,
};

const question = (n: number) => ({
  wordId: `w${n}`,
  headword: `Lorem${n}`,
  answer: `אפשרות ${n}`,
  options: [
    { he: `אפשרות ${n}`, kind: 'met' as const },
    { he: `מסיח ${n}א`, kind: 'met' as const },
    { he: `מסיח ${n}ב`, kind: 'unseen' as const },
    { he: `מסיח ${n}ג`, kind: 'met' as const },
  ],
  kind: 'base' as const,
});

const ROUND = { ok: true, band: 'A1', round: { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) } };

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

beforeEach(() => {
  // אותם שני חורים של jsdom שמתועדים ב-`ArenaBattle.dom.test.tsx`: `matchMedia`
  // ו-Pointer Capture נקראים ללא תנאי ב-mount, ובלעדיהם כל הרכבה נופלת לפני שנמדד דבר.
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
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
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string) => Promise.resolve(json(String(path).includes('/home') ? HOME : ROUND))),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('`F-287` — הפרס שהלומד הרוויח נראה עליו בקרב', () => {
  it('הגיבור לובש את הגלימה שהמאגר החזיר, ⛔ ולא נכנס עירום', async () => {
    render(<ArenaShell />);
    /* ⛔ ⛔ אין כאן מסך בחירה: ללומד הזה **כבר יש דמות** ⇒ `התחל קרב` עובר ישר לקרב.
       ⇒ מה שנמדד הוא בדיוק המסלול שבו `onStart(s)` מוסר את האובייקט למעטפת. */
    fireEvent.click(await screen.findByRole('button', { name: 'התחל קרב' }));

    const hero = await waitFor(() => {
      const el = document.querySelector('[data-arena-slot="hero"]');
      if (el === null) throw new Error('the hero slot never appeared');
      return el;
    });

    expect(hero.querySelector('[data-arena-part="cape"]')).not.toBeNull();
  });

  it('היריב נשאר עירום — הכרעה, ⛔ ולא שריד', async () => {
    render(<ArenaShell />);
    fireEvent.click(await screen.findByRole('button', { name: 'התחל קרב' }));

    const enemy = await waitFor(() => {
      const el = document.querySelector('[data-arena-slot="enemy"]');
      if (el === null) throw new Error('the enemy slot never appeared');
      return el;
    });

    expect(enemy.querySelector('[data-arena-part="cape"]')).toBeNull();
  });
});
