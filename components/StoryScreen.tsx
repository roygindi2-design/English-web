'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import WordPopover from '@/components/WordPopover';
import { apiGet, apiPost } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { buildStorySegments, type StoryGloss } from '@/lib/core/storyTapTargets';
import { LEVEL_SCAN_HREF } from '@/lib/core/worldApps';

/**
 * `/world/story` — מסך הקריאה (T-186 · `36 § 7` · D-108).
 *
 * 🎯 **הרנדר: `docs/design/kol-A-05-story.png`**, וערכיו נלקחו מ-`docs/design/render_video_A.py`
 * (`screen_story`, שורות 964–1010) ⛔ ולא מהעין: הכותרת המשנית, שבב הרמה, «סיפור 3 מתוך 12»,
 * כרטיס הגוף על `RAISED` עם מסגרת `BORDER_SUB` ורדיוס 22 → `rounded-2xl`, מקרא «ידועה»,
 * שורת הסיכום ו-«הסיפור הבא» ברוחב מלא על `BRAND_SURFACE` ברדיוס 16 → `rounded-2xl`.
 * `36 § 14.4` (שוכתב 24/08): **הרנדר מחייב — פריסה וגימור כאחד**, וההחרגה היחידה היא
 * **חוקה שכבה A**.
 *
 * ⚠️ **פער מדוד מול הרנדר, ומוצהר ⛔ ולא שקט:** ‏`ST_LINE = 32` ברנדר, וכאן **34px**.
 * `36 § 3.2` ו-`MIN_LINE_HEIGHT` ב-`scripts/story-tap-audit.mjs` נוקבים ב-34, ושכבה A גוברת
 * על הרנדר. ⛔ זה הפער היחיד, והוא כתוב.
 *
 * ⚠️ **פער שני, ו⛔ אין לסגור אותו בהמצאה:** הרנדר מציג כותרת עברית («הספרייה של מאיה»)
 * ו-`public.stories` מחזיקה `title_en` בלבד. ⛔ אין תרגום בזמן רינדור ו⛔ אין כותרת שנכתבת
 * כאן — המסך שולח `title_en` בתוך `<EnWord>`, ועמודת הכותרת העברית היא מיגרציה מוצהרת
 * נפרדת (F-122 · D-108 ניתבה שורה לרוי).
 *
 * ⛔ **מילה חדשה ⛔ אינה מסומנת מראש** (§ 4.2יג-ב ⓑ, ⛔ לא בוטל): הקו הדק הוא «ידועה»
 * בלבד, והוא נושא **מקרא כתוב** — צבע לעולם אינו הערוץ היחיד (חוקה שכבה A).
 *
 * ⛔ **אפס גישה למסד מהרכיב.** הכול דרך `GET /api/world/story` ו-`lib/api/client.ts`.
 */

const KICKER_HE = 'העולם · סיפורים';
const SUBTITLE_HE = 'סיפור ברמה שלך · הקש על מילה מודגשת לתרגום';
const KNOWN_LEGEND_HE = 'ידועה';
const NEXT_STORY_HE = 'הסיפור הבא';
const AMBIGUOUS_HE = 'לאיזו מילה התכוונת?';
const LOADING_HE = 'טוען את הסיפור שלך…';
const NO_LEVEL_HE = 'עוד לא בחרת רמה, ובלי רמה אין סיפור ברמה שלך.';
const NO_LEVEL_ACTION_HE = 'לבחירת הרמה';
const NO_STORIES_HE = 'עוד אין מספיק סיפורים ברמה שלך.';
const NO_STORIES_ACTION_HE = 'חזרה לעולם';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const LOGIN_HREF = '/login?expired=1';
const WORLD_HREF = '/world';

/** בדיוק מה ש-`GET /api/world/story` עונה (`docs/api-contract.md`), ⛔ ולא יותר. */
export interface StoryGlossWire {
  readonly translationHe: string;
  readonly posHe: string;
  readonly wordId: string;
}

