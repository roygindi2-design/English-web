import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<StudyDeckScreen>` — T-065 part ב׳, plan `2026-08-13-study-queue.md` task 6.
 *
 * A source guard, in the same shape and for the same reason as `CardDeck.test.ts`: the
 * vitest environment is `node` and jsdom is deliberately absent (vitest.config.ts), so a
 * render test does not belong here. Geometry is `check:mobile`'s job through `/dev/deck`
 * (task 8).
 *
 * What this file proves is the wiring that would otherwise be believed rather than
 * measured — and one of those claims is the whole of D-033:
 *
 *   ✔ the network lives HERE and only here (`apiGet`/`apiPost`, ⛔ no bare `fetch`)
 *   ✔ **the route is chosen by the deck**: `unknown` ⇒ `/api/practice`, `due` ⇒
 *     `/api/review`. Crossing those two wires is not a typo, it is a schedule change the
 *     learner was promised would not happen
 *   ✔ all five states named by the plan exist in the code, not only in the plan
 *   ✔ `schema_missing` says the bank is not set up, ⛔ never "no cards" — one is a fault
 *     and the other is a normal end of session, and only one of them is the learner's cue
 *     to stop trying
 *   ✔ `elapsed_ms` is clamped to `MAX_ELAPSED_MS`, imported and ⛔ not re-typed as 600000
 *   ✔ a grade that did not reach the server RE-THROWS, because `<CardDeck>` keeps the card
 *     exactly when `onGraded` rejects — swallowing it here is a lost answer there
 *   ✔ ⛔ the F-011 · F-016 dead band is absent
 *
 * ⛔ What it cannot prove, named so nobody mistakes green here for coverage: that the fetch
 * actually returns, that the states render in the right order, or that the offline copy is
 * reachable in a real engine.
 */
const SRC = readFileSync('components/StudyDeckScreen.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

/**
 * The balanced-brace region opened by `open`, `open` included — the C-0100 lesson, reused
 * verbatim from `CardDeck.test.ts`: a character-distance regex convicts correct code and
 * acquits incorrect code the moment an unrelated line moves. Containment is the claim, so
 * containment is what gets measured.
 */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected to find ${open} in StudyDeckScreen.tsx`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open} in StudyDeckScreen.tsx`);
}

/** The gate the practice route is allowed to live behind, and the only one. */
const UNKNOWN_GATE = "if (deck === 'unknown') {";

describe('<StudyDeckScreen> — the screen that owns the network (T-065 · § 4.2ו)', () => {
  it('is a client component', () => {
    expect(CODE).toContain("'use client'");
  });

  it('speaks HTTP only through lib/api/client.ts — ⛔ no bare fetch', () => {
    expect(CODE).toMatch(/from '@\/lib\/api\/client'/);
    expect(CODE).toContain('apiGet');
    expect(CODE).toContain('apiPost');
    expect(CODE).not.toMatch(/[^i]fetch\(/);
  });

  /**
   * D-033, measured as CONTAINMENT and ⛔ not as character distance. `/api/practice` must
   * be inside the `unknown` branch and `/api/review` must be outside it: a learner drilling
   * a word they did not know is told, in a label the deck keeps on screen the whole time,
   * that this does not move the review date. Sending those grades to `/api/review` would
   * make that label a lie written by the product itself.
   */
  it('routes by deck: unknown ⇒ /api/practice, due ⇒ /api/review', () => {
    const branch = braceRegion(CODE, UNKNOWN_GATE);
    expect(branch, 'the practice route must be inside the unknown branch').toContain(
      '/api/practice',
    );
    expect(branch, 'the review route must NOT be inside the unknown branch').not.toContain(
      '/api/review',
    );

    const outside = CODE.split(branch).join('');
    expect(outside, 'the review route belongs to the due deck').toContain('/api/review');
    expect(outside, 'the practice route leaked outside the unknown branch').not.toContain(
      '/api/practice',
    );
  });

  /** The extractor itself, so the containment test above cannot pass on an empty string. */
  it('the brace extractor really extracts the branch', () => {
    const branch = braceRegion(CODE, UNKNOWN_GATE);
    expect(branch.length).toBeGreaterThan(40);
    expect(branch.startsWith(UNKNOWN_GATE)).toBe(true);
    expect(branch.endsWith('}')).toBe(true);
  });

  it('asks the queue endpoint for the deck it was given', () => {
    expect(CODE).toMatch(/\/api\/study\/queue\?deck=/);
  });

  it('clamps elapsed_ms with the imported ceiling — ⛔ not a re-typed 600000', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/reviewRequest'/);
    expect(CODE).toContain('MAX_ELAPSED_MS');
    expect(CODE).toContain('Math.min');
    expect(CODE, 'the route rejects a fractional elapsed_ms with 400').toContain('Math.round');
    expect(CODE).not.toContain('600000');
  });

  /**
   * `<CardDeck>` keeps a card exactly when `onGraded` rejects. So the failure path here has
   * to end in a `throw`: a caught-and-swallowed error would drop the card off the screen as
   * if the grade had been saved, and the learner would never see that word again today.
   */
  it('re-throws a grade that did not reach the server — ⛔ the card must stay', () => {
    // The catch that handles a failed grade, and ⛔ not `sendGrade`: that function throws
    // by construction, so measuring IT would stay green while the component quietly
    // swallowed the rejection — measured, C-0102, by deleting the re-throw.
    const recovery = braceRegion(CODE, 'catch (error) {');
    expect(recovery, 'the message is set before the rejection travels on').toContain(
      'setGradeError',
    );
    expect(recovery, 'the rejection is what keeps the card in the deck').toContain('throw error');
  });

  it('treats an {ok:false} answer as a failed grade too — ⛔ not as saved', () => {
    // A 404 from /api/practice or a 503 from /api/review is a grade that did not land. It
    // arrives as DATA (that is this product's HTTP contract), so nothing rejects unless
    // the route function looks at the flag and throws.
    const sender = braceRegion(CODE, 'async function sendGrade');
    expect(sender.match(/if \(!\w+\.ok\) throw/g)?.length, 'both routes checked').toBe(2);
  });

  it('names the offline failure as offline and ⛔ not as a save failure', () => {
    expect(CODE).toContain('ApiUnreachableError');
    expect(CODE).toMatch(/FAILURE_HE\.offline/);
  });

  /** All five states the plan names, each one reachable in the code. */
  it('delegates loading to <CardSkeleton> — ⛔ never a spinner (T-054 · חוקה § 5)', () => {
    // The shape itself is guarded in components/CardSkeleton.test.ts. What this file owns is
    // the wiring: that the `loading` state renders that component and ⛔ nothing else, so a
    // spinner cannot creep back in beside it.
    expect(CODE).toContain("import CardSkeleton from '@/components/CardSkeleton'");
    const loading = braceRegion(CODE, "{state.kind === 'loading' &&");
    expect(loading).toContain('<CardSkeleton />');
    expect(loading).not.toContain('animate-spin');
    // ⛔ Nothing else in the branch: no second element, no sentence, no retry.
    expect(loading.match(/</g)?.length, 'exactly one element in the loading branch').toBe(1);
  });

  it('tells the truth about schema_missing — ⛔ never "no cards"', () => {
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('sends an expired session to /login and offers a retry otherwise', () => {
    expect(CODE).toContain('session_expired');
    expect(CODE).toContain('/login');
    expect(CODE).toContain('RETRY_HE');
  });

  it('reuses the shared empty state — ⛔ does not re-word an empty queue', () => {
    expect(CODE).toContain('StudyEmptyState');
    expect(CODE).not.toContain('אין כרטיסיות כרגע');
  });

  it('hands the cards to <CardDeck> and ⛔ does not re-render a card itself', () => {
    expect(CODE).toContain('<CardDeck');
    expect(CODE).not.toContain('<Flashcard');
    expect(CODE).not.toContain('buildCard');
  });

  it('⛔ never centres a flex column — the F-011 · F-016 dead band', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
  });
});
