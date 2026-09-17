import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/** `GET`/`POST` /api/study/place — T-409 · `36 § 13.2` שורה 5 (חותמת ⓒ). בדיקות מקור, כמו שאר נתיבי ה-API. */

const CODE = withoutComments(readFileSync('app/api/study/place/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');
const MIGRATION = readFileSync('supabase/migrations/0029_study_track_place.sql', 'utf8');

const GET_BODY = CODE.slice(CODE.indexOf('export async function GET'), CODE.indexOf('export async function POST'));
const POST_BODY = CODE.slice(CODE.indexOf('export async function POST'));

describe('סדר ההגנות', () => {
  it('גוף שאינו אובייקט ⇒ 400, ⛔ לא 500', () => {
    expect(POST_BODY).toContain('Array.isArray(payload)');
    expect(POST_BODY).toContain('status: 400');
  });

  it('session נבדק לפני שהמסלול מאומת — קורא לא מזוהה אינו לומד אילו ערכים מתקבלים', () => {
    expect(POST_BODY.indexOf('getUser')).toBeLessThan(POST_BODY.indexOf('parseStudyTrackId('));
  });

  it('מסלול לא חוקי ⇒ 422 עם שדה בעברית, ⛔ ולא כתיבה', () => {
    expect(POST_BODY).toContain('status: 422');
    expect(POST_BODY).toContain('fieldErrors');
  });

  it('⛔ אין סשן ⇒ 401 בשני הפעלים', () => {
    expect(GET_BODY).toContain("code: 'session_expired'");
    expect(POST_BODY).toContain("code: 'session_expired'");
  });
});

describe('ארבעת המסלולים מוגדרים במקום אחד', () => {
  it('עובר דרך parseStudyTrackId ⛔ ואינו מכיל רשימת מסלולים משלו', () => {
    expect(CODE).toContain('parseStudyTrackId(');
    expect(CODE).not.toMatch(/\['vocabulary',\s*'grammar'/);
  });

  it('צורת מזהה המודול נלקחת מ-`studyTracks`, ⛔ ואינה נכתבת כאן שוב', () => {
    expect(CODE).toContain('parseStudyModuleId(');
    expect(CODE).not.toContain('A-Za-z0-9');
  });
});

describe('⛔ סימנייה, ⛔ ולא התקדמות', () => {
  const upsertArg = POST_BODY.slice(POST_BODY.indexOf('.upsert('), POST_BODY.indexOf('if (error)'));

  it('ארבע עמודות, ותו לא', () => {
    for (const column of ['user_id', 'track_id', 'module_id', 'updated_at']) {
      expect(upsertArg).toContain(column);
    }
  });

  it.each(['easiness', 'interval_days', 'repetition', 'next_review_at', 'self_marked_known', 'word_progress'])(
    '⛔ %s אינו נכתב',
    (column) => {
      expect(upsertArg).not.toContain(column);
    },
  );

  it('⛔ אינו נוגע בשום טבלה מלבד `study_track_place`', () => {
    const tables = [...CODE.matchAll(/\.from\('([^']+)'\)/g)].map((m) => m[1]);
    expect([...new Set(tables)]).toEqual(['study_track_place']);
  });
});

describe('🔴 טבלה חסרה — שתי תשובות שונות, ובכוונה', () => {
  it('בקריאה ⇒ `ok: true` עם רשימה ריקה — המסך חוזר בדיוק להתנהגות שלפני השורה', () => {
    expect(GET_BODY).toContain('isSchemaMissing');
    expect(GET_BODY).toContain('ok: true, places: []');
  });

  it('בכתיבה ⇒ 503 `schema_missing` — «נשמר» על משהו שלא נשמר הוא שקר מדיד', () => {
    expect(POST_BODY).toContain("code: 'schema_missing'");
    expect(POST_BODY).toContain('status: 503');
  });

  it('⛔ אין קוד PostgREST מוטבע בשני הפעלים — הרשימה מוגדרת פעם אחת', () => {
    expect(GET_BODY).not.toContain('42P01');
    expect(POST_BODY).not.toContain('42P01');
    expect(CODE).toContain("code === '42P01'");
  });
});

describe('המיגרציה והחוזה מתעדכנים באותו קומיט', () => {
  it('docs/api-contract.md מתעד את שני הפעלים', () => {
    expect(CONTRACT).toContain('GET /api/study/place');
    expect(CONTRACT).toContain('POST /api/study/place');
  });

  it('‏`0029` מגדיר את הטבלה עם מפתח זוגי ⛔ ולא שורה אחת ללומד', () => {
    expect(MIGRATION).toContain('create table if not exists public.study_track_place');
    expect(MIGRATION).toContain('primary key (user_id, track_id)');
  });

  it('‏`module_id` נשאר NULLABLE — לשלושת המסלולים בלי תוכן ⛔ אין מודולים (`36 § 9`)', () => {
    expect(MIGRATION).toMatch(/module_id\s+text\s*,/);
    expect(MIGRATION).not.toMatch(/module_id\s+text\s+not null/);
  });

  it('‏RLS דלוקה וארבע המדיניות מוגדרות על `auth.uid() = user_id` בלבד', () => {
    expect(MIGRATION).toContain('enable row level security');
    for (const verb of ['select', 'insert', 'update', 'delete']) {
      expect(MIGRATION).toContain(`study_track_place_${verb}_own`);
    }
    expect(MIGRATION).not.toContain('using (true)');
  });

  it('‏`track_id` נושא `check` על ארבעת המזהים — קיר שני, ⛔ ולא היחיד', () => {
    expect(MIGRATION).toContain("check (track_id in ('vocabulary', 'grammar', 'writing', 'reading'))");
  });
});
