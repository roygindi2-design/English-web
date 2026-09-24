import type { RawStateRow, Simulation } from '@/lib/core/messages';

/**
 * ⛔ Not learning content. The three rows are `MAILS` in `docs/design/render_video_C.py:238`;
 * Tom’s body and required words are `screen_mail` in `docs/design/render_msgs_screens.py:93,100`.
 * Sarah and Mr. Levi carry only a preview in the render ⇒ their body IS that string, and
 * their required words are quoted from their own render text (see the plan, Global
 * Constraints). The production bank is T-193’s. `messages-fixture.test.ts` pins this file
 * to the render (F-133).
 *
 * `FIXTURE_NOW` is Monday 2026-09-07 09:30 Asia/Jerusalem ⇒ Tom = today `09:20`,
 * Sarah = `אתמול`, Mr. Levi (Tue 2026-09-01, six days back) = `יום ג׳` — the render’s
 * three labels. ⚠️ ⛔ Not the plan’s 2026-09-08: that date is a **Tuesday** (measured,
 * `date -u -d 2026-09-08 +%A`), and from a Tuesday ⛔ no day inside the 2–6 day weekday
 * window is a Tuesday ⇒ `יום ג׳` could never be produced.
 */
export const FIXTURE_NOW = '2026-09-07T09:30:00+03:00';

export const FIXTURE_SIMULATIONS: readonly Simulation[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    senderEn: 'Tom',
    context: 'tourist',
    subjectEn: 'Trip to Israel',
    bodyEn: 'Hi! I am coming to Israel this summer with my family. Where should we go? Any tips?',
    requiredWords: ['summer', 'visit', 'recommend'],
    level: 'A1',
    createdAt: '2026-09-07T09:20:00+03:00',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    senderEn: 'Sarah',
    context: 'restaurant',
    subjectEn: 'Table for four',
    bodyEn: 'We would like to book a table...',
    requiredWords: ['book', 'table', 'four'],
    level: 'A1',
    createdAt: '2026-09-06T18:05:00+03:00',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    senderEn: 'Mr. Levi',
    context: 'teacher',
    subjectEn: 'Your homework',
    bodyEn: 'Please send me the essay...',
    requiredWords: ['send', 'essay', 'homework'],
    level: 'A1',
    createdAt: '2026-09-01T08:00:00+03:00',
  },
];

/**
 * Mr. Levi’s row is read (the render draws it without the dot); the other two are pending.
 * T-462ⓑ — and ANSWERED, so the walk sees «נענה» as its own indicator next to a row with
 * ⛔ no dot. The render (kol-C-13) predates the keyboard and draws ⛔ no answered state.
 */
export const FIXTURE_STATES: readonly RawStateRow[] = [
  {
    simulation_id: '33333333-3333-4333-8333-333333333333',
    read_at: '2026-09-01T12:00:00+03:00',
    answered_at: '2026-09-01T12:05:00+03:00',
  },
];
