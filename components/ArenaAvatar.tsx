import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';
import { CHARACTER_LABELS_HE, type ArenaCharacter } from '@/lib/core/arenaCharacter';
import {
  ARMORER,
  BACK,
  BACK_HIDDEN_LAYERS,
  BACK_MIRROR,
  BACK_MIRRORED_LAYERS,
  BELT_SIZE,
  ITEMS,
  ITEM_PATHS,
  GOLEM,
  HUNTER,
  NEW_PATHS,
  SHADE,
  HEAD_RADIUS,
  LAYER_ORDER,
  WANDERER,
  WANDERER_CAPS,
  WANDERER_JOINTS,
  WANDERER_PATHS,
  WARRIOR,
  WARRIOR_PATHS,
  WIZARD,
  WIZARD_PATHS,
  anchorFor,
  mirror,
  pauldronPath,
  type Layer,
} from '@/lib/core/characterBase';

/**
 * הדמות של הזירה — T-096 · § 4.2י · חוקה § 6.
 *
 * 🎨 **⟦23/09 · `D-272`⟧ נכס גרפי מבחוץ מותר** — הבלם «תקציב אפס» הוסר בהוראת רוי. הדמות
 * היא היום שכבות SVG מוטבעות שנכתבו כאן; נכס מבחוץ נכנס **לריפו** ⟨`public/`⟩, ⛔ ולא מקושר.
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
  /**
   * 🎭 **`T-432` · `38 § 1א` · `D-269` ② — לאיזה כיוון הדמות מסתכלת.**
   *
   * ⛔ **ברירת המחדל היא `front`, ⛔ והיא ⛔ אינה «נוחות»:** `38 § 1` פסק «חזיתי»
   * מנימוק שנשאר בתוקף — החזה והפנים הם שתי משבצות הציוד היקרות, והן נבחנות
   * ב**בית**, ב**בחירת דמות** וב**סיכום**. ⇒ **הקרב הוא החריג**, ⛔ ולא הכלל.
   */
  readonly facing?: 'front' | 'back';
  readonly className?: string;
}

type ArcadeItem = (typeof ARCADE_ITEMS)[number];

/**
 * שמות הפריטים בעברית — **מפה אחת בריפו**, ומיוצאת. מסך הסיום מייבא אותה במקום להחזיק
 * עותק שני: שם פריט בשתי צורות הוא בדיוק הפגם ש-`LockIcon` נולד כדי לסגור.
 */
/**
 * 🎭 **`T-432` · חוקה § 1 — הכיוון נאמר במילים, ⛔ ולא רק בצורה.**
 * ⛔ **ומיוצא**, מאותה סיבה ש-`ITEM_LABELS_HE` מיוצא: מחרוזת בשני עותקים היא
 * בדיוק הפגם שהמפה האחת קיימת כדי לסגור.
 */
export const FACING_HE = Object.freeze({ front: 'מלפנים', back: 'מגבו' });

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
 * 🎒 **⟦19/09 · `C-0727`⟧ `OUTLINE_CLASS` **נמחק**, ⛔ ולא נצבע מחדש.**
 *
 * 🔬 **נמדד על הדף החי:** הוא נפתר בזירה ל-`rgb(28,38,66)` — **בדיוק** `--arena-night`,
 * רקע הבמה ⇒ **`1.00:1`**. הגלימה והדגל תלויים ברובם **מחוץ** לגוף ⇒ הם היו
 * **בלתי נראים**, ומה שנראה מהם על הגוף היה קו דק שנקרא כפיגום.
 * ⚠️ **וההנמקה שהחזיקה את השורה מתה לפני התיקון:** היא נימקה «הבסיס ממולא
 * ב-`currentColor` של התפקיד, וקו באותו גוון היה נעלם» — אלא ש-`C-0724` הפסיק
 * לצבוע את הבסיס בצבע התפקיד. ⇒ ההערה נשארה נכונה-למראה והפסיקה להיות נכונה.
 * ⇒ הציוד מצויר עכשיו כ**עצמים מלאים** עם הטוקנים של `38 § 3א`, כמו הדמויות.

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

/**
 * 🎭 **⟦19/09 · `C-0724`⟧ צבע **מקומי** לדמות — ⛔ ולא גוון של צבע התפקיד.**
 *
 * 🔬 **הפער שנמדד לפני שנגעתי בשורה:** הרנדר מצייר את הלוחם ב**עור, שיער כחול,
 * פלדה, זהב וארגמן**; הקוד צבע את **כל** הדמות בגוון אחד של `currentColor`. ⇒ מה
 * שיצא הוא צללית חד-גונית, וזה מה שרוי קרא לו «נראה גרוע». ⛔ **⛔ אין כאן hex**
 * (כלל הקובץ) — כל ערך הוא טוקן ב-`app/arcade/arcade-tokens.css`, שם גם רשומה
 * הניגודיות שכל אחד נותן ולמה ארבעה מהם הוארו מול הרנדר.
 *
 * ⛔ **וערוץ התפקיד ⛔ לא נמחק:** הצללית של הקוסם — החרוט — נשארה `currentColor`,
 * ⇒ קוסם-יריב סגול וקוסם-גיבור זהוב, והמקרה היחיד שבו שתי הדמויות הן אותה דמות
 * ⛔ אינו נופל לשוויון צבע. השם הנגיש נושא את אותה הבחנה בלאו הכי.
 */
const FIG = {
  skin: 'text-[color:var(--arena-fig-skin,currentColor)]',
  hair: 'text-[color:var(--arena-fig-hair,currentColor)]',
  steelLit: 'text-[color:var(--arena-fig-steel-lit,currentColor)]',
  steel: 'text-[color:var(--arena-fig-steel,currentColor)]',
  steelDeep: 'text-[color:var(--arena-fig-steel-deep,currentColor)]',
  slate: 'text-[color:var(--arena-fig-slate,currentColor)]',
  belt: 'text-[color:var(--arena-fig-belt,currentColor)]',
  blade: 'text-[color:var(--arena-fig-blade,currentColor)]',
  gold: 'text-[color:var(--arena-gold,currentColor)]',
  goldLight: 'text-[color:var(--arena-gold-light,currentColor)]',
  voidInk: 'text-[color:var(--arena-fig-void,currentColor)]',
  eye: 'text-[color:var(--arena-fig-eye,currentColor)]',
  eyeCore: 'text-[color:var(--arena-fig-eye-core,currentColor)]',
  orb: 'text-[color:var(--arena-fig-orb,currentColor)]',
  cast: 'text-[color:var(--arena-cast,currentColor)]',
  castShade: 'text-[color:var(--arena-fig-cast-shade,currentColor)]',
  cloth: 'text-[color:var(--arena-fig-cloth,currentColor)]',
  clothFold: 'text-[color:var(--arena-fig-cloth-fold,currentColor)]',
  burst: 'text-[color:var(--arena-burst,currentColor)]',
  leaf: 'text-[color:var(--arena-fig-leaf,currentColor)]',
  leafShade: 'text-[color:var(--arena-fig-leaf-shade,currentColor)]',
  leather: 'text-[color:var(--arena-fig-leather,currentColor)]',
  string: 'text-[color:var(--arena-fig-string,currentColor)]',
  stone: 'text-[color:var(--arena-fig-stone,currentColor)]',
  stoneShade: 'text-[color:var(--arena-fig-stone-shade,currentColor)]',
  core: 'text-[color:var(--arena-fig-core,currentColor)]',
  coreLit: 'text-[color:var(--arena-fig-core-lit,currentColor)]',
  teal: 'text-[color:var(--arena-fig-teal,currentColor)]',
  tealDeep: 'text-[color:var(--arena-fig-teal-deep,currentColor)]',
  wisp: 'text-[color:var(--arena-fig-wisp,currentColor)]',
  wand: 'text-[color:var(--arena-fig-wand,currentColor)]',
  /* 🥋 `C-0755` — שני טוקנים לנווד, ⛔ ולא שאילה מדמות אחרת: כל שישה הגוונים
     שכבר כאן **תפוסים** ⇒ דמות שביעית שלובשת אחד מהם קוראת כמו השכנה שלה.
     הניגודיות של שניהם על `--arena-card` רשומה ב-`arcade-tokens.css`. */
  dune: 'text-[color:var(--arena-fig-dune,currentColor)]',
  duneShade: 'text-[color:var(--arena-fig-dune-shade,currentColor)]',
} as const;

