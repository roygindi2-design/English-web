import SimulationMessage from '@/components/SimulationMessage';

// T-264 — the exact kicker `<SimulationMessage>` renders in every state (`KICKER_HE`).
// The `<h1>` is the English subject and is fetched client-side, so it cannot be the
// static title — the `/world/story` precedent. The suffix is `app/layout.tsx`'s template.
export const metadata = { title: 'תיבת הסימולציות' };

/**
 * `/world/messages/[id]` — T-192 · `39 § 7` · D-109.
 *
 * ⛔ **OUTSIDE the `(tabs)` group, and that is structural rather than stylistic** — the
 * `/world/compose` precedent. Render `kol-C-14-mail-open.png` draws ⛔ no tab bar
 * (`screen_mail` never calls `nav(c)`), and D-028 allows exactly one bar per screen —
 * here the disabled compose strip. Placing the file outside the group is what makes
 * «no tab bar on this screen» impossible to break by forgetting a condition.
 *
 * A Server Component with ⛔ zero data access, for the same reason as
 * `app/(tabs)/world/messages`: `<SimulationMessage>` reads `GET /api/world/messages`,
 * which already performs the C-0032 guard order and already answers `session_expired`
 * as data. A second `getUser()` here would be a second session check that can disagree
 * with the first.
 */
export default async function WorldMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SimulationMessage id={id} />;
}
