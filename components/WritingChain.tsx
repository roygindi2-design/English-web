'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

/**
 * «שרשרת הכתיבה» — T-106 · § 4.2יב · D-050 · E4 · תוכנית `2026-08-19-world-home.md` § 4.
 *
 * ⛔ **זה אינו רצף יומי, וזו כל ההכרעה** (E4 · D-050): המספר ⛔ אינו יורד, ⛔ אינו נשבר,
 * ויום שהוחמץ ⛔ אינו מוחק דבר. «שרשרת» כאן פירושה **מה שנכתב עד היום**, ולכן היא
 * ⛔ אינה יכולה להעניש היעדרות — עונש על יום חסר הוא בדיוק מנגנון הריתוק ש-E4 אוסר.
 *
 * ⛔ **אין כאן גרף ואין מדד** (אילוץ 14 של התוכנית) ⇒ ⛔ לא `dataviz`: מספר יחיד ורשימה.
 * גרף על שני מספרים הוא קישוט שמתחזה למידע.
 *
 * ⛔ **אין שיתוף, אין פומבי ואין משתמש אחר.** § 4.2יב מדבר על מה שהלומד כתב, והפיד
 * הזה הוא `user_id` שלו וגם `author_kind='learner'` — שני התנאים נאכפים בשרת.
 *
 * ⚠️ **המספר הוא `count` ⛔ ולא `total`, וזה ההבדל בין עובדה לשקר.** `GET /api/world/posts`
 * מחזיר את שניהם: `total` הוא **גודל התשובה**, חתוך ב-`MAX_FEED_ROWS = 100`, ו-`count`
 * הוא **ספירת הטבלה**. השורה של T-106 מבקשת «אי-פעם» ⇒ רק `count` עונה עליה, ו-`total`
 * היה נעצר על 100 בלי לומר זאת. הרשימה שמתחת עדיין מוגבלת לתקרה, ולכן היא נקראת
 * «המשפטים האחרונים שלך» ⛔ ולא «כולם».
 *
 * ⚠️ **התאריך נגזר מהמחרוזת שהשרת שלח, ⛔ ולא מ-`new Date()`.** הרכיב הזה מרונדר גם
 * בשרת וגם בלקוח, ו-`toLocaleDateString` מדפיס שני ערכים שונים לפי אזור הזמן והלוקאל
 * של כל אחד מהם ⇒ אי-התאמת הידרציה על מסך שכל תוכנו הוא תאריכים. `created_at` הוא
 * ISO-8601 ב-UTC בדיוק כפי שהדאטהבייס אחסן, וחיתוך שלו הוא הפעולה היחידה שנותנת את
 * אותו פלט בשני הצדדים. ⛔ אין כאן שעון גם במובן השני (D-049 · S15): אין דדליין,
 * אין ספירה לאחור ואין `setTimeout`.
 *
 * «—» ⛔ ולא «0» בכל מצב שבו המספר אינו ידוע — כלל `<MeScreen>`/`<WorldFeed>`: מקף הוא
 * ישר, מספר שגוי לעולם לא.
 */

const HEADING_HE = 'שרשרת הכתיבה';
const WRITTEN_SENTENCES_HE = 'משפטים שכתבת';
const RECENT_HE = 'המשפטים האחרונים שלך';
const UNKNOWN_COUNT_HE = '—';
const EMPTY_HE = 'עוד לא כתבת משפט.';
const FIRST_SENTENCE_HE = 'כתוב את המשפט הראשון שלך';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const LOADING_HE = 'טוען את המשפטים שלך…';
const COMPOSE_HREF = '/world/compose';

/** בדיוק מה ש-`GET /api/world/posts` עונה (`docs/api-contract.md`), ⛔ ולא יותר. */
type ChainPost = {
  readonly id: string;
  readonly body_en: string;
  readonly created_at: string;
};

type PostsBody =
  | {
      readonly ok: true;
      readonly posts: readonly ChainPost[];
      readonly total: number;
      readonly count: number;
    }
  | { readonly ok: false; readonly code: string };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'chain'; readonly posts: readonly ChainPost[]; readonly written: number }
  | { readonly kind: 'empty'; readonly written: number }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90';
const RETRY_CLASS =
  'inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90';

