# תוכנית מימוש — הליכת **מסע** במקום הליכת **מסך**

**משימות:** `T-227`  ·  **המשך של: T-171**  ·  D-144ⓑ · D-103 · D-120
**REQUIRED SUB-SKILL:** `superpowers:executing-plans` · `superpowers:test-driven-development`

---

## 0 · למה זו הרחבה, ⛔ ולא תוכנית חדשה

‏`T-171` פתחה את **הליכת המסך**: `npm run check:mobile` נכנס לפרוטוקול הטיק כשער ראייה,
ומדפיס לכל מסך כותרת · אורך טקסט · מספר לחיצים · מתחת ל-44px · גלילה · שגיאות קונסולה.
‏`scripts/verify-mobile.mjs` הוא **2,124 שורות** והוא כבר מודד את כל אלה, כולל
`FLOW_ARRIVAL` — **לאן הפעולה הראשית מובילה**, לכל מסך בנפרד.

⛔ **ומה ש⛔ אף מדד ⛔ אינו עושה: לחצות מסכים.** ‏`FLOW_ARRIVAL` שואל «הקשה אחת על
`/signup` מגיעה למקום» — ⛔ ולא «כמה הקשות לוקח ללומד להגיע מהבית לכרטיסייה
הראשונה שלו». ⇒ **«סדר» ו«נוחות» נשארים טעם**, מפני שאין להם מספר.
‏D-144ⓑ הפך «דלתא נמדדת» לפרוסה חוקית, ו⛔ **בלי המספר הזה ⛔ אין ממה לגזור דלתא.**

⇒ **זו הרחבה של `T-171`, ⛔ לא משימה חדשה:** אותו קובץ, אותו דפדפן, אותה הרמה,
**רשומה חדשה אחת** ומעבר עליה.

⚠️ **⛔ זו ⛔ אינה תוכנית מסך.** ⛔ אין כאן רנדר ל-`36 § 14.4` להשוות מולו ו⛔ אין
רכיב חדש — הפלט הוא **מספר**. לכן ⛔ אין כאן רנדר מ-`docs/design` ו⛔ אין הצהרת גימור,
ו**זה מוצהר כאן במפורש** ⛔ ולא מושמט בשקט.

---

## 1 · שלושת המסעות — קבועים, מוצהרים, ⛔ ולא מוסקים

⚠️ **המסלולים חייבים לרוץ תחת `next start` ⛔ בלי env של Supabase** — זו הסביבה
שבה `check:mobile` רץ היום. ⇒ מסך מוגן עונה 307 (‏`proxy.ts` · TD-13), ולכן כל
מסע שאינו ציבורי בנוי מפיקסצ׳רי `/dev/*`, בדיוק כמו `FLOW_ARRIVAL` היום.

| מסע | המסלול | למה הוא |
|---|---|---|
| `join` | `/` → `/signup` → `/dev/onboarding` → `/dev/tabs/studies` | ההצטרפות. **המסע היחיד שלומד עובר פעם אחת בלבד** — ולכן כל הקשה מיותרת בו נספרת פעמיים |
| `learn` | `/dev/tabs/studies` → `/dev/tabs/cards` → `/dev/deck` → `/dev/deck/done` | הלולאה היומית. זו שנמדדת ב-`36 § 5` וזו שהלומד עושה כל יום |
| `play` | `/dev/world/ring` → `/dev/story` → `/dev/arcade/home` → `/dev/arcade` | המסע שחוצה **שלוש זרימות** (`nav` · `story` · `arena`) — ולכן הוא היחיד שבו סחיפת שמות בכלל יכולה להופיע |

**ארבע המדידות, לכל מסע:**

```
taps        — סך ההקשות מהמסך הראשון לאחרון, ⛔ ניווט ידני ⛔ לא נספר
deadEnd     — מסך בלי פעולה ראשית קדימה ו⛔ בלי דרך חזרה
nameDrift   — שתי תוויות עבריות שונות או יותר לאותו יעד, בתוך המסע
wayBack     — כל מסך שאינו הראשון נושא פקד שמחזיר למסך הקודם
```

