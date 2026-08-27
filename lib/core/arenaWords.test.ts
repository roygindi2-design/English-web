import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { mixArenaWords, type ArenaWord } from './arenaWords';

const w = (id: string, kind: ArenaWord['kind']): ArenaWord =>
  ({ wordId: id, headword: 'w' + id, translationHe: 'ת' + id, kind });

describe('arenaWords', () => {
  it('מחסן ריק ⇒ 100% מילות בסיס, ⛔ ולא מסך ריק', () => {
    const out = mixArenaWords({ known: [], unfiltered: [], base: [w('1','base'), w('2','base')], size: 2 });
    expect(out).toHaveLength(2);
    expect(out.every((x) => x.kind === 'base')).toBe(true);
  });

  it('מחסן מלא ⇒ לכל היותר 75% ידועות, ולא-מסוננות בתמהיל תמיד', () => {
    const known = Array.from({ length: 40 }, (_, i) => w('k' + i, 'known'));
    const unfiltered = Array.from({ length: 40 }, (_, i) => w('u' + i, 'unfiltered'));
    const out = mixArenaWords({ known, unfiltered, base: [], size: 16 });
    const nKnown = out.filter((x) => x.kind === 'known').length;
    expect(nKnown).toBeLessThanOrEqual(12);          // 75% מ-16
    expect(out.length - nKnown).toBeGreaterThan(0);  // `37 § 2`: «בתמהיל **תמיד**»
  });

  it('⛔ הקובץ ⛔ אינו נוגע במנוע הלמידה (אינווריאנט 13.1 · 13.3)', () => {
    const src = readFileSync('lib/core/arenaWords.ts', 'utf8');
    for (const bad of ['word_progress', 'easiness', 'interval_days', 'next_review_at']) {
      expect(src, `${bad} אסור — אינווריאנט 13.1`).not.toContain(bad);
    }
  });
});
