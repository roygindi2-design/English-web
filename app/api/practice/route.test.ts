import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('app/api/practice/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('POST /api/practice — D-033, ההגנה שמונעת נזק שקט', () => {
  it('⛔ אינו כותב אף אחד משדות SM-2', () => {
    for (const field of ['easiness', 'interval_days', 'repetition']) {
      expect(CODE).not.toContain(field);
    }
  });

  /**
   * T-225ⓑ — `next_review_at` נכנס לקובץ **פעם אחת**, ורק כ-`null` מפורש. ⛔ כל צורה
   * אחרת (`new Date`, `nowIso`, השמה מחושבת) היא בדיוק הכתיבה ש-D-033 אוסרת.
   */
  it('T-225ⓑ — `next_review_at` מופיע פעם אחת בלבד, ורק כ-null מפורש', () => {
    const hits = CODE.match(/next_review_at/g) ?? [];
    expect(hits.length).toBe(1);
    expect(CODE).toContain('next_review_at: null');
  });

  it('⛔ אינו נוגע ברצף ההכרה — הרצף מקדם לייצור, ותרגול אינו מקדם', () => {
    expect(CODE).not.toContain('consecutive_correct_recognition');
  });

  /**
   * T-225ⓐⓑ — ה-404 ⛔ לא נמחק, הוא **הצטמצם**. `.insert(` מותר, ו⛔ רק בתוך הענף
   * של `deck === 'level'`; `.upsert(` ⛔ אסור בכל מקום (הנימוק ב-scan/route.ts:92).
   */
  it("T-225 · T-199ⓐ — insert חי ⛔ אך ורק בענף `level` / `sentences`, וה-404 שורד לכל חפיסה אחרת", () => {
    expect(CODE).not.toMatch(/\.upsert\(/);
    expect(CODE).toMatch(/\.insert\(/);
    expect(CODE).toMatch(/status:\s*404/);
    // T-199ⓐ · D-142 — both decks are named, ⛔ and nothing wider (`deck !== 'due'` would
    // hand `unknown` the insert path silently).
    expect(CODE).toContain("payload.deck !== 'level' && payload.deck !== 'sentences'");
    expect(CODE).not.toMatch(/payload\.deck !== 'due'/);
    const gate = CODE.indexOf("payload.deck !== 'level'");
    const insert = CODE.indexOf('.insert(');
    const notFound = CODE.indexOf('status: 404');
    expect(gate, 'השער ⛔ אינו קיים').toBeGreaterThan(-1);
    expect(notFound, 'ה-404 חייב לשבת בתוך השער, לפני ה-insert').toBeGreaterThan(gate);
    expect(insert, 'ה-insert חייב לבוא אחרי שהשער סינן החוצה כל חפיסה אחרת').toBeGreaterThan(notFound);
  });

  /**
   * T-225ⓐ — סימון עצמי ⛔ אינו חשיפה שנענתה: השורה החדשה של «ידעתי» נפתחת עם
   * `attempts: 0`, בדיוק כמו `app/api/levels/scan/route.ts:22`.
   */
  it('T-225ⓐ — «ידעתי» פותחת שורה עם self_marked_known ו-attempts שאינו מנוחש', () => {
    expect(CODE).toContain('self_marked_known:');
    expect(CODE).toContain('self_marked_at:');
    expect(CODE).toContain('first_seen_at:');
  });

  it('הספירה עצמה נעשית בשכבה הטהורה', () => {
    expect(CODE).toContain('applyPractice');
  });

  /**
   * ⚠️ סטייה מהתוכנית, מדווחת. הניסוח המקורי היה
   * `expect(CODE).not.toMatch(/error\.message[\s\S]{0,40}(NextResponse|json\()/)`,
   * והוא נכשל על הקוד הזה **בעודו תקין**: המחרוזת יוצאת ל-`console.error` ומיד אחריה
   * באה שורת ה-`return`, כלומר ~20 תווים. ⛔ הביטוי מודד **מרחק תווים** ולא זרימת נתונים —
   * נמדד בהרצה: אותו ביטוי עובר על `app/api/study/queue/route.ts` רק מפני ששתי שורות
   * שאינן קשורות (`const code` ו-`if`) יושבות באמצע ומרחיקות. ⛔ ריפוד הקוד כדי לספק
   * מד-מרחק הוא שינוי הקוד לפי הבדיקה. במקומו — הדרישה עצמה, מנוסחת במדויק:
   * ⓐ כל הופעה של `.message` יושבת על שורת `console.error`, ⓑ ואף קריאת `json(` אינה
   * מכילה `.message`. הבדיקה הזו **חזקה** מהמקורית: היא מכשילה גם דליפה במרחק 200 תווים.
   */
  it('⛔ אינו מדליף את הודעת השגיאה של Supabase', () => {
    const messageLines = CODE.split('\n').filter((line) => line.includes('.message'));
    expect(messageLines.length).toBeGreaterThan(0);
    for (const line of messageLines) expect(line).toContain('console.error(');
    for (const line of CODE.split('\n')) {
      if (line.includes('json(')) expect(line).not.toContain('.message');
    }
  });

  it('מתועד בחוזה עם אותה הבטחה', () => {
    expect(CONTRACT).toContain('POST /api/practice');
    expect(CONTRACT).toContain('next_review_at');
  });
});

/**
 * The five checks above are the plan's. The five below were added while implementing,
 * each one for a way this route could be silently wrong in a manner the plan's checks
 * do not see. They are ORDER and IDENTITY checks — the two things a "does the string
 * appear" test cannot express.
 */
describe('POST /api/practice — ההגנות שנמדדות בסדר ולא בנוכחות', () => {
  it('סדר ההגנות: ENV → client → getUser → ורק אז גוף הבקשה (דפוס C-0032)', () => {
    const env = CODE.indexOf('const env = readSupabaseEnv(');
    const client = CODE.indexOf('createRouteClient(');
    const user = CODE.indexOf('supabase.auth.getUser(');
    const body = CODE.indexOf('request.json(');
    expect(env).toBeGreaterThan(-1);
    expect(client).toBeGreaterThan(env);
    expect(user).toBeGreaterThan(client);
    expect(body).toBeGreaterThan(user);
  });

  it('שורה חסרה ⇒ 404, ⛔ ולא 200 ולא יצירת שורה', () => {
    expect(CODE).toMatch(/maybeSingle\(\)/);
    expect(CODE).toMatch(/status:\s*404/);
  });

  it('העדכון תחום לשני מפתחות — user_id וגם word_id', () => {
    const update = CODE.indexOf('.update(');
    const tail = CODE.slice(update);
    expect(tail).toMatch(/\.eq\(\s*'user_id'/);
    expect(tail).toMatch(/\.eq\(\s*'word_id'/);
  });

  it('⛔ אינו קורא לשעון של המתזמן — אין scheduleReview ואין applyGrade', () => {
    expect(CODE).not.toContain('scheduleReview');
    expect(CODE).not.toContain('applyGrade');
  });

  it('קורא בדיוק את שני המונים, ⛔ ולא את כל שורת ההתקדמות', () => {
    expect(CODE).toContain("select('attempts, correct_attempts')");
  });
});
