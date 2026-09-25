#!/usr/bin/env node
/**
 * T-001 success-metric harness (project_plan.md 4.2).
 *
 * Lighthouse 13 removed the PWA category and the tap-targets audit, so the
 * mobile guarantees this project actually promises (MF-1..MF-5, PW-1..PW-3)
 * are measured here directly, against the production build.
 *
 * Usage: node scripts/verify-mobile.mjs [baseUrl]
 *
 * With no baseUrl it boots `next start` against the existing production build
 * and shuts it down afterwards, so it can run unattended inside `npm run
 * verify` (F-007: while it sat outside `verify`, every 375px/44px/RTL claim in
 * this repo was an unmeasured assertion).
 */
import { existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

// T-183 · `36 § 3`. The four conditions live in their own pure module so they can
// be unit tested against production-shaped geometry; this file only measures.
import { auditStoryBody } from './story-tap-audit.mjs';

// T-227 · plan/docs/superpowers/plans/2026-08-30-journey-walk.md. Pure, so it is
// unit-testable without a browser (check:core owns it) — see lib/core/journeyDrift.ts.
const { driftingNames } = await import('../lib/core/journeyDrift.ts');

// 🧹 T-326 — WHICH screens draw the licence footer. Imported, ⛔ not re-listed: a copy
// here would let the walk agree with itself while the product does something else.
const { showsLicenceFooter } = await import('../lib/core/licenceFooter.ts');

// T-227 — `--journeys-only` runs ONLY the three journey walks below (`npm run
// walk:journey`) and skips every per-route/per-width check in this file. A flag,
// not a positional arg, so it must be filtered out before BASE_ARG is read —
// otherwise `--journeys-only` itself would be parsed as the base URL.
const ARGV = process.argv.slice(2);
const JOURNEYS_ONLY = ARGV.includes('--journeys-only');
const BASE_ARG = ARGV.find((a) => !a.startsWith('--'));
const PORT = Number(process.env.PORT) || 3000;
const BASE = BASE_ARG || `http://localhost:${PORT}`;
// 📱 `T-417` · סוגר את `F-279` · יעד ② של `arena`, בלשונו של רוי: «המכשיר האמיתי נבדק».
// 🔬 נמדד `C-0682`, ⛔ ולא שוער: עד היום המערך הזה החזיק **רוחבים בלבד** — `320 · 375 · 414` —
// והלולאה הריצה את כולם על גובה קבוע של `780`. ⇒ אייפון 12/13/14 (**390×844**),
// אייפון 14 Pro/15/16 (**393×852**) ואייפון 14 Pro Max/15 Pro Max/16 Plus (**430×932**) —
// שלושת הגדלים הנפוצים ביותר בידיים של לומדים — ⛔ **מעולם ⛔ לא נמדדו**, ו-`414×896` שהשער
// התהדר בו הוא אייפון 11/XR, מכשיר בן שש שנים. ⇒ אלפיים טענות ירוקות אמרו «עבר ב-320/375/414»,
// ⛔ ולא «עבר במכשיר של הלומד».
//
// ⛔ **שלוש הרשומות הראשונות ⛔ לא זזו, וזה מכוון:** הן שומרות על גובה ה-`780` שתמיד רצו בו,
// ⇒ ⛔ אף טענה קיימת ⛔ אינה משנה את משמעותה — מה שמתרחב הוא הכיסוי בלבד. ⛔ ואין כאן שינוי
// של מספר שהוא שער (`RULES § 0.1 ז׳`): ⛔ לא 44px, ⛔ לא רצפת ה-12px, ⛔ לא תקציב הזוהר.
// שלוש הרשומות החדשות נושאות את הגובה ה**אמיתי** של המכשיר, מפני ש«גולש אנכית» ⛔ אינה שאלה
// שאפשר לשאול על רוחב לבדו.
const ALL_WIDTHS = [
  { width: 320, height: 780, device: 'legacy 320 · הרוחב הצר ביותר שהמוצר מבטיח' },
  { width: 375, height: 780, device: 'legacy 375 · אייפון SE/8' },
  { width: 414, height: 780, device: 'legacy 414 · אייפון 11/XR' },
  { width: 390, height: 844, device: 'אייפון 12 · 13 · 14' },
  { width: 393, height: 852, device: 'אייפון 14 Pro · 15 · 16' },
  { width: 430, height: 932, device: 'אייפון 14 Pro Max · 15 Pro Max · 16 Plus' },
];
// ⏱️ ⟦23/09 · `T-429` · אישור רוי⟧ **שלושה רוחבים ב-pre-push, שישה בריצה המלאה של QA.**
// 🔬 שש הרשומות הכפילו את השער ⟨~143ש׳ ⇒ 281ש׳⟩ בכל דחיפה של כל סוכן, ו-`verify` כולו
// התקרב לתקרת 10 הדקות של פקודה בודדת. ⇒ ההוק מעביר `MOBILE_WIDTHS=pre-push`, ונשארים
// **הצר ביותר** ⟨320×780 — גם הגובה הנמוך ביותר⟩, **הנפוץ ביותר** ⟨390×844⟩ ו**הגדול ביותר** ⟨430×932⟩.
// ⛔ **ו⛔ זה ⛔ אינו דילוג:** ההוק חותם `verify(3w)`, ⛔ לא `verify` ⇒ `verify:attested` מחזיר «הרץ»,
// ו-QA מריצה את `npm run verify` המלא — שש רשומות — לפני כל מיזוג ל-`dev`.
const PRE_PUSH_WIDTHS = ['320×780', '390×844', '430×932'];
const WIDTHS =
  process.env.MOBILE_WIDTHS === 'pre-push'
    ? ALL_WIDTHS.filter((v) => PRE_PUSH_WIDTHS.includes(`${v.width}×${v.height}`))
    : ALL_WIDTHS;
const ROUTES = [
  '/',
  '/signup',
  '/login',
  '/onboarding',
  '/offline',
  '/sources',
  '/study',
  // T-041 layout fixtures. noindex, unlinked, and deliberately not learning
  // content — they exist so the card is measured at 320/375/414 like every
  // other screen instead of being declared correct. BOTH directions, because a
  // review found the recognition-only fixture never put the answer input or its
  // submit button in the DOM while the 44px scan was running.
  '/dev/card',
  '/dev/card/typed',
  '/dev/card/swap',
  // T-066 · D-156 · D-169 — the «משפטים» item on the SAME card, as `input: 'choice'`. Same
  // reason as the two above: `/study?deck=sentences` answers 503 without env, so without
  // this fixture the three options and the post-tap state would never be in the DOM while
  // the 44px scan ran.
  '/dev/card/choice',
  // T-065 task 8, and the same reason as the three above one level up: `/study` IS in this
  // list, but `next start` has no Supabase env, so the queue answers 503 by its own
  // contract and every `ok /study` line here has described the FAILURE state. The scrolling
  // deck — the card viewport, one card in the DOM, the two grade buttons — has never been
  // rendered at 320/375/414 until this fixture.
  '/dev/deck',
  // T-055 · § 4.2ו — «המילה האחרונה — מסך סיום ולא מסך לבן». `/dev/deck` holds two
  // ungraded cards, so the finish branch is unreachable there; this fixture renders it
  // directly. Measured and ⛔ not asserted: "not blank" is a claim about pixels.
  '/dev/deck/done',
  // T-276 · D-198 — the finish state WITH a round summary. `/dev/deck/done` has zero grades
  // and therefore (D-198 ⓓ) no summary; the two new sentences are state only grading makes,
  // so this fixture seeds a finished `due` round. Same reasoning as `/dev/deck` vs
  // `/dev/deck/done`: a branch unreachable from the route above it gets its own route.
  '/dev/deck/done/due',
  // T-054 · חוקה § 5 — «טעינה: שלד בצורת הכרטיס, ⛔ לא ספינר». `/study` renders
  // `schema_missing` here (no Supabase env), so the loading state has never been measured.
  '/dev/deck/skeleton',
  // `T-400` — the `סינון מילים` deck WITH the foot row «נשארו N מילים ברמה», the second
  // number `kol-A-03-card.png` draws. `/dev/deck` renders `deck="due"`, which has ⛔ no
  // level for anything to be "left in", so the row is unreachable from the route above it —
  // the same reason `/dev/deck/done` and `/dev/deck/skeleton` are routes of their own.
  // What this measures and nothing else does: that one more `flex-none` row inside
  // `h-[calc(100dvh-10rem)]` still leaves the two grade targets thumb-sized and above the
  // fold at 320/375/414, and that a 314-word Hebrew line does not scroll sideways at 320.
  // ⛔ It asks the server for nothing ⇒ ⛔ no EXPECTED_CONSOLE entry.
  '/dev/deck/level',
  // `T-415` · `F-282` — the two states `T-412` and `T-408` built and ⛔ no gate had seen:
  // the end of a level (its one action, «from the start»), and a deck opened from a study
  // module whose way out returns there. Both are decided by the server or the URL alone, so
  // neither is reachable from a route above them — the `/dev/deck/done` reasoning again.
  // ⛔ Neither asks the server for anything ⇒ ⛔ no EXPECTED_CONSOLE entry.
  '/dev/deck/level-done',
  '/dev/deck/returns',
  // T-089 · § 4.2ט — אנטומיית מסך השיעור. ⛔ אין עדיין מסלול מוצר: T-090 (התוכן)
  // חסומה ב-R-018, ולכן `<LessonScreen>` ⛔ אינו מרונדר בשום מקום שהארנס מגיע
  // אליו, וכל טענה על 320/375/414 עליו הייתה הצהרה. שתי שורות ו⛔ לא אחת, מאותו
  // נימוק בדיוק כמו `/dev/deck` מול `/dev/deck/done`: `phase` הוא prop, ולכן בלוק
  // הסיום ⛔ אינו נגיש מהמסלול שמעליו. שתיהן מקבלות את הפריטים כ-prop ואינן
  // מבקשות מהשרת דבר ⇒ ⛔ אין להן רשומה ב-EXPECTED_CONSOLE.
  '/dev/lesson',
  '/dev/lesson/done',
  // T-082 · D-041 — סריקת הרמה. `/study/scan` יושב מחוץ ל-`PROTECTED_SCREENS`
  // (proxy.ts) ולכן הוא **כן** מרונדר כאן, אבל בלי env של Supabase
  // `GET /api/levels/scan` עונה 503 בחוזה שלו עצמו ⇒ מה שהשורה ההיא מודדת הוא מצב
  // **הכשל**. הפיקסטורה מקבלת את 12 המילים כ-prop ואינה מבקשת מהשרת דבר, ולכן
  // ⛔ אין לה רשומה ב-EXPECTED_CONSOLE — והשקט הזה הוא ההוכחה שהרשת עצמה נמדדת.
  '/study/scan',
  '/dev/scan',
  // T-026 layout fixture, same reasoning: /onboarding redirects without Supabase
  // env, so the address band would otherwise be measured on the login screen.
  '/dev/identity',
  // T-029 layout fixture, same reasoning as /dev/identity: /onboarding redirects
  // without Supabase env (TD-13), so the goal form would otherwise be measured
  // on the login screen — every "ok /onboarding" line in this harness is really
  // the login screen, verified live in C-0013.
  '/dev/onboarding',
  // T-051 tab shell, through fixtures. All three real tab routes (`/studies`,
  // `/cards`, `/me`) are in `PROTECTED_SCREENS` (proxy.ts) and answer 307 to
  // `/login?expired=1` without Supabase env — measured live in C-0075, after
  // `tab bar is present` failed on `/cards` and the redirect turned out to be
  // the reason. Naming them here would print "ok /cards" for the login screen,
  // which is F-027 cause 1 (TD-13).
  '/dev/tabs/studies',
  // 🔴 `T-409`ⓒ — **המסך נפתח על המקום השמור**, ו⛔ המסלול שמעליו ⛔ אינו יכול
  // למדוד את זה: הוא ⛔ אינו מקבל `fixturePlaces`, ו-`GET /api/study/place` עונה
  // 401 בלי env של Supabase ⇒ ענף השחזור ⛔ אינו נגיש ממנו בשום רוחב. ⇒ מסלול
  // משלו, מאותו נימוק בדיוק שהצדיק את `/dev/deck/done` מול `/dev/deck`.
  // ⛔ הוא מקבל את שתי השורות כ-prop ⇒ `GET /api/study/place` ⛔ אינו נקרא ממנו
  // כלל, והשתיקה על הכתובת ההיא ב-`EXPECTED_CONSOLE` היא ההוכחה. ⚠️ הרשומה
  // היחידה שכן יש לו היא ה-503 של `<TabBar>`, בדיוק כמו לשלוש פיקסטורות הלשוניות.
  '/dev/tabs/studies/place',
  '/dev/tabs/cards',
  '/dev/tabs/me',
  // T-329ⓐ · המשך של T-321 — ⛔ **הכשל המלא של בורר החפיסות, ⛔ ולא הכשל החלקי.**
  //
  // ⛔ **ולא נוצרה פיקסטורה חדשה, וזו מדידה ⛔ ולא חיסכון.** השורה ביקשה «פיקסטורה
  // תחת `/dev` שבה שלוש קריאות החפיסה מחזירות 503» — והמסלול הזה כבר עושה בדיוק
  // את זה מאז C-0176: הוא מרנדר `<DeckSelector />` **בלי `unseen`**, ולכן אריח
  // «סינון מילים» מגיע ל-`toEntry` עם `count: null` ⇒ `enabled: false`. שלוש
  // הקריאות הנותרות עונות 503 בלי env ⇒ `primaryKey === null`, שהוא **התנאי
  // היחיד** שמרנדר את `recoveryBlock` לפני הרשימה (`DeckSelector.tsx:391`).
  // ⇒ `/dev/tabs/cards` ⛔ אינו יכול למדוד את זה: הוא מאכיל `fixtureSummary` עם
  // `unseen: 314`, ולכן אריח הרמה **פעיל** שם ו-`primaryKey !== null` תמיד.
  //
  // 🔬 **נמדד חי בטיק הזה ב-320 · 375 · 414 לפני שהשורה הזאת נכתבה:**
  // `[data-deck-failed]` ב-`top=52`, `טעינה מחדש` ב-`top=84 · bottom=138`,
  // ובדיוק `[data-primary-action]` אחד. ⇒ הבלוק למטה מודד מספר קיים, ⛔ ואינו
  // מצהיר על אחד שנקווה לו.
  '/dev/tabs/probe',
  // T-063 task 9. The two real world routes are NOT in PROTECTED_SCREENS (proxy.ts), so
  // unlike the tabs above they DO render here — but with no Supabase env
  // `/api/world/posts` and `/api/world/bank` answer 503 by their own contract, so what
  // these two lines measure is the FAILURE state of each screen: the Hebrew message and
  // the way out. That is a state a learner can meet, so it is measured on purpose and
  // ⛔ not "for coverage".
  '/world',
  '/world/compose',
  // C-0205 (T-106) — «שרשרת הכתיבה». ⛔ אין לה פיקסטורה, וזו הכרעה ⛔ ולא חיסכון:
  // בלי env של Supabase `GET /api/world/posts` עונה 503 בחוזה שלו עצמו, ולכן מה שנמדד
  // כאן הוא **המצב שהמסך מצייר כשאין נתונים** — «—» במקום מספר, המשפט העברי והדרך
  // החוצה. זה מצב שלומד פוגש, ⛔ ולא מסך שגיאה שהומצא להרמוניה.
  '/world/chain',
  // C-0218 (T-110) — «המילים שאספתי», ואותו נימוק בדיוק כמו `/world/chain` שמעליה:
  // בלי env של Supabase `GET /api/arcade/collected` עונה 503 בחוזה שלו עצמו, ולכן מה
  // שנמדד כאן הוא **המצב שהמסך מצייר כשאין נתונים** — «—» במקום מספר, המשפט העברי,
  // ואפס גלילה אופקית ב-320. זה מצב שלומד פוגש, ⛔ ולא מסך שהומצא למדידה.
  '/world/collected',
  // C-0298 (T-186) — מסך הסיפור, ואותו נימוק בדיוק כמו שתי השורות שמעליו: `/world/story`
  // יושב מחוץ ל-`PROTECTED_SCREENS`, אבל בלי env של Supabase `GET /api/world/story` עונה
  // `session_expired` בחוזה שלו עצמו ⇒ מה שנמדד כאן הוא **מצב הכשל** — המשפט העברי
  // והדרך החוצה. מצב שלומד פוגש, ⛔ ולא מסך שהומצא למדידה.
  '/world/story',
  // ...והפיקסטורה, כי אותו `session_expired` אומר שהפסקה עצמה — `data-story-body`, גובה
  // השורה של `36 § 3.2`, המקרא ושורת הסיכום — לעולם אינה על המסך בשורה שמעליה. היא
  // מקבלת את הסיפור כ-prop ואינה מבקשת מהשרת דבר ⇒ ⛔ אין לה רשומה ב-EXPECTED_CONSOLE,
  // והשקט הזה הוא מה שמוכיח שהמדידה אינה על מסך הכשל.
  '/dev/story',
  // C-0299 (T-188) — מסך הסיום, ואותו נימוק בדיוק כמו `/dev/deck/done` מול `/dev/deck`:
  // הוא נפתח רק **אחרי** קריאת סיפור שלמה, ולכן ⛔ אינו נגיש מהמסלול שמעליו בהרצה הזאת.
  // הפיקסטורה מקבלת את השאלה כ-prop ואינה מבקשת מהשרת דבר ⇒ ⛔ אין לה רשומה
  // ב-EXPECTED_CONSOLE. ⚠️ שורות התשובה הן שורות **רשימה**, ולכן החרגת `36 § 3`
  // ⛔ אינה חלה עליהן והן נמדדות מול 44px מלאים ככל כפתור אחר.
  '/dev/story/done',
  // C-0826 (T-494ⓓ) — the same end screen AFTER the read was saved: «לסיפור הבא» beside
  // «חזרה לעולם», and the all-read state with its one line instead of the button. Props only
  // (`initialReadSaved`) ⇒ ⛔ no EXPECTED_CONSOLE entry.
  '/dev/story/end',
  '/dev/story/end/all',
  // C-0518 (T-190ⓔ) — the messages fixture data sheet. Without Supabase env
  // `GET /api/world/messages` answers `unavailable` (200) in its own contract, so the
  // product route would measure a failure state. The sheet renders the fixture through the
  // same pure functions the route uses and asks the server for nothing ⇒ ⛔ no entry in
  // EXPECTED_CONSOLE. Task 6 (T-191) turns this route into the inbox list itself.
  '/dev/messages',
  // C-0816 (T-482) — the same inbox while the API is cold: three skeleton rows. Props only
  // ⇒ ⛔ no EXPECTED_CONSOLE entry.
  '/dev/messages/cold',
  // C-0522 (T-192) — the open message fixture: the body bubble, the three required-word
  // chips, the block keyboard (T-461, as `screen_mail` draws it) and ⛔ no tab bar. It is
  // handed its item and its block set as props and asks the server for nothing ⇒ ⛔ no
  // EXPECTED_CONSOLE entry.
  '/dev/messages/open',
  // C-0791 (T-461) — the LIVE keyboard: `GET /api/world/messages/continuations` needs ⛔ no
  // session and ⛔ no Supabase, so the ~1,149-block opening set is really on screen at
  // 320/375/414 — every block measured against 44px, the sheet measured for h-scroll.
  '/dev/messages/keyboard',
  // C-0803 (T-469) — the `הקיר` tab: the six code cells (one input over six boxes, so the
  // target is the whole strip at 320) and the in-class panel. Props only ⇒ ⛔ no
  // EXPECTED_CONSOLE entry.
  '/dev/messages/wall',
  // C-0803 (T-474) — the reply sheet open over the wall (kol-C-12), with the LIVE keyboard:
  // `GET /api/world/messages/continuations` needs ⛔ no session ⇒ ⛔ no EXPECTED_CONSOLE entry.
  '/dev/messages/wall/reply',
  // C-0810 (T-479) — the `סיפור` tab: legend above the chain, three lines, `התור שלך`, then
  // the empty and the waiting states. Props only ⇒ ⛔ no EXPECTED_CONSOLE entry.
  '/dev/messages/story',
  // ...and the fixture, because that same 503 means the BANK — the chips, the draft, the
  // punctuation row, the publish bar — is never once on screen on either route above. It
  // is handed its bank as a prop and asks the server for nothing, which is why it needs no
  // EXPECTED_CONSOLE entry and why an entry appearing there later would mean this
  // measurement has silently gone back to reading the failure screen.
  '/dev/world',
  // C-0203 (T-105) — ואותו נימוק בדיוק, רכיב אחד הלאה: בלי env של Supabase
  // `GET /api/world/recall` עונה 503 בחוזה שלו עצמו, ולכן הכרטיס עצמו — המשפט של הלומד,
  // המסגרת הריקה במקום מילת היעד, ארבע האפשרויות שתיים-ושתיים ונחיתת המילה — מעולם לא
  // היה על המסך ב-320/375/414, ו-`/world` מדד עד היום את מצב הכשל שלו בלבד. הפיקסטורה
  // מקבלת כרטיס כ-prop ואינה מבקשת מהשרת דבר ⇒ ⛔ אין לה רשומה ב-EXPECTED_CONSOLE.
  '/dev/world/recall',
  // C-0314 (T-205ⓕ) — הטבעת, ואותו נימוק בדיוק כמו שתי הפיקסטורות שמעליה: בלי env של
  // Supabase גם `GET /api/arcade/round` וגם `GET /api/world/status` עונים 503 בחוזה שלהם
  // עצמם ⇒ `/world` מצייר את **המצב הריק** שלו, ושמונת הצמתים, שלוש מחלקות הנעילה וסימן
  // «כאן היית» מעולם אינם על המסך ב-320/375/414. הפיקסטורה מקבלת את הקלטים כ-prop ואינה
  // מבקשת מהשרת דבר ⇒ ⛔ אין לה רשומה ב-EXPECTED_CONSOLE.
  // ⛔ ⛔ ואינה ב-`FLOW_ROUTES` ו⛔ אינה ב-`TAB_ROUTES`: היא מרנדרת את הרכיב לבדו,
  // בלי סרגל לשוניות (תקדים `/dev/deck`, C-0104), ו-D-028 נשארת קשורה ל-`FLOW_ROUTES`.
  '/dev/world/ring',
  // C-0315 (T-146ⓒ) — ⛔ ולא כפילות של השורה שמעליה. בלי env של Supabase שני הנתיבים
  // עונים `unavailable`, שהוא **הקוד החולף היחיד** מהשלושה ⇒ המצב הריק שנצבע כאן ⛔ יכול
  // להיות רק «נסה שוב», והענף שנושא **יציאה** במקום ניסיון חוזר ⛔ אינו נגיש בדפדפן
  // בארגז החול. הפיקסטורה מציירת אותו, ולכן «⛔ אין מסך כשל בלי יציאה» (D-065) נמדד
  // ב-320/375/414 ⛔ ולא רק בבדיקת יחידה. ⛔ אינה מבקשת מהשרת דבר ⇒ ⛔ אין לה EXPECTED_CONSOLE.
  '/dev/world/ring/expired',
  // T-503ⓓ — מרכז האפליקציות (`kol-E-02`, Figma `3341:3`). הטבעת נקראת מ-`localStorage`
  // אחרי הטעינה, ⇒ `/world/apps` בדפדפן נקי מצייר את `DEFAULT_RING` בלבד, ושלושת מצבי
  // הכרטיס (מותקנת · להתקנה · נעולה) ⛔ אינם על המסך יחד. הפיקסטורה מקבלת שש מותקנות
  // כ-prop ⇒ ⛔ אין לה בקשה לשרת ⛔ ואין לה EXPECTED_CONSOLE.
  '/dev/world/apps',
  // T-505 — מצב המיקום (`kol-E-03`, Figma `3341:70`). נפתח רק מ-`?place=` אחרי «התקן» ⇒
  // `/world` בדפדפן נקי ⛔ אינו מגיע אליו. הפיקסטורה מתחילה בו ⇒ ⛔ בלי בקשה לשרת.
  '/dev/world/ring/place',
  // T-095 · § 4.2י. `/arcade` יושב מחוץ ל-`PROTECTED_SCREENS` ולכן הוא **כן** מרונדר כאן,
  // אבל בלי env של Supabase `GET /api/arcade/round` עונה 503 בחוזה שלו עצמו ⇒ מה שהשורה
  // הזאת מודדת הוא מצב **הכשל**: המשפט העברי והדרך החוצה. מצב שלומד יכול לפגוש בו.
  '/arcade',
  // ...והפיקסטורה, כי אותו 503 אומר שהמילה, ארבע האפשרויות ומד חיי היריב לעולם אינם על
  // המסך בשורה שמעל. היא מקבלת את הסיבוב כ-prop ואינה מבקשת מהשרת דבר — ולכן ⛔ אין לה
  // רשומה ב-EXPECTED_CONSOLE, והשקט הזה הוא מה שמוכיח שהמדידה אינה על מסך הכשל.
  '/dev/arcade',
  // T-181 · D-134 — מסך הבית של הזירה, ואותו נימוק בדיוק כמו השורה שמעליה: בלי env של
  // Supabase גם `GET /api/arcade/home` עונה 503 בחוזה שלו עצמו ⇒ `/arcade` מצייר את מסך
  // ה**כשל**, וחמש צמתי הבוס, ארבע המשבצות ושלוש הפעולות מעולם אינן על המסך ב-320/375/414.
  // הפיקסצ׳ר מקבל את המצב כ-prop ו⛔ אינו מבקש מהשרת דבר ⇒ ⛔ אין לו רשומה ב-EXPECTED_CONSOLE.
  '/dev/arcade/home',
  // T-217 · `37 § 7` — בחירת דמות, המצב השלישי של המעטפת. נפתח רק אחרי ש-`GET /api/arcade/home`
  // מחזיר `character: null`, ⇒ בלי env של Supabase המסך ⛔ מעולם לא נמדד דרך `/arcade`.
  // הפיקסצ׳ר מרנדר את הרכיב ישירות עם `save` ריק ⇒ ⛔ אין לו רשומה ב-EXPECTED_CONSOLE.
  '/dev/arcade/character',
  // T-096 · § 4.2י. מסך הסיום ⛔ אינו נגיש דרך `/arcade` בלי סשן: הוא נפתח רק אחרי
  // ‏`POST /api/arcade/result` שעונה 200, וכאן אין env של Supabase ⇒ הנתיב האמיתי עוצר
  // ב-503 והמסך הזה מעולם לא נמדד. הפיקסטורה מרנדרת אותו ישירות ואינה מבקשת מהשרת דבר,
  // ולכן ⛔ אין לה רשומה ב-EXPECTED_CONSOLE.
  '/dev/arcade/result',
  // T-180 · `37 § 10`. מסך התוצאות נפתח **אך ורק** אחרי קרב מלא ו-200 מ-
  // ‏`POST /api/arcade/result`, ⇒ בלי env של Supabase הוא ⛔ מעולם לא נמדד ב-320/375/414.
  // הפיקסצ׳ר מרנדר את הרכיב ישירות ו⛔ אינו מבקש מהשרת דבר, ולכן ⛔ אין לו רשומה
  // ב-EXPECTED_CONSOLE — אותה הנמקה בדיוק של `/dev/arcade/result` שמעליו.
  '/dev/arcade/summary',
  // 🧪 `T-421` (`C-0779`) · המשך של `T-416` — שלושת מסכי הקרב ש⛔ אף נתיב ⛔ לא רינדר בלי
  // שרת: הטעינה (‏`/arcade` מחליף אותה מיד בכשל ה-503), «⛔ אין מספיק מילים ברמה» וסכמה
  // חסרה. ‏`initialScreen` מוזרק והבקשה ⛔ אינה יוצאת ⇒ ⛔ אין להם רשומה ב-EXPECTED_CONSOLE.
  '/dev/arcade/loading',
  '/dev/arcade/too-small',
  '/dev/arcade/schema-missing',
  // 🧪 `T-453` (`C-0781`) — סוף הסיבוב, «שומר…». ‏`initialEnded` ⇒ ‏`POST /api/arcade/result`
  // ⛔ אינו יוצא ⇒ ⛔ אין לו רשומה ב-EXPECTED_CONSOLE, אותה הנמקה של שלושת שמעליו.
  '/dev/arcade/end',
  '/does-not-exist',
];
const MIN_TAP = 44;

/**
 * T-183 · `36 § 3` — the ONE exemption from `MIN_TAP`, and its exact shape.
 *
 * `36 § 3` amends MF-2: an inline tap target inside a continuous reading paragraph
 * is exempt from 44x44, because widening a word to 44px means changing the font,
 * which breaks the constitution. Without this, the story screen `36 § 13` puts
 * first could not pass `check:mobile` at all — every tappable word in the
 * paragraph would report as an undersized target, and the cheap way out would have
 * been to weaken the 44px scan for the whole product.
 *
 * ⛔ THE SELECTOR IS THE NARROWNESS. Two conditions, both required:
 *   1. the element carries `data-story-word`, AND
 *   2. it is INSIDE an element carrying `data-story-body`.
 * A `data-story-word` anywhere else is ⛔ not exempt, so the attribute cannot be
 * sprinkled on a button, chip, tab or list row to buy it out of the 44px floor —
 * which is precisely what `36 § 3` says the exemption is not for.
 *
 * ⛔ AND THE EXEMPTION IS NOT FREE. It is a trade: everything it excuses is
 * measured instead by `auditStoryBody` against all four conditions of `36 § 3`, on
 * every route, at every width, in the block further down. The two are inseparable
 * on purpose — an exemption whose audit could be skipped is just a hole.
 */
const STORY_TAP_EXEMPT = '[data-story-body] [data-story-word]';

/**
 * T-057: 44px targets that touch each other are still one mis-tap. 8px is the
 * floor the task row names, and it is the second step of the 4px scale the
 * constitution fixes (§ 4).
 */
const MIN_GAP = 8;

/**
 * F-027 — the screens a learner walks through to reach the product, in order:
 * landing, the two auth screens, the goal question, the study screen. Every one
 * of them must offer a marked way forward that a thumb can actually reach.
 *
 * `/dev/onboarding` and not `/onboarding`: the real route answers 307 without
 * Supabase env (TD-13), so naming it here measured the login screen instead —
 * one of the three reasons roy's dead end was invisible to this harness.
 *
 * `/sources` and `/offline` are deliberately absent: they are destinations, not
 * steps, and neither is on the path to first study.
 *
 * `/world/compose` joined C-0129 (T-063 task 9): § 4.2ה calls it a flow screen, D-028 gives
 * a flow screen an `<ActionBar>` and ⛔ no tab bar, and it is the only screen in the world
 * feature a learner walks THROUGH rather than lands on. Here it renders its 503 state, so
 * what this block asserts on it is that the failure state still offers exactly one marked
 * way out and puts it where a thumb can reach — which is precisely the F-027 dead end.
 */
/**
 * T-214 · **D-134 — the arena contrast gate is per SCREEN, ⛔ not per component.**
 * Every route here paints its own dark surfaces under `[data-arena-scope]`, so a
 * body-level probe is blind to it. ⛔ A new arena screen that is ⛔ not in this list is a
 * screen nobody measured.
 */
const ARENA_SCREENS = ['/dev/arcade', '/dev/arcade/home', '/dev/arcade/character'];

const FLOW_ROUTES = ['/', '/signup', '/login', '/dev/onboarding', '/study', '/world/compose'];

/**
 * T-091 · F-098 — היכן נמדדות שלוש בדיקות F-027 («סימון אחד · האגודל מגיע · במסך הראשון»).
 *
 * ⚠️ ⛔ ⛔ אינו `FLOW_ROUTES`, וזו מדידה ⛔ ולא טעם: באותו בלוק יושבת גם
 * `no tab bar on a flow screen`, ושתי לשוניות הפיקסטורה מרנדרות `<TabBar />`
 * (`components/TabBar.tsx:167`, `data-tab-bar="true"`) — בעוד `TAB_ROUTES` **דורש**
 * שהסרגל יהיה שם. הוספה נאיבית של השתיים ל-`FLOW_ROUTES` מפילה את הבדיקה ההיא
 * בוודאות, שש פעמים (שני מסלולים × שלושה רוחבים), והדרך הזולה החוצה היא להחליש
 * אותה. ⇒ הבלוק נחתך במקום, ו-D-028 נשארת קשורה ל-`FLOW_ROUTES` בלבד.
 *
 * מסך לשונית הוא **יעד** ⛔ ולא צעד בזרימה — בדיוק הנימוק שבגללו `/sources` ו-`/offline`
 * ⛔ אינם ב-`FLOW_ROUTES`. מה שכן נכון עליו הוא שהוא מחזיק **פעולה מסומנת אחת** שהאגודל
 * מגיע אליה בלי גלילה, וזה מה שנמדד כאן. `02-inbox` פריט 9 של רוי: «לתת לצוות עיניים».
 *
 * ⛔ `/dev/tabs/me` ⛔ אינו כאן ובכוונה: T-091 נוקבת בשתי לשוניות, והשלישית היא
 * שורת משימה של ה-PM ⛔ ולא הרחבה שסוכן מוסיף לעצמו.
 */
// ⚠️ `/dev/tabs/studies` הוסר מכאן ב-T-246 (C-0381): המסך הפך לבורר ארבעת
// המסלולים, ואין בו יעד data-primary-action יחיד יותר — ארבעת השבבים הם בורר
// (role="tab"), ⛔ לא CTA. חוזר לרשימה הזאת כש-T-247 (נתיב המודולים) נותן למסלול
// הנבחר יעד לחיצה אמיתי.
const PRIMARY_ACTION_ROUTES = [...FLOW_ROUTES, '/dev/tabs/cards'];

/**
 * T-067 — where the primary action LEADS. `02-inbox` י׳, and the other half of F-027.
 *
 * Two thirds of the connectivity guarantee already exist above: every flow screen holds
 * exactly one marked primary action, it is hit-testable, and it paints inside the first
 * viewport. What was never measured is the tap itself — a button that is beautifully
 * placed and does nothing is the same dead end roy hit on the live site.
 *
 * ⛔ NOT "the page changed". Each route declares ONE destination and it is named:
 *   navigates — the URL becomes `to` and a marker only that screen holds is present.
 *   announces — an exact Hebrew sentence that was ABSENT before the tap is present after.
 *   refetches — the tap re-issues one named request (this is what «נסה שוב» is FOR).
 *
 * The kind is not a preference. `navigates` is the strong form and it is used wherever it
 * is reachable — which, measured and not assumed, is one route: this harness runs
 * `next start` with no Supabase env, so `/onboarding` answers 307 (TD-13) and every study
 * and world endpoint answers 503 by its own contract. ⛔ An entry may not weaken its kind
 * to make a screen pass: a screen whose tap produces NOTHING fails on every kind, which is
 * the whole point.
 */
const FLOW_ARRIVAL = {
  '/': {
    kind: 'navigates',
    to: '/signup',
    marker: 'input[name="email"]',
    why: 'the only flow screen whose primary action is a plain <Link> and needs no session',
  },
  '/signup': {
    kind: 'announces',
    text: 'כתובת האימייל לא נראית תקינה',
    why: 'AUTH_MESSAGES_HE.invalid_email — checkCredentials rejects the empty form client-side, so the tap is measurable without ever reaching Supabase',
  },
  '/login': {
    kind: 'announces',
    text: 'כתובת האימייל לא נראית תקינה',
    why: 'same client-side rejection as /signup; the harness has no account to log in with',
  },
  '/dev/onboarding': {
    kind: 'announces',
    text: 'השמירה נכשלה. נסה שוב.',
    why: 'FAILURE_HE.save — the tap reaches POST /api/profile, which answers 503 without env (route.ts:24), and the form paints one Hebrew sentence',
    // The request THIS tap causes. See the settle loop below: naming it is what keeps the
    // 503 it logs inside this route instead of leaking onto the next one.
    settles: '/api/profile',
  },
  '/study': {
    kind: 'refetches',
    request: '/api/study/queue',
    why: 'without env the screen is in its failure state and its primary action is «נסה שוב», whose entire job is to re-issue this one request',
  },
  '/world/compose': {
    kind: 'refetches',
    request: '/api/world/bank',
    why: 'same failure state and same «נסה שוב», one route down',
  },
  // T-091 · `02-inbox` פריט 9 — «לתת לצוות עיניים» על שתי לשוניות שהמדידה מעולם
  // לא נגעה בהן. ⛔ שתיהן `navigates`, הצורה החזקה: `kind` ⛔ אינו נחלש כדי
  // שמסך יעבור.
  //
  // ⚠️ `/dev/tabs/studies` אין לו יותר ערך FLOW_ARRIVAL (T-246, C-0381): הבורר אינו
  // מנווט לשום מקום — הוא state מקומי בין ארבעה שבבים. T-247 מחזיר יעד אמיתי.
  //
  // ⛔ `/login` ולא `/cards`, וזו מדידה: `proxy.ts:28` מחזיק את `/cards`
  // ב-`PROTECTED_SCREENS`, ולארנס אין env של Supabase ⇒ הבקשה נענית 307
  // ל-`/login?expired=1`. לכתוב כאן `/cards` היה מייצר בדיקה שנכשלת תמיד על
  // התנהגות **נכונה** של המוצר.
  // 🆕 T-225 (D-142, closes F-140) — הפעולה המסומנת כאן השתנתה. `unseen: 314`
  // בפיקסצ׳ר (`RENDER_SUMMARY`) הוא לא-ריק ולא-אפס ⇒ אריח `level` הוא `enabled: true`
  // מהרגע הראשון (אינו תלוי בקריאת רשת), בעוד `due`/`unknown`/`sentences` נשארים
  // מושבתים (503 בלי env). ⇒ `allTilesDead` הוא ⛔ `false`, בלוק ה-`dead` (§
  // `DECK_ALL_EMPTY_HREF`) ⛔ אינו מרונדר, ו-`primaryKey` הוא `'level'` — האריח
  // עצמו נושא את `data-primary-action`, ⛔ ולא הנפילה. היעד עדיין `/study`
  // (`[data-action-bar]` מרונדר שם בלי תלות ב-`deck`), אבל הבקשה שההקשה גורמת לה
  // היא `deck=level` ⛔ ולא `deck=due`.
  '/dev/tabs/cards': {
    kind: 'navigates',
    to: '/study',
    marker: '[data-action-bar]',
    why: 'T-225 unlocked the level tile — it is the only enabled tile in this fixture (unseen=314) and therefore the primary action; landing on /study proves the tap is not a dead end',
    // הבקשה שהנחיתה גורמת. בלי לנקוב בה, ה-503 שלה נספר על המסלול הזה אחרי
    // שהלולאה כבר עברה הלאה — בדיוק הייחוס השגוי שנמדד ב-C-0134.
    settles: '/api/study/queue?deck=level',
  },
};

/**
 * T-227 · plan/docs/superpowers/plans/2026-08-30-journey-walk.md — crosses SCREENS
 * instead of measuring one at a time (that is `FLOW_ARRIVAL`, above; ⛔ do not touch
 * it). Three journeys, declared and ⛔ never inferred, § 1 of the plan:
 *
 *   join  — the one journey a learner walks exactly once (‏/ → /signup →
 *           /dev/onboarding → /dev/tabs/studies)
 *   learn — the daily loop, measured in `36 § 5`
 *   play  — the only journey that crosses three flows (nav · story · arena), so it
 *           is the only one where the same destination could carry two Hebrew names
 *
 * Every step's `action`, `to`/`stays` and `why` were read live off the running
 * fixtures for this tick (C-0403) — not copied from the plan's illustrative
 * interface, which pre-dates T-246/C-0381 removing `/dev/tabs/studies`'s only
 * primary action. A step with no `action` is the journey's arrival screen, or a
 * screen this harness found with no forward control at all — both are real,
 * MEASURED facts, not implementation gaps in this file. This harness has no
 * Supabase env, so a tap whose real destination cannot render here (`to`) still
 * gets clicked and counted, and the walk then continues from the next fixture
 * route in the table — the same bridge `join`'s `stays` steps already need.
 */
const JOURNEYS = {
  join: {
    steps: [
      {
        route: '/',
        action: 'main [data-primary-action]',
        to: '/signup',
        why: 'a plain <Link>, no session needed — same tap FLOW_ARRIVAL["/"] already proves navigates',
      },
      {
        route: '/signup',
        action: 'main [data-primary-action]',
        stays: true,
        why: 'the empty-form submit announces AUTH_MESSAGES_HE.invalid_email and stays (FLOW_ARRIVAL["/signup"]) — a real submit would have moved on, so the walk bridges to the next fixture',
      },
      {
        route: '/dev/onboarding',
        action: 'main [data-primary-action]',
        stays: true,
        why: 'POST /api/profile answers 503 without env (FLOW_ARRIVAL["/dev/onboarding"]); the walk bridges onward the same way',
      },
      {
        route: '/dev/tabs/studies',
        why: 'arrival — the daily home screen. T-246 (C-0381) left it with no primary action; measured live, not assumed',
      },
    ],
    why: 'the one journey a learner walks exactly once — every extra tap in it is counted twice',
  },
  learn: {
    steps: [
      {
        route: '/dev/tabs/studies',
        why: 'daily-loop entry — same T-246 gap as join’s arrival: no forward control to walk on',
      },
      {
        route: '/dev/tabs/cards',
        action: 'main [data-primary-action]',
        to: '/study',
        why: 'DeckSelector (T-225) renders a real <Link data-primary-action> to /study?deck=level; /study 503s without env, so the walk bridges to /dev/deck — the fixture standing in for the review screen it would show',
      },
      {
        route: '/dev/deck',
        why: 'the card stack has no single primary action by design — each card reveals its own grade buttons on tap, one level below what this macro-navigation walk drives',
      },
      {
        route: '/dev/deck/done',
        why: 'arrival — the daily loop measured in `36 § 5`',
      },
    ],
    why: 'the daily loop — the walk a learner repeats every day',
  },
  play: {
    steps: [
      {
        route: '/dev/world/ring',
        action: '[data-ring-node="stories"]',
        to: '/world/story',
        why: 'the ring node that opens the stories app (components/WorldRing.tsx, lib/core/worldRing.ts); /world/story has no env-free content, so the walk bridges to /dev/story, the fixture for the reading screen it would show',
      },
      {
        route: '/dev/story',
        action: 'main button:has-text("סיימתי לקרוא")',
        stays: true,
        why: 'the fixture opens in the "reading" phase — DONE_READING_HE only moves phase to "question" locally (components/StoryScreen.tsx); the exit Link renders in the question/finished phase only, so the walk bridges to /dev/arcade/home',
      },
      {
        route: '/dev/arcade/home',
        action: 'main button:has-text("התחל קרב")',
        stays: true,
        why: 'app/dev/arcade/home/page.tsx wires onStart to a no-op by design (a real battle needs a live session) — the tap is real, the fixture just does not move; the walk bridges to /dev/arcade',
      },
      {
        route: '/dev/arcade',
        why: 'arrival — the battle screen. The only journey crossing three flows, so the only one where a shared destination could carry two different Hebrew names',
      },
    ],
    why: 'the journey that crosses three flows (nav · story · arena) — the only one where name drift can appear',
  },
};

/**
 * A control this codebase's own screens use for "go back" (`ArenaHome.BACK_HE`,
 * `StoryScreen.BACK_TO_WORLD_HE`, `CardDeck`'s "חזרה לכרטיסיות"): the accessible
 * name is exactly `חזרה`, or starts with `חזרה ` followed by a destination.
 * ⛔ Deliberately narrower than "contains חזרה" — `/dev/tabs/cards` carries a
 * filter chip labelled `חזרה— מילים שסימנת לא ידעתי` ("review", not "return"),
 * and a plain substring match would count it as a way back it is not.
 */
const BACK_CONTROL_RE = /^חזרה(\s|$)/;

/**
 * @param page   a page on the already-open `browser` — T-227's plan bans a second
 *               browser launch (~25s already paid for the checks above)
 * @param name   journey name, for labels only
 * @param journey {steps, why}
 * @returns {Promise<{name: string, taps: number, deadEnd: string[], nameDrift: string[], wayBack: string[]}>}
 */
async function walkJourney(page, name, journey) {
  const { steps } = journey;
  let taps = 0;
  const deadEnd = [];
  const wayBack = [];
  /** @type {Map<string, Set<string>>} */
  const labelsByDestination = new Map();

  await page.goto(`${BASE}${steps[0].route}`, { waitUntil: 'networkidle' });

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const landedOn = new URL(page.url()).pathname;
    if (landedOn !== step.route) {
      // The previous step's bridge did not land where the table says it should —
      // a real gap, not a fixture limit. Record it and keep walking from where we
      // actually are so the rest of the journey still yields real numbers.
      deadEnd.push(`${step.route} (bridge landed on ${landedOn})`);
    }

    // Playwright's `hasText` filter reads textContent only — `/dev/arcade/home`'s
    // back control is an icon-only <a aria-label="חזרה">, empty text — so this has
    // to read BOTH textContent and aria-label itself, in the page.
    const hasBack = await page.evaluate((source) => {
      const re = new RegExp(source);
      return [...document.querySelectorAll('a, button')].some(
        (el) => re.test((el.textContent || '').trim()) || re.test(el.getAttribute('aria-label') || ''),
      );
    }, BACK_CONTROL_RE.source);
    if (i > 0 && !hasBack) wayBack.push(step.route);

    let hasAction = false;
    if (step.action) {
      const control = page.locator(step.action).first();
      hasAction = (await control.count()) > 0;
      if (hasAction) {
        const label = ((await control.textContent()) ?? '').trim();
        const destination = step.to ?? steps[i + 1]?.route;
        if (destination) {
          if (!labelsByDestination.has(destination)) labelsByDestination.set(destination, new Set());
          labelsByDestination.get(destination).add(label);
        }
        await control.click();
        taps += 1;
        // Same wait shape as FLOW_ARRIVAL's own `navigates` branch above (F-101,
        // C-0250): `waitForLoadState('networkidle')` can resolve before the SPA
        // transition it is meant to wait for even starts, and reading the URL then
        // is a race, not a measurement.
        if (step.to) {
          await page.waitForURL(`**${step.to}`, { timeout: 5000 }).catch(() => {});
        } else {
          await page.waitForTimeout(300);
        }
        const after = new URL(page.url()).pathname;
        if (step.stays) {
          if (after !== step.route) {
            deadEnd.push(`${step.route} — expected to stay, moved to ${after}`);
          }
        } else if (step.to && after !== step.to) {
          deadEnd.push(`${step.route} — tap did not arrive at ${step.to} (landed on ${after})`);
        }
      }
    }

    if (!hasAction && !hasBack) deadEnd.push(step.route);

    // Bridge to the next fixture in the table. This harness has no Supabase env, so
    // a real tap either stays (announces) or leaves the fixture set entirely (`to`)
    // — either way the walk continues from the declared next route, exactly the
    // stand-in every other fixture in this file already is.
    const nextRoute = steps[i + 1]?.route;
    if (nextRoute) await page.goto(`${BASE}${nextRoute}`, { waitUntil: 'networkidle' });
  }

  return { name, taps, deadEnd, nameDrift: driftingNames(labelsByDestination), wayBack };
}

