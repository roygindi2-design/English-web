'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import EnWord from '@/components/EnWord';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

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
 *
 * 🆕 **מצב שלישי — T-238ⓑ · `D-183`.** הכפתור ⛔ אינו הופך ל-«נוספה לחזרה» עד
 * שהכתיבה חוזרת `ok` בפועל (`status === 'added'`): `'pending'` משאיר את אותו כפתור
 * על מקומו, מנוטרל (⛔ בלי מחרוזת חדשה — אין ספינר לנצח, יש מניעת לחיצה כפולה
 * בלבד). `'error'` מציג `FAILURE_HE.save` **וגם** כפתור `RETRY_HE` שמריץ מחדש את
 * אותה קריאה — ⛔ אפס מחרוזת חדשה, ⛔ אפס מסך שני (חוקה שכבה A: וי ⛔ לעולם לא
 * שקרי). זהו **מצב שלישי של הרכיב הקיים**, ⛔ לא רכיב חדש ו⛔ לא מסך חדש.
 *
 * 🆕 **T-290 · `D-209` · סוגר את `F-167`.** עד היום הרכיב **נקרא** «פופאובר» והיה
 * בלוק זרימה (`mt-2 w-full`) מתחת לפסקה: פתיחתו דחפה את הטקסט, ובמסך צר המילה
 * שהוקשה יצאה מהתצוגה. ⇒ עכשיו הוא **מעוגן** (`absolute`) בתוך כרטיס הגוף,
 * ממורכז על המילה שהוקשה, נצמד לשוליים כששתי הפינות ⛔ אינן נכנסות, ומתהפך
 * מעליה כשאין מקום מתחתיה. ⛔ **הטקסט ⛔ אינו זז ולו פיקסל** — זו כל נקודת הממצא.
 * ⛔ **`36 § 7` ⛔ לא השתנה:** הקוד מתיישר למפרט, ⛔ ולא להפך.
 *
 * 🆕 **T-319 · WCAG 2.2 AA «Focus Not Obscured (Minimum)» · המשך של T-290.** העיגון
 * שסגר את `F-167` פתח פגם שני: `absolute` **מכסה**, ובעוד הבלוק הזורם הקודם דחף
 * ו⛔ לא הסתיר, החלונית יושבת מעל מילים שנשארו יעדי הקשה ומיקוד. ⇒ מדידה חיה
 * ב-C-0561: מתוך 7 מילות יעד, **3** הוחזרו מ-`elementFromPoint` כ⛔ לא-עצמן.
 * ⛔ **והתיקון ⛔ אינו כאן אלא ב-`StoryScreen`**, כי הוא בעלים של הפסקה: כל עוד
 * החלונית פתוחה הפסקה `inert` ⇒ ⛔ אף מילה מתחתיה ⛔ אינה יעד, `Escape` והקשה בחוץ
 * סוגרים, והמיקוד חוזר **למילה שהוקשה**. כאן יושבת רק המדידה (`stolenWordCount`)
 * ו-`role="dialog"`, שבלעדיו ⛔ אין לקורא-מסך מה להכריז כשהחלונית נפתחת.
 * ⛔ **⛔ ואין מלכודת מיקוד** — זו חלונית, ⛔ לא מודאל.
 *
 * 🆕 **T-378 · `docs/design/kol-A-05-story.png` · `36 § 7`.** שני פגמים שנמדדו חי,
 * ⛔ ולא הוסקו: ⓐ ⛔ **שום דבר ⛔ לא קשר את החלונית למילה** — `getAttribute('class')`
 * על המילה שהוקשה החזיר מחרוזת **זהה** לפני ההקשה ואחריה, ו-`aria-expanded` החזיר
 * `null`. ⓑ **החלונית חרגה 74px מתחתית הכרטיס** שהיא אמורה להיות מעוגנת בתוכו, והם
 * ישבו **מעל** «סיימתי לקרוא». ⇒ שלושה תיקונים, כולם ברכיב אחד: `popoverTopFor`
 * חוסם אנכית לגובה המכולה (‏`popoverWidthFor` עשה זאת לרוחב ⛔ ולבדו), `popoverTailLeft`
 * מצביע על המילה, ו-`aria-expanded` + שבב המצב יושבים ב-`StoryScreen` שהוא בעל המילה.
 * ⛔ **⛔ ואין כאן מחרוזת חדשה** — `36 § 7` נוקב ב-`ADD_HE`/`ADDED_HE` מילה במילה (`F-266`).
 *
 * ⚠️ **טבעת המיקוד (ⓓ) ⛔ אינה נכתבת כאן בשנית:** `app/globals.css:72` מגדיר
 * `:focus-visible { outline: 3px solid var(--brand) }` **גלובלית**, ושלושת הפקדים
 * כאן ⛔ אינם מכבים אותה. ⇒ מחלקה מקומית הייתה כפילות שמתפצלת ביום שהאסימון זז.
 */

