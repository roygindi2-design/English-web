import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ARENA_CHARACTERS,
  CHARACTER_BIAS_HE,
  CHARACTER_INTRO_HE,
  CHARACTER_LABELS_HE,
  characterFromParts,
  isArenaCharacter,
  withCharacter,
} from './arenaCharacter';

/**
 * ⚠️ Markdown emphasis is ⛔ not content: `37 § 7` writes `**ניתן לשינוי בכל רגע** ממסך
 * הבית…`, so the verbatim sentence exists in the spec only once the `**` markers are
 * stripped. Stripping them is the whole normalisation — ⛔ no other rewrite.
 */
const SPEC = readFileSync(new URL('../../plan/37-arena-spec.md', import.meta.url), 'utf8')
  .replace(/\*\*/g, '');

describe('arenaCharacter — `37 § 7`', () => {
  it('three characters, a closed set, in the order of the § 7 table', () => {
    expect([...ARENA_CHARACTERS]).toEqual(['wizard', 'warrior', 'armorer']);
    expect(Object.isFrozen(ARENA_CHARACTERS)).toBe(true);
  });

  it('every label and every bias line is a substring of `37 § 7` — ⛔ nothing invented', () => {
    for (const c of ARENA_CHARACTERS) {
      expect(SPEC).toContain(CHARACTER_LABELS_HE[c]);
      for (const line of CHARACTER_BIAS_HE[c]) expect(SPEC).toContain(line);
    }
    expect(SPEC).toContain(CHARACTER_INTRO_HE);
  });

  it('⛔ no digits in any learner-facing string — «בלי טבלאות מספרים»', () => {
    const all = [
      CHARACTER_INTRO_HE,
      ...Object.values(CHARACTER_LABELS_HE),
      ...Object.values(CHARACTER_BIAS_HE).flat(),
    ];
    for (const s of all) expect(s).not.toMatch(/\d/);
  });

  it('isArenaCharacter accepts the three and nothing else', () => {
    expect(isArenaCharacter('wizard')).toBe(true);
    expect(isArenaCharacter('Wizard')).toBe(false);
    expect(isArenaCharacter('')).toBe(false);
    expect(isArenaCharacter(null)).toBe(false);
    expect(isArenaCharacter(['wizard'])).toBe(false);
  });

  it('characterFromParts ⛔ never throws and returns null on anything but a valid key', () => {
    expect(characterFromParts({ character: 'armorer' })).toBe('armorer');
    for (const bad of [null, undefined, 'wizard', 7, [], { character: 'x' }, { name: 'a' }]) {
      expect(characterFromParts(bad)).toBeNull();
    }
  });

  it('withCharacter keeps every existing key and sets exactly one', () => {
    expect(withCharacter({ name: 'kept', character: 'wizard' }, 'warrior')).toEqual({
      name: 'kept',
      character: 'warrior',
    });
    expect(withCharacter(null, 'wizard')).toEqual({ character: 'wizard' });
    expect(withCharacter('garbage', 'wizard')).toEqual({ character: 'wizard' });
  });
});