/**
 * 🦴 **⟦21/09 · `C-0756` · `T-444`ⓒ⟧ מפרק — צומת **בתוך** שכבה, ⛔ ולא שכבה.**
 *
 * 🔴 **והגדר שמכתיבה את הצורה הזאת נמדדה, ⛔ ולא נבחרה:**
 * ‏`ArenaAvatar.dom.test.tsx` דורש שכל `[data-arena-layer]` שנושא **תכונת
 * `transform`** יהיה `mainHand` או `offHand`, ⛔ ואין שלישי. ⇒ המפרק ⛔ אינו
 * יכול להיות שכבה, ו**התנועה עליו היא `rotate` ב-CSS ⛔ ולא `transform`**.
 *
 * ⛔ **ו-`transformOrigin` הוא הדבר היחיד שמוטבע כאן — כערך שהמודול הטהור
 * בנה.** הרכיב ⛔ אינו יודע איפה הברך; הוא יודע **לאיזה מפתח** לפנות.
 */
function Joint({ at, name, children }: {
  readonly at: keyof typeof WANDERER_JOINTS;
  readonly name: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <g data-arena-joint={name} style={{ transformOrigin: WANDERER_JOINTS[at] }}>
      {children}
    </g>
  );
}

function Paint({ hue, children }: {
  readonly hue: keyof typeof FIG;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return <g className={FIG[hue]} fill="currentColor">{children}</g>;
}

/**
 * ⛔ **מזהה אחד לכל המסמך, ⛔ ולא אחד לכל דמות.** שתי דמויות על הבמה ⇒ שני
 * ‏`<radialGradient>` באותו `id`; הדפדפן פותר את **הראשון**, ושניהם **זהים**
 * ‏(אותה הגדרה בדיוק) ⇒ התוצאה נכונה בשני המקרים. מזהה ייחודי לכל מופע היה דורש
 * מצב ברכיב שאין לו, ו-`useId` היה הופך אותו לרכיב לקוח בשביל שיפוע.
 */
const ORB_GLOW_ID = 'arena-orb-glow';

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
   * 🎨 **⟦19/09 · `C-0725`⟧ הסגנון של הרנדר, ⛔ ולא הצורות שלו.**
   * רוי: «⛔ לא חייבים להיראות בדיוק כמו הרנדר אבל **בסגנון**». ⇒ הפלטה שנמדדה
   * ב-`38 § 3א` נשארה מילה במילה; הצללית **שופרה** — גוף מחודד, צווארון, פנים.
   * ⛔ **והעוגנים ⛔ לא זזו** (`38 § 3`): גוף `90x86` על `(0,16)`, כתפיים `(±46,-13)`.
   */
  legs: (
    <Paint hue="slate">
      <rect
        x={-WARRIOR.legGap - WARRIOR.legHalfWidth * 2}
        y={WARRIOR.legTopY}
        width={WARRIOR.legHalfWidth * 2}
        height={BOOT_L.y - WARRIOR.legTopY}
        rx={WARRIOR.legR}
      />
      <rect
        x={WARRIOR.legGap}
        y={WARRIOR.legTopY}
        width={WARRIOR.legHalfWidth * 2}
        height={BOOT_R.y - WARRIOR.legTopY}
        rx={WARRIOR.legR}
      />
    </Paint>
  ),
  body: (
    <>
      <Paint hue="steel"><path d={WARRIOR_PATHS.body} /></Paint>
      {/* 🧣 צווארון — בלי זה הראש **צף** מעל הגוף. */}
      <Paint hue="steelLit">
        <rect
          x={-WARRIOR.collarHalfWidth}
          y={WARRIOR.collarTopY}
          width={WARRIOR.collarHalfWidth * 2}
          height={WARRIOR.collarH}
          rx={WARRIOR.collarR}
        />
      </Paint>
    </>
  ),
  chest: (
    <Paint hue="steelDeep">
      <path d={WARRIOR_PATHS.crest} />
      <rect
        x={-WARRIOR.crestLineHalfWidth}
        y={WARRIOR.crestLineTopY}
        width={WARRIOR.crestLineHalfWidth * 2}
        height={WARRIOR.crestLineH}
        rx={WARRIOR.crestLineHalfWidth}
      />
    </Paint>
  ),
  belt: (
    <>
      <Paint hue="belt">
        <rect
          x={BELT.x - BELT_SIZE.width / 2}
          y={BELT.y - BELT_SIZE.height / 2}
          width={BELT_SIZE.width}
          height={BELT_SIZE.height}
          rx={WARRIOR.beltR}
        />
      </Paint>
      <Paint hue="gold">
        <rect
          x={BELT.x - WARRIOR.buckleHalfWidth}
          y={WARRIOR.buckleTopY}
          width={WARRIOR.buckleHalfWidth * 2}
          height={WARRIOR.buckleH}
          rx={WARRIOR.buckleR}
        />
      </Paint>
    </>
  ),
  head: (
    <>
      {/* 💇 מסרק הקוצות הכחולות — 🔬 ברנדר המרווח בין קוצה לקוצה הוא **הרקע**,
          ⛔ ולא פס כהה מצויר. */}
      <Paint hue="hair">
        {WARRIOR.hairBarX.map((x) => (
          <rect
            key={x}
            data-arena-part="hair"
            x={HEAD.x + x}
            y={WARRIOR.hairY}
            width={WARRIOR.hairBarW}
            height={WARRIOR.hairH}
            rx={WARRIOR.hairBarR}
          />
        ))}
      </Paint>
      <Paint hue="skin"><circle cx={HEAD.x} cy={HEAD.y} r={HEAD_RADIUS} /></Paint>
      {/* 👁️ **⟦`C-0725`⟧ פנים — הפרט היחיד שהיריב קיבל והגיבור ⛔ לא.**
          ברנדר לגיבור ⛔ אין פנים כלל; נמדד על המסך שראש בלי עיניים נקרא **כתם**.
          רוי שחרר את הנאמנות המילולית ⇒ זה הדבר הראשון שהוחזר. */}
      {/* 🔬 **⟦19/09 · `C-0731`⟧ `data-arena-eye` — הסימון היה חסר **דווקא כאן**.**
          ‏`C-0723` סימן את עיני ארבע הדמויות ו⛔ פספס את **השלד**, ⇒ שער הניגודיות
          ⛔ לא מדד אותן, ו-`T-432` ⛔ לא יכלה לטעון «מגב ⇒ אפס עיניים» על הבסיס.
          ⛔ **הסימון הוא «זו עין», ⛔ ולא «זו דמות»** — ולכן הוא שייך גם לשלד. */}
      <Paint hue="voidInk">
        <circle data-arena-eye cx={HEAD.x - WARRIOR.eyeX} cy={WARRIOR.eyeY} r={WARRIOR.eyeRadius} />
        <circle data-arena-eye cx={HEAD.x + WARRIOR.eyeX} cy={WARRIOR.eyeY} r={WARRIOR.eyeRadius} />
      </Paint>
      <Paint hue="skin">
        <circle
          cx={HEAD.x - WARRIOR.eyeX - WARRIOR.eyeCoreX}
          cy={WARRIOR.eyeY - WARRIOR.eyeCoreY}
          r={WARRIOR.eyeCoreRadius}
        />
        <circle
          cx={HEAD.x + WARRIOR.eyeX - WARRIOR.eyeCoreX}
          cy={WARRIOR.eyeY - WARRIOR.eyeCoreY}
          r={WARRIOR.eyeCoreRadius}
        />
      </Paint>
    </>
  ),
  /** 🎽 כתפיות — **לוחית על העוגן**: חצי-עיגול וחצאית קצרה, ⛔ ולא עיגול מלא. */
  shoulders: (
    <Paint hue="steelLit">
      <path d={pauldronPath(SHOULDER_R.x, SHOULDER_R.y)} />
      <path d={pauldronPath(SHOULDER_L.x, SHOULDER_L.y)} />
    </Paint>
  ),
};

