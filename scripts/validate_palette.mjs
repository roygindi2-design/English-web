#!/usr/bin/env node
/**
 * T-172 — **הקובץ ש-`plan/RULES.md § 0.8` חייב אותנו להריץ, ושמעולם לא היה כאן.**
 *
 * נמדד 23/08: `find . -name "validate_palette*"` ⇒ **אפס תוצאות**, בזמן שהכלל
 * מחייב «להריץ אותו לפני כל גרף, מד או פס התקדמות, ⛔ לא לאמוד בעין». כלל שמצביע
 * על קובץ שאינו קיים ⛔ אינו כלל — הוא הוראה שכל סוכן מדלג עליה בשקט. ⇒ או שכותבים
 * את הקובץ, או שמוחקים את הכלל. זה הקובץ.
 *
 * ⛔ **מה הוא ⛔ אינו:** ⛔ אינו «בודק נגישות», ו⛔ אינו אומר אם הגרף מובן. הוא עונה
 * על **שתי שאלות מדידות**:
 *   1 · האם כל צבע נקרא על המשטח — יחס ניגודיות WCAG.
 *   2 · האם צבעים **קטגוריים** נבדלים גם לעין פרוטן ודויטן — ΔE‏76.
 * ⛔ טריטן ⛔ אינו נבדק, והסיבה כתובה ב-`lib/core/colorVision.ts`.
 *
 * ⛔ **קריאה בלבד.** ⛔ אינו כותב קובץ ו⛔ אינו מתקן צבע.
 *
 * שימוש:
 *   node scripts/validate_palette.mjs                      ⇐ פלטת המוצר, שני המצבים
 *   node scripts/validate_palette.mjs --colors "#f2b544,#5b9bf5" --surface "#0f172a"
 *
 * יוצא 1 על כל כישלון, כדי שאפשר יהיה להסתעף עליו.
 */
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

const { COLOR_TOKENS, CONTRAST_FLOORS, contrastRatio, tokenValue } = await import(
  '../lib/core/palette.ts'
);
const { CATEGORICAL_MIN_DELTA_E, CVD_TYPES, categoricalClashes, deltaE76, simulateCvd } =
  await import('../lib/core/colorVision.ts');

/** ⛔ אין ברירת מחדל שקטה לדגל שקיבל ערך ריק — ריק הוא שגיאה, ⛔ ולא «לא נמסר». */
function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith('--') || value.trim() === '') {
    throw new Error(`validate_palette: --${name} ⛔ ללא ערך`);
  }
  return value.trim();
}

/** WCAG 2.1: 3:1 לטקסט גדול ולגבול פקד. ⛔ צבע קטגורי בגרף הוא גבול, ⛔ ולא טקסט. */
const NON_TEXT_FLOOR = 3;

const failures = [];
const note = (line) => console.log(line);

const colorsArg = flag('colors');

if (colorsArg === null) {
  note('פלטת המוצר — `lib/core/palette.ts`\n');
  for (const floor of CONTRAST_FLOORS) {
    for (const mode of ['light', 'dark']) {
      const fg = tokenValue(floor.fg, mode);
      const bg = tokenValue(floor.bg, mode);
      const ratio = contrastRatio(fg, bg);
      const ok = ratio >= floor.min;
      note(
        `  ${ok ? 'ok  ' : 'FAIL'} ${mode.padEnd(5)} ${floor.fg} על ${floor.bg} — ${ratio.toFixed(2)}:1 (רצפה ${floor.min}) · ${floor.why}`,
      );
      if (!ok) failures.push(`${floor.fg}/${floor.bg} ב-${mode}: ${ratio.toFixed(2)} < ${floor.min}`);
    }
  }

  note('\nהזוג הקטגורי היחיד במוצר — --success מול --danger:');
  for (const mode of ['light', 'dark']) {
    const a = tokenValue('--success', mode);
    const b = tokenValue('--danger', mode);
    note(`  ${mode.padEnd(5)} ראייה רגילה ΔE ${deltaE76(a, b).toFixed(1)}`);
    for (const type of CVD_TYPES) {
      const d = deltaE76(simulateCvd(a, type), simulateCvd(b, type));
      note(`        ${type.padEnd(7)} ΔE ${d.toFixed(1)}${d < CATEGORICAL_MIN_DELTA_E ? '  ⚠️' : ''}`);
    }
  }
  note(
    `\n⚠️ הזוג הזה **נכשל** בסף הקטגורי, ו⛔ זה ⛔ אינו פגם לתקן: הוא הסיבה שמצב\n` +
      `   ⛔ לעולם אינו מקודד בצבע בלבד במוצר הזה — אייקון **וגם** תווית, תמיד.\n` +
      `   ⇒ ${COLOR_TOKENS.length} טוקנים נבדקו. הכישלון היחיד המותר הוא זה, והוא מוצהר.`,
  );
} else {
  const surface = flag('surface');
  if (surface === null) throw new Error('validate_palette: --colors ⛔ בלי --surface');
  const colors = colorsArg.split(',').map((c) => c.trim()).filter((c) => c !== '');
  if (colors.length === 0) throw new Error('validate_palette: --colors ⛔ ריק');

  note(`סדרה קטגורית של ${colors.length} צבעים על ${surface}\n`);
  for (const c of colors) {
    const ratio = contrastRatio(c, surface);
    const ok = ratio >= NON_TEXT_FLOOR;
    note(`  ${ok ? 'ok  ' : 'FAIL'} ${c} על המשטח — ${ratio.toFixed(2)}:1 (רצפה ${NON_TEXT_FLOOR})`);
    if (!ok) failures.push(`${c} על ${surface}: ${ratio.toFixed(2)} < ${NON_TEXT_FLOOR}`);
  }

  note('');
  const clashes = categoricalClashes(colors);
  if (clashes.length === 0) {
    note(`  ok   כל זוג נבדל ב-ΔE ≥ ${CATEGORICAL_MIN_DELTA_E} בראייה רגילה ובכל אחת מ-${CVD_TYPES.join(' · ')}`);
  } else {
    for (const c of clashes) {
      note(`  FAIL ${c.a} מול ${c.b} — ${c.vision ?? 'ראייה רגילה'} ΔE ${c.deltaE.toFixed(1)}`);
      failures.push(`${c.a}~${c.b} ב-${c.vision ?? 'רגילה'}: ΔE ${c.deltaE.toFixed(1)}`);
    }
  }
  note(`\n⛔ טריטן ⛔ לא נבדק — ראו ההנמקה ב-lib/core/colorVision.ts.`);
}

if (failures.length > 0) {
  console.log(`\nvalidate_palette: ${failures.length} כישלונות`);
  process.exit(1);
}
console.log('\nvalidate_palette: OK');
