'use client';

import Link from 'next/link';
import ActionBar from '@/components/ActionBar';
import ArenaAvatar, { ITEM_LABELS_HE } from '@/components/ArenaAvatar';
import EnWord from '@/components/EnWord';
import { ARCADE_MISSED_LIMIT } from '@/lib/core/arcadeResult';

/**
 * מסך הסיום של הזירה — T-096 · § 4.2י · D-047 · D-044 · D-050 · D-028.
 *
 * ⛔ **תצוגה בלבד.** הרכיב הזה ⛔ אינו כותב דבר: אין בו `apiPost`, אין בו `fetch`, ואין בו
 * שם של עמודה במנוע החזרות. הכתיבה כולה כבר קרתה ב-`POST /api/arcade/result`, והלוח
 * «המילים שהפילו אותך» הוא **ערך מוחזר לתצוגה** ⛔ ולא שורה שנכתבת (D-047). מסך שגם מציג
 * וגם כותב הוא בדיוק הגבול ש-D-044 אוסר, ובדיקה אחת כאן שומרת עליו.
 *
 * ⛔ **הכפתור «הוסף לרשימת החזרה» אינו בתחולה** — הוא ממתין להכרעת רוי (`03-for-roy` פריט
 * 31, D-047). ⛔ סטייה מוצהרת ולא שכחה.
 *
 * ⛔ **אין ניקוד, אין מטבע ואין לוח תוצאות** (D-050 — נמדד: ניקוד g=0.340 מול בלי ניקוד
 * g=0.840, p=0.013). הפרס היחיד הוא פריט שנפתח, והוא מוצג **על הדמות** ⛔ ולא כמספר מופשט.
 *
 * ⛔ **אין שבח ואין נזיפה** (R-016): שתי הכותרות עובדות — «היריב נוצח» ו«הקרב נגמר» —
 * ואף אחת מהן אינה שיפוט על הלומד. קרב שלא נוצח ⛔ אינו «הפסדת».
 *
 * ⚠️ **`headword` ⛔ אינו מגיע מהשרת.** `POST /api/arcade/result` מחזיר
 * `missed: [{wordId, answer, chosen}]` בלי המילה האנגלית; המסך העוטף מצליב את `wordId` מול
 * השאלות שכבר בידו. זו הסיבה שהטיפוס כאן רחב מהחוזה — ⛔ אל «תתקן» את החוזה.
 */

export interface ArenaMissed {
  readonly wordId: string;
  readonly headword: string;
  readonly answer: string;
  readonly chosen: string;
}

export interface ArenaResultProps {
  readonly enemyDefeated: boolean;
  readonly unlocked: string | null;
  readonly items: readonly string[];
  readonly missed: readonly ArenaMissed[];
  // «עוד קרב» — ⛔ מנקה מצב מקומי ומושך סיבוב חדש. ⛔ אינו ניווט.
  readonly onAgain: () => void;
}

const WON_HE = 'היריב נוצח';
const OVER_HE = 'הקרב נגמר';
const UNLOCKED_HE = 'נפתח לך פריט חדש';
const MISSED_HEADING_HE = 'המילים שהפילו אותך';
const NOTHING_MISSED_HE = 'לא פספסת אף מילה';
const ANSWER_HE = 'התשובה';
const CHOSEN_HE = 'בחרת';
const AGAIN_HE = 'עוד קרב';
const BACK_TO_CARDS_HE = 'חזרה לכרטיסיות';

const PRIMARY_ACTION_CLASS =
  'inline-flex w-full min-h-touch items-center justify-between rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90';

const SECONDARY_ACTION_CLASS =
  'inline-flex w-full min-h-touch items-center justify-between rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90';

const MISSED_ROW_CLASS =
  'flex flex-col gap-1 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3';

function labelOf(item: string | null): string | null {
  if (item === null) return null;
  const labels: Readonly<Record<string, string>> = ITEM_LABELS_HE;
  return labels[item] ?? null;
}

export default function ArenaResult({
  enemyDefeated,
  unlocked,
  items,
  missed,
  onAgain,
}: ArenaResultProps): React.JSX.Element {
  const unlockedLabel = labelOf(unlocked);
  // עד חמש שורות, והמספר מגיע מהקבוע ⛔ ולא כמספר בקוד (`arcadeResult.ts:33`).
  const rows = missed.slice(0, ARCADE_MISSED_LIMIT);

  return (
    // ⛔ אפס `justify-center` ו⛔ אפס `h-screen` (חוקה § 4 · F-011 · F-016). `pb-28` משלם
    // על הרצועה ש-`<ActionBar>` הקבוע מכסה.
    <section className="flex min-h-[100dvh] flex-col gap-6 pb-28">
      <h1 className="text-3xl font-bold leading-tight">{enemyDefeated ? WON_HE : OVER_HE}</h1>

      <div className="flex flex-row items-center gap-4">
        <ArenaAvatar role="hero" items={items} />
        {unlockedLabel !== null && (
          <p className="flex flex-col gap-1 text-lg leading-relaxed text-ink">
            <span>{UNLOCKED_HE}</span>
            <span className="font-semibold">{unlockedLabel}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold leading-tight">{MISSED_HEADING_HE}</h2>
        {missed.length === 0 ? (
          <p className="text-lg leading-relaxed text-ink-muted">{NOTHING_MISSED_HE}</p>
        ) : (
          <ul data-arena-missed className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.wordId} className={MISSED_ROW_CLASS}>
                <EnWord className="text-xl font-bold">{row.headword}</EnWord>
                {/* כל צד נושא תווית עברית — צבע ⛔ לעולם אינו הערוץ היחיד (חוקה § 1). */}
                <span className="text-base text-ink">
                  {ANSWER_HE}: {row.answer}
                </span>
                <span className="text-base text-ink-muted">
                  {CHOSEN_HE}: {row.chosen}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ActionBar>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-arena-again
            data-primary-action="true"
            className={PRIMARY_ACTION_CLASS}
            onClick={onAgain}
          >
            {AGAIN_HE}
          </button>
          <Link data-arena-back href="/cards" className={SECONDARY_ACTION_CLASS}>
            {BACK_TO_CARDS_HE}
          </Link>
        </div>
      </ActionBar>
    </section>
  );
}