/**
 * 🎭 **⟦19/09 · `C-0731` · `T-432` · `38 § 1א`⟧ אותו שלד, מהצד השני.**
 *
 * ⛔ **⛔ אין כאן דמות שנייה — יש כאן **שתי** שכבות שמוחלפות.** כל השאר — הגוף,
 * החגורה, הרגליים, הכתפיות, המגפיים — הוא **אותו ציור בדיוק**, כי גוף נראה אותו
 * דבר משני הצדדים. ⇒ יחס השימוש החוזר הוא מה שמוכיח שזה כיוון צפייה ⛔ ולא דמות.
 *
 * 🔬 **ומה ש⛔ אסור היה לעשות:** `scaleX(-1)` על הדמות כולה. זה היה הופך גם את
 * המגן ואת החרב לצד הלא-נכון **ובנוסף** גורר את הגאומטריה אל הרכיב — בדיוק מה
 * ש-`ArenaAvatar.test.ts` אוסר. ⇒ השיקוף מוגבל ל**משבצות היד** (`BACK_MIRRORED_LAYERS`).
 *
 * ⛔ **וכל מספר כאן מגיע מ-`BACK` שב-`characterBase.ts`** — ⛔ אפס קואורדינטה בקובץ הזה.
 */
const BACK_LAYERS: Partial<Record<Layer, React.JSX.Element>> = {
  /**
   * 💇 העורף — ⛔ **⛔ לא «ראש בלי עיניים».** ראש בלי עיניים נקרא **תקלה**; ראש
   * שמכוסה שיער ומתחתיו עורף נקרא **גב**. שלושת הרכיבים: מסרק הקוצות שכבר קיים
   * (מלפנים הוא קודקוד, מאחור הוא אותו קודקוד), מסת השיער, והעורף.
   */
  head: (
    <>
      <Paint hue="hair">
        {WARRIOR.hairBarX.map((x) => (
          <rect
            key={x}
            data-arena-part="hair"
            x={HEAD.x + x}
            y={WARRIOR.hairY}
            width={WARRIOR.hairBarW}
            height={WARRIOR.hairH}
            rx={WARRIOR.hairBarR}
          />
        ))}
      </Paint>
      <Paint hue="skin">
        <rect
          x={HEAD.x - BACK.napeHalfWidth}
          y={BACK.napeTopY}
          width={BACK.napeHalfWidth * 2}
          height={BACK.napeH}
          rx={BACK.napeR}
        />
      </Paint>
      {/* ⛔ **מסת השיער ⛔ אחרונה** — היא מה שמכסה את מה שהיו הפנים. */}
      <Paint hue="hair">
        <ellipse data-arena-part="hair" cx={HEAD.x} cy={BACK.hairCapY} rx={BACK.hairCapRx} ry={BACK.hairCapRy} />
      </Paint>
    </>
  ),
  /**
   * 🦴 הגוף + **תפר עמוד השדרה**. הצווארון נשאר — מאחור רואים אותו בדיוק כמו
   * מלפנים — ומה שנוסף הוא הפרט היחיד שהופך «חזית בלי פנים» ל«גב».
   */
  body: (
    <>
      <Paint hue="steel"><path d={WARRIOR_PATHS.body} /></Paint>
      <Paint hue="steelLit">
        <rect
          x={-WARRIOR.collarHalfWidth}
          y={WARRIOR.collarTopY}
          width={WARRIOR.collarHalfWidth * 2}
          height={WARRIOR.collarH}
          rx={WARRIOR.collarR}
        />
      </Paint>
      <Paint hue="steelDeep">
        <rect
          x={-BACK.spineHalfWidth}
          y={BACK.spineTopY}
          width={BACK.spineHalfWidth * 2}
          height={BACK.spineH}
          rx={BACK.spineR}
        />
      </Paint>
    </>
  ),
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
  /* 🆕 `C-0726` — שלוש דמויות ש**מחליפות** את הבסיס, ⛔ ולא לובשות אותו.
     ⛔ **`legs` של ה`צל` ⛔ אינה «מוסתרת בשביל האפקט»** — ל`צל` **אין רגליים**,
     וזה בדיוק מה שמבדיל את הצללית שלו מכל השאר. */
  hunter: ['legs', 'boots', 'body', 'chest', 'belt', 'shoulders', 'head', 'offHand', 'mainHand'],
  golem: ['legs', 'boots', 'body', 'chest', 'belt', 'shoulders', 'head', 'offHand', 'mainHand'],
  shade: ['legs', 'boots', 'body', 'chest', 'belt', 'shoulders', 'head', 'offHand', 'mainHand'],
  /* 🥋 `C-0755` — הנווד מצייר את עצמו **במלואו**: גוף, רגליים, ראש וידיים.
     ⛔ אף שכבה ⛔ לא נוספה ל-`LAYER_ORDER`. */
  wanderer: ['legs', 'boots', 'body', 'chest', 'belt', 'shoulders', 'head', 'offHand', 'mainHand'],
};

/**
 * שכבת פריט אחת לכל מפתח. חמישה מפתחות בדיוק — הטיפוס אוכף את זה, ⛔ ופריט שישי
 * ⛔ אינו מהדר. ⚠️ **D-132 — משבצת ופריט הם שתי אוצרות מילים, ⛔ ולא שתי רשימות
 * מתחרות:** `ARCADE_ITEMS` נשארה כפי שהיא, וכל פריט **מצביע** על השכבה שהוא נכנס אליה.
 */
/**
 * ⛔ **`only` הוא ציר אחד, ⛔ ולא «דגל לכל צורה».** ‏`front` = פרט שרואים רק
 * מלפנים ⟨פנים, עיניים⟩ · `back` = פרט שרואים רק מאחור ⟨עורף, תפר⟩ · חסר = **שניהם**.
 * 🔴 **וזו הסיבה ש⛔ אין כאן «דמות אחורית»:** אותה רשימת חתימה, אותם עוגנים,
 * ⛔ ואף שכבה ⛔ לא נוספה ל-`LAYER_ORDER`.
 */
type ItemLayer = {
  readonly layer: Layer;
  readonly shape: React.JSX.Element;
  readonly only?: 'front' | 'back';
  /**
   * 🧥 **⟦20/09 · `C-0745` · `F-307`⟧ פריט שמרונדר **פעמיים**, בשתי שכבות.**
   * ‏`38 § 4` מונה בדיוק אחד כזה — הגלימה — ו-`D-136` נוקב במקום השני בשמו.
   * ⛔ **וזה ⛔ אינו פריט שני:** `worn` עדיין מונה `cape` **אחת**, המשבצת
   * ב-`ArenaHome` עדיין אחת, ו`ARCADE_ITEMS` ⛔ לא זז. **מה שכפול הוא הציור.**
   */
  readonly second?: { readonly layer: Layer; readonly shape: React.JSX.Element };
};

/**
 * הצורה שפריט תורם לשכבה נתונה, ⛔ או `null` אם ⛔ אינו נוגע בה.
 * ⛔ **⛔ לא `ITEM_LAYERS[name].layer === layer` עוד** — הגלימה נוגעת ב**שתיים**.
 */
function itemShapeAt(name: (typeof ARCADE_ITEMS)[number], layer: Layer): React.JSX.Element | null {
  const item = ITEM_LAYERS[name];
  if (item.layer === layer) return item.shape;
  if (item.second !== undefined && item.second.layer === layer) return item.second.shape;
  return null;
}

