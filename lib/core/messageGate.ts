/**
 * שער תיבת הסימולציות — החצי הטהור של T-193 (`39 § 9` · K-002).
 *
 * ⛔ טהור, על תבנית `storyGate`: אפס React · DOM · רשת · שעון · env, והקובץ ⛔ אינו
 * יודע מאין באות קבוצות ההיתר.
 *
 * ⚠️ **כלל השמות נכתב כאן מחדש ו⛔ אינו נירש מהסיפורים — T-193ⓒ מפורשות.**
 * `docs/content-stories-brief.md` אוסר **כל** שם פרטי, כי בסיפור שם הוא קישוט.
 * ⛔ **בהודעה שם השולח הוא דרישה מבנית** — הרנדר מראה `Tom` · `Sarah` · `Mr. Levi`,
 * ובלי שולח אין הודעה. ⇒ **שם מותר בשדה השולח בלבד, מרשימה סגורה, ⛔ ואסור בגוף.**
 * זו הסיבה שקיים `name_in_body` בנפרד מ-`unknown_words`: שם שדלף לגוף ⛔ אינו נתפס
 * כמילה לא-מוכרת, כי הוא **כן** ברשימה המותרת — פשוט לא שם.
 *
 * ⛔ **מה שהשער ⛔ אינו יודע לבדוק, ו⛔ אינו מתיימר:** נושא רגיש. T-193 אומר זאת
 * במילים שלו — «עין אנושית, ⛔ ואין שער» ⇒ ⛔ אין לטעון שיש.
 */
import type { StoryLevel } from './storyGate';
import { storyLemma } from './storyGate';

/** `39 § 9`: שלוש מילות חובה לכל סימולציה. ⛔ לא פרמטר כוונון. */
export const REQUIRED_WORDS_PER_MESSAGE = 3;

export interface MessageRecord {
  readonly level: StoryLevel;
  /** ⛔ מרשימה סגורה. ⚠️ המקום היחיד בפריט שבו שם פרטי מותר. */
  readonly senderName: string;
  readonly subjectEn: string;
  readonly bodyEn: string;
  /** שלוש המילים שהלומד חייב לשלב בתשובתו. */
  readonly requiredWordsEn: readonly string[];
}

export type MessageGateReason =
  | 'unknown_words'
  | 'sender_not_allowed'
  | 'name_in_body'
  | 'wrong_required_count'
  | 'required_not_in_bank'
  | 'required_not_in_body'
  | 'digit_in_text';

export interface MessageGateResult {
  readonly ok: boolean;
  readonly unknownWords: readonly string[];
  readonly leakedNames: readonly string[];
  readonly reasons: readonly MessageGateReason[];
}

export interface MessageGateOptions {
  readonly allowedLemmas: ReadonlySet<string>;
  /** T-193ⓒ: the closed list the brief writes. ⛔ Not derived, ⛔ not guessed. */
  readonly allowedSenders: ReadonlySet<string>;
}

const DIGIT = /[0-9]/;
const TOKEN = /[a-z']+/g;

const tokensOf = (text: string): string[] => text.toLowerCase().match(TOKEN) ?? [];

export function messageGate(
  record: MessageRecord,
  opts: MessageGateOptions,
): MessageGateResult {
  const reasons: MessageGateReason[] = [];

  // ── the sender: the one place a name may appear ──
  if (!opts.allowedSenders.has(record.senderName.trim())) reasons.push('sender_not_allowed');

  // ── vocabulary: subject + body + required words, same rule as the story ──
  const unknown = new Set<string>();
  for (const token of [...tokensOf(record.subjectEn), ...tokensOf(record.bodyEn)]) {
    if (storyLemma(token, opts.allowedLemmas) === null) unknown.add(token);
  }
  unknown.delete('');
  if (unknown.size > 0) reasons.push('unknown_words');

  // ── ⛔ no name in the body, ⛔ not even an allowed one ──
  // Checked against the WHOLE allowed list, not just this item's sender: a message
  // from Tom that says "ask Sarah" leaks a name just as surely.
  const bodyTokens = new Set(tokensOf(record.bodyEn));
  const leaked = [...opts.allowedSenders]
    .filter((name) => tokensOf(name).some((part) => bodyTokens.has(part)))
    .sort();
  if (leaked.length > 0) reasons.push('name_in_body');

  // ── the three required words ──
  if (record.requiredWordsEn.length !== REQUIRED_WORDS_PER_MESSAGE) {
    reasons.push('wrong_required_count');
  }
  const requiredLemmas: string[] = [];
  let anyRequiredUnknown = false;
  for (const word of record.requiredWordsEn) {
    const lemma = storyLemma(word, opts.allowedLemmas);
    if (lemma === null) anyRequiredUnknown = true;
    else requiredLemmas.push(lemma);
  }
  if (anyRequiredUnknown) reasons.push('required_not_in_bank');

  // ⛔ A required word must NOT already sit in the message the learner is answering.
  // Otherwise the task is copying, ⛔ not producing — and production is the whole
  // point of the app (`01-vision`: "הפקה, ולא רק זיהוי").
  const bodyLemmas = new Set<string>();
  for (const token of [...tokensOf(record.bodyEn), ...tokensOf(record.subjectEn)]) {
    const lemma = storyLemma(token, opts.allowedLemmas);
    if (lemma !== null) bodyLemmas.add(lemma);
  }
  if (requiredLemmas.some((l) => bodyLemmas.has(l))) reasons.push('required_not_in_body');

  // ── ⛔ zero claim about the world (T-193ⓓ) ──
  if (DIGIT.test(record.subjectEn) || DIGIT.test(record.bodyEn)) reasons.push('digit_in_text');

  return {
    ok: reasons.length === 0,
    unknownWords: [...unknown].sort(),
    leakedNames: leaked,
    reasons,
  };
}
