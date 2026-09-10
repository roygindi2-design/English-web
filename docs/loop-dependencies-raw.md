LOOP DEPENDENCIES - RAW INFORMATION FILE
Generated 2026-09-09. Repo roygindi2-design/English-web at 5ca37ca (work/current = dev = main).
Purpose: source material for building a dependency diagram in Figma.
This file contains information only. No fixes were made in the run that produced it.
Every number here was measured on this commit. Re-measure before trusting it later.


SECTION 1 - RULES.md SECTIONS THAT A TEST PINS BY EXACT STRING

There are two distinct kinds of test dependency on plan/RULES.md, and they should be
drawn differently.

KIND A - a test asserts a literal string exists inside RULES.md.
There are exactly five such assertions in the whole repository.

A1.
  Section: 0.6 - שער הטריאז׳ — כמה עבודה הטיק הזה בכלל מצדיק
  Pinned literal: `story` · `nav` · `cards` · `arena` · `studies`
  Test: scripts/agent-prompts.test.ts:386  expect(rules).toContain(FIVE_FLOWS)
  Same literal also pinned in docs/agents/PM.md at scripts/agent-prompts.test.ts:387
  Agent files citing 0.6: docs/agents/DEV.md
  Classification: RELEVANT AND SOUND.
  Reasoning: the assertion exists so the wording cannot drift between the constitution
  and the prompt that must obey it. Both sides are asserted, so it fails on either
  edit. This is the one pattern in the file that actually prevents divergence.

A2.
  Section: 0.6 (same test)
  Pinned literal: בו-זמנית
  Test: scripts/agent-prompts.test.ts:388  expect(rules).toContain('בו-זמנית')
  Classification: BRITTLE BUT CHEAP.
  Reasoning: a two-word Hebrew string with no anchor to its surrounding sentence. It
  would pass if the word appeared anywhere in the 103KB file, including in an
  unrelated section or in an archived quotation. It proves almost nothing today.

A3.
  Section: 0.28 - ACTIVE_TASK_ID — תור מנוהל של עד שלושה מזהים
  Pinned literal: heading shape /### 0\.28 ·/
  Test: scripts/agent-prompts.test.ts:801
  Paired with: docs/agents/DEV.md must contain the string "RULES § 0.28" (line 799)
  Classification: RELEVANT AND SOUND.
  Reasoning: this is an anti-hollow-citation test. It asserts the citation in the
  prompt AND the existence of the target. That pairing is the correct shape.

A4.
  Section: 0.23 - ענף העבודה ושער המשלוח
  Pinned literal: "תשע פקודות" (RULES.md:999), plus every command name inside
  npm run verify
  Test: scripts/rules-citations.test.ts:109 and :111
  Derivation: the count and the list are both derived from package.json scripts.verify
  Classification: RELEVANT AND SOUND, AND THE BEST EXAMPLE IN THE FILE.
  Reasoning: the expected value is computed from package.json, not typed into the
  test. Adding or removing a verify command makes RULES.md wrong automatically. This
  is the only assertion of the five that cannot go stale.

A5.
  Section: 0.4 - מקביליות — מי נסוג מפני מי
  Pinned structure: the section must contain table rows of shape | **NAME** | ... |,
  every enabled agent in docs/agents/roster.json must appear as a row, and must also
  appear inside somebody else's "נסוג מפני" cell.
  Test: scripts/loop-health.test.ts:1229
  Agent files citing 0.4: all five
  Classification: RELEVANT AND SOUND.
  Reasoning: it derives the expected set from roster.json rather than restating it.
  Caveat worth drawing: it depends on roster.json being truthful, and roster.json is
  currently wrong (see SECTION 5, finding 1).

KIND B - a test depends on RULES.md structurally, without pinning prose.
  scripts/rules-citations.test.ts:22,34,43,54,58,78 - anchor extraction, duplicate
  anchor detection, and citation resolution across the whole repo.
  This is the mechanism that makes every § citation in the repo a real edge.
  Classification: RELEVANT AND SOUND. It is the backbone of the dependency graph
  below and the reason the graph can be trusted at all.

  scripts/agent-prompts.test.ts:1368 - the "זרימה" vocabulary row must exist in
  plan/RULES.md, docs/agents/PM.md and docs/agents/DEV.md, and must list exactly the
  ten values of WORKSTREAMS in lib/core/planTable.ts.
  Classification: RELEVANT AND SOUND. Expected values derived from code.


SECTION 2 - THE FULL ANCHOR DEPENDENCY TABLE

73 anchors exist in plan/RULES.md.
30 are cited by at least one file under docs/agents/.
21 are cited by at least one test file.
27 are cited by code under scripts/, lib/, app/ or components/.
26 are cited by nothing anywhere in the repository.

CORRECTION, 2026-09-10. The paragraph that stood here was WRONG, and the error is
worth recording because it was the same class of defect the file reports elsewhere.
It said 26 anchors were uncited and that this had been verified against a spaced
citation form. That verification used a grep character class [א-ת] which silently
matched nothing in this environment, and returned zero because it could not match,
not because there was nothing to find.

Re-measured with python: the repo carries 150 lettered citations in the SPACED form
(§ 0.1 ז׳) against 98 in the tight form (§ 0.1ז). The spaced form is the majority.

The genuinely uncited anchors are TEN, not 26:
0.1ט 0.2א 0.2ה 0.2ו 0.2ז 0.16א 0.16ג 0.16ד 0.16ו 0.23ב
These sixteen were cited all along, in the spaced form:
0.1א 0.1ב 0.1ג 0.1ד 0.1ה 0.1ו 0.1ז 0.1ח 0.2ב 0.2ג 0.2ד 0.16ב 0.16ה 0.29א 0.29ד 0.29ה

The consequence was larger than the miscount. scripts/check-rules-citations.mjs
matched only the tight form, so all 150 spaced citations resolved against their
PARENT section and their letter was never validated - which is exactly the hole the
resolves() function was hardened against on 09/09. It was closed for one of the two
forms only. Fixed 10/09: the letter is now read in both forms, with the geresh as
the disambiguator so that a sentence beginning with a Hebrew word (§ 0.4 נסיגה) is
not read as a sub-clause reference. Citations resolved went from 631 to 645.

