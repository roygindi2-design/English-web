import ArenaBoard, { type ArenaRound } from '@/components/ArenaBoard';
import type { ArcadeQuestion } from '@/lib/core/arcadeRound';

/**
 * Layout fixture for `check:mobile` — T-095, plan `2026-08-19-arcade-screens.md`.
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/arcade` is itself in the harness's route list, and that is exactly why this file has to
 * exist: `next start` runs with no Supabase env, `GET /api/arcade/round` answers 503 by its
 * own contract, and so every `ok /arcade` line the harness prints describes the FAILURE
 * state — one paragraph and one way out. The word, the four options and the enemy's health
 * meter had never once been rendered at 320/375/414. Same reasoning, one feature over, as
 * `/dev/world` (C-0129), `/dev/deck` (C-0104) and `/dev/tabs/*` (TD-13).
 *
 * ⛔ **This page renders the component and NOTHING else** — no heading, no note line. C-0104:
 * a line of chrome the real route does not have pushes the screen down, and the harness then
 * measures this fixture instead of the component. The «not learning content» declaration
 * therefore lives here in the comment, where it costs no pixels.
 *
 * ⛔ **The strings are not learning content** (R-010 · R-013 — sourced content is forbidden
 * and invented content is forbidden). They are the same non-content `app/dev/world/page.tsx`
 * uses, chosen for LENGTH rather than meaning: what this harness measures is pixels, and the
 * options' job here is to wrap, to hold 44px, and to not scroll sideways at 320px.
 *
 * Eight questions and ⛔ not two: `ARCADE_ROUND_SIZE` is 8, and a 2×2 grid that is never
 * filled cannot fail a wrap check.
 */
function question(n: number): ArcadeQuestion {
  return {
    wordId: `w${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    options: [`אפשרות ${n}`, `מסיח ${n}א`, `מסיח ${n}ב`, `מסיח ${n}ג`],
  };
}

const FIXTURE: ArenaRound = {
  level: 'A1',
  questions: [
    question(1),
    question(2),
    question(3),
    question(4),
    question(5),
    question(6),
    question(7),
    question(8),
  ],
};

export default function DevArcadePage() {
  return <ArenaBoard initialRound={FIXTURE} />;
}
