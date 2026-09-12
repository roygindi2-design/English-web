import AmirnetPracticeMenu from '@/components/AmirnetPracticeMenu';
import { AMIRNET_TYPES, toTypeCards, zeroStats, type AmirnetPracticeType } from '@/lib/core/amirnetPractice';

export const metadata = { title: 'תרגול ממוקד · אמירנט' };

/**
 * `/world/amirnet/practice` — the destination T-291ⓒ names: «קישור שמעביר לתפריט התרגול עם הסוג
 * הזה כבר נבחר». ⛔ Opened here and ⛔ not left for later because the alternative was a weakness
 * strip pointing at a 404, which is ⛔ not the requirement delivered.
 *
 * `?type=` is read here and ⛔ nowhere else: `AmirnetPracticeMenu` already takes `initialType`
 * (T-286), so the strip's link is the ⛔ only new thing in the flow.
 * ⛔ An unknown value is dropped, ⛔ never coerced — a menu that opens on a type the learner did
 * not choose is the one failure `41 § 7` («רק אחרי שתי הבחירות») is written against.
 *
 * ⛔ Zero data access, same measured reason as `/world/amirnet`: `F-222` blocks the schema and
 * `T-297` is blocked on it, so ⛔ nothing writes a practice result yet.
 */
function parseType(raw: string | string[] | undefined): AmirnetPracticeType | null {
  const one = Array.isArray(raw) ? raw[0] : raw;
  const known = AMIRNET_TYPES.find((t) => t.type === one);
  return known === undefined ? null : known.type;
}

export default async function WorldAmirnetPracticePage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <AmirnetPracticeMenu cards={toTypeCards(zeroStats())} initialType={parseType(params.type)} />
  );
}
