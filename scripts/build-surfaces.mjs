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
 * (`RULES § 0.6ב` says exactly this about `30-architecture.md`). This one is
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
 * ⛔ **DEPTH 1 OF AN IMPORT TREE — ⛔ nothing deeper, and only `@/components/*`
 * + `@/lib/core/*` (T-263 · D-191).** Measured 05/09: a page's markup can sit
 * one layer past the component the page itself imports — `/arcade` hands its
 * markup to `ArenaShell`, and `ArenaShell` hands ITS markup to `ArenaBattle`,
 * which is where the real «start battle» button and the written empty state
 * (`kind: 'too_small'`) actually live. A scan that stops at
 * `screenComponent`/`componentBody` (depth 0) never sees either, and reports
 * «⛔ no action» and «⛔ no empty state» on a screen that has both.
 * ⛔ **NOT recursive, and that is deliberate:** following what a depth-1 file
 * imports in turn is depth 2, and depth 2 is indistinguishable from scanning
 * `components/` wholesale — exactly the cross-screen pollution `T-263` rules
 * out (a screen must not absorb another screen's buttons because they share a
 * distant common import).
 *
 * ⚠️ **`@/components/*` and `@/lib/core/*` are ⛔ NOT folded in the same way,
 * and that split is a CORRECTION found while building this, ⛔ not the
 * original plan.** A `@/components/*` child is real markup — its full body is
 * legitimately part of what renders on the screen, so it is folded in whole
 * (this is what fixes `/arcade`). A `@/lib/core/*` file is a logic/constants
 * module, ⛔ not markup: `/login` and `/signup` (`AuthForm.tsx`) and
 * `/onboarding` (`RegisteredAddress.tsx`) all import `lib/core/auth.ts` for
 * its `AUTH_MESSAGES_HE` constant — and that same file also contains an
 * unrelated password-validation check, `password.length === 0`. Folding the
 * WHOLE file in made the generic `EMPTY` regex (which matches bare
 * `length === 0`) fire on that unrelated line, and **three real «⛔ no empty
 * state» flags silently disappeared** — a false ✅ is worse than the false
 * ⚠️ this task exists to remove. ⇒ a `lib/core` file therefore contributes
 * ONLY its exported `..._HE`/`..He`-style Hebrew string constants (exactly
 * what `constantsIn` below would have extracted from it anyway), ⛔ never its
 * raw prose or logic.
 */
const CHILD_COMPONENT_IMPORT = /from\s+'@\/components\/([\w./-]+)'/g;
const CHILD_LIB_CORE_IMPORT = /from\s+'@\/lib\/core\/([\w./-]+)'/g;
const readComponentFile = (relPath) => {
  for (const ext of ['.tsx', '.ts']) {
    try {
      return read(join(ROOT, 'components', `${relPath}${ext}`));
    } catch {
      /* next */
    }
  }
  return '';
};
const readLibCoreFile = (relPath) => {
  for (const ext of ['.ts', '.tsx']) {
    try {
      return read(join(ROOT, 'lib', 'core', `${relPath}${ext}`));
    } catch {
      /* next */
    }
  }
  return '';
};
/** The full body of every `@/components/*` file a given file imports — depth 1, real markup. */
const childComponentBodiesOf = (fileBody) =>
  [...fileBody.matchAll(CHILD_COMPONENT_IMPORT)].map((m) => readComponentFile(m[1])).filter((s) => s !== '');
/**
 * ⛔ Only the exported Hebrew string constants of every `@/lib/core/*` file a
 * given file imports — depth 1, ⛔ never the file's own logic or prose (see
 * the block comment above for why: a raw fold reintroduces exactly the kind
 * of unrelated match `T-263` exists to remove).
 */
const CONST_EXPORT = /\bexport\s+const\s+([A-Z][A-Z0-9_]*)\s*=\s*'([^']{1,60})'/g;
const childLibConstantsOf = (fileBody) => {
  const lines = [];
  for (const m of fileBody.matchAll(CHILD_LIB_CORE_IMPORT)) {
    const libBody = readLibCoreFile(m[1]);
    for (const c of libBody.matchAll(CONST_EXPORT)) {
      if (HEB.test(c[2])) lines.push(`const ${c[1]} = '${c[2]}';`);
    }
  }
  return lines.join('\n');
};

