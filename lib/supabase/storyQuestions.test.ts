import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANSWERS_PER_QUESTION } from '@/lib/core/storyQuestionGate';

/**
 * שומר על `0019_story_questions.sql` (T-188). כמו `lib/supabase/stories.test.ts`:
 * מוכיח מה הקובץ **אומר**, ⛔ לא שהוא הורץ. ההערות מולבנות לפני כל טענה — אילוץ
 * שהוער החוצה ⛔ אינו אילוץ (F-087 · F-088).
 */
const SQL = readFileSync('supabase/migrations/0019_story_questions.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0019 — אידמפוטנטיות של המיגרציה עצמה', () => {
  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('הטבלה נוצרת עם if not exists — הרצה שנייה ⛔ אינה נופלת', () => {
    expect(BODY).toMatch(/create table if not exists\s+public\.story_questions/i);
  });

  it('⛔ אף אילוץ ⛔ אינו מוצהר בתוך create table — הוא היה מדולג בהרצה שנייה (C-0032)', () => {
    const create = BODY.slice(BODY.indexOf('create table'), BODY.indexOf('do $$'));
    expect(create).not.toMatch(/\bcheck\s*\(/i);
  });

  it('שלושת האילוצים מוצהרים בשם בתוך do $$', () => {
    for (const name of [
      'story_questions_origin_check',
      'story_questions_answers_check',
      'story_questions_index_check',
    ]) {
      expect(BODY).toMatch(new RegExp(`conname = '${name}'`));
      expect(BODY).toMatch(new RegExp(`add constraint ${name}`, 'i'));
    }
  });
});

describe('⛔ מה שהסכמה ⛔ אינה מרשה', () => {
  it('origin נעול על generated בלבד, ו-not null (§ 7.6)', () => {
    expect(BODY).toMatch(/origin\s+text not null/i);
    const check = BODY.slice(BODY.indexOf('story_questions_origin_check'));
    expect(check).toMatch(/origin\s*=\s*'generated'/i);
    for (const banned of ['seed', 'ngsl', 'human']) expect(check).not.toContain(`'${banned}'`);
  });

  it('מספר התשובות נאכף מול ANSWERS_PER_QUESTION, ⛔ ולא «בערך שלוש»', () => {
    const check = BODY.slice(BODY.indexOf('story_questions_answers_check'));
    expect(check).toMatch(
      new RegExp(`array_length\\(answers_he, 1\\)\\s*=\\s*${ANSWERS_PER_QUESTION}`),
    );
  });

  it('correct_index חייב להצביע לתוך המערך — ⛔ אין נפילה שקטה ל-0', () => {
    const check = BODY.slice(BODY.indexOf('story_questions_index_check'));
    const head = check.slice(0, check.indexOf('end if'));
    expect(head).toMatch(/correct_index >= 0/i);
    expect(head).toMatch(/correct_index < array_length\(answers_he, 1\)/i);
  });

  it('⛔ הלקוח ⛔ אינו כותב: RLS דלוקה, מדיניות select אחת, ו-grant אחד', () => {
    expect(BODY).toMatch(/alter table public\.story_questions enable row level security/i);
    expect(BODY).toMatch(/for select to authenticated/i);
    expect(BODY).toMatch(/revoke all on public\.story_questions from authenticated, anon/i);
    expect(BODY).toMatch(/grant select on public\.story_questions to authenticated/i);
    expect(BODY).not.toMatch(/grant\s+(insert|update|delete)/i);
  });

  it('⛔ אפס ציון ו⛔ אפס מונה נכונות (36 § 7)', () => {
    const create = BODY.slice(BODY.indexOf('create table'), BODY.indexOf('do $$'));
    for (const banned of ['score', 'attempts', 'correct_attempts', 'answered_at']) {
      expect(create).not.toContain(banned);
    }
  });

  it('מחיקת סיפור מוחקת את שאלתו — ⛔ אין שאלה יתומה', () => {
    expect(BODY).toMatch(/references public\.stories \(id\) on delete cascade/i);
  });
});
