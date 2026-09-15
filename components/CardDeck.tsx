'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Flashcard from '@/components/Flashcard';
import { deckCardKey, isSentenceCard, type DeckCard, type DeckName } from '@/lib/core/deck';
import { buildCard, type CardGrade } from '@/lib/core/flashcard';
import { buildSentenceCard } from '@/lib/core/sentenceCard';
import { describeRound, tallyGrades } from '@/lib/core/roundSummary';
import { SPRING_MAX_SETTLE_MS } from '@/lib/core/spring';

/**
 * The card deck — T-065 part א׳ (§ 4.2ו), plan `2026-08-13-study-queue.md` task 5.
 *
 * 🔴 **⟦REWRITTEN 13/09 · `T-294` · הכרעת רוי על פריט 111⟧ הדק ⛔ אינו נגלל.**
 * עד היום הוא היה «הדק הנגלל»: כל הכרטיסים הנותרים זה מתחת לזה בתוך
 * `snap-y snap-mandatory overflow-y-auto`, והמעבר לכרטיס הבא היה **גלילה**.
 * ⇒ רוי הכריע במפורש: «צריך להיות החלקה ימינה ושמאלה בשביל להעיף את הכרטיס ולקבל
 * את הכרטיס הבא… הגלילה האנכית הזאת לא צריכה להיות קיימת בכלל».
 * ⇒ **כרטיס אחד על המסך. ההחלקה מעיפה אותו. הבא תופס את מקומו.**
 *
 * Four decisions here are measurements, not taste:
 *
 * 1. **A graded card is REMOVED, and that is the whole of «no going back».** The spec
 *    forbids returning to a card the learner already marked. Removing the node makes the
 *    rule true by construction: there is nothing to return to, and no state to drift out of
 *    sync with the queue. ⛔ Hence still no `preventDefault` — ⛔ there is no scroll to
 *    fight. ⚠️ **What DID change 13/09:** the sentence here used to end «⛔ no
 *    `overflow-hidden`», because trapping the scroll was the alternative it rejected.
 *    ⛔ `overflow-hidden` is now the carrier of Roy's decision on BOTH axes, ⛔ and it is
 *    ⛔ not a scroll trap: there is no overflowing content for it to trap.
 *
 * 2. **The gesture is horizontal, and now ⛔ nothing else is.** (D-042 · T-099 · `T-294`.)
 *    The vision forbade drag because «a gesture on the scroll axis competes with the
 *    scroll»; D-042 answered that the axes differed. ⇒ **That defence is now redundant
 *    rather than wrong** — ⛔ there is no scroll axis left to compete with, which is the
 *    strongest form the original rule could take.
 *    ⚠️ **REVISED 07/09 (T-259ⓕ · Roy's explicit instruction, 06/09).** The swipe is the
 *    PRIMARY grade channel; the two ≥44px buttons stay in the DOM as the accessible
 *    equivalent (שכבה א׳ — `sr-only` until focused) and the swipe calls **exactly the
 *    same handler** — ⛔ never a second path with its own logic. The sentence that stood
 *    here until 07/09 named the buttons as the channel and is deliberately ⛔ not quoted:
 *    a dead instruction in a live file is one some agent will still obey (`36 § 14.4`).
 *    Two caveats come from measurement:
 *    ⓐ a **20px** strip at each edge does not respond (iOS Safari back-swipe), ⓑ the
 *    gesture needs ≥**64px** of travel at ≤**30°** off the horizontal.
 *    ⚠️ **The third caveat was REVERSED on 26/08 (D-090ⓑ · T-157), and it is deliberately
 *    ⛔ NOT quoted here** — a dead instruction sitting in a live file is one some agent
 *    will still obey (the `36 § 14.4` precedent). What it forbade was the finger; what was
 *    measured is that its 8-pixel allowance is feedback a learner ⛔ does not feel.
 *    The card tracks the finger **1:1** during the drag and settles in one easing on
 *    release — ⛔ and that is ⛔ not a relaxation of constitution § 5, which governs the
 *    RELEASE: dragging is **direct manipulation**, ⛔ not an animation the product plays.
 *    ⛔ None of that lives here: `<Flashcard>` owns both grade buttons, so it owns the
 *    shortcut to them, and this component still adds no control of its own.
 *
 * 3. **⛔ ⟦RETIRED 13/09 · `T-294`⟧ «`behavior: 'auto'`, ⛔ never `'smooth'`».** It governed
 *    the `scrollIntoView` that advanced the deck, and **that call ⛔ no longer exists**.
 *    ⇒ the heading is kept, ⛔ and empty on purpose: a numbered decision that vanishes
 *    silently is one a later reader re-derives from scratch.
 *
 * 4. **The `unknown` deck wears a permanent label (D-033).** «תרגול — לא משנה את מועד
 *    החזרה» is a promise about what the buttons do NOT do: `POST /api/practice` moves two
 *    counters and ⛔ never `next_review_at`. A learner who drills a hard word ten times and
 *    then finds it scheduled for next month would be right to think the app lied. The label
 *    is sticky rather than a one-time toast for the same reason: the claim has to be true
 *    on the card the learner is looking at, not on the one they saw first.
 *
 * The layout is anchored to the top and ⛔ never `flex-1 … justify-center` (F-011 · F-016).
 * The component fetches nothing: the screen above it owns the network and the error copy
 * (task 6), which is what keeps this file renderable by the `/dev/deck` harness with no
 * Supabase env at all (task 8).
 */
