// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoryScreenView, type StoryPayload } from '@/components/StoryScreen';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import {
  FIXTURE_BODY_EN,
  FIXTURE_COUNTS,
  FIXTURE_GLOSSES,
  FIXTURE_KNOWN_LEMMAS,
  FIXTURE_QUESTION,
  FIXTURE_STORY_ID,
  FIXTURE_TITLE_EN,
} from '@/app/dev/story/story-fixture';

afterEach(cleanup);

/**
 * ⛔ **הפיקסטורה הזאת ⛔ אינה «כמו» נתוני המוצר — היא הצורה של החוט.** הלקח של 23/08
 * (`DEV.md`): 2,403 בדיקות היו ירוקות כי הפיקסטורה נבדלה מנתוני הייצור בממד אחד.
 *
 * ⚠️ **ו-F-133 הוכיחה שהמשפט הזה ⛔ לא הספיק:** עד 26/08 ישבה כאן שאלה **אמיתית**
 * מ-`story-questions-2026-08-25.jsonl` — אבל שאלתו של סיפור **אחר**, «The letter in
 * the book», מעל גוף שהוא «The library near the river». הבדיקה **קיבעה** את הזיווג
 * השגוי, ולכן 2,676 בדיקות ירוקות ⛔ לא יכלו לתפוס «שאלה בלי תשובה».
 * ⇒ הפיקסטורה כולה מיובאת עכשיו מ-`@/app/dev/story/story-fixture` — **אותו מקור בדיוק**
 * ששני מסכי `/dev/story` מרנדרים — ו-`story-fixture.test.ts` מודד אותו מול
 * `docs/design/render_video_A.py` ומול העיגון של השאלה בגוף. ⛔ אין כאן עותק שני.
 */
const PAYLOAD: StoryPayload = {
  story: { id: FIXTURE_STORY_ID, titleEn: FIXTURE_TITLE_EN, bodyEn: FIXTURE_BODY_EN },
  index: 3,
  total: 12,
  level: 'A1',
  glosses: FIXTURE_GLOSSES,
  knownLemmas: FIXTURE_KNOWN_LEMMAS,
  counts: FIXTURE_COUNTS,
  question: FIXTURE_QUESTION,
};

/** `Object.keys(FIXTURE_GLOSSES).length` · `FIXTURE_KNOWN_LEMMAS.length` — 7 ו-2. */
const GLOSS_COUNT = Object.keys(FIXTURE_GLOSSES).length;
const KNOWN_COUNT = FIXTURE_KNOWN_LEMMAS.length;

describe('T-202 — the question is a STATE, and the chrome survives the swap', () => {
  it('phase `reading` shows ⛔ no question', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.queryByText('שאלת הבנה')).toBeNull();
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
  });

  it('one press on the primary action swaps the BODY and ⛔ keeps the chrome', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByText('שאלת הבנה')).toBeTruthy();
    // ⛔ THE POINT OF THE TEST: the chrome must still be there after the swap.
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
    // ⚠️ **⟦T-207 · `§ 4.2כא` ⓔ⟧ הסריקה הזאת החזיקה את שורת המלאי, והיא ⛔ כבר אינה
    // על המסך.** מה שהטענה כאן באמת בודקת הוא ש**הכרום שורד את ההחלפה**.
    // 🔴 **⟦T-379 ⓒ⟧ והעוגן עובר שוב, ⛔ ומאותה סיבה בדיוק כמו בפעם הקודמת:** המקרא
    // «ידועה» ⛔ כבר אינו אלמנט ששורד את ההחלפה — הוא מפרש קו תחתון **בגוף הסיפור**,
    // וגוף הסיפור ⛔ אינו על המסך בשלב השאלה. ⇒ העוגן הוא שורת המצב, שהיא כרום
    // בשני המצבים, וזה מה שהטענה הזאת תמיד התכוונה למדוד.
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
    expect(document.querySelector('[data-story-summary]')).toBeNull();
  });

  it('⛔ the reading paragraph is gone once the question is up — it is a SWAP, ⛔ not an append', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(container.querySelector('[data-story-body]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(container.querySelector('[data-story-body]')).toBeNull();
  });

  it('T-203 — the primary action names what it does, in each phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByRole('button', { name: 'סיימתי לקרוא' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  it('⛔ leaving without answering is legal — the exit is live in BOTH phases', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    const exit = screen.getByRole('link', { name: 'חזרה לעולם' });
    expect(exit.hasAttribute('aria-disabled')).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('⛔ a story with ⛔ no question has ⛔ no second phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: { ...PAYLOAD, question: null } }} />);
    expect(screen.queryByRole('button', { name: 'סיימתי לקרוא' })).toBeNull();
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  /**
   * 🔢 **T-383 — the leading number is «how many NEW», ⛔ not «how many in total».**
   * On this fixture the render's own sentence is «5 מילים חדשות · 2 שכבר ידעת», and
   * `7 − 2 = 5` is measured here rather than written down, so a fixture that grows a
   * word moves the assertion with it instead of freezing a stale literal.
   */
  it('T-150 · T-383 — the intro layer states what the story came to TEACH him', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(GLOSS_COUNT).toBe(7);
    expect(KNOWN_COUNT).toBe(2);
    expect(
      screen.getByText(`בסיפור הזה ${GLOSS_COUNT - KNOWN_COUNT} מילים חדשות · ${KNOWN_COUNT} שכבר ידעת`),
    ).toBeTruthy();
  });

  /**
   * ⛔ **T-383ⓒ — «0 מילים חדשות» ⛔ is ⛔ never printed.** A learner who already
   * carries every word of the story is in a real state, and it gets a sentence of its
   * own — ⛔ not a counted zero, which reads as a sum he is expected to subtract from.
   */
  it('T-383ⓒ — a learner who carries every word gets a statement, ⛔ not a zero', () => {
    render(
      <StoryScreenView
        state={{
          kind: 'ready',
          payload: { ...PAYLOAD, knownLemmas: Object.keys(FIXTURE_GLOSSES) },
        }}
      />,
    );
    expect(screen.getByText('אין כאן מילה חדשה — כל המילים בסיפור הזה כבר שלך')).toBeTruthy();
    expect(screen.queryByText(/0 מילים חדשות/)).toBeNull();
  });

  /**
   * ⛔ **T-383ⓒ, the other half.** `known === 0` would print «· 0 שכבר ידעת», a half
   * sentence that counts nothing. The new-word half stands alone instead.
   */
  it('T-383ⓒ — a learner who carries nothing gets ⛔ no second half', () => {
    render(
      <StoryScreenView state={{ kind: 'ready', payload: { ...PAYLOAD, knownLemmas: [] } }} />,
    );
    expect(screen.getByText(`בסיפור הזה ${GLOSS_COUNT} מילים חדשות`)).toBeTruthy();
    expect(screen.queryByText(/שכבר ידעת/)).toBeNull();
  });

  it('⛔ the intro layer belongs to the READING phase only', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    expect(screen.queryByText(/מילים חדשות/)).toBeNull();
  });
});

