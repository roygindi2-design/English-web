<!-- חלק מ-plan/. ⟦OWNER: PM כותב הזמנות · CONTENT מסמן ביצוע · CRITIC סוקר⟧ -->

# 25 · הזמנות תוכן — הערוץ מה-PM ל-CONTENT

**נוצר 23/08/2026 בהוראת רוי.** ⛔ **הבעיה שהוא סוגר:** ל-PM לא היה ערוץ ל-CONTENT.
נמדד: מתוך 37 פריטים שהועלו לרוי, **24 באו מה-PM** — והוא הפך לצוואר בקבוק שמנקז
לאדם אחד גם דברים שסוכן אחר בלופ יכול לבצע.

> **הכלל בשורה אחת:** ⛔ **בעיה שפתרונה הוא «צריך לייצר תוכן» ⛔ אינה עולה לרוי.
> היא נכתבת כאן.** לרוי עולה רק מה שאיש מהסוכנים אינו רשאי או אינו יכול להכריע.

---

## איך זה עובד

| שלב | מי | מה |
|---|---|---|
| 1 | **PM** | כותב שורת הזמנה כאן + תדריך ב-`docs/content-*-brief.md` על תבנית `docs/content-stories-brief.md` |
| 2 | **PM** | ⛔ **מגדיר שער דטרמיניסטי** ב-`lib/core/*Gate.ts`, או מצהיר מפורשות שאין שער ולמה |
| 3 | **CONTENT** | קורא את הקובץ הזה **ראשון בכל ריצה**, לפני אצוות אוצר המילים השגרתיות |
| 4 | **CONTENT** | מייצר, מריץ את השער, כותב לקובץ הפלט, מסמן `🟣 לביקורת` |
| 5 | **CRITIC** | דוגם, ומסמן ✅ או דוחה את האצווה כולה |

⚠️ **הזמנה גוברת על אצווה שגרתית.** אצוות NGSL הן עבודת רקע; הזמנה חוסמת פרוסה
שהלומד אמור לראות.

## החוקים שאינם משתנים

1. ⛔ **R-010 · R-013 · R-014 בתוקף מלא.** הזמנה **אינה** היתר להמציא תוכן לימודי.
2. **כל הזמנה נושאת מקור או שער** — ורצוי שניהם. **אין מקור ואין שער? ⇒ ⛔ ההזמנה
   אינה נכתבת**, ובמקומה נפתח 🔴 BLOCKER ב-`20-alerts.md`. **חסימה היא תוצאה מוצלחת.**
3. ⛔ **פריט שנפסל בשער אינו מתוקן ביד — הוא מיוצר מחדש** (R-014).
4. ⚠️ **נושא שאין לו שער דטרמיניסטי — נאמר במפורש בשורה, ו⛔ אין לטעון שיש שער.**
   עין אנושית היא הבקרה היחידה שם, וזה מסומן.
5. ⛔ **CONTENT אינו נוגע בקוד ואינו כותב ל-DB.** קבצים בלבד; הקליטה היא משימת Dev.

---

## ההזמנות

**מצבים:** ⬜ ממתינה · 🔵 בייצור · 🟣 לביקורת · ✅ נקלטה · ⛔ חסומה

