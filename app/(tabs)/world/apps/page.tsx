import AppCentre from '@/components/AppCentre';

// T-503 — the screen's own `<h1>` is «בנה את הטבעת שלך»; the tab title names the place.
export const metadata = { title: 'מרכז האפליקציות' };

/**
 * מרכז האפליקציות — `kol-E-02` (T-503 · D-296 · Figma `3341:3`).
 * The ring lives on this device, so there is ⛔ no data access here and ⛔ no session
 * check: `<AppCentre>` reads `localStorage` after mount. Inside `(tabs)` ⇒ the tab bar is
 * already there, and D-028 allows one bar per screen.
 */
export default function AppCentrePage() {
  return <AppCentre />;
}
