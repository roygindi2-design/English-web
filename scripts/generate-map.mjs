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
import { writeFileSync } from "node:fs";
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

  let stdout;
  try {
    stdout = execFileSync(
      madgeBin,
      [
        "--extensions",
        "ts,tsx",
        "--json",
        path.join(ROOT, "app"),
        path.join(ROOT, "components"),
        path.join(ROOT, "lib"),
      ],
      { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 },
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
