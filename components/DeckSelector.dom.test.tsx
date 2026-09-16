// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeckSelector from '@/components/DeckSelector';
import FilterBar from '@/components/FilterBar';

vi.mock('@/lib/api/client', () => ({
  apiGet: vi.fn(async () => {
    throw new Error('503');
  }),
}));

afterEach(cleanup);

/**
 * 🔴 **`T-389` — שני אריחים במרחק זה מזה אומרים ללומד שני דברים סותרים על אותה
 * אוכלוסייה, ⛔ ורק אחד מהם נמדד.**
 *
 * 🔬 **הפגם, נמדד בהליכה חיה 16/09 (‏`next start`, 375×780) על `/dev/tabs/cards`:**
 * ‏`<FilterBar>` צייר את המונה «לא ידעתי» עם **25** — מספר חי, מ-`summary` שכבר נחת —
 * ובאותו רגע האריח «חזרה» ב-`<DeckSelector>` נשא `aria-disabled="true"` ואת המשפט
 * «— מילים שסימנת לא ידעתי», כי הקריאה הנפרדת שלו ל-`deck=unknown` נכשלה (`F-262`).
 * ⇒ **מספר, ומיד «⛔ אינו קיים».**
 *
 * ⚠️ **⛔ והקובץ הזה מרנדר, ⛔ הוא ⛔ אינו קורא מקור — וזה בדיוק הלקח של `F-224`:**
 * ‏`DeckSelector.test.ts` הוא שומר-מקור (סביבת `node`, בכוונה), והמקור של אריח שמשבית
 * את עצמו על כשל קריאה נקרא **בדיוק** כמו המקור של אריח שאינו עושה זאת. הטענה של
 * `T-389` היא על מה שיש ב-DOM, ⇒ היא נמדדת ב-DOM.
 *
 * ⛔ **ומה שהקובץ הזה ⛔ אינו טוען:** שהבקשה אמנם יצאה לרשת (‏`apiGet` ממוקה), ושהמספרים
 * תואמים את מסד הנתונים. הגיאומטריה — 44px, ⛔ אפס גלילה אופקית — היא `check:mobile`.
 */

/**
 * ⛔ ארבעת המספרים הם של הרנדר, ⛔ ולא הומצאו כאן: `docs/design/render_video_A.py:241`
 * (`LV_TOTAL, LV_KNOWN, LV_UNKNOWN = 400, 61, 25` ⇒ `LV_REMAIN = 314`), וזו גם הפיקסטורה
 * ש-`/dev/tabs/cards` מאכיל ⇒ המסך שנמדד כאן הוא המסך שההליכה החיה מדדה.
 */
const RENDER_SUMMARY = { totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314 };

/** האריח שמדובר בו, לפי השם הנגיש שלו — ⛔ ולא לפי `nth-child`. */
function practiceTile(): HTMLElement {
  return screen.getByText('חזרה').closest('a, button') as HTMLElement;
}

describe('T-389 — כשל בקריאת חפיסה ⛔ אינו הופך לטענה «⛔ אין מה לחזור עליו»', () => {
  it('🔴 הפגם עצמו: המונה חי (25) והאריח לאותה אוכלוסייה ⛔ אינו מושבת', async () => {
    render(
      <>
        <FilterBar summary={RENDER_SUMMARY} />
        <DeckSelector
          unseen={RENDER_SUMMARY.unseen}
          unknown={{ total: null, failed: true, loading: false }}
        />
      </>,
    );

    // ⓐ המונה החי — בדיוק הטענה הראשונה מבין השתיים.
    const counter = document.querySelector('[data-counter="unknown"]');
    expect(counter?.textContent).toContain('25');
    expect(counter?.textContent).toContain('לא ידעתי');

    // ⓑ והטענה השנייה ⛔ כבר אינה נאמרת: האריח בר-הגעה, ⛔ ואינו «מושבת».
    await waitFor(() => {
      const tile = practiceTile();
      expect(tile.getAttribute('aria-disabled')).toBeNull();
      expect(tile.tagName).toBe('A');
      expect(tile.getAttribute('href')).toBe('/study?deck=unknown');
    });
  });

  it('⛔ והמספר ⛔ לא הומצא במקומו: האריח נושא «—», ⛔ ולא 25 ו⛔ לא 0', async () => {
    render(
      <DeckSelector
        unseen={RENDER_SUMMARY.unseen}
        unknown={{ total: null, failed: true, loading: false }}
      />,
    );
    await waitFor(() => {
      expect(practiceTile().textContent).toContain('— מילים שסימנת לא ידעתי');
    });
    // ⛔ המונה של המסך ⛔ אינו אותה אוכלוסייה (‏`T-390`) ⇒ העתקתו לכאן הייתה מספר שקרי.
    expect(practiceTile().textContent).not.toContain('25');
  });

  /**
   * ⛔ **החצי שלא זז, והוא חצי החוקה:** `§ 4.2ו` דורש «מושבת **עם** המספר». חפיסה
   * ש⛔ כן נקראה והחזירה `0` היא מדידה, ⇒ היא נשארת מושבתת — עם האפס שלה.
   */
  it('⛔ חפיסה שנקראה והחזירה 0 ⛔ עדיין מושבתת, ⛔ ועם המספר שלה', async () => {
    render(<DeckSelector unseen={0} unknown={{ total: 0, failed: false, loading: false }} />);
    await waitFor(() => {
      const tile = practiceTile();
      expect(tile.getAttribute('aria-disabled')).toBe('true');
      expect(tile.textContent).toContain('0 מילים שסימנת לא ידעתי');
    });
  });

  /**
   * ⛔ **ו-`primaryKey` ⛔ אינו נודד אל אריח שאיש לא מדד** — אחרת הסימון היחיד במסך
   * (‏`F-027`) היה יורד מ-`טעינה מחדש`, הפקד היחיד שיכול לתקן את הכשל, בדיוק במצב
   * שבשבילו הוא קיים (`T-329`ⓑ · `T-349`ⓑ).
   */
  it('⛔ פעולה ראשית אחת בדיוק, והיא ⛔ אינה האריח הבלתי-נמדד', async () => {
    render(<DeckSelector unknown={{ total: null, failed: true, loading: false }} />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-primary-action]').length).toBe(1);
    });
    const marked = document.querySelector('[data-primary-action]');
    expect(marked?.textContent).toBe('טעינה מחדש');
  });

  /**
   * ⛔ **וכשיש אריח נמדד וחי, הוא הראשי** — הכשל הוא **חלקי**, והמסך ⛔ אינו מאבד את
   * הפעולה שכן נמדדה. זה המצב ש-`/dev/tabs/cards` מודד (`unseen: 314`).
   */
  it('⛔ כשל חלקי: הראשי הוא האריח הנמדד, ⛔ והספירה נשארת אחת', async () => {
    render(
      <DeckSelector unseen={314} unknown={{ total: null, failed: true, loading: false }} />,
    );
    await waitFor(() => {
      expect(document.querySelectorAll('[data-primary-action]').length).toBe(1);
    });
    expect(document.querySelector('[data-primary-action]')?.textContent).toContain('סינון מילים');
  });
});
