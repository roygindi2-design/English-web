# Arena word mix — `37 § 2` wired end to end

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this
> plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `GET /api/arcade/round` starts telling the arena **which kind** each battle word is —
`known` / `unfiltered` / `base` — so that `mixArenaWords` (delivered green in T-173 and never
called with anything but `base`) finally runs the `37 § 2` table, and an unfiltered word starts
paying the two consequences the spec names: bonus damage when you are right, and the spell
returns to you when you are wrong.

**Architecture:** the decision stays in exactly one place. The route reads three row sets and
hands them over **unmixed**; `lib/core/arenaWords.ts` decides the mix (⛔ unchanged in this plan);
`lib/core/battle.ts` decides the consequence; `components/ArenaBattle.tsx` draws and does not
compute. The route stays **read-only** — the change is that `word_progress` is now read, and the
existing source-scan guard is **rewritten to enforce read-only**, ⛔ never deleted.

**Tech Stack:** Next 16 route handlers · Supabase JS · TypeScript (⛔ no `any`) · vitest.

**Spec:** `plan/37-arena-spec.md` § 2 (the mix table) · § 5 (the cast) · § 13.1 · § 13.3
(read allowed, write forbidden) · `plan/40-decisions.md` D-139 · D-052.

**Tasks covered:** `T-219` (whole) · `T-220` (ⓑ and ⓒ only — see the scope note below).

## Global Constraints

- ⛔ `lib/core/` is PURE: zero React, `window`, `document`, `localStorage`, `fetch`, `process.env`.
- ⛔ The arena **never writes** `word_progress` and never moves SM-2 (`37 § 13.1`). Reading is
  allowed and only reading (`37 § 13.3`).
- ⛔ D-052 is **not** weakened: the band still comes from `arcade_progress.arcade_level` alone.
  What changes is **which words inside the band** are picked, ⛔ never which band.
- ⛔ Empty store ⇒ exactly today's behaviour (15 × `base`) ⇒ zero regression for a new learner.
- `docs/api-contract.md` is updated in the **same commit** as the route change.
- Every UI string a learner sees is Hebrew, RTL; English only inside `<EnWord>`.
- `36 § 14.4` — **the render binds, layout and finish alike**; layer A (contrast · 44px ·
  ⛔ no state in colour alone) is the only carve-out. 🎯 The render this touches:
  `docs/design/kol-B-03-battle.png`, source `docs/design/render_video_B.py`.
- ⛔ One commit per task.

## ⛔ Scope note — what this plan deliberately does NOT build

`T-220` ⓐ (which card carries `?`) and ⓓ (the card returns **revealed**) are **out of scope**
and stay ⬜, blocked on **F-164**. Measured, ⛔ not assumed:
`docs/design/render_video_B.py:245` declares `HAND` as a **module-level constant** and `:521`
redraws that same `HAND` on every frame, while the banner word changes four times at `:406-409`
(`ECLIPSE` → `ABANDON` → `CRUCIAL` → `THREAT`) ⇒ in the render the hand is a **persistent hand of
four word-cards**. `components/ArenaBattle.tsx:540` builds `const hand = questions[battle.index]
?.options ?? []` ⇒ in the code the hand is **the current question's four options, rebuilt per
question**. `ArenaWordKind` is a property of the **banner** word, so binding `unknown` to it in the
built model puts `?` on **all four** cards and the round becomes unanswerable. Which model is the
product is a **learning mechanic** ⇒ `RULES § 0.16` sends it to the PM. ⛔ Not invented here.

## File Structure

