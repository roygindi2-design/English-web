// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ArenaBattle, { ARENA_TAUGHT_KEY } from '@/components/ArenaBattle';
import { readFileSync } from 'node:fs';
import { withoutComments } from '@/lib/testSource';
import ArenaStage from '@/components/ArenaStage';
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
  // ⛔ jsdom ⛔ אינו מממש Pointer Capture — `SpellCard.tsx:118` קורא לו ללא תנאי
  // ב-`pointerdown`. בלי הסטאב הזה כל הקשה נופלת לפני ש-`onPointerUp` בכלל רץ.
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

/**
 * 🔥 **T-401 — הרצף על המסך, נמדד ב-DOM אמיתי ⛔ ולא בסריקת מקור.**
 *
 * ⛔ **למה כאן ו⛔ לא ב-`ArenaBattle.test.ts`:** הקובץ ההוא רץ ב-`node` וסורק טקסט —
 * הוא יכול למדוד ש**נכתב** `{streak > 0 && …}`, ⛔ ולא שהשבב **מופיע** אחרי הטלה
 * נכונה ו**נעלם** אחרי שגויה. ⇒ הטענה «הרצף מגיע ללומד באמצע הקרב» נמדדת ⛔ אך ורק
 * על עץ מורכב.
 *
 * ⛔ **הפיקסצ׳ר הוא הפיקסצ׳ר של הייצור** (`app/dev/arcade/page.tsx`, ⛔ לא צורה משלי):
 * `kind: 'base'`, ארבע אפשרויות, והתשובה היא `אפשרות N` — בדיוק מה שהנתיב מחזיר
 * ללומד עם מחסן ריק. ⚠️ **DEV.md STEP 5:** «פיקסצ׳ר שנבדל מייצור ולו במימד אחד הוא
 * חור, ⛔ לא בדיקה».
 */
describe('T-401 — שבב הרצף מופיע באמצע הקרב ומתאפס על שגיאה', () => {
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

  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };

  /**
   * `§ 5` — מסלול הנגישות: הקשה בוחרת, הקשה שנייה על אותו קלף משגרת.
   * ⛔ **`pointerdown`+`pointerup`, ⛔ ולא `click()`, וזו מדידה:** `SpellCard.tsx:128-149`
   * מכריע בין גרירה להקשה ב-`onPointerUp` ⇒ ל-`click()` ⛔ אין כאן מאזין בכלל. ⛔ אותה
   * נקודה לשני האירועים ⇒ `resolveGesture` מחזיר «הקשה», ⛔ ולא «הטלה».
   */
  const tap = (node: Element): void => {
    fireEvent.pointerDown(node, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(node, { clientX: 10, clientY: 10, pointerId: 1 });
  };

  /**
   * ⛔ **הקלף ⛔ ולא «הכפתור ששמו מכיל את המילה»:** אחרי הבחירה הראשונה נולד גם כפתור
   * `שגר לחש <המילה>` (`FIRE_HE`), ⇒ חיפוש לפי שם מחזיר **שניים**. ‏`[data-arena-card]`
   * הוא הסימון שהיד כבר נושאת, והוא מה ש-`selectedCardRect` עצמו קורא.
   */
  const cardHe = (he: string): Element => {
    const hit = Array.from(document.querySelectorAll('[data-arena-card]')).find(
      (node) => (node.textContent ?? '').includes(he),
    );
    expect(hit, `קלף «${he}» חייב להיות ביד`).toBeTruthy();
    return hit as Element;
  };

  const castHe = (he: string): void => {
    tap(cardHe(he));
    tap(cardHe(he));
  };

  const chip = (): HTMLElement | null => document.querySelector('[data-arena-streak]');

  it('בפתיחה ⛔ אין שבב בכלל — `N = 0` ⛔ אינו מצויר', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(chip()).toBeNull();
  });

  it('הטלה נכונה ⇒ `רצף 1` על המסך, ⛔ ולא רק בסיכום', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    castHe('אפשרות 1');
    await waitFor(() => expect(chip()).not.toBeNull());
    expect(chip()?.textContent).toContain('רצף');
    expect(chip()?.textContent).toContain('1');
  });

  it('⛔ המעבר לזהב הוא בדיוק ב-3, ⛔ ולא ב-2', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    castHe('אפשרות 1');
    castHe('אפשרות 2');
    await waitFor(() => expect(chip()?.getAttribute('data-arena-streak-hot')).toBe('off'));
    castHe('אפשרות 3');
    await waitFor(() => expect(chip()?.getAttribute('data-arena-streak-hot')).toBe('on'));
  });

  it('הטלה שגויה מאפסת ⇒ השבב נעלם, ⛔ ולא «יורד באחת»', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    castHe('אפשרות 1');
    await waitFor(() => expect(chip()).not.toBeNull());
    castHe('מסיח 2א');
    await waitFor(() => expect(chip()).toBeNull());
  });

  /**
   * 🔥 **⟦20/09 · `C-0750` · `37 § 8` ק1 · `D-271`⟧ הרצף מגיע אל ה**דמות**.**
   *
   * ‏`D-271` מחק את «מכפיל 1.5» אחרי שנמדד ש**נזק ומילים הם אותו ציר, הפוך**
   * ⇒ מה שנשאר מק1 הוא **הכרה**: הילה ולהב לוהט.
   * ⛔ **והסף ⛔ אינו נספר פעמיים:** אותו `streak >= STREAK_HOT` שהשבב כבר
   * משתמש בו הוא מה שמגיע לבמה, ⇒ שבב זהוב ודמות קרה ⛔ אינם מצב אפשרי.
   */
  const heroHot = (): string | null =>
    document.querySelector('[data-arena-slot="hero"]')?.getAttribute('data-arena-hot') ?? null;

  it('שלוש נכונות ברצף ⇒ הגיבור **לוהט**, ⛔ ולא רק השבב', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(heroHot(), 'בפתיחה').toBe('off');
    castHe('אפשרות 1');
    castHe('אפשרות 2');
    await waitFor(() => expect(heroHot(), '⛔ ולא ב-2').toBe('off'));
    castHe('אפשרות 3');
    await waitFor(() => expect(heroHot(), 'בדיוק ב-3').toBe('on'));
  });

  it('הטלה שגויה מכבה את הדמות, בדיוק כמו את השבב', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    castHe('אפשרות 1');
    castHe('אפשרות 2');
    castHe('אפשרות 3');
    await waitFor(() => expect(heroHot()).toBe('on'));
    castHe('מסיח 4א');
    await waitFor(() => expect(heroHot()).toBe('off'));
  });

  it('⛔ השבב והדמות ⛔ אינם יכולים להיפרד — סף אחד, ⛔ ולא שניים', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    castHe('אפשרות 1');
    castHe('אפשרות 2');
    castHe('אפשרות 3');
    await waitFor(() => expect(heroHot()).toBe('on'));
    expect(chip()?.getAttribute('data-arena-streak-hot')).toBe('on');
  });
});

