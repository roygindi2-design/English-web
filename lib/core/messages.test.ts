import { describe, expect, it } from 'vitest';
import {
  CONTEXT_HE, MESSAGE_CONTEXTS, REQUIRED_WORDS_PER_MESSAGE,
  inboxCounts, inboxCountsHe, mergeInbox, toSimulation, toSimulations, unanswered,
  type RawSimulationRow, type Simulation,
} from './messages';

const ROW: RawSimulationRow = {
  id: '11111111-1111-4111-8111-111111111111',
  sender_en: 'Tom',
  context: 'tourist',
  subject_en: 'Trip to Israel',
  body_en: 'Hi! I am coming to Israel this summer with my family. Where should we go? Any tips?',
  required_words: ['summer', 'visit', 'recommend'],
  cefr_level: 'A1',
  created_at: '2026-09-08T06:20:00.000Z',
};

describe('toSimulation — a damaged row is null, ⛔ never a partial simulation', () => {
  it('maps a whole row', () => {
    const s = toSimulation(ROW);
    expect(s).not.toBeNull();
    expect(s!.senderEn).toBe('Tom');
    expect(s!.context).toBe('tourist');
    expect(s!.requiredWords).toEqual(['summer', 'visit', 'recommend']);
    expect(s!.level).toBe('A1');
    expect(s!.createdAt).toBe('2026-09-08T06:20:00.000Z');
  });
  it('rejects an unknown context, a fifth level, and two or four required words', () => {
    expect(toSimulation({ ...ROW, context: 'bank' })).toBeNull();
    expect(toSimulation({ ...ROW, cefr_level: 'C1' })).toBeNull();
    expect(toSimulation({ ...ROW, required_words: ['a', 'b'] })).toBeNull();
    expect(toSimulation({ ...ROW, required_words: ['a', 'b', 'c', 'd'] })).toBeNull();
    expect(toSimulation({ ...ROW, body_en: '' })).toBeNull();
  });
  it('toSimulations drops the damaged rows and keeps the order', () => {
    const out = toSimulations([ROW, { ...ROW, id: 'x', context: 'bank' }, { ...ROW, id: 'y' }]);
    expect(out.map((s) => s.id)).toEqual([ROW.id, 'y']);
  });
  it('the closed sets are the row’s sets, in Hebrew', () => {
    expect(MESSAGE_CONTEXTS).toEqual(['tourist', 'restaurant', 'teacher', 'hotel']);
    expect(CONTEXT_HE).toEqual({ tourist: 'תייר', restaurant: 'מסעדה', teacher: 'מורה', hotel: 'מלון' });
    expect(REQUIRED_WORDS_PER_MESSAGE).toBe(3);
  });
});

function sim(id: string, createdAt: string): Simulation {
  return { ...toSimulation({ ...ROW, id, created_at: createdAt })! };
}

describe('mergeInbox · unanswered · inboxCounts', () => {
  const a = sim('a', '2026-09-08T06:20:00.000Z');
  const b = sim('b', '2026-09-07T15:40:00.000Z');
  const c = sim('c', '2026-09-02T09:00:00.000Z');

  it('a simulation without a state row is unread and unanswered; newest first', () => {
    const items = mergeInbox([c, a, b], []);
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(items.every((i) => i.readAt === null && i.answeredAt === null)).toBe(true);
    expect(items.every(unanswered)).toBe(true);
  });
  it('a state row attaches by simulation_id, and a foreign state row is ignored', () => {
    const items = mergeInbox([a, b], [
      { simulation_id: 'b', read_at: '2026-09-07T16:00:00.000Z', answered_at: null },
      { simulation_id: 'zzz', read_at: '2026-09-07T16:00:00.000Z', answered_at: null },
    ]);
    expect(items[1]!.readAt).toBe('2026-09-07T16:00:00.000Z');
    expect(unanswered(items[1]!)).toBe(false);
    expect(unanswered(items[0]!)).toBe(true);
  });
  it('counts total and unanswered from the items, ⛔ not from a constant', () => {
    const items = mergeInbox([a, b, c], [{ simulation_id: 'c', read_at: '2026-09-02T10:00:00.000Z', answered_at: null }]);
    expect(inboxCounts(items)).toEqual({ total: 3, unanswered: 2 });
  });
  it('the counter string is the render’s, and 1 is הודעה אחת', () => {
    expect(inboxCountsHe({ total: 3, unanswered: 2 })).toBe('3 הודעות · 2 שלא נענו');
    expect(inboxCountsHe({ total: 1, unanswered: 0 })).toBe('הודעה אחת · 0 שלא נענו');
  });
});
