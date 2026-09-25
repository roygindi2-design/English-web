'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AmirnetLevels from '@/components/AmirnetLevels';
import AmirnetSimulation from '@/components/AmirnetSimulation';
import { apiGet, apiPost } from '@/lib/api/client';
import { highestUnlocked, type AmirnetSimulationRun } from '@/lib/core/amirnetLevels';
import type { AmirnetLevel } from '@/lib/core/amirnetPractice';
import type { AmirnetServedItem } from '@/lib/core/amirnetQuestion';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

/**
 * `T-308` — the door. The learner presses `סימולציה` in the tab bar, lands on the four levels
 * (`T-307`), presses an open one, and **the existing engine starts**. **המשך של: T-307 · T-296.**
 *
 * ⛔ THIS FILE ADDS ⛔ NO SCREEN. Both halves already exist and ⛔ neither is rewritten here:
 * `AmirnetLevels` draws the entry and decides nothing; `AmirnetSimulation` runs the six chapters
 * under their own clocks. What was missing between them was a fetch and a piece of state, and
 * that is all this is.
 *
 * ⛔ It ⛔ does not assemble the run: `simulationQueue()` (pure, `lib/core/amirnetSimulation.ts`)
 * lays the six chapters end to end **server-side**, so the screen ⛔ cannot serve an `rs` item
 * under an `sc` chapter heading even if the bank were read in another order.
 *
 * 🔴 **⛔ And it ⛔ never invents a run out of a bank that cannot fill one.** Measured C-0553:
 * the DB bank is EMPTY — the items `K-006` wrote sit in `data/generated/*.jsonl` and there is
 * ⛔ no `build:amirnet-items` ingest yet (`03-for-roy`). ⇒ a learner who presses רמה 1 today
 * meets `NO_RUN_HE`, which is a **statement of fact** (`D-152 § ב׳`) and the reason this tab is
 * ⛔ not `RULES § 0.31`: the press does something, and what it does is tell the truth.
 * ⛔ A shortened «full simulation» would have been the alternative, and `41 § 2` forbids it.
 *
 * ── ⛔ ONE action per state (`taste-skill § 4.5`, NO DUPLICATE CTA INTENT): the blocked state
 *    offers `חזרה לרמות` and ⛔ not «try again» beside it — the same press, named twice.
 * ── State is ⛔ never colour alone: every state below is a SENTENCE, and `role="status"` puts it
 *    in the screen-reader's mouth the moment it appears.
 * ── ⛔ No motion (`check:motion`), ⛔ no hex literal, ⛔ no `h-screen`.
 * ── ⟦T-309 · C-0560⟧ **The unlock stopped being a fixture.** Until this tick the page handed
 *    `unlockedThrough={1}` as a constant, so a learner who finished רמה 3 came back to find רמה 4
 *    locked with ⛔ nothing telling them why. The runs are now read from
 *    `GET /api/amirnet/simulation/runs`, the answer is `highestUnlocked()` — **pure**,
 *    `lib/core/amirnetLevels.ts`, its own test — and a finished run is written back through
 *    `POST` to the same route. ⛔ **The rule is ⛔ never re-implemented here:** this file holds the
 *    rows and asks the pure layer what they mean, which is why a completion updating the screen
 *    and a reload reading it from the database ⛔ cannot disagree.
 * ── 🔴 **A read that failed is ⛔ never reported as «you have unlocked nothing».** `41 § 7`'s own
 *    starting state is level 1, so that is what is shown — **and the screen says it could not
 *    check**, because a locked level presented as a measured fact is the same lie `T-309` closed.
 * ── ⟦T-311 · C-0558⟧ `loading` is now handed DOWN to the levels, ⛔ not only printed under them:
 *    the sentence below told the learner a fetch was running while the cards stayed pressable, and
 *    C-0554 measured 3 taps ⇒ 3 requests — the **last** answer wins `setPhase({kind:'run'})`, so a
 *    39-minute run could start from a tap the learner ⛔ did not mean. The sentence stays; what
 *    changed is that the cards now say it too.
 */

export const LOADING_HE = 'טוען את הסימולציה…';
export const UNLOCK_UNKNOWN_HE = 'לא הצלחנו לבדוק אילו רמות כבר פתחת, ולכן מוצגת רמה 1 בלבד';
export const NO_RUN_HE = 'עוד אין מספיק פריטים לסימולציה מלאה ברמה הזאת';
export const SESSION_EXPIRED_HE = 'ההתחברות פגה. יש להתחבר שוב כדי להתחיל סימולציה';
export const UNAVAILABLE_HE = 'הסימולציה אינה זמינה כרגע';
export const BACK_TO_LEVELS_HE = 'חזרה לרמות';

/** The route's own vocabulary, ⛔ not a re-invention of it. */
type FailureCode = 'no_items' | 'session_expired' | 'schema_missing' | 'unavailable' | 'bad_request';

interface QueueResponse {
  readonly ok: boolean;
  readonly code?: FailureCode;
  readonly items?: readonly AmirnetServedItem[];
}

/** `GET /api/amirnet/simulation/runs` — the learner's own finished runs, ⛔ nothing derived. */
interface RunsResponse {
  readonly ok: boolean;
  readonly code?: FailureCode;
  readonly runs?: readonly AmirnetSimulationRun[];
}

