import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('app/api/study/queue/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('סדר ההגנות — ⛔ קורא לא מזוהה אינו לומד אילו פרמטרים מתקבלים (דפוס C-0032)', () => {
  // ⚠️ נמדד על **אתרי הקריאה** ולא על השמות: שניהם מיובאים מאותה שורת `import`, ושם
  // הסדר אלפביתי — כלומר בדיקה על השם הייתה מודדת את סדר הייבוא ונכשלת על קוד תקין.
  it('בודק ENV לפני שהוא בכלל בונה לקוח', () => {
    expect(CODE.indexOf('readSupabaseEnv()')).toBeLessThan(CODE.indexOf('createRouteClient('));
  });

  it('בודק session לפני שהוא נוגע ב-searchParams', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('searchParams'));
  });

  it('אין session ⇒ 401 session_expired', () => {
    expect(CODE).toContain("code: 'session_expired'");
    expect(CODE).toContain('status: 401');
  });

  it('deck לא מוכר ⇒ 400, ⛔ ולא נפילה חזרה שקטה לחפיסה שהלומד לא ביקש', () => {
    expect(CODE).toContain('parseDeckName');
    expect(CODE).toContain('status: 400');
  });
});

describe('⛔ מחרוזת השגיאה של Supabase לעולם אינה נכנסת ל-JSON (אותה דרישה כמו T-053)', () => {
  it('כל שורה שנוגעת ב-error.message היא שורת console.error', () => {
    const leaks = CODE.split('\n').filter(
      (line) => line.includes('error.message') && !line.includes('console.error'),
    );
    expect(leaks).toEqual([]);
  });

  it('גוף התשובה מורכב מ-code קבוע בלבד', () => {
    expect(CODE).not.toMatch(/message:\s*error/);
    expect(CODE).not.toMatch(/detail:\s*error/);
  });
});

describe('מיפוי השגיאות — סכמה שלא הורצה היא 503 מוסבר, ⛔ לא 500 ולא מצב ריק', () => {
  it('שני קודי "הטבלה איננה" ממופים ל-schema_missing', () => {
    expect(CODE).toContain("'42P01'");
    expect(CODE).toContain("'PGRST205'");
    expect(CODE).toContain("code: 'schema_missing'");
  });

  it('ההודעה העברית זהה בקוד ובחוזה — ⛔ שני נוסחים הם שני מקורות אמת', () => {
    expect(CODE).toContain('המאגר עדיין לא הוקם');
    expect(CONTRACT).toContain('המאגר עדיין לא הוקם');
  });

  it('כל שגיאה אחרת היא 503 unavailable, ⛔ ואין 404 בשום מצב', () => {
    expect(CODE).toContain('status: 503');
    expect(CODE).not.toContain('status: 404');
    expect(CODE).not.toContain('status: 500');
  });
});

