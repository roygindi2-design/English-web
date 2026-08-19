'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord, { EnText } from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import type { RecallCard as RecallCardData } from '@/lib/core/worldRecall';

/**
 * הכרטיס «מה שכתבת אתמול» — T-105 · § 4.2יב · D-051 · D-050 · D-046.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב.** מי המשפט, מהי מילת היעד, אילו ארבע אפשרויות ומהו
 * `daysAgo` — כל אלה הוכרעו ב-`lib/core/worldRecall.ts` ונמסרו כבר בנויים דרך
 * `GET /api/world/recall`. הקוד כאן ⛔ אינו מדרג, ⛔ אינו מגריל ו⛔ אינו בוחר.
 *
 * ⛔ **מחזור מלא של הכרטיס אינו כותב שורה אחת** — זה מדד ⓐ של § 4.2יב, וזו הסיבה
 * שאין בקובץ `apiPost`: השליפה הזאת ⛔ אינה אירוע של מנוע החזרות (D-051), ולכן היא
 * ⛔ אינה נוגעת ב-`word_progress` לא בכתיבה ולא בקריאה.
 *
 * ⛔ **אין כאן שעון** (D-049 · S15): המילים במשפט של הלומד ⛔ אינן בהכרח ידועות לו,
 * ולכן דדליין היה מודד הקלדה ולא זיכרון. הכרטיס ממתין עד שהוא נוגע.
 *
 * ⛔ **אין כאן עונש ואין ניסיון שני** (§ 4.2יב): בכל מקרה — נכון או שגוי — המילה
 * הנכונה נוחתת במקומה, והשורה מתחתיה אומרת עובדה ⛔ ולא שיפוט (R-016). ⛔ אין ניקוד,
 * מטבע, רצף או לוח תוצאות (D-050 · E4).
 *
 * ⚠️ **סטייה מוצהרת מנוסח התוכנית § 3 צעד 3.2, וסיבתה bidi ⛔ ולא טעם.** התוכנית
 * מורה «המשפט ב-`<EnText segments=…>` כאשר מקטע היעד מוחלף במסגרת». `<EnText>` מקבל
 * מקטעי **טקסט** ⛔ ואינו יכול להחזיק אלמנט באמצע, ולכן המסגרת חייבת לשבת בין שתי
 * ריצות אנגלית. שתי ריצות מבודדות שכנות בתוך פסקה עברית מסודרות **מימין לשמאל** —
 * כלומר חצי המשפט שאחרי היעד היה נדפס לפני החצי שלפניו. ⇒ שלושתם נעטפים ב-
 * `<EnWord>` אחד, שהוא הבידוד היחיד, ובתוכו הסדר הוא LTR. ⛔ אף אחת משלוש תכונות
 * ה-bidi ⛔ אינה נכתבת בקובץ הזה ביד — T-009 נשמר.
 *
 * ⚠️ **סטייה שנייה, והתוכנית סותרת את עצמה:** צעד 3.2 מכתיב `&#8203;` בתוך המסגרת,
 * וצעד 3.3 של אותה תוכנית אוסר `#[0-9a-fA-F]{3,8}` — הישות `&#8203;` **מפילה את
 * הבדיקה של התוכנית עצמה**. ⇒ אותו תו בדיוק נכתב כ-`​`. ⛔ הפרש התנהגות: אפס.
 *
 * ⚠️ **`card: null` ⇒ «כתוב את המשפט הראשון שלך» ⛔ בלי מספר, וזה F-080.** שורת T-105
 * דורשת «מושבת **עם המספר**» (D-046), אבל `GET /api/world/recall` עונה
 * `{ok:true, card:null}` **ובלי ולו מונה אחד** — אין בחוזה `posts` ואין `eligible`,
 * ולכן מספר על המסך הזה היה מומצא. ⇒ הנוסח הוא זה של התוכנית, והפער נרשם כממצא.
 */

const TITLE_HE = 'מה שכתבת';
const CHAIN_HE = 'שרשרת הכתיבה';
const CHAIN_HREF = '/world/chain';
const REMEMBERED_HE = 'וזכרת';
const THE_WORD_WAS_HE = 'המילה הייתה';
const EMPTY_HE = 'עוד אין משפט להיזכר בו.';
const FIRST_SENTENCE_HE = 'כתוב את המשפט הראשון שלך';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const LOADING_HE = 'טוען את הכרטיס שלך…';
const COMPOSE_HREF = '/world/compose';

