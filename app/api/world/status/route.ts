import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseLevel } from '@/lib/core/levelSummary';
import { STORIES_PER_LEVEL } from '@/lib/core/storyGate';
import { isWorldUnlocked, uniqueHeadwords } from '@/lib/core/world';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';
import {
  flattenJoinedHeadwords,
  type HeadwordRow,
  type JoinedHeadwordRow,
} from '@/lib/supabase/postgrest';

export const dynamic = 'force-dynamic';

/**
 * HEURISTIC — POLICY, ⛔ not evidence, and it lives here for the same reason
 * PROMOTE_AFTER_CONSECUTIVE_CORRECT does in app/api/study/queue/route.ts: a constant
 * exported from /lib/core is cited later as if the pure layer had derived it. D-031 states
 * outright that 12 is a product threshold measured off our own 403 approved sentences
 * (median length 10 words), ⛔ has no pedagogical source, and ⛔ must never be written into
 * plan/10-pedagogy.md. Changing either number needs no migration.
 */
const MIN_FUNCTION_WORDS = 100;
const MIN_ACTIVE_WORDS = 12;

/**
 * HEURISTIC ceiling, and it binds BOTH reads. `words` is `unique (headword, pos)`, so one
 * headword can hold several rows and a row count would OVERSTATE the bank (measured C-0092:
 * 121 headwords across 139 senses). PostgREST cannot express `count(distinct headword)`, so
 * the dedupe happens in the pure layer and this is the ceiling on what we are willing to
 * read to do it. ⛔ A `head: true` exact count would report rows, ⛔ not headwords.
 *
 * ⚠️ The learner side is bounded by the same number for the same reason (F-040), and the
 * truncation is safe in ONE direction only: a learner with more than 2000 active progress
 * rows is far past MIN_ACTIVE_WORDS, so a truncated read can only UNDERSTATE them and ⛔
 * can never open the gate early. The inverse — an unbounded read — is how a route starts
 * paging a learner's whole history to answer a boolean.
 */
const MAX_BANK_ROWS = 2000;

/**
 * ⛔ **הסף ⛔ אינו קבוע שני.** § 4.2יג נוקבת ב-«≥3 סיפורים ברמת הלומד», וזה **אותו
 * מספר** של מכסת הייצור (`STORIES_PER_LEVEL`, `lib/core/storyGate.ts`) **ומאותו טעם**:
 * האריח נפתח כשמכסת הרמה מלאה. שני קבועים באותו ערך הם החצי שלא יזוז ביום שהמכסה
 * תשתנה. ⚠️ ⛔ זה ⛔ אינו סותר את D-031: `MIN_*` הם ספי מוצר בלי מקור, וזו **מכסת
 * תוכן** שכבר נאכפת בשער חי (`scripts/build-stories-sql.test.ts`).
 */
const STORIES_REQUIRED = STORIES_PER_LEVEL;

/**
 * Both reads fail the same way, and the shape of that failure is the requirement: the raw
 * PostgREST string goes to the log and ⛔ never into the body, because it names columns and
 * tables. A missing schema is 503 with a Hebrew sentence — ⛔ never 500, ⛔ never an empty
 * screen.
 */