/**
 * T-238ⓑ · `D-183` — **הפופאובר בסיפור מדווח מה שקרה באמת, ⛔ ולא וי מיידי.**
 *
 * ⛔ **עד הטיק הזה, אפס בדיקה הרכיבה את הזרימה הזאת בכלל** (לא `WordPopover`, לא
 * `StoryScreen`'s `add`) — בדיוק כמו שהיה חסר לפני T-239 בזירה (`ArenaBattle.dom.test.tsx`).
 * `components/StoryScreen.tsx:285-296` סימן «נוספה לחזרה» **מיד**, לפני הרשת, ו-
 * `.catch(() => {})` בלע כל כישלון — כתיבה שנכשלה תמיד (`42P10`, מ-T-187ⓕ עד C-0405)
 * הראתה ללומד וי ירוק שקרי בלי שאף בדיקה תפסה זאת.
 *
 * ⚠️ **תשתית הבדיקה כאן, ⛔ ולא רק בדיקה:** `onWordClick` (`StoryScreen.tsx`) מכריע איזו
 * מילה נלחצה על ידי הצלבת קואורדינטות הלחיצה מול `getBoundingClientRect` של כל
 * `[data-story-word]` — וב-jsdom כל אלמנט מחזיר מלבן אפס כברירת מחדל, כך שלחיצה לא
 * מסויעת הייתה פוגעת בכל שבע המילים בבת אחת ופותחת את שבב האי-ודאות ⛔ במקום הפופאובר.
 * `layoutStoryWords` נותן לכל מילה מלבן ייחודי ולא חופף כדי שלחיצה במרכזו תפגע **רק** בה.
 */
interface WordRectMeter {
  /** Rect reads on `[data-story-word]` elements SINCE the last layout event. */
  reads: number;
}

/**
 * 🔴 **T-232ⓑ — העזר הזה מודד עכשיו גם **מתי** נקראים המלבנים, ⛔ ולא רק מה הם.**
 * הרכיב מודד פעם אחת **לפריסה** ושומר במטמון; השינוי של מלבן מצוטט
 * אחרי הרנדור ⛔ אינו אירוע שהדפדפן מדווח עליו ⇒ **העזר יורה `resize`**, שהוא בדיוק הערוץ
 * שהרכיב מצהיר עליו כמפסיל מטמון. ⛔ בלעדיו הבדיקה היתה מודדת את מסלול הנפילה
 * (מטמון קר) ומדווחת ירוק על נתיב שהלומד ⛔ אינו פוגש.
 *
 * ⚠️ תשתית הבדיקה המקורית: ב-jsdom כל אלמנט מחזיר מלבן אפס, כך שלחיצה לא
 * מסויעת הייתה פוגעת בכל שבע המילות בבת אחת ופותחת את שבב האי-ודאות.
 */
function layoutStoryWords(container: HTMLElement): WordRectMeter {
  const meter: WordRectMeter = { reads: 0 };
  const buttons = Array.from(container.querySelectorAll('[data-story-body] [data-story-word]'));
  buttons.forEach((el, i) => {
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () => {
        meter.reads += 1;
        return {
          left: i * 20,
          right: i * 20 + 15,
          top: 0,
          bottom: 20,
          width: 15,
          height: 20,
          x: i * 20,
          y: 0,
          toJSON: () => ({}),
        };
      },
    });
  });
  fireEvent(window, new Event('resize'));
  meter.reads = 0;
  return meter;
}

/**
 * ⚠️ **T-240 — «library» הוא מעכשיו **שני** כפתורים:** אחד בכותרת ואחד בגוף.
 * ⇒ בדיקה שמחפשת לפי שם בלבד ⛔ אינה אומרת על איזה משטח היא מדברת. העזר הזה בוחר
 * את יעד ההקשה שב**פסקת הקריאה**, והוא המשטח שכל הבדיקות שלפני T-240 דיברו עליו.
 */
function bodyWord(text: string): Element {
  const body = document.querySelector('[data-story-body]');
  if (body === null) throw new Error('⛔ [data-story-body] is ⛔ not on the screen');
  const hit = Array.from(body.querySelectorAll('[data-story-word]')).find(
    (el) => (el.textContent ?? '').trim() === text,
  );
  if (hit === undefined) throw new Error(`⛔ ⛔ no body tap target «${text}»`);
  return hit;
}

function clickWord(el: Element): void {
  const rect = el.getBoundingClientRect();
  fireEvent.click(el, {
    clientX: (rect.left + rect.right) / 2,
    clientY: (rect.top + rect.bottom) / 2,
  });
}

function stubFetch(impl: () => Promise<Response> | Response): void {
  vi.stubGlobal('fetch', vi.fn(impl));
}

function openPopoverOnLibrary(): void {
  const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
  layoutStoryWords(container);
  clickWord(bodyWord('library'));
}

