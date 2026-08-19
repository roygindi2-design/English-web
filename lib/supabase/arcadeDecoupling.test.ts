import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר על `0015_arcade_decoupling.sql` (T-107 · D-052 · D-053).
 * כמו `arcade.test.ts`: מוכיח מה הקובץ **אומר**, ⛔ לא שהוא הורץ (הרצה = פעולת רוי).
 * ההערות מולבנות לפני כל טענה — אילוץ שהוער החוצה אינו אילוץ.
 */
const SQL = readFileSync('supabase/migrations/0015_arcade_decoupling.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0015 — אידמפוטנטיות וטרנזקציה', () => {
  it('הטבלה נוצרת עם if not exists', () => {
    expect(BODY).toMatch(/create table if not exists public\.arcade_collected_words/i);
  });

  it('רצה בטרנזקציה אחת', () => {
    expect(BODY).toMatch(/^\s*begin;/im);
    expect(BODY).toMatch(/commit;\s*$/im);
  });

  it('כל אילוץ מוצהר בנפרד ובשם בתוך do $$ — ⛔ לא בתוך create table (לקח C-0032)', () => {
    const createBlocks = BODY.match(/create table if not exists[\s\S]*?\n\);/gi) ?? [];
    expect(createBlocks).toHaveLength(1);
    expect(createBlocks[0]).not.toMatch(/\bcheck\s*\(/i);
    for (const name of ['arcade_collected_missed_check', 'arcade_collected_correct_check']) {
      expect(BODY).toMatch(new RegExp(`conname\\s*=\\s*'${name}'`, 'i'));
      expect(BODY).toMatch(new RegExp(`add constraint ${name}`, 'i'));
    }
  });
});

describe('⛔ מילה שנאספה פעמיים היא שורה אחת ומונה 2', () => {
  it('מפתח ראשוני מורכב על (user_id, word_id)', () => {
    expect(BODY).toMatch(/primary key\s*\(\s*user_id\s*,\s*word_id\s*\)/i);
  });

  it('שני המונים קיימים, שניהם not null default 0', () => {
    expect(BODY).toMatch(/times_missed\s+int\s+not null\s+default\s+0/i);
    expect(BODY).toMatch(/times_correct\s+int\s+not null\s+default\s+0/i);
  });

  it('דגל ההסתרה קיים וברירת המחדל שלו false — ⛔ מילה שנאספה מוצגת', () => {
    expect(BODY).toMatch(/hidden_by_learner\s+boolean\s+not null\s+default\s+false/i);
  });
});

describe('⛔ הבידוד הדו-כיווני של D-052 נאכף בסכמה, ⛔ לא בהערה', () => {
  it.each(['word_progress', 'self_marked_known', 'current_level', 'senses'])(
    '⛔ %s אינו מופיע באף שורת SQL', (token) => {
      expect(BODY).not.toMatch(new RegExp(`\\b${token}\\b`, 'i'));
    });

  it('⛔ אפס טריגר ואפס פונקציית טריגר', () => {
    expect(BODY).not.toMatch(/create\s+(or replace\s+)?(trigger|function)/i);
  });

  it('המפתחות הזרים היחידים הם auth.users ו-words', () => {
    const refs = [...BODY.matchAll(/references\s+([a-z_.]+)\s*\(/gi)].map((m) => m[1]?.toLowerCase());
    expect([...new Set(refs)].sort()).toEqual(['auth.users', 'public.words']);
  });
});

describe('RLS — בעלות עצמית על טבלה חדשה', () => {
  it('RLS מופעלת', () => {
    expect(BODY).toMatch(/alter table public\.arcade_collected_words enable row level security/i);
  });

  it.each(['select', 'insert', 'update'])('יש מדיניות %s עצמית', (verb) => {
    expect(BODY).toMatch(new RegExp(`for ${verb} to authenticated`, 'i'));
  });

  it('revoke לפני grant — grant לבדו הוא no-op מול default privileges', () => {
    expect(BODY.indexOf('revoke all')).toBeLessThan(BODY.indexOf('grant select'));
  });

  it('⛔ anon אינו מקבל דבר', () => {
    expect(BODY).not.toMatch(/grant[^;]*to[^;]*\banon\b/i);
  });
});