Format below: ANCHOR | TOTAL CITATIONS | AGENT FILES | TEST FILES:LINE | CODE FILES | TITLE
0.0 | 7 | - | - | scripts/check-rules-citations.mjs | מפת המספור —
0.1 | 123 | CONTENT.md DEV.md PM.md PROMOTER.md QA.md | app/api/health/route.test.ts:14 app/globals.test.ts:5 scripts/agent-prompts.test.ts:1283 scripts/agent-prompts.test.ts:1309 scripts/gc-memory.test.ts:248 scripts/pre-push-gates.test.ts:10 scripts/pre-push-gates.test.ts:63 | app/api/health/route.test.ts app/api/health/route.ts app/globals.test.ts scripts/agent-prompts.test.ts scripts/check-plan-shape.mjs scripts/check-rules-citations.mjs scripts/gc-memory.mjs scripts/gc-memory.test.ts scripts/pre-push-gates.test.ts | תיקוני 11/08/2026 — גובר על כל סעיף שסותר אותו  ⟨לשעבר § 0.1.1⟩
0.2 | 18 | - | - | scripts/gc-memory.mjs scripts/loop-health.mjs | יעול וחיסכון — 17/08/2026. גובר על כל סעיף שסותר אותו  ⟨לשעבר § 0.1.2⟩
0.3 | 7 | PROMOTER.md | - | - | חוק הפריסה — קריאת חובה לכל סוכן  ⟨לשעבר § 0.2⟩
0.4 | 28 | CONTENT.md CRITIC.md DEV.md PM.md PROMOTER.md QA.md | scripts/loop-health.test.ts:1218 scripts/loop-health.test.ts:1222 scripts/loop-health.test.ts:1229 scripts/loop-health.test.ts:1235 scripts/pre-push-gates.test.ts:158 scripts/pre-push-gates.test.ts:203 scripts/pre-push-gates.test.ts:258 | scripts/loop-health.mjs scripts/loop-health.test.ts scripts/pre-push-gates.test.ts | מקביליות — מי נסוג מפני מי  ⟨לשעבר § 0.3⟩
0.5 | 14 | DEV.md PM.md | scripts/agent-prompts.test.ts:1661 scripts/agent-prompts.test.ts:1670 | scripts/agent-prompts.test.ts | סוכני משנה (Subagents)  ⟨לשעבר § 0.4⟩
0.6 | 35 | PM.md | scripts/agent-prompts.test.ts:386 | scripts/agent-prompts.test.ts scripts/loop-health.mjs | שער הטריאז׳ — כמה עבודה הטיק הזה בכלל מצדיק  ⟨לשעבר § 0.5⟩
0.6א | 7 | DEV.md PM.md QA.md | - | - | (sub-clause)
0.6ב | 28 | DEV.md PM.md QA.md | scripts/agent-prompts.test.ts:1338 scripts/agent-prompts.test.ts:1347 | scripts/agent-prompts.test.ts scripts/build-surfaces.mjs scripts/check-plan-shape.mjs scripts/loop-health.mjs | (sub-clause)
0.6ג | 11 | DEV.md | - | scripts/loop-health.mjs | (sub-clause)
0.6ד | 6 | PM.md QA.md | - | - | (sub-clause)
0.7 | 40 | CONTENT.md DEV.md PM.md PROMOTER.md QA.md | - | - | סקילים של superpowers — מתי כל אחד חובה  ⟨לשעבר § 0.6⟩
0.8 | 13 | PROMOTER.md | - | - | למה `[skip ci]` בוטל  *(תיקון באג, 06/08/2026)*  ⟨לשעבר § 0.7⟩
0.9 | 16 | - | scripts/validate_palette.test.ts:18 | lib/core/colorVision.ts scripts/validate_palette.mjs scripts/validate_palette.test.ts | סקילים של עיצוב ותצוגה — מה מתאים למה  ⟨לשעבר § 0.8⟩
0.12 | 28 | DEV.md PM.md | scripts/agent-prompts.test.ts:380 | scripts/agent-prompts.test.ts | איזון קצב — הכללים  *(06/08/2026)*  ⟨לשעבר § 0.11⟩
0.15 | 12 | CONTENT.md DEV.md PM.md QA.md | scripts/agent-prompts.test.ts:1627 scripts/agent-prompts.test.ts:1631 scripts/agent-prompts.test.ts:1634 scripts/agent-prompts.test.ts:1641 | scripts/agent-prompts.test.ts | פרומפט נושא כללים · `plan/` נושא מצב  *(תיקון, 06/08/2026)*  ⟨לשעבר § 0.13⟩
0.16 | 52 | DEV.md PM.md QA.md | scripts/agent-prompts.test.ts:683 scripts/check-page-titles.test.ts:12 | scripts/agent-prompts.test.ts scripts/check-page-titles.mjs scripts/check-page-titles.test.ts | מסמכי העוגן — 23/08/2026. גובר על כל סעיף שסותר אותו  ⟨לשעבר § 0.14⟩
0.17 | 53 | PM.md | scripts/agent-prompts.test.ts:1441 scripts/agent-prompts.test.ts:1442 scripts/agent-prompts.test.ts:1672 scripts/agent-prompts.test.ts:1674 scripts/rules-citations.test.ts:44 | scripts/agent-prompts.test.ts scripts/loop-health.mjs scripts/rules-citations.test.ts | תקרת המשימות של ה-PM — גזירה מול המצאה  *(23/08, רוי)*  ⟨לשעבר § 0.14א⟩
0.18 | 6 | DEV.md QA.md | scripts/agent-prompts.test.ts:877 | scripts/agent-prompts.test.ts | בריאות הלופ  ⟨לשעבר § 0.14ב⟩
0.19 | 7 | CONTENT.md DEV.md PM.md PROMOTER.md QA.md | - | - | `./scripts/g` — עטיפת git וכלל הנסיגה  ⟨לשעבר § 0.14ג⟩
0.20 | 35 | CONTENT.md DEV.md PM.md PROMOTER.md QA.md | scripts/agent-prompts.test.ts:1513 | scripts/agent-prompts.test.ts | ניתוב — לאן הולכת בעיה  *(23/08/2026, רוי · עודכן 31/08)*  ⟨לשעבר § 0.15⟩
0.21 | 22 | DEV.md PM.md QA.md | scripts/agent-prompts.test.ts:908 scripts/loop-health.test.ts:415 | scripts/agent-prompts.test.ts scripts/loop-health.mjs scripts/loop-health.test.ts | סריקת `03-for-roy.md` — חובה בכל טיק PM  *(23/08, רוי)*  ⟨לשעבר § 0.15א⟩
0.22 | 136 | DEV.md PM.md PROMOTER.md | app/arcade/page.test.ts:123 app/arcade/page.test.ts:276 lib/core/arenaHome.test.ts:55 scripts/agent-prompts.test.ts:1527 | app/(tabs)/world/story/page.tsx app/api/practice/route.ts app/api/review/context/route.ts app/api/study/queue/route.ts app/arcade/page.test.ts app/arcade/page.tsx app/layout.tsx components/ArenaBattle.tsx components/ArenaHome.tsx components/ArenaShell.tsx components/ArenaSummary.tsx components/Flashcard.tsx lib/core/amirnetItemGate.ts lib/core/arenaCharacter.ts lib/core/arenaGesture.ts lib/core/arenaHome.test.ts lib/core/arenaHome.ts lib/core/battle.ts scripts/agent-prompts.test.ts scripts/check-plan-shape.mjs scripts/fetch-wordnet.mjs | מרחב ההכרעה של DEV — הפיך מול בלתי-הפיך  *(23/08/2026, רוי)*  ⟨לשעבר § 0.16⟩
0.23 | 28 | DEV.md PM.md PROMOTER.md QA.md | scripts/agent-prompts.test.ts:14 scripts/agent-prompts.test.ts:22 | scripts/agent-prompts.test.ts scripts/loop-health.mjs | ענף העבודה ושער המשלוח  ⟨לשעבר § 0.17⟩
0.23א | 5 | CONTENT.md DEV.md PM.md QA.md | - | - | (sub-clause)
0.23ד | 5 | QA.md | - | - | (sub-clause)
0.23ו | 6 | DEV.md QA.md | - | - | (sub-clause)
0.23ז | 12 | DEV.md PM.md | scripts/rules-citations.test.ts:72 | scripts/rules-citations.test.ts | (sub-clause)
0.23ח | 17 | CRITIC.md QA.md | scripts/agent-prompts.test.ts:412 scripts/loop-health.test.ts:1083 scripts/rules-citations.test.ts:189 | scripts/agent-prompts.test.ts scripts/check-rules-citations.mjs scripts/loop-health.mjs scripts/loop-health.test.ts scripts/rules-citations.test.ts | (sub-clause)
0.27 | 7 | CONTENT.md PROMOTER.md | scripts/agent-prompts.test.ts:1585 | scripts/agent-prompts.test.ts | Playwright — נפילת «Executable doesn't exist» ⛔ אינה סיבה לדלג
0.28 | 20 | DEV.md | scripts/agent-prompts.test.ts:797 scripts/agent-prompts.test.ts:799 | scripts/agent-prompts.test.ts scripts/loop-health.mjs | `ACTIVE_TASK_ID` — תור מנוהל של עד שלושה מזהים
0.29 | 59 | CONTENT.md DEV.md PM.md PROMOTER.md QA.md | scripts/agent-prompts.test.ts:1172 scripts/loop-health.test.ts:1026 scripts/loop-health.test.ts:1107 scripts/pre-push-gates.test.ts:184 scripts/rules-citations.test.ts:35 | scripts/agent-prompts.test.ts scripts/check-rules-citations.mjs scripts/loop-health.mjs scripts/loop-health.test.ts scripts/pre-push-gates.test.ts scripts/rules-citations.test.ts | PROMOTER — סמכות הקידום וסמכות החילוץ
0.29ב | 4 | - | scripts/rules-citations.test.ts:36 | scripts/check-rules-citations.mjs scripts/rules-citations.test.ts | (sub-clause)
0.29ג | 6 | - | - | scripts/check-rules-citations.mjs | (sub-clause)
0.29ו | 6 | - | - | scripts/check-rules-citations.mjs | (sub-clause)
0.30 | 7 | DEV.md PM.md QA.md | - | scripts/loop-health.mjs | הארכיון הוא ראיה להיסטוריה, ⛔ ולעולם לא פתרון חי


SECTION 3 - THE DESIGN CONSTITUTION AND THE IRON RULES

3.1 plan/35-design-constitution.md

This is the design constitution. It is 26,127 bytes, 20 clauses in two groups:
  א1 ניגודיות, א2 צבע לעולם אינו הערוץ היחיד, א3 עברית ו-RTL, א4 יעדי מגע,
  א5 עיגון למעלה, א6 Viewport, א7 נגישות (prefers-reduced-motion),
  א8 אייקונים, א9 רצפת גודל-טקסט 12px
  ב1 כהה קודם, ב2 רדיוסים, ב3 זוהר, ב4 טיפוגרפיה, ב5 הזירה,
  ב6 מוטיון, ב7 הרשימה השחורה, ב8 אזורים בטוחים ואזור האגודל,
  ב9 עומק משטחים
Plus three closing sections: "מה קורה בסתירה", "הכרעה מפורשת מול RULES § 0.9",
and a mobile-first review dated 31/08.

WHO DEPENDS ON IT:
  All five agent prompts cite it: docs/agents/DEV.md, PM.md, QA.md, CONTENT.md,
  PROMOTER.md
  Code: scripts/gc-memory.mjs (NEVER_TOUCH list), scripts/check-motion.mjs,
  scripts/check-text-floor.mjs
  Tests: scripts/gc-memory.test.ts:40, scripts/motion-gate.test.ts:23,
  scripts/text-floor-gate.test.ts:16, components/Flashcard.test.ts:148
  Registers: plan/30-architecture.md, plan/40-decisions.md, plan/50-tasks.md,
  plan/60-findings.md, plan/36-video-spec.md, plan/45-product-questions.md,
  plan/02-inbox.md, plan/03-for-roy.md
  Code constant: lib/core/planTable.ts

THE ONLY HARD MECHANICAL PIN ON IT:
  scripts/gc-memory.mjs:65  export const NEVER_TOUCH = ['plan/RULES.md',
  'plan/35-design-constitution.md']
  asserted at scripts/gc-memory.test.ts:40 with toEqual, so the list is exact and
  ordered. These two files are the only two the memory-compaction tool may never
  rewrite.
  Everything else is a citation in a comment or a prose reference. check-motion.mjs
  and check-text-floor.mjs enforce values that ORIGINATE in the design constitution
  but they read their thresholds from their own baselines, not from the document.
  Draw that as a dashed edge, not a solid one.

3.2 SECTIONS OF RULES.md THAT DECLARE THEMSELVES OVERRIDING

Exactly three sections declare in their own heading that they outrank any section
that contradicts them. There is no other self-declared precedence anywhere in the
file, and the phrase "חוק ברזל" does not appear in RULES.md at all.

  0.1  תיקוני 11/08/2026 — גובר על כל סעיף שסותר אותו   (RULES.md:107)
       123 citations. Cited by all five agent prompts, 7 test sites, 9 code files.
       The most depended-on section in the system after 0.22.

  0.2  יעול וחיסכון — 17/08/2026. גובר על כל סעיף שסותר אותו   (RULES.md:231)
       18 citations. Cited by ZERO agent prompts. Code only: scripts/gc-memory.mjs,
       scripts/loop-health.mjs.

  0.16 מסמכי העוגן — 23/08/2026. גובר על כל סעיף שסותר אותו   (RULES.md:770)
       52 citations. Cited by 3 agent prompts, 2 test sites, 3 code files.

3.3 FILES DECLARED NEVER-EDIT-BY-HAND INSIDE RULES.md

  RULES.md:399  "אין לערוך אותו ביד" - about the derived plan tree; enforced by
                scripts/measure-plan-tables.test.ts, which fails if the committed
                copy differs from a fresh run.
  RULES.md:463  "נגזר, לא נכתב, ואין לערוך אותו ביד" - about plan/63-surfaces.md.
  RULES.md:1091 "קובץ נגזר — אין לערוך אותו ביד" - about the architecture file.

3.4 ALL 28 ALERT ROWS IN plan/20-alerts.md, FULL TEXT

File header declares ownership: "OWNER: PM כותב · Critic מוסיף · Dev קורא בלבד"
File header declares the blocking rule: "פריט ברמת חומרה BLOCKER עוצר את המשימה
התלויה בו."

Counts measured on this commit: 28 rows. 21 carry an open marker, 8 carry a closed
marker (one row carries both forms and is counted in both). 10 of the open rows say
in their own status cell that they do NOT block anything. 8 open rows still carry
BLOCKER severity.

