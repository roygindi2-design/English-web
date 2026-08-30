# `סינון מילים` — the missing write path, and the button order that must precede it

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Tasks covered:** `T-225` — all six clauses ⓐ ⓑ ⓒ ⓓ ⓔ ⓕ.

⚠️ **Why ONE task row and not the usual two-to-four.** `cards` holds exactly two open
rows. `T-199` is blocked on `F-143` (⛔ no screen accepts `deck=sentences`,
`lib/core/deck.ts:47`) and `T-223` is blocked on `T-222`. ⇒ `T-225` is the only
buildable row in this workstream, and padding the plan with a blocked one would put
steps in it that ⛔ cannot be executed.

**המשך של: T-155** — `T-155` opened `deck=level` (`lib/core/deck.ts`,
`components/DeckSelector.tsx`, `components/StudyDeckScreen.tsx`) and shipped the tile
**locked** because the write path behind it was undecided. This plan is that write
path. Lineage is declared here rather than inferred.

**Goal:** a learner can tap «סינון מילים», grade a word they have never met, and have
the answer land in `word_progress` — with ⛔ zero SM-2 writes and ⛔ zero chance of the
row entering the review deck by accident.

**Architecture:** the practice payload gains a `deck` discriminator; the route's 404 for
a missing `word_progress` row **narrows** to every deck except `level`, where a missing
row is the common case rather than a stray POST. The `level` branch INSERTs — never
`upsert` — with the same three-column discipline `app/api/levels/scan/route.ts` already
uses. The pure counting layer (`lib/core/levelSummary.ts`) is ⛔ untouched.

**Tech Stack:** Next.js App Router route handlers · Supabase JS client · TypeScript
strict · Vitest (environment `node`; every test in this plan is a **source-scan** test,
the house pattern — see `app/api/practice/route.test.ts`).

**Spec:** `plan/50-tasks.md` row `T-225` · `plan/36-video-spec.md § 5` · decisions
`D-142` (closes `F-140`) · `D-150` (closes `F-102`) · `D-032` · `D-033` · `D-089`.

🎯 **The render this plan targets:** `docs/design/kol-A-02-deck.png` (the tile grid) and
`docs/design/kol-A-03-card.png` / `docs/design/render_video_A.py:370-380` (the two answer
buttons). Per `36 § 14.4` (D-114) **the render binds — layout AND finish alike**; the
only carve-out is **layer A** accessibility (contrast · 44px · ⛔ no state in colour
alone), and `render_video_A.py:373` is quoted verbatim in Task 1 because the button order
is taken from it and ⛔ not eyeballed from the PNG.

## Global Constraints

- ⛔ **Zero migration.** `self_marked_known` is already `boolean not null default false`
  — locked by `lib/supabase/learnerLevel.test.ts:49`. ⛔ Nothing goes in
  `supabase/migrations/`.
- ⛔ **Zero SM-2.** `easiness` · `interval_days` · `repetition` ·
  `consecutive_correct_recognition` ⛔ never appear in `app/api/practice/route.ts`.
  `next_review_at` appears **once**, as the literal `next_review_at: null` in the insert,
  and ⛔ nowhere else (D-032 · D-033 · `T-155ⓒ`).
- ⛔ **`upsert` is ⛔ not used** — the reason is the one already written at
  `app/api/levels/scan/route.ts:92-94`: an upsert would have to restate `track_id`, and a
  second home for a default is a second place it can be wrong (D-016).
- ⛔ **`lib/core/levelSummary.ts` is read-only in this plan.** `classifyProgress`
  (`:45-49`) tests `selfMarkedKnown` FIRST, so `T-210`'s counters stay correct under both
  new paths by themselves. ⛔ There is no fourth state and ⛔ the branch order is not
  "fixed".
- Every learner-facing string is Hebrew, RTL. English only inside `<EnWord>`/`<EnText>`.
- `docs/api-contract.md` changes in the SAME commit as the route (`RULES` STEP 5).
- After any register edit: `npm run measure:plan`, and `docs/plan-tables.md` +
  `docs/plan-open.md` in the same commit.

## File Structure

