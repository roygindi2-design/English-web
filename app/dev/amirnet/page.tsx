import Link from 'next/link';

/**
 * `T-371`ⓐ — the harness INDEX for `amirnet`, and the one route in the department that
 * answered 404 while all six of its children answered 200.
 *
 * 🔬 **נמדד ב-`curl` על `next start`, ⛔ ולא הוסק:** `/dev/amirnet` ⇒ **404**, ששת ילדיו
 * ⇒ **200**. ל-`app/dev/story` יש עמוד כזה; למחלקה הזאת ⛔ לא היה. ⇒ הרתמה ⛔ מעולם
 * ⛔ לא ראתה את המחלקה — וששת המסכים האלה נעשים נגישים ללומד **בטיק הזה**, ב-`T-370`.
 *
 * ⛔ **⛔ אינו מסך מוצר, ⛔ אינו תוכן לימודי, ו⛔ אינו מקושר משום מקום** — אותה הצהרה
 * בדיוק שנושאים `app/dev/story/page.tsx` ו-`app/dev/world/page.tsx`. הכניסה של הלומד
 * למחלקה היא `/world/amirnet` דרך הטבעת (`T-370`), ⛔ ולא כאן.
 *
 * ⚠️ **ולמה אינדקס ו⛔ לא עמוד ריק:** ששת המסכים הם נתיבים ש**צריך לזכור**, ורשימה
 * שמונה אותם היא מה שהופך «לך תראה את אמירנט» לפעולה אחת. שלושה מהם (`dashboard` ·
 * `practice` · `simulation`) הם גם ברשימת ההליכה ב-`scripts/lib/walk-routes.mjs`,
 * והתווית «בהליכה» כאן אומרת בדיוק אילו — ⛔ כדי שהפער יהיה **נראה** במקום מוסק.
 *
 * ⚠️ **ה-`<code>` נושא `dir="ltr"`, ⛔ ולא בירושה מה-`<main>`:** נמדד בהליכה ב-375 לפני
 * התיקון — בתוך הקשר RTL הנתיב `/dev/amirnet/dashboard` נצבע **`dev/amirnet/dashboard/`**,
 * כי הלוכסן הפותח הוא תו נייטרלי ו-bidi מעיף אותו לקצה השני. ⇒ ריצת LTR מפורשת,
 * ⛔ ולא «זה רק לוכסן».
 *
 * ⛔ **⛔ אין כאן ולו מחרוזת אחת שלומד יכול ללמוד ממנה** (R-010 · R-013): שמות מסכים
 * בעברית ונתיבים, ⛔ ולא מילה באנגלית מחוץ ל-`<code>` של נתיב.
 */
const SCREENS: readonly {
  readonly href: string;
  readonly labelHe: string;
  readonly noteHe: string;
  readonly inWalk: boolean;
}[] = [
  {
    href: '/dev/amirnet/dashboard',
    labelHe: 'לוח הביצועים',
    noteHe: 'הנחיתה של המחלקה — ביצועים לפי סוג שאלה.',
    inWalk: true,
  },
  {
    href: '/dev/amirnet/practice',
    labelHe: 'תפריט התרגול',
    noteHe: 'בחירת סוג השאלה לתרגול ממוקד.',
    inWalk: true,
  },
  {
    href: '/dev/amirnet/question',
    labelHe: 'שאלת תרגול',
    noteHe: 'מצב ביניים בזרימת התרגול.',
    inWalk: false,
  },
  {
    href: '/dev/amirnet/simulation',
    labelHe: 'הסימולציה',
    noteHe: 'שישה פרקים, שעון נפרד לכל פרק.',
    inWalk: true,
  },
  {
    href: '/dev/amirnet/levels',
    labelHe: 'רמות הסימולציה',
    noteHe: 'מצב ביניים — הכניסה לסימולציה.',
    inWalk: false,
  },
  {
    href: '/dev/amirnet/result',
    labelHe: 'מסך התוצאה',
    noteHe: 'מצב ביניים — סוף ריצה של שישה פרקים.',
    inWalk: false,
  },
];

export default function DevAmirnetIndexPage() {
  return (
    <main dir="rtl" className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="text-xl font-semibold text-ink">אמירנט — מסכי הרתמה</h1>
      <p className="mt-2 text-sm text-ink-muted">
        שישה מסכים. שלושה מהם נמצאים ברשימת ההליכה, ושלושת האחרים הם מצבי ביניים של אותה
        זרימה.
      </p>
      <ul className="mt-5 flex flex-col gap-2">
        {SCREENS.map((screen) => (
          <li key={screen.href}>
            <Link
              href={screen.href}
              className="flex min-h-touch flex-col justify-center gap-1 rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 text-ink"
            >
              <span className="flex items-center gap-2">
                <span className="text-base font-medium">{screen.labelHe}</span>
                {screen.inWalk ? (
                  <span className="rounded-full border border-border-subtle px-2 py-0.5 text-xs text-ink-muted">
                    בהליכה
                  </span>
                ) : null}
              </span>
              <span className="text-sm text-ink-muted">{screen.noteHe}</span>
              <code dir="ltr" className="self-start text-xs text-ink-muted">
                {screen.href}
              </code>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
