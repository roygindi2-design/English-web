'use client';

import { ClassWallView } from '@/components/ClassWall';
import { WallReplySheet } from '@/components/WallReplySheet';
import { FIXTURE_WALL, FIXTURE_WALL_NOW } from '../../wall-fixture';

/**
 * T-474 — `kol-C-12`: the reply sheet open over the wall, the post still visible above it.
 * The keyboard is the LIVE one: `GET /api/world/messages/continuations` needs ⛔ no session
 * and ⛔ no Supabase (the `/dev/messages/keyboard` reasoning) ⇒ ⛔ no EXPECTED_CONSOLE entry.
 * Sending goes nowhere here — the sheet is measured, ⛔ not the write.
 */
export default function DevWallReplyPage() {
  const first = FIXTURE_WALL[0];
  return (
    <section dir="rtl" className="mx-auto w-full max-w-md text-ink">
      <h1 className="text-2xl font-bold">הקיר של הכיתה</h1>
      <ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL.slice(0, 1) }} nowIso={FIXTURE_WALL_NOW} onLike={() => {}} onReply={() => {}} />
      <WallReplySheet open kind="reply" questionEn={first?.bodyEn} onSend={() => {}} onClose={() => {}} />
    </section>
  );
}
