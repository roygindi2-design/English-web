import Link from 'next/link';
import StudyEmptyState from '@/components/StudyEmptyState';

/**
 * כרטיסיות — the word tab (D-027 · § 4.2ב: "כל מה שהוא מילה").
 *
 * It wraps the existing study screen's empty state (T-041) rather than
 * restating it. When the queue endpoint lands, this is where <Flashcard>
 * renders — the component is complete and measured at /dev/card.
 *
 * ⛔ No <ActionBar> here. D-028 forbids two bottom bars on one screen, and this
 * screen already carries the tab bar. The action therefore sits in normal flow.
 * The label is `/studies`'s own action label rather than new copy — ⛔ Dev does
 * not mint product copy (§ 4.2ב names the labels).
 */
export default function CardsPage() {
  return (
    <section className="flex flex-col gap-4">
      <StudyEmptyState />
      <Link
        href="/studies"
        data-primary-action="true"
        className="flex min-h-touch items-center justify-center rounded-xl border border-border-strong px-5 py-3 text-base text-ink active:opacity-90"
      >
        התחלת מנה יומית
      </Link>
    </section>
  );
}
