'use client';

import BlockKeyboard from '@/components/BlockKeyboard';

/**
 * T-461 — the LIVE block keyboard at A1, for the walk and for `check:mobile`.
 * It asks `GET /api/world/messages/continuations`, which needs ⛔ no session and ⛔ no
 * Supabase (the tree is a generated file) ⇒ this measures the real sets, ⛔ not a failure
 * state, and ⛔ needs no EXPECTED_CONSOLE entry.
 */
export default function DevBlockKeyboardPage() {
  return (
    <section dir="rtl" className="flex flex-1 flex-col text-ink">
      <h1 className="text-2xl font-bold">מקלדת הבלוקים</h1>
      <div className="mt-auto pt-6">
        <BlockKeyboard level="A1" />
      </div>
    </section>
  );
}
