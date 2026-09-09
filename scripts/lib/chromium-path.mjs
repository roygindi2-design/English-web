/**
 * 🧭 **איתור Chromium — מופע אחד, ⛔ לא שני עותקים שנסחפים.**  ⟦הופק 09/09⟧
 *
 * 🔬 הלוגיקה הזאת נכתבה ב-`verify-mobile.mjs` ונדרשה שוב ב-`walk-screens.mjs`.
 * ⛔ העתקה הייתה יוצרת **שני** מקומות שצריך לעדכן כשמספר הבילד מתחלף — וזה בדיוק
 * מה שהפונקציה קיימת נגדו: Playwright ⛔ מצמיד מספר בילד (1234 היום), והסביבה מביאה
 * אחר (1194) עם `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` ⇒ `chromium.executablePath()`
 * מצביע על תיקייה ש⛔ אינה קיימת. ⇒ **מגששים את מה שבאמת על הדיסק.**
 */
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

export function resolveChromiumPath() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root && existsSync(root)) {
    candidates.push(path.join(root, 'chromium'));
    const subPaths = [
      'chrome-linux/chrome',
      'chrome-linux64/chrome',
      'chrome-headless-shell-linux64/chrome-headless-shell',
      'chrome-linux/headless_shell',
    ];
    // ⛔ Chromium מלא לפני קונכיית ה-headless — הקונכייה ⛔ אינה מריצה service-worker.
    const dirs = readdirSync(root)
      .filter((e) => e.startsWith('chromium'))
      .sort((a, b) => Number(a.includes('headless')) - Number(b.includes('headless')));
    for (const dir of dirs) for (const sub of subPaths) candidates.push(path.join(root, dir, sub));
  }

  try {
    candidates.push(chromium.executablePath());
  } catch {
    /* ⛔ אין רשומה ברג'יסטרי של playwright — הגישושים שלמעלה עדיין תקפים */
  }
  candidates.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome');

  return candidates.find((c) => c && existsSync(c)) ?? null;
}