describe('T-238ⓑ — הפופאובר בסיפור מדווח מה שקרה באמת (D-183)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('⬜ מצב פתיחה — «הוסף לכרטיסיות» מוצג, ⛔ ולא «נוספה לחזרה»', () => {
    stubFetch(() => Promise.resolve(new Response(JSON.stringify({ ok: true, attempts: 1 }), { status: 200 })));
    openPopoverOnLibrary();
    expect(screen.getByRole('button', { name: 'הוסף לכרטיסיות' })).toBeTruthy();
    expect(screen.queryByText('נוספה לחזרה')).toBeNull();
  });

  it('⛔ pending — לפני שהכתיבה חזרה, «נוספה לחזרה» ⛔ אינו מוצג, והכפתור מנוטרל מפני לחיצה כפולה', async () => {
    let resolveFetch: (v: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    stubFetch(() => pending);
    openPopoverOnLibrary();
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'הוסף לכרטיסיות' }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
    expect(screen.queryByText('נוספה לחזרה')).toBeNull();

    resolveFetch(new Response(JSON.stringify({ ok: true, attempts: 1 }), { status: 200 }));
    expect(await screen.findByText('נוספה לחזרה')).toBeTruthy();
  });

  it('הכתיבה חוזרת ok:false — FAILURE_HE.save + כפתור RETRY_HE, ⛔ לעולם ⛔ לא «נוספה לחזרה»', async () => {
    stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 })),
    );
    openPopoverOnLibrary();
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));

    expect(await screen.findByText(FAILURE_HE.save)).toBeTruthy();
    expect(screen.getByRole('button', { name: RETRY_HE })).toBeTruthy();
    expect(screen.queryByText('נוספה לחזרה')).toBeNull();
  });

  it('כשל רשת (fetch עצמו נכשל) — אותו מסך כשל, ⛔ לא בליעה שקטה', async () => {
    stubFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    openPopoverOnLibrary();
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));

    expect(await screen.findByText(FAILURE_HE.save)).toBeTruthy();
    expect(screen.getByRole('button', { name: RETRY_HE })).toBeTruthy();
  });

  it('⛔ לחיצה על RETRY_HE מריצה מחדש את אותו POST — ⛔ לא מסך שני (D-183 ⓑ2)', async () => {
    let calls = 0;
    stubFetch(() => {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve(new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true, attempts: 1 }), { status: 200 }));
    });
    openPopoverOnLibrary();
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));
    await screen.findByRole('button', { name: RETRY_HE });
    expect(calls).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: RETRY_HE }));
    expect(await screen.findByText('נוספה לחזרה')).toBeTruthy();
    expect(calls).toBe(2);
  });
});

/**
 * 🔴 **T-232 — ההקשה מפסיקה למדוד את כל הפסקה. `apple-design § 1`.**
 *
 * 🔬 **מה שנמדד ב-`C-0371` וסגר את השורה הזאת:** `onWordClick` הריץ
 * `querySelectorAll('[data-story-word]')` ואז `getBoundingClientRect()` על **כל מילה
 * בפסקה**, בכל הקשה — ⛔ ולא רק בהקשה דו-משמעית. ⇒ פריסה כפויה ועוד N קריאות מלבן
 * **בתוך מטפל ההקשה**, על נתיב הקלט עצמו.
 *
 * ⚠️ **ולמה הבדיקה סופרת קריאות ⛔ ולא מודדת זמן:** זמן ב-jsdom הוא רעש; **מספר
 * הקריאות** הוא בדיוק מה שהשורה מחייבת («מלבנים שנקראים פעם אחת לפריסה»), והוא
 * מדיד בלי שעון. ⛔ בדיקה שמודדת «מהר יותר» היא בדיקה שתאדים על מכונה עמוסה.
 */
describe('T-232 — the tap stops measuring the paragraph', () => {
  /**
   * ⚠️ `clickWord` קורא את המלבן של המילה כדי לחשב את נקודת המגע — זו קריאה של
   * **הבדיקה**, ⛔ ולא של המוצר. ⇒ המונה מתאפס **אחרי** חישוב הנקודה
   * ולפני היריית האירוע, כדי שמה שנספר יהיה **מה שהמטפל עצמו עשה**.
   */
  function tapMeasured(el: Element, meter: WordRectMeter): void {
    const rect = el.getBoundingClientRect();
    const point = {
      clientX: (rect.left + rect.right) / 2,
      clientY: (rect.top + rect.bottom) / 2,
    };
    meter.reads = 0;
    fireEvent.click(el, point);
  }

  it('⛔ אפס קריאות מלבן על מילים בתוך ההקשה — המטמון נקרא פעם אחת לפריסה', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const meter = layoutStoryWords(container);
    tapMeasured(bodyWord('library'), meter);
    // ⛔ THE POINT: the popover opened, and ⛔ not one word was measured to do it.
    expect(screen.getByRole('button', { name: 'הוסף לכרטיסיות' })).toBeTruthy();
    expect(meter.reads).toBe(0);
  });

  it('⛔ וגם ההקשה השנייה ⛔ אינה מודדת — המטמון שורד בין הקשות', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const meter = layoutStoryWords(container);
    tapMeasured(bodyWord('library'), meter);
    fireEvent.keyDown(document, { key: 'Escape' });
    tapMeasured(bodyWord('river'), meter);
    expect(meter.reads).toBe(0);
  });

  /**
   * 🔴 **הגדר של השורה: `36 § 3.4` ⛔ אינו זז.** מה שהשתנה הוא **מתי** נמדד, ⛔ ולא
   * **מה** מוכרע — מגע בטווח של שני יעדים עדיין מציג שבב עם **שניהם**, ⛔ ולא מנחש.
   */
  it('`36 § 3.4` — מגע בטווח של שני יעדים מציג את שניהם, ⛔ ולא בוחר אחד', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const words = Array.from(container.querySelectorAll('[data-story-word]'));
    const [first, second] = words;
    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    // ⛔ שני אזורי הקשה חופפים — בדיוק מה שהשוליים השליליים של `36 § 3.3` מייצרים.
    [first, second].forEach((el) => {
      Object.defineProperty(el, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          left: 0,
          right: 30,
          top: 0,
          bottom: 20,
          width: 30,
          height: 20,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      });
    });
    fireEvent(window, new Event('resize'));
    fireEvent.click(first as Element, { clientX: 10, clientY: 10 });
    const chip = container.querySelector('[data-story-ambiguity-chip]');
    expect(chip).toBeTruthy();
    expect(chip?.textContent).toContain((first?.textContent ?? '').trim());
    expect(chip?.textContent).toContain((second?.textContent ?? '').trim());
  });
});

