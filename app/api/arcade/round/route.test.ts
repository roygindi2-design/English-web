import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
const CODE = withoutComments(readFileSync('app/api/arcade/round/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('⛔ D-052 — הזירה אינה יודעת שקיים צד לימודי', () => {
  it.each(['current_level', 'word_progress', 'self_marked_known', 'repetition',
           'next_review_at', 'easiness', 'interval_days'])(
    '⛔ %s אינו מופיע בנתיב — גם לא בקריאה', (token) => {
      expect(CODE).not.toContain(token);
    });

  it('⛔ הטבלה `profiles` אינה נקראת בכלל', () => {
    expect(CODE).not.toMatch(/\.from\('profiles'\)/);
  });

  it('הטבלאות שנקראות הן בדיוק arcade_progress ו-words', () => {
    const read = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(read)].sort()).toEqual(['arcade_progress', 'words']);
  });

  it('⛔ הנתיב עדיין אינו כותב דבר', () => {
    expect(CODE).not.toMatch(/\.(insert|upsert|update|delete)\(/);
  });

  it('⛔ הסינון הוא cefr_profile_band ולעולם לא senses.cefr_level (D-034 · D-058)', () => {
    expect(CODE).toContain('cefr_profile_band');
    expect(CODE).not.toContain('cefr_level');
  });
});

describe('⛔ קריאה בלבד — D-044 בשכבת הנתיב', () => {
  it.each(['.update(', '.insert(', '.upsert(', '.delete('])('⛔ %s אינו מופיע בקובץ', (verb) => {
    expect(CODE).not.toContain(verb);
  });
});

describe('בחירת המילים (D-034 · § 4.2י)', () => {
  const selectBlock = CODE.slice(CODE.indexOf('ROUND_SELECT'), CODE.indexOf('function isSchemaMissing'));

  it('הסינון נעשה על ה-band שנגזר מהסולם ⛔ ולא על רמת לומד', () => {
    expect(CODE).toContain(".eq('cefr_profile_band', band)");
  });

  it('⛔ הנתיב ⛔ אינו מייצר מסיחים בזמן אמת — הבנייה כולה בשכבה הטהורה (F-020)', () => {
    expect(CODE).not.toMatch(/generateDistractor|makeDistractor/i);
    expect(CODE).toContain('buildRound(');
  });

  /**
   * 🔴 T-152 · D-087 — האפשרויות עבריות. `sense_distractors` הוא **אנגלית**, ולכן השדה
   * שנוסע לשכבה הטהורה נקרא `distractorsEn` ⛔ ואינו יכול להיקרא `distractorsHe`:
   * השם הישן הוא בדיוק מה שאִפשר להגיש ללומד תרגום עברי אחד מול שלוש מילים באנגלית.
   */
  it('⛔ השם ⛔ אינו משקר — `distractorsEn`, ⛔ ולעולם לא `distractorsHe`', () => {
    expect(CODE).toContain('distractorsEn');
    expect(CODE).not.toContain('distractorsHe');
  });

  /**
   * T-212 · D-129 — `sense_distractors!inner` is gone. ⛔ The old assertion was ⛔ NOT
   * deleted, it was **flipped**: a test removed without a replacement is exactly what
   * felled T-164.
   */
  it('⛔ `sense_distractors!inner` ⛔ אינו קיים — T-152 מחקה את העילה שלו (D-129)', () => {
    expect(selectBlock).toContain('senses!inner');
    expect(selectBlock).not.toContain('sense_distractors!inner');
  });

  it('הצומת עדיין נקרא — האפשרויות עבריות, אך `sense_distractors` ⛔ אינו יוצא מהשאילתא', () => {
    expect(selectBlock).toContain('sense_distractors(distractor)');
  });

  it('order בא לפני limit — תקרה על סדר לא מוגדר חותכת אוכלוסייה אקראית (לקח F-034)', () => {
    expect(CODE.indexOf(".order('ngsl_rank'")).toBeLessThan(CODE.indexOf('.limit('));
  });
});

describe('⛔ אין שעון (D-045 · R-020) — נמדד בסריקת מקור', () => {
  it.each(['setTimeout', 'setInterval', 'deadline', 'countdown'])('⛔ %s אינו מופיע', (token) => {
    expect(CODE).not.toContain(token);
  });
});

describe('הנתיב אינו מחליט — ההחלטה בשכבה הטהורה', () => {
  it('קורא ל-buildRound ⛔ ואינו סופר או מסנן בעצמו', () => {
    expect(CODE).toContain('buildRound(');
    expect(CODE).not.toMatch(/\.filter\([^)]*band/);
  });

  it('רמה קטנה מדי ⇒ 200 עם המספר, ⛔ לא 404 ו⛔ לא מסך ריק (D-046)', () => {
    const branch = CODE.slice(CODE.indexOf('if (!round.ok)'), CODE.indexOf('return NextResponse.json({\n    ok: true, gameLevel: round.gameLevel'));
    expect(branch).toContain('eligible');
    expect(branch).toContain('describeLevel(');
    expect(branch).not.toContain('404');
  });

  it('הרמה נגזרת מהסולם ב-lib/core ⛔ ולא ממספר בקובץ הנתיב', () => {
    expect(CODE).toContain('gameLevelAt(');
    expect(CODE).toContain("from '@/lib/core/arcadeLadder'");
  });

  it('⛔ אין מצב «טרם בחר רמה» — הזירה מתחילה ברמה 1 לכל לומד (D-052)', () => {
    expect(CODE).not.toMatch(/level:\s*null/);
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('GET /api/arcade/round');
  });

  it('החוזה מתאר gameLevel ⛔ ולא current_level', () => {
    const section = CONTRACT.slice(CONTRACT.indexOf('GET /api/arcade/round'));
    const block = section.slice(0, section.indexOf('\n## ', 1));
    expect(block).toContain('gameLevel');
    expect(block).not.toContain('current_level');
  });
});
