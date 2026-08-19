import { RecallCardView } from '@/components/RecallCard';
import type { RecallCard } from '@/lib/core/worldRecall';

/**
 * Layout fixture for `check:mobile` — T-105, plan `2026-08-19-world-home.md` § 3.
 * noindex (inherited from `app/dev/world/layout.tsx`), unlinked, and ⛔ NOT a learning
 * screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/world` is itself in the harness's route list, and that is exactly why this file has to
 * exist: `next start` runs with no Supabase env, `GET /api/world/recall` answers 503 by its
 * own contract, and so every `ok /world` line the harness prints describes the card's
 * FAILURE state. The learner's sentence, the empty frame where the target word is missing,
 * the 2×2 options and the landing of the word have never once been rendered at 320/375/414.
 * Same reasoning, one component over, as `/dev/world` (C-0129) and `/dev/arcade` (C-0185).
 *
 * ⛔ **This page renders the component and NOTHING else** — no heading, no note line. C-0104:
 * a line of chrome the real route does not have pushes the screen down, and the harness then
 * measures this fixture instead of the component. The «not learning content» declaration
 * therefore lives here in the comment, where it costs no pixels.
 *
 * ⛔ **The strings are not learning content** (R-010 · R-013 — sourced content is forbidden
 * and invented content is forbidden). They are the same non-content `app/dev/world/page.tsx`
 * and `app/dev/arcade/page.tsx` use, chosen for LENGTH rather than meaning: what this
 * harness measures is pixels, and the options' job here is to wrap, to hold 44px, and to not
 * scroll sideways at 320px.
 *
 * ⚠️ **Deviation from the plan's step 3.4, and its reason.** The plan says to export
 * `metadata = { robots: { index: false } }` from this page "exactly like the rest of
 * `app/dev/*`". Measured: ⛔ no `app/dev/*` PAGE exports it — all seven declare it in a
 * `layout.tsx`, and `app/dev/world/layout.tsx` already wraps this route. A second
 * declaration here would be a second source of truth for one rule, and the one that is
 * edited later wins silently.
 *
 * ⛔ `segments.map(s => s.text).join('') === bodyEn`, byte for byte — the invariant the
 * producer owes `<EnText>` (TD-11). A fixture that broke it would measure a sentence the
 * product can never render.
 */
const FIXTURE: RecallCard = {
  postId: 'dev-fixture',
  bodyEn: 'Lorem ipsum consequat dolor sit amet nostrud.',
  daysAgo: 3,
  answer: 'consequat',
  options: ['consequat', 'laboris', 'aliquip', 'exercitation'],
  segments: [
    { text: 'Lorem ipsum ', isTarget: false },
    { text: 'consequat', isTarget: true },
    { text: ' dolor sit amet nostrud.', isTarget: false },
  ],
};

export default function DevWorldRecallPage() {
  return <RecallCardView card={FIXTURE} />;
}
