import { ARENA_SCENE_HE } from '@/lib/core/arenaScene';

/**
 * 🏟️ **הזירה כ**מקום** — ⟦NEW 15/09 · `C-0623` · `T-361` · הוראת רוי⟧**
 *
 * 🔬 **הרנדר הוא המפרט, ⛔ ולא טעם.** ‏`36 § 14.4` קובע שהרנדר מחייב בפריסה, בסדר,
 * בהיררכיה ובגימור — ו-`docs/design/kol-B-03-battle.png` מצייר **מקום**: שמי לילה עם
 * כוכבים, קהל צלליות, חומת אבן עם לפידים, ורצפה ש**נסוגה** אל תוך המסך עם פסולת
 * שקטנה ככל שהיא רחוקה. ⇒ עד היום הבמה הייתה `<div>` כהה עם שתי דמויות **בשורה
 * שטוחה, באותו גודל** ⛔ ובלי רצפה, ⛔ בלי חומה ו⛔ בלי אופק.
 *
 * 🔴 **וזה בדיוק מה שהופך אותו ל«לא נראה כמו משחק»:** ⛔ בלי אופק ⛔ אין עומק, ובלי
 * עומק שתי דמויות באותו גודל הן שני אייקונים זה לצד זה. **העומק ⛔ אינו קישוט — הוא
 * מה שאומר ללומד מי רחוק ומי קרוב.**
 *
 * ## ⛔ למה SVG אחד ו⛔ לא WebGL
 *
 * ⚖️ **נשקל והוכרע, ⛔ ולא נבחר בעצלות.** תלת-ממד אמיתי (‏`three.js`) עולה ~600KB
 * דחוסים, הקשר WebGL, וסוללה — על מוצר **למידה** שרץ על טלפון, שכל תקציב הביצועים
 * שלו הולך ל-`verify` של 1,980 בדיקות ולזמן התנעה שכבר נמדד כבעיה (`F-255`).
 * ⇒ **הפרספקטיבה כאן אמיתית** — נקודת מגוז אחת, רצפה טרפזית, וסקאלה שיורדת עם
 * המרחק — והיא עולה **אפס בתים של תלות**. ⛔ זו ⛔ אינה «דמוי תלת-ממד»: זו בדיוק
 * הפרספקטיבה שהרנדר עצמו מצייר.
 * 📎 **ומה שכן היה דורש WebGL** — מודלים מסתובבים, תאורה דינמית, חלקיקים באלפים —
 * ⛔ אינו בשום רנדר של `37`, ⇒ הוא היה **המצאה**, ⛔ ולא בנייה.
 *
 * ## ⛔ והסט **סטטי**, וזו החלטה
 *
 * ⛔ **⛔ אין ריצוד לפידים ו⛔ אין הבהוב כוכבים.** ‏T-041 (עקרון הקוהרנטיות של Mayer)
 * אוסר **קישוט שמתחרה בתוכן**, והתוכן כאן הוא מילה שצריך לתרגם תחת שעון. ⇒ תקציב
 * התנועה הולך ל**הטלה, לפגיעה ולקלפים** — למה שהלומד **עשה** — ⛔ ולא לרקע שמנצנץ
 * בזמן שהוא חושב. הסט הוא **תפאורה מצוירת**, וזה מה שתפאורה עושה.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב:** ⛔ אפס `useState`, ⛔ אפס `useEffect`, ⛔ אפס
 * `requestAnimationFrame` — אותו כלל בדיוק של `ArenaStage`, ומאותה סיבה.
 * ⛔ **ו⛔ אין כאן צבע גולמי:** כל ערך הוא טוקן של הזירה (`37 § 13.5`), ⇒ `check:mobile`
 * ממשיך למדוד ניגודיות מול ערכים מוצהרים.
 */
export interface ArenaSceneProps {
  /** ⛔ ברירת המחדל מכסה את מלוא ההורה. ⛔ הרכיב ⛔ אינו קובע גודל משלו. */
  readonly className?: string;
}

