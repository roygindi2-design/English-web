import { describe, expect, it } from 'vitest';
import {
  STUDY_TRACKS,
  emptyTrackMetric,
  primaryStudyTrack,
  trackDestination,
  trackLabelHe,
  vocabularyMetric,
} from './studyTracks';
import type { LevelSummary } from './levelSummary';

function level(over: Partial<LevelSummary> & Pick<LevelSummary, 'level'>): LevelSummary {
  return { totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0, ...over };
}

describe('STUDY_TRACKS — הרישום, 36 § 9', () => {
  it('ארבעה מסלולים, בדיוק בסדר הזה', () => {
    expect(STUDY_TRACKS.map((t) => t.id)).toEqual(['vocabulary', 'grammar', 'writing', 'reading']);
  });

  it('התוויות בעברית ותואמות למפרט', () => {
    expect(trackLabelHe('vocabulary')).toBe('אוצר מילים');
    expect(trackLabelHe('grammar')).toBe('דקדוק');
    expect(trackLabelHe('writing')).toBe('כתיבה');
    expect(trackLabelHe('reading')).toBe('הבנת הנקרא');
  });
});

describe('vocabularyMetric — אפס הגדרה שנייה (§ 4.2ז)', () => {
  it('מסכם known/totalInLevel על פני שש הרמות, ⛔ לא מחשב מחדש', () => {
    const levels = [
      level({ level: 'A1', totalInLevel: 315, known: 189 }),
      level({ level: 'A2', totalInLevel: 80, known: 10 }),
      level({ level: 'B1', totalInLevel: 20 }),
      level({ level: 'B2', totalInLevel: 2 }),
      level({ level: 'C1' }),
      level({ level: 'C2' }),
    ];
    const metric = vocabularyMetric(levels);
    expect(metric).toEqual({ kind: 'measured', summaryHe: '199 מתוך 417 מילים ידועות' });
  });

  it('שש רמות באפס תוכן (מאגר ריק) — עדיין measured, ⛔ ולא empty: 0/0 הוא מספר אמיתי', () => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) =>
      level({ level: l as LevelSummary['level'] }),
    );
    expect(vocabularyMetric(levels)).toEqual({ kind: 'measured', summaryHe: '0 מתוך 0 מילים ידועות' });
  });
});

describe('primaryStudyTrack — T-145ⓑ, נגזר מ-STUDY_TRACKS ⛔ ולא קשיח', () => {
  it('אוצר מילים תמיד ⛔ אינו empty (vocabularyMetric תמיד measured) ⇒ הוא הראשון בסדר ⇒ הוא הראש', () => {
    const empty = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) =>
      level({ level: l as LevelSummary['level'] }),
    );
    expect(primaryStudyTrack(empty)).toBe('vocabulary');
  });

  it('גם עם התקדמות אמיתית — עדיין vocabulary, הראשון ב-STUDY_TRACKS', () => {
    const levels = [
      level({ level: 'A1', totalInLevel: 315, known: 189, inReviewList: 18, unseen: 108 }),
      level({ level: 'A2' }),
      level({ level: 'B1' }),
      level({ level: 'B2' }),
      level({ level: 'C1' }),
      level({ level: 'C2' }),
    ];
    expect(primaryStudyTrack(levels)).toBe('vocabulary');
  });
});

describe('emptyTrackMetric — מבנה ריק מוצהר, D-176 §ד', () => {
  it('דקדוק · כתיבה · הבנת הנקרא — 0 מתוך 0, ⛔ ולעולם לא «—»', () => {
    expect(emptyTrackMetric('grammar')).toEqual({
      kind: 'empty',
      summaryHe: 'אין עדיין פריטים בדקדוק (0 מתוך 0)',
    });
    expect(emptyTrackMetric('writing')).toEqual({
      kind: 'empty',
      summaryHe: 'אין עדיין פריטים בכתיבה (0 מתוך 0)',
    });
    expect(emptyTrackMetric('reading')).toEqual({
      kind: 'empty',
      summaryHe: 'אין עדיין פריטים בהבנת הנקרא (0 מתוך 0)',
    });
  });

  it('אף מחרוזת לא מכילה «—» — ⛔ הבדיקה של D-046/D-082', () => {
    for (const id of ['grammar', 'writing', 'reading'] as const) {
      expect(emptyTrackMetric(id).summaryHe).not.toContain('—');
    }
  });
});

