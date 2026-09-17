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
import { BAND_ORDER } from './cefrLevels';
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
  /**
   * T-405/T-406 · **מבנה מוצהר שההתקדמות בו עדיין ⛔ אינה נספרת** — ⛔ וזה ⛔ אינו
   * `'empty'` ו⛔ אינו `'unreachable'`. `הבנת הנקרא` קיבל כניסה אמיתית ב-`T-405`
   * (`36 § 9` סופר «12 סיפורים» תחת «תוכן קיים») ⇒ «אין עדיין פריטים (0 מתוך 0)»
   * הפך ל**שקר מדיד** שיושב מעל קישור חי. ⛔ ומספר התקדמות ⛔ אינו מומצא במקומו:
   * `36 § 9` ⛔ אינו נוקב יחידת מדד ל`הבנת הנקרא`, ⇒ המצב הזה **מצהיר** ש⛔ אין
   * ספירה, במקום להמציא אחת.
   */
  | { readonly kind: 'declared'; readonly summaryHe: string }
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
 * T-406ⓐ · `36 § 9` מילה במילה: «**טיפוס המודול ומדד ההתקדמות הם פרמטר של
 * המסלול, ⛔ לא הנחה**» — והדוגמאות שהוא נותן הן `18/40 מילים` · `4/9 נושאים` ·
 * `3 חיבורים שנבדקו`. ⇒ יחידת המדד לכל מסלול לקוחה **משם**, ⛔ ו«פריטים» גנרי
 * ⛔ אינו אחת מהן.
 *
 * 🔬 **מה זה מתקן, נמדד בהליכה חיה 375×780:** שני הפאנלים הדפיסו «אין עדיין
 * פריטים ב<X> (0 מתוך 0)» — משפט שאומר ללומד ש⛔ אין כלום, ו⛔ לא אומר לו **מה
 * יהיה שם**. המבנה הריק המוצהר של `36 § 9` הוא **הצהרה**, ⛔ ולא שקט.
 */
const EMPTY_TRACK_UNIT_HE: Readonly<Record<'grammar' | 'writing', string>> = Object.freeze({
  grammar: 'נושאים',
  writing: 'חיבורים שנבדקו',
});

/**
 * T-246ⓓ · D-176 §ד: «לדקדוק ולכתיבה אין תוכן» הוא משפט מפורש ב-`36 § 9`,
 * ⛔ לא הנחה שלי — ולכן `0 מתוך 0` כאן הוא קבוע, ⛔ לא תוצאת שאילתה שנכשלה.
 * **כשתתווסף סכמה לאחד משני המסלולים האלה, הפונקציה הזאת צריכה לזוז לקריאה
 * אמיתית** — הקבוע הזה תקף אך ורק כל עוד `36 § 9` עצמו אומר שאין תוכן.
 *
 * ⟦צומצם ב-`T-406` מ-`Exclude<StudyTrackId, 'vocabulary'>` לשני מזהים מפורשים:
 * ‏`reading` יצא מכאן ב-`T-405`, ⛔ והצמצום הוא מה שמונע ממנו לחזור בשקט.⟧
 */
export function emptyTrackMetric(
  id: 'grammar' | 'writing',
): Extract<TrackMetricState, { kind: 'empty' }> {
  // ⚠️ D-110 latitude, logged in the tick report: "—" is reserved for the
  // 'unreachable' state (D-046/D-082 — see UNREACHABLE_HE in StudiesScreen.tsx)
  // so a real "empty" string must never carry one. Parentheses instead; the
  // number stays real, and the UNIT is now the track's own (T-406ⓐ).
  return {
    kind: 'empty',
    summaryHe: `עדיין אין ${EMPTY_TRACK_UNIT_HE[id]} במסלול הזה (0 מתוך 0)`,
  };
}

/**
 * T-405/T-406 · `הבנת הנקרא`. ⛔ **אפס מספר מומצא:** `36 § 9` ⛔ אינו נוקב יחידת
 * מדד למסלול הזה (שלוש היחידות שהוא נותן הן `מילים` · `נושאים` ·
 * `חיבורים שנבדקו`), ⇒ ספירה כאן הייתה קביעה על הלומד ש⛔ לא נמדדה.
 * ⛔ **ו-`'empty'` ⛔ אינו נכון יותר:** מאז `T-405` הפאנל נושא כניסה חיה אל
 * שנים-עשר הסיפורים ש-`36 § 9` סופר תחת «תוכן קיים».
 */
export function readingTrackMetric(): Extract<TrackMetricState, { kind: 'declared' }> {
  return {
    kind: 'declared',
    summaryHe: 'ההתקדמות בסיפורים עדיין אינה נספרת. הכניסה למטה פותחת את הסיפורים הקיימים.',
  };
}

