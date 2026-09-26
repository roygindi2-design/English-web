'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import ArenaAvatar, { ITEM_LABELS_HE } from '@/components/ArenaAvatar';
import LockIcon from '@/components/LockIcon';
import { apiGet } from '@/lib/api/client';
import {
  LAST_ROUND_HEADING_HE,
  lastRoundDateHe,
  lastRoundOutcomeHe,
  lastRoundScoreHe,
  type ArenaLastRound,
} from '@/lib/core/arenaLastRound';
import type { ArenaCharacter } from '@/lib/core/arenaCharacter';
import {
  bossTrack,
  closetTiles,
  homeSlots,
  winsToBoss,
  type BossNode,
  type ClosetTile,
  type HomeSlot,
} from '@/lib/core/arenaHome';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';

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
 *      ⟦T-427 · `D-282`⟧ «נוצח» `--brand-surface` (dark, **6.44:1**) · `--arena-ink` **14.59:1** ·
 *      `--arena-ink-dim` **6.88:1**, והבוס — היריב — `--danger` (dark, **5.40:1**).
 *      ⛔ **והצבע ⛔ אינו הערוץ היחיד ממילא** — לכל מצב **צורה** (וי · נקודה · גולגולת)
 *      ו**שם נגיש** בעברית.
 *
 * ⚠️ **הרדיוסים הם שניים מתוך החמישה של החוקה, ⛔ ולא מספרי הרנדר, וזו קריאה של DEV
 * מוצהרת** (`RULES § 0.22` — «איזה מתוך חמשת הרדיוסים»): הרנדר מצייר `r=18` על כרטיס
 * הרמה ועל הפעולה הראשית ו-`r=14` על המשבצות ועל הפעולות המשניות, ⛔ ושני הערכים אינם
 * בסולם. ‏`scripts/radius-hygiene.test.ts` מפיל **ערך שישי** ⇒ 18 ⇐ `rounded-2xl` (16,
 * «ברירת המחדל של הכרטיס») ו-14 ⇐ `rounded-xl` (12, «פקדים משניים ואריחי מונה»), לפי
 * מיפוי התפקידים של D-036. ⛔ סטייה מוצהרת ובמספר, ⛔ ולא «נראה לי».
 *
 * ⚠️ **D-137 (PM) — ⛔ אין בזירה מספר גופן מתחת ל-12.** הרנדר מצייר את תווית המשבצת
 * ב-9px, את תת-הכותרת ב-11.5 ואת תווית ההפרדה ב-10.5; שלושתן עולות ל-`text-xs` (12px).
 * ⛔ זו ⛔ אינה רצפת טקסט לכל המוצר — היא חלה על **הזירה בלבד**, וזה נאמר במפורש בהכרעה.
 */

export interface ArenaHomeState {
  readonly arcadeLevel: number;
  readonly wins: number;
  readonly unlockedItems: readonly string[];
  /** T-217 · `37 § 7` — `null` ⇒ הלומד טרם בחר, והמעטפת פותחת את הבחירה לפני הקרב. */
  readonly character: ArenaCharacter | null;
  /**
   * T-360 · `36 § 13.1` חותמת ⓒ — הקרב האחרון של הלומד, או `null` כשטרם קרב.
   * ⛔ **רשות במכוון:** פיקסצ׳ר שאינו מתאר קרב קודם ⛔ אינו חייב להמציא אחד, ו-`undefined`
   * מתנהג בדיוק כמו `null` ⇒ הלוח ⛔ אינו מצויר. ⛔ אין כאן מצב שלישי.
   */
  readonly lastRound?: ArenaLastRound | null;
}

export interface ArenaHomeProps {
  /** נמסר על ידי המעטפת ⇒ הפיקסצ׳ר מרנדר את המסך ⛔ בלי רשת. */
  readonly initialState?: ArenaHomeState;
  /** נושא את המצב, כדי שהמעטפת תדע אם יש דמות (T-217). */
  readonly onStart: (state: ArenaHomeState) => void;
  /** `עיצוב דמות` (`37 § 12`) — פותח את אותו מסך בחירה, עם יציאה (T-217). */
  readonly onDesign: (state: ArenaHomeState) => void;
}

interface HomeBody {
  readonly ok: boolean;
  readonly code?: string;
  readonly arcadeLevel: number;
  readonly wins: number;
  readonly unlockedItems: readonly string[];
  readonly character: ArenaCharacter | null;
  readonly lastRound: ArenaLastRound | null;
}

const TITLE_HE = 'זירת קרב';
const SUBTITLE_HE = 'ארקייד · מבודד מהתקדמות הלמידה';
/**
 * T-253ⓑ · D-186 — ⛔ לא `'חזרה'` החשופה: אותה מילה בדיוק היא שם חפיסת
 * החזרות (`components/DeckSelector.tsx`, `36 § 5`, נעול). מ-2 משמעויות ל-1 —
 * שם החפיסה לא זז, החץ הוא שקיבל תווית שנוקבת ביעד שלו, כמו שני צמתי הטבעת
 * האחרים (`ComposeDraft.tsx` · `StoryScreen.tsx`).
 */
const BACK_TO_WORLD_HE = 'חזרה לעולם';
const LEVEL_HE = 'רמת זירה';
const ISOLATION_HE = 'נפרדת מרמת האנגלית שלך';
const GEAR_HEADING_HE = 'ציוד';
const START_HE = 'התחל קרב';
const DRAWER_HE = 'ארון ציוד';
const DESIGN_HE = 'עיצוב דמות';
const DRAWER_NOTE_HE = 'פריטים מקרבות בלבד';
/** T-360 — ⛔ אינן מצוירות: הרנדר ⛔ אינו נושא תווית לשורת המספר, ו-`36 § 14.4` מחייב
    את הפריסה. המקריא כן צריך לדעת מה המספר מודד ומה התאריך הזה. */