/**
 * 🔴 **T-240 — הכותרת נשארת אנגלית, ומילותיה נעשות יעדי הקשה.**
 *
 * ⛔ **הכרעת רוי 31/08, וההפך ממנה ⛔ אינו אפשרות:** ⛔ אין עמודת כותרת עברית ו⛔ אין
 * מיגרציה שלישית — המסך מציג `title_en` כפי שהוא, ועובר בו באותו מסלול פילוח
 * (`buildStorySegments`) שבו עובר הגוף.
 *
 * ⚠️ **והגדר, והוא צר במכוון:** יעד בכותרת ⛔ **אינו** נהנה מחריג ה-inline של `36 § 3` —
 * כותרת ⛔ אינה «פסקת קריאה רציפה» ⇒ **44×44 מלאים** (‏א4). ⛔ בדיקת המחלקה כאן ⛔ אינה
 * מחליפה את `check:mobile`, שמודד פיקסלים בדפדפן אמיתי; היא מחזיקה את ה**כוונה**
 * במקום שבו עריכה עתידית תמחק אותה בשקט.
 */
describe('T-240 — the story title is tappable, and stays English', () => {
  function titleWords(container: HTMLElement): Element[] {
    return Array.from(container.querySelectorAll('[data-story-title-word]'));
  }

  it('the words with a gloss are targets, and ⛔ the function words are ⛔ not', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const words = titleWords(container).map((el) => (el.textContent ?? '').trim());
    // 'The library near the river' ⇒ `library` · `river` carry a gloss; ⛔ `The` · `near` · `the` do ⛔ not.
    expect(words).toEqual(['library', 'river']);
  });

  it('the title still renders every glyph — ⛔ nothing is dropped by the segmentation', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const title = container.querySelector('[data-story-title]');
    expect((title?.textContent ?? '').trim()).toBe(FIXTURE_TITLE_EN);
  });

  it('`א4` — a title target carries the full 44×44 floor, ⛔ not the inline exemption', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    for (const el of titleWords(container)) {
      expect(el.className).toContain('min-h-[44px]');
      expect(el.className).toContain('min-w-[44px]');
      // ⛔ ⛔ no negative margin may claw the area back — that is the body's trick,
      // and it is exactly what `36 § 3` exempts and a title ⛔ may not.
      expect(el.className).not.toContain('-my-');
      expect(el.className).not.toContain('-mx-');
    }
  });

  /**
   * 🔴 **החלונית נפתחת **בתוך הכותרת**, ⛔ ולא בכרטיס הגוף.** `T-290` עיגן את החלונית
   * יחסית למכולה ⇒ חלונית של כותרת שמצוירת בכרטיס הגוף נפתחת מתחת למסך שהלומד
   * הסתכל בו. ⛔ זו ⛔ אינה העדפה — זו אותה סיבה בדיוק ש-`T-290` נכתבה בשבילה.
   */
  it('a tap on a title word opens the popover INSIDE the title, ⛔ not in the body card', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const [first] = titleWords(container);
    expect(first).toBeTruthy();
    fireEvent.click(first as Element, { clientX: 10, clientY: 10 });
    expect(screen.getByText('סִפְרִיָּה')).toBeTruthy();
    const popover = container.querySelector('[data-word-popover]');
    expect(popover).toBeTruthy();
    // ⛔ החלונית יושבת במכולה שגם הכותרת יושבת בה — זה מה ש-`T-290` מעגן מולו.
    expect(popover?.parentElement?.querySelector('[data-story-title]')).toBeTruthy();
    // ⛔ THE POINT: ⛔ not inside the reading card.
    expect(container.querySelector('[data-story-body] [data-word-popover]')).toBeNull();
  });

  /**
   * ⛔ **`36 § 7` ⛔ לא זז: מילה חדשה ⛔ אינה מסומנת מראש — גם ⛔ לא בכותרת.** בפיקסטורה
   * `river` ידועה ו-`library` ⛔ אינה ⇒ בדיוק אחת מהשתיים נושאת סימון.
   */
  /**
   * 🔴 **`D-228`ⓐ הוא שער, ⛔ ולא טעם — ולכן הוא גובר.** שבבי 44px מגביהים את הכותרת,
   * ו-`check:mobile` מדד שהפעולה הראשית של `/dev/story/done` מתחילה ב-`top = 764`
   * מול תקרת ≤736 בחלון 780 ⇒ **הלומד ⛔ אינו רואה אותה**. ⇒ יעדי ההקשה שייכים למצב
   * הקריאה, בדיוק כמו שכבת הפתיחה — ובמצב השאלה גוף הסיפור עצמו ⛔ אינו על המסך,
   * ⇒ «כמו בגוף הסיפור» ⛔ אין לו שם מה להיות.
   */
  it('`D-228`ⓐ — במצב השאלה הכותרת היא טקסט, ⛔ ואין בה ולו יעד הקשה אחד', () => {
    const { container } = render(
      <StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />,
    );
    expect(titleWords(container)).toEqual([]);
    // ⛔ ⛔ and the title itself is still there, still English, still unchanged.
    expect(container.querySelector('h1')?.textContent?.trim()).toBe(FIXTURE_TITLE_EN);
  });

  it('`36 § 7` — ⛔ a NEW word carries ⛔ no marking in the title either', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const marked = titleWords(container).filter((el) => el.className.includes('decoration-success'));
    expect(marked.map((el) => (el.textContent ?? '').trim())).toEqual(['river']);
  });
});

/**
 * 🔴 **T-375ⓐ — הכותרת האנגלית קוראת שמאלה, והשורות העבריות סביבה ⛔ לא זזות.**
 *
 * 🔬 **הפער נמדד ב-375px אחרי שנחתה `T-240`, ⛔ ולא הוסק מקוד:** `T-240` קבעה
 * שהכותרת **נשארת אנגלית** — אבל `render_video_A.py:989` מצייר שם כותרת **עברית**
 * ב-`anchor="rm"`, כלומר היישור לימין שנלקח מהרנדר נכון ⛔ רק לעברית. ⇒ הכותרת
 * האנגלית ירשה `text-right` מה-`<header>` ונשברה כששתי שורותיה צמודות לימין —
 * **בדיוק הפגם ש-`T-374` תיקנה בגוף הסיפור**, שורה אחת מתחתיה.
 *
 * ⚠️ **ותרחיש הכשל שהשורה נקבה בו מראש הוא שהיישור ייכתב על ה-`<header>`:** הוא
 * מחזיק גם את הקיקר וגם את שורת ההסבר, **ושתיהן עברית** ⇒ הן היו קופצות שמאלה.
 * ⇒ שתי הטענות כאן, ⛔ ולא אחת: ה-`<h1>` זז, ⛔ והאחרות ⛔ לא.
 */