No gate parses this file. It is not covered by measure:plan, which only reads
plan/50-tasks.md and plan/60-findings.md. Two rows are malformed by column count:
R-027 has 11 pipe-separated cells and R-028 has 10, where every other row has 9.
Nothing detects that.

The phrase "לא נתון לפרשנות" or any equivalent non-negotiable marker appears ZERO
times in plan/20-alerts.md. The only precedence statement in the file is the header
sentence about BLOCKER severity quoted above.

ID: R-001   (plan/20-alerts.md line 9)
SEVERITY: 🔴 BLOCKER
SUBJECT: חלוקת המילים לרמות L1–L8
WHY IT IS A PROBLEM: טרם בוצע מחקר — כל חלוקה כרגע היא המצאה
REPORTED BY: PM
REQUIRED ACTION: מחקר רשת + מקור מצוטט
STATUS: ✅ **נסגרה 2026-08-05.** נמצאו S1–S4 (ראה 1.3.1). המבנה שונה ל-6 רמות CEFR ולא 8 מומצאות. **T-004 ו-T-005 משוחררות מחסימה זו.**

ID: R-002   (plan/20-alerts.md line 10)
SEVERITY: 🟠 WARNING
SUBJECT: "טווח ציון אמיר״ם מקביל לכל רמת אוצר מילים"
WHY IT IS A PROBLEM: **לא נמצא שום מקור בדרגה א׳ או ב׳** הממפה ציון אמיר״ם (50–150) לגודל אוצר מילים או לרמת CEFR. חיפשתי: nite.org.il, אתרי סיווג של אונ׳ חיפה / המכללה האקדמית ת"א-יפו / האוניברסיטה העברית / אפקה / האוניברסיטה הפתוחה, וחיפוש בעברית "אמירם אוצר מילים רמות". כל מה שהוחזר בנושא זה היה מכוני הכנה מסחריים — **דרגה ג׳ בלבד**. חסר: פרסום של מרכז ארצי לבחינות והערכה או מחקר אקדמי המקשר בין הסולם לרמת CEFR
REPORTED BY: PM
REQUIRED ACTION: (א) **אין להציג למשתמש שום טענת שקילות בין רמה לציון** (ראה D-005). (ב) לחזור על החיפוש בעוד 90 יום
STATUS: 🔓 פתוח — לא חוסם פיתוח

ID: R-003   (plan/20-alerts.md line 11)
SEVERITY: 🔴 BLOCKER
SUBJECT: שימוש בנתוני **English Vocabulary Profile** כמקור תוויות הרמה במוצר
WHY IT IS A PROBLEM: **עודכן C-0000, 22:4xZ — מחצית מהחסימה נפתרה.** (1) **NGSL — נפתר ✅:** נמצא נוסח רישיון מפורש, CC BY-SA 4.0 (S5). שימוש מסחרי מותר בייחוס + שיתוף-זהה. **T-007 אינה חסומה עוד ואין עליה סיכון משפטי.** (2) **EVP — נותר חסום ❌:** לא נמצא שום רישיון פתוח. דף תנאי השימוש של Cambridge לא ניתן לקריאה (לולאת הפניה), והראיה העקיפה היחידה (ויקיפדיה) מצביעה על "חינם לאחר הרשמה, לזמן מוגבל" ועל שימוש **לא-מסחרי** באחיו (Grammar Profile). הטמעת EVP במוצר בלי אישור בכתב היא סיכון משפטי ממשי
REPORTED BY: PM
REQUIRED ACTION: **החלטת רוי — שתי אפשרויות בלבד:** ⓐ לפנות ל-englishprofile.org / Cambridge ולבקש אישור בכתב לשימוש ב-EVP במוצר (עלול לקחת שבועות, ועלול להסתיים בסירוב או בתשלום). ⓑ לעבור ל**מסלול B** (1.3.3): CEFR-J + Octanove — מותר מסחרית כבר היום. **המלצת ה-PM: ⓑ**, כי היא משחררת את הלופ מיד וניתנת להחלפה מאוחר יותר. ראה D-006
STATUS: ✅ **נסגרה 2026-08-05T23:05Z — רוי בחר ⓑ.** מקור תוויות הרמה הוא **CEFR-J + Octanove** (1.3.3). T-008 מוחלפת ב-**T-010**, שאינה חסומה עוד. `HUMAN_DECISION_REQUIRED=false`. ראה D-009

ID: R-005   (plan/20-alerts.md line 12)
SEVERITY: 🔴 BLOCKER
SUBJECT: **אין למוצר שום מקור תרגום לעברית**
WHY IT IS A PROBLEM: פער שהתגלה ב-C-0000 בעת סקירת התמונה הגדולה, ולא דווח בשום טיק קודם: המוצר מוגדר "עברית↔אנגלית", אך אף אחד מהמקורות S1–S9 אינו מכיל ולו מילה אחת בעברית. NGSL = מילים באנגלית. CEFR-J = תוויות רמה. **כרטיסייה (T-005) ומסיחים (7.5) בלתי אפשריים בלי תרגומים**, ותרגום שהסוכן ימציא הוא בדיוק ההפרה שמדור 2 קיים כדי למנוע. סיכון נלווה: מילון דו-לשוני מחזיר *רשימת* תרגומים ולא את הנכון בהקשר (`bank` → "בנק"/"גדה")
REPORTED BY: PM
REQUIRED ACTION: **לא נדרשת החלטה של רוי** — נדרשת מדידה. נמצאו שני מועמדים מורשים (1.6: H1 Hebrew Wordnet ברישיון WordNet, H2 ויקימילון ב-CC BY-SA). **T-013 ימדוד כיסוי בפועל מול 2,809 מילות NGSL**, ואז ה-PM יכריע. עד אז ההיקף המלא חסום. ⚠️ **T-005 שוחררה דרך מאגר זרע — D-020.** החסימה הזו נוגעת לצינור האוטומטי בלבד. **עדכון C-0001:** מרחב המועמדים נסרק במלואו והורחב — H1 אומת לעומק (1.6.1), נוספו H3–H6 (1.6.2), ונפסלו PanLex ו-MUSE ברישיון NC (1.6.3). **המדידה חייבת לכלול גם את H3 ו-H4** — ראה T-016
STATUS: 🔓 פתוח — נפתר ב-T-013 + T-016. **התקדמות C-0001: הרישוי נסגר, ההיקף עדיין לא נמדד**

ID: R-004   (plan/20-alerts.md line 13)
SEVERITY: 🟠 WARNING
SUBJECT: ציטוט הדומיין `newgeneralservicelist.org` ב-S1 ו-1.4
WHY IT IS A PROBLEM: הדומיין `.org` שנקרא בטיק הקודם מציג כיום כותרת זכויות יוצרים של גורם מסחרי שאינו קשור לפרויקט (הימורים) — סימן מובהק לדומיין שפקע ונרכש מחדש. הנתונים שנלקחו ממנו (2,801 ערכים) גם אינם תואמים את הגרסה הנוכחית (2,809). קליטת נתונים מדומיין כזה = סיכון להזרקת תוכן שקרי ישירות לתוך חומר הלימוד
REPORTED BY: PM
REQUIRED ACTION: ✅ **טופל בטיק זה:** העובדות אומתו מחדש מול הדומיין הקנוני `.com` (S5, S6), נוספה אזהרה מפורשת ב-1.3.1, ונקבעה נעילת גרסה ל-T-007. **Dev: אל תוריד מ-.org**
STATUS: 🔒 סגור — האזהרה נשארת בתוקף

ID: R-006   (plan/20-alerts.md line 14)
SEVERITY: 🔴 BLOCKER
SUBJECT: **בחירת התרגום היחיד שיוצג ללומד** — מתוך רשימת התרגומים שמחזיר כל מילון
WHY IT IS A PROBLEM: פער שהתגלה ב-C-0001 בעת פתירת R-005: גם אחרי שיהיה לנו מקור תרגום מורשה, **הבחירה איזה תרגום להציג היא עצמה החלטה פדגוגית שאין לה מקור**. המספר שקובע: baseline של "קח את המשמעות הראשונה ב-WordNet" משיג **65.2 F1** (M4) — כלומר **בכ-35% מהמילים הרב-משמעיות נלמד ללומד את המשמעות הלא-נכונה**. פרינסטון עצמה מצהירה שדירוג המשמעויות שלה קפוא מ-2001 ו-*"should not be construed as an accurate indicator of frequency of use"* (M3). כרטיסייה שמציגה "bank = גדה" לסטודנט לאמיר"ם היא בדיוק ההפרה שמדור 2 קיים כדי למנוע
REPORTED BY: PM
REQUIRED ACTION: **לא נדרשת החלטה של רוי — נדרשת אכיפה ומדידה.** (א) כלל הקליטה המחייב ב-**1.7.1** אינו המלצה: פריט ב-`confidence='low'` **אינו מוצג ללומד**. (ב) **T-018** מודד את דיוק הפייפליין בפועל מול 5,448 ה-synsets של H1 כ-gold set — לפני שכרטיסייה אחת מגיעה ללומד. סף מוצע: <90% דיוק על הליבה = לא משחררים
STATUS: 🔓 פתוח — נפתר ב-T-018. **חוסם את הצינור האוטומטי.** ⚠️ אינו חוסם מאגר זרע שאדם בחר לו תרגום ביד — D-020

ID: R-007   (plan/20-alerts.md line 15)
SEVERITY: 🟠 WARNING
SUBJECT: **איכות הנתונים של Hebrew Wordnet (H1)** — 6,872 הרשומות אינן שוות ערך
WHY IT IS A PROBLEM: ה-PM ספר בעצמו על קובץ הנתונים (1.6.1): **329 רשומות `GAP`** = synset שאינו מלוקסקל בעברית, כלומר ריק; ו-**1,481 רשומות (~23%) מסומנות `!`**, שלפי ה-README של היוצרים עצמם משמעותו *"Hebrew entries that do not perfectly match the English"*. בנוסף, **99.9% מהערכים מנוקדים** — התאמת מחרוזות בלי נרמול תיכשל, וההסרה מקריסה ~13% מהערכים לכפילויות. טעינה עיוורת של הקובץ מזריקה ~1,800 רשומות פגומות ישירות לחומר הלימוד
REPORTED BY: PM
REQUIRED ACTION: ⛔ **כלל מחייב:** רשומת `GAP` **אינה נטענת**. רשומת `!` נטענת עם `translation_confidence='low'` ו**אסורה בהצגה כתרגום ראשי** — לכל היותר רמז משני מסומן. ניקוד מוסר בשלב נרמול, והצורה המנוקדת נשמרת בשדה נפרד. ראה **T-017**
STATUS: 🔓 פתוח — נפתר ב-T-017. **✅ C-0046: הכלל הועתק לתמצית, והסתירה שהתמצית יצרה (`!` וניקוד "אינם נטענים") בוטלה — D-025.** נותר לאמת שקוד T-017 אכן מיישם זאת; זו סקירת Critic ולא עבודת PM

