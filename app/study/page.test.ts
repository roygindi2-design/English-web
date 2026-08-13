import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `/study` — T-065 part ב׳, plan `2026-08-13-study-queue.md` task 6.
 *
 * The screen is a Server Component whose whole job is to read one query parameter and hand
 * a validated deck name down. That is a small surface, and every claim in it is one a
 * reader would otherwise take on trust:
 *
 *   ✔ it stays a Server Component — ⛔ no `'use client'`, ⛔ no fetch on the server
 *   ✔ the deck name is validated by `parseDeckName` and ⛔ not by a hand-rolled comparison
 *     that would drift from `DECK_NAMES` the day a third deck lands
 *   ✔ an unknown `?deck=` value falls back to the day's dose, ⛔ and does not 404: a stale
 *     bookmark is not an error the learner can act on
 *
 * ⛔ It cannot prove the page renders — that is `/dev/deck` and `check:mobile` (task 8).
 */
const SRC = readFileSync('app/study/page.tsx', 'utf8');

function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('/study — the deck screen (T-065)', () => {
  it('stays a Server Component', () => {
    expect(CODE).not.toContain("'use client'");
  });

  it('⛔ fetches nothing on the server — the client component owns the network', () => {
    expect(CODE).not.toMatch(/[^i]fetch\(/);
    expect(CODE).not.toContain('apiGet');
    expect(CODE).not.toContain('/api/');
  });

  it('validates ?deck= through parseDeckName and falls back to the day’s dose', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/deck'/);
    expect(CODE).toContain('parseDeckName');
    expect(CODE).toMatch(/\?\?\s*'due'/);
  });

  it('reads searchParams as a promise — Next 16 (⛔ not the Next 14 object)', () => {
    expect(CODE).toContain('searchParams');
    expect(CODE).toMatch(/await\s+searchParams/);
  });

  it('renders the deck screen and ⛔ no longer hard-codes the empty state', () => {
    expect(CODE).toContain('<StudyDeckScreen');
    expect(CODE).not.toContain('StudyEmptyState');
  });
});
