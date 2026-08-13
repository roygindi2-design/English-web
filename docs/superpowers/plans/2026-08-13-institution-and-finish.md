# Institution Field & Flow-Screen Finish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Allowed design skill: `ui-styling` only (the PM set it in the T-056/T-057 rows; the T-003 row says `—`, so ⛔ no design skill is loaded for Tasks 1–4). ⛔ `design-taste-frontend` is **not** allowed here: it is scoped to `app/page.tsx` and the onboarding screen's *marketing* surface, and nothing in this plan changes copy that sells anything.

**Goal:** Close the last of the onboarding questions (**T-003** — the institution field and the "המטרה שלך" block on `/me`), then finish the two flow-screen polish items that the same screens expose: **one Hebrew failure sentence everywhere** (T-056) and **a measured gap between adjacent tap targets** (T-057).

**Loop tasks covered:** **T-003** (Tasks 1–4) · **T-056** (Task 5) · **T-057** (Task 6).

**Why these three together:** they are the same four screens and the same harness block. T-003 adds a field to `/onboarding` and a block to `/me`; T-056 rewrites the failure sentence that *both* of those screens already print in three different wordings; T-057 measures the spacing between the controls T-003 just made denser. Doing T-056 after T-003 means the new field's failure path is written once, in the shared module, instead of written ad-hoc and rewritten a tick later. Doing T-057 last means it measures the final composition and not an intermediate one.

**Spec:** `plan/40-decisions.md` § 4.2ד (T-003, PM C-0074) · `plan/50-tasks.md` rows T-003, T-056, T-057 · `plan/35-design-constitution.md` § 2 and § 4 (frozen) · `plan/60-findings.md` F-011/F-016/F-027 · `docs/api-contract.md` (POST /api/profile).

**Tech Stack:** Next.js App Router (server components + two client components), Tailwind semantic tokens, Vitest source-level guards (`environment: node`, ⛔ no jsdom), `scripts/verify-mobile.mjs` (Chromium at 320/375/414px) for everything geometric, Supabase Postgres migration files applied by hand.

---

## Global Constraints

- ⛔ **Dev decides no screens, buttons, navigation or flows.** Every field, label, placement rule and edge case below is copied from § 4.2ד. Where § 4.2ד disagrees with itself, the disagreement is recorded under *Measured conflicts* and resolved by a **measurement**, never by inventing a third option.
- **Constitution is law:** tap targets ≥ 44px · 4px spacing scale · ⛔ `justify-center` on a page container · ⛔ `h-screen` (only `min-h-dvh`) · ⛔ zero horizontal scroll at 375px · colour is never the only channel · ⛔ no raw hex in components · fonts are Heebo/Assistant/Noto Sans Hebrew and ⛔ never Inter.
- ⛔ **No pedagogy, no content, no new external source.** The institution string is stored and displayed. ⛔ No exemption threshold, ⛔ no institution list, ⛔ no autocomplete, ⛔ no readiness estimate, ⛔ no predicted score (4.4.3), ⛔ no comparison between learners.
- ⛔ **`lib/core` stays pure** — no React, no `window`, no `document`, no `localStorage`, no `fetch`, no `process.env`. `npm run check:core` is the judge.
- **`docs/api-contract.md` is updated in the SAME commit** as the `POST /api/profile` change (Task 2). A contract that lags the route by one commit is a contract nobody can trust.
- **TDD:** every task starts with a test that fails **for the stated reason**, and the failure text is pasted into the tick report before any fix.
- **Verification before any completion claim:** `npm run typecheck && npm run check:core && npm test && npm run build`, plus `npm run check:mobile` for Tasks 3, 4 and 6 (they are geometry, and the four commands cannot see geometry).
- **TD-26 is mandatory before every `check:mobile` run:** `pkill -f '[n]ext-server'` then `pgrep -af next` to confirm nothing survived, then `rm -rf .next`, then rebuild. `pkill -f "next start"` ⛔ does **not** kill it — Next renames the process to `next-server`, the harness adopts the live server, and you measure a build that no longer exists (C-0075).
- Commits carry ⛔ **no** `[skip ci]` (RULES § 0.7). Push to `dev` only. ⛔ Never `main`.

---

## What is measured, not assumed

Run in this repo on 2026-08-13 (`grep -n`, `sed -n`, `node -e`):

| fact | measured value |
|---|---|
| suite at plan time | **779 tests · 52 files** (C-0076) |
| mobile harness at plan time | **594 checks** across 320/375/414px (C-0076) |
| `checkOnboarding` signature | `lib/core/onboarding.ts:155` — `checkOnboarding(raw: OnboardingRaw, today: string): OnboardingCheck` |
| the three answer fields today | `OnboardingRaw` `:46-49` · `OnboardingAnswers` `:52-56` · `OnboardingFieldErrors` `:58-62` — `dailyMinutes` · `examDate` · `targetScore` |
| last copy constant in the module | `lib/core/onboarding.ts:139` — `ONBOARDING_SUBMIT_HE = 'שמירה והתחלה'` |
| route body read | `app/api/profile/route.ts:42-46` — three named keys, ⛔ no spread |
| route DB write | `:59-66` — `daily_minutes` · `exam_date` · `target_score` · `onboarded_at` · `updated_at`, `update` **not** `upsert` |
| profile columns that exist | `0004_onboarding_answers.sql:16-19` — `daily_minutes` `exam_date` `target_score` `onboarded_at`; `institution` **does not exist** |
| highest migration on disk | `supabase/migrations/0008_word_cefr_profile.sql` → the new file is **0009** |
| the score field's keyboard hint | `components/OnboardingForm.tsx:141` — `enterKeyHint="go"`, i.e. it is currently the **last** field (F-015 · TD-5 make this a typed, enforced claim) |
| the score field's wrapper | `<LatinField>` `:134-152`, the product's only Latin input |
| the submit control | `:169-178` — inside `<ActionBar>`, `form="onboarding-form"`, `data-primary-action="true"` |
| onboarding failure copy today | `:75` and `:78-81` — `'השמירה נכשלה. נסה שוב.'` (twice) and `'אין חיבור לרשת. התשובות לא נשמרו.'` |
| `/me` failure copy today | `components/MeScreen.tsx:23-24` — `'לא הצלחנו לטעון את ההתקדמות כרגע.'` + `'נסה שוב'` |
| route-error copy today | `app/error.tsx:11-22` — `'משהו נתקע'` · `'התקלה אצלנו, לא אצלך…'` · `'נסה שוב'` |
| global-error copy today | `app/global-error.tsx:14-23` — `'האפליקציה לא נטענה'` · `'נסה לרענן…'` · `'נסה שוב'` |
| auth copy today | `lib/core/auth.ts:47-55` — `AUTH_MESSAGES_HE`, a **field-level** map keyed by `AuthErrorCode` |
| `/me` props today | `components/MeScreen.tsx:27-31` — `MeScreen({ wordsLearned }: { wordsLearned: number \| null })` |
| `/me` read today | `app/(tabs)/me/page.tsx:44-52` — one `word_progress` count, ⛔ no `profiles` read |
| `/me` fixture | `app/dev/tabs/me/page.tsx` — renders `<MeScreen wordsLearned={128} />` + `<TabBar />`; parity enforced by `scripts/verify-mobile.test.ts:253-313` |
| onboarding fixture parity guard | `scripts/verify-mobile.test.ts:190-210` — compares `app/onboarding/page.tsx` and `app/dev/onboarding/page.tsx` element-by-element; the fixture renders `<OnboardingForm>`, so a **field** added to the component needs no fixture edit |
| harness tap-target scan | `scripts/verify-mobile.mjs:275-300` — `MIN_TAP = 44` (`:60`), selector `a[href], button, input, select, textarea, [role="button"]`, label substitution for radio/checkbox only |
| harness gap scan | **does not exist.** T-057's "≥8px between adjacent targets" is measured nowhere today |
| flow routes | `scripts/verify-mobile.mjs:74` — `FLOW_ROUTES = ['/', '/signup', '/login', '/dev/onboarding', '/study']` |
| vitest collection globs | `vitest.config.ts:33-39` — `lib/**` · `proxy.test.ts` · `scripts/**` · `components/**/*.test.{ts,tsx}` · `app/**/*.test.{ts,tsx}` |

