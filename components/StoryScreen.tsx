'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import EnWord from '@/components/EnWord';
import StoryEndScreen from '@/components/StoryEndScreen';
import WordPopover, {
  type WordAnchor,
  type WordPopoverStatus,
} from '@/components/WordPopover';
import { apiGet, apiPost } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE, SCHEMA_MISSING_HE } from '@/lib/core/failure';
import { SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';
import { storyIntro } from '@/lib/core/storyIntro';
import type { StoryQuestion } from '@/lib/core/storyQuestion';
import { buildStorySegments, type StoryGloss } from '@/lib/core/storyTapTargets';
import { LEVEL_SCAN_HREF } from '@/lib/core/worldApps';

/**
 * `/world/story` — מסך הקריאה (T-186 · `36 § 7` · D-108).
 *
 * 🎯 **הרנדר: `docs/design/kol-A-05-story.png`**, וערכיו נלקחו מ-`docs/design/render_video_A.py`
 * (`screen_story`, שורות 964–1010) ⛔ ולא מהעין: הכותרת המשנית, שבב הרמה, «סיפור 3 מתוך 12»,
 * כרטיס הגוף על `RAISED` עם מסגרת `BORDER_SUB` ורדיוס 22 → `rounded-2xl`, מקרא «ידועה»,
 * שורת הסיכום, והפעולה הראשית ברוחב מלא על `BRAND_SURFACE` ברדיוס 16 → `rounded-2xl`.
 * ⚠️ **התווית שהרנדר מדפיס שם ⛔ אינה מה שנבנה (D-115 § 4):** הרנדר מדפיס תווית שמבטיחה
 * מעבר לפריט הבא ברצף, ו-`36 § 1` נותן ל-36 את הניצחון בכל סתירה. הפער מוצהר ⛔ ואינו שקט.
 * `36 § 14.4` (שוכתב 24/08): **הרנדר מחייב — פריסה וגימור כאחד**, וההחרגה היחידה היא
 * **חוקה שכבה A**.
 *
 * ⚠️ **פער מדוד מול הרנדר, ומוצהר ⛔ ולא שקט:** ‏`ST_LINE = 32` ברנדר, וכאן **34px**.
 * `36 § 3.2` ו-`MIN_LINE_HEIGHT` ב-`scripts/story-tap-audit.mjs` נוקבים ב-34, ושכבה A גוברת
 * על הרנדר. ⛔ זה הפער היחיד, והוא כתוב.
 *
 * ⚠️ **פער שני, ו⛔ אין לסגור אותו בהמצאה:** הרנדר מציג כותרת עברית («הספרייה של מאיה»)
 * ו-`public.stories` מחזיקה `title_en` בלבד. ⛔ אין תרגום בזמן רינדור ו⛔ אין כותרת שנכתבת
 * כאן — המסך שולח `title_en` בתוך `<EnWord>`, ועמודת הכותרת העברית היא מיגרציה מוצהרת
 * נפרדת (F-122 · D-108 ניתבה שורה לרוי).
 *
 * ⛔ **מילה חדשה ⛔ אינה מסומנת מראש** (§ 4.2יג-ב ⓑ, ⛔ לא בוטל): הקו הדק הוא «ידועה»
 * בלבד, והוא נושא **מקרא כתוב** — צבע לעולם אינו הערוץ היחיד (חוקה שכבה A).
 *
 * ⛔ **אפס גישה למסד מהרכיב.** הכול דרך `GET /api/world/story` ו-`lib/api/client.ts`.
 */

const KICKER_HE = 'העולם · סיפורים';
/**
 * T-203 · F-123 — `36 § 7` **מילה במילה**. המחרוזת הקודמת הפנתה את הלומד להקיש על מילה
 * שנושאת סימון ויזואלי, ו⛔ אין על המסך סימון כזה: הסימון היחיד הוא «ידועה», והמילים
 * החדשות ⛔ אינן נושאות דבר (§ 4.2יג-ב ⓑ). ⇒ המשפט שלח אותו לחפש סימן שלא קיים.
 * ⛔ **המחרוזת שנפסלה ⛔ אינה מצוטטת כאן** — הסריקה ב-`components/StoryScreen.test.ts`
 * קוראת את **המקור**, והערה שמכילה אותה מפילה בדיוק את השמירה שהיא נועדה לתת.
 * ⛔ **הסימון עצמו ⛔ לא משתנה כאן (D-115 § 1):** נתיב ⓒ — «נדגיש את החדשות» — נדחה
 * **על שכבה A**, כי מילה ידועה כבר נושאת קו תחתון, וקו שני שנבדל ממנו ⛔ בצבע בלבד
 * הוא «מצב שמקודד בצבע בלבד».
 */
const SUBTITLE_HE = 'סיפור ברמה שלך · הקש על מילה לתרגום';
const KNOWN_LEGEND_HE = 'ידועה';
/**
 * T-150 — שכבת הפתיחה. המשפט אומר **כמה אתה כבר מכיר**, ⛔ ולעולם ⛔ לא את ההשלמה שלו
 * (T-150ⓒ): ההיפוך הופך משפט פתיחה לרשימת חובות. ⛔ המילה האסורה עצמה ⛔ אינה נכתבת
 * כאן — ⛔ גם לא בהערה: `components/StoryScreen.test.ts` סורק את **המקור**, ותיעוד
 * שמכיל את המחרוזת מפיל בדיוק את הסריקה שנועדה לשמור עליה.
 * שני המספרים נגזרים בזמן תצוגה ב-`lib/core/storyIntro.ts` — ⛔ אפס עמודות, ⛔ אפס שדות חוט.
 */
const introLineHe = (total: number, known: number): string =>
  `בסיפור הזה ${total} מילים. ${known} מהן אתה כבר מכיר.`;
/**
 * T-203 · F-123 · T-151ⓓ — התווית הקודמת הבטיחה מעבר לפריט הבא ברצף, ו⛔ אין רצף כזה:
 * ‏`pickStory` בוחר על **אינדקס-יום** ב-`LEARNER_TIME_ZONE`, ולכן לחיצה מחזירה את **אותו
 * סיפור** — הפריט הבא הוא של מחר. הכפתור הבטיח ניווט שהמוצר ⛔ אינו יודע לבצע.
 * ⛔ **גם היא ⛔ אינה מצוטטת כאן**, מאותה סיבה: הסריקה קוראת את המקור.
 * ⇒ שתי תוויות, כל אחת נוקבת במה שהכפתור **עושה** במצב שלה.
 */
const DONE_READING_HE = 'סיימתי לקרוא';
const BACK_TO_WORLD_HE = 'חזרה לעולם';
const AMBIGUOUS_HE = 'לאיזו מילה התכוונת?';
const LOADING_HE = 'טוען את הסיפור שלך…';
const NO_LEVEL_HE = 'עוד לא בחרת רמה, ובלי רמה אין סיפור ברמה שלך.';
const NO_LEVEL_ACTION_HE = 'לבחירת הרמה';
const NO_STORIES_HE = 'עוד אין מספיק סיפורים ברמה שלך.';
const NO_STORIES_ACTION_HE = 'חזרה לעולם';
const LOGIN_HREF = '/login?expired=1';
const WORLD_HREF = '/world';

/** בדיוק מה ש-`GET /api/world/story` עונה (`docs/api-contract.md`), ⛔ ולא יותר. */
export interface StoryGlossWire {
  readonly translationHe: string;
  readonly posHe: string;
  readonly wordId: string;
}

export interface StoryPayload {
  readonly story: { readonly id: string; readonly titleEn: string; readonly bodyEn: string };
  readonly index: number;
  readonly total: number;
  readonly level: string;
  readonly glosses: Readonly<Record<string, StoryGlossWire>>;
  readonly knownLemmas: readonly string[];
  readonly counts: { readonly newWords: number; readonly alreadyKnown: number };
  /**
   * ⛔ **כבר על החוט מאז T-188** (`docs/api-contract.md` שורה 706) — ⛔ אין כאן שינוי
   * נקודת קצה ו⛔ אין עמודה חדשה. `null` פירושו «⛔ אין מצב שני», ⛔ ולא «אין שאלה».
   */
  readonly question: StoryQuestion | null;
}

/**
 * T-202 · F-124 — **שאלת ההבנה היא מצב של מסך הסיפור, ⛔ ולא מסך.**
 * 🎯 המדידה שקובעת: `render_video_A.py:964` הוא פונקציה **אחת** עם דגל `question=`.
 * הכרום — שורת המצב, שורת הסיכום, המקרא והפעולה הראשית — מצויר **מחוץ להחלפה**,
 * ורק כרטיס הגוף מתחלף. ⇒ הצורה נמדדה מהרנדר, ⛔ ולא הוסקה.
 */
export type StoryPhase = 'reading' | 'question';

type StoryBody =
  | ({ readonly ok: true } & StoryPayload)
  | {
      readonly ok: false;
      readonly code: string;
      readonly stories?: { readonly atLevel: number; readonly required: number };
    };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly payload: StoryPayload }
  | { readonly kind: 'no_level' }
  | { readonly kind: 'no_stories'; readonly atLevel: number | null; readonly required: number | null }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-touch w-full items-center justify-center rounded-2xl bg-brand-surface px-5 py-4 text-lg font-bold text-brand-on active:opacity-90';
