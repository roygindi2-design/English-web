# השלמת הזירה — סף הניצחון · התחמושת הגלויה · הבמה — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (או
> `superpowers:subagent-driven-development`). כל צעד הוא `- [ ]` ונסגר רק אחרי הרצה.

**נכתב:** C-0215 (DEV, 📝 טיק תכנון) · 2026-08-20T02:4xZ (`date -u`)

**Goal:** לסגור שלוש משימות זירה ברצף אחד — **T-126 → T-130 → T-117**: החוק (סף
הניצחון נגזר), המדידה שהלומד רואה (מונה התחמושת), והבמה שמגיבה לה.

**Architecture:** שלוש השכבות שהריפו כבר אוכף: החוק ב-`lib/core/*` (טהור, ⛔ אפס
React/DOM/רשת), הרכיב **מצייר ⛔ ואינו מחשב**, והנתיב **מחיל תוכנית כתיבה ⛔ ואינו
מחשב סף**. כל שלוש המשימות מוסיפות **נגזרת** במקום קבוע, כי בדיוק קבוע-שמייצג-נגזרת
הוא מה ש-D-067 מדד כפגם.

**Tech Stack:** Next 16 (App Router) · React 19 · TypeScript (`noUncheckedIndexedAccess`) ·
Tailwind 3 · vitest 2 (⛔ **אין RTL ואין jsdom** — בדיקות רכיב הן **סריקת מקור**,
התבנית ב-`components/ArenaBoard.test.ts:1-31`) · playwright ל-`check:mobile`.

**Spec:** `plan/40-decisions.md` D-067 (שורה 1778) · D-070 (שורה 1821) · D-059 · D-060 ·
D-045 · D-050 · T-041 · `plan/35-design-constitution.md` § 1 · § 5 ·
`plan/50-tasks.md` שורות T-126 · T-130 · T-117 · `docs/api-contract.md` § `POST /api/arcade/result`.

**⛔ מה ⛔ אינו בתוכנית הזאת, במכוון:** T-103 (סיבוב השטף — חסום ב-T-118) ·
T-109/T-110/T-118 (יש להן תוכנית משלהן, `2026-08-19-collected-words.md`) ·
F-074 (מחכה להכרעת מסך של ה-PM · `no_level` ב-`ArenaBoard`/`ArcadeEntry` — ⛔ **אל
תיגע בשני הענפים האלה בשלוש המשימות כאן**).

---

## Global Constraints — חלים על שלוש המשימות

- **TDD.** הבדיקה נכתבת ראשונה, **מורצת ונמדדת שהיא נופלת** (⛔ לא מונח שתיפול), ואז
  המימוש. הפלט של ההרצה נכנס לדיווח.
- **`/lib/core` טהור.** ⛔ אפס React · window · document · localStorage · fetch ·
  process.env. השער: `npm run check:core`.
- **⛔ רכיב ממשק אינו ניגש לדאטהבייס.** `<ArenaBoard>` מדבר רק דרך `lib/api/client.ts`.
- **⛔ אין שעון בזירה** (D-045 · R-020): אפס `setTimeout` · `setInterval` ·
  `requestAnimationFrame` · `deadline`. ‏`ArenaBoard.test.ts:34-40` כבר אוכף — ⛔ אל תרכך אותו.
- **⛔ אין ניקוד, מטבע ו-XP** (D-050).
- **חוקה § 1 — צבע לעולם אינו הערוץ היחיד.** כל מספר על המסך נושא תווית עברית.
- **חוקה § 4 · F-011 · F-016 — ⛔ אפס `justify-center` · `h-screen` · גרדיאנט סגול ·
  `Inter` · פינות אחידות.**
- **חוקה § 5 — תנועה: 150–300ms של *מעבר*, ⛔ ואין לולאה.** `ARENA_IDLE_LOOP=false`
  (`arcadeLadder.ts`) הוא הדגל, והוא נשאר כבוי (‏`03-for-roy` פריט 39).
- **Mobile-First 375px · יעדי מגע 44px · RTL · TypeScript ללא `any`.**
- **שער האימות בכל קומיט:**
  `npm run typecheck && npm run check:core && npm test && npm run build`
  ⛔ טענת «עובר» בלי הרצה בהודעה עצמה אסורה.
- **`docs/api-contract.md` מתעדכן באותו קומיט של כל שינוי בגוף/תשובה של נקודת קצה.**

---

## File Structure

| קובץ | אחריות | משימה |
|---|---|---|
| `lib/core/arcadeLadder.ts` | **המקום היחיד** לקבועי הקרב + `requiredHits()` החדשה | 1 |
| `lib/core/arcadeLadder.test.ts` | נעילת הקבועים והנגזרת | 1 |
| `lib/core/arcadeRound.ts` | שער הבריכה (ההערה ב-112-116 מתעדכנת) | 1 |
| `lib/core/arcadeBattle.ts` | `startBattle` נגזר · `ammoLeft()` · `stagePhase()` | 1 · 2 · 3 |
| `lib/core/arcadeBattle.test.ts` | חוקי הקרב | 1 · 2 · 3 |
| `lib/core/arcadeResult.ts` | `planArcadeWrites` — הסף נגזר ⛔ ולא מהלקוח | 1 |
| `lib/core/arcadeResult.test.ts` | «בית-בבית» + הסף | 1 |
| `app/api/arcade/result/route.ts` | ⛔ אינו מחשב — מעביר `answers` בלבד | 1 |
| `docs/api-contract.md` | הסרת `enemyHp` מהגוף + ניסוח הסף | 1 |
| `components/ArenaBoard.tsx` | ציור: שורת המצב · הבמה | 2 · 3 |
| `components/ArenaBoard.test.ts` | סריקת מקור | 1 · 2 · 3 |
| `components/ArenaStage.tsx` | **חדש** — שתי הדמויות והתנועה | 3 |
| `components/ArenaStage.test.ts` | **חדש** | 3 |
| `app/globals.css` | שלושת כללי התנועה של הבמה | 3 |

