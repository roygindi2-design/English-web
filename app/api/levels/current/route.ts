import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseLevel } from '@/lib/core/levelSummary';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * הרמה שהלומד בוחר לעצמו (D-037 — ⛔ אין סף, אין נעילה, אין שער אחוזים; המוצר סופר
 * ואינו שופט). נתיב עצמאי ו⛔ לא הרחבה של POST /api/profile: הוולידטור שם שייך לטופס
 * ההצטרפות, וכל בחירת רמה הייתה כותבת מחדש גם onboarded_at.
 *
 * ⛔ שום עמודה של SM-2 אינה נכתבת כאן. החלפת רמה משנה מה **נספר**, ⛔ ולא את מצב
 * החזרות של אף מילה.
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

  // ולידציה אחרי בדיקת ה-session (דפוס C-0032), ודרך parseLevel — שש הרמות מוגדרות
  // במקום אחד בלבד, אותו מקום שהמיגרציה מהדהדת ב-check שלה.
  const level = parseLevel(body.level);
  if (level === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { level: 'בחר רמה מתוך שש הרמות' } },
      { status: 422 },
    );
  }

  const { error } = await supabase
    .from('profiles')
    .update({ current_level: level, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[api/levels/current] update failed:', error.message);
    const code = (error as { code?: string }).code;
    if (code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204') {
      return NextResponse.json(
        { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, level });
}
