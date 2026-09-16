/**
 * `T-380` — **דוח שרשרת הסיפור, ⛔ טהור.**
 *
 * 🔑 **מה השורה הזאת מודדת, ו⛔ למה היא הייתה חייבת להיכתב:** יעד המחלקה `story`
 * נוקב במילים «הסיפור נסגר מקצה לקצה … **על נתונים אמיתיים**», ⛔ וכל שלוש-עשרה
 * מסכי ההליכה רצים על `app/dev/story/story-fixture.ts` ⇒ ⛔ אף שלב בשרשרת ⛔ לא נמדד
 * מעולם מול ה-API האמיתי. ‏`F-255` מדד את אותה מחלקה מהצד השני: שלושת הטאבים הפנימיים
 * הפנו ל-`/login?expired=1`, ו«עובר» ⛔ מעולם ⛔ לא נבדק מחוץ ל-`/dev/*`.
 *
 * ⛔ **ומה הוא ⛔ אינו:** ⛔ אינו שער ו⛔ אינו טענה. הוא **מחשבון** — מקבל את מה
 * שהנתיב האמיתי החזיר על כל סיפור, ומוציא מספר. **מספר מאכזב הוא התוצאה, ⛔ ולא
 * כישלון** (`D-120 § ב`) ⇒ ⛔ אין כאן `throw`, ⛔ אין `exit(1)` ו⛔ אין «נכשל».
 *
 * ⚠️ **טהור ⇒ הוא ⛔ אינו יודע מה זה רשת.** הדגימה נאספת ב-`scripts/probe-story-chain.mjs`
 * ונמסרת לכאן כנתון, בדיוק כמו כל `lib/core/**` אחר: ⛔ אפס React, ⛔ אפס `fetch`,
 * ⛔ אפס `process.env`.
 */

/** שלושת השלבים של `T-380`ⓑ, ⛔ בסדר שבו הלומד פוגש אותם. */
export type StoryChainStage = 'load' | 'tap' | 'question';

/**
 * ⛔ **המספר הוא חוזה, ⛔ ולא העדפה:** `36 § 7` ו-`lib/core/storyQuestion.ts` מגדירים
 * שאלה כ-**שלוש** תשובות. שתיים או ארבע ⛔ אינן «כמעט» — הן שאלה שהמסך ⛔ לא ידע
 * לצייר, ולכן הן ⛔ אינן נספרות כשלב שעבר.
 */
export const REQUIRED_ANSWERS = 3;

/** מה שהנתיב האמיתי החזיר על סיפור אחד. ⛔ כבר מעוכל, ⛔ ולא גוף HTTP. */
export interface StoryChainSample {
  readonly storyId: string;
  /** כמה מילים בגוף נושאות `gloss`. ⛔ 0 פירושו שהקשה ⛔ אינה אפשרית בסיפור הזה. */
  readonly glossCount: number;
  /** האם הקשה כתבה `attempts` וחזרה `ok`. ⛔ `undefined` = ⛔ לא נוסתה. */
  readonly tapOk?: boolean;
  /** כמה תשובות נשאה השאלה. **0 = ⛔ אין שאלה כלל**, ⛔ ולא «שאלה ריקה». */
  readonly answerCount: number;
}

export interface StoryChainReport {
  readonly stories: number;
  readonly withGlosses: number;
  readonly withTap: number;
  readonly withQuestion: number;
  /** סך ה-`gloss` על פני כל הסיפורים — ⛔ הקלט של הממוצע, ⛔ ולא הממוצע עצמו. */
  readonly glossTotal: number;
  /**
   * ⛔ **השלב הראשון שנשבר, ⛔ ולא רשימת כל מה שנשבר.** שרשרת נקראת לפי הסדר: מי
   * שהסיפור ⛔ לא נטען אצלו ⛔ אינו יכול להקיש, ולכן «הקשה נכשלה» עליו היא רעש.
   * `null` ⇒ שלושת השלבים עברו על **כל** הסיפורים שנדגמו.
   */
  readonly firstBreak: StoryChainStage | null;
}

/**
 * ⚠️ **דגימה ריקה היא `stories: 0`, ⛔ ולא שבר.** ⛔ «⛔ לא נמדד» ו«נמדד ויצא אפס»
 * הם שני דברים שונים לגמרי, ומי שמאחד אותם מדווח על מוצר שבור כשהסביבה היא זו
 * שחסרה — בדיוק מה ש-`F-262` מדד על הטעינה למסד החי.
 */
export function reportStoryChain(samples: readonly StoryChainSample[]): StoryChainReport {
  const withGlosses = samples.filter((s) => s.glossCount > 0).length;
  const withTap = samples.filter((s) => s.tapOk === true).length;
  const withQuestion = samples.filter((s) => s.answerCount === REQUIRED_ANSWERS).length;
  const glossTotal = samples.reduce((sum, s) => sum + s.glossCount, 0);

  return {
    stories: samples.length,
    withGlosses,
    withTap,
    withQuestion,
    glossTotal,
    firstBreak: firstBreakOf(samples, { withGlosses, withTap, withQuestion }),
  };
}

function firstBreakOf(
  samples: readonly StoryChainSample[],
  counts: { withGlosses: number; withTap: number; withQuestion: number },
): StoryChainStage | null {
  if (samples.length === 0) return null;
  if (counts.withGlosses < samples.length) return 'load';
  // ⛔ הקשה ש⛔ לא נוסתה ⛔ אינה הקשה שנכשלה: הסיפורים שבהם `tapOk === undefined`
  // ⛔ אינם נספרים כשבר, אחרת דגימה זולה הייתה מדווחת על פגם שאיש ⛔ לא מדד.
  const tried = samples.filter((s) => s.tapOk !== undefined).length;
  if (tried > 0 && counts.withTap < tried) return 'tap';
  if (counts.withQuestion < samples.length) return 'question';
  return null;
}

/**
 * שורת הסיכום שהסקריפט מדפיס. ⛔ בעברית, כמו כל מה שאדם בלופ הזה קורא.
 * ⛔ **⛔ ולא «עבר/נכשל»** — המספר הוא התוצר (`T-380`ⓒ).
 */
export function storyChainLineHe(report: StoryChainReport): string {
  if (report.stories === 0) return 'שרשרת הסיפור — ⛔ לא נדגם ולו סיפור אחד.';
  const head =
    `שרשרת הסיפור — ${report.stories} סיפורים: ` +
    `${report.withGlosses} עם מילים להקשה · ` +
    `${report.withTap} שהקשה בהם נכתבה · ` +
    `${report.withQuestion} עם שאלה בת ${REQUIRED_ANSWERS} תשובות`;
  return report.firstBreak === null
    ? `${head} ⇒ השרשרת שלמה.`
    : `${head} ⇒ נשברה ב-${STAGE_HE[report.firstBreak]}.`;
}

const STAGE_HE: Readonly<Record<StoryChainStage, string>> = {
  load: 'טעינת הסיפור',
  tap: 'הקשה על מילה',
  question: 'שאלת ההבנה',
};