/**
 * 👻 **T-403 — השער של «הקרב הראשון», נמדד על עץ חי.**
 *
 * ⛔ **מה ⛔ אינו נמדד כאן, ומוצהר:** הרפאים עצמו. הוא נולד משני
 * `getBoundingClientRect` אמיתיים, ו-`jsdom` מחזיר **0×0** לכל צומת ⇒ השומר
 * `from.width === 0` (שהוא נכון בייצור) חוסם אותו כאן תמיד. ⇒ בדיקה שהייתה
 * «מוכיחה» שהוא מופיע ב-`jsdom` הייתה מודדת את הסטאב שלי, ⛔ לא את המוצר.
 * 🔬 **הוא נמדד בהליכה החיה של הטיק** (`DEV.md` STEP 6.5, `next start` ב-375×780).
 * ⇒ מה שכן נמדד כאן הוא **השער**: הביט היחיד שמחליט אם בכלל מלמדים.
 */
describe('T-403 — «בקרב הראשון בלבד»: שער אחד, ⛔ ולא שניים', () => {
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

  const ROUND = { level: 'A1', questions: [1, 2, 3].map(question) };

  it('קרב ראשון (⛔ אין מפתח באחסון) — מסלול ההוראה פתוח', async () => {
    window.localStorage.removeItem(ARENA_TAUGHT_KEY);
    render(<ArenaBattle initialRound={ROUND} />);
    await waitFor(() => expect(document.querySelector('[data-arena-hint]')).not.toBeNull());
  });

  it('קרב שני (המפתח קיים) — ⛔ אין רפאים ו⛔ אין פסקה, שניהם מאותו ביט', async () => {
    window.localStorage.setItem(ARENA_TAUGHT_KEY, '1');
    render(<ArenaBattle initialRound={ROUND} />);
    await waitFor(() => expect(document.querySelector('[data-arena-hint]')).toBeNull());
    expect(document.querySelector('[data-arena-teach]')).toBeNull();
    window.localStorage.removeItem(ARENA_TAUGHT_KEY);
  });

  it('⛔ הפסקה ⛔ אינה מוחלפת — היא מסלול הנגישות, והתנועה ⛔ אינה תחליף לה', async () => {
    window.localStorage.removeItem(ARENA_TAUGHT_KEY);
    render(<ArenaBattle initialRound={ROUND} />);
    const hint = await waitFor(() => {
      const node = document.querySelector('[data-arena-hint]');
      expect(node).not.toBeNull();
      return node as Element;
    });
    expect(hint.textContent).toContain('גרור קלף כלפי מעלה');
  });

  it('🔵 T-425 — הקשה על קלף מחליפה את ההוראה לצעד השני, ⛔ ושתיהן ⛔ לעולם לא יחד', async () => {
    window.localStorage.removeItem(ARENA_TAUGHT_KEY);
    render(<ArenaBattle initialRound={ROUND} />);
    const hint = await waitFor(() => {
      const node = document.querySelector('[data-arena-hint]');
      expect(node).not.toBeNull();
      return node as Element;
    });
    expect(hint.textContent).not.toContain('היריב');
    const card = document.querySelector('[data-arena-card]') as HTMLElement;
    // הקשה = `pointerdown`+`pointerup` באותה נקודה (`SpellCard.tsx`), ⛔ ולא `click`.
    fireEvent.pointerDown(card, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 10, clientY: 10, pointerId: 1 });
    await waitFor(() =>
      expect(document.querySelector('[data-arena-hint]')?.textContent).toBe('עכשיו הקש על היריב כדי להטיל'),
    );
  });
});

/**
 * ⚡ **T-363 · `37 § 4` — שורת היכולות על המסך האמיתי.**
 * ⛔ **המכניקה נמדדת ב-`lib/core/battle.test.ts`** (מכפיל, חסינות, הקפאה) — כאן נמדד
 * מה שסריקת מקור ⛔ אינה יכולה לראות: שלושה כפתורים **מרונדרים**, בסדר של הרנדר,
 * ושכשאין מאנה הם `disabled` **באמת** ⛔ ולא רק מעומעמים.
 */
