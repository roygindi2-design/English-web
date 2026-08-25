/**
 * PURE — T-187ⓕ · D-084. The wire shape of the attempts-only write, and ⛔ nothing else.
 *
 * ⛔ **There is deliberately ⛔ NO field on this type for how well the learner knew the
 * word.** A tap in a story is ⛔ not a review: § 4.2יג sentence 3 — «⛔ אין טעות בקריאה,
 * ולכן ⛔ אין ציון». A field that ⛔ does not exist ⛔ cannot be written, and
 * `app/api/review/context/route.test.ts` scans both this file and the route BY NAME for
 * the six SM-2 columns the write is forbidden to touch.
 *
 * ⚠️ camelCase on the wire, exactly like `PATCH /api/arcade/collected` — the client layer
 * is the only place that speaks HTTP and it speaks the product's own casing.
 */
export type ContextTapPayload = { readonly wordId: string };

export type ContextTapCheck =
  | { readonly ok: true; readonly payload: ContextTapPayload }
  | { readonly ok: false; readonly code: 'unavailable' };

/** A uuid, and ⛔ nothing looser: the value goes into a foreign key. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function checkContextTapPayload(body: unknown): ContextTapCheck {
  if (typeof body !== 'object' || body === null) return { ok: false, code: 'unavailable' };
  const wordId = (body as { wordId?: unknown }).wordId;
  if (typeof wordId !== 'string' || !UUID.test(wordId)) return { ok: false, code: 'unavailable' };
  return { ok: true, payload: { wordId } };
}
