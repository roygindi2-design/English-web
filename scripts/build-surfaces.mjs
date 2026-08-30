#!/usr/bin/env node
/**
 * ⛔ GENERATED. Writes `plan/63-surfaces.md` and ⛔ nothing else. ⛔ Never hand-edit
 * the output — fix the code, then rerun.
 *
 * **WHY THIS EXISTS (proposal 8 · question 6 of `plan/45-product-questions.md`).**
 * The six product questions ask, for every screen: what is the ONE main action ·
 * where does the learner arrive from · where can they go · what does it look like
 * empty. ⛔ The questions have been asked since 23/08 and the answers were ⛔ never
 * collected anywhere. ⇒ four screens can carry three different names for the same
 * action and ⛔ nothing in the loop can see it, because ⛔ no register holds the
 * screens side by side.
 *
 * ⛔ **AND IT IS DERIVED FROM THE CODE, WHICH IS THE WHOLE POINT.** A hand-written
 * inventory is a 553KB architecture file that drifts the day after it is written
 * (`RULES § 0.5ב` says exactly this about `30-architecture.md`). This one is
 * regenerated, so it ⛔ cannot lie — and a screen missing from it is a screen that
 * ⛔ does not exist in `app/`, ⛔ not a screen somebody forgot to describe.
 *
 * ⚠️ **WHAT IT IS ⛔ NOT.** It measures **wiring**, ⛔ never quality: a screen can
 * have one crisp action, two entrances and a written empty state and still teach
 * nothing. That is what the QA walk and the render comparison are for.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.env.SURFACES_ROOT ?? '.';
const OUT = process.env.SURFACES_OUT ?? join(ROOT, 'plan', '63-surfaces.md');

const walk = (dir) => {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
};

/**
 * ⛔ Test files are ⛔ NOT surfaces. A `page.test.ts` that asserts a link exists would
 * otherwise appear as an ENTRANCE — «the learner arrives from a test» — which is the
 * kind of tidy nonsense that makes a derived register untrustworthy on sight.
 */
const files = walk(join(ROOT, 'app')).filter((f) => !/\.(test|spec)\.(ts|tsx)$/.test(f));
const pages = files.filter((f) => /(^|[\\/])page\.tsx$/.test(f)).sort();
const read = (f) => readFileSync(f, 'utf8');

/**
 * ⛔ Route groups — `(tabs)` — are a Next.js FOLDER convention and carry ⛔ no URL
 * segment. Leaving them in would print a route no learner can ever type, which is
 * the class of "inventory that looks authoritative and is wrong".
 */
const routeOf = (file) => {
  const rel = relative(join(ROOT, 'app'), file).replace(/(^|[\\/])page\.tsx$/, '');
  const segs = rel.split(/[\\/]/).filter((s) => s !== '' && !/^\(.*\)$/.test(s));
  return `/${segs.join('/')}`.replace(/^\/$/, '/');
};

/** The component a page hands its markup to — the file where the real screen lives. */
const COMPONENT_IMPORT = /import\s+([A-Z][\w]*)\s+from\s+'@\/components\/([\w./-]+)'/g;
const screenComponent = (body) => {
  const imports = [...body.matchAll(COMPONENT_IMPORT)].map((m) => ({ name: m[1], path: m[2] }));
  if (imports.length === 0) return null;
  /**
   * ⛔ **THE FIRST IMPORT IS ⛔ NOT THE SCREEN.** Measured on the first run: `/sources`
   * reported `EnWord` and `/settings` reported `LevelPath` — both are children used
   * inside the page, and both are alphabetically ahead of the component that actually
   * renders it. ⇒ the search starts at the DEFAULT EXPORT and takes the first imported
   * component rendered there, which is the one the route hands its markup to.
   */
  const at = body.search(/export default (?:async )?function/);
  const region = at === -1 ? body : body.slice(at);
  let best = null;
  let bestAt = Number.POSITIVE_INFINITY;
  for (const i of imports) {
    const m = new RegExp(`<${i.name}[\\s/>]`).exec(region);
    if (m !== null && m.index < bestAt) {
      bestAt = m.index;
      best = i;
    }
  }
  return best;
};

