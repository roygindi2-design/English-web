import WritingChain from '@/components/WritingChain';

// T-264 — the exact string `<WritingChain>`'s own `<h1>` already renders
// (`components/WritingChain.tsx` `HEADING_HE`); the suffix is `app/layout.tsx`'s
// `title.template`.
export const metadata = { title: 'שרשרת הכתיבה' };

/**
 * «שרשרת הכתיבה» — T-106 · § 4.2יב.
 *
 * ⛔ **אפס גישה לנתונים בקובץ הזה, ואותה הכרעה בדיוק כמו ב-`/world`:** `<WritingChain>`
 * קורא `GET /api/world/posts`, שכבר מבצע את סדר השמירה של C-0032 (ENV → סשן → שאילתה)
 * וכבר עונה `session_expired` כנתון. `getUser()` שני כאן היה בדיקת סשן שנייה שיכולה
 * לחלוק על הראשונה, וכל אפקט הנראה שלה היה הפניה שמתחרה בבקשה.
 *
 * המסלול יושב בתוך `(tabs)` ⇒ הוא כבר נושא את סרגל הלשוניות, ולכן ⛔ אין תחתיו
 * `<ActionBar>` (D-028: סרגל אחד למסך).
 *
 * ⛔ אין כאן גרף ואין מדד (⛔ לא `dataviz`), ⛔ אין רצף יומי (E4 · D-050) — הנימוק המלא
 * יושב בראש `components/WritingChain.tsx`.
 */
export default function WorldChainPage() {
  return <WritingChain />;
}
