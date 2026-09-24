import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { planArcadeWrites, type ArcadeAnswer, type ArcadeBattleReport } from '@/lib/core/arcadeResult';
import { ENEMY_HP } from '@/lib/core/battle';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

const MAX_ANSWERS = 64;

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

/** ⛔ ולידציה מלאה ⛔ ולא cast: הגוף מגיע מהלקוח, ותשובה מזויפת ⛔ אינה רשאית להפיל 500. */
function parseAnswers(value: unknown): ArcadeAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ANSWERS) return null;
  const out: ArcadeAnswer[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null;
    const a = item as Record<string, unknown>;
    if (typeof a.wordId !== 'string' || a.wordId.length === 0) return null;
    if (typeof a.correct !== 'boolean') return null;
    if (typeof a.chosen !== 'string' || typeof a.answer !== 'string') return null;
    out.push({ wordId: a.wordId, correct: a.correct, chosen: a.chosen, answer: a.answer });
  }
  return out;
}

/**
 * F-092 · ⛔ «מחרוזת כלשהי» ⛔ אינה מפתח. הצורה נבדקת כדי שהאינדקס הייחודי
 * יקבל בדיוק סוג ערך אחד, ולא יתפוצץ ב-`22P02` (invalid input syntax for uuid)
 * שהיה מוחזר ללומד כ-503 במקום כ-422.
 */
/**
 * 🏆 **T-450 · `D-278`ⓐ — תוצאת המנוע, נבדקת בטיפוסה.** ⛔ אין cast עיוור: כל שדה נבדק,
 * ו-`enemyHp` מחוץ ל-`[0, ENEMY_HP]` הוא גוף פגום. ⛔ **והערך ⛔ אינו מוחלט:**
 * `isEngineVictory` (`lib/core/arcadeResult.ts`) בודקת מולו רצפה לפי מספר הנכונות.
 */
function parseBattle(value: unknown): ArcadeBattleReport | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;
  if (b.outcome !== 'victory' && b.outcome !== 'survived' && b.outcome !== 'outlasted') return null;
  if (typeof b.enemyHp !== 'number' || !Number.isInteger(b.enemyHp)) return null;
  if (b.enemyHp < 0 || b.enemyHp > ENEMY_HP) return null;
  if (typeof b.learnerHp !== 'number' || !Number.isInteger(b.learnerHp)) return null;
  if (b.character !== null && (typeof b.character !== 'string' || b.character.length > 32)) return null;
  return { outcome: b.outcome, enemyHp: b.enemyHp, learnerHp: b.learnerHp, character: b.character };
}

const RUN_ID_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function parseRunId(value: unknown): string | null {
  return typeof value === 'string' && RUN_ID_UUID_RE.test(value) ? value : null;
}