describe('D-034 — המיון הוא words.cefr_profile_band, ⛔ ולעולם לא senses.cefr_level', () => {
  it('⛔ המסלול אינו מזכיר את העמודה שאסור למיין לפיה', () => {
    expect(CODE).not.toContain('cefr_level');
  });

  it('הוא כן מושך את העמודה שכן ממיינים לפיה', () => {
    expect(CODE).toContain('cefr_profile_band');
  });

  it('המיון, הסינון וצורת החוט מיובאים מהשכבה הטהורה ⛔ ואינם משוכפלים כאן', () => {
    expect(CODE).toMatch(/from\s+'@\/lib\/core\/deck'/);
    expect(CODE).toContain('selectDeck(');
    expect(CODE).toContain('toQueueCardInput(');
  });

  // ⚠️ המסלול **כן** ממיין פעם אחת — בין המשמעויות של אותה מילה, לפי `sense_index`
  // (D-021). זו בחירת שורה ולא סדר תור. הבדיקה מפרידה בין השתיים: מיון יחיד, על
  // `sense_index` בלבד, ו⛔ אפס עקבות של פרימיטיבי סדר-התור בקובץ הזה.
  it('⛔ סדר התור אינו משוכפל כאן — המיון היחיד הוא בחירת המשמעות', () => {
    expect(CODE.match(/\.sort\(/g)).toHaveLength(1);
    expect(CODE).toMatch(/\.sort\(\s*\n?\s*\(a, b\) => \(a\.sense_index/);
    for (const queueOrdering of ['bandRank', 'CEFR_BAND_ORDER', 'nextReviewAtMs -', 'sortQueue']) {
      expect(CODE).not.toContain(queueOrdering);
    }
  });
});

describe('שתי החפיסות — ההבדל ביניהן הוא בשאילתה, לא בשני מסלולים', () => {
  it("מסנן התאריך תלוי ב-deck === 'due' ו⛔ אינו חל על unknown", () => {
    expect(CODE).toMatch(/deck === 'due'[\s\S]{0,200}lte\('next_review_at'/);
    expect(CODE.match(/lte\('next_review_at'/g)).toHaveLength(1);
  });

  it("חפיסת «לא ידעתי» מסוננת ב-isUnknownRow הטהור — ⛔ בלי טבלה חדשה ובלי מיגרציה", () => {
    expect(CODE).toContain('isUnknownRow');
  });

  it('יש תקרת שורות קשיחה על השאילתה', () => {
    expect(CODE).toMatch(/MAX_QUEUE_ROWS\s*=\s*200/);
    expect(CODE).toContain('.limit(MAX_QUEUE_ROWS)');
  });
});

describe('החוזה מתעדכן באותו קומיט (RULES, Dev § 5)', () => {
  it('לנתיב יש מדור משלו', () => {
    expect(CONTRACT).toContain('GET /api/study/queue');
  });

  it('שבעת המצבים מתועדים — כולל תור ריק שהוא 200 ולא שגיאה', () => {
    for (const state of ['schema_missing', 'session_expired', '"total"', '"cards"']) {
      expect(CONTRACT).toContain(state);
    }
  });

  it('החוזה מצהיר על אותו קבוע קידום שהמסלול מעביר לשכבה הטהורה', () => {
    expect(CODE).toMatch(/PROMOTE_AFTER_CONSECUTIVE_CORRECT\s*=\s*3/);
    expect(CONTRACT).toContain('PROMOTE_AFTER_CONSECUTIVE_CORRECT');
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * C-0099 — משימה 3 של `docs/superpowers/plans/2026-08-13-study-queue.md` (מילים
 * חדשות במנת היום) + תיקון **F-034** (סדר בשאילתה) ו-**F-035** (החוזה מול הקוד).
 *
 * ⚠️ `SRC` הוא המקור **עם** ההערות, ומשמש אך ורק לבדיקה אחת: שהערת `HEURISTIC`
 * נמצאת מעל שני פרמטרי המוצר. כל שאר הבדיקות רצות על `CODE` המנוקה — הערה אינה
 * הגנה, וזו בדיוק הסיבה שהניקוי קיים.
 */
const SRC = readFileSync('app/api/study/queue/route.ts', 'utf8');

describe('F-034 — סדר בשאילתה, ⛔ ולא 200 שורות שרירותיות', () => {
  /**
   * ⚠️ **הוצמד לשאילתה C-0318 (T-155), ⛔ והטענה ⛔ לא נחלשה — היא התחדדה.** מאז שיש
   * שתי שאילתות עם `MAX_QUEUE_ROWS` (‏`word_progress` ו-`words` של `deck=level`),
   * `indexOf` על הקובץ כולו היה מודד את התקרה של האחת מול הסדר של האחרת — כלומר טוען
   * טענה נכונה על צמד שגוי. ⇒ **כל שאילתה נמדדת בתוך עצמה**, ושתיהן נדרשות.
   */
  const queryRegion = (from: string): string => {
    const at = CODE.indexOf(from);
    expect(at, `expected the query ${from} in route.ts`).toBeGreaterThan(-1);
    const rest = CODE.slice(at);
    const end = rest.indexOf(';');
    return end === -1 ? rest : rest.slice(0, end);
  };

  it('יש order לפני התקרה — Postgres אינו מבטיח סדר שורות בלי order', () => {
    const progress = queryRegion(".select(PROGRESS_SELECT)");
    expect(progress.indexOf(".order('next_review_at'")).toBeGreaterThan(-1);
    expect(progress.indexOf('.limit(MAX_QUEUE_ROWS)')).toBeGreaterThan(
      progress.indexOf(".order('next_review_at'"),
    );
  });

  it('T-155 — גם שאילתת הרמה מסודרת לפני התקרה, ⛔ ולא 200 מילים שרירותיות', () => {
    const level = queryRegion(".eq('cefr_profile_band', band)");
    expect(level.indexOf(".order('ngsl_rank'")).toBeGreaterThan(-1);
    expect(level.indexOf('.limit(MAX_QUEUE_ROWS)')).toBeGreaterThan(
      level.indexOf(".order('ngsl_rank'"),
    );
  });

  it('שובר שוויון דטרמיניסטי — שתי בקשות זהות חותכות את אותן שורות', () => {
    expect(CODE).toContain(".order('word_id'");
  });

  it('תנאי «לא ידעתי» נדחף ל-SQL, כך שהתקרה חותכת את האוכלוסייה הנכונה', () => {
    expect(CODE).toMatch(/deck === 'unknown'[\s\S]{0,300}\.gt\('attempts', 0\)/);
    expect(CODE).toContain(".eq('repetition', 0)");
  });
});

describe('משימה 3 — מילים חדשות במנת היום (⛔ בלעדיה deck=due ריק לנצח ללומד חדש)', () => {
  it('שני פרמטרי המוצר קבועים במסלול עם הערת HEURISTIC, ⛔ ולא ב-/lib/core', () => {
    expect(CODE).toMatch(/NEW_CARDS_PER_DAY\s*=\s*5/);
    expect(CODE).toMatch(/SECONDS_PER_CARD\s*=\s*20/);
    expect(SRC).toMatch(/HEURISTIC[\s\S]{0,900}NEW_CARDS_PER_DAY/);
  });

  it('הבלם של planDailyQueue הוא שמחליט כמה מילים חדשות, ⛔ ולא מספר קשיח כאן', () => {
    expect(CODE).toMatch(/from\s+'@\/lib\/core\/queue'/);
    expect(CODE).toContain('planDailyQueue(');
  });

  it('daily_minutes נקרא מהפרופיל, ו-null הוא ברירת מחדל 10 ⛔ ולא "אפס דקות"', () => {
    expect(CODE).toContain("select('daily_minutes')");
    expect(CODE).toMatch(/DEFAULT_DAILY_MINUTES\s*=\s*10/);
  });

  it('המועמדים נשלפים בסדר רמה ואז תדירות — ⛔ לא בסדר שרירותי', () => {
    expect(CODE).toMatch(/\.order\('cefr_profile_band'[\s\S]{0,140}\.order\('ngsl_rank'/);
  });

  it('⛔ בלי not.in מרשימת מזהים — הסינון נעשה ב-excludeSeen הטהור', () => {
    expect(CODE).toContain('excludeSeen(');
    expect(CODE).not.toMatch(/\.not\(/);
  });

  // ⚠️ נמדד כסדר ולא כקרבה: בין מסנן השאילתה לבלם יושבים מיפוי השגיאות ושיטוח השורות,
  // ולכן בדיקת חלון-תווים על `deck === 'due'` הייתה נכשלת על קוד תקין. מה שבאמת נאכף
  // כאן הוא ש«לא ידעתי» חוזרת **לפני** שהבלם רץ — חפיסה של מילים שכבר נפגשו.
  it('רק deck=due מקבל מילים חדשות — ענף «לא ידעתי» חוזר לפני שהבלם בכלל רץ', () => {
    const planAt = CODE.indexOf('planDailyQueue(');
    expect(planAt).toBeGreaterThan(-1);
    const unknownGuard = CODE.lastIndexOf("if (deck === 'unknown')", planAt);
    expect(unknownGuard).toBeGreaterThan(-1);
    const earlyReturn = CODE.indexOf('return NextResponse.json({ ok: true', unknownGuard);
    expect(earlyReturn).toBeGreaterThan(unknownGuard);
    expect(earlyReturn).toBeLessThan(planAt);
  });

  it('כשל בשליפת המילים החדשות ⛔ אינו מפיל את התור — חצי תור עדיף על מסך שגיאה', () => {
    const at = CODE.indexOf('newWordsError');
    expect(at).toBeGreaterThan(-1);
    const branch = CODE.slice(at, at + 400);
    expect(branch).toContain('console.error');
    expect(branch).not.toContain('NextResponse');
  });
});

describe('החוזה מול הקוד — F-035', () => {
  it('החוזה מתאר את המילים החדשות ואת מקור מספרן', () => {
    for (const claim of ['NEW_CARDS_PER_DAY', 'planDailyQueue', 'daily_minutes']) {
      expect(CONTRACT).toContain(claim);
    }
  });

  // ⚠️ נמדד כ«אין שורה שמבטיחה 400 על limit» ולא כ«המחרוזת נעלמה»: התיקון עצמו **מסביר**
  // ש-`limit` פסול אינו מפיק 400, ולכן הצירוף מופיע בחוזה — בכוונה. בדיקה על היעלמות
  // המחרוזת הייתה מרשיעה בדיוק את התיעוד שסוגר את הממצא.
  it('⛔ אין בחוזה שורה שמבטיחה 400 על limit פסול — הקוד חותך אותו לברירת המחדל', () => {
    const promises400 = CONTRACT.split('\n').filter(
      (line) => line.includes('400') && line.includes('`limit`'),
    );
    expect(promises400).toEqual([]);
    expect(CONTRACT).toMatch(/limit[^\n]{0,120}נחתך/);
  });
});

describe('T-100 — interval_days נשלף, ⛔ ואינו מנוחש', () => {
  const SRC = readFileSync('app/api/study/queue/route.ts', 'utf8');

  it('העמודה בשאילתת ההתקדמות', () => {
    // ⛔ שדה שלא נשלף חוזר undefined ⇒ הדעיכה הייתה `none` לנצח, בשקט.
    expect(SRC).toMatch(/PROGRESS_SELECT[\s\S]{0,400}interval_days/);
  });

  it('מילה חדשה מקבלת 0 ⛔ ולא undefined', () => {
    expect(SRC).toMatch(/intervalDays:\s*0/);
  });
});

/**
 * T-165 · C-0321 — «משפטים», **צד קריאה בלבד**.
 *
 * ⛔ שלוש הסריקות כאן הן על **קוד חי** (הערות מוסרות למעלה), וכל אחת מהן מגינה על משהו
 * שהשכבה הטהורה ⛔ אינה יכולה להגן עליו: הרכב השאילתה, קודי השגיאה, ומה **אסור** שיצא
 * מהמסלול. סריקה חלשה מהרצה, ו⛔ היא חזקה מאינסוף מאין-בדיקה.
 */
describe('חפיסת «משפטים» — deck=sentences (T-165 · D-097)', () => {
  const BRANCH = (() => {
    const at = CODE.indexOf("if (deck === 'sentences')");
    return at === -1 ? '' : CODE.slice(at, CODE.indexOf("if (deck === 'level')"));
  })();

  it('הענף קיים ומחזיר לפני שאילתת word_progress', () => {
    expect(BRANCH).not.toBe('');
    // ⛔ נמדד מול `.select(PROGRESS_SELECT)` ⛔ ולא מול `from('word_progress')`: המחרוזת
    // השנייה מופיעה גם בפונקציית עזר שמוגדרת **מעל** ה-GET, ולכן היא ⛔ אינה מודדת סדר
    // ריצה כלל. השאילתה של מנת היום היא זו שאסור לשלם עליה, והיא זו שנמדדת.
    expect(CODE.indexOf("if (deck === 'sentences')"))
      .toBeLessThan(CODE.indexOf('.select(PROGRESS_SELECT)'));
  });

  it('מוטציה: הרמה היא words.cefr_profile_band, ⛔ ולעולם לא senses.cefr_level (D-034)', () => {
    expect(CODE).not.toMatch(/senses[^\n]*cefr_level/);
    expect(CODE).toMatch(/SENTENCES_SELECT[\s\S]{0,300}cefr_profile_band/);
  });

  it('מוטציה: current_level ריק ⇒ no_level 409, ⛔ ולעולם לא A1', () => {
    expect(BRANCH).toContain("'no_level'");
    expect(BRANCH).not.toMatch(/current_level[^\n]*\?\?\s*'A1'/);
    expect(BRANCH).not.toContain("'A1'");
  });

  it('⛔ אפס קוד שגיאה חדש — אותם שלושה בדיוק', () => {
    expect(BRANCH).toContain('schema_missing');
    expect(BRANCH).toContain("'42P01'");
    expect(BRANCH).toContain("'PGRST205'");
  });

  it('⛔ צד קריאה: `/api/review` ⛔ אינו מופיע בקובץ הזה בשם (T-165ⓒ)', () => {
    expect(CODE).not.toContain('/api/review');
  });

  it('⛔ ואין בענף שום כתיבה — אפס upsert/insert/update', () => {
    for (const write of ['upsert', '.insert(', '.update(', 'applyPractice']) {
      expect(BRANCH).not.toContain(write);
    }
  });

  it('⛔ ההחרגה של low ⛔ אינה משוכפלת כאן — היא ב-RLS (D-013)', () => {
    expect(CODE).not.toContain('translation_confidence');
  });

  it('total נספר לפני החיתוך — אחרת המונה של האריח משקר', () => {
    expect(BRANCH).toMatch(/total:\s*allItems\.length/);
    expect(BRANCH).toMatch(/items:\s*allItems\.slice\(0,\s*limit\)/);
  });

  it('החוזה מתאר את החפיסה ואת צורת התשובה השונה שלה', () => {
    expect(CONTRACT).toContain('deck=sentences');
    expect(CONTRACT).toContain('near_synonym');
    // T-199ⓐ · D-169 — the contract names the OPEN screen, ⛔ never the deleted narrow gate.
    expect(CONTRACT).toContain('D-169');
    expect(CONTRACT).not.toContain('parseFlashcardDeckName');
  });

  /**
   * T-066 · D-156 ⓒ — the back of the card rides the row: `translation_he` and the neutral
   * example are SELECTED, ⛔ not fetched by a second query, and a word with no translation
   * is dropped in `toSentenceCandidate` ⛔ rather than rendered with an empty back.
   */
  it('T-066 — SENTENCES_SELECT נושא translation_he ו-sense_examples, ⛔ ואפס צירוף רביעי', () => {
    const select = CODE.slice(CODE.indexOf('const SENTENCES_SELECT'), CODE.indexOf('type ExampleRow'));
    expect(select).toContain('translation_he');
    expect(select).toContain('sense_examples(kind, text_en)');
    expect((select.match(/!inner/g) ?? []).length).toBe(3);
  });

  it('T-066 — מילה בלי תרגום ⛔ אינה מועמדת: toSentenceCandidate מחזירה null', () => {
    const fn = CODE.slice(CODE.indexOf('function toSentenceCandidate'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    expect(body).toContain('translation_he');
    expect(body).toContain("kind === 'neutral'");
    expect(body).toMatch(/backSense === undefined\) return null/);
    expect(body).toContain('translationHe:');
    expect(body).toContain('exampleNeutral');
  });
});

/**
 * 📍 **`T-400` · `F-272` · `D-260` — «נשארו N מילים ברמה» נוסע באותה תשובה.**
 *
 * 🔬 **נמדד `C-0663`, ⛔ ולא שוער:** `<StudyDeckScreen>` ⛔ אינו מחזיק את המספר, ושתי
 * הדרכים הישירות אליו אסורות — קריאה שנייה ל-`/api/levels/summary` סותרת את `§ 4.2ז`,
 * והרמת מצב ל-`<LevelMapScreen>` חוצה למסך אחר. ⇒ השדה יורד עם התור.
 *
 * ⛔ שומר-מקור, ⛔ ולא בדיקת ריצה: אין כאן Supabase. מה שהוא כן סוגר הוא בדיוק
 * הקבוצה שהייתה נטענת ⛔ ולא נמדדת — שההגדרה ⛔ אינה נכתבת פעם שנייה ב-SQL, שהמכנה
 * הוא ספירת-ראש ⛔ ולא אורך הרשימה החתוכה, ושספק מחזיר היעדר ⛔ ולא מספר קטן יותר.
 */
describe('T-400 — `unseen` בחפיסת `level`, ⛔ בלי בקשה שנייה ו⛔ בלי הגדרה שנייה', () => {
  /**
   * ⚠️ **גוף הפונקציה, ⛔ ולא «מכאן ועד סוף הקובץ».** חיתוך פתוח היה גורר איתו את כל
   * המסלול שמתחתיו — כולל `status: 503` של ענפים אחרים — וכל טענת «⛔ אינו מכיל» כאן
   * הייתה נמדדת על קוד של מישהו אחר. הגבול הוא ההצהרה הבאה בקובץ.
   */
  const readLevelUnseenBody = () =>
    CODE.slice(
      CODE.indexOf('async function readLevelUnseen'),
      CODE.indexOf('async function loadSentenceCandidates'),
    );

  it('⛔ אפס ספירה חדשה — החשבון הוא `summarizeLevel` של השכבה הטהורה', () => {
    expect(CODE).toContain('summarizeLevel');
    expect(CODE).toContain("from '@/lib/core/levelSummary'");
    // ⛔ ולא `count` על `word_progress`: זו הייתה ההגדרה המקבילה ש-`§ 4.2ז` אוסר בשמה.
    expect(CODE).not.toMatch(/from\('word_progress'\)[\s\S]{0,200}count:\s*'exact'/);
  });

  it('המכנה הוא ספירת-ראש על `words`, ⛔ ולא אורך הרשימה החתוכה ב-MAX_QUEUE_ROWS', () => {
    const helper = readLevelUnseenBody();
    expect(helper).toContain("count: 'exact', head: true");
    expect(helper).toContain("eq('cefr_profile_band', band)");
    // A1 מחזיקה 315 מילים ו-`MAX_QUEUE_ROWS` הוא 200 ⇒ `levelRows.length` ⛔ אינו הרמה.
    expect(helper).not.toContain('levelRows.length');
  });

  it('⛔ ולעולם לא `senses.cefr_level` — D-034 חל גם על הספירה הזאת', () => {
    expect(readLevelUnseenBody()).not.toContain('cefr_level');
  });

  it('תקרה · רמה לא מוכרת · כשל קריאה ⇒ `null`, ⛔ ולא מספר מחמיא', () => {
    const helper = readLevelUnseenBody();
    expect(helper).toContain('MAX_SEEN_ROWS');
    expect(helper).toContain('return null');
    // ⛔ ואינו מפיל את החפיסה: הכרטיסים הם העיקר, השורה ⛔ אינה שווה 503.
    expect(helper).not.toContain('status: 503');
  });

  it('השדה נעדר כשאין מספר — ⛔ ולא `unseen: null` על החוט', () => {
    expect(CODE).toContain('...(unseen === null ? {} : { unseen })');
    expect(CODE).not.toContain('unseen: null');
  });

  it('⛔ אפס בקשה שנייה — הוא יוצא בתשובה שהמסך כבר מחכה לה', () => {
    // הענף של `level` הוא היחיד שמחשב אותו, וכל השאר ⛔ אינם משתנים.
    const levelBranch = CODE.slice(
      CODE.indexOf("if (deck === 'level')"),
      CODE.indexOf('let query = supabase'),
    );
    expect(levelBranch).toContain('readLevelUnseen(supabase, user.id, band)');
    expect(CODE).not.toContain('/api/levels/summary');
  });

  it('החוזה מתעדכן באותו קומיט — `unseen` מתועד ב-`docs/api-contract.md`', () => {
    expect(CONTRACT).toContain('`unseen`');
    expect(CONTRACT).toContain('נשארו N מילים ברמה');
  });
});

describe('T-408 — `?band=` בחפיסת `level`: מה נסרק, ⛔ ולא מי רשאי', () => {
  const levelBranch = CODE.slice(
    CODE.indexOf("if (deck === 'level')"),
    CODE.indexOf('let query = supabase'),
  );

  it('הרמה עוברת דרך `parseLevel` — ⛔ ולא מגיעה לשאילתה כמות שהיא', () => {
    expect(levelBranch).toContain("const rawBand = params.get('band')");
    expect(levelBranch).toContain('parseLevel(rawBand)');
  });

  it('⛔ ערך שאינו רמה הוא 400 — ⛔ ולא נפילה שקטה לרמת הלומד', () => {
    // אותה הכרעה בדיוק ש-`deck` עצמה עושה מעל: חפיסה שהלומד ⛔ לא ביקש היא הכשל.
    expect(levelBranch).toMatch(/rawBand !== null && requestedBand === null[\s\S]{0,160}status: 400/);
  });

  it('⛔ הפרופיל ⛔ אינו נקרא כשהרמה בכתובת — ⛔ אין תשלום על קריאה שהתשובה אינה תלויה בה', () => {
    expect(levelBranch).toMatch(/if \(band === null\)[\s\S]{0,400}readCurrentLevel\(supabase, user\.id\)/);
  });

  it('שתי השאילתות קוראות את אותה רמה — ⛔ אין שתי הגדרות של «הרמה הזאת»', () => {
    // ⟦T-411⟧ החתימה קיבלה שלישי (`cursor`), והטענה ⛔ לא נחלשה: היא עדיין מודדת ש**אותה**
    // `band` מגיעה לשתי השאילתות, ⛔ ולא שהחתימה ⛔ לא זזה לעולם.
    expect(levelBranch).toContain('loadLevelWords(supabase, band, cursor)');
    expect(levelBranch).toContain('readLevelUnseen(supabase, user.id, band)');
    expect(levelBranch).not.toContain('profile.level)');
  });

  it('החוזה מתעדכן באותו קומיט — `?band=` מתועד ב-`docs/api-contract.md`', () => {
    expect(CONTRACT).toContain('`?band=<A1..C2>`');
  });
});

/**
 * `T-411` · `F-277` · `D-266` — «סינון מילים» ממשיך מאיפה שהלומד עצר.
 *
 * ⛔ **הבדיקות כאן הן על קוד חי** (ההערות הוסרו למעלה), וכל אחת מהן מגינה על משהו שהשכבה
 * הטהורה ⛔ אינה יכולה להגן עליו: הרכב השאילתה, **מתי** הסמן זז, ומה ⛔ אסור שייכנס לנתיב.
 */
describe('T-411 — סמן-מקום ב-«סינון מילים», ⛔ ולא סינון לפי דירוג', () => {
  const levelBranch = CODE.slice(
    CODE.indexOf("if (deck === 'level')"),
    CODE.indexOf('let query = supabase'),
  );

  it('הסמן נקרא לפני העמוד — הוא **הפרדיקט** של העמוד, ⛔ ולא קישוט', () => {
    expect(levelBranch).toContain('readLevelCursor(supabase, user.id, band)');
    expect(levelBranch.indexOf('readLevelCursor(')).toBeLessThan(
      levelBranch.indexOf('loadLevelWords('),
    );
  });

  it('🔴 הסמן זז כשהחפיסה **מוגשת**, ⛔ ולא כשהלומד מדרג — זה כל הממצא', () => {
    // ⛔ ל**כרטיס האחרון שנשלח בפועל**, ⛔ ולא לשורה האחרונה שנקראה: השורות שמעבר ל-`limit`
    // ⛔ לא הוצגו, ודילוג עליהן הוא בדיוק עשרים המילים ש-`F-277` אומרת שהלומד ⛔ אינו רואה.
    expect(levelBranch).toContain('const served = levelPage.rows.slice(0, limit)');
    expect(levelBranch).toMatch(
      /const lastServed = served\[served\.length - 1\][\s\S]{0,400}advanceLevelCursor\(/,
    );
  });

  it('⛔ אפס `not.in` ו⛔ אפס `offset` — `deck.ts:196` כבר מדד למה הכתובת נשברת', () => {
    expect(CODE).not.toContain('.not(');
    expect(CODE).not.toContain('.range(');
    expect(CODE).not.toMatch(/offset/i);
  });

  it('⛔ הסמן ⛔ אינו נגזר מ-`word_progress` — `D-032`/`D-033`', () => {
    const cursorRegion = CODE.slice(
      CODE.indexOf('async function readLevelCursor'),
      CODE.indexOf('async function loadLevelWords'),
    );
    expect(cursorRegion).not.toContain('word_progress');
    expect(cursorRegion).toContain("from('study_level_cursor')");
  });

  it('⛔ קריאה שנכשלה ⛔ אינה מפילה את החפיסה — הכרטיסים הם העיקר', () => {
    const cursorRegion = CODE.slice(
      CODE.indexOf('async function readLevelCursor'),
      CODE.indexOf('async function loadLevelWords'),
    );
    expect(cursorRegion).not.toContain('status: 503');
    expect(cursorRegion).toContain('console.error');
  });

  it('המפתח הוא **הצמד** — `ngsl_rank` לבדו מת על הנתונים שיש (0 מתוך 476)', () => {
    expect(CODE).toContain("select('last_ngsl_rank, last_word_id')");
    expect(CODE).toContain(".order('id', { ascending: true })");
    expect(CODE).toContain('lastNgslRank: number | null');
  });

  it('הטבלה קיימת כמיגרציה בריפו, ⛔ ולא רק במסד החי', () => {
    expect(readFileSync('supabase/migrations/0028_study_level_cursor.sql', 'utf8')).toContain(
      'create table if not exists public.study_level_cursor',
    );
  });

  it('החוזה מתעדכן באותו קומיט — `docs/api-contract.md` מתאר את הסמן', () => {
    expect(CONTRACT).toContain('study_level_cursor');
    expect(CONTRACT).toContain('T-411');
  });
});
