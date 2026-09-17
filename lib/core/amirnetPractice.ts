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
  /**
   * The SAME fact in the dashboard's own wording — `N שאלות` (render_video_D.py:76) against the
   * menu's `N שאלות שנענו` (:121). Two renders, two strings, ⛔ and one place that derives both:
   * a second component computing its own would be the drift this module exists to prevent.
   */
  readonly answeredShortHe: string;
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
      answeredShortHe: seen ? `${s.answered} שאלות` : NEVER_PRACTISED_HE,
    };
  });
}

/**
 * `T-376` — the sentence for «the read failed», and it is ⛔ deliberately ⛔ NOT in
 * `FAILURE_HE`: that map says «the product failed, not you» with a full stop, while this one
 * names the single field the screen ⛔ could not fill. The menu still opens under it.
 * ⛔ No digit, ⛔ no `0`, ⛔ no `—`: any of the three reads as a count the product ⛔ never took.
 */
export const STATS_UNKNOWN_HE = 'לא הצלחנו לקרוא את הביצועים שלך בסוג הזה';

/**
 * The three cards a learner sees when `GET /api/amirnet/practice/result` ⛔ did not answer.
 *
 * 🔴 **⛔ Not `toTypeCards(zeroStats())`, and the difference is the whole point.** `zeroStats()`
 * is a MEASURED zero — «you have answered nothing yet» — and `toTypeCards` turns it into
 * `NEVER_PRACTISED_HE`. A failed read measured ⛔ nothing, so printing that sentence would be
 * the product asserting a zero it ⛔ does not hold. Same refusal as `weakestType()`'s three
 * nulls, one screen over.
 *
 * ⚠️ And the menu is ⛔ still drawn: practice is the ACTION on this screen, and blocking the
 * action because a statistic ⛔ did not load would cost the learner the thing they came for.
 * ⇒ the cards lose their number, ⛔ never their `תרגל`.
 */
export function unknownStatsCards(): readonly AmirnetTypeCard[] {
  return AMIRNET_TYPES.map(({ type, nameHe, nameEn }) => ({
    type,
    nameHe,
    nameEn,
    successPct: null,
    answeredHe: STATS_UNKNOWN_HE,
    answeredShortHe: STATS_UNKNOWN_HE,
  }));
}

/** ⓓ's gate, and it is ⛔ not «are there cards» — a learner can hold three cards and zero answers. */
export function hasAnyAnswers(stats: readonly AmirnetTypeStat[]): boolean {
  return stats.some((s) => s.answered > 0);
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

export interface AmirnetWeakness {
  readonly type: AmirnetPracticeType;
  readonly nameHe: string;
  /** ⛔ Never null here: a weakness with ⛔ no percentage is exactly the guess `weakestType` refuses. */
  readonly successPct: number;
  /** The strip's two lines, already written — the component does ⛔ no arithmetic (T-291ⓑ). */
  readonly titleHe: string;
  readonly adviceHe: string;
}

export const WEAKNESS_PREFIX_HE = 'החולשה שלך: ';
export const WEAKNESS_ADVICE_HE = 'מומלץ להתחיל שם';

/**
 * The whole weakness strip, or null — and null is the state the render ⛔ never draws, which is
 * precisely why it is written here and ⛔ not left to the component (T-291ⓒ · render_video_D.py:82-88).
 *
 * It delegates the decision itself to `weakestType`, so the three refusals to guess — nothing
 * answered · some type never tried · a tie at the bottom — live in exactly ONE place. This
 * function only dresses the answer in the render's own two lines.
 */
export function weakestCard(stats: readonly AmirnetTypeStat[]): AmirnetWeakness | null {
  const type = weakestType(stats);
  if (type === null) return null;
  const card = toTypeCards(stats).find((c) => c.type === type);
  if (card === undefined || card.successPct === null) return null;
  return {
    type,
    nameHe: card.nameHe,
    successPct: card.successPct,
    titleHe: `${WEAKNESS_PREFIX_HE}${card.nameHe}`,
    adviceHe: `${card.successPct}% הצלחה · ${WEAKNESS_ADVICE_HE}`,
  };
}

/**
 * The three types at zero — a learner who has ⛔ never practised, which is ⛔ every learner today.
 *
 * ⚠️ It exists because the honest alternative is worse. `public.sense_items` carries ⛔ no question
 * type, options, `correct_index` or explanation (`F-222`, measured C-0531), so ⛔ nothing writes a
 * practice result yet and `T-297` is blocked on the schema decision. ⇒ the two `(tabs)` routes feed
 * the screens THIS, and both screens then say in words that practice has not started — which is
 * true. ⛔ They do ⛔ not invent a statistic, and ⛔ they do not render `—` or `0%` (T-291ⓓ).
 */
export function zeroStats(): readonly AmirnetTypeStat[] {
  return AMIRNET_TYPES.map((t) => ({ type: t.type, answered: 0, correct: 0 }));
}
