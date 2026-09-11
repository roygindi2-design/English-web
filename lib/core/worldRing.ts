/**
 * טבעת `העולם` — המודל הטהור (T-204 · D-117 · D-118 · `36 § 6`).
 *
 * ⛔ **המודול ⛔ אינו יודע דבר על React, על DOM, על HTTP, על `env` ועל השעון.**
 * הוא מקבל את מצבם של ארבעת הצמתים שמגיעים מהחוט, ומחזיר **הכרעת מסך אחת**:
 * טבעת של תשעה צמתים, או מצב ריק אחד עם פעולה אחת.
 *
 * ארבע ההכרעות כאן הן חוקי המשימה ⛔ ולא טעם:
 *
 * 1. **תשעה צמתים בסדר של `36 § 6`** ⟦עודכן 03/09 · `D-182` · `T-252` — מ-8
 *    ל-9, `אמירנט` נכנס מיד אחרי `הודעות`⟧ — `זירת קרב` · `הודעות` · `אמירנט` ·
 *    `סיפורים` · `כתיבה חופשית` · `משפטים` · `אוצר מילים` · `מובילים` · `חברים`.
 *    הסדר ⛔ **אינו פדגוגי**, ו⛔ **אין «צומת גדול»**: `featuredAppId` הוא של הרשת
 *    הישנה ⛔ ואינו נכנס לכאן (§ 4.2יט הכרעה 3 · F-084 מתה עם הרשת).
 *
 * 2. **הגאומטריה יוצאת כנתון** (§ 4.2יט הכרעה 2): `RING_RADIUS` ו-`RING_ANGLE_DEG`
 *    מיוצאים כמספרים, ו-`ringPoint` מחשב את המיקום. ⇒ הטבעת נבדקת **בלי DOM**,
 *    והמסך ⛔ אינו מחשב זווית בתוך JSX.
 *
 * 3. **שלוש מחלקות נעילה, ⛔ ולא אחת** (D-118). `locked_count` נושא **ספרה**
 *    (D-046 חלה, ושני המספרים מהשרת); `locked_infra` הוא משפט **בלי מספר ובלי
 *    תאריך** — D-046 ⛔ **אינה** חלה עליו, ונאכף ההפך, כי «תשתית שלא נבנתה»
 *    ⛔ אין לה מספר, והמצאת מספר היא R-010.
 *
 * 4. **`unknown` הוא מצב של מסך ⛔ ולא של צומת** (D-118 · T-148 · T-146ⓑ).
 *    ראה את ההערה מעל `ringScreen` — שם זה נאכף, ⛔ ולא בתקווה.
 *
 * 5. **המצב הריק נושא **יציאה**, ⛔ ולא «נסה שוב» קבוע** (T-146ⓒ · D-065). ראה
 *    את ההערה מעל `emptyScreen`.
 *
 * ⛔ אפס מדדי משחק מסוג D-050: ⛔ אין ניקוד, ⛔ אין מטבע, ⛔ אין רצף, ⛔ אין לוח.
 */
import { RETRY_HE } from './failure';
import { failureExit, isRetryable, type FailureCode } from './failureExit';

export type RingNodeId =
  | 'arena'
  | 'msgs'
  | 'amirnet'
  | 'stories'
  | 'compose'
  | 'sentences'
  | 'vocab'
  | 'leaders'
  | 'friends';

export type RingNodeState =
  /** יש יעד **וגם** התנאי מתקיים. */
  | { readonly kind: 'open'; readonly href: string }
  /** יש יעד, התנאי ⛔ לא מתקיים — **D-046 חלה**: ב-`noteHe` **חייבת** להיות ספרה. */
  | { readonly kind: 'locked_count'; readonly noteHe: string }
  /** ⛔ אין יעד — התשתית לא נבנתה. ⛔ D-046 ⛔ אינה חלה; נאכף ההפך. */
  | { readonly kind: 'locked_infra'; readonly noteHe: string }
  /** הקריאה נכשלה. ⛔ ⛔ לעולם ⛔ אינו מצויר על צומת — ראה `ringScreen`. */
  | { readonly kind: 'unknown' };