/**
 * ⛔ **T-265 · D-192/D-193 fallout.** `constantsIn`'s second pattern already trusts
 * a `nameHe: 'Hebrew'` PAIR as a label wherever it sits — `childLibConstantsOf`
 * above just never handed it one, because it only forwards `export const NAME =
 * 'string'` lines. `STUDY_TRACKS` in `lib/core/studyTracks.ts` is an
 * `Object.freeze([{ id: …, labelHe: '…' }, …])` array — the pair is real, ⛔ it is
 * just written inside an array literal instead of at the top level. ⇒ forward the
 * pair itself (⓵ below), not only the top-level-const shape.
 * ⚠️ **⓶ is the one that is NOT already a `…He: '…'` pair.**
 * `RING_LABEL_HE` in `lib/core/worldRing.ts` is `Record<RingNodeId, string>` keyed
 * by NODE ID (`arena: '…'`, `msgs: '…'`) — the key never ends in `He`, so ⓵ cannot
 * see it. It is a Hebrew-label dictionary by the SAME `_HE`-suffix convention
 * `constantsIn`'s first pattern already trusts for a single string constant
 * (`RETRY_HE`, `AUTH_MESSAGES_HE`) — applied here to a dictionary of them instead
 * of one. `WorldRing.tsx:247` (`lib/core/worldRing.ts`) is what actually assigns
 * these values onto each node's `labelHe` field, so every value inside an
 * `_HE`-suffixed export is registered under the synthetic key `labelHe` — the
 * exact property name every call site reads (`track.labelHe`, `node.labelHe`).
 * ⛔ **This is NOT the runtime-data guess `T-263`'s gate test warned off** — both
 * sources are literal Hebrew strings sitting in the imported source file, ⛔ not
 * data fetched at runtime; only the ROUTE from property name to value was the
 * missing piece.
 */
const KEYVAL_HE = /\b[a-zA-Z][\w]*\s*:\s*'([^']{1,60})'/g;
const DICT_HE_EXPORT = /\bexport\s+const\s+[A-Z][A-Z0-9_]*_HE\b[^=\n]*=\s*\{([\s\S]{0,2000}?)\n\};/g;
const childLibLabelsOf = (fileBody) => {
  const lines = [];
  for (const m of fileBody.matchAll(CHILD_LIB_CORE_IMPORT)) {
    const libBody = readLibCoreFile(m[1]);
    // ⓵ a `nameHe: 'Hebrew'` pair anywhere in the file — not only at the top level.
    for (const c of libBody.matchAll(/\b([a-zA-Z][\w]*He)\s*:\s*'([^']{1,60})'/g)) {
      if (HEB.test(c[2])) lines.push(`${c[1]}: '${c[2]}';`);
    }
    // ⓶ every value inside an exported `_HE`-suffixed dictionary, whatever its own
    // key is named — the dictionary's name is the label, not the per-entry key.
    for (const d of libBody.matchAll(DICT_HE_EXPORT)) {
      for (const v of d[1].matchAll(KEYVAL_HE)) {
        if (HEB.test(v[1])) lines.push(`labelHe: '${v[1]}';`);
      }
    }
  }
  return lines.join('\n');
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
 * ⛔ **FOURTH CORRECTION (T-265) — `[^>]*` cannot see PAST an attribute's OWN
 * `>`.** `onClick={() => setActive(track.id)}` puts a bare `>` (from `=>`)
 * INSIDE the opening tag, and a plain `[^>]*` — unable to match `>` at all —
 * stops there instead of at the tag's real close. Measured on
 * `StudiesScreen.tsx`: the captured "inner" then starts mid-attribute, and the
 * real closing tag sits **766 characters** later — past the 400-char bound,
 * so the match fails OUTRIGHT and the button is invisible to this scanner, not
 * merely mislabeled. ⇒ an attribute region is now read as a run of
 * non-`>`-non-`{` characters OR a balanced `{…}` block, so `{() => …}` is
 * skipped as ONE unit and the scan reaches the real `>`.
 * ⚠️ **The block allows ONE level of nesting, ⛔ not zero.**
 * `WorldRing.tsx`'s `aria-label={wasHere ? \`${node.labelHe} · …\` : …}` puts a
 * template literal's `${…}` INSIDE the attribute's own `{…}` — a single-level
 * `\{[^{}]*\}` cannot cross that inner `{`, and reproduces the identical
 * failure one brace deeper. ⛔ **Not a general JSX parser — bounded to depth 2
 * on purpose**, which is what a JSX attribute value actually nests to in this
 * codebase; deeper would start guessing at structure this scanner never reads.
 */
