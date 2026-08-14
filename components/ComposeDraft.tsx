'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ActionBar from '@/components/ActionBar';
import EnWord from '@/components/EnWord';
import WordBank, { type WordBankGroup } from '@/components/WordBank';
import { apiGet, apiPost } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { PUNCTUATION_TOKENS, draftContainsTarget, renderDraft } from '@/lib/core/world';

/**
 * `/world/compose` — the closed bank and the draft. Plan `2026-08-14-world-compose.md`
 * task 8, § 4.2ה · D-030 · D-028 · R-016.
 *
 * ⚠️ **Reported deviation from the plan's `Interfaces` block, and the reason it is not a
 * choice.** The plan declares `ComposeDraft(props: { target, functionWords, activeWords })`
 * AND, four lines later, that this component "holds the bank data and the publish call"
 * while `app/world/compose/page.tsx` is a Server Component with **⛔ no data access**. The
 * two cannot both hold: a page that reads nothing cannot fill those props, so the declared
 * signature has no possible caller. The props are therefore dropped and the bank is read
 * here through `GET /api/world/bank`, which is the half the plan states twice (step 5,
 * step 6) and the half `docs/api-contract.md` already names this screen as the consumer of.
 * Opened as F-042 rather than silently reconciled, so task 9's implementer does not read
 * the same contradiction and guess the other way.
 *
 * Everything below is fixed by § 4.2ה and ⛔ none of it is this file's to change:
 *   · two labelled groups, «מילות קישור» and «המילים שלך», in Hebrew text and ⛔ never by
 *     colour alone (constitution § 1) — `<WordBank>` renders them;
 *   · tap a bank word ⇒ append to the END of the draft · tap a draft word ⇒ remove it;
 *   · ⛔ no drag (it fights the scroll axis) · ⛔ no free-text field and ⛔ no keyboard
 *     anywhere on the screen · punctuation is exactly the two fixed buttons the pure layer
 *     names, mapped from `PUNCTUATION_TOKENS` and ⛔ not re-typed here;
 *   · the target line reads «היום: ____» at the top;
 *   · «פרסם» is disabled until the target is IN the draft, and the block reads as guidance:
 *     «הוסף את <word> כדי לפרסם» — ⛔ never a grade;
 *   · after publishing the label is factual, «השתמשת ב-<word>», from the server's own
 *     `usedWord`, and ⛔ never «נכון» or «יפה» (R-016).
 *
 * Three decisions here are mechanical rather than stylistic:
 *
 * 1. **The publish gate is `draftContainsTarget` and ⛔ never `tokens.length`.** The rule is
 *    exact-token equality in the pure layer, and the server enforces the same predicate
 *    (`checkPostPayload`). A UI gate that disagreed with it would either offer a button that
 *    the server refuses, or hide a button the server would have accepted. `includes()` on
 *    the joined sentence is the F-020 false-accept class: "car" satisfied by "card".
 *
 * 2. **The sentence shown is `renderDraft(tokens)` — the same function the route stores.**
 *    ⛔ No local `join()`: punctuation attaches to the word before it, and a second copy of
 *    that rule would show the learner a sentence that differs from the one published.
 *
 * 3. **A duplicate tap appends a duplicate token, and that is deliberate.** «the cat and the
 *    dog» needs "the" twice; a bank that removed a word once used would make that sentence
 *    unwritable. Removal is by POSITION for the same reason — removing "every the" would
 *    delete a word the learner still wanted.
 *
 * ⛔ No `MAX_DRAFT_TOKENS` on this screen: § 4.2ה forbids a counter and forbids disabling at
 * a length. The ceiling is a wire guard in the route and the learner never meets it.
 */

const HEADING_HE = 'הרכיבו פוסט';
const TODAY_HE = 'היום:';
const TARGET_BLANK_HE = '____';
const DRAFT_EMPTY_HE = 'הקישו על מילה כדי להוסיף אותה.';
const DRAFT_HINT_HE = 'הקישו על מילה בטיוטה כדי להסיר אותה.';
const FUNCTION_WORDS_HE = 'מילות קישור';
const MY_WORDS_HE = 'המילים שלך';
const PUNCTUATION_HE = 'סימני פיסוק';
const PUBLISH_HE = 'פרסם';
const PUBLISHING_HE = 'מפרסם…';
const CANCEL_HE = 'ביטול';
const USED_PREFIX_HE = 'השתמשת ב';
const BACK_TO_WORLD_HE = 'חזרה לעולם';
const NO_ACTIVE_WORDS_HE = 'עוד אין לך מילים פעילות להרכבה.';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const LOADING_HE = 'טוען את הבנק…';
const WORLD_HREF = '/world';

