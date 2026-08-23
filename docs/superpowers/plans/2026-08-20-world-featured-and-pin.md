# תוכנית — «העולם»: הגמילה של האריח הגדול ופִּין «אתמול» (D-071)

> **מקור:** `plan/40-decisions.md` §D-071 (‏PM C-0233) + `plan/50-tasks.md` שורות **T-132 · T-133**.
> **כתובה בטיק:** C-0235 (DEV, 📝 טיק תכנון).
> **טווח:** שתי משימות רצופות באותו אזור מוצר — `העולם` (מסך הבית). ⛔ אין קוד בטיק
> התכנון, ⛔ אין שינוי בקבצי מוצר, ⛔ אין `npm install`.

---

## 0. הקשר בשתי שורות (מה נשבר, ולמה השבירה קטנה)

הוספת האריח «המילים שאספתי» (T-110) הזיזה את **האריח הגדול** מ«זירה» ל«המילים
שאספתי» — לא בגלל שינוי בסדר הרשת, אלא כי `featuredAppId` בוחר את **האחרון הפתוח**
בסדר הרשת. `WORLD_APP_ORDER = ['compose', 'arcade', 'collected']`, ולכן הוספת
`collected` מרעילה גם את בחירת הגדול. **D-071ⓐ** מנתק את בחירת הגדול מסדר הרשת;
**D-071ⓑ** מפצה על היות `collected` נמוך-עדיפות (⇒ קטן ⇒ קל לפספס) בעזרת פִּין
חד-שורתי מעל האריח.

---

## 1. ממשקים (חתימות בלבד — הקוד מתמלא בטיק הביצוע)

### 1.1 מודול טהור

```ts
// lib/core/worldApps.ts
export const LEARNING_PRIORITY: readonly WorldAppId[] =
  ['arcade', 'compose', 'collected'];

// חתימה קיימת — ⛔ אין שינוי חתימה, יש שינוי מימוש בגוף (שלב ב׳ בלבד)
export function featuredAppId(apps: readonly WorldApp[]): WorldAppId | null;
```

### 1.2 חוזה HTTP

```ts
// GET /api/arcade/collected — תגובת ok נוספת של שדה חדש, ⛔ בלי שינוי בקיימים
type CollectedResponseOk = {
  readonly ok: true;
  readonly words: readonly CollectedWord[];
  readonly hiddenCount: number;
  /** ⛔ **`?` הוא חלק מהחוזה**: «אין פריט אחרון ⇒ ⛔ אין שדה».
   *  «אתמול» = הפריט האחרון שנאסף (⛔ לא חלון זמן) — נלקח מ־`first_seen_at` המקסימלי. */
  readonly latest?: { readonly enText: string; readonly collectedAt: string };
};
```

### 1.3 חוזה תצוגה

```tsx
// components/AppGrid.tsx — פִּין (⛔ מעל, ⛔ לא בתוך) האריח `collected`
// שורה יחידה: «המילה שאספת אתמול — <EnWord>{enText}</EnWord>»
// ⛔ אין שדה חדש בחיצוני — הפִּין נגזר מ־latest של GET /api/arcade/collected
// ⛔ אין תגמול, ⛔ אין מונה, ⛔ אין רצף; לחיצה על השורה = ניווט אל האריח (⛔ אין מסך משלה)
```

---

## Task 1 · T-132 · `featuredAppId` נגמל מסדר הרשת (D-071ⓐ)

**קבצים** — 2 בלבד:
1. `lib/core/worldApps.ts` — הוספת `LEARNING_PRIORITY` + החלפת גוף `featuredAppId`.
2. `lib/core/worldApps.test.ts` — עדכון הבדיקה הקיימת «אין חיוב» + הוספת 3 בדיקות חדשות.

**⛔ ⛔ לא נוגעים ב:**
- `WORLD_APP_ORDER` (סדר הרשת ⛔ לא זז — F-084).
- `components/AppGrid.tsx` (אין שינוי תצוגה — הרכיב קורא את אותה חתימה).
- הכלל הראשון של `featuredAppId` (‏`hasActiveTask && open` — D-046).

### צעדים (2–5 דק׳ כל אחד)

