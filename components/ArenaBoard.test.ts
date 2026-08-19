import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ArenaBoard.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/**
 * התבנית של `ComposeDraft.test.ts:1-31`, ומאותה סיבה בדיוק: `toMatch(/<button[^>]*min-h-touch/)`
 * גולמי אדום על קוד נכון שמחלץ מחלקות ל-`const` (F-041), וירוק על קובץ שרק מזכיר את האסימון.
 */
const CLASS_CONSTS = Object.fromEntries(
  [...CODE.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*([\s\S]*?);\n/g)].map((m) => [
    m[1] ?? '',
    m[2] ?? '',
  ]),
);
function classesOf(tag: string): string {
  const attribute = tag.match(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/);
  if (attribute === null) return '';
  const literal = attribute[1] ?? '';
  const expression = attribute[2] ?? '';
  const referenced = [...expression.matchAll(/[A-Z][A-Z0-9_]*/g)]
    .map((m) => CLASS_CONSTS[m[0]] ?? '')
    .join(' ');
  return `${literal} ${expression} ${referenced}`;
}

describe('<ArenaBoard>', () => {
  it('הוא רכיב לקוח', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
  });

  it('⛔ אפס שעון — סריקת המקור של מדד ⓔ (§ 4.2י · D-045 · R-020)', () => {
    for (const banned of [
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\brequestAnimationFrame\b/,
      /\bdeadline\b/i,
      /\bcountdown\b/i,
      /\bDate\.now\b/,
    ]) {
      expect(CODE, `${banned} אסור: סיבוב ⛔ אינו נגמר בזמן`).not.toMatch(banned);
    }
  });

  it('⛔ אפס ניקוד ואפס נגיעה במנוע החזרות (D-050 · D-044)', () => {
    // ⚠️ גבול מזהה ⛔ ולא `toContain` — הלקח של C-0182.
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i, /\bleaderboard\b/i]) {
      expect(CODE, `${banned} אסור — D-050`).not.toMatch(banned);
    }
    for (const banned of [/word_progress/, /easiness/, /repetition/, /self_marked_known/]) {
      expect(CODE, `${banned} אסור — D-044`).not.toMatch(banned);
    }
    for (const word of ['ניקוד', 'מטבע', 'לוח תוצאות']) {
      expect(CODE, `«${word}» אסורה — D-050`).not.toContain(word);
    }
  });

  it('החוקים מיובאים מהשכבה הטהורה ⛔ ואינם משוכפלים כאן', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/arcadeBattle'/);
    expect(CODE).toMatch(/chooseOption\(/);
    // רכיב שמוריד חיים בעצמו הוא עותק שני של החוק:
    expect(CODE).not.toMatch(/enemyHp\s*[-+]|enemyHp\s*=\s*[^=]/);
  });

  it('ארבע האפשרויות מפוזרות שתיים ושתיים ⛔ ולא ברשימה (§ 4.2י)', () => {
    const list = CODE.match(/<ul[^>]*data-arena-options[\s\S]*?>/);
    expect(list, 'המכולה חייבת לשאת data-arena-options').not.toBeNull();
    const classes = classesOf(list?.[0] ?? '');
    expect(classes, 'רשת 2×2').toMatch(/grid-cols-2/);
    expect(classes, '⛔ לא עמודה אחת').not.toMatch(/flex-col/);
  });

  it('כל אפשרות היא יעד מגע של 44px', () => {
    const option = CODE.match(/<button[^>]*data-arena-option[\s\S]*?>/);
    expect(option).not.toBeNull();
    expect(classesOf(option?.[0] ?? '')).toMatch(/min-h-touch/);
  });

  it('פעולת הסגירה מעוגנת למעלה, נושאת שם עברי, ומובילה ל-`/cards`', () => {
    expect(CODE).toMatch(/<CloseIcon\s*\/>/);
    expect(CODE).toMatch(/href="\/cards"/);
    expect(CODE).toContain('סגור');
    const close = CODE.match(/<Link[^>]*data-arena-close[\s\S]*?>/);
    expect(close).not.toBeNull();
    expect(classesOf(close?.[0] ?? '')).toMatch(/min-h-touch/);
    expect(classesOf(close?.[0] ?? '')).toMatch(/min-w-touch/);
  });

  it('⛔ אין סרגל תחתון ראשי במסך זרימה (D-028)', () => {
    expect(CODE).not.toMatch(/TabBar/);
  });

  it('⛔ אפס מרכוז אנכי ואפס h-screen (חוקה § 4 · F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/justify-center/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
  });

  it('⛔ אפס hex גולמי — הכל דרך אסימונים (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('המילה האנגלית עוברת דרך `EnWord` ⛔ ולא כטקסט חשוף (חוקה § 2)', () => {
    expect(CODE).toMatch(/<EnWord[^>]*>\{[^}]*headword[^}]*\}/);
  });

  it('מד חיי היריב נושא תווית עברית ⛔ ואינו צבע בלבד (חוקה § 1)', () => {
    expect(CODE).toContain('חיי היריב');
    expect(CODE).toMatch(/aria-label=/);
    expect(CODE, '⛔ לא גרף — § 4.2י שאלה 5').not.toMatch(/<canvas|recharts|chart/i);
  });

  it('מדבר עם שתי נקודות הקצה של הזירה ⛔ ובלבד', () => {
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/arcade\/round'\)/);
    expect(CODE).toMatch(/apiPost<[^>]*>\('\/api\/arcade\/result'/);
    expect(CODE, '⛔ רכיב ממשק אינו ניגש לדאטהבייס').not.toMatch(/supabase|\.from\(/);
  });

  it('שולח את חיי היריב מהקבוע ⛔ ולא כמספר בקוד', () => {
    expect(CODE).toMatch(/enemyHp:\s*ARCADE_ENEMY_HP/);
  });

  it('שש התשובות של החוזה מטופלות, ⛔ ולא ארבע', () => {
    for (const code of ['session_expired', 'schema_missing', 'level_too_small']) {
      expect(CODE, `${code} חייב מסך משלו`).toContain(code);
    }
    expect(CODE, 'רמה ריקה ⇒ הפניה לבחירת רמה').toMatch(/level === null|level: null/);
  });

  it('כשל שליחה ⛔ אינו זורק את התוצאה — היא נשמרת ונשלחת שוב', () => {
    expect(CODE).toMatch(/ApiUnreachableError|catch/);
    expect(CODE).toContain('pendingResult');
    expect(CODE).toMatch(/addEventListener\('online'/);
  });

  it('נוסח הכשל מיובא ⛔ ואינו נוסח שישי לאותו אירוע (T-056)', () => {
    expect(CODE).toMatch(/FAILURE_HE/);
    expect(CODE).toMatch(/RETRY_HE/);
  });

  it('⛔ אין שבח ואין נזיפה — משוב כשירות, ⛔ לא שיפוט (R-016 · § 4.2י שאלה 3)', () => {
    for (const word of ['כל הכבוד', 'נהדר', 'מצוין', 'טעית', 'נכשלת', 'הפסדת']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('הפיקסטורה מקבלת סיבוב ו⛔ אינה פונה לרשת', () => {
    expect(CODE).toMatch(/initialRound/);
    expect(CODE).toMatch(/if \(initialRound !== undefined\) return;/);
  });
});
