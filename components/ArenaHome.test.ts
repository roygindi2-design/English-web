import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaHome.tsx', import.meta.url), 'utf8');
/**
 * ⚠️ **הלבנה, ⛔ ולא מקור גולמי** — אותו דפוס בדיוק של `app/arcade/page.test.ts`
 * (‏F-039 · F-064 · F-065): הקובץ **מתעד בהערה** את מה שאסור בו, ומדידה גולמית הייתה
 * מפילה קובץ ⛔ שאין בו ולו הפרה אחת. ⛔ מחרוזות שהלומד רואה נמדדות על **המקור**.
 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('ArenaHome — `37 § 12` ומול `docs/design/kol-B-01-home.png`', () => {
  it('הכותרת ותת-הכותרת, מילה במילה מ-`37 § 12`', () => {
    expect(SRC).toContain('זירת קרב');
    expect(SRC).toContain('ארקייד · מבודד מהתקדמות הלמידה');
  });

  it('התווית שמפרידה בין רמת הזירה לרמת האנגלית — ⛔ המשפט שהמסך קיים בשבילו', () => {
    expect(SRC).toContain('נפרדת מרמת האנגלית שלך');
    expect(SRC).toContain('רמת זירה');
  });

  it('שלוש הפעולות של `37 § 12`', () => {
    expect(SRC).toContain('התחל קרב');
    expect(SRC).toContain('עיצוב דמות');
    expect(SRC).toContain('ארון ציוד');
  });

  /**
   * ⛔ **המילה `xp` ⛔ אינה נבדקת כתת-מחרוזת, וזו תיקון של התוכנית ⛔ ולא הרפיה שלה:**
   * ‏`export` מכילה `xp`, ⇒ `not.toContain('xp')` היה מפיל **כל** קובץ TypeScript
   * בעולם ו⛔ לא מודד דבר. הגבול הוא **מילה**, ולכן `\bxp\b`.
   */
  it('⛔ D-131 — ⛔ אין מד XP ו⛔ אין שבב שברים', () => {
    for (const banned of ['שברי ניצוץ', '2,000', '1,240']) {
      expect(CODE).not.toContain(banned);
    }
    expect(CODE).not.toMatch(/\bxp\b/i);
  });

  it('⛔ D-132 — ⛔ אף שם פריט של הרנדר', () => {
    for (const banned of ['חרב הניצוץ', 'מגן אבן', 'לחש אש', 'שריון קל']) {
      expect(CODE).not.toContain(banned);
    }
  });

  it('⛔ הרכיב מצייר ו⛔ אינו מחשב — חשבון מסלול הבוס חי בליבה', () => {
    expect(SRC).toContain('bossTrack');
    expect(SRC).toContain('winsToBoss');
    expect(SRC).toContain('homeSlots');
    expect(CODE).not.toMatch(/%\s*5|Math\.floor/);
    // ⛔ והמספר 5 עצמו ⛔ אינו חי כאן — `BOSS_EVERY` חי ב-`lib/core/arenaHome.ts`.
    expect(CODE).not.toContain('BOSS_EVERY');
  });

  it('שכבה א׳ — 44px על שתי הפעולות המשניות, אף שהרנדר מצייר 42', () => {
    expect(CODE).toContain('min-h-touch');
    expect(CODE).not.toContain('h-[42px]');
  });

  /**
   * ⚠️ **D-137 (PM, C-0338 · שכבה ב׳) דרס את התוכנית, וזה ⛔ אינו שינוי שקט:** התוכנית
   * הורתה לשלוח את תווית המשבצת ב-**9px** של הרנדר ולפתוח עליה את F-162. ‏D-137 סגר
   * את F-162 במדידה — 9px היה הופך לטקסט הקטן ביותר ששוגר במוצר, **25% מתחת** למדרגה
   * הקטנה בסולם — וקבע: **טקסט משני בזירה הוא `text-xs` (12px) ומעלה**.
   */
  it('D-137 — ⛔ אין בזירה מספר גופן מתחת ל-12: תווית המשבצת היא `text-xs`', () => {
    expect(CODE).toContain('text-xs');
    for (const banned of ['text-[9px]', 'text-[10px]', 'text-[11px]', 'text-[10.5px]', 'text-[11.5px]']) {
      expect(CODE).not.toContain(banned);
    }
  });

  it('שכבה א׳ — מצב צומת ⛔ אינו מקודד בצבע בלבד', () => {
    // צורה לכל מצב: וי · נקודה מלאה · גולגולת, ושם נגיש בעברית לכל צומת.
    expect(SRC).toContain('aria-label');
    expect(SRC).toContain('נוצח');
    expect(SRC).toContain('קרב הבוס');
  });

  it('הזירה מציירת משטח משלה — ⛔ אחרת הטקסט יושב על רקע העמוד (F-155)', () => {
    expect(CODE).toContain('data-arena-scope');
    // ⟦T-420⟧ גובה **מדויק** — `min-h-[100dvh]` היה הגלישה עצמה (+460px ב-320×568).
    expect(CODE).toContain('h-[100dvh]');
    expect(CODE).not.toContain('h-screen');
  });

  /**
   * ⚠️ **הסינון על סימני קוד ⛔ אינו הרפיה של הבדיקה — הוא מה שהופך אותה למדידה.**
   * הביטוי `>…<` תופס גם ג׳נריקה של TypeScript (`useState<…>(…)`) וגם טרנארי בתוך JSX,
   * ושניהם ⛔ אינם צומת טקסט. צומת טקסט אמיתי ⛔ אינו נושא `= ; ( ) ?` —
   * ⇒ דליפה אמיתית כמו `>Start battle<` עדיין נופלת, וקוד ⛔ אינו נספר כמחרוזת.
   */
  it('⛔ RTL, ו⛔ אין מחרוזת אנגלית שהלומד רואה', () => {
    const strings = CODE.match(/>[^<>{}]*[A-Za-z][^<>{}]*</g) ?? [];
    const text = strings.filter((s) => /[=;()?]/.test(s) === false);
    expect(text.filter((s) => /[א-ת]/.test(s) === false && s.trim().length > 3)).toEqual([]);
  });

  it('`prefers-reduced-motion` — נשימת ה-idle נעצרת (שכבה א׳)', () => {
    expect(SRC).toContain('motion-reduce:animate-none');
  });

  it('T-217 — `עיצוב דמות` is live: ⛔ no `disabled`, ⛔ no «תיפתח בקרוב», and it calls onDesign', () => {
    expect(SRC).not.toContain('בחירת דמות תיפתח בקרוב');
    expect(SRC).not.toContain('arena-design-soon');
    expect(SRC).toContain('onDesign(');
  });

  it('the pedestal avatar draws the stored character', () => {
    expect(SRC).toMatch(/<ArenaAvatar role="hero" items=\{state\.unlockedItems\} character=\{state\.character\}/);
  });

  it('⛔ אפס hex ברכיב — הצבע מגיע מטוקני הזירה (חוקה § 2)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אפס אמוג׳י — אייקוני SVG בלבד (שכבה א׳)', () => {
    expect(CODE).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('⛔ נקודת קצה אחת, והיא זו של T-181', () => {
    const paths = [...CODE.matchAll(/'(\/api\/[^']+)'/g)].map((m) => m[1]);
    expect(new Set(paths)).toEqual(new Set(['/api/arcade/home']));
  });

  /**
   * T-253 · D-186 — הכניסה לזירה עוברת בטבעת (`lib/core/worldApps.ts`), והחץ
   * היחיד ביציאה הוביל ל-`/` ⇒ `signedInRedirect` ⇒ `/studies` — לשונית שהלומד
   * לא ביקש. ⓑ: `BACK_HE = 'חזרה'` היא גם שם חפיסת החזרות (`DeckSelector.tsx`,
   * `36 § 5`, נעול) — מילה אחת, שתי משמעויות. שתיהן נסגרות באותה תווית: החץ
   * חוזר ישירות לטבעת, ונקרא בשם היעד שלו — אותה תווית ששני צמתי הטבעת
   * האחרים כבר נושאים (`ComposeDraft.tsx` · `StoryScreen.tsx`).
   */
  it('T-253 — חץ החזרה מוביל ישירות לטבעת, ⛔ לא ל-`/`', () => {
    expect(CODE).toContain('href="/world"');
    expect(CODE).not.toMatch(/href="\/"/);
  });

  it('T-253ⓑ — תווית החץ היא `חזרה לעולם`, ⛔ לא `חזרה` החשופה שמתנגשת בשם החפיסה', () => {
    expect(SRC).toContain('חזרה לעולם');
    expect(SRC).not.toMatch(/aria-label=\{?['"]חזרה['"]\}?/);
  });
});

/**
 * 🔴 **T-338 — ציר ה-RTL של שלוש השורות במסך הבית.** המשך של `F-236`.
 * ⚠️ המדידה האמיתית היא בפיקסלים ב-`scripts/verify-mobile.mjs` (`[data-rtl-row]`,
 * הילד הראשון מימין לאחרון, ב-320/375/414). זו הרצפה המהירה שלה.
 */
describe('ArenaHome — ציר ה-RTL (T-338)', () => {
  const SRC_RTL = readFileSync('components/ArenaHome.tsx', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('⛔ ⛔ אין `flex-row-reverse` — במיכל RTL הוא הופך את הציר פעם שנייה', () => {
    expect(SRC_RTL).not.toContain('flex-row-reverse');
  });

  /**
   * ⚠️ **חמש ⇢ שש ב-T-360, וזה ⛔ אינו הרפיה של הבדיקה.** הלוח «הקרב האחרון» הוא שורה
   * אופקית נוספת במסך RTL (עובדה כתובה בימין, מספר בשמאל) ⇒ הוא נושא את אותה ידית
   * בדיוק, ו-`scripts/verify-mobile.mjs` מודד אותו ב-320/375/414 כמו את חמש האחרות.
   * ⛔ שורה אופקית **בלי** הידית היא שורה שהשער ⛔ אינו רואה — וזה מה שהמספר כאן שומר.
   */
  it('שש השורות נושאות `data-rtl-row` ⇒ השער מודד כל אחת **בנפרד**', () => {
    const handles = SRC_RTL.match(/data-rtl-row="([a-z-]+)"/g) ?? [];
    expect(handles).toHaveLength(6);
    expect(new Set(handles).size).toBe(6);
    expect(handles).toContain('data-rtl-row="last-round"');
  });

  /**
   * ↩️ **T-345 · `F-250` — החץ יושב ב-`start` ומצביע ימינה.**
   * ⛔ שתי טענות ו⛔ לא אחת, כי שתי הטעויות היו בלתי-תלויות: **הצד** (`end-1`, שהוא
   * שמאל ב-RTL) ו**הקודקוד** (`M11 0 …`, שמצביע שמאלה). תיקון אחד בלבד היה משאיר
   * חץ נכון במקום הפוך, או הפוך במקום נכון.
   */
  it('T-345 — חץ החזרה יושב ב-`start` (ימין בעברית), ⛔ ולא ב-`end`', () => {
    const link = SRC_RTL.match(/<Link[\s\S]*?<\/Link>/)?.[0] ?? '';
    expect(link).toContain('aria-label={BACK_TO_WORLD_HE}');
    expect(link).toContain('absolute start-1');
    expect(link).not.toContain('end-1');
    // ⛔ ולא קיבוע פיזי: `start` נשאר תלוי-כתיב, `right-1` ⛔ אינו.
    expect(link).not.toContain('right-1');
  });

  it('T-345 — קודקוד הגליף מצביע ימינה, כמו המשולש של הרנדר', () => {
    const glyph = SRC_RTL.match(/function ChevronGlyph[\s\S]*?\n}/)?.[0] ?? '';
    expect(glyph).toContain('d="M0 0 11 7 0 14z"');
    expect(glyph).not.toContain('M11 0 0 7l11 7z');
  });

  /**
   * 🔃 **T-344 · `D-245` · `F-249` — הרנדר קובע את הסדר.**
   * `render_video_B.py:194` מצייר `("ארון ציוד", "עיצוב דמות")` ב-`x = 24 + i*(bw+10)`
   * ⇒ `ארון ציוד` ב-`x=24` (**שמאל**) ו-`עיצוב דמות` ב-`x=192.5` (**ימין**). במיכל RTL
   * הילד הראשון הוא הימני ⇒ `עיצוב דמות` חייב להיות הראשון בסדר ה-DOM.
   * ⛔ **ו⛔ לא `flex-row-reverse`:** `T-338` תיקן את הציר, וההחזרה שלו הייתה מבטלת
   * את התיקון הזה בבאג שני (הבדיקה למעלה מודדת בדיוק את זה).
   */
  it('T-344 — `עיצוב דמות` הוא כפתור המשנה הראשון בסדר ה-DOM', () => {
    const row = SRC_RTL.match(/data-rtl-row="home-actions"[\s\S]*?\n {6}<\/div>/)?.[0] ?? '';
    expect(row).not.toBe('');
    expect(row.indexOf('{DESIGN_HE}')).toBeGreaterThan(-1);
    expect(row.indexOf('{DRAWER_HE}')).toBeGreaterThan(-1);
    expect(row.indexOf('{DESIGN_HE}')).toBeLessThan(row.indexOf('{DRAWER_HE}'));
  });

  /**
   * 📐 **T-342 · `D-244`ⓐ · `F-246`ⓐ — ארבעת התאים עוטפים, ⛔ ולא נחתכים.**
   * `D-244` פסלה **במספר** את שתי החלופות: תא 52px משאיר 4px בין שני יעדי מגע,
   * ומרווח 0 מאחד ארבעה יעדים לרצועה אחת. ⇒ נשאר לעטוף.
   * ⛔ **ו-`max-w-[140px]` ⛔ אינו מספר שרירותי:** `2×66 + 8` — בדיוק שני תאים ומרווח,
   * כלומר 2×2 מתחת ל-375 ⇒ שורה אחת של ארבעה מ-375 ומעלה, שם `min-[375px]:max-w-none`
   * משחרר את התקרה.
   */
  it('T-342 — שתי רצועות התאים עוטפות, ושתיהן באותה נוסחה', () => {
    const rows = SRC_RTL.match(/className="[^"]*" data-rtl-row="(?:gear|drawer)-slots"/g) ?? [];
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row).toContain('flex-wrap');
      expect(row).toContain('max-w-[140px]');
      expect(row).toContain('min-[375px]:max-w-none');
      // ⛔ `justify-between` פרש את המרווחים ל-21px ב-375; הרנדר מצייר 8 קבוע.
      expect(row).not.toContain('justify-between');
    }
  });
});

/**
 * 🦴 **T-398 — השלד מצייר את ששת האזורים, ⛔ ולא שלושה מתוכם.**
 *
 * 🔬 **נמדד `C-0664` בדפדפן חי עם עיכוב מלאכותי של 2,500ms על `/api/arcade/home`
 * (‏`next start`, 375×780), ⛔ ולא שוער:** במצב `loading` נספרו **3** בלוקים
 * (`h-40` · `h-[66px]` · `h-[66px]`) מול **6** אזורים במסך המיוצב, ו-`התחל קרב`
 * נמדדה ב-`top = 654` עם ⛔ אפס פיקסלים שמורים לה בשלד.
 *
 * ⚠️ **הכלל נקוב בשמו:** `ui-ux-pro-max` ⇒ `ux-guidelines` · Layout · **Content
 * Jumping** · Severity **High**. ⇒ שתי הטענות כאן הן **שתיים ו⛔ לא אחת**: ששת
 * הבלוקים, **וגם** המעטפת שנושאת את אותו `gap` ואת אותה קבוצת פעולות — שלד בגבהים
 * נכונים בתוך מעטפת במרווח אחר הוא בדיוק אותה קפיצה, במספר קטן יותר.
 */
describe('ArenaHome — שלד הטעינה (T-398)', () => {
  const LOADING =
    SRC.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').match(
      /\{loading \? \([\s\S]*?\n {8}\) : \(/,
    )?.[0] ?? '';

  it('ששת האזורים מקבלים בלוק שלד, ⛔ ולא שלושה', () => {
    const blocks = LOADING.match(/data-arena-skeleton="([a-z-]+)"/g) ?? [];
    expect(blocks).toHaveLength(6);
    expect(new Set(blocks).size).toBe(6);
  });

  it('הגבהים הם של המסך המיוצב, אחד-אחד', () => {
    // 188 = `h-40` (160) + רצועת האליפסות `h-10` (40) פחות `-mt-3` (12).
    expect(LOADING).toContain('h-[188px]');
    expect(LOADING).toContain('h-[66px]'); // כרטיס הרמה
    expect(LOADING).toContain('h-[57px]'); // מסלול הבוס
    // כותרת הציוד + ארבע המשבצות: **162** מתחת ל-375 (הרצועה מקפלת ל-2×2) ו-**88**
    // מ-375 ומעלה. ⛔ אותה נקודת שבירה של `max-w-[140px]` / `min-[375px]:max-w-none`,
    // ⛔ ולא מספר שנבחר: שלד 88 ב-320 משאיר את `התחל קרב` נמוכה ב-72px ממקומה.
    expect(LOADING).toContain('h-[162px] min-[375px]:h-[88px]');
    expect(LOADING).toContain('h-[58px]'); // `START_CLASS`
    expect(LOADING).toContain('min-h-touch'); // שתי הפעולות המשניות
  });

  it('🔑 `התחל קרב` שומרת את מקומה — אותה קבוצה, אותו `mt-auto pt-4`', () => {
    // ⟦T-420⟧ שני המצבים קוראים **לאותו קבוע**, ⇒ ⛔ אינם יכולים להיפרד בשקט.
    expect(LOADING).toContain('className={ACTIONS_CLASS}');
    expect(CODE.match(/className=\{ACTIONS_CLASS\}/g) ?? []).toHaveLength(2);
    expect(CODE).toContain("const ACTIONS_CLASS = 'shrink-0 mt-auto flex flex-col gap-3 pt-4'");
  });

  it('🔑 המעטפת נושאת את `gap-5` של המסך המיוצב, ⛔ ולא `gap-6`', () => {
    const shell = SRC.match(/className=\{`\$\{SHELL_CLASS\} \$\{[^`]*`\}/)?.[0] ?? '';
    expect(shell).toContain("loading ? 'gap-5' : 'gap-6'");
    // המסך המיוצב עצמו — אותו מרווח בדיוק, וזו הטענה כולה.
    expect(SRC).toContain('<section data-arena-scope className={`${SHELL_CLASS} gap-5`} data-surface="dark">');
  });

  it('⛔ שלד, ⛔ ולא ספינר — ו-`aria-busy` יושב על המעטפת', () => {
    expect(LOADING).not.toMatch(/animate-spin|spinner/i);
    expect(SRC).toContain('aria-busy={loading || undefined}');
    expect(LOADING).toContain('role="status"');
  });

  it('⛔ ⛔ אין טוקן צבע חדש — הכול על `--arena-card`', () => {
    const fills = LOADING.match(/bg-\[color:var\(--[a-z-]+\)\]/g) ?? [];
    expect(fills.length).toBeGreaterThan(0);
    expect(new Set(fills)).toEqual(new Set(['bg-[color:var(--arena-card)]']));
  });
});

/**
 * 🏠 **T-420 · יעד ① של `arena` ⟨רוי: «אפס גלילה אנכית»⟩ — שומר-המקור.**
 * 🔬 `C-0703`: ‏`scrollHeight − innerHeight` = 460 · 287 · 102 ב-320×568 · 375×667 · 393×852,
 * משני שורשים (`:298` הטעינה · `:375` המסך). ⇒ הטענה היא על **כל** שורש-`<section>` בנפרד.
 * ⛔ והמספר עצמו ⛔ אינו כאן — jsdom ⛔ אינו מבצע פריסה; הוא ב-`scripts/verify-mobile.mjs`.
 */
describe('ArenaHome — גובה מדויק, ⛔ ולא מינימום (T-420)', () => {
  const sections = CODE.match(/<section[\s\S]*?>/g) ?? [];
  const shell = CODE.match(/const SHELL_CLASS =\s*'([^']*)'/)?.[1] ?? '';

  /** השורש מעוגן ל-`100dvh` מדויק · ⛔ `min-h` · ⛔ `pb-16` · ⛔ גולל. */
  const exact = (cls: string): boolean =>
    /(^|\s)h-\[100dvh\]/.test(cls) &&
    !cls.includes('min-h-[100dvh]') &&
    !/(^|\s)pb-(16|28)(\s|$)/.test(cls) &&
    /(^|\s)overflow-hidden(\s|$)/.test(cls);

  it('שני שורשים, ושניהם נושאים את המעטפת המשותפת', () => {
    expect(sections).toHaveLength(2);
    for (const s of sections) expect(s).toContain('${SHELL_CLASS}');
  });

  it('המעטפת: `h-[100dvh]` מדויק · `overflow-hidden` · ⛔ `min-h` · ⛔ `pb-16`', () => {
    expect(exact(shell)).toBe(true);
    expect(CODE).not.toContain('min-h-[100dvh]');
  });

  it('בקרה שלילית — המעטפת הישנה נופלת בשומר', () => {
    expect(exact('flex min-h-[100dvh] flex-col gap-5 pb-16')).toBe(false);
    expect(exact('flex h-[100dvh] flex-col gap-5 pb-16 overflow-hidden')).toBe(false);
  });

  it('בקרה שלילית — גובה מדויק ⛔ בלי `overflow-hidden` נופל', () => {
    expect(exact('flex h-[100dvh] flex-col')).toBe(false);
  });

  it('האזור הגמיש: `min-h-0 flex-1`, והמסך המיוצב גולל **בתוכו**', () => {
    expect(CODE).toContain("const BODY_CLASS = 'relative flex min-h-0 flex-1 flex-col gap-5 [&>*]:shrink-0'");
    expect(CODE.match(/data-arena-home-body/g) ?? []).toHaveLength(2);
    expect(CODE).toContain('${BODY_CLASS} overflow-y-auto');
  });

  it('הקרב האחרון והארון בתוך האזור הגמיש — ⛔ מתחת לפעולות הם היו נחתכים', () => {
    const body = CODE.indexOf('${BODY_CLASS} overflow-y-auto');
    const actions = CODE.lastIndexOf('className={ACTIONS_CLASS}');
    expect(CODE.indexOf('data-arena-last-round')).toBeGreaterThan(body);
    expect(CODE.indexOf('data-arena-last-round')).toBeLessThan(actions);
    expect(CODE.indexOf('ref={drawerRef}')).toBeGreaterThan(body);
    expect(CODE.indexOf('ref={drawerRef}')).toBeLessThan(actions);
  });
});
