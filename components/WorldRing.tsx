'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LockIcon from '@/components/LockIcon';
import { apiGet } from '@/lib/api/client';
import { toFailureCode, worstFailure, type FailureCode } from '@/lib/core/failureExit';
import { LAST_NODE_KEY, parseLastNode } from '@/lib/core/lastNode';
import { levelTooSmallNoteHe, libraryTile, type StoriesStatus } from '@/lib/core/worldApps';
import { DEFAULT_RING, nodeRadius, slotPoint } from '@/lib/core/ringEdit';
import { ringBannerHe, startRing } from '@/lib/core/ringMode';
import { readRing } from '@/lib/ringStore';
import {
  RING_RADIUS,
  ringScreen,
  type RingInputs,
  type RingNode,
  type RingNodeId,
  type RingNodeState,
  type RingScreen,
} from '@/lib/core/worldRing';

/**
 * טבעת `העולם` — המעטפת (T-205 · T-206ⓑⓒⓓⓔ · D-117 · D-118 · D-119).
 * 🎯 **הרנדר: `docs/design/kol-world-ring.png`**, והוא מחייב **פריסה וגימור כאחד**
 * (`36 § 14.4` · D-114). שכבה A היא ההחרגה היחידה.
 *
 * חמש ההכרעות כאן הן חוקי המשימה ⛔ ולא טעם:
 *
 * 1. **⛔ אין גזירה שנייה.** הסדר, התוויות, המחלקות והגאומטריה יוצאים כולם
 *    מ-`lib/core/worldRing.ts`. הקובץ הזה **מצייר**, ⛔ ואינו מחליט. ⇒ בדיקה
 *    שרצה בלי DOM כבר קבעה איפה כל צומת יושב.
 *
 * 2. **המיפוי מהחוט משתמש בממפים הקיימים ⛔ ואינו כותב נוסח עברי שני:**
 *    `levelTooSmallNoteHe` ו-`libraryTile` מ-`worldApps.ts`. ⛔ עותק שני של
 *    משפט הוא שני משפטים שנפרדים בשקט — בדיוק מה ש-D-046 נשמרת מפניו.
 *
 * 3. **⛔ הרכיב ⛔ אינו כותב דבר לשרת:** `apiGet` בלבד, ⛔ אפס `apiPost`,
 *    ⛔ אפס נגיעה ב-`word_progress` — כרטיס הבידוד בתחתית המסך אומר בדיוק את זה,
 *    והקוד ⛔ אינו רשאי לסתור אותו.
 *
 * 4. **מצב נעול נושא מנעול, ⛔ ולא רק עמעום** (חוקה שכבה A · § 1): הצבע ⛔ לעולם
 *    ⛔ אינו הערוץ היחיד. שתי מחלקות הנעילה נבדלות בנוסח ⛔ ולא בגוון.
 *
 * 5. **«כאן היית» הוא סימן צורה** (T-206ⓒ) — טבעת חיצונית סביב הצומת **וגם**
 *    ‏`aria-label` שאומר זאת במילים. ⛔ ⛔ אין ניווט אוטומטי אליו (T-206ⓓ),
 *    ⛔ אין ספירת ביקורים ו⛔ אין מספר.
 *
 * ⛔ אפס מדדי משחק מסוג D-050: ⛔ אין ניקוד, מטבע, רצף או לוח תוצאות.
 */

const HEADING_HE = 'העולם';
const SUBHEADING_HE = 'מרחב פתוח · לא נספר להתקדמות הלמידה';
const ISOLATION_TITLE_HE = 'בידוד מלא מהלמידה';
const ISOLATION_BODY_HE = 'ניצחון או הפסד לא נוגעים ב-word_progress';
const FOCUS_HE = 'קול';
/** T-504ⓑ — the focus is the way into `kol-E-02`. */
export const APP_CENTRE_HREF = '/world/apps';
const APP_CENTRE_LABEL_HE = 'מרכז האפליקציות';
const LOADING_HE = 'טוען את העולם…';
const HERE_YOU_WERE_HE = 'כאן היית';
const RETRY_HREF = '/world';

