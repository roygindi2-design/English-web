import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';
import { CHARACTER_LABELS_HE, type ArenaCharacter } from '@/lib/core/arenaCharacter';
import {
  BELT_SIZE,
  BODY_SIZE,
  CONE,
  HEAD_RADIUS,
  LAYER_ORDER,
  anchorFor,
  mirror,
  type Layer,
} from '@/lib/core/characterBase';

/**
 * הדמות של הזירה — T-096 · § 4.2י · חוקה § 6.
 *
 * ⛔ **אפס נכס מיוצר, אפס CDN, אפס אמוג'י.** התקציב הוא אפס (`BUDGET_NOTE`), ולכן הדמות
 * היא שכבות SVG מוטבעות שנכתבו כאן — ⛔ ולא תמונה שמישהו צריך לייצר, לארח או לשלם עליה.
 * אמוג'י נפסל מאותה סיבה שנפסל ב-`LockIcon`: משקלו וגובהו של גליף מגיעים מהגופן שפותר
 * אותו ⛔ ולא מהקוד, והוא נראה אחרת בשלושת הגופנים של החוקה.
 *
 * ⛔ **אפס hex.** כל שכבה היא `<g className="text-…">` עם `currentColor`, ולכן היא מתחלפת
 * עם ערכת הצבעים בלי ולו ערך צבע אחד בקובץ הזה.
 *
 * ⛔ **אינו רכיב לקוח ואין לו מצב:** ציור בלבד. שדה טקסט חופשי לשם הדמות ⛔ אינו בתחולה
 * (F-067: ל-`arcade_progress` אין עמודת שם ו-`POST /api/arcade/result` אינו כותב אחת ⇒
 * בקרה שאינה נשמרת היא בקרה מזויפת).
 *
 * ⚠️ **T-215 — הדמות נבנתה מחדש על `plan/38-character-base.md`, ⛔ ולא הורחבה.** עד
 * C-0335 היו כאן **ארבע** שכבות (רקע · גוף · ראש · פריטים) מול **אחת־עשרה** ש-`38 § 4`
 * מונה — F-157 ⓑ מדד את הפער, ⛔ ולא שיער אותו, והוא זה שחסם את א4 (`T-216`).
 * ⛔ **הגיאומטריה ⛔ אינה כאן**: כל נקודת עיגון וכל מידה מגיעות מ-`lib/core/characterBase.ts`
 * שהוא טהור ונבדק ביחידה. הרכיב **מצייר** ⛔ ואינו קובע מספר.
 * ⛔ **`38 § 5` — ⛔ אין להעתיק את `wizard_sprite` · `knight_sprite` · `hero_sprite`
 * מ-`render_video_B.py`.** הן מתעדות את הגרסה שנפסלה; הצורות כאן נכתבו על השלד.
 * ⚠️ **הלוח האטום שהיה שכבה 1 ⛔ נמחק, ⛔ ולא נצבע מחדש (סוגר את F-158):** `38 § 4`
 * ⛔ אינו מונה רקע, והלוח נמדד **1.02:1** על כחול־הליל של הזירה — כלומר מלבן שאיש
 * ⛔ אינו רואה, שגם הפך את צללית האימפקט (א2) למלבן ⛔ במקום לדמות.
 *
 * ⚠️ **`ARCADE_ITEMS` הוא המקור היחיד לרשימת הפריטים** (`lib/core/arcadeResult.ts:34`), והמפה
 * מוקלדת מולו — `Record<(typeof ARCADE_ITEMS)[number], …>` ⇒ פריט שישי ⛔ אינו מהדר, ופריט
 * חסר ⛔ אינו מהדר. זה מה שמונע רשימה שנייה שסוטה מהראשונה.
 */

