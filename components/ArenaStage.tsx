import ArenaAvatar from '@/components/ArenaAvatar';
import type { StagePhase } from '@/lib/core/battle';

/**
 * הבמה — T-117 · D-060 · חוקה § 5.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב**: התנוחה מגיעה מ-`stagePhase()` שב-`lib/core`.
 * ⛔ **אין כאן JS של תנועה** — אין `setTimeout` ואין `requestAnimationFrame`.
 * המעבר הוא כלל CSS יחיד לכל תנוחה, ‏`prefers-reduced-motion` מבטל אותו גלובלית
 * ב-`app/globals.css` ⛔ בלי ולו `if` אחד כאן.
 * ⛔ **אין לולאת המתנה** — `ARENA_IDLE_LOOP` כבוי עד אישור (‏`03-for-roy` פריט 39).
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
}

const STAGE_CLASS = 'flex flex-row items-end justify-between gap-4';
const FIGURE_CLASS = 'h-24 w-24';

export default function ArenaStage({ phase, items }: ArenaStageProps): React.JSX.Element {
  return (
    <div data-arena-stage data-arena-phase={phase} className={STAGE_CLASS}>
      <ArenaAvatar role="hero" items={items} className={FIGURE_CLASS} />
      <ArenaAvatar role="enemy" items={[]} className={FIGURE_CLASS} />
    </div>
  );
}
