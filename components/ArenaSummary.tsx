'use client';

import EnWord from '@/components/EnWord';
import { replayTallyHe } from '@/lib/core/arenaReplay';
import { firstMetHe, meanSecondsHe, wordsFromBossHe, type ArenaEnding, type ArenaSummary as ArenaSummaryData } from '@/lib/core/arenaSummary';

/**
 * T-180 · `37-arena-spec § 10` — **מסך התוצאות.**
 * 🎯 הרנדר: `docs/design/kol-B-07-results.png`, ומקורו `render_video_B.py` `scene_results`
 * (`:595-648`). ⛔ **כל מספר פריסה כאן נגזר מהקובץ הזה ב-grep, ⛔ ולא נצפה על ה-PNG**
 * (`36 § 14.4` — הרנדר מחייב **גם בגימור**; שכבה א׳ של החוקה היא ההחרגה היחידה).
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב.** הסיכום מגיע כ-prop מ-`lib/core/arenaSummary.ts`.
 * רכיב שמחשב בעצמו הוא עותק שני של החוק, והשני תמיד סוטה.
 *
 * ⛔ **הרכיב ⛔ אינו כותב דבר** — ⛔ אין בו `apiPost`, ⛔ אין בו `fetch` ו⛔ אין בו שם של
 * עמודה במנוע החזרות. זהו אינווריאנט `37 § 13.1` (הזירה ⛔ אינה מזיזה SM-2), והשורה
 * `הזירה לא שינתה דבר בהתקדמות הלמידה` היא בדיוק אותו אינווריאנט אמור בקול.
 *
 * ⛔ **הבלוקים שהרנדר מצייר ו⛔ אינם כאן, וכל אחד סטייה מוצהרת ⛔ ולא שכחה** — § 7 של
 * `docs/superpowers/plans/2026-08-27-arena-slice-c-results-and-idle.md` נושא את המספרים:
 * ⓐ `רמת זירה 7 · +48 XP` (`:604`) — ⛔ אין כלל XP ו⛔ אין עמודה (F-151) · ⓑ `תיבת ניצחון`
 * (`:606-617`) — אותו שורש · ⓒ **הלוח הכחול `פגשת 4 מילים חדשות` (`:631-640`) — נבנה
 * ב-T-282 כקריאה בלבד**; ⛔ מה שעדיין אינו כאן הוא בקרת ה-`○` והשורה `הוסף לכרטיסיות`,
 * שתיהן חצי הכתיבה של `03-for-roy` פריט 105 · ⓓ ה-CTA `הוסף הכול וחזור לזירה` (`:643`) —
 * אותו פריט 105, ולכן ה-CTA נשלח כ-`חזרה לזירה` (מחרוזת ממשק, ⛔ לא תוכן לימודי).
 *
 * ⚠️ **רדיוס שורת הסטטיסטיקה ברנדר הוא 13** (`:618-620`) — ⛔ **אינו** אחד מחמשת ערכי
 * הסולם (6 · 8 · 12 · 16). הקרוב בסולם הוא `xl` = 12 ⇒ סטייה **מדודה של 1px**, אותה צורה
 * בדיוק כמו `F-144`. ⛔ לא נצפתה — נמדדה.
 */

export interface ArenaSummaryProps {
  /** T-283 — three endings, ⛔ not a boolean. Computed by `endingOf` in `lib/core`. */
  readonly ending: ArenaEnding;
  readonly summary: ArenaSummaryData;
  /** wordId → headword. האנגלית ⛔ לעולם אינה מגיעה ללומד מחוץ ל-`<EnWord>`. */
  readonly headwords: Readonly<Record<string, string>>;
  /** «חזור לזירה». ⛔ אינה הכרעת ניווט — הקורא הוא שמחזיק את היעד. */
  readonly onBack: () => void;
  /**
   * 🔁 `T-451` · `37 § 8` ק8 — כמה מילות «חזרה מהירה» תוקנו מתוך כמה שנענו.
   * ⛔ `null` ⇔ לא הייתה חזרה (אפס טעויות, או דילוג לפני תשובה ראשונה) ⇒ ⛔ אין שורה.
   * ⛔ אינו נוגע ב-`summary`: החזרה ⛔ אינה `cast`, ⇒ `נכונות` נשאר זהה בתו.
   */
  readonly replay?: { readonly fixed: number; readonly total: number } | null;
}

