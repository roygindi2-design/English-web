'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AmirnetPracticeMenu, { HEADING_HE, KICKER_HE } from '@/components/AmirnetPracticeMenu';
import AmirnetQuestion, { type AmirnetAnswered } from '@/components/AmirnetQuestion';
import AmirnetTabs, { AMIRNET_BUILT_TABS } from '@/components/AmirnetTabs';
import { apiGet, apiPost } from '@/lib/api/client';
import {
  toTypeCards,
  unknownStatsCards,
  type AmirnetLevel,
  type AmirnetPracticeType,
  type AmirnetTypeCard,
  type AmirnetTypeStat,
} from '@/lib/core/amirnetPractice';
import { BACK_TO_MENU_HE, NO_MORE_ITEMS_HE, type AmirnetServedItem } from '@/lib/core/amirnetQuestion';
import { FAILURE_HE, SCHEMA_MISSING_HE } from '@/lib/core/failure';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

/**
 * `T-376` — **the door**, and it is the whole row. **המשך של: T-372**.
 *
 * 🔴 **What `F-265` measured, and it is the reason this file exists.** `AmirnetQuestion` reached
 * a learner through ⛔ NO production path — it was rendered by `app/dev/amirnet/question` alone —
 * so `onAnswered` (`T-372`ⓒ, the callback that writes the attempt) ⛔ could never fire, and
 * `T-372`'s own success measure — «three type cards carrying a real number» — was ⛔ not
 * performable by any learner. ⇒ a 🟣 row delivered green over a product that ⛔ does not change:
 * `27-pm-lessons § A1` line 12, verbatim.
 *
 * ⇒ this component is the wire, ⛔ and nothing else: menu ⇒ bank ⇒ question ⇒ write.
 * ⛔ Zero new mechanics · ⛔ zero migrations (`0027` ran live in `C-0633`) · ⛔ zero new content
 * (`R-010` extended to amirnet) · ⛔ zero adaptivity (`41 § 7` — the two values come from the
 * learner's own two taps and ⛔ nothing here reads an answer to choose them).
 *
 * ⛔ **It decides ⛔ nothing.** `toTypeCards` turns stats into cards, `servableItems` already
 * gated the queue inside the route, and `feedbackFor` inside `AmirnetQuestion` owns the verdict.
 * ⚠️ A page ⛔ never touches the database (RULES) and a page is a UI component ⇒ the calls live
 * here, through `lib/api/client.ts`, exactly as `AmirnetSimulationEntry` (`T-309`) and
 * `AmirnetDashboardLive` (`T-372`ⓓ) do one screen over.
 *
 * ── 🔴 FOUR STATES, and the fourth is the one an LLM drops (`taste-skill § 4.5` — «LLMs default
 *    to static successful state only»):
 *      checking   ⇒ the header, then the menu's own card skeleton
 *      menu       ⇒ the menu, with the learner's real numbers — or, on a failed read, ⛔ without
 *                   a number and ⛔ without the never-practised sentence (`unknownStatsCards`)
 *      starting   ⇒ a written line while the bank is read. ⛔ Never a blank screen, and ⛔ never
 *                   a menu that looks unpressed after a press (`T-311`, one screen over)
 *      blocked    ⇒ one sentence naming what failed, and ⛔ ONE way back
 *
 * ── ⛔ ONE CTA INTENT (`taste-skill § 4.5`): the menu's `תרגל` is the only start on the screen,
 *    and the blocked state's only button is `חזרה לתפריט התרגול` — the same label
 *    `AmirnetQuestion` already uses for the same intent, ⛔ not a fourth wording for «back».
 * ── ⛔ No animation to reduce (`check:motion`): every state here is a re-render.
 * ── The level chips and `תרגל` are the menu's own 44px targets; ⛔ nothing new is added here.
 */

export const CHECKING_LABEL_HE = 'טוען את הביצועים שלך';
export const STARTING_HE = 'טוען שאלות…';
/**
 * ⛔ A third amirnet wording on purpose, ⛔ not a drift from `lib/core/failure.ts`: that file's
 * own header says the amirnet sentences name **what the learner was about to do**, and
 * «כדי לתרגל» is information `ההתחברות פגה. היכנס שוב.` does not carry.
 */
export const SESSION_EXPIRED_HE = 'ההתחברות פגה. יש להתחבר שוב כדי לתרגל';

/** The routes' own vocabulary, ⛔ not a re-invention of it. */
type FailureCode = 'no_items' | 'session_expired' | 'schema_missing' | 'unavailable' | 'bad_request';

/**
 * ⛔ `no_items` is deliberately ⛔ not folded in with the rest: «the bank holds nothing at this
 * level yet» and «something is broken» are different facts, and a learner told the second about
 * the first has been told something false. The sentence is `AmirnetQuestion`'s own, so the two
 * screens ⛔ cannot drift.
 */
export function failureHe(code: FailureCode | undefined): string {
  if (code === 'no_items') return NO_MORE_ITEMS_HE;
  if (code === 'session_expired') return SESSION_EXPIRED_HE;
  if (code === 'schema_missing') return SCHEMA_MISSING_HE;
  return FAILURE_HE.load;
}

interface ResultResponse {
  readonly ok: boolean;
  readonly code?: FailureCode;
  readonly stats?: readonly AmirnetTypeStat[];
}