| File | New / edited | What |
|---|---|---|
| `components/Flashcard.tsx` | edited | `T-225ⓕ` — the two answer buttons swap places inside the existing `grid grid-cols-2` (`:351-369`) |
| `components/Flashcard.test.ts` | edited | `T-225ⓕ` — «ידעתי» is grid item 1 **and** `dx > 0 ⇒ 'good'`, asserted in one `it` |
| `lib/core/deck.ts` | edited | `T-225ⓐⓑ` — `PracticePayload` gains `deck: FlashcardDeckName`; `checkPracticePayload` validates it. PURE, ⛔ zero React/DOM/env |
| `lib/core/deck.test.ts` | edited | `T-225` — absent ⇒ `'due'`, three legal names, `'sentences'` and every unknown value rejected |
| `app/api/practice/route.ts` | edited | `T-225ⓐⓑ` — the 404 narrows to «every deck except `level`»; the `level` branch INSERTs with ⛔ zero SM-2 |
| `app/api/practice/route.test.ts` | edited | `T-225ⓔ` — `next_review_at` exactly once and only as `null`; `.insert(` only inside the `level` gate; `.upsert(` nowhere |
| `docs/api-contract.md` | edited | the narrowed 404 and the `deck` field — **same commit as the route** (`RULES` STEP 5) |
| `components/StudyDeckScreen.tsx` | edited | `T-225` — `sendGrade` sends the `deck` variable in the practice body (`:98-121`) |
| `components/StudyDeckScreen.test.ts` | edited | `T-225` — the deck name is in the body, and ⛔ not as a hard-coded string |
| `components/DeckSelector.tsx` | edited | `T-225ⓒ` — the `level` entry goes through `toEntry` with `href: '/study?deck=level'`; `locked: true` drops |
| `components/DeckSelector.test.ts` | edited | `T-225ⓒ` — the tile navigates and is ⛔ not locked; MUTATION: it is ⛔ not hand-built with `enabled: true` |
| `lib/core/levelSummary.ts` | ⛔ **untouched** | `T-225ⓓ` — `classifyProgress` (`:45-49`) tests `selfMarkedKnown` first, so `T-210`'s counts stay right on their own. ⛔ No fourth state |
| `lib/core/swipeGrade.ts` | ⛔ **untouched** | `dx > 0 ⇒ 'good'` (`:97`) already agrees with the render; flipping it too would recreate the bug mirrored |
| `components/LevelMapScreen.tsx` | ⛔ **untouched** | the screen's shape is `T-210`'s and ⛔ does not move here |
| `supabase/migrations/*` | ⛔ **none** | `self_marked_known` is already `boolean not null default false` — `lib/supabase/learnerLevel.test.ts:49` |

---

---

### Task 1: ⓕ — the two answer buttons swap sides (`D-150`, closes `F-102`)

⚠️ **First, and ⛔ not last.** Without it, the very first thing the new write path of
Tasks 2–4 records is the **inverted** answer: the learner swipes toward the button they
can see and gets the opposite grade. This is a correctness precondition of the row, ⛔
not a scope extension.

**Files:**
- Modify: `components/Flashcard.tsx:351-369` (the `swipeActive` grid)
- Test: `components/Flashcard.test.ts`
- ⛔ **Untouched:** `lib/core/swipeGrade.ts` — `dx > 0 ⇒ 'good'` (`:97`) already agrees
  with the render. Flipping it too would recreate the bug in the other direction.

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks read. The grid under `dir="rtl"` (`app/layout.tsx:33`)
  emits `data-grade="good"` as **grid item 1** and `data-grade="again"` as item 2.

- [ ] **Step 1: write the failing test in `components/Flashcard.test.ts`**

```ts
  /**
   * D-150 (סוגר את F-102) — `render_video_A.py:373`: `# RTL: "ידעתי" on the right`,
   * ו-`:374` מציב את «ידעתי» ב-`bx = 30 + bw + 14` (הימני). תחת `dir="rtl"` פריט
   * ה-grid הראשון יושב מימין ⇒ «ידעתי» חייבת להיות הראשונה.
   * ⛔ שתי הטענות באותו `it` בכוונה: הן אותה טענה. כפתור שהתהפך בלי המחווה, או
   * מחווה שהתהפכה בלי הכפתור, הם בדיוק אותו באג בכיוון ההפוך.
   */
  it('D-150 — «ידעתי» היא פריט ה-grid הראשון, והמחווה ימינה מסכימה איתה', () => {
    const good = T085_CARD_SRC.indexOf('data-grade="good"');
    const again = T085_CARD_SRC.indexOf('data-grade="again"');
    expect(good).toBeGreaterThan(-1);
    expect(again).toBeGreaterThan(-1);
    expect(good, '«ידעתי» ⛔ אינה הכפתור הראשון ב-grid').toBeLessThan(again);

    const pure = readFileSync('lib/core/swipeGrade.ts', 'utf8');
    expect(pure, 'המחווה ימינה ⛔ אינה `good` יותר').toContain("dx > 0 ? 'good' : 'again'");
  });
