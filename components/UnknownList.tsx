'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { MAX_QUEUE_LIMIT } from '@/lib/core/deck';
import { FAILURE_HE } from '@/lib/core/failure';

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

type Card = {
  readonly word_id: string;
  readonly sense: { readonly headword: string; readonly translation_he: string };
};

type QueueResponse =
  | { readonly ok: true; readonly total: number; readonly cards: readonly Card[] }
  | { readonly ok: false; readonly code: string };

const QUERY = `/api/study/queue?deck=unknown&limit=${MAX_QUEUE_LIMIT}`;

export default function UnknownList(): React.JSX.Element {
  const [cards, setCards] = useState<readonly Card[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<QueueResponse>(QUERY);
        if (cancelled) return;
        if (!body.ok) {
          setFailed(true);
        } else {
          // ⛔ אין מיון כאן: הסדר הוא של `sortQueue` ב-`lib/core/deck.ts`, ומיון שני
          // בלקוח היה הגדרה שנייה שסוטה ברגע שהראשונה משתנה.
          setCards(body.cards);
          setTotal(body.total);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          className="flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
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

      {failed ? <p className="text-base text-ink-muted">{FAILURE_HE.load}</p> : null}
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
