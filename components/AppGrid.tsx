'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import {
  WORLD_APP_HREF,
  WORLD_APP_LABEL_HE,
  WORLD_APP_ORDER,
  featuredAppId,
  levelTooSmallNoteHe,
  type AppState,
  type WorldApp,
} from '@/lib/core/worldApps';

/**
 * רשת האפליקציות של `העולם` — המעטפת (T-098 · § 4.2יא · D-046).
 *
 * ⛔ **הרשת מוצבת מעל הפיד ו⛔ אינה מחליפה אותו.** § 4.2יא מנסחת אותה כ«שכבה מעל מה
 * שקיים», ו-T-098 ⛔ אינה נוגעת ב-`/world/compose`. ההכרעה אם הפיד נשאר היא פריט 29
 * ב-`03-for-roy` ⛔ ואינה מוכרעת כאן.
 *
 * ארבע ההכרעות כאן הן חוקי המשימה ⛔ ולא טעם:
 *
 * 1. **בדיוק שני אריחים.** «הרכבה» (§ 4.2ה, קיים) ו«זירה» (T-095). כלל המסננת של
 *    § 4.2יא — «אריח בלי תנאי מדיד ⛔ אינו נכנס לרשת» — הוא שמוציא את השאר: לספרייה,
 *    להודעות ולמייל ⛔ אין תנאי פתיחה נקוב במספר, ואריח «בקרוב» בלי מספר אסור
 *    מפורשות (D-046). הפער רשום כ-F-072 ⛔ ואינו מוסתר.
 *
 * 2. **שני המספרים באים מהשרת.** הנוסח נבנה ב-`levelTooSmallNoteHe` מ-`required`
 *    ומ-`eligible` של התשובה ⛔ ואינו נכתב כאן. `12` חי במקום אחד בלבד —
 *    `ARCADE_MIN_WORDS` ב-`lib/core/arcadeRound.ts`.
 *
 * 3. **מושבת = `<button>` בלי handler עם `aria-disabled`** ⛔ ולא התכונה `disabled`,
 *    אותה תבנית של `<DeckSelector>` ושל `<ArcadeEntry>`: האריח נשאר בר-מיקוד, כך
 *    שלומד עם קורא-מסך מוצא אותו ושומע שהוא חסום **ולמה**.
 *
 * 4. **«—» ⛔ ואינו «0».** קריאה שנכשלה אינה «אפס מילים»; מספר שאין לנו אינו אפס.
 *
 * ⚠️ **סטייה מוצהרת מתוכנית `2026-08-19-world-home.md` § 1 צעד 1.5, וסיבתה מדידה:**
 * התוכנית מורה למפות `level === null` ⇒ אריח פתוח שמוביל ל-`/cards` («בחר רמה»).
 * הענף הזה **חדל להתקיים** ב-T-108 (C-0196): `GET /api/arcade/round` ⛔ אינו קורא עוד
 * את `profiles`, ורמת המשחק מתחילה ב-1 לכל לומד (D-052), ולכן `level` אינו שדה
 * בתשובה כלל (`docs/api-contract.md` § `GET /api/arcade/round`). כתיבת הענף כאן
 * הייתה **קוד מת ביום שנולד** — בדיוק הפגם ש-F-074 פתחה על `<ArenaBoard>`. ⇒ המיפוי
 * הוא לפי החוזה החי: `round` ⇒ פתוח עם חיוב · `level_too_small` ⇒ מושבת עם המספרים ·
 * כל השאר ⇒ «—».
 *
 * ⛔ הרכיב ⛔ אינו כותב דבר: `apiGet` בלבד, ⛔ אפס `apiPost`, ⛔ אפס נגיעה במנוע
 * החזרות (D-044 · D-051). ⛔ ואין בו מדדי משחק מסוג D-050.
 */

/** ⛔ לא `0`. מספר שאין לנו אינו מספר אפס. */
const UNKNOWN_HE = '—';
const OPEN_HE = 'פתוח';
const HEADING_HE = 'אפליקציות';

/**
 * התשובות של `GET /api/arcade/round` כפי שהחוזה מגדיר אותן **היום** (T-108):
 * `gameLevel` · `band` · `round`, ⛔ ובלי `level`.
 */
