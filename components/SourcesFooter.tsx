'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { showsLicenceFooter } from '@/lib/core/licenceFooter';

/**
 * 🧹 T-326 — the attribution footer, and the one screen family it stays out of.
 *
 * T-011 requires the link to be reachable from the product, ⛔ not that it be
 * drawn inside a task: measured on `/dev/deck`, «מקורות הנתונים והרישיונות» was
 * drawn under the card the learner is answering, which is an administrative
 * destination offered in the middle of a question.
 *
 * ⛔ The list of task screens is ⛔ NOT here — it is `lib/core/licenceFooter.ts`,
 * pure and unit-tested. This component is the 6 lines of React that ask it.
 *
 * ⚠️ It owns the whole `<footer>`, ⛔ not just the link, so a task screen ends at
 * its last real element instead of at 32px of empty padding. That moved the
 * element out of `app/layout.tsx`, so `app/layout.test.ts` (D-206 · the one
 * gutter) follows it here — `px-6` is still the single number and it is still
 * asserted, in the file that now writes it.
 */
export default function SourcesFooter() {
  const pathname = usePathname();
  if (!showsLicenceFooter(pathname ?? '/')) return null;

  return (
    <footer className="px-6 pb-6 pt-2">
      <Link
        href="/sources"
        className="inline-flex min-h-touch items-center text-sm text-ink-muted underline"
      >
        מקורות הנתונים והרישיונות
      </Link>
    </footer>
  );
}