/** POST /api/arcade/result — see docs/api-contract.md */
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
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // ולידציה אחרי בדיקת ה-session (דפוס C-0032).
  // ⛔ הסף ⛔ אינו מגיע מהגוף (D-059), ⛔ וגם ⛔ אינו קבוע (D-067ⓑ): לקוח ששלח 1 היה
  // מנצח בתשובה נכונה אחת. `planArcadeWrites` גוזר אותו מ-`max(answers.length, ARCADE_AMMO)`.
  const answers = parseAnswers(body.answers);
  if (answers === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { answers: 'הקרב לא נשמר. נסה שוב.' } },
      { status: 422 },
    );
  }

  const battle = parseBattle(body.battle);
  if (battle === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { battle: 'הקרב לא נשמר. נסה שוב.' } },
      { status: 422 },
    );
  }

  const runId = parseRunId(body.runId);
  if (runId === null) {
    return NextResponse.json(
      { ok: false, fieldErrors: { runId: 'הקרב לא נשמר. נסה שוב.' } },
      { status: 422 },
    );
  }

  // F-092 · הגנה ⓐ — המסלול הנפוץ: שידור חוזר אחרי נפילת רשת. התשובה שנשלחה
  // בפעם הראשונה מוחזרת כמות שהיא, ⛔ בלי אף כתיבה ו⛔ בלי חישוב שני.
  const { data: priorRun, error: priorError } = await supabase
    .from('arcade_runs')
    .select('response_snapshot')
    .eq('user_id', user.id)
    .eq('run_id', runId)
    .maybeSingle();
  if (priorError) {
    console.error('[api/arcade/result] prior run read failed:', priorError.message);
    return isSchemaMissing((priorError as { code?: string }).code) ? schemaMissing() : unavailable();
  }
  const priorSnapshot = (priorRun as { response_snapshot?: unknown } | null)?.response_snapshot;
  if (priorSnapshot) return NextResponse.json(priorSnapshot);

  const { data: current, error: readError } = await supabase
    .from('arcade_progress')
    .select('arcade_level, wins, unlocked_items')
    .eq('user_id', user.id)
    .maybeSingle();
  if (readError) {
    console.error('[api/arcade/result] progress read failed:', readError.message);
    return isSchemaMissing((readError as { code?: string }).code) ? schemaMissing() : unavailable();
  }
  const row = current as { arcade_level?: number; wins?: number; unlocked_items?: string[] } | null;

  // T-109 · הכרעה א׳ — האוסף נקרא **לפני** בניית התוכנית: `times_correct` עולה אך ורק
  // על מפתח שכבר קיים, ובלי הקריאה הזאת התנאי הזה היה מת. הסינון מצומצם למילים של
  // הקרב הזה בלבד ⛔ ואינו מושך את כל האוסף.
  const { data: collectedRows, error: collectedError } = await supabase
    .from('arcade_collected_words')
    .select('word_id, times_missed, times_correct')
    .eq('user_id', user.id)
    .in('word_id', answers.map((a) => a.wordId));
  if (collectedError) {
    console.error('[api/arcade/result] collection read failed:', collectedError.message);
    return isSchemaMissing((collectedError as { code?: string }).code) ? schemaMissing() : unavailable();
  }
  const collectedBefore = ((collectedRows ?? []) as {
    word_id: string; times_missed: number; times_correct: number;
  }[]).map((c) => ({ wordId: c.word_id, timesMissed: c.times_missed, timesCorrect: c.times_correct }));

  // ⛔ הנתיב אינו מחשב: הוא מקבל תוכנית כתיבה ומחיל אותה. D-044 חי בשכבה הטהורה,
  // ו-`ArcadeWriteRow['table']` הוא הטיפוס שאינו מרשה שם טבלה שלישי.
  const plan = planArcadeWrites({
    userId: user.id,
    runId,
    answers,
    before: {
      gameLevel: row?.arcade_level ?? 1,
      wins: row?.wins ?? 0,
      unlockedItems: row?.unlocked_items ?? [],
    },
    collectedBefore,
    battle,
    finishedAt: new Date().toISOString(),
  });

  for (const write of plan.rows) {
    // ⛔ המפתח הראשי של `arcade_collected_words` הוא (user_id, word_id) — upsert על
    // `user_id` לבדו היה דורס את כל אוסף הלומד בשורה אחת.
    const { error } = write.table === 'arcade_progress'
      ? await supabase.from('arcade_progress').upsert(write.values, { onConflict: 'user_id' })
      : write.table === 'arcade_collected_words'
        ? await supabase.from('arcade_collected_words').upsert(write.values, { onConflict: 'user_id,word_id' })
        : await supabase.from('arcade_runs').insert(write.values);
    if (error) {
      // F-092 · הגנה ⓑ — שני שידורים **בו-זמנית**, שבהם הגנה ⓐ קוראת ריק בשניהם.
      // `arcade_runs` היא הכתיבה **הראשונה** (‏`planArcadeWrites`), ולכן התנגשות כאן
      // עוצרת לפני ש-`arcade_progress` ניפח את `wins`. ⛔ `continue` היה מותיר בדיוק
      // את הפגם המקורי.
      if ((error as { code?: string }).code === '23505') {
        const { data: winner } = await supabase
          .from('arcade_runs')
          .select('response_snapshot')
          .eq('user_id', user.id)
          .eq('run_id', runId)
          .maybeSingle();
        const snapshot = (winner as { response_snapshot?: unknown } | null)?.response_snapshot;
        return NextResponse.json(snapshot ?? plan.response);
      }
      console.error(`[api/arcade/result] ${write.table} write failed:`, error.message);
      return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
    }
  }

  // ⛔ «המילים שהפילו אותך» חוזר ללקוח ⛔ ואינו נשמר (D-047).
  // F-092 · ⛔ הגוף ⛔ אינו נבנה כאן: הוא **אותו אובייקט** שנשמר ב-`response_snapshot`,
  // ולכן שידור ראשון ושידור חוזר מחזירים בית-בבית את אותו דבר.
  return NextResponse.json(plan.response);
}
