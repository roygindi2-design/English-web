'use client';

import Flashcard from '@/components/Flashcard';
import { buildCard } from '@/lib/core/flashcard';

/**
 * The SECOND layout fixture — the production (typed) direction. Its own route
 * rather than a second card on /dev/card, because the card is `flex-1` and two of
 * them on one page would split the free space and make both thumb-zone
 * measurements meaningless.
 *
 * It exists because a review proved the first fixture was measuring nothing here:
 * `/dev/card` is recognition-only, so the answer `<input>` and its submit button
 * were never in the DOM when the 44px tap-target scan ran. They pass at exactly
 * 280×44 at 320px — on the floor, with no margin — which is worth holding.
 *
 * Same non-content as the sibling fixture: "Lorem" is not a word and
 * "טקסט לדוגמה" means "sample text". Nobody learns anything from this card.
 */
const FIXTURE = buildCard(
  {
    headword: 'Lorem',
    translationHe: 'טקסט לדוגמה',
    examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
    // false, unlike /dev/card: the unmarked back has to be measured too.
    needsHumanReview: false,
  },
  'production',
  { isFirstEncounter: true },
);

export default function DevTypedCardPage() {
  return (
    <>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו תוכן לימודי</p>
      <Flashcard card={FIXTURE} onGrade={() => undefined} />
    </>
  );
}
