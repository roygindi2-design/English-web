'use client';

import ArenaCharacterChoice from '@/components/ArenaCharacterChoice';
import '../../../arcade/arcade-tokens.css';

/**
 * Layout fixture for `check:mobile` — T-217. noindex (`app/dev/arcade/layout.tsx`),
 * unlinked, ⛔ **not a learning screen**. The real screen is the arena shell's third
 * state, reached only after `GET /api/arcade/home` returns `character: null` — and
 * `next start` here runs with ⛔ no Supabase env, so the product route never shows it.
 *
 * ⛔ **This page renders the component and NOTHING else** (C-0104). `save` is a no-op:
 * ⛔ no network from a fixture. `initial={null}` is **first entry**, the harder case —
 * ⛔ no exit, and `בחר` disabled with its written reason — exactly what the walk measures.
 */
export default function DevArenaCharacterPage() {
  return <ArenaCharacterChoice initial={null} onSaved={() => {}} save={async () => {}} />;
}
