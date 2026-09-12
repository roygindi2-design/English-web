import Link from 'next/link';
import AmirnetEstimateNotice from '@/components/AmirnetEstimateNotice';
import { AMIRNET_TAB_HREF } from '@/components/AmirnetTabs';
import {
  BACK_TO_DASHBOARD_HE,
  CHAPTERS_LABEL_HE,
  CHAPTER_BREAKDOWN_HE,
  EMPTY_RUN_HE,
  MEASURED_CORRECT_LABEL_HE,
  MEASURED_TIME_LABEL_HE,
  NO_WEAKNESS_HE,
  PRACTICE_ALL_HE,
  chaptersDoneShortHe,
  resultRows,
  runCorrectShortHe,
  runTimeHe,
  runWeakness,
  shortRunNoticeHe,
  type AmirnetChapterOutcome,
  type AmirnetRowStanding,
} from '@/lib/core/amirnetResult';
import { SIMULATION_OVER_HE } from '@/lib/core/amirnetSimulation';

/**
 * The amirnet simulation RESULT screen — `T-298` · `41 § 7` · `41 § 8` item 3.
 * **המשך של: T-296** — the engine there ran the chapters; this screen reads what the finished
 * run already measured.
 *
 * 🎯 Render: `docs/design/kol-D-07-result.png`, drawn by `docs/design/render_video_D.py`
 * `scene_result` (:311-345). Every value below was grepped from that function, ⛔ not eyeballed.
 *
 * ⛔ DRAWS ONLY. Which rows exist, what each says, which type is the weak one and whether the
 * run was cut short all arrive from `lib/core/amirnetResult.ts`; there is ⛔ no arithmetic,
 * ⛔ no sort, ⛔ no filter and ⛔ no fetch here.
 *
 * ── Layout, grepped from `scene_result`:
 *      title            :313      13px Medium, centred, muted   ⇒ the screen's own h1
 *      summary card     :314-317  20,140 w=LW-40 h=200 r=20      ⇒ `rounded-2xl`, measured totals
 *      section heading  :318      13.5px SemiBold, right         ⇒ `text-base font-semibold`
 *      chapter row      :330-340  h=44 r=12, pitch 52            ⇒ `min-h-touch`, `rounded-xl`
 *        · title        :335      12.5px Medium, right           ⇒ `text-sm`
 *        · time         :336      11px Regular, muted            ⇒ `text-sm text-ink-muted`
 *        · correctness  :338      13px Bold, LTR, coloured       ⇒ `text-base`, `dir="ltr"`
 *      weakness card    :341-345  h=58 r=14, danger tint, a LINK ⇒ `min-h-touch`, `rounded-xl`
 *
 * ── Declared שכבה A gaps (the gates override the render, `36 § 14.4`), each with the render's
 *    own number: title 13→20 (see the ⓒ note below) · section heading 13.5→16 · row title
 *    12.5→14 · row time 11→14 · correctness 13→16 (`check:text-floor`, and § 29 of the skill
 *    on the row: if the text feels small the screen is not finished) · row radius 12 is already
 *    in the five-value scale, and 14 and 20 are ⛔ not — 14→12 and 20→16 (`D-102`) · the
 *    weakness card is the primary action ⇒ built at the 44px floor, ⛔ not at the render's 58 as
 *    a maximum · every coloured `4/4` carries its standing IN WORDS, because the render encodes
 *    «perfect · one short · worse» in hue alone (:333) and layer A forbids that.
 * ── The render is dark; the product is light (`36 § 14.2`, Roy 11/09) ⇒ the background is
 *    ⛔ NOT a gap. Every colour below is a `palette.ts` product token.
 *
 * ── 🔴 THE ONE DELIBERATE DEPARTURE FROM THE RENDER, and it is the row's own ⓒ.
 *    `scene_result` draws a **50–150 score dial** (:315) and «מתקדמים ב׳ · עלית 6 נקודות»
 *    (:317) as the hero of the screen. `41 § 9.2` declares that formula **unpublished and
 *    Roy's**, and `41 § 8` puts score estimation in **item 4** — ⛔ not item 3. ⇒ neither is
 *    built, and the 200px card keeps its position holding **what was measured**: correctness,
 *    real time, chapters completed. ⚠️ **And the hero has to go somewhere:** the render's title
 *    is small and muted *because the dial dominated it*. With the dial gone, the title carries
 *    the screen (20px bold), which is the same substitution `T-291` made when the dashboard's
 *    dial was not built either. ⛔ «ההפרש מהסימולציה הקודמת» (`41 § 7`) goes with the dial: a
 *    difference between two numbers that ⛔ do not exist is the same feature, ⛔ not a smaller one.
 *
 * ── ⛔ No animation to reduce (`check:motion`): the render fades the rows in one by one
 *    (:331 `pp`), and a staggered entrance on a screen a learner reads is motion that carries
 *    ⛔ no information. `prefers-reduced-motion` would have to remove it in full anyway.
 */

