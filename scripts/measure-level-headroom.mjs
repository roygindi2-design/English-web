#!/usr/bin/env node
/**
 * T-114 · D-058 — כמה כותרות פנויות-עם-תווית נשארו בכל רמה.
 *
 * ⛔ קריאה בלבד. הוא קורא data/ וכותב קובץ אחד תחת docs/. ⛔ אפס SQL, אפס seed,
 * אפס עמודה. `words.cefr_profile_band` היא עמודת מקור חיצוני (D-058 סעיף 3).
 *
 * ⛔ אינו מוריד דבר (TD-17). הפרֶאמבּל של registerHooks מועתק מילולית מ-
 * scripts/measure-coverage.mjs מאותה סיבה: Node ≥ 22.18 מפשיט טיפוסים בעצמו,
 * אך ⛔ אינו פותר את המפרטים חסרי-הסיומת ש-lib/core משתמש בהם.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

const { parseCefrCsv, buildLevelMap } = await import('../lib/core/cefrLevels.ts');
const { parseBatchFile } = await import('../lib/core/batchRecord.ts');
const { measureHeadroom, renderHeadroomMarkdown } = await import('../lib/core/levelHeadroom.ts');

const DATA = 'data';
const GENERATED = join(DATA, 'generated');
const OUT = join('docs', 'level-headroom-report.md');
const ALLOWED_WORDS_FILE = 'allowed-words-2026-08-07.txt';
const PROFILES = [
  'cefrj-vocabulary-profile-1.5.csv',
  'octanove-vocabulary-profile-c1c2-1.0.csv',
];

const provenance = [];

// --- 1. הפרופילים ------------------------------------------------------------
// ⛔ פרופיל חסר הוא עצירה ⛔ ולא "unavailable": בלי תוויות אין אוכלוסייה כלל,
// ודוח שכל שורותיו אפס היה נקרא כ"נגמרו הכותרות" במקום כ"לא נמדד".
const levelEntries = [];
for (const name of PROFILES) {
  const path = join(DATA, name);
  if (!existsSync(path)) {
    console.error(`\n✗ ${path} חסר — אין אוכלוסייה למדוד. ראה data/README.md (T-043).\n`);
    process.exit(1);
  }
  const parsed = parseCefrCsv(readFileSync(path, 'utf8'));
  levelEntries.push(...parsed.entries);
  provenance.push(
    `\`${path}\` — ${parsed.rows} שורות · ${parsed.entries.length} רשומות · `
    + `${parsed.skipped} דולגו · ${parsed.unknownPos} ללא POS מוכר`,
  );
}
const map = buildLevelMap(levelEntries);

// --- 2. רשימת ההיתר ----------------------------------------------------------
const allowedPath = join(GENERATED, ALLOWED_WORDS_FILE);
let allowed = [];
if (existsSync(allowedPath)) {
  allowed = readFileSync(allowedPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  provenance.push(`\`${allowedPath}\` — ${allowed.length} צורות מותרות (NGSL v1.2)`);
} else {
  provenance.push(`\`${allowedPath}\` — **unavailable** ⇒ אפס כותרות מותרות, ⛔ ולא "הכל מותר"`);
}

// --- 3. מה כבר נכתב ----------------------------------------------------------
const authored = [];
const batchFiles = existsSync(GENERATED)
  ? readdirSync(GENERATED).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort()
  : [];
for (const file of batchFiles) {
  const records = parseBatchFile(readFileSync(join(GENERATED, file), 'utf8'));
  for (const rec of records) authored.push(rec.sense.headword);
  provenance.push(`\`${join(GENERATED, file)}\` — ${records.length} רשומות`);
}
if (batchFiles.length === 0) {
  provenance.push(`\`${GENERATED}\` — **unavailable** ⇒ אפס כותרות כתובות`);
}

// --- 4. מדידה ופלט -----------------------------------------------------------
const report = measureHeadroom({ labelled: map.byLemma, allowed, authored });
mkdirSync('docs', { recursive: true });
writeFileSync(OUT, renderHeadroomMarkdown(report, provenance, new Date().toISOString()), 'utf8');

for (const b of report.bands) {
  console.log(
    `${b.band}: free ${b.free} (labelled ${b.labelled} · allowed ${b.allowed} · authored ${b.authored} · offLimits ${b.offLimits})`,
  );
}
console.log(
  `TOTAL: free ${report.totals.free} · authoredUnlabelled ${report.authoredUnlabelled} · authoredOffLimits ${report.authoredOffLimits}`,
);
console.log(`\nwrote ${OUT}`);
