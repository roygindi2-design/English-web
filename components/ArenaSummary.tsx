'use client';

import Link from 'next/link';
import ActionBar from '@/components/ActionBar';
import { ITEM_LABELS_HE } from '@/components/ArenaAvatar';
import EnWord from '@/components/EnWord';
import { ARCADE_MISSED_LIMIT } from '@/lib/core/arcadeResult';
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
 * אותו פריט 105. ⟦`T-517` · `D-302`⟧ ה-CTA הוא `עוד קרב`, והיציאה המשנית `חזרה לעולם` —
 * **המסך היחיד של סוף הקרב**, ⛔ ולא עוד מסך מעל `<ArenaResult>` (שני `h1`, שלוש פעולות
 * ששתיים מהן היו שני שמות לאותו `again`).
 *
 * ⚠️ **רדיוס שורת הסטטיסטיקה ברנדר הוא 13** (`:618-620`) — ⛔ **אינו** אחד מחמשת ערכי
 * הסולם (6 · 8 · 12 · 16). הקרוב בסולם הוא `xl` = 12 ⇒ סטייה **מדודה של 1px**, אותה צורה
 * בדיוק כמו `F-144`. ⛔ לא נצפתה — נמדדה.
 */

/**
 * 📖 ⟦`T-518` · `D-302`ⓒ⟧ שורה ב«המילים שהפילו אותך» — ⛔ ערך מוחזר לתצוגה, ⛔ ולא שורה
 * שנכתבת (D-047). הגיע מ-`<ArenaResult>` (נמחק). ⚠️ `headword` ⛔ אינו מגיע מהשרת:
 * `POST /api/arcade/result` מחזיר `{wordId, answer, chosen}`, והקרב מצליב את `wordId`.
 */
export interface ArenaMissed {
  readonly wordId: string;
  readonly headword: string;
  readonly answer: string;
  readonly chosen: string;
}

export interface ArenaSummaryProps {
  /** T-283 — three endings, ⛔ not a boolean. Computed by `endingOf` in `lib/core`. */
  readonly ending: ArenaEnding;
  readonly summary: ArenaSummaryData;
  /** wordId → headword. האנגלית ⛔ לעולם אינה מגיעה ללומד מחוץ ל-`<EnWord>`. */
  readonly headwords: Readonly<Record<string, string>>;
  /** «עוד קרב» — ⛔ מנקה מצב מקומי ומושך סיבוב חדש. ⛔ אינו ניווט (`T-517`). */
  readonly onAgain: () => void;
  /**
   * 🔁 `T-451` · `37 § 8` ק8 — כמה מילות «חזרה מהירה» תוקנו מתוך כמה שנענו.
   * ⛔ `null` ⇔ לא הייתה חזרה (אפס טעויות, או דילוג לפני תשובה ראשונה) ⇒ ⛔ אין שורה.
   * ⛔ אינו נוגע ב-`summary`: החזרה ⛔ אינה `cast`, ⇒ `נכונות` נשאר זהה בתו.
   */
  readonly replay?: { readonly fixed: number; readonly total: number } | null;
  /** 📖 `T-518` — המילים שהקרב הפיל בהן את הלומד; `[]` ⇒ ⛔ אין רשימה. */
  readonly missed?: readonly ArenaMissed[];
  /** 📖 `T-518` — הפריט שהקרב פתח, ⛔ `null` ⇔ לא נפתח דבר ⇒ ⛔ אין שורה. */
  readonly unlocked?: string | null;
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
// ⟦`T-517`⟧ שתי פעולות, ⛔ לא שלוש: `חזרה לזירה` ו-`עוד קרב` קראו שניהם ל-`again`.
const AGAIN_HE = 'עוד קרב';
/** T-253ⓐ · D-186 — היציאה חוזרת לטבעת, אותה תווית שצמתי הטבעת האחרים נושאים. */
const BACK_TO_WORLD_HE = 'חזרה לעולם';
const FOOTER_HE = 'הזירה לא שינתה דבר בהתקדמות הלמידה';
const UNLOCKED_HE = 'נפתח לך פריט חדש';
const MISSED_HEADING_HE = 'המילים שהפילו אותך';
const ANSWER_HE = 'התשובה';
const CHOSEN_HE = 'בחרת';

function labelOf(item: string | null): string | null {
  if (item === null) return null;
  const labels: Readonly<Record<string, string>> = ITEM_LABELS_HE;
  return labels[item] ?? null;
}

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
const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl border-2 border-[color:var(--brand-surface)] bg-[color:var(--brand-surface)] px-5 text-[15.5px] font-black text-[color:var(--brand-on)] active:opacity-90 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.97]';
const SECONDARY_ACTION_CLASS =
  'inline-flex min-h-touch w-full items-center justify-center rounded-2xl border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] px-5 py-3 text-[15px] font-medium text-[color:var(--arena-ink)] active:opacity-90 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.97]';
const PANEL_CLASS = 'flex min-h-[66px] flex-col justify-center gap-1 rounded-2xl px-4 py-3';

