/**
 * הסימן של «לא ידעתי» — ✕. **רכיב אחד, שני קוראים** (`T-388`, בדיוק כמו `LockIcon`
 * ב-`T-078`).
 *
 * 🔬 **למה הוא נולד, ⛔ ולא שוער:** הוא צויר בתוך `components/FilterBar.tsx`
 * (`CounterIcon`, ענף `unknown`) כשהוא משרת קורא **אחד**. ‏`T-388` הביא קורא שני —
 * אריח «חזרה» ב-`<DeckSelector>` — ו-«לא ידעתי» הוא **אותו מושג** בשניהם: המונה סופר
 * את המילים, והאריח פותח אותן לתרגול. ⇒ העתקת ה-`path` הייתה מושג אחד בשתי צורות,
 * כלומר חוקה § 6, ובדיוק מה ש-`components/DeckSelector.test.ts` נועל בשתי טענות
 * («⛔ No second copy of the artwork»).
 *
 * ⛔ **SVG מוטבע, ⛔ ולא תו ו⛔ לא אמוג׳י** (§ 6): המשקל והגובה של גליף מגיעים מהפונט
 * שפותר אותו, ⛔ ולא מהקוד. ‏`currentColor` בלי `fill` ⇒ הוא יורש את הטקסט שלידו
 * בשתי התמות, ⛔ ואין כאן hex שהפלטה ⛔ אינה מכירה.
 *
 * ⛔ **`aria-hidden` — הוא קישוט.** בשני הקוראים המילה שלידו («לא ידעתי» · «חזרה»)
 * כבר נושאת את המשמעות, ולומד שמשתמש בקורא מסך ⛔ אינו צריך לשמוע «איקס».
 *
 * ⛔ **⛔ אין `'use client'`**: סימון טהור בלי props ובלי state.
 */
export default function UnknownMarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
