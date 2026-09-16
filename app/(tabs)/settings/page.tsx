'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import LevelPath from '@/components/LevelPath';
import { apiGet, apiPost } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE, SCHEMA_MISSING_HE, SESSION_EXPIRED_HE } from '@/lib/core/failure';
import { failureExit, isRetryable } from '@/lib/core/failureExit';
import type { CefrBand } from '@/lib/core/cefrLevels';
import type { LevelSummary } from '@/lib/core/levelSummary';
import { LEVEL_SCAN_HREF } from '@/lib/core/worldApps';

/**
 * הגדרות — הלשונית החמישית (T-174 · `36 § 4`), ומאז C-0318 גם **הבית של שינוי הרמה**
 * (T-211 · D-123ד׳ · המשך של T-210).
 *
 * ⛔ **הלשונית קיימת מסיבה מבנית, ⛔ ולא בשביל רשימת משאלות.** `36 § 4` אומר זאת
 * במפורש: «הגדרות נוספה כדי לאפשר את המרכוז ולתת בית לשינוי רמה ולניהול מסלולים».
 *
 * ⚠️ **ומה שנמדד לפני השורה הזאת, ⛔ ולא הוסק:** הפריט `שינוי רמה` כאן הצביע ל-
 * `LEVEL_SCAN_HREF = '/study/scan'`, ו-`app/api/levels/scan/route.ts:69` **קורא** את
 * `current_level` בעוד שורה 123 כותבת `self_marked_known` **למילים**. ⇒ **הנתיב ⛔ אינו
 * נוגע ברמה בכלל**, והפריט היחיד שנקרא «שינוי רמה» במוצר ⛔ לא שינה רמה. ⇒ בלי השורה
 * הזאת, T-210 הייתה מוחקת את היכולת היחידה שכן עבדה.
 *
 * ⛔ **אפס נתיב חדש** (T-211ⓐ): `<LevelPath>` הקיים, ו-`POST /api/levels/current` —
 * **אותו נתיב** ש-`<LevelMapScreen>` השתמש בו עד אתמול. שני כותבים לעמודה אחת הם שני
 * מקורות אמת.
 *
 * ⛔ **אפס נעילה · אפס «עדיין לא» · אפס סף** (T-211ⓑ · D-037 · R-017): ⛔ אין סף שליטה
 * אמפירי, והמוצר **סופר ואינו שופט**. ⛔ **ואפס «אתה בטוח?»** (T-211ⓒ): `current_level`
 * הוא שדה אחד, ו⛔ אינו נוגע ב-SM-2 ולא במילה שנלמדה.
 *
 * ⛔ **`LevelPath.tsx` ⛔ לא נערך** (T-211ⓕ) — זהו שינוי **הורה**, ⛔ ולא שינוי רכיב.
 *
 * 🔴 **והמסך קורא מעכשיו את הפרופיל ⇒ `/settings` נכנס ל-`PROTECTED_SCREENS` ב-`proxy.ts`
 * באותו קומיט** (T-211ⓔ), בדיוק כפי ש-`/me` עשה. ⛔ לא «אחר כך».
 *
 * ⛔ אין `<ActionBar>`: המסלול בתוך `(tabs)`, ולכן הוא כבר נושא את סרגל הלשוניות (D-028).
 */

const HEADING_HE = 'הגדרות';
const LEVEL_HEADING_HE = 'שינוי רמה';
/**
 * ⚠️ **הפריט הישן מקבל את שמו הנכון** (T-211ⓓ): הוא ⛔ אינו שינוי רמה ו⛔ מפסיק להיקרא כך.
 */
const SCAN_TITLE_HE = 'סריקת רמה';
const SCAN_BODY_HE = 'לסמן מה שאתה כבר יודע';

type SummaryResponse =
  | ({ readonly ok: true; readonly levels?: readonly LevelSummary[] } & LevelSummary)
  | { readonly ok: true; readonly level: null }
  | { readonly ok: false; readonly code: string };

