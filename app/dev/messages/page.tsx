import { Fragment } from 'react';
import EnWord from '@/components/EnWord';
import { CONTEXT_HE, inboxCounts, inboxCountsHe, mergeInbox, unanswered } from '@/lib/core/messages';
import { FIXTURE_SIMULATIONS, FIXTURE_STATES } from './messages-fixture';

/**
 * T-190ⓔ — a layout-harness data sheet for `check:mobile`, ⛔ not a product screen and
 * ⛔ not linked from anywhere. It proves the fixture parses through the SAME functions the
 * route uses (`mergeInbox` · `inboxCounts`) and renders at 320/375/414 with zero
 * horizontal scroll and a clean console. Task 6 (T-191) replaces the body with
 * `<InboxListView>`; the route and this comment stay.
 *
 * Asks the server for nothing ⇒ ⛔ no entry in `EXPECTED_CONSOLE` (scripts/verify-mobile.mjs).
 */
export default function DevMessagesPage() {
  const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
  return (
    <main dir="rtl" className="mx-auto w-full max-w-md px-4 py-6 text-ink">
      <h1 className="text-xl font-bold">הודעות · פיקסטורה</h1>
      <p className="mt-2 text-xs text-ink-muted">{inboxCountsHe(inboxCounts(items))}</p>
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-2xl bg-surface-raised p-4">
            <p className="text-sm font-semibold">
              <EnWord>{it.senderEn}</EnWord> · {CONTEXT_HE[it.context]} · {unanswered(it) ? 'טרם נענתה' : 'נקראה'}
            </p>
            <p className="mt-1 text-sm">
              <EnWord>{it.subjectEn}</EnWord>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              מילות חובה:{' '}
              {it.requiredWords.map((w, i) => (
                <Fragment key={w}>
                  {i > 0 ? ' · ' : null}
                  <EnWord>{w}</EnWord>
                </Fragment>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
