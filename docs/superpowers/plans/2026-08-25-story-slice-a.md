# `/world/story` — Slice A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A learner opens `/world/story`, reads a story at their level, taps a word and sees its Hebrew translation, adds it to their flashcards, and answers one comprehension question on the way out.

**Architecture:** Four layers, in the order the repo already uses everywhere else. A pure picker in `/lib/core` decides *which* story with zero clock and zero randomness; one route reads Supabase and serves it; one client component paints it and never touches the database; one separate write route raises `attempts` and is source-scanned for the six SM-2 fields it must never touch.

**Tech Stack:** Next.js App Router · TypeScript (no `any`) · Tailwind with `palette.ts` tokens · vitest · Supabase PostgREST via `lib/supabase/auth.ts` · `scripts/verify-mobile.mjs` (Playwright) as the layout gate.

**Spec:** `plan/36-video-spec.md` § 3 and § 7 (the anchor) · `plan/40-decisions.md` D-108 and D-108א (the UX plan) · D-084 (the write path) · § 4.2יג / § 4.2יג-ב ⓑ ⓒ (carried forward, ⛔ not cancelled).

**Register rows this plan covers:** `T-185` · `T-186` · `T-187` · `T-188`.

---

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **🎯 The renders are `docs/design/kol-A-05-story.png` (reading) and `docs/design/kol-A-06-question.png` (question).** Their exact strings, positions, sizes and order live in `docs/design/render_video_A.py` — `STORY`, `KNOWN`, `GLOSS`, `ST_X/ST_Y/ST_W/ST_H`, `ST_PAD/ST_LINE`, `QUESTION`, `layout_story`, `story_question`, `screen_story`. Read those before writing markup; ⛔ do not read the values off the PNG by eye.
- **`36 § 14.4` reversed on 24/08: הרנדר מחייב — פריסה וגימור כאחד.** The retired sentence «הגימור מגיע מהחוקה» is ⛔ no longer an answer to a gap from the render. **The single carve-out is חוקה שכבה A (נגישות)** — contrast floors, 44px, ⛔ no state in colour alone, Hebrew font coverage, `min-h-[100dvh]` (⛔ never `h-screen`), zero horizontal scroll at 320/375/414, `prefers-reduced-motion`, SVG icons and ⛔ no emoji. Layer A beats the render, always; nothing else does. A real tool limitation in the render is a **finding**, ⛔ not a silent deviation.
- **Every string a learner sees is Hebrew, RTL, `dir="rtl"`.** English appears ONLY inside `<EnWord>` / `<EnText>` from `components/EnWord.tsx`.
- **`/lib/core` is pure:** ⛔ zero React, `window`, `document`, `localStorage`, `sessionStorage`, `process.env`, `fetch`. Enforced by `npm run check:core`.
- **A UI component NEVER touches the database.** Everything goes through `app/api/*` and `lib/api/client.ts`.
- **Level filtering is `words.cefr_profile_band`**, ⛔ never `senses.cefr_level`.
- **Radius scale is five values only:** `md` 6 · `lg` 8 · `xl` 12 · `2xl` 16 · `rounded-full`. Glow is allowed only on `--brand` / `--brand-surface`, max two per screen, ⛔ never on body text. ⛔ Claymorphism banned.
- **`36 § 3` numbers, and they are the only ones:** line-height **≥34px** · vertical tap padding **8px each side** · horizontal hit area **≥32px** centred · ambiguity chip when two hit areas overlap. They already live as `MIN_LINE_HEIGHT` / `MIN_TAP_PAD_Y` / `MIN_HIT_WIDTH` in `scripts/story-tap-audit.mjs` — ⛔ do not restate them in a component.
- **The single agreed fallback path:** a condition of `36 § 3` that fails when measured at 320/375/414 ⇒ go back to tapping the **line** per § 4.2יג-ב ⓐ (old wording). ⛔ There is no third path, and ⛔ no tapping a word without the guards.
- **⛔ Never invent learning content.** Story bodies come from `public.stories`; questions come from `data/generated/story-questions-2026-08-25.jsonl`, which CONTENT delivered in C-0295 and which passed `storyQuestionGate` 12/12.
- **`docs/api-contract.md` is updated in the SAME commit as any endpoint change.**

---

## File Structure

| File | Created / Modified | Responsibility |
|---|---|---|
| `lib/core/storyPick.ts` | Create | PURE. Order the level's stories, pick today's, return `{ story, index, total }`. Zero `Math.random`, zero clock. |
| `lib/core/storyPick.test.ts` | Create | Determinism, the day roll, the read-set skip, the empty list. |
| `lib/supabase/stories.ts` | Create | The single PostgREST read of `public.stories` + the learner's known headwords. Nothing else imports PostgREST for stories. |
| `app/api/world/story/route.ts` | Create | `GET`. ENV → session → query, exactly the C-0032 order. Soft-read semantics of `/api/world/status`. |
| `app/api/world/story/route.test.ts` | Create | Guard order, the soft empty answer, ⛔ no 503 on "no stories". |
| `components/StoryScreen.tsx` | Create | The reading screen: header, status row, `data-story-body`, legend, footer meta, primary action. |
| `components/WordPopover.tsx` | Create | The one popover: word · translation · part of speech · one button. |
| `lib/core/storyTapTargets.ts` | Create | PURE. Body text + gloss map → the segment list the paragraph renders, marking which segments are tap targets and which are `ידעתי`. |
| `lib/core/storyTapTargets.test.ts` | Create | Function words are never targets · no-translation words are never targets · segments rejoin to the original body. |
| `lib/core/contextTapRequest.ts` | Create | PURE. The wire shape of the attempts-only write. ⛔ No `grade` field exists on the type. |
| `app/api/review/context/route.ts` | Create | `POST`. `attempts + 1` and nothing else. Source-scanned for six banned names. |
| `app/api/review/context/route.test.ts` | Create | The six-name source scan + the `repetition=3` truth test. |
| `lib/core/storyQuestion.ts` | Create | PURE. Deterministic answer shuffle keyed on the story id. |
| `lib/core/storyQuestion.test.ts` | Create | Same id ⇒ same order · the correct answer is not always index 0 and not always longest. |
| `components/StoryEndScreen.tsx` | Create | Question label, English question, three Hebrew answers, icon+label feedback, the `עברת על N` line, `הסיפור הבא`. |
| `supabase/migrations/0019_story_questions.sql` | Create | `public.story_questions`, its own table. ⛔ Not columns on `stories`. |
| `scripts/build-story-questions-sql.mjs` | Create | `data/generated/story-questions-*.jsonl` → `supabase/seed/0005_story_questions.sql`. |
| `app/(tabs)/world/story/page.tsx` | Create | The product route. ⛔ Zero data access — it renders `<StoryScreen />`. |
| `app/dev/story/page.tsx` | Create | Layout fixture, fed by prop, no server call. |
| `app/dev/story/done/page.tsx` | Create | Layout fixture for the end screen, fed by prop. |
| `scripts/verify-mobile.mjs` | Modify | Add `/world/story`, `/dev/story`, `/dev/story/done` to `ROUTES`. |
| `docs/api-contract.md` | Modify | `GET /api/world/story` and `POST /api/review/context`. |
| `lib/api/client.ts` | Modify | Add `apiPost` if it is absent; ⛔ do not add a second fetch anywhere else. |

