import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { characterFromParts, type ArenaCharacter } from '@/lib/core/arenaCharacter';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * `GET /api/arcade/home` — T-181 · `37 § 12`. **המצב המתמיד של מסך הבית, ⛔ ותו לא.**
 *
 * ⛔ `37 § 13.1`: הזירה ⛔ אינה כותבת למנוע החזרות — הקובץ הזה ⛔ אינו כותב **כלל**.
 * ⛔ `D-052`: טבלת הפרופיל והצד הלימודי ⛔ אינם נקראים. ארבע עמודות, מטבלה אחת.
 * ⚠️ **T-217 · D-152 — העמודה הרביעית היא `avatar_parts`**, והגוף נושא ממנה
 * `character` אחד דרך `characterFromParts` (‏`lib/core/arenaCharacter.ts`) — `null` ללומד
 * שטרם בחר, ⇒ המעטפת פותחת את `בחירת דמות` לפני הקרב הראשון. ⛔ הנתיב נשאר קריאה בלבד.
 *
 * ⚠️ ⛔ **ושמות הטבלאות האסורות ⛔ אינם נכתבים כאן אפילו בהערה** — `route.test.ts` סורק
 * את הקובץ **גולמי**, ומילה בהערה הייתה מפילה שומר שאין לו ולו הפרה אחת (F-039).
 *
 * ⚠️ **שורה חסרה ⛔ אינה כישלון:** `0014_arcade.sql` נותן `arcade_level default 1` ו-`wins
 * default 0`, ולומד שטרם קרב ⛔ אין לו שורה. ⇒ אותן ברירות מחדל בדיוק מוחזרות כאן,
 * ⛔ ולא 503 — מסך בית ריק הוא **עובדה נכונה** על לומד חדש.
 *
 * ⛔ שלושת גופי הכשל הם אלה של `GET /api/arcade/collected` **מילה במילה** — ⛔ ואין רביעי.
 */
const HOME_SELECT = 'arcade_level, wins, unlocked_items, avatar_parts';

/**
 * ברירות המחדל של `0014_arcade.sql:24-27`, ⛔ מועתקות ⛔ ולא נבחרות: `arcade_level`
 * ‏`default 1` · `wins` `default 0` · `unlocked_items` `default '{}'`.
 */
const NEW_LEARNER = Object.freeze({
  arcadeLevel: 1,
  wins: 0,
  unlockedItems: Object.freeze([]) as readonly string[],
  character: null as ArenaCharacter | null,
});

function isSchemaMissing(code: string | undefined): boolean {
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}
function schemaMissing() {
  return NextResponse.json(
    { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
    { status: 503 },
  );
}
function unavailable() {
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}
function sessionExpired() {
  return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });
}

export async function GET() {
  // סדר השומרים של C-0032: ENV ⇒ סשן ⇒ שאילתה.
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  const { data, error } = await supabase
    .from('arcade_progress')
    .select(HOME_SELECT)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return isSchemaMissing(error.code) ? schemaMissing() : unavailable();

  return NextResponse.json({
    ok: true,
    arcadeLevel: data?.arcade_level ?? NEW_LEARNER.arcadeLevel,
    wins: data?.wins ?? NEW_LEARNER.wins,
    unlockedItems: data?.unlocked_items ?? NEW_LEARNER.unlockedItems,
    character: characterFromParts(data?.avatar_parts) ?? NEW_LEARNER.character,
  });
}
