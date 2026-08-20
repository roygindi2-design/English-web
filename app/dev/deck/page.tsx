'use client';

import CardDeck from '@/components/CardDeck';
import type { QueueCardInput } from '@/lib/core/deck';

/**
 * Layout fixture for `check:mobile` — T-065 part ד׳, plan `2026-08-13-study-queue.md` task 8.
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/study` is already in the harness's route list, and that is exactly why this file has to
 * exist: `next start` runs with no Supabase env, `GET /api/study/queue` answers 503 by its
 * own contract, and so every `ok /study` line this harness has ever printed described the
 * FAILURE state. The scrolling deck itself — snap container, one card per viewport, the two
 * grade buttons — had never once been rendered at 320/375/414. Same reasoning as `/dev/card`
 * and `/dev/tabs/*` (TD-13).
 *
 * ⛔ **This page renders the deck and NOTHING else** — no note line above it, unlike the
 * `/dev/card` fixtures. `<CardDeck>` is `h-dvh` and owns the vertical rhythm of the screen,
 * so a line of chrome the real route does not have would push the card down and the harness
 * would be measuring this fixture instead of the component. The «not learning content»
 * declaration therefore lives here in the comment, where it costs no pixels.
 *
 * The two cards are the same non-content the sibling fixtures use: "Lorem"/"Ipsum" are not
 * English words and the Hebrew reads "sample text" / "other text". Nobody can learn anything
 * from them, which is the point — R-010/R-013 forbid sourced content and the loop forbids
 * invented content.
 *
 * Two cards and ⛔ not one: «one card per screen» cannot fail on a deck that holds a single
 * card, and the snap container's height is only measurably wrong when there is a second card
 * for it to push out of the viewport.
 *
 * T-086 (§ 4.2ח ⓑ · 2026-08-20) — הפיקסטורה גדלה מ-2 ל-5. שני כרטיסים מוכיחים ש-`snap`
 * פעיל, אבל ⛔ ⛔ מוכיחים שכרטיס 3, 4, 5 גם מחוץ למסך: פגם `h-full` בתוך `flex-1` היה
 * נעצר על כרטיס 2 ומחזיר את כרטיס 3 ל-`min-content`. המשימה נסגרת בדוח מדידה של
 * שלושת הרחבים, ⛔ לא ב"נראה טוב". כל חמשת הכרטיסים חייבים `word_id` שונים —
 * ל-<CardDeck> יש `remaining.filter(!graded)` שעובר על אותו מזהה.
 */
const FIXTURE: readonly QueueCardInput[] = [
  {
    word_id: 'fixture-lorem',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Lorem',
      translation_he: 'טקסט לדוגמה',
      examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-ipsum',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Ipsum',
      translation_he: 'טקסט אחר',
      examples: { supportive: 'The Ipsum is also a fixture.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-dolor',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Dolor',
      translation_he: 'שלישי לדוגמה',
      examples: { supportive: 'The Dolor is a third fixture card.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-sit',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Sit',
      translation_he: 'רביעי לדוגמה',
      examples: { supportive: 'The Sit is a fourth fixture card.', neutral: '' },
      needs_human_review: false,
    },
  },
  {
    word_id: 'fixture-amet',
    direction: 'recognition',
    is_first_encounter: true,
    sense: {
      headword: 'Amet',
      translation_he: 'חמישי לדוגמה',
      examples: { supportive: 'The Amet is a fifth fixture card.', neutral: '' },
      needs_human_review: false,
    },
  },
];

export default function DevDeckPage() {
  return (
    <CardDeck
      deck="due"
      cards={FIXTURE}
      // Resolves and does nothing. A rejecting stub would leave the graded card in place
      // (that is `<CardDeck>`'s contract), and the harness could then never measure the
      // advance; a stub that recorded anything would be state the real screen owns.
      onGraded={() => Promise.resolve()}
    />
  );
}