### Measured conflicts — recorded, not silently resolved

1. **§ 4.2ד contradicts itself on where the field goes.** The *מסכים* block says the institution field sits **"מעל שדה ציון היעד, בקבוצה אחת איתו"**; question 1 says **"השדה החדש הוא ה**אחרון**, אחרי הציון"**. Both satisfy the one rationale actually given ("the learner scanning the screen sees 'how many minutes a day' first"), so the rationale does not break the tie. **A measurement does:** `components/OnboardingForm.tsx:141` gives the score field `enterKeyHint="go"`, and F-015/TD-5 make that a typed, enforced claim that it is the **last** field. Placing institution after it would force the score's hint back to `next` — reopening a T-029 field that § 4.2ד explicitly closes ("דקות ביום · תאריך מבחן · ציון יעד … ואינם נפתחים מחדש"). **This plan follows the *מסכים* block: institution above the score.** The Critic should confirm; if the PM meant the other order, that is a one-line follow-up with the score's `enterKeyHint` in the same commit, ⛔ not a Dev improvisation now.
2. **The "block is hidden" rule names two fields, and the block displays three.** § 4.2ד: "בלוק 'המטרה שלך' מציג את מה שקיים: מוסד · ציון · תאריך", but the empty edge case is "מוסד ריק **וגם** ציון ריק → הבלוק אינו מוצג" — it says nothing about the date. Read literally, a learner who entered **only** an exam date sees no block. **This plan implements the rule literally** (institution ∅ **and** score ∅ ⇒ no block, regardless of the date) and records the consequence here rather than widening a PM rule on its own authority. The countdown already has a home: `daysUntilExamHe` is rendered by `<StudiesScreen>`, so this learner is not left with nothing.
3. **T-056 says "כל מסך שיש לו מסלול כשל" and one of them is not a screen.** `lib/core/auth.ts`'s `AUTH_MESSAGES_HE` is a **field-level** map ("כתובת האימייל לא נראית תקינה") — form validation, not a failure path. Task 5 unifies the **screen-level** failure sentence only and ⛔ leaves `AUTH_MESSAGES_HE` untouched; collapsing a field error into "משהו נתקע. נסה שוב." would delete information the learner needs to fix their own typo.

---

## What this plan deliberately does NOT do

- ⛔ **No institution list, no autocomplete, no exemption threshold, no "המוסד לא נמצא".** A7 (nite.org.il, grade א׳) states there is no national threshold; a list we author is a pedagogical claim (part 5).
- ⛔ **No `<LatinField>` for the institution** and ⛔ no `dir="ltr"`. "אוניברסיטת חיפה" is Hebrew in a Hebrew interface; TD-5 applies to **Latin** input.
- ⛔ **No consumer of `institution` outside the `/me` display.** No threshold logic, no "you are X points away", no readiness estimate, no predicted score, no comparison between learners.
- ⛔ **No re-opening of the T-029 fields** — minutes, date and score keep their questions, order, labels, validation and keyboard hints.
- ⛔ **No profile editing screen** (§ 4.2ד: "משימה נפרדת"), ⛔ no "complete your profile" badge, ⛔ no progress bar or percentage on the new field.
- ⛔ **No level test (T-004), no level bar on `/me`, no `senses.cefr_level` read.** A level is a property of a word, never of a learner.
- ⛔ **No new colour, radius, font or animation.** The constitution is frozen.
- ⛔ **No change to `AUTH_MESSAGES_HE`, to `proxy.ts`, to `lib/core/scheduler.ts`, or to any `/api/*` endpoint other than the two lines Task 2 adds to `POST /api/profile`.**

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0009_onboarding_institution.sql` | **Create.** One nullable `text` column + a length check constraint. |
| `lib/core/onboarding.ts` | **Modify.** `INSTITUTION_MAX_LENGTH`, two Hebrew copy constants, `institution` on the three answer types, and the trim-and-truncate rule inside `checkOnboarding`. Stays pure. |
| `lib/core/onboarding.test.ts` | **Modify.** The optionality, the truncation, the ⛔-never-a-field-error rule, and the migration/constant agreement. |
| `app/api/profile/route.ts` | **Modify.** Read `body.institution`, write `institution`. Two lines. |
| `app/api/profile/route.test.ts` | **Modify.** Source guard: the key is read, the column is written, nothing is spread. |
| `docs/api-contract.md` | **Modify.** Same commit as the route. |
| `components/OnboardingForm.tsx` | **Modify.** One Hebrew text input above the score field, in the same group. |
| `components/OnboardingForm.test.ts` | **Create.** Source guard: not a `<LatinField>`, no `dir="ltr"`, `maxLength`, `min-h-touch`, and the field's position relative to the score. |
| `components/MeScreen.tsx` | **Modify.** New optional `goal` prop and the "המטרה שלך" block, hidden when institution and score are both empty. |
| `components/MeScreen.test.ts` | **Modify.** The hidden-when-empty rule, the one-line overflow rule, ⛔ no threshold copy. |
| `app/(tabs)/me/page.tsx` | **Modify.** One extra `profiles` read, passed straight through. |
| `app/dev/tabs/me/page.tsx` | **Modify.** Fixture gains the same prop, with a fixed sample. |
| `lib/core/failure.ts` | **Create.** T-056. The screen-level failure copy, one export per situation. Pure. |
| `lib/core/failure.test.ts` | **Create.** Shape of the copy + the repo-wide scan that forbids a second wording. |
| `app/error.tsx` · `app/global-error.tsx` · `components/MeScreen.tsx` · `components/OnboardingForm.tsx` | **Modify (Task 5).** Import the copy instead of restating it. |
| `scripts/verify-mobile.mjs` | **Modify (Task 6).** `MIN_GAP = 8` and the adjacency scan over `FLOW_ROUTES`. |
| `scripts/verify-mobile.test.ts` | **Modify (Task 6).** Wiring guard for the new scan. |

---

## Task 1: The column and the pure rule

**Files:**
- Create: `supabase/migrations/0009_onboarding_institution.sql`
- Modify: `lib/core/onboarding.ts` (types at `:46-62`, copy after `:139`, body of `checkOnboarding` at `:155`)
- Test: `lib/core/onboarding.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export const INSTITUTION_MAX_LENGTH = 120`
  - `export const INSTITUTION_QUESTION_HE = 'איפה תיגש למבחן? (לא חובה)'`
  - `export const INSTITUTION_HELP_HE = 'שם המוסד. עוזר לנו להציג את המטרה שלך, ולא משנה את התרגול.'`
  - `OnboardingRaw` gains `readonly institution: unknown`
  - `OnboardingAnswers` gains `readonly institution: string | null`
  - `OnboardingFieldErrors` — ⛔ **unchanged.** There is no institution error, by design.

- [x] **Step 1: Write the failing tests**

Append to `lib/core/onboarding.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import {
  INSTITUTION_MAX_LENGTH,
  INSTITUTION_QUESTION_HE,
  checkOnboarding,
} from '@/lib/core/onboarding';