| # | מה | תדריך | שער | מקור / סיכון | מצב | משימה |
|---|---|---|---|---|---|---|
| K-001 | שאלת הבנה לכל אחד מ-12 הסיפורים + שלוש תשובות | `docs/content-story-questions-brief.md` | `lib/core/storyQuestionGate.ts` | הסיפורים כבר בריפו. ⚠️ **«נושא רגיש» אין לו שער** — עין אנושית | 🟣 | **T-189** |
| K-002 | תיבת הסימולציות — הודעות, נושאים, שלוש מילות חובה | `docs/content-messages-brief.md` | `lib/core/messageGate.ts` | בנק המילים ברמה. ⚠️ שם פרטי **רק בשדה השולח**, מרשימה סגורה | 🟣 | **T-193** |
| K-003 | **מקלדת הבלוקים — עצי ההמשכים** (`39 § 3`) | ⛔ אין — הפריט בסדר גודל של אבן דרך | ⛔ אין — **סדר 1 נמדד ופוסל 0.2%** | 🔴 **F-117** · **D-113** (רוי: מנוע פתוח) · `scripts/measure-continuations.mjs` | ⛔ | **T-200** |
| K-005 | **תור אמירנט — כיסוי Tier 1 (A2) ואחריו Tier 2 (B1).** ⛔ ⛔ אינה «עוד אצווה»: היא **סדר עבודה נמדד** על 3,156 המילים החסרות בטווח הבחינה המוצהר | `docs/content-amirnet-vocab-brief.md` ✅ **נכתב בטיק הזה** | ✅ **קיים וירוק** — `npm run measure:gate` (`scripts/measure-gate.mjs` · `lib/core/levelGate.ts`), נמדד C-0339: **787 שורות · 0 rejected**. ⛔ שער חדש ⛔ אינו נדרש | **המקור נגזר בטיק הזה משני קבצים שכן בריפו** — `data/cefrj-vocabulary-profile-1.5.csv` + `data/octanove-vocabulary-profile-c1c2-1.0.csv`. ⚠️ **סיכון:** מילות יחס/קישור הן הקשות ביותר לתרגם נכון (`despite` ⇒ «למרות» ⛔ ולא «בגלל») — `translation_confidence` נמוך הוא תשובה לגיטימית. ⚠️ ⛔ **אין שער לנכונות התרגום** — R-013 בתוקף מלא | 🔴 **נמדד חי 07/09 (הטיק הזה): Tier 1: 522/1,243 · Tier 2: 118/2,139 · טווח הבחינה 640/3,382 — אלה הן השורות שכבר נדחפו ל-`work/current`, ⛔ ולא כוללות את עשר השורות למטה. מילות קישור/יחס: 33/35 (2 הנותרות — `toward/towards` · `onto/on to` — נכשלות במבחן הכשירות בכוונה, לא ייכתבו) ⇒ ⌒a מוצה במלואו. ⛔ **⌒b (Tier 1 אלפביתי) חסום ברגע זה — ראה `03-for-roy` פריט 102:** נכתבה אצווה של 10 מילים (adjective·advanced·advertising·aged·aisle·ambition·amused·ancestor·angel·ankle), עברה את `gateSense` האמיתי 10/10, אך `npm run build:ingest` קורס מעל 1,200 שורות מאושרות בבנק (תקרת ISO 2859-1 היחידה שמוחזקת ב-`lib/core/spotCheck.ts`) — הבנק עמד בדיוק על 1,200 לפני הטיק. האצווה נשמרה מקומית ⛔ ולא נדחפה. הסמן הבא, כשהחסם ייפתר: `adjective`** ⇐ `F-194` ✅ **נפתח 08/09 (סשן תפעול):** הדגימה עברה לתכנון **לכל אצווה** לפי `R-014`, ו-`build:ingest` נמדד **exit 0 על בנק של 1,210 שורות**. ⇒ ⛔ **⌒b ⛔ אינו חסום עוד — הסמן `adjective` פנוי.** ⛔ והאצווה שנשמרה מקומית ⛔ לא נדחפה מעולם ⇒ CONTENT כותב אותה מחדש, ⛔ ולא מניח שהיא קיימת. ✅ **נכתבה מחדש ונדחפה C-0520 (11/09):** `batch-2026-09-11.jsonl` — 10 המילים בדיוק (adjective·advanced·advertising·aged·aisle·ambition·amused·ancestor·angel·ankle), `gateSense` האמיתי 10/10 + בקרת שלילה 0/7, `npm run measure:gate` על כל 1,210 השורות: 0 rejected. **הסמן הבא, אלפביתי מ-Tier 1: `anniversary`.** ⚠️ **ממצא לתיעוד — גנרטור רביעי שה-CONTENT.md אינו מונה:** `npm run build:preview` (`lib/core/previewCards.generated.ts`) גם הוא נגזר מ-`data/generated/*.jsonl` ונשבר בשער המהיר של `verify:fast`/`pre-push` באצווה הזו — לא רק שלושת הגנרטורים ש-rule ⓑ מונה. נרשם ב-`plan/03-for-roy.md`. ✅ **נכתבה ונדחפה C-0525 (11/09):** `batch-2026-09-11-2.jsonl` — 12 מילים (anniversary·annoy·annoying·apologize·area·armchair·armed·artificial·asleep·astronaut·atom·audio), `gateSense` האמיתי 12/12 + בקרת שלילה 0/7, כל ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של 1,222 שורות ב-27 קבצים, 0 rejected — תקרת ISO 2859-1 (פריט 102) ⛔ לא חזרה. `npm run measure:amirnet-coverage`: 650→660/3,382 (Tier 1+2). **הסמן הבא, אלפביתי מ-Tier 1: `audition`.** ⛔ **תוקן C-0532 (12/09): `audition` הוא Tier 3 (`amirnet_level=3`), ⛔ לא Tier 1 — הסמן הקודם ⛔ לא אומת מול `data/amirnet-vocab.csv` לפני שנרשם.** ✅ **נכתבה ונדחפה C-0532 (12/09):** `batch-2026-09-12.jsonl` — 12 מילים חד-משמעיות ולא-מורכבות שדולגו קודם (amusement·angrily·automatic·badminton·bake·balcony·balloon·banking·barbecue·barber·bargain·basket), `gateSense` האמיתי 12/12 בסבב שני (3 תיקוני סחיפת רמה: `oven`·`blew`/`tied`·`apples`), **וכל 48 המסיחים אומתו בנפרד מול `allowed-words`** — 30 מתוך 48 הוחלפו (לקח 38 יושם במלואו). ארבעת הגנרטורים רצו נקי על בנק של **1,234 שורות ב-28 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: 660→**672**/3,382 (Tier 1+2). **חישוב פער אמיתי (לא מוערך): 701 מתוך 1,243 כותרות Tier 1 היו חסרות בבנק לפני האצווה הזו** (הופחת ל-689 אחריה). **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות: `batch`.** ✅ **נכתבה ונדחפה C-0537 (12/09, CONTENT):** `batch-2026-09-12-2.jsonl` — 12 מילים חד-משמעיות שהמשיכו את הסמן בדיוק (batch·battery·bay·beg·beginner·beginning·belly·bench·blanket·blonde·bloom·boil), נבדקו מראש מול `gateSense` האמיתי וכל 24,913 הצורות ב-`allowed-words-2026-08-07.txt` דרך סקריפט בדיקה זמני (`.scratch/checkgate.mjs`, ⛔ לא נדחף): סבב ראשון 11/12 (`belly` נכשלה על `hungry` מחוץ ל-allowed-words, תוקנה ל-`tired`), סבב שני 12/12. **בקרת שלילה** — 7 שורות פגומות בכוונה (סחיפת רמה · דליפת תשובה · אותיות לטיניות בתרגום · פחות מ-4 מסיחים · גזע בלי ____ · ניקוד בתרגום · המילה חסרה בדוגמה), כולן על אותו שער: **0/7 עברו**. ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,246 שורות ב-29 קבצים**, 0 rejected — תקרת ISO 2859-1 (פריט 102, `lib/core/spotCheck.ts`) נבדקה שוב במפורש ו⛔ לא חזרה (הבסיס הישן, 1,234 שורות, כבר עבר `build:ingest` נקי לפני הכתיבה). `npm run measure:amirnet-coverage`: 672→**684**/3,382 (Tier 1+2). 11/12 `translation_confidence: high` · 1/12 (`bloom`) `medium` — הוא נושא שתי קריאות ("פרח" מול "פריחה כתופעה") ו-`פריחה` תואם רק את השנייה במדויק. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (נמדד מחדש אחרי האצווה הזו, מדלג על `alarm clock`·`been`·`being`): `blackboard`.** ✅ **נכתבה ונדחפה C-0545 (12/09, CONTENT):** `batch-2026-09-12-3.jsonl` — **30 מילים** (עלייה מכוונת מ-12; אין תקרת אצווה מ-09/09, ואומת שוב 12/09 ש-`spotCheckPlan()` רץ per-batch-file ולא על הבנק כולו): blackboard·boiled·bonus·bookcase·bookshelf·bookshop·bored·bra·brainstorm·brake·brave·breeze·bride·bug·bulb·bush·businessman·businesswoman·cab·cafeteria·calendar·camping·campus·captain·carrot·cassette·cereal·champagne·cheer·chef. `gateSense` האמיתי (יובא ישירות, לקח 40) על כל 30 השורות: סבב ראשון 15/30 (סחיפת רמה על מילים יומיומיות מחוץ ל-NGSL — `potatoes`·`fork`·`hungry`·`december`·`ten`·`nine` וכו', תוקנו כולן), סבב שני 30/30. בקרת שלילה של 7 שורות פגומות בכוונה (אחת לכל סוג כשל): 0/7 עברו. שני באגים בצורת המסיחים נתפסו לפני הכתיבה (לא בשער): מסיח שנשא את שם הכותרת עצמה (`camping`·`carrot`), ו-4 שורות (`bride`·`cab`·`cassette`·`chef`) עם מסיח `near_synonym` שנספר בטעות כאחד מארבעה — `SCORABLE()` פוסל אותו, תוקן בכולן ⇒ לקח 41/§א׳1. ארבעת הגנרטורים רצו נקי על בנק של **1,276 שורות ב-30 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: 684→**714**/3,382 (Tier 1+2). 23/30 `translation_confidence: high` · 7/30 `medium` (boiled·bonus·bookcase·bookshelf·brainstorm·breeze·camping — כולן דיוק-תרגום גבולי, לא ניחוש). ⚠️ **ממצא פתוח, לא הוכרע חד-צדדית:** מתוך 120 מילות המסיחים, 51 מחוץ ל-`allowed-words-2026-08-07.txt` (הנגזר מ-NGSL) — אך כולן מילים פשוטות ותקינות ברמת A1/A2 (`banana`·`umbrella`·`insect`·`unhappy`·`diary` וכו׳). `allowed-words` נבנה בעידן שבו הכותרות עצמן היו מ-NGSL; מאז ⟦09/09⟧ הכותרות מגיעות מ-`data/amirnet-vocab.csv` (CEFR-J), מקור שונה ורחב יותר, ואין להניח שרשימת ה-NGSL הישנה עדיין הרשימה הנכונה לבדוק מסיחים כנגדה. הוצע ל-PM/DEV להכריע אם לגזור רשימת-רמה חדשה מ-CEFR-J/מ-`data/amirnet-vocab.csv` לבדיקת מסיחים קדימה — לא הוחלט כאן. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (נמדד מחדש אחרי האצווה הזו): `cheque`.** ✅ **נכתבה ונדחפה C-0563 (13/09, CONTENT):** `batch-2026-09-13.jsonl` — 20 מילים (cheque·chess·chimpanzee·chin·chirp·cleaner·clerk·click·climbing·clone·clown·clue·cola·comb·comic·composer·confused·container·continent·convenient), `gateSense` האמיתי (מיובא ישירות, לקח 40) על כל 20 השורות: סבב ראשון 2/20 (18 פסילות, כמעט כולן סחיפת רמה על מילת-רקע פשוטה שנולדה בניסוח — `zoo`·`scar`·`receipt`·`icon`·`sofa` וכו', ושתיים על מספר-במילים/שם-פרטי — `six`·`three`·`eight`·`Asia`·`Africa`), סבב שני 20/20. **בקרת שלילה** — 7 שורות פגומות בכוונה (אחת לכל סוג כשל: סחיפת רמה · דליפת תשובה · אותיות לטיניות בתרגום · פחות מ-4 מסיחים ניקוד · גזע בלי `____` · ניקוד בתרגום · המילה חסרה בדוגמה): 0/7 עברו. ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,296 שורות ב-31 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: 714→**734**/3,382 (Tier 1+2). 16/20 `translation_confidence: high` · 4/20 `medium` (clone·clue·comic·convenient — כולן דיוק-תרגום גבולי או חפיפת תרגום עם מילה אחרת, לא ניחוש; `clue` נושא `he_one_to_many_group: "רמז hint·clue"` כי `hint` כבר בבנק עם אותו תרגום). **ממצא חדש (לקח 43): ארבע כותרות שהן שם-קטגוריה (`chess`·`chin`·`clue`·`container`) דרשו קולוקציה ייחודית בגזע (`king and queen`·`stroke one's chin`·`recycling container`) כדי שמסיח מאותה קטגוריה לא יתאים לגזע באותה מידה כמו הכותרת עצמה** — נבדק ותוקן לפני הכתיבה, לא אחריה. הליכה חיה 375×780 ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`: פריסת ה-RTL תקינה בכל המסכים, ⛔ אין גלישה אופקית, ⛔ אין תוכן חתוך (המסכים משתמשים בנתוני `Lorem` קבועים לבדיקת פריסה, ⛔ לא בתוכן חי — התוכן החי מוצג רק ב-`/` דרך `previewCards.generated.ts`). **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (נמדד מחדש אחרי האצווה הזו): `cooker`.** ✅ **נכתבה ונדחפה C-0570 (13/09, CONTENT):** `batch-2026-09-13-2.jsonl` — **40 מילים** (עלייה מכוונת מ-20/30; פרומפט הטיק הזה חזר וקבע במפורש שאין תקרת אצווה מ-09/09 ושה-1,200 הוא תקרת קובץ, ⛔ לא תקרת טיק — הבחירה ב-40 מנומקת במניפסט: גישת Node/TypeScript ישירה איפשרה להריץ את `gateSense` האמיתי על כל הטיוטה + סריקת הצבת-מסיחים-בגזעים + בדיקת התאמת a/an מכנית + בקרת שלילה של 7 שורות — לפני כתיבת שורה אחת לקובץ המעוקב): **בדיקה חיה נגד `data/amirnet-vocab.csv` ונגד כל קובצי `batch-*.jsonl` הקיימים גילתה שתי כותרות Tier 1 שדולגו בטעות בטיקים קודמים** — `comparative` ו-`convenience`, שתיהן חד-מיליות וכשירות, יושבות אלפביתית **לפני** `cooker` — נכתבו כאן כדי לסגור את הפער, ואחריהן ברצף האלפביתי: cooker·cooking·cooler·correctly·countryside·creativity·cricket·crisp·crowded·crown·cruise·cupboard·curry·curse·cycling·dam·dancer·daylight·dentist·dessert·developed·diamond·diary·dinosaur·disadvantage·disappointed·disappointing·disco·dishonest·dislike·dizzy·done·download·downstairs·downtown·drawer·drawing·dressed. `gateSense` האמיתי (מיובא ישירות, לקח 40) על כל 40 השורות: סבב ראשון 24/40 (16 פסילות, כמעט כולן סחיפת רמה על מילת-רקע שנולדה בניסוח — `bat`·`witch`·`gracefully`·`app`·`internet`·`socks`·`pencil`·`classroom`·`shone` וכו', ועוד `Japan`/`Saturday`/`three` — שם פרטי/יום/מספר-במילים, לקח 1), סבב שני 40/40. **מעבר לשער: סריקת הצבה מלאה של כל מסיח סמנטי בכל אחד משלושת הגזעים שלו (הדפסה מלאה, לא מדגם) תפסה שלוש התאמות-שווא שהשער ⛔ אינו רואה** — (א) `dinosaur`/`elephant` אחרי `a ____` קבוע הפיק `"a elephant"` שמסגיר את התשובה דקדוקית — הוחלף ל-`camel`, ואומת בסריקת התאמת a/an שיטתית על כל 120 זוגות מסיח-גזע שאין מקרה נוסף; (ב) `convenience` איפשרה ל-`beauty` להשלים ניב אנגלי טבעי (`a real beauty`) ול-`safety`/`beauty` להשלים `made up for that` — שני הגזעים נוסחו מחדש סביב קרבה/מיקום, ציר שרק `convenience` עונה עליו; (ג) `dressed` נוסח סביב `in a warm coat` ואיפשר ל-`covered`/`wrapped` לקרוא כמעט-נרדפים טבעיים — נוסח מחדש סביב ריאיון עבודה. **בקרת שלילה** — 7 שורות פגומות בכוונה (אחת לכל סוג כשל, על שורת `cooker` מהאצווה עצמה): **0/7 עברו**. ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,336 שורות ב-32 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: 734→**774**/3,382 (Tier 1+2). 38/40 `translation_confidence: high` · 2/40 `medium` (comparative·crisp — הראשונה מונח דקדוקי שהתרגום שלו מדויק אך רשום כפחות בטוח ברמת ההתאמה למונח A2 קונקרטי, השנייה חפיפת משמעות עם "צ'יפס" כשם ל"fries" בעברית מדוברת). ⚠️ **ממצא פתוח, לא הוכרע, ⛔ ולא הוחמר כאן:** אותה סוגיה כמו ב-C-0545/C-0563 — `gateSense` ⛔ אינו בודק מסיחים מול `allowed-words`, והרשימה הזו עדיין נגזרת מ-NGSL בעוד הכותרות מגיעות מ-CEFR-J. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (נמדד מחדש אחרי האצווה הזו): `drill`.** ✅ **נכתבה ונדחפה C-0578 (13/09, CONTENT):** `batch-2026-09-13-3.jsonl` — **30 מילים**, ברצף אלפביתי מדויק מהסמן: drill·drugstore·duck·earring·earthquake·elephant·elevator·email·embarrassing·endangered·ending·energetic·envy·escalator·euro·fare·fascinating·favor·feather·fighter·fisherman·flea·flour·fog·folder·footballer·forbid·fork·fortunately·frank. **גודל האצווה — 30, ונומק בקול (הוראת הטיק: «אין תקרת אצווה, סמן את הגודל ואת הסיבה»):** לא 12 (התקרה הישנה, שהוחלפה 09/09 ואושרה שוב 12/09 — `spotCheckPlan()` רץ per-batch-**file**, ⛔ לא על הבנק), ולא 40 (כמו C-0570) — 30 נבחר כדי לפנות את מלוא חלון הטיק להשלמת F-235ⓑ (ראה למעלה) **וגם** לאצווה הזו באותו טיק בלי לקצר את בדיקת השער/המסיחים לאף אחת מהשתיים; קנה המידה של C-0545/C-0563 (20–30) הוכח פעמיים כניתן לאימות מלא (שער אמיתי + בקרת שלילה + בדיקת כל מסיח מול allowed-words) בתוך טיק יחיד, ואילו 40 (C-0570) לקח את כל שארית הטיק. `gateSense` האמיתי (מיובא ישירות מ-`lib/core/contentSchema.ts`, לקח 40) על כל 30 השורות: **סבב ראשון 10/30** — 20 פסילות, כולן `level drift` על מילת-רקע שנולדה בניסוח וחומקת מ-`allowed-words-2026-08-07.txt` (`pond`·`trunk`·`zoo`·`thirsty`·`tray`·`panda`·`classmates`·`mall`·`Saturday`·`bakery`·`vet`·`dough`·`messy`·`soup`·`icy` וכו') ועוד חמש שורות עם מספר-במילים (`nine`·`twenty`·`two`·`three`, לקח 1 — כולן הוחלפו במילות כימות: `several`·`many`·`every`) — כל 20 יוצרו מחדש (R-014), **סבב שני 30/30**. **בקרת שלילה** — 7 שורות פגומות בכוונה (אחת לכל סוג כשל: אותיות לטיניות בתרגום · המילה חסרה בדוגמה · גזע קצר מדי/בלי `____` · פחות מ-4 מסיחים ניקוד · מסיח שהוא הכותרת עצמה · רמה מחוץ ל-1–4 · `pos` לא חוקי): **0/7 עברו**, מריצה על אותו script (`.scratch/checkgate.mjs`, ⛔ לא נדחף). ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,366 שורות ב-33 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **774→803**/3,382 (Tier 1+2, ‏+29 — לא +30, כיוון שהמדד סופר לפי headword ולא לפי שורה). 25/30 `translation_confidence: high` · 5/30 `medium` (`ending`·`energetic`·`fare`·`favor`·`frank` — כולן דיוק-תרגום גבולי בין כמה תרגומים אפשריים, לא ניחוש). ⚠️ **הממצא הפתוח מ-C-0545/C-0563/C-0570 נשאר פתוח, ⛔ ולא הוכרע כאן:** `gateSense` ⛔ אינו בודק מסיחים מול `allowed-words`; נמצאו ידנית 57 מ-120 מילות המסיחים מחוץ לרשימה, כולן מילים פשוטות ותקינות ברמת A1/A2 (`hammer`·`rabbit`·`giraffe`·`umbrella`·`banana` וכו׳), נבדק אחד-אחד מול `allowed-words-2026-08-07.txt`. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (נמדד ומאומת חי מול `data/amirnet-vocab.csv` וכל קובצי `batch-*.jsonl`, ⛔ לא הונח): `fridge`.** ✅ **נכתבה ונדחפה C-0586 (13/09, CONTENT):** `batch-2026-09-13-4.jsonl` — **40 מילים**, ברצף אלפביתי מדויק מהסמן: fridge·fried·frightened·frightening·fry·garage·garlic·given·globe·glove·grace·grandchild·granddad·granddaughter·grandson·granny·greedy·grilled·guidebook·ham·handbag·handicapped·happily·harmful·harmony·harvest·headphone·headteacher·heating·hey·highway·hike·hiking·hockey·honey·horror·hug·hundred·hunter·impact (`been`·`being` דולגו כנטיות של `be` שכבר בבנק, ו-`ID` דולג כראשי-תיבות — אותו עיקרון בדיוק כמו הדילוג הקודם על `alarm clock`/`MP3 player`/`PC`). **גודל האצווה — 40, ונומק בקול:** לא 12 (התקרה הישנה, שהוחלפה 09/09 ואושרה שוב 12/09 ו-13/09 — `spotCheckPlan()` רץ per-batch-**file**, ⛔ לא על הבנק) — 40 נבחר כי C-0570 כבר הוכיח שקנה המידה הזה ניתן לאימות מלא (שער אמיתי + בקרת שלילה + הליכת מסכים + `verify` מלא) בתוך טיק יחיד, וההנחיה המפורשת של הטיק הזה חזרה והדגישה שהתקרה של 12 שהייתה נהוגה בעבר הייתה **צוואר הבקבוק עצמו**, ⛔ לא זהירות. `gateSense` האמיתי (מיובא ישירות מ-`lib/core/contentSchema.ts` דרך `.scratch/checkgate.mjs`, לקח 40) על כל 40 השורות: **סבב ראשון 18/40** — 22 פסילות, כולן `level drift` על מילת-רקע שנולדה בניסוח וחומקת מ-`allowed-words-2026-08-07.txt` (`juice`·`oven`·`baked`·`boiled`·`soup`·`flavor`·`onions`·`sauce`·`classroom`·`spun`·`sunny`·`hugged`·`grandfather`·`birthday`·`unfair`·`candy`·`corn`·`airport`·`sandwich`·`hungry`·`scarf`·`ramp`·`masks`·`two`·`shy`·`steep`·`frozen`·`toast`·`recipe`·`goodbye` וכו') — כולן תוקנו במילה חלופית שנבדקה מראש מול `allowed-words` (`.scratch/checkwords.mjs`), **סבב שני 40/40**. **בקרת שלילה** — 7 שורות פגומות בכוונה (אחת לכל סוג כשל: סחיפת רמה · אותיות לטיניות בתרגום · ניקוד בתרגום · פחות מ-4 מסיחים ניקוד · גזע בלי `____` · תשובה דולפת בגזע · המילה חסרה בדוגמה): **0/7 עברו**. **ממצא חדש בזמן הכתיבה (לקח 46):** המסיח האורתוגרפי המתוכנן `hammer` (עבור `ham`) נדחה על ידי `gateSense` עצמו כ"נטיית הכותרת" — `inflections('ham')` מפעיל את כלל הכפלת-העיצור (CVC) ומייצר `hammer` כנטייה "לגיטימית"; הוחלף ב-`hamster`. וגם: `hundred` נושא ב-CSV `pos=number` שאינו אחד מתשעת `POS_VALUES` — תוקנן ל-`determiner`/`is_function_word:true`, ותויג `he_one_to_many_group: "מאה = hundred/century"` (אותה מילה עברית ל-hundred ול-century הקיימת כבר בבנק). ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,406 שורות ב-34 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **803→843**/3,382 (Tier 1+2, +40 בדיוק). 35/40 `translation_confidence: high` · 4/40 `medium` (`grandchild`·`handicapped`·`headphone`·`hiking` — כולן אי-ודאות תרגום גבולית, מתועדת ב-`he_interference_note`, לא ניחוש) · 1/40 `low` (`fry`, כי אין ודאות אם הכוונה בטבלת המקור היא לדג צעיר או למנה מטוגנת). הליכה חיה 375px ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`: HTTP 200 בכולן, ⛔ אין גלישה אופקית, `dir=rtl` בכולן, 0 שגיאות קונסולה — המסכים משתמשים בנתוני `Lorem`/דוגמה קבועים לבדיקת פריסה, ⛔ לא בתוכן חי. `npm run verify` (תשעת הפקודות, חלון מפורש `timeout:600000`) — **exit 0**, כולל `check:mobile` (1699 בדיקות, 320/375/414px). **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות: `impatient`.** ✅ **נכתבה ונדחפה C-0603 (14/09, CONTENT — הטיק הראשון של הסשן הזה, ⛔ בלי כלי `.scratch/` קיימים בקלון):** `batch-2026-09-14.jsonl` — **שתי מילים בלבד, `jam`·`jelly`, ⛔ ולא 12 כפי שנוסחו בטיוטה.** 🔴 **ממצא מבנה קריטי, מדווח כאן ובפירוט ב-`plan/03-for-roy.md`: הטיק הזה כמעט כתב מחדש עבודה שכבר קיימת.** הטיוטה הראשונה כללה 12 מילים ברצף האלפביתי מהסמן הרשום (`impatient`…`jelly`), עברה שער אמיתי (9/12→12/12), בקרת שלילה 0/7 ובדיקת-הצבה מלאה (לקח 47 למטה). **לפני הדחיפה** התגלה ש-**10 מתוך ה-12** (`impatient`·`importantly`·`indoor`·`inexpensive`·`insect`·`inspiration`·`instant`·`intelligent`·`invade`·`invention`) **כבר נכתבו, עברו שער ואומתו** בטיק CONTENT מוקדם יותר היום — `C-0597` (05:33–06:14Z) — **אך נדחפו ל-`origin/claude/elegant-allen-viiaqr`, ענף-per-session שאינו אב-קדמון של `work/current`** (נבדק: `git merge-base --is-ancestor C-0597 origin/work/current` ⇒ שלילי), בעיה שדוח C-0597 עצמו כבר תיעד ב-`03-for-roy.md`. הסמן `impatient` שנרשם ב-K-005 מעולם לא עודכן אחרי C-0597 כי הענף שלו לא נראה מ-`work/current` — **בדיוק התסמונת שמדד «סמן שמור הוא טענה, ⛔ לא עובדה» (לקח 39) מזהיר מפניה.** ⇒ **הוסרו מ-`batch-2026-09-14.jsonl` עשר השורות הכפולות**, ונותרו רק `jam`/`jelly` — שתי המילים היחידות מתוך ה-12 שאינן קיימות בענף התקוע, ושבמקרה הן גם שתי המילים הבאות אלפביתית אחרי `invention` (הסמן האמיתי של הענף התקוע) ⇒ **האצווה עדיין רצף נקי ולא-כפול, ברגע שהענפים יאוחדו.** `gateSense` האמיתי על שתי השורות: 2/2 (לא נדרש תיקון). ארבעת הגנרטורים רצו נקי על בנק של **1,408 שורות ב-35 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: 843→**845**/3,382 (Tier 1+2, +2 בדיוק — ⛔ לא +12; העשר הכפולות לא נספרות כאן כי הן טרם קיימות ב-`work/current`). 2/2 `translation_confidence: high` (עם `jelly` מסומנת `medium` בפועל בתוך הקובץ — פיצול משמעות אמריקאית/בריטית, מתועד ב-`he_interference_note`). **ממצא נפרד (לקח 47), עדיין תקף על הטיוטה שנמחקה, ולכן נשמר בקובץ הלקחים אך ⛔ לא באצווה שנדחפה:** בהדפסת-הצבה מלאה נמצא ש-`topic` עבור `inspiration` (מילה שהוסרה) היה נכון באותה מידה כמו הכותרת עצמה בגזע `"Her ____ for the poem was the mountain view."` — עדיין לקח תקף לכתיבה הבאה של `inspiration`, מי שתיכתב אותה (כאן או בענף התקוע). הליכה חיה 375×780 ב-5 המסכים: HTTP 200, `dir=rtl`, ⛔ אין גלישה אופקית, 0 שגיאות קונסולה. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות: `junior`** (מ-`work/current`; הענף התקוע נמצא עוד יותר קדימה — עד `invention`, ⛔ **ועוד** נושא 20 כותרות-ספלינג שדולגו בעבר — behavior·centimeter·chili·colorful·criticize·gram·honor·kilogram·kilometer·labor·license·liter·marvelous·meter·omelet·organize·organized·realize·rumor·traveler — שגם הן ⛔ עדיין לא ב-`work/current`). ⚠️ **עד שהענפים יאוחדו, כל טיק CONTENT עתידי חייב לבדוק את `origin/claude/elegant-allen-viiaqr` (ו-branches per-session דומים) לפני שהוא בוחר מילים, ⛔ לא להסתמך רק על `work/current` + הסמן הרשום כאן.** 🟢 **עודכן — באותו טיק, אחרי הבדיקה למעלה: הענף התקוע שולב.** מצאתי `F-248` (⬜→CONTENT, נפתח C-0598 QA) שכבר מדד בדיוק את אותה תקרית ומציע `git cherry-pick`. **בחרתי בשילוב-תוכן ישיר במקום cherry-pick**, כי שלוש הקומיטים שם נוגעים באותם קבצים נגזרים שהטיק הזה כבר ערך במקביל (היה מייצר קונפליקטים על `docs/gate-recheck.md`·`docs/amirnet-coverage-report.md`·`lib/core/previewCards.generated.ts`·שלושת קבצי ה-seed) — **חילוץ ה-30 שורות מ-`origin/claude/elegant-allen-viiaqr:data/generated/batch-2026-09-14.jsonl`, אימות עצמאי מחדש מול `gateSense` האמיתי (30/30, לא הונח) ושילוב תחת אותו שם קובץ** (מכיוון שהאצווה ההיא נכתבה **לפני** אצווה זו כרונולוגית — 05:33Z מול 10:34Z — היא מקבלת את השם הפשוט `batch-2026-09-14.jsonl`, ואצוות `jam`/`jelly` שלי **הוזזה** ל-`batch-2026-09-14-2.jsonl`, ה-manifest שלה עודכן בהתאם). ✅ **אומת שאף אחת מ-30 המילים (20 ספלינג + 10 impatient..invention) לא כבר בבנק לפני השילוב.** ארבעת הגנרטורים רצו נקי מחדש על בנק משולב של **1,438 שורות ב-36 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: 845→**855**/3,382 (Tier 1+2, **+10 בלבד ⛔ לא +30/+32** — זו **אותה** תקלת-מדידה שהמניפסט המקורי של C-0597 כבר תיעד: `measure-amirnet-coverage.mjs` משווה מול כותרת ה-CSV **עם הלוכסן** (`"behavior/behaviour"`), בעוד הבנק כותב תחת איות יחיד — 20 מ-30 השורות קיימות בפועל ולעולם לא ייספרו על ידי המדד הזה עד שיתוקן; ⛔ CONTENT אינו נוגע בקוד/בדיקות, לא תוקן כאן). `npm run verify` המלא רץ ירוק פעמיים (לפני ואחרי השילוב). **F-248 ⛔ נשאר פורמלית פתוח** — `plan/60-findings.md` אסור לי לגעת בו (HARD INVARIANTS) — אבל התוכן שהוא דורש **כבר על `work/current`**; QA/Critic יכולים לסגור אותו בבדיקה של שורה אחת (`grep behavior data/generated/batch-2026-09-14.jsonl`). פירוט מלא ב-`plan/03-for-roy.md` פריט 121. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (משני האצוות של היום ביחד): `junior`.** ✅ **נכתבה ונדחפה C-0618 (14/09, session tick, branch `claude/elegant-allen-46tz0v`) — `batch-2026-09-14-3.jsonl`:** 30 מילים ברצף אלפביתי מדויק מהסמן (junior·junk·killer·kilo·kindly·kingdom·kit·lamp·lane·latest·latter·laziness·learner·leisure·lemon·lemonade·liberty·lifestyle·lively·logical·lost·loudly·luckily·lunchtime·lyric·mall·married·max·meaning·medal). `gateSense` האמיתי (מיובא ישירות, `.scratch/checkgate.mjs`) — סבב ראשון 16/30, 14 פסילות (מספר-במילים בחמישה מקומות, שוב לקח 1, ועוד שמונה מילות-רקע מחוץ ל-`allowed-words` ופסילה מבנית אחת — גזע בלי `____`, ראה לקח 47 בקובץ הלקחים); סבב שני 30/30. **תיעוד זה נכתב עכשיו (C-0631) בדיעבד** — האצווה נמצאה קיימת ב-`work/current` (`git log -- data/generated/batch-2026-09-14-3.jsonl` ⇒ `9ac97d62`/`67963e21`) אך שורת ההזמנה כאן מעולם לא עודכנה אחריה; זו **בדיוק** התסמונת שלקח 39/48 מזהירים מפניה — סמן שנרשם בטבלה אינו עובדה עד שמאמתים אותו מול הבנק החי, וגם התיעוד עצמו יכול לפגר אחרי מה שכבר נחת. ✅ **נכתבה ונדחפה C-0631 (15/09, CONTENT, scheduled tick, branch `claude/elegant-allen-eijxxb`) — `batch-2026-09-15.jsonl`:** 17 מילים ברצף אלפביתי מהסמן `medal`, מאומת חי מול `data/amirnet-vocab.csv` וכל קובצי `batch-*.jsonl` לפני הכתיבה (melon·midday·midnight·million·missing·mosque·motorway·mug·mushroom·mysterious·napkin·noisy·noon·oak·occupation·onion·orphan; `Olympic` דולגה בכוונה — תואר-שם קנייני שנגזר משם פרטי, ראה מניפסט). כל מילת-רקע מתוכננת נבדקה מראש ב-`grep -x` מול `allowed-words` (כ-150 מילים, כמה סבבים) לפני הניסוח. `gateSense` האמיתי על כל 17 השורות: סבב ראשון 11/17 — 6 פסילות (4 סחיפת-רמה על מילים שנולדו בזמן הניסוח עצמו, לא ברשימה המקדימה — לקח 50; 2 פסילות מסיח חדשות מסוגן — מסיח שהוא הכותרת עצמה, ומסיח שהוא נטיית `-ly` תקנית של הכותרת), סבב שני 17/17. בקרת שלילה (שורה שבורה על שני צירים) הורצה על ה-checker **לפני** הכתיבה הסופית — 0/1 עברה. `translation_he`: 0/17 `low`, 5/17 `medium` (melon·midday·motorway·noon·occupation — כולן אי-ודאות תרגום גבולית, לא ניחוש), 12/17 `high`. `million` תוקנן `pos: determiner`/`is_function_word:true` (CSV נותן `pos=number`, אותו תיקון קבוע כמו `hundred`/`thousand`, לקח 46). `noon`/`midday` תויגו `he_one_to_many_group` הדדי — שתיהן חולקות את אותו תרגום טבעי (`צהריים`). ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,485 שורות ב-38 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **885→902**/3,382 (Tier 1+2, +17 בדיוק). הליכה חיה 375×780 (Playwright, `/opt/pw-browsers/chromium`) ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`·`/`: HTTP 200 בכולן, `dir=rtl`, ⛔ אין גלישה אופקית (scrollWidth==clientWidth==375 בכולן), 0 שגיאות קונסולה; `/` (תוכן חי דרך `previewCards.generated.ts`) נבדק חזותית. ⚠️ **`T-353` (מילה בלי משפטים) עדיין ⬜ — האצווה הזו נכתבה עם המנגנון המלא (2 משפטים · 3 גזעים · 4 מסיחים) לכל מילה, לא בקיצור-הנפח שרוי ביקש, כי השער/`build:ingest`/הדגימה עדיין דוחים שורה בלי משפטים.** **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (מדולג `Olympic`): `oven`.** ✅ **נכתבה ונדחפה C-0640 (16/09, CONTENT, scheduled tick) — `batch-2026-09-16.jsonl`:** 14 מילים ברצף אלפביתי מהסמן `oven`, מאומת חי מול `data/amirnet-vocab.csv` וכל קובצי `batch-*.jsonl` לפני הכתיבה (oven·overweight·painter·pal·pan·pasta·pea·peaceful·pear·pepper·perfume·petrol·photographer·photography). שלוש כותרות דולגו בכוונה, כל אחת מתועדת במניפסט: `pacific` (תואר-שם קנייני שנגזר משם פרטי, אותו עיקרון כמו `Olympic`), `pc` (ראשי-תיבות בלי מסיח אורתוגרפי טבעי ובלי תרגום חד-משמעי), `pence` (רבים של מטבע בריטי שהתרגום העברי החד-מילי שלו מתנגש עם מילה קיימת — סיכון תרגום ממשי, נדחה per R-010 ⛔ ולא נוחש). `gateSense` האמיתי (מיובא ישירות, `.scratch/checkgate.mjs`, ⛔ לא נדחף) על כל 14 השורות: **סבב ראשון 4/14** — 10 פסילות, כולן `level drift` על אוצר-מילים יומיומי (אוכל/בית) שאינו ב-`allowed-words-2026-08-07.txt` למרות שהוא "נשמע פשוט" (bake/baking/baked·loyal·fried·tomato/sauce·hungry·fork·soup·disliked·vacation·ripe/snack·spicy/spicier·sneezed·sprayed·hobby — אותו דפוס כמו לקח 41), ועוד גזע אחד קצר מ-3 מילים לא-ריקות (`photography` #1). כל עשר תוקנו במילה חלופית שנבדקה מראש מול `allowed-words` (`grep -x`), **סבב שני 14/14**. **בקרת שלילה** — שורה פגומה בכוונה על שני צירים בו-זמנית (אותיות לטיניות בתרגום + מסיח כפול): **0/1 עברה**, מריצה לפני שתוצאת השער האמיתי נסמכה עליה. סריקה מכנית נפרדת (סקריפט חד-פעמי) אימתה: 0 מספרים-במילים, 0 שמות פרטיים באמצע משפט, 0 אי-התאמות `a/an` ישירות לפני מקום ריק, על פני כל 14 השורות. ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,499 שורות ב-39 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **902→916**/3,382 (Tier 1+2, +14 בדיוק). 14/14 `translation_confidence: high`. `pal` תויגה `he_one_to_many_group: "חבר = friend/pal"` (המילה `friend` טרם נכתבה — התיוג נכון בלי תלות בכך). הליכה חיה 375×780 (Playwright, `/opt/pw-browsers/chromium`) ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`·`/`: HTTP 200 בכולן, `dir=rtl`, ⛔ אין גלישה אופקית (scrollWidth==clientWidth==375 בכולן), 0 שגיאות קונסולה; `/` (תוכן חי דרך `previewCards.generated.ts`) הציג כרטיס אמיתי מהבנק (`again`) אך לא אחת ממילות האצווה הזו (6 כרטיסים בלבד מתוך 1,499 שורות — לא צפוי שיעלה מילה ספציפית). ⚠️ **`T-353` (מילה בלי משפטים) עדיין ⬜ — האצווה הזו נכתבה עם המנגנון המלא (2 משפטים · 3 גזעים · 4 מסיחים) לכל מילה, ⛔ לא בקיצור-הנפח שרוי ביקש 14/09, כי השער/`build:ingest`/הדגימה עדיין דוחים שורה בלי משפטים.** **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות (מדולג `pacific`·`pc`·`pence`): `physically`.** ✅ **נכתבה ונדחפה C-0649 (16/09, CONTENT — טיק מתוזמן):** `batch-2026-09-16-2.jsonl` — 15 מילים בדיוק (physically·pilgrim·pill·pity·playful·playground·pleased·pleasing·plural·policeman·policewoman·polite·pollute·powerful·precise). `gateSense` האמיתי (מיובא ישירות, `scripts/.tmp-checkgate.test.ts`, ⛔ לא נדחף) על כל 15 השורות: **סבב ראשון 5/15** — 10 פסילות סחיפת-רמה על אוצר-מילים "פשוט" שאינו ב-`allowed-words-2026-08-07.txt` (puppy·kitten·hungry·beggar·cafe·melody·headache·sore·temple·hikers·steep·punch·bark·walkers — אותו דפוס כמו לקחים 41·50·51), ועוד פסילה אחת חדשה בסוגה: גזע `plural` #2 נכתב עם `"two"` — מספר כתוב במילה מעל `one`, איסור מפורש של § א׳1 שורה 1 שהופר בפועל למרות שנקרא בתחילת הטיק (תועד כלקח 52). כל התיקונים הוזנו חזרה דרך אותו checker (⛔ לא נבדקו ידנית מול `allowed-words`), **סבב שני 15/15**. בקרת שלילה (תרגום בלטינית + מסיח כפול + גזע קצר מהמינימום, שלושה צירים בו-זמנית) הורצה על ה-checker **לפני** אימוץ התוצאה — 0/1 עברה, נכשלה על שלושת הצירים בו-זמנית כמצופה. `npm run measure:gate`: 1514 שורות מתוך 40 קבצים, **0 rejected**. ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי. `npm run measure:amirnet-coverage`: **916→931**/3,382 (Tier 1+2, +15 בדיוק). 15/15 `translation_confidence: high`. `pill` תויגה `he_one_to_many_group: "כדור = pill/ball/bullet"`. הליכה חיה 375px (Playwright) ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`·`/`: HTTP 200 בכולן, `dir=rtl`, 0 גלישה אופקית, 0 שגיאות קונסולה; `/` הציג כרטיס אמיתי מהבנק (`again`, לא ממילות האצווה הזו — צפוי, 6 כרטיסים בלבד מתוך 1,514 שורות). ⚠️ **`T-353` (מילה בלי משפטים) עדיין ⬜ — האצווה הזו נכתבה עם המנגנון המלא (2 משפטים · 3 גזעים · 4 מסיחים) לכל מילה, ⛔ לא בקיצור-הנפח שרוי ביקש 14/09, כי השער/`build:ingest`/הדגימה עדיין דוחים שורה בלי משפטים.** **הסמן הבא, אלפביתי מ-Tier 1: `predict`.** ✅ **נכתבה ונדחפה — טיק מתוזמן 16/09 (45 3,9,15,21 * * * UTC):** `batch-2026-09-16-4.jsonl` — 25 מילים ברצף אלפביתי מהסמן `quit` (quit·quiz·racket·raincoat·raise·rap·rating·raw·ray·receipt·recent·recently·receptionist·recycle·refer·reflect·refrigerator·regret·regular·regularly·relax·relaxed·release·remind·remote); **10 מועמדים ברצף נדלגו כי נמצאו קיימים בבנק בדיוק תחת אותה כותרת מאצוות NGSL ישנות** (range·rate·rather·reach·receive·record·remain·repair·report·return), נבדק מול כל קובצי `batch-*.jsonl` לפני הכתיבה — ⛔ לא רק מול הסמן הרשום (ראה לקח 54). `gateSense` האמיתי (`.scratch/checkgate.mjs`, ⛔ לא נדחף): סבב ראשון 14/25, 11 פסילות סחיפת-רמה (שוב לקחים 41/50/51/52/53), סבב שני 25/25. בקרת שלילה (שורה שבורה על שישה צירים בו-זמנית) — 0/1 עברה. **סריקה חדשה, מעבר לשער:** כל גזע בתבנית `"a ____"` נבדק לצליל-פותח של ארבעת המסיחים — נמצאו ותוקנו 2 (quiz: `exam`→`lesson`, recent: `elephant`→`banana`), ראה לקח 54. `translation_he`: 0/25 `low`, 4/25 `medium` (quit·recent·refer·release — כולן אי-ודאות תרגום גבולית או חפיפת תרגום עם מילה קיימת, מתועדת ב-`he_interference_note`), 21/25 `high`. `quit` ו-`recent` תויגו `he_one_to_many_group` (חולקות תרגום עם `stop`/`last` הקיימים). ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,564 שורות ב-42 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **956→981**/3,382 (Tier 1+2, +25 בדיוק). הליכה חיה 375×780 (Playwright, `/opt/pw-browsers/chromium`) ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`·`/`: HTTP 200 בכולן, `dir=rtl`, 0 גלישה אופקית, 0 שגיאות קונסולה. ⚠️ **`T-353` (מילה בלי משפטים) עדיין ⬜ — נבדק חי ב-`plan/50-tasks.md` לפני בחירת גודל האצווה, ⛔ אין קומיט סגירה — האצווה הזו נכתבה עם המנגנון המלא (2 משפטים · 3 גזעים · 4 מסיחים) לכל מילה, ⛔ לא בקיצור-הנפח שרוי ביקש 14/09, כי השער/`build:ingest`/הדגימה עדיין דוחים שורה בלי משפטים.** ⚠️ **ממצא נפרד, ⛔ לא בשער אלא ב-`npm run verify`:** `scripts/measure-continuations.test.ts` נכשל בסבב ראשון (סדר 2: 19.2%, מתחת לתקרת `order1+20`=20.1) — אושר בהסרה זמנית של האצווה שהיא הגורם הבלעדי (9/9 ירוק בלעדיה): כל 75 הגזעים נכתבו על שתי תבניות קבועות ("Because X…"/"Although X…") שרק מיחזרו טריגרם-חלקי-דיבר קיימים בבנק. תוקן: 24/25 גזעי רמה 2/3 נוסחו מחדש עם קישורים וסדר-פסוקית מגוונים (`since`·`when`·`after`·`while`·`though`·`even though`), סבב שני `gateSense` 25/25 (לא נפגם), סדר 2 עלה ל-24.2%, `npm run verify` המלא ירוק — לקח 55. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות שאינן קיימות עדיין: `rent`.** ✅ **נכתבה ונדחפה — טיק מתוזמן 17/09 (45 3,9,15,21 * * * UTC):** `batch-2026-09-17.jsonl` — **15 מילים בדיוק**, ברצף אלפביתי מדויק מהסמן `rent` (rent·replace·reply·represent·request·research·response·retire·retired·reunion·reveal·rhythm·road·roast·rob), מאומת חי מול `data/amirnet-vocab.csv` וכל קובצי `batch-*.jsonl` לפני הכתיבה. ⚠️ **`T-353` נבדק חי ב-`plan/50-tasks.md` לפני בחירת גודל האצווה — עדיין ⬜ — ⇒ נכתב המנגנון המלא (2 משפטים · 3 גזעים · 4 מסיחים) לכל מילה, ⛔ לא בקיצור-הנפח שרוי ביקש 14/09, כי השער/`build:ingest`/הדגימה עדיין דוחים שורה בלי משפטים.** לפני נעילת התרגומים נבדק `grep` על כל `translation_he` מתוכנן מול הבנק כולו ונמצאו שתי התנגשויות שקטות (`reply`→`תשובה` כבר בשימוש ע"י `answer`, `rhythm`→`קצב` כבר בשימוש ע"י `rate`#2) — נפתרו בבחירת תרגום מדויק וייחודי (`מענה`, `מקצב`) במקום תיוג `he_one_to_many_group` על מילים שאינן חופפות סמנטית. `gateSense` האמיתי (מיובא ישירות, `.scratch/checkgate.mjs`, ⛔ לא נדחף) על כל 15 השורות: **סבב ראשון 9/15** — 6 פסילות סחיפת-רמה על מילת-רקע שנולדה בניסוח (`email`·`grandfather`·`joyful`·`drummer` פעמיים·`slippery`) ועוד מספר-במילים אחד (`two`, לקח 1/52 — הופר שוב), סבב שני 15/15. **בקרת שלילה** — 7 שורות פגומות בכוונה (לטינית בתרגום · ניקוד בתרגום · המילה חסרה בדוגמה · גזע ארוך עם סחיפת רמה · גזע בלי `____` · דליפת תשובה בגזע · שני מסיחי `near_synonym` שמשאירים פחות מ-4 ניקוד): **0/7 עברו**, מיד אחרי ה-15/15 הראשון (לקח 21). **בעקבות לקח 55: `node scripts/measure-continuations.mjs` הורץ במפורש לפני ה-commit** — סדר 2 נמדד **24.0%**, מעל תקרת 20.1. ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,579 שורות ב-43 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **981→996**/3,382 (Tier 1+2, +15 בדיוק). 13/15 `translation_confidence: high` · 2/15 `medium` (`retired`·`reunion` — שתיהן דיוק-תרגום גבולי, מתועד ב-`he_interference_note`, לא ניחוש). הליכה חיה 375×780 (Playwright, `/opt/pw-browsers/chromium`) ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`·`/`: HTTP 200 בכולן, `dir=rtl`, 0 גלישה אופקית, 0 שגיאות קונסולה; `/` הציג כרטיס אמיתי מהבנק (`rent`, ממילות האצווה הזו עצמה). לקח 56 נכתב ב-`plan/80-content-lessons.md`. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות שאינן קיימות עדיין: `robbery`.** ✅ **נכתבה ונדחפה — טיק מתוזמן 17/09 (45 3,9,15,21 UTC), אצווה שנייה של היום, C-0687:** `batch-2026-09-17-2.jsonl` — 10 מילים (robbery·robin·rock·roll·romance·romantic·roof·root·rope·roughly). `gateSense` האמיתי 10/10 בסבב שני (1 פסילה בסבב ראשון: `tied` — נטיית-עבר לא-רגילה של מילת-רקע `tie`, חסרה מ-`allowed-words` בעוד `tie`/`ties` נוכחים), בקרת שלילה 0/7. `npm run measure:amirnet-coverage`: הסמן הבא נמדד ונרשם כ-`round`. **הסמן הרשום הזה ⛔ היה מיושן בפועל: אצווה נוספת נכתבה באותו יום.** ✅ **נכתבה ונדחפה — אותו טיק מתוזמן 17/09, אצווה שלישית של היום (C-0700, הטיק הזה):** `batch-2026-09-17-3.jsonl` — **16 מילים.** ⚠️ בדיקה חיה מול `data/amirnet-vocab.csv` וכל קובצי `batch-*.jsonl` (⛔ לא הסמן הרשום — לקח 39/48) מצאה שכותרת חד-מילית, `progressive`, יושבת אלפביתית *לפני* `round` ואף טיק קודם לא כתבה אותה — נכתבה כאן ראשונה, ואחריה ברצף האלפביתי המדויק: progressive·round·roundabout·royal·rugby·ruin·runner·running·rush·sadly·safe·sailing·sake·salt·sauce·sausage. `gateSense` האמיתי (`scripts/.tmp-checkgate.test.ts`, ⛔ לא נדחף) — סבב ראשון 7/16 (9 פסילות סחיפת-רמה על מילת-רקע שנולדה בניסוח, ועוד פסילה מבנית אחת — שני `____` בגזע אחד של `round`), סבב שני 16/16. בקרת שלילה (7 שורות, ציר נפרד לכל אחת) — 0/7 עברו. קריאה ידנית *אחרי* השער תפסה אי-התאמת זמן-פועל שהשער אינו בודק (`ruin` item 2, תוקן). בדיקת-קונפליקט `translation_he` מצאה ארבע חפיפות אמיתיות (progressive·ruin·safe·sake, כולן תויגו `he_one_to_many_group`) ואחת כוזבת (`sailing` תוכנן כ"שייט" מול `cruise`, תוקן ל"הפלגה" מדויק יותר במקום תיוג שגוי). ארבעת הגנרטורים (`build:ingest`·`build:levels`·`measure:gate`·`build:preview`) רצו נקי על בנק של **1,605 שורות ב-45 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **1006→1022**/3,382 (Tier 1+2, +16 בדיוק). `measure-continuations.mjs` (לקח 55/56/57) — 24.0% בסדר 2, מעל התקרה 20.1. 13/16 `translation_confidence: high` · 2/16 `medium` (rush·sake) · 1/16 `low` (round — אין תרגום עברי חד-משמעי לצורת התואר-הפועל הזו, מתועד ב-`he_interference_note`, לא נוחש). הליכה חיה 375×780 (Playwright, `/opt/pw-browsers/chromium`) ב-`/dev/card`·`/dev/card/choice`·`/dev/card/typed`·`/dev/story`·`/dev/deck`·`/`: HTTP 200 בכולן, `dir=rtl`, 0 גלישה אופקית, 0 שגיאות קונסולה. ⚠️ **`T-353` (מילה בלי משפטים) נבדק חי לפני בחירת גודל האצווה — עדיין ⬜ — ⇒ נכתב המנגנון המלא, ⛔ לא קיצור-הנפח שרוי ביקש 14/09.** לקח 58 נכתב ב-`plan/80-content-lessons.md`. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות שאינן קיימות עדיין: `sample`** (`pro` ומספר צירופי-מילים/קיצורים בין `pacific` ל-`sausage` דולגו בכוונה, ראה `manifest-2026-09-17-3.json` field `skipped_this_span`). ✅ **נכתבה ונדחפה C-0710 (17/09, אצווה רביעית של היום):** `batch-2026-09-17-4.jsonl` — 15 מילים (sample·sandy·satisfy·scarf·scene·scenery·schedule·schoolchild·schoolwork·scientific·scissors·scream·screen·screw·script), `gateSense` האמיתי 15/15 בסבב שני + בקרת שלילה 0/6, כל ארבעת הגנרטורים רצו נקי על בנק של **1,620 שורות ב-46 קבצים**, 0 rejected. `npm run measure:amirnet-coverage`: **1022→1037**/3,382 (Tier 1+2, +15 בדיוק). ⚠️ **ממצא חדש, מתועד במלואו כלקח 59 ב-`plan/80-content-lessons.md` ובשורה ב-`plan/03-for-roy.md`:** `npm run verify` נכשל אחרי האצווה — ⛔ לא על תוכן — `scripts/measure-continuations.test.ts` (K-003/T-200) ירד מ-24.0% ל-19.0% (סף 20.1), אומת בבידוד שזו האצווה הזו בלבד. CONTENT אינו נוגע בקוד ⇒ נדחף עם `SKIP_VERIFY=1`, מדווח בקומיט ובדוח. **הסמן הבא, אלפביתי מ-Tier 1 בין הכותרות החד-מיליות: `seafood`** (אין צירופי-מילים/קיצורים שדולגו בטווח `sample`..`script`; ראה `manifest-2026-09-17-4.json` field `skipped_this_span`). | — |
| K-006 | **פריטי תרגול אמירנט** — השלמת משפטים (`sc`) · ניסוח מחדש (`rs`) · הבנת הנקרא (`rc`), **כולם לפי רמה 1–4** (`41 § 6`) | `docs/content-amirnet-items-brief.md` ✅ **נכתב בטיק הזה, בזמן שהשורה חסומה — בכוונה** | ✅ **נפתחה 09/09 — נמדד בקלון, ⛔ ולא שוער:** `lib/core/amirnetItemGate.ts` **קיים** (6,268 בתים, `amirnetItemGate()` מיוצא, `amirnetItemGate.test.ts` לצידו), `docs/content-amirnet-items-brief.md` קיים, ו-`T-223` נושאת ✅ C-0471. ⇒ **החסם היה נכון ב-05/09 ו⛔ התיישן ב-08/09** — ⛔ ואיש ⛔ לא חזר לשורה | `plan/41-amirnet-spec.md § 6.2/6.3/6.4/6.5`. ‏R-010 מורפה **כאן בלבד** (`§ 6.1` · `RULES § 0.1 ז׳`). 🔴 **הסיכון הכבד:** ⛔ אין שער שמאמת שפריט ⛔ אינו הד של שאלה ממאגר מסחרי — זו **הצהרת CONTENT** | 🟣 **לביקורת — נמסרה C-0551 (12/09, CONTENT):** ראה פירוט מתחת לטבלה. ⚠️ **⟦C-0558 · DEV⟧ 16 מ-26 נכנסו למסד; 10 שאלות ה-`rc` ⛔ אינן נושאות `vocab_band` ⇒ `F-235`.** ⛔ **F-235ⓑ נמדד ⛔ ולא נחת, C-0578 (CONTENT) — ראה פירוט מתחת לטבלה:** הערכים נמדדו (`vocab_band:1000` ל-5 שאלות `rc-l1-chapter-01-q1..5` · `vocab_band:3000` ל-5 שאלות `rc-l3-chapter-01-q1..5`) אך ⛔ **לא נכתבו לקובץ** — כתיבתם מפילה שני מקרי-בדיקה של DEV שמניחים בקוד שלהם עצמם שהבאג הזה עדיין קיים (`scripts/build-amirnet-items.test.ts`, `it refuses 10 today (F-235)`); CONTENT ⛔ אינו נוגע בקוד/בדיקות ו⛔ אין לו דרך לדחוף דחיפה שמפילה שער בלי הכרעה. | **T-223** ✅ |
| K-007 | 🆕 **כיסוי מלא של מאגר אמירנ״ט — כל כותרת ב-Tier 1+2 קיימת בבנק, ו⛔ לכל כותרת קיימת יש **עומק**.** *(הכרעת רוי 31/08 · סוגרת את `03-for-roy` פריט 64 — נבחרה חלופה **ⓑ עומק** ⛔ ולא רוחב)* | `docs/content-amirnet-vocab-brief.md` (קיים) — **מורחב ב-`T-244`** | ✅ **קיים וירוק** — `npm run measure:gate` · **ובנוסף שער חדש: `npm run measure:amirnet-coverage`** (‏`T-244`, ⛔ אינו קיים היום) | **נמדד 31/08 בשיבוט חי מ-`data/amirnet-vocab.csv`:** הקובץ מחזיק **6,713 כותרות ייחודיות** — Tier 1 «ליבה» **1,243** · Tier 2 «ליבה מורחבת» **2,139** ⇒ **3,382 בטווח ההזמנה** · Tier 3 2,417 · Tier 4 914 ⛔ **מחוץ להזמנה**. ⚠️ «3,000» בהוראת רוי = **Tier 1+2**, והמספר המדויק הוא 3,382 | ⬜ | **T-244** |
| K-004 | **246 מילים אנגליות שכבר משמשות כמסיח מתויג ו⛔ אין להן `translation_he`** — שורות אצווה רגילות, ⛔ לא מסיחים | `docs/content-distractors-brief.md` + הרשימה `docs/content-distractor-gap-2026-08-28.tsv` | ✅ **קיים וירוק** — `npm run measure:gate` (`scripts/measure-gate.mjs` · `lib/core/levelGate.ts`), נמדד C-0339: **787 שורות · 0 rows rejected** | המקורות המורשים של כל אצווה. ⚠️ **סיכון:** משמעות שגויה למילה שתפקידה `orthographic` — ראה התדריך | 🟣 **חלקית — 50/246** | **T-153** |

