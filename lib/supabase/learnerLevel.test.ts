import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0013_learner_level.sql` — שני השדות של D-038 (T-079).
 *
 * אותה גישה ואותן מגבלות כמו `authAttemptsSchema.test.ts`: זה מוכיח מה הקובץ **אומר**,
 * ⛔ לא שהוא הורץ. ההרצה היא פעולה של רוי (`03-for-roy` פריט 28).
 *
 * ההערות מולבנות לפני כל טענה: אילוץ שהוער החוצה הוא אילוץ שאינו קיים, והתאמת טקסט
 * גולמי הייתה נשארת ירוקה מעליו — וגם הייתה נכשלת על ההסבר שמצדיק אותה.
 */
const SQL = readFileSync('supabase/migrations/0013_learner_level.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0013_learner_level — אידמפוטנטיות', () => {
  it('כל שלוש העמודות נוספות עם if not exists — מיגרציה שהורצה חייבת להיות no-op', () => {
    expect(BODY).toMatch(/alter table public\.profiles\s+add column if not exists current_level text/i);
    expect(BODY).toMatch(/alter table public\.word_progress\s+add column if not exists self_marked_known boolean/i);
    expect(BODY).toMatch(/alter table public\.word_progress\s+add column if not exists self_marked_at timestamptz/i);
  });

  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('האילוץ מוצהר בנפרד ובשם — ⛔ לא כ-add column … check (לקח C-0032)', () => {
    // `add column ... check` מדולג **כולו** כשהעמודה כבר קיימת, ואז האילוץ נעדר בשקט.
    expect(BODY).not.toMatch(/add column if not exists current_level[^;]*check/i);
    expect(BODY).toMatch(/conname\s*=\s*'profiles_current_level_check'/i);
    expect(BODY).toMatch(/add constraint profiles_current_level_check/i);
  });
});

describe('0013_learner_level — מה השדות מרשים', () => {
  it('שש הרמות, ורק הן', () => {
    const check = /current_level in \('A1','A2','B1','B2','C1','C2'\)/i;
    expect(BODY).toMatch(check);
  });

  it('current_level נשאר nullable — ⛔ אין ברירת מחדל שקטה ל-A1 (D-037)', () => {
    expect(BODY).toMatch(/current_level is null or current_level in/i);
    expect(BODY).not.toMatch(/current_level text[^;]*not null/i);
    expect(BODY).not.toMatch(/current_level[^;]*default\s+'A1'/i);
  });

  it('self_marked_known הוא not null default false — «לא סימנתי» היא מדידה, ⛔ לא חוסר', () => {
    expect(BODY).toMatch(/self_marked_known boolean not null default false/i);
  });

  it('self_marked_at נשאר nullable — מי שלא סימן אין לו רגע סימון', () => {
    expect(BODY).not.toMatch(/self_marked_at timestamptz[^;]*not null/i);
  });
});

describe('⛔ הבדיקה החשובה בקובץ: SM-2 לא נגעו בו (§ 4.2ז מדד ⓑ · T-079)', () => {
  it.each(['easiness', 'interval_days', 'repetition', 'next_review_at', 'consecutive_correct_recognition'])(
    '⛔ %s אינו מופיע באף שורת SQL',
    (column) => {
      expect(BODY).not.toMatch(new RegExp(`\\b${column}\\b`, 'i'));
    },
  );

  it('⛔ senses.cefr_level אינו מופיע — הרמה של המילה היא words.cefr_profile_band (D-034)', () => {
    expect(BODY).not.toMatch(/cefr_level/i);
  });
});

describe("⛔ RLS אינה מוצהרת מחדש — מדיניות שנייה מ-OR'ד ויכולה רק להרחיב גישה", () => {
  it('אין create policy ואין enable row level security בקובץ', () => {
    expect(BODY).not.toMatch(/create policy/i);
    expect(BODY).not.toMatch(/enable row level security/i);
  });
});
