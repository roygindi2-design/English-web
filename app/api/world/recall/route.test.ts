import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('app/api/world/recall/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('⛔ הנתיב אינו כותב דבר — המדד המרכזי של T-104 (D-051)', () => {
  it.each(['.insert(', '.update(', '.upsert(', '.delete('])('⛔ %s אינו מופיע בקובץ', (verb) => {
    expect(CODE).not.toContain(verb);
  });

  it('⛔ אף פועל כתיבה, גם לא בצורה אחרת', () => {
    expect(CODE).not.toMatch(/\.(insert|update|upsert|delete)\(/);
  });
});

describe('⛔ מנוע החזרות אינו נוגע — לא בכתיבה ולא בקריאה (D-051 · פריט 31)', () => {
  it('⛔ אף עמודה של SM-2 אינה מופיעה', () => {
    expect(CODE).not.toMatch(/easiness|interval_days|repetition|next_review_at|self_marked_known/);
  });

  it('⛔ `current_level` אינו נקרא — הכרטיס אינו יודע על רמה', () => {
    expect(CODE).not.toContain('current_level');
  });

  it('מ-`word_progress` נקראות מילים בלבד, דרך `words!inner`', () => {
    expect(CODE).toContain('words!inner(');
    expect(CODE).toContain("from('word_progress')");
  });
});

describe('⛔ אין ניקוד ואין שעון (D-050 · D-049 · E4)', () => {
  // ⚠️ גבול-מילה ⛔ ולא `toContain`: `export` מכיל «xp», ובדיקה שנופלת על `export`
  // אינה מודדת ניקוד — היא מודדת את עצמה.
  it.each(['xp', 'score', 'points', 'coin', 'streak', 'leaderboard'])(
    '⛔ %s אינו מופיע כמזהה', (token) => {
      expect(CODE).not.toMatch(new RegExp(`\\b${token}\\b`, 'i'));
    });

  it.each(['setTimeout', 'setInterval', 'deadline', 'countdown'])('⛔ %s אינו מופיע', (token) => {
    expect(CODE).not.toContain(token);
  });
});

describe('שתי הקריאות, ⛔ ואין שלישית', () => {
  it('הטבלאות שנקראות הן בדיוק world_posts ו-word_progress', () => {
    const read = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(read)].sort()).toEqual(['word_progress', 'world_posts']);
  });

  it('פוסט מיוצר ⛔ אינו מוצג ללומד כמשפט שהוא כתב (הלקח של C-0123)', () => {
    expect(CODE).toContain("eq('author_kind', 'learner')");
  });

  it('שתי הקריאות מסוננות ל-`user.id` — ⛔ פיד של אחר אינו נקרא', () => {
    expect([...CODE.matchAll(/\.eq\('user_id', user\.id\)/g)]).toHaveLength(2);
  });

  it('order בא לפני limit — תקרה על סדר לא מוגדר חותכת אוכלוסייה אקראית (לקח F-034)', () => {
    expect(CODE.indexOf(".order('created_at'")).toBeLessThan(CODE.indexOf('.limit(MAX_RECALL_POSTS)'));
  });
});

describe('הנתיב אינו מחליט — ההחלטה בשכבה הטהורה', () => {
  it('קורא ל-buildRecallCard ⛔ ואינו מסנן, מדרג או מגריל בעצמו', () => {
    expect(CODE).toContain('buildRecallCard(');
    expect(CODE).not.toContain('Math.random');
    expect(CODE).not.toMatch(/\.sort\(/);
  });

  it('ה-seed נגזר בנתיב ⛔ ולא בשכבה הטהורה, בדיוק כמו arcade/round', () => {
    expect(CODE).toMatch(/const seed = Date\.now\(\) >>> 0/);
  });

  it('⛔ `card: null` ⛔ ואינו 404 (§ 4.2יב)', () => {
    expect(CODE).not.toContain('404');
    expect(CODE).toMatch(/ok:\s*true,\s*card/);
  });

  it('מוסר `counts` מהשכבה הטהורה ⛔ ואינו סופר בעצמו (D-075ⓐ)', () => {
    expect(CODE).toMatch(/recallCounts\(/);
    expect(CODE).toMatch(/counts/);
  });

  it('⛔ אפס קריאה שלישית — המונים נגזרים מאותן שתי קריאות (תבנית D-043)', () => {
    // ⚠️ נמדד באתר הקריאה ⛔ ולא בשם: `.from('` הוא כל שאילתה בקובץ. שלוש ⇒ עמודה
    // או טבלה חדשה נכנסו מהדלת האחורית, וזה בדיוק מה ש-D-075 אוסר.
    expect(CODE.match(/\.from\('/g) ?? []).toHaveLength(2);
  });

  it('⛔ `required` אינו כתוב בקוד הנתיב — הוא מגיע מהשכבה הטהורה (D-046)', () => {
    expect(CODE).not.toMatch(/required\s*:\s*\d/);
  });
});

describe('דפוס הכשל — סדר C-0032 ושתי המשפחות', () => {
  it('אין סשן ⇒ 401', () => {
    expect(CODE).toMatch(/status:\s*401/);
    expect(CODE).toContain('session_expired');
  });

  it('כשל דאטהבייס ⇒ 503, בשתי המשפחות', () => {
    expect(CODE).toMatch(/status:\s*503/);
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('unavailable');
  });

  it('הסכמה החסרה מזוהה בארבעת הקודים', () => {
    for (const code of ['42P01', 'PGRST205', '42703', 'PGRST204']) {
      expect(CODE).toContain(code);
    }
  });

  it('⛔ מחרוזת PostgREST לעולם אינה נכנסת לגוף התשובה', () => {
    expect(CODE).not.toMatch(/message:\s*`?\$\{/);
    expect(CODE).toContain('console.error');
  });

  it('הסדר קבוע: readSupabaseEnv → getUser → קריאה', () => {
    expect(CODE.indexOf('readSupabaseEnv()')).toBeLessThan(CODE.indexOf('auth.getUser()'));
    expect(CODE.indexOf('auth.getUser()')).toBeLessThan(CODE.indexOf(".from('world_posts')"));
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('GET /api/world/recall');
  });

  it('החוזה אומר במפורש שהנתיב אינו כותב, ושאין כרטיס אינו 404', () => {
    const section = CONTRACT.slice(CONTRACT.indexOf('## GET /api/world/recall'));
    const block = section.slice(0, section.indexOf('\n## ', 1));
    expect(block).toContain('הנתיב אינו כותב דבר');
    expect(block).toContain('"card": null');
    expect(block).toContain('ואינו 404');
  });
});