export interface StoryPayload {
  readonly story: { readonly id: string; readonly titleEn: string; readonly bodyEn: string };
  readonly index: number;
  readonly total: number;
  readonly level: string;
  readonly glosses: Readonly<Record<string, StoryGlossWire>>;
  readonly knownLemmas: readonly string[];
  readonly counts: { readonly newWords: number; readonly alreadyKnown: number };
}

type StoryBody =
  | ({ readonly ok: true } & StoryPayload)
  | {
      readonly ok: false;
      readonly code: string;
      readonly stories?: { readonly atLevel: number; readonly required: number };
    };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly payload: StoryPayload }
  | { readonly kind: 'no_level' }
  | { readonly kind: 'no_stories'; readonly atLevel: number | null; readonly required: number | null }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-touch w-full items-center justify-center rounded-2xl bg-brand-surface px-5 py-4 text-lg font-bold text-brand-on active:opacity-90';
const SECONDARY_ACTION_CLASS =
  'inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90';

export interface StoryScreenViewProps {
  readonly state: ScreenState;
  readonly onRetry?: () => void;
}

export default function StoryScreen(): React.JSX.Element {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<StoryBody>('/api/world/story');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else if (body.code === 'no_level') setState({ kind: 'no_level' });
        else if (body.code === 'no_stories') {
          // ⛔ המספרים מהשרת (D-064 · D-066) — ⛔ אין כאן ספירה שהמסך המציא.
          setState({
            kind: 'no_stories',
            atLevel: body.stories?.atLevel ?? null,
            required: body.stories?.required ?? null,
          });
        } else setState({ kind: 'error' });
        return;
      }
      setState({ kind: 'ready', payload: body });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return <StoryScreenView state={state} onRetry={() => void load()} />;
}

export function StoryScreenView({ state, onRetry }: StoryScreenViewProps): React.JSX.Element {
  return (
    <section dir="rtl" className="flex min-h-[100dvh] flex-col gap-5 pb-8">
      <header className="flex flex-col gap-1 text-right">
        <p className="text-sm text-ink-muted">{KICKER_HE}</p>
        <h1 className="text-2xl font-bold leading-tight">
          {state.kind === 'ready' ? <EnWord>{state.payload.story.titleEn}</EnWord> : ' '}
        </h1>
        <p className="text-sm text-ink-muted">{SUBTITLE_HE}</p>
      </header>

      {state.kind === 'ready' ? (
        <StoryReady payload={state.payload} />
      ) : (
        <StoryNotReady state={state} onRetry={onRetry} />
      )}
    </section>
  );
}

/**
 * שורת המצב של הרנדר: שבב הרמה בצד ימין־פנימי, פס הקריאה, ו-«סיפור N מתוך M» בקצה.
 * ⚠️ הפס נושא `aria-hidden` — הוא **חזרה** על «סיפור N מתוך M», ⛔ ולא ערוץ בפני עצמו.
 */
function StatusRow({ level, index, total }: { level: string; index: number; total: number }) {
  const pct = total > 0 ? Math.round((index / total) * 100) : 0;
  // ⚠️ **הסדר נלקח מהרנדר ⛔ ולא מהזרימה הטבעית של RTL:** `screen_story` מציב את שבב
  // הרמה ב-`x = 24` (הקצה **השמאלי**) ואת «סיפור N מתוך M» ב-`anchor="rm"` על `LW - 24`
  // (הקצה **הימני**), והפס ביניהם. במכולה RTL הילד הראשון יושב מימין ⇒ המונה ראשון
  // והשבב אחרון. ⛔ נמדד ב-`diff:render`, ⛔ ולא נוחש.
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-sm text-ink-muted">{`סיפור ${index} מתוך ${total}`}</span>
      <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-border-subtle">
        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </span>
      <span className="rounded-full border border-brand/60 bg-brand/20 px-3 py-1 text-sm font-bold text-brand-surface">
        <EnWord>{level}</EnWord>
      </span>
    </div>
  );
}