- [x] **1.1** ‏`LEARNING_PRIORITY` נוסף אחרי `WORLD_APP_ORDER` (‏שורה 51):
  ```ts
  /** בחירת האריח הגדול (⛔ ⛔ סדר הרשת) — «תרגול > הפקה > השתקפות» (D-071ⓐ). */
  export const LEARNING_PRIORITY: readonly WorldAppId[] = ['arcade', 'compose', 'collected'];
  ```
- [x] **1.2** גוף `featuredAppId` מוחלף — הכלל השני קורא את `LEARNING_PRIORITY`:
  ```ts
  export function featuredAppId(apps: readonly WorldApp[]): WorldAppId | null {
    const busy = apps.find((a) => a.hasActiveTask && a.state.kind === 'open');
    if (busy !== undefined) return busy.id;
    const byId = new Map(apps.map((a) => [a.id, a] as const));
    for (const id of LEARNING_PRIORITY) {
      const cand = byId.get(id);
      if (cand?.state.kind === 'open') return cand.id;
    }
    return null;
  }
  ```
- [x] **1.3** הערה בראש הקובץ (‏סעיף 3) מתעדכנת מ«האחרון שנפתח» ל־«הראשון בסדר
      הפדגוגי `LEARNING_PRIORITY`; סדר הרשת ⛔ אינו קלט». ⛔ בלי `xp/score/points/gem` —
      הבדיקה סורקת את המקור עצמו.
- [x] **1.4** ‏`lib/core/worldApps.test.ts` — הבדיקה בשורות 54–78 מתעדכנת:
  ```ts
  it('הגדול = הראשון עם חיוב פתוח; אין ⇒ הראשון בסדר `LEARNING_PRIORITY` (D-071ⓐ)', () => {
    // חיוב מנצח סדר עדיפויות
    expect(
      featuredAppId([app({ id: 'compose' }), app({ id: 'arcade', hasActiveTask: true })]),
    ).toBe('arcade');
    // שלושה פתוחים בלי חיוב ⇒ הראשון ב-LEARNING_PRIORITY = arcade
    expect(
      featuredAppId([app({ id: 'compose' }), app({ id: 'arcade' }), app({ id: 'collected' })]),
    ).toBe('arcade');
    // רק compose ו-collected פתוחים ⇒ compose
    expect(
      featuredAppId([
        app({ id: 'compose' }),
        app({ id: 'arcade', state: { kind: 'locked', noteHe: 'נדרשות 12 מילים ברמה, יש 8' } }),
        app({ id: 'collected' }),
      ]),
    ).toBe('compose');
    // רק collected פתוח ⇒ collected
    expect(
      featuredAppId([
        app({ id: 'compose', state: { kind: 'locked', noteHe: 'נדרשות 12 מילים ברמה, יש 8' } }),
        app({ id: 'arcade', state: { kind: 'unknown' } }),
        app({ id: 'collected' }),
      ]),
    ).toBe('collected');
    // חיוב על אריח נעול ⛔ אינו מגדיל אותו — נופל לסדר העדיפויות (D-046)
    expect(
      featuredAppId([
        app({ id: 'compose' }),
        app({
          id: 'arcade',
          hasActiveTask: true,
          state: { kind: 'locked', noteHe: 'נדרשות 12 מילים ברמה, יש 8' },
        }),
      ]),
    ).toBe('compose');
    // כלום פתוח ⇒ null
    expect(
      featuredAppId([
        app({ id: 'compose', state: { kind: 'unknown' } }),
        app({ id: 'arcade', state: { kind: 'unknown' } }),
      ]),
    ).toBeNull();
  });
  ```
- [x] **1.5** בדיקה חדשה — סדר הרשת ⛔ אינו קלט:
  ```ts
  it('סדר `WORLD_APP_ORDER` ⛔ אינו משפיע על `featuredAppId` (F-084 · D-071ⓐ)', () => {
    // גם אם הרשת הפוכה בקלט — הבחירה מונחית `LEARNING_PRIORITY`
    const inputs = [app({ id: 'collected' }), app({ id: 'compose' }), app({ id: 'arcade' })];
    expect(featuredAppId(inputs)).toBe('arcade');
  });
  ```