/** ⛔ מספרים, ⛔ ולא «בערך» — הבדיקה מודדת מולם. */
export const POPOVER_GAP = 8;
export const POPOVER_GUTTER = 8;
export const POPOVER_MAX_WIDTH = 288;
/** צלע הריבוע המסובב שמשמש זנב. ⛔ נמדד ברנדר כמשולש שנכנס לקצה העליון של החלונית. */
export const POPOVER_TAIL = 10;
/** ⛔ הזנב ⛔ אינו נוגע בפינה המעוגלת — `rounded-2xl` הוא 16, ו-4 נוספים הם נשימה. */
export const POPOVER_TAIL_INSET = 20;

/** מיקום המילה שהוקשה, **יחסית לכרטיס הגוף** — ⛔ ולא ל-viewport. */
export interface WordAnchor {
  readonly top: number;
  readonly bottom: number;
  readonly centerX: number;
}

export interface AnchorBox {
  readonly containerWidth: number;
  readonly containerHeight: number;
  readonly popoverHeight: number;
}

export interface AnchorPlacement {
  readonly left: number;
  readonly top: number;
  readonly placement: 'below' | 'above';
}

/**
 * ⛔ **פונקציה טהורה, ולכן ניתנת למדידה בבדיקה** — כל חשבון המיקום יושב כאן, ו⛔ לא
 * מפוזר ב-JSX. `lib/core/**` ⛔ אינו הבית שלה: היא גיאומטריה של הרכיב הזה בלבד.
 */
export function popoverWidthFor(containerWidth: number): number {
  return Math.max(0, Math.min(POPOVER_MAX_WIDTH, containerWidth - POPOVER_GUTTER * 2));
}

/**
 * 🔴 **T-378 ⓒⓘⓘⓘ — המקבילה האנכית של `popoverWidthFor`, ו⛔ עד היום ⛔ לא הייתה אחת.**
 *
 * 🔬 **נמדד ב-`next start` 375×780, ⛔ ולא שוער:** תחתית כרטיס הגוף `y≈598` מול תחתית
 * החלונית `y≈672` ⇒ **74px** יושבים **מעל** «סיימתי לקרוא». הסיבה היא שהענף האחרון של
 * `popoverPlacement` החזיר `below` **בלי חסם**: כשהחלונית ⛔ אינה נכנסת מתחת למילה
 * ו⛔ גם ⛔ אינה נכנסת מעליה, הקוד בחר `below` וזלג החוצה.
 * ⇒ העיגון של `T-290`/`D-209` — «מעוגן **בתוך** כרטיס הגוף» — הוא אינווריאנטה, ⛔ ולא
 * העדפה, ⇒ המיקום נחסם לגובה **המכולה**, בדיוק כמו שהרוחב נחסם לרוחבה.
 *
 * ⛔ **וחלונית גבוהה מהמכולה ⛔ אינה שגיאה שמטפלים בה כאן:** היא נצמדת לשוליים העליונים
 * ו⛔ אין מה לחסום — `Math.max` הוא מה שמונע `top` שלילי.
 */