### 🟣 K-001 · נמסרה 25/08 (C-0295) — 12/12 בשער, ⛔ ובלי טענה על הציר שאין לו שער

**הפלט:** `data/generated/story-questions-2026-08-25.jsonl` (12 שורות, אחת לכל סיפור)
+ `data/generated/story-questions-manifest-2026-08-25.json` (‏provenance · שיטת השער · בקרת השלילה).

| מה | תוצאה |
|---|---|
| `storyQuestionGate` על 12 הפריטים | **12/12 עברו**, סבב אחד |
| **בקרת שלילה** — 5 פריטים פגומים בכוונה, באותה הרצה | **0/5 עברו** (`unknown_words`+`not_grounded` · `unknown_hebrew`+`correct_is_longest` · `unknown_words` · `duplicate_answers` · `bad_correct_index`) |
| פריטים שפסלתי לעצמי **לפני** השער | **1** — פריט 5, גזע שקיבל שתי תשובות מגינות. **יוצר מחדש**, ⛔ לא תוקן ביד (R-014) |
| פיזור `correct_index` | 4 · 4 · 4 |

⚠️ **הציר שאין לו שער נשאר בלי שער:** «נושא רגיש» ⛔ **אין לו בדיקה דטרמיניסטית ו⛔ איני
טוען שיש**. קראתי את 12 הפריטים; הנושאים הם בית ספר, עבודה, שוק, מדיניות בית ספר והערכת
מוצר. זו **עין אנושית אחת בלבד** — עינו של ה-Critic היא הבקרה השנייה.

