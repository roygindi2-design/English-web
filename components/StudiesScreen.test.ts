import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const SRC = readFileSync('components/StudiesScreen.tsx', 'utf8');

const CODE = withoutComments(SRC);

describe('<StudiesScreen> — בורר ארבעת המסלולים (T-246 · 36 § 9)', () => {
  it('ארבעה יעדי שבב אמיתיים, אחד לכל מסלול', () => {
    // ⚠️ D-110 latitude, logged in the tick report: ארבעת מזהי המסלול ⛔ אינם
    // כתובים כאן בקוד המקור — `STUDY_TRACKS` הוא מקור-האמת היחיד (T-246ⓐ: «הוספת
    // מסלול היא רשומה, ⛔ לא מסך»), וכפילות מחרוזת כאן הייתה בדיוק הגדרה שנייה
    // ש-§ 4.2ז אוסר. הכיסוי האמיתי ל«ארבעה, ובסדר הזה» יושב ב-`studyTracks.test.ts`;
    // כאן נבדק שהרכיב מייבא את הרישום הקנוני ומרנדר אותו כבורר, ⛔ לא ניווט.
    expect(CODE).toContain('STUDY_TRACKS');
    expect(CODE).toMatch(/from ['"]@\/lib\/core\/studyTracks['"]/);
    // כל שבב הוא <button role="tab">, ⛔ לא <li> סטטי — הבחירה משנה state, אינה
    // ניווט. ⚠️ נבדק על role="tab", ⛔ לא ספירת <button> פיזיות: JSX ממופה בלולאה
    // מופיע פעם אחת במקור בלבד (plan Task 3 Step 4 warning).
    expect(CODE).toContain('role="tab"');
    expect(CODE).toContain('STUDY_TRACKS.map');
  });

  it('השבב הפעיל נושא aria-current — ⛔ לא רק צבע (36 § 12.7)', () => {
    expect(CODE).toContain('aria-current');
  });

  it('⛔ אפס נקודות · מטבע · XP · לוח תוצאות · רצף יומי (D-050 · R-012 · T-032)', () => {
    for (const forbidden of ['נקודות', 'מטבע', 'XP', 'לוח תוצאות', 'רצף יומי', 'רצף'])
      expect(CODE, `"${forbidden}" אסור על המסך הזה`).not.toContain(forbidden);
  });

  it('⛔ אפס תחזית קצב בטיק הזה — הנוסחה לא הוגדרה (Global Constraint 8)', () => {
    expect(CODE).not.toContain('בקצב הזה');
    expect(CODE).not.toContain('forecastHe');
  });

  it('⛔ אין readiness/score claim (4.4.3)', () => {
    for (const forbidden of ['מוכנות', 'ציון חזוי', 'צפוי לקבל'])
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
  });

  it('קורא ל-GET /api/levels/summary דרך apiGet, ⛔ לא fetch גולמי', () => {
    expect(CODE).toContain('apiGet');
    expect(CODE).toContain('/api/levels/summary');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });

  it('מקבל fixtureLevels אופציונלי — כמו fixtureSummary ב-LevelMapScreen', () => {
    expect(CODE).toContain('fixtureLevels');
  });

  it('⛔ הקובץ עצמו אינו ניגש לדאטהבייס (⛔ אפס Supabase import)', () => {
    expect(CODE).not.toMatch(/@\/lib\/supabase/);
  });
});

describe('<StudiesScreen> — הבורר הגולש אומר שהוא גולש (T-330)', () => {
  it('ⓐ שינוי המסלול הפעיל מגלגל את השבב הנבחר לתצוגה', () => {
    expect(CODE).toContain('scrollIntoView');
    // ⛔ 'nearest' בשני הצירים: מסלול שנראה במלואו ⛔ אינו זז, והעמוד ⛔ אינו
    // נגלל אנכית על הקשה בבורר.
    expect(CODE).toMatch(/inline:\s*'nearest'/);
    expect(CODE).toMatch(/block:\s*'nearest'/);
    // הגלילה תלויה ב-`active` — ⛔ לא אפקט חד-פעמי על טעינה.
    expect(CODE).toMatch(/\[active,[^\]]*\]/);
  });

  it('ⓐ הגלילה מכבדת prefers-reduced-motion — ⛔ ולא scroll-smooth במחלקות', () => {
    expect(CODE).toContain("'(prefers-reduced-motion: reduce)'");
    expect(CODE).toMatch(/behavior:\s*reduced\s*\?\s*'auto'\s*:\s*'smooth'/);
    // ⛔ מחלקת `scroll-smooth` הייתה עוקפת את ההעדפה — ההכרעה נקראת ב-JS בלבד.
    expect(CODE).not.toContain('scroll-smooth');
  });

  /**
   * T-410 — שלוש הבדיקות שישבו כאן קיבעו את הפתרון של `T-330` (גלילה אופקית
   * פנימית + שני סימני קצה), ו**הפתרון הזה הוא הפגם**: הרצועה גלשה 81px ב-375
   * ⇒ הלומד ראה שלושה מסלולים מתוך ארבעה, בעוד הדף עצמו ⛔ לא גלש והשער
   * הגלובלי נשאר ירוק. ⇒ הן ⛔ לא נשברו בשקט — הן הוחלפו בחוזה ההפוך, והוא
   * חזק מהן: ⛔ **אין** גלישה, בשום רוחב.
   */
  it('ⓑ הרצועה ⛔ אינה גולשת — `flex-wrap`, ⛔ ולא גלילה אופקית פנימית (T-410)', () => {
    expect(CODE).toContain('flex-wrap');
    // ⛔ הגלילה הפנימית היא בדיוק מה שהחביא את `הבנת הנקרא` מאחורי קצה.
    expect(CODE).not.toContain('overflow-x-auto');
    // ⛔ ושבב ⛔ אינו מתכווץ אל מתחת לתוכן שלו — הוא יורד שורה.
    expect(CODE).toContain('shrink-0');
  });

  it('ⓑ מנגנון סימני הקצה הוסר במלואו — ⛔ ולא הושתק (T-410)', () => {
    // קוד שתנאי הרינדור שלו ⛔ אינו יכול להתקיים גרוע מקוד שאינו קיים.
    for (const dead of ['hiddenStart', 'hiddenEnd', 'data-track-scroll-hint', 'measureEdges']) {
      expect(CODE).not.toContain(dead);
    }
  });

  it('ⓒ השבבים על טיפוגרפיית הרנדר, ו⛔ לא מתחת לרצפת ה-12px (§ א9)', () => {
    // `render_video_A.py:1277-1283` — 12.5px, ריפוד 26px. `text-xs` = 12px,
    // כלומר **על** הרצפה ⛔ ולא מתחתיה, ו-`px-3` = 24px.
    const chips = CODE.match(/'flex min-h-touch shrink-0[^']*'/g) ?? [];
    expect(chips).toHaveLength(2);
    for (const chip of chips) {
      expect(chip).toContain('text-xs');
      expect(chip).toContain('px-3');
      // ⛔ יעד ההקשה ⛔ אינו יורד עם הטיפוגרפיה — 44px הוא שער קפוא.
      expect(chip).toContain('min-h-touch');
    }
  });
});

describe('<StudiesScreen> — הבורר מכריז tablist ו⛔ מתנהג ככזה (T-331)', () => {
  it('ⓐ `tabIndex` מתגלגל — ארבע עצירות Tab הופכות לאחת', () => {
    // ⛔ הבדיקה היא על ה**התניה**, ⛔ ולא על נוכחות המחרוזת: `tabIndex={0}` קבוע
    // על כל שבב היה משאיר ארבע עצירות Tab, כלומר בדיוק הפגם שהשורה תיארה.
    expect(CODE).toMatch(/tabIndex=\{isActive \? 0 : -1\}/);
  });

  it('ⓐ החיצים מזיזים בתוך הבורר — ומטפל אחד, ⛔ לא ארבעה', () => {
    expect(CODE).toContain('onKeyDown={onTrackKeyDown}');
    expect(CODE).toContain("event.key === 'ArrowLeft'");
    expect(CODE).toContain("event.key === 'ArrowRight'");
    expect(CODE).toContain("event.key === 'Home'");
    expect(CODE).toContain("event.key === 'End'");
    // ⛔ בלי `preventDefault` החץ גם מזיז את הבורר וגם גולל את העמוד.
    expect(CODE).toContain('event.preventDefault()');
  });

  it('🔴 ⛔ הכיוון הוא RTL — `ArrowLeft` מתקדם ו-`ArrowRight` חוזר (תקדים F-236)', () => {
    // ⛔ **זו הטענה שהשורה נפתחה עליה.** ב-`F-236` ההצהרה בקוד הייתה הפוכה
    // מהתוצאה הנמדדת, ו⛔ שום בדיקה לא תפסה זאת. כאן שני הכיוונים ננעצים
    // באריתמטיקה עצמה: שמאל ⇒ `index + 1` (הבא), ימין ⇒ `index - 1` (הקודם).
    const left = CODE.match(/event\.key === 'ArrowLeft'\)[^;]*;/)?.[0] ?? '';
    const right = CODE.match(/event\.key === 'ArrowRight'\)[^;]*;/)?.[0] ?? '';
    expect(left).toContain('index + 1');
    expect(left).not.toContain('index - 1');
    expect(right).toContain('index - 1');
    expect(right).not.toContain('index + 1');
    // גלישה מעגלית בשני הקצוות, ⛔ ולא מבוי סתום בשבב האחרון.
    expect(left).toContain('index === last ? 0');
    expect(right).toContain('index === 0 ? last');
  });

  it('ⓐ החץ מעביר גם את המיקוד, ⛔ ולא רק את ה-state', () => {
    // ⛔ בלי `.focus()` קורא-המסך נשאר על השבב הישן בעוד הפאנל התחלף — כלומר
    // «סדר המיקוד תואם לסדר החזותי» מהצ׳קליסט הקנוני נשבר בדיוק כאן.
    expect(CODE).toMatch(/chipRefs\.current\.get\(target\.id\)\?\.focus\(\)/);
    expect(CODE).toMatch(/setActive\(target\.id\)/);
  });

  it('ⓑ `aria-selected` מצביע על פאנל שקיים — ⛔ ולא על כלום', () => {
    expect(CODE).toContain('role="tabpanel"');
    expect(CODE).toContain('aria-controls={TRACK_PANEL_ID}');
    expect(CODE).toContain('id={TRACK_PANEL_ID}');
    // הפאנל מצביע בחזרה אל השבב **הפעיל**, ⇒ הקישור דו-כיווני ו⛔ לא חצי.
    expect(CODE).toMatch(/aria-labelledby=\{`\$\{TAB_ID_PREFIX\}\$\{active\}`\}/);
    expect(CODE).toMatch(/id=\{`\$\{TAB_ID_PREFIX\}\$\{track\.id\}`\}/);
  });

  it('T-351 · לפאנל יש דרך קדימה — ⛔ ולא `<h2>` ו-`<p>` בלבד', () => {
    // 🔬 **זו המדידה שהשורה נפתחה עליה:** גוף הפאנל החזיר **0** `<Link`/`<button`,
    // ⇒ הלומד בחר מסלול ו⛔ לא יכול היה להיכנס אליו. שני ענפים, ⛔ ואין שלישי.
    expect(CODE).toContain('trackDestination');
    expect(CODE).toMatch(/from ['"]next\/link['"]/);
    expect(CODE).toMatch(/destination !== null \? \(/);
    expect(CODE).toMatch(/href=\{destination\.href\}/);
    // ⛔ היעד ⛔ אינו מחרוזת מוטבעת ברכיב — `lib/core/studyTracks.ts` הוא המפה.
    expect(CODE).not.toContain("href=\"/cards\"");
  });

  it('T-351 · מסלול בלי יעד בנוי אומר זאת בעברית, ⛔ ולא נשאר ריק', () => {
    expect(CODE).toContain('NO_DESTINATION_HE');
    expect(SRC).toContain("const NO_DESTINATION_HE = 'המסלול הזה עדיין בבנייה, ואין בו לאן להיכנס.'");
    // ⛔ ⛔ ולא אותו משפט של `unreachable`: קריאה שנכשלה ומסלול שאינו בנוי
    // הם שני מצבים שונים (D-046/D-082), וטקסט משותף היה מוחק את ההבדל.
    expect(SRC).not.toContain("const NO_DESTINATION_HE = UNREACHABLE_HE");
  });

  it('T-351 · ⛔ קריאת התקדמות שנכשלה ⛔ אינה מוחקת את הדרך קדימה (T-349)', () => {
    // ⛔ `destination` ⛔ אינו נגזר מ-`metric` — אם היה, `unreachable` היה
    // משאיר את הלומד בלי שום פעולה, וזה בדיוק הכשל ש-`T-349` סגר.
    const decl = CODE.match(/const destination = [^;]*;/)?.[0] ?? '';
    expect(decl).toContain('trackDestination(active)');
    expect(decl).not.toContain('metric');
  });

  it('T-351 · הקישור הוא יעד מגע אמיתי — `min-h-touch`, ⛔ לא טקסט לחיץ', () => {
    const link = CODE.match(/<Link[\s\S]{0,600}?data-track-destination[\s\S]{0,600}?>/)?.[0] ?? '';
    expect(link).toContain('min-h-touch');
    expect(link).toContain('href={destination.href}');
  });

  it('ⓑ הפאנל הוא עצירת מקלדת — ⛔ אחרת החיצים בלעו את הגישה אליו', () => {
    const panel = CODE.match(/<div[\s\S]{0,500}?data-track-status[\s\S]{0,500}?>/)?.[0] ?? '';
    expect(panel).toContain('tabIndex={0}');
    expect(panel).toContain('role="tabpanel"');
    expect(panel).toContain('aria-live="polite"');
  });

  it('T-406ⓑ · הפאנל בלי יעד נושא **פעולה**, ⛔ ולא משפט לבדו', () => {
    // `ui-ux-pro-max` · `ux` · Feedback / Empty States (Severity Medium):
    // «Do: Show helpful message **and action** · Don't: Blank empty screens».
    // 🔬 נמדד לפני התיקון: הענף הזה היה `<p>` יחיד ⇒ היציאה היחידה מהפאנל
    // הייתה סרגל הלשוניות.
    expect(CODE).toContain('trackFallbackAction');
    expect(CODE).toContain('data-track-fallback');
    const link = CODE.match(/<Link[\s\S]{0,600}?data-track-fallback[\s\S]{0,600}?>/)?.[0] ?? '';
    expect(link).toContain('min-h-touch');
    expect(link).toContain('href={fallback.href}');
  });

  it('T-406ⓑ · ההצהרה נשארת — הפעולה ⛔ אינה מחליפה את המשפט שאומר מה קורה', () => {
    // ⛔ «יש כפתור ⇒ אפשר למחוק את ההסבר» הוא בדיוק מסך ריק עם כפתור.
    expect(CODE).toContain('data-track-destination="none"');
    expect(CODE).toContain('{NO_DESTINATION_HE}');
  });

  it('T-406ⓒ · ⛔ אפס באנר תחזית (D-237 · F-177)', () => {
    for (const forbidden of ['תחזית', 'בקצב הזה', 'תסיים בעוד']) {
      expect(SRC).not.toContain(`>${forbidden}`);
    }
    expect(CODE).not.toContain('תחזית');
  });

  it('T-406 · המדד נגזר מהליבה — ⛔ אפס ענף מצב שני ברכיב', () => {
    // ⛔ `metricFor` המקומי הוחלף ב-`trackMetric` הטהור: מצב מדד שיושב ברכיב
    // ⛔ אינו נבדק בלי DOM, וזו בדיוק ההגדרה השנייה ש-§ 4.2ז אוסר.
    expect(CODE).toContain('trackMetric(active');
    expect(CODE).not.toContain('function metricFor');
  });
});

describe('<StudiesScreen> — נתיב המודולים (T-407 · kol-A-04-learning)', () => {
  it('הרשימה נגזרת מהליבה — ⛔ אפס שם מודול במקור הרכיב', () => {
    // ⛔ R-010: שם מודול שנכתב כאן היה תוכן לימודי שנוצר בקוד. `trackModules`
    // גוזר אותם משש הרמות ש-`/api/levels/summary` כבר החזיר.
    expect(CODE).toContain('trackModules(active');
    expect(CODE).toContain('data-track-modules');
    expect(CODE).toContain('modules.map');
  });

  it('⛔ רשימה ריקה ⛔ אינה מרונדרת כרשימה ריקה — ⓒ', () => {
    // שלושת המסלולים בלי תוכן מציגים את המבנה הריק המוצהר של T-406,
    // ⛔ ולא `<ol>` ריק מתחתיו.
    expect(CODE).toContain('modules.length > 0');
  });

  it('ⓐ כל מצב נושא אייקון **ותווית כתובה** — 36 § 12.7', () => {
    expect(CODE).toContain('<ModuleStateMark');
    expect(CODE).toContain('module.stateLabelHe');
    expect(CODE).toContain('data-module-state');
  });

  it('🔴 R-017 · ⛔ אפס מנעול ואפס שפת נעילה על המסך', () => {
    // «⛔ אין שער אחוזים ואין נעילה בין רמות» (R-017 · D-037) ⇒ גם המילה
    // ⛔ אינה מופיעה, וגם הצורה: מנעול אומר «אין לך רשות».
    for (const forbidden of ['נעול', 'ייפתח אחרי', 'icon_lock', 'Lock'])
      expect(CODE, `"${forbidden}" סותר את R-017`).not.toContain(forbidden);
  });

  it('פס ההתקדמות ⛔ אינו הערוץ היחיד — הוא aria-hidden והמספר נאמר במילים', () => {
    const bar = CODE.match(/<span[\s\S]{0,400}?data-module-progress[\s\S]{0,200}?>/)?.[0] ?? '';
    expect(bar).toContain('aria-hidden');
    expect(CODE).toContain('module.summaryHe');
  });

  it('⛔ אפס זוהר על נקודות הנתיב — תקציב שכבה ב3 הוא שניים למסך', () => {
    // ⛔ מספר המודולים «בתהליך» נגזר מנתונים ⇒ זוהר לכל אחד ⛔ אינו חסום בשניים.
    const path = CODE.match(/data-track-modules[\s\S]{0,4000}?<\/ol>/)?.[0] ?? '';
    expect(path.length).toBeGreaterThan(0);
    expect(path).not.toContain('data-glow');
  });
});

describe('T-408 — פריט נפתח מהנתיב, ומחזיר אליו', () => {
  it('ⓐ כרטיס המודול הוא קישור — ⛔ ולא כרטיס לקריאה בלבד', () => {
    const path = CODE.match(/data-track-modules[\s\S]{0,6000}?<\/ol>/)?.[0] ?? '';
    expect(path).toContain('moduleItemHref(active, module)');
    expect(path).toMatch(/<Link[\s\S]{0,200}href=\{itemHref\}/);
  });

  it('ⓐ מודול שאין לו מה לפתוח נשאר `<article>` — ⛔ ואין קישור מת', () => {
    // ⛔ ההכרעה על **מי** נפתח יושבת ב-`moduleItemHref` (ונבדקת שם); כאן נבדק
    // שהרכיב מכבד את ה-`null` במקום לצייר קישור לשום מקום.
    const path = CODE.match(/data-track-modules[\s\S]{0,6000}?<\/ol>/)?.[0] ?? '';
    expect(path).toMatch(/itemHref === null \?[\s\S]{0,120}<article/);
  });

  it('⛔ אפס `data-primary-action` על כרטיס מודול — `check:mobile` סופר אחת למסך (F-027)', () => {
    const path = CODE.match(/data-track-modules[\s\S]{0,6000}?<\/ol>/)?.[0] ?? '';
    expect(path).not.toContain('data-primary-action');
  });

  it('ⓑ+ⓒ לכל מודול יש עוגן — זה מה שהחזרה נוחתת עליו', () => {
    const path = CODE.match(/data-track-modules[\s\S]{0,6000}?<\/ol>/)?.[0] ?? '';
    expect(path).toContain('id={moduleAnchorId(active, module.id)}');
  });

  it('ⓑ+ⓒ החזרה נקראת מה-`hash` — ⛔ ולא מפרמטר שאילתה (T-328: המסלול סטטי)', () => {
    expect(CODE).toContain('parseModuleAnchor(window.location.hash)');
    // ⛔ קריאת פרמטר שאילתה בעמוד הזה הייתה מחזירה את `/studies` ל-`ƒ`.
    expect(CODE).not.toContain('useSearchParams');
  });

  it('ⓑ+ⓒ הנחיתה מכבדת `prefers-reduced-motion` — שער, ⛔ לא טעם', () => {
    const effect = CODE.match(/parseModuleAnchor\(window\.location\.hash\)[\s\S]{0,1200}?\}, \[active, modules\]\);/)?.[0] ?? '';
    expect(effect.length).toBeGreaterThan(0);
    expect(effect).toContain("matchMedia?.('(prefers-reduced-motion: reduce)')");
    expect(effect).toMatch(/behavior: reduced \? 'auto' : 'smooth'/);
  });

  it('ⓑ+ⓒ הנחיתה גם ממקדת — לומד במקלדת חוזר לנקודה שלו, ⛔ ולא לראש המסך', () => {
    expect(CODE).toContain("querySelector<HTMLElement>('a')?.focus({ preventScroll: true })");
  });

  it('⛔ פעם אחת בלבד — הקשה מאוחרת על שבב אחר ⛔ אינה נשאבת חזרה לעוגן', () => {
    expect(CODE).toContain('returnHandled');
    expect(CODE).toMatch(/if \(returnHandled\.current\) return;/);
  });
});
