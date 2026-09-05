'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet, apiPost } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { failureExit, isRetryable } from '@/lib/core/failureExit';
import { SCAN_PAGE_SIZE, pageCount, pageOf, type ScanWord } from '@/lib/core/levelScan';
import type { LevelSummary } from '@/lib/core/levelSummary';

/**
 * סריקת רמה — T-082 · D-041 · § 4.2ז.
 *
 * ⛔ **זו הצהרה, ⛔ ולא מבחן.** אין ניקוד, אין שעון, ואין תשובה נכונה: הקשה על תא אומרת
 * «אני יודע», והקשה שנייה מבטלת. לכן אין בקובץ הזה `setTimeout`, אין `Date.now`, ואין
 * ולו מילה אחת של משוב הערכה.
 *
 * ⛔ **הדפדוף בלקוח, ⛔ ולא בשרת.** הנתיב מחזיר את הרשימה כולה פעם אחת; לו היה מחזיר
 * «את ה-12 הבאים» הוא היה מחזיר לנצח את אותן מילים שהלומד **לא** סימן, והלומד לא היה
 * מתקדם. החיתוך עצמו הוא `pageOf` בשכבה הטהורה.
 *
 * ⛔ **מסך הסיום קורא את המספרים ⛔ ואינו סופר אותם.** «סימנת ש-N מילים כבר ידועות לך»
 * הוא `known` מ-`GET /api/levels/summary`, ו«נשארו M» הוא `unseen`. ההגדרה חיה
 * ב-`lib/core/levelSummary.ts` בלבד (§ 4.2ז: «⛔ אין הגדרה שנייה»); מונה מקומי היה
 * מספר שני שסוטה מהראשון ברגע שהלומד סוגר וחוזר.
 *
 * ⛔ עיגון עליון, ⛔ אפס `justify-center` (חוקה § 4 — F-011 שחזר כ-F-016).
 */

const HEADING_HE = 'סריקת רמה';
const LEAD_HE = 'הקש על כל מילה שאתה כבר יודע.';
// ⚠️ סטייה מהתוכנית, ⛔ ולא בחירה: התוכנית כתבה כאן «⛔ ולא בחינה» — סימן שהוא
// נוֹטַציה של סוכנים, ⛔ ולא עברית שלומד קורא. הבדיקה «⛔ אין אמוג׳י (חוקה § 6)»
// תפסה אותו (U+26D4 בטווח 2600–27BF), והנוסח נוקה. ⛔ המשמעות ⛔ לא השתנתה.
const HINT_HE = 'זו הצהרה שלך, ולא בחינה. אפשר לשנות בכל רגע.';
const CONTINUE_HE = 'המשך';
const DONE_HE = 'סיימת את הסריקה';
const CHOOSE_FIRST_HE = 'בחר רמה כדי להתחיל בסריקה';
const CHOOSE_FIRST_ACTION_HE = 'למפת הרמה';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const EXPIRED_HE = 'ההתחברות פגה. היכנס שוב.';
const BACK_HE = 'חזרה למפת הרמה';
const CARDS_HREF = '/cards';

type ScanResponse =
  | { readonly ok: true; readonly level: string; readonly total: number; readonly words: readonly WireWord[] }
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };

type WireWord = { readonly word_id: string; readonly headword: string };

type SummaryResponse =
  | ({ readonly ok: true } & LevelSummary)
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };

type FailCode = 'schema_missing' | 'session_expired' | 'unavailable';

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'choose' }
  | { readonly kind: 'scanning'; readonly words: readonly ScanWord[] }
  | { readonly kind: 'done'; readonly known: number | null; readonly unseen: number | null }
  | { readonly kind: 'failed'; readonly code: FailCode };

function failCode(code: string): FailCode {
  return code === 'schema_missing' || code === 'session_expired' ? code : 'unavailable';
}

/** ⛔ `schema_missing` ו-`session_expired` אינם «כשל טעינה»: שלושה אירועים, שלושה משפטים. */
function failureText(code: FailCode): string {
  if (code === 'schema_missing') return SCHEMA_MISSING_HE;
  if (code === 'session_expired') return EXPIRED_HE;
  return FAILURE_HE.load;
}

/** ⛔ לא `0`. מספר שלא הצלחנו לקרוא אינו אפס — אותו כלל של `<DeckSelector>` ושל `<MeScreen>`. */
const NO_NUMBER_HE = '—';
function number(value: number | null): string {
  return value === null ? NO_NUMBER_HE : String(value);
}

