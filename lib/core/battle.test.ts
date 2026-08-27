import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ArenaWord } from './arenaWords';
import {
  BATTLE_MS,
  ENEMY_SWING_MS,
  MANA_CAP,
  cast,
  isRage,
  manaAt,
  outcomeAt,
  startBattle,
  tick,
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
