import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const withoutComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
const CODE = withoutComments(readFileSync('app/api/practice/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('POST /api/practice — D-033, ההגנה שמונעת נזק שקט', () => {
  it('⛔ אינו כותב אף אחד מארבעת שדות התזמון', () => {
    for (const field of ['next_review_at', 'easiness', 'interval_days', 'repetition']) {
      expect(CODE).not.toContain(field);
    }
  });

  it('⛔ אינו נוגע ברצף ההכרה — הרצף מקדם לייצור, ותרגול אינו מקדם', () => {
    expect(CODE).not.toContain('consecutive_correct_recognition');
  });

  it('⛔ לעולם אינו מוסיף שורה — תרגול הוא על מילה שכבר נכשלה', () => {
    expect(CODE).not.toMatch(/\.insert\(|\.upsert\(/);
    expect(CODE).toMatch(/\.update\(/);
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