export interface ArenaAvatarProps {
  // פריטים שנפתחו. ⛔ שם שאינו ב-`ARCADE_ITEMS` מדולג בשקט.
  readonly items: readonly string[];
  readonly role: 'hero' | 'enemy';
  /**
   * T-217 · `37 § 7` · `38 § 6` — «שריונאי … נבנית על אותו שלד». `undefined`/`null`
   * ⇒ הציור של היום, ⛔ ללא שינוי. עם דמות ⇒ שכבת חתימה אחת על העוגנים הקיימים.
   */
  readonly character?: ArenaCharacter | null;
  readonly className?: string;
}

type ArcadeItem = (typeof ARCADE_ITEMS)[number];

/**
 * שמות הפריטים בעברית — **מפה אחת בריפו**, ומיוצאת. מסך הסיום מייבא אותה במקום להחזיק
 * עותק שני: שם פריט בשתי צורות הוא בדיוק הפגם ש-`LockIcon` נולד כדי לסגור.
 */
export const ITEM_LABELS_HE: Record<ArcadeItem, string> = {
  helmet: 'קסדה',
  cape: 'גלימה',
  lantern: 'פנס',
  boots: 'מגפיים',
  banner: 'דגל',
};

const ROLE_LABEL_HE: Record<ArenaAvatarProps['role'], string> = {
  hero: 'הדמות שלך',
  enemy: 'היריב',
};

type ArenaRole = ArenaAvatarProps['role'];

/**
 * ⛔ **צבע אחד לדמות, ⛔ ולא ארבעה** — והסיבה **נמדדה, ⛔ ולא שוערה**: `--ink-muted`
 * של `globals.css` בסכימה הבהירה הוא `#475569`, ועל כחול־הליל של הזירה הוא נותן
 * **1.97:1** ⇒ היריב כמעט ⛔ אינו נראה. הערך כאן הוא ברירת המחדל של מסך הסיום
 * (`components/ArenaResult.tsx`, שאינו בסקופ הזירה); `app/arcade/arcade-tokens.css`
 * דורס אותו **בתוך הזירה** בטוקן זירה, ⇒ שני הצרכנים מקבלים דיו קריא ⛔ בלי שהרכיב
 * יידע באיזה מסך הוא. ⛔ **התפקיד ⛔ לעולם אינו מקודד בצבע בלבד** — השם הנגיש
 * (`הדמות שלך` / `היריב`) נושא את אותה הבחנה (חוקה § 1 · שכבה א׳ א2).
 */
const ROLE_INK: Record<ArenaRole, string> = {
  hero: 'text-brand',
  enemy: 'text-ink-muted',
};

/**
 * ⛔ **הקו של הציוד, ⛔ ולא צבע שני של הדמות.** הבסיס ממולא ב-`currentColor` של התפקיד,
 * והציוד מצויר כקו מעליו — קו באותו גוון היה נעלם. מחוץ לזירה זהו `--ink`; בתוך הזירה
 * ‏`app/arcade/arcade-tokens.css` דורס אותו לכחול־הליל, שנותן 10.66:1 מול הזהב.
 */
const OUTLINE_CLASS = 'text-ink';

