#!/usr/bin/env node
/**
 * ⛔ Read-only. Measures ONE implementation plan against the seven elements the Dev
 * agent needs in order to execute it without guessing, and prints what is missing.
 *
 * WHY THIS EXISTS (Roy, 24/08): "I want Dev to receive plans in a specific shape, and
 * when something is missing, to tell the PM to include it next time — so they learn to
 * work together."
 *
 * ⛔ The point is that the complaint is a MEASUREMENT, not an opinion. "The plan was
 * unclear" is unactionable and the PM cannot improve against it. "`## Interfaces` is
 * absent and 3 of 14 steps carry no file path" is a defect with an address.
 *
 * ⚠️ It measures SHAPE, ⛔ never correctness. A plan can carry all seven elements and
 * still be wrong; that is what the Critic and the tests are for. What this catches is
 * the class where Dev has to invent something the PM was supposed to decide — which is
 * exactly how scope creep re-enters through the back door (`RULES § 0.16`).
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (file === undefined) {
  console.error('usage: node scripts/check-plan-shape.mjs <plan file>');
  process.exit(2);
}
const text = readFileSync(file, 'utf8');
const lines = text.split('\n');

/**
 * A step is its heading line PLUS everything under it up to the next step — measured on
 * the real plans: `- [ ] **Step 2: run and confirm red**` carries its command in the
 * fenced block beneath it, and reading the heading alone reported 19 of 28 steps
 * "unaddressed" on a plan that addresses every one of them. Reading the block is the
 * difference between a gate that is used and a gate that is ignored.
 */
const STEP_HEAD = /^\s*- \[[ x]\]/;
const steps = [];
for (let i = 0; i < lines.length; i += 1) {
  if (!STEP_HEAD.test(lines[i] ?? '')) continue;
  const body = [lines[i]];
  for (let j = i + 1; j < lines.length && !STEP_HEAD.test(lines[j] ?? ''); j += 1) {
    if (/^##+ /.test(lines[j] ?? '')) break;
    body.push(lines[j]);
  }
  steps.push({ head: (lines[i] ?? '').replace(/^\s*- \[[ x]\]\s*/, ''), body: body.join('\n') });
}
// Addressed = names a file with an extension, or a command to run. ⛔ A step that says
// only "implement the component" is the one Dev has to guess at.
const PATH =
  /`[^`]*\/[^`]*\.[a-z]+[^`]*`|`?(npm run|npx|git|node|date|curl|mkdir|mv|sed|grep|rg) [a-z:@.\-]/;
const vagueSteps = steps.filter((s) => !PATH.test(s.body));

const ELEMENTS = [
  {
    key: 'tasks',
    label: 'קישור לשורות ה-50-tasks שהתוכנית מכסה',
    ok: /\bT-\d{3}\b/.test(text),
    why: 'בלי מזהה משימה אין דרך לסמן מה נסגר, והתוכנית הופכת יתומה.',
  },
  {
    key: 'files',
    label: 'מדור מבנה קבצים (`## File Structure` או שווה־ערך)',
    ok: /^##+ .*(File Structure|מבנה קבצים|Files)/m.test(text),
    why: 'Dev צריך לדעת מראש מה נוצר ומה נערך, ⛔ לא לגלות זאת תוך כדי.',
  },
  {
    key: 'interfaces',
    label: 'בלוק `Interfaces` — חתימות מדויקות',
    ok: /Interfaces/.test(text),
    why: 'חתימה שלא נכתבה היא חתימה ש-Dev ימציא, וה-Critic יפסול.',
  },
  {
    key: 'tests',
    label: 'קוד בדיקה אמיתי, ⛔ לא תיאור של בדיקה',
    ok: /```[a-z]*\n[\s\S]*?\b(expect|describe|it)\(/.test(text),
    why: '`test-driven-development` מחייב בדיקה נכשלת לפני מימוש. תיאור אינו בדיקה.',
  },
  {
    key: 'steps',
    label: 'צעדים מסומנים `- [ ]`',
    ok: steps.length >= 3,
    why: 'תוכנית בלי צעדים אינה ניתנת לביצוע חלקי ואינה ניתנת לחידוש אחרי הפסקה.',
    detail: `${steps.length} צעדים`,
  },
  {
    key: 'addressed',
    label: 'כל צעד נוקב בקובץ או בפקודה',
    ok: steps.length > 0 && vagueSteps.length === 0,
    why: 'צעד בלי כתובת הוא צעד ש-Dev מנחש. זה השער שדרכו זחילת תחולה חוזרת.',
    detail:
      vagueSteps.length === 0
        ? 'כולם'
        : `${vagueSteps.length} מתוך ${steps.length} ללא כתובת: ${vagueSteps
            .slice(0, 3)
            .map((s) => s.head.slice(0, 60))
            .join(' · ')}`,
  },
  {
    key: 'verify',
    label: 'צעד סיום שמריץ `npm run verify`',
    ok: /npm run verify|שער העבודה המלא|שער-כולל|השער-הכולל/.test(text),
    why: '`RULES § 0.1.1 ח׳` — השער רץ אחרון. תוכנית שאינה נוקבת בו מזמינה הצהרה ריקה.',
  },
];

// A UI plan carries two more, and only a UI plan: it must name the render it targets
// and say that finish comes from the constitution (`36 § 14.4`).
const isUi = /components\/|app\/\(tabs\)|\.tsx|docs\/design\//.test(text);
if (isUi) {
  ELEMENTS.push({
    key: 'render',
    label: '🎯 הרנדר שהמסך מכוון אליו, בשם הקובץ',
    ok: /docs\/design\/[a-z0-9_-]+\.(png|py)/i.test(text),
    why: '`36 § 14.4` — הפריסה מחייבת. תוכנית מסך שאינה נוקבת ברנדר מזמינה המצאה.',
  });
  ELEMENTS.push({
    key: 'finish',
    /* 🔄 REWRITTEN 24/08 (P4-2). The old check accepted the sentence "finish comes
     * from the constitution" — which `36 § 14.4` has since REVERSED, because that
     * sentence was the door every visual gap walked out of. What a screen plan must
     * now declare is the opposite: the render binds finish too, and layer A is the
     * only carve-out. ⛔ Accepting the retired sentence would keep rewarding it. */
    label: 'הצהרה שהרנדר מחייב **גם בגימור**, ושכבה A היא ההחרגה היחידה',
    ok: /הרנדר מחייב|מחייב גם בגימור|14\.4/.test(text) && /שכבה A|layer A|נגישות/.test(text),
    why: '`36 § 14.4` התהפך 24/08. «הגימור מגיע מהחוקה» ⛔ אינו עוד תשובה לפער מהרנדר — הוא היה דלת היציאה מכל פער חזותי.',
  });
}

const missing = ELEMENTS.filter((e) => !e.ok);
console.log(`plan: ${file}`);
for (const e of ELEMENTS) {
  console.log(`${e.ok ? '  ok  ' : 'MISS  '}${e.key.padEnd(11)}${e.label}${e.detail ? ` — ${e.detail}` : ''}`);
}
console.log(`shape: ${ELEMENTS.length - missing.length}/${ELEMENTS.length} elements present`);
if (missing.length > 0) {
  console.log('');
  console.log('⇒ שורה ל-plan/26-plan-feedback.md:');
  console.log(
    `| ‏<C-XXXX> | \`${file.split('/').pop()}\` | ${missing
      .map((m) => `\`${m.key}\``)
      .join(' · ')} | ${missing[0].why} | ⬜ |`,
  );
}
process.exit(missing.length === 0 ? 0 : 1);
