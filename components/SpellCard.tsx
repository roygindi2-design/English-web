'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { cardLift, resolveGesture } from '@/lib/core/arenaGesture';
import { pushSample, releaseCurve, releaseVelocity, type PointerSample } from '@/lib/core/spring';

/**
 * T-178 · `37-arena-spec § 5` — **קלף לחש אחד.**
 * 🎯 הרנדר: `docs/design/kol-B-03-battle.png` · `docs/design/render_video_B.py:255-284`
 * (`spell_card`). ⛔ המבנה **וגם הגימור** מחייבים (`36 § 14.4`); שכבה א׳ היא ההחרגה
 * היחידה, והיא מנוצלת **פעם אחת** כאן — הרוחב, ראה למטה.
 *
 * ⛔ **מצייר ו⛔ אינו מחשב.** מהי המחווה — `lib/core/arenaGesture.ts`. מה היא עושה —
 * `lib/core/battle.ts`. הקלף ⛔ אינו יודע מהי תשובה נכונה, ו⛔ אינו נוגע בקרב.
 *
 * ⚠️ **שני מסלולים, ו-`§ 5` קורא לאחד מהם «נוסף» ⛔ ולא «במקום»:**
 *   • **גרירה** מעלה מעל הסף ⇒ `onCast`.
 *   • **הקשה** ⇒ `onSelect` בלבד — הירי הוא הקשה על היריב (`§ 5`, מסלול הנגישות).
 * ⇒ ⚠️ **הקשה בודדת על קלף ⛔ אינה מטילה עוד**, וזה שינוי מדוד מול פרוסה A. הגילוי
 * שהמפרט נותן הוא **יד הרפאים בקרב הראשון בלבד** (`§ 5`), והיא נבנית ב-`ArenaBattle`.
 *
 * ⚠️ **סטייה מוצהרת מהרנדר, ושכבה א׳ גוברת (`36 § 14.4`):** הרנדר קובע רוחב קלף
 * **קבוע** של 76px (`CARD_W = 76`). ‏`4 × 76 + 2 × 16 = 336 > 320` ⇒ **16 פיקסלים של
 * גלילה אופקית ב-320px**, ששכבה א׳ אוסרת מפורשות. ⇒ הרוחב **נוזלי** (`grid-cols-4`
 * בהורה, `w-full` כאן), ו**הגובה בלבד** לוקח את 100px של הרנדר. ⛔ לא טעם — חשבון.
 */
export interface SpellCardProps {
  readonly label: string;
  readonly unknown: boolean;
  readonly selected: boolean;
  readonly reducedMotion: boolean;
  readonly onSelect: () => void;
  readonly onCast: () => void;
}

const UNKNOWN_SPELL_HE = 'לחש לא מזוהה';
const SELECTED_HE = 'נבחר';

