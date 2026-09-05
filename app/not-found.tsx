import Link from 'next/link';

/** Hebrew 404 — the default Next.js page is English and breaks RTL. */
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold leading-tight">הדף הזה לא קיים</h1>
        <p className="text-lg leading-relaxed text-ink-muted">
          אולי הקישור השתנה. אפשר לחזור להתחלה.
        </p>
      </div>

      {/* T-253ⓒ · D-186 — `/` נקרא בשני שמות (כאן ו-`app/sources/page.tsx`);
          `חזרה למסך הבית` היא הקבועה שהמוצר כבר משתמש בה בכל מקום אחר. */}
      <Link
        href="/"
        className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
      >
        חזרה למסך הבית
      </Link>
    </div>
  );
}