---

## Task 1: סף הניצחון נגזר ממספר השאלות (T-126)

**המדידה שהולידה את המשימה (D-067, הורצה ⛔ ולא הוסקה):**
`POOL=12 ⇒ q=12 ⇒ נדרש 10/12 = 83%` מול 67% ש-D-059 קובעת. השורש: שער הבריכה 12
(`ARCADE_MIN_WORDS_PER_LEVEL`) מול תחמושת 15 (`ARCADE_AMMO`).

**Files:**
- Modify: `lib/core/arcadeLadder.ts:26` (הקבוע) · `:88-95` (`isVictory`)
- Modify: `lib/core/arcadeLadder.test.ts:15-23` · `:60-76`
- Modify: `lib/core/arcadeRound.ts:112-116` (ההערה בלבד — הקוד כבר נכון)
- Modify: `lib/core/arcadeBattle.ts:26-36` · `lib/core/arcadeBattle.test.ts`
- Modify: `lib/core/arcadeResult.ts:49` · `lib/core/arcadeResult.test.ts`
- Modify: `components/ArenaBoard.tsx:69-72,132,217,413` · `components/ArenaBoard.test.ts:122`
- Modify: `docs/api-contract.md:872-895`

**Interfaces:**
- Produces:
  ```ts
  // lib/core/arcadeLadder.ts
  export const ARCADE_MIN_WORDS_PER_LEVEL: number;   // = ARCADE_AMMO  (היה 12)
  export function requiredHits(questionCount: number): number;
  export function isVictory(correct: number, questionCount: number): boolean;

  // lib/core/arcadeBattle.ts
  export interface BattleState {
    readonly questions: readonly ArcadeQuestion[];
    readonly index: number;
    readonly enemyHp: number;
    readonly enemyHpMax: number;      // ⇐ חדש: המקסימום נגזר, ולכן חייב להישמר
    readonly answers: readonly ArcadeAnswer[];
    readonly chosen: string | null;
  }
  ```
- Consumes: `ARCADE_AMMO = 15` · `ARCADE_ENEMY_HP = 10` (שניהם קיימים, ⛔ ואינם משתנים).

**ההכרעה, ולמה היא שתיים ולא אחת:** שכבה ⓐ לבדה (שער 15) מחזירה 67% היום, ⛔ ונשברת
בכל מסלול עתידי שיחזיר פחות שאלות. שכבה ⓑ לבדה (סף נגזר) נותנת קרב בן 12 שאלות עם
סף 8 — ⛔ קרב חוקי אבל **קצר מהתחמושת**, כלומר תחמושת שאין לה מטרה. שתיהן יחד.

- [ ] **Step 1: הבדיקה הנופלת — הנגזרת ושער הבריכה**

ב-`lib/core/arcadeLadder.test.ts`, **החלף** את הבלוק `describe('D-059 …')`
שבשורות 8-28 בזה (⛔ שים לב: `isVictory` מקבלת עכשיו שני ארגומנטים):

```ts
describe('D-059 · D-067 — שלושת קבועי הקרב, והסף שנגזר מהם', () => {
  it('15 שאלות · 10 חיי יריב · 3 ניצחונות לרמה', () => {
    expect(ARCADE_AMMO).toBe(15);
    expect(ARCADE_ENEMY_HP).toBe(10);
    expect(ARCADE_WINS_PER_LEVEL).toBe(3);
  });

  it('D-067ⓐ — שער הבריכה הוא התחמושת עצמה, ⛔ ולא 12', () => {
    expect(ARCADE_MIN_WORDS_PER_LEVEL).toBe(ARCADE_AMMO);
  });

  it('D-067ⓑ — הסף הוא 67% של מה שנשלח בפועל, בכל אורך סיבוב', () => {
    expect(requiredHits(15)).toBe(10);
    expect(requiredHits(12)).toBe(8);
    expect(requiredHits(14)).toBe(10);
    expect(requiredHits(30)).toBe(20);
    for (const q of [12, 13, 14, 15, 20, 30]) {
      const ratio = requiredHits(q) / q;
      expect(ratio).toBeGreaterThanOrEqual(2 / 3);
      expect(ratio).toBeLessThan(2 / 3 + 1 / q);
    }
  });

  it('⛔ קלט פסול ⛔ אינו מקל — הרצפה היא הקבוע', () => {
    expect(requiredHits(0)).toBe(ARCADE_ENEMY_HP);
    expect(requiredHits(-5)).toBe(ARCADE_ENEMY_HP);
    expect(requiredHits(1.5)).toBe(ARCADE_ENEMY_HP);
    expect(requiredHits(Number.NaN)).toBe(ARCADE_ENEMY_HP);
  });

  it('סיבוב מלא: 10 מנצח, 9 ⛔ לא — ⛔ ובסיבוב בן 12 הסף הוא 8', () => {
    expect(isVictory(9, 15)).toBe(false);
    expect(isVictory(10, 15)).toBe(true);
    expect(isVictory(15, 15)).toBe(true);
    expect(isVictory(7, 12)).toBe(false);
    expect(isVictory(8, 12)).toBe(true);
  });

  it('D-060 · פריט 39 — לולאת ההמתנה כבויה בברירת מחדל', () => {
    expect(ARENA_IDLE_LOOP).toBe(false);
  });
});
```

ובראש הקובץ הוסף `requiredHits` לרשימת הייבוא.
ובבלוק `describe('D-061 · D-046 …')` (שורות 60-76) — **החלף כל `12` שהוא
`required`/`ARCADE_MIN_WORDS_PER_LEVEL` ב-`15`**: `describeLevel(3, 14)` ⇒
`{ unlocked: false, required: 15, eligible: 14 }` · `describeLevel(3, 15)` ⇒
`{ unlocked: true, required: 15, eligible: 15 }` · `expect(ARCADE_MIN_WORDS_PER_LEVEL).toBe(15)`
· `describeLevel(11, 0)` ו-`describeLevel(12, 0)` ⇒ `required: 15`.

