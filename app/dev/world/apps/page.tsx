import { AppCentreView } from '@/components/AppCentre';
import type { RingNodeId } from '@/lib/core/worldRing';

/**
 * Layout fixture for `check:mobile` — T-503ⓓ. noindex (inherited from
 * `app/dev/world/layout.tsx`), unlinked, ⛔ NOT a learning screen (בדיקת פריסה).
 * Six installed, as in Figma `3341:3` («6 מתוך 10») ⇒ `אמירנט` installable and the two
 * locked apps drawn together — every card state on one screen. ⛔ Renders the component
 * and nothing else (C-0104).
 */
const FIXTURE: readonly RingNodeId[] = ['stories', 'vocab', 'sentences', 'arena', 'msgs', 'compose'];

export default function DevWorldAppsPage() {
  return <AppCentreView ring={FIXTURE} />;
}
