# לימודים כבורר מסלולים — T-246

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` (or `superpowers:subagent-driven-development`) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** להחליף את מסך `לימודים` (היום: כותרת ספירת-ימים לבחינה + כפתור יחיד, 117 תווים) בבורר ארבעת המסלולים של `36 § 9` — `אוצר מילים` · `דקדוק` · `כתיבה` · `הבנת הנקרא` — כשלכל מסלול יש מדד התקדמות אמיתי מהסוג הנכון לו, ומסלול בלי תוכן מוצג כמבנה ריק **מוצהר** עם מספר אמיתי (⛔ לעולם לא «—»).

**Architecture:** רישום המסלולים ופונקציות הגזירה שלהם יושבים בשכבה טהורה חדשה, `lib/core/studyTracks.ts` — אפס React, DOM, רשת. הנתונים האמיתיים היחידים שהמסך צריך (כמה מילים ידועות בכל רמת CEFR) **כבר קיימים** מאחורי `GET /api/levels/summary` (`lib/core/levelSummary.ts` · `app/api/levels/summary/route.ts`), ולכן המשימה **אינה** פותחת שאילתה חדשה — היא סוגרת פער קיים בנתיב הזה (Task 1) ואז קוראת אותו. הרכיב עצמו (`StudiesScreen`) הופך ל-`'use client'` כדי לתמוך במיתוג בין ארבעת השבבים בלי ניווט, בדיוק כמו `<LevelMapScreen>`.

**Tech Stack:** Next.js App Router (RSC לעמוד · client component לרכיב) · TypeScript ללא `any` · Tailwind (טוקנים סמנטיים בלבד — `plan/35-design-constitution.md`) · Vitest ב-node ⛔ ללא jsdom (בדיקת רכיב = סריקת מקור, בדיוק כמו `LevelMapScreen.test.ts`) · Playwright דרך `npm run check:mobile` לגאומטריה.

**Spec:** `plan/36-video-spec.md § 9` (לימודים · מכולת מסלולים) · `§ 13.2` שורה 5 (חותמת ⓐ בלבד — ⓑ+ⓒ הן T-247) · `§ 14.4` (הרנדר מחייב בפריסה ובגימור) · `plan/40-decisions.md` D-176 (ההכרעה שכפתה את המעבר, וטבלת מה נשאר בתוקף מ-T-144) · `plan/50-tasks.md` שורות `T-144` · `T-246` · `T-247` · הרנדר המחייב `docs/design/kol-A-04-learning.png`, שמקורו `docs/design/render_video_A.py:1149-1275` (`TRACKS` · `TRACK_DATA` · `screen_hub` · `scene_hub`) — כל ערך פריסה בתוכנית הזאת מצוטט מהקוד הזה, ⛔ לא מהעין (`36 § 14.4` · D-114).

## Global Constraints

1. **`/lib/core/` טהור.** ⛔ אפס `react` · `window` · `document` · `localStorage` · `fetch` · `process.env` · `new Date()` · `Math.random()`. נאכף ב-`npm run check:core`.
2. **⛔ רכיב ממשק אינו ניגש לדאטהבייס.** קריאת הרשת חיה ב-`<StudiesScreen>` (בדיוק כמו `<LevelMapScreen>`), ⛔ ולא ב-`app/(tabs)/studies/page.tsx` — הדף עושה רק את שער הסשן.
3. **⛔ אפס הגדרה שנייה ל-«ידוע» / «ברשימת החזרה» / «טרם נראה».** `classifyProgress` ב-`lib/core/levelSummary.ts` היא ההגדרה היחידה (§ 4.2ז); התוכנית הזאת **קוראת** את הפלט שלה, ⛔ ולא בונה ספירה מקבילה.
4. **⛔ אפס תוכן לימודי בקוד, ⛔ אפס תוכן שממציאים כדי למלא מסלול** (R-010 · `36 § 9`). דקדוק · כתיבה · הבנת הנקרא נשארים **מבנה ריק מוצהר** עם המספר `0 מתוך 0`, ⛔ ולעולם לא `«—»` (D-046 · D-082 · D-176 §ד).
5. **⛔ «—» ⛔ אינו `0`.** קריאה שנכשלה (`unreachable`) חייבת להיראות שונה ממסלול ריק **באמת** (`empty`) — התבנית של `DeckSelector`'s `UNKNOWN_COUNT_HE` / `FilterBar`'s `NO_NUMBER_HE`.
6. **D-050 · R-012 · T-032:** ⛔ אפס נקודות · אפס מטבע · אפס XP · אפס לוח תוצאות · אפס רצף יומי.
7. **`36 § 12.7` · חוקה שכבה A:** מצב לא מקודד בצבע בלבד. השבב הפעיל נושא **אייקון + תווית + `aria-current`**, ⛔ לא רק גוון (זו סטייה מכוונת מהרנדר, שמצייר את השבב הפעיל בצבע בלבד — Layer A גוברת על הרנדר בדיוק כאן, `36 § 14.4`).
8. **⛔ תחזית קצב (T-246ⓔ) נדחית מהטיק הזה במפורש.** אין בשום מסמך עוגן (`36 § 9`, D-176) נוסחה למדידת «קצב» — «בקצב הזה תסיים בעוד N ימים» ברנדר הוא ערך לדוגמה, ⛔ ולא מפרט מדיד. המצאת נוסחת חיזוי כאן היא בדיוק המחלקה ש-§ 4.4.3 אוסרת («⛔ אין הערכת מוכנות ואין ציון חזוי») בהרחבה סבירה. ⇒ **אף מסלול לא מציג באנר תחזית בטיק הזה**, מה שמקיים את ⓔ באות שלה («מוצג רק במסלול עם קצב **מדיד**» — ואין כזה עדיין). נפתח ממצא ל-PM בסגירת התוכנית (ראה «מה בכוונה נשאר בחוץ» למטה).
9. **T-247 (נתיב המודולים בתוך מסלול) ⛔ אינו בתוכנית הזאת.** `T-247`'s own row אומרת זאת במפורש: T-246 **לבדה** אינה עוברת את חותמות ⓑ+ⓒ של `36 § 13.2` — זה תוצר ביניים ידוע ומתועד, ⛔ לא פער שנשכח.
10. **Mobile-First 375px · יעד מגע ≥44px (`min-h-touch`) · RTL · TypeScript ללא `any`.**
11. **רדיוס:** רק `rounded-md` (6) · `rounded-lg` (8) · `rounded-xl` (12) · `rounded-2xl` (16) · `rounded-full` — `radius-hygiene.test.ts` (T-168) אוכף.
12. **מובייל-פירסט (`[SKILL: imagegen-frontend-mobile]` §13·14·15·29·30·31):** אפס «קופסה בתוך קופסה» — שבבי המסלול וכרטיס הסטטוס הם **שתי שכבות בלבד**, ⛔ לא שלוש; ריווח נדיב בין הכותרת לשבבים לכרטיס הסטטוס; טקסט קריא — ⛔ אין תווית מתחת ל-`text-xs`.
13. **פקודת האימות המלאה** אחרי כל משימה: `npm run typecheck && npm run check:core && npm test && npm run build`. ⛔ אין טענת «עובר» בלי הרצה טרייה באותה הודעה.
14. **`docs/api-contract.md` מתעדכן באותו קומיט** כמו כל שינוי בנתיב API (Task 1 בלבד נוגעת בזה).
15. **`npm run generate-map`** רץ בסוף המשימה האחרונה — הטיק נוגע ב-`app/` · `components/` · `lib/` (D-165 · T-235), והתוצר נכנס לאותו קומיט.

---

## מה בכוונה נשאר בחוץ (לרישום, ⛔ לא לשכחה)

- **T-247** — נתיב המודולים בתוך מסלול, ניווט אמיתי, שמירת מיקום. חסום ב-T-246 (השורה עצמה קובעת זאת), ותוכנן בנפרד אחרי שהממשק של התוכנית הזאת (`StudyTrackStatus`, `STUDY_TRACKS`) קיים לבנות עליו.
- **תחזית קצב (ⓔ)** — ראה אילוץ 8 למעלה. **ממצא לפתוח בסגירת הטיק:** «`36 § 9` ו-D-176 מצטטים באנר תחזית (`render_video_A.py:1216-1218` · `1265-1266`) בלי לקבוע נוסחת קצב — איזה חלון זמן, איזה מקור נתונים. PM להכריע לפני שהבאנר נבנה.»

---

**⛔ אינה הרחבה של T-001/T-002/T-021** (`scripts/check-plan-shape.mjs` element 10): התוכנית הזאת **מייבאת ומשתמשת** ב-`lib/api/client.ts` (T-001/T-002 בנו אותו) בלי לגעת בו, ו-`scripts/verify-mobile.mjs` (T-021) מתעדכן כאן רק בשני מקומות ממוקדים (Task 5) שהתוכניות ההן לא כתבו ולא צפו — ⛔ לא כתיבה מחדש של מה שהן עשו.

## מבנה קבצים (File Structure)

| קובץ | אחריות | משימה |
|---|---|---|
| `app/api/levels/summary/route.ts` (שינוי) | `levels[]` יוצא גם כש-`level: null` — הנתון הקיים היחיד שהתוכנית צריכה | 1 |
| `app/api/levels/summary/route.test.ts` (שינוי) | שער חדש: הסדר החדש של הקריאות, וש-`levels` יוצא בשני הענפים | 1 |
| `docs/api-contract.md` (שינוי) | הדוגמה של `200 — הלומד טרם בחר רמה` מקבלת `levels` | 1 |
| `lib/core/studyTracks.ts` (**חדש**) | רישום ארבעת המסלולים · `TrackMetricState` · גזירת המדד לכל מסלול | 2 |
| `lib/core/studyTracks.test.ts` (**חדש**) | בדיקות התנהגות אמיתיות | 2 |
| `components/StudiesScreen.tsx` (שכתוב מלא) | כותרת · תת-כותרת · שורת שבבים RTL · כרטיס הסטטוס של המסלול הנבחר | 3 |
| `components/StudiesScreen.test.ts` (שכתוב) | סריקת מקור: ≥4 יעדי שבב · אפס «—» כמדד ריק · אפס נקודות/XP/רצף · שבב פעיל נושא אייקון+תווית | 3 |
| `app/(tabs)/studies/page.tsx` (שינוי) | שער הסשן בלבד — הכותרת המבוססת-תאריך יורדת, הקריאה עוברת לרכיב | 4 |
| `app/dev/tabs/studies/page.tsx` (שינוי) | פיקסטורה עם `fixtureLevels` קבוע, בדיוק הדפוס של `fixtureSummary` | 4 |
| `scripts/verify-mobile.mjs` (שינוי) | הסרת הציפייה הישנה ל-`data-primary-action` יחיד על המסך הזה · שער ≥4 יעדים · ≥400 תווים | 5 |
| `docs/architecture-map.json` · `plan/63-surfaces.md` (נגזרים) | `npm run generate-map` · `npm run build:surfaces` | 5 |

---

## Task 1 — `GET /api/levels/summary` מחזיר `levels[]` גם כש-`level: null`

**Files:**
- Modify: `app/api/levels/summary/route.ts`
- Modify: `app/api/levels/summary/route.test.ts`
- Modify: `docs/api-contract.md`

**Interfaces:**
- Consumes: `summarizeAllLevels` · `parseLevel` מ-`lib/core/levelSummary.ts` (קיימים, ⛔ לא משתנים).
- Produces: `GET /api/levels/summary` על `level: null` מחזיר `{ ok: true, level: null, levels: LevelSummary[] }` (שדה חדש, ⛔ שובר כלום — כל צרכן קיים כבר קורא `body.levels ?? []`).

- [ ] **Step 1: כתוב בדיקה כושלת — `levels` יוצא גם כש-`level: null`**

הוסף ל-`app/api/levels/summary/route.test.ts`, בתוך `describe('⛔ הנתיב אינו מחשב — הוא שואל ומרכיב (T-080)')`:

```ts
it('T-246: levels[] נספר גם כש-level: null — לא רק בענף עם רמה נבחרת', () => {
  // עד תיקון זה השורה `if (level === null) return NextResponse.json({ ok: true, level: null })`
  // חזרה **לפני** הקריאה ל-summarizeAllLevels, ולכן `levels` לא הופיע בגוף כלל בענף הזה.
  const nullBranch = CODE.slice(
    CODE.indexOf('if (level === null)'),
    CODE.indexOf('if (level === null)') + 200,
  );
  expect(nullBranch).not.toMatch(/return NextResponse\.json\(\{\s*ok:\s*true,\s*level:\s*null\s*\}\)/);
  expect(CODE.indexOf('summarizeAllLevels(')).toBeLessThan(CODE.lastIndexOf('level === null'));
});

