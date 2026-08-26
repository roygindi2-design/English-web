# 2026-08-26 · `story` slice C — the question becomes a state, and three strings stop lying

**Tasks covered:** `T-202` (F-124) · `T-203` (F-123) · `T-150` (the intro layer).
**Decision:** `D-115` (PM, C-0302) · anchor `plan/36-video-spec.md § 7` · `§ 4.2יג` · `T-151ⓓ`.

🎯 **The renders this plan targets:** `docs/design/kol-A-05-story.png` (phase `reading`) and
`docs/design/kol-A-06-question.png` (phase `question`). Layout values were taken from
`docs/design/render_video_A.py` — `screen_story` (lines 964–1010) and `story_question`
(lines 945–963) — ⛔ by grep, ⛔ not from the eye.

## 0 · The measurement this plan rests on, and what the render actually proves

`render_video_A.py:964` is a single function with a `question` flag:

```python
def screen_story(c, t, active=None, pop=0.0, added=False, question=False, q_sel=None, q_rev=False):
    ...  # kicker · title · subtitle · A1 chip · progress bar · "סיפור 3 מתוך 12"
    c.rr(ST_X, ST_Y, ST_W, ST_H, 22, fill=RAISED)          # ⇦ ONE body card
    if question:
        story_question(c, t, sel=q_sel, revealed=q_rev)     # ⇦ the ONLY thing that swaps
    else:
        for word, key, x, y, wpx in layout_story(c): ...
    c.txt(LW - 24, ST_Y + ST_H + 30, "5 מילים חדשות · 2 שכבר ידעת", ...)   # ⇦ chrome, both frames
    c.line(48, ...); c.txt(84, ..., "ידועה", ...)                          # ⇦ chrome, both frames
    c.rr(24, ST_Y + ST_H + 50, LW - 48, 54, 16, fill=BRAND_SURFACE)        # ⇦ ONE primary button
```

⇒ The render itself settles the shape: **the chrome is drawn once, outside the swap, and only
the body card differs.** That is `T-202ⓐ`, measured and ⛔ not inferred.

### ⛔ `36 § 14.4` — the render binds, layout **and finish alike**

Radius 22 → `rounded-2xl`; answer rows `ST_W - 32` wide, height 50, pitch 62, radius 14 →
`rounded-xl`; the `שאלת הבנה` label centred on `BRAND_SURFACE`; the question centred in `INK`
and **in English**; the primary button full width, height 54, radius 16 → `rounded-2xl` on
`BRAND_SURFACE`. **Layer A of the constitution is the ONLY carve-out**, and it is used exactly
twice in this plan, both times with the number that was measured:

| Deviation | Layer-A ground |
|---|---|
| `ST_LINE = 32` in the render → `leading-[34px]` in code | `36 § 3.2` line height ≥34px. Already shipped in T-186; ⛔ this plan does not touch it. |
| Answer rows are 50px tall in the render → `min-h-touch` (44px floor, and the row grows) | `36 § 3` exempts **inline targets inside a reading paragraph only**. A list row is ⛔ not one. Already shipped in T-188; ⛔ this plan does not touch it. |

### ⛔ Three deviations from the render that are DECIDED, ⛔ not drift (D-115 § 4)

`render_video_A.py` prints `הקש על מילה מודגשת לתרגום`, draws a brand chip behind every new
target (lines 986–993), and prints `הסיפור הבא` in **both** frames. All three contradict
`36 § 7` or `T-151ⓓ`, and `36 § 1` gives 36 the win. The renders are anchor artifacts and are
⛔ **not edited here**. `plan/03-for-roy.md` item 60 carries the stamped line. ⇒ a `diff:render`
reviewer who sees these three deltas is looking at **D-115**, ⛔ not at a gap.

## 1 · File Structure

