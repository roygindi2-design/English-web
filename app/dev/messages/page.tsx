import { InboxListView } from '@/components/InboxList';
import { inboxCounts, inboxCountsHe, mergeInbox, toInboxRows } from '@/lib/core/messages';
import { FIXTURE_NOW, FIXTURE_SIMULATIONS, FIXTURE_STATES } from './messages-fixture';

/** T-190ⓔ / T-191 — the inbox fixture at 320/375/414. Asks the server for nothing (⛔ no EXPECTED_CONSOLE entry). */
export default function DevMessagesPage() {
  const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <InboxListView state={{ kind: 'ready', rows: toInboxRows(items, FIXTURE_NOW, 'Asia/Jerusalem'), countsHe: inboxCountsHe(inboxCounts(items)) }} />
    </main>
  );
}