🔴 **`nameDrift` הוא הממצא, וזה ⛔ אינו סגנון:** «למפת הרמה» מול «חזרה למפת הרמה»
מול «לימודים» הם שלושה שמות לאותו יעד. ‏`plan/63-surfaces.md` כבר מוצא את זה
**סטטית**; המסע מוצא אותו **בסדר שבו הלומד באמת פוגש אותו**, וזה ⛔ לא אותו דבר.

---

## 2 · Interfaces

```js
/** ⛔ Declared, ⛔ never inferred. One entry per journey, in scripts/verify-mobile.mjs. */
const JOURNEYS = {
  join: {
    steps: [
      { route: '/',                 action: '[data-action-bar] a', to: '/signup' },
      { route: '/signup',           action: 'button[type="submit"]', stays: true },
      { route: '/dev/onboarding',   action: 'button[type="submit"]', stays: true },
      { route: '/dev/tabs/studies', action: '[data-action-bar] a', to: '/login' },
    ],
    why: 'the one journey a learner walks exactly once',
  },
  // learn · play — same shape
};

/**
 * @param {import('playwright').Page} page
 * @param {string} name
 * @param {{steps: ReadonlyArray<object>, why: string}} journey
 * @returns {Promise<{name: string, taps: number, deadEnd: string[], nameDrift: string[], wayBack: string[]}>}
 */
async function walkJourney(page, name, journey) {}

/** ⛔ Pure, so it is testable without a browser. lib/core/journeyDrift.ts */
export function driftingNames(
  labelsByDestination: ReadonlyMap<string, ReadonlySet<string>>,
): readonly string[];
```

⛔ **`driftingNames` יושב ב-`lib/core/` והוא טהור** — ⛔ אפס דפדפן, ⛔ אפס `page`.
זו הסיבה היחידה שאפשר לבדוק את הלוגיקה בלי להרים שרת, וזה הכלל של `check:core`.

---

## 3 · File Structure

| קובץ | מה |
|---|---|
| `lib/core/journeyDrift.ts` | **חדש** — `driftingNames`, טהור |
| `lib/core/journeyDrift.test.ts` | **חדש** — הבדיקה הנופלת |
| `scripts/verify-mobile.mjs` | **נערך** — `JOURNEYS` · `walkJourney` · בלוק דיווח |
| `scripts/verify-mobile.test.ts` | **נערך** — טענה שהרשומה קיימת ושכל צעד נוקב בבורר |
| `package.json` | **נערך** — `walk:journey` |
| `plan/50-tasks.md` | **נערך** — `T-227` ⇒ 🟣 |

---

## 4 · הצעדים

