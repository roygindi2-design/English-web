import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  FUNCTION_WORD_FLOOR,
  MIN_HIT_WIDTH,
  MIN_LINE_HEIGHT,
  MIN_TAP_PAD_Y,
  auditStoryBody,
  normalizeWord,
  overlappingPairs,
} from './story-tap-audit.mjs';
import type { StoryBody, StoryTapTarget } from './story-tap-audit.mjs';

/**
 * T-183 · `plan/36-video-spec.md § 3` (the amended MF-2).
 *
 * `36 § 3` exempts an inline tap target inside a continuous reading paragraph from
 * the 44x44 floor — and pays for the exemption with FOUR conditions, all of which
 * `36 § 3` says are measured. Before this module, `scripts/verify-mobile.mjs`
 * enforced `MIN_TAP = 44` on every `[role="button"]` on every route, so the story
 * screen could not have passed `check:mobile` at all: every tappable word in the
 * paragraph would have reported as an undersized target, and the cheap way out
 * would have been to weaken the 44px scan for everyone.
 *
 * ⛔ The exemption is NOT "words are allowed to be small". It is a TRADE, and this
 * file is the half of the trade that has to be true. The geometry below is shaped
 * like what a real browser hands back — `getBoundingClientRect()` floats, computed
 * paddings in px, a text run with punctuation still attached — because a fixture
 * that differs from production data in ANY dimension is a hole, not a test.
 */

/** A three-letter word: the case `36 § 3` condition 3 calls out by name. */
function target(over: Partial<StoryTapTarget> = {}): StoryTapTarget {
  return {
    text: 'cat',
    translation: 'חתול',
    // 18px of glyph + 8px tap padding each side = 34px of vertical hit area.
    rect: { x: 100, y: 200, width: 33.5, height: 34 },
    padTop: 8,
    padBottom: 8,
    // 'cat' at 16px is ~17.5px wide; 8px each side carries it over 32px.
    padLeft: 8,
    padRight: 8,
    // ...and the same 8px is given back as margin, so the paragraph is unchanged.
    marginLeft: -8,
    marginRight: -8,
    ...over,
  };
}

function body(over: Partial<StoryBody> = {}): StoryBody {
  return {
    route: '/dev/story',
    width: 375,
    lineHeight: 34,
    declaresAmbiguityChip: true,
    targets: [target()],
    ...over,
  };
}

const codes = (b: StoryBody) => auditStoryBody(b).failures.map((f) => f.code);

describe('the thresholds are the ones `36 § 3` writes down', () => {
  it('reads 34px, 8px and 32px out of the spec and not out of habit', () => {
    expect(MIN_LINE_HEIGHT).toBe(34);
    expect(MIN_TAP_PAD_Y).toBe(8);
    expect(MIN_HIT_WIDTH).toBe(32);
  });
});

describe('a compliant paragraph passes', () => {
  it('reports no failure when all four conditions hold', () => {
    expect(auditStoryBody(body()).failures).toEqual([]);
  });

  it('still passes with two well-separated words on one line', () => {
    const b = body({
      targets: [target(), target({ text: 'dog', rect: { x: 200, y: 200, width: 33.5, height: 34 } })],
    });
    expect(auditStoryBody(b).failures).toEqual([]);
  });
});

/**
 * Condition 1 — only content words that HAVE a translation are tappable.
 *
 * The DOM cannot see our lexicon, so the measurable form of "has a translation" is
 * that the target carries the translation it is going to show. A word we cannot
 * translate therefore cannot be marked up as a target without fabricating one.
 * The closed-class list is the second, independent guard: `36 § 3` names
 * `of · the · a · to` and says they are NEVER a target, so a function word that
 * somehow acquired a translation attribute is still rejected.
 */
describe('condition 1 · only content words with a translation are targets', () => {
  it('rejects the four function words `36 § 3` names by name', () => {
    for (const w of ['of', 'the', 'a', 'to']) {
      expect(FUNCTION_WORD_FLOOR.has(w)).toBe(true);
      expect(codes(body({ targets: [target({ text: w })] }))).toContain('function-word');
    }
  });

  it('sees through capitalisation and trailing punctuation', () => {
    // A real paragraph hands back `The` at a sentence start and `to,` mid-clause.
    expect(normalizeWord('The')).toBe('the');
    expect(normalizeWord('to,')).toBe('to');
    expect(normalizeWord('“of”')).toBe('of');
    expect(codes(body({ targets: [target({ text: 'The' })] }))).toContain('function-word');
  });

  it('keeps an internal apostrophe, which is part of the word', () => {
    expect(normalizeWord("don't")).toBe("don't");
  });

  it('rejects a target with no translation behind it', () => {
    expect(codes(body({ targets: [target({ translation: '' })] }))).toContain('no-translation');
    expect(codes(body({ targets: [target({ translation: null })] }))).toContain('no-translation');
  });

  it('rejects a translation that is not Hebrew — an English gloss is not a translation', () => {
    expect(codes(body({ targets: [target({ translation: 'cat' })] }))).toContain('no-translation');
  });

  it('lets a real content word through', () => {
    expect(codes(body({ targets: [target({ text: 'Mountain.', translation: 'הר' })] }))).toEqual([]);
  });
});

