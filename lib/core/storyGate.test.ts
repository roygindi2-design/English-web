// lib/core/storyGate.test.ts
import { describe, expect, it } from 'vitest';
import {
  STORIES_PER_LEVEL,
  STORY_LEVELS,
  STORY_MAX_WORDS,
  STORY_MIN_WORDS,
  allowedLemmasAtOrBelow,
  parseStoryFile,
  storyGate,
  storyLemma,
  type StoryRecord,
} from '@/lib/core/storyGate';

/**
 * ⚠️ **סטייה מדודה מנוסח התוכנית (C-0246):** התוכנית מנתה 11 למות ⛔ והשמיטה
 * את `a`, בעוד `OK.bodyEn` נבנה מ-`['the','girl','reads','a','book']` ⇒ `a`
 * נפסל בשער ושתי בדיקות נפלו («סיפור נקי עובר» · «⛔ אינן כפולות»). נמדד ⛔ ולא
 * שוער: `storyLemma('a', A1)` ⇒ `null`, וארבעת הטוקנים האחרים נפתרו. ⛔ **הפגם
 * הוא בפיקסטורה ⛔ ולא במודול** — `a` היא A1 בבנק האמיתי, והשמטתה הפכה את
 * הפיקסטורה לפחות מייצגת. ⛔ התיקון ⛔ אינו מחליש טענה: הוא **מוסיף** למה
 * מורשית, ⛔ ולא מסיר בדיקה.
 */
const BANK = [
  { lemma: 'a', band: 'A1' },
  { lemma: 'the', band: 'A1' },
  { lemma: 'girl', band: 'A1' },
  { lemma: 'be', band: 'A1' },
  { lemma: 'open', band: 'A1' },
  { lemma: 'book', band: 'A1' },
  { lemma: 'read', band: 'A1' },
  { lemma: 'happy', band: 'A1' },
  { lemma: 'and', band: 'A1' },
  { lemma: 'she', band: 'A1' },
  { lemma: 'company', band: 'A2' },
  { lemma: 'method', band: 'B1' },
] as const;

const A1 = allowedLemmasAtOrBelow('A1', BANK);
const A2 = allowedLemmasAtOrBelow('A2', BANK);

/** גוף באורך חוקי מתוך מילים מורשות בלבד — ⛔ המבנה, ⛔ לא הספרות, הוא הנבדק. */
function body(words: readonly string[], count = STORY_MIN_WORDS): string {
  return Array.from({ length: count }, (_, i) => words[i % words.length]).join(' ') + '.';
}

const OK: StoryRecord = {
  level: 'A1',
  titleEn: 'The girl and the book',
  bodyEn: body(['the', 'girl', 'reads', 'a', 'book']),
};

describe('allowedLemmasAtOrBelow — «ברמה או נמוכה ממנה»', () => {
  it('A1 ⛔ אינו מכיל מילת A2', () => {
    expect(A1.has('girl')).toBe(true);
    expect(A1.has('company')).toBe(false);
  });

  it('A2 מכיל את A1 ואת A2, ⛔ ולא את B1', () => {
    expect(A2.has('girl')).toBe(true);
    expect(A2.has('company')).toBe(true);
    expect(A2.has('method')).toBe(false);
  });
});

describe('storyLemma — הפחתה אל למה שבבנק, ⛔ ולא הרחבה', () => {
  it('טוקן שהוא עצמו למה מוחזר כמות שהוא', () => {
    expect(storyLemma('book', A1)).toBe('book');
  });

  it('גוף שלישי · עבר · הווה ממושך מופחתים ללמה', () => {
    expect(storyLemma('reads', A1)).toBe('read');
    expect(storyLemma('opened', A1)).toBe('open');
    expect(storyLemma('opening', A1)).toBe('open');
  });

  it('צורה חריגה עוברת דרך המפה הסגורה: is ⇒ be', () => {
    expect(storyLemma('is', A1)).toBe('be');
    expect(storyLemma('was', A1)).toBe('be');
  });

  it('⛔ המפה החריגה ⛔ אינה מכניסה למה שאינה בבנק', () => {
    const tiny = new Set(['book']);
    expect(storyLemma('is', tiny)).toBeNull();
  });

  it('⛔ ⛔ ה-false-accept של F-020 ⛔ אינו נולד מחדש: card ⛔ אינו car', () => {
    const withCar = new Set(['car']);
    expect(storyLemma('card', withCar)).toBeNull();
  });

  it('מילה שאינה בבנק כלל ⇒ null', () => {
    expect(storyLemma('helicopter', A1)).toBeNull();
  });

  /**
   * ⚠️ **בדיקה שנוספה ⛔ מעבר לנוסח התוכנית (C-0246), ומטעם נמדד:** התוכנית
   * הכתיבה מוטציה אחת בלבד (תקרת הרמה), ⛔ ואף בדיקה ⛔ לא כיסתה את `MIN_STEM`.
   * נמדד: `MIN_STEM = 2 → 1` ⇒ **18/18 נשארו ירוקות** ⇒ הגבול היה קישוט
   * (F-088). עם `MIN_STEM = 1` הטוקן `bed` נחתך ל-`b`, המועמד `be` נמצא בבנק,
   * ו-`bed` **מתקבל** — בדיוק ה-false-accept של F-020, מהדלת האחורית.
   */
  it('⛔ שארית של אות אחת ⛔ אינה גזע: bed ⛔ אינו be (MIN_STEM)', () => {
    expect(A1.has('be')).toBe(true);
    expect(storyLemma('bed', A1)).toBeNull();
  });
});

