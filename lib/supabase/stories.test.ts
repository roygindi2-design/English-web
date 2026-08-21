import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0018_stories.sql` (T-134ⓐ). כמו `arcadeRunId.test.ts`: מוכיח מה הקובץ
 * **אומר**, ⛔ לא שהוא הורץ (הרצה = פעולת רוי). ההערות מולבנות לפני כל טענה —
 * אילוץ שהוער החוצה אינו אילוץ (F-087 · F-088).
 */
const SQL = readFileSync('supabase/migrations/0018_stories.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0018 — אידמפוטנטיות של המיגרציה עצמה', () => {
  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('הטבלה נוצרת עם if not exists — הרצה שנייה ⛔ אינה נופלת', () => {
    expect(BODY).toMatch(/create table if not exists\s+public\.stories/i);
  });

  it('⛔ אף אילוץ ⛔ אינו מוצהר בתוך create table — הוא היה מדולג בהרצה שנייה (C-0032)', () => {
    const create = BODY.slice(BODY.indexOf('create table'), BODY.indexOf('do $$'));
    expect(create).not.toMatch(/\bcheck\s*\(/i);
  });

  it('שני האילוצים מוצהרים בשם בתוך do $$', () => {
    expect(BODY).toMatch(/conname = 'stories_level_check'/);
    expect(BODY).toMatch(/conname = 'stories_origin_check'/);
    expect(BODY).toMatch(/add constraint stories_level_check/i);
    expect(BODY).toMatch(/add constraint stories_origin_check/i);
  });
});

describe('§ 7.6 · R-021 — מה שהסכמה ⛔ אינה מרשה', () => {
  it('origin נעול על generated בלבד, ו-not null', () => {
    expect(BODY).toMatch(/origin\s+text not null/i);
    const check = BODY.slice(BODY.indexOf('stories_origin_check'));
    expect(check).toMatch(/origin\s*=\s*'generated'/i);
    for (const banned of ['seed', 'ngsl', 'human']) expect(check).not.toContain(`'${banned}'`);
  });

  it('⛔ C1 ו-C2 ⛔ אינם רמות חוקיות — R-021 מדד אפס מילים בשתיהן', () => {
    const check = BODY.slice(BODY.indexOf('stories_level_check'));
    const head = check.slice(0, check.indexOf('end if'));
    expect(head).toMatch(/'A1'/);
    expect(head).toMatch(/'B2'/);
    expect(head).not.toMatch(/'C1'/);
    expect(head).not.toMatch(/'C2'/);
  });
});

describe('RLS — קריאה לכל מחובר, ⛔ אפס כתיבה מהלקוח', () => {
  it('RLS מופעלת על טבלה חדשה', () => {
    expect(BODY).toMatch(/alter table public\.stories\s+enable row level security/i);
  });

  it('מדיניות SELECT אחת ויחידה', () => {
    const policies = [...BODY.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
    expect(policies).toEqual(['stories_select_all']);
  });

  it('⛔ אין ולו grant אחד של insert/update/delete על הטבלה', () => {
    const grants = [...BODY.matchAll(/^\s*grant\s+([^;]+);/gim)].map((m) => m[1]);
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) {
      expect(g).not.toMatch(/\binsert\b/i);
      expect(g).not.toMatch(/\bupdate\b/i);
      expect(g).not.toMatch(/\bdelete\b/i);
    }
  });

  it('revoke קודם ל-grant — default privileges של Supabase הם ALL', () => {
    expect(BODY.indexOf('revoke all')).toBeGreaterThan(-1);
    expect(BODY.indexOf('revoke all')).toBeLessThan(BODY.indexOf('grant select'));
  });
});

describe('⛔ הגבול של D-054 — הספרייה מצומדת לצד הלימודי, ⛔ ולא לזירה', () => {
  it.each(['arcade_collected_words', 'arcade_progress', 'arcade_runs'])(
    '⛔ %s אינו מופיע באף שורת SQL',
    (token) => {
      expect(BODY).not.toContain(token);
    },
  );

  it('⛔ אפס עמודת ניקוד (D-050)', () => {
    for (const banned of [/\bscore\b/i, /\bpoints\b/i, /\bcoins\b/i, /\bxp\b/i]) {
      expect(BODY).not.toMatch(banned);
    }
  });
});
