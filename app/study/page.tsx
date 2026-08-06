import Link from 'next/link';

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
      <h1 className="text-3xl font-bold leading-tight">אין כרטיסיות כרגע</h1>
      <p className="text-lg leading-relaxed text-ink-muted">
        עוד לא נטענו מילים למאגר. ברגע שיהיו — הן יופיעו כאן, עשר דקות ביום.
      </p>
      <Link
        href="/"
        className="mt-2 flex min-h-touch items-center justify-center rounded-xl border border-border-strong px-5 py-3 text-base text-ink active:opacity-90"
      >
        חזרה למסך הבית
      </Link>
    </section>
  );
}
