import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
const CODE = withoutComments(readFileSync('app/api/arcade/round/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

/**
 * ⚠️ **נכתב מחדש 28/08 (T-219 · D-139).** עד כאן השומר אסר על `word_progress` ועל
 * `self_marked_known` להופיע בנתיב **גם בקריאה**, ו-`37 § 13.3` מתיר קריאה במפורש
 * («הזירה **קוראת** את רשימת המילים הידועות»). ⛔ השומר ⛔ **לא נמחק** — מחיקת שומר
 * בלי שהוא מוחלף היא מה שהפיל את `T-164`; הוא צומצם ל«קריאה מותרת · כתיבה אסורה».
 * ⛔ **D-052 ⛔ אינו נפגע** — ה-`band` עדיין נגזר מ-`arcade_level` בלבד, ושמות שדות
 * ה-SM-2 עדיין אסורים בקובץ לחלוטין.
 */
describe('⛔ D-052 · 37 § 13.3 — קריאה מותרת, כתיבה אסורה', () => {
  it.each(['current_level', 'repetition', 'next_review_at', 'easiness', 'interval_days'])(
    '⛔ %s אינו מופיע בנתיב — גם לא בקריאה', (token) => {
      expect(CODE).not.toContain(token);
    });

  it('⛔ הטבלה `profiles` אינה נקראת בכלל', () => {
    expect(CODE).not.toMatch(/\.from\('profiles'\)/);
  });

  it('`word_progress` נקרא, ו⛔ אך ורק ב-select', () => {
    expect(CODE).toContain("from('word_progress')");
    const calls = [...CODE.matchAll(/\.from\('word_progress'\)([\s\S]{0,120})/g)];
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c[1]).toMatch(/^\s*\.select\(/);
  });

  it('הטבלאות שנקראות הן בדיוק arcade_progress · words · word_progress', () => {
    const read = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(read)].sort()).toEqual(['arcade_progress', 'word_progress', 'words']);
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

  /**
   * ⚠️ **צומצם 28/08 (T-153).** השומר קבע את המחרוזת המלאה `sense_distractors(distractor)`,
   * ו-T-153 הוסיפה לה `relation_type` — התיוג שבלעדיו ⛔ אין תמהיל D-023 כלל.
   * ⛔ **השומר ⛔ לא נמחק:** מה שהוא שומר עליו הוא ש**הצומת נקרא** ושהוא ⛔ אינו `!inner`,
   * ⛔ ולא רשימת העמודות המדויקת. ⇒ הוא בודק את הקידומת, והבדיקה שמתחתיו קובעת ש-
   * `relation_type` **חייב** להופיע.
   */
  it('הצומת עדיין נקרא — האפשרויות עבריות, אך `sense_distractors` ⛔ אינו יוצא מהשאילתא', () => {
    expect(selectBlock).toContain('sense_distractors(distractor');
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

describe('T-153 · D-138 § א׳ — הפתירה היא צירוף, ⛔ לא עמודה', () => {
  it('‏`relation_type` נשלף — בלי התיוג התמהיל אינו קיים', () => {
    expect(CODE).toContain('relation_type');
  });

  it('⛔ אין מיגרציה ואין עמודת שפה — D-138 § א׳ ביטלה את `T-153` ⓐ', () => {
    expect(CODE).not.toContain('distractor_lang');
    expect(CODE).not.toMatch(/\blang\b/);
  });

  it('הפתירה קוראת `words` שוב — ⛔ ולא טבלה חדשה', () => {
    const read = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(read)].sort()).toEqual(['arcade_progress', 'word_progress', 'words']);
  });

  it('⛔ הפתירה חסומה בתקרה — ⛔ URL בלי גבול הוא 414 בייצור', () => {
    expect(CODE).toContain('MAX_RESOLVE_HEADWORDS');
    expect(CODE).toContain('RESOLVE_CHUNK');
  });

  it('⛔ הנתיב עדיין ⛔ אינו כותב דבר, גם אחרי השאילתה השנייה', () => {
    expect(CODE).not.toMatch(/\.(insert|upsert|update|delete)\(/);
  });

  it('⛔ הערך הפתור נוסע ב-`taggedHe`, ⛔ ולעולם לא ב-`distractorsEn`', () => {
    expect(CODE).toContain('taggedHe');
    expect(CODE).toContain('distractorsEn');
    expect(CODE).not.toContain('distractorsHe');
  });

  it('⛔ תרגום בביטחון `low` ⛔ אינו נעשה מסיח — D-013 חל גם על המסיח', () => {
    const resolve = CODE.slice(CODE.indexOf('RESOLVE_SELECT'));
    expect(resolve).toContain('translation_confidence');
    expect(resolve).toContain("'low'");
  });

  it('החוזה מתעדכן באותו קומיט — `docs/api-contract.md` נוקב בתמהיל', () => {
    expect(CONTRACT).toContain('T-153');
    expect(CONTRACT).toContain('relation_type');
  });
});
