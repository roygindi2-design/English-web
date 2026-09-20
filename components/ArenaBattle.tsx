'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActionBar from '@/components/ActionBar';
import ArenaResult, { type ArenaMissed } from '@/components/ArenaResult';
import ArenaStage from '@/components/ArenaStage';
import ArenaSummary from '@/components/ArenaSummary';
import SpellCard from '@/components/SpellCard';
import { foeRect, heroRect } from '@/components/arenaAnchors';
import CloseIcon from '@/components/CloseIcon';
import EnWord from '@/components/EnWord';
import { apiGet, apiPost } from '@/lib/api/client';
import type { ArenaCharacter } from '@/lib/core/arenaCharacter';
import { mixArenaWords, type ArenaWord, type ArenaWordKind } from '@/lib/core/arenaWords';
import { resolveGesture } from '@/lib/core/arenaGesture';
import { endingOf, summarize } from '@/lib/core/arenaSummary';
import {
  ABILITY_COST,
  ABILITY_ORDER,
  BATTLE_MS,
  ENEMY_HP,
  MANA_CAP,
  canUseAbility,
  aimLaneAt,
  canPlaceGuard,
  cast,
  placeGuard,
  GUARD_COST,
  isFrozen,
  spendAbility,
  isRage,
  manaAt,
  returnedSpell,
  stagePhase,
  startBattle,
  streakAt,
  swipe,
  STREAK_HOT,
  telegraphAt,
  tick,
  CENTRE,
  LANE_NAMES,
  type AbilityKey,
  type BattleState,
  type Lane,
  type StagePhase,
  type TelegraphPhase,
} from '@/lib/core/battle';
import type { ArcadeAnswer } from '@/lib/core/arcadeResult';
import type { ArcadeQuestion } from '@/lib/core/arcadeRound';
import { FAILURE_HE, RETRY_HE, SCHEMA_MISSING_HE } from '@/lib/core/failure';
import { SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

/**
 * T-177 · `37-arena-spec § 12` · `36 § 8` — **במת הקרב.**
 * 🎯 הרנדר: `docs/design/kol-B-03-battle.png`. ⛔ המבנה **וגם הגימור** מחייבים (`36 § 14.4`,
 * שהתהפך 24/08); ⛔ «הגימור מגיע מהחוקה» ⛔ אינו תשובה לפער. שכבה א׳ היא ההחרגה היחידה.
 *
 * ⚠️ **מחליף את `components/ArenaBoard.tsx`, שנמחק באותו קומיט.** הרכיב הישן צייר 15
 * שאלות **בלי שעון**: מילה שנפתרה ב-1.2 שניות ומילה שנפתרה ב-60 שניות טופלו זהה
 * בכל שורה בקוד — כלומר הזירה ⛔ לא אימנה אוטומטיות, והייתה עותק שני וגרוע של
 * הכרטיסיות (`37 § 1`).
 *
 * ⚠️ **הקובץ נוצר, ⛔ ו-`ArenaStage.tsx` ⛔ לא הורחב — וזה חוק ⛔ ולא סגנון:**
 * ‏`components/ArenaStage.test.ts` אוסר במפורש `useState` · `useEffect` ·
 * ‏`requestAnimationFrame` בתוך `ArenaStage`, ⇒ לולאת הזמן ⛔ אינה יכולה לחיות שם.
 * ‏`<ArenaStage>` נשאר **ציור טהור של שתי הדמויות**, והרכיב הזה הוא המסך שמסביבו.
 * (‏`RULES § 0.22` — «גבולות מודול» הוא קריאה של DEV; נרשמה בסיכום הטיק.)
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב.** כל חוק של הקרב חי ב-`lib/core/battle.ts`. הרכיב
 * ⛔ אינו מוריד חיים, ⛔ אינו גוזר נזק ו⛔ אינו יודע מהו `זמן זעם` — הוא **מזין
 * `elapsedMs` פנימה** ומצייר את מה שחוזר.
 *
 * ✅ **לולאת ה-`requestAnimationFrame` היחידה בזירה חיה כאן** (D-126 § ג׳), וזו בדיוק
 * הסיבה שהליבה טהורה: שעון אמיתי בליבה היה מוסיף 90 שניות לכל `npm run verify`.
 *
 * ⛔ **אינווריאנט `37 § 13.1`:** הזירה ⛔ אינה כותבת ל-`word_progress`. שתי נקודות קצה,
 * ובלבד: `GET /api/arcade/round` ו-`POST /api/arcade/result`.
 *
 * ⚠️ **מסך זרימה** (D-028): `app/arcade/page.tsx` יושב **מחוץ** ל-`app/(tabs)/`, ולכן
 * ⛔ אין כאן סרגל לשוניות — בדיוק כפי שהרנדר מראה.
 */

/**
 * ⚠️ **`level` הוסר — T-239 · `docs/api-contract.md:1150` (D-052).** השדה מעולם לא נשלח
 * על ידי `GET /api/arcade/round` (הנתיב שולח `gameLevel` ו-`band` בלבד), ⇒ `body.level`
 * היה תמיד `undefined`, ובדיקת `body.level === null` שהיה תלוי בה — קוד מת שלעולם לא
 * ירה. `band` הוא השדה שהשרת **אכן** שולח, ואת מה שנמסר ל-`ready.level` היום.
 */
type RoundBody =
  | {
      readonly ok: true;
      readonly band: string;
      readonly round: { readonly questions: readonly ArcadeQuestion[] } | null;
      readonly reason?: 'level_too_small';
      readonly eligible?: number;
      readonly required?: number;
    }
  | { readonly ok: false; readonly code: string; readonly message?: string };

type ResultBody =
  | {
      readonly ok: true;
      readonly enemyDefeated: boolean;
      readonly unlocked: string | null;
      readonly missed: readonly {
        readonly wordId: string;
        readonly answer: string;
        readonly chosen: string;
      }[];
    }
  | { readonly ok: false; readonly code?: string; readonly message?: string };

type ResultPayload = {
  // F-092 · מפתח האידמפוטנטיות — נוצר פעם אחת, ברגע השליחה, ו⛔ לא בתוך `send`.
  readonly runId: string;
  readonly answers: readonly ArcadeAnswer[];
};

export interface ArenaRound {
  readonly level: string;
  readonly questions: readonly ArcadeQuestion[];
}

/**
 * `initialRound` — ⛔ אך ורק לפיקסטורה (`/dev/arcade`), ומאותה סיבה מדודה של
 * `ArenaBoard` לפניו: `check:mobile` מריץ `next start` בלי env של Supabase, ולכן
 * `GET /api/arcade/round` מגיע ל-503 של החוזה שלו עצמו ⇒ המסך האמיתי ⛔ לא נמדד אף פעם.
 */
export interface ArenaBattleProps {
  readonly initialRound?: ArenaRound;
  /** T-217 · `37 § 7` — הדמות שנבחרה, מהמעטפת. ⛔ הקרב ⛔ אינו שואל עליה את השרת. */
  readonly character?: ArenaCharacter | null;
  /**
   * 🆕 ⟦`C-0712` · `T-431`⟧ **הציוד שהדמות נושאת בקרב.**
   *
   * 🔬 **נמדד, ⛔ ולא שוער.** הבמה נקראה עם `items={[]}` **מקודד קשיח**, ו-`ArenaAvatar`
   * מחזיק ארבעה פריטים מצוירים — `cape` · `banner` · `lantern` · `boots` — שמעולם
   * ⛔ לא הופיעו בקרב. ⇒ שני דברים נבעו מזה: ⓐ הדמות בקרב היא הגרסה **הכי פחות
   * מלבושה** שלה, וכל שיפוט עיצוב (‏`diff:render`, ביקורת, ורוי) נעשה מולה; ⓑ
   * `arena-sway` על `data-arena-part='cape'` ו**המשכיות התנועה על הנשק** ⛔ מעולם
   * ⛔ לא היה להם על מה לחול — נמדד בהליכה חיה: מתוך שלושת ה-`data-arena-part`
   * המוצהרים, **רק `hair` נרנדר**.
   *
   * ⛔ **וזה ⛔ אינו מחבר את הציוד למוצר.** הלומד **זוכה** בפריט (`unlocked` ב-
   * `arcadeResult.ts:44`) ומסך התוצאה מציג אותו — ⛔ אבל אין מאגר «מה שיש לי»,
   * ולכן ⛔ אין ממה למלא את השדה הזה בפרודקשן. **ברירת המחדל נשארת ריקה**
   * ⇒ הפרודקשן ⛔ לא זז, והפיקסטורה יכולה סוף־סוף להציג את מה שקיים. `F-287`.
   */
  readonly items?: readonly string[];
}

/** ⚠️ **`no_level` הוסר — T-239 · D-052.** «רמת המשחק מתחילה ב-1 לכל לומד»: הנתיב
 *  ⛔ אינו שולח יותר מצב «טרם בחרת רמה», והמצב כאן היה בלתי-מושג מהרגע שנכתב. */
type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly level: string }
  | { readonly kind: 'too_small'; readonly eligible: number | null; readonly required: number | null }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'error' };

/**
 * ⚠️ **חיי הצדדים, ⛔ ולא מה שהפס מציג.** הרנדר מצייר `100/100`, ו-`render_video_B.py:475`
 * מראה מה זה **באמת**: `f"{int(st['hp']*100)}/100"` — כלומר **אחוז**, ⛔ ולא HP גולמי.
 * ⇒ הפס מציג אחוז (נאמנות לרנדר). T-281 · `37 § 7` גדר 4: **המספרים עצמם ⛔ אינם כאן** —
 * חיי הלומד הם שורת הדמות ב-`lib/core/battle.ts` (`CHARACTER_STATS`), חיי היריב הם
 * `ENEMY_HP` שם. הרכיב מוסר את `character` ל-`startBattle` ומצייר את מה שחוזר.
 */

const CLOSE_HE = 'סגור';
const CLOCK_HE = 'זמן קרב';
const ENEMY_HE = 'הקוסם';
const ENEMY_HP_HE = 'חיי היריב';
/**
 * 🩸 **⟦19/09 · `C-0733` · `T-436` · סוגר את `F-304`⟧ ללומד ⛔ לא היה פס חיים.**
 *
 * 🔬 **נמדד, ⛔ ולא שוער:** `grep -rn "learnerHp" components/` ⇒ **0**. למנוע יש
 * `learnerHp`/`learnerHpMax`, הם **יורדים מכל מכה**, ו-`outcomeAt` מכריע לפיהם —
 * והלומד ⛔ **לא יכול היה לראות אותם**. פס חיי ה**יריב** מצויר במלואו; שלו ⛔ לא.
 * ⇒ הוא הפסיד **בלי לדעת שהוא בסכנה**.
 * 🔴 **ובלי זה כל מכניקת התנועה חסרת פשר:** ⛔ אין טעם להתחמק ממכה כשאי-אפשר
 * לראות מה היא עולה.
 */
/**
 * 🛡️ **`T-438` — ההכרזה על ההגנה **נגזרת מהמצב**, ⛔ ולא צומת חולף.**
 *
 * 🔬 **וזה נשקל ונדחה:** צומת חולף היה דורש שחרור, ובקובץ הזה שחרור פירושו
 * `onAnimationEnd` — ⇒ תחת `prefers-reduced-motion` המשך מתאפס ל-`0.01ms`
 * וההודעה הייתה **מהבהבת ונעלמת** לפני שקורא מסך הספיק להגיע אליה.
 * ⇒ אזור `aria-live` **נגזר**: הוא משתנה בדיוק פעמיים לכל הגנה, ⛔ אינו זקוק
 * לשחרור, ו⛔ אינו תלוי בתנועה כלל.
 * ⛔ **וההכרזה ⛔ אינה מיותרת:** ההגנה **נראית** על הרצפה, ⛔ אבל לומד שקורא
 * מסך ⛔ אינו רואה אותה — והמאנה שלו כן ירדה.
 */
const GUARD_ON_HE = 'הגנה מוצבת בנתיב שלך';
/** ⛔ **השם הנגיש נוקב במחיר** — כפתור שגובה משאב ו⛔ אינו אומר כמה הוא פוגם. */
const GUARD_BTN_HE = `הצבת הגנה בנתיב שלך · ${String(GUARD_COST)} מאנה`;

const LEARNER_HE = 'את/ה';
const LEARNER_HP_HE = 'החיים שלך';
const MANA_HE = 'מאנה';

/** ⓔ `T-397` — צבע מקטע מאנה מלא. ⛔ טוקן, ⛔ ולא hex: `--arena-mana` הוא
 *  ‏`#5684e2` == ה-`(86,132,226)` של `render_video_B.py:300`, ו-`--arena-cast-warn`
 *  הוא צבע ה-`RAGE` שאותה פונקציה מחליפה אליו. */
function manaSegColor(raging: boolean): string {
  return raging ? 'var(--arena-cast-warn)' : 'var(--arena-mana)';
}

/** ⓔ `T-397` — צובע את עשרת המקטעים מתוך לולאת ה-rAF, ⛔ בלי רינדור חוזר.
 *  ⛔ **פונקציה טהורה מעל ה-DOM שנמסר לה** — היא ⛔ אינה קוראת ל-`document` ו⛔ אינה
 *  מחזיקה מצב, ⇒ הבדיקה מריצה אותה על מערך מזויף בלי דפדפן. */
function paintManaSegments(
  segs: readonly (HTMLSpanElement | null)[],
  mana: number,
  raging: boolean,
): void {
  for (let k = 0; k < segs.length; k += 1) {
    const el = segs[k];
    if (el === null || el === undefined) continue;
    const full = k < mana;
    el.dataset.full = full ? 'true' : 'false';
    el.style.backgroundColor = full ? manaSegColor(raging) : 'transparent';
  }
}
const RAGE_HE = 'זמן זעם · מאנה כפולה';

/**
 * ⚡ **T-363 · `37 § 4` — שלוש היכולות, בסדר ובעלויות של `render_video_B.py:308`.**
 * ⛔ **הרכיב ⛔ אינו מחזיק עלות ו⛔ אינו מחזיק חוק** — `ABILITY_COST` ו-`canUseAbility`
 * חיים ב-`lib/core/battle.ts`. כאן יש **שם עברי בלבד**, וזה כל מה שמסך רשאי להחזיק.
 */
const ABILITY_HE: Readonly<Record<AbilityKey, string>> = {
  double: 'כפול',
  shield: 'מגן',
  freeze: 'הקפאה',
};
/** ⛔ המצב ⛔ לעולם ⛔ אינו בצבע בלבד (חוקה שכבה א׳ א2) — לכל אפקט פעיל יש **מילה**. */
const ABILITY_ON_HE: Readonly<Record<AbilityKey, string>> = {
  double: 'נזק כפול',
  shield: 'מגן פעיל',
  freeze: 'היריב קפוא',
};
const ABILITIES_HE = 'יכולות';
const ABILITY_COST_SR_HE = 'עולה';
const ABILITY_MANA_SR_HE = 'מאנה';
const SHIELDED_HE = 'מגן!';

/**
 * ⚡ T-363 — **אותו דפוס בדיוק של `paintManaSegments`** (T-231 ⓔ): הזמינות משתנה עם
 * המאנה, שגדלה **בין רינדורים**, ⇒ כפתור שנצבע ברינדור בלבד היה נשאר מושבת עד
 * ההטלה הבאה. ⛔ הכלל עצמו ⛔ אינו כאן — `canUseAbility` היא הפוסקת היחידה.
 */
function paintAbilities(
  els: Partial<Record<AbilityKey, HTMLButtonElement | null>>,
  state: BattleState,
  elapsedMs: number,
): void {
  for (const key of ABILITY_ORDER) {
    const el = els[key];
    if (el === null || el === undefined) continue;
    const ready = canUseAbility(state, key, elapsedMs);
    el.disabled = !ready;
    el.setAttribute('data-ready', ready ? 'true' : 'false');
  }
}
/**
 * ⛔ **הערת הבידוד ⛔ אינה אופציונלית** (אינווריאנט `37 § 13.1`), והיא מופיעה ברנדר
 * כשורה התחתונה של המסך. היא ⛔ אינה נוסח שיווקי: הלומד רשאי לדעת שקרב ⛔ אינו מזיז
 * את מנוע החזרות שלו.
 */
export const ARENA_ISOLATION_HE = 'זירת הקרב מבודדת · אין השפעה על SM-2';
/**
 * `37 § 5` — מסלול הנגישות. ⛔ נוסח ממשק ש⛔ אינו תוכן לימודי ⇒ הכרעת DEV
 * (`RULES § 0.22`), ונרשמה בסיכום הטיק.
 */