export interface RingNode {
  readonly id: RingNodeId;
  readonly labelHe: string;
  readonly state: RingNodeState;
}

/**
 * `36 § 6` כלשונו ובסדרו. ⛔ ⛔ אינו סדר פדגוגי, ⛔ ואין בו צומת גדול.
 * ⟦עודכן 03/09 · `D-182` · `T-252`⟧ `amirnet` נכנס **באינדקס 2**, מיד אחרי
 * `msgs` — `36 § 6` שונה מ-«שמונה» ל-«תשעה» ב-28/08 (`41-amirnet-spec`), וזה
 * המקום הראשון שהיישור נסגר: הקוד יושר למפרט, ⛔ ולא להפך.
 */
/** T-191 — the inbox the `הודעות` node opens onto. */
export const MESSAGES_HREF = '/world/messages';

export const RING_ORDER: readonly RingNodeId[] = [
  'arena',
  'msgs',
  'amirnet',
  'stories',
  'compose',
  'sentences',
  'vocab',
  'leaders',
  'friends',
];

export const RING_LABEL_HE: Readonly<Record<RingNodeId, string>> = {
  arena: 'זירת קרב',
  msgs: 'הודעות',
  amirnet: 'אמירנט',
  stories: 'סיפורים',
  compose: 'כתיבה חופשית',
  sentences: 'משפטים',
  vocab: 'אוצר מילים',
  leaders: 'מובילים',
  friends: 'חברים',
};

/**
 * `36 § 6` נוקב ב-r=108. הזוויות נקראו מ-`docs/design/kol-world-ring.png`
 * ⛔ ולא הומצאו: `זירת קרב` **למעלה**, ומשם **עם כיוון השעון** — `הודעות`
 * מימין־מעלה, `אמירנט` מימין, `סיפורים` מימין־מטה, `משפטים` למטה, `מובילים`
 * משמאל. מוסכמה: 0° = ימין, נגד כיוון השעון חיובי, ציר y של המסך יורד.
 * ⟦עודכן 03/09 · `D-182` · `T-252`⟧ תשעה צמתים ⇒ **40° בין כל שניים סמוכים**
 * (היה 45° בשמונה) — נגזר מ-360/9 ואומת מול `docs/design/kol-D-01-world.png`
 * (נמדד שם 39.0°–41.3°, סטייה מרבית 1.3° מ-40° — רעש מדידת פיקסלים, ⛔ ולא
 * אי-אחידות אמיתית). `זירת קרב` נשארת עוגן ב-90°, וכל שאר הזוויות יורדות
 * ב-40° בכל צעד עם כיוון השעון, בדיוק כמו קודם עם 45°.
 */
export const RING_RADIUS = 108;
export const RING_ANGLE_DEG: Readonly<Record<RingNodeId, number>> = {
  arena: 90,
  msgs: 50,
  amirnet: 10,
  stories: -30,
  compose: -70,
  sentences: -110,
  vocab: -150,
  leaders: 170,
  friends: 130,
};

export interface RingPoint {
  readonly x: number;
  readonly y: number;
}

/** ⛔ המסך ⛔ **אינו** מחשב את זה — זה מה שהופך את הטבעת לנבדקת בלי DOM. */
export function ringPoint(id: RingNodeId, radius: number = RING_RADIUS): RingPoint {
  const rad = (RING_ANGLE_DEG[id] * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: -radius * Math.sin(rad) };
}

export type RingScreen =
  | { readonly kind: 'ring'; readonly nodes: readonly RingNode[] }
  | {
      readonly kind: 'empty';
      readonly messageHe: string;
      /** ⛔ **פעולה אחת** (T-146ⓐ), והיא **יציאה** (T-146ⓒ) — ⛔ לא תמיד ניסיון חוזר. */
      readonly actionHref: string;
      readonly actionLabelHe: string;
    };

/** ארבעת הצמתים שמצבם מגיע מהחוט. חמשת האחרים הם ⛔ קבועים. */
export interface RingInputs {
  readonly arena: RingNodeState;
  readonly stories: RingNodeState;
  readonly compose: RingNodeState;
  readonly vocab: RingNodeState;
}

