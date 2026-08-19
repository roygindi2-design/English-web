import { describe, expect, it } from 'vitest';
import {
  DECK_ALL_EMPTY_ACTION_HE,
  DECK_ALL_EMPTY_BODY_HE,
  DECK_ALL_EMPTY_HREF,
  DECK_ALL_EMPTY_TITLE_HE,
  allTilesDead,
} from './deckTiles';

/**
 * T-123 · D-064 — «אריח מושבת ⛔ אינו חוקי כאשר כל האריחים במסך מושבתים».
 * הכלל הוא על המסך ⛔ ולא על האריח, ולכן הפונקציה מקבלת את כולם.
 */
describe('allTilesDead', () => {
  it('שלושה מושבתים ⇒ המסך מת', () => {
    expect(allTilesDead([{ enabled: false }, { enabled: false }, { enabled: false }])).toBe(true);
  });

  it('אריח פעיל אחד מספיק כדי שהמסך יחיה', () => {
    expect(allTilesDead([{ enabled: true }, { enabled: false }, { enabled: false }])).toBe(false);
    expect(allTilesDead([{ enabled: false }, { enabled: false }, { enabled: true }])).toBe(false);
  });

  it('⛔ רשימה ריקה אינה «מסך מת» — היא מסך בלי אריחים, ומצב אחר', () => {
    // `[].every(...)` הוא `true` ב-JS, וזו בדיוק המלכודת: מסך שטרם בנה את
    // האריחים שלו היה מדווח «הכל מת» ומציג מצב ריק על לא כלום.
    expect(allTilesDead([])).toBe(false);
  });
});

describe('נוסח המצב הריק', () => {
  it('הפעולה מובילה ל-/study, המקום היחיד שבו StudyEmptyState חי', () => {
    expect(DECK_ALL_EMPTY_HREF).toBe('/study');
  });

  it('⛔ הנוסח אינו טוען שהמאגר ריק — קריאה שנכשלה נראית זהה', () => {
    expect(DECK_ALL_EMPTY_BODY_HE).not.toContain('ריק');
    expect(DECK_ALL_EMPTY_BODY_HE).not.toContain('אין מילים');
  });

  it('שלושת המחרוזות בעברית ו⛔ אינן ריקות', () => {
    for (const text of [
      DECK_ALL_EMPTY_TITLE_HE,
      DECK_ALL_EMPTY_BODY_HE,
      DECK_ALL_EMPTY_ACTION_HE,
    ]) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).toMatch(/[֐-׿]/);
    }
  });
});
