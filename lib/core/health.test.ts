import { describe, expect, it } from 'vitest';
import { buildHealthReport } from './health';

describe('buildHealthReport', () => {
  it('is ok when everything is configured and placeholders are blocked', () => {
    const r = buildHealthReport({
      hasSupabaseUrl: true,
      hasSupabaseAnonKey: true,
      allowPlaceholderContent: false,
      db: { status: 'ok' },
    });
    expect(r.ok).toBe(true);
  });

  it('fails when unverified placeholder content would be exposed', () => {
    const r = buildHealthReport({
      hasSupabaseUrl: true,
      hasSupabaseAnonKey: true,
      allowPlaceholderContent: true,
      db: { status: 'ok' },
    });
    expect(r.ok).toBe(false);
    expect(r.checks.find((c) => c.name === 'placeholder_content_blocked')?.ok).toBe(false);
  });

  it('fails when supabase config is missing', () => {
    const r = buildHealthReport({
      hasSupabaseUrl: false,
      hasSupabaseAnonKey: false,
      allowPlaceholderContent: false,
      db: null,
    });
    expect(r.ok).toBe(false);
  });
});

describe('buildHealthReport — בדיקת הדאטהבייס (T-053)', () => {
  const envOk = { hasSupabaseUrl: true, hasSupabaseAnonKey: true, allowPlaceholderContent: false };

  it('ok:true רק כששלוש בדיקות ה-ENV והדאטהבייס כולן עוברות', () => {
    const r = buildHealthReport({ ...envOk, db: { status: 'ok' } });
    expect(r.ok).toBe(true);
    expect(r.checks).toHaveLength(4);
    expect(r.checks.map((c) => c.name)).toContain('database_schema');
  });

  it('ENV תקין + מיגרציות לא הורצו = ok:false — זהו הכשל ש-T-053 קיימת בשבילו', () => {
    const r = buildHealthReport({ ...envOk, db: { status: 'schema_missing' } });
    expect(r.ok).toBe(false);
    const db = r.checks.find((c) => c.name === 'database_schema');
    expect(db?.ok).toBe(false);
    expect(db?.detail).toBe('word_progress missing — migrations not applied');
  });

  it('דאטהבייס לא מגיב אינו מתחזה לסכמה חסרה', () => {
    const r = buildHealthReport({ ...envOk, db: { status: 'unreachable' } });
    expect(r.checks.find((c) => c.name === 'database_schema')?.detail).toBe('database unreachable');
  });

  it('db:null נספר ככישלון ולא כהצלחה שקטה', () => {
    const r = buildHealthReport({ ...envOk, db: null });
    expect(r.ok).toBe(false);
    expect(r.checks.find((c) => c.name === 'database_schema')?.detail).toBe(
      'not probed — supabase env missing',
    );
  });

  it('אף detail אינו נושא טקסט שגיאה גולמי', () => {
    for (const status of ['ok', 'unreachable', 'schema_missing'] as const) {
      for (const c of buildHealthReport({ ...envOk, db: { status } }).checks) {
        expect(c.detail).not.toMatch(/PGRST|42P01|stack|at Object/i);
      }
    }
  });
});
