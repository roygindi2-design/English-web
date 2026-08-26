# 2026-08-26 · `cards` slice A — «סינון מילים», and the counter that finally moves

**Tasks covered:** `T-155` (the deck) · `T-210` (the § 5 home screen) · `T-211` (the level switch moves to `הגדרות`) · `T-157` (the card follows the finger) · `T-156` (the arena entry leaves this screen).
**Decisions:** `D-123` · `D-124` · `D-125` · UX plan `§ 4.2כ` (PM, C-0317) · standing: `D-089` · `D-090ⓑ` · `D-042` · `D-032` · `D-033` · `D-034` · `D-050`.
**Anchor:** `plan/36-video-spec.md § 5` (the screen) · `§ 4` (the five tabs) · `§ 12.1` (the arena never writes `word_progress`) · `§ 13.2` **row 3** (the three seals).

🎯 **The renders this plan targets:** `docs/design/kol-A-02-deck.png` (home) and
`docs/design/kol-A-03-card.png` (the card). `36 § 14.4` (D-114) makes them binding for
finish as well as layout — ⚠️ **but D-120 outranks a pixel delta: the render is the FLOOR,
the learner's progress is the BAR.** The bar for this plan is the number in § 0.

## 0 · The measurement this plan rests on

Run on `work/current`, **2026-08-26T16:24:27Z**:

| What | Command / file | Number |
|---|---|---|
| A1 words that actually have a sense in the bank | `npm run measure:headroom` ⇒ `A1: … authored 305` | **305** |
| New words a learner can meet per day | `app/api/study/queue/route.ts:36` — `NEW_CARDS_PER_DAY = 5` | **5** |
| ⇒ **days to filter A1 today** | 305 ÷ 5 | 🔴 **61** |
| Cards a default 10-minute goal buys | `planDailyQueue`: `floor(10 × 60 ÷ 20)` | **30** |
| Deck ceiling per request | `lib/core/deck.ts:22` — `MAX_QUEUE_LIMIT = 50` | **50** |
| ⇒ **sittings to filter A1 after this plan** | 305 ÷ 30 | ✅ **~10** |

**61 days ⇒ ~10 sittings.** That is what this slice buys, and it is the answer D-120 demands.

**And the screen as it stands, `next dev`, 375×780, same tick:**

| Route | What it printed | chars |
|---|---|---|
| `/dev/tabs/cards` | `הרמה שלך —` · `נשארו לך מילים ברמה הזאת —` · `ברמה —` · `סימנת שידעת —` · `ברשימת החזרה —` · `דרכים לתרגל` · `מנת היום —` · `לא ידעתי —` · `משפטים נעול` · `משחק` | **235** |

Three facts fall out, none of them an opinion:

1. **There is ⛔ no `סינון מילים` deck.** `lib/core/deck.ts:19` — `DeckName` is `'due' | 'unknown'`. The learner's only supply of new words is the 5/day brake.
2. **There is ⛔ no progress bar and the three counters carry the wrong labels** — `ברמה` / `סימנת שידעת` / `ברשימת החזרה` where `§ 5` says `ידעתי` / `לא ידעתי` / `לא סוננו`. The arithmetic already exists in `lib/core/levelSummary.ts`; only the presentation is wrong.
3. **The screen carries TWO level pickers** — the `choose` branch and `<LevelPath>` — and `36 § 5` says **«אין מעבר רמות כאן»**. That is D-123.

⚠️ **And a fourth, measured while writing this plan:** `app/(tabs)/settings/page.tsx` offers
`שינוי רמה` → `/study/scan`, and `app/api/levels/scan/route.ts:69` **reads** `current_level`
and never writes it (line 123 writes `self_marked_known` on words). ⇒ **`הגדרות` cannot
change the level today.** That is why `T-211` is in this plan and ⛔ not a follow-up: without
it, `T-210` deletes the only working switch.

## 1 · File Structure

