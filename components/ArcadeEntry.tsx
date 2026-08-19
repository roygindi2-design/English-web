'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';

/**
 * «משחק» — הדרך השנייה בבלוק «דרכים לתרגל» של מפת הרמה
 * (T-097 · § 4.2ז שורה 4 · § 4.2י · תוכנית `2026-08-19-arcade-screens.md` § 3).
 *
 * ⛔ **זו שורה בתוך מסך, ⛔ ולא מסך.** אין לה כותרת משלה, אין לה מסך שגיאה ואין בה
 * «נסה שוב»: `<DeckSelector>` כבר קבע את הכלל לבלוק הזה — קריאה שנכשלה משאירה את
 * השורה מושבתת קוראת «—» (`DeckSelector.tsx`, החלטה 4). פקד ניסיון חוזר כאן היה
 * יעד מגע חמישי שהחלטת ה-UX ⛔ אינה נוקבת בו.
 *
 * ארבע ההכרעות כאן הן חוקי המשימה ⛔ ולא טעם:
 *
 * 1. **שני המספרים באים מהשרת.** «נדרשות 12 מילים ברמה, יש 8» נבנה מ-`required`
 *    ומ-`eligible` של התשובה (`docs/api-contract.md`) ⛔ ואינו נכתב בקוד. `12` חי
 *    במקום אחד בלבד — `ARCADE_MIN_WORDS` ב-`lib/core/arcadeRound.ts` — וכפילות שלו
 *    כאן הייתה מספר שמשקר ביום שבו הסף ישתנה.
 *
 * 2. **רמה קטנה מדי היא מצב תקין ⛔ ולא שגיאה** (D-046): מושבת **עם המספר**,
 *    ⛔ לא מוסתר ו⛔ לא ריק. לומד שהשורה נעלמת לו ⛔ אינו יכול לדעת אם המוצר השתנה
 *    או הוא, והמספר הוא בדיוק מה שאומר לו כמה חסר.
 *
 * 3. **מושבת = `<button>` בלי handler עם `aria-disabled`** ⛔ ולא התכונה `disabled`,
 *    אותה תבנית בדיוק של `<DeckSelector>`: השורה נשארת בת-מיקוד, כך שלומד עם
 *    קורא-מסך מוצא את הזירה ושומע שהיא חסומה **ולמה**.
 *
 * 4. **«—» ⛔ ואינו «0».** קריאה שנכשלה ורמה שאין בה מילים נראות זהות על המסך,
 *    ורק אחת מהן נכונה — אותו כלל של `<DeckSelector>` ושל `<MeScreen>`.
 *
 * ⛔ הרכיב ⛔ אינו כותב דבר: `apiGet` בלבד, ⛔ אפס `apiPost`, ⛔ אפס נגיעה במנוע
 * החזרות (D-044). ⛔ ואין בו ניקוד, מטבע ולוח תוצאות (D-050).
 */

const LABEL_HE = 'משחק';
/** ⛔ לא `0`. מספר שאין לנו אינו מספר אפס. */
const UNKNOWN_HE = '—';
const CHOOSE_LEVEL_HE = 'בחר רמה כדי לשחק';
const CHOOSE_LEVEL_HREF = '/cards';
const READY_HE = 'קרב מוכן';

type RoundResponse =
  | { readonly ok: true; readonly level: null; readonly round: null }
  | {
      readonly ok: true;
      readonly level: string;
      readonly round: null;
      readonly reason: 'level_too_small';
      readonly eligible: number;
      readonly required: number;
    }
  | { readonly ok: true; readonly level: string; readonly round: { readonly questions: readonly unknown[] } }
  | { readonly ok: false; readonly code: 'session_expired' | 'schema_missing' | 'unavailable' | string };

/**
 * מצב השורה — שלוש צורות בלבד, כי שלוש הן כל מה שהשורה יודעת להיות. שש התשובות של
 * החוזה ממופות לתוכן ב-`toState`, ⛔ והשורה עצמה אינה מכירה קודי שגיאה.
 */