describe('condition 2 · line height >= 34px with 8px of vertical tap padding', () => {
  it('rejects a paragraph set tighter than 34px', () => {
    expect(codes(body({ lineHeight: 33.9 }))).toContain('line-height');
  });

  it('rejects a target with less than 8px of padding above or below', () => {
    expect(codes(body({ targets: [target({ padTop: 7.5 })] }))).toContain('tap-pad-y');
    expect(codes(body({ targets: [target({ padBottom: 0 })] }))).toContain('tap-pad-y');
  });

  it('rejects a hit area shorter than 34px even when the paddings look right', () => {
    // The trap: padding is declared but the line box collapsed it away.
    expect(codes(body({ targets: [target({ rect: { x: 100, y: 200, width: 33.5, height: 26 } })] }))).toContain(
      'hit-height',
    );
  });
});

describe('condition 3 · >= 32px of horizontal hit area, centred, appearance unchanged', () => {
  it('rejects a three-letter word left at its natural width', () => {
    // 'cat' with no horizontal padding: ~17.5px, which is what `36 § 3` is about.
    const bare = target({
      rect: { x: 100, y: 200, width: 17.5, height: 34 },
      padLeft: 0,
      padRight: 0,
      marginLeft: 0,
      marginRight: 0,
    });
    expect(codes(body({ targets: [bare] }))).toContain('hit-width');
  });

  it('rejects padding that is not symmetric — that is not centred on the word', () => {
    const lopsided = target({ padLeft: 16, padRight: 0, marginLeft: -16, marginRight: 0 });
    expect(codes(body({ targets: [lopsided] }))).toContain('not-centred');
  });

  it('rejects padding that was NOT given back as margin — that moves the text', () => {
    // The appearance rule, measured: `36 § 3` puts the padding in the hit area
    // ONLY. Uncompensated padding widens the word's inline advance, respaces the
    // whole paragraph, and is exactly the "appearance changed" failure.
    expect(codes(body({ targets: [target({ marginLeft: 0, marginRight: 0 })] }))).toContain('layout-shifted');
  });

  /**
   * ⚠️ The two tolerances are not interchangeable, and the first draft of this
   * module proved it: one 0.5px slack let a 33.9px line box and 7.5px of tap
   * padding through — it moved `36 § 3`'s own numbers rather than absorbing noise.
   * A LAID-OUT rect really does come back rounded; a DECLARED padding does not.
   */
  it('accepts a rect the engine rounded, since 31.98px of hit area is 32px', () => {
    const rounded = target({ rect: { x: 100, y: 200, width: 31.98, height: 33.98 } });
    expect(codes(body({ targets: [rounded] }))).toEqual([]);
  });

  it('⛔ does NOT accept a declared padding that is short of 8px', () => {
    expect(codes(body({ targets: [target({ padTop: 7.8 })] }))).toContain('tap-pad-y');
  });

  it('⛔ does NOT accept a compensation that is 0.2px short of the padding', () => {
    expect(codes(body({ targets: [target({ padLeft: 8, marginLeft: -7.8 })] }))).toContain('layout-shifted');
  });
});

describe('condition 4 · ambiguity is resolved by a chip, never guessed', () => {
  it('finds two hit areas that overlap on the same line', () => {
    const a = target({ text: 'cat', rect: { x: 100, y: 200, width: 33.5, height: 34 } });
    const b = target({ text: 'dog', rect: { x: 125, y: 200, width: 33.5, height: 34 } });
    expect(overlappingPairs([a, b])).toEqual([[0, 1]]);
  });

  it('does not call two words on DIFFERENT lines ambiguous', () => {
    const a = target({ rect: { x: 100, y: 200, width: 33.5, height: 34 } });
    const b = target({ rect: { x: 105, y: 240, width: 33.5, height: 34 } });
    expect(overlappingPairs([a, b])).toEqual([]);
  });

  it('demands the chip once any pair overlaps', () => {
    const b = body({
      declaresAmbiguityChip: false,
      targets: [
        target({ text: 'cat', rect: { x: 100, y: 200, width: 33.5, height: 34 } }),
        target({ text: 'dog', rect: { x: 125, y: 200, width: 33.5, height: 34 } }),
      ],
    });
    const result = auditStoryBody(b);
    expect(result.failures.map((f) => f.code)).toContain('no-ambiguity-chip');
    expect(result.overlaps).toEqual([[0, 1]]);
  });

  it('asks for no chip when nothing overlaps', () => {
    expect(codes(body({ declaresAmbiguityChip: false }))).toEqual([]);
  });
});

describe('a failure says what to fix, on which screen, at which width', () => {
  it('names the route, the width and the word', () => {
    const { failures } = auditStoryBody(body({ targets: [target({ text: 'the' })] }));
    expect(failures).toHaveLength(1);
    const detail = failures[0]?.detail ?? '';
    expect(detail).toContain('/dev/story');
    expect(detail).toContain('375');
    expect(detail).toContain('the');
  });
});

/**
 * ⛔ The drift guard for `story-tap-audit.d.mts`.
 *
 * The declaration is hand-written because the harness runs under plain `node` and
 * `tsconfig.json` keeps `allowJs: false`. A hand-written declaration that stops
 * matching its module type-checks a lie — so the SHAPE is compared mechanically
 * here, and the BEHAVIOUR is compared by every test above, which runs the real
 * module and not its types.
 */
describe('the hand-written declaration still describes the real module', () => {
  it('declares every export the module has, and no export it does not', async () => {
    const runtime = Object.keys((await import('./story-tap-audit.mjs')) as object)
      .filter((k) => k !== 'default')
      .sort();
    const declared = [
      ...readFileSync('scripts/story-tap-audit.d.mts', 'utf8').matchAll(
        /export declare (?:const|function) (\w+)/g,
      ),
    ]
      .map((m) => m[1] ?? '')
      .sort();
    expect(declared).toEqual(runtime);
  });
});