const ITEM_LAYERS: Record<(typeof ARCADE_ITEMS)[number], ItemLayer> = {
  helmet: {
    layer: 'headgear',
    shape: (
      <>
        <Paint hue="steelLit"><path d={ITEM_PATHS.helmetDome} /></Paint>
        <Paint hue="steelDeep">
          <rect x={-ITEMS.browHalfWidth} y={ITEMS.browTopY} width={ITEMS.browHalfWidth * 2} height={ITEMS.browH} rx={ITEMS.browR} />
        </Paint>
        <Paint hue="gold"><path d={ITEM_PATHS.helmetCrest} /></Paint>
      </>
    ),
  },
  cape: {
    layer: 'capeBack',
    shape: (
      <>
        {/* ⛔ `data-arena-part="cape"` **נשאר על הצורה הראשית** — הוא הווו של
            א4 (`37 § 11`), ו-`ArenaBattle.test.ts` מודד דרכו את הפיגור. */}
        <Paint hue="cloth"><path data-arena-part="cape" d={ITEM_PATHS.cape} /></Paint>
        <Paint hue="clothFold"><path d={ITEM_PATHS.capeFold} /></Paint>
      </>
    ),
    /**
     * 🧥 **⟦20/09 · `C-0745` · `F-307`⟧ החצי הקדמי — «מעל הרגליים», מילה במילה.**
     * 🔬 **הפגם נמדד בצילום חי (393×852, `/dev/arcade`), ⛔ ולא שוער:** הגלימה
     * פרושה `x ∈ [−66,66]` בעוד הגוף `±45` ⇒ **כל הפאנל המרכזי שלה מוסתר**
     * מתחת לרגליים ולחגורה, והפרס שהלומד זכה בו נקרא כשתי כנפיים אדומות
     * מנותקות ופס מתחת לחגורה. ⇒ החצי הקדמי הוא השוליים, ו⛔ לא הגלימה כולה:
     * גלימה שלמה מלפנים הייתה **מוחקת את הדמות**.
     * ⛔ **ו-`data-arena-part` ⛔ אינו חוזר כאן** — א4 (`37 § 11`) מפגרת צומת
     * **אחד**, ושני צמתים באותו שם היו מריצים את אותה אנימציה פעמיים על אותו
     * פריט ומפצלים את המדידה של `ArenaBattle.test.ts`.
     */
    second: {
      layer: 'capeFront',
      shape: (
        <>
          <Paint hue="cloth"><path d={ITEM_PATHS.capeHem} /></Paint>
          <Paint hue="clothFold"><path d={ITEM_PATHS.capeFoldHem} /></Paint>
        </>
      ),
    },
  },
  lantern: {
    layer: 'offHand',
    shape: (
      <>
        <Paint hue="gold">
          <path d={ITEM_PATHS.lanternLoop} />
          <rect x={ITEMS.lanternX - ITEMS.lanternHalfWidth} y={ITEMS.lanternTopY} width={ITEMS.lanternHalfWidth * 2} height={ITEMS.lanternH} rx={ITEMS.lanternR} />
          <rect x={ITEMS.lanternX - ITEMS.lanternHalfWidth} y={ITEMS.lanternTopY + ITEMS.lanternH} width={ITEMS.lanternHalfWidth * 2} height={ITEMS.lanternFootH} rx={ITEMS.lanternR / 2} />
        </Paint>
        <Paint hue="burst">
          <rect
            x={ITEMS.lanternX - ITEMS.lanternHalfWidth + ITEMS.lanternPaneInset}
            y={ITEMS.lanternTopY + ITEMS.lanternPaneInset}
            width={(ITEMS.lanternHalfWidth - ITEMS.lanternPaneInset) * 2}
            height={ITEMS.lanternH - ITEMS.lanternPaneInset * 2}
            rx={ITEMS.lanternPaneR}
          />
        </Paint>
      </>
    ),
  },
  boots: {
    layer: 'boots',
    shape: (
      <>
        <Paint hue="leather">
          <path d={ITEM_PATHS.bootLeft} />
          <path d={ITEM_PATHS.bootRight} />
        </Paint>
        <Paint hue="gold">
          <rect x={-ITEMS.bootOuter} y={ITEMS.bootCuffY} width={ITEMS.bootOuter - ITEMS.bootInner} height={ITEMS.bootCuffH} rx={ITEMS.bootCuffR} />
          <rect x={ITEMS.bootInner} y={ITEMS.bootCuffY} width={ITEMS.bootOuter - ITEMS.bootInner} height={ITEMS.bootCuffH} rx={ITEMS.bootCuffR} />
        </Paint>
      </>
    ),
  },
  banner: {
    layer: 'mainHand',
    shape: (
      <>
        <Paint hue="gold">
          <rect data-arena-part="weapon" x={ITEMS.poleX} y={ITEMS.poleTopY} width={ITEMS.poleW} height={ITEMS.poleH} rx={ITEMS.poleR} />
        </Paint>
        <Paint hue="cloth"><path d={ITEM_PATHS.flag} /></Paint>
        <Paint hue="clothFold"><path d={ITEM_PATHS.flagFold} /></Paint>
        <Paint hue="goldLight"><circle cx={ITEMS.poleX + ITEMS.poleW / 2} cy={ITEMS.finialY} r={ITEMS.finialRadius} /></Paint>
      </>
    ),
  },
};

/**
 * 🎩 **⟦19/09 · `C-0727`⟧ פריט **גובר** על כיסוי הראש של הדמות — ⛔ ורק שם.**
 *
 * 🔬 **נמדד על המסך:** קסדה על הקוסם ציירה **כיפת פלדה מעל הכובע המחודד** — שני
 * כיסויי ראש זה על זה. ⇒ `38 § 2` כבר קובע שהמשבצת «ראש» היא **קסדה ללוחם** ו**כובע
 * למכשף**, כלומר הכובע **הוא** פריט הראש שלו ⇒ פריט אמיתי מחליף אותו.
 * ⛔ **וזה ⛔ אינו כלל כללי «ציוד מנצח שכבה»:** אותו כלל היה **מוחק את זרועו** של
 * הקוסם כשנדלק פנס (`offHand`) ואת הגולה שלו כשנדלק דגל (`mainHand`). ⇒ **`headgear`
 * בלבד**, כי זו המשבצת היחידה שבה שניהם באמת «מה שחובשים».
 */
const HEADGEAR_ITEMS: readonly string[] = ['helmet'];

/**
 * 👻 **⛔ ל`צל` ⛔ אין רגליים ⇒ ⛔ אין לו מגפיים.** 🔬 נמדד על המסך: המגפיים צוירו
 * **בתוך הזנב** של דמות שאינה עומדת על הקרקע. ⛔ זו ⛔ אינה החרגה נוחה — זו אותה
 * אנטומיה שבגללה `CHARACTER_HIDES` מסתיר לו את `legs` מלכתחילה.
 */
const NO_BOOTS: readonly ArenaCharacter[] = ['shade'];

/**
 * 🥋 **⟦21/09 · `C-0755` · `T-444`⟧ הציוד על הנווד — **נסתר**, ⛔ ולא נמחק.**
 *
 * ⚠️ **הכרעת רוי, מילה במילה:** «**נסתרים עליה בלבד**». ⇒ חמשת פריטי
 * `ARCADE_ITEMS` ממשיכים לעבוד **על שש האחרות**, ⛔ אמנות ⛔ אינה נזרקת,
 * ⛔ אין מיגרציה ו⛔ אף מפתח ב-`unlocked_items` ⛔ אינו נשבר.
 *
 * 🔴 **ו-`CHARACTER_HIDES` לבדה ⛔ אינה עושה זאת, וזה נמדד ⛔ ולא הונח:** היא
 * מסתירה **שכבות בסיס** בלבד, והציוד מצויר בענף נפרד (`equipped`). ⇒ בלי
 * הרשימה הזאת הקסדה הייתה נוחתת על הכרבולת והמגפיים על שוק מכופף — בדיוק
 * שתי ההתנגשויות ש-`C-0727` מדד על המסך.
 *
 * ⛔ **וזו ⛔ אינה רשימה שנוח להאריך:** `NO_BOOTS` מעליה היא **אנטומיה** (⛔ אין
 * רגליים ⇒ ⛔ אין מגפיים); זו כאן היא **הכרעת בעלים**, והיא נושאת את ציטוטה.
 */
