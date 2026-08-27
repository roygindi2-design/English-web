# פרוסה A של הזירה — השעון נעשה אמיתי

**מחזור:** C-0324 (PM) · **זרימה:** `arena` (‏`ACTIVE_WORKSTREAM`) · **פריט 4 ב-`36 § 13`**
**מכסה שלוש משימות:** `T-173` · `T-176` · `T-177` — ⛔ ולא אחת (§ A1 שורה 6)
**הרנדר:** `docs/design/kol-B-03-battle.png` (§ A1 שורה 5)
**ההכרעות שמאשרות אותה:** `D-126` (החוק) · `D-127` (המסך) · `D-128` (F-085) · `D-129` (F-146)

---

## 0 · מה יש היום — ⛔ נמדד, ⛔ לא שוער

הליכה חיה על `work/current` (`@f18fa2a`), `next dev`, **375×780**, ‏**2026-08-27T01:1xZ**:

| נתיב | כותרת | תווים | לחיצים | ‏under-44px | גלילה אופקית |
|---|---|---|---|---|---|
| `/dev/arcade` | **⛔ (אין)** | **134** | 7 | 0 | ⛔ אין |

הטקסט **המלא** של המסך, מילה במילה:

> `נשארו לך 15 קליעים · ליריב 10 חיים` · `Lorem1` · `אפשרות 1` · `מסיח 1א` · `מסיח 1ב` · `מסיח 1ג` · `הבא`

**וזה כל מה שיש.** מדידה שנייה, על המקור ⛔ ולא על המסך:

```bash
grep -rn 'setTimeout\|setInterval\|deadline\|Date.now' lib/core/arcade*.ts components/Arena*.tsx
```

⇒ **אפס מופעים בקוד ריצה.** ארבעת המופעים היחידים הם **איסורים**: שתי בדיקות שומר
(`arcadeBattle.test.ts:94-109` · `arcadeFluency.test.ts:35-40`) ושתי הערות
(`arcadeBattle.ts:7` · `ArenaStage.tsx:8`).

⇒ **הזמן שהלומד רשאי לשהות על מילה בזירה הוא היום ⛔ בלתי חסום.** מילה שנפתרה
ב-1.2 שניות ומילה שנפתרה ב-60 שניות מטופלות **זהה לחלוטין** בכל שורה בקוד.

---

## 1 · מה זה קונה ללומד, ובכמה — התשובה ל-D-120

⛔ **«זה תואם את הרנדר» ⛔ אינה תשובה.** המנגנון והמספר:

**המנגנון.** `37 § 1` היא טבלה של שתי עמודות: כרטיסיות מאמנות **רכישה**
(אחזור מאומץ, SM-2, ולחץ זמן **מזיק** שם), והזירה מאמנת **אוטומטיות** — אחזור
**מהיר וחוזר**, שבו לחץ הזמן **הוא המנגנון עצמו** ⛔ ולא קישוט.
⇒ **בלי שעון, הזירה אינה זירה — היא עותק שני וגרוע של הכרטיסיות.**

**המספר.**

| | היום | אחרי פרוסה A |
|---|---|---|
| תקרת זמן לקרב | **⛔ אין** (בלתי חסום) | **90 שניות** |
| אחזורים בקרב | לא מוגדר | **~16** (‏`37 § 10` נוקב בעצמו ב-`נכונות 14/16`) |
| שניות לכל אחזור | **בלתי חסום** | **~5.6, נאכפות** |
| יריב שפועל בלי הלומד | ⛔ אין | **מכה כל 8 שניות** ⇒ **~11 מכות בקרב** |
| מסכים במוצר שמאמנים אוטומטיות | **0** | **1** |

⇒ **הלומד פותח את הזירה ונלחם קרב של 90 שניות מול יריב שתוקף בקצב עצמאי,
במקום ללחוץ `הבא` על 15 שאלות בלי שעון.** זה ⛔ אינו refactor ו⛔ אינו schema —
זה מסך שהלומד רואה ופועל בו אחרת (D-098).

