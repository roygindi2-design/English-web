import type { StoryCandidate } from '@/lib/core/storyPick';

/**
 * Ceilings on what this file is willing to read, the same class of constant as
 * `MAX_BANK_ROWS` in `app/api/world/status/route.ts`: an unbounded read is how a
 * route starts paging the whole bank to paint one screen.
 *
 * ⛔ This file holds the SHAPE of the story reads and the row→domain mapping. It is
 * the only place PostgREST rows for stories are turned into `StoryCandidate`.
 */
export const MAX_LEVEL_STORIES = 200;
export const MAX_GLOSS_ROWS = 2000;

export type StoriesRead =
  | { readonly ok: true; readonly stories: readonly StoryCandidate[] }
  | { readonly ok: false; readonly code: 'schema_missing' | 'unavailable' };

export interface GlossRow {
  readonly wordId: string;
  readonly headword: string;
  readonly posHe: string;
  readonly translationHe: string;
}

export interface StoryRowShape {
  readonly id: string;
  readonly title_en: string;
  readonly body_en: string;
  readonly created_at: string;
}

export function toStoryCandidates(
  rows: readonly StoryRowShape[],
): readonly StoryCandidate[] {
  return rows.map((r) => ({
    id: r.id,
    titleEn: r.title_en,
    bodyEn: r.body_en,
    createdAt: r.created_at,
  }));
}

/**
 * The Hebrew part-of-speech label over the CLOSED `words.pos` vocabulary of
 * `supabase/migrations/0002_content_bank.sql` — nine values, ⛔ not eight. It is a map
 * over an existing closed set, ⛔ not a new column and ⛔ not learning content: the
 * learner already meets these labels on the flashcard.
 */
export const POS_HE: Readonly<Record<string, string>> = {
  noun: 'שם עצם',
  verb: 'פועל',
  adjective: 'שם תואר',
  adverb: 'תואר הפועל',
  preposition: 'מילת יחס',
  conjunction: 'מילת חיבור',
  pronoun: 'כינוי',
  determiner: 'מילית',
  interjection: 'מילת קריאה',
};

export function posHeLabel(pos: unknown): string {
  return typeof pos === 'string' && POS_HE[pos] !== undefined ? POS_HE[pos] : '';
}

/** One PostgREST row of the gloss read: a word plus its FIRST sense's translation. */
export interface RawGlossRow {
  readonly id: string;
  readonly headword: string | null;
  readonly pos: string | null;
  readonly senses:
    | readonly { readonly sense_index: number; readonly translation_he: string | null; readonly translation_confidence: string | null }[]
    | { readonly sense_index: number; readonly translation_he: string | null; readonly translation_confidence: string | null }
    | null;
}

/**
 * ⛔ **D-013: a low-confidence translation is ⛔ never shown to a learner.** A word whose
 * only sense is `low` produces ⛔ no gloss at all, and a word with ⛔ no gloss is ⛔ not a
 * tap target (`36 § 3` condition 1). The filter therefore lives here, ⛔ not in the UI.
 */
export function toGlossRows(rows: readonly RawGlossRow[]): readonly GlossRow[] {
  const out: GlossRow[] = [];
  for (const row of rows) {
    const headword = typeof row.headword === 'string' ? row.headword.trim().toLowerCase() : '';
    if (headword === '') continue;
    const senses = row.senses === null ? [] : Array.isArray(row.senses) ? [...row.senses] : [row.senses];
    const usable = senses
      .filter((s) => s.translation_confidence !== 'low')
      .filter((s) => typeof s.translation_he === 'string' && s.translation_he.trim() !== '')
      .sort((a, b) => a.sense_index - b.sense_index)[0];
    if (usable === undefined) continue;
    out.push({
      wordId: row.id,
      headword,
      posHe: posHeLabel(row.pos),
      translationHe: (usable.translation_he ?? '').trim(),
    });
  }
  return out;
}
