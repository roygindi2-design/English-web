import { MAX_GAME_LEVEL } from '@/lib/core/arcadeLadder';
import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';
import type { CharacterSlot } from '@/lib/core/characterBase';

/**
 * `plan/37-arena-spec.md § 12` · `§ 9` · `plan/38-character-base.md § 2` —
 * **החוק של מסך הבית של הזירה, כשכבה טהורה.** T-181 · D-131 · D-132 · **D-135**.
 *
 * ⛔ **הרכיב מצייר ו⛔ אינו מחשב.** מסלול הבוס וארבע המשבצות נגזרים כאן ⇒
 * `components/ArenaHome.tsx` ⛔ אינו מחזיק `% 5` ו⛔ אינו מחזיק את המספר 5 כלל.
 * ‏`npm run check:core` מוודא שאין כאן React, `window`, `document`, רשת או שעון.
 */

type ArcadeItem = (typeof ARCADE_ITEMS)[number];

/** `37 § 9` — «בוס כל 5 ניצחונות», מילה במילה. */
export const BOSS_EVERY = 5;

/**
 * ⛔ שני צירים בלתי תלויים ו⛔ לא enum אחד של חמישה: `render_video_B.py:71`
 * (`BOSS_STATES`) מצייר שלושה צירופים — נוצח · הנוכחי · צומת הבוס — ו-enum שטוח היה
 * חייב להמציא שם לשניים שהוא ⛔ אינו מצייר לעולם.
 */
export interface BossNode {
  readonly state: 'done' | 'current' | 'pending';
  readonly isBoss: boolean;
}

/** ⛔ ניצחונות ⛔ אינם יכולים להיות שליליים ו⛔ אינם יכולים להיות NaN — הזירה ⛔ אינה כלי אבחון. */
function safeWins(wins: number): number {
  return Number.isFinite(wins) && wins > 0 ? Math.floor(wins) : 0;
}

/** תמיד בדיוק `BOSS_EVERY` צמתים; אינדקס 0 = הראשונה אחרי הבוס האחרון. */
export function bossTrack(wins: number): readonly BossNode[] {
  const done = safeWins(wins) % BOSS_EVERY;
  return Object.freeze(
    Array.from({ length: BOSS_EVERY }, (_unused, i): BossNode => ({
      state: i < done ? 'done' : i === done ? 'current' : 'pending',
      isBoss: i === BOSS_EVERY - 1,
    })),
  );
}

/** כמה ניצחונות חסרים עד צומת הבוס. 1..BOSS_EVERY. */
export function winsToBoss(wins: number): number {
  return BOSS_EVERY - (safeWins(wins) % BOSS_EVERY);
}

/**
 * `38 § 2`, מילה במילה. ⛔ **שבע ⛔ ולא שש** — הכותרת שם אומרת «שש» והטבלה מונה שבע
 * שורות; `lib/core/characterBase.ts` כבר הכריע לטובת הטבלה, וזו אותה רשימה בדיוק.
 * ‏(‏`03-for-roy` פריט 67 ⓑ מבקש מרוי לתקן את הכותרת — ⛔ ואינו חוסם.)
 */
export const SLOT_LABELS_HE: Readonly<Record<CharacterSlot, string>> = Object.freeze({
  head: 'ראש',
  shoulders: 'כתפיים',
  body: 'גוף',
  belt: 'מותן',
  mainHand: 'יד ראשית',
  offHand: 'יד משנית',
  legs: 'רגליים',
});

/**
 * D-132 — משבצת ופריט הם שני אוצרי מילים. ⛔ `ARCADE_ITEMS` ⛔ לא השתנתה, וכל פריט
 * **מצביע** על משבצתו — בדיוק הדפוס ש-`components/ArenaAvatar.tsx` (`ITEM_LAYERS`)
 * כבר משתמש בו לשכבות. ⛔ הטיפוס אוכף חמישה מפתחות ⇒ פריט שישי ⛔ אינו מהדר.
 *
 * ⛔ **`banner` היא `null` ו⛔ לא משבצת, וזו הכרעה ⛔ ולא השמטה:** D-135 קובע במפורש
 * ש«`banner` ⛔ אינה משבצת ציוד — היא באנר המילה שכבר מצויר מעל הבמה (`37 § 3`)».
 * ⇒ הטיפוס נושא `| null` במקום למפות אותה למשבצת שהיא ⛔ אינה שייכת לה.
 */
