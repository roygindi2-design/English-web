import LevelScan from '@/components/LevelScan';

// T-264 — the exact string `<LevelScan>`'s own `<h1>` already renders
// (`components/LevelScan.tsx` `HEADING_HE`); the suffix is `app/layout.tsx`'s
// `title.template`.
export const metadata = { title: 'סריקת רמה' };

/**
 * מסך הזרימה של סריקת הרמה — T-082 · D-041.
 *
 * ⛔ נשאר Server Component דק: הרשימה נקראת בלקוח דרך `lib/api/client.ts`, בדיוק כמו
 * ב-`app/study/page.tsx`. שליפה בשרת הייתה מקפיאה את הרשימה בציור הראשון, ולומד
 * שסימן וחזר היה מקבל את אותן מילים שוב.
 *
 * ⛔ **מחוץ ל-`app/(tabs)/`, ובכוונה:** מסך זרימה מלא-מסך אינו מקבל סרגל ניווט ראשי
 * (D-028), אחרת הרשת מאבדת את המסך שהיא זקוקה לו. הדרך החוצה היא הקישור «חזרה למפת
 * הרמה» שהרכיב נושא בכל מצב סופי.
 */
export default function LevelScanPage() {
  return <LevelScan />;
}
