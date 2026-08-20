'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ActionBar from '@/components/ActionBar';
import ArenaResult, { type ArenaMissed } from '@/components/ArenaResult';
import CloseIcon from '@/components/CloseIcon';
import EnWord from '@/components/EnWord';
import { apiGet, apiPost } from '@/lib/api/client';
import {
  advance,
  ammoLeft,
  chooseOption,
  isFinished,
  startBattle,
  type BattleState,
} from '@/lib/core/arcadeBattle';
import type { ArcadeAnswer } from '@/lib/core/arcadeResult';
import type { ArcadeQuestion } from '@/lib/core/arcadeRound';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

/**
 * `/arcade` — מסך הקרב. T-095 · § 4.2י · D-044 · D-045 · D-046 · D-047 · D-050 · D-028.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב.** כל חוק של הקרב חי ב-`lib/core/arcadeBattle.ts`, והקוד
 * כאן קורא ל-`chooseOption` ול-`advance` ⛔ ואינו נוגע בחיי היריב בעצמו. רכיב שמוריד חיים
 * לבד הוא עותק שני של החוק, והשני תמיד סוטה מהראשון.
 *
 * ⛔ **אין בקובץ הזה שעון** (D-045 · R-020): החשיפה נשארת על המסך עד שהלומד מקיש «הבא».
 * זו הסיבה שאין כאן `setTimeout` — ⛔ לא שכחנו אותו, הוא אסור.
 *
 * ⛔ **אין כאן שבח ואין נזיפה** (R-016 · § 4.2י שאלה 3): התווית ליד האפשרות הנכונה היא
 * «התשובה הנכונה», והתווית ליד מה שהוקש היא «מה שבחרת». עובדה, ⛔ לא שיפוט.
 *
 * ⛔ **אין כאן דאטהבייס.** שתי נקודות קצה, ובלבד: `GET /api/arcade/round` ו-
 * `POST /api/arcade/result`, שתיהן דרך `lib/api/client.ts`.
 *
 * ⚠️ **מסך זרימה, ולכן `<ActionBar>` ו⛔ לא `<TabBar>`** (D-028). המבנה אוכף את זה:
 * `app/arcade/page.tsx` יושב **מחוץ** ל-`app/(tabs)/`, בדיוק כמו `/world/compose`.
 */

/** בדיוק שש התשובות של `GET /api/arcade/round` (`docs/api-contract.md`), ⛔ ולא ארבע. */
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

/** בדיוק מה ש-`POST /api/arcade/result` עונה. ⛔ `missed` הוא ערך לתצוגה (D-047). */
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

/**
 * גוף הבקשה של סוף הקרב — **`answers` ובלבד** (D-067ⓑ).
 * ⛔ אין כאן שדה סף: השרת גוזר אותו ב-`requiredHits(max(answers.length, ARCADE_AMMO))`,
 * ושדה סף בגוף הבקשה הוא הזמנה לזייף ניצחון.
 */
type ResultPayload = {
  readonly answers: readonly ArcadeAnswer[];
};

export interface ArenaRound {
  readonly level: string;
  readonly questions: readonly ArcadeQuestion[];
}

/**
 * `initialRound` — ⛔ אך ורק לפיקסטורה, בדיוק כמו `ComposeDraftProps.initialBank` ומאותה
 * סיבה מדודה: `check:mobile` מריץ `next start` בלי env של Supabase, ולכן הנתיב האמיתי מגיע
 * ל-503 של החוזה שלו עצמו — והמילה, ארבע האפשרויות ומד חיי היריב לא היו על המסך אף פעם.
 * ⛔ `/arcade` אינו מעביר אותו.
 */