function StoryReady({ payload }: { payload: StoryPayload }) {
  const known = new Set(payload.knownLemmas);
  const glosses = new Map<string, StoryGloss>(
    Object.entries(payload.glosses).map(([lemma, g]) => [
      lemma,
      { translationHe: g.translationHe, posHe: g.posHe },
    ]),
  );
  const segments = buildStorySegments(payload.story.bodyEn, glosses, known);

  const [openLemma, setOpenLemma] = useState<string | null>(null);
  const [addedLemmas, setAddedLemmas] = useState<ReadonlySet<string>>(new Set());
  const [ambiguous, setAmbiguous] = useState<readonly string[] | null>(null);

  /**
   * `36 § 3.4` — **מגע בטווח של שני יעדים מציג שבב עם שניהם, ⛔ ולעולם לא ניחוש.**
   * המרווח האופקי מוחזר כשוליים שליליים, ולכן שני אזורי הקשה של מילים סמוכות **יכולים**
   * לחפוף. ההכרעה נעשית על **הקואורדינטה של המגע** מול כל אזורי ההקשה בפסקה, ⛔ ולא על
   * האלמנט שהדפדפן במקרה בחר.
   */
  const onWordClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, lemma: string) => {
    const paragraph = event.currentTarget.closest('[data-story-body]');
    const hits =
      paragraph === null
        ? []
        : [...paragraph.querySelectorAll('[data-story-word]')].filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              event.clientX >= r.left &&
              event.clientX <= r.right &&
              event.clientY >= r.top &&
              event.clientY <= r.bottom
            );
          });
    if (hits.length > 1) {
      setOpenLemma(null);
      setAmbiguous(hits.map((el) => (el.textContent ?? '').trim()));
      return;
    }
    setAmbiguous(null);
    setOpenLemma(lemma);
  }, []);

  const add = useCallback(
    (lemma: string) => {
      const wordId = payload.glosses[lemma]?.wordId;
      if (wordId === undefined) return;
      // ⛔ סימון מיידי ו⛔ בלי טעינה מחדש: הלומד לחץ, והכתיבה היא `attempts + 1` בלבד
      // (D-084). כישלון רשת ⛔ אינו הופך את המסך למסך שגיאה — הקריאה הבאה תגלה את האמת.
      setAddedLemmas((prev) => new Set([...prev, lemma]));
      void apiPost('/api/review/context', { wordId }).catch(() => {});
    },
    [payload.glosses],
  );

  const openGloss = openLemma === null ? undefined : payload.glosses[openLemma];

  return (
    <>
      <StatusRow level={payload.level} index={payload.index} total={payload.total} />

      {/* ⚠️ `data-story-body` הוא חוזה T-183: `scripts/verify-mobile.mjs` מוצא את
          הפסקה דרכו ומעביר אותה ל-`auditStoryBody`. ⛔ אין להסיר אותו.
          ⚠️ `leading-[34px]` הוא `36 § 3.2` — ⛔ ולא `ST_LINE = 32` של הרנדר.
          ⚠️ `data-story-ambiguity="chip"` מצהיר על תנאי 4, והמימוש הוא `onWordClick`. */}
      <div
        data-story-body
        data-story-ambiguity="chip"
        className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-5 text-[15.5px] leading-[34px]"
      >
        <p dir="ltr" lang="en" className="ltr-inline text-ink-muted">
          {segments.map((segment, i) => {
            if (!segment.isTarget || segment.lemma === null) {
              return <span key={i}>{segment.text}</span>;
            }
            const lemma = segment.lemma;
            const gloss = payload.glosses[lemma];
            return (
              <button
                key={i}
                type="button"
                data-story-word
                data-story-translation={gloss?.translationHe ?? ''}
                onClick={(e) => onWordClick(e, lemma)}
                className={[
                  // `36 § 3.2/3.3`: 8px מרווח הקשה אנכי בכל צד, אזור אופקי ≥32px ממורכז
                  // על המילה, **והמרווח מוחזר כשוליים שליליים שווים** — אחרת אזור ההקשה
                  // מזיז את הפסקה, ו-`auditStoryBody` מפיל `layout-shifted`.
                  'inline cursor-pointer px-2 py-2 -mx-2 -my-2',
                  // ⛔ **מילה חדשה ⛔ אינה נושאת סימון — § 4.2יג-ב ⓑ ו-D-108 «⛔ New words
                  // carry NOTHING», ו⛔ שניהם ⛔ לא בוטלו.** הרנדר מצייר שבב מותג מאחורי
                  // מילה חדשה, ו-`36 § 1` קובע ש-36 גובר בכל סתירה. ⇒ הפער נרשם כממצא
                  // (F-123) ⛔ ולא נסגר כאן בהמצאה. הסימון היחיד הוא «ידועה», והוא נושא
                  // **מקרא כתוב** — צבע לעולם אינו הערוץ היחיד (חוקה שכבה A).
                  segment.isKnown
                    ? 'font-semibold text-ink underline decoration-success decoration-2 underline-offset-4'
                    : '',
                ].join(' ')}
              >
                {segment.text}
              </button>
            );
          })}
        </p>
      </div>

      {ambiguous === null ? null : (
        <p
          data-story-ambiguity-chip
          dir="rtl"
          className="rounded-lg border border-border-strong px-4 py-3 text-sm text-ink"
        >
          {`${AMBIGUOUS_HE} ${ambiguous.join(' · ')}`}
        </p>
      )}

      {openLemma === null || openGloss === undefined ? null : (
        <WordPopover
          word={openLemma}
          translationHe={openGloss.translationHe}
          posHe={openGloss.posHe}
          added={addedLemmas.has(openLemma)}
          onAdd={() => add(openLemma)}
          onClose={() => setOpenLemma(null)}
        />
      )}

      {/* ⚠️ אותו נימוק בדיוק כמו בשורת המצב: ברנדר הקו הירוק ו-«ידועה» יושבים ב-
          `x = 48…84` (הקצה **השמאלי**), ושורת הסיכום `anchor="rm"` על `LW - 24`
          (הקצה **הימני**). ⇒ הסיכום ראשון והמקרא אחרון. */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-muted">
          {`${payload.counts.newWords} מילים חדשות · ${payload.counts.alreadyKnown} שכבר ידעת`}
        </span>
        <span className="flex items-center gap-2 text-sm text-ink-muted">
          <span aria-hidden className="inline-block h-[2px] w-7 rounded-full bg-success" />
          {KNOWN_LEGEND_HE}
        </span>
      </div>

      <Link href={WORLD_HREF} className={PRIMARY_ACTION_CLASS}>
        {NEXT_STORY_HE}
      </Link>
    </>
  );
}


