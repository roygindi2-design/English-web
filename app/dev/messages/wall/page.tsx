import { ClassJoinView } from '@/components/ClassJoin';
import { InboxListView } from '@/components/InboxList';

/**
 * T-469 — the `הקיר` tab at 320/375/414: the join form with its six cells, then a learner
 * already in a class (the code to share, the member count, the empty feed). Handed its
 * states as props and asks the server for nothing ⇒ ⛔ no EXPECTED_CONSOLE entry.
 */
export default function DevMessagesWallPage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <InboxListView state={{ kind: 'loading' }} tab="wall" wall={<ClassJoinView state={{ kind: 'none' }} initialMode="join" />} />
      <InboxListView
        state={{ kind: 'loading' }}
        tab="wall"
        wallKickerHe="הודעות · כיתה ז׳3"
        wall={<ClassJoinView state={{ kind: 'in_class', cls: { code: 'K7Q2MZ', name: 'כיתה ז׳3', members: 27 } }} />}
      />
    </main>
  );
}