export function popoverTopFor(
  preferredTop: number,
  containerHeight: number,
  popoverHeight: number,
): number {
  const maxTop = containerHeight - popoverHeight - POPOVER_GUTTER;
  return Math.round(Math.max(POPOVER_GUTTER, Math.min(preferredTop, maxTop)));
}

/**
 * 🔴 **T-378 ⓒⓘⓘ — הזנב, ו⛔ הוא ⛔ אינו קישוט.**
 *
 * אחרי החסימה האנכית והאופקית החלונית כבר ⛔ אינה בהכרח צמודה למילה ⇒ **המיקום שלה
 * ⛔ אינו אומר על מה היא**. הזנב יושב על `anchor.centerX`, באותו מרחב קואורדינטות של
 * `left`, ⇒ הוא מצביע על המילה גם כשהחלונית נדחפה הצדה.
 * ⛔ **והוא נחסם לגוף החלונית** — זנב שיוצא מהפינה המעוגלת נראה כמו פגם, ⛔ לא כמו חץ.
 */
export function popoverTailLeft(
  anchorCenterX: number,
  popoverLeft: number,
  popoverWidth: number,
): number {
  const center = anchorCenterX - popoverLeft;
  const min = POPOVER_TAIL_INSET;
  const max = Math.max(min, popoverWidth - POPOVER_TAIL_INSET);
  return Math.round(Math.min(Math.max(center, min), max));
}

export function popoverPlacement(anchor: WordAnchor, box: AnchorBox): AnchorPlacement {
  const width = popoverWidthFor(box.containerWidth);
  const maxLeft = Math.max(POPOVER_GUTTER, box.containerWidth - width - POPOVER_GUTTER);
  const left = Math.round(Math.min(Math.max(anchor.centerX - width / 2, POPOVER_GUTTER), maxLeft));

  const below = anchor.bottom + POPOVER_GAP;
  const above = anchor.top - POPOVER_GAP - box.popoverHeight;
  const fitsBelow = below + box.popoverHeight <= box.containerHeight;
  if (!fitsBelow && above >= 0) {
    return { left, top: popoverTopFor(above, box.containerHeight, box.popoverHeight), placement: 'above' };
  }
  return { left, top: popoverTopFor(below, box.containerHeight, box.popoverHeight), placement: 'below' };
}

/** מלבן, בקואורדינטות של אותו מרחב שבו נמדדו המילים. */
export interface PopoverRect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

/**
 * T-319 · WCAG 2.2 AA «Focus Not Obscured (Minimum)» — **אריתמטיקה, ⛔ ולא עין.**
 *
 * מילה **נגנבת** כששני הדברים מתקיימים יחד: ⓐ היא עדיין מציגה את עצמה כיעד הקשה
 * ומיקוד, ⓑ **מרכזה** נופל בתוך מלבן החלונית ⇒ ההקשה הולכת לחלונית, והטבעת מצוירת
 * על אלמנט שאיש ⛔ אינו רואה.
 *
 * ⛔ **ולכן `interactive === false` מאפס את הספירה בהגדרה:** כשפסקת הקריאה `inert`,
 * ⛔ אין שם יעד ⇒ ⛔ אין מה לגנוב. זה מה שסוגר את הקריטריון — ⛔ ולא טבעת יפה יותר.
 */
export function stolenWordCount(
  popover: PopoverRect,
  words: readonly PopoverRect[],
  interactive: boolean,
): number {
  if (!interactive) return 0;
  return words.filter((w) => {
    const cx = (w.left + w.right) / 2;
    const cy = (w.top + w.bottom) / 2;
    return cx >= popover.left && cx <= popover.right && cy >= popover.top && cy <= popover.bottom;
  }).length;
}

const ADD_HE = 'הוסף לכרטיסיות';
const ADDED_HE = 'נוספה לחזרה';
const CLOSE_HE = 'סגור';

/** ⛔ ⛔ אין רכיב שלישי — `'idle' | 'pending' | 'added' | 'error'`, אותו כפתור בכל ארבעה. */
export type WordPopoverStatus = 'idle' | 'pending' | 'added' | 'error';

