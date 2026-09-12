import Link from 'next/link';
import AmirnetTabs, { AMIRNET_BUILT_TABS } from '@/components/AmirnetTabs';
import EnWord from '@/components/EnWord';
import { TYPE_BAR_CLASS } from '@/components/amirnetTypeBar';
import type { AmirnetTypeCard, AmirnetWeakness } from '@/lib/core/amirnetPractice';

/**
 * דשבורד אמירנט — T-291 · 41 § 8 item 2. **המשך של: T-287** (the practice engine writes the
 * numbers; this is their first reader).
 * 🎯 Render: docs/design/kol-D-02-dashboard.png, drawn by render_video_D.py `screen_dash`
 * (:62-89). Every layout value below was grepped from that function, ⛔ not eyeballed from the PNG.
 *
 * ⛔ Draws only. Cards and the weakness strip arrive precomputed from `toTypeCards()` /
 * `weakestCard()`; there is ⛔ no percentage arithmetic, no filter/reduce/sort and ⛔ no fetch here.
 *
 * ── WHAT THE RENDER DRAWS AND THIS SCREEN ⛔ DOES NOT BUILD, and it is the row's own gate:
 *    the score dial (`score_dial`, :45-59 — `112 · אומדן ציון`, the 50–150 arc) and the line
 *    `מתקדמים ב׳ · 22 נקודות מפטור` (:66). Both are **Roy's heuristic** (`41 § 9.2` ·
 *    `03-for-roy` item 73) and ⛔ not the loop's to invent. ⛔ No XP, coin, streak or leaderboard
 *    anywhere (`D-050`). ⛔ No adaptivity (`41 § 7`).
 *
 * ── Declared layer-A gaps. The accessibility gates override the render (`36 § 14.4`), and every
 *    one is a measured number, ⛔ not a taste call:
 *      · card count line   render 10.5px (:76)  ⇒ built 12px — `check:text-floor`
 *      · strip advice line render 11px   (:87)  ⇒ built 14px
 *      · section heading   render 13.5px (:67)  ⇒ built 16px
 *      · the weakness strip is a LINK (T-291ⓒ) ⇒ built at the 44px floor; the render draws
 *        the band 54px high (:82), so the floor costs the layout ⛔ nothing
 *      · card radius       render r=16 (:71)   ⇒ `rounded-2xl` (16) exactly — ⛔ no gap
 *      · strip radius      render r=14 (:82)   ⇒ built 16 — the five-value scale (`D-102`) has
 *                          ⛔ no 14, and adding a sixth value is a finding, ⛔ not a fix here
 * ── The bar tints: see `components/amirnetTypeBar.ts`, which owns the measurement (AMBER
 *    #f2b544 is 1.83:1 on `--surface-raised`, against a 4.5:1 floor).
 * ── The weakness strip keeps `--danger`, and that is ⛔ not a contradiction of the bars above:
 *    here the colour marks a genuine STATUS, which is what the token is for — and it ships the
 *    way `lib/core/palette.ts` says status always ships, **icon + label**, never colour alone.
 *    The percentage is in the text, so a learner who sees ⛔ no colour at all loses nothing.
 * ── The render is dark; the product is light (`36 § 14.2`, Roy 11/09). The background is ⛔ not a gap.
 */
export const KICKER_HE = 'העולם · אמירנט';
export const HEADING_HE = 'סימולציות אמירנט';
export const PERFORMANCE_HEADING_HE = 'ביצועים לפי סוג שאלה';

/**
 * ⓓ — and `—` is ⛔ not an answer, `0%` over zero questions is a LIE (T-291ⓓ · T-286ⓔ).
 * The render draws ⛔ no empty state at all, so these two strings are the screen's own.
 */
export const EMPTY_TITLE_HE = 'עדיין לא תרגלת';
export const EMPTY_BODY_HE =
  'אחרי השאלות הראשונות יופיעו כאן אחוזי ההצלחה שלך בכל סוג שאלה, וגם באיזה סוג כדאי להתחיל.';
export const TO_PRACTICE_HE = 'לתפריט התרגול';

/** ⛔ Where the strip sends a learner — with the weak type ALREADY chosen (T-291ⓒ). */
export const PRACTICE_HREF = '/world/amirnet/practice';

/**
 * The render's `icon_x` (:84), as inline SVG and ⛔ never a character or an emoji (constitution § 6).
 * ⛔ Not `components/CloseIcon.tsx`: that file's contract is «the glyph of a close affordance, named
 * by the button around it», and this mark labels nothing a learner can press shut.
 */
function CrossMarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export interface AmirnetDashboardProps {
  readonly cards: readonly AmirnetTypeCard[];
  /** null ⇔ ⛔ nothing answered · a type never tried · a tie at the bottom. ⛔ Never guessed here. */
  readonly weakness: AmirnetWeakness | null;
  /** ⛔ Not `cards.length`: a learner holds three cards and zero answers on day one. */
  readonly hasAnswers: boolean;
}

export default function AmirnetDashboard({ cards, weakness, hasAnswers }: AmirnetDashboardProps) {
  return (
    <section>
      <header className="pt-2">
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
        <AmirnetTabs active="dashboard" built={AMIRNET_BUILT_TABS} />
      </header>

      {!hasAnswers ? (
        <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <h2 className="text-base font-bold text-ink">{EMPTY_TITLE_HE}</h2>
          <p className="mt-2 text-sm text-ink-muted">{EMPTY_BODY_HE}</p>
          <Link
            href={PRACTICE_HREF}
            className="mt-4 inline-flex min-h-touch min-w-touch items-center justify-center rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on"
          >
            {TO_PRACTICE_HE}
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mt-6 text-base font-semibold text-ink">{PERFORMANCE_HEADING_HE}</h2>

          <ul className="mt-4 space-y-3">
            {cards.map((card) => (
              <li
                key={card.type}
                className="rounded-2xl border border-border-subtle bg-surface-raised p-4"
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
                    <p className="mt-0.5 text-xs text-ink-muted">{card.answeredShortHe}</p>
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
              </li>
            ))}
          </ul>

          {weakness !== null && (
            <Link
              href={`${PRACTICE_HREF}?type=${weakness.type}`}
              className="mt-4 flex min-h-touch items-center gap-3 rounded-2xl border border-danger bg-surface-raised p-4 text-danger"
            >
              <CrossMarkIcon />
              <span>
                <span className="block text-base font-bold">{weakness.titleHe}</span>
                <span className="mt-0.5 block text-sm">{weakness.adviceHe}</span>
              </span>
            </Link>
          )}
        </>
      )}
    </section>
  );
}