describe('storyGate — מילה זרה אחת מפילה את הסיפור ומזוהה בשמה', () => {
  it('סיפור נקי עובר', () => {
    const r = storyGate(OK, { allowedLemmas: A1 });
    expect(r.ok).toBe(true);
    expect(r.unknownWords).toEqual([]);
  });

  it('מילה אחת מחוץ לרמה ⇒ ok:false ושמה ברשימה', () => {
    const r = storyGate(
      { ...OK, bodyEn: `${OK.bodyEn} The company is here.` },
      { allowedLemmas: A1 },
    );
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain('unknown_words');
    expect(r.unknownWords).toContain('company');
  });

  it('⛔ הכותרת נבדקת גם היא — היא טקסט שהלומד קורא', () => {
    const r = storyGate({ ...OK, titleEn: 'The helicopter' }, { allowedLemmas: A1 });
    expect(r.unknownWords).toContain('helicopter');
  });

  it('⛔ המילים החסרות ⛔ אינן כפולות ומדווחות ממוינות', () => {
    const r = storyGate(
      { ...OK, bodyEn: `${OK.bodyEn} zebra zebra apple.` },
      { allowedLemmas: A1 },
    );
    expect(r.unknownWords).toEqual(['apple', 'zebra']);
  });

  it('גוף קצר מדי ⇒ too_short, וארוך מדי ⇒ too_long', () => {
    const short = storyGate({ ...OK, bodyEn: body(['the', 'girl'], STORY_MIN_WORDS - 1) }, { allowedLemmas: A1 });
    expect(short.reasons).toContain('too_short');
    const long = storyGate({ ...OK, bodyEn: body(['the', 'girl'], STORY_MAX_WORDS + 1) }, { allowedLemmas: A1 });
    expect(long.reasons).toContain('too_long');
  });

  it('⛔ ספרה בטקסט ⇒ נפסל — תאריך ומספר הם טענה על העולם (T-135ⓒ)', () => {
    const r = storyGate({ ...OK, bodyEn: `${OK.bodyEn} It was 1999.` }, { allowedLemmas: A1 });
    expect(r.reasons).toContain('digit_in_text');
  });

  it('כותרת ארוכה מדי ⇒ title_too_long', () => {
    const r = storyGate({ ...OK, titleEn: 'the the the the the the the' }, { allowedLemmas: A1 });
    expect(r.reasons).toContain('title_too_long');
  });
});

describe('parseStoryFile', () => {
  it('קורא שורות JSONL ומדלג על ריקות', () => {
    const text = `{"level":"A1","title_en":"The book","body_en":"the girl"}\n\n`;
    expect(parseStoryFile(text)).toEqual([
      { level: 'A1', titleEn: 'The book', bodyEn: 'the girl' },
    ]);
  });

  it('⛔ רמה שאינה אחת מארבע ⇒ זריקה בשם, ⛔ ולא דילוג שקט', () => {
    expect(() => parseStoryFile('{"level":"C1","title_en":"x","body_en":"y"}')).toThrow(/C1/);
  });
});

describe('הקבועים הם המקור היחיד', () => {
  it('ארבע רמות · שלושה סיפורים · 90–150 מילים', () => {
    expect(STORY_LEVELS).toEqual(['A1', 'A2', 'B1', 'B2']);
    expect(STORIES_PER_LEVEL).toBe(3);
    expect(STORY_MIN_WORDS).toBe(90);
    expect(STORY_MAX_WORDS).toBe(150);
  });
});
