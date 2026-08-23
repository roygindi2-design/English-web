#!/usr/bin/env node
/**
 * Builds supabase/seed/0004_stories.sql from data/generated/stories-*.jsonl (T-135).
 *
 * זו השכבה הלא-טהורה היחידה של הצינור: היא קוראת קבצים וכותבת אחד. הפירוק
 * (lib/core/storyGate.ts), רמות המילים (lib/core/wordLevel.ts) והשער עצמו טהורים
 * ונבדקים ביחידה.
 *
 * ⛔ R-014: כל סיפור עובר את השער **שוב** כאן, גם אחרי שסוכן ה-Content הריץ אותו.
 *    סיפור שנפסל מדווח ו**עוצר את הריצה** — ⛔ ואינו מתוקן. תיקון תוכן בתוך קליטה
 *    הוא טיק של סוכן ה-Content.
 *
 * ⛔ הבנק נבנה מאותם שני מקורות שמהם `build-word-levels-sql.mjs` בונה את
 *    `0002_word_cefr_levels.sql` — `data/generated/batch-*.jsonl` + שני פרופילי
 *    ה-CEFR. ⛔ אין כאן מקור חדש, ⛔ ואין קריאה לדאטהבייס (TD-24: אין Supabase חי
 *    בסביבת הלופ).
 *
 * ⛔ הסינון הוא על `cefr_profile_band` ולעולם לא על `senses.cefr_level` — השתיים
 *    חלוקות על 125 מתוך 343 שורות (D-034), וזה בדיוק הנימוק שכתוב ב-
 *    `app/api/levels/summary/route.ts`.
 *
 * TypeScript is imported directly, with no build step and no new dependency — the
 * registerHooks preamble is copied verbatim from scripts/build-ingest-sql.mjs.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // Not a TypeScript sibling — fall through to the default resolver.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { parseBatchFile } = await import('../lib/core/batchRecord.ts');
const { parseCefrCsv, buildLevelMap } = await import('../lib/core/cefrLevels.ts');
const { assignWordLevels } = await import('../lib/core/wordLevel.ts');
const {
  parseStoryFile,
  allowedLemmasAtOrBelow,
  storyGate,
  STORIES_PER_LEVEL,
  STORY_LEVELS,
} = await import('../lib/core/storyGate.ts');

const BANK_DIR = join('data', 'generated');
/** ⛔ דריסה לבדיקות בלבד, בדיוק כמו SEED_OUT_DIR — ⛔ אינה נקראת בשום מקום אחר. */
const STORIES_DIR = process.env.STORIES_DATA_DIR || BANK_DIR;
const OUT_DIR = process.env.SEED_OUT_DIR || join('supabase', 'seed');
const OUT = join(OUT_DIR, '0004_stories.sql');

const q = (v) => `'${String(v).replaceAll("'", "''")}'`;

// --- 1. הבנק: למה → רמת פרופיל, הנמוכה מבין ה-pos-ים -------------------------
const map = buildLevelMap([
  ...parseCefrCsv(readFileSync(join('data', 'cefrj-vocabulary-profile-1.5.csv'), 'utf8')).entries,
  ...parseCefrCsv(readFileSync(join('data', 'octanove-vocabulary-profile-c1c2-1.0.csv'), 'utf8')).entries,
]);