describe('T-375ⓐ — the English title reads left, and the Hebrew around it does not move', () => {
  it('the `<h1>` carries `text-left`, exactly like the reading paragraph', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.className).toContain('text-left');
  });

  it('⛔ the `<header>` itself stays right — the kicker and the subtitle are HEBREW', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const header = container.querySelector('h1')?.closest('header');
    expect(header).not.toBeNull();
    expect(header?.className).toContain('text-right');
    expect(header?.className).not.toContain('text-left');
    // ⛔ THE FAILURE SCENARIO THE ROW NAMED: neither Hebrew line may carry the flip.
    const hebrewLines = Array.from(header?.querySelectorAll('p') ?? []);
    expect(hebrewLines.map((p) => (p.textContent ?? '').trim())).toEqual([
      'העולם · סיפורים',
      'סיפור ברמה שלך · הקש על מילה לתרגום',
    ]);
    for (const p of hebrewLines) expect(p.className).not.toContain('text-left');
  });

  it('the title reads left in the QUESTION phase too — it is the same header', () => {
    const { container } = render(
      <StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />,
    );
    expect(container.querySelector('h1')?.className).toContain('text-left');
  });
});

/**
 * 🩺 **T-207 — שורת הסיכום מדווחת מה הלומד עשה, ⛔ ולא מה הסיפור מכיל.**
 * *(התוכנית היא `40-decisions § 4.2כא`, שנכתבה במלואה ב-`C-0412`.)*
 *
 * 🔬 **הפער שנמדד:** שני המספרים שהשורה הציגה נגזרים ב-`GET /api/world/story`
 * **לפני ההקשה הראשונה** (‏`app/api/world/story/route.ts:133-149`) ⇒ הם זהים לשני
 * לומדים שאחד מהם הוסיף עשר מילים והשני ⛔ אף לא אחת. ⇒ **מ-0 מספרים במסך שמגיבים
 * ללומד — ל-1** (`D-120`).
 *
 * ⚠️ **המשבצת ⛔ אינה זזה** (`§ 4.2כא` ⓐ): המיקום, הגודל, המשקל והצבע נשארים כפי
 * שהרנדר מצייר אותם, והמקרא «ידועה» שלצדה ⛔ אינו מושפע. `36 § 14.4` כובל **פריסה
 * וגימור**, ⛔ ואינו מפרט את תוכן המשפט הזה.
 */
describe('T-207 — the summary line reports an ACTION, ⛔ not an inventory', () => {
  afterEach(() => vi.unstubAllGlobals());

  const summary = (container: HTMLElement): string | null =>
    container.querySelector('[data-story-summary]')?.textContent?.trim() ?? null;

  it('⛔ N=0 ⇒ ⛔ no line at all — ⛔ not «0 מילים» and ⛔ not «עדיין לא הוספת»', () => {
    // ⛔ בדיוק הכלל ש-`§ 4.2יג-ב ⓒ` כבר אוכף ב-`StoryEndScreen`: משפט שאין בו מה
    // לומר ⛔ אינו משפט, ו⛔ אפס ⛔ אינו נזיפה (`§ 4.2כא` ⓒ).
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(summary(container)).toBeNull();
    // ⛔ ⛔ AND THE ROW ITSELF SURVIVES: the «ידועה» legend is ⛔ not what went away.
    expect(screen.getByText('ידועה')).toBeTruthy();
  });

  /**
   * 🔴 **⟦הוצר 16/09 · `C-0644` · `T-383`⟧ הטענה היא על **המשבצת**, ⛔ ולא על המסך.**
   * עד הטיק הזה הבדיקה קראה את `container.textContent` כולו, כלומר אסרה את המחרוזת
   * **בכל מקום בעמוד** — ו⛔ זה ⛔ מעולם ⛔ לא היה מה ש-`T-207` הכריעה. `§ 4.2כא` ⓐ
   * נוקב במפורש ב**משבצת התחתונה**: היא מדווחת **פעולה של הלומד** (`addedCount`),
   * כי שני מספרי המלאי נגזרים ב-`GET` לפני ההקשה הראשונה ⇒ הם זהים לשני לומדים
   * שאחד מהם הוסיף עשר מילים והשני אף לא אחת. **שורת הפתיחה היא שורה אחרת**, היא
   * מתארת מה **עומד** להיקרא, ו-`T-383` שמה בה בדיוק את הפיצול שהרנדר מצייר.
   * ⇒ ⛔ הכוונה של `T-207` ⛔ לא זזה כאן במילימטר; מה שהצטמצם הוא **תחום** הסריקה,
   * שהיה רחב ממנה ⇒ היה אוסר על הרנדר עצמו להתממש.
   */
  it('⛔ the inventory sentence is gone from the SUMMARY SLOT (`§ 4.2כא` ⓐ)', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(
      summary(container)?.includes(
        `${FIXTURE_COUNTS.newWords} מילים חדשות · ${FIXTURE_COUNTS.alreadyKnown} שכבר ידעת`,
      ) ?? false,
    ).toBe(false);
  });

  it('one added word ⇒ «הוספת מילה אחת מהסיפור הזה»', async () => {
    // ⚠️ «‏1 מילים» ⛔ אינו עברית. ⛔ ומספר שנראה נכון באנגלית ⛔ אינו תירוץ.
    stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true, attempts: 1 }), { status: 200 })),
    );
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    layoutStoryWords(container);
    clickWord(bodyWord('library'));
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));
    await screen.findByText('נוספה לחזרה');
    expect(summary(container)).toBe('הוספת מילה אחת מהסיפור הזה');
  });

  it('two added words ⇒ the number MOVES — that is the whole claim', async () => {
    stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true, attempts: 1 }), { status: 200 })),
    );
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    layoutStoryWords(container);
    clickWord(bodyWord('library'));
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));
    await screen.findByText('נוספה לחזרה');
    clickWord(bodyWord('quiet'));
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));
    await waitFor(() => expect(summary(container)).toBe('הוספת 2 מילים מהסיפור הזה'));
  });

  it('⛔ a FAILED write ⛔ does not count — the line reports what landed', async () => {
    // 🔴 `D-183`: the popover ⛔ never claims a write that did ⛔ not happen, and this
    // line is the same claim one element over.
    stubFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 503 })),
    );
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    layoutStoryWords(container);
    clickWord(bodyWord('library'));
    fireEvent.click(screen.getByRole('button', { name: 'הוסף לכרטיסיות' }));
    await screen.findByText(FAILURE_HE.save);
    expect(summary(container)).toBeNull();
  });
});

