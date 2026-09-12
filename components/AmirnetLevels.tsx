'use client';

import AmirnetTabs, { AMIRNET_BUILT_TABS } from '@/components/AmirnetTabs';
import type { AmirnetLevel } from '@/lib/core/amirnetPractice';

/**
 * מסך הכניסה לסימולציה של אמירנט — T-307 · `41 § 7` («ארבע רמות לפי סעיף 4, רמה נפתחת בהשלמת
 * הקודמת») · `41 § 4` (the four bands).
 * 🎯 Render: `docs/design/render_video_D.py` `screen_levels` (:195-235) and its `LEVELS` table
 * (:197-201). Every layout value below was grepped from that function.
 * ⚠️ Measured C-0550: `docs/design/` holds seven `kol-D-*` stills (`01-world` … `07-result`) and
 * ⛔ NO exported frame for this screen — it is drawn only inside the video (`scene_levels`). ⇒ the
 * function is the binding source here, ⛔ and nothing on this screen came from a picture.
 *
 * ⛔ Draws only (T-307ⓕ). ⛔ No `lib/core` module, ⛔ no API route, ⛔ no migration: `unlockedThrough`
 * ARRIVES as a prop, because how a level gets unlocked is `T-309`'s question and a component that
 * answered it would be a second place for that answer to live.
 *
 * ── Declared layer-A gaps. The accessibility gates override the render (36 § 14.4), and every one
 *    of these is a measured number, ⛔ not a taste call:
 *      · summary sub-line   render 10.5px (:208)     ⇒ built 14px — `check:text-floor`
 *      · level description  render 11.5px (:219)     ⇒ built 14px
 *      · locked reason      render 11px (:227-228)   ⇒ built 14px
 *      · band chip          render 11.5px (:222-224) ⇒ built 14px. It is a LABEL, ⛔ not a target,
 *                           so the 44px floor does ⛔ not apply to it
 *      · level card         render r=17 (:215)       ⇒ built 16 — the five-value scale (D-102) has
 *                           ⛔ no 17, and adding a sixth value is a finding, ⛔ not a fix here
 *      · summary card       render r=14 (:204)       ⇒ built 12, same reason
 *      · open card          render h=104 (:215)      ⇒ `min-h-touch`, and the WHOLE card is the target
 *      · locked card        render colour+opacity only (:216-218) ⇒ opacity AND the word `נעול` AND
 *                           the written reason AND `aria-disabled` — state is ⛔ never colour alone
 * ── Declared deviation, and the only one that is not a size (T-307ⓔ). The render prints
 *    `הושלם · 71` · `הושלם · 104` · `הכי גבוה · 112` on the three open cards (:197-200, :230) and a
 *    progress bar under each (:231-233). **Those are score-estimate numbers**, and `41 § 9.2` puts
 *    the score formula with Roy (`03-for-roy` item 73). ⇒ they are ⛔ not built, and the bar goes
 *    with them: a bar whose fill is derived from a score we ⛔ do not compute is an invented
 *    statistic, which is worse than an absent one. ⛔ Nothing replaces them.
 * ── The state line sits at the CARD'S LEFT EDGE, where the render draws it (:230 `anchor="lm"`,
 *    x=36 · :227-228 the lock at x=48). Inside that line the icon leads the words in RTL order,
 *    which is the product's own idiom everywhere else — the render's left-to-right icon-then-text
 *    is a drawing order, ⛔ not a layout value (`RULES § 0.22`, one reversible call, logged).
 * ── `ui-ux-pro-max` ux › Interaction › Disabled States («Don't: Confuse disabled with normal
 *    state») is why a locked card is ⛔ not a button at all — ⛔ not a greyed-out one.
 * ── The render is dark; the product is light (36 § 14.2, Roy 11/09). The background is ⛔ not a gap.
 */

export interface AmirnetLevelRow {
  readonly level: AmirnetLevel;
  /** `41 § 4` «סיווג», in the render's own `רמה N · <סיווג>` shape (:197-200). */
  readonly nameHe: string;
  /** `41 § 4` «רצועה». LTR digits — Hebrew around it, the number itself reads left to right. */
  readonly band: string;
  /** `41 § 4` «מאפיין», verbatim. */
  readonly descHe: string;
}