const componentBody = (path) => {
  for (const ext of ['.tsx', '.ts']) {
    const f = join(ROOT, 'components', `${path}${ext}`);
    try {
      return read(f);
    } catch {
      /* next */
    }
  }
  return '';
};

/**
 * ⛔ **THE MAIN ACTION IS READ FROM THE MARKUP, ⛔ NOT NAMED BY A HUMAN.** A label a
 * person types into a register is a label that stops matching the button the day it
 * is renamed — and "three names for one action" is exactly the defect this file
 * exists to surface, so the names have to come from the buttons themselves.
 * ⚠️ Only Hebrew labels count: every string a learner sees is Hebrew (`RULES`), so
 * an English token here is markup, ⛔ not an action.
 */
const HEB = /[֐-׿]/;
/**
 * ⛔ **THE INNER MARKUP IS READ THROUGH, ⛔ not matched as a flat string.** First
 * version required `<button>טקסט</button>` with ⛔ nothing between — and reported
 * «⛔ no tappable action» on twelve of eighteen screens, including `/cards` and
 * `/world`, which are nothing but buttons. Real buttons wrap their label in a
 * `<span>`, an icon and a conditional. ⇒ take everything up to the closing tag,
 * strip the tags and the expressions, and keep the Hebrew that is left.
 */
const ACTION = /<(button|Link|a)\b[^>]*>([\s\S]{0,400}?)<\/\1>/g;
/**
 * ⛔ **AND THE LABEL IS USUALLY A CONSTANT, ⛔ not a literal.** Third correction,
 * measured: `<button>{RETRY_HE}</button>` is the house style — every Hebrew string
 * is hoisted to a `const` at the top of the file, precisely so it can be asserted
 * on. Stripping `{…}` therefore threw away exactly the labels this column exists to
 * collect. ⇒ the constants are resolved first, from the same surface.
 */
const constantsIn = (surface) => {
  const map = new Map();
  for (const m of surface.matchAll(/\b(?:const|let)\s+([A-Z][A-Z0-9_]*)\s*=\s*'([^']{1,60})'/g)) {
    if (HEB.test(m[2])) map.set(m[1], m[2]);
  }
  for (const m of surface.matchAll(/\b([a-zA-Z][\w]*He)\s*:\s*'([^']{1,60})'/g)) {
    if (HEB.test(m[2])) map.set(m[1], m[2]);
  }
  return map;
};
const labelOf = (inner, consts) =>
  inner
    .replace(/\{\s*([A-Za-z_][\w]*)\s*\}/g, (whole, name) => consts.get(name) ?? whole)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/['"`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const actionsIn = (body) => {
  const consts = constantsIn(body);
  return [
    ...new Set(
      [...body.matchAll(ACTION)]
        .map((m) => labelOf(m[2], consts))
        .filter((s) => HEB.test(s) && s.length <= 40),
    ),
  ];
};

