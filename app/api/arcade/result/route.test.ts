import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('app/api/arcade/result/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

/**
 * F-092 · גוף התשובה עבר לשכבה הטהורה (`plan.response`), ולכן שני שומרים ותיקים
 * ⛔ אינם יכולים עוד לחפש `missed: plan.missed` במחרוזת הנתיב — הם נמדדים **שם**.
 * ⛔ הם ⛔ לא נמחקו: הטענה «מה שהלומד מקבל» נשמרה, רק הועברה לקובץ שבו היא חיה.
 */
const PURE = readFileSync('lib/core/arcadeResult.ts', 'utf8');
const RESPONSE_LITERAL = PURE.slice(
  PURE.indexOf('const response: ArcadeResultResponse = {'),
  PURE.indexOf('};', PURE.indexOf('const response: ArcadeResultResponse = {')),
);

describe('⛔ הכתיבה נוגעת בשתי טבלאות הזירה בלבד (D-044 · § 4.2י מדד ⓐ)', () => {
  const written = [...CODE.matchAll(/\.from\('([a-z_]+)'\)\s*\.(?:upsert|insert|update|delete)\(/g)]
    .map((m) => m[1]);

  it('שלוש הטבלאות, ותו לא', () => {
    expect([...new Set(written)].sort())
      .toEqual(['arcade_collected_words', 'arcade_progress', 'arcade_runs']);
  });

  // T-109 · הכרעה א׳ — האוסף נקרא **לפני** שהתוכנית נבנית, כי `times_correct` עולה רק
  // על מפתח קיים; קריאה אחרי הבנייה הייתה הופכת את התנאי הזה למת.
  it('האוסף **נקרא** לפני שהתוכנית נבנית, ומסונן ללומד', () => {
    expect(CODE).toContain(".from('arcade_collected_words')");
    expect(CODE.indexOf("from('arcade_collected_words')"))
      .toBeLessThan(CODE.indexOf('planArcadeWrites('));
    const read = CODE.slice(CODE.indexOf("from('arcade_collected_words')"),
                            CODE.indexOf('planArcadeWrites('));
    expect(read).toContain(".eq('user_id', user.id)");
  });

  it('⛔ upsert על המפתח המורכב, ⛔ ולא על user_id לבדו', () => {
    expect(CODE).toContain("onConflict: 'user_id,word_id'");
  });

  it.each(['word_progress', 'profiles', 'words', 'senses'])('⛔ %s אינו נכתב', (table) => {
    expect(written).not.toContain(table);
  });

  it('⛔ word_progress אינו מופיע בקובץ בכלל — גם לא בקריאה', () => {
    expect(CODE).not.toContain('word_progress');
  });

  it.each(['easiness', 'interval_days', 'repetition', 'next_review_at',
           'self_marked_known', 'current_level'])('⛔ %s אינו מופיע בקובץ', (column) => {
    expect(CODE).not.toContain(column);
  });
});

describe('סדר ההגנות (F-004 · C-0032)', () => {
  it('גוף שאינו אובייקט ⇒ 400, ⛔ לא 500', () => {
    expect(CODE).toContain('Array.isArray(payload)');
    expect(CODE).toContain('status: 400');
  });

  it('session נבדק לפני שהגוף מאומת', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('parseAnswers(body.answers)'));
  });

  it('תשובות פגומות ⇒ 422 בעברית, ⛔ ולא כתיבה', () => {
    expect(CODE).toContain('status: 422');
    expect(CODE).toContain('fieldErrors');
    expect(CODE.indexOf('status: 422')).toBeLessThan(CODE.indexOf('.upsert('));
  });

  it('⛔ אין cast עיוור על הגוף — כל שדה נבדק בטיפוסו', () => {
    const parser = CODE.slice(CODE.indexOf('function parseAnswers'), CODE.indexOf('export async function POST'));
    for (const guard of ["typeof a.wordId !== 'string'", "typeof a.correct !== 'boolean'"]) {
      expect(parser).toContain(guard);
    }
  });
});

