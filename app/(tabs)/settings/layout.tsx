import type { Metadata } from 'next';

/**
 * T-264 / D-193 — the title lives HERE, ⛔ not in `page.tsx`. `page.tsx` in this route
 * is a Client Component (it opens with `'use client'` for `useState`/`useEffect`), and
 * Next.js refuses `metadata`/`generateMetadata` exports from a Client Component page.
 * A sibling `layout.tsx` in the same route folder is a Server Component that only
 * wraps this one route — it changes ⛔ zero pixels (`layout.tsx` renders `children`
 * and nothing else) and adds the title the App Router's cascade already looks for one
 * level up when the leaf itself cannot carry it.
 *
 * The string is the exact one `page.tsx`'s own `<h1>` already renders — `HEADING_HE`
 * there, `'הגדרות'` (`app/(tabs)/settings/page.tsx:42`). The `· English Web` suffix
 * comes from `app/layout.tsx`'s `title.template`.
 */
export const metadata: Metadata = { title: 'הגדרות' };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
