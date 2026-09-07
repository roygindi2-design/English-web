import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `<LevelMapScreen>` — לשונית «כרטיסיות», **מסך הבית של `36 § 5`** (T-210 · D-123).
 *
 * שומר מקור, כמו `DeckSelector.test.ts` ו-`StudyDeckScreen.test.ts`: סביבת vitest היא
 * `node` ו-jsdom נעדר בכוונה, ולכן בדיקת רינדור אינה שייכת לכאן. גיאומטריה — 44px, אפס
 * גלילה אופקית, והפס והמונים בתוך הצפייה הראשונה ב-375 — היא עבודתו של `check:mobile`
 * דרך הפיקסטורה `/dev/tabs/cards`, שמאז C-0318 מוזנת בסיכום לא-ריק.
 */
const SRC = readFileSync('components/LevelMapScreen.tsx', 'utf8');

/**
 * ⚠️ **סדר הפעולות שונה C-0318, ו⛔ זו ⛔ אינה קוסמטיקה — ראה F-141.** הניסוח הקודם התחיל
 * בתבנית «סוגר מסולסל, הערת-בלוק, סוגר מסולסל» כדי להסיר הערת-JSX; הכמת עצל, אך הוא **מתארך אחורה** עד
 * שהתבנית **כולה** מתאימה, ולכן `{` אחד יכול להזדווג עם סוגר-הערה **הרבה אחריו** ולבלוע את
 * הקוד שביניהם. נמדד בטיק הזה על הקובץ הזה: **11,032 בתים ⇒ 4,397**, ו-`/api/levels/current`
 * נעלם מ-`CODE`. ⇒ כל `not.toContain` בקובץ הזה היה נעשה **ריק** בשקט.
 * ⇒ מסירים הערות-בלוק **תחילה**, ורק אז את הסוגריים המסולסלים הריקים שנשארו.
 */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '')
    .replace(/\{\s*\}/g, '');
}

const CODE = withoutComments(SRC);

describe('חמש השורות של 36 § 5, בסדרן (T-210 · D-123)', () => {
  it('שורה 1 — כרטיס רמה קריאה-בלבד, ⛔ ולא בורר', () => {
    expect(CODE).toContain('<LevelCard');
    expect(CODE).toContain("summary.level");
  });

  it('שורות 2–3 — הפס ושלושת המונים מגיעים מ-<FilterBar>, ⛔ ולא מחישוב מקומי', () => {
    expect(CODE).toContain('<FilterBar');
    // ⛔ אפס אריתמטיקה כאן: ההגדרה חיה ב-`lib/core/filterProgress.ts` (§ 4.2ז).
    expect(CODE).not.toContain('filterProgress(');
    expect(CODE).not.toContain('counterCells(');
  });

  it('שורה 4 — החפיסות, אחרי הפס', () => {
    expect(CODE).toContain('<DeckSelector');
    expect(CODE).toContain('דרכים לתרגל');
    expect(CODE.indexOf('<FilterBar')).toBeLessThan(CODE.indexOf('<DeckSelector'));
  });

  it('שורה 4 — `unseen` נמסר לחפיסות מהסיכום, ⛔ ולא נקרא שנית', () => {
    expect(CODE).toMatch(/<DeckSelector unseen=\{summary\?\.unseen \?\? null\}/);
  });

  it('שורה 5 — ההערה הקבועה חייבת להימצא בקובץ, היא נושאת את האינווריאנט', () => {
    expect(CODE).toContain('הסימון של מילים מתבצע בכרטיסיות בלבד');
  });

  it('רשימת «לא ידעתי» נשארה, אחרי בלוק החפיסות (§ 4.2ז · T-083)', () => {
    expect(CODE).toContain('UnknownList');
    expect(CODE.indexOf('דרכים לתרגל')).toBeLessThan(CODE.indexOf('<UnknownList'));
  });

  it('ענף `choose` נשאר — לומד בלי רמה חייב פעולה אחת (D-123ג׳ⓒ)', () => {
    expect(CODE).toContain("kind: 'choose'");
    expect(CODE).toContain('בחר רמה');
  });

  /**
   * ⛔ שלוש מוטציות. כל אחת נופלת **בשם**, ⛔ ולא בטענה כללית.
   */
  it('מוטציה: בורר הרמות ⛔ לא יחזור למסך הכרטיסיות (D-123 · 36 § 5)', () => {
    expect(CODE).not.toContain('<LevelPath');
  });

  it('מוטציה: הכניסה לזירה ⛔ לא תחזור למסך הכרטיסיות (T-156 · D-052 · D-090ⓐ)', () => {
    expect(CODE).not.toContain('<ArcadeEntry');
    expect(CODE).not.toContain('/arcade');
  });

  it('מוטציה: המסך ⛔ אינו מציג עוד את התוויות שהוחלפו ב-36 § 5', () => {
    for (const old of ['נשארו לך', 'סימנת שידעת', 'ברשימת החזרה']) {
      expect(CODE, `«${old}» הוחלפה בתוויות של 36 § 5`).not.toContain(old);
    }
  });
});