| File | Responsibility | Create / Modify |
|---|---|---|
| `app/api/arcade/round/route.ts` | reads `word_progress` (read-only) and returns the three sets | Modify |
| `app/api/arcade/round/route.test.ts` | guard rewritten: read allowed, **write forbidden** | Modify |
| `lib/core/arcadeRound.ts` | `ArcadeQuestion` carries `kind` | Modify |
| `lib/core/arcadeRound.test.ts` | `kind` defaults to `base`, never invented | Modify |
| `lib/core/battle.ts` | bonus damage on `unfiltered`; wrong ⇒ re-queue | Modify |
| `lib/core/battle.test.ts` | the two rules above, measured | Modify |
| `components/ArenaBattle.tsx` | passes the three sets through; hand keyed by `wordId` | Modify |
| `docs/api-contract.md` | the new response shape, same commit as the route | Modify |
| `lib/core/arenaWords.ts` | ⛔ **untouched** — it is already correct | — |

## Interfaces

```ts
// lib/core/arcadeRound.ts — ADDED field, and only this one.
export interface ArcadeQuestion {
  readonly wordId: string;
  readonly headword: string;
  readonly answer: string;
  readonly options: readonly string[];
  /** `37 § 2`. ⛔ Absent in the payload ⇒ `'base'`, ⛔ never guessed from anything else. */
  readonly kind: ArenaWordKind;   // import type from './arenaWords'
}

// lib/core/arcadeRound.ts — buildRound gains one optional input, ⛔ nothing else changes.
export function buildRound(input: {
  readonly gameLevel: number;
  readonly candidates: readonly ArcadeCandidate[];
  readonly seed: number;
  /** word ids the learner marked `ידעתי`. ⛔ Read-only fact, ⛔ carries no SM-2 field. */
  readonly knownWordIds?: ReadonlySet<string>;
  /** word ids that have a progress row at all. A band word absent here is `unfiltered`. */
  readonly touchedWordIds?: ReadonlySet<string>;
}): ArcadeRound;

// lib/core/battle.ts — ADDED exports.
/** `37 § 2` — "right ⇒ bonus damage". ⛔ Applies to `unfiltered` only. */
export const UNFILTERED_BONUS_DAMAGE = 1;
/** `37 § 2` — "wrong ⇒ the spell returns to you", inside the same battle. */
export function cast(state: BattleState, chosen: string, elapsedMs: number): BattleState;
```

`BattleState.words` is already `readonly ArenaWord[]`; `cast` may now **append** to it. ⛔ The
invariant `casts[i] ↔ words[i]` is preserved because `cast` always reads `words[index]` and always
increments `index` by 1 — appending at the tail can never disturb an already-consumed slot.

---

### Task 1: the route tells the arena which kind each word is (T-219)

**Files:**
- Modify: `app/api/arcade/round/route.ts`
- Modify: `app/api/arcade/round/route.test.ts:10-33` (the D-052 guard block)
- Modify: `lib/core/arcadeRound.ts` (`ArcadeQuestion.kind`, `buildRound` inputs)
- Modify: `lib/core/arcadeRound.test.ts`
- Modify: `components/ArenaBattle.tsx:182-190` (`wordsOf`)
- Modify: `docs/api-contract.md` (`## GET /api/arcade/round`)

**Interfaces:**
- Consumes: `mixArenaWords`, `ArenaWord`, `ArenaWordKind` from `lib/core/arenaWords.ts` — ⛔ unchanged.
- Produces: `ArcadeQuestion.kind`; `buildRound({ knownWordIds, touchedWordIds })`.

- [ ] **Step 1: write the failing pure-layer test — `kind` is assigned, ⛔ not guessed**

