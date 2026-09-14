import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 🗺️ **`npm run affected` — «מה עלול להישבר», לפני הדחיפה ו⛔ לא אחרי השער.**
 *
 * 🔬 **הרקע, נמדד 14/09:** רוי ביקש לבחון את `graphify` (ב-PyPI: `graphifyy`, ⛔ **לא**
 * `graphify-ai`, ש⛔ אינו קיים). הוא הותקן ורץ על עותק של הריפו:
 * ‏`graphify affected "CardDeck" --depth 2` ⇒ 384ms ו-5 קבצים; הסקריפט הזה, מעל המפה
 * שכבר קיימת ⇒ **23ms ואותם 5 קבצים בדיוק.** ⇒ ⛔ אין סיבה לשלם 9.06MB ו-10.4 שניות
 * לבנייה על תשובה שכבר בבית.
 *
 * ⛔ **הפיקסצ׳ר הוא מפה מומצאת, ⛔ ולא המפה החיה** — אחרת הבדיקה הייתה משתנה בכל
 * `generate-map`, וזו בדיוק הדרך שבה בדיקה ירוקה מפסיקה למדוד.
 */
const run = (args: string[], map: string): { out: string; code: number } => {
  try {
    const out = execFileSync('node', ['scripts/affected.mjs', ...args], {
      encoding: 'utf8',
      env: { ...process.env, AFFECTED_MAP: map },
    });
    return { out, code: 0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return { out: `${err.stdout ?? ''}${err.stderr ?? ''}`, code: err.status ?? 1 };
  }
};

const fixture = (graph: Record<string, string[]>): string => {
  const dir = mkdtempSync(join(tmpdir(), 'affected-'));
  const p = join(dir, 'map.json');
  writeFileSync(p, JSON.stringify(graph), 'utf8');
  return p;
};

/** a → b → c, plus an unrelated leaf and a test file that imports the leaf. */
const MAP = fixture({
  'app/page.tsx': ['components/Screen.tsx'],
  'components/Screen.tsx': ['components/Deck.tsx'],
  'components/Deck.tsx': ['lib/core/grade.ts'],
  'components/Deck.test.tsx': ['components/Deck.tsx'],
  'components/Unrelated.tsx': ['lib/core/other.ts'],
  'lib/core/grade.ts': [],
  'lib/core/other.ts': [],
});

describe('scripts/affected.mjs', () => {
  it('walks the reverse edges to the requested depth, and labels the hop', () => {
    const r = run(['components/Deck.tsx'], MAP);
    expect(r.code).toBe(0);
    expect(r.out, 'מייבא ישיר').toContain('components/Screen.tsx');
    expect(r.out, 'וקובץ הבדיקה שלו').toContain('components/Deck.test.tsx');
    expect(r.out, 'והטרנזיטיבי בקפיצה שנייה').toContain('app/page.tsx');
    expect(r.out).toContain('2 קפיצות');
    expect(r.out, '⛔ ולא מה שאינו קשור').not.toContain('Unrelated');
  });

  it('⛔ depth is a real bound — depth 1 ⛔ does not reach the transitive importer', () => {
    const r = run(['components/Deck.tsx', '--depth', '1'], MAP);
    expect(r.code).toBe(0);
    expect(r.out).toContain('components/Screen.tsx');
    // ⛔ ‏`app/page.tsx` מגיע רק דרך `Screen` ⇒ בעומק 1 הוא ⛔ אינו ברשימה. בלי הטענה
    // הזאת `--depth` יכול היה להיות מתעלם-בשקט והבדיקה שמעל עדיין הייתה ירוקה.
    expect(r.out).not.toContain('app/page.tsx');
  });

  /**
   * 🔴 **שתי תשובות שונות ש⛔ אסור לקרוס לאחת.** «⛔ אינו במפה» הוא בדרך כלל **שגיאת
   * הקלדה בנתיב**, ואם הוא נקרא כ«אף אחד לא מייבא אותו» הוא נקרא כ«בטוח לשנות».
   */
  it('separates «not in the map» (exit 1) from «nothing imports it» (exit 0)', () => {
    const unknown = run(['components/Typo.tsx'], MAP);
    expect(unknown.code, '⛔ נתיב לא מוכר ⇒ קוד יציאה 1').toBe(1);
    expect(unknown.out).toContain('⛔ אינו במפה');

    const leaf = run(['app/page.tsx'], MAP);
    expect(leaf.code, '⛔ עלה מוכר ⇒ 0, זו תשובה').toBe(0);
    expect(leaf.out).toContain('⛔ אף קובץ ⛔ אינו מייבא אותו');
    // ⛔ ו⛔ אינו מבטיח בטיחות — המפה מודדת ייבוא, ⛔ לא התנהגות.
    expect(leaf.out).toContain('⛔ ולא התנהגות');
  });

  it('a bare call ⛔ does not swallow its own argument (the --depth index bug)', () => {
    // 🔬 נמדד בריצה הראשונה של הסקריפט: הסינון דילג על **הערך** של `--depth` לפי
    // השוואת ערך, ו-`argv[-1 + 1]` הוא היעד עצמו ⇒ כל קריאה בלי `--depth` הדפיסה
    // את מסך השימוש. ⇒ הדילוג הוא **לפי אינדקס**.
    const r = run(['components/Deck.tsx'], MAP);
    expect(r.out, '⛔ ⛔ לא מסך שימוש').not.toContain('שימוש: npm run affected');
    expect(r.code).toBe(0);
  });

  it('--json is machine-readable and carries the hop', () => {
    const r = run(['components/Deck.tsx', '--json'], MAP);
    expect(r.code).toBe(0);
    const parsed = JSON.parse(r.out) as {
      target: string;
      depth: number;
      affected: { file: string; hop: number }[];
    };
    expect(parsed.target).toBe('components/Deck.tsx');
    expect(parsed.depth).toBe(2);
    expect(parsed.affected.find((a) => a.file === 'app/page.tsx')?.hop).toBe(2);
    expect(parsed.affected.find((a) => a.file === 'components/Screen.tsx')?.hop).toBe(1);
  });

  it('⛔ a missing map is an error, ⛔ never an empty answer', () => {
    const r = run(['components/Deck.tsx'], join(tmpdir(), 'affected-does-not-exist.json'));
    expect(r.code).toBe(1);
    expect(r.out).toContain('generate-map');
  });
});
