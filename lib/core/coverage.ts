/**
 * Hebrew coverage measurement (T-013 · T-016 · R-005).
 *
 * Source-agnostic on purpose: T-013 measures H1/H2 and T-016 measures H3/H4
 * with an identical output contract, so they are the same function called with
 * a different array.
 *
 * ⛔ This module MEASURES. It does not choose a source and it does not
 * translate. Choosing is the PM's call on the back of these numbers.
 */

import { asRawGloss, classifyGloss, normalizeEnglish } from './lexicon';

export interface SourceEntry {
  readonly en: string;
  readonly he: string;
}

export interface LexicalSource {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly SourceEntry[];
}

/**
 * The two readings of the damaged-record rule. See F-021: plan/15-syllabus-digest.md
 * § 2 says `!` and pointed records are not loaded at all; T-017 (ב)+(ג) and the
 * digest's own § 3 say they are loaded and gated later. Rather than guess, we
 * measure both and let the PM rule.
 */
export interface CoveragePolicy {
  readonly includeLowConfidence: boolean;
  readonly includePointed: boolean;
}

export const STRICT_POLICY: CoveragePolicy = {
  includeLowConfidence: false,
  includePointed: false,
};

export const LENIENT_POLICY: CoveragePolicy = {
  includeLowConfidence: true,
  includePointed: true,
};

export interface SourceCoverage {
  readonly id: string;
  readonly label: string;
  readonly covered: number;
  readonly total: number;
  readonly percent: number;
  readonly acceptedGlosses: number;
  readonly rejectedGlosses: number;
}

export interface CoverageReport {
  readonly policy: CoveragePolicy;
  readonly headwordCount: number;
  readonly perSource: readonly SourceCoverage[];
  readonly combined: {
    readonly covered: number;
    readonly total: number;
    readonly percent: number;
  };
  readonly uncovered: readonly string[];
}

function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

function accepts(policy: CoveragePolicy, he: string): boolean {
  const v = classifyGloss(asRawGloss(he));
  if (v.kind === 'drop') return false;
  if (!policy.includeLowConfidence && v.confidence === 'low') return false;
  if (!policy.includePointed && v.flags.includes('pointed')) return false;
  return true;
}

export function measureCoverage(
  headwords: readonly string[],
  sources: readonly LexicalSource[],
  policy: CoveragePolicy,
): CoverageReport {
  // Normalised key -> the first original spelling seen. The report has to name
  // headwords the way Roy will read them, not the way we index them.
  const keyed = new Map<string, string>();
  for (const raw of headwords) {
    const key = normalizeEnglish(raw);
    if (key === '') continue;
    if (!keyed.has(key)) keyed.set(key, raw);
  }
  const total = keyed.size;

  const coveredAnywhere = new Set<string>();
  const perSource: SourceCoverage[] = [];

  for (const source of sources) {
    const hit = new Set<string>();
    let accepted = 0;
    let rejected = 0;

    for (const entry of source.entries) {
      if (!accepts(policy, entry.he)) {
        rejected += 1;
        continue;
      }
      accepted += 1;
      const key = normalizeEnglish(entry.en);
      if (keyed.has(key)) {
        hit.add(key);
        coveredAnywhere.add(key);
      }
    }

    perSource.push({
      id: source.id,
      label: source.label,
      covered: hit.size,
      total,
      percent: pct(hit.size, total),
      acceptedGlosses: accepted,
      rejectedGlosses: rejected,
    });
  }

  const uncovered = [...keyed.keys()]
    .filter((key) => !coveredAnywhere.has(key))
    .sort()
    .map((key) => keyed.get(key) as string);

  return {
    policy,
    headwordCount: total,
    perSource,
    combined: {
      covered: coveredAnywhere.size,
      total,
      percent: pct(coveredAnywhere.size, total),
    },
    uncovered,
  };
}
