# הצגת סיסמה + הצגת הכתובת שנרשמה (T-030 / F-013) — תוכנית מימוש

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לתת ללומד לראות את הסיסמה שהוא מקליד ואת הכתובת שנרשמה, כדי ששגיאת הקלדה אחת לא תיצור חשבון אבוד לצמיתות (F-013, קריטי כפליים כי אימות המייל כבוי — Q-001 ⓑ).

**Architecture:** כל כלל הוא פונקציה טהורה ב-`lib/core/auth.ts` (AR-2: אפס React/DOM), ו-`components/AuthForm.tsx` רק מרנדר. כפתור העין הוא `<button type="button">` בתוך עטיפה `relative` סביב שדה הסיסמה, ממוקם בצד ימין הפיזי (סוף הטקסט ה-LTR), עם `min-h-touch min-w-touch`. אין שדה אימות סיסמה — במובייל כפתור עין הוא התקן המקובל ועדיף.

**Tech Stack:** Next.js App Router · React client component · Tailwind (`min-h-touch`=44px) · Vitest (node env, טהור בלבד) · Playwright דרך `scripts/verify-mobile.mjs`.

## Global Constraints

- `lib/core/` טהור: אפס React, `window`/`document`/`localStorage`, `fetch`, `process.env`.
- רכיב ממשק לא ניגש לדאטהבייס — רק דרך `/app/api/` ו-`lib/api/client.ts`.
- Mobile-First 375px · יעדי מגע ≥44px · RTL עם bidi · TypeScript ללא `any`.
- אין `jsdom` בפרויקט — התנהגות רכיב נמדדת אך ורק ב-`scripts/verify-mobile.mjs` (Playwright), לא ב-Vitest.
- קופי בעברית בלבד; ⛔ אין להבטיח "AI" או "אדפטיבי" (R-011).
- **מחוץ לתחום:** הצגת הכתובת עם תיקון בלחיצה אחת במסך ה-onboarding היא **T-026** (`app/onboarding`), לא המשימה הזו.

---

### Task 1: כללים טהורים ב-`lib/core/auth.ts`

**Files:**
- Modify: `lib/core/auth.ts` (סוף הקובץ)
- Test: `lib/core/auth.test.ts`

**Interfaces:**
- Consumes: `SignupOutcome` (קיים בקובץ).
- Produces:
  - `passwordInputType(visible: boolean): 'text' | 'password'`
  - `PASSWORD_TOGGLE_LABELS_HE: { show: string; hide: string }`
  - `passwordToggleLabel(visible: boolean): string`
  - `confirmationNoticeHe(email: string): string`

- [ ] **Step 1: Write the failing test** — הוסף בסוף `lib/core/auth.test.ts`:

```ts
describe('password visibility (F-013)', () => {
  it('maps visibility to the input type', () => {
    expect(passwordInputType(false)).toBe('password');
    expect(passwordInputType(true)).toBe('text');
  });

  it('labels the toggle by what it will do next', () => {
    expect(passwordToggleLabel(false)).toBe(PASSWORD_TOGGLE_LABELS_HE.show);
    expect(passwordToggleLabel(true)).toBe(PASSWORD_TOGGLE_LABELS_HE.hide);
    expect(PASSWORD_TOGGLE_LABELS_HE.show).not.toBe(PASSWORD_TOGGLE_LABELS_HE.hide);
  });
});

describe('confirmationNoticeHe (F-013)', () => {
  it('names the address the learner actually registered', () => {
    expect(confirmationNoticeHe('Roy@Example.COM')).toContain('roy@example.com');
  });

  it('falls back to a generic sentence when no address came back', () => {
    const notice = confirmationNoticeHe('');
    expect(notice.length).toBeGreaterThan(0);
    expect(notice).not.toContain('  ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/core/auth.test.ts`
Expected: FAIL — `passwordInputType is not defined` (ואותו הדבר לשלוש הפונקציות האחרות).

- [ ] **Step 3: Write minimal implementation** — הוסף בסוף `lib/core/auth.ts`:

