import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const PAGE = readFileSync('app/arcade/page.tsx', 'utf8');
const DEV_PAGE = readFileSync('app/dev/arcade/page.tsx', 'utf8');
const TOKENS = readFileSync('app/arcade/arcade-tokens.css', 'utf8');
const SRC = readFileSync('components/ArenaBattle.tsx', 'utf8');
const CODE = withoutComments(SRC);
/**
 * ⚠️ **T-178 — קלף היד עבר ל-`components/SpellCard.tsx`, ⛔ ולא נמחק.** שתי הבדיקות
 * שמדדו אותו כאן **הופנו** לקובץ החדש ⛔ ולא הוסרו: שומר מסך שנמחק כי הקוד זז הוא
 * בדיוק הדפוס שהפיל את T-164. המסך עדיין אחראי לכך שהקלף נושא 44px ותווית עברית —
 * הוא פשוט ⛔ אינו מצייר אותו בעצמו עוד.
 */
const CARD_SRC = readFileSync('components/SpellCard.tsx', 'utf8');
const CARD_CODE = withoutComments(CARD_SRC);

/**
 * אינווריאנט `37 § 13.5` — **הרשימה המלאה** של טוקני הזירה, ⛔ ולא מדגם.
 * ⚠️ T-179 הוסיפה ארבעה (`cast` · `cast-edge` · `cast-warn` · `dodge`) ⇒ ארבעה
 * ערכים נוספים שחייבים להישאר **מחוץ** ל-`palette.ts` ול-`globals.css`.
 * ⚠️ **F-149ⓐ הוסיפה שלושה נוספים, וכולם נמדדו מהרנדר ⛔ ולא נבחרו:** `--arena-card`
 * (`render_video_B.py:265` — מילוי הקלף) · `--arena-ink` (`:277` — תווית הקלף) ·
 * `--arena-ink-dim` (`:248`, `ELEM_COL['unknown']`). ⛔ הם ⛔ אינם «צבעים חדשים
 * למוצר» — הם בדיוק אותה חריגה מגודרת, ואותה בדיקה למטה כולאת אותם באותו קובץ.
 */
/**
 * ⚠️ **T-214 הוסיפה שלושה, וכולם נמדדו מ-`render_video_B.py` ⛔ ולא נבחרו:**
 * `--arena-hp` (`:474` `(226, 62, 62)`, מוגה כלפי מעלה בשכבה א׳ עד 5.02:1 מול
 * `--arena-ink`) · `--arena-hp-track` (`:471` `(20, 14, 24)`) · `--arena-mana`
 * (`:299` `(86, 132, 226)`). ‏`--arena-card-edge` ⛔ אינו הקסא רביעי — הוא הערך של
 * `--arena-ink-dim` בתפקיד גבול, ולכן הרשימה כאן ⛔ לא גדלה בשבילו.
 */
/**
 * ⚠️ **T-364 הוסיפה שניים, ושניהם נמדדו מ-`render_video_B.py` ⛔ ולא נבחרו:**
 * `--arena-damage` (`:564` — `dmg_number(… (255, 130, 130))` ⇒ `#ff8282`, **6.24:1**
 * מול `--arena-night`) · `--arena-burst` (`:546` — טבעות ההתפרצות `(255, 236, 190)`
 * ⇒ `#ffecbe`, **12.8:1**). ⛔ הם ⛔ אינם «אדום חדש למוצר»: `--danger` הכללי מתחלף
 * לפי הסכימה ב-`globals.css` ו⛔ אינו יכול לשאת מספר על במה כהה קבועה — וזו בדיוק
 * הסיבה שהחריגה המגודרת קיימת. ⛔ שניהם כלואים בקובץ הזה, כמו ארבעה-עשר שלפניהם.
 */
