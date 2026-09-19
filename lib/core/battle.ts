/**
 * T-176 · `37-arena-spec § 3–5` — **חוקי הקרב.** טהור: ⛔ אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שיודע מה קורה בקרב. `<ArenaBattle>` מצייר ו⛔ אינו מחשב —
 * רכיב שמוריד חיים בעצמו הוא עותק שני של החוק, והשני תמיד סוטה. הקובץ מחליף את
 * `lib/core/arcadeBattle.ts`, שנמחק **באותו קומיט** ⛔ ולא «אחר כך»: שני חוקי קרב
 * שחיים יחד ולו קומיט אחד הם בדיוק אותה סטייה, בשני מקומות.
 *
 * ⛔ **⛔ אין כאן `setTimeout` · `setInterval` · `Date.now` · `requestAnimationFrame`**
 * (D-126 § ג׳). ‏`elapsedMs` הוא **קלט** בכל קריאה, ולולאת ה-`requestAnimationFrame`
 * היחידה חיה במסך. שלוש סיבות, וכולן מדידות:
 *   1. **בדיקת השומר שורדת במקום להימחק** — האיסור משנה משמעות («⛔ אין שעון נסתר»)
 *      ⛔ ולא נמחק. מחיקת שומר בלי שהוא מוחלף היא מה שהפיל את `T-164`.
 *   2. **90 שניות נבדקות ב-0 שניות** — טיימר אמיתי היה מוסיף 90 שניות לכל `npm run verify`.
 *   3. **`prefers-reduced-motion` נשאר עניין של המסך בלבד** (חוקה שכבה א׳ · א7) ⇒ לומד
 *      שכיבה תנועה מקבל **אותו קרב בדיוק**.
 *
 * ⛔ **אינווריאנט `37 § 13.1`:** הזירה ⛔ אינה כותבת ל-`word_progress` ו⛔ אינה מזיזה
 * SM-2. אף פעם. ⛔ הערה אינה אכיפה — `battle.test.ts` סורק את המקור.
 *
 * ✅ **ניקוד בזירה מותר** (`36 § 2` שורה 7 הגבילה את D-050 ל«מחוץ לזירה»), ולכן האיסור
 * `xp|score|points|coin` של `arcadeBattle.test.ts:100-102` ⛔ **אינו** עובר לכאן.
 */
import type { ArenaWord, ArenaWordKind } from './arenaWords';
import type { ArenaCharacter } from './arenaCharacter';
import { isArenaCharacter } from './arenaCharacter';

/** `37 § 3` — **שעון אחד לקרב שלם**, ⛔ ולא טיימר לשאלה. */
export const BATTLE_MS = 90_000;
/** `37 § 3` — 20 השניות האחרונות הן `זמן זעם`: מאנה כפולה. */
export const RAGE_FROM_MS = 70_000;
/** `37 § 3` — היריב מתקיף **בקצב עצמאי**, ⛔ ללא תלות בקצב התשובות. */
export const ENEMY_SWING_MS = 8_000;
/** `37 § 4` — מאנה 1 ל-2 שניות. */
export const MANA_MS = 2_000;
/** `37 § 4` — תקרה 10. */
export const MANA_CAP = 10;
/** `37 § 5` — מתחת ל-1.5 שניות: קריטי. */
export const CRITICAL_MS = 1_500;

/** ⛔ מכה אחת = חיים אחד. הפער בין מכה למכה נוצר מ-`§ 5` («המכה הבאה חזקה יותר») ⛔ ולא מהבסיס. ⛔ ⛔ אינו עמודה ב-`§ 7` — זהה לשלוש הדמויות (גדר 1). */
const SWING_DAMAGE = 1;

/**
 * `37 § 2` — «מילה לא מסוננת … צדקת — **נזק מוגבר**». ⛔ תוספת ⛔ ולא מכפיל: מכפיל היה
 * הופך קריטי על מילה לא מסוננת ל-4, כלומר 40% מחיי היריב בהטלה אחת.
 */
export const UNFILTERED_BONUS_DAMAGE = 1;

/**
 * T-281 · `37 § 7` «ההטיה כמספרים» · D-200 — **the four columns of the table, ⛔ and no
 * fifth.** The character choice stops being a skin: `startBattle` is given the character,
 * and `cast` reads damage and penalty from `state.stats`, ⛔ never from a module constant.
 * ⛔ The table is a spec, ⛔ not content — no number reaches the choice screen (`§ 7`, second
 * bullet), and `battle.test.ts` parses the markdown table out of the spec so nothing here
 * can be typed from memory. `lib/core/arenaCharacter.ts` stays the **words** file
 * (`RULES § 0.22` ⓐ, logged in the tick report).
 *
 * ⛔ **The four fences of `§ 7`, each with its own test:** ⓵ the bias ⛔ never touches how
 * much English the learner meets — `BATTLE_MS` · `MANA_MS` · `MANA_CAP` · `CRITICAL_MS` ·
 * `ENEMY_SWING_MS` · the `§ 2` mix · what counts as correct are module constants, identical
 * for all three; ⓶ `learnerHp ≥ 12` (11 clean swings ⛔ never lose a battle); ⓷
 * `criticalDamage > hitDamage`; ⓸ the numbers live here, ⛔ not in a component, and an
 * unknown or `null` character ⇒ the base row, ⛔ never a throw.
 */
export interface CharacterBattleStats {
  readonly learnerHp: number;
  readonly hitDamage: number;
  readonly criticalDamage: number;
  readonly swingPenalty: number;
}

/** `37 § 7` row «בסיס». Also the row for `null` and for anything unknown (fence 4). */
export const BASE_STATS: CharacterBattleStats = Object.freeze({
  learnerHp: 12,
  hitDamage: 1,
  criticalDamage: 2,
  swingPenalty: 1,
});