/**
 * ⛔ **המספרים האלה הם גאומטריה, ⛔ ולא טעם.** ‏`viewBox` של 100×100 נותן לכל ערך
 * לקרוא כאחוז מהבמה, ⇒ הסט מתנהג זהה ב-320 וב-414 בלי ולו שאילתת מדיה אחת.
 * ‏`HORIZON` הוא הקו שבו החומה פוגשת את הרצפה: הכול מעליו **רחוק**, הכול מתחתיו
 * **קרוב**, וזה הכלל היחיד שהסצנה הזאת אוכפת.
 */
const HORIZON = 46;

/** נקודת המגוז — מרכז אופקי, על האופק. ⇒ הרצפה מתכנסת אליה, ⛔ ולא אל פינה. */
const VANISHING_X = 50;

/**
 * 🏃 **`T-433`ⓑ · `37 § 5` — שלושה נתיבים ⇒ **ארבעה** גבולות.**
 *
 * ⛔ **המספר נגזר מהמכניקה, ⛔ ולא נבחר לפי אסתטיקה:** `LANE_NAMES` ב-`lib/core/battle.ts`
 * מחזיק שלושה ערכים, ⇒ הרצפה חייבת להראות שלושה.
 */
const LANES = 3;
/** גבולות הנתיבים בחזית הרצפה (`y=100`), ביחידות ה-`viewBox`. */
export const LANE_EDGES = Array.from({ length: LANES + 1 }, (_, i) => (i * 100) / LANES);

/**
 * חצי-רוחב הרצפה בחזית ובאופק. ⛔ **שני המספרים היו מוטבעים ב-`points` של המצולע**
 * (`0,100 100,100` ו-`VANISHING_X ± 26`), ⇒ הם קיימים כאן כדי שהרצפה וקווי
 * הנתיבים ישאבו מאותו מקור **אחד**.
 */
export const FLOOR_HALF_NEAR = 50;
export const FLOOR_HALF_FAR = 26;

/**
 * 🔴 **⟦תוקן 19/09 · `C-0733`⟧ קו הנתיב מתכנס **בדיוק כמו הרצפה**, ⛔ ולא במקדם משלו.**
 *
 * 🔬 **נמדד, ⛔ ולא שוער:** המקדם הישן (`offset * 3.4` בחזית מול `offset * 0.42`
 * באופק) הוליד קווים שהתכנסו **מהר יותר** מהמצולע — ⇒ קו השפה נחת על `43.8`
 * באופק בעוד פינת הרצפה שם על `24`. כלומר קווי הנתיבים ⛔ **לא שכבו על הרצפה**,
 * ושתי שכבות של אותה פרספקטיבה סיפרו שני סיפורים.
 *
 * ⇒ היחס הוא `FLOOR_HALF_FAR / FLOOR_HALF_NEAR` — **אותה הצטמקות בדיוק**, ⇒ שני
 * הגבולות החיצוניים נוחתים על פינות המצולע, וזו הראיה שהם על אותו מישור.
 */
export function laneEdgeAtHorizon(x: number): number {
  return VANISHING_X + (x - VANISHING_X) * (FLOOR_HALF_FAR / FLOOR_HALF_NEAR);
}

/** חצי-רוחב הרצפה בעומק `y` (יחידות `viewBox`). ⛔ אינטרפולציה ליניארית — הרצפה **מצולע**. */
export function floorHalfWidthAt(y: number): number {
  const t = (y - HORIZON) / (100 - HORIZON);
  return FLOOR_HALF_FAR + (FLOOR_HALF_NEAR - FLOOR_HALF_FAR) * t;
}

