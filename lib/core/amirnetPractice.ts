/**
 * PURE. Every decision the amirnet practice screens make (T-286 · 41 § 7 · 41 § 8 item 1).
 *
 * Why a module and not three components: the same three facts — what a type is called, when
 * a statistic may be shown at all, and which type is the weak one — are needed by the practice
 * menu (T-286), the question header (T-287) and the dashboard (T-291). Written once here, the
 * three screens can only agree; written in each component, they can only drift.
 *
 * ⛔ Zero React, window, document, localStorage, fetch, process.env — `scripts/check-core-purity.mjs`.
 * ⛔ No clock: the caller passes elapsed time. ⛔ No adaptivity anywhere (41 § 7: «הרמה נבחרת ידנית»).
 */

export type AmirnetPracticeType = 'sc' | 'rs' | 'rc';
export type AmirnetLevel = 1 | 2 | 3 | 4;

export const AMIRNET_LEVELS: readonly AmirnetLevel[] = Object.freeze([1, 2, 3, 4] as const);

export interface AmirnetTypeName {
  readonly type: AmirnetPracticeType;
  readonly nameHe: string;
  /** The second line the render draws under the Hebrew name — English, so it goes in <EnWord>. */
  readonly nameEn: string;
}

/** Order is the render's own, top to bottom (render_video_D.py:41-43 `TYPES`). */
export const AMIRNET_TYPES: readonly AmirnetTypeName[] = Object.freeze([
  { type: 'sc', nameHe: 'השלמת משפטים', nameEn: 'Sentence Completion' },
  { type: 'rs', nameHe: 'ניסוח מחדש', nameEn: 'Restatement' },
  { type: 'rc', nameHe: 'הבנת הנקרא', nameEn: 'Reading' },
] as const);

export interface AmirnetTypeStat {
  readonly type: AmirnetPracticeType;
  /** ⛔ 0 is a legal, DECLARED state — a learner who never practised — ⛔ not missing data. */
  readonly answered: number;
  readonly correct: number;
}

export interface AmirnetTypeCard {
  readonly type: AmirnetPracticeType;
  readonly nameHe: string;
  readonly nameEn: string;
  /**
   * null ⇔ `answered === 0`. `0%` over zero questions is a LIE, ⛔ not a datum (T-286ⓔ · T-291ⓓ),
   * and `—` is ⛔ not an answer either — `answeredHe` carries a written sentence instead.
   */
  readonly successPct: number | null;
  /** Hebrew, always present and always a sentence a learner can read. */
  readonly answeredHe: string;
}

export const NEVER_PRACTISED_HE = 'עדיין לא תרגלת את הסוג הזה';
export const LEVEL_CHIP_HE = (level: AmirnetLevel): string => `רמה ${level}`;

function nameOf(type: AmirnetPracticeType): AmirnetTypeName {
  const found = AMIRNET_TYPES.find((t) => t.type === type);
  if (found === undefined) throw new Error(`unknown amirnet practice type: ${type}`);
  return found;
}

/** The whole card, including the never-practised state. ⛔ The component decides nothing. */
export function toTypeCards(stats: readonly AmirnetTypeStat[]): readonly AmirnetTypeCard[] {
  return stats.map((s) => {
    const { nameHe, nameEn } = nameOf(s.type);
    const seen = s.answered > 0;
    return {
      type: s.type,
      nameHe,
      nameEn,
      successPct: seen ? Math.round((s.correct / s.answered) * 100) : null,
      answeredHe: seen ? `${s.answered} שאלות שנענו` : NEVER_PRACTISED_HE,
    };
  });
}

/**
 * The weakest type, or null — and null is the common case, deliberately.
 *
 * Three ⛔ separate reasons to answer null, and ⛔ every one of them is a refusal to guess:
 *   ⓐ nothing was answered at all (T-291ⓓ);
 *   ⓑ some type was ⛔ never tried — «weakest» is a COMPARISON, and a type with no answers
 *      is ⛔ not a low score, it is an ABSENT one. This is the exact failure T-291 writes
 *      out: a learner with 3 answers seeing `100% · 0% · 0%` and being sent to a type they
 *      ⛔ never opened. ⛔ Nor may the answer be the one type they DID try — telling a
 *      learner at 100% that it is their weakness is the same lie from the other side;
 *   ⓒ two types are tied at the bottom (T-291ⓒ: «⛔ אל תנחש ביניהם»).
 */
export function weakestType(stats: readonly AmirnetTypeStat[]): AmirnetPracticeType | null {
  const scored = stats
    .filter((s) => s.answered > 0)
    .map((s) => ({ type: s.type, pct: (s.correct / s.answered) * 100 }));
  // ⓑ — one untried type and the comparison has no ground to stand on.
  if (scored.length === 0 || scored.length !== stats.length) return null;
  const lowest = scored.reduce((min, s) => (s.pct < min ? s.pct : min), Number.POSITIVE_INFINITY);
  const atBottom = scored.filter((s) => s.pct === lowest);
  const only = atBottom.length === 1 ? atBottom[0] : undefined;
  return only === undefined ? null : only.type;
}

/**
 * `41 § 7`, verbatim: «רק אחרי שתי הבחירות נפתחת השאלה».
 * ⛔ There is no default that jumps a learner into a random question (T-286ⓓ).
 */
export function practiceReady(
  type: AmirnetPracticeType | null,
  level: AmirnetLevel | null,
): boolean {
  return type !== null && level !== null;
}