/** Where a screen can send the learner. ⛔ Declared hrefs only — ⛔ never guessed. */
const HREF = /href=\{?['"`](\/[\w\-/[\]().]*)['"`]/g;
const PUSH = /router\.(?:push|replace)\(\s*[`'"](\/[\w\-/[\]().]*)/g;
const exitsIn = (body) =>
  [...new Set([...body.matchAll(HREF), ...body.matchAll(PUSH)].map((m) => m[1]))];

/**
 * ⛔ An empty state is a WRITTEN state, ⛔ not an absence. What is measured is that
 * the screen says something when it has nothing — the `.length === 0` branch, or a
 * Hebrew sentence that names the emptiness.
 */
const EMPTY = /\.length\s*===\s*0|length === 0|אין עדיין|עוד אין|ריק|אין מה|טרם/;

const isHarness = (route) => route.startsWith('/dev');

const rows = pages.map((file) => {
  const body = read(file);
  const comp = screenComponent(body);
  const compBody = comp === null ? '' : componentBody(comp.path);
  const surface = `${body}\n${compBody}`;
  return {
    route: routeOf(file),
    file: relative(ROOT, file).replace(/\\/g, '/'),
    component: comp === null ? '—' : `components/${comp.path}`,
    actions: actionsIn(surface),
    exits: exitsIn(surface).filter((h) => h !== routeOf(file)),
    empty: EMPTY.test(surface),
  };
});

/**
 * ⛔ **ENTRANCES ARE SCANNED ACROSS `app/`, `components/` AND `lib/` — ⛔ not `app/`
 * alone, and that widening is a CORRECTION.** Measured on the first run: eleven of
 * eighteen product screens were reported unreachable, `/world` and `/studies`
 * included — screens the learner reaches from the tab bar every session. The nav
 * ring builds its hrefs from a node list in `lib/core/`, so an `app/`-only scan sees
 * ⛔ nothing. ⇒ a checker that cries wolf on eleven of eighteen rows is a checker
 * every agent learns to skip, and that is worse than not having it.
 */
const linkSources = [
  ...files,
  ...['components', 'lib'].flatMap((d) => {
    try {
      return walk(join(ROOT, d));
    } catch {
      return [];
    }
  }),
].filter((f) => /\.(ts|tsx)$/.test(f) && !/\.(test|spec)\.(ts|tsx)$/.test(f));
const allText = linkSources.map(read).join('\n');
const linkLabels = new Map();
const LINK_WITH_LABEL = /<Link\b[^>]*href=\{?['"`](\/[\w\-/]*)['"`][^>]*>\s*\{?\s*'?"?([^<>{}'"]{2,40}?)'?"?\s*\}?\s*<\/Link>/g;
for (const m of allText.matchAll(LINK_WITH_LABEL)) {
  const label = m[2].trim();
  if (!HEB.test(label)) continue;
  const set = linkLabels.get(m[1]) ?? new Set();
  set.add(label);
  linkLabels.set(m[1], set);
}
/**
 * ⛔ **AN ENTRANCE IS A QUOTED ROUTE STRING ANYWHERE IN THE SOURCE, ⛔ NOT AN
 * `href=` ATTRIBUTE.** Second correction, measured: after widening the scan to
 * `components/` and `lib/`, `/world`, `/studies` and `/world/story` were STILL
 * reported unreachable — and they are the tab bar. The reason is that the tab bar
 * declares them as data (`{ id: 'world', href: '/world', labelHe: 'העולם' }`), and
 * a JSX-attribute regex sees ⛔ nothing there. ⇒ the route string itself is the
 * evidence, wherever it is written.
 * ⚠️ **The honest cost of this:** a route named in a comment counts as an entrance.
 * That is the right trade — a FALSE «reachable» costs one flag that was never
 * raised; a false «unreachable» on eleven of eighteen rows costs the whole register
 * its credibility.
 */
const entrances = new Map();
for (const file of linkSources) {
  const body = read(file);
  const from = /(^|[\\/])page\.tsx$/.test(file)
    ? routeOf(file)
    : relative(ROOT, file).replace(/\\/g, '/');
  for (const r of rows) {
    if (r.route === from) continue;
    // ⛔ The root route is excluded from the quoted-string scan: `'/'` appears in
    // path joins, regexes and API routes, so every file would count as an entrance
    // to the home screen. Its own `href="/"` links are already counted below.
    if (r.route === '/' && !/href=\{?['"`]\/['"`]/.test(body)) continue;
    const quoted = new RegExp(`['"\`]${r.route.replace(/\//g, '\\/')}['"\`]`);
    if (!quoted.test(body)) continue;
    const set = entrances.get(r.route) ?? new Set();
    set.add(from);
    entrances.set(r.route, set);
  }
}

const cell = (list, max = 4) => {
  if (list.length === 0) return '⛔ —';
  const shown = list.slice(0, max).map((s) => `\`${s}\``).join(' · ');
  return list.length > max ? `${shown} … +${list.length - max}` : shown;
};

const product = rows.filter((r) => !isHarness(r.route));
const flags = [];
for (const r of product) {
  if (r.actions.length === 0) flags.push(`⚠️ \`${r.route}\` — ⛔ אף פעולה בהקשה ⛔ לא נמדדה במרקאפ`);
}
for (const r of product) {
  const from = [...(entrances.get(r.route) ?? [])];
  if (from.length === 0 && r.route !== '/') {
    flags.push(`⚠️ \`${r.route}\` — ⛔ אף מסך ⛔ אינו מקשר אליו ⇒ ⛔ אינו נגיש בהקשות`);
  }
}
for (const [route, labels] of linkLabels) {
  if (labels.size > 2) {
    flags.push(`🔴 \`${route}\` — **${labels.size} שמות שונים לאותה פעולה:** ${[...labels].map((l) => `«${l}»`).join(' · ')}`);
  }
}
for (const r of product) {
  if (!r.empty) flags.push(`⚠️ \`${r.route}\` — ⛔ אין מצב ריק כתוב`);
}

const table = (list) =>
  list
    .map(
      (r) =>
        `| \`${r.route}\` | ${cell(r.actions, 3)} | ${cell([...(entrances.get(r.route) ?? [])].map((s) => s), 3)} | ${cell(r.exits, 4)} | ${r.empty ? '✅' : '⛔'} | \`${r.component}\` |`,
    )
    .join('\n');

const out = `<!-- ⛔ GENERATED by scripts/build-surfaces.mjs (npm run build:surfaces). ⛔ Do not hand-edit. -->

## 63. אינוונטר משטחים — נגזר מהקוד  ⟦OWNER: generated⟧

> ⛔ **הטבלה הזאת ⛔ אינה נכתבת — היא נגזרת מ-\`app/**/page.tsx\` ומהרכיב שכל מסך מרנדר.**
> ‏שאלה 6 ב-\`plan/45-product-questions.md\` נשאלת מאז 23/08 ו⛔ מעולם לא נאספה לשום מקום.
> ⇒ **מסך בלי שורה כאן = מסך שאינו קיים ב-\`app/\`**, ⛔ ולא מסך שמישהו שכח לתאר.
> ⚠️ **מודד חיווט, ⛔ לא איכות.** מסך יכול לעבור כאן במלואו ולא ללמד דבר.

**${product.length} מסכי מוצר · ${rows.length - product.length} מסכי פיקסצ׳ר (\`/dev/*\`)**
> ⛔ **⛔ אין חותמת תאריך בקובץ הזה, ובכוונה:** תאריך ריצה היה משנה את הפלט בכל יום
> ⇒ דיף בכל טיק ⇒ «הקובץ הזה תמיד משתנה» ⇒ איש ⛔ אינו קורא אותו. הפלט הוא **פונקציה
> של הקוד בלבד**, ולכן דיף כאן פירושו **המשטחים זזו**, ⛔ ולא שהשעון התקדם.

### מסכי המוצר

| מסך | פעולות בהקשה (מהמרקאפ) | מאיפה מגיעים | לאן יוצאים | מצב ריק | הרכיב |
|---|---|---|---|---|---|
${table(product)}

### מסכי הפיקסצ׳ר — \`/dev/*\` (⛔ אינם נספרים בדגלים)

| מסך | פעולות בהקשה (מהמרקאפ) | מאיפה מגיעים | לאן יוצאים | מצב ריק | הרכיב |
|---|---|---|---|---|---|
${table(rows.filter((r) => isHarness(r.route)))}

### דגלים — ${flags.length}

${flags.length === 0 ? '⛔ אין.' : flags.map((f) => `- ${f}`).join('\n')}

> **מה עושים עם דגל:** «⛔ אף פעולה בהקשה ⛔ לא נמדדה» ו«⛔ אינו נגיש בהקשות» הם **משימות** ל-PM.
> «${'🔴'} שמות שונים לאותה פעולה» הוא **ממצא** — הוא בדיוק המחלקה ש-D-144ⓑ הופך לפרוסה
> («שם הפעולה זהה בשלושת המסכים»). «⛔ אין מצב ריק כתוב» הוא הזול מכולם ולרוב אמיתי.
`;

writeFileSync(OUT, out, 'utf8');
console.log(`surfaces: ${product.length} product · ${rows.length - product.length} harness · ${flags.length} flags`);
console.log(`wrote ${relative(ROOT, OUT).replace(/\\/g, '/')}`);