export interface ArenaBoardProps {
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

const HEADING_HE = 'הזירה';
const ENEMY_HP_HE = 'חיי היריב';
const CLOSE_HE = 'סגור';
const NEXT_HE = 'הבא';
const CORRECT_HE = 'התשובה הנכונה';
const CHOSEN_HE = 'מה שבחרת';
const FINISHED_HE = 'הקרב נגמר';
const SAVING_HE = 'שומר את הקרב…';
const BACK_TO_CARDS_HE = 'חזרה לכרטיסיות';
const CHOOSE_LEVEL_HE = 'בחירת רמה';
const NO_LEVEL_HE = 'עוד לא בחרת רמה, ובלעדיה אין למי להעמיד יריב.';
const TOO_SMALL_HE = 'ברמה הזאת עוד אין מספיק מילים לקרב.';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const LOADING_HE = 'טוען את הזירה…';

/**
 * D-070 — ⛔ שני המספרים באותה שורה, כי המתח הוא **היחס ביניהם**: תחמושת שנשרפת
 * מהר מול יריב שעוד עומד. ⛔ אין כאן ספירה לאחור, שעון, מכפיל וניקוד (D-045 · D-050).
 * ⛔ והיחיד ⛔ אינו «1 קליעים» — נאמנות דקדוקית לאותו נוסח, ⛔ ולא נוסח שני.
 */
const AMMO_ONE_HE = 'נשאר לך קליע אחד';
const statusHe = (ammo: number, hp: number): string =>
  ammo === 1 ? `${AMMO_ONE_HE} · ליריב ${hp} חיים` : `נשארו לך ${ammo} קליעים · ליריב ${hp} חיים`;

/** `—` ⛔ אינו `0` (`DeckSelector.tsx:58`): מספר שאין לנו אינו מספר אפס. */
const MISSING_NUMBER_HE = '—';

const PRIMARY_ACTION_CLASS =
  'inline-flex w-full min-h-touch items-center rounded-lg bg-brand-surface px-5 py-3 text-center text-lg font-semibold text-brand-on active:opacity-90';

const CLOSE_CLASS =
  'inline-grid min-h-touch min-w-touch place-items-center rounded-lg text-ink active:opacity-90';

const OPTIONS_GRID_CLASS = 'grid grid-cols-2 gap-3';

const OPTION_CLASS =
  'flex w-full min-h-touch items-center rounded-lg border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink transition-opacity duration-200 active:opacity-90';

const PIP_ON_CLASS = 'h-3 w-6 rounded-md bg-danger';
const PIP_OFF_CLASS = 'h-3 w-6 rounded-md bg-surface-raised border border-border-strong';

/**
 * ⛔ `Array.from` אסור כאן: הבדיקה אוסרת `.from(` כדי לחסום גישה לדאטהבייס מרכיב ממשק.
 * ⛔ ו⛔ אינו קבוע מודול יותר (D-067ⓑ): המקסימום נגזר מאורך הסיבוב, ולכן הוא נבנה
 * מתוך המצב בכל רנדר ⛔ ולא פעם אחת מ-`ARCADE_ENEMY_HP`.
 */
const hpPips = (max: number): readonly number[] => [...Array(max).keys()];

export default function ArenaBoard({ initialRound }: ArenaBoardProps = {}): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenState>(
    initialRound === undefined
      ? { kind: 'loading' }
      : { kind: 'ready', level: initialRound.level },
  );
  const [battle, setBattle] = useState<BattleState | null>(
    initialRound === undefined ? null : startBattle(initialRound.questions),
  );
  const [outcome, setOutcome] = useState<ResultBody | null>(null);
  const [pendingResult, setPendingResult] = useState<ResultPayload | null>(null);
  const [sendError, setSendError] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
      setBattle(startBattle(body.round.questions));
      setScreen({ kind: 'ready', level: body.level });
    } catch {
      setScreen({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    // מסלול הפיקסטורה, ומאותה סיבה בדיוק כמו ב-`ComposeDraft`: `load` פותח ב-`loading`,
    // ולכן גרסה שהייתה מושכת ומתעלמת מהתשובה עדיין הייתה מציירת את השלד — והמדידה
    // הייתה נעשית עליו.
    if (initialRound !== undefined) return;
    void load();
  }, [initialRound, load]);

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
      // ⛔ התוצאה אינה נזרקת: היא נשמרת ותישלח שוב.
      setPendingResult(payload);
      setSendError(FAILURE_HE.save);
    } catch {
      setPendingResult(payload);
      setSendError(FAILURE_HE.offline);
    }
  }, []);

  useEffect(() => {
    if (battle === null) return;
    // ⛔ הסיום ממתין להקשה על «הבא» ⛔ ולא לשעון: כל עוד `chosen` מלא, החשיפה על המסך.
    if (!isFinished(battle) || battle.chosen !== null) return;
    if (submitted) return;
    setSubmitted(true);
    void send({ answers: battle.answers });
  }, [battle, submitted, send]);

  /**
   * «עוד קרב» — ⛔ אינו ניווט: הוא מנקה את המצב המקומי ומושך סיבוב חדש מאותה נקודת קצה.
   * ניווט אל `/arcade` היה משאיר את הרכיב על המסך ומסתמך על אתחול שאינו מובטח.
   * במסלול הפיקסטורה ⛔ אין רשת, ולכן הוא מתחיל מחדש מאותן שאלות.
   */
  const again = useCallback(() => {
    setOutcome(null);
    setPendingResult(null);
    setSendError('');
    setSubmitted(false);
    if (initialRound !== undefined) {
      setBattle(startBattle(initialRound.questions));
      setScreen({ kind: 'ready', level: initialRound.level });
      return;
    }
    setBattle(null);
    void load();
  }, [initialRound, load]);

  useEffect(() => {
    if (pendingResult === null) return;
    const retry = () => {
      void send(pendingResult);
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [pendingResult, send]);

  /**
   * שורת הראש: הכותרת ופעולת הסגירה **באותה שורה**, ⛔ ולא זו מעל זו.
   *
   * ⚠️ נמדד ב-C-0185 ו⛔ לא נבחר בטעם: כפתור סגירה בגובה 44px בשורה נפרדת מעל ה-`h1`
   * הפיל את `heading anchored to top` בשלושת הרוחבים עם רצועה מתה של 60px — הרצפה בארנס
   * היא 48px (F-011 · F-016). שורה אחת מחזירה את הכותרת לראש המסך ומשאירה את היציאה
   * מעוגנת למעלה, ושתי הדרישות מתקיימות בלי לוותר על אף אחת מהן.
   */
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

  if (screen.kind === 'loading') {
    return (
      <section className="flex min-h-[100dvh] flex-col gap-6 pb-28">
        {topBar(null)}
        {/* צורת מה שמגיע, ⛔ לא ספינר (חוקה § 5). */}
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

  if (screen.kind !== 'ready') {
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
        {topBar(HEADING_HE)}
        <p className="text-lg leading-relaxed text-ink">{message}</p>
        {screen.kind === 'too_small' && (
          // שני המספרים כלשונם מהחוזה. ⛔ מספר שאין לנו מודפס כ-«—» ו⛔ לא כאפס.
          <p className="text-lg leading-relaxed text-ink-muted">
            {`נדרשות ${screen.required ?? MISSING_NUMBER_HE} מילים ברמה, יש ${screen.eligible ?? MISSING_NUMBER_HE}`}
          </p>
        )}
        <ActionBar>
          {screen.kind === 'session_expired' ? (
            // `<a>` רגיל ו⛔ לא `<Link>`: הסשן נגמר, ולכן הבקשה הבאה חייבת להגיע לשרת.
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

  if (battle === null) {
    return (
      <section className="flex min-h-[100dvh] flex-col gap-4 pb-28">
        {topBar(HEADING_HE)}
        <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>
      </section>
    );
  }

  const finished = isFinished(battle) && battle.chosen === null;
  const question = battle.questions[battle.index];

  if (finished || question === undefined) {
    if (outcome !== null && outcome.ok) {
      // ⛔ אין קריאה שנייה לשרת: `missed` של החוזה נושא `wordId` ⛔ ולא את המילה האנגלית,
      // והשאלות כבר בידנו — ההצלבה נעשית כאן ולא בבקשה נוספת.
      const headwords = new Map<string, string>(
        battle.questions.map((q) => [q.wordId, q.headword] as const),
      );
      const missed: readonly ArenaMissed[] = outcome.missed.map((row) => ({
        wordId: row.wordId,
        headword: headwords.get(row.wordId) ?? row.wordId,
        answer: row.answer,
        chosen: row.chosen,
      }));
      return (
        <ArenaResult
          enemyDefeated={outcome.enemyDefeated}
          unlocked={outcome.unlocked}
          // ⚠️ החוזה מחזיר את הפריט **שנפתח עכשיו** ⛔ ולא את כל מה שברשות הלומד, ולכן
          // הדמות לובשת אחד. הרחבת החוזה היא הכרעה שמחוץ לתוכנית הזאת (אילוץ 14) — F-070.
          items={outcome.unlocked === null ? [] : [outcome.unlocked]}
          missed={missed}
          onAgain={again}
        />
      );
    }
    // מסך ביניים: כל עוד התוצאה בדרך, או שהשליחה נכשלה והיא ממתינה לשליחה חוזרת.
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

  const revealed = battle.chosen !== null;

  return (
    // ⛔ אפס `justify-center` ו⛔ אפס `h-screen` (חוקה § 4 · F-011 · F-016). `pb-28` משלם
    // על הרצועה ש-`<ActionBar>` הקבוע מכסה.
    <section className="flex min-h-[100dvh] flex-col gap-6 pb-28">
      {topBar(null)}

      {/* שורת המצב — בקרה, ⛔ ולא תצוגת נתונים (§ 4.2י שאלה 5): ⛔ אין כאן גרף.
          התווית העברית והמספר הולכים עם הצבע, כי צבע לעולם אינו הערוץ היחיד (חוקה § 1).
          ⛔ שני המספרים באותה שורה (D-070) — התחמושת נותנת למהירות מחיר. */}
      <div className="flex flex-col gap-2">
        <p className="text-base font-semibold text-ink">
          {statusHe(ammoLeft(battle), battle.enemyHp)}
        </p>
        <div
          role="img"
          aria-label={`${statusHe(ammoLeft(battle), battle.enemyHp)}, ${ENEMY_HP_HE} מתוך ${battle.enemyHpMax}`}
          className="flex flex-row gap-1"
        >
          {hpPips(battle.enemyHpMax).map((pip) => (
            <span
              key={pip}
              aria-hidden
              className={pip < battle.enemyHp ? PIP_ON_CLASS : PIP_OFF_CLASS}
            />
          ))}
        </div>
      </div>

      <p className="text-ink">
        <EnWord className="text-5xl font-bold">{question.headword}</EnWord>
      </p>

      <ul data-arena-options className={OPTIONS_GRID_CLASS}>
        {question.options.map((option) => {
          const isAnswer = option === question.answer;
          const isChosen = option === battle.chosen;
          return (
            <li key={option}>
              <button
                type="button"
                data-arena-option
                className={`${OPTION_CLASS} ${revealed && isAnswer ? 'text-success' : 'text-ink'}`}
                aria-disabled={revealed ? 'true' : undefined}
                onClick={
                  revealed
                    ? undefined
                    : () => {
                        setBattle(chooseOption(battle, option));
                      }
                }
              >
                <span className="flex flex-col items-start gap-1">
                  <span>{option}</span>
                  {revealed && isAnswer && (
                    <span className="text-base font-semibold">{CORRECT_HE}</span>
                  )}
                  {revealed && isChosen && !isAnswer && (
                    <span className="text-base text-ink-muted">{CHOSEN_HE}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ActionBar>
        {revealed ? (
          <button
            type="button"
            data-arena-next
            data-primary-action="true"
            className={PRIMARY_ACTION_CLASS}
            onClick={() => {
              setBattle(advance(battle));
            }}
          >
            {NEXT_HE}
          </button>
        ) : (
          // ⛔ מושבת עם המילה ⛔ ולא עם התכונה `disabled` (`DeckSelector.tsx:189-198`),
          // כדי שקורא מסך עדיין ימצא את הכפתור וישמע שהוא לא זמין.
          <button
            type="button"
            data-arena-next
            data-primary-action="true"
            aria-disabled="true"
            className={`${PRIMARY_ACTION_CLASS} opacity-50`}
          >
            {NEXT_HE}
          </button>
        )}
      </ActionBar>
    </section>
  );
}
