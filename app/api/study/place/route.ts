import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseStudyPlaces, parseStudyTrackId } from '@/lib/core/studyPlace';
import { parseStudyModuleId } from '@/lib/core/studyTracks';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * `T-409` · **המקום שבו הלומד עצר במסלול** — חותמת ⓒ של `36 § 13.2` שורה 5.
 * ⛔ **סימנייה, ⛔ ולא התקדמות:** ⛔ אפס עמודה של SM-2 נכתבת כאן, ⛔ אפס ציון
 * ו⛔ אפס מונה. הנימוק המלא יושב ב-`supabase/migrations/0029_study_track_place.sql`
 * וב-`lib/core/studyPlace.ts`, ⛔ ולא משוכפל לכאן.
 *
 * ⛔ **ו⛔ אינו שער** (`R-017`): מה שנשמר כאן קובע על מה המסך **נפתח**, ⛔ ולעולם
 * לא מה מותר לפתוח.
 */

/** ⛔ שלושת הקודים ש-PostgREST מחזיר כשהטבלה/העמודה ⛔ אינה בסביבה הזאת. */
function isSchemaMissing(error: { code?: string }): boolean {
  const code = error.code;
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}

/**
 * ⛔ **טבלה חסרה ⛔ אינה כשל ללומד — בקריאה.** הרגרסיה היחידה היא שהמסך נפתח על
 * המסלול הראשון, כלומר בדיוק ההתנהגות שקדמה לשורה הזאת. ⇒ רשימה ריקה, ⛔ ולא 503:
 * ‏`<StudiesScreen>` ⛔ אינו צריך להבדיל בין «⛔ עוד לא היית בשום מקום» לבין «הטבלה
 * ⛔ עוד לא הוקמה», והצגת שגיאה על סימנייה הייתה רעש על מסך שעובד.
 * ⚠️ **ובכתיבה זה הפוך** — ראה `POST` למטה.
 */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const { data, error } = await supabase
    .from('study_track_place')
    .select('track_id, module_id, updated_at')
    .eq('user_id', user.id);

  if (error) {
    console.error('[api/study/place] read failed:', error.message);
    if (isSchemaMissing(error as { code?: string })) {
      return NextResponse.json({ ok: true, places: [] });
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, places: parseStudyPlaces(data) });
}

/**
 * ⓐ של השורה: «המיקום נכתב כשהפריט מתחיל או נגמר». המסך קורא לכאן בשני הרגעים
 * האלה בלבד, ⛔ ולא על כל הקשה על שבב — ⛔ סימנייה ⛔ אינה טלמטריה.
 *
 * ⛔ **הוולידציה אחרי בדיקת ה-session (דפוס C-0032)** — קורא לא מזוהה ⛔ אינו לומד
 * אילו ערכים מתקבלים.
 *
 * ⛔ **וטבלה חסרה ⛔ היא 503 כאן, ⛔ ולא `ok`** — בניגוד ל-`GET`: קריאה שנכשלה
 * מחזירה «⛔ אין מקום שמור», שזו אמת; כתיבה שנכשלה ומדווחת `ok: true` הייתה
 * **שקר מדיד** על מה שנשמר. ⛔ מה שהמסך עושה עם ה-503 הוא ⛔ כלום — ראה
 * `<StudiesScreen>`: סימנייה שלא נשמרה ⛔ לעולם ⛔ אינה עוצרת ניווט.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  // F-004: null, מערך ופרימיטיב כולם עוברים JSON.parse ומפילים את קריאת המאפיין ב-500.
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;

  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const trackId = parseStudyTrackId(body.trackId);
  if (trackId === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { trackId: 'בחר מסלול מתוך ארבעת המסלולים' } },
      { status: 422 },
    );
  }
  /**
   * ⛔ **מודול פסול מפיל את המודול, ⛔ ולא את הבקשה** — בדיוק כמו `parseStudyPlaceRow`:
   * «הייתי ב`הבנת הנקרא`» הוא מקום שלם, ושלושת המסלולים בלי תוכן ⛔ אין להם מודול
   * מלכתחילה (`36 § 9`).
   */
  const moduleId = parseStudyModuleId(body.moduleId);

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('study_track_place').upsert(
    { user_id: user.id, track_id: trackId, module_id: moduleId, updated_at: updatedAt },
    { onConflict: 'user_id,track_id' },
  );

  if (error) {
    console.error('[api/study/place] write failed:', error.message);
    if (isSchemaMissing(error as { code?: string })) {
      return NextResponse.json(
        { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, place: { trackId, moduleId, updatedAt } });
}