- [x] **1.6** בדיקת מקור: `LEARNING_PRIORITY` = ‏`['arcade', 'compose', 'collected']`
      **בדיוק**, ⛔ לא מכיל id כפול, ⛔ לא כולל מזהה שאינו ב־`WORLD_APP_ORDER`:
  ```ts
  it('`LEARNING_PRIORITY` הוא בדיוק שלושת מזהי `WORLD_APP_ORDER` בסדר D-071ⓐ', () => {
    expect([...LEARNING_PRIORITY]).toEqual(['arcade', 'compose', 'collected']);
    expect(new Set(LEARNING_PRIORITY).size).toBe(LEARNING_PRIORITY.length);
    for (const id of LEARNING_PRIORITY) expect(WORLD_APP_ORDER).toContain(id);
  });
  ```

### בדיקה עצמית (⛔ טענת אימות בלי הרצה = פסולה)

- [x] **מוטציה 1** — ‏הפיכת סדר `LEARNING_PRIORITY` ל־`['collected','compose','arcade']`:
      **חייבת** להפיל את «שלושה פתוחים ⇒ arcade», את «רק compose ו-collected ⇒ compose»,
      ואת «F-084 · סדר הרשת ⛔ אינו קלט».
- [x] **מוטציה 2** — הסרת סעיף «חיוב על אריח נעול»: מפילה את הבדיקה בשמה.
- [x] **מוטציה 3** — מחיקת בדיקת המקור על `LEARNING_PRIORITY`: **אינה** מגיעה לאימות;
      פועלת רק כרשת ביטחון לרֶגרֶסיה שקטה.
- [x] הרצה טרייה בקומיט הביצוע: `typecheck ✓` · `check:core ✓` (המודול טהור — ⛔ React) ·
      `npm test ✓` (‏קובץ הבדיקה עולה מ־8 ל־10 בדיקות · `it` הראשונה נשארה בשם עם ניסוח D-071ⓐ).
- [x] `git diff` נדרש: **שני קבצים בלבד** — `lib/core/worldApps.ts` (+8/−6 שורות משוערות)
      ו־`lib/core/worldApps.test.ts` (+35/−3 שורות משוערות).

---

## Task 2 · T-133 · פִּין «המילה שאספת אתמול» מעל אריח `collected` (D-071ⓑ)

**קבצים** — 4:
1. `app/api/arcade/collected/route.ts` — הוספת השדה `latest?` לתגובת GET.
   ⚠️ ‏T-133 נוקבת בטעות ב־`app/api/world/collected/route.ts`; ה־endpoint האמיתי הוא
   `/api/arcade/collected` (‏אומת ב־`grep`: `app/(tabs)/world/collected/page.tsx`
   קורא `apiGet('/api/arcade/collected')`). ⛔ **נשמר, אין הזזה** — הכתיבה ב־plan היא
   לחוזה החי; פתיחת נתיב חדש הייתה קוד מת (‏אותה מחלקה כמו F-074).
2. `app/api/arcade/collected/route.test.ts` — בדיקות חדשות ל־`latest` (‏קיים · ⛔ קיים).
3. `components/AppGrid.tsx` — הפִּין (רכיב פנימי · ⛔ תוספת שורה בלבד מעל האריח).
4. `docs/api-contract.md` — עדכון סעיף `GET /api/arcade/collected` (‏באותו קומיט —
   R-002).

**⛔ ⛔ לא נוגעים ב:**
- שינוי שדות קיימים של התגובה (⇒ שוברי לקוחות קיימים).
- הוספת מונה/רצף/תגמול לפִּין (§ D-071ⓑ אוסר).
- מסך משלו (‏לחיצה על הפִּין = ניווט לאריח).

### צעדים

