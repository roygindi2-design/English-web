import type { Metadata } from 'next';

/**
 * The noindex for the `/dev/arcade` fixture. A layout fixture must never be a search result,
 * and the declaration lives here — beside `app/dev/world/layout.tsx` — so that the page file
 * stays free to become a client component later without the robots rule quietly vanishing
 * with it (`metadata` cannot be exported from a client component).
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevArcadeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
