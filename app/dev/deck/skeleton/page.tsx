import CardSkeleton from '@/components/CardSkeleton';

/**
 * Layout fixture for `check:mobile` — the loading state (T-054 · § 4.2ו · חוקה § 5).
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/study` is already in the harness's route list, and that is exactly why this exists:
 * `next start` has no Supabase env, the queue answers 503 by its own contract, and every
 * `ok /study` line has therefore described `schema_missing` — the loading state has never
 * been rendered at 320/375/414 (TD-13, the same trap as `/dev/card` and `/dev/deck`).
 *
 * ⛔ Not a client component and ⛔ no wrapper markup: `<CardSkeleton>` renders no chrome of
 * its own, and a heading added here would be this fixture's geometry rather than the
 * component's.
 */
export default function DevDeckSkeletonPage() {
  return <CardSkeleton />;
}
