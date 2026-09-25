'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import LockIcon from '@/components/LockIcon';
import { apiGet } from '@/lib/api/client';
import { toFailureCode, worstFailure, type FailureCode } from '@/lib/core/failureExit';
import { LAST_NODE_KEY, parseLastNode } from '@/lib/core/lastNode';
import { levelTooSmallNoteHe, libraryTile, type StoriesStatus } from '@/lib/core/worldApps';
import { DEFAULT_RING, nodeRadius, slotFromPoint, slotPoint } from '@/lib/core/ringEdit';
import { ringBannerHe, ringLayout, ringStep, startRing, type RingNotice, type RingState } from '@/lib/core/ringMode';
import { releaseCurve } from '@/lib/core/spring';
import { placingFrom, readRing, writeRing } from '@/lib/ringStore';
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
/** T-505ⓒ — the tap path, so placing ⛔ never needs a drag (a switch user has none). */
const MOVE_GAP_HE = 'הזז את המקום הפנוי לכאן';
/** T-506 — the hub while editing (`kol-E-05`), and the ✕'s spoken name. */
const DONE_HE = 'סיום';
const REMOVE_HE = 'הסר';
/** D-296ⓑ — `render_video_E.py` `scene_edit` `hold = .5`, and the thumb's slack before it is a scroll. */
export const LONG_PRESS_MS = 500;
export const LONG_PRESS_SLOP_PX = 8;
const placeHereHe = (labelHe: string): string => `הנח את «${labelHe}» כאן`;
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
  onRemove,
}: {
  readonly node: RingNode;
  readonly wasHere: boolean;
  /** T-506ⓑ — edit mode: the ✕ in the corner (`kol-E-05`), and the lock steps aside for it. */
  readonly onRemove?: () => void;
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
      {onRemove !== undefined ? (
        // T-506ⓑ — a 24px `danger` disc on the frame (3341:152), inside a 44×44 target
        // (constitution A4): the padding is the hit area, ⛔ not the drawing.
        <button
          type="button"
          data-ring-remove={node.id}
          aria-label={`${REMOVE_HE} את ${node.labelHe}`}
          onClick={onRemove}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-5 -top-5 z-10 flex h-12 w-12 items-center justify-center"
        >
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-surface-raised">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </span>
        </button>
      ) : shut ? (
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
  slide = null,
  onSlotTap,
  onLongPress,
  onRemove,
  drag,
  lifted = null,
}: {
  readonly node: RingNode;
  readonly wasHere: boolean;
  readonly onPick: (id: RingNodeId) => void;
  /** T-504ⓐ — the node's place in the LEARNER's ring, ⛔ not a fixed angle per app. */
  readonly slot: number;
  readonly n: number;
  /** T-505ⓓ — the spring the nodes slide on when the ring realigns; `null` = jump. */
  readonly slide?: string | null;
  /** T-505ⓒ — while placing, a tap on a resting node moves the free slot to it. */
  readonly onSlotTap?: () => void;
  /** T-506ⓐ — browse: a 500ms hold (or the context menu) opens edit mode. */
  readonly onLongPress?: () => void;
  /** T-506ⓑ — edit mode: the node ⛔ does not navigate, and carries a ✕. */
  readonly onRemove?: () => void;
  /** T-507ⓐ — edit mode: the pointer handlers that drag this node. */
  readonly drag?: DragHandlers;
  /** T-507ⓐ — while dragged, the node sits under the finger (ring-centred px). */
  readonly lifted?: { readonly x: number; readonly y: number } | null;
}): React.JSX.Element {
  const { fired, ...press } = useLongPress(onLongPress);
  const { x, y } = lifted ?? slotPoint(slot, n);
  // ⚠️ התווית **מחוץ לעיגול** כמו ברנדר, ומעליו בחצי העליון ומתחתיו בחצי התחתון
  // — בדיוק כפי ש-`kol-D-01-world.png` מצייר את תשעת הצמתים (`D-182`).
  const labelAbove = y <= 0;
  // T-505ⓓ — the offset rides the `translate` property (compositor-only, `check:motion`),
  // on top of the `-translate-*-1/2` centring in `transform`, so a realign can glide.
  const style = {
    left: '50%',
    top: '50%',
    translate: `${x}px ${y}px`,
    // under the finger it tracks 1:1 — ⛔ no curve between the finger and the node
    transition: slide === null || lifted !== null ? undefined : `translate ${slide}`,
  } as const;
  const note = noteOf(node.state);
  const label = (
    <span className="pointer-events-none whitespace-nowrap text-[11.5px] font-semibold text-ink-muted">
      {node.labelHe}
    </span>
  );
  const inner = (
    <>
      {labelAbove ? label : null}
      <NodeCircle node={node} wasHere={wasHere} size={nodeRadius(n) * 2} onRemove={onRemove} />
      {labelAbove ? null : label}
    </>
  );
  const shell = NODE_BASE;

  if (onRemove !== undefined) {
    return (
      <div
        data-ring-node-editing={node.id}
        data-dragging={lifted === null ? undefined : 'true'}
        {...drag}
        className={`${shell} ${NODE_OPEN} touch-none select-none ${lifted === null ? '' : 'z-20 scale-[1.15] drop-shadow-lg'}`}
        style={style}
      >
        {inner}
      </div>
    );
  }

  if (onSlotTap !== undefined) {
    return (
      <button
        type="button"
        data-ring-slot={slot}
        data-ring-node-resting={node.id}
        aria-label={`${node.labelHe} · ${MOVE_GAP_HE}`}
        onClick={onSlotTap}
        className={`${shell} ${NODE_OPEN}`}
        style={style}
      >
        {inner}
      </button>
    );
  }

  if (node.state.kind === 'open') {
    const { href } = node.state;
    return (
      <Link
        href={href}
        data-ring-node={node.id}
        aria-label={wasHere ? `${node.labelHe} · ${HERE_YOU_WERE_HE}` : node.labelHe}
        {...press}
        onClick={(e) => {
          // the hold already opened edit mode ⇒ this release is ⛔ not a navigation
          if (fired()) {
            e.preventDefault();
            return;
          }
          onPick(node.id);
        }}
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
      {...press}
      aria-label={note === null ? node.labelHe : `${node.labelHe} · ${note}`}
      className={`${shell} ${NODE_SHUT}`}
      style={style}
    >
      {inner}
    </button>
  );
}

interface DragHandlers {
  readonly onPointerDown: (e: React.PointerEvent) => void;
  readonly onPointerMove: (e: React.PointerEvent) => void;
  readonly onPointerUp: (e: React.PointerEvent) => void;
  readonly onPointerCancel: () => void;
}

/** T-507ⓑ — a release this far past the ring's radius is «outside»: back home, ⛔ no change. */
const OUTSIDE_RING_PX = RING_RADIUS + 70;

/**
 * T-506ⓐⓔ — a hold of `LONG_PRESS_MS` without moving more than `LONG_PRESS_SLOP_PX`
 * (so a thumb that scrolls ⛔ never lands in edit mode), or the context menu — which is
 * also what Shift+F10 and a long press on touch fire, so the keyboard has the same door.
 * `fired()` lets the release that ends a hold swallow its click.
 */
function useLongPress(onLongPress?: () => void): {
  readonly onPointerDown?: (e: React.PointerEvent) => void;
  readonly onPointerMove?: (e: React.PointerEvent) => void;
  readonly onPointerUp?: () => void;
  readonly onPointerCancel?: () => void;
  readonly onContextMenu?: (e: React.MouseEvent) => void;
  readonly fired: () => boolean;
} {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const done = useRef(false);
  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);
  if (onLongPress === undefined) return { fired: () => false };
  const clear = (): void => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  };
  return {
    onPointerDown: (e) => {
      done.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        done.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e) => {
      const o = origin.current;
      if (o !== null && Math.hypot(e.clientX - o.x, e.clientY - o.y) > LONG_PRESS_SLOP_PX) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onContextMenu: (e) => {
      e.preventDefault();
      clear();
      if (done.current) return;
      done.current = true;
      onLongPress();
    },
    fired: () => {
      const was = done.current;
      done.current = false;
      return was;
    },
  };
}

/** `prefers-reduced-motion` ⇒ the nodes jump (T-505ⓓ · constitution layer A). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const on = (e: MediaQueryListEvent): void => setReduced(e.matches);
    query.addEventListener('change', on);
    return () => query.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * T-505ⓓ — the ring realigns on `spring.ts`'s critical spring (response 0.3s), sampled into
 * `linear()` so the compositor runs it. ⛔ No second curve: this is the codebase's spring.
 */
function springSlide(): string | null {
  const curve = releaseCurve({ from: 0, velocity: 0, target: 1, reducedMotion: false });
  return curve.ms === 0 ? null : `${curve.ms}ms ${curve.easing}`;
}

/**
 * T-505 — the node being placed (`kol-E-03`): a dashed free slot on the ring, and the node
 * floating just outside it with a 2px `brand` ring. Drag it and the free slot follows the
 * finger (`slotFromPoint`); let go ⇒ drop. ⛔ Not drag-only (ⓒ): a tap on the node or on
 * the free slot drops it where the slot is, and a tap on a resting node moves the slot.
 * `pointercancel` (an incoming call) ⇒ back to rest, ⛔ nothing written.
 */
function PlacingNode({
  node,
  slot,
  n,
  slide,
  onHover,
  onDrop,
}: {
  readonly node: RingNode;
  readonly slot: number;
  readonly n: number;
  readonly slide: string | null;
  readonly onHover: (slot: number) => void;
  readonly onDrop: (slot: number) => void;
}): React.JSX.Element {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const centre = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const current = useRef(slot);
  current.current = slot;

  const gap = slotPoint(slot, n);
  const size = nodeRadius(n) * 2;
  // floats a little outward from its slot, as the frame draws it (3341:92/93)
  const len = Math.hypot(gap.x, gap.y) || 1;
  const rest = { x: gap.x + (gap.x / len) * 14, y: gap.y + (gap.y / len) * 14 };
  const at = drag ?? rest;
  // outside the circle, above it in the upper half — the resting nodes' rule (`D-182`), so
  // the label ⛔ never lands on the dashed free slot next to it
  const floatLabel = (
    <span className="pointer-events-none whitespace-nowrap text-[11.5px] font-semibold text-ink-muted">
      {node.labelHe}
    </span>
  );

  const toRing = (e: React.PointerEvent): { x: number; y: number } | null => {
    const c = centre.current;
    return c === null ? null : { x: e.clientX - c.x, y: e.clientY - c.y };
  };

  return (
    <>
      <button
        type="button"
        data-ring-gap={slot}
        aria-label={placeHereHe(node.labelHe)}
        onClick={() => onDrop(slot)}
        className="absolute left-1/2 top-1/2 flex min-h-touch min-w-touch -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{
          translate: `${gap.x}px ${gap.y}px`,
          transition: slide === null ? undefined : `translate ${slide}`,
        }}
      >
        <span
          aria-hidden="true"
          className="rounded-full border-2 border-dashed border-brand"
          style={{ height: `${size}px`, width: `${size}px` }}
        />
      </button>
      <button
        type="button"
        data-ring-floating={node.id}
        aria-label={placeHereHe(node.labelHe)}
        onPointerDown={(e) => {
          const ringEl = (e.currentTarget as HTMLElement).closest('[data-ring]');
          const r = ringEl?.getBoundingClientRect();
          centre.current = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
          moved.current = false;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (centre.current === null) return;
          const p = toRing(e);
          if (p === null) return;
          if (!moved.current && Math.hypot(p.x - rest.x, p.y - rest.y) < 8) return;
          moved.current = true;
          setDrag(p);
          onHover(slotFromPoint(p, n));
        }}
        onPointerUp={() => {
          centre.current = null;
          moved.current = false;
          setDrag(null);
          // a drag drops where the free slot followed the finger; a tap drops at the slot
          onDrop(current.current);
        }}
        onClick={(e) => {
          // keyboard activation (`detail === 0`) — a pointer already dropped on pointerup
          if (e.detail === 0) onDrop(current.current);
        }}
        onPointerCancel={() => {
          centre.current = null;
          moved.current = false;
          setDrag(null);
        }}
        className="absolute left-1/2 top-1/2 flex min-h-touch min-w-touch -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center gap-1 text-ink"
        style={{
          translate: `${at.x}px ${at.y}px`,
          transition: slide === null || drag !== null ? undefined : `translate ${slide}`,
        }}
      >
        {at.y <= 0 ? floatLabel : null}
        <span
          className={`relative flex items-center justify-center rounded-full border-2 border-brand bg-surface-raised ${
            drag === null ? '' : 'scale-[1.15] shadow-lg'
          }`}
          style={{ height: `${size + 6}px`, width: `${size + 6}px` }}
        >
          <RingIcon id={node.id} />
        </span>
        {at.y <= 0 ? null : floatLabel}
      </button>
    </>
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
  placing = null,
  onPlace,
  notice = null,
  editing = false,
  onLongPress,
  onRemove,
  onDone,
  onMove,
}: {
  readonly screen: RingScreen;
  readonly lastNode: RingNodeId | null;
  readonly onPick?: (id: RingNodeId) => void;
  /** T-504 — the learner's ring (`kol.ring.v1`, D-296): which nodes, in which order. */
  readonly ring?: readonly RingNodeId[];
  /** T-505 — the app just installed and not yet placed (`kol-E-03`). */
  readonly placing?: RingNodeId | null;
  readonly onPlace?: (id: RingNodeId, slot: number) => void;
  /** T-505ⓑ — what the last step did, for the success banner (`kol-E-04`). */
  readonly notice?: RingNotice | null;
  /** T-506 — edit mode (`kol-E-05`/`07`). */
  readonly editing?: boolean;
  readonly onLongPress?: (id: RingNodeId) => void;
  readonly onRemove?: (id: RingNodeId) => void;
  readonly onDone?: () => void;
  /** T-507 — edit mode: a node dropped on another slot. */
  readonly onMove?: (id: RingNodeId, slot: number) => void;
}): React.JSX.Element {
  const pick = onPick ?? (() => undefined);
  const reduced = useReducedMotion();
  // ⛔ The screen still decides each node's STATE (`ringScreen`); the ring decides only
  // which of them are drawn and where. An id the screen has no node for is skipped.
  const drawn =
    screen.kind === 'ring'
      ? ring.flatMap((id) => screen.nodes.filter((node) => node.id === id))
      : [];
  const floatNode =
    placing !== null && screen.kind === 'ring'
      ? (screen.nodes.find((node) => node.id === placing) ?? null)
      : null;
  const state: RingState = {
    ring: drawn.map((node) => node.id),
    mode:
      floatNode !== null
        ? { kind: 'placing', id: floatNode.id }
        : editing
          ? { kind: 'editing' }
          : { kind: 'browse' },
    notice,
  };
  const banner = ringBannerHe(state);
  // T-505 — the free slot. Starts at the end of the ring (where «התקן» would have put it).
  const [hoverSlot, setHoverSlot] = useState<number>(state.ring.length);
  const layout = floatNode === null ? null : ringLayout(state, hoverSlot);
  const slide = reduced ? null : springSlide();

  // T-507 — the node under the finger in edit mode. The others take `ringLayout(state,
  // hoverSlot, id)`, which opens a free slot where the finger is.
  const [dragging, setDragging] = useState<{
    readonly id: RingNodeId;
    readonly from: number;
    readonly at: { readonly x: number; readonly y: number };
    readonly slot: number;
  } | null>(null);
  const grab = useRef<{
    readonly id: RingNodeId;
    readonly from: number;
    readonly centre: { readonly x: number; readonly y: number };
    readonly start: { readonly x: number; readonly y: number };
  } | null>(null);
  const editLayout = editing && dragging !== null ? ringLayout(state, dragging.slot, dragging.id) : null;
  /** Where a resting node sits: its own index, or — while another is dragged — `ringLayout`'s slot. */
  const restingSlot = (id: RingNodeId, i: number): number => {
    if (editLayout === null) return i;
    const k = editLayout.nodes.indexOf(id);
    return k < 0 ? i : (editLayout.slots[k] ?? i);
  };
  const dragFor = (id: RingNodeId, from: number): DragHandlers => ({
    onPointerDown: (e) => {
      const r = (e.currentTarget as HTMLElement).closest('[data-ring]')?.getBoundingClientRect();
      if (r === undefined) return;
      grab.current = {
        id,
        from,
        centre: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        start: { x: e.clientX, y: e.clientY },
      };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e) => {
      const g = grab.current;
      if (g === null) return;
      if (dragging === null && Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y) <= LONG_PRESS_SLOP_PX) return;
      const at = { x: e.clientX - g.centre.x, y: e.clientY - g.centre.y };
      setDragging({ id: g.id, from: g.from, at, slot: slotFromPoint(at, state.ring.length) });
    },
    onPointerUp: () => {
      const d = dragging;
      grab.current = null;
      setDragging(null);
      if (d === null) return;
      // ⓑ outside the ring ⇒ home, and ⛔ a drop on its own slot writes nothing
      if (Math.hypot(d.at.x, d.at.y) > OUTSIDE_RING_PX || d.slot === d.from) return;
      onMove?.(d.id, d.slot);
    },
    onPointerCancel: () => {
      grab.current = null;
      setDragging(null);
    },
  });
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
          data-ring-mode={state.mode.kind}
          className={`relative mx-auto h-[300px] w-full max-w-[300px] ${editing ? 'touch-none' : ''}`}
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
          {editing && floatNode === null ? (
            <button
              type="button"
              data-ring-focus="done"
              onClick={onDone}
              className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border border-brand bg-surface-raised text-success active:opacity-90"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7" />
              </svg>
              <span className="text-[15px] font-bold">{DONE_HE}</span>
            </button>
          ) : floatNode === null || layout === null ? (
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
          ) : null}
          {layout === null || floatNode === null
            ? drawn.map((node, i) => (
                <RingNodeItem
                  key={node.id}
                  node={node}
                  wasHere={node.id === lastNode}
                  onPick={pick}
                  slot={restingSlot(node.id, i)}
                  n={editLayout?.n ?? drawn.length}
                  slide={slide}
                  onLongPress={editing || onLongPress === undefined ? undefined : () => onLongPress(node.id)}
                  onRemove={editing ? () => onRemove?.(node.id) : undefined}
                  drag={editing ? dragFor(node.id, i) : undefined}
                  lifted={dragging?.id === node.id ? dragging.at : null}
                />
              ))
            : drawn.map((node, i) => (
                <RingNodeItem
                  key={node.id}
                  node={node}
                  wasHere={false}
                  onPick={pick}
                  slot={layout.slots[i] ?? i}
                  n={layout.n}
                  slide={slide}
                  onSlotTap={() => setHoverSlot(layout.slots[i] ?? i)}
                />
              ))}
          {layout !== null && floatNode !== null ? (
            <PlacingNode
              node={floatNode}
              slot={hoverSlot}
              n={layout.n}
              slide={slide}
              onHover={setHoverSlot}
              onDrop={(slot) => onPlace?.(floatNode.id, slot)}
            />
          ) : null}
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
  const [placing, setPlacing] = useState<RingNodeId | null>(null);
  const [notice, setNotice] = useState<RingNotice | null>(null);
  const [editing, setEditing] = useState(false);

  // ⛔ **⛔ אין כאן ניווט** (T-206ⓓ): הקריאה מסמנת צומת אחד, ⛔ ואינה מזיזה איש.
  // T-504 — and the learner's own ring (D-296) is read in the same mount, from this device.
  // T-505ⓐ — `?place=<id>` (from «התקן») opens the ring in placing mode.
  useEffect(() => {
    setLastNode(readLastNode());
    let raw: string | null = null;
    try {
      raw = new URLSearchParams(window.location.search).get('place');
    } catch {
      raw = null;
    }
    const start = placingFrom(readRing(), raw);
    setRing(start.ring);
    setPlacing(start.placing);
  }, []);

  const onPlace = (id: RingNodeId, slot: number): void => {
    const step = ringStep({ ring, mode: { kind: 'placing', id }, notice: null }, { type: 'drop', id, slot });
    if (step.state.mode.kind !== 'browse') return;
    writeRing(step.state.ring);
    setRing(step.state.ring);
    setPlacing(null);
    setNotice(step.state.notice);
    // ⛔ not a navigation (T-206ⓓ): the page stays, only `?place=` leaves the address, so a
    // refresh after the drop ⛔ does not open placing again.
    try {
      window.history.replaceState(window.history.state, '', '/world');
    } catch {
      // ⛔ a history that refuses is ⛔ not a learner error — the ring is already written
    }
  };

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
      placing={placing}
      onPlace={onPlace}
      notice={notice}
      editing={editing}
      onLongPress={(id) => {
        const step = ringStep(startRing(ring), { type: 'longPress', id });
        if (step.state.mode.kind !== 'editing') return;
        setNotice(null);
        setEditing(true);
      }}
      onRemove={(id) => {
        const step = ringStep({ ring, mode: { kind: 'editing' }, notice: null }, { type: 'remove', id });
        if (step.state.ring === ring) return;
        writeRing(step.state.ring);
        setRing(step.state.ring);
        setNotice(step.state.notice);
      }}
      onDone={() => {
        setEditing(false);
        setNotice(null);
      }}
      onMove={(id, slot) => {
        const step = ringStep({ ring, mode: { kind: 'editing' }, notice: null }, { type: 'drop', id, slot });
        if (step.state.ring === ring) return;
        writeRing(step.state.ring);
        setRing(step.state.ring);
        setNotice(null);
      }}
    />
  );
}