const NO_EQUIPMENT: readonly ArenaCharacter[] = ['wanderer'];

/**
 * 🦴 **⟦21/09 · `C-0756` · `T-444`ⓒ⟧ מי נושא שלד — **רשימה מפורשת**, ⛔ ולא נגזרת.**
 *
 * 🔴 **וזו הגדר שמגנה על שש הדמויות הקיימות:** קיפריימים של ברך ושל גו
 * מגודרים ב-CSS ל-`[data-arena-rig='jointed']` ⇒ דמות בלי התכונה הזאת
 * ⛔ **אינה רואה אותם כלל**, ⛔ ולא «רואה אותם ונשארת במקרה במקום».
 *
 * 🌀 **ומרכז פיתול הגו נמסר כ**משתנה CSS**, ⛔ ולא נכתב בגיליון:** הגו מתפרש
 * על **שש שכבות אחיות** ⇒ ⛔ אי אפשר לעטוף אותן, אבל **סיבוב זהה של כולן
 * סביב אותו מרכז שקול לסיבוב של קבוצה**. ⇒ המספר נשאר במודול הטהור.
 */
const JOINTED: readonly ArenaCharacter[] = ['wanderer'];


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
     * 🧙 **⟦19/09 · `C-0725`⟧ כובע · שוליים · פנים · גלימה — ⛔ ולא חרוט אחד.**
     * 🔬 החרוט היחיד נמדד מהרנדר ⛔ ואז **נראה**: הוא נקרא **משולש סגול**, ⛔ ולא
     * קוסם. ⇒ הכובע הופרד מהגלימה, וביניהם **שוליים** — הפרט שהופך צללית
     * ל«קוסם» בלי מילה. ⛔ כל מספר ב-`WIZARD` שב-`characterBase.ts`.
     */
    {
      layer: 'body',
      shape: (
        <>
          <Paint hue="cast"><path d={WIZARD_PATHS.robeLit} /></Paint>
          <Paint hue="castShade"><path d={WIZARD_PATHS.robeShade} /></Paint>
        </>
      ),
    },
    { layer: 'offHand', shape: <Paint hue="cast"><path d={WIZARD_PATHS.armLeft} /></Paint> },
    {
      layer: 'mainHand',
      shape: (
        <>
          <Paint hue="cast"><path d={WIZARD_PATHS.armRight} /></Paint>
          {/* 🪄 המטה, ואחריו הגולה. 🔬 ברנדר הגולה על `(85,-124.5)` — **מעל גג
              המסגרת** — ⇒ היא הונמכה, ⛔ ולא הוקטנה ו⛔ לא נמחקה.
              ⛔ **והזוהר הוא שיפוע, ⛔ ולא שלושה עיגולים**: עיגולים בשקיפויות
              שונות מייצרים **טבעת**, ונמדד על המסך שהיא נראית כמו זכוכית מגדלת. */}
          <Paint hue="wand"><path d={WIZARD_PATHS.wand} /></Paint>
          <Paint hue="orb">
            <radialGradient id={ORB_GLOW_ID}>
              <stop offset="0.35" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <circle cx={WIZARD.orbX} cy={WIZARD.orbY} r={WIZARD.orbGlowRadius} fill={`url(#${ORB_GLOW_ID})`} />
            <circle cx={WIZARD.orbX} cy={WIZARD.orbY} r={WIZARD.orbRadius} />
          </Paint>
        </>
      ),
    },
    /**
     * 🎭 **`T-432` — כל שכבת ה-`head` של הקוסם **היא** הפנים**, ⇒ `only: 'front'`.
     * מאחור נשארים הכובע והגלימה, וזה **בדיוק** מה שארבעת רנדרי הקרב מציירים.
     */
    {
      layer: 'head',
      only: 'front',
      shape: (
        <>
          {/* 🌑 פנים כהות — ⛔ **פנימיות**: הן יושבות על הגלימה ועל הכובע, ⛔ ולא
              על הכרטיס, ושם הן **חייבות** להיות כהות אחרת העיניים מפסיקות לזהור. */}
          <Paint hue="voidInk"><circle cx={0} cy={WIZARD.faceY} r={WIZARD.faceRadius} /></Paint>
          {/* 🔬 ⟦`C-0723`⟧ `data-arena-eye` — **סימון, ⛔ ולא סף רדיוס.** */}
          <Paint hue="eye">
            <circle data-arena-eye cx={-WIZARD.eyeX} cy={WIZARD.eyeY} r={WIZARD.eyeRadius} />
            <circle data-arena-eye cx={WIZARD.eyeX} cy={WIZARD.eyeY} r={WIZARD.eyeRadius} />
          </Paint>
          <Paint hue="eyeCore">
            <circle cx={-WIZARD.eyeX - WIZARD.eyeCoreRadius} cy={WIZARD.eyeY - WIZARD.eyeCoreRadius} r={WIZARD.eyeCoreRadius} />
            <circle cx={WIZARD.eyeX - WIZARD.eyeCoreRadius} cy={WIZARD.eyeY - WIZARD.eyeCoreRadius} r={WIZARD.eyeCoreRadius} />
          </Paint>
        </>
      ),
    },
    {
      layer: 'headgear',
      shape: (
        <>
          <Paint hue="cast"><path d={WIZARD_PATHS.hat} /></Paint>
          <Paint hue="castShade"><path d={WIZARD_PATHS.hatShade} /></Paint>
          <Paint hue="voidInk"><path d={WIZARD_PATHS.hatBand} /></Paint>
          <Paint hue="castShade"><ellipse cx={0} cy={WIZARD.brimBackY} rx={WIZARD.brimRx} ry={WIZARD.brimRy} /></Paint>
          <Paint hue="cast"><ellipse cx={0} cy={WIZARD.brimFrontY} rx={WIZARD.brimRx} ry={WIZARD.brimRy} /></Paint>
        </>
      ),
    },
  ],
  warrior: [
    /**
     * 🛡️ **המגן — **טיפה** עם מסגרת זהב, פנים פלדה ובליטת זהב.**
     * 🔬 ברנדר זהו מלבן מעוגל; רוי שחרר את הנאמנות המילולית, ⇒ הצורה קמורה
     * כלפי מטה — היא נקראת **מגן**, ⛔ ולא לוח.
     */
    {
      layer: 'offHand',
      shape: (
        <>
          <Paint hue="gold"><path d={WARRIOR_PATHS.shield} /></Paint>
          <Paint hue="steelDeep"><path d={WARRIOR_PATHS.shieldFace} /></Paint>
          <Paint hue="goldLight">
            <circle cx={WARRIOR.bossX} cy={WARRIOR.bossY} r={WARRIOR.bossRadius} />
          </Paint>
        </>
      ),
    },
    /**
     * ⚔️ **החרב — להב עם אור, ניצב, ידית וגולת ידית.**
     * ⚠️ הלהב **נחתך** ב-`x 100`: חרב שנגמרת בתוך המסגרת היא חרב **קצרה**,
     * ⛔ ולא חרב שנחתכה.
     */
    {
      layer: 'mainHand',
      shape: (
        <>
          <Paint hue="blade"><path data-arena-part="weapon" d={WARRIOR_PATHS.blade} /></Paint>
          <Paint hue="steelLit"><path d={WARRIOR_PATHS.bladeLit} /></Paint>
          <Paint hue="gold">
            <path d={WARRIOR_PATHS.guard} />
            <path d={WARRIOR_PATHS.grip} />
          </Paint>
          <Paint hue="goldLight">
            <circle cx={WARRIOR.pommelX} cy={WARRIOR.pommelY} r={WARRIOR.pommelRadius} />
          </Paint>
        </>
      ),
    },
  ],
  armorer: [
    /**
     * 🤖 **⟦`C-0724`⟧ השריונאי — **חליפת קרב**, ⛔ ולא שלושה כתמי זהב.**
     * ⚠️ **`37 § 7` מתאר אותו במילים ⛔ ולא ברנדר** — `kol-B-03` מצייר רק קוסם
     * ולוחם. ⇒ מה שכאן נגזר מהמילים («חליפת קרב טכנולוגית · ירי מטווח»)
     * ובפלטה של השניים האחרים, ⛔ ולא מרנדר שאיננו. זה **מוצהר** ⛔ ולא מוסתר.
     */
    {
      layer: 'headgear',
      shape: (
        <>
          <Paint hue="voidInk">
            <rect
              x={HEAD.x - HEAD_RADIUS - ARMORER.visorOverhang}
              y={HEAD.y + ARMORER.visorTopY}
              width={(HEAD_RADIUS + ARMORER.visorOverhang) * 2}
              height={ARMORER.visorH}
              rx={ARMORER.visorR}
            />
          </Paint>
          {/* 💡 החריץ — 🔬 בלי אור הקסדה נקראת **כיסוי עיניים**: השכבה מכסה
              בדיוק את העיניים של שכבת הבסיס, ו⛔ אינה מחזירה דבר במקומן. */}
          <Paint hue="blade">
            <rect
              x={HEAD.x - ARMORER.slitHalfWidth}
              y={HEAD.y + ARMORER.slitTopY}
              width={ARMORER.slitHalfWidth * 2}
              height={ARMORER.slitH}
              rx={ARMORER.slitR}
            />
          </Paint>
        </>
      ),
    },
    {
      layer: 'shoulders',
      shape: (
        <Paint hue="gold">
          <circle cx={SHOULDER_R.x} cy={SHOULDER_R.y - ARMORER.capRise} r={ARMORER.capRadius} />
          <circle cx={SHOULDER_L.x} cy={SHOULDER_L.y - ARMORER.capRise} r={ARMORER.capRadius} />
        </Paint>
      ),
    },
    {
      layer: 'mainHand',
      shape: (
        <>
          <Paint hue="steelLit">
            <rect
              x={MAIN_HAND.x + ARMORER.barrelBackX}
              y={MAIN_HAND.y + ARMORER.barrelTopY}
              width={ARMORER.barrelW}
              height={ARMORER.barrelH}
              rx={ARMORER.barrelR}
            />
          </Paint>
          <Paint hue="gold">
            <rect
              x={MAIN_HAND.x + ARMORER.gripX}
              y={MAIN_HAND.y + ARMORER.gripY}
              width={ARMORER.gripW}
              height={ARMORER.gripH}
              rx={ARMORER.gripR}
            />
          </Paint>
        </>
      ),
    },
  ],
  /**
   * 🏹 **`צייד` — ⛔ הקשת **היא** הצללית.** 🔬 נמדד ב-64px: מה שנקרא ממרחק הוא
   * **הקשת** ⛔ ולא הדמות ⇒ היא גדולה, היא משמאל, והחץ **דרוך עליה** וחוצה את
   * הגוף. גרסה ראשונה שלי ציירה קשת מנותקת וחץ מרחף ⇒ זה נקרא **תפאורה**.
   */
  hunter: [
    {
      layer: 'offHand',
      shape: (
        <>
          <g className={FIG.leather} fill="none" stroke="currentColor" strokeWidth={HUNTER.bowWidth} strokeLinecap="round">
            <path d={NEW_PATHS.hunterBow} />
          </g>
          <g className={FIG.string} fill="none" stroke="currentColor" strokeWidth={HUNTER.stringWidth} strokeLinejoin="round">
            <path d={NEW_PATHS.hunterString} />
          </g>
        </>
      ),
    },
    {
      layer: 'legs',
      shape: (
        <Paint hue="leather">
          <rect x={-HUNTER.legInner - HUNTER.legHalfWidth * 2} y={HUNTER.legTopY} width={HUNTER.legHalfWidth * 2} height={BOOT_L.y - HUNTER.legTopY} rx={8} />
          <rect x={HUNTER.legInner} y={HUNTER.legTopY} width={HUNTER.legHalfWidth * 2} height={BOOT_R.y - HUNTER.legTopY} rx={8} />
        </Paint>
      ),
    },
    {
      layer: 'body',
      shape: (
        <>
          <Paint hue="leaf"><path d={NEW_PATHS.hunterTunic} /></Paint>
          <Paint hue="leafShade"><path d={NEW_PATHS.hunterTunicShade} /></Paint>
        </>
      ),
    },
    {
      layer: 'belt',
      shape: (
        <Paint hue="leather">
          <rect x={-HUNTER.beltHalfWidth} y={HUNTER.beltTopY} width={HUNTER.beltHalfWidth * 2} height={HUNTER.beltH} rx={HUNTER.beltR} />
        </Paint>
      ),
    },
    /* 🎭 `T-432` — הגולגולת נשארת משני הצדדים; **הפנים** הן שכבה בפני עצמה. */
    { layer: 'head', shape: <Paint hue="skin"><circle cx={0} cy={HUNTER.headY} r={HUNTER.headRadius} /></Paint> },
    {
      layer: 'head',
      only: 'front',
      shape: (
        <Paint hue="voidInk">
          <circle data-arena-eye cx={-HUNTER.eyeX} cy={HUNTER.eyeY} r={HUNTER.eyeRadius} />
          <circle data-arena-eye cx={HUNTER.eyeX} cy={HUNTER.eyeY} r={HUNTER.eyeRadius} />
        </Paint>
      ),
    },
    {
      layer: 'headgear',
      shape: (
        <>
          <Paint hue="leaf"><path d={NEW_PATHS.hunterHood} /></Paint>
          <Paint hue="leafShade"><path d={NEW_PATHS.hunterHoodShade} /></Paint>
        </>
      ),
    },
    {
      layer: 'mainHand',
      shape: (
        <>
          <g className={FIG.string} fill="none" stroke="currentColor" strokeWidth={4}>
            <path data-arena-part="weapon" d={NEW_PATHS.hunterShaft} />
          </g>
          <Paint hue="leather"><path d={NEW_PATHS.hunterArrowHead} /></Paint>
          <Paint hue="leafShade"><path d={NEW_PATHS.hunterFletch} /></Paint>
        </>
      ),
    },
  ],
  /**
   * 🗿 **`גולם` — ⛔ **מסה**.** שתי סלעי כתף גדולות מהראש, ראש **שקוע** ביניהן,
   * וליבה בוערת בחזה. ⛔ אין לו נשק: מה שנקרא הוא ה**נפח**, ⛔ ולא מה שהוא אוחז.
   */
  golem: [
    {
      layer: 'legs',
      shape: (
        <Paint hue="stoneShade">
          <rect x={-GOLEM.legInner - GOLEM.legHalfWidth * 2} y={GOLEM.legTopY} width={GOLEM.legHalfWidth * 2} height={BOOT_L.y - GOLEM.legTopY} rx={GOLEM.legR} />
          <rect x={GOLEM.legInner} y={GOLEM.legTopY} width={GOLEM.legHalfWidth * 2} height={BOOT_R.y - GOLEM.legTopY} rx={GOLEM.legR} />
        </Paint>
      ),
    },
    { layer: 'body', shape: <Paint hue="stone"><path d={NEW_PATHS.golemBody} /></Paint> },
    {
      layer: 'chest',
      shape: (
        <>
          <Paint hue="core"><path d={NEW_PATHS.golemCore} /></Paint>
          <Paint hue="coreLit"><path d={NEW_PATHS.golemCoreInner} /></Paint>
        </>
      ),
    },
    /* 🎭 `T-432` — גוש האבן נראה משני הצדדים; **הליבה הזוהרת** ⛔ אינה. */
    {
      layer: 'head',
      shape: (
        <Paint hue="stone">
          <rect x={-GOLEM.headHalfWidth} y={GOLEM.headTopY} width={GOLEM.headHalfWidth * 2} height={GOLEM.headH} rx={GOLEM.headR} />
        </Paint>
      ),
    },
    {
      layer: 'head',
      only: 'front',
      shape: (
        <Paint hue="core">
          <circle data-arena-eye cx={-GOLEM.headEyeX} cy={GOLEM.headEyeY} r={GOLEM.headEyeRadius} />
          <circle data-arena-eye cx={GOLEM.headEyeX} cy={GOLEM.headEyeY} r={GOLEM.headEyeRadius} />
        </Paint>
      ),
    },
    {
      layer: 'shoulders',
      shape: (
        <>
          <Paint hue="stone">
            <circle cx={-GOLEM.boulderX} cy={GOLEM.boulderY} r={GOLEM.boulderRadius} />
            <circle cx={GOLEM.boulderX} cy={GOLEM.boulderY} r={GOLEM.boulderRadius} />
          </Paint>
          <Paint hue="stoneShade">
            <path d={NEW_PATHS.golemBoulderShadeLeft} />
            <path d={NEW_PATHS.golemBoulderShadeRight} />
          </Paint>
        </>
      ),
    },
  ],
  /**
   * 👻 **`צל` — ⛔ **בלי רגליים**.** זנב קרוע במקום רגליים, ברדס, פנים כהות
   * ועיניים זוהרות. ⛔ זו הצללית היחידה שאינה עומדת על הקרקע, וזה מה שמבדיל
   * אותה מכל השאר גם כשהצבע מוסר.
   */
  shade: [
    { layer: 'offHand', shape: <Paint hue="tealDeep"><path d={NEW_PATHS.shadeArmLeft} /></Paint> },
    { layer: 'mainHand', shape: <Paint hue="tealDeep"><path d={NEW_PATHS.shadeArmRight} /></Paint> },
    {
      layer: 'body',
      shape: (
        <>
          <Paint hue="tealDeep"><path d={NEW_PATHS.shadeTail} /></Paint>
          <Paint hue="teal"><path d={NEW_PATHS.shadeTailLit} /></Paint>
        </>
      ),
    },
    /* 🎭 `T-432` — הברדס נראה משני הצדדים; **חלל הפנים והעיניים** ⛔ אינם. */
    { layer: 'head', shape: <Paint hue="tealDeep"><path d={NEW_PATHS.shadeHood} /></Paint> },
    {
      layer: 'head',
      only: 'front',
      shape: (
        <>
          <Paint hue="voidInk"><ellipse cx={0} cy={SHADE.faceY} rx={SHADE.faceRx} ry={SHADE.faceRy} /></Paint>
          <Paint hue="wisp">
            <circle data-arena-eye cx={-SHADE.eyeX} cy={SHADE.eyeY} r={SHADE.eyeRadius} />
            <circle data-arena-eye cx={SHADE.eyeX} cy={SHADE.eyeY} r={SHADE.eyeRadius} />
          </Paint>
        </>
      ),
    },
    /**
     * ✨ **⛔ `chest` ו⛔ לא `headgear`.** הרסיסים ⛔ אינם כיסוי ראש — הם מרחפים
     * לצד הדמות. 🔬 וכשהם ישבו ב-`headgear`, כלל ההחלפה של `C-0727` **מחק אותם**
     * ברגע שנדלקה קסדה. ⛔ אף פריט ⛔ אינו תופס את `chest`, ⇒ הם בטוחים שם.
     * ⚠️ **וההערה יושבת **מעל** הסוגר בכוונה:** הערת בלוק כאיבר **ראשון** בתוך
     * סוגר מסולסל גורמת למסיר-ההערות של `ArenaAvatar.test.ts` לבלוע **2,549 תווים**
     * עד סוגר ההערה הבא שאחריו סוגר מסולסל סוגר — ⇒ הוא בלע את תג ה-`<svg>` עצמו
     * ושלוש בדיקות האדימו. 🔬 נמדד על הפלט, ⛔ ולא שוער.
     */
    {
      layer: 'chest',
      shape: (
        <>
          <Paint hue="wisp"><circle cx={SHADE.moteX} cy={SHADE.moteY} r={SHADE.moteRadius} /></Paint>
          <Paint hue="teal"><circle cx={SHADE.sparkX} cy={SHADE.sparkY} r={SHADE.sparkRadius} /></Paint>
        </>
      ),
    },
  ],
  /**
   * 🥋 **`נווד` — **פסיעה**, ⛔ ולא עמידה.** שתי רגליים **נפרדות** בפסיעה רחבה,
   * כרבולת **משולשת** מעל הראש, וכפות ידיים **פתוחות וריקות**. ⛔ אין בידיה נשק,
   * ⛔ ואין עליה ציוד — וזה הערוץ שמבדיל אותה משש האחרות גם כשהצבע מוסר.
   * 🦵 **והרגל מצוירת כ**ירך · שוק · כף**, שלושה נתיבים** — ⛔ ולא צורה אחת:
   * `T-444` ג׳ עוטפת את השוק ואת הכף ב-`<g>` מקונן ⛔ בלי לצייר מחדש.
   * ⛔ כל מספר ב-`WANDERER` שב-`characterBase.ts`.
   */
  wanderer: [
    {
      layer: 'legs',
      shape: (
        <>
          <Paint hue="duneShade">
            <path d={WANDERER_PATHS.thighRight} />
            <path d={WANDERER_PATHS.thighLeft} />
            {/* 🔵 כיפת הברך — **סטטית ומחוץ למפרק**: בלעדיה הקיפול פוער טריז
                והרגל נראית מנותקת. 🔬 נמדד על הזירה החיה, ⛔ ולא שוער. */}
            <circle cx={WANDERER_CAPS.kneeX} cy={WANDERER_CAPS.kneeY} r={WANDERER_CAPS.knee} />
            <circle cx={-WANDERER_CAPS.kneeX} cy={WANDERER_CAPS.kneeY} r={WANDERER_CAPS.knee} />
          </Paint>
          {/* 🦵 **השוק והכף רוכבים על הברך** — ⇒ קיפול הברך מזיז את שניהם
              כיחידה אחת, בדיוק כמו רגל. ⛔ הירך ⛔ אינה בפנים: היא זו שהברך
              תלויה ממנה. */}
          <Joint at="kneeRight" name="knee">
            <Paint hue="duneShade"><path d={WANDERER_PATHS.shinRight} /></Paint>
            <Paint hue="leather"><path d={WANDERER_PATHS.footRight} /></Paint>
          </Joint>
          <Joint at="kneeLeft" name="knee">
            <Paint hue="duneShade"><path d={WANDERER_PATHS.shinLeft} /></Paint>
            <Paint hue="leather"><path d={WANDERER_PATHS.footLeft} /></Paint>
          </Joint>
        </>
      ),
    },
    {
      layer: 'body',
      shape: (
        <>
          <Paint hue="dune"><path d={WANDERER_PATHS.wrap} /></Paint>
          <Paint hue="duneShade"><path d={WANDERER_PATHS.wrapShade} /></Paint>
        </>
      ),
    },
    {
      layer: 'belt',
      shape: (
        <Paint hue="leather">
          <rect
            x={-WANDERER.sashHalfWidth}
            y={WANDERER.sashTopY}
            width={WANDERER.sashHalfWidth * 2}
            height={WANDERER.sashH}
            rx={WANDERER.sashR}
          />
        </Paint>
      ),
    },
    /* 🎭 `T-432` — הגולגולת נשארת משני הצדדים; **הצעיף והעיניים** הם חזית. */
    { layer: 'head', shape: <Paint hue="skin"><circle cx={0} cy={WANDERER.headY} r={WANDERER.headRadius} /></Paint> },
    {
      layer: 'head',
      only: 'front',
      shape: (
        <>
          <Paint hue="hair">
            <rect
              x={-WANDERER.scarfHalfWidth}
              y={WANDERER.scarfTopY}
              width={WANDERER.scarfHalfWidth * 2}
              height={WANDERER.scarfH}
              rx={WANDERER.scarfR}
            />
          </Paint>
          <Paint hue="voidInk">
            <circle data-arena-eye cx={-WANDERER.eyeX} cy={WANDERER.eyeY} r={WANDERER.eyeRadius} />
            <circle data-arena-eye cx={WANDERER.eyeX} cy={WANDERER.eyeY} r={WANDERER.eyeRadius} />
          </Paint>
        </>
      ),
    },
    {
      layer: 'headgear',
      shape: (
        <>
          <Paint hue="dune"><path d={WANDERER_PATHS.crest} /></Paint>
          <Paint hue="duneShade"><path d={WANDERER_PATHS.crestShade} /></Paint>
          <Paint hue="duneShade">
            <path d={WANDERER_PATHS.barbRight} />
            <path d={WANDERER_PATHS.barbLeft} />
          </Paint>
        </>
      ),
    },
    {
      layer: 'offHand',
      shape: (
        <>
        <Paint hue="dune">
          <circle cx={-WANDERER_CAPS.armX} cy={WANDERER_CAPS.armY} r={WANDERER_CAPS.arm} />
        </Paint>
        <Joint at="armLeft" name="arm">
          <Paint hue="dune"><path d={WANDERER_PATHS.armLeft} /></Paint>
          <Paint hue="skin">
            <circle cx={-WANDERER.palmX} cy={WANDERER.palmY} r={WANDERER.palmRadius} />
            {WANDERER.fingerX.map((fx) => (
              <rect
                key={fx}
                x={-fx - WANDERER.fingerW}
                y={WANDERER.fingerTopY}
                width={WANDERER.fingerW}
                height={WANDERER.fingerH}
                rx={WANDERER.fingerR}
              />
            ))}
          </Paint>
        </Joint>
        </>
      ),
    },
    {
      layer: 'mainHand',
      shape: (
        <>
        <Paint hue="dune">
          <circle cx={WANDERER_CAPS.armX} cy={WANDERER_CAPS.armY} r={WANDERER_CAPS.arm} />
        </Paint>
        <Joint at="armRight" name="arm">
          <Paint hue="dune"><path d={WANDERER_PATHS.armRight} /></Paint>
          <Paint hue="skin">
            <circle cx={WANDERER.palmX} cy={WANDERER.palmY} r={WANDERER.palmRadius} />
            {WANDERER.fingerX.map((fx) => (
              <rect
                key={fx}
                x={fx}
                y={WANDERER.fingerTopY}
                width={WANDERER.fingerW}
                height={WANDERER.fingerH}
                rx={WANDERER.fingerR}
              />
            ))}
          </Paint>
        </Joint>
        </>
      ),
    },
  ],
};