describe('T-363 — שורת היכולות', () => {
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
  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };

  const buttons = (): HTMLButtonElement[] =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('[data-arena-ability]'));

  /** ⛔ ⛔ לא `buttons()[i]`: `noUncheckedIndexedAccess` נותן `| undefined`, והבדיקה
      צריכה **להיכשל בשם היכולת** ⛔ ולא ליפול על `undefined` שלוש שורות אחר כך. */
  const ability = (key: string): HTMLButtonElement => {
    const el = document.querySelector<HTMLButtonElement>(`[data-arena-ability="${key}"]`);
    expect(el, `הכפתור «${key}» חייב להיות על המסך`).not.toBeNull();
    return el as HTMLButtonElement;
  };

  it('שלושה כפתורים, בסדר של `render_video_B.py:308` — `כפול` הראשונה בקריאה', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    const keys = buttons().map((b) => b.getAttribute('data-arena-ability'));
    expect(keys).toEqual(['double', 'shield', 'freeze']);
    expect(buttons().map((b) => b.textContent)).toEqual([
      expect.stringContaining('כפול'),
      expect.stringContaining('מגן'),
      expect.stringContaining('הקפאה'),
    ]);
  });

  it('העלות מודפסת על כל כפתור — ⛔ ולא נקודות צבע', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(ability('double').textContent).toContain('4');
    expect(ability('shield').textContent).toContain('3');
    expect(ability('freeze').textContent).toContain('5');
    // ⛔ והמספר נאמר גם במילים למקריא־מסך.
    expect(ability('double').textContent).toContain('עולה');
    expect(ability('double').textContent).toContain('מאנה');
  });

  it('⛔ אפס מאנה בפתיחה ⇒ שלושתם `disabled` **באמת**, ⛔ ולא רק כהים', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    for (const b of buttons()) {
      expect(b.disabled).toBe(true);
      expect(b.getAttribute('data-ready')).toBe('false');
    }
  });

  it('⛔ הקשה על יכולת שאין לה כיסוי ⛔ אינה עושה דבר — ⛔ ואין שורת אפקט', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(document.querySelector('[data-arena-ability-on]')).toBeNull();
    fireEvent.click(ability('double'));
    expect(document.querySelector('[data-arena-ability-on]')).toBeNull();
  });

  it('השורה נושאת `data-rtl-row` ⇒ `check:mobile` מודד אותה ב-320 · 375 · 414', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(document.querySelector('[data-rtl-row="abilities"]')).not.toBeNull();
  });

  it('⛔ `ריפוי` — הרביעית של `§ 4` שהרנדר ⛔ אינו מצייר — ⛔ אינה על המסך', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    const row = document.querySelector('[data-arena-abilities]');
    expect(row?.textContent).not.toContain('ריפוי');
  });
});

/**
 * 🏃 **⟦19/09 · `C-0730` · `T-433`ⓑ · `37 § 5`⟧ הדמות **זזה**, ⛔ ולא רק המנוע.**
 *
 * 🔬 **מה שנמדד לפני, ⛔ ולא נחשד:** `C-0729` בנה את שלושת הנתיבים בליבה הטהורה —
 * ⛔ אבל אף אחד לא קרא ל-`moveLane`, ⇒ `heroLane` נשאר `null` לנצח והמוצר התנהג
 * **בדיוק כמו קודם**. בדיקת מקור הייתה ירוקה על כך; רק רינדור מכריע.
 *
 * ⛔ **וזו הסיבה שהטענה היא על ה-DOM ⛔ ולא על הקוד:** «`swipe` נקרא» ⛔ אינו
 * «הדמות עברה נתיב» — בין השניים יושבים הפרופ, ההמרה ל-`LANE_NAMES` והתכונה.
 */
describe('C-0730 · T-433ⓑ — ההחלקה מזיזה את הדמות על המסך', () => {
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
  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };

  const stage = (): Element => {
    const node = document.querySelector('[data-arena-stage-area]');
    expect(node, 'אזור הבמה חייב להיות על המסך').toBeTruthy();
    return node as Element;
  };
  const lane = (): string | null =>
    document.querySelector('[data-arena-slot="hero"]')?.getAttribute('data-arena-lane') ?? null;

  /**
   * ⛔ **המרחק ⛔ אינו «מספיק גדול» — הוא נגזר:** `GESTURE_THRESHOLD_PX` הוא 60,
   * ו-`SWIPE_EDGE_PX` פוסל התחלה בקצה ⇒ מתחילים ב-300 (‏`innerWidth` של jsdom הוא
   * 1024) ועוברים 120. ⛔ ו-`dy` נשאר 0, אחרת גדר הזווית מבטלת את המחווה.
   */
  const swipeBy = (dx: number): void => {
    fireEvent.pointerDown(stage(), { clientX: 300, clientY: 200, pointerId: 7 });
    fireEvent.pointerUp(stage(), { clientX: 300 + dx, clientY: 200, pointerId: 7 });
  };

  it('בפתיחה הדמות במרכז — `null` בליבה **מצויר** כמרכז', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(lane()).toBe('centre');
  });

  it('🔴 החלקה ימינה ⇒ הדמות **עוברת** נתיב, ⛔ ואינה נשארת במרכז', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    swipeBy(120);
    expect(lane()).toBe('right');
  });

  it('🔴 והסימן **נושא** — שמאלה ⛔ אינו עושה את אותו דבר כמו ימינה', () => {
    // 🔬 זה בדיוק הפגם שהיה: `gesture.dx` חושב ו**נזרק**, ⇒ שני הכיוונים היו זהים.
    render(<ArenaBattle initialRound={ROUND} />);
    swipeBy(-120);
    expect(lane()).toBe('left');
  });

  it('⛔ הקיר עוצר — שתי החלקות לאותו כיוון ⛔ אינן יוצאות מהזירה', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    swipeBy(120);
    swipeBy(120);
    expect(lane()).toBe('right');
  });

  it('החלקה חזרה מחזירה למרכז — התנועה **הפיכה**, ⛔ ולא כיוון אחד', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    swipeBy(120);
    swipeBy(-120);
    expect(lane()).toBe('centre');
  });

  it('⛔ מחווה מתחת לסף ⛔ אינה מזיזה — 59px ⛔ אינם נתיב', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    swipeBy(59);
    expect(lane()).toBe('centre');
  });
});

/**
 * 🎯 **⟦19/09 · `C-0732` · `T-434`⟧ סימן הרצפה — **המידע**, ⛔ ולא הקישוט.**
 *
 * ⛔ **ומדוע זה נבדק ברינדור ⛔ ולא במקור:** «`aim` מועבר» ⛔ אינו «הסימן נמצא
 * במקום הנכון». בין השניים יושבים ההמרה ל-`LANE_NAMES` והבחירה ⛔ לצייר כלום
 * כשאין מתקפה — ושתיהן שקטות בבדיקת מקור.
 */
