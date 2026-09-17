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
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api/client';
import type { LevelSummary } from '@/lib/core/levelSummary';
import {
  STUDY_TRACKS,
  trackDestination,
  trackFallbackAction,
  trackLabelHe,
  trackMetric,
  type StudyTrackId,
} from '@/lib/core/studyTracks';

const TITLE_HE = 'לימודים';
const SUBTITLE_HE = 'בחר מסלול · לכל מסלול מדד התקדמות משלו';
/** ⛔ «—», ⛔ לא ריק: קריאה שנכשלה חייבת להיראות אחרת ממסלול ריק באמת (D-046/D-082). */
const UNREACHABLE_HE = '— לא הצלחנו לטעון את ההתקדמות כרגע';
/**
 * T-351 · המסלול שאין לו יעד בנוי אומר זאת, ⛔ ולא נשאר כרטיס בלי דרך החוצה.
 * ⛔ ⛔ ולא קישור שמוביל למסך שאינו קיים: מבוי סתום גרוע מהיעדר כפתור.
 */
const NO_DESTINATION_HE = 'המסלול הזה עדיין בבנייה, ואין בו לאן להיכנס.';

/** ‏T-331ⓑ — מזהים יציבים, ⛔ ולא מחרוזות מוטבעות: `aria-controls` ו-`aria-labelledby` מצביעים זה על זה. */
const TRACK_PANEL_ID = 'studies-track-panel';
const TAB_ID_PREFIX = 'studies-track-tab-';

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

  /**
   * T-406 · ⛔ הענפים עברו ל-`lib/core/studyTracks.ts` (`trackMetric`) — הם היו
   * כאן, ⇒ כל שינוי במדד של מסלול נגע בשני קבצים ו⛔ לא היה נבדק בלי DOM.
   */
  const metric = trackMetric(active, loading ? null : levels);
  /**
   * T-351 · ⛔ **⛔ לא נגזר מ-`metric`, ובכוונה.** הדרך קדימה היא תכונה של
   * המסלול, ⛔ לא של קריאת ההתקדמות ⇒ `metric.kind === 'unreachable'`
   * ⛔ אינו מוחק אותה (`T-349` · «דרך אחת החוצה מכל כשל»).
   */
  const destination = trackDestination(active);
  /**
   * T-406ⓑ · הדבר האחד שאפשר לעשות עכשיו במסלול שאין לו יעד. `null` למסלול
   * שכבר יש לו יעד ⇒ ⛔ לעולם ⛔ אין כאן שתי פעולות באותו פאנל.
   */
  const fallback = trackFallbackAction(active);

  /**
   * T-330 — הבורר גולש אופקית ב-375px (`הבנת הנקרא` נחתך ל«הג»), ו⛔ שני הדברים
   * שחסרו לו ⛔ אינם קוסמטיקה: ⓐ בחירת מסלול חתוך השאירה את השבב **הנבחר** חצי
   * מחוץ למסך, ⓑ ⛔ שום דבר ⛔ לא אמר ללומד שיש עוד מסלולים מעבר לקצה.
   * ⛔ **⛔ לא כיווץ ו⛔ לא עטיפה לשתי שורות** — `36 § 14` קושר סדר והיררכיה,
   * והרנדר (`docs/design/kol-A-04-learning.png`) מצייר שורה אחת.
   */
  const listRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef(new Map<StudyTrackId, HTMLButtonElement>());
  const [hiddenStart, setHiddenStart] = useState(false);
  const [hiddenEnd, setHiddenEnd] = useState(false);

  /**
   * ⛔ `Math.abs` ⛔ ולא `scrollLeft` גולמי: ב-RTL הדפדפן מחזיר כאן ערך **שלילי**
   * ומדידה ישירה הייתה מסמנת «אין עוד» בדיוק כשיש.
   */
  const measureEdges = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const offset = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setHiddenStart(offset > 1);
    setHiddenEnd(max - offset > 1);
  }, []);

  useEffect(() => {
    measureEdges();
    window.addEventListener('resize', measureEdges);
    return () => window.removeEventListener('resize', measureEdges);
  }, [measureEdges, levels, loading]);

  /**
   * ⓐ השבב הנבחר מגולגל לתצוגה. `inline: 'nearest'` ⛔ ולא `'center'` — מסלול
   * שכבר נראה במלואו ⛔ אינו זז, ו⛔ אין קפיצה על כל הקשה. `block: 'nearest'`
   * מונע גלילה **אנכית** של העמוד. ⛔ ו⛔ אין `scroll-smooth` במחלקות: ההעדפה
   * נקראת כאן, ⇒ `prefers-reduced-motion` ⛔ אינו נעקף (35 § layer B).
   */
  useEffect(() => {
    const chip = chipRefs.current.get(active);
    if (!chip) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    chip.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
    measureEdges();
  }, [active, measureEdges]);

  /**
   * T-331ⓐ — ניווט מקלדת, שהכרזת `role="tablist"` כבר הבטיחה ו⛔ לא סיפקה.
   * ⛔ **ארבע עצירות Tab הופכות לאחת:** `tabIndex` מתגלגל — הנבחר `0`, השאר
   * `-1` — ⇒ ה-Tab נכנס לבורר פעם אחת ויוצא ממנו פעם אחת, והחיצים מזיזים
   * בתוכו. זה מה ש-ARIA מחייב ב-`tablist`, וזה מה שקורא-מסך מכריז.
   *
   * 🔴 **והכיוון הוא RTL, ⛔ ולא ברירת המחדל של הדפדפן** — `ArrowLeft` **מתקדם**
   * ו-`ArrowRight` **חוזר**, כי בעברית «הבא» יושב משמאל. ⛔ התקדים נמדד ו⛔ לא
   * שוער: `F-236` — שם `flex-row-reverse` הפך התקדמות לשמאל⇠ימין, וההצהרה
   * בקוד הייתה הפוכה מהתוצאה. ⇒ הכיוון כאן נכתב **מפורשות**, ⛔ ולא נגזר.
   *
   * ⛔ `Home`/`End` הם הראשון/האחרון **בסדר הקריאה העברי** — כלומר הימני ביותר
   * והשמאלי ביותר, ⛔ ולא להפך.
   */
  const onTrackKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const index = STUDY_TRACKS.findIndex((track) => track.id === active);
      if (index < 0) return;
      const last = STUDY_TRACKS.length - 1;
      let next: number;
      if (event.key === 'ArrowLeft') next = index === last ? 0 : index + 1;
      else if (event.key === 'ArrowRight') next = index === 0 ? last : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      else return;
      event.preventDefault();
      const target = STUDY_TRACKS[next];
      if (!target) return;
      setActive(target.id);
      chipRefs.current.get(target.id)?.focus();
    },
    [active],
  );

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">{TITLE_HE}</h1>
        <p className="text-sm text-ink-muted">{SUBTITLE_HE}</p>
      </header>

      <div className="relative">
        <div
          ref={listRef}
          onScroll={measureEdges}
          role="tablist"
          aria-label={TITLE_HE}
          className="flex gap-2 overflow-x-auto"
        >
        {STUDY_TRACKS.map((track) => {
          const isActive = track.id === active;
          return (
            <button
              key={track.id}
              ref={(el) => {
                if (el) chipRefs.current.set(track.id, el);
                else chipRefs.current.delete(track.id);
              }}
              type="button"
              role="tab"
              id={`${TAB_ID_PREFIX}${track.id}`}
              aria-current={isActive ? 'true' : undefined}
              aria-selected={isActive}
              aria-controls={TRACK_PANEL_ID}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={onTrackKeyDown}
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
        {/*
          ⓑ סימן הגלישה, ו⛔ **רק כשיש גלישה** — `hiddenStart`/`hiddenEnd` נמדדים
          מה-DOM, ⇒ ארבעה מסלולים שנכנסים במלואם ⛔ אינם מקבלים דהייה על כלום.
          ‏`start`/`end` לוגיים, והכיוון הפיזי של המדרג מתהפך ב-`ltr:` — הדהייה
          אטומה **בקצה** ומתבהרת פנימה, בשני כיווני הכתיבה.
          ‏`aria-hidden` + `pointer-events-none`: קישוט, ⛔ לא יעד הקשה ו⛔ לא טקסט.
        */}
        {hiddenStart && (
          <span
            aria-hidden="true"
            data-track-scroll-hint="start"
            className="pointer-events-none absolute inset-y-0 start-0 w-8 bg-gradient-to-l from-surface to-transparent ltr:bg-gradient-to-r"
          />
        )}
        {hiddenEnd && (
          <span
            aria-hidden="true"
            data-track-scroll-hint="end"
            className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-r from-surface to-transparent ltr:bg-gradient-to-l"
          />
        )}
      </div>

      {/*
        T-331ⓑ — `aria-selected="true"` הצהיר על פאנל ש⛔ לא היה קיים: `grep`
        על הקובץ החזיר **אפס** `role="tabpanel"` ו**אפס** `aria-controls`.
        ⇒ ההכרזה הצביעה על ⛔ כלום. כרטיס המצב **הוא** הפאנל — הוא כבר מציג את
        המסלול הנבחר ו⛔ רק אותו — ⇒ הוא מקבל את התפקיד, מזהה, ו-`aria-labelledby`
        אל השבב שבחר בו. ⛔ `tabIndex={0}` ⛔ אינו קישוט: פאנל בלי עצירת Tab
        ⛔ אינו נגיש במקלדת אחרי שהחיצים תפסו את השבבים.
      */}
      <div
        data-track-status
        id={TRACK_PANEL_ID}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`${TAB_ID_PREFIX}${active}`}
        className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-4"
        aria-live="polite"
      >
        <h2 className="text-base font-semibold text-ink">{trackLabelHe(active)}</h2>
        {metric.kind === 'unreachable' ? (
          <p className="text-sm text-ink-muted">{UNREACHABLE_HE}</p>
        ) : (
          <p className="text-sm text-ink-muted">{metric.summaryHe}</p>
        )}
        {/*
          T-351 — הדרך קדימה מהמסך. עד היום הפאנל כולו היה `<h2>` ו-`<p>`
          יחיד: הלומד בחר מסלול ו⛔ לא יכול היה להיכנס אליו. ⛔ שתי אפשרויות
          בלבד, ⛔ ואין שלישית: יעד בנוי ⇒ קישור אחד; ⛔ אין יעד ⇒ משפט עברי
          שאומר זאת. ⛔ אפס קישור אל מסך שאינו קיים.
          ⚠️ הקישור נשאר גם כש-`metric.kind === 'unreachable'` — ראה
          `destination` למעלה.
        */}
        {destination !== null ? (
          <Link
            href={destination.href}
            data-track-destination={active}
            className="mt-1 inline-flex min-h-touch w-full items-center justify-center rounded-full bg-brand-surface px-5 text-base font-semibold text-brand-on active:opacity-90"
          >
            {destination.labelHe}
          </Link>
        ) : (
          /*
            T-406ⓑ — עד היום זה היה משפט יחיד, ו⛔ אפס פעולה: היציאה היחידה
            מהפאנל הייתה סרגל הלשוניות. `ui-ux-pro-max` · `ux` · Feedback /
            Empty States אומר «Show helpful message **and action**» ⇒ ההצהרה
            נשארת, ו**מתחתיה** הדרך האחת שכן פתוחה עכשיו.
            ⛔ **אפס באנר תחזית** (`D-237` · `F-177` הוכרעה שם ו⛔ אינה נפתחת מחדש).
            ⛔ **ואפס קישור למסך שאינו קיים:** `trackFallbackAction` נגזרת
            מ-`trackDestination` עצמה.
          */
          <>
            <p data-track-destination="none" className="mt-1 text-sm text-ink-muted">
              {NO_DESTINATION_HE}
            </p>
            {fallback !== null && (
              <Link
                href={fallback.href}
                data-track-fallback={active}
                className="mt-1 inline-flex min-h-touch w-full items-center justify-center rounded-full border border-brand bg-brand-surface/20 px-5 text-base font-semibold text-brand-surface active:opacity-90"
              >
                {fallback.labelHe}
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
