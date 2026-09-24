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

/**
 * 🆕 **⟦19/09 · `C-0726`⟧ שש, ⛔ ולא שלוש — ו**בנוסף**, ⛔ ולא במקום.**
 * רוי: «תעצב כמה דמויות ⛔ לא מהרנדר … ו**שיהיו בנוסף**». ⇒ שלוש הראשונות ⛔ לא זזו,
 * ⛔ אף מספר שלהן ⛔ לא נגע, והסדר נשמר ⇒ בחירה שמורה ⛔ אינה נשברת.
 * ⛔ **ו⛔ אין מיגרציה:** הערך יושב ב-`arcade_progress.avatar_parts.character`, שהוא
 * ‏`jsonb default '{}'` — ⇒ מפתח קיים, ערך חדש. `characterFromParts` ממשיך להחזיר
 * ‏`null` על כל מה שאינו ברשימה, ⇒ שורה ישנה עם ערך לא מוכר ⛔ אינה זורקת.
 */
/**
 * 🥋 **⟦21/09 · `C-0755` · `T-444`⟧ שבע, ⛔ ולא שש — ושוב **בנוסף**, ⛔ ולא במקום.**
 * רוי: «**דמות שביעית לצד הקיימות**». ⇒ שש הראשונות ⛔ לא זזו, ⛔ אף מספר שלהן
 * ⛔ לא נגע, והסדר נשמר ⇒ בחירה שמורה ⛔ אינה מצביעה פתאום על דמות אחרת.
 * ⛔ **ו⛔ אין מיגרציה**, מאותה סיבה בדיוק שרשומה למעלה.
 */
export const ARENA_CHARACTERS = Object.freeze([
  'wizard', 'warrior', 'armorer', 'hunter', 'golem', 'shade', 'wanderer',
] as const);
export type ArenaCharacter = (typeof ARENA_CHARACTERS)[number];

/** `37 § 7`, column «דמות», verbatim. */
export const CHARACTER_LABELS_HE: Readonly<Record<ArenaCharacter, string>> = Object.freeze({
  wizard: 'קוסם',
  warrior: 'לוחם',
  armorer: 'שריונאי',
  hunter: 'צייד',
  golem: 'גולם',
  shade: 'צל',
  wanderer: 'נווד',
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
    hunter: Object.freeze(['קריטי קטלני', 'חיים בינוניים', 'נזק רגיל']),
    golem: Object.freeze(['חיים גבוהים מאוד', 'עור אבן', 'נזק רגיל']),
    shade: Object.freeze(['נזק גבוה מאוד', 'קריטי חזק', 'חיים בסיסיים']),
    /* 🥋 `C-0755` — שלוש שורות ש**כולן מגובות במספר** ב-`CHARACTER_STATS`:
       «חיים חסונים» ⇐ `learnerHp 16` · «צעד חמקני» ⇐ `swingPenalty 0` ·
       «נזק רגיל» ⇐ `hitDamage 1`/`criticalDamage 2`. ⇒ ⛔ אפס שורה חדשה
       ברשימת «⛔ טרם» של `§ 7`. */
    wanderer: Object.freeze(['חיים חסונים', 'צעד חמקני', 'נזק רגיל']),
  });

/**
 * `37 § 7`, the third bullet, verbatim - the screen's one description line.
 *
 * 🏷️ **`T-399` · `D-261` (which carries `D-131` into `§ 7`) - it names two things, ⛔ not four.**
 * 🔬 Measured `C-0664` by grep and on the live screen (`/dev/arcade/character`, 375x780),
 * ⛔ not assumed: this sentence named four things a learner cannot lose, while
 * `supabase/migrations/0014_arcade.sql` defines exactly three columns on `arcade_progress`
 * `arcade_level` · `wins` · `unlocked_items`. ⇒ two of those four ⛔ have no column,
 * `D-131` had already taken the shard chip off the home screen «until an economy is
 * written», and `components/ArenaHome.test.ts` locks its absence.
 * ⇒ the sentence was reassuring a learner about losing two things the product ⛔ cannot
 * hold, on the first screen the arena ever shows them.
 * ⛔ **⛔ Not a removal of the mechanic:** `37 § 9` and `§ 13` keep trophies and shards as
 * future mechanics. What moved is what is SAID to a learner today, and the two names come
 * back to this string the day they have a column.
 */