```ts
// lib/core/arcadeRound.test.ts
import { buildRound, type ArcadeCandidate } from './arcadeRound';

const cand = (n: number): ArcadeCandidate => ({
  wordId: `w${n}`, headword: `h${n}`, band: 'A1', ngslRank: n,
  translationHe: `ת${n}`, distractorsEn: [],
});
const POOL = Array.from({ length: 40 }, (_, i) => cand(i));

describe('37 § 2 — כל שאלה נושאת את סוג המילה', () => {
  it('⛔ בלי הקבוצות — כל השאלות `base`, בדיוק ההתנהגות של היום', () => {
    const r = buildRound({ gameLevel: 1, candidates: POOL, seed: 7 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.questions.every((q) => q.kind === 'base')).toBe(true);
  });

  it('מילה שסומנה `ידעתי` היא `known`; מילה בלי שורת התקדמות היא `unfiltered`', () => {
    const known = new Set(['w0', 'w1']);
    const touched = new Set(['w0', 'w1', 'w2']);
    const r = buildRound({
      gameLevel: 1, candidates: POOL, seed: 7,
      knownWordIds: known, touchedWordIds: touched,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const kindOf = (id: string) => r.questions.find((q) => q.wordId === id)?.kind;
    for (const q of r.questions) {
      if (known.has(q.wordId)) expect(q.kind).toBe('known');
      else if (touched.has(q.wordId)) expect(q.kind).toBe('base');
      else expect(q.kind).toBe('unfiltered');
    }
    void kindOf;
  });
});
```

- [ ] **Step 2: run it and confirm RED**

```bash
npx vitest run lib/core/arcadeRound.test.ts
```
Expected: FAIL — `kind` is `undefined` on every question.

- [ ] **Step 3: add `kind` to `lib/core/arcadeRound.ts`**

```ts
import type { ArenaWordKind } from './arenaWords';

/**
 * `37 § 2` — ⛔ שלוש קטגוריות ו⛔ אין רביעית. ⛔ **חוסר ידיעה ⛔ אינו `unfiltered`:**
 * קורא שלא מסר את הקבוצות מקבל `base` לכל שאלה, כלומר בדיוק שורה 1 בטבלה.
 */
function kindOf(
  wordId: string,
  known: ReadonlySet<string> | undefined,
  touched: ReadonlySet<string> | undefined,
): ArenaWordKind {
  if (known === undefined || touched === undefined) return 'base';
  if (known.has(wordId)) return 'known';
  return touched.has(wordId) ? 'base' : 'unfiltered';
}
```

then inside `buildRound`'s question loop, replace the pushed object with:

```ts
    questions.push({
      wordId: c.wordId,
      headword: c.headword,
      answer,
      options: shuffle([answer, ...wrong], rnd),
      kind: kindOf(c.wordId, input.knownWordIds, input.touchedWordIds),
    });
```

and add the two optional fields to the `buildRound` input type exactly as the `Interfaces`
block above spells them.

- [ ] **Step 4: run it and confirm GREEN**

```bash
npx vitest run lib/core/arcadeRound.test.ts lib/core/arenaWords.test.ts
```
Expected: PASS.

- [ ] **Step 5: rewrite the D-052 guard — ⛔ never delete it**

`app/api/arcade/round/route.test.ts:11-16` currently asserts `word_progress` and
`self_marked_known` do **not appear at all** — a rule `37 § 13.3` explicitly permits breaking
(`הזירה **קוראת** את רשימת המילים הידועות`). ⛔ Deleting the guard is what broke `T-164`.
Replace the `it.each` block with:

```ts
describe('⛔ D-052 · 37 § 13.3 — קריאה מותרת, כתיבה אסורה', () => {
  it.each(['current_level', 'repetition', 'next_review_at', 'easiness', 'interval_days'])(
    '⛔ %s אינו מופיע בנתיב — גם לא בקריאה', (token) => {
      expect(CODE).not.toContain(token);
    });

  it('`word_progress` נקרא, ו⛔ אך ורק ב-select', () => {
    expect(CODE).toContain("from('word_progress')");
    const calls = [...CODE.matchAll(/\.from\('word_progress'\)([\s\S]{0,120})/g)];
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c[1]).toMatch(/^\s*\.select\(/);
  });

  it('הטבלאות שנקראות הן בדיוק arcade_progress · words · word_progress', () => {
    const read = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(read)].sort()).toEqual(['arcade_progress', 'word_progress', 'words']);
  });

  it('⛔ הנתיב עדיין אינו כותב דבר', () => {
    expect(CODE).not.toMatch(/\.(insert|upsert|update|delete)\(/);
  });
});
```