const SECONDARY_ACTION_CLASS =
  'inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90';

export interface StoryScreenViewProps {
  readonly state: ScreenState;
  readonly onRetry?: () => void;
  /**
   * ⛔ **פיקסטורות בלבד (T-202ⓔ).** מסלול המוצר תמיד מתחיל ב-`reading`; הדלת הזאת קיימת
   * כדי ש-`check:mobile` ו-`diff:render` ימדדו את **המסך כולו** במצב השאלה. ⛔ פיקסטורה
   * של רכיב בבידוד היא בדיוק מה שאיפשר ל-F-124 לעבור 1,119 בדיקות ירוקות.
   */
  readonly initialPhase?: StoryPhase;
}

export default function StoryScreen(): React.JSX.Element {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<StoryBody>('/api/world/story');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else if (body.code === 'no_level') setState({ kind: 'no_level' });
        else if (body.code === 'no_stories') {
          // ⛔ המספרים מהשרת (D-064 · D-066) — ⛔ אין כאן ספירה שהמסך המציא.
          setState({
            kind: 'no_stories',
            atLevel: body.stories?.atLevel ?? null,
            required: body.stories?.required ?? null,
          });
        } else setState({ kind: 'error' });
        return;
      }
      setState({ kind: 'ready', payload: body });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return <StoryScreenView state={state} onRetry={() => void load()} />;
}

