import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { withoutComments } from '@/lib/testSource';

const SRC = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
const CODE = withoutComments(SRC);

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

  it("קורא `arcade_progress` ובדיוק ארבע עמודות — ⛔ ולא `select('*')`", () => {
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

  it('T-217 — the read plan selects avatar_parts and the body carries `character` (D-152)', () => {
    expect(SRC).toMatch(/HOME_SELECT = 'arcade_level, wins, unlocked_items, avatar_parts'/);
    expect(SRC).toContain('character: characterFromParts(');
  });

  it('⛔ still read-only — no insert/update/upsert/delete', () => {
    expect(CODE).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });

  it('T-360 · חותמת ⓒ — קורא את הקרב האחרון, שורה אחת וארבע עמודות', () => {
    expect(SRC).toContain("from('arcade_runs')");
    expect(SRC).toMatch(/LAST_ROUND_SELECT = 'finished_at, words_seen, words_correct, enemy_defeated'/);
    expect(SRC).toMatch(/\.order\('finished_at', \{ ascending: false \}\)/);
    expect(SRC).toContain('.limit(1)');
  });

  it('T-360 — ⛔ `response_snapshot` ⛔ אינו נקרא: הוא גוף התשובה של הקרב ההוא', () => {
    expect(CODE).not.toContain('response_snapshot');
  });

  it('T-360 — הגוף נושא `lastRound`, והעיצוב שלו עובר דרך השכבה הטהורה', () => {
    expect(SRC).toContain('lastRound: lastRoundFromRow(');
    expect(SRC).toContain("from '@/lib/core/arenaLastRound'");
  });

  it('T-360 — ⛔ הקריאה השנייה ⛔ אינה מחלישה את סדר השומרים', () => {
    const session = SRC.indexOf('auth.getUser');
    const runs = SRC.indexOf("from('arcade_runs')");
    expect(session).toBeGreaterThan(-1);
    expect(session).toBeLessThan(runs);
  });
});