const batchFiles = readdirSync(BANK_DIR).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort();
const words = batchFiles
  .flatMap((f) => parseBatchFile(readFileSync(join(BANK_DIR, f), 'utf8')))
  // ⛔ `rec.cefrLevel` — השדה יושב על הרשומה ⛔ ולא על ה-sense. הצורה זהה ל-
  // `scripts/build-word-levels-sql.mjs:81`, ⛔ ולא ניחוש: `r.sense.cefr_level` הוא
  // תמיד `undefined`, כלומר `ownBand: null` שקט בכל שורה.
  .map((r) => ({ headword: r.sense.headword, pos: r.sense.pos, ownBand: r.cefrLevel ?? null }));

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const lowest = new Map();
for (const w of assignWordLevels(map, words).words) {
  if (w.profileBand === null) continue;
  const lemma = w.headword.toLowerCase();
  const prev = lowest.get(lemma);
  // ⛔ הנמוכה, ⛔ ולא הראשונה: מילה שהיא A1 כשם עצם ⛔ אינה נעשית קשה יותר מפני
  // שהפרופיל דירג את הפועל שלה גבוה יותר.
  if (prev === undefined || ORDER.indexOf(w.profileBand) < ORDER.indexOf(prev)) {
    lowest.set(lemma, w.profileBand);
  }
}
const bank = [...lowest.entries()].map(([lemma, band]) => ({ lemma, band }));

// --- 2. הסיפורים ------------------------------------------------------------
const storyFiles = readdirSync(STORIES_DIR).filter((f) => /^stories-.*\.jsonl$/.test(f)).sort();
if (storyFiles.length === 0) {
  // ⛔ עצירה, ⛔ ולא קובץ ריק: seed בלי שורות נראה כמו קליטה שהצליחה.
  throw new Error(`no stories-*.jsonl in ${STORIES_DIR} — the Content agent has not delivered yet`);
}

const stories = storyFiles.flatMap((f) => parseStoryFile(readFileSync(join(STORIES_DIR, f), 'utf8')));

// --- 3. השער, על כל סיפור, פעם שנייה (R-014) --------------------------------
const allowedByLevel = new Map(
  STORY_LEVELS.map((level) => [level, allowedLemmasAtOrBelow(level, bank)]),
);

const rejected = [];
for (const [i, story] of stories.entries()) {
  const result = storyGate(story, { allowedLemmas: allowedByLevel.get(story.level) });
  if (!result.ok) {
    rejected.push(
      `#${i + 1} [${story.level}] "${story.titleEn}" — ${result.reasons.join(', ')}` +
        (result.unknownWords.length > 0 ? ` · unknown: ${result.unknownWords.join(' ')}` : ''),
    );
  }
}
if (rejected.length > 0) {
  // ⛔ הרשימה כולה, ⛔ ולא הראשון: סבב תיקון אחד במקום שנים-עשר.
  throw new Error(`storyGate rejected ${rejected.length} of ${stories.length}:\n${rejected.join('\n')}`);
}

// --- 4. המכסה: 3 בדיוק בכל אחת מארבע הרמות ----------------------------------
for (const level of STORY_LEVELS) {
  const n = stories.filter((s) => s.level === level).length;
  if (n !== STORIES_PER_LEVEL) {
    throw new Error(`${level}: expected ${STORIES_PER_LEVEL} stories, got ${n}`);
  }
}

// --- 5. פליטה ---------------------------------------------------------------
const rows = stories
  .map((s) => `    (${q(s.level)}, ${q(s.titleEn)}, ${q(s.bodyEn)}, 'generated')`)
  .join(',\n');

const sql = `-- supabase/seed/0004_stories.sql
-- ⛔ GENERATED by scripts/build-stories-sql.mjs — do not edit by hand.
--    Regenerate with \`npm run build:stories\`. Apply exactly like a migration.
--
-- ${stories.length} stories · ${STORIES_PER_LEVEL} per level · sources: ${storyFiles.join(' ')}
-- Every row was re-gated by lib/core/storyGate.ts (R-014) before emission.
-- origin is set to generated on every row and is NOT a field of the input (§ 7.6);
-- the literal is quoted in the value rows below and nowhere else, so a row count is
-- exactly the number of quoted occurrences (measured: a mention here made it 13).
-- Apply supabase/migrations/0018_stories.sql first.

begin;

insert into public.stories (cefr_level, title_en, body_en, origin) values
${rows}
on conflict (cefr_level, title_en) do nothing;

commit;
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, sql, 'utf8');
console.log(`${OUT}: ${stories.length} stories from ${storyFiles.length} file(s)`);