describe('trackDestination — הדרך קדימה מכל מסלול (T-351)', () => {
  it('אוצר מילים מוביל אל `/cards`, המסך שבו מילים נלמדות בפועל', () => {
    const dest = trackDestination('vocabulary');
    expect(dest).not.toBeNull();
    expect(dest?.href).toBe('/cards');
    // ⛔ תווית ריקה היא כפתור בלי שם — כאן היא נבדקת, ⛔ לא מונחת.
    expect(dest?.labelHe.trim().length).toBeGreaterThan(0);
  });

  it('T-405 · הבנת הנקרא מוביל אל `/world/story`, המסך **שכבר בנוי**', () => {
    // 🔬 נמדד, ⛔ ולא שוער: `app/(tabs)/world/story/page.tsx` קיים, והוא היעד
    // שטבעת העולם עצמה כבר פותחת (`stories: { kind: 'open', href: '/world/story' }`).
    // ⛔ `36 § 9` סופר «12 סיפורים» תחת «תוכן קיים» ⇒ ⛔ אפס תוכן חדש, R-010 ⛔ לא נגע.
    const dest = trackDestination('reading');
    expect(dest).not.toBeNull();
    expect(dest?.href).toBe('/world/story');
    expect(dest?.labelHe.trim().length).toBeGreaterThan(0);
  });

  it('⛔ שני המסלולים בלי תוכן מחזירים `null`, ⛔ ולא נתיב שאינו קיים', () => {
    // D-176 §ד · `36 § 9`: לדקדוק ולכתיבה ⛔ אין מסך בנוי, ו`36 § 9` אוסר לייצר
    // להם תוכן (R-010). ⛔ קישור אליהם היה מבוי סתום — התקלה ש-T-351 נפתחה עליה.
    // ⟦צומצם ב-T-405 משלושה לשניים: `reading` קיבל יעד אמיתי, ⛔ ולא ויתור.⟧
    expect(trackDestination('grammar')).toBeNull();
    expect(trackDestination('writing')).toBeNull();
  });

  it('T-405 · מ-1 מסלול מתוך 4 עם כניסה ל-2 מתוך 4 — הספירה עצמה, ⛔ לא תחושה', () => {
    const withEntrance = STUDY_TRACKS.filter((t) => trackDestination(t.id) !== null);
    expect(withEntrance.length).toBe(2);
    expect(withEntrance.map((t) => t.id).sort()).toEqual(['reading', 'vocabulary']);
  });

  it('לכל מסלול ברישום יש הכרעה — ⛔ אף אחד ⛔ אינו מחזיר `undefined`', () => {
    // ⛔ `switch` בלי ענף למסלול חדש היה מחזיר `undefined`, שנראה על המסך
    // בדיוק כמו `null` אבל ⛔ אינו מצב מוצהר. הבדיקה נועלת את ההבדל.
    for (const track of STUDY_TRACKS) {
      const dest = trackDestination(track.id);
      expect(dest === null || typeof dest.href === 'string').toBe(true);
      expect(dest).not.toBeUndefined();
    }
  });

  it('⛔ כל נתיב מוחזר הוא פנימי ומוחלט, ⛔ ולא כתובת חיצונית', () => {
    for (const track of STUDY_TRACKS) {
      const dest = trackDestination(track.id);
      if (dest === null) continue;
      expect(dest.href.startsWith('/')).toBe(true);
      expect(dest.href).not.toMatch(/^https?:/);
    }
  });
});
