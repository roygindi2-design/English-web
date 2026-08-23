/**
 * T-183 — the four conditions of `plan/36-video-spec.md § 3` (the amended MF-2),
 * as a pure function over geometry a browser already measured.
 *
 * ⛔ WHY THIS EXISTS AND WHAT IT IS NOT
 * `36 § 3` exempts an inline tap target inside a continuous reading paragraph from
 * the 44x44 floor, because widening a word to 44px means changing the font — which
 * breaks the design constitution. The exemption is deliberately narrow: **story
 * paragraphs only**, ⛔ never a button, chip, tab or list row.
 *
 * The exemption is a TRADE. `scripts/verify-mobile.mjs` stops applying `MIN_TAP`
 * to a `[data-story-word]` inside a `[data-story-body]`, and in exchange every such
 * word is audited here against all four conditions, at 320/375/414px. A condition
 * that fails is a BLOCKER — ⛔ not permission to ship a bare tappable word. The
 * agreed fallback if the four cannot hold is going back to tapping the LINE
 * (`§ 4.2יג-ב ⓐ`). ⛔ There is no third path.
 *
 * It is a separate module and not inline in the harness for one reason: the
 * harness runs a real Chromium and cannot be unit tested, so a rule written inside
 * it can only ever be asserted as source text. Here the rules are executed against
 * production-shaped geometry in `story-tap-audit.test.ts`, and every one of them
 * fails when it is removed.
 *
 * ⛔ This module is pure: no DOM, no network, no clock. It is fed measurements.
 */

/** `36 § 3` condition 2 — the paragraph's line box. */
export const MIN_LINE_HEIGHT = 34;

/** `36 § 3` condition 2 — vertical tap padding, each side. */
export const MIN_TAP_PAD_Y = 8;

/** `36 § 3` condition 3 — horizontal hit area, "even for a three-letter word". */
export const MIN_HIT_WIDTH = 32;

/**
 * ⚠️ TWO tolerances, and conflating them silently lowers the spec by half a pixel.
 * Measured while writing this module: a single 0.5px slack let a 33.9px line box
 * and 7.5px of tap padding through, i.e. it moved `36 § 3`'s own numbers.
 *
 * `LAYOUT` — what the engine LAID OUT. `getBoundingClientRect()` returns floats the
 * browser rounded on its own; a 32px hit area can measure 31.98px and be correct.
 *
 * `STYLE` — what the stylesheet DECLARED. `getComputedStyle()` resolves
 * `padding-inline: 8px` to exactly "8px", so there is nothing to absorb here beyond
 * float representation, and any real slack would be the spec moving.
 */
const LAYOUT_EPSILON = 0.5;
const STYLE_EPSILON = 0.05;

/**
 * `36 § 3` condition 1, half of it: "of · the · a · to never a target".
 *
 * ⚠️ This is a FLOOR, ⛔ not a definition of "content word". It can only make the
 * audit stricter — a word on this list is rejected outright — so it can never
 * produce a false pass, and it needs no lexical source to be safe (⛔ contrast
 * R-026, which is a claim about English that WOULD need one).
 *
 * The positive half — "the word has a translation" — is enforced by
 * `hasTranslation` below, because the DOM cannot see our lexicon: the only thing a
 * browser can check is that the target carries the translation it is about to
 * show. A word we cannot translate therefore cannot be marked up as a target
 * without fabricating one, and a fabricated Hebrew gloss is a content finding,
 * which is a different guard's job.
 */
export const FUNCTION_WORD_FLOOR = new Set([
  // articles + the two `36 § 3` names alongside them
  'a', 'an', 'the',
  // prepositions
  'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'onto',
  'over', 'under', 'about', 'after', 'before', 'between', 'through', 'during',
  'against', 'above', 'below', 'up', 'down', 'out', 'off', 'across',
  // conjunctions
  'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'than', 'because', 'while',
  'that', 'though', 'although', 'unless', 'until', 'as',
  // pronouns + determiners
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'these', 'those',
  'who', 'whom', 'whose', 'which', 'what', 'some', 'any', 'each', 'every',
  // auxiliaries + copula
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  // negation + the infinitive particle's neighbours
  'not', 'no', 'there', 'here', 'then', 'too', 'very', 'just',
]);

/** Hebrew letters. A translation a learner can read is written in them. */
const HEBREW = /[֐-׿]/;

/**
 * A word as it sits in a paragraph carries the sentence's punctuation and its
 * capitalisation. `The` at a sentence start and `to,` mid-clause are the same
 * function words as `the` and `to`, and a normaliser that misses that turns
 * condition 1 into decoration.
 *
 * ⛔ An apostrophe INSIDE the run is kept: `don't` is one word, `don` is not.
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeWord(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '');
}

/**
 * @param {unknown} translation
 * @returns {boolean}
 */
function hasTranslation(translation) {
  return typeof translation === 'string' && HEBREW.test(translation);
}

