'use client';

import { useRef, useState } from 'react';
import { cardLift, resolveGesture } from '@/lib/core/arenaGesture';

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
  const [drag, setDrag] = useState({ y: 0, lift: 0 });

  return (
    <button
      type="button"
      data-arena-card
      aria-pressed={selected}
      // ⛔ `touch-action: pan-y` — האצבע עדיין גוללת את המסך אנכית, והגרירה שלנו היא
      // ⛔ לא חטיפה של הגלילה. הכיוון שלנו הוא מעלה, ולכן הדפדפן והמחווה חולקים ציר;
      // ⚠️ **הגלילה נבדקת בהליכה החיה** ⛔ ולא מונחת.
      style={{ transform: `translateY(${drag.y}px)`, touchAction: 'pan-y' }}
      data-arena-lift={drag.lift >= 1 ? 'ready' : drag.lift > 0 ? 'dragging' : 'rest'}
      className={[
        // ⛔ `min-h-touch` **וגם** `h-[100px]`, ⛔ ולא שני `min-h-*`: שתי מחלקות
        // מאותה תכונה נחתכות לפי סדר ה-CSS ⛔ ולא לפי כוונה. ה-100px הוא הרנדר,
        // ורצפת 44px של שכבה א׳ היא זו ששורדת אם הרנדר יקטן אי-פעם.
        'flex min-h-touch h-[100px] w-full flex-col items-center justify-center gap-1',
        'rounded-xl border-2 px-1 py-4 text-sm font-bold text-ink active:opacity-90',
        'bg-[color:var(--arena-stone-dark)]',
        selected
          ? 'border-[color:var(--arena-gold)]'
          : 'border-[color:var(--arena-stone)]',
      ].join(' ')}
      onPointerDown={(e) => {
        from.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (from.current === null) return;
        const lift = cardLift({ startY: from.current.y, currentY: e.clientY, reducedMotion });
        setDrag({ y: lift.y, lift: lift.lift });
      }}
      onPointerUp={(e) => {
        const start = from.current;
        from.current = null;
        setDrag({ y: 0, lift: 0 });
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
      onPointerCancel={() => { from.current = null; setDrag({ y: 0, lift: 0 }); }}
    >
      <span>{unknown ? '?' : label}</span>
      {/* ⛔ סימן לבדו הוא קידוד בערוץ אחד ומפר את שכבה א׳ א2 — התווית ⛔ אינה אופציונלית. */}
      {unknown && <span className="text-xs font-normal text-ink-muted">{UNKNOWN_SPELL_HE}</span>}
      {/* ⛔ הבחירה ⛔ אינה צבע בלבד (א2): `aria-pressed` למקריא־מסך, והשורה הזאת לעין. */}
      {selected && <span className="text-xs font-normal text-[color:var(--arena-gold-light)]">{SELECTED_HE}</span>}
    </button>
  );
}
