'use client';

import { useState } from 'react';
import Flashcard from '@/components/Flashcard';
import { buildCard } from '@/lib/core/flashcard';

/**
 * The THIRD layout fixture, and the only one that exists for a behaviour rather
 * than a layout: it advances from one card to the next in the same slot.
 *
 * A review proved that without a state reset, card B arrives with its answer
 * already on screen and no reveal button — `revealed` is component state, and this
 * page is deliberately written the way a careless consumer would write it, with NO
 * `key` on <Flashcard>. That is the point: the guarantee has to hold without the
 * consumer knowing the rule. Showing the answer before recall is not retrieval
 * practice, so this is measured at every width like everything else.
 *
 * Same non-content as the sibling fixtures — "Lorem"/"Ipsum" are not words and the
 * Hebrew reads "sample text" / "other text". Nobody learns anything here.
 */
const CARDS = [
  buildCard(
    {
      headword: 'Lorem',
      translationHe: 'טקסט לדוגמה',
      examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
    },
    'recognition',
    { isFirstEncounter: true },
  ),
  buildCard(
    {
      headword: 'Ipsum',
      translationHe: 'טקסט אחר',
      examples: { supportive: 'The Ipsum is also a fixture.', neutral: '' },
    },
    'recognition',
    { isFirstEncounter: true },
  ),
];

export default function DevSwapCardPage() {
  const [i, setI] = useState(0);
  const card = CARDS[i] ?? CARDS[0];
  if (!card) return null;
  return (
    <>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו תוכן לימודי</p>
      <Flashcard card={card} onGrade={() => setI((n) => Math.min(n + 1, CARDS.length - 1))} />
    </>
  );
}