describe('C-0732 · T-434 — סימן הרצפה', () => {
  const aimOf = (aim: Parameters<typeof ArenaStage>[0]['aim']) => {
    const { container } = render(<ArenaStage phase="idle" items={[]} aim={aim} />);
    return container.querySelector('[data-arena-aim]')?.getAttribute('data-arena-aim') ?? null;
  };

  it('⛔ אין מתקפה ⇒ ⛔ אין סימן — ⛔ ולא «סימן במרכז תמיד»', () => {
    expect(aimOf(null)).toBeNull();
  });

  it('שלושת הנתיבים נקראים בשמם על הרצפה', () => {
    expect(aimOf(-1)).toBe('left');
    cleanup();
    expect(aimOf(0)).toBe('centre');
    cleanup();
    expect(aimOf(1)).toBe('right');
  });

  it('🔴 הסימן הוא **אח** של החריצים — ⇒ ⛔ אינו נע עם הלומד', () => {
    // 🔬 הפגם שזה מונע: סימן שיושב בתוך `[data-arena-slot="hero"]` נע איתו בין
    //    נתיבים, כלומר מצביע **תמיד** על הלומד ו⛔ לעולם ⛔ אינו מלמד להתחמק.
    const { container } = render(<ArenaStage phase="idle" items={[]} lane={1} aim={-1} />);
    const hero = container.querySelector('[data-arena-slot="hero"]');
    expect(hero?.querySelector('[data-arena-aim]'), 'הסימן ⛔ אינו בתוך החריץ').toBeNull();
    expect(container.querySelector('[data-arena-aim]'), 'ובכל זאת הוא על הבמה').not.toBeNull();
  });
});

/**
 * 🩸 **⟦19/09 · `C-0733` · `T-436` · סוגר את `F-304`⟧ ללומד לא היה פס חיים.**
 *
 * 🔬 **הפגם, כפי שנמדד:** `grep -rn "learnerHp" components/` ⇒ **0**. למנוע יש
 * `learnerHp`/`learnerHpMax`, הם **יורדים מכל מכה**, ו-`outcomeAt` מכריע לפיהם —
 * והלומד ⛔ **לא יכול היה לראות אותם**. ⇒ הוא הפסיד בלי לדעת שהוא בסכנה.
 *
 * 🔴 **ובלי זה כל מכניקת התנועה חסרת פשר:** ⛔ אין טעם להתחמק ממכה כשאי-אפשר
 * לראות מה היא עולה.
 */
describe('C-0733 · T-436 — פס חיי הלומד', () => {
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
  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };

  it('🔴 הפס **על המסך**, נגיש בשם, ומתחיל מלא', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    const bar = document.querySelector('[data-arena-learner] [role="img"]');
    expect(bar, 'פס חיי הלומד חייב להיות על המסך').not.toBeNull();
    expect(bar?.getAttribute('aria-label')).toContain('100');
  });

  it('⛔ שני הפסים נבדלים ב**צבע** — מבטא שלי, אדום שלו (`T-427`)', () => {
    // 🔬 צבע זהה לשניהם אומר «שני מדים», ⛔ ולא «שלי מול שלו».
    render(<ArenaBattle initialRound={ROUND} />);
    const mine = document.querySelector('[data-arena-learner] [data-arena-hp-fill]');
    const his = document.querySelector('[data-arena-enemy] [data-arena-hp-fill]');
    expect(mine?.className).toContain('--brand');
    expect(his?.className).toContain('--arena-hp');
    expect(mine?.className).not.toBe(his?.className);
  });

  it('⛔ והצבע ⛔ אינו הערוץ היחיד — המספר על המסך (חוקה א2)', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(document.querySelector('[data-arena-learner]')?.textContent ?? '').toContain('100');
  });

  it('🩸 הפס יורש את אותה ריקון של היריב — ⛔ ולא מעבר שני', () => {
    // ⛔ `data-arena-hp-fill` הוא הווו: 260ms, ונעצר תחת תנועה מופחתת — **באותו כלל**.
    render(<ArenaBattle initialRound={ROUND} />);
    expect(document.querySelectorAll('[data-arena-hp-fill]').length).toBe(2);
  });

  it('⛔ ⛔ לא רצועה שמינית — הפס **צף מעל הבמה**, כמו של היריב', () => {
    // 🔬 תקציב הרצועות סגור על 522px ונמדד חי ב-`check:mobile`.
    render(<ArenaBattle initialRound={ROUND} />);
    const holder = document.querySelector('[data-arena-learner]')?.parentElement;
    expect(holder?.className).toContain('absolute');
  });
});

/**
 * 🕹️ **⟦19/09 · `C-0735` · `T-437` · `D-270` ④⟧ התנועה הופכת לרציפה.**
 *
 * 🔬 **הפער, כלשון רוי ⛔ ולא בניסוח שלי:** «ההזזה של השחקן קצת **איטית ולא
 * רציפה**». ⇒ נמדד בקוד: המחווה הוכרעה **רק** ב-`onPointerUp`, ⇒ ⛔ שום דבר
 * ⛔ לא קרה כל עוד האצבע על המסך, וגרירה ארוכה שווה בדיוק לקצרה.
 *
 * 🔴 **וזו הטענה שמאדימה על הקוד הקודם:** `pointermove` **בלי** `pointerup`.
 * בדיקה שמסתיימת בהרמת אצבע ⛔ אינה יכולה להבדיל בין השניים.
 */
