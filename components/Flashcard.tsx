'use client';

import { useId, useRef, useState } from 'react';
import EnWord, { EnText } from '@/components/EnWord';
import { gradeTypedAnswer, type Card, type CardGrade } from '@/lib/core/flashcard';
import { resolveSwipe } from '@/lib/core/swipeGrade';

/**
 * The card, per the UI spec in docs/superpowers/plans/2026-08-06-content-bank.md.
 *
 * Three rules here are measurements, not preferences:
 *
 * 1. The reveal is state, not animation. `revealed` puts the answer in the DOM
 *    immediately; any transition is decoration on top and is disabled entirely
 *    under prefers-reduced-motion (globals.css). No study shows a flip helps
 *    learning, and Mayer's coherence principle says decorative motion costs.
 * 2. Correct/incorrect is never colour alone. Measured 2026-08-06 with the
 *    dataviz validator: --success vs --danger separate by only ΔE 4.1 for a
 *    deutan reader. Every grade control therefore carries its own Hebrew label
 *    and a glyph; colour is the third channel, not the first.
 * 3. **פני הכרטיס הם הכפתור** (D-039 · § 4.2ח ⓐ): במצב `self` + `!revealed`
 *    הרכיב `<button>` הטבעי הוא החזית — Enter/Space, `role="button"` וסימון
 *    `:focus-visible` הגלובלי מגיעים חינם. `role="button"` על `<div>` היה
 *    דורש `tabIndex` וטיפול ידני ב-Space. הרמז «הקש להצגת התשובה» חי
 *    **בתוך** הכפתור — תווית מחוץ לו היא הבטחה שלא נאכפת. שני כפתורי הסימון
 *    נשארים בחוץ ו⛔ ⛔ אינם מקוננים (`<button>` בתוך `<button>` שובר HTML
 *    ושובר קורא מסך; בדיקת מקור נכשלת על כך).
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

  // ⛔ ref ולא state: נקודת ההתחלה ⛔ אינה משנה ולו פיקסל אחד על המסך, ורינדור
  // מחדש על כל `pointerdown` היה מאפס את שדה ההקלדה של הכיוון השני.
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  const [swipe, setSwipe] = useState<CardGrade | null>(null);

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
    setSwipe(null);
  }

  const primary = (text: string, lang: 'en' | 'he') =>
    lang === 'en' ? <EnWord>{text}</EnWord> : <span>{text}</span>;

  const reveal = () => setRevealed(true);

  /* T-085 · D-039 · § 4.2ח ⓐ — פני הכרטיס הם יעד המגע.
   *
   * ה-JSX של פני הכרטיס מוטבע בכל אחת משתי הענפים ⛔ ⛔ נשלף לפונקציית עזר.
   * בדיקת המקור (`Flashcard.test.ts`) סורקת את הבלוק של ה-`<button>` וחייבת
   * למצוא בתוכו את `data-card-front` ואת «הקש להצגת התשובה» — משתנה JSX חיצוני
   * היה מסתיר את שני אלה מהבדיקה, שהיא הראיה היחידה שהחזית באמת בתוך הכפתור.
   * ⛔ ⛔ להוציא את `data-card-front` החוצה — `<CardDeck>` מודד את החזית דרכו.
   * ⛔ ⛔ להעביר את הרמז מחוץ לכפתור — תווית מחוץ לו היא הבטחה שלא נאכפת. */
  const prompt =
    card.direction === 'recognition' ? 'מה הפירוש?' : 'איך אומרים באנגלית?';

  /** ⛔ תנאי אחד לשני הערוצים: הכפתורים למטה נבדקים באותו ביטוי בדיוק. */
  const swipeActive = revealed && card.input === 'self';

  return (
    <section
      className="flex flex-1 flex-col gap-6"
      data-flashcard={card.direction}
      /* D-042 — הקיצור לשני הכפתורים. ⛔ הוא חי בדיוק כשהם על המסך: `swipeActive`
         הוא **אותו תנאי** שמרנדר אותם למטה, ⛔ ולא תנאי שני שיסטה ממנו.
         ⛔ אפס מטפל תנועה: הכרטיס ⛔ אינו נגרר (D-042ⓒ), וההיזון הוא אישור בדיד
         שנצבע ברגע ההכרעה. ⚠️ ההערה הזאת היא הערת-בלוק בכוונה ⛔ ולא הערת-שורה:
         שומר המקור ב-`Flashcard.test.ts` מסיר הערות-בלוק בלבד, ולכן שם של מטפל
         שנכתב בהערת-שורה היה מפיל אותו כאילו הוא קוד חי. */
      data-swipe={swipe ?? undefined}
      onPointerDown={(e) => {
        setSwipe(null);
        swipeFrom.current = swipeActive ? { x: e.clientX, y: e.clientY } : null;
      }}
      onPointerUp={(e) => {
        const from = swipeFrom.current;
        swipeFrom.current = null;
        if (from === null) return;
        const resolved = resolveSwipe({
          startX: from.x,
          startY: from.y,
          endX: e.clientX,
          endY: e.clientY,
          // ⛔ `window.innerWidth` ⛔ אינו נקרא ב-`/lib/core` — הרכיב הוא שמודד
          // את המסך ומוסר את המספר, וזה בדיוק גבול הטהרה של הפרויקט.
          viewportWidth: window.innerWidth,
        });
        if (resolved === null) return;
        // ⛔ אפס `setTimeout`: הציון יוצא **מיד**, והמעבר של 200ms מתנגן בזמן
        // שהבקשה בדרך. השהיית הציון הייתה מירוץ (התקדים הוא F-101).
        setSwipe(resolved);
        onGrade(resolved);
      }}
    >
      {/* פני הכרטיס.
          ⓐ במצב `self` + `!revealed` — `<button>` שגם היפוך וגם יעד מגע: `<button>`
             טבעי נותן Enter/Space, `role="button"` אוטומטי, ו-`:focus-visible`
             הגלובלי (globals.css:72) מציג רינג בלי CSS מקומי. ⛔ ⛔ `<div role="button">`
             — היה דורש `tabIndex` + טיפול ידני ב-Space, שגורר גלילת עמוד.
          ⓑ במצב `typed` או `revealed` — `<div>` שקט: לחיצה עליו ⛔ ⛔ עוזרת.
          ⛔ ⛔ שני כפתורי הסימון (revealed && input==='self') נמצאים בחוץ ומעולם
             לא בתוך הכפתור — כפתור בתוך כפתור שובר HTML וקורא-מסך. */}
      {!revealed && card.input === 'self' ? (
        <button
          type="button"
          onClick={reveal}
          data-reveal
          className="w-full rounded-2xl border border-border-subtle bg-surface-raised p-6 text-start"
        >
          <p className="text-sm text-ink-muted">{prompt}</p>
          <p className="mt-2 text-4xl font-bold leading-tight" data-card-front>
            {primary(card.front.primary, card.front.primaryLang)}
          </p>
          {/* הרמז חי בתוך הכפתור — תווית מחוץ לו אינה נלחצת עם הכפתור. */}
          <p className="mt-6 text-sm text-ink-muted" data-reveal-hint>
            {'הקש להצגת התשובה'}
          </p>
        </button>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
          <p className="text-sm text-ink-muted">{prompt}</p>
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
      )}

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
              className="min-h-touch rounded-lg border border-border-strong bg-surface-raised px-4 text-lg text-ink"
            />
            <button
              type="submit"
              className="min-h-touch rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              בדיקה
            </button>
          </form>
        ) : null}

        {/*
          ⛔ ⛔ הענף «!revealed && input === 'self'» כאן — הוא ירד לחזית הכרטיס
          עצמה (D-039 · § 4.2ח ⓐ). שאר שני הענפים למטה (`typed` אחרי revealed
          ו-`self` אחרי revealed) נשארים.
        */}

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
              className="min-h-touch rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              המשך
            </button>
          </div>
        ) : null}

        {swipeActive ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onGrade('again')}
              data-grade="again"
              className="min-h-touch rounded-lg border-2 border-danger px-4 py-3 text-base font-semibold text-danger active:opacity-90"
            >
              <span aria-hidden="true">✕ </span>לא ידעתי
            </button>
            <button
              type="button"
              onClick={() => onGrade('good')}
              data-grade="good"
              className="min-h-touch rounded-lg border-2 border-success px-4 py-3 text-base font-semibold text-success active:opacity-90"
            >
              <span aria-hidden="true">✓ </span>ידעתי
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
