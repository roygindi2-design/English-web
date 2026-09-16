'use client';

import { useCallback, useEffect, useState } from 'react';
import DeckSelector from '@/components/DeckSelector';
import EnWord from '@/components/EnWord';
import FilterBar from '@/components/FilterBar';
import LevelCard from '@/components/LevelCard';
import UnknownList, {
  EMPTY_UNKNOWN_DECK,
  type UnknownCard,
  type UnknownDeck,
} from '@/components/UnknownList';
import { apiGet, apiPost } from '@/lib/api/client';
import { MAX_QUEUE_LIMIT } from '@/lib/core/deck';
import { FAILURE_HE, RETRY_HE, SCHEMA_MISSING_HE, SESSION_EXPIRED_HE } from '@/lib/core/failure';
import { failureExit, isRetryable } from '@/lib/core/failureExit';
import { BAND_ORDER, type CefrBand } from '@/lib/core/cefrLevels';
import { LEVEL_LABELS_HE, type LevelSummary } from '@/lib/core/levelSummary';

/**
 * לשונית «כרטיסיות» — **מסך הבית של `36 § 5`** (T-210 · T-211ⓐ · T-156 · D-123 · D-124).
 *
 * 🎯 **הרנדר: `docs/design/kol-A-02-deck.png`**, והערכים נלקחו מ-`docs/design/render_video_A.py`
 * ‏(`screen_deck`, שורות 254–305) ⛔ ולא מהעין. חמש השורות של § 5, בסדרן:
 * ‏**כרטיס רמה קריאה-בלבד** · **פס מקוטע** · **שלושה מונים** · **חפיסות** · **ההערה הקבועה**.
 *
 * ⛔ **מה שירד מכאן ב-C-0318, ולמה:**
 *
 * ⓐ `<LevelPath>` — **בורר הרמות**. `36 § 5` פותח ב«**אין מעבר רמות כאן**», והמסך נשא
 *   **שני** בוררים (ענף `choose` ו-`<LevelPath>`). ⇒ D-123. הבורר עבר ל`הגדרות` (T-211),
 *   ⛔ **והרכיב עצמו ⛔ לא נמחק ו⛔ לא נערך** — זהו שינוי **הורה**.
 *
 * ⓑ `<ArcadeEntry>` — **הכניסה לזירה** (T-156 · D-090ⓐ · D-052). D-052 ניתקה את הזירה
 *   מהצד הלימודי **בשני הכיוונים**, ואריח בתוך מפת הרמה סתר את הניתוק במו הניווט.
 *   הזירה נשארת אריח ב-`AppGrid` של `העולם`, ⛔ ו-`/arcade` עצמו ⛔ לא זז.
 *
 * ⛔ **ענף `choose` נשאר** (D-123ג׳ⓒ): לומד בלי רמה חייב פעולה אחת, ובלעדיה המסך שלו ריק.
 *
 * ⛔ **⛔ אפס שאילתה חדשה** (T-210ⓖ): `GET /api/levels/summary` כבר מחזיר
 * `totalInLevel`·`known`·`inReviewList`·`unseen`, ו-`(known+inReviewList)/totalInLevel`
 * הוא בדיוק `86 / 400 סוננו` שברנדר.
 *
 * ⛔ עיגון עליון, ⛔ אפס `justify-center` (חוקה § 4 — זה F-011 שחזר כ-F-016).
 *
 * ### הפרופ `fixtureSummary` — פיקסטורה של הארנס, ⛔ ולא מצב מוצר (T-210ⓗ)
 *
 * בלעדיו `/dev/tabs/cards` יכול למדוד אך ורק את **ענף הכשל**: לארנס אין env של Supabase,
 * ולכן `GET /api/levels/summary` עונה 503 בחוזה שלו עצמו ⇒ הפס ושלושת המונים ⛔ אינם
 * מגיעים ל-DOM בכלל, וגובה יעד המגע, הגלישה האופקית והניגודיות שלהם ⛔ אינם נמדדים ולו
 * פעם אחת.
 *
 * ⛔ **הוא ⛔ אינו ברירת מחדל ו⛔ אינו נפילה אחורה:** כשהוא נמסר, הרשת ⛔ אינה נקראת כלל —
 * פיקסטורה שקריאת רשת יכולה לדרוס אותה היא פיקסטורה שנמדדת רק לפעמים. ⛔ אף מסך מוצר
 * ⛔ אינו מעביר אותו: `app/(tabs)/cards/page.tsx` מרנדר `<LevelMapScreen />` כלשונו.
 */