| File | New / edited | What |
|---|---|---|
| `lib/core/deck.ts` | edited | `T-155ⓐ` — `DeckName` gains `'level'`; `selectDeck` gains the `level` branch |
| `lib/core/deck.test.ts` | edited | `T-155` truth tests + the three mutations that must fail **by name** |
| `lib/core/filterProgress.ts` | **new** | PURE. `T-210` — the dashed bar's three segments + the `N / M סוננו` label + the three counter cells |
| `lib/core/filterProgress.test.ts` | **new** | `T-210` — the arithmetic table, `total = 0`, and the `null ≠ 0` rule |
| `app/api/study/queue/route.ts` | edited | `T-155ⓑⓓ` — the `level` branch: band = `profiles.current_level`, order `cefr_profile_band` then `ngsl_rank`, `attempts`-only writes |
| `components/LevelMapScreen.tsx` | edited | `T-210` · `T-211ⓐ` — § 5 shape; `<LevelPath>` and `<ArcadeEntry>` stop being rendered here |
| `components/LevelMapScreen.test.ts` | edited | source scans: `justify-center`, `«—»`-when-loaded, `<LevelPath` in this file all fail **by name** |
| `components/LevelCard.tsx` | **new** | `T-210ⓐ` — the read-only level card + the `שינוי רמה · הגדרות` chip (a `<Link>`, ⛔ not a picker) |
| `components/FilterBar.tsx` | **new** | `T-210ⓑⓒ` — the dashed RTL bar + the three counters, fed by `filterProgress.ts` |
| `components/DeckSelector.tsx` | edited | `T-210ⓓ` · `T-155ⓔ` — `סינון מילים` (primary) · `חזרה` (renamed) · `מנת היום` (kept, demoted) · `משפטים` untouched |
| `components/DeckSelector.test.ts` | edited | `סינון מילים` is the only `data-primary-action`; `לא ידעתי` as a tile label fails **by name** |
| `app/(tabs)/settings/page.tsx` | edited | `T-211ⓑ` — renders `<LevelPath>` and owns the `POST /api/levels/current` call |
| `app/(tabs)/settings/page.test.ts` | **new** | `T-211` — six chips, ⛔ no confirm dialog, ⛔ no lock |
| `lib/core/swipeGrade.ts` | edited | `T-157ⓐ` — `dragOffset` added; `SWIPE_FEEDBACK_MAX_PX` retired |
| `lib/core/swipeGrade.test.ts` | edited | `T-157` — 1:1 tracking, reduced-motion ⇒ 0, thresholds unchanged |
| `components/CardDeck.tsx` | edited | `T-157ⓑⓒⓔ` — release animation 150–300ms, one easing; reduced-motion ⇒ zero motion |
| `app/dev/tabs/cards/page.tsx` | edited | fixture feeds a non-null summary so the bar and counters render with numbers |
| `components/ArcadeEntry.tsx` | ⛔ **untouched** | `T-156` — ⛔ not deleted, ⛔ not edited. It simply stops being rendered by `LevelMapScreen` |
| `components/LevelPath.tsx` | ⛔ **untouched** | `T-211` is a change of PARENT, ⛔ not of component. Its own tests keep passing unchanged |
| `lib/core/levelSummary.ts` | ⛔ **untouched** | `known` / `inReviewList` / `unseen` already exist; a second definition here is exactly what `§ 4.2ז` forbids |
| `supabase/migrations/*` | ⛔ **none** | ⛔ **zero migrations in this plan.** `?deck=level` is a query over columns that already exist |

## 2 · Interfaces

⚠️ **Every block below was run through `tsc` with `--strict --noUncheckedIndexedAccess`
before it was written here — exit 0.** That is the open feedback row `C-0314`/`C-0315` in
`plan/26-plan-feedback.md`, answered ⛔ before it recurred a third time.

```ts
// lib/core/deck.ts — the ONLY edit to the type. ⛔ Additive: 'due' and 'unknown' do not move.
export type DeckName = 'due' | 'unknown' | 'level';
export const DECK_NAMES: readonly DeckName[] = ['due', 'unknown', 'level'];
// parseDeckName is UNCHANGED: it already returns null for an unknown value, and the route
// already answers 400 on null. Adding 'level' to DECK_NAMES is the whole parser change.
```

