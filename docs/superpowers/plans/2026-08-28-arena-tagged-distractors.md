# Tagged Hebrew Distractors in the Arena — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the three wrong answers in an arena round *semantically chosen* instead of
*random same-level Hebrew* — two words close in meaning plus one that is the meaning of a
look-alike English word — so a learner who knows the topic but not the word can no longer
answer correctly.

**Architecture:** `sense_distractors` already carries a tagged **English** distractor per row
(`relation_type`). A tagged **Hebrew** distractor is therefore not new content — it is a
**join**: `sense_distractors.distractor → words.headword → senses.translation_he` (D-138 § א׳).
The route resolves that join and hands the pure layer a **new, separate, explicit** field
`taggedHe`; a new pure module picks the D-023 mix out of it and falls back, per option slot,
to the T-152 mechanism that is live today. ⛔ No migration, ⛔ no new column, ⛔ no new content,
⛔ no change to the API response shape.

**Tech Stack:** TypeScript (no `any`) · Next 16 route handlers · Supabase JS (PostgREST) ·
Vitest.

**Spec:** `plan/40-decisions.md` D-138 (§ א׳ · § ב׳ · § ג׳ · § ד׳) · D-023 · D-087 ·
`plan/50-tasks.md` row `T-153` · `docs/content-distractors-brief.md`

**Tasks covered:** `T-153` (whole row, three tasks).
⚠️ **Why one row and not the 2–4 that `STEP 4.5` asks for, stated and ⛔ not hidden:**
`ACTIVE_WORKSTREAM` is `arena`, and `docs/plan-open.md` shows exactly **one** ⬜ row in it —
`T-153`. Its only natural neighbour, `T-218`, is ⛔ blocked *until T-153 lands* and needs the
chosen option's relation to travel all the way to `BattleCast`, which is a different owner
(`lib/core/battle.ts` + the battle screen). Pulling it in here would have been scope this plan
cannot test. It gets its own plan once this one is green.

## Global Constraints

- `/lib/core/` is **PURE**: zero React, `window`, `document`, `localStorage`, `fetch`,
  `process.env`, `Date.now`, `Math.random`. Randomness arrives as `rnd: () => number`.
- ⛔ **Zero invented learning content** (R-010 · R-014). A Hebrew distractor is the
  `translation_he` of **another word already in the bank**, ⛔ never a new string.
- ⛔ **`near_synonym` is never offered** (D-023: Ludewig 2023 measured that near-synonyms
  *hurt* discrimination). `collocational` and `unrelated` are also not used as tagged picks —
  an unrelated word is exactly what the T-152 filler already supplies.
- ⛔ **No English ever reaches the learner** outside `<EnWord>`/`<EnText>`. `options` stay
  Hebrew-only; `arcadeRound.test.ts` already asserts this and must stay green.
- ⛔ **The route stays read-only** (D-044): no `.insert(` · `.update(` · `.upsert(` · `.delete(`,
  and the only tables it reads remain `arcade_progress` and `words`
  (`app/api/arcade/round/route.test.ts` asserts the exact set).
- ⛔ **The name never lies** (the lesson `ArcadeCandidate.distractorsEn` was renamed for):
  the resolved Hebrew value travels in `taggedHe` and ⛔ **never** through `distractorsEn`,
  so the source-scan guard in `arcadeRound.test.ts` stays green **untouched** (D-138 § ב׳).
- ⛔ **No migration and no `.sql` file** — D-138 § א׳ cancelled `T-153` ⓐ and ⓖ with it. If a
  step here makes you reach for `supabase`, you have left the plan.
- A round is `ARCADE_OPTION_COUNT` = 4 options = **1 answer + 3 wrong**. The mix is therefore
  **2 semantic + 1 orthographic** (D-138 § ג׳, word for word: «שתיים מהשלוש קרובות במשמעות
  ואחת היא המשמעות של מילה אנגלית דומת־צורה»).
- Every option list stays **de-duplicated** and ⛔ never contains the answer.

## The numbers this plan buys, measured on `work/current` in this tick

Measured over all `data/generated/batch-*.jsonl` (**787** sense rows · **651** distinct
headwords · **3,148** tagged distractor mentions · **1,070** distinct distractor words),
resolving each distractor to a headword that already has a `translation_he`:

| what | how many |
|---|---|
| senses with the **full** mix (≥2 semantic + ≥1 orthographic resolvable) | **216 / 787 = 27.4%** |
| — A1 | **97 / 267 = 36.3%** · A2 46/166 · B1 47/209 · B2 26/145 |
| senses with **at least one** tagged option resolvable | **704 / 787 = 89.5%** |