/** בדיוק מה ש-`GET /api/world/recall` עונה (`docs/api-contract.md`), ⛔ ולא יותר. */
type RecallBody =
  | { readonly ok: true; readonly card: RecallCardData | null }
  | { readonly ok: false; readonly code: string; readonly message?: string };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'card'; readonly card: RecallCardData }
  | { readonly kind: 'empty' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'error' };

const SECTION_CLASS = 'flex flex-col gap-3';
const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90';
const RETRY_CLASS =
  'inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90';
const OPTION_CLASS =
  'flex w-full min-h-touch items-center justify-start rounded-lg border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink active:opacity-90';

/**
 * היציאה היחידה מהכרטיס, ומיקומה ⛔ אינו טעם: § 4.2יב נוקבת בה במפורש — «יוצאים —
 * «שרשרת הכתיבה» ⇒ T-106» **מתוך הכרטיס**, ⛔ ולא מרשת האפליקציות. הגדרה אחת ושני
 * שימושים — ⛔ לא שני עותקים של אותו JSX.
 */
function ChainLink(): React.JSX.Element {
  return (
    <Link
      href={CHAIN_HREF}
      className="inline-flex min-h-touch items-center self-start text-lg text-ink-muted underline underline-offset-4 active:opacity-90"
    >
      {CHAIN_HE}
    </Link>
  );
}

/**
 * המסגרת: `inline-block` בגובה השורה עם רוחב מינימלי, ⛔ ולא `border-b`. «קו תחתון
 * דק» נקרא כהדגשה של מילה שכתובה שם — והמילה הזאת בדיוק **חסרה**.
 */
const BLANK_CLASS =
  'inline-block min-w-[4ch] rounded-md border border-border-strong px-1 align-baseline';

/** התו הבלתי-נראה שמחזיק את גובה השורה בתוך המסגרת הריקה (‏U+200B). */
const ZERO_WIDTH_SPACE = '​';

/**
 * ⛔ הנוסח נבנה כאן ⛔ ולא בשרת: `daysAgo` הוא **מספר שלם** בחוזה, כדי שהעברית
 * (יחיד · זוגי · רבים) תחיה במקום אחד — במסך.
 */
function writtenAgoHe(daysAgo: number): string {
  if (daysAgo <= 0) return 'כתבת את זה היום';
  if (daysAgo === 1) return 'כתבת את זה לפני יום';
  if (daysAgo === 2) return 'כתבת את זה לפני יומיים';
  return `כתבת את זה לפני ${daysAgo} ימים`;
}

/**
 * התצוגה הטהורה. הפיקסטורה ב-`app/dev/world/recall` מרנדרת **אותה** — ⛔ אין עותק
 * שני של ה-JSX, ולכן מה ש-`check:mobile` מודד הוא הכרטיס האמיתי.
 */