| File | New / edited | What |
|---|---|---|
| `package.json` | edited | devDeps `jsdom` · `@testing-library/react` · `@testing-library/dom` (Step 1) |
| `vitest.config.ts` | edited | `environment: 'node'` stays the default; jsdom is opted into per file |
| `lib/core/storyIntro.ts` | **new** | PURE. `T-150` — `{total, known}` derived at display time |
| `lib/core/storyIntro.test.ts` | **new** | `T-150` truth test + the mutation that must fail by name |
| `components/StoryScreen.tsx` | edited | `T-202ⓐⓒⓓ` phase · `T-203ⓐⓑⓒ` strings · `T-150` intro layer |
| `components/StoryEndScreen.tsx` | edited | `T-202ⓑ` becomes a body card; `onNextStory` deleted |
| `app/dev/story/done/page.tsx` | **replaced** | `T-202ⓔ` renders the WHOLE screen in phase `question` |
| `components/StoryScreen.test.ts` | edited | source scans: the two dead strings fail **by name** |
| `components/StoryScreen.dom.test.tsx` | **new** | the render tests `T-202` and `T-203` name |
| `docs/api-contract.md` | ⛔ **untouched** | ⛔ zero endpoint change in this plan — `question` already ships (line 706) |

## 2 · Interfaces

```ts
// lib/core/storyIntro.ts — PURE. ⛔ zero React, window, document, fetch, env.
export interface StoryIntro {
  /** Story words that have a sense with us. ⛔ A word with no gloss is in NEITHER number (T-150ⓓ). */
  readonly total: number;
  /** Of those, the ones the learner already carries. ⛔ Never «how many are missing» (T-150ⓒ). */
  readonly known: number;
}
export function storyIntro(
  lemmasWithSense: readonly string[],
  knownLemmas: readonly string[],
): StoryIntro;

// components/StoryScreen.tsx
export type StoryPhase = 'reading' | 'question';

/** ⛔ `question` is ALREADY on the wire (docs/api-contract.md:706). ⛔ No endpoint change. */
export interface StoryPayload {
  readonly story: { readonly id: string; readonly titleEn: string; readonly bodyEn: string };
  readonly index: number;
  readonly total: number;
  readonly level: string;
  readonly glosses: Readonly<Record<string, StoryGlossWire>>;
  readonly knownLemmas: readonly string[];
  readonly counts: { readonly newWords: number; readonly alreadyKnown: number };
  readonly question: StoryQuestion | null;   // ⇦ ADDED. `null` ⇒ the phase never opens.
}

export interface StoryScreenViewProps {
  readonly state: ScreenState;
  readonly onRetry?: () => void;
  /** ⛔ FIXTURES ONLY (T-202ⓔ). The product path always starts at `reading`. */
  readonly initialPhase?: StoryPhase;
}

// components/StoryEndScreen.tsx — ⛔ `onNextStory` is DELETED (T-202ⓑ).
export interface StoryEndScreenProps {
  readonly storyId: string;
  readonly question: StoryQuestion;
  readonly reviewedCount: number;
}
```

### ⛔ Where `reviewedCount` comes from, written down so nobody invents it

`app/api/world/story/route.ts:195-203` builds `knownLemmas` from **every `word_progress` row**
joined to a word that carries a gloss — ⛔ it does **not** apply D-034's predicate. ⇒
`counts.alreadyKnown` is literally «story lemmas that already sit in the learner's queue»,
which is exactly the `36 § 7` sentence `עברת על N מילים שהיו בתור החזרה שלך`.
⇒ **`reviewedCount={payload.counts.alreadyKnown}`, and ⛔ no new field, ⛔ no new column.**

⚠️ **And that same number is printed in the footer as `N שכבר ידעת`, which asserts D-034
knowledge from a set that only proves «has a progress row».** That is a second string that
promises more than it has — the F-123 class, one line lower. It is **filed as a finding for the
PM** and it ⛔ **does not block this plan**: both readings of the number are already shipped.

## 3 · Steps

### Step 1 — the test environment these two tasks require (a reversible call, `RULES § 0.16`)

`vitest.config.ts` is `environment: 'node'` and its own comment says «a React render test does
not belong here — **add jsdom first** if that ever changes». `T-202` and `T-203` both specify
`screen.getByText(...)` **after one press** — a render test, ⛔ not a source scan. `T-202ⓔ` says
in writing why: *a fixture of a component in isolation is what let F-124 pass 1,119 green
checks.* ⇒ the environment is added, deliberately and with a trace.

- [x] Add the three devDeps to `./package.json` and confirm the tree resolves:
      `npm install -D jsdom @testing-library/react @testing-library/dom`
- [x] Confirm `vitest.config.ts` needs **no** global change — the new file opts in with a
      first-line `// @vitest-environment jsdom` docblock. Prove it:
      `npx vitest run components/StoryScreen.test.ts` still green under `node`.