/** ⛔ בדיוק מה ש-`GET /api/arcade/round` עונה היום (T-108), ⛔ ולא יותר. */
type RoundResponse =
  | {
      readonly ok: true;
      readonly gameLevel: number;
      readonly round: { readonly questions: readonly unknown[] };
    }
  | {
      readonly ok: true;
      readonly gameLevel: number;
      readonly round: null;
      readonly reason: 'level_too_small';
      readonly eligible: number;
      readonly required: number;
    }
  | { readonly ok: true; readonly gameLevel: number; readonly round: null }
  | { readonly ok: false; readonly code: string };

/** ⛔ בדיוק שדה `stories` של `GET /api/world/status` (`docs/api-contract.md`). */
type StatusResponse =
  | { readonly ok: true; readonly stories: StoriesStatus | null }
  | { readonly ok: false; readonly code: string };

/**
 * ⛔ שלוש צורות בלבד — הצומת ⛔ אינו מכיר קודי שגיאה, בדיוק כמו `<ArcadeEntry>`
 * וכמו הרשת שהוא מחליף.
 *
 * ⚠️ **ומה שהוא ⛔ אינו קורא, ⛔ ובכוונה:** `worldGateSentenceHe` ⛔ אינו נקרא כאן.
 * ‏D-117 מעבירה את נוסחו לצומת `זירת קרב`, אבל הנוסח עצמו פותח ב«**העולם** ייפתח
 * כשיהיו לך N מילים פעילות» — טענה שהמסך הזה **מפריך בעצם קיומו**, כי אחרי D-117
 * העולם ⛔ אינו נעול. הצגתה ללומד היא מחרוזת שקרית ⛔ ולא גימור. ⇒ נרשם כממצא
 * ל-PM (`plan/60-findings.md`) ⛔ ולא נסגר כאן בשקט, ו-`lib/core/worldGate.ts`
 * ⛔ אינו נערך ו⛔ אינו נמחק.
 */
function toArenaState(body: RoundResponse): RingNodeState {
  if (!body.ok) return { kind: 'unknown' };
  if (body.round !== null) return { kind: 'open', href: '/arcade' };
  if ('reason' in body && body.reason === 'level_too_small') {
    const { required, eligible } = body;
    return { kind: 'locked_count', noteHe: levelTooSmallNoteHe(required, eligible) };
  }
  return { kind: 'unknown' };
}

/** `libraryTile` מכריע את שלושת ענפי הספרייה — ⛔ אין כאן ענף שני (T-137ⓓ). */
function toStoriesState(status: StoriesStatus | null): RingNodeState {
  const tile = libraryTile(status);
  if (tile.state.kind === 'open') return { kind: 'open', href: tile.href };
  if (tile.state.kind === 'locked') {
    return { kind: 'locked_count', noteHe: tile.state.noteHe };
  }
  return { kind: 'unknown' };
}

/* ── האייקונים · SVG בשורה, ⛔ לעולם ⛔ לא אימוג׳י (חוקה § 6) ─────────────────
   `currentColor` ובלי `fill`, כך שכל אייקון יורש את צבע הטקסט שסביבו בשני
   המצבים — ⛔ ואין כאן הקס שהפלטה אינה מכירה. */

