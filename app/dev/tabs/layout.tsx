import type { Metadata } from 'next';

/** A layout fixture must never be a search result. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevTabsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
