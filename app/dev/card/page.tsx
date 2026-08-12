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
 *
 * `needsHumanReview: true` is deliberate and belongs to this fixture alone (T-045):
 * it is the only way `check:mobile` ever has the "טרם אומת" line in the DOM, and
 * the line is the widest single run of text on the back. A fixture that hid it
 * would leave the marker measured by nothing but a source scan. The sibling
 * fixtures stay `false` so the unmarked back is measured too.
 */
const FIXTURE = buildCard(
  {
    headword: 'Lorem',
    translationHe: 'טקסט לדוגמה',
    examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
    needsHumanReview: true,
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