const CORRECT_SR_HE = 'נכונות';
const FINISHED_SR_HE = 'הסתיים בתאריך';
const EMPTY_SLOT_HE = 'ריקה';
/** T-488 · `D-292` — ⛔ **`רמת זירה N`, ⛔ ולא `ניצחון בקרב 12` של הרנדר:** פריט נפתח בעליית
    **רמה** (`D-061`), ⇒ המחרוזת אומרת את התנאי שהקוד באמת מקיים. */
const CLOSET_HELD_HE = 'ברשותך';
const CLOSET_LOCKED_HE = 'נעול';
const CLOSET_CLOSE_HE = 'סגירת ארון הציוד';
const LOADING_HE = 'טוען את הזירה';

/** שמות המצבים, בעברית — ⛔ **המצב ⛔ לעולם אינו בצבע בלבד** (חוקה שכבה א׳ א2). */
const NODE_STATE_HE: Readonly<Record<BossNode['state'], string>> = {
  done: 'נוצח',
  current: 'הקרב הבא',
  pending: 'טרם',
};
const BOSS_HE = 'קרב הבוס';

/** `:136` — `rr(24, 404, LW-48, 66, 18, fill=RAISED)` + `BORDER_SUB` 1.1. */
const CARD_CLASS =
  'rounded-2xl border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)]';

/**
 * זירה — עיצוב חופשי (C-0818): הפעולות **נלחצות**, ⛔ ולא רק מתעמעמות. `scale(0.97)` על
 * `:active`, ‏`transform` בלבד, 150ms — באותה נוסחה של `ArenaBattle` (`motion-safe:`),
 * ⇒ `prefers-reduced-motion` ⇒ ⛔ אין תנועה, העמעום נשאר ערוץ המשוב.
 */
const PRESS_CLASS = 'transition-transform duration-150 ease-out motion-safe:active:scale-[0.97]';

/** `:180-183` — הפעולה הראשית. גובה 58 ורדיוס 18 של הרנדר, ⛔ ללא שינוי. */
const START_CLASS =
  'flex h-[58px] w-full items-center justify-center rounded-2xl border-2 ' +
  'border-[color:var(--brand-surface)] bg-[color:var(--brand-surface)] ' +
  'text-[17px] font-black text-[color:var(--brand-on)] active:opacity-90 ' +
  PRESS_CLASS;

/**
 * `:185-191` — שתי הפעולות המשניות. ⚠️ **הגובה 42 של הרנדר עלה ל-44** (שכבה א׳ ⓐ);
 * הרוחב, הרדיוס, המילוי והמסגרת ⛔ לא נגעו.
 */
const SECONDARY_CLASS =
  'flex min-h-touch flex-1 items-center justify-center rounded-xl ' +
  'border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-card)] ' +
  'text-[12.5px] font-semibold text-[color:var(--arena-ink-dim)] active:opacity-90 ' +
  PRESS_CLASS + ' ' +
  'disabled:opacity-100';

const SLOT_CLASS =
  'flex h-[66px] w-[66px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl ' +
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

/**
 * `:122` — הגליף נשאר 11×14 של הרנדר; אזור הפגיעה שסביבו הוא 44×44 (שכבה א׳ ⓑ).
 *
 * ↩️ **T-345 · סוגר את `F-250` — הקודקוד מצביע ימינה, ⛔ ולא שמאלה.**
 * ⛔ **המדידה, ⛔ ולא הערכה:** הרנדר מצייר את החץ ב-`render_video_B.py:122` כמשולש
 * `[(LW-22, 119), (LW-33, 112), (LW-33, 126)]` — כלומר הקודקוד הבודד הוא ב-`LW-22`,
 * ה**ימני** מבין שלושת ה-`x`. הגליף כאן צייר `M11 0 0 7l11 7z`, שקודקודו ב-`x=0`
 * ⇒ **שמאלה**, בדיוק ההפך. בעברית חץ שמאלה הוא «קדימה» ⇒ הלומד הקיש על מה שנראה
 * כהתקדמות וחזר אחורה.
 */
function ChevronGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 11 14" className="h-[14px] w-[11px]" fill="currentColor">
      <path d="M0 0 11 7 0 14z" />
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
  if (node.isBoss) return 'text-[color:var(--danger)]';
  if (node.state === 'done') return 'text-[color:var(--brand-surface)]';
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

/**
 * 🏠 **T-420 · יעד ① של `arena` ⟨רוי: «אפס גלילה אנכית»⟩ — גובה **מדויק**, ⛔ ולא מינימום.**
 * 🔬 **נמדד `C-0703` ב-`next start`, ⛔ ולא שוער:** `min-h-[100dvh]` ועוד `pb-16` ⇒
 * `scrollHeight − innerHeight` = **460** ב-320×568 · **287** ב-375×667 · **102** ב-393×852.
 * ⇒ תבנית `ArenaBattle` / `ArenaCharacterChoice` בדיוק: `h-[100dvh]` — ⛔ ולא `calc(… − 5.25rem)`,
 * כי `arcade-tokens.css` כבר מוריד את הכותרת ואת ריפוד ה-`<main>` בכל מסמך שנושא
 * `data-arena-scope` (`T-423`ⓑ) · `overflow-hidden` · ריפוד תחתון של בטיחות המכשיר בלבד.
 * ⚠️ **ו-460px ⛔ אינם נפתרים בגובה לבדו** — ב-320×568 התוכן ⛔ אינו נכנס. ⇒ ההכרעה (DEV,
 * עיצוב מובייל מאושר-מראש): **הפעולות נשארות על המסך**, והאזור שביניהן לכותרת נגלל בתוך
 * עצמו — כמו `T-422` ב-`ArenaSummary`.
 */