export function StoryScreenView({
  state,
  onRetry,
  initialPhase,
}: StoryScreenViewProps): React.JSX.Element {
  return (
    /* 🎯 `T-318` · `D-228`ⓐ · סוגר את `F-131`. **הקצב האנכי מתהדק ⛔ רק במצב השאלה**,
       וזה נמדד ⛔ ולא הועדף: ב-`/dev/story/done` ב-780 גובה חלון הפעולה הראשית התחילה
       ב-`top = 784` ב-320 וב-375 ⇒ ⛔ אף פיקסל ממנה על המסך, והרנדר
       (`docs/design/kol-A-06-question.png`) מבטיח שהיא **גלויה**. שישה מרווחים × 8px
       = בדיוק 48 הפיקסלים ש-`780 − 44 = 736` דורש. ⛔ 12px הוא **רצפת שכבה A**, ⛔ ולא
       מתחת לה. ⛔ מצב הקריאה נשאר `gap-5` — שם ⛔ אין בעיה, והרנדר של מסך הקריאה
       (`kol-A-05-story.png`) מצייר את הקצב הרחב. */
    <section
      dir="rtl"
      className="flex min-h-[100dvh] flex-col gap-5 pb-8 has-[[data-story-question]]:gap-3"
    >
      <header className="flex flex-col gap-1 text-right">
        <p className="text-sm text-ink-muted">{KICKER_HE}</p>
        <h1 className="text-2xl font-bold leading-tight">
          {state.kind === 'ready' ? <EnWord>{state.payload.story.titleEn}</EnWord> : ' '}
        </h1>
        <p className="text-sm text-ink-muted">{SUBTITLE_HE}</p>
      </header>

      {state.kind === 'ready' ? (
        <StoryReady payload={state.payload} initialPhase={initialPhase} />
      ) : (
        <StoryNotReady state={state} onRetry={onRetry} />
      )}
    </section>
  );
}