```ts
// lib/core/filterProgress.ts — PURE. ⛔ zero React, DOM, fetch, env, clock.

export interface LevelSummaryLike {
  readonly totalInLevel: number;
  readonly known: number;
  readonly inReviewList: number;
  readonly unseen: number;
}

export interface FilterProgress {
  readonly knownPct: number;
  readonly unknownPct: number;
  readonly restPct: number;
  readonly filtered: number;
  readonly total: number;
  readonly labelHe: string;
}

export function filterProgress(summary: LevelSummaryLike): FilterProgress {
  const total = summary.totalInLevel;
  const filtered = summary.known + summary.inReviewList;
  if (!Number.isInteger(total) || total < 0) {
    throw new RangeError(`filterProgress: totalInLevel must be a non-negative integer, got ${total}`);
  }
  // The same guard levelSummary.ts already uses, for the same reason: a bar wider than its
  // track looks like a rendering bug, and a throw here says the truth instead.
  if (filtered > total) {
    throw new RangeError(`filterProgress: filtered ${filtered} exceeds total ${total}`);
  }
  const pct = (n: number): number => (total === 0 ? 0 : (n / total) * 100);
  return {
    knownPct: pct(summary.known),
    unknownPct: pct(summary.inReviewList),
    restPct: pct(summary.unseen),
    filtered,
    total,
    labelHe: `${filtered} / ${total} סוננו`,
  };
}

export type CounterKey = 'known' | 'unknown' | 'unfiltered';

export interface CounterCell {
  readonly key: CounterKey;
  readonly labelHe: string;
  /** ⛔ `null` is NOT `0`. A read that failed and an empty level look identical on screen
   *  and only one of them is true — the rule <DeckSelector> and <MeScreen> already follow. */
  readonly value: number | null;
}

/** RTL order, ⛔ declared here and ⛔ not in JSX: `§ 5` fixes ידעתי on the right. */
export function counterCells(summary: LevelSummaryLike | null): readonly CounterCell[] {
  return [
    { key: 'known', labelHe: 'ידעתי', value: summary === null ? null : summary.known },
    { key: 'unknown', labelHe: 'לא ידעתי', value: summary === null ? null : summary.inReviewList },
    { key: 'unfiltered', labelHe: 'לא סוננו', value: summary === null ? null : summary.unseen },
  ];
}
```

```ts
// lib/core/swipeGrade.ts — T-157. ⛔ The three thresholds do NOT move.
// SWIPE_EDGE_PX = 20 · SWIPE_MIN_DISTANCE_PX = 64 · SWIPE_MAX_ANGLE_DEG = 30 — measured,
// ⛔ not chosen by taste. Only SWIPE_FEEDBACK_MAX_PX = 8 is retired.

export type DragOffset = { readonly x: number; readonly settleMs: number };

export function dragOffset(input: {
  readonly startX: number;
  readonly currentX: number;
  readonly reducedMotion: boolean;
}): DragOffset {
  // ⛔ reduced-motion is checked FIRST and returns zero motion, ⛔ not a smaller number:
  // constitution layer A. The gesture itself still resolves through `resolveSwipe`.
  if (input.reducedMotion) return { x: 0, settleMs: 0 };
  const delta = input.currentX - input.startX;
  // Same rule as `resolveSwipe`: a non-finite number is ⛔ not "zero" and ⛔ not "a lot".
  if (!Number.isFinite(delta)) return { x: 0, settleMs: 0 };
  return { x: delta, settleMs: 0 };
}
```

**The `level` deck's query, stated as a contract and ⛔ not as code** (`app/api/study/queue/route.ts`):

* Reads `words` where `cefr_profile_band` = `profiles.current_level` — ⛔ **never** `senses.cefr_level` (D-034: the two disagree on 125 of 343 measured senses).
* Order: `cefr_profile_band`, then `ngsl_rank`.
* `total` is counted **after** the deck predicate and **before** the slice to `limit` — the contract `docs/api-contract.md` already fixes, and the only reason `DeckSelector` can read a count with `limit=1`.
* Writes on grading: `attempts` and `correct_attempts` **only** (`applyPractice`, D-032 · D-033). ⛔ Zero `easiness`, `interval_days`, `repetition`, `next_review_at`.
* `translation_confidence = 'low'` is dropped by RLS on `senses` (0002/0003) — D-013 is enforced there and is ⛔ not restated here as a second rule.