export default function SpellCard({
  label, unknown, selected, reducedMotion, onSelect, onCast,
}: SpellCardProps): React.JSX.Element {
  // ⛔ ref ו⛔ לא state: נקודת ההתחלה ⛔ אינה משנה פיקסל על המסך. אותו נימוק בדיוק
  // שנרשם ב-`components/Flashcard.tsx:55-61`.
  const from = useRef<{ x: number; y: number } | null>(null);
  const samples = useRef<readonly PointerSample[]>([]);
  const [drag, setDrag] = useState<{ y: number; lift: number; releaseMs: number | null; releaseEase: string }>({
    y: 0,
    lift: 0,
    releaseMs: null,
    releaseEase: 'ease-out',
  });
  const supportsSpringEasing =
    typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');
  /* T-243 · 35 § ב6 — the release is the spring (`lib/core/spring.ts`), rendered by the
     browser through the two custom properties `globals.css` `[data-arena-card]` consumes.
     ⛔ No clock here (`SpellCard.test.ts:23`): the curve is a STRING, the duration a NUMBER,
     both computed once at `pointerup`. Unsupported `linear()` ⇒ the properties are not
     written and the CSS defaults (200ms ease-out) stand. */
  const style: CSSProperties & Record<'--kol-release-ms' | '--kol-release-ease', string | undefined> = {
    transform: `translateY(${drag.y}px)`,
    touchAction: 'pan-y',
    '--kol-release-ms': supportsSpringEasing && drag.releaseMs !== null ? `${drag.releaseMs}ms` : undefined,
    '--kol-release-ease': supportsSpringEasing && drag.releaseMs !== null ? drag.releaseEase : undefined,
  };

  return (
    <button
      type="button"
      data-arena-card
      aria-pressed={selected}
      // ⛔ `touch-action: pan-y` — האצבע עדיין גוללת את המסך אנכית, והגרירה שלנו היא
      // ⛔ לא חטיפה של הגלילה. הכיוון שלנו הוא מעלה, ולכן הדפדפן והמחווה חולקים ציר;
      // ⚠️ **הגלילה נבדקת בהליכה החיה** ⛔ ולא מונחת.
      style={style}
      data-arena-lift={drag.lift >= 1 ? 'ready' : drag.lift > 0 ? 'dragging' : 'rest'}
      className={[
        // ⛔ `min-h-touch` **וגם** `h-[100px]`, ⛔ ולא שני `min-h-*`: שתי מחלקות
        // מאותה תכונה נחתכות לפי סדר ה-CSS ⛔ ולא לפי כוונה. ה-100px הוא הרנדר,
        // ורצפת 44px של שכבה א׳ היא זו ששורדת אם הרנדר יקטן אי-פעם.
        // ⟦15/09 · `C-0622` · `F-260`⟧ **76px ב-320×568, 100px מ-375 ומעלה.**
        // 🔬 נמדד: אחרי שהקרב נכנס למסך, ב-320×568 נותרו 484px שימושיים והקלפים
        // בני 100px עדיין חרגו ב-24px. ⛔ `min-h-touch` (44px) ⛔ לא זז — 76px הם
        // הרבה מעליו, ⇒ יעד המגע ⛔ לא רוכך ולו בפיקסל.
        'relative flex min-h-touch h-[76px] w-full flex-col items-center justify-center gap-1 min-[375px]:h-[100px]',
        'rounded-xl border-2 px-1 py-4 text-sm font-bold active:opacity-90',
        // F-149ⓐ — המילוי הוא הרנדר עצמו: `render_video_B.py:265` ממלא `(24, 33, 56)`.
        // ⛔ `--arena-stone-dark` (`#34323f`) היה אפור־אבן במקום כחול־ליל — פער גוון,
        // ⛔ ולא ניואנס. ⚠️ הטוקן ⛔ אינו נכנס ל-`palette.ts` (אינווריאנט `37 § 13.5`).
        'bg-[color:var(--arena-card)]',
        // ⛔ `text-*` נושא **גם** את `currentColor` של המעוין — ולכן צבע המסגרת וצבע
        // הסימן ⛔ אינם יכולים להיפרד. שני מקומות לצבע אחד סוטים בשלישי.
        // T-214 · F-156 — הגבול הלא־נבחר נמדד **1.80:1** מול המילוי (`--arena-stone`
        // על `--arena-card`), מתחת לרצפת 3:1 של שכבה א׳ לגבול משמעותי. ⛔ `--arena-stone`
        // ⛔ אינו מוגה — F-156 מדד שהוא מצייר מסגרות אחרות בזירה — ולכן הקלף לוקח
        // `--arena-card-edge`: **7.36:1** מול המילוי, **6.88:1** מול הבמה.
        // ⚠️ הנבחר ⛔ לא נגע: `--arena-gold` על המילוי הוא **7.29:1**.
        selected
          ? 'border-[color:var(--arena-gold)] text-[color:var(--arena-gold)]'
          : 'border-[color:var(--arena-card-edge)] text-[color:var(--arena-card-edge)]',
      ].join(' ')}
      onPointerDown={(e) => {
        from.current = { x: e.clientX, y: e.clientY };
        samples.current = [{ x: e.clientY, tMs: e.timeStamp }];
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (from.current === null) return;
        // The sample's `x` carries clientY on purpose — this card moves on Y, and
        // `releaseVelocity` is axis-agnostic.
        samples.current = pushSample(samples.current, { x: e.clientY, tMs: e.timeStamp });
        const lift = cardLift({ startY: from.current.y, currentY: e.clientY, reducedMotion });
        setDrag((d) => ({ ...d, y: lift.y, lift: lift.lift, releaseMs: null }));
      }}
      onPointerUp={(e) => {
        const start = from.current;
        from.current = null;
        // T-243 — the release carries the finger's velocity into a critically damped spring;
        // the settle time EMERGES (measured 355ms for 100px at rest), it is ⛔ not a duration.
        const curve = releaseCurve({
          from: drag.y,
          velocity: releaseVelocity(samples.current),
          target: 0,
          reducedMotion,
        });
        samples.current = [];
        setDrag({ y: 0, lift: 0, releaseMs: curve.ms, releaseEase: curve.easing });
        if (start === null) return;
        const gesture = resolveGesture({
          source: 'card',
          startX: start.x, startY: start.y,
          endX: e.clientX, endY: e.clientY,
          viewportWidth: window.innerWidth,
        });
        // ⛔ הכרעה אחת: גרירה מוכרת ⇒ הטלה; כל השאר ⇒ הקשה, כלומר **בחירה**.
        if (gesture?.kind === 'cast') onCast();
        else onSelect();
      }}
      onPointerCancel={() => {
        from.current = null;
        samples.current = [];
        setDrag({ y: 0, lift: 0, releaseMs: null, releaseEase: 'ease-out' });
      }}
    >
      {/* ⛔ **גימור הרנדר, ⛔ ולא קישוט** (`36 § 14.4`): `render_video_B.py:267` מצייר
          קו־שיער פנימי — `rr(pad+3, pad+3, W-6, H-6, r=9, לבן 28%, 1px)`.
          ⚠️ **רדיוס 9 ⛔ אינו אחד מחמשת הערכים** של שכבה ב׳ (6·8·12·16·מלא) ⇒ נלקח
          `lg` = **8**, הקרוב בסולם. סטייה של פיקסל אחד, ⛔ מוצהרת ⛔ ולא שקטה. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rounded-lg border border-white/25"
      />
      {/* `render_video_B.py:268-270` — מעוין בראש הקלף, חצי־גובה 5px, ממורכז ב-`pad+10`.
          ⛔ SVG ⛔ ולא אמוג׳י (שכבה א׳). ⛔ הצבע הוא צבע המסגרת — צבע היסוד (`ELEM_COL`)
          הוא **T-153** ו⛔ אינו בתחולה, ומיפוי שהומצא כאן היה תוכן לימודי מומצא. */}
      <svg
        aria-hidden
        viewBox="0 0 10 10"
        className="pointer-events-none absolute top-[5px] h-[10px] w-[10px]"
      >
        <polygon points="5,0 10,5 5,10 0,5" fill="currentColor" />
      </svg>
      {/* ⚠️ **שכבה א׳, ובמספר:** `--ink` מתחלף ב-`globals.css` לפי `prefers-color-scheme`
          ו-`[data-arena-scope]` ⛔ אינו דורס אותו ⇒ בסכימה **בהירה** הוא `#0f172a`,
          והתווית נמדדה **1.42:1** על המילוי הישן ו-**1.12:1** על מילוי הרנדר. ⛔ אי אפשר
          היה להחליף מילוי בלבד. הדיו נלקח **גם הוא מהרנדר** (`:277` ⇒ 15.61:1), ⛔ ולא
          נבחר, והוא scoped לזירה ⛔ ולא טוקן מוצר חדש. */}
      <span className="text-[color:var(--arena-ink)]">{unknown ? '?' : label}</span>
      {/* ⛔ סימן לבדו הוא קידוד בערוץ אחד ומפר את שכבה א׳ א2 — התווית ⛔ אינה אופציונלית. */}
      {unknown && (
        /* `:248` — `ELEM_COL['unknown']` = `(168, 176, 196)` ⇒ **7.36:1** על המילוי. */
        <span className="text-xs font-normal text-[color:var(--arena-ink-dim)]">
          {UNKNOWN_SPELL_HE}
        </span>
      )}
      {/* ⛔ הבחירה ⛔ אינה צבע בלבד (א2): `aria-pressed` למקריא־מסך, והשורה הזאת לעין. */}
      {selected && <span className="text-xs font-normal text-[color:var(--arena-gold-light)]">{SELECTED_HE}</span>}
    </button>
  );
}
