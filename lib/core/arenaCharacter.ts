/**
 * T-217 · `plan/37-arena-spec.md § 7` — **the character rule, and nothing else.**
 *
 * ⛔ PURE (`lib/core/`): zero React, DOM, network, clock, randomness. The screen draws
 * what is exported here; the route writes what `withCharacter` returns. Neither decides.
 *
 * ⛔ **Every learner-facing string is a verbatim cell of the `§ 7` table** — the test
 * proves each one is a substring of the spec, so nothing here can be invented.
 * ⛔ **No digits anywhere** — `§ 7`: «בלי טבלאות מספרים בכניסה ראשונה». The biases are
 * **words**; the battle numbers behind them are a PM row (F-202), ⛔ not a DEV guess.
 *
 * **D-152 — ⛔ no migration.** The choice is one jsonb key, `character`, inside
 * `arcade_progress.avatar_parts` (`0014_arcade.sql:29`, `jsonb not null default '{}'`).
 * The three storage values are ⛔ never shown to a learner (`RULES § 0.22` ⓑ — DEV's
 * call, logged in the tick report). `avatar_parts.name` is ⛔ not written and ⛔ not
 * read (F-202 — `§ 7` names no closed list of names).
 */

export const ARENA_CHARACTERS = Object.freeze(['wizard', 'warrior', 'armorer'] as const);
export type ArenaCharacter = (typeof ARENA_CHARACTERS)[number];

/** `37 § 7`, column «דמות», verbatim. */
export const CHARACTER_LABELS_HE: Readonly<Record<ArenaCharacter, string>> = Object.freeze({
  wizard: 'קוסם',
  warrior: 'לוחם',
  armorer: 'שריונאי',
});

/**
 * `37 § 7`, column «הטיה» — the cell split at **its own** punctuation (`RULES § 0.22`
 * ⓒ), so `שריונאי` carries four lines and the other two carry three. ⛔ No numbers.
 */
export const CHARACTER_BIAS_HE: Readonly<Record<ArenaCharacter, readonly string[]>> =
  Object.freeze({
    wizard: Object.freeze(['מאנה מהירה יותר', 'נזק לחש גבוה', 'חיים נמוכים']),
    warrior: Object.freeze(['חיים גבוהים', 'מגן מובנה', 'קריטי חזק']),
    armorer: Object.freeze([
      'חליפת קרב טכנולוגית',
      'יכולות מתקררות מהר',
      'ירי מטווח',
      'מאוזן',
    ]),
  });

/** `37 § 7`, the third bullet, verbatim — the screen's one description line. */
export const CHARACTER_INTRO_HE =
  'ניתן לשינוי בכל רגע ממסך הבית, בלי לאבד רמה, גביעים, ציוד או שברים';

export function isArenaCharacter(value: unknown): value is ArenaCharacter {
  return typeof value === 'string' && (ARENA_CHARACTERS as readonly string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * `arcade_progress.avatar_parts` is `jsonb default '{}'` — anything may be in it.
 * Returns the character when `parts.character` is one of the three, else `null`.
 * ⛔ Never throws: `null`, a string, an array, a number, `{ character: 'x' }` ⇒ `null`.
 */
export function characterFromParts(parts: unknown): ArenaCharacter | null {
  if (!isPlainObject(parts)) return null;
  const candidate = parts.character;
  return isArenaCharacter(candidate) ? candidate : null;
}

/** The merged object the route writes back — every existing key kept, one key set. */
export function withCharacter(
  parts: unknown,
  character: ArenaCharacter,
): Readonly<Record<string, unknown>> {
  const existing = isPlainObject(parts) ? parts : {};
  return Object.freeze({ ...existing, character });
}
