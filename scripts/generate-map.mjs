#!/usr/bin/env node
/**
 * ⛔ GENERATED. Writes `docs/architecture-map.json` and ⛔ nothing else. ⛔ Never
 * hand-edit the output — fix this script, then rerun `npm run generate-map`.
 *
 * WHY THIS EXISTS (T-235 · Roy's explicit instruction 31/08, top priority).
 * `plan/30-architecture.md` measured 169,551 bytes on 31/08, and every agent that
 * wanted to know "what imports what" paid for reading it. This script derives the
 * same answer from the code itself with `madge`, so it cannot drift the way a
 * hand-written map does.
 *
 * ⚠️ The path is NOT `./src` — measured 31/08 in a live clone: this repo has no
 * `src/` directory. The source lives in `app/`, `components/`, `lib/`.
 *
 * The output is a dependency graph { "<file>": ["<file it imports>", ...] }.
 * If the graph has fewer than 20 modules, something is badly wrong (an empty or
 * near-empty map that never fails is worse than no map at all) — this script
 * exits non-zero in that case instead of writing a silently-broken result.
 */
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MIN_MODULES = Number(process.env.GENERATE_MAP_MIN_MODULES ?? 20);
const ROOT = process.env.GENERATE_MAP_ROOT ?? ".";
const OUT_PATH =
  process.env.GENERATE_MAP_OUT ??
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "docs",
    "architecture-map.json",
  );

function run() {
  const madgeBin = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "node_modules",
    ".bin",
    "madge",
  );

  // ⟦T-335 · 14/09⟧ WITHOUT THIS, THE MAP LIES ABOUT TWO THIRDS OF ITS OWN ROWS.
  // Measured C-0589 and re-measured before this change: the output held 509 entries
  // and **345 of them were `[]` (68%)** — `components/Flashcard.tsx` among them, while
  // the file imports seven modules through `@/`. The rows that did carry edges were the
  // ones importing *relatively*. `madge` resolves TypeScript path aliases only when it
  // is handed the tsconfig that declares them (`paths: { "@/*": ["./*"] }`).
  // Measured with the flag, same tree, same command: 345 empty ⇢ **173**, and
  // `Flashcard.tsx` ⇒ the seven edges it actually has.
  //
  // ⚠️ Conditional on purpose: the fixture trees in `generate-map.test.ts` are temp
  // directories with no tsconfig, and `madge` errors on a `--ts-config` that does not
  // exist. A missing tsconfig means "nothing to resolve", ⛔ not a broken run.
  const tsConfigPath = path.join(ROOT, "tsconfig.json");
  const tsConfigArgs = existsSync(tsConfigPath) ? ["--ts-config", "tsconfig.json"] : [];

  // ⚠️ AND `madge` RUNS *INSIDE* THE TREE, ⛔ NOT BESIDE IT. `paths: { "@/*": ["./*"] }`
  // carries no `baseUrl`, so `./*` resolves against the resolver's working directory.
  // With the parent's cwd that is whatever directory the script was invoked from —
  // correct by accident for the real repo (cwd == ROOT), and ⛔ wrong for any other
  // tree, which is exactly what the fixture measured: the alias edge stayed missing
  // even with the flag. ⇒ cwd is pinned to ROOT and the three roots go in relative.
  let stdout;
  try {
    stdout = execFileSync(
      madgeBin,
      ["--extensions", "ts,tsx", ...tsConfigArgs, "--json", "app", "components", "lib"],
      { encoding: "utf8", maxBuffer: 1024 * 1024 * 64, cwd: ROOT },
    );
  } catch (err) {
    console.error("⛔ generate-map: madge failed to run.");
    console.error(err.stderr || err.message);
    process.exit(1);
  }

  let graph;
  try {
    graph = JSON.parse(stdout);
  } catch (err) {
    console.error("⛔ generate-map: madge did not print valid JSON.");
    console.error(err.message);
    process.exit(1);
  }

  const moduleCount = Object.keys(graph).length;
  if (moduleCount < MIN_MODULES) {
    console.error(
      `⛔ generate-map: only ${moduleCount} modules found (minimum ${MIN_MODULES}). ` +
        "This looks like an empty or broken map (wrong path?) — refusing to write it. " +
        "Measured 31/08: this repo has no src/ directory; the source lives in app/, components/, lib/.",
    );
    process.exit(1);
  }

  writeFileSync(OUT_PATH, JSON.stringify(graph, null, 2) + "\n", "utf8");
  console.log(
    `✅ generate-map: wrote ${OUT_PATH} — ${moduleCount} modules.`,
  );
}

run();
