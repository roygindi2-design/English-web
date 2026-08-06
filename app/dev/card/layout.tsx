import type { Metadata } from 'next';

/**
 * `metadata` cannot be exported from a client component, and the fixture page has
 * to be one (it holds card state). The noindex therefore lives here — a layout
 * fixture must never be a search result.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevCardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