- [ ] ⛔ **If the install is refused by the sandbox:** ⛔ do **not** downgrade the tests to
      source scans and call it done — that is the exact hole `T-202ⓔ` names. Write one finding
      in `plan/60-findings.md`, keep the source-scan half of Step 6 in
      `components/StoryScreen.test.ts`, and **say so in the report**.

### Step 2 — `T-150` pure first, red before green (`test-driven-development`)

- [x] Write `lib/core/storyIntro.test.ts` and run it red: `npx vitest run lib/core/storyIntro.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { storyIntro } from '@/lib/core/storyIntro';

describe('T-150 — «כמה מזה אתה כבר יודע», derived at display time', () => {
  const TEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  it('a story with 10 glossed words and a learner who carries 7 ⇒ {total:10, known:7}', () => {
    expect(storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual({ total: 10, known: 7 });
  });

  it('⛔ known is ⛔ NOT total-known — the mutation fails by name', () => {
    // total-known would be 3. If this ever passes with 3, the derivation was inverted.
    expect(storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g']).known).not.toBe(3);
  });

  it('⛔ a word with no sense is counted in NEITHER number (T-150ⓓ)', () => {
    // «zzz» is known to the learner but carries no gloss ⇒ it is not in the story vocabulary.
    expect(storyIntro(['a', 'b'], ['a', 'zzz'])).toEqual({ total: 2, known: 1 });
  });

  it('⛔ zero duplication: the same lemma twice is one word', () => {
    expect(storyIntro(['a', 'a', 'b'], ['a'])).toEqual({ total: 2, known: 1 });
  });
});
```

- [x] Implement `lib/core/storyIntro.ts` to green. ⛔ Zero React, DOM, network, clock, env —
      `npm run check:core` is the gate that proves it.

### Step 3 — `T-203`: the three strings, and the two source scans that fail by name

- [x] Edit `components/StoryScreen.tsx`: `SUBTITLE_HE` becomes `36 § 7` **verbatim** —
      `'סיפור ברמה שלך · הקש על מילה לתרגום'`. ⛔ The marking itself does ⛔ **not** change
      (D-115 § 1 rejected path ⓒ **on layer A**: known words already carry an underline, and a
      second one differing only in colour is «מצב שמקודד בצבע בלבד»).
- [x] In the same file replace `NEXT_STORY_HE` with two labels:
      `DONE_READING_HE = 'סיימתי לקרוא'` (phase `reading`) and
      `BACK_TO_WORLD_HE = 'חזרה לעולם'` (phase `question`). ⛔ `PRIMARY_ACTION_CLASS` and the
      ⛔ no-`data-primary-action` guard are **unchanged** — `/world/story` is ⛔ not a
      `FLOW_ROUTE` (`scripts/verify-mobile.mjs:202,221`), and this task changes labels only.
- [x] Delete `NEXT_STORY_HE` from `components/StoryEndScreen.tsx` together with its button.
- [x] Add the two failing-by-name scans to `components/StoryScreen.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/StoryScreen.tsx', 'utf8');
const END = readFileSync('components/StoryEndScreen.tsx', 'utf8');
const DONE_FIXTURE = readFileSync('app/dev/story/done/page.tsx', 'utf8');

describe('T-203 — a string that promises what the screen does not do', () => {
  it('⛔ zero «מודגשת»: nothing on the screen is emphasised, so nothing may say it is', () => {
    expect(SRC).not.toContain('מודגשת');
    expect(SRC).toContain('סיפור ברמה שלך · הקש על מילה לתרגום');
  });

  it('⛔ zero «הסיפור הבא» anywhere: `storyPick` is a DAY index (T-151ⓓ)', () => {
    expect(SRC).not.toContain('הסיפור הבא');
    expect(END).not.toContain('הסיפור הבא');
  });

  it('both phase labels exist, and they name what the button does', () => {
    expect(SRC).toContain('סיימתי לקרוא');
    expect(SRC).toContain('חזרה לעולם');
  });
});

describe('T-202 — the end state is a STATE, ⛔ not a screen', () => {
  it('⛔ StoryEndScreen ⛔ never claims a screen: no 100dvh, no section semantics', () => {
    expect(END).not.toContain('min-h-[100dvh]');
    expect(END).not.toContain('h-screen');
  });

  it('⛔ `onNextStory` is gone — the primary action belongs to StoryScreen', () => {
    expect(END).not.toContain('onNextStory');
  });

  it('the /dev fixture renders the WHOLE screen, ⛔ not the component in isolation', () => {
    expect(DONE_FIXTURE).toContain('StoryScreenView');
    expect(DONE_FIXTURE).not.toMatch(/<StoryEndScreen\b/);
  });
});
```