const ACTION = /<(button|Link|a)\b(?:[^>{]|\{(?:[^{}]|\{[^{}]*\})*\})*>([\s\S]{0,400}?)<\/\1>/g;
/**
 * ⛔ **AND THE LABEL IS USUALLY A CONSTANT, ⛔ not a literal.** Third correction,
 * measured: `<button>{RETRY_HE}</button>` is the house style — every Hebrew string
 * is hoisted to a `const` at the top of the file, precisely so it can be asserted
 * on. Stripping `{…}` therefore threw away exactly the labels this column exists to
 * collect. ⇒ the constants are resolved first, from the same surface.
 * ⚠️ **«the same surface» now includes the depth-1 `@/lib/core/*` constant
 * lines folded in by `childLibConstantsOf` above (T-263 · D-191)** —
 * `const NAME_HE = '…'` matches this same regex whether it was written here or
 * synthesized from an imported constants module's exports.
 * ⚠️ **And, since T-265, the `nameHe: '…'`/`labelHe: '…'` lines folded in by
 * `childLibLabelsOf` above** — same pattern, same map.
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
/**
 * ⛔ **T-265 — a bare identifier is ⛔ NOT the only shape a hoisted label takes.**
 * `{track.labelHe}` / `{node.labelHe}` (`StudiesScreen.tsx` · `WorldRing.tsx`) are
 * a PROPERTY READ on a loop variable, ⛔ not a bare `{NAME}` — the prior regex
 * required no dot, so both fell through to the generic `{…}` wipe below and the
 * screen measured as having ⛔ no Hebrew action. ⇒ an optional single-level
 * `ident.` prefix is now allowed, and resolution keys ONLY on the trailing
 * property name (`labelHe`), which is exactly what `childLibLabelsOf` populates
 * the map with. ⛔ **Still never a guess:** an unresolved name still falls through
 * unchanged to the wipe below, precisely as before.
 */
/**
 * ⛔ **T-265 — «above the icon, or below it» is ⛔ NOT a shape `labelOf` could see
 * either.** `WorldRing.tsx`'s ring node renders `{labelAbove ? label : null}` /
 * `{labelAbove ? null : label}` — a **conditional on which SIDE the same label
 * sits**, ⛔ not a different label. The prior regex required the brace to hold
 * NOTHING but a name, so a ternary — even one where the only two possible
 * outcomes are "the label" and "nothing" — fell through to the generic wipe.
 * ⇒ a `{cond ? A : B}` where one of `A`/`B` is `null` and the other is a bare
 * name or `ident.prop` now resolves exactly like a bare name would.
 * ⛔ **Still not a guess:** `null` is a literal, not inferred, and the branch
 * that is not `null` is still looked up in the SAME `consts` map as everywhere
 * else — an unresolved name still falls through unchanged.
 */
const TERNARY_OR_NULL = /\{\s*[\w.]+\s*\?\s*(?:null|([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)?))\s*:\s*(?:null|([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)?))\s*\}/g;
const BARE_OR_MEMBER = /\{\s*(?:[A-Za-z_][\w]*\.)?([A-Za-z_][\w]*)\s*\}/g;
const labelOf = (inner, consts) =>
  inner
    .replace(TERNARY_OR_NULL, (whole, a, b) => {
      const nameOf = (ident) => (ident === undefined ? undefined : ident.split('.').pop());
      return consts.get(nameOf(a)) ?? consts.get(nameOf(b)) ?? whole;
    })
    .replace(BARE_OR_MEMBER, (whole, name) => consts.get(name) ?? whole)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/['"`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * ⛔ **T-265 — the label is sometimes hoisted PAST a constant, to a small JSX
 * snippet.** `WorldRing.tsx` hoists `<span>{node.labelHe}</span>` to
 * `const label = (…)`, then hoists `{labelAbove ? label : null}` (twice) to
 * `const inner = (…)`, and the Link/button renders only `{inner}` — a BARE
 * name whose own value is never a Hebrew string, only markup that eventually
 * contains one. ⇒ every local `const name = ( … );` in the surface is resolved
 * the SAME way a button's own inner content is (`labelOf`, above — ternaries,
 * member reads, already-known constants), and — only if that resolves to real
 * Hebrew — registered under its own name for the NEXT pass. Two passes cover
 * exactly the measured depth here (`label` before `inner`); ⛔ this does not
 * walk arbitrary depth, and an unresolved local stays unresolved, exactly like
 * an unresolved bare name today.
 * ⛔ **Bounded, and bounded on purpose:** `{0,600}` mirrors `ACTION`'s own
 * bound — a local past that size is not "a hoisted label", and this must never
 * become a JSX interpreter.
 */
const LOCAL_JSX_CONST = /\bconst\s+([a-z][\w]*)\s*=\s*\(([\s\S]{0,600}?)\n\s*\);/g;
const withLocalLabels = (surface, consts) => {
  const map = new Map(consts);
  for (let pass = 0; pass < 2; pass++) {
    for (const m of surface.matchAll(LOCAL_JSX_CONST)) {
      const [, name, body] = m;
      if (map.has(name)) continue;
      const resolved = labelOf(body, map);
      if (HEB.test(resolved) && resolved.length <= 60) map.set(name, resolved);
    }
  }
  return map;
};
const actionsIn = (body) => {
  const consts = withLocalLabels(body, constantsIn(body));
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
  /**
   * ⛔ Depth 1 is read off **whichever file is the actual top of this screen's
   * markup** — the page itself when it has no separate component (`/offline`
   * renders its own JSX inline and imports `RETRY_HE` straight from
   * `lib/core/failure`), and the screen component when it exists (`/arcade` →
   * `ArenaShell`). Both are scanned; scanning only one would miss the other
   * shape.
   */
  const topBodies = compBody === '' ? [body] : [compBody];
  const childComponentSurfaces = topBodies.flatMap(childComponentBodiesOf);
  const childLibConstants = topBodies.map(childLibConstantsOf).join('\n');
  const childLibLabels = topBodies.map(childLibLabelsOf).join('\n');
  const surface = [body, compBody, ...childComponentSurfaces, childLibConstants, childLibLabels].join(
    '\n',
  );
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
    /**
     * ⛔ **A DYNAMIC ROUTE IS ⛔ NEVER WRITTEN AS ITS OWN LITERAL, and that is the
     * third correction to this scan — measured C-0522, ⛔ not supposed.** Nothing in
     * the product writes `'/world/messages/[id]'`: the inbox builds the href in the
     * pure layer as `` `/world/messages/${it.id}` `` (`lib/core/messages.ts`), which
     * is the ONLY shape a dynamic entrance can have. ⇒ the literal scan above reported
     * a screen with three live rows linking to it as «⛔ אינו נגיש בהקשות», and the
     * phantom-flag gate (D-191 · T-272) went red on a flag that was ⛔ never real.
     * ⇒ for a route that carries a `[param]` segment, the static prefix followed by a
     * template substitution counts as an entrance too. ⚠️ **Narrow on purpose:** it
     * fires ⛔ only for routes with a bracketed segment, and it still demands the
     * prefix be written out — a route nobody names stays flagged.
     */
    const dynamicEntrance =
      /\[[^/\]]+\]/.test(r.route) &&
      new RegExp(`\`[^\`]*${r.route.replace(/\[[^/\]]+\]/g, '').replace(/\//g, '\\/')}\\$\\{`).test(body);
    if (!quoted.test(body) && !dynamicEntrance) continue;
    const set = entrances.get(r.route) ?? new Set();
    set.add(from);
    entrances.set(r.route, set);
  }
}

