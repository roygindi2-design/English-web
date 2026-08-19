import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';

/**
 * הדמות של הזירה — T-096 · § 4.2י · חוקה § 6.
 *
 * ⛔ **אפס נכס מיוצר, אפס CDN, אפס אמוג'י.** התקציב הוא אפס (`BUDGET_NOTE`), ולכן הדמות
 * היא שכבות SVG מוטבעות שנכתבו כאן — ⛔ ולא תמונה שמישהו צריך לייצר, לארח או לשלם עליה.
 * אמוג'י נפסל מאותה סיבה שנפסל ב-`LockIcon`: משקלו וגובהו של גליף מגיעים מהגופן שפותר
 * אותו ⛔ ולא מהקוד, והוא נראה אחרת בשלושת הגופנים של החוקה.
 *
 * ⛔ **אפס hex.** כל שכבה היא `<g className="text-…">` עם `currentColor`, ולכן היא מתחלפת
 * עם ערכת הצבעים בלי ולו ערך צבע אחד בקובץ הזה.
 *
 * ⛔ **אינו רכיב לקוח ואין לו מצב:** ציור בלבד. שדה טקסט חופשי לשם הדמות ⛔ אינו בתחולה
 * (F-067: ל-`arcade_progress` אין עמודת שם ו-`POST /api/arcade/result` אינו כותב אחת ⇒
 * בקרה שאינה נשמרת היא בקרה מזויפת).
 *
 * ⚠️ **`ARCADE_ITEMS` הוא המקור היחיד לרשימת הפריטים** (`lib/core/arcadeResult.ts:34`), והמפה
 * מוקלדת מולו — `Record<(typeof ARCADE_ITEMS)[number], …>` ⇒ פריט שישי ⛔ אינו מהדר, ופריט
 * חסר ⛔ אינו מהדר. זה מה שמונע רשימה שנייה שסוטה מהראשונה.
 */

export interface ArenaAvatarProps {
  // פריטים שנפתחו. ⛔ שם שאינו ב-`ARCADE_ITEMS` מדולג בשקט.
  readonly items: readonly string[];
  readonly role: 'hero' | 'enemy';
  readonly className?: string;
}

type ArcadeItem = (typeof ARCADE_ITEMS)[number];

/**
 * שמות הפריטים בעברית — **מפה אחת בריפו**, ומיוצאת. מסך הסיום מייבא אותה במקום להחזיק
 * עותק שני: שם פריט בשתי צורות הוא בדיוק הפגם ש-`LockIcon` נולד כדי לסגור.
 */
export const ITEM_LABELS_HE: Record<ArcadeItem, string> = {
  helmet: 'קסדה',
  cape: 'גלימה',
  lantern: 'פנס',
  boots: 'מגפיים',
  banner: 'דגל',
};

const ROLE_LABEL_HE: Record<ArenaAvatarProps['role'], string> = {
  hero: 'הדמות שלך',
  enemy: 'היריב',
};

/** צבע התפקיד. ⛔ לעולם אינו הערוץ היחיד — השם הנגיש נושא את אותה הבחנה (חוקה § 1). */
const ROLE_CLASS: Record<ArenaAvatarProps['role'], string> = {
  hero: 'text-brand',
  enemy: 'text-ink-muted',
};

const BACKGROUND_CLASS = 'text-surface-raised';
const OUTLINE_CLASS = 'text-ink';

/** שכבת פריט אחת לכל מפתח. חמישה מפתחות בדיוק — הטיפוס אוכף את זה. */
const ITEM_LAYERS: Record<(typeof ARCADE_ITEMS)[number], React.JSX.Element> = {
  helmet: (
    <g key="helmet" className={OUTLINE_CLASS} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 26a14 14 0 0 1 28 0" />
      <path d="M16 26h32" />
    </g>
  ),
  cape: (
    <g key="cape" className={BACKGROUND_CLASS} fill="currentColor">
      <path d="M20 40 12 78h10l4-30zM44 40l8 38H42l-4-30z" />
    </g>
  ),
  lantern: (
    <g key="lantern" className={OUTLINE_CLASS} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="50" y="52" width="10" height="12" rx="2" />
      <path d="M55 52v-6" />
    </g>
  ),
  boots: (
    <g key="boots" className={OUTLINE_CLASS} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M24 78v6h8v-6M40 78v6h8v-6" />
    </g>
  ),
  banner: (
    <g key="banner" className={OUTLINE_CLASS} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 34v46" />
      <path d="M8 34h14l-4 7 4 7H8z" />
    </g>
  ),
};

export default function ArenaAvatar({
  items,
  role,
  className,
}: ArenaAvatarProps): React.JSX.Element {
  // הסינון עובר על הרשימה הקנונית ⛔ ולא על הקלט: כך הסדר קבוע, ושם שאינו ברשימה נופל
  // בשקט במקום לצייר שכבה ריקה.
  const worn = ARCADE_ITEMS.filter((name) => items.includes(name));
  const label =
    worn.length === 0
      ? ROLE_LABEL_HE[role]
      : `${ROLE_LABEL_HE[role]}, ${worn.map((name) => ITEM_LABELS_HE[name]).join(', ')}`;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 64 96"
      className={['h-40 w-auto', className].filter(Boolean).join(' ')}
      fill="none"
    >
      {/* שכבה 1 — רקע */}
      <g className={BACKGROUND_CLASS} fill="currentColor">
        <rect x="0" y="0" width="64" height="96" rx="12" />
      </g>

      {/* שכבה 2 — גוף */}
      <g className={ROLE_CLASS[role]} fill="currentColor">
        <path d="M24 40h16a6 6 0 0 1 6 6v32H18V46a6 6 0 0 1 6-6z" />
      </g>

      {/* שכבה 3 — ראש */}
      <g className={ROLE_CLASS[role]} fill="currentColor">
        <circle cx="32" cy="28" r="11" />
      </g>

      {/* שכבה 4 — פריטים, בסדר הקנוני של `ARCADE_ITEMS` */}
      {worn.map((name) => ITEM_LAYERS[name])}
    </svg>
  );
}
