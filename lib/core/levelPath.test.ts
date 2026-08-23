import { describe, expect, it } from 'vitest';

import type { CefrBand } from './cefrLevels';
import { buildLevelPath } from './levelPath';
import type { LevelSummary } from './levelSummary';

function summary(level: CefrBand, totalInLevel: number, known: number): LevelSummary {
  return {
    level,
    totalInLevel,
    known,
    inReviewList: 0,
    unseen: Math.max(0, totalInLevel - known),
  };
}

const SIX: readonly LevelSummary[] = [
  summary('A1', 315, 189),
  summary('A2', 116, 30),
  summary('B1', 37, 5),
  summary('B2', 8, 0),
  summary('C1', 0, 0),
  summary('C2', 0, 0),
];

describe('§ 4.2ז שורה 6 — שישה שבבים, בסדר, תמיד', () => {
  it('הרשימה חוזרת בסדר A1..C2 בדיוק', () => {
    expect(buildLevelPath(SIX, 'A1').map((c) => c.band)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('רשימה חסרה ⛔ אינה מקצרת את המסלול — רמה שלא נמסרה היא אפסים', () => {
    const path = buildLevelPath([summary('A1', 10, 5)], 'A1');
    expect(path).toHaveLength(6);
    expect(path.find((c) => c.band === 'C2')).toMatchObject({ totalInLevel: 0, known: 0, percent: 0 });
  });

  it('רשימה ריקה לגמרי ⇒ שישה שבבים ריקים, ⛔ ולא זריקה', () => {
    expect(buildLevelPath([], null)).toHaveLength(6);
  });
});

describe('R-017 — אחוז המילוי הוא ספירה, ⛔ ולא מוכנות', () => {
  it('189 מתוך 315 ⇒ 60', () => {
    expect(buildLevelPath(SIX, 'A1').find((c) => c.band === 'A1')?.percent).toBe(60);
  });

  it('אחוז הוא מספר שלם ⛔ ולא שבר שיגלוש למסך', () => {
    for (const chip of buildLevelPath(SIX, 'A1')) {
      expect(Number.isInteger(chip.percent)).toBe(true);
    }
  });

  it('רמה בלי מילים במאגר ⇒ אחוז 0 ⛔ ולא NaN (חלוקה באפס)', () => {
    const c1 = buildLevelPath(SIX, 'A1').find((c) => c.band === 'C1');
    expect(c1?.percent).toBe(0);
    expect(c1?.isEmpty).toBe(true);
  });

  it('האחוז חסום ל-0..100 גם על קלט בלתי אפשרי', () => {
    const path = buildLevelPath([summary('A1', 4, 9)], 'A1');
    expect(path.find((c) => c.band === 'A1')?.percent).toBe(100);
  });
});

describe('D-037 — הנוכחית מסומנת, ⛔ ואף אחת אינה נעולה', () => {
  it('רק הנוכחית נושאת isCurrent', () => {
    const path = buildLevelPath(SIX, 'B1');
    expect(path.filter((c) => c.isCurrent).map((c) => c.band)).toEqual(['B1']);
  });

  it('current = null ⇒ אף שבב אינו נוכחי, ⛔ ואין נפילה שקטה ל-A1', () => {
    expect(buildLevelPath(SIX, null).some((c) => c.isCurrent)).toBe(false);
  });

  it('⛔ אין ולו שדה אחד ששמו נעילה, סף או מוכנות', () => {
    const keys = Object.keys(buildLevelPath(SIX, 'A1')[0] ?? {});
    expect(keys).toEqual(['band', 'known', 'totalInLevel', 'isCurrent', 'isEmpty', 'percent']);
  });
});
