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
import { RETRY_HE } from '@/lib/core/failure';
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
 * 44 ⇒ `min-h-touch`. **שתי סטיות שכבה א׳ נוספות, נמדדו C-0502 ב-`check:mobile`:**
 * ⓐ `בחר` מושבת ב-`opacity-70` ⇒ הטקסט **1.07:1** ⇒ המצב המושבת הוא טוקנים (כרטיס ·
 * קצה-כרטיס · `--arena-ink-dim`, הצמד שנמדד ירוק ב-`SECONDARY_CLASS`), ⛔ לא שקיפות.
 * ⓑ הכן של הרנדר (`--arena-stone`) בתוך כרטיס לחיץ ⇒ **1.8:1** ⇒ אליפסה אחת ב-`--arena-ink-dim`. ⛔ **המצב ⛔ לעולם אינו בצבע בלבד:** הכרטיס הנבחר נושא
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
/** T-056 — the retry wording is `RETRY_HE`, imported ⛔ never restated (`failure.test.ts`). */
const ERROR_HE = `לא הצלחנו לשמור את הבחירה. ${RETRY_HE}.`;
const SELECTED_HE = 'נבחר';
const PICK_FIRST_HE = 'בחר דמות כדי להמשיך';
/**
 * 🚫 **T-402 — המשפט **מתחלף**, ⛔ ואינו נעלם.**
 * ⛔ נוסח ממשק ש⛔ אינו תוכן לימודי ⇒ הכרעת DEV (`RULES § 0.22`), ונרשמה בדוח הטיק.
 * 🔬 **הסיבה מדודה:** `{chosen === null && …}` הוציא את הפסקה מהזרימה ברגע שנבחרה
 * דמות ⇒ הכפתור **קפץ מטה 24px** (הפסקה 12 + `gap-3`), כלומר היעד שהלומד בדיוק
 * מתכוון ללחוץ עליו זז תחת האצבע. ⇒ שורה אחת תמיד, שני נוסחים.
 */
