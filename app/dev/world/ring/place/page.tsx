'use client';

import { useState } from 'react';
import { WorldRingView } from '@/components/WorldRing';
import { ringStep, type RingState } from '@/lib/core/ringMode';
import { ringScreen, type RingInputs, type RingNodeId } from '@/lib/core/worldRing';

/**
 * Layout fixture for `check:mobile` — T-505 (`kol-E-03` → `kol-E-04`, Figma `3341:70` ·
 * `3341:111`). noindex (inherited from `app/dev/world/layout.tsx`), unlinked, ⛔ NOT a
 * learning screen (בדיקת פריסה). Seven apps on the ring and `אמירנט` just installed, as the
 * frame draws it; a drop runs the same `ringStep` the live screen runs, ⛔ and writes nothing
 * to storage. ⛔ Renders the component and nothing else (C-0104).
 */
const INPUTS: RingInputs = {
  arena: { kind: 'open', href: '/arcade' },
  stories: { kind: 'open', href: '/world/story' },
  compose: { kind: 'open', href: '/world/compose' },
  vocab: { kind: 'open', href: '/world/collected' },
};
const START: RingNodeId[] = ['arena', 'msgs', 'stories', 'compose', 'sentences', 'vocab'];

export default function DevWorldRingPlacePage() {
  const [state, setState] = useState<RingState>({
    ring: START,
    mode: { kind: 'placing', id: 'amirnet' },
    notice: null,
  });
  return (
    <WorldRingView
      screen={ringScreen(INPUTS, '/world', 'unavailable')}
      lastNode={null}
      ring={state.ring}
      placing={state.mode.kind === 'placing' ? state.mode.id : null}
      notice={state.notice}
      onPlace={(id, slot) => setState(ringStep(state, { type: 'drop', id, slot }).state)}
    />
  );
}
