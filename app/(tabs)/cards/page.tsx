import CardsScreen from '@/components/CardsScreen';

/**
 * כרטיסיות — the word tab (D-027 · § 4.2ב: "כל מה שהוא מילה").
 *
 * It wraps the existing study screen's empty state (T-041) rather than
 * restating it. When the queue endpoint lands, this is where <Flashcard>
 * renders — the component is complete and measured at /dev/card.
 *
 * The markup is `<CardsScreen>` so the `/dev/tabs/cards` harness fixture renders
 * the same component: this route is session-gated in `proxy.ts` and answers 307
 * without Supabase env, so the fixture is the only place its layout is ever
 * measured (F-027 causes 1 and 2).
 */
export default function CardsPage() {
  return <CardsScreen />;
}