ID: R-008   (plan/20-alerts.md line 16)
SEVERITY: 🟠 WARNING
SUBJECT: ההנחה ש-NGSL "מספיק" ללומד אמיר"ם
WHY IT IS A PROBLEM: NGSL נותן **92%** כיסוי (S6). המחקר קובע שהסף ה**מינימלי** להבנת נקרא סבירה הוא **95%** (≈4,000–5,000 משפחות מילים), והאופטימלי **98%** (≈8,000–9,000) — E8, E9. כלומר אוצר המילים שאנחנו בונים **אינו מספיק לבדו** לפרק הבנת הנקרא (A2). הסיכון אינו טכני אלא של אמון: לומד שיסיים את כל 2,809 המילים ויגלה שהוא עדיין לא מבין את הטקסט — יאבד אמון במוצר, בצדק
REPORTED BY: PM
REQUIRED ACTION: (א) **אסור להבטיח בממשק שסיום NGSL = מוכנות למבחן.** (ב) לתכנן שכבת אוצר מילים שנייה (מועמד: NAWL, מאותו פרויקט ובאותו רישיון CC BY-SA) — **אחרי** שאבן הדרך הראשונה עובדת מקצה לקצה. (ג) E10: הקשר לינארי, אין מצוק — מותר להציג התקדמות רציפה
STATUS: 🔓 פתוח — לא חוסם פיתוח

ID: R-009   (plan/20-alerts.md line 17)
SEVERITY: 🟠 WARNING
SUBJECT: מטריצת הניקוד ב-7.4: **שגוי + ביטחון נמוך = −1**
WHY IT IS A PROBLEM: סותר את העיקרון שאנחנו עצמנו כתבנו — "אין ענישה על חוסר ידיעה". במטריצת ה-CBM המקורית של Gardner-Medwin (UCL), שנמצאת בשימוש 40+ שנה ומיושמת ב-Moodle, **תשובה שגויה בביטחון הנמוך ביותר עולה בדיוק 0**. בנוסף נמצא סיכון מתועד: פער מגדרי גדול בדיווח ביטחון — נשים איבדו נקודות גם מתת-ביטחון וגם מביטחון-יתר יותר מגברים (17.2% מהשונות מוסברת במגדר)
REPORTED BY: PM
REQUIRED ACTION: ✅ **המפרט 7.4 תוקן בטיק זה** לפי המטריצה המקורית. הפער המגדרי נרשם כדבר שחייב **מדידה לפני הרחבה**, לא הנחה
STATUS: 🔒 סגור — המפרט תוקן

ID: R-010   (plan/20-alerts.md line 18)
SEVERITY: 🔴 BLOCKER
SUBJECT: שימוש בשאלות תרגול של מאל"ו כמאגר פריטים
WHY IT IS A PROBLEM: דפי מאל"ו נושאים "כל הזכויות שמורות למרכז הארצי לבחינות ולהערכה" **ללא שום היתר שימוש חוזר** — נבדק ולא נמצא רישיון. שלושת מבחני התרגול הרשמיים נגישים בדפדפן אך **אינם נותנים ציון** ודורשים Chrome ברזולוציית 1920×1080 מינימום, כלומר **אינם שמישים בטלפון לפי ההגדרה שלהם**
REPORTED BY: רוי (ביקורת)
REQUIRED ACTION: ⛔ **אסור להעתיק, לגרד או לגזור פריטים ממאל"ו — גם לא "בהשראה".** כל פריט תרגול במוצר חייב להיות מקורי, ולחקות **פורמט** בלבד (השלמת משפטים · ניסוח מחדש · הבנת הנקרא). זו חסימה על מנוע 7.6 ועל כל משימת תוכן
STATUS: 🔓 פתוח

ID: R-011   (plan/20-alerts.md line 19)
SEVERITY: 🟠 WARNING
SUBJECT: ההנחה ש"מנוע אדפטיבי" ו"מורה AI" הם הבידול שלנו
WHY IT IS A PROBLEM: סריקת שוק מצאה ששלושה מתחרים כבר טוענים בדיוק את זה ומוכרים אותו היום: Ptor (מנוע אדפטיבי + חיזוי ציון, ₪439/4 חודשים), simulation.co.il (מורה AI בעברית 24/7, ₪179–389), Kidum (מאגר אדפטיבי, ₪299–399). המסלול היחיד שאיש לא תפס הוא **מובייל** — התרגול הרשמי דסקטופ-בלבד, והאפליקציה המובילה בעברית עומדת על 1K התקנות בלבד
REPORTED BY: רוי (ביקורת)
REQUIRED ACTION: ⓐ **אל תמכור "אדפטיבי" ו"AI" — זה כבר רעש בשוק.** ⓑ המיצוב הפנוי: מובייל אמיתי + הערכת מוכנות אמינה. ⓒ עוגן מחיר: ₪250–400 לחלון של חודש–שלושה, לא מנוי מתגלגל
STATUS: 🔓 פתוח

ID: R-012   (plan/20-alerts.md line 20)
SEVERITY: 🟠 WARNING
SUBJECT: Onboarding שמבקש **ציון יעד** כמניע
WHY IT IS A PROBLEM: ניסוי מבוקר על ~4,000 סטודנטים: יעדים **מבוססי-משימה** (מספר מבחני תרגול) שיפרו השלמה ב-0.5 מבחנים (p=0.017) וציונים ב-~0.1 סטיית תקן; יעדים **מבוססי-ביצוע** (ציון יעד) — **אפס השפעה** (p=0.452). NBER w23638. בנוסף, Duolingo מצאו שכ-40% מהנוטשים בחרו יעד יומי "אינטנסיבי" — יעד שאפתני מדי שובר את הרצף
REPORTED BY: רוי (ביקורת)
REQUIRED ACTION: שנה את שאלת ה-Onboarding מ"לאיזה ציון אתה שואף" ל**"כמה דקות ביום"**. תאריך המבחן נשאר (הוא מזין את 7.1). ציון יעד יורד לשדה רשות ואינו מוצג כמניע. ראה T-029
STATUS: 🔓 פתוח

ID: R-013   (plan/20-alerts.md line 21)
SEVERITY: 🔴 BLOCKER
SUBJECT: שימוש בחפיסות AnkiWeb כמקור תוכן
WHY IT IS A PROBLEM: תנאי השימוש של AnkiWeb נקראו במלואם (`ankiweb.net/account/terms`, מדור "Shared Deck License"). ציטוט: *"This license is for personal use only, and the deck may not be redistributed, re-uploaded, published, **or used for any other purposes** without explicit permission from the copyright holder."* הבעלות נשארת אצל המעלה; ההרשאה ניתנת ל-Ankitects להפצה, **לא לציבור**. רישיון רחב יותר קיים רק אם תיאור החפיסה מצהיר עליו במפורש — **אף אחת מהחפיסות העבריות שנבדקו לא מצהירה על כלום**
REPORTED BY: רוי (ביקורת)
REQUIRED ACTION: ⛔ **אין לקלוט תוכן משום חפיסת AnkiWeb.** גם פנייה למעלה לא תעזור בשלוש החפיסות הטובות ביותר — הן עצמן נגזרות: `1068296016` מצהירה "מתוך קורס הפסיכומטרי של המשרד לשיוויון חברתי", `1125194577` "נלקח מהקובץ שקמפוס מפרסמים", `514297870` היא פלט Google Translate שהמחבר עצמו מזהיר שאינו מדויק. המעלה אינו הבעלים ולכן אינו יכול להרשות. **מותר להשתמש ברשימות ככיוון לבחירת מילים בלבד — לא לתוכן**
STATUS: 🔓 פתוח

ID: R-026   (plan/20-alerts.md line 22)
SEVERITY: 🟠 WARNING
SUBJECT: **מנוע ההמשכים של מקלדת הבלוקים (`39 § 3`) — «מה יכול לבוא עכשיו».** ⛔ **המשימה ⛔ לא נכתבה לתור בטיק הזה, וזו תוצאה מכוונת.**
WHY IT IS A PROBLEM: `39 § 3` מחייב שהסט **אינו קבוע**: אחרי כל בחירה המקלדת מציעה סט חדש שנגזר ממה שכבר נבחר, עם **יותר אפשרויות מהנדרש** ומונה `N המשכים אפשריים` (‏6 ברנדר `kol-C-14-mail-open.png`). ⚠️ **זו טענה על אנגלית, ⛔ ולא בחירת ממשק**: קביעה שאחרי `I recommend` יכולים לבוא `the · a · one · this · your` היא **דקדוק**, ומנוע כזה שנכתב מהידע של סוכן הוא **בדיוק תוכן לימודי מומצא** לפי מדור 2. ⛔ **וההשלכה חמורה מכרטיסייה שגויה:** לומד שהמקלדת חסמה בפניו המשך תקין לומד שהוא **אינו תקין**. ⛔ **הרכיב הקיים ⛔ אינו תשובה** — `/world/compose` מציג בנק **סטטי** בשתי קבוצות (`lib/core/world.ts`), ⛔ ואין בו מושג של המשך.
REPORTED BY: PM (C-0273)
REQUIRED ACTION: ⛔ **אין לכתוב את T-19x של המקלדת לפני שיש מקור בדרגה א׳/ב׳.** ⚠️ **הכיוון היחיד שנראה תואם מבין מה שכבר מורשה אצלנו, ⛔ והוא מועמד ⛔ ולא ממצא:** **S12 — Tatoeba, CC BY 2.0 FR, מסחרי מותר** (`15-syllabus-digest`, «מקורות טקסט מורשים»). המשכים שנגזרים **במדידה** מקורפוס משפטים מורשה הם **תצפית**, ⛔ ולא המצאה — בדיוק ההבחנה שהתירה את `storyGate`. ⛔ **מה שעדיין ⛔ לא נעשה ו⛔ אין לטעון שנעשה:** ⛔ לא נמדד כמה מ-`N המשכים אפשריים` ניתן לגזור בפועל · ⛔ לא נבדק כיסוי הרמות A1–B2 · ⛔ לא הוכרע מה קורה כשהמדידה מחזירה **אפס** המשכים למצב תקין. ⇒ **טיק PM הבא: משימת מחקר אחת**, ואם אין מקור — **🔴 BLOCKER, והמקלדת ⛔ אינה נבנית.** ⚠️ **⛔ ואין מסלול «נתחיל עם רשימה קטנה שכתבנו בעצמנו»** — זה בדיוק R-014 בשם אחר.
STATUS: 🔓 פתוח — ⛔ **חוסם את `39 § 9` פריטים 2–5** (מקלדת · כיתות · קיר · סיפור בהמשכים). ⛔ **אינו חוסם את T-190…T-193** (תיבת הסימולציות נקראת בלי מקלדת)

