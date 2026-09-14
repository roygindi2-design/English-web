import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * `<CardSkeleton>` — T-054, constitution § 5, § 4.2ו («טעינה — שלד בצורת הכרטיס, ⛔ לא ספינר»).
 *
 * A source guard, not a render test: the vitest environment is `node` and jsdom is
 * deliberately absent (vitest.config.ts). Geometry — that the shape actually paints at
 * 320/375/414 — is `check:mobile`'s job through the `/dev/deck/skeleton` fixture.
 *
 * ⛔ What this file cannot prove, named so nobody mistakes green here for coverage: that the
 * boxes are the same size as a real card. Nothing in the product asserts that today, and a
 * number copied from `Flashcard.tsx` into this file would drift silently.
 */
const SRC = readFileSync('components/CardSkeleton.tsx', 'utf8');

const CODE = withoutComments(SRC);

describe('<CardSkeleton> — the shape of what is coming (T-054 · חוקה § 5)', () => {
  it('is a SHAPE and ⛔ not a spinner', () => {
    expect(CODE).toContain('data-deck-skeleton');
    for (const spinner of ['animate-spin', 'progressbar', 'טוען…</']) {
      expect(CODE, `${spinner} is a spinner, and § 4.2ו forbids one here`).not.toContain(spinner);
    }
  });

  it('renders three boxes — ⛔ a single bar is not the shape of a card', () => {
    // The one assertion the old one-string guard could not make: a bare
    // `<div data-deck-skeleton />` satisfied `toContain('data-deck-skeleton')`.
    expect(CODE.match(/aria-hidden/g)?.length, 'three aria-hidden boxes').toBe(3);
    // Each box has a height class, so "shape" is a size and not an empty node.
    expect(CODE.match(/className="h-\d+/g)?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('carries the word "loading" for a screen reader, ⛔ not four empty rectangles', () => {
    expect(CODE).toContain('role="status"');
    expect(CODE).toContain('sr-only');
    expect(CODE).toContain('טוען');
  });

  it('⛔ adds no motion — the current skeleton animates nothing (חוקה § 5)', () => {
    // The constitution allows 150–300ms with prefers-reduced-motion honoured. Honouring it
    // by having no animation at all is the cheapest way to be correct; anything added here
    // must come back through a decision, ⛔ not through this file.
    expect(CODE).not.toMatch(/\banimate-\w+/);
    expect(CODE).not.toContain('transition');
  });

  it('fetches nothing — it is renderable with no Supabase env at all', () => {
    for (const io of ['fetch(', 'apiGet', 'useEffect']) {
      expect(CODE, `${io} belongs to the screen above, not to the placeholder`).not.toContain(io);
    }
  });

  it('uses semantic colour tokens only (the palette ratchet, per file)', () => {
    expect(CODE).not.toMatch(/\b(?:bg|text|border)-slate-\d{2,3}\b/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
