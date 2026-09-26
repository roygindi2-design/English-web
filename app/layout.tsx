import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import SourcesFooter from '@/components/SourcesFooter';
import { entryPendingScript } from '@/lib/entryPendingScript';

/**
 * T-264 / D-193 — `title.template` is the ONE product-name suffix for the whole
 * product (`36 § 14` / `RULES § 0.22` "one visual language" applied to metadata).
 * A route sets `metadata.title` to a plain string (its own `<h1>`, unchanged, zero
 * new wording) and Next.js wraps it in the template below; a route with no title of
 * its own falls back to `default`, exactly the one string every screen already
 * showed before this task.
 *
 * ⛔ Before this: `app/login/page.tsx` and `app/signup/page.tsx` hand-typed
 * `'… · English Web'`, `app/sources/page.tsx` hand-typed `'… — אנגלית לאמיר״ם'` — the
 * same suffix written twice, disagreeing (measured, `plan/50-tasks.md` T-264). Both
 * now emit a bare string and let this template own the suffix.
 */
export const metadata: Metadata = {
  title: {
    default: 'English Web — אנגלית לאמיר״ם',
    template: '%s · English Web',
  },
  description: 'תרגול אנגלית יומי קצר לדוברי עברית — 10 דקות ביום, עד תאריך המבחן. מסלול ראשון: אמיר״ם.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'English Web' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // The browser chrome follows the mode too, otherwise a dark page sits under a light bar.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

/**
 * Global shell — UX plan T-001: a top header and a content area. Nothing else.
 * No bottom navigation until there is somewhere to navigate to.
 *
 * The max-w-md column is designed at 375px and only widens; every screen is a
 * single vertical flex column so the primary action can sit at the bottom (MF-5).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* T-525 · D-304 — runs while the HTML is still parsing, before the body
            paints: a learner whose hint cookie says «probably signed in» never sees
            an entry screen's primary action drawn and then taken away
            (`[data-entry-hold]`, globals.css). Released by `<EntryCheck>`, or by its
            own timer. A guest (no hint) is untouched. */}
        <script dangerouslySetInnerHTML={{ __html: entryPendingScript() }} />
      </head>
      <body className="bg-surface text-ink antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <header className="flex items-center px-6 py-4">
            <span className="text-sm font-semibold text-ink-muted">
              אנגלית · מסלול אמיר״ם
            </span>
          </header>
          <main className="flex flex-1 flex-col gap-6 px-6 pb-8">{children}</main>
          {/*
            T-011: the attribution link has to be reachable from the product,
            because the obligation attaches to the product and not to one page.
            🧹 T-326 — «reachable» is ⛔ not «drawn inside a task»: measured on
            `/dev/deck`, it sat under the card the learner is answering. The
            footer now asks `lib/core/licenceFooter.ts` which screens carry a
            task, and draws itself on every other one — the entry screens and the
            five tabs included, so it stays reachable before sign-in too.
          */}
          <SourcesFooter />
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
