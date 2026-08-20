import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0017_arcade_run_id.sql` (F-092). כמו `arcadeDecoupling.test.ts`:
 * מוכיח מה הקובץ **אומר**, ⛔ לא שהוא הורץ (הרצה = פעולת רוי).
 * ההערות מולבנות לפני כל טענה — אילוץ שהוער החוצה אינו אילוץ.
 */
const SQL = readFileSync('supabase/migrations/0017_arcade_run_id.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0017 — אידמפוטנטיות של המיגרציה עצמה', () => {
  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('שתי העמודות נוספות עם if not exists — הרצה שנייה ⛔ אינה נופלת', () => {
    expect(BODY).toMatch(/add column if not exists\s+run_id\s+uuid/i);
    expect(BODY).toMatch(/add column if not exists\s+response_snapshot\s+jsonb/i);
  });

  it('האינדקס נוצר עם if not exists', () => {
    expect(BODY).toMatch(/create unique index if not exists\s+arcade_runs_run_id_key/i);
  });
});

describe('⛔ שני שידורים של אותו קרב הם שורה אחת', () => {
  it('האינדקס ייחודי ועל run_id', () => {
    expect(BODY).toMatch(/create unique index if not exists\s+arcade_runs_run_id_key\s+on\s+public\.arcade_runs\s*\(\s*run_id\s*\)/i);
  });

  it('⛔ חלקי, ⛔ ולא מלא — שורה היסטורית בלי מפתח ⛔ אינה מתנגשת בשנייה', () => {
    const index = BODY.slice(BODY.indexOf('create unique index'));
    expect(index).toMatch(/where\s+run_id\s+is\s+not\s+null/i);
  });

  it('⛔ העמודה null-אפשרית: not null היה מפיל את המיגרציה על שורות 0014 קיימות', () => {
    const addRunId = BODY.match(/add column if not exists\s+run_id\s+uuid[^;,\n]*/i)?.[0] ?? '';
    expect(addRunId).not.toMatch(/not null/i);
  });
});

describe('⛔ הבידוד של D-052 שרד את המיגרציה', () => {
  it.each(['word_progress', 'self_marked_known', 'current_level', 'senses', 'profiles'])(
    '⛔ %s אינו מופיע באף שורת SQL', (token) => {
      expect(BODY).not.toContain(token);
    },
  );

  it('⛔ אפס עמודת ניקוד (D-050)', () => {
    for (const banned of [/\bscore\b/i, /\bpoints\b/i, /\bcoins\b/i, /\bxp\b/i]) {
      expect(BODY).not.toMatch(banned);
    }
  });
});