export interface WordPopoverProps {
  readonly word: string;
  readonly translationHe: string;
  readonly posHe: string;
  readonly status: WordPopoverStatus;
  readonly onAdd: () => void;
  readonly onClose: () => void;
  /** ⛔ המילה שהוקשה, יחסית לכרטיס הגוף. `null` ⇒ ⛔ אין עיגון — ⛔ ואין פופאובר. */
  readonly anchor: WordAnchor | null;
  readonly containerWidth: number;
  readonly containerHeight: number;
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
  status,
  onAdd,
  onClose,
  anchor,
  containerWidth,
  containerHeight,
}: WordPopoverProps): React.JSX.Element | null {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  /**
   * ⛔ `useLayoutEffect` ⛔ ולא `useEffect`: הוא רץ **לפני הצביעה**, ולכן ההיפוך
   * מתרחש בלי שהלומד רואה ולו פריים אחד במקום הלא נכון.
   */
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (el !== null) setHeight(el.offsetHeight);
  }, [word, translationHe, posHe, status, containerWidth]);

  if (anchor === null) return null;

  const width = popoverWidthFor(containerWidth);
  const { left, top, placement } = popoverPlacement(anchor, {
    containerWidth,
    containerHeight,
    popoverHeight: height,
  });
  const tailLeft = popoverTailLeft(anchor.centerX, left, width);

  return (
    <div
      ref={boxRef}
      data-word-popover
      data-word-popover-placement={placement}
      dir="rtl"
      role="dialog"
      aria-label={word}
      style={{ position: 'absolute', top, left, width }}
      className="z-20 rounded-2xl border border-brand/75 bg-surface-raised px-4 py-4 text-center shadow-lg"
    >
      {/* 🔴 **T-378 ⓒⓘⓘ — הזנב מצביע על המילה שהוקשה.**
          ⛔ **ריבוע מסובב, ⛔ ולא `border`-משולש:** רק כך יש לו **שתי צלעות מסגרת**
          שממשיכות את `border-brand/75` של החלונית, והשלישית מוסתרת מאחורי הרקע שלה.
          ⛔ **`aria-hidden`** — הקישור לקורא-מסך יושב ב-`aria-expanded` על המילה
          עצמה (`StoryScreen`), ⛔ ולא באלמנט דקורטיבי.
          ⚠️ `overflow` ⛔ אינו נחתך: הזנב יוצא מגבול החלונית במכוון, ולכן
          `rounded-2xl` ⛔ אינו יכול לשבת על מכולה שחותכת. */}
      <span
        aria-hidden
        data-word-popover-tail
        style={{
          position: 'absolute',
          left: tailLeft - POPOVER_TAIL / 2,
          width: POPOVER_TAIL,
          height: POPOVER_TAIL,
          ...(placement === 'below'
            ? { top: -POPOVER_TAIL / 2 }
            : { bottom: -POPOVER_TAIL / 2 }),
        }}
        className={[
          'block rotate-45 border-brand/75 bg-surface-raised',
          placement === 'below' ? 'border-l border-t' : 'border-b border-r',
        ].join(' ')}
      />
      <p className="text-sm text-ink-muted">
        <EnWord>{word}</EnWord>
      </p>
      <p className="mt-1 text-2xl font-bold leading-tight text-ink">{translationHe}</p>
      {posHe === '' ? null : <p className="mt-1 text-xs text-brand-surface">{posHe}</p>}

      {status === 'added' ? (
        <p className="mt-3 inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-lg border border-success bg-success/20 px-4 text-sm font-bold text-success">
          <CheckIcon />
          {ADDED_HE}
        </p>
      ) : status === 'error' ? (
        <>
          <p className="mt-3 text-sm text-danger">{FAILURE_HE.save}</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 inline-flex min-h-touch w-full items-center justify-center rounded-lg border-2 border-danger px-4 text-sm font-bold text-danger active:opacity-90"
          >
            {RETRY_HE}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          disabled={status === 'pending'}
          className="mt-3 inline-flex min-h-touch w-full items-center justify-center rounded-full bg-brand-surface px-4 text-sm font-bold text-brand-on active:opacity-90 disabled:opacity-60"
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
