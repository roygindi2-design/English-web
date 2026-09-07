/**
 * T-253 · D-186 — a real script (walks the filesystem), ⛔ NOT `/lib/core`.
 *
 * Extends the live journey walk's name-drift check to a destination the walk
 * never visits together: this test scans every non-test `.ts`/`.tsx` file under
 * `app/` and `components/` for `<Link href="...">label</Link>`, and feeds the
 * result into the SAME pure `driftingNames` comparator `scripts/verify-mobile.mjs`
 * already uses on a live walk (`lib/core/journeyDrift.ts`). One name per
 * destination, checked once, over the whole tree — so a fourth name (or a
 * fourth destination) landing on a route two screens already disagree about
 * fails a real test instead of drifting in silently.
 *
 * T-261 · D-187 §ג׳ — once coverage went from 5/57 to 18/57 (below), this
 * check started seeing real, pre-existing label diversity at `/cards` and
 * `/world/compose` that the old 5-link view never reached. D-187 §ג׳ already
 * rules on exactly this shape of disagreement: «יציאה = קישור שכל תפקידו
 * לעזוב את המסך הנוכחי ליעד שהלומד כבר מכיר. CTA = קישור שמציע ביעד פעולה
 * חדשה שהלומד עוד לא עשה … CTA שומר את הניסוח שלו ⛔ ואינו נספר מול הכלל.»
 * — and gives the exit link its own syntactic marker: «לכל יעד יש שם יציאה
 * אחד בדיוק, והוא `חזרה ל<יעד>`» (§ג׳.2 folds the deviant `חזור ל` form into
 * the same prefix). ⇒ `exitLabelsOnly` below applies exactly that already-
 * decided rule — it does NOT invent a per-destination allowlist, and it does
 * NOT touch `lib/core/journeyDrift.ts` (shared with the live-walk check in
 * `scripts/verify-mobile.mjs`, ⛔ out of `T-261`'s scope): the filter lives
 * only in this static, full-tree check.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractLinkLabels, linkElementCount, resolveLinkElements } from '../lib/core/linkLabelScan';
import { driftingNames } from '../lib/core/journeyDrift';

const ROOT = join(__dirname, '..');
const EXIT_LABEL = /^חז(?:רה|ור) ל/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/**
 * T-273 — the shared copy modules come FIRST. Since 06/09 the `session_expired`
 * exit label is `export const SIGN_IN_AGAIN_HE` in `lib/core/failureExit.ts` and
 * every screen imports it; `resolveLinkElements` resolves a `{IDENT}` label
 * against the nearest earlier declaration in the concatenated text, so the two
 * modules are prepended and an imported label resolves exactly like a local one.
 * ⛔ Not the whole of `lib/`: only the modules that hold learner-facing copy.
 */
const SHARED_COPY_MODULES = ['lib/core/failure.ts', 'lib/core/failureExit.ts'] as const;

function treeSource(): string {
  const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components'))].filter(
    (f) => /\.(ts|tsx)$/.test(f) && !/\.(test|spec)\.(ts|tsx)$/.test(f),
  );
  const shared = SHARED_COPY_MODULES.map((f) => readFileSync(join(ROOT, f), 'utf8'));
  return [...shared, ...files.map((f) => readFileSync(f, 'utf8'))].join('\n');
}

/** D-187 §ג׳.1–3 — keep only exit-shaped labels (`חזרה ל…` / the deviant `חזור ל…`); a CTA is exempt from the one-name-per-destination rule. */
function exitLabelsOnly(labelsByDestination: ReadonlyMap<string, ReadonlySet<string>>): Map<string, Set<string>> {
  const exitOnly = new Map<string, Set<string>>();
  for (const [destination, labels] of labelsByDestination) {
    const exits = new Set([...labels].filter((label) => EXIT_LABEL.test(label)));
    if (exits.size > 0) exitOnly.set(destination, exits);
  }
  return exitOnly;
}

describe('שם יעד אחד לכל יעד — סריקה סטטית על `app/` + `components/` (T-253 · D-187 §ג׳)', () => {
  it('⛔ אין שני שמות *יציאה* שונים לאותו יעד — CTA שומר את הניסוח שלו ואינו נספר (D-187 §ג׳.3)', () => {
    const labels = extractLinkLabels(treeSource());

    expect(driftingNames(exitLabelsOnly(labels))).toEqual([]);
  });

  it('`exitLabelsOnly` — הפועל `חזור` נספר כמו `חזרה` (D-187 §ג׳.2), ותווית CTA אינה נספרת כלל', () => {
    const labels = new Map([
      ['/cards', new Set(['חזרה לכרטיסיות', 'בחירת רמה'])],
      ['/arcade', new Set(['חזור לזירה'])],
      ['/world/compose', new Set(['כתוב את המשפט הראשון שלך', 'כתוב עוד משפט'])],
    ]);

    expect(exitLabelsOnly(labels)).toEqual(
      new Map([
        ['/cards', new Set(['חזרה לכרטיסיות'])],
        ['/arcade', new Set(['חזור לזירה'])],
      ]),
    );
  });

  // T-261 · D-187 — לפני התיקון: `extractLinkLabels` דרש מרכאות סביב ה-href
  // וסביב התווית, ו-29 מתוך 40 קישורים ב-`app/`+`components/` נותנים את אחד
  // מהם (או שניהם) דרך קבוע ברמת המודול ⇒ נמדדו **5 מתוך 40** (C-0437/T-261).
  // ⚠️ זהו שער כיסוי, ⛔ לא שער דיוק: קישור ⛔ נספר "נראה" רק כשגם היעד וגם
  // תווית עברית נפתרו — קישור עם אייקון בלבד, או עם href דינמי, ⛔ אמורים
  // להישאר בחוץ, ולכן התקרה ⛔ אינה 40/40 בהכרח.
  it('שער הכיסוי — כמה מתוך כל ה-`<Link>` שבעץ `extractLinkLabels` בפועל רואה, ⛔ ונופל כשהמספר יורד', () => {
    const source = treeSource();
    const total = linkElementCount(source);
    const recognized = resolveLinkElements(source).length;

    // eslint-disable-next-line no-console
    console.log(`link coverage: ${recognized}/${total}`);

    expect(total).toBeGreaterThan(0);
    // ⛔ הרף הזה נמדד חי בטיק T-261 (C-0438, `18/57`) ⛔ ולא הונח — ירידה מתחתיו היא רגרסיה אמיתית.
    // (המספר הכולל של `<Link>` בעץ עלה מ-40 ל-57 בין מדידת D-187 ל-C-0438 — עבודת לופ רגילה בין הטיקים.)
    expect(recognized).toBeGreaterThanOrEqual(18);
  });
});
