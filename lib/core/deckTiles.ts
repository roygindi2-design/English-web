/**
 * PURE. ⛔ No React, no DOM, no clock, no env, no I/O.
 *
 * T-123 · D-064 — הכלל המתוקן של § 4.2ו.
 *
 * «אריח מושבת עם המספר שלו» נשאר נכון ו⛔ לא בוטל. מה ש-D-064 אוסר הוא **מסך
 * שכל האריחים בו מושבתים**: במצב הזה ⛔ אין ללומד שום פעולה, ו-`/study` —
 * המקום היחיד שבו `<StudyEmptyState>` חי — הופך בלתי-נגיש. נמדד C-0207.
 */

export interface TileState {
  readonly enabled: boolean;
}

/**
 * ⛔ `tiles.every(...)` לבדו שגוי: `[].every(...)` הוא `true` ב-JS, ולכן מסך
 * שטרם בנה את האריחים שלו היה מדווח «הכל מת» ומציג מצב ריק על לא כלום.
 */
export function allTilesDead(tiles: readonly TileState[]): boolean {
  if (tiles.length === 0) return false;
  return tiles.every((tile) => !tile.enabled);
}

export const DECK_ALL_EMPTY_TITLE_HE = 'אין מה לתרגל כרגע';
/**
 * ⛔ הנוסח אינו אומר «המאגר ריק»: קריאה שנכשלה מגיעה לאותו מצב בדיוק, ומשפט
 * שקובע עובדה על המאגר מתוך קריאה שלא הגיעה הוא טענה שאיש לא מדד — אותו כלל
 * שבגללו `<DeckSelector>` מציג «—» ו⛔ לא `0`.
 */
export const DECK_ALL_EMPTY_BODY_HE = 'אפשר לפתוח את הכרטיסיות ולראות מה מחכה שם.';
export const DECK_ALL_EMPTY_ACTION_HE = 'פתיחת הכרטיסיות';
/** ⛔ לא `/cards` — הלומד כבר שם. `/study` הוא המסך שנושא את `<StudyEmptyState>`. */
export const DECK_ALL_EMPTY_HREF = '/study';
