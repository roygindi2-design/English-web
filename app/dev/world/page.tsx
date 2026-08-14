import ComposeDraft, { type Bank } from '@/components/ComposeDraft';

/**
 * Layout fixture for `check:mobile` — T-063 task 9, plan `2026-08-14-world-compose.md`.
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/world/compose` is itself in the harness's route list, and that is exactly why this file
 * has to exist: `next start` runs with no Supabase env, `GET /api/world/bank` answers 503 by
 * its own contract, and so every `ok /world/compose` line the harness prints describes the
 * FAILURE state — one paragraph and one retry button. The bank chips, the draft chips, the
 * punctuation row and the publish bar had never once been rendered at 320/375/414. Same
 * reasoning, one feature over, as `/dev/deck` (C-0104) and `/dev/tabs/*` (TD-13).
 *
 * ⛔ **This page renders the component and NOTHING else** — no heading, no note line. C-0104:
 * a line of chrome the real route does not have pushes the screen down, and the harness then
 * measures this fixture instead of the component. The «not learning content» declaration
 * therefore lives here in the comment, where it costs no pixels.
 *
 * ⚠️ **Deviation from the plan's literal `target: 'car'`, and the reason.** The plan names
 * real English words for the bank. The precedent set by `app/dev/deck/page.tsx` is that a
 * fixture carries strings nobody can learn from — R-010/R-013 forbid sourced content and the
 * loop forbids invented content, and a screen that shows «היום: car» is one edit away from
 * looking like a lesson. The tokens below are the same non-content the sibling fixture uses,
 * chosen for LENGTH rather than meaning: the measurement is pixels, and the bank's job in
 * this harness is to wrap, to hold 44px, and to not scroll sideways at 320px.
 *
 * Twelve and twelve, and ⛔ not two: a single row of chips cannot fail a wrap check, and the
 * gap floor between neighbouring targets is only measurable once a row has actually wrapped.
 * `TARGET` is the longest active token on purpose — it is the worst case for the guidance
 * line «הוסף את <word> כדי לפרסם» inside the fixed action bar.
 */
const FUNCTION_WORDS: readonly string[] = [
  'Lorem',
  'Ipsum',
  'Dolor',
  'Sit',
  'Amet',
  'Enim',
  'Ad',
  'Minim',
  'Quis',
  'Nostrud',
  'Ut',
  'Aliqua',
];

const ACTIVE_WORDS: readonly string[] = [
  'Veniam',
  'Laboris',
  'Nisi',
  'Aliquip',
  'Commodo',
  'Consequat',
  'Duis',
  'Aute',
  'Irure',
  'Velit',
  'Esse',
  'Cillum',
];

const FIXTURE: Bank = {
  functionWords: FUNCTION_WORDS,
  activeWords: ACTIVE_WORDS,
  target: 'Consequat',
};

export default function DevWorldPage() {
  return <ComposeDraft initialBank={FIXTURE} />;
}