/** The four levels of `41 § 4`, cell for cell. ⛔ Not re-worded, ⛔ not re-ordered. */
export const AMIRNET_LEVEL_ROWS: readonly AmirnetLevelRow[] = Object.freeze([
  { level: 1, nameHe: 'רמה 1 · בסיסי', band: '50–84', descHe: 'אוצר מילים בסיסי · משפטים קצרים' },
  { level: 2, nameHe: 'רמה 2 · מתקדמים א׳', band: '85–110', descHe: 'מילות קישור · משפטים מורכבים' },
  { level: 3, nameHe: 'רמה 3 · מתקדמים ב׳', band: '111–133', descHe: 'אוצר מילים אקדמי · הסקה' },
  { level: 4, nameHe: 'רמה 4 · פטור', band: '134–150', descHe: 'טקסטים ארוכים · ניואנס וטון' },
] as const);

export const KICKER_HE = 'העולם · אמירנט';
export const HEADING_HE = 'סימולציה מלאה';
export const SUMMARY_HE = '6 פרקים · 23 שאלות · 39 דקות';
export const ADAPTIVE_NOTICE_HE = 'אדפטיבי בין פרקים, כמו במבחן האמיתי';
/** The state, as a WORD on the card. ⛔ Never the border colour alone. */
export const OPEN_LABEL_HE = 'פתוח';
export const LOCKED_LABEL_HE = 'נעול';
/** The way out of the locked state, written where a learner reads it (render :227-228). */
export const lockedReasonHe = (level: AmirnetLevel): string => `עבור רמה ${level - 1} כדי לפתוח`;

export interface AmirnetLevelsProps {
  /** The highest level the learner has unlocked. Level 1 is ⛔ always open (T-309ⓓ). */
  readonly unlockedThrough: AmirnetLevel;
  /** Called ⛔ only for an unlocked level. `T-308` wires it to the engine. */
  readonly onStart?: (level: AmirnetLevel) => void;
}

/** SVG, ⛔ never an emoji (the constitution's frozen layer). */
function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LevelCardBody({ row, unlocked }: { readonly row: AmirnetLevelRow; readonly unlocked: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className={unlocked ? 'text-base font-bold text-ink' : 'text-base font-bold text-ink-muted'}>
          {row.nameHe}
        </h3>
        <span
          dir="ltr"
          className={
            unlocked
              ? 'rounded-full border border-brand bg-brand-surface/15 px-3 py-1 text-sm font-bold text-brand-surface'
              : 'rounded-full border border-border-strong px-3 py-1 text-sm font-bold text-ink-muted'
          }
        >
          {row.band}
        </span>
      </div>

      <p className="mt-1 text-sm text-ink-muted">{row.descHe}</p>

      {unlocked ? (
        <p className="mt-3 flex justify-end text-sm font-semibold text-brand-surface">{OPEN_LABEL_HE}</p>
      ) : (
        <p className="mt-3 flex items-center justify-end gap-2 text-sm text-ink-muted">
          <LockIcon />
          <span className="font-semibold">{LOCKED_LABEL_HE}</span>
          <span>{lockedReasonHe(row.level)}</span>
        </p>
      )}
    </>
  );
}

export default function AmirnetLevels({ unlockedThrough, onStart }: AmirnetLevelsProps) {
  return (
    <section>
      <header className="pt-2">
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
        <AmirnetTabs active="simulation" built={AMIRNET_BUILT_TABS} />
      </header>

      <div className="mt-6 rounded-xl border border-border-subtle bg-surface-raised p-4">
        <p className="text-base font-bold text-ink">{SUMMARY_HE}</p>
        <p className="mt-1 text-sm text-ink-muted">{ADAPTIVE_NOTICE_HE}</p>
      </div>

      <ul className="mt-4 space-y-3">
        {AMIRNET_LEVEL_ROWS.map((row) => {
          const unlocked = row.level <= unlockedThrough;
          return (
            <li key={row.level}>
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => onStart?.(row.level)}
                  className="min-h-touch w-full rounded-2xl border-2 border-brand bg-surface-raised p-4 text-right"
                >
                  <LevelCardBody row={row} unlocked />
                </button>
              ) : (
                // ⛔ Not a button and ⛔ not a link — a locked level is ⛔ not something to press.
                <div
                  aria-disabled="true"
                  className="rounded-2xl border border-border-subtle bg-surface-raised p-4 opacity-70"
                >
                  <LevelCardBody row={row} unlocked={false} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