- [x] **2.1** ‏`route.ts` — ⚠️ **בוצע בסטייה מדודה, ⛔ ולא כנוסחו.** ⛔ **אין שאילתה שנייה:** `latest` נגזר מ-`words[0]` דרך `latestCollected` (‏`lib/core/arcadeCollection.ts`, טהור). **שתי הסיבות נמדדו:** ⓐ `words` כבר `first_seen_at desc` ומסונן ל-`hidden_by_learner=false` ⇒ `words[0]` **הוא** הפריט האחרון הגלוי, ושאילתה שנייה היא הלוך-חזור נוסף על אותו נתון · ⓑ השאילתה שהתוכנית מכתיבה מצטרפת ל-`words` בלבד, ⛔ **בלי `senses!inner`** ⇒ מילה בלי תרגום הייתה נכתבת בפִּין ⛔ ונעדרת מהאריח שהפִּין מוביל אליו. הגזירה סוגרת את הפער. **הנוסח המקורי, לשעבר:** — אחרי שאילתת ה־words + hiddenCount, שאילתה נוספת:
  ```ts
  // «אתמול» = הפריט האחרון שנאסף — פשוט, מדיד, ⛔ לא חלון זמן (D-071ⓑ)
  const { data: latestRow, error: latestErr } = await supabase
    .from('arcade_collected_words')
    .select('first_seen_at, words:word_id(headword)')
    .eq('user_id', user.id)
    .eq('hidden_by_learner', false)
    .order('first_seen_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestErr) {
    console.error('[api/arcade/collected] latest read failed:', latestErr.message);
    return isSchemaMissing((latestErr as { code?: string }).code) ? schemaMissing() : unavailable();
  }
  const latest = latestRow?.words?.headword
    ? { enText: latestRow.words.headword as string, collectedAt: latestRow.first_seen_at as string }
    : undefined;

  return NextResponse.json({ ok: true, words, hiddenCount: count ?? 0, ...(latest ? { latest } : {}) });
  ```
- [x] **2.2** ‏`route.test.ts` — שלוש בדיקות חדשות, ⚠️ **כסריקת מקור ⛔ ולא כ-mock**: הקובץ כולו סורק מקור (‏`withoutComments(readFileSync(...))`) ו-`vitest.config.ts` רץ ב-`node` בלי jsdom ⇒ ‏mock של Supabase היה מנגנון חדש שלם. ההתנהגות עצמה נמדדת ב-**5 בדיקות אמת** על `latestCollected` ב-`lib/core/arcadeCollection.test.ts`. **הנוסח המקורי, לשעבר:** (‏חוזה):
  ```ts
  it('GET מחזיר `latest.enText` + `latest.collectedAt` כשקיים פריט אחרון גלוי', async () => { /* mock — headword: "cat" */ });
  it('⛔ GET ⛔ אינו מחזיר `latest` כשאין ולו פריט גלוי אחד (D-071ⓑ)', async () => { /* mock — 0 rows */ });
  it('⛔ פריט מוסתר ⛔ אינו נבחר ל־`latest` (`hidden_by_learner=true` נופל בפילטר)', async () => { /* mock — רק rows מוסתרים */ });
  ```
- [x] **2.3** ‏`components/AppGrid.tsx` — קריאה חדשה ל־`apiGet<CollectedResponse>('/api/arcade/collected')`
      (בפרויקט זה קיימת רק ב־`app/(tabs)/world/collected/page.tsx`; להוסיף כאן
      `useEffect` מקבילה שקוראת רק את `latest`, ⛔ **לא** את מערך `words` המלא. ⇒ אם
      הביצוע גדול — פנייה לשרת חדש שמחזיר רק את `latest` תיכתב כמשימת המשך; להיום
      קריאה אחת מספיקה כי הגוף קטן: ≤ 20 שורות בפועל).
- [x] **2.4** ‏`AppGrid.tsx` — מעל האריח `collected` (ולא בתוכו), שורה:
  ```tsx
  {featuredHint && appId === 'collected' ? (
    <p className="mb-1 truncate text-sm text-muted" data-collected-pin>
      המילה שאספת אתמול — <EnWord>{featuredHint.enText}</EnWord>
    </p>
  ) : null}
  ```
      ⛔ ⛔ `text-overflow: ellipsis` דרך `truncate` — 16 תו הוא **דרישת מפרט**, ⛔ לא CSS
      נוקשה (‏רוחב האריח משתנה); לומד מפוצץ במילים ארוכות אינו נשבר.