describe('C-0735 · T-437 — התנועה רציפה', () => {
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
  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };

  const stage = (): Element => document.querySelector('[data-arena-stage-area]') as Element;
  const lane = (): string | null =>
    document.querySelector('[data-arena-slot="hero"]')?.getAttribute('data-arena-lane') ?? null;

  /** ⛔ **⛔ מרימה את האצבע** — זו כל הנקודה. `dy = 0`, אחרת גדר הזווית פוסלת. */
  const dragTo = (x: number): void => {
    fireEvent.pointerMove(stage(), { clientX: x, clientY: 200, pointerId: 9 });
  };
  const press = (): void => {
    fireEvent.pointerDown(stage(), { clientX: 300, clientY: 200, pointerId: 9 });
  };

  it('🔴 גרירה של 130px **בלי להרים** ⇒ **שני** נתיבים', () => {
    // 🔬 זו הטענה שמאדימה על הקוד הקודם: שם הכול חיכה ל-`pointerup`.
    render(<ArenaBattle initialRound={ROUND} />);
    press();
    dragTo(430);
    expect(lane(), 'שני נתיבים בגרירה אחת').toBe('right');
    // ⛔ ומרכז ⇒ ימין הוא נתיב **אחד**; שניים דורשים שהמדידה **התאפסה**.
    fireEvent.pointerUp(stage(), { clientX: 430, clientY: 200, pointerId: 9 });
  });

  it('הנתיב נדלק **מיד** בחציית הסף — ⛔ ולא בהרמה', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    press();
    dragTo(365);
    expect(lane(), 'האצבע עדיין למטה').toBe('right');
  });

  it('⛔ מתחת לסף ⛔ אינו מזיז, גם באמצע גרירה', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    press();
    dragTo(355);
    expect(lane()).toBe('centre');
  });

  it('⛔ ו⛔ אין תזוזה כפולה — ההרמה אחרי גרירה ⛔ אינה מוסיפה נתיב', () => {
    // 🔬 אחרי האיפוס השארית **קטנה מהסף**, ⇒ `resolveGesture` מחזיר `null`
    //    ב-`pointerup` מעצמו. ⛔ אפס דגל «כבר זזתי».
    render(<ArenaBattle initialRound={ROUND} />);
    press();
    dragTo(365);
    fireEvent.pointerUp(stage(), { clientX: 365, clientY: 200, pointerId: 9 });
    expect(lane()).toBe('right');
  });

  it('הכיוון **נושא** בתוך אותה גרירה — והאיפוס נמדד בשלוש חציות', () => {
    /* 🔬 **המסלול, צעד-צעד — וזה מה שמוכיח שנקודת המוצא מתאפסת:**
       ‏`300 ⇢ 365` ⟨+65⟩ ⇒ **ימין**, המוצא נקבע ל-365
       ‏`365 ⇢ 300` ⟨−65⟩ ⇒ **מרכז**, המוצא נקבע ל-300
       ‏`300 ⇢ 240` ⟨−60⟩ ⇒ **שמאל**
       ⛔ **בלי האיפוס** ההפרש היה נמדד תמיד מ-300 ⇒ הצעד השני היה **אפס**
       והשלישי היה מזיז נתיב **אחד בלבד**. ⇒ `left` הוא הראיה. */
    render(<ArenaBattle initialRound={ROUND} />);
    press();
    dragTo(365);
    expect(lane(), 'חציה ①').toBe('right');
    dragTo(300);
    expect(lane(), 'חציה ② — היפוך כיוון באותה גרירה').toBe('centre');
    dragTo(240);
    expect(lane(), 'חציה ③').toBe('left');
  });
});

/**
 * 🛡️ **⟦19/09 · `C-0737` · `T-438` · `D-270`⟧ ההגנה המוצבת, על המסך.**
 *
 * 🔴 **והטענה שמכריעה כאן ⛔ אינה «היא מצוירת» — היא «היא יושבת על ה**נתיב**».**
 * צומת שייכנס לתוך חריץ הגיבור היה **נע איתו**, כלומר הופך להיות `מגן` —
 * והמכניקה כולה מאבדת את מה שמבדיל אותה.
 */
describe('C-0737 · T-438 — ההגנה על המסך', () => {
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
  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };
  const guardOf = (g: Parameters<typeof ArenaStage>[0]['guard'], c: Parameters<typeof ArenaStage>[0]['character']) => {
    const { container } = render(<ArenaStage phase="idle" items={[]} guard={g} character={c} />);
    return container.querySelector('[data-arena-guard]');
  };

  it('⛔ אין הגנה ⇒ ⛔ אין צומת', () => {
    expect(guardOf(null, 'warrior')).toBeNull();
  });

  it('🔴 יושבת על ה**נתיב**, ⛔ ולא על הלומד — וזה כל ההבדל מ`מגן`', () => {
    const { container } = render(
      <ArenaStage phase="idle" items={[]} lane={1} guard={-1} character="warrior" />,
    );
    const hero = container.querySelector('[data-arena-slot="hero"]');
    expect(hero?.querySelector('[data-arena-guard]'), '⛔ ⛔ אינה בתוך החריץ').toBeNull();
    expect(container.querySelector('[data-arena-guard]')?.getAttribute('data-arena-guard'))
      .toBe('left');
  });

  it('🎭 הצורה **לפי הדמות** — הכרעת רוי', () => {
    // 🔬 שתי דמויות, שתי צורות: אחרת «לפי סוג הדמות» הוא משפט בלי כיסוי.
    const wizard = guardOf(0, 'wizard')?.querySelector('path')?.getAttribute('d');
    cleanup();
    const warrior = guardOf(0, 'warrior')?.querySelector('path')?.getAttribute('d');
    expect(wizard).toBeTruthy();
    expect(warrior).toBeTruthy();
    expect(wizard, 'מכשף ⇒ שדה · לוחם ⇒ חומה').not.toBe(warrior);
  });

  it('⛔ אפס קואורדינטה ברכיב — הצורה מגיעה מהמודול הטהור', () => {
    const src = readFileSync('components/ArenaStage.tsx', 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    expect(src).toContain('GUARD_PATHS');
    expect(src).not.toMatch(/d="M-?\d/);
  });

  it('🔴 מסלול הנגישות קיים, נושא את **המחיר** בשם, ונע עם הנתיב', () => {
    // `§ 5`: «מסלול נגישות **נוסף** … נוסף, לא במקום» ⇒ למחווה חייב להיות תאום.
    render(<ArenaBattle initialRound={ROUND} />);
    const btn = document.querySelector('[data-arena-guard-btn]');
    expect(btn, 'הכפתור חייב להיות במסמך').not.toBeNull();
    expect(btn?.textContent ?? '').toContain('מאנה');
    expect(btn?.getAttribute('data-arena-lane')).toBe('centre');
  });

  it('⛔ אפס מאנה בפתיחה ⇒ הכפתור `disabled` **באמת**', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(document.querySelector('[data-arena-guard-btn]')?.hasAttribute('disabled')).toBe(true);
  });

  it('⛔ ההכרזה לקורא מסך **נגזרת** — ⛔ ואינה צומת שצריך לשחרר', () => {
    // 🔬 צומת חולף היה משתחרר ב-`onAnimationEnd`, ⇒ תחת תנועה מופחתת המשך
    //    מתאפס ל-0.01ms וההודעה הייתה נעלמת לפני שקורא מסך הגיע אליה.
    const src = withoutComments(readFileSync('components/ArenaBattle.tsx', 'utf8'));
    expect(src).toMatch(/battle\.guardLane === null \? '' : GUARD_ON_HE/);
  });
});

