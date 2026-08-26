import { WorldRingView } from '@/components/WorldRing';
import { ringScreen, type RingInputs } from '@/lib/core/worldRing';

/**
 * Layout fixture for `check:mobile` — T-205ⓕ, plan `2026-08-26-nav-ring-slice-a.md` step 17.
 * noindex (inherited from `app/dev/world/layout.tsx`), unlinked, and ⛔ NOT a learning
 * screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * ⛔ **AND IT IS ⛔ NOT A SEAL** (D-116 · `36 § 13.1`). A typed address is not arrival and
 * `/dev/*` is ⛔ never seal ⓐ; the node states here are hand-built, so it is ⛔ never seal
 * ⓑ either. The one thing this route buys is that the eight nodes and all three lock
 * classes are actually PAINTED at 320/375/414 — which on `/world` itself they are not,
 * because with no Supabase env `GET /api/arcade/round` and `GET /api/world/status` answer
 * 503 by their own contract and the screen shows its empty state. ⇒ without this fixture
 * every `ok /world` line in the harness would describe one paragraph and one button.
 *
 * ⛔ **This page renders the component and NOTHING else** — no heading, no note line
 * (C-0104): a line of chrome the real route does not have pushes the screen down, and the
 * harness then measures the fixture instead of the component. The «not learning content»
 * declaration therefore lives here in the comment, where it costs no pixels.
 *
 * The inputs are chosen to put **all three classes on one screen at once**, which is the
 * only arrangement that can fail the D-118 rules visually: `זירת קרב` carries a
 * `locked_count` note WITH its digits, the four infra nodes carry sentences with ⛔ no
 * digit and ⛔ no date, and three nodes are open. `סיפורים` also carries the «כאן היית»
 * mark, so the shape channel of T-206ⓒ is measured rather than assumed.
 *
 * ⛔ The note's numbers are the same two `levelTooSmallNoteHe` builds on the real screen —
 * ⛔ not a second Hebrew string invented for a fixture.
 */
const FIXTURE: RingInputs = {
  arena: { kind: 'locked_count', noteHe: 'נדרשות 12 מילים ברמה, יש 8' },
  stories: { kind: 'open', href: '/world/story' },
  compose: { kind: 'open', href: '/world/compose' },
  vocab: { kind: 'open', href: '/world/collected' },
};

export default function DevWorldRingPage() {
  return <WorldRingView screen={ringScreen(FIXTURE, '/world', 'unavailable')} lastNode="stories" />;
}
