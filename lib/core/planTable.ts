/**
 * PURE. No React, no DOM, no clock, no env, no I/O — the reader of plan/ registers lives
 * here, the file handles live in scripts/.
 *
 * Why a hand-written splitter and ⛔ not `line.split('|')`: measured C-0151 (M3/M4), 8 of
 * 72 task rows and 23 of 59 finding rows do not split into the 8 columns their header
 * declares. `T-042` splits into six and `F-046` into five, which means a read by column
 * position lands on `תיקון מוצע` while believing it read `סטטוס` (M6). The registers
 * already escape a literal pipe as `\|` on 17 lines (M7); this splitter honours that
 * escape, so prose stops inventing columns and the rows that are genuinely malformed
 * become visible instead of blending in.
 */

export const TASK_COLUMNS = 8;
export const FINDING_COLUMNS = 8;

/** `| T-034 | …` or `| F-046 | …` or `| Q-001 | …` — the ID cell of a real register row. */
const ROW_ID = /^\|\s*([TFQ]-\d{3})\s*\|/;

export interface RowShape {
  readonly id: string;
  readonly cells: readonly string[];
  readonly expected: number;
  readonly ok: boolean;
}

/**
 * Every code span boundary on the line, as sorted, non-overlapping `[openStart, closeEnd)`
 * pairs, by the CommonMark rule: a maximal run of N backticks is closed by the next maximal
 * run of exactly N. A run that never finds its match ⛔ does not open a span — it is literal
 * text, and treating it as an opener would swallow the rest of the line and merge columns,
 * turning a well-formed row malformed.
 *
 * Measured C-0219: 3 doubled-backtick runs in 50-tasks.md and 1 in 60-findings.md already
 * carry `\|` inside them, so a splitter that closed on any run length would break rows that
 * are correct today.
 *
 * The scan skips an escape pair in the same order `splitRow` does, so the two parsers never
 * disagree about which index a character sits at. `\|` and `\\` are `splitRow`'s escapes; a
 * backtick after a backslash is content here too, so it ⛔ does not open a run.
 */
export function codeSpans(line: string): ReadonlyArray<readonly [number, number]> {
  const runs: Array<{ start: number; length: number }> = [];
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\') {
      const next = line[i + 1];
      if (next === '|' || next === '\\' || next === '`') i += 1;
      continue;
    }
    if (ch !== '`') continue;
    const start = i;
    while (line[i + 1] === '`') i += 1;
    runs.push({ start, length: i + 1 - start });
  }

  const spans: Array<readonly [number, number]> = [];
  for (let a = 0; a < runs.length; a += 1) {
    const open = runs[a];
    if (open === undefined) continue;
    for (let b = a + 1; b < runs.length; b += 1) {
      const close = runs[b];
      if (close === undefined || close.length !== open.length) continue;
      spans.push([open.start, close.start + close.length] as const);
      a = b;
      break;
    }
  }
  return spans;
}

function insideSpan(spans: ReadonlyArray<readonly [number, number]>, at: number): boolean {
  for (const [start, end] of spans) {
    if (at >= start && at < end) return true;
  }
  return false;
}

export function splitRow(line: string): string[] {
  const spans = codeSpans(line);
  const cells: string[] = [];
  let current = '';
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\') {
      const next = line[i + 1];
      // Only `\|` and `\\` are escapes. Any other backslash is content, so a Windows
      // path or a regex in a cell survives unchanged.
      if (next === '|' || next === '\\') {
        current += next;
        i += 1;
        continue;
      }
      current += ch;
      continue;
    }
    if (ch === '|' && insideSpan(spans, i)) {
      current += ch;
      continue;
    }
    if (ch === '|') {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  // A well-formed row opens and closes with `|`, so the first and last fragments are the
  // empty strings outside the table. Dropped by position, ⛔ not by emptiness: a genuinely
  // empty first cell is a malformed row and must stay countable.
  return cells.slice(1, -1).map((cell) => cell.trim());
}

export function rowShape(line: string, expected: number): RowShape | null {
  const match = ROW_ID.exec(line);
  if (match === null) return null;
  const id = match[1];
  if (id === undefined) return null;
  const cells = splitRow(line);
  return { id, cells, expected, ok: cells.length === expected };
}

export type TaskState =
  | 'done'
  | 'awaiting-review'
  | 'open'
  | 'blocked'
  | 'cancelled'
  | 'unknown';

