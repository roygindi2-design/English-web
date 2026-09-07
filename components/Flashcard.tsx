'use client';

import { useEffect, useId, useRef, useState } from 'react';
import EnWord, { EnText } from '@/components/EnWord';
import { gradeTypedAnswer, type Card, type CardGrade } from '@/lib/core/flashcard';
import { dragOffset, resolveSwipe } from '@/lib/core/swipeGrade';
import { DECAY_LABEL, decayLevel, parseReviewAt } from '@/lib/core/decay';
import type { QueueCardReview } from '@/lib/core/deck';

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
  review,
  onGrade,
}: {
  readonly card: Card;
  /** ⛔ אופציונלי: פיקסטורות `/dev/card*` בונות `Card` ישירות ⛔ ואין להן תזמון
   *  להמציא. חסר ⇒ `'none'`, ⛔ ולא ניחוש. */
  readonly review?: QueueCardReview;
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
  /**
   * T-157 · D-090ⓑ · **T-233** — ההיסט החי של הגרירה.
   *
   * 🔴 **הפוך מ-T-157 (26/08), ובמדידה:** ההיסט היה `useState`, וכל `pointermove`
   * רינדר מחדש את כל תת-העץ של הכרטיס רק כדי להזיז `translateX` אחד — מכשיר ProMotion
   * שולח עד 120 אירועים בשנייה (C-0371). ⇒ ההיסט נכתב **ישירות לצומת** דרך `ref`,
   * ומאוחד ל**כתיבה אחת לפריים** ב-`requestAnimationFrame` (`apple-design` § 1 · § 11:
   * המשוב רציף בזמן המחווה, והשעון המסונכרן לתצוגה הוא rAF).
   * ⛔ ההכרעה ⛔ לא זזה: `dragOffset` בשכבה הטהורה עדיין מחזיר את המספר, ו-`reducedMotion`
   * עדיין מאפס אותו שם. מה שזז הוא **הכתיבה**, ⛔ לא הכלל.
   * ⛔ אפס `Date.now()` ואפס `matchMedia` ברינדור — ⛔ אין כאן שעון, וההעדפה נקראת אחרי ההרכבה.
   */
  const sectionRef = useRef<HTMLElement | null>(null);
  /** T-259ⓑ — one pending write per frame carries the offset AND the look-ahead verdict. */
  const pending = useRef<{ x: number; preview: CardGrade | null }>({ x: 0, preview: null });
  const frame = useRef<number | null>(null);
  /** Writes the drag to the node. `x === 0` drops `data-dragging` (globals.css restores the
   *  transition) and the preview; the badge follows `data-swipe-preview` in CSS. */
  const writeDrag = (x: number, preview: CardGrade | null) => {
    const node = sectionRef.current;
    if (node === null) return;
    if (x === 0) {
      node.style.transform = '';
      node.removeAttribute('data-dragging');
    } else {
      node.style.transform = `translateX(${x}px)`;
      node.setAttribute('data-dragging', 'true');
    }
    if (preview === null) node.removeAttribute('data-swipe-preview');
    else node.setAttribute('data-swipe-preview', preview);
  };

  /** Cancels a pending frame and resets — on release, on cancel, on card change. Without the
   *  cancel a stale offset would land AFTER the reset, on a card that was already graded. */
  const resetDrag = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    pending.current = { x: 0, preview: null };
    writeDrag(0, null);
  };

  const queueDrag = (x: number, preview: CardGrade | null) => {
    pending.current = { x, preview };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      writeDrag(pending.current.x, pending.current.preview);
    });
  };

  /** שחרור מפורש של הלכידה ב-`up`/`cancel` (T-233ⓑ). `hasPointerCapture` קודם: שחרור
   *  של מצביע שלא נלכד זורק `NotFoundError`. */
  const releaseCapture = (node: HTMLElement, pointerId: number) => {
    if (node.hasPointerCapture(pointerId)) node.releasePointerCapture(pointerId);
  };

  /**
   * ⛔ `prefers-reduced-motion` נקרא **אחרי** ההרכבה ו⛔ לא ברינדור: `matchMedia` ⛔ אינו
   * קיים בשרת, ורינדור ראשון שנבדל בין הצדדים הוא אזהרת hydration שהארנס סופר כשגיאה.
   * ⛔ והוא ⛔ אינו נקרא פעם אחת בלבד — לומד שמשנה את ההעדפה בזמן שהמסך פתוח מקבל אותה.
   */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // ⛔ אפס `Date.now()` ברינדור: השרת והלקוח היו מקבלים שני מספרים שונים,
  // וזו אזהרת hydration שהארנס סופר כשגיאת קונסולה. השעון נכנס **אחרי**
  // ההרכבה, ולכן הרינדור הראשון זהה בשני הצדדים ו⛔ אין אי-התאמה.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => setNowMs(Date.now()), []);

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
  // T-233 — the drag lives on the DOM node now, so a card that swaps mid-gesture is
  // reset in an effect, ⛔ not during render: render may not touch the node.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    swipeFrom.current = null;
    resetDrag();
  }, [card]);

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

  const decay =
    nowMs === null || review === undefined
      ? 'none'
      : decayLevel({
          nowMs,
          nextReviewAtMs: parseReviewAt(review.next_review_at),
          intervalDays: review.interval_days,
        });

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
      ref={sectionRef}
      /* T-157 · D-090ⓑ · T-233 — הכרטיס עוקב אחרי האצבע **1:1**, ⛔ ולא ב-8 פיקסלים.
         ההיסט ו-`data-dragging` נכתבים לצומת ב-`writeDrag`, ⛔ ולא כ-props: ה-CSS
         ב-`globals.css` מכבה את המעבר בדיוק כשהתכונה `data-dragging` נוכחת, ומחזיר
         אותו בשחרור — מעבר מתוזמן על ערך שמשתנה בכל `pointermove` הוא פיגור בין
         האצבע לכרטיס. */
      onPointerDown={(e) => {
        setSwipe(null);
        resetDrag();
        if (!swipeActive) {
          swipeFrom.current = null;
          return;
        }
        // T-233ⓑ · `apple-design` § 2 — הלכידה, בתקדים `SpellCard.tsx:79`: המעקב נמשך
        // גם כשהאצבע יוצאת מגבולות הכרטיס, ו-`pointerup` מגיע לכאן מכל מקום.
        // 🔴 **נמדד בכרומיום (C-0488), ⛔ לא הונח:** לכידה על ה-`<section>` מפנה את
        // ה-`click` הבא אל ה-section, וכפתור-ילד ⛔ אינו מקבל אותו לעולם. שני כפתורי
        // הסימון יושבים כאן בפנים (D-042 — הערוץ הקנוני) ⇒ מחווה שמתחילה על פקד ⛔ אינה
        // נלכדת ו⛔ אינה מחווה: הפקד הוא הערוץ שלה.
        const target = e.target instanceof Element ? e.target : null;
        if (target !== null && target.closest('button, input, a') !== null) {
          swipeFrom.current = null;
          return;
        }
        swipeFrom.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const from = swipeFrom.current;
        if (from === null) return;
        // T-259ⓑ — the look-ahead is the SAME rule that will grade on release (D-042):
        // the badge lights exactly when lifting now would count. ⛔ It never grades.
        // ⛔ The whole decision is in the pure layer: `prefers-reduced-motion` ⇒ ZERO motion,
        // ⛔ not less, and a non-finite number is neither zero nor a lot.
        const preview = resolveSwipe({
          startX: from.x,
          startY: from.y,
          endX: e.clientX,
          endY: e.clientY,
          viewportWidth: window.innerWidth,
        });
        queueDrag(dragOffset({ startX: from.x, currentX: e.clientX, reducedMotion }).x, preview);
      }}
      onPointerCancel={(e) => {
        // מחווה שהמערכת חטפה (שיחה נכנסת, מחוות מערכת) — הכרטיס **חוזר למקומו**,
        // ⛔ ואינו נשאר תלוי באמצע המסך בלי שאיש דירג אותו.
        swipeFrom.current = null;
        releaseCapture(e.currentTarget, e.pointerId);
        resetDrag();
      }}
      onPointerUp={(e) => {
        const from = swipeFrom.current;
        swipeFrom.current = null;
        releaseCapture(e.currentTarget, e.pointerId);
        // ⛔ מתאפס **תמיד**, בשני הענפים: מעל הסף `data-swipe` נושא את היציאה, ומתחתיו
        // הכרטיס חוזר למקומו — ובשניהם המעבר של `globals.css` מנגן את ההשתקעות.
        resetDrag();
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
        /* T-259ⓓ · render_video_A.py:326,:349-356 — the card is 315×372 on a 375 screen, the
           word sits at 34% of its height (oy+128 of 372) and the hint at the bottom edge
           (oy+h-40). The face is `flex-1` INSIDE CardDeck's `h-[calc(100dvh-10rem)]` slot
           (`CardDeck.tsx:217`) — ⛔ no height of its own, that calc is T-086's and breaks
           silently. Three auto margins (word top/bottom, hint top) put the word at ⅓ —
           the render's 34%. ⛔ Not vertical centring at screen level (F-011 · F-016): the
           section is still top-anchored; only the word inside the card is. */
        <button
          type="button"
          onClick={reveal}
          data-reveal
          className="rounded-2xl border border-border-subtle bg-surface-raised relative flex w-full flex-1 flex-col p-6 text-center"
        >
          <div className="my-auto">
            <p className="text-sm text-ink-muted">{prompt}</p>
            <p
              className="mt-2 text-4xl font-bold leading-tight"
              data-card-front
              data-decay={decay}
            >
              {primary(card.front.primary, card.front.primaryLang)}
            </p>
            {decay === 'none' ? null : (
              /* D-043 · חוקה § 1 — צבע ⛔ אינו הערוץ היחיד. ⛔ אין כאן אסימון חדש
                 ואין צבע חדש: `text-ink-muted` הוא המשלב הדיסקרטי, בדיוק כמו
                 «טרם אומת». ⛔ והשורה הזאת ⛔ אינה דועכת — היא תישבר מ-4.5:1. */
              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-ink-muted">
                <span aria-hidden="true">◷</span>
                {DECAY_LABEL}
              </p>
            )}
          </div>
          {/* הרמז חי בתוך הכפתור — תווית מחוץ לו אינה נלחצת עם הכפתור. */}
          <p className="mt-auto pt-6 text-sm text-ink-muted" data-reveal-hint>
            {'הקש להצגת התשובה'}
          </p>
        </button>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised relative flex w-full flex-1 flex-col p-6 text-center">
          <div className="my-auto">
          <p className="text-sm text-ink-muted">{prompt}</p>
          <p
            className="mt-2 text-4xl font-bold leading-tight"
            data-card-front
            data-decay={decay}
          >
            {primary(card.front.primary, card.front.primaryLang)}
          </p>
          {decay === 'none' ? null : (
            /* D-043 · חוקה § 1 — צבע ⛔ אינו הערוץ היחיד. ⛔ אין כאן אסימון חדש
               ואין צבע חדש: `text-ink-muted` הוא המשלב הדיסקרטי, בדיוק כמו
               «טרם אומת». ⛔ והשורה הזאת ⛔ אינה דועכת — היא תישבר מ-4.5:1. */
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-ink-muted">
              <span aria-hidden="true">◷</span>
              {DECAY_LABEL}
            </p>
          )}

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
                <p className="flex items-center justify-center gap-2 text-sm text-ink-muted" data-card-unverified>
                  <span aria-hidden="true">◇</span>
                  טרם אומת — התרגום ממתין לאישור אנושי
                </p>
              ) : null}
            </div>
          ) : null}
          </div>
          {/* T-259ⓑ · render_video_A.py:366-372 — the badge the render draws ON the card
              from p > .12: a pill at the card's vertical centre, glyph + label. Two are
              always in the DOM; CSS shows the one `data-swipe-preview` / `data-swipe`
              names. `aria-hidden`: the accessible channel is the two buttons below, and
              a screen reader announcing «ידעתי» mid-drag would announce a guess.
              § 0.22: the render fills the pill at 20% of the grade colour; the palette
              carries no alpha slot (`globals.css:111-116`) ⇒ `bg-surface-raised`, opaque,
              which also keeps the label ≥ 4.5:1 over any card content. */}
          <span
            aria-hidden="true"
            data-swipe-badge="good"
            className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto flex w-fit -translate-y-1/2 items-center gap-2 rounded-full border-2 border-success bg-surface-raised px-6 py-3 text-base font-bold text-success"
          >
            ✓ ידעתי
          </span>
          <span
            aria-hidden="true"
            data-swipe-badge="again"
            className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto flex w-fit -translate-y-1/2 items-center gap-2 rounded-full border-2 border-danger bg-surface-raised px-6 py-3 text-base font-bold text-danger"
          >
            ✕ לא ידעתי
          </span>
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
              className="min-h-touch rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
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
              className="min-h-touch rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              המשך
            </button>
          </div>
        ) : null}

        {swipeActive ? (
          <>
            {/* T-259ⓕ (Roy, 06/09) — the swipe IS the grade channel. The instruction is
                text: direction ⇢ verdict, both directions, glyph + word (שכבה א׳ — never
                colour alone, and F-102 measured that «right» is ambiguous under RTL
                unless it is written). D-042 · D-150: physical right = «ידעתי». */}
            <p data-swipe-hint className="text-center text-sm text-ink-muted">
              {'החלק ימינה — '}
              <span aria-hidden="true">✓</span>
              {' ידעתי · שמאלה — '}
              <span aria-hidden="true">✕</span>
              {' לא ידעתי'}
            </p>
            {/* ⓘⓘ · שכבה א׳ — a gesture is not reachable by keyboard or screen reader, so the
                two buttons SURVIVE as the accessible equivalent: in the DOM and focusable,
                `sr-only` until a keyboard user reaches them, then visible at ≥44px. Same
                handler as the swipe — ⛔ never a second grading path (D-042).
                ⛔ D-150 · render_video_A.py:373 — «ידעתי» is still the first grid item ⇒
                on the right under RTL. Order unchanged; only visibility changed. */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onGrade('good')}
                data-grade="good"
                className="sr-only focus:not-sr-only focus:min-h-touch focus:px-4 focus:py-3 focus:border-2 rounded-lg border-success text-base font-semibold text-success active:opacity-90"
              >
                <span aria-hidden="true">✓ </span>ידעתי
              </button>
              <button
                type="button"
                onClick={() => onGrade('again')}
                data-grade="again"
                className="sr-only focus:not-sr-only focus:min-h-touch focus:px-4 focus:py-3 focus:border-2 rounded-lg border-danger text-base font-semibold text-danger active:opacity-90"
              >
                <span aria-hidden="true">✕ </span>לא ידעתי
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
