'use client';

import EnWord from '@/components/EnWord';

/**
 * הפופאובר של הקשה על מילה — T-187 · `36 § 7`.
 *
 * 🎯 **הרנדר: `docs/design/kol-A-05-story.png`**, בלוק הפופאובר של
 * `docs/design/render_video_A.py` (שורות 1010–1032), ⛔ ולא מהעין: המילה באנגלית
 * ב-`INK_MUTED` למעלה · התרגום בניקוד גדול ומודגש · חלק הדיבר ב-`BRAND_SURFACE` ·
 * **כפתור אחד** «הוסף לכרטיסיות» על `BRAND_SURFACE` ברדיוס 10 → `rounded-lg`, שאחרי
 * הכתיבה הופך ל-«נוספה לחזרה» עם וי על `SUCCESS`.
 *
 * ⛔ **הלומד לוחץ — המוצר ⛔ אינו לוחץ** (אותה אינווריאנטה כמו T-180): ⛔ אין כאן
 * הוספה אוטומטית, ⛔ אין ניקוד ו⛔ אין «נכון/לא נכון». § 4.2יג סעיף 3: «⛔ אין טעות
 * בקריאה, ולכן ⛔ אין ציון».
 *
 * ⛔ **מצב «נוספה» ⛔ אינו צבע בלבד** (חוקה שכבה A): וי מצויר **ו**מילה כתובה.
 * ⛔ אמוג'י אסור — SVG מוטבע, בדיוק כמו `components/CloseIcon.tsx`.
 */

const ADD_HE = 'הוסף לכרטיסיות';
const ADDED_HE = 'נוספה לחזרה';
const CLOSE_HE = 'סגור';

export interface WordPopoverProps {
  readonly word: string;
  readonly translationHe: string;
  readonly posHe: string;
  readonly added: boolean;
  readonly onAdd: () => void;
  readonly onClose: () => void;
}

function CheckIcon() {
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
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

export default function WordPopover({
  word,
  translationHe,
  posHe,
  added,
  onAdd,
  onClose,
}: WordPopoverProps): React.JSX.Element {
  return (
    <div
      data-word-popover
      dir="rtl"
      className="mt-2 w-full rounded-2xl border border-brand/75 bg-surface-raised px-4 py-4 text-center"
    >
      <p className="text-sm text-ink-muted">
        <EnWord>{word}</EnWord>
      </p>
      <p className="mt-1 text-2xl font-bold leading-tight text-ink">{translationHe}</p>
      {posHe === '' ? null : <p className="mt-1 text-xs text-brand-surface">{posHe}</p>}

      {added ? (
        <p className="mt-3 inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-lg border border-success bg-success/20 px-4 text-sm font-bold text-success">
          <CheckIcon />
          {ADDED_HE}
        </p>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 inline-flex min-h-touch w-full items-center justify-center rounded-lg bg-brand-surface px-4 text-sm font-bold text-brand-on active:opacity-90"
        >
          {ADD_HE}
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-2 inline-flex min-h-touch w-full items-center justify-center rounded-lg border border-border-strong px-4 text-sm text-ink-muted active:opacity-90"
      >
        {CLOSE_HE}
      </button>
    </div>
  );
}
