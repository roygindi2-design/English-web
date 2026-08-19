# תוכנית מימוש — **שלושת מסכי הזירה**  ·  T-095 → T-096 → T-097

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`.
> כל צעד הוא `- [ ]` ומיועד ל-2–5 דקות. ⛔ אל תדלג על צעד «הרץ ותראה שהבדיקה נכשלת».

**Goal:** לסגור את הצד הלקוחי של זירת הקרב — מסך הקרב, הדמות ומסך הסיום, והכניסה מ-`/cards` —
מעל החוזה שכבר קיים ונמדד (`GET /api/arcade/round` · `POST /api/arcade/result`).

**Architecture:** **חוקי הקרב יורדים לשכבה טהורה** (`lib/core/arcadeBattle.ts`) שאינה יודעת
דבר על React, בדיוק כפי ש-`arcadeRound.ts` ו-`arcadeResult.ts` אינם יודעים דבר על HTTP.
הרכיבים מציירים מצב ⛔ ואינם מחשבים אותו: `ArenaBoard` קורא ל-`chooseOption` ו⛔ אינו מוריד
חיים בעצמו. `/arcade` הוא מסך זרימה **מחוץ** ל-`app/(tabs)/` — בדיוק כמו `/world/compose` —
ולכן «בלי סרגל תחתון» הוא מבנה ⛔ ולא תנאי שאפשר לשכוח.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind (אסימונים סמנטיים
בלבד) · vitest. ⛔ אפס ספרייה חדשה, אפס תלות, אפס נכס חיצוני.

**Spec:** `plan/40-decisions.md` § 4.2י (תוכנית ה-UX המלאה) · § 4.2ז שורה 4 · D-044 · D-045 ·
D-046 · D-047 · D-050 · `docs/api-contract.md` §§ `GET /api/arcade/round` · `POST /api/arcade/result` ·
`plan/35-design-constitution.md` (קפואה).

---

## Global Constraints — חלים על **כל** משימה בתוכנית

| # | האילוץ | הערך המדויק |
|---|---|---|
| 1 | ⛔ אין שעון | ⛔ אפס `setTimeout` · `setInterval` · `deadline` · `countdown` בקבצי הזירה (D-045 · R-020 · מדד ⓔ) |
| 2 | ⛔ אין כתיבה למנוע החזרות | ⛔ אפס `word_progress` · `easiness` · `interval_days` · `repetition` · `next_review_at` · `self_marked_known` · `current_level` (D-044) |
| 3 | ⛔ אין ניקוד | ⛔ אפס `xp` · `score` · `points` · `coin` · `leaderboard` · «ניקוד» · «מטבע» · «לוח תוצאות» (D-050) |
| 4 | ⛔ אין hex גולמי | כל צבע דרך אסימון Tailwind (`text-ink` · `bg-surface-raised` · `text-success` …) — חוקה § 6 |
| 5 | ⛔ אין אמוג'י כאייקון | SVG מוטבע בלבד, `currentColor`, תבנית `components/LockIcon.tsx` — חוקה § 6 |
| 6 | יעד מגע | `min-h-touch` (44px) על **כל** בקרה ניתנת להקשה. `MIN_GAP` = 8px בין שכנות |
| 7 | ⛔ אין מרכוז אנכי | ⛔ אפס `justify-center` על מכולת עמוד · ⛔ אפס `h-screen` (`min-h-[100dvh]` בלבד) — חוקה § 4 · F-011 · F-016 |
| 8 | צבע לעולם אינו ערוץ יחיד | כל מצב נושא **תווית עברית** לצד הצבע — חוקה § 1 |
| 9 | אנגלית בתוך עברית | **אך ורק** דרך `<EnWord>` / `<EnText>` — חוקה § 2 |
| 10 | מוטיון | 150–300ms, מ-`transition-*` של Tailwind; `prefers-reduced-motion` כבר מנוטרל גלובלית ב-`app/globals.css:92` ⇒ ⛔ אל תוסיף שאילתת מדיה משלך |
| 11 | רדיוסים | `rounded-md` שדות · `rounded-lg` כפתורים · `rounded-2xl` כרטיסיות. ⛔ אין ערך רביעי |
| 12 | נוסח כשל | `FAILURE_HE` · `RETRY_HE` מ-`lib/core/failure.ts` ⛔ ולא מחרוזת חדשה (T-056) |
| 13 | ⛔ אין `dataviz` | מד חיי היריב הוא **בקרת מצב**, ⛔ לא תצוגת נתונים (§ 4.2י שאלה 5) |
| 14 | ⛔ אין שינוי בנקודות קצה | שלוש המשימות צורכות את החוזה הקיים כלשונו ⇒ ⛔ `docs/api-contract.md` **אינו** משתנה בתוכנית הזאת |

---

## 0 · מה כבר נמדד, ⛔ ולא נוחש  (C-0183)

⚠️ כל שורה כאן נקראה מהקוד בטיק התכנון. ⛔ אל תסמוך על הזיכרון — אם משהו כאן אינו נכון,
זה ממצא, ⛔ לא «התוכנית התכוונה».

1. **החוזה חי ומאומת.** `docs/api-contract.md:679` ו-`:750`. `GET /api/arcade/round` מחזיר
   ⓐ `{ok:true, level:null, round:null}` · ⓑ `{ok:true, level, seed, round:{questions}}` ·
   ⓒ `{ok:true, level, round:null, reason:'level_too_small', eligible, required}` ·
   ⓓ `401 {ok:false, code:'session_expired'}` · ⓔ `503 {ok:false, code:'schema_missing', message}` ·
   ⓕ `503 {ok:false, code:'unavailable'}`. **שש התשובות, ⛔ ולא ארבע.**
2. **הקבועים קיימים ומיוצאים** מ-`lib/core/arcadeRound.ts:14-16`: `ARCADE_MIN_WORDS = 12` ·
   `ARCADE_ROUND_SIZE = 8` · `ARCADE_OPTION_COUNT = 4`. ⛔ אל תכתוב 12 או 8 כמספר בקוד.
3. **`ArcadeAnswer`** מיוצא מ-`lib/core/arcadeResult.ts:13` — `{wordId, correct, chosen, answer}`.
   זו **בדיוק** צורת האיבר ב-`answers` של ה-POST ⇒ המסך ⛔ אינו ממציא טיפוס שני.
4. **`ARCADE_ITEMS`** = `['helmet','cape','lantern','boots','banner']` (`arcadeResult.ts:34`),
   ו-`ARCADE_MISSED_LIMIT = 5` (`:33`). הדמות מציירת ⛔ אך ורק את החמישה האלה.
5. **`/arcade` ⛔ אינו ב-`PROTECTED_SCREENS`** (`proxy.ts:27` = `['/onboarding','/studies','/cards','/me']`),
   וכך זה נשאר: `/study` ו-`/world` גם אינם, והנתיב עונה `session_expired` **כנתון**.
   ⚠️ זה גם מה שמאפשר ל-`check:mobile` למדוד את המסך במקום למדוד את `/login` (F-027 סיבה 1).
6. **תבנית הפיקסטורה קיימת ועובדת**: `components/ComposeDraft.tsx` מקבל `initialBank?`,
   ו-`app/dev/world/page.tsx` מרנדר את הרכיב האמיתי איתו. הסיבה מדודה: `check:mobile` מריץ
   `next start` בלי env של Supabase ⇒ כל נתיב אמיתי מגיע למצב **הכשל** שלו, וארבע האפשרויות
   מעולם לא היו על המסך. ⚠️ **בלי הפיקסטורה, מדד ⓓ של § 4.2י אינו נמדד — הוא מוצהר.**
7. **תבנית «מושבת עם המספר» קיימת** ב-`components/DeckSelector.tsx:189-198`: `<button type="button">`
   **בלי handler**, עם `aria-disabled="true"` ⛔ ולא עם התכונה `disabled` — כדי שקורא מסך
   עדיין ימצא אותו וישמע שהוא לא זמין. ⛔ אל תמציא תבנית שנייה.
8. **`—` ⛔ אינו `0`.** `DeckSelector.tsx:58` — מספר שאין לנו אינו מספר אפס. חל על `eligible`.
9. **`lib/core` טהור ונאכף**: `scripts/check-core-purity.mjs:10` אוסר `react` · `window.` ·
   `document.` · `localStorage` · `sessionStorage` · `process.env` · `fetch(`.
10. **בדיקות רכיב בריפו הזה הן סריקת מקור** (`components/*.test.ts`), ⛔ לא רינדור: אין
    `@testing-library` בין התלויות. **התבנית המחייבת היא `ComposeDraft.test.ts:1-31`** —
    הלבנת הערות (`CODE`) **לפני** כל טענה, ורזולוציית קבועי מחלקות (`CLASS_CONSTS`/`classesOf`)
    כדי שקובץ שמחלץ מחלקות ל-`const` ⛔ לא ייפול לשווא (זה F-041, וזה חזר כ-F-065).
11. 🔴 **הלקח של C-0182, והוא עולה טיק אם שוכחים אותו:** אסרציה של «אין ניקוד» בצורת
    `expect(CODE).not.toContain('xp')` **מפילה קובץ נקי** — `xp` יושב בתוך מילים תמימות.
    ⇒ **כל אסרציית איסור בתוכנית הזאת היא על גבול מזהה** (`/\bxp\b/`), ⛔ ולא `toContain`.
12. **`T-087` (סגירה מעוגנת למעלה) ⛔ עדיין לא מומשה** (`plan/50-tasks.md:142`, סטטוס ⬜).
    ⇒ **התבנית שהיא מפנה אליה אינה קיימת בקוד**, ו-`components/CloseIcon.tsx` נולד כאן.
    ⚠️ T-087 תשתמש בו כשתגיע; ⛔ אל תשכפל SVG שני.
13. **`ActionBar` הוא `fixed` בתחתית** (`components/ActionBar.tsx`), ו-D-028 מתיר **סרגל אחד**
    למסך. `/arcade` הוא מסך זרימה ⇒ מותר לו `ActionBar`, ⛔ ואסור לו `TabBar`.

---

## Interfaces

הבלוק הזה הוא החוזה בין המשימות. חתימה שאינה כאן ⛔ אינה קיימת.

```ts
// ── lib/core/arcadeBattle.ts (חדש · טהור · משימה 1) ──────────────────────────
import type { ArcadeAnswer } from './arcadeResult';
import type { ArcadeQuestion } from './arcadeRound';

/** חיי היריב בקרב יחיד. ⛔ קבוע, ⛔ אינו נגזר מהלומד ו⛔ אינו עולה עם הרמה. */
export const ARCADE_ENEMY_HP = 5;

export interface BattleState {
  readonly questions: readonly ArcadeQuestion[];
  /** אינדקס השאלה המוצגת. שווה ל-`questions.length` ⇒ נגמרו השאלות. */
  readonly index: number;
  /** יורד ב-1 על כל תשובה נכונה, ⛔ ולעולם אינו עולה ואינו יורד על שגיאה. */
  readonly enemyHp: number;
  /** תשובה אחת לכל שאלה שנענתה, בסדר. זהו בדיוק `answers` של ה-POST. */
  readonly answers: readonly ArcadeAnswer[];
  /** האפשרות שהלומד הקיש בשאלה הנוכחית, או `null` כל עוד לא הקיש. */
  readonly chosen: string | null;
}

export function startBattle(questions: readonly ArcadeQuestion[]): BattleState;
/** ⛔ אידמפוטנטית: `chosen !== null` ⇒ מחזירה את **אותו מצב עצמו** (אותה הפניה). */
export function chooseOption(state: BattleState, option: string): BattleState;
/** מעבירה לשאלה הבאה ומנקה את `chosen`. ⛔ אינה עושה דבר אם עוד לא נבחרה אפשרות. */
export function advance(state: BattleState): BattleState;
export function isFinished(state: BattleState): boolean;
export function enemyDefeated(state: BattleState): boolean;

// ── components/CloseIcon.tsx (חדש · משימה 1) ─────────────────────────────────
export default function CloseIcon(): React.JSX.Element;   // ⛔ אפס props

// ── components/ArenaBoard.tsx (חדש · משימה 1) ────────────────────────────────
export interface ArenaRound {
  readonly level: string;
  readonly questions: readonly ArcadeQuestion[];
}
/** `initialRound` — ⛔ אך ורק לפיקסטורה, בדיוק כמו `ComposeDraftProps.initialBank`.
 *  נוכח ⇒ מתחילים בקרב ו⛔ לא פונים לרשת. `/arcade` ⛔ אינו מעביר אותו. */
export interface ArenaBoardProps { readonly initialRound?: ArenaRound }
export default function ArenaBoard(props?: ArenaBoardProps): React.JSX.Element;

// ── components/ArenaAvatar.tsx (חדש · משימה 2) ───────────────────────────────
export interface ArenaAvatarProps {
  /** פריטים שנפתחו. ⛔ שם שאינו ב-`ARCADE_ITEMS` מדולג בשקט. */
  readonly items: readonly string[];
  readonly role: 'hero' | 'enemy';
  readonly className?: string;
}
export default function ArenaAvatar(props: ArenaAvatarProps): React.JSX.Element;

// ── components/ArenaResult.tsx (חדש · משימה 2) ───────────────────────────────
export interface ArenaMissed {
  readonly wordId: string;
  readonly headword: string;
  readonly answer: string;
  readonly chosen: string;
}
export interface ArenaResultProps {
  readonly enemyDefeated: boolean;
  readonly unlocked: string | null;
  readonly items: readonly string[];
  readonly missed: readonly ArenaMissed[];
  /** «עוד קרב» — ⛔ מנקה מצב מקומי ומושך סיבוב חדש. ⛔ אינו ניווט. */
  readonly onAgain: () => void;
}
export default function ArenaResult(props: ArenaResultProps): React.JSX.Element;

// ── components/ArcadeEntry.tsx (חדש · משימה 3) ───────────────────────────────
export default function ArcadeEntry(): React.JSX.Element;  // ⛔ אפס props
```

⚠️ **`ArenaMissed.headword` ⛔ אינו מגיע מהשרת.** `POST /api/arcade/result` מחזיר
`missed: [{wordId, answer, chosen}]` ⛔ בלי המילה האנגלית. המסך **מצליב את `wordId` מול
`questions` שכבר בידו** ⛔ ואינו קורא לשרת פעם נוספת. זו הסיבה שהטיפוס כאן רחב מהחוזה,
וזה מכוון — ⛔ אל «תתקן» את החוזה כדי שיתאים.

---

## 1 · T-095 — מסך הקרב

**Files:**
- Create: `lib/core/arcadeBattle.ts` · `lib/core/arcadeBattle.test.ts`
- Create: `components/CloseIcon.tsx` · `components/CloseIcon.test.ts`
- Create: `components/ArenaBoard.tsx` · `components/ArenaBoard.test.ts`
- Create: `app/arcade/page.tsx`
- Create: `app/dev/arcade/page.tsx` · `app/dev/arcade/layout.tsx`
- Modify: `scripts/verify-mobile.mjs` (רשימת `ROUTES` + `EXPECTED_CONSOLE`)

**Interfaces:**
- Consumes: `ArcadeQuestion` · `ARCADE_ROUND_SIZE` (`lib/core/arcadeRound.ts`) · `ArcadeAnswer`
  (`lib/core/arcadeResult.ts`) · `apiGet`/`apiPost`/`ApiUnreachableError` (`lib/api/client.ts`) ·
  `FAILURE_HE`/`RETRY_HE` (`lib/core/failure.ts`) · `EnWord` · `ActionBar`
- Produces: כל מה שבבלוק `Interfaces` תחת `arcadeBattle.ts` · `CloseIcon` · `ArenaBoard`

- [ ] **Step 1 · הבדיקה שנכשלת — שכבת הקרב הטהורה**

צור `lib/core/arcadeBattle.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  ARCADE_ENEMY_HP,
  advance,
  chooseOption,
  enemyDefeated,
  isFinished,
  startBattle,
} from './arcadeBattle';
import type { ArcadeQuestion } from './arcadeRound';