/** 0-based index of `סטטוס` in each 8-column header. Read only when `shape.ok`. */
export const TASK_STATUS_INDEX = 4;
export const FINDING_STATUS_INDEX = 6;

const STATE_GLYPHS: ReadonlyArray<readonly [string, TaskState]> = [
  ['✅', 'done'],
  ['🟣', 'awaiting-review'],
  ['⬜', 'open'],
  ['🔓', 'open'],
  ['⛔', 'blocked'],
  ['🚫', 'cancelled'],
];

/**
 * The FIRST glyph in the cell decides. Measured: `T-050` opens `✅` and then carries a `⛔`
 * caveat about what it did not cover, while `T-066` opens `⛔` and cites the reason. Both
 * cells contain both glyphs; a "contains ⛔ ⇒ blocked" rule marks a finished task blocked,
 * and a "contains ✅ ⇒ done" rule marks a blocked task finished. Only the order separates
 * them, because the register states its verdict before its caveats.
 */
export function classifyStatus(cell: string): TaskState {
  let best: TaskState = 'unknown';
  let bestAt = Number.POSITIVE_INFINITY;
  for (const [glyph, state] of STATE_GLYPHS) {
    const at = cell.indexOf(glyph);
    if (at !== -1 && at < bestAt) {
      bestAt = at;
      best = state;
    }
  }
  return best;
}

const FINDING_REF = /\bF-\d{3}\b/g;

export function citedFindings(cell: string): string[] {
  // A Set, because a cell is allowed to argue its case twice and a duplicate citation
  // would otherwise become a duplicate stale-block report.
  return [...new Set(cell.match(FINDING_REF) ?? [])];
}

const TASK_REF = /\bT-\d{3}\b/g;

/**
 * The declared-blocker marker. ⛔ Everything before it is prose and is ⛔ not read.
 *
 * Measured C-0158, on this function's own first draft: reading the whole cell reported
 * `T-035 waits on T-038 (done)` — but `T-035` names `T-038`/`T-039` as the *evidence* that
 * half its scope is already delivered, ⛔ not as what it waits for. A citation in prose
 * cannot be told apart from a dependency, so the dependency is declared instead of guessed.
 */
export const BLOCKER_MARKER = 'חסם:';

/**
 * Task IDs a ⛔ cell declares as its blockers, minus the row's own ID. A cell with no
 * marker declares no task blocker — those rows name a human or the PM as the owner, and
 * `eligibleTaskIds` already keeps every ⛔ row out of the queue either way.
 *
 * The self-exclusion is not cosmetic: `T-043`'s prose lists the five rows it releases, so a
 * self-citation would turn that row into its own blocker the moment it is marked ✅.
 */
export function citedTasks(cell: string, selfId: string): string[] {
  const at = cell.indexOf(BLOCKER_MARKER);
  if (at === -1) return [];
  const declared = cell.slice(at + BLOCKER_MARKER.length);
  return [...new Set(declared.match(TASK_REF) ?? [])].filter((id) => id !== selfId);
}

export interface StaleBlock {
  readonly taskId: string;
  readonly findingId: string;
  readonly findingState: TaskState;
}

export interface StaleTaskBlock {
  readonly taskId: string;
  readonly blockerId: string;
  readonly blockerState: TaskState;
}

/**
 * F-050's rule, mechanised: a ⛔ cell that cites a finding the findings register calls
 * closed is a blocker that has already lifted. ⛔ Silent on a citation we cannot resolve —
 * an unknown ID means the registers disagree about which findings exist, which is a
 * different defect and is reported separately by the CLI.
 */
export function staleBlocks(
  tasks: readonly RowShape[],
  findingStates: ReadonlyMap<string, TaskState>,
): StaleBlock[] {
  const out: StaleBlock[] = [];
  for (const row of tasks) {
    if (!row.ok) continue;
    const cell = row.cells[TASK_STATUS_INDEX];
    if (cell === undefined || classifyStatus(cell) !== 'blocked') continue;
    for (const findingId of citedFindings(cell)) {
      const state = findingStates.get(findingId);
      if (state === 'done') out.push({ taskId: row.id, findingId, findingState: state });
    }
  }
  return out;
}

