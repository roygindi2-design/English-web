import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseLevel, summarizeLevel, type ProgressFacts } from '@/lib/core/levelSummary';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * תקרה על שורות ההתקדמות שנקראות, ⛔ לא על מה שמוצג. הרמה הגדולה במאגר היום היא
 * A1 עם 315 מילים (נמדד ב-`supabase/seed/0002_word_cefr_levels.sql`), כלומר התקרה
 * רחוקה פי שלושה מהמקסימום התאורטי — היא ביטוח מפני מאגר שגדל, ⛔ לא ציפייה.
 * שליפה שנחתכה בתקרה היא ספירה שגויה, ולכן היא 503 ו⛔ לא מספר קטן יותר.
 */
const MAX_PROGRESS_ROWS = 1000;

/**
 * `words!inner` מכוון: שורת התקדמות שהמילה שלה נמחקה אינה שייכת לשום רמה, ו-outer
 * join היה מכניס אותה לספירה של הרמה הנוכחית. הסינון הוא על `cefr_profile_band`
 * ולעולם לא על `senses.cefr_level` — השתיים חלוקות על 125 מתוך 343 שורות (D-034).
 */
const PROGRESS_SELECT = 'attempts, repetition, self_marked_known, words!inner(cefr_profile_band)';

type ProgressJoinRow = {
  attempts: number | null;
  repetition: number | null;
  self_marked_known: boolean | null;
};

/**
 * ⚠️ `42703` (undefined column) הוא **המצב הצפוי** עד שמיגרציה 0013 תורץ בייצור
 * (`03-for-roy` פריט 28): הטבלאות קיימות, העמודות לא. בלי הקוד הזה כאן הלומד היה
 * מקבל 503 גנרי «נסה שוב» על תקלה שאינה זמנית ולא תיפתר בניסיון חוזר.
 */
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

/** GET /api/levels/summary — see docs/api-contract.md */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[api/levels/summary] profile read failed:', profileError.message);
    return isSchemaMissing((profileError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  // ⛔ אין נפילה שקטה ל-A1. «טרם בחר» הוא מצב אמיתי (D-037), והמסך מכבד אותו
  // במצב בחירה — ⛔ לא בברירת מחדל שאיש לא הצהיר עליה.
  const level = parseLevel((profile as { current_level?: unknown } | null)?.current_level);
  if (level === null) return NextResponse.json({ ok: true, level: null });

  const { count, error: totalError } = await supabase
    .from('words')
    .select('id', { count: 'exact', head: true })
    .eq('cefr_profile_band', level);

  if (totalError) {
    console.error('[api/levels/summary] level size read failed:', totalError.message);
    return isSchemaMissing((totalError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const { data, error } = await supabase
    .from('word_progress')
    .select(PROGRESS_SELECT)
    .eq('user_id', user.id)
    .eq('words.cefr_profile_band', level)
    .limit(MAX_PROGRESS_ROWS);

  if (error) {
    console.error('[api/levels/summary] progress read failed:', error.message);
    return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const raw = (data ?? []) as unknown as ProgressJoinRow[];
  if (raw.length >= MAX_PROGRESS_ROWS) {
    // רשימה חתוכה מייצרת ספירה שנראית תקינה ואינה נכונה. עדיף מסך שאומר «לא הצלחנו»
    // מאשר מספר שקרי שהלומד יבנה עליו החלטה.
    console.error('[api/levels/summary] progress ceiling reached; counts would be wrong');
    return unavailable();
  }

  const rows: ProgressFacts[] = raw.map((row) => ({
    attempts: row.attempts ?? 0,
    repetition: row.repetition ?? 0,
    selfMarkedKnown: row.self_marked_known === true,
  }));

  try {
    // ⛔ הנתיב אינו סופר: הוא מוסר שורות ומקבל סיכום. ההגדרה חיה במקום אחד.
    const summary = summarizeLevel({ level, totalInLevel: count ?? 0, rows });
    return NextResponse.json({ ok: true, ...summary });
  } catch (rangeError) {
    console.error('[api/levels/summary] impossible counts:', (rangeError as Error).message);
    return unavailable();
  }
}