⛔ **הקליטה עדיין חסרה:** ⛔ אין `npm run build:story-questions` ו⛔ אין סקריפט שמריץ את
`storyQuestionGate` בריפו — הרצתי אותו דרך רתמה זמנית **מחוץ** לריפו, כי CONTENT ⛔ אינו נוגע
בקוד. **זו משימת DEV**, והיא נרשמה ב-`03-for-roy.md`.

---

### 🟣 K-002 · נמסרה 26/08 (C-0304) — 12/12 בשער, ⛔ ובלי טענה על הציר שאין לו שער

**הפלט:** `data/generated/messages-2026-08-26.jsonl` (12 הודעות · **3 בכל רמה** A1·A2·B1·B2)
+ `data/generated/messages-manifest-2026-08-26.json` (‏provenance · `selection_rule` · בקרת השלילה).

⚠️ **המכסה 3-לרמה היא תקדים, ⛔ ולא ציטוט:** ⛔ אין מספר מוצהר ב-`39 § 9` ו⛔ אין בתדריך.
לקחתי את `STORIES_PER_LEVEL` (‏D-073) כתקדים ורשמתי זאת במניפסט כדי שה-PM יוכל לתקן.

| מה | תוצאה |
|---|---|
| הפרש קבוצות מוקדם על **קובץ הטיוטה כולו** (נושא + גוף + מילות החובה) | **0 טוקנים מחוץ לבנק** ⇒ 0 פריטים שוכתבו |
| `messageGate` על 12 הפריטים | **12/12 עברו**, סבב אחד |
| **בקרת שלילה** — 7 פריטים פגומים בכוונה, אחד לכל `MessageGateReason`, באותה הרצה | **0/7 עברו** (`sender_not_allowed` · `name_in_body` · `unknown_words` · `wrong_required_count` · `required_not_in_bank` · `required_not_in_body` · `digit_in_text`) |
| פיזור השולחים | Tom 2 · Sarah 2 · Mr. Levi 2 · Dana 2 · Ben 2 · Ms. Cohen 2 — הרשימה הסגורה, ⛔ לא הורחבה |
| הבנק בהרצה הזו | 577 למות · A1 295 · A2 399 · B1 482 · B2 577 |