## 3 · Steps

### Task `T-155` — the deck (⛔ first, so the screen has something real to call)

- [x] Add `'level'` to `DeckName` and `DECK_NAMES` in `lib/core/deck.ts`. ⛔ Do not touch `parseDeckName` — it already falls through to `null` on an unknown value.
- [x] In `lib/core/deck.ts`, in `selectDeck`, add the `level` branch: `level` is **not** re-filtered in the pure layer (the query already restricted the band), exactly as `due` is not. Only `unknown` filters, and that stays.
- [x] In `app/api/study/queue/route.ts`, add the `level` branch beside the existing `unknown` branch: read `profiles.current_level`, query `WORDS_SELECT` restricted to that band, exclude nothing, cap at `MAX_QUEUE_ROWS`, and return `{ ok: true, deck, total: filtered.length, cards }`.
- [x] In `app/api/study/queue/route.ts`: `current_level` is `null` ⇒ answer `{ ok: false, code: 'no_level' }`, ⛔ not 500 and ⛔ not a silent fall-back to A1. The screen already knows this state (`kind: 'choose'`).
- [x] Add to `docs/api-contract.md`: `deck=level` beside `due` and `unknown`, with the same `total`-before-`limit` sentence.
- [x] Tests in `lib/core/deck.test.ts`:

```ts
it('accepts level as a deck name', () => {
  expect(parseDeckName('level')).toBe('level');
});

it('level keeps every row the query returned, in band then headword order', () => {
  const rows = [rowAt('B1', 'zebra'), rowAt('A1', 'apple'), rowAt('A1', 'anchor')];
  expect(selectDeck(rows, 'level', 20).map((r) => r.headword)).toEqual(['anchor', 'apple', 'zebra']);
});

it('level does not drop unanswered words the way unknown does', () => {
  const fresh = rowAt('A1', 'apple'); // attempts: 0
  expect(selectDeck([fresh], 'unknown', 20)).toHaveLength(0);
  expect(selectDeck([fresh], 'level', 20)).toHaveLength(1);
});

// ⛔ The three mutations. Each must fail BY NAME, ⛔ not by a generic assertion.
it('MUTATION: grading from the level deck must never touch SM-2', () => {
  const next = applyPractice({ attempts: 3, correctAttempts: 1 }, 'good');
  expect(Object.keys(next).sort()).toEqual(['attempts', 'correctAttempts']);
});

it('MUTATION: the level deck must never be ordered by senses.cefr_level', () => {
  const source = readFileSync('app/api/study/queue/route.ts', 'utf8');
  expect(source).not.toMatch(/senses[^\n]*cefr_level/);
});

it('MUTATION: a null current_level must answer no_level, never A1', () => {
  const source = readFileSync('app/api/study/queue/route.ts', 'utf8');
  expect(source).toContain("'no_level'");
  expect(source).not.toMatch(/current_level[^\n]*\?\?\s*'A1'/);
});
```

### Task `T-210` — the § 5 home screen