/**
 * 🔴 **T-378 ⓐⓒⓘ — מה שקושר את החלונית למילה שהוקשה.**
 *
 * 🔬 **המדידה שפתחה את השורה, ב-`next start` 375×780:** הקשה תוכניתית על מילת יעד
 * החזירה `getAttribute('class')` **זהה** לפני ההקשה ואחריה, ו-`aria-expanded` החזיר
 * **`null`** ⇒ ⛔ אף סימן, ⛔ לא ויזואלי ו⛔ לא לקורא-מסך, ⛔ לא אמר על איזו מילה
 * החלונית מדברת. ⇒ **מ-0 סימנים ל-2**, והם נמדדים כאן אחד-אחד.
 *
 * ✔ מוכיח: `aria-expanded` קיים על **כל** מילת יעד, ומתהפך על זו שהוקשה בלבד.
 * ✔ מוכיח: שבב המצב נוסף למילה שהוקשה, ו⛔ אינו משנה ולו מטר אחד של הפסקה.
 * ✘ ⛔ אינו מוכיח: את הפיקסל. זו ההליכה החיה, והיא בשורת המסירה.
 */
describe('T-378 — הקשה על מילה אומרת **על איזו מילה**', () => {
  afterEach(() => vi.unstubAllGlobals());

  /** יעד הקשה סגור — `36 § 3.2/3.3` ו⛔ שום דבר מעבר. */
  const BASE_WORD_CLASSES = ['inline', 'cursor-pointer', 'px-2', 'py-2', '-mx-2', '-my-2'];

  it('ⓒⓘ `aria-expanded` יושב על כל מילת יעד — ⛔ ולא `null`', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    const words = Array.from(container.querySelectorAll('[data-story-body] [data-story-word]'));
    expect(words.length).toBeGreaterThan(0);
    for (const w of words) expect(w.getAttribute('aria-expanded')).toBe('false');
  });

  it('🔴 ⓒⓘ ההקשה מהפכת אותו על המילה שהוקשה, ⛔ ורק עליה', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    layoutStoryWords(container);
    const target = bodyWord('library');
    clickWord(target);
    expect(target.getAttribute('aria-expanded')).toBe('true');
    const others = Array.from(
      container.querySelectorAll('[data-story-body] [data-story-word]'),
    ).filter((el) => el !== target);
    for (const w of others) expect(w.getAttribute('aria-expanded')).toBe('false');
  });

  it('🔴 ⓒⓘ והמחלקה ⛔ כבר אינה זהה לפני ההקשה ואחריה — זו המדידה עצמה', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    layoutStoryWords(container);
    const target = bodyWord('library');
    const before = target.getAttribute('class');
    clickWord(target);
    expect(target.getAttribute('class')).not.toBe(before);
    expect(target.getAttribute('class')).toContain('bg-brand-surface');
  });

  it('⛔ והשבב ⛔ אינו מזיז את הפסקה — ⛔ אפס שינוי מטרי (‏`T-290`)', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    layoutStoryWords(container);
    const target = bodyWord('library');
    clickWord(target);
    const open = (target.getAttribute('class') ?? '').split(/\s+/).filter((c) => c !== '');
    // ⛔ **הנמדד הוא מה שהמצב **מוסיף**, ⛔ ולא מחרוזת המחלקות כולה:** `px-2 py-2 -mx-2
    // -my-2` הן `36 § 3.2/3.3` והן שם בשני המצבים ⇒ סריקה על המחרוזת השלמה הייתה
    // מודדת את אזור ההקשה, ⛔ ולא את השבב.
    const added = open.filter((c) => !BASE_WORD_CLASSES.includes(c));
    expect(added.length).toBeGreaterThan(0);
    // ⛔ רקע · צבע · רדיוס בלבד. ⛔ אף מחלקה שמשנה משקל, מרווח, שוליים או גודל גופן.
    for (const c of added) {
      expect(c).toMatch(/^(rounded-|bg-|text-brand-on$)/);
    }
  });

  it('ⓒⓘⓘ והחלונית נושאת זנב שמצביע על המילה', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    layoutStoryWords(container);
    clickWord(bodyWord('library'));
    const tail = container.querySelector('[data-word-popover] [data-word-popover-tail]');
    expect(tail).not.toBeNull();
  });
});


/**
 * 🔴 **T-379 — ⛔ אין אלמנט דקורטיבי בין שתי פעולות.**
 *
 * 🔬 **נמדד חי על `/dev/story/done` ב-375×780 (`next start`), ⛔ ולא שוער.** הסדר
 * היה: שורת «עברת על N» ⇒ הפעולה המשנית «לתרגל אותן בכרטיסיות» ⇒ **המקרא «ידועה»**
 * ⇒ הפעולה הראשית «חזרה לעולם». ⇒ קו ירוק ומילה תלויים **בין שני כפתורים**, ⛔ בלי
 * ולו מילה מסומנת אחת על המסך שאליה הם מתייחסים.
 *
 * ✔ מוכיח: המקרא חי בשלב הקריאה ו⛔ אינו קיים בשלב השאלה.
 * ✔ מוכיח: ⛔ אין ולו אלמנט אחד בין שתי הפעולות בסוף הסיפור.
 * ✔ מוכיח: היציאה ⛔ **לא נמחקה** — `36 § 7` נוקב בה.
 * ✘ ⛔ אינו מוכיח: את הפיקסל. זו ההליכה החיה, והיא בשורת המסירה.
 */
