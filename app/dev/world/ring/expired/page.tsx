import { WorldRingView } from '@/components/WorldRing';
import { ringScreen, type RingInputs } from '@/lib/core/worldRing';

/**
 * Layout fixture for `check:mobile` — T-146ⓒ · D-065.
 * noindex (inherited from `app/dev/world/layout.tsx`), unlinked, and ⛔ NOT a learning
 * screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * ⛔ **AND IT IS ⛔ NOT A SEAL** (D-116 · `36 § 13.1`), for the same reason its sibling
 * `/dev/world/ring` is not: a typed address is ⛔ never arrival.
 *
 * ⚠️ **Why it exists at all, measured ⛔ and not assumed:** with no Supabase env both
 * `GET /api/arcade/round` and `GET /api/world/status` answer `503 {code:'unavailable'}`
 * by their own contract, and `unavailable` is the ONE retryable code of the three. ⇒ on
 * `/world` in this sandbox the empty state can only ever paint «נסה שוב», and the branch
 * T-146ⓒ exists for — the branch that carries an **exit** instead of a retry — is
 * ⛔ unreachable in a browser here. Without this route the exit is asserted in a unit test
 * and ⛔ never once painted at 320/375/414.
 *
 * ⛔ The inputs are `null`: the exit is a property of the FAILURE, ⛔ not of the nodes,
 * and handing it hand-built node states would suggest otherwise.
 */
const FIXTURE: RingInputs | null = null;

export default function DevWorldRingExpiredPage() {
  return <WorldRingView screen={ringScreen(FIXTURE, '/world', 'session_expired')} lastNode={null} />;
}