```

- [ ] **Step 2: run it and confirm it fails**

Run: `npx vitest run components/Flashcard.test.ts -t 'D-150'`
Expected: FAIL — `expected 1234 to be less than 1100` (the `good` button currently sits
second).

- [ ] **Step 3: swap the two `<button>` blocks in `components/Flashcard.tsx`**

The whole edit is moving the `good` button above the `again` button inside the same
`<div className="grid grid-cols-2 gap-3">`. ⛔ No class, no label, no handler changes —
`border-success` / `border-danger` and the `✓`/`✕` glyphs travel with their buttons, which
is what keeps state off colour alone (layer A).

```tsx
        {swipeActive ? (
          <div className="grid grid-cols-2 gap-3">
            {/* ⛔ D-150 · render_video_A.py:373 — «ידעתי» ראשונה ⇒ תחת RTL היא מימין. */}
            <button
              type="button"
              onClick={() => onGrade('good')}
              data-grade="good"
              className="min-h-touch rounded-lg border-2 border-success px-4 py-3 text-base font-semibold text-success active:opacity-90"
            >
              <span aria-hidden="true">✓ </span>ידעתי
            </button>
            <button
              type="button"
              onClick={() => onGrade('again')}
              data-grade="again"
              className="min-h-touch rounded-lg border-2 border-danger px-4 py-3 text-base font-semibold text-danger active:opacity-90"
            >
              <span aria-hidden="true">✕ </span>לא ידעתי
            </button>
          </div>
        ) : null}
```

- [ ] **Step 4: run the whole file green**

Run: `npx vitest run components/Flashcard.test.ts lib/core/swipeGrade.test.ts`
Expected: PASS, including the pre-existing `D-042` test at `:275` (it asserts presence,
⛔ not order, so it is unaffected).

- [ ] **Step 5: commit**

```bash
./scripts/g add components/Flashcard.tsx components/Flashcard.test.ts
./scripts/g commit -m "fix(cards): T-225 clause vav - swap answer buttons to match render_video_A (D-150, F-102)"
```

---

### Task 2: the practice payload learns which deck it came from

**Files:**
- Modify: `lib/core/deck.ts:241-260` (`PracticePayload` · `checkPracticePayload`)
- Test: `lib/core/deck.test.ts:140-155` (the `checkPracticePayload` describe block)

**Interfaces:**
- Consumes: `FlashcardDeckName` and `FLASHCARD_DECK_NAMES`, already exported at
  `lib/core/deck.ts:47-48`.
- Produces, and Tasks 3 and 4 both depend on these exact names:

```ts
export type PracticePayload = {
  readonly wordId: string;
  readonly grade: CardGrade;
  /**
   * ⛔ NOT decoration. The route's 404 for a missing `word_progress` row is correct for
   * every deck except this one: `level` is BY DEFINITION the words that have no row yet.
   * The discriminator is what lets the route narrow that 404 instead of deleting it.
   * ⛔ `'sentences'` is absent — `FlashcardDeckName` excludes it (`deck.ts:47`).
   */
  readonly deck: FlashcardDeckName;
};
```

⚠️ **Absent `deck` is `'due'`, ⛔ not a rejection.** `parseDeckName(null)` already means
«today's dose» (`deck.ts:99`), and `'due'` is the deck whose 404 stays. An old client that
sends no `deck` therefore keeps exactly today's behaviour — ⛔ it does not silently gain
the insert path.

- [ ] **Step 1: write the failing tests in `lib/core/deck.test.ts`**

```ts
describe('checkPracticePayload — T-225: החפיסה נוסעת בגוף הבקשה', () => {
  const id = '00000000-0000-4000-8000-000000000001';

  it("חסר `deck` ⇒ `'due'`, ⛔ ולא דחייה — התאימות לאחור היא הצד הבטוח", () => {
    const check = checkPracticePayload({ word_id: id, grade: 'good' });
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.payload.deck).toBe('due');
  });

  it('שלושת שמות חפיסת הכרטיס עוברים', () => {
    for (const deck of ['due', 'unknown', 'level'] as const) {
      const check = checkPracticePayload({ word_id: id, grade: 'good', deck });
      expect(check.ok, deck).toBe(true);
      if (check.ok) expect(check.payload.deck).toBe(deck);
    }
  });

  it("⛔ `'sentences'` ⛔ אינו שם חוקי כאן — הוא ⛔ אינו כרטיס דו-כפתורי", () => {
    expect(checkPracticePayload({ word_id: id, grade: 'good', deck: 'sentences' }).ok).toBe(false);
  });

  it('⛔ שם שאינו מוכר נדחה, ⛔ ולא נופל בשקט לברירת מחדל', () => {
    for (const bad of ['level ', 'LEVEL', '', 7, null, {}]) {
      expect(checkPracticePayload({ word_id: id, grade: 'good', deck: bad }).ok, String(bad)).toBe(false);
    }
  });
});
```

- [ ] **Step 2: run and confirm red**

Run: `npx vitest run lib/core/deck.test.ts -t 'T-225'`
Expected: FAIL — `expected undefined to be 'due'`.

- [ ] **Step 3: edit `lib/core/deck.ts`**

```ts
export type PracticePayload = {
  readonly wordId: string;
  readonly grade: CardGrade;
  readonly deck: FlashcardDeckName;
};