/**
 * שורת המצב של הרנדר: שבב הרמה בצד ימין־פנימי, פס הקריאה, ו-«סיפור N מתוך M» בקצה.
 * ⚠️ הפס נושא `aria-hidden` — הוא **חזרה** על «סיפור N מתוך M», ⛔ ולא ערוץ בפני עצמו.
 */
function StatusRow({ level, index, total }: { level: string; index: number; total: number }) {
  const pct = total > 0 ? Math.round((index / total) * 100) : 0;
  // ⚠️ **הסדר נלקח מהרנדר ⛔ ולא מהזרימה הטבעית של RTL:** `screen_story` מציב את שבב
  // הרמה ב-`x = 24` (הקצה **השמאלי**) ואת «סיפור N מתוך M» ב-`anchor="rm"` על `LW - 24`
  // (הקצה **הימני**), והפס ביניהם. במכולה RTL הילד הראשון יושב מימין ⇒ המונה ראשון
  // והשבב אחרון. ⛔ נמדד ב-`diff:render`, ⛔ ולא נוחש.
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-sm text-ink-muted">{`סיפור ${index} מתוך ${total}`}</span>
      <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-border-subtle">
        <span className="block h-full rounded-full bg-brand-surface" style={{ width: `${pct}%` }} />
      </span>
      {/* ⚠️ **פער מוצהר מול הרנדר, ⛔ ולא טעם — F-036 היא שכבה A וגוברת.** `screen_story`
          ממלא את השבב ואת הפס ב-`BRAND` — מילוי של **4.42:1**, ו-
          `lib/core/palette.test.ts` פוסל אותו בכל מסך. ⇒ המילוי הוא `bg-brand-surface`
          בשקיפות, והקו נשאר `border-brand` — `--brand` חוקי כקו וכאייקון, ⛔ לא כמילוי. */}
      <span className="rounded-full border border-brand/60 bg-brand-surface/20 px-3 py-1 text-sm font-bold text-brand-surface">
        <EnWord>{level}</EnWord>
      </span>
    </div>
  );
}