const WON_HE = 'היריב נוצח';
/** 🔁 `T-451` — אותה תווית של השלב עצמו (`ArenaBattle.tsx`). */
const REPLAY_HE = 'חזרה מהירה';
// T-283 · `37 § 9` ח4 · R-016 — two FACTS, ⛔ not verdicts, each true in every state of its
// kind (`battle.ts:187-194`): `outlasted` ⇔ alive at the clock with the higher share;
// `survived` ⇔ the enemy still has HP. ⛔ No word for «loss» exists in this file.
const OUTLASTED_HE = 'החזקת מעמד עד סוף השעון';
const SURVIVED_HE = 'היריב החזיק מעמד';
const CORRECT_HE = 'נכונות';
const MEAN_HE = 'זמן תגובה ממוצע';
const STREAK_HE = 'רצף מרבי';
const SLOW_HE = 'מילים היו איטיות';
// D-187 §ג׳.2 — צורת הפועל של שם יציאה היא `חזרה`, ⛔ לא `חזור`; זה היה היחיד
// מ-13 אתרי היציאה בעץ שסטה.
const BACK_HE = 'חזרה לזירה';
const FOOTER_HE = 'הזירה לא שינתה דבר בהתקדמות הלמידה';

/* ‏y=318 · 370 · 422 ⇒ פסיעה 52 על גובה 44 ⇒ מרווח 8px = `gap-2`.
   ⚠️ **`flex` רגיל, ⛔ ולא `flex-row-reverse`** (`T-338`, המשך של `F-236`): הרכיב גזר
   את הגובה והפסיעה מ-`render_video_B.py:620-621` ואז הפך את הציר שאותן שורות קובעות —
   `c.txt(LW - 40, …, k, …, anchor="rm")` שם את ה**תווית** בימין ו-`c.txt(40, …, v, …,
   anchor="lm")` את ה**ערך** בשמאל. נמדד חי לפני התיקון ב-375px: `נכונות` ב-`x=65`
   ו-`14 / 16` ב-`x=252` ⇒ הלומד קרא את המספר לפני מה שהוא מודד. במיכל RTL `flex`
   **כבר** מניח את הילד הראשון בימין. */
const ROW_CLASS =
  'flex min-h-[44px] items-center justify-between rounded-xl border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] px-4';
/* ‏x=24 ⇒ הגדר של `<main>` ב-`app/layout.tsx:57` (‏`px-6`), ⛔ ולא גדר שנייה כאן;
   ‏LW-48=327 ⇒ הרוחב נגזר, ⛔ ולא נכתב. ⟦T-348 · `F-253`⟧ */
const PANEL_CLASS = 'flex min-h-[66px] flex-col justify-center gap-1 rounded-2xl px-4 py-3';

