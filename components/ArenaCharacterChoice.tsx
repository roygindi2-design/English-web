'use client';

import { useState } from 'react';
import ArenaAvatar from '@/components/ArenaAvatar';
import { apiPatch } from '@/lib/api/client';
import {
  ARENA_CHARACTERS,
  CHARACTER_BIAS_HE,
  CHARACTER_INTRO_HE,
  CHARACTER_LABELS_HE,
  type ArenaCharacter,
} from '@/lib/core/arenaCharacter';
import { SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

/**
 * `plan/37-arena-spec.md § 7` — **בחירת דמות · כניסה ראשונה.** T-217 · D-133 § ג׳-ד׳ · D-152.
 *
 * 🎯 הרנדר: `docs/design/kol-B-01-home.png`, `docs/design/render_video_B.py:107` (`screen_home`).
 * ⛔ **אין `kol-B-08-character.png`, וזו הכרעה ⛔ ולא פער** (D-133 § ג׳): `§ 7` דורש «שלוש
 * הדמויות ב-idle חי» ⇒ רכיב, ⛔ לא תמונה. ⇒ הגיאומטריה — כותרת `:113`, תת-כותרת `:114`,
 * הכן `:132-134`, הנשימה `:128`, קופסת הכרטיס `:136`, הפעולה הראשית `:180-183` והמשנית
 * `:184-191` — נגרפה מ-`screen_home`, והמחרוזות והמבנה הם `§ 7` מילה במילה.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב:** הקבוצה הסגורה, השמות, שורות ההטיה ומשפט התיאור
 * מגיעים מ-`lib/core/arenaCharacter.ts`. ⛔ **אפס טבלאות מספרים** (`§ 7`).
 * ⛔ **נקודת קצה אחת:** `PATCH /api/arcade/character`. ⛔ הרכיב ⛔ אינו נוגע במאגר.
 *
 * ⚠️ **שכבה א׳, נמדד ⛔ ולא שוער:** כל כרטיס הוא `<button>` בגובה ≥160 (הדמות `h-40`);
 * `בחר` = 58 (הרנדר); `חזרה למסך הבית` — הרנדר מצייר **42** (`:187`) ורצפת שכבה א׳ היא
 * 44 ⇒ `min-h-touch`. ⛔ **המצב ⛔ לעולם אינו בצבע בלבד:** הכרטיס הנבחר נושא
 * `aria-pressed`, את המילה `נבחר` ואת גליף הווי — ומסגרת הזהב היא הערוץ הרביעי.
 * ⛔ **⛔ אין מבוי סתום:** `בחר` מושבת נושא סיבה כתובה ונראית (הדפוס של `ArenaHome`).
 * ⛔ **⛔ אין יציאה בכניסה ראשונה** (`§ 7`: «מוצג פעם אחת … לפני הקרב הראשון»); עם דמות
 * שמורה נוספת `חזרה למסך הבית`.
 *
 * ⚠️ **`CARD_CLASS` · `START_CLASS` · `SECONDARY_CLASS` הועתקו מ-`ArenaHome.tsx:101-116`
 * ⛔ ולא יובאו משם:** מסך שמייבא מחרוזות-מחלקה של מסך אחר מצמיד שני מסכים; המקור
 * המשותף הוא מספרי הרנדר, ⛔ לא הקובץ השכן. D-137 — ⛔ אין בזירה גופן מתחת ל-12.
 */

export interface ArenaCharacterChoiceProps {
  /** הבחירה השמורה, או `null` בכניסה ראשונה. מסמנת את הכרטיס מראש. */
  readonly initial: ArenaCharacter | null;
  /** נקרא אחרי ש-`PATCH` החזיר 200. המעטפת מחליטה לאן ממשיכים. */
  readonly onSaved: (character: ArenaCharacter) => void;
  /** קיים רק כשכבר יש דמות (⛔ אין יציאה בכניסה ראשונה — `§ 7`). */
  readonly onBack?: () => void;
  /** וו לפיקסצ׳ר: מחליף את `apiPatch`. ⛔ קוד מוצר ⛔ לעולם אינו מעביר אותו. */
  readonly save?: (character: ArenaCharacter) => Promise<void>;
}

interface PatchBody {
  readonly ok: boolean;
  readonly code?: string;
}

const TITLE_HE = 'בחירת דמות';
const CONFIRM_HE = 'בחר';
const BACK_HE = 'חזרה למסך הבית';
const SAVING_HE = 'שומר את הבחירה';
const ERROR_HE = 'לא הצלחנו לשמור את הבחירה. נסה שוב.';
const SELECTED_HE = 'נבחר';
const PICK_FIRST_HE = 'בחר דמות כדי להמשיך';

/** `:136` — `rr(24, 404, LW-48, 66, 18, fill=RAISED)` + `BORDER_SUB` 1.1. */
const CARD_CLASS =
  'rounded-2xl border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)]';

/** `:180-183` — הפעולה הראשית. גובה 58 ורדיוס 18 של הרנדר, ⛔ ללא שינוי. */
const START_CLASS =
  'flex h-[58px] w-full items-center justify-center rounded-2xl border-2 ' +
  'border-[color:var(--arena-gold-light)] bg-[color:var(--arena-gold)] ' +
  'text-[17px] font-black text-[color:var(--arena-night)] active:opacity-90';

/** `:185-191` — פעולה משנית. ⚠️ **42 של הרנדר עלה ל-44** (שכבה א׳ ⓐ). */
const SECONDARY_CLASS =
  'flex min-h-touch flex-1 items-center justify-center rounded-xl ' +
  'border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] ' +
  'text-[12.5px] font-semibold text-[color:var(--arena-ink-dim)] active:opacity-90 ' +
  'disabled:opacity-100';

function CheckGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 26 26" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M5 13.5 10.5 19 21 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

async function patchCharacter(character: ArenaCharacter): Promise<void> {
  const body = await apiPatch<PatchBody>('/api/arcade/character', { character });
  if (!body.ok) throw new Error(body.code ?? 'error');
}

export default function ArenaCharacterChoice({
  initial,
  onSaved,
  onBack,
  save,
}: ArenaCharacterChoiceProps): React.JSX.Element {
  const [chosen, setChosen] = useState<ArenaCharacter | null>(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'error' | 'session_expired'>('idle');

  const confirm = async () => {
    if (chosen === null) return;
    setState('saving');
    try {
      await (save ?? patchCharacter)(chosen);
      onSaved(chosen);
    } catch (err) {
      setState(err instanceof Error && err.message === 'session_expired' ? 'session_expired' : 'error');
    }
  };

  return (
    <section data-arena-scope className="flex min-h-[100dvh] flex-col gap-5 px-6 pb-16">
      {/* `:113-114` — הכותרת ב-24px Bold ותת-הכותרת (11.5 ⇒ 12, D-137). */}
      <header className="flex flex-col items-center gap-1 pt-8 text-center">
        <h1 className="text-2xl font-bold leading-tight text-[color:var(--arena-ink)]">{TITLE_HE}</h1>
        <p className="text-xs leading-relaxed text-[color:var(--arena-ink-dim)]">{CHARACTER_INTRO_HE}</p>
      </header>

      {/* `§ 7` — שלוש הדמויות ב-idle חי, כל אחת בקופסת הכרטיס של `:136`. */}
      <ul className="flex flex-col gap-3">
        {ARENA_CHARACTERS.map((character) => {
          const selected = chosen === character;
          return (
            <li key={character}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setChosen(character)}
                className={[
                  'flex w-full flex-row-reverse items-center gap-4 p-4 text-right',
                  CARD_CLASS,
                  selected ? 'border-2 border-[color:var(--arena-gold)]' : '',
                ].join(' ')}
              >
                {/* `:126-134` — הדמות נושמת מעל הכן: `sin(t*1.5)*2.2` ⇒ ±2.2px · 4.19s. */}
                <span className="flex shrink-0 flex-col items-center">
                  <span
                    data-arena-idle="on"
                    className="animate-[arena-idle-bob_4.19s_ease-in-out_infinite] motion-reduce:animate-none"
                  >
                    <ArenaAvatar role="hero" items={[]} character={character} className="h-28 w-auto" />
                  </span>
                  <svg aria-hidden viewBox="0 0 128 40" className="-mt-2 h-7 w-[90px]" fill="currentColor">
                    <ellipse cx="64" cy="23" rx="64" ry="17" className="text-[color:var(--arena-card-edge)]" fill="currentColor" />
                    <ellipse cx="64" cy="17" rx="64" ry="17" className="text-[color:var(--arena-stone)]" fill="currentColor" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-row-reverse items-center justify-between gap-2">
                    {/* `:138` — 15px Bold. */}
                    <span className="text-[15px] font-bold leading-none text-[color:var(--arena-ink)]">
                      {CHARACTER_LABELS_HE[character]}
                    </span>
                    {selected && (
                      <span className="flex items-center gap-1 text-xs font-semibold leading-none text-[color:var(--arena-gold-light)]">
                        <CheckGlyph />
                        {SELECTED_HE}
                      </span>
                    )}
                  </span>
                  {/* `:141-142` — שורות ההטיה, 10.5 ⇒ 12 (D-137). ⛔ מילים, ⛔ לא מספרים. */}
                  <span className="flex flex-col gap-0.5">
                    {CHARACTER_BIAS_HE[character].map((line) => (
                      <span key={line} className="text-xs leading-snug text-[color:var(--arena-ink-dim)]">
                        {line}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* `:179-191` — הפעולות. */}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {state === 'session_expired' ? (
          <a href="/login" className={START_CLASS}>
            {SIGN_IN_AGAIN_HE}
          </a>
        ) : (
          <button
            type="button"
            className={`${START_CLASS} disabled:opacity-70`}
            disabled={chosen === null || state === 'saving'}
            aria-describedby={chosen === null ? 'arena-character-pick-first' : undefined}
            onClick={() => void confirm()}
          >
            {state === 'saving' ? SAVING_HE : CONFIRM_HE}
          </button>
        )}
        {chosen === null && (
          <p id="arena-character-pick-first" className="text-xs leading-none text-[color:var(--arena-ink-dim)]">
            {PICK_FIRST_HE}
          </p>
        )}
        {state === 'error' && (
          <p role="alert" className="text-xs leading-snug text-[color:var(--arena-ink)]">
            {ERROR_HE}
          </p>
        )}
        {onBack !== undefined && (
          <button type="button" className={SECONDARY_CLASS} onClick={onBack}>
            {BACK_HE}
          </button>
        )}
      </div>
    </section>
  );
}
