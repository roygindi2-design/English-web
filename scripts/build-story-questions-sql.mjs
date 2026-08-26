#!/usr/bin/env node
/**
 * Builds supabase/seed/0005_story_questions.sql from
 * data/generated/story-questions-*.jsonl (T-188).
 *
 * Same shape and same reasoning as scripts/build-stories-sql.mjs:
 *
 * R-014: every question passes `storyQuestionGate` **again** here, even though the
 *    Content agent already ran it. A rejected item is reported and **stops the run** —
 *    it is not repaired. Repairing content during ingest is a Content tick.
 *
 * No empty file: a seed with no rows looks exactly like an ingest that succeeded.
 *
 * The bank is built from the SAME two sources build-stories-sql.mjs uses, and the
 *    level filter is `cefr_profile_band` — never the per-sense level column, which
 *    disagrees on 125 of 343 rows (D-034).
 *
 * `story_id` is resolved IN SQL, not here. The jsonl carries the story's LEVEL
 *    and TITLE, and `public.stories` is `unique (cefr_level, title_en)` — so the insert
 *    selects the id by that key. Emitting a uuid from this script would hard-code a
 *    generated id into a data migration, and re-seeding stories would silently orphan
 *    every question.
 *
 * TypeScript is imported directly, with no build step and no new dependency — the
 * registerHooks preamble is copied verbatim from scripts/build-stories-sql.mjs.
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
const { parseStoryFile, allowedLemmasAtOrBelow, STORY_LEVELS } = await import(
  '../lib/core/storyGate.ts'
);
const { storyQuestionGate, ANSWERS_PER_QUESTION } = await import(
  '../lib/core/storyQuestionGate.ts'
);

const BANK_DIR = join('data', 'generated');
/** Test override only, exactly like SEED_OUT_DIR — read nowhere else. */
const QUESTIONS_DIR = process.env.STORY_QUESTIONS_DATA_DIR || BANK_DIR;
const STORIES_DIR = process.env.STORIES_DATA_DIR || BANK_DIR;
const OUT_DIR = process.env.SEED_OUT_DIR || join('supabase', 'seed');
const OUT = join(OUT_DIR, '0005_story_questions.sql');

const q = (v) => `'${String(v).replaceAll("'", "''")}'`;

// --- 1. the bank: lemma -> profile band, the LOWEST across its parts of speech ---
const map = buildLevelMap([
  ...parseCefrCsv(readFileSync(join('data', 'cefrj-vocabulary-profile-1.5.csv'), 'utf8')).entries,
  ...parseCefrCsv(readFileSync(join('data', 'octanove-vocabulary-profile-c1c2-1.0.csv'), 'utf8'))
    .entries,
]);

const batchFiles = readdirSync(BANK_DIR)
  .filter((f) => /^batch-.*\.jsonl$/.test(f))
  .sort();
const words = batchFiles
  .flatMap((f) => parseBatchFile(readFileSync(join(BANK_DIR, f), 'utf8')))
  .map((r) => ({ headword: r.sense.headword, pos: r.sense.pos, ownBand: r.cefrLevel ?? null }));

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const lowest = new Map();
for (const w of assignWordLevels(map, words).words) {
  if (w.profileBand === null) continue;
  const lemma = w.headword.toLowerCase();
  const prev = lowest.get(lemma);
  if (prev === undefined || ORDER.indexOf(w.profileBand) < ORDER.indexOf(prev)) {
    lowest.set(lemma, w.profileBand);
  }
}
const bank = [...lowest.entries()].map(([lemma, band]) => ({ lemma, band }));

// --- 2. the stories the questions are grounded in -----------------------------
const storyFiles = readdirSync(STORIES_DIR)
  .filter((f) => /^stories-.*\.jsonl$/.test(f))
  .sort();
if (storyFiles.length === 0) {
  throw new Error(
    `no stories-*.jsonl in ${STORIES_DIR} — a question with no story cannot be gated`,
  );
}
const stories = storyFiles.flatMap((f) =>
  parseStoryFile(readFileSync(join(STORIES_DIR, f), 'utf8')),
);
const storyByKey = new Map(stories.map((s) => [`${s.level} ${s.titleEn}`, s]));

// --- 3. the questions ---------------------------------------------------------
const questionFiles = readdirSync(QUESTIONS_DIR)
  .filter((f) => /^story-questions-\d.*\.jsonl$/.test(f))
  .sort();