/**
 * ⛔ ארבעת צמתי `locked_infra`, **וזו הרשימה כולה** (D-118 · T-204ⓔ).
 * ⟦עודכן C-0518 · `T-191`⟧ `msgs` ⇢ `open` (`/world/messages`) — תיבת הסימולציות
 * נבנתה, ושלושת תנאי `D-074` נענו: שורת `T-190`, שורת `D-054`, והמסך עצמו.
 * ⟦עודכן 03/09 · `D-182` · `T-252`⟧ `amirnet` נוסף — `locked_infra` ⛔ ולא
 * `locked_count` (`D-118` מחלקה 3): `41 § 8` שלב 1 (סכמת פריטים · תפריט ·
 * מנוע תרגול · `T-222`/`T-223`/`T-224`) ⛔ טרם נבנה, ⇒ ⛔ אין ספרה בנוסח.
 * ⛔ ⛔ אין בהם מספר ו⛔ אין בהם תאריך — הבדיקה אוכפת את ההיפך של D-046.
 * ⛔ מעבר של צומת מכאן ל-`open` הוא **משימה**, ⛔ ולא דגל.
 */
const INFRA_NOTE_HE: Readonly<
  Record<'amirnet' | 'sentences' | 'leaders' | 'friends', string>
> = {
  amirnet: 'אמירנט ייפתח כשמנוע התרגול שלו ייבנה.',
  sentences: 'המשפטים ייפתחו כשמאגר המשפטים ייבנה.',
  leaders: 'המובילים ייפתחו כשחשבונות המשתמשים יחוברו.',
  friends: 'החברים ייפתחו כשחשבונות המשתמשים יחוברו.',
};

const ALL_UNKNOWN_HE = 'לא הצלחנו לטעון את העולם.';

const LIVE_IDS = ['arena', 'stories', 'compose', 'vocab'] as const;

/**
 * ⛔ **T-146ⓒ · D-065 — «⛔ אין מסך כשל בלי יציאה».** שלושת ענפי המצב הריק
 * עוברים דרך כאן, ולכן ⛔ אין ענף שנשאר מאחור: זו בדיוק המוטציה שהבדיקה הורגת.
 *
 * ⛔ **הטבלה ⛔ אינה נכתבת כאן שנית** — `lib/core/failureExit.ts` היא המקום
 * היחיד שבו «לאן אפשר ללכת מכאן» מוכרע, ⛔ והמסך הזה הוא הצרכן החמישי שלה.
 * ⇒ `session_expired` ⇒ `/login` · `schema_missing` ⇒ ניווט ללשונית שכן עובדת ·
 * `unavailable` ⇒ «נסה שוב» אל `retryHref`, כי היא **התקלה החולפת היחידה**.
 *
 * ⚠️ **ופעולה אחת ⛔ ולא שתיים:** `LevelMapScreen` מצייר על `unavailable` גם
 * ניסיון חוזר וגם יציאה, וזה חוקי שם. כאן T-146ⓐ נמדדה בשם על **המסך הזה**
 * («בדיוק אחד «נסה שוב»»), ולכן הענף החולף נושא את הניסיון החוזר **במקום**
 * היציאה, ⛔ ולא לצדה.
 */
function emptyScreen(code: FailureCode, retryHref: string): RingScreen {
  if (isRetryable(code)) {
    return {
      kind: 'empty',
      messageHe: ALL_UNKNOWN_HE,
      actionHref: retryHref,
      actionLabelHe: RETRY_HE,
    };
  }
  const exit = failureExit(code);
  return {
    kind: 'empty',
    messageHe: ALL_UNKNOWN_HE,
    actionHref: exit.href,
    actionLabelHe: exit.labelHe,
  };
}

