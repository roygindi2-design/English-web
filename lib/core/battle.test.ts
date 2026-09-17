import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ArenaWord } from './arenaWords';
import {
  ABILITY_COST,
  ABILITY_ORDER,
  ANNOUNCE_AT_MS,
  BATTLE_MS,
  canUseAbility,
  isFrozen,
  spendAbility,
  ENEMY_SWING_MS,
  MANA_CAP,
  TELEGRAPH_MS,
  WINDOW_END_MS,
  cast,
  dodge,
  isRage,
  manaAt,
  outcomeAt,
  returnedSpell,
  startBattle,
  telegraphAt,
  tick,
  UNFILTERED_BONUS_DAMAGE,
  BASE_STATS,
  CHARACTER_STATS,
  ENEMY_HP,
  statsFor,
  streakAt,
  STREAK_HOT,
  wordsFromBoss,
} from './battle';
import { ARENA_CHARACTERS, CHARACTER_BIAS_HE } from './arenaCharacter';

/**
 * ⚠️ **הפיקסצ׳ר, ⛔ ולא TODO** (התוכנית, § 6 צעד 4): `startBattle` על ארבע `ArenaWord`.
 *
 * T-281 — `startBattle` ⛔ אינו מקבל עוד מספרים: הפיקסצ׳ר הוא **שורת הבסיס של `37 § 7`
 * (12 / 20) מעצם המבנה**, ⛔ ולא ערך שבדיקה בוחרת — פיקסצ׳ר ששונה מייצור הוא חור,
 * ⛔ לא בדיקה (DEV.md STEP 5).
 */
const word = (n: number): ArenaWord => ({
  wordId: `w${n}`,
  headword: `Lorem${n}`,
  translationHe: `אפשרות ${n}`,
  kind: 'base',
});

const FRESH = startBattle([word(1), word(2), word(3), word(4)]);

