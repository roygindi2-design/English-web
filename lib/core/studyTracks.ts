/**
 * PURE. ⛔ אפס react · window · document · fetch · env · new Date() · Math.random().
 *
 * הרישום של ארבעת המסלולים (`36 § 9` · D-176) וגזירת מה שכל שבב מציג — T-246.
 * ⛔ **הקובץ הזה אינו קורא דאטהבייס ואינו מגדיר «ידוע».** `classifyProgress` ב-
 * `lib/core/levelSummary.ts` היא ההגדרה היחידה (§ 4.2ז), וזה הקובץ שרק **מרכיב**
 * את מה שכבר סוכם משם למשפט אחד לכל מסלול.
 *
 * ⚠️ הוספת מסלול היא שורה ב-`STUDY_TRACKS`, ⛔ לא מסך חדש (T-246ⓐ).
 */
import type { LevelSummary } from './levelSummary';

export type StudyTrackId = 'vocabulary' | 'grammar' | 'writing' | 'reading';

export interface StudyTrackMeta {
  readonly id: StudyTrackId;
  readonly labelHe: string;
}

/**
 * ⛔ סדר `36 § 9`, ⛔ אל תסדר מחדש: `render_video_A.py:1252-1264` (`screen_hub`)
 * מצייר שורת שבבים ב-RTL שמתחילה ב-`x = LW - 24` ומתקדמת שמאלה על פני המערך הזה
 * בסדר — כלומר **האיבר הראשון כאן הוא השבב הימני ביותר על המסך**.
 */
/**
 * ⚠️ טיפוס tuple, ⛔ לא `StudyTrackMeta[]` גרידא: `noUncheckedIndexedAccess`
 * (tsconfig.json) הופך אינדוקס למערך רגיל ל-`| undefined`, ו-`StudiesScreen`
 * צריך `STUDY_TRACKS[0]` בלי בדיקת undefined כדי לקבוע את השבב הפעיל בפתיחה.
 */
export const STUDY_TRACKS: readonly [StudyTrackMeta, StudyTrackMeta, StudyTrackMeta, StudyTrackMeta] =
  Object.freeze([
    { id: 'vocabulary', labelHe: 'אוצר מילים' },
    { id: 'grammar', labelHe: 'דקדוק' },
    { id: 'writing', labelHe: 'כתיבה' },
    { id: 'reading', labelHe: 'הבנת הנקרא' },
  ]);

export function trackLabelHe(id: StudyTrackId): string {
  const meta = STUDY_TRACKS.find((t) => t.id === id);
  if (!meta) throw new RangeError(`studyTracks: unknown track id "${id}"`);
  return meta.labelHe;
}

/**
 * T-246ⓑ: סוג המדד הוא פרמטר של המסלול, ⛔ לא הנחה. `kind` הוא הצורה, ⛔ לא
 * הרנדר של המשפט עצמו — `summaryHe` כבר גמור לתצוגה כי HARD INVARIANTS אוסר
 * תוכן לימודי בקוד, ⛔ ולא ניסוח UI במקום אחר.
 *
 * ⛔ **`'unreachable'` ⛔ אינו `'empty'`.** קריאה שנכשלה חייבת להיראות שונה
 * ממסלול ריק **באמת** — התבנית של `DeckSelector`'s `UNKNOWN_COUNT_HE` (D-046/D-082
 * חלה על כל מספר בעילת, ⛔ ולא רק על ⓓ).
 */
export type TrackMetricState =
  | { readonly kind: 'measured'; readonly summaryHe: string }
  | { readonly kind: 'empty'; readonly summaryHe: string }
  | { readonly kind: 'unreachable' };

/**
 * ⛔ **אין כאן ולו שאילתה אחת** — `levels` כבר מגיע מ-`GET /api/levels/summary`
 * (T-246 Task 1), שכבר סיכם `known`/`totalInLevel` דרך `classifyProgress`. הפונקציה
 * הזאת רק **מצרפת** שש רמות למשפט אחד — ⛔ ולא מגדירה מחדש מה «ידוע».
 */
export function vocabularyMetric(levels: readonly LevelSummary[]): TrackMetricState {
  const totalWords = levels.reduce((sum, l) => sum + l.totalInLevel, 0);
  const known = levels.reduce((sum, l) => sum + l.known, 0);
  return { kind: 'measured', summaryHe: `${known} מתוך ${totalWords} מילים ידועות` };
}

/**
 * T-246ⓓ · D-176 §ד: «לדקדוק, לכתיבה ולהבנת הנקרא אין תוכן» הוא משפט מפורש
 * ב-`36 § 9`, ⛔ לא הנחה שלי — ולכן `0 מתוך 0` כאן הוא קבוע, ⛔ לא תוצאת שאילתה
 * שנכשלה. **כשתתווסף סכמה לאחד משלושת המסלולים האלה, הפונקציה הזאת צריכה
 * לזוז לקריאה אמיתית** — הקבוע הזה תקף אך ורק כל עוד `36 § 9` עצמו אומר שאין תוכן.
 */
export function emptyTrackMetric(
  id: Exclude<StudyTrackId, 'vocabulary'>,
): Extract<TrackMetricState, { kind: 'empty' }> {
  // ⚠️ D-110 latitude, logged in the tick report: the plan's own draft string used
  // an em dash ("— 0 מתוך 0"), but "—" is reserved for the 'unreachable' state
  // (D-046/D-082 — see UNREACHABLE_HE in StudiesScreen.tsx) so a real "empty" string
  // must never carry one. Parentheses replace the dash; the number stays real.
  return { kind: 'empty', summaryHe: `אין עדיין פריטים ב${trackLabelHe(id)} (0 מתוך 0)` };
}