/**
 * הכרעת המסך. ⛔ **שלושה ענפים מובילים למצב הריק, ⛔ ולא אחד**, וזו ⛔ אינה
 * הקשחה סתם — היא מה שהופך את T-146 ואת T-148 ל**מבנה** במקום לכוונה:
 *
 * ⓐ `inputs === null` — ⛔ שום קריאה לא ענתה.
 *
 * ⓑ **⛔ ולו קלט חי אחד הוא `unknown`** — ⚠️ **סטייה מוצהרת מקוד התוכנית, וסיבתה
 *    מדידה ⛔ ולא טעם.** התוכנית (`2026-08-26-nav-ring-slice-a.md` § 2) מעבירה
 *    את הקלטים כמות שהם ובודקת `anyOpen` בלבד ⇒ קלט `unknown` **שורד אל צומת**
 *    ברגע שצומת אחר פתוח, והמסך נאלץ לצייר לו משהו — כלומר «—», שהיא בדיוק
 *    המחרוזת ש-T-148ⓑ אוסרת **בשם**, ובדיוק «שגיאה **וגם** תוכן» ש-T-146ⓑ
 *    אוסרת. ⚠️ ובפועל זה גרוע יותר: `כתיבה חופשית` ו`אוצר מילים` הם `open`
 *    קבוע (כמו ברשת — `worldApps.ts`), ולכן `anyOpen` **אמת תמיד** ⇒ הענף
 *    היחיד שנשאר לתוכנית הוא ⓐ, והמצב הריק שהיא מתיימרת לספק הוא **קוד מת
 *    ביום שנולד** — מחלקת הפגם של F-074. ⇒ הכלל כאן הוא הכלל שהמשימות כותבות:
 *    ⛔ **`unknown` הוא מצב של מסך**, ולכן ⛔ אינו רשאי לצאת מכאן על צומת.
 *
 * ⓒ ⛔ **אף צומת מונע-חוט (`LIVE_IDS`) ⛔ אינו `open`** — D-064 כלשונה: אריח מושבת
 *    ⛔ אינו חוקי כשכל האריחים מושבתים.
 *    ⚠️ ⟦הוצמד ל-`LIVE_IDS` ב-C-0518 · `T-191`⟧ — ⛔ **וזו ⛔ אינה הרחבה של D-064, היא
 *    שימורה.** ‏`msgs` הפך ל-`open` **קבוע** בטיק הזה, ובניסוח הקודם («⛔ אף צומת»)
 *    הענף הזה ⛔ היה מת ביום שנולד — בדיוק מחלקת `F-074` שהערה ⓑ למעלה נכתבה נגדה,
 *    ונמדד: שתי בדיקות חיות (‏«כל צומת נעול ⇒ ריק» ו«`session_expired` ⇒ `/login`»)
 *    האדימו על השינוי. ⇒ הצמתים שמצבם **מגיע מהחוט** הם מה ש-D-064 מדדה מלכתחילה:
 *    לומד שהתקדמותו ⛔ לא פתחה דבר מקבל מסך ריק **עם מוצא**, ⛔ ולא קיר של מנעולים.
 *    🔴 **וזו הכרעת ניווט שאינה שלי** — ⛔ נפתח ממצא כדי ש-PM/QA יכריעו אם צומת
 *    `open` קבוע ראוי לבטל את המסך הריק. עד אז ההתנהגות הנמדדת ⛔ לא השתנתה.
 *
 * ⇒ אחרי שלושת הענפים, **טיפוס `unknown` ⛔ אינו נגיש** על אף צומת של טבעת
 * מצוירת, והבדיקה מודדת זאת ⛔ ולא מניחה.
 */
export function ringScreen(
  inputs: RingInputs | null,
  retryHref: string,
  code: FailureCode,
): RingScreen {
  if (inputs === null) {
    return emptyScreen(code, retryHref);
  }
  if (LIVE_IDS.some((id) => inputs[id].kind === 'unknown')) {
    return emptyScreen(code, retryHref);
  }
  const live: Readonly<Record<RingNodeId, RingNodeState>> = {
    arena: inputs.arena,
    stories: inputs.stories,
    compose: inputs.compose,
    vocab: inputs.vocab,
    msgs: { kind: 'open', href: MESSAGES_HREF },
    amirnet: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.amirnet },
    sentences: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.sentences },
    leaders: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.leaders },
    friends: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.friends },
  };
  const nodes: readonly RingNode[] = RING_ORDER.map((id) => ({
    id,
    labelHe: RING_LABEL_HE[id],
    state: live[id],
  }));
  if (!LIVE_IDS.some((id) => live[id].kind === 'open')) {
    return emptyScreen(code, retryHref);
  }
  return { kind: 'ring', nodes };
}