/**
 * `2026-08-14T17:00:00Z` ⇒ `14.08.2026`. חיתוך ⛔ ולא פירוש: הפונקציה ⛔ אינה קוראת שעון
 * ו⛔ אינה מכירה אזור זמן, ולכן השרת והלקוח מדפיסים את אותם תווים. מחרוזת שאינה בצורה
 * הזאת חוזרת כפי שהיא — ⛔ עדיף תאריך גולמי על תאריך מומצא.
 */
export function writtenOnHe(createdAt: string): string {
  const iso = createdAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return createdAt;
  const [year, month, day] = iso.split('-');
  return `${day}.${month}.${year}`;
}

export default function WritingChain(): React.JSX.Element {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<PostsBody>('/api/world/posts');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else setState({ kind: 'error' });
        return;
      }
      // ⛔ `body.total` ⛔ אינו נקרא כאן בכלל — ראה ההערה בראש הקובץ.
      const written = body.count;
      setState(
        body.posts.length === 0
          ? { kind: 'empty', written }
          : { kind: 'chain', posts: body.posts, written },
      );
    } catch {
      // `apiGet` נכשל רק כשהתשובה לא הגיעה או לא הייתה JSON. אין קוד לפעול לפיו ⇒
      // זה הכשל הכללי ⛔ ולא ניחוש על הסיבה.
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const written =
    state.kind === 'chain' || state.kind === 'empty' ? state.written : null;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {/* המספר נושא תווית עברית משלו — גודל וצבע לעולם אינם הערוץ היחיד (חוקה § 1).
          הוא נשאר על המסך בכל מצב, כדי שהפריסה לא תקפוץ כשהתשובה נוחתת. */}
      <div className="flex flex-col gap-1">
        <p className="text-4xl font-bold leading-none">
          {written === null ? UNKNOWN_COUNT_HE : written}
        </p>
        <p className="text-lg text-ink-muted">{WRITTEN_SENTENCES_HE}</p>
      </div>

      {state.kind === 'loading' && (
        // שלד **בצורת הרשימה** ⛔ ולא ספינר (חוקה § 5). `aria-hidden` על המלבנים
        // והמשפט באזור חי — קורא מסך שומע «טוען», ⛔ לא שלושה מלבנים ריקים.
        <div data-skeleton className="flex flex-col gap-3">
          <p className="sr-only" role="status">
            {LOADING_HE}
          </p>
          <div aria-hidden className="h-16 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-16 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-16 w-2/3 rounded-lg bg-surface-raised" />
        </div>
      )}

      {state.kind === 'chain' && (
        // ⛔ אין מיון כאן: השרת ענה `created_at` יורד, וכלל מיון שני היה כלל אחד יותר
        // מדי. הכותרת אומרת «האחרונים» כי הקריאה חסומה בתקרת MAX_FEED_ROWS, והמספר
        // שלמעלה הוא זה שמדבר על «אי-פעם».
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink">{RECENT_HE}</h2>
          <ul className="flex flex-col gap-3">
            {state.posts.map((post) => (
              <li key={post.id} className="flex flex-col gap-1 rounded-lg bg-surface-raised px-4 py-3">
                <p className="text-lg leading-relaxed text-ink">
                  <EnWord>{post.body_en}</EnWord>
                </p>
                <p className="text-base text-ink-muted">{writtenOnHe(post.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.kind === 'empty' && (
        // ⛔ לא מסך לבן ו⛔ לא «בקרוב»: הדרך היחידה ששרשרת מתחילה היא משפט אחד,
        // ולכן המצב הזה מוביל בדיוק לשם (D-046).
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{EMPTY_HE}</p>
          <Link href={COMPOSE_HREF} data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
            {FIRST_SENTENCE_HE}
          </Link>
        </div>
      )}

      {state.kind === 'schema_missing' && (
        // משפט משלו ⛔ ולעולם לא מצב ריק: «עוד לא כתבת» היה אומר ללומד שהמשפטים שלו
        // אינם קיימים, כשהתקלה שלנו.
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
          {/* `<a>` ⛔ ולא `<Link>`: הסשן איננו, ולכן הבקשה הבאה חייבת להגיע לשרת
              ולקבל ממנו הפניה — הנתב של הלקוח רשאי לענות מהמטמון. אותו נימוק
              בדיוק כמו ב-`<WorldFeed>` וב-`<RecallCard>`. */}
          <a href="/login" data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
            {SIGN_IN_AGAIN_HE}
          </a>
        </div>
      )}
    </section>
  );
}