/** `37 § 6` — הרנדר מצייר «מטיל!» מעל המד (`cast_meter`), וזה גם ערוץ שאינו צבע (שכבה א׳ א2). */
const CASTING_HE = 'מטיל!';
/** 🔥 `T-434` — קוטר הכדור בפיקסלים. ⛔ צומת `fixed` חייב מידה, ⛔ והוא ⛔ אינו יורש אחת. */
const BOLT_SIZE = 26;
const CASTING_METER_HE = 'היריב מטיל';
const DODGED_HE = 'התחמקות!';
const FIRE_HE = 'שגר לחש';
const FIRE_HINT_HE = 'בחר קלף לחש כדי לשגר';
/** ⛔ זיכרון מכשיר, ⛔ ולא התקדמות למידה — ⛔ אינו נקודות, ⛔ אינו רצף, ⛔ אינו נוגע ב-`word_progress`. */
export const ARENA_TAUGHT_KEY = 'kol.arena.dragTaught';
const DRAG_HINT_HE = 'גרור קלף כלפי מעלה כדי להטיל · או הקש על קלף ואז על היריב';
/**
 * 🔥 **T-401 · `render_video_B.py:378`** — `רצף {N}`. ⛔ המילה של הרנדר, ⛔ ולא נוסח חדש.
 * ⛔ **⛔ אינו תגמול ו⛔ אינו ניקוד** (`D-050`): הוא **מונה של מה שכבר קרה בקרב הזה**,
 * מת ברגע שהקרב נגמר, ו⛔ אינו נוגע ב-`word_progress`.
 */
const STREAK_HE = 'רצף';
/**
 * 👻 T-403 — קוטר נקודת המגע של יד הרפאים, בפיקסלים. ⛔ ⛔ אינו יעד מגע (`aria-hidden`
 * ו-`pointer-events-none`) ⇒ רצפת 44px ⛔ אינה חלה עליו; זה גודל של **סמן**, והוא
 * מוצהר כאן כי ה-JS ממרכז אותו על הקלף ו⛔ אינו יכול לקרוא אותו מ-CSS.
 */
const TEACH_SIZE = 40;
/** T-220 ⓓ · D-139 — the spell that came back, revealed: «<headword> — <translation>». */
const RETURNED_HE = 'הלחש חוזר אליך';
const SAVING_HE = 'שומר את הקרב…';
const FINISHED_HE = 'הקרב נגמר';
/**
 * T-253ⓐ · D-186 — היציאה היחידה ממסך «הקרב נגמר» (שגיאת שמירה) חוזרת לטבעת,
 * ⛔ לא ל-`/cards`: הכניסה לזירה עברה בטבעת, והיציאה חייבת לחזור אליה — אותה
 * תווית ששני צמתי הטבעת האחרים כבר נושאים (`ComposeDraft.tsx` · `StoryScreen.tsx`).
 * ⛔ **הגדר:** ה-X של `topBar` (`data-arena-close`) ו-`CHOOSE_LEVEL_HE` (מסך
 * `too_small`) הם פעולות אחרות — ⛔ לא זזות.
 */
const BACK_TO_WORLD_HE = 'חזרה לעולם';
const CHOOSE_LEVEL_HE = 'בחירת רמה';
const TOO_SMALL_HE = 'ברמה הזאת עוד אין מספיק מילים לקרב.';
const LOADING_HE = 'טוען את הזירה…';
const MISSING_NUMBER_HE = '—';

const PRIMARY_ACTION_CLASS =
  'inline-flex w-full min-h-touch items-center rounded-full bg-brand-surface px-5 py-3 text-center text-lg font-semibold text-brand-on active:opacity-90';
const CLOSE_CLASS =
  'inline-grid min-h-touch min-w-touch place-items-center rounded-lg text-ink active:opacity-90';

