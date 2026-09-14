import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/** `<LevelPath>` — שורה 6 של § 4.2ז (T-084). שומר מקור. */
const SRC = readFileSync('components/LevelPath.tsx', 'utf8');

const CODE = withoutComments(SRC);

describe('חוקה § 1 — צבע לעולם אינו הערוץ היחיד', () => {
  it('לכל שבב תווית מספרית לצד הטבעת', () => {
    expect(CODE).toContain('{chip.known}');
    expect(CODE).toContain('{chip.totalInLevel}');
  });

  it('לכל שבב גם תווית עברית ⛔ ולא אות בלבד', () => {
    expect(CODE).toContain('LEVEL_LABELS_HE');
  });

  it('הרמה הנוכחית מסומנת גם בטקסט ⛔ ולא רק במסגרת', () => {
    expect(CODE).toContain('aria-current');
    expect(CODE).toContain('הרמה שלך');
  });

  it('האחוז מגיע מהשכבה הטהורה ⛔ ואינו מחושב כאן', () => {
    expect(CODE).toContain('chip.percent');
    expect(CODE).not.toMatch(/\/\s*totalInLevel/);
  });
});

describe('D-037 · R-017 — ⛔ אין נעילה ואין סף', () => {
  it.each(['נעול', 'LockIcon', 'שולט', 'עדיין לא', 'מוכן', 'ניקוד', 'רצף', 'אחוז שליטה'])(
    '⛔ «%s» אינו מופיע',
    (needle) => {
      expect(CODE).not.toContain(needle);
    },
  );

  it('כל שבב שיש בו מילים ניתן להקשה — הכתיבה היא הנתיב הקיים', () => {
    expect(CODE).toContain('onChoose(');
    expect(CODE).not.toContain('/api/levels/current');
  });

  it('רמה ריקה מושבתת עם המספר ⛔ ולא מוסתרת', () => {
    expect(CODE).toContain('chip.isEmpty');
    expect(CODE).toContain('aria-disabled');
    expect(CODE).not.toMatch(/isEmpty\s*\?\s*null/);
  });
});

describe('חוקת העיצוב', () => {
  it('⛔ אין hex גולמי — אסימונים בלבד (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('הטבעת היא SVG ⛔ ולא אמוג\'י ולא תמונה (חוקה § 6)', () => {
    expect(CODE).toContain('<svg');
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('הטבעת נצבעת דרך currentColor ⛔ ולא דרך ערך צבע בקובץ', () => {
    expect(CODE).toContain('currentColor');
  });

  it('⛔ אין מרכוז אנכי על מכולה ראשית ואין h-screen', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it('כל שבב הוא יעד מגע ≥44px', () => {
    expect(CODE).toContain('min-h-touch');
  });

  it('⛔ אין גישה ישירה לדאטהבייס', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });
});

/**
 * ⚠️ **ההורה השתנה C-0318 (T-211 · D-123), ו⛔ שמירת היתמות ⛔ לא נחלשה — היא עברה
 * לקובץ הנכון.** `36 § 5` פותח ב«**אין מעבר רמות כאן**», ולכן `<LevelPath>` ⛔ אינו
 * שורה במסך הכרטיסיות עוד; הבית שלו הוא `הגדרות` (`36 § 4`: «לתת בית לשינוי רמה»).
 * ⛔ **הרכיב עצמו ⛔ לא נגעו בו** — זהו שינוי **הורה**, וכל הבדיקות שמעל עוברות כלשונן.
 *
 * ⚠️ **ובדיקת ההורה סורקת מקור ⛔ מנוקה-הערות מעכשיו (F-141):** הניסוח הקודם קרא את
 * ה-`SRC` הגולמי, ולכן הזכרה של `<LevelPath` **בהערה** הייתה מספקת אותו — נמדד בטיק
 * הזה: הבדיקה עברה על `<LevelMapScreen>` שכבר ⛔ לא רינדר אותו כלל.
 */
describe('הרכיב אינו יתום — הבית שלו הוא `הגדרות` (T-211)', () => {
  const SETTINGS = readFileSync('app/(tabs)/settings/page.tsx', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

  it('‏`הגדרות` מרנדר אותו', () => {
    expect(SETTINGS).toContain('<LevelPath');
  });

  it('ההורה מוסר לו את levels מהשרת ⛔ ואינו בונה אותם בעצמו', () => {
    expect(SETTINGS).toContain('levels={');
    expect(SETTINGS).toContain("'/api/levels/summary'");
  });

  it('מוטציה: מסך הכרטיסיות ⛔ אינו מרנדר אותו עוד (36 § 5 · D-123)', () => {
    const cards = readFileSync('components/LevelMapScreen.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    expect(cards).not.toContain('<LevelPath');
  });
});