/**
 * 🛣️ **⟦19/09 · `C-0733`⟧ כמה זז הלומד בין נתיבים — **נגזר**, ⛔ ולא מכוונן.**
 *
 * 🔬 **הפגם שזה מתקן, נמדד בדפדפן חי ב-393×852 ⛔ ולא הונח:** `C-0730` חילק את
 * **רוחב הבמה** לשלושה ⇒ `33.3333%`. ⛔ אבל הבמה ⛔ אינה הרצפה — הרצפה היא
 * **מצולע שמתכנס**, ⇒ בנתיב השמאלי הלומד עמד על **הרקע הכהה מחוץ לרצפה**, ונראה
 * מרחף ⛔ ולא עומד בזירה.
 *
 * ⇒ **אותו כלל שלישים בדיוק, על הרוחב הנכון:** חצי-רוחב הרצפה ב**מרכז גופה של
 * הדמות** — הנקודה שהעין קוראת כ«איפה היא עומדת» — ⇒ מרכזי הנתיבים על `±⅔` ממנו.
 *
 * ⛔ **ומרכז הגוף ⛔ ולא כפות הרגליים:** ברגליים הרצפה כמעט ברוחב מלא, ⇒ הכלל היה
 * מחזיר את אותם `33%` ואת אותו פגם. הדמות גבוהה כ-29% מהבמה, ⇒ הצללית שלה
 * חוצה **פס עומק** שלם, והגבול האמיתי הוא באמצעו.
 */
export const HERO_SLOT_BOTTOM = 2;
export const HERO_SLOT_HEIGHT = 42;
export const LANE_SHIFT_PCT =
  (2 / 3) * floorHalfWidthAt(100 - HERO_SLOT_BOTTOM - HERO_SLOT_HEIGHT / 2);

/**
 * ⛔ הפסולת על הרצפה **קטנה ככל שהיא רחוקה**, וזה החישוב היחיד כאן. מיקום ורדיוס
 * נגזרים מטבלה קבועה ⛔ ולא מ-`Math.random`: רקע שמשתנה בכל רינדור הוא רקע שאי-אפשר
 * לכתוב עליו בדיקה, וזה בדיוק מה ש-`arenaWords` כבר החליט על התמהיל.
 */
const DEBRIS: readonly { readonly x: number; readonly y: number; readonly r: number }[] = [
  { x: 12, y: 58, r: 0.7 }, { x: 31, y: 52, r: 0.5 }, { x: 68, y: 51, r: 0.5 },
  { x: 88, y: 57, r: 0.7 }, { x: 22, y: 71, r: 1.0 }, { x: 78, y: 69, r: 0.9 },
  { x: 47, y: 63, r: 0.6 }, { x: 60, y: 78, r: 1.2 }, { x: 35, y: 85, r: 1.3 },
  { x: 90, y: 88, r: 1.4 }, { x: 8, y: 82, r: 1.1 },
];

/**
 * 🏛️ **⟦24/09 · `C-0784` · `T-448` · `D-277`ⓒ⟧ מקדש פתוח — ⛔ ולא מרתף.**
 * 🎨 **הגאומטריה נקראה מ-Figma, ⛔ ולא נבחרה:** `get_metadata` על `53:5` ⟨«הזירה — רקע
 * פתוח», `kZcjKncSFidYBAyuf9tOpm` עמוד 07⟩ — מסגרת 345×330 שהאופק שלה ב-`y=152`, כלומר
 * **46%**, ⇒ `HORIZON` של הקובץ הזה ⛔ לא זז, ו⛔ אף טרפז ⛔ לא זז. כל ערך למטה הוא ה-`y`
 * או ה-`x` של Figma חלקי 330 או 345:
 * ```
 * temple/lintel   y 96  h 14   ⇒ 29.1 · 4.2        temple/col-N  w 32 ⇒ 9.3 · y 116..152 ⇒ 35.2..46
 * temple/cap-N    y 108 h 10   ⇒ 32.7 · 3.0        col-shade     w 9  ⇒ 2.6, בצד ימין
 * cols x          12·84·156·228·300 ⇒ 3.5 · 24.3 · 45.2 · 66.1 · 87
 * hills/far·near  y 122·132    ⇒ 37 · 40           ground/grass  y 152 ⇒ 46 (מתחת לאופק כולו)
 * ```
 * 🔴 **והדשא ⛔ אינו מתחת לדמות — זו מגבלת העיצוב עצמו, ⛔ ולא שלי:** הכותונת `fig-teal`
 * והדשא `fig-leaf` ⇒ שני ירוקים ⇒ הדמות עומדת **תמיד על אבן** ⟨הטרפז⟩, והדשא גדל
 * **מחוצה לו** בלבד. ⛔ **אפס טוקן צבע חדש** — `fig-leaf` · `fig-leaf-shade` · `fig-stone` ·
 * `fig-stone-shade`, ארבעתם כבר נמדדו לדמויות.
 */