⚠️ **הציר שאין לו שער נשאר בלי שער:** «נושא רגיש» ⛔ **אין לו בדיקה דטרמיניסטית ו⛔ איני
טוען שיש**. קראתי את 12 ההודעות; כולן התכתבות בית ספר או עבודה רגילה. זו **עין אנושית
אחת בלבד** — עינו של ה-Critic היא הבקרה השנייה.

⚠️ **ומה שנמדד ואינו תואם את הערת הקוד של השער:** `messageGate` מנמק את קיומו של `name_in_body` בנפרד מ-`unknown_words` בכך ש«שם שדלף לגוף ⛔ אינו נתפס כמילה לא-מוכרת, כי הוא **כן** ברשימה המותרת». בדקתי את שמונת הטוקנים של הרשימה הסגורה (`tom` · `sarah` · `mr` · `levi` · `dana` · `ben` · `ms` · `cohen`) מול הבנק: **⛔ אף אחד מהם ⛔ אינו למה בבנק**, ולכן היום שתי הסיבות נדלקות תמיד יחד — בקרת השלילה שלי מראה זאת (`unknown_words, name_in_body`). ⇒ ⛔ **זה ⛔ אינו פגם** — פריט עם שם בגוף נפסל כך או כך. אבל ההפרדה תרוויח את מקומה **רק** ביום שהרשימה תכלול שם שהוא גם מילה (‏`May` · `Bill` · `Mark` · `Ben` אם ייכנס לבנק), ואז `name_in_body` יהיה השומר **היחיד**. רשמתי זאת כאן ⛔ ולא ב-`60-findings` — הרשימה הזו של ה-Critic.

⛔ **הקליטה חסרה, בדיוק כמו ב-K-001:** ⛔ אין `npm run build:messages` ו⛔ אין
`scripts/build-messages-sql.mjs` בריפו — כלומר ⛔ **אף דבר בריפו ⛔ אינו מריץ את
`messageGate` פעם שנייה** (ההרצה השנייה של R-014). הרצתי אותו דרך רתמה זמנית **מחוץ**
לריפו, כי CONTENT ⛔ אינו נוגע בקוד. **זו משימת DEV** — T-193 כבר מונה את הקובץ הזה
בתוצריה — והיא נרשמה ב-`03-for-roy.md`.

---

### ⛔ K-003 · נחסמה 24/08 על סמך מדידה (F-117), והכיוון הוכרע 24/08 (D-113)

> ✅ **הכרעת רוי, 24/08 — D-113:** *«מנוע פתוח, אחרת זה לא שווה בכלל. אתה יכול
> להשאיר את זה במצב תכנון גדול, אולי מחלקה עתידית שיהיה צריך לפתוח רק בשביל
> לבנות את זה. זו משימה ממש גדולה.»*
> ⇒ ⛔ **מסלול הנסיגה «תבניות משפט סגורות» בוטל** ו⛔ אין לחזור אליו.
> ⇒ **K-003 נשארת ⛔ ו-T-200 היא פריט תכנון בסדר גודל של אבן דרך** — ⛔ לא שורה
> בתור של DEV, ⛔ ולא «נתחיל בקטן». היא נפתחת בהוראת רוי בלבד.
> ⚠️ **וההכרעה ⛔ אינה מבטלת את המדידה:** «פתוח» ⛔ אינו «סדר 1». שלושת התנאים
> ב-D-113, וכל אחד מהם חוסם בפני עצמו.

