import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ArenaSummary, { type ArenaMissed } from '@/components/ArenaSummary';
import { ARCADE_MISSED_LIMIT } from '@/lib/core/arcadeResult';
import { summarize } from '@/lib/core/arenaSummary';
import { withoutComments } from '@/lib/testSource';

/**
 * T-180 · `37 § 10` — סריקת מקור על התבנית של `components/ArenaStage.test.ts:1-25`.
 * ⚠️ **מולבן, ⛔ ולא `SRC` גולמי:** הרכיב **מתעד בהערה** מה אין בו, ומדידה גולמית
 * הייתה מפילה קובץ ⛔ שאין בו ולו הפרה אחת (F-039 · F-065).
 */
const SRC = readFileSync('components/ArenaSummary.tsx', 'utf8');
const CODE = withoutComments(SRC);

describe('<ArenaSummary> — 37 § 10 · kol-B-07-results.png', () => {
  it('שלוש שורות הסיכום, בשמן מהרנדר', () => {
    for (const label of ['נכונות', 'זמן תגובה ממוצע', 'רצף מרבי']) {
      expect(CODE).toContain(label);
    }
  });

  it('שורת החותם של האינווריאנט מופיעה מילה במילה (37 § 13.1)', () => {
    expect(CODE).toContain('הזירה לא שינתה דבר בהתקדמות הלמידה');
  });

  it('⛔ הרכיב ⛔ אינו כותב — אפס רשת ואפס שם עמודה', () => {
    for (const banned of [/apiPost/, /fetch\(/, /word_progress/, /arcade_progress/]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ אינו מחשב — הסיכום מגיע כ-prop', () => {
    expect(CODE).toMatch(/summary/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(/);
  });

  /**
   * 🥊 **⟦17/09 · `C-0707` · `T-422`⟧ `min-h-[100dvh]` ⛔ **הוחלף**, ⛔ ולא נמחק בשקט.**
   * הטענה כאן דרשה אותו מאז שנכתבה, והמדידה החיה של הטיק הזה הראתה שהוא **הוא עצמו**
   * מקור הגלישה: מקטע בתוך כרום הפריסה שמבקש את מלוא `100dvh` גולש ב-**84px בדיוק**
   * (‏52 כותרת + 32 `pb-32`), ⛔ לפני שנספר ילד אחד. ⇒ הגדר לא ירדה — היא **התהפכה**:
   * הגובה המדויק נדרש, והמינימום נאסר. ‏`h-screen` ⛔ אסור כמקודם (חוקה § 4 · `F-011`).
   */
  it('⛔ אפס hex, ⛔ אפס h-screen, גובה **מדויק** ⛔ ולא מינימום, ⛔ אפס רדיוס מחוץ לסולם', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
    // ⟦T-428⟧ בתוך הסקופ הכרום יורד ⇒ `100dvh` **מלא**, ⛔ ולא ניכוי של 84 שאינם קיימים.
    expect(CODE).toMatch(/data-arena-scope className="flex h-\[100dvh\]/);
    expect(CODE).not.toMatch(/h-\[calc\(100dvh-5\.25rem\)\]/);
    expect(CODE, '⛔ המינימום הוא מה שגלש').not.toMatch(/min-h-\[100dvh\]/);
    expect(CODE).not.toMatch(/rounded-\[\d/);
  });

  it('אנגלית מגיעה ללומד אך ורק בתוך <EnWord>', () => {
    expect(CODE).toMatch(/<EnWord/);
  });

  it('T-282 — הלוח הכחול: כותרת הרנדר, hook למדידה, ו⛔ אפס חישוב ברכיב', () => {
    expect(CODE).toMatch(/data-arena-first-met/);
    expect(CODE).toMatch(/firstMetHe\(/);
    expect(CODE).toMatch(/summary\.firstMet\.length > 0 &&/);
    // 12px, ⛔ not the render's 11.5 — Layer A floor (scripts/check-text-floor.mjs).
    // ⟦T-517⟧ the slow panel and the footer line came up to the floor too ⇒ zero, ⛔ not one.
    expect(CODE).not.toMatch(/text-\[11(?:\.5)?px\]/);
  });

  it('T-283 — שלושה סיומים, ⛔ לא בוליאני; ⛔ «הפסדת» ו⛔ «הקרב נגמר» אינם על המסך', () => {
    expect(CODE).not.toMatch(/enemyDefeated/);
    expect(CODE).not.toMatch(/הפסדת/);
    expect(CODE).not.toMatch(/הקרב נגמר/);
    expect(CODE).toMatch(/ending\.kind === 'victory'/);
    expect(CODE).toMatch(/wordsFromBossHe\(/);
    expect(CODE).toMatch(/data-arena-ending/);
    expect(CODE).toContain('החזקת מעמד עד סוף השעון');
    expect(CODE).toContain('היריב החזיק מעמד');
  });
});

/**
 * 🔴 **T-338 — שלוש שורות הסטטיסטיקה.** `render_video_B.py:620-621` שם את התווית
 * בימין (`anchor="rm"`) ואת הערך בשמאל (`anchor="lm"`); הרכיב גזר מאותן שורות את
 * הגובה והפסיעה ואז הפך את הציר. המדידה בפיקסלים יושבת ב-`verify-mobile.mjs`.
 */
describe('ArenaSummary — ציר ה-RTL (T-338)', () => {
  const SRC_RTL = withoutComments(readFileSync('components/ArenaSummary.tsx', 'utf8'));

  it('⛔ ⛔ אין `flex-row-reverse` בשורת הסטטיסטיקה', () => {
    expect(SRC_RTL).not.toContain('flex-row-reverse');
  });

  // 🔁 `T-451` (`C-0781`) — שורה רביעית, מותנית: «חזרה מהירה · תיקנת N מתוך M» (`37 § 8` ק8).
  it('ארבע השורות (השלוש + שורת החזרה המותנית) נושאות `data-rtl-row` ⇒ השער מודד כל אחת בדפדפן', () => {
    expect(SRC_RTL.match(/data-rtl-row="summary-stat"/g)).toHaveLength(4);
  });
});

/**
 * 🎬 **T-428 · `36 § 8.0` ① — מסך הסיום נכנס לשפה הכהה של הזירה.**
 * 🔬 `C-0708`: בלי `data-arena-scope` המקטע היה `left=24 w=345` ושקוף על גוף בהיר.
 * ⛔ ושום טוקן `globals` שמתחלף לפי `prefers-color-scheme` ⛔ אינו נשאר: בסכימה בהירה
 * `--ink` הוא דיו כהה, ועל `--arena-night` הוא ⛔ נקרא.
 */
describe('T-428 — הסקופ של הזירה, ⛔ וטוקנים שמתחלפים עם הסכימה', () => {
  const T428_CODE = withoutComments(readFileSync(new URL('./ArenaSummary.tsx', import.meta.url), 'utf8'));
  it('השורש נושא `data-arena-scope` בגובה `100dvh` מלא', () => {
    expect(T428_CODE).toMatch(/<section data-arena-scope className="flex h-\[100dvh\]/);
  });
  it('⛔ אף טוקן צבע של `globals` — רק שמות הזירה', () => {
    const banned = /\b(?:text|bg|border)-(?:ink|ink-muted|brand|brand-surface|brand-on|danger|success|surface|surface-raised|border-subtle|border-strong)\b(?![-\w])/g;
    expect(T428_CODE.match(banned) ?? []).toEqual([]);
  });
  it('בקרה שלילית — הביטוי תופס את הטוקן הישן', () => {
    const banned = /\b(?:text|bg|border)-(?:ink|ink-muted|brand-surface)\b(?![-\w])/;
    expect(banned.test('rounded-2xl bg-brand-surface px-5')).toBe(true);
    expect(banned.test('text-[color:var(--arena-ink)]')).toBe(false);
  });
});

/**
 * 🏁 **T-517 · `D-302` — קרב נגמר במסך אחד: כותרת אחת ושתי פעולות.**
 * 🔬 נמדד `C-0861`: `ArenaBattle.tsx` רינדר `<ArenaSummary>` **ו**-`<ArenaResult>` כאחים —
 * שני `100dvh`, שני `h1` («היריב נוצח» פעמיים), ו-`חזרה לזירה` · `עוד קרב` שניהם `again`.
 * המדידה בפיקסלים יושבת ב-`verify-mobile.mjs` (`/dev/arcade/summary`).
 */
describe('T-517 — מסך סיום אחד', () => {
  const BATTLE = withoutComments(readFileSync('components/ArenaBattle.tsx', 'utf8'));

  it('`h1` אחד בדיוק', () => {
    expect(CODE.match(/<h1\b/g)).toHaveLength(1);
  });

  it('שתי פעולות בדיוק — `עוד קרב` (again) ו-`חזרה לעולם` (/world) — ברצועה אחת', () => {
    expect(CODE.match(/<ActionBar\b/g)).toHaveLength(1);
    expect(CODE.match(/<button\b/g)).toHaveLength(1);
    expect(CODE.match(/<Link\b/g)).toHaveLength(1);
    expect(CODE).toContain("'עוד קרב'");
    expect(CODE).toContain("'חזרה לעולם'");
    expect(CODE).toMatch(/onClick=\{onAgain\}/);
    expect(CODE).toMatch(/href="\/world"/);
  });

  it('⛔ `חזרה לזירה` ⛔ אינו על המסך', () => {
    expect(CODE).not.toContain('חזרה לזירה');
  });

  it('⛔ `ArenaBattle` ⛔ אינו מרנדר מסך סיום שני', () => {
    expect(BATTLE).not.toMatch(/<ArenaResult\b/);
    expect(BATTLE.match(/<ArenaSummary\b/g)).toHaveLength(1);
  });
});

/**
 * 📖 **T-518 · `D-302`ⓒ — «המילים שהפילו אותך» על המסך הראשון, והפריט שנפתח איתן.**
 * ⚠️ **מרונדר, ⛔ ולא סריקת מקור** — «קיים ⇔ יש החטאה» הוא התנהגות, ו-`renderToStaticMarkup`
 * מודד אותה בלי דפדפן. הפיקסלים (`bottom ≤ innerHeight`) ב-`verify-mobile.mjs`.
 * ⚠️ **שש החטאות ⇒ חמש שורות, ⛔ ולא שש:** `ARCADE_MISSED_LIMIT` = 5 בשרת (`arcadeResult.ts`),
 * ⇒ פיקסטורה של שש שמציגה שש הייתה מודדת מסך שהייצור ⛔ לעולם ⛔ אינו מצייר.
 */
describe('T-518 — הרשימה והפריט במסך האחד', () => {
  const miss = (n: number): ArenaMissed => ({
    wordId: `m${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    chosen: `מסיח ${n}א`,
  });
  const render = (missed: readonly ArenaMissed[], unlocked: string | null): string =>
    renderToStaticMarkup(
      createElement(ArenaSummary, {
        ending: { kind: 'victory', wordsFromBoss: 0 },
        summary: summarize([]),
        headwords: {},
        onAgain: () => {},
        missed,
        unlocked,
      }),
    );

  it('שש החטאות ⇒ `[data-arena-missed]` קיים, עד הגבול של השרת, עם התשובה ומה שנבחר', () => {
    const html = render([1, 2, 3, 4, 5, 6].map(miss), null);
    const list = html.match(/<ul data-arena-missed[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? '';
    expect(list.match(/<li\b/g)).toHaveLength(ARCADE_MISSED_LIMIT);
    expect(html).toContain('המילים שהפילו אותך');
    expect(html).toContain('התשובה: אפשרות 1');
    expect(html).toContain('בחרת: מסיח 1א');
    expect(html).not.toContain('Lorem6');
  });

  it('אפס החטאות ⇒ ⛔ אין רשימה ו⛔ אין כותרת', () => {
    const html = render([], null);
    expect(html).not.toContain('data-arena-missed');
    expect(html).not.toContain('המילים שהפילו אותך');
  });

  it('פריט שנפתח ⇒ שורה אחת עם שמו; `null` ⇒ ⛔ אין שורה', () => {
    expect(render([], 'helmet')).toMatch(/data-arena-unlocked[\s\S]*נפתח לך פריט חדש[\s\S]*קסדה/);
    expect(render([], null)).not.toContain('data-arena-unlocked');
  });

  it('עדיין `h1` אחד ושתי פעולות, גם עם רשימה מלאה ופריט', () => {
    const html = render([1, 2, 3, 4, 5, 6].map(miss), 'helmet');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html.match(/data-arena-again/g)).toHaveLength(1);
    expect(html.match(/data-arena-back/g)).toHaveLength(1);
  });

  it('הרשימה בתוך האזור הגמיש — ⛔ העמוד ⛔ אינו נגלל', () => {
    const region = CODE.indexOf('min-h-0 flex-1 flex-col gap-3 overflow-y-auto');
    expect(region).toBeGreaterThan(-1);
    expect(CODE.indexOf('data-arena-missed')).toBeGreaterThan(region);
    expect(CODE.indexOf('data-arena-missed')).toBeLessThan(CODE.indexOf('<ActionBar'));
  });

  it('אנגלית רק בתוך `<EnWord>`', () => {
    expect(CODE).toMatch(/<EnWord[^>]*>\{row\.headword\}/);
  });
});

/**
 * 🧳 **הועבר מ-`ArenaResult.test.ts` (נמחק ב-`T-518`)** — הגדרות שהמסך השני נשא, ⛔ ושאין
 * סיבה שייעלמו עם הקובץ: המסך האחד ⛔ אינו כותב, ⛔ אינו מנקד, ⛔ אינו משבח, ⛔ ואינו מתזמן.
 */
describe('הגדרות מסך הסיום (D-044 · D-047 · D-050 · R-016 · D-045)', () => {
  it('⛔ אפס מנוע חזרות', () => {
    for (const banned of [/easiness/, /repetition/, /next_review_at/, /supabase|\.from\(/]) {
      expect(CODE, `${banned} אסור`).not.toMatch(banned);
    }
    expect(CODE).not.toContain('הוסף לרשימת החזרה');
  });

  it('⛔ אפס ניקוד, מטבע, XP ולוח תוצאות', () => {
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i, /\bleaderboard\b/i]) {
      expect(CODE, `${banned} אסור`).not.toMatch(banned);
    }
    for (const word of ['ניקוד', 'מטבע', 'לוח תוצאות', 'רצף יומי']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('⛔ אין שבח ואין נזיפה', () => {
    for (const word of ['כל הכבוד', 'נהדר', 'מצוין', 'טעית', 'נכשלת', 'הפסדת']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('⛔ אין שעון', () => {
    for (const banned of [/\bsetTimeout\b/, /\bsetInterval\b/, /\brequestAnimationFrame\b/, /\bcountdown\b/i, /\bDate\.now\b/]) {
      expect(CODE, `${banned} אסור`).not.toMatch(banned);
    }
  });

  it('`data-arena-back` חוזר ל-`/world`, ⛔ לא ל-`/cards`', () => {
    expect(CODE).toContain('data-arena-back href="/world"');
  });
});