/**
 * 🎨 **⟦18/09 · `C-0720`⟧ שלושה גוונים, **נגזרים מ-`currentColor`**, ⛔ ולא שלושה צבעים.**
 *
 * 🔬 **הבעיה שנמדדה לפני שנגעתי בשורה:** הדמות הייתה **צללית שטוחה** — גוון אחד לכל
 * הגוף — ולכן היא נראתה כמו כתם ולא כדמות. ⛔ **והסיבה ⛔ אינה עצלות:** השער החי
 * ‏(`verify-mobile.mjs` — «`button svg *` מול הרקע, ≥ 3:1») מודד כל צורה מעל 100px²
 * בתוך כפתור, ובמסך בחירת הדמות הדמות **יושבת בתוך `<button>`** על `--arena-card`.
 * ⇒ נמדד: `--arena-stone` נותן **1.80:1** ו-`--arena-night` **1.07:1** ⇒ **כל גוון
 * ביניים כהה נופל.** לכן מי שניסה להוסיף עומק בעבר יכול היה רק להאיר או לוותר.
 *
 * ⇒ **הפתרון הוא יחסי, ⛔ ולא מוחלט:** הגוונים נגזרים מ-`currentColor` ב-`color-mix`,
 * ⇒ **אותן צורות בדיוק** נותנות לגיבור זהב ולקוסם סגול, והערוץ שמבדיל בין התפקידים
 * (שכבה א׳ א2) ⛔ לא נגע. 🔬 **וכל ארבעת המצבים נמדדו מול הכרטיס:**
 * ```
 * גיבור  lit 13.06:1 · base 11.29:1 · deep 6.81:1
 * קוסם   lit  9.30:1 · base  6.08:1 · deep 3.84:1   ⟵ הגרוע ביותר, ועדיין מעל 3
 * ```
 * ⛔ **אפס hex** (כלל הקובץ) ו⛔ אפס טוקן חדש — זו פונקציה של הצבע שכבר שם.
 */
const TONE = {
  lit: 'text-[color:color-mix(in_srgb,currentColor_58%,white)]',
  /** 🔬 `C-0722` — גוון שלישי נדרש **אחרי** שנמדד: החגורה והרגליים היו שתיהן
   *  `deep` ⇒ הן **נמסו זו לזו** והחגורה נעלמה. ברנדר הן בשני גוונים שונים. */
  mid: 'text-[color:color-mix(in_srgb,currentColor_88%,black)]',
  deep: 'text-[color:color-mix(in_srgb,currentColor_70%,black)]',
} as const;

