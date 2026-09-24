/**
 * 🧪 T-302 — the comment stripper the SOURCE GUARDS assert on.
 *
 * A source guard reads a component as text and asserts what is ⛔ not in it
 * (`expect(CODE).not.toContain('ActionBar')`). Stripping comments first is what
 * makes such a guard mean anything — C-0032/C-0071/C-0072: «a guard a comment can
 * satisfy guards nothing».
 *
 * 🔴 **But the expression every copy of it carried deleted CODE, and a negative
 * assertion on a string that lost a third of itself is green for the wrong
 * reason.** Measured on `components/MeScreen.tsx` in this clone: the JSX-comment
 * pattern `/\{\s*\/\*[\s\S]*?\*\/\s*\}/` was written for `{/* … *\/}`, and `\s*`
 * let its `{` match the brace of a destructured props type — `}: {` — whose first
 * token is a JSDoc block. The lazy quantifier then ran to the next `*\/` followed
 * by `}`, swallowing everything between: **13,537 chars ⇒ 5,770**, taking
 * `goal: LearnerGoal`, `apiGet<` and `primaryStudyTrack(` with it.
 *
 * ⇒ the JSX pass is now **anchored on one line**: `[ \t]*` between `{` and `/*`,
 * and between `*\/` and `}`. ⛔ **`\s` is gone on purpose — the newline is the whole
 * defect**, because every misfire measured in this tree opens `{\n  /** …`, i.e. a
 * declaration brace, ⛔ never a JSX comment. Putting `\s*` back reopens it, and
 * `lib/testSource.test.ts` fails on exactly that input.
 *
 * 🔬 **Measured over all 148 `.tsx` files in `app/` + `components/`, ⛔ not argued
 * — three variants, same sweep:**
 * ```
 * {\s*\/*…*\/\s*}   179 JSX comments · 44,601 chars ·  8 MISFIRES   ⇐ what every copy carries
 * {/*…*\/}          184 JSX comments · 45,496 chars ·  0 misfires   ⇐ strict adjacency
 * {[ \t]*\/*…*\/…}   185 JSX comments · 45,531 chars ·  0 misfires   ⇐ this module
 * ```
 * ⚠️ **Why ⛔ not strict adjacency, which is what `T-302` wrote:** `{ /* ⛔ אחסון
 * חסום ⛔ אינו שגיאה *\/ }` is a real JSX comment (`components/ArenaBattle.tsx`), and
 * strict adjacency leaves its Hebrew text **inside** `CODE` — which is the original
 * «a guard a comment can satisfy» defect arriving from the other direction. The
 * newline ban closes the hole the row opened this task for; the horizontal space
 * ⛔ never crosses a declaration. The eight misfires are the number that decides it.
 * The live victims, for `T-284` to inherit: `AmirnetSimulation` 5,063 chars ·
 * `ArenaHome` 6,129 · `ArenaCharacterChoice` 3,052 · `ArenaSummary` 1,946 ·
 * `LevelScan` 1,630 · `AmirnetResult` 661 · `AmirnetSectionBreak` 563.
 *
 * ⚠️ ⛔ NOT `lib/core/**`: that directory is product code the learner's screens
 * run (`RULES` — pure, zero React). This is a test utility, and it lives one level
 * up so nothing in `lib/core/` can import it.
 *
 * ⚠️ T-302 is the CONTENT of the stripper. Folding the 28 local copies into this
 * module is `T-284`, which inherits this expression and this test.
 */

/**
 * A JSX comment, on ⛔ one line's worth of separation: `{`, optional spaces/tabs,
 * `/*` … `*​/`, optional spaces/tabs, `}`. ⛔ No newline — that is the fence.
 *
 * `F-303` — and the body ⛔ may not contain `*​/`. A lazy `[\s\S]*?` still let a
 * `{ /* … *​/` that is ⛔ not followed by `}` run on to a LATER comment that is, and
 * swallow the object between them (2,549 chars of `ArenaAvatar.tsx`, `<svg>` included).
 * Measured over all 182 `.tsx` files in `app/` + `components/` on 24/09: 327 matches
 * before and after, ⛔ zero files stripped differently ⇒ no guard changes meaning.
 */
const JSX_COMMENT = /\{[ \t]*\/\*(?:(?!\*\/)[\s\S])*\*\/[ \t]*\}/g;

/** A block comment, JSDoc included. */
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;

/** A whole-line `//` comment. ⛔ Not a trailing one: `'https://x'` is not a comment. */
const LINE_COMMENT = /^[ \t]*\/\/[^\n]*$/gm;

/**
 * The source with its comments removed and ⛔ nothing else removed.
 *
 * Order matters: the anchored JSX pass takes the braces with the comment, so the
 * block pass that follows ⛔ cannot be left holding an empty `{}` in the markup.
 */
export function withoutComments(source: string): string {
  return source
    .replace(JSX_COMMENT, '')
    .replace(BLOCK_COMMENT, '')
    .replace(LINE_COMMENT, '');
}

/**
 * 🧪 T-341 — a stylesheet's comments, and ⛔ nothing else. CSS has ⛔ no `//` comment and
 * ⛔ no JSX, so the two other passes would be wrong here, ⛔ not merely redundant: a
 * whole-line `//` is not a comment in CSS, and `url(https://…)` must survive.
 */
export function withoutCssComments(source: string): string {
  return source.replace(BLOCK_COMMENT, '');
}

/** 🧪 T-341 — a SQL migration's comments: block and `--`, ⛔ nothing else. */
export function withoutSqlComments(source: string): string {
  return source.replace(BLOCK_COMMENT, '').replace(/--[^\n]*/g, '');
}