if (questionFiles.length === 0) {
  // Stop, not an empty file: a seed with no rows looks like a successful ingest.
  throw new Error(
    `no story-questions-*.jsonl in ${QUESTIONS_DIR} — the Content agent has not delivered yet`,
  );
}

const questions = questionFiles.flatMap((f) =>
  readFileSync(join(QUESTIONS_DIR, f), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const raw = JSON.parse(line);
      return {
        storyLevel: raw.story_level,
        storyTitleEn: raw.story_title_en,
        questionEn: raw.question_en,
        answersHe: raw.answers_he,
        correctIndex: raw.correct_index,
      };
    }),
);
if (questions.length === 0) {
  throw new Error(`${questionFiles.join(' ')} held no rows — refusing to write an empty seed`);
}

// --- 4. the gate, on every question, a second time (R-014) --------------------
const allowedByLevel = new Map(
  STORY_LEVELS.map((level) => [level, allowedLemmasAtOrBelow(level, bank)]),
);
// The Hebrew vocabulary the gate is allowed to see is the union of what the batch
// delivered — the same closed set the Content agent gated against, and nothing wider.
const allowedHebrew = new Set(
  questions.flatMap((item) => (item.answersHe ?? []).map((a) => String(a))),
);

const rejected = [];
for (const [i, item] of questions.entries()) {
  const story = storyByKey.get(`${item.storyLevel} ${item.storyTitleEn}`);
  if (story === undefined) {
    rejected.push(`#${i + 1} [${item.storyLevel}] "${item.storyTitleEn}" — no such story`);
    continue;
  }
  const result = storyQuestionGate(item, {
    allowedLemmas: allowedByLevel.get(item.storyLevel),
    allowedHebrew,
    storyBodyEn: story.bodyEn,
  });
  if (!result.ok) {
    rejected.push(
      `#${i + 1} [${item.storyLevel}] "${item.storyTitleEn}" — ${result.reasons.join(', ')}` +
        (result.unknownWords.length > 0 ? ` · unknown: ${result.unknownWords.join(' ')}` : ''),
    );
  }
}
if (rejected.length > 0) {
  // The whole list, not the first: one repair round instead of twelve.
  throw new Error(
    `storyQuestionGate rejected ${rejected.length} of ${questions.length}:\n${rejected.join('\n')}`,
  );
}

// --- 5. one question per story, and not two ----------------------------------
const seen = new Set();
for (const item of questions) {
  const key = `${item.storyLevel} ${item.storyTitleEn}`;
  if (seen.has(key)) throw new Error(`two questions for the same story: "${item.storyTitleEn}"`);
  seen.add(key);
  if (item.answersHe.length !== ANSWERS_PER_QUESTION) {
    throw new Error(`"${item.storyTitleEn}": expected ${ANSWERS_PER_QUESTION} answers`);
  }
}

// --- 6. emission ---------------------------------------------------------------
const rows = questions
  .map(
    (item) =>
      `    (
      (select id from public.stories
        where cefr_level = ${q(item.storyLevel)} and title_en = ${q(item.storyTitleEn)}),
      ${q(item.questionEn)},
      array[${item.answersHe.map((a) => q(a)).join(', ')}]::text[],
      ${Number(item.correctIndex)},
      'generated')`,
  )
  .join(',\n');

const sql = `-- supabase/seed/0005_story_questions.sql
-- GENERATED by scripts/build-story-questions-sql.mjs — do not edit by hand.
--    Regenerate with \`npm run build:questions\`. Apply exactly like a migration.
--
-- ${questions.length} questions · one per story · sources: ${questionFiles.join(' ')}
-- Every row was re-gated by lib/core/storyQuestionGate.ts (R-014) before emission.
-- origin is set to generated on every row and is NOT a field of the input (7.6).
-- story_id is resolved by (cefr_level, title_en) — the unique key of public.stories —
--    so re-seeding the stories cannot orphan a question.
-- Apply supabase/migrations/0019_story_questions.sql and seed 0004_stories.sql first.

begin;

insert into public.story_questions (story_id, question_en, answers_he, correct_index, origin) values
${rows}
on conflict (story_id) do nothing;

commit;
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, sql, 'utf8');
console.log(`${OUT}: ${questions.length} questions from ${questionFiles.length} file(s)`);
