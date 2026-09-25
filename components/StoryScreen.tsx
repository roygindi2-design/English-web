'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { selectStoryRecallBatch } from '@/lib/core/storyRecallBatch';
import type { StoryQuestion } from '@/lib/core/storyQuestion';
import {
  buildStorySegments,
  hitStoryWordBoxes,
  type StoryGloss,
  type StoryWordBox,
} from '@/lib/core/storyTapTargets';
import { storyParagraphs } from '@/lib/core/storyParagraphs';
import {
  DEFAULT_STORY_TEXT_SIZE,
  STORY_TEXT_SIZES,
  readTextSize,
  writeTextSize,
  type StoryTextSize,
} from '@/lib/storyTextSize';
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
 * T-150 · T-383 — שכבת הפתיחה. המשפט אומר **כמה אתה כבר מכיר**, ⛔ ולעולם ⛔ לא את
 * ההשלמה שלו (T-150ⓒ): ההיפוך הופך משפט פתיחה לרשימת חובות. ⛔ המילה האסורה עצמה
 * ⛔ אינה נכתבת כאן — ⛔ גם לא בהערה: `components/StoryScreen.test.ts` סורק את
 * **המקור**, ותיעוד שמכיל את המחרוזת מפיל בדיוק את הסריקה שנועדה לשמור עליה.
 * שלושת המספרים נגזרים בזמן תצוגה ב-`lib/core/storyIntro.ts` — ⛔ אפס עמודות, ⛔ אפס
 * שדות חוט.
 *
 * 🔢 **T-383 — המספר שמוביל הוא «כמה חדשות», ⛔ ולא «כמה בסך הכול».** הרנדר
 * (`docs/design/render_video_A.py`, שורת הסיכום) מצייר «5 מילים חדשות · 2 שכבר ידעת»,
 * והמסך מסר עד היום סך-כול שממנו הלומד היה צריך לחסר בעצמו כדי לדעת מה הסיפור שווה לו.
 * ⚠️ **וזה ⛔ אינו שינוי מיקום** (`§ 4.2כא` ⓐ): המשבצת התחתונה ⛔ אינה זזה, ושורת
 * «עברת על N» היא שורה אחרת לגמרי (`addedLineHe`).
 *
 * ⛔ **ו⛔ אין כאן חצי-משפט על אפס (T-383ⓒ · `§ 4.2יג-ב` ⓒ).** «0 מילים חדשות» הוא
 * מספר שמתאר מצב אמיתי במילים שגויות: `fresh === 0` פירושו ש⛔ **כל** מילה בסיפור כבר
 * שלו — זו הצהרה, ⛔ ולא ספירה. אותו כלל בדיוק על הצד השני: `known === 0` ⇒ החצי
 * «0 שכבר ידעת» ⛔ אינו נכתב, כי ⛔ אין מה לספור בו.
 * ⛔ **ויחיד בעברית נוקב במילה, ⛔ ולא במספר** — בדיוק כמו `addedLineHe` מתחת.
 */
const introLineHe = (fresh: number, known: number): string => {
  if (fresh === 0) return 'אין כאן מילה חדשה — כל המילים בסיפור הזה כבר שלך';
  const freshHe =
    fresh === 1 ? 'בסיפור הזה מילה חדשה אחת' : `בסיפור הזה ${fresh} מילים חדשות`;
  if (known === 0) return freshHe;
  return `${freshHe} · ${known === 1 ? 'אחת שכבר ידעת' : `${known} שכבר ידעת`}`;
};
/**
 * 🩺 **T-207 · `§ 4.2כא` ⓑ — השורה מדווחת פעולה, ⛔ ולא מלאי.**
 * המספר היחיד במסך שהוא **טענה על הלומד** הוא מה שהוא עצמו הוסיף בקריאה הזאת; שני
 * המספרים שישבו כאן קודם נגזרים ב-`GET` **לפני ההקשה הראשונה** ⇒ הם זהים לשני לומדים
 * שאחד מהם הוסיף עשר מילים והשני ⛔ אף לא אחת.
 * ⛔ **ו⛔ אין «‏1 מילים»:** ‏`§ 4.2כא` ⓑ מפנה למשפחת הנוסח של `StoryEndScreen`, והמשפחה
 * הזאת היא **עברית** — יחיד נוקב במילה, ⛔ ולא במספר. ⚠️ המקרה `N=0` ⛔ אינו מטופל כאן
 * אלא **באתר הקריאה**, כי הכלל הוא «⛔ אין שורה כלל» (`ⓒ`), ⛔ ולא «מחרוזת ריקה».
 * ⛔ **ומה שהשורה ⛔ אינה** (`ⓓ`): ⛔ ניקוד · ⛔ רצף · ⛔ מטבע · ⛔ לוח מובילים (`D-050`).
 */
const addedLineHe = (added: number): string =>
  added === 1 ? 'הוספת מילה אחת מהסיפור הזה' : `הוספת ${added} מילים מהסיפור הזה`;
/**
 * T-203 · F-123 · T-151ⓓ — התווית הקודמת הבטיחה מעבר לפריט הבא ברצף, ו⛔ אין רצף כזה:
 * ‏`pickStory` בוחר על **אינדקס-יום** ב-`LEARNER_TIME_ZONE`, ולכן לחיצה מחזירה את **אותו
 * סיפור** — הפריט הבא הוא של מחר. הכפתור הבטיח ניווט שהמוצר ⛔ אינו יודע לבצע.
 * ⛔ **גם היא ⛔ אינה מצוטטת כאן**, מאותה סיבה: הסריקה קוראת את המקור.
 * ⇒ שתי תוויות, כל אחת נוקבת במה שהכפתור **עושה** במצב שלה.
 */
const DONE_READING_HE = 'סיימתי לקרוא';
/**
 * 🔙 **T-381ⓑ — הפעולה הראשית נוקבת במה שהיא עושה **במצב שלה**, וזה ⛔ אותו כלל
 * בדיוק שהערה למעלה כבר קבעה (`T-203`).** לומד שחזר לגוף הסיפור ⛔ אינו קורא סיפור
 * חדש — הוא **קורא שוב** משפט שכבר ענה עליו — ⇒ «סיימתי לקרוא» היה מבטיח לו מעבר
 * קדימה אל שאלה שכבר לפניו. ⛔ הכפתור ⛔ אינו משנה מה הוא **עושה** (‏`setPhase`
 * ל-`question` בשני המקרים); הוא משנה מה הוא **אומר**.
 */
const BACK_TO_QUESTION_HE = 'חזרה לשאלה';
const BACK_TO_WORLD_HE = 'חזרה לעולם';
/** ➡️ T-494ⓐ — `D-293`ⓑ. */
const NEXT_STORY_HE = 'לסיפור הבא';
/** ➡️ T-494ⓒ — כל הסיפורים ברמה נקראו ⇒ ⛔ אין כפתור, ושורה אחת שאומרת זאת. */
const ALL_READ_HE = 'קראת את כל הסיפורים ברמה שלך';
/**
 * 🔑 **T-208 · `D-254`ⓑ — התקרה ⛔ אינה נבחרת כאן, היא **נגזרת**, והיא ⛔ לא הומצאה.**
 * ```
 * app/api/study/queue/route.ts   NEW_CARDS_PER_DAY = 5
 * plan/70-engines § 7.1          SM-2:  I(1) = 1 יום  ⇒ כל מה שנכנס היום נופל על מחר
 * ```
 * ⇒ SM-2 מתזמן את **כולן** לאותו יום אחד, ו-`planDailyQueue` מורשה להכניס 5 חדשות
 * ביום ⇒ סיפור שמזרים 20 מילים ⛔ אינו מוסיף 20: הוא מוסיף 20 שורות שהבלם יפרוס על
 * ארבעה ימים, וההבטחה של `I(1)=1` נשברת ל-15 מהן.
 * ⛔ **ולמה המספר ⛔ אינו מיובא ו⛔ אינו יושב ב-`/lib/core`:** `app/api/study/queue/route.ts`
 * מצהיר עליו במפורש כ**פרמטר מוצר** ש⛔ אינו עובר לשכבה הטהורה, כדי שקורא מאוחר
 * ⛔ לא יצטט אותו כאילו נגזר שם; והקובץ עצמו הוא נתיב שרת (`next/headers`) ⇒ ייבוא
 * שלו לרכיב לקוח היה גורר את השרת אל הדפדפן.
 * ⇒ ‏`components/StoryScreen.test.ts` מצליב את המספר הזה מול המקור **בטקסט**, בדיוק
 * כפי ש-`app/api/review/context/route.test.ts` מצליב את `CONFLICT_KEY` מול המיגרציה.
 */
