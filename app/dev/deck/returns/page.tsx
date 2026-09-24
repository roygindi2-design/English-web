'use client';

import StudyDeckScreen from '@/components/StudyDeckScreen';
import { moduleAnchorId, moduleReturnDestination } from '@/lib/core/studyTracks';

/**
 * Layout fixture for `check:mobile` — `T-415` · `F-282`: a deck opened FROM a study module
 * (`T-408`), whose way out returns to that module and ⛔ not to `/cards`.
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * 🔬 **למה נתיב משלו:** `returnTo` מגיע ⛔ רק מ-`?return=` שעבר את `moduleReturnDestination`,
 * ו⛔ שום פיקסצ׳ר ⛔ לא העביר אותו ⇒ התווית «חזרה לנתיב» ⛔ נמדדה אף פעם ב-320/375/414.
 * המצב `empty` נבחר כי שם היציאה היא **הפעולה הראשית** של המסך, ⛔ ולא שורה בתוך `<CardDeck>`.
 *
 * ⛔ **היעד נבנה באותה פונקציה שהייצור קורא לה**, מעוגן אמיתי (`vocabulary` · `A2`, העוגן
 * ש-`lib/core/studyTracks.test.ts` כבר בודק) ⇒ ⛔ אין כאן כתובת שהפיקסצ׳ר המציא.
 */
const RETURN_TO = moduleReturnDestination(moduleAnchorId('vocabulary', 'A2'));

export default function DevDeckReturnsPage() {
  return (
    <StudyDeckScreen
      deck="level"
      band="A2"
      {...(RETURN_TO === null ? {} : { returnTo: RETURN_TO })}
      fixtureState="empty"
    />
  );
}
