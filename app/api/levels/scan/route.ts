import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  MAX_SCAN_WORDS,
  checkScanPayload,
  excludeSeen,
  sortScanWords,
  type ScanWord,
} from '@/lib/core/levelScan';
import { parseLevel } from '@/lib/core/levelSummary';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * סריקת רמה — D-041 · T-082 · § 4.2ז.
 *
 * ⛔ **הנתיב אינו מחשב ואינו סופר.** הוא שולף את מילות הרמה ואת מזהי ההתקדמות של
 * הלומד, ומוסר את שתיהן לשכבה הטהורה. הסינון «מה טרם נראה» חי ב-`lib/core/levelScan.ts`
 * בלבד, בדיוק כפי ששלוש הספירות חיות ב-`levelSummary.ts` בלבד.
 *
 * ⛔ **הכתיבה אינה נוגעת בְּמנוע החזרה המרווחת.** `self_marked_known` היא עמודה נפרדת
 * מפני שסימון עצמי ⛔ אינו חשיפה שנענתה, וכתיבתו כ-`repetition = 1` הייתה שקר לנוסחת
 * SM-2 (D-038). ⛔ אף עמודה של 7.1 אינה מופיעה בקובץ הזה.
 */

/**
 * תקרת ביטוח על רשימת «כבר נפגש», ⛔ ולא מגבלת מוצר — אותו קבוע ואותו נימוק כמו
 * `MAX_SEEN_ROWS` ב-`app/api/study/queue/route.ts`: הסינון נכון רק אם הרשימה שלמה,
 * ורשימה חתוכה הייתה מציעה לסריקה מילה שהלומד כבר פגש.
 */
const MAX_SEEN_ROWS = 1000;

/** ⛔ העמודות שהמסך מציג בלבד. `select('*')` היה שולח למסך שדות שאינם עניינו. */
const WORDS_SELECT = 'id, headword';

type WordRow = { id: string; headword: string | null };
type SeenRow = { word_id: string };

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

/** GET /api/levels/scan — see docs/api-contract.md */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[api/levels/scan] profile read failed:', profileError.message);
    return isSchemaMissing((profileError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  // ⛔ אין נפילה שקטה ל-A1. «טרם בחר» הוא מצב אמיתי (D-037), והמסך מכבד אותו.
  const level = parseLevel((profile as { current_level?: unknown } | null)?.current_level);
  if (level === null) return NextResponse.json({ ok: true, level: null });

  const [wordsResult, seenResult] = await Promise.all([
    supabase.from('words').select(WORDS_SELECT).eq('cefr_profile_band', level).limit(MAX_SCAN_WORDS),
    supabase.from('word_progress').select('word_id').eq('user_id', user.id).limit(MAX_SEEN_ROWS),
  ]);

  if (wordsResult.error || seenResult.error) {
    const failed = wordsResult.error ?? seenResult.error;
    console.error('[api/levels/scan] read failed:', failed?.message);
    return isSchemaMissing((failed as { code?: string } | null)?.code) ? schemaMissing() : unavailable();
  }

  const wordRows = (wordsResult.data ?? []) as unknown as WordRow[];
  const seenRows = (seenResult.data ?? []) as unknown as SeenRow[];

  // רשימה שנחתכה בתקרה היא רשימה חלקית: היא הייתה מציעה מילה שכבר נפגשה, או משמיטה
  // מילים מהרמה בלי לומר זאת. עדיף מסך שאומר «לא הצלחנו» מאשר סריקה שקרית.
  if (wordRows.length >= MAX_SCAN_WORDS || seenRows.length >= MAX_SEEN_ROWS) {
    console.error('[api/levels/scan] ceiling reached; the scan list would be incomplete');
    return unavailable();
  }

  const candidates: ScanWord[] = wordRows
    .filter((row): row is WordRow & { headword: string } => typeof row.headword === 'string' && row.headword.trim() !== '')
    .map((row) => ({ wordId: row.id, headword: row.headword.trim() }));

  const words = sortScanWords(excludeSeen(candidates, seenRows.map((row) => row.word_id)));

  return NextResponse.json({
    ok: true,
    level,
    total: words.length,
    words: words.map((word) => ({ word_id: word.wordId, headword: word.headword })),
  });
}

/**
 * ⛔ שלוש עמודות, ⛔ ותו לא. הקבוע נקרא `MARK` כדי שבדיקת המקור תוכל לחתוך אותו
 * במדויק ולטעון על **מה שנכתב**, ⛔ ולא על מה שמופיע איפשהו בקובץ.
 */
function markPayload(nowIso: string) {
  const MARK = {
    self_marked_known: true,
    self_marked_at: nowIso,
    updated_at: nowIso,
  };
  return MARK;
}

/** POST /api/levels/scan — see docs/api-contract.md */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  const check = checkScanPayload(await request.json().catch(() => null));
  // ⚠️ סטייה מהתוכנית, ⛔ ולא בחירה: התוכנית קראה `unavailable(400)`, והמחרוזת
  // `status: 400` ⛔ לא הופיעה בקובץ ⇒ בדיקת המקור «גוף פסול ⇒ 400, ⛔ לא 500» נפלה.
  // נכתב מפורשות, כמו `app/api/review/route.ts:85` ו-`app/api/levels/current/route.ts:21`.
  if (!check.ok) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  const wordIds = check.wordIds;

  const nowIso = new Date().toISOString();
  const MARK = markPayload(nowIso);

  // אילו מהמילים כבר יש להן שורה. ⛔ לא `upsert`: הוא היה חייב להצהיר מחדש על
  // `track_id`, ומקום שני שבו ברירת המחדל חיה הוא מקום שני שבו היא יכולה להיות
  // שגויה (D-016, אותו נימוק בדיוק כמו ב-`app/api/review/route.ts`).
  const { data: existing, error: existingError } = await supabase
    .from('word_progress')
    .select('word_id')
    .eq('user_id', user.id)
    .in('word_id', [...wordIds]);

  if (existingError) {
    console.error('[api/levels/scan] existing read failed:', existingError.message);
    return isSchemaMissing((existingError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const known = new Set(((existing ?? []) as unknown as SeenRow[]).map((row) => row.word_id));
  const toInsert = wordIds.filter((id) => !known.has(id));
  const toUpdate = wordIds.filter((id) => known.has(id));

  if (toInsert.length > 0) {
    const { error } = await supabase.from('word_progress').insert(
      toInsert.map((wordId) => ({
        user_id: user.id,
        word_id: wordId,
        first_seen_at: nowIso,
        ...MARK,
      })),
    );
    if (error) {
      console.error('[api/levels/scan] insert failed:', error.message);
      return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
    }
  }

  if (toUpdate.length > 0) {
    const { error } = await supabase
      .from('word_progress')
      .update(MARK)
      .eq('user_id', user.id)
      .in('word_id', toUpdate);
    if (error) {
      console.error('[api/levels/scan] update failed:', error.message);
      return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
    }
  }

  return NextResponse.json({ ok: true, marked: wordIds.length });
}
