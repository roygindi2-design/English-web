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
  it('shows the practice label in the unknown branch and ⛔ nowhere else', () => {
    const branch = braceRegion(CODE, UNKNOWN_GATE);
    expect(branch, 'the label must be inside the unknown branch').toContain(PRACTICE_LABEL);

    const outside = CODE.split(branch).join('');
    expect(outside, 'the label leaked outside the unknown branch').not.toContain(PRACTICE_LABEL);
    expect(
      CODE.match(new RegExp(PRACTICE_LABEL, 'g'))?.length,
      'exactly one copy of the label',
    ).toBe(1);
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

  it('ends with a heading and a way out, and ⛔ invents no finish screen (T-055 · F-032)', () => {
    expect(CODE).toContain('סיימת');
    expect(CODE).toContain('href="/cards"');
    // The claims a finish screen would make. T-055 is blocked in the PM's court on F-032;
    // a deck that shipped them would be answering a design question nobody decided.
    for (const invented of ['רצף', 'ניקוד', 'מוכנות', 'כל הכבוד', '%']) {
      expect(CODE, `"${invented}" is a screen the PM has not designed`).not.toContain(invented);
    }
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
});
