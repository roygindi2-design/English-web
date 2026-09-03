import { describe, expect, it } from 'vitest';
import { RETRY_HE } from './failure';
import { failureExit } from './failureExit';
import {
  RING_ANGLE_DEG,
  RING_LABEL_HE,
  RING_ORDER,
  RING_RADIUS,
  ringPoint,
  ringScreen,
  type RingInputs,
  type RingNodeId,
  type RingNodeState,
} from './worldRing';

/**
 * ⛔ Four live nodes, ⛔ and the other four are constants inside `ringScreen`.
 * The default is the shape the screen actually produces: `כתיבה חופשית` and
 * `אוצר מילים` are constant-`open` (exactly as they are in `worldApps.ts`), and
 * the two that come off the wire are open too. Each test then breaks ONE thing.
 */
const inputs = (over: Partial<RingInputs> = {}): RingInputs => ({
  arena: { kind: 'open', href: '/arcade' },
  stories: { kind: 'open', href: '/world/story' },
  compose: { kind: 'open', href: '/world/compose' },
  vocab: { kind: 'open', href: '/world/collected' },
  ...over,
});

const ALL_UNKNOWN: RingInputs = {
  arena: { kind: 'unknown' },
  stories: { kind: 'unknown' },
  compose: { kind: 'unknown' },
  vocab: { kind: 'unknown' },
};

const stateOf = (nodes: readonly { id: RingNodeId; state: RingNodeState }[], id: RingNodeId) =>
  nodes.find((n) => n.id === id)?.state;

