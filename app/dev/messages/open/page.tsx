'use client';

import { BlockKeyboardView } from '@/components/BlockKeyboard';
import { readyState, SimulationMessageView } from '@/components/SimulationMessage';
import { keyboardView } from '@/lib/core/blockKeyboard';
import type { Block } from '@/lib/core/continuations';
import { mergeInbox } from '@/lib/core/messages';
import { FIXTURE_NOW, FIXTURE_SIMULATIONS, FIXTURE_STATES } from '../messages-fixture';

/**
 * T-192ⓔ fixture — Tom's message with `recommend` already used, which is exactly the
 * state `screen_mail` draws (`render_msgs_screens.py:100`: `summer` ✗ · `visit` ✗ ·
 * `recommend` ✓ ⇒ `1 מתוך 3 מילות חובה`). Asks the server for ⛔ nothing, so
 * `check:mobile` measures the SCREEN and ⛔ not a failure state (the `/dev/story`
 * reasoning, `scripts/verify-mobile.mjs`).
 *
 * ⚠️ The used token comes from the render's own compose bar (`I` · `recommend`), ⛔ not
 * from anything authored here — the production bank is T-193's.
 *
 * ⚠️ **`'use client'`, and it is a MEASUREMENT ⛔ not a preference** (the plan omitted it):
 * `readyState` is exported from a `'use client'` module, so calling it from a Server
 * Component fails the BUILD — «Attempted to call readyState() from the server». The
 * neighbouring `/dev/messages` page gets away without the directive because it calls only
 * `lib/core` functions; this page calls the screen's own state constructor.
 */
/**
 * T-461 — the keyboard as `screen_mail` draws it (`render_msgs_screens.py:110-113`,
 * `RP_STEPS[2]` of `render_video_C.py:251`): `I` · `recommend` composed, and the five
 * blocks `one` · `a` · `the` · `your` · `this`. ⚠️ Their categories are CEFR-J's (D-283),
 * ⛔ not the render's: `a`/`the`/`your` are determiners, `one`/`this` carry more than one
 * pos ⇒ neutral blocks. ⚠️ The real A1 tree has ⛔ no continuation after `I recommend`
 * (`recommend` is B1 — `F-322`); this frame shows the render, ⛔ not a claim about the tree.
 */
const CHOSEN: readonly Block[] = [
  { word: 'I', pos: 'pronoun' },
  { word: 'recommend', pos: 'verb' },
];
const NEXT: readonly Block[] = [
  { word: 'one', pos: null },
  { word: 'a', pos: 'determiner' },
  { word: 'the', pos: 'determiner' },
  { word: 'your', pos: 'determiner' },
  { word: 'this', pos: null },
];

export default function DevMessageOpenPage() {
  const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
  const tom = items.find((i) => i.senderEn === 'Tom');
  if (tom === undefined) throw new Error('fixture: Tom is missing');
  return (
    <SimulationMessageView
      state={readyState(tom, ['I', 'recommend'], FIXTURE_NOW)}
      keyboard={
        <BlockKeyboardView
          chosen={CHOSEN}
          view={keyboardView({ blocks: NEXT, count: NEXT.length }, CHOSEN.length)}
          status="ready"
        />
      }
    />
  );
}