const COLUMNS: readonly number[] = [3.5, 24.3, 45.2, 66.1, 87];

/**
 * 🚩 `D-277`ⓒ — **דגלים על הווו של הקהל.** אחד על כל עמוד, ⇒ «הקהל קם» הופך ל«הדגלים
 * מתנופפים» ⛔ בלי ששום כלל ב-CSS ⛔ ושום בדיקה ⛔ יאבדו את הווו. ⛔ **ו⛔ לא נגעתי במפתח**:
 * `data-arena-crowd` נשאר השם, כי הוא **הערוץ** (`§ 11` א8), ⛔ ולא הציור.
 */
const FLAGS: readonly number[] = COLUMNS.map((x) => x + 4.65);

/**
 * 🔥 `D-277`ⓒ — **מדורות על הווו של הלפידים**, על הדשא משני צדי השביל.
 * 🔬 **והמיקום נגזר מהטרפז, ⛔ ולא נבחר בעין:** חצי-רוחב השביל ב-`y` הוא
 * `26 + 24·(y−46)/54` ⇒ ב-`y=56` השביל נגמר ב-`19.6`/`80.4`, וב-`y=74` ב-`12.4`/`87.6`
 * ⇒ המדורות יושבות ב-`9`/`91` וב-`4`/`96` — **על דשא**, ⛔ אף אחת ⛔ לא בנתיב.
 * ⛔ **ארבע, כמו הלפידים** ⇒ `:nth-child` ו-`check:mobile` רואים את אותו מספר.
 */
const FIRES: readonly { readonly x: number; readonly y: number; readonly r: number }[] = [
  { x: 9, y: 56, r: 5.5 }, { x: 91, y: 56, r: 5.5 }, { x: 4, y: 74, r: 7 }, { x: 96, y: 74, r: 7 },
];

/** 🌿 קני הדשא לאורך שפת השביל — מחושבים מאותה נוסחת טרפז, ⇒ ⛔ אף אחד ⛔ לא חוצה אותו. */
const TUFTS: readonly { readonly x: number; readonly y: number; readonly s: number }[] = [48, 52, 57, 63, 70, 78, 87, 96]
  .flatMap((y) => {
    const half = FLOOR_HALF_FAR + ((FLOOR_HALF_NEAR - FLOOR_HALF_FAR) * (y - HORIZON)) / (100 - HORIZON);
    const s = 0.8 + (y - HORIZON) / 30;
    return [{ x: VANISHING_X - half - 1.2 - s, y, s }, { x: VANISHING_X + half + 1.2, y, s }];
  });

/**
 * 🪨 **⟦24/09 · `C-0782` · `F-316`⟧ הרצפה היא **עפר עם סדקים וגחלים**, ⛔ ולא גרדיאנט חלק.**
 * 🔬 **נקרא ב-`diff:render` מול `kol-B-03-battle.png` (QA, `C-0771`):** הרנדר מצייר על
 * הרצפה ⓐ **טבעת זימון מוארת** — אליפסות קונצנטריות בזהב חם סביב רגלי היריב, רחבה
 * כמעט כמו הרצפה; ⓑ **סדקים** — קווים קצרים ונטויים; ⓒ **גחלים** — נקודות כתומות
 * קטנות. החי צייר רק את הגרדיאנט ⇒ במה שטוחה.
 * ⛔ **טבלאות קבועות, ⛔ ולא `Math.random`** — אותו נימוק של `DEBRIS` למעלה.
 * ⛔ **וסטטי:** ⛔ אף אחד מהשלושה ⛔ אינו זז (`T-041`) — הם תפאורה, ⛔ ולא תגובה.
 */
