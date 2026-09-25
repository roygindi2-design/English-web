'use client';

/**
 * גוף לשונית `לימודים` — בורר ארבעת המסלולים, T-246 · `36 § 9` · D-176.
 *
 * 🎯 **הרנדר: `docs/design/kol-A-04-learning.png`**, וערכי הפריסה כאן לקוחים
 * מ-`docs/design/render_video_A.py:1149-1264` (`TRACKS` · `screen_hub`) —
 * ⛔ לא מהעין (`36 § 14.4` · D-114): כותרת «לימודים» · תת-כותרת «בחר מסלול ·
 * לכל מסלול מדד התקדמות משלו» · שורת שבבי מסלול RTL מתחת לכותרת.
 *
 * ⛔ **סטייה מכוונת אחת מהרנדר, ומתועדת (Layer A גוברת · `36 § 14.4`):** השבב
 * הפעיל ברנדר מסומן בצבע (`BRAND`) בלבד. `36 § 12.7` אוסר מצב שמקודד בצבע
 * בלבד, ולכן השבב הפעיל כאן נושא גם `aria-current="true"` וגם משקל גופן שונה —
 * שני ערוצים נוספים על הצבע.
 *
 * ⛔ **T-247 (נתיב המודולים בתוך מסלול) אינו כאן.** הרכיב הזה מציג שבב + כרטיס
 * סטטוס אחד לכל מסלול (ⓐ+ⓑ+ⓒ+ⓕ מתוך T-246), ⛔ ולא רשימת מודולים לחיצה
 * (חסום ב-T-246 עצמה, ⛔ ולא פער שנשכח — ראה התוכנית, «מה בכוונה נשאר בחוץ»).
 *
 * ⛔ **אפס תחזית קצב** — ⛔ אין נוסחה מוגדרת באף מסמך עוגן (ראה Global Constraint 8
 * בתוכנית). הוספת אחת כאן הייתה המצאת קביעה על הלומד, בדיוק מה ש-§ 4.4.3 אוסר.
 *
 * ⛔ **הרכיב אינו ניגש לדאטהבייס** — הקריאה ל-`GET /api/levels/summary` עוברת
 * דרך `apiGet` (lib/api/client.ts), בדיוק הדפוס של `<LevelMapScreen>`.
 * `fixtureLevels` עוקף את הקריאה — הפיקסטורה ב-`/dev/tabs/studies` מזינה אותו כדי
 * שהגאומטריה תימדד בלי env של Supabase.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api/client';
import type { LevelSummary } from '@/lib/core/levelSummary';
import {
  latestStudyPlace,
  parseStudyPlaces,
  studyPlaceForTrack,
  type StudyPlace,
} from '@/lib/core/studyPlace';
import {
  STUDY_TRACKS,
  trackDestination,
  trackFallbackAction,
  trackLabelHe,
  trackMetric,
  trackModules,
  moduleSkeletonCount,
  moduleAnchorId,
  moduleItemHref,
  parseModuleAnchor,
  type StudyModuleState,
  type StudyTrackId,
} from '@/lib/core/studyTracks';

const TITLE_HE = 'לימודים';
const SUBTITLE_HE = 'בחר מסלול · לכל מסלול מדד התקדמות משלו';
/** ⛔ «—», ⛔ לא ריק: קריאה שנכשלה חייבת להיראות אחרת ממסלול ריק באמת (D-046/D-082). */
const UNREACHABLE_HE = '— לא הצלחנו לטעון את ההתקדמות כרגע';
/** `T-513` · נאמר לקורא-מסך בלבד — השלד עצמו `aria-hidden` (התקדים: `CardSkeleton`). */
const LOADING_HE = 'טוען את ההתקדמות…';
/**
 * `T-513` · פעימה **אחת**, ⛔ לא לולאה: השלד אומר «זה מה שבא», ⛔ ולא «משהו קורה»
 * (`CardSkeleton`). ‏`motion-safe` ⇒ תחת `prefers-reduced-motion` השלד סטטי.
 */
const SKELETON_PULSE = 'motion-safe:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_1]';
/**
 * T-351 · המסלול שאין לו יעד בנוי אומר זאת, ⛔ ולא נשאר כרטיס בלי דרך החוצה.
 * ⛔ ⛔ ולא קישור שמוביל למסך שאינו קיים: מבוי סתום גרוע מהיעדר כפתור.
 */
const NO_DESTINATION_HE = 'המסלול הזה עדיין בבנייה, ואין בו לאן להיכנס.';

/** ‏T-331ⓑ — מזהים יציבים, ⛔ ולא מחרוזות מוטבעות: `aria-controls` ו-`aria-labelledby` מצביעים זה על זה. */
const TRACK_PANEL_ID = 'studies-track-panel';
const TAB_ID_PREFIX = 'studies-track-tab-';

type SummaryResponse =
  | { readonly ok: true; readonly level: string | null; readonly levels?: readonly LevelSummary[] }
  | { readonly ok: false; readonly code: string };