/** `37 § 7`, the three rows under «בסיס», verbatim — the test parses the spec table. */
export const CHARACTER_STATS: Readonly<Record<ArenaCharacter, CharacterBattleStats>> =
  Object.freeze({
    wizard: Object.freeze({ ...BASE_STATS, hitDamage: 2, criticalDamage: 3 }),
    warrior: Object.freeze({ ...BASE_STATS, learnerHp: 18, criticalDamage: 3, swingPenalty: 0 }),
    armorer: BASE_STATS,
    /**
     * 🆕 `C-0726` — שלוש שורות חדשות מ-`37 § 7`, **וכל אחת עוברת את שלוש הגדרות**:
     * גדר 2 `learnerHp >= 12` · גדר 3 `criticalDamage > hitDamage` · גדר 1 ⛔ אפס
     * מפתח חדש. ⛔ **ו⛔ אף מספר של שלוש הראשונות ⛔ לא זז.**
     */
    hunter: Object.freeze({ ...BASE_STATS, learnerHp: 14, criticalDamage: 4 }),
    golem: Object.freeze({ ...BASE_STATS, learnerHp: 24, swingPenalty: 0 }),
    shade: Object.freeze({ ...BASE_STATS, hitDamage: 3, criticalDamage: 4 }),
  });

/** Moved from `ArenaBattle.tsx` (T-281, `RULES § 0.22` ⓑ). ⛔ One enemy for all three (fence 1). */
export const ENEMY_HP = 20;

/** Fence 4 — ⛔ never throws: `null`, `undefined`, `'Wizard'`, `7`, `{}` ⇒ `BASE_STATS`. */
export function statsFor(character: unknown): CharacterBattleStats {
  return isArenaCharacter(character) ? CHARACTER_STATS[character] : BASE_STATS;
}

/**
 * ⛔ **ארבעה מוצאים, ⛔ ולא שלושה** (D-126 § ד׳). ההערה ב-`arcadeBattle.ts:24` («⛔ שני
 * מוצאים … «הפסד» אינו מצב») **בוטלה**: `37 § 3` קובע «בתום השעון מנצח אחוז החיים
 * הגבוה» ⇒ הפסד **הוא** מצב.
 * ⛔ **והמילה «הפסדת» ⛔ אינה מופיעה על המסך אף פעם** — `37 § 9` ח4 קובע מסגור
 * «היית 2 מילים מהבוס». ⇒ **המצב קיים, הנוסח ⛔ לא.**
 */
export type BattleOutcome = 'running' | 'victory' | 'survived' | 'outlasted';

export interface BattleCast {
  readonly wordId: string;
  readonly correct: boolean;
  readonly responseMs: number;
  readonly critical: boolean;
  /**
   * T-282 · `37 § 2` — the kind of the word AT CAST TIME. `cast` requeues a missed
   * `unfiltered` spell as `base` (`:216-217`), so `unfiltered` here marks exactly the
   * first meeting, once per word. ⛔ Read by `summarize`; ⛔ never sent to the API
   * (`ArenaBattle.tsx:501-508` builds `ArcadeAnswer` by field).
   */
  readonly kind: ArenaWordKind;
}

export interface BattleState {
  readonly words: readonly ArenaWord[];
  readonly index: number;
  readonly learnerHp: number;
  readonly learnerHpMax: number;
  readonly enemyHp: number;
  readonly enemyHpMax: number;
  /**
   * ⚠️ **סטייה מדודה משם השדה בתוכנית (§ 5), ⛔ ולא מהחתימה.** התוכנית קראה לו `mana`,
   * ו-`manaAt(elapsed, spent)` מקבלת **מה שהוצא** ⛔ ולא את המפלס. שדה בשם `mana`
   * שנושא את ההוצאה הוא שם משקר, ו⛔ הריפו הזה כבר שילם על אחד כזה
   * (`ArcadeCandidate.distractorsEn`). המפלס נגזר תמיד מ-`manaAt`, ⇒ מקום אחד.
   */
  readonly manaSpent: number;
  /**
   * ⚡ **T-363 · `37 § 4` — «נזק כפול עכשיו».** `true` אחרי `כפול` ועד ההטלה הנכונה
   * הבאה. ⛔ **הטלה שגויה ⛔ אינה צורכת אותו:** היא ⛔ אינה פוגעת כלל (`cast`: `damage = 0`),
   * ⇒ צריכה עליה הייתה גובה 4 מאנה תמורת ⛔ כלום — ענישה על טעות, וזה בדיוק מה ש-`§ 5`
   * («⛔ אין מצב כישלון על איטיות») ו-R-016 אוסרים.
   */
  readonly pendingDouble: boolean;
  /** מתי המילה הנוכחית עלתה למסך — הבסיס ל`§ 5` («הנזק נגזר ממהירות התשובה»). */
  readonly shownAtMs: number;
  /** ה-`elapsedMs` של המכה האחרונה שכבר יושמה. ⛔ הקצב עצמאי, ולכן הוא נמדד מהשעון. */
  readonly lastSwingMs: number;
  /** `§ 5` — אחרי תשובה שגויה, המכה הבאה **בלבד** חזקה יותר. */
  readonly pendingPenalty: number;
  /** `37 § 6` — המכה שהלומד התגלגל ממנה. ⛔ אחת: החסינות שייכת למכה ש**הוכרזה**. */
  readonly dodgedSwing: number | null;
  /**
   * 🛡️ **T-363 — ⛔ איך הגיעה החסינות, ⛔ ולא רק שהיא כאן.** ‏`§ 6` (גלגול) ו-`§ 4`
   * (‏`מגן`) מגיעות לאותה חסינות בדיוק, ⇒ שדה אחד היה מספיק ל-`tick` — ⛔ אבל המסך
   * אומר «התחמקות!» על אחת ו«מגן» על השנייה, ⛔ ושתיהן ⛔ לא היו ניתנות להבחנה.
   * ⛔ ⛔ אינו חוק שני: `tick` ⛔ אינו קורא אותו כלל.
   */
  readonly immuneBy: 'dodge' | 'shield' | null;
  /**
   * 🛣️ **`null` ⇒ הלומד ⛔ טרם בחר נתיב, והיריב **עוקב** אחריו.**
   *
   * 🔴 **וזה ⛔ אינו נוחות — זה מה ש`§ 6` כבר מבטיח.** הטבלה שם קובעת «לא התחמקת —
   * נזק», ⇒ לומד ש⛔ לא נגע במסך **חייב** לספוג את כל אחת-עשרה המכות של 90 השניות.
   * 🔬 **נמדד:** כלל נאיבי מהצורה «המתקפה מכוונת לפי `swingIndex`» מאדים **ארבע**
   * בדיקות נעולות (‏`battle.test.ts:75` · `:223` · `:238` · `:598`), כי הוא מעניק
   * חסינות למי ש⛔ מעולם ⛔ לא זז. ⇒ כל עוד השדה `null`, `aimLaneAt` מחזיר `CENTRE`,
   * שהוא גם המקום שבו עומד מי שלא זז — והמכה נוחתת, כלשון המפרט.
   */
  readonly heroLane: Lane | null;
  /**
   * 🛡️ **⟦19/09 · `T-438` · `D-270` ①⟧ ההגנה המוצבת — הנתיב שהיא יושבת בו,
   * או `null` כשאין הגנה על המגרש.**
   *
   * 🔴 **ולמה זה שדה ב-`BattleState` ו⛔ לא ב-`CharacterBattleStats`:** גדר 1
   * של `§ 7` קובעת **ארבעה** מפתחות לדף הדמות, ⛔ ואין חמישי. ההגנה היא
   * **מצב של הקרב**, ⛔ ולא נתון של הדמות — מה שהדמות קובעת הוא רק איך היא
   * **נראית** (`38 § 3ב`).
   *
   * ⛔ **ונכתב רק בשני רגעים בדידים** — בהצבה ובבליעה. ⛔ **⛔ לא בכל פריים**:
   * `tick` **חייב להחזיר את אותה הפניה** כשאף מכה לא זזה, וזו בדיקה נעולה.
   */
  readonly guardLane: Lane | null;
  readonly casts: readonly BattleCast[];
  /** T-281 — the `37 § 7` row `startBattle` was given. `cast` reads damage and penalty from here. */
  readonly stats: CharacterBattleStats;
}

