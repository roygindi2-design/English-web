'use client';

import Flashcard from '@/components/Flashcard';
import { buildSentenceCard } from '@/lib/core/sentenceCard';

/**
 * The THIRD layout fixture — the «משפטים» item (T-066 · D-156 · D-169) on the same
 * `<Flashcard>`. Its own route for the reason `/dev/card/typed` has one: the card is
 * `flex-1`, and two of them on one page would split the free space and make both thumb-zone
 * measurements meaningless.
 *
 * It exists so the choice branch is measured at 320/375/414 instead of declared: three
 * options ≥44px, the blank empty before the tap, the back + verdict + «המשך» after it, and
 * the options still in the DOM as `aria-disabled` (Layer A) — `scripts/verify-mobile.mjs`.
 *
 * Same non-content as the sibling fixtures: "Lorem" is not a word, the stem is a sentence
 * about the fixture itself, and "טקסט לדוגמה" means "sample text". Nobody learns anything
 * from this card — R-010/R-013 forbid sourced content and the loop forbids invented content.
 */
const FIXTURE = buildSentenceCard({
  wordId: '00000000-0000-4000-8000-000000000000',
  itemIndex: 0,
  stem: 'The ____ is only a layout fixture.',
  answer: 'Lorem',
  options: ['Ipsum', 'Lorem', 'Dolor'],
  translationHe: 'טקסט לדוגמה',
  exampleNeutral: 'The Lorem is only a layout fixture.',
});

export default function DevChoiceCardPage() {
  return (
    <>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו תוכן לימודי</p>
      <Flashcard card={FIXTURE} onGrade={() => undefined} />
    </>
  );
}
