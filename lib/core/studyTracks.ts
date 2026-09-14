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

/**
 * T-145ⓑ · D-180. The primary action on `<MeScreen>` names the first track a
 * learner would actually continue — DERIVED, not hard-coded to `'vocabulary'`.
 * The rule is exactly `STUDY_TRACKS`' own order: the first track whose metric
 * is not `'empty'`. Today that is always `vocabulary`, because
 * `vocabularyMetric` never returns `'empty'` and it sits first in the array —
 * ⛔ but the day grammar/writing/reading gain real content (D-176 §ד stops
 * saying otherwise), this walk starts returning them without a code change
 * here.
 *
 * ⛔ Zero new query: `levels` is the same six-band array `<StudiesScreen>`
 * already fetches from `GET /api/levels/summary`.
 */
export function primaryStudyTrack(levels: readonly LevelSummary[]): StudyTrackId {
  for (const track of STUDY_TRACKS) {
    const metric = track.id === 'vocabulary' ? vocabularyMetric(levels) : emptyTrackMetric(track.id);
    if (metric.kind !== 'empty') return track.id;
  }
  // Unreachable while `vocabularyMetric` never returns 'empty' and it is
  // STUDY_TRACKS[0] — kept so the function has a total return type instead of
  // a `!` assertion.
  return STUDY_TRACKS[0].id;
}

/**
 * T-351 · «דרך אחת קדימה מכל מסך». היעד שאליו המסלול **נלמד בפועל**, ⛔ ולא
 * המסך שמתאר אותו. `null` הוא מצב אמיתי ו⛔ לא כשל: לדקדוק, לכתיבה ולהבנת
 * הנקרא ⛔ אין עדיין מסך בנוי (D-176 §ד · `36 § 9`), ולכן `<StudiesScreen>`
 * אומר זאת בעברית במקום להציג קישור שמוביל לשום מקום.
 *
 * 🔬 **למה זה כאן ו⛔ לא ברכיב:** זו מפה בין שני דברים שכבר קיימים במוצר
 * (מזהה מסלול ⇢ נתיב), ⇒ היא ניתנת לבדיקה בלי DOM, בדיוק כמו `trackLabelHe`.
 *
 * ⚠️ **היעד ⛔ אינו תלוי במדד.** קריאת ההתקדמות שנכשלה (`'unreachable'`)
 * ⛔ אינה מוחקת את הדרך קדימה — זה בדיוק מה ש-`T-349` קבע, והתלות היחידה כאן
 * היא בזהות המסלול.
 */
export interface TrackDestination {
  readonly href: string;
  readonly labelHe: string;
}

export function trackDestination(id: StudyTrackId): TrackDestination | null {
  // ⛔ `switch` ו⛔ לא שדה ב-`STUDY_TRACKS`: הרשימה ההיא היא סדר התצוגה של
  // `36 § 9`, והוספת נתיב אליה הייתה מערבבת מפרט-מסך עם ניתוב.
  switch (id) {
    case 'vocabulary':
      // `app/(tabs)/cards` — המסך שבו מילים נלמדות בפועל (`36 § 5`).
      return { href: '/cards', labelHe: 'כניסה לאוצר המילים' };
    case 'grammar':
    case 'reading':
    case 'writing':
      return null;
  }
}