/**
 * `T-409` · `GET /api/study/place`. ⛔ **`places` מגיע כ-`unknown` בכוונה** — הוא נכנס
 * ל-`parseStudyPlaces`, שהוא שער ו⛔ לא פענוח: מזהה מסלול שאינו אחד מארבעת אלה, ושורה
 * חסרה, ⛔ אינם מפילים את המסך ו⛔ אינם נסמכים עליהם.
 */
type PlaceResponse =
  | { readonly ok: true; readonly places?: unknown }
  | { readonly ok: false; readonly code: string };

/** SVG מוטבע ⛔ ולא אמוג׳י (חוקה שכבה A · § 6) — הערוץ השני של השבב הפעיל. */
function ActiveTrackMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

/**
 * T-407 · **סימן המצב על הנתיב** — הערוץ השני של המצב, לצד התווית הכתובה
 * בכרטיס (`36 § 12.7`: «⛔ אין קידוד מצב בצבע בלבד — אייקון ותווית תמיד»).
 * SVG מוטבע ⛔ ולא אמוג׳י (חוקה שכבה A · § 6).
 *
 * ⛔ **ו⛔ אין כאן מנעול, ובכוונה:** מנעול אומר «אין לך רשות», ו-`R-017` אוסר
 * נעילה בין רמות. המצב היחיד שאינו פתוח כאן הוא **רמה שאין בה מילים**, וסימנה
 * הוא קו — היעדר תוכן, ⛔ ולא היעדר רשות.
 */
function ModuleStateMark({ state }: { readonly state: StudyModuleState }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {state === 'done' && <path d="M3.5 8.5l3 3 6-7" />}
      {state === 'current' && <circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" />}
      {state === 'open' && <circle cx="8" cy="8" r="3.2" />}
      {state === 'empty' && <path d="M4.5 8h7" />}
    </svg>
  );
}

