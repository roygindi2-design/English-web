import { describe, expect, it } from 'vitest';
import {
  CONTEXT_HE, MESSAGE_CONTEXTS, REQUIRED_WORDS_PER_MESSAGE,
  inboxCounts, inboxCountsHe, initialOf, mergeInbox, previewEn, toInboxRows, toSimulation,
  toSimulations, unread, whenHeaderHe, whenListHe, whenOf,
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

describe('mergeInbox · unread · inboxCounts', () => {
  const a = sim('a', '2026-09-08T06:20:00.000Z');
  const b = sim('b', '2026-09-07T15:40:00.000Z');
  const c = sim('c', '2026-09-02T09:00:00.000Z');

  it('a simulation without a state row is unread; newest first', () => {
    const items = mergeInbox([c, a, b], []);
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(items.every((i) => i.readAt === null && i.answeredAt === null)).toBe(true);
    expect(items.every(unread)).toBe(true);
  });
  it('a state row attaches by simulation_id, and a foreign state row is ignored', () => {
    const items = mergeInbox([a, b], [
      { simulation_id: 'b', read_at: '2026-09-07T16:00:00.000Z', answered_at: null },
      { simulation_id: 'zzz', read_at: '2026-09-07T16:00:00.000Z', answered_at: null },
    ]);
    expect(items[1]!.readAt).toBe('2026-09-07T16:00:00.000Z');
    expect(unread(items[1]!)).toBe(false);
    expect(unread(items[0]!)).toBe(true);
  });
  it('counts total and unread from the items, ⛔ not from a constant', () => {
    const items = mergeInbox([a, b, c], [{ simulation_id: 'c', read_at: '2026-09-02T10:00:00.000Z', answered_at: null }]);
    expect(inboxCounts(items)).toEqual({ total: 3, unread: 2 });
  });
  it('the counter string is the render’s, and 1 is הודעה אחת', () => {
    expect(inboxCountsHe({ total: 3, unread: 2 })).toBe('3 הודעות · 2 שלא נקראו');
    expect(inboxCountsHe({ total: 1, unread: 0 })).toBe('הודעה אחת · 0 שלא נקראו');
  });
  /**
   * F-212's failure scenario, verbatim from the T-289 row: a learner OPENS a message,
   * reads it, and ⛔ answers nothing — `answered_at` is unwritable at all (R-026), so
   * the only thing that moved is `read_at`. The counter must therefore describe
   * READING. Saying «שלא נענו» here is a claim about an act the product cannot record.
   */
  it('F-212 · opened-but-not-answered is counted and WORDED as read, ⛔ never as answered', () => {
    const items = mergeInbox([a, b], [{ simulation_id: 'a', read_at: '2026-09-08T07:00:00.000Z', answered_at: null }]);
    expect(items.every((i) => i.answeredAt === null)).toBe(true);
    const counts = inboxCounts(items);
    expect(counts).toEqual({ total: 2, unread: 1 });
    expect(inboxCountsHe(counts)).toBe('2 הודעות · 1 שלא נקראו');
    expect(inboxCountsHe(counts)).not.toContain('נענו');
  });
});

const TZ = 'Asia/Jerusalem';
// ⚠️ 2026-09-08 is a TUESDAY (`date -u -d 2026-09-08 +%A`), ⛔ not the Monday the plan
// assumed — and from a Tuesday ⛔ no day in the 2–6 window is itself a Tuesday, so the
// render's `יום ג׳` was unreachable. The real Monday one day earlier makes it reachable.
const NOW = '2026-09-07T09:30:00+03:00'; // Monday

describe('whenOf — the render’s three labels, from created_at and now', () => {
  it('same calendar day in the learner’s zone ⇒ today + HH:MM', () => {
    const w = whenOf('2026-09-07T09:20:00+03:00', NOW, TZ);
    expect(w).toEqual({ kind: 'today', timeHe: '09:20' });
    expect(whenListHe(w)).toBe('09:20');
    expect(whenHeaderHe(w)).toBe('היום 09:20');
  });
  it('the previous calendar day ⇒ אתמול, even across midnight in UTC', () => {
    // 02:00 in Asia/Jerusalem is 23:00Z the day BEFORE ⇒ the UTC date is 09-05 while
    // the learner's date is 09-06. A UTC-only diff would say «2 days», ⛔ not «אתמול».
    const w = whenOf('2026-09-06T02:00:00+03:00', NOW, TZ);
    expect(whenListHe(w)).toBe('אתמול');
    expect(whenHeaderHe(w)).toBe('אתמול');
  });
  it('2–6 days ago ⇒ the weekday, יום ג׳ for a Tuesday', () => {
    const w = whenOf('2026-09-01T08:00:00+03:00', NOW, TZ);
    expect(whenListHe(w)).toBe('יום ג׳');
  });
  it('7+ days ago ⇒ d.m', () => {
    expect(whenListHe(whenOf('2026-08-12T08:00:00+03:00', NOW, TZ))).toBe('12.8');
  });
});

describe('previewEn · initialOf', () => {
  it('cuts to a word boundary under the max and appends …', () => {
    expect(previewEn('Hi! I am coming to Israel this summer with my family. Where should we go?', 40)).toBe('Hi! I am coming to Israel this summer…');
    expect(previewEn('Short.', 40)).toBe('Short.');
  });
  it('the disc letter is the surname initial for a titled name, else the first letter', () => {
    expect(initialOf('Tom')).toBe('T');
    expect(initialOf('Mr. Levi')).toBe('L');
    expect(initialOf('Sarah')).toBe('S');
  });
});

describe('toInboxRows — everything the component draws, precomputed', () => {
  it('formats the fixture-shaped items with href, contextHe, whenHe, unread', () => {
    const items = mergeInbox([sim('a', '2026-09-07T09:20:00+03:00')], []);
    const rows = toInboxRows(items, NOW, TZ);
    expect(rows[0]).toMatchObject({ id: 'a', href: '/world/messages/a', initial: 'T', contextHe: 'תייר', whenHe: '09:20', unread: true });
    expect(rows[0]!.previewEn.endsWith('…')).toBe(true);
  });
});