const CRACKS: readonly { readonly x: number; readonly y: number; readonly dx: number; readonly dy: number }[] = [
  { x: 14, y: 62, dx: 4, dy: -2.2 }, { x: 82, y: 60, dx: -3.4, dy: 1.6 },
  { x: 26, y: 90, dx: 5, dy: -1.4 }, { x: 70, y: 84, dx: 4.6, dy: 2 },
  { x: 92, y: 74, dx: -2.8, dy: -1.8 },
];
const EMBERS: readonly { readonly x: number; readonly y: number }[] = [
  { x: 11, y: 66 }, { x: 25, y: 60 }, { x: 64, y: 56 }, { x: 84, y: 51 },
  { x: 18, y: 78 }, { x: 40, y: 72 }, { x: 88, y: 79 }, { x: 58, y: 92 },
  { x: 6, y: 94 }, { x: 94, y: 90 },
];

export default function ArenaScene({ className = '' }: ArenaSceneProps): React.JSX.Element {
  return (
    <svg
      data-arena-scene
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        {/* ⛔ שמי לילה — כהים למעלה, מתבהרים אל האופק. זה מה שעין קוראת כ**מרחק**. */}
        <linearGradient id="arena-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--arena-night)" />
          <stop offset="100%" stopColor="var(--arena-stone-dark)" />
        </linearGradient>
        {/* הרצפה — בהירה באופק וכהה בקדמת הבמה, ⇒ המבט **נופל פנימה**. */}
        <linearGradient id="arena-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--arena-stone)" />
          <stop offset="100%" stopColor="var(--arena-stone-dark)" />
        </linearGradient>
        {/* 🌿 `T-448` — הדשא כהה באופק ומתבהר קדימה, ⛔ אותו כיוון מבט כמו הרצפה. */}
        <linearGradient id="arena-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--arena-fig-leaf-shade)" />
          <stop offset="100%" stopColor="var(--arena-fig-leaf)" stopOpacity="0.7" />
        </linearGradient>
        {/* 🪨 `F-316`ⓐ — טבעת הזימון: **טבעות**, ⛔ ולא כתם. עצירות לסירוגין בהיר/שקוף הן
            מה שהרנדר מצייר כאליפסות קונצנטריות; המרכז חם ומתכהה החוצה. */}
        <radialGradient id="arena-ring">
          <stop offset="0%" stopColor="var(--brand-surface)" stopOpacity="0.34" />
          <stop offset="18%" stopColor="var(--brand)" stopOpacity="0.26" />
          <stop offset="30%" stopColor="var(--brand)" stopOpacity="0.12" />
          <stop offset="42%" stopColor="var(--brand)" stopOpacity="0.22" />
          <stop offset="56%" stopColor="var(--brand)" stopOpacity="0.08" />
          <stop offset="70%" stopColor="var(--brand)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </radialGradient>
        {/* הילת הלפיד — ⛔ רדיאלית, ⛔ ולא עיגול אטום: לפיד הוא **אור**, ⛔ ולא נורה. */}
        <radialGradient id="arena-torch">
          <stop offset="0%" stopColor="var(--brand-surface)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--brand)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <title>{ARENA_SCENE_HE}</title>

      {/* ⓐ שמיים + כוכבים. הכוכבים הם נקודות בגדלים שונים ⇒ שדה ⛔ ולא רשת. */}
      <rect x="0" y="0" width="100" height={HORIZON} fill="url(#arena-sky)" />
      {[[6, 6, 0.5], [17, 11, 0.35], [29, 5, 0.4], [41, 13, 0.3], [53, 7, 0.45],
        [64, 12, 0.3], [76, 6, 0.5], [88, 12, 0.35], [95, 4, 0.3], [23, 17, 0.3],
        [70, 18, 0.35], [47, 20, 0.28]].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="var(--arena-ink)" opacity="0.55" />
      ))}

      {/* ⓑ גבעות — רחוקה ואז קרובה, ⛔ מתחת לאופק בקצת: הן מה שנראה **בין** העמודים. */}
      <polygon points={`0,${String(HORIZON)} 0,39 18,37 38,39.5 60,37.5 82,39 100,37.5 100,${String(HORIZON)}`} fill="var(--arena-fig-leaf-shade)" opacity="0.45" />
      <polygon points={`0,${String(HORIZON)} 0,41.5 22,40 45,42 70,40 100,41.5 100,${String(HORIZON)}`} fill="var(--arena-fig-leaf-shade)" opacity="0.8" />

      {/* ⓒ הדשא — כל מה שמתחת לאופק. הטרפז של השביל נצבע **מעליו** (ⓔ), ⇒ הדשא נשאר
          בקצוות בלבד, בדיוק כמו ב-`53:10`/`53:11`. */}
      <rect x="0" y={HORIZON} width="100" height={100 - HORIZON} fill="url(#arena-grass)" />

      {/* ⓓ הקולונדה — משקוף, ראשי עמודים, עמודים וצד מוצל. ⛔ **ו⛔ אין קיר:** השמיים
          נראים בין העמודים, וזה כל ההבדל בין מקדש פתוח למרתף. */}
      <rect x="0" y="29.1" width="100" height="4.2" fill="var(--arena-fig-stone)" />
      <rect x="0" y="32.1" width="100" height="1.5" fill="var(--arena-fig-stone-shade)" />
      {COLUMNS.map((x) => (
        <g key={`col-${String(x)}`}>
          <rect x={x - 0.9} y="32.7" width="11" height="3" fill="var(--arena-fig-stone)" />
          <rect x={x} y="35.2" width="9.3" height={HORIZON - 35.2} fill="var(--arena-fig-stone)" />
          <rect x={x + 6.7} y="35.2" width="2.6" height={HORIZON - 35.2} fill="var(--arena-fig-stone-shade)" />
        </g>
      ))}

      {/* 🚩 הדגלים — על המשקוף. 🏟️ **⟦`C-0751` · `§ 11` א8⟧ `data-arena-crowd` — וו, ⛔ ולא תנועה.**
          ⛔ **הרכיב עדיין ⛔ אינו מנפיש דבר**: הכלל חי ב-`arcade-tokens.css` ותלוי
          ב-`data-arena-impact` ⇒ הדגלים ⛔ אינם זזים בזמן שהלומד חושב, **אך ורק** ברגע
          שהוא פגע. ↩️ **והקבוצה ⛔ אינה קישוט מבני:** היא קיימת כדי שההשהיה המדורגת
          תיכתב ב-CSS כ-`:nth-child` ⛔ ולא ברכיב (`ArenaStage.test.ts` — «⛔ אין אנימציה בסט»). */}
      {FLAGS.map((x) => (
        <rect key={`pole-${String(x)}`} x={x - 0.25} y="21" width="0.5" height="8.1" fill="var(--arena-fig-stone-shade)" />
      ))}
      <g data-arena-crowd-row>
        {FLAGS.map((x) => (
          <polygon
            key={`flag-${String(x)}`}
            data-arena-crowd
            points={`${String(x + 0.25)},21 ${String(x + 6)},22.6 ${String(x + 0.25)},24.4`}
            fill="var(--brand)"
            opacity="0.85"
          />
        ))}
      </g>

      {/* 🔥 המדורות — הילה, בולי עץ, להבה. 🔥 **⟦`C-0751` · `§ 11` א8⟧ «לפידים מתלקחים».**
          ⛔ **על ההילה, ⛔ ולא על הלהבה:** מדורה ש**מתלקחת** שופכת יותר **אור**. ⇒ הווו
          יושב על `<circle>` של השיפוע הרדיאלי. ⛔ **ו-`transform-box: fill-box` חי ב-CSS** —
          בלעדיו `scale` על צומת SVG מתייחס לראשית ה-`viewBox` ⇒ ההילה הייתה **נעה**. */}
      {FIRES.map((f) => (
        <g key={`fire-${String(f.x)}-${String(f.y)}`}>
          <circle data-arena-torch cx={f.x} cy={f.y - f.r * 0.3} r={f.r} fill="url(#arena-torch)" />
          <rect x={f.x - f.r * 0.32} y={f.y - f.r * 0.08} width={f.r * 0.64} height={f.r * 0.14} rx="0.3" fill="var(--arena-fig-wand)" />
          <ellipse cx={f.x} cy={f.y - f.r * 0.3} rx={f.r * 0.16} ry={f.r * 0.26} fill="var(--brand-surface)" />
        </g>
      ))}

      {/* ⓔ הרצפה — **טרפז**, ⛔ ולא מלבן. שתי הצלעות מתכנסות אל נקודת המגוז, וזו
          נקודת הפרספקטיבה כולה בשורה אחת. */}
      <polygon
        points={`0,100 100,100 ${String(VANISHING_X + FLOOR_HALF_FAR)},${String(HORIZON)} ${String(VANISHING_X - FLOOR_HALF_FAR)},${String(HORIZON)}`}
        fill="url(#arena-floor)"
      />

      {/* 🪨 `F-316`ⓐ — טבעת הזימון סביב רגלי היריב (החריץ שלו נגמר על האופק). */}
      <ellipse data-arena-ring cx={VANISHING_X} cy={HORIZON + 7} rx="38" ry="8" fill="url(#arena-ring)" />

      {/* 🪨 `F-316`ⓑ — סדקים: קצרים, נטויים, כהים. */}
      {CRACKS.map((c) => (
        <line
          key={`crack-${String(c.x)}-${String(c.y)}`}
          data-arena-crack
          x1={c.x}
          y1={c.y}
          x2={c.x + c.dx}
          y2={c.y + c.dy}
          stroke="var(--arena-night)"
          strokeWidth="0.35"
          opacity="0.5"
        />
      ))}

      {/* ⓕ קווי הרצפה — ⛔ מתכנסים אל המגוז. זה החיווי שהופך משטח למישור.

          🔴 **⟦19/09 · `C-0730` · `T-433`ⓑ⟧ ארבעה קווים, ⛔ ולא חמישה — והמספר
             ⛔ אינו נבחר כאן.** חמישה קווים מחלקים את הרצפה ל-**ארבע** רצועות,
             והמכניקה מגדירה **שלושה** נתיבים (`37 § 5` · `D-269` הכרעה ①). ⇒ העין
             קראה ארבעה מקומות לעמוד בהם במשחק שיש בו שלושה, והדמות הייתה נוחתת
             **על קו** במקום בתוך רצועה.

          🔬 **והמיקום נגזר, ⛔ ולא מכוונן בעין:** `--arena-lane-shift` מזיז את
             הדמות ב-**⅓ מרוחב הבמה** ⇒ הגבולות יושבים על 0 · ⅓ · ⅔ · 1 של הרוחב,
             ומרכזי הנתיבים נופלים בדיוק באמצע כל רצועה. */}
      {LANE_EDGES.map((x) => (
        <line
          key={`lane-${String(x)}`}
          x1={x}
          y1="100"
          x2={laneEdgeAtHorizon(x)}
          y2={HORIZON}
          stroke="var(--arena-ink)"
          strokeWidth="0.18"
          opacity="0.07"
        />
      ))}

      {/* 🌿 קני דשא על שפת השביל — ⛔ מחוץ לטרפז (`TUFTS`), ⇒ הדמות עדיין על אבן. */}
      {TUFTS.map((t) => (
        <polygon
          key={`tuft-${String(t.x)}-${String(t.y)}`}
          points={`${String(t.x)},${String(t.y)} ${String(t.x + t.s * 0.5)},${String(t.y - t.s * 1.2)} ${String(t.x + t.s)},${String(t.y)}`}
          fill="var(--arena-fig-leaf)"
          opacity="0.8"
        />
      ))}

      {/* ⓖ פסולת — קטנה ורחוקה למעלה, גדולה וקרובה למטה. */}
      {DEBRIS.map((d) => (
        <ellipse
          key={`debris-${String(d.x)}-${String(d.y)}`}
          cx={d.x}
          cy={d.y}
          rx={d.r}
          ry={d.r * 0.45}
          fill="var(--arena-night)"
          opacity="0.38"
        />
      ))}

      {/* 🪨 `F-316`ⓒ — גחלים: נקודות זהב קטנות, ⛔ ולא חלקיקים שזזים. */}
      {EMBERS.map((e) => (
        <circle
          key={`ember-${String(e.x)}-${String(e.y)}`}
          data-arena-ember
          cx={e.x}
          cy={e.y}
          r="0.55"
          fill="var(--brand)"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}