/** ⛔ `fill="currentColor"` **חוזר** כאן: ה-`g` הפנימי משנה `color`, והמילוי נגזר ממנו. */
function Tone({ tone, children }: {
  readonly tone: keyof typeof TONE;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return <g className={TONE[tone]} fill="currentColor">{children}</g>;
}

/* ── השלד. ⛔ כל מספר מגיע מ-`lib/core/characterBase.ts`, שמצטט את `38 § 3`. ── */
const HEAD = anchorFor('head');
const SHOULDER_R = anchorFor('shoulders');
const SHOULDER_L = mirror(SHOULDER_R);
const BODY = anchorFor('body');
const BELT = anchorFor('belt');
const MAIN_HAND = anchorFor('mainHand');
const OFF_HAND = anchorFor('offHand');
const BOOT_R = anchorFor('legs');
const BOOT_L = mirror(BOOT_R);

/**
 * ⛔ **ה-`viewBox` נגזר מהעוגנים ⛔ ואינו נבחר**: הקצוות הן ראש (`y = -62 - 34`),
 * מגף (`y = 112`), יד משנית (`x = -70`) ויד ראשית (`x = 66`), ועוד שוליים לרוחב הפריט
 * שיושב על כל אחת מהן. ⛔ יחס הגובה-רוחב ⛔ אינו משנה פריסה: שני הצרכנים נותנים ל-`svg`
 * מידה מפורשת (`h-24 w-24` בבמה · `h-40 w-auto` כברירת מחדל).
 */
const VIEW_BOX = '-100 -108 200 252';

/**
 * ⛔ **שכבת בסיס ⛔ אינה שכבת ציוד.** `38 § 4` מונה אחת־עשרה שכבות **רנדור**, וחלקן
 * ריקות עד שפריט נכנס אליהן (`chest` · `headgear` · `shoulders` · `capeBack`). מה
 * שמצויר כאן הוא הדמות **בלי ציוד** — גוף, ראש, שיער, רגליים, כפות ידיים.
 * ⚠️ ‏`data-arena-part` על השיער ועל הגלימה ועל הנשק הוא ה**וו** של א4 (`T-216`),
 * ⛔ ולא קישוט: א4 נוקבת בשלושתם בשמם, ובלי סימון היא הייתה נאלצת לנחש שכבה.
 */
const BASE_LAYERS: Partial<Record<Layer, React.JSX.Element>> = {
  /**
   * 🎨 **⟦19/09 · `C-0722`⟧ הצללית **נמדדה מהרנדר**, ⛔ ולא נוחשה.**
   * ‏`docs/design/kol-B-03-battle.png` פורק לפי צבעים שטוחים והומר ליחידות השלד
   * ‏(עיגון על מרכז הראש ועל קו הרגליים, `s = 0.928`). ⇒ **לוחם רחב ונמוך**:
   * גוף `90×86`, רגליים קצרות, ראש `r30`. מה שהיה כאן תיאר דמות **צרה וגבוהה**,
   * וזה בדיוק מה שרוי קרא לו «נראה גרוע».
   * ⛔ **ו⛔ אין כאן מגפיים** — הרנדר מצייר שתי רגליים כהות **עד הסוף**, ⛔ בלי
   * מגף נפרד. שכבה ריקה ⛔ אינה מצוירת (`38 § 4`).
   */
  legs: (
    <Tone tone="mid">
      <rect x={BOOT_L.x - 17} y={BELT.y - 15} width={34} height={BOOT_L.y - BELT.y + 15} rx={10} />
      <rect x={BOOT_R.x - 17} y={BELT.y - 15} width={34} height={BOOT_R.y - BELT.y + 15} rx={10} />
    </Tone>
  ),
  body: (
    <rect
      x={BODY.x - BODY_SIZE.width / 2}
      y={BODY.y - BODY_SIZE.height / 2}
      width={BODY_SIZE.width}
      height={BODY_SIZE.height}
      rx={16}
    />
  ),
  /**
   * ⛔ **קו אמצע, ⛔ ולא לוח חזה.** 🔬 הרנדר מצייר על הגוף **קו אנכי דק** בלבד —
   * לוח בהיר היה המצאה שלי, והוא זה שהפך את הגוף ל«סינר».
   */
  chest: (
    <Tone tone="deep">
      <rect x={BODY.x - 2} y={BODY.y - BODY_SIZE.height / 2 + 10} width={4} height={BODY_SIZE.height - 22} rx={2} />
    </Tone>
  ),
  belt: (
    <Tone tone="deep">
      <rect
        x={BELT.x - BELT_SIZE.width / 2}
        y={BELT.y - BELT_SIZE.height / 2}
        width={BELT_SIZE.width}
        height={BELT_SIZE.height}
        rx={4}
      />
    </Tone>
  ),
  offHand: <Tone tone="lit"><circle cx={OFF_HAND.x} cy={OFF_HAND.y} r={11} /></Tone>,
  head: (
    <>
      {/* 💇 השיער — ברנדר זהו **מסרק של קוצות** מעל הראש, `-108..-82` ביחידות השלד.
          🔬 הקצה הגבוה יושב על `-104`: ה-`viewBox` מתחיל ב-`-108`, והגולה הזהובה
          שהרנדר מניח מעליו (`-118`) ⛔ **אינה נכנסת** ⇒ ⛔ לא צוירה, ⛔ ולא הוזזה. */}
      <Tone tone="deep">
        <path
          data-arena-part="hair"
          d={`M${HEAD.x - 31} ${HEAD.y - 22}l4 -22 7 14 6 -20 6 18 7 -16 5 26z`}
        />
      </Tone>
      <Tone tone="lit"><circle cx={HEAD.x} cy={HEAD.y} r={HEAD_RADIUS} /></Tone>
    </>
  ),
  /** 🎽 כתפיות — **עיגולים על העוגן**, בדיוק כמו ברנדר (`r24` על `±46,-13`). */
  shoulders: (
    <Tone tone="lit">
      <circle cx={SHOULDER_R.x} cy={SHOULDER_R.y} r={24} />
      <circle cx={SHOULDER_L.x} cy={SHOULDER_L.y} r={24} />
    </Tone>
  ),
  mainHand: <Tone tone="lit"><circle cx={MAIN_HAND.x} cy={MAIN_HAND.y} r={11} /></Tone>,
};

/**
 * 🧙 **⟦19/09 · `C-0722`⟧ דמות שהצללית שלה **מחליפה** את הגוף, ⛔ ולא מלבישה אותו.**
 *
 * 🔬 **נמדד מהרנדר, ⛔ ולא הוחלט:** הקוסם ב-`kol-B-03-battle.png` הוא **חרוט אחד**
 * מקצה הכובע (`y -100`) ועד השוליים (`y 112`, ±77) — ⛔ **אין לו ראש עגול, ⛔ אין
 * כתפיות, ⛔ אין חגורה ו⛔ אין רגליים.** פניו הן **דיסק כהה על החרוט**, ⛔ ולא ראש.
 * ⇒ לצייר עליו את שכבות הבסיס פירושו לצייר דמות אחרת ואז להסתיר אותה חלקית —
 * וזה בדיוק מה שהיה כאן, וזה מה שנראה שבור.
 *
 * ⛔ **⛔ אינו «שכבה חדשה»** (`38 § 5`): הרשימה מונה שכבות שה-**בסיס** מדלג עליהן
 * כשדמות מספקת אותן בעצמה. ⛔ אף שכבה ⛔ לא נוספה ל-`LAYER_ORDER`.
 */
const CHARACTER_HIDES: Partial<Record<ArenaCharacter, readonly Layer[]>> = {
  wizard: ['legs', 'boots', 'body', 'chest', 'belt', 'shoulders', 'head', 'offHand', 'mainHand'],
};

/**
 * שכבת פריט אחת לכל מפתח. חמישה מפתחות בדיוק — הטיפוס אוכף את זה, ⛔ ופריט שישי
 * ⛔ אינו מהדר. ⚠️ **D-132 — משבצת ופריט הם שתי אוצרות מילים, ⛔ ולא שתי רשימות
 * מתחרות:** `ARCADE_ITEMS` נשארה כפי שהיא, וכל פריט **מצביע** על השכבה שהוא נכנס אליה.
 */
type ItemLayer = { readonly layer: Layer; readonly shape: React.JSX.Element };

const ITEM_LAYERS: Record<(typeof ARCADE_ITEMS)[number], ItemLayer> = {
  helmet: {
    layer: 'headgear',
    shape: (
      <path
        d={`M${HEAD.x - HEAD_RADIUS - 2} ${HEAD.y}a${HEAD_RADIUS + 2} ${HEAD_RADIUS + 2} 0 0 1 ${(HEAD_RADIUS + 2) * 2} 0M${HEAD.x - HEAD_RADIUS - 6} ${HEAD.y}h${(HEAD_RADIUS + 6) * 2}`}
      />
    ),
  },
  cape: {
    layer: 'capeBack',
    shape: (
      <path
        data-arena-part="cape"
        d={`M${SHOULDER_L.x} ${SHOULDER_L.y}L${SHOULDER_L.x - 22} ${BOOT_L.y - 16}h44zM${SHOULDER_R.x} ${SHOULDER_R.y}l22 ${BOOT_R.y - 16 - SHOULDER_R.y}h-44z`}
      />
    ),
  },
  lantern: {
    layer: 'offHand',
    shape: (
      <path
        d={`M${OFF_HAND.x - 11} ${OFF_HAND.y + 4}h22v22h-22zM${OFF_HAND.x} ${OFF_HAND.y + 4}v-14`}
      />
    ),
  },
  boots: {
    layer: 'boots',
    shape: (
      <path
        d={`M${BOOT_L.x - 19} ${BOOT_L.y + 16}h38M${BOOT_R.x - 19} ${BOOT_R.y + 16}h38`}
      />
    ),
  },
  banner: {
    layer: 'mainHand',
    shape: (
      <path
        data-arena-part="weapon"
        d={`M${MAIN_HAND.x} ${MAIN_HAND.y - 70}v${140}M${MAIN_HAND.x} ${MAIN_HAND.y - 70}h30l-8 14 8 14h-30z`}
      />
    ),
  },
};

/**
 * T-217 — **שלוש צלליות על שלד אחד.** לכל דמות של `37 § 7` שכבת חתימה אחת, על שכבות
 * `LAYER_ORDER` (`38 § 4`) ועל עוגני `characterBase.ts` בלבד — ⛔ אפס קואורדינטה מוחלטת.
 * ⛔ **`38 § 5` — ⛔ אף צורה כאן ⛔ אינה `wizard_sprite` · `knight_sprite` · `hero_sprite`.**
 * הקוסם: מטה ביד הראשית וגלימה על הרגליים · הלוחם: מגן עגול ביד המשנית ולוח חזה רחב
 * מהגוף · השריונאי: מצחייה רחבה מהראש, שתי כתפיות (`mirror`) וקנה ביד הראשית.
 * ⚠️ **החתימה היא מילוי בצבע התפקיד, ⛔ ולא קו** — נמדד C-0502 ב-`check:mobile`, ⛔ ולא
 * שוער: במסך הבחירה הדמות יושבת **בתוך `<button>`**, והשער מודד כל צורה נגד רקע
 * הכרטיס (מילוי SVG ⛔ אינו `background-color`): קו ב-`text-ink` (כחול-הליל בזירה) ⇒
 * **1.12:1**. מילוי בצבע התפקיד (זהב הגיבור) ⇒ עובר 3:1 כמו שכבת הבסיס, ולכן כל צורה
 * **בולטת מעבר לקו הגוף** — צללית, ⛔ ולא קישוט על הגוף, שהיה נעלם בזהב על זהב.
 * הצורה ⛔ אינה הערוץ היחיד — השם הנגיש נוקב בדמות (`CHARACTER_LABELS_HE`).
 */
const CHARACTER_LAYERS: Record<ArenaCharacter, readonly ItemLayer[]> = {
  wizard: [
    /**
     * 🧙 **החרוט — הכובע והגלימה הם **צורה אחת**, בדיוק כמו ברנדר.**
     * 🔬 קודקוד `(0,-100)` · שוליים `(±77, 112)`. נמדד מפרופיל השורות של
     * ‏`kol-B-03-battle.png`: `y 73` קודקוד, `y 276` שוליים, רוחב 144.
     */
    {
      layer: 'body',
      shape: (
        <path
          d={`M${BODY.x} ${CONE.apexY}L${BODY.x + CONE.hemHalfWidth} ${BOOT_L.y}H${BODY.x - CONE.hemHalfWidth}z`}
        />
      ),
    },
    /**
     * 🌑 **הפנים — דיסק כהה **על החרוט**, ⛔ ולא ראש.**
     * 🔬 מרכז `(0,-12)` ברנדר, `r35`. ⇒ הן יושבות בשליש העליון של החרוט,
     * ⛔ ולא על עוגן הראש — לקוסם ⛔ אין ראש נפרד.
     */
    {
      layer: 'head',
      shape: (
        <>
          <Tone tone="deep"><circle cx={BODY.x} cy={CONE.faceY} r={CONE.faceRadius} /></Tone>
          {/* 👁️ שתי עיניים זוהרות — ⛔ הערוץ היחיד שהופך צללית לדמות.
              🔬 הרנדר מצייר אותן ורודות-בוהקות על פנים שחורות; כאן הן
              בדיו **הבהיר** של הזירה, וזה מה שמייצר את אותו זוהר. */}
          <g className="text-[color:var(--arena-ink,currentColor)]" fill="currentColor">
            {/* 🔬 ⟦`C-0723`⟧ `data-arena-eye` — **סימון, ⛔ ולא רדיוס.** השער
                ‏(`verify-mobile.mjs` · `C-0719`) אסף «עיגול שרדיוסו ≤6», והמדידה
                מהרנדר קבעה `r8` ⇒ **השער מצא אפס עיניים והאדים**. סף רדיוס הוא
                ניחוש על מבנה; הסימון **הוא** המבנה. */}
            <circle data-arena-eye cx={BODY.x - CONE.eyeX} cy={CONE.eyeY} r={CONE.eyeRadius} />
            <circle data-arena-eye cx={BODY.x + CONE.eyeX} cy={CONE.eyeY} r={CONE.eyeRadius} />
          </g>
        </>
      ),
    },
    /** 🙌 שתי זרועות **מורמות** — הרנדר מצייר אותן פרושות כלפי מעלה־החוצה. */
    {
      layer: 'offHand',
      shape: (
        <path
          d={`M${-CONE.armInnerX} ${CONE.armInnerY}L${-CONE.armOuterX} ${CONE.armOuterY}L${-CONE.armTipX} ${CONE.armTipY}L${-CONE.armTopX} ${CONE.armTopY}z`}
        />
      ),
    },
    {
      layer: 'mainHand',
      shape: (
        <>
          <path
            d={`M${CONE.armInnerX} ${CONE.armInnerY}L${CONE.armOuterX} ${CONE.armOuterY}L${CONE.armTipX} ${CONE.armTipY}L${CONE.armTopX} ${CONE.armTopY}z`}
          />
          {/* 🔮 הכדור הזוהר מעל היד. 🔬 ברנדר הוא יושב על `y -124` — **מחוץ
              ל-`viewBox`** — ולכן הורד אל קצה היד, ⛔ ולא הוקטן ו⛔ לא נמחק. */}
          <g className="text-[color:var(--arena-ink,currentColor)]" fill="currentColor">
            <circle cx={CONE.orbX} cy={CONE.orbY} r={CONE.orbRadius} />
          </g>
        </>
      ),
    },
  ],
  warrior: [
    { layer: 'offHand', shape: <circle cx={OFF_HAND.x} cy={OFF_HAND.y} r={26} /> },
    {
      layer: 'chest',
      shape: (
        <rect
          x={BODY.x - (BODY_SIZE.width + 16) / 2}
          y={BODY.y - 22}
          width={BODY_SIZE.width + 16}
          height={40}
          rx={8}
        />
      ),
    },
  ],
  armorer: [
    {
      layer: 'headgear',
      shape: (
        <rect x={HEAD.x - HEAD_RADIUS - 8} y={HEAD.y - 11} width={(HEAD_RADIUS + 8) * 2} height={10} rx={3} />
      ),
    },
    {
      layer: 'shoulders',
      shape: (
        <>
          <circle cx={SHOULDER_R.x} cy={SHOULDER_R.y} r={16} />
          <circle cx={SHOULDER_L.x} cy={SHOULDER_L.y} r={16} />
        </>
      ),
    },
    {
      layer: 'mainHand',
      shape: <rect x={MAIN_HAND.x - 25} y={MAIN_HAND.y - 6} width={50} height={12} rx={4} />,
    },
  ],
};

export default function ArenaAvatar({
  items,
  role,
  character,
  className,
}: ArenaAvatarProps): React.JSX.Element {
  // הסינון עובר על הרשימה הקנונית ⛔ ולא על הקלט: כך הסדר קבוע, ושם שאינו ברשימה נופל
  // בשקט במקום לצייר שכבה ריקה.
  const worn = ARCADE_ITEMS.filter((name) => items.includes(name));
  const signature = character === undefined || character === null ? [] : CHARACTER_LAYERS[character];
  const who =
    character === undefined || character === null
      ? ROLE_LABEL_HE[role]
      : `${ROLE_LABEL_HE[role]} · ${CHARACTER_LABELS_HE[character]}`;
  const label =
    worn.length === 0 ? who : `${who}, ${worn.map((name) => ITEM_LABELS_HE[name]).join(', ')}`;

  return (
    <svg
      role="img"
      aria-label={label}
      /* T-117 — הבמה מזיזה את הדמות דרך התכונה הזאת. ⛔ התנועה חיה ב-CSS. */
      data-arena-figure={role}
      viewBox={VIEW_BOX}
      /* 🔴 **⟦תוקן 15/09 · `C-0623` · `T-361`⟧ ברירת המחדל נסוגה מפני הקורא.**
         🔬 **נמדד, ⛔ ולא הונח:** השורה הייתה `['h-40 w-auto', …, className]` — ⇒ קורא
         שביקש `h-16` קיבל **160px**, כי שתי מחלקות Tailwind הן **אותה ספציפיות**
         ומי שמנצח נקבע בסדר גיליון ה-CSS, ⛔ ולא בסדר המחרוזת. ⇒ הבמה ⛔ לא יכלה
         להקטין את היריב, ושתי הדמויות ציירו 160px זו על זו.
         ⇒ הגובה הוא ברירת מחדל **שנופלת** כשהקורא נקב בגובה משלו. ⛔ זה ⛔ אינו
         שינוי בשכבות (`38 § 5`) — זה **גודל**, שהוא תמיד של המסגרת. */
      className={[
        /\bh-(?:\d+|px|full|auto|\[)/.test(className ?? '') ? 'w-auto' : 'h-40 w-auto',
        ROLE_INK[role],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      fill="none"
    >
      {/* ⛔ **הסדר מגיע מ-`LAYER_ORDER`, ⛔ ולא מסדר הכתיבה בקובץ הזה.** זו ההפרדה
          כולה: `38 § 4` הוא **חוק**, ולכן הוא נבדק ביחידה ב-`characterBase.test.ts`
          ⛔ ולא נשמר בזכות זה שמישהו יזכור לא לגרור בלוק JSX למעלה.
          ⛔ **שכבה ריקה ⛔ אינה מצוירת** — `<g>` ריק על אחת־עשרה שכבות בשתי דמויות
          הוא 22 צמתים שאיש ⛔ אינו רואה. */}
      {LAYER_ORDER.map((layer) => {
        // 🧙 `C-0722` — דמות שהצללית שלה **מחליפה** את הגוף מדלגת על שכבות הבסיס
        //    שהיא מספקת בעצמה. ⛔ אף שכבה ⛔ לא נוספה ל-`LAYER_ORDER`.
        const hidden = character == null ? false
          : (CHARACTER_HIDES[character] ?? []).includes(layer);
        const base = hidden ? undefined : BASE_LAYERS[layer];
        const equipped = worn.filter((name) => ITEM_LAYERS[name].layer === layer);
        const marks = signature.filter((mark) => mark.layer === layer);
        if (base === undefined && equipped.length === 0 && marks.length === 0) return null;
        return (
          <g key={layer} data-arena-layer={layer}>
            {base !== undefined && <g fill="currentColor">{base}</g>}
            {/* `38 § 4` — הבסיס מתחת לציוד: חתימת הדמות יושבת בין השניים. */}
            {marks.length > 0 && (
              <g data-arena-character={character} fill="currentColor">
                {marks.map((mark, i) => (
                  <g key={i}>{mark.shape}</g>
                ))}
              </g>
            )}
            {equipped.length > 0 && (
              <g
                data-arena-equipment
                className={OUTLINE_CLASS}
                fill="none"
                stroke="currentColor"
                strokeWidth={5}
              >
                {equipped.map((name) => (
                  <g key={name}>{ITEM_LAYERS[name].shape}</g>
                ))}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