export default function LevelScan({
  initialWords,
}: {
  /** ⛔ קיים אך ורק בשביל הפיקסטורה `/dev/scan`, שאין לה סשן ולכן לעולם לא הייתה
   *  מציירת את הרשת. ⛔ המסך האמיתי לעולם אינו מקבל אותו. */
  readonly initialWords?: readonly ScanWord[];
} = {}): React.JSX.Element {
  const [state, setState] = useState<ScreenState>(
    initialWords ? { kind: 'scanning', words: initialWords } : { kind: 'loading' },
  );
  const [page, setPage] = useState(0);
  const [marked, setMarked] = useState<readonly string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (initialWords) return;
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<ScanResponse>('/api/levels/scan');
      if (!body.ok) {
        setState({ kind: 'failed', code: failCode(body.code) });
        return;
      }
      if (body.level === null) {
        setState({ kind: 'choose' });
        return;
      }
      setPage(0);
      setMarked([]);
      setState({
        kind: 'scanning',
        words: body.words.map((word) => ({ wordId: word.word_id, headword: word.headword })),
      });
    } catch {
      setState({ kind: 'failed', code: 'unavailable' });
    }
  }, [initialWords]);

  useEffect(() => {
    void load();
  }, [load]);

  const finish = useCallback(async () => {
    // ⛔ המספרים נקראים, ⛔ ולא נספרים כאן. כשל בקריאה משאיר «—», ⛔ ולא אפס.
    try {
      const body = await apiGet<SummaryResponse>('/api/levels/summary');
      if (body.ok && body.level !== null) {
        setState({ kind: 'done', known: body.known, unseen: body.unseen });
        return;
      }
    } catch {
      /* נופל ל-«—» מתחת */
    }
    setState({ kind: 'done', known: null, unseen: null });
  }, []);

  const toggle = useCallback((wordId: string) => {
    setMarked((current) =>
      current.includes(wordId) ? current.filter((id) => id !== wordId) : [...current, wordId],
    );
  }, []);

  const advance = useCallback(
    async (words: readonly ScanWord[]) => {
      setSaving(true);
      try {
        // ⛔ בקשה שאינה מסמנת דבר אינה נשלחת: הנתיב דוחה רשימה ריקה ב-400, וזה נכון —
        // «דילגתי על המסך» אינו כתיבה.
        if (marked.length > 0) {
          const body = await apiPost<{ ok: boolean; code?: string }>('/api/levels/scan', {
            word_ids: marked,
          });
          if (!body.ok) {
            setState({ kind: 'failed', code: failCode(body.code ?? 'unavailable') });
            return;
          }
        }
        setMarked([]);
        const next = page + 1;
        if (next >= pageCount(words.length)) await finish();
        else setPage(next);
      } catch {
        setState({ kind: 'failed', code: 'unavailable' });
      } finally {
        setSaving(false);
      }
    },
    [finish, marked, page],
  );

  const words = state.kind === 'scanning' ? state.words : [];
  const current = pageOf(words, page);
  const total = pageCount(words.length);

  return (
    <section className="flex min-h-[100dvh] flex-col gap-6 p-5" data-level-scan>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>
        {state.kind === 'scanning' ? (
          <p className="text-lg text-ink-muted">
            {LEAD_HE} מסך {page + 1} מתוך {total}.
          </p>
        ) : null}
        {state.kind === 'scanning' ? <p className="text-base text-ink-muted">{HINT_HE}</p> : null}
      </header>

      {state.kind === 'choose' ? (
        <div className="flex flex-col gap-3">
          <p className="text-lg">{CHOOSE_FIRST_HE}</p>
          <Link
            href={CARDS_HREF}
            data-primary-action="true"
            className="flex min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {CHOOSE_FIRST_ACTION_HE}
          </Link>
        </div>
      ) : null}

      {state.kind === 'failed' ? (
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
          {/* ⛔ `<a>` ולא `<Link>`: כשהסשן מת הבקשה הבאה חייבת להגיע לשרת ולקבל רשות
              להפנות — הראוטר של הלקוח עלול לענות מהמטמון. */}
          <a
            href={failureExit(state.code).href}
            className="flex min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {failureExit(state.code).labelHe}
          </a>
        </div>
      ) : null}

      {state.kind === 'scanning' ? (
        <>
          {/* שתי עמודות ב-375: תא של 44px לפחות עם מילה אנגלית שלמה ⛔ אינו נכנס
              שלוש בשורה בלי לגלוש. שש שורות × שתיים = 12, בדיוק המספר של D-041. */}
          <ul className="grid list-none grid-cols-2 gap-3 p-0">
            {current.map((word) => {
              const on = marked.includes(word.wordId);
              return (
                <li key={word.wordId}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(word.wordId)}
                    className={[
                      'flex min-h-touch w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-ink active:opacity-90',
                      on ? 'border-2 border-border-strong font-bold' : 'border border-border-subtle',
                    ].join(' ')}
                  >
                    <EnWord className="text-lg">{word.headword}</EnWord>
                    {/* ⛔ צבע אינו הערוץ היחיד (חוקה § 1): המצב נאמר גם במילה,
                        וגם ב-`aria-pressed` לקורא מסך. */}
                    <span className="text-sm text-ink-muted">{on ? 'ידוע' : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => void advance(words)}
            disabled={saving}
            data-primary-action="true"
            className="flex min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {CONTINUE_HE}
          </button>
        </>
      ) : null}

      {state.kind === 'done' ? (
        // ⛔ אין «כל הכבוד» ואין הערכת מוכנות (R-017). שני מספרים ומשפט עובדתי.
        <div className="flex flex-col gap-3">
          <p className="text-2xl font-bold">{DONE_HE}</p>
          <p className="text-lg">
            סימנת ש-{number(state.known)} מילים כבר ידועות לך. נשארו {number(state.unseen)}.
          </p>
          <Link
            href={CARDS_HREF}
            data-primary-action="true"
            className="flex min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {BACK_HE}
          </Link>
        </div>
      ) : null}

      {state.kind === 'loading' ? (
        // חוקה § 5: שלד, ⛔ לא ספינר. שש שורות בגובה הסופי כדי ששום דבר לא יקפוץ.
        <ul aria-busy="true" className="grid list-none grid-cols-2 gap-3 p-0">
          {Array.from({ length: SCAN_PAGE_SIZE }, (_, i) => (
            <li key={i} className="min-h-touch rounded-lg border border-border-subtle" />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
