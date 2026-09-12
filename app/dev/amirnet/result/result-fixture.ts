import type { AmirnetChapterOutcome } from '@/lib/core/amirnetResult';

/**
 * THE RENDER'S OWN RUN, TRANSCRIBED — `docs/design/render_video_D.py:325-326` `res`, whose
 * tuples are `(chapterIndex, total, correct, minutes)`. The minutes are multiplied out to the
 * seconds the product measures, so the screen renders the exact six rows `kol-D-07-result.png`
 * draws: `4/4 · 3.1 דק׳` · `3/4 · 3.6` · `3/5 · 14.2` · `2/3 · 5.4` · `2/3 · 5.8` · `4/4 · 3.0`.
 *
 * ⛔ This is ⛔ not learning content (`R-010`): it is six pairs of counters and a duration,
 * with the same provenance `app/dev/amirnet/simulation/simulation-fixture.ts` declares for the
 * render's reference item. ⛔ And it is ⛔ not a product route — `T-297` has to land the item
 * bank before a real run can produce these numbers, so until then this fixture is the only
 * place the six-row screen exists at 320/375/414.
 */
export const RESULT_FIXTURE_RUN: readonly AmirnetChapterOutcome[] = [
  { chapterIndex: 0, correct: 4, answered: 4, elapsedSeconds: 186 },
  { chapterIndex: 1, correct: 3, answered: 4, elapsedSeconds: 216 },
  { chapterIndex: 2, correct: 3, answered: 5, elapsedSeconds: 852 },
  { chapterIndex: 3, correct: 2, answered: 3, elapsedSeconds: 324 },
  { chapterIndex: 4, correct: 2, answered: 3, elapsedSeconds: 348 },
  { chapterIndex: 5, correct: 4, answered: 4, elapsedSeconds: 180 },
];

/** ⓓ — the interrupted run, so the written short-run state is walkable and ⛔ not only tested. */
export const RESULT_FIXTURE_SHORT_RUN: readonly AmirnetChapterOutcome[] =
  RESULT_FIXTURE_RUN.slice(0, 5);
