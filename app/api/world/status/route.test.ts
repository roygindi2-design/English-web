import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * A source guard, same shape and same limits as app/api/study/queue/route.test.ts: the
 * vitest environment is node and there is no Supabase project here, so behaviour cannot be
 * reached. What it proves is the part that is otherwise believed rather than measured —
 * the guard order, the dedupe, and that the unlock is COMPUTED.
 */
const SRC = readFileSync('app/api/world/status/route.ts', 'utf8');
const CODE = withoutComments(SRC);

/**
 * ⚠️ **סטייה מוצהרת מנוסח התוכנית, ⛔ ולא ריכוך — ונמדדה.** התוכנית כתבה את שני
 * השערים המחודדים כלולאה **על שורות**: «כל שורה שסופרת חייבת לנקוב ב-`stories`».
 * הרצה טרייה מראה שהנוסח הזה ⛔ אינו ניתן לסיפוק: שרשרת PostgREST נשברת לשורה
 * לכל קריאה (`.from('stories')` · `.select(..., { count: 'exact' })` · `.eq('cefr_level')`),
 * ולכן שורת הספירה ⛔ לעולם אינה נושאת את שם הטבלה. הדרך היחידה «לעבור» כלשונו
 * היא הערת-זנב שמבריחה את המחרוזת — כלומר שער שאי אפשר להפיל.
 *
 * ⇒ אותה טענה בדיוק נמדדת **חזק יותר**: הטבלה של כל היקרות היא ה-`.from(...)` הקרוב
 * ביותר **לפניה** בשרשרת, ⇒ הספירה קשורה לטבלה שהיא סופרת ⛔ ולא לשם שהזדמן באותה שורה.
 */
const tableAt = (index: number): string => {
  const chain = [...CODE.slice(0, index).matchAll(/\.from\('([a-z_]+)'\)/g)].pop();
  return chain?.[1] ?? '';
};

