import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'English Web — אנגלית לאמיר״ם',
  description: 'תרגול אנגלית יומי קצר לדוברי עברית — 10 דקות ביום, עד תאריך המבחן. מסלול ראשון: אמיר״ם.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'English Web' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
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
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <header className="flex items-center px-5 py-4">
            <span className="text-sm font-semibold text-slate-500">
              אנגלית · מסלול אמיר״ם
            </span>
          </header>
          <main className="flex flex-1 flex-col gap-6 px-5 pb-8">{children}</main>
        </div>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