describe('worldRing — the ring model (T-204 · D-118 · `36 § 6`)', () => {
  it('⛔ nine nodes, in `36 § 6`’s order, ⛔ with no duplicate (`D-182` · `T-252`)', () => {
    expect([...RING_ORDER]).toEqual([
      'arena',
      'msgs',
      'amirnet',
      'stories',
      'compose',
      'sentences',
      'vocab',
      'leaders',
      'friends',
    ]);
    expect(new Set(RING_ORDER).size).toBe(9);
  });

  it('every node carries a Hebrew label, ⛔ and none is empty', () => {
    for (const id of RING_ORDER) {
      expect(RING_LABEL_HE[id]).toMatch(/[֐-׿]/);
    }
    expect(RING_LABEL_HE.arena).toBe('זירת קרב');
    expect(RING_LABEL_HE.msgs).toBe('הודעות');
    expect(RING_LABEL_HE.amirnet).toBe('אמירנט');
  });

  // ⛔ The geometry is DATA — that is what lets the ring be measured with no DOM.
  it('`זירת קרב` sits at the top of the ring, r=108 (`36 § 6`)', () => {
    expect(RING_RADIUS).toBe(108);
    const p = ringPoint('arena');
    expect(Math.abs(p.x - 0)).toBeLessThan(1e-9);
    expect(Math.abs(p.y - -108)).toBeLessThan(1e-9);
  });

  it('the nine angles are 40° apart and go clockwise from the top, as the render draws them (`D-182`)', () => {
    const deg = (id: RingNodeId) => ((RING_ANGLE_DEG[id] % 360) + 360) % 360;
    const seen = new Set(RING_ORDER.map(deg));
    expect(seen.size).toBe(9);
    expect(deg('arena')).toBe(90); // the anchor — `זירת קרב` sits at the top, unchanged from the 8-node ring
    // every consecutive pair in RING_ORDER is exactly 40° apart, clockwise (angle decreases, wraps at 360)
    const order = [...RING_ORDER];
    for (let i = 0; i < order.length; i++) {
      const a = deg(order[i] as RingNodeId);
      const b = deg(order[(i + 1) % order.length] as RingNodeId);
      expect((a - b + 360) % 360).toBe(40);
    }
    // clockwise on screen ⇒ x grows before it shrinks: `הודעות` is to the RIGHT of `זירת קרב`
    expect(ringPoint('msgs').x).toBeGreaterThan(0);
    // `אמירנט` sits between `הודעות` and `סיפורים` — further right, closer to the horizon
    expect(ringPoint('amirnet').x).toBeGreaterThan(ringPoint('msgs').x);
    expect(ringPoint('amirnet').x).toBeGreaterThan(0);
    expect(ringPoint('friends').x).toBeLessThan(0);
    expect(ringPoint('sentences').y).toBeGreaterThan(0);
  });

  it('every node keeps its distance from the focus — ⛔ no node drifts off the ring', () => {
    for (const id of RING_ORDER) {
      const { x, y } = ringPoint(id);
      expect(Math.abs(Math.hypot(x, y) - RING_RADIUS)).toBeLessThan(1e-9);
    }
  });

  // T-148 · D-064, applied to the ring: ⛔ a failed read is a state of the SCREEN.
  it('⛔ a failed read is one empty state with one action — ⛔ never eight «—»', () => {
    const screen = ringScreen(null, '/world', 'unavailable');
    expect(screen.kind).toBe('empty');
    if (screen.kind !== 'empty') throw new Error('unreachable');
    expect(screen.messageHe).toMatch(/[֐-׿]/);
    expect(screen.messageHe).not.toContain('—');
    expect(screen.actionHref).toBe('/world');
  });

  it('⛔ all four live nodes unknown ⇒ the whole screen is empty (D-064)', () => {
    expect(ringScreen(ALL_UNKNOWN, '/world', 'unavailable').kind).toBe('empty');
  });

  it('a healthy read draws the ring — ⛔ and it draws all nine', () => {
    const screen = ringScreen(inputs(), '/world', 'unavailable');
    expect(screen.kind).toBe('ring');
    if (screen.kind !== 'ring') throw new Error('unreachable');
    expect(screen.nodes.map((n) => n.id)).toEqual([...RING_ORDER]);
  });

  /**
   * ⛔ THE MUTATION THIS KILLS, and it is the plan's own code: passing the inputs
   * through and gating on `anyOpen` alone lets ⛔ ONE failed read reach a node, and
   * the screen then has to paint «—» for it — T-148ⓑ by name, and «error + content»
   * which T-146ⓑ forbids. ⛔ `unknown` is a state of the SCREEN (D-118).
   */
  it('⛔ ⛔ ONE failed live read ⇒ the whole screen is empty — ⛔ never a ring with a hole', () => {
    for (const id of ['arena', 'stories', 'compose', 'vocab'] as const) {
      const screen = ringScreen(inputs({ [id]: { kind: 'unknown' } }), '/world', 'unavailable');
      expect([id, screen.kind]).toEqual([id, 'empty']);
    }
  });

  it('⛔ `unknown` ⛔ never survives onto a node of a drawn ring', () => {
    const screen = ringScreen(
      inputs({ arena: { kind: 'locked_count', noteHe: 'נדרשות 12 מילים ברמה, יש 8' } }),
      '/world',
      'unavailable',
    );
    if (screen.kind !== 'ring') throw new Error('unreachable');
    expect(screen.nodes.every((n) => n.state.kind !== 'unknown')).toBe(true);
  });

  it('⛔ every node locked ⇒ empty, ⛔ even when ⛔ no read failed (D-064)', () => {
    const shut: RingNodeState = { kind: 'locked_count', noteHe: 'נדרשות 12 מילים ברמה, יש 8' };
    const screen = ringScreen(
      { arena: shut, stories: shut, compose: shut, vocab: shut },
      '/world',
      'unavailable',
    );
    expect(screen.kind).toBe('empty');
  });

  // ── the three mutations that must fail BY NAME, ⛔ not by count ──────────────

  it('⛔ ⛔ no `locked_infra` note carries a digit — D-046 ⛔ does NOT apply here (D-118)', () => {
    const screen = ringScreen(inputs(), '/world', 'unavailable');
    if (screen.kind !== 'ring') throw new Error('unreachable');
    const infra = screen.nodes.filter((n) => n.state.kind === 'locked_infra');
    expect(infra.map((n) => n.id).sort()).toEqual([
      'amirnet',
      'friends',
      'leaders',
      'msgs',
      'sentences',
    ]);
    for (const node of infra) {
      if (node.state.kind !== 'locked_infra') throw new Error('unreachable');
      expect(/\d/.test(node.state.noteHe)).toBe(false);
    }
  });

  it('⛔ ⛔ no `locked_infra` note says «בקרוב» (F-011 · F-016 · D-046)', () => {
    const screen = ringScreen(inputs(), '/world', 'unavailable');
    if (screen.kind !== 'ring') throw new Error('unreachable');
    for (const node of screen.nodes) {
      if (node.state.kind !== 'locked_infra') continue;
      expect(node.state.noteHe).not.toContain('בקרוב');
      expect(node.state.noteHe).toMatch(/[֐-׿]/);
    }
  });

  it('⛔ a `locked_count` note HAS a digit — D-046, and it stays alive on the ring', () => {
    const screen = ringScreen(
      inputs({ arena: { kind: 'locked_count', noteHe: 'נדרשות 12 מילים ברמה, יש 8' } }),
      '/world',
      'unavailable',
    );
    if (screen.kind !== 'ring') throw new Error('unreachable');
    const arena = stateOf(screen.nodes, 'arena');
    if (arena?.kind !== 'locked_count') throw new Error('unreachable');
    expect(/\d/.test(arena.noteHe)).toBe(true);
  });
});

