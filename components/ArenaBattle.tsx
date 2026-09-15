'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActionBar from '@/components/ActionBar';
import ArenaResult, { type ArenaMissed } from '@/components/ArenaResult';
import ArenaStage from '@/components/ArenaStage';
import ArenaSummary from '@/components/ArenaSummary';
import SpellCard from '@/components/SpellCard';
import CloseIcon from '@/components/CloseIcon';
import EnWord from '@/components/EnWord';
import { apiGet, apiPost } from '@/lib/api/client';
import type { ArenaCharacter } from '@/lib/core/arenaCharacter';
import { mixArenaWords, type ArenaWord, type ArenaWordKind } from '@/lib/core/arenaWords';
import { resolveGesture } from '@/lib/core/arenaGesture';
import { endingOf, summarize } from '@/lib/core/arenaSummary';
import {
  BATTLE_MS,
  ENEMY_HP,
  MANA_CAP,
  cast,
  dodge,
  isRage,
  manaAt,
  returnedSpell,
  stagePhase,
  startBattle,
  telegraphAt,
  tick,
  type BattleState,
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
const MANA_HE = 'מאנה';
const RAGE_HE = 'זמן זעם · מאנה כפולה';
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
const CASTING_METER_HE = 'היריב מטיל';
const DODGED_HE = 'התחמקות!';
const FIRE_HE = 'שגר לחש';
const FIRE_HINT_HE = 'בחר קלף לחש כדי לשגר';
/** ⛔ זיכרון מכשיר, ⛔ ולא התקדמות למידה — ⛔ אינו נקודות, ⛔ אינו רצף, ⛔ אינו נוגע ב-`word_progress`. */
export const ARENA_TAUGHT_KEY = 'kol.arena.dragTaught';
const DRAG_HINT_HE = 'גרור קלף כלפי מעלה כדי להטיל · או הקש על קלף ואז על היריב';
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

export default function ArenaBattle({ initialRound, character = null }: ArenaBattleProps = {}): React.JSX.Element {
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
  const manaFillRef = useRef<HTMLSpanElement>(null);
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
  const [damage, setDamage] = useState<{ readonly amount: number; readonly key: number } | null>(null);
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
  const castCount = battle === null ? 0 : battle.casts.length;
  useEffect(() => {
    if (castCount === 0 || reducedMotion) return;
    if (battle === null || stagePhase(battle) !== 'hit') return;
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
    try { window.localStorage.setItem(ARENA_TAUGHT_KEY, '1'); } catch { /* ⛔ אחסון חסום ⛔ אינו שגיאה */ }
    setChosenSoFar((prev) => [...prev, option]);
    setBattle((prev) => (prev === null ? prev : cast(prev, option, elapsedRef.current)));
  }, []);

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
    const step = (now: number) => {
      if (originRef.current === null) originRef.current = now;
      const next = now - originRef.current;
      elapsedRef.current = next;

      setBattle((prev) => (prev === null ? prev : tick(prev, next)));

      const telegraph = telegraphAt(next);
      if (telegraph.phase !== lastPhase) {
        lastPhase = telegraph.phase;
        setTelegraphPhase(telegraph.phase);
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
        if (mana !== lastMana) {
          lastMana = mana;
          if (manaTextRef.current !== null) manaTextRef.current.textContent = `${mana} / ${MANA_CAP}`;
          if (manaFillRef.current !== null) manaFillRef.current.style.transform = `scaleX(${mana / MANA_CAP})`;
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
   * בין רינדורים חי בכתיבת ה-ref שבלולאת ה-rAF (`manaTextRef` / `manaFillRef`).
   */
  const mana = battle === null ? 0 : manaAt(elapsedRef.current, battle.manaSpent);

  if (screen.kind === 'loading') {
    return (
      <section className="flex min-h-[100dvh] flex-col gap-6 pb-28">
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
      <section className="flex min-h-[100dvh] flex-col gap-4 pb-28">
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
      <section className="flex min-h-[100dvh] flex-col gap-4 pb-28">
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
  const enemyPct = Math.round((battle.enemyHp / Math.max(1, battle.enemyHpMax)) * 100);
  /**
   * ⛔ **מגיע** מהשכבה הטהורה — הרכיב ⛔ אינו סופר 5.3, ⛔ אינו סופר 5.7 ו⛔ אינו יודע מהו
   * חלון. T-231 ⓓ — `raging` ו-`telegraphPhase` הם עכשיו ה-state (מוגדר למעלה), ומתעדכנים
   * רק כשהערך הבדיד עצמו משתנה. `telegraphFrac` הוא ערך **פתיחה** בלבד, בדיוק כמו `mana`
   * למעלה — העדכון הרציף חי בכתיבת ה-ref שבלולאת ה-rAF.
   */
  const telegraphFrac = telegraphAt(elapsedRef.current).frac;

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
      className="relative flex h-[calc(100dvh-5.25rem)] flex-col gap-2 overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {/* 🔴 **⟦15/09 · `C-0623` · `T-361`⟧ היציאה **מרחפת**, ⛔ ואינה שורה משלה.**
          🔬 נמדד: העמודה חילקה 580px כך שהבמה — הקרב עצמו — קיבלה **52px, 9% מהמסך**,
          בעוד ה-X לבדו אכל 44 ועוד רווח. ⇒ ברנדר (`kol-B-03`) כפתור ההשהיה **מרחף
          מעל הזירה**, ⛔ ואינו תופס שורה. ⛔ יעד המגע ⛔ לא רוכך — `CLOSE_CLASS` עדיין
          נושא את מידותיו, והוא רק יצא מזרימת העמודה. */}
      <div className="absolute end-0 top-0 z-10">
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
      <div className="flex flex-row items-baseline justify-center gap-2" data-arena-clock>
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

      {/* ⓑ באנר המילה — היריב מטיל מילה, והיא באנגלית מעליו (`37 § 5`).
          ⛔ אנגלית עוברת ב-`<EnWord>` בלבד (חוקה § 2 · `36 § 14`). */}
      <div
        data-arena-banner
        className="rounded-2xl border-2 border-[color:var(--arena-gold)] bg-[color:var(--arena-stone-dark)] px-4 py-2 text-center"
      >
        <EnWord className="text-4xl font-black tracking-wide text-[color:var(--arena-gold-light)]">
          {word?.headword ?? ''}
        </EnWord>
      </div>

      {/* ⓓ הבמה — שתי הדמויות. ⛔ **התנועה חיה כאן ובלבד** (T-041, עקרון הקוהרנטיות
          של Mayer): אזור היד שמתחת ⛔ לעולם אינו זז. התנוחה מגיעה מ-`stagePhase` שבחוק. */}
      {/* ⛔ **`onAnimationEnd` הוא ה«טיימר», והוא ⛔ אינו טיימר:** האנימציה הנושאת ב-CSS
          נגמרת אחרי `--arena-hitstop-ms`, והאירוע הזה הוא מה שמשחרר את הקיפאון. ⇒ המספר
          חי בקובץ הטוקנים ⛔ ולא כאן, והשם נבדק כי אנימציות אחרות בבמה מבעבעות למעלה. */}
      <div
        data-arena-stage-area
        data-arena-impact={impact}
        data-arena-crit={crit === 'off' ? undefined : crit}
        onAnimationEnd={(e) => {
          if (e.animationName.startsWith('arena-hitstop')) setImpact('off');
          // ⟦15/09⟧ הרעד משוחרר באותו מנגנון בדיוק — ⛔ אין כאן `setTimeout` חדש.
          if (e.animationName === 'arena-crit-shake') setCrit('off');
        }}
        /* ⟦15/09 · `F-260`⟧ `flex-1 min-h-0` — **הבמה בולעת את מה שנשאר.** ⛔ `min-h-0`
           ⛔ אינו קישוט: ילד flex מקבל `min-height:auto` כברירת מחדל ולכן **מסרב
           להתכווץ מתחת לתוכנו**, וזה בדיוק מה שדוחף ילדים אחרים מתחת לקפל. */
        className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-2xl bg-[color:var(--arena-night)]"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => { stageFrom.current = { x: e.clientX, y: e.clientY }; }}
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
          // ⛔ `move` ⛔ אינו «התחמקות» — `dodge` בליבה מכריע אם הוא נפל בתוך החלון.
          // ⛔ הרכיב ⛔ אינו יודע מהו חלון, ו⛔ אינו סופר 400 מילישניות.
          if (gesture?.kind === 'move') setBattle((prev) => (prev === null ? prev : dodge(prev, elapsedRef.current)));
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
            onClick={() => { if (selected !== null) fire(selected); }}
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
              {/* 🔴 **⟦NEW 15/09 · `C-0622` · `T-358`⟧ כמה. ⛔ עד היום ⛔ שום דבר ⛔ לא ענה על זה.**

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
                <span
                  key={damage.key}
                  data-arena-damage
                  aria-hidden
                  onAnimationEnd={() => setDamage(null)}
                  className="pointer-events-none absolute -top-5 end-2 text-base font-black tabular-nums text-[color:var(--arena-gold-light)]"
                >
                  <EnWord>{`−${damage.amount}`}</EnWord>
                </span>
              )}
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
        <ArenaStage phase={stagePhase(battle)} items={[]} character={character} />
        {battle.dodgedSwing !== null && (
          <p className="mt-2 text-center text-sm font-black text-[color:var(--arena-dodge)]" role="status" aria-live="polite">
            {DODGED_HE}
          </p>
        )}
      </div>

      {/* ⓔ מד המאנה — `מאנה N / 10`, ובזמן זעם התווית מתחלפת.
          ⛔ **מענה ⛔ אינו מעלה מאנה אף פעם** (`37 § 4`): הלמידה ⛔ אינה נחסמת מאחורי
          משאב. ⚠️ **המד מצויר ומחושב; ארבע היכולות (`הקפאה`·`מגן`·`כפול`·`ריפוי`)
          ⛔ אינן בפרוסה הזאת** — הרנדר מצייר את שורתן, וזה **פער מוצהר**, ⛔ לא השמטה. */}
      <div className="flex flex-col gap-1" data-arena-mana>
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
        {/* T-231 ⓑ — `scaleX`, ⛔ ולא `width` (apple-design § 11). */}
        <div
          ref={manaMeterWrapRef}
          role="img"
          aria-label={`${raging ? RAGE_HE : MANA_HE} ${mana} מתוך ${MANA_CAP}`}
          className="h-4 w-full overflow-hidden rounded-full border border-[color:var(--arena-stone)] bg-[color:var(--arena-stone-dark)]"
        >
          {/* T-231 ⓑ — `left center`, ⛔ ולא `right`: אותו נימוק כמו מד הטלגרף למעלה —
              `width` פיזי על `<span>` שאינו `absolute` תמיד עוגן שמאל, בלי קשר ל-`dir`. */}
          <span
            ref={manaFillRef}
            aria-hidden
            className={`block h-full w-full ${raging ? 'bg-[color:var(--arena-cast-warn)]' : 'bg-[color:var(--arena-mana)]'}`}
            style={{ transform: `scaleX(${mana / MANA_CAP})`, transformOrigin: 'left center', willChange: 'transform' }}
          />
        </div>
      </div>

      {/* ⓕ היד — ארבעה קלפי לחש **בעברית** (`37 § 5`). ⛔ הגרירה היא T-178, וההקשה
          ⛔ אינה «מסלול זמני»: `§ 5` קורא לגרירה «מסלול **נוסף**», והקשה נשארת.
          ⛔ קלף `?` נושא את הסימן **וגם** את התווית העברית — סימן לבדו הוא קידוד
          בערוץ אחד ומפר את שכבה א׳ א2. */}
      {/* ⛔ הרמז יושב **מעל** היד ו⛔ לעולם לא עליה (קוהרנטיות, T-041): אזור היד
          ⛔ אינו זז, ולכן הרמז ⛔ אינו יכול להיות שכבה מעליו. */}
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

      <ul data-arena-hand className="grid grid-cols-4 gap-2">
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
                if (selected === option.he) fire(option.he);
                else setSelected(option.he);
              }}
              onCast={() => fire(option.he)}
            />
          </li>
        ))}
      </ul>

      {/* ⓖ הערת הבידוד — אינווריאנט `37 § 13.1`, והשורה התחתונה ברנדר. */}
      <p className="text-center text-xs text-[color:var(--arena-ink-dim)]" data-arena-isolation>
        {ARENA_ISOLATION_HE}
      </p>
    </section>
  );
}
