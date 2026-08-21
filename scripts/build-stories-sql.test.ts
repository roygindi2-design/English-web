import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBatchFile } from '@/lib/core/batchRecord';
import { buildLevelMap, parseCefrCsv } from '@/lib/core/cefrLevels';
import { assignWordLevels } from '@/lib/core/wordLevel';
import { STORIES_PER_LEVEL, STORY_LEVELS, STORY_MIN_WORDS, allowedLemmasAtOrBelow } from '@/lib/core/storyGate';

/**
 * הפיקסטורות ⛔ אינן כותבות מילים בכתב יד: הן נבנות מ**הבנק האמיתי**, בדיוק כפי
 * שהסקריפט בונה אותו. פיקסטורה עם רשימת מילים קשיחה הייתה מאדימה ביום שבו אצוות
 * תוכן משנה את הבנק — ושער שנערך בכל טיק תוכן מפסיק להיקרא (הלקח של F-048).
 */
const DATA = join('data', 'generated');

function bankLemmas() {
  const map = buildLevelMap([
    ...parseCefrCsv(readFileSync(join('data', 'cefrj-vocabulary-profile-1.5.csv'), 'utf8')).entries,
    ...parseCefrCsv(readFileSync(join('data', 'octanove-vocabulary-profile-c1c2-1.0.csv'), 'utf8')).entries,
  ]);
  const words = readdirSync(DATA)
    .filter((f) => /^batch-.*\.jsonl$/.test(f))
    .sort()
    .flatMap((f) => parseBatchFile(readFileSync(join(DATA, f), 'utf8')))
    // ⛔ `rec.cefrLevel`, ⛔ ולא `rec.sense.cefr_level`: השדה יושב על הרשומה ⛔ ולא על
    // ה-sense, וזו בדיוק הצורה ב-`scripts/build-word-levels-sql.mjs:81` (נמדד — `tsc`
    // הפיל את הצורה השנייה בשם).
    .map((r) => ({ headword: r.sense.headword, pos: r.sense.pos, ownBand: r.cefrLevel ?? null }));
  // ⛔ `flatMap`, ⛔ ולא `filter().map()`: `filter` ⛔ אינו טוען טיפוס, ו-`profileBand`
  // נשאר `CefrBand | null` מול `BankLemma.band` שהוא `CefrBand`.
  return assignWordLevels(map, words).words.flatMap((w) =>
    w.profileBand === null ? [] : [{ lemma: w.headword.toLowerCase(), band: w.profileBand }],
  );
}

/**
 * ⛔ למה חד-מילית בלבד. נמדד: הבנק מכיל צירופים (`look after`) ומקפים, והשער
 * מפרק לטוקנים — צירוף בפיקסטורה היה נפסל בשער, ⛔ והבדיקה הייתה מודדת את
 * הפיקסטורה ולא את הסקריפט.
 */
const A1 = [...allowedLemmasAtOrBelow('A1', bankLemmas())].filter((w) => /^[a-z]+$/.test(w)).sort();

/** גוף חוקי: מילות A1 אמיתיות, בדיוק STORY_MIN_WORDS מהן. */
function body(seed: number): string {
  const words = Array.from({ length: STORY_MIN_WORDS }, (_, i) => A1[(i * 7 + seed) % A1.length]);
  return `${words.join(' ')}.`;
}

function fixtureDir(stories: readonly { level: string; title: string; body: string }[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'stories-data-'));
  writeFileSync(
    join(dir, 'stories-2026-08-21.jsonl'),
    stories.map((s) => JSON.stringify({ level: s.level, title_en: s.title, body_en: s.body })).join('\n'),
    'utf8',
  );
  return dir;
}

function twelve(): { level: string; title: string; body: string }[] {
  return STORY_LEVELS.flatMap((level, li) =>
    Array.from({ length: STORIES_PER_LEVEL }, (_, i) => ({
      level,
      // ⛔ אפס ספרה בכותרת (`digit_in_text`), ולכן הייחוד נבנה מ**מילות בנק** לפי
      // (‏רמה, אינדקס) — ⛔ ולא מהחלפת ספרה, שהחזירה `string | undefined` ל-`replace`.
      title: `${A1[0]} ${A1[1]} ${A1[(li + 2) % A1.length]} ${A1[(i + 5) % A1.length]}`,
      body: body(li * 10 + i),
    })),
  );
}

function run(dataDir: string, outDir: string): string {
  return execFileSync('node', ['scripts/build-stories-sql.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, STORIES_DATA_DIR: dataDir, SEED_OUT_DIR: outDir },
  });
}

describe('build-stories-sql — המסלול המלא', () => {
  it('12 סיפורים עוברים ⇒ SQL עם 12 שורות ערכים, 3 בכל רמה', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    run(fixtureDir(twelve()), out);
    const sql = readFileSync(join(out, '0004_stories.sql'), 'utf8');
    for (const level of STORY_LEVELS) {
      expect(sql.split(`'${level}'`).length - 1).toBe(STORIES_PER_LEVEL);
    }
    expect(sql.split("'generated'").length - 1).toBe(STORIES_PER_LEVEL * STORY_LEVELS.length);
    expect(sql).toMatch(/^\s*begin;/im);
    expect(sql).toMatch(/commit;\s*$/im);
    expect(sql).toMatch(/on conflict \(cefr_level, title_en\) do nothing/i);
  });

  it('⛔ 11 מפילים את הסקריפט בשם, ⛔ ולא פולטים קובץ חלקי', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    expect(() => run(fixtureDir(twelve().slice(0, 11)), out)).toThrow(/expected 3 .*got 2|B2/i);
  });

  it('⛔ מילה מחוץ לרמה מפילה, והמילה מדווחת בשמה', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    // ⛔ פירוק, ⛔ ולא `bad[0] = {...bad[0]}`: תחת `noUncheckedIndexedAccess` הפריסה
    // של איבר-אינדקס מייצרת שדות אופציונליים, ו-`tsc` מפיל אותה (נמדד).
    const [first, ...rest] = twelve();
    if (first === undefined) throw new Error('fixture: twelve() returned no stories');
    const bad = [{ ...first, body: `${first.body} helicopter.` }, ...rest];
    expect(() => run(fixtureDir(bad), out)).toThrow(/helicopter/);
  });

  it('⛔ אין קובץ קלט ⇒ עצירה בשם, ⛔ ולא קובץ ריק', () => {
    const out = mkdtempSync(join(tmpdir(), 'stories-out-'));
    expect(() => run(mkdtempSync(join(tmpdir(), 'stories-empty-')), out)).toThrow(/stories-.*\.jsonl/);
  });
});

describe('⛔ הגבול של D-054', () => {
  it('⛔ הסקריפט ⛔ אינו מזכיר את הזירה', () => {
    const src = readFileSync('scripts/build-stories-sql.mjs', 'utf8');
    expect(src).not.toContain('arcade_collected_words');
  });
});
