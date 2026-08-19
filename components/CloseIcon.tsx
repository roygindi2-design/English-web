/**
 * סימן הסגירה — אח של `components/LockIcon.tsx`, ומאותה סיבה בדיוק.
 *
 * ⛔ SVG מוטבע ולעולם לא תו ולא אמוג'י (חוקה § 6): משקלו וגובהו של גליף מגיעים מהגופן
 * שפותר אותו, ⛔ לא מהקוד — ו«✕» נראה אחרת בשלושת הגופנים של החוקה.
 * `currentColor` בלי `fill` ⇒ יורש את הטקסט שלידו בשני המצבים, ⛔ אפס hex.
 *
 * ⛔ בלי `aria-label`: השם הנגיש חי על הכפתור העוטף («סגור»), ואייקון שמכריז על עצמו
 * גורם לקורא מסך להקריא את אותו דבר פעמיים.
 *
 * ⚠️ T-087 («למסך מנת היום יש יציאה») תשתמש **בקובץ הזה** ⛔ ולא ב-SVG שני.
 */
export default function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
