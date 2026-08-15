import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<CardDeck>` — T-065 part א׳, plan `2026-08-13-study-queue.md` task 5.
 *
 * A source guard, not a render test: the vitest environment is `node` and jsdom is
 * deliberately not installed (vitest.config.ts). Geometry — one card per screen, the two
 * grade targets at ≥44×44px, zero horizontal scroll — is `check:mobile`'s job through the
 * `/dev/deck` fixture, and that fixture is task 8 of the same plan.
 *
 * What this file can prove is exactly the set of claims that live in the markup and would
 * otherwise be believed rather than measured:
 *
 *   ✔ scroll-snap is on the container, so a card cannot half-scroll (§ 4.2ו)
 *   ✔ the practice label is reachable ONLY from the `unknown` branch — D-033's promise to
 *     the learner is that today's dose never carries it
 *   ✔ `behavior: 'smooth'` is absent — it ignores prefers-reduced-motion (constitution § 5)
 *   ✔ the dead-band pair is absent (F-011 · F-016)
 *   ✔ the deck asks for no data of its own — no `fetch`, no `apiGet` (the screen streams it)
 *   ✔ a graded card leaves the DOM, which is what makes «no scrolling back» true without a
 *     single line that blocks scrolling
 *   ✔ `Flashcard` is rendered with a `key`, because the reveal state inside it is per-card
 *     and a keyless sibling list hands card n+1 to the learner already revealed
 *   ✔ the completion state is a heading and a link, and ⛔ nothing more (T-055 is blocked on
 *     F-032 — the finish SCREEN is the PM's to design, not this component's to invent)
 *
 * ⛔ What it cannot prove, named so nobody mistakes green here for coverage: that the scroll
 * actually lands on the next card in a real engine, and that the two grade buttons clear
 * 44px. Both are `check:mobile`, task 8.
 */
const SRC = readFileSync('components/CardDeck.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

/**
 * The balanced-brace region opened by `open`, `open` included.
 *
 * This is the measurement that C-0100 learned to insist on: a character-distance regex
 * ("the label within N characters of the word `unknown`") convicts correct code and
 * acquits incorrect code as soon as an unrelated line moves. Extracting the branch by
 * matching its braces and then asking whether the string is INSIDE it or OUTSIDE it is a
 * containment question, and containment is what the claim actually is.
 */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected to find ${open} in CardDeck.tsx`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open} in CardDeck.tsx`);
}

/**
 * Every balanced-brace region opened by `open` — the plural of `braceRegion`.
 *
 * C-0137 measured why the singular is not enough: the finish state (T-055) gates the D-033
 * notice behind its own `deck === 'unknown'` ternary, so the file legitimately holds two
 * gates. `indexOf` sees only the first, and the containment guard read the second gated copy
 * as a leak. Subtracting ALL gated regions is the same containment question asked of a file
 * that is allowed to grow gates — ⛔ it does not weaken the claim: a copy that sits behind no
 * gate at all still survives the subtraction and still turns the guard red.
 */
function braceRegions(source: string, open: string): string[] {
  const regions: string[] = [];
  for (let from = 0; ; ) {
    const start = source.indexOf(open, from);
    if (start === -1) return regions;
    let depth = 0;
    let end = -1;
    for (let i = start; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) throw new Error(`unbalanced braces after ${open} in CardDeck.tsx`);
    regions.push(source.slice(start, end + 1));
    from = end + 1;
  }
}

const PRACTICE_LABEL = 'לא משנה את מועד החזרה';
/** The gate the label is allowed to live behind, and the only one. */
const UNKNOWN_GATE = "{deck === 'unknown'";

describe('<CardDeck> — the scrolling deck (T-065 · § 4.2ו)', () => {
  it('is a client component — it holds which cards were already graded', () => {
    expect(CODE).toContain("'use client'");
  });

  it('snaps one card to one screen', () => {
    expect(CODE).toContain('snap-y');
    expect(CODE).toContain('snap-mandatory');
    expect(CODE).toContain('snap-start');
  });

  /**
   * ⚠️ This test used to demand `h-dvh`, and `/dev/deck` falsified it the first time the deck
   * was ever rendered by the harness (C-0104, T-065 task 8). Both obvious heights were
   * measured wrong at 320/375/414:
   *
   *   `h-dvh`  ⇒ card 1 occupied y=105..832 of a 780px viewport. The deck does not own the
   *             viewport — the root layout gives it a header above and the licence footer
   *             below — so 52px of the card, and both grade buttons with it, sat below the
   *             fold. Answer buttons off screen are the F-027 dead end by another route.
   *   `flex-1` ⇒ card 1 collapsed to 215px of content and card 2 sat visible under it. The
   *             root column is `min-h-dvh`: its height is INDEFINITE, so nothing in this
   *             subtree stretches and no `h-full` below it resolves.
   *
   * So the deck states a definite height — the viewport minus the 10rem of chrome the root
   * layout renders around it. That number is about another file, and it is not trusted here:
   * `/dev/deck` measures the RESULT at all three widths, which is what makes changing the
   * chrome a red run instead of a silent 16px.
   *
   * `min-h-0` on the scroll container is not decoration either — without it a flex child
   * refuses to shrink below its content and the `overflow-y-auto` never scrolls.
   */
  it('states a definite height, ⛔ neither the full viewport nor a stretch', () => {
    expect(CODE).not.toContain('h-dvh');
    expect(CODE).toMatch(/h-\[calc\(100dvh-10rem\)\]/);
    expect(CODE).toContain('min-h-0');
  });

  /** The snap viewport is marked, because `/dev/deck` measures the deck against it and ⛔ not against the window. */
  it('marks the snap viewport for the harness', () => {
    expect(CODE).toContain('data-deck-scroll');
  });

  it('⛔ never centres a flex column — the F-011 · F-016 dead band', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
  });

  it("⛔ carries no behavior: 'smooth' — it overrides prefers-reduced-motion", () => {
    expect(CODE).not.toMatch(/behavior:\s*'smooth'/);
    expect(CODE).not.toMatch(/behavior:\s*"smooth"/);
    expect(CODE).toMatch(/behavior:\s*'auto'/);
  });

  it('⛔ fetches nothing itself — the screen above it owns the network (task 6)', () => {
    expect(CODE).not.toContain('fetch(');
    expect(CODE).not.toContain('apiGet');
    expect(CODE).not.toContain('apiPost');
    expect(CODE).not.toContain('/api/');
  });

  /**
   * D-033 in the markup. The label is a promise to the learner about what the button they
   * are about to press does NOT do; a copy of it on today's dose would be a lie, and its
   * absence from the practice deck would be a silent schedule change.
   */
  it('shows the practice label behind unknown gates and ⛔ nowhere else', () => {
    // C-0137: the file carries TWO gates since T-055 — the scrolling header and the finish
    // state — and each holds one copy. «exactly one copy in the file» was a proxy for the
    // claim while there was one gate; the claim itself is containment, so it is asked of
    // every gate. ⛔ Not a relaxation: an ungated copy still survives the subtraction below.
    const gates = braceRegions(CODE, UNKNOWN_GATE);
    expect(gates.length, 'at least one unknown gate').toBeGreaterThan(0);

    const gated = gates.filter((gate) => gate.includes(PRACTICE_LABEL));
    expect(gated.length, 'the label must be inside an unknown gate').toBeGreaterThan(0);

    let outside = CODE;
    for (const gate of gates) outside = outside.split(gate).join('');
    expect(outside, 'the label leaked outside the unknown gates').not.toContain(PRACTICE_LABEL);

    // Every copy is accounted for by a gate — no copy hides in a region the subtraction
    // happened to remove for another reason.
    expect(
      CODE.match(new RegExp(PRACTICE_LABEL, 'g'))?.length,
      'every copy of the label sits behind a gate',
    ).toBe(gated.length);
  });

  it('renders the remaining cards only — a graded card leaves the DOM', () => {
    // «no scrolling back to a card you graded» is implemented by removal, so there is
    // nothing here that blocks scrolling and nothing to get out of sync with the queue.
    expect(CODE).toMatch(/\.filter\(/);
    expect(CODE).toContain('graded');
    expect(CODE).not.toContain('preventDefault');
    expect(CODE).not.toContain('overflow-hidden');
  });

  it('keys each Flashcard by word_id — reveal state is per card', () => {
    expect(CODE).toMatch(/key=\{[^}]*word_id[^}]*\}/);
    expect(CODE).toContain('buildCard');
  });

  it('⛔ does not reimplement the grade controls — Flashcard already carries them', () => {
    expect(CODE).toContain('<Flashcard');
    for (const label of ['ידעתי', 'לא ידעתי', 'הצג תשובה']) {
      expect(CODE, `${label} belongs to Flashcard.tsx, not to the deck`).not.toContain(label);
    }
  });

  it('IS the finish state now — deck identity, one way out to the בורר (T-055 · § 4.2ו)', () => {
    // F-032 was opened 2026-08-13T15:49:54Z and the PM's § 4.2ו landed 15:53:21Z — three
    // minutes later. The finish state is decided: «בסוף המחזור מסך סיום», «יוצאים — מסך
    // הסיום, ומשם חזרה לבורר», «המילה האחרונה — מסך סיום ולא מסך לבן».
    const done = braceRegion(CODE, 'if (remaining.length === 0) {');

    // ⓐ Distinguishable from `empty` in the DOM — that is literally F-032's question.
    expect(done).toContain('data-deck-done');
    expect(done).toContain('סיימת');

    // ⓑ Deck identity, built from the two strings this file ALREADY renders in its header.
    //    A learner who finished תרגול and one who finished מנת היום must not read the same
    //    screen, and D-033's promise has to hold on the screen the learner is looking at.
    expect(done).toContain(PRACTICE_LABEL);
    expect(done).toContain('מנת היום');

    // ⓒ Exactly one way out, and it goes to the בורר (§ 4.2ו q6).
    expect(done).toContain('href="/cards"');
    expect(done.match(/data-primary-action/g)?.length, 'exactly one primary action').toBe(1);

    // ⓓ ⛔ Still nothing the PM did not decide. T-055: «אין מספרים חדשים ואין הבטחה».
    for (const invented of ['רצף', 'ניקוד', 'מוכנות', 'כל הכבוד', '%']) {
      expect(done, `"${invented}" is a claim no decision makes`).not.toContain(invented);
    }
    // ⛔ No count either: `data-remaining` belongs to the scrolling header, and a "0 נותרו"
    //    on the finish state would be a new number on a screen that forbids new numbers.
    expect(done).not.toContain('data-remaining');
  });

  it('shows a live remaining counter beside the deck label', () => {
    expect(CODE).toContain('data-remaining');
  });

  it('uses semantic colour tokens only (the palette ratchet, per file)', () => {
    expect(CODE).not.toMatch(/\b(?:bg|text|border)-slate-\d{2,3}\b/);
    expect(CODE).not.toMatch(/\bbg-brand(?![-\w])/);
  });
});

describe('the brace extractor itself is measured, so the guard above is not vacuous', () => {
  it('returns the balanced region and not the rest of the file', () => {
    const src = "a {deck === 'unknown' ? (<p>{x}</p>) : null} b";
    expect(braceRegion(src, UNKNOWN_GATE)).toBe("{deck === 'unknown' ? (<p>{x}</p>) : null}");
  });

  it('would catch a label planted outside the branch', () => {
    const src = `<p>${PRACTICE_LABEL}</p> {deck === 'unknown' ? (<p>${PRACTICE_LABEL}</p>) : null}`;
    const branch = braceRegion(src, UNKNOWN_GATE);
    expect(src.split(branch).join('')).toContain(PRACTICE_LABEL);
  });

  /**
   * C-0137. `braceRegion` takes the FIRST match and only it, so a file with two gates had
   * its second gate counted as "outside" — measured: `CardDeck.tsx` carries gates at two
   * offsets, one label inside each, and the single-region guard called that a leak. The
   * containment claim never changed; the "there is exactly one gate" proxy expired.
   */
  it('extracts EVERY gate and not only the first (the two-gate file)', () => {
    const src = `{deck === 'unknown' ? (<p>a</p>) : null} x {deck === 'unknown' ? (<p>b</p>) : null}`;
    const regions = braceRegions(src, UNKNOWN_GATE);
    expect(regions.length, 'both gates').toBe(2);
    expect(regions[0]).toBe("{deck === 'unknown' ? (<p>a</p>) : null}");
    expect(regions[1]).toBe("{deck === 'unknown' ? (<p>b</p>) : null}");
  });

  it('would still catch a label planted outside EVERY gate', () => {
    const src = `<p>${PRACTICE_LABEL}</p> {deck === 'unknown' ? (<p>${PRACTICE_LABEL}</p>) : null}`;
    let outside = src;
    for (const region of braceRegions(src, UNKNOWN_GATE)) outside = outside.split(region).join('');
    expect(outside, 'the ungated copy survives the subtraction').toContain(PRACTICE_LABEL);
  });
});
