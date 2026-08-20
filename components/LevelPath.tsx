'use client';

import EnWord from '@/components/EnWord';
import type { CefrBand } from '@/lib/core/cefrLevels';
import { buildLevelPath } from '@/lib/core/levelPath';
import { LEVEL_LABELS_HE, type LevelSummary } from '@/lib/core/levelSummary';

/**
 * שורה 6 של § 4.2ז — מפת שש הרמות (T-084 · D-037 · R-017).
 *
 * ⛔ **משחוק בלי רצפים ובלי שערים.** כל שישה השבבים ניתנים להקשה תמיד: אין סף שליטה
 * אמפירי (D-037), ולכן ⛔ אין «רמה נעולה», ⛔ אין «עדיין לא שלטת» ו⛔ אין אחוז שנקרא
 * כמוכנות. השבב היחיד שאינו ניתן להקשה הוא רמה **שאין בה מילים במאגר**, והוא מוצג
 * **מושבת עם המספר 0** ⛔ ולא מוסתר.
 *
 * ⛔ **צבע אינו הערוץ היחיד** (חוקה § 1): לצד כל טבעת יש המספר `known/total`, תווית
 * עברית, ו-`aria-current` על הנוכחית. לומד דויטרנופי רואה בדיוק את אותו מידע.
 *
 * ⛔ **הרכיב אינו כותב לשרת.** ההקשה קוראת ל-`onChoose`, והמסך שמעליו הוא שמדבר עם
 * `POST /api/levels/current` — אותו נתיב שמצב הבחירה של T-081 כבר משתמש בו, בלי
 * שינוי. שני כותבים לאותה עמודה הם שני מקורות אמת.
 */

const HEADING_HE = 'שש הרמות';
const CURRENT_HE = 'הרמה שלך';
const EMPTY_HE = 'עדיין אין מילים ברמה הזאת';

/** גיאומטריית הטבעת. r=20 ⇒ היקף 2πr ≈ 125.66, וזה כל מה שהיא צריכה לדעת. */
const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function LevelPath({
  levels,
  current,
  onChoose,
  busy,
}: {
  readonly levels: readonly LevelSummary[];
  readonly current: CefrBand | null;
  readonly onChoose: (band: CefrBand) => void;
  readonly busy: boolean;
}): React.JSX.Element {
  const chips = buildLevelPath(levels, current);

  return (
    <section className="flex flex-col gap-3" data-level-path>
      <h2 className="text-xl font-semibold">{HEADING_HE}</h2>
      {/* שלוש בשורה ב-375: שבב של 44px+ עם טבעת ומספר ⛔ אינו נכנס שש בשורה
          בלי לגלוש, ושתי שורות של שלושה הן המסלול שהמפרט מתאר. */}
      <ul className="grid list-none grid-cols-3 gap-3 p-0">
        {chips.map((chip) => {
          const label = `${chip.known}/${chip.totalInLevel}`;
          const body = (
            <>
              {/* הטבעת. `currentColor` בכוונה: הצבע מגיע מ-`text-brand`/`text-ink-muted`
                  שעל האלמנט, ⛔ ואין בקובץ הזה ולו ערך צבע אחד (חוקה § 6). */}
              <svg
                viewBox="0 0 48 48"
                aria-hidden="true"
                className={chip.isEmpty ? 'h-12 w-12 text-ink-muted' : 'h-12 w-12 text-brand'}
              >
                <circle
                  cx="24"
                  cy="24"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="4"
                  className="text-border-subtle"
                  stroke="currentColor"
                />
                <circle
                  cx="24"
                  cy="24"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeDasharray={`${(chip.percent / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <EnWord className="text-lg font-semibold">{chip.band}</EnWord>
              {/* ⛔ התווית המספרית לצד הטבעת — היא, ⛔ ולא הצבע, נושאת את המידע. */}
              <span className="text-sm text-ink-muted">{label}</span>
              <span className="text-xs text-ink-muted">
                {chip.isCurrent ? CURRENT_HE : LEVEL_LABELS_HE[chip.band]}
              </span>
            </>
          );

          return (
            <li key={chip.band}>
              {chip.isEmpty ? (
                // ⛔ מושבת **עם המספר**, ⛔ ולא מוסתר ו⛔ ולא «נעול»: הרמה קיימת,
                // המאגר עדיין ריק, וזו עובדה על המוצר ⛔ ולא שיפוט על הלומד.
                // ⛔ לא התכונה `disabled` — השבב נשאר במיקוד כדי שקורא מסך ימצא אותו.
                <button
                  type="button"
                  aria-disabled="true"
                  title={EMPTY_HE}
                  className="flex w-full min-h-touch flex-col items-center gap-1 rounded-lg border border-border-subtle px-2 py-3 text-ink-muted"
                >
                  {body}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChoose(chip.band)}
                  disabled={busy}
                  aria-current={chip.isCurrent ? 'true' : undefined}
                  className={[
                    'flex w-full min-h-touch flex-col items-center gap-1 rounded-lg px-2 py-3 text-ink active:opacity-90',
                    chip.isCurrent ? 'border-2 border-border-strong' : 'border border-border-subtle',
                  ].join(' ')}
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