/**
 * T-281 — `(words, character)`, ⛔ ולא `(words, learnerHpMax, enemyHpMax)`: פיקסצ׳ר
 * שמתחיל קרב ב-`3/20` הוא קרב שאינו קיים בייצור. חיי הלומד הם שורת `§ 7` של הדמות,
 * חיי היריב הם `ENEMY_HP` לכולן.
 */
export function startBattle(
  words: readonly ArenaWord[],
  character: ArenaCharacter | null = null,
): BattleState {
  const stats = statsFor(character);
  return {
    words,
    index: 0,
    learnerHp: stats.learnerHp,
    learnerHpMax: stats.learnerHp,
    enemyHp: ENEMY_HP,
    enemyHpMax: ENEMY_HP,
    manaSpent: 0,
    pendingDouble: false,
    shownAtMs: 0,
    lastSwingMs: 0,
    pendingPenalty: 0,
    dodgedSwing: null,
    immuneBy: null,
    heroLane: null,
    guardLane: null,
    casts: [],
    stats,
  };
}

/**
 * `37 § 4` — 1 ל-2 שניות, תקרה 10, ו**כפול ב`זמן זעם`**.
 * ⛔ **מענה ⛔ אינו מעלה מאנה אף פעם** — הלמידה ⛔ אינה נחסמת מאחורי משאב, ולכן
 * הפונקציה תלויה בשעון ובהוצאה בלבד ו⛔ אינה מכירה תשובות.
 */
export function manaAt(elapsedMs: number, spent: number): number {
  const calm = Math.min(Math.max(0, elapsedMs), RAGE_FROM_MS);
  const raging = Math.max(0, elapsedMs - RAGE_FROM_MS);
  const earned = Math.floor(calm / MANA_MS) + Math.floor(raging / MANA_MS) * 2;
  return Math.max(0, Math.min(MANA_CAP, earned - spent));
}

export function isRage(elapsedMs: number): boolean {
  return elapsedMs >= RAGE_FROM_MS;
}

/**
 * `37 § 3` — «בתום השעון מנצח **אחוז** החיים הגבוה». ⛔ אחוז ⛔ ולא מספר: שני הצדדים
 * ⛔ אינם חולקים סולם, ולכן השוואת מספרים גולמיים הייתה מכריעה לפי גודל פס.
 */
export function outcomeAt(state: BattleState, elapsedMs: number): BattleOutcome {
  if (state.enemyHp <= 0) return 'victory';
  if (state.learnerHp <= 0) return 'survived';
  if (elapsedMs < BATTLE_MS) return 'running';
  const learnerShare = state.learnerHp / Math.max(1, state.learnerHpMax);
  const enemyShare = state.enemyHp / Math.max(1, state.enemyHpMax);
  return learnerShare > enemyShare ? 'outlasted' : 'survived';
}

/**
 * T-283 · `37 § 9` ח4 — «היית 2 מילים מהבוס». How many more CORRECT casts, at any speed,
 * would have emptied the enemy's bar: `ceil(enemyHp / hitDamage)`. `0` once the enemy is
 * down. ⛔ `hitDamage`, ⛔ not `criticalDamage` (RULES § 0.22 call, logged in the build
 * report): the sentence must stay true WITHOUT a condition on speed — N slow correct
 * answers always finish the enemy; N fast ones is a promise about tempo. ⛔ Never divides
 * by zero: `§ 7` fence 3 keeps `hitDamage ≥ 1`, and `Math.max` guards an unknown row.
 */
export function wordsFromBoss(state: BattleState): number {
  if (state.enemyHp <= 0) return 0;
  return Math.ceil(state.enemyHp / Math.max(1, state.stats.hitDamage));
}

/**
 * `37 § 5` — הטלת לחש. **הנזק נגזר ממהירות התשובה**, ומתחת ל-1.5 שניות הוא קריטי.
 * ⛔ **ואין מצב כישלון על איטיות:** נכונה איטית עדיין פוגעת, רק פחות.
 * שגויה ⇒ הלחש מתפוגג (⛔ אפס נזק) והמכה הבאה של היריב חזקה יותר.
 */
