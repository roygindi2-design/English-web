import Link from 'next/link';
import EnWord from '@/components/EnWord';
import type { CefrBand } from '@/lib/core/cefrLevels';

/**
 * כרטיס הרמה — `36 § 5` שורה 1, T-210ⓐ · D-123.
 *
 * 🎯 **הרנדר: `docs/design/kol-A-02-deck.png`**, ונלקח מ-`docs/design/render_video_A.py`
 * ‏(`screen_deck`, שורות 259–268) ⛔ ולא מהעין: כרטיס מוגבה עם מסגרת ב-`--brand`,
 * ‏`הרמה שלך` קטן ומעומעם, האות **גדולה** ב-`--brand-surface`, ‏`נקבעה במבחן הרמה`
 * מתחתיה, ושבב `שינוי רמה · הגדרות` בצד שמאל.
 *
 * ⛔ **קריאה בלבד, וזו כל ההכרעה של D-123.** ‏`36 § 5` פותח במשפט «**אין מעבר רמות
 * כאן**», ובמסך כפי שהיה נמדדו **שני** בוררי רמה — ענף `choose` ו-`<LevelPath>`. השבב
 * כאן הוא `<Link href="/settings">`, ⛔ ולא בורר: ⛔ אין `onChoose`, ⛔ אין state,
 * ⛔ ואין רשת של שש רמות. הבורר עצמו עבר ל`הגדרות` (T-211).
 *
 * ⚠️ **סטייה מוצהרת מהרנדר, ושכבה A היא שכפתה אותה** (`36 § 14.4`): ברנדר השבב הוא
 * מלבן בגובה **34px** (`render_video_A.py:267` — ‏`c.rr(44, 200, cw_, 34, 17, …)`),
 * כלומר **10px מתחת ל-44** שהחוקה דורשת. השבב נבנה ב-`min-h-touch`, והמספר שנמדד
 * רשום כאן ⛔ ולא נבלע. ⛔ «זה רק שבב» ⛔ אינו נימוק.
 */

const HEADING_HE = 'הרמה שלך';
const SOURCE_HE = 'נקבעה במבחן הרמה';
const CHANGE_HE = 'שינוי רמה · הגדרות';
/** ⛔ יעד אחד, ⛔ ולא נתיב חדש: `36 § 4` נותן ל`הגדרות` את הבית של שינוי הרמה. */
export const LEVEL_SETTINGS_HREF = '/settings';

/** גלגל שיניים — SVG מוטבע, ⛔ ולא אמוג׳י (חוקה שכבה A · § 6). */
function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="8" cy="8" r="2.4" />
      <path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3" />
    </svg>
  );
}

export default function LevelCard({ level }: { readonly level: CefrBand }): React.JSX.Element {
  return (
    <section
      data-level-card
      className="flex items-center justify-between gap-3 rounded-2xl border border-brand bg-surface-raised px-5 py-4"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm text-ink-muted">{HEADING_HE}</span>
        {/* ⛔ האות לעולם אינה לבדה — `נקבעה במבחן הרמה` מתחתיה היא התווית העברית
            שחוקה § 1 דורשת, ו-`<EnWord>` נושא את ה-bidi. */}
        <EnWord className="text-4xl font-black leading-none text-brand-surface">{level}</EnWord>
        <span className="text-xs text-ink-muted">{SOURCE_HE}</span>
      </div>

      {/* ⛔ `rounded-full` — שבב, לפי סולם חמשת הרדיוסים של שכבה ב׳ ולפי הרנדר
          (‏`r=17` על גובה 34 הוא גלולה). ⛔ `min-h-touch` ⛔ ולא 34px — שכבה A. */}
      <Link
        href={LEVEL_SETTINGS_HREF}
        className="flex min-h-touch flex-none items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm text-ink-muted active:opacity-90"
      >
        <GearIcon />
        {CHANGE_HE}
      </Link>
    </section>
  );
}
