/**
 * `הודעות` — the pure layer (T-190 · 39 § 7 · D-109).
 *
 * ⛔ Knows nothing about React, DOM, HTTP, env or the clock — `now` is a parameter.
 * ⛔ Zero coupling to word_progress or the arena (D-054: מנותקת לחלוטין).
 */
import { toIsoDateInZone } from './onboarding';

export const MESSAGE_CONTEXTS = ['tourist', 'restaurant', 'teacher', 'hotel'] as const;
export type MessageContext = (typeof MESSAGE_CONTEXTS)[number];
export const CONTEXT_HE: Readonly<Record<MessageContext, string>> = {
  tourist: 'תייר',
  restaurant: 'מסעדה',
  teacher: 'מורה',
  hotel: 'מלון',
};
export const MESSAGE_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const; // R-021
export type MessageLevel = (typeof MESSAGE_LEVELS)[number];
export const REQUIRED_WORDS_PER_MESSAGE = 3;

export interface Simulation {
  readonly id: string;
  readonly senderEn: string;
  readonly context: MessageContext;
  readonly subjectEn: string;
  readonly bodyEn: string;
  readonly requiredWords: readonly string[];
  readonly level: MessageLevel;
  readonly createdAt: string;
}

export interface RawSimulationRow {
  readonly id: unknown;
  readonly sender_en: unknown;
  readonly context: unknown;
  readonly subject_en: unknown;
  readonly body_en: unknown;
  readonly required_words: unknown;
  readonly cefr_level: unknown;
  readonly created_at: unknown;
}

function text(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}
function isContext(v: unknown): v is MessageContext {
  return typeof v === 'string' && (MESSAGE_CONTEXTS as readonly string[]).includes(v);
}
function isLevel(v: unknown): v is MessageLevel {
  return typeof v === 'string' && (MESSAGE_LEVELS as readonly string[]).includes(v);
}

/** A damaged row is `null`, ⛔ not a partial simulation (the `toQuestion` law). */
export function toSimulation(row: RawSimulationRow): Simulation | null {
  const id = text(row.id);
  const senderEn = text(row.sender_en);
  const subjectEn = text(row.subject_en);
  const bodyEn = text(row.body_en);
  const createdAt = text(row.created_at);
  if (id === null || senderEn === null || subjectEn === null || bodyEn === null || createdAt === null) return null;
  if (!isContext(row.context) || !isLevel(row.cefr_level)) return null;
  if (!Array.isArray(row.required_words) || row.required_words.length !== REQUIRED_WORDS_PER_MESSAGE) return null;
  const requiredWords = row.required_words.map((w) => (typeof w === 'string' ? w.trim() : ''));
  if (requiredWords.some((w) => w === '')) return null;
  return { id, senderEn, context: row.context, subjectEn, bodyEn, requiredWords, level: row.cefr_level, createdAt };
}

export function toSimulations(rows: readonly RawSimulationRow[]): readonly Simulation[] {
  const out: Simulation[] = [];
  for (const row of rows) {
    const s = toSimulation(row);
    if (s !== null) out.push(s);
  }
  return out;
}

export interface RawStateRow {
  readonly simulation_id: unknown;
  readonly read_at: unknown;
  readonly answered_at: unknown;
}

export interface InboxItem extends Simulation {
  readonly readAt: string | null;
  readonly answeredAt: string | null;
}

/** Newest first — the index `message_simulations_level_created_idx` order. */
export function mergeInbox(sims: readonly Simulation[], states: readonly RawStateRow[]): readonly InboxItem[] {
  const byId = new Map<string, { readAt: string | null; answeredAt: string | null }>();
  for (const s of states) {
    const id = text(s.simulation_id);
    if (id === null) continue;
    byId.set(id, { readAt: text(s.read_at), answeredAt: text(s.answered_at) });
  }
  return [...sims]
    .sort((x, y) => (x.createdAt < y.createdAt ? 1 : x.createdAt > y.createdAt ? -1 : 0))
    .map((s) => ({ ...s, readAt: byId.get(s.id)?.readAt ?? null, answeredAt: byId.get(s.id)?.answeredAt ?? null }));
}

/**
 * One predicate for both channels — the dot and the counter (T-191 ⓓ). ⚠️ Until the
 * keyboard exists (R-026) nothing can be *answered*, so «opened» ends the pending state
 * (T-192 ⓔ) — which is why this is named for READING and ⛔ not for answering (D-207,
 * closing F-212): `answered_at` has ⛔ no writer anywhere in the product, so the state
 * this measures is «⛔ טרם נקראה» and nothing else.
 *
 * ⚠️ **The body is deliberately unchanged (T-289 ⓒ — the name moves WITH the behaviour).**
 * `answeredAt` stays in the conjunction because ⛔ nothing may write it yet; when the
 * keyboard lands, «נענה» arrives as a SECOND indicator (R-026) and ⛔ not as a recycling
 * of this one ⇒ that is the tick which splits this predicate, ⛔ not this one.
 */