/**
 * 🎭 **⟦19/09 · `C-0738` · `T-439` · סוגר את `F-305`⟧ התנוחה היא **מכה**.**
 *
 * 🔬 **הפגם שנמדד:** `stagePhase` נגזר מה**הטלה האחרונה** ו⛔ **לעולם ⛔ אינו
 * חוזר ל-`idle`** ⇒ הטלה נכונה **אחת** והיריב עמד מוטה ונדחף **עד סוף הקרב**.
 * ⇒ שתי התנוחות היחידות שיש לזירה היו **לבוש**, ⛔ ולא מכות — וזו, ⛔ ולא
 * היעדר אפקטים, הסיבה שהדמויות נראו סטטיות.
 *
 * 🔴 **ו⛔ הליבה ⛔ לא נגעו בה:** `stagePhase` ממשיך לומר «מה הייתה ההטלה
 * האחרונה» — עובדה נכונה. מה שהשתנה הוא שה**מסך** מתייחס אליה כאל **רגע**.
 */
describe('C-0738 · T-439 — התנוחה חוזרת', () => {
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
  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };

  const phase = (): string | null =>
    document.querySelector('[data-arena-stage]')?.getAttribute('data-arena-phase') ?? null;
  const figure = (): Element => document.querySelector('[data-arena-figure="enemy"]') as Element;
  const tap = (node: Element): void => {
    fireEvent.pointerDown(node, { clientX: 10, clientY: 10, pointerId: 3 });
    fireEvent.pointerUp(node, { clientX: 10, clientY: 10, pointerId: 3 });
  };
  /**
   * ⛔ **שני חורים של jsdom, ושניהם נמדדו בטיק הזה — ⛔ ולא שוערו.**
   *
   * ⓐ **⛔ אין `AnimationEvent`**: `typeof AnimationEvent === 'undefined'` ⇒
   * `fireEvent.animationEnd(node, { animationName })` בונה `Event` גנרי שבו
   * `animationName` ⛔ **אינו קיים**, והמאזין ברכיב — שקורא
   * `e.animationName.startsWith(...)` — **זורק** במקום למדוד.
   *
   * 🔴 ⓑ **ובגלל ⓐ, React ⛔ אינו מאזין לשם התקני.** ‏`getVendorPrefixedEventName`
   * בודק `'AnimationEvent' in window`, ומשאין — ממפה את `onAnimationEnd` אל
   * **`webkitAnimationEnd`**. 🔬 נמדד בגישוש ישיר: שיגור `animationend` הפעיל את
   * המאזין **0** פעמים, ושיגור `webkitAnimationEnd` — **1**.
   * ⚠️ **וזו בדיוק המחלקה של בדיקה שנשארת ירוקה על כלום:** טענה **שלילית**
   * ⟨«אנימציה אחרת ⛔ אינה משחררת»⟩ עוברת באופן מושלם גם כשהאירוע ⛔ לעולם ⛔ אינו
   * מגיע לרכיב. ⇒ **שני השמות משוגרים**, ⛔ ולא אחד: זה שאינו מאזין הוא בטל.
   */
  const endAnimation = (animationName: string): void => {
    const area = document.querySelector('[data-arena-stage-area]') as Element;
    for (const type of ['animationend', 'webkitAnimationEnd']) {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, 'animationName', { value: animationName });
      fireEvent(area, event);
    }
  };

  const cardHe = (he: string): Element => {
    const hit = [...document.querySelectorAll('[data-arena-card]')]
      .find((n) => (n.textContent ?? '').includes(he));
    expect(hit).toBeTruthy();
    return hit as Element;
  };

  it('בפתיחה `idle`, אחרי הטלה **מכה** — ואז **חוזרת**', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    expect(phase(), 'בפתיחה').toBe('idle');
    tap(cardHe('אפשרות 1'));
    tap(cardHe('אפשרות 1'));
    await waitFor(() => { expect(phase()).not.toBe('idle'); });
    // 🔴 **וזו הטענה שמאדימה על הקוד הקודם:** המעבר שכבר קיים על הדמות הוא
    //    מה שמשחרר. ⛔ אפס שעון, ⛔ אפס שדה חדש בליבה.
    fireEvent.transitionEnd(figure(), { propertyName: 'transform' });
    await waitFor(() => { expect(phase(), 'התנוחה חוזרת').toBe('idle'); });
  });

  /**
   * 🎭 **⟦20/09 · `C-0748` · `F-306`ⓐ⟧ המסלול השני — ו⛔ הוא ⛔ אינו כפילות.**
   *
   * 🔬 **נמדד בדפדפן חי, ⛔ ולא הוסק:** ברגע ש-`transition: none` של הקיפאון באמת
   * מנצח, `getComputedStyle(figure).transitionDuration` הוא **`0s`**
   * ו-`transitionend` של `transform` ⛔ **אינו נורה כלל**. ⇒ המסלול היחיד שהיה
   * לתנוחה ⛔ לא היה מגיע, ו-`F-305` — «הטלה אחת והיריב עומד מוטה עד סוף הקרב» —
   * היה **נפתח מחדש בדיוק על ידי התיקון**.
   *
   * ⇒ **הפגיעה** משתחררת על שעון הקיפאון; ה**התחמקות**, שבה ⛔ אין קיפאון, ממשיכה
   * להשתחרר על המעבר. ⛔ שני מסלולים לשני מצבים, ⛔ ולא שניים לאותו מצב.
   */
  it('התנוחה חוזרת על שעון הקיפאון, ⛔ בלי ולו `transitionend` אחד', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    tap(cardHe('אפשרות 1'));
    tap(cardHe('אפשרות 1'));
    await waitFor(() => { expect(phase()).not.toBe('idle'); });
    endAnimation('arena-hitstop-a');
    await waitFor(() => { expect(phase(), 'התנוחה חוזרת על השעון').toBe('idle'); });
  });

  /**
   * 🥋 **⟦21/09 · `T-443`⟧ ערוץ ההטלה — **שלוש טענות, וכל אחת מאדימה על משהו אחר.**
   *
   * ⓐ **הערוץ נדלק על הטלה נכונה.** ⓑ 🔴 **ומתהפך `'a'`⇄`'b'` על השנייה** — וזו
   * הטענה שנושאת את כל השורה: שם אנימציה **זהה** ⛔ אינו מפעיל מחדש, ⇒ בלי ההיפוך
   * שתי תשובות נכונות רצופות היו נראות כ**אחת**. ⓒ **והשחרור הוא של עצמו** —
   * ‏`arena-hitstop` (120ms) ⛔ אינו מכבה אותו, אחרת הבעיטה הייתה נחתכת לשמינית.
   */
  it('ערוץ ההטלה נדלק, **מתהפך** על השנייה, ומשתחרר רק על השעון של עצמו', async () => {
    render(<ArenaBattle initialRound={ROUND} />);
    const area = (): Element => document.querySelector('[data-arena-stage-area]') as Element;
    const strike = (): string | null => area().getAttribute('data-arena-strike');
    expect(strike(), 'בפתיחה כבוי').toBeNull();
    tap(cardHe('אפשרות 1'));
    tap(cardHe('אפשרות 1'));
    await waitFor(() => { expect(strike()).not.toBeNull(); });
    const first = strike();
    const from = (): string | null => area().getAttribute('data-arena-strike-from');
    // 🛬 `T-446` — הטלה ראשונה, הגוף על הקרקע ⇒ ⛔ מתחילה מההתחלה.
    expect(from(), 'הטלה ראשונה ⛔ אינה נכנסת מהנחיתה').toBeNull();
    // 🔬 הקיפאון משחרר את התנוחה — ⛔ ולא את ההטלה.
    endAnimation('arena-hitstop-a');
    expect(strike(), '⛔ הקיפאון ⛔ אינו מכבה את ההטלה').toBe(first);
    // 🔴 הטלה שנייה ⇒ **ערך אחר**, אחרת האנימציה ⛔ לא הייתה מופעלת מחדש.
    tap(cardHe('אפשרות 2'));
    tap(cardHe('אפשרות 2'));
    await waitFor(() => { expect(strike(), 'מתהפך').not.toBe(first); });
    // 🛬 `T-446` · `F-312` — השנייה הגיעה באמצע הבעיטה ⇒ נכנסת מ**הנחיתה**, ⛔ ולא מעמידה.
    expect(from(), 'הטלה באמצע הבעיטה נכנסת מהנחיתה').toBe('land');
    endAnimation(`arena-strike-${strike()}`);
    await waitFor(() => { expect(strike(), 'משתחרר על השעון של עצמו').toBeNull(); });
    expect(from(), 'השחרור מכבה גם את מקור הכניסה').toBeNull();
  });

  /**
   * 🥋 `T-443` — ⛔ **והצומת הוא של ההטלה בלבד.** 🔬 `[data-arena-figure]` נושא
   * ‏`animation: arena-impact-*` ו-`[data-arena-idle]` נושא `arena-breath` —
   * ⇒ אנימציה שלישית על אחד מהם הייתה **דורסת**, וזה `F-306` מילה במילה.
   */
  it('להטלה יש צומת נושא משלה, ⛔ ולא הדמות ו⛔ לא צומת המנוחה', () => {
    render(<ArenaBattle initialRound={ROUND} />);
    const rig = document.querySelector('[data-arena-slot="hero"] [data-arena-castrig]');
    expect(rig, 'הצומת קיים').toBeTruthy();
    expect(rig?.querySelector('[data-arena-figure]'), 'הדמות בתוכו').toBeTruthy();
    expect(rig?.hasAttribute('data-arena-idle'), '⛔ ואינו צומת המנוחה').toBe(false);
    // 💨 ואבק הנחיתה גם הוא צומת משלו: `[data-arena-dust]` דולק על `hurt`, ולומד
    //    יכול להיפגע ולהטיל באותו פריים ⇒ אותה תכונה, אותו צומת, והמאוחרת דורסת.
    const slot = document.querySelector('[data-arena-slot="hero"]') as Element;
    const land = slot.querySelector('[data-arena-landdust]');
    expect(land, 'אבק נחיתה קיים').toBeTruthy();
    expect(land?.hasAttribute('data-arena-dust'), '⛔ ואינו אבק הפגיעה').toBe(false);
    expect(slot.querySelector('[data-arena-shadow]'), 'והצל — ההוכחה שהגוף באוויר').toBeTruthy();
  });

  it('⛔ אנימציה אחרת שמבעבעת לאזור הבמה ⛔ אינה מאפסת את התנוחה', async () => {
    // 🔬 אזור הבמה מקבל `animationend` של הרעד, הרתיעה והגלגול. שחרור בלי גדר
    //    השם היה חותך את המכה באמצע על כל אחד מהם.
    render(<ArenaBattle initialRound={ROUND} />);
    tap(cardHe('אפשרות 1'));
    tap(cardHe('אפשרות 1'));
    await waitFor(() => { expect(phase()).not.toBe('idle'); });
    endAnimation('arena-crit-shake');
    expect(phase(), 'עדיין באמצע המכה').not.toBe('idle');
  });

  it('⛔ מעבר של צומת **אחר** ⛔ אינו מאפס את התנוחה באמצע המכה', async () => {
    // 🔬 בתוך אזור הבמה יש עוד מעברים על `transform` — ובראשם `[data-arena-hp-fill]`
    //    של **שני** פסי החיים. בלי גדר הצומת, ריקון של פס חיים היה מבטל את המכה.
    render(<ArenaBattle initialRound={ROUND} />);
    tap(cardHe('אפשרות 1'));
    tap(cardHe('אפשרות 1'));
    await waitFor(() => { expect(phase()).not.toBe('idle'); });
    const fill = document.querySelector('[data-arena-hp-fill]') as Element;
    fireEvent.transitionEnd(fill, { propertyName: 'transform' });
    expect(phase(), 'עדיין באמצע המכה').not.toBe('idle');
  });

  it('⛔ ותכונה **אחרת** של אותה דמות ⛔ אינה משחררת — המעבר מצהיר שתיים', async () => {
    // 🔬 `transition: transform …, rotate …` ⇒ בלי גדר `propertyName` השחרור
    //    היה נורה **פעמיים** על אותה מכה.
    render(<ArenaBattle initialRound={ROUND} />);
    tap(cardHe('אפשרות 1'));
    tap(cardHe('אפשרות 1'));
    await waitFor(() => { expect(phase()).not.toBe('idle'); });
    fireEvent.transitionEnd(figure(), { propertyName: 'rotate' });
    expect(phase()).not.toBe('idle');
  });
});

