/**
 * PURE. ⛔ אפס React, DOM, שעון, env ורשת. § 4.2יב · D-051 — «משהו שמחכה ללומד כשהוא
 * חוזר מחר»: משפט שהוא עצמו כתב, ומילת היעד שלו חסרה.
 *
 * ⛔ שום דבר כאן אינו קורא, כותב או מפרש את מנוע החזרות. הכרטיס הזה ⛔ אינו חזרה,
 * ⛔ אינו מקדם מונה ו⛔ אינו נוגע בעמודות SM-2.
 *
 * ⛔ אין בקובץ `Math.random` ואין `Date.now()`: `nowMs` ו-`seed` נכנסים כפרמטרים,
 * בדיוק כמו ב-`lib/core/arcadeRound.ts`, כי הגרלה שאי-אפשר לשחזר היא כרטיס
 * שאי-אפשר לכתוב עליו בדיקה.
 *
 * ⚠️ הטוקניזציה מיובאת מ-`./world` ⛔ ואינה נכתבת שנית: `normaliseToken` ו-
 * `PUNCTUATION_TOKENS` הם אותה הגדרה בדיוק ש-`renderDraft` בנתה איתה את המשפט
 * וש-`producedWordCount` פירקה איתה. היום שבו הבנק ילמד סימן פיסוק שלישי הוא היום
 * שבו הקובץ הזה חייב לזוז איתו, וקופי-פייסט הוא החצי שלא היה זז.
 */
import { PUNCTUATION_TOKENS, normaliseToken } from './world';

export const RECALL_OPTION_COUNT = 4;

/** סדר הגילים שנבחר ב-§ 4.2יב: קודם ~3 ימים, אחריו ~7, אחריו ~1. */
export const RECALL_AGE_PREFERENCE_DAYS: readonly number[] = [3, 7, 1];

const DAY_MS = 86_400_000;

export interface RecallPost {
  readonly id: string;
  readonly bodyEn: string;
  /** ISO-8601 כפי שהדאטהבייס החזיר. ⛔ הפונקציה הטהורה אינה קוראת לשעון. */
  readonly createdAt: string;
}

/** מילה של הלומד: `word_progress` ⋈ `words`. `isFunctionWord` ו-`ngslRank` מהעמודות. */
export interface LearnerWord {
  readonly headword: string;
  readonly band: string | null;
  readonly ngslRank: number | null;
  readonly isFunctionWord: boolean;
}

export interface RecallSegment {
  readonly text: string;
  readonly isTarget: boolean;
}

export interface RecallCard {
  readonly postId: string;
  readonly bodyEn: string;
  /** מספר שלם, ⛔ לא תאריך. הנוסח נבנה במסך: «כתבת את זה לפני N ימים». */
  readonly daysAgo: number;
  readonly answer: string;
  /** ארבע, ⛔ ללא כפילות, כולל התשובה, בסדר דטרמיניסטי מ-`seed`. */
  readonly options: readonly string[];
  /** `segments.map(s => s.text).join('') === bodyEn` — בית-בבית. */
  readonly segments: readonly RecallSegment[];
}

/**
 * גיל בימים שלמים, **כלפי מטה** ⛔ ולא בעיגול: משפט בן 3 ימים ו-23 שעות נכתב לפני
 * שלושה ימים, ו«לפני ארבעה» היה שקר קטן על מסך שכל תפקידו לומר ללומד מה הוא עשה.
 * חותמת שאינה ניתנת לפענוח ⇒ `0`, כלומר «היום», והיום ⛔ אינו נבחר.
 */
export function ageInDays(createdAt: string, nowMs: number): number {
  const then = Date.parse(createdAt);
  if (!Number.isFinite(then) || !Number.isFinite(nowMs)) return 0;
  const elapsed = nowMs - then;
  if (elapsed <= 0) return 0;
  return Math.floor(elapsed / DAY_MS);
}

