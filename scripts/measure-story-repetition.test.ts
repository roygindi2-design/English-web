import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs script, ⛔ no types, exactly like the other script tests.
import { parseStorySeed } from './measure-story-repetition.mjs';

const SQL = `
begin;
insert into public.stories (cefr_level, title_en, body_en, origin) values
    ('A1', 'The market', 'A market in the town.', 'generated'),
    ('A1', 'The don''t case', 'She does not know the way.', 'generated');
commit;
`;

describe('parseStorySeed — the generated seed, ⛔ not general SQL', () => {
  it('reads every value row', () => {
    expect(parseStorySeed(SQL)).toHaveLength(2);
  });

  it('keeps the level and the body, and unescapes a doubled quote', () => {
    const rows = parseStorySeed(SQL);
    expect(rows[0].cefrLevel).toBe('A1');
    expect(rows[0].bodyEn).toBe('A market in the town.');
    expect(rows[1].titleEn).toBe("The don't case");
  });

  it('gives each row a distinct id and a rising createdAt, so the order is deterministic', () => {
    const rows = parseStorySeed(SQL);
    expect(new Set(rows.map((r: { id: string }) => r.id)).size).toBe(2);
    expect(rows[0].createdAt < rows[1].createdAt).toBe(true);
  });

  it('returns nothing for a file with no value rows, ⛔ rather than throwing', () => {
    expect(parseStorySeed('begin; commit;')).toEqual([]);
  });
});
