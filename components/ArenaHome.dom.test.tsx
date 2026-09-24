// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ArenaHome, { type ArenaHomeState } from '@/components/ArenaHome';
import { LAST_ROUND_SURVIVED_HE, LAST_ROUND_WON_HE } from '@/lib/core/arenaLastRound';

/**
 * T-360 · `36 § 13.1` חותמת ⓒ — **«מה שהלומד עשה נשמר ונראה בכניסה הבאה».**
 *
 * ⛔ **סריקת מקור ⛔ אינה מודדת את החותמת הזאת.** `components/ArenaHome.test.ts` רץ
 * ב-environment `node` ובודק שהמחרוזות **כתובות בקובץ** — טענה שנשארת ירוקה גם אם הלוח
 * מעולם ⛔ לא צויר, כי התנאי `state.lastRound != null` ⛔ אינו מחרוזת. ⇒ הקובץ הזה מרכיב
 * את הרכיב האמיתי, בדפוס `components/ArenaBattle.dom.test.tsx`, ומודד את **המסך**.
 *
 * ⛔ **ו⛔ אין כאן `fetch`:** `initialState` הוא בדיוק המסלול שהפיקסצ׳ר `/dev/arcade/home`
 * הולך בו, ⇒ מה שנמדד כאן הוא מה שההליכה החיה רואה.
 */

const BASE: ArenaHomeState = Object.freeze({
  arcadeLevel: 7,
  wins: 3,
  unlockedItems: ['helmet', 'lantern'],
  character: 'warrior',
});

function mount(state: ArenaHomeState): void {
  render(<ArenaHome initialState={state} onStart={() => {}} onDesign={() => {}} />);
}

afterEach(cleanup);

describe('T-360 · לוח «הקרב האחרון» על מסך הבית', () => {
  it('קרב שנשמר ⇒ הלומד רואה את התוצאה, את הניקוד ואת התאריך', () => {
    mount({
      ...BASE,
      lastRound: {
        finishedAt: '2026-09-16T23:13:07.482Z',
        wordsSeen: 16,
        wordsCorrect: 14,
        enemyDefeated: true,
      },
    });
    const panel = document.querySelector('[data-arena-last-round]');
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain('הקרב האחרון');
    expect(panel?.textContent).toContain(LAST_ROUND_WON_HE);
    expect(panel?.textContent).toContain('14 / 16');
    expect(panel?.textContent).toContain('16.09');
  });

  it('⛔ הפסד ⛔ אינו מילה על המסך — עובדה על היריב, כמו במסך הסיום (R-016)', () => {
    mount({
      ...BASE,
      lastRound: {
        finishedAt: '2026-09-16T23:13:07.482Z',
        wordsSeen: 16,
        wordsCorrect: 7,
        enemyDefeated: false,
      },
    });
    const panel = document.querySelector('[data-arena-last-round]');
    expect(panel?.textContent).toContain(LAST_ROUND_SURVIVED_HE);
    expect(panel?.textContent).not.toContain('הפסד');
  });

  it('לומד שטרם קרב ⇒ ⛔ אין לוח כלל, ⛔ ולא לוח ריק', () => {
    mount({ ...BASE, lastRound: null });
    expect(document.querySelector('[data-arena-last-round]')).toBeNull();
    mount(BASE);
    expect(document.querySelector('[data-arena-last-round]')).toBeNull();
  });

  it('המספר ⛔ אינו ערום למקריא-מסך — תווית כתובה נושאת אותו', () => {
    mount({
      ...BASE,
      lastRound: {
        finishedAt: '2026-01-05T06:00:00.000Z',
        wordsSeen: 12,
        wordsCorrect: 12,
        enemyDefeated: true,
      },
    });
    const panel = document.querySelector('[data-arena-last-round]');
    expect(panel?.textContent).toContain('נכונות');
    expect(panel?.textContent).toContain('הסתיים בתאריך');
    expect(panel?.textContent).toContain('05.01');
  });

  it('🔑 הלוח בתוך האזור הגמיש והפעולות מעוגנות — ⛔ הוא ⛔ אינו דוחף אותן מתחת לקפל (T-420)', () => {
    mount({
      ...BASE,
      lastRound: {
        finishedAt: '2026-09-16T23:13:07.482Z',
        wordsSeen: 16,
        wordsCorrect: 14,
        enemyDefeated: true,
      },
    });
    const actions = document.querySelector('[data-rtl-row="home-actions"]');
    const panel = document.querySelector('[data-arena-last-round]');
    expect(actions).not.toBeNull();
    expect(panel).not.toBeNull();
    // ⛔ זו ⛔ אינה העדפה: 93px מעל הפעולות דחפו אותן מתחת לקפל ב-375×780 והאדימו
    // את `check:mobile` — ⛔ והשער צדק, מבט לאחור ⛔ אינו קודם לפעולה הראשית.
    // 🏠 ⟦T-420⟧ **אותה טענה, בצורה שנשארת נכונה בגובה מדויק:** הלוח יושב **בתוך** האזור
    // הגמיש (הנגלל), והפעולות **מחוצה לו**, מעוגנות — ⇒ הלוח ⛔ אינו יכול להזיז אותן.
    // מתחת להן הוא היה נחתך מחוץ למסך שגובהו `100dvh` בדיוק.
    const body = document.querySelector('[data-arena-home-body]');
    expect(body).not.toBeNull();
    expect(body!.contains(panel)).toBe(true);
    expect(body!.contains(actions)).toBe(false);
  });

  it('⛔ הניקוד ⛔ אינו יעד מגע ו⛔ אינו כפתור — הלוח ⛔ אינו מוביל לשום מקום', () => {
    mount({
      ...BASE,
      lastRound: {
        finishedAt: '2026-09-16T23:13:07.482Z',
        wordsSeen: 16,
        wordsCorrect: 14,
        enemyDefeated: true,
      },
    });
    const panel = document.querySelector('[data-arena-last-round]') as HTMLElement;
    expect(panel.querySelectorAll('button, a, [role="button"]').length).toBe(0);
    // ⛔ ולא שבר את שלוש הפעולות של `37 § 12` שכן נלחצות.
    expect(screen.getByText('התחל קרב')).toBeTruthy();
  });
});