const RECALL_CAP = 5;
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
  /**
   * ➡️ **T-494 · `D-293`ⓑ** — כמה סיפורים ברמה ⛔ טרם נקראו, **מלבד זה**. ‏`0` ⇒ ⛔ אין
   * «לסיפור הבא», ושורה שאומרת שכולם נקראו. ⛔ חסר (תשובה ישנה) ⇒ ⛔ לא יודעים ⇒ ⛔ לא
   * מציעים דבר — ⛔ לא ניחוש.
   */
  readonly nextUnread?: number;
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
  /** ➡️ T-494ⓑ — «לסיפור הבא»: טעינה טרייה של `GET /api/world/story`. ⛔ חסר ⇒ ⛔ אין כפתור. */
  readonly onNextStory?: () => void;
  /**
   * ⛔ **פיקסטורות בלבד (T-494ⓓ)**, באותו נימוק בדיוק כמו `initialPhase`: «הקריאה נשמרה»
   * קורה במוצר ⛔ רק אחרי POST שחזר `ok`, ו-`/dev/story/end` ⛔ אינו מבקש מהשרת דבר.
   */
  readonly initialReadSaved?: boolean;
  /**
   * ⛔ **פיקסטורות בלבד (T-509ⓓ)**: גודל הטקסט ההתחלתי, ⛔ וגובר על `localStorage` — כדי
   * ש-`check:mobile` ימדוד את «גדול» ב-320 בלי לכתוב לאחסון. מסלול המוצר ⛔ אינו מעביר אותו.
   */
  readonly initialTextSize?: StoryTextSize;
}

/**
 * 🔠 **T-509 · `D-297`ⓑ — three reading sizes, and the leading moves WITH the size.**
 * 15.5/34 is the size the screen always had; 17.5/38 and 20/42 keep `36 § 3.2`'s ≥34px
 * line and its 8px tap padding each side, and the ratio falls as the size grows
 * (2.19 · 2.17 · 2.10) — `apple-design § 15`, «leading tracks size inversely».
 */
const STORY_TEXT_CLASS: Readonly<Record<StoryTextSize, string>> = {
  sm: 'text-[15.5px] leading-[34px]',
  md: 'text-[17.5px] leading-[38px]',
  lg: 'text-[20px] leading-[42px]',
};

/** The size each `א` is drawn at, so the three buttons show what they do. */
const STORY_TEXT_SWATCH: Readonly<Record<StoryTextSize, string>> = {
  sm: 'text-[15px]',
  md: 'text-[19px]',
  lg: 'text-[24px]',
};

const STORY_TEXT_LABEL_HE: Readonly<Record<StoryTextSize, string>> = {
  sm: 'גודל טקסט: קטן',
  md: 'גודל טקסט: בינוני',
  lg: 'גודל טקסט: גדול',
};

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

  // ➡️ T-494ⓑ — טעינה טרייה ⇒ `loading` מפרק את `StoryReady` ⇒ הפאזה, הפופאובר וההקשות
  // מתאפסים מעצמם; הגלילה חוזרת לראש הסיפור החדש.
  const nextStory = useCallback(() => {
    window.scrollTo({ top: 0 });
    void load();
  }, [load]);

  return <StoryScreenView state={state} onRetry={() => void load()} onNextStory={nextStory} />;
}

export function StoryScreenView({
  state,
  onRetry,
  initialPhase,
  onNextStory,
  initialReadSaved,
  initialTextSize,
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
      {state.kind === 'ready' ? (
        <StoryReady
          key={state.payload.story.id}
          payload={state.payload}
          initialPhase={initialPhase}
          onNextStory={onNextStory}
          initialReadSaved={initialReadSaved}
          initialTextSize={initialTextSize}
        />
      ) : (
        <>
          {/* ⏳ **T-382ⓐ — הכותרת היא הצורה הראשונה שנוחתת, ⇒ היא הצורה הראשונה בשלד.**
              ⛔ ורק בטעינה: במצב כשל ⛔ אין כותרת שעומדת להגיע, ⇒ מלבן אפור שם היה
              מבטיח משהו שלעולם ⛔ לא יבוא. הרווח הקשיח מחזיק את גובה ה-`<h1>` בדיוק
              כפי שהחזיק עד היום. */}
          <StoryHeader>
            {state.kind === 'loading' ? (
              <span
                aria-hidden
                className="inline-block h-7 w-4/5 rounded-md bg-border-subtle align-middle"
              />
            ) : (
              ' '
            )}
          </StoryHeader>
          <StoryNotReady state={state} onRetry={onRetry} />
        </>
      )}
    </section>
  );
}

/**
 * 🔴 **T-240 — הכותרת נשארת אנגלית, ומילותיה נעשות יעדי הקשה בדיוק כמו גוף הסיפור.**
 *
 * ⛔ **הכרעת רוי 31/08, וההפך ממנה ⛔ אינו אפשרות:** ⛔ אין עמודת כותרת עברית ו⛔ אין
 * מיגרציה שלישית — המסך מציג `stories.title_en` **כפי שהוא**.
 *
 * הפרק חולץ כדי ששני המצבים יציירו **בדיוק** את אותה כותרת: `StoryReady` מספק כותרת
 * שמילותיה ניתנות להקשה, וכל מצב אחר מספק רווח — ⛔ ולא שני עותקים של אותו markup
 * שנפרדים בשקט בעריכה הבאה.
 */