⚠️ **והמספר המאכזב הוא התוצאה, ⛔ לא כישלון:** ~16 אחזורים בקרב על תמהיל שבו
לומד חדש מקבל **100% מילות בסיס** (`37 § 2`) פירושו שהקרב הראשון ⛔ **אינו** מזיז
שום מונה למידה — **ובכוונה.** אינווריאנט `37 § 13.1` אוסר על הזירה לכתוב
ל-`word_progress`, ו-`§ 10` מוסר את ההחלטה ללומד בלחיצה. ⇒ מה שהקרב קונה הוא
**מהירות על מה שכבר יודעים**, ⛔ ולא מילים חדשות.

---

## 2 · שלוש הגישות שנשקלו, ולמה נבחרה השנייה

| # | הגישה | למה ⛔ נדחתה / ✅ נבחרה |
|---|---|---|
| 1 | **שעון על גבי הלוח הקיים** — `setInterval` ב-`ArenaBoard.tsx`, `arcadeBattle.ts` נשאר | ⛔ **נדחתה.** מכניסה זמן לרכיב React — בדיוק מה ש-`arcadeBattle.ts:3-5` אוסר בשמו («‏`<ArenaBoard>` מצייר ו⛔ אינו מחשב — רכיב שמוריד חיים בעצמו הוא עותק שני של החוק, והשני תמיד סוטה»). ובדיקת השומר ב-`arcadeBattle.test.ts` **נשארת ירוקה** בזמן שהמוצר סותר את כוונתה ⇒ בדיוק הלקח של 2,403 הבדיקות הירוקות |
| 2 | **ליבה טהורה חדשה, והלוח הישן פורש באותו טיק** | ✅ **נבחרה.** השעון חי במקום אחד וטהור · ⛔ שני חוקי קרב סותרים ⛔ אינם חיים יחד על `dev` ולו קומיט אחד · תואם **בדיוק** את עמודת הקבצים של T-176 ו-T-173 כפי שהן כתובות היום |
| 3 | **זירה שלמה לפי המפרט בפרוסה אחת** (‏T-173+176+177+178+179+180+181+182) | ⛔ **נדחתה.** שמונה משימות. מפרה את § A1 שורה 6 (תוכנית מכסה 2–4), ו-D-098 דורשת פרוסה שהלומד רואה **עכשיו** |

---

## 3 · ההכרעה המרכזית — ⛔ השעון הוא פרמטר, ⛔ ולא טיימר

`lib/core/battle.ts` ⛔ **אינו מכיל** `setTimeout` · `setInterval` · `Date.now`.
הוא מקבל `elapsedMs` כ**קלט** בכל קריאה. לולאת ה-`requestAnimationFrame` היחידה
חיה **במסך**, ומזינה את המספר פנימה.

**שלוש סיבות, וכולן מדידות:**

1. **בדיקת השומר שורדת במקום להימחק.** סריקת המקור ב-`battle.test.ts` עדיין
   מאשרת שאין בקובץ ולו API אחד של זמן. האיסור **משנה משמעות** — «⛔ אין שעון
   נסתר» במקום «⛔ אין זמן» — ⛔ ולא נמחק. ⚠️ מחיקת בדיקת שומר בלי שהיא מוחלפת
   היא בדיוק מה שהפיל את `T-164`.
2. **90 שניות נבדקות ב-0 שניות.** `battle.test.ts` מאשר את קצב היריב (8 ש׳), את
   `זמן זעם` (70→90 ש׳) ואת תקרת המאנה **בלי להמתין 90 שניות אמיתיות ב-CI**.
   טיימר אמיתי היה מוסיף 90 שניות לכל `npm run verify` — היום 1,158 בדיקות.
3. **`prefers-reduced-motion` נשאר עניין של המסך בלבד** (חוקה **שכבה א׳ · א7**,
   קפואה). חוקי הקרב ⛔ אינם תלויים באנימציה, ולכן לומד שכיבה תנועה מקבל **אותו
   קרב בדיוק**, ⛔ ולא גרסה קלה יותר או קשה יותר.

---

## 4 · מבנה קבצים — ⛔ מה נוצר ומה נערך (§ A1 שורה 4)

⚠️ **כל נתיב כאן עבר `test -f` בטיק הזה** — הלקח של C-0318, שנכתב הרגע כשורה 10
ב-`27-pm-lessons § A1`. הפקודה שהורצה:
`for f in …; do test -f "$f" && echo EXISTS || echo MISSING; done`