- [x] **2.5** ‏`docs/api-contract.md` — סעיף `GET /api/arcade/collected` מקבל שורה
      חדשה: «‏`latest?` — `{enText, collectedAt}`; חסר ⇒ ‏«אין פריט אחרון גלוי». ⛔ אין
      חלון זמן — `enText` הוא ה־`headword` של השורה בעלת `first_seen_at` המקסימלי
      תחת `hidden_by_learner=false`.»

### בדיקה עצמית

- [x] **מוטציה A** ✅ **נמדדה נופלת** (1 failed / 19) — — הסרת בלוק `latest` מהחזרת GET: מפילה את שתי הבדיקות הראשונות
      (‏«מחזיר `latest` כשקיים», «⛔ אינו מחזיר `latest` כשאין»).
- [x] **מוטציה B** ✅ **נמדדה נופלת** (1 failed / 19) — — הסרת תנאי `hidden_by_learner=false` בשאילתת latest: מפילה את
      «⛔ פריט מוסתר ⛔ אינו נבחר».
- [x] **מוטציה C** ✅ **נמדדה נופלת** (1 failed / 13) — — הסרת `appId === 'collected'` בתנאי הפִּין: הפִּין מוצג מעל כל אריח.
      **דרוש שומר מקור** ב־`components/AppGrid.test.tsx` (‏אם קיים; אחרת בדיקה חדשה של
      3 שורות): «הפִּין חי אך ורק מעל `collected`».
- [x] **מוטציה D** ✅ (‏חדשה, ⛔ לא בתוכנית) `visible[0]` ⇒ `visible[length-1]`: **2 failed / 18**.
- [x] **מוטציה E** ✅ (‏חדשה) הסרת שומר `headword` ריק: **1 failed / 18**.
- [x] ⚠️ **רגרסיה שנמדדה ⛔ ולא שוערה:** `check:mobile` נפל ב-**3 שערים** (`/world` ב-320/375/414) על `503 @/api/arcade/collected` בקונסולה — הבקשה החדשה. ⇒ רשומה **צרה** ב-`EXPECTED_CONSOLE['/world']`, קשורה לכתובת אחת ולסטטוס אחד בדיוק כמו `/api/arcade/round` שמעליה. **957 ✓ אחריה.**
- [x] הרצה טרייה: `typecheck ✓` · `check:core ✓` · `npm test ✓` (+3 חוזה +1 שומר מקור) ·
      `npm run build ✓` · `npm run check:mobile ✓` (‏הפִּין נכנס לאזור העליון של הרשת —
      ⛔ ⛔ שינוי `y` של הפעולה הראשית שהוגדרה ב־F-027; שומר `first paint` יאותת).
- [x] `git diff` צפוי: `route.ts` (+15/−1), `route.test.ts` (+45), `AppGrid.tsx` (+~10),
      `docs/api-contract.md` (+3), `docs/superpowers/plans/…` (המשימה סומנה בוצע).

---

## 3. מה מחוץ לתוכנית, במפורש (⛔ לא לגעת)

- **`WORLD_APP_ORDER`** — סדר הרשת. F-084 חי ופתוח; ⛔ אין ל־Dev הכרעה על סדר הרשת.
- **מסך `/world/collected` עצמו** — הרכיב `<CollectedWords>` ⛔ אינו נוגע ב־`latest`;
  זה שדה של רשת הבית בלבד, ⛔ לא של המסך הפנימי.
- **תגמול/מונה/רצף** — D-071ⓑ אוסר במפורש.
- **הזזת ה־endpoint** ל־`/api/world/collected` — היה מגדיל את שטח ה־HTTP בלי ערך.

---

## 4. סדר מסירה

- **טיק ביצוע 1 (Dev הבא):** Task 1 בלבד (‏מודול טהור + בדיקות). קומיט אחד.
  אימות מלא ⇒ מסירה ל־CRITIC.
- **טיק ביצוע 2 (Dev הבא-הבא):** Task 2 (‏route + component + חוזה). קומיט שני.
  אימות מלא ⇒ מסירה ל־CRITIC.
- **⛔ ⛔ שני ה־Task ⛔ באותו קומיט** — הם עצמאיים, ובאותו קומיט הביצוע יקשה על סקירת
  ה־CRITIC (§0.4 ד׳).