/** `m:ss`, בדיוק כפי שהרנדר מצייר (`clock_hud`: `f"{m}:{s:02d}"`). */
function clockHe(remainingMs: number): string {
  const whole = Math.max(0, Math.ceil(remainingMs / 1000));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * ⛔ הזירה מקבלת את מילותיה מ-`mixArenaWords` ⛔ ולא מהסיבוב ישירות (T-173 · `37 § 2`).
 * ⚠️ **T-219 — שלוש הקטגוריות מגיעות עכשיו מהנתיב.** מחסן ריק ⇒ כל השאלות `base` ⇒
 * ⛔ בדיוק ההתנהגות של היום, שהיא שורה 1 בטבלה של `§ 2`.
 * ⛔ הרכיב ⛔ אינו מחליט תמהיל — הוא ממיין לשלוש רשימות ומוסר.
 */
function wordsOf(questions: readonly ArcadeQuestion[]): readonly ArenaWord[] {
  const of = (kind: ArenaWordKind): ArenaWord[] =>
    questions
      .filter((q) => (q.kind ?? 'base') === kind)
      .map((q) => ({ wordId: q.wordId, headword: q.headword, translationHe: q.answer, kind }));
  return mixArenaWords({
    known: of('known'),
    unfiltered: of('unfiltered'),
    base: of('base'),
    size: questions.length,
  });
}

export default function ArenaBattle({ initialRound, character = null, items = [] }: ArenaBattleProps = {}): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenState>(
    initialRound === undefined ? { kind: 'loading' } : { kind: 'ready', level: initialRound.level },
  );
  const [questions, setQuestions] = useState<readonly ArcadeQuestion[]>(
    initialRound === undefined ? [] : initialRound.questions,
  );
  const [battle, setBattle] = useState<BattleState | null>(
    initialRound === undefined
      ? null
      : startBattle(wordsOf(initialRound.questions), character),
  );
  /**
   * T-231 ⓐ · `apple-design` § 1 · § 11 — **פריים-הזמן ⛔ אינו נכנס ל-state.**
   * ⛔ נמדד C-0371: `setElapsedMs` בכל פריים = ~5,400 סבבי רינדור של רכיב 755 שורות
   * בקרב אחד. ⇒ `elapsedRef` הוא מקור האמת החי, ולולאת ה-rAF כותבת ישירות ל-DOM
   * (שעון · שני מדים) דרך ה-refs שמתחתיו. React state נשאר **רק** למעברים הבדידים
   * (ⓓ): שלב הטלגרף, זמן-זעם כן/לא, ו-`timeUp` (הרגע היחיד שבו תום השעון עצמו,
   * ⛔ ולא שינוי בחיים, חייב לגרום לרינדור — סיום הקרב בתום הזמן).
   */
  const elapsedRef = useRef(0);
  const [telegraphPhase, setTelegraphPhase] = useState<TelegraphPhase>('quiet');
  const [raging, setRaging] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const clockRef = useRef<HTMLParagraphElement>(null);
  const clockTextRef = useRef<HTMLSpanElement>(null);
  const castMeterWrapRef = useRef<HTMLDivElement>(null);
  const castMeterFillRef = useRef<HTMLSpanElement>(null);
  const manaTextRef = useRef<HTMLSpanElement>(null);
  const manaMeterWrapRef = useRef<HTMLDivElement>(null);
  /** ⓔ `T-397` — עשרה מקטעים, ⛔ ולא מילוי רציף אחד. הלולאה כותבת ישירות
      לכל מקטע, בדיוק כפי שכתבה קודם ל-`scaleX` היחיד: ⛔ אפס רינדורים חוזרים. */
  const manaSegRefs = useRef<(HTMLSpanElement | null)[]>([]);
  /** ⚡ T-363 — אותו טעם של `manaSegRefs`: הזמינות נכתבת בלולאה, ⛔ ולא ברינדור. */
  const abilityRefs = useRef<Partial<Record<AbilityKey, HTMLButtonElement | null>>>({});
  /** ⛔ עותק קריא-בזמן-פריים של `battle` — הלולאה צריכה `manaSpent` חי בלי לתלות בו. */
  const battleRef = useRef<BattleState | null>(battle);
  useEffect(() => { battleRef.current = battle; }, [battle]);
  const [chosenSoFar, setChosenSoFar] = useState<readonly string[]>([]);
  const [outcome, setOutcome] = useState<ResultBody | null>(null);
  const [pendingResult, setPendingResult] = useState<ResultPayload | null>(null);
  const [sendError, setSendError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const originRef = useRef<number | null>(null);
  /** ⛔ נקודת ההתחלה של מחוות הבמה. ⛔ ref ו⛔ לא state — היא ⛔ אינה משנה פיקסל. */
  const stageFrom = useRef<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  /**
   * ⛔ `prefers-reduced-motion` נקרא **אחרי** ההרכבה ו⛔ לא ברינדור: `matchMedia` ⛔ אינו
   * קיים בשרת, ורינדור ראשון שנבדל בין הצדדים הוא אזהרת hydration שהארנס סופר כשגיאה.
   * התבנית היא `components/Flashcard.tsx:65-77`, מילה במילה.
   */
  const [reducedMotion, setReducedMotion] = useState(false);
  /**
   * T-182 · `37 § 11` א1+א2 — **מתג פריים האימפקט, ⛔ ולא שעון.**
   * ⛔ שלושה ערכים ו⛔ לא בוליאן: החלפת **שם** האנימציה היא מה שמאתחל אותה בדפדפן,
   * ⇒ `a`⇄`b` מבטיחים שגם פגיעה שנייה בתוך 120ms מקבלת קיפאון משלה. `off` הוא
   * המצב שאליו `onAnimationEnd` מחזיר — ⇒ **המשך חי ב-CSS** (`--arena-hitstop-ms`)
   * ו⛔ אין ולו `setTimeout` אחד בנתיב הזה.
   */
  const [impact, setImpact] = useState<'off' | 'a' | 'b'>('off');
  /**
   * ⟦NEW 15/09 · `C-0622` · `T-358`⟧ שתי תכונות שמתחלפות `a`⇄`b` בדיוק כמו `impact`,
   * ומאותה סיבה בדיוק: **החלפת שם האנימציה היא מה שמאתחל אותה בדפדפן**, וערך זהה
   * שחוזר ⛔ אינו מפעיל אותה שוב. ⇒ שתי פגיעות ברצף מקבלות שתי אנימציות, ⛔ ולא אחת.
   * ⛔ זו ⛔ אינה כפילות — זה מנגנון האתחול, והוא כבר כתוב בקובץ הטוקנים.
   */
  const [crit, setCrit] = useState<'off' | 'a' | 'b'>('off');
  /** ⛔ ref ⛔ ולא state: הוא נקרא **בתוך** האפקט של ההטלה, ו-state כאן היה מוסיף רינדור. */
  const prevEnemyHp = useRef(ENEMY_HP);
  /**
   * 🩸 **⟦19/09 · `C-0739` · `T-440`⟧ הלומד **נרתע** כשהמכה נוחתת.**
   *
   * 🔬 **הפער, ונמדד ⛔ ולא שוער:** `grep -c prevLearnerHp` ⇒ **0**. לזירה
   * ⛔ **אין שום אות «היריב פגע בלומד»** — יש `impact` על **הטלה** שלו,
   * ‏`crit` על קריטי שלו, ו-`damage` על נזק ש**הוא** גרם. ⇒ המכה של היריב
   * נוחתת, פס החיים יורד — וה**גוף ⛔ אינו מגיב**.
   * 🔴 **וזה ⛔ אינו קישוט:** «נפגעתי» הוא הדבר היחיד שהמשחק ⛔ מעולם ⛔ לא
   * אמר לך בגוף, וזו הסיבה שהמכות מרגישות כמו מספר שמשתנה.
   *
   * ⛔ **ומראה מדויקת של `prevEnemyHp`** — אותו דפוס, אותו כיוון, ⛔ ואין
   * כאן מנגנון חדש.
   */
  const prevLearnerHp = useRef<number | null>(null);
  const [hurt, setHurt] = useState<'off' | 'a' | 'b'>('off');
  /**
   * 🤸 **⟦19/09 · `C-0741` · `T-440`ⓑ⟧ הגלגול — ו**הגוף ⛔ לא זז בו מעולם**.**
   *
   * 🔬 **נמדד:** `dodge()` מעניק חסינות, והמסך אומר «התחמקות!» ב**טקסט**.
   * ⇒ הלומד החליק, ניצל — ו⛔ **שום דבר בגוף שלו ⛔ לא הגיב**. ⛔ **ותנוחת
   * ה-`dodge` ⛔ אינה זה:** `battle.ts:479` פוסק ש-`'dodge'` היא «ההטלה
   * האחרונה הייתה **שגויה**», ⛔ ולא «התגלגלת».
   */
  const prevDodged = useRef<number | null>(null);
  const [roll, setRoll] = useState<'off' | 'a' | 'b'>('off');
  const [damage, setDamage] = useState<{ readonly amount: number; readonly key: number } | null>(null);
  /**
   * 🔴 **⟦NEW 16/09 · `C-0665` · `T-359`⟧ הקלף **עף** אל היריב, ⛔ ואינו נעלם.**
   *
   * 🔬 **הפער שנמדד:** בין היד לבין היריב ⛔ לא היה ולו פריים אחד — הקלף היה **ביד**,
   * ואז ⛔ לא היה. ‏`apple-design § 7`: «אם משהו נעלם בדרך אחת, מצפים שיופיע משם».
   *
   * ⛔ **ולמה **רפאים** ⛔ ולא אנימציה על הקלף עצמו**, וזו ⛔ אינה העדפת מימוש:
   * 🔬 נמדד — `fire` קורא ל-`cast`, היד נגזרת מהשאלה ה**נוכחית**, ⇒ הקלף
   * **מתפרק באותו רינדור**. אנימציה עליו הייתה נקטעת בפריים הראשון, בכל הטלה, תמיד.
   * ⇒ הצומת שעף הוא עותק קצר-חיים שנולד **אחרי** שהמקור ירד, ⛔ ואין ביניהם תחרות.
   *
   * ⛔ **`position: fixed` ⛔ ולא `absolute`** — הרפאים חוצה **שני** הורים עם
   * `overflow-hidden` (‏אזור הבמה והשורש), וכל אחד מהם היה גוזר אותו באמצע הדרך.
   * ⇒ קואורדינטות חלון, בדיוק כפי ששני ה-`getBoundingClientRect` מחזירים.
   */
  const [throwFx, setThrowFx] = useState<{
    readonly key: number;
    readonly label: string;
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    readonly dx: number;
    readonly dy: number;
  } | null>(null);

  /**
   * 🔥 **⟦19/09 · `C-0732` · `T-434` · `37 § 8` ק3⟧ הכדור — **הקישוט**, ⛔ ולא המידע.**
   *
   * 🔬 **הפער שנמדד:** היריב טוען 5.3 שניות, מכריז «מטיל!», המד מהבהב — ו⛔ **שום
   * דבר ⛔ אינו עף**. המכה פשוט **קורית**, ⇒ `apple-design § 7` («אם משהו נעלם
   * בדרך אחת, מצפים שיופיע משם») נשבר בכיוון ההפוך: משהו **מופיע** בלי שיצא משום מקום.
   *
   * ⛔ **⛔ טכניקה חדשה ⛔ אינה נפתחת כאן:** זה אותו דפוס בדיוק של `throwFx` —
   * צומת `position: fixed` שנושא היסט כשני משתנים ומשתחרר ב-`onAnimationEnd`.
   * ⛔ **אפס `setTimeout`** — הבדיקה אוסרת אותם בקובץ **כולו**.
   *
   * 🔴 **ואם הוא ⛔ אינו מצויר — ⛔ שום ביט של מידע ⛔ אינו הולך לאיבוד:** סימן
   * הרצפה כבר אמר לאן המכה הולכת, 300ms לפני שהכדור בכלל יצא.
   */
  const [boltFx, setBoltFx] = useState<{
    readonly key: number;
    readonly x: number;
    readonly y: number;
    readonly dx: number;
    readonly dy: number;
  } | null>(null);
  /**
   * 👻 **⟦17/09 · `C-0672` · `T-403`⟧ יד הרפאים — `37 § 5` («**גילוי:** בקרב הראשון
   * בלבד יד רפאים שמדגימה את הגרירה»). הסעיף קיים במפרט ו⛔ מעולם ⛔ לא נבנה.
   *
   * ⛔ **⛔ אינה state שני על «האם ללמד»:** השער הוא `showHint` בדיוק — אותו ביט
   * שכבר שומר על הפסקה, ⇒ ⛔ אין דרך שהתנועה תופיע בקרב שהפסקה ⛔ אינה מופיעה בו.
   * ⛔ **`fixed`, מאותה סיבה מדודה של `throwFx`:** הנתיב חוצה שני הורים עם
   * `overflow-hidden`, וכל אחד מהם היה גוזר אותו באמצע.
   */
  const [teach, setTeach] = useState<{
    readonly key: number;
    readonly x: number;
    readonly y: number;
    readonly dx: number;
    readonly dy: number;
  } | null>(null);
  /**
   * 🎭 **⟦19/09 · `C-0738` · `T-439` · סוגר את `F-305`⟧ התנוחה היא **מכה**, ⛔ ולא לבוש.**
   *
   * 🔬 **הפגם שנמדד:** `stagePhase` נגזר מה**הטלה האחרונה** ו⛔ **לעולם ⛔ אינו חוזר
   * ל-`idle`** ⇒ הטלה נכונה **אחת** והיריב עומד מוטה 3° ונדחף 0.75rem **עד סוף
   * הקרב**. ⛔ **והקובץ עצמו כבר תיעד את התוצאה** — «`hit`⇢`hit` ⛔ אינו מזיז את
   * הגוף כלל» — ⇒ הפגם היה מוכר, ומעולם ⛔ לא הוסק ממנו שהתנוחה חייבת **לחזור**.
   *
   * ⛔ **ו-`stagePhase` ⛔ לא נגעתי בו:** הליבה ממשיכה לומר «מה הייתה ההטלה
   * האחרונה» — זו עובדה נכונה. מה שהשתנה הוא שה**מסך** מתייחס אליה כאל **רגע**.
   * ⇒ ⛔ אפס שדה חדש בליבה, ⛔ אפס שעון, ⛔ ואפס מנגנון: השחרור הוא `transitionend`
   * של המעבר ש**כבר קיים** על הדמות.
   */
  const [pose, setPose] = useState<StagePhase>('idle');
  const stageAreaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  /**
   * ⛔ **הטריגר נגזר מהחוק, ⛔ ואינו מחושב כאן.** «פגיעה» היא `stagePhase(battle) === 'hit'`
   * שב-`lib/core/battle.ts`; הרכיב ⛔ אינו יודע מהי תשובה נכונה ו⛔ אינו קורא ל-`correct`.
   * ⛔ **והתחמקות ⛔ אינה אימפקט:** `dodge` היא הימנעות מנזק, ⛔ ולא לחש שנחת — א1
   * נוקב במפורש ב«קיפאון מוחלט **בפגיעה**».
   * ⛔ תחת `prefers-reduced-motion` התכונה ⛔ אינה מוצבת כלל (מחסום ⓐ מתוך שניים —
   * השני הוא בלוק ה-`@media` ב-`app/arcade/arcade-tokens.css`), והסבב נפתר בדיוק כמו קודם.
   */
  /**
   * 🩸 **`T-440` — התלות היא ב**מספר**, ⛔ ולא ב-`battle`.** המכה של היריב
   * נוחתת בתוך `tick`, כלומר בלולאת ה-rAF ⇒ ⛔ אין לה `castCount` להיתלות בו.
   * ⛔ **אבל `learnerHp` משתנה אחת-עשרה פעמים בקרב, ⛔ ולא 60 בשנייה** —
   * ‏`tick` מחזיר את **אותה הפניה** כשאף מכה לא זזה. ⇒ תלות בשדה עצמו היא
   * המעבר הבדיד המדויק.
   */
  /**
   * 🤸 `T-440`ⓑ — `null ⇢ מספר` הוא **הגלגול**. ⛔ והכיוון ההפוך ⟨`מספר ⇢ null`⟩
   * הוא **צריכת** החסינות ב-`tick`, ⇒ ⛔ אינו אירוע שרואים.
   */
  const dodgedSwing = battle?.dodgedSwing ?? null;
  useEffect(() => {
    const was = prevDodged.current;
    prevDodged.current = dodgedSwing;
    if (dodgedSwing === null || was === dodgedSwing) return;
    if (!reducedMotion) setRoll((prev) => (prev === 'a' ? 'b' : 'a'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dodgedSwing]);

  const learnerHp = battle?.learnerHp ?? null;
  useEffect(() => {
    const was = prevLearnerHp.current;
    prevLearnerHp.current = learnerHp;
    if (was === null || learnerHp === null || learnerHp >= was) return;
    // ⛔ **`'a'⇄'b'`, כמו `impact` ו-`crit`:** שם אנימציה זהה ⛔ אינו מפעיל
    //    מחדש ⇒ שתי מכות רצופות היו נראות כמכה אחת.
    if (!reducedMotion) setHurt((prev) => (prev === 'a' ? 'b' : 'a'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerHp]);

  const castCount = battle === null ? 0 : battle.casts.length;
  useEffect(() => {
    if (castCount === 0 || battle === null) return;
    // 🎭 `T-439` — ⛔ **לפני שאר הגדרים, ובכוונה:** התנוחה חלה גם על **התחמקות**
    //    (הטלה שגויה) וגם תחת `prefers-reduced-motion` — שם המעבר ממילא מתאפס
    //    ל-`0.01ms`, ⇒ היא ⛔ אינה תנועה שצריך להסיר. אימפקט, נזק ורעד שומרים
    //    את הגדרים שלהם מילה במילה.
    setPose(stagePhase(battle));
    if (reducedMotion) return;
    if (stagePhase(battle) !== 'hit') return;
    setImpact((prev) => (prev === 'a' ? 'b' : 'a'));
    // ⟦15/09 · `T-358`⟧ הנזק והרעד נגזרים מ**אותה** הטלה, ⛔ ומאותו אפקט: אפקט שני
    // על אותה תלות היה יורה בסדר שאינו מובטח, ושני מקורות לאותו רגע הם שני רגעים.
    const last = battle.casts[battle.casts.length - 1];
    if (last === undefined || !last.correct) return;
    // ⛔ הנזק נמדד מהפרש החיים בפועל, ⛔ ואינו מחושב מחדש כאן: חישוב שני של אותו
    // מספר הוא בדיוק איך שהמסך מתחיל לשקר על מה שקרה.
    const dealt = Math.max(0, prevEnemyHp.current - battle.enemyHp);
    prevEnemyHp.current = battle.enemyHp;
    if (dealt > 0) setDamage({ amount: dealt, key: battle.casts.length });
    if (last.critical) setCrit((prev) => (prev === 'a' ? 'b' : 'a'));
    // ⛔ תלות ב-`battle` **כולו** הייתה יורה בכל פריים של הלולאה: `tick` מחזיר אובייקט חדש.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castCount]);

  useEffect(() => {
    // ⛔ `try/catch`: דפדפן שחוסם אחסון ⛔ אינו מפיל את הזירה — הרמז פשוט ⛔ אינו נשמר.
    try { setShowHint(window.localStorage.getItem(ARENA_TAUGHT_KEY) !== '1'); }
    catch { setShowHint(false); }
  }, []);

  /**
   * ⛔ ההטלה חיה **במקום אחד** — שני המסלולים (`§ 5`) נכנסים לכאן, ⛔ ולא כל אחד לעצמו.
   * T-231 — הזמן הנוכחי נקרא מ-`elapsedRef` **בזמן הקריאה**, ⛔ ולא מ-state: `fire`
   * היה נבנה מחדש בכל פריים כש-`elapsedMs` היה תלות (60 סגירות חדשות בשנייה), וה-ref
   * נותן את אותו ערך חי בלי לשבור את הזהות של הפונקציה בין רינדורים.
   */
  const fire = useCallback((option: string) => {
    setSelected(null);
    setShowHint(false);
    // 👻 T-403 — ההדגמה מתה ברגע שהלומד עשה את הדבר עצמו. ⛔ ⛔ לא «אחרי שתסתיים».
    setTeach(null);
    try { window.localStorage.setItem(ARENA_TAUGHT_KEY, '1'); } catch { /* ⛔ אחסון חסום ⛔ אינו שגיאה */ }
    setChosenSoFar((prev) => [...prev, option]);
    setBattle((prev) => (prev === null ? prev : cast(prev, option, elapsedRef.current)));
  }, []);

  /**
   * ⚡ **T-363 · `37 § 4` — ההקשה מוסרת את ההכרעה ל-`spendAbility`, ⛔ ואינה מכריעה.**
   * ⛔ אין כאן «יש לי מספיק מאנה?»: ⛔ בדיקה ברכיב היא עותק שני של החוק, והשני תמיד
   * סוטה — ו-`spendAbility` מחזירה את **אותה הפניה** כשאי אפשר, ⇒ הקשה עקרה ⛔ אינה
   * מרנדרת ו⛔ אינה גובה דבר.
   * ⛔ **⛔ ואינה נוגעת ב-`selected`:** יכולת ⛔ אינה הטלה, ו-`§ 4` מפורש שמענה
   * ⛔ אינו עולה מאנה ⇒ הקלף שנבחר נשאר בדיוק כפי שהיה.
   */
  const spend = useCallback((key: AbilityKey) => {
    setBattle((prev) => (prev === null ? prev : spendAbility(prev, key, elapsedRef.current)));
  }, []);

  /**
   * ⛔ **המחסום הראשון של `prefers-reduced-motion`, והוא ⛔ אינו היחיד** (`animate` § 7):
   * כאן ⛔ אין רפאים בכלל, ובקובץ הטוקנים הכלל מנוטרל גם אם העדפה השתנתה באמצע.
   * ⛔ **וההיסט מחושב ⛔ ולא מונח:** מרכז הקלף מול פס חיי היריב — הצומת שהשורה נוקבת
   * בשמה — ושניהם נמדדים **באותו רגע**, ⇒ הם ⛔ אינם יכולים לסטות זה מזה.
   */
  const handRef = useRef<HTMLUListElement | null>(null);

  /**
   * 🔴 **⟦16/09 · `C-0665` · `T-359`⟧ ⛔ **שני** מסלולי הטלה, ⛔ ולא אחד — וזה נמדד
   * בהליכה החיה של הטיק הזה, ⛔ ולא הונח.**
   * 🔬 **המדידה:** אחרי שהרפאים נבנה על `onCast`, הליכה ב-320/375/414 שירתה דרך
   * **מסלול הנגישות** (`§ 5` — «הקשה בוחרת, הקשה על היריב משגרת») החזירה
   * `[data-arena-throw]` = **0**. ⇒ הפער שהשורה נפתחה עליו נשאר **פתוח לגמרי** על
   * המסלול שאינו גרירה, כלומר על המסלול שלומד עם מוגבלות מוטורית משתמש בו.
   * ⛔ **⇒ המקור של המלבן ⛔ אינו האירוע** (להקשה על היריב ⛔ אין מלבן של קלף) —
   * הוא הקלף ה**נבחר**, ו-`aria-pressed` הוא כבר הסימון שלו במסמך.
   */
  const selectedCardRect = useCallback((): DOMRect | null => {
    const node = handRef.current?.querySelector('[data-arena-card][aria-pressed="true"]');
    return node instanceof HTMLElement ? node.getBoundingClientRect() : null;
  }, []);

  /**
   * 👻 **T-403 — ההדגמה נמדדת מהעץ החי, ⛔ ואינה נתיב קבוע.**
   *
   * ⛔ **הקלף הראשון ביד ⇒ היריב** — בדיוק שני הצמתים ש-`launchThrow` כבר מודד,
   * ⛔ ולא שני מספרים שנבחרו. ⇒ ההדגמה מראה את **אותה** נסיעה שההטלה עצמה עושה.
   * ⛔ **`requestAnimationFrame` אחד:** `showHint` נדלק ב-`useEffect` של ה-mount,
   * ⇒ ברגע ההוא היד עדיין ⛔ אינה בעץ. ⛔ שעון ⛔ אינו נדרש — פריים אחד מספיק,
   * והוא ⛔ לא ימדוד 0×0.
   * 🔴 **⛔ ואין רפאים תחת `prefers-reduced-motion`** — ⛔ לא איטי ⛔ ולא מקוצר
   * (שורת המשימה, מפורשות). ⛔ שני מחסומים: כאן, וב-`arcade-tokens.css`.
   */
  useEffect(() => {
    if (!showHint || reducedMotion || battle === null) return undefined;
    let raf = 0;
    raf = window.requestAnimationFrame(() => {
      const card = handRef.current?.querySelector('[data-arena-card]');
      // 🎯 `C-0717` — **אותו עוגן שההטלה משתמשת בו.** יד הרפאים ⛔ אינה רשאית ללמד
      // מסלול שההטלה ⛔ אינה עושה: עד היום היא הדגימה גרירה אל **פס החיים**.
      const to = foeRect(stageAreaRef.current);
      if (!(card instanceof HTMLElement) || to === null) return;
      const from = card.getBoundingClientRect();
      if (from.width === 0) return;
      setTeach({
        key: Date.now(),
        x: from.left + from.width / 2 - TEACH_SIZE / 2,
        y: from.top + from.height / 2 - TEACH_SIZE / 2,
        dx: to.left + to.width / 2 - (from.left + from.width / 2),
        dy: to.top + to.height / 2 - (from.top + from.height / 2),
      });
    });
    return () => window.cancelAnimationFrame(raf);
    // ⛔ `battle` כולו היה יורה בכל פריים של הלולאה; מה שמעניין הוא **שיש** קרב.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHint, reducedMotion, battle === null]);

  /**
   * 👻 **T-403 — המגע הראשון עוצר, ⛔ ולא «הקלקה על הקלף הנכון».**
   * ⛔ `pointerdown` על החלון ⇒ **כל** נגיעה מבטלת מייד, כולל גרירה שנקטעה וכולל
   * מגע במקום ריק. ⛔ הדגמה שממשיכה לרוץ בזמן שהאצבע כבר על המסך מתחרה בלומד.
   * ⛔ `once: true` ⇒ ⛔ אין מאזין ששורד את ההדגמה.
   */
  useEffect(() => {
    if (teach === null) return undefined;
    const stop = () => setTeach(null);
    window.addEventListener('pointerdown', stop, { once: true });
    return () => window.removeEventListener('pointerdown', stop);
  }, [teach]);

  /**
   * 🔥 **`T-434` — הכדור נמדד מ**שני הצמתים החיים**, ⛔ ולא ממספרים.**
   *
   * ⛔ **`heroRect` ⛔ ולא החריץ:** החריץ הוא `inset-x-0` ⇒ מרכזו הוא מרכז הבמה,
   * וכדור שהיה מכוון אליו היה טס לאותו מקום **בכל נתיב** — כלומר היה מציג שקר.
   * 🔴 **המחסום הראשון מתוך שניים** ⟨`animate` § 7⟩: תחת תנועה מופחתת ⛔ הצומת
   * ⛔ אפילו ⛔ אינו נולד. השני הוא `display: none` ב-`arcade-tokens.css`, והוא
   * ⛔ אינו מיותר — הוא מה שתופס שינוי העדפה **באמצע** קרב.
   */
  const launchBolt = useCallback(() => {
    if (reducedMotion) return;
    const area = stageAreaRef.current;
    if (area === null) return;
    const from = foeRect(area);
    const to = heroRect(area);
    if (from === null || to === null) return;
    setBoltFx({
      key: Date.now(),
      x: from.left + from.width / 2 - BOLT_SIZE / 2,
      y: from.top + from.height / 2 - BOLT_SIZE / 2,
      dx: (to.left + to.width / 2) - (from.left + from.width / 2),
      dy: (to.top + to.height / 2) - (from.top + from.height / 2),
    });
  }, [reducedMotion]);
  /* ⛔ **רף, ⛔ ולא תלות בלולאה:** הוספת `launchBolt` לרשימת התלויות של לולאת ה-rAF
     הייתה **מפרקת ומרכיבה** אותה בכל שינוי העדפת תנועה, ו-`lastPhase` היה נדרך
     מחדש — כלומר מעבר שלם היה נבלע. ⇒ הלולאה קוראת את ה**עדכני**, ⛔ ולא את
     מה שנסגר בסגירה שלה. */
  const launchBoltRef = useRef(launchBolt);
  launchBoltRef.current = launchBolt;

  const launchThrow = useCallback((label: string, from: DOMRect) => {
    if (reducedMotion) return;
    const area = stageAreaRef.current;
    if (area === null) return;
    // 🎯 **⟦18/09 · `C-0717`⟧ היעד הוא **היריב**, ⛔ ולא פס החיים שמעליו.**
    // 🔬 נמדד ב-393×852: `[data-arena-enemy]` (הלוח) יושב על `cy 206 · cx 272`
    // בעוד `[data-arena-figure=enemy]` (הדמות) על `cy 283 · cx 197` ⇒ **77px אנכית
    // ו-75px אופקית** של פער. ⇒ עד היום הקלף עף אל **מד החיים**, וזה ⛔ לא היה נראה
    // רק מפני שהגרירה ⛔ מעולם לא עשתה יותר מ-60px ולא הצביעה לשום מקום.
    // ⛔ **והמסלול חייב להיות אחד** עם הגרירה: «דבר שיוצא בדרך אחת — מצפים שיחזור בה».
    const to = foeRect(area);
    if (to === null) return;
    setThrowFx({
      key: Date.now(),
      label,
      x: from.left,
      y: from.top,
      w: from.width,
      h: from.height,
      dx: (to.left + to.width / 2) - (from.left + from.width / 2),
      dy: (to.top + to.height / 2) - (from.top + from.height / 2),
    });
  }, [reducedMotion]);

  const load = useCallback(async () => {
    setScreen({ kind: 'loading' });
    try {
      const body = await apiGet<RoundBody>('/api/arcade/round');
      if (!body.ok) {
        if (body.code === 'session_expired') setScreen({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setScreen({ kind: 'schema_missing' });
        else setScreen({ kind: 'error' });
        return;
      }
      if (body.round === null) {
        setScreen({
          kind: 'too_small',
          eligible: body.eligible ?? null,
          required: body.required ?? null,
        });
        return;
      }
      // T-267 · **נמדד חי, ⛔ ולא שוער** (Playwright, `round.questions` שאינו מערך): החוזה
      // הטיפוסי של `RoundBody` הוא בדיקת קומפילציה בלבד — תשובת רשת אמיתית שאינה תואמת
      // אותו (קאש ישן, פרוקסי שמסלף, שינוי חוזה עתידי) עוברת בשקט ומגיעה ל-`.map` למטה.
      // ⛔ בלי השומר הזה זו קריסה שמגיעה ל-`app/error.tsx` (נצפה ונרשם ליומן שם, אותו
      // טיק) — עם השומר היא אותו מסך כשל קיים שכל כשל-רשת אחר כבר מקבל, ⛔ ולא חדש.
      if (!Array.isArray(body.round.questions)) {
        setScreen({ kind: 'error' });
        return;
      }
      setQuestions(body.round.questions);
      setBattle(startBattle(wordsOf(body.round.questions), character));
      originRef.current = null;
      elapsedRef.current = 0;
      setTelegraphPhase('quiet');
      setRaging(false);
      setTimeUp(false);
      setScreen({ kind: 'ready', level: body.band });
    } catch {
      setScreen({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    if (initialRound !== undefined) return;
    void load();
  }, [initialRound, load]);

  /**
   * ⛔ **הלולאה היחידה, והיא כאן ⛔ ולא בליבה** (D-126 § ג׳). היא ⛔ אינה מחשבת דבר:
   * היא מודדת כמה זמן עבר ומוסרת את המספר ל-`tick`, שהוא **אידמפוטנטי ביחס לשעון** —
   * ‏60 קריאות בשנייה ⛔ אינן 60 מכות.
   * ⛔ היא נעצרת כשהקרב נגמר: לולאה שממשיכה לרוץ על מסך תוצאות היא סוללה שנשרפת בשקט.
   *
   * T-231 · `apple-design` § 1 · § 11 — **הפריים כותב ל-DOM, ⛔ ולא ל-state, וגורם
   * לרינדור רק במעבר בדיד.** ⓐ השעון ומד הטלגרף עוברים דרך `ref.current.style` /
   * ‏`textContent` — כתיבה ל-DOM היא לא-רינדור. ⓑ `setBattle` נשאר updater פונקציונלי:
   * ‏`tick` מחזירה עכשיו **את אותה הפניה** כשלא זזה מכה (`battle.test.ts` T-231 ⓒ),
   * ו-React בולם רינדור על `Object.is` זהה — ⇒ בלי שינוי כאן. ⓒ `telegraph.phase` /
   * `raging` נכנסים ל-state **רק כשהערך עצמו השתנה**, ⛔ לא בכל פריים — הם המעברים
   * הבדידים (ⓓ). ⓓ `timeUp` הוא state שנדלק **פעם אחת** ברגע ש-`BATTLE_MS` חלף, כדי
   * שסיום קרב **על השעון בלבד** (⛔ בלי שינוי חיים) עדיין יגרום לרינדור שמפיל את
   * `finished`.
   */
  useEffect(() => {
    if (battle === null || screen.kind !== 'ready') return;
    let frame = 0;
    let stopped = false;
    let lastPhase: TelegraphPhase = telegraphAt(elapsedRef.current).phase;
    let lastRaging = isRage(elapsedRef.current);
    let lastTimeUp = elapsedRef.current >= BATTLE_MS;
    let lastClockText = '';
    let lastMana = -1;
    let lastFrozen = false;
    const step = (now: number) => {
      if (originRef.current === null) originRef.current = now;
      const next = now - originRef.current;
      elapsedRef.current = next;

      setBattle((prev) => (prev === null ? prev : tick(prev, next)));

      const telegraph = telegraphAt(next);
      if (telegraph.phase !== lastPhase) {
        lastPhase = telegraph.phase;
        setTelegraphPhase(telegraph.phase);
        /* 🔥 **`T-434` — הכדור יוצא ברגע שההתחמקות ⛔ אינה אפשרית עוד.**
           ⛔ **`committed` ⛔ ולא `window`, וזה נגזר ⛔ ולא נבחר:** `§ 6` סוגר את
           החלון ב-5.7 שניות והמכה נוחתת ב-6.0 ⇒ **300ms**, שהם `--arena-bolt-ms`
           בדיוק. כדור שהיה יוצא בחלון היה מבטיח פגיעה שעוד אפשר לבטל.
           ⛔ **והוא נתלה על מעבר בדיד** ⇒ ⛔ אינו נורה פעמיים, ⛔ ובלי שעון. */
        if (telegraph.phase === 'committed') launchBoltRef.current();
      }

      const nowRaging = isRage(next);
      if (nowRaging !== lastRaging) {
        lastRaging = nowRaging;
        setRaging(nowRaging);
      }

      const nowTimeUp = next >= BATTLE_MS;
      if (nowTimeUp !== lastTimeUp) {
        lastTimeUp = nowTimeUp;
        setTimeUp(nowTimeUp);
      }

      // ⓐ השעון — DOM ישיר, כתיבה רק כשהטקסט המוצג באמת השתנה (פעם בשנייה לכל היותר).
      const clockText = clockHe(BATTLE_MS - next);
      if (clockText !== lastClockText) {
        lastClockText = clockText;
        if (clockRef.current !== null) clockRef.current.setAttribute('aria-label', `${CLOCK_HE} ${clockText}`);
        if (clockTextRef.current !== null) clockTextRef.current.textContent = clockText;
      }

      // ⓑ מד הטלגרף — `transform: scaleX`, נכתב כל פריים (הרמפה חייבת להיות חלקה).
      const fillEl = castMeterFillRef.current;
      if (fillEl !== null) fillEl.style.transform = `scaleX(${telegraph.frac})`;
      const wrapEl = castMeterWrapRef.current;
      if (wrapEl !== null) {
        wrapEl.setAttribute('aria-label', `${CASTING_METER_HE} ${Math.round(telegraph.frac * 100)} אחוז`);
      }

      // ⓔ מד המאנה — נגזר מ-`elapsedRef` + `battleRef`, נכתב רק כשהערך השלם השתנה.
      const currentBattle = battleRef.current;
      if (currentBattle !== null) {
        const mana = manaAt(next, currentBattle.manaSpent);
        // ⚡ T-363 — ההקפאה נגמרת **מעצמה עם השעון**, ⛔ בלי שהמאנה תזוז ו⛔ בלי רינדור
        // ⇒ שני טריגרים, ⛔ ולא אחד. בלי השני, כפתור `הקפאה` היה נשאר מושבת אחרי שהיריב
        // כבר הפשיר.
        const nowFrozen = isFrozen(currentBattle, next);
        if (mana !== lastMana || nowFrozen !== lastFrozen) {
          lastFrozen = nowFrozen;
          paintAbilities(abilityRefs.current, currentBattle, next);
        }
        if (mana !== lastMana) {
          lastMana = mana;
          if (manaTextRef.current !== null) manaTextRef.current.textContent = `${mana} / ${MANA_CAP}`;
          paintManaSegments(manaSegRefs.current, mana, nowRaging);
          const manaWrap = manaMeterWrapRef.current;
          if (manaWrap !== null) {
            manaWrap.setAttribute('aria-label', `${nowRaging ? RAGE_HE : MANA_HE} ${mana} מתוך ${MANA_CAP}`);
          }
        }
      }

      if (!stopped) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
    };
    // ⛔ תלות ב-`battle` **כולו** הייתה מפרקת ומרכיבה את הלולאה בכל פריים.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle === null, screen.kind]);

  const send = useCallback(async (payload: ResultPayload) => {
    setSendError('');
    try {
      const body = await apiPost<ResultBody>('/api/arcade/result', payload);
      if (body.ok) {
        setPendingResult(null);
        setOutcome(body);
        return;
      }
      if (body.code === 'session_expired') {
        setScreen({ kind: 'session_expired' });
        return;
      }
      if (body.code === 'schema_missing') {
        setScreen({ kind: 'schema_missing' });
        return;
      }
      setPendingResult(payload);
      setSendError(FAILURE_HE.save);
    } catch {
      setPendingResult(payload);
      setSendError(FAILURE_HE.offline);
    }
  }, []);

  /**
   * T-231 ⓓ — `elapsedRef` ⛔ אינו state, ⇒ `outcomeAt` צריכה נקודת רינדור מובטחת
   * ברגע ש-`BATTLE_MS` חלף גם כשאף חיים לא זזו. `timeUp` (state בדיד) הוא בדיוק זה:
   * לפניו `outcomeAt` נשענת רק על הענפים המידיים (חיים ≤0), ואחריו הזמן הנמסר הוא
   * ‏`BATTLE_MS` עצמו — בדיוק הגבול ש-`outcomeAt` בודקת.
   */
  const ending =
    battle === null ? null : endingOf(battle, timeUp ? BATTLE_MS : elapsedRef.current);
  const finished = ending !== null;

  /**
   * ⛔ חיפוש לפי `wordId` ⛔ ולא לפי אינדקס (T-219): `mixArenaWords` **משנה סדר**, ולכן
   * `questions[battle.index]` היה מגיש את ארבע האפשרויות של מילה **אחרת**.
   */
  const byWordId = useMemo(
    () => new Map(questions.map((q) => [q.wordId, q])),
    [questions],
  );

  useEffect(() => {
    if (battle === null || !finished || submitted) return;
    setSubmitted(true);
    // ⛔ החוזה של `POST /api/arcade/result` ⛔ לא השתנה בפרוסה הזאת: `ArcadeAnswer` נושא
    // `chosen` ו-`answer`, ולכן ההצלבה נעשית כאן מול השאלות שכבר בידנו.
    const answers: readonly ArcadeAnswer[] = battle.casts.map((c, i) => ({
      wordId: c.wordId,
      correct: c.correct,
      chosen: chosenSoFar[i] ?? '',
      // ⛔ לפי `wordId` ⛔ ולא לפי מיקום (T-219): `mixArenaWords` משנה סדר, ו-`cast` יכול
      // להוסיף מילה חוזרת לזנב ⇒ `words[i]` ⛔ אינו עוד המילה שנוצקה בהטלה ה-i.
      answer: byWordId.get(c.wordId)?.answer ?? '',
    }));
    void send({ runId: crypto.randomUUID(), answers });
  }, [battle, finished, submitted, chosenSoFar, send, byWordId]);

  useEffect(() => {
    if (pendingResult === null) return;
    const retry = () => {
      void send(pendingResult);
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [pendingResult, send]);

  const again = useCallback(() => {
    setOutcome(null);
    setPendingResult(null);
    setSendError('');
    setSubmitted(false);
    setChosenSoFar([]);
    originRef.current = null;
    elapsedRef.current = 0;
    setTelegraphPhase('quiet');
    setRaging(false);
    setTimeUp(false);
    if (initialRound !== undefined) {
      setQuestions(initialRound.questions);
      setBattle(startBattle(wordsOf(initialRound.questions), character));
      setScreen({ kind: 'ready', level: initialRound.level });
      return;
    }
    setBattle(null);
    void load();
  }, [initialRound, load]);

  const topBar = (heading: string | null) => (
    <div className="flex flex-row items-center justify-between gap-3">
      {heading === null ? (
        <span aria-hidden />
      ) : (
        <h1 className="text-3xl font-bold leading-tight">{heading}</h1>
      )}
      <Link data-arena-close href="/cards" className={CLOSE_CLASS}>
        <CloseIcon />
        <span className="sr-only">{CLOSE_HE}</span>
      </Link>
    </div>
  );

  /**
   * T-231 ⓔ — ערך **הפתיחה** בלבד (רינדור ראשון של הקרב, ורינדורים על מעברים בדידים
   * כמו `cast`). ⛔ אינו `useMemo` על `elapsedMs` — אין יותר state כזה; העדכון הרציף
   * בין רינדורים חי בכתיבת ה-ref שבלולאת ה-rAF (`manaTextRef` / `manaSegRefs`).
   */
  const mana = battle === null ? 0 : manaAt(elapsedRef.current, battle.manaSpent);

  /**
   * ⚡ T-363 — **נגזר, ⛔ ולא שדה.** שלושת האפקטים כבר נקראים מהמצב (`pendingDouble` ·
   * `immuneBy` · `isFrozen`), ⇒ רשימה שנשמרת בנפרד הייתה מקור אמת שני שיכול לסטות.
   * ⛔ ‏`elapsedRef` נקרא כאן כערך **פתיחה** בלבד, בדיוק כמו `mana` שמעליו: את השינוי
   * הרציף עושה הלולאה, והשלושה האלה משתנים בקומיטים בדידים ש**כן** מרנדרים.
   */
  const activeAbilities: readonly AbilityKey[] =
    battle === null
      ? []
      : ABILITY_ORDER.filter((key) =>
          key === 'double'
            ? battle.pendingDouble
            : key === 'shield'
              ? battle.immuneBy === 'shield'
              : isFrozen(battle, elapsedRef.current),
        );

  if (screen.kind === 'loading') {
    return (
      <section className="flex h-[calc(100dvh-5.25rem)] flex-col gap-6 overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {topBar(null)}
        <div className="flex flex-col gap-3" data-skeleton>
          <p className="sr-only" role="status">
            {LOADING_HE}
          </p>
          <div aria-hidden className="h-8 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-20 w-2/3 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-32 rounded-lg bg-surface-raised" />
        </div>
      </section>
    );
  }

  if (screen.kind !== 'ready' || battle === null) {
    const message =
      screen.kind === 'too_small'
        ? TOO_SMALL_HE
        : screen.kind === 'schema_missing'
          ? SCHEMA_MISSING_HE
          : FAILURE_HE.load;
    return (
      <section className="flex h-[calc(100dvh-5.25rem)] flex-col gap-4 overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {topBar(CLOCK_HE)}
        <p className="text-lg leading-relaxed text-ink">{message}</p>
        {screen.kind === 'too_small' && (
          <p className="text-lg leading-relaxed text-ink-muted">
            {`נדרשות ${screen.required ?? MISSING_NUMBER_HE} מילים ברמה, יש ${screen.eligible ?? MISSING_NUMBER_HE}`}
          </p>
        )}
        <ActionBar>
          {screen.kind === 'session_expired' ? (
            <a href="/login" data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
              {SIGN_IN_AGAIN_HE}
            </a>
          ) : screen.kind === 'too_small' ? (
            <Link href="/cards" data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
              {CHOOSE_LEVEL_HE}
            </Link>
          ) : (
            <button
              type="button"
              data-primary-action="true"
              className={PRIMARY_ACTION_CLASS}
              onClick={() => void load()}
            >
              {RETRY_HE}
            </button>
          )}
        </ActionBar>
      </section>
    );
  }

  if (finished) {
    if (outcome !== null && outcome.ok) {
      const headwords = new Map<string, string>(
        battle.words.map((w) => [w.wordId, w.headword] as const),
      );
      const missed: readonly ArenaMissed[] = outcome.missed.map((row) => ({
        wordId: row.wordId,
        headword: headwords.get(row.wordId) ?? row.wordId,
        answer: row.answer,
        chosen: row.chosen,
      }));
      return (
        <>
          {/* T-180 · `37 § 10` — הסיכום המדוד של הקרב, מעל מסך הסיום הקיים.
              ⛔ `<ArenaResult>` ⛔ אינו נמחק בפרוסה הזאת: הוא נושא את לוח הפריט שנפתח,
              ⛔ ואין לו מחליף עדיין (§ 7 של תוכנית פרוסה C). ⛔ הסיכום ⛔ אינו מחשב כאן —
              `summarize` הוא `lib/core` טהור. */}
          <ArenaSummary
            ending={ending}
            summary={summarize(battle.casts)}
            headwords={Object.fromEntries(headwords)}
            onBack={again}
          />
          <ArenaResult
            enemyDefeated={outcome.enemyDefeated}
            unlocked={outcome.unlocked}
            items={outcome.unlocked === null ? [] : [outcome.unlocked]}
            missed={missed}
            onAgain={again}
          />
        </>
      );
    }
    return (
      <section className="flex h-[calc(100dvh-5.25rem)] flex-col gap-4 overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {topBar(outcome === null && sendError === '' ? SAVING_HE : FINISHED_HE)}
        {sendError !== '' && (
          <p role="status" className="text-base text-danger">
            {sendError}
          </p>
        )}
        <ActionBar>
          <div className="flex flex-col gap-3">
            {pendingResult !== null && (
              <button
                type="button"
                className={PRIMARY_ACTION_CLASS}
                onClick={() => void send(pendingResult)}
              >
                {RETRY_HE}
              </button>
            )}
            <Link href="/world" data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
              {BACK_TO_WORLD_HE}
            </Link>
          </div>
        </ActionBar>
      </section>
    );
  }

  const word = battle.words[battle.index];
  const hand = word === undefined ? [] : byWordId.get(word.wordId)?.options ?? [];
  // T-220 ⓓ — derived from the battle, ⛔ not a second state: it is non-null exactly while
  // the last cast missed an `unfiltered` word, and the next cast clears it.
  const returned = returnedSpell(battle);
  // 🔥 T-401 — נגזר מהמנוע הטהור (`streakAt`), ⛔ ולא state שני שיכול לסטות ממנו.
  const streak = streakAt(battle);
  const enemyPct = Math.round((battle.enemyHp / Math.max(1, battle.enemyHpMax)) * 100);
  /* 🩸 `T-436` — **אחוז, ⛔ ולא HP גולמי**, בדיוק כמו של היריב: שני מדים בשתי
     סקאלות שונות ⛔ אינם ניתנים להשוואה במבט, וזה כל מה שמד חיים אמור לאפשר. */
  const learnerPct = Math.round((battle.learnerHp / Math.max(1, battle.learnerHpMax)) * 100);
  /**
   * ⛔ **מגיע** מהשכבה הטהורה — הרכיב ⛔ אינו סופר 5.3, ⛔ אינו סופר 5.7 ו⛔ אינו יודע מהו
   * חלון. T-231 ⓓ — `raging` ו-`telegraphPhase` הם עכשיו ה-state (מוגדר למעלה), ומתעדכנים
   * רק כשהערך הבדיד עצמו משתנה. `telegraphFrac` הוא ערך **פתיחה** בלבד, בדיוק כמו `mana`
   * למעלה — העדכון הרציף חי בכתיבת ה-ref שבלולאת ה-rAF.
   */
  const telegraphFrac = telegraphAt(elapsedRef.current).frac;
  const aimSwing = telegraphAt(elapsedRef.current).swingIndex;
  const aimed = telegraphPhase === 'window' || telegraphPhase === 'committed';

  return (
    <section
      data-arena-scope
      /* 🔴 **⟦NEW 15/09 · `C-0622` · `F-260`⟧ הקרב **נכנס למסך**, ⛔ ואינו נגלל.
         זו התקלה שמאחורי הדיווח של רוי, ⛔ והיא חמורה מהתסמין שהוא תיאר.**

         🔬 **נמדד בדפדפן בארבעה רוחבים, ⛔ ולא הוסק מהקוד:**
         ```
         320×568   מסמך 976  ⇒ 🔴 גלילה 408px · הקלפים 232px **מתחת לקפל**
         375×667   מסמך 976  ⇒ 🔴 גלילה 309px · הקלפים 133px **מתחת לקפל**
         390×844   מסמך 960  ⇒ 🔴 גלילה 116px
         414×896   מסמך 980  ⇒ 🔴 גלילה  84px
         ```
         ⇒ **בשני גדלי הטלפון הנפוצים ביותר ארבעת קלפי הלחש ⛔ אינם על המסך בכלל.**
         הלומד רואה מילה גדולה ו⛔ אין לו במה לענות עליה בלי לגלול — ובזירה שיש בה
         שעון של 90 שניות, גלילה ⛔ אינה «אי-נוחות», היא **הפסד**.

         🔬 **והחשבון פשוט:** `min-h-[100dvh]` **ועוד** `pb-28` (‏112px) **ועוד** `gap-4`
         שש פעמים (‏96px) ⇒ הקטע גבוה מהמסך **בהגדרה**, לפני שנספר ולו ילד אחד.
         ⛔ ו-`pb-28` ⛔ לא ניקה כלום: ל-`/arcade` ⛔ אין סרגל לשוניות (נמדד — חמישה
         לחיצים, כולם של הזירה). זה ריפוד שנשאר ממסך אחר.

         ⇒ `h-[calc(100dvh-5.25rem)]` **מדויק** ⛔ ולא מינימום · `overflow-hidden` ⇒
         גלילה ⛔ אינה אפשרות · הריפוד התחתון הוא **בטיחות המכשיר בלבד** · והבמה
         (`flex-1 min-h-0`) היא מי שבולעת את מה שנשאר.

         🔬 **ו-5.25rem ⛔ אינם מספר יפה — הם נמדדו בשרשרת ההורים:** הכותרת של הפריסה
         השורשית **52px** ועוד `pb-32` של `<main>` **32px** = **84px = 5.25rem**, וזה
         בדיוק פער הגלישה הקבוע שנמדד בארבעת הרוחבים אחרי שהקטע כבר תוקן.
         📎 **וזה התקדים של הריפו עצמו, ⛔ ולא המצאה:** `CardDeck.tsx` מחזיק
         `h-[calc(100dvh-10rem)]` על אותו היגיון בדיוק — שם הכרום כולל גם סרגל
         לשוניות, וכאן ⛔ אין אחד (‏`/arcade` יושב מחוץ ל-`app/(tabs)/`, בכוונה). */
      /* 🎬 **⟦17/09 · `C-0709` · `T-423`ⓑ · `36 § 8.0` הכרעה ②⟧ — `100dvh` **מלא**,
         ⛔ ואפס `gap`.

         🔬 **שני השינויים הם אותה מדידה, ⛔ ולא שניים:** `arcade-tokens.css` מוריד
         עכשיו את `<header>` (52) ואת `pb-8` של `<main>` (32) בכל מסמך שנושא
         `data-arena-scope` ⇒ ה-84 ש-`5.25rem` ניכה ⛔ אינם קיימים עוד, וניכוי שלהם
         היה משאיר **84px של כלום** בתחתית (זה `F-284`).

         ⛔ **ו-`gap-0` ⛔ אינו ויתור על מרווח — הוא מה שמאפשר לסכום להסתכם.** שמונת
         המספרים של `36 § 8.0` ② נקראו מ-Figma (`3316:2`) כ**קואורדינטות**, ⛔ ולא
         כגבהים עם אוויר ביניהם: `0 · 56 · 166 · 496 · 540 · 568 · 764 · 832` ⇒ כל
         רצועה מתחילה בדיוק היכן שקודמתה נגמרה. ‏`gap-2` היה מוסיף 48px שאין להם מקום
         בתקציב, והם היו נגרעים מהבמה. ⇒ **המרווח חי בתוך הרצועה**, ⛔ ולא בינה לבין
         שכנתה.

         ⛔ **והריפוד התחתון הוא בטיחות מכשיר ⛔ ולבד** — הרצועה התחתונה (20) היא
         הערת הבידוד עצמה. ‏`env(safe-area-inset-bottom)` הוא **0** בדפדפן שאין לו
         מגרעת, ⇒ הסכום מסתכם שם בדיוק ל-852; במכשיר עם מגרעת הוא נגרע מהבמה
         (`flex-1`), ⛔ ולא גולש. */
      className="relative flex h-[100dvh] flex-col gap-0 overflow-hidden pb-[env(safe-area-inset-bottom)]"
    >
      {/* 🔴 **⟦15/09 · `C-0623` · `T-361`⟧ היציאה **מרחפת**, ⛔ ואינה שורה משלה.**
          🔬 נמדד: העמודה חילקה 580px כך שהבמה — הקרב עצמו — קיבלה **52px, 9% מהמסך**,
          בעוד ה-X לבדו אכל 44 ועוד רווח. ⇒ ברנדר (`kol-B-03`) כפתור ההשהיה **מרחף
          מעל הזירה**, ⛔ ואינו תופס שורה. ⛔ יעד המגע ⛔ לא רוכך — `CLOSE_CLASS` עדיין
          נושא את מידותיו, והוא רק יצא מזרימת העמודה. */}
      {/* ⟦17/09 · `C-0707` · `T-423`ⓐ⟧ `end-6` ⛔ ולא `end-0`, וזה **תיקון של מה שהמלוא-רוחב
          היה מזיז**, ⛔ ולא העדפה: `absolute` נמדד מול **תיבת הריפוד** של המקטע, והמקטע
          קיבל עכשיו `padding-inline: 1.5rem` (`arcade-tokens.css`). ⇒ `end-0` היה מצמיד
          את ה-X לקצה הפיזי של המסך — 24px משמאל למקום שבו הוא נמדד עד היום — ומכניס יעד
          44px לפינה שבה האגודל פוגש את מסגרת המכשיר. `end-6` מחזיר אותו **בדיוק** לאותו
          פיקסל שבו ישב לפני השינוי. */}
      <div className="absolute end-6 top-0 z-10">
        <Link data-arena-close href="/cards" className={CLOSE_CLASS}>
          <CloseIcon />
          <span className="sr-only">{CLOSE_HE}</span>
        </Link>
      </div>

      {/* ⓐ השעון — `זמן קרב m:ss`. ⛔ **שעון אחד לקרב שלם** (`37 § 3`), ⛔ ולא טיימר
          לשאלה: טיימר לשאלה הופך אחזור מאומץ למרוץ ומעניש בדיוק את הלומד האיטי
          שהזירה אמורה לאמן. הערך מגיע מ-`BATTLE_MS` ⛔ ואינו נספר כאן. */}
      {/* ⛔ שורה אחת, ⛔ ולא שתיים. 🔬 נמדד: התווית והמספר אכלו 60px מתוך 580, בזמן
          שהבמה קיבלה 216. ⇒ אותו מידע, חצי מהגובה. */}
      {/* ⟦17/09 · `C-0709` · `T-423`ⓑ⟧ `top-bar` — **56px מוצהרים** (`3316:3`).
          ⛔ העטיפה נושאת את הגובה, והשורה הפנימית נשארת `items-baseline`: קו הבסיס
          הוא מה שמיישר תווית `text-sm` למספר `text-2xl`, ו-`items-center` היה מזיז
          את שניהם זה ביחס לזה. ⇒ **מרכוז אנכי בחוץ, קו בסיס בפנים.** */}
      <div className="relative flex h-[56px] shrink-0 flex-row items-center justify-center" data-arena-clock>
        <div className="flex flex-row items-baseline justify-center gap-2">
        <p className="text-sm font-bold text-[color:var(--arena-gold)]">{CLOCK_HE}</p>
        {/* T-231 ⓐ — הטקסט וה-`aria-label` נכתבים מהלולאה דרך `clockRef`/`clockTextRef`;
            ⛔ ה-ref יושב על `<span>` **בתוך** `<EnWord>`, ⛔ ולא על העטיפה עצמה — `EnWord`
            אינו מעביר `ref` הלאה, וזו הדרך היחידה לכתוב טקסט בלי לפרק את שלוש תכונות
            ה-bidi שהעטיפה קובעת פנימה (T-009). ערך הפתיחה כאן הוא רינדור ראשון בלבד. */}
        <p
          ref={clockRef}
          /* ⟦15/09 · `F-260`⟧ `text-3xl` ב-320/375 ו-`text-4xl` מ-`sm` ומעלה: 36px של
             שעון על מסך בגובה 568 הם 6% מהמסך שנלקחים מאזור המשחק. */
          className="text-2xl font-black tabular-nums text-[color:var(--arena-ink)] sm:text-3xl"
          role="timer"
          aria-label={`${CLOCK_HE} ${clockHe(BATTLE_MS - elapsedRef.current)}`}
        >
          <EnWord>
            <span ref={clockTextRef}>{clockHe(BATTLE_MS - elapsedRef.current)}</span>
          </EnWord>
        </p>
        </div>

        {/* 🔥 **⟦17/09 · `C-0672` · `T-401`⟧ שבב הרצף — `:372-378` של `clock_hud`.**

            🔬 **הפער, נמדד ⛔ ולא שוער:** `grep -c streak lib/core/battle.ts
            components/ArenaBattle.tsx` ⇒ **0 · 0**. הרצף היה קיים במנוע (`state.casts`)
            והגיע ללומד ⛔ רק במסך הסיכום — כלומר **אחרי** שכבר אי אפשר לעשות איתו דבר.

            ⛔ **`absolute` ⛔ ולא ילד שלישי בזרימה, וזו מדידה:** הקטע כולו הוא
            `h-[calc(100dvh-5.25rem)] overflow-hidden` (‏`T-350`) ⇒ **כל** פיקסל שנוסף
            לשורה כאן נגרע מהבמה, שכבר נמדדה ב-52px פעם אחת. ⛔ שבב מרחף ⛔ אינו מוסיף
            ולו פיקסל אחד לגובה השורה. ⛔ **ו-`start-0` הוא הקצה של הרנדר** — `:375`
            מצייר ב-`LW - 20 - cw`, כלומר הקצה שבעברית הוא **תחילת** השורה, והיציאה
            (`data-arena-close`) יושבת ב-`end-0` ממול.

            ⛔ **המצב ⛔ לעולם אינו בצבע בלבד** (שכבה א׳ א2): **המספר עצמו** הוא הערוץ —
            `רצף 3` אומר «שלוש» בלי שום קשר לגוון, והזהב הוא **הערוץ השני**, ⛔ לא היחיד.
            ⛔ **ו-`N = 0` ⛔ אינו מצויר כלל** (‏`:374` — `if streak > 0`): שבב שמראה אפס
            הוא ענישה על טעות, וזו ⛔ אינה הזירה הזאת. */}
        {streak > 0 && (
          <span
            data-arena-streak
            data-arena-streak-hot={streak >= STREAK_HOT ? 'on' : 'off'}
            className={[
              'absolute start-0 top-1/2 flex h-[30px] -translate-y-1/2 items-center gap-1',
              /* ⚠️ **שכבה א׳ גוברת על הרנדר, ובמספר** (`36 § 14.4`, ההחרגה היחידה):
                 `:378` נוקב ב-**11.5px**, ורצפת `§ א9` היא **12** ⇒ `text-xs`. ⛔ אותה
                 סטייה בדיוק ש-`D-137` כבר רשם על שורות ההטיה (10.5 ⇒ 12), ⛔ ולא חדשה.
                 ‏`check:text-floor` האדים על 11.5 בטיק הזה — ⇒ נמדד, ⛔ לא נזכר. */
              'rounded-full border px-3 text-xs font-bold leading-none',
              streak >= STREAK_HOT
                ? 'border-[color:var(--arena-gold-light)] bg-[color:var(--arena-streak-hot)] text-[color:var(--arena-gold-light)]'
                : 'border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] text-[color:var(--arena-ink-dim)]',
            ].join(' ')}
          >
            {STREAK_HE}
            <span dir="ltr" className="tabular-nums">{streak}</span>
          </span>
        )}
      </div>

      {/* ⓑ באנר המילה — היריב מטיל מילה, והיא באנגלית מעליו (`37 § 5`).
          ⛔ אנגלית עוברת ב-`<EnWord>` בלבד (חוקה § 2 · `36 § 14`). */}
      {/* ⟦17/09 · `C-0709` · `T-423`ⓑ⟧ `enemy-block` — **110px מוצהרים** (`3316:8`).
          🔬 **נקרא מ-Figma בטיק הזה (`get_metadata` על `3316:2`), ⛔ ולא שוער:** הרצועה
          מחזיקה שם (`3316:9`, ‏y=8) · פס חיים (`3316:10..12`, ‏y=32) · ו**באנר המילה**
          (`cast-word`, `3316:13`, ‏y=58 h=44 w=200) ⇒ הבאנר יושב בתחתיתה, 8px מהקצה.
          ⛔ **ושלושת הראשונים ⛔ אינם נבנים כאן** — שם היריב ופס חייו יושבים היום
          **בתוך הבמה** (`T-361` · `C-0623`), ו-`T-424` הוא שמעביר אותם לרצועה הזאת
          (`36 § 8.0` הכרעה ③). ⇒ **הרצועה מוצהרת עכשיו כדי שיהיה לאן להעביר אותם**,
          וזה בדיוק למה השורה הזאת נוחתת לפניה.
          🔴 **⟦נמדד ב-`C-0709`, ⛔ ולא שוער⟧ ⛔ ובמסך נמוך הרצועה הזאת מוותרת — כי
          אחרת הקרב ⛔ אינו קיים.** שבע הרצועות הן **522px קבועים**; ב-320×568 נשארו
          לבמה **46px** — כלומר ⛔ אין במה, ⛔ ואין קרב. ⛔ «⑵ בלבד ב-320» (‏`T-423`ⓒ)
          אומר שאין לטעון שם על **הגבהים**; הוא ⛔ אינו אומר שמותר לשלוח ללומד מסך
          שאי אפשר לשחק בו.
          ⇒ **והמספר שהיא יורדת אליו הוא של Figma עצמו, ⛔ ולא נבחר:** הרצועה מצוירת
          סביב תוכן שגובהו **52px** (`cast-word` 44 ועוד 8 מתחתיו) — כלומר 58px מתוכה הם **אוויר**, וזה
          מה שנגרע ⛔ ולא התוכן. מעל 700px גובה ⛔ שום דבר ⛔ אינו משתנה, ⇒ שתי המידות
          ש-ⓒ טוען עליהן (852 · 932) ⛔ לא נגעו. */}
      <div
        data-arena-enemy-block
        className="flex h-[110px] shrink-0 flex-col items-center justify-end pb-2 [@media(max-height:700px)]:h-[52px]"
      >
        <div
          data-arena-banner
          className="flex h-[44px] w-[200px] max-w-full items-center justify-center rounded-2xl border-2 border-[color:var(--arena-gold)] bg-[color:var(--arena-stone-dark)] px-4 text-center"
        >
          <EnWord className="text-3xl font-black leading-none tracking-wide text-[color:var(--arena-gold-light)]">
            {word?.headword ?? ''}
          </EnWord>
        </div>
      </div>

      {/* ⓓ הבמה — שתי הדמויות. ⛔ **התנועה חיה כאן ובלבד** (T-041, עקרון הקוהרנטיות
          של Mayer): אזור היד שמתחת ⛔ לעולם אינו זז. התנוחה מגיעה מ-`stagePhase` שבחוק. */}
      {/* ⛔ **`onAnimationEnd` הוא ה«טיימר», והוא ⛔ אינו טיימר:** האנימציה הנושאת ב-CSS
          נגמרת אחרי `--arena-hitstop-ms`, והאירוע הזה הוא מה שמשחרר את הקיפאון. ⇒ המספר
          חי בקובץ הטוקנים ⛔ ולא כאן, והשם נבדק כי אנימציות אחרות בבמה מבעבעות למעלה. */}
      <div
        ref={stageAreaRef}
        data-arena-stage-area
        data-arena-impact={impact}
        data-arena-crit={crit === 'off' ? undefined : crit}
        data-arena-hurt={hurt === 'off' ? undefined : hurt}
        data-arena-roll={roll === 'off' ? undefined : roll}
        /**
         * 🎭 **⟦`T-439`⟧ התנוחה חוזרת — והשחרור הוא המעבר ש**כבר קיים**.**
         *
         * ⛔ **שני גדרים, ושניהם נמדדו ⛔ ולא נזהרו:** ⓐ `propertyName` — המעבר
         * על הדמות מצהיר **שתי** תכונות (`transform` ו-`rotate`) ⇒ בלי הגדר
         * השחרור היה נורה פעמיים; ⓑ **הצומת** — בתוך אזור הבמה יש עוד מעברים על
         * `transform`, ובראשם `[data-arena-hp-fill]` של **שני** פסי החיים,
         * ⇒ ריקון של פס חיים היה **מאפס את התנוחה באמצע המכה**.
         */
        onTransitionEnd={(e) => {
          if (e.propertyName !== 'transform') return;
          if (!(e.target instanceof Element) || !e.target.matches('[data-arena-figure]')) return;
          setPose('idle');
        }}
        onAnimationEnd={(e) => {
          if (e.animationName.startsWith('arena-hitstop')) {
            setImpact('off');
            /* 🎭 **⟦20/09 · `C-0748` · `F-306`ⓐ⟧ מסלול שחרור שני לתנוחה — ⛔ ולא כפילות.**
               🔬 **נמדד חי:** ברגע שהקיפאון באמת מקפיא את המעבר (`transition: none`
               מנצח מ-`C-0748`), `transitionend` של `transform` ⛔ **אינו נורה כלל**
               ⇒ `onTransitionEnd` למטה ⛔ אינו יכול לשחרר, ו-`F-305` היה נפתח מחדש.
               ⇒ **הפגיעה** משתחררת על השעון, וה**התחמקות** — שבה ⛔ אין קיפאון —
               ממשיכה להשתחרר על המעבר. ⛔ שני מסלולים לשני מצבים, ⛔ ולא שניים
               לאותו מצב. ⛔ **ואפס `setTimeout` חדש** — זה אותו `animationend`. */
            setPose('idle');
          }
          // ⟦15/09⟧ הרעד משוחרר באותו מנגנון בדיוק — ⛔ אין כאן `setTimeout` חדש.
          if (e.animationName === 'arena-crit-shake') setCrit('off');
          // 🩸 `T-440` — הרתיעה משתחררת באותו מנגנון בדיוק. ⛔ אפס שעון.
          if (e.animationName.startsWith('arena-hurt')) setHurt('off');
          if (e.animationName.startsWith('arena-roll')) setRoll('off');
        }}
        /* ⟦15/09 · `F-260`⟧ `flex-1 min-h-0` — **הבמה בולעת את מה שנשאר.** ⛔ `min-h-0`
           ⛔ אינו קישוט: ילד flex מקבל `min-height:auto` כברירת מחדל ולכן **מסרב
           להתכווץ מתחת לתוכנו**, וזה בדיוק מה שדוחף ילדים אחרים מתחת לקפל. */
        className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-2xl bg-[color:var(--arena-night)]"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => { stageFrom.current = { x: e.clientX, y: e.clientY }; }}
        /**
         * 🕹️ **⟦19/09 · `C-0735` · `T-437` · `D-270` ④⟧ ההכרעה עוברת לאמצע הגרירה.**
         *
         * 🔬 **הפער, כלשון רוי ⛔ ולא בניסוח שלי:** «ההזזה של השחקן **איטית ולא
         * רציפה**». ⇒ נמדד: המחווה הוכרעה **רק** ב-`onPointerUp` — כלומר ⛔ שום
         * דבר ⛔ לא קרה כל עוד האצבע על המסך. מחליקים, **מרימים**, ורק **אז** הוא זז.
         *
         * 🔴 **ואיפוס נקודת המוצא הוא מה שהופך את זה ל«רציף»:** אחרי כל נתיב
         * שנדלק, ההתחלה נקבעת **מחדש** למקום האצבע ⇒ גרירה אחת של 130px מעבירה
         * **שני** נתיבים בלי להרים. ⛔ בלי האיפוס, גרירה ארוכה הייתה שווה לקצרה.
         *
         * ⛔ **ו-`onPointerUp` ⛔ לא נגעתי בו, וזה ⛔ אינו שכחה:** אחרי האיפוס
         * השארית תמיד **קטנה מהסף** ⟨אחרת היא הייתה נורית כאן⟩ ⇒ `resolveGesture`
         * מחזיר שם `null` מעצמו. ⛔ אפס דגל «כבר זזתי», ⛔ אפס תזוזה כפולה.
         *
         * ⛔ **ו-60 קריאות בשנייה ⛔ אינן 60 רינדורים:** `swipe` מחזיר את **אותה
         * הפניה** כשהנתיב ⛔ אינו משתנה ⟨קיר⟩ וכש-`dodge` מחוץ לחלון, ⇒ React
         * בולם על `Object.is`. מתחת לסף כלל ⛔ אין קריאה.
         */
        onPointerMove={(e) => {
          const start = stageFrom.current;
          if (start === null) return;
          const gesture = resolveGesture({
            source: 'stage',
            startX: start.x, startY: start.y,
            endX: e.clientX, endY: e.clientY,
            viewportWidth: window.innerWidth,
          });
          if (gesture?.kind !== 'move') return;
          /* 🔴 **התפיסה כאן, ⛔ ולא ב-`pointerdown` — וזה נמדד, ⛔ ולא נזהר.**
             🔬 **מה שקרה כשהיא ישבה ב-`pointerdown`:** `check:mobile` האדים על
             «הקשה כפולה על אותו קלף משגרת» (‏`F-259`). הסיבה: אזור הבמה מכיל את
             **כפתור השיגור** של `§ 5` («הקשה על היריב משגרת»), ותפיסה על
             `pointerdown` מסיטה אליה את ה-`pointerup` ⇒ ה-`click` על הכפתור
             ⛔ **לעולם ⛔ אינו נורה**. כלומר הקיצור בלע את **מסלול הנגישות**.
             ⇒ תופסים רק **אחרי** שהמחווה הוכיחה את עצמה: הקשה ⛔ לעולם ⛔ אינה
             חוצה סף, ⇒ ⛔ לעולם ⛔ אינה נתפסת — וגרירה ארוכה שיוצאת מהאזור
             ממשיכה לירות. */
          if (e.currentTarget.hasPointerCapture?.(e.pointerId) !== true) {
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }
          stageFrom.current = { x: e.clientX, y: e.clientY };
          setBattle((prev) => (prev === null ? prev : swipe(prev, gesture.dx, elapsedRef.current)));
        }}
        onPointerUp={(e) => {
          const start = stageFrom.current;
          stageFrom.current = null;
          if (start === null) return;
          const gesture = resolveGesture({
            source: 'stage',
            startX: start.x, startY: start.y,
            endX: e.clientX, endY: e.clientY,
            viewportWidth: window.innerWidth,
          });
          // ⛔ `move` ⛔ אינו «התחמקות» — `swipe` בליבה מכריע **שניהם**: הוא מזיז נתיב
          // (‏`moveLane`, תמיד) ורק אז מגלגל (`dodge`, ⛔ רק בתוך החלון).
          // ⛔ הרכיב ⛔ אינו יודע מהו חלון, ו⛔ אינו סופר 400 מילישניות.
          // 🔴 **⟦19/09 · `C-0730` · `T-433`ⓑ⟧ ‏`gesture.dx` הפסיק להיזרק.** עד כאן
          //    המחווה זוהתה, הסימן חושב — ו⛔ נמחק בשורה הזאת: ⇒ **החלקה שמאלה
          //    והחלקה ימינה עשו בדיוק את אותו דבר**, וזה בדיוק מה ש-`37 § 5` אוסר.
          if (gesture?.kind === 'move') {
            setBattle((prev) => (prev === null ? prev : swipe(prev, gesture.dx, elapsedRef.current)));
          }
          // 🛡️ **⟦`T-438` · `D-270` ③⟧ החלקה **למטה** מציבה הגנה.**
          //    ⛔ **ב-`pointerup` ו⛔ לא ב-`pointermove`, וזה ⛔ אינו חוסר עקביות:**
          //    תזוזה היא **רציפה** ⇒ היא רוצה להיות מוכרעת תוך כדי; הצבה היא
          //    **בדידה** וגובה מאנה ⇒ הכרעה תוך כדי גרירה הייתה מציבה **ומשלמת**
          //    עוד לפני שהאצבע סיימה לומר מה היא רוצה.
          if (gesture?.kind === 'guard') {
            setBattle((prev) => (prev === null ? prev : placeGuard(prev, elapsedRef.current)));
          }
        }}
        onPointerCancel={() => { stageFrom.current = null; }}
      >
        {/* 🔴 **⟦הועבר 15/09 · `C-0623` · `T-361`⟧ שם היריב ופס חייו עברו **לתוך
            הזירה**, ⛔ ואינם שורה ברוחב מלא מעליה.**

            🔬 **נמדד:** העמודה חילקה 580px כך שהבמה קיבלה **52px**, בעוד השורה הזאת
            לבדה אכלה **72** ועוד רווח. ⇒ הקרב עצמו קיבל **9% מהמסך**.
            🎯 **והרנדר כבר מיקם אותם נכון:** ב-`kol-B-03-battle.png` «הקוסם» ופס חייו
            יושבים **ליד היריב, בתוך הזירה** — ⛔ ולא כשורת כרום. ⇒ זו יישור לרנדר
            (`36 § 14.4`), ⛔ ולא טעם, והמקום שהתפנה חוזר למשחק.

            ⛔ **והכפתור נשאר כפתור:** זהו מסלול הנגישות של `§ 5` («הקשה על היריב
            משגרת»), ⇒ יעד המגע, ה-`aria-label` ו-`role="img"` של הפס ⛔ לא נגעו. */}
        {/* ⛔ `top-1` ו-`w-[54%]`: 🔬 נמדד — ב-`top-2 w-[62%]` הפס **חצה את היריב**,
            שעומד במרכז. הרנדר מציב אותו **מעליו ולימינו**, ⇒ צר יותר וגבוה יותר. */}
        <div className="pointer-events-none absolute inset-x-2 top-1 z-10 flex flex-col items-start gap-0.5">
          <div className="pointer-events-auto w-[54%] max-w-[220px]">
      {/* ⓒ היריב — שם **וגם** פס חיים עם המספר בתוכו. ⛔ שכבה א׳ א2: הצבע הוא הערוץ
            השני, ⛔ ולעולם לא היחיד, ולכן `N/M` ⛔ אינו «ניקוי» שמותר להסיר. */}
        <div className="flex flex-col gap-1" data-arena-enemy>
          <p className="text-end text-base font-bold text-[color:var(--arena-gold-light)]">
            {ENEMY_HE}
          </p>
          {/* ⓒ1 מד ההטלה — `37 § 6`. ⚠️ **שכבה א׳ גוברת על הרנדר:** השלב מוכרז ב**מילה**
              ‏(«מטיל!») ⛔ ולעולם לא בגוון בלבד (א2), והיא `aria-live` כדי שהגלגול יהיה
              נגיש בלי לראות את שינוי הצבע. תחת `prefers-reduced-motion` הפעימה נעצרת
              ⛔ והמילה **נשארת**. */}
          {telegraphPhase !== 'quiet' && (
            <div className="flex flex-col items-center gap-1" data-arena-cast data-arena-cast-phase={telegraphPhase}>
              {telegraphPhase !== 'charging' && (
                <p className="text-xs font-black text-[color:var(--arena-cast-warn)]" role="status" aria-live="polite">
                  {CASTING_HE}
                </p>
              )}
              {/* T-231 ⓑ — `scaleX`, ⛔ ולא `width`: apple-design § 11 («animate only
                  compositor-friendly properties»). `castMeterWrapRef`/`castMeterFillRef`
                  נכתבים מהלולאה כל פריים (הרמפה חייבת להיות חלקה); הערך כאן הוא פתיחה. */}
              <div
                ref={castMeterWrapRef}
                role="img"
                aria-label={`${CASTING_METER_HE} ${Math.round(telegraphFrac * 100)} אחוז`}
                className="h-[9px] w-[70px] max-w-full overflow-hidden rounded-full border border-[color:var(--arena-cast-edge)] bg-[color:var(--arena-night)]"
              >
                {/* T-231 ⓑ — `left center`, ⛔ ולא `right`: `width` פיזי על `<span>` לא
                    ממוקם (⛔ לא `absolute`) תמיד מתחיל בקצה **הפיזי השמאלי** של המכיל,
                    בלי קשר ל-`dir` — זו בדיוק ההתנהגות הישנה שנמדדה חזותית (`arena_t3.png`),
                    ולכן העוגן החדש חייב להיות אותו צד, ⛔ לא «right» שמתאים ל-RTL תוכנית. */}
                <span
                  ref={castMeterFillRef}
                  aria-hidden
                  className={`block h-full w-full ${telegraphPhase === 'charging' ? 'bg-[color:var(--arena-cast)]' : 'bg-[color:var(--arena-cast-warn)]'}`}
                  style={{ transform: `scaleX(${telegraphFrac})`, transformOrigin: 'left center', willChange: 'transform' }}
                />
              </div>
            </div>
          )}
          {/* ⛔ מסלול הנגישות של `§ 5` — «הקשה בוחרת, **הקשה על היריב משגרת**».
              פס החיים ו-`role="img"` שלו ⛔ לא השתנו; הם עברו **לתוך** הכפתור. */}
          <button
            type="button"
            data-arena-fire
            disabled={selected === null}
            onClick={() => {
              if (selected === null) return;
              // ⛔ המלבן **לפני** `fire`: `cast` מתקדם ⇒ הקלף הנבחר יורד מהמסמך.
              const from = selectedCardRect();
              if (from !== null) launchThrow(selected, from);
              fire(selected);
            }}
            className="min-h-touch w-full rounded-lg text-start disabled:opacity-60"
          >
            <span className="sr-only">{selected === null ? FIRE_HINT_HE : `${FIRE_HE} ${selected}`}</span>
            <div
              role="img"
              aria-label={`${ENEMY_HP_HE} ${enemyPct} מתוך 100`}
              className="relative h-6 w-full overflow-hidden rounded-full border border-[color:var(--arena-gold)] bg-[color:var(--arena-hp-track)]"
            >
              {/* T-214 · ⛔ `bg-danger` יצא: `--danger` מתחלף ב-`globals` לפי הסכימה
                  (`#b91c1c` בהירה · `#f87171` כהה) ⇒ בסכימה כהה המספר הלבן ישב עליו
                  ב-**2.70:1**. הערך כאן הוא של הרנדר, מוגה כלפי מעלה בשכבה א׳.
                  T-231 ⓑ — `scaleX` במקום `width` (apple-design § 11); `end-0` + `w-full`
                  נותנים את אותו עוגן ימני שה-`width` הישן ייצר בעקיפין. */}
              <span
                aria-hidden
                data-arena-hp-fill
                className="absolute inset-y-0 end-0 w-full bg-[color:var(--arena-hp)]"
                style={{ transform: `scaleX(${enemyPct / 100})`, transformOrigin: 'right center' }}
              />
              {/* ⛔ `text-brand-on` יצא: בסכימה **כהה** הוא `#0f172a` ⇒ **1.42:1** על
                  המסילה — והמספר הזה הוא הערוץ ה**שני** של פס החיים (א2). */}
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center text-xs font-bold text-[color:var(--arena-ink)]"
              >
                {/* ⛔ אחוז, ⛔ ולא HP גולמי — בדיוק מה ש-`render_video_B.py:475` מצייר. */}
                <EnWord>{`${enemyPct}/100`}</EnWord>
              </span>
            </div>
          </button>
        </div>

          </div>
        </div>
        {/* 🎯 **`T-434` — הסימן נדלק בהכרזה ⛔ ולא בפגיעה.** `window` הוא החלון
            שבו עוד אפשר לזוז, ו-`committed` הוא 300ms שבהם הכדור כבר נוסע ⇒ שניהם
            מציגים לאן המכה הולכת. ⛔ **⛔ ולא נגזר בלולאה** — `telegraphPhase` הוא
            כבר state שמשתנה **רק במעבר בדיד**, ו-`swingIndex` נקרא באותו רינדור
            בדיוק כמו `telegraphFrac` למעלה. */}
        {/* 🩸 **⟦19/09 · `C-0733` · `T-436`⟧ פס חיי הלומד — סוגר את `F-304`.**

            ⛔ **בתוך הבמה, ⛔ ולא רצועה שמינית:** תקציב הרצועות סגור על **522px**
            ונמדד חי ב-`check:mobile` ⇒ רצועה נוספת מפילה אותו. ⇒ הפס יושב בדיוק
            כמו של היריב — **צף מעל הבמה** — רק בצד הנגדי.

            ⛔ **וזהב ⛔ ולא אדום, וזה ⛔ אינו טעם:** `--arena-hp` האדום הוא **שלו**.
            צבע זהה לשני הפסים היה אומר «שני מדים», ⛔ ולא «שלי מול שלו». ⇒ זהב =
            שלי, אדום = שלו — הצבע הופך ל**מידע** (`T-427`), ⛔ ובלי לפתוח משפחה
            שביעית: שני הטוקנים כבר קיימים.

            ⛔ **והמספר יושב ב**שורת התווית**, ⛔ ולא על המסילה.** 🔬 מספר בתוך הפס
            יושב על **שני רקעים** — המילוי והמסילה הריקה — ⇒ הניגודיות שלו משתנה
            לפי כמה חיים נשארו. בשורה נפרדת הוא על רקע אחד, ⛔ והוא עדיין הערוץ
            ה**שני** שהחוקה (א2) דורשת. */}
        <div className="pointer-events-none absolute inset-x-2 top-1 z-10 flex flex-col items-end gap-0.5">
          <div className="w-[40%] max-w-[160px]" data-arena-learner>
            <div className="flex items-baseline justify-between gap-1">
              <p className="text-sm font-bold text-[color:var(--arena-gold-light)]">{LEARNER_HE}</p>
              <p className="text-xs font-bold text-[color:var(--arena-ink)]">
                <EnWord>{`${learnerPct}/100`}</EnWord>
              </p>
            </div>
            <div
              role="img"
              aria-label={`${LEARNER_HP_HE} ${learnerPct} מתוך 100`}
              className="relative h-3 w-full overflow-hidden rounded-full border border-[color:var(--arena-gold)] bg-[color:var(--arena-hp-track)]"
            >
              {/* ⛔ `scaleX` ⛔ ולא `width` (‏`apple-design § 11`), ו-`data-arena-hp-fill`
                  ⇒ הוא יורש את **אותה** ריקון בת 260ms ואת עצירתה תחת תנועה מופחתת.
                  ⛔ **והעוגן `left` ⛔ ולא `right`:** הפס של היריב מתרוקן אל הקצה שלו,
                  וזה מתרוקן אל **שלו** — שני מדים שמתרוקנים לאותו כיוון קוראים כמד אחד. */}
              <span
                aria-hidden
                data-arena-hp-fill
                className="absolute inset-y-0 start-0 w-full bg-[color:var(--arena-gold)]"
                style={{ transform: `scaleX(${learnerPct / 100})`, transformOrigin: 'left center' }}
              />
            </div>
          </div>
        </div>

        {/* ⏱️ **⟦20/09 · `C-0746` · `F-306`ⓑ⟧ השעון של הקיפאון — צומת משלו, ⛔ ולא
            תכונה על אזור הבמה.**

            🔬 **נמדד חי, ⛔ ולא הוסק:** כש-`data-arena-impact` ו-`data-arena-crit`
            היו שניהם על אזור הבמה, `getComputedStyle(area).animationName` החזיר
            `arena-crit-shake` **בלבד** — אותה תכונה, אותו אלמנט, אותה ספציפיות,
            והרעד מאוחר יותר בקובץ ⇒ הוא **החליף** את השעון. ⇒ ב**פגיעה קריטית**
            ‏`animationend` של `arena-hitstop` ⛔ לעולם ⛔ לא נורה, `setImpact('off')`
            ⛔ לא נקרא, ושתי הדמויות **נשארו צלליות לבנות עד סוף הקרב**.

            ⛔ **ו⛔ אין כאן `setTimeout` חדש** — האירוע **מבעבע** לאזור הבמה, ומגיע
            לאותו `onAnimationEnd` בדיוק. ⛔ **והצומת ⛔ אינו מצייר**: `arena-hitstop-*`
            הוא `opacity: 1 → 1`, ⇒ אפס-גודל, מחוץ לזרימה, ו-`aria-hidden`.

            ⚠️ **ו-`data-arena-impact` **נשאר** על אזור הבמה** — הוא ה**מצב** שכל
            הכללים הצאצאיים תלויים בו (הצללית, הקפאת הלולאה, הנשימה). מה שירד לכאן
            הוא ה**שעון** בלבד. */}
        <span
          aria-hidden
          data-arena-hitstop={impact}
          className="pointer-events-none absolute h-0 w-0"
        />

        <ArenaStage
          phase={pose}
          items={items}
          character={character}
          lane={battle.heroLane}
          aim={aimed ? aimLaneAt(battle, aimSwing) : null}
          guard={battle.guardLane}
          telegraph={telegraphPhase}
        />

        {/* 🛡️ **⟦19/09 · `C-0737` · `T-438` · `D-270` ③⟧ מסלול הנגישות של ההצבה.**

            🔴 **`§ 5` מחייב אותו לכל מחווה** — «מסלול נגישות **נוסף**: הקשה
            בוחרת, הקשה על היריב משגרת. **נוסף, לא במקום**». ⇒ החלקה למטה חייבת
            תאום שאינו מחווה.
            🎯 **והקשה על ה**לומד** היא הסימטריה שנלמדת מעצמה:** הקשה על היריב
            כבר משמעותה «שגר»; על הלומד ⛔ לא הייתה לה משמעות. ⇒ מקישים על מי
            שרוצים שיפעל.
            ⛔ **והכפתור ⛔ אינו בולע את ההחלקה:** הוא **צאצא** של אזור הבמה,
            ⇒ `pointerdown`/`pointermove` ממשיכים לבעבע אליו והתזוזה עובדת דרכו.
            ⛔ **והוא נע עם הנתיב** — אותו `--arena-lane-shift` בדיוק, ⇒ הוא
            תמיד **על** הלומד. */}
        <button
          type="button"
          data-arena-guard-btn
          data-arena-lane={LANE_NAMES[battle.heroLane ?? CENTRE]}
          disabled={!canPlaceGuard(battle, elapsedRef.current)}
          onClick={() => { setBattle((prev) => (prev === null ? prev : placeGuard(prev, elapsedRef.current))); }}
          className="min-h-touch min-w-touch rounded-full"
        >
          <span className="sr-only">{GUARD_BTN_HE}</span>
        </button>
        {/* 🔴 **⟦הועבר 16/09 · `C-0665` · `T-364`⟧ המספר עבר **אל היריב**, ⛔ ואינו יושב על המסילה.**

            🔬 **נמדד ברנדר, ⛔ ולא באומדן:** `render_video_B.py:564` קורא
            `dmg_number(c, wx + 18, wy - 6, …)` — `wx`/`wy` הם ה**יריב**, ⇒ המספר נולד
            **עליו**, ⛔ ולא על פס החיים שמעליו. עד היום הוא היה `end-2 -top-5` בתוך
            `[role="img"]` של הפס, בגודל `text-base` ובזהב — שלוש סטיות מהרנדר בבת אחת
            (מקום · גודל · גוון), ⛔ ולא אחת.

            ⛔ **ולמה זה ⛔ אינו קוסמטיקה:** הנזק הוא התשובה ל«מה הלחש שלי עשה **לו**».
            מספר שמרחף על כרום בקצה המסך עונה «משהו קרה»; מספר שמתפוצץ על היריב עונה
            **על מי**. זו אותה טענה בדיוק ש-`apple-design § 7` עושה על מרחב.

            ⛔ **המספר עצמו ⛔ לא חושב מחדש** — אותו `damage.amount` מ-`prevEnemyHp`,
            אותו `key`, אותו `onAnimationEnd`. ⛔ הועבר, ⛔ לא נכתב מחדש.
             🔴 **⟦NEW 15/09 · `C-0622` · `T-358`⟧ כמה. ⛔ עד היום ⛔ שום דבר ⛔ לא ענה על זה.**

                  🔬 **נמדד:** פס החיים מצויר ב-`scaleX()` **בלי `transition`** ⇒ 100⇢90
                  קרה בפריים אחד, והלומד ⛔ לא ראה שפגע — הוא ראה **מספר אחר**. הפס שופר
                  לזרימה בקובץ הטוקנים, וזה המספר עצמו.

                  ⛔ **והמספר הזה הוא מידע, ⛔ ולא אפקט:** הוא נגזר מהפרש החיים **בפועל**
                  (`prevEnemyHp`), ⛔ ואינו מחושב מחדש מהכללים — חישוב שני של אותו מספר
                  הוא בדיוק איך שמסך מתחיל לשקר על מה שקרה. ⇒ תחת `prefers-reduced-motion`
                  הוא **נשאר על המסך ומפסיק לנוע**, ⛔ ואינו נעלם.

                  ⛔ `key` מכריח החלפת צומת בכל הטלה ⇒ האנימציה מתחילה מחדש; בלעדיו פגיעה
                  שנייה בתוך 560ms הייתה מקבלת אפס תנועה. `aria-hidden` — פס החיים כבר
                  נושא `role="img"` עם הערך, ⇒ קורא-מסך ⛔ אינו שומע את אותו נתון פעמיים. */}
        {damage !== null && !reducedMotion && (
          <div
            key={damage.key}
            aria-hidden
            /* 🔬 **⟦נמדד בהליכה החיה של `C-0665`, ⛔ ולא הונח⟧ `translate-y-12`, ⛔ ולא 0.**
               ‏`top-[16%]` הוא ה**חריץ** של היריב, והחריץ מתחיל בקצה ה**עליון** של
               הדמות — ⇒ מספר שממורכז עליו נוחת על **פס החיים** שמעליו. צילום המסך
               ב-375×780 הראה את `−2` מכסה את `90/100`, כלומר אפקט שמוחק **מידע**.
               ⛔ 48px מורידים אותו אל **גוף** הדמות, שם הרנדר מצייר אותו
               (`wx`/`wy` הם היריב עצמו), והפס חוזר להיקרא במלואו. */
            className="pointer-events-none absolute inset-x-0 top-[16%] z-20 grid translate-y-12 place-items-center"
          >
            {/* ⛔ שלוש הטבעות — `render_video_B.py:543-548`. ⛔ הן ⛔ אינן נושאות מידע
                (הן חוזרות על מה שהמספר כבר אומר) ⇒ הן, ⛔ ולא המספר, מה שנעלם תחת
                `prefers-reduced-motion`. ⛔ מידה קבועה בפיקסלים: הטבעת ⛔ אינה יכולה
                לקחת אחוז מהורה שגובהו נגזר מתוכנו (אותה מדידה כמו `data-arena-slot`). */}
            <span data-arena-burst className="absolute grid place-items-center">
              <span className="absolute h-[120px] w-[120px] rounded-full border-[3px] border-[color:var(--arena-burst)]" />
              <span className="absolute h-[120px] w-[120px] rounded-full border-2 border-[color:var(--arena-burst)]" />
              <span className="absolute h-[120px] w-[120px] rounded-full border border-[color:var(--arena-burst)]" />
            </span>
            {/* ⛔ `text-3xl` ⛔ ולא `text-base`: הרנדר מצייר את המספר ב-20px **ועוד**
                `scale` של 1.55 בשיא (`:344-345`) ⇒ **גדול**, וזה מה ש«גדול, אדום» אומר.
                ⛔ ו-`--arena-damage` ⛔ ולא `--arena-gold-light` — הרנדר נוקב `(255,130,130)`.
                ⛔ `drop-shadow` הוא צל המספר ברנדר (`:350` — `(50, 8, 8)` ב-60% אלפא),
                ⛔ ולא הילה: תקציב הזוהר של שכבה ב׳ נוגע ל-`--brand` בלבד. */}
            <span
              data-arena-damage
              onAnimationEnd={() => setDamage(null)}
              className="relative text-3xl font-black tabular-nums text-[color:var(--arena-damage)] [text-shadow:0_2px_0_rgba(50,8,8,0.6)]"
            >
              <EnWord>{`−${damage.amount}`}</EnWord>
            </span>
          </div>
        )}
        {/* ⛔ **T-363 — אותה חסינות, שתי מילים.** `§ 6` (גלגול) ו-`§ 4` (`מגן`) מגיעות
            שתיהן ל-`dodgedSwing`, ⇒ עד היום שתיהן היו מדפיסות «התחמקות!» — ולומד
            שלחץ `מגן` היה מקבל הודעה על מחווה ש⛔ לא עשה. `immuneBy` הוא מה שמפריד. */}
        {/* 🛡️ `T-438` — ⛔ **`sr-only` ו⛔ לא מוסתר:** ההגנה כבר **נראית** על
            הרצפה; מה שחסר הוא מי ש⛔ אינו רואה אותה. */}
        <p className="sr-only" role="status" aria-live="polite">
          {battle.guardLane === null ? '' : GUARD_ON_HE}
        </p>
        {battle.dodgedSwing !== null && (
          <p className="mt-2 text-center text-sm font-black text-[color:var(--arena-dodge)]" role="status" aria-live="polite">
            {battle.immuneBy === 'shield' ? SHIELDED_HE : DODGED_HE}
          </p>
        )}
      </div>

      {/* ⓔ מד המאנה — `מאנה N / 10`, ובזמן זעם התווית מתחלפת.
          ⛔ **מענה ⛔ אינו מעלה מאנה אף פעם** (`37 § 4`): הלמידה ⛔ אינה נחסמת מאחורי
          משאב. ⚠️ ⟦17/09 · `T-363`⟧ **שלוש היכולות שהרנדר מצייר נבנו** ויושבות מתחת ליד
          (`ABILITY_ORDER`); `ריפוי` — הרביעית ב-`§ 4` שהרנדר ⛔ **אינו** מצייר — נשארת
          **פער מוצהר**, ⛔ ולא השמטה. */}
      {/* ⟦17/09 · `C-0709` · `T-423`ⓑ⟧ `mana` — **44px מוצהרים** (`3319:2`): תווית
          ‏y=2 h=16, המד y=22 h=10. שלנו 16 + `gap-1` + `h-4` = 36 ⇒ `justify-center`. */}
      <div className="flex h-[44px] shrink-0 flex-col justify-center gap-1" data-arena-mana>
        <div className="flex flex-row items-baseline justify-between gap-2">
          <span
            className={`text-sm font-semibold ${raging ? 'text-[color:var(--arena-cast-warn)]' : 'text-[color:var(--arena-ink-dim)]'}`}
          >
            {raging ? RAGE_HE : MANA_HE}
          </span>
          {/* T-231 ⓔ — ref פנימי בתוך `<EnWord>` (T-009: העטיפה עצמה לא מעבירה ref). */}
          <span className={`text-sm font-bold ${raging ? 'text-[color:var(--arena-cast-warn)]' : 'text-[color:var(--arena-ink)]'}`}>
            <EnWord>
              <span ref={manaTextRef}>{`${mana} / ${MANA_CAP}`}</span>
            </EnWord>
          </span>
        </div>
        {/* T-397 ⓐ — **עשרה מקטעים, ⛔ ולא מילוי רציף.** נמדד ב-`render_video_B.py`
            ‏(`mana_bar`, `:288`): מסילה בגובה 14 ורדיוס 7, ובתוכה `cap` מקטעים בגובה 10
            עם 1.5px מרווח מכל צד ⇒ ‏`p-[2px]` + `gap-[3px]` כאן, ו-`--arena-mana`
            הוא בדיוק ה-`(86,132,226)` שהרנדר צובע בו.
            ⛔ **המילוי מתחיל מימין** — ברנדר `sx = x + w - (k+1)*seg_w`, וכאן `dir="rtl"`
            מסדר את ה-flex באותו כיוון בלי חשבון ידני.
            ⚠️ **⛔ והצורה ⛔ אינה הערוץ היחיד:** המספר `N / 10` יושב מעליה ו-`aria-label`
            נושא «N מתוך 10» — ⛔ שניהם ⛔ לא זזו (ⓑ). */}
        <div
          ref={manaMeterWrapRef}
          role="img"
          aria-label={`${raging ? RAGE_HE : MANA_HE} ${mana} מתוך ${MANA_CAP}`}
          className="flex h-4 w-full flex-row gap-[3px] overflow-hidden rounded-full border border-[color:var(--arena-stone)] bg-[color:var(--arena-stone-dark)] p-[2px]"
        >
          {Array.from({ length: MANA_CAP }, (_, k) => (
            <span
              key={k}
              ref={(el) => {
                manaSegRefs.current[k] = el;
              }}
              aria-hidden
              data-arena-mana-seg
              data-full={k < mana ? 'true' : 'false'}
              className="block h-full flex-1 rounded-full"
              style={{ backgroundColor: k < mana ? manaSegColor(raging) : 'transparent' }}
            />
          ))}
        </div>
      </div>

      {/* ⓕ היד — ארבעה קלפי לחש **בעברית** (`37 § 5`). ⛔ הגרירה היא T-178, וההקשה
          ⛔ אינה «מסלול זמני»: `§ 5` קורא לגרירה «מסלול **נוסף**», והקשה נשארת.
          ⛔ קלף `?` נושא את הסימן **וגם** את התווית העברית — סימן לבדו הוא קידוד
          בערוץ אחד ומפר את שכבה א׳ א2. */}
      {/* ⛔ הרמז יושב **מעל** היד ו⛔ לעולם לא עליה (קוהרנטיות, T-041): אזור היד
          ⛔ אינו זז, ולכן הרמז ⛔ אינו יכול להיות שכבה מעליו. */}
      {/* ⟦17/09 · `C-0709` · `T-423`ⓑ⟧ שורת הרמז — **28px מוצהרים** (`3319:15`: הטקסט
          ‏y=544 h=16, בין המאנה ב-540 לחפיסה ב-568). 🔴 **והרצועה קיימת גם כשהיא ריקה,
          וזו ⛔ אינה קפדנות:** שני הדיירים שלה מותנים (`showHint` · `returned`), ⇒ בלי
          עטיפה בגובה מוצהר החפיסה והיכולות **קופצות 28px** ברגע שאחד מהם נכנס או יוצא —
          באמצע קרב של 90 שניות, מתחת לאגודל. ⛔ רצועה ריקה כאן היא **יציבות**, ⛔ ולא
          רעש: היא ⛔ אינה מציירת דבר. */}
      <div data-arena-hintrow className="flex h-[28px] shrink-0 items-center justify-center">
      {showHint && (
        <p data-arena-hint className="text-center text-xs text-[color:var(--arena-ink-dim)]">{DRAG_HINT_HE}</p>
      )}
      {/* T-220 ⓓ · D-139 — the card comes back REVEALED: the Hebrew translation is shown at
          the moment of the error, then the learner is asked to produce it again at the tail
          (`cast` in `battle.ts`). ⛔ Not a new mechanic (R-010): tap ⇒ translation is what
          `StoryScreen` already does. ⛔ A state change, ⛔ not an animation (ⓔ): nothing here
          moves, so `prefers-reduced-motion` has nothing to remove. Words, ⛔ not colour (א2),
          and `aria-live` so a screen reader hears the return too. */}
      {returned !== null && (
        <p data-arena-returned role="status" aria-live="polite" className="text-center text-sm text-[color:var(--arena-ink)]">
          {RETURNED_HE}
          {' · '}
          <EnWord className="font-bold">{returned.headword}</EnWord>
          {' — '}
          <span className="font-bold">{returned.translationHe}</span>
        </p>
      )}
      </div>

      {/* ⟦17/09 · `C-0709` · `T-423`ⓑ⟧ `deck` — **196px מוצהרים** (`3319:16`).
          ⛔ **`content-start` ⛔ ולא מתיחה:** ‏Figma מצייר את הקלפים 132 גבוהים בראש
          רצועה של 196 (`3319:17`, ‏y=8) ⇒ הם שומרים על גובהם הטבעי ונארזים למעלה.
          ‏`h-[196px]` לבדו היה מותח שורת grid יחידה על כל הרצועה ומעוות ארבעה קלפים
          שגובהם נגזר מהתוכן שלהם.
          🔴 **⟦נמדד ב-`C-0709`, ⛔ ולא שוער⟧ ⛔ ובמסך נמוך הרצועה הזאת מוותרת — כי
          אחרת הקרב ⛔ אינו קיים.** שבע הרצועות הן **522px קבועים**; ב-320×568 נשארו
          לבמה **46px** — כלומר ⛔ אין במה, ⛔ ואין קרב. ⛔ «⑵ בלבד ב-320» (‏`T-423`ⓒ)
          אומר שאין לטעון שם על **הגבהים**; הוא ⛔ אינו אומר שמותר לשלוח ללומד מסך
          שאי אפשר לשחק בו.
          ⇒ **והמספר שהיא יורדת אליו הוא של Figma עצמו, ⛔ ולא נבחר:** הרצועה מצוירת
          סביב תוכן שגובהו **140px** (קלף `3319:17` בגובה 132 ועוד 8 מעליו) — כלומר 56px מתוכה הם **אוויר**, וזה
          מה שנגרע ⛔ ולא התוכן. מעל 700px גובה ⛔ שום דבר ⛔ אינו משתנה, ⇒ שתי המידות
          ש-ⓒ טוען עליהן (852 · 932) ⛔ לא נגעו. */}
      <ul
        ref={handRef}
        data-arena-hand
        className="grid h-[196px] shrink-0 grid-cols-4 content-start gap-2 pt-2 [@media(max-height:700px)]:h-[140px]"
      >
        {hand.map((option) => (
          <li key={option.he}>
            {/* T-220 ⓐ · D-143 § ד׳ — `?` is the OPTION SOURCE'S property (`ArcadeOption.kind`,
                filled by `buildRound`), ⛔ not a card slot: `unseen` = pulled from a word with
                no `word_progress` row. The answer is never `unseen` (`arcadeRound.ts`). */}
            <SpellCard
              label={option.he}
              unknown={option.kind === 'unseen'}
              selected={selected === option.he}
              reducedMotion={reducedMotion}
              /* 🔴 **⟦NEW 15/09 · `C-0622` · `F-259` · Roy reported it⟧ A SECOND TAP ON THE
                 SAME CARD CASTS IT. It used to DESELECT.**

                 🔬 **Measured in a browser, ⛔ not reasoned about:** this line was
                 `prev === option.he ? null : option.he` — a toggle. ⇒ tap once, the card
                 is armed; tap again, it is disarmed. **The learner taps the translation
                 twice and the word ⛔ never changes**, which is exactly the report:
                 «לוחצים על תרגום של המילה… אך היא לא מתחלפת».

                 ⇒ tap-tap on one card is now the whole attack. ⛔ Nothing was taken away:
                 the drag-up path (`§ 5`) and the tap-the-enemy path both still work, and
                 you still change your mind by tapping a DIFFERENT card — which is the
                 only thing anyone actually does with «deselect».
                 ⚖️ **And the trade is one-sided:** losing «tap to disarm» costs a learner
                 one extra tap on a different card; keeping it cost them the whole game. */
              onSelect={() => {
                // ⛔ ה-updater של `setSelected` נשאר **טהור**: הענף מוכרע מ-`selected`
                // שכבר ברינדור הזה, ⇒ ⛔ אין כאן תופעת לוואי בתוך מעדכן state — טעות
                // שנכתבה כאן לרגע ותוקנה לפני שנדחפה. `fire` כבר מאפס `selected`.
                if (selected === option.he) {
                  const from = selectedCardRect();
                  if (from !== null) launchThrow(option.he, from);
                  fire(option.he);
                } else setSelected(option.he);
              }}
              onCast={(from) => { launchThrow(option.he, from); fire(option.he); }}
            />
          </li>
        ))}
      </ul>

      {/* ⚡ **⟦17/09 · `C-0673` · `T-363`⟧ שורת היכולות — `37 § 4`, ומתחת ליד כמו ברנדר.**
          🔬 **הפער שנמדד:** `manaSpent` היה **קבוע 0 לאורך כל קרב** — המאנה נצברה עד
          התקרה ו⛔ לא היה במה להוציא אותה. ⇒ זו שורת המשימה מילה במילה.
          📐 **הגאומטריה מ-`render_video_B.py:308-322` ב-grep, ⛔ ולא מה-PNG:** שלושה
          כפתורים `92×44` ברדיוס 14, מרווח 14 ביניהם (`x = LW-62-i*106`, רוחב 92),
          ו-`ABILITIES` מצייר את `כפול` **הימנית** ⇒ `flex` רגיל ב-RTL נותן בדיוק את
          הסדר הזה (`T-338`). ⛔ **רדיוס 14 ⛔ אינו בסולם החמישה** ⇒ `rounded-xl` (12),
          אותה סטייה מדודה בדיוק שנרשמה ב-`ArenaHome` (D-036).
          ⛔ **הרוחב ⛔ אינו 92 קבוע:** ב-320px נותרים 272 פנויים ו-`3×92 + 2×14 = 304`
          ⇒ גלילה אופקית, שהיא שער (`check:mobile`). `flex-1` נותן את הרנדר ב-375
          ומתכווץ מתחתיו — הרנדר מחייב **פריסה**, והשער גובר על מספר יחיד.
          ⛔ **⛔ והמצב ⛔ אינו בצבע בלבד** (שכבה א׳ א2): לא-זמין הוא `disabled` אמיתי
          (⛔ לא רק עמעום), והאפקטים הפעילים נאמרים ב**מילים** בשורת הסטטוס מתחת.
          ⛔ **גובה 44 הוא רצפת שכבה א׳** — הרנדר מצייר 44, ⇒ ⛔ אין כאן סטייה. */}
      {/* ⟦17/09 · `C-0709` · `T-423`ⓑ⟧ `abilities` — **68px מוצהרים** (`3319:33`:
          הלחיצים y=8 h=44). והתקציב מסתכם בדיוק: **16 + 8 + 44 = 68**.

          🔴 **ולכן התווית והסטטוס חולקים שורה אחת, ו⛔ זו ⛔ אינה קיצוץ:** שורת הסטטוס
          ‏(`data-arena-ability-on`) ישבה מתחת ללחיצים ⇒ ברצועה של 68 היא הייתה נחתכת
          ב-`overflow-hidden` של המקטע — כלומר **המצב נאמר בצבע בלבד**, וזה בדיוק מה
          ששכבה א׳ א2 אוסרת. ⇒ שתיהן `text-xs`, שתיהן על אותה שורה, ⛔ אפס ערוץ שנגרע:
          ה-`role="status"` וה-`aria-live` ⛔ לא נגעו. */}
      <div className="flex h-[68px] shrink-0 flex-col justify-center gap-2" data-arena-abilities>
        <div className="flex h-4 flex-row items-center justify-between gap-2">
          <p className="shrink-0 text-xs font-semibold text-[color:var(--arena-ink-dim)]">{ABILITIES_HE}</p>
          {activeAbilities.length > 0 && (
            <p
              data-arena-ability-on
              role="status"
              aria-live="polite"
              className="truncate text-xs font-bold text-[color:var(--arena-gold-light)]"
            >
              {activeAbilities.map((key) => ABILITY_ON_HE[key]).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex flex-row gap-[14px]" data-rtl-row="abilities">
          {ABILITY_ORDER.map((key) => {
            const ready = canUseAbility(battle, key, elapsedRef.current);
            return (
              <button
                key={key}
                type="button"
                ref={(el) => {
                  abilityRefs.current[key] = el;
                }}
                data-arena-ability={key}
                data-ready={ready ? 'true' : 'false'}
                disabled={!ready}
                onClick={() => spend(key)}
                className={
                  'flex min-h-touch flex-1 flex-row items-center justify-center gap-2 rounded-xl ' +
                  'border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] ' +
                  'text-[color:var(--arena-ink)] ' +
                  'data-[ready=true]:border-[color:var(--arena-mana)] ' +
                  'disabled:text-[color:var(--arena-ink-dim)] disabled:opacity-60 ' +
                  'active:opacity-90 motion-safe:active:scale-[0.98] ' +
                  'motion-safe:transition-transform motion-safe:duration-150'
                }
              >
                {/* ⛔ העלות היא **מספר כתוב**, ⛔ ולא נקודות צבע — הרנדר מצייר עיגול עם
                    הספרה בתוכו (`:320-322`), וזה בדיוק מה שנבנה כאן.
                    🔴 **⛔ והספרה ⛔ אינה `--arena-mana`, וזו מדידה:** הקובץ עצמו רושם
                    ‏`--arena-mana` על `--arena-stone-dark` כ-**3.46:1** — מעל רצפת 3:1
                    ל**גרפיקה**, ⛔ ומתחת ל-4.5:1 של **טקסט קטן** (שכבה א׳). ⇒ הספרה
                    ב-`--arena-ink`, והכחול עובר לגבול הכפתור הזמין, שם 3:1 הוא הרצפה
                    הנכונה. ⛔ **וגודלה 12 ⛔ ולא 11** — `D-137`: ⛔ אין בזירה מספר גופן
                    מתחת ל-12. שתיהן סטיות מהרנדר ש**שכבה א׳ מחייבת** (`36 § 14.4`). */}
                <span
                  aria-hidden
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--arena-stone-dark)] text-xs font-bold text-[color:var(--arena-ink)]"
                >
                  <EnWord>{`${ABILITY_COST[key]}`}</EnWord>
                </span>
                <span className="text-xs font-bold">{ABILITY_HE[key]}</span>
                <span className="sr-only">
                  {' · '}
                  {ABILITY_COST_SR_HE} {ABILITY_COST[key]} {ABILITY_MANA_SR_HE}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⓖ הערת הבידוד — אינווריאנט `37 § 13.1`, והשורה התחתונה ברנדר.
          ⟦17/09 · `C-0709` · `T-423`ⓑ⟧ **והיא הרצועה התחתונה, 20px מוצהרים**: Figma
          נותן ‏832→852 מתחת ל-`abilities` (`3319:33` נגמר ב-832) ⛔ בלי לצייר שם דבר,
          וההערה הזאת — שהיא **אינווריאנט**, ⛔ ולא קישוט — היא מה שיושב שם במוצר.
          ‏`text-xs` הוא 16px גובה שורה ⇒ נכנס ב-20 בלי להידחס. */}
      <p
        className="flex h-[20px] shrink-0 items-center justify-center text-center text-xs text-[color:var(--arena-ink-dim)]"
        data-arena-isolation
      >
        {ARENA_ISOLATION_HE}
      </p>

      {/* 🔴 **⟦NEW 16/09 · `C-0665` · `T-359`⟧ הרפאים — הפריים שהיה חסר בין היד ליריב.**
          ⛔ **אחרון בעץ, ⛔ ולא ליד היד:** הוא `fixed`, ⇒ מיקומו ⛔ אינו תלוי בהורה —
          אבל סדר ה-DOM הוא מה שמשאיר אותו **מעל** בלי `z-index` שמתחרה בשכבות הבמה.
          ⛔ `aria-hidden` ו-`pointer-events-none`: הוא ⛔ אינו מידע ו⛔ אינו יעד מגע —
          מסלול הנגישות של `§ 5` (הקשה על היריב) ⛔ לא נגע, ⛔ ואסור לו להיחסם.
          ⛔ **⛔ ואין כאן `setTimeout`:** `onAnimationEnd` הוא מה שמפנה אותו, בדיוק
          כמו הקיפאון והרעד — שעון ב-JS היה נפרד מהמספר שב-CSS ומתחיל לסטות ממנו. */}
      {/* 👻 **⟦17/09 · `C-0672` · `T-403`⟧ יד הרפאים — `37 § 5` («גילוי»).**
          ⛔ **הפסקה מעל היד ⛔ לא הוחלפה ו⛔ לא נגרעה** (ⓒ של השורה): היא מסלול
          הנגישות, והיא היחידה שקיימת תחת `prefers-reduced-motion`. ⇒ התנועה
          **מוסיפה** ערוץ, ⛔ ואינה מחליפה ערוץ.
          ⛔ `aria-hidden` ו-`pointer-events-none`: ⛔ אינה מידע ו⛔ אינה יעד מגע —
          מסלול הנגישות של `§ 5` (הקשה על היריב) ⛔ אסור לו להיחסם.
          ⛔ **⛔ ואין `setTimeout`:** `onAnimationEnd` יורה **פעם אחת** אחרי המחזור
          האחרון של `animation-iteration-count: 2`, ⇒ «לכל היותר שני מחזורים» הוא
          מספר ב-CSS, ⛔ ולא שעון ב-JS שמתחיל לסטות ממנו. */}
      {teach !== null && (
        <div
          key={teach.key}
          data-arena-teach
          aria-hidden
          onAnimationEnd={() => setTeach(null)}
          style={{
            position: 'fixed',
            left: `${teach.x}px`,
            top: `${teach.y}px`,
            width: `${TEACH_SIZE}px`,
            height: `${TEACH_SIZE}px`,
            /* ⛔ שני משתנים, ⛔ ולא `transform` מוטבע — `style` מוטבע **גובר** על כל
               כלל CSS ⇒ הוא היה מוחק את האנימציה עצמה. אותה מדידה של `T-359`. */
            ['--arena-teach-dx' as string]: `${teach.dx}px`,
            ['--arena-teach-dy' as string]: `${teach.dy}px`,
          }}
          className="pointer-events-none z-40 rounded-full border-2 border-[color:var(--arena-gold-light)] bg-[color:var(--arena-gold)]"
        />
      )}

      {throwFx !== null && (
        <div
          key={throwFx.key}
          data-arena-throw
          aria-hidden
          onAnimationEnd={() => setThrowFx(null)}
          onTransitionEnd={() => setThrowFx(null)}
          style={{
            position: 'fixed',
            left: `${throwFx.x}px`,
            top: `${throwFx.y}px`,
            width: `${throwFx.w}px`,
            height: `${throwFx.h}px`,
            /* ⛔ שני משתנים, ⛔ ולא `transform` מוטבע: ‏`style` מוטבע **גובר** על כל
               כלל CSS ⇒ הוא היה מוחק את האנימציה עצמה. אותה מדידה בדיוק שנרשמה
               ב-`SpellCard` ב-`T-361`. ⇒ ה-CSS מרכיב, וה-JS רק **מוסר את ההיסט**. */
            ['--arena-throw-dx' as string]: `${throwFx.dx}px`,
            ['--arena-throw-dy' as string]: `${throwFx.dy}px`,
          }}
          className="pointer-events-none z-50 flex items-center justify-center rounded-xl border-2 border-[color:var(--arena-gold)] bg-[color:var(--arena-card)] text-sm font-bold text-[color:var(--arena-ink)]"
        >
          {throwFx.label}
        </div>
      )}

      {/* 🔥 **⟦19/09 · `C-0732` · `T-434`⟧ הכדור.** ⛔ **אותו דפוס של `throwFx`
          מילה במילה:** `fixed` ⟨הנתיב חוצה שני הורים עם `overflow-hidden`⟩, היסט
          כשני משתנים ⟨`style` מוטבע היה **דורס** את האנימציה⟩, ושחרור ב-`onAnimationEnd`.
          ⛔ **אפס `setTimeout`** — הבדיקה אוסרת אותם בקובץ כולו. */}
      {boltFx !== null && (
        <div
          key={boltFx.key}
          data-arena-bolt
          aria-hidden
          onAnimationEnd={() => setBoltFx(null)}
          onTransitionEnd={() => setBoltFx(null)}
          style={{
            position: 'fixed',
            left: `${boltFx.x}px`,
            top: `${boltFx.y}px`,
            width: `${BOLT_SIZE}px`,
            height: `${BOLT_SIZE}px`,
            ['--arena-bolt-dx' as string]: `${boltFx.dx}px`,
            ['--arena-bolt-dy' as string]: `${boltFx.dy}px`,
          }}
          className="pointer-events-none z-50 rounded-full bg-[color:var(--arena-cast-warn)]"
        />
      )}
    </section>
  );
}