/**
 * ⏳ **T-382 — מה שנצבע בשלוש השניות של ההתנעה הקרה.**
 *
 * 🔬 **הנמדד:** `F-255` — `TTFB 3,745ms` קר מול `305ms` חם בייצור (14/09, `Kernel`,
 * 375×780). ⇒ מצב ה-`loading` של המסך הזה ⛔ אינו הבזק, הוא **המסך** לשלוש שניות.
 * ⛔ **וזו ⛔ אינה בדיקת מחלקות:** מה שנמדד כאן הוא שהצורות שנצבעות הן הצורות שנוחתות
 * — הכרטיס, מספר השורות, גובה המגע של הפעולה — כי שלד שצורתו אחרת הוא קפיצת פריסה
 * בכל פתיחה, וזה גרוע מהמשפט האפור שהיה כאן.
 */
describe('T-382 — שלד בצורת מסך הסיפור, ⛔ ולא משפט אפור', () => {
  const loading = () => render(<StoryScreenView state={{ kind: 'loading' }} />);

  it('ⓐ הסדר האמיתי של `StoryReady`: שורת מצב · שורת פתיחה · כרטיס גוף · מקרא · פעולה', () => {
    const { container } = loading();
    const skeleton = container.querySelector('[data-story-skeleton]');
    expect(skeleton).toBeTruthy();
    // ⛔ חמישה בלוקים, ⛔ ולא «משהו מלבני»: זה הסדר האנכי שהמסך האמיתי נוחת בו.
    expect(skeleton?.children.length).toBe(6); // sr-only + חמשת הבלוקים
    const card = skeleton?.querySelector('.rounded-2xl.border');
    expect(card).toBeTruthy();
    // 5–7 שורות בכרטיס הגוף — ⛔ לא שורה אחת ו⛔ לא פסקה מלאה.
    const lines = card?.querySelectorAll('span').length ?? 0;
    expect(lines).toBeGreaterThanOrEqual(5);
    expect(lines).toBeLessThanOrEqual(7);
  });

  it('ⓑ ⛔ אפס ספינר ו⛔ אפס תנועה — `prefers-reduced-motion` מכובד בבנייה', () => {
    const { container } = loading();
    const html = container.innerHTML;
    expect(html).not.toMatch(/animate-|animation|transition-|spin/);
  });

  it('ⓒ קורא מסך מקבל מילה, ⛔ ולא שבעה מלבנים ריקים', () => {
    const { container } = loading();
    const skeleton = container.querySelector('[data-story-skeleton]') as HTMLElement;
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
    expect(skeleton.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('טוען את הסיפור שלך…').className).toContain('sr-only');
    // ⛔ כל צורה שאינה המשפט מוסתרת מעץ הנגישות.
    for (const child of Array.from(skeleton.children).slice(1)) {
      expect(child.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('⛔ הפעולה הראשית בשלד נושאת את אותו גובה מגע ורדיוס של האמיתית', () => {
    const { container } = loading();
    const action = (container.querySelector('[data-story-skeleton]') as HTMLElement).lastElementChild;
    expect(action?.className).toContain('min-h-touch');
    expect(action?.className).toContain('rounded-2xl');
    expect(action?.className).toContain('w-full');
  });

  it('ⓐ הכותרת מקבלת שלד משלה — ⛔ ופעם אחת, ב-`StoryHeader` שכבר מעל כל מצב', () => {
    const { container } = loading();
    expect(container.querySelectorAll('header').length).toBe(1);
    expect(container.querySelectorAll('[data-story-skeleton] header').length).toBe(0);
    expect(container.querySelector('header h1 span[aria-hidden]')).toBeTruthy();
  });

  it('⛔ ובמצב כשל ⛔ אין שלד כותרת — ⛔ אין כותרת שעומדת להגיע', () => {
    const { container } = render(
      <StoryScreenView state={{ kind: 'no_level' }} />,
    );
    expect(container.querySelector('[data-story-skeleton]')).toBeNull();
    expect(container.querySelector('header h1 span[aria-hidden]')).toBeNull();
  });
});

/**
 * 🔙 **T-381 — הלומד שטעה יכול לחזור לפסקה שבה התשובה כתובה, ולחזור לשאלה.**
 *
 * 🔬 **מה שנמדד לפני הטיק הזה:** `grep -n 'setPhase' components/StoryScreen.tsx` החזיר
 * קריאה **אחת** — `setPhase('question')` — ו⛔ אף אחת שמחזירה ל-`reading`. ⇒ לומד
 * שבחר תשובה שגויה ראה «לא זו» באדום, ראה איזו נכונה, ו⛔ ⛔ לא יכול היה לראות
 * **מדוע**: הטקסט שממנו נגזרת התשובה כבר ⛔ לא היה על המסך.
 *
 * ⛔ **וזה ⛔ אינו «נסה שוב» (`§ 4.2יג` סעיף 3).** ⛔ אין עונש, ⛔ אין מונה, והבחירה
 * ⛔ אינה נפתחת מחדש — אחרת המסך היה מלמד שאפשר לנחש עד שמצליחים, שהוא בדיוק הכשל
 * שנמדד בזירה ב-23/08.
 */
describe('T-381 — חזרה לגוף הסיפור, ⛔ ובלי לאבד את הבחירה', () => {
  const inQuestion = () =>
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);

  it('ⓐ בפאזת השאלה יש פעולה משנית שמחזירה לגוף הסיפור', () => {
    const { container } = inQuestion();
    expect(container.querySelector('[data-story-body]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לסיפור' }));
    expect(container.querySelector('[data-story-body]')).toBeTruthy();
    expect(screen.queryByText('שאלת הבנה')).toBeNull();
  });

  it('🔴 ⓐ ⛔ הבחירה ⛔ אינה מתאפסת בחזרה-והלוך — ⛔ ואי אפשר לנחש שוב', () => {
    inQuestion();
    // ⛔ תשובה שגויה במכוון: `correctIndex` הוא 0, והלומד בוחר את השנייה.
    fireEvent.click(screen.getByRole('button', { name: /מַפָּה יְשָׁנָה/ }));
    expect(screen.getByText('לא זו')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'חזרה לסיפור' }));
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לשאלה' }));

    // ⛔ המשוב חזר כפי שהיה, ⛔ ולא מסך שלוש-תשובות-פנויות.
    expect(screen.getByText('לא זו')).toBeTruthy();
    expect(screen.getByText('נכונה')).toBeTruthy();
    for (const answer of FIXTURE_QUESTION.answersHe) {
      expect(
        (screen.getByRole('button', { name: new RegExp(answer) }) as HTMLButtonElement).disabled,
      ).toBe(true);
    }
  });

  it('ⓑ אחרי חזרה, הפעולה הראשית אומרת «חזרה לשאלה» — ⛔ ולא «סיימתי לקרוא»', () => {
    inQuestion();
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לסיפור' }));
    expect(screen.getByRole('button', { name: 'חזרה לשאלה' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'סיימתי לקרוא' })).toBeNull();
  });

  it('ⓑ ⛔ ובקריאה ראשונה היא ⛔ עדיין «סיימתי לקרוא»', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByRole('button', { name: 'סיימתי לקרוא' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'חזרה לשאלה' })).toBeNull();
  });

  it('ⓒ החזרה ⛔ אינה עונש: הלומד יכול לחזור עוד לפני שבחר', () => {
    const { container } = inQuestion();
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לסיפור' }));
    expect(container.querySelector('[data-story-body]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לשאלה' }));
    // ⛔ שלוש תשובות פנויות — כי ⛔ עוד לא בחר, ⛔ ולא כי האיפוס החזיר אותן.
    for (const answer of FIXTURE_QUESTION.answersHe) {
      expect(
        (screen.getByRole('button', { name: new RegExp(answer) }) as HTMLButtonElement).disabled,
      ).toBe(false);
    }
    expect(screen.queryByText('לא זו')).toBeNull();
  });

  it('ⓒ ⛔ אפס מונה ו⛔ אפס ציון על המסך אחרי חזרה', () => {
    const { container } = inQuestion();
    fireEvent.click(screen.getByRole('button', { name: /מַפָּה יְשָׁנָה/ }));
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לסיפור' }));
    fireEvent.click(screen.getByRole('button', { name: 'חזרה לשאלה' }));
    expect(container.textContent).not.toMatch(/ניסיון|נקוד|ציון|פעם שנייה/);
  });
});