type RoundResponse =
  | {
      readonly ok: true;
      readonly gameLevel: number;
      readonly round: { readonly questions: readonly unknown[] };
    }
  | {
      readonly ok: true;
      readonly gameLevel: number;
      readonly round: null;
      readonly reason: 'level_too_small';
      readonly eligible: number;
      readonly required: number;
    }
  | { readonly ok: true; readonly gameLevel: number; readonly round: null }
  | { readonly ok: false; readonly code: string };

interface ArcadeTile {
  readonly state: AppState;
  readonly hasActiveTask: boolean;
}

/** ⛔ שלוש צורות בלבד — האריח ⛔ אינו מכיר קודי שגיאה, בדיוק כמו `<ArcadeEntry>`. */
function toArcadeTile(body: RoundResponse): ArcadeTile {
  if (!body.ok) return { state: { kind: 'unknown' }, hasActiveTask: false };
  if (body.round !== null) return { state: { kind: 'open' }, hasActiveTask: true };
  if ('reason' in body && body.reason === 'level_too_small') {
    const { required, eligible } = body;
    return {
      state: { kind: 'locked', noteHe: levelTooSmallNoteHe(required, eligible) },
      hasActiveTask: false,
    };
  }
  return { state: { kind: 'unknown' }, hasActiveTask: false };
}

/** «הרכבה» תמיד פתוחה, ⛔ ואין לה עדיין אות חיוב מוכרע — זה חלקה של F-072. */
function buildApps(arcade: ArcadeTile): readonly WorldApp[] {
  return WORLD_APP_ORDER.map((id) => ({
    id,
    labelHe: WORLD_APP_LABEL_HE[id],
    href: WORLD_APP_HREF[id],
    state: id === 'arcade' ? arcade.state : ({ kind: 'open' } as const),
    hasActiveTask: id === 'arcade' ? arcade.hasActiveTask : false,
  }));
}

function noteOf(state: AppState): string {
  if (state.kind === 'locked') return state.noteHe;
  return state.kind === 'open' ? OPEN_HE : UNKNOWN_HE;
}

const TILE_BASE =
  'flex min-h-touch w-full flex-col items-start justify-start gap-1 rounded-lg border px-5 py-4 text-start';
const TILE_OPEN = 'border-border-strong bg-surface-raised text-ink active:opacity-90';
const TILE_SHUT = 'border-border-subtle bg-surface-raised text-ink-muted';

export default function AppGrid(): React.JSX.Element {
  const [arcade, setArcade] = useState<ArcadeTile>({
    state: { kind: 'unknown' },
    hasActiveTask: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let next: ArcadeTile;
      try {
        next = toArcadeTile(await apiGet<RoundResponse>('/api/arcade/round'));
      } catch {
        next = { state: { kind: 'unknown' }, hasActiveTask: false };
      }
      if (cancelled) return;
      setArcade(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apps = buildApps(arcade);
  const featured = featuredAppId(apps);

  return (
    <section aria-busy={loading} data-app-grid className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-ink">{HEADING_HE}</h2>
      <ul className="grid grid-cols-2 gap-3">
        {apps.map((worldApp) => {
          const note = noteOf(worldApp.state);
          // גוף אחד לשני הענפים: אילו כל ענף החזיק עותק, המושבת היה יכול לאבד בשקט
          // את המספר — ו«מושבת **עם** המספר» הוא כל הכלל (D-046).
          const body = (
            <>
              <span className="text-lg font-semibold">{worldApp.labelHe}</span>
              <span className="text-base text-ink-muted">{note}</span>
            </>
          );
          return (
            <li key={worldApp.id} className={featured === worldApp.id ? 'col-span-2' : ''}>
              {worldApp.state.kind === 'open' ? (
                <Link href={worldApp.href} data-app-tile={worldApp.id} className={`${TILE_BASE} ${TILE_OPEN}`}>
                  {body}
                </Link>
              ) : (
                // `<button type="button">` בלי handler: ⛔ אינו שולח טופס ו⛔ אינו
                // מנווט, כך ש«אינו עושה דבר» הוא מבנה ⛔ ולא בדיקה בזמן ריצה. נשאר
                // בר-מיקוד (⛔ לא התכונה שמסירה אותו מסדר הטאב) כדי שקורא-מסך יגיע
                // אליו וישמע `aria-disabled`.
                <button
                  type="button"
                  aria-disabled="true"
                  data-app-tile-blocked={worldApp.id}
                  className={`${TILE_BASE} ${TILE_SHUT}`}
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
