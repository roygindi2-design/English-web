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
    // על המסך.** מה שהטענה כאן באמת בודקת הוא ש**הכרום שורד את ההחלפה**, ⇒ היא עוברת
    // למקרא «ידועה» — האלמנט שבאמת נשאר בשני המצבים — ומוסיפה את הצד השני של `ⓒ`:
    // ⛔ אפס מילים שנוספו ⇒ ⛔ אין שורת סיכום, ⛔ גם ⛔ לא אחרי ההחלפה.
    expect(screen.getByText('ידועה')).toBeTruthy();
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

  it('T-150 — the intro layer states what the learner ALREADY has', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(GLOSS_COUNT).toBe(7);
    expect(KNOWN_COUNT).toBe(2);
    expect(
      screen.getByText(`בסיפור הזה ${GLOSS_COUNT} מילים. ${KNOWN_COUNT} מהן אתה כבר מכיר.`),
    ).toBeTruthy();
  });

  it('⛔ the intro layer belongs to the READING phase only', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    expect(screen.queryByText(new RegExp(`בסיפור הזה ${GLOSS_COUNT} מילים\\.`))).toBeNull();
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

  it('⛔ the inventory sentence is gone from the screen entirely', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(
      container.textContent?.includes(
        `${FIXTURE_COUNTS.newWords} מילים חדשות · ${FIXTURE_COUNTS.alreadyKnown} שכבר ידעת`,
      ),
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
