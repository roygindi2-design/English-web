// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ArenaBattle from '@/components/ArenaBattle';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

/**
 * T-239 · `D-065` — **«שלושה מסכי כשל בלי יציאה», ⛔ ולא הפעם הראשונה שהוא נמדד בזירה.**
 *
 * ⛔ **מה שהיה חסר לפני השורה הזאת:** `components/ArenaBattle.test.ts` רץ ב-environment
 * `node` (בלי jsdom, בכוונה — הבדיקות שם הן source-scanning) ⇒ אפס בדיקה אי־פעם הרכיבה
 * את `<ArenaBattle>` ומדדה מה בפועל מצויר כש-`GET /api/arcade/round` עונה בכל אחד מארבעת
 * קודי הכשל שלו. הטענה «כל מסך כשל נושא יציאה» הייתה תיאור-קוד, ⛔ ולא בדיקה.
 *
 * הקובץ הזה, בדפוס `components/StoryScreen.dom.test.tsx` (`@vitest-environment jsdom` +
 * `@testing-library/react`), מרכיב את הרכיב **האמיתי** — לא View מופשט — עם `fetch`
 * מזויף (התבנית של `lib/api/client.test.ts`), ומודד את מה שלומד רואה בפועל בארבעת
 * המסלולים: `session_expired` · `schema_missing` · `level_too_small` · `unavailable`
 * (offline/כשל רשת). כל אחד מהם חייב להציג משפט **וגם** פעולה אחת שאפשר ללחוץ עליה.
 */

function stubFetch(impl: () => Promise<Response> | Response): void {
  vi.stubGlobal('fetch', vi.fn(impl));
}

beforeEach(() => {
  // ⛔ jsdom אינו מממש `matchMedia` — הרכיב קורא לו ללא תנאי ב-mount (`prefers-reduced-motion`,
  // בדיוק כמו `components/Flashcard.tsx:65-77`). בלי הסטאב הזה כל mount נופל לפני שנמדד דבר.
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

describe('T-239 ⓑ — כל מסך כשל נושא משפט ופעולת יציאה אחת, נמדד ולא משוער', () => {
  it('session_expired (401) — כפתור «התחברות מחדש» מוביל ל-/login', async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: false, code: 'session_expired' }), { status: 401 }));
    render(<ArenaBattle />);
    const link = await screen.findByRole('link', { name: 'התחברות מחדש' });
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('schema_missing (503) — ⛔ אין מסך ריק, יש משפט + כפתור החזרה (RETRY_HE)', async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({ ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' }),
          { status: 503 },
        ),
    );
    render(<ArenaBattle />);
    expect(await screen.findByText('המאגר עדיין לא הוקם')).toBeTruthy();
    expect(screen.getByRole('button', { name: RETRY_HE })).toBeTruthy();
  });

  it('level_too_small — המספרים מהשרת (D-046) + קישור «בחירת רמה» ל-/cards', async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            ok: true,
            gameLevel: 1,
            band: 'A1',
            round: null,
            reason: 'level_too_small',
            unlocked: false,
            eligible: 8,
            required: 12,
          }),
          { status: 200 },
        ),
    );
    render(<ArenaBattle />);
    expect(await screen.findByText('נדרשות 12 מילים ברמה, יש 8')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'בחירת רמה' });
    expect(link.getAttribute('href')).toBe('/cards');
  });

  it('unavailable (503) — כשל שרת גנרי מציג כפתור חזרה (RETRY_HE), ⛔ ולא מסך ריק', async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 }));
    render(<ArenaBattle />);
    expect(await screen.findByText(FAILURE_HE.load)).toBeTruthy();
    expect(screen.getByRole('button', { name: RETRY_HE })).toBeTruthy();
  });

  it('כשל רשת (fetch נכשל) — אותו מסך עם כפתור החזרה, ⛔ לא ספינר לנצח', async () => {
    stubFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    render(<ArenaBattle />);
    expect(await screen.findByText(FAILURE_HE.load)).toBeTruthy();
    const retry = screen.getByRole('button', { name: RETRY_HE });
    expect(retry).toBeTruthy();
  });

  it('⛔ לחיצה על כפתור החזרה אחרי unavailable שולחת בקשה שנייה — הפעולה חיה, ⛔ לא קישוט', async () => {
    let calls = 0;
    stubFetch(() => {
      calls += 1;
      return new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 });
    });
    render(<ArenaBattle />);
    const retry = await screen.findByRole('button', { name: RETRY_HE });
    await waitFor(() => expect(calls).toBe(1));
    retry.click();
    await waitFor(() => expect(calls).toBe(2));
  });
});

/**
 * T-267 · **הקריסה נמדדה חי בטיק הזה, ⛔ ולא שוערה** — Playwright, 375×780, `next dev`
 * חי, `GET /api/arcade/round` הוחזר עם `ok: true, round: { questions: null }` (צורה
 * שהשרת עצמו ⛔ אינו מייצר היום — `buildRound` תמיד מחזירה מערך אמיתי — אבל שאין שום
 * דבר בצד הלקוח שמונע: החוזה הטיפוסי `RoundBody` הוא ⛔ אך ורק בזמן קומפילציה, ותשובת
 * רשת שגויה — קאש ישן, פרוקסי שמסלף, גרסת API עתידית ששינתה צורה — עוברת אותו בשקט).
 * ⇒ `byWordId = useMemo(() => new Map(questions.map(...)), [questions])` זרק
 * `TypeError: Cannot read properties of null (reading 'map')`, נתפס ב-error boundary
 * של הנתיב, ומוצג ללומד כ«משהו נתקע» — **בדיוק** התסמין ש-T-267 דיווח עליו.
 * `app/error.tsx` (אותו טיק) עכשיו מתעד את זה ל-`console.error` — לפני התיקון הזה
 * היה בלתי אפשרי אפילו לדעת שזו הסיבה.
 *
 * ⚠️ **התיקון כאן הוא באחריות הלקוח לאמת את צורת התשובה** ⛔ ולפני שהוא סומך עליה —
 * בדיוק כמו `body.round === null` שכבר קיים שורה מעליו. `questions` שאינו מערך הופך
 * לאותו מסך כשל קיים (`FAILURE_HE.load` + `RETRY_HE`), ⛔ ולא לקריסה.
 */
describe('T-267 — תשובת שרת שגויה (round.questions אינו מערך) מוצגת כמסך כשל, ⛔ ולא קורסת', () => {
  it('round.questions === null — מסך כשל עם כפתור חזרה, ⛔ אפס קריסה', async () => {
    stubFetch(() =>
      new Response(
        JSON.stringify({ ok: true, band: 'A1', round: { questions: null } }),
        { status: 200 },
      ),
    );
    render(<ArenaBattle />);
    expect(await screen.findByText(FAILURE_HE.load)).toBeTruthy();
    expect(screen.getByRole('button', { name: RETRY_HE })).toBeTruthy();
  });

  it('round.questions הוא מחרוזת (עוד צורה שגויה) — אותו מסך כשל, ⛔ אפס קריסה', async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({ ok: true, band: 'A1', round: { questions: 'not-an-array' } }),
          { status: 200 },
        ),
    );
    render(<ArenaBattle />);
    expect(await screen.findByText(FAILURE_HE.load)).toBeTruthy();
    expect(screen.getByRole('button', { name: RETRY_HE })).toBeTruthy();
  });
});