export function cast(state: BattleState, chosen: string, elapsedMs: number): BattleState {
  const word = state.words[state.index];
  if (word === undefined) return state;

  const responseMs = Math.max(0, elapsedMs - state.shownAtMs);
  const correct = chosen === word.translationHe;
  const critical = correct && responseMs < CRITICAL_MS;
  const bonus = correct && word.kind === 'unfiltered' ? UNFILTERED_BONUS_DAMAGE : 0;
  const base = correct ? (critical ? state.stats.criticalDamage : state.stats.hitDamage) + bonus : 0;
  // ⚡ T-363 · `37 § 4` — «נזק כפול». ⛔ **מכפיל ⛔ ולא תוספת**, וזה מה שהרנדר קורא לו
  // (`render_video_B.py:487`, התג `נזק כפול`). ⛔ הוא מוכפל **אחרי** בונוס `§ 2`, כי שניהם
  // מתארים את אותה הטלה — ⛔ ואין כאן מכפיל שני שמתחבא בסדר הפעולות.
  const damage = correct && state.pendingDouble ? base * 2 : base;

  // `§ 2` — «טעית — הלחש חוזר אליך». ⛔ **פעם אחת בלבד**: המילה החוזרת נכנסת כ-`base`,
  // ולכן שגיאה שנייה עליה ⛔ אינה מחזירה אותה שוב ו⛔ אין לולאה שאינה נגמרת.
  // ⛔ **ואין עונש נוסף** — `pendingPenalty` זהה לכל שגיאה אחרת (שורת המשימה, ⓒ).
  // ⛔ האינווריאנט `casts[i] ↔ words[i]` נשמר: `cast` תמיד קורא `words[index]` ותמיד
  // מקדם את `index` ב-1, ⇒ הוספה **בזנב** ⛔ אינה יכולה להזיז משבצת שכבר נוצקה.
  const requeue = !correct && word.kind === 'unfiltered';
  const words = requeue ? [...state.words, { ...word, kind: 'base' as const }] : state.words;

  return {
    ...state,
    words,
    index: state.index + 1,
    // ⛔ `Math.max(0, …)` — חיים שליליים הם מצב שאין לו ציור.
    enemyHp: Math.max(0, state.enemyHp - damage),
    shownAtMs: elapsedMs,
    pendingPenalty: correct ? 0 : state.stats.swingPenalty,
    pendingDouble: correct ? false : state.pendingDouble,
    casts: [...state.casts, { wordId: word.wordId, correct, responseMs, critical, kind: word.kind }],
  };
}

/**
 * T-220 ⓓ · D-139 — **the spell comes back REVEALED.** After a wrong cast on an `unfiltered`
 * word, `cast` above requeues it at the tail; this names that word so the screen can show
 * its Hebrew translation at the moment of the error, before the learner meets it again.
 * ⛔ Derived, ⛔ not stored: it is true exactly while the LAST cast was wrong on a word that
 * was `unfiltered` when cast (the tail copy is `base`, so a second miss never reveals twice),
 * and the next cast clears it by moving `index`. Not new pedagogy (R-010): tap ⇒ translation
 * is what `StoryScreen` already does. `null` in every other state.
 */
export function returnedSpell(state: BattleState): ArenaWord | null {
  const last = state.casts[state.casts.length - 1];
  const word = state.words[state.index - 1];
  if (last === undefined || word === undefined) return null;
  if (last.correct || word.kind !== 'unfiltered' || word.wordId !== last.wordId) return null;
  return word;
}

/**
 * `37 § 3` — קצב היריב. ⛔ **הפונקציה אידמפוטנטית ביחס לשעון**: `lastSwingMs` נושא את
 * המכה האחרונה שיושמה, ולכן קריאה שנייה על אותו `elapsedMs` ⛔ אינה מכה פעמיים.
 * זו הסיבה שהיא בטוחה בתוך לולאת `requestAnimationFrame` שרצה 60 פעמים בשנייה.
 */