| נתיב | `test -f` | פעולה | משימה |
|---|---|---|---|
| `lib/core/arenaWords.ts` | MISSING | **נוצר** | T-173 |
| `lib/core/arenaWords.test.ts` | MISSING | **נוצר** | T-173 |
| `lib/core/battle.ts` | MISSING | **נוצר** | T-176 |
| `lib/core/battle.test.ts` | MISSING | **נוצר** | T-176 |
| `app/arcade/arcade-tokens.css` | MISSING | **נוצר** | T-177 |
| `app/arcade/page.tsx` | EXISTS | **נערך** | T-177 |
| `app/dev/arcade/page.tsx` | EXISTS | **נערך** (הפיקסצ׳ר מזין את הליבה החדשה) | T-177 |
| `components/ArenaStage.tsx` | EXISTS | **נערך** | T-177 |
| `lib/core/arcadeBattle.ts` | EXISTS | **נמחק** — ראה צעד 9 | T-176 |
| `lib/core/arcadeBattle.test.ts` | EXISTS | **נמחק אחרי שהשומר הועבר** — צעד 9 | T-176 |
| `components/ArenaBoard.tsx` | EXISTS | **נמחק** — צעד 9 | T-177 |
| `lib/core/arcadeFluency.ts` | EXISTS | ⛔ **⛔ לא נגעים** — הגדרת «מילה ידועה» של הזירה (D-052 · D-062) | — |
| `lib/core/arcadeRound.ts` | EXISTS | ⛔ **⛔ לא נגעים בטיק הזה** — T-152 נחתה בו אתמול | — |
| `app/api/arcade/round/route.ts` | EXISTS | ⛔ **⛔ לא נגעים** — F-146 הוא T-212, ⛔ לא הפרוסה הזאת | — |
| `docs/design/kol-B-03-battle.png` | EXISTS | הרנדר — קריאה בלבד | T-177 |

⚠️ **`lib/proxy.ts` ⛔ אינו קיים; הקובץ הוא `proxy.ts` בשורש** (Next 16). ⛔ אין לו
זכר בפרוסה הזאת, והשורה כאן היא תזכורת בלבד — היא מה שהפיל את C-0318.

---

## 5 · `Interfaces` — חתימות. הבלוק הזה **הורץ** דרך `tsc --strict --noUncheckedIndexedAccess` (§ A1 שורה 9)

⛔ **⛔ לא נוחש.** הפקודה שהורצה בטיק הזה, ⛔ והפלט:

```bash
node_modules/.bin/tsc --strict --noUncheckedIndexedAccess --noEmit \
  --target es2022 --module esnext --moduleResolution bundler iface.ts
# ⇒ TSC CLEAN  (יציאה 0, אפס שגיאות)
```

```ts
// ── T-173 · lib/core/arenaWords.ts ──────────────────────────────────────
export type ArenaWordKind = 'known' | 'unfiltered' | 'base';

export interface ArenaWord {
  readonly wordId: string;
  readonly headword: string;
  readonly translationHe: string;
  readonly kind: ArenaWordKind;
}

export interface ArenaMixInput {
  readonly known: readonly ArenaWord[];
  readonly unfiltered: readonly ArenaWord[];
  readonly base: readonly ArenaWord[];
  readonly size: number;
}

export function mixArenaWords(input: ArenaMixInput): readonly ArenaWord[];

// ── T-176 · lib/core/battle.ts ──────────────────────────────────────────
// ⛔ אין בקובץ setTimeout · setInterval · Date.now. `elapsedMs` הוא קלט.
export const BATTLE_MS = 90_000;
export const RAGE_FROM_MS = 70_000;
export const ENEMY_SWING_MS = 8_000;
export const MANA_MS = 2_000;
export const MANA_CAP = 10;
export const CRITICAL_MS = 1_500;

export type BattleOutcome = 'running' | 'victory' | 'survived' | 'outlasted';

export interface BattleCast {
  readonly wordId: string;
  readonly correct: boolean;
  readonly responseMs: number;
  readonly critical: boolean;
}

export interface BattleState {
  readonly words: readonly ArenaWord[];
  readonly index: number;
  readonly learnerHp: number;
  readonly learnerHpMax: number;
  readonly enemyHp: number;
  readonly enemyHpMax: number;
  readonly mana: number;
  readonly shownAtMs: number;
  readonly lastSwingMs: number;
  readonly casts: readonly BattleCast[];
}

export function manaAt(elapsedMs: number, spent: number): number;
export function isRage(elapsedMs: number): boolean;
export function outcomeAt(state: BattleState, elapsedMs: number): BattleOutcome;
export function cast(state: BattleState, chosen: string, elapsedMs: number): BattleState;
export function tick(state: BattleState, elapsedMs: number): BattleState;
```

