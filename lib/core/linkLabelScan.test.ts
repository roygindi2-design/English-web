import { describe, expect, it } from 'vitest';
import { extractLinkLabels } from './linkLabelScan';

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
});
