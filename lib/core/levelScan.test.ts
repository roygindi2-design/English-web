import { describe, expect, it } from 'vitest';
import {
  MAX_SCAN_WORDS,
  SCAN_PAGE_SIZE,
  checkScanPayload,
  excludeSeen,
  pageCount,
  pageOf,
  sortScanWords,
  type ScanWord,
} from './levelScan';

// ⚠️ סטייה מהתוכנית, ⛔ ולא בחירה: התוכנית כתבה כאן `...-3333-4444-...`, והנִיבֶּל הראשון
// של הקבוצה הרביעית חייב להיות `[89ab]` (וריאנט RFC-4122) — בדיוק כמו ב-`deck.ts:183`,
// שממנו הועתק `UUID_RE`. הפיקסטורה נדחתה, ⛔ והרֶגֶקְס ⛔ אינו הפגם. תוקן ל-`8444`.
const ID_A = '11111111-2222-3333-8444-555555555555';
const ID_B = '22222222-3333-4444-8888-999999999999';
const ID_C = '33333333-4444-4444-9999-aaaaaaaaaaaa';

function word(wordId: string, headword: string): ScanWord {
  return { wordId, headword };
}

describe('D-041 — 12 מילים בכל מסך, וזה מספר המפרט ⛔ ולא בחירה', () => {
  it('גודל העמוד הוא 12', () => {
    expect(SCAN_PAGE_SIZE).toBe(12);
  });

  it('315 מילים ⇒ 27 מסכים — בדיוק החישוב שכתוב ב-D-041', () => {
    expect(pageCount(315)).toBe(27);
  });

  it('אפס מילים ⇒ אפס מסכים, ⛔ ולא מסך ריק אחד', () => {
    expect(pageCount(0)).toBe(0);
  });

  it('12 בדיוק ⇒ מסך אחד, ו-13 ⇒ שניים', () => {
    expect(pageCount(12)).toBe(1);
    expect(pageCount(13)).toBe(2);
  });

  it('מספר שאינו שלם אי-שלילי ⇒ 0, ⛔ ולא NaN שיזלוג למסך', () => {
    expect(pageCount(-4)).toBe(0);
    expect(pageCount(2.5)).toBe(0);
    expect(pageCount(Number.NaN)).toBe(0);
  });
});

describe('pageOf — חיתוך, ⛔ ולא מיון מחדש', () => {
  const words: ScanWord[] = Array.from({ length: 25 }, (_, i) =>
    word(`${i}`.padStart(8, '0') + '-2222-3333-4444-555555555555', `w${`${i}`.padStart(2, '0')}`),
  );

  it('העמוד הראשון הוא 12 הראשונים', () => {
    const page = pageOf(words, 0);
    expect(page).toHaveLength(12);
    expect(page[0]?.headword).toBe('w00');
    expect(page[11]?.headword).toBe('w11');
  });

  it('העמוד האחרון מכיל את השארית ⛔ ואינו מרופד', () => {
    expect(pageOf(words, 2)).toHaveLength(1);
    expect(pageOf(words, 2)[0]?.headword).toBe('w24');
  });

  it('עמוד מעבר לסוף הוא רשימה ריקה, ⛔ ולא זריקה', () => {
    expect(pageOf(words, 99)).toEqual([]);
  });

  it('אינדקס שלילי או שבור ⇒ העמוד הראשון, ⛔ ולא undefined', () => {
    expect(pageOf(words, -1)[0]?.headword).toBe('w00');
    expect(pageOf(words, 1.5)[0]?.headword).toBe('w00');
  });
});

describe('ⓔ סדר יציב — לומד שיצא באמצע וחזר רואה בדיוק את אותה רשימה', () => {
  it('ממוין לפי headword, ובשוויון לפי wordId', () => {
    const sorted = sortScanWords([word(ID_C, 'zebra'), word(ID_B, 'apple'), word(ID_A, 'apple')]);
    expect(sorted.map((w) => w.wordId)).toEqual([ID_A, ID_B, ID_C]);
  });

  it('⛔ אינו משנה את המערך של הקורא', () => {
    const input = [word(ID_C, 'zebra'), word(ID_A, 'apple')];
    sortScanWords(input);
    expect(input[0]?.headword).toBe('zebra');
  });

  it('שתי הרצות על אותה כניסה מחזירות אותו סדר בדיוק', () => {
    const input = [word(ID_C, 'zebra'), word(ID_B, 'apple'), word(ID_A, 'apple')];
    expect(sortScanWords(input)).toEqual(sortScanWords(input));
  });
});

describe('ⓐ הסריקה מציעה אך ורק מילים שאין להן שורת התקדמות', () => {
  it('מילה שיש לה שורה מוסרת', () => {
    const left = excludeSeen([word(ID_A, 'apple'), word(ID_B, 'banana')], [ID_A]);
    expect(left.map((w) => w.wordId)).toEqual([ID_B]);
  });

  it('רשימת נראו ריקה ⇒ הכל נשאר', () => {
    expect(excludeSeen([word(ID_A, 'apple')], [])).toHaveLength(1);
  });

  it('מזהה שאינו ברשימת המילים ⛔ אינו מפיל דבר', () => {
    expect(excludeSeen([word(ID_A, 'apple')], [ID_C])).toHaveLength(1);
  });
});

describe('checkScanPayload — F-004 על הגבול', () => {
  it('גוף תקין עם מזהה אחד', () => {
    const result = checkScanPayload({ word_ids: [ID_A] });
    expect(result).toEqual({ ok: true, wordIds: [ID_A] });
  });

  it.each([null, [], 'x', 7, undefined])('⛔ גוף שאינו אובייקט (%s) נדחה', (body) => {
    expect(checkScanPayload(body)).toEqual({ ok: false, code: 'unavailable' });
  });

  it('⛔ רשימה ריקה נדחית — בקשה שאינה מסמנת דבר אינה בקשה', () => {
    expect(checkScanPayload({ word_ids: [] }).ok).toBe(false);
  });

  it('⛔ יותר מ-12 מזהים נדחים — מסך אחד הוא התקרה', () => {
    const many = Array.from({ length: SCAN_PAGE_SIZE + 1 }, () => ID_A);
    expect(checkScanPayload({ word_ids: many }).ok).toBe(false);
  });

  it('⛔ מזהה שאינו UUID נדחה, ⛔ ולא מסונן בשקט', () => {
    expect(checkScanPayload({ word_ids: [ID_A, 'not-a-uuid'] }).ok).toBe(false);
  });

  it('⛔ כפילות נדחית — היא הופכת «סימנתי 12» ל-11 בלי שאיש יראה', () => {
    expect(checkScanPayload({ word_ids: [ID_A, ID_A] }).ok).toBe(false);
  });

  it('⛔ אין ברירת מחדל: גוף בלי word_ids נדחה', () => {
    expect(checkScanPayload({}).ok).toBe(false);
  });
});

describe('התקרה היא ביטוח, ⛔ ולא מגבלת מוצר', () => {
  it('גדולה בהרבה מהרמה הגדולה במאגר (A1 = 315)', () => {
    expect(MAX_SCAN_WORDS).toBe(500);
    expect(MAX_SCAN_WORDS).toBeGreaterThan(315);
  });
});