/** The three answers T-029 already validates, so each test states one thing. */
const BASE = { dailyMinutes: 5, examDate: '', targetScore: '' } as const;
const TODAY = '2026-08-13';

describe('the institution (A7 — optional, free text, read by nothing but the display)', () => {
  it('is genuinely optional: absent, empty and whitespace all mean NULL', () => {
    for (const value of [undefined, '', '   ', null]) {
      const result = checkOnboarding({ ...BASE, institution: value }, TODAY);
      expect(result.ok, `institution=${JSON.stringify(value)}`).toBe(true);
      if (result.ok) expect(result.answers.institution).toBeNull();
    }
  });

  it('keeps the Hebrew the learner typed, trimmed', () => {
    const result = checkOnboarding({ ...BASE, institution: '  אוניברסיטת חיפה  ' }, TODAY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.answers.institution).toBe('אוניברסיטת חיפה');
  });

  /**
   * § 4.2ד: "נחתך ב-120 תווים בשרת". Truncation and ⛔ not rejection — there is
   * no wrong answer in a free-text field, so a long one must not block a form
   * whose other three answers are fine.
   */
  it('truncates past the limit instead of rejecting the whole form', () => {
    const long = 'א'.repeat(INSTITUTION_MAX_LENGTH + 40);
    const result = checkOnboarding({ ...BASE, institution: long }, TODAY);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.answers.institution).toHaveLength(INSTITUTION_MAX_LENGTH);
      expect(result.answers.institution).toBe('א'.repeat(INSTITUTION_MAX_LENGTH));
    }
  });

  it('⛔ never produces a field error — there is no wrong answer here', () => {
    const result = checkOnboarding(
      { ...BASE, institution: 'א'.repeat(5000) },
      TODAY,
    );
    expect(result.ok).toBe(true);
    // A non-string is not an error either; it is simply not an answer.
    const weird = checkOnboarding({ ...BASE, institution: { a: 1 } }, TODAY);
    expect(weird.ok).toBe(true);
    if (weird.ok) expect(weird.answers.institution).toBeNull();
  });

  /**
   * The ceiling lives in two places — the module and the database — and a
   * ceiling that disagrees with itself truncates in the app and then throws in
   * Postgres. Same pattern as profiles_daily_minutes_check (api-contract.md).
   */
  it('agrees with the length the migration enforces', () => {
    const sql = readFileSync('supabase/migrations/0009_onboarding_institution.sql', 'utf8');
    expect(sql).toContain(`char_length(institution) <= ${INSTITUTION_MAX_LENGTH}`);
    expect(sql).not.toMatch(/institution\s+text\s+not\s+null/i);
  });

  it('asks the question in Hebrew and ⛔ never promises a threshold', () => {
    for (const forbidden of ['פטור', 'סף', 'ציון עובר', 'מוכנות']) {
      expect(INSTITUTION_QUESTION_HE).not.toContain(forbidden);
    }
  });
});
```

- [x] **Step 2: Run them and confirm they fail for the stated reason**

Run: `npx vitest run lib/core/onboarding.test.ts`
Expected: FAIL — `INSTITUTION_MAX_LENGTH` is not exported (import error), and once that is added, `answers.institution` is `undefined`. Paste the real output into the tick report.

- [x] **Step 3: Write the migration**

Create `supabase/migrations/0009_onboarding_institution.sql`:

```sql
-- T-003 · § 4.2ד — the institution the learner will sit the exam at.
--
-- Apply in the Supabase SQL editor (or `supabase db push`) after 0004. RLS and
-- the owner-only policies come from 0001_profiles.sql and are NOT restated:
-- a second policy on the same table is OR'd with the first, so restating it can
-- only widen access, never narrow it.
--
-- Nullable, and ⛔ never `not null`: § 4.2ד makes the field optional, and a
-- default would make "skipped" and "answered" the same row forever.
--
-- Free text, ⛔ not an enum and ⛔ not a foreign key to an institutions table:
-- A7 (nite.org.il, grade א׳) states the exemption threshold and the level
-- banding are set per institution and that there is NO national list. A list we
-- author would be a pedagogical claim with no source behind it.

alter table public.profiles add column if not exists institution text;

comment on column public.profiles.institution is
  'A7 · T-003: free text, learner-supplied, optional. Read ONLY by the /me
   display — ⛔ no threshold logic, no readiness estimate, no comparison.
   NULL = skipped, which is an expected and permanent state.';

-- `add column ... check (...)` is skipped wholesale when the column already
-- exists, so the constraint is added separately or it ships missing on any
-- project that ran an earlier draft. Named, so re-applying is a no-op.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_institution_length_check') then
    alter table public.profiles
      add constraint profiles_institution_length_check
      check (institution is null or char_length(institution) <= 120);
  end if;
end $$;
```

- [x] **Step 4: Add the constants and the types**

In `lib/core/onboarding.ts`, after `ONBOARDING_SUBMIT_HE` (`:139`):

```ts
/**
 * A7 (nite.org.il, grade א׳): the exemption threshold and the level banding are
 * set **per institution** — there is no single national threshold. That is the
 * whole reason the target score stays a number the learner types instead of one
 * we compute, and this field is the EXPLANATION for that manual question, ⛔ not
 * an input to any calculation. Nothing but the /me display reads it.
 *
 * 120 characters: the longest real Hebrew institution name measures well under
 * it ("המכללה האקדמית להנדסה אורט בראודה" is 33), and the same number is the
 * check constraint in 0009 — a unit test fails if the two drift apart.
 */
export const INSTITUTION_MAX_LENGTH = 120;
export const INSTITUTION_QUESTION_HE = 'איפה תיגש למבחן? (לא חובה)';
export const INSTITUTION_HELP_HE =
  'שם המוסד. עוזר לנו להציג את המטרה שלך, ולא משנה את התרגול.';
```

Extend the three types (`:46-56`) — ⛔ `OnboardingFieldErrors` is **not** touched:

```ts
export type OnboardingRaw = {
  readonly dailyMinutes: unknown;
  readonly examDate: unknown;
  readonly targetScore: unknown;
  readonly institution: unknown;
};

