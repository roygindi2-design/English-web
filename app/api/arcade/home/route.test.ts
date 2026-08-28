import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');

describe('GET /api/arcade/home — `37 § 13.1`: קריאה, ⛔ ואפס כתיבה', () => {
  it('⛔ אין בקובץ ולו פעולת כתיבה אחת', () => {
    for (const write of ['.insert(', '.update(', '.upsert(', '.delete(', '.rpc(']) {
      expect(SRC).not.toContain(write);
    }
  });

  it('⛔ ⛔ אינו נוגע ב-`word_progress` ו⛔ אינו קורא `profiles` (D-052)', () => {
    expect(SRC).not.toContain('word_progress');
    expect(SRC).not.toContain('profiles');
  });

  it("קורא `arcade_progress` ובדיוק שלוש עמודות — ⛔ ולא `select('*')`", () => {
    expect(SRC).toContain('arcade_progress');
    expect(SRC).toContain('arcade_level, wins, unlocked_items');
    expect(SRC).not.toContain("select('*')");
  });

  it('סדר השומרים של C-0032: ENV ⇒ סשן ⇒ שאילתה', () => {
    const env = SRC.indexOf('readSupabaseEnv');
    const session = SRC.indexOf('auth.getUser');
    const query = SRC.indexOf("from('arcade_progress')");
    expect(env).toBeGreaterThan(-1);
    expect(env).toBeLessThan(session);
    expect(session).toBeLessThan(query);
  });

  it('שורה חסרה ⛔ אינה 503 — לומד חדש מקבל את ברירות המחדל של `0014_arcade.sql`', () => {
    expect(SRC).toContain('arcadeLevel: 1');
    expect(SRC).toContain('wins: 0');
  });

  it('⛔ הנתיב דינמי — אחרת Next היה משרת שורה של לומד אחר מהמטמון', () => {
    expect(SRC).toContain("export const dynamic = 'force-dynamic'");
  });
});