export const CHARACTER_INTRO_HE = 'ניתן לשינוי בכל רגע ממסך הבית, בלי לאבד רמה או ציוד';

/**
 * 🛡️ **⟦19/09 · `C-0737` · `T-438` · `D-270` ②⟧ איזו הגנה כל דמות מציבה.**
 *
 * ⚠️ **הכרעת רוי:** «לפי **סוג הדמות** — מכשף ⇒ **שדה**, לוחם ⇒ **חומה**».
 * ⛔ **והמיפוי כאן ⛔ ולא ברכיב**, מאותה סיבה ש-`CHARACTER_LABELS_HE` כאן:
 * עובדה על דמות שחיה בשני מקומות סוטה בשלישי.
 * 🔬 **והצל מקבל `field` ⛔ ולא `wall`, וזה ⛔ אינו טעם:** ל`צל` ⛔ אין רגליים
 * (`CHARACTER_HIDES`) — יצור שמרחף ⛔ אינו בונה לבנים.
 */
export const CHARACTER_GUARD: Readonly<Record<ArenaCharacter, 'wall' | 'field' | 'stakes'>> =
  Object.freeze({
    wizard: 'field',
    warrior: 'wall',
    armorer: 'wall',
    golem: 'wall',
    hunter: 'stakes',
    shade: 'field',
    /* 🥋 `C-0755` — הנווד **מציב**, ⛔ ואינו בונה: כפות ידיה פתוחות וריקות
       (הצללית), ⇒ `stakes` — אותה הנמקה בדיוק שנתנה `stakes` לצייד. */
    wanderer: 'stakes',
  });

/**
 * 🔥💧🪨💨 **⟦24/09 · `C-0784` · `T-445` · `D-277`ⓐ⟧ היסוד של כל דמות — ⛔ מראה בלבד.**
 *
 * ⚠️ **הכרעת PM:** היסוד שייך ל**דמות**, ⛔ ולא לקלף — יסוד לקלף היה שדה על `words`,
 * כלומר טענה על מילה ש⛔ אין לה מקור. ⇒ המפה כאן, לצד `CHARACTER_GUARD`, מאותה סיבה.
 * ⛔ **גדר 1 של `37 § 7`:** היסוד מזיז **מראה** — ⛔ לא נזק, ⛔ לא שעון ו⛔ לא תמהיל
 * מילים. ⇒ ⛔ אף פונקציה ב-`lib/core` ⛔ אינה קוראת אותו; רק הבמה מציירת אותו.
 * 🎨 **השיוך הוא בחירת DEV (`RULES § 0.22`, הפיך בקומיט אחד), לפי הצללית:**
 * קוסם ושריונר — אש (כדור הזוהר · הכור) · לוחם וגולם — אדמה (לבנים · סלע) ·
 * צייד וצל — אוויר (חץ · ריחוף) · נווד — מים (כפות פתוחות, זרימה).
 */
export const ARENA_ELEMENTS = Object.freeze(['fire', 'water', 'earth', 'air'] as const);
export type ArenaElement = (typeof ARENA_ELEMENTS)[number];

export const CHARACTER_ELEMENT: Readonly<Record<ArenaCharacter, ArenaElement>> = Object.freeze({
  wizard: 'fire',
  armorer: 'fire',
  warrior: 'earth',
  golem: 'earth',
  hunter: 'air',
  shade: 'air',
  wanderer: 'water',
});

export function isArenaCharacter(value: unknown): value is ArenaCharacter {
  return typeof value === 'string' && (ARENA_CHARACTERS as readonly string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * `arcade_progress.avatar_parts` is `jsonb default '{}'` — anything may be in it.
 * Returns the character when `parts.character` is one of the six, else `null`.
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
