/**
 * PURE. ⛔ אפס React, DOM, שעון, `window`, `fetch`, `process.env`, `Math.random`.
 *
 * T-066 · D-156 · D-169 — turns one `SentenceItem` (the wire shape `GET /api/study/queue?deck=sentences`
 * returns) into the THIRD variant of `Card`: `input: 'choice'`. ⛔ Not a new component and
 * ⛔ not a new screen — D-169 (Roy, `03-for-roy` item 79ⓑ): «אין צורך במסך חדש — חפיסת
 * המשפטים רוכבת על `kol-A-03-card`». The same `<Flashcard>` draws it; the same `<CardDeck>`
 * scrolls it.
 *
 * What D-156 fixed, and this module encodes:
 *   ⓐ the FRONT is the stem with its blank (`____`) — the learner completes a sentence;
 *   ⓑ **three** options, ⛔ not four (Engine 7.5 · D-012 · Rodriguez 2005) — enforced upstream
 *      by `SENTENCE_OPTION_COUNT`, carried here untouched;
 *   ⓒ the BACK is the completed stem + `translation_he` + the neutral example — ⛔ no new field.
 *
 * Grading is exact (`gradeChoice`): the learner tapped one of three strings we supplied, so
 * there is no typing noise to normalise — a mismatch in case would mean the OPTION text
 * differs from the ANSWER text, which is a content bug, ⛔ not a near-miss to forgive.
 *
 * ⛔ **Zero SM-2 here** (D-032 · D-033): this module builds and grades one card; where the
 * grade goes (`POST /api/practice`, two counters) is the screen's decision.
 */

import {
  BINARY_GRADES,
  splitAroundTarget,
  type Card,
  type CardFace,
  type CardGrade,
} from './flashcard';
import { BLANK_TOKEN, type SentenceItem } from './sentenceItem';

/**
 * The stem around its FIRST blank. Throws on a stem with no blank: `buildSentenceItems`
 * already drops those (`isUsableStem`), so reaching here without one is a caller bug and
 * a silent "before = whole stem, after = ''" would draw a sentence with no gap to fill.
 */
export function splitStem(stem: string): { readonly before: string; readonly after: string } {
  const at = stem.indexOf(BLANK_TOKEN);
  if (at === -1) {
    throw new RangeError(`stem carries no ${BLANK_TOKEN}: ${JSON.stringify(stem)}`);
  }
  return { before: stem.slice(0, at), after: stem.slice(at + BLANK_TOKEN.length) };
}

/** The first blank replaced by the answer — the sentence the back reads. */
export function completeStem(stem: string, answer: string): string {
  const { before, after } = splitStem(stem);
  return `${before}${answer}${after}`;
}

function face(primary: string, primaryLang: 'en' | 'he', secondary: string | null): CardFace {
  return {
    primary,
    primaryLang,
    secondary,
    example: null,
    exampleLang: 'en',
    exampleSegments: [],
    unverified: false,
  };
}

export function buildSentenceCard(item: SentenceItem): Card {
  const stem = splitStem(item.stem);
  const completed = completeStem(item.stem, item.answer);
  const example =
    typeof item.exampleNeutral === 'string' && item.exampleNeutral.trim() !== ''
      ? item.exampleNeutral.trim()
      : null;
  return {
    direction: 'recognition',
    input: 'choice',
    // The front's `primary` is the raw stem (with `____`) so a consumer that does not know
    // the variant still has one readable English string; the component draws `stem` instead.
    front: face(item.stem, 'en', null),
    back: {
      ...face(completed, 'en', item.translationHe),
      example,
      // The answer is the target in the neutral example — D-022: the neutral sentence is the
      // one that TESTS the word, and it is the one the back shows (D-156 ⓒ).
      exampleSegments: splitAroundTarget(example, item.answer),
      // D-024 marks a sense a human has not reviewed. The sentences wire does not carry the
      // flag today (`SentenceItem` has none), so the card is built unmarked rather than
      // guessed marked — a row that needs review is filtered by RLS before it gets here.
      unverified: false,
    },
    grades: BINARY_GRADES,
    options: item.options,
    answer: item.answer,
    stem,
  };
}

/**
 * `good` iff the tapped option IS the answer — exact string equality, ⛔ no normalisation
 * (see the header). Throws on any other card variant: a self-graded or typed card graded
 * through here would be a wiring bug, and a silent `'again'` would punish the learner for it.
 */
export function gradeChoice(card: Card, chosen: string): CardGrade {
  if (card.input !== 'choice') {
    throw new RangeError(`only a choice card can be graded by option, got input="${card.input}"`);
  }
  return chosen === card.answer ? 'good' : 'again';
}
