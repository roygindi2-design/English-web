'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ArenaAvatar, { ITEM_LABELS_HE } from '@/components/ArenaAvatar';
import LockIcon from '@/components/LockIcon';
import { apiGet } from '@/lib/api/client';
import { bossTrack, homeSlots, winsToBoss, type BossNode, type HomeSlot } from '@/lib/core/arenaHome';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

/**
 * `plan/37-arena-spec.md § 12` — **מסך הבית של הזירה.** T-181.
 * 🎯 הרנדר: `docs/design/kol-B-01-home.png`, `docs/design/render_video_B.py:107` (`screen_home`)
 * ב-`LW, LH = 375, 812`. ⛔ כל מספר כאן **נגרף מהפונקציה ההיא**, ⛔ ולא נאמד מה-PNG.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב:** מסלול הבוס וארבע המשבצות מגיעים מ-`lib/core/arenaHome.ts`
 * ⇒ ⛔ אין כאן חשבון שארית, ⛔ אין עיגול כלפי מטה ו⛔ אין המספר חמש.
 *
 * ⛔ **שלושה צמתים שהרנדר מצייר ⛔ אינם כאן, וכל אחד עם מזהה ההכרעה שהוציא אותו:**
 * שבב הצבירה שבפינה (`:117-124`) והמד שמתחת לרמה (`:135-140`) — **D-131**,
 * ‏`0014_arcade.sql:24-30` ⛔ אין בו עמודה לשניהם; שמות הפריטים של `GEAR` (`:72-73`) —
 * **D-132**, המשבצות מתויגות בשם ה**משבצת**. ⛔ זו ⛔ אינה «השמטה» — היא הכרעה, והמסך
 * מציג במקומן ⛔ רק מה שיש לו עמודה חיה.
 *
 * ⚠️ **שכבה א׳ גוברת על הרנדר בשלושה מקומות, וכל אחד עם המספר שנמדד** (`36 § 14.4`,
 * ההחרגה היחידה):
 *   ⓐ שתי הפעולות המשניות — הרנדר מצייר **42px** (`:187`), ורצפת שכבה א׳ היא 44 ⇒ `min-h-touch`.
 *   ⓑ ה-chevron — הגליף נשאר 11×14 של הרנדר, ו**אזור הפגיעה** עוטף אותו ב-44×44.
 *   ⓒ צבעי מסלול הבוס — הרנדר מצייר «נוצח» ב-`SUCCESS` ואת הנוכחי ב-`BRAND`, ושניהם
 *      **נמדדו על כחול־הליל בסכימה הבהירה**: `--success` = **2.72:1** ו-`--brand` = **3.38:1**,
 *      מתחת לרצפה. ⇒ שלושת המצבים נצבעים בטוקני הזירה, שאינם מתחלפים עם הסכימה:
 *      `--arena-dodge` **10.72:1** · `--arena-ink` **14.59:1** · `--arena-ink-dim` **6.88:1**,
 *      וזהב הבוס נשאר בדיוק זהב הרנדר (`--arena-gold-light`, **10.56:1**).
 *      ⛔ **והצבע ⛔ אינו הערוץ היחיד ממילא** — לכל מצב **צורה** (וי · נקודה · גולגולת)
 *      ו**שם נגיש** בעברית.
 *
 * ⚠️ **D-137 (PM) — ⛔ אין בזירה מספר גופן מתחת ל-12.** הרנדר מצייר את תווית המשבצת
 * ב-9px, את תת-הכותרת ב-11.5 ואת תווית ההפרדה ב-10.5; שלושתן עולות ל-`text-xs` (12px).
 * ⛔ זו ⛔ אינה רצפת טקסט לכל המוצר — היא חלה על **הזירה בלבד**, וזה נאמר במפורש בהכרעה.
 */

export interface ArenaHomeState {
  readonly arcadeLevel: number;
  readonly wins: number;
  readonly unlockedItems: readonly string[];
}

export interface ArenaHomeProps {
  /** נמסר על ידי המעטפת ⇒ הפיקסצ׳ר מרנדר את המסך ⛔ בלי רשת. */
  readonly initialState?: ArenaHomeState;
  readonly onStart: () => void;
}

interface HomeBody {
  readonly ok: boolean;
  readonly code?: string;
  readonly arcadeLevel: number;
  readonly wins: number;
  readonly unlockedItems: readonly string[];
}