export const ITEM_SLOTS: Readonly<Record<ArcadeItem, CharacterSlot | null>> = Object.freeze({
  helmet: 'head',
  cape: 'body',
  lantern: 'offHand',
  boots: 'legs',
  banner: null,
});

/**
 * ארבע מתוך שבע — **D-135 (PM, C-0338), ⛔ ולא הכרעת-הביניים של DEV שקדמה לה.**
 *
 * ⚠️ התוכנית (`2026-08-28-arena-home.md`) קפאה על `mainHand · offHand · head · body`
 * כהכרעת DEV תחת `RULES § 0.22`, ופתחה עליה את **F-161**. ‏D-135 סגר את F-161 במדידה:
 * `mainHand` היא משבצת ש-**0 מתוך 5** הפריטים ב-`ARCADE_ITEMS` יכולים למלא — חריץ
 * שנשאר ריק לנצח על מסך שכל תכליתו להראות ללומד מה הרוויח — ואילו `legs` נמלאת בדיוק
 * על ידי `boots`. ⇒ **`mainHand` יורדת ו-`legs` נכנסת באותו מקום**, מחרוזת אחת,
 * והסדר נשאר סדר הרנדר מימין לשמאל (`render_video_B.py:167-176`).
 * ⛔ **ארבע ו⛔ לא חמש:** `37 § 12` נוקב בארבע, וזה מסמך עוגן.
 */
export const HOME_SLOTS: readonly CharacterSlot[] = Object.freeze([
  'legs',
  'offHand',
  'head',
  'body',
] as const);

export interface HomeSlot {
  readonly slot: CharacterSlot;
  readonly label: string;
  readonly item: ArcadeItem | null;
}

function isArcadeItem(name: string): name is ArcadeItem {
  return (ARCADE_ITEMS as readonly string[]).includes(name);
}

/** ⛔ שם מחוץ ל-`ARCADE_ITEMS` מדולג בשקט, בדיוק כמו ב-`<ArenaAvatar>`. */
export function homeSlots(unlocked: readonly string[]): readonly HomeSlot[] {
  const held = new Set(unlocked.filter(isArcadeItem));
  return Object.freeze(
    HOME_SLOTS.map((slot): HomeSlot => ({
      slot,
      label: SLOT_LABELS_HE[slot],
      item: ARCADE_ITEMS.find((i) => held.has(i) && ITEM_SLOTS[i] === slot) ?? null,
    })),
  );
}

/** `T-487` · `D-292` — אריח אחד בארון הציוד. `unlockLevel` ⇒ `null` כשהפריט מוחזק. */
export interface ClosetTile {
  readonly item: ArcadeItem;
  readonly held: boolean;
  readonly unlockLevel: number | null;
}

/**
 * `T-487` · `D-292` — **הארון מציג פריטים, ⛔ לא משבצות:** אריח לכל פריט ב-`ARCADE_ITEMS`,
 * בסדר שלהם. ‏`unlockLevel` **נגזר ⛔ ולא נבחר** — `arcadeResult.ts` מעניק בכל עליית רמה
 * את הפריט הראשון שאינו מוחזק (D-061) ⇒ הלא-מוחזק ה-k נפתח ב-`arcadeLevel + k`.
 * ⛔ רמה מעבר ל-`MAX_GAME_LEVEL` ⛔ אינה מגיעה לעולם (`applyWin` נעצר שם) ⇒ `null`,
 * כדי שהארון ⛔ לא יבטיח תנאי שהקוד ⛔ אינו מקיים.
 */
export function closetTiles(unlocked: readonly string[], arcadeLevel: number): readonly ClosetTile[] {
  const held = new Set(unlocked.filter(isArcadeItem));
  const base = Number.isFinite(arcadeLevel) && arcadeLevel >= 1 ? Math.floor(arcadeLevel) : 1;
  let k = 0;
  return Object.freeze(
    ARCADE_ITEMS.map((item): ClosetTile => {
      if (held.has(item)) return { item, held: true, unlockLevel: null };
      k += 1;
      const level = base + k;
      return { item, held: false, unlockLevel: level <= MAX_GAME_LEVEL ? level : null };
    }),
  );
}