function StoryNotReady({ state, onRetry }: { state: ScreenState; onRetry?: () => void }) {
  if (state.kind === 'loading') {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-8">
        <p className="text-lg text-ink-muted">{LOADING_HE}</p>
      </div>
    );
  }

  if (state.kind === 'no_level') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg text-ink-muted">{NO_LEVEL_HE}</p>
        <Link href={LEVEL_SCAN_HREF} className={SECONDARY_ACTION_CLASS}>
          {NO_LEVEL_ACTION_HE}
        </Link>
      </div>
    );
  }

  if (state.kind === 'no_stories') {
    const detail =
      state.atLevel === null || state.required === null
        ? ''
        : ` יש ${state.atLevel} מתוך ${state.required}.`;
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg text-ink-muted">{NO_STORIES_HE + detail}</p>
        <Link href={WORLD_HREF} className={SECONDARY_ACTION_CLASS}>
          {NO_STORIES_ACTION_HE}
        </Link>
      </div>
    );
  }

  if (state.kind === 'session_expired') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg text-ink-muted">{FAILURE_HE.load}</p>
        <Link href={LOGIN_HREF} className={SECONDARY_ACTION_CLASS}>
          {SIGN_IN_AGAIN_HE}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-lg text-ink-muted">
        {state.kind === 'schema_missing' ? SCHEMA_MISSING_HE : FAILURE_HE.load}
      </p>
      {onRetry === undefined ? null : (
        <button type="button" onClick={onRetry} className={SECONDARY_ACTION_CLASS}>
          {RETRY_HE}
        </button>
      )}
    </div>
  );
}