- [ ] **Step 2: הרצה — לוודא נפילה**

```bash
npx vitest run lib/core/arcadeLadder.test.ts
```
צפוי: FAIL — `requiredHits is not a function` + `expected 12 to be 15`.

- [ ] **Step 3: המימוש ב-`arcadeLadder.ts`**

```ts
/** רמה שאין בה תחמושת שלמה של מילים כשירות מוצגת **נעולה עם המספר** (D-046 · D-067ⓐ).
 *  ⛔ המספר הוא `ARCADE_AMMO` ⛔ ולא 12: שער נמוך מהתחמושת מחזיר קרב שסף הניצחון בו 83%. */
export const ARCADE_MIN_WORDS_PER_LEVEL = ARCADE_AMMO;

/**
 * D-067ⓑ — כמה פגיעות דרושות לניצחון בסיבוב שנשלחו בו `questionCount` שאלות.
 * ⛔ `ceil(q · 2/3)` ⛔ ולא קבוע: קבוע מייצג 67% **רק** כשהסיבוב הוא בדיוק 15.
 * ⛔ קלט פסול נופל ל-`ARCADE_ENEMY_HP` ⛔ ולא ל-0 — סף שאפשר לנצח בו באפס תשובות
 * הוא בדיוק מה שהסעיף הזה נולד למנוע.
 */
export function requiredHits(questionCount: number): number {
  if (!Number.isInteger(questionCount) || questionCount <= 0) return ARCADE_ENEMY_HP;
  return Math.ceil((questionCount * 2) / 3);
}

/** ⛔ `>=` ולא `===`: תחמושת עודפת אינה מבטלת ניצחון. ⛔ ושני ארגומנטים ולא אחד —
 *  קריאה בת ארגומנט אחד ⛔ אינה מהדרת, וזה מה שמאלץ כל קורא לומר מכמה שאלות. */
export function isVictory(correct: number, questionCount: number): boolean {
  return correct >= requiredHits(questionCount);
}
```

- [ ] **Step 4: הרצה — הבדיקה עוברת, ו-`tsc` מראה את כל הקוראים**

```bash
npx vitest run lib/core/arcadeLadder.test.ts && npm run typecheck
```
צפוי: הבדיקה PASS · `typecheck` **נכשל** ב-`lib/core/arcadeResult.ts:49`
(`Expected 2 arguments, but got 1`). זו המטרה של החתימה.

- [ ] **Step 5: הבדיקה הנופלת — הסף בצד השרת ⛔ אינו מגיע מהלקוח**

ל-`lib/core/arcadeResult.test.ts` הוסף:

```ts
describe('D-067ⓑ — הסף נגזר, ⛔ והלקוח ⛔ אינו יכול להנמיך אותו', () => {
  const answer = (correct: boolean, i: number) => ({
    wordId: `w-${i}`, correct, chosen: 'א', answer: correct ? 'א' : 'ב',
  });
  const before = { gameLevel: 1, wins: 0, unlockedItems: [] as string[] };

  it('קרב מלא: 10 נכונות מתוך 15 ⇒ ניצחון · 9 ⇒ היריב שרד', () => {
    const win = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: Array.from({ length: 15 }, (_, i) => answer(i < 10, i)),
    });
    expect(win.outcome).toBe('victory');
    const lose = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: Array.from({ length: 15 }, (_, i) => answer(i < 9, i)),
    });
    expect(lose.outcome).toBe('survived');
  });

  it('⛔ תשובה אחת נכונה ⛔ אינה ניצחון — הרצפה היא התחמושת', () => {
    const plan = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: [answer(true, 0)],
    });
    expect(plan.enemyDefeated).toBe(false);
    expect(plan.outcome).toBe('survived');
  });

  it('סיום מוקדם: 10 תשובות שכולן נכונות ⛔ עדיין ניצחון', () => {
    const plan = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: Array.from({ length: 10 }, (_, i) => answer(true, i)),
    });
    expect(plan.outcome).toBe('victory');
  });
});
```

- [ ] **Step 6: הרצה — לוודא נפילה**

```bash
npx vitest run lib/core/arcadeResult.test.ts
```
צפוי: FAIL (הקובץ ⛔ אינו מהדר — `isVictory` דורשת שני ארגומנטים).

- [ ] **Step 7: המימוש ב-`arcadeResult.ts:47-50`**

```ts
  const correct = input.answers.filter((a) => a.correct).length;
  // ⛔ מספר השאלות ⛔ אינו מגיע מהגוף (D-059 · D-067ⓑ): לקוח ששלח «שלחו לי שאלה אחת»
  // היה מנצח בתשובה אחת. `Math.max` מול התחמושת חוסם **בדיוק** את זה, ועדיין מתיר
  // סיום מוקדם (10 תשובות ⇒ הסף נשאר 10) וגם סיבוב עתידי ארוך מ-15.
  // ⛔ הכיוון היחיד שהלקוח יכול להזיז בו את הסף הוא **למעלה**, וזה ⛔ אינו רווח לו.
  const served = Math.max(input.answers.length, ARCADE_AMMO);
  const won = isVictory(correct, served);
```
והוסף `ARCADE_AMMO` לייבוא מ-`./arcadeLadder`.

- [ ] **Step 8: הרצה**

```bash
npx vitest run lib/core/arcadeResult.test.ts && npm run typecheck
```
צפוי: PASS · `typecheck` ⇒ 0 שגיאות.

- [ ] **Step 9: מוטציה — לוודא שהשער אמיתי**

החלף זמנית `Math.max(input.answers.length, ARCADE_AMMO)` ב-`input.answers.length`,
הרץ `npx vitest run lib/core/arcadeResult.test.ts`, וּודא שנופלת **בשמה**
«⛔ תשובה אחת נכונה ⛔ אינה ניצחון». **החזר את השורה.**

- [ ] **Step 10: `BattleState.enemyHpMax` — הבדיקה הנופלת**

ל-`lib/core/arcadeBattle.test.ts` הוסף:

```ts
describe('D-067ⓑ — חיי היריב נגזרים מהסיבוב שנשלח', () => {
  it('15 שאלות ⇒ 10 חיים, והמקסימום נשמר במצב', () => {
    const s = startBattle(QUESTIONS);
    expect(s.enemyHp).toBe(10);
    expect(s.enemyHpMax).toBe(10);
  });

  it('סיבוב בן 12 ⇒ 8 חיים ⛔ ולא 10 — קרב שאפשר לנצח בו', () => {
    const s = startBattle(QUESTIONS.slice(0, 12));
    expect(s.enemyHp).toBe(8);
    expect(s.enemyHpMax).toBe(8);
  });

  it('⛔ המקסימום ⛔ אינו זז כשהחיים יורדים', () => {
    const s = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    expect(s.enemyHp).toBe(9);
    expect(s.enemyHpMax).toBe(10);
  });
});
```

- [ ] **Step 11: הרצה — לוודא נפילה**

```bash
npx vitest run lib/core/arcadeBattle.test.ts
```
צפוי: FAIL — `enemyHpMax` ⛔ אינו קיים בטיפוס.

- [ ] **Step 12: המימוש ב-`arcadeBattle.ts`**

הוסף `enemyHpMax` ל-`BattleState` (ראה בלוק `Interfaces` למעלה), והחלף את
`startBattle`:

```ts
export function startBattle(questions: readonly ArcadeQuestion[]): BattleState {
  // ⛔ הנגזרת ⛔ ולא הקבוע (D-067ⓑ): סיבוב קצר מהתחמושת חייב יריב חלש יותר,
  // אחרת הוא קרב שאי-אפשר לנצח בו. ⛔ והמקסימום נשמר, כי המסך מצייר «M מתוך N».
  const hp = requiredHits(questions.length);
  return { questions, index: 0, enemyHp: hp, enemyHpMax: hp, answers: [], chosen: null };
}
```
ובייבוא: `import { ARCADE_ENEMY_HP, requiredHits } from './arcadeLadder';`.

- [ ] **Step 13: הרצה + הקוראים ב-`ArenaBoard`**

```bash
npx vitest run lib/core/arcadeBattle.test.ts && npm run typecheck
```
אם `typecheck` מצביע על `components/ArenaBoard.tsx` — תקן שם **שלוש** נקודות:
`:132` `HP_PIPS` יורד כקבוע מודול ונבנה מתוך המצב (Task 2 עושה זאת ממילא;
בשלב הזה מספיק `const pips = Array.from({ length: battle.enemyHpMax }, (_, i) => i);`
בתוך הרנדר) · `:413` `מתוך ${battle.enemyHpMax}` · `:69-72,217` הגוף של הבקשה.

- [ ] **Step 14: הסרת `enemyHp` מגוף הבקשה — הבדיקה הנופלת**

ב-`components/ArenaBoard.test.ts` **החלף** את שורה 122
(`expect(CODE).toMatch(/enemyHp:\s*ARCADE_ENEMY_HP/);`) ב:

```ts
    // D-067ⓑ — הסף חי בשרת. ⛔ שדה סף בגוף הבקשה הוא הזמנה לזייף ניצחון.
    expect(CODE).not.toMatch(/enemyHp\s*:/);
    expect(CODE).toMatch(/send\(\s*\{\s*answers:\s*battle\.answers\s*\}\s*\)/);
```

- [ ] **Step 15: הרצה — לוודא נפילה**

```bash
npx vitest run components/ArenaBoard.test.ts
```
צפוי: FAIL — `enemyHp:` עדיין במקור.

- [ ] **Step 16: המימוש ב-`ArenaBoard.tsx`**

`:69-72` ⇒ `type ResultPayload = { readonly answers: readonly ArcadeAnswer[] };`
`:217` ⇒ `void send({ answers: battle.answers });`
ומחק את `ARCADE_ENEMY_HP` מהייבוא בשורה 11 אם אין לו קורא נוסף.

- [ ] **Step 17: `docs/api-contract.md` — באותו קומיט**

בסעיף `POST /api/arcade/result`, **החלף** את פסקת «⛔ `enemyHp` בגוף הבקשה ⛔ אינו
נקרא…» (שורות 888-892) ב:

```md
⛔ **הגוף נושא `answers` ⛔ ובלבד.** הסף ⛔ אינו שדה בבקשה ו⛔ אינו קבוע: השרת גוזר
אותו ב-`requiredHits(max(answers.length, ARCADE_AMMO))` (`lib/core/arcadeLadder.ts` ·
D-067ⓑ) ⇒ `ceil(q · 2/3)`, כלומר **67% בכל אורך סיבוב**. לקוח ששולח תשובה אחת ⛔ אינו
מנצח — הרצפה היא התחמושת. השדה `enemyHp` **הוסר מהלקוח ב-T-126**.
```
ובטבלת התשובה, השורה של `enemyDefeated` ⇒
``| `enemyDefeated` | `correct ≥ requiredHits(q)` — 10 מתוך 15 (D-067ⓑ). ניצחון מעלה את מונה הניצחונות; **שלושה** מעלים `arcade_level` ב-1, מאפסים את המונה ופותחים **פריט אחד** (D-061) |``

⚠️ ובנוסף: ההערה ב-`app/api/arcade/result/route.ts:65-66` («הסף ⛔ אינו מגיע מהגוף»)
נשארת נכונה — **הוסף לה** «⛔ וגם ⛔ אינו קבוע (D-067ⓑ)».
⚠️ וב-`lib/core/arcadeRound.ts:112-116` ההערה אומרת «12 < 15 היה משאיר בדיוק את אותו
חור» — **עדכן** ל«השער הועלה ל-`ARCADE_AMMO` ב-T-126 ⇒ החור נסגר בבריכה עצמה».