export function tick(state: BattleState, elapsedMs: number): BattleState {
  const due = Math.floor(Math.max(0, elapsedMs) / ENEMY_SWING_MS);
  const applied = Math.floor(Math.max(0, state.lastSwingMs) / ENEMY_SWING_MS);
  const swings = due - applied;
  // T-231 ⓒ · `apple-design` § 1/§ 11 — **אותה הפניה, ⛔ ולא עותק שווה, כשלא זזה מכה.**
  // ⛔ עד כאן הענף הזה עשה `{...state, lastSwingMs: elapsedMs}` על **כל** פריים —
  // כלומר הפניה חדשה 60 פעם בשנייה, ו-`setBattle((prev) => tick(prev, next))` ⛔ לעולם
  // לא בלם רינדור. ⚠️ **הרפיה חסרת סיכון:** `applied` נועד רק לספור כמה מכות כבר
  // יושמו, ו-`floor(elapsedMs/ENEMY_SWING_MS)` הוא אותו מספר בלי קשר לאיזה ערך בתוך
  // אותו חלון `lastSwingMs` מחזיק — קבוע לעדכן אותו על כל פריים ⛔ אינו נדרש לחשבון,
  // רק לגריפה חדשה. `lastSwingMs` ⛔ אינו נקרא מחוץ לקובץ הזה (נבדק ב-grep).
  if (swings <= 0) return state;

  // `§ 6` — ⛔ החסינות מבטלת **מכה אחת מזוהה**, ⛔ ולא «את הנזק»: אם שתי מכות התאחדו
  // בפריים אחד (חלון שנרדם, מכשיר איטי), השנייה עדיין פוגעת. ⛔ «התגלגלתי פעם אחת
  // ולא נפגעתי שלוש» הוא בדיוק סוג החור ש-2,403 בדיקות ירוקות לא תופסות.
  // 🛣️ **⟦`T-433`⟧ שני מקורות לחסינות, ⛔ ולא אחד — והלולאה היא **הכללה** של הדגל
  //    שהיה כאן, ⛔ ולא החלפתו:** למכה מסומנת אחת בטווח היא מחזירה בדיוק את אותה
  //    תוצאה, ⇒ `מגן`, `הקפאה` ו«גלגול == מגן» נשארים ירוקים מילה במילה.
  //    ⓐ `dodgedSwing` — גלגול (`§ 6`) או היכולת `מגן` (`§ 4`) · ⓑ **הנתיב**: עמדת
  //    במקום אחר כשהמכה נחתה. ⛔ ו-ⓑ ⛔ אינו צורך את ⓐ — מי שעמד בטוח שומר את הגלגול.
  let landed = 0;
  let spent = false;
  // 🔴 **והסדר כאן הוא מכניקה, ⛔ ולא סגנון:** הנתיב נבדק **ראשון**, ⇒ מי שכבר עמד
  //    בטוח ⛔ אינו משלם על כך בגלגול שלו — הוא נשאר לו למכה הבאה. הסדר ההפוך היה
  //    גובה מטבע עבור סכנה ש⛔ לא הייתה. ⛔ **ואת הבדיקות הנעולות זה ⛔ אינו מזיז:**
  //    שם `heroLane` הוא `null` ⇒ `aimLaneAt` מחזיר `CENTRE` = `laneOf` ⇒ הענף
  //    הראשון ⛔ לעולם אינו נלקח, והמסלול הוא בדיוק זה שהיה.
  // 🛡️ **⟦`T-438`⟧ מקור שלישי לחסינות — ו**הסדר בתוך הלולאה הוא מכניקה**.**
  //    ⓐ **נתיב בטוח** ⛔ אינו צורך דבר · ⓑ **גלגול/`מגן`** צורכים את החסינות
  //    · ⓒ **ההגנה המוצבת** נשברת. ⇒ ההגנה היא ה**אחרונה** שנצרכת, בכוונה:
  //    ⛔ **היא ⛔ אינה נשברת לריק.** מי שכבר עמד בטוח או כבר התגלגל שומר אותה
  //    למכה הבאה — וזה מה שהופך אותה ל«תכנון» ⛔ ולא ל«מס».
  //    🔴 **והיא נשברת **פעם אחת**:** ‏`guardBroken` נצרך בדיוק כמו `spent`, ⇒
  //    שתי מכות שהתאחדו בפריים אחד ⛔ אינן נבלעות שתיהן בקיר אחד.
  let guardBroken = false;
  for (let i = applied + 1; i <= due; i += 1) {
    if (laneOf(state) !== aimLaneAt(state, i)) continue;
    if (state.dodgedSwing === i) { spent = true; continue; }
    if (!guardBroken && state.guardLane === aimLaneAt(state, i)) { guardBroken = true; continue; }
    landed += 1;
  }
  const immune = spent;
  // ⛔ העונש חל על **המכה הבאה בלבד** (`§ 5`), ולכן הוא נצרך פעם אחת ⛔ ולא לכל מכה בקבוצה.
  // ⛔ והמכה שנמנעה לוקחת איתה את העונש שהיה תלוי בה — הוא חל על **המכה הבאה**, וזו
  // ⛔ לא הגיעה.
  const damage = landed === 0 ? 0 : landed * SWING_DAMAGE + state.pendingPenalty;
  return {
    ...state,
    learnerHp: state.learnerHp - damage,
    lastSwingMs: elapsedMs,
    pendingPenalty: 0,
    dodgedSwing: immune ? null : state.dodgedSwing,
    /* 🛡️ **⟦`T-438`⟧ ⛔ **ההגנה ⛔ אינה נכנסת ל-`immuneBy`, וזה נשקל ונדחה.**
       🔬 השדה הזה **מצומד** ל-`dodgedSwing`: הוא אומר «איך הגיעה החסינות
       ה**תלויה**», והמסך מצייר אותו **רק** כש-`dodgedSwing !== null`. ⇒ ערך
       `'guard'` שם היה ⓐ ⛔ לעולם ⛔ לא מצויר, ו-ⓑ **נדבק** — כי ⛔ שום ענף
       ⛔ אינו מנקה אותו — ⇒ גלגול מאוחר יותר היה מוצג כ«חומה!».
       ⛔ **וזו בדיוק מחלקת `F-305`** ⟨מצב שנדבק⟩, ⇒ ⛔ לא נפתחה כאן שנייה.
       ⇒ הבליעה נגזרת במסך מ-`guardLane` שעובר ל-`null`, כמצב **בדיד**. */
    immuneBy: immune ? null : state.immuneBy,
    guardLane: guardBroken ? null : state.guardLane,
  };
}

/**
 * `37 § 6` — **הטלגרף.** ⚠️ **המספרים הם של המפרט, וההעגנה היא חשבון ⛔ ולא המצאה:**
 * `§ 6` קובע שהוא **6.0 שניות שנגמרות במכה**, ו-`§ 3` קובע שהמכות **8.0 שניות זו מזו**.
 * שתיהן מתקיימות בסידור אחד בלבד — הטעינה של מכה `n` מתחילה ב-`n·8000 − 6000`, כלומר
 * **2.0 שניות אחרי המכה הקודמת**. ⛔ `tick` ⛔ לא השתנה בקצב: המכות עדיין נוחתות ב-`n·8000`.
 * ⛔ החלטה הפיכה (`RULES § 0.22`), ונרשמה בסיכום הטיק.
 */
export const TELEGRAPH_MS = 6_000;
/** `§ 6` — «הכרזה 5.3 ש׳»: ידיים מורמות, גוון סגול, המד מהבהב. */
export const ANNOUNCE_AT_MS = 5_300;
/** `§ 6` — «חלון 5.3 עד 5.7 ש׳». ⛔ 400ms, וזה כל הרוחב. */
export const WINDOW_END_MS = 5_700;

/**
 * 🛣️ **⟦19/09 · `T-433` · `D-269` ①⟧ שלושה נתיבים — `37 § 5`.**
 *
 * 🔬 **הפער שנמדד, ⛔ ולא שוער:** `§ 5` קובע «מחווה על הזירה = **תזוזת דמות, לצדדים
 * בלבד**», ו-`resolveGesture` **כבר** מחזיר `{kind:'move', dx}` מאז שנכתב —
 * ‏`ArenaBattle.tsx` קרא ל-`dodge` ו**זרק את `dx`**. ⇒ «תזוזת דמות» היה שם של מחווה
 * ש⛔ אינה מזיזה דבר.
 *
 * ⛔ **פיזי, ⛔ ולא לוגי:** `-1` הוא שמאל **על המסך**. ⛔ RTL ⛔ אינו הופך אצבע.
 */
