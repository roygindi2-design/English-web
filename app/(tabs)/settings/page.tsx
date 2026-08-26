import Link from 'next/link';
import { LEVEL_SCAN_HREF } from '@/lib/core/worldApps';

/**
 * הגדרות — the fifth tab (T-174 · `36 § 4`).
 *
 * ⛔ **The tab exists for a structural reason, ⛔ not for a wish list.** `36 § 4` says it
 * plainly: «הגדרות נוספה כדי לאפשר את המרכוז ולתת בית לשינוי רמה ולניהול מסלולים» — a bar
 * of four cannot put `העולם` at the exact geometric centre, and the render
 * `docs/design/kol-world-ring.png` draws it there. ⇒ this screen ships FIRST, because a
 * tab whose destination 404s is worse than four tabs.
 *
 * ⛔ **And it holds ⛔ only what `36 § 4` names.** Two entries would already be one
 * invented setting: `שינוי רמה` is § 4 verbatim and its destination is the level scan that
 * T-082 landed; `ניהול מסלולים` is § 4's other half and it has ⛔ no screen yet, so it is
 * ⛔ not drawn as a dead row here — `36 § 9` («לדקדוק, כתיבה והבנת הנקרא ⛔ אין תוכן») is
 * the same rule one feature over. ⛔ No theme switch, ⛔ no notifications, ⛔ no language
 * picker: not one of them is in an anchor document, and a settings screen is exactly where
 * invented product surface hides best.
 *
 * ⛔ **No session check, and that is a decision rather than an omission.** Nothing on this
 * screen is about the learner — it is one link to a public route — so `/settings` stays out
 * of `PROTECTED_SCREENS` (proxy.ts) and renders under `check:mobile` without a 307. The
 * moment it holds something private (an account, an export, a sign-out) it joins that list
 * in the SAME commit, exactly as `/me` did.
 *
 * ⛔ No `<ActionBar>`: the route is inside `(tabs)`, so it already has the tab bar, and
 * D-028 allows exactly one bar per screen.
 */
const HEADING_HE = 'הגדרות';
const LEVEL_TITLE_HE = 'שינוי רמה';
const LEVEL_BODY_HE = 'סריקת רמה קצרה קובעת מאיפה ממשיכים';

export default function SettingsPage() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">{HEADING_HE}</h1>
      <Link
        href={LEVEL_SCAN_HREF}
        className="flex min-h-touch flex-col items-start justify-center gap-1 rounded-lg border border-border-strong bg-surface-raised px-5 py-4 text-start active:opacity-90"
      >
        <span className="text-lg font-semibold text-ink">{LEVEL_TITLE_HE}</span>
        <span className="text-sm text-ink-muted">{LEVEL_BODY_HE}</span>
      </Link>
    </section>
  );
}