/**
 * 🗄️ T-488 · `D-292` — **הארון אומר מה יבוא ומתי, ⛔ ואינו חוזר על שורת «ציוד».**
 * תרחיש הכישלון שנמדד `C-0817`: הארון הציג את **אותן 4 משבצות** שכבר מעליו.
 */
describe('T-488 · ארון הציוד כגיליון', () => {
  const FIXTURE: ArenaHomeState = { ...BASE, unlockedItems: ['helmet', 'lantern', 'banner'] };
  function open(): HTMLElement {
    mount(FIXTURE);
    fireEvent.click(screen.getByRole('button', { name: 'ארון ציוד' }));
    return screen.getByRole('dialog', { name: 'ארון ציוד' });
  }

  it('סגור ⇒ ⛔ אין גיליון', () => {
    mount(FIXTURE);
    expect(document.querySelector('[data-arena-closet]')).toBeNull();
  });

  it('5 אריחים — פריטים, ⛔ לא משבצות — ו-0 תאים כפולים משורת «ציוד»', () => {
    const sheet = open();
    const tiles = sheet.querySelectorAll('[data-arena-closet-tile]');
    expect(tiles).toHaveLength(5);
    expect(sheet.querySelectorAll('[data-arena-closet-tile="held"]')).toHaveLength(3);
    for (const slot of ['רגליים', 'גוף']) expect(sheet.textContent).not.toContain(slot);
  });

  it('⛔ תרחיש הכישלון של T-487: גלימה ב-8, מגפיים ב-9 — ⛔ לא הפוך', () => {
    const sheet = open();
    const text = (item: string) =>
      [...sheet.querySelectorAll('[data-arena-closet-tile] .sr-only')].find((n) => n.textContent?.startsWith(item))?.textContent;
    expect(text('גלימה')).toBe('גלימה, נעול, נפתח ברמת זירה 8');
    expect(text('מגפיים')).toBe('מגפיים, נעול, נפתח ברמת זירה 9');
    expect(text('קסדה')).toBe('קסדה, ברשותך');
    expect(sheet.textContent).not.toContain('ניצחון בקרב');
  });

  it('הקשה על הרקע ⇒ הגיליון נסגר', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'סגירת ארון הציוד' }));
    expect(document.querySelector('[data-arena-closet]')).toBeNull();
  });
});

/**
 * T-489 · `D-292` — **הגיליון נסגר כמו שנפתח, בשלוש דרכים, והפוקוס חוזר לכפתור.**
 * תרחיש הכישלון: הידית מבטיחה גרירה, והמסך ⛔ אינו מקיים אותה.
 * ⚠️ jsdom ⛔ אינו נושא `matchMedia` ⇒ הרכיב מתייחס אליו כ-`prefers-reduced-motion`,
 * ⇒ הסגירה מיידית, בדיוק כמו אצל לומד שביקש פחות תנועה.
 */
describe('T-489 · שלוש דרכי סגירה', () => {
  const FIXTURE: ArenaHomeState = { ...BASE, unlockedItems: ['helmet'] };
  function open(): HTMLElement {
    mount(FIXTURE);
    const button = screen.getByRole('button', { name: 'ארון ציוד' });
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    return button;
  }

  it('`Escape` ⇒ נסגר, `aria-expanded=false`, והפוקוס חוזר לכפתור', () => {
    const button = open();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('[data-arena-closet]')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('הקשה על הרקע ⇒ הפוקוס חוזר לכפתור', () => {
    const button = open();
    fireEvent.click(screen.getByRole('button', { name: 'סגירת ארון הציוד' }));
    expect(document.activeElement).toBe(button);
  });

  it('גרירת הידית למטה ושחרור ⇒ נסגר', () => {
    open();
    const handle = document.querySelector('[data-arena-closet-handle]') as HTMLElement;
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 400 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 600 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 600 });
    expect(document.querySelector('[data-arena-closet]')).toBeNull();
  });

  it('⛔ אצבע שנייה ⛔ אינה חוטפת את הגרירה', () => {
    open();
    const handle = document.querySelector('[data-arena-closet-handle]') as HTMLElement;
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 400 });
    fireEvent.pointerDown(handle, { pointerId: 2, clientY: 100 });
    fireEvent.pointerUp(handle, { pointerId: 2, clientY: 700 });
    expect(document.querySelector('[data-arena-closet]')).not.toBeNull();
  });
});