/**
 * 🔁 **`T-451` · `37 § 8` ק8 — «חזרה מהירה», נמדדת על עץ מורכב.**
 * הראיה שהשורה דורשת: שתי טעויות ⇒ שני קלפי חזרה **אחרי** השעון, ⛔ אפס שעון על המסך,
 * והמטען ל-`/api/arcade/result` **זהה** לריצה בלי החזרה — ⇒ הוא נשלח פעם אחת, ברגע
 * הסיום, ומספר התשובות בו הוא מספר ההטלות בתוך השעון בלבד.
 * ⛔ `requestAnimationFrame` מוזרק: הפריים הראשון קובע את המקור, והבא קופץ מעבר ל-90 שניות.
 */
describe('T-451 — חזרה מהירה אחרי השעון', () => {
  const question = (n: number) => ({
    wordId: `w${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    options: [
      { he: `אפשרות ${n}`, kind: 'met' as const },
      { he: `מסיח ${n}א`, kind: 'met' as const },
      { he: `מסיח ${n}ב`, kind: 'met' as const },
      { he: `מסיח ${n}ג`, kind: 'met' as const },
    ],
    kind: 'base' as const,
  });
  const ROUND = { level: 'A1', questions: [1, 2, 3, 4, 5].map(question) };
  const tap = (node: Element): void => {
    fireEvent.pointerDown(node, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(node, { clientX: 10, clientY: 10, pointerId: 1 });
  };
  const castHe = (he: string): void => {
    const card = Array.from(document.querySelectorAll('[data-arena-card]')).find(
      (node) => (node.textContent ?? '').includes(he),
    );
    expect(card, `קלף «${he}»`).toBeTruthy();
    tap(card as Element);
    tap(card as Element);
  };

  it('שתי טעויות ⇒ שני קלפי חזרה, ⛔ בלי שעון, והמטען ⛔ אינו זז', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    const posts: string[] = [];
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
      posts.push(String(init?.body ?? ''));
      return new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 });
    }));
    const flush = (now: number) => {
      const due = frames.splice(0);
      act(() => due.forEach((cb) => cb(now)));
    };

    render(<ArenaBattle initialRound={ROUND} />);
    flush(0);
    castHe('מסיח 1א');
    castHe('אפשרות 2');
    castHe('מסיח 3א');
    flush(91_000);

    await waitFor(() => expect(document.querySelector('[data-arena-replay]')).not.toBeNull());
    expect(document.querySelector('[data-arena-clock]'), '⛔ אין שעון בחזרה').toBeNull();
    expect(screen.getByText('1 מתוך 2')).toBeTruthy();
    expect(document.querySelectorAll('[data-arena-replay-option]')).toHaveLength(4);
    await waitFor(() => expect(posts).toHaveLength(1));
    const sent = posts[0];
    expect((JSON.parse(sent ?? '') as { answers: unknown[] }).answers).toHaveLength(3);

    // המילה הראשונה בסדר הטעות — w1. תשובה נכונה.
    fireEvent.click(screen.getByRole('button', { name: 'אפשרות 1' }));
    expect(screen.getByRole('status').textContent).toBe('נכון');
    fireEvent.click(screen.getByRole('button', { name: 'הבא' }));
    // w3 — טעות ⇒ התרגום מוצג.
    expect(screen.getByText('2 מתוך 2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'מסיח 3ב' }));
    expect(screen.getByRole('status').textContent).toBe('התרגום: אפשרות 3');
    fireEvent.click(screen.getByRole('button', { name: 'הבא' }));

    await waitFor(() => expect(document.querySelector('[data-arena-replay]')).toBeNull());
    expect(posts, '⛔ החזרה ⛔ אינה שולחת דבר').toHaveLength(1);
    expect(posts[0]).toBe(sent);
  });

  it('`דלג` זמין מהרגע הראשון ומדלג על השלב כולו', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    stubFetch(() => new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 }));
    const flush = (now: number) => {
      const due = frames.splice(0);
      act(() => due.forEach((cb) => cb(now)));
    };
    render(<ArenaBattle initialRound={ROUND} />);
    flush(0);
    castHe('מסיח 1א');
    flush(91_000);
    await waitFor(() => expect(document.querySelector('[data-arena-replay]')).not.toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'דלג' }));
    expect(document.querySelector('[data-arena-replay]')).toBeNull();
  });

  it('⛔ אפס טעויות ⇒ השלב ⛔ אינו מופיע כלל', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', () => {});
    stubFetch(() => new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 }));
    render(<ArenaBattle initialRound={ROUND} />);
    act(() => frames.splice(0).forEach((cb) => cb(0)));
    castHe('אפשרות 1');
    act(() => frames.splice(0).forEach((cb) => cb(91_000)));
    await waitFor(() => expect(document.querySelector('[data-arena-clock]')).toBeNull());
    expect(document.querySelector('[data-arena-replay]')).toBeNull();
  });
});
