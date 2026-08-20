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

  it('⛔ אינו שולח סף כלל — הסף חי בשרת (D-067ⓑ)', () => {
    // D-067ⓑ — הסף חי בשרת. ⛔ שדה סף בגוף הבקשה הוא הזמנה לזייף ניצחון.
    expect(CODE).not.toMatch(/enemyHp\s*:/);
    // ⚠️ F-092 עדכן את הגוף: `runId` **וגם** `answers`. הטענה ⛔ לא נמחקה — היא הורחבה,
    // וההנחה שהיא נועדה לשמור עליה (⛔ אפס שדה סף) נאכפת בשורה שמעליה ובטענה שמתחת.
    expect(CODE).toMatch(/send\(\s*\{\s*runId:\s*crypto\.randomUUID\(\),\s*answers:\s*battle\.answers\s*\}\s*\)/);
    expect(CODE).not.toMatch(/send\(\s*\{[^}]*(?:threshold|required|hp)\s*:/i);
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

/** גוף `statusHe` — הנוסח היחיד של שורת המצב (D-070). */
const AMMO_WORDING = CODE.slice(CODE.indexOf('const statusHe'), CODE.indexOf('const MISSING_NUMBER_HE'));

describe('D-070 · T-130 — שורת המצב נושאת את שני המספרים', () => {
  it('הנוסח הוא של D-070, מילה במילה', () => {
    expect(CODE).toContain('קליעים');
    expect(CODE).toContain('ליריב');
    expect(CODE).toMatch(/נשארו לך \$\{ammo\} קליעים · ליריב \$\{hp\} חיים/);
  });

  it('היחיד ⛔ אינו «1 קליעים»', () => {
    expect(CODE).toContain('קליע אחד');
  });

  it('שני המספרים באים מהחוק ⛔ ולא מחישוב מקומי', () => {
    expect(CODE).toMatch(/ammoLeft\(battle\)/);
    expect(CODE).not.toMatch(/questions\.length\s*-\s*battle\.index/);
  });

  it('⛔ אין ספירה לאחור, שעון, מכפיל וניקוד (D-050 · D-070)', () => {
    for (const banned of [/countdown/i, /\bscore\b/i, /multiplier/i, /ניקוד/, /שניות/]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  /**
   * ⚠️ **נוסח התוכנית לאסרציה הזאת ⛔ אינו יכול לעבור, והמדידה הראתה זאת:** הוא דרש
   * את המחרוזת «קליעים» **בתוך** תבנית ה-`aria-label`, בעוד המימוש שהתוכנית עצמה
   * כותבת מרכיב את הנוסח ב-`statusHe(...)` ⇒ המילה ⛔ אינה שם. אסרציה שמכריחה
   * לשכפל את הנוסח בשני מקומות סותרת את הסיבה שבגללה `statusHe` קיימת.
   * הנמדד כאן הוא הדבר עצמו: **מד הצבע נושא את אותו נוסח עברי** ⛔ ולא צבע בלבד.
   */
  it('חוקה § 1 — המספרים נגישים גם בלי צבע', () => {
    const label = CODE.match(/aria-label=\{`[^`]*`\}/);
    expect(label, 'מד ה-pips חייב aria-label').not.toBeNull();
    expect(label?.[0], 'התווית נבנית מאותו נוסח ⛔ ולא משוכפלת').toContain('statusHe(');
    expect(AMMO_WORDING, '⛔ והנוסח עצמו נושא את המילה').toContain('קליעים');
  });
});

describe('T-117 · T-041 — התנועה נכלאת בבמה', () => {
  it('הבמה מצוירת, והתנוחה מגיעה מהחוק', () => {
    expect(CODE).toMatch(/<ArenaStage\b/);
    expect(CODE).toMatch(/phase=\{stagePhase\(battle\)\}/);
  });

  /**
   * ⚠️ **נוסח התוכנית לאסרציה הזאת היה קישוט, והמדידה הראתה זאת:** הוא חתך את המקור
   * מ-`data-arena-options` והלאה — ושם יושב **רק שם המחלקה** `OPTION_CLASS`, בעוד
   * הגדרתה יושבת **למעלה**. כלומר `transition-opacity duration-200` שכבר קיים בה
   * ⛔ לא היה נמדד, ומוטציה שמוסיפה תנועה להגדרה **שורדת**.
   * ⛔ הנמדד כאן הוא **המחלקות בפועל**, דרך `classesOf` שכבר פורש קבועים (F-041).
   */
  it('⛔ אפס תנועה של **תזוזה** על אזור השאלה', () => {
    const list = CODE.match(/<ul[^>]*data-arena-options[\s\S]*?>/);
    const option = CODE.match(/<button[^>]*data-arena-option[\s\S]*?>/);
    expect(list, 'המכולה חייבת לשאת data-arena-options').not.toBeNull();
    expect(option, 'האפשרות חייבת לשאת data-arena-option').not.toBeNull();
    for (const tag of [list?.[0] ?? '', option?.[0] ?? '']) {
      const classes = classesOf(tag);
      for (const banned of [/\banimate-/, /transition-transform\b/, /\btranslate-/, /\bscale-/]) {
        expect(classes, `${banned} אסור על אזור השאלה — T-041`).not.toMatch(banned);
      }
    }
  });

  it('⛔ הרכיב ⛔ אינו מחשב תנוחה בעצמו', () => {
    expect(CODE).not.toMatch(/answers\[[^\]]*\]\.correct/);
  });
});

describe('F-092 — מפתח הקרב נוצר פעם אחת ונישא בשידור החוזר', () => {
  it('המפתח נוצר ב-`crypto.randomUUID`', () => {
    expect(CODE).toMatch(/crypto\.randomUUID\(\)/);
  });

  it('הוא נשלח בגוף, לצד `answers`', () => {
    expect(CODE).toMatch(/send\(\s*\{[^}]*runId[^}]*answers:\s*battle\.answers[^}]*\}\s*\)/s);
  });

  it('⛔ המפתח ⛔ אינו נוצר בתוך `send` — שידור חוזר היה מקבל מפתח חדש', () => {
    const send = CODE.slice(CODE.indexOf('const send = useCallback'), CODE.indexOf('useEffect(() => {\n    if (battle === null)'));
    expect(send).not.toContain('randomUUID');
  });

  it('השידור החוזר משדר את `pendingResult` כמות שהוא', () => {
    expect(CODE).toMatch(/send\(pendingResult\)/);
  });
});