- [ ] **Step 18: השער המלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```
צפוי: 0 · OK · כל הקבצים ירוקים · build 0. ⛔ אל תמשיך לפני שכל הארבע ירוקות.

- [ ] **Step 19: קומיט**

```bash
git add -A
git commit -m "loop(DEV): C-XXXX T-126 סף הניצחון נגזר ממספר השאלות (D-067)"
```

---

## Task 2: מונה התחמושת גלוי (T-130)

**המדידה (D-070 · C-0208):** `ArenaBoard.tsx:405-425` מצייר את חיי היריב ⛔ ואינו
מצייר כמה קליעים נשארו, בעוד `BattleState.index` כבר קיים ⛔ ואינו מגיע למסך ⇒
**המחיר של המהירות ⛔ אינו קיים ללומד.**

**Files:**
- Modify: `lib/core/arcadeBattle.ts` (‏`ammoLeft`) · `lib/core/arcadeBattle.test.ts`
- Modify: `components/ArenaBoard.tsx:98-132` (מחרוזות) · `:404-424` (שורת המצב)
- Modify: `components/ArenaBoard.test.ts`

**Interfaces:**
- Consumes: `BattleState` מ-Task 1, כולל `enemyHpMax`.
- Produces:
  ```ts
  // lib/core/arcadeBattle.ts
  export function ammoLeft(state: BattleState): number;
  ```

**ההכרעה שכבר הוכרעה, ו⛔ אינה שלך:** הנוסח הוא של D-070 —
«נשארו לך N קליעים · ליריב M חיים», **שני המספרים באותה שורת מצב**, ⛔ אין ספירה
לאחור · ⛔ אין שעון · ⛔ אין מכפיל · ⛔ אין ניקוד. ⛔ אל תמציא ניסוח שני.
⚠️ **הצורה היחידה שנגזרת כאן היא היחיד/רבים** (`קליע אחד` מול `N קליעים`) — זו
נאמנות דקדוקית לאותו נוסח ⛔ ולא הכרעת מסך חדשה; אם ה-Critic חולק, זו שורה אחת.

- [ ] **Step 1: הבדיקה הנופלת — `ammoLeft`**

ל-`lib/core/arcadeBattle.test.ts` הוסף:

```ts
describe('D-070 — התחמושת שנותרה, כדי שלמהירות יהיה מחיר', () => {
  it('בתחילת הקרב נשארו כל הקליעים', () => {
    expect(ammoLeft(startBattle(QUESTIONS))).toBe(ARCADE_AMMO);
  });

  it('⛔ הקליע נשרף ברגע ההקשה ⛔ ולא ב«הבא» — אחרת המחיר מגיע באיחור', () => {
    const chosen = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    expect(ammoLeft(chosen)).toBe(ARCADE_AMMO - 1);
    expect(ammoLeft(advance(chosen))).toBe(ARCADE_AMMO - 1);
  });

  it('הקשה שגויה מורידה את התחמושת ⛔ ואינה נוגעת בחיי היריב', () => {
    const before = startBattle(QUESTIONS);
    const after = chooseOption(before, 'מסיח 1א');
    expect(ammoLeft(after)).toBe(ammoLeft(before) - 1);
    expect(after.enemyHp).toBe(before.enemyHp);
  });

  it('בסוף הקרב ⛔ אין תחמושת שלילית', () => {
    let s = startBattle(QUESTIONS);
    for (let i = 0; i < QUESTIONS.length; i += 1) s = advance(chooseOption(s, 'מסיח 1א'));
    expect(ammoLeft(s)).toBe(0);
  });
});
```
(⛔ `ARCADE_AMMO` כבר מיובא בקובץ, שורה 13. `'מסיח 1א'` הוא המסיח של הפיקסטורה —
ודא מול `q()` בראש הקובץ ⛔ ואל תניח.)

- [ ] **Step 2: הרצה — לוודא נפילה**

```bash
npx vitest run lib/core/arcadeBattle.test.ts
```
צפוי: FAIL — `ammoLeft is not a function`.

- [ ] **Step 3: המימוש**

```ts
/**
 * D-070 — כמה קליעים נשארו. ⛔ הקליע נשרף ב-`chooseOption` ⛔ ולא ב-`advance`:
 * הלומד רואה את המחיר של הבחירה **בזמן שהוא רואה את התשובה**, ⛔ ולא אחריה.
 * ⛔ `Math.max(0, …)` — תחמושת שלילית היא מצב שאין לו ציור.
 */