/**
 * The console lines a route is ALLOWED to produce, per route and per exact request.
 *
 * Added C-0102 (T-065 task 6), and deliberately as narrow as it can be written. This
 * harness runs `next start` with no Supabase env, so `GET /api/study/queue` answers 503 by
 * its own contract, and Chromium logs every non-2xx resource as a console error. That log
 * is not a defect in the screen — the failure state it produces is precisely what this
 * harness measures on `/study` — but a blanket exemption for the route would also hide a
 * real uncaught exception, which is the whole reason the clean-console check exists.
 *
 * So the allowance is keyed to the one URL and the one status: anything else on `/study`,
 * including a 401 or a 500 from the same endpoint, still fails.
 * ⛔ Do NOT add an entry here to silence a screen. An entry is only correct when the harness
 * itself is the reason the request cannot succeed.
 */
const EXPECTED_CONSOLE = {
  '/study': [/status of 503[\s\S]*@\S*\/api\/study\/queue/],
  '/study/scan': [/status of 503[\s\S]*@\S*\/api\/levels\/scan/],
  // C-0103 (T-065 task 7): `<CardsScreen>` became the deck selector and now reads both
  // decks for their counts. Same situation and same narrowness as `/study` above — the
  // fixture has no session and the harness has no Supabase env, so the queue answers 503
  // by its own contract and the browser logs it. Keyed to the two exact URLs the screen
  // requests and to that one status: a 401, a 500, or any other request on this route
  // still fails the check.
  // T-329ⓐ — ⛔ שלוש הקריאות **הן** הפיקסטורה כאן, ⛔ ולא רעש שסובלים אותו. המסלול
  // קיים כדי שכולן ייכשלו: זה מה שמביא את `DeckSelector` ל-`primaryKey === null`.
  // ⛔ מקודד לשלוש הכתובות המדויקות ולסטטוס האחד — 401 או 500 כאן עדיין מפילים,
  // בדיוק כמו ב-`/dev/tabs/cards` מתחת.
  '/dev/tabs/probe': [
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=due&limit=1/,
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=unknown&limit=1/,
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=sentences&limit=1/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
  ],
  '/dev/tabs/cards': [
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=due&limit=1/,
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=unknown&limit=1/,
    // C-0321 (T-199ⓒ): the «משפטים» tile stopped saying «נעול» and now carries its count,
    // so `<DeckSelector>` reads a THIRD deck on mount. Same situation, same contract, same
    // narrowness as the two lines above it: the fixture has no session and the harness has
    // no Supabase env, so `?deck=sentences` answers 503 by its own contract and the browser
    // logs it. ⛔ Keyed to the one exact URL and the one status — a 400 here would mean the
    // route rejected the deck name and would still fail this check, which is precisely the
    // regression worth catching.
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=sentences&limit=1/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
    // C-0176 (T-081): the fixture now renders `<LevelMapScreen>`, which asks for the level
    // summary on mount. The fixture has no session and the harness has no Supabase env, so
    // `GET /api/levels/summary` answers 503 by its own contract — and that failure branch,
    // the Hebrew sentence rather than «0 מילים», is exactly what this route measures. Keyed
    // to the one URL and the one status like every entry above: a 401 or a 500 on the same
    // URL still fails the check.
    /status of 503[\s\S]*@\S*\/api\/levels\/summary/,
    // T-097: `<LevelMapScreen>` מחזיק עכשיו גם את `<ArcadeEntry>`, שמבקש סיבוב בעלייה.
    // בלי env של Supabase הנתיב עונה 503 בחוזה שלו עצמו, וזו בדיוק השורה המושבתת
    // שהמדידה עוברת עליה. מקושר לכתובת אחת ולסטטוס אחד, כמו כל רשומה כאן.
    /status of 503[\s\S]*@\S*\/api\/arcade\/round/,
    // T-091: ההקשה נוחתת על `/study`, שמבקש את התור **בלי** `limit` ומקבל 503
    // מהחוזה שלו עצמו. ⛔ פטור למסלול: `$` נועל את סוף הכתובת, ולכן הרשומה
    // הזאת ⛔ אינה יכולה לבלוע גם את `?deck=due&limit=1` — הבקשה ש-`<DeckSelector>`
    // עושה על המסלול עצמו, ושכבר יש לה רשומה משלה למעלה. 401 או 500 על אותה
    // כתובת עדיין מפילים.
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=due$/,
    // C-0318 (T-210ⓗ): the fixture now feeds `<LevelMapScreen>` a non-null summary, so the
    // screen reaches its READY branch — and `<UnknownList>`, which only renders there, asks
    // for its list. ⛔ A NEW request on this route, ⛔ not a new defect: the harness has no
    // Supabase env, so the queue answers 503 by its own contract and the list lands in the
    // «—» state it was written for. ⚠️ Before this tick the route could only ever reach the
    // FAILURE branch, which is exactly why the bar and the counters were never measured.
    // Keyed to the one URL and the one status like every entry above: a 401 or a 500 on the
    // same URL still fails the check, and `limit=50` ⛔ cannot be satisfied by the
    // `limit=1` entry above.
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=unknown&limit=50$/,
    // 🆕 T-225 (D-142, closes F-140): the level tile carries a non-null count
    // (`unseen: 314` in the fixture) from render, so it is `enabled: true` without
    // waiting on a request — `allTilesDead` is false and it becomes the primary
    // action. The tap this harness drives (PRIMARY_ACTION_ROUTES below) therefore
    // lands on `/study?deck=level`, whose own on-mount fetch answers 503 with no
    // env, exactly like the pre-existing `deck=due$` line above it. Keyed to the
    // one URL and the one status: a 400 (the route rejecting `deck=level`) or any
    // other status still fails this check.
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=level$/,
  ],
  // C-0127 (task 7): `<TabBar>` now asks the server whether the world tab is unlocked, so
  // EVERY tab fixture makes this one request and the harness — which runs with no Supabase
  // env — answers 503 by the endpoint's own contract. ⚠️ This is the failure path the
  // component is written for and the harness therefore MEASURES it: a 503 leaves the tab
  // locked, and the 44px/no-scroll checks on these three routes are passing over exactly
  // that locked bar. Keyed to the one URL and the one status, like every entry above: a 401
  // (a real session that expired) or a 500 on the same URL still fails the check.
  '/dev/tabs/studies': [
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
    // 🔴 `T-409` — **רשומה שנייה, והיא מדידה ⛔ ולא ויתור.** הפיקסטורה הזאת מקבלת
    // `fixtureLevels` ו⛔ **לא** `fixturePlaces` ⇒ `<StudiesScreen>` באמת מבקש את
    // המקום השמור, והרתמה — שרצה בלי env של Supabase — מקבלת 503 לפי החוזה של
    // הנתיב עצמו. ⇒ **זה מסלול הכשל שהשורה נכתבה עבורו**, והשער עובר עליו: קריאה
    // שנכשלה פירושה שהמסך נפתח על `אוצר מילים`, כלומר בדיוק ההתנהגות שקדמה
    // ל-`T-409` — וזה מה שכל הבדיקות על המסלול הזה מודדות.
    // ⛔ כתובת אחת וסטטוס אחד, כמו כל רשומה כאן: 401 (סשן שפג) או 500 על אותה
    // כתובת עדיין מפילים את הבדיקה.
    /status of 503[\s\S]*@\S*\/api\/study\/place/,
  ],
  // `T-409` — אותה רשומה בדיוק, ומאותה סיבה: הפיקסטורה מרנדרת `<TabBar>` ⇒ היא
  // עושה את אותה בקשה אחת. ⛔ **ו⛔ אין לה רשומה שנייה:** `fixturePlaces` עוקף את
  // `GET /api/study/place` לגמרי, ⇒ השתיקה על הכתובת ההיא היא ההוכחה שהמצב
  // המשוחזר נמדד מה-prop ו⛔ לא ממסד שאינו קיים בהרתמה.
  '/dev/tabs/studies/place': [/status of 503[\s\S]*@\S*\/api\/world\/status/],
  '/dev/tabs/me': [/status of 503[\s\S]*@\S*\/api\/world\/status/],
  // C-0129 (T-063 task 9): the two real world routes. `/world` sits inside the `(tabs)`
  // group, so it makes BOTH requests — `<WorldFeed>` reads the feed and `<TabBar>` asks
  // whether the tab is unlocked — and `/world/compose` sits outside the group, so it makes
  // exactly one. Each entry is keyed to the URL and to the 503 the missing env forces, like
  // every entry above: a 401 or a 500 on the same URL still fails the check.
  // ⛔ There is deliberately NO entry for `/dev/world`: the fixture receives its bank as a
  // prop and issues no request at all, and that silence is what proves the harness is
  // measuring the bank rather than the failure screen.
  // C-0200 (T-098): `<AppGrid>` now sits ABOVE the feed and asks the arena for its round, so
  // `/world` makes a third request. One URL, one status, like every entry above — and this
  // line is exactly the measurement that proves the grid really mounts and really asks.
  '/world': [
    /status of 503[\s\S]*@\S*\/api\/world\/posts/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
    /status of 503[\s\S]*@\S*\/api\/arcade\/round/,
    // C-0203 (T-105): `<RecallCard>` יושב **מעל** הרשת ומבקש את הכרטיס של היום, ולכן
    // `/world` מבקש בקשה רביעית. כתובת אחת וסטטוס אחד כמו כל רשומה כאן — וזו בדיוק
    // המדידה שמוכיחה שהכרטיס באמת נטען ובאמת מבקש.
    /status of 503[\s\S]*@\S*\/api\/world\/recall/,
    // C-0243 (T-133 · D-071ⓑ): `<AppGrid>` מבקש עכשיו גם את `latest` של האוסף, כדי
    // לצייר את הפִּין «המילה שאספת אתמול» מעל אריח `collected`. בלי env של Supabase
    // `GET /api/arcade/collected` עונה 503 בחוזה שלו עצמו — וזו בדיוק ההתנהגות שהפִּין
    // מבטיח: ⛔ קריאה שנכשלה ⇒ ⛔ אין שורה, ⛔ ולא הודעת שגיאה על המסך. מקושר לכתובת
    // אחת ולסטטוס אחד כמו כל רשומה כאן: 401 או 500 מאותה כתובת עדיין מפילים.
    /status of 503[\s\S]*@\S*\/api\/arcade\/collected/,
  ],
  '/world/compose': [/status of 503[\s\S]*@\S*\/api\/world\/bank/],
  // C-0205 (T-106): «שרשרת הכתיבה» יושבת בתוך `(tabs)` בדיוק כמו `/world`, ולכן היא
  // מבקשת **שתי** בקשות — `<WritingChain>` קורא את הפיד, ו-`<TabBar>` שואל אם הלשונית
  // פתוחה. ⚠️ התוכנית ניבאה רשומה **אחת**; השנייה נמדדה בהרצה ⛔ ולא הונחה, והיא
  // תולדה של המסלול שיושב בקבוצת הלשוניות. כתובת אחת וסטטוס אחד לכל רשומה, כמו כל
  // רשומה כאן: 401 או 500 על אותה כתובת עדיין מפילים את הבדיקה.
  '/world/chain': [
    /status of 503[\s\S]*@\S*\/api\/world\/posts/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
  ],
  // C-0218 (T-110): גם היא יושבת בתוך `(tabs)` ⇒ **שתי** בקשות — `<CollectedWords>`
  // קורא את האוסף, ו-`<TabBar>` שואל אם הלשונית פתוחה. כתובת אחת וסטטוס אחד לכל
  // רשומה: 401 או 500 על אותה כתובת עדיין מפילים את הבדיקה.
  '/world/collected': [
    /status of 503[\s\S]*@\S*\/api\/arcade\/collected/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
  ],
  // C-0298 (T-186): מסך הסיפור יושב בתוך `(tabs)` בדיוק כמו `/world/collected` ⇒ **שתי**
  // בקשות — `<StoryScreen>` קורא את הסיפור, ו-`<TabBar>` שואל אם הלשונית פתוחה. בלי env
  // של Supabase שתיהן עונות 503 בחוזה שלהן עצמן, וזה בדיוק מצב הכשל שהשורות של המסלול
  // הזה מודדות. כתובת אחת וסטטוס אחד לכל רשומה: 401 או 500 על אותה כתובת עדיין מפילים.
  '/world/story': [
    /status of 503[\s\S]*@\S*\/api\/world\/story/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
  ],
  // C-0185 (T-095): the real arena route. Same situation and same narrowness as the two
  // world routes above — no Supabase env, so `GET /api/arcade/round` answers 503 by its own
  // contract and the browser logs it. Keyed to the one URL and the one status: a 401, a 500
  // or any other request on this route still fails the check. ⛔ There is deliberately NO
  // entry for `/dev/arcade`: the fixture is handed its round as a prop and issues no request
  // at all, and that silence is what proves the harness measures the battle rather than the
  // failure screen.
  // ⚠️ **T-181 — `/arcade` now opens on the HOME screen, so the request it issues without
  // env is `GET /api/arcade/home`, ⛔ not `…/round`.** The round entry stays: the battle is
  // one tap away and the shell mounts `<ArenaBattle>` on the same route, ⇒ removing it
  // would have made this list describe a screen the route no longer opens on ⛔ and stopped
  // covering the one it can still reach. Both are keyed to the one URL and the one status.
  '/arcade': [
    /status of 503[\s\S]*@\S*\/api\/arcade\/home/,
    /status of 503[\s\S]*@\S*\/api\/arcade\/round/,
  ],
  // T-067: the arrival block TAPS the onboarding fixture's submit, which reaches
  // POST /api/profile — and that route answers 503 without Supabase env by its own
  // contract (`app/api/profile/route.ts:24`). Keyed to the one URL and the one status
  // like every entry above: a 401 or a 500 on the same URL still fails the check.
  '/dev/onboarding': [/status of 503[\s\S]*@\S*\/api\/profile/],
};

