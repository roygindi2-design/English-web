import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';
import { CHARACTER_LABELS_HE, type ArenaCharacter } from '@/lib/core/arenaCharacter';
import {
  ARMORER,
  BELT_SIZE,
  HEAD_RADIUS,
  LAYER_ORDER,
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
  wand: 'text-[color:var(--arena-fig-wand,currentColor)]',
} as const;

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
      <Paint hue="voidInk">
        <circle cx={HEAD.x - WARRIOR.eyeX} cy={WARRIOR.eyeY} r={WARRIOR.eyeRadius} />
        <circle cx={HEAD.x + WARRIOR.eyeX} cy={WARRIOR.eyeY} r={WARRIOR.eyeRadius} />
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
    {
      layer: 'head',
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