/** טוקן אחד של המשפט, עם המקום שבו הוא יושב בתוכו. */
interface SpannedToken {
  readonly word: string;
  readonly start: number;
  readonly end: number;
}

/**
 * פיצול על רווח לבן תוך שמירת ההיסטים, וקיצוץ סימני פיסוק **מהסוף בלבד** — בדיוק
 * הכלל של `producedWordCount`, כי `renderDraft` מצמיד את הסימן למילה שלפניו וזה
 * המקום היחיד שבו הוא יכול להיות. ⛔ אין קיצוץ כללי: «don't» ו-«well-known» הן
 * מילה מופקת אחת, וקיצוץ הסימנים שבתוכן היה ממזג שני headwords למונה אחד.
 */
function spannedTokens(bodyEn: string): SpannedToken[] {
  const out: SpannedToken[] = [];
  if (typeof bodyEn !== 'string') return out;
  const pattern = /\S+/g;
  let match = pattern.exec(bodyEn);
  while (match !== null) {
    const raw = match[0];
    const start = match.index;
    let end = start + raw.length;
    let word = normaliseToken(raw);
    while (word.length > 0 && PUNCTUATION_TOKENS.includes(word.slice(-1))) {
      word = word.slice(0, -1);
      end -= 1;
    }
    if (word !== '') out.push({ word, start, end });
    match = pattern.exec(bodyEn);
  }
  return out;
}

/** מילות הלומד שאינן מילות תפקוד, לפי headword מנורמל. ⛔ מילת תפקוד לעולם אינה פריט. */
function contentWords(words: readonly LearnerWord[]): Map<string, LearnerWord> {
  const byHeadword = new Map<string, LearnerWord>();
  for (const word of words) {
    if (word.isFunctionWord) continue;
    const headword = normaliseToken(word.headword ?? '');
    if (headword === '' || byHeadword.has(headword)) continue;
    byHeadword.set(headword, word);
  }
  return byHeadword;
}

/** נדיר יותר = `ngslRank` גבוה יותר. דירוג חסר הוא «לא ידוע עלינו» ⛔ ולא «הנדיר ביותר»,
 *  ולכן הוא מפסיד לכל דירוג קיים — והשוואת headword שוברת שוויון דטרמיניסטית. */
function rarerThan(a: LearnerWord, b: LearnerWord): boolean {
  const rankA = typeof a.ngslRank === 'number' && Number.isFinite(a.ngslRank) ? a.ngslRank : null;
  const rankB = typeof b.ngslRank === 'number' && Number.isFinite(b.ngslRank) ? b.ngslRank : null;
  if (rankA === null && rankB === null) return a.headword.localeCompare(b.headword) < 0;
  if (rankA === null) return false;
  if (rankB === null) return true;
  if (rankA !== rankB) return rankA > rankB;
  return a.headword.localeCompare(b.headword) < 0;
}

/**
 * המילה הנדירה ביותר לפי NGSL מבין מילות הלומד שמופיעות במשפט.
 * ⛔ ההתאמה היא **טוקן שלם** ולעולם לא `includes`: «car» ⛔ אינו מסופק על ידי «card»,
 * וזו בדיוק מחלקת הקבלה-השגויה של F-020.
 * `null` ⇒ אין במשפט הזה מה להסתיר, והמשפט **מדולג בשקט**.
 */
export function pickRecallTarget(
  bodyEn: string,
  words: readonly LearnerWord[],
): LearnerWord | null {
  const byHeadword = contentWords(words);
  let best: LearnerWord | null = null;
  for (const token of spannedTokens(bodyEn)) {
    const word = byHeadword.get(token.word);
    if (!word) continue;
    if (best === null || rarerThan(word, best)) best = word;
  }
  return best;
}