/** Exactly what `GET /api/world/bank` answers (`docs/api-contract.md`). */
type BankResponse =
  | {
      readonly ok: true;
      readonly functionWords: readonly string[];
      readonly activeWords: readonly string[];
      readonly target: string | null;
    }
  | { readonly ok: false; readonly code: string };

/** Exactly what `POST /api/world/posts` answers. `usedWord` is a FACT about the post — the
 *  server sends no praise and no verdict, and this screen prints only the fact. */
type PublishResponse =
  | { readonly ok: true; readonly usedWord: string }
  | { readonly ok: false; readonly code: string; readonly message?: string };

type Bank = {
  readonly functionWords: readonly string[];
  readonly activeWords: readonly string[];
  readonly target: string | null;
};

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly bank: Bank }
  | { readonly kind: 'published'; readonly usedWord: string }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

const PRIMARY_ACTION_CLASS =
  'inline-flex w-full min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90 disabled:opacity-50';

const SECONDARY_ACTION_CLASS =
  'inline-flex min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90';

const CHIP_CLASS =
  'inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-lg text-ink active:opacity-90';

const DRAFT_CHIP_CLASS =
  'inline-flex min-h-touch min-w-touch items-center justify-center rounded-md bg-brand-surface px-3 py-2 text-lg text-brand-on active:opacity-90';