describe('⛔ מה שאסור להופיע במסך הזה', () => {
  it('⛔ אין מרכוז אנכי על מכולת העמוד (F-011 · F-016 · חוקה § 4)', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it.each(['שולט', 'מוכן', 'נעול', 'כל הכבוד', 'ניקוד', 'רצף'])(
    '⛔ המילה «%s» אינה מופיעה (R-017 · D-037)',
    (word) => {
      expect(CODE).not.toContain(word);
    },
  );

  it('⛔ אין גישה ישירה לדאטהבייס — הכל דרך lib/api/client.ts', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });

  it('⛔ אין hex גולמי (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אין אמוג\'י (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});

describe('מצבי הקצה שהמפרט נוקב בהם', () => {
  it('level:null ⇒ מצב בחירה, ⛔ ולא ברירת מחדל שקטה ל-A1', () => {
    expect(CODE).toContain('בחר רמה');
    expect(CODE).not.toMatch(/level\s*[?:]{1,2}\s*['"]A1['"]/);
    expect(CODE).not.toMatch(/\?\?\s*['"]A1['"]/);
  });

  it('הבחירה כותבת דרך POST /api/levels/current, ⛔ לא דרך /api/review', () => {
    expect(CODE).toContain("'/api/levels/current'");
    expect(CODE).not.toContain('/api/review');
  });

  it('כשל סכמה ⇒ משפט עברי, ⛔ ולא «0 מילים»', () => {
    expect(CODE).toContain('schema_missing');
    // T-273: המשפט עצמו ⛔ כבר אינו מחרוזת כאן — הוא מיובא מהמקום היחיד שבו הוא חי
    // (`lib/core/failure.ts`) ומודפס כקבוע.
    expect(CODE).toContain('SCHEMA_MISSING_HE');
    expect(CODE).not.toContain('המאגר עדיין לא הוקם');
  });

  it('טעינה ⇒ aria-busy עם השורות כבר במקום, ⛔ לא ספינר (חוקה § 5)', () => {
    expect(CODE).toContain('aria-busy');
    expect(CODE).not.toMatch(/animate-spin|spinner/i);
  });

  it('כל יעד מגע נושא min-h-touch (44px)', () => {
    // ⚠️ **סטייה מנוסח התוכנית, והיא תיקון של אסרציה עיוורת** (מחלקת F-039). התוכנית
    // נוקבת ב-`/<button[\s\S]{0,400}?>/g`, והכמת העצל עוצר ב-`>` הראשון — שהוא ה-`>`
    // של `onClick={() => …}` ⛔ ולא סוגר התגית. ⇒ הקטע שנתפס הוא `<button ... () =`,
    // הוא לעולם אינו מכיל `min-h-touch`, והבדיקה נכשלת גם על קוד תקין. נמדד בטיק הזה.
    // ה-lookbehind פוסל `>` שקודמו `=`, ולכן התגית נסגרת במקום הנכון.
    const buttons = CODE.match(/<button[\s\S]{0,600}?(?<!=)>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button).toContain('min-h-touch');
  });
});

/**
 * T-124 · D-065 — כל ענף כשל נושא יציאה.
 *
 * ⚠️ **סטייה מוצהרת מנוסח התוכנית, והקוד הוא שכפה אותה:** התוכנית מוסיפה
 * `data-primary-action="true"` לקישור היציאה כאן. ⛔ אסור. `<DeckSelector>`
 * במסך הזה מרונדר **ללא תנאי** (⛔ לא בתוך ענף מצב), הוא כבר נושא את הסימון
 * מאז T-123, ולכן במצב `failed` היו נספרים **שני** סימונים באותו מסך.
 */
describe('T-124 · D-065 — כל ענף כשל נושא יציאה', () => {
  it('הטבלה מיובאת ⛔ והכלל אינו משוכפל כאן', () => {
    expect(CODE).toContain('failureExit');
    expect(CODE).toContain('isRetryable');
  });

  it('⛔ «נסה שוב» כבר אינו מותנה בקוד קשיח בקובץ הזה', () => {
    expect(CODE).not.toMatch(/state\.code === 'unavailable' \?/);
  });

  it('בלוק הכשל מכיל <a> — יציאה, ⛔ ולא רק משפט', () => {
    const start = CODE.indexOf("state.kind === 'failed'");
    expect(start).toBeGreaterThan(-1);
    const block = CODE.slice(start, start + 1400);
    expect(block).toMatch(/<a\s/);
  });

  it('⛔ אין סימון פעולה ראשית שני — DeckSelector כבר נושא אותו במסך הזה', () => {
    const start = CODE.indexOf("state.kind === 'failed'");
    const block = CODE.slice(start, start + 1400);
    expect(block).not.toContain('data-primary-action');
  });
});

/**
 * T-262 · D-188 · F-176 — כותרת הגג של המוצר («אנגלית · מסלול אמיר״ם»,
 * `app/layout.tsx:38`) הודפסה גם כאן (`TRACK_HE`, ‏:54/:153) — נמדד חי ב-
 * `/dev/tabs/cards` ב-375×780: פעמיים במסך הזה, פעם אחת בכל שאר המסכים.
 * `app/layout.tsx` הוא הבעלים היחיד; הקובץ הזה ⛔ אינו נגוע — הבדיקה קוראת
 * אותו read-only כדי לגזור את מחרוזת הכותרת בעצמה, ⛔ ולא כדי לשכפל אותה ביד
 * וליצור עותק שלישי שיכול לסטות מהמקור.
 */
function walkComponents(): string[] {
  const root = 'components';
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || /\.(test|spec)\.(ts|tsx)$/.test(entry.name)) continue;
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    out.push(join(root, entry.name));
  }
  return out;
}

function layoutMasthead(): string {
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const match = /<header[^>]*>[\s\S]*?<span[^>]*>\s*([^<]+?)\s*<\/span>/.exec(layout);
  if (!match?.[1]) {
    throw new Error('app/layout.tsx masthead <span> not found — update this gate (D-188)');
  }
  return match[1].trim();
}

describe('T-262 · D-188 — כותרת הגג נכתבת במקום אחד, ⛔ ואינה חוזרת ב-components/', () => {
  it('`TRACK_HE` הוסר — הכותרת ⛔ אינה מודפסת יותר בקובץ הזה', () => {
    expect(CODE).not.toContain('TRACK_HE');
    expect(CODE).not.toContain(layoutMasthead());
  });

  it('⛔ שום קובץ אחר תחת components/ אינו מדפיס את כותרת הגג של app/layout.tsx', () => {
    const heading = layoutMasthead();
    const offenders = walkComponents().filter((file) => readFileSync(file, 'utf8').includes(heading));

    expect(offenders).toEqual([]);
  });
});