/**
 * The same rule as `staleBlocks`, aimed at the other kind of blocker a ⛔ cell can name:
 * another task. Measured C-0158 — eight ⬜ rows advertised themselves as Dev-eligible while
 * every one of them waited on `T-043` (source files, a human action) or on a missing PM
 * spec, and five consecutive cycles reported the same phantom queue. Writing the blocker
 * into the cell fixes today's lie; this function is what stops it from becoming tomorrow's,
 * because a blocker that has been delivered stops being invisible the moment it flips.
 *
 * `done` and `cancelled` are the two states that lift a block. `awaiting-review` does ⛔ not:
 * a task in the Critic's queue has not shipped yet.
 */
export function staleTaskBlocks(tasks: readonly RowShape[]): StaleTaskBlock[] {
  const states = new Map<string, TaskState>();
  for (const row of tasks) {
    if (!row.ok) continue;
    const cell = row.cells[TASK_STATUS_INDEX];
    if (cell !== undefined) states.set(row.id, classifyStatus(cell));
  }

  const out: StaleTaskBlock[] = [];
  for (const row of tasks) {
    if (!row.ok) continue;
    const cell = row.cells[TASK_STATUS_INDEX];
    if (cell === undefined || classifyStatus(cell) !== 'blocked') continue;
    for (const blockerId of citedTasks(cell, row.id)) {
      const blockerState = states.get(blockerId);
      if (blockerState === 'done' || blockerState === 'cancelled') {
        out.push({ taskId: row.id, blockerId, blockerState });
      }
    }
  }
  return out;
}

export function eligibleTaskIds(tasks: readonly RowShape[]): string[] {
  return tasks
    .filter((row) => {
      if (!row.ok) return false;
      const cell = row.cells[TASK_STATUS_INDEX];
      return cell !== undefined && classifyStatus(cell) === 'open';
    })
    .map((row) => row.id);
}

/**
 * ⚠️ T-184. The registers are 667KB and every agent read both of them, whole, every tick —
 * ~200k tokens of reading before a single line of work. This is the compaction rule behind
 * `docs/plan-open.md`: one short, safe excerpt per cell.
 *
 * Three things it must not break, all of them measured on the real registers:
 *  ⓐ `splitRow` UNESCAPES `\|`, so a cell handed back here can carry a raw pipe. Re-emitting
 *    it into a markdown table would invent a column, so the pipe is escaped again.
 *  ⓑ Cutting mid-code-span leaves an unmatched backtick that swallows the rest of the table
 *    row when rendered. An odd backtick count is closed rather than left open.
 *  ⓒ Cutting by `String.prototype.slice` can split a surrogate pair — the registers are full
 *    of emoji status glyphs — so the cut is by code point.
 */