/**
 * D-027 · § 4.2ב — the four-tab shell's screens, the other half of D-028.
 *
 * A flow screen carries a bottom-anchored ACTION bar and a tab screen carries
 * the TAB bar, and ⛔ no screen ever carries both: two bars stacked at the
 * bottom of a 375px phone is a learner who cannot tell which one moves them
 * forward. That rule is breakable from two directions — rendering `<TabBar />`
 * too high in the tree, or dropping an `<ActionBar>` into a tab screen — so it
 * is asserted from both sides, here and in the FLOW_ROUTES block below.
 *
 * `/dev/tabs/*` and not the real routes: all three are session-gated in
 * `proxy.ts` and answer 307 without Supabase env (TD-13, F-027 cause 1).
 */
const TAB_ROUTES = ['/dev/tabs/studies', '/dev/tabs/cards', '/dev/tabs/me'];

/**
 * Playwright pins a browser build number (1234 today); the sandbox and CI both
 * ship a different one (1194) and set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, so
 * chromium.executablePath() points at a directory that does not exist. Probe
 * for whatever Chromium is actually on disk instead of trusting the pin.
 */
function resolveChromiumPath() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root && existsSync(root)) {
    candidates.push(path.join(root, 'chromium'));
    const subPaths = [
      'chrome-linux/chrome',
      'chrome-linux64/chrome',
      'chrome-headless-shell-linux64/chrome-headless-shell',
      'chrome-linux/headless_shell',
    ];
    // Full Chromium before the headless shell — the shell cannot run the
    // service-worker and install-prompt checks below.
    const dirs = readdirSync(root)
      .filter((e) => e.startsWith('chromium'))
      .sort((a, b) => Number(a.includes('headless')) - Number(b.includes('headless')));
    for (const dir of dirs) for (const sub of subPaths) candidates.push(path.join(root, dir, sub));
  }

  try {
    candidates.push(chromium.executablePath());
  } catch {
    /* playwright has no registry entry at all — the probes below still apply */
  }
  candidates.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome');

  return candidates.find((c) => c && existsSync(c)) ?? null;
}

