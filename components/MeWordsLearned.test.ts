import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The counted figure on the אני tab, and the failure that read can produce.
 *
 * ⚠️ **T-301.** These guards were written for `app/(tabs)/me/page.tsx` in C-0073,
 * moved to `components/MeScreen.test.ts` in C-0075, and moved here with the
 * markup they describe — ⛔ none were dropped. The markup left `<MeScreen>`
 * because the count is the one value on that tab that waits on Supabase, and a
 * value cannot stream into a client component through a prop.
 *
 * A source guard and not a render test: the environment is node and jsdom is
 * deliberately not installed (vitest.config.ts). Geometry is `check:mobile`'s
 * job, through the `/dev/tabs/me` fixture that renders this same component.
 */
const SRC = readFileSync('components/MeWordsLearned.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<MeWordsLearned> — the counted figure (T-051 · § 4.2ב · T-301)', () => {
  /**
   * The number carries a Hebrew label, so size and weight are never the only
   * channel that says what it counts (constitution § 1).
   */
  it('renders the number with its Hebrew label, ⛔ never the number alone', () => {
    expect(CODE).toContain("const WORDS_LEARNED_HE = 'מילים שלמדת בכל הרמות'");
    expect(CODE).toContain('{wordsLearned}');
    expect(CODE).toContain('{WORDS_LEARNED_HE}');
  });

  /**
   * T-303. The two numbers on this tab count different populations: THIS one is
   * `mastered_at is not null` across every level, and the «ידוע» tile under
   * «התקדמות ברמה הנוכחית» is the active level alone. The failure they produced
   * together is ⛔ not arithmetic (189 ⊇ 128 is correct) — it is that the bigger
   * number carried the narrower label, so a learner reading both concludes the
   * product forgot 61 words.
   *
   * ⇒ the guard is on the SCOPE being named, ⛔ not on the exact sentence: a label
   * that drops «בכל הרמות» puts the ambiguity straight back.
   */
  it('names the scope of what it counts, ⛔ not just «מילים» (T-303)', () => {
    expect(CODE).toContain('בכל הרמות');
    // The old label counted the same thing and ⛔ said so nowhere.
    expect(CODE).not.toContain("'מילים שנלמדו'");
  });

  /**
   * T-303ⓒ. `taste-skill § 4.5` on duplicate intent, applied to text: a sentence
   * that explains a label is an admission the label does not work. The scope
   * belongs INSIDE the label, and the tile heading «התקדמות ברמה הנוכחית» already
   * carries the other scope — ⛔ so this screen gets one new word group, ⛔ not two
   * new labels and ⛔ not a helper line.
   *
   * ⛔ And no em-dash: `taste-skill` bans it in labels outright, with no allowance.
   */
  it('carries the scope in the label itself, ⛔ no helper line and ⛔ no em-dash (T-303)', () => {
    const label = CODE.match(/const WORDS_LEARNED_HE = '([^']*)'/)?.[1];
    expect(label, 'the label constant was not found').toBeDefined();
    expect(label).not.toContain('—');
    expect(label).not.toContain('(');
    for (const forbidden of ['title=', 'aria-describedby', 'tooltip']) {
      expect(CODE, `"${forbidden}" turns the label into a footnote`).not.toContain(forbidden);
    }
  });

  it('shows a count and ⛔ never a readiness estimate or a predicted score (4.4.3)', () => {
    for (const forbidden of ['מוכנות', 'ציון חזוי', 'צפוי לקבל', '%']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  /**
   * ⛔ No `'use client'`: this component has no hook and no handler, and it has to
   * render on the server to resolve inside the route's `<Suspense>` boundary.
   * A stray directive here would move the count back onto the client and silently
   * undo T-301.
   */
  it('stays a server component, which is what lets the route stream it (T-301)', () => {
    expect(CODE).not.toContain("'use client'");
  });

  /**
   * The failure branch is the reason this component takes `number | null` and
   * not `number`. A learner staring at `0` after a failed read is being told
   * something false about their own work, in the one place the product claims
   * to report it.
   */
  it('shows a Hebrew sentence and a retry when the read failed, ⛔ not a silent zero', () => {
    expect(CODE).toMatch(/wordsLearned === null/);
    // T-056: the sentence and the button label are imported, ⛔ not restated here.
    // Asserting on the literal is what let this screen carry the third of four
    // rival wordings for one event; `lib/core/failure.test.ts` owns the wording
    // itself, and this file owns the fact that the failure branch renders it.
    expect(CODE).toMatch(/import \{[^}]*FAILURE_HE[^}]*\} from '@\/lib\/core\/failure'/);
    expect(CODE).toContain('{FAILURE_HE.load}');
    expect(CODE).toContain('{RETRY_HE}');
    // A plain <a>, so the retry reaches the server instead of the router cache.
    // ⚠️ Whitespace-tolerant since C-0163: T-075 gave this anchor a className long
    // enough to push `href` onto its own line, and the old `/<a href="\/me"/`
    // failed on the line break — a formatting fact, ⛔ not the rule. The rule is
    // «a bare <a>, aimed at /me», and both halves are still asserted: the `<a`
    // tag itself, and ⛔ the absence of a <Link> to the same route.
    expect(CODE).toMatch(/<a\s[^>]*href="\/me"/);
    expect(CODE).not.toMatch(/<Link[^>]*href="\/me"/);
  });

  /**
   * T-075. `RETRY_HE` is one constant standing for one action in one state, and
   * it shipped in two shapes: a bordered 44px button in `WorldFeed:182`, and
   * here an underlined run of text. A learner who meets both cannot tell that
   * they are the same thing, and the underline is the one that is hard to hit.
   * Constitution § 4 (44px target) · § 6 (one component per role).
   *
   * ⚠️ ⛔ The element stays an `<a href="/me">` — asserted above, and again by
   * omission here. The screen is a Server Component and the retry has to be a
   * full request; turning it into a `<button>` to match `WorldFeed`'s tag would
   * trade a real behaviour for a cosmetic match.
   */
  it('gives the retry the bordered shape the rest of the product uses (T-075)', () => {
    const retry = CODE.match(/<a\s[^>]*href="\/me"[^>]*className="([^"]*)"/)?.[1];
    expect(retry, 'the retry className was not found').toBeDefined();
    expect(retry).toContain('min-h-touch');
    expect(retry).toContain('rounded-lg');
    expect(retry).toContain('border-border-strong');
    expect(retry).toContain('px-5');
    expect(retry).toContain('py-3');
    // ⛔ Not both: a bordered button that is also underlined is a third shape.
    expect(retry).not.toContain('underline');
  });
});