const HEADING_HE = 'כרטיסיות';
/**
 * ⛔ **ההערה הקבועה של `36 § 5`, והיא נושאת את האינווריאנט:** «אין דרך לסמן ידעתי/לא
 * ידעתי מחוץ לכרטיסייה». המסך מציג מצב ופותח חפיסות — הוא ⛔ אינו עורך מצב.
 */
const INVARIANT_NOTE_HE = 'הסימון של מילים מתבצע בכרטיסיות בלבד';
const CHOOSE_HE = 'בחר רמה להתחיל';
const CHOOSE_HINT_HE = 'אפשר להחליף רמה בכל רגע.';
const PRACTICE_HE = 'דרכים לתרגל';

type SummaryResponse =
  | ({ readonly ok: true; readonly levels?: readonly LevelSummary[] } & LevelSummary)
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };

/**
 * `T-385` — **הקריאה היחידה לחפיסת `unknown` במסך הזה, ⛔ ואין שנייה.**
 *
 * 🔬 **נמדד `C-0647` ברשת חיה (‏`next start`, 375×780):** המסך ירה **ארבע** בקשות
 * ל-`/api/study/queue`, ו-`deck=unknown` הופיע ב**שתיים** — `limit=1` מ-`<DeckSelector>`
 * ו-`limit=50` מ-`<UnknownList>`. ⇒ שני `failed` נפרדים על אירוע אחד, ⇒ מצב שבו האריח
 * והרשימה אומרים דברים סותרים על אותה חפיסה.
 *
 * ⛔ **וזו ⛔ אינה קריאה שנוספה — זו קריאה שנמחקה** (`T-385`ⓑ): החוזה של
 * `app/api/study/queue` ⛔ לא זז, ⛔ אין פרמטר חדש ו⛔ אין נתיב חדש. ‏`limit=50`
 * היא הקריאה ששרדה מפני שהיא זו שמחזירה גם את הכרטיסים וגם את `total` שלפני
 * החיתוך (`docs/api-contract.md`), ⇒ היא לבדה מספיקה לשני הצרכנים.
 *
 * ⛔ **ו⛔ אין לאחד את `due` ו-`sentences` לתוכה** (`T-385`ⓒ): הן חפיסות אחרות,
 * ה-`Promise.all` עליהן ב-`<DeckSelector>` כבר מקבילי, ואיחודן היה **שינוי חוזה**.
 */
const UNKNOWN_QUERY = `/api/study/queue?deck=unknown&limit=${MAX_QUEUE_LIMIT}`;

type UnknownQueueResponse =
  | { readonly ok: true; readonly total: number; readonly cards: readonly UnknownCard[] }
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
  if (code === 'session_expired') return SESSION_EXPIRED_HE;
  return FAILURE_HE.load;
}

