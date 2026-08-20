import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildRecallCard, type LearnerWord, type RecallPost } from '@/lib/core/worldRecall';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * ⛔ **קריאה בלבד.** אין בקובץ `.insert(` · `.update(` · `.upsert(` · `.delete(` —
 * נאכף בסריקת מקור ב-`route.test.ts`. הכרטיס הזה ⛔ אינו חזרה: הוא ⛔ אינו מקדם מונה
 * ו⛔ אינו נוגע בעמודות מנוע החזרות. מ-`word_progress` נקראות **מילים בלבד**, דרך
 * `words!inner(...)` — בדיוק כמו `/api/world/bank`.
 *
 * ⛔ הנתיב אינו מסנן, אינו מדרג ואינו מגריל: הוא שואל «אילו שורות יש» ומוסר אותן
 * לשכבה הטהורה, בדיוק כמו `app/api/arcade/round/route.ts`.
 */

/** תקרת שאילתה ⛔ ולא מגבלת מוצר — הפיד עצמו הוא `/api/world/posts`. */
const MAX_RECALL_POSTS = 100;

/** תקרת שאילתה על מילות הלומד, באותו סדר גודל של `MAX_BANK_ROWS`. */
const MAX_LEARNER_WORDS = 2000;

const LEARNER_WORDS_SELECT =
  'words!inner(headword, cefr_profile_band, ngsl_rank, lexical_class)';

type JoinedWord = {
  headword: string | null;
  cefr_profile_band: string | null;
  ngsl_rank: number | null;
  lexical_class: string | null;
};

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

/** GET /api/world/recall — see docs/api-contract.md */
export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // ⚠️ `author_kind` הוא **הגנה ⛔ ולא ניקוי**: בלעדיו פוסט מיוצר היה מוצג ללומד
  // כמשפט שהוא עצמו כתב (הלקח של C-0123).
  const posts = await supabase
    .from('world_posts')
    .select('id, body_en, created_at')
    .eq('user_id', user.id)
    .eq('author_kind', 'learner')
    .order('created_at', { ascending: false })
    .limit(MAX_RECALL_POSTS);
  if (posts.error) {
    // המחרוזת של PostgREST יורדת ללוג ⛔ ולעולם לא לגוף התשובה — היא נוקבת בשמות
    // טבלאות ועמודות.
    console.error('[api/world/recall] posts read failed:', posts.error.message);
    return isSchemaMissing((posts.error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const words = await supabase
    .from('word_progress')
    .select(LEARNER_WORDS_SELECT)
    .eq('user_id', user.id)
    .limit(MAX_LEARNER_WORDS);
  if (words.error) {
    console.error('[api/world/recall] words read failed:', words.error.message);
    return isSchemaMissing((words.error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const recallPosts: RecallPost[] = ((posts.data ?? []) as {
    id: string;
    body_en: string | null;
    created_at: string | null;
  }[])
    .filter((row) => typeof row.body_en === 'string' && typeof row.created_at === 'string')
    .map((row) => ({ id: row.id, bodyEn: row.body_en ?? '', createdAt: row.created_at ?? '' }));

  // PostgREST מחזיר `!inner` פעם כאובייקט ופעם כמערך בן איבר אחד — שתי הצורות, ⛔ ובלי
  // להניח (F-040). שורת התקדמות שהמילה שלה נמחקה ⛔ אינה מילת לומד.
  const learnerWords: LearnerWord[] = ((words.data ?? []) as { words: JoinedWord | JoinedWord[] | null }[])
    .flatMap((row) => {
      const joined = row?.words;
      if (Array.isArray(joined)) return joined;
      return joined ? [joined] : [];
    })
    .filter((word): word is JoinedWord => typeof word?.headword === 'string')
    .map((word) => ({
      headword: word.headword ?? '',
      band: word.cefr_profile_band,
      ngslRank: word.ngsl_rank,
      isFunctionWord: word.lexical_class === 'function',
    }));

  // ⛔ אין `Math.random` בשכבה הטהורה — ה-seed נגזר כאן, בדיוק כמו `arcade/round`.
  const seed = Date.now() >>> 0;
  const card = buildRecallCard({
    posts: recallPosts,
    words: learnerWords,
    nowMs: Date.now(),
    seed,
  });

  // ⛔ `card: null` ⛔ ואינו 404: «אין מה להיזכר בו היום» אינו שגיאה, ומסך שמקבל 404
  // מצייר כשל (§ 4.2יב).
  return NextResponse.json({ ok: true, card });
}
