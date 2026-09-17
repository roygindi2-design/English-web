/**
 * PURE. ⛔ אפס react · window · document · fetch · env · new Date() · Math.random().
 *
 * `T-409` · **המקום שבו הלומד עצר במסלול** — חותמת ⓒ של `36 § 13.2` שורה 5,
 * מילה במילה: «המיקום במסלול נשמר לכניסה הבאה». **המשך של `T-408`**, שנתן את
 * החזרה **מפריט** אל הנתיב דרך עוגן ב-URL; זה נותן את החזרה **בכניסה הבאה**,
 * כשאין עוגן בכלל.
 *
 * ⛔ **סימנייה, ⛔ ולא התקדמות** — בדיוק אותה הפרדה ש-`0028_study_level_cursor`
 * כבר כתבה: «איפה עצרתי» ⛔ אינו «מה אני יודע». `word_progress` ⛔ אינו נגוע כאן,
 * ו⛔ אין כאן ציון, ⛔ אין מונה ו⛔ אין «זמן לימוד».
 *
 * ⛔ **ו⛔ אין כאן שאילתה אחת.** הקובץ מקבל שורות שכבר נקראו ומצרף אותן לתשובה
 * אחת — בדיוק התפקיד ש-`studyTracks.ts` ממלא מול `GET /api/levels/summary`.
 */
import { STUDY_TRACKS, parseStudyModuleId, type StudyTrackId } from './studyTracks';

export interface StudyPlace {
  readonly trackId: StudyTrackId;
  /**
   * ⛔ `null` הוא מצב אמיתי ו⛔ לא פער: שלושת המסלולים בלי תוכן (`36 § 9`)
   * ⛔ אין להם מודולים כלל, ⇒ «הייתי ב`הבנת הנקרא`» הוא מקום שלם בפני עצמו.
   */
  readonly moduleId: string | null;
  readonly updatedAt: string;
}

/** ⛔ שער, ⛔ ולא פענוח — הערך מגיע מגוף בקשה ומשורה שהמסד החזיר. */
export function parseStudyTrackId(value: unknown): StudyTrackId | null {
  if (typeof value !== 'string') return null;
  const meta = STUDY_TRACKS.find((track) => track.id === value);
  return meta ? meta.id : null;
}

/**
 * ⛔ **מזהה מודול פסול מפיל את המודול, ⛔ ולא את המסלול.** השורה עדיין אומרת
 * דבר אמיתי — באיזה מסלול הלומד היה — ולזרוק אותה בגללו היה מחזיר את הלומד
 * לראש הרשימה בגלל תו אחד.
 */
export function parseStudyPlaceRow(row: unknown): StudyPlace | null {
  if (typeof row !== 'object' || row === null || Array.isArray(row)) return null;
  const record = row as Record<string, unknown>;
  const trackId = parseStudyTrackId(record.track_id);
  if (trackId === null) return null;
  const updatedAt = record.updated_at;
  if (typeof updatedAt !== 'string' || updatedAt === '') return null;
  return { trackId, moduleId: parseStudyModuleId(record.module_id), updatedAt };
}

export function parseStudyPlaces(rows: unknown): readonly StudyPlace[] {
  if (!Array.isArray(rows)) return [];
  const places: StudyPlace[] = [];
  for (const row of rows) {
    const place = parseStudyPlaceRow(row);
    if (place !== null) places.push(place);
  }
  return places;
}

/**
 * ⛔ `Date.parse` ו⛔ לא השוואת מחרוזות: Postgres מחזיר `+00:00` ו-`toISOString()`
 * כותב `Z`, ⇒ אותו רגע בדיוק נותן שתי מחרוזות שסדרן הלקסיקוגרפי הפוך מסדר הזמן.
 * ⛔ **וזו ⛔ אינה קריאת שעון** — `Date.parse` על מחרוזת נתונה הוא דטרמיניסטי,
 * ⇒ הקובץ נשאר טהור.
 *
 * ⛔ **ושוויון ⛔ אינו מוכרע על ידי סדר ההחזרה של המסד** — שאילתה בלי `order by`
 * מותר לה להחזיר כל סדר, ⇒ מסך שהיה נשען עליו היה נפתח על מסלול אחר בכל טעינה.
 * המכריע הוא סדר `STUDY_TRACKS`, שהוא סדר התצוגה של `36 § 9`.
 */
function placeRank(place: StudyPlace): number {
  const parsed = Date.parse(place.updatedAt);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

export function latestStudyPlace(places: readonly StudyPlace[]): StudyPlace | null {
  let best: StudyPlace | null = null;
  let bestRank = Number.NEGATIVE_INFINITY;
  let bestOrder = Number.POSITIVE_INFINITY;
  for (const place of places) {
    const rank = placeRank(place);
    const order = STUDY_TRACKS.findIndex((track) => track.id === place.trackId);
    if (best === null || rank > bestRank || (rank === bestRank && order < bestOrder)) {
      best = place;
      bestRank = rank;
      bestOrder = order;
    }
  }
  return best;
}

export function studyPlaceForTrack(
  places: readonly StudyPlace[],
  trackId: StudyTrackId,
): StudyPlace | null {
  return places.find((place) => place.trackId === trackId) ?? null;
}