describe('battle', () => {
  it('⛔ שעון אחד לקרב שלם, ⛔ ולא טיימר לשאלה', () => {
    expect(BATTLE_MS).toBe(90_000);
  });

  /**
   * ⚠️ **סטייה מדודה, ⛔ ולא בחירה.** התוכנית כתבה כאן
   * `expect(manaAt(70_000, 0)).toBeGreaterThan(manaAt(69_999, 0))`, ו⛔ **הטענה הזאת
   * אינה ניתנת לסיפוק בשום מימוש**: `37 § 4` נוקב ב-1 מאנה ל-2 שניות **בתקרה 10**,
   * ⇒ התקרה נגמלת כבר ב-20 שניות, ובשתי הנקודות הערך הוא בדיוק `MANA_CAP`. הכוונה —
   * **הכפלת הקצב ב`זמן זעם`** — נמדדת כאן על **הקצב עצמו** מתחת לתקרה, וזו מדידה
   * חזקה יותר: היא נופלת גם על מימוש שצובר בלי להכפיל. נרשם ב-`26-plan-feedback.md`.
   */
  it('`זמן זעם` = 20 השניות האחרונות, ומכפיל מאנה', () => {
    expect(isRage(69_999)).toBe(false);
    expect(isRage(70_000)).toBe(true);
    expect(manaAt(70_000, 30)).toBeGreaterThan(manaAt(69_999, 30));
    // שתי שניות לפני `זמן זעם` = 1 מאנה. שתי שניות בתוכו = 2. ⇒ ההכפלה, ⛔ ולא הצבירה.
    expect(manaAt(70_000, 30) - manaAt(68_000, 30)).toBe(1);
    expect(manaAt(72_000, 30) - manaAt(70_000, 30)).toBe(2);
    expect(manaAt(600_000, 0)).toBe(MANA_CAP);   // התקרה מחזיקה
  });

  it('היריב מתקיף כל 8 שניות בקצב עצמאי — 90 ש׳ ⇒ 11 מכות', () => {
    let s = FRESH;
    for (let ms = 0; ms <= BATTLE_MS; ms += 1000) s = tick(s, ms);
    expect(s.learnerHp).toBe(FRESH.learnerHp - Math.floor(BATTLE_MS / ENEMY_SWING_MS));
  });

  it('⛔ אין מצב כישלון על איטיות — תשובה נכונה איטית עדיין פוגעת', () => {
    const fast = cast({ ...FRESH, shownAtMs: 0 }, FRESH.words[0]!.translationHe, 1_000);
    const slow = cast({ ...FRESH, shownAtMs: 0 }, FRESH.words[0]!.translationHe, 9_000);
    expect(fast.enemyHp).toBeLessThan(FRESH.enemyHp);
    expect(slow.enemyHp).toBeLessThan(FRESH.enemyHp);   // ⛔ פוגעת, ⛔ לא מאפסת
    expect(fast.enemyHp).toBeLessThan(slow.enemyHp);    // קריטי מתחת ל-1.5 ש׳
    expect(slow.casts[0]!.critical).toBe(false);
  });

  it('מענה ⛔ אינו מעלה מאנה אף פעם (`37 § 4`)', () => {
    const before = manaAt(10_000, FRESH.manaSpent);
    const after = cast({ ...FRESH, shownAtMs: 8_000 }, FRESH.words[0]!.translationHe, 10_000);
    expect(manaAt(10_000, after.manaSpent)).toBe(before);
  });

  it('שגויה ⇒ הלחש מתפוגג והמכה הבאה חזקה יותר', () => {
    const missed = cast({ ...FRESH, shownAtMs: 0 }, 'לא-נכון', 2_000);
    expect(missed.enemyHp).toBe(FRESH.enemyHp);        // הלחש התפוגג
    const swung = tick(missed, ENEMY_SWING_MS);
    const clean = tick({ ...FRESH, index: 1 }, ENEMY_SWING_MS);
    expect(FRESH.learnerHp - swung.learnerHp).toBeGreaterThan(
      FRESH.learnerHp - clean.learnerHp,
    );
  });

  it('T-220 ⓓ — שגויה על `unfiltered` ⇒ הלחש חוזר **גלוי**: `returnedSpell` נוקב במילה ובתרגומה', () => {
    const w1: ArenaWord = { ...word(1), kind: 'unfiltered' };
    const fresh = startBattle([w1, word(2), word(3)]);
    const missed = cast({ ...fresh, shownAtMs: 0 }, 'לא-נכון', 2_000);
    expect(returnedSpell(missed)).toEqual(w1);            // headword + translationHe, revealed
    expect(missed.words[missed.words.length - 1]?.wordId).toBe('w1'); // and it is back in the tail
    // the next cast (any result) clears the reveal — it belongs to the moment of the error
    const next = cast(missed, 'אפשרות 2', 3_000);
    expect(returnedSpell(next)).toBeNull();
    // the tail copy is `base` ⇒ a second miss on the same word ⛔ never reveals twice
    const again = cast(cast(next, 'אפשרות 3', 4_000), 'לא-נכון', 5_000);
    expect(again.words[again.index - 1]?.wordId).toBe('w1');
    expect(returnedSpell(again)).toBeNull();
  });

  it('T-220 ⓓ — ⛔ אין חשיפה על נכונה, על `base`, או לפני ההטלה הראשונה', () => {
    expect(returnedSpell(FRESH)).toBeNull();
    expect(returnedSpell(cast({ ...FRESH, shownAtMs: 0 }, 'אפשרות 1', 1_000))).toBeNull();
    expect(returnedSpell(cast({ ...FRESH, shownAtMs: 0 }, 'לא-נכון', 1_000))).toBeNull();
    const known = startBattle([{ ...word(1), kind: 'known' }]);
    expect(returnedSpell(cast({ ...known, shownAtMs: 0 }, 'לא-נכון', 1_000))).toBeNull();
  });

  it('בתום השעון מנצח אחוז החיים הגבוה — ⛔ והפסד הוא מצב (D-126 § ד׳)', () => {
    const ahead = { ...FRESH, learnerHp: 8, enemyHp: 2 };
    const behind = { ...FRESH, learnerHp: 2, enemyHp: 8 };
    expect(outcomeAt(ahead, BATTLE_MS)).toBe('outlasted');
    expect(outcomeAt(behind, BATTLE_MS)).toBe('survived');
    expect(outcomeAt(FRESH, 1_000)).toBe('running');
  });

  it('אפס חיי יריב ⇒ ניצחון, ⛔ בלי להמתין לשעון', () => {
    expect(outcomeAt({ ...FRESH, enemyHp: 0 }, 3_000)).toBe('victory');
  });

  /**
   * T-231 ⓒ — **`setBattle` הופך ל-no-op רק אם `tick` מחזירה את אותה הפניה.**
   * נמדד C-0371: הענף `swings <= 0` (>99% מהפריימים) עשה תמיד `{...state, lastSwingMs}`,
   * כלומר הפניה חדשה בכל קריאה ⇒ React ⛔ לעולם לא בולם רינדור. ⛔ **הבדיקה על הפניה
   * (`toBe`), ⛔ ולא על ערך (`toEqual`)** — זו בדיוק הנקודה שנמדדה.
   */
  it('T-231 ⓒ — פריים בלי מכה מחזיר את אותה הפניה בדיוק, ⛔ ולא עותק שווה', () => {
    const first = tick(FRESH, 100);
    expect(first).toBe(FRESH); // 100ms < 8000ms ⇒ אפס מכות באותה קריאה הראשונה
    const second = tick(first, 200);
    expect(second).toBe(first);
  });

  it('T-231 ⓒ — ומכה אמיתית עדיין מחזירה הפניה חדשה עם הנזק הנכון', () => {
    let s = FRESH;
    for (let ms = 0; ms <= ENEMY_SWING_MS; ms += 1000) s = tick(s, ms);
    expect(s).not.toBe(FRESH);
    expect(s.learnerHp).toBe(FRESH.learnerHp - 1);
  });

  it('⛔ אין בקובץ שעון נסתר — הזמן הוא קלט (D-126 § ג׳)', () => {
    const code = readFileSync('lib/core/battle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    for (const banned of [/\bsetTimeout\b/, /\bsetInterval\b/, /\bDate\.now\b/, /\brequestAnimationFrame\b/]) {
      expect(code, `${banned} אסור — D-126 § ג׳`).not.toMatch(banned);
    }
    // ⛔ אינווריאנט 13.1 — הזירה ⛔ אינה מזיזה את מנוע החזרות. הועבר מ-arcadeBattle.test.ts.
    for (const banned of [/word_progress/, /easiness/, /interval_days/, /next_review_at/]) {
      expect(code, `${banned} אסור — אינווריאנט 13.1`).not.toMatch(banned);
    }
  });
});