describe('הנתיב אינו מחליט', () => {
  it('קורא ל-planArcadeWrites ומחיל את השורות שחזרו', () => {
    expect(CODE).toContain('planArcadeWrites(');
    expect(CODE).toContain('for (const write of plan.rows)');
  });

  it('⛔ אין ניקוד, מטבע, XP או לוח תוצאות (D-050)', () => {
    // F-065 — המדידה היא בגבול מזהה ⛔ ולא substring גולמי. נמדד ב-C-0182 על מימוש
    // ⛔ שאין בו ולו הפרה אחת: `xp` יושב בתוך `export`, ולכן `toContain('xp')` הכשיל
    // קובץ נקי. ⛔ הפעולה הזולה — לשנות את שם ה-export — לא נעשתה; המדידה תוקנה.
    for (const token of ['score', 'points', 'xp', 'coins', 'leaderboard', 'streak']) {
      expect(CODE.toLowerCase()).not.toMatch(new RegExp(`\\b${token}\\b`));
    }
  });

  it('«המילים שהפילו אותך» חוזר בתשובה ⛔ ואינו נכתב (D-047)', () => {
    const writes = CODE.slice(CODE.indexOf('for (const write of plan.rows)'), CODE.lastIndexOf('return NextResponse.json'));
    expect(writes).not.toContain('missed');
    expect(CODE.slice(CODE.lastIndexOf('return NextResponse.json'))).toContain('plan.response');
    expect(RESPONSE_LITERAL).toMatch(/(^|\s)missed,/);
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('POST /api/arcade/result');
  });
});

describe('D-059 — ⛔ המילה «הפסדת» אינה קיימת במוצר', () => {
  const files = [
    // ⚠️ **C-0325 — שני נתיבים הוחלפו, ⛔ ולא הוסרו:** `components/ArenaBoard.tsx` ⇢
    // `components/ArenaBattle.tsx` ו-`lib/core/arcadeBattle.ts` ⇢ `lib/core/battle.ts`
    // (T-176 · T-177, פרישה בצעד 9). ⛔ **וזה ⛔ אינו מרכך את D-059:** D-126 § ד׳ הפכה
    // «הפסד» ל**מצב** (`outcomeAt` מחזיר `survived`), ⛔ אך המילה «הפסדת» ⛔ עדיין אינה
    // מופיעה על המסך אף פעם — `37 § 9` ח4 קובע מסגור «היית 2 מילים מהבוס».
    // ⇒ **המצב קיים, הנוסח ⛔ לא**, והשומר הזה הוא בדיוק מה שמודד את זה.
    'components/ArenaBattle.tsx', 'components/ArenaResult.tsx', 'components/ArenaAvatar.tsx',
    'components/ArcadeEntry.tsx', 'lib/core/battle.ts', 'lib/core/arcadeResult.ts',
  ];

  /**
   * ⚠️ **הלבנה גם כאן, ⛔ ולא `readFileSync` גולמי כפי שהתוכנית כתבה** (F-039 · F-065):
   * `components/ArenaResult.tsx` מתעד בהערה «קרב שלא נוצח ⛔ אינו «הפסדת»», והמדידה
   * הגולמית הייתה מפילה קובץ ⛔ שאין בו ולו הפרה אחת. ⛔ מחיקת ההערה אינה הפתרון.
   */
  it.each(files)('⛔ %s אינו מכיל «הפסדת» בקוד', (file) => {
    expect(withoutComments(readFileSync(file, 'utf8'))).not.toContain('הפסדת');
  });

  /**
   * ⚠️ **`/הפסד\b/` של התוכנית ⛔ אינו מודד דבר:** ‏`\b` ב-JS נשען על `\w` = `[A-Za-z0-9_]`,
   * ואות עברית אינה `\w` ⇒ «הפסד » ⛔ אינו גבול מזהה והביטוי ⛔ לעולם אינו נתפס.
   * המחרוזת עצמה היא המדידה: כל נגזרת («הפסד» · «הפסדת» · «הפסדים») מכילה אותה.
   */
  it('⛔ ואין בקוד אף נגזרת של «הפסד»', () => {
    for (const file of files) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toContain('הפסד');
    }
  });
});