export type OnboardingAnswers = {
  readonly dailyMinutes: DailyMinutes;
  readonly examDate: string | null;
  readonly targetScore: number | null;
  readonly institution: string | null;
};
```

- [x] **Step 5: Implement the rule inside `checkOnboarding`**

Immediately before the final `if (Object.keys(fieldErrors).length > 0 …)` block:

```ts
  // ⛔ No validation beyond the length, and the length TRUNCATES rather than
  // rejects (§ 4.2ד, "טעות: אין תשובה שגויה"). A non-string is not an error
  // either — it is simply not an answer, and `String(raw.institution)` would
  // quietly store "[object Object]" as the learner's university.
  const institutionRaw = typeof raw.institution === 'string' ? raw.institution.trim() : '';
  const institution =
    institutionRaw === '' ? null : institutionRaw.slice(0, INSTITUTION_MAX_LENGTH);
```

and add `institution` to the returned `answers` object.

- [x] **Step 6: Run the full four commands**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: PASS. `check:core` must still print `/lib/core purity: OK` — the new code reads no clock, no env and no DOM.

- [x] **Step 7: Mutation check — prove the tests bite**

Change `.slice(0, INSTITUTION_MAX_LENGTH)` to `.slice(0, INSTITUTION_MAX_LENGTH + 1)` and run `npx vitest run lib/core/onboarding.test.ts`.
Expected: FAIL on "truncates past the limit instead of rejecting the whole form". Revert the mutation. Record both the mutation and its failure line in the tick report.

- [x] **Step 8: Commit**

```bash
git add supabase/migrations/0009_onboarding_institution.sql lib/core/onboarding.ts lib/core/onboarding.test.ts
git commit -m "loop(DEV): C-XXXX T-003 institution column + pure rule"
```

---

## Task 2: The route and the contract

**Files:**
- Modify: `app/api/profile/route.ts:42-46` (read) and `:59-66` (write)
- Modify: `docs/api-contract.md` (the `POST /api/profile` section, lines 97-146)
- Test: `app/api/profile/route.test.ts`

**Interfaces:**
- Consumes: `OnboardingAnswers.institution` from Task 1.
- Produces: request body gains an optional `institution: string` key; the 200/401/422/400/503 shapes are **unchanged**.

- [ ] **Step 1: Write the failing test**

Append to `app/api/profile/route.test.ts`:

```ts
describe('the institution reaches the column (T-003 · § 4.2ד)', () => {
  const SRC = readFileSync('app/api/profile/route.ts', 'utf8');

  it('passes the submitted key into checkOnboarding by name', () => {
    expect(SRC).toMatch(/institution:\s*body\.institution/);
  });

  it('writes the validated value and ⛔ never the raw body', () => {
    expect(SRC).toMatch(/institution:\s*check\.answers\.institution/);
    expect(SRC).not.toMatch(/institution:\s*body\.institution[\s\S]{0,200}\.update\(/);
  });

  /**
   * A spread would hand Postgres whatever the caller invented. The route names
   * every key it reads and every column it writes — that is the property, not
   * the specific field.
   */
  it('still spreads nothing from the request body', () => {
    expect(SRC).not.toContain('...body');
    expect(SRC).not.toContain('...payload');
  });

  it('is documented in the same contract the route claims to implement', () => {
    const contract = readFileSync('docs/api-contract.md', 'utf8');
    const section = contract.slice(contract.indexOf('## POST /api/profile'));
    expect(section).toContain('institution');
    expect(section).toContain('120');
  });
});
```

If `readFileSync` and `describe` are not already imported at the top of that file, add them (`import { readFileSync } from 'node:fs';` · `import { describe, expect, it } from 'vitest';`).

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run app/api/profile/route.test.ts`
Expected: FAIL on "passes the submitted key into checkOnboarding by name" and on the contract test.

- [ ] **Step 3: Add the two lines to the route**

In the `checkOnboarding` call (`:42-46`):

```ts
      targetScore: body.targetScore,
      // § 4.2ד: optional free text, truncated (not rejected) by lib/core.
      institution: body.institution,
```

In the `update` object (`:59-66`):

```ts
      target_score: check.answers.targetScore,
      institution: check.answers.institution,
```

- [ ] **Step 4: Update `docs/api-contract.md` in the same change**

In the `POST /api/profile` section, replace the request-body sample and add a paragraph:

```markdown
```json
{ "dailyMinutes": 5, "examDate": "2026-09-10", "targetScore": "", "institution": "אוניברסיטת חיפה" }
```

`institution` הוא **טקסט חופשי רשות** (T-003 · § 4.2ד). ריק, רווחים בלבד, חסר או
ערך שאינו מחרוזת — כולם נשמרים כ-`NULL`. מחרוזת ארוכה מ-120 תווים **נחתכת** ב-
`lib/core/onboarding.ts` ו⛔אינה מוחזרת כשגיאה: אין תשובה שגויה בשדה חופשי, ולכן
הוא לעולם אינו מופיע ב-`fieldErrors`. אותם 120 נאכפים שוב במסד דרך
`profiles_institution_length_check` ב-`0009_onboarding_institution.sql`, ובדיקת
יחידה נכשלת אם השתיים נפרדות. ⛔ **אין צרכן לשדה מלבד התצוגה ב-`/me`** — אין
לוגיקת סף, אין הערכת מוכנות ואין השוואה בין לומדים.
```

- [ ] **Step 5: Run the tests and the four commands**

Run: `npx vitest run app/api/profile/route.test.ts` → PASS.
Run: `npm run typecheck && npm run check:core && npm test && npm run build` → PASS.

- [ ] **Step 6: Mutation check**

Delete the `institution: check.answers.institution` line and run `npx vitest run app/api/profile/route.test.ts`.
Expected: FAIL on "writes the validated value and ⛔ never the raw body". Restore it.

- [ ] **Step 7: Commit — route and contract together**

```bash
git add app/api/profile/route.ts app/api/profile/route.test.ts docs/api-contract.md
git commit -m "loop(DEV): C-XXXX T-003 institution through POST /api/profile"
```

---

## Task 3: The field on the onboarding screen ✅ C-0081

**Files:**
- Modify: `components/OnboardingForm.tsx` (state near `:46-49`, markup between `:132` and `:134`)
- Create: `components/OnboardingForm.test.ts`
- Test: also `npm run check:mobile` (the `/dev/onboarding` fixture renders `<OnboardingForm>`, so ⛔ **no fixture edit is needed** — `scripts/verify-mobile.test.ts:190-210` compares the two files by the elements they render, and both already render the component)

**Interfaces:**
- Consumes: `INSTITUTION_QUESTION_HE`, `INSTITUTION_HELP_HE`, `INSTITUTION_MAX_LENGTH` from Task 1; the `institution` key from Task 2.
- Produces: nothing later tasks import.

- [x] **Step 1: Write the failing test**

Create `components/OnboardingForm.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INSTITUTION_MAX_LENGTH } from '@/lib/core/onboarding';

/**
 * A source guard and not a render test: the environment is node and jsdom is
 * deliberately not installed (vitest.config.ts). Geometry belongs to
 * check:mobile, through the /dev/onboarding fixture.
 */
const SRC = readFileSync('components/OnboardingForm.tsx', 'utf8');

/** C-0032/C-0071/C-0076: a guard a comment can satisfy guards nothing. */
function markupOnly(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = markupOnly(SRC);

describe('the institution field (T-003 · § 4.2ד)', () => {
  it('is a Hebrew field and ⛔ never goes through <LatinField> (TD-5)', () => {
    const field = CODE.slice(CODE.indexOf('name="institution"') - 600, CODE.indexOf('name="institution"') + 600);
    expect(field).not.toContain('LatinField');
    expect(field).not.toContain('dir="ltr"');
  });

  it('caps the input at the same length the server truncates at', () => {
    expect(CODE).toMatch(new RegExp(`maxLength=\\{${INSTITUTION_MAX_LENGTH}\\}`));
  });

  it('is a 44px target like every other control on the screen', () => {
    const field = CODE.slice(CODE.indexOf('name="institution"') - 600, CODE.indexOf('name="institution"') + 600);
    expect(field).toContain('min-h-touch');
  });

  /**
   * Measured conflict 1. The score field carries enterKeyHint="go", a typed
   * claim (F-015 · TD-5) that it is the LAST field. Institution therefore sits
   * ABOVE it — if this assertion ever flips, the score's hint must flip in the
   * same commit or the keyboard lies about what the next key does.
   */
  it('sits above the target-score field, which owns enterKeyHint="go"', () => {
    expect(CODE.indexOf('name="institution"')).toBeLessThan(CODE.indexOf('name="target_score"'));
    expect(CODE).toContain('enterKeyHint="go"');
  });

  it('sends the value under the key the route reads', () => {
    expect(CODE).toMatch(/apiPost<SaveResponse>\('\/api\/profile',\s*\{[\s\S]*?institution[\s\S]*?\}/);
  });

  it('⛔ offers no list, no autocomplete and no threshold promise', () => {
    expect(CODE).not.toContain('<datalist');
    expect(CODE).not.toMatch(/autoComplete="organization"/);
    for (const forbidden of ['פטור', 'סף', 'מוכנות']) {
      expect(CODE).not.toContain(forbidden);
    }
  });

  it('still anchors its column to the top (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
  });
});
```

- [x] **Step 2: Run it and confirm it fails**

Run: `npx vitest run components/OnboardingForm.test.ts`
Expected: FAIL — `name="institution"` is nowhere in the file, so `indexOf` returns `-1` and the slice checks blow up on the missing marker. Paste the output.

- [x] **Step 3: Add the state**

Beside the other `useState` calls (`:46-49`):

```tsx
  const [institution, setInstitution] = useState('');
```

Add `INSTITUTION_HELP_HE`, `INSTITUTION_MAX_LENGTH` and `INSTITUTION_QUESTION_HE` to the existing import block from `@/lib/core/onboarding`.

- [x] **Step 4: Add the markup above the score field**

Insert between the exam-date `</label>` (`:132`) and `<LatinField …>` (`:134`):

```tsx
      {/* § 4.2ד: free text, optional, Hebrew. ⛔ Not <LatinField> — TD-5 covers
          LATIN input, and "אוניברסיטת חיפה" is neither. ⛔ No <datalist> and no
          autocomplete: a list of institutions with exemption thresholds is a
          pedagogical claim, and A7 itself says no national list exists.
          Placement is measured conflict 1 in the plan — it sits ABOVE the score
          because the score owns enterKeyHint="go", the typed claim that it is
          the last field (F-015 · TD-5). */}
      <label className="flex flex-col gap-1.5">
        <span className="text-lg font-semibold text-ink">{INSTITUTION_QUESTION_HE}</span>
        <span className="text-base text-ink-muted">{INSTITUTION_HELP_HE}</span>
        <input
          type="text"
          name="institution"
          value={institution}
          maxLength={INSTITUTION_MAX_LENGTH}
          autoComplete="off"
          enterKeyHint="next"
          onChange={(event) => setInstitution(event.target.value)}
          className="min-h-touch w-full rounded-xl border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink outline-none focus:border-brand"
        />
      </label>
```

- [x] **Step 5: Send it**

In `onSubmit`, add `institution` to the `apiPost` body:

```tsx
      const result = await apiPost<SaveResponse>('/api/profile', {
        dailyMinutes,
        examDate,
        targetScore,
        institution,
      });
```

- [x] **Step 6: Run the unit tests and the four commands**

Run: `npx vitest run components/OnboardingForm.test.ts` → PASS.
Run: `npm run typecheck && npm run check:core && npm test && npm run build` → PASS.

- [x] **Step 7: Measure the geometry**

```bash
pkill -f '[n]ext-server' ; pgrep -af next ; rm -rf .next && npm run build && npm run check:mobile
```
Expected: all checks pass, including `all tap targets >= 44px` and `primary action in thumb zone` on `/dev/onboarding` at 320/375/414. **Record the new total** — it will be ≥ 594 only if new assertions were added; here it should stay **594**, because the field is measured by the existing scans rather than by a new one. If the primary action fails the thumb-zone check because the form grew, ⛔ do **not** shrink the field — record it and stop: the action bar is fixed (D-028) and a failure there means something else regressed.

- [x] **Step 8: Mutation check**

Move the institution `<label>` block below `<LatinField>` and run `npx vitest run components/OnboardingForm.test.ts`.
Expected: FAIL on "sits above the target-score field, which owns enterKeyHint='go'". Move it back.

- [x] **Step 9: Commit**

```bash
git add components/OnboardingForm.tsx components/OnboardingForm.test.ts
git commit -m "loop(DEV): C-XXXX T-003 institution field on the onboarding form"
```

---

## Task 4: The "המטרה שלך" block on `/me` ✅ C-0083

**Files:**
- Modify: `components/MeScreen.tsx:27-31` (props) and the body
- Modify: `components/MeScreen.test.ts`
- Modify: `app/(tabs)/me/page.tsx:44-52` (one extra read)
- Modify: `app/dev/tabs/me/page.tsx` (fixture props)

**Interfaces:**
- Consumes: the `institution` column from Task 1.
- Produces:
  ```ts
  export type LearnerGoal = {
    readonly institution: string | null;
    readonly targetScore: number | null;
    readonly examDate: string | null;
  };
  export default function MeScreen({ wordsLearned, goal }: {
    wordsLearned: number | null;
    goal: LearnerGoal;
  }): React.JSX.Element
  ```
  `goal` is **required**, not optional: an optional prop is a prop a caller forgets, and the fixture forgetting it is exactly F-027 cause 2.

- [ ] **Step 1: Write the failing test**

Append to `components/MeScreen.test.ts`:

```ts
describe('the "המטרה שלך" block (T-003 · § 4.2ד)', () => {
  it('takes the goal as a required prop, so a caller cannot forget it', () => {
    expect(CODE).toMatch(/goal:\s*LearnerGoal/);
    expect(CODE).not.toMatch(/goal\?:/);
  });

  /**
   * § 4.2ד, the empty edge case: "מוסד ריק וגם ציון ריק → הבלוק אינו מוצג".
   * A heading over an empty area is F-011 with a different name.
   */
  it('hides itself when institution and score are both empty', () => {
    expect(CODE).toMatch(/goal\.institution[\s\S]{0,40}goal\.targetScore/);
    expect(CODE).toContain('!== null');
  });

  it('shows a long institution on one line with overflow, ⛔ not wrapped to three', () => {
    expect(CODE).toMatch(/truncate|text-ellipsis/);
  });

  it('⛔ never states a threshold, a readiness estimate or a predicted score', () => {
    for (const forbidden of ['פטור', 'סף', 'מוכנות', 'ציון חזוי', 'נשאר לך', 'נקודות מ']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  it('names the block in Hebrew', () => {
    expect(CODE).toContain('המטרה שלך');
  });
});

describe('the /me route reads the goal it renders (F-027 cause 2)', () => {
  const page = readFileSync('app/(tabs)/me/page.tsx', 'utf8');
  const fixture = readFileSync('app/dev/tabs/me/page.tsx', 'utf8');

  it('selects the three goal columns from profiles', () => {
    expect(page).toContain("from('profiles')");
    for (const column of ['institution', 'target_score', 'exam_date']) {
      expect(page).toContain(column);
    }
  });

  it('passes a goal to the component, and so does the fixture', () => {
    expect(page).toMatch(/goal=\{/);
    expect(fixture).toMatch(/goal=\{/);
  });

  it('⛔ never turns a failed profile read into an invented goal', () => {
    expect(page).toMatch(/institution:\s*(profile|null)/);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run components/MeScreen.test.ts`
Expected: FAIL on "takes the goal as a required prop" and on every assertion in the second describe.

- [ ] **Step 3: Add the block to `<MeScreen>`**

Add above the component:

```tsx
const GOAL_HEADING_HE = 'המטרה שלך';
const GOAL_SCORE_LABEL_HE = 'ציון יעד';
const GOAL_DATE_LABEL_HE = 'תאריך המבחן';

export type LearnerGoal = {
  readonly institution: string | null;
  readonly targetScore: number | null;
  readonly examDate: string | null;
};
```

Change the signature to `{ wordsLearned, goal }` and render, directly after the words-learned block:

```tsx
      {/* § 4.2ד. ⛔ The block is hidden when institution AND score are both
          empty — a heading over an empty area is F-011 under another name. The
          exam date alone does NOT open it: that is the rule as written, and the
          countdown already has a home in <StudiesScreen>. Recorded as measured
          conflict 2 in the plan rather than widened here on Dev's authority.
          ⛔ Nothing computes anything from these three values (4.4.3). */}
      {(goal.institution !== null || goal.targetScore !== null) && (
        <section className="flex flex-col gap-1" data-goal-block>
          <h2 className="text-lg font-semibold text-ink">{GOAL_HEADING_HE}</h2>
          {goal.institution !== null && (
            <p className="truncate text-lg text-ink" title={goal.institution}>
              {goal.institution}
            </p>
          )}
          {goal.targetScore !== null && (
            <p className="text-lg text-ink-muted">
              {GOAL_SCORE_LABEL_HE}: {goal.targetScore}
            </p>
          )}
          {goal.examDate !== null && (
            <p className="text-lg text-ink-muted">
              {GOAL_DATE_LABEL_HE}: {goal.examDate}
            </p>
          )}
        </section>
      )}
```

- [ ] **Step 4: Read the columns in the route**

In `app/(tabs)/me/page.tsx`, after the `word_progress` count:

```tsx
  // ⛔ `maybeSingle` and not `single`: 0001's trigger creates the row, but a
  // screen that throws because a row is missing tells the learner nothing and
  // costs them the whole tab. A failed read yields an empty goal, which renders
  // as no block at all — the same honest silence `wordsLearned === null` uses.
  const { data: profile } = await supabase
    .from('profiles')
    .select('institution, target_score, exam_date')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <MeScreen
      wordsLearned={error ? null : (count ?? 0)}
      goal={{
        institution: profile?.institution ?? null,
        targetScore: profile?.target_score ?? null,
        examDate: profile?.exam_date ?? null,
      }}
    />
  );
```

- [ ] **Step 5: Give the fixture the same shape**

In `app/dev/tabs/me/page.tsx`:

```tsx
/**
 * A fixed sample goal, ⛔ not a read. The values are chosen to measure the
 * TALLEST realistic composition: a long institution name (the one-line overflow
 * rule), a score and a date all present at once.
 */
const SAMPLE_GOAL = {
  institution: 'המכללה האקדמית להנדסה אורט בראודה',
  targetScore: 120,
  examDate: '2026-09-10',
} as const;
```

and pass `goal={SAMPLE_GOAL}` beside `wordsLearned`.

- [ ] **Step 6: Run the tests, the four commands and the harness**

Run: `npx vitest run components/MeScreen.test.ts` → PASS.
Run: `npm run typecheck && npm run check:core && npm test && npm run build` → PASS.
Run: `pkill -f '[n]ext-server' ; pgrep -af next ; rm -rf .next && npm run build && npm run check:mobile` → PASS, including `no horizontal scroll` at 320px with the long sample institution. **Record the total.**

- [ ] **Step 7: Mutation check**

Change the guard to `goal.institution !== null && goal.targetScore !== null` and run `npx vitest run components/MeScreen.test.ts`.
Expected: FAIL on "hides itself when institution and score are both empty" (the regex requires the `||` composition). Revert.

- [ ] **Step 8: Commit and close T-003**

```bash
git add components/MeScreen.tsx components/MeScreen.test.ts "app/(tabs)/me/page.tsx" app/dev/tabs/me/page.tsx
git commit -m "loop(DEV): C-XXXX T-003 goal block on /me"
```

---

## Task 5: One Hebrew failure sentence (T-056) ✅ C-0084

**Files:**
- Create: `lib/core/failure.ts`, `lib/core/failure.test.ts`
- Modify: `components/OnboardingForm.tsx:75,78-81` · `components/MeScreen.tsx:23-24` · `app/error.tsx:11-22` · `app/global-error.tsx:14-23`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export const RETRY_HE = 'נסה שוב';
  export const FAILURE_HE: {
    readonly save: string;      // 'השמירה נכשלה. נסה שוב.'
    readonly load: string;      // 'לא הצלחנו לטעון את הנתונים כרגע.'
    readonly offline: string;   // 'אין חיבור לרשת. הנתונים לא נשמרו.'
    readonly crash: string;     // 'התקלה אצלנו, לא אצלך. ההתקדמות שלך לא נפגעה.'
  };
  export const FAILURE_TITLE_HE: {
    readonly route: string;     // 'משהו נתקע'
    readonly app: string;       // 'האפליקציה לא נטענה'
  };
  ```
  ⛔ `AUTH_MESSAGES_HE` in `lib/core/auth.ts` is **not** touched — see measured conflict 3.

- [x] **Step 1: Write the failing test**

Create `lib/core/failure.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FAILURE_HE, FAILURE_TITLE_HE, RETRY_HE } from '@/lib/core/failure';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(full)) out.push(full);
  }
  return out;
}

