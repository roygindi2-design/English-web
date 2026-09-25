'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet, apiPatch } from '@/lib/api/client';
import {
  collectedSourceHe,
  encountersHe,
  viewCollection,
  type CollectedWord,
} from '@/lib/core/arcadeCollection';
import { FAILURE_HE, RETRY_HE, SCHEMA_MISSING_HE } from '@/lib/core/failure';
import { SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

/**
 * «המילים שאספתי» — T-110 · § 4.2יב · D-053 · D-052 · D-050.
 *
 * ⛔ **רשימה, ולא מנוע.** רוי: «אין שום קשר לכרטיסיות והרמות שם». ⇒ ⛔ אין כאן
 * «ידעתי/לא ידעתי», ⛔ אין תזמון, ⛔ אין דירוג רמה, ו⛔ אין ולו שדה אחד של הצד הלימודי.
 * ⛔ «חזרה» כאן פירושה לומד שפותח ומדפדף.
 *
 * ⛔ **אין גרף ואין מדד** (§ 4.2יב שאלה 5: «רשימה אינה תצוגת נתונים») ⇒ ⛔ לא `dataviz`.
 * ⛔ ואין מדדי משחק (D-050): ⛔ אין רצף יומי, ⛔ אין מטבע, ⛔ אין לוח תוצאות. המונה
 * היחיד המותר הוא **גודל האוסף**.
 *
 * ⚠️ **שני המצבים הריקים הם שניים, ⛔ ולא אחד.** «עוד לא אספת» הוא הזמנה לשחק;
 * «הסתרת את כולן» הוא מצב שהלומד יצר ושהוא יכול להפוך. `hiddenCount` מהשרת הוא מה
 * שמפריד ביניהם, וההכרעה עצמה יושבת ב-`viewCollection` הטהורה ⛔ ולא בתנאי מקומי כאן.
 *
 * ⚠️ **התאריך ⛔ אינו מפורמט במסך.** הרכיב מרונדר בשני הצדדים, ופירוש תאריך לפי אזור
 * זמן ולוקאל מדפיס שני ערכים שונים ⇒ אי-התאמת הידרציה. ⇒ ⛔ אין כאן תאריך בכלל:
 * «נפגשת N פעמים» הוא מה ש-§ 4.2יב מבקשת, והוא מספר מהשרת.
 *
 * ⚠️ **«הסתר» הוא דגל ⛔ ולא מחיקה (D-053)** — הפעולה הפיכה בשרת, והמסך מסיר את השורה
 * מקומית ⛔ ואינו טוען מחדש: טעינה מחדש הייתה מקפיצה את הרשימה תחת האצבע.
 */

const HEADING_HE = 'המילים שאספתי';
// 🏷️ T-496ⓒ — שני ערוצי קליטה (`T-495`), ⇒ הכותרת ⛔ כבר ⛔ אינה אומרת «בקרבות» בלבד.
const SUBHEADING_HE = 'מילים שעצרו אותך בעולם';
const COLLECTED_COUNT_HE = 'מילים באוסף';
const UNKNOWN_COUNT_HE = '—';
const EMPTY_HE = 'כל מילה שתפיל אותך בקרב, או שתקיש עליה בסיפור, תגיע לכאן.';
const ALL_HIDDEN_HE = 'הסתרת את כל המילים באוסף.';
const PLAY_HE = 'לזירה';
const HIDE_HE = 'הסתר';
const LOADING_HE = 'טוען את המילים שלך…';
const ARCADE_HREF = '/arcade';

/** בדיוק מה ש-`GET /api/arcade/collected` עונה (`docs/api-contract.md`), ⛔ ולא יותר. */
type CollectedBody =
  | { readonly ok: true; readonly words: readonly CollectedWord[]; readonly hiddenCount: number }
  | { readonly ok: false; readonly code: string };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly words: readonly CollectedWord[]; readonly hiddenCount: number }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90';
const RETRY_CLASS =
  'inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90';
const HIDE_CLASS =
  'inline-flex min-h-touch shrink-0 items-center rounded-lg border border-border-strong px-4 text-base text-ink-muted active:opacity-90';

