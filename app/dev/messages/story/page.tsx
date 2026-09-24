import { ClassJoinView } from '@/components/ClassJoin';
import { ClassStoryView } from '@/components/ClassStory';
import { InboxListView } from '@/components/InboxList';
import { FIXTURE_STORY } from '../story-fixture';

/**
 * T-479ⓔ — the `סיפור` tab at 320/375/414: the chain as `scene_story` draws it (legend
 * above, three lines, `התור שלך`), then the empty chain and the waiting state. Handed its
 * states as props and asks the server for nothing ⇒ ⛔ no EXPECTED_CONSOLE entry.
 */
const CLS = { code: 'K7Q2MZ', name: 'כיתה ז׳3', members: 27 } as const;

export default function DevMessagesStoryPage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <InboxListView
        state={{ kind: 'loading' }}
        tab="story"
        wallKickerHe="הודעות · כיתה ז׳3"
        story={<ClassJoinView state={{ kind: 'in_class', cls: CLS }} wall={<ClassStoryView state={{ kind: 'ready', lines: FIXTURE_STORY, myTurn: true }} />} />}
      />
      <ClassStoryView state={{ kind: 'ready', lines: [], myTurn: true }} />
      <ClassStoryView state={{ kind: 'ready', lines: FIXTURE_STORY.slice(0, 2).concat({ ...FIXTURE_STORY[2]!, mine: true }), myTurn: false }} />
    </main>
  );
}