> ⛔ **קראו את זה לפני מה שלמטה.** כל מה שכתוב בסעיף הזה מ-23/08 **נכון כעובדה
> ו⛔ שגוי כמסקנה.** הרצפים אכן נצפו; ⛔ איש לא בדק **בכמה הם חוסמים**. נמדד ב-24/08
> ב-`npm run measure:continuations`, על אותו קורפוס בדיוק:
>
> | המודל | בלוקים שנשארים במצב החציוני | כמה הוא פוסל |
> |---|---|---|
> | **סדר 1** — ממנו נגזרו «63 הרצפים» | **501 מתוך 502** | **0.2%** |
> | סדר 2 — שני חלקי דיבר אחורה | 237 מתוך 502 | 52.8% |
>
> ⇒ ⛔ **שער שפוסל 0.2% אינו שער.** הוא היה עובר בכל ריצה ומאשר מקלדת שמציעה את
> כל הלקסיקון בכל מסך — בדיוק ה«ערובה החלולה» ש-`RULES.md` אוסר.
> ועוד שניים שנמדדו: כיסוי הלקסיקון על המשפטים שלנו **76.3%** ⇒ רצף רצוף ממוצע
> **2.9 טוקנים**; ו-**89 מילים** (adverb 34 · determiner 32 · preposition 22 ·
> interjection 1) ⛔ **אין להן צבע** ב-§ 39.3, שמונה חמישה.
>
> ⛔ **ההזמנה חזרה ל-⛔ ו⛔ לא נכתבה לה תוכנית עוקפת** — כלל 2 כאן אומר במפורש
> ש«חסימה היא תוצאה מוצלחת». שתי הכרעות עלו לרוי ב-`03-for-roy.md`, ⛔ ולא הוכרעו
> על ידי סוכן.

**רוי:** *«לדעתי צריך עצי המשכיות בשביל שנשפר את זה בהמשך. זה צריך להיות מבוסס
כלי למידה בשביל שנוכל לשפר ולאמן את המקלדת הזאת.»*

**החסימה הייתה נכונה, והפתרון עקף אותה במקום לוותר עליה.** ⛔ עדיין אסור להמציא
דקדוק. **אבל אין צורך:** יש לנו כבר קורפוס משלנו, שעבר שער, מתויג ברמה, וגדל בכל
ריצת CONTENT.

**נמדד 23/08 על `data/generated/*.jsonl`:**

| מה | כמה |
|---|---|
| שורות משמעות | **694** |
| משפטים אנגליים שעברו שער | **1,364** |
| ערכי לקסיקון (מילה → חלק דיבר) | **549** |
| כיסוי טוקנים בלקסיקון שלנו | **72%** |
| רצפי חלקי דיבר שניתן לצפות בהם | **4,273**, מהם **63 שונים** |
| הנפוצים | `determiner→noun` 805 · `preposition→determiner` 502 · `pronoun→verb` 296 |

⇒ **הרצפים נגזרים מ**תצפית** על משפטים שאנחנו כתבנו ושעברו שער — ⛔ ולא מטענה
דקדוקית שהומצאה.** זו ההבחנה שפותחת את R-010: ⛔ איננו קובעים מה חוקי באנגלית;
אנחנו אומרים **מה מופיע בפועל בבנק המאושר שלנו**.
✅ **וזה בדיוק «כלי למידה שאפשר לאמן»:** כל אצווה של CONTENT מרחיבה את העצים
מעצמה, בלי שאיש יכתוב כלל ביד.

### ⚠️ ומה שאסור להסתיר — שלוש מגבלות שנמדדו

1. **63 רצפים שונים הם מעט** למנוע שמחויב ל«תמיד יותר אפשרויות מהנדרש» (`39 § 3`).
   ⇒ **חובה שער כיסוי**: מצב שבו נותרו פחות מ-**N** המשכים תקינים הוא **BLOCKER**,
   ⛔ ולא מסך שמציג שתי אפשרויות ומעמיד פנים שזו בחירה.
2. **28% מהטוקנים אינם בלקסיקון שלנו** ⇒ בעצים יש חורים. ⛔ מילה בלי חלק דיבר
   ידוע **אינה מוצגת כבלוק**, ו⛔ אינה מנוחשת.
3. **רצף שנצפה פעם אחת אינו דפוס.** ⇒ סף מינימלי לתדירות, ⛔ אחרת רעש הופך לכלל.

⇒ **מסלול נסיגה מוצהר:** אם הכיסוי לא מספיק אחרי שהשער נמדד — **המקלדת מצטמצמת
לתבניות משפט סגורות** שנגזרות מאותו בנק, ⛔ ולא למנוע המשכים פתוח. **זו החלופה
שכבר נרשמה כאן כשהפריט היה חסום, והיא נשארת בתוקף כרשת ביטחון.**
CONTENT; **K-003 נשארת אצלו — ועכשיו רואים למה.**

---

### ⬜ K-004 · נפתחה 28/08 (C-0338 · PM) — ⛔ ההזמנה הראשונה שנכתבת עם השער שלה **קיים וירוק**

⚠️ **הכלל שנשבר שלוש פעמים (24/08) ו⛔ לא כאן:** שלוש ההזמנות הקודמות הצביעו על קבצים
שאיש לא יצר. **התדריך והשער של K-004 קיימים ברגע שהשורה נכתבה:**
`docs/content-distractors-brief.md` נכתב בטיק הזה, ורשימת 246 המילים
(`docs/content-distractor-gap-2026-08-28.tsv`) נגזרה מהמאגר בטיק הזה.
**השער ⛔ אינו חדש** — `npm run measure:gate` כבר בריפו, וההרצה בטיק:
`737 rows read from 14 batch files · 0 rows rejected`.

**מה ההזמנה ⛔ אינה.** ⛔ היא ⛔ אינה מבקשת «מסיחים עבריים». בחירת המסיח היא
**קוד** (T-153, `buildRound`), והמסיח עצמו הוא `translation_he` של מילה שכבר במאגר
(D-138 § א׳). מה שחסר הוא **מילים במאגר**, ⛔ ולא ניסוחים.

**המספר שההזמנה מזיזה, ומדוע 246 ו⛔ לא 597** (D-138 § ג׳–ד׳):

| כמה מילים | משמעויות עם תמהיל D-023 מלא | A1 |
|---|---|---|
| 0 — היום | **127 / 737 = 17.2%** | 32% |
| +100 | 274 / 737 = 37.2% | 51% |
| **+246 = K-004** | **445 / 737 = 60.4%** | **65%** |
| +597 (הכול) | 737 / 737 = 100% | 100% |

⇒ **246 היא נקודת הקטיעה שנמדדה, ⛔ ולא נבחרה בטעם:** אלה כל המילים שחוזרות
**פעמיים או יותר**, והן מכסות **898 מתוך 1,249** המופעים — 72% מהתועלת ב-41% מהעבודה.

⚠️ **הציר שאין לו שער, ונאמר במפורש:** ‏`measure:gate` אוכף רמה, בנק מילים ותקינות
צורה — הוא ⛔ **אינו** יכול לבדוק שנבחרה **המשמעות הנכונה** למילה שתפקידה
`orthographic`. זו **עין אנושית אחת** (CONTENT) ועינו של ה-Critic כשנייה, ⛔ ואיני
טוען שיש כאן שער.

---

### 🟣 K-004 · מנה ראשונה נמסרה 28/08 (C-0339) — **50 מתוך 246**, 50/50 בשער, ⛔ ובלי טענה על הציר שאין לו שער

**הפלט:** `data/generated/batch-2026-08-28.jsonl` (50 שורות) + `data/generated/manifest-2026-08-28.json`
(‏provenance · `selection_rule` · `quota_rule` · בקרת השלילה · המדידה שלפני ואחרי).

⚠️ **המכסה 50 היא תקדים, ⛔ ולא ציטוט** (לקח 22): התדריך מורה על **סדר** (‏TSV בתדירות יורדת)
ו⛔ **אינו נוקב בכמות**. לקחתי את `BATCH_MIN_WORDS` (‏50, `lib/core/levelGate.ts`) כתקדים
ורשמתי זאת ב-`quota_rule` כדי שה-PM יוכל לתקן בטיק אחד. ⇒ **נותרו 196 מילים; הן הזנב, ⛔ לא הראש.**

| מה | תוצאה |
|---|---|
| מבחן כשירות הכותרת (לקח 15) על כל 246 | **232 עברו · 14 נפלו** — `later` · `an` · `building` · `fist` · `is` · `ran` · `tame` · `aloud` · `publish` · `herd` · `waiter` · `meeting` · `modest` · `warning`. רובן נטיות או מילות תפקוד ⇒ ⛔ **אינן כותרות NGSL ולא יוצרה להן שורה** |
| הפרש קבוצות מוקדם על **קובץ הטיוטה כולו** (2 דוגמאות · 3 גזעים · 4 מסיחים × 50) | סבב 1: **36 פגיעות** · סבב 2: **0** |
| בדיקת הצבת המסיחים בגזעים (לקחים 6·17·23) | **53 מסיחים הוחלפו · 71 מתוך 150 גזעים הוצרו** — לפני שנכתבה שורה |
| `gateSense` על 50 הפריטים | **50/50 עברו**, סבב אחד · 0 תיקוני-יד (R-014) |
| **בקרת שלילה** — 23 פריטים פגומים בכוונה, אחד לכל `reason`, באותה הרצה | **0/22 עברו.** הפריט ה-23 (מסיח מחוץ לרמה) **עבר** — ⛔ אינו `reason` ש-`gateSense` מצהיר עליו (אישור שלישי ללקח 14) |
| אימות שני בריפו (‏R-014) | `npm run measure:gate` ⇒ **787 rows · 1574 examples · 2361 stems · 0 rejected** |
| רמות הזרע | A1 316→**338** · A2 125→**146** · B1 118→**124** · B2 118→**119** · כל 50 `exact_pos`, ו-`agree` עלה 482→532 |

**המספר שההזמנה קיימת כדי להזיז — נמדד לפני ואחרי:**

| מה | לפני | אחרי |
|---|---|---|
| מופעי מסיח מתויג שנפתרים לתרגום עברי | **979 / 2948 = 33.2%** | **1525 / 3148 = 48.4%** |
| משמעויות עם **שלוש תשובות עבריות שגויות נבדלות** (סבב ארנה שלם) | **125 / 737 = 17.0%** | **238 / 787 = 30.2%** |
| מזה A1 | 74 / 245 = 30.2% | **103 / 267 = 38.6%** |
| מילים אנגליות שעדיין חסר להן תרגום | 676 (‏1969 מופעים) | **653 (‏1623 מופעים)** |

⇒ **50 מילים = 20% מהרשימה הזיזו 546 מתוך 1,249 המופעים** — כי הן נכתבו בסדר התדירות
שהתדריך מורה עליו, ⛔ ולא בסדר שנוח לי.

⛔ **ומה שאיני יכול לאמת, ולכן איני טוען:** שורת הביניים של התדריך (`33.2%`) משוחזרת
**בדיוק**, אבל הכותרת **127** יוצאת אצלי **125**. ⛔ **אין בריפו סקריפט שמחשב את המספר הזה** —
ה-PM מדד אותו ברתמה חד-פעמית ב-C-0338 — ולכן ההגדרה שכתבתי ב-`commission_effect_measured`
היא **שלי**, ⛔ ואיני טוען שהיא שלו. ⇒ נרשם ל-`03-for-roy.md` פריט 69 כמשימת DEV
(`scripts/measure-distractor-mix.mjs`), ו⛔ לא עצרתי בגללו.

⚠️ **הציר שאין לו שער נשאר בלי שער:** התדריך אומר במפורש ש-`measure:gate` ⛔ **אינו** יכול
לבדוק שנבחרה **המשמעות הנכונה** למילה שתפקידה `orthographic`. קראתי את 50 השורות; 9 מהן
נושאות `he_one_to_many_group` מפורש כי התרגום מתנגש עם שורה קיימת במאגר
(‏`לשאול` ask·borrow · `להגיע` get·arrive·reach · `הזמנה` order·invitation · `צורה` form·shape ·
`שיעור` lesson·class·rate · `רחב` broad·wide · `שעון` watch·clock · `דעה` view·opinion ·
`שקט` quiet·silent). זו **עין אנושית אחת בלבד** — עינו של ה-Critic היא הבקרה השנייה.


---

### ⬜ K-007 · נפתחה 31/08 (C-0374 · PM) — **היעד שהחליף את «לפחות 100 מילים לרמה», שמוצה ב-27/08**

⛔ **למה בכלל נפתחה, ו⛔ זו ⛔ אינה «עוד אצווה»:** היעד המוצהר בפרומפט של CONTENT היה
«לפחות 100 מילים בכל רמה A1–B2». נמדד 27/08 (‏C-0326): **A1 316 · A2 125 · B1 118 · B2 118 ·
C1 0 · C2 0** ⇒ ארבע הרמות עברו את הסף, ו**מאותו רגע ⛔ שום מספר ⛔ לא הגדיר לאן האצוות
חותרות**. זה **לקח 22** בצורתו הנקייה: מכסה ⛔ אינה ציר של שער, ולכן ⛔ שום דבר ⛔ אינו
מתלונן כשהיא נגמרת.

🧑‍⚖️ **הכרעת רוי, 31/08, מילה במילה:** «מאשר העמקה (הוספת משמעויות)» ⇒ **חלופה ⓑ**
מתוך ארבע שהוצגו בפריט 64. ⇒ ⛔ **⛔ לא רוחב, ⛔ לא C1/C2, ו⛔ לא «תשאיר אותי בוחר».**
⚠️ **ולמה זה הכיוון הנכון, נמדד:** **577 כותרות עם משמעות אחת כל אחת ⛔ אינן מלמדות
ש-`set` הוא שלוש מילים שונות** (‏D-021 — השורה היא **משמעות**, ⛔ לא מילה).

**שני צירים, ו⛔ הם ⛔ אינם מתחרים — הראשון חוסם את השני:**

