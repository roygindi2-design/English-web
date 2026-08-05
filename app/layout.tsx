import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'English Web — לימוד אנגלית אדפטיבי',
  description: 'אפליקציית לימוד אנגלית אדפטיבית לדוברי עברית. מסלול ראשון: אמיר״ם.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'English Web' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
