'use client';

import EnWord from '@/components/EnWord';
import { meanSecondsHe, type ArenaSummary as ArenaSummaryData } from '@/lib/core/arenaSummary';

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
 * ⛔ **ארבעה בלוקים שהרנדר מצייר ⛔ אינם כאן, וזו סטייה מוצהרת ⛔ ולא שכחה** — § 7 של
 * `docs/superpowers/plans/2026-08-27-arena-slice-c-results-and-idle.md` נושא לכל אחד את
 * המספר שנמדד: ⓐ `רמת זירה 7 · +48 XP` (`:604`) — ⛔ אין כלל XP ו⛔ אין עמודה (F-151) ·
 * ⓑ `תיבת ניצחון` (`:606-617`) — אותו שורש · ⓒ `פגשת 4 מילים חדשות` (`:631-640`) —
 * ⛔ אין מקור נתונים · ⓓ ה-CTA `הוסף הכול וחזור לזירה` (`:643`) — חצי הכתיבה חסום
 * ב-F-140, ולכן ה-CTA נשלח כ-`חזור לזירה` (מחרוזת ממשק, ⛔ לא תוכן לימודי).
 *
 * ⚠️ **רדיוס שורת הסטטיסטיקה ברנדר הוא 13** (`:618-620`) — ⛔ **אינו** אחד מחמשת ערכי
 * הסולם (6 · 8 · 12 · 16). הקרוב בסולם הוא `xl` = 12 ⇒ סטייה **מדודה של 1px**, אותה צורה
 * בדיוק כמו `F-144`. ⛔ לא נצפתה — נמדדה.
 */

export interface ArenaSummaryProps {
  readonly enemyDefeated: boolean;
  readonly summary: ArenaSummaryData;
  /** wordId → headword. האנגלית ⛔ לעולם אינה מגיעה ללומד מחוץ ל-`<EnWord>`. */
  readonly headwords: Readonly<Record<string, string>>;
  /** «חזור לזירה». ⛔ אינה הכרעת ניווט — הקורא הוא שמחזיק את היעד. */
  readonly onBack: () => void;
}

const WON_HE = 'היריב נוצח';
const OVER_HE = 'הקרב נגמר';
const CORRECT_HE = 'נכונות';
const MEAN_HE = 'זמן תגובה ממוצע';
const STREAK_HE = 'רצף מרבי';
const SLOW_HE = 'מילים היו איטיות';
// D-187 §ג׳.2 — צורת הפועל של שם יציאה היא `חזרה`, ⛔ לא `חזור`; זה היה היחיד
// מ-13 אתרי היציאה בעץ שסטה.
const BACK_HE = 'חזרה לזירה';
const FOOTER_HE = 'הזירה לא שינתה דבר בהתקדמות הלמידה';

/* ‏y=318 · 370 · 422 ⇒ פסיעה 52 על גובה 44 ⇒ מרווח 8px = `gap-2`. */
const ROW_CLASS =
  'flex min-h-[44px] flex-row-reverse items-center justify-between rounded-xl border border-border-subtle bg-surface-raised px-4';
/* ‏x=24 ⇒ `px-6`; ‏LW-48=327 ⇒ הרוחב נגזר, ⛔ ולא נכתב. */
const PANEL_CLASS = 'flex min-h-[66px] flex-col justify-center gap-1 rounded-2xl px-4 py-3';

export default function ArenaSummary({
  enemyDefeated,
  summary,
  headwords,
  onBack,
}: ArenaSummaryProps): React.JSX.Element {
  return (
    <section className="flex min-h-[100dvh] flex-col gap-6 px-6 pb-8 pt-10">
      {/* ‏y=128 · 34 Black · GOLD_LIGHT (`:602`). ⛔ אין שבח ואין נזיפה (R-016). */}
      <h1 className="text-center text-[34px] font-black leading-tight text-[color:var(--arena-gold-light)]">
        {enemyDefeated ? WON_HE : OVER_HE}
      </h1>

      {/* שלוש שורות הסיכום. כל שורה נושאת **תווית עברית כתובה** — הצבע הוא הערוץ
          השני, ⛔ ולעולם לא היחיד (חוקה שכבה א׳). */}
      <ul data-arena-summary className="flex flex-col gap-2">
        <li className={ROW_CLASS}>
          <span className="text-[13px] font-medium text-ink">{CORRECT_HE}</span>
          <span dir="ltr" className="text-[15px] font-bold text-success">
            {summary.correct} / {summary.total}
          </span>
        </li>
        <li className={ROW_CLASS}>
          <span className="text-[13px] font-medium text-ink">{MEAN_HE}</span>
          <span dir="ltr" className="text-[15px] font-bold text-brand-surface">
            {meanSecondsHe(summary.meanResponseMs)}
          </span>
        </li>
        <li className={ROW_CLASS}>
          <span className="text-[13px] font-medium text-ink">{STREAK_HE}</span>
          <span dir="ltr" className="text-[15px] font-bold text-[color:var(--arena-gold-light)]">
            {summary.bestStreak}
          </span>
        </li>
      </ul>

      {/* לוח ה«איטיות» — y=486 · h=66 · r=16 · DANGER (`:622-629`). ⛔ מוצג אך ורק כשיש
          מה להציג: לוח ריק הוא רעש, ⛔ לא מידע. */}
      {summary.slow.length > 0 && (
        <div data-arena-slow className={`${PANEL_CLASS} border border-danger bg-danger/15`}>
          <p className="text-end text-[14px] font-bold text-danger">
            {summary.slow.length} {SLOW_HE}
          </p>
          <p className="text-end text-[11.5px] leading-relaxed text-ink">
            {summary.slow.map((c, i) => (
              <span key={c.wordId}>
                {i > 0 && ' · '}
                <EnWord>{headwords[c.wordId] ?? c.wordId}</EnWord>
              </span>
            ))}
          </p>
        </div>
      )}

      {/* ‏y=654 · h=56 (`:641-643`) — ✅ מעל רצפת 44px של שכבה א׳. */}
      <button
        type="button"
        data-arena-summary-back
        data-primary-action="true"
        className="inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-brand-surface px-5 text-[15.5px] font-bold text-brand-on active:opacity-90"
        onClick={onBack}
      >
        {BACK_HE}
      </button>

      {/* ‏y=730 · 11 Regular · INK_MUTED (`:645-646`) — **הוא** אינווריאנט `37 § 13.1`
          אמור בקול, ולכן הוא נשלח מילה במילה. */}
      <p className="text-center text-[11px] leading-relaxed text-ink-muted">{FOOTER_HE}</p>
    </section>
  );
}