⚠️ **`BattleOutcome` נושא ארבעה ערכים ⛔ ולא שלושה.** ההערה ב-`arcadeBattle.ts:24`
אומרת «⛔ שני מוצאים, ⛔ ואין שלישי. «הפסד» אינו מצב במוצר הזה» — **וזה מתבטל
ב-D-126 § ד׳.** `37 § 3` קובע «בתום השעון מנצח אחוז החיים הגבוה», ⇒ **הפסד הוא
מצב**. `outlasted` = הלומד שרד עם אחוז גבוה יותר; `survived` = היריב. ⛔ **והמילה
«הפסדת» ⛔ אינה מופיעה על המסך אף פעם** — `37 § 9` ח4 קובע מסגור `היית 2 מילים
מהבוס`. ⇒ **המצב קיים, הנוסח ⛔ לא.**

---

## 6 · הצעדים — כל אחד נוקב **בקובץ או בפקודה** (§ A1 שורה 1) · ⛔ אפס TODO (§ A1 שורה 7)

### T-173 — מקור המילים (טהור · ⛔ בלי מסך)

- [x] **צעד 1 — T-173 · הבדיקה האדומה.** צור `lib/core/arenaWords.test.ts` **לפני** המימוש. הבדיקות, כלשונן:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { mixArenaWords, type ArenaWord } from './arenaWords';

const w = (id: string, kind: ArenaWord['kind']): ArenaWord =>
  ({ wordId: id, headword: 'w' + id, translationHe: 'ת' + id, kind });

