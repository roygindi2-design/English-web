/**
 * The body of the לימודים tab — the counter and the one action, with no session
 * read and no data access of its own.
 *
 * It exists so the harness fixture at `/dev/tabs/studies` and the real screen at
 * `/studies` are the SAME markup rather than two copies that agree today. The
 * real screen answers 307 without Supabase env (TD-13), so its geometry can only
 * be measured through that fixture — and a fixture that drifts from the screen
 * it stands for is F-027 cause 2, which reported "ok" for a layout nobody had
 * measured. Extraction makes the drift impossible instead of detectable.
 *
 * `headline` is passed in, ⛔ never computed here: the day count is
 * `daysUntilExamHe(daysUntilExam(...))` from `lib/core/onboarding.ts`, and the
 * clock belongs to the edge so lib/core stays a pure function of its arguments.
 */
import Link from 'next/link';

export default function StudiesScreen({ headline }: { headline: string }): React.JSX.Element {
  return (
    <section className="flex flex-col gap-4">
      {/* ⛔ Nothing between the counter and the button: § 4.2ב question 1 says
          the three-second read is the day count and one action, and any line
          added here would be product copy Dev does not get to write. */}
      <h1 className="text-3xl font-bold leading-tight">{headline}</h1>
      <Link
        href="/cards"
        data-primary-action="true"
        className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-base font-semibold text-brand-on active:opacity-90"
      >
        התחלת מנה יומית
      </Link>
    </section>
  );
}
