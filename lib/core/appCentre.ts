/**
 * T-500 — the view model of `docs/design/kol-E-02-centre.png` («בנה את הטבעת שלך»):
 * which apps are on the ring, which can be installed, and which are locked.
 *
 * 🎯 **Read from `docs/design/render_video_E.py`, ⛔ not written here:** `APPS`
 * (category · description), `LOCKED` (the two that need an account), and
 * `screen_centre` (installed in ring order, then available; every install button
 * disabled once the ring holds `MAX_APPS`).
 * ⛔ Names come from `RING_LABEL_HE` — one name per app, ⛔ never a second copy.
 * ⛔ Pure: the screen draws this, ⛔ and decides nothing.
 */
import { MAX_RING_APPS, ringCountHe } from './ringEdit';
import { RING_LABEL_HE, RING_ORDER, type RingNodeId } from './worldRing';

export const APP_CATALOGUE_HE: Readonly<
  Record<RingNodeId, { readonly categoryHe: string; readonly descHe: string }>
> = {
  arena: { categoryHe: 'ארקייד', descHe: 'קרב אוצר מילים על זמן' },
  stories: { categoryHe: 'למידה', descHe: 'קריאה עם תרגום בהקשה' },
  vocab: { categoryHe: 'למידה', descHe: 'המילים שאספת' },
  amirnet: { categoryHe: 'תרגול', descHe: 'סימולציות ותרגול לבחינה' },
  msgs: { categoryHe: 'חברתי', descHe: 'כיתה סגורה ומקלדת בלוקים' },
  sentences: { categoryHe: 'תרגול', descHe: 'בניית משפטים' },
  compose: { categoryHe: 'למידה', descHe: 'כתיבה עם משוב' },
  leaders: { categoryHe: 'חברתי', descHe: 'טבלת דירוג' },
  friends: { categoryHe: 'חברתי', descHe: 'השוואה מול חברים' },
};

/** Install is locked for these — the render's «דורש חשבון · בקרוב». */
export const INSTALL_LOCKED: ReadonlySet<RingNodeId> = new Set<RingNodeId>(['leaders', 'friends']);

export type AppCardState = 'installed' | 'available' | 'locked';

export interface AppCard {
  readonly id: RingNodeId;
  readonly nameHe: string;
  readonly categoryHe: string;
  readonly descHe: string;
  readonly state: AppCardState;
  /** Only meaningful off the ring: locked, or the ring is full. */
  readonly installDisabled: boolean;
}

export interface AppCentreModel {
  readonly used: number;
  readonly full: boolean;
  readonly countHe: string;
  readonly installed: readonly AppCard[];
  readonly available: readonly AppCard[];
}

export function appCentre(ring: readonly RingNodeId[]): AppCentreModel {
  const full = ring.length >= MAX_RING_APPS;
  const card = (id: RingNodeId, state: AppCardState): AppCard => ({
    id,
    nameHe: RING_LABEL_HE[id],
    categoryHe: APP_CATALOGUE_HE[id]?.categoryHe ?? '',
    descHe: APP_CATALOGUE_HE[id]?.descHe ?? '',
    state,
    installDisabled: state !== 'installed' && (state === 'locked' || full),
  });
  return {
    used: ring.length,
    full,
    countHe: ringCountHe(ring.length),
    installed: ring.map((id) => card(id, 'installed')),
    available: RING_ORDER.filter((id) => !ring.includes(id)).map((id) =>
      card(id, INSTALL_LOCKED.has(id) ? 'locked' : 'available'),
    ),
  };
}