describe('arenaWords', () => {
  it('מחסן ריק ⇒ 100% מילות בסיס, ⛔ ולא מסך ריק', () => {
    const out = mixArenaWords({ known: [], unfiltered: [], base: [w('1','base'), w('2','base')], size: 2 });
    expect(out).toHaveLength(2);
    expect(out.every((x) => x.kind === 'base')).toBe(true);
  });

  it('מחסן מלא ⇒ לכל היותר 75% ידועות, ולא-מסוננות בתמהיל תמיד', () => {
    const known = Array.from({ length: 40 }, (_, i) => w('k' + i, 'known'));
    const unfiltered = Array.from({ length: 40 }, (_, i) => w('u' + i, 'unfiltered'));
    const out = mixArenaWords({ known, unfiltered, base: [], size: 16 });
    const nKnown = out.filter((x) => x.kind === 'known').length;
    expect(nKnown).toBeLessThanOrEqual(12);          // 75% מ-16
    expect(out.length - nKnown).toBeGreaterThan(0);  // `37 § 2`: «בתמהיל **תמיד**»
  });

  it('⛔ הקובץ ⛔ אינו נוגע במנוע הלמידה (אינווריאנט 13.1 · 13.3)', () => {
    const src = readFileSync('lib/core/arenaWords.ts', 'utf8');
    for (const bad of ['word_progress', 'easiness', 'interval_days', 'next_review_at']) {
      expect(src, `${bad} אסור — אינווריאנט 13.1`).not.toContain(bad);
    }
  });
});
```

- [x] **צעד 2 — T-173 · המימוש.** צור `lib/core/arenaWords.ts` עם החתימה מ-§ 5. ⛔ אפס import מ-`lib/api`, ⛔ אפס `fetch`, ⛔ אפס React.
- [x] **צעד 3 — T-173 · ירוק.** `npx vitest run lib/core/arenaWords.test.ts` ⇒ ירוק.

### T-176 — ליבת הקרב (טהורה · 90 שניות)

- [x] **צעד 4 — T-176 · הבדיקה האדומה.** צור `lib/core/battle.test.ts` **לפני** המימוש:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BATTLE_MS, ENEMY_SWING_MS, MANA_CAP, cast, isRage, manaAt, outcomeAt, tick } from './battle';

describe('battle', () => {
  it('⛔ שעון אחד לקרב שלם, ⛔ ולא טיימר לשאלה', () => {
    expect(BATTLE_MS).toBe(90_000);
  });

  it('`זמן זעם` = 20 השניות האחרונות, ומכפיל מאנה', () => {
    expect(isRage(69_999)).toBe(false);
    expect(isRage(70_000)).toBe(true);
    expect(manaAt(70_000, 0)).toBeGreaterThan(manaAt(69_999, 0));
    expect(manaAt(600_000, 0)).toBe(MANA_CAP);   // התקרה מחזיקה
  });

  it('היריב מתקיף כל 8 שניות בקצב עצמאי — 90 ש׳ ⇒ 11 מכות', () => {
    let s = FRESH;
    for (let ms = 0; ms <= BATTLE_MS; ms += 1000) s = tick(s, ms);
    expect(s.learnerHp).toBe(FRESH.learnerHp - Math.floor(BATTLE_MS / ENEMY_SWING_MS));
  });

  it('⛔ אין מצב כישלון על איטיות — תשובה נכונה איטית עדיין פוגעת', () => {
    const fast = cast({ ...FRESH, shownAtMs: 0 }, FRESH.words[0]!.translationHe, 1_000);
    const slow = cast({ ...FRESH, shownAtMs: 0 }, FRESH.words[0]!.translationHe, 9_000);
    expect(fast.enemyHp).toBeLessThan(FRESH.enemyHp);
    expect(slow.enemyHp).toBeLessThan(FRESH.enemyHp);   // ⛔ פוגעת, ⛔ לא מאפסת
    expect(fast.enemyHp).toBeLessThan(slow.enemyHp);    // קריטי מתחת ל-1.5 ש׳
    expect(slow.casts[0]!.critical).toBe(false);
  });

  it('בתום השעון מנצח אחוז החיים הגבוה — ⛔ והפסד הוא מצב (D-126 § ד׳)', () => {
    const ahead = { ...FRESH, learnerHp: 8, enemyHp: 2 };
    const behind = { ...FRESH, learnerHp: 2, enemyHp: 8 };
    expect(outcomeAt(ahead, BATTLE_MS)).toBe('outlasted');
    expect(outcomeAt(behind, BATTLE_MS)).toBe('survived');
    expect(outcomeAt(FRESH, 1_000)).toBe('running');
  });

  it('⛔ אין בקובץ שעון נסתר — הזמן הוא קלט (D-126 § ג׳)', () => {
    const code = readFileSync('lib/core/battle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    for (const banned of [/\bsetTimeout\b/, /\bsetInterval\b/, /\bDate\.now\b/, /\brequestAnimationFrame\b/]) {
      expect(code, `${banned} אסור — D-126 § ג׳`).not.toMatch(banned);
    }
    // ⛔ אינווריאנט 13.1 — הזירה ⛔ אינה מזיזה את מנוע החזרות. הועבר מ-arcadeBattle.test.ts.
    for (const banned of [/word_progress/, /easiness/, /interval_days/, /next_review_at/]) {
      expect(code, `${banned} אסור — אינווריאנט 13.1`).not.toMatch(banned);
    }
  });
});
```

⚠️ **`FRESH` הוא פיקסצ׳ר שהבדיקה מגדירה בראשה** — ‏`startBattle` על ארבע `ArenaWord`
עם `learnerHpMax = 10` ו-`enemyHpMax = 10`. ⛔ אין TODO: הצעד מגדיר אותו.

- [x] **צעד 5 — T-176 · המימוש.** צור `lib/core/battle.ts` לפי § 5.
- [x] **צעד 6 — T-176 · ירוק.** `npx vitest run lib/core/battle.test.ts` ⇒ ירוק.

⛔ **שים לב לאיסור שהוסר, ולזה שנשאר** (D-126 § ב׳): האיסור `xp|score|points|coin`
מ-`arcadeBattle.test.ts:100-102` ⛔ **אינו עובר** ל-`battle.test.ts` — `36 § 2` שורה 7
**הגבילה את D-050** ב-23/08 והתירה נקודות **בזירה בלבד**. האיסור על `word_progress`
**כן** עובר, ובאותה לשון.

### T-177 — הבמה

- [x] **צעד 7 — T-177 · הטוקנים.** צור `app/arcade/arcade-tokens.css` עם **חמשת** הערכים של אינווריאנט
`37 § 13.5` בלבד: `#d4a94a` · `#f5d684` · `#4a4858` · `#34323f` · `#1c2642`.
⛔ **אף אחד מהם ⛔ אינו נכנס ל-`lib/core/palette.ts`** — הבדיקה בצעד 8 אוכפת זאת.