export default function LevelMapScreen({
  fixtureSummary,
}: {
  readonly fixtureSummary?: LevelSummary;
} = {}): React.JSX.Element {
  const [state, setState] = useState<ScreenState>(
    fixtureSummary === undefined
      ? { kind: 'loading' }
      : { kind: 'ready', summary: fixtureSummary, levels: [] },
  );
  const [saving, setSaving] = useState(false);
  /**
   * `T-385`ⓐ — **מקור אחד למספר `unknown` במסך**, בדיוק כמו `unseen` מאז `T-210`
   * («המספר שייך למסך, ⛔ לא לבלוק»). ‏`<UnknownList>` מרנדר אותו, ואריח «חזרה»
   * ב-`<DeckSelector>` מקבל את אותו אובייקט — ⇒ ⛔ אי-אפשר עוד ששניהם יחלקו.
   */
  const [unknownDeck, setUnknownDeck] = useState<UnknownDeck>(EMPTY_UNKNOWN_DECK);

  const loadUnknown = useCallback(async () => {
    setUnknownDeck((previous) => ({ ...previous, failed: false, loading: true }));
    try {
      const body = await apiGet<UnknownQueueResponse>(UNKNOWN_QUERY);
      if (!body.ok) {
        setUnknownDeck({ cards: [], total: null, failed: true, loading: false });
        return;
      }
      // ⛔ אין מיון כאן: הסדר הוא של `sortQueue` ב-`lib/core/deck.ts`, ומיון שני
      // בלקוח היה הגדרה שנייה שסוטה ברגע שהראשונה משתנה.
      setUnknownDeck({ cards: body.cards, total: body.total, failed: false, loading: false });
    } catch {
      setUnknownDeck({ cards: [], total: null, failed: true, loading: false });
    }
  }, []);

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
    if (fixtureSummary !== undefined) return;
    void load();
  }, [load, fixtureSummary]);

  /**
   * `T-385` — הקריאה נורית **בדיוק מתי ש-`<UnknownList>` היה יורה אותה קודם**: הרשימה
   * מרונדרת רק על `ready`, ⇒ ⛔ אין כאן בקשה חדשה בשום מסלול. בענף `choose` או `failed`
   * ⛔ לא נקראה חפיסה, ⇒ האריח אומר «—» — «⛔ לא נעשתה קריאה», בדיוק כמו `unseen`.
   */
  useEffect(() => {
    if (state.kind !== 'ready') return;
    void loadUnknown();
  }, [state.kind, loadUnknown]);

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

  return (
    <section className="flex flex-col gap-6" data-level-map>
      {/* T-262 · D-188 — שורת המסלול הקטנה (`render_video_A.py:255`) הוסרה מכאן:
          `app/layout.tsx` הוא הבעלים היחיד שלה, וזה היה המסך היחיד שמדפיס אותה
          פעמיים. ⛔ הרמה ⛔ אינה כאן עוד: היא הכרטיס שמתחת (`36 § 5` שורה 1). */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>
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
            className="flex min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {failureExit(state.code).labelHe}
          </a>
        </div>
      ) : null}

      {state.kind === 'loading' || state.kind === 'ready' ? (
        // ⚠️ השורות כבר בגודלן הסופי בזמן הטעינה, ולכן שום דבר לא קופץ כשהמספרים נוחתים.
        // `aria-busy` ו⛔ לא ספינר (חוקה § 5).
        <div aria-busy={state.kind === 'loading'} className="flex flex-col gap-5">
          {/* `36 § 5` שורה 1 — כרטיס הרמה, **קריאה בלבד**. ⛔ הוא מוצג רק כשיש רמה:
              בלי רמה המסך הוא ענף הבחירה, וכרטיס «הרמה שלך —» היה טוען טענה ריקה. */}
          {summary ? <LevelCard level={summary.level} /> : null}

          {/* `36 § 5` שורות 2–3 — הפס ושלושת המונים. ⛔ `summary` ⛔ ולא `summary ?? 0`:
              «—» הוא התשובה כשאין מספר, ו-`<FilterBar>` הוא שמכיר את הכלל. */}
          <FilterBar summary={summary} />
        </div>
      ) : null}

      {/* `36 § 5` שורה 4 — החפיסות. ⚠️ **`<ArcadeEntry>` ירד מכאן ב-T-156** (D-090ⓐ ·
          D-052): הזירה חיה ב`העולם` בלבד, ואריח שני לאותו מסך בתוך הצד הלימודי סתר
          את הניתוק. ⛔ הרכיב ⛔ לא נמחק ו⛔ לא נערך — הוא פשוט ⛔ אינו מרונדר כאן. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{PRACTICE_HE}</h2>
        {/* `T-385`ⓐ — אריח «חזרה» מקבל את **אותו** אובייקט שהרשימה למטה מרנדרת,
            ⇒ ⛔ אין שני פסקי דין על `unknown`. ‏`onRetry` נמסר כי «טעינה מחדש»
            שב-`<DeckSelector>` חייבת לקרוא גם למה שהמסך קורא — אחרת היא הייתה
            כפתור שמתקן שני שלישים מהמסך ושותק על השליש שהמשתמש רואה. */}
        <DeckSelector
          unseen={summary?.unseen ?? null}
          unknown={state.kind === 'ready' ? unknownDeck : undefined}
          onRetry={state.kind === 'ready' ? () => void loadUnknown() : undefined}
        />
      </section>

      {/* `36 § 5` שורה 5 — ההערה הקבועה. ⛔ היא ⛔ אינה קישוט: היא הניסוח של
          האינווריאנט «אין דרך לסמן ידעתי/לא ידעתי מחוץ לכרטיסייה». */}
      <p className="text-sm text-ink-muted">{INVARIANT_NOTE_HE}</p>

      {/* שורה 5 — «לא ידעתי» (T-083 · § 4.2ז). ⛔ רשימה ולא מונה: `<DeckSelector>`
          למעלה כבר מציג את המספר כאריח. מוצגת רק כשיש רמה — בלי רמה המסך הוא מצב
          בחירה, ורשימה מתחת לשש הרמות הייתה תשובה לשאלה שהלומד עוד לא שאל. */}
      {state.kind === 'ready' ? <UnknownList deck={unknownDeck} /> : null}

      {/* ⛔ **בורר שש הרמות ⛔ אינו כאן עוד** — `36 § 5`: «אין מעבר רמות כאן» (D-123).
          ‏`<LevelPath>` עבר ל`הגדרות` (T-211) יחד עם הקריאה ל-`POST /api/levels/current`,
          ⛔ והרכיב עצמו ⛔ לא נגעו בו. */}
    </section>
  );
}
