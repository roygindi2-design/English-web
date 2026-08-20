import LevelScan from '@/components/LevelScan';
import type { ScanWord } from '@/lib/core/levelScan';

/**
 * פיקסטורת פריסה ל-`check:mobile`. ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * ⚠️ **בלי הפיקסטורה הרשת עצמה לעולם אינה נמדדת:** ל-`next start` בהרנס אין env של
 * Supabase, ולכן `GET /api/levels/scan` עונה 503 בחוזה שלו עצמו — כלומר כל שורת
 * «ok /study/scan» הייתה מתארת את מסך **הכשל**, וזו בדיוק מחלקת F-027. שתים-עשרה
 * המילים כאן הן מחרוזות פריסה, ⛔ ואינן תוכן לימודי.
 *
 * הפיקסטורה מקבלת את המילים כ-prop ואינה מבקשת מהשרת דבר ⇒ ⛔ אין לה רשומה
 * ב-`EXPECTED_CONSOLE`, והשקט הזה הוא מה שמוכיח שהמדידה אינה על מסך הכשל.
 */
const WORDS: readonly ScanWord[] = [
  'ability', 'balance', 'capital', 'decision', 'evidence', 'feature',
  'general', 'however', 'increase', 'journey', 'knowledge', 'language',
].map((headword, i) => ({
  wordId: `${`${i}`.padStart(8, '0')}-2222-4333-8444-555555555555`,
  headword,
}));

export default function DevScanPage() {
  return <LevelScan initialWords={WORDS} />;
}
