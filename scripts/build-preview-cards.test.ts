import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GENERATED_PREVIEW_CARDS, PREVIEW_CARDS_SOURCE_ID } from '../lib/core/previewCards.generated';
import { isAttributedCard } from '../lib/core/landing';

describe('build-preview-cards', () => {
  it('emits six cards', () => {
    expect(GENERATED_PREVIEW_CARDS).toHaveLength(6);
  });

  it('emits only attributed cards', () => {
    for (const card of GENERATED_PREVIEW_CARDS) expect(isAttributedCard(card)).toBe(true);
  });

  it('emits only Hebrew options — a Latin option means an English distractor leaked through', () => {
    for (const card of GENERATED_PREVIEW_CARDS) {
      for (const option of card.options) expect(option).not.toMatch(/[A-Za-z]/);
    }
  });

  it('emits Latin headwords', () => {
    for (const card of GENERATED_PREVIEW_CARDS) expect(card.headword).toMatch(/^[a-z][a-z' -]*$/);
  });

  it('names its provenance', () => {
    expect(PREVIEW_CARDS_SOURCE_ID).toBe('generated:ngsl-headwords');
    for (const card of GENERATED_PREVIEW_CARDS) expect(card.sourceId).toBe(PREVIEW_CARDS_SOURCE_ID);
  });

  it('the committed file is what the script produces today', () => {
    const before = readFileSync('lib/core/previewCards.generated.ts', 'utf8');
    execFileSync('node', ['scripts/build-preview-cards.mjs'], { encoding: 'utf8' });
    expect(readFileSync('lib/core/previewCards.generated.ts', 'utf8')).toBe(before);
  });
});
