/**
 * PURE. No React, no DOM, no clock, no env. Turns one stored sense into the two
 * faces of one card. Every input is supplied by the caller.
 *
 * The evidence this encodes (plan/15-syllabus-digest.md § "מאגר התוכן שלנו", D-021..D-023):
 *
 * - **Front = the bare word.** Minimum information principle. The example sentence goes on
 *   the back, as disambiguation and feedback — a single context adds little over a bare
 *   pair for form-meaning gain (Webb 2007).
 * - **Two sentences, two jobs.** The `supportive` sentence introduces the word; the
 *   `neutral` one tests it. A context that does not give the answer away produces better
 *   long-term retention, which is the entire reason both are stored (D-022).
 * - **Binary grading.** Anki's FSRS FAQ: accuracy does not suffer with only Again/Good,
 *   and four buttons cost friction on a phone.
 * - **Production is typed, recognition is self-graded.** Self-rating inflates and causes
 *   premature dropping of items (Dunlosky & Rawson 2012), so the direction that can be
 *   auto-graded is auto-graded.
 * - **Direction follows mastery, not a global setting.** Lower proficiency gains more from
 *   L2→L1 recognition, higher proficiency from L1→L2 production (Terai, Yamashita & Pasich
 *   2021). A word therefore starts in recognition and is promoted per word once stable —
 *   see `directionFor`.
 *
 * Language is carried on every face on purpose: the page is RTL and the English side must
 * be wrapped with `dir="ltr"` (T-009 `<EnWord>`). A UI that guesses by sniffing characters
 * gets this wrong on "OK" and on any Hebrew gloss containing a Latin abbreviation.
 */

import type { GeneratedSense } from './contentSchema';

export type CardDirection = 'recognition' | 'production';

export const CARD_DIRECTIONS: readonly CardDirection[] = ['recognition', 'production'];

/**
 * The only two grades. Anki FSRS FAQ — see the header.
 * Frozen: every card shares this one array, so an in-place mutation anywhere would
 * silently rewrite the grade buttons of every card built afterwards.
 */
export const BINARY_GRADES = Object.freeze(['again', 'good'] as const);

export type CardGrade = (typeof BINARY_GRADES)[number];

export type FaceLang = 'en' | 'he';

export interface CardFace {
  readonly primary: string;
  readonly primaryLang: FaceLang;
  readonly secondary: string | null;
  /** Always the English sentence, whatever `primaryLang` is. Null when none is usable. */
  readonly example: string | null;
  readonly exampleLang: 'en';
}

interface CardBase {
  readonly front: CardFace;
  readonly back: CardFace;
  readonly grades: typeof BINARY_GRADES;
}

/**
 * A discriminated union, not a flat record: "production ⇒ typed, recognition ⇒ self" is the
 * Dunlosky & Rawson claim this module is built on, so the type refuses to express a
 * self-graded production card. A flat `input: 'typed' | 'self'` let one typecheck.
 */
export type Card =
  | (CardBase & { readonly direction: 'recognition'; readonly input: 'self' })
  | (CardBase & { readonly direction: 'production'; readonly input: 'typed' });

/** The parts of a stored sense a card actually renders. Tied to the stored shape on purpose. */
export type CardSense = Pick<GeneratedSense, 'headword' | 'translationHe' | 'examples'>;

export interface CardContext {
  /** True the first time this learner meets the word — it selects the supportive sentence. */
  readonly isFirstEncounter: boolean;
}

export interface MasteryState {
  /** Consecutive `good` grades on recognition cards for this word. */
  readonly consecutiveCorrectRecognition: number;
}

export interface PromotionPolicy {
  /**
   * How many consecutive correct recognitions promote a word to production.
   * Required, with no default: no published number fixes this threshold, so it is a
   * product parameter the caller owns and we can tune with measured data — not a
   * constant invented here and then cited as if it were evidence.
   */
  readonly promoteAfterConsecutiveCorrect: number;
}

function requireText(value: string, label: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed === '') {
    throw new RangeError(`${label} must be a non-empty string`);
  }
  return trimmed;
}

function requireWholeCount(value: number, label: string, min: number): number {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${label} must be a whole number >= ${min}, got ${value}`);
  }
  return value;
}

/** Typing noise only: case and whitespace. Never spelling. See `gradeTypedAnswer`. */
function normalizeTyped(value: string): string {
  return (typeof value === 'string' ? value : '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** A blank line on a card is a content bug wearing a card's clothes. Drop it. */
function usableSentence(value: string | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed === '' ? null : trimmed;
}

function face(
  primary: string,
  primaryLang: FaceLang,
  example: string | null,
): CardFace {
  return { primary, primaryLang, secondary: null, example, exampleLang: 'en' };
}

export function buildCard(sense: CardSense, direction: CardDirection, ctx: CardContext): Card {
  if (!CARD_DIRECTIONS.includes(direction)) {
    throw new RangeError(`unknown card direction: ${String(direction)}`);
  }

  const headword = requireText(sense.headword, 'headword');
  const translationHe = requireText(sense.translationHe, 'translationHe');

  const supportive = usableSentence(sense.examples?.supportive);
  const neutral = usableSentence(sense.examples?.neutral);
  // First encounter introduces with the supportive sentence; every later review tests with
  // the neutral one. Either may be missing, so the fallback is always *the other* sentence —
  // falling back to the same branch would leave an introduction card with no example at all.
  const [preferred, fallback] = ctx.isFirstEncounter ? [supportive, neutral] : [neutral, supportive];
  const example = preferred ?? fallback ?? null;

  const en = face(headword, 'en', null);
  const he = face(translationHe, 'he', null);

  return direction === 'recognition'
    ? {
        direction,
        front: en,
        back: { ...he, example },
        input: 'self',
        grades: BINARY_GRADES,
      }
    : {
        direction,
        front: he,
        back: { ...en, example },
        input: 'typed',
        grades: BINARY_GRADES,
      };
}

/**
 * Grades a typed production answer. Pure: the caller supplies the string, this decides.
 *
 * The learner never rates themselves here (plan § "How the card looks and behaves"), so the
 * comparison rule lives in core rather than in the React layer. It is deliberately strict:
 * case and whitespace are normalised because they are typing noise, but no edit-distance or
 * near-miss tolerance is applied — how wrong an answer may be and still count is a
 * pedagogical parameter no source we hold fixes, and inventing one here would be inventing
 * teaching content. When we have measured data, it becomes an explicit policy argument.
 */
export function gradeTypedAnswer(card: Card, typed: string): CardGrade {
  if (card.input !== 'typed') {
    throw new RangeError(`only a typed card can be auto-graded, got input="${card.input}"`);
  }
  return normalizeTyped(typed) === normalizeTyped(card.back.primary) && normalizeTyped(typed) !== ''
    ? 'good'
    : 'again';
}

/**
 * Which direction this word should be studied in right now.
 * Recognition until the word is stable, then production — per word, never globally.
 */
export function directionFor(state: MasteryState, policy: PromotionPolicy): CardDirection {
  const threshold = requireWholeCount(
    policy.promoteAfterConsecutiveCorrect,
    'promoteAfterConsecutiveCorrect',
    1,
  );
  const streak = requireWholeCount(
    state.consecutiveCorrectRecognition,
    'consecutiveCorrectRecognition',
    0,
  );
  return streak >= threshold ? 'production' : 'recognition';
}