const SCREENS = [...walk('app'), ...walk('components')];

describe('the failure copy is one sentence, in one place (T-056 · constitution § 2)', () => {
  it('is Hebrew, ends in a full stop, and ⛔ carries no error code', () => {
    for (const [key, text] of Object.entries(FAILURE_HE)) {
      expect(text, key).toMatch(/^[֐-׿]/);
      expect(text, key).not.toMatch(/[A-Za-z]/);
      expect(text, key).toMatch(/\.$/);
    }
    expect(RETRY_HE).toBe('נסה שוב');
  });

  /**
   * The point of the module is that a screen cannot invent a second wording. A
   * literal in a .tsx file is exactly that invention, and it is what this repo
   * had in four files at plan time.
   */
  it('⛔ no screen restates the retry label as a literal', () => {
    const offenders = SCREENS.filter((file) => {
      const src = readFileSync(file, 'utf8');
      return src.includes(`'${RETRY_HE}'`) || src.includes(`>${RETRY_HE}<`);
    }).filter((file) => !file.endsWith('failure.ts'));
    expect(offenders, `restate RETRY_HE instead of importing it`).toEqual([]);
  });

  it('⛔ no screen restates a failure sentence as a literal', () => {
    const sentences = Object.values(FAILURE_HE);
    const offenders = SCREENS.filter((file) => {
      const src = readFileSync(file, 'utf8');
      return sentences.some((s) => src.includes(s));
    });
    expect(offenders).toEqual([]);
  });

  /**
   * The learner never sees a stack trace, a digest or an English code — that is
   * the actual T-056 requirement, and it is measurable.
   */
  it('⛔ no screen renders a raw error object at the learner', () => {
    for (const file of SCREENS) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/\{\s*error\.(message|digest|stack)\s*\}/);
      expect(src, file).not.toMatch(/\{\s*String\(error\)\s*\}/);
    }
  });

  it('gives the two boundary screens their own titles, ⛔ not one generic one', () => {
    expect(FAILURE_TITLE_HE.route).not.toBe(FAILURE_TITLE_HE.app);
  });
});
```

- [x] **Step 2: Run it and confirm it fails for the right reason**

Run: `npx vitest run lib/core/failure.test.ts`
Expected: FAIL on the import (module does not exist). After Step 3 it must fail again — this time listing `app/error.tsx`, `app/global-error.tsx`, `components/MeScreen.tsx`, `components/OnboardingForm.tsx` as offenders. **Both failures go in the tick report**; the second is the one that proves the scan works.

- [x] **Step 3: Write the module**

Create `lib/core/failure.ts`:

```ts
/**
 * The screen-level failure copy — pure. No React, no DOM, no network, no env.
 *
 * T-056: one Hebrew sentence and one "נסה שוב", everywhere. At plan time the
 * product had four wordings for the same event across four files, and a learner
 * who hits two of them cannot tell whether they met one problem or two.
 *
 * ⛔ This is NOT the field-error map. `AUTH_MESSAGES_HE` (lib/core/auth.ts)
 * answers "what did I type wrong", which is information the learner needs in
 * order to fix it; collapsing that into "משהו נתקע" would delete it. This module
 * answers "the product failed, not you" — a different sentence for a different
 * event.
 *
 * ⛔ No error code, no digest, no English: constitution § 2, and RULES' rule
 * that an Israeli learner never faces a raw error string.
 */
