'use client';

import { useCallback, useEffect, useState } from 'react';
import ArcadeEntry from '@/components/ArcadeEntry';
import DeckSelector from '@/components/DeckSelector';
import EnWord from '@/components/EnWord';
import LevelPath from '@/components/LevelPath';
import UnknownList from '@/components/UnknownList';
import { apiGet, apiPost } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { failureExit, isRetryable } from '@/lib/core/failureExit';
import { BAND_ORDER, type CefrBand } from '@/lib/core/cefrLevels';
import { LEVEL_LABELS_HE, type LevelSummary } from '@/lib/core/levelSummary';

/**
 * לשונית «כרטיסיות» כמפת הרמה — T-081 · § 4.2ז.
 *
 * חמש השורות הראשונות של המפרט, בסדרן: כותרת רמה · המספר · שלוש הספירות · דרכים
 * לתרגל · רשימת «לא ידעתי» (T-083). שורה 6 (מפת שש הרמות, T-084) היא משימה נפרדת
 * ו⛔ אינה ממומשת כאן.
 *
 * ⛔ שלושת כרטיסי החפיסה של § 4.2ו לא נמחקו — הם `<DeckSelector>`, אותו קוד בדיוק,
 * שירד לבלוק «דרכים לתרגל» ואיבד רק את הכותרת שלו.
 *
 * ⛔ עיגון עליון, ⛔ אפס `justify-center` (חוקה § 4 — זה F-011 שחזר כ-F-016).
 */

const HEADING_HE = 'הרמה שלך';
const CHOOSE_HE = 'בחר רמה להתחיל';
const CHOOSE_HINT_HE = 'אפשר להחליף רמה בכל רגע.';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const EXPIRED_HE = 'ההתחברות פגה. היכנס שוב.';
const PRACTICE_HE = 'דרכים לתרגל';
/** ⛔ לא `0`. מספר שאין לנו אינו מספר אפס — אותו כלל של `<DeckSelector>` ושל `<MeScreen>`. */
const NO_NUMBER_HE = '—';

type SummaryResponse =
  | ({ readonly ok: true; readonly levels?: readonly LevelSummary[] } & LevelSummary)
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'choose' }
  | { readonly kind: 'ready'; readonly summary: LevelSummary; readonly levels: readonly LevelSummary[] }
  | { readonly kind: 'failed'; readonly code: 'schema_missing' | 'session_expired' | 'unavailable' };

/**
 * ⚠️ **סטייה מנוסח התוכנית, והבדיקה היא שכפתה אותה** (`lib/core/failure.test.ts`, T-056).
 * התוכנית מכתיבה כאן שני קבועים מקומיים — `RETRY_HE` ו-`FAILED_HE` — ו-T-056 קובעת
 * שנוסח הכשל חי במקום **אחד**: `lib/core/failure.ts`. הכפלתו כאן הייתה הנוסח החמישי
 * לאותו אירוע בדיוק, וזה מה שהמשימה ההיא נכתבה כדי למנוע. ⇒ שניהם מיובאים.
 * ⛔ `schema_missing` ו-`session_expired` **אינם** «כשל טעינה»: הראשון הוא תקלת הקמה
 * שרוי חייב לפתור (0013), והשני שולח להתחברות. שני משפטים לשני אירועים שונים.
 */
function failureText(code: string): string {
  if (code === 'schema_missing') return SCHEMA_MISSING_HE;
  if (code === 'session_expired') return EXPIRED_HE;
  return FAILURE_HE.load;
}