export const RESULT_TITLE_HE = SIMULATION_OVER_HE;

/**
 * The three standings, in ink and status tokens only. ⛔ The colour is a SUMMARY of the
 * fraction beside it — `3/5` is on screen in text either way — so ⛔ nothing here is encoded
 * by colour alone, and the words are read out as well (`standingHe`, below).
 * ⚠️ `near` is deliberately ⛔ not amber: `#f2b544` has ⛔ no token in `palette.ts`, and
 * `components/amirnetTypeBar.ts` already measured it at **1.75:1** on `--surface` — under the
 * 4.5:1 body-text floor, since the render draws the number ITSELF in that colour.
 */
const CORRECTNESS_CLASS: Readonly<Record<AmirnetRowStanding, string>> = {
  full: 'text-base font-bold tabular-nums text-success',
  near: 'text-base font-bold tabular-nums text-ink',
  weak: 'text-base font-bold tabular-nums text-danger',
};

export interface AmirnetResultProps {
  /** What the run measured, one entry per chapter it FINISHED. ⛔ Never padded to six. */
  readonly outcomes: readonly AmirnetChapterOutcome[];
}

export default function AmirnetResult({ outcomes }: AmirnetResultProps) {
  const rows = resultRows(outcomes);
  const weakness = runWeakness(outcomes);
  const notice = shortRunNoticeHe(outcomes);

  return (
    <section>
      <h1 className="pt-2 text-center text-xl font-bold text-ink">{RESULT_TITLE_HE}</h1>

      {/* T-304 · D-218 — ABOVE the numbers, ⛔ never below them: a disclaimer a learner reads
          after «18 מתוך 23» arrives after the inference it exists to prevent (41 § 6.1 items 4-5). */}
      <AmirnetEstimateNotice />

      {/* ⛔ ONE card, ⛔ not a grid of tiles inside it (skill § 15) — three measured facts. */}
      <dl className="mt-5 space-y-3 rounded-2xl border border-border-subtle bg-surface-raised p-4">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-muted">{MEASURED_CORRECT_LABEL_HE}</dt>
          <dd className="text-lg font-bold tabular-nums text-ink">
            {runCorrectShortHe(outcomes)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-muted">{MEASURED_TIME_LABEL_HE}</dt>
          <dd className="text-lg font-bold tabular-nums text-ink">{runTimeHe(outcomes)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-muted">{CHAPTERS_LABEL_HE}</dt>
          <dd className="text-lg font-bold tabular-nums text-ink">
            {chaptersDoneShortHe(outcomes)}
          </dd>
        </div>
      </dl>

      {/* ⓓ — an interrupted run says so in a SENTENCE, ⛔ and is never padded with empty rows. */}
      {notice === '' ? null : <p className="mt-4 text-sm text-ink-muted">{notice}</p>}

      <h2 className="mt-6 text-base font-semibold text-ink">{CHAPTER_BREAKDOWN_HE}</h2>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink">{EMPTY_RUN_HE}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li
              key={row.chapterIndex}
              className="flex min-h-touch items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-2"
            >
              <p className="text-sm font-medium text-ink">{row.positionHe}</p>
              <div className="flex items-center gap-4">
                <p className="text-sm text-ink-muted">{row.timeHe}</p>
                <p className={CORRECTNESS_CLASS[row.standing]}>
                  <span className="sr-only">{`${row.correctHe}, ${row.standingHe}`}</span>
                  <span aria-hidden="true" dir="ltr">
                    {row.correctLtr}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/*
        ⓑ — the primary action, and it carries the weak type ALREADY CHOSEN, exactly as the
        dashboard's strip does (`T-291`ⓒ). ⛔ There is ⛔ no second component for that job:
        which type is weak is decided once, in `weakestType()`.
        ⚠️ ⛔ And ⛔ never a guess: a run that did not reach all three types has ⛔ no weakness,
        and then the way on is the practice menu itself — ⛔ not a type picked for the learner.
      */}
      {weakness === null ? (
        <div className="mt-6">
          <p className="text-sm text-ink-muted">{NO_WEAKNESS_HE}</p>
          <Link
            href={AMIRNET_TAB_HREF.practice}
            className="mt-2 flex min-h-touch items-center justify-center rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on"
          >
            {PRACTICE_ALL_HE}
          </Link>
        </div>
      ) : (
        <Link
          href={`${AMIRNET_TAB_HREF.practice}?type=${weakness.type}`}
          className="mt-6 flex min-h-touch flex-col justify-center rounded-xl border border-danger bg-surface-raised px-4 py-3 text-right text-danger"
        >
          <span className="block text-base font-bold">{weakness.titleHe}</span>
          <span className="mt-0.5 block text-sm">{weakness.adviceHe}</span>
        </Link>
      )}

      <Link
        href={AMIRNET_TAB_HREF.dashboard}
        className="mt-3 flex min-h-touch items-center justify-center text-sm font-bold text-ink"
      >
        {BACK_TO_DASHBOARD_HE}
      </Link>
    </section>
  );
}
