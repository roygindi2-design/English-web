/**
 * PURE. No React, no DOM, no clock, no env, no I/O. The world layer: it decides when the
 * tab opens, what counts as a bank token, and whether a draft may be published.
 *
 * ⛔ The two unlock numbers (100 · 12) are NOT here. They are policy, and the repo keeps
 * policy in the route that owns it (`PROMOTE_AFTER_CONSECUTIVE_CORRECT`,
 * `NEW_CARDS_PER_DAY`) for one reason: a constant exported from the pure layer gets cited
 * later as if this layer had DERIVED it. D-031 says outright that 12 "אינו מספר פדגוגי
 * ואינו מתחזה לכזה" — it is a product threshold measured off our own approved sentences.
 * So the predicate takes its thresholds as an argument.
 *
 * ⛔ Nothing here judges English. R-016: no grading, no correction, no "nice", no "right".
 * `renderDraft` joins and does not capitalise, because capitalising is correcting.
 */

export interface WorldCounts {
  readonly functionWords: number;
  readonly activeWords: number;
}

export interface WorldThresholds {
  readonly minFunctionWords: number;
  readonly minActiveWords: number;
}

/** D-031. Both conditions are counts. A non-finite or negative count is "we do not know",
 *  and "we do not know" is ⛔ never an open door. */
export function isWorldUnlocked(counts: WorldCounts, thresholds: WorldThresholds): boolean {
  const ok = (value: number, floor: number): boolean =>
    Number.isFinite(value) && value >= floor;
  return (
    ok(counts.functionWords, thresholds.minFunctionWords) &&
    ok(counts.activeWords, thresholds.minActiveWords)
  );
}

/** The only two punctuation marks the screen offers, as fixed buttons — § 4.2ה.
 *  ⛔ Not a keyboard, and ⛔ not extensible without a PM decision. */
export const PUNCTUATION_TOKENS: readonly string[] = ['.', '?'];

/**
 * A wire guard, ⛔ NOT the "תקרה מלאכותית" § 4.2ה forbids. The spec's sentence is about
 * the screen: the draft scrolls, no counter is shown, nothing is disabled at a length.
 * This exists so a hand-rolled POST cannot hand the database an unbounded string. It is
 * ~20× the median approved sentence (10 words), and the UI must never display it.
 */
export const MAX_DRAFT_TOKENS = 200;

const MAX_TOKEN_LENGTH = 40;
/** A single English surface form: letters, and the two marks real headwords carry inside
 *  them. ⛔ No space — a token with a space is a sentence, and this screen has no keyboard. */
const WORD_TOKEN = /^[a-z][a-z'’-]*$/;

export function normaliseToken(value: string): string {
  return value.trim().toLowerCase();
}

export function isBankToken(value: string): boolean {
  if (typeof value !== 'string') return false;
  const token = value.trim();
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return false;
  if (PUNCTUATION_TOKENS.includes(token)) return true;
  return WORD_TOKEN.test(token.toLowerCase());
}

/** Exact token match. ⛔ Never `includes()` on the joined string: "car" would then be
 *  satisfied by "card", which is the same false-accept class as F-020. */
export function draftContainsTarget(tokens: readonly string[], target: string): boolean {
  const wanted = normaliseToken(target);
  if (wanted === '') return false;
  return tokens.some((token) => normaliseToken(token) === wanted);
}

/** Mechanical. Punctuation attaches to the word before it; everything else is joined by one
 *  space. ⛔ No capitalisation, no reordering, no dedupe — all three are corrections. */
export function renderDraft(tokens: readonly string[]): string {
  return tokens
    .reduce<string>((sentence, raw) => {
      const token = raw.trim();
      if (token === '') return sentence;
      if (sentence === '') return token;
      return PUNCTUATION_TOKENS.includes(token) ? `${sentence}${token}` : `${sentence} ${token}`;
    }, '')
    .trim();
}

/**
 * § 4.2ה: "הבנק מציג כל צורת שטח פעם אחת, ולכן השאילתה מקבצת לפי headword ולא לפי sense."
 * Measured C-0092: 12 headwords (`can` · `like` · `back` · `first` · `home` · `little` ·
 * `no` · `off` · `once` · `only` · `over` · `still`) carry both a function and a content
 * sense, so a sense-shaped bank would show each of them twice.
 * Sorted, so two identical requests return the same bank in the same order.
 */
export function uniqueHeadwords(rows: readonly { readonly headword: string | null }[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const headword = typeof row.headword === 'string' ? normaliseToken(row.headword) : '';
    if (headword !== '') seen.add(headword);
  }
  return [...seen].sort();
}

/**
 * Today's target word.
 *
 * ⚠️ § 4.2ה fixes that there IS one target, drawn from the learner's active words, and does
 * ⛔ not fix which. This rule is the smallest deterministic one that does not need a clock:
 * the alphabetically first active word the learner has not produced yet, falling back to the
 * alphabetically first overall once they all have been. It is one pure function, so a PM
 * decision replaces it in a single edit.
 */
export function pickTargetWord(
  activeWords: readonly string[],
  usedWords: readonly string[],
): string | null {
  const ordered = [...new Set(activeWords.map(normaliseToken))].filter((w) => w !== '').sort();
  if (ordered.length === 0) return null;
  const used = new Set(usedWords.map(normaliseToken));
  return ordered.find((word) => !used.has(word)) ?? ordered[0] ?? null;
}

export type PostPayload = { readonly target: string; readonly tokens: readonly string[] };
export type PostCheck =
  | { readonly ok: true; readonly payload: PostPayload }
  | { readonly ok: false; readonly reason: 'malformed' | 'target_missing' };

/**
 * The publish rule, decided HERE and enforced by the route — § 4.2ה: "נאכפת בשרת ולא רק
 * ב-UI". Shape is checked before the target, so a malformed body never reports
 * `target_missing`: that message is shown to the learner as guidance, and showing it over a
 * broken request would be a lie about what went wrong.
 */
export function checkPostPayload(body: unknown): PostCheck {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, reason: 'malformed' };
  }
  const candidate = body as { target?: unknown; tokens?: unknown };
  if (typeof candidate.target !== 'string' || !isBankToken(candidate.target)) {
    return { ok: false, reason: 'malformed' };
  }
  if (!Array.isArray(candidate.tokens)) return { ok: false, reason: 'malformed' };
  const tokens = candidate.tokens;
  if (tokens.length === 0 || tokens.length > MAX_DRAFT_TOKENS) {
    return { ok: false, reason: 'malformed' };
  }
  if (!tokens.every((token): token is string => typeof token === 'string' && isBankToken(token))) {
    return { ok: false, reason: 'malformed' };
  }
  if (!draftContainsTarget(tokens, candidate.target)) {
    return { ok: false, reason: 'target_missing' };
  }
  return { ok: true, payload: { target: normaliseToken(candidate.target), tokens } };
}