export const RETRY_HE = 'נסה שוב';

export const FAILURE_HE = Object.freeze({
  /** A write the learner initiated did not land. */
  save: 'השמירה נכשלה. נסה שוב.',
  /** A read the screen needed did not arrive. */
  load: 'לא הצלחנו לטעון את הנתונים כרגע.',
  /** The request never left the device — say so, because it is fixable. */
  offline: 'אין חיבור לרשת. הנתונים לא נשמרו.',
  /** A crash. The learner's work is safe, and saying so is the whole point. */
  crash: 'התקלה אצלנו, לא אצלך. ההתקדמות שלך לא נפגעה.',
});

export const FAILURE_TITLE_HE = Object.freeze({
  route: 'משהו נתקע',
  app: 'האפליקציה לא נטענה',
});
```

- [x] **Step 4: Rewrite the four consumers**

- `components/OnboardingForm.tsx`: replace both `'השמירה נכשלה. נסה שוב.'` literals with `FAILURE_HE.save` and `'אין חיבור לרשת. התשובות לא נשמרו.'` with `FAILURE_HE.offline`.
- `components/MeScreen.tsx`: delete the local `PROGRESS_UNAVAILABLE_HE` and `RETRY_HE` constants; import `FAILURE_HE` and `RETRY_HE`, render `FAILURE_HE.load` and `RETRY_HE`.
- `app/error.tsx`: import `FAILURE_HE`, `FAILURE_TITLE_HE`, `RETRY_HE`; render `FAILURE_TITLE_HE.route`, `FAILURE_HE.crash`, `RETRY_HE`.
- `app/global-error.tsx`: same imports; render `FAILURE_TITLE_HE.app`, `FAILURE_HE.load`, `RETRY_HE`.

⚠️ `app/global-error.tsx` renders its own `<html>` and must stay importable from the root boundary — `lib/core/failure.ts` is a plain constants module with zero imports, so this is safe. Confirm with `npm run build`, which fails loudly if it is not.

- [x] **Step 5: Run everything**

Run: `npx vitest run lib/core/failure.test.ts` → PASS.
Run: `npm run typecheck && npm run check:core && npm test && npm run build` → PASS. `check:core` must still print `/lib/core purity: OK`.

- [x] **Step 6: Mutation check**

Re-add the literal `'נסה שוב'` to `app/error.tsx` in place of the imported constant and run `npx vitest run lib/core/failure.test.ts`.
Expected: FAIL on "⛔ no screen restates the retry label as a literal", naming `app/error.tsx`. Revert.

- [x] **Step 7: Commit**

```bash
git add lib/core/failure.ts lib/core/failure.test.ts app/error.tsx app/global-error.tsx components/MeScreen.tsx components/OnboardingForm.tsx
git commit -m "loop(DEV): C-XXXX T-056 one Hebrew failure sentence"
```

---

## Task 6: Measured spacing between adjacent tap targets (T-057) ✅ C-0085

**Files:**
- Modify: `scripts/verify-mobile.mjs` (constant beside `MIN_TAP` at `:60`; new scan inside the `FLOW_ROUTES` block near `:344`)
- Modify: `scripts/verify-mobile.test.ts`
- Modify: whichever screen the scan reports — **spacing only**, ⛔ no colour and ⛔ no typography change (T-057 row)

**Interfaces:**
- Consumes: nothing.
- Produces: `MIN_GAP = 8` in the harness and one new check line per flow route per width.

- [x] **Step 1: Write the failing wiring test**

Append to `scripts/verify-mobile.test.ts`:

```ts
describe('adjacent tap targets are separated, not merely large (T-057 · constitution § 4)', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('declares the floor as a named constant beside MIN_TAP', () => {
    expect(SRC).toMatch(/const MIN_GAP = 8;/);
  });

  it('measures the gap on the flow screens, where the mis-taps happen', () => {
    expect(SRC).toMatch(/FLOW_ROUTES\.includes\(route\)/);
    expect(SRC).toContain('adjacent tap targets');
  });

  /**
   * The trap this test exists for: two controls that OVERLAP have a negative
   * gap, and a scan written as `Math.abs(gap) >= MIN_GAP` would call that a
   * pass. The comparison must be signed.
   */
  it('compares a signed gap, so an overlap can never read as a pass', () => {
    expect(SRC).not.toMatch(/Math\.abs\([^)]*gap[^)]*\)\s*>=/);
    expect(SRC).toMatch(/gap\s*<\s*MIN_GAP/);
  });

  it('ignores pairs that do not overlap on the cross axis', () => {
    expect(SRC).toContain('overlapsHorizontally');
  });
});
```

- [x] **Step 2: Run it and confirm it fails**

Run: `npx vitest run scripts/verify-mobile.test.ts`
Expected: FAIL on all four — `MIN_GAP` does not exist.

- [x] **Step 3: Add the constant**

Beside `MIN_TAP` (`:60`):

```js
/**
 * T-057: 44px targets that touch each other are still one mis-tap. 8px is the
 * floor the task row names, and it is the second step of the 4px scale the
 * constitution fixes (§ 4).
 */