/**
 * ⚠️ **T-401 הוסיפה אחד, והוא נמדד מ-`render_video_B.py:375` ⛔ ולא נבחר:**
 * `--arena-streak-hot` — `rr(…, fill=(120, 70, 20))`, המילוי שהרנדר נותן לשבב הרצף
 * ⛔ אך ורק מ-`streak >= 3` ⇒ `#784614`. **5.52:1** מול `--arena-gold-light` שיושב
 * עליו, כלומר מעל רצפת 4.5:1 של שכבה א׳ לטקסט קטן. ⛔ **ומתחת ל-3 ⛔ אין ערך חדש
 * בכלל** — הרנדר מצייר שם `RAISED`/`BORDER_SUB`, שהם `--arena-card`/`--arena-card-edge`
 * שכבר ברשימה. ⛔ כלוא בקובץ הזה, כמו שישה-עשר שלפניו.
 */
/**
 * 🎒 **⟦19/09 · `C-0727`⟧ הוסיפה **שניים** — בד הציוד. 🔬 הפגם שהם סוגרים נמדד:
 * הציוד צויר כקו ב-`text-ink`, שבזירה הוא **בדיוק רקע הבמה** ⇒ **`1.00:1`**.
 */
/**
 * 🆕 **⟦19/09 · `C-0726`⟧ הוסיפה **אחד-עשר** לשלוש דמויות חדשות — ⛔ **ואלה ⛔ אינם
 * «ערכים שנמדדו»**: ל-`צייד` · `גולם` · `צל` ⛔ אין רנדר, ⇒ הגוונים הם **בחירה
 * מוצהרת** לפי הסגנון של `38 § 3ב`. ⛔ **ומה ש⛔ אינו בחירה הוא הרצפה** — כל אחד
 * מהם נמדד מול `--arena-card` ועובר 3:1, והמספר רשום ב-`arcade-tokens.css`.
 * ⛔ הם כלואים באותו קובץ כמו כל השאר, ושתי הבדיקות הראשונות למטה אוכפות זאת.
 */
/**
 * 🎭 **⟦19/09 · `C-0724`⟧ הוסיפה **ארבעה-עשר**, וכולם **נמדדו בפילוח צבע** של
 * `docs/design/kol-B-03-battle.png` ⛔ ולא נבחרו.** עד אז שתי הדמויות נצבעו
 * ב-`currentColor` **אחד** לכל הגוף ⇒ הן היו צלליות חד-גוניות; ברנדר לכל חלק
 * יש **צבע מקומי**, וזה הפער שסגר `F-298`.
 * ⛔ **הם ⛔ אינם «פלטה חדשה למוצר»** — זו בדיוק אותה חריגה מגודרת של `37 § 13.5`
 * כמו שמונה-עשר שלפניהם: הם כלואים בקובץ הזה, ו⛔ אינם ב-`palette.ts` ⛔ ולא
 * ב-`globals.css`, ושתי הבדיקות הראשונות למטה אוכפות בדיוק את זה.
 * ⚠️ **וארבעה מהם ⛔ אינם ערך הרנדר, ובמספר** (אותה החרגה של `36 § 14.4` ש-`--arena-hp`
 * כבר עשתה): ברנדר הדמויות עומדות על **רצפה מוארת** ואצלנו על כחול-ליל, ⇒
 * רגליים `(50,55,77)` נתנו **1.06:1**, חגורה `(117,38,55)` **1.59:1**, מטה
 * `(92,64,40)` **1.40:1** וחרוט `(104,62,178)` **2.22:1** — כולם הוארו למינימום
 * ההכרחי לרצפת 3:1, **בלי לשנות גוון**. ⛔ **ופני הקוסם ⛔ לא הוארו** (`#241436`):
 * הן יושבות על החרוט (3.50:1), ⛔ ולא על הכרטיס.
 */