const TITLE_HE = 'זירת קרב';
const SUBTITLE_HE = 'ארקייד · מבודד מהתקדמות הלמידה';
const BACK_HE = 'חזרה';
const LEVEL_HE = 'רמת זירה';
const ISOLATION_HE = 'נפרדת מרמת האנגלית שלך';
const GEAR_HEADING_HE = 'ציוד';
const START_HE = 'התחל קרב';
const DRAWER_HE = 'ארון ציוד';
const DESIGN_HE = 'עיצוב דמות';
const DESIGN_SOON_HE = 'בחירת דמות תיפתח בקרוב';
const DRAWER_NOTE_HE = 'פריטים מקרבות בלבד';
const EMPTY_SLOT_HE = 'ריקה';
const LOADING_HE = 'טוען את הזירה';
const SIGN_IN_AGAIN_HE = 'להתחברות מחדש';

/** שמות המצבים, בעברית — ⛔ **המצב ⛔ לעולם אינו בצבע בלבד** (חוקה שכבה א׳ א2). */
const NODE_STATE_HE: Readonly<Record<BossNode['state'], string>> = {
  done: 'נוצח',
  current: 'הקרב הבא',
  pending: 'טרם',
};
const BOSS_HE = 'קרב הבוס';

/** `:136` — `rr(24, 404, LW-48, 66, 18, fill=RAISED)` + `BORDER_SUB` 1.1. */
const CARD_CLASS =
  'rounded-[18px] border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)]';

/** `:180-183` — הפעולה הראשית. גובה 58 ורדיוס 18 של הרנדר, ⛔ ללא שינוי. */
const START_CLASS =
  'flex h-[58px] w-full items-center justify-center rounded-[18px] border-2 ' +
  'border-[color:var(--arena-gold-light)] bg-[color:var(--arena-gold)] ' +
  'text-[17px] font-black text-[color:var(--arena-night)] active:opacity-90';

/**
 * `:185-191` — שתי הפעולות המשניות. ⚠️ **הגובה 42 של הרנדר עלה ל-44** (שכבה א׳ ⓐ);
 * הרוחב, הרדיוס, המילוי והמסגרת ⛔ לא נגעו.
 */
const SECONDARY_CLASS =
  'flex min-h-touch flex-1 items-center justify-center rounded-[14px] ' +
  'border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] ' +
  'text-[12.5px] font-semibold text-[color:var(--arena-ink-dim)] active:opacity-90 ' +
  'disabled:opacity-100';

const SLOT_CLASS =
  'flex h-[66px] w-[66px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] ' +
  'bg-[color:var(--arena-card)]';

function CheckGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 26 26" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M5 13.5 10.5 19 21 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 26 26" className="h-4 w-4" fill="currentColor">
      <circle cx="13" cy="13" r="5" />
    </svg>
  );
}

/** `:151` — שתי עיניים וקשת פה. גולגולת, ⛔ ולא אמוג׳י. */
function SkullGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 26 26" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="11" r="2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11" r="2" fill="currentColor" stroke="none" />
      <path d="M8 16.5a5 5 0 0 0 10 0" strokeLinecap="round" />
    </svg>
  );
}

/** `:122` — הגליף נשאר 11×14 של הרנדר; אזור הפגיעה שסביבו הוא 44×44 (שכבה א׳ ⓑ). */
function ChevronGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 11 14" className="h-[14px] w-[11px]" fill="currentColor">
      <path d="M11 0 0 7l11 7z" />
    </svg>
  );
}

function ItemGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M10 2.5 17 6v5.2c0 3-2.9 5.3-7 6.3-4.1-1-7-3.3-7-6.3V6z" strokeLinejoin="round" />
    </svg>
  );
}

function bossNodeInk(node: BossNode): string {
  if (node.isBoss) return 'text-[color:var(--arena-gold-light)]';
  if (node.state === 'done') return 'text-[color:var(--arena-dodge)]';
  if (node.state === 'current') return 'text-[color:var(--arena-ink)]';
  return 'text-[color:var(--arena-ink-dim)]';
}

function bossNodeLabel(node: BossNode): string {
  return node.isBoss ? `${BOSS_HE}, ${NODE_STATE_HE[node.state]}` : NODE_STATE_HE[node.state];
}

function slotLabel(slot: HomeSlot): string {
  const labels: Readonly<Record<string, string>> = ITEM_LABELS_HE;
  return slot.item === null ? slot.label : labels[slot.item] ?? slot.label;
}