function StoryHeader({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <header className="flex flex-col gap-1 text-right">
      <p className="text-sm text-ink-muted">{KICKER_HE}</p>
      {/* ⛔ **`text-left` על ה-`<h1>` בלבד, ⛔ ולא על ה-`<header>` — `T-375`ⓐ.**
      `T-240` קבעה שהכותרת **נשארת אנגלית**, אבל `render_video_A.py:989` מצייר שם
      כותרת **עברית** ב-`anchor="rm"` ⇒ היישור לימין שנלקח מהרנדר נכון ⛔ רק לעברית,
      והכותרת האנגלית ירשה אותו יתומה ונשברה כששתי שורותיה צמודות לימין — בדיוק הפגם
      ש-`T-374` תיקנה בגוף הסיפור. ⛔ **וה-`<header>` ⛔ אינו הופך כולו:** הוא מחזיק גם
      את הקיקר וגם את שורת ההסבר, ושתיהן עברית. ⛔ אין כאן `dir` ו⛔ אין `lang` בכתב
      יד — `<EnWord>` נושא אותם, ו-`components/EnWord.test.ts` מפיל כל קובץ שכותב
      אותם בעצמו (`T-009`). */}
      <h1 className="text-2xl font-bold leading-tight text-left">{children}</h1>
      <p className="text-sm text-ink-muted">{SUBTITLE_HE}</p>
    </header>
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
  onNextStory,
  initialReadSaved,
  initialTextSize,
}: {
  payload: StoryPayload;
  initialPhase?: StoryPhase;
  onNextStory?: () => void;
  initialReadSaved?: boolean;
  initialTextSize?: StoryTextSize;
}) {
  const known = useMemo(() => new Set(payload.knownLemmas), [payload.knownLemmas]);
  const glosses = useMemo(
    () =>
      new Map<string, StoryGloss>(
        Object.entries(payload.glosses).map(([lemma, g]) => [
          lemma,
          { translationHe: g.translationHe, posHe: g.posHe },
        ]),
      ),
    [payload.glosses],
  );
  const segments = useMemo(
    () => buildStorySegments(payload.story.bodyEn, glosses, known),
    [payload.story.bodyEn, glosses, known],
  );
  const paragraphs = useMemo(() => storyParagraphs(segments), [segments]);
  /**
   * 🔴 **T-240 — הכותרת עוברת באותו מסלול פילוח בדיוק, ⛔ ולא בשני.** אותו
   * `buildStorySegments`, אותה מפת גלוסות, אותו תנאי 1 של `36 § 3` ⇒ מילה שאין לה
   * תרגום ⛔ אינה יעד בכותרת בדיוק כמו בגוף, ומילת תפקוד ⛔ לעולם ⛔ אינה יעד.
   */
  const titleSegments = useMemo(
    () => buildStorySegments(payload.story.titleEn, glosses, known),
    [payload.story.titleEn, glosses, known],
  );
  // ⛔ מפתחות `glosses` הם «מילות הסיפור שיש להן משמעות אצלנו» — בדיוק הקבוצה ש-
  // `36 § 3` תנאי 1 מגדיר כיעדי הקשה. מילה בלעדיהם ⛔ אינה נספרת באף מספר (T-150ⓓ).
  const intro = useMemo(
    () => storyIntro(Object.keys(payload.glosses), payload.knownLemmas),
    [payload.glosses, payload.knownLemmas],
  );

  const [phase, setPhase] = useState<StoryPhase>(initialPhase ?? 'reading');
  /**
   * 🔙 **T-381ⓐ — הבחירה יושבת **מעל** ההחלפה, ⛔ ולא בתוך הכרטיס שמתחלף.**
   * 🔬 **וזה ⛔ אינו סגנון:** `StoryEndScreen` מורכב ⛔ רק כש-`inQuestion`, ⇒ state
   * מקומי שלו **מתאפס בכל חזרה-והלוך**. הלומד היה חוזר לפסקה, חוזר לשאלה, ומוצא
   * שלוש תשובות פנויות — כלומר המסך היה מלמד שאפשר לנחש עד שמצליחים. ⛔ זה בדיוק
   * הכשל שהזירה נמדדה עליו ב-23/08, ו-`§ 4.2יג` סעיף 3 אוסר עליו במפורש.
   * ⇒ הבחירה מורמת לכאן, ⇒ היא שורדת את ההחלפה כי ⛔ היא מעולם ⛔ לא ישבה בה.
   */
  const [chosen, setChosen] = useState<number | null>(null);
  /**
   * 🔙 **T-381ⓑ — «הגעתי לכאן בחזרה» הוא מצב, ⛔ ולא ניחוש מתוך `chosen`.** לומד
   * יכול לחזור לפסקה **לפני** שבחר (⛔ אין עונש ⇒ ⛔ אין תנאי), ואז `chosen` הוא
   * `null` בעוד הפעולה הראשית עדיין חייבת לומר «חזרה לשאלה».
   */
  const [returnedToReading, setReturnedToReading] = useState(false);
  const backToReading = useCallback(() => {
    setPhase('reading');
    setReturnedToReading(true);
  }, []);
  /**
   * 📚 **T-493 · `D-293`ⓐ — «סיימתי לקרוא» נשמר בשרת, פעם אחת לסיפור.** ‏`GET` קורא את
   * `story_reads` כרשימת הדילוג של `pickStory` ⇒ סיפור שנקרא ⛔ אינו חוזר מחר.
   * ⛔ **כישלון ⛔ אינו חוסם דבר** — מסך הסיום נפתח בכל מקרה, והכישלון יורד ללוג בלבד:
   * הקריאה עצמה כבר קרתה, ו⛔ אין סיבה לעצור לומד על כתיבה שלנו.
   */
  const readMarked = useRef(initialReadSaved === true);
  /**
   * ➡️ **T-494ⓑ — «לסיפור הבא» מופיע ⛔ רק אחרי שה-POST חזר `ok`.** הקשה לפני שהקריאה
   * נחתה הייתה מחזירה מה-GET את **אותו** סיפור ⇒ הלומד קורא אותו פעמיים.
   */
  const [readSaved, setReadSaved] = useState(initialReadSaved === true);
  const markRead = useCallback(() => {
    if (readMarked.current) return;
    readMarked.current = true;
    void apiPost<{ ok: boolean }>('/api/world/story/read', { storyId: payload.story.id })
      .then((res) => {
        if (res.ok) setReadSaved(true);
        else console.error('[story] read not saved');
      })
      .catch(() => console.error('[story] read not saved'));
  }, [payload.story.id]);
  const [openLemma, setOpenLemma] = useState<string | null>(null);
  /**
   * T-290 — **העיגון נמדד ברגע ההקשה, ⛔ ולא נגזר משם הרכיב.** הוא נשמר **יחסית
   * לכרטיס הגוף**, כי שם יושב הפופאובר (`absolute` בתוך `relative`) ⇒ הטקסט
   * ⛔ אינו זז, והמילה שהוקשה ⛔ אינה יוצאת מהתצוגה.
   */
  const bodyRef = useRef<HTMLDivElement | null>(null);
  // 🔠 T-509 — the server render and the first client paint both use the default; the
  // stored size lands right after mount, so hydration ⛔ never mismatches.
  const [textSize, setTextSize] = useState<StoryTextSize>(
    initialTextSize ?? DEFAULT_STORY_TEXT_SIZE,
  );
  useEffect(() => {
    if (initialTextSize === undefined) setTextSize(readTextSize());
  }, [initialTextSize]);
  const chooseTextSize = useCallback((size: StoryTextSize) => {
    setTextSize(size);
    writeTextSize(size);
  }, []);
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
  /**
   * 🔑 **T-208 · `D-254`ⓐ — סדר ההקשה הוא **נתון**, ⛔ ולא נגזרת של `wordStatus`.**
   * ‏`wordStatus` מחזיק ⛔ רק מילים שהלומד **הוסיף**, ו-`Object.keys` על אובייקט
   * ⛔ אינו מבטיח סדר הכנסה למפתחות שאינם אינדקסים — ⇒ «חמש הראשונות לפי סדר ההקשה»
   * (`D-254`ⓑ) ⛔ לא הייתה ניתנת לגזירה משם ⛔ בכלל. ⇒ רשימה, ⛔ ולא קבוצה.
   * ⛔ **ומה שנרשם כאן הוא **הקשה**, ⛔ ולא הוספה** — זו בדיוק ההבחנה של `D-254`ⓐ:
   * הקשה היא שליפה מוצהרת, וההוספה היא מה שהשורה הזאת באה לתת ללומד **אחריה**.
   */
  const [tapOrder, setTapOrder] = useState<readonly string[]>([]);
  /**
   * 🔑 **T-208 · `D-254`ⓒ — `null` = עוד ⛔ לא הצהיר · מספר = מה ש**נחת**.**
   * ⛔ הוא יושב כאן ו⛔ לא ב-`StoryEndScreen` מאותה סיבה בדיוק כמו `chosen` (`T-381`ⓐ):
   * הכרטיס מורכב ⛔ רק בפאזת השאלה ⇒ state מקומי שלו מתאפס בכל חזרה לגוף הסיפור,
   * והלומד היה מוזמן להוסיף את אותן מילים פעם שנייה.
   */
  const [recallAdded, setRecallAdded] = useState<number | null>(null);
  const [recallPending, setRecallPending] = useState(false);
  const [ambiguous, setAmbiguous] = useState<readonly string[] | null>(null);
  /**
   * 🔴 **T-240 — אותה חלונית, שני משטחים.** החלונית יושבת `absolute` בתוך המשטח
   * שהוקש בו, כי `T-290` קבע שהעיגון הוא **יחסי למכולה** ⇒ חלונית של כותרת שנפתחת
   * בתוך כרטיס הגוף הייתה נפתחת **מתחת למסך שהלומד הסתכל בו**. ⛔ המצב (‏`openLemma` ·
   * `wordStatus` · `add` · `closePopover`) משותף — ⛔ ולא מוכפל: יש חלונית אחת פתוחה
   * בכל רגע, והשדה הזה אומר **איפה** לצייר אותה.
   */
  const [openSurface, setOpenSurface] = useState<'body' | 'title'>('body');
  const titleRef = useRef<HTMLDivElement | null>(null);

  /**
   * 🔑 **T-208 · `D-254`ⓐ — נרשם **פעם אחת**, בהקשה הראשונה, ו⛔ לא בכל הקשה.**
   * ⛔ אותה מילה שהוקשה פעמיים היא **שליפה אחת של אותה מילה**, ⛔ ולא שתי מועמדות;
   * ‏`selectStoryRecallBatch` מסנן כפילות גם הוא, ו⛔ זו ⛔ אינה כפילות: כאן זה מה
   * שמונע רשימה שגדלה בלי תקרה במסך אחד.
   * ⚠️ **⛔ ומדובר בשני משטחים, ⛔ ולא באחד — וזו קריאה הפיכה (`RULES § 0.22`).**
   * ‏`D-254`ⓐ כותב «המילים שהלומד הקיש עליהן **בפסקה**», ו-`T-240` הפך את הכותרת
   * למשטח הקשה **זהה** לגוף — אותו `buildStorySegments`, אותה מפת גלוסות, אותו תנאי 1
   * של `36 § 3`. ⇒ הקשה בכותרת היא אותה שליפה מוצהרת בדיוק, וההחרגה שלה הייתה
   * הופכת «מה שהלומד שלף» למשהו שתלוי **היכן** המילה מודפסת.
   */
  /**
   * 🧺 **T-495 · `D-293`ⓒ — מילה שהיית צריך להקיש עליה כדי להבין נכנסת לאוסף.**
   * ⛔ רק מילה **שאינה** ב-`knownLemmas` · ⛔ פעם אחת למילה לכל סיפור (ה-ref מתאפס עם
   * `StoryReady`, שמפורק בכל סיפור) · ⛔ כישלון ⛔ אינו משנה את הפופאובר — לוג בלבד.
   * ⛔ אין כאן `word_progress` ו⛔ אין חזרה: זו רשימה, ⛔ לא מנוע (D-053).
   */
  const collectedRef = useRef<Set<string>>(new Set());
  const recordTap = useCallback((lemma: string) => {
    setTapOrder((prev) => (prev.includes(lemma) ? prev : [...prev, lemma]));
    if (known.has(lemma) || collectedRef.current.has(lemma)) return;
    const wordId = payload.glosses[lemma]?.wordId;
    if (wordId === undefined) return;
    collectedRef.current.add(lemma);
    void apiPost<{ ok: boolean }>('/api/world/collected', { wordId })
      .then((res) => {
        if (!res.ok) console.error('[story] word not collected');
      })
      .catch(() => console.error('[story] word not collected'));
  }, [known, payload.glosses]);

  /**
   * 🔴 **T-232ⓑ — שכבת המלבנים: נקראת פעם אחת לפריסה, ⛔ ולא בכל הקשה.**
   *
   * ⚠️ **הקואורדינטות הן יחסיות לכרטיס הגוף, ⛔ ולא לחלון** — וזו ⛔ אינה נוחות:
   * `getBoundingClientRect` הוא יחסי-לחלון, ⇒ מטמון בקואורדינטות חלון היה נפסל בכל
   * **גלילה** בלי שדבר יודיע על כך, והמגע היה נופל על המילה הלא נכונה. הפרש מול מלבן
   * הכרטיס — שנקרא ממילא בכל הקשה — הופך את הגלילה ללא-רלוונטית.
   *
   * ⛔ **ומה שכן פוסל אותה:** `resize` (הרוחב משתנה ⇒ הגלישה משתנה) ו-`ResizeObserver`
   * על הכרטיס, שתופס גם טעינת גופן שמזיזה שורות. ‏`ResizeObserver` ⛔ אינו קיים בכל
   * סביבת הרצה ⇒ הוא **אופציונלי**, ומאזין ה-`resize` הוא הרצפה.
   */
  const wordBoxesRef = useRef<readonly (StoryWordBox & { readonly text: string })[]>([]);
  const measureWords = useCallback(() => {
    const body = bodyRef.current;
    if (body === null) {
      wordBoxesRef.current = [];
      return;
    }
    const box = body.getBoundingClientRect();
    wordBoxesRef.current = [...body.querySelectorAll('[data-story-word]')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - box.left,
        right: r.right - box.left,
        top: r.top - box.top,
        bottom: r.bottom - box.top,
        text: (el.textContent ?? '').trim(),
      };
    });
  }, []);

  // ⛔ `useLayoutEffect` ⛔ ולא `useEffect`: אחרי הפריסה ולפני הצביעה ⇒ ⛔ אין ולו פריים
  // אחד שבו המסך מצויר והמטמון עדיין ריק.
  useLayoutEffect(() => {
    measureWords();
  }, [measureWords, segments, phase, textSize]);

  useEffect(() => {
    const onResize = () => measureWords();
    window.addEventListener('resize', onResize);
    const body = bodyRef.current;
    const observer =
      body === null || typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    if (observer !== null && body !== null) observer.observe(body);
    return () => {
      window.removeEventListener('resize', onResize);
      if (observer !== null) observer.disconnect();
    };
  }, [measureWords, phase]);

  /**
   * 🔴 **T-232ⓑ — שלוש שכבות של מדידה בתוך ההקשה ירדו לאחת. נמדד, ⛔ ולא שוער.**
   *
   * 🔬 **מה שהיה כאן, `C-0371`:** כל הקשה — ⛔ ולא רק הקשה דו-משמעית — הריצה
   * `querySelectorAll('[data-story-word]')` ואז `getBoundingClientRect()` על **כל מילה
   * בפסקה**, כלומר פריסה כפויה ועוד N קריאות מלבן **בתוך מטפל ההקשה**. `apple-design § 1`
   * נוקב בדיוק בזה: «be vigilant about every latency … anything on the input path that
   * isn't essential is a regression».
   *
   * ⇒ **המלבנים נקראים פעם אחת לפריסה** (`useLayoutEffect` למטה, ⛔ מחוץ לאינטראקציה),
   * נשמרים **יחסית לכרטיס הגוף** — ולכן גלילה ⛔ אינה פוסלת אותם — ונפסלים ב-`resize`
   * וב-`ResizeObserver`. ההקשה קוראת מלבן **אחד** (הכרטיס, שממילא נדרש ל-`bodyBox`),
   * ממירה נקודה אחת, ומכריעה בפונקציה טהורה.
   *
   * 🔴 **⛔ והכלל ⛔ אינו זז: `36 § 3.4`** — מגע בטווח של **שני** יעדים מציג שבב עם
   * **שניהם**, ⛔ ולעולם לא ניחוש. מה שהשתנה הוא **מתי נמדד**, ⛔ ולא **מה מוכרע**.
   *
   * ⚠️ **ומטמון ריק ⛔ אינו «אין פגיעה»:** אם השכבה ⛔ טרם נמדדה (רנדור ראשון, סביבה
   * ⛔ בלי `useLayoutEffect` חי) — נופלים חזרה למלבן של המילה שהוקשה עצמה, שהוא מה
   * שהדפדפן כבר הכריע. ⛔ הנפילה היא לעולם למסלול החד-משמעי, ⛔ ולא לניחוש בין שניים.
   */
  const onWordClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, lemma: string) => {
    const body = bodyRef.current;
    // ⛔ מלבן אחד, ⛔ ולא N — והוא נדרש ממילא ל-`bodyBox` של החלונית.
    const box = body?.getBoundingClientRect() ?? null;
    const hits =
      box === null
        ? []
        : hitStoryWordBoxes(wordBoxesRef.current, event.clientX - box.left, event.clientY - box.top);
    if (hits.length > 1) {
      setOpenLemma(null);
      setAnchor(null);
      setAmbiguous(hits.map((h) => h.text));
      return;
    }
    setAmbiguous(null);
    if (box !== null) {
      setBodyBox({ width: box.width, height: box.height });
      const hit = hits[0];
      if (hit !== undefined) {
        setAnchor({
          top: hit.top,
          bottom: hit.bottom,
          centerX: hit.left + (hit.right - hit.left) / 2,
        });
      } else {
        // ⛔ מטמון ⛔ לא חם ⇒ קריאה אחת, של המילה שהוקשה בלבד. ⛔ ולא של הפסקה.
        const word = event.currentTarget.getBoundingClientRect();
        setAnchor({
          top: word.top - box.top,
          bottom: word.bottom - box.top,
          centerX: word.left - box.left + word.width / 2,
        });
      }
    }
    tappedWordRef.current = event.currentTarget;
    setOpenSurface('body');
    setOpenLemma(lemma);
    recordTap(lemma);
  }, [recordTap]);

  /**
   * 🔴 **T-240 — יעד ההקשה בכותרת הוא 44×44 מלאים, ⛔ ולא חריג ה-inline של `36 § 3`.**
   *
   * ⛔ **הגדר צר במכוון, וזו ⛔ אינה החמרה שלי:** `36 § 3` פוטר **יעד inline בתוך פסקת
   * קריאה רציפה** בלבד. כותרת ⛔ אינה פסקת קריאה ⇒ ⛔ אין לה פטור, ⇒ כל מילה בכותרת היא
   * שבב `min-h-[44px] min-w-[44px]`. ⚠️ **ולכן ⛔ אין כאן מבחן חפיפה:** השבבים ⛔ אינם
   * נושאים שוליים שליליים, ⛔ אינם חופפים, ⇒ `36 § 3.4` ⛔ אינו רלוונטי כאן — ⛔ ולא
   * «הושמט». מדידה אחת בהקשה, על השבב עצמו.
   */
  const onTitleWordClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, lemma: string) => {
      const box = titleRef.current?.getBoundingClientRect() ?? null;
      setAmbiguous(null);
      if (box !== null) {
        const word = event.currentTarget.getBoundingClientRect();
        setBodyBox({ width: box.width, height: box.height });
        setAnchor({
          top: word.top - box.top,
          bottom: word.bottom - box.top,
          centerX: word.left - box.left + word.width / 2,
        });
      }
      tappedWordRef.current = event.currentTarget;
      setOpenSurface('title');
      setOpenLemma(lemma);
      recordTap(lemma);
    },
    [recordTap],
  );

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
   * ⛔ **החלפת מצב סוגרת את החלונית, ⛔ ולא משאירה אותה תלויה.** במצב השאלה ⛔ אין
   * כותרת ניתנת להקשה ו⛔ אין פסקה ⇒ חלונית פתוחה הייתה מצב ש⛔ אי אפשר להגיע אליו
   * שוב ⛔ ואי אפשר לסגור ממנו.
   */
  useEffect(() => {
    closePopover();
  }, [phase, closePopover]);

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
  /**
   * T-207 — **מה שנחת, ⛔ ולא מה שנלחץ.** `wordStatus` מחזיק `pending`/`error` באותה
   * מפה, ו-`D-183` כבר קבע שהחלונית ⛔ לעולם ⛔ אינה מצהירה על כתיבה שלא קרתה. ⇒ השורה
   * סופרת `added` בלבד, וכתיבה שנכשלה ⛔ אינה מזיזה אותה.
   */
  const addedCount = useMemo(
    () => Object.values(wordStatus).filter((st) => st === 'added').length,
    [wordStatus],
  );

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

  /**
   * 🔑 **T-208 · `D-254`ⓐⓑ — הבחירה טהורה, וההחלטה ⛔ אינה כאן.**
   * ⛔ המסך ⛔ אינו יודע «מי ראויה» — הוא מוסר שלושה נתונים (סדר ההקשה · מי כבר נחתה ·
   * התקרה) ומקבל רשימה. ⇒ ⛔ אין כאן פדגוגיה, ⛔ ואין מה להמציא (`R-010`).
   */
  const alreadyAdded = useMemo(
    () =>
      Object.entries(wordStatus)
        .filter(([, st]) => st === 'added')
        .map(([lemma]) => lemma),
    [wordStatus],
  );
  const recallBatch = useMemo(
    () => selectStoryRecallBatch(tapOrder, payload.glosses, alreadyAdded, RECALL_CAP),
    [tapOrder, payload.glosses, alreadyAdded],
  );

  /**
   * 🔑 **T-208 · `D-254`ⓓ — אפס מיגרציות, ואותו נתיב בדיוק שכבר קיים.**
   * ‏`POST /api/review/context` הוא `upsert` על `word_progress` — שורה לזוג
   * `(user_id, word_id)`, ⛔ לא לאירוע (`0003b`) ⇒ N קריאות הן N שורות לכל היותר,
   * ⛔ ולא N אירועים. ⛔ **אין כאן עמודה חדשה, ⛔ אין טבלה ו⛔ אין נתיב חדש.**
   * ⛔ **ו-`attempts` הוא כל מה שעולה** — ⛔ אפס עמודות SM-2 (`D-084` · `§ 4.2יג` 3).
   *
   * ⛔ **מה ש**נחת** ⛔ ולא מה שנשלח (`D-183`).** כתיבה שנכשלה מסומנת `'error'` — בדיוק
   * כמו במסלול של מילה בודדת — ⇒ היא ⛔ נשארת מועמדת, והמספר באישור ⛔ אינו כולל אותה.
   * ⛔ **וכישלון ⛔ אינו הופך את המסך למסך שגיאה**: הוא שורה אחת בשורה המשנית.
   */
  const addRecall = useCallback(() => {
    if (recallBatch.length === 0 || recallPending) return;
    const batch = recallBatch;
    setRecallPending(true);
    setRecallAdded(null);
    setWordStatus((prev) => {
      const next = { ...prev };
      for (const candidate of batch) next[candidate.lemma] = 'pending';
      return next;
    });
    void Promise.all(
      batch.map((candidate) =>
        apiPost<{ ok: boolean }>('/api/review/context', { wordId: candidate.wordId })
          .then((body) => (body.ok ? candidate.lemma : null))
          .catch(() => null),
      ),
    ).then((settled) => {
      const landed = new Set(settled.filter((lemma): lemma is string => lemma !== null));
      setWordStatus((prev) => {
        const next = { ...prev };
        for (const candidate of batch) {
          next[candidate.lemma] = landed.has(candidate.lemma) ? 'added' : 'error';
        }
        return next;
      });
      setRecallPending(false);
      setRecallAdded(landed.size);
    });
  }, [recallBatch, recallPending]);

  const openGloss = openLemma === null ? undefined : payload.glosses[openLemma];

  // ⛔ סיפור בלי שאלה ⛔ אין לו מצב שני (`docs/api-contract.md` שורה 713) — הפעולה
  // הראשית שלו נשארת היציאה. ⛔ אין כאן «שאלה חלקית» ו⛔ אין מסך ריק.
  const question = payload.question;
  const inQuestion = phase === 'question' && question !== null;

  return (
    <>
      {/* 🔴 **T-240 — הכותרת, ומילותיה יעדי הקשה.** ⛔ `relative` כאן ⛔ אינו קישוט:
          `WordPopover` מעגן **יחסית למכולה** (`T-290`) ⇒ בלי מכולה משלה, חלונית של
          כותרת הייתה נמדדת מול כרטיס הגוף ונפתחת מחוץ לתצוגה. */}
      <div ref={titleRef} className="relative">
        <StoryHeader>
          {/* ⛔ **אותו `<EnWord>` בדיוק** — `lang` · `dir` · בידוד נוסעים יחד (T-009),
              ו-`components/EnWord.test.ts` מפיל כל קובץ שכותב אותם ביד. */}
          {inQuestion ? (
            /* 🔴 **יעדי ההקשה בכותרת שייכים למצב הקריאה, ⛔ בדיוק כמו שכבת הפתיחה.**
               ⛔ וזו ⛔ אינה נסיגה מ-`T-240`: במצב השאלה גוף הסיפור עצמו ⛔ אינו על
               המסך ⇒ «כמו בגוף הסיפור» ⛔ אין לו מה להיות. 🔬 **ונמדד, ⛔ ולא הועדף:**
               שבבי 44px מגביהים את הכותרת, ו-`check:mobile` מדד את הפעולה הראשית של
               `/dev/story/done` מתחילה ב-`top = 764` מול תקרת `D-228`ⓐ (‏≤736 בחלון
               780) ⇒ הפעולה **יוצאת מהמסך הראשון**. הכותרת כאן היא כרומו, ⛔ והשער
               גובר על נוחות (`35 § 5`). */
            <EnWord>{payload.story.titleEn}</EnWord>
          ) : (
          <EnWord>
            <span
              data-story-title
              // ⛔ הכותרת ⛔ אינה ניתנת למיקוד כל עוד החלונית שלה פתוחה — אותו נימוק
              // בדיוק של `T-319` ⓒ בפסקה: מילה **מתחת** לחלונית ⛔ אינה יעד.
              {...(openLemma !== null && openSurface === 'title' ? { inert: true } : {})}
            >
              {titleSegments.map((segment, i) => {
                if (!segment.isTarget || segment.lemma === null) {
                  return <span key={i}>{segment.text}</span>;
                }
                const lemma = segment.lemma;
                const gloss = payload.glosses[lemma];
                return (
                  <button
                    key={i}
                    type="button"
                    data-story-title-word
                    data-story-translation={gloss?.translationHe ?? ''}
                    // 🔴 **T-378 ⓒⓘ — אותו ערוץ בדיוק בכותרת.** ⛔ המילה בכותרת פותחת
                    // את אותה חלונית ⇒ היא חייבת להצהיר על אותו מצב.
                    aria-expanded={openLemma === lemma && openSurface === 'title'}
                    onClick={(e) => onTitleWordClick(e, lemma)}
                    className={[
                      // 🔴 **T-378 ⓒⓘ — שבב המצב `open`, כמו בגוף.** ⛔ השבב בכותרת
                      // ⛔ אינו משנה מטרים גם הוא: היעד כבר `min-w-[44px]` ממורכז.
                      openLemma === lemma && openSurface === 'title'
                        ? 'rounded-md bg-brand-surface text-brand-on'
                        : '',
                      // 🔴 `א4` — **44×44 מלאים.** הכותרת ⛔ אינה «פסקת קריאה רציפה»
                      // ⇒ חריג ה-inline של `36 § 3` ⛔ אינו חל עליה, ⛔ ואין כאן שוליים
                      // שליליים שמחזירים את המרווח: הגובה **אמור** לגדול.
                      'inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center px-1 align-middle',
                      // ⛔ **מילה חדשה ⛔ אינה נושאת סימון גם בכותרת** (`36 § 7`).
                      // הסימון היחיד הוא «ידועה», והוא משקל + קו — ⛔ לעולם לא צבע לבדו.
                      segment.isKnown ? 'underline decoration-success decoration-2 underline-offset-4' : '',
                    ].join(' ')}
                  >
                    {segment.text}
                  </button>
                );
              })}
            </span>
          </EnWord>
          )}
        </StoryHeader>

        {openLemma === null || openGloss === undefined || openSurface !== 'title' || inQuestion ? null : (
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

      <StatusRow level={payload.level} index={payload.index} total={payload.total} />

      {/* 🎯 T-150 · המיקום מ-`docs/design/kol-A-05-story.png`: מעל כרטיס הגוף, מתחת
          לשורת המצב. ⛔ אין כאן סימון מוקדם של מילה (T-150ⓑ) — רק משפט.
          ⛔ שכבת הפתיחה שייכת ל-`reading` בלבד: היא מתארת מה עומד להיקרא. */}
      {/* ⛔ T-383 — סיפור בלי ולו מילה אחת שיש לה משמעות אצלנו ⛔ אינו מקבל שורה ריקה
          אלא ⛔ אינו מקבל שורה **כלל**: ⛔ אין מה לספור, ⛔ ואין מה להצהיר. אותו כלל
          בדיוק כמו `addedLineHe` (`§ 4.2כא` ⓒ — «⛔ אין שורה», ⛔ לא «מחרוזת ריקה»). */}
      {inQuestion || intro.total === 0 ? null : (
        <p data-story-intro className="text-sm text-ink-muted">
          {introLineHe(intro.fresh, intro.known)}
        </p>
      )}

      {/* ⛔ **ההחלפה היא כרטיס הגוף ו⛔ שום דבר אחר.** ⛔ `data-story-body` נשאר על פסקת
          הקריאה בלבד — חוזה T-183, ו-`scripts/story-tap-audit.mjs` מודד דרכו. */}
      {inQuestion && question !== null ? (
        <StoryEndScreen
          storyId={payload.story.id}
          question={question}
          reviewedCount={payload.counts.alreadyKnown}
          chosen={chosen}
          onChoose={setChosen}
          onBackToReading={backToReading}
          recallCount={recallBatch.length}
          recallAdded={recallAdded}
          recallPending={recallPending}
          onAddRecall={addRecall}
        />
      ) : (
        <>
          {/* ⚠️ `data-story-body` הוא חוזה T-183: `scripts/verify-mobile.mjs` מוצא את
          הפסקה דרכו ומעביר אותה ל-`auditStoryBody`. ⛔ אין להסיר אותו.
          ⚠️ `leading-[34px]` הוא `36 § 3.2` — ⛔ ולא `ST_LINE = 32` של הרנדר.
          ⚠️ `data-story-ambiguity="chip"` מצהיר על תנאי 4, והמימוש הוא `onWordClick`. */}
          {/* 🔠 **T-509ⓑ — the size choice sits right above what it changes.** A radio
              group, ⛔ not three toggles: exactly one is on. The chosen one carries a
              heavier border AND `aria-checked`, ⛔ never colour alone (layer A). */}
          <div
            role="radiogroup"
            aria-label="גודל טקסט"
            data-story-text-sizes
            className="flex items-center justify-end gap-2"
          >
            {STORY_TEXT_SIZES.map((size) => {
              const on = size === textSize;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={STORY_TEXT_LABEL_HE[size]}
                  onClick={() => chooseTextSize(size)}
                  className={[
                    'inline-flex h-11 w-11 items-center justify-center rounded-lg font-bold leading-none',
                    STORY_TEXT_SWATCH[size],
                    on
                      ? 'border-2 border-brand bg-brand-surface text-brand-on'
                      : 'border border-border-strong text-ink',
                  ].join(' ')}
                >
                  א
                </button>
              );
            })}
          </div>
          <div
            ref={bodyRef}
            data-story-body
            data-story-ambiguity="chip"
            data-story-text-size={textSize}
            className={`relative rounded-2xl border border-border-subtle bg-surface-raised px-5 py-5 ${STORY_TEXT_CLASS[textSize]}`}
          >
            {/* ⛔ **הפסקה עוברת דרך `<EnWord>` ⛔ ולא דרך `dir`, `lang` ומחלקת הבידוד בכתב יד**
            (T-009): שלושת המאפיינים חייבים לנסוע יחד, ופיזורם ביד הוא בדיוק איך שאחד
            מהם נעלם. `components/EnWord.test.ts` מפיל כל קובץ שכותב אותם בעצמו. */}
            {/* ⛔ **T-319 ⓒ — `inert` הוא מה שסוגר את WCAG 2.2 AA, ⛔ ולא טבעת יפה יותר.**
            כל עוד החלונית פתוחה הפסקה ⛔ אינה ניתנת למיקוד ו⛔ אינה יעד הקשה ⇒ מילה
            שיושבת **מתחת** לחלונית ⛔ אינה מציגה את עצמה כיעד, ולכן ⛔ אין מה לגנוב
            ממנה (`stolenWordCount(..., interactive=false) === 0`). ⛔ **ו⛔ אין כאן
            מלכודת מיקוד** — `Tab` יוצא מהחלונית אל שאר המסך, בדיוק כמו בכל חלונית. */}
            {/* ⛔ **`text-left` הוא הרנדר, ⛔ ולא טעם — `T-374`.** `render_video_A.py:951`
            מתעד את עצמו `"""left-to-right wrap"""` ומצייר כל מילה ב-`anchor="lm"` מ-
            `ST_X + ST_PAD` (‏`:1015-1020`), כלומר **הפסקה צמודה לשמאל**. בלי המחלקה הזאת
            ה-`<p>` יורש `text-align: right` מ-`dir="rtl"` של `:202` ⇒ הפסקה האנגלית צמודה
            לימין, וכל שורה **מתחילה** במקום אחר. ⛔ זו ⛔ אינה בעיית כיוון: `<EnWord>` כבר
            נושא `dir="ltr"` ואת בידוד ה-bidi, והריצה עצמה כבר LTR. מה שירש RTL הוא
            **היישור של הבלוק**, ו-`<EnWord>` הוא `<span>` שורתי ⇒ ⛔ אינו יכול לקבוע אותו.
            ⛔ **ולכן היישור בלבד** — ⛔ אין כאן `dir` ו⛔ אין `lang` בכתב יד:
            `components/EnWord.test.ts` מפיל כל קובץ שכותב אותם בעצמו (‏`T-009`). */}
            {/* 📄 **T-508 · `D-297`ⓐ — three paragraphs, ⛔ not one block.** The groups come
            from `storyParagraphs`, which only regroups the segments above: every tap target
            still renders exactly once, in order. Each `<p>` keeps the same `inert`,
            `text-left` and `<EnWord>` as the single one did (`T-319`ⓒ · `T-374` · `T-009`). */}
            <div className="space-y-4">
              {paragraphs.map((paragraph, p) => (
                <p
                  key={p}
                  className="text-ink-muted text-left"
                  inert={openLemma !== null && openSurface === 'body'}
                >
                  <EnWord>
                    {paragraph.map((segment, i) => {
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
                          // 🔴 **T-378 ⓒⓘ — הערוץ שאינו ויזואלי, ו⛔ עד היום הוא החזיר `null`.**
                          // ⛔ `aria-expanded` יושב על **כל** מילת יעד, ⛔ ולא רק על הפתוחה:
                          // `false` הוא מה שמצהיר שיש כאן מה לפתוח, ובלעדיו קורא-מסך שומע
                          // «כפתור» ו⛔ אינו יודע שנפתחה חלונית כשהיא נפתחה.
                          aria-expanded={openLemma === lemma && openSurface === 'body'}
                          onClick={(e) => onWordClick(e, lemma)}
                          className={[
                            // `36 § 3.2/3.3`: 8px מרווח הקשה אנכי בכל צד, אזור אופקי ≥32px ממורכז
                            // על המילה, **והמרווח מוחזר כשוליים שליליים שווים** — אחרת אזור ההקשה
                            // מזיז את הפסקה, ו-`auditStoryBody` מפיל `layout-shifted`.
                            'inline cursor-pointer px-2 py-2 -mx-2 -my-2',
                            // 🔴 **T-378 ⓒⓘ — שבב המצב `open`, והוא **הרנדר**.**
                            // `render_video_A.py:1026-1028` מצייר את המילה ה**פעילה** כשבב
                            // מלא (`fill=BRAND`, טקסט `BRAND_ON`, רדיוס 7 → `rounded-md`),
                            // וההערה שם אומרת מפורשות שזה ⛔ **אינו** סימון מוקדם של `F-123`:
                            // «it is the tap itself … The screen's equivalent is the popover,
                            // and it opens on exactly the same event».
                            // ⛔ **⛔ ואין כאן שינוי מטרי** — רקע וצבע בלבד, ⛔ לא משקל ו⛔ לא
                            // מרווח ⇒ הפסקה ⛔ אינה זזה ולו פיקסל כשהחלונית נפתחת, וזו בדיוק
                            // האינווריאנטה של `T-290`.
                            // ⛔ **ו⛔ אין כאן «צבע בלבד»** (חוקה שכבה A): השבב הוא ערוץ אחד,
                            // `aria-expanded` הוא השני, וזנב החלונית הוא השלישי.
                            openLemma === lemma && openSurface === 'body'
                              ? 'rounded-md bg-brand-surface text-brand-on'
                              : '',
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
              ))}
            </div>

            {/* ⛔ **T-290 — הפופאובר יושב בתוך הכרטיס, ⛔ ולא אחריו.** `absolute` בתוך
                `relative` ⇒ הוא יוצא מהזרימה, ולכן פתיחתו ⛔ אינה דוחפת ולו פסקה אחת. */}
            {openLemma === null || openGloss === undefined || openSurface !== 'body' ? null : (
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
      {/* 🔴 **T-379 ⓑⓒ — המקרא מופיע ⛔ רק כשיש מה למקרא.**
          🔬 **נמדד חי על `/dev/story/done` ב-375×780, ⛔ ולא שוער:** הסדר היה
          «עברת על N» ⇒ הפעולה המשנית ⇒ **המקרא** ⇒ הפעולה הראשית — כלומר קו ירוק
          ומילה «ידועה» **תלויים בין שני כפתורים**, ⛔ בלי ולו מילה אחת מסומנת על
          המסך שאליה הם מתייחסים: המקרא מפרש קו תחתון **בגוף הסיפור**, ו-`inQuestion`
          מחליף את גוף הסיפור בכרטיס השאלה.
          ⇒ השורה שייכת ל-`reading`, בדיוק כמו שכבת הפתיחה (`data-story-intro`) ⇒
          **מ-1 אלמנט דקורטיבי שיושב בין שני כפתורים ל-0.**
          ⛔ **ו⛔ זו ⛔ אינה סתירה ל-`§ 4.2כא` ⓐ** («המשבצת ⛔ אינה זזה»): שם הנמדד
          הוא שהמקרא ⛔ אינו זז כש**שורת הסיכום** מופיעה או נעלמת, ו-`justify-between`
          שמחזיק את זה ⛔ לא נגעתי בו. כאן מדובר בפאזה אחרת לגמרי. */}
      {inQuestion ? null : (
      <div className="flex items-center justify-between gap-3">
        {/* ⛔ **N=0 ⇒ ⛔ אין אלמנט כלל — `§ 4.2כא` ⓒ.** ⛔ לא «0 מילים» ו⛔ לא «עדיין
            לא הוספת»: משפט שאין בו מה לומר ⛔ אינו משפט, ו⛔ אפס ⛔ אינו נזיפה. זהו
            **בדיוק** הכלל ש-`§ 4.2יג-ב ⓒ` כבר אוכף ב-`StoryEndScreen`.
            ⚠️ **והמשבצת ⛔ אינה זזה** (`ⓐ`): ה-`justify-between` נשאר, ולכן המקרא
            «ידועה» יושב בקצה שלו בין אם השורה כאן קיימת ובין אם ⛔ לא. */}
        {addedCount > 0 ? (
          <span data-story-summary className="text-sm text-ink-muted">
            {addedLineHe(addedCount)}
          </span>
        ) : (
          <span aria-hidden />
        )}
        <span className="flex items-center gap-2 text-sm text-ink-muted">
          <span aria-hidden className="inline-block h-[2px] w-7 rounded-full bg-success" />
          {KNOWN_LEGEND_HE}
        </span>
      </div>
      )}

      {/* ⛔ **הפעולה הראשית מצוירת פעם אחת, מחוץ להחלפה** — כך היא ברנדר, וכך כאן.
          ⛔ **היציאה חיה בשני המצבים** (`§ 4.2יג` סעיף 3: «⛔ אין טעות בקריאה, ולכן
          ⛔ אין עונש») — ⛔ אין יציאה מנוטרלת ו⛔ אין חלונית שחוסמת. */}
      {inQuestion && readSaved && payload.nextUnread === 0 ? (
        <p data-story-all-read className="text-center text-base text-ink-muted">
          {ALL_READ_HE}
        </p>
      ) : null}
      {inQuestion && readSaved && onNextStory !== undefined && (payload.nextUnread ?? 0) > 0 ? (
        /* ➡️ **T-494ⓐ — «לסיפור הבא» **לצד** «חזרה לעולם», ⛔ לא במקומה ⛔ ולא מעליה.**
           🔬 **ולצד ⛔ ולא מעל, וזה נמדד:** ב-`/dev/story/done` היציאה צריכה לצבוע עד
           `top ≤ 736` על מסך של 780 (`D-228`ⓐ) — כפתור נוסף **מעליה** היה דוחף אותה
           ~56px מטה ⇒ מחוץ למסך. בשורה אחת הגובה ⛔ אינו זז. ב-RTL הראשון יושב מימין. */
        <div data-story-next-row className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onNextStory}
            className={`${PRIMARY_ACTION_CLASS} transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100`}
          >
            {NEXT_STORY_HE}
          </button>
          <Link
            href={WORLD_HREF}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-2xl border border-border-strong px-4 py-4 text-lg text-ink active:opacity-90"
          >
            {BACK_TO_WORLD_HE}
          </Link>
        </div>
      ) : inQuestion || question === null ? (
        <Link
          href={WORLD_HREF}
          onClick={question === null ? markRead : undefined}
          className={PRIMARY_ACTION_CLASS}
        >
          {BACK_TO_WORLD_HE}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            markRead();
            setPhase('question');
          }}
          className={PRIMARY_ACTION_CLASS}
        >
          {returnedToReading ? BACK_TO_QUESTION_HE : DONE_READING_HE}
        </button>
      )}
    </>
  );
}

/**
 * ⏳ **T-382 — מה שנצבע בזמן ההתנעה הקרה הוא **צורת הסיפור**, ⛔ ולא משפט אפור.**
 *
 * 🔬 **הבעיה נמדדה, ⛔ ולא הורגשה:** `F-255` מדד בייצור 14/09 דרך `Kernel`, 375×780,
 * ‏`TTFB` של **3,745ms קר מול 305ms חם** ⇒ שלוש שניות ויותר שבהן המסך צבוע. מה שישב
 * כאן עד הטיק הזה היה אלמנט **אחד** — פסקה אחת בתוך מסגרת — כלומר המסך אמר «חכה»
 * למשך שלוש שניות ואז החליף את עצמו כולו.
 *
 * ⛔ **ו-`loading.tsx` ⛔ לא היה פותר כאן דבר, וזו בדיוק הטעות ש-`T-373` נסוגה עליה
 * (`D-250`):** ‏`/world/story` הוא `○` בבנייה — הקליפה כבר סטטית — וההמתנה היא על
 * `fetch` של `ƒ /api/world/story` **בתוך הלקוח** ⇒ ⛔ אין כאן גבול `<Suspense>`
 * שאפשר לתלות בו שלד, והמקום היחיד שמצייר את ההמתנה הוא הענף הזה.
 *
 * ⛔ **⛔ ולא ספינר (ⓑ):** ספינר אומר «משהו קורה», שלד אומר «זה מה שמגיע». הסדר כאן
 * הוא הסדר האמיתי של `StoryReady` — שורת המצב, שורת הפתיחה, כרטיס הגוף, שורת המקרא,
 * הפעולה הראשית — ⛔ כי שלד שצורתו ⛔ אינה הצורה שנוחתת הוא הבטחה שהמסך מפר, ו-
 * `app/(tabs)/cards/loading.tsx` כותב את המשפט הזה בעצמו.
 * ⚠️ **הכותרת ⛔ אינה כאן** — `StoryScreenView` כבר מצייר `<StoryHeader>` מעל כל מצב
 * שאינו `ready` ⇒ שלד שני שלה היה **כפילות** שקופצת כשהאמיתית נוחתת.
 *
 * ⛔ **⛔ ואפס תנועה (ⓓ).** `prefers-reduced-motion` הוא שער (`check:motion`), ו⛔ אין
 * תנועה ⇒ הוא מכובד **בבנייה**, ⛔ ולא בתנאי מדיה שמישהו ישכח. זהו בדיוק מה ש-
 * `components/CardSkeleton.tsx` כבר עושה, ⛔ ואין כאן שפה שנייה.
 *
 * ♿ **ⓒ — `aria-busy` · `aria-live` · משפט `sr-only`.** קורא מסך מקבל **מילה**,
 * ⛔ ולא שבע מלבנים ריקים; ⇒ כל הצורות `aria-hidden`.
 */
const SKELETON_LINE_WIDTHS = [
  'w-full',
  'w-full',
  'w-11/12',
  'w-full',
  'w-10/12',
  'w-2/3',
] as const;

function StorySkeleton(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-live="polite" data-story-skeleton className="flex flex-col gap-5">
      <span className="sr-only">{LOADING_HE}</span>

      {/* שורת המצב: «סיפור N מתוך M» · הפס · שבב הרמה — ⛔ באותו סדר RTL של `StatusRow`. */}
      <div aria-hidden className="flex items-center gap-3">
        <span className="h-4 w-24 shrink-0 rounded-md bg-border-subtle" />
        <span className="h-2 flex-1 rounded-full bg-border-subtle" />
        <span className="h-7 w-12 shrink-0 rounded-full bg-border-subtle" />
      </div>

      {/* שורת הפתיחה */}
      <span aria-hidden className="h-4 w-3/5 rounded-md bg-border-subtle" />

      {/* כרטיס הגוף — ⛔ אותו `rounded-2xl`, אותה מסגרת ואותו ריפוד של `data-story-body`,
          ושש שורות ב-`leading-[34px]` של `36 § 3.2` ⇒ הגובה ⛔ אינו קופץ כשהטקסט נוחת.
          ⚠️ השורה האחרונה קצרה, כמו סוף פסקה אמיתי. */}
      <div
        aria-hidden
        className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-5"
      >
        <div className="flex flex-col gap-[14px]">
          {SKELETON_LINE_WIDTHS.map((w, i) => (
            <span key={i} className={`h-5 rounded-md bg-border-subtle ${w}`} />
          ))}
        </div>
      </div>

      {/* שורת המקרא — הקו הירוק ו«ידועה» יושבים בקצה השמאלי, בדיוק כמו ב-`StoryReady`. */}
      <div aria-hidden className="flex items-center justify-between gap-3">
        <span />
        <span className="h-4 w-20 rounded-md bg-border-subtle" />
      </div>

      {/* הפעולה הראשית — ⛔ אותו גובה מגע ואותו רדיוס, ⇒ היא ⛔ אינה זזה כשהיא נעשית אמיתית. */}
      <span aria-hidden className="min-h-touch w-full rounded-2xl bg-border-subtle py-4" />
    </div>
  );
}

function StoryNotReady({ state, onRetry }: { state: ScreenState; onRetry?: () => void }) {
  if (state.kind === 'loading') return <StorySkeleton />;

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
