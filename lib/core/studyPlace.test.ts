import { describe, expect, it } from 'vitest';
import {
  latestStudyPlace,
  parseStudyPlaceRow,
  parseStudyPlaces,
  parseStudyTrackId,
  studyPlaceForTrack,
  type StudyPlace,
} from './studyPlace';

/**
 * `T-409` · חותמת ⓒ של `36 § 13.2` שורה 5 — «המיקום במסלול נשמר לכניסה הבאה».
 * ⛔ הקובץ הנבדק טהור: ⛔ אפס רשת, ⛔ אפס `window`, ⛔ אפס `new Date()`.
 */

const A: StudyPlace = { trackId: 'vocabulary', moduleId: 'A1', updatedAt: '2026-09-17T10:00:00Z' };
const B: StudyPlace = { trackId: 'reading', moduleId: null, updatedAt: '2026-09-17T12:00:00Z' };

describe('parseStudyTrackId — שער, ⛔ ולא פענוח', () => {
  it.each(['vocabulary', 'grammar', 'writing', 'reading'])('מזהה מסלול מוכר %s עובר', (id) => {
    expect(parseStudyTrackId(id)).toBe(id);
  });

  it.each([null, undefined, 42, '', 'Vocabulary', 'arena', { id: 'reading' }])(
    '⛔ %s נדחה כ-null, ⛔ ולא נזרק',
    (value) => {
      expect(parseStudyTrackId(value)).toBeNull();
    },
  );
});

describe('parseStudyPlaceRow — שורה מהמסד ⛔ אינה נאמנה', () => {
  it('שורה שלמה עוברת כמות שהיא', () => {
    expect(parseStudyPlaceRow({ track_id: 'vocabulary', module_id: 'A1', updated_at: A.updatedAt })).toEqual(A);
  });

  it('‏`module_id` ריק ⇒ `null`, ⛔ ולא מחרוזת ריקה — «המסלול, בלי מודול» הוא מצב אמיתי', () => {
    expect(parseStudyPlaceRow({ track_id: 'reading', module_id: '', updated_at: B.updatedAt })).toEqual(B);
    expect(parseStudyPlaceRow({ track_id: 'reading', module_id: null, updated_at: B.updatedAt })).toEqual(B);
  });

  it('⛔ מזהה מודול שאינו בצורה שהמוצר בונה ⇒ המסלול נשמר וה**מודול** נופל', () => {
    const row = parseStudyPlaceRow({ track_id: 'vocabulary', module_id: '../../etc', updated_at: A.updatedAt });
    expect(row).toEqual({ trackId: 'vocabulary', moduleId: null, updatedAt: A.updatedAt });
  });

  it.each([null, 42, [], { track_id: 'nope' }, { track_id: 'vocabulary' }])('⛔ %s ⇒ null', (value) => {
    expect(parseStudyPlaceRow(value)).toBeNull();
  });
});

describe('parseStudyPlaces — רשימה', () => {
  it('שורה פסולה ⛔ אינה מפילה את השאר', () => {
    const places = parseStudyPlaces([
      { track_id: 'vocabulary', module_id: 'A1', updated_at: A.updatedAt },
      { track_id: 'nope', module_id: 'A1', updated_at: A.updatedAt },
      { track_id: 'reading', module_id: null, updated_at: B.updatedAt },
    ]);
    expect(places).toEqual([A, B]);
  });

  it('⛔ מה שאינו מערך ⇒ רשימה ריקה, ⛔ ולא זריקה', () => {
    expect(parseStudyPlaces(null)).toEqual([]);
    expect(parseStudyPlaces({ places: [] })).toEqual([]);
  });
});

describe('latestStudyPlace — «המסלול שבו הלומד היה», ⛔ ולא הראשון ברשימה', () => {
  it('החדש ביותר לפי `updatedAt`, ⛔ ולא לפי הסדר שהמסד החזיר', () => {
    expect(latestStudyPlace([A, B])).toEqual(B);
    expect(latestStudyPlace([B, A])).toEqual(B);
  });

  it('רשימה ריקה ⇒ null — הלומד ⛔ עדיין לא היה בשום מקום', () => {
    expect(latestStudyPlace([])).toBeNull();
  });

  it('שוויון מלא בזמן ⇒ סדר `STUDY_TRACKS`, ⛔ ולא סדר ההחזרה — ⛔ אפס תלות במסד', () => {
    const sameTime = '2026-09-17T09:00:00Z';
    const voc: StudyPlace = { trackId: 'vocabulary', moduleId: 'A1', updatedAt: sameTime };
    const read: StudyPlace = { trackId: 'reading', moduleId: null, updatedAt: sameTime };
    expect(latestStudyPlace([read, voc])).toEqual(voc);
    expect(latestStudyPlace([voc, read])).toEqual(voc);
  });

  it('⛔ חותמת זמן שאינה ניתנת לפענוח ⛔ אינה מנצחת חותמת תקינה', () => {
    const broken: StudyPlace = { trackId: 'grammar', moduleId: null, updatedAt: 'לא-תאריך' };
    expect(latestStudyPlace([broken, A])).toEqual(A);
  });

  it('‏`+00:00` ו-`Z` הם אותו רגע — ההשוואה ⛔ אינה לקסיקוגרפית', () => {
    const zulu: StudyPlace = { trackId: 'vocabulary', moduleId: 'A1', updatedAt: '2026-09-17T12:00:01Z' };
    const offset: StudyPlace = { trackId: 'reading', moduleId: null, updatedAt: '2026-09-17T12:00:00.000+00:00' };
    expect(latestStudyPlace([offset, zulu])).toEqual(zulu);
  });
});

describe('studyPlaceForTrack — המקום **בתוך** המסלול', () => {
  it('מחזיר את השורה של המסלול המבוקש', () => {
    expect(studyPlaceForTrack([A, B], 'reading')).toEqual(B);
  });

  it('מסלול שאין לו שורה ⇒ null, ⛔ ולא ברירת מחדל מומצאת', () => {
    expect(studyPlaceForTrack([A, B], 'writing')).toBeNull();
  });
});