describe('37 § 6 — הטלגרף: 6 שניות שנגמרות במכה, בקצב של § 3', () => {
  it('⛔ שקט עד 2.0 ש׳ — המכה הראשונה ב-8.0 ש׳, והטעינה מתחילה 6.0 לפניה', () => {
    expect(telegraphAt(0)).toEqual({ phase: 'quiet', frac: 0, swingIndex: 1 });
    expect(telegraphAt(1_999).phase).toBe('quiet');
  });

  it('טעינה מ-2.0 ש׳, והמד מתמלא לינארית עד 5.3 ש׳ לתוך הטלגרף', () => {
    expect(telegraphAt(2_000)).toEqual({ phase: 'charging', frac: 0, swingIndex: 1 });
    const half = telegraphAt(2_000 + ANNOUNCE_AT_MS / 2);
    expect(half.phase).toBe('charging');
    expect(half.frac).toBeCloseTo(0.5, 5);
  });

  it('הכרזה בדיוק ב-5.3 ש׳ לתוך הטלגרף — והחלון פתוח עד 5.7', () => {
    expect(telegraphAt(2_000 + ANNOUNCE_AT_MS)).toEqual({ phase: 'window', frac: 1, swingIndex: 1 });
    expect(telegraphAt(2_000 + WINDOW_END_MS - 1).phase).toBe('window');
  });

  it('⛔ ב-5.7 החלון נסגר, ועד 6.0 המכה כבר בלתי-נמנעת', () => {
    expect(telegraphAt(2_000 + WINDOW_END_MS).phase).toBe('committed');
    expect(telegraphAt(2_000 + TELEGRAPH_MS - 1).phase).toBe('committed');
  });

  it('המכה השנייה נושאת `swingIndex: 2`, ⛔ והטלגרף שלה מתחיל 6.0 לפני 16.0 ש׳', () => {
    expect(telegraphAt(2 * ENEMY_SWING_MS - TELEGRAPH_MS).swingIndex).toBe(2);
    expect(telegraphAt(2 * ENEMY_SWING_MS - TELEGRAPH_MS).phase).toBe('charging');
  });

  it('⛔ זמן שלילי ⛔ אינו מצב — הוא שקט, ⛔ ולא חלון פתוח', () => {
    expect(telegraphAt(-1).phase).toBe('quiet');
  });
});

describe('37 § 6 — הגלגול: חסינות למכה **המוכרזת**, ⛔ ולא «פחות נזק»', () => {
  const words = [{ wordId: 'w1', headword: 'ONE', translationHe: 'אחת', kind: 'base' as const }];

  it('⛔ החלקה מחוץ לחלון ⛔ אינה עושה דבר — ⛔ ואינה עולה חיים', () => {
    const s = startBattle(words);
    expect(dodge(s, 3_000)).toEqual(s);
    expect(dodge(s, 2_000 + WINDOW_END_MS)).toEqual(s);
  });

  it('החלקה בתוך החלון מסמנת את המכה, והמכה נוחתת ב⛔ אפס נזק', () => {
    const s = dodge(startBattle(words), 2_000 + ANNOUNCE_AT_MS);
    expect(s.dodgedSwing).toBe(1);
    expect(tick(s, ENEMY_SWING_MS).learnerHp).toBe(12);
  });

  it('⛔ בלי גלגול — המכה פוגעת, וזו ההוכחה שהבדיקה מודדת את הגלגול ⛔ ולא כלום', () => {
    expect(tick(startBattle(words), ENEMY_SWING_MS).learnerHp).toBe(11);
  });

  it('⛔ הגלגול מבטל את המכה **כולה**, כולל עונש התשובה השגויה שהיה תלוי בה', () => {
    const wrong = cast(startBattle(words), 'לא נכון', 500);
    expect(wrong.pendingPenalty).toBe(1);
    const rolled = dodge(wrong, 2_000 + ANNOUNCE_AT_MS);
    const after = tick(rolled, ENEMY_SWING_MS);
    expect(after.learnerHp).toBe(12);
    expect(after.pendingPenalty).toBe(0);
    expect(after.dodgedSwing).toBeNull();
  });

  it('⛔ החסינות שייכת למכה אחת: אם שתי מכות התאחדו בפריים, השנייה עדיין פוגעת', () => {
    const s = dodge(startBattle(words), 2_000 + ANNOUNCE_AT_MS);
    expect(tick(s, 2 * ENEMY_SWING_MS).learnerHp).toBe(11);
  });

  it('⛔ הגלגול ⛔ אינו עוצר את השעון — `outcomeAt` על אותו זמן ⛔ אינו משתנה', () => {
    const s = startBattle(words);
    expect(outcomeAt(dodge(s, 2_000 + ANNOUNCE_AT_MS), 50_000)).toBe(outcomeAt(s, 50_000));
  });
});

