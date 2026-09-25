'use client';

import CardDeck from '@/components/CardDeck';

/**
 * Layout fixture for `check:mobile` — `T-514` · `D-300`: the finish state of «סינון מילים»
 * WITH its «עוד 20 מילים» action. noindex, unlinked, and ⛔ NOT a learning screen (בדיקת
 * פריסה — אינו תוכן לימודי). `/dev/deck/done` renders `unknown`, which ⛔ never carries the
 * action, so this branch is unreachable from the route above it — the same reasoning that
 * gave `/dev/deck/done` its own route. What it measures: the primary «more» and the
 * secondary «חזרה לכרטיסיות» both above the fold at 320/375/414, one `data-primary-action`.
 */
export default function DevDeckMorePage() {
  return (
    <CardDeck
      deck="level"
      cards={[]}
      // Never called — the deck is already empty. It exists to satisfy the prop type.
      onGraded={() => Promise.resolve()}
      onMore={() => undefined}
    />
  );
}