/**
 * ⛔ **נקודת הכניסה היחידה למדד של מסלול** — `<StudiesScreen>` החזיק את הענפים
 * האלה אצלו, ⇒ כל שינוי במדד חייב היה לעבור בשני קבצים. כאן זה טהור ונבדק בלי DOM.
 *
 * ‏`levels === null` פירושו «⛔ לא הצלחנו לטעון», ⛔ ולא «ריק» — וזה חל **רק** על
 * `אוצר מילים`, המסלול היחיד שיש לו קריאת רשת מאחוריו.
 */
export function trackMetric(
  id: StudyTrackId,
  levels: readonly LevelSummary[] | null,
): TrackMetricState {
  if (id === 'vocabulary') {
    return levels === null ? { kind: 'unreachable' } : vocabularyMetric(levels);
  }
  if (id === 'reading') return readingTrackMetric();
  return emptyTrackMetric(id);
}

/**
 * T-406ⓑ · `ui-ux-pro-max` · `ux` · Feedback / **Empty States** (Severity Medium):
 * «Do: Show helpful message **and action** · Don't: Blank empty screens».
 *
 * 🔬 **נמדד בהליכה חיה 375×780:** בפאנל של `דקדוק` ושל `כתיבה` ⛔ אין ולו פעולה
 * אחת — היציאה היחידה מהם היא סרגל הלשוניות. ⇒ הפונקציה הזאת מחזירה **את הדבר
 * האחד שאפשר לעשות עכשיו**: המסלול הראשון ברישום שיש לו יעד בנוי.
 *
 * ⛔ **ו⛔ אינה קישור למסך שאינו קיים:** היא נגזרת מ-`trackDestination` עצמה, ⇒
 * יעד שאינו קיים ⛔ אינו יכול להופיע כאן. מסלול שכבר יש לו יעד מקבל `null` —
 * ⛔ אין שתי פעולות באותו פאנל (`taste-skill § 4.5`, ⛔ אין כפילות כוונה).
 */
export function trackFallbackAction(id: StudyTrackId): TrackDestination | null {
  if (trackDestination(id) !== null) return null;
  for (const track of STUDY_TRACKS) {
    const dest = trackDestination(track.id);
    if (dest !== null) {
      return { href: dest.href, labelHe: `בינתיים אפשר להמשיך ב${trackLabelHe(track.id)}` };
    }
  }
  return null;
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
    const metric = trackMetric(track.id, levels);
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
    case 'reading':
      // T-405 · `app/(tabs)/world/story` — המסך **שכבר בנוי**, ונגיש מטבעת העולם
      // (`app/dev/world/ring/page.tsx` ⇒ `stories: { kind: 'open', href: '/world/story' }`).
      // ⛔ **⛔ ואין כאן תוכן חדש:** `36 § 9` סופר בעצמו «12 סיפורים» תחת «תוכן קיים»,
      // ⇒ הכניסה מפנה למה שהמסמך כבר מונה, ו-R-010 ⛔ אינו נוגע בשורה.
      return { href: '/world/story', labelHe: 'כניסה לסיפורים' };
    case 'grammar':
    case 'writing':
      // ⛔ `36 § 9` אומר במפורש שלשני אלה ⛔ אין תוכן, ו⛔ אסור לייצר תוכן כדי
      // למלא אותם (R-010) ⇒ `null` הוא מצב אמיתי כאן, ⛔ ולא פער שנשכח. מה
      // שהפאנל עושה במקום קישור הוא `T-406`, ⛔ ולא קישור למסך שאינו קיים.
      return null;
  }
}

/**
 * T-407 · **המודולים של מסלול** — הפריטים שהנתיב האנכי ב-
 * `docs/design/kol-A-04-learning.png` מצייר מתחת לשורת השבבים
 * (`render_video_A.py:1205-1264`, `screen_hub`).
 *
 * ⛔ **אפס תוכן חדש (R-010):** המודולים של `אוצר מילים` **נגזרים** משש הרמות
 * ש-`GET /api/levels/summary` כבר מחזיר — אותו מערך שהפאנל כבר מחזיק — ⇒ אין
 * כאן ולו שם מודול אחד שנכתב ביד. `36 § 9` מונה את התוכן הקיים בדיוק כך:
 * «אוצר מילים A1 316 · A2 125 · B1 96 · B2 85».
 *
 * 🔴 **⛔ ואין כאן נעילה בין רמות, ובכוונה — `R-017` · `D-037`.** הרנדר מצייר
 * למודולים הגבוהים «ייפתח אחרי A1» ו«נעול», כלומר שער בין רמות; `plan/20-alerts.md`
 * ‏`R-017` אוסר זאת מילה במילה: «⛔ אין שער אחוזים ו⛔ אין נעילה בין רמות… המוצר
 * מציג לו **ספירה עובדתית** ⛔ ולעולם לא הערכת מוכנות». ⇒ המצב השלישי כאן הוא
 * **היעדר תוכן** (`'empty'` — רמה שאין בה מילים), ⛔ ולא היעדר רשות, והמצב הרביעי
 * הוא `'open'` — יש תוכן ו⛔ טרם התחלת. ⇒ **כל רמה שיש בה מילים פתוחה ללומד.**
 * ⟨הפער בין הרנדר לכלל נרשם כממצא בטיק הזה, ⛔ ולא כסטייה שקטה — `36 § 14.4`.⟩
 */
