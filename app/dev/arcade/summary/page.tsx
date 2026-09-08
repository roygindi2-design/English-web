'use client';

import ArenaSummary from '@/components/ArenaSummary';
import { summarize } from '@/lib/core/arenaSummary';
import type { ArenaWordKind } from '@/lib/core/arenaWords';
import { CRITICAL_MS, type BattleCast } from '@/lib/core/battle';

/**
 * Layout fixture for `check:mobile` and for the STEP 6.5 walk — T-180, plan
 * `2026-08-27-arena-slice-c-results-and-idle.md` Task 1. noindex (the rule lives in
 * `app/dev/arcade/layout.tsx`), unlinked, and ⛔ NOT a learning screen.
 *
 * Why it has to exist, measured and not assumed: `<ArenaSummary>` is only reachable
 * after a full 90-second battle **and** a 200 from `POST /api/arcade/result`, and
 * `check:mobile` runs `next start` with no Supabase env — so on `/arcade` that endpoint
 * answers 503 by its own contract and this screen would never once be rendered at
 * 320/375/414. Same reasoning as `/dev/arcade/result` (T-096) and `/dev/arcade` (C-0185).
 *
 * ⛔ **This page renders the component and NOTHING else** — no heading, no note line
 * (C-0104: one line of chrome the real screen does not have pushes the content down, and
 * the harness then measures the fixture instead of the component).
 *
 * ⛔ **The strings are not learning content** (R-010 · R-013): the headwords are the same
 * non-content placeholders `app/dev/arcade/result/page.tsx` uses, chosen for LENGTH.
 *
 * ⚠️ **The fixture reproduces the render's own numbers so the walk compares like with
 * like — with ONE measured exception, and it is a finding, ⛔ not a choice.**
 * `render_video_B.py:612-614` draws `14 / 16` and `רצף מרבי` `4` in the same panel, and
 * the two ⛔ cannot co-exist: 14 correct casts out of 16 leave **2** wrong ones, which cut
 * the correct casts into at most **3** runs, so the longest run is at least
 * `ceil(14 / 3) = 5`. ⇒ the fixture ships `5`, and the gap is filed with that number.
 */
const cast = (n: number, correct: boolean, responseMs: number, kind: ArenaWordKind = 'known'): BattleCast => ({
  wordId: `w${n}`,
  correct,
  responseMs,
  critical: correct && responseMs < CRITICAL_MS,
  kind,
});

/* 5 · ✗ · 5 · ✗ · 4 ⇒ רצף מרבי 5. שלוש נכונות-איטיות ב-3000ms, והסכום 28,800 ⇒ 1.8 ש׳.
   T-282 — 4 × `unfiltered` (3 · 7 · 11 · 15) ⇒ הלוח הכחול מציג 4 (`render_video_B.py:637`);
   ⛔ לא האיטיות (2 · 8 · 14), כדי שההליכה תספור כל לוח לחוד. */
const FIXTURE: readonly BattleCast[] = [
  cast(1, true, 1_200),
  cast(2, true, 3_000),
  cast(3, true, 1_200, 'unfiltered'),
  cast(4, true, 1_200),
  cast(5, true, 1_200),
  cast(6, false, 3_300),
  cast(7, true, 1_200, 'unfiltered'),
  cast(8, true, 3_000),
  cast(9, true, 1_200),
  cast(10, true, 1_200),
  cast(11, true, 1_200, 'unfiltered'),
  cast(12, false, 3_300),
  cast(13, true, 1_200),
  cast(14, true, 3_000),
  cast(15, true, 1_200, 'unfiltered'),
  cast(16, true, 1_200),
];

const HEADWORDS: Readonly<Record<string, string>> = {
  w2: 'Lorem2',
  w3: 'Lorem3',
  w7: 'Lorem7',
  w8: 'Lorem8',
  w11: 'Lorem11',
  w14: 'Lorem14',
  w15: 'Lorem15',
};

export default function DevArcadeSummaryPage() {
  return (
    <ArenaSummary
      enemyDefeated
      summary={summarize(FIXTURE)}
      headwords={HEADWORDS}
      onBack={() => {}}
    />
  );
}
