import { InboxListView } from '@/components/InboxList';

/**
 * T-482 — the inbox while `/api/world/messages` is still cold (C-0794: ≈5.4s of function
 * start): three skeleton rows in the real row's shape. Props only ⇒ ⛔ no EXPECTED_CONSOLE entry.
 */
export default function DevMessagesColdPage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <InboxListView state={{ kind: 'loading' }} />
    </main>
  );
}