export function ammoLeft(state: BattleState): number {
  const spent = state.index + (state.chosen === null ? 0 : 1);
  return Math.max(0, state.questions.length - spent);
}
```

- [ ] **Step 4: הרצה**

```bash
npx vitest run lib/core/arcadeBattle.test.ts
```
צפוי: PASS.

- [ ] **Step 5: מוטציה**

החלף זמנית ב-`state.questions.length - state.index`, הרץ, וּודא שנופלת **בשמה**
«⛔ הקליע נשרף ברגע ההקשה». **החזר.**

- [ ] **Step 6: הבדיקה הנופלת — שורת המצב במסך**

ל-`components/ArenaBoard.test.ts` הוסף:

```ts
describe('D-070 · T-130 — שורת המצב נושאת את שני המספרים', () => {
  it('הנוסח הוא של D-070, מילה במילה', () => {
    expect(CODE).toContain('קליעים');
    expect(CODE).toContain('ליריב');
    expect(CODE).toMatch(/נשארו לך \$\{ammo\} קליעים · ליריב \$\{hp\} חיים/);
  });

  it('היחיד ⛔ אינו «1 קליעים»', () => {
    expect(CODE).toContain('קליע אחד');
  });

  it('שני המספרים באים מהחוק ⛔ ולא מחישוב מקומי', () => {
    expect(CODE).toMatch(/ammoLeft\(battle\)/);
    expect(CODE).not.toMatch(/questions\.length\s*-\s*battle\.index/);
  });

  it('⛔ אין ספירה לאחור, שעון, מכפיל וניקוד (D-050 · D-070)', () => {
    for (const banned of [/countdown/i, /\bscore\b/i, /multiplier/i, /ניקוד/, /שניות/]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('חוקה § 1 — המספרים נגישים גם בלי צבע', () => {
    expect(CODE).toMatch(/aria-label=\{`[^`]*קליעים/);
  });
});
```

- [ ] **Step 7: הרצה — לוודא נפילה**

```bash
npx vitest run components/ArenaBoard.test.ts
```
צפוי: FAIL בארבע מהחמש.

- [ ] **Step 8: המימוש — המחרוזות**

ב-`components/ArenaBoard.tsx`, ליד שאר המחרוזות (‏`:98-115`):

```ts
/** D-070 — ⛔ שני המספרים באותה שורה, כי המתח הוא **היחס ביניהם**. */
const statusHe = (ammo: number, hp: number): string =>
  `${ammo === 1 ? 'נשאר לך קליע אחד' : `נשארו לך ${ammo} קליעים`} · ליריב ${hp} חיים`;
```
⚠️ הבדיקה בצעד 6 דורשת את התבנית `נשארו לך ${ammo} קליעים · ליריב ${hp} חיים`
**כמחרוזת רצופה במקור** — ולכן כתוב את הענף כך:

```ts
const AMMO_ONE_HE = 'נשאר לך קליע אחד';
const statusHe = (ammo: number, hp: number): string =>
  ammo === 1 ? `${AMMO_ONE_HE} · ליריב ${hp} חיים` : `נשארו לך ${ammo} קליעים · ליריב ${hp} חיים`;
```

- [ ] **Step 9: המימוש — שורת המצב**

**החלף** את הבלוק `:404-424` (הפסקה `{ENEMY_HP_HE}: {battle.enemyHp}` וה-`div`
עם ה-pips) ב:

```tsx
      {/* שורת המצב — בקרה, ⛔ ולא תצוגת נתונים (§ 4.2י שאלה 5): ⛔ אין כאן גרף.
          התווית העברית והמספר הולכים עם הצבע, כי צבע לעולם אינו הערוץ היחיד (חוקה § 1). */}
      <div className="flex flex-col gap-2">
        <p className="text-base font-semibold text-ink">
          {statusHe(ammoLeft(battle), battle.enemyHp)}
        </p>
        <div
          role="img"
          aria-label={`${statusHe(ammoLeft(battle), battle.enemyHp)} מתוך ${battle.enemyHpMax}`}
          className="flex flex-row gap-1"
        >
          {Array.from({ length: battle.enemyHpMax }, (_, i) => i).map((pip) => (
            <span
              key={pip}
              aria-hidden
              className={pip < battle.enemyHp ? PIP_ON_CLASS : PIP_OFF_CLASS}
            />
          ))}
        </div>
      </div>
```
ומחק את `HP_PIPS` (‏`:132`) ואת `ENEMY_HP_HE` אם נשארו בלי קורא —
`npm run typecheck` יגיד. הוסף `ammoLeft` לייבוא מ-`@/lib/core/arcadeBattle`.

- [ ] **Step 10: הרצה**

```bash
npx vitest run components/ArenaBoard.test.ts && npm run typecheck
```
צפוי: PASS · 0.

- [ ] **Step 11: השער המלא + המסך במובייל**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```
⚠️ `check:mobile` נמדד היום **3 כשלים** (F-082ⓑ · T-131, ⛔ קדמו לך). המספר חייב
להישאר **3** ⛔ ולא לעלות — שורת מצב ארוכה יותר יכולה לגלוש ב-320px.

- [ ] **Step 12: קומיט**

```bash
git add -A
git commit -m "loop(DEV): C-XXXX T-130 מונה התחמושת גלוי לצד חיי היריב (D-070)"
```

---

## Task 3: הבמה — שני אזורים, והתנועה נכלאת בעליון (T-117)

**Files:**
- Create: `components/ArenaStage.tsx` · `components/ArenaStage.test.ts`
- Modify: `lib/core/arcadeBattle.ts` (‏`stagePhase`) · `lib/core/arcadeBattle.test.ts`
- Modify: `app/globals.css` (שלושה כללים) · `components/ArenaBoard.tsx` · `components/ArenaBoard.test.ts`

**Interfaces:**
- Consumes: `ArenaAvatar` (‏`components/ArenaAvatar.tsx`, קיים):
  `({ items, role, className }: { items: readonly string[]; role: 'hero' | 'enemy'; className?: string })`
- Produces:
  ```ts
  // lib/core/arcadeBattle.ts
  export type StagePhase = 'idle' | 'hit' | 'dodge';
  export function stagePhase(state: BattleState): StagePhase;

  // components/ArenaStage.tsx
  export interface ArenaStageProps {
    readonly phase: StagePhase;
    readonly items: readonly string[];
  }
  export default function ArenaStage(props: ArenaStageProps): React.JSX.Element;
  ```

**⛔ שני האזורים, וזה כל העניין (D-060 · T-041):** התנועה חיה **אך ורק** בבמה.
אזור השאלה — המילה וארבע האפשרויות — ⛔ **לעולם אינו זז ואינו מונפש**: עקרון
הקוהרנטיות של Mayer. ⛔ ולכן הבדיקה סורקת את `ArenaBoard` ומוודאת שאין `transition`/
`animate` על רכיבי השאלה.

- [ ] **Step 1: הבדיקה הנופלת — `stagePhase`**

ל-`lib/core/arcadeBattle.test.ts` הוסף:

```ts
describe('D-060 — הבמה יודעת מה לצייר מהחוק ⛔ ולא מהרכיב', () => {
  it('לפני הקשה — המתנה', () => {
    expect(stagePhase(startBattle(QUESTIONS))).toBe('idle');
  });

  it('תשובה נכונה ⇒ מכה', () => {
    expect(stagePhase(chooseOption(startBattle(QUESTIONS), 'אפשרות 1'))).toBe('hit');
  });

  it('תשובה שגויה ⇒ התחמקות, ⛔ ולא «פגיעה בלומד»', () => {
    expect(stagePhase(chooseOption(startBattle(QUESTIONS), 'מסיח 1א'))).toBe('dodge');
  });

  it('אחרי «הבא» הבמה חוזרת להמתנה', () => {
    const s = advance(chooseOption(startBattle(QUESTIONS), 'אפשרות 1'));
    expect(stagePhase(s)).toBe('idle');
  });
});
```

- [ ] **Step 2: הרצה — לוודא נפילה**

```bash
npx vitest run lib/core/arcadeBattle.test.ts
```
צפוי: FAIL — `stagePhase is not a function`.

- [ ] **Step 3: המימוש**

```ts
/** ⛔ שלוש תנוחות, ⛔ ואין רביעית. «הפסד» אינו מצב במוצר הזה (D-059). */
export type StagePhase = 'idle' | 'hit' | 'dodge';

/**
 * D-060 — מה הבמה מציירת. ⛔ הרכיב ⛔ אינו מחשב את זה בעצמו: תנוחה שנגזרת בשני
 * מקומות סוטה בשלישי. ⛔ שגיאה היא **התחמקות שמצליחה תמיד** ⛔ ולא פגיעה בלומד.
 */
export function stagePhase(state: BattleState): StagePhase {
  if (state.chosen === null) return 'idle';
  const last = state.answers[state.answers.length - 1];
  if (last === undefined) return 'idle';
  return last.correct ? 'hit' : 'dodge';
}
```

- [ ] **Step 4: הרצה**

```bash
npx vitest run lib/core/arcadeBattle.test.ts && npm run check:core
```
צפוי: PASS · OK.

- [ ] **Step 5: הבדיקה הנופלת — הבמה עצמה**

צור `components/ArenaStage.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ArenaStage.tsx', 'utf8');
const CSS = readFileSync('app/globals.css', 'utf8');

describe('<ArenaStage> — D-060 · חוקה § 5', () => {
  it('שתי דמויות, גיבור ויריב', () => {
    expect(SRC).toMatch(/role="hero"/);
    expect(SRC).toMatch(/role="enemy"/);
  });

  it('התנוחה מגיעה כ-prop מהחוק ⛔ ואינה מחושבת כאן', () => {
    expect(SRC).toMatch(/phase/);
    expect(SRC).not.toMatch(/\bcorrect\b/);
    expect(SRC).not.toMatch(/useState|useEffect/);
  });

  it('⛔ אפס שעון ואפס לולאת JS', () => {
    for (const banned of [/setTimeout/, /setInterval/, /requestAnimationFrame/]) {
      expect(SRC).not.toMatch(banned);
    }
  });

  it('⛔ אפס hex — הצבע מגיע מהאסימונים (חוקה § 2)', () => {
    expect(SRC).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('התנועה חיה ב-CSS, ולכל תנוחה יש כלל משלה', () => {
    expect(SRC).toMatch(/data-arena-phase=\{phase\}/);
    for (const phase of ['hit', 'dodge']) {
      expect(CSS).toContain(`[data-arena-phase='${phase}']`);
    }
  });

  it('חוקה § 5 — ⛔ אין משך מעל 300ms בכללי הבמה', () => {
    const block = CSS.slice(CSS.indexOf('/* arena-stage */'));
    expect(block.length).toBeGreaterThan(0);
    const ms = [...block.matchAll(/(\d+(?:\.\d+)?)ms/g)].map((m) => Number(m[1]));
    const s = [...block.matchAll(/(\d+(?:\.\d+)?)s\b/g)].map((m) => Number(m[1]) * 1000);
    expect([...ms, ...s].length).toBeGreaterThan(0);
    for (const d of [...ms, ...s]) expect(d).toBeLessThanOrEqual(300);
  });

  it('פריט 39 — ⛔ אין לולאת המתנה עד שרוי יאשר', () => {
    const block = CSS.slice(CSS.indexOf('/* arena-stage */'));
    expect(block).not.toMatch(/infinite/);
  });
});
```

- [ ] **Step 6: הרצה — לוודא נפילה**

```bash
npx vitest run components/ArenaStage.test.ts
```
צפוי: FAIL — `ENOENT: components/ArenaStage.tsx`.

- [ ] **Step 7: המימוש — הרכיב**

צור `components/ArenaStage.tsx`:

```tsx
import ArenaAvatar from '@/components/ArenaAvatar';
import type { StagePhase } from '@/lib/core/arcadeBattle';

/**
 * הבמה — T-117 · D-060 · חוקה § 5.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב**: התנוחה מגיעה מ-`stagePhase()` שב-`lib/core`.
 * ⛔ **אין כאן JS של תנועה** — אין `setTimeout` ואין `requestAnimationFrame`.
 * המעבר הוא כלל CSS יחיד לכל תנוחה, ‏`prefers-reduced-motion` מבטל אותו גלובלית
 * (`app/globals.css:103-108`) ⛔ בלי ולו `if` אחד כאן.
 * ⛔ **אין לולאת המתנה** — `ARENA_IDLE_LOOP` כבוי עד אישור (‏`03-for-roy` פריט 39).
 */
export interface ArenaStageProps {
  readonly phase: StagePhase;
  readonly items: readonly string[];
}

const STAGE_CLASS = 'flex flex-row items-end justify-between gap-4';
const FIGURE_CLASS = 'h-24 w-24';

export default function ArenaStage({ phase, items }: ArenaStageProps): React.JSX.Element {
  return (
    <div data-arena-stage data-arena-phase={phase} className={STAGE_CLASS}>
      <ArenaAvatar role="hero" items={items} className={FIGURE_CLASS} />
      <ArenaAvatar role="enemy" items={[]} className={FIGURE_CLASS} />
    </div>
  );
}
```

- [ ] **Step 8: המימוש — שלושת כללי ה-CSS**

בסוף `app/globals.css`:

```css
/* arena-stage — T-117 · D-060 · חוקה § 5. ⛔ מעבר, ⛔ ולא לולאה: אין `infinite`
   ואין `alternate`. `prefers-reduced-motion` (למעלה) מאפס את שלושת המשכים. */
[data-arena-stage] [data-arena-figure] {
  transition: transform 200ms ease-out;
}
[data-arena-phase='hit'] [data-arena-figure='enemy'] {
  transform: translateX(0.75rem);
}
[data-arena-phase='dodge'] [data-arena-figure='hero'] {
  transform: translateX(-0.75rem);
}
```
⚠️ הכללים דורשים ש-`ArenaAvatar` יפלוט `data-arena-figure={role}` על ה-`<svg>` —
**הוסף את התכונה** ב-`components/ArenaAvatar.tsx` (שינוי בן שורה אחת, ⛔ בלי לגעת
בשכבות). אם `components/ArenaAvatar.test.ts` נועל את רשימת התכונות — עדכן אותה
באותו קומיט.

- [ ] **Step 9: הרצה**

```bash
npx vitest run components/ArenaStage.test.ts components/ArenaAvatar.test.ts
```
צפוי: PASS.

- [ ] **Step 10: הבדיקה הנופלת — אזור השאלה מת (T-041)**

ל-`components/ArenaBoard.test.ts` הוסף:

```ts
describe('T-117 · T-041 — התנועה נכלאת בבמה', () => {
  it('הבמה מצוירת, והתנוחה מגיעה מהחוק', () => {
    expect(CODE).toMatch(/<ArenaStage\b/);
    expect(CODE).toMatch(/phase=\{stagePhase\(battle\)\}/);
  });

  it('⛔ אפס תנועה על אזור השאלה', () => {
    const options = CODE.slice(CODE.indexOf('data-arena-options'));
    for (const banned of [/\banimate-/, /\btransition\b/, /\bduration-/]) {
      expect(options).not.toMatch(banned);
    }
  });

  it('⛔ הרכיב ⛔ אינו מחשב תנוחה בעצמו', () => {
    expect(CODE).not.toMatch(/answers\[[^\]]*\]\.correct/);
  });
});
```

- [ ] **Step 11: הרצה — לוודא נפילה**

```bash
npx vitest run components/ArenaBoard.test.ts
```
צפוי: FAIL — `<ArenaStage` ⛔ אינו במקור.

- [ ] **Step 12: המימוש ב-`ArenaBoard.tsx`**

הוסף לייבוא: `import ArenaStage from '@/components/ArenaStage';` ו-`stagePhase`
מ-`@/lib/core/arcadeBattle`, ושתול את הבמה **מעל שורת המצב** ברנדר הקרב:

```tsx
      <ArenaStage phase={stagePhase(battle)} items={[]} />
```
⚠️ `items` הוא הפריטים שנפתחו. הם ⛔ **אינם** ב-`ArenaBoard` היום (התשובה של
`/api/arcade/result` מחזירה `unlocked` בסוף הקרב בלבד) ⇒ **העבר `[]`** ⛔ ואל
תמציא קריאה חדשה לדאטהבייס. חיווט הפריטים לבמה הוא משימה נפרדת — **רשום שורה
ב-`plan/60-findings.md` בדרגה ⚪ LOW** אם אינה קיימת.

- [ ] **Step 13: הרצה**

```bash
npx vitest run components/ArenaBoard.test.ts && npm run typecheck
```
צפוי: PASS · 0.

- [ ] **Step 14: מוטציה — שלוש, ושלוש נפילות בשם**

ⓐ שנה `200ms` ל-`400ms` ב-`globals.css` ⇒ חייבת ליפול «⛔ אין משך מעל 300ms».
ⓑ הוסף `animation: pulse 1s infinite;` לכלל הבמה ⇒ חייבת ליפול «⛔ אין לולאת המתנה».
ⓒ הוסף `transition-transform` ל-`OPTION_CLASS` ⇒ חייבת ליפול «⛔ אפס תנועה על אזור השאלה».
**החזר את שלושתן.**

- [ ] **Step 15: השער המלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```
צפוי: 0 · OK · ירוק · 0 · **`check:mobile` נשאר 3 כשלים** (⛔ לא יותר).

- [ ] **Step 16: קומיט + סגירת הרצף**

```bash
git add -A
git commit -m "loop(DEV): C-XXXX T-117 הבמה — שני אזורים, התנועה נכלאת בעליון (D-060)"
```
ואז: `plan/50-tasks.md` (שלוש השורות ל-🟣) · `plan/30-architecture.md` (§ חדש) ·
`plan/00-control.md` (‏`CYCLE_ID` · `NEXT_AGENT=CRITIC` · שחרור נעילה · `MILESTONE_TICKS`+1).

---

## Self-Review — נעשה בכתיבה

**1. כיסוי הספק.** D-067ⓐ (שער הבריכה) ⇒ Task 1 Step 3 · D-067ⓑ (סף נגזר) ⇒ Task 1
Steps 3·7·12 · D-070 (שני המספרים בשורה אחת) ⇒ Task 2 Steps 8-9 · D-060ⓐ (הבמה) ⇒
Task 3 Steps 7-8 · D-060ⓑ (אזור שאלה מת) ⇒ Task 3 Step 10 · חוקה § 5 (≤300ms ·
`prefers-reduced-motion`) ⇒ Task 3 Steps 5·8 · פריט 39 (אין לולאה) ⇒ Task 3 Step 5.
⚠️ **פער מוצהר:** `items` לבמה ⛔ אינו מחווט (Task 3 Step 12) — במכוון, כי הנתונים
⛔ אינם ב-`ArenaBoard` היום.

**2. סריקת מציין-מקום.** אין «TODO» · אין «טיפול מתאים בשגיאות» · אין «בדיקות כמו
במשימה N» — כל בלוק בדיקה כתוב במלואו.

**3. עקביות טיפוסים.** `requiredHits(number): number` · `isVictory(number, number)` ·
`ammoLeft(BattleState): number` · `stagePhase(BattleState): StagePhase` ·
`BattleState.enemyHpMax: number` — כל שם שמופיע ב-Task 2/3 מוגדר ב-Task 1 או בבלוק
`Interfaces` של אותה משימה.
