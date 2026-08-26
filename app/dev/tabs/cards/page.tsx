import LevelMapScreen from '@/components/LevelMapScreen';
import TabBar from '@/components/TabBar';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * ⚠️ This fixture was NOT in the plan — step 4.3 named `/cards` itself as a
 * directly measurable tab route. Measured in C-0075 against the production
 * build: `/cards` answers **307 → /login?expired=1**, because C-0073 added it to
 * `PROTECTED_SCREENS` in `proxy.ts` after the plan was written. The harness was
 * therefore about to report three "ok /cards" lines for the login screen — F-027
 * cause 1 exactly. The new `tab bar is present` check is what caught it.
 *
 * `<TabBar />` is named here because the fixture lives outside `app/(tabs)`.
 *
 * ⚠️ Since C-0176 (T-081) the fixture renders `<LevelMapScreen>` — the level map (§ 4.2ז) —
 * and therefore measures a THIRD failure state too: it has no session and the harness has no
 * Supabase env, so `GET /api/levels/summary` answers 503 by its own contract and the screen
 * lands in the «המאגר עדיין לא הוקם» / «לא הצלחנו לטעון» branch. That IS the state the task
 * names for a missing schema, and it is what the map was written for. The 503 line is allowed
 * in `EXPECTED_CONSOLE` (scripts/verify-mobile.mjs) by exact URL and status, ⛔ not by
 * exempting the route.
 *
 * ⚠️ Since C-0103 (T-065 task 7) `<DeckSelector>` — now the «דרכים לתרגל» block inside the
 * map — reads both decks from `GET /api/study/queue`. This fixture has no session and the harness has no Supabase env,
 * so both requests answer 503 by the route's own contract and the block lands in its
 * «—» state — which IS the failure state the task names, and therefore the right thing to
 * measure. The two 503 lines are allowed in `EXPECTED_CONSOLE` (scripts/verify-mobile.mjs)
 * by exact URL and status, ⛔ not by exempting the route.
 */
/**
 * ⚠️ **C-0318 (T-210ⓗ) — the fixture now feeds a NON-NULL summary, and that is the whole
 * reason the § 5 screen is measurable at all.** Without it this route could only ever land
 * in the 503 branch, so the progress bar and the three counters never reached the DOM and
 * `check:mobile` measured a screen that does not exist for a learner with a session.
 *
 * ⛔ **The four numbers are the RENDER's own** — `docs/design/render_video_A.py:241`
 * (`LV_TOTAL, LV_KNOWN, LV_UNKNOWN = 400, 61, 25`, and `LV_REMAIN = 400 − 86 = 314`) — so
 * what the harness walks is the picture the plan targets, ⛔ not numbers invented here.
 * `filterProgress` turns them into exactly «86 / 400 סוננו».
 *
 * ⛔ `<DeckSelector>` still fetches and still lands in its «—» state: the harness has no
 * session, so both queue requests answer 503 by the route's own contract, and that failure
 * state is what `EXPECTED_CONSOLE` allows by exact URL and status.
 */
const RENDER_SUMMARY = {
  level: 'A1',
  totalInLevel: 400,
  known: 61,
  inReviewList: 25,
  unseen: 314,
} as const;

export default function DevTabsCardsPage() {
  return (
    <>
      <LevelMapScreen fixtureSummary={RENDER_SUMMARY} />
      <TabBar />
    </>
  );
}