/**
 * Two hit areas a single touch can land in at once — the literal reading of
 * `36 § 3` condition 4, "a touch within range of two targets".
 *
 * Rects that only share an edge are ⛔ not overlapping: a touch resolves to one of
 * them, and treating a zero-area intersection as ambiguous would demand the chip
 * on every paragraph and make the condition meaningless.
 *
 * @param {Array<{ rect: { x: number, y: number, width: number, height: number } }>} targets
 * @returns {Array<[number, number]>}
 */
export function overlappingPairs(targets) {
  const pairs = [];
  for (let i = 0; i < targets.length; i += 1) {
    for (let j = i + 1; j < targets.length; j += 1) {
      const a = targets[i].rect;
      const b = targets[j].rect;
      const dx = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (dx > LAYOUT_EPSILON && dy > LAYOUT_EPSILON) pairs.push([i, j]);
    }
  }
  return pairs;
}

/**
 * Audit ONE story paragraph, as measured at one viewport width.
 *
 * @param {{
 *   route: string,
 *   width: number,
 *   lineHeight: number,
 *   declaresAmbiguityChip: boolean,
 *   targets: Array<{
 *     text: string,
 *     translation: unknown,
 *     rect: { x: number, y: number, width: number, height: number },
 *     padTop: number, padBottom: number, padLeft: number, padRight: number,
 *     marginLeft: number, marginRight: number,
 *   }>,
 * }} body
 * @returns {{ failures: Array<{ code: string, detail: string }>, overlaps: Array<[number, number]> }}
 */
export function auditStoryBody(body) {
  const { route, width, lineHeight, targets = [], declaresAmbiguityChip } = body;
  const failures = [];
  const at = `${route} @${width}px`;
  const fail = (code, detail) => failures.push({ code, detail: `${at} — ${detail}` });

  // ── Condition 2, the paragraph half ────────────────────────────────────────
  if (!(lineHeight >= MIN_LINE_HEIGHT - STYLE_EPSILON)) {
    fail('line-height', `story paragraph line-height is ${lineHeight}px, below ${MIN_LINE_HEIGHT}px`);
  }

  for (const t of targets) {
    const word = normalizeWord(t.text);
    const label = `"${t.text}"`;

    // ── Condition 1 ──────────────────────────────────────────────────────────
    if (FUNCTION_WORD_FLOOR.has(word)) {
      fail('function-word', `${label} is a function word and is never a tap target (36 § 3.1)`);
    }
    if (!hasTranslation(t.translation)) {
      fail('no-translation', `${label} is a tap target with no Hebrew translation behind it (36 § 3.1)`);
    }

    // ── Condition 2, the target half ─────────────────────────────────────────
    if (!(t.padTop >= MIN_TAP_PAD_Y - STYLE_EPSILON) || !(t.padBottom >= MIN_TAP_PAD_Y - STYLE_EPSILON)) {
      fail(
        'tap-pad-y',
        `${label} has ${t.padTop}px/${t.padBottom}px of vertical tap padding, below ${MIN_TAP_PAD_Y}px each side (36 § 3.2)`,
      );
    }
    if (!(t.rect.height >= MIN_LINE_HEIGHT - LAYOUT_EPSILON)) {
      fail('hit-height', `${label} gives ${Math.round(t.rect.height)}px of vertical hit area, below ${MIN_LINE_HEIGHT}px (36 § 3.2)`);
    }

    // ── Condition 3 ──────────────────────────────────────────────────────────
    if (!(t.rect.width >= MIN_HIT_WIDTH - LAYOUT_EPSILON)) {
      fail('hit-width', `${label} gives ${Math.round(t.rect.width)}px of horizontal hit area, below ${MIN_HIT_WIDTH}px (36 § 3.3)`);
    }
    if (Math.abs(t.padLeft - t.padRight) > STYLE_EPSILON) {
      fail('not-centred', `${label} pads ${t.padLeft}px/${t.padRight}px, so the hit area is not centred on the word (36 § 3.3)`);
    }
    // "The padding is in the hit area only — the appearance does not change."
    // Measured: the padding has to be handed back as negative margin, or the
    // word's inline advance grows and the whole paragraph respaces.
    if (Math.abs(t.padLeft + t.marginLeft) > STYLE_EPSILON || Math.abs(t.padRight + t.marginRight) > STYLE_EPSILON) {
      fail(
        'layout-shifted',
        `${label} pads ${t.padLeft}px/${t.padRight}px but gives back ${t.marginLeft}px/${t.marginRight}px, so the hit area changed the paragraph (36 § 3.3)`,
      );
    }
  }

  // ── Condition 4 ────────────────────────────────────────────────────────────
  const overlaps = overlappingPairs(targets);
  if (overlaps.length > 0 && !declaresAmbiguityChip) {
    const [i, j] = overlaps[0];
    fail(
      'no-ambiguity-chip',
      `${overlaps.length} pair(s) of hit areas overlap (e.g. "${targets[i].text}" / "${targets[j].text}") and the screen does not declare the ambiguity chip — 36 § 3.4 forbids guessing`,
    );
  }

  return { failures, overlaps };
}
