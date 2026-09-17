import { describe, expect, it } from 'vitest';
import {
  STUDY_TRACKS,
  emptyTrackMetric,
  primaryStudyTrack,
  readingTrackMetric,
  trackDestination,
  trackFallbackAction,
  trackLabelHe,
  trackMetric,
  trackModules,
  vocabularyMetric,
  MODULE_RETURN_LABEL_HE,
  moduleAnchorId,
  moduleItemHref,
  moduleReturnDestination,
  parseModuleAnchor,
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

describe('emptyTrackMetric — מבנה ריק מוצהר, D-176 §ד · T-406ⓐ', () => {
  it('T-406ⓐ · יחידת המדד היא של המסלול, ⛔ ו«פריטים» גנרי ⛔ אינה אחת מהן', () => {
    // `36 § 9` נותן שלוש יחידות מפורשות: `18/40 מילים` · `4/9 נושאים` ·
    // `3 חיבורים שנבדקו`. ⇒ שתיים מהן שייכות לשני המסלולים האלה.
    expect(emptyTrackMetric('grammar')).toEqual({
      kind: 'empty',
      summaryHe: 'עדיין אין נושאים במסלול הזה (0 מתוך 0)',
    });
    expect(emptyTrackMetric('writing')).toEqual({
      kind: 'empty',
      summaryHe: 'עדיין אין חיבורים שנבדקו במסלול הזה (0 מתוך 0)',
    });
  });

  it('⛔ אף מסלול ⛔ אינו מדבר עוד על «פריטים»', () => {
    for (const id of ['grammar', 'writing'] as const) {
      expect(emptyTrackMetric(id).summaryHe).not.toContain('פריטים');
    }
    expect(readingTrackMetric().summaryHe).not.toContain('פריטים');
  });

  it('אף מחרוזת לא מכילה «—» — ⛔ הבדיקה של D-046/D-082', () => {
    for (const id of ['grammar', 'writing'] as const) {
      expect(emptyTrackMetric(id).summaryHe).not.toContain('—');
    }
    expect(readingTrackMetric().summaryHe).not.toContain('—');
  });
});

describe('readingTrackMetric — מבנה מוצהר בלי ספירה מומצאת (T-405/T-406)', () => {
  it('⛔ אינו `empty`, ⛔ ואינו נושא מספר התקדמות', () => {
    const metric = readingTrackMetric();
    expect(metric.kind).toBe('declared');
    // ⛔ `36 § 9` ⛔ אינו נוקב יחידת מדד למסלול הזה ⇒ ספירה כאן הייתה המצאה.
    expect(metric.summaryHe).not.toMatch(/\d/);
  });
});

describe('trackMetric — נקודת הכניסה היחידה למדד (T-406)', () => {
  const levels: readonly LevelSummary[] = [
    level({ level: 'A1', totalInLevel: 10, known: 4, unseen: 6 }),
    level({ level: 'A2', totalInLevel: 5, known: 1, unseen: 4 }),
  ];

  it('אוצר מילים עם נתונים ⇒ `measured`, ובלי נתונים ⇒ `unreachable`', () => {
    expect(trackMetric('vocabulary', levels).kind).toBe('measured');
    expect(trackMetric('vocabulary', null).kind).toBe('unreachable');
  });

  it('⛔ שלושת האחרים ⛔ אינם `unreachable` — ⛔ אין מאחוריהם קריאת רשת', () => {
    for (const id of ['grammar', 'writing', 'reading'] as const) {
      expect(trackMetric(id, null).kind).not.toBe('unreachable');
    }
  });

  it('לכל מסלול ברישום יש מצב מדד — ⛔ אף אחד ⛔ אינו `undefined`', () => {
    for (const track of STUDY_TRACKS) {
      expect(trackMetric(track.id, levels)).toBeDefined();
    }
  });
});

describe('trackFallbackAction — הדבר האחד שאפשר לעשות עכשיו (T-406ⓑ)', () => {
  it('מסלול בלי יעד מקבל פעולה, ⛔ ולא פאנל ללא יציאה', () => {
    for (const id of ['grammar', 'writing'] as const) {
      const action = trackFallbackAction(id);
      expect(action).not.toBeNull();
      expect(action?.href.startsWith('/')).toBe(true);
      expect(action?.labelHe.trim().length).toBeGreaterThan(0);
    }
  });

  it('⛔ מסלול שכבר יש לו יעד ⛔ אינו מקבל פעולה שנייה (⛔ אין כפילות כוונה)', () => {
    expect(trackFallbackAction('vocabulary')).toBeNull();
    expect(trackFallbackAction('reading')).toBeNull();
  });

  it('T-406ⓑ · מ-2 פאנלים ללא יציאה ל-0 — הספירה עצמה', () => {
    const deadEnds = STUDY_TRACKS.filter(
      (t) => trackDestination(t.id) === null && trackFallbackAction(t.id) === null,
    );
    expect(deadEnds.length).toBe(0);
  });

  it('⛔ היעד שהפעולה מצביעה עליו הוא יעד **קיים** של מסלול אחר', () => {
    const known = STUDY_TRACKS.map((t) => trackDestination(t.id)?.href).filter(
      (h): h is string => typeof h === 'string',
    );
    const action = trackFallbackAction('grammar');
    expect(action).not.toBeNull();
    expect(known).toContain(action?.href);
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

describe('trackModules — נתיב המודולים, T-407 · 36 § 9', () => {
  /** ‏שש הרמות בדיוק כפי ש-`GET /api/levels/summary` מחזיר אותן. */
  const LEVELS: readonly LevelSummary[] = [
    { level: 'A1', totalInLevel: 315, known: 315, inReviewList: 0, unseen: 0 },
    { level: 'A2', totalInLevel: 80, known: 10, inReviewList: 4, unseen: 66 },
    { level: 'B1', totalInLevel: 20, known: 0, inReviewList: 0, unseen: 20 },
    { level: 'B2', totalInLevel: 2, known: 0, inReviewList: 0, unseen: 2 },
    { level: 'C1', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
    { level: 'C2', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
  ];

  it('ⓑ מודול לכל רמה, ⛔ ואפס שם שנכתב ביד — הרשימה נגזרת מהרמות עצמן', () => {
    // ⛔ R-010: «אוצר מילים A1 316 · A2 125 · B1 96 · B2 85» הוא **תוכן קיים**
    // ב-`36 § 9`, ⇒ המודולים הם אותן רמות ו⛔ לא רשימה חדשה.
    const modules = trackModules('vocabulary', LEVELS);
    expect(modules.map((m) => m.id)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('ⓐ שלושת המצבים שהרנדר מצייר נמדדים כאן, וכל אחד נושא תווית כתובה', () => {
    const modules = trackModules('vocabulary', LEVELS);
    const byId = new Map(modules.map((m) => [m.id, m]));
    expect(byId.get('A1')?.state).toBe('done');
    expect(byId.get('A2')?.state).toBe('current');
    expect(byId.get('B1')?.state).toBe('open');
    expect(byId.get('C1')?.state).toBe('empty');
    // ⛔ 36 § 12.7 — «⛔ אין קידוד מצב בצבע בלבד, אייקון ותווית תמיד»: התווית
    // ⛔ אינה אופציונלית, ⇒ ⛔ אף מודול ⛔ אינו יוצא בלי אחת.
    for (const m of modules) expect(m.stateLabelHe.length).toBeGreaterThan(0);
  });

  it('🔴 R-017 · ⛔ אפס נעילה בין רמות — רמה שיש בה מילים ⛔ לעולם אינה חסומה', () => {
    // `plan/20-alerts.md` R-017 (D-037), מילה במילה: «⛔ אין שער אחוזים ואין
    // נעילה בין רמות». ⇒ הרנדר מצייר «ייפתח אחרי A1» ו«נעול», והכלל גובר:
    // המצב היחיד שאינו פתוח הוא רמה שאין בה מילים, וזו עובדה על המאגר.
    const closed = trackModules('vocabulary', LEVELS).filter((m) => m.state === 'empty');
    expect(closed.map((m) => m.id)).toEqual(['C1', 'C2']);
    for (const m of trackModules('vocabulary', LEVELS)) {
      expect(m.stateLabelHe).not.toContain('נעול');
      expect(m.summaryHe).not.toContain('ייפתח אחרי');
    }
  });

  it('הספירה היא של הרמה עצמה, ⛔ ולא מספר שנוסח מחדש', () => {
    const a2 = trackModules('vocabulary', LEVELS).find((m) => m.id === 'A2');
    expect(a2?.summaryHe).toBe('10 מתוך 80 מילים ידועות');
  });

  it('פס ההתקדמות קיים אך ורק על המודול שבתהליך — כמו ברנדר', () => {
    const modules = trackModules('vocabulary', LEVELS);
    for (const m of modules) {
      if (m.state === 'current') expect(m.progress).toBeCloseTo(10 / 80);
      else expect(m.progress).toBeNull();
    }
  });

  it('הסדר הוא BAND_ORDER, ⛔ ולא הסדר שבו הנתיב החזיר את המערך', () => {
    const shuffled = [...LEVELS].reverse();
    expect(trackModules('vocabulary', shuffled).map((m) => m.id)).toEqual([
      'A1',
      'A2',
      'B1',
      'B2',
      'C1',
      'C2',
    ]);
  });

  it('ⓒ לשלושת המסלולים בלי תוכן ⛔ אין נתיב — המבנה הריק המוצהר של T-406 במקומו', () => {
    // `36 § 9`: «לדקדוק, כתיבה והבנת הנקרא ⛔ אין תוכן» ⇒ רשימה ריקה כאן היא
    // **הכרעה**, ⛔ ולא פער: הפאנל שלהם כבר מצהיר מה יהיה שם ונושא פעולה.
    for (const id of ['grammar', 'writing', 'reading'] as const) {
      expect(trackModules(id, LEVELS)).toEqual([]);
    }
  });

  it('⛔ קריאה שנכשלה ⛔ אינה נתיב ריק — `null` ⇒ ⛔ אין רשימה בכלל', () => {
    // ⛔ ההבדל בין «⛔ לא הצלחנו לטעון» ל«ריק» הוא בדיוק D-046/D-082: נתיב ריק
    // היה אומר ללומד «אין לך מודולים», וזו קביעה שאיש ⛔ לא מדד.
    expect(trackModules('vocabulary', null)).toEqual([]);
  });
});

describe('T-408 — הפריט נפתח מהנתיב, וחוזר אליו', () => {
  const LEVELS: readonly LevelSummary[] = [
    level({ level: 'A1', totalInLevel: 300, known: 300 }),
    level({ level: 'A2', totalInLevel: 100, known: 40 }),
    level({ level: 'B1', totalInLevel: 50, known: 0 }),
    level({ level: 'C1', totalInLevel: 0, known: 0 }),
  ];

  it('⛔ זהות המודול **היא** הרמה — ההנחה ש-`moduleItemHref` נשען עליה, נעוצה כאן', () => {
    // ⛔ בלי הבדיקה הזאת `band: module.id` הוא צירוף מקרים. איתה, שינוי
    // ב-`trackModules` מפיל את הבדיקה במקום לייצר כתובת שקטה עם רמה שגויה.
    expect(trackModules('vocabulary', LEVELS).map((m) => m.id)).toEqual(['A1', 'A2', 'B1', 'C1']);
  });

  it('ⓐ כל מודול שיש בו מילים נפתח — ⛔ ואין נעילה בין רמות (R-017)', () => {
    const modules = trackModules('vocabulary', LEVELS);
    const openable = modules.filter((m) => moduleItemHref('vocabulary', m) !== null);
    expect(openable.map((m) => m.id)).toEqual(['A1', 'A2', 'B1']);
  });

  it('ⓐ הכתובת נושאת את הרמה של המודול עצמו, ⛔ ולא את רמת הלומד', () => {
    const b1 = trackModules('vocabulary', LEVELS).find((m) => m.id === 'B1');
    expect(b1).toBeDefined();
    const href = moduleItemHref('vocabulary', b1!);
    expect(href).toContain('deck=level');
    expect(href).toContain('band=B1');
    expect(href).toContain('return=studies-module-vocabulary-B1');
  });

  it('⛔ מודול בלי מילים ⛔ אינו נפתח — היעדר תוכן, ⛔ ולא היעדר רשות', () => {
    const c1 = trackModules('vocabulary', LEVELS).find((m) => m.id === 'C1');
    expect(c1?.state).toBe('empty');
    expect(moduleItemHref('vocabulary', c1!)).toBeNull();
  });

  it('⛔ לשלושת המסלולים בלי תוכן ⛔ אין פריט לפתוח', () => {
    const a1 = trackModules('vocabulary', LEVELS)[0]!;
    for (const id of ['grammar', 'writing', 'reading'] as const) {
      expect(moduleItemHref(id, a1)).toBeNull();
    }
  });

  it('ⓑ+ⓒ החזרה היא אל הנתיב, על העוגן שממנו יצא', () => {
    const anchor = moduleAnchorId('vocabulary', 'A2');
    expect(moduleReturnDestination(anchor)).toEqual({
      href: '/studies#studies-module-vocabulary-A2',
      labelHe: MODULE_RETURN_LABEL_HE,
    });
    // ⛔ ולא לראש הרשימה: העוגן הוא חלק מהכתובת, ⛔ לא קישוט.
    expect(moduleReturnDestination(anchor)!.href).not.toBe('/studies');
  });

  it('⛔ ערך שאינו עוגן מודול ⛔ אינו הופך לכתובת — שער, ⛔ ולא פענוח', () => {
    for (const bad of [
      null,
      undefined,
      '',
      '/cards',
      'https://example.com',
      'studies-module-vocabulary-',
      'studies-module-vocabulary-A1/../../x',
      'studies-module-nosuchtrack-A1',
      'studies-module-vocabulary-A1?x=1',
    ]) {
      expect(parseModuleAnchor(bad as string | null), String(bad)).toBeNull();
      expect(moduleReturnDestination(bad as string | null), String(bad)).toBeNull();
    }
  });

  it('⛔ `#` מוביל נבלע — אותו עוגן בדיוק מגיע גם מ-`location.hash`', () => {
    expect(parseModuleAnchor('#studies-module-vocabulary-B2')).toEqual({
      trackId: 'vocabulary',
      moduleId: 'B2',
    });
  });
});