/**
 * ⛔ Three states, ⛔ not two. «⛔ still asking» and «⛔ could not ask» are different facts, and a
 * learner told the second while the first is true is being shown a sentence about nothing.
 */
type UnlockState = 'checking' | 'known' | 'unknown';

/**
 * ⛔ One sentence per code, and `no_items` is deliberately ⛔ not folded in with the rest: «the
 * bank cannot fill a run yet» and «something is broken» are different facts, and a learner who
 * is told the second about the first has been told something false.
 */
export function failureHe(code: FailureCode | undefined): string {
  if (code === 'no_items') return NO_RUN_HE;
  if (code === 'session_expired') return SESSION_EXPIRED_HE;
  return UNAVAILABLE_HE;
}

type Phase =
  | { readonly kind: 'levels' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'blocked'; readonly code: FailureCode | undefined }
  | {
      readonly kind: 'run';
      readonly items: readonly AmirnetServedItem[];
      /** ⛔ Carried, ⛔ not re-derived: the completion has to name the level that was actually run. */
      readonly level: AmirnetLevel;
    };

export default function AmirnetSimulationEntry() {
  const [phase, setPhase] = useState<Phase>({ kind: 'levels' });
  const [runs, setRuns] = useState<readonly AmirnetSimulationRun[]>([]);
  const [unlockState, setUnlockState] = useState<UnlockState>('checking');

  /**
   * ⛔ The ⛔ only derivation on this screen, and it is ⛔ not made here: the rows are the fact,
   * `highestUnlocked()` is the rule, and it is the same call a reload makes.
   */
  const unlocked = highestUnlocked(runs);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const body = await apiGet<RunsResponse>('/api/amirnet/simulation/runs');
        if (!alive) return;
        if (body.ok && body.runs !== undefined) {
          setRuns(body.runs);
          setUnlockState('known');
          return;
        }
        setUnlockState('unknown');
      } catch {
        if (alive) setUnlockState('unknown');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /**
   * The run ended. ⛔ The row is written ⛔ before the screen believes anything — but a write that
   * failed ⛔ does ⛔ not hide the level the learner just earned for the rest of this session; the
   * next reload re-reads the truth from the database either way.
   */
  async function recordCompletion(level: AmirnetLevel) {
    const finished: AmirnetSimulationRun = { level, completedAtMs: Date.now() };
    setRuns((prev) => [...prev, finished]);
    try {
      await apiPost('/api/amirnet/simulation/runs', { level });
    } catch {
      // `apiPost` throws ⛔ only when the request never reached the server. ⛔ Nothing is said to
      // the learner here: they are mid-result, and the sentence that mattered — «this run is
      // over» — is already on the screen.
    }
  }

  async function start(level: AmirnetLevel) {
    // ⛔ Belt as well as braces (`T-311`): the cards are `disabled` while this runs, and this
    // guard is what makes «one run at a time» true even before React has re-rendered them.
    if (phase.kind === 'loading') return;
    setPhase({ kind: 'loading' });
    try {
      const body = await apiGet<QueueResponse>(`/api/amirnet/simulation?level=${level}`);
      if (body.ok && body.items !== undefined && body.items.length > 0) {
        setPhase({ kind: 'run', items: body.items, level });
        return;
      }
      setPhase({ kind: 'blocked', code: body.code });
    } catch {
      // `apiGet` throws ⛔ only when the request never reached the server (`ApiUnreachableError`).
      // ⛔ That is ⛔ not «the bank cannot fill a run» — it is `UNAVAILABLE_HE`, and telling a
      // learner the other sentence would be telling them something false.
      setPhase({ kind: 'blocked', code: 'unavailable' });
    }
  }

  if (phase.kind === 'run') {
    return (
      <AmirnetSimulation items={phase.items} onFinished={() => void recordCompletion(phase.level)} />
    );
  }

  return (
    <>
      <AmirnetLevels unlockedThrough={unlocked} onStart={start} busy={phase.kind === 'loading'} />

      {unlockState === 'unknown' && phase.kind === 'levels' && (
        <p role="status" className="mt-4 text-sm text-ink-muted">
          {UNLOCK_UNKNOWN_HE}
        </p>
      )}

      {phase.kind === 'loading' && (
        <p role="status" className="mt-4 text-sm text-ink-muted">
          {LOADING_HE}
        </p>
      )}

      {phase.kind === 'blocked' && (
        <div role="status" className="mt-4 rounded-xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-sm text-ink">{failureHe(phase.code)}</p>
          {/* T-498 · F-331: «חזרה לרמות» returns to a level whose start answers `session_expired`
              again ⇒ a loop. The learner fixes this failure themselves ⇒ the `failureExit` exit (D-065). */}
          {phase.code === 'session_expired' ? (
            <Link
              href={failureExit('session_expired').href}
              className="mt-3 flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-surface text-sm font-bold text-brand-on active:opacity-90"
            >
              {SIGN_IN_AGAIN_HE}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setPhase({ kind: 'levels' })}
              className="mt-3 min-h-touch w-full rounded-xl border border-brand bg-brand-surface/15 text-sm font-bold text-brand-surface active:opacity-90"
            >
              {BACK_TO_LEVELS_HE}
            </button>
          )}
        </div>
      )}
    </>
  );
}
