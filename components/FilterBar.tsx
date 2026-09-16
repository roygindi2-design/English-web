import UnknownMarkIcon from '@/components/UnknownMarkIcon';
import {
  counterCells,
  filterProgress,
  type CounterKey,
  type LevelSummaryLike,
} from '@/lib/core/filterProgress';

/**
 * הפס המקוטע ושלושת המונים — `36 § 5` שורות 2–3, T-210ⓑⓒ · D-123.
 *
 * 🎯 **הרנדר: `docs/design/kol-A-02-deck.png`**, נלקח מ-`render_video_A.py`
 * ‏(`screen_deck` שורות 270–286 ו-`stat_tile` שורות 245–252) ⛔ ולא מהעין:
 * ‏`התקדמות ברמה` בימין · `86 / 400 סוננו` בשמאל · מסילה ב-`--border-subtle` שמתמלאת
 * **מימין לשמאל** ‏(`c.rr(bx + bw_ - kw, …)`) — `--success` ואז `--danger` — ומתחתיה
 * שלושה תאים מוגבהים, כל אחד **אייקון + מספר + תווית עברית**.
 *
 * ⛔ **צבע ⛔ אינו הערוץ היחיד** (`36 § 12.7` · חוקה שכבה A): לכל מקטע בפס יש תא תואם
 * מתחתיו עם **מספר ותווית**, ולכל תא יש **אייקון בצורה שונה** (✓ · ✕ · טבעת) ⛔ ולא רק
 * גוון. לומד דויטרנופי מקבל בדיוק את אותו מידע.
 *
 * ⛔ **הקובץ ⛔ אינו סופר.** האריתמטיקה כולה ב-`lib/core/filterProgress.ts`, שנשען על
 * `levelSummary.ts` — ⛔ ואין הגדרה שנייה (§ 4.2ז).
 *
 * ⛔ **`null` ⛔ אינו `0`.** סיכום חסר מצייר מסילה ריקה ושלושה «—», ⛔ ולא שלושה אפסים:
 * קריאה שנכשלה ורמה ריקה נראות זהות ורק אחת מהן נכונה.
 */

const HEADING_HE = 'התקדמות ברמה';
/** ⛔ לא `0`. מספר שאין לנו אינו מספר אפס — הכלל של `<DeckSelector>` ושל `<MeScreen>`. */
const NO_NUMBER_HE = '—';

/** ✓ · ✕ · טבעת. SVG מוטבע, ⛔ ולא אמוג׳י (חוקה שכבה A · § 6). */
function CounterIcon({ kind }: { readonly kind: CounterKey }) {
  const common = {
    'aria-hidden': true as const,
    viewBox: '0 0 16 16',
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
  };
  if (kind === 'known') return <svg {...common}><path d="M3 8.5 6.5 12 13 4.5" /></svg>;
  // `T-388` — ⛔ **הסימן הזה ⛔ אינו מצויר כאן עוד.** «לא ידעתי» קיבל קורא שני
  // (אריח «חזרה» ב-`<DeckSelector>`), ⇒ ה-`path` עבר ל-`<UnknownMarkIcon>` ו⛔ אין לו
  // שני עותקים. ⛔ `common` נשאר לשני האחרים, שעדיין יחידים.
  if (kind === 'unknown') return <UnknownMarkIcon />;
  return <svg {...common}><circle cx="8" cy="8" r="5" /></svg>;
}

const TONE: Readonly<Record<CounterKey, string>> = {
  known: 'text-success',
  unknown: 'text-danger',
  unfiltered: 'text-brand-surface',
};

export default function FilterBar({
  summary,
}: {
  readonly summary: LevelSummaryLike | null;
}): React.JSX.Element {
  const bar = summary === null ? null : filterProgress(summary);
  const cells = counterCells(summary);

  return (
    <section className="flex flex-col gap-3" data-filter-bar>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{HEADING_HE}</h2>
        <span className="text-sm text-ink-muted">{bar === null ? NO_NUMBER_HE : bar.labelHe}</span>
      </div>

      {/* המסילה. ⚠️ **`flex` רגיל, ⛔ ולא `flex-row-reverse`**, וזו מדידה (`T-337`,
          המשך של `F-236`): במיכל RTL `flex-direction: row` **כבר** מניח את הילד
          הראשון בימין ⇒ `flex-row-reverse` הופך זאת **פעם שנייה** ומחזיר ל-LTR.
          נמדד חי ב-375px לפני התיקון: מקטע `--success` ישב `x=24→74`, כלומר צמוד
          לקצה ה**שמאלי**, בעוד `docs/design/render_video_A.py:287`
          (`c.rr(bx + bw_ - kw, …)`, ההערה `# RTL: fills right→left`) נועץ אותו
          בקצה ה**ימני**. ⛔ ואין `dir` מקומי — המסמך כולו RTL, וכיוון מקומי היה
          הגדרה שנייה. הרוחב הוא `flex-basis` באחוזים, ולכן שלושת המקטעים תמיד
          מסתכמים למסילה אחת מלאה. */}
      <div
        className="flex h-3.5 overflow-hidden rounded-full bg-border-subtle"
        data-filter-track
      >
        {bar !== null && (
          <>
            <span className="block bg-success" style={{ flexBasis: `${bar.knownPct}%` }} />
            <span className="block bg-danger" style={{ flexBasis: `${bar.unknownPct}%` }} />
          </>
        )}
      </div>

      <ul className="grid list-none grid-cols-3 gap-2.5 p-0">
        {cells.map((cell) => (
          <li key={cell.key}>
            <div
              data-counter={cell.key}
              className="flex flex-col items-center gap-1 rounded-2xl border border-border-subtle bg-surface-raised px-2 py-3"
            >
              <span className={TONE[cell.key]}>
                <CounterIcon kind={cell.key} />
              </span>
              <span className={`text-2xl font-bold leading-none ${TONE[cell.key]}`}>
                {cell.value === null ? NO_NUMBER_HE : cell.value}
              </span>
              <span className="text-xs text-ink-muted">{cell.labelHe}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