export function RecallCardView({ card }: { readonly card: RecallCardData }): React.JSX.Element {
  const [chosen, setChosen] = useState<string | null>(null);
  const answered = chosen !== null;
  const correct = chosen === card.answer;

  const targetAt = card.segments.findIndex((segment) => segment.isTarget);
  const before = card.segments.slice(0, targetAt === -1 ? card.segments.length : targetAt);
  const after = targetAt === -1 ? [] : card.segments.slice(targetAt + 1);

  return (
    <section data-recall-card className={SECTION_CLASS}>
      <h2 className="text-lg font-semibold text-ink">{TITLE_HE}</h2>
      <p className="text-base text-ink-muted">{writtenAgoHe(card.daysAgo)}</p>

      <p className="text-lg leading-relaxed text-ink">
        {/* עטיפה אחת ⇒ בידוד אחד ⇒ סדר LTR לשלושת החלקים. ראה ההערה בראש הקובץ. */}
        <EnWord>
          <EnText segments={before} />
          <span className={BLANK_CLASS}>
            {/* אותו צומת DOM בשני המצבים: React מחליף `className` בלבד, ולכן המעבר
                באמת רץ. ⛔ המילה ⛔ אינה בעץ לפני התשובה — לא בעין ולא לקורא מסך. */}
            <span
              className={`transition-opacity duration-200 ${answered ? 'opacity-100' : 'opacity-0'}`}
            >
              {answered ? card.answer : ZERO_WIDTH_SPACE}
            </span>
          </span>
          <EnText segments={after} />
        </EnWord>
      </p>

      {answered && (
        // עובדה ⛔ ולא שיפוט (R-016): «וזכרת» או «המילה הייתה X». ⛔ אין «נכון!», אין
        // «טעית», ואין ניסיון שני — הכרטיס גמור בשני המסלולים.
        <p data-recall-outcome className="text-base text-ink-muted">
          {correct ? REMEMBERED_HE : <>{THE_WORD_WAS_HE} <EnWord>{card.answer}</EnWord></>}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3">
        {card.options.map((option) => (
          <li key={option}>
            {answered ? (
              // ⛔ בלי handler ועם `aria-disabled`, אותה תבנית של `<AppGrid>`: האפשרות
              // נשארת בת-מיקוד, כך שקורא מסך מוצא אותה ושומע שהיא כבר אינה פעילה.
              <button type="button" aria-disabled="true" className={OPTION_CLASS}>
                <EnWord>{option}</EnWord>
              </button>
            ) : (
              <button type="button" onClick={() => setChosen(option)} className={OPTION_CLASS}>
                <EnWord>{option}</EnWord>
              </button>
            )}
          </li>
        ))}
      </ul>

      <ChainLink />
    </section>
  );
}

export default function RecallCard(): React.JSX.Element {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<RecallBody>('/api/world/recall');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else setState({ kind: 'error' });
        return;
      }
      setState(body.card === null ? { kind: 'empty' } : { kind: 'card', card: body.card });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.kind === 'card') return <RecallCardView card={state.card} />;

  return (
    <section data-recall-card className={SECTION_CLASS}>
      <h2 className="text-lg font-semibold text-ink">{TITLE_HE}</h2>

      {state.kind === 'loading' && (
        // שלד **בצורת הכרטיס** ⛔ ולא ספינר (חוקה § 5): שורת הנוסח, שורת המשפט ושתי
        // שורות אפשרויות. `aria-hidden` על המלבנים והמשפט באזור חי — קורא מסך שומע
        // «טוען», ⛔ לא ארבעה מלבנים ריקים.
        <div data-skeleton className="flex flex-col gap-3">
          <p className="sr-only" role="status">
            {LOADING_HE}
          </p>
          <div aria-hidden className="h-5 w-1/3 rounded-md bg-surface-raised" />
          <div aria-hidden className="h-16 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-touch rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-touch rounded-lg bg-surface-raised" />
        </div>
      )}

      {state.kind === 'empty' && (
        // ⛔ לא מסך ריק ו⛔ לא «בקרוב» (D-046): הדרך היחידה שכרטיס נולד היא משפט
        // שהלומד כתב, ולכן המצב הזה מוביל בדיוק לשם.
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{EMPTY_HE}</p>
          <Link href={COMPOSE_HREF} className={PRIMARY_ACTION_CLASS}>
            {FIRST_SENTENCE_HE}
          </Link>
        </div>
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
          {/* `<a>` ⛔ ולא `<Link>`: הסשן איננו, ולכן הבקשה הבאה חייבת להגיע לשרת
              ולקבל ממנו הפניה — הנתב של הלקוח רשאי לענות מהמטמון. אותו נימוק בדיוק
              כמו ב-`<WorldFeed>`. */}
          <a href="/login" className={PRIMARY_ACTION_CLASS}>
            {SIGN_IN_AGAIN_HE}
          </a>
        </div>
      )}

      {/* ⛔ לא כשהסשן פג: שם הדרך היחידה קדימה היא ההתחברות, וקישור שני היה מתחרה
          בה — זה בדיוק המבוי הסתום של F-027. בכל שאר המצבים היציאה קיימת, כי
          «שרשרת הכתיבה» עומדת בפני עצמה גם כשאין כרטיס להיזכר בו. */}
      {state.kind !== 'session_expired' && <ChainLink />}
    </section>
  );
}