export type StudyModuleState = 'done' | 'current' | 'open' | 'empty';

export interface StudyModule {
  readonly id: string;
  readonly titleHe: string;
  /** ⛔ הערוץ השני של המצב — `36 § 12.7` אוסר מצב שמקודד בצבע בלבד. */
  readonly stateLabelHe: string;
  readonly summaryHe: string;
  readonly state: StudyModuleState;
  /** ‏0..1, ⛔ ורק ל-`'current'`: הרנדר מצייר פס התקדמות אך ורק על המודול הפעיל. */
  readonly progress: number | null;
}

const MODULE_STATE_LABEL_HE: Readonly<Record<StudyModuleState, string>> = Object.freeze({
  done: 'הושלם',
  current: 'בתהליך',
  open: 'טרם התחלת',
  empty: 'אין עדיין מילים',
});

export function moduleStateLabelHe(state: StudyModuleState): string {
  return MODULE_STATE_LABEL_HE[state];
}

/**
 * ⛔ **ארבעת הענפים הם ספירה, ⛔ ולא שיפוט.** `known >= totalInLevel` היא עובדה
 * על השורות שהלומד סימן, ⛔ ולא «הוא שולט ברמה» (`R-017` · § 4.4.3).
 */
function vocabularyModuleState(level: LevelSummary): StudyModuleState {
  if (level.totalInLevel === 0) return 'empty';
  if (level.known >= level.totalInLevel) return 'done';
  return level.known > 0 ? 'current' : 'open';
}

/**
 * ⛔ **`levels === null` פירושו «⛔ לא הצלחנו לטעון»** ⇒ ⛔ אין נתיב, ⛔ ולא נתיב
 * ריק: רשימה ריקה הייתה אומרת ללומד «אין לך מודולים», וזה בדיוק ההבדל
 * בין `'empty'` ל-`'unreachable'` שכבר נשמר למעלה (D-046/D-082).
 *
 * ⛔ **ולשלושת המסלולים בלי תוכן ⛔ אין כאן רשימה** — `36 § 9`: «לדקדוק, כתיבה
 * והבנת הנקרא ⛔ אין תוכן. מוצגים כמבנה ריק מוצהר» ⇒ הפאנל שלהם ממשיך להציג את
 * ההצהרה ואת הפעולה של `T-406`, ⛔ ולא רשימה ריקה בלי הסבר (‏`T-407`ⓒ).
 */
export function trackModules(
  id: StudyTrackId,
  levels: readonly LevelSummary[] | null,
): readonly StudyModule[] {
  if (id !== 'vocabulary' || levels === null) return [];
  const ordered = [...levels].sort(
    (a, b) => BAND_ORDER.indexOf(a.level) - BAND_ORDER.indexOf(b.level),
  );
  return ordered.map((level) => {
    const state = vocabularyModuleState(level);
    return {
      id: level.level,
      titleHe: `רמה ${level.level}`,
      state,
      stateLabelHe: MODULE_STATE_LABEL_HE[state],
      summaryHe:
        state === 'empty'
          ? '0 מתוך 0 מילים במאגר'
          : `${level.known} מתוך ${level.totalInLevel} מילים ידועות`,
      progress: state === 'current' ? level.known / level.totalInLevel : null,
    };
  });
}

