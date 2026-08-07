import Link from 'next/link';
import EnWord from '@/components/EnWord';
import {
  DATA_SOURCES,
  SOURCES_PAGE_INTRO,
  SOURCES_PAGE_TITLE,
} from '@/lib/core/dataSources';

/**
 * /sources — T-011. The learner-facing half of the attribution obligation.
 *
 * Rendered from lib/core/dataSources.ts, the same record docs/data-licenses.md
 * is generated from, so the page and the document cannot disagree.
 *
 * Anchored to the top, not centred: F-011 and F-016 both came from a heading
 * inside a `flex-1 justify-center` wrapper, and check:mobile measures the gap
 * between the header and `main h1` on every route including this one.
 */
export const metadata = {
  title: 'מקורות הנתונים — אנגלית לאמיר״ם',
};

export default function SourcesPage() {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold leading-tight">{SOURCES_PAGE_TITLE}</h1>
      <p className="text-base leading-relaxed text-ink-muted">{SOURCES_PAGE_INTRO}</p>

      <ul className="flex flex-col gap-4">
        {DATA_SOURCES.map((source) => (
          <li
            key={source.id}
            className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4"
          >
            <h2 className="text-base font-semibold text-ink">
              <EnWord>{source.name}</EnWord>
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">{source.usedFor}</p>
            <p className="text-sm leading-relaxed text-ink">{source.attributionHe}</p>
            <dl className="flex flex-col gap-1 text-sm text-ink-muted">
              <div className="flex gap-2">
                <dt className="font-medium text-ink">רישיון:</dt>
                <dd>
                  <EnWord>{source.licence}</EnWord>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-ink">מקור מורשה:</dt>
                <dd>
                  <EnWord>{source.host}</EnWord>
                </dd>
              </div>
            </dl>
            <a
              href={source.url}
              rel="noreferrer"
              target="_blank"
              className="inline-flex min-h-touch items-center text-sm font-semibold text-brand underline"
            >
              לעמוד המקור
            </a>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="inline-flex min-h-touch items-center text-sm font-semibold text-ink-muted underline"
      >
        חזרה למסך הבית
      </Link>
    </section>
  );
}
