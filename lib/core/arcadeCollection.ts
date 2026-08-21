/**
 * § 4.2יב · T-110 · D-053 — «המילים שאספתי». טהור, ⛔ אפס I/O.
 *
 * ⚠️ **רשימה, ⛔ ולא מנוע.** אין כאן תזמון, אין SM-2, ואין דירוג רמה. הצד הלימודי
 * חי במקום אחר לגמרי, וההפרדה הזאת היא D-052 — ⛔ לא העדפת סגנון.
 *
 * ⚠️ **שני המצבים הריקים הם שניים, ⛔ ולא אחד:** «עוד לא אספת מילים» היא הזמנה לשחק,
 * ו«הסתרת את כולן» היא מצב שהלומד יצר בעצמו ושהוא יכול להפוך. מסך שמציג את אותו
 * משפט בשניהם משקר ללומד על מה שקרה לאוסף שלו.
 */

/** שורת אוסף אחת כפי שהמסך מקבל אותה. ⛔ אין כאן שדה של הצד הלימודי. */
export interface CollectedWord {
  readonly wordId: string;
  readonly headword: string;
  readonly translationHe: string;
  readonly timesMissed: number;
  readonly firstSeenAt: string;
}

/** שלושת המצבים של המסך. */
export type CollectionView =
  | { readonly kind: 'list'; readonly words: readonly CollectedWord[] }
  | { readonly kind: 'empty' }
  | { readonly kind: 'all_hidden' };

export function viewCollection(input: {
  readonly visible: readonly CollectedWord[];
  readonly hiddenCount: number;
}): CollectionView {
  if (input.visible.length > 0) return { kind: 'list', words: input.visible };
  // ⛔ הסדר כאן הוא כל ההבחנה: אוסף ריק שהלומד הסתיר ממנו שורות ⛔ אינו אוסף ריק.
  return input.hiddenCount > 0 ? { kind: 'all_hidden' } : { kind: 'empty' };
}

/**
 * «נפגשת N פעמים». ⛔ המספר מגיע מהשרת ו⛔ אינו מחושב במסך.
 * ⚠️ יחיד ורבים ⛔ אינם אותה מחרוזת — «1 פעמים» הוא עברית שבורה.
 */
export function encountersHe(timesMissed: number): string {
  return timesMissed === 1 ? 'נפגשת פעם אחת' : `נפגשת ${timesMissed} פעמים`;
}

/**
 * «המילה שאספת אתמול» — הפריט האחרון שנאסף (D-071ⓑ · T-133).
 *
 * ⚠️ **«אתמול» כאן הוא הפריט האחרון, ⛔ ולא חלון זמן של 24 שעות.** לומד ששיחק לפני
 * שבוע ⛔ אינו מקבל שורה ריקה, ולומד ששיחק פעמיים היום ⛔ אינו מקבל שתי שורות. זו
 * ההכרעה של D-071ⓑ ⛔ ולא פשרה: חלון זמן היה הופך את הפִּין לנעלם ולחוזר בלי שהלומד
 * עשה דבר.
 *
 * ⚠️ **הקלט הוא הרשימה ה*גלויה* בלבד** — `hidden_by_learner=true` כבר נופל בשאילתה,
 * ולכן מילה שהלומד הסתיר ⛔ לעולם אינה מגיעה לכאן. ⛔ אין כאן סינון שני; סינון שני
 * היה טוען טענה שהמסננת האמיתית חיה כאן, והיא אינה.
 */
export interface CollectedLatest {
  readonly enText: string;
  readonly collectedAt: string;
}

/**
 * ⛔ **אין פריט אחרון ⇒ ⛔ אין שדה** (‏`undefined`, ⛔ לא `null` ו⛔ לא מחרוזת ריקה):
 * היעדר הפִּין הוא המצב הריק, ⛔ ולא «אין מילים אתמול» ככיתוב.
 *
 * ⚠️ הקלט ⛔ אינו ממוין כאן מחדש — הוא מגיע `first_seen_at desc` מהשאילתה, והמיון
 * הוא חוזה השדה `words` (‏`docs/api-contract.md`). מיון שני היה עולה על אוסף של 200
 * שורות בכל בקשה בלי להוסיף ולו טענה אחת.
 */
export function latestCollected(
  visible: readonly CollectedWord[],
): CollectedLatest | undefined {
  const first = visible[0];
  if (first === undefined) return undefined;
  // מילה בלי `headword` ⛔ אינה פִּין: «המילה שאספת אתמול — » הוא משפט קטוע.
  if (first.headword.length === 0) return undefined;
  return { enText: first.headword, collectedAt: first.firstSeenAt };
}