const SHELL_CLASS =
  'flex h-[100dvh] flex-col overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]';
/**
 * ⛔ `[&>*]:shrink-0` — אחרת flex מכווץ כרטיס של 66px ל-40 במקום לגלול אותו.
 * ⛔ `relative` — 🔬 נמדד בטיק הזה ב-320×568: בלעדיו ה-`sr-only` (‏`absolute`) של המשבצות
 * והלוח ⛔ אינם נלכדים באזור הנגלל — הבלוק המכיל שלהם הוא המסמך, והם מתחו אותו ל-697.
 */
const BODY_CLASS = 'relative flex min-h-0 flex-1 flex-col gap-5 [&>*]:shrink-0';
const ACTIONS_CLASS = 'shrink-0 mt-auto flex flex-col gap-3 pt-4';

export default function ArenaHome({ initialState, onStart, onDesign }: ArenaHomeProps): React.JSX.Element {
  const [state, setState] = useState<ArenaHomeState | null>(initialState ?? null);
  const [screen, setScreen] = useState<'loading' | 'ready' | 'session_expired' | 'error'>(
    initialState === undefined ? 'loading' : 'ready',
  );
  /** 🗄️ T-488 — ⛔ **אין עוד `scrollIntoView`:** הארון הוא גיליון `fixed` מעל האזור הגמיש,
   *  ⇒ ⛔ דבר אינו נגלל, והדמות נשארת במקומה מעליו. */
  const [drawerOpen, setDrawerOpen] = useState(false);
  /** T-489 — הגיליון נשאר בעץ עד שתנועת הסגירה נגמרת; ⇒ `drawerOpen` הוא הכוונה,
   *  ⛔ ולא הנוכחות. והפוקוס חוזר לכפתור שפתח אותו (`aria-expanded` מתעדכן איתו). */
  const [closetMounted, setClosetMounted] = useState(false);
  const drawerButtonRef = useRef<HTMLButtonElement>(null);
  const closeCloset = useCallback(() => setDrawerOpen(false), []);
  const closetExited = useCallback(() => {
    setClosetMounted(false);
    drawerButtonRef.current?.focus();
  }, []);

  const load = useCallback(async () => {
    setScreen('loading');
    try {
      const body = await apiGet<HomeBody>('/api/arcade/home');
      if (!body.ok) {
        setScreen(body.code === 'session_expired' ? 'session_expired' : 'error');
        return;
      }
      setState({
        arcadeLevel: body.arcadeLevel,
        wins: body.wins,
        unlockedItems: body.unlockedItems,
        character: body.character ?? null,
        lastRound: body.lastRound ?? null,
      });
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
      {/* `:122` — ה-chevron בקצה הימני. אזור פגיעה 44×44, הגליף בגודל הרנדר.
          T-253ⓐ · D-186 — `/world` ישירות: הכניסה לזירה עוברת בטבעת
          (`lib/core/worldApps.ts`), ⛔ ולא ל-`/`, שנופל ל-`signedInRedirect`
          ⇒ `/studies` — לשונית שהלומד לא ביקש.

          ↩️ **T-345 — `start-1`, ⛔ ולא `end-1`, ו⛔ לא `right-1`.** ההערה הזאת אמרה
          «בקצה הימני» מאז שנכתבה, והקוד כתב `end-1` — ו-`end` במיכל RTL הוא **שמאל**.
          ⇒ הכוונה והתוצאה ⛔ לא היו זהות, וזו הראיה ש⛔ לא הייתה כאן בחירה.
          ⛔ **והטוקן הלוגי נשאר לוגי:** `start` הוא הצד שממנו הכתיבה מתחילה — ימין
          בעברית — ולכן הוא נכון גם אם המוצר ייקרא פעם בשפה משמאל לימין. `right-1`
          היה מקבע פיזית את מה שצריך להישאר תלוי-כתיב. */}
      <Link
        href="/world"
        aria-label={BACK_TO_WORLD_HE}
        className="absolute start-1 top-6 flex min-h-touch min-w-touch items-center justify-center text-[color:var(--arena-ink-dim)]"
      >
        <ChevronGlyph />
      </Link>
      <h1 className="text-2xl font-bold leading-tight text-[color:var(--arena-ink)]">{TITLE_HE}</h1>
      <p className="text-xs leading-relaxed text-[color:var(--arena-ink-dim)]">{SUBTITLE_HE}</p>
    </header>
  );

  if (screen !== 'ready' || state === null) {
    /* 🦴 **T-398 — השלד מצייר את ששת האזורים של המסך, ⛔ ולא שלושה מתוכם.**
       🔬 **נמדד `C-0664` בדפדפן חי עם עיכוב מלאכותי של 2,500ms על `/api/arcade/home`
       (375×780), ⛔ ולא שוער:** במצב `loading` נספרו **3** בלוקים — `h-40` · `h-[66px]` ·
       `h-[66px]` — ובמסך המיוצב יש **6** אזורים, ו-`התחל קרב` נמדדה שם ב-`top = 654`
       בעוד ⛔ אין לה ולו פיקסל שמור בשלד. ⇒ החצי התחתון ריק לכל אורך ההמתנה ואז מתמלא
       בבת אחת, והאצבע שכבר יצאה לדרך נוחתת על מה שקפץ לשם.
       ⚠️ **הכלל נקוב בשמו:** `ui-ux-pro-max` ⇒ `ux-guidelines` · Layout · **Content
       Jumping** · Severity **High** — «skeleton replacements can shift nearby content
       when they update» ⇒ Do: «Reserve appropriate space or keep async states in a
       stable content-driven container».
       ⛔ **ולכן המעטפת ⛔ אינה `gap-6` אלא `gap-5` — בדיוק זו של המסך המיוצב**, וקבוצת
       הפעולות נושאת את אותו `mt-auto pt-4 gap-3`: מרווח שונה בשלב אחד הוא בדיוק הקפיצה
       שהשורה הזאת קיימת נגדה. הגבהים הם של המסך המיוצב, אחד-אחד: הדמות **188**
       (`h-40` ‏160 + רצועת האליפסות `h-10` פחות `-mt-3` ⇒ 28) · כרטיס הרמה **66** ·
       מסלול הבוס **57** · כותרת הציוד עם ארבע המשבצות **88** · `התחל קרב` **58**
       (`START_CLASS`) · שתי הפעולות המשניות **44** (`min-h-touch`).
       ⛔ **⛔ ולא ספינר:** שלד אומר «זה מה שמגיע», ספינר אומר «חכה». ⛔ ואין כאן טוקן
       צבע חדש — הכול על `--arena-card`, כמו קודם. */
    const loading = screen === 'loading';
    return (
      <section
        data-arena-scope
        data-surface="dark"
        aria-busy={loading || undefined}
        className={`${SHELL_CLASS} ${loading ? 'gap-5' : 'gap-6'}`}
      >
        {header}
        {loading ? (
          <>
            <p className="sr-only" role="status">
              {LOADING_HE}
            </p>
            {/* 🏠 T-420 — אותו אזור גמיש כמו במסך המיוצב, ⛔ ונגזר מאותו קבוע: שלד שגובהו
                ⛔ אינו מוגבל היה דוחף את `התחל קרב` מתחת לקפל, בדיוק מה שהשלד קיים נגדו. */}
            <div data-arena-home-body className={`${BODY_CLASS} overflow-hidden`}>
            {/* הדמות — ⛔ מרוכזת וברוחב רצועת האליפסות, ⛔ ולא כרטיס לרוחב המסך. */}
            <div className="flex justify-center">
              <div
                aria-hidden
                data-arena-skeleton="figure"
                className="h-[188px] w-[128px] rounded-2xl bg-[color:var(--arena-card)]"
              />
            </div>
            <div
              aria-hidden
              data-arena-skeleton="level"
              className="h-[66px] rounded-2xl bg-[color:var(--arena-card)]"
            />
            <div
              aria-hidden
              data-arena-skeleton="boss-track"
              className="h-[57px] rounded-2xl bg-[color:var(--arena-card)]"
            />
            {/* ⛔ **`162` ⛔ אינו מספר שני — זו אותה נקודת שבירה בדיוק שהרצועה עצמה נושאת.**
                🔬 נמדד חי בשלושה רוחבים: האזור הזה הוא **88** ב-375 וב-414, ו-**162**
                ב-320, כי `max-w-[140px]` מקפל את ארבעת התאים ל-2×2 מתחת ל-375
                (`min-[375px]:max-w-none` משחרר אותו). ⇒ שלד בגובה 88 ב-320 היה משאיר
                את `התחל קרב` נמוכה ב-**72px** ממקומה, כלומר הקפיצה שהשורה הזאת קיימת
                נגדה, ברוחב שבו היא הכי כואבת. */}
            <div
              aria-hidden
              data-arena-skeleton="gear"
              className="h-[162px] min-[375px]:h-[88px] rounded-2xl bg-[color:var(--arena-card)]"
            />
            </div>
            {/* אותה קבוצה בדיוק כמו במסך המיוצב ⇒ `התחל קרב` שומרת את מקומה. */}
            <div className={ACTIONS_CLASS}>
              <div
                aria-hidden
                data-arena-skeleton="start"
                className="h-[58px] rounded-2xl bg-[color:var(--arena-card)]"
              />
              <div
                aria-hidden
                data-arena-skeleton="actions"
                className="min-h-touch rounded-xl bg-[color:var(--arena-card)]"
              />
            </div>
          </>
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
    <section data-arena-scope className={`${SHELL_CLASS} gap-5`} data-surface="dark">
      {/* 📐 **T-342 — ⛔ אין כאן `px-6`, וזו מדידה מול הרנדר ⛔ ולא ניקיון.**
          `app/layout.tsx` נותן ל-`<main>` ‏`px-6` ⇒ 24px לכל צד, וה-`section` הזה הוסיף
          עליהם עוד `px-6` ⇒ **48px לכל צד**, וזה מה שנמדד חי (`ul` ב-`x=48`, כרטיס
          הרמה ב-`x=48`). ⛔ **והרנדר מצייר 24:** `render_video_B.py:136` הוא
          `rr(24, 404, LW-48, 66, 18)` ו-`:183` הוא `rr(24, 664, LW-48, 58, 18)` —
          כלומר `x=24` ורוחב 327 ב-`LW=375`.
          🔴 **וזה ⛔ אינו רק דיוק:** ב-48 כפול נותרו **279px** ל-375, והרצועה צריכה
          **288** ⇒ ארבעת התאים ⛔ לא יכלו להיכנס לשורה אחת ⛔ בשום רוחב מצוי, ועטיפה
          לבדה הייתה מייצרת 3+1 גם ב-375. ב-24 נותרים 327 ⇒ 288 נכנסים. ⇒ הגדר הכפולה
          הייתה **הסיבה**, ⛔ ולא תופעת לוואי. */}
      {header}

      {/* 🏠 **T-420 — האזור הגמיש.** הכותרת למעלה ושלוש הפעולות למטה הם **עוגנים**;
          כל מה שביניהם — הדמות · הרמה · מסלול הבוס · הציוד · הקרב האחרון · הארון — הוא
          היחיד שנגלל, **בתוך עצמו**. ⇒ המסמך ⛔ אינו גולל ⛔ באף רוחב, ו`התחל קרב` על
          המסך תמיד — גם ב-320×568, שבו המסך היה כמעט שניים (+460px, `C-0703`). */}
      <div data-arena-home-body className={`${BODY_CLASS} overflow-y-auto overscroll-contain`}>

      {/* `:126-134` — הכן ושתי האליפסות תחתיו, והדמות ב-idle מעליהן.
          הנשימה: `bob = sin(t*1.5)*2.2` ⇒ משרעת **±2.2px** ומחזור **4.19s**
          (`2π / 1.5`). ⛔ CSS בלבד, והשמות חיים ב-`arcade-tokens.css`. */}
      <div className="relative flex flex-col items-center">
        <div
          data-arena-idle="on"
          className="animate-[arena-idle-bob_4.19s_ease-in-out_infinite] motion-reduce:animate-none"
        >
          <ArenaAvatar role="hero" items={state.unlockedItems} character={state.character} />
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
        <p className="text-[12.5px] font-semibold leading-none text-[color:var(--brand-surface)]">
          {bossCaption}
        </p>
        {/* ⚠️ `flex` רגיל (`T-338`): במיכל RTL הילד הראשון **כבר** בימין, ו-`flex-row-reverse`
            היה מציב את צומת 1 בשמאל ⇒ מסלול הבוס נקרא לאחור. נמדד לפני התיקון: הראשונה
            ב-`x=52`, האחרונה ב-`x=291`. */}
        <ol className="flex items-center justify-between px-1" data-rtl-row="boss-track">
          {track.map((node, i) => (
            <li key={i} className={['flex items-center', i < track.length - 1 ? 'flex-1' : ''].join(' ')}>
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
              {/* 🎨 C-0863 · זירה — עיצוב חופשי: המסילה בין הצמתים (`kol-B-01`). ‏`dir="rtl"`
                  מציב אותה משמאל לצומת ⇒ היא מובילה לצומת הבא. קטע שהסתיים (הצומת שלפניו
                  הושג) בגוון הלומד; השאר עמום. ⛔ דקורטיבי בלבד — המצב נישא בסמל ובתווית. */}
              {i < track.length - 1 ? (
                <span
                  aria-hidden
                  data-boss-track-rail
                  className={[
                    'mx-1 block h-[2px] flex-1 rounded-full',
                    node.state === 'done'
                      ? 'bg-[color:var(--brand-surface)] opacity-60'
                      : 'bg-[color:var(--arena-stone)]',
                  ].join(' ')}
                />
              ) : null}
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
        {/* ⚠️ `flex` רגיל (`T-338`) — `רגליים` נמדדה `x=48` ו-`גוף` `x=270`, כלומר סדר
            התאים היה הפוך לשפה.

            📐 **T-342 · `D-244`ⓐ · סוגר את `F-246`ⓐ — הרצועה עוטפת, ⛔ ואינה נחתכת.**
            ⛔ **המדידה, C-0596 חי ב-Chromium 320×780:** ה-`ul` היה `x=48` ברוחב **224**
            ותוכנו **288** (`4×66 + 3×8`) ⇒ עודף **64px**, והתא הרביעי (`גוף`) ישב
            `x=-16`. ⇒ הלומד ראה **שלושה תאים ורבע** ו⛔ אף רמז שיש רביעי.
            ⛔ **ושתי החלופות פסולות במספר** (`D-244`): תא 52px משאיר 4px בין שני יעדי
            מגע, ומרווח 0 מאחד ארבעה יעדים לרצועה אחת. ⇒ נשאר לעטוף.
            ⛔ **`max-w-[140px]` = `2×66 + 8`, ⛔ ולא מספר עגול שנבחר:** בדיוק שני תאים
            ומרווח ⇒ 2×2 מתחת ל-375, ומ-375 ומעלה `min-[375px]:max-w-none` משחרר את
            התקרה ל-327 הפנויים ⇒ שורה אחת של ארבעה, כמו הרנדר.
            ⛔ **ו-`justify-between` יצא:** ב-327 הוא היה פורש את שלושת המרווחים ל-21px,
            בעוד `render_video_B.py:168` מצייר `x = LW-24-sw - i*(sw+8)` — מרווח **8**
            קבוע, והרצועה צמודה לימין (`63..351`). ברירת המחדל של `flex` ב-RTL היא
            בדיוק זה. */}
        <ul className="flex flex-wrap gap-2 max-w-[140px] min-[375px]:max-w-none" data-rtl-row="gear-slots">
          {slots.map((slot) => (
            <li
              key={slot.slot}
              className={[
                SLOT_CLASS,
                slot.item === null
                  ? 'border border-[color:var(--arena-card-edge)] text-[color:var(--arena-ink-dim)]'
                  : 'border-[1.6px] border-[color:var(--brand)] text-[color:var(--brand-surface)]',
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

      {/* 🏁 **T-360 · `36 § 13.1` חותמת ⓒ — «מה שהלומד עשה נשמר ונראה בכניסה הבאה».**
          🔬 **מה שנמדד לפני שהלוח הזה נכתב:** הקרב **כבר נשמר** — `arcade_runs` נושאת
          `finished_at` · `words_seen` · `words_correct` · `enemy_defeated` מאז
          `0014_arcade.sql` — ומסך הבית הראה ממנו **אפס**. `wins` לבדו מזיז צומת במסלול
          הבוס, ו⛔ אינו אומר ללומד מה קרה ב-90 השניות שלו. ⇒ הפער היה בקריאה, ⛔ ולא
          בשמירה: ⛔ אין כאן מיגרציה, ⛔ אין עמודה ו⛔ אין כתיבה.
          ⛔ **⛔ אינו יומן קרבות:** שורה אחת, האחרונה. היסטוריה היא מסך, והמסך הזה
          ⛔ אינו שלי לפתוח (`RULES § 0.22`).
          🔴 **מיקומו **אחרי** שלוש הפעולות, ⛔ ולא מתחת למסלול הבוס — ⛔ וזו מדידה
          ⛔ ולא טעם.** הוא ישב שם, והשער האדים: `check:mobile` מודד את הזירה ב-375×780,
          ‏93px נוספים דחפו את `עיצוב דמות` ו-`ארון ציוד` **מתחת לקפל**, ובדיקת
          הניגודיות מצמידה את נקודת הדגימה ל-`innerHeight - 1` ⇒ היא דגמה את כפתור
          ה-`התחל קרב` הזהוב מתחתיהם וקראה **1.01:1**. ⛔ **והשער צדק בדבר האמיתי:**
          מסך שדוחף את הפעולה הראשית שלו מתחת לקפל בשביל מבט לאחור הפך סדר עדיפויות.
          ⇒ הלוח יורד **מתחת** לפעולות: הן ⛔ לא זזו ולו פיקסל אחד, והוא נשאר על המסך.
          ⛔ **ואין כאן פסק דין** (R-016 · `37 § 9` ח4): שתי עובדות, אותן שתיים בדיוק
          שמסך הסיום כבר אומר, ⛔ ואין ביניהן מילת הפסד.
          🏠 **⟦T-420⟧ ובתוך האזור הגמיש, ⛔ ולא מתחת לפעולות — ⛔ וזו אותה הנמקה בדיוק.**
          הפעולות מעוגנות לתחתית המסך עכשיו, ⇒ הלוח ⛔ אינו יכול עוד לדחוף אותן ולו פיקסל;
          מתחתיהן הוא היה נחתך מחוץ למסך שגובהו מדויק. */}
      {state.lastRound != null && (
        <div className="flex flex-col gap-2" data-arena-last-round>
          <p className="text-[12.5px] font-semibold leading-none text-[color:var(--brand-surface)]">
            {LAST_ROUND_HEADING_HE}
          </p>
          {/* ⚠️ `flex` רגיל (`T-338`) — במיכל RTL הילד הראשון כבר בימין, והתווית
              הכתובה היא זו שנקראת ראשונה. ⛔ גובה 52 ⛔ ואינו יעד מגע: הלוח ⛔ אינו
              נלחץ ו⛔ אינו מוביל לשום מקום ⇒ רצפת 44px ⛔ אינה חלה עליו, ⛔ והוא
              ⛔ אינו נראה כמו כפתור. */}
          <div className={`flex min-h-[52px] items-center justify-between px-4 ${CARD_CLASS}`} data-rtl-row="last-round">
            <span className="text-[13px] font-bold leading-none text-[color:var(--arena-ink)]">
              {lastRoundOutcomeHe(state.lastRound)}
            </span>
            <span className="flex items-baseline gap-2">
              {/* ⛔ הצבע ⛔ אינו הערוץ היחיד (חוקה שכבה א׳ א2): «14 / 16» אינו מצב,
                  והתווית שמסבירה אותו נקראת למקריא-מסך ⛔ ואינה מצוירת — שורת המספר
                  ברנדר ⛔ אינה נושאת תווית, ו-`36 § 14.4` מחייב את הפריסה. */}
              <span className="sr-only">{CORRECT_SR_HE} </span>
              <span
                dir="ltr"
                data-arena-last-round-score
                className="text-[15px] font-black leading-none text-[color:var(--brand-surface)]"
              >
                {lastRoundScoreHe(state.lastRound)}
              </span>
              <span className="sr-only">{FINISHED_SR_HE} </span>
              <span dir="ltr" className="text-xs leading-none text-[color:var(--arena-ink-dim)]">
                {lastRoundDateHe(state.lastRound)}
              </span>
            </span>
          </div>
        </div>
      )}

      </div>

      {/* `:179-191` — שלוש הפעולות. */}
      <div className={ACTIONS_CLASS}>
        <button type="button" className={START_CLASS} onClick={() => onStart(state)}>
          {START_HE}
        </button>
        {/* ⚠️ `flex` רגיל (`T-338`) — במיכל RTL הילד הראשון **כבר** בימין.

            🔃 **T-344 · `D-245` · סוגר את `F-249` — `עיצוב דמות` הוא הילד הראשון.**
            ⛔ **המדידה, גרופה מהרנדר ⛔ ולא מהעין:** `render_video_B.py:194-197` רץ על
            `("ארון ציוד", "עיצוב דמות")` ומציב `x = 24 + i*(bw+10)` עם `bw=158.5`
            ⇒ `ארון ציוד` ב-`x=24` (**שמאל**) ו-`עיצוב דמות` ב-`x=192.5` (**ימין**).
            במסך החי נמדד ההפך (‏375px: `ארון ציוד`=193 · `עיצוב דמות`=48) ⇒ לומד שראה
            את הרנדר הושיט אצבע לפעולה אחת וקיבל את השנייה.
            🔴 ⛔ **והתיקון הוא סדר ה-DOM, ⛔ ולא `flex-row-reverse`:** `T-338` תיקן את
            הציר עצמו, והחזרת ההיפוך הייתה מחליפה באג בשני באגים שמבטלים זה את זה.
            ⚠️ `36 § 14.4` — **הסדר** הוא מה שנשאר מחייב מהרנדר; הרקע ⛔ אינו. */}
        <div className="flex gap-[10px]" data-rtl-row="home-actions">
          {/* T-217 · `37 § 7` — «ניתן לשינוי בכל רגע ממסך הבית»: פותח את מסך הבחירה
              עם יציאה. ⛔ המעטפת מחליטה, ⛔ לא המסך. */}
          <button type="button" className={SECONDARY_CLASS} onClick={() => onDesign(state)}>
            {DESIGN_HE}
          </button>
          <button
            type="button"
            className={SECONDARY_CLASS}
            ref={drawerButtonRef}
            aria-expanded={drawerOpen}
            onClick={() => {
              setClosetMounted(true);
              setDrawerOpen((open) => !open);
            }}
          >
            {DRAWER_HE}
          </button>
        </div>
      </div>

      {closetMounted && (
        <GearClosetSheet
          open={drawerOpen}
          tiles={closetTiles(state.unlockedItems, state.arcadeLevel)}
          onClose={closeCloset}
          onExited={closetExited}
        />
      )}
    </section>
  );
}

/** T-489 — משך הסגירה; רשת הביטחון מחכה לו ועוד מעט. */
const CLOSET_EXIT_MS = 220;
/** T-489 ⓑ — סגירה בשחרור: מעבר ל-⅓ מהגובה, **או** הטלה מהירה (`emil-design-eng`:
 *  מהירות מספיקה גם בלי מרחק). 0.5px/ms = 500px/s. */
const CLOSET_DISMISS_FRACTION = 1 / 3;
const CLOSET_FLICK_PX_PER_MS = 0.5;

/** `apple-design` § 9 — ⛔ בלי `matchMedia` (jsdom) ⇒ מתייחסים כמופחת: ⛔ אין מעבר להמתין לו. */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** `apple-design` § 9 — ככל שנגררים רחוק יותר מעבר לקצה, כך הגיליון זז פחות. */
function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * overshoot);
}

/** `:209` — אריח מוחזק: מסגרת זהב + גליף. נעול: מסגרת עמומה + מנעול (⛔ צבע ⛔ אינו הערוץ היחיד). */
function closetTileLabel(tile: ClosetTile): string {
  const name = ITEM_LABELS_HE[tile.item];
  if (tile.held) return `${name}, ${CLOSET_HELD_HE}`;
  return tile.unlockLevel === null
    ? `${name}, ${CLOSET_LOCKED_HE}`
    : `${name}, ${CLOSET_LOCKED_HE}, נפתח ב${LEVEL_HE} ${tile.unlockLevel}`;
}

/**
 * 🗄️ **T-488 · `D-292` · `kol-B-02-gear.png` — ארון הציוד כגיליון תחתון.**
 * 🎯 `render_video_B.py:193-225` (`screen_home`, `drawer=1`), ⛔ נגרף ולא נאמד:
 *   ⓐ קצה עליון ב-`top = 366` מתוך `LH = 812` ⇒ גובה **446** ⇒ `h-[min(55dvh,446px)]`
 *      (446 / 812 = 54.9%) — הדמות והכותרת נשארות גלויות מעליו.
 *   ⓑ ידית `44×5` ב-`top + 12` · כותרת `ארון ציוד` 17 Bold מימין ב-`top + 44` ·
 *      `פריטים מקרבות בלבד` 11 מזהב משמאל.
 *   ⓒ רשת **4 עמודות**, מרווח **10**, `iw = (LW − 48 − 30) / 4` ⇒ ב-`grid-cols-4` התא
 *      נגזר מהרוחב ⇒ **60.5px ב-320**, ⛔ ולא גולש (`F-246`: הגלישה ישבה בתוך המיכל).
 *   ⓓ רדיוס עליון `26` ⇒ `rounded-t-2xl` (16, הגדול בסולם החמישה) · התא `12` ⇒ `rounded-xl`.
 * ⚠️ **שכבה א׳ גוברת:** תווית השם `9.5` ושורת התנאי `8` של הרנדר עולות ל-`text-xs` (`D-137`).
 * ⛔ **ואין בחירת פריט ללבישה** (`D-292`): האריח **מציג**; ⛔ אינו כפתור.
 */
function GearClosetSheet({
  open,
  tiles,
  onClose,
  onExited,
}: {
  readonly open: boolean;
  readonly tiles: readonly ClosetTile[];
  readonly onClose: () => void;
  readonly onExited: () => void;
}): React.JSX.Element {
  /** T-489 — `shown` מתחיל `false` ⇒ הפריים הראשון מצויר מחוץ למסך, והמעבר רץ ממנו. */
  const [shown, setShown] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; y0: number; samples: { y: number; t: number }[] } | null>(null);
  const exitedRef = useRef(onExited);
  exitedRef.current = onExited;

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setShown(true);
        sheetRef.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    // ⛔ `prefers-reduced-motion` ⇒ ⛔ אין מעבר, ⇒ ⛔ אין `transitionend` לחכות לו.
    if (prefersReducedMotion()) {
      exitedRef.current();
      return undefined;
    }
    // רשת ביטחון: `transitionend` ⛔ אינו מובטח (לשונית ברקע, מעבר שבוטל).
    const t = window.setTimeout(() => exitedRef.current(), CLOSET_EXIT_MS + 120);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /** `apple-design` § 2 — הגיליון דבוק לאצבע 1:1, ⛔ בלי מעבר, מנקודת האחיזה. */
  function onHandleDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = sheetRef.current;
    // אצבע שנייה אינה חוטפת את הגרירה.
    if (drag.current || !el || !open) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { id: e.pointerId, y0: e.clientY, samples: [{ y: e.clientY, t: e.timeStamp }] };
    el.style.transition = 'none';
  }
  function onHandleMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = sheetRef.current;
    if (!d || !el || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y0;
    // § 9 — למעלה מעבר לקצה: התנגדות הולכת וגדלה, ⛔ ולא קיר.
    el.style.transform = `translateY(${dy >= 0 ? dy : -rubberband(-dy, el.offsetHeight)}px)`;
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 5) d.samples.shift();
  }
  function onHandleUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = sheetRef.current;
    if (!d || !el || e.pointerId !== d.id) return;
    drag.current = null;
    const dy = e.clientY - d.y0;
    const first = d.samples[0] ?? { y: d.y0, t: e.timeStamp };
    const dt = e.timeStamp - first.t;
    // px/ms, חיובי = למטה.
    const velocity = dt > 0 ? (e.clientY - first.y) / dt : 0;
    // ⛔ הסגנון המוטבע מתנקה **באותו אירוע** שבו המצב מתחלף ⇒ המעבר יוצא מהמקום הנוכחי.
    el.style.transition = '';
    el.style.transform = '';
    if (dy > el.offsetHeight * CLOSET_DISMISS_FRACTION || velocity > CLOSET_FLICK_PX_PER_MS) onClose();
  }

  return (
    <>
      {/* `:197` — `fill=(6, 10, 20, 150)` ⇒ ~60%. הקשה על הרקע סוגרת (⛔ שולח את האצבע
          לשום מקום אחר: המסך שמתחתיו מכוסה). */}
      <button
        type="button"
        aria-label={CLOSET_CLOSE_HE}
        data-arena-closet-backdrop
        tabIndex={-1}
        className={[
          'fixed inset-0 z-40 bg-[color:color-mix(in_srgb,var(--arena-hp-track)_60%,transparent)]',
          'transition-opacity motion-reduce:transition-none',
          shown ? 'opacity-100 duration-[280ms]' : 'pointer-events-none opacity-0 duration-[220ms]',
        ].join(' ')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="arena-closet-heading"
        data-arena-closet
        data-state={shown ? 'open' : 'closed'}
        ref={sheetRef}
        tabIndex={-1}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'transform' && !open) onExited();
        }}
        className={[
          'fixed inset-x-0 bottom-0 z-50 flex h-[min(55dvh,446px)] flex-col rounded-t-2xl ' +
            'border-t border-[color:var(--brand)] bg-[color:var(--arena-card)] px-6 pt-0 ' +
            'pb-[max(1rem,env(safe-area-inset-bottom))] outline-none',
          // T-489 · `35 § 4` — `transform` בלבד · 280ms פתיחה / 220ms סגירה (יציאה מהירה
          // מכניסה) · עקומת מגירה `(0.32, 0.72, 0, 1)`. ⛔ `transition` ⛔ ולא `@keyframes`:
          // מעבר מתהפך מהערך הנוכחי ⇒ פתיחה באמצע סגירה ⛔ אינה קופצת.
          'transition-transform ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
          shown ? 'translate-y-0 duration-[280ms]' : 'translate-y-full duration-[220ms]',
        ].join(' ')}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
          {/* `:200` — הידית 44×5; **אזור האחיזה** הוא כל הרוחב בגובה 44 (שכבה א׳).
              ⛔ `touch-none` — אחרת הדפדפן לוקח את הגרירה לגלילה. */}
          <div
            aria-hidden
            data-arena-closet-handle
            className="flex h-11 w-full shrink-0 cursor-grab touch-none items-center justify-center"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
          >
            <span className="h-[5px] w-11 rounded-full bg-[color:var(--arena-card-edge)]" />
          </div>
          {/* ⚠️ `flex` רגיל (`T-338`) — הכותרת היא הילד הראשון, ובמיכל RTL מקומה בימין. */}
          <div className="mt-2 flex shrink-0 items-baseline justify-between" data-rtl-row="drawer-heading">
            <h2 id="arena-closet-heading" className="text-[17px] font-bold leading-none text-[color:var(--arena-ink)]">
              {DRAWER_HE}
            </h2>
            <p className="text-xs leading-none text-[color:var(--brand-surface)]">{DRAWER_NOTE_HE}</p>
          </div>
          {/* ⚠️ `grid` ⛔ ולא `flex-wrap`: 4 עמודות שוות **מתוך** הרוחב ⇒ ⛔ אין רוחב תוכן
              שיכול לעלות על רוחב המיכל, ⇒ `ul.scrollWidth == ul.clientWidth` בכל רוחב.
              ⚠️ ב-RTL עמודה 1 היא הימנית — כמו `x = LW - 24 - iw - col*(iw+10)` ברנדר. */}
          <ul
            className="mt-5 grid min-h-0 grid-cols-4 gap-x-[10px] gap-y-3 overflow-y-auto overscroll-contain"
            data-rtl-row="drawer-slots"
          >
            {tiles.map((tile) => (
              <li key={tile.item} data-arena-closet-tile={tile.held ? 'held' : 'locked'} className="flex min-w-0 flex-col items-center gap-1">
                <span
                  aria-hidden
                  className={[
                    'flex aspect-square w-full min-w-touch items-center justify-center rounded-xl [&>svg]:h-6 [&>svg]:w-6',
                    tile.held
                      ? 'border-[1.4px] border-[color:var(--brand)] bg-[color:var(--arena-card)] text-[color:var(--brand-surface)]'
                      : 'border border-[color:var(--arena-card-edge)] bg-[color:var(--arena-hp-track)] text-[color:var(--arena-ink-dim)]',
                  ].join(' ')}
                >
                  {tile.held ? <ItemGlyph /> : <LockIcon />}
                </span>
                <span aria-hidden className="text-xs leading-tight text-[color:var(--arena-ink-dim)]">
                  {ITEM_LABELS_HE[tile.item]}
                </span>
                {!tile.held && tile.unlockLevel !== null && (
                  <span aria-hidden className="text-xs leading-tight text-[color:var(--brand-surface)]">
                    {LEVEL_HE} {tile.unlockLevel}
                  </span>
                )}
                <span className="sr-only">{closetTileLabel(tile)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