- [x] Create `lib/core/filterProgress.ts` exactly as § 2 gives it. ⛔ It imports nothing from React, `next`, or `lib/supabase`. `npm run check:core` is the guard.
- [x] Create `components/LevelCard.tsx`: `הרמה שלך` · `<EnWord>{level}</EnWord>` · `נקבעה במבחן הרמה` · a `<Link href="/settings">` chip reading `שינוי רמה · הגדרות` with `min-h-touch`. ⛔ No `onChoose` prop, ⛔ no state, ⛔ no six-level grid — D-123ג׳ⓐ.
- [x] Create `components/FilterBar.tsx`: one track, three segments (`--success` · `--danger` · `--border-subtle`) laid out **RTL**, widths from `filterProgress()`, and the label `N / M סוננו` beside the heading `התקדמות ברמה`. Beneath it, the three `counterCells()` — each carrying **icon + Hebrew label + number**, ⛔ never colour alone (`36 § 12.7`).
- [x] In `components/LevelMapScreen.tsx`: render `<LevelCard>` · `<FilterBar>` · `<DeckSelector>` · the fixed note `הסימון של מילים מתבצע בכרטיסיות בלבד`, in that order. **Delete the `<LevelPath>` and `<ArcadeEntry>` render sites** (`T-211` · `T-156`) — ⛔ the components themselves are untouched.
- [x] In `components/LevelMapScreen.tsx`, keep the `kind: 'choose'` branch exactly as it is (D-123ג׳ⓒ) — a learner with no level must still have one action.
- [x] In `components/LevelMapScreen.tsx`, keep the `<UnknownList>` render site. ⛔ It is not a deck tile and § 5 does not forbid it.
- [x] Edit `app/dev/tabs/cards/page.tsx` so the fixture supplies a non-null summary (`totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314` — the render's own numbers) ⇒ the bar and the counters are measurable by `check:mobile` **without env**.
- [x] Tests in `lib/core/filterProgress.test.ts` and `components/LevelMapScreen.test.ts`:

```ts
it('splits the bar exactly as 36 § 5 draws it', () => {
  const bar = filterProgress({ totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314 });
  expect(bar.labelHe).toBe('86 / 400 סוננו');
  expect(bar.knownPct + bar.unknownPct + bar.restPct).toBeCloseTo(100, 10);
});

it('a level with no words is 0%, not NaN', () => {
  const bar = filterProgress({ totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 });
  expect(bar.knownPct).toBe(0);
  expect(bar.labelHe).toBe('0 / 0 סוננו');
});

it('a missing summary reads «—», never 0', () => {
  expect(counterCells(null).map((c) => c.value)).toEqual([null, null, null]);
});

it('the counters carry 36 § 5 labels, in RTL order', () => {
  const cells = counterCells({ totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314 });
  expect(cells.map((c) => c.labelHe)).toEqual(['ידעתי', 'לא ידעתי', 'לא סוננו']);
});

// ⛔ Source scans — F-011 · F-016 · D-123.
it('MUTATION: the cards screen must never centre its layout', () => {
  expect(readFileSync('components/LevelMapScreen.tsx', 'utf8')).not.toContain('justify-center');
});

it('MUTATION: the level picker must not come back to the cards screen', () => {
  const source = readFileSync('components/LevelMapScreen.tsx', 'utf8');
  expect(source).not.toContain('<LevelPath');
  expect(source).not.toContain('<ArcadeEntry');
});

it('MUTATION: the invariant note must be on the screen', () => {
  expect(readFileSync('components/LevelMapScreen.tsx', 'utf8'))
    .toContain('הסימון של מילים מתבצע בכרטיסיות בלבד');
});
```

### Task `T-211` — the level switch gets its home in `הגדרות`

- [x] In `app/(tabs)/settings/page.tsx`: make it a client component that reads `GET /api/levels/summary`, renders `<LevelPath levels={...} current={...} onChoose={...} busy={...} />`, and posts to `POST /api/levels/current` — **the same route `LevelMapScreen` uses today**. ⛔ Zero new endpoint (T-154ⓓ, carried over).
- [x] In `app/(tabs)/settings/page.tsx`: ⛔ **no gate, no «עדיין לא», no threshold** — D-037 · R-017: there is no empirical mastery threshold and the product **counts, it does not judge** (T-154ⓑ, carried over).
- [x] In `app/(tabs)/settings/page.tsx`: ⛔ **no «are you sure?» dialog** — `current_level` is one field and touches neither SM-2 nor any learned word (T-154ⓒ, carried over).
- [x] In `app/(tabs)/settings/page.tsx`, keep the existing `שינוי רמה` → `/study/scan` link **as a second, clearly-labelled entry** (`סריקת רמה` · `לסמן מה שאתה כבר יודע`). ⛔ It is not the level switch and must stop being labelled as one — that is the gap measured in § 0.
- [x] `/settings` now reads the learner's profile ⇒ **add `'/settings'` to `PROTECTED_SCREENS` in `lib/proxy.ts` in the SAME commit**, exactly as `/me` did. ⛔ Not later.
- [x] Tests in `app/(tabs)/settings/page.test.ts`:

```ts
it('offers all six levels and gates none of them', () => {
  const source = readFileSync('app/(tabs)/settings/page.tsx', 'utf8');
  expect(source).toContain('<LevelPath');
  expect(source).not.toMatch(/נעול|עדיין לא|disabled=\{true\}/);
});

it('MUTATION: switching level must not ask for confirmation', () => {
  const source = readFileSync('app/(tabs)/settings/page.tsx', 'utf8');
  expect(source).not.toMatch(/אתה בטוח|confirm\(/);
});

it('MUTATION: settings must join PROTECTED_SCREENS once it reads the profile', () => {
  expect(readFileSync('lib/proxy.ts', 'utf8')).toContain("'/settings'");
});
```

### Task `T-157` — the card follows the finger

- [x] In `lib/core/swipeGrade.ts`: add `dragOffset` as § 2 gives it; delete `SWIPE_FEEDBACK_MAX_PX`. ⛔ **`SWIPE_EDGE_PX` · `SWIPE_MIN_DISTANCE_PX` · `SWIPE_MAX_ANGLE_DEG` do not move** — they were measured, ⛔ not chosen.
- [x] In `components/CardDeck.tsx`: during the drag, translate the card by `dragOffset().x` with **⛔ no transition** (1:1 is direct manipulation, ⛔ not a timed animation — § 5 of the constitution governs the **release**). On release **above** the threshold, exit toward the gesture in **150–300ms, one easing**; **below** it, return to place in the same range.
- [x] In `components/CardDeck.tsx` and `lib/core/swipeGrade.ts`: `prefers-reduced-motion` ⇒ **zero motion**, and the gesture still grades. ⛔ Not "less motion".
- [x] In `components/CardDeck.tsx`: ⛔ the two grade buttons stay the canonical channel (D-042) and the swipe is a shortcut. ⛔ Zero horizontal scrolling — the card container keeps `overflow-x: hidden`.
- [x] Tests in `lib/core/swipeGrade.test.ts`:

```ts
it('tracks the finger 1:1', () => {
  expect(dragOffset({ startX: 200, currentX: 260, reducedMotion: false }).x).toBe(60);
  expect(dragOffset({ startX: 200, currentX: 140, reducedMotion: false }).x).toBe(-60);
});

it('reduced motion means zero motion, not less motion', () => {
  expect(dragOffset({ startX: 200, currentX: 260, reducedMotion: true }).x).toBe(0);
});

it('MUTATION: the 8px cap must not come back', () => {
  const source = readFileSync('lib/core/swipeGrade.ts', 'utf8');
  expect(source).not.toContain('SWIPE_FEEDBACK_MAX_PX');
});

it('MUTATION: the three measured thresholds must not move', () => {
  expect(SWIPE_EDGE_PX).toBe(20);
  expect(SWIPE_MIN_DISTANCE_PX).toBe(64);
  expect(SWIPE_MAX_ANGLE_DEG).toBe(30);
});
```

### Task `T-156` — the arena entry leaves the cards screen

- [x] Already done by `T-210`'s render-site deletion. **Close `T-156` in the SAME commit** — `plan/27-pm-lessons.md § A1` line 8: a row whose deliverables landed inside another row's tick is closed then, ⛔ not "later".
- [x] Verify the arena is still reachable: `grep -rn "ArcadeEntry\|/arcade" app components lib` must still show the ring node (`lib/core/worldRing.ts`). ⛔ If it does not, the arena has lost its only entry and this step is a 🔴 — stop and say so.

### Closing

- [x] `npm run measure:plan` and commit **both** generated files in the same commit (`RULES § 0.1.1 ח׳`). ⛔ Never hand-edit them.
- [x] Run `npx next dev -p 3000` and walk `http://127.0.0.1:3000/dev/tabs/cards` (rendered by `app/dev/tabs/cards/page.tsx`) at 375×780 and record: heading · character count · tappable count · anything under 44px · horizontal scroll · console errors. ⚠️ The expected character count rises well above the 235 measured in § 0 — if it does not, the bar and the counters did not render.
- [x] `npm run verify` — **exit 0, freshly run.** ⛔ No claim of "done" before that output exists (`RULES § 0.6`).

## 4 · What this plan ⛔ does NOT claim

* ⛔ **It does not close seals ⓑ or ⓒ.** D-125: both need real data and a session, and the sandbox has neither. The plan closes **ⓐ** and puts ⓑ/ⓒ in front of Roy in three taps (`03-for-roy.md`).
* ⛔ **It does not touch `T-165` or `T-199`** — the `משפטים` deck is `cards` slice B, and mixing cloze items into a filtering slice would make it two features.
* ⛔ **It does not delete `מנת היום`.** `§ 4.2כ ד׳` records the declared deviation from `§ 5`'s "two decks" and the measurement behind it: that tile is the only entry to `/study` in the whole product.
* ⛔ **It does not measure whether ~10 sittings is a good number.** It measures that 61 days is a bad one. The first is a question for a real learner; the second is arithmetic on two constants in the tree.


---

## 5 · What actually happened — C-0318 (DEV), 2026-08-26

⛔ **Every box above is ticked, and three of them were built somewhere other than where
this plan says.** Ticking a box whose file was wrong would make the plan a record of what
was intended rather than of what exists.

| Step as written | What shipped | Why |
|---|---|---|
| `lib/proxy.ts` — the `PROTECTED_SCREENS` mutation | **`proxy.ts`** (repo root) | The file has lived at the root since Next 16 renamed the convention. The test as written (`readFileSync('lib/proxy.ts')`) would have thrown ENOENT, ⛔ not failed by name. |
| `components/CardDeck.tsx` — the drag | **`components/Flashcard.tsx`** | The gesture handlers (`onPointerDown`/`onPointerUp` · `resolveSwipe`) live there; `CardDeck.tsx` holds ⛔ not one of them. `CardDeck` did get `overflow-x-hidden` (`T-157ⓕ`). |
| `selectDeck(rows, 'level', limit)` in the route | **`levelRows.slice(0, limit)`** | `sortQueue` has no rank to sort by — every level row is unscheduled — so its tie-break replaces **frequency** with the **alphabet**. Same measured reason `loadNewWords` gives. The pure layer still owns the deck's shape and `deck.test.ts` pins it. |

### ⛔ And one thing the plan does ⛔ NOT cover at all — `F-140` 🔴

The plan defines `deck=level` **end to end on the READ side** and is silent on the write.
Measured this tick: `app/api/practice/route.ts:59` answers **404** for a word with no
`word_progress` row — **by declared intent** — and the level deck is precisely the set of
words the learner has never met (A1 = **305**, a new learner carries ~0 rows). `T-155ⓒ`
forbids the one route that does insert (`/api/review`, SM-2). ⇒ ⛔ **no admissible write
path exists**, and choosing one is a **learning mechanic** — `RULES § 0.16` sends that to
the PM.

⇒ The endpoint, the contract and the pure layer shipped and are green; the `סינון מילים`
tile ships **locked with its number** (`D-046` · `§ 4.2ו`, the `משפטים` pattern) rather
than as a primary CTA that fails on the learner's first tap. **Opening it is one PM line.**

### The numbers, measured after the tick

| What | Before | After |
|---|---|---|
| `/dev/tabs/cards` at 375×780 | **235** chars, every number `—` | **462** chars, `86 / 400 סוננו`, counters `61 · 25 · 314` |
| A 100px drag on the card | 8px of offset | **100px**, `transition-duration: 0s` |
| `prefers-reduced-motion` on the drag | ≤8px | **`transform: none`** — zero |
| `npm run verify` | — | **exit 0** (typecheck · core · 2803 tests · build · 1158 mobile checks) |
