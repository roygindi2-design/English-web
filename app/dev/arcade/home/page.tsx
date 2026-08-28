'use client';

import ArenaHome from '@/components/ArenaHome';
import '../../../arcade/arcade-tokens.css';

/**
 * Layout fixture for `check:mobile` — T-181. noindex, unlinked, ⛔ **not a learning
 * screen** (בדיקת פריסה — ⛔ אינו תוכן לימודי). `/arcade` renders this component too, but
 * `next start` runs with ⛔ no Supabase env, so `GET /api/arcade/home` answers 503 by its
 * own contract and every line the harness prints there describes the FAILURE state. Same
 * reasoning, one screen over, as `/dev/arcade` (T-095) and `/dev/deck` (C-0104).
 *
 * ⛔ **This page renders the component and NOTHING else** — C-0104: a line of chrome the
 * real route lacks pushes the screen down, and the harness then measures the fixture.
 *
 * ⚠️ **`'use client'` is ⛔ not decoration and ⛔ not a weakened fixture:** `onStart` is a
 * function prop, and a Server Component ⛔ cannot hand one to a Client Component — the
 * build failed on exactly that. ⛔ The alternative was making `onStart` optional with a
 * no-op default, which would have let a real screen mount the home screen with ⛔ no way
 * out of it and ⛔ nothing would have failed. ⇒ the fixture moved, ⛔ not the contract.
 *
 * ⛔ **The numbers are chosen for SHAPE, ⛔ not for meaning:** `wins: 3` is the exact value
 * `render_video_B.py:71` draws (`done · done · done · current · boss`), so the fixture and
 * the render show the same five nodes. ⛔ **And the item list carries all three cases the
 * screen can be in:** `helmet` fills a slot (`head`), `lantern` fills a second (`offHand`),
 * and `banner` is silently skipped — D-135 measured that it is ⛔ not an equipment slot at
 * all ⇒ two slots stay empty, which is the state most learners are actually in.
 */
export default function DevArenaHomePage() {
  return (
    <ArenaHome
      initialState={{ arcadeLevel: 7, wins: 3, unlockedItems: ['helmet', 'lantern', 'banner'] }}
      onStart={() => {}}
    />
  );
}