export type Lane = -1 | 0 | 1;
export const CENTRE: Lane = 0;

/** שמות לתכונת ה-DOM. ⛔ הבמה ⛔ אינה מחשבת מספרים. */
export const LANE_NAMES: Readonly<Record<Lane, 'left' | 'centre' | 'right'>> = Object.freeze({
  [-1]: 'left', 0: 'centre', 1: 'right',
});

export type TelegraphPhase = 'quiet' | 'charging' | 'window' | 'committed';

export interface Telegraph {
  readonly phase: TelegraphPhase;
  readonly frac: number;
  readonly swingIndex: number;
}

/**
 * ⛔ **טהורה ביחס לשעון:** `elapsedMs` הוא קלט, ולכן ארבעת הגבולות נבדקים ב-0ms
 * ⛔ ולא ב-90 שניות. אותו נימוק בדיוק שבגללו `battle.ts` ⛔ אינו מכיר `Date.now`.
 */
export function telegraphAt(elapsedMs: number): Telegraph {
  const t = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const swingIndex = Math.floor(t / ENEMY_SWING_MS) + 1;
  const into = t - (swingIndex * ENEMY_SWING_MS - TELEGRAPH_MS);
  if (into < 0) return { phase: 'quiet', frac: 0, swingIndex };
  if (into < ANNOUNCE_AT_MS) return { phase: 'charging', frac: into / ANNOUNCE_AT_MS, swingIndex };
  if (into < WINDOW_END_MS) return { phase: 'window', frac: 1, swingIndex };
  return { phase: 'committed', frac: 1, swingIndex };
}

/**
 * `§ 6` — «החלקה לצד = **גלגול עם חסינות**». ⛔ מחוץ לחלון היא ⛔ אינה עושה דבר
 * ו⛔ אינה עולה חיים: `§ 6` מחייב אותה ב**טמפו** ⛔ ולא בנזק, ו⛔ אין כאן טמפו למדוד.
 * ⛔ **והיא ⛔ אינה עוצרת את השעון** — `elapsedMs` ⛔ אינו נגזר מהמצב.
 */
export function dodge(state: BattleState, elapsedMs: number): BattleState {
  const telegraph = telegraphAt(elapsedMs);
  if (telegraph.phase !== 'window') return state;
  if (state.dodgedSwing === telegraph.swingIndex) return state;
  return { ...state, dodgedSwing: telegraph.swingIndex, immuneBy: 'dodge' };
}

/**
 * 🎯 **⟦19/09 · `T-433`⟧ לאיזה נתיב המכה מכוונת — מחזור קפוא, ⛔ ולא אקראי.**
 *
 * ⛔ **`Math.random` ⛔ אינו אפשרי כאן ו⛔ גם לא היה רצוי:** אקראיות ⛔ אינה ניתנת
 * לטלגרף הוגן ו⛔ אינה ניתנת לבדיקה. מחזור הוא שניהם.
 * ⚠️ **והמרכז מופיע פעמיים בכוונה:** הנתיב שאליו לומד **נסחף בחזרה** הוא זה שנענש.
 * ⛔ **הכרעה הפיכה** (`RULES § 0.22`): PM או רוי מחליפים את המערך בקומיט אחד,
 * ⛔ ובלי שאף פונקציה תשתנה.
 */
export const AIM_CYCLE: readonly Lane[] = Object.freeze([0, -1, 0, 1]);

/**
 * ⛔ **הנוסחה המתבקשת `swingIndex % 3 - 1` שגויה כאן, וזה נמדד:** היא מכוונת את
 * המכה השנייה ל-`+1` ⇒ `battle.test.ts:238` («החסינות שייכת למכה אחת») מאדים.
 */
export function aimLaneAt(state: BattleState, swingIndex: number): Lane {
  if (state.heroLane === null) return CENTRE;
  const i = Math.max(1, Math.floor(Number.isFinite(swingIndex) ? swingIndex : 1));
  return AIM_CYCLE[(i - 1) % AIM_CYCLE.length] as Lane;
}

/** איפה הלומד עומד בפועל. ⛔ `null` הוא «טרם בחר», ⛔ ולא «אין מקום». */
export function laneOf(state: BattleState): Lane {
  return state.heroLane ?? CENTRE;
}

/** האם הנתיב שבו הוא עומד **בטוח** מול המכה הקרובה. נגזר, ⇒ ⛔ אינו יכול לסטות. */
export function isSafeLane(state: BattleState, elapsedMs: number): boolean {
  const telegraph = telegraphAt(elapsedMs);
  return laneOf(state) !== aimLaneAt(state, telegraph.swingIndex);
}

/**
 * 🛣️ תזוזה של **נתיב אחד** לכיוון האצבע.
 * ⛔ **אותה הפניה בקיר** ⇒ ⛔ אין רינדור, ו⛔ אין נתיב מומצא.
 */
export function moveLane(state: BattleState, dx: number): BattleState {
  if (!Number.isFinite(dx) || dx === 0) return state;
  const to = Math.max(-1, Math.min(1, laneOf(state) + Math.sign(dx))) as Lane;
  if (to === state.heroLane) return state;
  return { ...state, heroLane: to };
}

/**
 * ⛔ **כניסה אחת, ⛔ ולא שתי פעולות שהמסך מרצף.** החלקה **מזיזה** (`§ 5`)
 * ו**בתוך החלון גם מגלגלת** (`§ 6`) — ⇒ הגלגול ⛔ לא בוטל, הנתיב **נוסף** לו.
 */
export function swipe(state: BattleState, dx: number, elapsedMs: number): BattleState {
  return dodge(moveLane(state, dx), elapsedMs);
}

