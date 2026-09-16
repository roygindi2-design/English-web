import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { counterCells, filterProgress } from '@/lib/core/filterProgress';
import { summarizeLevel } from '@/lib/core/levelSummary';

describe('filterProgress — הפס של 36 § 5 (T-210 · D-123)', () => {
  it('מחלק את הפס בדיוק כפי ש-36 § 5 מצייר אותו', () => {
    const bar = filterProgress({ totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314 });
    expect(bar.labelHe).toBe('86 / 400 סוננו');
    expect(bar.knownPct + bar.unknownPct + bar.restPct).toBeCloseTo(100, 10);
  });

  it('רמה בלי מילים היא 0%, ⛔ ולא NaN', () => {
    const bar = filterProgress({ totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 });
    expect(bar.knownPct).toBe(0);
    expect(bar.unknownPct).toBe(0);
    expect(bar.restPct).toBe(0);
    expect(bar.labelHe).toBe('0 / 0 סוננו');
  });

  it('⛔ אינו מצייר פס רחב מהמסילה — הוא זורק', () => {
    expect(() => filterProgress({ totalInLevel: 10, known: 8, inReviewList: 5, unseen: 0 })).toThrow(
      RangeError,
    );
  });

  it('⛔ סך שאינו מספר שלם אי-שלילי הוא חריגה, ⛔ ולא ניחוש', () => {
    expect(() => filterProgress({ totalInLevel: -1, known: 0, inReviewList: 0, unseen: 0 })).toThrow(
      RangeError,
    );
    expect(() =>
      filterProgress({ totalInLevel: 1.5, known: 0, inReviewList: 0, unseen: 0 }),
    ).toThrow(RangeError);
  });
});

describe('counterCells — שלושת המונים (T-210 · 36 § 5 · 36 § 12.7)', () => {
  it('סיכום חסר נקרא «—», ⛔ ולעולם לא 0', () => {
    expect(counterCells(null).map((c) => c.value)).toEqual([null, null, null]);
  });

  it('המונים נושאים את תוויות 36 § 5, בסדר RTL', () => {
    const cells = counterCells({ totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314 });
    // ⟦`T-390`⟧ «ברמה» הוא ההיקף המוצהר של המספר האמצעי, ⛔ ולא קישוט — ראה הבדיקה
    // «שני המספרים» למטה, שמריצה את שני המסלולים על אותן שורות.
    expect(cells.map((c) => c.labelHe)).toEqual(['ידעתי', 'לא ידעתי ברמה', 'לא סוננו']);
    expect(cells.map((c) => c.value)).toEqual([61, 25, 314]);
  });

  it('⛔ הסדר מוצהר במודול, ⛔ ולא בסדר האלמנטים ב-JSX', () => {
    const src = readFileSync('lib/core/filterProgress.ts', 'utf8');
    const start = src.indexOf('export function counterCells');
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start);
    expect(body.indexOf("'ידעתי'")).toBeLessThan(body.indexOf("'לא ידעתי ברמה'"));
    expect(body.indexOf("'לא ידעתי ברמה'")).toBeLessThan(body.indexOf("'לא סוננו'"));
  });
});

/**
 * 🔢 **`T-390` · `§ 4.2ז` — שני המספרים, שני המסלולים, אותן שורות.**
 *
 * 🔬 **הפיקסטורה היא בדיוק תרחיש הכשל שהשורה מתארת:** לומד עם מילים ב-**שתי** רמות
 * שנכשל בשתיהן. המונה שמעל המסך רץ דרך `summarizeLevel` ⇒ סופר רמה **אחת**; אריח
 * «חזרה» רץ דרך `isUnknownRow` על **כל** שורות הלומד ⇒ סופר את שתיהן. ⇒ שני מספרים
 * שונים, שניהם נכונים, ועד `T-390` שניהם נשאו את **אותן שתי מילים**.
 *
 * ⛔ **הבדיקה מודדת את שניהם יחד, ⛔ ולא כל אחד לחוד** — הפגם ⛔ אינו קיים באף אחד מהם
 * בנפרד, וזו בדיוק הסיבה ששום בדיקה קיימת ⛔ לא ראתה אותו.
 */
describe('🔢 T-390 — לכל ניסוח במסך אוכלוסייה אחת מוצהרת', () => {
  const failed = { attempts: 1, repetition: 0, selfMarkedKnown: false };

  it('שני המסלולים על אותו לומד מחזירים שני מספרים — והם רשאים להיות שונים', () => {
    const rows = [
      { ...failed, band: 'A1' as const },
      { ...failed, band: 'A1' as const },
      { ...failed, band: 'A2' as const },
    ];
    // מסלול א׳ — `LevelSummary`, מוגבל לרמה (מה שהמונה מצייר).
    const inLevel = summarizeLevel({
      level: 'A1',
      totalInLevel: 10,
      rows: rows.filter((r) => r.band === 'A1'),
    }).inReviewList;
    // מסלול ב׳ — הפרדיקט של `deck=unknown`, מסונן ב-`user_id` בלבד (מה שהאריח מצייר).
    const allLevels = rows.length;

    expect(inLevel).toBe(2);
    expect(allLevels).toBe(3);
    expect(inLevel).not.toBe(allLevels);
  });

  it('🔑 ⛔ ושני הניסוחים ⛔ אינם זהים — כל אחד נוקב באוכלוסייה שלו', () => {
    const counterLabel = counterCells({
      totalInLevel: 10, known: 0, inReviewList: 2, unseen: 8,
    }).find((c) => c.key === 'unknown')?.labelHe;
    const tileNote = readFileSync('components/DeckSelector.tsx', 'utf8');

    expect(counterLabel).toBe('לא ידעתי ברמה');
    expect(tileNote).toContain('מילים שסימנת לא ידעתי, בכל הרמות');
    // ⛔ מוטציה: החזרת אחד מהם לניסוח הסתמי מפילה את הבדיקה הזאת בשם.
    expect(counterLabel).not.toBe('לא ידעתי');
  });
});
