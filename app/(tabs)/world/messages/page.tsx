import InboxList from '@/components/InboxList';

// T-264 — the exact kicker `<InboxList>` renders (`components/InboxList.tsx` `KICKER_HE`);
// the `<h1>` `תיבת הסימולציות` is the open message’s title (T-192), so the two routes differ.
export const metadata = { title: 'הודעות · סימולציות' };

/**
 * `/world/messages` — T-191 · 39 § 7 · D-109. Closes the 404 measured C-0273.
 * ⛔ Zero data access here (the `/world/story` reasoning): `<InboxList>` reads
 * `GET /api/world/messages`, which already performs the C-0032 guard order and answers
 * `session_expired` as data. Inside `(tabs)` ⇒ the tab bar is the layout’s (render
 * kol-C-13 draws it); ⛔ no `<ActionBar>` below (D-028).
 */
export default function WorldMessagesPage() {
  return <InboxList />;
}