- [x] **צעד 8 — T-177 · הבמה.** ערוך `app/arcade/page.tsx` · `app/dev/arcade/page.tsx` · `components/ArenaStage.tsx`
כך שיציירו את שבעת האזורים של `docs/design/kol-B-03-battle.png`, מלמעלה למטה:
`זמן קרב m:ss` · באנר המילה האנגלית ב-`<EnWord>` · שם היריב + פס חייו `N/M` ·
הלוחם · `מאנה N / 10` · ארבעה קלפי לחש בעברית · הערת הבידוד
`זירת הקרב מבודדת · אין השפעה על SM-2`.
לולאת ה-`requestAnimationFrame` **היחידה** חיה כאן ומזינה `elapsedMs` ל-`battle.ts`.
בדיקה, ב-`app/arcade/page.test.ts`:

```ts
it('⛔ טוקני הזירה ⛔ אינם דולפים ל-palette', () => {
  const palette = readFileSync('lib/core/palette.ts', 'utf8');
  for (const hex of ['#d4a94a', '#f5d684', '#4a4858', '#34323f', '#1c2642']) {
    expect(palette, `${hex} — אינווריאנט 37 § 13.5`).not.toContain(hex);
  }
});

it('הערת הבידוד ⛔ אינה אופציונלית (אינווריאנט 13.1)', () => {
  expect(readFileSync('app/arcade/page.tsx', 'utf8')).toContain('אין השפעה על SM-2');
});
```

- [x] **צעד 9 — הפרישה. ⛔ ⛔ לא «אחר כך».** מחק `lib/core/arcadeBattle.ts` · `lib/core/arcadeBattle.test.ts` · `components/ArenaBoard.tsx`
**ואת בדיקותיהם**, ותקן כל צרכן ש-`npm run typecheck` יצביע עליו.
⚠️ **הנימוק בלשון הקובץ הנמחק עצמו** (`arcadeBattle.ts:4-5`): «שני מקומות למספר
אחד הם עותק שני של החוק, **והשני תמיד סוטה**». ⇒ ⛔ אסור ששני חוקי קרב יחיו על
`dev` ולו קומיט אחד.

- [x] **צעד 10 — הליכת ראייה.** `npx next dev -p 3000`, ואז `/dev/arcade` ב-**375×780** (`app/dev/arcade/page.tsx`).
⛔ **רשום את חמשת המספרים** — כותרת · תווים · לחיצים · under-44px · גלילה אופקית —
**מול שורת הבסיס של § 0** (`אין · 134 · 7 · 0 · אין`). ⛔ מסך שחוזר עם 134 תווים
הוא מסך שלא נבנה.

- [x] **צעד 11 — צעד הסיום (§ A1 שורה 3).** `npm run verify` ⇒ ירוק, **בהרצה טרייה**.
⛔ אין טענת הצלחה בלי הפלט.

---

## 6.5 · מעמד הרנדר — `36 § 14.4`

🎯 **הרנדר `docs/design/kol-B-03-battle.png` מחייב גם בגימור, ⛔ ולא רק במבנה.**
⛔ «הגימור מגיע מהחוקה» ⛔ **אינו** תשובה לפער מהרנדר — הסעיף התהפך ב-24/08 בדיוק
מפני שהמשפט הזה היה דלת היציאה מכל פער חזותי. ⇒ פער בין המסך לרנדר הוא **פער**,
והוא נסגר או נרשם כשורה מפורשת.

⛔ **ההחרגה היחידה היא שכבה A של `35-design-constitution.md`** — נגישות: ניגודיות ·
אייקון+תווית · יעד 44px · `prefers-reduced-motion` (א7). כשהרנדר סותר את שכבה A,
**שכבה A גוברת והפער נרשם כאן.** ⛔ אין החרגה שנייה.

⚠️ **שלוש נקודות שבהן הרנדר ושכבה A נפגשים בפרוסה הזאת, ⛔ ולא הוסקו:**
1. **פס חיי היריב** ברנדר הוא **אדום על אדום** עם `100/100` בתוכו. ✅ תואם — המספר
   הוא הערוץ השני (א2), ⛔ ואין להסיר אותו כדי «לנקות».