```ts
/** F-013: a typo the learner cannot see is an account lost for good while
 *  email confirmation is off (Q-001 ⓑ). The eye toggle is the mobile standard
 *  and beats a second "confirm password" field on a phone keyboard. */
export const PASSWORD_TOGGLE_LABELS_HE = {
  show: 'הצגת הסיסמה',
  hide: 'הסתרת הסיסמה',
} as const;

export function passwordInputType(visible: boolean): 'text' | 'password' {
  return visible ? 'text' : 'password';
}

/** Labelled by the action it performs next, not by the current state — that is
 *  what a screen reader announces on the button. */
export function passwordToggleLabel(visible: boolean): string {
  return visible ? PASSWORD_TOGGLE_LABELS_HE.hide : PASSWORD_TOGGLE_LABELS_HE.show;
}

/** Repeats the address back so a mistyped one is caught on the spot. */
export function confirmationNoticeHe(email: string): string {
  const address = normalizeEmail(email);
  if (!address) return 'שלחנו מייל לאישור הכתובת. אחרי האישור אפשר להתחבר.';
  return `שלחנו מייל לאישור הכתובת ${address}. אחרי האישור אפשר להתחבר. לא הכתובת שלך? אפשר להירשם שוב.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/core/auth.test.ts && npm run check:core`
Expected: PASS + core purity clean.

---

### Task 2: חיווט ב-`components/AuthForm.tsx`

**Files:**
- Modify: `components/AuthForm.tsx:174-195` (שדה הסיסמה) · `:106-109` (ענף האישור)

**Interfaces:**
- Consumes: `passwordInputType`, `passwordToggleLabel`, `confirmationNoticeHe` מ-Task 1.
- Produces: `<button data-password-toggle>` על `/signup` ו-`/login` — המזהה שבו Task 3 משתמש.

- [ ] **Step 1: Add the state and the imports**

```tsx
const [passwordVisible, setPasswordVisible] = useState(false);
```
ולייבוא: `passwordInputType, passwordToggleLabel, confirmationNoticeHe`.

- [ ] **Step 2: Replace the password field markup**

```tsx
<div className="relative">
  <input
    type={passwordInputType(passwordVisible)}
    name="password"
    dir="ltr"
    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
    autoCapitalize="none"
    spellCheck={false}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    aria-invalid={Boolean(fieldErrors.password)}
    className="min-h-touch w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-14 text-left text-lg text-slate-900 outline-none focus:border-slate-900"
  />
  {/* Physical right, not logical end: the field is dir="ltr" inside an RTL
      page, so the typed text ends on the right and the button must not sit
      on top of it. */}
  <button
    type="button"
    data-password-toggle
    onClick={() => setPasswordVisible((v) => !v)}
    aria-pressed={passwordVisible}
    aria-label={passwordToggleLabel(passwordVisible)}
    className="absolute inset-y-0 right-0 flex min-h-touch min-w-touch items-center justify-center text-base font-medium text-slate-600 active:text-slate-900"
  >
    {passwordVisible ? 'הסתר' : 'הצג'}
  </button>
</div>
```
העטיפה נכנסת בתוך ה-`<label>` הקיים, אחרי ה-`<span>` של הכותרת ולפני שורת השגיאה.

- [ ] **Step 3: Name the address in the confirmation branch**

```tsx
if (result.outcome === 'awaiting_email_confirmation') {
  setNotice(confirmationNoticeHe(result.email ?? check.email));
  setPassword('');
  setPasswordVisible(false);
  return;
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

---

### Task 3: מדידה אמיתית ב-`scripts/verify-mobile.mjs`

**Files:**
- Modify: `scripts/verify-mobile.mjs` (בתוך לולאת הראוטים, ליד בדיקת `heading anchored`)

- [ ] **Step 1: Add the failing check**

```js
// Password visibility (F-013). While email confirmation is off (Q-001 ⓑ) a
// single unseen typo is a permanently lost account, so the toggle is a
// measured guarantee, not a styling detail.
if (route === '/signup' || route === '/login') {
  const toggle = page.locator('[data-password-toggle]');
  const present = (await toggle.count()) === 1;
  check(present, `${at} password toggle present`, 'no [data-password-toggle] button');
  if (present) {
    const field = page.locator('input[name="password"]');
    check(
      (await field.getAttribute('type')) === 'password',
      `${at} password hidden by default`,
      `type is "${await field.getAttribute('type')}"`,
    );
    await toggle.click();
    check(
      (await field.getAttribute('type')) === 'text',
      `${at} toggle reveals the password`,
      `type stayed "${await field.getAttribute('type')}"`,
    );
    await toggle.click();
    check(
      (await field.getAttribute('type')) === 'password',
      `${at} toggle hides it again`,
      `type stayed "${await field.getAttribute('type')}"`,
    );
  }
}
```

- [ ] **Step 2: Run it against the current (unfixed) build to prove it fails**

Run: `npm run build && npm run check:mobile`
Expected: FAIL — `no [data-password-toggle] button` ב-6 מקרים (2 ראוטים × 3 רוחבים) — **לפני** מימוש Task 2.

- [ ] **Step 3: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: הכל exit 0. יעדי המגע ≥44px וה-overflow ב-320px נבדקים אוטומטית על הכפתור החדש בבדיקות הקיימות.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "loop(DEV): C-0005 [skip ci] password visibility toggle + named confirmation address (F-013)"
```
