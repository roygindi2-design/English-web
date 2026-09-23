import ArenaBattle from '@/components/ArenaBattle';
// ⛔ פיקסטורה שנבדלת מהייצור היא חור: `/arcade` טוען את פלטת הזירה, ⇒ גם כאן.
import '../../../arcade/arcade-tokens.css';

/**
 * 🧪 `T-421` (`C-0779`) · המשך של `T-416` — טעינה — שלד הקרב, לפני שהסיבוב הגיע מהשרת.
 * ⛔ אף נתיב ⛔ לא רינדר את המסך הזה בלי שרת, ⇒ `check:mobile` ⛔ לא ראה אותו ב-320/375/414.
 * ⛔ **אותו רכיב ואותן מחרוזות** — רק `initialScreen` מוזרק (`ArenaBattle.tsx`), והבקשה
 * לשרת ⛔ אינה יוצאת. noindex (`app/dev/arcade/layout.tsx`), לא מקושר, ⛔ אינו מסך לימוד.
 */
export default function DevArcadeLoadingPage() {
  return <ArenaBattle initialScreen={{ kind: 'loading' }} />;
}
