import Link from 'next/link';

/** Hebrew 404 — the default Next.js page is English and breaks RTL. */
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-2xl font-bold leading-tight">הדף הזה לא קיים</h1>
        <p className="text-lg leading-relaxed text-slate-600">
          אולי הקישור השתנה. אפשר לחזור להתחלה.
        </p>
      </div>

      <Link
        href="/"
        className="flex min-h-touch items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-lg font-semibold text-white active:bg-slate-700"
      >
        חזרה למסך הפתיחה
      </Link>
    </div>
  );
}