export function unread(item: InboxItem): boolean {
  return item.readAt === null && item.answeredAt === null;
}

/**
 * T-462ⓑ — the SECOND indicator R-026 promised. `answered_at` now has a writer
 * (`POST /api/world/messages/[id]/answer`), and «נענה» is its own flag: ⛔ it never
 * relights or reuses the dot, and `unread` above keeps counting reading only.
 */
export function answered(item: InboxItem): boolean {
  return item.answeredAt !== null;
}

export interface InboxCounts {
  readonly total: number;
  readonly unread: number;
}

export function inboxCounts(items: readonly InboxItem[]): InboxCounts {
  let n = 0;
  for (const i of items) if (unread(i)) n += 1;
  return { total: items.length, unread: n };
}

/** `3 הודעות · 2 שלא נקראו` — the render’s line (render_msgs_screens.py:53, D-207). */
export function inboxCountsHe(c: InboxCounts): string {
  const total = c.total === 1 ? 'הודעה אחת' : `${c.total} הודעות`;
  return `${total} · ${c.unread} שלא נקראו`;
}

export type WhenLabel =
  | { readonly kind: 'today'; readonly timeHe: string }
  | { readonly kind: 'yesterday' }
  | { readonly kind: 'weekday'; readonly dayHe: string }
  | { readonly kind: 'date'; readonly dateHe: string };

const WEEKDAY_HE = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'שבת'] as const;
const DAY_MS = 86_400_000;

function dayNumber(isoDate: string): number {
  return Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS);
}

/** The render’s three labels (render_video_C.py:238-245): `09:20` · `אתמול` · `יום ג׳`. */
export function whenOf(createdAtIso: string, nowIso: string, timeZone: string): WhenLabel {
  const created = new Date(createdAtIso);
  const createdDay = toIsoDateInZone(created, timeZone);
  const nowDay = toIsoDateInZone(new Date(nowIso), timeZone);
  const diff = dayNumber(nowDay) - dayNumber(createdDay);
  if (diff <= 0) {
    const timeHe = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(created);
    return { kind: 'today', timeHe };
  }
  if (diff === 1) return { kind: 'yesterday' };
  if (diff < 7) {
    const weekday = new Date(`${createdDay}T00:00:00Z`).getUTCDay();
    return { kind: 'weekday', dayHe: WEEKDAY_HE[weekday] ?? '' };
  }
  const [, m, d] = createdDay.split('-');
  return { kind: 'date', dateHe: `${Number(d)}.${Number(m)}` };
}

export function whenListHe(w: WhenLabel): string {
  switch (w.kind) {
    case 'today': return w.timeHe;
    case 'yesterday': return 'אתמול';
    case 'weekday': return w.dayHe;
    case 'date': return w.dateHe;
  }
}

/** The open message’s meta line says `היום 09:20` (render_msgs_screens.py:87). */
export function whenHeaderHe(w: WhenLabel): string {
  return w.kind === 'today' ? `היום ${w.timeHe}` : whenListHe(w);
}

export const PREVIEW_MAX = 40;

/** ≤ max characters, cut at a word boundary, `…` appended only when something was cut. */
export function previewEn(bodyEn: string, max: number = PREVIEW_MAX): string {
  const clean = bodyEn.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const boundary = cut.lastIndexOf(' ');
  return `${(boundary > 0 ? cut.slice(0, boundary) : cut.slice(0, max)).replace(/[\s.,;:!?]+$/, '')}…`;
}

/** The avatar disc letter (render_video_C.py:238-245: `T` · `S` · `L` for `Mr. Levi`). */
export function initialOf(senderEn: string): string {
  const words = senderEn.trim().split(/\s+/).filter((w) => !/^(mr|mrs|ms|dr)\.?$/i.test(w));
  const pick = words.at(-1) ?? senderEn.trim();
  return (pick[0] ?? '?').toUpperCase();
}

export interface InboxRow {
  readonly id: string;
  readonly href: string;
  readonly initial: string;
  readonly senderEn: string;
  /** T-481 — the colour key: a colour belongs to the CONTEXT (`39 § 7`), ⛔ never to a name. */
  readonly context: MessageContext;
  readonly contextHe: string;
  readonly subjectEn: string;
  readonly previewEn: string;
  readonly whenHe: string;
  readonly unread: boolean;
  readonly answered: boolean;
}

export function toInboxRows(items: readonly InboxItem[], nowIso: string, timeZone: string): readonly InboxRow[] {
  return items.map((it) => ({
    id: it.id,
    href: `/world/messages/${it.id}`,
    initial: initialOf(it.senderEn),
    senderEn: it.senderEn,
    context: it.context,
    contextHe: CONTEXT_HE[it.context],
    subjectEn: it.subjectEn,
    previewEn: previewEn(it.bodyEn),
    whenHe: whenListHe(whenOf(it.createdAt, nowIso, timeZone)),
    unread: unread(it),
    answered: answered(it),
  }));
}