- [x] **צעד 1 — הבדיקה הנופלת, ⛔ לפני כל שורת מימוש.** צור `lib/core/journeyDrift.test.ts` והרץ `npx vitest run lib/core/journeyDrift.test.ts` — **חייב להיכשל על מודול חסר**, ו⛔ לא על טענה:
```ts
import { describe, expect, it } from 'vitest';
import { driftingNames } from './journeyDrift';

describe('driftingNames', () => {
  it('⛔ אינו מדווח יעד שנקרא בשם אחד', () => {
    expect(driftingNames(new Map([['/cards', new Set(['למפת הרמה'])]]))).toEqual([]);
  });

  it('🔴 מדווח יעד ששני מסכים קוראים לו אחרת — וזה הממצא', () => {
    const labels = new Map([['/cards', new Set(['למפת הרמה', 'חזרה למפת הרמה'])]]);
    expect(driftingNames(labels)).toEqual(['/cards ⇒ «למפת הרמה» · «חזרה למפת הרמה»']);
  });

  it('⛔ אינו קורס על יעד בלי תוויות בכלל', () => {
    expect(driftingNames(new Map([['/x', new Set()]]))).toEqual([]);
  });
});
```
- [x] **צעד 2 — המימוש הטהור.** כתוב `lib/core/journeyDrift.ts` עד שהבדיקה ירוקה: `npx vitest run lib/core/journeyDrift.test.ts`. ואז `npm run check:core` — ⛔ אפס React, ⛔ אפס `window`.
- [x] **צעד 3 — רשומת המסעות.** הוסף `JOURNEYS` ל-`scripts/verify-mobile.mjs` ליד `FLOW_ARRIVAL` (‏`sed -n '275,355p' scripts/verify-mobile.mjs` — אותו דפוס, אותה הצדקה `why` לכל שורה). ⛔ **⛔ אל תיגע ב-`FLOW_ARRIVAL`** — הוא מודד הקשה בודדת ונשאר.
- [x] **צעד 4 — ההליכה.** מַמֵּש `walkJourney` ב-`scripts/verify-mobile.mjs`, בתוך ה-`browser` שכבר פתוח. אמת: `npm run walk:journey`. לכל צעד: קרא את התווית העברית של הבורר, הקש, אמת שהכתובת היא `to` (או ש⛔ לא זזה כש-`stays`), וספור. ⛔ **⛔ אל תפתח דפדפן שני** — ההרמה עולה ~25 שניות והיא כבר שולמה.
- [x] **צעד 5 — דרך חזרה.** ב-`scripts/verify-mobile.mjs`, לכל מסך שאינו הראשון במסע, אמת פקד חזרה. אמת: `npm run walk:journey`. ⛔ **מסך בלי דרך חזרה הוא `deadEnd` ⛔ גם אם יש לו פעולה קדימה** — זה בדיוק המבוי הסתום שרוי פגש באתר החי.
- [x] **צעד 6 — דיווח, ⛔ ולא הפלה.** ב-`scripts/verify-mobile.mjs` הדפס בלוק אחד (`npm run walk:journey`): `journey <name>: taps=N · deadEnd=… · nameDrift=… · wayBack=…`. 🔴 **הרשומה נולדת כאזהרה** — ‏`check(...)` ⛔ אינו נקרא עליה בהרצה הראשונה; היא נכנסת ל-`notes`. ⛔ **קו בסיס שמפיל את הבנייה ביום שהוא נמדד הוא הדרך ללמד כל סוכן להתעלם ממנו.**
- [x] **צעד 7 — הפקודה.** הוסף ל-`package.json`: `"walk:journey": "node scripts/verify-mobile.mjs --journeys-only"`, ודגל שמדלג על שאר הבדיקות. אמת: `npm run walk:journey`.
- [x] **צעד 8 — קו הבסיס נרשם.** הרץ `npm run walk:journey` ורשום את שלושת מספרי ה-`taps` בשורת `T-227` ב-`plan/50-tasks.md`. 🔴 **המספר הזה הוא כל התוצר** — ממנו ה-PM גוזר פרוסת D-144ⓑ («מ-7 הקשות ל-4»), ו⛔ בלעדיו ⛔ אין ממה לגזור.
- [x] **צעד 9 — השער המלא, אחרון.** `npm run verify` — ⛔ חמש הפקודות, ו⛔ אין טענת «עובר» בלי הפלט הטרי (`RULES § 0.6`). ואז `npm run measure:plan` באותו קומיט.

---

## 5 · הבדיקה העצמית — ⛔ מה תפיל את התוכנית הזאת

| הסימן | מה זה אומר |
|---|---|
| `taps` זהה בשלושת המסעות | הבורר תופס את אותו אלמנט בכל מסך ⇒ **ההליכה ⛔ אינה מהלכת** |
| `deadEnd` ריק בשלושתם בהרצה ראשונה | ⛔ חשוד. ‏`/dev/deck/done` ו-`/dev/arcade` הם מסכי סוף — **בדוק ידנית לפני שאתה מאמין** |
| `nameDrift` ריק | הצלב מול `npm run build:surfaces` — ‏`plan/63-surfaces.md` כבר מוצא סחיפה **סטטית**. שניהם ריקים = אמת; רק המסע ריק = הבורר ⛔ אינו קורא תוויות |
| ההרצה מוסיפה >60 שניות | ⛔ המסעות פותחים דפדפן משלהם. חזור לצעד 4 |

⚠️ **ומה ש⛔ אינו בתחולה, ⛔ ובכוונה:** ⛔ מסעות במסכים מוגנים (‏307 בלי env) ·
⛔ שינוי `FLOW_ARRIVAL` · ⛔ תוספת מסע רביעי · ⛔ הפלת הבנייה על מספר.
**⛔ הרחבת תחולה כאן היא בדיוק זחילת התחולה ש-`RULES § 0.16` נכתב נגדה.**