/**
 * 🛡️ **⟦19/09 · `T-438` · `D-270` ①⟧ ההגנה המוצבת — מחיר המאנה.**
 *
 * ⛔ **4, ⛔ ולא 3 ⟨`מגן`⟩ ו⛔ לא 5 ⟨`הקפאה`⟩, וזה נגזר ⛔ ולא נבחר:** היא
 * **חזקה יותר** מ-`מגן` — היא שורדת בין מכות ואפשר להציב אותה לפני שהטלגרף
 * בכלל התחיל — ⇒ היא ⛔ אינה יכולה לעלות פחות ממנו. ⛔ **ופחות מ-`הקפאה`**,
 * שעוצרת את היריב לגמרי.
 *
 * 🔴 **והמחיר האמיתי הוא ויתור על `כפול` ⟨4⟩** — בדיוק אותו מספר. ⇒ כל הצבה
 * היא **החלטה**: להגן, או להכות חזק. וזו השכבה האסטרטגית היחידה שיש לזירה.
 */
export const GUARD_COST = 4;

/**
 * האם אפשר להציב עכשיו. ⛔ **שני תנאים, ⛔ ולא אחד:** מאנה, **ו⛔ אין כבר
 * הגנה על המגרש** — אחרת הצבה שנייה הייתה גובה מאנה ו⛔ לא משנה דבר.
 */
export function canPlaceGuard(state: BattleState, elapsedMs: number): boolean {
  return state.guardLane === null && manaAt(elapsedMs, state.manaSpent) >= GUARD_COST;
}

/**
 * 🛡️ **מציבה את ההגנה בנתיב שהלומד עומד בו.**
 *
 * ⛔ **ומחזירה את **אותה הפניה** כשאי-אפשר** — בדיוק כמו `moveLane` בקיר וכמו
 * `dodge` מחוץ לחלון. ⇒ הרכיב יכול לקרוא לה בלי לשאול, ו-React בולם.
 *
 * 🔴 **`laneOf` ⛔ ולא `state.heroLane`:** לומד שעוד ⛔ לא בחר נתיב עומד
 * ב**מרכז** ⟨`heroLane === null`⟩, ⇒ שם ההגנה מוצבת. ⛔ אחרת הצבה ראשונה
 * הייתה נופלת על `null` ומייצרת הגנה שאיש ⛔ אינו עומד בה.
 */
export function placeGuard(state: BattleState, elapsedMs: number): BattleState {
  if (!canPlaceGuard(state, elapsedMs)) return state;
  return { ...state, guardLane: laneOf(state), manaSpent: state.manaSpent + GUARD_COST };
}

/**
 * D-060 — מה הבמה מציירת. ⛔ הרכיב ⛔ אינו גוזר את זה בעצמו: תנוחה שנגזרת בשני
 * מקומות סוטה בשלישי. ⛔ שגיאה היא **התחמקות** ⛔ ולא פגיעה בלומד — הפגיעה מגיעה
 * מהיריב בקצב שלו (`§ 3`), ⛔ ולא מהתשובה.
 * ⛔ **שלוש תנוחות, ⛔ ואין רביעית.** הועבר מ-`arcadeBattle.ts` באותו קומיט שבו נמחק.
 */
export type StagePhase = 'idle' | 'hit' | 'dodge';

export function stagePhase(state: BattleState): StagePhase {
  const last = state.casts[state.casts.length - 1];
  if (last === undefined) return 'idle';
  return last.correct ? 'hit' : 'dodge';
}

/**
 * 🔥 **T-401 · `37 § 8` ק1 — הרצף שהלומד רואה ⛔ בזמן הקרב, ⛔ ולא אחריו.**
 *
 * 🔬 **הפער שנמדד:** `grep -c streak lib/core/battle.ts components/ArenaBattle.tsx`
 * ⇒ **0 · 0**. המקום היחיד שבו רצף הגיע ללומד היה `ArenaSummary.tsx:50` («רצף מרבי»)
 * — כלומר **אחרי** הקרב, כשכבר אי אפשר לעשות איתו דבר.
 *
 * ⛔ **הנוכחי, ⛔ ולא המרבי, וזו ⛔ אינה אותה פונקציה:** `arenaSummary.ts` סופר את
 * הרצף הארוך ביותר בקרב כולו (שורה 3 של `§ 10`); כאן הטלה שגויה **מאפסת**. ⇒ שני
 * מספרים, שני תפקידים, ⛔ ואין מקום שגוזר אחד מהשני.
 *
 * ⛔ **טהורה ונגזרת** (`DEV.md` — `/lib/core/` הוא PURE): היא קוראת את `state.casts`,
 * המבנה שכבר קיים, ⇒ ⛔ אפס שדה חדש ב-`BattleState` ו⛔ אפס דרך שהמספר יסטה מהקרב.
 *
 * ⛔ **ומה ש⛔ אינו כאן, ומוצהר:** מכפיל הנזק 1.5 והחרב הלוהטת של `§ 8` ק1 — שניהם
 * משנים את האריתמטיקה של `cast()` ⇒ שורה נפרדת, ⛔ ולא תוספת שקטה כאן.
 */
export function streakAt(state: BattleState): number {
  let streak = 0;
  for (let i = state.casts.length - 1; i >= 0; i -= 1) {
    const done = state.casts[i];
    if (done === undefined || !done.correct) break;
    streak += 1;
  }
  return streak;
}

/**
 * `render_video_B.py:374-378` — הסף שבו השבב מתחלף לזהב: `streak >= 3` מצויר במילוי
 * `(120, 70, 20)` ובמסגרת `GOLD_LIGHT`, ומתחתיו ב-`RAISED`/`BORDER_SUB`.
 * ⛔ **מספר אחד, ⛔ ולא שניים:** הרכיב ⛔ אינו כותב 3 משלו.
 */
export const STREAK_HOT = 3;

