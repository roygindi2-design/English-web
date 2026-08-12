'use client';

import { useId, useState } from 'react';
import EnWord, { EnText } from '@/components/EnWord';
import { gradeTypedAnswer, type Card, type CardGrade } from '@/lib/core/flashcard';

/**
 * The card, per the UI spec in docs/superpowers/plans/2026-08-06-content-bank.md.
 *
 * Two rules here are measurements, not preferences:
 *
 * 1. The reveal is state, not animation. `revealed` puts the answer in the DOM
 *    immediately; any transition is decoration on top and is disabled entirely
 *    under prefers-reduced-motion (globals.css). No study shows a flip helps
 *    learning, and Mayer's coherence principle says decorative motion costs.
 * 2. Correct/incorrect is never colour alone. Measured 2026-08-06 with the
 *    dataviz validator: --success vs --danger separate by only ΔE 4.1 for a
 *    deutan reader. Every grade control therefore carries its own Hebrew label
 *    and a glyph; colour is the third channel, not the first.
 *
 * Layout is anchored to the top, never vertically centred (F-011, F-016) — and
 * `flex-1` is load-bearing, not decorative: without it the section shrinks to its
 * content and the `mt-auto` below has no free space to push against, which a
 * review measured as the reveal button sitting at y=243 on a 780px screen. That
 * is F-011 upside down.
 */
export default function Flashcard({
  card,
  onGrade,
}: {
  readonly card: Card;
  readonly onGrade: (grade: CardGrade) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [grade, setGrade] = useState<CardGrade | null>(null);
  const answerId = useId();

  // React's documented "adjust state when a prop changes" pattern, and it is a
  // correctness fix, not tidiness: `revealed` is component state, so a parent that
  // renders the next card in the same slot without a `key` would hand the learner
  // card n+1 with its answer already on screen — measured, card B arrived revealed
  // with no reveal button. Retrieval practice with the answer visible is not
  // retrieval practice.
  const [shown, setShown] = useState(card);
  if (shown !== card) {
    setShown(card);
    setRevealed(false);
    setTyped('');
    setGrade(null);
  }

  const primary = (text: string, lang: 'en' | 'he') =>
    lang === 'en' ? <EnWord>{text}</EnWord> : <span>{text}</span>;

  const reveal = () => setRevealed(true);

  return (
    <section className="flex flex-1 flex-col gap-6" data-flashcard={card.direction}>
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
        <p className="text-sm text-ink-muted">
          {card.direction === 'recognition' ? 'מה הפירוש?' : 'איך אומרים באנגלית?'}
        </p>
        <p className="mt-2 text-4xl font-bold leading-tight" data-card-front>
          {primary(card.front.primary, card.front.primaryLang)}
        </p>

        {revealed ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-border-subtle pt-5" data-card-back>
            <p className="text-2xl font-semibold" data-card-answer>
              {primary(card.back.primary, card.back.primaryLang)}
            </p>
            {card.back.exampleSegments.length > 0 ? (
              <p className="text-base leading-relaxed text-ink-muted">
                <EnText segments={card.back.exampleSegments} />
              </p>
            ) : null}
            {/*
              D-024: a translation that has not been checked by a human is SHOWN,
              and marked. Back only — `card.back.unverified` is the single place
              that decides, and on a production card the front is the Hebrew
              prompt, where this sentence would read as "the question is wrong".
              No new colour and no new token: the palette has 11 and none of them
              means "warning" (lib/core/palette.ts). `text-ink-muted` is the
              discreet register T-045 asks for, the glyph is a second channel so
              colour is never alone, and aria-hidden keeps the screen reader on
              the sentence rather than on decoration.
            */}
            {card.back.unverified ? (
              <p className="flex items-center gap-2 text-sm text-ink-muted" data-card-unverified>
                <span aria-hidden="true">◇</span>
                טרם אומת — התרגום ממתין לאישור אנושי
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Actions live in the lower half for thumb reach (MF-5). */}
      <div className="mt-auto flex flex-col gap-3">
        {!revealed && card.input === 'typed' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              // Grade now, report on "המשך". Firing onGrade here advanced the queue
              // before the learner ever saw whether they were right — feedback the
              // whole typed direction exists to deliver.
              setGrade(gradeTypedAnswer(card, typed));
              reveal();
            }}
          >
            <label htmlFor={answerId} className="text-sm text-ink-muted">
              כתוב את המילה באנגלית
            </label>
            <input
              id={answerId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              dir="ltr"
              lang="en"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-h-touch rounded-xl border border-border-strong bg-surface-raised px-4 text-lg text-ink"
            />
            <button
              type="submit"
              className="min-h-touch rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              בדיקה
            </button>
          </form>
        ) : null}

        {!revealed && card.input === 'self' ? (
          <button
            type="button"
            onClick={reveal}
            data-reveal
            className="min-h-touch rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            הצג תשובה
          </button>
        ) : null}

        {/*
          The typed direction is auto-graded, so the learner does not rate themselves —
          but they still have to SEE the verdict, and there has to be a way forward.
          Without this branch none of the three conditionals matched after a submit and
          the screen was left with zero controls (measured: `controls: []`).
        */}
        {revealed && card.input === 'typed' ? (
          <div className="flex flex-col gap-3">
            <p
              data-verdict={grade ?? 'again'}
              className={`text-lg font-semibold ${grade === 'good' ? 'text-success' : 'text-danger'}`}
            >
              <span aria-hidden="true">{grade === 'good' ? '✓ ' : '✕ '}</span>
              {grade === 'good' ? 'נכון' : 'לא נכון'}
            </p>
            {grade !== 'good' && typed.trim() !== '' ? (
              <p className="text-base text-ink-muted">
                כתבת: <EnWord>{typed}</EnWord>
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => onGrade(grade ?? 'again')}
              data-continue
              className="min-h-touch rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              המשך
            </button>
          </div>
        ) : null}

        {revealed && card.input === 'self' ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onGrade('again')}
              data-grade="again"
              className="min-h-touch rounded-xl border-2 border-danger px-4 py-3 text-base font-semibold text-danger active:opacity-90"
            >
              <span aria-hidden="true">✕ </span>לא ידעתי
            </button>
            <button
              type="button"
              onClick={() => onGrade('good')}
              data-grade="good"
              className="min-h-touch rounded-xl border-2 border-success px-4 py-3 text-base font-semibold text-success active:opacity-90"
            >
              <span aria-hidden="true">✓ </span>ידעתי
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
