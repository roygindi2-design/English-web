/**
 * `הודעות` — the pure layer (T-190 · 39 § 7 · D-109).
 *
 * ⛔ Knows nothing about React, DOM, HTTP, env or the clock — `now` is a parameter.
 * ⛔ Zero coupling to word_progress or the arena (D-054: מנותקת לחלוטין).
 */
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
 * (T-192 ⓔ). The finding about the two words lives in 60-findings, ⛔ not here.
 */
export function unanswered(item: InboxItem): boolean {
  return item.readAt === null && item.answeredAt === null;
}

export interface InboxCounts {
  readonly total: number;
  readonly unanswered: number;
}

export function inboxCounts(items: readonly InboxItem[]): InboxCounts {
  let n = 0;
  for (const i of items) if (unanswered(i)) n += 1;
  return { total: items.length, unanswered: n };
}

/** `3 הודעות · 2 שלא נענו` — the render’s line (render_msgs_screens.py:53). */
export function inboxCountsHe(c: InboxCounts): string {
  const total = c.total === 1 ? 'הודעה אחת' : `${c.total} הודעות`;
  return `${total} · ${c.unanswered} שלא נענו`;
}
