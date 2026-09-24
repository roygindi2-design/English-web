'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import BlockKeyboard from '@/components/BlockKeyboard';
import EnWord, { EnText, type EnTextSegment } from '@/components/EnWord';
import RequiredWordChips from '@/components/RequiredWordChips';
import { apiGet, apiPatch } from '@/lib/api/client';
import { RETRY_HE } from '@/lib/core/failure';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';
import { CONTEXT_HE, initialOf, whenHeaderHe, whenOf, type InboxItem } from '@/lib/core/messages';
import { LEARNER_TIME_ZONE } from '@/lib/core/onboarding';
import { requiredWordsHe, requiredWordsProgress, type RequiredWordsProgress } from '@/lib/core/requiredWords';

/**
 * הודעה פתוחה — T-192 · `39 § 7` · D-109.
 * 🎯 Render: `docs/design/kol-C-14-mail-open.png`, drawn by `screen_mail`
 * (`docs/design/render_msgs_screens.py:84-116`). Every layout value below is grepped
 * there, ⛔ not eyeballed on the PNG:
 *   · header sub `תיבת הסימולציות` / title = the subject (`Trip to Israel`), `:86`
 *   · meta `Tom · תייר · היום 09:20` at y=148, `:87-88`
 *   · body bubble y=172 h=138 r=18 with the avatar and the sender's name, `:89-96`
 *   · `מילות חובה` at y=336 and three chips h=32 r=16 at y=354, `:98-109`
 *   · the compose bar at y=486 — PRESENT and disabled here (row ⓓ · R-026), `:112`
 *   · `screen_mail` ⛔ never calls `nav(c)` ⇒ ⛔ no tab bar, and the route therefore lives
 *     OUTSIDE `app/(tabs)/` — the `/world/compose` precedent, D-028.
 *
 * ⚠️ **Radius 18 → `rounded-2xl` (16), gap 2px — declared.** The scale is five values
 * (D-102) and a sixth is a finding against the constitution, ⛔ not a fix here.
 * 🔆 **The background comes from the product, ⛔ not from the render** (`36 § 14.2` ·
 * `§ 14.4`, Roy's decision 11/09): all 29 renders are dark frames of `render_video_*.py`
 * and the product is light in every screen. Layout, order, strings and finish still bind.
 *
 * ⛔ **Draws only.** Counts, the meta line, the time label and the chips all arrive
 * computed from `lib/core/`. One write in the whole screen: the PATCH that turns the blue
 * dot off (row ⓔ) — ⛔ nothing here touches the arena or the learner's word progress.
 * ⌨️ **T-461:** the compose strip is now the live block keyboard (`<BlockKeyboard>`,
 * `39 § 3` · D-283), passed in as a slot so this view stays a painter; every block the
 * learner picks feeds `requiredWordsProgress`, which lights the chips (row ⓔ).
 */
export const KICKER_HE = 'תיבת הסימולציות';
const BACK_HE = 'חזרה לתיבה';
const BACK_HREF = '/world/messages';
const NOT_FOUND_HE = 'ההודעה הזאת לא נמצאה.';
const LOADING_HE = 'טוען…';
// ⛔ `RETRY_HE` is imported and ⛔ never restated — `lib/core/failure.test.ts` measures it.

export type MessageScreenState =
  | { readonly kind: 'loading' }
  | {
      readonly kind: 'ready';
      readonly item: InboxItem;
      readonly metaHe: string;
      readonly bodySegments: readonly EnTextSegment[];
      readonly progress: RequiredWordsProgress;
      readonly progressHe: string;
    }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

type MessagesBody =
  | { ok: true; items: readonly InboxItem[] }
  | { ok: false; code: 'no_level' | 'no_simulations' | 'schema_missing' | 'unavailable' | 'session_expired' };

/**
 * The ready state, assembled once — ⛔ never inside the JSX, so the view stays a painter.
 * The body travels as a single untargeted `EnText` segment: this screen marks ⛔ no word
 * (the story's target-word marking is T-187's, and a message has no target).
 */
export function readyState(item: InboxItem, usedTokens: readonly string[], nowIso: string): MessageScreenState {
  const progress = requiredWordsProgress(item.requiredWords, usedTokens);
  return {
    kind: 'ready',
    item,
    metaHe: `${CONTEXT_HE[item.context]} · ${whenHeaderHe(whenOf(item.createdAt, nowIso, LEARNER_TIME_ZONE))}`,
    bodySegments: [{ text: item.bodyEn, isTarget: false }],
    progress,
    progressHe: requiredWordsHe(progress),
  };
}

function Exit({ code }: { readonly code: 'session_expired' | 'schema_missing' }) {
  const exit = failureExit(code);
  return (
    <Link
      href={exit.href}
      className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-brand-surface px-4 font-semibold text-brand-on"
    >
      {code === 'session_expired' ? SIGN_IN_AGAIN_HE : exit.labelHe}
    </Link>
  );
}

