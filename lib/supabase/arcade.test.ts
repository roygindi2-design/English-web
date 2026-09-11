import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0014_arcade.sql` (T-092 · § 4.2י · D-044).
 *
 * אותה גישה ואותן מגבלות כמו `learnerLevel.test.ts`: זה מוכיח מה הקובץ **אומר**,
 * ⛔ לא שהוא הורץ. ההרצה היא פעולה של רוי (`03-for-roy` פריט 33).
 *
 * ההערות מולבנות לפני כל טענה — אילוץ שהוער החוצה הוא אילוץ שאינו קיים, והתאמת
 * טקסט גולמי הייתה נשארת ירוקה מעליו, וגם הייתה נכשלת על ההסבר שמצדיק אותו.
 */
const SQL = readFileSync('supabase/migrations/0014_arcade.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0014_arcade — אידמפוטנטיות וטרנזקציה', () => {
  it('שתי הטבלאות נוצרות עם if not exists', () => {
    expect(BODY).toMatch(/create table if not exists public\.arcade_progress/i);
    expect(BODY).toMatch(/create table if not exists public\.arcade_runs/i);
  });

  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('כל אילוץ מוצהר בנפרד ובשם בתוך do $$ — ⛔ לא בתוך create table (לקח C-0032)', () => {
    const createBlocks = BODY.match(/create table if not exists[\s\S]*?\);/gi) ?? [];
    expect(createBlocks).toHaveLength(2);
    for (const block of createBlocks) expect(block).not.toMatch(/\bcheck\s*\(/i);
    for (const name of [
      'arcade_progress_level_check',
      'arcade_progress_wins_check',
      'arcade_runs_counts_check',
    ]) {
      expect(BODY).toMatch(new RegExp(`conname\\s*=\\s*'${name}'`, 'i'));
      expect(BODY).toMatch(new RegExp(`add constraint ${name}`, 'i'));
    }
  });

  it('האינדקס אידמפוטנטי גם הוא', () => {
    expect(BODY).toMatch(/create index if not exists arcade_runs_user_finished_idx/i);
  });
});

describe('⛔ הבדיקה החשובה בקובץ: D-044 נאכף בסכמה, ⛔ לא בהערה', () => {
  it('⛔ אפס מפתח זר ל-word_progress', () => {
    expect(BODY).not.toMatch(/references\s+public\.word_progress/i);
  });

  it('⛔ אפס אזכור של word_progress בשום שורת SQL', () => {
    expect(BODY).not.toMatch(/\bword_progress\b/i);
  });

  it('⛔ אפס טריגר ואפס פונקציית טריגר', () => {
    expect(BODY).not.toMatch(/create\s+(or replace\s+)?trigger/i);
    expect(BODY).not.toMatch(/\bexecute\s+function\b/i);
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'self_marked_known',
    'consecutive_correct_recognition',
    'current_level',
  ])('⛔ %s אינו מופיע באף שורת SQL', (column) => {
    expect(BODY).not.toMatch(new RegExp(`\\b${column}\\b`, 'i'));
  });

  it('שני המפתחות הזרים היחידים מצביעים ל-auth.users', () => {
    const refs = BODY.match(/references\s+[a-z_.]+/gi) ?? [];
    expect(refs).toHaveLength(2);
    for (const ref of refs) expect(ref).toMatch(/references\s+auth\.users/i);
  });
});

describe('מה השדות מרשים', () => {
  it('arcade_progress הוא שורה אחת ללומד — user_id הוא המפתח הראשי', () => {
    expect(BODY).toMatch(/user_id\s+uuid primary key references auth\.users/i);
  });

  it('unlocked_items הוא מערך טקסט, avatar_parts הוא jsonb, שניהם not null עם ברירת מחדל ריקה', () => {
    expect(BODY).toMatch(/unlocked_items\s+text\[\] not null default '\{\}'::text\[\]/i);
    expect(BODY).toMatch(/avatar_parts\s+jsonb\s+not null default '\{\}'::jsonb/i);
  });

  it('⛔ אין הפסד שמוריד: אין ולו ברירת מחדל שלילית, והאילוצים חוסמים ירידה מתחת לרצפה', () => {
    expect(BODY).toMatch(/check \(arcade_level >= 1\)/i);
    expect(BODY).toMatch(/check \(wins >= 0\)/i);
  });

  it('ספירות הקרב אינן יכולות לשקר — נכונות ≤ נראות', () => {
    expect(BODY).toMatch(/words_correct <= words_seen/i);
  });

  it('⛔ arcade_runs אינה מחזיקה word_id — «המילים שהפילו אותך» אינו נשמר (D-047)', () => {
    const runsBlock = BODY.slice(BODY.indexOf('create table if not exists public.arcade_runs'));
    expect(runsBlock.slice(0, runsBlock.indexOf(');'))).not.toMatch(/\bword_id\b/i);
  });
});

describe('RLS — מוצהרת פעם אחת על שתי טבלאות חדשות', () => {
  it('RLS מופעלת על שתיהן', () => {
    expect(BODY).toMatch(/alter table public\.arcade_progress enable row level security/i);
    expect(BODY).toMatch(/alter table public\.arcade_runs\s+enable row level security/i);
  });

  it('כל מדיניות היא בעלות עצמית — ⛔ אין ולו אחת בלי auth.uid() = user_id', () => {
    const policies = BODY.match(/create policy[\s\S]*?;/gi) ?? [];
    expect(policies.length).toBeGreaterThanOrEqual(5);
    for (const policy of policies) expect(policy).toMatch(/auth\.uid\(\) = user_id/);
  });

  it('כל create policy מקדימה לו drop policy if exists — הרצה חוזרת ⛔ אינה נופלת', () => {
    const created = (BODY.match(/create policy "([a-z_]+)"/gi) ?? []).map((m) => m.split('"')[1]);
    /**
     * 🔴 **גדר, ⛔ ולא קוסמטיקה — ובדיוק זו שהטענה שלוש שורות מעליה כבר נושאת.** ⟦11/09⟧
     * הרגקס דורש `[a-z_]+` בתוך המרכאות ⇒ מדיניות שתיקרא **`arcade-read`** (מקף)
     * ⛔ **אינה נתפסת**, ‏`created` יוצא **ריק**, והלולאה עוברת בריקנות ⇒ אידמפוטנטיות
     * המיגרציה מפסיקה להיבדק **⛔ בלי שאף בדיקה תאדים**.
     * 🔬 **שתי המדידות, ושתיהן הורצו 11/09 ⛔ ולא הונחו:** ① `0014_arcade.sql` ⇒ 5
     * הצהרות `create policy`, וכל 5 נתפסות; `0015_arcade_decoupling.sql` ⇒ 3 ו-3.
     * ⇒ התקרה היא **5**, כמו בטענה הסמוכה, ⛔ ולא מספר שרירותי. ② שינוי שם ל-`arcade-`
     * מאפס את `created` והגדר **מאדים** — נבדק בפועל על המיגרציה ואז הוחזר.
     * ⚠️ **ו⛔ אות גדולה ⛔ אינה המסלול:** לרגקס יש דגל `i`, ולכן `Arcade_read` **כן**
     * נתפס — נבדק, ‏25/25 עברו. המקף הוא החור, ⛔ והאות ⛔ לא.
     * ⚠️ ⇒ ⛔ לא חודש כאן כלל — ⛔ רק נסגרה אי-סימטריה בין שתי טענות על אותו קובץ.
     */
    expect(
      created.length,
      '⛔ אף שם מדיניות ⛔ לא נתפס ברגקס ⇒ הטענה על האידמפוטנטיות חלולה',
    ).toBeGreaterThanOrEqual(5);
    for (const name of created) {
      expect(BODY).toMatch(new RegExp(`drop policy if exists "${name}"`, 'i'));
    }
  });

  it('⛔ anon אינו מקבל דבר, ו-revoke בא לפני grant (RLS ⛔ אינה חוסמת TRUNCATE)', () => {
    expect(BODY.indexOf('revoke all on public.arcade_progress')).toBeGreaterThan(-1);
    expect(BODY.indexOf('revoke all on public.arcade_progress')).toBeLessThan(BODY.indexOf('grant select'));
    expect(BODY).not.toMatch(/grant[^;]*to[^;]*\banon\b/i);
  });

  it('⛔ arcade_runs אינה מקבלת update — קרב שנגמר נגמר', () => {
    expect(BODY).toMatch(/grant select, insert\s+on public\.arcade_runs/i);
    expect(BODY).not.toMatch(/grant[^;]*update[^;]*arcade_runs/i);
  });
});