ID: R-014   (plan/20-alerts.md line 23)
SEVERITY: 🟠 WARNING
SUBJECT: ההנחה שתוכן שנוצר ב-LLM נכון כי הוא נראה סביר
WHY IT IS A PROBLEM: נמדד: LLM שמתבקש לכתוב דוגמה ל**משמעות מסוימת** מדייק ב-**60–76% בלבד** (GPT-4o, aclanthology 2025.emnlp-main.1720) — לעומת 96–97% בהסבר חופשי. עברית היא שפה בינונית-משאבים, ולכן הציפייה היא לקצה הנמוך (הערכת GDEX: צרפתית 4.68/5, אינדונזית 4.41, טטום 3.74 — arXiv 2410.03182). **זו בדיוק R-006 בתחפושת חדשה.** בנוסף: **הסכמה בין מודלים אינה שער תקף** — שגיאות מתואמות, ומודל טעה ב-~48% מהמקרים דווקא בהסכמה גבוהה (arXiv 2607.08065)
REPORTED BY: רוי (ביקורת)
REQUIRED ACTION: ⛔ **אין להכניס פריט שנוצר ל-DB בלי לעבור את השער הדטרמיניסטי** (`lib/core/contentSchema.ts`). ובנוסף: **דגימת בקרה אנושית לכל אצווה** — לפי ISO 2859-1 AQL 1.0, אצווה של 501–1,200 פריטים ⇐ 80 פריטים לבדיקה, קבלה עד 2 פגמים. שיעור דגימה ל-LLM לא נחקר בספרות; זהו התקן הקרוב ביותר וכך הוא מסומן. ⚠️ **C-0011 עומק — F-020:** השער הדטרמיניסטי עצמו (`contentSchema.ts:103`) פוסל-לחיוב-שגוי — מילה מחוץ-לרמה כמו `card` (=car+d) עוברת אותו (אומת חי). ✅ **F-020 נסגר C-0012** — כל סיומת הותנתה בצורת הגזע (`d`/`r`/`st` בוטלו · `es` רק אחרי `s/x/z/ch/sh`), ⇒ ⛔ **הנוסח «השער אינו אמין עד תיקון F-020» בטל.** ⚠️ הכלל שנשאר בתוקף הוא הכלל עצמו: פריט שנוצר ב-LLM עובר את השער **וגם** את דגימת הבקרה האנושית. ⛔ השער לבדו אינו אישור. **אומת C-0169 ב-`60-findings.md` שורת F-020, ⛔ לא הונח**
STATUS: 🔓 פתוח

ID: R-015   (plan/20-alerts.md line 25)
SEVERITY: 🟠 WARNING
SUBJECT: **שתי הגדרות ה-Netlify שכל הגנת שכבה 1 תלויה בהן — אינן ניתנות לאימות מסביבת הסוכן**
WHY IT IS A PROBLEM: RULES § 0.1 ג׳ מחייב את הביקורת השבועית לאמת ש-`Branch deploys = None` **וגם** `Deploy Previews = Off`. שתיהן חיות **בלוח המחוונים של Netlify בלבד** ולא ב-`netlify.toml`, ולסוכן אין `NETLIFY_AUTH_TOKEN`. מה שכן אומת ב-C-0046: **0 PR-ים פתוחים** בריפו (נמדד מול GitHub API), ולכן Deploy Preview **אינו יכול לרוץ כרגע** — אבל זו תוצאה של מצב רגעי ולא של הגדרה. הסיכון המספרי: PR פתוח מ-`dev` ⇐ עד 24 בניות ביום ⇐ 360 קרדיטים ⇐ **תקציב חודשי שלם ביום אחד**
REPORTED BY: PM
REQUIRED ACTION: 🔴 **המנגנון שנרשם כאן ⛔ אינו הדרך עוד — עודכן 09/09, נמדד ו⛔ לא שוער.** ⓐ **הביקורת השבועית עצמה בוטלה** (`§ 0.2 ד׳`), והשורה הזאת המשיכה לתאר אותה כחובה חיה **12 יום אחרי**. ⓑ ‏`§ 0.1 ג׳` שהשורה מצטטת **בוטל אף הוא, 23/08**. ⓒ **מחבר Netlify קורא מצב פריסה בלי טוקן כלשהו** — נמדד חי 08/09: `state: ready · context: production · branch: main · commit_ref` על ה-SHA שנדחף. ⇒ `NETLIFY_AUTH_TOKEN` ⛔ **אינו נדרש** לשום דבר שהשורה הזאת ביקשה, ו-`docs/agents/PROMOTER.md` כבר אומר זאת במפורש. ⇒ **מי שמודד: PROMOTER, בכל קידום, ⛔ ולא PM פעם בשבוע.** ⚠️ **ומה שנשאר, וזה ⛔ לא זז:** שתי ההגדרות עצמן (`Branch deploys = None` · `Deploy Previews = Off`) חיות בלוח המחוונים ו⛔ אינן נקראות מהמחבר ⇒ **אישור ידני של רוי בלבד**, וכל דיווח שאומר «אומת» בלעדיו הוא טענה בלי ריצה.
STATUS: 🔓 פתוח — **✅ אישור ידני של רוי, 2026-08-12 (`02-inbox.md`): `Branch deploys = None` · `Deploy Previews = Off` · Production = `main`.** ⛔ זו **הצהרה אנושית ולא מדידה** — ה-PM לא ניגש ל-Netlify ואינו מתיימר שכן. תוקף: עד הביקורת השבועית הבאה (≥2026-08-19). נשאר פתוח עד T-046. **⚠️ C-0068 (ביקורת שבועית): ה-PM ⛔ אינו יכול לאמת ולא ניסה** — אין גישה ללוח הבקרה ואין טוקן. במקום טענת "אומת" נפתח **פריט 13 ב-`03-for-roy.md`** המבקש אישור אנושי מחודש. ⛔ עד שיתקבל, אין לכתוב בשום דיווח שההגדרות אומתו

ID: R-016   (plan/20-alerts.md line 40)
SEVERITY: 🟠 WARNING
SUBJECT: משוב אוטומטי על **הפקה חופשית** של הלומד (דקדוק, סדר מילים, שימוש)
WHY IT IS A PROBLEM: ‏D-030 פותחת את `העולם` עם הרכבת פוסט, ולפיצ׳ר הזה **אין ולא יהיה שיפוט נכונות בגרסה הראשונה**. שתי הדרכים היחידות לשפוט משפט שהלומד הרכיב הן ⓐ מודל שפה — עלות O(משתמשים) בלי תקציב (W3 · D-001) ודיוק **60–76%** במשימה תלוית-הקשר (R-014), **וההסכמה בין מודלים אינה שער תקף** (שגיאות מתואמות) · ⓑ מקור דקדוק/קורפוס מורשה מסחרית — **לא נבדק ולא נמצא**. ⛔ שיפוט שגוי במסך הפקה גרוע מאין שיפוט: הוא מלמד שגיאה בביטחון
REPORTED BY: PM (C-0092)
REQUIRED ACTION: ⛔ **אסור ל-UI לרמוז שמשפט נבדק או שהוא "נכון"** — התווית היחידה המותרת היא עובדתית ("השתמשת ב-<word>"). הבדיקה הדטרמיניסטית היחידה המותרת: הטוקן של מילת היעד נמצא בטיוטה. **הפעולה הנדרשת בהמשך:** לחפש מקור דרגה א׳/ב׳ למשוב על הפקה (‏learner corpora מורשים · ‏error-tagged corpora) לפני שנפתח פיצ׳ר משוב כלשהו
STATUS: 🔓 פתוח — ⛔ **אינו חוסם את T-061..T-063**, שאינן מבטיחות משוב

ID: R-017   (plan/20-alerts.md line 41)
SEVERITY: 🟠 WARNING
SUBJECT: **"הלומד שולט ברמה"** — כל סף אחוזים שיוצג ללומד כתנאי לעליית רמה
WHY IT IS A PROBLEM: נחקר C-0169 (‏10-pedagogy § 1.11) ו**התשובה שלילית: אין ולו סף אמפירי אחד בספרות.** שלושת הספים בשימוש (66% · 80% · 87–97%) הם מוסכמת מומחים, וה**מחברים עצמם** כותבים זאת: Webb/Sasao/Ballance 2017 — נקודת החיתוך *"appears to have been arbitrary"*; Xing & Fulcher 2007 — הסף 80% הגיע ב**תקשורת אישית** ו*"the basis for this assertion is not clear from published sources"*; McLean & Kramer 2015 מנמקים 96% באסימטריית ניחוש ⛔ ולא באימות תוצאות. ⇒ **מספר שנכתוב הוא טענה פדגוגית בלי מקור — בדיוק ההפרה שמדור 2 קיים כדי למנוע**
REPORTED BY: PM (C-0169)
REQUIRED ACTION: **מנגנון במקום מספר (D-037):** ⛔ אין שער אחוזים ואין נעילה בין רמות. הלומד עובר רמה ב**פעולה שלו**, המוצר מציג לו **ספירה עובדתית** ("315 ברמה · 42 סימנת שידעת · 18 ברשימת החזרה") ⛔ ולעולם לא הערכת מוכנות. אם רוי יבקש בכל זאת מספר — הניסוח היחיד המותר הוא **"80% לפי מוסכמת ה-VLT (Schmitt/Webb)"**, מסומן כמוסכמה ולא כממצא
STATUS: 🔓 פתוח — ⛔ **אינו חוסם.** ⛔ אל תחקור שוב: שלוש הסקירות המובילות נקראו ומצביעות זו על זו

