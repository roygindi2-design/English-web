/**
 * שער הסיפור — השכבה הטהורה של «סיפור אחד ביום» (T-134ⓑ · § 4.2יג · D-073).
 *
 * ⛔ טהור: אפס React · DOM · רשת · שעון · env. הקובץ ⛔ אינו יודע מאין באה קבוצת
 * הלמות המורשות — הקורא בונה אותה (`scripts/build-stories-sql.mjs`), וזה בדיוק
 * התקדים של `GateOptions.allowedWords` ב-`lib/core/contentSchema.ts`.
 *
 * ⛔ **הכיוון הוא הפחתה, ⛔ ולא הרחבה, וזה כל ההבדל מ-F-020.** `inflections()`
 * הרחיבה למה לצורות ובדרך ייצרה מילים אמיתיות אחרות (`car`+`d`=`card`) — false
 * accept. כאן הטוקן **מוּפחת** ללמה, והלמה חייבת להימצא בקבוצה. `card` ⛔ אינו
 * נחתך ל-`car`, כי ⛔ אין כלל סיומת `-d`.
 *
 * ⛔ **צורות חריגות יושבות במפה סגורה** — `is` ⛔ אינו נגיש לשום כלל סיומת, וגם
 * ⛔ אינו למה בבנק. המפה ממפה **צורה ללמה בלבד**: אם הלמה אינה בקבוצה, הטוקן
 * נפסל. התקדים הוא `CONTRACTION_STEMS` באותו פרויקט, ⛔ ולא המצאה חדשה.
 *
 * ⛔ **מה שהשער ⛔ אינו יודע לבדוק, ו⛔ אינו מתיימר:** נושא רגיש (T-135ⓓ) וטענה
 * על העולם שאין בה ספרה. שני אלה חיים ב-`docs/content-stories-brief.md` ובעין
 * אנושית, ⛔ ולא בטענה חלולה כאן.
 */
import { BAND_ORDER, type CefrBand } from './cefrLevels';

export const STORY_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
export type StoryLevel = (typeof STORY_LEVELS)[number];

/** D-073 מילה במילה: «12 להתחלה: 3 בכל רמה». ⛔ לא פרמטר כוונון. */
export const STORIES_PER_LEVEL = 3;
/** T-135ⓐ: 90–150 מילים לסיפור. ⛔ שני המספרים חיים כאן בלבד. */
export const STORY_MIN_WORDS = 90;
export const STORY_MAX_WORDS = 150;
/** T-135ⓔ: כותרת עד 6 מילים. */
export const STORY_TITLE_MAX_WORDS = 6;

export interface StoryRecord {
  readonly level: StoryLevel;
  readonly titleEn: string;
  readonly bodyEn: string;
}

export interface BankLemma {
  readonly lemma: string;
  readonly band: CefrBand;
}

export type StoryGateReason =
  | 'unknown_words'
  | 'too_short'
  | 'too_long'
  | 'title_too_long'
  | 'digit_in_text';

export interface StoryGateResult {
  readonly ok: boolean;
  readonly unknownWords: readonly string[];
  readonly wordCount: number;
  readonly reasons: readonly StoryGateReason[];
}

/** ⛔ למה נמוכה או שווה, ⛔ ולא «באותה רמה»: לומד B1 קורא גם A1. */
export function allowedLemmasAtOrBelow(
  level: StoryLevel,
  bank: readonly BankLemma[],
): Set<string> {
  const ceiling = BAND_ORDER.indexOf(level);
  const out = new Set<string>();
  for (const w of bank) {
    const at = BAND_ORDER.indexOf(w.band);
    if (at >= 0 && at <= ceiling) out.add(w.lemma.toLowerCase());
  }
  return out;
}

/** מראה את `tokens()` של `contentSchema.ts` — ⛔ מועתק ולא מיובא: הוא פרטי שם,
 *  והייצוא שלו היה מרחיב את שטח ה-API של קובץ שאינו נוגע לסיפורים. */
