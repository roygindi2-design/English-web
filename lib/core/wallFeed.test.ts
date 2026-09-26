import { describe, expect, it } from 'vitest';
import { classSeats } from '@/lib/core/classSeats';
import { buildWallFeed, topReplies, wallTimeLabel, type WallLikeRow, type WallReplyRow } from '@/lib/core/wallFeed';

const TZ = 'Asia/Jerusalem';
// 2026-09-24 is a Thursday. 09:00Z = 12:00 in Jerusalem (IDT, UTC+3).
const NOW = '2026-09-24T09:00:00Z';

describe('wallTimeLabel — 39 § 5, in Asia/Jerusalem (T-471)', () => {
  it('the three forms of the spec', () => {
    expect(wallTimeLabel('2026-09-24T05:15:00Z', NOW, TZ)).toBe('היום 08:15');
    expect(wallTimeLabel('2026-09-23T14:40:00Z', NOW, TZ)).toBe('אתמול 17:40');
    expect(wallTimeLabel('2026-09-20T06:00:00Z', NOW, TZ)).toBe('יום ראשון 09:00');
  });
  it('failure scenario: 23:50 last night is אתמול, ⛔ not היום — even though it is the same UTC day', () => {
    // 2026-09-23 23:50 in Jerusalem = 20:50Z on the 23rd; "now" 00:30 Jerusalem = 21:30Z on the 23rd.
    expect(wallTimeLabel('2026-09-23T20:50:00Z', '2026-09-23T21:30:00Z', TZ)).toBe('אתמול 23:50');
  });
  it('a week or more ⇒ a date, ⛔ never a weekday that points at the wrong week', () => {
    expect(wallTimeLabel('2026-09-12T06:00:00Z', NOW, TZ)).toBe('12.9 09:00');
  });
});

describe('topReplies — most liked first, a tie ⇒ the earlier one', () => {
  const r = (id: string, likes: number, createdAt: string) => ({ id, likes, createdAt });
  it('orders and caps', () => {
    const got = topReplies([r('a', 3, '2026-09-24T01:00:00Z'), r('b', 12, '2026-09-24T02:00:00Z'), r('c', 3, '2026-09-24T00:30:00Z')], 2);
    expect(got.map((x) => x.id)).toEqual(['b', 'c']);
  });
});

describe('buildWallFeed', () => {
  const me = 'u-me';
  const opener = 'u-teacher';
  const posts = [
    { id: 'p1', author_id: opener, body_en: 'How was your weekend?', created_at: '2026-09-24T05:15:00Z' },
    { id: 'p0', author_id: opener, body_en: 'Write one thing you like about school.', created_at: '2026-09-20T06:00:00Z' },
  ];
  const replies: WallReplyRow[] = Array.from({ length: 24 }, (_, i) => ({
    id: `r${i}`, post_id: 'p1', author_id: i === 5 ? me : `u${i}`, body_en: `reply ${i}`, created_at: `2026-09-24T06:${String(i).padStart(2, '0')}:00Z`,
  }));
  const likes: WallLikeRow[] = [
    ...Array.from({ length: 12 }, (_, i) => ({ user_id: `l${i}`, post_id: null, reply_id: 'r7' })),
    ...Array.from({ length: 9 }, (_, i) => ({ user_id: `l${i}`, post_id: null, reply_id: 'r3' })),
    { user_id: me, post_id: 'p1', reply_id: null },
    { user_id: 'x', post_id: 'p1', reply_id: null },
  ];

  it('failure scenario: a post with 24 replies carries 2, ⛔ not 24 — and says 24', () => {
    const [p1] = buildWallFeed(posts, replies, likes, me, opener, classSeats([...posts, ...replies]));
    expect(p1?.replyCount).toBe(24);
    expect(p1?.top.map((r) => [r.id, r.likes])).toEqual([['r7', 12], ['r3', 9]]);
  });
  it('newest first; counts, likedByMe, byOpener, mine', () => {
    const feed = buildWallFeed(posts, replies, likes, me, opener, classSeats([...posts, ...replies]));
    expect(feed.map((p) => p.id)).toEqual(['p1', 'p0']);
    expect(feed[0]).toMatchObject({ likes: 2, likedByMe: true, byOpener: true, mine: false });
    expect(feed[1]).toMatchObject({ likes: 0, likedByMe: false, replyCount: 0, top: [] });
  });
  it('⛔ no author id leaves the feed', () => {
    const json = JSON.stringify(buildWallFeed(posts, replies, likes, me, opener, classSeats([...posts, ...replies])));
    expect(json).not.toMatch(/author_id|u-teacher|u-me/);
  });
});

describe('wallSentence (T-472)', () => {
  it('capitalises, fixes a lone i, and closes with ? or .', async () => {
    const { wallSentence } = await import('@/lib/core/wallFeed');
    expect(wallSentence(['i', 'went', 'to', 'the', 'beach'], 'reply')).toBe('I went to the beach.');
    expect(wallSentence(['how', 'was', 'your', 'weekend'], 'question')).toBe('How was your weekend?');
  });
});
