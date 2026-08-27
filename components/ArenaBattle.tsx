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
import { mixArenaWords, type ArenaWord } from '@/lib/core/arenaWords';
import { resolveGesture } from '@/lib/core/arenaGesture';
import { summarize } from '@/lib/core/arenaSummary';
import {
  BATTLE_MS,
  MANA_CAP,
  cast,
  dodge,
  isRage,
  manaAt,
  outcomeAt,
  stagePhase,
  startBattle,
  telegraphAt,
  tick,
  type BattleState,
} from '@/lib/core/battle';
import type { ArcadeAnswer } from '@/lib/core/arcadeResult';
import type { ArcadeQuestion } from '@/lib/core/arcadeRound';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

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
 * (‏`RULES § 0.16` — «גבולות מודול» הוא קריאה של DEV; נרשמה בסיכום הטיק.)
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

type RoundBody =
  | {
      readonly ok: true;
      readonly level: string | null;
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
}

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly level: string }
  | { readonly kind: 'no_level' }
  | { readonly kind: 'too_small'; readonly eligible: number | null; readonly required: number | null }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'error' };

/**
 * ⚠️ **חיי הצדדים, ⛔ ולא מה שהפס מציג.** הרנדר מצייר `100/100`, ו-`render_video_B.py:475`
 * מראה מה זה **באמת**: `f"{int(st['hp']*100)}/100"` — כלומר **אחוז**, ⛔ ולא HP גולמי.
 * ⇒ הפס מציג אחוז (נאמנות לרנדר), והסולם הפנימי נבחר כך שהקרב יהיה **מרוץ**:
 * ‏11 מכות יריב ב-90 שניות מול 12 חיי לומד, ו-~16 אחזורים מול 20 חיי יריב.
 * ⛔ סולם של 100/100 עם נזק 1 למכה היה קרב שאי-אפשר להכריע בו — 11% נזק בקרב שלם.
 */
const LEARNER_HP = 12;
const ENEMY_HP = 20;

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
 * (`RULES § 0.16`), ונרשמה בסיכום הטיק.
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
const SAVING_HE = 'שומר את הקרב…';
const FINISHED_HE = 'הקרב נגמר';
const BACK_TO_CARDS_HE = 'חזרה לכרטיסיות';
const CHOOSE_LEVEL_HE = 'בחירת רמה';
const NO_LEVEL_HE = 'עוד לא בחרת רמה, ובלעדיה אין למי להעמיד יריב.';
const TOO_SMALL_HE = 'ברמה הזאת עוד אין מספיק מילים לקרב.';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const LOADING_HE = 'טוען את הזירה…';
const MISSING_NUMBER_HE = '—';

const PRIMARY_ACTION_CLASS =
  'inline-flex w-full min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-center text-lg font-semibold text-brand-on active:opacity-90';
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
 * ⚠️ **ומה שנמסר לה היום הוא בכוונה שורה 1 בטבלה של `§ 2`:** קריאת מחסן ה«ידעתי»
 * ⛔ אינה בפרוסה הזאת, ⇒ כל מילה היא **מילת בסיס**, וזה בדיוק מצב «מחסן ריק ⇒ 100%
 * מילות בסיס». ⛔ זו ⛔ אינה עקיפה של הפונקציה — זה הענף שהיא מגדירה למשתמש חדש.
 */
function wordsOf(questions: readonly ArcadeQuestion[]): readonly ArenaWord[] {
  const base: readonly ArenaWord[] = questions.map((q) => ({
    wordId: q.wordId,
    headword: q.headword,
    translationHe: q.answer,
    kind: 'base' as const,
  }));
  return mixArenaWords({ known: [], unfiltered: [], base, size: base.length });
}