### Step 4 — `T-202ⓐⓑ`: the phase, and the chrome that survives the swap

- [ ] In `components/StoryScreen.tsx` lift the phase into `StoryReady`:
      `const [phase, setPhase] = useState<StoryPhase>(initialPhase ?? 'reading')`.
      Render `<StatusRow>`, the footer meta + legend and the single primary action
      **outside** the body swap — the render draws them once, and so does the code.
- [ ] In the same file the body card is the swap and ⛔ nothing else:
      `phase === 'question' && payload.question !== null` ⇒ `<StoryEndScreen …/>`, else the
      `data-story-body` paragraph. ⛔ `data-story-body` stays on the reading paragraph only
      (T-183 contract, `scripts/story-tap-audit.mjs`).
- [ ] The primary action, in `components/StoryScreen.tsx`: in `reading` it is a
      `<button type="button">` that calls `setPhase('question')` — ⛔ only when
      `payload.question !== null`; with `null` it stays the `חזרה לעולם` `<Link>` to
      `WORLD_HREF`, because a story with no question has no second phase
      (`docs/api-contract.md:713`). In `question` it is a `<Link href={WORLD_HREF}>`.
      ⛔ No disabled exit and ⛔ no modal — `§ 4.2יג` clause 3, «⛔ אין טעות בקריאה, ולכן ⛔ אין עונש».
- [ ] Edit `components/StoryEndScreen.tsx`: drop `min-h-[100dvh]`, drop the `<section>` screen
      semantics (it becomes the `rounded-2xl border border-border-subtle bg-surface-raised`
      body card the render draws at radius 22), drop its own button, drop `onNextStory`.
      `לתרגל אותן בכרטיסיות` stays as the **secondary** link and stays conditional on `N>0`
      (D-115 § 2). ⛔ The question itself is ⛔ **not** conditional on `N` — `T-151ⓔ` is
      superseded in writing.

### Step 5 — `T-150`: the intro layer, above the body card and under the status row

- [ ] In `components/StoryScreen.tsx` render, **in phase `reading` only**, one line built from
      `storyIntro(Object.keys(payload.glosses), payload.knownLemmas)`:
      `בסיפור הזה {total} מילים. {known} מהן אתה כבר מכיר.`
      🎯 Position from `docs/design/kol-A-05-story.png` — above the body card, below the status
      row. ⛔ No new column and ⛔ no new wire field (T-150ⓐ · D-043).
- [ ] ⛔ **Zero pre-marking (T-150ⓑ).** Prove it in `components/StoryScreen.test.ts`: the
      target `<button>`'s class list carries ⛔ no branch on word level or learner state other
      than `segment.isKnown`. `grep -n 'isKnown' components/StoryScreen.tsx` must return
      exactly the one existing branch.
- [x] ⛔ **Never «חסרות לך K מילים» (T-150ⓒ).** Add to `components/StoryScreen.test.ts`:
      `expect(SRC).not.toContain('חסרות')`.

### Step 6 — the render tests `T-202` and `T-203` name, in a real DOM