/**
 * ⛔ **T-272 · a route can have a real entrance that is ⛔ NOT A TAP.** `/offline`
 * measured 7 flags → `⛔ אינו נגיש בהקשות` for a screen `npm run verify`'s own
 * mobile gate proves reachable in the SAME run («ok offline reload serves a real
 * Hebrew screen»). ⛔ **The gap is not the screen — it is this scanner:**
 * `linkSources` above walks `app/`, `components/`, `lib/` only, and the ⛔ ONLY
 * thing that ever navigates to `/offline` is the **service worker**
 * (`public/sw.js:6` `const OFFLINE_ROUTE = '/offline'`, called from
 * `offlineResponse()` at `:43`, itself called from `:67`/`:70`/`:99`) — a file
 * this scanner ⛔ never reads, because it is not `app/`, `components/` or
 * `lib/`. ⇒ `public/sw.js` is scanned the SAME way `entrances` already scans
 * every other source — a quoted route string anywhere in the file — and a hit
 * is recorded under the synthetic source name `service worker`, ⛔ never the
 * file path, so the register reads "how" the learner gets there, not "which
 * file mentions it". A screen no source EXCEPT the service worker reaches is
 * ⛔ still not a tap-navigable screen ⇒ ⛔ NOT the same class as an entrance from
 * `app/`/`components/`/`lib/`, which is exactly why this stays a separate,
 * narrow scan instead of adding `public/` to `linkSources` wholesale (that
 * would also start counting `manifest.json`, icons, etc. as "sources").
 */
let swBody = '';
try {
  swBody = read(join(ROOT, 'public', 'sw.js'));
} catch {
  swBody = '';
}
if (swBody !== '') {
  for (const r of rows) {
    const quoted = new RegExp(`['"\`]${r.route.replace(/\//g, '\\/')}['"\`]`);
    if (!quoted.test(swBody)) continue;
    const set = entrances.get(r.route) ?? new Set();
    set.add('service worker');
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
