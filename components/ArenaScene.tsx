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

/** צלליות הקהל — מלבנים בגבהים משתנים, ⛔ ולא דמויות: הן **מעל** החומה ורחוקות. */
const CROWD: readonly number[] = [4, 7, 5, 8, 6, 9, 5, 7, 4, 8, 6, 5, 9, 6, 7, 5];

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
        {/* הילת הלפיד — ⛔ רדיאלית, ⛔ ולא עיגול אטום: לפיד הוא **אור**, ⛔ ולא נורה. */}
        <radialGradient id="arena-torch">
          <stop offset="0%" stopColor="var(--arena-gold-light)" stopOpacity="0.85" />
          <stop offset="55%" stopColor="var(--arena-gold)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--arena-gold)" stopOpacity="0" />
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

      {/* ⓑ הקהל — מעל החומה, ⛔ בלי פרצופים. אטימות נמוכה = מרחק. */}
      {CROWD.map((h, i) => (
        <rect
          key={`crowd-${String(i)}`}
          x={i * 6.25 + 0.6}
          y={HORIZON - 12 - h * 0.45}
          width="5"
          height={h * 0.45 + 12}
          rx="1.6"
          fill="var(--arena-stone-dark)"
          opacity="0.75"
        />
      ))}

      {/* ⓒ חומת האבן — שלוש שורות לבנים בהיסט לסירוגין, כמו כל חומה אמיתית. */}
      <rect x="0" y={HORIZON - 14} width="100" height="14" fill="var(--arena-stone-dark)" />
      {[0, 1, 2].map((row) =>
        Array.from({ length: 8 }, (_, col) => (
          <rect
            key={`brick-${String(row)}-${String(col)}`}
            x={col * 13 - (row % 2 === 0 ? 0 : 6.5)}
            y={HORIZON - 14 + row * 4.7}
            width="12"
            height="3.9"
            rx="0.6"
            fill="var(--arena-stone)"
            opacity="0.55"
          />
        )),
      )}

      {/* ⓓ לפידים — הילה, ואז הלהבה עצמה. ⛔ ארבעה, במרווחים שווים, כמו ברנדר. */}
      {[12, 37, 63, 88].map((x) => (
        <g key={`torch-${String(x)}`}>
          <circle cx={x} cy={HORIZON - 7} r="7" fill="url(#arena-torch)" />
          <rect x={x - 0.5} y={HORIZON - 6} width="1" height="5" rx="0.4" fill="var(--arena-stone-dark)" />
          <ellipse cx={x} cy={HORIZON - 7.4} rx="1.1" ry="1.7" fill="var(--arena-gold-light)" />
        </g>
      ))}

      {/* ⓔ הרצפה — **טרפז**, ⛔ ולא מלבן. שתי הצלעות מתכנסות אל נקודת המגוז, וזו
          נקודת הפרספקטיבה כולה בשורה אחת. */}
      <polygon
        points={`0,100 100,100 ${String(VANISHING_X + 26)},${String(HORIZON)} ${String(VANISHING_X - 26)},${String(HORIZON)}`}
        fill="url(#arena-floor)"
      />

      {/* ⓕ קווי הרצפה — ⛔ מתכנסים אל המגוז. זה החיווי שהופך משטח למישור. */}
      {[-24, -12, 0, 12, 24].map((offset) => (
        <line
          key={`lane-${String(offset)}`}
          x1={VANISHING_X + offset * 3.4}
          y1="100"
          x2={VANISHING_X + offset * 0.42}
          y2={HORIZON}
          stroke="var(--arena-ink)"
          strokeWidth="0.18"
          opacity="0.07"
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
    </svg>
  );
}
