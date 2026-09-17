import AmirnetPracticeFlow from '@/components/AmirnetPracticeFlow';
import { AMIRNET_TYPES, type AmirnetPracticeType } from '@/lib/core/amirnetPractice';

export const metadata = { title: 'תרגול ממוקד · אמירנט' };

/**
 * `/world/amirnet/practice` — the destination `T-291`ⓒ names («קישור שמעביר לתפריט התרגול עם
 * הסוג הזה כבר נבחר»), and since `T-376` the ⛔ only production path into `AmirnetQuestion`.
 *
 * 🔴 **What changed, and it is a MEASUREMENT (`F-265`).** Until `T-376` this page rendered
 * `AmirnetPracticeMenu` with `toTypeCards(zeroStats())` — a CONSTANT — and with ⛔ no `onStart`,
 * so pressing `תרגל` did ⛔ nothing: `AmirnetQuestion` was reachable from `app/dev/**` alone and
 * `onAnswered` (`T-372`ⓒ) ⛔ could never fire. ⇒ the menu, the question and the writer all
 * existed and ⛔ nothing joined them. `AmirnetPracticeFlow` is that join.
 *
 * `?type=` is read here and ⛔ nowhere else: the flow hands it straight to the menu's
 * `initialType` (`T-286`), so the dashboard's weakness strip is the ⛔ only new thing in the flow.
 * ⛔ An unknown value is dropped, ⛔ never coerced — a menu that opens on a type the learner did
 * not choose is the one failure `41 § 7` («רק אחרי שתי הבחירות») is written against.
 *
 * ⛔ **Zero data access here.** A page ⛔ never touches the database (RULES); the two calls live
 * in the client component, through `lib/api/client.ts`.
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
  return <AmirnetPracticeFlow initialType={parseType(params.type)} />;
}
