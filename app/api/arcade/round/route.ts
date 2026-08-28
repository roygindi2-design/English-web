import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { describeLevel, gameLevelAt } from '@/lib/core/arcadeLadder';
import { buildRound, type ArcadeCandidate } from '@/lib/core/arcadeRound';
// ⛔ `parseLevel` כאן ממפה את `words.cefr_profile_band` של המועמדים בלבד — ⛔ ולא פרופיל.
import { parseLevel } from '@/lib/core/levelSummary';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** תקרה על שורות המילים שנקראות. A1 היא 315 מילים היום; התקרה היא ביטוח, ⛔ לא ציפייה. */
const MAX_LEVEL_ROWS = 1000;

/**
 * ⛔ הסינון הוא `words.cefr_profile_band` ולעולם לא `senses.cefr_level` — השתיים חלוקות
 * על 125 מתוך 343 שורות (D-034). ⛔ `!inner` על `senses`: מילה בלי משמעות אינה פריט קרב,
 * ו-outer join היה מכניס אותה ואז מדלג עליה בשקט בשכבה הטהורה.
 *
 * ⚠️ **T-212 · D-129 — `sense_distractors` ⛔ אינו `!inner` עוד.** T-152 העבירה את ארבע
 * האפשרויות לתרגומים עבריים מהרמה, ו-`isEligible` **חדל** לדרוש מסיחים אנגליים ⇒ הצומת
 * סינן על נתון ש⛔ אינו נדרש. **המספר, ⛔ ולא ההערכה:** על 13 קובצי האצווה — 713 שורות,
 * 713 עם תרגום, 713 עם ≥3 מסיחים ⇒ **0 שורות מושפעות היום**. הוא יורד כי ברגע ש-T-153
 * תזמין `distractors_he`, שורה עם תרגום ובלי מסיחים אנגליים הייתה **נעלמת מהזירה בשקט**
 * ו-`describeLevel` היה נועל רמה על נתון שהלומד ⛔ אינו רואה. **סוגר את F-146.**
 */
const ROUND_SELECT =
  'id, headword, cefr_profile_band, ngsl_rank, ' +
  'senses!inner(translation_he, translation_confidence, sense_distractors(distractor))';

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

/** GET /api/arcade/round — see docs/api-contract.md */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // ⛔ **קריאה בלבד.** אין בקובץ הזה `.update(`, `.insert(`, `.upsert(` — נאכף בבדיקה.
  const { data: progressRow, error: progressError } = await supabase
    .from('arcade_progress')
    .select('arcade_level')
    .eq('user_id', user.id)
    .maybeSingle();
  if (progressError) {
    console.error('[api/arcade/round] arcade progress read failed:', progressError.message);
    return isSchemaMissing((progressError as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const gameLevel = (progressRow as { arcade_level?: number } | null)?.arcade_level ?? 1;
  const rung = gameLevelAt(gameLevel);
  // ⛔ רמה מחוץ לסולם היא שורה פגומה בדאטהבייס, ⛔ לא מצב לומד: נופלים לרמה 1 ⛔ ולא
  // ל-503, כי הזירה אינה כלי אבחון ולומד ⛔ אינו רואה מסך שגיאה על מונה.
  const band = (rung ?? gameLevelAt(1))?.band ?? 'A1';

  /**
   * `37 § 13.3` — הזירה **קוראת** את רשימת המילים הידועות. ⛔ קריאה, ⛔ ולעולם לא כתיבה:
   * ⛔ אין בקובץ `.insert(` · `.update(` · `.upsert(` · `.delete(`, ונאכף בסריקת מקור.
   * ⛔ **D-052 ⛔ אינו נפגע** — ה-`band` עדיין נגזר מ-`arcade_level` בלבד; מה שהשורות האלה
   * קובעות הוא **אילו מילים בתוך ה-band** נבחרות, ⛔ ולא איזה band.
   * ⛔ ⛔ אין כאן ולו שם אחד של שדה SM-2 — שתי עמודות, ובלבד.
   */
  const { data: progressWords, error: progressWordsError } = await supabase
    .from('word_progress')
    .select('word_id, self_marked_known')
    .eq('user_id', user.id);
  if (progressWordsError) {
    console.error('[api/arcade/round] progress read failed:', progressWordsError.message);
    return isSchemaMissing((progressWordsError as { code?: string }).code)
      ? schemaMissing()
      : unavailable();
  }
  const touchedWordIds = new Set<string>();
  const knownWordIds = new Set<string>();
  for (const row of (progressWords ?? []) as unknown as {
    word_id: string;
    self_marked_known: boolean | null;
  }[]) {
    touchedWordIds.add(row.word_id);
    if (row.self_marked_known === true) knownWordIds.add(row.word_id);
  }

  const { data, error } = await supabase
    .from('words')
    .select(ROUND_SELECT)
    .eq('cefr_profile_band', band)
    .order('ngsl_rank', { nullsFirst: false })
    .order('id')
    .limit(MAX_LEVEL_ROWS);
  if (error) {
    console.error('[api/arcade/round] level read failed:', error.message);
    return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const candidates: ArcadeCandidate[] = (data ?? []).map((row) => {
    const r = row as unknown as {
      id: string; headword: string | null;
      cefr_profile_band: string | null; ngsl_rank: number | null;
      senses: { translation_he: string | null; translation_confidence: string | null;
                sense_distractors: { distractor: string | null }[] | null }[] | null;
    };
    // ⛔ D-013: תרגום בביטחון נמוך לעולם אינו מוצג ללומד. המשמעות הראשונה שאינה low.
    const sense = (r.senses ?? []).find((s) => s.translation_confidence !== 'low');
    return {
      wordId: r.id,
      headword: r.headword ?? '',
      band: parseLevel(r.cefr_profile_band),
      ngslRank: r.ngsl_rank,
      translationHe: sense?.translation_he ?? '',
      distractorsEn: (sense?.sense_distractors ?? [])
        .map((d) => d.distractor ?? '')
        .filter((d) => d.length > 0),
    };
  });

  // ⛔ הנתיב אינו מסנן ואינו מגריל: הוא מוסר מועמדים ומקבל סיבוב. ⛔ ואין כאן `Math.random`
  // — ה-seed נגזר מהשעה, כך שהסיבוב ניתן לשחזור מהתשובה עצמה.
  const seed = Date.now() >>> 0;
  const round = buildRound({
    gameLevel: rung === null ? 1 : gameLevel,
    candidates,
    seed,
    knownWordIds,
    touchedWordIds,
  });

  if (!round.ok) {
    const eligible = round.reason === 'level_too_small' ? round.eligible : 0;
    // ⛔ לא מסך ריק ו⛔ לא בשקט: מספר (D-046 · § 4.2י «נדרשות 12 מילים ברמה, יש 8»).
    return NextResponse.json({
      ok: true, gameLevel, band, round: null,
      ...describeLevel(gameLevel, eligible),
      reason: round.reason,
    });
  }
  return NextResponse.json({
    ok: true, gameLevel: round.gameLevel, band: round.band, seed,
    round: { questions: round.questions },
  });
}
