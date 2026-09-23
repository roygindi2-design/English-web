// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
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
