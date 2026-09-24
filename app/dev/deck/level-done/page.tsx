'use client';

import StudyDeckScreen from '@/components/StudyDeckScreen';

/**
 * Layout fixture for `check:mobile` — `T-415` · `F-282`: the END of a level (`T-412`).
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * 🔬 **למה נתיב משלו:** `kind: 'level_done'` נקבע ⛔ רק מתשובת השרת (`atEnd: true`), ו-`next
 * start` ⛔ אינו נושא סביבת Supabase ⇒ `/study?deck=level` מרנדר שם `schema_missing`, ⛔ ואף
 * שער ⛔ לא ראה את המצב היחיד שמוציא את הלומד מסוף הבנק (`D-065`). אותו נימוק בדיוק כמו
 * `/dev/deck/done` מול `/dev/deck`: ענף שאינו נגיש מהנתיב שמעליו מקבל נתיב משלו.
 *
 * ⛔ **והפיקסצ׳ר ⛔ אינו נבדל מהייצור:** אותו `<StudyDeckScreen>`, אותה חפיסה (`level`), ו-`band`
 * כפי ש-`app/study/page.tsx` מעביר אותו — ⛔ רק מצב המסך מגיע כ-prop במקום מהרשת.
 * ⚠️ הכפתור «מההתחלה» ⛔ אינו נלחץ בהליכה: לחיצה היא כתיבה (`POST /api/study/queue`).
 */
export default function DevDeckLevelDonePage() {
  return <StudyDeckScreen deck="level" band="A1" fixtureState="level_done" />;
}