const MIN_GAP = 8;
```

- [x] **Step 4: Add the scan inside the `FLOW_ROUTES` block**

```js
        // T-057. Only vertically stacked pairs that actually share horizontal
        // space are compared: two controls side by side in a row are separated
        // by their own layout, and treating them as "adjacent" would report a
        // failure the learner's thumb never meets.
        const tooClose = await page.evaluate((min) => {
          const sel = 'a[href], button, input, select, textarea, [role="button"]';
          const boxes = [...document.querySelectorAll(sel)]
            .map((el) => ({
              el,
              r: el.getBoundingClientRect(),
              label: `${el.tagName.toLowerCase()}"${(el.textContent || '').trim().slice(0, 16)}"`,
            }))
            .filter(({ r }) => r.width > 0 && r.height > 0)
            .sort((a, b) => a.r.top - b.r.top);

          const overlapsHorizontally = (a, b) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;

          const found = [];
          for (let i = 0; i < boxes.length - 1; i += 1) {
            for (let j = i + 1; j < boxes.length; j += 1) {
              const a = boxes[i];
              const b = boxes[j];
              // Nested controls (a button inside a label inside a link) are one
              // target, not two — a contained box is never its own neighbour.
              if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
              if (!overlapsHorizontally(a.r, b.r)) continue;
              const gap = b.r.top - a.r.bottom;
              if (gap >= min) break; // sorted by top: everything later is further
              if (gap < min) found.push(`${a.label} ↔ ${b.label} ${Math.round(gap)}px`);
            }
          }
          return found;
        }, MIN_GAP);
        check(
          tooClose.length === 0,
          `${at} adjacent tap targets >= ${MIN_GAP}px apart`,
          `too close: ${tooClose.join(' · ')}`,
        );
