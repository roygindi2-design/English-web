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

/**
 * C-0081: the plan slices ±600 chars around the marker. Measured: with the
 * institution <label> placed where the plan puts it, that window reaches into
 * the <LatinField> below it, so `expect(field).not.toContain('LatinField')`
 * fails on the CORRECT implementation — the guard would be unsatisfiable by any
 * placement the plan itself mandates. The window is therefore the field's own
 * <label> element, found by walking back to the opening tag and forward to its
 * close, which is what the assertion was always about.
 */
function fieldElement(code: string, marker: string): string {
  const at = code.indexOf(marker);
  expect(at, `${marker} is not in the source`).toBeGreaterThan(-1);
  const open = code.lastIndexOf('<label', at);
  const close = code.indexOf('</label>', at);
  expect(open, 'the field is not inside a <label>').toBeGreaterThan(-1);
  expect(close, 'the field <label> is never closed').toBeGreaterThan(at);
  return code.slice(open, close + '</label>'.length);
}

describe('the institution field (T-003 · § 4.2ד)', () => {
  it('is a Hebrew field and ⛔ never goes through <LatinField> (TD-5)', () => {
    const field = fieldElement(CODE, 'name="institution"');
    expect(field).not.toContain('LatinField');
    expect(field).not.toContain('dir="ltr"');
  });

  /**
   * C-0081: the plan's own Step 4 markup writes `maxLength={INSTITUTION_MAX_LENGTH}`
   * while this assertion, as the plan wrote it, demanded the literal
   * `maxLength={120}` — the two cannot both hold. Measured: the plan's markup
   * scores 1 failed | 6 passed against the plan's regex. Resolved toward the
   * markup, because the literal is the weaker guard: 120 in the component is a
   * second copy of the server's cap that can silently drift from
   * INSTITUTION_MAX_LENGTH, and the constant reference cannot. The number's own
   * agreement with the migration is already guarded in lib/core/onboarding.test.ts.
   */
  it('caps the input at the same length the server truncates at', () => {
    expect(INSTITUTION_MAX_LENGTH).toBe(120);
    expect(CODE).toContain('maxLength={INSTITUTION_MAX_LENGTH}');
    expect(CODE).toMatch(
      /import \{[\s\S]*?\bINSTITUTION_MAX_LENGTH\b[\s\S]*?\} from '@\/lib\/core\/onboarding'/,
    );
  });

  it('is a 44px target like every other control on the screen', () => {
    expect(fieldElement(CODE, 'name="institution"')).toContain('min-h-touch');
  });

  /**
   * Measured conflict 1. The score field carries enterKeyHint="go", a typed
   * claim (F-015 · TD-5) that it is the LAST field. Institution therefore sits
   * ABOVE it — if this assertion ever flips, the score's hint must flip in the
   * same commit or the keyboard lies about what the next key does.
   */
  it('sits above the target-score field, which owns enterKeyHint="go"', () => {
    const institutionAt = CODE.indexOf('name="institution"');
    const scoreAt = CODE.indexOf('name="target_score"');
    expect(institutionAt).toBeGreaterThan(-1);
    expect(scoreAt).toBeGreaterThan(-1);
    expect(institutionAt).toBeLessThan(scoreAt);
    expect(CODE).toContain('enterKeyHint="go"');
  });

  /**
   * C-0081: the plan's regex — `apiPost<...>('/api/profile',\s*\{[\s\S]*?institution[\s\S]*?\}`
   * — is hollow, and it was MEASURED hollow, not suspected. Deleting
   * `institution,` from the request body leaves it at 7 passed, because
   * `[\s\S]*?` walks out of the object literal and finds the word
   * `institution` in the markup 60 lines below. The body is matched here
   * with `[^}]*`, which ⛔ cannot leave the braces it opened; the same
   * deletion now fails in this test's name.
   */
  it('sends the value under the key the route reads', () => {
    const body = CODE.match(/apiPost<SaveResponse>\('\/api\/profile',\s*\{([^}]*)\}/);
    expect(body, 'the /api/profile call is not in the source').not.toBeNull();
    expect(body?.[1]).toMatch(/^\s*(?:[A-Za-z]+,\s*)*institution,\s*$/);
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