function schemaAwareFailure(where: string, error: { message: string; code?: string }) {
  console.error(`[api/world/status] ${where} read failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}

export async function GET() {
  // The C-0032 guard order, identical to app/api/study/queue/route.ts: ENV, then session,
  // then the query. An unauthenticated caller learns nothing about the shape of the endpoint.
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const bank = await supabase
    .from('words')
    .select('headword')
    .eq('lexical_class', 'function')
    .order('headword', { ascending: true })
    .limit(MAX_BANK_ROWS);

  if (bank.error) return schemaAwareFailure('bank', bank.error);

  // `words!inner` is deliberate and copied from app/api/world/bank/route.ts on purpose: the
  // two endpoints have to agree on what the learner's bank IS, and a progress row whose word
  // was deleted is ⛔ not a word the learner knows. Rows, ⛔ not a count: `word_progress` is
  // per-SENSE, and the threshold on the other side of the predicate is in headwords (F-040).
  const active = await supabase
    .from('word_progress')
    .select('words!inner(headword)')
    .eq('user_id', user.id)
    .eq('is_active_this_week', true)
    .limit(MAX_BANK_ROWS);

  if (active.error) return schemaAwareFailure('active', active.error);

  const counts = {
    functionWords: uniqueHeadwords((bank.data ?? []) as HeadwordRow[]).length,
    activeWords: uniqueHeadwords(
      flattenJoinedHeadwords((active.data ?? []) as JoinedHeadwordRow[]),
    ).length,
  };

  const thresholds = {
    minFunctionWords: MIN_FUNCTION_WORDS,
    minActiveWords: MIN_ACTIVE_WORDS,
  };

  // ⛔ Computed on every call. A cached unlock state is a wrong unlock state: the learner
  // crosses the threshold mid-session, and the tab has to notice.
  //
  // T-125 · D-066: הספים עולים על החוט משום שהלשונית נעולה על שניהם והמשפט
  // חייב לדעת על שניהם. ⛔ הם עדיין חיים כאן ו⛔ לא ב-lib/core (D-031) —
  // הצרכן מקבל אותם ⛔ ואינו מחזיק העתק שיכול לחלוק בשקט. ⚠️ אותו אובייקט
  // בדיוק הולך ל-`isWorldUnlocked` וגם על החוט, ולכן ההחלטה והמשפט ⛔ אינם
  // יכולים להיפרד: מה שפתח את הדלת הוא מה שמסופר עליה.
  // ⛔ אחרונה בכוונה: היא ⛔ אינה רשאית להשפיע על `unlocked` ו⛔ אינה רשאית להחזיר 503.
  const storiesStatus = await readStories(supabase, user.id);

  return NextResponse.json({
    ok: true,
    unlocked: isWorldUnlocked(counts, thresholds),
    ...counts,
    ...thresholds,
    // ⛔ `null` ⇒ «—» באריח (⛔ ולא «0»), ו⛔ הלשונית ⛔ אינה נוגעת.
    stories: storiesStatus,
  });
}

/**
 * ⛔ **קריאה רכה, ⛔ ולא 503 — וזו הכרעה שנמדדה.** `0018_stories.sql` טרם הורץ בייצור,
 * ו-`<TabBar>` נועל את לשונית «העולם» על כל תשובה שאינה `ok:true` (`docs/api-contract.md`).
 * ⇒ כישלון כאן היה **נועל את הלשונית לכל הלומדים** עד שרוי ירוץ מיגרציה. ⇒ הפונקציה
 * מחזירה `null`, האריח מצייר «—», והלשונית ⛔ אינה נוגעת. ⛔ הכישלון יורד ללוג בלבד.
 */
async function readStories(
  supabase: ReturnType<typeof createRouteClient>,
  userId: string,
): Promise<{ required: number; atLevel: number | null } | null> {
  const profile = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', userId)
    .maybeSingle();
  if (profile.error) {
    console.error('[api/world/status] profile read failed:', profile.error.message);
    return null;
  }

  // ⛔ אין נפילה שקטה ל-A1 (D-037). «טרם בחר» הוא מצב אמיתי, ולומד כזה ⛔ אינו נחסם —
  // הוא נשלח לסריקת הרמה (T-137ⓓ), וההחלטה הזאת נעשית בשכבה הטהורה ⛔ ולא כאן.
  const level = parseLevel((profile.data as { current_level?: unknown } | null)?.current_level);
  if (level === null) return { required: STORIES_REQUIRED, atLevel: null };

  // ⚠️ `stories` היא `unique (cefr_level, title_en)` ⇒ **שורה = סיפור**, ולכן ספירת
  // שורות כאן היא הספירה הנכונה — ⛔ בניגוד ל-`words`/`word_progress` שנמדדות
  // ב-headwords (F-040). ⛔ אפס שורות על החוט.
  const counted = await supabase
    .from('stories')
    .select('id', { count: 'exact', head: true })
    .eq('cefr_level', level);
  if (counted.error) {
    console.error('[api/world/status] stories read failed:', counted.error.message);
    return null;
  }
  return { required: STORIES_REQUIRED, atLevel: counted.count ?? 0 };
}