/** אותו LCG של `lib/core/arcadeRound.ts`: אותו seed ⇒ אותו סדר, בכל הרצה ובכל מכונה. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rnd: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    // ⛔ לא destructuring swap: `noUncheckedIndexedAccess` מטפס את האיבר ל-`T | undefined`
    // וההשמה ההדדית אינה מהדרת (נמדד ב-C-0178).
    const atI = out[i] as T;
    const atJ = out[j] as T;
    out[i] = atJ;
    out[j] = atI;
  }
  return out;
}

/** המרחק מכל גיל מועדף, בסדר — `[|d-3|, |d-7|, |d-1|]`. השוואה לקסיקוגרפית. */
function agePreferenceKey(daysAgo: number): number[] {
  return RECALL_AGE_PREFERENCE_DAYS.map((preferred) => Math.abs(daysAgo - preferred));
}

function compareKeys(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

/** המשפט מפוצל סביב המופע **הראשון** של מילת היעד. ⛔ בדיוק מקטע אחד הוא היעד,
 *  והחיבור חזרה הוא בית-בבית — המסך ⛔ אינו בונה משפט מחדש. */
function segmentsAround(bodyEn: string, headword: string): RecallSegment[] | null {
  const wanted = normaliseToken(headword);
  const hit = spannedTokens(bodyEn).find((token) => token.word === wanted);
  if (!hit) return null;
  const out: RecallSegment[] = [];
  if (hit.start > 0) out.push({ text: bodyEn.slice(0, hit.start), isTarget: false });
  out.push({ text: bodyEn.slice(hit.start, hit.end), isTarget: true });
  if (hit.end < bodyEn.length) out.push({ text: bodyEn.slice(hit.end), isTarget: false });
  return out;
}

/**
 * הכרטיס היחיד של היום, או `null` ⇒ `{ok:true, card:null}` ⛔ ולא 404: «אין מה
 * להיזכר בו היום» אינו שגיאה.
 *
 * הבחירה, ⛔ ובלי הגרלה ובלי שעון: משפט מהיום ⛔ אינו נבחר (הוא עדיין בזיכרון);
 * השאר ממוינים לפי `RECALL_AGE_PREFERENCE_DAYS`; ונלקח **הראשון** שיש בו מילת יעד.
 * פחות מארבע מילות תוכן ⇒ **דילוג שקט** ⛔ ולא כרטיס עם שתי אפשרויות: שתי אפשרויות
 * הן ניחוש של חצי-חצי, וזה ⛔ אינו היזכרות.
 */
export function buildRecallCard(input: {
  readonly posts: readonly RecallPost[];
  readonly words: readonly LearnerWord[];
  readonly nowMs: number;
  readonly seed: number;
}): RecallCard | null {
  const pool = [...contentWords(input.words).keys()];
  if (pool.length < RECALL_OPTION_COUNT) return null;

  const dated = input.posts
    .filter((post) => typeof post?.bodyEn === 'string' && post.bodyEn.trim() !== '')
    .map((post) => ({ post, daysAgo: ageInDays(post.createdAt, input.nowMs) }))
    .filter((entry) => entry.daysAgo > 0)
    .sort((a, b) => {
      const byAge = compareKeys(agePreferenceKey(a.daysAgo), agePreferenceKey(b.daysAgo));
      return byAge !== 0 ? byAge : a.post.id.localeCompare(b.post.id);
    });

  for (const entry of dated) {
    const target = pickRecallTarget(entry.post.bodyEn, input.words);
    if (target === null) continue;
    const answer = normaliseToken(target.headword);
    const segments = segmentsAround(entry.post.bodyEn, answer);
    if (segments === null) continue;

    const rnd = mulberry32(input.seed);
    const wrong = shuffle(
      pool.filter((headword) => headword !== answer),
      rnd,
    ).slice(0, RECALL_OPTION_COUNT - 1);
    if (wrong.length < RECALL_OPTION_COUNT - 1) continue;

    return {
      postId: entry.post.id,
      bodyEn: entry.post.bodyEn,
      daysAgo: entry.daysAgo,
      answer,
      options: shuffle([answer, ...wrong], rnd),
      segments,
    };
  }
  return null;
}