/**
 * T-408 · **הפריט שנפתח מתוך כרטיס מודול, והדרך חזרה ממנו.** `D-065` («שלושה מסכי
 * כשל בלי יציאה») חל כאן במלואו: פריט שנפתח מהנתיב חייב להחזיר **לנתיב**, ובמקום
 * שממנו יצא — ⛔ ולא לראש הרשימה ו⛔ לא למסך אחר.
 *
 * ⛔ **אפס מסך לימוד חדש (`T-408` מילה במילה):** הפריט של `אוצר מילים` הוא
 * `/study?deck=level` — חפיסה ש**כבר בנויה** — והשורה הזאת רק **מחברת** אליה את
 * כרטיס המודול ומחזירה ממנה.
 *
 * 🔴 **ולמה `band` בכתובת, ו⛔ לא בלעדיו:** ‏`GET /api/study/queue?deck=level` גוזרת
 * את הרמה מ-`profiles.current_level` בלבד ⇒ כרטיס שכתוב עליו «רמה B1» היה פותח את
 * חפיסת הרמה של הלומד. זה **שקר מדיד** על המסך, ⛔ ולא אי-דיוק: המודול מצהיר רמה,
 * והחפיסה מציגה אחרת. ⇒ הכתובת נושאת את הרמה של המודול עצמו.
 * ⛔ **ו⛔ אין כאן נעילה** (`R-017` · `D-037`): כל מודול שיש בו מילים נפתח, ⛔ בלי
 * שער אחוזים ו⛔ בלי סדר כפוי. המודול היחיד שאינו נפתח הוא `'empty'` — רמה שאין בה
 * מילים — ⇒ **היעדר תוכן, ⛔ ולא היעדר רשות.**
 */
const MODULE_ANCHOR_PREFIX = 'studies-module-';
/** ⛔ סגור בכוונה: כל תו אחר בזהות מודול הוא כתובת שלא אנחנו בנינו. */
const MODULE_ID_SHAPE = /^[A-Za-z0-9-]{1,24}$/;

/** הזהות של כרטיס המודול ב-DOM — היעד שאליו החזרה נוחתת. */
export function moduleAnchorId(trackId: StudyTrackId, moduleId: string): string {
  return `${MODULE_ANCHOR_PREFIX}${trackId}-${moduleId}`;
}

export interface ModuleAnchor {
  readonly trackId: StudyTrackId;
  readonly moduleId: string;
}

/**
 * ⛔ **שער, ⛔ ולא פענוח.** הערך מגיע מכתובת שהלומד יכול לערוך, והיחיד שעושים בו
 * שימוש הוא בנייה של `/studies#<עוגן>` ⇒ ערך שאינו עוגן מודול תקין מוחזר כ-`null`,
 * והמסך נופל חזרה ליציאה הקבועה שלו. ⛔ אפס הפניה לכתובת חיצונית.
 */
export function parseModuleAnchor(value: string | null | undefined): ModuleAnchor | null {
  if (typeof value !== 'string') return null;
  const raw = value.startsWith('#') ? value.slice(1) : value;
  if (!raw.startsWith(MODULE_ANCHOR_PREFIX)) return null;
  const rest = raw.slice(MODULE_ANCHOR_PREFIX.length);
  for (const track of STUDY_TRACKS) {
    const prefix = `${track.id}-`;
    if (!rest.startsWith(prefix)) continue;
    const moduleId = rest.slice(prefix.length);
    if (!MODULE_ID_SHAPE.test(moduleId)) return null;
    return { trackId: track.id, moduleId };
  }
  return null;
}

/**
 * הכתובת שכרטיס המודול פותח. `null` הוא מצב תקין ו⛔ לא פער: מודול `'empty'` —
 * רמה שאין בה מילים — ⛔ אין לו מה לפתוח, ושלושת המסלולים בלי תוכן ⛔ אין להם
 * מודולים מלכתחילה (`trackModules` מחזירה להם רשימה ריקה).
 */
export function moduleItemHref(trackId: StudyTrackId, module: StudyModule): string | null {
  if (trackId !== 'vocabulary') return null;
  if (module.state === 'empty') return null;
  const params = new URLSearchParams({
    deck: 'level',
    // ⛔ `module.id` **הוא** הרמה — `trackModules` בונה אותו כ-`level.level`, וזה
    // נעוץ בבדיקה בקובץ הבדיקות לצד השורה הזאת.
    band: module.id,
    return: moduleAnchorId(trackId, module.id),
  });
  return `/study?${params.toString()}`;
}

/** ⛔ «חזרה לכרטיסיות» ⛔ אינו נכון כאן: הלומד הגיע מהנתיב, ⛔ ולא ממפת הרמות. */
export const MODULE_RETURN_LABEL_HE = 'חזרה למסלול';

/**
 * היעד שאליו הפריט מחזיר — **הנתיב, על העוגן שממנו יצא** (`T-408`ⓑ+ⓒ). ⛔ נבנה
 * מתוך `parseModuleAnchor` בלבד ⇒ ⛔ אי-אפשר להזריק לכאן כתובת.
 */
export function moduleReturnDestination(rawAnchor: string | null | undefined): TrackDestination | null {
  const anchor = parseModuleAnchor(rawAnchor);
  if (anchor === null) return null;
  return {
    href: `/studies#${moduleAnchorId(anchor.trackId, anchor.moduleId)}`,
    labelHe: MODULE_RETURN_LABEL_HE,
  };
}
