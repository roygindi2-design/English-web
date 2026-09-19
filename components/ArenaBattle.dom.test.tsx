// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ArenaBattle, { ARENA_TAUGHT_KEY } from '@/components/ArenaBattle';
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