interface QueueResponse {
  readonly ok: boolean;
  readonly code?: FailureCode;
  readonly items?: readonly AmirnetServedItem[];
}

type Phase =
  | { readonly kind: 'checking' }
  | { readonly kind: 'menu'; readonly cards: readonly AmirnetTypeCard[] }
  | { readonly kind: 'starting' }
  | {
      readonly kind: 'question';
      readonly level: AmirnetLevel;
      readonly items: readonly AmirnetServedItem[];
    }
  | { readonly kind: 'blocked'; readonly code: FailureCode | undefined };

/** Three placeholders at the card's radius — `§ 4.5`'s «skeletal loaders matching the final
 * layout's shape», the same shape `AmirnetDashboardLive` reserves. ⛔ Not a spinner. */
function CardSkeleton() {
  return (
    <ul className="mt-4 space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-[120px] rounded-2xl border border-border-subtle bg-surface-raised" />
      ))}
    </ul>
  );
}

export interface AmirnetPracticeFlowProps {
  /** Pre-selected type — the dashboard's weakness strip links in with one already chosen (`T-291`ⓒ). */
  readonly initialType?: AmirnetPracticeType | null;
}

export default function AmirnetPracticeFlow({ initialType = null }: AmirnetPracticeFlowProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });

  /**
   * ⛔ The read is ⛔ never allowed to close the menu. A statistic that did not arrive costs the
   * learner a NUMBER; blocking the screen on it would cost them the thing they came to do.
   */
  const loadStats = useCallback(async () => {
    setPhase({ kind: 'checking' });
    try {
      const body = await apiGet<ResultResponse>('/api/amirnet/practice/result');
      setPhase({
        kind: 'menu',
        cards: body.ok && body.stats !== undefined ? toTypeCards(body.stats) : unknownStatsCards(),
      });
    } catch {
      setPhase({ kind: 'menu', cards: unknownStatsCards() });
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  /** `41 § 7` — `AmirnetPracticeMenu` calls this ⛔ only once BOTH choices exist. */
  const start = (type: AmirnetPracticeType, level: AmirnetLevel) => {
    setPhase({ kind: 'starting' });
    void (async () => {
      try {
        const body = await apiGet<QueueResponse>(
          `/api/amirnet/practice?type=${type}&level=${level}`,
        );
        if (body.ok && body.items !== undefined && body.items.length > 0) {
          setPhase({ kind: 'question', level, items: body.items });
        } else {
          setPhase({ kind: 'blocked', code: body.code });
        }
      } catch {
        setPhase({ kind: 'blocked', code: 'unavailable' });
      }
    })();
  };

  /**
   * 🔴 The write, and it is the row's whole point: `AmirnetQuestion` fires this ONCE per question
   * — its `answer()` returns early once `answered` — and this handler adds ⛔ no second trigger.
   * That is the failure scenario the row names, and `AmirnetPracticeFlow.dom.test.tsx` presses
   * three times to measure it.
   *
   * ⛔ **Fire and forget, ⛔ deliberately.** The learner's feedback is already on screen and is
   * `feedbackFor`'s, ⛔ not the server's; turning a failed write into an error card would replace
   * an answered question with a technical sentence about bookkeeping. The dashboard reports what
   * the table holds, so a lost row is a missing count there, ⛔ never a lie here.
   */
  const record = (answer: AmirnetAnswered) => {
    void apiPost('/api/amirnet/practice/result', {
      itemId: answer.itemId,
      type: answer.type,
      level: answer.level,
      correct: answer.correct,
    }).catch(() => undefined);
  };

  if (phase.kind === 'menu') {
    return <AmirnetPracticeMenu cards={phase.cards} initialType={initialType} onStart={start} />;
  }

  if (phase.kind === 'question') {
    return (
      <AmirnetQuestion
        items={phase.items}
        level={phase.level}
        onAnswered={record}
        onBackToMenu={() => void loadStats()}
      />
    );
  }

  // The header is repeated verbatim so every state sits under the SAME heading and tabs the
  // loaded screen uses — a header that appears only after a fetch is a layout shift.
  return (
    <section>
      <header className="pt-2">
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
        <AmirnetTabs active="practice" built={AMIRNET_BUILT_TABS} />
      </header>

      {phase.kind === 'blocked' ? (
        <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-sm text-ink">{failureHe(phase.code)}</p>
          {/* T-498 · F-331: «חזרה לתפריט» reloads the stats, and with a dead session that fetch
              answers `session_expired` again ⇒ a button that leads back to this same box. The
              learner fixes this failure themselves ⇒ the one exit `failureExit` gives it (D-065). */}
          {phase.code === 'session_expired' ? (
            <Link
              href={failureExit('session_expired').href}
              className="mt-4 inline-flex min-h-touch min-w-touch items-center rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90"
            >
              {SIGN_IN_AGAIN_HE}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void loadStats()}
              className="mt-4 min-h-touch min-w-touch rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90"
            >
              {BACK_TO_MENU_HE}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-ink-muted" role="status">
            {phase.kind === 'starting' ? STARTING_HE : CHECKING_LABEL_HE}
          </p>
          <CardSkeleton />
        </>
      )}
    </section>
  );
}