/**
 * ⚡ **T-363 · `37 § 4` — שלוש היכולות, ⛔ והמאנה סוף סוף יש לה לאן ללכת.**
 *
 * 🔬 **הפער שנמדד:** `grep -c 'הקפאה\|כפול' components/ArenaBattle.tsx` ⇒ **0**. מד המאנה
 * נבנה ב-`T-397`, `manaAt` צוברת מאז `T-176`, ו-`manaSpent` היה **קבוע 0 לאורך כל קרב**
 * — כלומר משאב שנצבר עד התקרה ו⛔ אין במה להוציא אותו. זו שורת המשימה מילה במילה.
 *
 * ⛔ **שלוש ⛔ ולא ארבע:** `§ 4` מונה גם `ריפוי`, והרנדר (`render_video_B.py:308`) מצייר
 * **שלוש** — `ABILITIES = [("כפול", 4), ("מגן", 3), ("הקפאה", 5)]`. ‏`36 § 14.4`: הרנדר
 * מחייב. ⛔ `ריפוי` ⛔ אינה נבנית כאן, ו⛔ אינה «נשכחה».
 *
 * 🔴 **⛔ והעלויות ⛔ אינן שלי:** שלושת המספרים הם `render_video_B.py:308` בדיוק,
 * וה-`ABILITY_ORDER` הוא סדר הציור שלו (‏`x = LW - 62 - i*106` ⇒ `כפול` הימנית).
 *
 * ⚠️ 🔴 **מה ש⛔ אינו במפרט, ונאמר כאן במפורש — `RULES § 0.22`, הכרעה הפיכה.**
 * ‏`§ 4` נוקב בשמות היכולות ובמשפט אחד על ההכרעה («נזק כפול עכשיו, או לשמור למגן»),
 * ו⛔ **אינו** מגדיר את האפקט של `מגן` ו-`הקפאה`. ⇒ שלושתם נגזרו **מקבועים שכבר במפרט**,
 * ⛔ ובלי ולו מספר חדש אחד:
 *   · `כפול` — מכפיל את נזק ההטלה הנכונה הבאה. **המילה של הרנדר עצמו** (`:487`).
 *   · `מגן` — מבטל את המכה הבאה של היריב, דרך אותה חסינות בדיוק ש-`§ 6` כבר מגדירה
 *     ומימשה ב-`dodge()` (`dodgedSwing`) ⇒ ⛔ מנגנון חדש ⛔ אין כאן, יש כניסה שנייה אליו.
 *   · `הקפאה` — שעון המכות של היריב נדחף **מחזור שלם** קדימה, `ENEMY_SWING_MS` של
 *     `§ 3` ⇒ 8 שניות שבהן ⛔ אין מכה ו⛔ אין טלגרף. זו הסיבה שהיא עולה 5 ו-`מגן` 3:
 *     `מגן` מבטל מכה, `הקפאה` קונה גם את השקט שאחריה.
 * ⇒ **PM ורוי רשאים להחליף כל אחד משלושת האפקטים בקומיט אחד** — הם חיים כאן, בשכבה
 * הטהורה, ⛔ ולא ברכיב (‏`§ 7` גדר 4).
 */
export type AbilityKey = 'double' | 'shield' | 'freeze';

/** `render_video_B.py:308` — סדר הציור מימין לשמאל, מילה במילה. */
export const ABILITY_ORDER: readonly AbilityKey[] = Object.freeze(['double', 'shield', 'freeze'] as const);

/** `render_video_B.py:308` — `("כפול", 4)` · `("מגן", 3)` · `("הקפאה", 5)`. ⛔ ⛔ לא נבחרו כאן. */
export const ABILITY_COST: Readonly<Record<AbilityKey, number>> = Object.freeze({
  double: 4,
  shield: 3,
  freeze: 5,
});

/**
 * ⛔ **היכולת ⛔ אינה «זמינה» רק כי יש מאנה.** יכולת שכבר פעילה ⛔ אינה נקנית שוב:
 * שני `כפול` זה אחר זה היו גובים 8 מאנה על אפקט אחד, וזה בדיוק סוג הבזבוז שלומד
 * ⛔ אינו יכול לראות מראש ⛔ ולא לבטל.
 */
export function canUseAbility(state: BattleState, key: AbilityKey, elapsedMs: number): boolean {
  if (manaAt(elapsedMs, state.manaSpent) < ABILITY_COST[key]) return false;
  if (key === 'double') return !state.pendingDouble;
  if (key === 'shield') return state.dodgedSwing !== telegraphAt(elapsedMs).swingIndex;
  return !isFrozen(state, elapsedMs);
}

/**
 * ⛔ **טהורה, ואידמפוטנטית כלפי מצב שאי אפשר לקנות בו:** הקשה שאין לה כיסוי מחזירה את
 * **אותה הפניה** ⇒ הרכיב ⛔ אינו מרנדר, ו⛔ אין «קניתי ולא קרה כלום».
 */
// ⛔ **`spendAbility` ו⛔ לא `useAbility`, וזה ⛔ אינו טעם:** `react-hooks/rules-of-hooks`
// מזהה **כל** שם שמתחיל ב-`use` כ-Hook ⇒ קריאה מתוך `onClick` הייתה הפרה, והשם היה
// מכתיב איפה מותר לקרוא לפונקציה טהורה שאין לה שום קשר ל-React.
export function spendAbility(state: BattleState, key: AbilityKey, elapsedMs: number): BattleState {
  if (!canUseAbility(state, key, elapsedMs)) return state;
  const manaSpent = state.manaSpent + ABILITY_COST[key];
  if (key === 'double') return { ...state, manaSpent, pendingDouble: true };
  if (key === 'shield') {
    return {
      ...state,
      manaSpent,
      dodgedSwing: telegraphAt(elapsedMs).swingIndex,
      immuneBy: 'shield',
    };
  }
  // ⛔ **⛔ אין כאן שעון שני.** `tick` סופר מכות ב-`floor(lastSwingMs / ENEMY_SWING_MS)`,
  // ⇒ דחיפת `lastSwingMs` מחזור אחד קדימה היא **בדיוק** «המכות בחלון הזה ⛔ לא קרו»,
  // באותו מנגנון שכבר נבדק. ⛔ שדה `frozenUntil` היה שעון שני, והשני תמיד סוטה.
  return { ...state, manaSpent, lastSwingMs: elapsedMs + ENEMY_SWING_MS };
}

/** מה שהמסך מצייר בזמן הקפאה. ⛔ נגזר, ⛔ ולא שדה. */
export function isFrozen(state: BattleState, elapsedMs: number): boolean {
  return state.lastSwingMs > elapsedMs;
}