- [ ] **Step 6: run it and confirm RED**

```bash
npx vitest run app/api/arcade/round/route.test.ts
```
Expected: FAIL — `word_progress` is not read yet.

- [ ] **Step 7: read the progress rows in `app/api/arcade/round/route.ts`**

Insert **after** the `arcade_progress` read and **before** the `words` read:

```ts
/**
 * `37 § 13.3` — הזירה **קוראת** את רשימת המילים הידועות. ⛔ קריאה, ⛔ ולעולם לא כתיבה:
 * ⛔ אין בקובץ `.insert(` · `.update(` · `.upsert(` · `.delete(`, ונאכף בסריקת מקור.
 * ⛔ **D-052 ⛔ אינו נפגע** — ה-`band` עדיין נגזר מ-`arcade_level` בלבד; מה שהשורות האלה
 * קובעות הוא **אילו מילים בתוך ה-band** נבחרות, ⛔ ולא איזה band.
 * ⛔ ⛔ אין כאן ולו שם אחד של שדה SM-2 — שתי עמודות, ובלבד.
 */
const { data: progressWords, error: progressWordsError } = await supabase
  .from('word_progress')
  .select('word_id, self_marked_known')
  .eq('user_id', user.id);
if (progressWordsError) {
  console.error('[api/arcade/round] progress read failed:', progressWordsError.message);
  return isSchemaMissing((progressWordsError as { code?: string }).code)
    ? schemaMissing()
    : unavailable();
}
const touchedWordIds = new Set<string>();
const knownWordIds = new Set<string>();
for (const row of (progressWords ?? []) as { word_id: string; self_marked_known: boolean | null }[]) {
  touchedWordIds.add(row.word_id);
  if (row.self_marked_known === true) knownWordIds.add(row.word_id);
}
```

and change the `buildRound` call to:

```ts
const round = buildRound({
  gameLevel: rung === null ? 1 : gameLevel,
  candidates,
  seed,
  knownWordIds,
  touchedWordIds,
});
```

- [ ] **Step 8: run it and confirm GREEN**

```bash
npx vitest run app/api/arcade/round/route.test.ts lib/core/arcadeRound.test.ts
```
Expected: PASS.

- [ ] **Step 9: hand the three sets to `mixArenaWords` in `components/ArenaBattle.tsx`**

Replace `wordsOf` (`:182-190`) with:

```ts
/**
 * ⛔ הזירה מקבלת את מילותיה מ-`mixArenaWords` ⛔ ולא מהסיבוב ישירות (T-173 · `37 § 2`).
 * ⚠️ **T-219 — שלוש הקטגוריות מגיעות עכשיו מהנתיב.** מחסן ריק ⇒ כל השאלות `base` ⇒
 * ⛔ בדיוק ההתנהגות של היום, שהיא שורה 1 בטבלה של `§ 2`.
 * ⛔ הרכיב ⛔ אינו מחליט תמהיל — הוא ממיין לשלוש רשימות ומוסר.
 */
function wordsOf(questions: readonly ArcadeQuestion[]): readonly ArenaWord[] {
  const of = (kind: ArenaWordKind): ArenaWord[] =>
    questions
      .filter((q) => (q.kind ?? 'base') === kind)
      .map((q) => ({ wordId: q.wordId, headword: q.headword, translationHe: q.answer, kind }));
  return mixArenaWords({
    known: of('known'),
    unfiltered: of('unfiltered'),
    base: of('base'),
    size: questions.length,
  });
}
```

⛔ The hand must stop indexing by position, because `mixArenaWords` **reorders**. At
`components/ArenaBattle.tsx:540` replace the hand lookup with a `wordId` lookup:

```ts
  const byWordId = useMemo(
    () => new Map(questions.map((q) => [q.wordId, q])),
    [questions],
  );
  const word = battle.words[battle.index];
  // ⛔ חיפוש לפי `wordId` ⛔ ולא לפי אינדקס: `mixArenaWords` **משנה סדר**, ולכן
  // `questions[index]` היה מגיש את ארבע האפשרויות של מילה **אחרת**.
  const hand = word === undefined ? [] : byWordId.get(word.wordId)?.options ?? [];
```

and, in the result payload (`:365-370`), replace `battle.words[i]?.translationHe ?? ''` with the
same map lookup so the submitted `answer` follows the word and ⛔ not the position:

```ts
      answer: byWordId.get(c.wordId)?.answer ?? '',
```

- [ ] **Step 10: update `docs/api-contract.md` in this same commit**

In `## GET /api/arcade/round`, add `"kind": "base"` to the sample question, add the row
`| `kind` | `known` · `unfiltered` · `base` — `37 § 2`. ⛔ נגזר מ-`word_progress` **בקריאה בלבד** |`
to the field table, and replace the sentence that says `word_progress` is not touched at all with:

> ⛔ **הנתיב אינו כותב דבר.** אין בו `.insert(` · `.update(` · `.upsert(` · `.delete(`.
> ⚠️ **שונה 28/08 (T-219 · D-139 · `37 § 13.3`):** `word_progress` **נקרא** — שתי עמודות,
> `word_id` ו-`self_marked_known`, ⛔ ואין בנתיב ולו שם אחד של שדה SM-2. הטבלאות שנקראות הן
> `arcade_progress` · `words` · `word_progress`, כולן בקריאה. ⛔ **D-052 ⛔ אינו נפגע** —
> ה-`band` עדיין נגזר מ-`arcade_level` בלבד.

- [ ] **Step 11: full gate, then commit**

```bash
npm run verify
```
Expected: all five commands green. Then:

```bash
./scripts/g add app/api/arcade/round/route.ts app/api/arcade/round/route.test.ts lib/core/arcadeRound.ts lib/core/arcadeRound.test.ts components/ArenaBattle.tsx docs/api-contract.md
./scripts/g commit -m "loop(DEV): C-XXXX T-219 arena round carries word kind - 37 s2 mix wired, read-only"
```

---

### Task 2: an unfiltered word costs more and comes back (T-220 ⓑ + ⓒ)

**Files:**
- Modify: `lib/core/battle.ts:145-160` (`cast`)
- Modify: `lib/core/battle.test.ts`

**Interfaces:**
- Consumes: `ArenaWord.kind` — delivered by Task 1 through `wordsOf`.
- Produces: `UNFILTERED_BONUS_DAMAGE`; `cast` may append to `state.words`.

- [ ] **Step 1: write the failing test**

```ts
// lib/core/battle.test.ts
import { cast, startBattle, UNFILTERED_BONUS_DAMAGE } from './battle';
import type { ArenaWord } from './arenaWords';

const w = (id: string, kind: ArenaWord['kind']): ArenaWord =>
  ({ wordId: id, headword: id, translationHe: `ת-${id}`, kind });

describe('37 § 2 — «צדקת: נזק מוגבר · טעית: הלחש חוזר אליך»', () => {
  it('מילה `unfiltered` נכונה ⇒ נזק גדול ב-UNFILTERED_BONUS_DAMAGE ממילה `base` נכונה', () => {
    const base = cast(startBattle([w('a', 'base')], 3, 20), 'ת-a', 5_000);
    const unf = cast(startBattle([w('a', 'unfiltered')], 3, 20), 'ת-a', 5_000);
    expect(20 - unf.enemyHp).toBe((20 - base.enemyHp) + UNFILTERED_BONUS_DAMAGE);
  });

  it('⛔ הבונוס ⛔ אינו חל על `known` ו⛔ לא על `base`', () => {
    const known = cast(startBattle([w('a', 'known')], 3, 20), 'ת-a', 5_000);
    const base = cast(startBattle([w('a', 'base')], 3, 20), 'ת-a', 5_000);
    expect(known.enemyHp).toBe(base.enemyHp);
  });

  it('`unfiltered` שגויה ⇒ המילה חוזרת לסוף התור **באותו קרב**', () => {
    const s = cast(startBattle([w('a', 'unfiltered'), w('b', 'base')], 3, 20), 'לא נכון', 5_000);
    expect(s.words.map((x) => x.wordId)).toEqual(['a', 'b', 'a']);
    expect(s.index).toBe(1);
  });

  it('⛔ אין עונש כפול: `unfiltered` שגויה גורעת חיים **בדיוק** כמו כל שגיאה אחרת', () => {
    const unf = cast(startBattle([w('a', 'unfiltered')], 3, 20), 'לא נכון', 5_000);
    const base = cast(startBattle([w('a', 'base')], 3, 20), 'לא נכון', 5_000);
    expect(unf.pendingPenalty).toBe(base.pendingPenalty);
    expect(unf.learnerHp).toBe(base.learnerHp);
  });

  it('⛔ מילה חוזרת **פעם אחת בלבד** — שגיאה שנייה עליה ⛔ אינה מאריכה את התור לנצח', () => {
    const first = cast(startBattle([w('a', 'unfiltered')], 3, 20), 'לא נכון', 5_000);
    const second = cast(first, 'לא נכון', 9_000);
    expect(second.words.map((x) => x.wordId)).toEqual(['a', 'a']);
  });

  it('⛔ `casts[i]` עדיין תואם ל-`words[i]` אחרי חזרה', () => {
    const s = cast(startBattle([w('a', 'unfiltered'), w('b', 'base')], 3, 20), 'לא נכון', 5_000);
    const t = cast(s, 'ת-b', 6_000);
    expect(t.casts.map((c) => c.wordId)).toEqual(['a', 'b']);
    expect(t.words.slice(0, 2).map((x) => x.wordId)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: run it and confirm RED**

```bash
npx vitest run lib/core/battle.test.ts
```
Expected: FAIL — `UNFILTERED_BONUS_DAMAGE` is not exported.

- [ ] **Step 3: implement in `lib/core/battle.ts`**

Add next to `CRITICAL_DAMAGE`:

```ts
/**
 * `37 § 2` — «מילה לא מסוננת … צדקת — **נזק מוגבר**». ⛔ תוספת ⛔ ולא מכפיל: מכפיל היה
 * הופך קריטי על מילה לא מסוננת ל-4, כלומר 40% מחיי היריב בהטלה אחת.
 */
export const UNFILTERED_BONUS_DAMAGE = 1;
```

and replace the body of `cast` (`:145-160`) with:

```ts
export function cast(state: BattleState, chosen: string, elapsedMs: number): BattleState {
  const word = state.words[state.index];
  if (word === undefined) return state;

  const responseMs = Math.max(0, elapsedMs - state.shownAtMs);
  const correct = chosen === word.translationHe;
  const critical = correct && responseMs < CRITICAL_MS;
  const bonus = correct && word.kind === 'unfiltered' ? UNFILTERED_BONUS_DAMAGE : 0;
  const damage = correct ? (critical ? CRITICAL_DAMAGE : HIT_DAMAGE) + bonus : 0;

  // `§ 2` — «טעית — הלחש חוזר אליך». ⛔ **פעם אחת בלבד**: המילה החוזרת נכנסת כ-`base`,
  // ולכן שגיאה שנייה עליה ⛔ אינה מחזירה אותה שוב ו⛔ אין לולאה שאינה נגמרת.
  // ⛔ **ואין עונש נוסף** — `pendingPenalty` זהה לכל שגיאה אחרת (שורת המשימה, ⓒ).
  const requeue = !correct && word.kind === 'unfiltered';
  const words = requeue ? [...state.words, { ...word, kind: 'base' as const }] : state.words;

  return {
    ...state,
    words,
    index: state.index + 1,
    enemyHp: Math.max(0, state.enemyHp - damage),
    shownAtMs: elapsedMs,
    pendingPenalty: correct ? 0 : SWING_PENALTY,
    casts: [...state.casts, { wordId: word.wordId, correct, responseMs, critical }],
  };
}
```

- [ ] **Step 4: run it and confirm GREEN**

```bash
npx vitest run lib/core/battle.test.ts
```
Expected: PASS.

- [ ] **Step 5: confirm the hand survives the re-queued word**

The re-queued word is the same `wordId`, so the `byWordId` map built in Task 1 Step 9 already
serves it its four options. Verify with a fresh run, ⛔ not by reading:

```bash
npx vitest run components/ArenaBattle.test.ts lib/core/arcadeResult.test.ts
```
Expected: PASS.

- [ ] **Step 6: full gate, then commit**

```bash
npm run verify
```
Expected: all five green. Then:

```bash
./scripts/g add lib/core/battle.ts lib/core/battle.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-220b/c unfiltered word - bonus damage, and the spell returns once"
```

---

### Task 3: the live walk, at 375x780 (`STEP 6.5`, mandatory — this tick changes a screen)

**Files:**
- Modify: none. This task **measures**.

**Interfaces:**
- Consumes: everything Tasks 1–2 produced.

- [ ] **Step 1: start the server**

```bash
(npx next dev -p 3000 &) && sleep 25
```

- [ ] **Step 2: drive `/dev/arcade` at 375x780 and record the numbers**

Record, ⛔ do not eyeball: heading · text length · tappable count · anything under 44px ·
horizontal scroll at 320/375/414 · console errors. Compare the **layout** with
`docs/design/kol-B-03-battle.png`. `36 § 14.4` — the render binds **finish too**; layer A
(contrast · 44px · ⛔ no state in colour alone) is the only carve-out, and any gap goes in the
task row **with the number measured**.

- [ ] **Step 3: contrast and palette gates**

```bash
npm run check:palette && npm run check:mobile
```
Expected: both green.

- [ ] **Step 4: close out the registers and commit**

Update `plan/50-tasks.md` (T-219 ⇒ 🟣 with the cycle id; T-220 stays ⬜ with ⓑⓒ marked done and
ⓐⓓ blocked on F-164), `plan/60-findings.md` (F-164), `plan/30-architecture.md`,
`plan/00-control.md`, then regenerate and commit **in the same commit**:

```bash
npm run measure:plan && ./scripts/g add plan docs/plan-open.md docs/plan-tables.md
./scripts/g commit -m "loop(DEV): C-XXXX T-219 close-out - registers, control, plan boxes"
```

## Self-check

1. **Spec coverage.** `37 § 2` rows 1–3 and the mix table ⇒ Task 1. `§ 2`'s "לחש לא מזוהה"
   sentence: "צדקת — נזק מוגבר" ⇒ Task 2 Step 3; "טעית — הלחש חוזר אליך" ⇒ Task 2 Step 3; the
   `?` card itself ⇒ ⛔ **F-164**, declared out of scope above. `§ 13.1` (no writes) ⇒ Task 1
   Step 5's rewritten guard. `§ 13.3` (read allowed) ⇒ Task 1 Step 7.
2. **Placeholder scan.** ⛔ No `TODO`, no "add error handling", no "similar to Task N". Every code
   step carries the code.
3. **Type consistency.** `ArcadeQuestion.kind` (Task 1) is the field `wordsOf` filters on (Task 1
   Step 9) and the field `cast` reads through `ArenaWord.kind` (Task 2). `UNFILTERED_BONUS_DAMAGE`
   is spelled identically in the `Interfaces` block, the test and the implementation.
4. **Zero-regression proof.** Task 1 Step 1's first test is the regression guard: no sets ⇒ every
   question `base` ⇒ `mixArenaWords` returns today's 15 `base` words in today's order.
