import Link from 'next/link';
import ActionBar from '@/components/ActionBar';
import StudyEmptyState from '@/components/StudyEmptyState';

/**
 * The study screen — T-041.
 *
 * There is no review queue endpoint yet and no licensed content in the bank
 * (P-001), so today this screen honestly renders its empty state. That is not a
 * placeholder: an empty queue is a real state a learner reaches every time they
 * finish a session, and it needs to exist either way. When the queue endpoint
 * lands it fetches through lib/api/client.ts and renders <Flashcard> — the
 * component is complete and measured at /dev/card.
 */
export default function StudyPage() {
  return (
    <section className="flex flex-col gap-4">
      {/* T-051: the heading and the paragraph moved into a shared component so
          `/study` and `/cards` cannot describe the same empty queue in two
          different ways. The action stays here — the two screens differ. */}
      <StudyEmptyState />
      {/* F-027: an empty state is still a screen in the flow, and the way out of
          it is the only action on it. Marked so check:mobile measures this link
          and not whatever comes first in the DOM once the queue endpoint lands
          and <Flashcard> renders above it. */}
      <ActionBar>
        <Link
          href="/"
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-xl border border-border-strong px-5 py-3 text-base text-ink active:opacity-90"
        >
          חזרה למסך הבית
        </Link>
      </ActionBar>
    </section>
  );
}
