/**
 * spotCheck — how much of a generated lot a human inspects, and when the lot is rejected.
 *
 * ⚠️ We hold exactly ONE row of ISO 2859-1, quoted in R-014 (`plan/RULES.md`):
 * "אצווה של 501–1,200 פריטים ⇐ 80 פריטים לבדיקה, קבלה עד 2 פגמים." That single row is
 * the whole of our evidence. Any other sample size would mean citing a table we do not
 * hold — the exact move R-014 was written to forbid. So: below 501 we inspect
 * everything (refusing to sample is never a claim about a standard), and above 1,200
 * we throw rather than extrapolate. ⛔ Do not "complete the table".
 *
 * Pure: no fs, no network, no RNG.
 */

export type InspectionBasis = 'full' | 'iso-2859-1-aql-1.0';

export interface SpotCheckPlan {
  readonly lotSize: number;
  readonly inspect: number;
  readonly acceptUpTo: number;
  readonly basis: InspectionBasis;
  /** Why this plan, in one sentence, for the manifest and the SQL header. */
  readonly rationale: string;
}

/** The only documented row: lots of 501–1,200 items. */
const DOCUMENTED_MIN = 501;
const DOCUMENTED_MAX = 1200;
const DOCUMENTED_INSPECT = 80;
const ACCEPT_UP_TO = 2;

export function spotCheckPlan(lotSize: number): SpotCheckPlan {
  if (!Number.isInteger(lotSize) || lotSize < 1) {
    throw new RangeError(`lot size must be a positive integer, got ${lotSize}`);
  }
  if (lotSize > DOCUMENTED_MAX) {
    throw new RangeError(
      `lot size ${lotSize} is above the only documented row (501–1,200); no sample size is held for it (R-014)`,
    );
  }
  if (lotSize >= DOCUMENTED_MIN) {
    return {
      lotSize,
      inspect: DOCUMENTED_INSPECT,
      acceptUpTo: ACCEPT_UP_TO,
      basis: 'iso-2859-1-aql-1.0',
      rationale: `lot of ${lotSize} falls in the 501–1,200 row R-014 quotes: inspect 80, accept up to 2 defects (AQL 1.0)`,
    };
  }
  return {
    lotSize,
    inspect: lotSize,
    acceptUpTo: ACCEPT_UP_TO,
    basis: 'full',
    rationale: `lot of ${lotSize} is below 501 and we hold no sample-size row beneath that boundary, so every item is inspected rather than a sample size invented (R-014)`,
  };
}

/** Deterministic and evenly spaced — no RNG, so a re-run selects the same items. */
export function selectForSpotCheck<T>(items: readonly T[], plan: SpotCheckPlan): T[] {
  if (items.length !== plan.lotSize) {
    throw new RangeError(`plan was built for a lot of ${plan.lotSize}, got ${items.length} items`);
  }
  const picked: T[] = [];
  for (let i = 0; i < plan.inspect; i += 1) {
    // Duplicate-free while inspect <= items.length, which spotCheckPlan guarantees.
    const item = items[Math.floor((i * items.length) / plan.inspect)];
    // Unreachable while the guard above holds; an index past the end would silently
    // shrink the sample, which is the one failure this function must never have.
    if (item === undefined) throw new RangeError(`spot-check index ${i} fell outside the lot`);
    picked.push(item);
  }
  return picked;
}

export function batchVerdict(defectsFound: number, plan: SpotCheckPlan): 'accept' | 'reject' {
  if (!Number.isInteger(defectsFound) || defectsFound < 0) {
    throw new RangeError(`defects found must be a non-negative integer, got ${defectsFound}`);
  }
  if (defectsFound > plan.inspect) {
    throw new RangeError(`${defectsFound} defects found but only ${plan.inspect} items were inspected`);
  }
  return defectsFound <= plan.acceptUpTo ? 'accept' : 'reject';
}