ID: R-018   (plan/20-alerts.md line 42)
SEVERITY: 🔴 BLOCKER
SUBJECT: **הדרכת מאל"ו לסוגי השאלות** כמקור לתוכן לשונית `לימודים`
WHY IT IS A PROBLEM: נמצא C-0169 ש**קיימת** הדרכה רשמית מלאה (`nite.org.il/files/amir/amir_guide.pdf`, נקרא בפועל) עם הסבר לכל סוג שאלה ולמה כל מסיח שגוי — ובאותו קובץ, מילה במילה: *"אסור להעתיק או להפיץ בחינה או קטעים ממנה בכל צורה ובכל אמצעי, **או ללמדה** — כולה או חלקים ממנה — בלא אישור בכתב"*. ⚠️ **"או ללמדה" רחב מ-R-010 כפי שנוסח עד היום** — R-010 אסר להעתיק פריט; הנוסח הרשמי אוסר גם ללמד את הבחינה. אותה הצהרה גם ב-`amiram/tips/` וגם בקורס Campus IL
REPORTED BY: PM (C-0169)
REQUIRED ACTION: ⛔ **אין להעתיק, לגרד, לתרגם או לפרפרז שום טקסט, פריט או הסבר של מאל"ו — גם לא "בהשראה".** ✅ **מה שכן מותר, וזו ההבחנה המבצעית:** ⓐ העובדות המבניות A2–A5 (סוגי שאלות · מס' פרקים · משך · סולם) הן תיאור פומבי ומותרות לציטוט עם ייחוס · ⓑ ללמד את **סוג השאלה** כתופעה לשונית (מהו paraphrase, איך מזהים שינוי נושא-פועל) — מותר · ⓒ ⛔ ללמד את **הבחינה של מאל"ו** — אסור. פריטי התרגול נכתבים מקורית מעל S10–S12 (§ 1.12)
STATUS: 🔓 פתוח — **חוסם תוכן `לימודים`, ⛔ אינו חוסם את מבנה המסך.** ראה **T-085**

ID: R-019   (plan/20-alerts.md line 43)
SEVERITY: 🟠 WARNING
SUBJECT: קליטת **VOA Learning English** (S10) כמקור טקסט
WHY IT IS A PROBLEM: ‏VOA היא יצירת ממשלת ארה"ב ולכן נחלת הכלל, ודף התנאים שלה מתיר במפורש שימוש **מסחרי** בייחוס וללא share-alike (‏learningenglish.voanews.com/p/6861.html, נקרא C-0169) — **המקור הטוב ביותר שנמצא בפרויקט לצורך פריטי קריאה מקוריים.** ⚠️ **אבל VOA מפרסמת גם פריטים שמקורם ב-AP · Reuters · AFP, והם מוגנים בזכויות יוצרים ואינם נחלת הכלל.** קליטה עיוורת של הפיד מכניסה חומר מוגן ישירות למאגר
REPORTED BY: PM (C-0169)
REQUIRED ACTION: ⛔ **כלל קליטה מחייב:** פריט הנושא ייחוס לסוכנות ידיעות (AP · Reuters · AFP · Associated Press · Agence France-Presse) — **אינו נקלט**, ונספר ב-`skipped` עם סיבה. ⛔ אין "כנראה בסדר". בנוסף: שורת ייחוס `learningenglish.voanews.com` נכנסת ל-`data_sources` ול-`/sources` **באותו קומיט** של הקליטה הראשונה (חובת T-011 · D-007)
STATUS: 🔓 פתוח — ⛔ אינו חוסם · נפתח בפועל רק כשתיפתח **T-086**

ID: R-020   (plan/20-alerts.md line 44)
SEVERITY: 🟠 WARNING
SUBJECT: **לחץ זמן כמנגנון משחק** — שעון, ספירה לאחור, מכפיל מהירות או «מכה קריטית» לפי זמן תגובה, בזירת הקרב (T-095)
WHY IT IS A PROBLEM: רוי כתב בעצמו *«מד הזמן — הכרעה פדגוגית שדורשת מקור… ⛔ אין להמציא תשובה»*. **חיפשתי ולא נמצא: ⛔ אין ב-`10-pedagogy` ולו מקור אחד בדרגה א׳ או ב׳** על השפעת לחץ זמן על רכישת אוצר מילים בקרב לומדי L2 חלשים. מה שכן קיים אצלנו הוא הכיוון ההפוך — E3 («ברירת מחדל צנועה»), E4 (⛔ אין רצפים בלי מנגנון תיקון) ו-R-012 (כל אלמנט לחץ ב-onboarding עלה בנטישה) — ⛔ אך אף אחד מהם אינו מקור על **לחץ זמן בתוך משחק**, ולכן ⛔ אינו ראיה בעד או נגד
REPORTED BY: PM (C-0175)
REQUIRED ACTION: ✅ **התנאי המבני נמצא ונקבע ב-D-049: שעון מותר אך ורק על מילים שהלומד כבר יודע.** ⛔ ואינו מותר על מילה חדשה — Nation 2007 חותך: *"If the activity involves unknown vocabulary, it is not a fluency activity"*. ⛔ **מה שנשאר פתוח כאזהרה ⛔ ולא כחסימה:** ⛔ אין ולו מחקר אחד שמניפולט ספירה לאחור באפליקציית אוצר מילים ומודד גם שימור וגם חרדה ⇒ ⛔ אין לטעון «מהירות מלמדת», ⛔ אין מכפיל מהירות, ⛔ אין ניקוד לפי זמן. חזרה לבדיקה בעוד 90 יום. ⚠️ **עודכן C-0324 (D-126 § ה׳) — ⛔ ואינו נסגר.** `36 § 2` שורה 3 היא הכרזת ביטול מפורשת («‏`/arcade` הקיימת ⇒ בוטל. קרב 90 שניות») ו-`36 § 8` מחייב נזק לפי מהירות ⇒ **המנגנון מותר בזירה**, עם הגדרות של המפרט עצמו: ⛔ אין מצב כישלון על איטיות (`37 § 5`) · מענה ⛔ אינו עולה מאנה אף פעם (`§ 4`) · לחש לא מזוהה שטעו בו **חוזר** ⛔ ואינו נענש (`§ 2`). ⛔ **והחצי השני של R-020 חי כלשונו:** ⛔ אין לטעון «מהירות מלמדת» בשום מקום במוצר או בתכנון · ⛔ אין מכפיל מהירות **מחוץ לזירה** · ⛔ אין ניקוד לפי זמן **מחוץ לזירה** · ⛔ ואין העברת זמן תגובה לשום שדה ב-`word_progress` (אינווריאנט `37 § 13.1`). **Nation 2007 חותך:** קרב על מילת בסיס הוא **משחק**, ⛔ ולא פעילות שטף, ו⛔ אין לקרוא לו למידה
STATUS: 🟠 **הורדה מ-🔴 ל-🟠 ב-C-0177** — נחקר בזווית `fluency development strand` שלא נוסתה ב-C-0175, ונמצאו **S15…S19** (‏`10-pedagogy` § 1.14). ⛔ **אינו חוסם עוד את T-095**; חוסם אך ורק שעון על חומר לא-ידוע

ID: R-021   (plan/20-alerts.md line 45)
SEVERITY: 🟠 WARNING
SUBJECT: **המאגר ריק ברמות הגבוהות, ולכן כל מסך שנבנה מעליהן מציג אפס**
WHY IT IS A PROBLEM: נמדד ב-C-0171 מהזרע עצמו וצוטט על ידי רוי ב-18/08: A1 315 · A2 116 · B1 37 · B2 8 · **C1 ו-C2 אפס**. ⛔ **וזה אינו פער רישוי:** `15-syllabus-digest` 1.3.2 כבר נועל את מקור התווית — CEFR-J ל-A1–B2 ו-**Octanove ל-C1–C2**, שניהם CC BY-SA 4.0 ומסחריים. הפער הוא **ייצור**: עמוד השדרה NGSL הוא רשימת תדירות כללית וממילא ⛔ אינו מקור C1/C2, וסוכן התוכן ייצר עד היום לפי סדר NGSL ולא לפי רמה. ⚠️ **המחיר המיידי:** מפת הרמה (T-081) תציג «0 מילים» ללומד ב-C1, והזירה (T-095) תוצג מושבתת גם ב-B2 (8 מול 12 הנדרשות)
REPORTED BY: PM (C-0175)
REQUIRED ACTION: ⓐ סוכן ה-Content עובר ל**אצווה מכוונת-רמה**: קורא קודם את ספירות שש הרמות (`GET /api/levels/summary`, T-080) ומכוון לרמות הרעבות · ⓑ יעד עבודה **≥100 מילים בכל רמה A1–B2** (בקשת רוי) · ⓒ ⛔ **אפס המצאה בתוקף מלא** — מילה בלי מקור מורשה ⛔ אינה נכתבת כדי למלא מכסה; אין מקור ⇒ 🔴 BLOCKER חדש · ⓓ ⛔ כל פריט עובר את F-020 כרגיל, והשער לבדו אינו אישור (R-014)
STATUS: 🔓 פתוח — ⛔ **אינו חוסם את T-092…T-101**, כולן נבנות מול פיקסטורה

ID: R-022   (plan/20-alerts.md line 46)
SEVERITY: 🟠 WARNING
SUBJECT: **ניקוד, נקודות ולוח תוצאות כעמוד השדרה של המשחוק** — בזירת הקרב ובכל מסך אחר
WHY IT IS A PROBLEM: ⚠️ **נמדד ⛔ ולא נוחש, וה-PM קרא את המקור בעצמו:** Lee & Baek 2023 (*Sustainability* 15(14):11325, CC BY, S23) — מחקרי משחוק **עם** נקודות/ניקוד הניבו **g=0.340**, ואילו **בלי** נקודות **g=0.840**, ההפרש מובהק (Q=6.235, df=1, **p=0.013**). ⇒ עיצוב מוכוון-נקודות הניב **פחות ממחצית** הרווח. ולצדו Deci, Koestner & Ryan 1999 (128 מחקרים, S24): תגמול מוחשי צפוי מחליש מוטיבציה פנימית **d=−0.36**, בעוד **משוב חיובי מחזק אותה d=+0.33**. ⚠️ **הסייג שנרשם ביושר:** S23 נשען על **11 מחקרים בלבד, כולם מדרום-קוריאה**, והמחברים עצמם מסייגים הכללה ⇒ זו **אזהרה, ⛔ ולא איסור מוכח**.
REPORTED BY: PM (C-0177)
REQUIRED ACTION: **D-050:** עמוד השדרה של החזרה הוא **משוב כשירות והתקדמות נראית**, ⛔ לא פרסים, ⛔ לא לוח תוצאות, ⛔ לא מטבעות. ניקוד בתוך קרב יחיד מותר כמשוב מיידי; ⛔ מטבע מצטבר בין קרבים אינו נכתב לתור עד שיימצא מקור.
STATUS: 🔓 פתוח — ⛔ **אינו חוסם את T-092…T-097** (הזירה כבר נבנית בלי מטבע), חוסם אך ורק הוספת מטבע/לוח תוצאות

