---
name: "find-skill"
description: "se before deciding, planning, building, or reviewing any task, to identify which existing skill(s) apply to it — replaces manually checking docs/skills-registry.md"
---


# Find Skill

## Overview

Skills route by **two independent axes**: your current **moment** (deciding/
planning, building, or reviewing) and the **domain** (design or software).
A single skill can apply to more than one moment — check both columns
below, don't assume by your agent role.

A tag here is a **floor, not a ceiling** — load every skill that fits, not
just the first match.

## How to use

1. Name your current moment: deciding/planning · building · reviewing.
2. Name the domain: design (UI/UX/visual) · software (logic/correctness/
   security).
3. Find your row(s) below. Load each listed skill in full before you plan
   or execute.
4. Nothing fits? Check `docs/skills-registry.md` and
   `docs/skills-registry-superpowers.md` directly — this table doesn't
   replace them, it routes through them.

## Always, regardless of moment or domain

`using-superpowers` · `verification-before-completion`

## Routing table

| סקיל | רגע | תחום | הערה |
|---|---|---|---|
| `brainstorming` | החלטה | עיצוב | PM: כוונה/דרישות לפני מימוש |
| `find-animation-opportunities` | החלטה | עיצוב | קריאה בלבד, לא מממש |
| `emil-design-eng` | החלטה | עיצוב | "האם זה מספיק טוב", לא "איך לכתוב" |
| `apple-design` | שניהם | עיצוב | תואם ישירות ל-`plan/35-design-constitution.md` |
| `dispatching-parallel-agents` | החלטה | תהליך | PM: פירוק ל-2+ משימות עצמאיות |
| `writing-plans` | החלטה | תוכנה | DEV: לפני נגיעה בקוד |
| `animate` | שניהם | עיצוב | מצהיר על שני הרגעים בעצמו |
| `imagegen-frontend-mobile` | בנייה | עיצוב | עקרונות בלבד — לא מייצר תמונה |
| `taste-skill` | בנייה | עיצוב | ⚠️ ר' "שמות מתים" + "דיוק" למטה |
| `ui-styling` | בנייה | עיצוב | תת-סקיל של `ui-ux-pro-max` |
| `ui-ux-pro-max` | בנייה | עיצוב | הכלי: `search.py` — הרץ, אל תנחש |
| `simplify` | בנייה | תוכנה | מחיל תיקוני reuse/יעילות, לא מחפש באגים |
| `test-driven-development` | בנייה | תוכנה | DEV: לפני קוד מימוש |
| `systematic-debugging` | בנייה | תוכנה | באג/טסט נופל, לפני הצעת תיקון |
| `subagent-driven-development` | בנייה | תוכנה | ביצוע תוכנית עם משימות עצמאיות |
| `executing-plans` | בנייה | תוכנה | ביצוע תוכנית עם נקודות ביקורת |
| `finishing-a-development-branch` | בנייה | תוכנה | ⛔ QA בלבד — DEV/PM/CONTENT אסורים |
| `review-animations` | סקירה | עיצוב | ברירת מחדל: לסמן בעיה |
| `code-review` | סקירה | תוכנה | `--fix` הופך אותו לבנייה — QA לא מתקן |
| `security-review` | סקירה | תוכנה | הצעד היחיד ללא שער אוטומטי — QA.md:190 |
| `requesting-code-review` | סקירה | תוכנה | הצד שמבקש |
| `receiving-code-review` | סקירה | תוכנה | הצד שמקבל — קפדנות, לא הסכמה מנומסת |
| `hebrew-content-writer` | כל רגע | תוכן | CONTENT: חובה בכל ריצה, ללא יוצא מן הכלל |
| `dataviz` | שניהם | עיצוב | רלוונטיות מוגבלת — אין מסך גרפים ללומד |

## נתיבים מדויקים

**סקילי ריפו** (כולם על `work/current`):
```
skills/hebrew-content-writer/SKILL.md
skills/imagegen-frontend-mobile/SKILL.md
skills/taste-skill/SKILL.md
skills/ui-ux-pro-max/ui-ux-pro-max/SKILL.md        (הכלי: .../scripts/search.py)
skills/ui-ux-pro-max/ui-styling/SKILL.md
skills/superpowers/<name>/SKILL.md                  (12 סקילים, ר' טבלה למעלה לשמות)
```

**סקילי סשן** — "סקיל סשן, אין קובץ" בכל שורה שמסומנת ⛔ למעלה. **לא
מובטח**: `enabled_plugins: []` בכל שש המשימות, `ListPlugins` מחזיר ריק.
אם הסקיל לא נטען בפועל — המשך בלעדיו, אל תמתין לו.

## שמות מתים — לא לנתב אליהם

- **`design-system`** · **`redesign-existing-projects`** — ⛔ אין קובץ
  בשום מקום בריפו. אל תיתן להם נתיב, אף פעם.
- **`design-taste-frontend`** — **הפניה מחדש, לא חסימה**: זה שם ה-
  frontmatter *בתוך* `skills/taste-skill/SKILL.md`. אם אתה נתקל בתג
  הזה בשורת משימה ישנה — הסקיל האמיתי הוא `taste-skill`, בנתיב שלמעלה.

## דיוק — `taste-skill` על מסך מוצר

חוקיו נכתבו לדפי-נחיתה ושיווק, והוא מצהיר זאת בעצמו (`§ 13`): "Not dashboards,
not data tables, **not multi-step product UI**". ⇒ על מסכי מוצר — תרגול,
כרטיסים, זירה, הודעות — יישם את **העקרונות האוניברסליים**: נעילת תמה ·
ניגודיות · מוטיבציית-אנימציה · התבניות האסורות (`§ 9`) · בדיקת טרום-טיסה
(`§ 14`). ⛔ **ואל תיישם את חוקי דף-הנחיתה** — hero · eyebrow · בנטו · סדר
הסקשנים — הם ⛔ אינם חלים שם.

⚠️ וזה **דיוק, ⛔ לא הגבלה**: הטווח הרחב כבר הכריע פעמיים בלופ הזה — `D-195`
(`§ 4.5`, "NO DUPLICATE CTA INTENT") מנע כפתור שהיה שובר את מסך הכניסה,
ו-`D-206` (`§ 9.C`) הכריע את המרזב.

## טעות נפוצה

תג `[SKILL: X]` בשורת משימה הוא **רצפה, לא תקרה** — טעינת הסקיל שכבר
מתויג לא פוטרת מבדיקת שורות נוספות בטבלה שרלוונטיות לאותו רגע/תחום.