import ArenaAvatar from '@/components/ArenaAvatar';
import { ARENA_IDLE_LOOP } from '@/lib/core/arcadeLadder';
import type { StagePhase } from '@/lib/core/battle';

/**
 * הבמה — T-117 · D-060 · חוקה § 5.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב**: התנוחה מגיעה מ-`stagePhase()` שב-`lib/core`.
 * ⛔ **אין כאן JS של תנועה** — אין `setTimeout` ואין `requestAnimationFrame`.
 * המעבר הוא כלל CSS יחיד לכל תנוחה, ‏`prefers-reduced-motion` מבטל אותו גלובלית
 * ב-`app/globals.css` ⛔ בלי ולו `if` אחד כאן.
 * ⚠️ **T-119 · D-128 — לולאת ההמתנה קיבלה צרכן.** הדגל `ARENA_IDLE_LOOP` היה מוצהר
 * ⛔ בלי ולו קורא אחד, ⇒ האישור של רוי (`03-for-roy` פריט 39) ⛔ לא הזיז פיקסל. הרכיב
 * קורא אותו כברירת מחדל של ה-prop, והתנועה עצמה חיה **כולה ב-CSS** — ⛔ אפס JS.
 * ⛔ **שלוש הגדרות, וכולן נאכפות בבדיקה ⛔ ולא בהערה:** ⓐ הבמה בלבד · ⓑ ≤2px ·
 * ⓒ `prefers-reduced-motion` מכבה לגמרי.
 *
 * ⚠️ **`StagePhase` עבר ל-`lib/core/battle.ts` ב-C-0325**, באותו קומיט שבו נמחק
 * `arcadeBattle.ts`. ⛔ הרכיב ⛔ לא השתנה מעבר לשורת ה-import: הוא נשאר **ציור טהור**
 * ⛔ בלי `useState`, `useEffect` ו-`requestAnimationFrame` — `ArenaStage.test.ts` אוסר
 * את שלושתם, ולכן לולאת הזמן של הקרב חיה ב-`components/ArenaBattle.tsx` ⛔ ולא כאן.
 *
 * ⚠️ **שני אזורים, וזה כל העניין (T-041):** התנועה חיה **אך ורק** כאן. אזור השאלה —
 * המילה וארבע האפשרויות — ⛔ לעולם אינו זז: עקרון הקוהרנטיות של Mayer.
 */
export interface ArenaStageProps {
  readonly phase: StagePhase;
  readonly items: readonly string[];
  /** ⛔ ברירת המחדל היא `ARENA_IDLE_LOOP`. הבמה נשארת **ציור טהור**. */
  readonly idle?: boolean;
}

const STAGE_CLASS = 'flex flex-row items-end justify-between gap-4';
const FIGURE_CLASS = 'h-24 w-24';

export default function ArenaStage({
  phase,
  items,
  idle = ARENA_IDLE_LOOP,
}: ArenaStageProps): React.JSX.Element {
  return (
    <div data-arena-stage data-arena-phase={phase} className={STAGE_CLASS}>
      {/* העוטף נושא את הלולאה — ⛔ ולא הדמות, של-`[data-arena-figure]` כבר יש
          `transition: transform` ש-`hit`/`dodge` מפעילים. */}
      <span data-arena-idle={idle ? 'on' : 'off'} className="inline-flex">
        <ArenaAvatar role="hero" items={items} className={FIGURE_CLASS} />
      </span>
      <ArenaAvatar role="enemy" items={[]} className={FIGURE_CLASS} />
    </div>
  );
}