export function checkPracticePayload(body: unknown): PracticeCheck {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return REJECT;
  const { word_id: wordId, grade, deck } = body as {
    word_id?: unknown;
    grade?: unknown;
    deck?: unknown;
  };
  if (typeof wordId !== 'string' || !UUID_RE.test(wordId)) return REJECT;
  if (typeof grade !== 'string' || !BINARY_GRADES.includes(grade as CardGrade)) return REJECT;
  // ⛔ `undefined` בלבד נופל ל-`'due'`. `null`, `''` ומחרוזת לא מוכרת נדחים — ברירת
  // מחדל שבולעת קלט פסול היא בדיוק המחלקה של F-004.
  if (deck !== undefined && (typeof deck !== 'string' || !FLASHCARD_DECK_NAMES.includes(deck as FlashcardDeckName))) {
    return REJECT;
  }
  const deckName: FlashcardDeckName = deck === undefined ? 'due' : (deck as FlashcardDeckName);
  return { ok: true, payload: { wordId, grade: grade as CardGrade, deck: deckName } };
}
```

- [ ] **Step 4: run green, and confirm the pure layer stayed pure**

Run: `npx vitest run lib/core/deck.test.ts && npm run check:core`
Expected: PASS on both — `check:core` proves `lib/core/` still has zero React/DOM/env.

- [ ] **Step 5: commit**

```bash
./scripts/g add lib/core/deck.ts lib/core/deck.test.ts
./scripts/g commit -m "feat(core): T-225 practice payload carries its deck name"
```

---

### Task 3: ⓐ + ⓑ — the route opens a row, for `deck=level` and ⛔ for nothing else

**Files:**
- Modify: `app/api/practice/route.ts` (the missing-row branch at `:53-59`, and the
  select at `:38-42`)
- Modify: `docs/api-contract.md:238-268` — same commit, ⛔ not a follow-up
- Test: `app/api/practice/route.test.ts`

**Interfaces:**
- Consumes: `checkPracticePayload` from Task 2 — `check.payload.deck` is
  `'due' | 'unknown' | 'level'`.
- Consumes the shape already proven at `app/api/levels/scan/route.ts:110-123`:
  `.insert([{ user_id, word_id, first_seen_at, ...MARK }])`.
- Produces: the response body ⛔ does not change — `{ ok, attempts, correct_attempts }`.

**What is written, per clause, and ⛔ nothing else:**

| clause | grade | columns written on a brand-new row |
|---|---|---|
| ⓐ «ידעתי» | `good` | `self_marked_known: true` · `self_marked_at` · `attempts: 0` · `correct_attempts: 0` · `first_seen_at` · `updated_at` |
| ⓑ «לא ידעתי» | `again` | `self_marked_known: false` · `attempts: 1` · `correct_attempts: 0` · **`next_review_at: null`** · `first_seen_at` · `updated_at` |

🔴 **`next_review_at: null` is ⛔ NOT "due now".** `deck=due` filters
`next_review_at <= now`; a NULL never satisfies it ⇒ the row ⛔ can never fall into the
review deck by accident. It is written **explicitly** rather than left to the column
default so that the promise is in the code a reader can see.
⚠️ ⓐ writes `attempts: 0`: self-marking ⛔ is not an exposure that was answered
(`app/api/levels/scan/route.ts:22`).

- [ ] **Step 1: rewrite the two tests in `app/api/practice/route.test.ts` that now assert the opposite**

Replace the `⛔ אינו כותב אף אחד מארבעת שדות התזמון` test and the
`⛔ לעולם אינו מוסיף שורה` test with these. ⚠️ The replacements are **stricter**, ⛔ not
looser: the old file allowed the substring `next_review_at` nowhere; the new one allows it
in exactly one shape and forbids every other.

```ts
  it('⛔ אינו כותב אף אחד משדות SM-2', () => {
    for (const field of ['easiness', 'interval_days', 'repetition']) {
      expect(CODE).not.toContain(field);
    }
  });

  /**
   * T-225ⓑ — `next_review_at` נכנס לקובץ **פעם אחת**, ורק כ-`null` מפורש. ⛔ כל צורה
   * אחרת (`new Date`, `nowIso`, השמה מחושבת) היא בדיוק הכתיבה ש-D-033 אוסרת.
   */
  it('T-225ⓑ — `next_review_at` מופיע פעם אחת בלבד, ורק כ-null מפורש', () => {
    const hits = CODE.match(/next_review_at/g) ?? [];
    expect(hits.length).toBe(1);
    expect(CODE).toContain('next_review_at: null');
  });

  it('⛔ אינו נוגע ברצף ההכרה — הרצף מקדם לייצור, ותרגול אינו מקדם', () => {
    expect(CODE).not.toContain('consecutive_correct_recognition');
  });

  /**
   * T-225ⓐⓑ — ה-404 ⛔ לא נמחק, הוא **הצטמצם**. `.insert(` מותר, ו⛔ רק בתוך הענף
   * של `deck === 'level'`; `.upsert(` ⛔ אסור בכל מקום (הנימוק ב-scan/route.ts:92).
   */
  it("T-225 — insert חי ⛔ אך ורק בענף `level`, וה-404 שורד לכל חפיסה אחרת", () => {
    expect(CODE).not.toMatch(/\.upsert\(/);
    expect(CODE).toMatch(/\.insert\(/);
    expect(CODE).toMatch(/status:\s*404/);
    const gate = CODE.indexOf("payload.deck !== 'level'");
    const insert = CODE.indexOf('.insert(');
    const notFound = CODE.indexOf('status: 404');
    expect(gate, 'השער ⛔ אינו קיים').toBeGreaterThan(-1);
    expect(notFound, 'ה-404 חייב לשבת בתוך השער, לפני ה-insert').toBeGreaterThan(gate);
    expect(insert, 'ה-insert חייב לבוא אחרי שהשער סינן החוצה כל חפיסה אחרת').toBeGreaterThan(notFound);
  });

  /**
   * T-225ⓐ — סימון עצמי ⛔ אינו חשיפה שנענתה: השורה החדשה של «ידעתי» נפתחת עם
   * `attempts: 0`, בדיוק כמו `app/api/levels/scan/route.ts:22`.
   */
  it('T-225ⓐ — «ידעתי» פותחת שורה עם self_marked_known ו-attempts שאינו מנוחש', () => {
    expect(CODE).toContain('self_marked_known:');
    expect(CODE).toContain('self_marked_at:');
    expect(CODE).toContain('first_seen_at:');
  });
```

- [ ] **Step 2: run and confirm red**

Run: `npx vitest run app/api/practice/route.test.ts`
Expected: FAIL on `T-225` — `expected 0 to be 1` (no `next_review_at` in the file yet) and
`expected undefined not to be -1` (no `level` gate yet).

- [ ] **Step 3: edit `app/api/practice/route.ts` — replace the missing-row branch**

The `select` gains the two columns the new row's decision needs to stay honest, and the
`row === null` branch splits.

```ts
  const { data, error } = await supabase
    .from('word_progress')
    .select('attempts, correct_attempts')
    .eq('user_id', user.id)
    .eq('word_id', payload.wordId)
    .maybeSingle();

  // ... error handling unchanged ...

  const row = data as { attempts: number | null; correct_attempts: number | null } | null;

  if (row === null) {
    // T-225ⓐⓑ · D-142 — the 404 NARROWS, it is ⛔ not deleted. The reason written here
    // before («a word that was never answered cannot be in a practice deck») is true of
    // every deck and false of exactly one: `deck=level` IS the collection of words that
    // were never answered. ⛔ Any other deck still gets the 404.
    if (payload.deck !== 'level') {
      return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const known = payload.grade === 'good';
    // ⛔ `insert` ולא `upsert` — הנימוק ב-`app/api/levels/scan/route.ts:92-94`.
    // ⛔ אפס SM-2: `next_review_at: null` נכתב מפורשות ⛔ ואינו «מועד עכשיו» —
    // `deck=due` מסנן `next_review_at <= now`, ו-NULL ⛔ לעולם אינו עומד בתנאי.
    const { error: insertError } = await supabase.from('word_progress').insert({
      user_id: user.id,
      word_id: payload.wordId,
      first_seen_at: nowIso,
      self_marked_known: known,
      // ⛔ סימון עצמי אינו חשיפה שנענתה (scan/route.ts:22) ⇒ «ידעתי» פותחת ב-0.
      attempts: known ? 0 : 1,
      correct_attempts: 0,
      next_review_at: null,
      ...(known ? { self_marked_at: nowIso } : {}),
      updated_at: nowIso,
    });

    if (insertError) {
      console.error('[api/practice] progress insert failed:', insertError.message);
      return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      attempts: known ? 0 : 1,
      correct_attempts: 0,
    });
  }
```

⚠️ **The `.message` rule still holds:** the new `console.error` line carries `.message`
and the `NextResponse.json(` line beside it ⛔ does not — that is what the existing
`⛔ אינו מדליף` test measures, line by line.

- [ ] **Step 4: update `docs/api-contract.md` in the SAME edit**

Under `## POST /api/practice`, after the request-body block at `:244-252`, insert:

```markdown
`deck` הוא **רשות**, ובהיעדרו הערך הוא `due`. הערכים החוקיים: `due` · `unknown` ·
`level` (⛔ `sentences` ⛔ אינו כרטיס דו-כפתורי ⛔ ואינו מתקבל כאן).

🔓 **T-225 · D-142 — התשובה 404 על מילה בלי שורת `word_progress` הצטמצמה:** היא
נשארת על כל חפיסה **חוץ מ-`deck=level`**. חפיסת הרמה היא **בהגדרה** אוסף המילים שטרם
נענו, ולכן שם שורה חסרה היא המקרה הרגיל ⛔ ולא POST תועה. באותו מקרה, ⛔ ורק בו,
המסלול פותח שורה: «ידעתי» ⇒ `self_marked_known: true` · `attempts: 0`; «לא ידעתי» ⇒
`self_marked_known: false` · `attempts: 1` · **`next_review_at: null`**.
🔒 **`null` ⛔ אינו «מועד עכשיו»** — `deck=due` מסנן `next_review_at <= now`, ולכן
השורה ⛔ לעולם אינה נכנסת לחפיסת החזרה בטעות. ⛔ אפס SM-2 בשני המסלולים.
```

- [ ] **Step 5: run green and commit route + contract together**

Run: `npx vitest run app/api/practice/route.test.ts && npm run typecheck`
Expected: PASS.

```bash
./scripts/g add app/api/practice/route.ts app/api/practice/route.test.ts docs/api-contract.md
./scripts/g commit -m "feat(api): T-225 practice opens a row for deck=level only, no SM-2 (D-142, F-140)"
```

---

### Task 4: the screen sends the deck it is actually showing

**Files:**
- Modify: `components/StudyDeckScreen.tsx:98-121` (`sendGrade`)
- Test: `components/StudyDeckScreen.test.ts`

**Interfaces:**
- Consumes: the `deck` field of `PracticePayload` from Task 2, and the route from Task 3.
- Produces: `POST /api/practice` body `{ word_id, grade, deck }`.
- ⛔ The `unknown || level` branch condition at `:109` ⛔ does not change — it is written
  as an explicit list on purpose.

- [ ] **Step 1: write the failing test in `components/StudyDeckScreen.test.ts`**

```ts
  /**
   * T-225 — הראוט ⛔ אינו יכול לדעת מאיזו חפיסה הגיע הדירוג אלא אם המסך אומר. בלי
   * השדה הזה, `deck=level` מקבל 404 על כל מילה חדשה — כלומר על **רוב** החפיסה.
   */
  it('T-225 — גוף הבקשה ל-/api/practice נושא את שם החפיסה', () => {
    const branch = braceRegion(CODE, UNKNOWN_GATE);
    expect(branch).toContain('/api/practice');
    expect(branch, 'שם החפיסה ⛔ אינו נשלח').toMatch(/deck,|deck:\s*deck/);
    // ⛔ ⛔ לא מחרוזת קבועה: המסך משרת שתי חפיסות דרך אותו קריאה.
    expect(branch).not.toMatch(/deck:\s*'(level|unknown)'/);
  });
```

- [ ] **Step 2: run and confirm red**

Run: `npx vitest run components/StudyDeckScreen.test.ts -t 'T-225'`
Expected: FAIL — the branch has no `deck` field.

- [ ] **Step 3: edit `components/StudyDeckScreen.tsx`**

```tsx
    const practice = await apiPost<GradeResponse>('/api/practice', {
      word_id: card.word_id,
      grade,
      // T-225 — ⛔ המשתנה, ⛔ ולא מחרוזת: אותה קריאה משרתת `unknown` ו-`level`, ורק
      // `level` זכאית לפתוח שורה. מחרוזת קבועה כאן הייתה נותנת ל-`unknown` את
      // הזכות הזאת בשקט.
      deck,
    });
```

Also update the comment block above it: the sentence «which is why the `סינון מילים` tile
ships LOCKED this tick» is now false — replace it with a reference to `D-142` and this
task.

- [ ] **Step 4: run green**

Run: `npx vitest run components/StudyDeckScreen.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: commit**

```bash
./scripts/g add components/StudyDeckScreen.tsx components/StudyDeckScreen.test.ts
./scripts/g commit -m "feat(cards): T-225 the study screen sends its deck name with each practice grade"
```

---

### Task 5: ⓒ — the tile opens

⚠️ **Last, and ⛔ deliberately last.** This is the switch that puts the whole path in
front of a learner; flipping it before Tasks 1–4 are green is the F-027 class (a primary
CTA that fails on the first tap).

**Files:**
- Modify: `components/DeckSelector.tsx:226-235` (the `level` entry) and the comment block
  at `:220-225`
- Test: `components/DeckSelector.test.ts:117-133` (the `F-140` test)
- ⛔ **Untouched:** `lib/core/levelSummary.ts` · the `sentences` entry (still `F-142`/
  `F-143`) · `components/LevelMapScreen.tsx`

🎯 **Render:** `docs/design/kol-A-02-deck.png` — «סינון מילים» is the **primary** tile,
first in `36 § 5`'s order, and its second line is the number
(`LEVEL_NOTE_HE`), ⛔ never «—» when the count is loaded. `36 § 14.4`: **the render binds,
finish included**; the only carve-out is **layer A** (44px target — `min-h-touch` is
already on the tile — and ⛔ no state encoded by colour alone, which is why the lock mark
follows the `locked` flag and ⛔ not the note text).

**Interfaces:**
- Consumes: the working write path from Tasks 2–4.
- Produces: the `level` entry becomes `{ key, label, note, enabled, href: '/study?deck=level' }`
  through the existing `toEntry` helper (`:167-179`) — ⛔ no new helper, ⛔ no new prop.
- `toEntry` already returns `enabled: false` when `count` is `null` or `0`, so an empty or
  unread level stays **disabled with its number** (§ 4.2ו) ⛔ without a second rule.

- [ ] **Step 1: replace the `F-140` test in `components/DeckSelector.test.ts`**

```ts
  /**
   * T-225ⓒ · D-142 — F-140 נסגר: `/api/practice` פותח שורה עבור `deck=level`
   * (`app/api/practice/route.ts`, ענף `payload.deck !== 'level'`), ולכן האריח
   * ⛔ אינו CTA שנכשל בהקשה הראשונה יותר. ⛔ המנעול יורד, ⛔ והמספר נשאר.
   */
  it('T-225ⓒ — «סינון מילים» מנווטת אל `/study?deck=level`, ⛔ ואינה נעולה', () => {
    const region = braceRegion(CODE, "      key: 'level'");
    expect(region).toContain("href: '/study?deck=level'");
    expect(region).not.toContain('locked: true');
    expect(region).toContain('LEVEL_NOTE_HE');
  });

  /**
   * ⛔ **מוטציה, ונופלת בשם.** רמה ריקה או קריאה שנכשלה ⇒ `unseen` הוא `0`/`null`,
   * ו-`toEntry` מחזיר `enabled: false` **עם המספר** (§ 4.2ו). אריח שנכתב ידנית עם
   * `enabled: true` היה עוקף בדיוק את הכלל הזה.
   */
  it('MUTATION: אריח הרמה עובר דרך `toEntry`, ⛔ ולא נבנה ביד', () => {
    const region = braceRegion(CODE, "      key: 'level'");
    expect(region).not.toContain('enabled: true');
    expect(CODE).toMatch(/toEntry\(\{\s*\n\s*key: 'level'/);
  });
```

- [ ] **Step 2: run and confirm red**

Run: `npx vitest run components/DeckSelector.test.ts -t 'T-225'`
Expected: FAIL — the entry still carries `href: null` and `locked: true`.

- [ ] **Step 3: edit `components/DeckSelector.tsx`**

```tsx
    // ⛔ **`F-140` נסגר ב-`D-142` (C-0348) ו-`T-225` בנה את נתיב הכתיבה.**
    // `/api/practice` פותח שורה — ורק — עבור `deck=level`: «ידעתי» ⇒
    // `self_marked_known: true`, «לא ידעתי» ⇒ `attempts: 1` ו-`next_review_at: null`.
    // ⛔ אפס SM-2 (`T-155ⓒ` · D-032). ⇒ האריח הוא CTA ראשי אמיתי.
    // ⚠️ `toEntry` עדיין מחזיר `enabled: false` **עם המספר** כשהרמה ריקה או כשהקריאה
    // נכשלה — «מושבת עם המספר» (§ 4.2ו) ⛔ אינו «נעול».
    toEntry({
      key: 'level',
      label: LEVEL_LABEL_HE,
      href: '/study?deck=level',
      count: unseen ?? null,
      note: LEVEL_NOTE_HE(noteFor(unseen)),
    }),
```

- [ ] **Step 4: run green**

Run: `npx vitest run components/DeckSelector.test.ts && npm run typecheck`
Expected: PASS. ⚠️ If the `data-primary-action` test at `:305-312` goes red, ⛔ do not
edit that test — it is `36 § 5`'s "exactly one primary action" rule and a red there means
`primaryKey` needs to name `'level'`; fix the component, ⛔ not the assertion.

- [ ] **Step 5: commit**

```bash
./scripts/g add components/DeckSelector.tsx components/DeckSelector.test.ts
./scripts/g commit -m "feat(cards): T-225 clause gimel - the filter tile opens (closes F-140)"
```

---

### Task 6: the walk, the full gate, and the registers

- [ ] **Step 1: walk the screen — mandatory, this is a UI tick (D-103)**

```bash
(npx next dev -p 3000 &) && sleep 25
```

Drive `http://127.0.0.1:3000/dev/tabs/cards` and `http://127.0.0.1:3000/dev/deck` at
**375×780**. Record, in the tick report: heading · character count · tappable count ·
anything under 44px · horizontal scroll · console errors. Then compare the tile order and
the button order against `docs/design/kol-A-02-deck.png` and
`docs/design/render_video_A.py:370-380`.
⚠️ A tile that reads «—» while the count loaded, or a `good` button on the left, is a
**failure by name** — ⛔ not a rounding difference.

- [ ] **Step 2: run the full gate — ⛔ nothing is claimed without this**

Run: `npm run verify`
Expected: five commands, all green (`typecheck` · `check:core` · `test` · `build` ·
`check:mobile`). ⛔ Red and unfixable in this tick ⇒ `./scripts/g revert`, a debt entry in
`plan/30-architecture.md`, and the tick ends.

- [ ] **Step 3: close the register rows and regenerate the index**

`plan/50-tasks.md` — `T-225` status ⬜ ⇒ **🟣** with the cycle id (⛔ not ✅; QA flips it
on the merge). ⛔ Do not touch its `אבן דרך` cell — `M0 · cards · מבנה` stays exactly as
it is. `plan/60-findings.md` — `F-140` and `F-102` ⇒ closed, citing `D-142` / `D-150` and
the cycle.

Run: `npm run measure:plan`
Then commit `plan/50-tasks.md`, `plan/60-findings.md`, `docs/plan-tables.md` and
`docs/plan-open.md` **in one commit** (`RULES § 0.1.1 ח׳`). ⛔ Never hand-edit
`docs/plan-open.md`.

- [ ] **Step 4: journal + control, and push**

Update `plan/30-architecture.md` (the narrowed 404 is an architectural fact) and
`plan/00-control.md` (`CYCLE_ID` · `ACTIVE_TASK_ID` · `NEXT_AGENT=CRITIC` · release the
lock) + one journal line.

```bash
./scripts/g push origin work/current
```

## Self-review

**Spec coverage.** ⓐ Task 3 · ⓑ Task 3 · ⓒ Task 5 · ⓓ satisfied by omission and stated as
a Global Constraint (`levelSummary.ts` read-only) · ⓔ the five checks the row names live in
Tasks 2, 3 and 5 · ⓕ Task 1. ⛔ No migration anywhere — the row says
`self_marked_known` is already in the table.

**Placeholders.** ⛔ None. Every step names a file or a command; every test step carries
runnable code.

**Type consistency.** `PracticePayload.deck` is `FlashcardDeckName` in Task 2, read as
`payload.deck` in Task 3, and sent as the `deck` variable in Task 4 — the same name in all
three. `FLASHCARD_DECK_NAMES` is the existing export at `lib/core/deck.ts:48`, ⛔ not a new
constant.

**The one thing this plan deliberately does ⛔ NOT do.** It does ⛔ not verify that the
posted `word_id` really belongs to the learner's current level band before inserting. That
check is ⛔ not in `T-225`, and adding it would be a scope decision, ⛔ not a reversible
call under `RULES § 0.16`. ⇒ if the executor thinks it is needed, it is a **finding** for
`plan/60-findings.md`, ⛔ not a silent extra.