**Why `/api/review/context` is a new route and ⛔ not a flag on `/api/review`** — a reversible call under `RULES § 0.16`, logged in the tick summary: `checkReviewPayload` in `lib/core/reviewRequest.ts:24-34` requires `grade ∈ {again,good}` and the route then runs `applyGrade` + `scheduleReview`. Making `grade` optional would make the SM-2 write path conditional inside one function, and a conditional write is exactly what a source scan cannot prove absent. A separate file can be scanned for the six names and fail by name.

---

## Interfaces (the whole plan, in one place)

```ts
// lib/core/storyPick.ts
export interface StoryCandidate {
  readonly id: string;
  readonly titleEn: string;
  readonly bodyEn: string;
  readonly createdAt: string;
}
export interface StoryPickInput {
  readonly stories: readonly StoryCandidate[];
  readonly dayIndex: number;
  readonly readStoryIds: ReadonlySet<string>;
}
export interface StoryPick {
  readonly story: StoryCandidate;
  readonly index: number;
  readonly total: number;
}
export function dayIndexFromIsoDate(isoDate: string): number;
export function orderStories(stories: readonly StoryCandidate[]): readonly StoryCandidate[];
export function pickStory(input: StoryPickInput): StoryPick | null;

// lib/core/storyTapTargets.ts
export interface StoryGloss {
  readonly translationHe: string;
  readonly posHe: string;
}
export interface StorySegment {
  readonly text: string;
  readonly lemma: string | null;
  readonly isTarget: boolean;
  readonly isKnown: boolean;
}
export function buildStorySegments(
  bodyEn: string,
  glosses: ReadonlyMap<string, StoryGloss>,
  knownLemmas: ReadonlySet<string>,
): readonly StorySegment[];

// lib/core/contextTapRequest.ts
export type ContextTapPayload = { readonly wordId: string };
export type ContextTapCheck =
  | { readonly ok: true; readonly payload: ContextTapPayload }
  | { readonly ok: false; readonly code: 'unavailable' };
export function checkContextTapPayload(body: unknown): ContextTapCheck;

// lib/core/storyQuestion.ts
export interface StoryQuestion {
  readonly questionEn: string;
  readonly answersHe: readonly string[];
  readonly correctIndex: number;
}
export function shuffleAnswers(question: StoryQuestion, storyId: string): StoryQuestion;
```

**Wire shape — `GET /api/world/story`:**

```json
{ "ok": true,
  "story": { "id": "…", "titleEn": "The letter in the book", "bodyEn": "…" },
  "index": 3, "total": 12, "level": "A1",
  "glosses": { "library": { "translationHe": "סִפְרִיָּה", "posHe": "שם עצם", "wordId": "…" } },
  "knownLemmas": ["river", "book"],
  "counts": { "newWords": 5, "alreadyKnown": 2 },
  "stories": { "atLevel": 12, "required": 3 } }
```

`{ "ok": false, "code": "no_level" | "no_stories" | "session_expired" | "schema_missing" | "unavailable" }` for the rest. **`no_stories` answers 200 with `ok:false`, ⛔ not 503** — F-040 / C-0255: `/api/world/status` already treats an absent stories table as a soft read, and a 503 here would blank the tab for every learner.

---

### Task 1: T-185ⓐ — the pure picker

**Files:**
- Create: `lib/core/storyPick.ts`
- Test: `lib/core/storyPick.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `StoryCandidate`, `StoryPickInput`, `StoryPick`, `dayIndexFromIsoDate`, `orderStories`, `pickStory` — exactly as written in the Interfaces block above. Task 2 imports all six.

**Why a day index and ⛔ not `Math.random`:** T-185's closed failure scenario is «בחירה אקראית ⇒ רענון באמצע סיפור מקפיץ לסיפור אחר». § 4.2יג states the mechanism outright — «סיפור אחד ביום», and D-108 question 2 says «מחר יש סיפור אחר». A day index gives both, costs ⛔ zero columns and ⛔ zero migration, and makes `סיפור 3 מתוך 12` a real number instead of a permanent `1`.

- [x] **Step 1: Write the failing test** into `lib/core/storyPick.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { dayIndexFromIsoDate, orderStories, pickStory, type StoryCandidate } from './storyPick';

const S = (n: number): StoryCandidate => ({
  id: `id-${n}`,
  titleEn: `Story ${n}`,
  bodyEn: `body ${n}`,
  createdAt: `2026-08-${String(10 + n).padStart(2, '0')}T00:00:00Z`,
});
const TWELVE = [S(11), S(1), S(7), S(3), S(9), S(5), S(12), S(2), S(8), S(4), S(10), S(6)];

describe('orderStories — ⛔ deterministic, ⛔ not insertion order', () => {
  it('orders by createdAt then id, and is stable across two calls', () => {
    const a = orderStories(TWELVE).map((s) => s.id);
    const b = orderStories([...TWELVE].reverse()).map((s) => s.id);
    expect(a).toEqual(b);
    expect(a[0]).toBe('id-1');
  });
});

describe('dayIndexFromIsoDate', () => {
  it('advances by exactly one per calendar day', () => {
    expect(dayIndexFromIsoDate('2026-08-26') - dayIndexFromIsoDate('2026-08-25')).toBe(1);
  });
  it('is the same number for the same date, always', () => {
    expect(dayIndexFromIsoDate('2026-08-25')).toBe(dayIndexFromIsoDate('2026-08-25'));
  });
});

