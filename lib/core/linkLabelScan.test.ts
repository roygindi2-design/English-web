import { describe, expect, it } from 'vitest';
import { extractLinkLabels, linkElementCount, resolveLinkElements } from './linkLabelScan';

describe('extractLinkLabels — T-253 · D-186 · הצד הסטטי של אותה מדידה כמו `journeyDrift`', () => {
  it('קולט תווית עברית אחת בין `<Link href>` ל-`</Link>`', () => {
    const source = `<Link href="/world">חזרה לעולם</Link>`;
    expect(extractLinkLabels(source)).toEqual(new Map([['/world', new Set(['חזרה לעולם'])]]));
  });

  it('אותו יעד משני קבצים (מחוברר לטקסט אחד) ⇒ קבוצת תוויות אחת, שתי תוויות', () => {
    const source = `
      <Link href="/">חזרה למסך הפתיחה</Link>
      // קובץ אחר, אותו יעד
      <Link href="/">חזרה למסך הבית</Link>
    `;
    expect(extractLinkLabels(source)).toEqual(
      new Map([['/', new Set(['חזרה למסך הפתיחה', 'חזרה למסך הבית'])]]),
    );
  });

  it('⛔ מתעלמת מ-`Link` שהתוכן שלו אינו נושא עברית — קישור עם אייקון בלבד', () => {
    expect(extractLinkLabels(`<Link href="/world"><ChevronGlyph /></Link>`)).toEqual(new Map());
  });

  it('⛔ אינה קורסת על מקור ריק', () => {
    expect(extractLinkLabels('')).toEqual(new Map());
  });

  // T-261 · D-187 — 29 מתוך 40 קישורי `<Link>` בעץ האמיתי נותנים את היעד ו/או
  // התווית דרך קבוע ברמת המודול (`href={CARDS_HREF}` · `{BACK_HE}`), ו⛔ לא
  // כמחרוזת גולמית. עד כה `extractLinkLabels` דרש מרכאות סביב שניהם ⇒ 29 קישורים
  // מעולם לא נראו. הכרעת רוי (D-187): פותרים את הקבוע **מאותו קובץ**.
  it('פותרת יעד שמגיע מקבוע ברמת המודול (`href={CARDS_HREF}`)', () => {
    const source = `
const CARDS_HREF = '/cards';
const BACK_HE = 'חזרה לכרטיסיות';
      <Link href={CARDS_HREF}>{BACK_HE}</Link>
    `;
    expect(extractLinkLabels(source)).toEqual(new Map([['/cards', new Set(['חזרה לכרטיסיות'])]]));
  });

  it('פותרת תווית שמגיעה מקבוע ברמת המודול כשה-href הוא מחרוזת מילולית', () => {
    const source = `
const BACK_HE = 'חזרה לזירה';
      <Link href="/arcade">{BACK_HE}</Link>
    `;
    expect(extractLinkLabels(source)).toEqual(new Map([['/arcade', new Set(['חזרה לזירה'])]]));
  });

  it('שני קבצים עם אותו שם קבוע וערך שונה ⛔ אינם מתערבבים — הקבוע נפתר מהמופע הקרוב-הקודם', () => {
    const source = `
const BACK_HE = 'חזרה לעולם';
      <Link href="/world">{BACK_HE}</Link>
      // קובץ אחר, אותו שם קבוע, ערך אחר
const BACK_HE = 'חזרה לזירה';
      <Link href="/arcade">{BACK_HE}</Link>
    `;
    expect(extractLinkLabels(source)).toEqual(
      new Map([
        ['/world', new Set(['חזרה לעולם'])],
        ['/arcade', new Set(['חזרה לזירה'])],
      ]),
    );
  });

  // T-273 — התווית של `session_expired` חיה ב-`lib/core/failureExit.ts` כ-`export const`
  // וכל מסך מייבא אותה. הסורק קורא את מודול-המקור לפני העץ, ולכן `export const` חייב
  // להיפתר בדיוק כמו `const` — אחרת כל קישור שעבר מהכרזה מקומית לייבוא נעלם מהכיסוי.
  it('פותרת `export const` ממודול משותף שחוברר לפני העץ', () => {
    const source = `
export const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
      // קובץ מסך — מייבא את הקבוע, ⛔ לא מכריז עליו
      <Link href="/login">{SIGN_IN_AGAIN_HE}</Link>
    `;
    expect(extractLinkLabels(source)).toEqual(new Map([['/login', new Set(['התחברות מחדש'])]]));
  });

  it('קבוע שאינו נפתר (הוכרז אחרי השימוש, או לא קיים) ⇒ הקישור ⛔ אינו נספר', () => {
    expect(extractLinkLabels(`<Link href={UNKNOWN_HREF}>{UNKNOWN_HE}</Link>`)).toEqual(new Map());
  });
});

describe('linkElementCount — T-261 · המונה של «כמה קישורים» למדד הכיסוי', () => {
  it('סופרת כל `<Link` שנפתח, בלי קשר להצלחת הזיהוי', () => {
    const source = `
      <Link href="/cards">חזרה לכרטיסיות</Link>
      <Link href={UNKNOWN}>{UNKNOWN}</Link>
    `;
    expect(linkElementCount(source)).toBe(2);
  });

  it('אפס קישורים במקור ריק', () => {
    expect(linkElementCount('')).toBe(0);
  });
});

describe('resolveLinkElements — T-261 · פר-אלמנט, ⛔ לא מקובץ לפי יעד (בסיס מדד הכיסוי)', () => {
  it('מחזירה רשומה אחת לכל `<Link>` שנפתר בהצלחה, גם כששני אלמנטים חולקים יעד ותווית', () => {
    const source = `
      <Link href="/cards">חזרה לכרטיסיות</Link>
      <Link href="/cards">חזרה לכרטיסיות</Link>
    `;
    expect(resolveLinkElements(source)).toEqual([
      { destination: '/cards', label: 'חזרה לכרטיסיות' },
      { destination: '/cards', label: 'חזרה לכרטיסיות' },
    ]);
  });

  it('⛔ אינה כוללת קישור שלא נפתר', () => {
    expect(resolveLinkElements(`<Link href={UNKNOWN}>{UNKNOWN}</Link>`)).toEqual([]);
  });
});