export default function ArenaAvatar({
  items,
  role,
  character,
  facing = 'front',
  className,
}: ArenaAvatarProps): React.JSX.Element {
  const back = facing === 'back';
  // הסינון עובר על הרשימה הקנונית ⛔ ולא על הקלט: כך הסדר קבוע, ושם שאינו ברשימה נופל
  // בשקט במקום לצייר שכבה ריקה.
  /* 🥋 `C-0755` — **מסנן אחד**, ⇒ השם הנגיש ⛔ אינו מונה פריט שאיש ⛔ אינו רואה.
     לומד שקורא מסך היה שומע «נווד, קסדה, גלימה» מול דמות ריקה מציוד. */
  const worn = ARCADE_ITEMS.filter(
    (name) => items.includes(name)
      && !(character !== null && character !== undefined && NO_EQUIPMENT.includes(character)),
  );
  const signature = character === undefined || character === null ? [] : CHARACTER_LAYERS[character];
  const who =
    character === undefined || character === null
      ? ROLE_LABEL_HE[role]
      : `${ROLE_LABEL_HE[role]} · ${CHARACTER_LABELS_HE[character]}`;
  const dressed =
    worn.length === 0 ? who : `${who}, ${worn.map((name) => ITEM_LABELS_HE[name]).join(', ')}`;
  /* 🔴 **חוקה § 1 — הכיוון ⛔ אינו צורה בלבד.** לומד שקורא מסך ⛔ אינו רואה שהדמות
     הסתובבה, ⇒ השם הנגיש אומר זאת. זו אותה גדר בדיוק שהפרידה בין שני התפקידים. */
  const label = back ? `${dressed}, ${FACING_HE.back}` : dressed;
  /* 🦴 `C-0756` — התכונה **והמשתנה** נדלקים יחד: גיליון שמגודר לתכונה ⛔ אינו
     יכול לרוץ בלי המרכז, ומרכז בלי תכונה ⛔ אינו מסובב דבר. */
  const jointed = character !== null && character !== undefined && JOINTED.includes(character);

  return (
    <svg
      role="img"
      aria-label={label}
      data-arena-rig={jointed ? 'jointed' : undefined}
      style={jointed ? ({ '--arena-rig-torso': WANDERER_JOINTS.torso } as React.CSSProperties) : undefined}
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
          ⛔ **שכבה ריקה ⛔ אינה מצוירת** — `<g>` ריק על שתים־עשרה שכבות בשתי דמויות
          הוא 24 צמתים שאיש ⛔ אינו רואה. */}
      {LAYER_ORDER.map((layer) => {
        // 🧙 `C-0722` — דמות שהצללית שלה **מחליפה** את הגוף מדלגת על שכבות הבסיס
        //    שהיא מספקת בעצמה. ⛔ אף שכבה ⛔ לא נוספה ל-`LAYER_ORDER`.
        const hidden = (character == null ? false
          : (CHARACTER_HIDES[character] ?? []).includes(layer))
          // 🎭 `T-432` — סמל החזה הוא **חזית**, ⇒ ⛔ אינו נראה מאחור.
          || (back && BACK_HIDDEN_LAYERS.includes(layer));
        // 🎭 `T-432` — שתי שכבות מוחלפות מגב; כל השאר הוא **אותו ציור**.
        const base = hidden ? undefined : (back ? BACK_LAYERS[layer] ?? BASE_LAYERS[layer] : BASE_LAYERS[layer]);
        const equipped = worn.filter((name) => itemShapeAt(name, layer) !== null
          && !(layer === 'boots' && character !== null && character !== undefined && NO_BOOTS.includes(character)));
        // 🎩 `C-0727` — פריט ראש **מחליף** את כיסוי הראש של הדמות, ⛔ ולא נערם עליו.
        const headgearTaken = layer === 'headgear' && worn.some((name) => HEADGEAR_ITEMS.includes(name));
        // 🎭 `T-432` — פרט שקיים רק בכיוון אחד ⛔ אינו מצויר בכיוון השני.
        const marks = headgearTaken ? [] : signature.filter(
          (mark) => mark.layer === layer && (mark.only === undefined || mark.only === facing),
        );
        if (base === undefined && equipped.length === 0 && marks.length === 0) return null;
        return (
          <g
            key={layer}
            data-arena-layer={layer}
            /* 🪞 `T-432` — יד ימין של הדמות נראית מאחור בצד שמאל של המסך. ⛔ השיקוף
               מוגבל למשבצות היד: שיקוף הדמות כולה היה הופך גם את תפר הגב. */
            transform={back && BACK_MIRRORED_LAYERS.includes(layer) ? BACK_MIRROR : undefined}
          >
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
              <g data-arena-equipment>
                {equipped.map((name) => (
                  <g key={name}>{itemShapeAt(name, layer)}</g>
                ))}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
