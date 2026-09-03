/**
 * T-221 · D-138 § ג׳ · F-163 — the second test `docs/content-distractors-brief.md`
 * promises and no command in the repo ran: after K-004, how many senses reach the FULL
 * D-023 tagged mix (≥2 `semantic` + ≥1 `orthographic` distractor, each one resolving to
 * a `translation_he` already in the bank), and how many reach at least one such resolved
 * distractor at all.
 *
 * "Resolves to a translation already in the bank" is the same join `arcadeRound.ts`
 * performs against Postgres for `taggedHe` (D-138 § ב׳ — `distractor → words.headword →
 * senses.translation_he`), computed here purely from the batch files themselves so a
 * content tick can measure it without a live database: the distractor's English word is
 * itself a headword somewhere in the corpus, with a non-empty `translation_he`.
 *
 * ⛔ `collocational` and `near_synonym` are not part of the D-023 tagged mix — only
 * `semantic` and `orthographic` count (D-023).
 *
 * Pure: no fs, no network. The script that reads data/generated/ lives in
 * scripts/measure-mix.mjs.
 */
import type { GeneratedSense, RelationType } from './contentSchema';

export interface MixCounts {
  readonly rowsRead: number;
  /** senses with ≥2 resolved `semantic` distractors AND ≥1 resolved `orthographic` one. */
  readonly fullMix: number;
  /** senses with at least one resolved `semantic` OR `orthographic` distractor. */
  readonly atLeastOneTagged: number;
}

const TAGGED: ReadonlySet<RelationType> = new Set(['semantic', 'orthographic']);

/**
 * Every headword in the corpus that carries a non-empty `translation_he`, lowercased
 * so it compares the same way as a lowercased `distractor.word` regardless of casing
 * on either side.
 */
export function buildTranslationBank(senses: readonly GeneratedSense[]): ReadonlySet<string> {
  const bank = new Set<string>();
  for (const sense of senses) {
    if (sense.translationHe.trim() !== '') bank.add(sense.headword.trim().toLowerCase());
  }
  return bank;
}

export function measureMix(senses: readonly GeneratedSense[]): MixCounts {
  const bank = buildTranslationBank(senses);
  let fullMix = 0;
  let atLeastOneTagged = 0;
  for (const sense of senses) {
    let semantic = 0;
    let orthographic = 0;
    for (const d of sense.distractors) {
      if (!TAGGED.has(d.relationType)) continue;
      if (!bank.has(d.word.trim().toLowerCase())) continue;
      if (d.relationType === 'semantic') semantic += 1;
      else orthographic += 1;
    }
    if (semantic >= 2 && orthographic >= 1) fullMix += 1;
    if (semantic + orthographic >= 1) atLeastOneTagged += 1;
  }
  return { rowsRead: senses.length, fullMix, atLeastOneTagged };
}