describe('T-116 — הסף הוא קבוע שרת, ⛔ ולא שדה בגוף הבקשה', () => {
  /**
   * ⟦**כוונה מחדש ב-`T-450` · `D-278`ⓐ, ⛔ ולא נמחקה.**⟧ עד `D-278` הנעילה אמרה «`enemyHp`
   * ⛔ אינו נקרא כלל». ‏`D-278` הכריעה שהלקוח **כן** שולח את חיי היריב הסופיים, כי
   * הניצחון נקבע לפי החיים (`D-273`). ⇒ מה שנשאר נעול הוא הכוונה המקורית: הערך ⛔ אינו
   * נקרא **ישירות** מהגוף, ⛔ ואינו מוחלט — הוא עובר `parseBattle` (טיפוס + טווח) ואז
   * `isEngineVictory`, שבודקת מולו רצפה לפי מספר הנכונות.
   */
  it('⛔ `enemyHp` ⛔ אינו נקרא ישירות מהגוף — רק דרך `parseBattle`, ומול רצפה', () => {
    expect(CODE).not.toContain('body.enemyHp');
    expect(CODE).toContain('parseBattle(body.battle)');
    expect(CODE).toMatch(/b\.enemyHp > ENEMY_HP/);
    const core = readFileSync('lib/core/arcadeResult.ts', 'utf8');
    expect(core).toMatch(/const won = isEngineVictory\(input\.battle, correct\)/);
  });

  it('הנתיב מחזיר `outcome` ו-`leveledUp`', () => {
    const tail = CODE.slice(CODE.lastIndexOf('return NextResponse.json'));
    expect(tail).toContain('plan.response');
    expect(RESPONSE_LITERAL).toContain('outcome:');
    expect(RESPONSE_LITERAL).toContain('leveledUp:');
  });

  /**
   * ⚠️ **האסרציה השלישית כוונה מחדש ב-T-126 ⛔ ולא נמחקה.** היא נעלה את המחרוזת
   * `ARCADE_ENEMY_HP` ככיסוי ל«הסף הוא קבוע שרת» — ו-D-067ⓑ הפך את הסף ל**נגזרת**,
   * ולכן השם הזה ⛔ אינו מופיע עוד בפסקת הבקשה. מחיקה הייתה משאירה את החוזה בלי
   * שום נעילה על מקור הסף; לכן הנעילה עברה לשם החדש ולרצפה שלו.
   */
  it('החוזה מתעד את שני השדות ואת הסף הנגזר בשרת', () => {
    const section = CONTRACT.slice(CONTRACT.indexOf('POST /api/arcade/result'));
    expect(section).toContain('outcome');
    expect(section).toContain('leveledUp');
    expect(section).toContain('requiredHits');
    expect(section).toContain('ARCADE_AMMO');
    // ⟦`T-450`⟧ ומקור הניצחון היום — תוצאת המנוע מול רצפה.
    expect(section).toContain('isEngineVictory');
  });
});

describe('F-092 — הנתיב אידמפוטנטי, ⛔ ולא «כמעט»', () => {
  it('`runId` מאומת בטיפוסו ובצורתו, ⛔ ולא cast', () => {
    expect(CODE).toContain('parseRunId');
    // הצורה נבדקת: מחרוזת כלשהי ⛔ אינה מפתח.
    expect(CODE).toMatch(/[0-9a-f]\{8\}|uuid/i);
  });

  it('`runId` פגום ⇒ 422, ⛔ ולפני כל כתיבה', () => {
    expect(CODE).toMatch(/fieldErrors:\s*\{\s*runId/);
    expect(CODE.indexOf('parseRunId')).toBeLessThan(CODE.indexOf('planArcadeWrites('));
  });

  it('ⓐ קריאת קיצור-הדרך קודמת לבניית התוכנית', () => {
    expect(CODE).toContain('response_snapshot');
    expect(CODE.indexOf('response_snapshot')).toBeLessThan(CODE.indexOf('planArcadeWrites('));
    const shortcut = CODE.slice(CODE.indexOf("from('arcade_runs')"), CODE.indexOf('planArcadeWrites('));
    expect(shortcut).toContain(".eq('run_id'");
    expect(shortcut).toContain(".eq('user_id', user.id)");
  });

  it('ⓑ התנגשות ייחודיות עוצרת את **שאר** הכתיבות — ⛔ לא רק את שורת הקרב', () => {
    expect(CODE).toContain('23505');
    // העצירה היא `return`/`break` מתוך הלולאה, ⛔ ולא `continue`.
    const conflict = CODE.slice(CODE.indexOf('23505'));
    expect(conflict.slice(0, 400)).toMatch(/\breturn\b|\bbreak\b/);
    expect(conflict.slice(0, 400)).not.toMatch(/\bcontinue\b/);
  });

  it('⛔ שידור חוזר מחזיר את התצלום, ⛔ ולא חישוב שני', () => {
    expect(CODE).toMatch(/response_snapshot/);
    // התשובה המוחזרת היא `plan.response`, ⛔ ולא אובייקט שנבנה בנתיב שוב.
    expect(CODE).toContain('plan.response');
    expect(CODE).not.toMatch(/enemyDefeated:\s*plan\.enemyDefeated/);
  });

  it('החוזה מתעד את `runId` ואת השידור החוזר', () => {
    const section = CONTRACT.slice(
      CONTRACT.indexOf('## POST /api/arcade/result'),
      CONTRACT.indexOf('## GET /api/arcade/collected'),
    );
    expect(section).toContain('runId');
    expect(section).toMatch(/אידמפוטנט/);
  });

  it('⛔ שלוש הטבלאות נשמרו — האידמפוטנטיות ⛔ לא פתחה טבלה רביעית', () => {
    const written = [...CODE.matchAll(/\.from\('([a-z_]+)'\)\s*\.(?:upsert|insert|update|delete)\(/g)]
      .map((m) => m[1]);
    expect([...new Set(written)].sort())
      .toEqual(['arcade_collected_words', 'arcade_progress', 'arcade_runs']);
  });
});
