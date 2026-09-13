'use client';

import { useState } from 'react';
import AmirnetTabs, { AMIRNET_BUILT_TABS } from '@/components/AmirnetTabs';
import { TYPE_BAR_CLASS } from '@/components/amirnetTypeBar';
import EnWord from '@/components/EnWord';
import {
  AMIRNET_LEVELS,
  LEVEL_CHIP_HE,
  practiceReady,
  type AmirnetLevel,
  type AmirnetPracticeType,
  type AmirnetTypeCard,
} from '@/lib/core/amirnetPractice';

/**
 * תפריט התרגול של אמירנט — T-286 · 41 § 7 («הלשונית נפתחת בתפריט בחירה, לא בשאלה») · 41 § 8 item 1.
 * 🎯 Render: docs/design/kol-D-03-practice-menu.png, drawn by render_video_D.py `screen_practice_menu`
 * (:102-141). Every layout value below was grepped from that function, ⛔ not eyeballed from the PNG.
 *
 * ⛔ Draws only. The cards arrive precomputed from `toTypeCards()`; there is ⛔ no filter, reduce or
 * sort here, and ⛔ no percentage arithmetic — a component that recomputes a statistic is a second
 * place for it to be wrong.
 *
 * ⛔ NO adaptivity (41 § 7: «הרמה נבחרת ידנית»). ⛔ No score estimate — the render draws one and it
 * is Roy's heuristic (41 § 9.2, 03-for-roy item 73). ⛔ No XP, currency or streak (D-050).
 *
 * ── Declared layer-A gaps. The accessibility gates override the render (36 § 14.4), and every one
 *    of these is a measured number, ⛔ not a taste call:
 *      · `תרגל` button   render h=24 (:124)  ⇒ built 44 — the product floor
 *      · level chips     render h=32 (:133)  ⇒ built 44
 *      · card count line render 10.5px (:120) ⇒ built 12px — `check:text-floor`
 *      · sub-line        render 11.5px (:105) ⇒ built 14px
 *      · card radius     render r=17 (:112)  ⇒ built 16 — the five-value scale (D-102) has
 *                        ⛔ no 17, and adding a sixth value is a finding, ⛔ not a fix here
 * ── Declared deviation, and the ONE that is not a size. The render colours the three type bars
 *    BRAND_SURFACE · DANGER · AMBER (render_video_D.py:41-43) and ⛔ neither half is buildable as
 *    drawn. ⟦MOVED C-0533 · T-291⟧ The bar tints, and the whole measured argument for them, now
 *    live in `components/amirnetTypeBar.ts` — the dashboard draws the SAME three bars, and the
 *    table had to stop being a copy in each component before it became two.
 *    ⇒ the bars are `--brand-surface` · `--ink` · `--ink-muted`, and the type name is written
 *    beside every one of them.
 * ── ⛔ ONE CTA INTENT, and the render already had it right. A first build put a second
 *    `תרגל` button under the level chips — the SAME word for a different intent, which
 *    `skills/taste-skill/SKILL.md § 4.5` («NO DUPLICATE CTA INTENT») calls a Pre-Flight Fail
 *    and the walk screenshot showed plainly. The render draws ⛔ one start per card (:123-126)
 *    and ⛔ no bottom button, so the card's `תרגל` IS the start: it takes the level the chips
 *    hold, and until a level is chosen it is `aria-disabled` with the reason WRITTEN under the
 *    chips — ⛔ never a greyed-out button and nothing else.
 * ── The render is dark; the product is light (36 § 14.2, Roy 11/09). The background is ⛔ not a gap.
 */
export const KICKER_HE = 'העולם · אמירנט';
export const HEADING_HE = 'תרגול ממוקד';
export const CHOOSE_TYPE_HE = 'בחר סוג שאלות לתרגול';
export const NO_ADAPTIVITY_HE = 'הרמה נבחרת ידנית · אין כאן אדפטיביות';
export const LEVEL_HEADING_HE = 'רמת קושי';
export const PRACTISE_HE = 'תרגל';
/** ⛔ Not a colour and ⛔ not a disabled tooltip — the reason is written, where a learner reads it. */
export const PICK_LEVEL_FIRST_HE = 'בחר רמת קושי כדי להתחיל';