export default function ComposeDraft(): React.JSX.Element {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });
  const [tokens, setTokens] = useState<readonly string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<BankResponse>('/api/world/bank');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else setState({ kind: 'error' });
        return;
      }
      setState({
        kind: 'ready',
        bank: {
          functionWords: body.functionWords,
          activeWords: body.activeWords,
          target: body.target,
        },
      });
    } catch {
      // `apiGet` rejects only when the answer never arrived or was not JSON: there is no
      // code to act on, so this is the generic failure and ⛔ not a guess about the cause.
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const append = useCallback((token: string) => {
    setPublishError('');
    setTokens((current) => [...current, token]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setPublishError('');
    setTokens((current) => current.filter((_, i) => i !== index));
  }, []);

  const target = state.kind === 'ready' ? state.bank.target : null;
  // The gate. `target` is `null` only when the learner has no active word at all, and a
  // draft can then never contain it — so publishing stays shut rather than open by default.
  const canPublish = target !== null && draftContainsTarget(tokens, target);

  const publish = useCallback(async () => {
    if (target === null || !draftContainsTarget(tokens, target)) return;
    setPublishing(true);
    setPublishError('');
    try {
      const body = await apiPost<PublishResponse>('/api/world/posts', { target, tokens });
      if (body.ok) {
        setState({ kind: 'published', usedWord: body.usedWord });
        setTokens([]);
        return;
      }
      if (body.code === 'session_expired') setState({ kind: 'session_expired' });
      else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
      // `target_missing` carries the server's own Hebrew guidance; anything else is ours.
      else setPublishError(body.message ?? FAILURE_HE.save);
    } catch {
      setPublishError(FAILURE_HE.offline);
    } finally {
      setPublishing(false);
    }
  }, [target, tokens]);

  if (state.kind === 'loading') {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>
        {/* The shape of what is coming, ⛔ not a spinner (constitution § 5). */}
        <div className="flex flex-col gap-3" data-skeleton>
          <p className="sr-only" role="status">
            {LOADING_HE}
          </p>
          <div aria-hidden className="h-14 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-24 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-24 w-2/3 rounded-lg bg-surface-raised" />
        </div>
      </section>
    );
  }

  if (state.kind === 'published') {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>
        {/* A fact about the post and ⛔ nothing else: no praise, no verdict, no correction
            (R-016). The word is the server's `usedWord`, ⛔ not a local guess. */}
        <p role="status" className="text-lg leading-relaxed text-ink">
          {USED_PREFIX_HE}-<EnWord>{state.usedWord}</EnWord>
        </p>
        <ActionBar>
          <Link href={WORLD_HREF} data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
            {BACK_TO_WORLD_HE}
          </Link>
        </ActionBar>
      </section>
    );
  }

  if (state.kind !== 'ready') {
    const message =
      state.kind === 'schema_missing' ? SCHEMA_MISSING_HE : FAILURE_HE.load;
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>
        <p className="text-lg leading-relaxed text-ink">{message}</p>
        <ActionBar>
          {state.kind === 'session_expired' ? (
            // A plain <a> and ⛔ not <Link>: the session is gone, so the next request has to
            // reach the server and be allowed to redirect (the `<WorldFeed>` reasoning).
            <a href="/login" data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
              {SIGN_IN_AGAIN_HE}
            </a>
          ) : (
            <button
              type="button"
              data-primary-action="true"
              onClick={() => void load()}
              className={PRIMARY_ACTION_CLASS}
            >
              {RETRY_HE}
            </button>
          )}
        </ActionBar>
      </section>
    );
  }

  const groups: readonly WordBankGroup[] = [
    { labelHe: FUNCTION_WORDS_HE, words: state.bank.functionWords },
    { labelHe: MY_WORDS_HE, words: state.bank.activeWords },
  ];

  return (
    // The bottom padding pays for the strip the fixed <ActionBar> covers (D-028 · § 4.2ג).
    <section className="flex flex-col gap-6 pb-28">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {/* The target line. Hebrew label, English word in the bidi wrapper, and a blank while
          the learner has no active word — ⛔ never an invented word. */}
      <p className="text-xl font-semibold text-ink">
        {TODAY_HE}{' '}
        {target === null ? TARGET_BLANK_HE : <EnWord>{target}</EnWord>}
      </p>

      {target === null && (
        <p className="text-lg leading-relaxed text-ink-muted">{NO_ACTIVE_WORDS_HE}</p>
      )}

      {/* The draft: removable chips, plus the sentence exactly as it will be stored. Both,
          because the chips are what the learner edits and the rendered line is what the
          product will publish — the punctuation attachment is only visible in the second. */}
      <div className="flex flex-col gap-2">
        {tokens.length === 0 ? (
          <p className="text-lg leading-relaxed text-ink-muted">{DRAFT_EMPTY_HE}</p>
        ) : (
          <>
            <ul className="flex flex-row flex-wrap gap-2">
              {tokens.map((token, index) => (
                <li key={`${token}-${index}`}>
                  <button
                    type="button"
                    className={DRAFT_CHIP_CLASS}
                    onClick={() => removeAt(index)}
                  >
                    <EnWord>{token}</EnWord>
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-lg leading-relaxed text-ink">
              <EnWord>{renderDraft(tokens)}</EnWord>
            </p>
            <p className="text-base text-ink-muted">{DRAFT_HINT_HE}</p>
          </>
        )}
      </div>

      <WordBank groups={groups} onPick={append} />

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-ink-muted">{PUNCTUATION_HE}</h2>
        <ul className="flex flex-row flex-wrap gap-2">
          {PUNCTUATION_TOKENS.map((mark) => (
            <li key={mark}>
              <button type="button" className={CHIP_CLASS} onClick={() => append(mark)}>
                <EnWord>{mark}</EnWord>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {publishError !== '' && (
        <p role="status" className="text-base text-danger">
          {publishError}
        </p>
      )}

      <ActionBar>
        <div className="flex flex-row items-center gap-3">
          <button
            type="button"
            data-primary-action="true"
            disabled={!canPublish || publishing}
            onClick={() => void publish()}
            className={PRIMARY_ACTION_CLASS}
          >
            {publishing ? PUBLISHING_HE : PUBLISH_HE}
          </button>
          <Link href={WORLD_HREF} className={SECONDARY_ACTION_CLASS}>
            {CANCEL_HE}
          </Link>
        </div>
        {/* Guidance and ⛔ never a grade (R-016): it says what to do next, names the word,
            and passes no judgement on the sentence the learner has written so far. */}
        {!canPublish && target !== null && (
          <p className="pt-2 text-base text-ink-muted">
            הוסף את <EnWord>{target}</EnWord> כדי לפרסם
          </p>
        )}
      </ActionBar>
    </section>
  );
}