function StoryReady({
  payload,
  initialPhase,
}: {
  payload: StoryPayload;
  initialPhase?: StoryPhase;
}) {
  const known = new Set(payload.knownLemmas);
  const glosses = new Map<string, StoryGloss>(
    Object.entries(payload.glosses).map(([lemma, g]) => [
      lemma,
      { translationHe: g.translationHe, posHe: g.posHe },
    ]),
  );
  const segments = buildStorySegments(payload.story.bodyEn, glosses, known);
  // ⛔ מפתחות `glosses` הם «מילות הסיפור שיש להן משמעות אצלנו» — בדיוק הקבוצה ש-
  // `36 § 3` תנאי 1 מגדיר כיעדי הקשה. מילה בלעדיהם ⛔ אינה נספרת באף מספר (T-150ⓓ).
  const intro = storyIntro(Object.keys(payload.glosses), payload.knownLemmas);

  const [phase, setPhase] = useState<StoryPhase>(initialPhase ?? 'reading');
  const [openLemma, setOpenLemma] = useState<string | null>(null);
  /**
   * T-290 — **העיגון נמדד ברגע ההקשה, ⛔ ולא נגזר משם הרכיב.** הוא נשמר **יחסית
   * לכרטיס הגוף**, כי שם יושב הפופאובר (`absolute` בתוך `relative`) ⇒ הטקסט
   * ⛔ אינו זז, והמילה שהוקשה ⛔ אינה יוצאת מהתצוגה.
   */
  const bodyRef = useRef<HTMLDivElement | null>(null);
  /**
   * T-319 — **המילה שהוקשה, כאלמנט ⛔ ולא כשם.** `Escape` מחזיר את המיקוד **אליה**,
   * ⛔ ולא לראש הדף: לומד מקלדת שסגר חלונית חייב להמשיך מ-`Tab` הבא אחרי אותה מילה.
   * ⛔ `openLemma` ⛔ אינו מספיק — אותה למה יכולה להופיע פעמיים בפסקה.
   */
  const tappedWordRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState<WordAnchor | null>(null);
  const [bodyBox, setBodyBox] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [wordStatus, setWordStatus] = useState<Readonly<Record<string, WordPopoverStatus>>>({});
  const [ambiguous, setAmbiguous] = useState<readonly string[] | null>(null);

  /**
   * `36 § 3.4` — **מגע בטווח של שני יעדים מציג שבב עם שניהם, ⛔ ולעולם לא ניחוש.**
   * המרווח האופקי מוחזר כשוליים שליליים, ולכן שני אזורי הקשה של מילים סמוכות **יכולים**
   * לחפוף. ההכרעה נעשית על **הקואורדינטה של המגע** מול כל אזורי ההקשה בפסקה, ⛔ ולא על
   * האלמנט שהדפדפן במקרה בחר.
   */
  const onWordClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, lemma: string) => {
    const paragraph = event.currentTarget.closest('[data-story-body]');
    const hits =
      paragraph === null
        ? []
        : [...paragraph.querySelectorAll('[data-story-word]')].filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              event.clientX >= r.left &&
              event.clientX <= r.right &&
              event.clientY >= r.top &&
              event.clientY <= r.bottom
            );
          });
    if (hits.length > 1) {
      setOpenLemma(null);
      setAnchor(null);
      setAmbiguous(hits.map((el) => (el.textContent ?? '').trim()));
      return;
    }
    setAmbiguous(null);
    if (paragraph !== null) {
      const box = paragraph.getBoundingClientRect();
      const word = event.currentTarget.getBoundingClientRect();
      setBodyBox({ width: box.width, height: box.height });
      setAnchor({
        top: word.top - box.top,
        bottom: word.bottom - box.top,
        centerX: word.left - box.left + word.width / 2,
      });
    }
    tappedWordRef.current = event.currentTarget;
    setOpenLemma(lemma);
  }, []);

  /**
   * T-319 ⓐ — **מסלול סגירה אחד, ⛔ ולא ארבעה.** `Escape`, הקשה בחוץ, כפתור «סגור»
   * והוספה מוצלחת — כולם עוברים כאן, ולכן כולם מחזירים את המיקוד לאותו מקום.
   * ⛔ שכפול המסלול הוא בדיוק איך שאחד מהם נשאר בלי החזרת מיקוד.
   */
  const closePopover = useCallback(() => {
    setOpenLemma(null);
    setAnchor(null);
  }, []);

  /**
   * 🔴 T-319 ⓐ — **החזרת המיקוד היא אפקט, ⛔ ולא שורה בתוך `closePopover`. נמדד חי,
   * ⛔ ולא שוער:** הגרסה הראשונה קראה `el.focus()` בתוך הסוגר עצמו, וההרצה ב-Chromium
   * החזירה `focusIsTappedWord: false`. הסיבה היא ⓒ עצמו — ברגע הקריאה הפסקה **עדיין**
   * `inert`, כי React ⛔ טרם צייר מחדש, ו⛔ **אלמנט `inert` ⛔ אינו יכול לקבל מיקוד**
   * ⇒ ה-`focus()` נבלע בשקט. ⇒ המיקוד מוחזר כאן, **אחרי** שה-DOM כבר עודכן
   * ו-`inert` ירד. ‏`useLayoutEffect` ⛔ ולא `useEffect`: לפני הצביעה, ולכן ⛔ אין ולו
   * פריים אחד שבו המיקוד יושב על `document.body`.
   */
  useLayoutEffect(() => {
    if (openLemma !== null) return;
    const el = tappedWordRef.current;
    tappedWordRef.current = null;
    if (el !== null && el.isConnected) el.focus();
  }, [openLemma]);

  /**
   * T-319 ⓐⓑ — **`Escape` ברמת המסמך, ⛔ ולא על הרכיב.** הפסקה `inert` כל עוד
   * החלונית פתוחה ⇒ המיקוד יכול לשבת **בתוך** החלונית או על `document.body` אחרי
   * הקשת מגע; מאזין על הרכיב היה תופס רק את הראשון.
   * ⛔ **וההקשה בחוץ ⛔ אינה נבלעת:** ⛔ אין `preventDefault` ו⛔ אין `capture` שעוצר
   * את המסע — היא סוגרת, וממשיכה אל היעד שלה כרגיל.
   */
  useEffect(() => {
    if (openLemma === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopover();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest('[data-word-popover]') !== null) return;
      closePopover();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [openLemma, closePopover]);

  /**
   * T-238ⓑ · `D-183` — **הכתיבה היא `attempts + 1` בלבד (D-084), אבל «נוספה לחזרה»
   * ⛔ עולה רק כשהיא חוזרת `ok`.** עד כאן זה סומן `pending` -> אופטימי מיד, ו-
   * `.catch(() => {})` בלע כל כישלון — כישלון ⛔ אינו הופך את המסך למסך שגיאה, אבל
   * ⛔ גם אינו מוסתר: `WordPopover` עובר ל-`'error'` (`FAILURE_HE.save` + `RETRY_HE`),
   * ולחיצה על `RETRY_HE` מריצה מחדש בדיוק את אותה קריאה — קריאה חוזרת ל-`add`.
   */
  const add = useCallback(
    (lemma: string) => {
      const wordId = payload.glosses[lemma]?.wordId;
      if (wordId === undefined) return;
      setWordStatus((prev) => ({ ...prev, [lemma]: 'pending' }));
      void apiPost<{ ok: boolean }>('/api/review/context', { wordId })
        .then((body) => {
          setWordStatus((prev) => ({ ...prev, [lemma]: body.ok ? 'added' : 'error' }));
        })
        .catch(() => {
          setWordStatus((prev) => ({ ...prev, [lemma]: 'error' }));
        });
    },
    [payload.glosses],
  );

  const openGloss = openLemma === null ? undefined : payload.glosses[openLemma];

  // ⛔ סיפור בלי שאלה ⛔ אין לו מצב שני (`docs/api-contract.md` שורה 713) — הפעולה
  // הראשית שלו נשארת היציאה. ⛔ אין כאן «שאלה חלקית» ו⛔ אין מסך ריק.
  const question = payload.question;
  const inQuestion = phase === 'question' && question !== null;

  return (
    <>
      <StatusRow level={payload.level} index={payload.index} total={payload.total} />

      {/* 🎯 T-150 · המיקום מ-`docs/design/kol-A-05-story.png`: מעל כרטיס הגוף, מתחת
          לשורת המצב. ⛔ אין כאן סימון מוקדם של מילה (T-150ⓑ) — רק משפט.
          ⛔ שכבת הפתיחה שייכת ל-`reading` בלבד: היא מתארת מה עומד להיקרא. */}
      {inQuestion ? null : (
        <p data-story-intro className="text-sm text-ink-muted">
          {introLineHe(intro.total, intro.known)}
        </p>
      )}

      {/* ⛔ **ההחלפה היא כרטיס הגוף ו⛔ שום דבר אחר.** ⛔ `data-story-body` נשאר על פסקת
          הקריאה בלבד — חוזה T-183, ו-`scripts/story-tap-audit.mjs` מודד דרכו. */}
      {inQuestion && question !== null ? (
        <StoryEndScreen
          storyId={payload.story.id}
          question={question}
          reviewedCount={payload.counts.alreadyKnown}
        />
      ) : (
        <>
          {/* ⚠️ `data-story-body` הוא חוזה T-183: `scripts/verify-mobile.mjs` מוצא את
          הפסקה דרכו ומעביר אותה ל-`auditStoryBody`. ⛔ אין להסיר אותו.
          ⚠️ `leading-[34px]` הוא `36 § 3.2` — ⛔ ולא `ST_LINE = 32` של הרנדר.
          ⚠️ `data-story-ambiguity="chip"` מצהיר על תנאי 4, והמימוש הוא `onWordClick`. */}
          <div
            ref={bodyRef}
            data-story-body
            data-story-ambiguity="chip"
            className="relative rounded-2xl border border-border-subtle bg-surface-raised px-5 py-5 text-[15.5px] leading-[34px]"
          >
            {/* ⛔ **הפסקה עוברת דרך `<EnWord>` ⛔ ולא דרך `dir`, `lang` ומחלקת הבידוד בכתב יד**
            (T-009): שלושת המאפיינים חייבים לנסוע יחד, ופיזורם ביד הוא בדיוק איך שאחד
            מהם נעלם. `components/EnWord.test.ts` מפיל כל קובץ שכותב אותם בעצמו. */}
            {/* ⛔ **T-319 ⓒ — `inert` הוא מה שסוגר את WCAG 2.2 AA, ⛔ ולא טבעת יפה יותר.**
            כל עוד החלונית פתוחה הפסקה ⛔ אינה ניתנת למיקוד ו⛔ אינה יעד הקשה ⇒ מילה
            שיושבת **מתחת** לחלונית ⛔ אינה מציגה את עצמה כיעד, ולכן ⛔ אין מה לגנוב
            ממנה (`stolenWordCount(..., interactive=false) === 0`). ⛔ **ו⛔ אין כאן
            מלכודת מיקוד** — `Tab` יוצא מהחלונית אל שאר המסך, בדיוק כמו בכל חלונית. */}
            <p className="text-ink-muted" inert={openLemma !== null}>
              <EnWord>
                {segments.map((segment, i) => {
                  if (!segment.isTarget || segment.lemma === null) {
                    return <span key={i}>{segment.text}</span>;
                  }
                  const lemma = segment.lemma;
                  const gloss = payload.glosses[lemma];
                  return (
                    <button
                      key={i}
                      type="button"
                      data-story-word
                      data-story-translation={gloss?.translationHe ?? ''}
                      onClick={(e) => onWordClick(e, lemma)}
                      className={[
                        // `36 § 3.2/3.3`: 8px מרווח הקשה אנכי בכל צד, אזור אופקי ≥32px ממורכז
                        // על המילה, **והמרווח מוחזר כשוליים שליליים שווים** — אחרת אזור ההקשה
                        // מזיז את הפסקה, ו-`auditStoryBody` מפיל `layout-shifted`.
                        'inline cursor-pointer px-2 py-2 -mx-2 -my-2',
                        // ⛔ **מילה חדשה ⛔ אינה נושאת סימון — § 4.2יג-ב ⓑ ו-D-108 «⛔ New words
                        // carry NOTHING», ו⛔ שניהם ⛔ לא בוטלו.** הרנדר מצייר שבב מותג מאחורי
                        // מילה חדשה, ו-`36 § 1` קובע ש-36 גובר בכל סתירה. ⇒ הפער נרשם כממצא
                        // (F-123) ⛔ ולא נסגר כאן בהמצאה. הסימון היחיד הוא «ידועה», והוא נושא
                        // **מקרא כתוב** — צבע לעולם אינו הערוץ היחיד (חוקה שכבה A).
                        segment.isKnown
                          ? 'font-semibold text-ink underline decoration-success decoration-2 underline-offset-4'
                          : '',
                      ].join(' ')}
                    >
                      {segment.text}
                    </button>
                  );
                })}
              </EnWord>
            </p>

            {/* ⛔ **T-290 — הפופאובר יושב בתוך הכרטיס, ⛔ ולא אחריו.** `absolute` בתוך
                `relative` ⇒ הוא יוצא מהזרימה, ולכן פתיחתו ⛔ אינה דוחפת ולו פסקה אחת. */}
            {openLemma === null || openGloss === undefined ? null : (
              <WordPopover
                word={openLemma}
                translationHe={openGloss.translationHe}
                posHe={openGloss.posHe}
                status={wordStatus[openLemma] ?? 'idle'}
                onAdd={() => add(openLemma)}
                onClose={closePopover}
                anchor={anchor}
                containerWidth={bodyBox.width}
                containerHeight={bodyBox.height}
              />
            )}
          </div>

          {ambiguous === null ? null : (
            <p
              data-story-ambiguity-chip
              dir="rtl"
              className="rounded-lg border border-border-strong px-4 py-3 text-sm text-ink"
            >
              {`${AMBIGUOUS_HE} ${ambiguous.join(' · ')}`}
            </p>
          )}

        </>
      )}

      {/* ⚠️ אותו נימוק בדיוק כמו בשורת המצב: ברנדר הקו הירוק ו-«ידועה» יושבים ב-
          `x = 48…84` (הקצה **השמאלי**), ושורת הסיכום `anchor="rm"` על `LW - 24`
          (הקצה **הימני**). ⇒ הסיכום ראשון והמקרא אחרון. */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-muted">
          {`${payload.counts.newWords} מילים חדשות · ${payload.counts.alreadyKnown} שכבר ידעת`}
        </span>
        <span className="flex items-center gap-2 text-sm text-ink-muted">
          <span aria-hidden className="inline-block h-[2px] w-7 rounded-full bg-success" />
          {KNOWN_LEGEND_HE}
        </span>
      </div>

      {/* ⛔ **הפעולה הראשית מצוירת פעם אחת, מחוץ להחלפה** — כך היא ברנדר, וכך כאן.
          ⛔ **היציאה חיה בשני המצבים** (`§ 4.2יג` סעיף 3: «⛔ אין טעות בקריאה, ולכן
          ⛔ אין עונש») — ⛔ אין יציאה מנוטרלת ו⛔ אין חלונית שחוסמת. */}
      {inQuestion || question === null ? (
        <Link href={WORLD_HREF} className={PRIMARY_ACTION_CLASS}>
          {BACK_TO_WORLD_HE}
        </Link>
      ) : (
        <button type="button" onClick={() => setPhase('question')} className={PRIMARY_ACTION_CLASS}>
          {DONE_READING_HE}
        </button>
      )}
    </>
  );
}

function StoryNotReady({ state, onRetry }: { state: ScreenState; onRetry?: () => void }) {
  if (state.kind === 'loading') {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-8">
        <p className="text-lg text-ink-muted">{LOADING_HE}</p>
      </div>
    );
  }

  if (state.kind === 'no_level') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg text-ink-muted">{NO_LEVEL_HE}</p>
        <Link href={LEVEL_SCAN_HREF} className={SECONDARY_ACTION_CLASS}>
          {NO_LEVEL_ACTION_HE}
        </Link>
      </div>
    );
  }

  if (state.kind === 'no_stories') {
    const detail =
      state.atLevel === null || state.required === null
        ? ''
        : ` יש ${state.atLevel} מתוך ${state.required}.`;
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg text-ink-muted">{NO_STORIES_HE + detail}</p>
        <Link href={WORLD_HREF} className={SECONDARY_ACTION_CLASS}>
          {NO_STORIES_ACTION_HE}
        </Link>
      </div>
    );
  }

  if (state.kind === 'session_expired') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg text-ink-muted">{FAILURE_HE.load}</p>
        <Link href={LOGIN_HREF} className={SECONDARY_ACTION_CLASS}>
          {SIGN_IN_AGAIN_HE}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-lg text-ink-muted">
        {state.kind === 'schema_missing' ? SCHEMA_MISSING_HE : FAILURE_HE.load}
      </p>
      {onRetry === undefined ? null : (
        <button type="button" onClick={onRetry} className={SECONDARY_ACTION_CLASS}>
          {RETRY_HE}
        </button>
      )}
    </div>
  );
}
