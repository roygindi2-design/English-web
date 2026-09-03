import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ArenaWord } from './arenaWords';
import {
  ANNOUNCE_AT_MS,
  BATTLE_MS,
  ENEMY_SWING_MS,
  MANA_CAP,
  TELEGRAPH_MS,
  WINDOW_END_MS,
  cast,
  dodge,
  isRage,
  manaAt,
  outcomeAt,
  startBattle,
  telegraphAt,
  tick,
  UNFILTERED_BONUS_DAMAGE,
} from './battle';

/**
 * ⚠️ **הפיקסצ׳ר, ⛔ ולא TODO** (התוכנית, § 6 צעד 4): `startBattle` על ארבע `ArenaWord`.
 *
 * ⚠️ **סטייה מדודה, ⛔ ולא בחירה — `learnerHpMax` הוא 20 ⛔ ולא 10.** התוכנית נקבה
 * ב-10/10, ובדיקת קצב היריב שהיא עצמה כתבה דורשת
 * `FRESH.learnerHp - Math.floor(BATTLE_MS / ENEMY_SWING_MS)` = **11 מכות**. ⇒ ב-10
 * חיים הטענה נופלת על **קוד תקין**: חיים נחתכים באפס (⛔ חיים שליליים הם מצב שאין
 * לו ציור), והשוואה ל-`10 - 11 = -1` ⛔ לעולם אינה יכולה לעבור. הטענה של התוכנית
 * נשמרת **מילה במילה**; זז המספר בפיקסצ׳ר בלבד. נרשם ב-`26-plan-feedback.md`.
 */
const word = (n: number): ArenaWord => ({
  wordId: `w${n}`,
  headword: `Lorem${n}`,
  translationHe: `אפשרות ${n}`,
  kind: 'base',
});

const FRESH = startBattle([word(1), word(2), word(3), word(4)], 20, 10);

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
    const s = startBattle(words, 12, 20);
    expect(dodge(s, 3_000)).toEqual(s);
    expect(dodge(s, 2_000 + WINDOW_END_MS)).toEqual(s);
  });

  it('החלקה בתוך החלון מסמנת את המכה, והמכה נוחתת ב⛔ אפס נזק', () => {
    const s = dodge(startBattle(words, 12, 20), 2_000 + ANNOUNCE_AT_MS);
    expect(s.dodgedSwing).toBe(1);
    expect(tick(s, ENEMY_SWING_MS).learnerHp).toBe(12);
  });

  it('⛔ בלי גלגול — המכה פוגעת, וזו ההוכחה שהבדיקה מודדת את הגלגול ⛔ ולא כלום', () => {
    expect(tick(startBattle(words, 12, 20), ENEMY_SWING_MS).learnerHp).toBe(11);
  });

  it('⛔ הגלגול מבטל את המכה **כולה**, כולל עונש התשובה השגויה שהיה תלוי בה', () => {
    const wrong = cast(startBattle(words, 12, 20), 'לא נכון', 500);
    expect(wrong.pendingPenalty).toBe(1);
    const rolled = dodge(wrong, 2_000 + ANNOUNCE_AT_MS);
    const after = tick(rolled, ENEMY_SWING_MS);
    expect(after.learnerHp).toBe(12);
    expect(after.pendingPenalty).toBe(0);
    expect(after.dodgedSwing).toBeNull();
  });

  it('⛔ החסינות שייכת למכה אחת: אם שתי מכות התאחדו בפריים, השנייה עדיין פוגעת', () => {
    const s = dodge(startBattle(words, 12, 20), 2_000 + ANNOUNCE_AT_MS);
    expect(tick(s, 2 * ENEMY_SWING_MS).learnerHp).toBe(11);
  });

  it('⛔ הגלגול ⛔ אינו עוצר את השעון — `outcomeAt` על אותו זמן ⛔ אינו משתנה', () => {
    const s = startBattle(words, 12, 20);
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
    const base = cast(startBattle([unfW('a', 'base')], 3, 20), 'ת-a', 5_000);
    const unf = cast(startBattle([unfW('a', 'unfiltered')], 3, 20), 'ת-a', 5_000);
    expect(20 - unf.enemyHp).toBe((20 - base.enemyHp) + UNFILTERED_BONUS_DAMAGE);
  });

  it('⛔ הבונוס ⛔ אינו חל על `known` ו⛔ לא על `base`', () => {
    const known = cast(startBattle([unfW('a', 'known')], 3, 20), 'ת-a', 5_000);
    const base = cast(startBattle([unfW('a', 'base')], 3, 20), 'ת-a', 5_000);
    expect(known.enemyHp).toBe(base.enemyHp);
  });

  it('`unfiltered` שגויה ⇒ המילה חוזרת לסוף התור **באותו קרב**', () => {
    const s = cast(
      startBattle([unfW('a', 'unfiltered'), unfW('b', 'base')], 3, 20),
      'לא נכון',
      5_000,
    );
    expect(s.words.map((x) => x.wordId)).toEqual(['a', 'b', 'a']);
    expect(s.index).toBe(1);
  });

  it('⛔ אין עונש כפול: `unfiltered` שגויה גורעת חיים **בדיוק** כמו כל שגיאה אחרת', () => {
    const unf = cast(startBattle([unfW('a', 'unfiltered')], 3, 20), 'לא נכון', 5_000);
    const base = cast(startBattle([unfW('a', 'base')], 3, 20), 'לא נכון', 5_000);
    expect(unf.pendingPenalty).toBe(base.pendingPenalty);
    expect(unf.learnerHp).toBe(base.learnerHp);
  });

  it('⛔ מילה חוזרת **פעם אחת בלבד** — שגיאה שנייה עליה ⛔ אינה מאריכה את התור לנצח', () => {
    const first = cast(startBattle([unfW('a', 'unfiltered')], 3, 20), 'לא נכון', 5_000);
    const second = cast(first, 'לא נכון', 9_000);
    expect(second.words.map((x) => x.wordId)).toEqual(['a', 'a']);
  });

  it('⛔ `casts[i]` עדיין תואם ל-`words[i]` אחרי חזרה', () => {
    const s = cast(
      startBattle([unfW('a', 'unfiltered'), unfW('b', 'base')], 3, 20),
      'לא נכון',
      5_000,
    );
    const t = cast(s, 'ת-b', 6_000);
    expect(t.casts.map((c) => c.wordId)).toEqual(['a', 'b']);
    expect(t.words.slice(0, 2).map((x) => x.wordId)).toEqual(['a', 'b']);
  });
});