export function excerpt(cell: string, limit: number): string {
  const flat = cell.replace(/\s+/g, ' ').trim();
  const points = [...flat];
  let out = points.length <= limit ? flat : `${points.slice(0, limit).join('')}…`;
  const backticks = (out.match(/`/g) ?? []).length;
  if (backticks % 2 === 1) out += '`';
  return out.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

/* ─────────────────────────────────────────────────────────────────────────────
 * TWO CLASSIFICATION AXES (Roy, 24/08) — so "am I progressing everywhere, or
 * stuck on one thing?" becomes a MEASUREMENT instead of a feeling.
 *
 * ⚠️ Why two axes and ⛔ not one list of five categories, measured on the real
 * register: a category set like «apps · tabs · content · comfort · transitions»
 * is NOT disjoint. `T-186` (the story screen) is an app AND a tab AND content
 * AND comfort AND a transition, all at once. A category that lands on 80% of
 * rows makes the balance table lie. So:
 *
 *   AXIS 1 — WORKSTREAM: WHERE in the product. Already authoritative: these are
 *   `36 § 13`'s build order, already counted by `WORKSTREAM_TICKS`. Disjoint by
 *   construction — a row belongs to one screen family. `loop` is the sixth,
 *   for work on the loop's own machinery, which no `36 § 13` item covers.
 *
 *   AXIS 2 — KIND: WHAT KIND of work. Orthogonal to axis 1, so it never fights
 *   it. This is where «comfort» and «transitions» live honestly — as a property
 *   of the work, ⛔ not as a place in the product.
 *
 * ⛔ Both vocabularies are CLOSED and a test fails on an unknown token. An open
 * vocabulary drifts into synonyms («ux», «UX», «חוויה») and the balance table
 * silently splits one column into three.
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * `36 § 13` build order + `39 § 9`, in the order the anchor spec builds them,
 * then the two that sit OUTSIDE that sequence and must not be flagged against it:
 * ⚠️ `cards` was added 26/08 (D-122, F-139). It is the failure this list exists to
 * make impossible: the spec named a workstream and the code did not know the word,
 * so five rows read as «unknown tag» and check 11 could not measure them. ⇒ a new
 * item in `36 § 13` must land HERE in the same commit, never a commit later.
 *   `loop` — the loop's own machinery: registers, scripts, RULES, the brakes.
 *   `base` — the foundation built BEFORE the video spec existed: auth, onboarding,
 *            the PWA shell, the data sources, the lexicon. Measured 24/08: 116 of
 *            200 rows are these, and 61 of them are already ✅. Leaving them in an
 *            «unclassified» bucket would have made that bucket the biggest column
 *            in the balance table and drowned the signal it exists to give.
 */
export const WORKSTREAMS = [
  'story',
  'nav',
  'cards',
  'arena',
  'studies',
  'msgs',
  'loop',
  'base',
  'general',
] as const;

/**
 * ⛔ **THE THREE THAT SIT OUTSIDE `36 § 13`, ⛔ AND THE REASON THE THIRD EXISTS.**
 * `loop` and `base` are ⛔ not items in the anchor spec's build sequence, so they have
 * ⛔ no position in it to violate — and that is exactly what made them **unreachable**.
 * ‏DEV filters every row to `ACTIVE_WORKSTREAM`, and `ACTIVE_WORKSTREAM` has only ever
 * held a **feature** workstream ⇒ measured 31/08 on a live clone: **10 open `loop` rows
 * + 15 open `base` rows + 3 untagged = 28 rows that ⛔ no DEV tick could ever pick.**
 * That is the same failure class as `D-122 § ב` (five `cards` rows tagged `base`, out of
 * reach forever) and as the `ACTIVE_TASK_ID` filter defect of `D-171` — the third time.
 *
 * ⇒ `general` is the **cross-cutting focus** Roy asked for on 31/08 (`D-174`). When
 * `ACTIVE_WORKSTREAM` is `general`, the eligible set is `general` ∪ `loop` ∪ `base`.
 * ⛔ It is ⛔ not a second active workstream and ⛔ not a place for feature work: a row
 * that belongs to a feature workstream ⛔ does not get retagged `general` to jump a queue.
 */
export const CROSS_CUTTING: ReadonlySet<string> = new Set(['general', 'loop', 'base']);
export type Workstream = (typeof WORKSTREAMS)[number];

/** Roy's vocabulary, made disjoint. `נוחות` absorbs UX/visual/accessibility. */
export const WORK_KINDS = ['מבנה', 'תוכן', 'נוחות', 'מעברים', 'תשתית'] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

/**
 * ⛔ **הסימון השלישי בתא — ו⛔ אינו חובה.** שתי השכבות של `plan/35-design-constitution.md`
 * (‏D-102): **`שכבה א׳` קפואה** — ניגודיות · 44px · `prefers-reduced-motion` · צבע לעולם
 * לא הערוץ היחיד; **`שכבה ב׳` חיה** — כהה-קודם · סולם הרדיוסים · תקציב הזוהר · מוטיון.
 *
 * ⚠️ **⛔ אין לו ברירת מחדל, ורוב השורות ⛔ אינן נושאות אותו — שורה בלי סימון שכבה
 * ⛔ אינה שגיאה ו⛔ אינה `unknown`.** הוא נכתב **רק** על שורה שהעבודה בה היא הגימור
 * הוויזואלי או התנועה עצמם, והוא מה שפותח — או חוסם — את סקילי האנימציה
 * ב-`docs/agents/DEV.md STEP 4` (‏**D-148**).
 *
 * 🔴 **‏`שכבה א׳` הוא סימן עצירה, ⛔ ולא היתר.** שכבה א׳ קפואה: שינוי בה הוא
 * `NEXT_AGENT=HUMAN` בלבד (‏`RULES` · D-102), ו⛔ אין סקיל שמרשה אותו.
 * 🔴 **ומי כותב אותו: PM או רוי, ⛔ לעולם לא DEV.** סוכן שמסמן שורה בעצמו ואז קורא
 * את הסקיל שהסימון פותח ⛔ אינו עובר שער — הוא כותב לעצמו רשות. זו כל הסיבה
 * שהסימון יושב ב-`50-tasks.md`, שהוא קלט של DEV, ⛔ ולא בדוח שלו.
 */
export const LAYERS = ['שכבה א׳', 'שכבה ב׳'] as const;
export type Layer = (typeof LAYERS)[number];

const WORKSTREAM_SET: ReadonlySet<string> = new Set(WORKSTREAMS);
const KIND_SET: ReadonlySet<string> = new Set(WORK_KINDS);
const LAYER_SET: ReadonlySet<string> = new Set(LAYERS);

/** 0-based index of `אבן דרך`, the cell that carries both tags. */
export const TASK_MILESTONE_INDEX = 1;

const MILESTONE = /^M[0-6]$/;

export interface Classification {
  readonly milestone: string | null;
  readonly workstream: Workstream | null;
  readonly kind: WorkKind | null;
  /** ⛔ Optional by design — `null` on almost every row, and that is ⛔ not a defect. */
  readonly layer: Layer | null;
  /** Tokens that are neither a milestone nor a known tag. ⛔ Never silently dropped. */
  readonly unknown: readonly string[];
}

/**
 * Reads `M2 · story · נוחות` out of the `אבן דרך` cell.
 *
 * ⚠️ The tags live INSIDE an existing cell rather than in two new columns, and
 * that is deliberate: `TASK_COLUMNS` is 8, every malformed-row assertion counts
 * against it, and widening the header would mean rewriting 200 rows in one
 * commit to keep the ratchet at zero. The `חסם:` marker already proved a
 * declared field inside a cell works; this is the same move on a cell that is
 * 220 bytes across every open row, so it costs nothing to read.
 *
 * Order is ⛔ not enforced — the vocabularies are disjoint, so `story · M2`
 * reads identically. What IS enforced is that every token is recognised, which
 * is what `unknown` reports and what the register test fails on.
 *
 * ⚠️ **30/08 · D-148 — a THIRD vocabulary joined, and it is the only optional one.**
 * `שכבה א׳`/`שכבה ב׳` marks the design layer the row's work sits in. Milestone,
 * workstream and kind are expected on an open row; the layer is ⛔ not, and a row
 * without it is ⛔ not a bad tag. It exists so a skill that is safe on the arena's
 * visual layer cannot be reached from a row that is ⛔ not that.
 */
export function classify(cell: string): Classification {
  let milestone: string | null = null;
  let workstream: Workstream | null = null;
  let kind: WorkKind | null = null;
  let layer: Layer | null = null;
  const unknown: string[] = [];

  for (const raw of cell.split('·')) {
    const token = raw.trim();
    if (token === '' || token === '—') continue;
    if (MILESTONE.test(token)) {
      // A second milestone is a contradiction, not a tag — report it.
      if (milestone === null) milestone = token;
      else unknown.push(token);
      continue;
    }
    if (WORKSTREAM_SET.has(token)) {
      if (workstream === null) workstream = token as Workstream;
      else unknown.push(token);
      continue;
    }
    if (KIND_SET.has(token)) {
      if (kind === null) kind = token as WorkKind;
      else unknown.push(token);
      continue;
    }
    if (LAYER_SET.has(token)) {
      // Two layers on one row is a contradiction, ⛔ not a tag — report it.
      if (layer === null) layer = token as Layer;
      else unknown.push(token);
      continue;
    }
    unknown.push(token);
  }
  return { milestone, workstream, kind, layer, unknown };
}

/**
 * The lineage marker. `המשך של: T-183` declares that this row continues that
 * one, which is what turns a flat queue into the tree the PM can actually read.
 *
 * ⛔ Declared, ⛔ never inferred — for exactly the reason `citedTasks` is
 * declared: a task's prose names other tasks as evidence, as context, as things
 * it supersedes. Guessing a parent from a citation would build a tree out of
 * footnotes. Self-citation is dropped so a row can never be its own parent.
 */
export const CONTINUATION_MARKER = 'המשך של:';

export function continuationOf(cell: string, selfId: string): string | null {
  const at = cell.indexOf(CONTINUATION_MARKER);
  if (at === -1) return null;
  const declared = cell.slice(at + CONTINUATION_MARKER.length);
  const match = /\bT-\d{3}\b/.exec(declared);
  if (match === null) return null;
  return match[0] === selfId ? null : match[0];
}