const tokensOf = (s: string): string[] => s.toLowerCase().match(/[a-z']+/g) ?? [];

const CONTRACTION_STEMS: Readonly<Record<string, string>> = { wo: 'will', ca: 'can', sha: 'shall' };

/** מסיר גרשיים חיצוניים וקליטיקות, כך ש-"wasn't" נבדק כ-was ו-"teacher's" כ-teacher. */
function normalizeToken(token: string): string {
  let t = token.replace(/^'+|'+$/g, '');
  if (t.endsWith("n't")) {
    const base = t.slice(0, -3);
    t = CONTRACTION_STEMS[base] ?? base;
  } else if (t.endsWith("'s")) {
    t = t.slice(0, -2);
  }
  return t;
}

/**
 * צורות חריגות של למות בתדירות גבוהה. **סגורה ומוצהרת** — ⛔ אין כאן ניחוש
 * מורפולוגי, ו⛔ אין כאן למה חדשה: הערך נבדק מול הקבוצה כמו כל למה אחרת.
 */
const IRREGULAR_LEMMA: Readonly<Record<string, string>> = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  does: 'do', did: 'do', done: 'do', doing: 'do',
  went: 'go', gone: 'go', said: 'say', saw: 'see', seen: 'see',
  made: 'make', took: 'take', taken: 'take', got: 'get', came: 'come',
  knew: 'know', known: 'know', thought: 'think', gave: 'give', given: 'give',
  found: 'find', told: 'tell', became: 'become', left: 'leave', felt: 'feel',
  meant: 'mean', kept: 'keep', began: 'begin', begun: 'begin', shown: 'show',
  heard: 'hear', ran: 'run', brought: 'bring', wrote: 'write', written: 'write',
  sat: 'sit', stood: 'stand', lost: 'lose', paid: 'pay', met: 'meet',
  held: 'hold', bought: 'buy', understood: 'understand', spoke: 'speak',
  spoken: 'speak', children: 'child', men: 'man', women: 'woman',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad',
};

/** סיומות רגולריות, מהארוכה לקצרה — «ies» חייב להיבדק לפני «s». */
const SUFFIXES: readonly (readonly [string, string])[] = [
  ['iest', 'y'], ['ies', 'y'], ['ied', 'y'], ['ier', 'y'], ['ily', 'y'],
  ['ing', ''], ['est', ''], ['ed', ''], ['er', ''], ['es', ''], ['ly', ''], ['s', ''],
];

/** ⛔ שארית של אות אחת אינה גזע אנגלי — הגבול הזה הוא שמונע `bed`→`b`. */
const MIN_STEM = 2;
const DOUBLED_CONSONANT = /([bcdfghjklmnpqrstvwxz])\1$/;

/**
 * הלמה של טוקן, או `null` אם ⛔ אין לו למה בקבוצה. הסדר הוא ההגדרה:
 * (1) הטוקן עצמו · (2) המפה החריגה · (3) הפחתת סיומת. מועמד ארוך לפני קצר
 * (`hope` לפני `hop`), כי הצורה השלמה היא ההשערה הסבירה יותר.
 */
export function storyLemma(token: string, allowed: ReadonlySet<string>): string | null {
  const t = normalizeToken(token);
  if (t === '') return null;
  if (allowed.has(t)) return t;

  const irregular = IRREGULAR_LEMMA[t];
  if (irregular !== undefined && allowed.has(irregular)) return irregular;

  for (const [suffix, replacement] of SUFFIXES) {
    if (!t.endsWith(suffix)) continue;
    const stem = t.slice(0, -suffix.length) + replacement;
    if (stem.length < MIN_STEM) continue;
    const candidates = [`${stem}e`, stem];
    const dedoubled = DOUBLED_CONSONANT.test(stem) ? stem.slice(0, -1) : null;
    if (dedoubled !== null) candidates.push(dedoubled);
    for (const cand of candidates) if (allowed.has(cand)) return cand;
  }
  return null;
}

const DIGIT = /[0-9]/;

export function storyGate(
  record: StoryRecord,
  opts: { readonly allowedLemmas: ReadonlySet<string> },
): StoryGateResult {
  const bodyTokens = tokensOf(record.bodyEn);
  const titleTokens = tokensOf(record.titleEn);
  const wordCount = bodyTokens.length;

  const unknown = new Set<string>();
  for (const token of [...titleTokens, ...bodyTokens]) {
    if (storyLemma(token, opts.allowedLemmas) === null) unknown.add(normalizeToken(token));
  }
  unknown.delete('');

  const reasons: StoryGateReason[] = [];
  if (unknown.size > 0) reasons.push('unknown_words');
  if (wordCount < STORY_MIN_WORDS) reasons.push('too_short');
  if (wordCount > STORY_MAX_WORDS) reasons.push('too_long');
  if (titleTokens.length > STORY_TITLE_MAX_WORDS) reasons.push('title_too_long');
  if (DIGIT.test(record.titleEn) || DIGIT.test(record.bodyEn)) reasons.push('digit_in_text');

  return {
    ok: reasons.length === 0,
    unknownWords: [...unknown].sort(),
    wordCount,
    reasons,
  };
}

const LEVELS = new Set<string>(STORY_LEVELS);

/** מראה את `parseBatchFile`: שורה פגומה היא **עצירה בשם**, ⛔ ולא דילוג שקט. */
export function parseStoryFile(text: string): StoryRecord[] {
  const out: StoryRecord[] = [];
  const lines = text.split('\n');
  for (const [i, line] of lines.entries()) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      throw new SyntaxError(`storyGate: line ${i + 1} is not JSON`);
    }
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new TypeError(`storyGate: line ${i + 1} is not an object`);
    }
    const r = raw as Record<string, unknown>;
    const level = r.level;
    if (typeof level !== 'string' || !LEVELS.has(level)) {
      throw new RangeError(`storyGate: line ${i + 1} has level "${String(level)}", not one of A1·A2·B1·B2`);
    }
    const titleEn = r.title_en;
    const bodyEn = r.body_en;
    if (typeof titleEn !== 'string' || titleEn.trim() === '') {
      throw new TypeError(`storyGate: line ${i + 1} has no title_en`);
    }
    if (typeof bodyEn !== 'string' || bodyEn.trim() === '') {
      throw new TypeError(`storyGate: line ${i + 1} has no body_en`);
    }
    out.push({ level: level as StoryLevel, titleEn, bodyEn });
  }
  return out;
}