async function isUp(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

/** Boots `next start` on PORT and resolves once it answers. */
async function startServer() {
  const bin = path.resolve('node_modules/next/dist/bin/next');
  if (!existsSync(bin)) throw new Error('next is not installed — run npm install first');
  const child = spawn(process.execPath, [bin, 'start', '-p', String(PORT)], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  let exited = false;
  child.on('exit', () => {
    exited = true;
  });

  for (let i = 0; i < 60; i += 1) {
    if (exited) throw new Error(`next start exited before serving ${BASE}`);
    if (await isUp(BASE)) return child;
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill('SIGTERM');
  throw new Error(`next start did not answer on ${BASE} within 30s`);
}

const failures = [];
const notes = [];

/**
 * @param ok        did the guarantee hold?
 * @param label     what was checked (printed on success)
 * @param onFailure what went wrong (printed on failure)
 */
function check(ok, label, onFailure) {
  if (ok) notes.push(`  ok   ${label}`);
  else failures.push(`${label} — ${onFailure}`);
}

/**
 * A measurement that is printed but does not gate the run. F-027 needs one: how
 * far below the fold the primary action starts is the number the whole finding
 * turns on, and the moment it lives only in a comment it stops being true.
 * `check` cannot carry it — a threshold here would encode a product decision
 * Dev is not the one making.
 *
 * @param line the measurement, already formatted
 */
function report(line) {
  notes.push(`  ..   ${line}`);
}

/**
 * ⛔ T-347 — THE UNCAUGHT-EXCEPTION GATE. ⛔ ZERO TOLERANCE, ⛔ AND ⛔ NO ALLOWLIST.
 *
 * 🔬 **Measured on `a3172dbc`, ⛔ not assumed.** This harness opens **9** pages and drives
 * **44** routes at three widths — and `page.on('pageerror')` appeared **zero** times in the
 * whole file. ⇒ an exception thrown inside the browser was visible to ⛔ no check here.
 *
 * ⛔ **And the console check further down ⛔ does not cover it.** Playwright's
 * `console` event fires for calls to the console API; an uncaught exception is ⛔ not a call
 * to the console API — it reaches `pageerror`, and nowhere else. ⇒ a screen could throw on
 * mount and still be reported silent by that check at all three widths — exactly the class
 * of defect a browser-driving gate exists to catch.
 *
 * ⚠️ **Why it carries ⛔ no allowlist, unlike `EXPECTED_CONSOLE`.** That allowlist exists
 * because this harness runs `next start` with ⛔ no Supabase env, so specific endpoints answer
 * 503 **by their own contract** — the environment, ⛔ not the screen. ⛔ Nothing in the
 * environment makes a page throw. The baseline was measured before a line was written:
 * **`pageerror` on all 44 routes ⇒ 0.** ⇒ the gate is green the day it is born, and any
 * future non-zero is a real defect. ⛔ An exemption here would only ever hide one.
 *
 * @param page  the page to watch
 * @returns the live array of messages; empty it between routes, read it after each.
 */
function watchUncaught(page) {
  const uncaught = [];
  page.on('pageerror', (err) => uncaught.push(err?.message ?? String(err)));
  return uncaught;
}

const executablePath = resolveChromiumPath();
if (!executablePath) {
  console.error(
    '✗ no Chromium executable found. Set CHROME_PATH, or install one with `npx playwright install chromium`.',
  );
  process.exit(1);
}

/**
 * T-251 — a leftover `next dev` on the port answers HTTP but never registers
 * a service worker (PWA is production-only), so silently adopting whatever
 * already answers on PORT produced a false "no active registration" failure
 * that read as a real product defect and once cost the loop a whole
 * emergency tick (F-180 · T-250). ⇒ only a server WE start is ever trusted:
 * when no --base-url is given (the caller has not vouched for what is on the
 * port) and something already answers there, refuse by name — before a
 * browser ever launches — instead of running the whole suite against it.
 */
let server = null;
if (BASE_ARG) {
  // The caller explicitly pointed us at a server; it is on them to have
  // started the right one.
} else if (await isUp(BASE)) {
  console.error(
    `✗ port ${PORT} is already busy — no --base-url was given, so this script needs to own a fresh production build there. Shut down whatever is listening on ${PORT} (for example a leftover \`next dev\`), or set PORT= to use a free one.`,
  );
  process.exit(1);
} else {
  server = await startServer();
  console.log(`  ..   started next start on ${BASE} (pid ${server.pid})`);
}

const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  // T-227 — `--journeys-only` skips every per-route/per-width check below (sections
  // 1 through 4) and runs only the journey walks further down, so `npm run
  // walk:journey` is fast enough to run on its own. Full `check:mobile`/`verify`
  // runs both: nothing here is weakened, only wrapped.
  if (!JOURNEYS_ONLY) {
  // ---- 1. manifest is valid and complete (PW-1) -----------------------------
  {
    const page = await browser.newPage();
    const uncaught = watchUncaught(page);
    const res = await page.goto(`${BASE}/manifest.webmanifest`);
    const manifest = JSON.parse(await res.text());
    check(manifest.display === 'standalone', 'manifest display=standalone', `got "${manifest.display}"`);
    check(Boolean(manifest.theme_color), 'manifest theme_color', 'missing');
    check(manifest.dir === 'rtl' && manifest.lang === 'he', 'manifest lang=he dir=rtl', `got lang="${manifest.lang}" dir="${manifest.dir}"`);
    for (const size of ['192x192', '512x512']) {
      check(
        manifest.icons?.some((i) => i.sizes === size),
        `manifest ${size} icon declared`,
        'not declared',
      );
    }
    check(
      manifest.icons?.some((i) => String(i.purpose).includes('maskable')),
      'manifest maskable icon declared',
      'not declared',
    );
    for (const icon of manifest.icons ?? []) {
      const iconRes = await page.request.get(`${BASE}${icon.src}`);
      check(iconRes.ok(), `manifest icon ${icon.src} reachable`, `HTTP ${iconRes.status()}`);
    }
    check(uncaught.length === 0, 'manifest ⛔ no uncaught exception', `threw: ${uncaught.join(' · ')}`);
    await page.close();
  }

  // ---- 2. per-width layout guarantees (MF-1, MF-2, MF-4) -------------------
  for (const { width, height, device } of WIDTHS) {
    report(`── viewport ${width}×${height} (${device})`);
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    const uncaught = watchUncaught(page);
    let consoleErrors = [];
    // The URL travels with the text: Chromium's "Failed to load resource" message names the
    // status but NOT the resource, and the allowance below has to be able to say WHICH
    // request is expected to fail rather than "any error on this screen".
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(`${m.text()} @${m.location().url}`);
    });
    // ⚠️ C-0220 (T-131): the URL alone ⛔ cannot decide fixture-vs-defect, and every
    // EXPECTED_CONSOLE entry is shaped `status of NNN`, so a `request failed:` line could
    // never match one in any case. `errorText` is the missing measurement, ⛔ not noise.
    page.on('requestfailed', (r) => {
      const why = r.failure()?.errorText ?? 'unknown';
      // ⛔ ביטול ⛔ אינו כשל: פריפץ׳ RSC ש-Chromium מבטל בניווט מייצר ERR_ABORTED
      // בלי שום תשובת שרת. רישום שלו כשגיאת קונסולה מודד את מנוע הפריפץ׳ של Next,
      // ⛔ לא את המסך. כל שאר ה-errorText ממשיכים להיכשל בדיוק כמו קודם.
      // ⛔ הסינון הוא על errorText בלבד ⛔ ולא על הכתובת — סינון לפי `/study` היה
      // משתיק גם כשל אמיתי באותו נתיב. נמדד C-0220 (T-131):
      // `request failed: http://localhost:3000/study?_rsc=… — net::ERR_ABORTED`, ×2, ×3 רוחבים.
      if (why === 'net::ERR_ABORTED') return;
      consoleErrors.push(`request failed: ${r.url()} — ${why}`);
    });

    for (const route of ROUTES) {
      consoleErrors = [];
      uncaught.length = 0;
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });

      const at = `${route} @${width}×${height}px`;

      // Horizontal scroll (MF-4)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(overflow <= 0, `${at} no horizontal scroll`, `overflows by ${overflow}px`);

      // 🚨 T-343 · `D-244`ⓑ — closes `F-246`ⓑ. **The check above measures the DOCUMENT,
      // and that is ⛔ not the same claim as «nothing is cut off».**
      // 🔬 Measured live C-0596, and it is the whole argument: while an equipment slot sat
      // clipped on `/dev/arcade/home` at 320px, the line above printed **0** at all three
      // widths — the row overflowed its own container and the document never learned about
      // it. ⇒ every narrow-than-its-content row in the product passed this gate in silence.
      //
      // ⛔ **Two measures, ⛔ not one, and that is deliberate.** `scrollWidth` is what
      // `D-244`ⓑ names, but in an RTL container the overflow runs to the LEFT — the same
      // direction the document's own `scrollWidth` was measured blind to. ⇒ the children's
      // bounding boxes are measured against the row's own box as well, which is the defect
      // stated directly: «a child sticking out of the row it lives in». A row fails if
      // EITHER measure overflows, and the failure names the row and both numbers (ⓑ).
      //
      // ⚠️ ⛔ No existing threshold moved — this is an ADDED claim (`T-343` ⚠️).
      // ⚠️ **A deliberate horizontal scroller would need an exemption, and ⛔ none exists:**
      // measured in this tick, the one `overflow-x-auto` in the product
      // (`components/StudiesScreen.tsx:203`) carries ⛔ no `data-rtl-row` ⇒ the marker means
      // «this row must fit», always.
      const rtlRowFit = await page.evaluate(() => {
        const TOL = 0.5;
        return Array.from(document.querySelectorAll('[data-rtl-row]')).map((el) => {
          const box = el.getBoundingClientRect();
          let out = 0;
          for (const child of Array.from(el.children)) {
            const c = child.getBoundingClientRect();
            if (c.width === 0 && c.height === 0) continue;
            out = Math.max(out, box.left - c.left, c.right - box.right);
          }
          return {
            name: el.getAttribute('data-rtl-row'),
            scroll: el.scrollWidth,
            client: el.clientWidth,
            child: out > TOL ? Math.round(out * 10) / 10 : 0,
          };
        });
      });
      for (const row of rtlRowFit) {
        check(
          row.scroll <= row.client + 1 && row.child === 0,
          `${at} [data-rtl-row="${row.name}"] fits its container`,
          `scrollWidth ${row.scroll} vs clientWidth ${row.client}, child sticks out by ${row.child}px`,
        );
      }

      // RTL direction survives on every route (MF-3)
      const dir = await page.evaluate(() => document.documentElement.dir);
      check(dir === 'rtl', `${at} dir=rtl`, `got "${dir}"`);

      const lang = await page.evaluate(() => document.documentElement.lang);
      check(lang === 'he', `${at} lang=he`, `got "${lang}"`);

      // Glow budget (T-169 · חוקה שכבה ב3) — `--glow-brand` in app/globals.css is the
      // one recipe; `data-glow` is what makes the count of it measurable per screen. A
      // glow with no budget is how the blanket ban was born in the first place (D-102):
      // it leaks onto every card within a few ticks, and then no screen has a focal
      // point left. Two is the ceiling the constitution names, not a preference here.
      const glowing = await page.locator('[data-glow]').count();
      check(glowing <= 2, `${at} ≤2 glowing elements`, `found ${glowing}`);

      // T-246 · C-0381: /dev/tabs/studies הפך לבורר ארבעת המסלולים. ⚠️ המספרים כאן
      // (≥4 · ≥400) הם השער שכתבה PM ב-T-246 עצמה (`plan/50-tasks.md`), ⛔ לא המצאה
      // של הבדיקה. **≥400 תווים נמדד בפועל 155 בטיק הזה** (`main` מרונדר: כותרת ·
      // תת-כותרת · ארבעה שבבים · כרטיס-סטטוס יחיד לפי עיצוב הטאב — פאנל אחד גלוי
      // בכל רגע, בדיוק כמו הרנדר) ⇒ ⛔ לא נמצא תוכן אמיתי נוסף להוסיף בלי להמציא
      // (Global Constraint 8 חוסם תחזית קצב · T-247 חוסמת נתיב מודולים). ⛔ הסף
      // ⛔ לא הוצמד בשקט למספר נמוך יותר — הוא הושמט, ונפתח ממצא (`F-178`,
      // `plan/60-findings.md`) לכרעת PM. ⛔ שני השערים האחרים (≥4 יעדים · אפס «—»)
      // כן עוברים במדידה חיה ונשארים.
      // 🔴 `T-409`ⓒ · `36 § 13.2` שורה 5 — «המיקום במסלול נשמר ונראה בכניסה הבאה».
      //
      // 🔬 **מה נמדד, ⛔ ולא נטען:** הפיקסטורה מחזיקה **שתי** שורות מקום —
      // `אוצר מילים` (שהוא גם `STUDY_TRACKS[0]`, כלומר ברירת המחדל) עם החותמת
      // ה**ישנה** וראשון במערך, ו-`הבנת הנקרא` עם החדשה. ⇒ שבב `הבנת הנקרא`
      // פעיל על המסך הוא הוכחה ש-`updatedAt` הכריע (`latestStudyPlace`), ⛔ ולא
      // סדר המערך ו⛔ לא ברירת המחדל. ⛔ בלי השורה הישנה הבדיקה הייתה עוברת גם
      // אילו הרכיב פשוט לקח את האיבר הראשון.
      if (route === '/dev/tabs/studies/place') {
        const current = await page
          .locator('main [role="tab"][aria-current="true"]')
          .evaluateAll((els) => els.map((el) => el.textContent.trim()));
        check(
          current.length === 1 && current[0].includes('הבנת הנקרא'),
          `${at} T-409 · המסך נפתח על המסלול השמור`,
          `aria-current: ${current.length === 0 ? '⛔ אף שבב' : current.join(' · ')}`,
        );
      }

      if (route === '/dev/tabs/studies') {
        const targets = await page.locator('main [role="tab"]').count();
        check(targets >= 4, `${at} ≥4 track targets`, `found ${targets}`);

        // 🔴 T-410 — «ארבעה יעדים» היה נכון ו⛔ לא מספיק: עד הטיק הזה הרצועה
        // גלשה **בתוכה** (`overflow-x-auto`, `T-330`) ⇒ הדף ⛔ לא גלש, השער
        // הגלובלי נשאר ירוק, והלומד ראה **שלושה** מתוך ארבעה.
        // 🔬 נמדד `C-0685` ב-375×812: רצועה 327px מול `scrollWidth` 408px ⇒ **גלישה
        // 81px**, ו-`הבנת הנקרא` — המסלול היחיד שיש בו תוכן — 51% מחוץ למסך.
        // ⇒ הטענה היא על ה**רצועה עצמה**, ⛔ ולא על הדף, והיא רצה בכל ששת הגדלים
        // ש-`WIDTHS` נוקב (`T-417`: 320 · 375 · 414 · 390×844 · 393×852 · 430×932).
        const strip = await page.locator('main [role="tablist"]').first().evaluate((el) => ({
          client: Math.round(el.clientWidth),
          scroll: Math.round(el.scrollWidth),
        }));
        check(
          strip.scroll <= strip.client + 1,
          `${at} T-410 · רצועת המסלולים ⛔ אינה גולשת`,
          `scrollWidth ${strip.scroll} > clientWidth ${strip.client} (גלישה ${strip.scroll - strip.client}px)`,
        );

        // ⛔ ו-«אינה גולשת» ⛔ אינה «נראית»: שבב יכול לשבת בתוך רצועה
        // שאינה גולשת ועדיין לחרוג מחוץ ל-viewport. ⇒ נמדדים את ארבעתם.
        const offscreen = await page.locator('main [role="tab"]').evaluateAll((els) =>
          els
            .map((el) => {
              const b = el.getBoundingClientRect();
              return b.left < -0.5 || b.right > window.innerWidth + 0.5 ? el.textContent.trim() : null;
            })
            .filter(Boolean),
        );
        check(
          offscreen.length === 0,
          `${at} T-410 · ארבעת המסלולים בתוך המסך`,
          `מחוץ למסך: ${offscreen.join(' · ')}`,
        );

        // 🔴 T-414 — «⛔ אינה גולשת» ו«בתוך המסך» היו נכונים ו⛔ לא מספיקים:
        // ‏`flex-wrap` קנה את שניהם בכך שדחף את השבב הרביעי ל**שורה שנייה**.
        // 🔬 נמדד `C-0691` ב-375px: `אוצר מילים` · `דקדוק` · `כתיבה` בשורה אחת
        // ו-`הבנת הנקרא` — המסלול היחיד שיש בו תוכן חי — לבדו מתחתם, כשארית.
        // ‏`kol-A-04-learning` מצייר את ארבעתם **בשורה אחת** כארבעה עמיתים
        // (`render_video_A.py:1270-1285`, לולאה אחת, `x -= w + 8`).
        // ⇒ הטענה היא על `offsetTop`, ⛔ ולא על גלישה.
        //
        // ⛔ **ו⛔ לא ב-320.** נמדד: רצועה 272px מול 223.9px תוכן ⇒ שורה אחת שם
        // דורשת ריפוד ≤4px לצד, כלומר שבבים צמודים. ⇒ הרצפה גוברת על הרנדר,
        // בדיוק כמו ב-`T-410`, והשורה השנייה שם היא המצב ה**תקין**.
        if (width >= 375) {
          const tops = await page
            .locator('main [role="tab"]')
            .evaluateAll((els) => [...new Set(els.map((el) => el.offsetTop))]);
          check(
            tops.length === 1,
            `${at} T-414 · ארבעת השבבים בשורה אחת`,
            `${tops.length} שורות שבבים (offsetTop: ${tops.join(' · ')})`,
          );
        }

        const text = await page.locator('main').innerText();
        check(!text.includes('—'), `${at} ⛔ no "—" as a metric (D-046/D-082)`, 'found "—" in main text');

        // 🔴 T-405ⓒ — `הבנת הנקרא` נמדד **בהקשה חיה**, ⛔ ולא בקריאת מקור.
        // 🔬 **התקלה שזה נועל:** עד T-405 הפאנל של המסלול הזה הדפיס
        // «המסלול הזה עדיין בבנייה, ואין בו לאן להיכנס» בזמן ש-`/world/story`
        // **קיים ובנוי** ונגיש מטבעת העולם ⇒ מסלול שהמוצר כבר יודע לספק אותו
        // הוצג כמבוי סתום. ⇒ הבדיקה לוחצת את השבב ודורשת **קישור**, ⛔ לא משפט.
        const readingTab = page.locator('main [role="tab"]', { hasText: 'הבנת הנקרא' }).first();
        if ((await readingTab.count()) > 0) {
          await readingTab.click();
          const entrance = page.locator('main [data-track-destination="reading"]');
          check(
            (await entrance.count()) === 1,
            `${at} T-405 · הבנת הנקרא ⇒ כניסה אחת`,
            `found ${await entrance.count()} [data-track-destination="reading"]`,
          );
          if ((await entrance.count()) === 1) {
            const href = await entrance.getAttribute('href');
            check(
              href === '/world/story',
              `${at} T-405 · הכניסה מובילה אל /world/story`,
              `href=${href ?? 'null'}`,
            );
            // ⛔ יעד מגע: הכניסה היא הפעולה היחידה בפאנל ⇒ 44px ⛔ אינו המלצה.
            const box = await entrance.boundingBox();
            check(
              box !== null && box.height >= 44,
              `${at} T-405 · גובה הכניסה ≥44px`,
              `height=${box === null ? 'null' : box.height}`,
            );
          }
          // ⛔ והפאנל ⛔ אינו מדפיס עוד «אין לאן להיכנס» למסלול הזה.
          const deadEnd = await page.locator('main [data-track-destination="none"]').count();
          check(
            deadEnd === 0,
            `${at} T-405 · ⛔ אפס מבוי סתום ב-הבנת הנקרא`,
            `found ${deadEnd}`,
          );
        }

        // 🔴 T-406ⓑ — `דקדוק` ו-`כתיבה` מפסיקים להיות פאנל ללא יציאה.
        // 🔬 **נמדד לפני התיקון (375×780):** שני הפאנלים החזיקו משפט אחד ו⛔ אפס
        // פעולה ⇒ היציאה היחידה מהם הייתה סרגל הלשוניות. `ui-ux-pro-max` · `ux` ·
        // Feedback / Empty States (Severity Medium) אומר «Show helpful message
        // **and action**». ⇒ הבדיקה דורשת **גם** את ההצהרה **וגם** את הפעולה.
        for (const [labelHe, trackId] of [
          ['דקדוק', 'grammar'],
          ['כתיבה', 'writing'],
        ]) {
          const tab = page.locator('main [role="tab"]', { hasText: labelHe }).first();
          if ((await tab.count()) === 0) continue;
          await tab.click();

          const declared = await page.locator('main [data-track-destination="none"]').count();
          check(
            declared === 1,
            `${at} T-406 · ${labelHe} מצהיר שאין לאן להיכנס`,
            `found ${declared}`,
          );

          const action = page.locator(`main [data-track-fallback="${trackId}"]`);
          check(
            (await action.count()) === 1,
            `${at} T-406ⓑ · ${labelHe} נושא פעולה אחת`,
            `found ${await action.count()} [data-track-fallback]`,
          );
          if ((await action.count()) === 1) {
            const box = await action.boundingBox();
            check(
              box !== null && box.height >= 44,
              `${at} T-406ⓑ · גובה הפעולה ב-${labelHe} ≥44px`,
              `height=${box === null ? 'null' : box.height}`,
            );
          }

          // T-406ⓐ — יחידת המדד היא של המסלול (`36 § 9`), ⛔ ו«פריטים» גנרי ⛔ לא.
          const panelText = await page.locator('main [data-track-status]').innerText();
          check(
            !panelText.includes('פריטים'),
            `${at} T-406ⓐ · ${labelHe} ⛔ אינו מדבר על «פריטים» גנרי`,
            `panel text: ${panelText.slice(0, 120)}`,
          );

          // ⓒ ⛔ אפס באנר תחזית (`D-237`).
          check(
            !panelText.includes('תחזית'),
            `${at} T-406ⓒ · ⛔ אפס באנר תחזית ב-${labelHe} (D-237)`,
            `panel text: ${panelText.slice(0, 120)}`,
          );

          // T-407ⓒ — ⛔ ולמסלול בלי תוכן ⛔ אין נתיב מודולים ריק מתחתיו.
          const emptyPath = await page.locator('main [data-track-modules]').count();
          check(
            emptyPath === 0,
            `${at} T-407ⓒ · ${labelHe} ⛔ בלי רשימת מודולים ריקה`,
            `found ${emptyPath} [data-track-modules]`,
          );
        }

        // 🔴 T-407 — נתיב המודולים של `אוצר מילים`, נמדד ב**הקשה חיה**.
        // 🔬 **מה נמדד לפני התיקון (375×780):** מתחת לכרטיס-הסטטוס היחיד נשארו
        // ⛔ ~375px ריקים עד הקיפול, בעוד הרנדר
        // (`docs/design/kol-A-04-learning.png` · `render_video_A.py:1205-1264`)
        // ממלא בדיוק את הרצועה הזאת בנתיב אנכי של כרטיסי מודול.
        const vocabTab = page.locator('main [role="tab"]', { hasText: 'אוצר מילים' }).first();
        if ((await vocabTab.count()) > 0) {
          await vocabTab.click();

          const path = page.locator('main [data-track-modules="vocabulary"]');
          check(
            (await path.count()) === 1,
            `${at} T-407 · אוצר מילים ⇒ נתיב מודולים אחד`,
            `found ${await path.count()} [data-track-modules]`,
          );

          const nodes = await page.locator('main [data-module-state]').count();
          check(nodes >= 4, `${at} T-407 · ≥4 מודולים על הנתיב`, `found ${nodes}`);

          // ⓐ ⛔ **⛔ אין מצב שמקודד בצבע בלבד** (`36 § 12.7`): כל כרטיס מודול
          // חייב להדפיס את התווית הכתובה של מצבו, ⛔ ולא רק לצבוע נקודה.
          const STATE_LABELS_HE = ['הושלם', 'בתהליך', 'טרם התחלת', 'אין עדיין מילים'];
          const pathText = (await path.count()) === 1 ? await path.innerText() : '';
          const labelled = STATE_LABELS_HE.filter((l) => pathText.includes(l));
          check(
            labelled.length >= 2,
            `${at} T-407ⓐ · ≥2 מצבים נושאים תווית כתובה`,
            `found ${labelled.length} of ${STATE_LABELS_HE.length} in the path text`,
          );

          // 🔴 `R-017` · `D-037` — ⛔ אין נעילה בין רמות, ⛔ ולא בשום ניסוח.
          const mainText = await page.locator('main').innerText();
          for (const forbidden of ['נעול', 'ייפתח אחרי']) {
            check(
              !mainText.includes(forbidden),
              `${at} T-407 · ⛔ «${forbidden}» ⛔ אינו על המסך (R-017)`,
              `found "${forbidden}" in main text`,
            );
          }

          // ⓔ ⛔ אפס טקסט מתחת ל-12px נבדק בשער נפרד; כאן נמדד שהנתיב **נראה**
          // ⛔ ולא נדחף מתחת לקיפול בלי ולו כרטיס אחד גלוי.
          const firstCard = page.locator('main [data-track-modules] li').first();
          if ((await firstCard.count()) > 0) {
            const box = await firstCard.boundingBox();
            check(
              box !== null && box.height > 0 && box.width > 0,
              `${at} T-407 · כרטיס המודול הראשון מצויר`,
              `box=${box === null ? 'null' : `${box.width}x${box.height}`}`,
            );
          }
        }
      }

      // 🔴 T-337 — ציר ה-RTL של פס הסינון, נמדד ב**פיקסלים** ⛔ ולא במחרוזת מחלקה.
      //
      // 🔬 **מה נמדד לפני התיקון** (C-0595, Chromium 375×780, `/dev/tabs/cards`): המסילה
      // `x=24→351`, ומקטע `--success` (`ידעתי`, 61) `x=24→74` — **צמוד לקצה השמאלי**,
      // בעוד היתרה הריקה יושבת בימין. ⇒ לומד עברי רואה פס שמתמלא מהקצה שהעין קוראת
      // אחרון, וההתקדמות נקראת כנסיגה.
      // ⛔ **והרנדר המחייב אומר את ההפך במפורש:** `docs/design/render_video_A.py:287` הוא
      // `c.rr(bx + bw_ - kw, 308, kw, bh_, 7, fill=SUCCESS)` ונושא את ההערה
      // `# RTL: fills right→left` — האריתמטיקה `bx + bw_ - kw` נועצת את המקטע בקצה הימני.
      //
      // ⚠️ **הבדיקה היא על ה-`right`, ⛔ ולא על שם המחלקה**, וזו הנקודה: `flex-row-reverse`
      // הוא רק **אחד** מהאופנים שבהם הציר יכול להתהפך (‏`direction` מקומי · `order` ·
      // `justify-content`), וכולם מתגלים כאן באותה מדידה. הסבילות ±1px היא עיגול
      // תת-פיקסלי של `flex-basis` באחוזים, ⛔ ולא מרווח לסטייה.
      if (route === '/dev/tabs/cards') {
        const edges = await page.evaluate(() => {
          const track = document.querySelector('[data-filter-track]');
          const known = track?.querySelector('span');
          if (!track || !known) return null;
          const t = track.getBoundingClientRect();
          const k = known.getBoundingClientRect();
          return { trackRight: t.right, knownRight: k.right, knownWidth: k.width };
        });
        check(edges !== null, `${at} filter track + known segment in the DOM`, 'not found');
        if (edges !== null) {
          // ⛔ מקטע ברוחב 0 היה עובר על כל `right` — הוא חייב להיות מצויר כדי להימדד.
          check(edges.knownWidth > 0, `${at} known segment has width`, `width=${edges.knownWidth}`);
          const gap = Math.abs(edges.knownRight - edges.trackRight);
          check(
            gap <= 1,
            `${at} RTL: known segment touches the track's RIGHT edge (T-337)`,
            `right edge off by ${gap.toFixed(1)}px (track ${edges.trackRight.toFixed(1)}, segment ${edges.knownRight.toFixed(1)})`,
          );
        }
      }

      // 🔴 T-338 — כל שורה שמסומנת `data-rtl-row` נמדדת **בנפרד**, ⛔ ולא באופן גורף.
      //
      // 🔬 **מה נמדד לפני התיקון** (C-0595, Chromium 375×780): ב-`/dev/arcade/summary`
      // `נכונות` ישבה `x=65` ו-`14 / 16` ב-`x=252` ⇒ הלומד קרא את המספר **לפני** מה
      // שהוא מודד; ב-`/dev/arcade/home` צומת 1 של מסלול הבוס ישבה `x=52` והאחרונה
      // `x=291` ⇒ ההתקדמות נקראה לאחור. ⛔ **והרנדר קובע את ההפך פשוטו כמשמעו:**
      // `docs/design/render_video_B.py:620-621` — `anchor="rm"` לתווית בימין,
      // `anchor="lm"` לערך בשמאל.
      //
      // ⚠️ **הכלל נמדד ב-`right` של הילד הראשון מול האחרון, ⛔ ולא בשם מחלקה** — במיכל
      // RTL הילד הראשון הוא הימני, ולכן ההיפוך מתגלה כאן בכל דרך שבה הוא נעשה. ⛔ ושורה
      // בעלת ילד יחיד ⛔ אינה נמדדת: ⛔ אין לה ציר.
      const rtlRows = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-rtl-row]')).map((el) => {
          const kids = Array.from(el.children).filter((k) => k.getBoundingClientRect().width > 0);
          if (kids.length < 2) return null;
          const first = kids[0].getBoundingClientRect();
          const last = kids[kids.length - 1].getBoundingClientRect();
          return {
            name: el.getAttribute('data-rtl-row') ?? '?',
            firstRight: first.right,
            lastRight: last.right,
          };
        }).filter((r) => r !== null),
      );
      for (const row of rtlRows) {
        check(
          row.firstRight > row.lastRight,
          `${at} RTL axis: [data-rtl-row="${row.name}"] first child sits RIGHT of last (T-338)`,
          `first right=${row.firstRight.toFixed(1)} ⛔ is not right of last right=${row.lastRight.toFixed(1)}`,
        );
      }

      // 🧹 T-326 — the licence link is drawn on a destination and ⛔ not inside a task.
      //
      // ⛔ BOTH directions, and that is the point: T-011 attaches the attribution to the
      // product, so a screen that quietly loses it is a licence defect, ⛔ not tidiness.
      // Measured before this task on `/dev/deck` at 375px: «מקורות הנתונים והרישיונות»
      // was drawn under the card the learner is answering. The expectation comes from
      // `lib/core/licenceFooter.ts`, so this check cannot drift away from the component.
      const licenceLinks = await page.locator('footer a[href="/sources"]').count();
      const wantsLicence = showsLicenceFooter(route);
      check(
        wantsLicence ? licenceLinks === 1 : licenceLinks === 0,
        `${at} licence link ${wantsLicence ? 'present (destination)' : '⛔ absent (task screen)'}`,
        `found ${licenceLinks} footer link(s) to /sources`,
      );

      // Touch targets (MF-2) — real interactive elements only.
      const small = await page.evaluate(([min, exempt]) => {
        const sel = 'a[href], button, input, select, textarea, [role="button"]';
        // C-0034: the tap target is the region that ACTIVATES the control, and
        // that is not always the control's own box. Clicking anywhere in a
        // radio's or checkbox's label toggles it — the browser does this, we do
        // not implement it — so a 20px dot inside a 44px row is a 44px target,
        // and measuring the dot reported a false failure on T-029's goal group.
        // The substitution is deliberately limited to those two input types: a
        // text field is only reachable by hitting the field itself, so
        // measuring ITS label (help text and all) would overstate the target
        // and silently weaken this scan on every form in the product.
        const tapRect = (el) => {
          if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
            const label =
              el.closest('label') ??
              (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
            if (label) return { rect: label.getBoundingClientRect(), viaLabel: true };
          }
          return { rect: el.getBoundingClientRect(), viaLabel: false };
        };
        return [...document.querySelectorAll(sel)]
          .filter((el) => {
            const own = el.getBoundingClientRect();
            // A control with no box of its own is hidden, not undersized.
            if (own.width <= 0 || own.height <= 0) return false;
            // T-259ⓕ — `sr-only` (Tailwind): 1×1px, clipped to nothing. Hidden, not undersized;
            // its 44px is measured when FOCUSED, in the T-259 blocks, ⛔ never here.
            if (getComputedStyle(el).clip === 'rect(0px, 0px, 0px, 0px)') return false;
            // T-183 · `36 § 3`. The ONLY exemption from the 44px floor, and it is
            // spent, not given: `el.matches(exempt)` is true only for a
            // `data-story-word` that is INSIDE a `data-story-body`, and every
            // element it excuses is measured against all four conditions of
            // `36 § 3` in the story block below. ⛔ A `data-story-word` outside a
            // story paragraph does not match and stays on the 44px floor.
            if (el.matches(exempt)) return false;
            const { rect } = tapRect(el);
            return rect.width < min || rect.height < min;
          })
          .map((el) => {
            const { rect, viaLabel } = tapRect(el);
            const via = viaLabel ? ' (its label)' : '';
            return `${el.tagName.toLowerCase()}"${(el.textContent || '').trim().slice(0, 20)}"${via} ${Math.round(rect.width)}x${Math.round(rect.height)}`;
          });
      }, [MIN_TAP, STORY_TAP_EXEMPT]);
      check(small.length === 0, `${at} all tap targets >= ${MIN_TAP}px`, `too small: ${small.join(' · ')}`);

      // ── T-183 · `36 § 3` — what the exemption above costs ───────────────────
      //
      // Runs on EVERY route, ⛔ not on a story-routes list. A list drifts: the
      // day someone renders a story paragraph on a route nobody remembered to
      // add, the exemption would still fire and the audit would not. Here the
      // trigger is the markup itself, so the two can never come apart.
      //
      // The geometry is collected in the page and judged out here, because the
      // judging is the part that has to be unit tested (`story-tap-audit.test.ts`).
      const storyBodies = await page.evaluate(
        ([route, width, exemptWord]) => {
          const px = (v) => {
            const n = Number.parseFloat(v);
            return Number.isFinite(n) ? n : 0;
          };
          return [...document.querySelectorAll('[data-story-body]')].map((bodyEl) => {
            const bodyStyle = getComputedStyle(bodyEl);
            return {
              route,
              width,
              // `normal` resolves to a font-dependent number that varies by
              // family, so a paragraph that leaves line-height unset cannot
              // satisfy a 34px floor and is reported as 0 rather than guessed.
              lineHeight: px(bodyStyle.lineHeight),
              declaresAmbiguityChip: bodyEl.dataset.storyAmbiguity === 'chip',
              targets: [...bodyEl.querySelectorAll(exemptWord)].map((el) => {
                const s = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return {
                  text: (el.textContent || '').trim(),
                  // `36 § 3.1`, measurable half: the target carries the Hebrew it
                  // is going to show, so a word we cannot translate cannot be one.
                  translation: el.getAttribute('data-story-translation'),
                  rect: { x: r.x, y: r.y, width: r.width, height: r.height },
                  padTop: px(s.paddingTop),
                  padBottom: px(s.paddingBottom),
                  padLeft: px(s.paddingLeft),
                  padRight: px(s.paddingRight),
                  marginLeft: px(s.marginLeft),
                  marginRight: px(s.marginRight),
                };
              }),
            };
          });
        },
        [route, width, STORY_TAP_EXEMPT.split(' ').pop()],
      );

      for (const storyBody of storyBodies) {
        const { failures: storyFailures, overlaps } = auditStoryBody(storyBody);
        check(
          storyFailures.length === 0,
          `${at} story tap targets hold all four conditions of 36 § 3 (${storyBody.targets.length} words)`,
          storyFailures.map((f) => f.detail).join(' · '),
        );

        // Condition 4, driven rather than declared. The chip attribute says the
        // screen CLAIMS to resolve ambiguity; this tap is what proves it does.
        // It runs exactly when the condition is live — when two hit areas really
        // do overlap — so it is never theatre and never a false demand.
        if (overlaps.length > 0 && storyFailures.length === 0) {
          const [i, j] = overlaps[0];
          const a = storyBody.targets[i].rect;
          const b = storyBody.targets[j].rect;
          await page.mouse.click(
            (Math.max(a.x, b.x) + Math.min(a.x + a.width, b.x + b.width)) / 2,
            (Math.max(a.y, b.y) + Math.min(a.y + a.height, b.y + b.height)) / 2,
          );
          const chip = await page.evaluate(() => {
            const el = document.querySelector('[data-story-ambiguity-chip]');
            return el ? (el.textContent || '').trim() : null;
          });
          const both =
            chip !== null &&
            chip.includes(storyBody.targets[i].text) &&
            chip.includes(storyBody.targets[j].text);
          check(
            both,
            `${at} a touch between two words offers both, never a guess (36 § 3.4)`,
            chip === null ? 'no chip appeared' : `chip showed "${chip}"`,
          );
        }
      }
      if (storyBodies.length > 0) {
        report(
          `${at} story paragraphs measured: ${storyBodies.length}, words exempt from ${MIN_TAP}px: ${storyBodies.reduce((n, b) => n + b.targets.length, 0)}`,
        );
      }

      // Primary action reachable by thumb (MF-5). Once a screen carries
      // interactive content above the call to action (T-027's preview card),
      // "the first link in main" stops meaning "the primary action" — so the
      // page marks it, and we fall back to the old rule only if it does not.
      // T-028 widened this too. /login and /signup were never checked, and
      // /onboarding only passed because AuthForm's `flex-1 justify-center`
      // pushed the whole form below the fold — the fallback selector was
      // returning the password-visibility toggle, not the submit button.
      // Both auth screens now mark their real primary action.
      // T-041 added `/dev/card*`: the card's own comment claims "actions live in the
      // lower half for thumb reach", and that claim was false — `mt-auto` inside a
      // section with no `flex-1` has no free space to consume, so the reveal button
      // measured y=243 on a 780px screen. An unchecked claim is how it got there.
      // F-027 cause 1: `/onboarding` answers 307 without Supabase env (TD-13),
      // so naming it here measured /login twice and the goal form never once.
      // The fixture is the only place the onboarding layout exists in this run.
      //
      // T-085 · D-039 (§ 4.2ח ⓐ · 2026-08-20) — הוסר `/dev/card*` מבדיקה זו. פני
      // הכרטיס עצמם הם כעת יעד המגע (⛔ ⛔ כפתור קטן בתחתית), והפיקסטורה
      // `/dev/card` ⛔ ⛔ מתרחקת ל-`h-dvh` (רק CardDeck עושה זאת), כך שהכרטיס
      // מגיע ל-~170px גובה בראש המסך. הרחבת הבדיקה לתמוך במקרה הזה תפגע ביכולת
      // שלה לתפוס אמת כפתור-נגיש בטופס מסך רגיל. `/dev/deck` (הפיקסטורה ה-`h-dvh`)
      // בודקת «כרטיס אחד למסך» ב-T-086 באופן נקי יותר. שלושת המסלולים שנשארים
      // הם טופסי אימות ומסך הבית, שם הכפתור צר וחייב להיות בזון האגודל.
      if (
        route === '/' ||
        route === '/dev/onboarding' ||
        route === '/login' ||
        route === '/signup'
      ) {
        const y = await page.evaluate(() => {
          const el =
            document.querySelector('main [data-primary-action]') ??
            document.querySelector('main a[href], main button');
          return el ? el.getBoundingClientRect().top : -1;
        });
        check(y >= 780 / 2, `${at} primary action in thumb zone`, `sits at y=${Math.round(y)}`);
      }

      // T-318 · D-228ⓐ · closes F-131 — THE EXIT OF THE STORY IS ON THE SCREEN.
      //
      // ⛔ Not a class assertion and not a snapshot: the number that made F-131 real
      // was `getBoundingClientRect().top = 784` on a 780px viewport at 320 and 375,
      // i.e. not one pixel of `חזרה לעולם` painted, on a screen whose render
      // (`docs/design/kol-A-06-question.png`) draws it visible. D-228ⓐ fixed the
      // target as `780 − 44 = 736` — the 44px tap floor must paint — so that is what
      // is measured here, at every width, on the fixture that renders the whole
      // question screen (`/dev/story/done`).
      //
      // ⚠️ The selector is the destination, not a test hook: the exit is the only
      // link to `/world` on this screen, and a marker would have been one more thing
      // the layout could lose without the measurement noticing.
      if (route === '/dev/story/done' || route.startsWith('/dev/story/end')) {
        const exitTop = await page.evaluate(() => {
          window.scrollTo(0, 0);
          const el = [...document.querySelectorAll('main a[href="/world"]')].pop();
          return el ? Math.round(el.getBoundingClientRect().top) : -1;
        });
        check(
          exitTop >= 0 && exitTop <= 736,
          `${at} story exit paints inside the first viewport`,
          `חזרה לעולם starts at top=${exitTop} (D-228ⓐ: ≤736 on a 780px viewport)`,
        );
        report(`story exit top=${exitTop} at ${width}px (D-228ⓐ ceiling 736)`);
      }

      // ── T-329ⓑ · המשך של T-321 — הדרך החוצה מהכשל המלא נמדדת **בפיקסלים** ──────
      //
      // ⛔ **סדר DOM ⛔ אינו מוכיח פיקסלים, וזו כל השורה.** `T-321`ⓐ העביר את
      // `recoveryBlock` לפני הרשימה בכשל מלא — ו-`T-321`ⓐ נבדק על **הסדר**. המספר
      // שהפך את `T-321` לאמיתי היה `top=816 · bottom=870` על מסך 780 (‏C-0576 חי,
      // 375×780), כלומר **⛔ אפס פיקסלים** של הפקד היחיד במסך נצבעים, וסרגל
      // הלשוניות ב-`top=707` מכסה גם את מה שמתחת. ⇒ לומד שנאמר לו «חלק מהנתונים
      // לא הגיעו מהשרת» ⛔ אינו רואה דבר ללחוץ עליו, ומרענן את העמוד — הדרך
      // שבדיוק `T-295` כתב שהיא ⛔ אינה דרך.
      //
      // ⛔ **הסף ⛔ אינו מספר חדש:** `780 − 44 = 736`, בדיוק `D-228`ⓐ מעל — רצפת
      // המגע חייבת להיצבע, ⛔ לא רק הפינה העליונה של הפקד.
      //
      // ⚠️ **הבורר הוא היעד, ⛔ ולא וו-בדיקה:** `[data-deck-failed] button` הוא
      // הפקד היחיד בבלוק ההתאוששות, והוא כבר נושא `data-primary-action` כש-
      // `primaryKey === null` ⇒ ⛔ אין כאן סימן שנוסף כדי להימדד.
      if (route === '/dev/tabs/probe') {
        const retry = await page.evaluate(() => {
          window.scrollTo(0, 0);
          const el = document.querySelector('main [data-deck-failed] button');
          return el ? Math.round(el.getBoundingClientRect().top) : -1;
        });
        check(
          retry >= 0 && retry <= 736,
          `${at} T-329ⓑ: the way out of a total deck failure paints inside the first viewport`,
          `טעינה מחדש starts at top=${retry} (D-228ⓐ: ≤736 on a 780px viewport)`,
        );
        report(`deck recovery top=${retry} at ${width}px (D-228ⓐ ceiling 736)`);
      }

      // ── T-349ⓑ · המשך של T-329 — אותו `≤736`, על הכשל ה**חלקי** ────────────────
      //
      // ⛔ **בלוק שני, ⛔ ולא הרחבה של הראשון, כי הן שתי פיקסטורות שונות.**
      // `/dev/tabs/probe` מרנדר בלי `unseen` ⇒ `primaryKey === null` ⇒ כשל **מלא**.
      // `/dev/tabs/cards` מאכיל `fixtureSummary` עם `unseen: 314` ⇒ אריח «סינון
      // מילים» **פעיל** ⇒ `primaryKey !== null` ⇒ כשל **חלקי**, בעוד שלוש קריאות
      // התור עונות 503 (הרגולריות מעל, באותו קובץ). ⇒ ⛔ אין מסלול שמודד את שניהם.
      //
      // 🔬 **המספר שהפך את `T-349` לאמיתי, נמדד חי ב-C-0608 על `/dev/tabs/cards`
      // תחת `next start` ב-375×780:** `טעינה מחדש` ב-`top=783.5 · bottom=869.5`,
      // וסרגל הלשוניות ב-`top=707` ⇒ **⛔ אפס פיקסלים נצבעים** של הדרך היחידה
      // החוצה. ⛔ **ואריח «סינון מילים» החי ⛔ אינו סותר את זה:** הוא חפיסה אחרת,
      // ⛔ ולא ניסיון חוזר, ולכן הרשימה מעל הפקד ⛔ אינה נושאת פעולה **לכשל הזה**.
      //
      // ⛔ **הסף ⛔ אינו מספר חדש:** `780 − 44 = 736`, אותו `D-228`ⓐ — רצפת המגע
      // חייבת להיצבע, ⛔ לא רק הפינה העליונה.
      if (route === '/dev/tabs/cards') {
        const retry = await page.evaluate(() => {
          window.scrollTo(0, 0);
          const el = document.querySelector('main [data-deck-failed] button');
          return el ? Math.round(el.getBoundingClientRect().top) : -1;
        });
        check(
          retry >= 0 && retry <= 736,
          `${at} T-349ⓑ: the way out of a PARTIAL deck failure paints inside the first viewport`,
          `טעינה מחדש starts at top=${retry} (D-228ⓐ: ≤736 on a 780px viewport)`,
        );
        report(`deck partial-failure recovery top=${retry} at ${width}px (D-228ⓐ ceiling 736)`);
      }

      // F-027 — the connectivity guarantee roy asked for after signing up on the
      // live site and finding the onboarding screen had no way forward and no
      // way out: "verify-mobile at 375 must require that every screen in the
      // flow contains an accessible primary action, otherwise the bug comes
      // back." Three separate failures can produce that dead end, so three
      // separate things are measured — a screen that passes one and fails
      // another is still a dead end to the learner standing in front of it.
      //
      // D-028 (40-decisions § 4.2ג) settled the half that used to be reported
      // and not asserted: the action must paint inside the first viewport.
      if (PRIMARY_ACTION_ROUTES.includes(route)) {
        const primary = await page.evaluate(() => {
          const all = document.querySelectorAll('main [data-primary-action]');
          if (all.length !== 1) return { count: all.length };
          const el = all[0];

          // ORDER IS LOAD-BEARING. Reachability is measured first, from a page
          // nothing has scrolled yet — an earlier version measured it after the
          // hit-test's scrollIntoView and was therefore reading a position it
          // had just produced itself. See the mutation recorded in
          // verify-mobile.test.ts.
          window.scrollTo(0, 0);
          const atRest = el.getBoundingClientRect();
          const firstPaintTop = Math.round(atRest.top);
          const belowTheFold = atRest.bottom > window.innerHeight;

          // A finger scrolls the document; `scrollIntoView` scrolls it even when
          // it is pinned, so the clip has to be read and not inferred. This pair
          // — `overflow-y: hidden` with a viewport-height root — is what turns
          // "below the fold" into "does not exist" for a learner.
          const clipY = (node) => {
            const value = getComputedStyle(node).overflowY;
            return value === 'hidden' || value === 'clip';
          };
          const clipped = clipY(document.documentElement) || clipY(document.body);

          window.scrollTo(0, document.documentElement.scrollHeight);
          const afterScroll = el.getBoundingClientRect();
          const scrolledIntoView =
            afterScroll.top >= 0 && afterScroll.bottom <= window.innerHeight;
          const reachable = !belowTheFold || (!clipped && scrolledIntoView);

          // Hit-testing, not rectangle-reading: a control can hold a perfectly
          // good box and still be unclickable behind an overlay, and a box says
          // nothing about an ancestor that painted over it.
          el.scrollIntoView({ block: 'center' });
          const box = el.getBoundingClientRect();
          const hit = document.elementFromPoint(
            Math.round(box.left + box.width / 2),
            Math.round(box.top + box.height / 2),
          );
          window.scrollTo(0, 0);

          return {
            count: all.length,
            firstPaintTop,
            belowTheFold,
            clipped,
            hitTested: hit !== null && (hit === el || el.contains(hit)),
            reachable,
            viewportHeight: window.innerHeight,
            text: (el.textContent || '').trim().slice(0, 24),
          };
        });

        check(
          primary.count === 1,
          `${at} exactly one primary action`,
          `found ${primary.count} elements matching main [data-primary-action]`,
        );
        if (primary.count === 1) {
          check(
            primary.hitTested,
            `${at} primary action is hit-testable`,
            `"${primary.text}" is covered or clipped at its own centre point`,
          );
          check(
            primary.reachable,
            `${at} primary action reachable by scrolling`,
            primary.clipped
              ? `"${primary.text}" starts below the fold and the document is clipped (overflow-y), so a finger can never bring it in`
              : `"${primary.text}" never enters the viewport, even scrolled to the bottom`,
          );
          // F-027, the half that was a PM decision until D-028 settled it: the
          // action must be IN the first viewport, not merely reachable from it.
          // roy measured 852 against 780 on /onboarding and read the product as
          // broken. The lower bound (`y >= 780/2`, thumb reach) is still checked
          // above; this is the upper bound, and a bar that satisfies both can
          // only be bottom-anchored.
          check(
            primary.firstPaintTop < primary.viewportHeight,
            `${at} primary action visible without scrolling`,
            `"${primary.text}" first paints at y=${primary.firstPaintTop} on a ${primary.viewportHeight}px viewport`,
          );
          report(
            `${at} primary action "${primary.text}" firstPaintTop=${primary.firstPaintTop}px` +
              (primary.belowTheFold ? ' (below the fold — scroll required)' : ''),
          );
        }
      }

      if (FLOW_ROUTES.includes(route)) {
        // D-028 · צפיפות · סרגל תחתון — טענות על **מסך זרימה**, ⛔ לא על מסך עם פעולה.
        // ⛔ נשארות על FLOW_ROUTES: מסך לשונית נושא סרגל לשוניות בהגדרה (TAB_ROUTES
        // דורש זאת), ולכן הטענה שסרגל כזה הוא תועה הייתה עליו סתירה ⛔ ולא מדידה (F-098).
        //
        // ⛔ ההערה הזאת יושבת **בתוך** הבלוק ו⛔ לא מעליו במכוון: השומר ב-
        // `verify-mobile.test.ts` מודד שהמחרוזת «no tab bar…» ⛔ אינה מופיעה בין פתיחת
        // בלוק PRIMARY_ACTION_ROUTES לפתיחת בלוק FLOW_ROUTES, וציטוט שלה מעל השורה
        // היה מפיל שומר חי על מיקום נכון (F-100).
        //
        // The bar is `fixed`, so it covers a strip of the document. The rejected
        // alternative — a spacer inside <main> — moves that strip onto <footer>
        // instead of clearing it, because the footer holding the /sources link
        // (T-011, required on every screen) is a sibling AFTER <main>. This is
        // the check that makes the difference measurable rather than argued.
        const footer = await page.evaluate(() => {
          const bar = document.querySelector('[data-action-bar]');
          if (!bar) return { noBar: true };
          window.scrollTo(0, document.documentElement.scrollHeight);
          const link = document.querySelector('footer a[href="/sources"]');
          if (!link) return { noLink: true };
          const l = link.getBoundingClientRect();
          const b = bar.getBoundingClientRect();
          window.scrollTo(0, 0);
          return {
            clear: Math.round(l.bottom) <= Math.round(b.top) + 1,
            linkBottom: Math.round(l.bottom),
            barTop: Math.round(b.top),
          };
        });
        if (!footer.noBar && !footer.noLink) {
          check(
            footer.clear,
            `${at} action bar does not cover the licence link`,
            `link bottom ${footer.linkBottom} vs bar top ${footer.barTop}`,
          );
        }

        // D-028, from the flow side. The tab bar is rendered by
        // `app/(tabs)/layout.tsx` and the route group is what makes that
        // structural — but a future hand can still move it into the root layout,
        // and a `<TabBar />` on `/signup` is a learner offered four destinations
        // while they are supposed to be finishing one form.
        const strayTabBar = await page.evaluate(
          () => document.querySelectorAll('[data-tab-bar]').length,
        );
        check(strayTabBar === 0, `${at} no tab bar on a flow screen`, `found ${strayTabBar}`);

        // T-057. Only vertically stacked pairs that actually share horizontal
        // space are compared: two controls side by side in a row are separated
        // by their own layout, and treating them as "adjacent" would report a
        // failure the learner's thumb never meets.
        const tooClose = await page.evaluate((min) => {
          const sel = 'a[href], button, input, select, textarea, [role="button"]';

          // The nearest `fixed`/`sticky` ancestor, or null for flow content.
          // Two controls are neighbours only inside the SAME layer: a fixed bar
          // is painted over the document on purpose, so its viewport rectangle
          // at scroll 0 says nothing about what a thumb can reach.
          const overlayRoot = (el) => {
            for (let n = el; n; n = n.parentElement) {
              const p = getComputedStyle(n).position;
              if (p === 'fixed' || p === 'sticky') return n;
            }
            return null;
          };

          const boxes = [...document.querySelectorAll(sel)]
            .map((el) => ({
              el,
              r: el.getBoundingClientRect(),
              overlay: overlayRoot(el),
              absolute: getComputedStyle(el).position === 'absolute',
              label: `${el.tagName.toLowerCase()}"${(el.textContent || '').trim().slice(0, 16)}"`,
            }))
            .filter(({ r }) => r.width > 0 && r.height > 0)
            .sort((a, b) => a.r.top - b.r.top);

          const overlapsHorizontally = (a, b) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
          // 1px of tolerance: sub-pixel layout, not a licence to swallow a real
          // neighbour — an adornment sits wholly inside the field it belongs to.
          const encloses = (outer, inner) =>
            inner.left >= outer.left - 1 &&
            inner.right <= outer.right + 1 &&
            inner.top >= outer.top - 1 &&
            inner.bottom <= outer.bottom + 1;

          const found = [];
          for (let i = 0; i < boxes.length - 1; i += 1) {
            for (let j = i + 1; j < boxes.length; j += 1) {
              const a = boxes[i];
              const b = boxes[j];
              // Nested controls (a button inside a label inside a link) are one
              // target, not two — a contained box is never its own neighbour.
              if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
              // Different layers. Whether the fixed bar clears the content under
              // it is a real question, and it is measured by its own check
              // ("action bar does not cover the licence link") from a page that
              // has been scrolled — which is the only position where the answer
              // means anything.
              if (a.overlay !== b.overlay) continue;
              // An absolutely positioned control lying wholly inside another
              // control's box is that control's adornment — the password
              // visibility toggle inside its input (C-0005), one composite
              // target. Separating them would be undoing the design, not fixing
              // a gap.
              if ((a.absolute && encloses(b.r, a.r)) || (b.absolute && encloses(a.r, b.r)))
                continue;
              if (!overlapsHorizontally(a.r, b.r)) continue;
              const gap = b.r.top - a.r.bottom;
              if (gap >= min) break; // sorted by top: everything later is further
              if (gap < min) found.push(`${a.label} ↔ ${b.label} ${Math.round(gap)}px`);
            }
          }
          return found;
        }, MIN_GAP);
        check(
          tooClose.length === 0,
          `${at} adjacent tap targets >= ${MIN_GAP}px apart`,
          `too close: ${tooClose.join(' · ')}`,
        );
      }

      // `36 § 4` · D-027 · § 4.2ב — the tab shell itself: present, complete, thumb-sized,
      // and alone at the bottom of the screen.
      // ⚠️ **ארבע ⇒ חמש, C-0314 (T-174), ו⛔ זו ⛔ אינה הרפיה של הבדיקה.** `36 § 4`
      // מוסיף את `הגדרות` **מסיבה מבנית**: סרגל בן ארבע ⛔ אינו יכול להעמיד את
      // `העולם` במרכז הגאומטרי המדויק, והרנדר `docs/design/kol-world-ring.png`
      // מצייר אותו שם. ⇒ המספר נשאר **מדויק** (`=== 5`), כי מה שהבדיקה שומרת עליו
      // הוא שלשונית ⛔ לא תיווסף בלי מסמך עוגן — ⛔ ולא המספר ארבע כשלעצמו.
      if (TAB_ROUTES.includes(route)) {
        const tabs = await page.evaluate(() => {
          const bar = document.querySelector('[data-tab-bar]');
          if (!bar) return { present: false };
          const items = [...bar.querySelectorAll('a,button')];
          return {
            present: true,
            count: items.length,
            small: items
              .map((el) => el.getBoundingClientRect())
              .filter((r) => r.width < 44 || r.height < 44).length,
            actionBars: document.querySelectorAll('[data-action-bar]').length,
          };
        });
        check(tabs.present, `${at} tab bar is present`, 'no [data-tab-bar] in the document');
        if (tabs.present) {
          check(tabs.count === 5, `${at} exactly five tabs`, `found ${tabs.count}`);
          check(tabs.small === 0, `${at} every tab >= 44px`, `${tabs.small} tabs below the floor`);
          // D-028: a screen never carries both bars.
          check(tabs.actionBars === 0, `${at} no action bar on a tab screen`, `found ${tabs.actionBars}`);
        }
      }

      // Content anchored to the top (F-011). The landing screen used to centre
      // its heading inside the whole flexible area, leaving a 267px dead band
      // above it; a regression here is invisible in a diff but obvious on a
      // phone. Measured against the header, not the viewport top.
      // T-028: widened from `/` to EVERY screen that has a heading. Scoping it
      // to one route is why F-016 survived in /onboarding and why AuthForm sat
      // at a measured 139px band on /login and 109px on /signup — the same
      // `flex-1 justify-center` wrapper, in a file nobody re-measured.
      // C-0200 (T-098): the measurement is now the DEAD BAND, not the <h1>'s
      // ordinal position. It used to read `main h1`.top, which silently assumed
      // the heading is the first thing painted — true on every screen built so
      // far. `/world` broke that assumption honestly: § 4.2יא puts the app grid
      // ABOVE the feed, so 256px of REAL CONTENT now sits above `<WorldFeed>`'s
      // h1 and the old proxy reported it as a dead band. Content is not a dead
      // band; F-011's own words are "fill the space with content that does work".
      // ⚠️ So the rule is NARROWED to what F-011 actually forbids and is NOT
      // weakened: it measures the first PAINTED TEXT inside main. A centred
      // `flex-1 justify-center` wrapper still fails, because its wrapper box
      // starts at the top while its text does not — that mutation was re-run on
      // `app/page.tsx` in C-0200 and still fails at 267px. The gate still only
      // applies to routes that carry a `main h1`, exactly as before.
      {
        const gap = await page.evaluate(() => {
          const main = document.querySelector('main');
          if (!main || !main.querySelector('h1')) return -1;
          const header = document.querySelector('header');
          const top = header ? header.getBoundingClientRect().bottom : 0;
          for (const el of main.querySelectorAll('*')) {
            const paints =
              ['IMG', 'SVG', 'CANVAS', 'VIDEO'].includes(el.tagName) ||
              [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== '');
            if (!paints) continue;
            const box = el.getBoundingClientRect();
            if (box.height === 0 || box.width === 0) continue;
            return box.top - top;
          }
          return -1;
        });
        if (gap >= 0) {
          check(gap <= 48, `${at} heading anchored to top`, `dead band of ${Math.round(gap)}px above the heading`);
        }
      }

      // Password visibility (F-013). Email confirmation is off (Q-001 ⓑ), so
      // there is no recovery path: one unseen typo is an account the learner
      // can never enter again. That makes the toggle a measured guarantee and
      // not a styling detail — the tap-target check above already holds the
      // new button to 44px on its own.
      if (route === '/signup' || route === '/login') {
        // F-015: the mobile keyboard's action key. Invisible in a screenshot and
        // in a diff — the attribute is read off the live DOM or it is not known.
        const hints = await page.evaluate(() => ({
          email: document.querySelector('input[name="email"]')?.getAttribute('enterkeyhint') ?? null,
          password:
            document.querySelector('input[name="password"]')?.getAttribute('enterkeyhint') ?? null,
          emailDir: document.querySelector('input[name="email"]')?.getAttribute('dir') ?? null,
        }));
        check(hints.email === 'next', `${at} email keyboard offers "next"`, `enterkeyhint=${hints.email}`);
        check(hints.password === 'go', `${at} password keyboard offers "go"`, `enterkeyhint=${hints.password}`);
        check(hints.emailDir === 'ltr', `${at} email field is still ltr after the refactor`, `dir=${hints.emailDir}`);

        const toggle = page.locator('[data-password-toggle]');
        const present = (await toggle.count()) === 1;
        check(present, `${at} password toggle present`, 'no [data-password-toggle] button');
        if (present) {
          const field = page.locator('input[name="password"]');
          const typeNow = () => field.getAttribute('type');
          check(
            (await typeNow()) === 'password',
            `${at} password hidden by default`,
            `type is "${await typeNow()}"`,
          );
          await toggle.click();
          check(
            (await typeNow()) === 'text',
            `${at} toggle reveals the password`,
            `type stayed "${await typeNow()}"`,
          );
          // The button must fit inside the padding the field reserves for it,
          // in BOTH label states — "הסתר" is wider than "הצג", and an
          // auto-width button in the wider state lands on top of the last
          // typed characters. Measured, because it is invisible in a diff.
          for (const state of ['revealed', 'hidden']) {
            const fit = await page.evaluate(() => {
              const input = document.querySelector('input[name="password"]');
              const button = document.querySelector('[data-password-toggle]');
              if (!input || !button) return null;
              return {
                reserved: parseFloat(getComputedStyle(input).paddingRight),
                width: button.getBoundingClientRect().width,
                label: (button.textContent || '').trim(),
              };
            });
            check(
              fit !== null && fit.width + 4 <= fit.reserved,
              `${at} toggle fits its reserved space (${state})`,
              fit === null
                ? 'field or button missing'
                : `"${fit.label}" is ${Math.round(fit.width)}px wide but only ${Math.round(fit.reserved)}px is reserved`,
            );
            if (state === 'revealed') await toggle.click();
          }

          check(
            (await typeNow()) === 'password',
            `${at} toggle hides it again`,
            `type stayed "${await typeNow()}"`,
          );
        }
      }

      // T-026: the address band is the only thing standing between a typo and a
      // permanently lost account while email confirmation is off (Q-001 ⓑ), so
      // it is measured rather than asserted. Measured on the fixture route
      // because /onboarding redirects without Supabase env (TD-13).
      if (route === '/dev/identity') {
        const band = page.locator('[data-registered-email]');
        const present = (await band.count()) === 1;
        check(present, `${at} registered address band present`, 'no [data-registered-email]');
        if (present) {
          // allInnerTexts(), not innerText(): C-0015 measured innerText() timing
          // out on exactly this shape of node.
          const shown = (await band.allInnerTexts()).join(' ');
          check(
            shown.includes('fixture@example.com'),
            `${at} the address itself is on screen`,
            `band read "${shown.trim().replace(/\s+/g, ' ')}"`,
          );
          const wrapped = await page.evaluate(() => {
            const el = document.querySelector('[data-registered-email] [lang="en"]');
            if (!el) return null;
            const style = getComputedStyle(el);
            return {
              dir: el.getAttribute('dir'),
              bidi: style.unicodeBidi,
              text: (el.textContent || '').trim(),
            };
          });
          check(
            wrapped !== null &&
              wrapped.dir === 'ltr' &&
              wrapped.bidi.includes('isolate') &&
              wrapped.text === 'fixture@example.com',
            `${at} the address travels through <EnWord>`,
            wrapped === null
              ? 'no [lang="en"] element inside the band'
              : `dir=${wrapped.dir} unicode-bidi=${wrapped.bidi} text="${wrapped.text}"`,
          );
          const fix = page.locator('[data-registered-email] form button[type="submit"]');
          check(
            (await fix.count()) === 1,
            `${at} one-tap correction present`,
            'no submit button inside the band',
          );
        }
      }

      // T-029 / TD-13: the goal question is the one screen where the DEFAULT is
      // the product decision (R-012 · E3), so it is measured, not asserted.
      if (route === '/dev/onboarding') {
        const group = page.locator('[data-daily-minutes]');
        const present = (await group.count()) === 1;
        check(present, `${at} daily-minutes group present`, 'no [data-daily-minutes]');
        if (present) {
          const radios = group.locator('input[type="radio"]');
          const count = await radios.count();
          check(count === 3, `${at} three goal options`, `found ${count}`);

          const checkedValue = await page.evaluate(() => {
            const el = document.querySelector(
              '[data-daily-minutes] input[type="radio"]:checked',
            );
            return el instanceof HTMLInputElement ? el.value : null;
          });
          check(
            checkedValue === '5',
            `${at} the modest goal is preselected`,
            `preselected value was ${checkedValue === null ? 'nothing' : `"${checkedValue}"`}`,
          );

          // The clickable row, not the 20px radio dot, is the tap target — so
          // measure the label the learner actually hits.
          const rows = group.locator('label');
          const rowCount = await rows.count();
          for (let i = 0; i < rowCount; i += 1) {
            const box = await rows.nth(i).boundingBox();
            check(
              box !== null && box.height >= MIN_TAP,
              `${at} goal option ${i + 1} is >= ${MIN_TAP}px tall`,
              box === null ? 'no box' : `height ${Math.round(box.height)}px`,
            );
          }
        }

        const scoreLabel = await page.evaluate(() => {
          const input = document.querySelector('input[name="target_score"]');
          if (!(input instanceof HTMLInputElement)) return null;
          return { dir: input.getAttribute('dir'), inputMode: input.getAttribute('inputmode') };
        });
        check(
          scoreLabel !== null && scoreLabel.dir === 'ltr' && scoreLabel.inputMode === 'numeric',
          `${at} the optional score field is a Latin numeric input`,
          scoreLabel === null
            ? 'no input[name="target_score"]'
            : `dir=${scoreLabel.dir} inputmode=${scoreLabel.inputMode}`,
        );
      }

      // T-041: the card is anchored, the reveal is instant, and the grade
      // controls never rely on colour (measured deutan ΔE 4.1 — see palette.ts).
      if (route.startsWith('/dev/card')) {
        const before = await page.locator('[data-card-back]').count();
        check(before === 0, `${at} answer hidden before reveal`, 'the back was in the DOM already');

        // Measured against the CARD, not the heading text above it: the previous
        // version measured [data-card-front], which sits ~44px lower because of the
        // fixture's own note line, and then allowed 120px — so it had 23px of slack
        // and was calibrated on chrome that does not exist in production. Same 48px
        // rule every other screen is held to.
        const gap = await page.evaluate(() => {
          const header = document.querySelector('header');
          const card = document.querySelector('[data-flashcard]');
          if (!header || !card) return Number.NaN;
          return card.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
        });
        check(gap >= 0 && gap <= 48, `${at} card anchored to top`, `dead band of ${Math.round(gap)}px`);

        if (route === '/dev/card/swap') {
          // Reveal card A, grade it, and demand that card B arrives HIDDEN. The
          // fixture deliberately passes no `key`, so this measures the component's
          // own reset and not the consumer's discipline. Before the fix, card B
          // rendered revealed with no reveal button.
          await page.locator('[data-reveal]').click();
          const aFront = await page.locator('[data-card-front]').innerText();
          // T-293ⓐ — the button is VISIBLE now; grading it by keyboard still proves the same path.
          await page.focus('[data-grade="good"]');
          await page.keyboard.press('Enter');

          const bFront = await page.locator('[data-card-front]').innerText();
          check(bFront.trim() !== aFront.trim(), `${at} grading advances to the next card`, `still on "${bFront}"`);
          check(
            (await page.locator('[data-card-back]').count()) === 0,
            `${at} the next card arrives hidden`,
            'card B was revealed before the learner tried to recall it',
          );
          check(
            (await page.locator('[data-reveal]').count()) === 1,
            `${at} the next card can be revealed`,
            'no reveal button on card B — the learner is stuck',
          );
        } else if (route === '/dev/card') {
          await page.locator('[data-reveal]').click();
          const back = await page.locator('[data-card-back]').count();
          check(back === 1, `${at} reveal shows the answer`, 'still hidden after clicking');

          // allInnerTexts(), not innerText(): when the target cannot be located core
          // degrades to an unmarked segment ON PURPOSE, and innerText() then waited
          // 30s and threw a bare TimeoutError — losing every ok line printed so far
          // and naming neither route nor width.
          const marks = await page.locator('[data-card-back] strong').allInnerTexts();
          check(
            marks.length === 1 && (marks[0] ?? '').trim() === 'Lorem',
            `${at} target word marked in the example`,
            `marked ${JSON.stringify(marks)}`,
          );

          // T-045 · D-024. This fixture is the only one built from an unverified
          // sense, and this is the only place in the whole suite where a real
          // engine paints the marker: the unit tests measure the boolean and the
          // source, neither of which can see a paragraph that renders empty or
          // lands outside the revealed block.
          const flag = page.locator('[data-card-back] [data-card-unverified]');
          check(
            (await flag.count()) === 1,
            `${at} the unverified translation is marked on the back`,
            'no [data-card-unverified] inside the revealed block',
          );
          const flagText = (await flag.allInnerTexts()).join('').replace(/[◇\s]/g, '');
          check(
            flagText.length > 0,
            `${at} the unverified marker carries text, not a glyph alone`,
            `marker read "${flagText}"`,
          );
          check(
            (await page.locator('[data-card-front] [data-card-unverified]').count()) === 0,
            `${at} the marker never appears on the front`,
            'the learner is told the QUESTION is unreliable',
          );

          for (const grade of ['again', 'good']) {
            const label = (await page.locator(`[data-grade="${grade}"]`).allInnerTexts()).join('');
            check(
              label.replace(/[✓✕\s]/g, '').length > 0,
              `${at} grade "${grade}" carries a text label, not colour alone`,
              `label was "${label}"`,
            );
          }
          // T-293ⓐ (PM, 12/09 · `F-217`) — REPLACES the `sr-only`-at-rest half of T-259ⓕ, and
          // ⛔ does ⛔ not weaken it: the claim goes from «invisible until focused» to «visible
          // AND ≥44px at rest», which is strictly stronger. The old assertion is exactly what
          // let a 1×1 transparent button pass as «the accessible channel» while a sighted
          // learner had ⛔ no grade control at all — the swipe was the only one, which `D-042`
          // forbids. ⛔ The count stays 2: ⛔ never a second grading path.
          const rest = await page.evaluate(() =>
            [...document.querySelectorAll('[data-grade]')].map((el) => {
              const r = el.getBoundingClientRect();
              return { h: Math.round(r.height), w: Math.round(r.width) };
            }),
          );
          check(
            rest.length === 2 && rest.every((b) => b.h >= MIN_TAP && b.w >= MIN_TAP),
            `${at} T-293ⓐ: both grade buttons are visible ≥${MIN_TAP}px targets at rest`,
            `boxes ${JSON.stringify(rest)}`,
          );
          for (const grade of ['good', 'again']) {
            await page.focus(`[data-grade="${grade}"]`);
            const box = await page.locator(`[data-grade="${grade}"]`).boundingBox();
            check(
              box !== null && box.height >= MIN_TAP && box.width >= MIN_TAP,
              `${at} T-293ⓐ: focused "${grade}" is a ≥${MIN_TAP}px target`,
              `box ${JSON.stringify(box)}`,
            );
          }
          // T-293ⓑ — the hint shrank to a pointer at the shortcut, and it names ⛔ no physical
          // direction: `F-102` measured «ימינה» ambiguous under RTL, and the answer is the
          // button that leans during the drag, ⛔ not a longer sentence.
          const hint = (await page.locator('[data-swipe-hint]').allInnerTexts()).join('');
          check(
            hint.includes('להחליק') && !/ימינה|שמאלה/.test(hint),
            `${at} T-293ⓑ: the hint points at the shortcut without naming a physical direction`,
            `hint was "${hint}"`,
          );
          const badges = await page.evaluate(() =>
            [...document.querySelectorAll('[data-swipe-badge]')].map((el) => getComputedStyle(el).opacity),
          );
          check(
            badges.length === 2 && badges.every((o) => o === '0'),
            `${at} T-259ⓑ: both badges exist and are invisible at rest`,
            `opacities ${JSON.stringify(badges)}`,
          );
          // T-259 · T-243 — this fixture's onGrade is a no-op ⇒ the grade is NOT taken ⇒ the
          // card must come back to rest, and the release must be the spring (linear()).
          const cardEl = page.locator('[data-flashcard]');
          const cbox = await cardEl.boundingBox();
          const cx = Math.round(width / 2) - 50;
          const cy = Math.round(cbox.y + cbox.height / 2);
          await page.mouse.move(cx, cy);
          await page.mouse.down();
          await page.mouse.move(cx + 120, cy, { steps: 10 });
          await page.mouse.up();
          const easing = await page.evaluate(() => getComputedStyle(document.querySelector('[data-flashcard]')).transitionTimingFunction);
          check(easing.startsWith('linear('), `${at} T-243: the release is a linear() spring easing`, `timing-function "${easing.slice(0, 40)}"`);
          const settled = await page
            .waitForFunction(
              () => {
                const t = getComputedStyle(document.querySelector('[data-flashcard]')).transform;
                return t === 'none' || Math.abs(new DOMMatrixReadOnly(t).m41) < 1;
              },
              null,
              { timeout: 2000 },
            )
            .then(() => true)
            .catch(() => false);
          check(settled, `${at} T-259: a grade the consumer did not take brings the card back to rest`, 'still off its slot after 2s');
          check(
            (await page.locator('[data-flashcard][data-swipe]').count()) === 0,
            `${at} T-259: the sent-state is cleared when the grade comes back`,
            'data-swipe still set',
          );
        } else if (route === '/dev/card/choice') {
          // T-066 · D-156 · D-169 — the «משפטים» item on the SAME card: three options ≥44px
          // (⛔ not four — D-156), the blank EMPTY before the tap, and after the tap the back,
          // the Hebrew meaning, a written verdict, a way forward, and the three options still
          // in the DOM as aria-disabled (Layer A — a screen reader must still find them).
          const options = page.locator('[data-option]');
          const optionCount = await options.count();
          check(optionCount === 3, `${at} T-066: three options (D-156), not four`, `found ${optionCount}`);
          const heights = await page.evaluate(() =>
            [...document.querySelectorAll('[data-option]')].map((el) => el.getBoundingClientRect().height),
          );
          check(
            heights.length === 3 && heights.every((h) => h >= MIN_TAP),
            `${at} T-066: every option is a ≥${MIN_TAP}px target`,
            `heights ${JSON.stringify(heights)}`,
          );
          const blankBefore = (await page.locator('[data-stem-blank]').allInnerTexts())
            .join('')
            .replace(/\u200B/g, '')
            .trim();
          check(blankBefore === '', `${at} T-066: the blank is empty before the tap`, `blank read "${blankBefore}"`);
          check(
            (await page.locator('[data-continue]').count()) === 0,
            `${at} T-066: no «המשך» before an option is tapped`,
            'a way forward existed before the answer',
          );

          // The second option is the fixture's answer — the correct path is the one measured
          // here; the wrong path shares every node and differs in the verdict text alone.
          await options.nth(1).click();

          check(
            (await page.locator('[data-card-back]').count()) === 1,
            `${at} T-066: the tap reveals the back`,
            'still hidden after choosing',
          );
          const verdict = await page.locator('[data-verdict]').allInnerTexts();
          check(
            verdict.length === 1 && (verdict[0] ?? '').replace(/[✓✕\s]/g, '').length > 0,
            `${at} T-066: a written verdict, not colour alone`,
            `verdict ${JSON.stringify(verdict)}`,
          );
          check(
            (await page.locator('[data-continue]').count()) === 1,
            `${at} T-066: a way forward after answering`,
            'no [data-continue] — the card dead-ends',
          );
          check(
            (await page.locator('[data-option][aria-disabled="true"]').count()) === 3,
            `${at} T-066: the options stay in the DOM, aria-disabled (Layer A)`,
            'options vanished or stayed live after the answer',
          );
          const blankAfter = (await page.locator('[data-stem-blank]').allInnerTexts()).join('').trim();
          check(blankAfter === 'Lorem', `${at} T-066: the blank is filled with the answer after the tap`, `blank read "${blankAfter}"`);
          check(
            (await page.locator('[data-card-back] [data-card-secondary]').count()) === 1,
            `${at} T-066: the back carries the Hebrew meaning (D-156 ⓒ)`,
            'no [data-card-secondary] inside the revealed block',
          );
          const marks = await page.locator('[data-card-back] strong').allInnerTexts();
          check(
            marks.length === 1 && (marks[0] ?? '').trim() === 'Lorem',
            `${at} T-066: the answer is marked in the neutral example`,
            `marked ${JSON.stringify(marks)}`,
          );
        } else {
          // The typed direction is auto-graded, so the ONLY way the learner learns
          // anything is the verdict on screen. Before this ran, submitting left a
          // screen with zero controls and no correct/incorrect state at all.
          await page.locator('input[id]').fill('wrong');
          await page.locator('button[type="submit"]').click();

          const verdict = await page.locator('[data-verdict]').allInnerTexts();
          check(verdict.length === 1, `${at} typed answer produces a verdict`, 'no [data-verdict]');
          check(
            (verdict[0] ?? '').replace(/[✓✕\s]/g, '').length > 0,
            `${at} verdict carries a text label, not colour alone`,
            `verdict was ${JSON.stringify(verdict)}`,
          );
          check(
            (await page.locator('[data-continue]').count()) === 1,
            `${at} there is a way forward after answering`,
            'no [data-continue] button — the card dead-ends',
          );
        }
      }

      // T-065 · § 4.2ו · T-086 — the scrolling deck. Three promises, measured on the
      // component and ⛔ not on the screen above it: one card fills the screen, and the two
      // grade buttons are both thumb-sized AND separated. `/dev/deck` and not `/study`: the
      // real route renders its failure state without Supabase env (TD-13), so the deck itself
      // would never be in the DOM while this ran.
      //
      // ⚠️ T-086 (§ 4.2ח ⓑ · 2026-08-20) — הפיקסטורה גדלה מ-2 ל-5 כדי להוכיח שכרטיס 3, 4, 5
      // גם מחוץ למסך: 2 כרטיסים ⛔ ⛔ מוכיחים ש-`h-full` בתוך `flex-1` לא מקריס את
      // כרטיס 3 ל-`min-content`. המשימה נסגרת בדוח מדידה, ⛔ ⛔ ב"נראה טוב".
      if (route === '/dev/deck') {
        const deck = await page.evaluate(() => {
          const scroller = document.querySelector('[data-deck-viewport]');
          const cards = [...document.querySelectorAll('[data-flashcard]')];
          if (!scroller) return { count: cards.length, scroller: false };
          const box = scroller.getBoundingClientRect();
          // The measured UNIT is the viewport's own child, ⛔ not `[data-flashcard]` inside it:
          // the card sits under the article's `pt-4`, so measuring the inner section reported
          // 567px inside a 583px viewport and convicted the deck of a 16px gutter that is the
          // spacing the design asks for. What must fill the viewport is the thing that snaps.
          const items = [...scroller.children].map((child) => {
            const rect = child.getBoundingClientRect();
            return { top: Math.round(rect.top), height: Math.round(rect.height) };
          });
          return {
            count: cards.length,
            scroller: true,
            // Rounded: sub-pixel layout is not a defect, and comparing raw floats turns a
            // 0.5px rounding into a red run nobody can act on.
            top: Math.round(box.top),
            bottom: Math.round(box.bottom),
            height: Math.round(box.height),
            items,
            viewportHeight: window.innerHeight,
            // 🔴 T-294 — the measurement Roy's decision turns on. `overflow-hidden` is a
            // class; THIS is whether the thing can actually be scrolled.
            scrollHeight: Math.round(scroller.scrollHeight),
            clientHeight: Math.round(scroller.clientHeight),
            pageScrollable: document.body.scrollHeight > window.innerHeight + 1,
          };
        });
        // 🔴 **⟦REWRITTEN 13/09 · `T-294` · הכרעת רוי על פריט 111⟧** עד היום נמדד כאן
        // «הדק מחזיק את כל כרטיסי הפיקסטורה» — חמישה, כדי להוכיח שכרטיס 3/4/5 ממתין
        // מחוץ למסך. ⛔ **הטענה התהפכה:** הדק מרנדר **כרטיס אחד**, והכרטיס הבא מגיע
        // מפני שהקודם עף — ⛔ ולא מפני שגללו אליו. ⇒ חמישה כרטיסים ב-DOM הם עכשיו
        // בדיוק הכשל.
        check(
          deck.count === 1 && deck.scroller,
          `${at} T-294: exactly one card is in the DOM`,
          `found ${deck.count} cards and ${deck.scroller ? 'a' : 'no'} [data-deck-viewport]`,
        );
        if (deck.count === 1 && deck.scroller) {
          // 🔴 ⓪ **ההכרעה עצמה, ⛔ ולא הצורה שלה:** ⛔ אפס גלילה אנכית. `overflow-hidden`
          //    הוא מחלקה שאפשר לדרוס; `scrollHeight > clientHeight` הוא האם המשטח
          //    **באמת** נגלל. ⇒ נמדד 12/09 לפני התיקון: 2,995px בתוך 599px.
          check(
            deck.scrollHeight <= deck.clientHeight + 1,
            `${at} T-294: the card viewport ⛔ cannot scroll vertically`,
            `scrollHeight ${deck.scrollHeight} vs clientHeight ${deck.clientHeight}`,
          );
          //    ⓪ⓑ ו⛔ גם הדף עצמו ⛔ אינו נגלל — אחרת הגלילה פשוט עברה שכבה אחת החוצה.
          check(
            !deck.pageScrollable,
            `${at} T-294: the page behind the deck ⛔ does not scroll either`,
            'document.body scrolls past the viewport',
          );
          // Measured against the SNAP VIEWPORT and ⛔ not against the window: the container
          // clips, so a card whose rectangle runs past `innerHeight` may be perfectly
          // invisible while a card 40px short of it is half on screen. Three properties,
          // and «one card per screen» is only true when all three hold.
          //
          // ⓐ The card viewport itself is entirely on screen — otherwise its bottom edge,
          //    where the two grade buttons live, is below the fold (F-027 by another route).
          check(
            deck.top >= 0 && deck.bottom <= deck.viewportHeight,
            `${at} the deck fits on screen`,
            `the card viewport occupies ${deck.top}..${deck.bottom} of a ${deck.viewportHeight}px viewport`,
          );
          // ⓑ The card fills its viewport. 1px of tolerance for sub-pixel layout, and
          //    no more: a card shorter than its viewport is the `min-h-dvh`/`flex-1` collapse
          //    measured in C-0104, where card 2 sat visible under card 1 and snapping meant
          //    nothing. T-086: the check runs over ALL fixture cards, so pinning
          //    `h-full` in `<CardDeck>` inside `flex-1` cannot pass by chance on card 1.
          const short = deck.items
            .map((it, i) => ({ i, ...it }))
            .filter((it) => it.height < deck.height - 1);
          check(
            short.length === 0,
            `${at} the card fills its viewport`,
            short.length === 0
              ? ''
              : `cards ${short.map((it) => `${it.i}=${it.height}px`).join(' · ')} inside a ${deck.height}px card viewport`,
          );
          // ⛔ **⟦REMOVED 13/09 · `T-294`⟧ «every subsequent card waits off screen».**
          //    היא מדדה ש-`items[1..]` מתחילים מתחת לקצה התחתון — ו⛔ **אין `items[1..]`**.
          //    ⇒ מסננת על רשימה בת פריט אחד חוזרת ריקה **תמיד**, כלומר הבדיקה הייתה
          //    נעשית ירוקה-לנצח בלי למדוד דבר. ⛔ בדיקה ריקה שמכריזה על טענה גרועה
          //    מהיעדרה. מה שהיא באמת שמרה — «⛔ אין כרטיס שני על המסך» — נמדד עכשיו
          //    חזק יותר ב-`deck.count === 1` למעלה.
          // ⓓ דו״ח T-086 — הגיאומטריה בפועל, כדי שהמשימה תיסגר על מספרים ולא על תחושה.
          report(
            `${at} T-086: card viewport ${deck.top}..${deck.bottom} (height ${deck.height}px) · cards ${deck.items.map((it) => it.height).join('/')}px inside`,
          );
        }

        // T-268 — the written way out, measured where it broke. Roy reported the level deck's
        // card view as broken (06/09); measured C-0490 at 375×780 the T-087 icon close sat ON
        // the deck header's notice text (icon x=303..347 · y=60..104 vs notice x=140..355 ·
        // y=60..80). This fixture never rendered that exit, so no run ever saw it. Now the
        // fixture passes the same `exit` slot production does, and four things are measured:
        // it exists and reads «חזרה לכרטיסיות», it is a 44px target, it overlaps neither
        // header text, and it ends above the card viewport (⛔ over the card).
        const exit = await page.evaluate(() => {
          const el = document.querySelector('[data-deck-exit]');
          if (!el) return null;
          const box = (node) => {
            const r = node.getBoundingClientRect();
            return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
          };
          const me = box(el);
          const others = ['[data-practice-notice]', '[data-remaining]']
            .map((sel) => document.querySelector(sel))
            .filter(Boolean)
            .map(box);
          const scroller = document.querySelector('[data-deck-viewport]');
          const intersects = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          return {
            text: (el.textContent ?? '').trim(),
            ...me,
            collides: others.filter((o) => intersects(me, o)).length,
            scrollerTop: scroller ? Math.round(scroller.getBoundingClientRect().top) : -1,
            primary: el.hasAttribute('data-primary-action'),
          };
        });
        check(exit !== null, `${at} T-268: the deck carries a written way out ([data-deck-exit])`, 'no [data-deck-exit] in the deck header');
        if (exit) {
          check(exit.text === 'חזרה לכרטיסיות', `${at} T-268: the exit is written, ⛔ not an icon`, `reads "${exit.text}"`);
          check(exit.height >= MIN_TAP && exit.width >= MIN_TAP, `${at} T-268: the exit is a ${MIN_TAP}px target`, `${exit.width}×${exit.height}px`);
          check(exit.collides === 0, `${at} T-268: the exit overlaps no header text`, `${exit.collides} header element(s) under the exit box`);
          check(exit.bottom <= exit.scrollerTop, `${at} T-268: the exit ends above the card viewport`, `exit bottom ${exit.bottom} vs viewport top ${exit.scrollerTop}`);
          check(!exit.primary, `${at} T-268: the exit carries no data-primary-action`, 'it does — /study is a FLOW_ROUTE with exactly one');
          report(`${at} T-268: exit ${exit.left}..${exit.right}×${exit.top}..${exit.bottom} (${exit.width}×${exit.height}px) · card viewport from y=${exit.scrollerTop}`);
        }

        // The grade buttons only exist after the answer is revealed — measuring the front of
        // the card would have printed green on a screen with no controls at all.
        await page.locator('[data-reveal]').first().click();
        // T-259ⓕ · שכבה א׳ — the same claim as `/dev/card`, on the REAL deck: the two buttons
        // are the VISIBLE grade channel — in the DOM, ≥44px at rest (T-293ⓐ), and still reachable
        // user focuses one. (Until 07/09 this block measured them as the visible pair with a
        // ≥8px gap; the swipe is the visible channel now — T-259ⓕ.)
        const gradeRest = await page.evaluate(() =>
          [...document.querySelectorAll('[data-grade]')].slice(0, 2).map((el) => el.getBoundingClientRect().height),
        );
        check(
          gradeRest.length === 2,
          `${at} both grade buttons are on the revealed card`,
          `found ${gradeRest.length} [data-grade] controls`,
        );
        if (gradeRest.length === 2) {
          // T-293ⓐ — the same claim as `/dev/card`, on the REAL deck: visible at rest, ⛔ not
          // `sr-only`. ⇒ the swipe is a shortcut (`D-042`), ⛔ never the only channel.
          check(
            gradeRest.every((h) => h >= MIN_TAP),
            `${at} T-293ⓐ: both grade buttons are visible ≥${MIN_TAP}px at rest`,
            `heights ${JSON.stringify(gradeRest)}`,
          );
          for (const grade of ['good', 'again']) {
            await page.focus(`[data-grade="${grade}"]`);
            const box = await page.locator(`[data-grade="${grade}"]`).first().boundingBox();
            check(
              box !== null && box.height >= MIN_TAP && box.width >= MIN_TAP,
              `${at} T-293ⓐ: focused "${grade}" is a ≥${MIN_TAP}px target`,
              `box ${JSON.stringify(box)}`,
            );
          }
        }
      }

      // T-055 — the finish state. Three properties, and «מסך סיום ולא מסך לבן» is only true
      // when all three hold: the node is there, it actually paints something, and the one
      // way out is a real touch target rather than a link the thumb cannot land on.
      // T-276 · D-198 — the same three properties hold on the finish state WITH a round
      // summary; that route then also proves the summary is on screen, ⛔ not merely in the DOM.
      const DONE_ROUTES = new Set(['/dev/deck/done', '/dev/deck/done/due']);
      if (DONE_ROUTES.has(route)) {
        const done = await page.evaluate(() => {
          const node = document.querySelector('[data-deck-done]');
          if (!node) return { present: false };
          const box = node.getBoundingClientRect();
          const exits = [...node.querySelectorAll('[data-primary-action="true"]')];
          const exit = exits[0]?.getBoundingClientRect();
          const summary = node.querySelector('[data-round-summary]');
          const lines = summary ? [...summary.querySelectorAll('p')] : [];
          return {
            present: true,
            // Rounded: sub-pixel layout is not a defect (same rule as the deck block above).
            height: Math.round(box.height),
            // The rendered text, ⛔ not the markup: a section full of empty boxes has height
            // and would pass a height-only check while showing the learner nothing.
            text: (node.textContent ?? '').trim().length,
            exits: exits.length,
            exitWidth: exit ? Math.round(exit.width) : 0,
            exitHeight: exit ? Math.round(exit.height) : 0,
            // T-276 — the summary: how many sentences, and whether every one of them is
            // painted inside the viewport (a line pushed below the fold is a line unread).
            summaryLines: lines.length,
            summaryVisible: lines.every((p) => {
              const r = p.getBoundingClientRect();
              return r.height > 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
            }),
          };
        });
        check(done.present, `${at} the finish state is in the DOM`, 'no [data-deck-done]');
        if (done.present && route === '/dev/deck/done/due') {
          // D-198: two sentences on `due`, and both on screen above the way out.
          check(
            done.summaryLines === 2,
            `${at} the due finish state says two things about the round`,
            `found ${done.summaryLines} [data-round-summary] lines`,
          );
          check(
            done.summaryVisible,
            `${at} every round-summary line is painted inside the viewport`,
            'a summary line sits outside the viewport or has no height',
          );
        }
        if (done.present && route === '/dev/deck/done') {
          // D-198 ⓓ: zero grades ⇒ ⛔ no summary — the screen is exactly what it was.
          check(
            done.summaryLines === 0,
            `${at} a round with zero grades prints no summary`,
            `found ${done.summaryLines} [data-round-summary] lines`,
          );
        }
        if (done.present) {
          check(
            done.height > 0 && done.text > 0,
            `${at} the finish state is not a blank screen`,
            `height ${done.height}px, ${done.text} chars of text`,
          );
          check(
            done.exits === 1,
            `${at} the finish state offers exactly one way out`,
            `found ${done.exits} [data-primary-action]`,
          );
          check(
            done.exitWidth >= MIN_TAP && done.exitHeight >= MIN_TAP,
            `${at} the way out clears ${MIN_TAP}px`,
            `${done.exitWidth}×${done.exitHeight}`,
          );
        }
      }

      // T-143 · § 4.2יד — «⛔ אין פריט תרגול בלי יעד מגע». שלוש טענות, וכולן
      // על פיקסלים ⛔ ולא על מרקאפ: האפשרויות קיימות, האגודל מגיע לכל אחת,
      // ו⛔ אין הסבר על המסך לפני שהלומד בחר (הסבר שמוצג תמיד אינו הסבר).
      if (route === '/dev/lesson') {
        const lesson = await page.evaluate(() => {
          const choices = [...document.querySelectorAll('main [data-lesson-choice]')];
          return {
            count: choices.length,
            small: choices.filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width < 44 || r.height < 44;
            }).length,
            whys: document.querySelectorAll('main [data-lesson-why]').length,
          };
        });
        check(
          lesson.count >= 3,
          `${at} the lesson offers at least 3 tappable choices`,
          `found ${lesson.count} [data-lesson-choice]`,
        );
        check(
          lesson.small === 0,
          `${at} every lesson choice clears ${MIN_TAP}px`,
          `${lesson.small} of ${lesson.count} are below the floor`,
        );
        check(
          lesson.whys === 0,
          `${at} no explanation is on screen before a choice is made`,
          `found ${lesson.whys} [data-lesson-why]`,
        );
      }

      // T-054 — the loading state. «שלד בצורת הכרטיס ולא מסך לבן» is a claim about pixels:
      // three boxes that paint, and ⛔ no element that spins.
      if (route === '/dev/deck/skeleton') {
        const skeleton = await page.evaluate(() => {
          const node = document.querySelector('[data-deck-skeleton]');
          if (!node) return { present: false };
          const boxes = [...node.querySelectorAll('[aria-hidden]')].map((box) => {
            const rect = box.getBoundingClientRect();
            return { w: Math.round(rect.width), h: Math.round(rect.height) };
          });
          return {
            present: true,
            boxes: boxes.length,
            // The tallest box stands for the card itself. A skeleton whose boxes all
            // collapse to 0 is a blank screen wearing the right attribute.
            tallest: boxes.reduce((max, box) => Math.max(max, box.h), 0),
            painted: boxes.filter((box) => box.w > 0 && box.h > 0).length,
          };
        });
        check(skeleton.present, `${at} the skeleton is in the DOM`, 'no [data-deck-skeleton]');
        if (skeleton.present) {
          check(
            skeleton.boxes === 3 && skeleton.painted === 3,
            `${at} the skeleton paints three boxes`,
            `${skeleton.boxes} boxes, ${skeleton.painted} with area`,
          );
          check(
            skeleton.tallest >= 100,
            `${at} the skeleton is card-shaped, ⛔ not a bar`,
            `tallest box ${skeleton.tallest}px`,
          );
        }
      }

      // T-067 — the third of the three connectivity checks: the tap ARRIVES somewhere.
      // Last in the route block on purpose: `navigates` leaves this URL behind, and every
      // measurement above has to happen on the screen it names.
      const arrival = FLOW_ARRIVAL[route];
      if (arrival) {
        const action = page.locator('main [data-primary-action]');
        if ((await action.count()) === 1) {
          // The request this tap causes, and how many times its failure has ALREADY been
          // logged on this screen. `/study` and `/world/compose` both fetch on load and are
          // sitting in their 503 failure state, so "has the message arrived" is false from
          // the start — the only honest question is whether ONE MORE has arrived since.
          const settles = arrival.request ?? arrival.settles;
          const loggedBefore = settles
            ? consoleErrors.filter((line) => line.includes(settles)).length
            : 0;
          if (arrival.kind === 'navigates') {
            await action.click();
            await page.waitForURL(`**${arrival.to}`, { timeout: 5000 }).catch(() => {});
            const url = new URL(page.url()).pathname;
            check(url === arrival.to, `${at} tap arrives at ${arrival.to}`, `landed on ${url}`);
            // The URL alone is a claim about the router; the marker is a claim about the
            // screen. A route that renders an error boundary has the right URL too.
            //
            // ⚠️ F-101 (C-0250) — ההמתנה חובה, והיא נמדדה: `waitForURL` נפתר ברגע
            // שהכתובת השתנתה, והיעד עדיין נצבע. בנחיתה על `/study` (‏T-091) הכתובת
            // וה-`<h1>` כבר במקום ב-`t=0`, ואילו `[data-action-bar]` מופיע תוך
            // ~300ms — כלומר קריאה מיידית ב-`.count()` מדדה DOM שטרם הגיע והפילה
            // מסך שרונדר בפועל, בשלושת הרוחבים. ⛔ ⛔ החלשה: הפסק סופי, ומסך
            // שלעולם ⛔ אינו מרנדר את הסמן עדיין נופל בתומו. אותו לקח כמו C-0134
            // ואותה תבנית שענף `announces` משתמש בה מיד למטה.
            await page
              .locator(arrival.marker)
              .first()
              .waitFor({ timeout: 5000 })
              .catch(() => {});
            const marker = await page.locator(arrival.marker).count();
            check(
              marker > 0,
              `${at} ${arrival.to} really rendered`,
              `no element matching ${arrival.marker}`,
            );
          } else if (arrival.kind === 'announces') {
            const said = () => page.locator('main').innerText();
            const before = await said();
            check(
              !before.includes(arrival.text),
              `${at} the answer is not on screen before the tap`,
              'the assertion below would pass without the tap',
            );
            await action.click();
            await page
              .locator('main', { hasText: arrival.text })
              .waitFor({ timeout: 5000 })
              .catch(() => {});
            const after = await said();
            check(
              after.includes(arrival.text),
              `${at} tap answers with "${arrival.text}"`,
              'the tap produced no visible answer — this is the F-027 dead end',
            );
          } else {
            // The RESPONSE and not the request: a response proves the request went out, so
            // the assertion is strictly stronger, and it is also the first half of keeping
            // the 503 inside this route (see the settle loop below).
            const seen = page.waitForResponse((r) => r.url().includes(arrival.request), {
              timeout: 5000,
            });
            await action.click();
            const fired = await seen.then(() => true).catch(() => false);
            check(
              fired,
              `${at} tap re-issues ${arrival.request}`,
              'the retry button issued no request at all',
            );
          }
          // ⚠️ Measured C-0134, and ⛔ not a precaution. A tap starts work that outlives this
          // iteration unless it is waited for, and the loop rebinds `consoleErrors` at the
          // top of the next one — so anything late is logged against the WRONG route. Both
          // halves were observed, and both were intermittent, which is worse than wrong:
          //   · Chromium delivers the console message for a failed resource on its own event,
          //     AFTER the response promise resolves ⇒ the harness blamed `/dev/card` for
          //     `/study`'s queue, and `/dev/world` — the fixture that requests nothing at
          //     all — for `/world/compose`'s bank.
          //   · The tap on `/` lands on `/signup`, whose favicon was still in flight when the
          //     next `goto` aborted it ⇒ the abort was logged against `/signup`.
          // ⛔ The fix is NOT an EXPECTED_CONSOLE entry on the innocent route: an entry on
          // `/dev/world` would silence the exact alarm its comment above exists to raise.
          // So the tap waits here, inside the route that caused it, until the page is quiet
          // and the message it is responsible for has actually been delivered — condition
          // based and bounded, and ⛔ never a blind sleep.
          await page.waitForLoadState('networkidle').catch(() => {});
          if (settles) {
            for (let i = 0; i < 100; i += 1) {
              const logged = consoleErrors.filter((line) => line.includes(settles)).length;
              if (logged > loggedBefore) break;
              await page.waitForTimeout(20);
            }
          }
          report(`${at} arrival: ${arrival.kind} — ${arrival.why}`);
        }
      }

      // T-099 · D-042 — המחווה נמדדת חיה, ⛔ ולא מוצהרת. `/dev/deck` מחזיק חמישה
      // כרטיסים ו-`onGraded` שלו נפתר מיד, ולכן «הכרטיס סומן» הוא בדיוק ירידה
      // של `data-remaining` — ⛔ ולא צילום מסך ולא «נראה תקין».
      //
      // ⚠️ הבלוק יושב **אחרון** בגוף הלולאה בכוונה: הוא משנה את מצב העמוד
      // (כרטיס עוזב את ה-DOM), וכל בדיקה שהייתה רצה אחריו הייתה מודדת דף אחר.
      if (route === '/dev/deck') {
        const remainingNow = () =>
          page.evaluate(() => {
            const el = document.querySelector('[data-remaining]');
            return el === null ? -1 : Number(el.getAttribute('data-remaining'));
          });

        // ⚠️ נמדד C-0252, ⛔ ולא הנחה: הבלוק של יעדי המגע (למעלה, «grade targets»)
        // **חושף** את הכרטיס הראשון כדי למדוד את שני הכפתורים, ולכן העמוד שמגיע
        // לכאן ⛔ אינו במצב ההתחלתי. הרצה ראשונה הוכיחה זאת — «swipe before reveal»
        // נפלה עם `remaining moved 5 → 4` בשלושת הרוחבים, כלומר המחווה «לפני
        // החשיפה» רצה על כרטיס חשוף וסימנה אותו כדין.
        // ⛔ התיקון ⛔ אינו להחליש את הטענה: הוא **לבסס את התנאי שהיא מתיימרת
        // למדוד**. טעינה מחדש מחזירה את הפיקסטורה למצבה, והשורה שאחריה מאמתת
        // שהחזית באמת בלתי-חשופה — בלעדיה הבדיקה הייתה עוברת ריק ביום שבו
        // בלוק אחר יחשוף שוב.
        await page.reload({ waitUntil: 'networkidle' });
        const revealable = await page.locator('[data-reveal]').count();
        check(
          revealable >= 1,
          `${at} deck starts unrevealed — the precondition is measured`,
          `[data-reveal] count is ${revealable} ⇒ the card is already revealed`,
        );

        // T-100 · D-043 — הדעיכה נראית, ⛔ ולא מוצהרת. הכרטיס הראשון בפיקסטורה
        // פג לחזרה, ולכן `stale` חייב להיות על המסך. ⛔ הבדיקה ⛔ אינה על צבע:
        // היא על **התווית העברית**, שהיא הערוץ שאינו-צבע של חוקה § 1.
        const decay = await page.evaluate(() => {
          const el = document.querySelector('[data-card-front][data-decay]');
          return {
            level: el === null ? null : el.getAttribute('data-decay'),
            label: document.body.innerText.includes('הגיע זמן לחזור'),
          };
        });
        check(decay.level === 'stale', `${at} overdue card decays`, `data-decay=${decay.level}`);
        check(decay.label, `${at} decay carries its Hebrew label`, 'label missing');

        // 🔴 **ⓐ ⟦REVERSED 13/09 · `T-292` · הכרעת רוי⟧ המחווה חיה מהפיקסל הראשון.**
        // הטענה כאן הייתה «swipe before reveal ⛔ does not grade», ונימוקה היה
        // `D-033`: «סימון בטעות הוא הנזק». ⇒ רוי הכריע אחרת, פעמיים ובמפורש —
        // «ההחלקה ימינה ושמאלה לא מעיפה את הכרטיסיה בשביל לעבור לכרטיס הבא».
        // ⇒ ⛔ **והטענה ⛔ לא נמחקה — היא התהפכה:** אותה מחווה בדיוק, על אותו כרטיס
        // בלתי-חשוף, חייבת עכשיו **להוריד את המונה**. מי שיחזיר את שער ה-`revealed`
        // יאדים כאן, וזה בדיוק תפקידה.
        // ⚠️ **ומה ש-`D-033` באמת שמר ⛔ לא אבד:** הערוץ הנגיש — שני הכפתורים —
        // ⛔ עדיין מאחורי החשיפה, ולכן הוא עדיין מציג תשובה לפני שהוא מבקש שיפוט.
        // ההחלקה היא **הערכה עצמית**, התנהגות התקן בכל חפיסת SRS.
        const before = await remainingNow();
        const box = await page.locator('[data-flashcard]').first().boundingBox();
        const midY = Math.round(box.y + box.height / 2);
        await page.mouse.move(Math.round(width / 2) - 40, midY);
        await page.mouse.down();
        await page.mouse.move(Math.round(width / 2) + 40, midY, { steps: 8 });
        await page.mouse.up();
        const afterBlind = await remainingNow();
        check(
          afterBlind === before - 1,
          `${at} T-292: swipe grades before the reveal too`,
          `remaining ${before} → ${afterBlind} (expected ${before - 1})`,
        );

        // 🔴 **ⓐⓑ ⟦NEW 13/09 · `T-333` · `F-242`⟧ הכרטיס **עף**, והבא חי מתחתיו — בו-זמנית.**
        // 🔬 **נמדד לפני התיקון:** ההיסט המרבי היה **77px** מתוך מסך **390px**, כלומר
        // בדיוק המרחק שהאצבע גררה ⇒ ⛔ לא הייתה יציאה, הייתה החלפה. המפרט שרוי כתב
        // דורש **גם** «הכרטיס עף אל מחוץ למסך באנימציה חלקה» **וגם** «ללא שום השהיה…
        // ומיד תחתיו מתגלה כרטיס המילה הבא» ⇒ שתי הטענות למטה נמדדות **יחד**, כי
        // כל אחת לבדה ניתנת לסיפוק על חשבון השנייה.
        {
          await page.reload({ waitUntil: 'networkidle' });
          const cardBox = await page.locator('[data-flashcard]').first().boundingBox();
          const cardMidY = Math.round(cardBox.y + cardBox.height / 2);
          await page.evaluate(() => {
            window.__exitTrack = { maxLeft: 0, minLeft: 0, liveReadyAtMs: null };
            const t0 = performance.now();
            const tick = () => {
              const leaving = document.querySelector('[data-card-leaving] [data-flashcard]');
              if (leaving) {
                const left = leaving.getBoundingClientRect().left;
                window.__exitTrack.maxLeft = Math.max(window.__exitTrack.maxLeft, left);
                window.__exitTrack.minLeft = Math.min(window.__exitTrack.minLeft, left);
              }
              if (
                window.__exitTrack.liveReadyAtMs === null &&
                document.querySelector('article:not([data-card-leaving]) [data-reveal]')
              ) {
                window.__exitTrack.liveReadyAtMs = Math.round(performance.now() - t0);
              }
              if (performance.now() - t0 < 1600) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          await page.mouse.move(Math.round(width / 2) - 50, cardMidY);
          await page.mouse.down();
          await page.mouse.move(Math.round(width / 2) + 50, cardMidY, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(1700);
          const track = await page.evaluate(() => window.__exitTrack);
          check(
            track.maxLeft >= width,
            `${at} T-333: the graded card flies clear of the screen`,
            `it reached left=${Math.round(track.maxLeft)} on a ${width}px screen`,
          );
          check(
            track.liveReadyAtMs !== null && track.liveReadyAtMs <= 50,
            `${at} T-333: the next card is live while the old one is still flying`,
            `the next card became tappable after ${track.liveReadyAtMs}ms`,
          );
          report(
            `${at} T-333: exit reached left=${Math.round(track.maxLeft)} (screen ${width}px) · next card ready in ${track.liveReadyAtMs}ms`,
          );
          await page.reload({ waitUntil: 'networkidle' });
        }

        // ⓑ ואחרי חשיפה — אותו ערוץ בדיוק, על הכרטיס הבא שתפס את המקום.
        // ⚠️ **⟦13/09⟧ נמדד בבדיקת המוטציה של `T-292`:** כשההחלקה העיוורת ⛔ אינה מדרגת,
        // הכרטיס ⛔ אינו עוזב — הוא **נחשף** — ואז `.click()` על `[data-reveal]` נתקע
        // 30 שניות ו**זורק**. ⛔ זריקה מאבדת את כל פלט הבדיקות שנצבר, כלומר המוטציה
        // נתפסה ⛔ בלי לומר במה. ⇒ נוכחות הכפתור נבדקת **כבדיקה בשם** לפני ההקשה.
        const revealAfterBlind = await page.locator('[data-reveal]').count();
        check(
          revealAfterBlind >= 1,
          `${at} T-292: the next card arrives unrevealed`,
          `[data-reveal] count is ${revealAfterBlind} ⇒ the blind swipe revealed instead of grading`,
        );
        if (revealAfterBlind >= 1) await page.locator('[data-reveal]').first().click();
        const revealed = await remainingNow();
        await page.mouse.move(Math.round(width / 2) - 40, midY);
        await page.mouse.down();
        await page.mouse.move(Math.round(width / 2) + 40, midY, { steps: 8 });
        await page.mouse.up();
        const afterSwipe = await remainingNow();
        check(
          afterSwipe === revealed - 1,
          `${at} swipe right grades the card`,
          `remaining ${revealed} → ${afterSwipe}`,
        );

        // ⓒ D-042ⓐ — מחווה שמתחילה ברצועת הקצה ⛔ אינה מסמנת. זו הבדיקה
        // ששומרת על ההחלקה «אחורה» של iOS Safari, והיא **שלילית בכוונה**.
        await page.locator('[data-reveal]').first().click();
        const beforeEdge = await remainingNow();
        await page.mouse.move(5, midY);
        await page.mouse.down();
        await page.mouse.move(200, midY, { steps: 8 });
        await page.mouse.up();
        check(
          (await remainingNow()) === beforeEdge,
          `${at} edge-zone swipe ⛔ does not grade (D-042ⓐ)`,
          `remaining moved ${beforeEdge} → ${await remainingNow()}`,
        );

        // ⚠️ Placed AFTER ⓒ on purpose (measured C-0494): ⓒ's bare `[data-reveal]` click reveals
        // the first UNREVEALED card; had this block revealed it first, ⓒ would have revealed
        // the next card and scrolled the deck to it, and the T-233 drive below landed off-screen.
        // T-259ⓑ — the look-ahead: 100px to the right lights the «ידעתי» badge; back
        // under the 64px threshold puts it out; lifting there grades NOTHING (D-042ⓑ).
        {
          const previewCard = page.locator('[data-flashcard]').first();
          if ((await previewCard.locator('[data-reveal]').count()) > 0) {
            await previewCard.locator('[data-reveal]').click();
          }
          // ⚠️ Measured C-0494: ⓒ's drag from the page margin across the card SELECTED its text,
          // and a mousedown on selected text starts a native drag ⇒ `pointercancel`, one
          // `pointermove` delivered, the gesture dead. A learner has nothing selected; the
          // harness clears its own artefact before it measures.
          await page.evaluate(() => {
            window.getSelection()?.removeAllRanges();
            window.scrollTo(0, 0);
          });
          const beforePreview = await remainingNow();
          const pbox = await previewCard.boundingBox();
          const px0 = Math.round(width / 2) - 50;
          const py0 = Math.round(pbox.y + pbox.height / 2);
          await page.mouse.move(px0, py0);
          await page.mouse.down();
          await page.mouse.move(px0 + 100, py0, { steps: 8 });
          await page.waitForFunction(
            () => getComputedStyle(document.querySelector('[data-swipe-badge="good"]')).opacity === '1',
            null,
            { timeout: 1000 },
          ).catch(() => null);
          const lit = await page.evaluate(() => ({
            preview: document.querySelector('[data-flashcard]').getAttribute('data-swipe-preview'),
            badge: getComputedStyle(document.querySelector('[data-swipe-badge="good"]')).opacity,
          }));
          check(lit.preview === 'good' && lit.badge === '1', `${at} T-259ⓑ: 100px right lights «ידעתי» on the card`, JSON.stringify(lit));
          await page.mouse.move(px0 + 10, py0, { steps: 4 });
          await page.waitForFunction(
            () => document.querySelector('[data-flashcard]').getAttribute('data-swipe-preview') === null,
            null,
            { timeout: 1000 },
          ).catch(() => null);
          const out = await page.evaluate(() => document.querySelector('[data-flashcard]').getAttribute('data-swipe-preview'));
          check(out === null, `${at} T-259ⓑ: back under the threshold, the preview is gone`, `preview="${out}"`);
          await page.mouse.up();
          check((await remainingNow()) === beforePreview, `${at} T-259ⓑ: lifting under 64px grades nothing`, `remaining ${beforePreview} → ${await remainingNow()}`);
        }

        // ⓓ T-233 · `apple-design` § 2 — `setPointerCapture`: a finger that LEAVES the
        // section before it lifts still grades. Measured before the fix: without capture
        // the `pointerup` lands on whatever is under the finger (here the deck header),
        // the section never hears it, and the card hangs mid-gesture with nobody grading
        // it. The gesture starts 12px inside the section's top edge and lifts 24px above
        // it, so the horizontal run (+120px) stays well inside `SWIPE_MAX_ANGLE_DEG` and
        // the ONLY thing this measures is where the finger let go.
        // ⚠️ Measured C-0488, ⛔ not assumed: the deck renders EVERY remaining card as its
        // own `[data-flashcard]` section, and after ⓒ the FIRST card is still revealed
        // (the edge swipe graded nothing). A bare `[data-reveal]` click here would reveal
        // the SECOND card and scroll it into view, pushing the first section to y≈−478 —
        // the gesture below would then land off-screen and "measure" a hang that is not
        // one. ⇒ reveal the first section only if it is not revealed yet, and pin the
        // scroll to the top so its box is the one on screen.
        const firstCard = page.locator('[data-flashcard]').first();
        if ((await firstCard.locator('[data-reveal]').count()) > 0) {
          await firstCard.locator('[data-reveal]').click();
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        const beforeLeave = await remainingNow();
        const section = await firstCard.boundingBox();
        const leaveStartX = Math.round(width / 2) - 60;
        const leaveStartY = Math.round(section.y) + 12;
        await page.mouse.move(leaveStartX, leaveStartY);
        await page.mouse.down();
        await page.mouse.move(leaveStartX + 120, Math.round(section.y) - 24, { steps: 8 });
        await page.mouse.up();
        check(
          (await remainingNow()) === beforeLeave - 1,
          `${at} finger that leaves the card still grades (T-233 · pointer capture)`,
          `remaining ${beforeLeave} → ${await remainingNow()} — the card hung mid-gesture`,
        );
        // T-259 — a TAKEN grade removes the card; it must ⛔ never spring back into the deck.
        await page.waitForTimeout(600);
        check(
          (await remainingNow()) === beforeLeave - 1,
          `${at} T-259: a taken grade stays taken after the spring settles`,
          `remaining is ${await remainingNow()}, expected ${beforeLeave - 1}`,
        );
      }

      // A 404 route legitimately logs a 404; every other route must be silent — except for
      // the one request this harness itself makes impossible (see EXPECTED_CONSOLE).
      if (route !== '/does-not-exist') {
        const unexpected = consoleErrors.filter(
          (line) => !(EXPECTED_CONSOLE[route] ?? []).some((allowed) => allowed.test(line)),
        );
        check(unexpected.length === 0, `${at} clean console`, `errors: ${unexpected.join(' · ')}`);
      }

      // ⛔ T-347 — and this one runs on EVERY route, `/does-not-exist` included: a 404 is a
      // response, ⛔ not an exception, and the error page is a screen like any other.
      check(
        uncaught.length === 0,
        `${at} ⛔ no uncaught exception`,
        `threw: ${uncaught.join(' · ')}`,
      );
    }

    await context.close();
  }

  // ---- 2b. dark mode is measured, not declared (T-028) --------------------
  // Dark mode is a claim about pixels, so measure pixels. One route, one width:
  // the tokens are global, so if `/` flips, every screen flips.
  {
    const darkCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'dark',
    });
    const darkPage = await darkCtx.newPage();
    const darkUncaught = watchUncaught(darkPage);
    await darkPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const dark = await darkPage.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, fg: s.color };
    });
    check(darkUncaught.length === 0, 'dark / ⛔ no uncaught exception', `threw: ${darkUncaught.join(' · ')}`);
    await darkCtx.close();

    const lightCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
    });
    const lightPage = await lightCtx.newPage();
    const lightUncaught = watchUncaught(lightPage);
    await lightPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const light = await lightPage.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, fg: s.color };
    });
    check(lightUncaught.length === 0, 'light / ⛔ no uncaught exception', `threw: ${lightUncaught.join(' · ')}`);
    await lightCtx.close();

    check(dark.bg !== light.bg, 'dark mode changes the page background', `both are ${dark.bg}`);
    check(dark.fg !== light.fg, 'dark mode changes the body text colour', `both are ${dark.fg}`);
    check(dark.bg === 'rgb(15, 23, 42)', 'dark surface is the --surface token', `got ${dark.bg}`);
  }

  // ---- 2b′. reduced motion is measured, not declared (T-243 · T-259 · שכבה א׳ א7) ------
  // One route, one width: `/dev/card` under `prefers-reduced-motion: reduce`. The drag must
  // move NOTHING (`dragOffset` ⇒ x 0), the badge must still light (feedback survives as
  // state, ⛔ not as motion — apple-design § 14), and the release must have no duration and
  // no pose (`releaseCurve` ⇒ ms 0; `release()` writes no transform).
  {
    const rmCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      reducedMotion: 'reduce',
    });
    const rmPage = await rmCtx.newPage();
    const rmUncaught = watchUncaught(rmPage);
    await rmPage.goto(`${BASE}/dev/card`, { waitUntil: 'networkidle' });
    await rmPage.locator('[data-reveal]').click();
    const rmBox = await rmPage.locator('[data-flashcard]').boundingBox();
    const rmX = Math.round(375 / 2) - 50;
    const rmY = Math.round(rmBox.y + rmBox.height / 2);
    await rmPage.mouse.move(rmX, rmY);
    await rmPage.mouse.down();
    await rmPage.mouse.move(rmX + 100, rmY, { steps: 8 });
    await rmPage
      .waitForFunction(
        () => document.querySelector('[data-flashcard]').getAttribute('data-swipe-preview') === 'good',
        null,
        { timeout: 1000 },
      )
      .catch(() => null);
    const rmDuring = await rmPage.evaluate(() => {
      const card = document.querySelector('[data-flashcard]');
      return {
        transform: getComputedStyle(card).transform,
        preview: card.getAttribute('data-swipe-preview'),
        badge: getComputedStyle(document.querySelector('[data-swipe-badge="good"]')).opacity,
      };
    });
    check(
      rmDuring.transform === 'none',
      'reduced motion: the card does not move under the finger (שכבה א׳ א7)',
      `transform ${rmDuring.transform}`,
    );
    check(
      rmDuring.preview === 'good' && rmDuring.badge === '1',
      'reduced motion: the badge still lights — feedback as state, not motion',
      JSON.stringify(rmDuring),
    );
    await rmPage.mouse.up();
    const rmAfter = await rmPage.evaluate(() => {
      const card = document.querySelector('[data-flashcard]');
      return { transform: getComputedStyle(card).transform, ms: card.style.getPropertyValue('--kol-release-ms') };
    });
    check(
      rmAfter.transform === 'none' && (rmAfter.ms === '' || rmAfter.ms === '0ms'),
      'reduced motion: the release has no duration and moves nothing',
      JSON.stringify(rmAfter),
    );
    check(rmUncaught.length === 0, 'reduced-motion /dev/card ⛔ no uncaught exception', `threw: ${rmUncaught.join(' · ')}`);
    await rmCtx.close();
  }

  // ---- 2c. the arena is measured where it is painted (T-214 · D-134) -------
  // ⛔ Block 2b measures `document.body` on `/` and NOTHING else. That is why 2,889 green
  // tests never saw three arena text nodes under the Layer A floor: a screen that paints
  // its OWN surfaces is invisible to a body-level probe. This block is therefore
  // per-SCREEN and ⛔ not per-component — C-0332 measured the spell card in isolation,
  // got 15.61:1, and shipped a screen with three other failures still on it.
  //
  // The effective background is taken from `elementsFromPoint` at the node's centre and
  // ⛔ not from an ancestor walk: the enemy health number is painted ON TOP of an
  // absolutely-positioned sibling (the health fill), so an ancestor walk would report the
  // track colour and pass a number nobody can read.
  //
  // ⚠️ **D-134, word for word: the gate is per SCREEN, ⛔ not per component.** A home
  // screen painting its own dark surfaces is exactly the shape that hid three failures on
  // the battle screen until T-214 measured it — so `/dev/arcade/home` (T-181) is walked
  // here by the same probe, ⛔ and nothing inside `page.evaluate` changed to make it fit.
  {
    for (const route of ARENA_SCREENS) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({
        viewport: { width: 375, height: 780 },
        colorScheme: scheme,
      });
      const page = await ctx.newPage();
      const uncaught = watchUncaught(page);
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-arena-scope]');

      const measured = await page.evaluate(() => {
        const parse = (value) => {
          const m = /rgba?\(([^)]+)\)/.exec(value ?? '');
          if (m === null) return null;
          const parts = m[1].split(',').map((n) => Number.parseFloat(n.trim()));
          const [r, g, b] = parts;
          const a = parts.length > 3 ? parts[3] : 1;
          if ([r, g, b].some((n) => Number.isNaN(n))) return null;
          return { r, g, b, a };
        };
        const lum = ({ r, g, b }) => {
          const f = (c) => {
            const v = c / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (fg, bg) => {
          const a = lum(fg);
          const b = lum(bg);
          const hi = Math.max(a, b);
          const lo = Math.min(a, b);
          return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
        };
        const show = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;

        /** The first painted surface at this point, the node itself included. */
        const backgroundAt = (el, x, y) => {
          const stack = document.elementsFromPoint(x, y);
          const from = stack.indexOf(el);
          const below = from === -1 ? stack : stack.slice(from);
          for (const candidate of below) {
            const bg = parse(getComputedStyle(candidate).backgroundColor);
            if (bg !== null && bg.a > 0.5) return bg;
          }
          const body = parse(getComputedStyle(document.body).backgroundColor);
          return body !== null && body.a > 0.5 ? body : { r: 255, g: 255, b: 255, a: 1 };
        };

        const scope = document.querySelector('[data-arena-scope]');
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
        const nodes = [];
        const failing = [];
        let worst = null;
        for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
          const text = (n.textContent ?? '').trim();
          if (text === '') continue;
          const el = n.parentElement;
          if (el === null) continue;
          const style = getComputedStyle(el);
          if (style.visibility === 'hidden' || style.display === 'none') continue;
          if (Number.parseFloat(style.opacity) === 0) continue;
          const rect = el.getBoundingClientRect();
          // sr-only lives in a 1px clipped box — it is read aloud, ⛔ never painted.
          if (rect.width * rect.height < 16) continue;
          const fg = parse(style.color);
          if (fg === null) continue;
          const x = Math.min(window.innerWidth - 1, Math.max(0, rect.x + rect.width / 2));
          const y = Math.min(window.innerHeight - 1, Math.max(0, rect.y + rect.height / 2));
          const bg = backgroundAt(el, x, y);
          const entry = { text: text.slice(0, 24), ratio: ratio(fg, bg), color: show(fg), bg: show(bg) };
          nodes.push(entry);
          if (worst === null || entry.ratio < worst.ratio) worst = entry;
          if (entry.ratio < 4.5) failing.push(entry);
        }

        // ⛔ Icons are not text, and a text-node walk is blind to them: the close
        // control paints with `currentColor`, and once the stage took a background of
        // its own it measured 1.27:1 in the light scheme.
        //
        // ⚠️ **CONTROLS ONLY, and the reason is measured ⛔ not stylistic:** the stage
        // figures paint their own backdrop as an SVG `<rect>`, and a CSS
        // `background-color` probe cannot see an SVG fill — measuring them here reports
        // the stage colour behind the artwork and fails a figure that is perfectly
        // legible. The avatar's own layers are `components/ArenaAvatar.tsx`, i.e. T-215.
        // ⇒ what is measured here is every icon a learner can PRESS.
        const icons = [];
        let skipped = 0;
        let measured = 0;
        const seen = new Set();
        const collectIcons = () => {
          for (const el of scope.querySelectorAll('a svg, a svg *, button svg, button svg *, [role="button"] svg, [role="button"] svg *')) {
            if (seen.has(el)) continue;
            const cs = getComputedStyle(el);
            const fg = parse(cs.color);
            if (fg === null) continue;
            const paints = [cs.fill, cs.stroke].map(parse).filter((c) => c !== null);
            if (!paints.some((c) => c.r === fg.r && c.g === fg.g && c.b === fg.b && c.a > 0.5)) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width * rect.height < 100) continue;
            /* 📍 **⟦19/09 · `C-0726`⟧ נקודת הדגימה היא **החלק הנראה**, ⛔ ולא מרכז
               שהוצמד לקצה המסך.** 🔬 **נמדד כשהרשימה גדלה לשש דמויות:** שלוש
               הכרטיסיות האחרונות יושבות **מתחת לקו הגלילה** של ה-`<ul>`, והשורה
               שהייתה כאן הצמידה (`clamp`) את מרכזן אל תוך המסך ⇒ הבדיקה דגמה
               **נקודה שבה הדמות ⛔ אינה מצוירת**, קיבלה את רקע הבמה, והאדימה על
               פני ה`צל` — `1.14:1` מול `--arena-night` שהן ⛔ לא נוגעות בו.
               ⇒ ⛔ **צורה שאינה נראית ⛔ אינה נמדדת** — ⛔ לא «עוברת» ו⛔ לא «נכשלת»:
               היא נספרת ב-`skipped`, והמספר חוזר החוצה כדי שהדילוג ⛔ לא יהיה שקט. */
            const vx0 = Math.max(0, rect.left); const vy0 = Math.max(0, rect.top);
            const vx1 = Math.min(window.innerWidth, rect.right);
            const vy1 = Math.min(window.innerHeight, rect.bottom);
            if (vx1 <= vx0 || vy1 <= vy0) { skipped += 1; continue; }
            const x = (vx0 + vx1) / 2; const y = (vy0 + vy1) / 2;
            /* ⛔ **ועדיין ⛔ לא מספיק:** צומת יכול להיות בתוך המסך ועדיין **חתוך
               בידי גולל** או מכוסה. ⇒ אם הוא ⛔ אינו בערימה בנקודה שלו, הוא ⛔ אינו
               נראה שם, ו⛔ אין מה למדוד. */
            const stack = document.elementsFromPoint(x, y);
            if (!stack.includes(el)) { skipped += 1; continue; }
            /* 🎭 **⟦19/09 · `C-0724`⟧ בתוך דמות — **הצללית** נמדדת, וההצללה ⛔ לא.**
               🔬 **שני מדידות, ⛔ ולא דעה אחת:**
               ① הבדיקה הזאת הודיעה על שכנות **שאינה קיימת** — פני הקוסם נמדדו
                  «‏1.07:1 על `--arena-card`», אלא שהן יושבות על **החרוט**. הן ⛔ לא
                  נוגעות בכרטיס באף נקודה.
               ② וכשלימדתי אותה למדוד את מה שבאמת מאחור, היא דרשה 3:1 **מכל מדרגת
                  הצללה** — כתפייה על גוף, ניצב על להב, בליטה על מגן. ⇒ זו בדיוק
                  הדרישה שמשטחת איור: 🔬 ברנדר עצמו, ש-`36 § 14.4` מכריז **מחייב**,
                  הכתפייה נותנת **1.48:1** על הגוף.
               ⇒ **הכלל שנשאר הוא זה שאפשר להגן עליו**: צורה שיושבת **על המשטח**
               חייבת 3:1 — כלומר «רואים את הדמות», וזה **כל** מה שהבדיקה הזאת
               התיימרה לשמור; צורה שיושבת **על צורת-דמות אחרת** היא איור, והעניין
               שלה נשמר במקום אחר — שער העיניים (`C-0719`), שמודד בדיוק את הפרט
               שבלעדיו הדמות חוזרת להיות חסרת פנים.
               ⛔ **וזו ⛔ אינה הקלה שקטה:** ⓐ כל תשע הצורות שיושבות על המשטח
               נמדדו ועוברות (פלדה 3.92 · צפחה 3.27 · כתפייה 7.35 · עור 8.65 ·
               שיער 4.70 · להב 11.55 · חרוט 6.08 · צד מוצל 3.27 · זהב 7.29),
               ⓑ והשורה נרשמה כממצא עם המספרים. */
            const figure = el.closest('[data-arena-figure]');
            if (figure !== null) {
              /* ⛔ **מאחור בסדר הציור, ⛔ ולא «כל צורה בנקודה».** 🔬 הגרסה הראשונה שלי
                 לקחה את הצומת הראשון שאינו `el` — ⇒ במרכז הגוף היא קיבלה את **קו
                 האמצע שמעליו** והכריזה «יש משהו מאחור», כלומר **דילגה על הצללית**.
                 ⛔ **וזה ⛔ לא נתפס בקריאה — זה נתפס במוטציה**: צביעת הגוף בגוון
                 הכרטיס השאירה את השער **ירוק**. ⇒ `elementsFromPoint` מחזיר מלמעלה
                 למטה, והחיתוך אחרי `el` הוא **בדיוק** מה שמאחוריו.
                 ⛔ **ו-`<g>` ⛔ אינו נמדד בתוך דמות** — הוא ⛔ אינו משתתף ב-hit-test,
                 ולכן ⛔ אי-אפשר לדעת על מה הוא יושב; ילדיו נמדדים ממילא. */
              if (el.tagName === 'g') { skipped += 1; continue; }
              const i = stack.indexOf(el);
              const behind = i < 0 ? undefined
                : stack.slice(i + 1).find((n) => figure.contains(n) && !n.contains(el) && 'getBBox' in n);
              if (behind !== undefined) continue;
            }
            const bg = backgroundAt(el, x, y);
            const r = ratio(fg, bg);
            measured += 1;
            seen.add(el);
            if (r < 3) icons.push({ label: el.closest('[data-arena-close]') !== null ? 'close' : el.tagName, ratio: r, color: show(fg), bg: show(bg) });
          }
        };

        /* 🔴 **⟦19/09 · `C-0726`⟧ הבדיקה **גוללת**, ⛔ ואינה בודקת רק את מה שנפתח.**
           🔬 **נמדד ברגע שהרשימה גדלה לשש דמויות:** שלוש הכרטיסיות האחרונות יושבות
           מתחת לקו הגלילה של ה-`<ul>` ⇒ עם תיקון ה«⛔ לא נראה ⇒ ⛔ לא נמדד» שמעליו,
           **שלוש דמויות ⛔ לא היו נבדקות כלל** — והשער היה נשאר ירוק. ⇒ זו הייתה
           הופכת להיות הקלה שקטה, וזה בדיוק מה שהתיקון ⛔ לא אמור לעשות.
           ⇒ הלולאה רצה שוב בכל מיקום גלילה, ו-`seen` מונע מדידה כפולה. */
        collectIcons();
        const scrollers = [...scope.querySelectorAll('*')]
          .filter((n) => n.scrollHeight > n.clientHeight + 4 && n.clientHeight > 40);
        for (const sc of scrollers) {
          const max = sc.scrollHeight - sc.clientHeight;
          const step = Math.max(40, sc.clientHeight - 24);
          for (let top = step; top < max; top += step) { sc.scrollTop = top; collectIcons(); }
          sc.scrollTop = max; collectIcons();
          sc.scrollTop = 0;
        }

        // The unselected spell card: its boundary is the ONLY thing separating it from
        // the stage — the fill measures 1.06:1 against the night blue behind it.
        const card = document.querySelector('[data-arena-card][aria-pressed="false"]');
        let cardEdge = null;
        if (card !== null) {
          const cs = getComputedStyle(card);
          const edge = parse(cs.borderTopColor);
          const fill = parse(cs.backgroundColor);
          const rect = card.getBoundingClientRect();
          const stage = backgroundAt(card, rect.x + rect.width / 2, rect.y - 6);
          if (edge !== null && fill !== null) {
            cardEdge = {
              vsFill: ratio(edge, fill),
              vsStage: ratio(edge, stage),
              edge: show(edge),
            };
          }
        }

        const scopeBg = parse(getComputedStyle(scope).backgroundColor);
        return { count: nodes.length, worst, failing, icons, iconsMeasured: measured, iconsSkipped: skipped, cardEdge, scopeOpaque: scopeBg !== null && scopeBg.a > 0.5, scopeBg: getComputedStyle(scope).backgroundColor };
      });

      await ctx.close();

      const at = `${scheme} ${route}`;
      check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);
      check(measured.count > 0, `${at} the arena paints text at all`, 'zero text nodes under [data-arena-scope]');
      // ⛔ The scope with no background of its own is the whole defect (F-155): the arena
      // then inherits the PAGE surface, which flips with prefers-color-scheme.
      check(measured.scopeOpaque, `${at} the arena declares its own surface`, `[data-arena-scope] background is ${measured.scopeBg}`);
      // ⛔ Fails BY NAME on the first node under the floor — ⛔ not a count.
      check(
        measured.worst !== null && measured.worst.ratio >= 4.5,
        `${at} · every arena text node clears 4.5:1 (${measured.count} nodes)`,
        measured.worst === null
          ? 'nothing measured'
          // ⛔ EVERY node under the floor, by its own text — ⛔ not a count and ⛔ not
          // only the worst one: naming a single node hides how wide the failure is.
          : measured.failing
              .map((n) => `"${n.text}" is ${n.ratio}:1 (${n.color} on ${n.bg})`)
              .join(' · '),
      );
      check(
        measured.icons.length === 0,
        `${at} · every pressable arena icon clears 3:1`,
        measured.icons.map((i) => `${i.label} is ${i.ratio}:1 (${i.color} on ${i.bg})`).join(' · '),
      );
      /* 🔴 **⟦19/09 · `C-0726`⟧ הדילוג ⛔ אינו שקט.** הלולאה מעליה מדלגת על כל מה
         שאינו **נראה** בנקודתו (גלול מחוץ לגולל, חתוך, מכוסה) — וזה נכון, אבל זו
         בדיוק הדרך שבה שער מפסיק למדוד בלי שאיש שם לב: `0 failures` נראה זהה בין
         «הכול עובר» לבין «⛔ לא נבדק דבר». ⇒ השורה הזאת דורשת שמשהו **כן** נמדד. */
      check(
        measured.iconsMeasured > 0,
        `${at} · the pressable-icon check actually measured something`,
        `measured ${measured.iconsMeasured} · skipped ${measured.iconsSkipped} — 0 measured means the loop stopped seeing the screen`,
      );
      // ⛔ **The spell card lives on the battle screen only** — the home screen has no
      // hand, and `measured.cardEdge === null` there is the CORRECT state, ⛔ not a
      // failure. Asserting it everywhere would have forced a card onto a screen the
      // render ⛔ does not draw one on.
      if (measured.cardEdge !== null) {
        check(
          measured.cardEdge.vsFill >= 3,
          `${at} · spell-card border clears 3:1 against its fill`,
          `border ${measured.cardEdge.edge} is ${measured.cardEdge.vsFill}:1`,
        );
        check(
          measured.cardEdge.vsStage >= 3,
          `${at} · spell-card border clears 3:1 against the stage`,
          `border ${measured.cardEdge.edge} is ${measured.cardEdge.vsStage}:1`,
        );
      }
    }
    }
  }

  // ---- 2d. T-423ⓒ · the arena's vertical budget, measured in a real browser ----
  //
  // 🔴 **`36 § 8.0` ② — `56+110+330+44+28+196+68+20 = 852`.** The eight numbers were read
  // from Figma (`v216k02v3L0azhfOw3y2ur / 3316:2`, 393×852) as COORDINATES: every band
  // starts exactly where the previous one ends, so the stack carries ⛔ no gap and the
  // sum is the viewport itself.
  //
  // ⚠️ **This block exists because `jsdom` ⛔ cannot measure layout.** The source scan in
  // `components/ArenaBattle.test.ts` proves each band DECLARES its height; only a real
  // browser proves the declaration SURVIVES — that the section equals the viewport, that
  // nothing scrolls, and that no band was silently compressed by the one above it.
  //
  // ⛔ **320×568 carries ⛔ no height claim, and that is deliberate:** 522px of declared
  // bands against a 568px viewport leaves the stage 46px — it compresses, by design, and
  // asserting 330 there would be asserting a number the screen ⛔ cannot have. What holds
  // at every width is the one claim that matters to a learner: ⛔ nothing scrolls.
  {
    const BUDGET = [
      { mark: '[data-arena-clock]', px: 56, band: 'top-bar' },
      { mark: '[data-arena-enemy-block]', px: 110, band: 'enemy-block' },
      { mark: '[data-arena-mana]', px: 44, band: 'mana' },
      { mark: '[data-arena-hintrow]', px: 28, band: 'hint' },
      { mark: '[data-arena-hand]', px: 120, band: 'deck' }, // T-459 — 196 left ~97px empty under 100px cards
      { mark: '[data-arena-abilities]', px: 68, band: 'abilities' },
      { mark: '[data-arena-isolation]', px: 20, band: 'bottom' },
    ];
    // 393×852 and 430×932 carry the height claims; 320×568 carries ⑵ alone.
    const SIZES = [
      { width: 393, height: 852, heights: true },
      { width: 430, height: 932, heights: true },
      { width: 320, height: 568, heights: false },
    ];

    for (const size of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height } });
      const page = await ctx.newPage();
      const uncaught = watchUncaught(page);
      await page.goto(`${BASE}/dev/arcade`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-arena-scope]');

      const m = await page.evaluate((budget) => {
        const scope = document.querySelector('[data-arena-scope]');
        const doc = document.documentElement;
        return {
          section: Math.round(scope.getBoundingClientRect().height),
          client: doc.clientHeight,
          scroll: doc.scrollHeight,
          header: document.querySelector('header')?.getBoundingClientRect().height ?? 0,
          stage: Math.round(
            document.querySelector('[data-arena-stage-area]')?.getBoundingClientRect().height ?? -1,
          ),
          bands: budget.map((b) => ({
            ...b,
            got: Math.round(document.querySelector(b.mark)?.getBoundingClientRect().height ?? -1),
          })),
        };
      }, BUDGET);

      const at = `T-423ⓒ · /dev/arcade @ ${size.width}×${size.height}`;

      check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);

      // ⑵ — the one claim that holds at EVERY width. ⛔ A battle with a 90-second clock
      // that asks the learner to scroll is a loss, ⛔ not an inconvenience (`F-260`).
      check(m.scroll === m.client, `${at} · ⛔ nothing scrolls`, `scrollHeight ${m.scroll} vs clientHeight ${m.client}`);

      // ⛔ **The app chrome is gone on this route, and that is measured, ⛔ not assumed.**
      check(m.header === 0, `${at} · the app header is not on the battle route`, `header is ${m.header}px`);

      if (!size.heights) {
        await ctx.close();
        continue;
      }

      // ⑴ — the section IS the viewport.
      check(
        m.section === m.client,
        `${at} · the section fills the viewport exactly`,
        `section ${m.section} vs clientHeight ${m.client}`,
      );

      // ⑶ — every non-stage band returns its declared height, ±1px for sub-pixel rounding.
      for (const b of m.bands) {
        check(
          Math.abs(b.got - b.px) <= 1,
          `${at} · band ${b.band} is ${b.px}px`,
          `${b.mark} measured ${b.got}px`,
        );
      }

      // ⑷ — and the stage, the only flexible band, still has a battle in it.
      check(m.stage >= 280, `${at} · the stage keeps at least 280px`, `stage is ${m.stage}px`);

      await ctx.close();
    }

    // 🔴 **THE INVERSE PROOF, and it is ⛔ not optional.** The rule that removes the
    // chrome lives in `app/arcade/arcade-tokens.css` and is keyed on `:has([data-arena-scope])`,
    // but the `<header>` it removes belongs to `app/layout.tsx` — **the root of the whole
    // product**. ⇒ a screen that is ⛔ not the arena must still measure **52px**, ⛔ not 0.
    // ⛔ Without this line the gate could not tell "scoped correctly" from "deleted the
    // product's header everywhere".
    {
      const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
      const page = await ctx.newPage();
      const uncaught = watchUncaught(page);
      await page.goto(`${BASE}/dev/tabs/me`, { waitUntil: 'networkidle' });
      const header = await page.evaluate(
        () => Math.round(document.querySelector('header')?.getBoundingClientRect().height ?? -1),
      );
      const at = 'T-423ⓒ · /dev/tabs/me';
      check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);
      check(
        header === 52,
        `${at} keeps the product header — the rule is scoped to the arena`,
        `header is ${header}px, expected 52`,
      );
      await ctx.close();
    }
  }

  // ---- 2e. T-420 · the arena HOME screen fits the device, measured in a real browser ----
  //
  // 🔬 `C-0703` measured `scrollHeight − innerHeight` on `/dev/arcade/home` at **460px**
  // (320×568) · **287** (375×667) · **102** (393×852) — the screen was nearly two screens on
  // the smallest phone. The root is now an exact `h-[100dvh]` with the middle scrolling
  // inside itself (`components/ArenaHome.tsx`, `SHELL_CLASS`/`BODY_CLASS`).
  // ⛔ jsdom ⛔ cannot measure layout — the source guard in `ArenaHome.test.ts` proves the
  // DECLARATION; this proves it survives, and that `התחל קרב` is on screen, not clipped.
  {
    for (const size of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 393, height: 852 },
    ]) {
      const ctx = await browser.newContext({ viewport: size });
      const page = await ctx.newPage();
      const uncaught = watchUncaught(page);
      await page.goto(`${BASE}/dev/arcade/home`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-arena-scope]');
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        const start = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('התחל קרב'));
        const r = start?.getBoundingClientRect();
        return {
          client: doc.clientHeight,
          scroll: doc.scrollHeight,
          startTop: r ? Math.round(r.top) : -1,
          startBottom: r ? Math.round(r.bottom) : 1e9,
          startHit: r
            ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('button') === start
            : false,
        };
      });
      const at = `T-420 · /dev/arcade/home @ ${size.width}×${size.height}`;
      check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);
      check(m.scroll === m.client, `${at} · ⛔ nothing scrolls`, `scrollHeight ${m.scroll} vs clientHeight ${m.client}`);
      check(
        m.startTop >= 0 && m.startBottom <= m.client && m.startHit,
        `${at} · \`התחל קרב\` is fully on screen and hit-testable`,
        `top ${m.startTop} · bottom ${m.startBottom} · viewport ${m.client} · hit ${m.startHit}`,
      );
      await ctx.close();
    }
  }

  // ---- 2f. T-425 · one hint line, and the mana count clear of the edge ----
  //
  // 🔬 `C-0773`: the old hint («… · או הקש על קלף ואז על היריב») broke into **2 lines** at
  // 320 and 375 — two competing instructions. It is now one instruction that follows the
  // learner (`DRAG_HINT_HE` ⇄ `TAP_ENEMY_HINT_HE`). ⛔ jsdom ⛔ cannot count lines.
  {
    for (const size of [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 393, height: 852 },
    ]) {
      const ctx = await browser.newContext({ viewport: size });
      const page = await ctx.newPage();
      const uncaught = watchUncaught(page);
      await page.goto(`${BASE}/dev/arcade`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        try { window.localStorage.removeItem('kol.arena.dragTaught'); } catch {}
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('[data-arena-hint]');
      const m = await page.evaluate(() => {
        const hint = document.querySelector('[data-arena-hint]');
        const range = document.createRange();
        range.selectNodeContents(hint);
        const count = [...document.querySelectorAll('[data-arena-mana] *')].find(
          (e) => e.children.length === 0 && /\d+\s*\/\s*\d+/.test(e.textContent ?? ''),
        );
        return {
          lines: new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size,
          countX: count ? Math.round(count.getBoundingClientRect().left) : -1,
        };
      });
      const at = `T-425 · /dev/arcade @ ${size.width}×${size.height}`;
      check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);
      check(m.lines === 1, `${at} · the hint is one line`, `hint wraps to ${m.lines} lines`);
      check(m.countX >= 16, `${at} · the mana count sits ≥16px from the edge`, `count at x=${m.countX}`);
      await ctx.close();
    }
  }

  // ---- 2g. T-428 · the two end screens are inside the arena, measured in a real browser ----
  //
  // 🔬 `C-0708` measured both `/dev/arcade/summary` and `/dev/arcade/result` at `left=24
  // w=345` with a TRANSPARENT section over the light page — the learner won in a dark room
  // and was handed the result on a white form. Both now carry `data-arena-scope`.
  // 👻 `T-430` (`C-0775`) · closes `F-284` — ⛔ no ghost scroll. 🔬 Measured: `body` carried
  // `padding-bottom: 80px` from `globals.css:88` (the reservation for a FIXED `<ActionBar>` on a
  // scrolling page) on top of a `100dvh` section that already reserves the bar itself ⇒ 932/852.
  // ⇒ and the last row of the section must end ABOVE the bar, ⛔ not under it.
  // 🧹 `T-431` (`C-0775`) — `home` and `character` join the same four claims: ⛔ no app header,
  // full width, arena night — measured, ⛔ not assumed from the shared `:has()` rule.
  {
    for (const route of ['/dev/arcade/home', '/dev/arcade/character', '/dev/arcade/summary', '/dev/arcade/result']) {
      for (const size of [{ width: 320, height: 568 }, { width: 393, height: 852 }]) {
        const ctx = await browser.newContext({ viewport: size });
        const page = await ctx.newPage();
        const uncaught = watchUncaught(page);
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
        const m = await page.evaluate(() => {
          const sec = document.querySelector('section[data-arena-scope]');
          const r = sec?.getBoundingClientRect();
          return {
            scoped: sec !== null,
            left: r ? Math.round(r.left) : -1,
            width: r ? Math.round(r.width) : -1,
            client: document.documentElement.clientWidth,
            bg: sec ? getComputedStyle(sec).backgroundColor : '',
            header: Math.round(document.querySelector('body > div > header')?.getBoundingClientRect().height ?? 0),
            scroll: document.documentElement.scrollHeight,
            clientH: document.documentElement.clientHeight,
            barTop: Math.round(document.querySelector('[data-action-bar]')?.getBoundingClientRect().top ?? Infinity),
            contentBottom: sec
              ? Math.round(sec.getBoundingClientRect().bottom - parseFloat(getComputedStyle(sec).paddingBottom))
              : -1,
          };
        });
        const at = `T-428 · T-430 · T-431 · ${route} @ ${size.width}×${size.height}`;
        check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);
        check(m.scoped, `${at} · the root carries data-arena-scope`, 'no section[data-arena-scope]');
        check(
          m.left === 0 && m.width === m.client,
          `${at} · full width`,
          `left ${m.left} · width ${m.width} vs clientWidth ${m.client}`,
        );
        check(m.bg === 'rgb(28, 38, 66)', `${at} · the arena night background`, `background ${m.bg}`);
        check(m.header === 0, `${at} · the app header is not on the arena route`, `header is ${m.header}px`);
        check(m.scroll === m.clientH, `${at} · ⛔ no ghost scroll`, `scrollHeight ${m.scroll} vs clientHeight ${m.clientH}`);
        check(
          m.contentBottom <= m.barTop,
          `${at} · the content ends above the action bar`,
          `content bottom ${m.contentBottom} vs bar top ${m.barTop}`,
        );
        await ctx.close();
      }
    }
  }

  // 🧪 `T-421` (`C-0779`) · המשך של `T-416`ⓑ — **הטענה החיה ש-`T-416` ⛔ לא יכלה לכתוב.**
  // שומר-המקור ב-`ArenaBattle.test.ts` (‏`F-278`) מודד את ה**מחלקה**; זה מודד את ה**פיקסל**:
  // קטע שיחזור ל-`min-h-[100dvh]`+`pb-28` בניסוח שהשומר ⛔ אינו מכיר ייתפס כאן.
  {
    const EXPECT = {
      '/dev/arcade/loading': 'טוען את הזירה',
      '/dev/arcade/too-small': 'ברמה הזאת עוד אין מספיק מילים לקרב',
      '/dev/arcade/schema-missing': 'המאגר עדיין לא הוקם',
      // 🧪 `T-453` (`C-0781`) — אותה תבנית קטע + רצועה ⇒ אותה טענה.
      '/dev/arcade/end': 'שומר את הקרב',
    };
    for (const [route, text] of Object.entries(EXPECT)) {
      for (const size of [{ width: 320, height: 568 }, { width: 375, height: 780 }, { width: 414, height: 896 }]) {
        const ctx = await browser.newContext({ viewport: size });
        const page = await ctx.newPage();
        const uncaught = watchUncaught(page);
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
        const m = await page.evaluate(() => ({
          scroll: document.documentElement.scrollHeight,
          clientH: document.documentElement.clientHeight,
          text: document.body.textContent ?? '',
          sections: document.querySelectorAll('main section, body section').length,
        }));
        const at = `T-421 · ${route} @ ${size.width}×${size.height}`;
        check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);
        check(m.sections > 0, `${at} · the battle's own section rendered`, 'no <section>');
        check(m.text.includes(text), `${at} · the production string is on screen`, `missing «${text}»`);
        check(m.scroll === m.clientH, `${at} · ⛔ nothing scrolls`, `scrollHeight ${m.scroll} vs clientHeight ${m.clientH}`);
        await ctx.close();
      }
    }
  }

  // 🧪 `T-490`…`T-492` (`C-0820`) — **אמירנט נכנסת במסך אחד.** מדידת `C-0819` (`next start`):
  // התרגול +98 · הסיום/הרמות +126 · הדשבורד +22 ב-393×852. כל שורה בטבלה: נתיב · גדלים ·
  // המחרוזת שחייבת להיראות בטעינה · וכמה מקום להשאיר בתחתית (`tabBar` — 73px של `TabBar`,
  // שהנתיב הייצורי מצייר ⛔ ושנתיב ה-`/dev` ⛔ אינו מצייר).
  {
    const TAB_BAR = 73;
    const FIT = [
      // T-490 — שורת הסיבה מעל הסרגל, ⛔ לא מתחת לקיפול.
      { route: '/dev/amirnet/practice', text: 'בחר רמת קושי כדי להתחיל', tabBar: true,
        sizes: [{ width: 393, height: 852 }, { width: 375, height: 812 }] },
      // T-491 — כרטיס החולשה, הדבר היחיד שאומר מה לעשות מחר, נראה בלי לגלול.
      { route: '/dev/amirnet/result', text: 'לתרגול ממוקד בסוג הזה', tabBar: false,
        sizes: [{ width: 393, height: 852 }, { width: 375, height: 812 }] },
      // T-491ⓒ — אותה גלישה, רכיב אחר (`AmirnetLevels`): הרמה הנעולה האחרונה בתוך המסך.
      { route: '/dev/amirnet/levels', text: 'עבור רמה 3 כדי לפתוח', tabBar: false,
        sizes: [{ width: 393, height: 852 }, { width: 375, height: 812 }] },
      // T-492 — ההמלצה היחידה בדשבורד, וקישור המקורות שמתחתיה.
      { route: '/dev/amirnet/dashboard', text: 'מומלץ להתחיל שם', tabBar: false,
        sizes: [{ width: 375, height: 812 }, { width: 393, height: 852 }] },
      { route: '/dev/amirnet/dashboard', text: 'מקורות הנתונים והרישיונות', tabBar: false,
        sizes: [{ width: 375, height: 812 }, { width: 393, height: 852 }] },
      // T-492 — מסך הסימולציה: שורת השעון-לפרק האחרונה במסך.
      { route: '/dev/amirnet/simulation', text: 'אי אפשר להעביר זמן שנותר', tabBar: false,
        sizes: [{ width: 375, height: 812 }, { width: 393, height: 852 }] },
    ];
    for (const { route, text, tabBar, sizes } of FIT) {
      for (const size of sizes) {
        const ctx = await browser.newContext({ viewport: size });
        const page = await ctx.newPage();
        const uncaught = watchUncaught(page);
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
        const m = await page.evaluate((needle) => {
          const hit = [...document.querySelectorAll('body *')].find(
            (e) => e.children.length === 0 && (e.textContent ?? '').includes(needle),
          );
          return {
            scroll: document.documentElement.scrollHeight,
            clientH: document.documentElement.clientHeight,
            bottom: hit ? Math.round(hit.getBoundingClientRect().bottom) : null,
          };
        }, text);
        const at = `T-490…T-492 · ${route} @ ${size.width}×${size.height}`;
        const floor = m.clientH - (tabBar ? TAB_BAR : 0);
        check(uncaught.length === 0, `${at} ⛔ no uncaught exception`, `threw: ${uncaught.join(' · ')}`);
        check(m.scroll <= m.clientH, `${at} · ⛔ nothing scrolls`, `scrollHeight ${m.scroll} vs clientHeight ${m.clientH}`);
        check(m.bottom !== null && m.bottom <= floor, `${at} · «${text}» visible on load`, `bottom ${m.bottom} vs ${floor}`);
        await ctx.close();
      }
    }
  }

  // ---- 3. install offer timing (UX plan T-001) ----------------------------
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 780 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const uncaught = watchUncaught(page);
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const onLoad = await page.locator('aside[aria-label="הוספה למסך הבית"]').count();
    check(onLoad === 0, 'install offer hidden on page load', 'it rendered before any interaction');
    check(uncaught.length === 0, 'install offer / ⛔ no uncaught exception', `threw: ${uncaught.join(' · ')}`);
    await context.close();
  }

  // ---- 4. service worker registers and serves offline (PW-2) --------------
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 780 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const uncaught = watchUncaught(page);
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    const registered = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return false;
      if (reg.active) return true;
      await new Promise((resolve) => {
        const sw = reg.installing || reg.waiting;
        if (!sw) return resolve();
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve();
        });
        setTimeout(resolve, 5000);
      });
      return Boolean((await navigator.serviceWorker.getRegistration())?.active);
    });
    check(registered, 'service worker registers and activates', 'no active registration');

    if (registered) {
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      const body = await page.evaluate(() => document.body.innerText);
      check(
        body.includes('אין חיבור כרגע') || body.includes('אנגלית'),
        'offline reload serves a real Hebrew screen',
        `got: ${body.slice(0, 120)}`,
      );
      await context.setOffline(false);
    }
    check(uncaught.length === 0, 'service worker / ⛔ no uncaught exception', `threw: ${uncaught.join(' · ')}`);
    await context.close();
  }
  } // if (!JOURNEYS_ONLY)

  // ---- 5. journey walks — crossing screens, not measuring one (T-227) -------
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 780 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const uncaught = watchUncaught(page);
    for (const [name, journey] of Object.entries(JOURNEYS)) {
      uncaught.length = 0;
      const result = await walkJourney(page, name, journey);
      // 🔴 The baseline is born as a WARNING, not a failure (plan step 6): `check()`
      // is never called on it. A number that fails the build the day it is first
      // measured teaches every agent after this one to stop trusting it.
      report(
        `journey ${result.name}: taps=${result.taps} · ` +
          `deadEnd=${result.deadEnd.length ? result.deadEnd.join(' · ') : '—'} · ` +
          `nameDrift=${result.nameDrift.length ? result.nameDrift.join(' · ') : '—'} · ` +
          `wayBack=${result.wayBack.length ? result.wayBack.join(' · ') : '—'}`,
      );
      // ⛔ T-347 — the walk crosses screens, so this is the one place an exception thrown by
      // a NAVIGATION (⛔ not by a first paint) can surface at all.
      check(
        uncaught.length === 0,
        `journey ${result.name} ⛔ no uncaught exception`,
        `threw: ${uncaught.join(' · ')}`,
      );
    }
    await context.close();
  }

  /**
   * 🔴 **⟦NEW 15/09 · `C-0619` · `F-257` · `F-258` · תלונת רוי⟧ ההחלקה, כמחווה — ⛔ ולא
   * כקוד שנקרא.**
   *
   * 🔬 **למה זה כאן ו⛔ לא ב-vitest:** `swipeGrade.test.ts` מוכיח את **ההכרעה** על
   * מספרים, ו-`CardDeck.test.ts` הוא שומר-מקור. ⛔ ששניהם יחד ⛔ אינם יכולים להוכיח
   * שאצבע אמיתית מעיפה כרטיס — לשם כך צריך `pointerdown/move/up` עם **זמן** ביניהם,
   * ‏`touch-action` שהדפדפן באמת חישב, ו-React שבאמת רינדר. ⇒ שער חי.
   *
   * 🔬 **מה שנמדד כאן לפני התיקון (iPhone-class, 390×844):** שלושה נפנופים טבעיים —
   * ‏50px/60ms · 40px/50ms · 60px/80ms, כולם מעל 750px/ש — **כולם נדחו**, בעוד גרירה
   * איטית של 80px עברה. ⇒ «צריך לנסות כמה פעמים כדי להעיף כרטיס».
   */
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    // ⛔ T-347 — כל דף שנפתח כאן נשמר. ⛔ ולא פורמליות: המחווה הזאת מריצה React על
    // כל `pointermove`, וחריגה שנזרקת באמצע גרירה הייתה נבלעת בשקט והבדיקה הייתה
    // ירוקה על מסך שבור. ‏`verify-mobile.test.ts` נועל את זה — והוא זה שתפס אותי כאן.
    const swipeUncaught = watchUncaught(page);

    const deckWord = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-flashcard]');
        return el ? el.innerText.split('\n').filter(Boolean).slice(0, 2).join(' / ') : '';
      });

    /** One pointer gesture with REAL time between the moves — velocity needs a clock. */
    async function swipe({ query, dx, ms, steps }) {
      await page.goto(`${BASE}/dev/deck${query}`, { waitUntil: 'networkidle' });
      await page.locator('[data-flashcard]').first().waitFor();
      const before = await deckWord();
      const box = await page.locator('[data-flashcard]').first().boundingBox();
      if (box === null) return { advancedMs: -1, before, after: before };
      const y = box.y + box.height / 2;
      const x0 = box.x + box.width / 2;
      await page.mouse.move(x0, y);
      await page.mouse.down();
      for (let i = 1; i <= steps; i += 1) {
        await page.mouse.move(x0 + (dx * i) / steps, y);
        await new Promise((resolve) => setTimeout(resolve, ms / steps));
      }
      const t0 = Date.now();
      await page.mouse.up();
      for (let i = 0; i < 250; i += 1) {
        if ((await deckWord()) !== before) return { advancedMs: Date.now() - t0, before, after: await deckWord() };
        await page.waitForTimeout(20);
      }
      return { advancedMs: -1, before, after: await deckWord() };
    }

    // ⛔ `touch-action` — הסיבה שהדפדפן חטף את המחווה. נמדד כ-`auto` לפני התיקון, על
    // הכרטיס עצמו. ⛔ `pan-y` ⛔ ולא `none`: הגלילה האנכית נשארת של הדפדפן.
    await page.goto(`${BASE}/dev/deck`, { waitUntil: 'networkidle' });
    await page.locator('[data-flashcard]').first().waitFor();
    const touchAction = await page.evaluate(() => {
      const el = document.querySelector('[data-flashcard]');
      return el === null ? '(no card)' : getComputedStyle(el).touchAction;
    });
    check(
      touchAction === 'pan-y',
      'card swipe · the card owns the horizontal axis (touch-action: pan-y)',
      `computed touch-action is ${touchAction} — ⛔ the browser can still steal the gesture mid-drag`,
    );

    // `F-257` — נפנוף טבעי הוא מהיר וקצר. שלושת אלה נמדדו כנדחים לפני התיקון.
    for (const flick of [
      { label: '50px/60ms ~830px/s', dx: 50, ms: 60, steps: 5 },
      { label: '40px/50ms ~800px/s', dx: 40, ms: 50, steps: 4 },
      { label: '60px/80ms ~750px/s', dx: 60, ms: 80, steps: 6 },
    ]) {
      const r = await swipe({ query: '', dx: flick.dx, ms: flick.ms, steps: flick.steps });
      check(
        r.advancedMs >= 0,
        `card swipe · a fast flick sends the card (${flick.label})`,
        `the card ⛔ did not leave — still «${r.after}» (F-257: the gesture only accepted slow-and-long)`,
      );
    }

    // ⛔ והרצפה עובדת לשני הכיוונים: נגיעה זעירה ⛔ אינה מדרגת מילה, ולו במהירות.
    {
      const r = await swipe({ query: '', dx: 12, ms: 20, steps: 3 });
      check(
        r.advancedMs === -1,
        'card swipe · ⛔ a 12px twitch ⛔ never grades a word',
        `a twitch graded «${r.before}» — a grade is a write to the learner's data, ⛔ not an animation`,
      );
    }

    // `F-258` — הכרטיס הבא ⛔ אינו ממתין לרשת. נמדד לפני התיקון: 810 · 1,524 · 3,015ms
    // מול השהיות של 800 · 1,500 · 3,000 — כלומר **בדיוק זמן הרשת**.
    for (const ms of [800, 3000]) {
      const r = await swipe({ query: `?gradems=${ms}`, dx: 100, ms: 200, steps: 8 });
      check(
        r.advancedMs >= 0 && r.advancedMs < ms / 2,
        `card swipe · the next card ⛔ does not wait for the network (${ms}ms grade)`,
        `the next word took ${r.advancedMs}ms behind a ${ms}ms grade — F-258: the advance is back behind the await`,
      );
    }

    check(
      swipeUncaught.length === 0,
      'card swipe ⛔ no uncaught exception',
      `threw: ${swipeUncaught.join(' · ')}`,
    );

    await context.close();
  }

  /**
   * 🔴 **⟦NEW 15/09 · `C-0622` · `F-259` · `F-260` · Roy played it and reported⟧
   * THE ARENA, AS A GAME — ⛔ not as source.**
   *
   * 🔬 **Measured before the fix, on `/dev/arcade`:**
   * ```
   * 320×568  document 976 ⇒ scrolls 408px · the spell cards 232px BELOW THE FOLD
   * 375×667  document 976 ⇒ scrolls 309px · the spell cards 133px BELOW THE FOLD
   * tap a card, tap it again  ⇒  the word ⛔ NEVER changed (the second tap DESELECTED)
   * ```
   * ⇒ on the two commonest phone sizes the learner had ⛔ nothing to answer with
   * without scrolling, inside a 90-second clock. ⛔ Neither could be caught by a source
   * guard — both need a real viewport and real taps.
   */
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    // ⛔ T-347 — every page opened here is watched.
    const arenaUncaught = watchUncaught(page);

    const arenaWord = () =>
      page.evaluate(() => (document.body.innerText.match(/Lorem\d+|Ipsum\d+/) ?? ['—'])[0]);

    for (const [w, h] of [[320, 568], [375, 667], [414, 896]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE}/dev/arcade`, { waitUntil: 'networkidle' });
      await page.locator('[data-arena-scope]').first().waitFor();
      const fit = await page.evaluate(() => {
        // 🔴 **⟦17/09 · `C-0673` · `T-363`⟧ `[data-arena-card]`, ⛔ ולא «כל כפתור עם טקסט».**
        // ⛔ **וזו הצמדה לשם הטענה, ⛔ ולא הרפיה שלה:** השורה הזאת טוענת «ארבעת קלפי
        // הלחש», והמדד היה **כל** כפתור בעץ למעט `data-arena-fire` ⇒ שורת היכולות של
        // `37 § 4` (שלושה כפתורים, `y=672`, ⛔ מעל הקפל) הפילה אותה על `7 !== 4`
        // בעוד ארבעת הקלפים היו **על המסך**, ‏64px מעל הקפל. ⛔ **ו-`overflow` לא זז.**
        // ⛔ **וסימון שייעלם ⛔ אינו מפיל את השער בשקט:** `length === 0` ⛔ אינו 4.
        const cards = [...document.querySelectorAll('[data-arena-card]')];
        const lowest = cards.length === 0 ? 0 : Math.max(...cards.map((e) => e.getBoundingClientRect().bottom));
        return {
          overflow: document.documentElement.scrollHeight - window.innerHeight,
          belowFold: Math.round(lowest - window.innerHeight),
          cards: cards.length,
        };
      });
      check(
        fit.overflow <= 1,
        `arena · the battle fits ${w}×${h} — ⛔ no scrolling (F-260)`,
        `the document is ${fit.overflow}px taller than the screen — a 90-second clock ⛔ cannot be scrolled through`,
      );
      check(
        fit.cards === 4 && fit.belowFold <= 1,
        `arena · all four spell cards are on screen at ${w}×${h} (F-260)`,
        `${fit.cards} cards, lowest ${fit.belowFold}px below the fold — the learner has ⛔ nothing to answer with`,
      );
    }

    // `F-259` — tap, tap the SAME card: that is the whole attack.
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE}/dev/arcade`, { waitUntil: 'networkidle' });
    await page.locator('[data-arena-scope]').first().waitFor();
    const before = await arenaWord();
    const card = page.locator('button').filter({ hasText: /אפשרות|מסיח/ }).first();
    await card.click();
    await page.waitForTimeout(140);
    await card.click();
    await page.waitForTimeout(700);
    const after = await arenaWord();
    check(
      before !== after && after !== '—',
      'arena · tapping the same card twice casts it (F-259)',
      `the word stayed «${before}» — the second tap deselected instead of casting, which is exactly the report`,
    );

    /* 🔴 `F-288` — **THE DRAG, DISPATCHED AS A FINGER AND ⛔ NOT AS A MOUSE.**
       🔬 Why this check exists, measured on the live site 18/09 and ⛔ not supposed:
       the spell card carried `touch-action: pan-y` while its gesture is `dy < 0`
       (`arenaGesture.ts:58`, «up only») ⇒ the browser and the gesture wanted the SAME
       axis, and the browser wins every time: the real event sequence was
       `pointerdown → touchstart → pointercancel → touchend`, health stayed 100/100.
       ⛔ **The drag ⛔ did not fail — it ⛔ never happened.**
       ⚠️ **And ⛔ nothing caught it for weeks**: `page.mouse` does ⛔ not pan, so every
       mouse-driven walk — this gate included, every agent review, and mine — measured
       the drag WORKING. ⇒ a gate that clicks can ⛔ never see this class of defect.
       ⇒ this one speaks CDP touch, which is the only input that reproduces it. */
    {
      const dragCard = page.locator('[data-arena-card]').first();
      const box = await dragCard.boundingBox();
      const hpBefore = await page.evaluate(
        () => document.body.innerText.match(/\d+\s*\/\s*100/)?.[0] ?? null,
      );
      const cancelled = await page.evaluate(() => {
        window.__f288 = false;
        document
          .querySelector('[data-arena-card]')
          ?.addEventListener('pointercancel', () => { window.__f288 = true; }, { passive: true });
        return true;
      });
      const cdp = await page.context().newCDPSession(page);
      const cx = Math.round(box.x + box.width / 2);
      const cy = Math.round(box.y + box.height / 2);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
      for (let dy = 10; dy <= 120; dy += 10) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: cx, y: cy - dy }],
        });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(900);
      const hpAfter = await page.evaluate(
        () => document.body.innerText.match(/\d+\s*\/\s*100/)?.[0] ?? null,
      );
      const stolen = await page.evaluate(() => window.__f288 === true);
      check(
        cancelled && !stolen,
        'arena · a FINGER drag ⛔ is not stolen by the scroller (F-288)',
        'the card fired `pointercancel` mid-drag — `touch-action` hands the gesture axis to the browser',
      );
      check(
        hpBefore !== hpAfter,
        'arena · dragging a card upward casts it (F-288)',
        `health stayed «${hpBefore}» — the drag never reached the cast threshold on touch`,
      );
    }

    /* 👁️ `C-0719` — **THE WIZARD'S EYES ARE VISIBLE AGAINST HIS OWN HEAD.**
       🔬 Why this needs its own check, measured ⛔ and not assumed: the icon-contrast
       loop above is **controls only** — it skips anything under 100px² (the eyes render
       ~6px²) and it deliberately excludes the figures, because a CSS background probe
       cannot see an SVG fill. ⇒ I mutated the eyes back to the dark `--ink` token and
       ran the whole mobile gate: it came back **green**. Nothing in this repo protected
       them, and the claim that something did was mine to check, ⛔ not to assume.
       ⛔ **And the threshold is ⛔ NOT the 3:1 of a control**: these are a detail INSIDE
       a figure, ⛔ not text and ⛔ not something a learner presses. What can honestly be
       protected is that they did ⛔ not dissolve into the head — the one failure that
       makes the wizard faceless again. Measured today: light ink **2.59:1**, the dark
       token **6.82:1**, the head's own purple **1.00:1**. ⇒ the floor is 2, which both
       real choices clear and only «same colour as the head» fails. */
    {
      const eyes = await page.evaluate(() => {
        /* 🔬 **⟦`C-0720`⟧ the parser learned a second syntax, measured ⛔ not guessed.**
           The figure's tones are `color-mix(in srgb, currentColor …)`, and Chromium
           computes those to **`color(srgb 0.59 0.39 0.78)`** — 0–1 floats — ⛔ not to
           `rgb()`. The first version of this check only knew `rgb()`, so it returned
           `undefined` and **failed loudly the moment the tones landed**. That is the
           gate working: it refused to score what it could not read. */
        const parse = (v) => {
          const mix = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(v ?? '');
          if (mix !== null) {
            return { r: Number(mix[1]) * 255, g: Number(mix[2]) * 255, b: Number(mix[3]) * 255 };
          }
          const m = /rgba?\(([^)]+)\)/.exec(v ?? '');
          if (m === null) return null;
          const [r, g, b] = m[1].split(',').map((n) => Number.parseFloat(n));
          return Number.isNaN(r) ? null : { r, g, b };
        };
        const lum = ({ r, g, b }) => {
          const f = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const foe = document.querySelector('[data-arena-figure="enemy"]');
        if (foe === null) return { found: 0 };
        /* 🔬 **⟦`C-0723`⟧ `data-arena-eye`, ⛔ ולא «עיגול שרדיוסו ≤6».** הסינון הראשון
           היה ניחוש על מבנה: ברגע ש-`38 § 3` נמדד מהרנדר והעין קיבלה `r8`, השער
           החזיר `found 0` ⇒ **הוא האדים על עיצוב תקין**. שער שנופל כשהמוצר נכון
           אינו שער, ⇒ הסימון החליף את הסף. */
        const marks = [...foe.querySelectorAll('[data-arena-character="wizard"] [data-arena-eye]')];
        if (marks.length === 0) return { found: 0 };

        /* ⛔ **hit-test, ⛔ ולא selector** — and the reason is measured: the head used to be
           ONE circle and is now a dark cap plus a lighter face, so `head circle` picked the
           cap — the wrong surface, because the eyes sit on the FACE. A selector encodes a
           guess about structure; the point under the eye is the structure. */
        const eye = marks[0];
        const box = eye.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const under = document.elementsFromPoint(x, y)
          .find((el) => el !== eye && foe.contains(el) && 'getBBox' in el);
        if (under === undefined) return { found: marks.length, behind: 'nothing' };
        const ef = parse(getComputedStyle(eye).fill);
        const bf = parse(getComputedStyle(under).fill);
        if (ef === null || bf === null) {
          return { found: marks.length, behind: getComputedStyle(under).fill, unreadable: true };
        }
        const a = lum(ef); const b = lum(bf);
        const hi = Math.max(a, b); const lo = Math.min(a, b);
        return {
          found: marks.length,
          behind: under.tagName,
          ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100,
        };
      });
      check(
        eyes.found >= 2,
        'arena · the wizard has eyes at all (C-0719)',
        `found ${eyes.found} [data-arena-eye] shapes under [data-arena-character="wizard"]`,
      );
      check(
        (eyes.ratio ?? 0) >= 2,
        'arena · the wizard\u2019s eyes ⛔ do not dissolve into the face under them (C-0719)',
        `eyes measure ${eyes.ratio}:1 against the ${eyes.behind} behind them — at 1:1 he is faceless again`,
      );
    }

    /* 🎯 `C-0717` — **THE CARD TRAVELS TO THE ENEMY, ⛔ IT DOES NOT STOP AT 60px.**
       🔬 Measured at 393×852 before the change, ⛔ not supposed: the card's top sits at
       `y 576.6` and the enemy's feet (`[data-arena-figure=enemy]`) at `y 315` ⇒ **261.6px**
       apart, while `cardLift` clamped `y` at **−60** ⇒ the card covered **23%** of the way
       and then froze under the finger. Roy's words: «it would be cooler if you could drag
       the card further toward the middle of the screen, right at the enemy».
       ⛔ **This gate measures the RENDERED transform, ⛔ not the returned number** — a unit
       test already owns `cardLift`; what can silently die here is the CSS composing
       `--arena-card-y` (`arcade-tokens.css:613`), and only the live tree can show that. */
    {
      const dragCard = page.locator('[data-arena-card]').first();
      const box = await dragCard.boundingBox();
      const reach = await page.evaluate(() => {
        const card = document.querySelector('[data-arena-card]');
        const foe = document.querySelector('[data-arena-figure="enemy"]');
        if (card === null || foe === null) return null;
        return card.getBoundingClientRect().top - foe.getBoundingClientRect().bottom;
      });
      const cdp = await page.context().newCDPSession(page);
      const cx = Math.round(box.x + box.width / 2);
      const cy = Math.round(box.y + box.height / 2);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
      let travelled = 0;
      /* ⛔ The drag stops SHORT of the release: `touchEnd` here would cast, and the card
         would unmount before it could be measured. The question is what the finger sees
         DURING the gesture. */
      for (let dy = 20; dy <= 200; dy += 20) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: cx, y: cy - dy }],
        });
        await page.waitForTimeout(16);
        travelled = await page.evaluate(() => {
          const card = document.querySelector('[data-arena-card]');
          if (card === null) return 0;
          const m = new DOMMatrixReadOnly(getComputedStyle(card).transform);
          return Math.abs(m.m42);
        });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      await page.waitForTimeout(250);
      check(
        reach !== null && reach > 120,
        'arena · the enemy is far enough above the hand to be a target (C-0717)',
        `the measured reach is «${reach}» — with the foe that close the drag has nowhere to go`,
      );
      check(
        travelled > 150,
        'arena · a 200px finger drag CARRIES the card at the enemy (C-0717)',
        `the card moved «${Math.round(travelled)}px» for 200px of finger — it is still clamped near the 60px recognizer`,
      );
    }

    // `T-358` — the enemy bar DRAINS rather than teleporting, and the damage is shown.
    const motion = await page.evaluate(() => {
      const hp = document.querySelector('[data-arena-hp-fill]');
      return { drain: hp === null ? '' : getComputedStyle(hp).transitionDuration };
    });
    check(
      motion.drain !== '' && motion.drain !== '0s',
      'arena · the enemy health bar drains, ⛔ it does not jump (T-358)',
      `transition-duration is «${motion.drain}» — a bar that teleports ⛔ never tells the learner they landed a hit`,
    );

    /**
     * `T-366` — **THE CHARACTERS ARE ALIVE, AND ⛔ THIS IS THE ONLY PLACE IT CAN BE
     * MEASURED.** A source guard reads a stylesheet; it ⛔ cannot tell you that two
     * transform channels actually COMPOSE in a real engine, and composition is the
     * entire claim. So it is measured on a live figure, ⛔ not on a regex.
     */
    const breath0 = await page.evaluate(() => {
      const el = document.querySelector('[data-arena-breath="enemy"]');
      return el === null ? '' : getComputedStyle(el).translate;
    });
    await page.waitForTimeout(900);
    const rig = await page.evaluate(() => {
      const el = document.querySelector('[data-arena-breath="enemy"]');
      const enemy = document.querySelector('[data-arena-figure="enemy"]');
      const hero = document.querySelector('[data-arena-figure="hero"]');
      const parts = [...document.querySelectorAll('[data-arena-part]')].map((n) => ({
        part: n.getAttribute('data-arena-part'),
        animation: getComputedStyle(n).animationName,
      }));
      return {
        breath: el === null ? '' : getComputedStyle(el).translate,
        enemyH: enemy === null ? 0 : enemy.getBoundingClientRect().height,
        heroH: hero === null ? 0 : hero.getBoundingClientRect().height,
        parts,
      };
    });
    check(
      breath0 !== '' && breath0 !== rig.breath,
      'arena · the enemy breathes — ⛔ it is ⛔ not a statue (T-366)',
      `translate stayed «${breath0}» across 900ms — one figure breathing and one frozen reads as scenery, ⛔ not an opponent`,
    );
    // 🔴 **The depth cue SURVIVES the breath, and this is the whole reason the breath
    //    rides `translate`:** the enemy's wrapper carries `scale-[0.66]` as `transform`,
    //    so a `transform` animation would have ERASED it and returned the enemy to the
    //    hero's size. A live ratio is the only honest proof that it did not.
    const ratio = rig.heroH === 0 ? 0 : rig.enemyH / rig.heroH;
    check(
      Math.abs(ratio - 0.66) <= 0.03,
      'arena · the depth scale survives the breath (T-366 · depth cue ①)',
      `enemy/hero = ${ratio.toFixed(3)}, expected ~0.66 — the breath overwrote the depth scale, which is exactly what \`transform\` would do and \`translate\` must not`,
    );
    const soft = rig.parts.filter((n) => n.part === 'hair' || n.part === 'cape');
    check(
      soft.length > 0 && soft.every((n) => n.animation.includes('arena-sway')),
      'arena · hair and cape sway — ⛔ the paper doll is gone (T-366)',
      `soft layers: ${JSON.stringify(rig.parts)} — a layer that is dead still while the body breathes is the paper-doll tell`,
    );
    check(
      rig.parts.every((n) => n.part !== 'weapon' || !n.animation.includes('arena-sway')),
      'arena · ⛔ the weapon does ⛔ not sway — a held rod ⛔ does not lag (T-366)',
      `a weapon layer is running arena-sway: ${JSON.stringify(rig.parts)}`,
    );

    // 🔴 **The two channels, running AT THE SAME TIME on one element.** This is the
    //    measurement that justifies widening `COMPOSITOR_ONLY`: written as `transform`
    //    both would be one property and the later rule would replace the earlier.
    const lean = await page.evaluate(() => {
      const stage = document.querySelector('[data-arena-stage]');
      if (stage !== null) stage.setAttribute('data-arena-phase', 'hit');
      return null;
    });
    void lean;
    await page.waitForTimeout(260);
    const channels = await page.evaluate(() => {
      const el = document.querySelector('[data-arena-figure="enemy"]');
      if (el === null) return { rotate: '', transform: '' };
      const cs = getComputedStyle(el);
      return { rotate: cs.rotate, transform: cs.transform };
    });
    const shifted = /matrix\(1, 0, 0, 1, (?!0[,)])/.test(channels.transform);
    check(
      channels.rotate !== 'none' && channels.rotate !== '' && shifted,
      'arena · the strike runs BOTH channels at once — lean and shove (T-366)',
      `rotate=«${channels.rotate}» transform=«${channels.transform}» — one of the two channels overwrote the other, which is precisely the defect the widened compositor set removes`,
    );

    check(
      arenaUncaught.length === 0,
      'arena ⛔ no uncaught exception',
      `threw: ${arenaUncaught.join(' · ')}`,
    );

    await context.close();
  }
} finally {
  await browser.close();
  if (server) server.kill('SIGTERM');
}

console.log(notes.join('\n'));
if (failures.length) {
  console.error(`\n✗ ${failures.length} mobile/PWA guarantee(s) failed:`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(
  `\n✓ all mobile/PWA guarantees hold (${notes.length} checks, viewports ${WIDTHS.map((v) => `${v.width}×${v.height}`).join(' · ')})`,
);