2. **מד המאנה** ברנדר הוא כחול עם `3 / 10`. ✅ תואם, מאותה סיבה.
3. **קלף `?` (`לחש לא מזוהה`)** — הסימן **וגם** התווית העברית. ⛔ הסימן לבדו הוא
   קידוד בערוץ אחד ומפר את א2.

---

## 7 · מה הפרוסה הזאת ⛔ אינה עושה

⛔ אין מיגרציה · ⛔ אין עמודה · ⛔ אין נתיב API חדש · ⛔ אין תוכן חדש · ⛔ אין הזמנת תוכן.

⛔ **ו⛔ אינה נוגעת ב:** גרירה (T-178 — **ההקשה נשארת**, ו-`37 § 5` ממילא קורא לה
«מסלול **נוסף**») · חלון ההתחמקות (T-179) · מסך התוצאות (T-180 — `ArenaResult`
הקיים נשאר) · מסך הבית של הזירה (T-181) · שפת האנימציה (T-182) · בחירת דמות
(`37 § 7`) · **ארבע יכולות המאנה** (`הקפאה`·`מגן`·`כפול`·`ריפוי`) — **מד** המאנה
מצויר ומחושב, ה**יכולות** ⛔ לא.

---

## 8 · תלויות ⛔ ואי-תלויות

| | |
|---|---|
| **תלוי ב-** | ⛔ **בכלום.** T-152 נחתה ב-C-0323, ו-`arcadeRound.ts` מספק כבר היום ארבע אפשרויות עבריות |
| **⛔ אינו תלוי ב-** | **F-146 / T-212** — הפרוסה ⛔ אינה נוגעת ב-`ROUND_SELECT`. ‏D-129 מדד: **0 מתוך 713** שורות מושפעות היום |
| **⛔ אינו תלוי ב-** | **T-153** — מסיחים מתויגים הם **איכות** המסיח; הפרוסה הזאת היא **קיומו של שעון** |
| **משחרר** | ⛔ כלום ישירות. T-178…T-182 הופכות לניתנות-לתכנון ברגע שהבמה קיימת |

---

## 9 · ביצוע — C-0325 (DEV · טיק בנייה)

⛔ **נמדד, ⛔ ולא שוער.** אחת-עשרה הצעדים בוצעו; שלוש המשימות נמסרו 🟣 (בנוי · ירוק ·
⛔ עוד לא על `dev`).

| | בסיס § 0 (`/dev/arcade`) | אחרי C-0325 |
|---|---|---|
| כותרת | ⛔ אין | ⛔ אין (‏`h1` ⛔ אינו במסך זרימה — כמו קודם) |
| תווים | **134** | **167** |
| לחיצים | 7 | **6** — ⛔ פחות אחד **בכוונה**: `הבא` נמחק, כי `37 § 3` נותן **שעון אחד לקרב** ⛔ ולא המתנה לכל שאלה |
| ‏under-44px | 0 | **0** (‏320 · 375 · 414) |
| גלילה אופקית | ⛔ אין | **⛔ אין** (‏320 · 375 · 414) |
| שגיאות קונסול | — | **0** |
| **שעון** | **⛔ אין** | **`זמן קרב 1:29` ⇢ `1:26` תוך 3 שניות — נמדד בדפדפן** |
| **חיי יריב** | 10 פיפים סטטיים | **`100/100` ⇢ `95/100` אחרי הטלה — נמדד** |
| **מאנה** | ⛔ אין | **`0 / 10`, נצברת** |

⚠️ **ההליכה רצה על `next start` ⛔ ולא על `next dev`** — ראה **F-147 ⓔ**: בארגז החול
`next dev` מחזיר 403 על נתחי הלקוח, הדף ⛔ אינו מתאחה, והמסך נמדד **מת**.

**פערים מהרנדר, כשורה מפורשת (`36 § 14.4`):** **F-147** — שורת היכולות · רקע הבמה ·
צבעי הקלפים · כפתור ההשהיה. שלושת הראשונים הוצאו בתחולה ב-§ 7 של התוכנית עצמה.

**`npm run verify` — הרצה טרייה:** `174 קבצים · 2,819 בדיקות · 1,158 בדיקות ניידות · EXIT=0`.