const ARENA_HEXES = ['#d4a94a', '#f5d684', '#4a4858', '#34323f', '#1c2642',
                     '#c482ff', '#b478f0', '#ff7878', '#96e6ff',
                     '#182138', '#fffcf6', '#a8b0c4',
                     '#cc3333', '#140e18', '#5684e2',
                     '#ff8282', '#ffecbe', '#784614',
                     '#e2b696', '#488edc', '#a3b0cd', '#707e9c', '#60749e',
                     '#656f9b', '#bd3f59', '#cedcf4', '#825cc6', '#241436',
                     '#ff78eb', '#ffd9f7', '#f6beff', '#8d643f',
                     '#5fae6b', '#46855a', '#a97a4a', '#e8e2cf',
                     '#94897a', '#7b7264', '#ff8a3d', '#ffc178',
                     '#55d6c4', '#2f8f92', '#9df0e6',
                     '#c1465f', '#8c2f42'] as const;

describe('אינווריאנט 37 § 13.5 — הפלטה scoped לזירה', () => {
  it('⛔ טוקני הזירה ⛔ אינם דולפים ל-palette', () => {
    const palette = readFileSync('lib/core/palette.ts', 'utf8');
    for (const hex of ARENA_HEXES) {
      expect(palette, `${hex} — אינווריאנט 37 § 13.5`).not.toContain(hex);
    }
  });

  it('⛔ ו⛔ אינם דולפים ל-globals.css — הקובץ המשותף הוא בדיוק אותה דליפה', () => {
    const globals = readFileSync('app/globals.css', 'utf8');
    for (const hex of ARENA_HEXES) {
      expect(globals, `${hex} — אינווריאנט 37 § 13.5`).not.toContain(hex);
    }
  });

  it('חמשת הערכים חיים ב-`app/arcade/arcade-tokens.css`, ⛔ ואין בו שישי', () => {
    for (const hex of ARENA_HEXES) expect(TOKENS).toContain(hex);
    const found = [...TOKENS.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase());
    expect(new Set(found)).toEqual(new Set(ARENA_HEXES));
  });

  /**
   * T-214 · D-130 מסלול ⓘ — **הבמה מצהירה רקע משלה ודיו משלה.**
   * ⛔ הבדיקה ⛔ אינה מחליפה את בדיקת חמשת הערכים מעליה — היא **מוסיפה** עליה
   * (⛔ בדיקה שנמחקה בלי מחליפה היא מה שהפיל את T-164).
   * ⚠️ נמדד C-0333 לפני התיקון: `<section data-arena-scope>` החזיר `rgba(0, 0, 0, 0)`.
   */
  it('הסקופ מצהיר **רקע** מ-`--arena-night` — אחרת הטקסט יושב על רקע העמוד', () => {
    expect(TOKENS).toMatch(/background:\s*var\(--arena-night\)/);
  });

  /**
   * 🎬 **T-423ⓐ · `36 § 8.0` הכרעה ① — «מלוא הרוחב, כהה».**
   *
   * 🔬 **נמדד חי ב-`C-0707`** על חמשת נתיבי `/dev/arcade/*` ב-320·375·393·414·430:
   * ‏`left=24` ורוחב `clientWidth − 48` בכל 25 הצירופים ⇒ 24px של דף בהיר משני הצדדים.
   * ⇒ שלושת הערכים האלה הם **מנגנון אחד**, וכל אחד מהם לבדו שובר אותו: בלי ה-`margin`
   * השלילי הרקע ⛔ אינו מגיע לקצה · בלי ה-`width` המקטע ⛔ אינו ממלא את מה שהמרווח פינה ·
   * ו**בלי הריפוד התוכן קופץ 24px לקצה המסך**, כלומר שינוי פריסה שאיש ⛔ לא ביקש.
   */
  it('הסקופ יוצא למלוא הרוחב — מרווח שלילי · רוחב · **וריפוד שמחזיר את התוכן**', () => {
    expect(TOKENS).toMatch(/--arena-gutter:\s*1\.5rem/);
    expect(TOKENS).toMatch(/margin-inline:\s*calc\(var\(--arena-gutter\) \* -1\)/);
    expect(TOKENS).toMatch(/width:\s*calc\(100% \+ var\(--arena-gutter\) \* 2\)/);
    expect(TOKENS).toMatch(/padding-inline:\s*var\(--arena-gutter\)/);
  });

  /**
   * ⛔ **ו-`100vw` ⛔ אינו הדרך** — הוא סופר גם את פס הגלילה, וזה בדיוק המקור לגלישה
   * האופקית שהחוקה אוסרת (שכבה א׳ · `check:mobile`). המרווח השלילי מחזיר אך ורק את
   * הגדר של ההורה, שהיא כבר בתוך ה-viewport.
   */
  it('⛔ אפס `100vw` ב**כללים** — הגלישה האופקית ⛔ אינה נפתחת מהדלת האחורית', () => {
    // ⛔ בכללים, ⛔ ולא בהערות: ההערה שמסבירה **למה** אין `100vw` ⛔ אינה הפרה שלו.
    expect(withoutComments(TOKENS)).not.toMatch(/100vw/);
  });

  it('הסקופ מצהיר **דיו** משלו — `--ink` של globals מתחלף עם הסכימה', () => {
    expect(TOKENS).toMatch(/color:\s*var\(--arena-ink\)/);
    // זוג הדיו — חזק ועמום — חי כאן, ⛔ ולא ב-`palette.ts`.
    for (const token of ['--arena-ink:', '--arena-ink-dim:', '--arena-card-edge:']) {
      expect(TOKENS, `${token} — הדיו של הזירה חי בקובץ הזה`).toContain(token);
    }
  });

  it('⛔ ושמות הזירה ⛔ אינם דולפים ל-`palette.ts` ול-`globals.css`', () => {
    const palette = readFileSync('lib/core/palette.ts', 'utf8');
    const globals = readFileSync('app/globals.css', 'utf8');
    for (const token of ['--arena-ink', '--arena-night', '--arena-card-edge',
                         '--arena-hp', '--arena-mana']) {
      expect(palette, `${token} — אינווריאנט 37 § 13.5`).not.toContain(token);
      expect(globals, `${token} — אינווריאנט 37 § 13.5`).not.toContain(token);
    }
  });

  it('שני המסלולים טוענים את הפלטה — אחרת הפיקסצ׳ר מודד מסך שאינו המסך', () => {
    expect(PAGE).toContain('arcade-tokens.css');
    expect(DEV_PAGE).toContain('arcade-tokens.css');
  });

  it('⛔ אפס hex ברכיב — הצבע מגיע מהאסימונים (חוקה § 2)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('D-126 — השעון קיים, והוא חי במסך ⛔ ולא בליבה', () => {
  it('לולאת ה-requestAnimationFrame היחידה חיה כאן', () => {
    expect(CODE).toMatch(/requestAnimationFrame/);
    // ⛔ ולא בליבה — השומר המקביל חי ב-`lib/core/battle.test.ts`.
    expect(withoutComments(readFileSync('lib/core/battle.ts', 'utf8'))).not.toMatch(
      /requestAnimationFrame/,
    );
  });

  it('⛔ הרכיב מצייר ו⛔ אינו מחשב — החוקים מיובאים, ⛔ ולא משוכפלים', () => {
    // T-283 (C-0513): the outcome reaches the screen as `endingOf` (`lib/core/arenaSummary`),
    // which wraps `outcomeAt` — the law is still imported, ⛔ not duplicated (RULES § 0.22).
    for (const fn of ['endingOf', 'manaAt', 'isRage', 'cast', 'tick', 'startBattle']) {
      expect(CODE, `${fn} מגיע מ-lib/core/battle`).toContain(fn);
    }
    // ⛔ אף מספר של חוק אינו מוטבע כאן: 90 שניות · 8 שניות · 1.5 שניות · תקרת 10.
    for (const banned of [/90_?000/, /70_?000/, /8_?000/, /1_?500/]) {
      expect(CODE, `${banned} — הקבוע חי ב-lib/core/battle.ts בלבד`).not.toMatch(banned);
    }
  });
});

describe('שבעת האזורים של הרנדר — `docs/design/kol-B-03-battle.png`', () => {
  it.each([
    ['השעון', 'data-arena-clock'],
    ['באנר המילה', 'data-arena-banner'],
    ['היריב ופס חייו', 'data-arena-enemy'],
    ['מד המאנה', 'data-arena-mana'],
    ['היד', 'data-arena-hand'],
    ['הערת הבידוד', 'data-arena-isolation'],
  ])('⛔ %s קיים במסך', (_name, marker) => {
    expect(CODE).toContain(marker);
  });

  it('הבמה מגיעה מ-<ArenaStage>, ⛔ ואינה מצוירת מחדש כאן', () => {
    expect(CODE).toContain('<ArenaStage');
  });

  it('כותרת השעון ומחרוזות הזירה, כלשונן ברנדר', () => {
    for (const he of ['זמן קרב', 'מאנה']) {
      expect(SRC, `«${he}» — הרנדר`).toContain(he);
    }
    // ⛔ תווית קלף ה-`?` — ב-`SpellCard.tsx` מאז T-178, ⛔ והדרישה ⛔ לא נחלשה.
    expect(CARD_SRC, '«לחש לא מזוהה» — הרנדר').toContain('לחש לא מזוהה');
  });
});

describe('אינווריאנט 37 § 13.1 — הבידוד', () => {
  it('הערת הבידוד ⛔ אינה אופציונלית', () => {
    expect(SRC).toContain('אין השפעה על SM-2');
  });

  it('⛔ הזירה ⛔ אינה נוגעת במנוע החזרות', () => {
    for (const bad of ['word_progress', 'easiness', 'interval_days', 'next_review_at']) {
      expect(CODE, `${bad} אסור — אינווריאנט 13.1`).not.toContain(bad);
    }
  });

  it('⛔ שתי נקודות קצה, ובלבד', () => {
    const paths = [...CODE.matchAll(/'(\/api\/[^']+)'/g)].map((m) => m[1]);
    expect(new Set(paths)).toEqual(new Set(['/api/arcade/round', '/api/arcade/result']));
  });
});

describe('חוקה שכבה א׳ — ⛔ ההחרגה היחידה, ו⛔ אין שנייה', () => {
  /**
   * 🔴 **⟦17/09 · `T-416` ⓪ · הכרעת DEV⟧ הטענה נוסחה מחדש כדי שתמדוד את ה**כוונה**,
   * ⛔ ולא נוכחות של מחרוזת אחת בקובץ.**
   *
   * 🔬 **מה היא מדדה עד היום, ⛔ ולא שוער:** `expect(CODE).toContain('min-h-[100dvh]')`
   * הוא **נוכחות מחרוזת בקובץ כולו** — הוא ירוק כל עוד ולו קטע אחד נושא אותה,
   * ו⛔ אינו אומר דבר על שאר הקטעים. ⇒ מסך הקרב (‏`:1007`) כבר נשא
   * `h-[calc(100dvh-5.25rem)]` **ועבר**, ⛔ רק מפני ששלושת קטעי `F-278` עוד החזיקו
   * את המחרוזת עבורו. ⇒ הטענה חסמה את יעד ① של `arena` בלי למדוד דבר שהיעד סותר.
   *
   * 🔑 **והכוונה של `F-011` · `F-016` ⛔ לא רוככה — היא נמדדת עכשיו על כל שורש-מסך
   * בנפרד, ⛔ ולא על הקובץ:** ⓐ ⛔ אין `h-screen` (‏`100vh` שובר בדפדפן נייד —
   * `ui-ux-pro-max:ux` «Viewport Units», Severity Medium) · ⓑ **כל** `<section>` שורשי
   * עוגן לחלון ב-`dvh` · ⓒ **כל** אחד מהם הוא עמודת `flex-col` **עוגנת-ראש**,
   * ⛔ ללא מרכוז אנכי — וזה בדיוק מה ש-`F-011`/`F-016` אסרו.
   * ⇒ ⛔ **זהו הידוק, ⛔ ולא הקלה:** קודם נמדד קטע אחד, עכשיו נמדדים ארבעה.
   */
  it('⛔ אין `h-screen`, וכל שורש-מסך עוגן לחלון ב-`dvh` ⛔ ללא מרכוז אנכי (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/\bh-screen\b/);

    const roots = [...CODE.matchAll(/<section\b[^>]*>/g)].map((tag) => {
      const cls = tag[0].match(/className="([^"]*)"/);
      return cls === null ? '' : cls[1];
    });

    // ⛔ טענה על קבוצה ריקה היא טענה ירוקה על כלום: ארבעת השורשים הם מסך הטעינה,
    // מסכי הכשל, סוף הסיבוב והקרב עצמו.
    expect(roots.length, 'ArenaBattle חייב לצייר את ארבעת שורשי-המסך').toBeGreaterThanOrEqual(4);

    for (const cls of roots) {
      expect(cls, `שורש-מסך ⛔ ללא עיגון ל-dvh: "${cls}"`).toMatch(/\b(?:min-)?h-\[(?:calc\()?100dvh/);
      expect(cls, `⛔ מרכוז אנכי בשורש-מסך: "${cls}"`).not.toMatch(
        /\b(?:justify-center|place-content-center|content-center|my-auto)\b/,
      );
      expect(cls, `שורש-מסך חייב להיות עמודה עוגנת-ראש: "${cls}"`).toMatch(/\bflex-col\b/);
    }
  });

  it('כל אנגלית עוברת ב-<EnWord> (חוקה § 2 · `36 § 14`)', () => {
    expect(CODE).toContain('EnWord');
  });

  it('קלפי היד הם יעד מגע ≥44px', () => {
    const card = CARD_CODE.split('<button').find((chunk) =>
      chunk.slice(0, chunk.indexOf('</button>')).includes('data-arena-card'),
    );
    expect(card, 'קלף היד חייב להימצא').toBeDefined();
    expect((card ?? '').slice(0, (card ?? '').indexOf('</button>'))).toMatch(/min-h-touch/);
  });

  it('א2 — המצב ⛔ אינו מקודד בצבע בלבד: לפס ולמד יש מספר ותווית', () => {
    // פס היריב נושא אחוז בתוכו; מד המאנה נושא `N / 10`; ומאז T-179 גם מד ההטלה
    // נושא אחוז בשם הנגיש שלו. ⛔ **שלושה, ⛔ ולא «לפחות שניים»:** המספר נשמר קשיח
    // כי `role="img"` בלי שם נגיש הוא בדיוק ההחמצה ששכבה א׳ א2 נועדה לתפוס.
    expect(CODE).toContain('${enemyPct}/100');
    expect(CODE).toContain('${mana} / ${MANA_CAP}');
    expect(CODE).toContain('${Math.round(telegraph.frac * 100)} אחוז');
    /* 🩸 **⟦עודכן 19/09 · `C-0733` · `T-436`⟧ ⓸ — פס חיי ה**לומד**.**
       ⛔ **והספירה עלתה ל-4 ⛔ ולא נמחקה:** היא מה שתופס `role="img"` **חדש**
       שנוסף בלי שם נגיש, וזו בדיוק ההחמצה שהטענה הזאת קיימת בשבילה. ⇒ מי שמוסיף
       מד רביעי חייב לעבור כאן, ולהוכיח שגם הוא נושא מספר. */
    expect(CODE).toContain('${learnerPct}/100');
    expect(CODE).toContain('${LEARNER_HP_HE} ${learnerPct} מתוך 100');
    expect([...CODE.matchAll(/role="img"/g)]).toHaveLength(4);
  });

  it('⛔ אפס אמוג׳י (שכבה א׳ — אייקוני SVG בלבד)', () => {
    expect(CODE).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('T-178 · 37 § 5 — שני המסלולים, וההכרעה ⛔ אינה ברכיב', () => {
  it('היד מורכבת מ-`<SpellCard>`, ⛔ ולא מכפתור מקומי', () => {
    expect(CODE).toContain('<SpellCard');
    expect(CODE).toContain("from '@/components/SpellCard'");
  });

  it('⛔ מסלול הנגישות קיים: יעד ירי על היריב', () => {
    expect(CODE).toContain('data-arena-fire');
  });

  it('⛔ הרמז נשמר במכשיר ⛔ ולא בשרת — ⛔ אפס כתיבה ללמידה', () => {
    expect(CODE).toContain('kol.arena.dragTaught');
    for (const token of ['word_progress', 'easiness', 'interval_days', 'next_review_at']) {
      expect(CODE).not.toContain(token);
    }
  });

  it('⛔ ההעדפה נקראת אחרי ההרכבה, ⛔ ולא ברינדור (אזהרת hydration)', () => {
    expect(CODE).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
  });
});

describe('T-179 · 37 § 6 — חלון ההתחמקות', () => {
  it('המד מגיע מהליבה — ⛔ הרכיב ⛔ אינו סופר 5.3 ואינו סופר 5.7', () => {
    expect(CODE).toContain('telegraphAt(');
    for (const number of ['5300', '5700', '6000', '5.3', '5.7']) {
      expect(CODE).not.toContain(number);
    }
  });

  it('⛔ ההכרזה ⛔ אינה צבע בלבד — המילה על המסך ו-`aria-live` (שכבה א׳ א2)', () => {
    expect(SRC).toContain('מטיל!');
    expect(CODE).toContain('aria-live');
  });

  /**
   * 🔴 **⟦עודכן 19/09 · `C-0730` · `T-433`ⓑ⟧ ‏`swipe(`, ⛔ ולא `dodge(` — וזו ⛔ אינה
   * החלפת שם.**
   *
   * 🔬 **מה שנמדד, ⛔ ולא שוער:** הרכיב חישב `gesture.dx` ו**זרק** אותו, ⇒ החלקה
   * שמאלה והחלקה ימינה עשו **בדיוק את אותו דבר**. `swipe` הוא מה שמזיז נתיב
   * (`moveLane`) ורק אז מגלגל (`dodge`) ⇒ ⛔ הטענה כאן חייבת לדרוש את **הסימן**,
   * אחרת היא ירוקה גם על הקוד שזרק אותו.
   */
  it('ההחלקה על הבמה עוברת בכלל מקור המחווה, ו**הסימן** ⛔ אינו נזרק', () => {
    expect(CODE).toContain("source: 'stage'");
    expect(CODE).toContain('swipe(');
    // ⛔ **זו הטענה שמאדימה על הקוד הקודם**, ⛔ ולא `swipe(` לבדו.
    expect(CODE).toMatch(/swipe\(\s*prev\s*,\s*gesture\.dx\s*,/);
    // ⛔ והנתיב מגיע לבמה — אחרת המנוע זז ו⛔ המסך לא.
    expect(CODE).toMatch(/lane=\{battle\.heroLane\}/);
  });

  /**
   * 🕹️ **⟦19/09 · `C-0735` · `T-437`⟧ התנועה מוכרעת באמצע הגרירה — ו**התפיסה
   * ⛔ אינה ב-`pointerdown`.**
   *
   * 🔬 **הטענה השנייה ⛔ אינה סגנון — היא רגרסיה שנמדדה חי.** כשהתפיסה ישבה
   * ב-`pointerdown`, ‏`check:mobile` האדים על «הקשה כפולה על אותו קלף משגרת»
   * (`F-259`): אזור הבמה מכיל את **כפתור השיגור** של `§ 5`, ותפיסה מסיטה
   * אליה את ה-`pointerup` ⇒ ה-`click` ⛔ לעולם ⛔ אינו נורה. הקיצור בלע את
   * **מסלול הנגישות**. ⇒ תופסים רק אחרי שהמחווה חצתה סף; הקשה ⛔ לעולם
   * ⛔ אינה חוצה סף.
   */
  it('התנועה מוכרעת ב-`pointermove`, והתפיסה ⛔ אינה ב-`pointerdown`', () => {
    expect(CODE).toMatch(/onPointerMove=\{\(e\) => \{/);
    // ⛔ נקודת המוצא **מתאפסת** — בלעדיה גרירה ארוכה שווה לקצרה.
    expect(CODE).toMatch(/stageFrom\.current = \{ x: e\.clientX, y: e\.clientY \};\s*\n\s*setBattle/);
    const down = CODE.slice(CODE.indexOf('onPointerDown={(e) => { stageFrom'));
    expect(down.slice(0, 160), '⛔ תפיסה ב-pointerdown בולעת את כפתור השיגור')
      .not.toMatch(/setPointerCapture/);
    expect(CODE, 'ותופסים אחרי שהמחווה הוכיחה את עצמה').toMatch(/setPointerCapture/);
  });

  it('⛔ אין hex חדש שדלף ל-globals או ל-palette', () => {
    const palette = readFileSync('lib/core/palette.ts', 'utf8');
    const globals = readFileSync('app/globals.css', 'utf8');
    for (const hex of ARENA_HEXES) {
      expect(palette, `${hex} — אינווריאנט 37 § 13.5`).not.toContain(hex);
      expect(globals, `${hex} — אינווריאנט 37 § 13.5`).not.toContain(hex);
    }
  });
});

describe('T-181 · `37 § 12` — `/arcade` נפתח על מסך הבית, ⛔ ולא בתוך קרב', () => {
  // ⛔ הלבנה, כמו בכל שאר הקובץ (F-039): ההערה בראש `page.tsx` מתעדת מה עמד שם קודם,
  // ומדידה גולמית הייתה מפילה עמוד ⛔ שאין בו ולו הפרה אחת.
  it('העמוד מרכיב את המעטפת, ⛔ ולא את הקרב', () => {
    expect(withoutComments(PAGE)).toContain('ArenaShell');
    expect(withoutComments(PAGE)).not.toContain('ArenaBattle');
  });

  it('⛔ הטוקנים של הזירה עדיין נטענים כאן ו⛔ לא ב-`globals.css` (`37 § 13.5`)', () => {
    expect(PAGE).toContain('./arcade-tokens.css');
  });

  it('⛔ העמוד נשאר Server Component ⛔ בלי גישה לנתונים', () => {
    expect(PAGE).not.toContain("'use client'");
    expect(PAGE).not.toContain('supabase');
  });

  it('⛔ המעטפת מחזיקה מצב, ⛔ ואינה מוסיפה ראוט (`RULES § 0.22`)', () => {
    const shell = readFileSync('components/ArenaShell.tsx', 'utf8');
    // T-217 — המצב השלישי, `character`, הוא גבול מודול ⛔ ולא ראוט (`37 § 7`).
    expect(shell).toContain("'home' | 'character' | 'battle'");
    expect(shell).toContain('<ArenaCharacterChoice');
    expect(shell).toContain('<ArenaHome');
    expect(shell).toContain('<ArenaBattle');
    // ⛔ ⛔ אינה מבקשת נתונים ו⛔ אינה מציירת — כל מסך טוען את שלו.
    expect(shell).not.toContain('/api/');
  });

  it('הפיקסצ׳ר של מסך הבית טוען את הפלטה, אחרת הוא מודד מסך שאינו המסך', () => {
    const devHome = readFileSync('app/dev/arcade/home/page.tsx', 'utf8');
    expect(devHome).toContain('arcade-tokens.css');
    expect(devHome).toContain('<ArenaHome');
  });
});