ID: R-023   (plan/20-alerts.md line 47)
SEVERITY: 🟠 WARNING
SUBJECT: **קושי הזירה מנותק מרמת הלומד (D-052)** ⇒ לומד A1 שמשחק הרבה יפגוש מילות B2/C1 שמעולם לא ראה
WHY IT IS A PROBLEM: ⚠️ **וזו סתירה מפורשת להוראה קודמת של רוי עצמו** (18/08: *«לומד ב-A2 ⛔ לעולם אינו נלחם על מילות C1»*), שהוחלפה בהוראה מאוחרת ומנומקת (19/08: הוגנות בין שני שחקנים שהשקיעו אותו זמן). **הבעיה הפדגוגית שנשארת:** ארבע אפשרויות על מילה שהלומד מעולם לא ראה הן **ניחוש**, וניחוש ⛔ אינו למידה. ⛔ **לא נמצא מקור** בדרגה א׳/ב׳ שקובע כמה רחוק **מעל** רמת הלומד עדיין מועיל — ‏E6 («בפיגור, עצור כרטיסיות חדשות») נוגע בעומס חזרות ⛔ ולא בקושי פריט, ולכן ⛔ אינו ראיה כאן
REPORTED BY: PM (C-0190)
REQUIRED ACTION: ⓐ ⛔ **אין לחסום את D-052** — הבעלים הכריע במפורש · ⓑ הנזק חסום במבנה שכבר קיים: ⛔ אין עונש על הפסד (D-045) · ⛔ אין ניקוד (D-050) · ⛔ הזירה אינה כלי אבחון (D-044) · ✅ ומילה שלא ידע **נאספת** (D-053), כלומר חשיפה ולא כישלון · ⓒ ⛔ **אין להציג ללומד את רמת ה-CEFR של מילת הקרב** — כך «קשה מדי» אינו נעשה שיפוט על הלומד · ⓓ נמצא מקור על מרחק-קושי מועיל ⇒ סולם רמת המשחק מכויל מחדש, ⛔ ולא לפני
STATUS: 🔓 פתוח — ⛔ **אינו חוסם את T-107…T-110**

ID: R-024   (plan/20-alerts.md line 48)
SEVERITY: 🟠 WARNING
SUBJECT: **סולם המרווחים לשליפה חוזרת של משפט שהלומד עצמו הפיק** — כמה פעמים המשפט חוזר, ובאילו מרווחים (‏D-076, «השליפה השנייה»)
WHY IT IS A PROBLEM: נפתח C-0244 בטיק תכנון. **המסקנה עצמה מאומתת ו⛔ אינה השאלה:** `15-syllabus-digest` (‏S20–S24) קובע «משפט קצר אחד + **שליפות חוזרות מרווחות** מאותה מילה», ולכן **הכיוון** מגובה. ⛔ **מה שאין הוא המספרים:** § 7.1 (‏Wozniak · Cepeda 2008) הוא מקור למתזמן ה**כרטיסיות** — פריט שהלומד **מזהה** — ו⛔ אין בפרויקט ולו מקור אחד על מרווחים לשליפה של פריט שהלומד **הפיק**. ⚠️ **העתקת מרווחי SM-2 לכאן היא הנחה, ⛔ ולא מקור**, ובדיוק הסוג שמדור 2 קיים כדי למנוע. ⛔ **וגם `next_review_at` של מילת היעד אינו מוצא** — הוא נמדד על זיהוי, ו§ 4.2יב אוסרת לגעת ב-SM-2 מהעולם
REPORTED BY: PM
REQUIRED ACTION: **טיק מחקר, זווית אקדמית:** מרווחי שליפה לפריט **מופק** (‏productive recall · generation effect · spacing של הפקה) — דרגה ב׳ מספיקה (הוצאות אקדמיות · מטא-אנליזות). ⛔ **אין מקור ⇒ ⛔ אין סולם ⇒ T-142 נשארת ⛔ חסומה** — ⛔ ו⛔ אין «נתחיל ב-1-3-7 ונכייל». ⚠️ ⛔ **אינה חוסמת שום משימה אחרת**: T-104…T-106 חיים ועובדים כפי שהם
STATUS: 🔓 פתוח — ⛔ אינה חוסמת את הלופ (בלם 11)

ID: R-025   (plan/20-alerts.md line 49)
SEVERITY: 🟠 WARNING
SUBJECT: **מקור נכסי האמנות לבמה של הזירה** — דמות לוחם, דמות יריב, רקע זירה, אפקטים (‏D-093 · T-161)
WHY IT IS A PROBLEM: נפתח C-0268 אחרי שרוי מסר תמונת ייחוס שיצר ב-AI. ⚠️ **תמונה אחת ⛔ אינה משחק:** הבמה דורשת **מצבים** (המתנה · מכה · פגיעה · ניצחון) ולכל אחד נכס. ⛔ **ושלושת המסלולים חסומים או לא-מאומתים היום:** ⓐ **ייצור תמונות בסוכן — חסום**, `RULES § 0.1 ז׳` פוסל את `imagegen-*` · `brandkit` · `image-to-code` («דורשים Gemini או ייצור תמונות בתשלום. **תקציב אפס**») · ⓑ **ספריות נכסי משחק פתוחות** — ⛔ **לא נבדק ולו רישיון אחד בטיק הזה, ו⛔ איני טוען שנבדק** · ⓒ **רוי מייצר בעצמו** — הוא כבר עשה את זה פעם
REPORTED BY: PM
REQUIRED ACTION: **טיק מחקר, זווית רישוי:** נכסי משחק 2D ברישיון **מסחרי מפורש** (CC0 · CC BY · MIT), עם **נוסח רישיון שנקרא בפועל** ו-`source_url`. ⛔ **ממצא בלי URL שנקרא — נזרק** (החוק העליון). ⚠️ **ובדיקה שנייה שאסור לדלג עליה:** רישיון שמתיר שימוש מסחרי אך דורש **ייחוס** מחייב שורה ב-`/sources`, בדיוק כמו NGSL. ⛔ **ואם אין מקור מורשה — ⛔ אין להמציא ואין «נשתמש בינתיים»**: המסלול הוא ⓒ, ורוי מייצר. ⚠️ **⛔ אינה חוסמת את T-160 · T-162 · T-163** — הכפתורים, האנימציה והניקוד ⛔ אינם דורשים נכס
STATUS: 🔓 פתוח — חוסמת את **T-161 בלבד**

ID: R-028   (plan/20-alerts.md line 50)
SEVERITY: 🟡 WARNING ⟨**נפתחה ונוטרלה באותו טיק — C-0348**⟩
SUBJECT: **`data/amirnet-vocab.csv` — הקובץ שפרומפט סוכן התוכן מפנה אליו כאל «התור» ⛔ אינו בריפו**
WHY IT IS A PROBLEM: **נמדד, ⛔ ולא שוער:** `ls data/` ⇒ ⛔ אינו · `git ls-tree origin/dev -- data/` ⇒ ⛔ אינו · `git log --all --diff-filter=A -- data/amirnet-vocab.csv` ⇒ **אפס קומיטים** · `git check-ignore -v data/amirnet-vocab.csv` ⇒ 🔴 **`.gitignore:12 → data/*.csv`**. ⇒ הקובץ נבנה אצל אופרטור, ה-README שלו נכנס לריפו, והקובץ עצמו **נחסם בשקט**. ⛔ **אין תקלה להמתין לה.**
REPORTED BY: ⛔ **הכשל ⛔ אינו «חסר קובץ» — הוא «חסום בשקט»:** `CONTENT.md` § «THE WORD LIST IS YOUR QUEUE» מפנה לשם, הסוכן ⛔ לא מוצא, מדווח «חסום» לפי כלל ⓐ, **ונופל לאצוות NGSL — טיק שנראה תקין ו⛔ אינו מקדם את הצוואר שנמדד ב-D-140.** אותה מחלקה של 24/08, שכבה אחת למעלה.
REQUIRED ACTION: PM
STATUS: ✅ **נוטרלה בטיק הזה, ⛔ ולא הועברה הלאה:** ‏`docs/content-amirnet-vocab-brief.md` גוזר את התור משני קבצי ה-CEFR ש**כן** בריפו (חמישה צעדים · `data/amirnet-vocab-README.md § 2`), וה-PM **הריץ את הגזירה ושחזר את השיטה**: 1,244/2,140/2,417/914 = **6,715** מול 6,713 ב-README (**+2 · 0.03%**, ⛔ לא מוסבר ו⛔ לא מנוחש). ⇒ **K-005 כשירה בלי הקובץ.** `T-222` הופכת את הגזירה לפקודה ומוציאה את הפלט ל-`data/generated/` (⛔ אינו מוחרג). ‏`03-for-roy` פריט 74

