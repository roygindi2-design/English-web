'use client';

import { useState } from 'react';
import { WorldRingView } from '@/components/WorldRing';
import { ringStep, type RingState } from '@/lib/core/ringMode';
import { ringScreen, type RingInputs, type RingNodeId } from '@/lib/core/worldRing';

/**
 * Layout fixture for `check:mobile` — T-506/T-507 (`kol-E-05`…`07`, Figma `3341:152`).
 * noindex (inherited from `app/dev/world/layout.tsx`), unlinked, ⛔ NOT a learning screen
 * (בדיקת פריסה). Seven apps, already in edit mode, as the frame draws it; ✕ and «סיום» run
 * the same `ringStep` the live screen runs, ⛔ and write nothing to storage. ⛔ Renders the
 * component and nothing else (C-0104).
 */
const INPUTS: RingInputs = {
  arena: { kind: 'open', href: '/arcade' },
  stories: { kind: 'open', href: '/world/story' },
  compose: { kind: 'open', href: '/world/compose' },
  vocab: { kind: 'open', href: '/world/collected' },
};
const START: RingNodeId[] = ['arena', 'msgs', 'amirnet', 'stories', 'compose', 'sentences', 'vocab'];

export default function DevWorldRingEditPage() {
  const [state, setState] = useState<RingState>({ ring: START, mode: { kind: 'editing' }, notice: null });
  const step = (e: Parameters<typeof ringStep>[1]) => setState((s) => ringStep(s, e).state);
  return (
    <WorldRingView
      screen={ringScreen(INPUTS, '/world', 'unavailable')}
      lastNode={null}
      ring={state.ring}
      notice={state.notice}
      editing={state.mode.kind === 'editing'}
      onLongPress={(id) => step({ type: 'longPress', id })}
      onRemove={(id) => step({ type: 'remove', id })}
      onDone={() => step({ type: 'hubTap' })}
      onMove={(id, slot) => step({ type: 'drop', id, slot })}
    />
  );
}