const ICON_PATHS: Readonly<Record<RingNodeId, React.JSX.Element>> = {
  arena: (
    <>
      <path d="M4 4h3l9.5 9.5" />
      <path d="M20 4h-3l-4 4" />
      <path d="M5.5 19.5 9 16" />
      <path d="M18.5 19.5 15 16" />
    </>
  ),
  msgs: (
    <>
      <path d="M4 5.5h16v11H9l-5 3.5z" />
      <path d="M8 9.5h8" />
      <path d="M8 12.5h5" />
    </>
  ),
  amirnet: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  stories: (
    <>
      <path d="M12 6.5C10 5 7.5 4.7 4.5 5v13c3-.3 5.5 0 7.5 1.5" />
      <path d="M12 6.5C14 5 16.5 4.7 19.5 5v13c-3-.3-5.5 0-7.5 1.5" />
      <path d="M12 6.5v13" />
    </>
  ),
  compose: (
    <>
      <path d="M17.5 4.5 20 7l-11 11-3.5 1 1-3.5z" />
      <path d="M15.5 6.5 18 9" />
    </>
  ),
  sentences: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h11" />
      <path d="M4 17h7" />
      <circle cx="17" cy="17" r="1.2" />
    </>
  ),
  vocab: (
    <>
      <rect x="4" y="5" width="6.5" height="14" rx="1.5" />
      <rect x="13.5" y="5" width="6.5" height="14" rx="1.5" />
    </>
  ),
  leaders: (
    <>
      <path d="M8 4.5h8v4a4 4 0 0 1-8 0z" />
      <path d="M8 5.5H5.5v1.5A3 3 0 0 0 8 10" />
      <path d="M16 5.5h2.5V7a3 3 0 0 1-2.5 3" />
      <path d="M12 12.5V16" />
      <path d="M8.5 19.5h7" />
    </>
  ),
  friends: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9.5" r="2.2" />
      <path d="M15 14.6c2.7-.5 5.5 1.2 5.5 4.4" />
    </>
  ),
};

function RingIcon({ id }: { readonly id: RingNodeId }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[id]}
    </svg>
  );
}

function GlobeIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5z" />
    </svg>
  );
}

/* ── הצומת ──────────────────────────────────────────────────────────────────
   ⛔ **44×44 הוא רצפה, ⛔ ולא שאיפה** (חוקה שכבה A4). קוטר העיגול 60px, וגם
   התווית שמתחתיו היא חלק **מאותו** יעד מגע — ⛔ אין כאן מטרה שמצוירת גדול
   ונוגעים בה קטן. */

const NODE_BASE =
  'absolute flex min-h-touch min-w-touch -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1';
const NODE_OPEN = 'text-ink active:opacity-90';
/** שתי מחלקות הנעילה נראות אותו דבר **בכוונה** — הן נבדלות ב**נוסח**, ⛔ ולא בגוון. */
const NODE_SHUT = 'text-ink-muted opacity-70';

function noteOf(state: RingNodeState): string | null {
  if (state.kind === 'locked_count' || state.kind === 'locked_infra') return state.noteHe;
  return null;
}

function NodeCircle({
  node,
  wasHere,
  size,
}: {
  readonly node: RingNode;
  readonly wasHere: boolean;
  /** T-504ⓐ — `2 × nodeRadius(n)`: the nodes shrink as the ring fills (56 at the smallest, ⛔ never under 44). */
  readonly size: number;
}): React.JSX.Element {
  const shut = node.state.kind !== 'open';
  return (
    <span
      style={{ height: `${size}px`, width: `${size}px` }}
      className={`relative flex items-center justify-center rounded-full border bg-surface-raised ${
        shut ? 'border-border-subtle' : 'border-border-strong'
      } ${wasHere ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : ''}`}
    >
      <RingIcon id={node.id} />
      {shut ? (
        // ⛔ המנעול הוא **הערוץ השני**, ⛔ ולא קישוט: עמעום לבדו הוא מצב בצבע בלבד.
        // ⛔ `-start` ו⛔ לא `-end`: ב-RTL זו הפינה הימנית־עליונה, וזה בדיוק המקום
        // שבו `kol-world-ring.png` מצייר את המנעול על `מובילים` ועל `חברים`.
        <span className="absolute -start-0.5 -top-0.5 rounded-full border border-border-subtle bg-surface p-0.5 text-ink-muted">
          <LockIcon />
        </span>
      ) : null}
    </span>
  );
}