describe('pickStory — the failure scenario T-185 closes', () => {
  const day = dayIndexFromIsoDate('2026-08-25');

  it('two loads of the same state return the SAME story', () => {
    const a = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    const b = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    expect(a?.story.id).toBe(b?.story.id);
  });

  it('tomorrow is a different story', () => {
    const a = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    const b = pickStory({ stories: TWELVE, dayIndex: day + 1, readStoryIds: new Set() });
    expect(a?.story.id).not.toBe(b?.story.id);
  });

  it('reports a 1-based position in the ordered list and the real total', () => {
    const picked = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    const ordered = orderStories(TWELVE).map((s) => s.id);
    expect(picked?.total).toBe(12);
    expect(picked?.index).toBe(ordered.indexOf(picked!.story.id) + 1);
    expect(picked?.index).toBeGreaterThanOrEqual(1);
  });

  it('skips stories already read this session', () => {
    const first = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() })!;
    const second = pickStory({
      stories: TWELVE,
      dayIndex: day,
      readStoryIds: new Set([first.story.id]),
    })!;
    expect(second.story.id).not.toBe(first.story.id);
  });

  it('⛔ never blocks reading: every story read ⇒ still returns one', () => {
    const all = new Set(TWELVE.map((s) => s.id));
    expect(pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: all })).not.toBeNull();
  });

  it('an empty level is null, ⛔ not a throw', () => {
    expect(pickStory({ stories: [], dayIndex: day, readStoryIds: new Set() })).toBeNull();
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/storyPick.test.ts`
Expected: FAIL — `Failed to resolve import "./storyPick"`.

- [x] **Step 3: Write `lib/core/storyPick.ts`**

```ts
/**
 * PURE. ⛔ Zero React, DOM, network, clock, env — `npm run check:core` enforces it.
 *
 * ⛔ **ZERO `Math.random`, and that is the whole point of the file (T-185ⓐ).** Two loads
 * of the same state must return the same story, or a learner who refreshes mid-read is
 * thrown into a different one and concludes the product is broken.
 *
 * The day index is the mechanism § 4.2יג already names — «סיפור אחד ביום» — and D-108
 * question 2 — «מחר יש סיפור אחר». It costs ⛔ zero columns and ⛔ zero migration.
 * The clock itself stays in the route: this file is handed an ISO date, exactly the way
 * `app/api/review/route.ts` hands `toIsoDateInZone(...)` down.
 */
export interface StoryCandidate {
  readonly id: string;
  readonly titleEn: string;
  readonly bodyEn: string;
  readonly createdAt: string;
}

export interface StoryPickInput {
  readonly stories: readonly StoryCandidate[];
  readonly dayIndex: number;
  readonly readStoryIds: ReadonlySet<string>;
}

export interface StoryPick {
  readonly story: StoryCandidate;
  readonly index: number;
  readonly total: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Whole days since the epoch for a YYYY-MM-DD string. ⛔ Reads no clock. */
export function dayIndexFromIsoDate(isoDate: string): number {
  const m = ISO_DATE.exec(isoDate);
  if (!m) return 0;
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY);
}

/** `createdAt` then `id` — `id` breaks a tie so two rows written in the same
 *  transaction cannot swap places between two reads. */
export function orderStories(stories: readonly StoryCandidate[]): readonly StoryCandidate[] {
  return [...stories].sort((a, b) =>
    a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt),
  );
}

export function pickStory({ stories, dayIndex, readStoryIds }: StoryPickInput): StoryPick | null {
  const ordered = orderStories(stories);
  const total = ordered.length;
  if (total === 0) return null;

  const start = ((dayIndex % total) + total) % total;
  for (let step = 0; step < total; step += 1) {
    const at = (start + step) % total;
    const candidate = ordered[at];
    if (!readStoryIds.has(candidate.id)) return { story: candidate, index: at + 1, total };
  }
  // Every story read. ⛔ Reading is never blocked — the day's story comes back.
  return { story: ordered[start], index: start + 1, total };
}
```

- [x] **Step 4: Run the tests and the purity gate**

Run: `npx vitest run lib/core/storyPick.test.ts && npm run check:core`
Expected: PASS, and `/lib/core purity: OK`.

- [x] **Step 5: Commit**

```bash
./scripts/g add lib/core/storyPick.ts lib/core/storyPick.test.ts
./scripts/g commit -m "loop(DEV): T-185a deterministic story pick, zero Math.random"
```

---

### Task 2: T-185ⓑ ⓒ — the read and the route

**Files:**
- Create: `lib/supabase/stories.ts`
- Create: `app/api/world/story/route.ts`
- Test: `app/api/world/story/route.test.ts`
- Modify: `docs/api-contract.md`

**Interfaces:**
- Consumes: `pickStory`, `dayIndexFromIsoDate`, `StoryCandidate` from `lib/core/storyPick.ts` (Task 1) · `parseLevel` from `lib/core/levelSummary.ts` · `STORIES_PER_LEVEL` from `lib/core/storyGate.ts` · `storyLemma` from `lib/core/storyGate.ts` · `createRouteClient`, `readSupabaseEnv` from `lib/supabase/auth.ts` · `LEARNER_TIME_ZONE`, `toIsoDateInZone` from `lib/core/onboarding.ts`.
- Produces: the `GET /api/world/story` body in the Interfaces block. Task 3's `StoryScreen` consumes exactly that and nothing more.

**Copy the guard order from `app/api/world/status/route.ts` verbatim:** ENV → `getUser()` → query (C-0032). An unauthenticated caller learns nothing about the shape of the endpoint.

- [x] **Step 1: Write the failing route test** into `app/api/world/story/route.test.ts`

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/story/route.ts', 'utf8');

describe('T-185ⓒ — a soft read, ⛔ never a 503 over "no stories"', () => {
  it('answers no_stories with 200 and ok:false', () => {
    expect(SRC).toMatch(/code:\s*'no_stories'/);
    const block = SRC.slice(SRC.indexOf("'no_stories'"));
    expect(block.slice(0, 200)).not.toMatch(/status:\s*503/);
  });

  it('keeps the C-0032 guard order: env, then session, then query', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf("from('stories')"));
  });

  it('⛔ filters level on words.cefr_profile_band, ⛔ never senses.cefr_level', () => {
    expect(SRC).toContain('cefr_profile_band');
    expect(SRC).not.toMatch(/senses[^\n]*cefr_level/);
  });

  it('⛔ contains no Math.random — the pick is the pure layer’s job', () => {
    expect(SRC).not.toContain('Math.random');
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run app/api/world/story/route.test.ts`
Expected: FAIL — `ENOENT: app/api/world/story/route.ts`.

- [x] **Step 3: Write `lib/supabase/stories.ts`**

Three reads, each bounded, each failing into a value rather than an exception. `MAX_LEVEL_STORIES = 200` and `MAX_GLOSS_ROWS = 2000` are ceilings on what we are willing to read, the same class of constant as `MAX_BANK_ROWS` in `app/api/world/status/route.ts`.

```ts
import type { StoryCandidate } from '@/lib/core/storyPick';

export const MAX_LEVEL_STORIES = 200;
export const MAX_GLOSS_ROWS = 2000;

export type StoriesRead =
  | { readonly ok: true; readonly stories: readonly StoryCandidate[] }
  | { readonly ok: false; readonly code: 'schema_missing' | 'unavailable' };

export interface GlossRow {
  readonly wordId: string;
  readonly headword: string;
  readonly posHe: string;
  readonly translationHe: string;
}

export function toStoryCandidates(
  rows: readonly { id: string; title_en: string; body_en: string; created_at: string }[],
): readonly StoryCandidate[] {
  return rows.map((r) => ({
    id: r.id,
    titleEn: r.title_en,
    bodyEn: r.body_en,
    createdAt: r.created_at,
  }));
}
```

- [x] **Step 4: Write `app/api/world/story/route.ts`**

The Hebrew part-of-speech label is a UI string over the closed `words.pos` vocabulary of `supabase/migrations/0002_content_bank.sql` — nine values — and it is a **map in this route**, ⛔ not a new column and ⛔ not a translation invented at render time: `noun→שם עצם · verb→פועל · adjective→שם תואר · adverb→תואר הפועל · preposition→מילת יחס · conjunction→מילת חיבור · pronoun→כינוי · determiner→מילית · interjection→מילת קריאה`.

```ts
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const profile = await supabase.from('profiles').select('current_level').eq('id', user.id).maybeSingle();
  if (profile.error) return schemaAwareFailure('profile', profile.error);
  const level = parseLevel((profile.data as { current_level?: unknown } | null)?.current_level);
  // ⛔ No silent fall back to A1 (D-037). «Has not chosen» is a real state and the
  // screen sends the learner to the level scan, ⛔ not to a blank page.
  if (level === null) return NextResponse.json({ ok: false, code: 'no_level' });

  const rows = await supabase
    .from('stories')
    .select('id, title_en, body_en, created_at')
    .eq('cefr_level', level)
    .order('created_at', { ascending: true })
    .limit(MAX_LEVEL_STORIES);
  if (rows.error) return schemaAwareFailure('stories', rows.error);

  const stories = toStoryCandidates((rows.data ?? []) as never);
  const readStoryIds = new Set(
    (new URL(request.url).searchParams.get('read') ?? '').split(',').filter(Boolean),
  );
  const dayIndex = dayIndexFromIsoDate(toIsoDateInZone(new Date(), LEARNER_TIME_ZONE));
  const picked = pickStory({ stories, dayIndex, readStoryIds });
  // ⛔ 200, ⛔ not 503 — F-040 / C-0255. An empty level is a screen state, ⛔ not an outage.
  if (!picked) {
    return NextResponse.json({
      ok: false,
      code: 'no_stories',
      stories: { atLevel: stories.length, required: STORIES_PER_LEVEL },
    });
  }
  // …glosses + knownLemmas reads follow, then the body from the Interfaces block.
}
```

- [x] **Step 5: Run the route test and the type gate**

Run: `npx vitest run app/api/world/story/route.test.ts && npm run typecheck`
Expected: PASS.

- [x] **Step 6: Document the endpoint in `docs/api-contract.md`**

Add a `## GET /api/world/story` section directly after `## GET /api/world/status`, with the success body, the five `ok:false` codes, and one sentence on why `no_stories` is a 200. Same commit as the route — a stale contract is a 🟠 HIGH finding by the file's own header.

- [x] **Step 7: Commit**

```bash
./scripts/g add lib/supabase/stories.ts app/api/world/story/route.ts app/api/world/story/route.test.ts docs/api-contract.md
./scripts/g commit -m "loop(DEV): T-185bc GET /api/world/story, soft read, level from cefr_profile_band"
```

---

### Task 3: T-186 — the reading screen

**Files:**
- Create: `components/StoryScreen.tsx`
- Create: `app/(tabs)/world/story/page.tsx`
- Create: `app/dev/story/page.tsx`
- Modify: `scripts/verify-mobile.mjs`

**🎯 The render is `docs/design/kol-A-05-story.png`; its values are in `docs/design/render_video_A.py` (`screen_story`, lines 964–1010).** Per `36 § 14.4` **הרנדר מחייב — פריסה וגימור כאחד**, and the only carve-out is חוקה שכבה A (נגישות). Quoted from the renderer and binding:

| element | value from `render_video_A.py` |
|---|---|
| kicker | `העולם · סיפורים`, right-anchored, `INK_MUTED` |
| title | `title_en` via `<EnWord>` — ⛔ the render's Hebrew title is ⛔ not available, see below |
| subtitle | `סיפור ברמה שלך · הקש על מילה מודגשת לתרגום` |
| status row | level chip (`A1`, `BRAND` fill at 46 alpha, `rounded-full`) · reading bar · `סיפור 3 מתוך 12` right-anchored |
| body card | `ST_X=24 · ST_W=LW-48 · radius 22 → rounded-2xl` on `--surface-raised`, 1.2px `--border-subtle` |
| body line | `ST_LINE = 32` in the render — **⇒ 34px here.** Layer A / `36 § 3.2` beats the render; the gap is deliberate and is this row. |
| known word | thin `--success` underline (render: `river`, `book`) |
| new word | ⛔ **nothing** — § 4.2יג-ב ⓑ, ⛔ not cancelled |
| legend | `--success` swatch + the written word `ידועה` — «⛔ no state in colour alone» |
| footer meta | `5 מילים חדשות · 2 שכבר ידעת`, derived at render time from D-034's three counts — ⛔ zero column, ⛔ zero migration (D-043) |
| primary | `הסיפור הבא`, full width, `--brand-surface`, radius 16 → `rounded-2xl` |

**⚠️ The title gap, and ⛔ do not close it by inventing:** the render shows a Hebrew title («הספרייה של מאיה») and `public.stories` holds `title_en` only. ⛔ Do not translate at render time and ⛔ do not write a Hebrew title. The screen ships `title_en` inside `<EnWord>`, and the Hebrew-title column is a separate declared migration — D-108 already routed a line to Roy for it.

**Interfaces:**
- Consumes: the `GET /api/world/story` body (Task 2) · `apiGet` from `lib/api/client.ts` · `EnWord` from `components/EnWord.tsx` · `FAILURE_HE`, `RETRY_HE` from `lib/core/failure.ts`.
- Produces: `export default function StoryScreen(): React.JSX.Element` and `export function StoryScreenView(props: StoryScreenViewProps)` — the fixture in `app/dev/story/page.tsx` renders `StoryScreenView` with a prop and asks the server for nothing, exactly like `app/dev/lesson/page.tsx`.

- [x] **Step 1: Write the failing component test** into `components/StoryScreen.test.ts`

Follow the source-scan style already used across `components/*.test.ts` in this repo — these tests assert what the file **says**, because the harness that renders it is `check:mobile`.

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/StoryScreen.tsx', 'utf8');

describe('T-186 — the screen the render binds', () => {
  it('carries the three header strings verbatim', () => {
    expect(SRC).toContain('העולם · סיפורים');
    expect(SRC).toContain('סיפור ברמה שלך · הקש על מילה מודגשת לתרגום');
  });

  it('marks the paragraph so `check:mobile` can find it (T-183 contract)', () => {
    expect(SRC).toContain('data-story-body');
  });

  it('⛔ never pre-marks a new word — § 4.2יג-ב ⓑ', () => {
    expect(SRC).not.toMatch(/isNew[^\n]*underline|new-word-underline/);
  });

  it('the legend is written, ⛔ not only coloured', () => {
    expect(SRC).toContain('ידועה');
  });

  it('⛔ h-screen is banned; the page is min-h-[100dvh]', () => {
    expect(SRC).not.toContain('h-screen');
    expect(SRC).toContain('min-h-[100dvh]');
  });

  it('⛔ zero database access from a component', () => {
    expect(SRC).not.toContain('@/lib/supabase');
    expect(SRC).not.toMatch(/\bfetch\s*\(/);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/StoryScreen.test.ts`
Expected: FAIL — `ENOENT: components/StoryScreen.tsx`.

- [x] **Step 3: Write `components/StoryScreen.tsx`**

`'use client'`. State machine copied in shape from `components/CollectedWords.tsx`: `loading | ready | no_level | no_stories | schema_missing | session_expired | error`. `no_level` gives ONE action → `LEVEL_SCAN_HREF` from `lib/core/worldApps.ts`. `no_stories` gives ONE action and the server's own numbers (D-064 · D-066), never a hard-coded count.

- [x] **Step 4: Write the route and the fixture**

`app/(tabs)/world/story/page.tsx` renders `<StoryScreen />` and does ⛔ zero data access — the same decision as `app/(tabs)/world/collected/page.tsx`, whose comment explains why a second `getUser()` here would be a second session check that can disagree with the first. It sits inside `app/(tabs)/` so the five-tab bar stays visible, per the render; it is ⛔ not a flow screen and therefore carries ⛔ no `<ActionBar>` (D-028, one bar per screen).

`app/dev/story/page.tsx` renders `StoryScreenView` with a fixture prop and asks the server for nothing ⇒ it needs ⛔ no `EXPECTED_CONSOLE` entry, and an entry appearing there later would mean the measurement has silently gone back to reading the failure screen.

- [x] **Step 5: Register the three routes in `scripts/verify-mobile.mjs`**

Add to `ROUTES`, each with the one-line reason the file's own convention demands: `'/world/story'` (renders here, but with no Supabase env the route answers `session_expired` by its own contract ⇒ what is measured is the failure state a learner can meet), `'/dev/story'` and `'/dev/story/done'` (prop-fed fixtures — the only place the reading layout and the question layout exist in this run).

- [x] **Step 6: Measure it in a real browser at 320/375/414**

Run: `npm run check:mobile`
Expected: `ok /dev/story` at all three widths, `story paragraphs measured: 1`, zero horizontal scroll, and the `36 § 3` line reporting the exempt word count. **A failure here is a BLOCKER**, and the only agreed fallback is tapping the line per § 4.2יג-ב ⓐ.

- [x] **Step 7: Look at the screen, and compare it to the render**

Run: `npm run diff:render /dev/story docs/design/kol-A-05-story.png`
Record in the tick summary: heading · body character count · tappable count · under-44px count · horizontal scroll · console errors. ⛔ Not a pixel comparison — a human eye reports the gaps.

- [x] **Step 8: Commit**

```bash
./scripts/g add components/StoryScreen.tsx components/StoryScreen.test.ts "app/(tabs)/world/story/page.tsx" app/dev/story/page.tsx scripts/verify-mobile.mjs
./scripts/g commit -m "loop(DEV): T-186 /world/story reading screen, matched to kol-A-05"
```

---

### Task 4: T-187 — the word is the tap target

**Files:**
- Create: `lib/core/storyTapTargets.ts`
- Test: `lib/core/storyTapTargets.test.ts`
- Create: `components/WordPopover.tsx`
- Create: `lib/core/contextTapRequest.ts`
- Create: `app/api/review/context/route.ts`
- Test: `app/api/review/context/route.test.ts`
- Modify: `components/StoryScreen.tsx`
- Modify: `docs/api-contract.md`

**⛔ Do not start before `T-183` is closed** — it is (C-0274): `scripts/verify-mobile.mjs` exempts `[data-story-body] [data-story-word]` from the 44px floor and `scripts/story-tap-audit.mjs` judges the four conditions instead.

**The markup contract the audit already expects, and it is ⛔ not negotiable:** the paragraph carries `data-story-body` and, when two hit areas can overlap, `data-story-ambiguity="chip"`. Each target is a `data-story-word` **inside** it carrying `data-story-translation="<Hebrew>"`. The chip element is `[data-story-ambiguity-chip]` and its text must contain **both** words. Padding must be handed back as equal negative margin or `auditStoryBody` fails with `layout-shifted` — «המרווח באזור ההקשה בלבד, המראה ⛔ אינו משתנה».

**Interfaces:**
- Consumes: `FUNCTION_WORD_FLOOR`, `normalizeWord` semantics from `scripts/story-tap-audit.mjs` (mirrored, ⛔ not imported — that file is `.mjs` for the harness) · `storyLemma` from `lib/core/storyGate.ts` · the `glosses` map from Task 2.
- Produces: `buildStorySegments`, `StorySegment`, `StoryGloss` · `checkContextTapPayload`, `ContextTapPayload` · `export default function WordPopover(props: WordPopoverProps)`.

- [x] **Step 1: Write the failing pure test** into `lib/core/storyTapTargets.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { buildStorySegments, type StoryGloss } from './storyTapTargets';

const BODY = 'Every morning Maya walks to the old library near the river.';
const GLOSSES = new Map<string, StoryGloss>([
  ['library', { translationHe: 'סִפְרִיָּה', posHe: 'שם עצם' }],
  ['river', { translationHe: 'נָהָר', posHe: 'שם עצם' }],
  ['morning', { translationHe: 'בֹּקֶר', posHe: 'שם עצם' }],
]);

describe('36 § 3.1 — only content words that HAVE a translation', () => {
  const segments = buildStorySegments(BODY, GLOSSES, new Set(['river']));
  const targets = segments.filter((s) => s.isTarget).map((s) => s.text.trim());

  it('⛔ of · the · a · to are never targets', () => {
    for (const w of ['to', 'the', 'a', 'of']) expect(targets).not.toContain(w);
  });

  it('a word we cannot translate is simply not a target — ⛔ and there is no «no translation» state', () => {
    expect(targets).not.toContain('walks');
    expect(targets).not.toContain('Maya');
  });

  it('every target has a Hebrew translation behind it', () => {
    expect(targets.sort()).toEqual(['library', 'morning', 'river'].sort());
  });

  it('a word the learner marked ידעתי is marked known, ⛔ and a new word is marked nothing', () => {
    expect(segments.find((s) => s.text.trim() === 'river')?.isKnown).toBe(true);
    expect(segments.find((s) => s.text.trim() === 'library')?.isKnown).toBe(false);
  });

  it('⛔ the segments rejoin to the ORIGINAL body — an off-by-one here respaces the paragraph', () => {
    expect(segments.map((s) => s.text).join('')).toBe(BODY);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/storyTapTargets.test.ts`
Expected: FAIL — `Failed to resolve import "./storyTapTargets"`.

- [x] **Step 3: Write `lib/core/storyTapTargets.ts`**

Segment by character offsets, ⛔ never by `split(' ')` — the invariant `segments.map(s => s.text).join('') === bodyEn` is stated in `components/EnWord.tsx`'s own doc comment, and a producer that trims renders words glued together on the learner's screen. A token is a target when `storyLemma(token)` is in `glosses` **and** the normalised token is not in the function-word floor.

- [x] **Step 4: Write the failing write-path test** into `app/api/review/context/route.test.ts`

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/review/context/route.ts', 'utf8');
const BODY = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** D-084 · T-149ⓐ · T-187ⓕ — the six names, and the scan fails BY NAME. */
const BANNED = [
  'grade', 'easiness', 'interval_days', 'repetition',
  'next_review_at', 'self_marked_known',
];

describe('D-084 — a tap raises attempts and NOTHING else', () => {
  for (const field of BANNED) {
    it(`⛔ never writes ${field}`, () => {
      expect(BODY).not.toContain(field);
    });
  }

  it('⛔ never touches the decoupled arena table (D-052 · D-053)', () => {
    expect(BODY).not.toContain('arcade_collected_words');
  });

  it('one row per pair, ⛔ not one row per event (W4)', () => {
    expect(BODY).toMatch(/upsert|onConflict/);
  });

  it('the payload type itself has no grade — a field that does not exist cannot be written', () => {
    const wire = readFileSync('lib/core/contextTapRequest.ts', 'utf8');
    expect(wire).not.toContain('grade');
  });
});
```

- [x] **Step 5: Run it and watch it fail**

Run: `npx vitest run app/api/review/context/route.test.ts`
Expected: FAIL — `ENOENT: app/api/review/context/route.ts`.

- [x] **Step 6: Write `lib/core/contextTapRequest.ts` and `app/api/review/context/route.ts`**

The route reads `word_progress` for `(user_id, word_id)`, and either inserts a row with `attempts: 1` or upserts `attempts: row.attempts + 1`. **⛔ It selects and writes exactly two columns**, so the six banned names never appear in the file and the scan above is a real gate rather than a promise. Coupling is preserved (D-054): a `word_progress` row now exists, so the word leaves «טרם נראה» and «נשארו לך N מילים ברמה» moves — which is the whole gamification § 4.2יג promised.

- [x] **Step 7: Add the truth test to `app/api/review/context/route.test.ts`**

The source scan proves the file does not name the fields; this proves the behaviour. Stub the PostgREST client and assert the update payload:

```ts
it('a word at repetition=3 is still at repetition=3 after a tap, and next_review_at has not moved', async () => {
  const existing = { attempts: 7, repetition: 3, next_review_at: '2026-09-01T00:00:00Z' };
  const written: Record<string, unknown>[] = [];
  const supabase = stubClient({ existing, capture: (row) => written.push(row) });
  await handleContextTap(supabase, 'user-1', 'word-1');
  expect(written).toHaveLength(1);
  expect(Object.keys(written[0]).sort()).toEqual(['attempts', 'user_id', 'word_id']);
  expect(written[0].attempts).toBe(8);
});
```

- [x] **Step 8: Wire the popover into `components/StoryScreen.tsx`**

`components/WordPopover.tsx` shows, from the render's popover block (`render_video_A.py:1010-1032`): the word in `<EnWord>` · the Hebrew translation with niqqud, large and bold · the part of speech in `--brand-surface` · ONE button `הוסף לכרטיסיות` → after the write `✓ נוספה לחזרה` with the check icon on `--success`. Tapping another word closes the previous popover; tapping outside closes. **The learner presses, the product does not** — the same invariant as T-180.

- [x] **Step 9: Measure the four conditions in a real browser**

Run: `npm run check:mobile`
Expected: at 320, 375 and 414 — `story tap targets hold all four conditions of 36 § 3 (N words)`, and, if any two hit areas overlap, `a touch between two words offers both, never a guess (36 § 3.4)`. **Any of the four failing is a BLOCKER** ⇒ revert to tapping the line per § 4.2יג-ב ⓐ and file it. ⛔ There is no third path.

- [x] **Step 10: Document `POST /api/review/context` in `docs/api-contract.md`**

Body `{ "word_id": "<uuid>" }`, the `ok:true` answer, the codes, and one sentence naming D-084 and the six fields it does not write. Same commit.

- [x] **Step 11: Commit**

```bash
./scripts/g add lib/core/storyTapTargets.ts lib/core/storyTapTargets.test.ts lib/core/contextTapRequest.ts app/api/review/context/route.ts app/api/review/context/route.test.ts components/WordPopover.tsx components/StoryScreen.tsx docs/api-contract.md
./scripts/g commit -m "loop(DEV): T-187 word tap under the four conditions of 36 s3, attempts-only write (D-084, closes T-149)"
```

---

### Task 5: T-188 — the comprehension question and the way out

**Files:**
- Create: `supabase/migrations/0019_story_questions.sql`
- Create: `scripts/build-story-questions-sql.mjs`
- Create: `lib/core/storyQuestion.ts`
- Test: `lib/core/storyQuestion.test.ts`
- Create: `components/StoryEndScreen.tsx`
- Create: `app/dev/story/done/page.tsx`
- Modify: `app/api/world/story/route.ts`
- Modify: `docs/api-contract.md`

**🎯 The render is `docs/design/kol-A-06-question.png`; its values are in `docs/design/render_video_A.py` (`story_question`, lines 945–963).** `36 § 14.4` binds layout **and finish**; חוקה שכבה A (נגישות) is the only carve-out. Label `שאלת הבנה` centred in `--brand-surface` · the question in **English** via `<EnWord>` · three answers, each a `ST_W-32` wide row of height 50 at 62px pitch, radius 14 → `rounded-xl`, right-anchored Hebrew · on reveal, correct = `--success` fill at 46 alpha + `icon_check`, chosen-and-wrong = `--danger` — **icon + label both**, never colour alone.

**⛔ Zero score and ⛔ zero correctness counter** (`36 § 7`). Feedback only.

**⚠️ The question lives in its own table**, ⛔ not in columns on `stories`: a story with no question must stay readable. The comment on `public.stories` («⛔ אין כאן שאלה») was written before the vision closed; `36 § 7` wins, and this is how both stay true.

**Interfaces:**
- Consumes: `StoryQuestionRecord`, `ANSWERS_PER_QUESTION` from `lib/core/storyQuestionGate.ts` · the 12 gated rows in `data/generated/story-questions-2026-08-25.jsonl` (CONTENT, C-0295 — gate 12/12, negative control 0/5).
- Produces: `shuffleAnswers`, `StoryQuestion` · `export default function StoryEndScreen(props: StoryEndScreenProps)`.

- [x] **Step 1: Write the failing shuffle test** into `lib/core/storyQuestion.test.ts`

**The 23/08 lesson, applied:** a fixture whose three answers are the same length and the same shape is a hole, ⛔ not a test. These fixtures deliberately vary length and put the correct answer somewhere other than index 0.

```ts
import { describe, expect, it } from 'vitest';
import { shuffleAnswers, type StoryQuestion } from './storyQuestion';

const Q: StoryQuestion = {
  questionEn: 'Who wrote the letter that was in the book?',
  answersHe: ['אם', 'אנשים', 'חבר'],
  correctIndex: 2,
};

describe('T-188ⓓ — position comes from the story id, ⛔ not from write order', () => {
  it('the same story id gives the same order, every time', () => {
    const a = shuffleAnswers(Q, 'aaaaaaaa-0000-4000-8000-000000000001');
    const b = shuffleAnswers(Q, 'aaaaaaaa-0000-4000-8000-000000000001');
    expect(a.answersHe).toEqual(b.answersHe);
    expect(a.correctIndex).toBe(b.correctIndex);
  });

  it('correctIndex still points at the correct ANSWER after the shuffle', () => {
    const out = shuffleAnswers(Q, 'bbbbbbbb-0000-4000-8000-000000000002');
    expect(out.answersHe[out.correctIndex]).toBe(Q.answersHe[Q.correctIndex]);
    expect([...out.answersHe].sort()).toEqual([...Q.answersHe].sort());
  });

  it('⛔ the correct answer is not pinned to one position across stories', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `cccccccc-0000-4000-8000-00000000000${i.toString(16)}`);
    const positions = new Set(ids.map((id) => shuffleAnswers(Q, id).correctIndex));
    expect(positions.size).toBeGreaterThan(1);
  });

  it('⛔ the correct answer is not the longest one — the fixture proves the screen cannot be gamed by length', () => {
    const longWrong: StoryQuestion = {
      questionEn: 'What did the mother say is the best thing about her job?',
      answersHe: ['אנשים', 'כסף שהיא מקבלת בכל חודש', 'משפחה'],
      correctIndex: 0,
    };
    const out = shuffleAnswers(longWrong, 'dddddddd-0000-4000-8000-000000000003');
    const longest = out.answersHe.reduce((a, b) => (b.length > a.length ? b : a));
    expect(out.answersHe[out.correctIndex]).not.toBe(longest);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/storyQuestion.test.ts`
Expected: FAIL — `Failed to resolve import "./storyQuestion"`.

- [x] **Step 3: Write `lib/core/storyQuestion.ts`**

A Fisher–Yates walk driven by a small integer hash of the story id — ⛔ zero `Math.random`, for the same reason `lib/core/storyPick.ts` has none: a learner who refreshes must see the answers in the same order, or the screen looks like it is cheating.

- [x] **Step 4: Write `supabase/migrations/0019_story_questions.sql`**

Copy the shape of `supabase/migrations/0018_stories.sql` exactly — it is the house pattern and its guard test already exists: `begin;` / `commit;` · `create table if not exists public.story_questions` · **⛔ no constraint declared inside `create table`** (a second run skips the whole statement — measured C-0032), each named constraint added inside `do $$ … end $$` · RLS enabled with one `select` policy for `authenticated` · `revoke all` then `grant select` · ⛔ no insert/update/delete for the client. Columns: `id uuid pk`, `story_id uuid not null references public.stories(id) on delete cascade`, `question_en text not null`, `answers_he text[] not null`, `correct_index int not null`, `origin text not null` (`check (origin = 'generated')`), `created_at timestamptz not null default now()`, `unique (story_id)`.

- [x] **Step 5: Write the migration guard test** into `lib/supabase/storyQuestions.test.ts`

Mirror `lib/supabase/stories.test.ts` — it proves what the file **says**, not that it ran. Whitelist the comments away first (`F-087` · `F-088`), then assert the transaction, `if not exists`, the named constraints outside `create table`, the single `select` policy, and that `answers_he` is length-checked against `ANSWERS_PER_QUESTION`.

- [x] **Step 6: Push the migration and verify it landed**

⚠️ Connect first with the two commands the scheduled task supplied — they live there and ⛔ nowhere in this repo.

```bash
supabase db push
node -e "1" # then confirm via list_migrations that 0019 is applied
```
Expected: `0019_story_questions` applied. ⛔ Do not leave the `.sql` for Roy to run by hand.

- [x] **Step 7: Write `scripts/build-story-questions-sql.mjs`**

Same shape as `scripts/build-stories-sql.mjs`: read `data/generated/story-questions-*.jsonl`, re-run `storyQuestionGate` on every row, **stop rather than write an empty file** (a seed with no rows looks like an ingest that succeeded), and write `supabase/seed/0005_story_questions.sql`. Add `"build:questions"` to `package.json` scripts next to `build:stories`.

- [x] **Step 8: Write `components/StoryEndScreen.tsx` and `app/dev/story/done/page.tsx`**

Strings, verbatim: `שאלת הבנה` · the English question in `<EnWord>` · three Hebrew answers · on choice, an SVG icon **and** a Hebrew label · then `עברת על N מילים שהיו בתור החזרה שלך` — **«עברת על», ⛔ never «אתה יודע אותן»** (§ 4.2יג-ב ⓒ, ⛔ not cancelled) — the exit `לתרגל אותן בכרטיסיות`, and the primary action `הסיפור הבא`, which reloads `GET /api/world/story?read=<ids seen this session>`.

- [x] **Step 9: Measure and compare**

Run: `npm run check:mobile && npm run diff:render /dev/story/done docs/design/kol-A-06-question.png`
Expected: `ok /dev/story/done` at 320/375/414, every answer row ≥44px (⛔ these are list rows, ⛔ not inline reading targets — the `36 § 3` exemption does ⛔ not reach them), zero horizontal scroll.

- [x] **Step 10: Commit**

```bash
./scripts/g add supabase/migrations/0019_story_questions.sql lib/supabase/storyQuestions.test.ts scripts/build-story-questions-sql.mjs lib/core/storyQuestion.ts lib/core/storyQuestion.test.ts components/StoryEndScreen.tsx app/dev/story/done/page.tsx app/api/world/story/route.ts docs/api-contract.md package.json
./scripts/g commit -m "loop(DEV): T-188 comprehension question, own table, deterministic answer order"
```

---

### Task 6: the full gate, and only then a claim

- [ ] **Step 1: Regenerate every generated file whose input this plan touched**

Run: `npm run build:questions && npm run measure:gate && npm run measure:plan`
`RULES § 0.1.1 ח׳` — a content tick reddened `dev` on 24/08 for exactly this. Both `docs/plan-tables.md` and `docs/plan-open.md` go in the SAME commit as the register edit.

- [ ] **Step 2: Run the full gate, in this message, before any claim**

Run: `npm run verify`
Expected: five commands green — `typecheck`, `check:core`, `test`, `build`, `check:mobile`. Banned words for this step: «should work» · «looks fine» · «passed earlier» · «the subagent reported success». Failing and unfixable in this tick ⇒ `./scripts/g revert` plus a debt entry in `plan/30-architecture.md`.

- [ ] **Step 3: Close the registers and hand off**

Update `plan/50-tasks.md` (T-185 · T-186 · T-187 · T-188 · T-149 → 🟣, milestone cells ⛔ untouched), `plan/60-findings.md`, `plan/30-architecture.md`, and `plan/00-control.md` (CYCLE_ID, ACTIVE_TASK_ID, `NEXT_AGENT=CRITIC`, release LOCK), plus one journal line.

- [ ] **Step 4: Push to `work/current`, and ⛔ nowhere else**

```bash
./scripts/g push origin work/current
```
⛔ Never to `dev` — QA merges, and only `--ff-only`. ⛔ Never touch `main`. The wrapper is
mandatory and so is the retry rule (`plan/RULES.md` § 0.14ג): a network or proxy failure is
retried ONCE through `./scripts/g` before it is believed. Branch names are ⛔ never invented —
`work/current` is the name, and it is set in `plan/00-control.md` as `WORKING_BRANCH`.

---

## Self-Review

**1. Spec coverage.** `36 § 7` header → Task 3 · status row → Task 3 · body LTR-in-RTL ≥34px → Tasks 3 and 4 · known-word underline and ⛔ no pre-marking → Tasks 3 and 4 · popover with four elements and one button → Task 4 · `attempts`-only write → Task 4 · end screen with question, feedback, `עברת על N` and the exit → Task 5. `36 § 3` conditions 1–4 → Task 4, measured by `scripts/story-tap-audit.mjs`. D-108's empty state and arrival/exit → Task 3. D-108א's English-question / Hebrew-answers shape and the anti-gaming fixture → Task 5.

**2. Placeholders.** No step says «implement the component», «add error handling» or «write tests for the above». Every step names a file with an extension or a runnable command.

**3. Type consistency.** `StoryCandidate` is defined once (Task 1) and imported by Tasks 2 and 5. `StoryPick.index` is 1-based in the test, the implementation and the wire body. `buildStorySegments` has the same three parameters in the Interfaces block, the test and Task 4's step 3. `shuffleAnswers(question, storyId)` has the same argument order everywhere.

**Two gaps this plan records rather than invents:**
- **The Hebrew story title has no column.** The screen ships `title_en` in `<EnWord>`; D-108 already routed the migration to Roy. ⛔ Not translated at render time.
- **There is no store of «stories already read».** `readStoryIds` is a real parameter of `pickStory` and is supplied per-session by the client through `?read=`; the day index carries «one story a day» on its own with ⛔ zero columns. A durable read-store touches learner progress and is therefore a **PM decision**, ⛔ not a DEV call.