type LevelState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly current: CefrBand | null; readonly levels: readonly LevelSummary[] }
  | { readonly kind: 'failed'; readonly code: 'schema_missing' | 'session_expired' | 'unavailable' };


/** ⛔ שני משפטים לשני אירועים שונים — אותו כלל של `<LevelMapScreen>` (T-056). */
function failureText(code: string): string {
  if (code === 'schema_missing') return SCHEMA_MISSING_HE;
  if (code === 'session_expired') return SESSION_EXPIRED_HE;
  return FAILURE_HE.load;
}

export default function SettingsPage() {
  const [state, setState] = useState<LevelState>({ kind: 'loading' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<SummaryResponse>('/api/levels/summary');
      if (!body.ok) {
        const code =
          body.code === 'schema_missing' || body.code === 'session_expired' ? body.code : 'unavailable';
        setState({ kind: 'failed', code });
        return;
      }
      // ⛔ אין נפילה שקטה ל-A1: «טרם בחר» הוא תשובה, ⛔ לא חוסר (D-037).
      if (body.level === null) {
        setState({ kind: 'ready', current: null, levels: [] });
        return;
      }
      setState({ kind: 'ready', current: body.level, levels: body.levels ?? [] });
    } catch {
      setState({ kind: 'failed', code: 'unavailable' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const choose = useCallback(
    async (level: CefrBand) => {
      setSaving(true);
      try {
        const body = await apiPost<{ ok: boolean }>('/api/levels/current', { level });
        if (body.ok) await load();
        else setState({ kind: 'failed', code: 'unavailable' });
      } catch {
        setState({ kind: 'failed', code: 'unavailable' });
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">{HEADING_HE}</h1>

      <section aria-busy={state.kind === 'loading'} className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">{LEVEL_HEADING_HE}</h2>

        {state.kind === 'failed' ? (
          // T-124 · D-065: כל ענף כשל נושא יציאה. ⛔ אין כאן `data-primary-action` —
          // הקישור לסריקה למטה מרונדר ללא תנאי ונושא אותו, ו-`check:mobile` סופר אחד.
          <div className="flex flex-col gap-3">
            <p className="text-lg">{failureText(state.code)}</p>
            {isRetryable(state.code) ? (
              <button
                type="button"
                onClick={() => void load()}
                className="flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-ink active:opacity-90"
              >
                {RETRY_HE}
              </button>
            ) : null}
            {/* ⛔ `<a>` ולא `<Link>`: כשהסשן מת הבקשה הבאה חייבת להגיע לשרת. */}
            <a
              href={failureExit(state.code).href}
              className="flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
            >
              {failureExit(state.code).labelHe}
            </a>
          </div>
        ) : (
          /* ⛔ **כל שש הרמות פתוחות תמיד.** ‏`<LevelPath>` משבית אך ורק רמה **שאין בה
             מילים במאגר**, ומציג אותה **עם המספר 0** ⛔ ולא מסתיר. ⛔ אין כאן סף,
             ⛔ אין דיאלוג אישור, ו⛔ אין שער (D-037 · R-017 · T-211ⓑⓒ). */
          <LevelPath
            levels={state.kind === 'ready' ? state.levels : []}
            current={state.kind === 'ready' ? state.current : null}
            onChoose={(band) => void choose(band)}
            busy={saving}
          />
        )}
      </section>

      {/* ⚠️ **הערך השני, ומתויג נכון** (T-211ⓓ). הוא ⛔ אינו שינוי רמה — הוא סימון של
          מה שהלומד כבר יודע — ומפסיק להיקרא «שינוי רמה». */}
      <Link
        href={LEVEL_SCAN_HREF}
        data-primary-action="true"
        className="flex min-h-touch flex-col items-start gap-1 rounded-2xl border border-border-strong bg-surface-raised px-5 py-4 text-start active:opacity-90"
      >
        <span className="text-lg font-semibold text-ink">{SCAN_TITLE_HE}</span>
        <span className="text-sm text-ink-muted">{SCAN_BODY_HE}</span>
      </Link>
    </section>
  );
}