export function SimulationMessageView({
  state,
  onRetry = () => {},
  keyboard = null,
}: {
  readonly state: MessageScreenState;
  readonly onRetry?: () => void;
  /** The block keyboard — present only on a ready message. */
  readonly keyboard?: ReactNode;
}) {
  return (
    <section dir="rtl" className="flex flex-1 flex-col text-ink">
      <header>
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold">
          {state.kind === 'ready' ? <EnWord>{state.item.subjectEn}</EnWord> : KICKER_HE}
        </h1>
        {state.kind === 'ready' ? (
          <p className="mt-1 text-xs text-ink-muted">
            <EnWord>{state.item.senderEn}</EnWord> · {state.metaHe}
          </p>
        ) : null}
      </header>

      {state.kind === 'ready' ? (
        <>
          <article className="mt-4 rounded-2xl border border-border-subtle bg-surface-raised p-4">
            <p className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface text-sm font-bold text-brand-on"
              >
                {initialOf(state.item.senderEn)}
              </span>
              <span className="text-sm font-bold">
                <EnWord>{state.item.senderEn}</EnWord>
              </span>
            </p>
            {/*
              ⚠️ The body is an INLINE `<EnText>` inside an RTL `<p>`, ⛔ never a `block`
              one: `<EnText>`'s own isolation is `unicode-bidi: isolate`, so an isolated inline run
              inside an RTL paragraph right-anchors its lines — which is exactly what the
              render draws (`render_msgs_screens.py:96`, `anchor="rm"` per line) and
              exactly what `components/StoryScreen.tsx:349` already does with the story
              paragraph. Measured in the walk: as a `block` it became its own LTR box and
              left-aligned, ⛔ against both.
            */}
            <p className="mt-3 text-sm leading-6">
              <EnText segments={state.bodySegments} />
            </p>
          </article>
          <RequiredWordChips progress={state.progress} labelHe={state.progressHe} />
        </>
      ) : null}

      {state.kind === 'loading' ? <p className="mt-4 text-xs text-ink-muted">{LOADING_HE}</p> : null}
      {state.kind === 'not_found' ? <p className="mt-4 text-sm">{NOT_FOUND_HE}</p> : null}
      {state.kind === 'error' ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-touch self-start rounded-xl bg-brand-surface px-4 font-semibold text-brand-on"
        >
          {RETRY_HE}
        </button>
      ) : null}
      {state.kind === 'session_expired' ? <Exit code="session_expired" /> : null}
      {state.kind === 'schema_missing' ? <Exit code="schema_missing" /> : null}

      <div className="mt-auto pt-6">
        {state.kind === 'ready' ? keyboard : null}
        <Link
          href={BACK_HREF}
          className="mt-3 inline-flex min-h-touch items-center font-semibold text-brand-surface underline"
        >
          {BACK_HE}
        </Link>
      </div>
    </section>
  );
}

export default function SimulationMessage({ id }: { readonly id: string }): React.JSX.Element {
  const [state, setState] = useState<MessageScreenState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [nowIso] = useState(() => new Date().toISOString());
  const onChosen = useCallback(
    (words: readonly string[]) =>
      setState((s) => (s.kind === 'ready' ? readyState(s.item, words, nowIso) : s)),
    [nowIso],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        // ⛔ One endpoint, ⛔ not two: the list the learner just came from already carries
        // this message, so the open screen picks it by id instead of adding a second GET
        // that would have to repeat the level filter and could disagree with it.
        const body = await apiGet<MessagesBody>('/api/world/messages');
        if (!alive) return;
        if (!body.ok) {
          setState(
            body.code === 'session_expired'
              ? { kind: 'session_expired' }
              : body.code === 'schema_missing'
                ? { kind: 'schema_missing' }
                : { kind: 'error' },
          );
          return;
        }
        // `.find(` is a lookup, ⛔ not a computation — the source scan bans filter/reduce/sort.
        const item = body.items.find((i) => i.id === id);
        if (item === undefined) {
          setState({ kind: 'not_found' });
          return;
        }
        // Every chip starts unlit; `<BlockKeyboard>` lights them as blocks are picked.
        setState(readyState(item, [], nowIso));
        // ⛔ Fire-and-forget, and deliberately so: the dot is bookkeeping, and a failed
        // PATCH must ⛔ never turn a readable message into a failure screen.
        if (item.readAt === null) {
          void apiPatch<{ ok: boolean }>('/api/world/messages/state', { simulationId: id, read: true }).catch(
            () => undefined,
          );
        }
      } catch {
        if (alive) setState({ kind: 'error' });
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, attempt, nowIso]);

  return (
    <SimulationMessageView
      state={state}
      onRetry={() => setAttempt((n) => n + 1)}
      keyboard={state.kind === 'ready' ? <BlockKeyboard level={state.item.level} onChosen={onChosen} /> : null}
    />
  );
}
