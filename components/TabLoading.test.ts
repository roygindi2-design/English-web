import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

/**
 * ⟦NEW 12/09 · `T-300`⟧ **גבול טעינה לכל לשונית — ⛔ ולא אחד בשורש לכולן.**
 *
 * 🔬 **הפגם שנמדד, ⛔ ולא שוער:** עד היום `app/loading.tsx` היה גבול ה-Suspense
 * **היחיד** באפליקציה (‏`find app -name loading.tsx` ⇒ קובץ אחד). ⇒ כל מעבר בין
 * לשוניות החליף את **כל** המסך — כולל האזור שבו יושב הסרגל — בשלד גנרי אחד,
 * והמוצר נקרא «האפליקציה נטענת» במקום «הסעיף מתחלף». זו תצפית של רוי, 12/09.
 *
 * ⛔ **והניווט ⛔ מעולם לא היה אשם:** `components/TabBar.tsx` משתמש ב-`next/link`
 * ⇒ המעבר צד-לקוח. מה שנשבר הוא **מה נשאר צבוע בזמן שהוא קורה**.
 *
 * ⛔ הבדיקה הזאת היא מה שמונע נסיגה שקטה: לשונית שתיווסף בלי `loading.tsx`,
 * או שלד שיועתק מהגנרי ויאבד את צורת המסך שלו.
 */
const TABS = readdirSync('app/(tabs)', { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

describe('12/09 — T-300 · לכל לשונית גבול טעינה משלה', () => {
  it('⛔ חמש הלשוניות נמצאו, ⛔ והרשימה ⛔ אינה קשיחה', () => {
    expect(TABS.sort()).toEqual(['cards', 'me', 'settings', 'studies', 'world']);
  });

  it.each(TABS)('%s — יש `loading.tsx`', (tab) => {
    expect(existsSync(`app/(tabs)/${tab}/loading.tsx`), `⛔ ${tab} ⛔ אינה נושאת גבול`).toBe(true);
  });

  // 🔴 הטענה שמונעת «העתק-הדבק של השלד הגנרי»: כל שלד חייב להיות **שונה** מהשורשי.
  it.each(TABS)('%s — השלד ⛔ אינו העתק של השורשי', (tab) => {
    const root = readFileSync('app/loading.tsx', 'utf8');
    const tabFile = readFileSync(`app/(tabs)/${tab}/loading.tsx`, 'utf8');
    const body = (t: string) => t.slice(t.indexOf('return ('));
    expect(body(tabFile), `⛔ ${tab} העתיק את השלד הגנרי`).not.toBe(body(root));
  });

  // ⛔ נגישות: השורשי מצהיר `aria-busy` · `aria-live` · «טוען» לקורא מסך. ⛔ אין
  // סיבה שלשונית תוותר על אחד מהם, ולומד עם קורא מסך ⛔ לא ישמע שדבר קורה.
  it.each(TABS)('%s — מצהיר טעינה לקורא מסך', (tab) => {
    const t = readFileSync(`app/(tabs)/${tab}/loading.tsx`, 'utf8');
    expect(t, 'aria-busy').toContain('aria-busy="true"');
    expect(t, 'aria-live').toContain('aria-live="polite"');
    expect(t, 'הטקסט לקורא המסך').toContain('טוען');
  });

  // ⛔ השורשי נשאר: הוא הנכון לכל מה שמחוץ ל-`(tabs)`.
  it('⛔ השלד בשורש ⛔ לא הוסר', () => {
    expect(existsSync('app/loading.tsx')).toBe(true);
  });
});