describe('T-379 — המקרא מופיע ⛔ רק כשיש מה למקרא', () => {
  it('ⓒ חי בשלב הקריאה — שם יש קו ירוק בגוף הסיפור', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByText('ידועה')).toBeTruthy();
  });

  it('🔴 ⓑⓒ ו⛔ אינו קיים בשלב השאלה — גוף הסיפור ⛔ אינו על המסך', () => {
    const { container } = render(
      <StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />,
    );
    expect(container.querySelector('[data-story-body]')).toBeNull();
    expect(screen.queryByText('ידועה')).toBeNull();
  });

  /**
   * ⚠️ **⟦הותאם 16/09 · `C-0644` · `T-381`⟧ הנמדד הוא **שורת המשניות**, ⛔ ולא הקישור.**
   * הטענה של `T-379` ⓑ היא ש⛔ אין אלמנט **תלוי** בין המשני לראשי — המקרא שישב שם.
   * מאז `T-381` יש **שתי** פעולות משניות שחולקות שורה אחת (חזרה לסיפור · לתרגל), ⇒
   * האח של היציאה הוא השורה, ⛔ ולא אחד משני הפקדים שבתוכה. ⛔ הכוונה ⛔ לא זזה:
   * ⛔ אפס אלמנטים בין השורה הזאת ליציאה.
   */
  it('🔴 ⓑ ⛔ אפס אלמנטים בין שורת הפעולות המשניות לפעולה הראשית', () => {
    const { container } = render(
      <StoryScreenView
        state={{ kind: 'ready', payload: { ...PAYLOAD, counts: { ...PAYLOAD.counts, alreadyKnown: 2 } } }}
        initialPhase="question"
      />,
    );
    const row = container.querySelector('[data-story-secondary]');
    const exit = screen.getByRole('link', { name: 'חזרה לעולם' });
    expect(row).toBeTruthy();
    expect(row?.parentElement).toBe(exit.parentElement);
    const siblings = Array.from(exit.parentElement?.children ?? []);
    expect(siblings.indexOf(exit) - siblings.indexOf(row as Element)).toBe(1);
  });

  it('⛔ ⓓ והיציאה ⛔ לא נמחקה — `36 § 7` נוקב בה', () => {
    render(
      <StoryScreenView
        state={{ kind: 'ready', payload: { ...PAYLOAD, counts: { ...PAYLOAD.counts, alreadyKnown: 2 } } }}
        initialPhase="question"
      />,
    );
    expect(screen.getByRole('link', { name: 'לתרגל אותן בכרטיסיות' })).toBeTruthy();
  });

  it('🔴 ⓓ והמדרג ⛔ כבר אינו צבע: הפעולות המשניות ⛔ אינן נמתחות, וטקסטן קטן', () => {
    const { container } = render(
      <StoryScreenView
        state={{ kind: 'ready', payload: { ...PAYLOAD, counts: { ...PAYLOAD.counts, alreadyKnown: 2 } } }}
        initialPhase="question"
      />,
    );
    const row = container.querySelector('[data-story-secondary]') as HTMLElement;
    const practice = screen.getByRole('link', { name: 'לתרגל אותן בכרטיסיות' });
    const back = screen.getByRole('button', { name: 'חזרה לסיפור' });
    const exit = screen.getByRole('link', { name: 'חזרה לעולם' });
    // ⛔ ה-`self-start` עבר לשורה, כי הוא מבטל את `align-items: stretch` של העמודה
    // ⇒ מה ש⛔ אינו נמתח הוא מה שיושב **בה**.
    expect(row.className).toContain('self-start');
    expect(exit.className).toContain('w-full');
    expect(exit.className).toContain('text-lg');
    for (const secondary of [practice, back]) {
      expect(secondary.className).toContain('text-sm');
      // ⛔ ⛔ ו-44px הוא שער קפוא — הוא ⛔ לא זז.
      expect(secondary.className).toContain('min-h-touch');
      expect(secondary.className).not.toContain('w-full');
    }
  });
});
