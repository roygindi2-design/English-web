'use client';

import CardDeck from '@/components/CardDeck';
import type { QueueCardInput } from '@/lib/core/deck';

/**
 * Layout fixture for `check:mobile` — `T-400`, the `סינון מילים` deck WITH the foot row.
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * 🔬 **למה נתיב משלו, ⛔ ולא `/dev/deck`, ונמדד ⛔ ולא הוסק:** `/dev/deck` מרנדר
 * `deck="due"` — ול«מנת היום» ⛔ אין רמה שמשהו «נשאר» בה, ⇒ `unseenInLevel` שם היה
 * טענה שגויה על המסך. שורת הכף־רגל היא **ענף שאינו נגיש מהנתיב שמעליו**, וזה בדיוק
 * השיקול שהצדיק את `/dev/deck/done` מול `/dev/deck` ואת `/dev/deck/skeleton`.
 *
 * ⛔ **והפיקסצ׳ר ⛔ אינו נבדל מהייצור בממד שלישי** (§ 5, הלקח מ-23/08): אותו
 * `<CardDeck>`, אותו `exit` ש-`<StudyDeckScreen>` מעביר, ואותה חפיסה בת חמישה
 * כרטיסים — ⛔ רק החפיסה היא `level` והמספר מגיע כ-prop במקום מהרשת, בדיוק כפי
 * שהוא מגיע ב-`/dev/deck`.
 *
 * ⚠️ **314 ⛔ ואינו מספר עגול:** זה המספר שהרנדר עצמו מצייר
 * (`render_video_A.py:391` — «נשארו 314 מילים ברמה»), ⇒ הרוחב שהשער מודד ב-320px
 * הוא הרוחב שהעיצוב ביקש. ⛔ «300» היה מודד שורה קצרה יותר מהאמיתית.
 *
 * אותו לא-תוכן של שאר הפיקסצ׳רים: "Lorem"/"Ipsum" ⛔ אינן מילים אנגליות והעברית
 * קוראת «טקסט לדוגמה» — R-010/R-013 אוסרים תוכן ממקור, והלופ אוסר תוכן מומצא.
 */
const FIXTURE: readonly QueueCardInput[] = [
  {
    word_id: 'fixture-level-lorem',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Lorem',
      translation_he: 'טקסט לדוגמה',
      examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
      needs_human_review: false,
    },
    review: { next_review_at: null, interval_days: 0 },
  },
  {
    word_id: 'fixture-level-ipsum',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Ipsum',
      translation_he: 'טקסט אחר',
      examples: { supportive: 'The Ipsum is also a fixture.', neutral: '' },
      needs_human_review: false,
    },
    review: { next_review_at: null, interval_days: 0 },
  },
  {
    word_id: 'fixture-level-dolor',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Dolor',
      translation_he: 'שלישי לדוגמה',
      examples: { supportive: 'The Dolor is a third fixture card.', neutral: '' },
      needs_human_review: false,
    },
    review: { next_review_at: null, interval_days: 0 },
  },
  {
    word_id: 'fixture-level-sit',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Sit',
      translation_he: 'רביעי לדוגמה',
      examples: { supportive: 'The Sit is a fourth fixture card.', neutral: '' },
      needs_human_review: false,
    },
    review: { next_review_at: null, interval_days: 0 },
  },
  {
    word_id: 'fixture-level-amet',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Amet',
      translation_he: 'חמישי לדוגמה',
      examples: { supportive: 'The Amet is a fifth fixture card.', neutral: '' },
      needs_human_review: false,
    },
    review: { next_review_at: null, interval_days: 0 },
  },
];

export default function DevDeckLevelPage() {
  return (
    <CardDeck
      deck="level"
      cards={FIXTURE}
      // Resolves and does nothing — the same stub `/dev/deck` uses, for the same reason: a
      // rejecting stub would keep the graded card in place and the harness could never
      // measure the advance.
      onGraded={() => Promise.resolve()}
      exit={{ href: '/cards', labelHe: 'חזרה לכרטיסיות' }}
      unseenInLevel={314}
      // `T-516` — what `<StudyDeckScreen>` passes on `level`: the screen's name and the band
      // the server said it served. «A1» is the band `kol-A-03-card` itself draws.
      titleHe="כרטיסיות"
      levelBand="A1"
    />
  );
}