const READY_HE = 'אפשר להמשיך';

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

  /**
   * 📐 **T-346 — ⛔ אין כאן `px-6`, ואותה מדידה בדיוק כמו ב-`ArenaHome` (T-342).**
   *     `app/layout.tsx` נותן ל-`<main>` ‏`px-6`, וה-`section` הוסיף עליהם עוד `px-6`
   *     ⇒ **48px לכל צד**. ⛔ **המדידה, בטיק הזה חי ב-Chromium 320×780:** הכרטיס היה
   *     `x=48` ברוחב **224**, ואחרי `p-4` נשארו 192 פנימיים; הדמות תופסת **127**
   *     ועוד `gap-4` ⇒ לעמודת הטקסט נשארו **47px**. שורת השם (`character-label`)
   *     צריכה **52** כשהכרטיס נבחר (השם + שבב `נבחרה`) ⇒ עודף **5.1px**, והשבב נחתך.
   *     ⇒ ב-24px לכל צד הכרטיס הוא 272, הפנימיים 240, ועמודת הטקסט **97** — 52 נכנסים.
   *     🔬 **ואיך זה נמצא בכלל:** השער החדש של `T-343` האדים עליו באותה הרצה שבה
   *     האדים על `gear-slots`, בעוד `document.documentElement.scrollWidth` המשיך
   *     להחזיר **0** בשלושת הרוחבים. ⇒ זו הראיה שהשער החדש מודד משהו שאיש ⛔ לא מדד,
   *     ⛔ ולא רק את הפגם שהוא נכתב בשבילו.
   *     ⛔ **ואין כאן רנדר נפרד להתיישר אליו** (`D-133 § ג׳`): המסך נגרף מ-`screen_home`,
   *     ולכן הגדר שלו היא אותה גדר — `x=24`, רוחב `LW-48`.
   */
  return (
    <section
      data-arena-scope
      /**
       * 🔴 **⟦17/09 · `C-0672` · `T-402`⟧ עמודה **מדויקת**, ⛔ ולא מינימום — והמעבר
       *     הזה הוא **מדידה שהפריכה את הניסיון הראשון**, ⛔ ולא בחירה בין שתי דעות.
       *
       * 🔬 **הניסיון הראשון היה `sticky bottom-0`, והוא נמדד ⛔ ולא הונח:** הוא ⛔ לא
       *     הזיז ולו פיקסל אחד — תחתית הבלוק נשארה ב-**805.5** ב-375×780. **הסיבה
       *     נמדדה בשרשרת ההורים:** ‏`<body>` נושא `overflow: hidden auto` ⇒ **הוא**
       *     תיבת הגלילה הקרובה של הדבק, ‏`scrollHeight` שלו שווה לגובהו (902 = 902)
       *     ⇒ הוא ⛔ אינו גולל, ⇒ ההיסט ⛔ לעולם אינו נדרש. ⛔ דבק בתוך מיכל שאינו
       *     גולל הוא `static` עם שם אחר.
       *
       * ⛔ **וסידור מחדש לבדו ⛔ לא היה פותר כלום, וזה חשבון:** גובה בלוק הפעולות הוא
       *     סכום קבוע (משפט 12 + `gap-3` + כפתור 58), ⇒ העברת המשפט מעל הכפתור מזיזה
       *     את שניהם **בתוך** הבלוק ו⛔ אינה מזיזה את תחתיתו.
       *
       * ⇒ **מה שכן עובד הוא התקדים של הריפו עצמו:** `ArenaBattle.tsx:850` (`T-350`)
       *     ו-`CardDeck.tsx:368` מחזיקים עמודה **מדויקת** ומרשים לתוכן לגלול בתוכה.
       *     ‏`5.25rem` ⛔ אינם מספר יפה — הם נמדדו באותה שרשרת: כותרת הפריסה **52px**
       *     ועוד `pb-8` של `<main>` **32px** = **84px**. ⇒ הפעולות יושבות על תחתית
       *     העמודה, והכרטיסים — ⛔ ולא הכפתור — הם מה שגולל אם חסר מקום.
       *
       * ⛔ **`pb-16` ירד:** 64px של ריפוד **מתחת** לבלוק בעמודה מדויקת הם 64px שנגרעים
       *     מהכרטיסים בלי לשרת דבר. במקומו בטיחות המכשיר בלבד, כמו ב-`ArenaBattle`.
       *
       * 🎬 **⟦17/09 · `C-0709` · `T-423`ⓑ⟧ ⛔ וה-84 ⛔ אינם מנוכים עוד, ⛔ כי הם ⛔ אינם
       *     קיימים.** ‏`arcade-tokens.css` מוריד את ה-`<header>` (52) ואת `pb-8` של
       *     ה-`<main>` (32) בכל מסמך שנושא `data-arena-scope` — והמקטע הזה נושא אותו
       *     (‏`:145`). ⇒ ניכוי שלהם כאן היה משאיר **84px של כלום** בתחתית המסך, כלומר
       *     בדיוק הפגם ההפוך מזה ש-`T-416` סגר. ⛔ המסך הזה ⛔ אינו שורה משלו: הוא
       *     נופל מהמנגנון, כפי ש-`T-423` אומר על ארבעת הנותרים.
       */
      className="flex h-[100dvh] flex-col gap-5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {/* `:113-114` — הכותרת ב-24px Bold ותת-הכותרת (11.5 ⇒ 12, D-137). */}
      <header className="flex flex-col items-center gap-1 pt-8 text-center">
        <h1 className="text-2xl font-bold leading-tight text-[color:var(--arena-ink)]">{TITLE_HE}</h1>
        <p className="text-xs leading-relaxed text-[color:var(--arena-ink-dim)]">{CHARACTER_INTRO_HE}</p>
      </header>

      {/* `§ 7` — שלוש הדמויות ב-idle חי, כל אחת בקופסת הכרטיס של `:136`. */}
      {/* ⛔ **`flex-1 min-h-0 overflow-y-auto` — הכרטיסים הם מה שגולל, ⛔ לא הכפתור.**
          ⛔ `min-h-0` ⛔ אינו קישוט: בלעדיו פריט flex ⛔ אינו יכול להתכווץ מתחת לגובה
          התוכן שלו, ⇒ הרשימה הייתה דוחפת את הפעולות מטה בדיוק כמו קודם. */}
      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {ARENA_CHARACTERS.map((character) => {
          const selected = chosen === character;
          return (
            <li key={character}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setChosen(character)}
                data-rtl-row="character-card"
                className={[
                  'flex w-full items-center gap-4 px-4 py-3 text-right',
                  CARD_CLASS,
                  selected ? 'border-2 border-[color:var(--arena-gold)]' : '',
                ].join(' ')}
              >
                {/* `:126-134` — הדמות נושמת מעל הכן: `sin(t*1.5)*2.2` ⇒ ±2.2px · 4.19s. */}
                {/* 🔬 **⟦19/09 · `C-0727`⟧ הכרטיס צומצם — נמדד, ⛔ ולא הוחלט לפי תחושה.**
                    הרשימה גדלה לשש דמויות, וב-320x568 נראו **1.8 כרטיסים** ⇒ הרשימה
                    ⛔ לא **נראתה** כרשימה. ⛔ **ורשת של שתי עמודות נפסלה במספר:** היא
                    נותנת לכרטיס **130px** ב-320, ושורת ההטיה הארוכה («חליפת קרב
                    טכנולוגית») מודדת **150px** ⇒ היא הייתה נשברת בכל כרטיס.
                    ⇒ הדמות והכן התכווצו במקום — הטקסט ⛔ לא נגע. */}
                <span className="flex shrink-0 flex-col items-center">
                  <span
                    data-arena-idle="on"
                    className="animate-[arena-idle-bob_4.19s_ease-in-out_infinite] motion-reduce:animate-none"
                  >
                    <ArenaAvatar role="hero" items={[]} character={character} className="h-24 w-auto" />
                  </span>
                  {/* ⛔ הכן **שטוח יותר**: ב-`h-7` הוא נקרא כ**שלולית** מתחת לדמות. */}
                  <svg aria-hidden viewBox="0 0 128 40" className="-mt-1 h-4 w-[76px] text-[color:var(--arena-ink-dim)]" fill="currentColor">
                    <ellipse cx="64" cy="20" rx="64" ry="17" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center justify-between gap-2" data-rtl-row="character-label">
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

      {/* `:179-191` — הפעולות. ⛔ **הן יושבות על רצפת העמודה** (`mt-auto` בתוך גובה
          מדויק), ⇒ תחתית `בחר` ⛔ אינה יכולה לרדת מתחת לקיפול — ⛔ לא ב-320, ⛔ לא
          ב-375 ו⛔ לא ב-414. **המדידה שפתחה את השורה** (`next start`, 780 גובה):
          `בחר` ב-`y=735..793` ב-320 וב-`y=716..774` ב-375/414, והמשפט המסביר ב-
          `y=805..817` / `y=786..798` — שלושתם **מתחת** ל-780. */}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {/* ⛔ **מעל הכפתור, ⛔ ולא מתחתיו** (`ui-ux-pro-max` ⇢ Interaction ⇢ Disabled
            States): הסיבה למצב המושבת נקראת **לפני** שהאצבע מגיעה אל היעד המת, ⛔ ולא
            אחרי שהיא כבר נכשלה בו. ⛔ **ותמיד אחת** — ראה `READY_HE`: פסקה שנעלמת היא
            פסקה שמזיזה את הכפתור. ‏`aria-live` כדי שההתחלפות תישמע גם במקריא מסך. */}
        {state !== 'session_expired' && (
          <p
            id="arena-character-pick-first"
            aria-live="polite"
            className="text-center text-xs leading-none text-[color:var(--arena-ink-dim)]"
          >
            {chosen === null ? PICK_FIRST_HE : READY_HE}
          </p>
        )}
        {state === 'session_expired' ? (
          <a href="/login" className={START_CLASS}>
            {SIGN_IN_AGAIN_HE}
          </a>
        ) : (
          <button
            type="button"
            className={`${START_CLASS} disabled:border-[color:var(--arena-card-edge)] disabled:bg-[color:var(--arena-card)] disabled:text-[color:var(--arena-ink-dim)]`}
            disabled={chosen === null || state === 'saving'}
            aria-describedby="arena-character-pick-first"
            onClick={() => void confirm()}
          >
            {state === 'saving' ? SAVING_HE : CONFIRM_HE}
          </button>
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