type EntryState =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'blocked'; readonly note: string }
  | { readonly kind: 'ready' };

/**
 * שש התשובות של `GET /api/arcade/round`, כולן. ההשבתה נגזרת מהמצב שהשרת תיאר
 * ⛔ ולא מדגל נפרד שמישהו צריך לזכור לעדכן.
 */
function toState(body: RoundResponse): EntryState {
  if (!body.ok) {
    // ⛔ שלושת הכשלים — `session_expired` · `schema_missing` · `unavailable` — אינם
    // שלושה משפטים בשורה אחת. השורה אומרת «—», והמסך שמחזיק אותה כבר מדבר על
    // ההתחברות ועל המאגר (`LevelMapScreen.failureText`). ⛔ אין כאן כפילות נוסח.
    return { kind: 'unknown' };
  }
  // ⛔ אין נפילה שקטה ל-A1 (D-037): `level: null` הוא תשובה, ⛔ לא חוסר.
  if (body.level === null) return { kind: 'blocked', note: CHOOSE_LEVEL_HE };
  if (body.round === null) {
    if ('reason' in body && body.reason === 'level_too_small') {
      const { eligible, required } = body;
      return { kind: 'blocked', note: `נדרשות ${required} מילים ברמה, יש ${eligible}` };
    }
    return { kind: 'unknown' };
  }
  return { kind: 'ready' };
}

export default function ArcadeEntry(): React.JSX.Element {
  const [state, setState] = useState<EntryState>({ kind: 'unknown' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let next: EntryState;
      try {
        next = toState(await apiGet<RoundResponse>('/api/arcade/round'));
      } catch {
        next = { kind: 'unknown' };
      }
      if (cancelled) return;
      setState(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // גוף אחד, משותף לשני הענפים. אילו כל ענף החזיק עותק משלו, המושבת היה יכול לאבד
  // בשקט את המספר — ו«מושבת **עם** המספר» הוא כל הכלל (§ 4.2ז · D-046).
  const note = state.kind === 'ready' ? READY_HE : state.kind === 'blocked' ? state.note : UNKNOWN_HE;
  const body = (
    <>
      <span className="text-lg font-semibold">{LABEL_HE}</span>
      <span className="text-base text-ink-muted">{note}</span>
    </>
  );

  return (
    <div aria-busy={loading} data-arcade-entry-row>
      {state.kind === 'ready' ? (
        <Link
          href="/arcade"
          data-arcade-entry
          className="flex min-h-touch items-center justify-between gap-3 rounded-lg border border-border-strong px-5 py-3 text-ink active:opacity-90"
        >
          {body}
        </Link>
      ) : state.kind === 'blocked' && note === CHOOSE_LEVEL_HE ? (
        // רמה ריקה היא היחיד מבין המצבים החסומים שיש לו יעד: בחירת הרמה יושבת במסך
        // הזה עצמו (`<LevelMapScreen>` במצב `choose`), ולכן זה קישור פעיל ⛔ ולא
        // שורה מתה — ⛔ אבל הוא שולח לבחירת רמה ⛔ ולא לזירה.
        <Link
          href={CHOOSE_LEVEL_HREF}
          data-arcade-entry-choose
          className="flex min-h-touch items-center justify-between gap-3 rounded-lg border border-border-subtle px-5 py-3 text-ink-muted active:opacity-90"
        >
          {body}
        </Link>
      ) : (
        // `<button type="button">` בלי handler: ⛔ אינו שולח טופס ו⛔ אינו מנווט, כך
        // ש«אינו עושה דבר» הוא מבנה ⛔ ולא בדיקה בזמן ריצה. נשאר בר-מיקוד
        // (⛔ לא התכונה `disabled`) כדי שקורא-מסך יגיע אליו וישמע `aria-disabled`.
        <button
          type="button"
          aria-disabled="true"
          data-arcade-entry-blocked
          className="flex w-full min-h-touch items-center justify-between gap-3 rounded-lg border border-border-subtle px-5 py-3 text-ink-muted"
        >
          {body}
        </button>
      )}
    </div>
  );
}
