import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

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
      <body className="bg-surface text-ink antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <header className="flex items-center px-6 py-4">
            <span className="text-sm font-semibold text-ink-muted">
              אנגלית · מסלול אמיר״ם
            </span>
          </header>
          <main className="flex flex-1 flex-col gap-6 px-6 pb-8">{children}</main>
          {/*
            T-011: the attribution link has to be reachable from every screen,
            because the obligation attaches to the product and not to one page.
            min-h-touch keeps it at the 44px floor check:mobile enforces.
          */}
          <footer className="px-6 pb-6 pt-2">
            <Link
              href="/sources"
              className="inline-flex min-h-touch items-center text-sm text-ink-muted underline"
            >
              מקורות הנתונים והרישיונות
            </Link>
          </footer>
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