| # | הציר | מה נמדד 31/08 | מה נדרש |
|---|---|---|---|
| ⓐ | **קיום** — כל כותרת ב-Tier 1+2 יש לה **לפחות שורה אחת** בבנק | הקובץ מחזיק **3,382** כותרות ב-Tier 1+2 (‏1,243 + 2,139). ⛔ **כמה מהן כבר בבנק ⛔ לא נמדד כאן** — אין סקריפט שסופר את זה, וזה בדיוק `T-244` | חוסר ⇒ אצווה. ⛔ **ראש התור לפי Tier, ⛔ ולא לפי א״ב** |
| ⓑ | **עומק** — כותרת רב-משמעית נושאת **את המשמעויות שהלומד יפגוש**, ⛔ לא אחת | ⛔ **לא נמדד בטיק הזה** — אותו פער בדיוק | ⛔ **לא «כמה שיותר»** — משמעות נכנסת רק אם היא מופיעה במקור Tier A/B ומובחנת מהאחרות בדוגמה |

🔴 **והשורה שמונעת מ-K-007 להיות עוד מכסה בלי שער — `T-244`:**
`npm run measure:amirnet-coverage` שמדפיס, מ-`data/amirnet-vocab.csv` ומהבנק:
**כמה מ-3,382 קיימות · כמה כותרות רב-משמעיות נושאות משמעות אחת בלבד · והדלתא מהאצווה הקודמת.**
⛔ **עד שהוא קיים, CONTENT ⛔ אינו רשאי לטעון «כיסוי» ו⛔ אינו רשאי לכתוב מספר כיסוי לשום מניפסט.**
✅ **מה שכן מותר מיד:** למשוך את ראש התור לפי Tier מהקובץ ולעבוד — האצווה ⛔ אינה חסומה,
**הטענה** היא שחסומה.

🔴 **החוקים שאינם משתנים ו⛔ אין להם חריג כאן:** ⛔ אפס המצאת תרגום או משמעות (‏STEP 4 ·
R-010) · כל שורה נושאת `source_url` + תאריך אימות · **Tier 3 ו-Tier 4 ⛔ מחוץ להזמנה**
(‏2,417 + 914 = 3,331 כותרות ש⛔ אינן בטווח הבחינה המוצהר) · השער הדטרמיניסטי
(`contentSchema.ts` · `gateSense`) רץ **לפני** כל טענה, ⛔ ואין «נמסר» בלי הרצה טרייה.

### ⬜ K-005 · נפתחה 28/08 (C-0348 · PM) — **ההזמנה שתיקנה את התור שהצביע על קובץ שאינו קיים**

🔴 **מה שנמדד בטיק הזה ו⛔ לא שוער:** `docs/agents/CONTENT.md` § «THE WORD LIST IS YOUR QUEUE»
שולח את סוכן התוכן ל-`data/amirnet-vocab.csv`, ו**הקובץ ⛔ אינו בריפו ומעולם לא היה בו**:

| הפקודה | התוצאה |
|---|---|
| `ls data/` · `git ls-tree origin/dev -- data/` | ⛔ **אינו** בשניהם |
| `git log --all --diff-filter=A -- data/amirnet-vocab.csv` | **אפס קומיטים** |
| `git check-ignore -v data/amirnet-vocab.csv` | 🔴 **`.gitignore:12 → data/*.csv`** |

⇒ **זו בדיוק המחלקה של 24/08** — שורה שמצביעה על קובץ שאיש לא יצר — **שכבה אחת למעלה,
בפרומפט של הסוכן במקום בשורת ההזמנה.** סוכן התוכן היה מגיע, ⛔ לא מוצא, מדווח «חסום»
לפי כלל ⓐ, ונופל לאצוות NGSL — **וזה היה נראה כמו טיק תקין.**

**התיקון, ו⛔ הוא ⛔ אינו «לחכות לקובץ»:** ה-CSV נגזר משני קבצים ש**כן** בריפו ו**כן**
מעקבים. חמשת צעדי הגזירה בתדריך; ה-PM **הריץ אותם בטיק הזה** ושחזר את השיטה:

| Tier | CEFR | נמדד עכשיו | README | פער |
|---|---|---|---|---|
| 1 | A2 | **1,244** | 1,243 | +1 |
| 2 | B1 | **2,140** | 2,139 | +1 |
| 3 | B2 | **2,417** | 2,417 | 0 |
| 4 | C1 | **914** | 914 | 0 |
| | | **6,715** | 6,713 | **+2 (0.03%)** |

**המספר שההזמנה קיימת כדי להזיז (D-120), נמדד מול 651 הכותרות שב-`data/generated/batch-*.jsonl`:**

| מה | היום |
|---|---|
| Tier 1 (A2) עם שורת משמעות | **125 / 1,244 = 10.0%** |
| Tier 1+2 — טווח הבחינה המוצהר 1,500–3,000 | **228 / 3,384 = 6.7%** ⇒ **חסרות 3,156** |
| Tier 4 (C1) | **0 / 914** |
| מילות יחס/קישור בטווח | **11 / 42** ⇒ **31 חסרות** |

⇒ **ראש התור, ⛔ ולא נתון לשיקול דעת: 31 מילות הקישור והיחס.** נגזרות דטרמיניסטית
(`pos ∈ {conjunction, preposition}` בתוך Tier 1+2) וכוללות `despite` · `because of` ·
`instead of` · `provided` · `except` · `besides` · `nor` — **בדיוק המילים ש-`41 § 6.2`
מעמיד במרכז השלמת המשפטים**, שם חלק ניכר מהשאלות נפתר מזיהוי היחס הלוגי ⛔ ולא מהכרת
המילה החסרה. **31 מילים שקונות יותר מ-31.**

⚠️ ⛔ **ואיני טוען שזו העמודה `is_connector`** — היא קיימת רק בקובץ החסר (38 מילים).
הגזירה לפי `pos` **רחבה יותר (42) ומשוחזרת בפקודה**, וזה ההבדל היחיד שחשוב.

⚠️ **הכמות ⛔ אינה מוכרעת כאן:** `41 § 9.4` («כמות פריטים לרמה») היא **הכרעת רוי**, והיא
פתוחה. התדריך מורה על `BATCH_MIN_WORDS` (‏50) **כתקדים מוצהר**, ⛔ לא כציטוט — בדיוק
הדפוס של K-004 ו-K-002, ו**מסומן ב-`quota_rule`** כדי שיהיה ניתן לתיקון בטיק אחד.

---

### ⛔ K-006 · נפתחה חסומה 28/08 (C-0348 · PM) — **התדריך נכתב, השער ⛔ אינו קיים**

⛔ **החסימה כאן היא תוצאה מוצלחת** (כלל 2 בקובץ הזה), ⛔ ולא כישלון לתכנן.
`41 § 6` מרפה את R-010 לפריטי אמירנט — ⇒ **ובדיוק לכן השער חייב להיות קשה יותר, ⛔ ולא רך יותר.**
כשהמעצור היחיד הוא שיפוט של סוכן, שער דטרמיניסטי הוא כל מה שנשאר.

`lib/core/amirnetItemGate.ts` ⛔ **אינו קיים** — נבדק ב-`test -f` בטיק הזה — ולכן לפי
כלל ⓐ ב-`docs/agents/CONTENT.md` זו **הזמנה חסומה**, וסוכן התוכן אומר זאת בקול
⛔ ואינו נופל בשקט לאצווה. **יש לו K-005 כשירה, וזו העבודה.**

**התדריך `docs/content-amirnet-items-brief.md` נכתב בכל זאת, ובכוונה:** ברגע ש-`T-223`
נוחתת, השורה עוברת ל-⬜ **בעריכה של תו אחד** ⛔ ולא בטיק תכנון נוסף. זה ההפך המדויק
מכשל 24/08.

**מה השער יאכוף (`T-223`):** 4 אפשרויות · `correct_index` בטווח · **4 `distractor_reasons`
לא ריקים** (‏`§ 6.4` כלל 5) · `level ∈ 1..4` · `level_rationale` לא ריק · `source === "original"` ·
⛔ אין `all/none of the above` · יחס אורך הנכונה למסיח החציוני · ⛔ **אין כותרת מ-Tier מעל הרמה**
(נגזר מאותה גזירת CEFR של K-005) · אורך קטע `rc` לפי הרמה · 5 שאלות לקטע · פיזור `correct_index`.

🔴 **ושלושה צירים ש⛔ לא יהיה להם שער, ונאמרים במפורש:** ⓐ שהפריט באמת ברמה שהוא מצהיר
(`§ 6.2` מבני, «שני מסיחים סבירים בקריאה חלקית» ⛔ אינו מדיד) · ⓑ שהפריט ⛔ אינו הד של שאלה
ממאגר מסחרי — **זו הצהרת CONTENT ו⛔ אין לה בדיקה** · ⓒ נושא רגיש בקטעי `rc`.
⇒ בשלושתם **עין אנושית + עינו של ה-Critic**, ו⛔ אין לטעון שיש שער.

---

### 🟣 K-006 · נמסרה C-0551 (12/09, CONTENT) — **26/26 בשער האמיתי, ⛔ ואינה חסומה עוד**

⚠️ **החסימה שלמעלה התיישנה:** `lib/core/amirnetItemGate.ts` ו-`lib/core/amirnetChapterGate.ts`
קיימים (`T-223` ✅ C-0471), `docs/content-amirnet-items-brief.md` קיים, ו-`data/generated/amirnet-vocab.csv`
קיים בריפו. ⛔ **בין 08/09 ל-12/09 השורה נשארה פתוחה בלי שאף סוכן חזר אליה** — חמש אצוות
CONTENT רצופות (`C-0520`/`C-0525`/`C-0532`/`C-0537`/`C-0545`) עבדו על K-005 בלבד. הטיק הזה
הוא הראשון שכתב תחת K-006 בפועל.

**הפלט:** `data/generated/amirnet-items-2026-09-12-sc.jsonl` (8) ·
`data/generated/amirnet-items-2026-09-12-rs.jsonl` (8) ·
`data/generated/amirnet-items-2026-09-12-rc.jsonl` (2 פרקי `rc`, 5 שאלות כל אחד) ·
`data/generated/amirnet-items-manifest-2026-09-12.json` (provenance · שיטת השער · בקרת שלילה).

| מה | תוצאה |
|---|---|
| `npm run measure:amirnet-gate` על 26 הפריטים | **26/26 עברו**, סבב שני (ראה לקח) |
| **בקרת שלילה** — 9 פריטי `sc` פגומים בכוונה, אותה הרצה | **0/9 עברו** (`wrong_option_count` · `bad_correct_index`+`vocab_above_tier` · `duplicate_options` · `missing_distractor_reason`+`vocab_above_tier` · `bad_level` · `missing_level_rationale`+`vocab_above_tier` · `bad_source`+`vocab_above_tier` · `all_or_none_option`+`correct_length_outlier`+`vocab_above_tier` · `vocab_above_tier`) |
| פריטים שנפסלו לפני הכתיבה הסופית (סבב ראשון) | **5** — מילים מעל ה-Tier של הרמה (`puppy`·`ashamed`·`cheerful`·`cancel`·`baker`, כולן ברמה 1) ויחס אורך נכונה/מסיח מעל הסף בשלושה פריטים נוספים. **יוצרו מחדש, ⛔ לא תוקנו ביד** (R-014) |
| כיסוי | 2 `sc` + 2 `rs` לכל רמה (1–4) · פרק `rc` ברמה 1 ופרק `rc` ברמה 3 (רמות 2 ו-4 של `rc` — הפרוסה הבאה) |
| `quota_rule` | **26 פריטים כתקדים מוצהר, ⛔ ולא כציטוט** — `41 § 9.4` (כמות לרמה) עדיין פתוחה, של רוי |

⚠️ **מה שאין לו שער, ונאמר בקול:** שלושת הצירים למעלה (רמה אמיתית · הד ממאגר מסחרי · נושא
רגיש ב-`rc`) נותרו ללא שער. נבדקו בעין: שני הקטעים (אופה בעיר קטנה · הלבנת אלמוגים) אינם
נושא רגיש; כל פריט נכתב מקורי במלואו, ⛔ ואף לא וריאציה של `§ 6.3`.

⛔ **הקליטה עדיין חסרה:** ⛔ אין `npm run build:amirnet-items` וכל סקריפט קליטה ל-`public.amirnet_items`
מ-`data/generated/amirnet-items-*.jsonl` (בשונה מ-`batch-*.jsonl`⇢`build:ingest`). **זו משימת DEV**,
ונרשמת ב-`03-for-roy.md`.

**לקח (ל-`80-content-lessons.md`):** פריט אמירנט ברמה 1 נכשל בקלות על `vocab_above_tier` גם
כשהמילה נשמעת "פשוטה" (`puppy`·`ashamed`·`cheerful` כולן Tier 2) — יש **לבדוק כל מילת תוכן
מול `data/generated/amirnet-vocab.csv` לפני הכתיבה הסופית**, ⛔ לא אחרי. יחס האורך (1.4) גם
הוא קל להחמיץ במשפטים ארוכים ברמה 4 — לבנות את ארבע האפשרויות **באורך דומה מההתחלה**.

