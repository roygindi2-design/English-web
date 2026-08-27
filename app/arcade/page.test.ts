import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-177 · `37-arena-spec § 12` · `36 § 8` — שומרי מסך הזירה.
 * 🎯 הרנדר: `docs/design/kol-B-03-battle.png`.
 *
 * שומר מקור, כמו `ArenaStage.test.ts` ו-`LevelScan.test.ts`: סביבת vitest היא `node`
 * ו-jsdom נעדר בכוונה. גיאומטריה — 44px ואפס גלילה אופקית — היא עבודתו של
 * `check:mobile` דרך הפיקסטורה `/dev/arcade`.
 *
 * ⚠️ **הלבנה, ⛔ ולא מקור גולמי** (F-039 · F-064 · F-065): הקבצים כאן **מתעדים בהערה**
 * מה אסור בהם, ומדידה גולמית הייתה מפילה קובץ ⛔ שאין בו ולו הפרה אחת.
 */
const withoutComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

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
const ARENA_HEXES = ['#d4a94a', '#f5d684', '#4a4858', '#34323f', '#1c2642',
                     '#c482ff', '#b478f0', '#ff7878', '#96e6ff',
                     '#182138', '#fffcf6', '#a8b0c4'] as const;

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
    for (const fn of ['outcomeAt', 'manaAt', 'isRage', 'cast', 'tick', 'startBattle']) {
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
  it('⛔ אין `h-screen` — `min-h-[100dvh]` בלבד (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/\bh-screen\b/);
    expect(CODE).toContain('min-h-[100dvh]');
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
    expect([...CODE.matchAll(/role="img"/g)]).toHaveLength(3);
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

  it('ההחלקה על הבמה עוברת בכלל מקור המחווה', () => {
    expect(CODE).toContain("source: 'stage'");
    expect(CODE).toContain('dodge(');
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
