import { buildWallFeed, type WallPost } from '@/lib/core/wallFeed';

// ⚠️ A file of its own, ⛔ not `messages-fixture.ts`: `scripts/build-continuations.mjs` imports
// that one under plain node, where a VALUE import through `@/` does not resolve.
/**
 * T-473ⓓ — the class wall as `kol-C-10` draws it (render_video_C.py `wall_feed` :132-150):
 * three questions by the opener, the first with 24 replies of which the walk must show TWO.
 * Shaped by the same pure `buildWallFeed` the route uses. The sentences are the render's own.
 */
const W_NOW = '2026-09-24T09:00:00Z';
const W_OPENER = 'u-opener';
const W_ME = 'u-me';
const W_REPLIES_1 = [
  'I went to the beach with my family.', 'We played football in the park.', 'I went to the beach.',
];
export const FIXTURE_WALL_NOW = W_NOW;
export const FIXTURE_WALL: readonly WallPost[] = buildWallFeed(
  [
    { id: 'wp1', author_id: W_OPENER, body_en: 'How was your weekend?', created_at: '2026-09-24T05:15:00Z' },
    { id: 'wp2', author_id: W_OPENER, body_en: 'What can you see in this picture?', created_at: '2026-09-23T14:40:00Z' },
    { id: 'wp3', author_id: W_OPENER, body_en: 'Write one thing you like about school.', created_at: '2026-09-20T06:00:00Z' },
  ],
  [
    ...Array.from({ length: 24 }, (_, i) => ({
      id: `wr${i}`, post_id: 'wp1', author_id: i === 2 ? W_ME : `u${i}`,
      body_en: W_REPLIES_1[i % W_REPLIES_1.length] ?? '', created_at: `2026-09-24T06:${String(i).padStart(2, '0')}:00Z`,
    })),
    ...Array.from({ length: 11 }, (_, i) => ({ id: `wq${i}`, post_id: 'wp2', author_id: `v${i}`, body_en: 'I can see a green hill and the sea.', created_at: `2026-09-23T15:${String(i).padStart(2, '0')}:00Z` })),
    { id: 'wz0', post_id: 'wp3', author_id: 'x1', body_en: 'I like the art lessons.', created_at: '2026-09-20T07:00:00Z' },
  ],
  [
    ...Array.from({ length: 12 }, (_, i) => ({ user_id: `l${i}`, post_id: null, reply_id: 'wr0' })),
    { user_id: W_ME, post_id: null, reply_id: 'wr0' },
    ...Array.from({ length: 9 }, (_, i) => ({ user_id: `l${i}`, post_id: null, reply_id: 'wr1' })),
    ...Array.from({ length: 31 }, (_, i) => ({ user_id: `k${i}`, post_id: 'wp1', reply_id: null })),
    ...Array.from({ length: 18 }, (_, i) => ({ user_id: `k${i}`, post_id: 'wp2', reply_id: null })),
    ...Array.from({ length: 7 }, (_, i) => ({ user_id: `k${i}`, post_id: null, reply_id: 'wq0' })),
  ],
  W_ME,
  W_OPENER,
);
