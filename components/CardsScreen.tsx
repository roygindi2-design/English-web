/**
 * The body of the כרטיסיות tab — the shared empty state and the one action.
 *
 * Same reason as `StudiesScreen` and `MeScreen`: `/cards` is in
 * `PROTECTED_SCREENS` (proxy.ts), so without Supabase env it answers 307 to
 * `/login?expired=1` and the harness would measure the login screen while
 * printing "ok /cards" — F-027 cause 1, measured live in C-0075. Its geometry is
 * therefore measured through `/dev/tabs/cards`, which renders this component.
 *
 * ⛔ No <ActionBar>. D-028 forbids two bottom bars on one screen, and this screen
 * carries the tab bar, so the action sits in normal flow. The label is
 * `/studies`'s own action label rather than new copy — ⛔ Dev does not mint
 * product copy (§ 4.2ב names the labels).
 */
import Link from 'next/link';
import StudyEmptyState from '@/components/StudyEmptyState';

export default function CardsScreen(): React.JSX.Element {
  return (
    <section className="flex flex-col gap-4">
      <StudyEmptyState />
      <Link
        href="/studies"
        data-primary-action="true"
        className="flex min-h-touch items-center justify-center rounded-xl border border-border-strong px-5 py-3 text-base text-ink active:opacity-90"
      >
        התחלת מנה יומית
      </Link>
    </section>
  );
}