/**
 * 🔴 T-220 ⓑ · ⓒ — `37 § 2`, מילה במילה: «מילה לא מסוננת … **צדקת — נזק מוגבר** ·
 * **טעית — הלחש חוזר אליך**». ⛔ עד 28/08 `cast` ⛔ לא החזיק ולו ענף אחד על סוג המילה.
 */
const unfW = (id: string, kind: ArenaWord['kind']): ArenaWord => ({
  wordId: id,
  headword: id,
  translationHe: `ת-${id}`,
  kind,
});

describe('37 § 2 — «צדקת: נזק מוגבר · טעית: הלחש חוזר אליך»', () => {
  it('מילה `unfiltered` נכונה ⇒ נזק גדול ב-UNFILTERED_BONUS_DAMAGE ממילה `base` נכונה', () => {
    const base = cast(startBattle([unfW('a', 'base')]), 'ת-a', 5_000);
    const unf = cast(startBattle([unfW('a', 'unfiltered')]), 'ת-a', 5_000);
    expect(20 - unf.enemyHp).toBe((20 - base.enemyHp) + UNFILTERED_BONUS_DAMAGE);
  });

  it('⛔ הבונוס ⛔ אינו חל על `known` ו⛔ לא על `base`', () => {
    const known = cast(startBattle([unfW('a', 'known')]), 'ת-a', 5_000);
    const base = cast(startBattle([unfW('a', 'base')]), 'ת-a', 5_000);
    expect(known.enemyHp).toBe(base.enemyHp);
  });

  it('`unfiltered` שגויה ⇒ המילה חוזרת לסוף התור **באותו קרב**', () => {
    const s = cast(
      startBattle([unfW('a', 'unfiltered'), unfW('b', 'base')]),
      'לא נכון',
      5_000,
    );
    expect(s.words.map((x) => x.wordId)).toEqual(['a', 'b', 'a']);
    expect(s.index).toBe(1);
  });

  it('⛔ אין עונש כפול: `unfiltered` שגויה גורעת חיים **בדיוק** כמו כל שגיאה אחרת', () => {
    const unf = cast(startBattle([unfW('a', 'unfiltered')]), 'לא נכון', 5_000);
    const base = cast(startBattle([unfW('a', 'base')]), 'לא נכון', 5_000);
    expect(unf.pendingPenalty).toBe(base.pendingPenalty);
    expect(unf.learnerHp).toBe(base.learnerHp);
  });

  it('⛔ מילה חוזרת **פעם אחת בלבד** — שגיאה שנייה עליה ⛔ אינה מאריכה את התור לנצח', () => {
    const first = cast(startBattle([unfW('a', 'unfiltered')]), 'לא נכון', 5_000);
    const second = cast(first, 'לא נכון', 9_000);
    expect(second.words.map((x) => x.wordId)).toEqual(['a', 'a']);
  });

  it('⛔ `casts[i]` עדיין תואם ל-`words[i]` אחרי חזרה', () => {
    const s = cast(
      startBattle([unfW('a', 'unfiltered'), unfW('b', 'base')]),
      'לא נכון',
      5_000,
    );
    const t = cast(s, 'ת-b', 6_000);
    expect(t.casts.map((c) => c.wordId)).toEqual(['a', 'b']);
    expect(t.words.slice(0, 2).map((x) => x.wordId)).toEqual(['a', 'b']);
  });

  it('T-282 — כל הטלה נושאת את סוג המילה ברגע ההטלה; העותק שחזר לזנב הוא `base`', () => {
    const words: readonly ArenaWord[] = [
      { ...word(1), kind: 'known' },
      { ...word(2), kind: 'unfiltered' },
    ];
    let s = startBattle(words);
    s = cast(s, 'אפשרות 1', 500);       // known, correct
    s = cast(s, 'לא נכון', 1_000);      // unfiltered, wrong ⇒ requeued as base at the tail
    s = cast(s, 'אפשרות 2', 1_500);     // the tail copy
    expect(s.casts.map((c) => c.kind)).toEqual(['known', 'unfiltered', 'base']);
    expect(s.casts.map((c) => c.wordId)).toEqual(['w1', 'w2', 'w2']);
  });
});

/**
 * T-281 · `37 § 7` «ההטיה כמספרים» · D-200. ⛔ The numbers are read out of the spec's own
 * markdown table, ⛔ never typed here twice: a second copy is a second owner.
 */
const SPEC_37 = readFileSync('plan/37-arena-spec.md', 'utf8').replace(/\*\*/g, '');

/** The numeric § 7 rows: label cell, then four integer cells. The words table above it
 *  has the same labels but ⛔ no integer cells, so it never matches. */
function specRow(label: string): readonly number[] {
  const row = SPEC_37.split('\n').find((l) => {
    const cells = l.split('|').map((c) => c.trim());
    return cells[1]?.startsWith(label) === true && cells.slice(2, 6).every((c) => /^\d+$/.test(c));
  });
  expect(row, `שורת ${label} בטבלת § 7`).toBeDefined();
  return (row as string).split('|').map((c) => c.trim()).slice(2, 6).map(Number);
}
const asRow = (s: { learnerHp: number; hitDamage: number; criticalDamage: number; swingPenalty: number }) =>
  [s.learnerHp, s.hitDamage, s.criticalDamage, s.swingPenalty];

