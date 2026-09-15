'use client';

import { useEffect, useState } from 'react';
import AmirnetDashboard, { HEADING_HE, KICKER_HE } from '@/components/AmirnetDashboard';
import AmirnetTabs, { AMIRNET_BUILT_TABS } from '@/components/AmirnetTabs';
import type { AmirnetTypeStat } from '@/lib/core/amirnetPractice';
import { hasAnyAnswers, toTypeCards, weakestCard } from '@/lib/core/amirnetPractice';
import { FAILURE_HE, SCHEMA_MISSING_HE } from '@/lib/core/failure';

/**
 * `T-372`ⓓ — the dashboard's first real reader. **המשך של: T-291**.
 *
 * 🔴 **What it replaces, and it is a MEASUREMENT.** Until this file,
 * `app/(tabs)/world/amirnet/page.tsx:21` called `zeroStats()` — a CONSTANT — so the heading
 * «ביצועים לפי סוג שאלה» reported, forever, a number the product ⛔ never collected. `0027` now
 * holds the answers and `GET /api/amirnet/practice/result` sums them; this component is the one
 * place that asks.
 *
 * ⛔ **It fetches and ⛔ decides nothing.** `toTypeCards` · `weakestCard` · `hasAnyAnswers`
 * (`lib/core/amirnetPractice.ts`, pure, tested) turn the stats into the screen, exactly as they
 * did from `zeroStats()`. ⛔ `AmirnetDashboard` itself is untouched: a presentational component
 * that grew a fetch would be the drift `T-291` wrote its header against.
 * ⚠️ A page ⛔ never touches the database (RULES), and a page is a UI component ⇒ the fetch lives
 * here, exactly like `AmirnetSimulationEntry` (`T-309`).
 *
 * ── 🔴 THE THREE STATES, AND THE THIRD IS THE ONE THAT MATTERS (`taste-skill § 4.5` — «LLMs
 *    default to static successful state only»; the loading branch is a SKELETON matching the
 *    final layout's shape, ⛔ not a spinner, and it reserves the cards' height so the screen
 *    ⛔ does not jump when the numbers land — `§ 6.D`, CLS):
 *      checking  ⇒ the header, then three card-shaped placeholders
 *      ready     ⇒ the dashboard, including `T-291`ⓓ's written empty state at zero answers
 *      blocked   ⇒ a written sentence, ⛔ AND ⛔ NOT THREE ZEROED CARDS
 *
 * 🔴 **`blocked` ⛔ is ⛔ not «you answered nothing».** A read that failed means the product
 * ⛔ cannot tell what the learner answered, and drawing `עדיין לא תרגלת` over it would be the
 * product asserting a zero it ⛔ did not measure — the same refusal `weakestType()` makes three
 * times over. ⇒ the sentence says so, and the link to the practice menu stays reachable.
 *
 * ⛔ No score, XP, currency, streak or leaderboard (`D-050`) · ⛔ no adaptivity (`41 § 7`) ·
 * ⛔ no score estimate (Roy's, `41 § 9.2`) · ⛔ no animation to reduce (`check:motion`): the
 * skeleton is a static shape, ⛔ never a pulse.
 */

type FailureCode = 'schema_missing' | 'unavailable' | 'session_expired' | string;

interface ResultResponse {
  readonly ok: boolean;
  readonly code?: FailureCode;
  readonly stats?: readonly AmirnetTypeStat[];
}

export const CHECKING_LABEL_HE = 'טוען את הביצועים שלך';
export const SESSION_EXPIRED_HE = 'ההתחברות פגה. יש להתחבר שוב כדי לראות את הביצועים שלך';

/**
 * 🔴 **The line that keeps the failure from becoming a claim.** `FAILURE_HE.load` says the read
 * did not arrive; it ⛔ does not say the learner practised nothing, and on THIS screen — whose
 * empty state is a sentence about exactly that — the difference is the whole point. ⇒ the two are
 * printed together, ⛔ never one of them alone.
 */
export const NOT_A_ZERO_HE = 'זה לא אומר שלא תרגלת — הנתונים שלך שמורים.';

/**
 * ⛔ One sentence per code, and the two shared ones come from `lib/core/failure.ts`, ⛔ not from a
 * fourth wording written here (`T-056` · `C-0477`: eleven files once declared the set-up sentence
 * for themselves). ⛔ `schema_missing` is deliberately ⛔ not folded in with `unavailable`: «the
 * bank is not installed here» and «the read failed» are different facts, and a learner shown the
 * second about the first has been told something false.
 * ⛔ And ⛔ no retry BUTTON: reloading the screen is the retry, so a second CTA here would be the
 * duplicate intent `taste-skill § 4.5` fails a page for.
 */
export function failureHe(code: FailureCode | undefined): string {
  if (code === 'session_expired') return SESSION_EXPIRED_HE;
  if (code === 'schema_missing') return SCHEMA_MISSING_HE;
  return FAILURE_HE.load;
}

type Phase =
  | { readonly kind: 'checking' }
  | { readonly kind: 'ready'; readonly stats: readonly AmirnetTypeStat[] }
  | { readonly kind: 'blocked'; readonly code: FailureCode | undefined };

/** Three placeholders at the card's own radius and roughly its height — `§ 4.5`'s «skeletal
 * loaders matching the final layout's shape». ⛔ Not a spinner, and ⛔ not a pulse. */
function CardSkeleton() {
  return (
    <ul className="mt-4 space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-[92px] rounded-2xl border border-border-subtle bg-surface-raised" />
      ))}
    </ul>
  );
}

export default function AmirnetDashboardLive() {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch('/api/amirnet/practice/result');
        const body = (await res.json()) as ResultResponse;
        if (!live) return;
        if (body.ok && body.stats !== undefined) setPhase({ kind: 'ready', stats: body.stats });
        else setPhase({ kind: 'blocked', code: body.code });
      } catch {
        if (live) setPhase({ kind: 'blocked', code: 'unavailable' });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  if (phase.kind === 'ready') {
    const { stats } = phase;
    return (
      <AmirnetDashboard
        cards={toTypeCards(stats)}
        weakness={weakestCard(stats)}
        hasAnswers={hasAnyAnswers(stats)}
      />
    );
  }

  // The header is repeated verbatim so the skeleton and the failure sit under the SAME heading and
  // tabs the loaded screen uses — a header that appears only after the fetch is a layout shift.
  return (
    <section>
      <header className="pt-2">
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
        <AmirnetTabs active="dashboard" built={AMIRNET_BUILT_TABS} />
      </header>

      {phase.kind === 'checking' ? (
        <>
          <p className="mt-6 text-sm text-ink-muted" role="status">
            {CHECKING_LABEL_HE}
          </p>
          <CardSkeleton />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-sm text-ink">{failureHe(phase.code)}</p>
          <p className="mt-2 text-sm text-ink-muted">{NOT_A_ZERO_HE}</p>
        </div>
      )}
    </section>
  );
}
