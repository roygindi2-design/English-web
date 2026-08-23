import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { latestCollected, type CollectedWord } from '@/lib/core/arcadeCollection';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * § 4.2יב · T-110 · D-053 — «המילים שאספתי». ⛔ **רשימה, ולא מנוע.**
 *
 * ⛔ הנתיב נוגע ב-`arcade_collected_words` בלבד, ומצטרף ל-`words`/`senses` אך ורק כדי
 * לשלוף כותרת ותרגום להצגה. ⛔ אין כאן תזמון, אין דירוג רמה, ואין ולו שדה אחד של הצד
 * הלימודי — הבידוד הזה הוא D-052, והוא נמדד בסריקת מקור ב-`route.test.ts`.
 *
 * ⚠️ **«הסתרה» היא דגל ⛔ ולא מחיקה (D-053):** לומד שהסתיר מילה יכול להחזיר אותה, ולכן
 * ⛔ אין `DELETE` בקובץ הזה בכלל.
 */

/**
 * ⛔ תקרת ביטוח על הקריאה, ⛔ ולא מגבלת מוצר ו⛔ לעולם אינה מוצגת — בדיוק כמו
 * `MAX_FEED_ROWS` ב-`app/api/world/posts/route.ts`. אוסף ארוך ⛔ אינו רשאי להפוך בקשה
 * אחת לקריאת טבלה בלתי-חסומה. כשיגיע דפדוף, הקבוע הזה הופך לגודל עמוד.
 */
const MAX_COLLECTED_ROWS = 200;

/** העמודות שהמסך מציג, ⛔ ותו לא. `select('*')` היה שולח למסך שדות שאינם עניינו. */
const COLLECTED_SELECT =
  'word_id, times_missed, first_seen_at, words!inner(headword, senses!inner(translation_he))';

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

/** GET /api/arcade/collected — see docs/api-contract.md */
export async function GET() {
  // סדר השומרים של C-0032: ENV ⇒ סשן ⇒ שאילתה.
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  const { data, error } = await supabase
    .from('arcade_collected_words')
    .select(COLLECTED_SELECT)
    .eq('user_id', user.id)
    .eq('hidden_by_learner', false)
    .order('first_seen_at', { ascending: false })
    .limit(MAX_COLLECTED_ROWS);
  if (error) {
    console.error('[api/arcade/collected] read failed:', error.message);
    return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  // ⚠️ הספירה הזאת היא כל ההבחנה בין «עוד לא אספת» לבין «הסתרת את כולן». בלעדיה שני
  // המצבים קורסים לאחד, והמסך אומר ללומד משפט שאינו נכון עליו.
  const { count, error: countError } = await supabase
    .from('arcade_collected_words')
    .select('word_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('hidden_by_learner', true);
  if (countError) {
    console.error('[api/arcade/collected] hidden count failed:', countError.message);
    return isSchemaMissing((countError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const words: CollectedWord[] = (data ?? []).map((row) => {
    const r = row as unknown as {
      word_id: string; times_missed: number | null; first_seen_at: string;
      words: { headword: string | null; senses: { translation_he: string | null }[] | null } | null;
    };
    const sense = (r.words?.senses ?? [])[0];
    return {
      wordId: r.word_id,
      headword: r.words?.headword ?? '',
      translationHe: sense?.translation_he ?? '',
      timesMissed: r.times_missed ?? 0,
      firstSeenAt: r.first_seen_at,
    };
  });

  // «המילה שאספת אתמול» (D-071ⓑ · T-133) — ⛔ **נגזרת מ-`words`, ⛔ ולא שאילתה שנייה.**
  // ⚠️ סטייה מדודה מ-`docs/superpowers/plans/2026-08-20-world-featured-and-pin.md` צעד 2.1,
  // ושתי סיבותיה נמדדו ⛔ ולא שוערו: ⓐ `words` כבר `first_seen_at desc` ומסונן
  // ל-`hidden_by_learner=false` ⇒ `words[0]` **הוא** הפריט האחרון הגלוי, ושאילתה שנייה
  // הייתה הלוך-חזור נוסף למאגר על אותו נתון · ⓑ השאילתה שהתוכנית מציעה מצטרפת ל-`words`
  // בלבד, ⛔ בלי `senses!inner` ⇒ מילה בלי תרגום הייתה מגיעה לפִּין ⛔ אך ⛔ נעדרת
  // מהאריח שהפִּין מוביל אליו. הגזירה מסגירה את הפער: מה שנכתב בפִּין ⛔ תמיד נמצא ברשימה.
  const latest = latestCollected(words);

  // ⛔ **`?` הוא חלק מהחוזה:** «אין פריט אחרון ⇒ ⛔ אין שדה» — היעדר הפִּין הוא המצב
  // הריק, ⛔ ולא כיתוב «אין מילים אתמול».
  return NextResponse.json({
    ok: true,
    words,
    hiddenCount: count ?? 0,
    ...(latest !== undefined ? { latest } : {}),
  });
}

/** ⛔ ולידציה מלאה ⛔ ולא cast: הגוף מגיע מהלקוח. */
function parseHideBody(value: unknown): { wordId: string; hidden: boolean } | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  if (typeof b.wordId !== 'string' || b.wordId.length === 0) return null;
  if (typeof b.hidden !== 'boolean') return null;
  return { wordId: b.wordId, hidden: b.hidden };
}

/** PATCH /api/arcade/collected — see docs/api-contract.md */
export async function PATCH(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  const body = parseHideBody(payload);
  if (body === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { wordId: 'לא הצלחנו לעדכן את הרשימה. נסה שוב.' } },
      { status: 422 },
    );
  }

  // ⛔ דגל, ⛔ ולא מחיקה. והסינון על הלומד הוא הגנה שנייה מעל RLS, ⛔ לא במקומה.
  const { error } = await supabase
    .from('arcade_collected_words')
    .update({ hidden_by_learner: body.hidden })
    .eq('user_id', user.id)
    .eq('word_id', body.wordId);
  if (error) {
    console.error('[api/arcade/collected] hide failed:', error.message);
    return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  return NextResponse.json({ ok: true, wordId: body.wordId, hidden: body.hidden });
}