export default function ArenaHome({ initialState, onStart }: ArenaHomeProps): React.JSX.Element {
  const [state, setState] = useState<ArenaHomeState | null>(initialState ?? null);
  const [screen, setScreen] = useState<'loading' | 'ready' | 'session_expired' | 'error'>(
    initialState === undefined ? 'loading' : 'ready',
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setScreen('loading');
    try {
      const body = await apiGet<HomeBody>('/api/arcade/home');
      if (!body.ok) {
        setScreen(body.code === 'session_expired' ? 'session_expired' : 'error');
        return;
      }
      setState({ arcadeLevel: body.arcadeLevel, wins: body.wins, unlockedItems: body.unlockedItems });
      setScreen('ready');
    } catch {
      setScreen('error');
    }
  }, []);

  /** ⛔ הפיקסצ׳ר מקבל את המצב כ-prop ⇒ ⛔ אינו מבקש מהשרת דבר. */
  useEffect(() => {
    if (initialState !== undefined) return;
    void load();
  }, [initialState, load]);

  const header = (
    <header className="relative flex flex-col items-center gap-1 pt-8">
      {/* `:122` — ה-chevron בקצה הימני. אזור פגיעה 44×44, הגליף בגודל הרנדר. */}
      <Link
        href="/"
        aria-label={BACK_HE}
        className="absolute end-1 top-6 flex min-h-touch min-w-touch items-center justify-center text-[color:var(--arena-ink-dim)]"
      >
        <ChevronGlyph />
      </Link>
      <h1 className="text-2xl font-bold leading-tight text-[color:var(--arena-ink)]">{TITLE_HE}</h1>
      <p className="text-xs leading-relaxed text-[color:var(--arena-ink-dim)]">{SUBTITLE_HE}</p>
    </header>
  );

  if (screen !== 'ready' || state === null) {
    return (
      <section data-arena-scope className="flex min-h-[100dvh] flex-col gap-6 px-6 pb-16">
        {header}
        {screen === 'loading' ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <p className="sr-only" role="status">
              {LOADING_HE}
            </p>
            <div aria-hidden className="h-40 rounded-[18px] bg-[color:var(--arena-card)]" />
            <div aria-hidden className="h-[66px] rounded-[18px] bg-[color:var(--arena-card)]" />
            <div aria-hidden className="h-[66px] rounded-[14px] bg-[color:var(--arena-card)]" />
          </div>
        ) : (
          <>
            <p className="text-lg leading-relaxed text-[color:var(--arena-ink)]">{FAILURE_HE.load}</p>
            {screen === 'session_expired' ? (
              <a href="/login" className={START_CLASS}>
                {SIGN_IN_AGAIN_HE}
              </a>
            ) : (
              <button type="button" className={START_CLASS} onClick={() => void load()}>
                {RETRY_HE}
              </button>
            )}
          </>
        )}
      </section>
    );
  }

  const track = bossTrack(state.wins);
  const remaining = winsToBoss(state.wins);
  const slots = homeSlots(state.unlockedItems);
  /** ⛔ עברית ⛔ אינה נושאת «נותרו 1». */
  const bossCaption =
    remaining === 1 ? `נותר ניצחון אחד עד ${BOSS_HE}` : `נותרו ${remaining} ניצחונות עד ${BOSS_HE}`;

  return (
    <section data-arena-scope className="flex min-h-[100dvh] flex-col gap-5 px-6 pb-16">
      {header}

      {/* `:126-134` — הכן ושתי האליפסות תחתיו, והדמות ב-idle מעליהן.
          הנשימה: `bob = sin(t*1.5)*2.2` ⇒ משרעת **±2.2px** ומחזור **4.19s**
          (`2π / 1.5`). ⛔ CSS בלבד, והשמות חיים ב-`arcade-tokens.css`. */}
      <div className="relative flex flex-col items-center">
        <div
          data-arena-idle="on"
          className="animate-[arena-idle-bob_4.19s_ease-in-out_infinite] motion-reduce:animate-none"
        >
          <ArenaAvatar role="hero" items={state.unlockedItems} />
        </div>
        <svg aria-hidden viewBox="0 0 128 40" className="-mt-3 h-10 w-[128px]" fill="currentColor">
          <ellipse cx="64" cy="23" rx="64" ry="17" className="text-[color:var(--arena-card)]" fill="currentColor" />
          <ellipse cx="64" cy="17" rx="64" ry="17" className="text-[color:var(--arena-stone)]" fill="currentColor" />
        </svg>
      </div>

      {/* `:136-143` — כרטיס הרמה. ⛔ **הגובה 66 ושני קווי הבסיס הם של הרנדר**: D-131
          הוציא את שני הצמתים שביניהם, ו⛔ אין לסגור את הרווח — סגירה שלו הייתה שינוי
          פריסה שהרנדר ⛔ אינו נושא, שנעשה כדי להסתיר הכרעה. */}
      <div className={`flex h-[66px] flex-col justify-center gap-1 px-4 ${CARD_CLASS}`}>
        <p className="text-[15px] font-bold leading-none text-[color:var(--arena-ink)]">
          {LEVEL_HE} {state.arcadeLevel}
        </p>
        <p className="text-xs leading-none text-[color:var(--arena-ink-dim)]">{ISOLATION_HE}</p>
      </div>

      {/* `:145-151` — מסלול הבוס. חמש צמתים, `r=13` ו-`r=16` לבוס. */}
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] font-semibold leading-none text-[color:var(--arena-gold-light)]">
          {bossCaption}
        </p>
        <ol className="flex flex-row-reverse items-center justify-between px-1">
          {track.map((node, i) => (
            <li key={i} className="flex items-center">
              <span
                role="img"
                aria-label={bossNodeLabel(node)}
                className={[
                  'flex items-center justify-center rounded-full border-2 border-current',
                  node.isBoss ? 'h-8 w-8' : 'h-[26px] w-[26px]',
                  bossNodeInk(node),
                ].join(' ')}
              >
                {node.isBoss ? (
                  <SkullGlyph />
                ) : node.state === 'done' ? (
                  <CheckGlyph />
                ) : node.state === 'current' ? (
                  <DotGlyph />
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* `:166-176` — ארבע המשבצות. ⛔ מתויגות בשם ה**משבצת** (D-132), וארבעתן הן
          אלה ש-**D-135** מדד שהמשחק יודע למלא. */}
      <div className="flex flex-col gap-2">
        <p className="text-[13.5px] font-semibold leading-none text-[color:var(--arena-ink)]">
          {GEAR_HEADING_HE}
        </p>
        <ul className="flex flex-row-reverse justify-between gap-2">
          {slots.map((slot) => (
            <li
              key={slot.slot}
              className={[
                SLOT_CLASS,
                slot.item === null
                  ? 'border border-[color:var(--arena-card-edge)] text-[color:var(--arena-ink-dim)]'
                  : 'border-[1.6px] border-[color:var(--arena-gold)] text-[color:var(--arena-gold-light)]',
              ].join(' ')}
            >
              {slot.item === null ? <LockIcon /> : <ItemGlyph />}
              <span className="text-xs leading-none text-[color:var(--arena-ink-dim)]">
                {slotLabel(slot)}
              </span>
              <span className="sr-only">
                {slot.label}, {slot.item === null ? EMPTY_SLOT_HE : slotLabel(slot)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* `:179-191` — שלוש הפעולות. */}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        <button type="button" className={START_CLASS} onClick={onStart}>
          {START_HE}
        </button>
        <div className="flex flex-row-reverse gap-[10px]">
          <button
            type="button"
            className={SECONDARY_CLASS}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            {DRAWER_HE}
          </button>
          {/* ⛔ פעולה מושבתת ⛔ בלי סיבה כתובה היא מבוי סתום: `37 § 7` הוא **T-217**,
              והוא חסום. השורה למטה היא הסיבה, והיא **נראית** ⛔ ולא רק נגישה. */}
          <button
            type="button"
            disabled
            aria-describedby="arena-design-soon"
            className={`${SECONDARY_CLASS} opacity-70`}
          >
            {DESIGN_HE}
          </button>
        </div>
        <p id="arena-design-soon" className="text-xs leading-none text-[color:var(--arena-ink-dim)]">
          {DESIGN_SOON_HE}
        </p>
      </div>

      {/* `:194-201` — ארון הציוד. ⛔ **⛔ אינו הרשימה של `DRAWER_ITEMS`** (D-132): הוא
          מציג את מה שללומד **באמת** יש, דרך `ITEM_LABELS_HE`. */}
      {drawerOpen && (
        <div className={`flex flex-col gap-3 p-4 ${CARD_CLASS}`}>
          <div className="flex flex-row-reverse items-baseline justify-between">
            <h2 className="text-[17px] font-bold leading-none text-[color:var(--arena-ink)]">
              {DRAWER_HE}
            </h2>
            <p className="text-xs leading-none text-[color:var(--arena-gold-light)]">{DRAWER_NOTE_HE}</p>
          </div>
          <ul className="flex flex-row-reverse justify-between gap-2">
            {slots.map((slot) => (
              <li
                key={slot.slot}
                className={[
                  SLOT_CLASS,
                  slot.item === null
                    ? 'border border-[color:var(--arena-card-edge)] text-[color:var(--arena-ink-dim)]'
                    : 'border-[1.6px] border-[color:var(--arena-gold)] text-[color:var(--arena-gold-light)]',
                ].join(' ')}
              >
                {slot.item === null ? <LockIcon /> : <ItemGlyph />}
                <span className="text-xs leading-none text-[color:var(--arena-ink-dim)]">
                  {slotLabel(slot)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
