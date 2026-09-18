import ArenaBattle, { type ArenaRound } from '@/components/ArenaBattle';
import '../../arcade/arcade-tokens.css';
import type { ArcadeQuestion } from '@/lib/core/arcadeRound';

/**
 * Layout fixture for `check:mobile` — T-095, plan `2026-08-19-arcade-screens.md`.
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/arcade` is itself in the harness's route list, and that is exactly why this file has to
 * exist: `next start` runs with no Supabase env, `GET /api/arcade/round` answers 503 by its
 * own contract, and so every `ok /arcade` line the harness prints describes the FAILURE
 * state — one paragraph and one way out. The word, the four options and the enemy's health
 * meter had never once been rendered at 320/375/414. Same reasoning, one feature over, as
 * `/dev/world` (C-0129), `/dev/deck` (C-0104) and `/dev/tabs/*` (TD-13).
 *
 * ⛔ **This page renders the component and NOTHING else** — no heading, no note line. C-0104:
 * a line of chrome the real route does not have pushes the screen down, and the harness then
 * measures this fixture instead of the component. The «not learning content» declaration
 * therefore lives here in the comment, where it costs no pixels.
 *
 * ⛔ **The strings are not learning content** (R-010 · R-013 — sourced content is forbidden
 * and invented content is forbidden). They are the same non-content `app/dev/world/page.tsx`
 * uses, chosen for LENGTH rather than meaning: what this harness measures is pixels, and the
 * options' job here is to wrap, to hold 44px, and to not scroll sideways at 320px.
 *
 * Fifteen questions and ⛔ not two: `ARCADE_ROUND_SIZE` is 15 (the ammo, D-059), and a 2×2
 * grid that is never filled cannot fail a wrap check.
 *
 * ⚠️ **C-0325 — `<ArenaBoard>` נמחק ו-`<ArenaBattle>` תפס את מקומו** (T-177). ⛔ אותו prop
 * ואותו טיפוס `ArenaRound` בדיוק, ⇒ הפיקסצ׳ר ⛔ לא השתנה. ‏`arcade-tokens.css` נטען גם
 * כאן, כי אחרת הפיקסצ׳ר היה נמדד **בלי** פלטת הזירה — כלומר מסך שאינו המסך.
 */
/**
 * ⚠️ **`kind: 'base'` לכל 15 השאלות — T-219, ו⛔ זו ⛔ אינה פיקסצ׳ר שנבדלת מהייצור.**
 * `base` הוא **בדיוק** מה שהנתיב מחזיר ללומד עם מחסן ריק (`37 § 2` שורה 3), כלומר המסך
 * שרוב הלומדים באמת רואים. ⛔ ולא ערבבתי שלוש קטגוריות: הן ⛔ אינן משנות ולו פיקסל
 * אחד כרגע — הקלף לפי סוג המילה (`T-220` ⓐ) חסום על **F-164** — ⇒ תמהיל היה מכניס
 * שינוי סדר (`mixArenaWords` מסדר מחדש) בלי שום הבדל נמדד, כלומר מסך פחות דטרמיניסטי.
 */
function question(n: number): ArcadeQuestion {
  return {
    wordId: `w${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    // T-220 ⓐ — one `unseen` option per question so `/dev/arcade` shows the «לחש לא מזוהה»
    // card the way production does: a source word without a `word_progress` row.
    options: [
      { he: `אפשרות ${n}`, kind: 'met' },
      { he: `מסיח ${n}א`, kind: 'met' },
      { he: `מסיח ${n}ב`, kind: 'unseen' },
      { he: `מסיח ${n}ג`, kind: 'met' },
    ],
    kind: 'base',
  };
}

const FIXTURE: ArenaRound = {
  level: 'A1',
  questions: [
    question(1),
    question(2),
    question(3),
    question(4),
    question(5),
    question(6),
    question(7),
    question(8),
    question(9),
    question(10),
    question(11),
    question(12),
    question(13),
    question(14),
    question(15),
  ],
};

export default function DevArcadePage() {
  /**
   * 🆕 ⟦`C-0712` · `T-431`⟧ **הפיקסטורה לובשת את הציוד, ⛔ ואינה עומדת עירומה.**
   * 🔬 **הסיבה נמדדה:** עד היום הבמה קיבלה `items={[]}` מקודד קשיח, ולכן כל
   * `diff:render` על `/dev/arcade` וכל ביקורת עיצוב השוו **דמות בלי גלימה ובלי נס**
   * מול רנדר שמצייר דמות מלובשת. ⇒ הפער שנמדד היה פער **ציוד**, ⛔ ולא פער פריסה.
   * ⛔ **ואלה ⛔ אינם פריטים שהומצאו** — ארבעתם מצוירים ב-`ArenaAvatar.tsx`.
   */
  return <ArenaBattle initialRound={FIXTURE} items={['cape', 'banner']} />;
}