export default function CardDeck({
  deck,
  cards,
  onGraded,
  initialGrades = [],
  exit,
}: {
  readonly deck: DeckName;
  /**
   * T-066 · D-169 — a word card OR a sentence item, on the SAME `<Flashcard>`. The deck keys,
   * removes and scrolls by `deckCardKey` (two stems of one word are two cards); the grade it
   * reports upward still carries the WORD id, which is what both grade routes take.
   */
  readonly cards: readonly DeckCard[];
  /** Rejects ⇒ the grade did NOT reach the server ⇒ the card stays. See `grade` below. */
  readonly onGraded: (wordId: string, grade: CardGrade) => Promise<void>;
  /**
   * T-276 ⓔ — a fixture seam, ⛔ not a product input. The round summary below is state
   * that only grading produces, and `/dev/deck/done` cannot click through a stub grade
   * (the harness would then depend on grading succeeding against nothing). Seeding the
   * finished round is what makes the summary's geometry measurable at 320/375/414 at all.
   * Product screens ⛔ never pass it; the default is the empty round the product starts in.
   */
  readonly initialGrades?: readonly CardGrade[];
  /**
   * T-268 — the written way out of the scrolling deck, rendered as the FIRST row of the
   * deck's own header so it lives inside `h-[calc(100dvh-10rem)]` and is absorbed by the
   * `min-h-0 flex-1` scroller. ⛔ Not a row in the screen above: measured C-0490 at
   * 375×780, T-087's `absolute` icon close sat on this header's notice text (icon
   * x=303..347 · y=60..104 vs notice x=140..355 · y=60..80) — the broken card view Roy
   * reported — and a sibling row outside this component pushes the deck under the fold.
   * Optional so the finish-state fixtures need not carry it; the finish state has its own.
   */
  readonly exit?: {
    readonly href: string;
    readonly labelHe: string;
  };
}) {
  const [graded, setGraded] = useState<readonly string[]>([]);
  // T-276 — the round's own grades, in order. `graded` holds WHICH cards left; this holds
  // WHAT the learner marked on them, and it is the only source the finish state counts.
  const [grades, setGrades] = useState<readonly CardGrade[]>(initialGrades);
  /**
   * ⟦הורחב 15/09 · `C-0619` · `F-258`⟧ המפתחות שהדירוג שלהם **באוויר** — קבוצה, ⛔ ולא
   * מפתח יחיד. 🔬 **נמדד בקוד:** משהחפיסה מתקדמת מיד (אופטימי), שני דירוגים יכולים
   * להיות באוויר בו-זמנית; `pending` יחיד היה נדרס ע"י השני, וה-`finally` של הראשון
   * היה מנקה אותו ⇒ החסימה מפני דירוג כפול **נפתחת בשקט** בדיוק כשיש בה צורך.
   * ⛔ `useRef` ⛔ ולא `useState`: זהו בקרת-מרוץ, ⛔ ולא מצב שמישהו מרנדר, ורינדור על כל
   * שינוי כאן היה מרכיב מחדש את פני הכרטיס באמצע היציאה שלו.
   */
  const inFlight = useRef<Set<string>>(new Set());
  /**
   * 🔴 **⟦NEW 13/09 · `T-333` · `F-242` · המפרט שרוי כתב⟧ הכרטיסים שכבר דורגו ועדיין עפים.**
   *
   * 🔬 **נמדד פריים-אחר-פריים לפני השינוי, ⛔ ולא הוסק:** ההיסט המרבי שכרטיס מדורג הגיע
   * אליו היה **77px** — בדיוק המרחק שהאצבע גררה — על מסך **390px**, ואז 0. ⇒ `release()`
   * ב-`Flashcard` **כן** כותב את יעד היציאה, את משך הקפיץ ואת עקומתו; מה שלא היה לו הוא
   * **זמן**: `await onGraded` נפתר מיד, `setGraded` הסיר את הצומת **באותו טיק**, והמעבר
   * ⛔ לא קיבל ולו פריים אחד. ⇒ **⛔ לא הייתה יציאה, הייתה החלפה.**
   *
   * ⇒ **והפתרון ⛔ אינו «להשהות את ההסרה»** — זו בדיוק ההשהיה שהמפרט אוסר («ללא שום
   * השהיה… ומיד תחתיו מתגלה כרטיס המילה הבא»). הכרטיס המדורג יוצא מ-`remaining` **מיד**,
   * ולכן הבא כבר חי ואינטראקטיבי; מה שנשאר כאן הוא **עותק שממשיך לנוע מעליו**, חסין
   * למגע. ⇒ שני חצאי המשפט של רוי מתקיימים **בו-זמנית**, ⛔ ולא אחד על חשבון השני.
   *
   * ⚠️ **והם אחים באותו הורה בכוונה.** ההיסט של היציאה נכתב **ישירות לצומת** ב-`ref`
   * (‏`T-157`), ולכן צומת שנהרס מאבד אותו. ילדים עם `key` שזזים **בתוך אותו הורה** —
   * React מזיז, ⛔ ואינו מרכיב מחדש ⇒ ההיסט שורד את המעבר מ«נוכחי» ל«יוצא».
   */
  const [exiting, setExiting] = useState<readonly DeckCard[]>([]);
  /** ⛔ תנועה מופחתת ⇒ ⛔ אין יציאה **בכלל**, והכרטיס מוסר מיד — כמו עד היום.
   *  `release()` כבר מכבד את ההעדפה ומשאיר את הכרטיס במקומו; עותק שיושב למעלה שנייה
   *  שלמה בלי לנוע הוא בדיוק הדבר שההעדפה קיימת נגדו. */
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  /**
   * 🔴 **⟦NEW 13/09 · `T-333`⟧ פני הכרטיס נבנים **פעם אחת לכל כרטיס**, ⛔ ולא בכל רינדור.**
   *
   * 🔬 **נמדד, וזו הייתה הסיבה השלישית ש-`F-242` לא נפתר:** `buildCard(...)` ישב **בתוך
   * ה-JSX**, ולכן החזיר **אובייקט חדש בכל רינדור של הדק** — גם כשהכרטיס לא זז. ל-
   * `Flashcard` יש שני מנגנונים שמשווים את ה-prop הזה **בזהות**: `if (shown !== card)`
   * ברינדור ו-`useEffect(…, [card])` שקורא `resetDrag()`. ⇒ שניהם ירו על **כל** רינדור.
   * ⇒ הכרטיס היוצא איבד את ה-`transform` שלו פריים אחרי שקיבל אותו (נמדד: `inline`
   * ריק, `data-release` נעלם, הצומת עצמו **שרד** — כלומר ⛔ לא הרכבה מחדש אלא ניקוי).
   *
   * ⚠️ **וזו ⛔ אינה אופטימיזציה — זו נכונות, והיא רחבה מ-`T-333`:** אותה זהות מתחלפת
   * גם מאפסת את `revealed` בכל רינדור של הדק. עד היום זה היה בלתי-נראה כי הרינדור
   * היחיד אחרי חשיפה היה זה שמסיר את הכרטיס. ⇒ **המפה הזאת מייצבת את שניהם בבת אחת.**
   */
  const buildFace = useCallback(
    (card: DeckCard) =>
      isSentenceCard(card)
        ? buildSentenceCard(card)
        : buildCard(
            {
              headword: card.sense.headword,
              translationHe: card.sense.translation_he,
              examples: card.sense.examples,
              needsHumanReview: card.sense.needs_human_review,
            },
            card.direction,
            { isFirstEncounter: card.is_first_encounter },
          ),
    [],
  );
  const built = useMemo(
    () => new Map(cards.map((card) => [deckCardKey(card), buildFace(card)])),
    [cards, buildFace],
  );

  const remaining = cards.filter((card) => !graded.includes(deckCardKey(card)));
  const exitingKeys = exiting.map((card) => deckCardKey(card));

  /** ⛔ הסרה סופית. נקראת גם מ-`transitionend` וגם מהתקרה — `transitionend` ⛔ אינו מובטח
   *  (הכרטיס עלול להיות מוסתר, או המעבר להיקטע), ותקרה לבדה הייתה משאירה אותו שנייה. */
  const dropExiting = useCallback((key: string) => {
    setExiting((previous) => previous.filter((card) => deckCardKey(card) !== key));
  }, []);

  /**
   * ⏱️ **התקרה, ⛔ ולא המסלול הרגיל.** ‏`transitionend` הוא זה שמסיר כרטיס שסיים לעוף;
   * הטיימר כאן קיים כי הוא ⛔ **אינו מובטח** — לשונית ברקע ⛔ אינה מריצה מעברים, מעבר
   * שנקטע ⛔ אינו יורה, וכרטיס שנשאר תקוע מעל הבא **חוסם את המסך** (הוא `pointer-events:
   * none`, אבל הוא מסתיר). ⇒ `SPRING_MAX_SETTLE_MS` הוא **אותו** מספר שהקפיץ ⛔ לעולם
   * אינו חורג ממנו (`lib/core/spring.ts`), ולכן התקרה ⛔ אינה יכולה לקטוע יציאה אמיתית.
   */
  useEffect(() => {
    if (exiting.length === 0) return;
    const timers = exiting.map((card) => {
      const key = deckCardKey(card);
      return window.setTimeout(() => dropExiting(key), SPRING_MAX_SETTLE_MS + 100);
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [exiting, dropExiting]);

  // ⛔ ⟦REMOVED 13/09 · `T-294`⟧ **`scrollTo`, ה-`useEffect` שגלל, ומפת הצמתים שהחזיקה
  // אותו — ⛔ אינם כאן יותר, ו⛔ זו ⛔ אינה השמטה.** הם קיימו מנגנון אחד: «אחרי דירוג,
  // גלול אל הכרטיס הבא». הדק מרנדר **כרטיס אחד**, ולכן הכרטיס הבא ⛔ אינו במקום אחר
  // שצריך לגלול אליו — הוא במקום היחיד שיש. ⇒ ⛔ אין מה לתזמן ו⛔ אין מה לסנכרן.
  // 📎 והנימוק שהיה שם — «בזמן הלחיצה הכרטיס המדורג עדיין ב-DOM, ולכן הגלילה נוחתת
  // במקום שהוא עוד תופס» — ⛔ אינו אבוד: הוא בדיוק הסיבה שהמבנה הזה ⛔ אינו יכול
  // לשחזר את התקלה ההיא.

  const grade = useCallback(
    async (key: string, wordId: string, value: CardGrade) => {
      // One in flight PER CARD. Without this a double tap sends two grades for one card,
      // and on the `due` deck the second one schedules a word the learner answered once.
      // ⚠️ ⟦הוצר 15/09 · `F-258`⟧ הבדיקה הייתה `pending !== null` — **כל** דירוג, ⛔ לא
      // רק של הכרטיס הזה. ⇒ החלקה על הכרטיס ה**בא** בזמן שהקודם עוד באוויר **נבלעה
      // בשקט**, והלומד ראה מחווה שלא עשתה כלום. עכשיו היא חוסמת בדיוק את מה שנועדה
      // לחסום: דירוג כפול של **אותו** כרטיס.
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);
      // 🔴 **⟦NEW 15/09 · `C-0619` · `F-258` · תלונת רוי⟧ הכרטיס עוזב **מיד**, ⛔ ולא
      // אחרי הרשת.
      //
      // 🔬 **מה שהיה, ⛔ ונמדד בקוד ⛔ ולא שוער:** `await onGraded(...)` ישב **מעל**
      // ‏`setGraded`, ⇒ הכרטיס הבא לא הופיע עד שה-POST חזר. ‏`sendGrade` הוא קריאת
      // רשת אמיתית, ו-TTFB על מסלול קר בייצור נמדד 14/09 ב-**2,338–3,745ms**. ⇒ אחרי
      // כל החלקה מוצלחת הלומד הביט בכרטיס שכבר דירג, לשניות. זה בדיוק «לוקח זמן
      // לכרטיס לאחר מכן להיטען» — ⛔ והכרטיס הבא כלל ⛔ לא נטען, הוא **חיכה**.
      //
      // ⇒ **אופטימי, עם החזרה.** הדירוג יוצא לרשת בזמן שהחפיסה כבר התקדמה; אם הוא
      // נכשל הכרטיס **חוזר בדיוק למקומו** ברשימה, עדיין ניתן לדירוג. ⛔ הבטחת
      // `T-294` ⛔ לא נשברה: «⛔ בלוע = תשובה אבודה» — ⛔ שום כישלון ⛔ אינו נבלע.
      //
      // ⚠️ **ומניין הסיבוב נשאר כן:** `grades` — היחיד שמסך הסיום סופר — מתווסף כאן
      // ונמשך חזרה באותו `catch`. ⇒ סיכום הסיבוב עדיין סופר **רק מה שהגיע לשרת**,
      // וזה בדיוק מה ש-`CardDeck.test.ts` נועל.
      setGraded((previous) => [...previous, key]);
      setGrades((previous) => [...previous, value]);
      // `T-333` — ומיד אחרי ההסרה מהתור, הכרטיס נכנס לרשימת היוצאים כדי שימשיך לנוע
      // מעל הבא. ⛔ תנועה מופחתת ⇒ ⛔ אין יוצא כלל.
      if (!reducedMotion) {
        const leaving = cards.find((card) => deckCardKey(card) === key);
        if (leaving !== undefined) setExiting((previous) => [...previous, leaving]);
      }
      try {
        await onGraded(wordId, value);
      } catch {
        // The grade never reached the server ⇒ the card comes BACK, still gradable —
        // ⛔ a swallowed grade is a lost answer. The message the learner reads belongs to
        // the screen above (task 6), which is the layer that knows whether this was the
        // network or the session.
        setGraded((previous) => previous.filter((entry) => entry !== key));
        setGrades((previous) => {
          const at = previous.lastIndexOf(value);
          return at === -1 ? previous : [...previous.slice(0, at), ...previous.slice(at + 1)];
        });
        setExiting((previous) => previous.filter((card) => deckCardKey(card) !== key));
        return;
      } finally {
        inFlight.current.delete(key);
      }
      // ⟦13/09 · `T-294`⟧ **הדירוג מסיר את הכרטיס, וזה כל מה שצריך כדי להגיע לבא.**
      // ⛔ הבחירה «מי הבא» ⛔ אינה נעשית כאן: `remaining` נגזר מ-`cards` לפי הסדר, ולכן
      // הראשון שנשאר **הוא** הבא. ⟦15/09⟧ וההסרה עלתה מעל ה-`await` — ראה `F-258`.
    },
    [cards, onGraded, reducedMotion],
  );

  if (remaining.length === 0) {
    // T-276 · D-198 — the two (or one, or zero) sentences about the round. The wording and
    // its three fences live in `lib/core/roundSummary.ts`; `deck` decides D-033 there.
    const summary = describeRound(deck, tallyGrades(grades));
    return (
      // The finish state — T-055, § 4.2ו («בסוף המחזור מסך סיום» · «יוצאים — מסך הסיום,
      // ומשם חזרה לבורר» · «המילה האחרונה — מסך סיום ולא מסך לבן»).
      //
      // Two decisions here are quotations, ⛔ not taste:
      //
      // 1. **The deck says which deck it was, using the two strings already in this file.**
      //    The scrolling header carries «מנת היום» or the D-033 practice notice; dropping
      //    both at remaining=0 made the two decks end on one identical screen, and D-033's
      //    promise is required to hold on the screen the learner is looking at. ⛔ No new
      //    sentence is minted: T-055 says «טקסט קיים בלבד», so this reuses the header's own.
      //
      // 2. **One way out, and it goes to the בורר.** § 4.2ו q6 fixes the exit as `/cards`.
      //    ⛔ No streak, no score, no readiness (`לא בתחולה` · T-032). ⚠️ «no count» was
      //    REVISED 07/09 (D-198 · T-276): the round's own grade counts are now a decision,
      //    and they come from `lib/core/roundSummary.ts` — still ⛔ no number that no
      //    decision makes.
      <section className="flex flex-col gap-4" data-card-deck={deck} data-deck-done>
        {/* T-155 — `level` נושא את **אותה** הבטחה של `unknown`, כי הוא כותב את אותן שתי
            עמודות בדיוק (D-032 · D-033). ⛔ לא «מנת היום»: זו חפיסה שלישית.
            ⛔ **שני תנאים ⛔ ולא שלישייה אחת,** וזה ⛔ אינו סגנון: `CardDeck.test.ts` מודד
            **הכלה** — שכל עותק של התווית יושב בתוך שער — ומחלץ שערים לפי סוגריים
            מאוזנים. ענף `else` של שלישייה ⛔ אינו אזור שאפשר לחלץ, ולכן הטענה הייתה
            נמחקת מהבדיקה במקום להיאכף בה. */}
        {deck === 'due' && <p className="text-base text-ink-muted">מנת היום</p>}
        {deck !== 'due' && (
          <p className="text-base text-ink-muted">תרגול — לא משנה את מועד החזרה</p>
        )}
        <h1 className="text-3xl font-bold leading-tight text-ink">סיימת</h1>
        {/* T-276 · D-198 — what moved in the round. Zero grades ⇒ `summary` is empty and the
            screen is exactly what it was (D-198 ⓓ). Body text, ⛔ no glow, ⛔ no number the
            helper did not produce. `text-base` and ⛔ not smaller: § א9 floor, and this is the
            line a learner reads last. */}
        {summary.length > 0 && (
          <div className="flex flex-col gap-1" data-round-summary>
            {summary.map((line) => (
              <p key={line} className="text-base text-ink-muted">
                {line}
              </p>
            ))}
          </div>
        )}
        <Link
          href="/cards"
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          חזרה לכרטיסיות
        </Link>
      </section>
    );
  }

  return (
    // ⛔ NOT `h-dvh`, and ⛔ not `flex-1` either. Both were measured by `/dev/deck` at
    // 320/375/414 the first time this component was ever rendered by the harness (C-0104):
    //
    //   `h-dvh`  ⇒ card 1 occupied y=105..832 of a 780px viewport. The deck does NOT own the
    //             viewport — the root layout puts a header above it and the licence footer
    //             below it — so a 100dvh box starting at y=52 carried the two grade buttons
    //             52px below the fold. Answer buttons off screen are the F-027 dead end.
    //   `flex-1` ⇒ card 1 collapsed to its own content, 215px, and card 2 sat visible right
    //             under it. The root column is `min-h-dvh`, i.e. its height is INDEFINITE, so
    //             nothing in this subtree can stretch and no `h-full` below can resolve.
    //
    // A scroll-snap deck needs a definite height, so it states one: the viewport minus the
    // chrome the root layout renders around it — header 52px (py-4 + a text-sm line) + main's
    // pb-8 32px + footer 76px (pt-2 + a 44px touch target + pb-6) = 160px = 10rem. ⚠️ It is a
    // number about ANOTHER file, which is exactly why `/dev/deck` measures the result at all
    // three widths instead of trusting it: change the chrome and the harness goes red.
    <section
      className="flex h-[calc(100dvh-10rem)] flex-col"
      data-card-deck={deck}
    >
      <header className="flex flex-none flex-col gap-1 border-b border-border-subtle bg-surface py-2 text-sm text-ink-muted">
        {/* T-268 — the written exit is the header's own first row, ⛔ never an overlay: the
            top-start corner it used to float over IS this row. `-ms-2` folds the link's tap
            padding back into the gutter so the label aligns with the notice below it.
            ⛔ No `data-primary-action`: `/study` is a FLOW_ROUTE and `check:mobile` counts
            exactly one per screen (F-027). */}
        {exit !== undefined && (
          <Link
            href={exit.href}
            data-deck-exit
            className="-ms-2 flex min-h-touch min-w-touch items-center self-start rounded-lg px-2 text-base text-ink underline active:opacity-90"
          >
            {exit.labelHe}
          </Link>
        )}
        <div className="flex items-center justify-between gap-3">
          {/* T-155 — התווית הקבועה חלה על **כל** חפיסה שדירוגה עובר ב-`/api/practice`,
              ⛔ ולא על `unknown` בלבד: ההבטחה היא על מה שהכפתורים ⛔ אינם עושים, והיא חייבת
              להיות נכונה על הכרטיס שהלומד מסתכל בו (D-033). */}
          {deck === 'due' && <span>מנת היום</span>}
          {deck !== 'due' && (
            <span data-practice-notice>תרגול — לא משנה את מועד החזרה</span>
          )}
          <span data-remaining={remaining.length}>נותרו {remaining.length}</span>
        </div>
      </header>

      {/* 🔴 **החלון של הכרטיס — ⛔ ולא מכולת גלילה.** ⟦REWRITTEN 13/09 · `T-294` ·
          הכרעת רוי על פריט 111⟧
          ⛔ **הגלילה האנכית ⛔ אינה קיימת יותר, ו⛔ זו ⛔ אינה החמרה של הישן אלא החלפתו.**
          עד היום כל הכרטיסים הנותרים רונדרו זה מתחת לזה ב-`snap-y snap-mandatory
          overflow-y-auto`, והמעבר לכרטיס הבא היה **גלילה** (‏`scrollIntoView`). 🔬 נמדד
          12/09 ב-`/dev/deck`: 2,995px תוכן בחלון 599px.
          ⇒ רוי הכריע במפורש (13/09): «צריך להיות החלקה ימינה ושמאלה בשביל להעיף את
          הכרטיס ולקבל את הכרטיס הבא… הגלילה האנכית הזאת לא צריכה להיות קיימת בכלל».
          ⇒ **הדק מרנדר כרטיס אחד.** הכרטיס הבא מגיע מפני שהקודם **יצא מהרשימה**,
          ⛔ ולא מפני שמשהו נגלל — וזה גם מה שמייתר את `scrollIntoView` ואת מפת הצמתים
          שהחזיקה אותו.
          ⚠️ **`overflow-hidden` כאן חוסם את שני הצירים בכוונה:** האופקי מפני ש-`translateX`
          של יציאה מגיע אל מחוץ למכולה (‏`T-157`ⓕ, ⛔ לא השתנה), והאנכי מפני שזו
          ההכרעה עצמה. ⛔ **ו⛔ אין כאן `preventDefault`** — אין מה למנוע כשאין תוכן
          לגלול אליו. */}
      <div className="relative min-h-0 flex-1 overflow-hidden" data-deck-viewport>
        {/* ⟦`T-333`⟧ **הנוכחי קודם, היוצאים אחריו** — שניהם `absolute inset-0`, ולכן
            היוצא נצבע **מעל** הבא בלי `z-index` ובלי לשנות פריסה באמצע התנועה.
            ⚠️ ושניהם ילדים של **אותו** `<div>`: כרטיס שעובר מ«נוכחי» ל«יוצא» זז בתוך
            אותו הורה ⇒ React מזיז את הצומת ו⛔ אינו מרכיב אותו מחדש, כך שההיסט
            שנכתב לו ב-`ref` שורד. הורה אחר היה הורס אותו, והיציאה הייתה נמחקת. */}
        {[...remaining.slice(0, 1), ...exiting].map((card) => {
          const key = deckCardKey(card);
          const isExiting = exitingKeys.includes(key);
          return (
          <article
            key={key}
            className={`absolute inset-0 flex h-full flex-col pt-4${
              isExiting ? ' pointer-events-none' : ''
            }`}
            {...(isExiting
              ? {
                  'aria-hidden': true as const,
                  'data-card-leaving': '',
                  // 🔴 **שני מסננים, ושניהם נמדדו — ⛔ לא הונחו.**
                  // ⓐ `transform` בלבד: `opacity` רץ באותו מעבר, ושחרורו היה מסיר את
                  //    הכרטיס באמצע הדרך.
                  // ⓑ 🔬 **ומהכרטיס עצמו, ⛔ ולא ממה שבתוכו.** `transitionend` **מבעבע**,
                  //    ונמדד חי: `{"t":261,"type":"end","prop":"transform","on":"BUTTON"}`
                  //    — **כפתור החשיפה** סיים מעבר משלו ב-261ms, האירוע עלה לכאן,
                  //    והכרטיס הוסר באמצע הטיסה (נמדד `left=261` מתוך יעד `510`).
                  //    ⇒ המסנן הוא `[data-flashcard]` על ה-`target`: המעבר שמסיים את
                  //    היציאה הוא של **הכרטיס**, ו⛔ אין שני למנוע.
                  onTransitionEnd: (event: React.TransitionEvent) => {
                    if (event.propertyName !== 'transform') return;
                    if (!(event.target as Element).hasAttribute?.('data-flashcard')) return;
                    dropExiting(key);
                  },
                }
              : {})}
          >
            <Flashcard
              // The key above is on the article, but `Flashcard` holds `revealed` in its own
              // state and resets it when the `card` prop changes identity. `buildCard` runs
              // per render, so identity changes whenever this list does — which is exactly
              // the reset the learner needs and the reason a keyless list handed card n+1
              // over already revealed.
              // T-066 · D-169 — a sentence item is the third `Card` variant, built by its own
              // pure builder; a word card is `buildCard` exactly as before.
              card={built.get(key) ?? buildFace(card)}
              // T-100 — מצב התזמון עובר כמו שהוא. ⛔ הדק ⛔ אינו גוזר ממנו דבר:
              // ההכרעה טהורה ויושבת ב-lib/core/decay.ts. A sentence item has none.
              review={isSentenceCard(card) ? undefined : card.review}
              // T-259 — the PROMISE is handed over, ⛔ not discarded: a grade this deck did not
              // take (network failure ⇒ `grade` returns early) resolves while the card is
              // still mounted, and the card springs back instead of staying off-screen.
              onGrade={(value) =>
                grade(deckCardKey(card), isSentenceCard(card) ? card.wordId : card.word_id, value)
              }
              // `T-333` — הדק הוא היחיד שיודע שהכרטיס עף, ולכן הוא זה שמכבה את
              // החזרה של `T-259`. ⛔ בלי זה היציאה מתבטלת פריים אחרי שהתחילה.
              leaving={isExiting}
            />
          </article>
          );
        })}
      </div>
    </section>
  );
}
