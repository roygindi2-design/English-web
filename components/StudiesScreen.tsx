'use client';

/**
 * גוף לשונית `לימודים` — בורר ארבעת המסלולים, T-246 · `36 § 9` · D-176.
 *
 * 🎯 **הרנדר: `docs/design/kol-A-04-learning.png`**, וערכי הפריסה כאן לקוחים
 * מ-`docs/design/render_video_A.py:1149-1264` (`TRACKS` · `screen_hub`) —
 * ⛔ לא מהעין (`36 § 14.4` · D-114): כותרת «לימודים» · תת-כותרת «בחר מסלול ·
 * לכל מסלול מדד התקדמות משלו» · שורת שבבי מסלול RTL מתחת לכותרת.
 *
 * ⛔ **סטייה מכוונת אחת מהרנדר, ומתועדת (Layer A גוברת · `36 § 14.4`):** השבב
 * הפעיל ברנדר מסומן בצבע (`BRAND`) בלבד. `36 § 12.7` אוסר מצב שמקודד בצבע
 * בלבד, ולכן השבב הפעיל כאן נושא גם `aria-current="true"` וגם משקל גופן שונה —
 * שני ערוצים נוספים על הצבע.
 *
 * ⛔ **T-247 (נתיב המודולים בתוך מסלול) אינו כאן.** הרכיב הזה מציג שבב + כרטיס
 * סטטוס אחד לכל מסלול (ⓐ+ⓑ+ⓒ+ⓕ מתוך T-246), ⛔ ולא רשימת מודולים לחיצה
 * (חסום ב-T-246 עצמה, ⛔ ולא פער שנשכח — ראה התוכנית, «מה בכוונה נשאר בחוץ»).
 *
 * ⛔ **אפס תחזית קצב** — ⛔ אין נוסחה מוגדרת באף מסמך עוגן (ראה Global Constraint 8
 * בתוכנית). הוספת אחת כאן הייתה המצאת קביעה על הלומד, בדיוק מה ש-§ 4.4.3 אוסר.
 *
 * ⛔ **הרכיב אינו ניגש לדאטהבייס** — הקריאה ל-`GET /api/levels/summary` עוברת
 * דרך `apiGet` (lib/api/client.ts), בדיוק הדפוס של `<LevelMapScreen>`.
 * `fixtureLevels` עוקף את הקריאה — הפיקסטורה ב-`/dev/tabs/studies` מזינה אותו כדי
 * שהגאומטריה תימדד בלי env של Supabase.
 */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import type { LevelSummary } from '@/lib/core/levelSummary';
import {
  STUDY_TRACKS,
  emptyTrackMetric,
  trackLabelHe,
  vocabularyMetric,
  type StudyTrackId,
  type TrackMetricState,
} from '@/lib/core/studyTracks';

const TITLE_HE = 'לימודים';
const SUBTITLE_HE = 'בחר מסלול · לכל מסלול מדד התקדמות משלו';
/** ⛔ «—», ⛔ לא ריק: קריאה שנכשלה חייבת להיראות אחרת ממסלול ריק באמת (D-046/D-082). */
const UNREACHABLE_HE = '— לא הצלחנו לטעון את ההתקדמות כרגע';

type SummaryResponse =
  | { readonly ok: true; readonly level: string | null; readonly levels?: readonly LevelSummary[] }
  | { readonly ok: false; readonly code: string };

/** SVG מוטבע ⛔ ולא אמוג׳י (חוקה שכבה A · § 6) — הערוץ השני של השבב הפעיל. */
function ActiveTrackMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function metricFor(id: StudyTrackId, levels: readonly LevelSummary[] | null): TrackMetricState {
  if (id !== 'vocabulary') return emptyTrackMetric(id);
  if (levels === null) return { kind: 'unreachable' };
  return vocabularyMetric(levels);
}

export default function StudiesScreen({
  fixtureLevels,
}: {
  readonly fixtureLevels?: readonly LevelSummary[];
} = {}): React.JSX.Element {
  const [active, setActive] = useState<StudyTrackId>(STUDY_TRACKS[0].id);
  const [levels, setLevels] = useState<readonly LevelSummary[] | null>(fixtureLevels ?? null);
  const [loading, setLoading] = useState(fixtureLevels === undefined);

  useEffect(() => {
    if (fixtureLevels !== undefined) return;
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<SummaryResponse>('/api/levels/summary');
        if (cancelled) return;
        setLevels(body.ok ? (body.levels ?? []) : null);
      } catch {
        if (!cancelled) setLevels(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fixtureLevels]);

  const metric = metricFor(active, loading ? null : levels);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{TITLE_HE}</h1>
        <p className="text-sm text-ink-muted">{SUBTITLE_HE}</p>
      </header>

      <div role="tablist" aria-label={TITLE_HE} className="flex gap-2 overflow-x-auto">
        {STUDY_TRACKS.map((track) => {
          const isActive = track.id === active;
          return (
            <button
              key={track.id}
              type="button"
              role="tab"
              aria-current={isActive ? 'true' : undefined}
              aria-selected={isActive}
              onClick={() => setActive(track.id)}
              className={
                isActive
                  ? // F-036: the bare `--brand` mark colour is a 4.42:1 fill, never a
                    // text/chip background — the surface token at low opacity is the
                    // established fill here (components/StoryScreen.tsx:225).
                    'flex min-h-touch shrink-0 items-center gap-1.5 rounded-full border border-brand bg-brand-surface/20 px-4 text-sm font-bold text-brand-surface'
                  : 'flex min-h-touch shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-4 text-sm text-ink-muted'
              }
            >
              {isActive && <ActiveTrackMark />}
              {track.labelHe}
            </button>
          );
        })}
      </div>

      <div
        data-track-status
        className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-4"
        aria-live="polite"
      >
        <h2 className="text-base font-semibold text-ink">{trackLabelHe(active)}</h2>
        {metric.kind === 'unreachable' ? (
          <p className="text-sm text-ink-muted">{UNREACHABLE_HE}</p>
        ) : (
          <p className="text-sm text-ink-muted">{metric.summaryHe}</p>
        )}
      </div>
    </section>
  );
}