/**
 * ⛔ **T-146ⓒ — «⛔ אין מסך כשל בלי יציאה» (D-065).** ⓐ ו-ⓑ נסגרו ב-C-0314:
 * המסך מחזיר אזור שגיאה אחד ופעולה אחת. ⓒ ⛔ לא — הפעולה האחת הייתה **תמיד**
 * «נסה שוב» אל `/world`, כלומר לומד שסשנו פג קיבל את אותו הכשל שוב, ולומד
 * שהמיגרציה חסרה אצלו קיבל כפתור שלעולם ⛔ אינו יכול להצליח.
 *
 * ⛔ **המודל ⛔ אינו מכיר קודי שגיאה על צומת** — זה נשאר נכון (D-118): הקוד
 * נכנס כארגומנט **של המסך**, בדיוק כמו ש-`unknown` הוא מצב של מסך.
 */
describe('ringScreen — היציאה מהמצב הריק (T-146ⓒ · D-065)', () => {
  it('`unavailable` ⇒ «נסה שוב» אל `retryHref` — התקלה החולפת היחידה', () => {
    const screen = ringScreen(null, '/world', 'unavailable');
    if (screen.kind !== 'empty') throw new Error('unreachable');
    expect(screen.actionHref).toBe('/world');
    expect(screen.actionLabelHe).toBe(RETRY_HE);
  });

  it('⛔ `session_expired` ⛔ אינו מקבל «נסה שוב» — הוא נשלח ל-`/login`', () => {
    const screen = ringScreen(null, '/world', 'session_expired');
    if (screen.kind !== 'empty') throw new Error('unreachable');
    expect(screen.actionHref).toBe('/login');
    expect(screen.actionLabelHe).not.toBe(RETRY_HE);
  });

  it('⛔ `schema_missing` ⛔ אינו מקבל «נסה שוב» — הוא מנווט ללשונית שכן עובדת', () => {
    const screen = ringScreen(null, '/world', 'schema_missing');
    if (screen.kind !== 'empty') throw new Error('unreachable');
    expect(screen.actionHref).toBe(failureExit('schema_missing').href);
    expect(screen.actionLabelHe).not.toBe(RETRY_HE);
  });

  /**
   * ⛔ המוטציה שזה הורג: לחווט את הקוד רק אל הענף `inputs === null` ולהשאיר את
   * שני הענפים האחרים על «נסה שוב». שלושת הענפים מגיעים לאותו מצב ריק, ולכן
   * שלושתם חייבים לשאת את אותה יציאה.
   */
  it('⛔ שלושת הענפים אל המצב הריק נושאים את אותה יציאה, ⛔ ולא רק הראשון', () => {
    const allLocked: RingInputs = {
      arena: { kind: 'locked_count', noteHe: 'נדרשות 12 מילים ברמה, יש 8' },
      stories: { kind: 'locked_count', noteHe: 'נדרשים 3 סיפורים ברמה שלך, יש 1' },
      compose: { kind: 'locked_infra', noteHe: 'הכתיבה תיפתח כשהעורך ייבנה.' },
      vocab: { kind: 'locked_infra', noteHe: 'אוצר המילים ייפתח כשהמאגר ייבנה.' },
    };
    for (const inp of [null, ALL_UNKNOWN, allLocked]) {
      const screen = ringScreen(inp, '/world', 'session_expired');
      if (screen.kind !== 'empty') throw new Error('unreachable');
      expect(screen.actionHref).toBe('/login');
    }
  });

  /** ⛔ הקוד ⛔ אינו זולג אל צומת: D-118 נשארת בתוקף גם אחרי ⓒ. */
  it('⛔ קוד הכשל ⛔ אינו משנה דבר בטבעת מצוירת', () => {
    const a = ringScreen(inputs(), '/world', 'unavailable');
    const b = ringScreen(inputs(), '/world', 'session_expired');
    expect(a).toEqual(b);
    expect(a.kind).toBe('ring');
  });
});