export default function ArenaBattle({ initialRound }: ArenaBattleProps = {}): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenState>(
    initialRound === undefined ? { kind: 'loading' } : { kind: 'ready', level: initialRound.level },
  );
  const [questions, setQuestions] = useState<readonly ArcadeQuestion[]>(
    initialRound === undefined ? [] : initialRound.questions,
  );
  const [battle, setBattle] = useState<BattleState | null>(
    initialRound === undefined
      ? null
      : startBattle(wordsOf(initialRound.questions), LEARNER_HP, ENEMY_HP),
  );
  const [elapsedMs, setElapsedMs] = useState(0);
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
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    // ⛔ `try/catch`: דפדפן שחוסם אחסון ⛔ אינו מפיל את הזירה — הרמז פשוט ⛔ אינו נשמר.
    try { setShowHint(window.localStorage.getItem(ARENA_TAUGHT_KEY) !== '1'); }
    catch { setShowHint(false); }
  }, []);

  /** ⛔ ההטלה חיה **במקום אחד** — שני המסלולים (`§ 5`) נכנסים לכאן, ⛔ ולא כל אחד לעצמו. */
  const fire = useCallback((option: string) => {
    setSelected(null);
    setShowHint(false);
    try { window.localStorage.setItem(ARENA_TAUGHT_KEY, '1'); } catch { /* ⛔ אחסון חסום ⛔ אינו שגיאה */ }
    setChosenSoFar((prev) => [...prev, option]);
    setBattle((prev) => (prev === null ? prev : cast(prev, option, elapsedMs)));
  }, [elapsedMs]);

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
      if (body.level === null) {
        setScreen({ kind: 'no_level' });
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
      setQuestions(body.round.questions);
      setBattle(startBattle(wordsOf(body.round.questions), LEARNER_HP, ENEMY_HP));
      originRef.current = null;
      setElapsedMs(0);
      setScreen({ kind: 'ready', level: body.level });
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
   */
  useEffect(() => {
    if (battle === null || screen.kind !== 'ready') return;
    let frame = 0;
    let stopped = false;
    const step = (now: number) => {
      if (originRef.current === null) originRef.current = now;
      const next = now - originRef.current;
      setElapsedMs(next);
      setBattle((prev) => (prev === null ? prev : tick(prev, next)));
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

  const result = battle === null ? 'running' : outcomeAt(battle, elapsedMs);
  const finished = result !== 'running';

  useEffect(() => {
    if (battle === null || !finished || submitted) return;
    setSubmitted(true);
    // ⛔ החוזה של `POST /api/arcade/result` ⛔ לא השתנה בפרוסה הזאת: `ArcadeAnswer` נושא
    // `chosen` ו-`answer`, ולכן ההצלבה נעשית כאן מול השאלות שכבר בידנו.
    const answers: readonly ArcadeAnswer[] = battle.casts.map((c, i) => ({
      wordId: c.wordId,
      correct: c.correct,
      chosen: chosenSoFar[i] ?? '',
      answer: battle.words[i]?.translationHe ?? '',
    }));
    void send({ runId: crypto.randomUUID(), answers });
  }, [battle, finished, submitted, chosenSoFar, send]);

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
    setElapsedMs(0);
    if (initialRound !== undefined) {
      setQuestions(initialRound.questions);
      setBattle(startBattle(wordsOf(initialRound.questions), LEARNER_HP, ENEMY_HP));
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

  const mana = useMemo(
    () => (battle === null ? 0 : manaAt(elapsedMs, battle.manaSpent)),
    [battle, elapsedMs],
  );

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
      screen.kind === 'no_level'
        ? NO_LEVEL_HE
        : screen.kind === 'too_small'
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
          ) : screen.kind === 'no_level' || screen.kind === 'too_small' ? (
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
            enemyDefeated={outcome.enemyDefeated}
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
            <Link href="/cards" data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
              {BACK_TO_CARDS_HE}
            </Link>
          </div>
        </ActionBar>
      </section>
    );
  }

  const word = battle.words[battle.index];
  const hand = questions[battle.index]?.options ?? [];
  const enemyPct = Math.round((battle.enemyHp / Math.max(1, battle.enemyHpMax)) * 100);
  const raging = isRage(elapsedMs);
  /** ⛔ **מגיע** מהשכבה הטהורה — הרכיב ⛔ אינו סופר 5.3, ⛔ אינו סופר 5.7 ו⛔ אינו יודע מהו חלון. */
  const telegraph = useMemo(() => telegraphAt(elapsedMs), [elapsedMs]);

  return (
    <section
      data-arena-scope
      className="flex min-h-[100dvh] flex-col gap-4 pb-28"
    >
      {topBar(null)}

      {/* ⓐ השעון — `זמן קרב m:ss`. ⛔ **שעון אחד לקרב שלם** (`37 § 3`), ⛔ ולא טיימר
          לשאלה: טיימר לשאלה הופך אחזור מאומץ למרוץ ומעניש בדיוק את הלומד האיטי
          שהזירה אמורה לאמן. הערך מגיע מ-`BATTLE_MS` ⛔ ואינו נספר כאן. */}
      <div className="flex flex-col items-center gap-1" data-arena-clock>
        <p className="text-sm font-bold text-[color:var(--arena-gold)]">{CLOCK_HE}</p>
        <p
          className="text-4xl font-black tabular-nums text-ink"
          role="timer"
          aria-label={`${CLOCK_HE} ${clockHe(BATTLE_MS - elapsedMs)}`}
        >
          <EnWord>{clockHe(BATTLE_MS - elapsedMs)}</EnWord>
        </p>
      </div>

      {/* ⓑ באנר המילה — היריב מטיל מילה, והיא באנגלית מעליו (`37 § 5`).
          ⛔ אנגלית עוברת ב-`<EnWord>` בלבד (חוקה § 2 · `36 § 14`). */}
      <div
        data-arena-banner
        className="rounded-2xl border-2 border-[color:var(--arena-gold)] bg-[color:var(--arena-stone-dark)] px-4 py-4 text-center"
      >
        <EnWord className="text-4xl font-black tracking-wide text-[color:var(--arena-gold-light)]">
          {word?.headword ?? ''}
        </EnWord>
      </div>

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
        {telegraph.phase !== 'quiet' && (
          <div className="flex flex-col items-center gap-1" data-arena-cast data-arena-cast-phase={telegraph.phase}>
            {telegraph.phase !== 'charging' && (
              <p className="text-xs font-black text-[color:var(--arena-cast-warn)]" role="status" aria-live="polite">
                {CASTING_HE}
              </p>
            )}
            <div
              role="img"
              aria-label={`${CASTING_METER_HE} ${Math.round(telegraph.frac * 100)} אחוז`}
              className="h-[9px] w-[70px] max-w-full overflow-hidden rounded-full border border-[color:var(--arena-cast-edge)] bg-[color:var(--arena-night)]"
            >
              <span
                aria-hidden
                className={`block h-full ${telegraph.phase === 'charging' ? 'bg-[color:var(--arena-cast)]' : 'bg-[color:var(--arena-cast-warn)]'}`}
                style={{ width: `${telegraph.frac * 100}%` }}
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
            className="relative h-6 w-full overflow-hidden rounded-full border border-[color:var(--arena-gold)] bg-[color:var(--arena-stone-dark)]"
          >
            <span
              aria-hidden
              className="absolute inset-y-0 end-0 bg-danger"
              style={{ width: `${enemyPct}%` }}
            />
            <span
              aria-hidden
              className="absolute inset-0 grid place-items-center text-xs font-bold text-brand-on"
            >
              {/* ⛔ אחוז, ⛔ ולא HP גולמי — בדיוק מה ש-`render_video_B.py:475` מצייר. */}
              <EnWord>{`${enemyPct}/100`}</EnWord>
            </span>
          </div>
        </button>
      </div>

      {/* ⓓ הבמה — שתי הדמויות. ⛔ **התנועה חיה כאן ובלבד** (T-041, עקרון הקוהרנטיות
          של Mayer): אזור היד שמתחת ⛔ לעולם אינו זז. התנוחה מגיעה מ-`stagePhase` שבחוק. */}
      <div
        data-arena-stage-area
        className="rounded-2xl bg-[color:var(--arena-night)] px-4 py-6"
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
          if (gesture?.kind === 'move') setBattle((prev) => (prev === null ? prev : dodge(prev, elapsedMs)));
        }}
        onPointerCancel={() => { stageFrom.current = null; }}
      >
        <ArenaStage phase={stagePhase(battle)} items={[]} />
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
            className={`text-sm font-semibold ${raging ? 'text-danger' : 'text-ink-muted'}`}
          >
            {raging ? RAGE_HE : MANA_HE}
          </span>
          <span className={`text-sm font-bold ${raging ? 'text-danger' : 'text-brand-surface'}`}>
            <EnWord>{`${mana} / ${MANA_CAP}`}</EnWord>
          </span>
        </div>
        <div
          role="img"
          aria-label={`${raging ? RAGE_HE : MANA_HE} ${mana} מתוך ${MANA_CAP}`}
          className="h-4 w-full overflow-hidden rounded-full border border-border-subtle bg-[color:var(--arena-stone-dark)]"
        >
          <span
            aria-hidden
            className={`block h-full ${raging ? 'bg-danger' : 'bg-brand-surface'}`}
            style={{ width: `${(mana / MANA_CAP) * 100}%` }}
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
        <p data-arena-hint className="text-center text-xs text-ink-muted">{DRAG_HINT_HE}</p>
      )}

      <ul data-arena-hand className="grid grid-cols-4 gap-2">
        {hand.map((option) => (
          <li key={option}>
            <SpellCard
              label={option}
              unknown={option === '?'}
              selected={selected === option}
              reducedMotion={reducedMotion}
              onSelect={() => setSelected((prev) => (prev === option ? null : option))}
              onCast={() => fire(option)}
            />
          </li>
        ))}
      </ul>

      {/* ⓖ הערת הבידוד — אינווריאנט `37 § 13.1`, והשורה התחתונה ברנדר. */}
      <p className="text-center text-xs text-ink-muted" data-arena-isolation>
        {ARENA_ISOLATION_HE}
      </p>
    </section>
  );
}
