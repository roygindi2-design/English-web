import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readDevUserGate } from '@/lib/supabase/devUser';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dev/session — D-057 · T-113.
 *
 * ⚠️ **התנגדות ה-PM וה-Critic נרשמה ונדחתה במפורש על ידי הבעלים** (D-057). זו
 * החלטת סיכון שרוי קיבל ב-19/08 וזו סמכותו.
 *
 * ⛔ **למה `GET` ולא `POST` (סטייה 3):** `POST` אינו נגיש משורת הכתובת — היה
 * מחייב `curl` עם ניהול קובץ עוגיות, ⛔ ולא סשן בדפדפן שרוי עובד בו. תופעת
 * הלוואי של `GET` מקובלת כאן כי השער נפתח **אך ורק** כאשר `NODE_ENV !==
 * 'production'` **וגם** שני משתני הסביבה הייעודיים קיימים — כלומר אך ורק על
 * מכונת הפיתוח של מי שהגדיר אותם בעצמו.
 *
 * ⛔ **ולמה ⛔ אין `signUp` כאן (סטייה 4):** יצירה תוכניתית אינה דטרמיניסטית
 * (`signUp` תחת "Confirm email" יכולה להחזיר משתמש בלי סשן), ונתיב שיודע
 * ליצור חשבונות הוא שטח תקיפה משמעותית גדול יותר מנתיב שיודע להיכנס לחשבון
 * קיים. ⇒ המשתמש **נוצר ביד, פעם אחת** ב-Supabase → Authentication → Users
 * (`plan/03-for-roy.md` פריט 36), והנתיב הזה מנסה להתחבר אליו בלבד.
 *
 * ⛔ אינו מסך ואינו יושב תחת נתיב ה-`dev` שנבנה לפיקסצ׳רים — הוא GET רגיל
 * תחת `app/api/`, ומחזיר 404 עירום כששער סגור, כך שבייצור הוא אינו נגיש
 * ואינו מסגיר שהפיצ׳ר קיים.
 */
export async function GET(request: Request) {
  const gate = readDevUserGate();
  if (!gate.open) return new NextResponse(null, { status: 404 });

  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const { error } = await supabase.auth.signInWithPassword(gate.credentials);

  if (error) {
    // ⛔ הודעת Supabase עצמה אינה נכנסת לגוף — הכלל הקיים "never puts the
    // database message in the response body". המחרוזת כאן נוקבת בצעד הידני
    // המדויק, ⛔ ולא ב"401 Unauthorized" גנרי.
    return NextResponse.json(
      {
        ok: false,
        code: 'dev_user_missing',
        message:
          'צור את המשתמש פעם אחת ב-Supabase → Authentication → Users, באותה כתובת ובאותה סיסמה שב-.env.local.',
      },
      { status: 401 }
    );
  }

  return NextResponse.redirect(new URL('/', request.url), 302);
}