it('החוזה מתעד levels[] גם בדוגמה של «הלומד טרם בחר רמה»', () => {
  const example = CONTRACT.slice(
    CONTRACT.indexOf('200 — הלומד טרם בחר רמה'),
    CONTRACT.indexOf('200 — רמה נבחרה'),
  );
  expect(example).toContain('"levels"');
});
```

- [ ] **Step 2: הרץ ותוודא כישלון**

```
npx vitest run app/api/levels/summary/route.test.ts
```
צפוי: FAIL על שתי הבדיקות החדשות.

- [ ] **Step 3: שנה את `route.ts` — חשב `levels` לפני הבדיקה על `level`, לא אחריה**

ב-`app/api/levels/summary/route.ts`, המבנה הנוכחי הוא:
```
const level = parseLevel(...);
if (level === null) return NextResponse.json({ ok: true, level: null });
// (fetch progress rows, fetch totals, summarizeAllLevels, summarizeLevel)
```
החלף אותו כך שקריאת ה-`word_progress` וה-`words` totals רצות **תמיד**, ורק חישוב ה-`summary` הספציפי לרמה נשאר מותנה:

```ts
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

  const level = parseLevel((profile as { current_level?: unknown } | null)?.current_level);

  // ⚠️ T-246: שתי הקריאות הבאות רצות ⛔ תמיד, גם כש-level הוא null — לומד יכול לצבור
  // word_progress בכמה רמות עוד לפני שבחר «רמה נוכחית» (למשל דרך סימון עצמי בסריקה),
  // ובורר המסלולים צריך את שש הרמות בכל מקרה. עד כאן ההתנהגות זהה למה שהיה.
  const { data, error } = await supabase
    .from('word_progress')
    .select(PROGRESS_SELECT)
    .eq('user_id', user.id)
    .limit(MAX_PROGRESS_ROWS);

  if (error) {
    console.error('[api/levels/summary] progress read failed:', error.message);
    return isSchemaMissing((error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const raw = (data ?? []) as unknown as ProgressJoinRow[];
  if (raw.length >= MAX_PROGRESS_ROWS) {
    console.error('[api/levels/summary] progress ceiling reached; counts would be wrong');
    return unavailable();
  }

  const banded: BandedProgressFacts[] = raw.map((row) => ({
    attempts: row.attempts ?? 0,
    repetition: row.repetition ?? 0,
    selfMarkedKnown: row.self_marked_known === true,
    band: bandOf(row),
  }));

  const counted = await Promise.all(
    BAND_ORDER.map((band) =>
      supabase.from('words').select('id', { count: 'exact', head: true }).eq('cefr_profile_band', band),
    ),
  );
  const failedCount = counted.find((result) => result.error);
  if (failedCount?.error) {
    console.error('[api/levels/summary] level sizes read failed:', failedCount.error.message);
    return isSchemaMissing((failedCount.error as { code?: string }).code) ? schemaMissing() : unavailable();
  }

  const totals = Object.fromEntries(
    BAND_ORDER.map((band, i) => [band, counted[i]?.count ?? 0]),
  ) as Record<CefrBand, number>;

  try {
    const levels = summarizeAllLevels({ totals, rows: banded });

    // ⛔ אין נפילה שקטה ל-A1: `level: null` הוא תשובה, ⛔ לא חוסר (D-037). התוספת
    // היחידה כאן היא `levels` — חמשת השדות שהיו קיימים בענף הזה (`ok`, `level`)
    // יוצאים בדיוק כפי שיצאו קודם.
    if (level === null) return NextResponse.json({ ok: true, level: null, levels });

    const rows: ProgressFacts[] = banded.filter((row) => row.band === level);
    const summary = summarizeLevel({ level, totalInLevel: totals[level] ?? 0, rows });
    return NextResponse.json({ ok: true, ...summary, levels });
  } catch (rangeError) {
    console.error('[api/levels/summary] impossible counts:', (rangeError as Error).message);
    return unavailable();
  }
}
```

- [ ] **Step 4: עדכן את `docs/api-contract.md`**

בסעיף `## GET /api/levels/summary`, תחת `**200 — הלומד טרם בחר רמה:**`:

```json
{
  "ok": true,
  "level": null,
  "levels": [
    { "level": "A1", "totalInLevel": 315, "known": 0, "inReviewList": 0, "unseen": 315 },
    { "level": "A2", "totalInLevel": 80, "known": 0, "inReviewList": 0, "unseen": 80 },
    { "level": "B1", "totalInLevel": 20, "known": 0, "inReviewList": 0, "unseen": 20 },
    { "level": "B2", "totalInLevel": 2, "known": 0, "inReviewList": 0, "unseen": 2 },
    { "level": "C1", "totalInLevel": 0, "known": 0, "inReviewList": 0, "unseen": 0 },
    { "level": "C2", "totalInLevel": 0, "known": 0, "inReviewList": 0, "unseen": 0 }
  ]
}
```
ומיד אחריה משפט: «⚠️ **תוסף T-246:** `levels` יוצא גם כשהלומד טרם בחר רמה — בורר המסלולים ב-`לימודים` צריך את שש הרמות בכל מקרה, ולומד יכול לצבור `word_progress` בסימון עצמי לפני שבחר רמה נוכחית.»

- [ ] **Step 5: הרץ ותוודא הצלחה**

```
npx vitest run app/api/levels/summary/route.test.ts
```
צפוי: PASS, כולל שתי הבדיקות מ-Step 1. **ובנוסף** — צרכנים קיימים לא שברו:
```
npx vitest run components/LevelMapScreen.test.ts app/api/levels/current/route.test.ts
```
צפוי: PASS ללא שינוי (הם לא קוראים ל-`levels` בענף `level: null`, אז שדה נוסף לא נוגע בהם).

- [ ] **Step 6: Commit**

```bash
./scripts/g add app/api/levels/summary/route.ts app/api/levels/summary/route.test.ts docs/api-contract.md
./scripts/g commit -m "loop(DEV): C-XXXX GET /api/levels/summary returns levels[] when level is null (T-246 prep)"
```

---

## Task 2 — `lib/core/studyTracks.ts` — הרישום הטהור וגזירת המדד

**Files:**
- Create: `lib/core/studyTracks.ts`
- Create: `lib/core/studyTracks.test.ts`

**Interfaces:**
- Consumes: `LevelSummary` מ-`lib/core/levelSummary.ts` (`{level, totalInLevel, known, inReviewList, unseen}`).
- Produces:
  - `type StudyTrackId = 'vocabulary' | 'grammar' | 'writing' | 'reading'`
  - `STUDY_TRACKS: readonly {id: StudyTrackId; labelHe: string}[]` — סדר `36 § 9`, RTL: הראשון ברשימה הוא הימני ביותר בשורת השבבים (Task 3 קורא את זה).
  - `type TrackMetricState = {kind:'measured'; summaryHe:string} | {kind:'empty'; summaryHe:string} | {kind:'unreachable'}`
  - `vocabularyMetric(levels: readonly LevelSummary[]): TrackMetricState`
  - `emptyTrackMetric(id: 'grammar'|'writing'|'reading'): TrackMetricState` — תמיד `kind:'empty'`.
  - `trackLabelHe(id: StudyTrackId): string`

- [ ] **Step 1: כתוב את הבדיקות הכושלות**

```ts
// lib/core/studyTracks.test.ts
import { describe, expect, it } from 'vitest';
import {
  STUDY_TRACKS,
  emptyTrackMetric,
  trackLabelHe,
  vocabularyMetric,
} from './studyTracks';
import type { LevelSummary } from './levelSummary';

function level(over: Partial<LevelSummary> & Pick<LevelSummary, 'level'>): LevelSummary {
  return { totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0, ...over };
}

describe('STUDY_TRACKS — הרישום, 36 § 9', () => {
  it('ארבעה מסלולים, בדיוק בסדר הזה', () => {
    expect(STUDY_TRACKS.map((t) => t.id)).toEqual(['vocabulary', 'grammar', 'writing', 'reading']);
  });

  it('התוויות בעברית ותואמות למפרט', () => {
    expect(trackLabelHe('vocabulary')).toBe('אוצר מילים');
    expect(trackLabelHe('grammar')).toBe('דקדוק');
    expect(trackLabelHe('writing')).toBe('כתיבה');
    expect(trackLabelHe('reading')).toBe('הבנת הנקרא');
  });
});

describe('vocabularyMetric — אפס הגדרה שנייה (§ 4.2ז)', () => {
  it('מסכם known/totalInLevel על פני שש הרמות, ⛔ לא מחשב מחדש', () => {
    const levels = [
      level({ level: 'A1', totalInLevel: 315, known: 189 }),
      level({ level: 'A2', totalInLevel: 80, known: 10 }),
      level({ level: 'B1', totalInLevel: 20 }),
      level({ level: 'B2', totalInLevel: 2 }),
      level({ level: 'C1' }),
      level({ level: 'C2' }),
    ];
    const metric = vocabularyMetric(levels);
    expect(metric).toEqual({ kind: 'measured', summaryHe: '199 מתוך 417 מילים ידועות' });
  });

  it('שש רמות באפס תוכן (מאגר ריק) — עדיין measured, ⛔ ולא empty: 0/0 הוא מספר אמיתי', () => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) =>
      level({ level: l as LevelSummary['level'] }),
    );
    expect(vocabularyMetric(levels)).toEqual({ kind: 'measured', summaryHe: '0 מתוך 0 מילים ידועות' });
  });
});

describe('emptyTrackMetric — מבנה ריק מוצהר, D-176 §ד', () => {
  it('דקדוק · כתיבה · הבנת הנקרא — 0 מתוך 0, ⛔ ולעולם לא «—»', () => {
    expect(emptyTrackMetric('grammar')).toEqual({
      kind: 'empty',
      summaryHe: 'אין עדיין פריטים בדקדוק — 0 מתוך 0',
    });
    expect(emptyTrackMetric('writing')).toEqual({
      kind: 'empty',
      summaryHe: 'אין עדיין פריטים בכתיבה — 0 מתוך 0',
    });
    expect(emptyTrackMetric('reading')).toEqual({
      kind: 'empty',
      summaryHe: 'אין עדיין פריטים בהבנת הנקרא — 0 מתוך 0',
    });
  });

  it('אף מחרוזת לא מכילה «—» — ⛔ הבדיקה של D-046/D-082', () => {
    for (const id of ['grammar', 'writing', 'reading'] as const) {
      expect(emptyTrackMetric(id).summaryHe).not.toContain('—');
    }
  });
});
```

- [ ] **Step 2: הרץ ותוודא כישלון**

```
npx vitest run lib/core/studyTracks.test.ts
```
צפוי: FAIL (`Cannot find module './studyTracks'`).

- [ ] **Step 3: כתוב את המימוש**

```ts
// lib/core/studyTracks.ts
/**
 * PURE. ⛔ אפס react · window · document · fetch · env · new Date() · Math.random().
 *
 * הרישום של ארבעת המסלולים (`36 § 9` · D-176) וגזירת מה שכל שבב מציג — T-246.
 * ⛔ **הקובץ הזה אינו קורא דאטהבייס ואינו מגדיר «ידוע».** `classifyProgress` ב-
 * `lib/core/levelSummary.ts` היא ההגדרה היחידה (§ 4.2ז), וזה הקובץ שרק **מרכיב**
 * את מה שכבר סוכם משם למשפט אחד לכל מסלול.
 *
 * ⚠️ הוספת מסלול היא שורה ב-`STUDY_TRACKS`, ⛔ לא מסך חדש (T-246ⓐ).
 */
import type { LevelSummary } from './levelSummary';

export type StudyTrackId = 'vocabulary' | 'grammar' | 'writing' | 'reading';

export interface StudyTrackMeta {
  readonly id: StudyTrackId;
  readonly labelHe: string;
}

/**
 * ⛔ סדר `36 § 9`, ⛔ אל תסדר מחדש: `render_video_A.py:1252-1264` (`screen_hub`)
 * מצייר שורת שבבים ב-RTL שמתחילה ב-`x = LW - 24` ומתקדמת שמאלה על פני המערך הזה
 * בסדר — כלומר **האיבר הראשון כאן הוא השבב הימני ביותר על המסך**.
 */
export const STUDY_TRACKS: readonly StudyTrackMeta[] = Object.freeze([
  { id: 'vocabulary', labelHe: 'אוצר מילים' },
  { id: 'grammar', labelHe: 'דקדוק' },
  { id: 'writing', labelHe: 'כתיבה' },
  { id: 'reading', labelHe: 'הבנת הנקרא' },
]);

export function trackLabelHe(id: StudyTrackId): string {
  const meta = STUDY_TRACKS.find((t) => t.id === id);
  if (!meta) throw new RangeError(`studyTracks: unknown track id "${id}"`);
  return meta.labelHe;
}

/**
 * T-246ⓑ: סוג המדד הוא פרמטר של המסלול, ⛔ לא הנחה. `kind` הוא הצורה, ⛔ לא
 * הרנדר של המשפט עצמו — `summaryHe` כבר גמור לתצוגה כי HARD INVARIANTS אוסר
 * תוכן לימודי בקוד, ⛔ ולא ניסוח UI במקום אחר.
 *
 * ⛔ **`'unreachable'` ⛔ אינו `'empty'`.** קריאה שנכשלה חייבת להיראות שונה
 * ממסלול ריק **באמת** — התבנית של `DeckSelector`'s `UNKNOWN_COUNT_HE` (D-046/D-082
 * חלה על כל מספר בעילת, ⛔ ולא רק על ⓓ).
 */
export type TrackMetricState =
  | { readonly kind: 'measured'; readonly summaryHe: string }
  | { readonly kind: 'empty'; readonly summaryHe: string }
  | { readonly kind: 'unreachable' };

/**
 * ⛔ **אין כאן ולו שאילתה אחת** — `levels` כבר מגיע מ-`GET /api/levels/summary`
 * (T-246 Task 1), שכבר סיכם `known`/`totalInLevel` דרך `classifyProgress`. הפונקציה
 * הזאת רק **מצרפת** שש רמות למשפט אחד — ⛔ ולא מגדירה מחדש מה «ידוע».
 */
export function vocabularyMetric(levels: readonly LevelSummary[]): TrackMetricState {
  const totalWords = levels.reduce((sum, l) => sum + l.totalInLevel, 0);
  const known = levels.reduce((sum, l) => sum + l.known, 0);
  return { kind: 'measured', summaryHe: `${known} מתוך ${totalWords} מילים ידועות` };
}

/**
 * T-246ⓓ · D-176 §ד: «לדקדוק, לכתיבה ולהבנת הנקרא אין תוכן» הוא משפט מפורש
 * ב-`36 § 9`, ⛔ לא הנחה שלי — ולכן `0 מתוך 0` כאן הוא קבוע, ⛔ לא תוצאת שאילתה
 * שנכשלה. **כשתתווסף סכמה לאחד משלושת המסלולים האלה, הפונקציה הזאת צריכה
 * לזוז לקריאה אמיתית** — הקבוע הזה תקף אך ורק כל עוד `36 § 9` עצמו אומר שאין תוכן.
 */
export function emptyTrackMetric(id: Exclude<StudyTrackId, 'vocabulary'>): TrackMetricState {
  return { kind: 'empty', summaryHe: `אין עדיין פריטים ב${trackLabelHe(id)} — 0 מתוך 0` };
}
```

- [ ] **Step 4: הרץ ותוודא הצלחה**

```
npx vitest run lib/core/studyTracks.test.ts
npm run check:core
```
צפוי: שתי הפקודות PASS.

- [ ] **Step 5: Commit**

```bash
./scripts/g add lib/core/studyTracks.ts lib/core/studyTracks.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX lib/core/studyTracks — pure four-track registry (T-246)"
```

---

## Task 3 — `<StudiesScreen>` — שכתוב מלא

**Files:**
- Modify (שכתוב מלא): `components/StudiesScreen.tsx`
- Modify (שכתוב מלא): `components/StudiesScreen.test.ts`

**Interfaces:**
- Consumes: `STUDY_TRACKS` · `TrackMetricState` · `vocabularyMetric` · `emptyTrackMetric` מ-`lib/core/studyTracks.ts`; `apiGet` מ-`lib/api/client.ts`; `LevelSummary` מ-`lib/core/levelSummary.ts`.
- Produces: `export default function StudiesScreen({ fixtureLevels }: { readonly fixtureLevels?: readonly LevelSummary[] } = {})`. `fixtureLevels === undefined` ⇒ הרכיב קורא בעצמו ל-`GET /api/levels/summary`; `fixtureLevels` מוגדר ⇒ אין קריאת רשת (הפיקסטורה של Task 4 משתמשת בזה, בדיוק כמו `fixtureSummary` ב-`<LevelMapScreen>`).

- [ ] **Step 1: כתוב את הבדיקות הכושלות**

```ts
// components/StudiesScreen.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/StudiesScreen.tsx', 'utf8');

function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<StudiesScreen> — בורר ארבעת המסלולים (T-246 · 36 § 9)', () => {
  it('ארבעה יעדי שבב אמיתיים, אחד לכל מסלול', () => {
    for (const id of ['vocabulary', 'grammar', 'writing', 'reading']) {
      expect(CODE).toContain(id);
    }
    // כל שבב הוא <button>, ⛔ לא <li> סטטי — הבחירה משנה state, אינה ניווט.
    expect(CODE.match(/<button/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it('השבב הפעיל נושא aria-current — ⛔ לא רק צבע (36 § 12.7)', () => {
    expect(CODE).toContain('aria-current');
  });

  it('⛔ אפס נקודות · מטבע · XP · לוח תוצאות · רצף יומי (D-050 · R-012 · T-032)', () => {
    for (const forbidden of ['נקודות', 'מטבע', 'XP', 'לוח תוצאות', 'רצף יומי', 'רצף'])
      expect(CODE, `"${forbidden}" אסור על המסך הזה`).not.toContain(forbidden);
  });

  it('⛔ אפס תחזית קצב בטיק הזה — הנוסחה לא הוגדרה (Global Constraint 8)', () => {
    expect(CODE).not.toContain('בקצב הזה');
    expect(CODE).not.toContain('forecastHe');
  });

  it('⛔ אין readiness/score claim (4.4.3)', () => {
    for (const forbidden of ['מוכנות', 'ציון חזוי', 'צפוי לקבל'])
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
  });

  it('קורא ל-GET /api/levels/summary דרך apiGet, ⛔ לא fetch גולמי', () => {
    expect(CODE).toContain("apiGet");
    expect(CODE).toContain('/api/levels/summary');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });

  it('מקבל fixtureLevels אופציונלי — כמו fixtureSummary ב-LevelMapScreen', () => {
    expect(CODE).toContain('fixtureLevels');
  });

  it('⛔ הקובץ עצמו אינו ניגש לדאטהבייס (⛔ אפס Supabase import)', () => {
    expect(CODE).not.toMatch(/@\/lib\/supabase/);
  });
});
```

- [ ] **Step 2: הרץ ותוודא כישלון**

```
npx vitest run components/StudiesScreen.test.ts
```
צפוי: FAIL על רוב הבדיקות (הרכיב הישן אינו מכיל אף אחת מהמחרוזות האלה).

- [ ] **Step 3: כתוב את המימוש**

```tsx
// components/StudiesScreen.tsx
'use client';

/**
 * גוף לשונית `לימודים` — בורר ארבעת המסלולים, T-246 · `36 § 9` · D-176.
 *
 * 🎯 **הרנדר: `docs/design/kol-A-04-learning.png`**, וערכי הפריסה כאן לקוחים
 * מ-`docs/design/render_video_A.py:1149-1264` (`TRACKS` · `screen_hub`) —
 * ⛔ לא מהעין (`36 § 14.4` · D-114): כותרת «לימודים» · תת-כותרת «בחר מסלול ·
 * לכל מסלול מדד התקדמות משלו» · שורת שבבי מסלול RTL מתחת לכותרת.
 *
 * ⛔ **סטייה מכוונת אחת מהרנדר, ומתועדת (Layer A גוברת · `36 § 14.4`):** השבב
 * הפעיל ברנדר מסומן בצבע (`BRAND`) בלבד. `36 § 12.7` אוסר מצב שמקודד בצבע
 * בלבד, ולכן השבב הפעיל כאן נושא גם `aria-current="true"` וגם משקל גופן שונה —
 * שני ערוצים נוספים על הצבע.
 *
 * ⛔ **T-247 (נתיב המודולים בתוך מסלול) אינו כאן.** הרכיב הזה מציג שבב + כרטיס
 * סטטוס אחד לכל מסלול (ⓐ+ⓑ+ⓒ+ⓕ מתוך T-246), ⛔ ולא רשימת מודולים לחיצה
 * (חסום ב-T-246 עצמה, ⛔ ולא פער שנשכח — ראה התוכנית, «מה בכוונה נשאר בחוץ»).
 *
 * ⛔ **אפס תחזית קצב** — ⛔ אין נוסחה מוגדרת באף מסמך עוגן (ראה Global Constraint 8
 * בתוכנית). הוספת אחת כאן הייתה המצאת קביעה על הלומד, בדיוק מה ש-§ 4.4.3 אוסר.
 *
 * ⛔ **הרכיב אינו ניגש לדאטהבייס** — הקריאה ל-`GET /api/levels/summary` עוברת
 * דרך `apiGet` (lib/api/client.ts), בדיוק הדפוס של `<LevelMapScreen>`.
 * `fixtureLevels` עוקף את הקריאה — הפיקסטורה ב-`/dev/tabs/studies` מזינה אותו כדי
 * שהגאומטריה תימדד בלי env של Supabase.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import type { LevelSummary } from '@/lib/core/levelSummary';
import {
  STUDY_TRACKS,
  emptyTrackMetric,
  trackLabelHe,
  vocabularyMetric,
  type StudyTrackId,
  type TrackMetricState,
} from '@/lib/core/studyTracks';

const TITLE_HE = 'לימודים';
const SUBTITLE_HE = 'בחר מסלול · לכל מסלול מדד התקדמות משלו';
/** ⛔ «—», ⛔ לא ריק: קריאה שנכשלה חייבת להיראות אחרת ממסלול ריק באמת (D-046/D-082). */
const UNREACHABLE_HE = '— לא הצלחנו לטעון את ההתקדמות כרגע';

type SummaryResponse =
  | { readonly ok: true; readonly level: string | null; readonly levels?: readonly LevelSummary[] }
  | { readonly ok: false; readonly code: string };

/** SVG מוטבע ⛔ ולא אמוג׳י (חוקה שכבה A · § 6) — הערוץ השני של השבב הפעיל. */
function ActiveTrackMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function metricFor(id: StudyTrackId, levels: readonly LevelSummary[] | null): TrackMetricState {
  if (id !== 'vocabulary') return emptyTrackMetric(id);
  if (levels === null) return { kind: 'unreachable' };
  return vocabularyMetric(levels);
}

export default function StudiesScreen({
  fixtureLevels,
}: {
  readonly fixtureLevels?: readonly LevelSummary[];
} = {}): React.JSX.Element {
  const [active, setActive] = useState<StudyTrackId>(STUDY_TRACKS[0].id);
  const [levels, setLevels] = useState<readonly LevelSummary[] | null>(fixtureLevels ?? null);
  const [loading, setLoading] = useState(fixtureLevels === undefined);

  useEffect(() => {
    if (fixtureLevels !== undefined) return;
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<SummaryResponse>('/api/levels/summary');
        if (cancelled) return;
        setLevels(body.ok ? (body.levels ?? []) : null);
      } catch {
        if (!cancelled) setLevels(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fixtureLevels]);

  const metric = metricFor(active, loading ? null : levels);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{TITLE_HE}</h1>
        <p className="text-sm text-ink-muted">{SUBTITLE_HE}</p>
      </header>

      <div role="tablist" aria-label={TITLE_HE} className="flex gap-2 overflow-x-auto">
        {STUDY_TRACKS.map((track) => {
          const isActive = track.id === active;
          return (
            <button
              key={track.id}
              type="button"
              role="tab"
              aria-current={isActive ? 'true' : undefined}
              aria-selected={isActive}
              onClick={() => setActive(track.id)}
              className={
                isActive
                  ? 'flex min-h-touch shrink-0 items-center gap-1.5 rounded-full border border-brand bg-brand/10 px-4 text-sm font-bold text-brand-surface'
                  : 'flex min-h-touch shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-4 text-sm text-ink-muted'
              }
            >
              {isActive && <ActiveTrackMark />}
              {track.labelHe}
            </button>
          );
        })}
      </div>

      <div
        data-track-status
        className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-4"
        aria-live="polite"
      >
        <h2 className="text-base font-semibold text-ink">{trackLabelHe(active)}</h2>
        {metric.kind === 'unreachable' ? (
          <p className="text-sm text-ink-muted">{UNREACHABLE_HE}</p>
        ) : (
          <p className="text-sm text-ink-muted">{metric.summaryHe}</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: הרץ ותוודא הצלחה**

```
npx vitest run components/StudiesScreen.test.ts lib/core/studyTracks.test.ts
npm run typecheck
```
צפוי: PASS. ⚠️ אם `≥4 <button>` נכשל כי JSX ממופה בלולאה — הבדיקה סופרת מחרוזת מקור, ⛔ לא DOM מרונדר, אז `<button` בתוך `.map` נספר **פעם אחת** במקור. שנה את הבדיקה לבדוק `role="tab"` ו-`STUDY_TRACKS.length` יחד, ⛔ לא לספור תגיות פיזיות בלולאה.

- [ ] **Step 5: Commit**

```bash
./scripts/g add components/StudiesScreen.tsx components/StudiesScreen.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX StudiesScreen becomes the four-track selector (T-246)"
```

---

## Task 4 — חיווט הדפים

**Files:**
- Modify: `app/(tabs)/studies/page.tsx`
- Modify: `app/dev/tabs/studies/page.tsx`

**Interfaces:**
- Consumes: `<StudiesScreen>` מ-Task 3.
- Produces: שני הדפים מרנדרים `<StudiesScreen>` בלי הכותרת המבוססת-תאריך.

- [ ] **Step 1: `app/(tabs)/studies/page.tsx` — שער סשן בלבד**

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StudiesScreen from '@/components/StudiesScreen';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

/**
 * לימודים — הטאב שהלומד נוחת עליו אחרי onboarding ובכל כניסה חוזרת (D-027).
 * T-246 · `36 § 9`: המסך הוא בורר ארבעת המסלולים, ⛔ ולא ספירת ימים לבחינה
 * (D-077/D-083 נסוגו מפני D-176 — ראה `plan/40-decisions.md`).
 *
 * הסשן נבדק כאן ולא רק ב-`proxy.ts` — לקח F-003, ששער אחד על דלת אחת הוא נקודת
 * כשל יחידה. TD-13 נגזרת מכך: המסלול הזה דורש env של Supabase ועונה 307 בלעדיו,
 * ולכן הגאומטריה נמדדת דרך `/dev/tabs/studies`.
 *
 * ⛔ **הקריאה לנתוני ההתקדמות אינה כאן** — `<StudiesScreen>` קורא אותה בעצמו
 * דרך `GET /api/levels/summary` (Task 3), בדיוק הדפוס של `<LevelMapScreen>`.
 */
export const dynamic = 'force-dynamic';

export default async function StudiesPage() {
  const env = readSupabaseEnv();
  if (!env) redirect('/login?expired=1');

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?expired=1');

  return <StudiesScreen />;
}
```

- [ ] **Step 2: `app/dev/tabs/studies/page.tsx` — פיקסטורה קבועה**

```tsx
import StudiesScreen from '@/components/StudiesScreen';
import TabBar from '@/components/TabBar';
import type { LevelSummary } from '@/lib/core/levelSummary';

/**
 * רתמת פריסה ל-check:mobile. ⛔ אינו מסך מוצר ו⛔ אינו מקושר משום מקום.
 *
 * `<TabBar />` נקרא כאן מפני שהפיקסטורה חיה **מחוץ** ל-`app/(tabs)` — בדיוק הסיבה
 * שקבוצת המסלול קיימת. בלעדיו הפיקסטורה הייתה קצרה ב-4.5rem מהמסך שהיא מייצגת.
 *
 * `fixtureLevels` קבוע ו⛔ אינו תלוי ברשת: פיקסטורה שתלויה ברגע שהיא רצה בו
 * מייצרת מספרים שאי-אפשר לשחזר בהרצה הבאה — אותו לקח כמו `SAMPLE_TODAY` הישן.
 */
const FIXTURE_LEVELS: readonly LevelSummary[] = [
  { level: 'A1', totalInLevel: 315, known: 189, inReviewList: 18, unseen: 108 },
  { level: 'A2', totalInLevel: 80, known: 10, inReviewList: 4, unseen: 66 },
  { level: 'B1', totalInLevel: 20, known: 0, inReviewList: 0, unseen: 20 },
  { level: 'B2', totalInLevel: 2, known: 0, inReviewList: 0, unseen: 2 },
  { level: 'C1', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
  { level: 'C2', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
];

export default function DevTabsStudiesPage() {
  return (
    <>
      <StudiesScreen fixtureLevels={FIXTURE_LEVELS} />
      <TabBar />
    </>
  );
}
```

- [ ] **Step 3: הרץ את החבילה המלאה**

```
npm run typecheck && npm run check:core && npm test && npm run build
```
צפוי: PASS. ⚠️ אם `npm run build` נכשל על `React.JSX.Element` ב-`StudiesScreen.tsx` — בדוק שה-import של `React` אינו נדרש (הפרויקט משתמש ב-JSX runtime החדש; שאר הרכיבים כמו `StudiesScreen` הישן וה-`LevelMapScreen` לא מייבאים `React` בעצמם — עקוב אחרי אותו דפוס).

- [ ] **Step 4: Commit**

```bash
./scripts/g add "app/(tabs)/studies/page.tsx" app/dev/tabs/studies/page.tsx
./scripts/g commit -m "loop(DEV): C-XXXX wire the studies route + fixture to the track selector (T-246)"
```

---

## Task 5 — שערי `verify-mobile` והרישומים הנגזרים

**Files:**
- Modify: `scripts/verify-mobile.mjs`
- Regenerate: `docs/architecture-map.json` (`npm run generate-map`)
- Regenerate: `plan/63-surfaces.md` (`npm run build:surfaces`)

**Interfaces:**
- Consumes: כלום חדש — עדכון תצורה קיימת.
- Produces: שער חי ל-`/dev/tabs/studies` שתואם את המסך החדש; שני קבצים נגזרים מעודכנים.

⚠️ **הקדמה — למה זה חלק מהתוכנית ⛔ ולא ניקיון נפרד.** המסך הישן נשא **בדיוק** יעד `data-primary-action` אחד (`<Link href="/cards">`), ו-`scripts/verify-mobile.mjs` בנוי סביב ההנחה הזאת בשני מקומות: `PRIMARY_ACTION_ROUTES` (מצפה ליעד מסומן אחד) ו-`FLOW_ARRIVAL['/dev/tabs/studies']` (מקיש עליו ומצפה לנחיתה ב-`/login`). המסך החדש **אין לו יעד מסומן יחיד** — ארבעת השבבים הם בורר, ⛔ לא ניווט, ו-T-246 לבדה (השורה עצמה קובעת) אינה עוברת ל-T-247. השארת שתי הציפיות האלה כפי שהן תפיל את `check:mobile` על כל תיק לא-מטופל, ⛔ ולא על באג.

- [ ] **Step 1: הסר את `/dev/tabs/studies` מ-`PRIMARY_ACTION_ROUTES`**

בקובץ `scripts/verify-mobile.mjs`, מצא:
```js
const PRIMARY_ACTION_ROUTES = [...FLOW_ROUTES, '/dev/tabs/studies', '/dev/tabs/cards'];
```
והחלף ב:
```js
// ⚠️ `/dev/tabs/studies` הוסר מכאן ב-T-246 (C-XXXX): המסך הפך לבורר ארבעת
// המסלולים, ואין בו יעד data-primary-action יחיד יותר — ארבעת השבבים הם בורר
// (role="tab"), ⛔ לא CTA. חוזר לרשימה הזאת כש-T-247 (נתיב המודולים) נותן למסלול
// הנבחר יעד לחיצה אמיתי.
const PRIMARY_ACTION_ROUTES = [...FLOW_ROUTES, '/dev/tabs/cards'];
```

- [ ] **Step 2: הסר את `FLOW_ARRIVAL['/dev/tabs/studies']`**

באותו קובץ, `scripts/verify-mobile.mjs`, מחק את הבלוק:
```js
'/dev/tabs/studies': {
  kind: 'navigates',
  to: '/login',
  marker: 'input[name="email"]',
  why: '...',
},
```
והוסף לפני `'/dev/tabs/cards': {`:
```js
// ⚠️ `/dev/tabs/studies` אין לו יותר ערך FLOW_ARRIVAL (T-246, C-XXXX): הבורר אינו
// מנווט לשום מקום — הוא state מקומי בין ארבעה שבבים. T-247 מחזיר יעד אמיתי.
```

- [ ] **Step 3: הוסף שער תוכן ל-`/dev/tabs/studies`**

מצא את בלוק הבדיקות הכלליות שרץ על כל route ב-`TAB_ROUTES` (ליד ה-44px / horizontal-scroll checks), והוסף שם — או בבלוק ייעודי חדש מיד אחרי הגדרת `TAB_ROUTES` — שער תוכן:

```js
// T-246 · C-XXXX: /dev/tabs/studies הפך לבורר ארבעת המסלולים. ⚠️ המספרים כאן
// (≥4 · ≥400) הם השער שכתבה PM ב-T-246 עצמה (`plan/50-tasks.md`), ⛔ לא המצאה
// של הבדיקה — אם 400 לא נמדד בפועל, זה ממצא לפתוח, ⛔ לא סף להוריד בשקט.
if (route === '/dev/tabs/studies') {
  const targets = await page.locator('main [role="tab"]').count();
  check(targets >= 4, `${at} ≥4 track targets`, `found ${targets}`);

  const text = await page.locator('main').innerText();
  check(
    text.length >= 400,
    `${at} ≥400 characters of real content (T-246)`,
    `measured ${text.length}`,
  );
  check(!text.includes('—'), `${at} ⛔ no "—" as a metric (D-046/D-082)`, 'found "—" in main text');
}
```

⚠️ **הוסף את הבלוק הזה בתוך לולאת ה-route הראשית**, במקום שבו `at` ו-`page` כבר מוגדרים (אותו מקום שבו יושבים שאר בדיקות ה-44px/horizontal-scroll לכל route) — ⛔ לא כבלוק נפרד עם `page.goto` משלו, שהיה כפל ניווט.

- [ ] **Step 4: הרץ את `check:mobile`**

```
(npx next dev -p 3000 &) && sleep 25
npm run check:mobile
```
בדוק את הפלט עבור `/dev/tabs/studies`: אם `≥400 characters` נכשל, זה ממצא אמיתי — לא שנה את הסף; הוסף שורה קצרה נוספת (למשל: מספר המסלול מתוך ארבעה, "מסלול 1 מתוך 4") **רק אם היא נגזרת מהרנדר או מהמפרט**, ⛔ לא טקסט ממולא כדי לעבור בדיקה.

- [ ] **Step 5: רענן את הקבצים הנגזרים**

```
npm run generate-map
npm run build:surfaces
```
בדוק ב-`plan/63-surfaces.md` ששורת `/studies` מסומנת ✅ בעמודת «מצב ריק» — `emptyTrackMetric`'s `'אין עדיין פריטים ב...'` תואם את ה-regex `EMPTY` של `scripts/build-surfaces.mjs` (`אין עדיין`).

- [ ] **Step 6: השער-הכולל — `npm run verify`, ועדכון הרגיסטרים**

```
npm run verify
```
זו הפקודה היחידה שסוגרת את הטיק (STEP 6 של `docs/agents/DEV.md`) — חמש הפקודות ברצף אחד: `typecheck` · `check:core` · `check:motion` · `check:rules` · `test` · `build` · `check:mobile`. ⛔ אין טענת «עובר» בלי ריצה טרייה שלה באותה הודעה. עדכן ב-`plan/50-tasks.md`: שורת `T-246` ⬜→🟣 עם מזהה המחזור. עדכן ב-`plan/30-architecture.md` שורה קצרה על `lib/core/studyTracks.ts`. הרץ:
```
npm run measure:plan
```
ווודא ש-`docs/plan-tables.md` ו-`docs/plan-open.md` יוצאים באותו קומיט (`RULES § 0.1 ח׳`).

- [ ] **Step 7: Commit**

```bash
./scripts/g add scripts/verify-mobile.mjs docs/architecture-map.json plan/63-surfaces.md \
  plan/50-tasks.md plan/30-architecture.md docs/plan-tables.md docs/plan-open.md
./scripts/g commit -m "loop(DEV): C-XXXX verify-mobile gate for the track selector + register close-out (T-246)"
```

---

## Self-Review

**1. Spec coverage** — `36 § 9` שורה־שורה: בורר ארבעת המסלולים ✅ (Task 3) · סוג מדד כפרמטר של המסלול ✅ (Task 2, `TrackMetricState`) · רישום מונחה-נתונים ✅ (`STUDY_TRACKS`) · מבנה ריק מוצהר עם מספר אמיתי ✅ (`emptyTrackMetric`) · תחזית רק במסלול עם קצב מדיד — **מכוסה בהיעדר**: אין תחזית בכלל, כי אין נוסחה מוגדרת (Global Constraint 8, מתועד ⛔ ולא מושתק). T-246ⓕ (אפס נקודות/XP/רצף/עמודה חדשה) ✅ — `route.ts` לא מוסיף עמודה, רק שדה בתשובת JSON.

**2. Placeholder scan** — כל בלוק קוד בתוכנית הזאת שלם ובר-הרצה; אין `TODO`, אין «implement later», אין «similar to Task N» בלי הקוד עצמו.

**3. Type consistency** — `StudyTrackId` מוגדר פעם אחת (`lib/core/studyTracks.ts`) ומיובא בכל מקום, ⛔ לא משוכפל. `TrackMetricState` זהה בין Task 2 ל-Task 3. `fixtureLevels` הוא אותו שם ואותו טיפוס (`readonly LevelSummary[]`) ב-Task 3 וב-Task 4.