/** ⛔ אינן מילים אמיתיות ואינן תרגומים: פיקסטורה ⛔ אינה תוכן לימודי (R-010 · R-013). */
function q(n: number): ArcadeQuestion {
  return {
    wordId: `w${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    options: [`אפשרות ${n}`, `מסיח ${n}א`, `מסיח ${n}ב`, `מסיח ${n}ג`],
  };
}
const QUESTIONS: readonly ArcadeQuestion[] = [q(1), q(2), q(3), q(4), q(5), q(6), q(7), q(8)];

describe('arcadeBattle', () => {
  it('פותח קרב עם חיי היריב הקבועים ובשאלה הראשונה', () => {
    const s = startBattle(QUESTIONS);
    expect(s.enemyHp).toBe(ARCADE_ENEMY_HP);
    expect(s.index).toBe(0);
    expect(s.answers).toEqual([]);
    expect(s.chosen).toBeNull();
  });

  it('תשובה נכונה מורידה חיים בדיוק ב-1', () => {
    const s = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    expect(s.enemyHp).toBe(ARCADE_ENEMY_HP - 1);
    expect(s.answers).toEqual([
      { wordId: 'w1', correct: true, chosen: 'אפשרות 1', answer: 'אפשרות 1' },
    ]);
  });

  it('⛔ תשובה שגויה אינה משנה דבר מלבד הרישום — נמדד בית-בבית', () => {
    const before = startBattle(QUESTIONS);
    const after = chooseOption(before, 'מסיח 1א');
    // המסכה מוציאה בדיוק את שני השדות שתשובה שגויה **כן** מזיזה, ומשווה את כל השאר.
    const mask = (s: typeof before) => JSON.stringify({ ...s, answers: [], chosen: null });
    expect(mask(after)).toBe(mask(before));
    expect(after.enemyHp).toBe(ARCADE_ENEMY_HP);
    expect(after.answers).toEqual([
      { wordId: 'w1', correct: false, chosen: 'מסיח 1א', answer: 'אפשרות 1' },
    ]);
  });

  it('⛔ הקשה שנייה על אותה שאלה אינה מכה שנייה', () => {
    const once = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    const twice = chooseOption(once, 'אפשרות 1');
    expect(twice).toBe(once); // אותה הפניה, ⛔ ולא רק שוויון עמוק
  });

  it('⛔ `advance` אינה זזה כל עוד לא נבחרה אפשרות', () => {
    const s = startBattle(QUESTIONS);
    expect(advance(s)).toBe(s);
  });

  it('`advance` מעבירה לשאלה הבאה ומנקה את הבחירה', () => {
    const s = advance(chooseOption(startBattle(QUESTIONS), 'מסיח 1א'));
    expect(s.index).toBe(1);
    expect(s.chosen).toBeNull();
  });

  it('הקרב נגמר כשחיי היריב נגמרו — ⛔ ולא כשנגמר הזמן', () => {
    let s = startBattle(QUESTIONS);
    for (let i = 0; i < ARCADE_ENEMY_HP; i += 1) {
      s = advance(chooseOption(s, `אפשרות ${i + 1}`));
    }
    expect(s.enemyHp).toBe(0);
    expect(isFinished(s)).toBe(true);
    expect(enemyDefeated(s)).toBe(true);
  });

  it('נגמרו השאלות והיריב עומד ⇒ הקרב נגמר ו⛔ היריב לא נוצח', () => {
    let s = startBattle(QUESTIONS);
    for (const question of QUESTIONS) s = advance(chooseOption(s, question.options[1] ?? ''));
    expect(s.index).toBe(QUESTIONS.length);
    expect(isFinished(s)).toBe(true);
    expect(enemyDefeated(s)).toBe(false);
    expect(s.enemyHp).toBe(ARCADE_ENEMY_HP);
  });

  it('⛔ אין בקובץ שעון, ואין בו מילה מעולם הניקוד', () => {
    const code = readFileSync('lib/core/arcadeBattle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    for (const banned of [/\bsetTimeout\b/, /\bsetInterval\b/, /\bdeadline\b/i, /\bcountdown\b/i]) {
      expect(code, `${banned} אסור — D-045 · R-020`).not.toMatch(banned);
    }
    // ⚠️ גבול מזהה ⛔ ולא `toContain` — הלקח של C-0182: `toContain('xp')` מפיל קוד נקי.
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i]) {
      expect(code, `${banned} אסור — D-050`).not.toMatch(banned);
    }
    // D-044 — הזירה ⛔ אינה מזיזה את מנוע החזרות.
    for (const banned of [/word_progress/, /easiness/, /interval_days/, /next_review_at/]) {
      expect(code, `${banned} אסור — D-044`).not.toMatch(banned);
    }
  });
});
```

הוסף בראש הקובץ: `import { readFileSync } from 'node:fs';`

- [ ] **Step 2 · הרץ ותראה שהיא נכשלת**

```bash
npx vitest run lib/core/arcadeBattle.test.ts
```

צפוי: FAIL — `Failed to resolve import "./arcadeBattle"`.

- [ ] **Step 3 · המימוש המינימלי**

צור `lib/core/arcadeBattle.ts`:

```ts
/**
 * § 4.2י — חוקי הקרב עצמו. טהור: ⛔ אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שיודע מה קורה כשלומד מקיש על אפשרות. `<ArenaBoard>` מצייר
 * ו⛔ אינו מחשב — רכיב שמוריד חיים בעצמו הוא עותק שני של החוק, והשני תמיד סוטה.
 *
 * ⛔ **אין כאן זמן.** אין `setTimeout`, אין `deadline` ואין «נגמר הזמן» (D-045 · R-020):
 * סיבוב **ממתין** ללומד. לחץ זמן שמור לרצועת השטף על מילים ידועות בלבד (T-103).
 *
 * ⛔ **אין כאן ניקוד** (D-050 — ניקוד g=0.340 מול בלי ניקוד g=0.840, p=0.013), ו⛔ אין
 * כאן חיים ללומד: תשובה שגויה ⛔ אינה מורידה דבר ⛔ ואינה מסיימת דבר.
 */
import type { ArcadeAnswer } from './arcadeResult';
import type { ArcadeQuestion } from './arcadeRound';

/**
 * ⚠️ **המקור של המספר, ⛔ ולא ניחוש:** `docs/api-contract.md` מקבע 5 בדוגמת הבקשה של
 * `POST /api/arcade/result`, ו-`lib/core/arcadeResult.test.ts` מריץ את כל מקרי הניצחון
 * וההפסד שלו מול `enemyHp: 5`. `ARCADE_ROUND_SIZE` הוא 8 ⇒ לומד עם 5 נכונות מתוך 8 מנצח.
 * ⛔ קבוע, ⛔ אינו נגזר מהלומד ו⛔ אינו עולה עם הרמה — «קושי שגדל» הוא החלטת PM,
 * ⛔ לא ברירת מחדל של Dev (נפתחה בממצא בטיק התכנון).
 */
export const ARCADE_ENEMY_HP = 5;

export interface BattleState {
  readonly questions: readonly ArcadeQuestion[];
  readonly index: number;
  readonly enemyHp: number;
  readonly answers: readonly ArcadeAnswer[];
  readonly chosen: string | null;
}

export function startBattle(questions: readonly ArcadeQuestion[]): BattleState {
  return { questions, index: 0, enemyHp: ARCADE_ENEMY_HP, answers: [], chosen: null };
}

export function chooseOption(state: BattleState, option: string): BattleState {
  // ⛔ אידמפוטנטית, ומחזירה את **אותה הפניה**: הקשה כפולה על מסך מגע היא אירוע אחד,
  // ומצב חדש שווה-ערך היה מרנדר מחדש ומהבהב את החשיפה.
  if (state.chosen !== null) return state;
  const question = state.questions[state.index];
  if (question === undefined) return state;

  const correct = option === question.answer;
  return {
    ...state,
    // ⛔ `Math.max` ולא חיסור חופשי: חיים שליליים הם מצב שאין לו ציור.
    enemyHp: correct ? Math.max(0, state.enemyHp - 1) : state.enemyHp,
    answers: [
      ...state.answers,
      { wordId: question.wordId, correct, chosen: option, answer: question.answer },
    ],
    chosen: option,
  };
}

export function advance(state: BattleState): BattleState {
  if (state.chosen === null) return state;
  return { ...state, index: state.index + 1, chosen: null };
}

export function isFinished(state: BattleState): boolean {
  return state.enemyHp === 0 || state.index >= state.questions.length;
}

export function enemyDefeated(state: BattleState): boolean {
  return state.enemyHp === 0;
}
```

- [ ] **Step 4 · הרץ ותראה ירוק**

```bash
npx vitest run lib/core/arcadeBattle.test.ts && npm run check:core
```

צפוי: 8 בדיקות עוברות · `check:core` מדפיס `OK`.

- [ ] **Step 5 · מוטציה שמאמתת שהבדיקה אינה חלולה**

```bash
# ⓐ הפסד מוריד חיים ⇒ «⛔ תשובה שגויה אינה משנה דבר» חייבת ליפול **בשם**
sed -i 's/: state.enemyHp,$/: Math.max(0, state.enemyHp - 1),/' lib/core/arcadeBattle.ts
npx vitest run lib/core/arcadeBattle.test.ts   # צפוי: FAIL
git checkout lib/core/arcadeBattle.ts
cmp <(git show HEAD:lib/core/arcadeBattle.ts) lib/core/arcadeBattle.ts && echo "שוחזר בית-בבית"
```

⚠️ אם השחזור מ-`git checkout` נכשל (הקובץ עוד לא בקומיט) — שמור עותק ב-`/tmp` לפני המוטציה
והשווה מולו ב-`cmp`. ⛔ «נראה אותו דבר» אינו שחזור.

- [ ] **Step 6 · Commit**

```bash
git add lib/core/arcadeBattle.ts lib/core/arcadeBattle.test.ts
git commit -m "loop(DEV): arcadeBattle — the pure battle rules (T-095)"
```

- [ ] **Step 7 · `CloseIcon` — הבדיקה שנכשלת**

צור `components/CloseIcon.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/CloseIcon.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<CloseIcon>', () => {
  it('הוא SVG מוטבע ⛔ ולא אמוג\'י ולא תמונה (חוקה § 6)', () => {
    expect(CODE).toMatch(/<svg/);
    expect(CODE).not.toMatch(/<img|url\(|https?:/);
    expect(CODE, 'אמוג\'י אסור כאייקון').not.toMatch(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2716}]/u,
    );
  });

  it('יורש את צבע הטקסט שלידו ⛔ ואינו מכיר hex', () => {
    expect(CODE).toMatch(/currentColor/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אינו רכיב לקוח ו⛔ אינו נושא שם נגיש משלו', () => {
    // השם חי על הכפתור שעוטף אותו — אייקון שמכריז על עצמו מכפיל את ההכרזה.
    expect(SRC.startsWith("'use client'")).toBe(false);
    expect(CODE).toMatch(/aria-hidden/);
  });
});
```

- [ ] **Step 8 · הרץ ותראה שהיא נכשלת** — `npx vitest run components/CloseIcon.test.ts` ⇒ ENOENT.

- [ ] **Step 9 · `components/CloseIcon.tsx`**

```tsx
/**
 * סימן הסגירה — אח של `components/LockIcon.tsx`, ומאותה סיבה בדיוק.
 *
 * ⛔ SVG מוטבע ולעולם לא תו ולא אמוג'י (חוקה § 6): משקלו וגובהו של גליף מגיעים מהגופן
 * שפותר אותו, ⛔ לא מהקוד — ו«✕» נראה אחרת בשלושת הגופנים של החוקה.
 * `currentColor` בלי `fill` ⇒ יורש את הטקסט שלידו בשני המצבים, ⛔ אפס hex.
 *
 * ⛔ בלי `aria-label`: השם הנגיש חי על הכפתור העוטף («סגור»), ואייקון שמכריז על עצמו
 * גורם לקורא מסך להקריא את אותו דבר פעמיים.
 *
 * ⚠️ T-087 («למסך מנת היום יש יציאה») תשתמש **בקובץ הזה** ⛔ ולא ב-SVG שני.
 */
export default function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
```

- [ ] **Step 10 · ירוק + קומיט**

```bash
npx vitest run components/CloseIcon.test.ts
git add components/CloseIcon.tsx components/CloseIcon.test.ts
git commit -m "loop(DEV): CloseIcon — the exit mark, one file for T-095 and T-087"
```

- [ ] **Step 11 · `ArenaBoard` — הבדיקה שנכשלת**

צור `components/ArenaBoard.test.ts`. ⚠️ **פתח בהלבנה וברזולוציית קבועי המחלקות** — זו
התבנית של `ComposeDraft.test.ts:1-31`, וזה מה שמונע את F-041/F-065 משני הכיוונים:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ArenaBoard.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

const CLASS_CONSTS = Object.fromEntries(
  [...CODE.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*([\s\S]*?);\n/g)].map((m) => [
    m[1] ?? '',
    m[2] ?? '',
  ]),
);
function classesOf(tag: string): string {
  const attribute = tag.match(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/);
  if (attribute === null) return '';
  const literal = attribute[1] ?? '';
  const expression = attribute[2] ?? '';
  const referenced = [...expression.matchAll(/[A-Z][A-Z0-9_]*/g)]
    .map((m) => CLASS_CONSTS[m[0]] ?? '')
    .join(' ');
  return `${literal} ${expression} ${referenced}`;
}

describe('<ArenaBoard>', () => {
  it('הוא רכיב לקוח', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
  });

  it('⛔ אפס שעון — סריקת המקור של מדד ⓔ (§ 4.2י · D-045 · R-020)', () => {
    for (const banned of [
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\brequestAnimationFrame\b/,
      /\bdeadline\b/i,
      /\bcountdown\b/i,
      /\bDate\.now\b/,
    ]) {
      expect(CODE, `${banned} אסור: סיבוב ⛔ אינו נגמר בזמן`).not.toMatch(banned);
    }
  });

  it('⛔ אפס ניקוד ואפס נגיעה במנוע החזרות (D-050 · D-044)', () => {
    // ⚠️ גבול מזהה ⛔ ולא `toContain` — הלקח של C-0182.
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i, /\bleaderboard\b/i]) {
      expect(CODE, `${banned} אסור — D-050`).not.toMatch(banned);
    }
    for (const banned of [/word_progress/, /easiness/, /repetition/, /self_marked_known/]) {
      expect(CODE, `${banned} אסור — D-044`).not.toMatch(banned);
    }
    for (const word of ['ניקוד', 'מטבע', 'לוח תוצאות']) {
      expect(CODE, `«${word}» אסורה — D-050`).not.toContain(word);
    }
  });

  it('החוקים מיובאים מהשכבה הטהורה ⛔ ואינם משוכפלים כאן', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/arcadeBattle'/);
    expect(CODE).toMatch(/chooseOption\(/);
    // רכיב שמוריד חיים בעצמו הוא עותק שני של החוק:
    expect(CODE).not.toMatch(/enemyHp\s*[-+]|enemyHp\s*=\s*[^=]/);
  });

  it('ארבע האפשרויות מפוזרות שתיים ושתיים ⛔ ולא ברשימה (§ 4.2י)', () => {
    const list = CODE.match(/<ul[^>]*data-arena-options[\s\S]*?>/);
    expect(list, 'המכולה חייבת לשאת data-arena-options').not.toBeNull();
    const classes = classesOf(list?.[0] ?? '');
    expect(classes, 'רשת 2×2').toMatch(/grid-cols-2/);
    expect(classes, '⛔ לא עמודה אחת').not.toMatch(/flex-col/);
  });

  it('כל אפשרות היא יעד מגע של 44px', () => {
    const option = CODE.match(/<button[^>]*data-arena-option[\s\S]*?>/);
    expect(option).not.toBeNull();
    expect(classesOf(option?.[0] ?? '')).toMatch(/min-h-touch/);
  });

  it('פעולת הסגירה מעוגנת למעלה, נושאת שם עברי, ומובילה ל-`/cards`', () => {
    expect(CODE).toMatch(/<CloseIcon\s*\/>/);
    expect(CODE).toMatch(/href="\/cards"/);
    expect(CODE).toContain('סגור');
    const close = CODE.match(/<Link[^>]*data-arena-close[\s\S]*?>/);
    expect(close).not.toBeNull();
    expect(classesOf(close?.[0] ?? '')).toMatch(/min-h-touch/);
    expect(classesOf(close?.[0] ?? '')).toMatch(/min-w-touch/);
  });

  it('⛔ אין סרגל תחתון ראשי במסך זרימה (D-028)', () => {
    expect(CODE).not.toMatch(/TabBar/);
  });

  it('⛔ אפס מרכוז אנכי ואפס h-screen (חוקה § 4 · F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/justify-center/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
  });

  it('⛔ אפס hex גולמי — הכל דרך אסימונים (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('המילה האנגלית עוברת דרך `EnWord` ⛔ ולא כטקסט חשוף (חוקה § 2)', () => {
    expect(CODE).toMatch(/<EnWord[^>]*>\{[^}]*headword[^}]*\}/);
  });

  it('מד חיי היריב נושא תווית עברית ⛔ ואינו צבע בלבד (חוקה § 1)', () => {
    expect(CODE).toContain('חיי היריב');
    expect(CODE).toMatch(/aria-label=/);
    expect(CODE, '⛔ לא גרף — § 4.2י שאלה 5').not.toMatch(/<canvas|recharts|chart/i);
  });

  it('מדבר עם שתי נקודות הקצה של הזירה ⛔ ובלבד', () => {
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/arcade\/round'\)/);
    expect(CODE).toMatch(/apiPost<[^>]*>\('\/api\/arcade\/result'/);
    expect(CODE, '⛔ רכיב ממשק אינו ניגש לדאטהבייס').not.toMatch(/supabase|\.from\(/);
  });

  it('שולח את חיי היריב מהקבוע ⛔ ולא כמספר בקוד', () => {
    expect(CODE).toMatch(/enemyHp:\s*ARCADE_ENEMY_HP/);
  });

  it('שש התשובות של החוזה מטופלות, ⛔ ולא ארבע', () => {
    for (const code of ['session_expired', 'schema_missing', 'level_too_small']) {
      expect(CODE, `${code} חייב מסך משלו`).toContain(code);
    }
    expect(CODE, 'רמה ריקה ⇒ הפניה לבחירת רמה').toMatch(/level === null|level: null/);
  });

  it('כשל שליחה ⛔ אינו זורק את התוצאה — היא נשמרת ונשלחת שוב', () => {
    expect(CODE).toMatch(/ApiUnreachableError|catch/);
    expect(CODE).toContain('pendingResult');
    expect(CODE).toMatch(/addEventListener\('online'/);
  });

  it('נוסח הכשל מיובא ⛔ ואינו נוסח שישי לאותו אירוע (T-056)', () => {
    expect(CODE).toMatch(/FAILURE_HE/);
    expect(CODE).toMatch(/RETRY_HE/);
  });

  it('⛔ אין שבח ואין נזיפה — משוב כשירות, ⛔ לא שיפוט (R-016 · § 4.2י שאלה 3)', () => {
    for (const word of ['כל הכבוד', 'נהדר', 'מצוין', 'טעית', 'נכשלת', 'הפסדת']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('הפיקסטורה מקבלת סיבוב ו⛔ אינה פונה לרשת', () => {
    expect(CODE).toMatch(/initialRound/);
    expect(CODE).toMatch(/if \(initialRound !== undefined\) return;/);
  });
});
```

- [ ] **Step 12 · הרץ ותראה שהיא נכשלת** — `npx vitest run components/ArenaBoard.test.ts` ⇒ ENOENT.

- [ ] **Step 13 · `components/ArenaBoard.tsx`**

הכתוב כאן הוא המפרט המחייב; ⛔ אל תוסיף פיצ'ר שאינו בו.

- **מכונת המצבים:** `loading` · `ready` (קרב) · `finished` (מוסר ל-`<ArenaResult>` במשימה 2 —
  עד אז מציג את הכותרת «הקרב נגמר» וכפתור «חזרה לכרטיסיות») · `no_level` · `too_small` ·
  `session_expired` · `schema_missing` · `error`.
- **הפריסה, מלמעלה למטה:** שורת סגירה מעוגנת (`data-arena-close`, `<Link href="/cards">` עם
  `<CloseIcon/>` + `<span className="sr-only">סגור</span>`) · מד חיי היריב (`role="img"`,
  `aria-label={`חיי היריב: ${state.enemyHp} מתוך ${ARCADE_ENEMY_HP}`}`, ולצידו טקסט
  «חיי היריב» + המספר — ⛔ צבע לעולם לא לבד) · המילה: `<EnWord className="text-5xl font-bold">` ·
  רשת האפשרויות `<ul data-arena-options className="grid grid-cols-2 gap-3 …">`.
- **הקשה:** `onClick={() => setState(chooseOption(state, option))}`. ⛔ אין חישוב בקומפוננטה.
- **אחרי הקשה:** האפשרות הנכונה מקבלת `text-success` **וגם** `<span className="sr-only">התשובה הנכונה</span>`
  ותווית נראית «התשובה הנכונה»; האפשרות שנבחרה בטעות מקבלת `aria-disabled="true"` ותווית
  «מה שבחרת». ⛔ אין «טעית». ⛔ אין מעבר אוטומטי — כפתור «הבא» (`data-arena-next`) בתוך
  `<ActionBar>` קורא ל-`advance`. **זו הסיבה שאין `setTimeout` בקובץ.**
- **סיום:** `isFinished` ⇒ שולח `POST /api/arcade/result` עם
  `{ enemyHp: ARCADE_ENEMY_HP, answers: state.answers }`, ושומר את התשובה.
- **אופליין:** `apiPost` שנכשל ⇒ התוצאה נשמרת ב-`pendingResult` (state), מוצג `FAILURE_HE.offline`
  עם `RETRY_HE`, ונרשם `window.addEventListener('online', …)` ששולח שוב. ⛔ התוצאה אינה נזרקת.
  ⚠️ **מגבלה מוצהרת:** רענון דף מאבד את `pendingResult`. שמירה מתמידה היא החלטת מוצר
  (איפה, לכמה זמן, ומה קורה לשני קרבות ממתינים) ⛔ ואינה בתחולה — **רשום אותה כחוב טכני
  ב-`plan/30-architecture.md` באותו קומיט.**
- **המכולה:** `<section className="flex min-h-[100dvh] flex-col gap-6 pb-28">` — ⛔ אפס
  `justify-center`, ⛔ אפס `h-screen`, ו-`pb-28` משלם על הרצועה ש-`<ActionBar>` מכסה.
- **מוטיון:** `transition-opacity duration-200` על החשיפה בלבד. ⛔ אל תוסיף שאילתת
  `prefers-reduced-motion` — `app/globals.css:92` כבר מנטרל גלובלית.

- [ ] **Step 14 · הרץ ותראה ירוק** — `npx vitest run components/ArenaBoard.test.ts && npm run typecheck`

- [ ] **Step 15 · הנתיב והפיקסטורה**

`app/arcade/page.tsx`:

```tsx
import ArenaBoard from '@/components/ArenaBoard';

/**
 * `/arcade` — הקרב. T-095 · § 4.2י.
 *
 * ⛔ **הקובץ יושב מחוץ ל-`app/(tabs)/`, וזה מבנה ⛔ ולא סגנון.** § 4.2י קורא לזה מסך זרימה
 * מלא-מסך, D-028 מתיר סרגל אחד למסך, וסרגל מסך הזרימה הוא ה-`<ActionBar>`. קובץ **מחוץ**
 * לקבוצה הופך את «בלי סרגל תחתון» לבלתי-שביר — סרגל הלשוניות חי ב-layout של הקבוצה,
 * והקובץ הזה אינו בה. אותו נימוק בדיוק של `app/world/compose/page.tsx`.
 *
 * Server Component ⛔ בלי גישה לנתונים: `<ArenaBoard>` קורא `GET /api/arcade/round`, שכבר
 * מבצע את סדר השמירה של C-0032 ומחזיר `session_expired` **כנתון**. `getUser()` שני כאן
 * היה בדיקת סשן שנייה שיכולה לחלוק על הראשונה, והשפעתה הנראית היחידה — הפניה שמתחרה
 * ב-fetch. ⛔ ומאותה סיבה `/arcade` ⛔ אינו נכנס ל-`PROTECTED_SCREENS`.
 */
export default function ArcadePage() {
  return <ArenaBoard />;
}
```

`app/dev/arcade/layout.tsx` — העתק מדויק של `app/dev/world/layout.tsx` עם שם הפונקציה
`DevArcadeLayout` (‏`metadata` עם `robots: { index: false, follow: false }`).

`app/dev/arcade/page.tsx` — מרנדר `<ArenaBoard initialRound={…} />` ו⛔ שום דבר אחר (אין
כותרת, אין שורת הערה — C-0104: שורת קישוט דוחפת את המסך למטה והמדידה נעשית על הפיקסטורה).
⛔ **המחרוזות אינן תוכן לימודי** — `Lorem1…Lorem8` ו«אפשרות 1»/«מסיח 1א», בדיוק כפי
ש-`app/dev/world/page.tsx` בוחר מחרוזות לפי **אורך** ולא לפי משמעות (R-010 · R-013).
שמונה שאלות מלאות, ⛔ ולא שתיים: רשת 2×2 שאינה מלאה אינה יכולה להיכשל בבדיקת עטיפה.

- [ ] **Step 16 · `scripts/verify-mobile.mjs`**

הוסף ל-`ROUTES` (אחרי `'/dev/world'`), עם הערה שמנמקת כמו ההערות שסביבה:

```js
  // T-095 · § 4.2י. `/arcade` יושב מחוץ ל-`PROTECTED_SCREENS` ולכן הוא **כן** מרונדר כאן,
  // אבל בלי env של Supabase `GET /api/arcade/round` עונה 503 בחוזה שלו עצמו ⇒ מה שהשורה
  // הזאת מודדת הוא מצב **הכשל**: המשפט העברי והדרך החוצה. מצב שלומד יכול לפגוש בו.
  '/arcade',
  // ...והפיקסטורה, כי אותו 503 אומר שהמילה, ארבע האפשרויות ומד חיי היריב לעולם אינם על
  // המסך בשורה שמעל. היא מקבלת את הסיבוב כ-prop ואינה מבקשת מהשרת דבר — ולכן ⛔ אין לה
  // רשומה ב-EXPECTED_CONSOLE, והשקט הזה הוא מה שמוכיח שהמדידה אינה על מסך הכשל.
  '/dev/arcade',
```

והוסף ל-`EXPECTED_CONSOLE`:

```js
  '/arcade': [/status of 503[\s\S]*@\S*\/api\/arcade\/round/],
```

- [ ] **Step 17 · האימות המלא — ⛔ ובלעדיו אין טענת הצלחה**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
npm run build && npx next start -p 3000 & sleep 8 && npm run check:mobile ; kill %1
```

צפוי: `typecheck` exit 0 · `check:core` `OK` · כל הבדיקות עוברות · `build` exit 0 ובפלט
מופיע `/arcade` · `check:mobile` מדפיס `ok /arcade` ו-`ok /dev/arcade` ב-320/375/414
בלי גלילה אופקית ובלי יעד מתחת ל-44px.

- [ ] **Step 18 · Commit**

```bash
git add components/ArenaBoard.tsx components/ArenaBoard.test.ts app/arcade app/dev/arcade scripts/verify-mobile.mjs
git commit -m "loop(DEV): C-XXXX T-095 — the arena battle screen"
```

---

## 2 · T-096 — הדמות ומסך הסיום

**Files:**
- Create: `components/ArenaAvatar.tsx` · `components/ArenaAvatar.test.ts`
- Create: `components/ArenaResult.tsx` · `components/ArenaResult.test.ts`
- Create: `app/dev/arcade/result/page.tsx`
- Modify: `components/ArenaBoard.tsx` (מצב `finished` מרנדר `<ArenaResult>`)
- Modify: `scripts/verify-mobile.mjs` (`'/dev/arcade/result'` ל-`ROUTES`)

**Interfaces:**
- Consumes: `ARCADE_ITEMS` (`lib/core/arcadeResult.ts`) · `EnWord` · `ActionBar` · `BattleState`
- Produces: `ArenaAvatar` · `ArenaResult` · `ArenaMissed` (ראה בלוק `Interfaces`)

- [ ] **Step 1 · `ArenaAvatar` — הבדיקה שנכשלת**

צור `components/ArenaAvatar.test.ts` (אותה הלבנה כמו למעלה, ואז):

```ts
describe('<ArenaAvatar>', () => {
  it('⛔ אפס תמונה, אפס CDN, אפס אמוג\'י — שכבות SVG מקומיות בלבד (§ 4.2י · תקציב אפס)', () => {
    expect(CODE).toMatch(/<svg/);
    expect(CODE).not.toMatch(/<img|<Image|url\(|https?:|\.png|\.svg'|\.webp/);
    expect(CODE).not.toMatch(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    );
  });

  it('⛔ אפס hex גולמי — כל שכבה נושאת אסימון (חוקה § 6 · palette.ts)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).toMatch(/currentColor|text-(ink|brand|success|danger|ink-muted)/);
  });

  it('הפריטים מגיעים מ-`ARCADE_ITEMS` ⛔ ואינם רשימה שנייה', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/arcadeResult'/);
    expect(CODE).toMatch(/ARCADE_ITEMS/);
    // ⛔ שם שאינו ברשימה ⇒ מדולג בשקט, ⛔ ולא מרנדר שכבה ריקה:
    expect(CODE).toMatch(/ARCADE_ITEMS\.(includes|filter|indexOf)/);
  });

  it('⛔ אין שדה טקסט חופשי לשם הדמות (החזון: אפס טקסט חופשי)', () => {
    expect(CODE).not.toMatch(/<input|<textarea|contentEditable/);
  });

  it('⛔ אינו רכיב לקוח: שכבות בלי מצב ובלי handler', () => {
    expect(SRC.startsWith("'use client'")).toBe(false);
    expect(CODE).not.toMatch(/useState|useEffect|onClick/);
  });

  it('נושא שם נגיש עברי ⛔ ואינו דקורציה שקופה לקורא מסך', () => {
    expect(CODE).toMatch(/role="img"/);
    expect(CODE).toMatch(/aria-label=/);
  });
});
```

- [ ] **Step 2 · הרץ ותראה שהיא נכשלת.**

- [ ] **Step 3 · `components/ArenaAvatar.tsx`**

ארבע שכבות בתוך `<svg viewBox="0 0 64 96">` אחד, בסדר: `background` · `body` · `head` ·
פריטים. כל שכבה היא `<g className="text-…">` ו-`fill="currentColor"` / `stroke="currentColor"`.
מפת הפריטים היא `Record<(typeof ARCADE_ITEMS)[number], React.JSX.Element>` — הטיפוס הוא מה
שמוודא שחמישה פריטים בדיוק מצוירים, ופריט שישי ⛔ אינו עובר `typecheck`. הסינון:
`items.filter((i): i is (typeof ARCADE_ITEMS)[number] => (ARCADE_ITEMS as readonly string[]).includes(i))`.
`role`: `'hero'` צובע `text-brand`, `'enemy'` צובע `text-ink-muted` — **וגם** `aria-label`
עברי («הדמות שלך» / «היריב»), כי צבע ⛔ לעולם אינו הערוץ היחיד.

- [ ] **Step 4 · ירוק + קומיט**

```bash
npx vitest run components/ArenaAvatar.test.ts && npm run typecheck
git add components/ArenaAvatar.tsx components/ArenaAvatar.test.ts
git commit -m "loop(DEV): ArenaAvatar — layered local SVG, zero generated asset (T-096)"
```

- [ ] **Step 5 · `ArenaResult` — הבדיקה שנכשלת**

צור `components/ArenaResult.test.ts` (אותה הלבנה, ואז):

```ts
describe('<ArenaResult>', () => {
  it('⛔ תצוגה בלבד: אפס כתיבה, אפס נגיעה במנוע החזרות (D-047 · D-044)', () => {
    expect(CODE, '⛔ מסך הסיום אינו כותב').not.toMatch(/apiPost|fetch\(/);
    for (const banned of [/word_progress/, /easiness/, /repetition/, /next_review_at/]) {
      expect(CODE).not.toMatch(banned);
    }
    // ⛔ הכפתור «הוסף לרשימת החזרה» אינו בתחולה — הוא ממתין לרוי (03-for-roy פריט 31):
    expect(CODE).not.toContain('הוסף לרשימת החזרה');
  });

  it('⛔ אפס ניקוד, מטבע, XP ולוח תוצאות (D-050)', () => {
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i, /\bleaderboard\b/i]) {
      expect(CODE, `${banned} אסור`).not.toMatch(banned);
    }
    for (const word of ['ניקוד', 'מטבע', 'לוח תוצאות', 'רצף יומי']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('«המילים שהפילו אותך» — עד 5, עם התרגום ועם המסיח שפיתה (D-047)', () => {
    expect(CODE).toContain('המילים שהפילו אותך');
    expect(CODE).toMatch(/ARCADE_MISSED_LIMIT|missed\.slice\(0,\s*5\)/);
    expect(CODE).toMatch(/\.answer\b/);
    expect(CODE).toMatch(/\.chosen\b/);
    expect(CODE).toMatch(/<EnWord[^>]*>\{[^}]*headword/);
  });

  it('הפריט שנפתח מוצג בדמות ⛔ ולא כמספר מופשט (§ 4.2י שאלה 2)', () => {
    expect(CODE).toMatch(/<ArenaAvatar/);
    expect(CODE).toMatch(/unlocked/);
  });

  it('שתי דרכים החוצה, שתיהן יעד מגע', () => {
    expect(CODE).toContain('עוד קרב');
    expect(CODE).toMatch(/href="\/cards"/);
    expect(CODE).toMatch(/onAgain/);
  });

  it('⛔ אין שבח ואין נזיפה, וכישלון לנצח ⛔ אינו «הפסדת» (R-016 · § 4.2י)', () => {
    for (const word of ['כל הכבוד', 'נהדר', 'מצוין', 'טעית', 'נכשלת', 'הפסדת']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('⛔ אפס hex, אפס מרכוז אנכי, אפס h-screen', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/justify-center/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
  });
});
```

- [ ] **Step 6 · הרץ ותראה שהיא נכשלת.**

- [ ] **Step 7 · `components/ArenaResult.tsx`**

- כותרת: `enemyDefeated ? 'היריב נוצח' : 'הקרב נגמר'` — **שתיהן עובדות**, ⛔ אף אחת אינה שיפוט.
- ניצחון עם `unlocked !== null` ⇒ `<ArenaAvatar role="hero" items={items} />` + השורה
  «נפתח לך פריט חדש» + שם הפריט בעברית ממפה מקומית `ITEM_LABELS_HE` (חמישה מפתחות,
  מוקלדת מול `ARCADE_ITEMS` כך שפריט שישי ⛔ אינו מהדר).
- «המילים שהפילו אותך»: `<ul>` של עד `ARCADE_MISSED_LIMIT` שורות; כל שורה —
  `<EnWord>{headword}</EnWord>` · «התשובה: {answer}» · «בחרת: {chosen}». ⛔ בלי צבע כערוץ יחיד:
  כל צד נושא תווית עברית. `missed.length === 0` ⇒ השורה «לא פספסת אף מילה» ⛔ ולא בלוק ריק.
- `<ActionBar>` עם «עוד קרב» (‏`onAgain`, ‏`data-primary-action="true"`) ו-`<Link href="/cards">`
  «חזרה לכרטיסיות».

- [ ] **Step 8 · חבר ל-`ArenaBoard`** — מצב `finished` מרנדר `<ArenaResult …/>` עם `missed`
שמוצלב מול `state.questions` לפי `wordId` כדי לצרף `headword`. ⛔ אין קריאה שנייה לשרת.

- [ ] **Step 9 · פיקסטורה** — `app/dev/arcade/result/page.tsx` מרנדר `<ArenaResult>` ישירות
עם `enemyDefeated: true` · `unlocked: 'helmet'` · חמש שורות `missed` (⛔ מחרוזות שאינן תוכן
לימודי) · `onAgain: () => {}`. הוסף `'/dev/arcade/result'` ל-`ROUTES` ב-`verify-mobile.mjs`
עם הערה: מסך הסיום ⛔ אינו נגיש דרך `/arcade` בלי סשן, ולכן מעולם לא נמדד.
⚠️ הקובץ יהיה `'use client'` (יש בו `onAgain`) — ⛔ ולכן `metadata` נשאר ב-`app/dev/arcade/layout.tsx`.

- [ ] **Step 10 · מוטציה שמאמתת**

```bash
cp components/ArenaResult.tsx /tmp/ArenaResult.bak
# ⓑ הוסף כתיבה למסך תצוגה ⇒ «⛔ תצוגה בלבד» חייבת ליפול בשם
printf '\n// void apiPost("/api/arcade/result", {});\n' >> components/ArenaResult.tsx
sed -i 's|// void apiPost|void apiPost|' components/ArenaResult.tsx
npx vitest run components/ArenaResult.test.ts   # צפוי: FAIL
cp /tmp/ArenaResult.bak components/ArenaResult.tsx
cmp /tmp/ArenaResult.bak components/ArenaResult.tsx && echo "שוחזר בית-בבית"
```

- [ ] **Step 11 · אימות מלא + Commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add components/ArenaResult.tsx components/ArenaResult.test.ts components/ArenaBoard.tsx app/dev/arcade scripts/verify-mobile.mjs
git commit -m "loop(DEV): C-XXXX T-096 — the avatar and the end screen"
```

---

## 3 · T-097 — הכניסה לזירה מ-`/cards`

**Files:**
- Create: `components/ArcadeEntry.tsx` · `components/ArcadeEntry.test.ts`
- Modify: `components/LevelMapScreen.tsx` (בלוק «דרכים לתרגל», אחרי `<DeckSelector />`)
- Modify: `scripts/verify-mobile.mjs` (`EXPECTED_CONSOLE['/dev/tabs/cards']` — בקשה שביעית)
- Modify: `plan/50-tasks.md` (סגירת T-088 כ«הוחלפה»)

**Interfaces:**
- Consumes: `apiGet` · `ARCADE_MIN_WORDS` (`lib/core/arcadeRound.ts`)
- Produces: `ArcadeEntry`

- [ ] **Step 1 · הבדיקה שנכשלת**

צור `components/ArcadeEntry.test.ts` (אותה הלבנה ורזולוציית מחלקות, ואז):

```ts
describe('<ArcadeEntry>', () => {
  it('הוא רכיב לקוח וקורא לסיבוב ⛔ ולא לנקודת קצה שאינה קיימת', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/arcade\/round'\)/);
  });

  it('רמה קטנה מדי ⇒ **מושבת עם שני המספרים מהשרת** ⛔ ולא מוסתר (D-046)', () => {
    expect(CODE).toContain('נדרשות');
    // ⚠️ שני המספרים מגיעים מהתשובה ⛔ ואינם נכתבים בקוד — זה בדיוק מה ש-`eligible`
    // ו-`required` קיימים בשבילו (docs/api-contract.md).
    expect(CODE).toMatch(/\brequired\b/);
    expect(CODE).toMatch(/\beligible\b/);
    expect(CODE, '⛔ 12 אינו מספר בקוד').not.toMatch(/['"`][^'"`]*\b12\b/);
  });

  it('מושבת = כפתור בלי handler עם aria-disabled ⛔ ולא התכונה disabled (תבנית DeckSelector)', () => {
    expect(CODE).toMatch(/aria-disabled="true"/);
    expect(CODE).not.toMatch(/\bdisabled=\{/);
  });

  it('⛔ «—» ואינו «0»: קריאה שנכשלה ורמה ריקה ⛔ אינן אותו דבר', () => {
    expect(CODE).toContain('—');
  });

  it('רמה ריקה ⇒ שולח לבחירת רמה ⛔ ולא לזירה', () => {
    expect(CODE).toMatch(/level === null/);
    expect(CODE).toContain('בחר רמה');
  });

  it('יש קרב ⇒ קישור פעיל ל-`/arcade`, יעד מגע 44px', () => {
    expect(CODE).toMatch(/href="\/arcade"/);
    const link = CODE.match(/<Link[^>]*data-arcade-entry[\s\S]*?>/);
    expect(link).not.toBeNull();
    expect(classesOf(link?.[0] ?? '')).toMatch(/min-h-touch/);
  });

  it('התווית היא «משחק» — הדרך השנייה בשורה 4 של § 4.2ז', () => {
    expect(CODE).toContain('משחק');
  });

  it('⛔ אפס hex, אפס ניקוד', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i]) {
      expect(CODE).not.toMatch(banned);
    }
  });
});

describe('<LevelMapScreen> — שורה 4', () => {
  const MAP = readFileSync('components/LevelMapScreen.tsx', 'utf8');
  it('בלוק «דרכים לתרגל» מחזיק **שתי** דרכים בדיוק', () => {
    expect(MAP).toMatch(/<DeckSelector\s*\/>/);
    expect(MAP).toMatch(/<ArcadeEntry\s*\/>/);
  });
});
```

- [ ] **Step 2 · הרץ ותראה שהיא נכשלת.**

- [ ] **Step 3 · `components/ArcadeEntry.tsx`** — מיפוי מלא של שש התשובות:

| התשובה | המצב על המסך |
|---|---|
| `ok:true, level:null` | מושבת · «בחר רמה כדי לשחק» |
| `ok:true, round:null, reason:'level_too_small'` | מושבת · ``נדרשות ${required} מילים ברמה, יש ${eligible}`` |
| `ok:true, round:{…}` | פעיל · `<Link href="/arcade" data-arcade-entry>` |
| `401 session_expired` | מושבת · «—» |
| `503 schema_missing` | מושבת · «—» |
| `503 unavailable` / זריקה | מושבת · «—» |

⛔ **אין מסך שגיאה ואין «נסה שוב» כאן** — זו שורה בתוך מסך, ⛔ לא מסך, ו-`<DeckSelector>`
כבר קבע את הכלל: קריאה שנכשלה משאירה את השורה מושבתת קוראת «—» (`DeckSelector.tsx:46-51`).

- [ ] **Step 4 · `components/LevelMapScreen.tsx`** — הוסף `<ArcadeEntry />` מיד אחרי
`<DeckSelector />` בתוך `<section>` של `PRACTICE_HE`.

⚠️ **סטייה מוצהרת ⛔ ולא שכחה:** § 4.2ז שורה 4 מדברת על שתי דרכים — «כרטיסיות» ו«משחק» —
ובקוד הקיים שלוש כרטיסיות החפיסה יושבות ישירות תחת «דרכים לתרגל» **בלי כותרת-משנה
«כרטיסיות»**. הוספת הכותרת היא שינוי מבנה ב-`<DeckSelector>`, ו-**T-080/T-081 יושבות בתור
הסקירה של ה-Critic ברגע זה** — פתיחתן היא סבב סקירה שלישי על אותו קוד. ⇒ תוספת בלבד.
**רשום את הסטייה ב-`plan/30-architecture.md` באותו קומיט** ⛔ ואל תשתוק עליה.

- [ ] **Step 5 · `verify-mobile.mjs`** — הוסף ל-`EXPECTED_CONSOLE['/dev/tabs/cards']`:

```js
    // T-097: `<LevelMapScreen>` מחזיק עכשיו גם את `<ArcadeEntry>`, שמבקש סיבוב בעלייה.
    // בלי env של Supabase הנתיב עונה 503 בחוזה שלו עצמו, וזו בדיוק השורה המושבתת
    // שהמדידה עוברת עליה. מקושר לכתובת אחת ולסטטוס אחד, כמו כל רשומה כאן.
    /status of 503[\s\S]*@\S*\/api\/arcade\/round/,
```

- [ ] **Step 6 · סגור את T-088** ב-`plan/50-tasks.md`: סטטוס `⛔`, והנימוק — «הוחלפה
בזירה (T-095…T-097). § 4.2י היא הגרסה המלאה שלה; ⛔ אין לבנות את שתיהן».

- [ ] **Step 7 · אימות מלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
npm run build && npx next start -p 3000 & sleep 8 && npm run check:mobile ; kill %1
npm run measure:plan
```

⚠️ **`measure:plan` הוא הצעד האחרון לפני הקומיט** — הלקח של C-0172 (הצהרה על 1385 מול 1383
בפועל, כי העריכה באה אחרי ההצהרה) ו-T-101.

- [ ] **Step 8 · Commit**

```bash
git add components/ArcadeEntry.tsx components/ArcadeEntry.test.ts components/LevelMapScreen.tsx scripts/verify-mobile.mjs plan/
git commit -m "loop(DEV): C-XXXX T-097 — the arena entry on the level map"
```

---

## 4 · בדיקה עצמית — ⛔ לפני שטוענים שהתוכנית הושלמה

⚠️ הרץ את הפקודות. ⛔ «נראה בסדר» אינו תשובה.

- [ ] **ⓐ שבעת מדדי ההצלחה של § 4.2י — איפה כל אחד חי:**

| המדד | הבדיקה שמכסה אותו |
|---|---|
| ⓐ `word_progress` זהה בית-בבית | ✅ כבר קיים ב-`lib/core/arcadeResult.test.ts` (C-0182). **⛔ אל תכתוב אותו שוב** |
| ⓑ מילה בלי מסיחים אינה מוחזרת | ✅ כבר קיים ב-`lib/core/arcadeRound.test.ts` (C-0180) |
| ⓒ 4 אפשרויות מרמת הלומד, בלי כפילות | ✅ כבר קיים ב-`arcadeRound.test.ts` |
| ⓓ `check:mobile` ב-375 | משימה 1 צעד 17 · משימה 2 צעד 11 — **על הפיקסטורות**, ⛔ לא על מסך הכשל |
| ⓔ ⛔ אפס `setTimeout` שמסיים סיבוב | משימה 1 צעד 1 (השכבה) + צעד 11 (הרכיב) |

- [ ] **ⓑ סריקת גבול ה-D-044 על כל קבצי הזירה החדשים**, בסקריפט שמלבין הערות ומחריג
      `*.test.ts` — **בדיוק הסקריפט ש-C-0182 כתב כדי לסגור את F-065.** ⛔ אל תריץ `grep` גולמי:
      הוא פוגע בהערה **שמתעדת** את האיסור ובשורת האסרציה **שאוכפת** אותו, וזה false-reject.
      צפוי: פלט ריק על `arcadeBattle.ts` · `ArenaBoard.tsx` · `ArenaAvatar.tsx` ·
      `ArenaResult.tsx` · `ArcadeEntry.tsx`.

- [ ] **ⓒ ⛔ אף אסרציית איסור אינה `toContain` על מזהה אנגלי.** עבור על שלושת קובצי
      הבדיקה וּודא שכל איסור מסוג `xp`/`score`/`points` נכתב כ-`/\bx\b/`-סטייל.
      **זה הלקח של C-0182, והוא עלה טיק.**

- [ ] **ⓓ אפס hex בשלושת רכיבי הזירה:**

```bash
grep -n "#[0-9a-fA-F]\{3,8\}" components/Arena*.tsx components/ArcadeEntry.tsx components/CloseIcon.tsx
```

צפוי: פלט ריק.

- [ ] **ⓔ הרץ את שרשרת האימות המלאה בהודעה שבה אתה טוען שסיימת** — ⛔ ולא «עבר קודם»:

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

---

## 5 · מה התוכנית הזאת ⛔ אינה מכסה

⛔ **`ARCADE_ENEMY_HP` לא אושר על ידי ה-PM.** § 4.2י אומרת «הקרב נגמר כשחיי היריב נגמרו»
⛔ ואינה נוקבת במספר. 5 נלקח מדוגמת החוזה ומפיקסטורות `arcadeResult.test.ts` — זו **ראיה**,
⛔ לא הכרעה. נפתח ממצא. ⛔ אל תשנה אותו בלי הכרעה כתובה.

⛔ **שם הדמות.** § 4.2י דורשת «שם נבחר מרשימה», אבל ל-`arcade_progress` **אין עמודת שם**
(`0014_arcade.sql`) ו-`POST /api/arcade/result` ⛔ אינו כותב אחת. בורר שם שאינו נשמר הוא
בקרה מזויפת ⇒ **מחוץ לתחולה**, ונפתח ממצא נגד ה-PM.

⛔ **שמירת תוצאה ממתינה בין רענונים.** «התוצאה אינה נשלחת עד שיש רשת ⛔ ולא נזרקת» ממומשת
בזיכרון + `online` + «נסה שוב». התמדה חוצת-רענון היא החלטת מוצר ⇒ חוב טכני ב-`30-architecture.md`.

⛔ **T-098 (`/world` כרשת אפליקציות)** — אריח הזירה שם הוא משימה משלה, ⛔ ואינו כאן.

⛔ **T-103 («סיבוב שטף»)** — היא **מוסיפה דדליין**, וכל שורה בתוכנית הזאת אוסרת שעון.
היא תחלוק את `arcadeBattle.ts` ⛔ רק אחרי ש-T-095 נחתה ונסקרה. **⛔ אל תתחיל אותה כאן.**

⛔ **«הוסף לרשימת החזרה» במסך הסיום** — D-047, `03-for-roy` פריט 31, ממתין לרוי.

⛔ **הרצת `0014_arcade.sql` בייצור** — פעולה של רוי, `03-for-roy` פריט 33. ⛔ **אינה חוסמת**:
הנתיבים עונים 503 בעברית והמסכים מציגים את המצב הזה כמצב, ⛔ לא כמסך ריק.