ID: R-027   (plan/20-alerts.md line 51)
SEVERITY: 🟡 WARNING ⟨**הורד מ-BLOCKER 28/08 — התשובה כבר הייתה בפרויקט**⟩
SUBJECT: **רישוי `data/amirnet-vocab.csv`**
WHY IT IS A PROBLEM: ✅ **נבדק, ⛔ ולא שוער — שני המקורות כבר מאושרים מסחרית ב-D-009:** ⓐ **CEFR-J** — ציטוט מילולי ב-`10-pedagogy` S8: *«can be used for research and commercial purposes with no charge, provided that you **cite the dataset properly**»* (Tono Laboratory, TUFS). ⓑ **Octanove** — **CC BY-SA** (‏S9). ⇒ **`10-pedagogy` שורה 109 כבר קובעת: «מסחרי מותר בציטוט».** ⛔ **החסם בוטל — הוא היה שאלה שכבר נענתה ב-05/08.**
REPORTED BY: ⚠️ **ומה שכן נשאר, ושונה ממה שנרשם:** ⓐ **חובת ייחוס בפועל** — שני המקורות דורשים קרדיט, ו⛔ אין היום שום מקום במוצר שנושא אותו. ⓑ 🟠 **share-alike על הנגזרת:** הקובץ **ממזג** CEFR-J עם Octanove, ו-CC BY-SA **מדבק** ⇒ **הפצת ה-CSV עצמו** מחייבת CC BY-SA. ⛔ **שימוש פנימי בו כדי לבחור באילו מילים לעבוד ⛔ אינו הפצה** ו⛔ אינו מוגבל. ⓒ **S8 נקרא ממפיץ צד־שלישי** (‏`openlanguageprofiles`), ⛔ לא מ-cefr-j.org — ראוי לאימות חוזר, ⛔ אך ⛔ אינו חוסם.
REQUIRED ACTION: PM
STATUS: ✅ **ⓐ נסגר C-0473 (PM) — נמדד בקלון הזה, ⛔ ולא שוער, ו⛔ לא נפתחה שורה שהייתה מיותרת:** `grep -n "id:\


SECTION 4 - DEPENDENCY PAIRS FOR THE DIAGRAM

4.1 RULES.md SECTION TO RULES.md SECTION
27 internal edges. Format: SOURCE -> TARGET (number of citations)
0.1 -> 0.29  (4)
0.4 -> 0.29  (3)
0.29 -> 0.20  (3)
0.29 -> 0.1  (3)
0.29 -> 0.22  (3)
0.6 -> 0.6ד  (2)
0.23 -> 0.29  (2)
0.0 -> 0.13  (1)
0.0 -> 0.12  (1)
0.1 -> 0.23  (1)
0.1 -> 0.2  (1)
0.2 -> 0.1  (1)
0.3 -> 0.8  (1)
0.6 -> 0.6ה  (1)
0.6 -> 0.23ח  (1)
0.6 -> 0.6ב  (1)
0.6 -> 0.23  (1)
0.7 -> 0.9  (1)
0.7 -> 0.23א  (1)
0.7 -> 0.23ג  (1)
0.17 -> 0.20  (1)
0.21 -> 0.20  (1)
0.26 -> 0.23ז  (1)
0.27 -> 0.18  (1)
0.28 -> 0.6ב  (1)
0.29 -> 0.4  (1)
0.29 -> 0.8  (1)

4.2 AGENT PROMPT TO RULES.md SECTION
Format: AGENT FILE -> SECTION
CONTENT.md -> 0.1 0.4 0.7 0.15 0.19 0.20 0.23א 0.27 0.29
CRITIC.md -> 0.4 0.23ח
DEV.md -> 0.1 0.4 0.5 0.6א 0.6ב 0.6ג 0.7 0.12 0.15 0.16 0.18 0.19 0.20 0.21 0.22 0.23 0.23א 0.23ו 0.23ז 0.28 0.29 0.30
PM.md -> 0.1 0.4 0.5 0.6 0.6א 0.6ב 0.6ד 0.7 0.12 0.15 0.16 0.17 0.19 0.20 0.21 0.22 0.23 0.23א 0.23ז 0.29 0.30
PROMOTER.md -> 0.1 0.3 0.4 0.7 0.8 0.19 0.20 0.22 0.23 0.27 0.29
QA.md -> 0.1 0.4 0.6א 0.6ב 0.6ד 0.7 0.15 0.16 0.18 0.19 0.20 0.21 0.23 0.23א 0.23ד 0.23ו 0.23ח 0.29 0.30

4.3 TEST FILE TO RULES.md SECTION
Format: TEST FILE -> SECTIONS IT CITES
app/api/health/route.test.ts -> 0.1
app/arcade/page.test.ts -> 0.22
app/globals.test.ts -> 0.1
lib/core/arenaHome.test.ts -> 0.22
scripts/agent-prompts.test.ts -> 0.1 0.5 0.6 0.6ב 0.12 0.15 0.16 0.17 0.18 0.20 0.21 0.22 0.23 0.23ח 0.27 0.28 0.29
scripts/check-page-titles.test.ts -> 0.16
scripts/gc-memory.test.ts -> 0.1
scripts/loop-health.test.ts -> 0.4 0.21 0.23ח 0.29
scripts/pre-push-gates.test.ts -> 0.1 0.4 0.29
scripts/rules-citations.test.ts -> 0.17 0.23ז 0.23ח 0.29 0.29ב
scripts/validate_palette.test.ts -> 0.9

4.4 CODE FILE TO RULES.md SECTION
Format: CODE FILE -> SECTIONS IT CITES
app/(tabs)/world/story/page.tsx -> 0.22
app/api/health/route.ts -> 0.1
app/api/practice/route.ts -> 0.22
app/api/review/context/route.ts -> 0.22
app/api/study/queue/route.ts -> 0.22
app/arcade/page.tsx -> 0.22
app/layout.tsx -> 0.22
components/ArenaBattle.tsx -> 0.22
components/ArenaHome.tsx -> 0.22
components/ArenaShell.tsx -> 0.22
components/ArenaSummary.tsx -> 0.22
components/Flashcard.tsx -> 0.22
lib/core/amirnetItemGate.ts -> 0.22
lib/core/arenaCharacter.ts -> 0.22
lib/core/arenaGesture.ts -> 0.22
lib/core/arenaHome.ts -> 0.22
lib/core/battle.ts -> 0.22
lib/core/colorVision.ts -> 0.9
scripts/build-surfaces.mjs -> 0.6ב
scripts/check-page-titles.mjs -> 0.16
scripts/check-plan-shape.mjs -> 0.1 0.6ב 0.22
scripts/check-rules-citations.mjs -> 0.0 0.1 0.23ח 0.29 0.29ב 0.29ג 0.29ו
scripts/fetch-wordnet.mjs -> 0.22
scripts/gc-memory.mjs -> 0.1 0.2
scripts/loop-health.mjs -> 0.2 0.4 0.6 0.6ב 0.6ג 0.17 0.21 0.23 0.23ח 0.28 0.29 0.30
scripts/validate_palette.mjs -> 0.9


SECTION 5 - FINDINGS FROM THIS RUN. NOTHING HERE WAS FIXED.

Finding 1. roster.json contradicts the server.
  docs/agents/roster.json declares all five agents "enabled": true.
  The server reports 13 Routines, every one of them enabled=false, with
  ended_reason and suspension_reason both empty, which per the tool documentation
  means paused by a human.
  Impact: loop:health check 17 measures agent silence against roster.json. It is
  currently measuring five agents that cannot fire. The file that exists to be the
  auditable declaration of who is switched on is wrong.
  Not fixed because setting it to false would silence check 17, and whether the
  loop stays off is a decision, not a defect.

Finding 2. The QA tick of 09/09 did not crash. It finished.
  Measured from the session record:
    created 18:51:40Z, last update 19:13:06Z, 21.4 minutes
    output_tokens 56,575 - it generated a great deal, so it was not hung
    context_usage 237,150 of 1,000,000 - not context exhaustion
    rate_limit status "allowed" - not throttled
    session_status IDLE, status_bucket REVIEW_READY, connection disconnected
  Its lock commit 8a77562 was pushed at 18:52:59Z, fifteen seconds in, and carries
  a valid note "verify(fast): exit 0". So pushing worked for that agent at that
  moment.
  Its declared outcome branch claude/nice-ride-bit6a7 was never created on origin.
  It never released the lock, and it never wrote the idle journal line that
  RULES 0.29ו requires from a run that produces no work commit.
  Conclusion available from evidence: the run reached a normal end of turn and
  simply produced nothing after the lock. This points at the tick's own flow, not
  at the platform.
  What is NOT knowable: why. There is no tool in this session that can read a CCR
  session transcript. get_session returns metadata only. The reasoning of that tick
  is unrecoverable from here.

Finding 3. A push under SKIP_VERIFY leaves no trace at all.
  scripts/hooks/pre-push runs the SKIP_VERIFY branch and exits 0 inside it. The
  git note is written much later in the file. So a skipped push writes no note.
  Consequence: absence of a note is ambiguous between three different things -
  an intermediate commit inside a multi-commit push (the note attaches to the
  pushed tip only), a commit older than the note mechanism, or a real SKIP_VERIFY
  push. There is no way to tell them apart from the repository.
  Measured: 64 notes exist across the last 200 commits of work/current. The oldest
  is 2026-09-06T15:11:47Z, which dates the mechanism.
  Therefore: it cannot be confirmed whether SKIP_VERIFY has ever been used by a
  real agent. The earlier statement that it has not been observed is accurate only
  in the sense that nothing positive records it.

Finding 4. The fast verify lane has fired exactly once, ever.
  Of the 64 attestation notes, 63 read "verify:" and 1 reads "verify(fast):".
  The single fast-lane use is 8a77562, the QA lock commit of 09/09.

Finding 5. Two alert rows are malformed and nothing checks.
  R-027 has 11 pipe cells, R-028 has 10, every other row has 9. plan/20-alerts.md
  is not parsed by measure:plan or by any other gate, so column drift there is
  invisible. Compare with plan/50-tasks.md and plan/60-findings.md, which have a
  malformed-row ceiling of zero enforced inside verify.

Finding 6. Twenty-six lettered sub-clauses are cited by nothing.
  Listed in SECTION 2. Their parent sections are heavily cited, so the sub-clauses
  are readable, but no file, test or script points at them individually. They are
  candidates for review, not automatically dead - a sub-clause can be load-bearing
  prose inside a cited parent.

Finding 7. Section 0.2 outranks every contradicting section and no prompt cites it.
  0.2 declares precedence in its own heading and has 18 citations, all from
  scripts/gc-memory.mjs and scripts/loop-health.mjs. Zero agent prompts cite it.
  An overriding rule that the agents never read is a rule that only tooling obeys.

Finding 8. The assertion at scripts/agent-prompts.test.ts:388 pins the bare string
  "בו-זמנית" against a 103KB file. It would pass on any occurrence anywhere,
  including inside an unrelated section. It is the weakest of the five literal
  pins and is the one most likely to give false confidence.


SECTION 6 - WHAT WAS NOT MEASURED

  The content of the QA tick that died. No transcript access exists in this session.
  Whether any agent has ever used SKIP_VERIFY. Not recorded anywhere, see Finding 3.
  Whether the 26 uncited sub-clauses are actually dead. That needs reading them, not
  counting citations.
  Whether the design constitution clauses are individually obeyed by the product.
  check-motion and check-text-floor enforce derived values, not the document.