export interface AmirnetPracticeMenuProps {
  readonly cards: readonly AmirnetTypeCard[];
  /** Pre-selected type — the dashboard's weakness strip links in with one already chosen (T-291ⓒ). */
  readonly initialType?: AmirnetPracticeType | null;
  /** Called ⛔ only once BOTH choices exist (41 § 7). */
  readonly onStart?: (type: AmirnetPracticeType, level: AmirnetLevel) => void;
}

export default function AmirnetPracticeMenu({ cards, initialType = null, onStart }: AmirnetPracticeMenuProps) {
  const [type, setType] = useState<AmirnetPracticeType | null>(initialType);
  const [level, setLevel] = useState<AmirnetLevel | null>(null);

  return (
    <section>
      <header className="pt-2">
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
        <AmirnetTabs active="practice" built={AMIRNET_BUILT_TABS} />
      </header>

      <h2 className="mt-6 text-base font-semibold text-ink">{CHOOSE_TYPE_HE}</h2>
      <p className="mt-1 text-sm text-ink-muted">{NO_ADAPTIVITY_HE}</p>

      <ul className="mt-4 space-y-3">
        {cards.map((card) => {
          const chosen = card.type === type;
          const ready = practiceReady(card.type, level);
          return (
            <li
              key={card.type}
              className={
                chosen
                  ? 'rounded-2xl border-2 border-brand bg-surface-raised p-4'
                  : 'rounded-2xl border border-border-subtle bg-surface-raised p-4'
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-ink">{card.nameHe}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    <EnWord>{card.nameEn}</EnWord>
                  </p>
                </div>
                <div className="text-left">
                  {card.successPct === null ? null : (
                    <p className="text-lg font-black text-ink" dir="ltr">{`${card.successPct}%`}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-muted">{card.answeredHe}</p>
                </div>
              </div>

              {card.successPct === null ? null : (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border-subtle">
                  <div
                    className={`h-full rounded-full ${TYPE_BAR_CLASS[card.type]}`}
                    style={{ width: `${card.successPct}%` }}
                  />
                </div>
              )}

              <div className="mt-3 flex justify-start">
                <button
                  type="button"
                  aria-disabled={!ready}
                  onClick={() => {
                    if (ready) onStart?.(card.type, level as AmirnetLevel);
                    else setType(card.type);
                  }}
                  /* ⟦T-311⟧ Both branches press — the `!ready` one selects the type instead of
                     starting — so both carry the feedback. ⛔ `aria-disabled` here is «cannot start
                     yet», ⛔ not «does nothing». */
                  className={
                    ready
                      ? 'min-h-touch min-w-touch rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90'
                      : 'min-h-touch min-w-touch rounded-xl border border-border-strong px-5 text-sm font-bold text-ink-muted active:opacity-90'
                  }
                >
                  {PRACTISE_HE}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-6 text-base font-semibold text-ink">{LEVEL_HEADING_HE}</h2>
      <div role="group" aria-label={LEVEL_HEADING_HE} className="mt-3 grid grid-cols-4 gap-2">
        {AMIRNET_LEVELS.map((l) => {
          const on = l === level;
          return (
            <button
              key={l}
              type="button"
              aria-pressed={on}
              onClick={() => setLevel(l)}
              className={
                on
                  ? 'min-h-touch min-w-touch rounded-full border-2 border-brand bg-brand-surface/15 text-sm font-bold text-brand-surface active:opacity-90'
                  : 'min-h-touch min-w-touch rounded-full border border-border-strong text-sm text-ink-muted active:opacity-90'
              }
            >
              {LEVEL_CHIP_HE(l)}
            </button>
          );
        })}
      </div>

      {level === null && <p className="mt-3 text-sm text-ink-muted">{PICK_LEVEL_FIRST_HE}</p>}
    </section>
  );
}