```

- [x] **Step 5: Run the harness and read what it reports**

```bash
pkill -f '[n]ext-server' ; pgrep -af next ; rm -rf .next && npm run build && npm run check:mobile
```
Expected: the total rises by **15** (5 flow routes × 3 widths). Some of those 15 may FAIL — that is the finding, not a problem. **Paste every failing pair into the tick report before changing a single class.**

- [x] **Step 6: Fix only what the scan reported, with spacing only**

For each reported pair, widen the container's `gap-*` on the 4px scale (e.g. `gap-1.5` → `gap-2`). ⛔ Do not change a colour, a font size, a radius or a border. ⛔ Do not delete a control to make the pair disappear. If a pair cannot be separated without a layout decision (moving a control to another place on the screen), ⛔ stop: that is a PM screen decision, and it goes to `plan/60-findings.md` as a finding with `file:line`, not into this commit.

- [x] **Step 7: Re-run everything**

Run: `npm run typecheck && npm run check:core && npm test && npm run build` → PASS.
Run the harness again (with the TD-26 preamble) → PASS, and record the final total.

- [x] **Step 8: Mutation check**

Set `MIN_GAP = 0` and re-run `npx vitest run scripts/verify-mobile.test.ts`.
Expected: FAIL on "declares the floor as a named constant beside MIN_TAP". Restore `8`. Then, as a second mutation, tighten one fixed container back to its old `gap-*` and confirm the harness reports that exact pair by name.

- [x] **Step 9: Commit**

```bash
git add scripts/verify-mobile.mjs scripts/verify-mobile.test.ts
git commit -m "loop(DEV): C-XXXX T-057 measured gap between adjacent tap targets"
```

---

## Closing the plan (the tick that finishes Task 6)

- [x] `plan/30-architecture.md` — one numbered subsection describing the institution field's single consumer, the failure-copy module, and the gap scan.
- [x] `plan/50-tasks.md` — T-003, T-056, T-057 marked with the measured evidence (test counts, mutation results, harness total).
- [x] `plan/00-control.md` — `CYCLE_ID`, `ACTIVE_TASK_ID`, `NEXT_AGENT=CRITIC`, lock released, `MILESTONE_TICKS` +1, and a handoff-log row.
- [x] `plan/03-for-roy.md` — nothing new is required, but **item 16 (should we ask about the institution at all?) is now built and can be answered by looking at it.**

---

## Self-review against the spec

| § 4.2ד requirement | task |
|---|---|
| free text, optional, ⛔ not a dropdown, ⛔ not `<LatinField>` | Task 3, steps 1 and 4 |
| `0009` · `profiles.institution TEXT NULL` · max 120 | Task 1, step 3 |
| enters through the existing `POST /api/profile`, as a fourth field on `checkOnboarding` | Tasks 1–2 |
| read **only** by the `/me` display | Task 4 (guard test forbids threshold copy); Task 2 guard forbids a spread |
| `/onboarding` — one field, grouped with the score | Task 3, step 4 (placement per measured conflict 1) |
| `/me` — "המטרה שלך": institution · score · date | Task 4, step 3 |
| both empty ⇒ block not rendered | Task 4, steps 1 and 3 |
| long text truncated at 120 server-side, one line with overflow on screen | Task 1 step 5 · Task 4 step 3 |
| offline copy identical to T-029's | Task 5 (`FAILURE_HE.offline` is the single source) |
| ⛔ no threshold, no readiness, no comparison, no institution list | Tasks 1, 3 and 4 guard tests |
| success metric: a test fails if the field is a `<LatinField>`, if `institution` is `NOT NULL`, if the block renders empty, or if anything outside the display reads it | Task 3 step 1 · Task 1 step 1 · Task 4 step 1 · Task 2 step 1 |
| touch target ≥44px at three widths via `/dev/onboarding` | Task 3, step 7 |