describe('T-281 · 37 § 7 — ההטיה כמספרים', () => {
  it('הבסיס ושלוש הדמויות הם טבלת § 7, מילה במילה — ⛔ אפס מספר מומצא', () => {
    expect(asRow(BASE_STATS)).toEqual(specRow('בסיס'));
    expect(asRow(CHARACTER_STATS.wizard)).toEqual(specRow('קוסם'));
    expect(asRow(CHARACTER_STATS.warrior)).toEqual(specRow('לוחם'));
    expect(asRow(CHARACTER_STATS.armorer)).toEqual(specRow('שריונאי'));
  });

  it('גדר 4 — דמות לא מוכרת או null ⇒ הבסיס, ⛔ ולא זריקה', () => {
    for (const bad of [null, undefined, 'Wizard', '', 7, {}, ['wizard']]) {
      expect(statsFor(bad)).toBe(BASE_STATS);
    }
    for (const c of ARENA_CHARACTERS) expect(statsFor(c)).toBe(CHARACTER_STATS[c]);
    expect(startBattle([word(1)]).stats).toBe(BASE_STATS);
    expect(startBattle([word(1)], null).stats).toBe(BASE_STATS);
  });

  it('גדר 1 — ארבעה מפתחות בדיוק, ⛔ ואף אחד מהם אינו שעון, מאנה, תמהיל או «מה נכון»', () => {
    const keys = ['criticalDamage', 'hitDamage', 'learnerHp', 'swingPenalty'];
    expect(Object.keys(BASE_STATS).sort()).toEqual(keys);
    for (const c of ARENA_CHARACTERS) expect(Object.keys(CHARACTER_STATS[c]).sort()).toEqual(keys);
    // The engine reads the row through `state.stats.<key>` only — measured on the source.
    const code = readFileSync('lib/core/battle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    const reads = [...code.matchAll(/stats\.(\w+)/g)].map((m) => m[1]);
    expect(reads.length).toBeGreaterThan(0);
    for (const r of reads) expect(keys).toContain(r);
    // and the clock, the mana and the enemy are module constants, ⛔ not row fields
    for (const c of ARENA_CHARACTERS) {
      expect(manaAt(10_000, 0)).toBe(manaAt(10_000, 0));          // no character parameter exists
      expect(startBattle([word(1)], c).enemyHpMax).toBe(ENEMY_HP);
      expect(startBattle([word(1)], c).words).toEqual([word(1)]);   // the mix is the mix
    }
  });

  it('גדר 2 — LEARNER_HP ≥ 12 לכל דמות: 11 מכות נקיות ⛔ אינן מפסידות קרב', () => {
    const swings = Math.floor(BATTLE_MS / ENEMY_SWING_MS);
    expect(swings).toBe(11);
    for (const c of ARENA_CHARACTERS) {
      expect(CHARACTER_STATS[c].learnerHp).toBeGreaterThanOrEqual(swings + 1);
      let s = startBattle([word(1)], c);
      for (let ms = 0; ms <= BATTLE_MS; ms += 1000) s = tick(s, ms);
      expect(s.learnerHp).toBeGreaterThan(0);
    }
  });

  it('גדר 3 — CRITICAL_DAMAGE > HIT_DAMAGE לכל דמות', () => {
    expect(BASE_STATS.criticalDamage).toBeGreaterThan(BASE_STATS.hitDamage);
    for (const c of ARENA_CHARACTERS) {
      expect(CHARACTER_STATS[c].criticalDamage).toBeGreaterThan(CHARACTER_STATS[c].hitDamage);
    }
  });

  it('קוסם — «נזק לחש גבוה»: 2 באיטית, 3 בקריטית; 7 קריטיות מפילות 20', () => {
    const w = startBattle([word(1), word(2)], 'wizard');
    const slow = cast({ ...w, shownAtMs: 0 }, 'אפשרות 1', 5_000);
    const fast = cast({ ...w, shownAtMs: 0 }, 'אפשרות 1', 1_000);
    expect(ENEMY_HP - slow.enemyHp).toBe(2);
    expect(ENEMY_HP - fast.enemyHp).toBe(3);
    expect(Math.ceil(ENEMY_HP / CHARACTER_STATS.wizard.criticalDamage)).toBe(7);
    expect(w.learnerHp).toBe(BASE_STATS.learnerHp);              // «חיים נמוכים» stays a word (fence 2)
  });

  it('לוחם — «חיים גבוהים» 18, «קריטי חזק» 3, «מגן מובנה» = ⛔ אין עונש על טעות', () => {
    const w = startBattle([word(1), word(2)], 'warrior');
    expect(w.learnerHp).toBe(18);
    expect(w.learnerHpMax).toBe(18);
    const fast = cast({ ...w, shownAtMs: 0 }, 'אפשרות 1', 1_000);
    expect(ENEMY_HP - fast.enemyHp).toBe(3);
    const missed = cast({ ...w, shownAtMs: 0 }, 'לא-נכון', 2_000);
    expect(missed.pendingPenalty).toBe(0);
    expect(tick(missed, ENEMY_SWING_MS).learnerHp).toBe(18 - 1);  // one swing, ⛔ not two
    const baseMissed = cast({ ...startBattle([word(1), word(2)]), shownAtMs: 0 }, 'לא-נכון', 2_000);
    expect(tick(baseMissed, ENEMY_SWING_MS).learnerHp).toBe(12 - 2);
  });

  it('שריונאי — «מאוזן»: הבסיס בדיוק, ⛔ ולא עותק שווה', () => {
    expect(CHARACTER_STATS.armorer).toBe(BASE_STATS);
    const a = startBattle([word(1)], 'armorer');
    const b = startBattle([word(1)]);
    expect({ ...a, stats: undefined }).toEqual({ ...b, stats: undefined });
  });

  it('ⓓ — שורות ה«⛔ טרם» נשארות מילים על המסך, ⛔ ואין להן מנגנון', () => {
    for (const line of ['מאנה מהירה יותר', 'חיים נמוכים']) expect(CHARACTER_BIAS_HE.wizard).toContain(line);
    for (const line of ['יכולות מתקררות מהר', 'ירי מטווח']) expect(CHARACTER_BIAS_HE.armorer).toContain(line);
    const code = readFileSync('lib/core/battle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    // 🔴 **צומצם ב-T-363, ⛔ ולא הורפה.** שתי שורות «⛔ טרם» מדברות על **הטיה** —
    // «יכולות מתקררות מהר» (‏`cooldown`) ו«ירי מטווח» (‏`ranged`) — והן עדיין ⛔ אינן
    // בנויות. מה שנבנה ב-T-363 הוא `§ 4` עצמו: `מגן` ו-`הקפאה` **זהים לשלוש הדמויות**
    // (‏`§ 7` גדר 1), ⇒ `shield`/`freeze` ⛔ אינם עוד ראיה להטיה שנבנתה בשקט.
    // ⛔ `heal` (‏`ריפוי`) ו-`manaMs` (‏«מאנה מהירה יותר») ⛔ נשארים אסורים.
    for (const banned of [/cooldown/i, /heal/i, /ranged/i, /manaMs\b/]) {
      expect(code, `${banned} — § 4 ⛔ אינו בנוי`).not.toMatch(banned);
    }
    // ⛔ **וההטיה נמדדת ישירות, ⛔ ולא דרך מילה:** העלות ⛔ אינה תלויה בדמות, ושורת
    // `§ 7` ⛔ אינה נושאת שדה יכולת. זו הטענה שהאיסור על המילים ניסה לקרב אליה.
    expect(Object.keys(ABILITY_COST).sort()).toEqual(['double', 'freeze', 'shield']);
    for (const c of ARENA_CHARACTERS) {
      expect(Object.keys(CHARACTER_STATS[c]).sort()).toEqual(Object.keys(BASE_STATS).sort());
    }
  });

  it('⛔ אפס מספר על מסך הבחירה — הטבלה היא מפרט, ⛔ לא תוכן', () => {
    for (const c of ARENA_CHARACTERS) for (const s of CHARACTER_BIAS_HE[c]) expect(s).not.toMatch(/\d/);
  });
});

describe('wordsFromBoss — T-283 · 37 § 9 ח4', () => {
  it('שורת הבסיס: 20 חיים ÷ פגיעה 1 = 20 מילים; אחרי קריטי (2) — 18', () => {
    expect(wordsFromBoss(FRESH)).toBe(ENEMY_HP);
    const afterCritical = cast(FRESH, 'אפשרות 1', 500);
    expect(wordsFromBoss(afterCritical)).toBe(ENEMY_HP - BASE_STATS.criticalDamage);
  });

  it('קוסם (פגיעה 2): 20 חיים = 10 מילים — המספר נגזר מ-`state.stats`, ⛔ לא מקבוע', () => {
    const wizard = startBattle([word(1), word(2)], 'wizard');
    expect(wordsFromBoss(wizard)).toBe(Math.ceil(ENEMY_HP / CHARACTER_STATS.wizard.hitDamage));
  });

  it('עיגול כלפי מעלה: 3 חיים ÷ פגיעה 2 = 2 מילים, ⛔ לא 1.5', () => {
    const s = { ...startBattle([word(1)], 'wizard'), enemyHp: 3 };
    expect(wordsFromBoss(s)).toBe(2);
  });

  it('היריב נוצח ⇒ 0, ⛔ לעולם לא שלילי', () => {
    expect(wordsFromBoss({ ...FRESH, enemyHp: 0 })).toBe(0);
    expect(wordsFromBoss({ ...FRESH, enemyHp: -3 })).toBe(0);
  });

  it('⛔ אין חלוקה באפס גם על שורה שבורה', () => {
    const s = { ...FRESH, stats: { ...BASE_STATS, hitDamage: 0 } };
    expect(wordsFromBoss(s)).toBe(ENEMY_HP);
  });
});

/**
 * 🔥 **T-401 · `37 § 8` ק1 · `docs/design/render_video_B.py:364-378` — הרצף הנוכחי.**
 *
 * ⛔ **הנוכחי, ⛔ ולא המרבי.** `arenaSummary.ts` כבר מחזיק «רצף מרבי» — מספר שנועד
 * למסך הסיכום, כלומר **אחרי** הקרב. ⇒ שתי הפונקציות ⛔ אינן אותה פונקציה, וההבדל
 * ביניהן הוא כל מה שהשורה הזאת פותחת: הטלה שגויה מאפסת את הנוכחי, ⛔ ולא את המרבי.
 * ⛔ **טהורה** — קוראת `state.casts` בלבד, המבנה שכבר קיים; ⛔ אפס שדה חדש ב-state.
 */
describe('T-401 · streakAt — הרצף הנוכחי בסרגל העליון', () => {
  it('קרב טרי ⇒ 0, ⇒ השבב ⛔ אינו מצויר', () => {
    expect(streakAt(FRESH)).toBe(0);
  });

  it('שלוש נכונות ברצף ⇒ 3, והמעבר לזהב הוא בדיוק `STREAK_HOT`', () => {
    let s = FRESH;
    s = cast(s, 'אפשרות 1', 1_000);
    expect(streakAt(s)).toBe(1);
    s = cast(s, 'אפשרות 2', 2_000);
    expect(streakAt(s)).toBe(2);
    expect(streakAt(s)).toBeLessThan(STREAK_HOT);
    s = cast(s, 'אפשרות 3', 3_000);
    expect(streakAt(s)).toBe(3);
    expect(streakAt(s)).toBeGreaterThanOrEqual(STREAK_HOT);
  });

  it('⛔ הטלה שגויה מאפסת ל-0 — ⛔ ולא «מורידה באחת»', () => {
    let s = FRESH;
    s = cast(s, 'אפשרות 1', 1_000);
    s = cast(s, 'אפשרות 2', 2_000);
    expect(streakAt(s)).toBe(2);
    s = cast(s, '⛔ תשובה שגויה', 3_000);
    expect(streakAt(s)).toBe(0);
  });

  it('אחרי איפוס הרצף מתחיל למנות מחדש, ⛔ ואינו זוכר את מה שהיה לפניו', () => {
    let s = FRESH;
    s = cast(s, 'אפשרות 1', 1_000);
    s = cast(s, 'אפשרות 2', 2_000);
    s = cast(s, '⛔ תשובה שגויה', 3_000);
    s = cast(s, 'אפשרות 4', 4_000);
    expect(streakAt(s)).toBe(1);
  });

  it('⛔ טהורה — ⛔ אינה נוגעת ב-state ו⛔ אינה תלויה בסדר הקריאות', () => {
    let s = FRESH;
    s = cast(s, 'אפשרות 1', 1_000);
    const before = JSON.stringify(s);
    expect(streakAt(s)).toBe(streakAt(s));
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('T-363 · `37 § 4` — שלוש היכולות, והמאנה שיש לה לאן ללכת', () => {
  const words: ArenaWord[] = [
    { wordId: 'w1', headword: 'ECLIPSE', translationHe: 'ליקוי', kind: 'base' },
    { wordId: 'w2', headword: 'ABANDON', translationHe: 'לנטוש', kind: 'base' },
  ];

  it('שלוש עלויות, מהרנדר — ⛔ ולא נבחרו כאן', () => {
    expect(ABILITY_COST).toEqual({ double: 4, shield: 3, freeze: 5 });
    expect(ABILITY_ORDER).toEqual(['double', 'shield', 'freeze']);
  });

  it('⛔ אין מאנה ⇒ ⛔ אי אפשר, והמצב חוזר כ**אותה הפניה**', () => {
    const s = startBattle(words);
    // ‏t=0 ⇒ מאנה 0.
    expect(canUseAbility(s, 'shield', 0)).toBe(false);
    expect(spendAbility(s, 'shield', 0)).toBe(s);
  });

  it('קנייה מורידה בדיוק את העלות מהמפלס', () => {
    const s = startBattle(words);
    // ‏20 שניות ⇒ 10 מאנה (תקרה).
    expect(manaAt(20_000, s.manaSpent)).toBe(MANA_CAP);
    const after = spendAbility(s, 'double', 20_000);
    expect(after.manaSpent).toBe(4);
    expect(manaAt(20_000, after.manaSpent)).toBe(MANA_CAP - 4);
  });

  it('`כפול` — ההטלה הנכונה הבאה מכפילה נזק, ואחריה התג נגמר', () => {
    const base = startBattle(words);
    const plain = cast({ ...base, shownAtMs: 20_000 }, 'ליקוי', 22_000);
    const doubled = cast({ ...spendAbility(base, 'double', 20_000), shownAtMs: 20_000 }, 'ליקוי', 22_000);
    const plainDamage = base.enemyHp - plain.enemyHp;
    expect(plainDamage).toBeGreaterThan(0);
    expect(base.enemyHp - doubled.enemyHp).toBe(plainDamage * 2);
    expect(doubled.pendingDouble).toBe(false);
  });

  it('⛔ הטלה שגויה ⛔ אינה צורכת את `כפול` — ⛔ אין ענישה על טעות (R-016 · `§ 5`)', () => {
    const s = { ...spendAbility(startBattle(words), 'double', 20_000), shownAtMs: 20_000 };
    const wrong = cast(s, 'תשובה שגויה', 22_000);
    expect(wrong.pendingDouble).toBe(true);
    expect(wrong.enemyHp).toBe(s.enemyHp);
  });

  it('⛔ `כפול` פעיל ⇒ ⛔ אי אפשר לקנות שוב, ו⛔ אין גבייה שנייה', () => {
    const s = spendAbility(startBattle(words), 'double', 20_000);
    expect(canUseAbility(s, 'double', 20_000)).toBe(false);
    expect(spendAbility(s, 'double', 20_000).manaSpent).toBe(4);
  });

  it('`מגן` — המכה הבאה ⛔ אינה פוגעת, באותה חסינות של `§ 6`', () => {
    const s = startBattle(words);
    // מכה 2 נוחתת ב-16,000. קנייה ב-10,000 מכוונת אליה.
    const unshielded = tick({ ...s, lastSwingMs: 8_000 }, 16_000);
    expect(unshielded.learnerHp).toBeLessThan(s.learnerHp);
    const shielded = tick(spendAbility({ ...s, lastSwingMs: 8_000 }, 'shield', 10_000), 16_000);
    expect(shielded.learnerHp).toBe(s.learnerHp);
  });

  it('⛔ `מגן` על מכה שכבר מוגנת ⛔ אינו נקנה פעמיים', () => {
    const s = spendAbility({ ...startBattle(words), lastSwingMs: 8_000 }, 'shield', 10_000);
    expect(canUseAbility(s, 'shield', 10_000)).toBe(false);
    expect(spendAbility(s, 'shield', 10_000).manaSpent).toBe(ABILITY_COST.shield);
  });

  it('`הקפאה` — מחזור שלם בלי מכה, ואז הקרב ממשיך כרגיל', () => {
    const s = { ...startBattle(words), lastSwingMs: 8_000 };
    const frozen = spendAbility(s, 'freeze', 10_000);
    expect(isFrozen(frozen, 10_000)).toBe(true);
    // המכה של 16,000 ⛔ לא קרתה.
    const during = tick(frozen, 16_000);
    expect(during.learnerHp).toBe(s.learnerHp);
    // ⛔ ואינה נצברת: המכה של 24,000 כן נוחתת, ופעם אחת.
    const after = tick(during, 24_000);
    expect(s.learnerHp - after.learnerHp).toBe(1);
    expect(isFrozen(after, 24_000)).toBe(false);
  });

  it('⛔ הקפאה בזמן הקפאה ⛔ אינה נקנית — ⛔ ואין הארכה אינסופית', () => {
    const frozen = spendAbility({ ...startBattle(words), lastSwingMs: 8_000 }, 'freeze', 10_000);
    expect(canUseAbility(frozen, 'freeze', 11_000)).toBe(false);
    expect(spendAbility(frozen, 'freeze', 11_000)).toBe(frozen);
  });

  it('🛡️ גלגול ומגן מגיעים לאותה חסינות — ⛔ והמסך עדיין יודע להבדיל ביניהם', () => {
    const s = { ...startBattle(words), lastSwingMs: 8_000 };
    // חלון הגלגול של מכה 2: `2*8000 - 6000 + 5300` ⇒ 15,300 עד 15,700.
    const rolled = dodge(s, 15_400);
    const shielded = spendAbility(s, 'shield', 10_000);
    expect(rolled.immuneBy).toBe('dodge');
    expect(shielded.immuneBy).toBe('shield');
    expect(rolled.dodgedSwing).toBe(shielded.dodgedSwing);
    // ⛔ ‏`tick` ⛔ אינו קורא את השדה: אותה חסינות בדיוק, בשני המסלולים.
    expect(tick(rolled, 16_000).learnerHp).toBe(tick(shielded, 16_000).learnerHp);
    // ⛔ והחסינות שנצרכה לוקחת איתה את השם.
    expect(tick(shielded, 16_000).immuneBy).toBeNull();
  });

  it('🔴 גדר 1 של `§ 7` — ⛔ אף יכולת ⛔ אינה נוגעת בכמה אנגלית הלומד פוגש', () => {
    const s = startBattle(words);
    for (const key of ABILITY_ORDER) {
      const after = spendAbility(s, key, 20_000);
      expect(after.words).toBe(s.words);
      expect(after.index).toBe(s.index);
      expect(after.casts).toBe(s.casts);
      expect(after.shownAtMs).toBe(s.shownAtMs);
    }
  });

  it('⛔ יכולת ⛔ אינה מרפאה ו⛔ אינה מזיזה חיים בעצמה', () => {
    const s = startBattle(words);
    for (const key of ABILITY_ORDER) {
      const after = spendAbility(s, key, 20_000);
      expect(after.learnerHp).toBe(s.learnerHp);
      expect(after.enemyHp).toBe(s.enemyHp);
    }
  });
});