export default function ArenaSummary({
  ending,
  summary,
  headwords,
  onBack,
  replay = null,
}: ArenaSummaryProps): React.JSX.Element {
  return (
    /* 🥊 **⟦17/09 · `C-0707` · `T-422`⟧ גובה **מדויק**, ⛔ ולא מינימום — תבנית
       `ArenaBattle.tsx` (`T-416` · `C-0623`), מילה במילה.

       🔬 **נמדד חי בטיק הזה ב-`next start`, ⛔ ולא שוער:** `min-h-[100dvh]` על מקטע
       שיושב **בתוך** כרום הפריסה ⇒ גלישה של **בדיוק 84px** ב-375·393·414·430 — כי
       `100dvh` הוא המסך, והמקטע מתחיל 52px מתחת לכותרת ו⛔ אינו יודע על ה-32px של
       `<main>`. ⇒ הגלישה ⛔ אינה תלוית-תוכן, היא **בהגדרה**. ‏5.25rem = 52+32 = 84.
       ⛔ **וב-320 היא הייתה 113** — 84 של הכרום ועוד **29 של תוכן אמיתי**, ⇒ הגובה
       המדויק לבדו ⛔ אינו מספיק, וזו הסיבה לאזור הגמיש שמתחת. */
    /* 🎬 **⟦T-428 · `C-0773` · `36 § 8.0` ①⟧ הסיום נכנס לזירה — `data-arena-scope`.**
       🔬 נמדד `C-0708`: ⛔ בלי הסקופ המקטע היה `left=24 w=345` ורקעו **שקוף** על גוף בהיר ⇒
       הלומד ניצח בחדר כהה וקיבל את התוצאה בטופס לבן. הסקופ נותן את מלוא הרוחב ואת
       `--arena-night`, **ומוריד את הכרום** (`arcade-tokens.css`, `T-423`ⓑ) ⇒ ה-84 ש-`5.25rem`
       ניכה ⛔ אינם קיימים ⇒ `h-[100dvh]` מלא (אותו כלל ש-`F-278` אוכף על הקרב), ו-`pt-12`
       (48) — ⛔ ולא 92 שהיו משמרים את מקום הכותרת: שער «כותרת מעוגנת לראש» (`check:mobile`,
       ‏`F-011`, ‏≤48px) **קפוא**, ונמדד אדום על 92 בטיק הזה.
       ⛔ **וכל טוקן `globals` הוחלף בזה של הזירה** — `--ink` מתחלף לפי `prefers-color-scheme`,
       ובסכימה בהירה הוא דיו כהה על כחול־ליל. */
    <section data-arena-scope className="flex h-[100dvh] flex-col gap-6 overflow-hidden pt-12 pb-[max(0.5rem,env(safe-area-inset-bottom))]" data-surface="dark">
      {/* ‏y=128 · 34 Black · GOLD_LIGHT (`:602`) + ‏y=160 · 12.5 Medium · INK_MUTED (`:603`).
          ⛔ אין שבח ואין נזיפה (R-016): ניצחון = עובדה על היריב; כל סיום אחר = **מספר**
          (`37 § 9` ח4) ועובדה אחת על איך נגמר. ⛔ מילת הפסד ⛔ אינה כאן. */}
      <header className="flex flex-col items-center gap-0.5">
        <h1 className="text-center text-[34px] font-black leading-tight text-[color:var(--brand-surface)]">
          {ending.kind === 'victory' ? WON_HE : wordsFromBossHe(ending.wordsFromBoss)}
        </h1>
        {ending.kind !== 'victory' && (
          <p data-arena-ending className="text-center text-[12.5px] font-medium text-[color:var(--arena-ink-dim)]">
            {ending.kind === 'outlasted' ? OUTLASTED_HE : SURVIVED_HE}
          </p>
        )}
      </header>

      {/* 🥊 **`T-422` — האזור הגמיש, ו⛔ הוא ⛔ אינו «גלילה שהוחזרה מהדלת האחורית».**
          הכותרת למעלה וכפתור החזרה למטה הם **עוגנים**: הם ⛔ אינם זזים ו⛔ אינם נגללים.
          מה שביניהם — שלוש שורות הסיכום ושני הלוחות המותנים — הוא היחיד שאורכו תלוי
          בקרב, ⇒ הוא היחיד שמקבל `min-h-0 flex-1` ו-`overflow-y-auto`.
          ⇒ **הלומד רואה תמיד את «חזרה»**, גם כשהקרב ייצר שני לוחות מלאים ב-320px. */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      {/* שלוש שורות הסיכום. כל שורה נושאת **תווית עברית כתובה** — הצבע הוא הערוץ
          השני, ⛔ ולעולם לא היחיד (חוקה שכבה א׳). */}
      <ul data-arena-summary className="flex flex-col gap-2">
        <li className={ROW_CLASS} data-rtl-row="summary-stat">
          <span className="text-[13px] font-medium text-[color:var(--arena-ink)]">{CORRECT_HE}</span>
          <span dir="ltr" className="text-[15px] font-bold text-[color:var(--brand-surface)]">
            {summary.correct} / {summary.total}
          </span>
        </li>
        <li className={ROW_CLASS} data-rtl-row="summary-stat">
          <span className="text-[13px] font-medium text-[color:var(--arena-ink)]">{MEAN_HE}</span>
          <span dir="ltr" className="text-[15px] font-bold text-[color:var(--arena-ink)]">
            {meanSecondsHe(summary.meanResponseMs)}
          </span>
        </li>
        <li className={ROW_CLASS} data-rtl-row="summary-stat">
          <span className="text-[13px] font-medium text-[color:var(--arena-ink)]">{STREAK_HE}</span>
          <span dir="ltr" className="text-[15px] font-bold text-[color:var(--brand-surface)]">
            {summary.bestStreak}
          </span>
        </li>
        {replay !== null && (
          <li className={ROW_CLASS} data-rtl-row="summary-stat" data-arena-replay-tally>
            <span className="text-[13px] font-medium text-[color:var(--arena-ink)]">{REPLAY_HE}</span>
            <span className="text-[15px] font-bold text-[color:var(--arena-ink)]">
              {replayTallyHe(replay.fixed, replay.total)}
            </span>
          </li>
        )}
      </ul>

      {/* לוח ה«איטיות» — y=486 · h=66 · r=16 · DANGER (`:622-629`). ⛔ מוצג אך ורק כשיש
          מה להציג: לוח ריק הוא רעש, ⛔ לא מידע. */}
      {summary.slow.length > 0 && (
        <div data-arena-slow className={`${PANEL_CLASS} border border-[color:var(--arena-damage)] bg-[color:var(--arena-card)]`}>
          <p className="text-end text-[14px] font-bold text-[color:var(--arena-damage)]">
            {summary.slow.length} {SLOW_HE}
          </p>
          <p className="text-end text-[11.5px] leading-relaxed text-[color:var(--arena-ink)]">
            {summary.slow.map((c, i) => (
              <span key={c.wordId}>
                {i > 0 && ' · '}
                <EnWord>{headwords[c.wordId] ?? c.wordId}</EnWord>
              </span>
            ))}
          </p>
        </div>
      )}

      {/* T-282 · הלוח הכחול — y=562 · h=66 · r=16 · BRAND (`render_video_B.py:633-640`).
          ⛔ קריאה בלבד (`36 § 12.3`): הלוח **נוקב** במילים שהקרב הראה לראשונה, ו⛔ אינו
          עושה בהן דבר. ⛔ מוצג אך ורק כש-N>0 — אותו כלל של הלוח האדום. שורת השמות יושבת
          במשבצת של `הוסף לכרטיסיות` (`:639`) כי חצי הכתיבה חסום (`03-for-roy` 105), ובגודל
          12px ⛔ ולא 11.5 — רצפת שכבה א׳ (`scripts/check-text-floor.mjs`). ⛔ אין `○`.
          המילוי הוא `bg-brand-surface/15` ⛔ ולא גוון ישיר של `--brand` (α38 ברנדר) — שומר F-036
          (`lib/core/palette.test.ts`) אוסר את `brand` הבסיסי כמילוי בכל מסך; הכרעה הפיכה `RULES § 0.22`. */}
      {summary.firstMet.length > 0 && (
        <div data-arena-first-met className={`${PANEL_CLASS} border border-[color:var(--brand)] bg-[color:var(--arena-card)]`}>
          <p className="text-end text-[14px] font-bold text-[color:var(--arena-ink)]">
            {firstMetHe(summary.firstMet.length)}
          </p>
          <p className="text-end text-[12px] leading-relaxed text-[color:var(--arena-ink)]">
            {summary.firstMet.map((c, i) => (
              <span key={c.wordId}>
                {i > 0 && ' · '}
                <EnWord>{headwords[c.wordId] ?? c.wordId}</EnWord>
              </span>
            ))}
          </p>
        </div>
      )}

      </div>

      {/* ‏y=654 · h=56 (`:641-643`) — ✅ מעל רצפת 44px של שכבה א׳. */}
      <button
        type="button"
        data-arena-summary-back
        data-primary-action="true"
        className="inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl border-2 border-[color:var(--brand-surface)] bg-[color:var(--brand-surface)] px-5 text-[15.5px] font-black text-[color:var(--brand-on)] active:opacity-90"
        onClick={onBack}
      >
        {BACK_HE}
      </button>

      {/* ‏y=730 · 11 Regular · INK_MUTED (`:645-646`) — **הוא** אינווריאנט `37 § 13.1`
          אמור בקול, ולכן הוא נשלח מילה במילה. */}
      <p className="text-center text-[11px] leading-relaxed text-[color:var(--arena-ink-dim)]">{FOOTER_HE}</p>
    </section>
  );
}