export default function ArenaSummary({
  ending,
  summary,
  headwords,
  onAgain,
  replay = null,
  missed = [],
  unlocked = null,
}: ArenaSummaryProps): React.JSX.Element {
  const unlockedLabel = labelOf(unlocked);
  // עד חמש שורות, והמספר מגיע מהקבוע ⛔ ולא כמספר בקוד (`arcadeResult.ts`).
  const missedRows = missed.slice(0, ARCADE_MISSED_LIMIT);
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
    /* 🏁 **⟦`T-517` · `D-302`⟧ ריפוד תחתון שמשלם על הרצועה הקבועה** — אותו `9.5rem` ש-`T-430`
       מדד על `<ArenaResult>` (רצועה של שני כפתורים בעמודה, `h=147`). */
    <section data-arena-scope className="flex h-[100dvh] flex-col gap-3 overflow-hidden pt-12 pb-[calc(9.5rem+env(safe-area-inset-bottom))]" data-surface="dark">
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

      {/* 📖 ⟦`T-518`⟧ הפריט שנפתח — **שורה אחת**, מעל האזור הגמיש, ⛔ רק כשנפתח דבר.
          ⛔ אין ניקוד ואין מספר מופשט (D-050): הפרס הוא שם הפריט. */}
      {unlockedLabel !== null && (
        <p data-arena-unlocked className={`${ROW_CLASS} text-[14px]`}>
          <span className="font-medium text-[color:var(--arena-ink)]">{UNLOCKED_HE}</span>
          <span className="font-bold text-[color:var(--brand-surface)]">{unlockedLabel}</span>
        </p>
      )}

      {/* 🥊 **`T-422` — האזור הגמיש, ו⛔ הוא ⛔ אינו «גלילה שהוחזרה מהדלת האחורית».**
          הכותרת למעלה וכפתור החזרה למטה הם **עוגנים**: הם ⛔ אינם זזים ו⛔ אינם נגללים.
          מה שביניהם — שלוש שורות הסיכום ושני הלוחות המותנים — הוא היחיד שאורכו תלוי
          בקרב, ⇒ הוא היחיד שמקבל `min-h-0 flex-1` ו-`overflow-y-auto`.
          ⇒ **הלומד רואה תמיד את «חזרה»**, גם כשהקרב ייצר שני לוחות מלאים ב-320px. */}
      {/* 📏 ⟦`C-0870` · זירה — עיצוב חופשי⟧ ‏`gap-3` (12) ⛔ ולא `gap-6` (24): הרנדר מרווח את הלוחות
          ‏~10px (`kol-B-07`, נמדד ב-3×), ו-24 דחפו את «המילים שהפילו אותך» מתחת לקצה האזור
          ב-390×844 (‏653 מול 649) — מה ש-`D-302`ⓒ הבטיח שיהיה גלוי. */}
      {/* 🌫️ ⟦`C-0872`⟧ `data-arena-scroll-edge` — הרשימה נמשכת מתחת לקצה ⇒ קצה דהוי, ⛔ לא חיתוך. */}
      <div data-arena-scroll data-arena-scroll-edge className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
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
          <p className="text-end text-[12px] leading-relaxed text-[color:var(--arena-ink)]">
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

      {/* 📖 ⟦`T-518` · `D-302`ⓒ · `36 § 12.3`⟧ **«המילים שהפילו אותך» עולות למסך הראשון.** עד
          היום הן ישבו במסך השני, מ-`y ≥ 100dvh` — החלק היחיד בסוף הקרב **שמלמד** היה החלק
          שהלומד רואה אחרון, אם בכלל. ⛔ העמוד ⛔ אינו נגלל: הרשימה בתוך האזור הגמיש.
          ⛔ **קריאה בלבד** — ⛔ אין `הוסף לכרטיסיות` (`for-roy` 152). כל צד נושא תווית עברית —
          צבע ⛔ לעולם אינו הערוץ היחיד. ⛔ מוצג רק כשיש החטאה: לוח ריק הוא רעש. */}
      {missedRows.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h2 className="text-start text-[14px] font-bold text-[color:var(--arena-ink)]">{MISSED_HEADING_HE}</h2>
          <ul data-arena-missed className="flex flex-col gap-2">
            {missedRows.map((row) => (
              <li key={row.wordId} className="flex flex-col gap-0.5 rounded-xl border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] px-4 py-2">
                <EnWord className="self-start text-[16px] font-bold text-[color:var(--arena-ink)]">{row.headword}</EnWord>
                <span className="text-[13px] text-[color:var(--arena-ink)]">
                  {ANSWER_HE}: {row.answer}
                </span>
                <span className="text-[13px] text-[color:var(--arena-ink-dim)]">
                  {CHOSEN_HE}: {row.chosen}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      </div>

      {/* ‏y=730 · Regular · INK_MUTED (`:645-646`) — **הוא** אינווריאנט `37 § 13.1` אמור
          בקול, ולכן הוא נשלח מילה במילה. ⟦`T-517`⟧ 12px ⛔ ולא 11 — רצפת שכבה א׳. */}
      <p className="text-center text-[12px] leading-relaxed text-[color:var(--arena-ink-dim)]">{FOOTER_HE}</p>

      {/* 🏁 ‏y=654 · h=56 (`:641-643`) — ✅ מעל רצפת 44px. ⟦`T-517`⟧ רצועה **אחת**, שתי פעולות:
          ראשית `עוד קרב`, משנית `חזרה לעולם`. לחיצה מתכווצת ל-0.97 (160ms, ease-out) — משוב
          שהממשק שמע, ⛔ ורק תחת `motion-safe`. */}
      <ActionBar layout="stacked">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            data-arena-again
            data-primary-action="true"
            className={PRIMARY_ACTION_CLASS}
            onClick={onAgain}
          >
            {AGAIN_HE}
          </button>
          <Link data-arena-back href="/world" className={SECONDARY_ACTION_CLASS}>
            {BACK_TO_WORLD_HE}
          </Link>
        </div>
      </ActionBar>
    </section>
  );
}
