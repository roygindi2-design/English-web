export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-slate-500">מסלול ראשון: אמיר״ם</p>
        <h1 className="text-3xl font-bold leading-tight">לימוד אנגלית שמתאים את עצמו אליך</h1>
        <p className="text-base leading-relaxed text-slate-600">
          השלד עלה לאוויר. מכאן לופ הסוכנים בונה את המוצר — מסך אחר מסך, על בסיס
          תוכניות לימוד מאומתות בלבד.
        </p>
      </header>

      <section
        aria-label="סטטוס המערכת"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-lg font-semibold">מצב ההקמה</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>✅ שלד <span className="ltr-inline">Next.js</span> + <span className="ltr-inline">TypeScript</span></li>
          <li>✅ <span className="ltr-inline">Mobile-First</span> ו-<span className="ltr-inline">RTL</span> מלא</li>
          <li>✅ <span className="ltr-inline">PWA</span> — ניתן לשמירה למסך הבית</li>
          <li>✅ הפרדת <span className="ltr-inline">API-First</span></li>
          <li>⏳ מבחן רמה אדפטיבי — ממתין למחקר ה-PM</li>
        </ul>
      </section>

      <a
        href="/api/health"
        className="flex min-h-touch items-center justify-center rounded-xl bg-slate-900 px-5 text-base font-medium text-white"
      >
        בדיקת תקינות השרת
      </a>
    </main>
  );
}
