import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-076 — the offline screen was the only terminal state in the product with
 * no action on it.
 *
 * `app/error.tsx`, `app/not-found.tsx` and all three failure branches of
 * `components/WorldFeed.tsx` end in exactly one action. This screen ended in
 * two sentences, and a learner whose connection came back had nothing to press.
 *
 * A source guard and ⛔ not a render test: environment is `node`, jsdom absent.
 */
const SRC = readFileSync('app/offline/page.tsx', 'utf8');

const CODE = withoutComments(SRC);

describe('the offline screen (T-076 · constitution § 4)', () => {
  /**
   * A plain `<a href="/">` and ⛔ not `<Link>`: this document is precached by
   * the service worker and served for a navigation that already failed, so the
   * retry has to be a full request that re-enters the network. The client
   * router would be free to answer it from the cache that just failed.
   *
   * This is the same reason `components/MeScreen.tsx:60` is a bare anchor.
   */
  it('offers exactly one action, as a full-request anchor', () => {
    expect(CODE).toMatch(/<a[^>]*href="\/"/);
    expect(CODE).not.toContain('next/link');
    expect(CODE.match(/<a\s/g)?.length, 'one action, not two').toBe(1);
  });

  /**
   * ⚠️ The label is asserted as an *import reference* and ⛔ not as the literal
   * «נסה שוב». T-056 exists because this product once carried four wordings for
   * one event across four files; a test that accepts the literal accepts the
   * fifth. `lib/core/failure.test.ts` owns the wording, this file owns the fact
   * that the screen renders it rather than restating it.
   */
  it('reuses the shared retry label, ⛔ never a new string', () => {
    expect(CODE).toMatch(/import \{[^}]*RETRY_HE[^}]*\} from '@\/lib\/core\/failure'/);
    expect(CODE).toContain('{RETRY_HE}');
  });

  /**
   * The bordered-button shape from `WorldFeed:182` — the product's existing
   * "secondary action in a failure state" form. Touch target is the `min-h-touch`
   * token (constitution § 4), ⛔ not a bare underline the thumb has to hunt for.
   */
  it('wears the bordered failure-action shape, at a 44px target', () => {
    expect(CODE).toMatch(/min-h-touch/);
    expect(CODE).toMatch(/rounded-lg/);
    expect(CODE).toMatch(/border-border-strong/);
  });

  /**
   * ⛔ Dev does not write product copy (`plan/40-decisions.md` is the PM's).
   * The screen may carry exactly the three Hebrew strings it already had; the
   * fourth arrives by import, so it does not appear as a literal here.
   */
  it('⛔ invents no Hebrew copy — the two existing sentences and nothing else', () => {
    const hebrew = CODE.match(/[֐-׿][֐-׿ ,.!?"'־–-]*/g) ?? [];
    const joined = hebrew.join('|');
    expect(joined).toContain('אין חיבור כרגע');
    expect(joined).toContain('מה שכבר הורדת יחכה לך כאן');
    for (const invented of ['בדוק את החיבור', 'רענן', 'טען מחדש', 'חזור']) {
      expect(joined, `"${invented}" is copy Dev does not get to write`).not.toContain(invented);
    }
  });

  /**
   * ⛔ A precached offline document that needs a JS bundle to draw a link is a
   * blank screen on the one occasion it exists for.
   */
  it('⛔ stays a server component', () => {
    expect(CODE).not.toContain("'use client'");
    expect(CODE).not.toContain('"use client"');
  });
});
