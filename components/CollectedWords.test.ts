import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/** תבנית `components/WritingChain.test.ts` — סריקת מקור אחרי הלבנת הערות. */
const SRC = readFileSync('components/CollectedWords.tsx', 'utf8');
const CODE = withoutComments(SRC);

describe('§ 4.2יב · T-110 — רשימה, ⛔ ולא מנוע', () => {
  it('⛔ אפס גישה ישירה ל-fetch — הכל דרך lib/api/client.ts (D-051)', () => {
    expect(CODE).not.toMatch(/\bfetch\s*\(/);
    expect(CODE).toContain("from '@/lib/api/client'");
  });

  it('משתמש ב-<EnWord> למילה האנגלית', () => {
    expect(CODE).toContain('<EnWord');
  });

  it('«הסתר» הוא יעד מגע ≥44px', () => {
    expect(CODE).toContain('min-h-touch');
  });

  it('⛔ אפס svg/גרף — ⛔ לא dataviz (§ 4.2יב שאלה 5)', () => {
    expect(CODE).not.toContain('<svg');
    expect(CODE.toLowerCase()).not.toContain('chart');
  });

  // ⚠️ **גבול מילה ⛔ ולא `toContain`, וזה נמדד:** `'xp'` הוא תת-מחרוזת של `export`,
  // ולכן `expect(CODE.toLowerCase()).not.toContain('xp')` היה נכשל על **כל** קובץ
  // TypeScript תקין בעולם. אסרציה שאי-אפשר להעביר אינה שומר — היא רעש.
  it.each(['streak', 'רצף', 'ניקוד', 'score', 'xp'])('⛔ אפס «%s» (D-050)', (bad) => {
    expect(CODE).not.toMatch(new RegExp(`(?<![\\p{L}\\d])${bad}(?![\\p{L}\\d])`, 'iu'));
  });

  it('⛔ אפס toLocaleDateString — הידרציה (הלקח של C-0205)', () => {
    expect(CODE).not.toContain('toLocaleDateString');
  });

  it('⛔ אפס hex ואפס justify-center (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toContain('justify-center');
  });

  it('⛔ אפס רמת CEFR במסך', () => {
    expect(CODE.toLowerCase()).not.toContain('cefr');
    for (const band of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) expect(CODE).not.toContain(`'${band}'`);
  });

  it.each(['word_progress', 'next_review_at', 'easiness', 'self_marked_known', 'current_level'])(
    '⛔ %s ⛔ אינו מופיע במסך (D-052)', (bad) => {
      expect(CODE).not.toContain(bad);
    },
  );

  it('שלושת המצבים מרונדרים מ-viewCollection, ⛔ ולא מתנאי מקומי', () => {
    expect(CODE).toContain('viewCollection');
    expect(CODE).toContain("'all_hidden'");
  });

  it('«נפגשת N פעמים» מגיע מ-encountersHe, ⛔ ולא נבנה במסך', () => {
    expect(CODE).toContain('encountersHe');
    expect(CODE).not.toContain('פעמים`');
  });

  it('טעינה = שלד שלוש שורות, ⛔ לא ספינר (§ 4.2יב מצבי קצה)', () => {
    expect(CODE.toLowerCase()).not.toContain('spinner');
    expect(CODE).toContain('animate-pulse');
  });

  it('מצב ריק נושא **פעולה אחת** — קישור לזירה', () => {
    expect(CODE).toContain('/arcade');
  });

  it('⛔ אפס מרכוז אנכי — עוגן למעלה (F-011)', () => {
    expect(CODE).not.toContain('items-center justify');
    expect(CODE).not.toContain('m-auto');
  });
});