export default function CollectedWords(): React.JSX.Element {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<CollectedBody>('/api/arcade/collected');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else setState({ kind: 'error' });
        return;
      }
      setState({ kind: 'ready', words: body.words, hiddenCount: body.hiddenCount });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hide = useCallback((wordId: string) => {
    // ⛔ הסרה מקומית קודם, ובלי לטעון מחדש — הפעולה הפיכה, וכשלון רשת ⛔ אינו מוחק
    // דבר בשרת. הספירה המוסתרת עולה יחד איתה, אחרת «הסתרת את כולן» לא תיכנס לעולם.
    setState((prev) =>
      prev.kind === 'ready'
        ? { ...prev, words: prev.words.filter((w) => w.wordId !== wordId), hiddenCount: prev.hiddenCount + 1 }
        : prev,
    );
    void apiPatch('/api/arcade/collected', { wordId, hidden: true }).catch(() => {
      // ⛔ אין כאן מסך שגיאה: הלומד ביקש להסתיר, והמילה נעלמה מהמסך שלו. טעינה הבאה
      // תחזיר אותה אם השרת לא קיבל — וזה ⛔ אינו נזק, כי «הסתרה» ⛔ אינה מחיקה.
    });
  }, []);

  const view = state.kind === 'ready'
    ? viewCollection({ visible: state.words, hiddenCount: state.hiddenCount })
    : null;
  const total = state.kind === 'ready' ? state.words.length + state.hiddenCount : null;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>
        <p className="text-lg text-ink-muted">{SUBHEADING_HE}</p>
      </div>

      {/* המונה נושא תווית עברית משלו — גודל וצבע לעולם אינם הערוץ היחיד (חוקה § 1),
          והוא נשאר על המסך בכל מצב כדי שהפריסה לא תקפוץ כשהתשובה נוחתת. */}
      <div className="flex flex-col gap-1">
        <p className="text-4xl font-bold leading-none">
          {total === null ? UNKNOWN_COUNT_HE : total}
        </p>
        <p className="text-lg text-ink-muted">{COLLECTED_COUNT_HE}</p>
      </div>

      {state.kind === 'loading' && (
        // שלד **בצורת הרשימה** ⛔ ולא ספינר (חוקה § 5). `aria-hidden` על המלבנים
        // והמשפט באזור חי — קורא מסך שומע «טוען», ⛔ לא שלושה מלבנים ריקים.
        <div data-skeleton className="flex flex-col gap-3">
          <p className="sr-only" role="status">
            {LOADING_HE}
          </p>
          <div aria-hidden className="h-16 animate-pulse rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-16 animate-pulse rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-16 w-2/3 animate-pulse rounded-lg bg-surface-raised" />
        </div>
      )}

      {view?.kind === 'list' && (
        <ul className="flex flex-col gap-3">
          {view.words.map((word) => (
            <li
              key={word.wordId}
              className="flex items-start gap-3 rounded-lg bg-surface-raised px-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-lg font-semibold leading-relaxed text-ink">
                  <EnWord>{word.headword}</EnWord>
                </p>
                <p className="text-lg leading-relaxed text-ink">{word.translationHe}</p>
                {/* 🏷️ T-496ⓑ — השבב אומר **במילה** מאיפה המילה הגיעה; ⛔ צבע ⛔ אינו הערוץ.
                    ⚠️ ומילה מסיפור נושאת `times_missed = 0` (‏`T-495` ⛔ אינו מקדם מונים) ⇒
                    «נפגשת 0 פעמים» היה משפט שבור ⇒ השורה מופיעה ⛔ רק כשיש מה לספור. */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    data-collected-source={word.source}
                    className="inline-flex items-center rounded-full border border-border-strong px-2.5 py-0.5 text-sm text-ink-muted"
                  >
                    {collectedSourceHe(word.source)}
                  </span>
                  {word.timesMissed > 0 ? (
                    <span className="text-base text-ink-muted">{encountersHe(word.timesMissed)}</span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => hide(word.wordId)}
                className={`${HIDE_CLASS} ms-auto`}
                aria-label={`${HIDE_HE} ${word.headword}`}
              >
                {HIDE_HE}
              </button>
            </li>
          ))}
        </ul>
      )}

      {view?.kind === 'empty' && (
        // ⛔ לא מסך לבן ו⛔ לא «בקרוב»: הדרך היחידה שמילה מגיעה לאוסף היא קרב,
        // ולכן המצב הזה מוביל בדיוק לשם (D-046).
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{EMPTY_HE}</p>
          <Link href={ARCADE_HREF} data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
            {PLAY_HE}
          </Link>
        </div>
      )}

      {view?.kind === 'all_hidden' && (
        // ⛔ משפט **אחר** מ«עוד לא אספת»: לומד שהסתיר את הכל אסף מילים, ומשפט הריקנות
        // היה אומר לו שהאוסף שלו לא היה קיים מעולם.
        <p className="text-lg leading-relaxed text-ink">{ALL_HIDDEN_HE}</p>
      )}

      {state.kind === 'schema_missing' && (
        <p className="text-lg leading-relaxed text-ink">{SCHEMA_MISSING_HE}</p>
      )}

      {state.kind === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>
          <button type="button" onClick={() => void load()} className={RETRY_CLASS}>
            {RETRY_HE}
          </button>
        </div>
      )}

      {state.kind === 'session_expired' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>
          {/* `<a>` ⛔ ולא `<Link>`: הסשן איננו, ולכן הבקשה הבאה חייבת להגיע לשרת. */}
          <a href="/login" className={PRIMARY_ACTION_CLASS}>
            {SIGN_IN_AGAIN_HE}
          </a>
        </div>
      )}
    </section>
  );
}