- [ ] Create `components/StoryScreen.dom.test.tsx` and run it red:
      `npx vitest run components/StoryScreen.dom.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoryScreenView, type StoryPayload } from '@/components/StoryScreen';

afterEach(cleanup);

const PAYLOAD: StoryPayload = {
  story: { id: 'fixture-story', titleEn: 'The library near the river', bodyEn: 'She found a book.' },
  index: 3,
  total: 12,
  level: 'A1',
  glosses: { book: { translationHe: 'סֵפֶר', posHe: 'שם עצם', wordId: 'fixture-book' } },
  knownLemmas: ['book'],
  counts: { newWords: 5, alreadyKnown: 2 },
  question: {
    questionEn: 'Who wrote the letter that was in the book?',
    answersHe: ['אם', 'אנשים', 'חבר'],
    correctIndex: 2,
  },
};

describe('T-202 — the question is a STATE, and the chrome survives the swap', () => {
  it('phase `reading` shows ⛔ no question', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.queryByText('שאלת הבנה')).toBeNull();
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
  });

  it('one press on the primary action swaps the BODY and ⛔ keeps the chrome', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByText('שאלת הבנה')).toBeTruthy();
    // ⛔ THE POINT OF THE TEST: the chrome must still be there after the swap.
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
    expect(screen.getByText('5 מילים חדשות · 2 שכבר ידעת')).toBeTruthy();
  });

  it('T-203 — the primary action names what it does, in each phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByRole('button', { name: 'סיימתי לקרוא' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  it('⛔ leaving without answering is legal — the exit is live in BOTH phases', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    const exit = screen.getByRole('link', { name: 'חזרה לעולם' });
    expect(exit.hasAttribute('aria-disabled')).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('⛔ a story with ⛔ no question has ⛔ no second phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: { ...PAYLOAD, question: null } }} />);
    expect(screen.queryByRole('button', { name: 'סיימתי לקרוא' })).toBeNull();
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  it('T-150 — the intro layer states what the learner ALREADY has', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByText(/בסיפור הזה 1 מילים\. 1 מהן אתה כבר מכיר\./)).toBeTruthy();
  });
});
```

- [ ] Make it green by finishing Steps 4–5 in `components/StoryScreen.tsx` and
      `components/StoryEndScreen.tsx`. ⛔ Do ⛔ not weaken an assertion to reach green.
      `npx vitest run components/StoryScreen.dom.test.tsx`

### Step 7 — `T-202ⓔ`: the fixture measures the real thing

- [ ] **Replace** `app/dev/story/done/page.tsx`: it renders `<StoryScreenView>` with
      `initialPhase="question"` and the full payload, so `check:mobile` and `diff:render`
      measure the **whole screen** in the question phase. ⛔ The question stays line 2 of
      `data/generated/story-questions-2026-08-25.jsonl` — ⛔ nothing is written here.
- [ ] Add `question` to the payload in `app/dev/story/page.tsx` so the reading fixture keeps
      typechecking, and confirm both fixtures: `npm run typecheck`
- [ ] Walk both routes and record the numbers (`STEP 6.5`, D-103) at 375×780:
      `(npx next dev -p 3000 &) && sleep 25` then `/dev/story` and `/dev/story/done` —
      heading · char count · tappable count · under-44px · horizontal scroll · console errors.
      ⛔ `/dev/story/done` at 221 chars would mean the fixture was not replaced.
- [ ] Compare layout to the render: `npm run diff:render /dev/story/done docs/design/kol-A-06-question.png`

### Step 8 — the full gate, last

- [ ] ⛔ **One commit per task, ⛔ not one per tick** — `T-150`, `T-203`, `T-202`, in that order
      (pure → strings → structure): `git commit -m "loop(DEV): C-XXXX T-150 …"` via `./scripts/g`.
- [ ] `npm run verify` — all five commands, in this message, ⛔ before any claim.
- [ ] `npm run measure:plan`, and `docs/plan-tables.md` + `docs/plan-open.md` in the **same**
      commit as the register edit (`RULES § 0.1.1 ח׳`).

## 4 · Self-check — ⛔ what would make this plan wrong

| Claim | How it fails loudly |
|---|---|
| The chrome survives the swap | `expect(screen.getByText('סיפור 3 מתוך 12'))` **after** the press |
| `StoryEndScreen` is a card, ⛔ not a screen | source scan: ⛔ zero `min-h-[100dvh]` in that file |
| ⛔ Nothing says `מודגשת` or `הסיפור הבא` | two scans that fail **by name** on each string |
| ⛔ No pre-marking | `grep -n 'isKnown' components/StoryScreen.tsx` ⇒ the one existing branch |
| `known` was not inverted | `storyIntro(...).known` ⛔ not `total-known` |
| The fixture measures the screen | `check:mobile` on `/dev/story/done`, ⛔ not on a bare component |
| ⛔ No endpoint drifted | `docs/api-contract.md` is ⛔ untouched; `question` shipped at line 706 |
