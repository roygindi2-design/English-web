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
