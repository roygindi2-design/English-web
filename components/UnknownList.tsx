'use client';

import Link from 'next/link';
import EnWord from '@/components/EnWord';

/**
 * שורה 5 של § 4.2ז — «רשימה מסודרת של המילים שסימן כלא ידע, כדי שיוכל לחזור עליהן»
 * (`02-inbox` פריט 8, בלשונו של רוי). T-083.
 *
 * ⛔ **רשימה, ⛔ ולא מונה.** ‏`<DeckSelector>` כבר מציג את המספר כאריח; אריח שני עם
 * אותו מספר אינו רשימה, וזה בדיוק מה שהמשימה נכתבה נגדו.
 *
 * ⛔ **אין כאן נתיב חדש, וזו מדידה ⛔ ולא חיסכון:** `GET /api/study/queue?deck=unknown`
 * כבר מחזיר את החפיסה במיון `cefr_profile_band` עולה ואז `next_review_at` — בדיוק
 * המיון ש-D-034 מכתיב — ואת `total` לפני החיתוך ל-`limit`. נתיב שני היה **הגדרה שנייה**
 * לאותה חפיסה, וזה מה ש-§ 4.2ז אוסר במפורש.
 *
 * ### `T-385` — ⛔ **והרכיב ⛔ אינו קורא עוד. המסך קורא, פעם אחת.**
 *
 * 🔬 **נמדד `C-0647` ברשת חיה על `/dev/tabs/cards`, ⛔ ולא שוער:** טעינת המסך ירתה
 * **ארבע** בקשות לאותו endpoint, ו-`deck=unknown` הופיע ב**שתיים** מהן —
 * `?limit=1` מ-`<DeckSelector>` ו-`?limit=50` מכאן. ⇒ שני הרכיבים החזיקו כל אחד
 * `failed` משלו על **אותו אירוע**, ⛔ ולכן זו ⛔ לא הייתה בקשה מיותרת בלבד אלא
 * **סתירה נראית**: אריח «חזרה» יכול לומר «הנתונים לא נטענו» בעוד הרשימה שמתחתיו
 * מציגה מילים אמיתיות, או ההפך.
 *
 * ⇒ **אותה תבנית בדיוק ש-`T-210` כבר קבעה עבור `unseen`: «המספר שייך למסך, ⛔ לא
 * לבלוק».** הקריאה היחידה חיה ב-`<LevelMapScreen>`, ה-`total` שלה מזין גם את
 * הרשימה הזאת וגם את אריח «חזרה», ⇒ **פסק דין אחד על `unknown`, ⛔ ולא שניים.**
 * הרכיב הזה נעשה **תצוגה בלבד** — ⛔ אפס `useEffect`, ⛔ אפס `apiGet`, ⛔ אפס `failed`
 * משלו.
 *
 * ⛔ **אין הסרה ידנית.** יציאה מהרשימה היא דרך המנוע בלבד — תשובה נכונה מאפסת את
 * החברות בחפיסה (`repetition >= 1`). כפתור הסרה היה מקור אמת שני על אותה מילה.
 *
 * ⛔ הרכיב הזה ⛔ אינו נושא `<h1>` — המסך מחזיק אחד («הרמה שלך») ומוסר לכאן `<h2>`.
 */

const HEADING_HE = 'לא ידעתי';
const ACTION_HE = 'תרגל את הרשימה';
const ACTION_HREF = '/study?deck=unknown';
const EMPTY_HE = 'הרשימה ריקה. כל מילה שתיפול בכרטיסייה תגיע לכאן.';
/** ⛔ לא `0`. מספר שלא הצלחנו לקרוא אינו אפס — אותו כלל של `<DeckSelector>`. */
const NO_NUMBER_HE = '—';

export type UnknownCard = {
  readonly word_id: string;
  readonly sense: { readonly headword: string; readonly translation_he: string };
};

/**
 * `T-385` — **המצב שהמסך מחזיק ומוסר לשני הצרכנים שלו.** ‏`failed` ו-`loading` נוסעים
 * יחד עם המספרים ⛔ ולא נגזרים מהם: `total === null` בזמן טעינה ⛔ אינו כשל, וזו בדיוק
 * ההבחנה ש-`T-295` כבר עשתה בתוך `<DeckSelector>` (‏D-064 — «אין מה לתרגל» חצי שנייה
 * מוקדם מדי הוא שקר קצר).
 */
export type UnknownDeck = {
  readonly cards: readonly UnknownCard[];
  readonly total: number | null;
  readonly failed: boolean;
  readonly loading: boolean;
};

export const EMPTY_UNKNOWN_DECK: UnknownDeck = Object.freeze({
  cards: [],
  total: null,
  failed: false,
  loading: true,
});

export default function UnknownList({
  deck,
}: {
  readonly deck: UnknownDeck;
}): React.JSX.Element {
  const { cards, total, failed, loading } = deck;
  const empty = !loading && !failed && cards.length === 0;
  const truncated = total !== null && total > cards.length;

  return (
    <section className="flex flex-col gap-3" data-unknown-list>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{HEADING_HE}</h2>
        <span className="text-lg text-ink-muted">{total === null ? NO_NUMBER_HE : String(total)}</span>
      </div>

      {/* הפעולה בראש הרשימה, לפני הפריטים: רוי ביקש «כדי שיוכל לחזור עליהן», והחזרה
          היא הדבר שהרשימה קיימת בשבילו. מושבתת עם המספר כשאין מה לתרגל (§ 4.2ו),
          ⛔ ולא מוסתרת. */}
      {cards.length > 0 ? (
        <Link
          href={ACTION_HREF}
          className="flex min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          {ACTION_HE}
        </Link>
      ) : (
        <button
          type="button"
          aria-disabled="true"
          className="flex w-full min-h-touch items-center rounded-lg border border-border-subtle px-5 py-3 text-ink-muted"
        >
          {ACTION_HE}
        </button>
      )}

      {/* `T-384`ⓐ — ⛔ **`FAILURE_HE.load` was DELETED from here, and that is the row.**
          🔬 `C-0647` counted **five** visible failure strings in **three** wordings for one
          event on this screen, and this line was the fifth. The event is narrated ⛔ once,
          in `<DeckSelector>`'s recovery block ABOVE this list — which is also the only
          place carrying a way out of it (`T-349`). ⛔ A second sentence down here could
          only tell the learner they had met a second problem.
          ⛔ **`failed` itself is ⛔ not dropped:** it still keeps `empty` from claiming
          «הרשימה ריקה» off a read that never arrived, which is `T-295`'s own rule. */}
      {empty ? <p className="text-base text-ink-muted">{EMPTY_HE}</p> : null}

      <ul aria-busy={loading} className="flex list-none flex-col gap-2 p-0">
        {cards.map((card) => (
          <li
            key={card.word_id}
            className="flex items-baseline justify-between gap-3 rounded-md border border-border-subtle px-4 py-2"
          >
            <EnWord className="text-lg font-semibold">{card.sense.headword}</EnWord>
            <span className="text-base text-ink-muted">{card.sense.translation_he}</span>
          </li>
        ))}
      </ul>

      {truncated ? (
        // ⛔ רשימה חתוכה אינה מתחזה לשלמה. הסך כבר מוצג למעלה, וזו השורה שאומרת
        // מפורשות שהיא נחתכה — בלעדיה 50 מתוך 90 נראים כמו כל הרשימה.
        <p className="text-sm text-ink-muted">
          מוצגות {cards.length} מתוך {total}.
        </p>
      ) : null}
    </section>
  );
}