⚠️ **89.5% is the number that decides the design.** An all-or-nothing rule («full mix, or fall
back entirely») would change 27.4% of rounds. Filling **per slot** changes **89.5%** of them on
the first day, ⛔ with no new content. That is why `pickWrongOptions` fills slot by slot.
⚠️ D-138 measured **127/737 = 17.2%** on 24 hours' older data; the number moved because
`batch-2026-08-28` (K-004's first batch) landed since. ⛔ Not a contradiction — re-measured, and
the command that reproduces it is in Task 1 Step 1.

## File Structure

| file | responsibility |
|---|---|
| **Create** `lib/core/arcadeDistractors.ts` | PURE. The D-023 mix: types `DistractorRelation` · `TaggedHeDistractor`, and `pickWrongOptions()`. ⛔ Nothing else. It lives in its own file so that the source-scan guard on `buildRound` keeps meaning what it says. |
| **Create** `lib/core/arcadeDistractors.test.ts` | Unit tests for the mix, the per-slot fill, the exclusions and determinism. |
| **Modify** `lib/core/arcadeRound.ts` | `ArcadeCandidate.taggedHe` added; the per-question wrong-option loop delegates to `pickWrongOptions`. |
| **Modify** `lib/core/arcadeRound.test.ts` | Fixture grows `taggedHe`; new tests prove the mix reaches `options` and the fallback still produces a full round. |
| **Modify** `app/api/arcade/round/route.ts` | `relation_type` joins the select; a second **read-only** `words` query resolves distractor headwords to Hebrew; `taggedHe` is built. |
| **Modify** `app/api/arcade/round/route.test.ts` | Source-scan assertions for the resolve query, the cap, and the read-only/table-set invariants. |
| **Modify** `docs/api-contract.md` | The `GET /api/arcade/round` section says what the three wrong options now are — **in the same commit as the route** (`STEP 5`). |

## Interfaces

Produced by Task 1, consumed by Tasks 2 and 3 — exact signatures:

```ts
// lib/core/arcadeDistractors.ts
export type DistractorRelation =
  | 'semantic' | 'orthographic' | 'collocational' | 'unrelated' | 'near_synonym';

export interface TaggedHeDistractor {
  /** התרגום העברי של מילת המסיח האנגלית — ⛔ תמיד ערך שכבר במאגר. */
  readonly he: string;
  readonly relation: DistractorRelation;
}

export const SEMANTIC_SLOTS = 2;
export const ORTHOGRAPHIC_SLOTS = 1;

export function pickWrongOptions(input: {
  readonly answer: string;
  readonly tagged: readonly TaggedHeDistractor[];
  readonly levelTranslations: readonly string[];
  readonly count: number;
  readonly rnd: () => number;
}): string[];
```

```ts
// lib/core/arcadeRound.ts — added field, nothing removed
export interface ArcadeCandidate {
  // …existing fields unchanged, distractorsEn included…
  readonly taggedHe: readonly TaggedHeDistractor[];
}
```

```ts
// app/api/arcade/round/route.ts — internal, not exported
const RESOLVE_SELECT = 'headword, senses(translation_he, translation_confidence)';
const MAX_RESOLVE_HEADWORDS = 600;
const RESOLVE_CHUNK = 150;
```

---

### Task 1: The D-023 mix, as a pure module

**Files:**
- Create: `lib/core/arcadeDistractors.ts`
- Test: `lib/core/arcadeDistractors.test.ts`

**Interfaces:**
- Consumes: nothing. This task has no dependency on the others.
- Produces: `DistractorRelation`, `TaggedHeDistractor`, `SEMANTIC_SLOTS`, `ORTHOGRAPHIC_SLOTS`,
  `pickWrongOptions` — exactly as written in the `## Interfaces` block above.

- [x] **Step 1: Re-measure, so the plan's numbers are yours and not inherited**

```bash
cat data/generated/batch-*.jsonl | python3 -c "
import sys,json
heads={}; rows=[]
for l in sys.stdin:
    l=l.strip()
    if l: o=json.loads(l); rows.append(o); heads.setdefault(o['headword'], o.get('translation_he'))
full=part=0
for o in rows:
    sem=[d for d in o.get('distractors',[]) if d['relation_type']=='semantic' and heads.get(d['word'])]
    orth=[d for d in o.get('distractors',[]) if d['relation_type']=='orthographic' and heads.get(d['word'])]
    if sem or orth: part+=1
    if len(sem)>=2 and len(orth)>=1: full+=1
print('full mix', full, '/', len(rows), '· at least one', part, '/', len(rows))
"
```
Expected on `work/current` at the time of writing: `full mix 216 / 787 · at least one 704 / 787`.
A materially different pair is ⛔ not a reason to stop — it is a line in your tick summary.

- [x] **Step 2: Write the failing test**

Create `lib/core/arcadeDistractors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mulberry32 } from './shuffle';
import {
  ORTHOGRAPHIC_SLOTS,
  SEMANTIC_SLOTS,
  pickWrongOptions,
  type TaggedHeDistractor,
} from './arcadeDistractors';

const FILLER = ['מילוי-1', 'מילוי-2', 'מילוי-3', 'מילוי-4', 'מילוי-5', 'מילוי-6'];

function tag(he: string, relation: TaggedHeDistractor['relation']): TaggedHeDistractor {
  return { he, relation };
}

const FULL_MIX: TaggedHeDistractor[] = [
  tag('סמנטי-א', 'semantic'),
  tag('סמנטי-ב', 'semantic'),
  tag('סמנטי-ג', 'semantic'),
  tag('צורני-א', 'orthographic'),
  tag('לא-קשור', 'unrelated'),
  tag('נרדף', 'near_synonym'),
];

describe('D-023 — התמהיל, ⛔ ולא הגרלה מהרמה', () => {
  it('תמהיל מלא ⇒ שתי אפשרויות סמנטיות ואחת צורנית, ⛔ ואפס מילוי', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: FULL_MIX, levelTranslations: FILLER,
      count: 3, rnd: mulberry32(11),
    });
    expect(out).toHaveLength(3);
    const semantic = out.filter((o) => o.startsWith('סמנטי'));
    const ortho = out.filter((o) => o.startsWith('צורני'));
    expect(semantic).toHaveLength(SEMANTIC_SLOTS);
    expect(ortho).toHaveLength(ORTHOGRAPHIC_SLOTS);
    expect(out.some((o) => o.startsWith('מילוי'))).toBe(false);
  });

  it('⛔ `near_synonym` ⛔ לעולם אינו מוגש — D-023 מדד שהוא פוגע ביכולת ההבחנה', () => {
    const onlyNear = [tag('נרדף-א', 'near_synonym'), tag('נרדף-ב', 'near_synonym')];
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: onlyNear, levelTranslations: FILLER,
      count: 3, rnd: mulberry32(3),
    });
    expect(out.some((o) => o.startsWith('נרדף'))).toBe(false);
    expect(out).toHaveLength(3);
  });

  it('⛔ `unrelated` ו-`collocational` ⛔ אינם נבחרים כמתויגים — המילוי כבר לא-קשור', () => {
    const out = pickWrongOptions({
      answer: 'התשובה',
      tagged: [tag('לא-קשור', 'unrelated'), tag('צירוף', 'collocational')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(4),
    });
    expect(out.every((o) => o.startsWith('מילוי'))).toBe(true);
  });

  it('תמהיל חלקי ⇒ המילוי משלים **לפי משבצת** ⛔ ולא מבטל את המתויג (89.5% מהמשמעויות)', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [tag('סמנטי-א', 'semantic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(7),
    });
    expect(out).toContain('סמנטי-א');
    expect(out.filter((o) => o.startsWith('מילוי'))).toHaveLength(2);
  });

  it('⛔ המסיח לעולם אינו זהה לתשובה, גם כשהוא מתויג', () => {
    const out = pickWrongOptions({
      answer: 'סמנטי-א',
      tagged: [tag('סמנטי-א', 'semantic'), tag('סמנטי-ב', 'semantic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(9),
    });
    expect(out).not.toContain('סמנטי-א');
    expect(out).toHaveLength(3);
  });

  it('⛔ אפס כפילות — מתויג שחוזר גם במילוי נספר פעם אחת', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [tag('מילוי-1', 'semantic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(13),
    });
    expect(new Set(out).size).toBe(3);
  });

  it('⛔ ריק ורווח לבן ⛔ אינם אפשרות', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [tag('  ', 'semantic'), tag('', 'orthographic')],
      levelTranslations: FILLER, count: 3, rnd: mulberry32(17),
    });
    expect(out.every((o) => o.trim().length > 0)).toBe(true);
  });

  it('אין מספיק חומר ⇒ מוחזר פחות מ-count, ⛔ ואין המצאה', () => {
    const out = pickWrongOptions({
      answer: 'התשובה', tagged: [], levelTranslations: ['רק-אחד'],
      count: 3, rnd: mulberry32(19),
    });
    expect(out).toEqual(['רק-אחד']);
  });

  it('אותו seed ⇒ אותה תוצאה בדיוק — ⛔ אין `Math.random` בקובץ', () => {
    const a = pickWrongOptions({ answer: 'התשובה', tagged: FULL_MIX,
      levelTranslations: FILLER, count: 3, rnd: mulberry32(23) });
    const b = pickWrongOptions({ answer: 'התשובה', tagged: FULL_MIX,
      levelTranslations: FILLER, count: 3, rnd: mulberry32(23) });
    expect(a).toEqual(b);
  });
});
```

- [x] **Step 3: Run it and confirm it is red for the right reason**

Run: `npx vitest run lib/core/arcadeDistractors.test.ts`
Expected: FAIL — `Failed to resolve import "./arcadeDistractors"`. ⛔ A failure with any other
message means the test file itself is wrong; fix that before writing implementation.

- [x] **Step 4: Write the minimal implementation**

Create `lib/core/arcadeDistractors.ts`:

```ts
/**
 * D-023 · D-138 § ג׳ — **התמהיל של שלוש התשובות השגויות.** טהור: ⛔ אפס React, DOM, רשת,
 * env ו-`Math.random` — ההגרלה מגיעה כ-`rnd`.
 *
 * ⚠️ הקובץ נפרד מ-`arcadeRound.ts` בכוונה: שומר-המקור שם סורק את גוף `buildRound` ונופל
 * **בשם** אם מסיח אנגלי יחזור לאפשרויות. הפרדה שומרת על המשמעות של אותה סריקה.
 *
 * ⛔ **המילוי ⛔ אינו נסיגה — הוא משבצת.** נמדד על `data/generated/batch-*.jsonl`:
 * תמהיל מלא קיים ב-216/787 מהמשמעויות, אך **704/787 = 89.5%** מהן נושאות לפחות מסיח
 * מתויג אחד. מילוי לפי משבצת מזיז 89.5% מהסבבים ביום הראשון, ⛔ בלי מילה חדשה אחת.
 */
import { shuffle } from './shuffle';

export type DistractorRelation =
  | 'semantic' | 'orthographic' | 'collocational' | 'unrelated' | 'near_synonym';

export interface TaggedHeDistractor {
  /** התרגום העברי של מילת המסיח האנגלית — ⛔ תמיד ערך שכבר במאגר, ⛔ ולא מחרוזת חדשה. */
  readonly he: string;
  readonly relation: DistractorRelation;
}

/** `D-138 § ג׳`: «שתיים מהשלוש קרובות במשמעות ואחת היא המשמעות של מילה אנגלית דומת־צורה». */
export const SEMANTIC_SLOTS = 2;
export const ORTHOGRAPHIC_SLOTS = 1;

/**
 * ⛔ `near_synonym` פוגע ביכולת ההבחנה (D-023 · Ludewig 2023) ⇒ ⛔ אינו מוגש לעולם.
 * ⛔ `unrelated` ו-`collocational` ⛔ אינם נבחרים כמתויגים: מסיח לא-קשור הוא בדיוק מה
 * שהמילוי מהרמה כבר נותן (T-152), ובחירתו כמתויג הייתה תופסת משבצת בלי לקנות דבר.
 */
function taggedOfRelation(
  tagged: readonly TaggedHeDistractor[],
  relation: DistractorRelation,
  answer: string,
  taken: ReadonlySet<string>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tagged) {
    if (t.relation !== relation) continue;
    const he = t.he.trim();
    if (he.length === 0 || he === answer || taken.has(he) || seen.has(he)) continue;
    seen.add(he);
    out.push(he);
  }
  return out;
}

export function pickWrongOptions(input: {
  readonly answer: string;
  readonly tagged: readonly TaggedHeDistractor[];
  readonly levelTranslations: readonly string[];
  readonly count: number;
  readonly rnd: () => number;
}): string[] {
  const answer = input.answer.trim();
  const chosen: string[] = [];
  const taken = new Set<string>();

  const take = (values: readonly string[], slots: number): void => {
    for (const v of values) {
      if (chosen.length >= input.count || slots <= 0) return;
      if (taken.has(v)) continue;
      taken.add(v);
      chosen.push(v);
      slots -= 1;
    }
  };

  // ⛔ הסדר הוא סמנטי → צורני → מילוי, ⛔ ולא הפוך: משבצת סמנטית שנתפסה במילוי
  // מחזירה בדיוק את הבעיה ש-T-153 נפתחה בגללה.
  take(shuffle(taggedOfRelation(input.tagged, 'semantic', answer, taken), input.rnd), SEMANTIC_SLOTS);
  take(shuffle(taggedOfRelation(input.tagged, 'orthographic', answer, taken), input.rnd), ORTHOGRAPHIC_SLOTS);

  // T-152 — המילוי הקיים, ⛔ בלי שינוי התנהגות: תרגומים עבריים של מועמדים אחרים ברמה.
  const filler = input.levelTranslations
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== answer && !taken.has(t));
  take(shuffle(filler, input.rnd), input.count - chosen.length);

  return chosen;
}
```

- [x] **Step 5: Run the test and confirm green**

Run: `npx vitest run lib/core/arcadeDistractors.test.ts`
Expected: PASS — 9 tests.

- [x] **Step 6: Prove the file is pure and typed**

Run: `npm run check:core && npm run typecheck`
Expected: both exit 0. ⛔ `check:core` failing here means an impure import slipped in — fix it
in this task, ⛔ do not carry it forward.

- [x] **Step 7: Commit — one commit for this task, ⛔ not for the tick**

```bash
./scripts/g add lib/core/arcadeDistractors.ts lib/core/arcadeDistractors.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-153 the D-023 mix as a pure module - 2 semantic, 1 orthographic, per-slot filler"
```

---

### Task 2: `buildRound` serves the mix

**Files:**
- Modify: `lib/core/arcadeRound.ts` (the `ArcadeCandidate` interface, and the wrong-option
  line inside `buildRound`'s `for (const c of picked)` loop)
- Test: `lib/core/arcadeRound.test.ts` (the `candidate()` fixture, and a new `describe`)

**Interfaces:**
- Consumes: `pickWrongOptions`, `TaggedHeDistractor` from Task 1.
- Produces: `ArcadeCandidate.taggedHe: readonly TaggedHeDistractor[]` — required, ⛔ not
  optional, so that Task 3 cannot forget to fill it and `tsc` says so.

- [x] **Step 1: Write the failing test**

In `lib/core/arcadeRound.test.ts`, extend the fixture and append a `describe`. Change the
`candidate()` helper to add the field (keep every existing line of it):

```ts
    distractorsEn: ['rest', 'play', 'window'],
    taggedHe: [],
```

and add the import at the top of the file:

```ts
import type { TaggedHeDistractor } from './arcadeDistractors';
```

then append:

```ts
describe('T-153 · D-138 — התמהיל המתויג מגיע לאפשרויות', () => {
  const MIX: TaggedHeDistractor[] = [
    { he: 'תרגום-1', relation: 'semantic' },
    { he: 'תרגום-2', relation: 'semantic' },
    { he: 'תרגום-3', relation: 'orthographic' },
    { he: 'תרגום-4', relation: 'near_synonym' },
  ];

  it('מועמד עם תמהיל מלא ⇒ שלוש השגויות שלו הן בדיוק המתויגות', () => {
    const pool = makeCandidates('A2', 20).map((c, i) =>
      i === 0 ? { ...c, taggedHe: MIX } : c);
    const round = buildRound({ gameLevel: A2_FIRST, candidates: pool, seed: 21 });
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    const q = round.questions.find((x) => x.wordId === 'w-00');
    expect(q).toBeDefined();
    if (q === undefined) return;
    const wrong = q.options.filter((o) => o !== q.answer);
    expect(new Set(wrong)).toEqual(new Set(['תרגום-1', 'תרגום-2', 'תרגום-3']));
  });

  it('⛔ `near_synonym` ⛔ אינו מגיע לאפשרויות גם דרך הסיבוב', () => {
    const pool = makeCandidates('A2', 20).map((c, i) =>
      i === 0 ? { ...c, taggedHe: MIX } : c);
    const round = buildRound({ gameLevel: A2_FIRST, candidates: pool, seed: 21 });
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    const q = round.questions.find((x) => x.wordId === 'w-00');
    expect(q?.options).not.toContain('תרגום-4');
  });

  it('⛔ אפס רגרסיה: בריכה בלי תמהיל כלל מחזירה סיבוב מלא כמו היום (ⓗ)', () => {
    const pool = makeCandidates('A2', 20);
    const round = buildRound({ gameLevel: A2_FIRST, candidates: pool, seed: 21 });
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    expect(round.questions).toHaveLength(ARCADE_ROUND_SIZE);
  });

  it('⛔ המתויג ⛔ אינו עוקף את «רק עברית» — האנגלית נשארת מחוץ לאפשרויות', () => {
    const pool = makeCandidates('A2', 20).map((c, i) =>
      i === 0 ? { ...c, taggedHe: MIX } : c);
    const round = buildRound({ gameLevel: A2_FIRST, candidates: pool, seed: 21 });
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    for (const q of round.questions) {
      for (const opt of q.options) expect(opt).not.toMatch(LATIN);
    }
  });
});
```

- [x] **Step 2: Run it and confirm red**

Run: `npx vitest run lib/core/arcadeRound.test.ts`
Expected: FAIL — a type error on `taggedHe` (the field does not exist yet) and the first two
assertions failing because the wrong options are still random level translations.

- [x] **Step 3: Add the field to `ArcadeCandidate`**

In `lib/core/arcadeRound.ts`, import the type and add the field **after** `distractorsEn`,
keeping `distractorsEn` and its comment exactly as they are:

```ts
import type { TaggedHeDistractor } from './arcadeDistractors';
```

```ts
  /**
   * 🔴 T-153 · D-138 § ב׳ — **עברית, מתויגת, ו⛔ אינה תוכן חדש.** הערך הוא
   * `translation_he` של מילה **אחרת שכבר במאגר**, שהנתיב פתר מ-`sense_distractors`
   * (‏`distractor → words.headword → senses.translation_he`).
   * ⛔ הוא ⛔ לעולם ⛔ אינו נוסע דרך `distractorsEn`: שדה נפרד ומפורש הוא מה ששומר על
   * המשמעות של שומר-המקור למטה, ומה שמונע את החזרה של D-087 בערוץ אחר.
   * בריכה בלי תמהיל ⇒ נפילה למנגנון של T-152, ⛔ מוצהרת ו⛔ לא שקטה.
   */
  readonly taggedHe: readonly TaggedHeDistractor[];
```

- [x] **Step 4: Delegate the wrong-option line**

In `lib/core/arcadeRound.ts`, add to the existing import from `./arcadeDistractors`:

```ts
import { pickWrongOptions, type TaggedHeDistractor } from './arcadeDistractors';
```

and replace the single `const wrong = …` line inside `buildRound`'s loop with:

```ts
    // T-153 · D-138 § ג׳ — התמהיל קודם, המילוי מהרמה משלים לפי משבצת (T-152).
    const wrong = pickWrongOptions({
      answer,
      tagged: c.taggedHe,
      levelTranslations: translations,
      count: ARCADE_OPTION_COUNT - 1,
      rnd,
    });
```

⛔ Leave the `if (wrong.length < ARCADE_OPTION_COUNT - 1) continue;` line and its comment
exactly as they are — that is ⓒ, «⛔ אין נפילה חזרה לאנגלית», and it still holds.

- [x] **Step 5: Run the whole core suite and confirm green**

Run: `npx vitest run lib/core/`
Expected: PASS. ⛔ The source-scan guard «`buildRound` ⛔ אינו קורא את מסיחי המילה בכלל»
must still pass **unmodified** — if you had to touch it, the value travelled through the
wrong field and the design is wrong, ⛔ not the test.

- [x] **Step 6: Commit**

```bash
./scripts/g add lib/core/arcadeRound.ts lib/core/arcadeRound.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-153 buildRound serves the tagged mix, falls back to T-152 per slot"
```

---

### Task 3: The route resolves the join

**Files:**
- Modify: `app/api/arcade/round/route.ts`
- Test: `app/api/arcade/round/route.test.ts`
- Modify: `docs/api-contract.md` — the `## GET /api/arcade/round` section, **same commit**

**Interfaces:**
- Consumes: `ArcadeCandidate.taggedHe` (Task 2), `TaggedHeDistractor` (Task 1).
- Produces: nothing new to other tasks. ⛔ **The HTTP response shape does not change** —
  `questions[].options` are still four Hebrew strings; only *which* strings changed.

- [x] **Step 1: Write the failing test**

Append to `app/api/arcade/round/route.test.ts`:

```ts
describe('T-153 · D-138 § א׳ — הפתירה היא צירוף, ⛔ לא עמודה', () => {
  it('‏`relation_type` נשלף — בלי התיוג התמהיל אינו קיים', () => {
    expect(CODE).toContain('relation_type');
  });

  it('⛔ אין מיגרציה ואין עמודת שפה — D-138 § א׳ ביטלה את `T-153` ⓐ', () => {
    expect(CODE).not.toContain('distractor_lang');
    expect(CODE).not.toMatch(/\blang\b/);
  });

  it('הפתירה קוראת `words` שוב — ⛔ ולא טבלה חדשה', () => {
    const read = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(read)].sort()).toEqual(['arcade_progress', 'words']);
  });

  it('⛔ הפתירה חסומה בתקרה — ⛔ URL בלי גבול הוא 414 בייצור', () => {
    expect(CODE).toContain('MAX_RESOLVE_HEADWORDS');
    expect(CODE).toContain('RESOLVE_CHUNK');
  });

  it('⛔ הנתיב עדיין ⛔ אינו כותב דבר, גם אחרי השאילתה השנייה', () => {
    expect(CODE).not.toMatch(/\.(insert|upsert|update|delete)\(/);
  });

  it('⛔ הערך הפתור נוסע ב-`taggedHe`, ⛔ ולעולם לא ב-`distractorsEn`', () => {
    expect(CODE).toContain('taggedHe');
    expect(CODE).toContain('distractorsEn');
    expect(CODE).not.toContain('distractorsHe');
  });

  it('⛔ תרגום בביטחון `low` ⛔ אינו נעשה מסיח — D-013 חל גם על המסיח', () => {
    const resolve = CODE.slice(CODE.indexOf('RESOLVE_SELECT'));
    expect(resolve).toContain("translation_confidence");
    expect(resolve).toContain("'low'");
  });

  it('החוזה מתעדכן באותו קומיט — `docs/api-contract.md` נוקב בתמהיל', () => {
    expect(CONTRACT).toContain('T-153');
    expect(CONTRACT).toContain('relation_type');
  });
});
```

- [x] **Step 2: Run it and confirm red**

Run: `npx vitest run app/api/arcade/round/route.test.ts`
Expected: FAIL on `relation_type`, `MAX_RESOLVE_HEADWORDS`, `taggedHe` and the contract
assertion — five or more failures, all for missing content.

- [x] **Step 3: Widen the select and add the resolve constants**

In `app/api/arcade/round/route.ts`, change `ROUND_SELECT`'s last line and add the constants
beneath it:

```ts
const ROUND_SELECT =
  'id, headword, cefr_profile_band, ngsl_rank, ' +
  'senses!inner(translation_he, translation_confidence, ' +
  'sense_distractors(distractor, relation_type))';

/**
 * 🔴 T-153 · D-138 § א׳ — **הפתירה היא צירוף, ⛔ ולא עמודה.** `sense_distractors.distractor`
 * הוא מחרוזת **אנגלית**; המסיח העברי הוא ה-`translation_he` של אותה מילה **כשהיא עצמה
 * במאגר**. ⛔ אין כאן FK, ולכן PostgREST ⛔ אינו יכול לצרף — זו שאילתת קריאה שנייה על
 * אותה טבלה בדיוק (`words`), ⛔ ולא טבלה חדשה ו⛔ לא מיגרציה.
 */
const RESOLVE_SELECT = 'headword, senses(translation_he, translation_confidence)';
/** ⛔ תקרה, ⛔ לא ציפייה: רמה שלמה יכולה להחזיק אלפי מסיחים, ו-`in()` בלי גבול הוא URL בן 414. */
const MAX_RESOLVE_HEADWORDS = 600;
/** ⛔ ומחולק לאצוות: 600 מחרוזות בשאילתה אחת הן URL שהשרת חותך בשקט. */
const RESOLVE_CHUNK = 150;
/** ⛔ `unrelated`/`collocational`/`near_synonym` ⛔ אינם נפתרים כלל — ⛔ אין להם משבצת (D-023). */
const RESOLVED_RELATIONS = new Set(['semantic', 'orthographic']);
```

- [x] **Step 4: Resolve, then build the candidates**

In `app/api/arcade/round/route.ts`, replace the `const candidates: ArcadeCandidate[] = …map(…)`
block with the following (the `sense` / `distractorsEn` lines are unchanged in meaning):

```ts
  type Row = {
    id: string; headword: string | null;
    cefr_profile_band: string | null; ngsl_rank: number | null;
    senses: { translation_he: string | null; translation_confidence: string | null;
              sense_distractors: { distractor: string | null;
                                   relation_type: string | null }[] | null }[] | null;
  };
  // ⛔ D-013: תרגום בביטחון נמוך לעולם אינו מוצג ללומד. המשמעות הראשונה שאינה low.
  const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
    row: r,
    sense: (r.senses ?? []).find((s) => s.translation_confidence !== 'low'),
  }));

  // ⛔ ממוין ⛔ ולא בסדר ההגעה: תקרה שחותכת קבוצה לא-ממוינת היא סיבוב שאינו ניתן לשחזור.
  const wanted = [...new Set(
    rows.flatMap((r) => (r.sense?.sense_distractors ?? [])
      .filter((d) => d.relation_type !== null && RESOLVED_RELATIONS.has(d.relation_type))
      .map((d) => (d.distractor ?? '').trim().toLowerCase())
      .filter((d) => d.length > 0)),
  )].sort().slice(0, MAX_RESOLVE_HEADWORDS);

  const heByHeadword = new Map<string, string>();
  for (let i = 0; i < wanted.length; i += RESOLVE_CHUNK) {
    const chunk = wanted.slice(i, i + RESOLVE_CHUNK);
    const { data: resolved, error: resolveError } = await supabase
      .from('words')
      .select(RESOLVE_SELECT)
      .in('headword', chunk)
      .order('headword')
      .order('id');
    if (resolveError) {
      // ⛔ ⛔ לא 503: התמהיל הוא **שיפור**, והנפילה למנגנון של T-152 היא סיבוב תקין
      // לגמרי (ⓗ). לומד ⛔ אינו רואה מסך שגיאה מפני שהעשרה לא נטענה.
      console.error('[api/arcade/round] distractor resolve failed:', resolveError.message);
      break;
    }
    for (const w of (resolved ?? []) as unknown as {
      headword: string | null;
      senses: { translation_he: string | null; translation_confidence: string | null }[] | null;
    }[]) {
      const key = (w.headword ?? '').trim().toLowerCase();
      if (key.length === 0 || heByHeadword.has(key)) continue;
      const he = (w.senses ?? []).find((s) => s.translation_confidence !== 'low')?.translation_he;
      if (he !== null && he !== undefined && he.trim().length > 0) heByHeadword.set(key, he.trim());
    }
  }

  const candidates: ArcadeCandidate[] = rows.map(({ row: r, sense }) => {
    const distractors = sense?.sense_distractors ?? [];
    const taggedHe: TaggedHeDistractor[] = [];
    for (const d of distractors) {
      const relation = d.relation_type;
      if (relation === null || !RESOLVED_RELATIONS.has(relation)) continue;
      const he = heByHeadword.get((d.distractor ?? '').trim().toLowerCase());
      if (he === undefined) continue;
      taggedHe.push({ he, relation: relation as TaggedHeDistractor['relation'] });
    }
    return {
      wordId: r.id,
      headword: r.headword ?? '',
      band: parseLevel(r.cefr_profile_band),
      ngslRank: r.ngsl_rank,
      translationHe: sense?.translation_he ?? '',
      distractorsEn: distractors.map((d) => d.distractor ?? '').filter((d) => d.length > 0),
      taggedHe,
    };
  });
```

and add the type import at the top of the file:

```ts
import type { TaggedHeDistractor } from '@/lib/core/arcadeDistractors';
```

- [x] **Step 5: Update `docs/api-contract.md` in this same commit**

In `docs/api-contract.md`, inside `## GET /api/arcade/round`, replace the stale sentence
«⚠️ הנתיב עדיין קורא `sense_distractors!inner` …» (it is wrong since T-212 removed `!inner`,
and F-146 it points at is closed) with:

```markdown
🔴 **שלושת המסיחים מתויגים — שונה 28/08 (T-153 · D-138 · D-023).** עד לתאריך הזה שלושתם
היו תרגומים עבריים **אקראיים מאותה רמה** (T-152), ⇒ לומד שידע במה עוסקת המילה בחר נכון
בלי לדעת אותה. מהיום, כשיש חומר: **שניים קרובים במשמעות** (`relation_type='semantic'`)
ו**אחד הוא המשמעות של מילה אנגלית דומת־צורה** (`relation_type='orthographic'`).
⛔ **אין מיגרציה ואין עמודה חדשה** — מסיח עברי הוא **צירוף**:
`sense_distractors.distractor → words.headword → senses.translation_he`, והנתיב פותר אותו
בשאילתת קריאה שנייה על `words` (תקרה `MAX_RESOLVE_HEADWORDS`, אצוות `RESOLVE_CHUNK`).
⛔ **`near_synonym` ⛔ אינו מוגש לעולם** (D-023 · Ludewig 2023), ו-`unrelated`/`collocational`
⛔ אינם נפתרים — מילוי לא-קשור כבר מגיע מהרמה.
⛔ **המשבצת שאין לה חומר נופלת למנגנון של T-152**, ⛔ מוצהר ו⛔ לא שקט ⇒ ⛔ אפס רגרסיה.
⚠️ **הפתירה שנכשלה ⛔ אינה 503** — היא סיבוב תקין עם מילוי מהרמה.
**נמדד על `data/generated/batch-*.jsonl`:** תמהיל מלא ב-**216/787** מהמשמעויות,
ולפחות מסיח מתויג אחד ב-**704/787 = 89.5%**. ⛔ **תבנית התשובה ⛔ לא השתנתה** — עדיין
ארבע מחרוזות עבריות, ⛔ בלי כפילות, והנכונה ביניהן.
```

- [x] **Step 6: Run the route tests and confirm green**

Run: `npx vitest run app/api/arcade/round/route.test.ts lib/core/`
Expected: PASS.

- [x] **Step 7: Commit the route and the contract together**

```bash
./scripts/g add app/api/arcade/round/route.ts app/api/arcade/round/route.test.ts docs/api-contract.md
./scripts/g commit -m "loop(DEV): C-XXXX T-153 the route resolves distractor headwords to Hebrew; contract in the same commit"
```

- [x] **Step 8: The full gate — ⛔ the only thing that lets you claim it passes**

Run: `npm run verify`
Expected: all five commands green (`typecheck` · `check:core` · `test` · `build` ·
`check:mobile`). ⛔ Red and unfixable in this tick ⇒ `./scripts/g revert`, a debt entry in
`plan/30-architecture.md`, ⛔ and nothing is pushed.

- [x] **Step 9: Close the row and push**

Set `T-153` to **🟣** with your cycle id in `plan/50-tasks.md` (⛔ do not touch its
`אבן דרך` cell), regenerate the index with `npm run measure:plan`, and commit
`docs/plan-tables.md` + `docs/plan-open.md` **in the same commit** as the register edit.

```bash
npm run measure:plan
./scripts/g add plan/ docs/plan-tables.md docs/plan-open.md
./scripts/g commit -m "loop(DEV): C-XXXX T-153 close-out - registers, control, plan boxes ticked"
./scripts/g push origin work/current
```

---

## Self-Review

**1. Spec coverage.** D-138 § א׳ (⛔ no migration · the join) → Task 3 Steps 3–4 and its
tests. § ב׳ (`taggedHe` as a separate explicit field, the guard stays green untouched) →
Task 2 Steps 3–5 and Task 3's `taggedHe`/`distractorsHe` assertion. § ג׳ (2 semantic + 1
orthographic, what the learner gets) → Task 1 Steps 2 and 4. § ד׳ (the K-004 commission) →
⛔ **not this plan and ⛔ not DEV's** — it is CONTENT's, and it is already written
(`docs/content-distractors-brief.md` · `docs/content-distractor-gap-2026-08-28.tsv`). T-153 ⓔ
(separate field) → Task 2. ⓕ (F-146) → already closed by T-212, asserted by the existing
`senses!inner` test. ⓗ (the declared fallback) → Task 1 Step 2's per-slot test and Task 2
Step 1's «⛔ אפס רגרסיה». ⓖ (Supabase CLI) → cancelled with ⓐ; ⛔ no step here runs `supabase`.

**2. Placeholder scan.** ⛔ No `TODO`, no «similar to Task N», no «add error handling». Every
code step carries the code. Every step names a file or a command (the `check:plan` gate).

**3. Type consistency.** `TaggedHeDistractor` / `pickWrongOptions` / `SEMANTIC_SLOTS` /
`ORTHOGRAPHIC_SLOTS` are spelled identically in the `## Interfaces` block, Task 1's
implementation, Task 2's import and Task 3's import. `taggedHe` is the field name in all
three tasks and in every assertion. `RESOLVED_RELATIONS`, `MAX_RESOLVE_HEADWORDS` and
`RESOLVE_CHUNK` appear in Task 3 only, and the tests assert the last two by name.

**4. What this plan deliberately does ⛔ NOT do.** It does not touch the battle screen, the
results screen, `BattleCast`, or any `relation` reaching the learner's summary — that is
`T-218`, ⛔ blocked until this lands, and it needs an owner decision about carrying the chosen
option's relation through `lib/core/battle.ts`. Recorded here so the next planning tick does
not rediscover it.