export default function LevelMapScreen(): React.JSX.Element {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<SummaryResponse>('/api/levels/summary');
      if (!body.ok) {
        const code = body.code === 'schema_missing' || body.code === 'session_expired' ? body.code : 'unavailable';
        setState({ kind: 'failed', code });
        return;
      }
      // ⛔ אין נפילה שקטה ל-A1: `level: null` הוא תשובה, ⛔ לא חוסר.
      if (body.level === null) {
        setState({ kind: 'choose' });
        return;
      }
      // ⛔ `?? []` ⛔ ואינו קריסה: שרת ישן (לפני T-102) אינו נושא את השדה, ומסלול
      // שנופל על `undefined.map` היה הופך תוספת תואמת-אחורה לשבירה.
      setState({ kind: 'ready', summary: body, levels: body.levels ?? [] });
    } catch {
      setState({ kind: 'failed', code: 'unavailable' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const choose = useCallback(
    async (level: CefrBand) => {
      setSaving(true);
      try {
        const body = await apiPost<{ ok: boolean }>('/api/levels/current', { level });
        if (body.ok) await load();
        else setState({ kind: 'failed', code: 'unavailable' });
      } catch {
        setState({ kind: 'failed', code: 'unavailable' });
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  const summary = state.kind === 'ready' ? state.summary : null;
  const number = (value: number | undefined): string => (value === undefined ? NO_NUMBER_HE : String(value));

  return (
    <section className="flex flex-col gap-6" data-level-map>
      {/* שורה 1 — הרמה לעולם אינה רק אות: תווית עברית לצידה (חוקה § 1). */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">
          {HEADING_HE}
          {summary ? (
            <>
              {' · '}
              <EnWord>{summary.level}</EnWord>
            </>
          ) : null}
        </h1>
        {summary ? <p className="text-lg text-ink-muted">{LEVEL_LABELS_HE[summary.level]}</p> : null}
      </header>

      {state.kind === 'choose' ? (
        // מצב בחירה — פעולה אחת, ⛔ ולא ברירת מחדל שקטה. כל שש הרמות פתוחות תמיד:
        // אין סף שליטה אמפירי, ולכן ⛔ אין נעילה ואין «עדיין לא» (D-037 · R-017).
        <div className="flex flex-col gap-3">
          <p className="text-xl font-semibold">{CHOOSE_HE}</p>
          <p className="text-base text-ink-muted">{CHOOSE_HINT_HE}</p>
          <ul className="grid list-none grid-cols-3 gap-3 p-0">
            {BAND_ORDER.map((band) => (
              <li key={band}>
                <button
                  type="button"
                  onClick={() => void choose(band)}
                  disabled={saving}
                  className="flex min-h-touch w-full flex-col items-center gap-1 rounded-lg border border-border-strong px-3 py-3 text-ink active:opacity-90"
                >
                  <EnWord className="text-lg font-semibold">{band}</EnWord>
                  <span className="text-sm text-ink-muted">{LEVEL_LABELS_HE[band]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.kind === 'failed' ? (
        // T-124 · D-065: כל ענף כשל נושא יציאה. קודם לכן `schema_missing`
        // הופיע בלי שום כפתור ו-`session_expired` בלי קישור ל-/login.
        <div className="flex flex-col gap-3">
          <p className="text-lg">{failureText(state.code)}</p>
          {isRetryable(state.code) ? (
            <button
              type="button"
              onClick={() => void load()}
              className="flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-ink active:opacity-90"
            >
              {RETRY_HE}
            </button>
          ) : null}
          {/* ⛔ `<a>` ולא `<Link>`: כשהסשן מת הבקשה הבאה חייבת להגיע לשרת
              ולקבל רשות להפנות — הראוטר של הלקוח עלול לענות מהמטמון. */}
          {/* ⚠️ ⛔ בלי `justify-center`, וזו ⛔ אינה קפידה: `LevelMapScreen.test.ts`
              אוסר את המחרוזת בקובץ הזה כולו (F-011 · F-016), ושאר הכפתורים כאן
              מסתפקים ב-`items-center`. החלשת השומר כדי להתאים לקטע מהתוכנית
              הייתה מוחקת בדיקה שנמדדה. */}
          <a
            href={failureExit(state.code).href}
            className="flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {failureExit(state.code).labelHe}
          </a>
        </div>
      ) : null}

      {state.kind === 'loading' || state.kind === 'ready' ? (
        // ⚠️ השורות כבר בגודלן הסופי בזמן הטעינה, ולכן שום דבר לא קופץ כשהמספרים נוחתים.
        // `aria-busy` ו⛔ לא ספינר (חוקה § 5).
        <div aria-busy={state.kind === 'loading'} className="flex flex-col gap-4">
          {/* שורה 2 — המספר היחיד במוצר שיורד, והאלמנט הגדול במסך (D-028). */}
          <p className="flex flex-col gap-1">
            <span className="text-5xl font-bold leading-none">{number(summary?.unseen)}</span>
            <span className="text-lg text-ink-muted">נשארו לך מילים ברמה הזאת</span>
          </p>

          {/* שורה 3 — שלוש קבוצות זרות שסכומן הוא הסך. */}
          <ul className="flex list-none flex-col gap-2 p-0">
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-semibold">{number(summary?.totalInLevel)}</span>
              <span className="text-base text-ink-muted">ברמה</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-semibold">{number(summary?.known)}</span>
              <span className="text-base text-ink-muted">סימנת שידעת</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-semibold">{number(summary?.inReviewList)}</span>
              <span className="text-base text-ink-muted">ברשימת החזרה</span>
            </li>
          </ul>
        </div>
      ) : null}

      {/* שורה 4 — **שתי** דרכים לתרגל (§ 4.2ז): שלושת כרטיסי החפיסה, ומתחתיהם
          «משחק» — הכניסה לזירה (T-097). ⚠️ סטייה מוצהרת: אין כותרת-משנה «כרטיסיות»
          מעל `<DeckSelector>`, כי הוספתה היא שינוי מבנה בקוד ש-T-080/T-081 יושבות
          בתור הסקירה שלו. תוספת בלבד — נרשם ב-`plan/30-architecture.md` § 3.1.45. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{PRACTICE_HE}</h2>
        <DeckSelector />
        <ArcadeEntry />
      </section>

      {/* שורה 5 — «לא ידעתי» (T-083 · § 4.2ז). ⛔ רשימה ולא מונה: `<DeckSelector>`
          למעלה כבר מציג את המספר כאריח. מוצגת רק כשיש רמה — בלי רמה המסך הוא מצב
          בחירה, ורשימה מתחת לשש הרמות הייתה תשובה לשאלה שהלומד עוד לא שאל. */}
      {state.kind === 'ready' ? <UnknownList /> : null}

      {/* שורה 6 — מפת שש הרמות (T-084 · § 4.2ז). כולן ניתנות להקשה ומחליפות את
          `profiles.current_level` דרך **אותו** `choose` שמצב הבחירה משתמש בו —
          ⛔ ולא כותב שני לאותה עמודה. */}
      {state.kind === 'ready' ? (
        <LevelPath
          levels={state.levels}
          current={state.summary.level}
          onChoose={(band) => void choose(band)}
          busy={saving}
        />
      ) : null}
    </section>
  );
}
