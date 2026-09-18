import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';
import { CHARACTER_LABELS_HE, type ArenaCharacter } from '@/lib/core/arenaCharacter';
import {
  BELT_SIZE,
  BODY_SIZE,
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
  legs: (
    <>
      <rect x={BOOT_L.x - 13} y={BELT.y - 3} width={26} height={BOOT_L.y - BELT.y + 3} rx={12} />
      <rect x={BOOT_R.x - 13} y={BELT.y - 3} width={26} height={BOOT_R.y - BELT.y + 3} rx={12} />
    </>
  ),
  boots: (
    <>
      <rect x={BOOT_L.x - 17} y={BOOT_L.y - 8} width={34} height={24} rx={7} />
      <rect x={BOOT_R.x - 17} y={BOOT_R.y - 8} width={34} height={24} rx={7} />
    </>
  ),
  body: (
    <rect
      x={BODY.x - BODY_SIZE.width / 2}
      y={BODY.y - BODY_SIZE.height / 2}
      width={BODY_SIZE.width}
      height={BODY_SIZE.height}
      rx={18}
    />
  ),
  belt: (
    <rect
      x={BELT.x - BELT_SIZE.width / 2}
      y={BELT.y - BELT_SIZE.height / 2}
      width={BELT_SIZE.width}
      height={BELT_SIZE.height}
      rx={5}
    />
  ),
  /**
   * 💪 **⟦18/09 · `C-0719`⟧ הזרוע — כפות הידיים ⛔ מפסיקות לרחף.**
   *
   * 🔬 **נמדד בצילום ×5 של שתי הדמויות, ⛔ ולא הוסק:** `offHand` ו-`mainHand` ציירו
   * **עיגול בודד** כל אחת, ו-`shoulders` ריקה בבסיס ⇒ שתי כפות ידיים תלויות באוויר
   * משני צדי הגוף, **בלי שום דבר שמחבר אותן אליו**. זה נראה בשתי הדמויות, בכל מסך.
   *
   * ⛔ **⛔ אין שכבה חדשה** (`38 § 5`): הרצועה נכנסת לשכבה שכף היד כבר יושבת בה,
   * ⇒ סדר הציור של `38 § 4` ⛔ לא נגע.
   * ⛔ **וכל קצה הוא עוגן קיים** — כתף ⇐ כף יד, ⛔ אפס קואורדינטה מוחלטת: הרצועה
   * מתכווצת ומתרחבת עם השלד במקום להיות מספר שיסטה ממנו.
   */
  offHand: (
    <>
      <path
        d={`M${SHOULDER_L.x - 9} ${SHOULDER_L.y}L${OFF_HAND.x - 7} ${OFF_HAND.y}L${OFF_HAND.x + 7} ${OFF_HAND.y}L${SHOULDER_L.x + 9} ${SHOULDER_L.y}z`}
      />
      <circle cx={OFF_HAND.x} cy={OFF_HAND.y} r={13} />
    </>
  ),
  head: (
    <>
      {/* ⛔ השיער ⛔ אינו קישוט — א4 (`T-216`) נוקבת בו בשמו, ולכן הוא שכבה מסומנת. */}
      <path
        data-arena-part="hair"
        d={`M${HEAD.x - HEAD_RADIUS} ${HEAD.y - 4}a${HEAD_RADIUS} ${HEAD_RADIUS} 0 0 1 ${HEAD_RADIUS * 2} 0q-8 -14 -${HEAD_RADIUS} -14q-24 0 -${HEAD_RADIUS} 14z`}
      />
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD_RADIUS} />
    </>
  ),
  mainHand: (
    <>
      <path
        d={`M${SHOULDER_R.x - 9} ${SHOULDER_R.y}L${MAIN_HAND.x - 7} ${MAIN_HAND.y}L${MAIN_HAND.x + 7} ${MAIN_HAND.y}L${SHOULDER_R.x + 9} ${SHOULDER_R.y}z`}
      />
      <circle cx={MAIN_HAND.x} cy={MAIN_HAND.y} r={13} />
    </>
  ),
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
     * 🧙 **⟦18/09 · `C-0718`⟧ הכובע המחודד — **הצללית** שאומרת «קוסם».**
     *
     * 🔬 **הפער שנמדד ב-`C-0718` בצילום ×5 של `[data-arena-figure=enemy]`, ⛔ ולא הוסק:**
     * ליריב היה **קו שיער של גיבור** (`BASE_LAYERS.head`, ‏`data-arena-part="hair"`) —
     * אותה צורה בדיוק שהגיבור נושא. ⇒ שתי הדמויות חלקו ראש זהה, וההבדל היחיד ביניהן
     * היה **הצבע**. ‏`kol-B-03-battle.png` מצייר חרוט אחד מקצה הכובע ועד שולי הגלימה.
     *
     * ⛔ **שכבה קיימת (`headgear`), ⛔ ולא שכבה שהומצאה** — `38 § 5`. ‏`armorer` כבר
     * מניח שם מצחייה, ⇒ זהו הערוץ, ⛔ ולא תקדים חדש.
     * ⛔ **ו⛔ אינו מועתק מ-`wizard_sprite`** (`38 § 5` אוסר): הוא נבנה על `HEAD` ועל
     * `HEAD_RADIUS` בלבד, כמו כל צורה אחרת בקובץ.
     * ⛔ **צבע התפקיד, ⛔ ולא צבע שני:** מילוי `currentColor` ⇒ הוא עובר את אותה
     * מדידת ניגודיות שכל שכבת בסיס עוברת (C-0502), גם במסך בחירת הדמות.
     *
     * 🔬 **והחוד נגזר מה-`viewBox`, ⛔ ולא נבחר — אחרי שהנחתי אותו גבוה מדי וזה נמדד:**
     * ניסיון ראשון שם את הקצה על `HEAD.y - HEAD_RADIUS - 46 = -142`, וה-`viewBox` מתחיל
     * ב-`-108` ⇒ **34 יחידות מתוך 46 נחתכו**, והכובע צויר כ**גג שטוח**. הצילום ב-×5
     * הראה זאת מייד. ⇒ הקצה יושב `8` מעל קודקוד הראש (`HEAD.y - HEAD_RADIUS = -96`),
     * כלומר `-104`, ⇒ **4 יחידות של מרווח** מתחת לגבול המסגרת.
     * ⛔ **וה-`viewBox` ⛔ לא הורחב כדי להכיל כובע גבוה יותר:** הוא נגזר מהעוגנים,
     * והגדלתו הייתה **מכווצת כל דמות בכל מסך** ב-14% — מחיר פריסה עבור 30 יחידות של
     * כובע. ⇒ הכובע התאים את עצמו למסגרת, ⛔ ולא להפך.
     */
    {
      layer: 'headgear',
      shape: (
        <path
          /* 🔬 **⟦`C-0719`⟧ השוליים עלו מעל העיניים — נמדד בצילום, ⛔ ולא נצפה מראש.**
             ‏`LAYER_ORDER` מציב את `headgear` **אחרי** `head` ⇒ הכובע נצבע **מעל**
             הפנים. בבסיס הקודם (`HEAD.y + 4`) חצי-הרוחב שלו בגובה העיניים הוא
             ‏**36.5** מול עיניים ב-`x = ±11` ⇒ **הוא כיסה את שתיהן לגמרי**, והצילום
             ב-×5 הראה קוסם בלי פנים. ⇒ השוליים ב-`HEAD.y - 13`, שישה יחידות מעל
             קצה העין העליון. */
          d={`M${HEAD.x} ${HEAD.y - HEAD_RADIUS - 8}L${HEAD.x + HEAD_RADIUS + 10} ${HEAD.y - 13}H${HEAD.x - HEAD_RADIUS - 10}z`}
        />
      ),
    },
    {
      layer: 'legs',
      shape: (
        <path
          d={`M${BODY.x - BODY_SIZE.width / 2} ${BODY.y + BODY_SIZE.height / 2 - 10}L${BOOT_L.x - 24} ${BOOT_L.y - 6}H${BOOT_R.x + 24}L${BODY.x + BODY_SIZE.width / 2} ${BODY.y + BODY_SIZE.height / 2 - 10}z`}
        />
      ),
    },
    /**
     * 👁️ **⟦18/09 · `C-0719`⟧ שתי עיניים זוהרות — הן, ⛔ ולא הצבע, שהופכות צללית לדמות.**
     *
     * 🔬 **ולמה **זוהרות** ⛔ ולא פנים כהות, וזו מדידה ⛔ ולא טעם:** ‏`kol-B-03-battle.png`
     * מצייר **פנים שחורות עם עיניים ורודות**, וניסיתי בדיוק את זה. השער החי
     * ‏(`verify-mobile.mjs:3315` — «`button svg *` מול הרקע, ≥ 3:1») מודד **כל צורה**
     * בתוך כפתור, ובמסך בחירת הדמות (`/dev/arcade/character`) הדמות **יושבת בתוך
     * `<button>` על כרטיס `--arena-card` (`#182138`)**. ⇒ דיסק בכחול-ליל (`#1c2642`)
     * על אותו כרטיס נותן **≈1.1:1** — הוא היה נופל בשער, ו**בצדק**: שם הוא בלתי-נראה.
     * ⇒ **הערוץ התהפך:** אותה תכונה בדיוק — «עיניים שאי-אפשר לפספס» — נבנית מ**בהיר
     * על כהה** במקום כהה על בהיר. וזה גם מה שהרנדר עושה בפועל: העיניים שם **זוהרות**.
     *
     * ⛔ **שכבה קיימת (`head`), ⛔ ולא שכבה שהומצאה.** הבסיס מצייר את הראש, והחתימה
     * יושבת מעליו — בדיוק סדר הציור ש-`38 § 4` קובע.
     * ⛔ **ו⛔ אין כאן `animation`:** «הצהרה ⛔ אינה אנימציה» (`35 § 5`), ותקציב הזוהר
     * של שכבה ב3 שייך לקלף. העיניים הן **צורה**, ⛔ לא הילה.
     */
    {
      layer: 'head',
      shape: (
        <g
          /* 🔬 **⟦`C-0719`⟧ דיו **בהיר**, והנימוק תוקן אחרי שבדקתי את הטענה שלי.**
             ניסיתי `text-ink` תחילה (הטוקן ש-`OUTLINE_CLASS` כבר משתמש בו) ונמדד
             שהוא נפתר ל-`rgb(15, 23, 42)` — **כהה**: `--ink` כאן הוא דיו על רקע בהיר.
             ⛔ **וכתבתי אז שהעיניים היו «בלתי-נראות» ⇒ ⛔ זה ⛔ לא היה נכון.** עין
             כהה על ראש סגול (`--arena-cast`) נותנת **6.8:1 מול הראש** — היא נראית
             מצוין. ‏1.12:1 שמדדתי הוא מול **הכרטיס**, וזו בדיוק המדידה שהשער עצמו
             מכריז כחסרת-משמעות לדמויות (`verify-mobile.mjs` — «בדיקת רקע ב-CSS
             ⛔ אינה רואה מילוי SVG ⇒ היא מפילה דמות שקריאה לחלוטין»).
             ⇒ **הבחירה היא עיצובית ⛔ ולא שער:** `kol-B-03-battle.png` מצייר עיניים
             **זוהרות**, וזוהר הוא בהיר-על-כהה. ‏`--arena-ink` נותן **2.59:1 מול הראש**
             ומייצר את אותו רושם.
             ⛔ **אפס hex** (כלל הקובץ) ⛔ ואפס טוקן חדש — הוא כבר חי ב-`arcade-tokens.css`.
             ⛔ **והנפילה היא `currentColor` בכוונה:** מחוץ לסקופ הזירה הטוקן ⛔ אינו
             מוגדר, והעיניים מקבלות את צבע התפקיד ⇒ הן פשוט ⛔ אינן נראות — כלומר
             **בדיוק המצב של היום**, ⛔ ולא נסיגה. */
          className="text-[color:var(--arena-ink,currentColor)]"
        >
          <circle cx={HEAD.x - 11} cy={HEAD.y - 2} r={5} />
          <circle cx={HEAD.x + 11} cy={HEAD.y - 2} r={5} />
        </g>
      ),
    },
    {
      layer: 'mainHand',
      shape: (
        <>
          <rect x={MAIN_HAND.x - 3} y={MAIN_HAND.y - 78} width={6} height={144} rx={3} />
          <circle cx={MAIN_HAND.x} cy={MAIN_HAND.y - 78} r={9} />
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
        const base = BASE_LAYERS[layer];
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
