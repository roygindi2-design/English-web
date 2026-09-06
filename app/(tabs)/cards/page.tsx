import LevelMapScreen from '@/components/LevelMapScreen';

// T-264 — the exact string `<LevelMapScreen>`'s own `<h1>` already renders
// (`components/LevelMapScreen.tsx` `HEADING_HE`); the suffix is `app/layout.tsx`'s
// `title.template`.
export const metadata = { title: 'כרטיסיות' };

/**
 * כרטיסיות — the word tab (D-027 · § 4.2ב: "כל מה שהוא מילה").
 *
 * Since T-081 this tab is **the level map** (§ 4.2ז), ⛔ no longer a deck selector. The
 * deck selector was not deleted: it is `<DeckSelector>`, the same code, and it now renders
 * as the «דרכים לתרגל» block — the fourth row of the map.
 *
 * The markup is `<LevelMapScreen>` so the `/dev/tabs/cards` harness fixture renders
 * the same component: this route is session-gated in `proxy.ts` and answers 307
 * without Supabase env, so the fixture is the only place its layout is ever
 * measured (F-027 causes 1 and 2).
 */
export default function CardsPage() {
  return <LevelMapScreen />;
}
