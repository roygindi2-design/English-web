import ArenaBattle, { type ArenaRound } from '@/components/ArenaBattle';
// ⛔ פיקסטורה שנבדלת מהייצור היא חור: `/arcade` טוען את פלטת הזירה, ⇒ גם כאן.
import '../../../arcade/arcade-tokens.css';

/**
 * 🧪 `T-453` (`C-0781`) · המשך של `T-421` — סוף הסיבוב, «שומר את הקרב…»: הקרב נגמר על
 * השעון והתוצאה עוד ⛔ לא חזרה מהשרת. ⛔ אף נתיב ⛔ לא רינדר את המסך הזה בלי שרת, ⇒
 * `check:mobile` ⛔ לא ראה אותו ב-320/375/414. ⛔ **אותו רכיב ואותן מחרוזות** — רק
 * `initialEnded` מוזרק (`ArenaBattle.tsx`), ו-`POST /api/arcade/result` ⛔ אינו יוצא.
 * ⛔ המילים הן צורה בלבד, ⛔ לא תוכן: המסך ⛔ אינו מציג אף אחת מהן.
 * noindex (`app/dev/arcade/layout.tsx`), לא מקושר, ⛔ אינו מסך לימוד.
 */
const ROUND: ArenaRound = {
  level: 'A1',
  questions: [1, 2, 3].map((n) => ({
    wordId: `w${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    options: [
      { he: `אפשרות ${n}`, kind: 'met' as const },
      { he: `מסיח ${n}א`, kind: 'met' as const },
      { he: `מסיח ${n}ב`, kind: 'met' as const },
      { he: `מסיח ${n}ג`, kind: 'met' as const },
    ],
    kind: 'base' as const,
  })),
};

export default function DevArcadeEndPage() {
  return <ArenaBattle initialRound={ROUND} initialEnded />;
}
