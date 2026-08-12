/**
 * T-010, second half: attach a SOURCED CEFR band to a headword.
 *
 * ⛔ This never overwrites senses.cefr_level. Measured 2026-08-12 with the real
 * modules: 125 of 343 content rows (94 of the 306 distinct (headword, pos) pairs)
 * carry a band that differs from the profile's. That is not a bug —
 * senses.cefr_level is a SENSE judgement ("mean" = to signify, B1) and CEFR-J is a
 * LEMMA profile built for Japanese learners ("mean", A1). Both can be true, so both
 * are stored, side by side, each next to where it came from.
 *
 * The two denominators matter and are kept apart on purpose: the emitter writes one
 * row per PAIR (words is unique on (headword, pos)), so 94 is the number of UPDATEs
 * that will disagree with a sense label; 125 is the number of authored rows the
 * disagreement touches, and it is the one a human should read when judging the
 * content bank.
 */
import { levelOf, BAND_ORDER as ORDER, type CefrBand, type LevelMap } from './cefrLevels';
import { type Pos } from './contentSchema';

export interface WordKey {
  readonly headword: string;
  readonly pos: Pos;
}

export type Agreement = 'agree' | 'profile_lower' | 'profile_higher' | 'no_profile' | 'no_own';

export interface WordLevel {
  readonly headword: string;
  readonly pos: Pos;
  readonly profileBand: CefrBand | null;
  /** null iff profileBand is null — a route with no band would be a claim with no source. */
  readonly route: 'exact_pos' | 'lemma_only' | null;
  readonly ownBand: CefrBand | null;
  readonly agreement: Agreement;
}

export interface LevelReport {
  readonly words: readonly WordLevel[];
  readonly total: number;
  readonly exactPos: number;
  readonly lemmaOnly: number;
  readonly unmatched: number;
  readonly agree: number;
  readonly disagree: number;
}

/**
 * Descriptive, never corrective: `profile_lower` says the published profile thinks
 * the lemma is easier than the Content agent thought about one of its senses.
 * ⛔ Neither side wins here, and nothing downstream is allowed to make one win.
 */
function compare(profile: CefrBand, own: CefrBand): Agreement {
  const d = ORDER.indexOf(profile) - ORDER.indexOf(own);
  return d === 0 ? 'agree' : d < 0 ? 'profile_lower' : 'profile_higher';
}

export function assignWordLevels(
  map: LevelMap,
  words: readonly (WordKey & { readonly ownBand: CefrBand | null })[],
): LevelReport {
  const out: WordLevel[] = [];
  let exactPos = 0;
  let lemmaOnly = 0;
  let unmatched = 0;
  let agree = 0;
  let disagree = 0;

  for (const w of words) {
    const hit = levelOf(map, w.headword, w.pos);
    if (hit === null) unmatched += 1;
    else if (hit.route === 'exact_pos') exactPos += 1;
    else lemmaOnly += 1;

    const agreement: Agreement =
      hit === null
        ? 'no_profile'
        : w.ownBand === null
          ? 'no_own'
          : compare(hit.band, w.ownBand);
    if (agreement === 'agree') agree += 1;
    if (agreement === 'profile_lower' || agreement === 'profile_higher') disagree += 1;

    out.push({
      headword: w.headword,
      pos: w.pos,
      // ⛔ No fallback to ownBand, no default of 'A1', no inference from n_letters.
      profileBand: hit?.band ?? null,
      route: hit?.route ?? null,
      ownBand: w.ownBand,
      agreement,
    });
  }

  return { words: out, total: words.length, exactPos, lemmaOnly, unmatched, agree, disagree };
}

export function formatLevelReport(r: LevelReport): string {
  return (
    `${r.total} words · ${r.exactPos} exact_pos · ${r.lemmaOnly} lemma_only · ` +
    `${r.unmatched} unmatched · ${r.agree} agree · ${r.disagree} disagree`
  );
}