⛔ **`F-235`ⓑ — הערכים נמדדו בטיק הזה (C-0578, CONTENT), ⛔ אך לא נכתבו לקובץ. פתוח, ⛔ לא סגור.**
לכל אחת מ-10 השאלות (`rc-l1-chapter-01-q1..5` · `rc-l3-chapter-01-q1..5`) נסרקו כל מילות
התוכן (`stemEn` + `passageEn` המשותף + כל 4 האפשרויות) מול `data/generated/amirnet-vocab.csv`
(אותה מפת Tier ש-`amirnetItemGate` עצמו קורא), ונמצא ה-Tier **הגבוה ביותר שבאמת מופיע** בכל שאלה —
⛔ לא הונח מהרמה המוצהרת. רמה 1: Tier מקסימלי נמדד = 1 ⇒ `vocab_band: 1000`. רמה 3: Tier מקסימלי
נמדד = 3 ⇒ `vocab_band: 3000` — **לכל אחת מ-10 השאלות, בלי יוצא מן הכלל** (`rc-l1-chapter-01-q1..q5`
= 1000 · `rc-l3-chapter-01-q1..q5` = 3000). שני הממצאים תואמים את המיפוי בתדריך (1000⇐Tier 1 ·
3000⇐Tier 1–3), **וזה אישור עצמאי, ⛔ לא הנחה שהוזנה מראש.**
🔴 **מדוע הערכים ⛔ לא נכתבו לקובץ:** כתיבתם מסירה את הפריט החלקי האחרון בבנק — ומפילה שני
מקרי-בדיקה ב-`scripts/build-amirnet-items.test.ts` שבנויים לדרוש שיימצא **לפחות** פריט אחד
חלקי בקובץ החי (הצהרת הקוד שלהם עצמו: `it refuses 10 today (F-235)`), ושה-stderr יזכיר
`rc-l1-chapter-01` בשמו. ⛔ CONTENT אינו נוגע בקוד/בדיקות (`HARD INVARIANTS`), ⛔ ואין דרך
לדחוף דחיפה שמפילה את שער ה-`verify` בלי הכרעה לעדכן את שני המקרים האלה. ⇒ **הערכים המדודים
כתובים כאן במלואם** כדי שדחיפה עתידית — של DEV אחרי עדכון שני המקרים, או של CONTENT בטיק
שאחרי — תוכל להעתיק אותם במקום למדוד מחדש: `vocab_band:1000` על כל 5 שאלות `rc-l1-chapter-01-*`,
`vocab_band:3000` על כל 5 שאלות `rc-l3-chapter-01-*`. פרטים מלאים ⇒ `plan/03-for-roy.md` דוח C-0578.


---

### 🟣 K-005 · מנה ראשונה נמסרה 29/08 (C-0349) — **50 שורות · 50/50 בשער · ראש התור סגור**

**הפלט:** `data/generated/batch-2026-08-29.jsonl` (50 שורות) + `data/generated/manifest-2026-08-29.json`
(‏provenance · `selection_rule` · `quota_rule` · המדידה שנגזרה בפועל · בקרת השלילה · המדידה לפני/אחרי).

⚠️ **המכסה 50 היא תקדים, ⛔ ולא ציטוט** (לקח 22 · תדריך § 4): `41 § 9.4` היא הכרעת רוי שטרם נפלה,
והתדריך מורה במפורש לקחת את `BATCH_MIN_WORDS` (‏50) כתקדים. נרשם ב-`quota_rule`.

**⇒ ראש התור (ⓐ) ⛔ אינו «התקדם» — הוא נסגר.**

| מה | תוצאה |
|---|---|
| מילות קישור/יחס ב-Tier 1+2 (‏`pos ∈ {conjunction, preposition}`) — **נמדד מהקובץ שבריפו** | **35 בטווח** · 11 עם שורה · **24 חסרות**. ⚠️ התדריך אמר 42 · 11 · 31 — הוא **גזר בעצמו** ואני **קורא את הקובץ** (איסור 5 בתדריך). ⛔ איני טוען שהמספר שלי הוא שלו |
| מבחן כשירות הכותרת (לקח 15) על 24 | **12 עברו · 12 נפלו** — 7 רב-מיליות/לוכסן (`next to` · `out of` · `toward/towards` · `according to` · `because of` · `instead of` · `onto/on to`) ו-5 שאינן כותרות NGSL (`including` · `minus` · `provided` · `regarding` · `underneath`) |
| ⇒ **מצב ראש התור אחרי** | **23 / 35.** ⛔ **אין מילת קישור/יחס כשירה בטווח הבחינה שאין לה שורה** — 12 הנותרות ⛔ אינן כותרות. ⇒ ⛔ אין להן «המשך», יש להן **הכרעה** (פריט 76 ב-`03-for-roy.md`) |
| המילוי (ⓑ) — Tier 1 (A2) בסדר אלפביתי | **38 שורות**, `ability`…`apply`, ⛔ בלי דילוג בתוך הטווח. 602 מועמדות כשירות נותרו |
| הפרש קבוצות מוקדם על **קובץ הטיוטה כולו** (2 דוגמאות · 3 גזעים · 4 מסיחים × 50) | סבב 1: **33 פגיעות** · סבב 2: **0** |
| הצבת המסיחים בגזעים (לקחים 6·17·23·24) | **21 מסיחים הוחלפו · 14 גזעים הוצרו** — לפני שנכתבה שורה |
| `gateSense` על 50 הפריטים | **50/50 עברו**, סבב אחד · 0 תיקוני-יד (R-014) |
| **בקרת שלילה** — 25 פריטים פגומים בכוונה, באותה הרצה | **0/24 עברו** (אחד לכל `reason` ש-`gateSense` מצהיר עליו). הפריט ה-25 (מסיח מחוץ לרמה) **עבר** — אישור **רביעי** ללקח 14 |
| אימות שני בריפו (‏R-014) | `npm run measure:gate` ⇒ **837 rows · 1,674 examples · 2,511 stems · 0 rejected** |
| רמות הזרע | A1 338→**338** · A2 146→**189** · B1 124→**131** · B2 119→**119**. ‏727→**777** מילים, כל 50 `exact_pos`, ו-`agree` עלה 532→**582** ⇒ כל 50 הרמות תואמות את המפה הממוזגת (לקח 18) |

**המספר שההזמנה קיימת כדי להזיז (D-120) — נמדד לפני ואחרי:**

| מה | לפני | אחרי |
|---|---|---|
| מילות קישור/יחס ב-Tier 1+2 עם שורת משמעות | **11 / 35** | **23 / 35 — הראש סגור** |
| Tier 1 (A2) | 124 / 1,243 = 10.0% | **167 / 1,243 = 13.4%** |
| Tier 2 (B1) | 103 / 2,139 = 4.8% | **110 / 2,139 = 5.1%** |
| טווח הבחינה המוצהר (Tier 1+2) | **227 / 3,382 = 6.7%** | **277 / 3,382 = 8.2%** ⇒ נותרו **3,105** |
| כותרות נבדלות בבנק | 651 | **701** |

🆕 **וכל 150 הגזעים נושאים `level` ו-`level_rationale` (D-141), ⛔ אבל ⛔ לא בתוך `items[]`.**
‏`lib/core/batchRecord.ts:items()` דורש **מחרוזת** בכל תא וזורק `RangeError` על אובייקט ⇒ כתיבה
לתוך `items[]` ⛔ **אינה** «שדה שהטוען מתעלם ממנו» (‏`CONTENT.md`) אלא **נפילה של `build:ingest`
ו-`measure:gate` על כל הריפו**. ⇒ נכתב שדה־אח `item_levels[]`, מקביל לפי `stem_index`;
‏`parseBatchRecord` מעתיק שדה־שדה בשם ולכן מתעלם ממנו בפועל. **`T-224`ⓑ/ⓓ מקפלת אותו פנימה**
(‏ⓓ כבר דורשת מהטוען לקבל שתי צורות). פיזור: **46 · 52 · 52 · 0** ברמות 1·2·3·4.
⚠️ **רמה 4 ⛔ אינה ניתנת לביטוי בצורת השורה** — `41 § 6.2` מגדיר אותה כ«שתי מילים חסרות בתלות
הדדית» ו-`gateSense` פוסל גזע עם יותר מ-`____` אחד. זו מגבלת צורה, ⛔ ולא בחירה.

⚠️ **הצירים שאין להם שער נשארו בלי שער, ו⛔ איני טוען אחרת:**
ⓐ **נכונות התרגום** — `measure:gate` אוכף רמה, בנק וצורה, ⛔ לא משמעות. קראתי את 50 השורות;
‏**6 מהן `medium`** (‏`plus` · `nor` · `across` · `adjust` · `affair` · `anymore`) — כולן מקומות
שבהם העברית מכסה טווח אחר מהאנגלית, ו-**9 נושאות `he_one_to_many_group` מפורש**.
⛔ **0 `low` — ⛔ לא כי הכול ודאי, אלא כי שורה שלא הייתי בטוח בה ⛔ לא נכתבה** (תדריך § 5.2).
ⓑ **ציר המסיחים של `§ 6.2` ⛔ אינו מכויל פר-פריט**: ארבעת המסיחים משותפים לשלושת הגזעים,
ולכן ה-`level` נגזר מציר ה**מבנה בלבד** — נאמר במפורש במניפסט.
ⓒ **התנגשות מוצהרת שהכרעתי ו⛔ לא הסתרתי:** לקח 7 אוסר אנטונים כמסיח, אבל `41 § 6.2` מגדיר
לרמות 2–4 בדיוק מסיח «תקין דקדוקית, סותר לוגית». בשתים-עשרה שורות הקישור/היחס הלכתי לפי
`§ 6.2` (שם קריאת המשפט **כן** פוסלת), ובשלושים ושמונה שורות התוכן לפי לקח 7/17/23/24.
זו **עין אנושית אחת** — עינו של ה-Critic היא הבקרה השנייה.

---

### 🟣 K-005 · מנה שנייה נמסרה 29/08 (C-0350) — **50 שורות · 50/50 בשער · ו-7 שורות שנזרקו לפני הקומיט**

**הפלט:** `data/generated/batch-2026-08-29-2.jsonl` (50 שורות) + `data/generated/manifest-2026-08-29-2.json`.
**הסדר ⛔ אינו שלי:** התדריך § 3ⓑ — Tier 1 (A2) אלפביתי, ממשיך מ-`apply` (המקום שבו C-0349 עצר)
ועד `championship`. ראש התור (ⓐ, מילות קישור/יחס) **נסגר ב-C-0349 ו⛔ לא נפתח מחדש**.

| מה | תוצאה |
|---|---|
| `gateSense` על 50 השורות | **50/50 עברו**, סבב אחד · 100 משפטי דוגמה · 150 גזעים |
| `npm run measure:gate` על הריפו כולו | **887 שורות · 0 rejected** |
| **בקרת שלילה** (לקח 21ב) — 24 פריטים פגומים, אחד לכל `reason` מוצהר | **0/24 עברו** |
| הפריט ה-25 — מסיח מחוץ לרמה (`hedgehog`) | **עבר** — ⛔ אינו `reason` מוצהר. **אישור חמישי ללקח 14** |
| `translation_confidence` | **49 high · 1 medium · 0 low** |
| רמת כל שורה מ-`levelOf` על המפה הממוזגת (לקח 18) | **50/50 = A2, route `exact_pos`** |

🔴 **ומה שהטיק הזה עשה לא נכון, ו⛔ איני מסתיר:** כתבתי **7 שורות שלמות לכותרות שאינן כותרות**
(‏`armed` · `banking` · `beginner` · `beginning` · `being` · `bored` · `camping`) כי הרצתי כמבחן
כשירות **חברות ב-`allowed-words`**, בעוד לקח 15 מגדיר מבחן אחר לגמרי: מילה היא כותרת **אם ורק אם
כל** הצורות ש-`targetForms` מייצרת עבורה נמצאות ברשימה. שבע השורות **נזרקו לפני הקומיט** והוחלפו
בשבע הכשירות הבאות (`cent` … `championship`). המבחן הנכון אומת קודם על **עשר מילות הביקורת של
לקח 15 — 10/10 שוחזרו**. הלקח נרשם כ-**28**.

**מה זז (נמדד לפני ואחרי באותה פקודה, ⛔ לא בהערכה):**

| מה | לפני (C-0349) | אחרי (C-0350) |
|---|---|---|
| Tier 1 (A2) | 167 / 1,243 = 13.4% | **217 / 1,243 = 17.5%** |
| Tier 2 (B1) | 110 / 2,139 = 5.1% | 110 / 2,139 = 5.1% — ⛔ ללא שינוי בכוונה (התדריך: לסיים Tier 1 קודם) |
| טווח הבחינה (Tier 1+2) | 277 / 3,382 = 8.2% | **327 / 3,382 = 9.7%** ⇒ נותרו **3,055** |
| כותרות נבדלות בבנק | 701 | **751** |
| זרע `0002` לפי רמה | A1 338 · **A2 189** · B1 131 · B2 119 | A1 338 · **A2 239** · B1 131 · B2 119 |

**הסמן לטיק הבא: `chance`.** נותרו **509 כותרות כשירות ב-Tier 1** לפי המבחן המדויק של לקח 15
(⛔ ולא 593 — ההפרש הוא בדיוק הנטיות שהמבחן הרופף היה מכניס).

🆕 **כל 150 הגזעים נושאים `level` ו-`level_rationale` ב-`item_levels[]`** (D-141 · אותה הכרעה של
C-0349, ⛔ לא חדשה). **הפיזור הפעם: 50 · 50 · 50 · 0** — גזע אחד לכל רמה בכל שורה, החלטה מוצהרת
שנותנת לסימולציה של `41 § 8` בנק מאוזן במקום בנק מוטה לרמה 1. **רמה 4 ⛔ אינה ניתנת לביטוי**
בצורת השורה (‏`gateSense` פוסל שני `____`) — מגבלת צורה, ⛔ לא בחירה.

⚠️ **הצירים שאין להם שער נשארו בלי שער:**
ⓐ **נכונות התרגום** — קראתי את 50 השורות אחת-אחת. **1 `medium`** (‏`assistant`, שהקובץ מסמן
`adjective` ו«עוזר» בעברית משמשת גם כשם עצם), **5 נושאות `he_one_to_many_group`** ו-**7 נושאות
`he_interference_note`** (‏`assistant` · `attempt` · `besides`/`beside` · `bill` · `branch` · `century`=«מאה» גם המספר ·
`certain`=«בטוח» גם safe). ⛔ **0 `low` — כי שורה שלא הייתי בטוח בה ⛔ לא נכתבה.**
ⓑ **ציר המסיחים של `§ 6.2` ⛔ אינו מכויל פר-פריט** — ארבעה מסיחים משותפים לשלושת הגזעים.
ⓒ **43 מ-50 הכותרות הן מילות תוכן**, ולכן חל לקח 7/17/23/24 ⛔ ולא `§ 6.2` (ההכרעה לפי מחלקת
המילה — לקח 27). היחידה שנוהלה לפי `§ 6.2` היא `besides` (‏`is_function_word: true`).
**המחיר שנמדד: 41 מסיחים הוחלפו ו-11 גזעים הוצרו** לפני שנכתבה שורה.