describe('GET /api/world/status', () => {
  it('checks ENV, then the session, and only then queries — the C-0032 order', () => {
    const env = CODE.indexOf('readSupabaseEnv');
    const session = CODE.indexOf('auth.getUser');
    const query = CODE.indexOf(".from('");
    expect(env).toBeGreaterThan(-1);
    expect(session).toBeGreaterThan(env);
    expect(query).toBeGreaterThan(session);
  });

  it('computes `unlocked` from the counts and ⛔ never from a flag or an env var', () => {
    expect(CODE).toContain('isWorldUnlocked');
    expect(CODE).not.toMatch(/unlocked\s*[:=]\s*(true|false)/);
    expect(CODE).not.toContain('WORLD_UNLOCKED');
  });

  it('owns the two thresholds HERE, as policy, and ⛔ does not import them from /lib/core', () => {
    expect(CODE).toMatch(/MIN_FUNCTION_WORDS\s*=\s*100/);
    expect(CODE).toMatch(/MIN_ACTIVE_WORDS\s*=\s*12/);
    expect(CODE).not.toMatch(/import[^;]*MIN_(FUNCTION|ACTIVE)_WORDS/);
  });

  it('counts UNIQUE headwords — words is unique(headword,pos), so rows overstate the bank', () => {
    // ⚠️ Measured, ⛔ not assumed: `toContain('uniqueHeadwords')` alone is BLIND. Replacing
    // the call with `(bank.data ?? []).length` leaves the import untouched and the whole
    // file still "contains" the name, so that assertion stayed green through the mutation
    // (C-0120). The bank count has to be read off the CALL SITE.
    expect(CODE).toMatch(/functionWords:\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/\.eq\('lexical_class',\s*'function'\)/);
  });

  it('counts the learner side from is_active_this_week, scoped to the caller', () => {
    expect(CODE).toMatch(/\.eq\('is_active_this_week',\s*true\)/);
    expect(CODE).toMatch(/\.eq\('user_id',\s*user\.id\)/);
  });

  it('counts DISTINCT active headwords — a row count opens the gate early (F-040)', () => {
    // ⚠️ The unit on both sides of the predicate has to be the same one, and `word_progress`
    // is per-SENSE: a learner holding both senses of `can` has two rows and one headword.
    // `activeWords` used to be `active.count` off a `head: true` read, which is rows — and
    // the direction of that error is always inflation (count ≥ distinct), so the gate opened
    // BEFORE the learner knew MIN_ACTIVE_WORDS distinct words.
    //
    // ⚠️ Read off the CALL SITE, ⛔ not `toContain('uniqueHeadwords')` — F-039: the import
    // survives that mutation and a name-only assertion stays green through it.
    expect(CODE).toMatch(/activeWords:\s*uniqueHeadwords\(/);
    expect(CODE).toContain('words!inner(headword)');
  });

  it('⛔ never counts ROWS where rows are not the unit — the ban is scoped to the two headword reads', () => {
    // ⚠️ **חודד ⛔ ולא רוכך.** הטענה האמיתית של השער היא F-040: `words` ו-
    // `word_progress` נמדדות ב-**headwords**, ולכן ספירת שורות שם מנפחת ופותחת את
    // השער מוקדם. ‏`stories` היא `unique (cefr_level, title_en)` ⇒ שם **שורה = סיפור**,
    // וספירת שורות היא הספירה הנכונה. ⇒ כל שורה שסופרת חייבת לנקוב ב-`stories`.
    for (const hit of CODE.matchAll(/head:\s*true|count:\s*'exact'|\.count\b/g)) {
      expect(tableAt(hit.index), `row count outside stories: ${hit[0]}`).toBe('stories');
    }
    // ⛔ ולא שער חלול (F-088): הקובץ **אכן** סופר שורות במקום אחד, ⇒ ללולאה יש מה למדוד.
    expect(CODE.match(/count:\s*'exact'/g) ?? []).toHaveLength(1);
    // והכיוון החיובי, ⛔ כדי שהסריקה לא תהפוך לשער שאינו יכול ליפול (F-088):
    expect(CODE).toMatch(/functionWords:\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/activeWords:\s*uniqueHeadwords\(/);
  });

  it('bounds BOTH reads — an unbounded row read is the price of counting distinctly', () => {
    // Two `.limit(MAX_BANK_ROWS)`, one per read. ⚠️ Truncation here can only UNDERSTATE a
    // learner far above the threshold, ⛔ never open the gate early, so the direction is safe.
    expect(CODE.match(/\.limit\(MAX_BANK_ROWS\)/g) ?? []).toHaveLength(2);
  });

  it('shares one flattener with app/api/world/bank/route.ts and ⛔ does not re-declare it', () => {
    expect(CODE).toContain('flattenJoinedHeadwords');
    expect(CODE).not.toMatch(/function\s+flattenJoined/);
  });

  it('⛔ never reads senses.cefr_level (D-034) — and stories.cefr_level is a DIFFERENT column', () => {
    // ⚠️ **חודד ⛔ ולא רוכך.** `not.toContain('cefr_level')` חוסם **מחרוזת**, ⛔ ולא את
    // הפגם. ‏`0018_stories.sql` אומר זאת בהערת העמודה שלו עצמו: «⛔ זו ⛔ אינה
    // `senses.cefr_level` ו⛔ אינה `words.cefr_profile_band`». ⇒ כל שורה שנוקבת
    // בעמודה חייבת לנקוב גם ב-`stories`, וקריאה מ-`senses` אסורה מפורשות.
    expect(CODE).not.toContain("from('senses')");
    for (const hit of CODE.matchAll(/cefr_level/g)) {
      expect(tableAt(hit.index), `cefr_level outside stories: ${hit.index}`).toBe('stories');
    }
    expect(CODE.match(/cefr_level/g) ?? []).toHaveLength(1);
  });

  it('הספרייה נספרת ברמת הלומד ⛔ ולא גלובלית (T-137ⓒ · § 4.2יג)', () => {
    expect(CODE).toMatch(/\.from\('stories'\)/);
    expect(CODE).toMatch(/\.from\('profiles'\)/);
    expect(CODE).toMatch(/stories:/);
  });

  it('⛔ 3 אינו כתוב בקובץ — הסף הוא מכסת התוכן שכבר קיימת (סטייה 4)', () => {
    expect(CODE).toContain('STORIES_PER_LEVEL');
    expect(CODE).not.toMatch(/required\s*:\s*\d/);
  });

  it('⛔ קריאת הספרייה **רכה** — היא ⛔ אינה נועלת את לשונית «העולם»', () => {
    // ⚠️ נמדד ⛔ ולא שוער: `0018_stories.sql` טרם הורץ בייצור, ו-`<TabBar>` נועל את
    // הלשונית על **כל** תשובה שאינה ok:true (`docs/api-contract.md`). ⇒ קריאה שלישית
    // קשיחה הייתה נועלת את הלשונית לכל הלומדים עד שרוי ירוץ מיגרציה.
    // בדיוק שתי יציאות 503 בקובץ — הבנק והלומד — ⛔ ואין שלישית.
    expect(CODE.match(/return schemaAwareFailure\(/g) ?? []).toHaveLength(2);
    // ⚠️ **סטייה מוצהרת שנייה מאותו שורש.** התוכנית ביקשה את המחרוזת `stories: null`
    // בגוף התשובה — אבל הכישלון הרך ⛔ אינו יושב שם: הוא **טיפוס ההחזרה** של
    // `readStories` ושני ענפי הכישלון שלה. מחרוזת אפשר להשאיר בהערה; ⛔ שני
    // `return null` בפונקציה שטיפוסה `| null` ⛔ אי אפשר לזייף.
    expect(CODE).toMatch(/Promise<\{[^}]*\}\s*\|\s*null>/);
    expect(CODE.match(/^\s*return null;$/gm) ?? []).toHaveLength(2);
    expect(CODE).toMatch(/stories:\s*storiesStatus/);
  });

  it('⛔ הספרייה ⛔ אינה נוגעת בזירה (D-054 — 🔗 מצומדת לצד הלימודי)', () => {
    expect(CODE).not.toContain('arcade_collected_words');
  });

  it('answers a missing schema with 503 in Hebrew, ⛔ not 500 and ⛔ not an empty screen', () => {
    expect(CODE).toContain('42P01');
    expect(CODE).toContain('PGRST205');
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('⛔ never puts the database message in the response body', () => {
    for (const line of CODE.split('\n')) {
      if (line.includes('error.message')) {
        expect(line, `error.message escapes on: ${line.trim()}`).toContain('console.error');
      }
    }
  });

  it('is dynamic — a cached unlock state is a wrong unlock state', () => {
    expect(CODE).toMatch(/export const dynamic\s*=\s*'force-dynamic'/);
  });
});