function RingNodeItem({
  node,
  wasHere,
  onPick,
  slot,
  n,
}: {
  readonly node: RingNode;
  readonly wasHere: boolean;
  readonly onPick: (id: RingNodeId) => void;
  /** T-504ⓐ — the node's place in the LEARNER's ring, ⛔ not a fixed angle per app. */
  readonly slot: number;
  readonly n: number;
}): React.JSX.Element {
  const { x, y } = slotPoint(slot, n);
  // ⚠️ התווית **מחוץ לעיגול** כמו ברנדר, ומעליו בחצי העליון ומתחתיו בחצי התחתון
  // — בדיוק כפי ש-`kol-D-01-world.png` מצייר את תשעת הצמתים (`D-182`).
  const labelAbove = y <= 0;
  const style = { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` } as const;
  const note = noteOf(node.state);
  const label = (
    <span className="pointer-events-none whitespace-nowrap text-[11.5px] font-semibold text-ink-muted">
      {node.labelHe}
    </span>
  );
  const inner = (
    <>
      {labelAbove ? label : null}
      <NodeCircle node={node} wasHere={wasHere} size={nodeRadius(n) * 2} />
      {labelAbove ? null : label}
    </>
  );
  const shell = NODE_BASE;

  if (node.state.kind === 'open') {
    const { href } = node.state;
    return (
      <Link
        href={href}
        data-ring-node={node.id}
        aria-label={wasHere ? `${node.labelHe} · ${HERE_YOU_WERE_HE}` : node.labelHe}
        onClick={() => onPick(node.id)}
        className={`${shell} ${NODE_OPEN}`}
        style={style}
      >
        {inner}
      </Link>
    );
  }
  return (
    // `<button type="button">` בלי handler עם `aria-disabled` ⛔ ולא התכונה `disabled`:
    // הצומת נשאר בר-מיקוד, כך שלומד עם קורא-מסך מגיע אליו ושומע שהוא חסום **ולמה**.
    <button
      type="button"
      aria-disabled="true"
      data-ring-node-blocked={node.id}
      aria-label={note === null ? node.labelHe : `${node.labelHe} · ${note}`}
      className={`${shell} ${NODE_SHUT}`}
      style={style}
    >
      {inner}
    </button>
  );
}

/**
 * ⛔ **אזור שגיאה אחד למסך, ⛔ ופעולה אחת** — T-146 ו-T-148 כלשונן, ושתיהן
 * מגיעות מ-`ringScreen` ⛔ ואינן נגזרות כאן שנית. ⛔ אין כאן «שגיאה **וגם**
 * תוכן»: כשזה מצויר, הטבעת ⛔ אינה על המסך.
 */
function RingEmpty({
  messageHe,
  actionHref,
  actionLabelHe,
}: {
  readonly messageHe: string;
  readonly actionHref: string;
  readonly actionLabelHe: string;
}): React.JSX.Element {
  return (
    <div data-ring-empty className="flex flex-col items-start gap-4 py-10">
      <p className="text-lg leading-relaxed text-ink">{messageHe}</p>
      {/* ⛔ `<a>` ולא `<Link>`, ובדיוק מהטעם ש-`LevelMapScreen` נושא: כשהסשן מת
          הבקשה הבאה **חייבת** להגיע לשרת ולקבל רשות להפנות — הראוטר של הלקוח
          עלול לענות `/login` מהמטמון של עצמו, ואז היציאה ⛔ אינה יציאה. */}
      <a
        href={actionHref}
        className="flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-base text-ink active:opacity-90"
      >
        {actionLabelHe}
      </a>
    </div>
  );
}

export function WorldRingView({
  screen,
  lastNode,
  onPick,
  ring = DEFAULT_RING,
}: {
  readonly screen: RingScreen;
  readonly lastNode: RingNodeId | null;
  readonly onPick?: (id: RingNodeId) => void;
  /** T-504 — the learner's ring (`kol.ring.v1`, D-296): which nodes, in which order. */
  readonly ring?: readonly RingNodeId[];
}): React.JSX.Element {
  const pick = onPick ?? (() => undefined);
  // ⛔ The screen still decides each node's STATE (`ringScreen`); the ring decides only
  // which of them are drawn and where. An id the screen has no node for is skipped.
  const drawn =
    screen.kind === 'ring'
      ? ring.flatMap((id) => screen.nodes.filter((node) => node.id === id))
      : [];
  const banner = ringBannerHe(startRing(drawn.map((node) => node.id)));
  return (
    <section data-world-ring className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">{HEADING_HE}</h1>
        <p className="text-sm text-ink-muted">{SUBHEADING_HE}</p>
      </header>

      {screen.kind === 'empty' ? (
        <RingEmpty
          messageHe={screen.messageHe}
          actionHref={screen.actionHref}
          actionLabelHe={screen.actionLabelHe}
        />
      ) : (
        <div
          data-ring
          className="relative mx-auto h-[300px] w-full max-w-[300px]"
        >
          {/* שתי טבעות המתאר של הרנדר — r ו-r+26. ⛔ קישוט, ⛔ ולא מצב. */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-subtle"
            style={{ height: `${RING_RADIUS * 2}px`, width: `${RING_RADIUS * 2}px` }}
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-subtle opacity-40"
            style={{ height: `${(RING_RADIUS + 26) * 2}px`, width: `${(RING_RADIUS + 26) * 2}px` }}
          />
          {/* המוקד `קול` — העיגול המוגבה שבמרכז. הזוהר הוא **אחד משניים** שהמסך
              מרשה לעצמו (חוקה ב3), והשני הוא העיגול המרכזי בסרגל. */}
          <Link
            href={APP_CENTRE_HREF}
            aria-label={APP_CENTRE_LABEL_HE}
            data-ring-focus
            data-glow="true"
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border border-brand bg-surface-raised text-brand active:opacity-90"
          >
            <GlobeIcon />
            <span className="text-[13px] font-bold text-ink">{FOCUS_HE}</span>
          </Link>
          {drawn.map((node, i) => (
            <RingNodeItem
              key={node.id}
              node={node}
              wasHere={node.id === lastNode}
              onPick={pick}
              slot={i}
              n={drawn.length}
            />
          ))}
        </div>
      )}

      {screen.kind === 'ring' ? (
        <div
          data-ring-banner={banner.tone}
          className={`flex flex-col gap-1 rounded-2xl border bg-surface-raised px-4 py-3 ${
            banner.tone === 'success' ? 'border-success' : 'border-brand'
          }`}
        >
          <span className={`text-base font-bold ${banner.tone === 'success' ? 'text-success' : 'text-ink'}`}>
            {banner.title}
          </span>
          <span className="text-[13px] text-ink-muted">{banner.sub}</span>
        </div>
      ) : null}

      <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-surface-raised px-5 py-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="mt-0.5 h-5 w-5 shrink-0 text-success"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-ink">{ISOLATION_TITLE_HE}</span>
          <span className="text-xs text-ink-muted">{ISOLATION_BODY_HE}</span>
        </span>
      </div>
    </section>
  );
}

/**
 * ⛔ **הקריאה והכתיבה ב-`localStorage` ב-`try/catch`** (T-206ⓔ): דפדפן שחוסם
 * אחסון מקבל טבעת **בלי סימן**, ⛔ ולא מסך שבור. תקדים בריפו:
 * `components/InstallPrompt.tsx`.
 */
function readLastNode(): RingNodeId | null {
  try {
    return parseLastNode(window.localStorage.getItem(LAST_NODE_KEY));
  } catch {
    return null;
  }
}

/**
 * ⛔ **קריאה אחת ⇒ מצב **וגם** קוד** (T-146ⓒ). `toArenaState` ו-`toStoriesState`
 * משטחים כל כשל ל-`unknown` **בכוונה** — הצומת ⛔ אינו מכיר קודי שגיאה (D-118),
 * וזה נשאר נכון. אבל **המסך** כן חייב להכיר אותם, אחרת «נסה שוב» הוא הפעולה
 * היחידה שהוא יודע להציע, ו-D-065 נשברת. ⇒ הקוד נוסע לצד המצב, ⛔ ולא בתוכו.
 */
interface Read {
  readonly state: RingNodeState;
  /** `null` = הקריאה הזאת ⛔ לא נכשלה. ⛔ ⛔ אינו `'unavailable'` — ראה `worstFailure`. */
  readonly code: FailureCode | null;
}

export default function WorldRing(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [arena, setArena] = useState<RingNodeState>({ kind: 'unknown' });
  const [stories, setStories] = useState<RingNodeState>({ kind: 'unknown' });
  const [failure, setFailure] = useState<FailureCode>('unavailable');
  const [lastNode, setLastNode] = useState<RingNodeId | null>(null);
  const [ring, setRing] = useState<readonly RingNodeId[]>(DEFAULT_RING);

  // ⛔ **⛔ אין כאן ניווט** (T-206ⓓ): הקריאה מסמנת צומת אחד, ⛔ ואינה מזיזה איש.
  // T-504 — and the learner's own ring (D-296) is read in the same mount, from this device.
  useEffect(() => {
    setLastNode(readLastNode());
    setRing(readRing());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [round, status] = await Promise.all([
        apiGet<RoundResponse>('/api/arcade/round').then(
          (body): Read => ({
            state: toArenaState(body),
            code: body.ok ? null : toFailureCode(body.code),
          }),
          // ⛔ הבקשה ⛔ לא הגיעה לשרת (`ApiUnreachableError`) — זו התקלה החולפת.
          (): Read => ({ state: { kind: 'unknown' }, code: 'unavailable' }),
        ),
        apiGet<StatusResponse>('/api/world/status').then(
          (body): Read => ({
            state: toStoriesState(body.ok ? body.stories : null),
            code: body.ok ? null : toFailureCode(body.code),
          }),
          (): Read => ({ state: { kind: 'unknown' }, code: 'unavailable' }),
        ),
      ]);
      if (cancelled) return;
      setArena(round.state);
      setStories(status.state);
      // ⛔ **מסך אחד ⇒ קוד אחד**, והכלל הוא של `failureExit` ⛔ ואינו נכתב כאן:
      // ⛔ «מי שענה אחרון» היה הופך את היציאה של הלומד לתלוית זמני רשת.
      setFailure(
        worstFailure(
          [round.code, status.code].filter((code): code is FailureCode => code !== null),
        ),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onPick = (id: RingNodeId): void => {
    try {
      window.localStorage.setItem(LAST_NODE_KEY, id);
    } catch {
      // אחסון חסום ⇒ ⛔ אין סימן בכניסה הבאה. ⛔ זה ⛔ אינו מצב שגיאה ללומד.
    }
  };

  if (loading) {
    // אזור חי אחד — קורא מסך שומע «טוען», ⛔ ולא תשעה עיגולים ריקים.
    return (
      <section data-world-ring aria-busy="true" className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-ink">{HEADING_HE}</h1>
          <p className="text-sm text-ink-muted">{SUBHEADING_HE}</p>
        </header>
        <p className="py-10 text-lg text-ink-muted">{LOADING_HE}</p>
      </section>
    );
  }

  // ⛔ ארבעה קלטים, ⛔ ושניים מהם קבועים: `כתיבה חופשית` ו`אוצר מילים` פתוחים
  // תמיד — מצב ריק בעל פעולה אחת ⛔ אינו תנאי פתיחה (§ 4.2יב), בדיוק כמו ברשת.
  const inputs: RingInputs = {
    arena,
    stories,
    compose: { kind: 'open', href: '/world/compose' },
    vocab: { kind: 'open', href: '/world/collected' },
  };
  return (
    <WorldRingView
      screen={ringScreen(inputs, RETRY_HREF, failure)}
      lastNode={lastNode}
      onPick={onPick}
      ring={ring}
    />
  );
}