export default function StudiesScreen({
  fixtureLevels,
  fixturePlaces,
}: {
  readonly fixtureLevels?: readonly LevelSummary[];
  /**
   * `T-409` · ⛔ **פיקסטורה, ⛔ ולא ברירת מחדל.** בדיוק כמו `fixtureLevels`: ערך
   * שאינו `undefined` עוקף את קריאת הרשת, ⇒ `/dev/tabs/studies/place` מרנדר את
   * **המצב המשוחזר** בלי env של Supabase. ⛔ בלי זה המצב הזה ⛔ אינו ניתן לרינדור
   * בשום מקום בריפו, וזו בדיוק המחלקה ש-`F-282` מדד.
   */
  readonly fixturePlaces?: readonly StudyPlace[];
} = {}): React.JSX.Element {
  const [active, setActive] = useState<StudyTrackId>(STUDY_TRACKS[0].id);
  const [levels, setLevels] = useState<readonly LevelSummary[] | null>(fixtureLevels ?? null);
  const [loading, setLoading] = useState(fixtureLevels === undefined);
  const [places, setPlaces] = useState<readonly StudyPlace[]>(fixturePlaces ?? []);

  useEffect(() => {
    if (fixtureLevels !== undefined) return;
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<SummaryResponse>('/api/levels/summary');
        if (cancelled) return;
        setLevels(body.ok ? (body.levels ?? []) : null);
      } catch {
        if (!cancelled) setLevels(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fixtureLevels]);

  /**
   * `T-409`ⓑ · **המקום נקרא בכל כניסה, ⛔ ולא מה-URL.** ‏`T-408` נתן את החזרה
   * **מפריט** דרך עוגן ב-`hash`; עוגן ⛔ אינו שורד סגירת לשונית ⇒ «בכניסה הבאה»
   * ⛔ לא היה קיים. הקריאה כאן היא מה שהופך את זה לכניסה, ⛔ ולא לחזרה.
   *
   * ⛔ **וכשלון ⛔ אינו מוצג ללומד** — ⛔ בניגוד ל-`levels`, שבלעדיו הפאנל היה
   * מדפיס מספר שגוי (`UNREACHABLE_HE`, D-046/D-082). סימנייה שלא נקראה פירושה
   * שהמסך נפתח על המסלול הראשון, כלומר בדיוק ההתנהגות שקדמה לשורה הזאת ⇒
   * ⛔ אין כאן מה להודיע.
   */
  useEffect(() => {
    if (fixturePlaces !== undefined) return;
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<PlaceResponse>('/api/study/place');
        if (cancelled || !body.ok) return;
        setPlaces(parseStudyPlaces(body.places));
      } catch {
        // ⛔ בכוונה שקט — ראה למעלה.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fixturePlaces]);

  /**
   * `T-409`ⓐ · **הכתיבה, בשני הרגעים שהשורה נוקבת ו⛔ בשום רגע אחר:** כשפריט
   * **מתחיל** (הקשה על כרטיס מודול) וכש הוא **נגמר** (החזרה נוחתת על העוגן).
   * ⛔ **⛔ ולא על כל הקשה על שבב** — ⛔ סימנייה ⛔ אינה טלמטריה, ולומד שמציץ
   * ב-`דקדוק` לשנייה ⛔ אינו מאבד את מקומו ב-`אוצר מילים`.
   *
   * ⛔ **ו⛔ אינה חוסמת דבר:** `void` ו-`catch` ריק — כתיבה שנכשלה (⛔ אין סשן,
   * הטבלה ⛔ עוד לא הוקמה, הרשת נפלה) ⛔ לעולם ⛔ אינה עוצרת ניווט ו⛔ אינה
   * מוצגת. זה בדיוק מה ש-`POST /api/study/place` מתעד כ«מה שהמסך עושה עם
   * ה-503».
   */
  const savePlace = useCallback(
    (trackId: StudyTrackId, moduleId: string | null) => {
      if (fixturePlaces !== undefined) return;
      void apiPost('/api/study/place', { trackId, moduleId }).catch(() => {});
    },
    [fixturePlaces],
  );

  /**
   * T-406 · ⛔ הענפים עברו ל-`lib/core/studyTracks.ts` (`trackMetric`) — הם היו
   * כאן, ⇒ כל שינוי במדד של מסלול נגע בשני קבצים ו⛔ לא היה נבדק בלי DOM.
   */
  const metric = trackMetric(active, levels, loading);
  /**
   * T-351 · ⛔ **⛔ לא נגזר מ-`metric`, ובכוונה.** הדרך קדימה היא תכונה של
   * המסלול, ⛔ לא של קריאת ההתקדמות ⇒ `metric.kind === 'unreachable'`
   * ⛔ אינו מוחק אותה (`T-349` · «דרך אחת החוצה מכל כשל»).
   */
  const destination = trackDestination(active);
  /**
   * T-406ⓑ · הדבר האחד שאפשר לעשות עכשיו במסלול שאין לו יעד. `null` למסלול
   * שכבר יש לו יעד ⇒ ⛔ לעולם ⛔ אין כאן שתי פעולות באותו פאנל.
   */
  const fallback = trackFallbackAction(active);
  /**
   * T-407 · נתיב המודולים של המסלול. ⛔ נגזר, ⛔ ולא כתוב ביד — ראה
   * `trackModules`. רשימה ריקה היא מצב תקין: שלושת המסלולים בלי תוכן מציגים
   * את המבנה הריק המוצהר של `T-406` במקומה.
   */
  const modules = trackModules(active, levels, loading);
  /** `T-513` · שמירת המקום של הנתיב בזמן טעינה — ⛔ אפס מחוץ ל`אוצר מילים`. */
  const skeletons = moduleSkeletonCount(active, loading);

  /**
   * T-410 — ⛔ הבורר ⛔ אינו גולש עוד, ⛔ בשום רוחב. ‏`T-330` פתר את הגלישה
   * בגלילה אופקית **פנימית** + סימני קצה, ⇒ הדף ⛔ לא גלש והשער הגלובלי נשאר
   * ירוק, בעוד הלומד רואה **שלושה** מסלולים מתוך ארבעה.
   * 🔬 **נמדד `C-0685` ב-375×812:** רצועה 327px מול `scrollWidth` 408px ⇒ גלישה
   * 81px, ו-`הבנת הנקרא` — המסלול היחיד שיש בו תוכן — 51% מחוץ למסך.
   *
   * ⛔ **ולמה זו ⛔ אינה «שורה אחת מכווצת»:** ‏`render_video_A.py:1207-1285`
   * מצייר את השורה ב-**12.5px** ריפוד 26px, ו-`LW = 375` — ⇒ הרנדר מדבר על
   * 375 בלבד, ו**הלולאה שלו עצמה נוטשת שבב שלא נכנס** (`if x - w < 20: break`).
   * ב-320px הרצועה היא 272px, וארבע התוויות בגודל הרצפה (12px · `§ א9`) ⛔ אינן
   * נכנסות בה בשום ריפוד ⇒ שורה אחת ב-320 דורשת טקסט מתחת לרצפה.
   * ⇒ **הרצפה גוברת על הרנדר** (`36 § 14.4` — שערי הנגישות, ⛔ והם בלבד).
   *
   * ⇒ הפתרון הוא `flex-wrap` על טיפוגרפיית הרנדר: ב-375 ו-414 ארבעת השבבים
   * יושבים ב**שורה אחת**, בדיוק כפי שהרנדר מצייר; ב-320 הם נשברים לשתיים
   * ⛔ במקום לגלוש. ⇒ ⛔ אפס גלילה אופקית בשלושת הרוחבים, וארבעה מתוך ארבעה
   * גלויים בכולם.
   *
   * 🔴 **T-414 — ‏`flex-wrap` לבדו ⛔ לא הספיק, וזה נמדד ⛔ ולא שוער.** ב-`C-0691`
   * נמדד ש-375px עדיין נשבר לשתי שורות: `אוצר מילים` · `דקדוק` · `כתיבה`
   * בראשונה, ו-`הבנת הנקרא` — **המסלול היחיד שיש בו תוכן חי** (12 סיפורים,
   * `T-405`) — לבדו בשנייה, כשארית. ⇒ הלומד קורא שלוש אפשרויות ועוד עודף,
   * ⛔ ולא ארבע אפשרויות שוות כפי ש-`kol-A-04-learning` מצייר.
   *
   * 🔬 **המדידה, ב-`next start` 375×780 (‏Playwright, ⛔ ולא קריאת מקור):** רצועה
   * `clientWidth` = **327px**; ארבעת השבבים ב-`px-3` = `109.5 + 59.4 + 57.7 +
   * 93.3` = **319.9px**, ועוד שלושה רווחי `gap-2` = 24 ⇒ **343.9px**.
   * ⇒ חסרים **16.9px**, ⛔ ולא «כמעט נכנס».
   *
   * ⛔ **ו⛔ אין שלושה מהמוצאים האלה:** ⓐ ⛔ אין קיצור שם מסלול — ארבעת השמות
   * נקובים ב-`36 § 9` מילה במילה; ⓑ ⛔ אין הקטנת טקסט — `text-xs` **הוא**
   * רצפת ה-12px (`§ א9` · `check:text-floor`), והרצפה ⛔ אינה נפתחת (וגם
   * `imagegen-frontend-mobile § 29`: «⛔ אל תכווץ טקסט כדי לדחוס עוד UI»);
   * ⓒ ⛔ אין החזרה של `overflow-x-auto` — `T-410` סגרה את הגלישה האופקית.
   * ⇒ **הריפוד האופקי הוא המשתנה היחיד שנשאר**, והוא יורד מ-`px-3` ל-`px-2`:
   * `223.9` תוכן + `8×8` ריפוד = `287.9`, ועוד 24 רווחים = **311.9 ≤ 327**,
   * מרווח של **15.1px**.
   *
   * ⚠️ **וזו סטייה מהרנדר שנרשמת, ⛔ ולא נבלעת** (`36 § 14.4`): הרנדר מצייר
   * ריפוד **13px** לכל צד (`render_video_A.py:1276` — `c.tw(tr, 12.5, …) + 26`).
   * המדידה מראה שבמטריקות הגופן החי, 13px לצד ⛔ אינם ניתנים להשגה ברצפת
   * ה-12px ⇒ נלקח **הקיצוץ הקטן ביותר שנכנס** (12 ⇒ 8), ו-`gap-2` נשאר 8px
   * **בדיוק כמו הרנדר** (`x -= w + 8`, אותה שורה).
   *
   * ⛔ **ו-320px נשאר בשתי שורות, בכוונה.** נמדד: 272px רצועה מול 223.9px
   * תוכן ⇒ שורה אחת דורשת ריפוד ≤4px לצד ורווחים של 4px, כלומר שבבים
   * צמודים — `imagegen-frontend-mobile § 31` («⛔ אל תעשה את המסך צפוף»).
   * ⇒ **הרצפה גוברת על הרנדר גם כאן**, בדיוק כמו ב-`T-410`, והרצועה
   * ⛔ עדיין ⛔ אינה גולשת.
   */
  const chipRefs = useRef(new Map<StudyTrackId, HTMLButtonElement>());

  /**
   * ⓐ השבב הנבחר מגולגל לתצוגה. ⛔ אחרי `T-410` ⛔ אין גלילה אופקית פנימית ⇒
   * `inline: 'nearest'` הוא בפועל אל-פעולה, והערך כאן הוא **האנכי**: שבב
   * שנבחר במקלדת בשורה השנייה (ב-320px) נגלל אל תוך התצוגה של הדף.
   * `'nearest'` בשני הצירים ⇒ שבב שכבר נראה במלואו ⛔ אינו זז, ו⛔ אין קפיצה
   * על כל הקשה. ⛔ ו⛔ אין `scroll-smooth` במחלקות: ההעדפה נקראת כאן, ⇒
   * `prefers-reduced-motion` ⛔ אינו נעקף (35 § layer B).
   */
  useEffect(() => {
    const chip = chipRefs.current.get(active);
    if (!chip) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    chip.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  }, [active]);

  /**
   * T-331ⓐ — ניווט מקלדת, שהכרזת `role="tablist"` כבר הבטיחה ו⛔ לא סיפקה.
   * ⛔ **ארבע עצירות Tab הופכות לאחת:** `tabIndex` מתגלגל — הנבחר `0`, השאר
   * `-1` — ⇒ ה-Tab נכנס לבורר פעם אחת ויוצא ממנו פעם אחת, והחיצים מזיזים
   * בתוכו. זה מה ש-ARIA מחייב ב-`tablist`, וזה מה שקורא-מסך מכריז.
   *
   * 🔴 **והכיוון הוא RTL, ⛔ ולא ברירת המחדל של הדפדפן** — `ArrowLeft` **מתקדם**
   * ו-`ArrowRight` **חוזר**, כי בעברית «הבא» יושב משמאל. ⛔ התקדים נמדד ו⛔ לא
   * שוער: `F-236` — שם `flex-row-reverse` הפך התקדמות לשמאל⇠ימין, וההצהרה
   * בקוד הייתה הפוכה מהתוצאה. ⇒ הכיוון כאן נכתב **מפורשות**, ⛔ ולא נגזר.
   *
   * ⛔ `Home`/`End` הם הראשון/האחרון **בסדר הקריאה העברי** — כלומר הימני ביותר
   * והשמאלי ביותר, ⛔ ולא להפך.
   */
  /**
   * `T-408`ⓑ+ⓒ · **החזרה נוחתת על המודול שממנו יצא, ⛔ ולא על ראש הרשימה.**
   * זה בדיוק מה שהשורה קונה: פריט שנפתח מהנתיב והסתיים מחזיר את הלומד
   * למקום שלו במסלול (`D-065`).
   *
   * ⛔ **העוגן ו⛔ לא `searchParams`, וזו הכרעה מדודה:** `T-328` הפך את
   * `’/studies’` מ-`ƒ` ל-`○` — סטטי, מוגש מהקצה — וקריאת פרמטר שאילתה בעמוד
   * הייתה מחזירה אותו להלוך-ושוב לשרת שהטיק ההוא הסיר. `hash` ⛔ אינו נשלח
   * לשרת בכלל ⵒ החזרה ⛔ אינה עולה ולו בקריאה אחת.
   *
   * ⛔ **ופעם אחת בלבד:** `handled` נועל אחרי הנחיתה, ⵒ לומד שהקיש
   * אחר-כך על שבב אחר ⛔ אינו נשאב בחזרה למודול שבכתובת.
   */
  const returnHandled = useRef(false);

  useEffect(() => {
    if (returnHandled.current) return;
    const anchor = parseModuleAnchor(window.location.hash);
    if (anchor === null) {
      returnHandled.current = true;
      return;
    }
    if (anchor.trackId !== active) {
      setActive(anchor.trackId);
      return;
    }
    const target = document.getElementById(moduleAnchorId(anchor.trackId, anchor.moduleId));
    if (target === null) return;
    returnHandled.current = true;
    // ⛔ ההעדפה נקראת כאן ו⛔ לא ב-CSS — אותו דפוס כמו גלילת השבבים מעל,
    // ⵒ `prefers-reduced-motion` ⛔ אינו נעקף (חוקה שכבה A · `check:motion`).
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    // ⛔ המיקוד ו⛔ לא הגלילה לבדה: לומד שמנווט במקלדת או בקורא-מסך
    // חוזר לנקודה שלו ברשימה, ⛔ ולא לראש המסך.
    target.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    // `T-409`ⓐ · החצי השני של «נכתב כשהפריט מתחיל **או נגמר**». החזרה מהפריט
    // ⛔ אינה עוד הקשה — היא הרגע שבו ידוע איפה הלומד באמת עצר.
    savePlace(anchor.trackId, anchor.moduleId);
  }, [active, modules, savePlace]);

  /**
   * `T-409`ⓒ · **המסלול נפתח על המיקום השמור, ⛔ ולא על ראש הרשימה.**
   *
   * ⛔ **והעוגן שב-URL גובר על הסימנייה, תמיד.** החזרה של `T-408` היא הוראה
   * שהלומד נתן לפני שנייה; הסימנייה היא זיכרון של הוראה שנתן אתמול. ⇒ כשיש
   * עוגן, השחזור ⛔ אינו רץ בכלל — שני מנגנונים שמזיזים את אותו `active` היו
   * מייצרים קפיצה כפולה.
   *
   * ⛔ **⛔ ואין כאן מיקוד, ⛔ בניגוד ל-`T-408` מעל.** שם הלומד **ביקש** לחזור
   * לנקודה שלו; כאן הוא רק פתח את המסך. גניבת מיקוד על טעינה היא בדיוק מה
   * ש-`prefers-reduced-motion` ו-`36 § 12` מגנים מפניו ⇒ הגלילה בלבד,
   * ו-`block: 'nearest'` ⇒ מודול שכבר נראה במלואו ⛔ אינו זז.
   *
   * ⛔ **ופעם אחת בלבד:** `placeRestored` ננעל אחרי הנחיתה, ⇒ לומד שבחר שבב
   * אחר-כך ⛔ אינו נשאב בחזרה אל המסלול של אתמול.
   * ⚠️ **והוא ⛔ אינו ננעל כש-`places` ⛔ עדיין ריק** — הקריאה אסינכרונית, ונעילה
   * לפני שהיא חזרה הייתה הופכת את השורה כולה לאל-פעולה.
   */
  const placeRestored = useRef(false);

  useEffect(() => {
    if (placeRestored.current) return;
    if (parseModuleAnchor(window.location.hash) !== null) {
      placeRestored.current = true;
      return;
    }
    const last = latestStudyPlace(places);
    if (last === null) return;
    if (last.trackId !== active) {
      setActive(last.trackId);
      return;
    }
    placeRestored.current = true;
    const saved = studyPlaceForTrack(places, active);
    if (saved === null || saved.moduleId === null) return;
    const target = document.getElementById(moduleAnchorId(active, saved.moduleId));
    if (target === null) return;
    // ⛔ ההעדפה נקראת כאן ו⛔ לא ב-CSS — אותו דפוס כמו שתי הגלילות מעל.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  }, [places, active, modules]);

  const onTrackKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const index = STUDY_TRACKS.findIndex((track) => track.id === active);
      if (index < 0) return;
      const last = STUDY_TRACKS.length - 1;
      let next: number;
      if (event.key === 'ArrowLeft') next = index === last ? 0 : index + 1;
      else if (event.key === 'ArrowRight') next = index === 0 ? last : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      else return;
      event.preventDefault();
      const target = STUDY_TRACKS[next];
      if (!target) return;
      setActive(target.id);
      chipRefs.current.get(target.id)?.focus();
    },
    [active],
  );

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{TITLE_HE}</h1>
        <p className="text-sm text-ink-muted">{SUBTITLE_HE}</p>
      </header>

      <div>
        <div
          role="tablist"
          aria-label={TITLE_HE}
          className="flex flex-wrap gap-2"
        >
        {STUDY_TRACKS.map((track) => {
          const isActive = track.id === active;
          return (
            <button
              key={track.id}
              ref={(el) => {
                if (el) chipRefs.current.set(track.id, el);
                else chipRefs.current.delete(track.id);
              }}
              type="button"
              role="tab"
              id={`${TAB_ID_PREFIX}${track.id}`}
              aria-current={isActive ? 'true' : undefined}
              aria-selected={isActive}
              aria-controls={TRACK_PANEL_ID}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={onTrackKeyDown}
              onClick={() => setActive(track.id)}
              className={
                isActive
                  ? // F-036: the bare `--brand` mark colour is a 4.42:1 fill, never a
                    // text/chip background — the surface token at low opacity is the
                    // established fill here (components/StoryScreen.tsx:225).
                    'flex min-h-touch shrink-0 items-center gap-1.5 rounded-full border border-brand bg-brand-surface/20 px-2 text-xs font-bold text-brand-surface'
                  : 'flex min-h-touch shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-2 text-xs text-ink-muted'
              }
            >
              {isActive && <ActiveTrackMark />}
              {track.labelHe}
            </button>
          );
        })}
        </div>
        {/*
          ⓑ ⛔ סימני הגלישה של `T-330` הוסרו, ⛔ ולא הושתקו: `flex-wrap` אומר
          שהרצועה ⛔ לעולם ⛔ אינה גולשת ⇒ `hiddenStart`/`hiddenEnd` היו נמדדים
          `false` תמיד. קוד שתנאי הרינדור שלו ⛔ אינו יכול להתקיים הוא גרוע
          מקוד שאינו קיים — הקורא הבא מאמין לו.
        */}
      </div>

      {/*
        T-331ⓑ — `aria-selected="true"` הצהיר על פאנל ש⛔ לא היה קיים: `grep`
        על הקובץ החזיר **אפס** `role="tabpanel"` ו**אפס** `aria-controls`.
        ⇒ ההכרזה הצביעה על ⛔ כלום. כרטיס המצב **הוא** הפאנל — הוא כבר מציג את
        המסלול הנבחר ו⛔ רק אותו — ⇒ הוא מקבל את התפקיד, מזהה, ו-`aria-labelledby`
        אל השבב שבחר בו. ⛔ `tabIndex={0}` ⛔ אינו קישוט: פאנל בלי עצירת Tab
        ⛔ אינו נגיש במקלדת אחרי שהחיצים תפסו את השבבים.
      */}
      <div
        data-track-status
        id={TRACK_PANEL_ID}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`${TAB_ID_PREFIX}${active}`}
        className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-4"
        aria-live="polite"
      >
        <h2 className="text-base font-semibold text-ink">{trackLabelHe(active)}</h2>
        {metric.kind === 'loading' ? (
          /*
            `T-513` — שורת המדד בזמן טעינה: פס בגובה שורת `text-sm` (20px), ⛔ ולא
            הודעת הכשל. ⛔ `role="status"` ⛔ אינו נחוץ — הפאנל כולו כבר `aria-live`.
          */
          <>
            <p className="sr-only">{LOADING_HE}</p>
            <span
              aria-hidden="true"
              data-skeleton="metric"
              className={`block h-5 w-3/5 rounded-lg bg-border-subtle ${SKELETON_PULSE}`}
            />
          </>
        ) : metric.kind === 'unreachable' ? (
          <p className="text-sm text-ink-muted">{UNREACHABLE_HE}</p>
        ) : (
          <p className="text-sm text-ink-muted">{metric.summaryHe}</p>
        )}
        {/*
          T-351 — הדרך קדימה מהמסך. עד היום הפאנל כולו היה `<h2>` ו-`<p>`
          יחיד: הלומד בחר מסלול ו⛔ לא יכול היה להיכנס אליו. ⛔ שתי אפשרויות
          בלבד, ⛔ ואין שלישית: יעד בנוי ⇒ קישור אחד; ⛔ אין יעד ⇒ משפט עברי
          שאומר זאת. ⛔ אפס קישור אל מסך שאינו קיים.
          ⚠️ הקישור נשאר גם כש-`metric.kind === 'unreachable'` — ראה
          `destination` למעלה.
        */}
        {destination !== null ? (
          <Link
            href={destination.href}
            data-track-destination={active}
            className="mt-1 inline-flex min-h-touch w-full items-center justify-center rounded-full bg-brand-surface px-5 text-base font-semibold text-brand-on active:opacity-90"
          >
            {destination.labelHe}
          </Link>
        ) : (
          /*
            T-406ⓑ — עד היום זה היה משפט יחיד, ו⛔ אפס פעולה: היציאה היחידה
            מהפאנל הייתה סרגל הלשוניות. `ui-ux-pro-max` · `ux` · Feedback /
            Empty States אומר «Show helpful message **and action**» ⇒ ההצהרה
            נשארת, ו**מתחתיה** הדרך האחת שכן פתוחה עכשיו.
            ⛔ **אפס באנר תחזית** (`D-237` · `F-177` הוכרעה שם ו⛔ אינה נפתחת מחדש).
            ⛔ **ואפס קישור למסך שאינו קיים:** `trackFallbackAction` נגזרת
            מ-`trackDestination` עצמה.
          */
          <>
            <p data-track-destination="none" className="mt-1 text-sm text-ink-muted">
              {NO_DESTINATION_HE}
            </p>
            {fallback !== null && (
              <Link
                href={fallback.href}
                data-track-fallback={active}
                className="mt-1 inline-flex min-h-touch w-full items-center justify-center rounded-full border border-brand bg-brand-surface/20 px-5 text-base font-semibold text-brand-surface active:opacity-90"
              >
                {fallback.labelHe}
              </Link>
            )}
          </>
        )}
      </div>

      {/*
        🎯 **T-407 · נתיב המודולים** — `docs/design/kol-A-04-learning.png`, החצי
        התחתון, וערכי הפריסה מ-`render_video_A.py:1205-1264` (`screen_hub`):
        עמוד שדרה אנכי בקצה ה**התחלה** (‏RTL ⇒ ימין, `spine_x = LW - 46`), נקודת
        מצב בקוטר 30 עליו (`c.circ(spine_x, y + 34, 15)`), וכרטיס מודול משמאלו
        (`c.rr(28, y, LW - 100, 72, 16)`) — ⇒ `rounded-2xl`, מרווח 24px בין
        כרטיסים (‏96 − 72 ברנדר).

        🔬 **מה זה ממלא, נמדד בהליכה חיה 375×780:** מתחת לכרטיס-הסטטוס היחיד
        נשארו ⛔ ~375px ריקים עד הקיפול, והרנדר ממלא בדיוק את הרצועה הזאת.

        ⛔ **אפס זוהר על הנקודות** (D-110, מתועד בדוח): הרנדר נותן `glow` למודול
        הפעיל, אבל תקציב הזוהר הוא **שניים למסך** (חוקה שכבה ב3) ומספר המודולים
        «בתהליך» כאן **נגזר מנתונים** ⇒ ⛔ אי-אפשר לחסום אותו בשניים. ⇒ הערוץ
        שמסמן את הפעיל הוא המסגרת, האייקון והתווית.
      */}
      {/*
        `T-513` · **שלדי הנתיב** — אותה גאומטריה כמו המודול החי: נקודה 30px על עמוד
        השדרה, כרטיס `rounded-2xl`, ו-`gap-6` בין כרטיסים ⇒ כשהמודולים נכנסים, הדף
        ⛔ אינו זז. 🔬 **הגבהים נמדדו על `/dev/tabs/studies` ב-375px, ⛔ ולא מהרנדר:**
        כרטיס בלי פס 68.5px, כרטיס `'current'` עם הפס 84.5px ⇒ הראשון נושא פס (הרמה
        שהלומד באמצעה), השאר בלעדיו.
      */}
      {skeletons > 0 && (
        <ol aria-hidden="true" data-track-skeletons={active} className="relative flex flex-col gap-6">
          <span className="pointer-events-none absolute inset-y-3 start-[15px] w-0.5 -translate-x-1/2 bg-border-subtle" />
          {Array.from({ length: skeletons }, (_, i) => (
            <li key={i} data-skeleton="module" className="flex items-start gap-3">
              <span className="relative z-10 h-[30px] w-[30px] shrink-0 rounded-full border-2 border-border-subtle bg-surface" />
              <span
                className={`flex ${i === 0 ? 'h-[84.5px]' : 'h-[68.5px]'} flex-1 flex-col justify-center gap-2 rounded-2xl border border-border-subtle bg-surface-raised px-4 ${SKELETON_PULSE}`}
              >
                <span className="block h-4 w-1/3 rounded-md bg-border-subtle" />
                <span className="block h-3 w-2/3 rounded-md bg-border-subtle" />
                {i === 0 && <span className="block h-1.5 w-[90px] rounded-full bg-border-subtle" />}
              </span>
            </li>
          ))}
        </ol>
      )}
      {modules.length > 0 && (
        <ol data-track-modules={active} className="relative flex flex-col gap-6">
          {/*
            עמוד השדרה. `start-[15px]` הוא מרכז נקודת המצב, ו-`aria-hidden`
            כי הוא קישוט: הסדר עצמו כבר נאמר על ידי `<ol>`.
          */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-3 start-[15px] w-0.5 -translate-x-1/2 bg-border-subtle"
          />
          {modules.map((module) => {
            /**
             * `T-408`ⓐ · **כרטיס המודול נפתח.** `null` הוא מצב תקין ⛔ ולא פער:
             * רמה שאין בה מילים ⛔ אין לה מה לפתוח, והתווית הכתובה כבר אומרת זאת
             * במילים (`אין עדיין מילים`) ⛔ ולא בצבע בלבד (`36 § 12.7`).
             * ⛔ **וזה ⛔ אינו מנעול** — `R-017`: היעדר תוכן, ⛔ ולא היעדר רשות.
             */
            const itemHref = moduleItemHref(active, module);
            const cardClass =
              module.state === 'current'
                ? 'flex flex-1 flex-col gap-1 rounded-2xl border-2 border-brand bg-surface-raised px-4 py-3'
                : 'flex flex-1 flex-col gap-1 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3';
            const body = (
              <>
                <h3 className="text-[15px] font-semibold text-ink">{module.titleHe}</h3>
                {/*
                  ⛔ התווית הכתובה יושבת כאן ו⛔ לא באייקון בלבד — `36 § 12.7`.
                  ⛔ ו⛔ אין «נעול»: `R-017` אוסר נעילה בין רמות, ⵒ המצב השלישי
                  אומר **אין עדיין מילים**, שזו עובדה על המאגר ⛔ ולא על הלומד.
                */}
                <p
                  className={
                    module.state === 'done'
                      ? 'text-xs text-success'
                      : module.state === 'current'
                        ? 'text-xs text-brand-surface'
                        : 'text-xs text-ink-muted'
                  }
                >
                  {module.stateLabelHe} · {module.summaryHe}
                </p>
                {/*
                  פס ההתקדמות — הרנדר מצייר אותו אך ורק על המודול הפעיל
                  (`c.rr(46, y + 44, 90, 6, 3, ...)`), ⵒ כאן `progress !== null`
                  אך ורק ב-`'current'`. ⛔ `aria-hidden`: אותו מספר כבר נאמר
                  במילים בשורה שמעליו, וקורא-מסך ⛔ אינו צריך לשמוע אותו פעמיים.
                */}
                {module.progress !== null && (
                  <span
                    aria-hidden="true"
                    data-module-progress={module.id}
                    className="mt-1 block h-1.5 w-[90px] overflow-hidden rounded-full bg-border-subtle"
                  >
                    {/*
                      ⛔ מילוי `brand-surface` ו⛔ לא צבע הסימן העירום, והרנדר ⛔ אינו גובר כאן:
                      `F-036` מדד ש-`--brand` העירום הוא מילוי 4.42:1, ו-`lib/core/palette.test.ts`
                      הוא שער. ⵒ אותה החלטה בדיוק שכבר נלקחה בשבב הפעיל למעלה.
                    */}
                    <span
                      className="block h-full rounded-full bg-brand-surface"
                      style={{ width: `${Math.round(module.progress * 100)}%` }}
                    />
                  </span>
                )}
              </>
            );
            return (
            <li
              key={module.id}
              id={moduleAnchorId(active, module.id)}
              className="flex items-start gap-3 scroll-mt-4"
            >
              <span
                data-module-state={module.state}
                className={
                  module.state === 'done'
                    ? 'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-success bg-surface text-success'
                    : module.state === 'current'
                      ? 'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-brand bg-surface text-brand-surface'
                      : 'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface text-ink-muted'
                }
              >
                <ModuleStateMark state={module.state} />
              </span>
              {itemHref === null ? (
                <article className={cardClass}>{body}</article>
              ) : (
                /*
                  `T-408`ⓐ — הכרטיס כולו הוא יעד ההקשה, ⛔ ולא כפתור קטן בתוכו:
                  שלוש שורות על `py-3` הן הרבה מעל 44px, והשטח שהאצבע רואה הוא
                  השטח שהוא מקבל. ⛔ **ו⛔ אין כאן `data-primary-action`** — הפעולה
                  הראשית של המסך היא כניסת המסלול שבפאנל, ו-`check:mobile` סופר
                  בדיוק אחת למסך (`F-027`).
                */
                <Link
                  href={itemHref}
                  data-module-item={module.id}
                  // `T-409`ⓐ · «נכתב כשהפריט **מתחיל**». ⛔ ב-`onClick` ו⛔ לא
                  // בנתיב היעד: `<Link>` הוא מעבר בתוך אותה אפליקציה ⇒ הבקשה
                  // ⛔ אינה נקטעת, ולומד שפותח בלשונית חדשה עדיין מסמן.
                  onClick={() => savePlace(active, module.id)}
                  className={`${cardClass} active:opacity-90`}
                >
                  {body}
                </Link>
              )}
            </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
