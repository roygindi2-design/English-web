import { classSeats } from '@/lib/core/classSeats';
import { buildStoryChain, type StoryLine } from '@/lib/core/storyChain';

/**
 * T-479ⓔ — the class story as `render_video_C.py` `scene_story` draws it (`:180-184`):
 * three members, one line each, and the learner's turn next. The sentences are the
 * render's own. Shaped by the same pure `buildStoryChain` the route uses.
 */
const S_OPENER = 'u-opener';
const S_ROWS = [
  { id: 's1', author_id: S_OPENER, body_en: 'One morning a small cat woke up.', created_at: '2026-09-24T06:00:00Z' },
  { id: 's2', author_id: 'u-daniel', body_en: 'It was very hungry and cold.', created_at: '2026-09-24T06:20:00Z' },
  { id: 's3', author_id: 'u-noa', body_en: 'The cat walked to a big house.', created_at: '2026-09-24T07:05:00Z' },
];
export const FIXTURE_STORY: readonly StoryLine[] = buildStoryChain(S_ROWS, 'u-me', S_OPENER, classSeats(S_ROWS)).lines;
