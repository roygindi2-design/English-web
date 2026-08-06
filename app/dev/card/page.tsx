'use client';

import Flashcard from '@/components/Flashcard';
import { buildCard } from '@/lib/core/flashcard';

/**
 * Layout harness for check:mobile. NOT a learning screen and NOT linked from
 * anywhere in the product.
 *
 * The strings below are deliberately NOT a word pair: "Lorem" has no Hebrew
 * meaning and "טקסט לדוגמה" means "sample text". Nobody can learn anything from
 * this card, which is exactly the point — R-010/R-013 forbid sourced content and
 * the loop forbids invented content, so the fixture teaches nothing at all.
 */
const FIXTURE = buildCard(
  {
    headword: 'Lorem',
    translationHe: 'טקסט לדוגמה',
    examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
  },
  'recognition',
  { isFirstEncounter: true },
);

export default function DevCardPage() {
  return (
    <>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו תוכן לימודי</p>
      <Flashcard card={FIXTURE} onGrade={() => undefined} />
    </>
  );
}
