/**
 * `העולם` כמסך בית של אפליקציות — השכבה הטהורה (T-098 · § 4.2יא · D-046).
 *
 * ⛔ **המודול אינו יודע דבר על React, על HTTP ועל Supabase.** הוא מקבל מערך אריחים
 * שכבר תורגם מהתשובה, ומחזיר שתי הכרעות בלבד: מי האריח הגדול, וכמה אפליקציות פתוחות.
 *
 * שלוש ההכרעות כאן הן חוקי המשימה ⛔ ולא טעם:
 *
 * 1. **בדיוק שלושה אריחים** (‏C-0218 · T-110; היו שניים). § 4.2יא נוקבת ב«הרכבה»
 *    (קיים) וב«זירה» (T-095), ו-§ 4.2יב מוסיפה את «המילים שאספתי» ואומרת במפורש
 *    ש«מגיעים אליו מאריח» ⇒ בלי האריח השלישי המסך קיים ו⛔ אין אליו דרך הגעה.
 *    כלל המסננת באותו סעיף («אריח בלי תנאי מדיד ⛔ אינו נכנס לרשת») עדיין מוציא
 *    ספרייה, הודעות ומייל: לאף אחד מהם אין תנאי פתיחה נקוב במספר. הפער נרשם כ-F-072
 *    ⛔ ואינו מוסתר.
 *    ⚠️ האריח השלישי הוא **`open` תמיד** ⛔ ואינו `locked`: § 4.2יב מגדירה לו מצב ריק
 *    בעל פעולה אחת ⇒ ⛔ אין לו תנאי פתיחה נקוב במספר, ו-D-046 חל על אריח **נעול**
 *    ⛔ ולא על אריח פתוח עם אוסף ריק.
 *
 * 2. **מושבת נושא מספר** (D-046). `levelTooSmallNoteHe` בונה את הנוסח משני מספרים
 *    שהשרת החזיר (`required` · `eligible`) ⛔ ואינו כותב אותם בקוד — `12` חי במקום
 *    אחד בלבד, `ARCADE_MIN_WORDS` ב-`lib/core/arcadeRound.ts`.
 *
 * 3. **הגדול נבחר ⛔ ואינו מוגרל.** הראשון שיש בו חיוב פתוח **וגם** הוא פתוח; אין
 *    ⇒ האחרון הפתוח בסדר הרשת (= «האחרון שנפתח»); אין פתוח בכלל ⇒ `null`. ⛔ אין
 *    הגרלה ואין שעון — סדר הרשת הוא סדר הפתיחה ⛔ ולא «הכי בשימוש».
 *
 * ⛔ אפס מדדי משחק מסוג D-050 — הבדיקה סורקת את **המקור עצמו**, ולכן גם ההערה
 * הזאת ⛔ אינה מזכירה את השמות האסורים בשמם.
 */

export type WorldAppId = 'compose' | 'arcade' | 'collected';

export type AppState =
  /** פתוח: הלומד יכול להיכנס עכשיו. */
  | { readonly kind: 'open' }
  /** מושבת **עם מספר** (D-046). `noteHe` **חייב** להכיל ספרה — נאכף בבדיקה. */
  | { readonly kind: 'locked'; readonly noteHe: string }
  /** לא ידוע: הקריאה נכשלה. «—» ⛔ ולא «0». */
  | { readonly kind: 'unknown' };

export interface WorldApp {
  readonly id: WorldAppId;
  readonly labelHe: string;
  readonly href: string;
  readonly state: AppState;
  /** «חיוב שלא נגמר» — האריח שיש בו כזה מוצג גדול יותר (§ 4.2יא). */
  readonly hasActiveTask: boolean;
}

/** סדר הרשת = סדר הפתיחה, ו⛔ לא «הכי בשימוש» (ספירת שימוש היא עמודה חדשה — נדחתה). */
export const WORLD_APP_ORDER: readonly WorldAppId[] = ['compose', 'arcade', 'collected'];

export const WORLD_APP_LABEL_HE: Readonly<Record<WorldAppId, string>> = {
  compose: 'הרכבה',
  arcade: 'זירה',
  collected: 'המילים שאספתי',
};

export const WORLD_APP_HREF: Readonly<Record<WorldAppId, string>> = {
  compose: '/world/compose',
  arcade: '/arcade',
  collected: '/world/collected',
};

/** «נדרשות 12 מילים ברמה, יש 8». שני המספרים מהשרת ⛔ ואינם כתובים בקוד. */
export function levelTooSmallNoteHe(required: number, eligible: number): string {
  return `נדרשות ${required} מילים ברמה, יש ${eligible}`;
}

/** האריח הגדול: הראשון עם `hasActiveTask` שגם `open`; אין ⇒ **האחרון הפתוח** בסדר
 *  הרשת (= «האחרון שנפתח»); אין פתוח בכלל ⇒ `null`. ⛔ אין הגרלה ואין שעון. */
export function featuredAppId(apps: readonly WorldApp[]): WorldAppId | null {
  const busy = apps.find((a) => a.hasActiveTask && a.state.kind === 'open');
  if (busy !== undefined) return busy.id;
  const lastOpen = [...apps].reverse().find((a) => a.state.kind === 'open');
  return lastOpen?.id ?? null;
}

/** מדד ההצלחה ⓐ של § 4.2יא: «מה מתקדם = מספר האפליקציות הפתוחות». */
export function openAppCount(apps: readonly WorldApp[]): number {
  return apps.filter((a) => a.state.kind === 'open').length;
}
