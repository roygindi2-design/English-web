import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildStorySegments } from './storyTapTargets';
import { STORY_PARAGRAPH_COUNT, storyParagraphs, storySentences } from './storyParagraphs';

const NO_GLOSS = new Map();
const NONE = new Set<string>();
const seg = (text: string) => buildStorySegments(text, NO_GLOSS, NONE);
const join = (group: readonly { text: string }[]) => group.map((s) => s.text).join('');

describe('T-508 — storySentences', () => {
  it('cuts after . ! ? and keeps the trailing space with the sentence', () => {
    const out = storySentences(seg('One two. Three four! Five six? Seven.'));
    expect(out.map(join)).toEqual(['One two. ', 'Three four! ', 'Five six? ', 'Seven.']);
  });

  it('⛔ does not cut after an abbreviation', () => {
    const out = storySentences(seg('Mr. Cohen reads. Dr. Levi writes.'));
    expect(out.map(join)).toEqual(['Mr. Cohen reads. ', 'Dr. Levi writes.']);
  });

  it('⛔ does not cut before a lower-case word', () => {
    expect(storySentences(seg('It was 3.5 km. then more'))).toHaveLength(1);
  });

  it('cuts before a quoted capital, and after a closing quote', () => {
    const out = storySentences(seg('He said "Go now." "Why?" she asked.'));
    expect(out.map(join)).toEqual(['He said "Go now." ', '"Why?" she asked.']);
  });

  it('text with no terminator is one sentence', () => {
    expect(storySentences(seg('no end here')).map(join)).toEqual(['no end here']);
  });

  it('empty input ⇒ no sentences', () => {
    expect(storySentences([])).toEqual([]);
  });
});

describe('T-508 — storyParagraphs', () => {
  it('four sentences ⇒ three paragraphs, 2 · 1 · 1', () => {
    const out = storyParagraphs(seg('A b. C d. E f. G h.'));
    expect(out).toHaveLength(STORY_PARAGRAPH_COUNT);
    expect(out.map(join)).toEqual(['A b. C d. ', 'E f. ', 'G h.']);
  });

  it('fewer than three sentences ⇒ one paragraph per sentence', () => {
    expect(storyParagraphs(seg('A b. C d.'))).toHaveLength(2);
    expect(storyParagraphs(seg('A b.'))).toHaveLength(1);
  });

  /**
   * ⛔ THE FAILURE SCENARIO of the row: a cut inside a sentence drops or splits a target
   * word. Run against every real story: nothing is lost, nothing duplicated, the order
   * is unchanged, and the sentence counts are balanced to ±1.
   */
  it('every real story ⇒ 3 paragraphs, ⛔ no segment lost, balanced ±1', () => {
    const lines = readFileSync('data/generated/stories-2026-08-21.jsonl', 'utf8')
      .split('\n')
      .filter((l) => l.trim() !== '');
    expect(lines.length).toBeGreaterThanOrEqual(12);
    for (const line of lines) {
      const body = (JSON.parse(line) as { body_en: string }).body_en;
      const segments = seg(body);
      const paragraphs = storyParagraphs(segments);
      expect(paragraphs).toHaveLength(3);
      expect(paragraphs.flat()).toEqual([...segments]);
      expect(paragraphs.map(join).join('')).toBe(body);
      const counts = paragraphs.map((p) => storySentences(p).length);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      for (const p of paragraphs) expect(join(p).trim()).toMatch(/[.!?]["']?$/);
    }
  });
});
