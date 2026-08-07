# Account Integrity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this
> plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. One task per Dev tick.

**Goal:** Close the three remaining ways a learner can lose an account to a typo while email
confirmation is off (Q-001 ⓑ): a password over bcrypt's ceiling that is reported under the
*email* field (F-009), an onboarding screen that never shows which address was actually
registered (T-026), and Latin input fields configured per call site so the next one silently
ships without `dir` or a keyboard hint (F-015 · TD-5).

**Architecture:** Bottom-up, three tasks, each independently shippable. Task 1 is pure
`/lib/core` — the length rules and the error mapping become data-in, data-out functions, so the
React layer inherits the fix without changing. Task 2 adds the one screen element that can still
catch a mistyped address (the address itself, plus a one-tap way back to `/signup` with it
prefilled), and — because `/onboarding` redirects when Supabase env is absent (TD-13) — measures
it through a `/dev/identity` layout fixture, the same pattern T-041 used for the card. Task 3
collapses the two hand-configured `<input>` elements into one `LatinField` component whose props
make `dir` and `enterKeyHint` **required by the type system**, which is what actually closes
TD-5: a rule the compiler enforces cannot be forgotten by the next call site.

**Tech Stack:** Next.js 16 App Router · React 19 · Tailwind 3.4 (semantic tokens, no `dark:`
variants) · TypeScript strict · Vitest (node env) · Playwright via `scripts/verify-mobile.mjs`.

**Covers:** F-009 (Task 1) · T-026 (Task 2) · F-015 + TD-5 (Task 3).
**Partially relieves:** TD-13 — the onboarding band gets measured even though `/onboarding`
itself still cannot be reached by the harness.

**Not covered, and why — read before "completing" anything here:**

- **F-008 (email enumeration on signup) is not in this plan and must not be "fixed" in it.**
  The finding's proposed fix is *"return 200 `awaiting_email_confirmation` for a taken address
  and move the 'already registered' message into the mail"*. Q-001 was decided **ⓑ — email
  confirmation is OFF** (no mail is sent at all). Applying the proposed fix today would tell a
  learner whose address is already registered *"we sent you a confirmation mail"*, and no mail
  would ever arrive: an existing user would be stranded on a screen that lies, in order to hide
  an address from an enumerator. F-008 is blocked on **T-025 (external SMTP)**, not on effort.
- **The whole M1 data path (T-007 · T-010 · T-013 · T-016 · T-018) is not plannable here.**
  Measured in this tick from inside the loop sandbox: `newgeneralservicelist.com`, `kaikki.org`
  and `cefr-j.org` all return `HTTP 403` with `x-deny-reason: host_not_allowed`, while
  `raw.githubusercontent.com` and `registry.npmjs.org` return normally. No agent in this loop
  can download a source corpus; the files have to arrive **through the repository**. See TD-17
  in `plan/30-architecture.md`.

---

## Global Constraints

Copied from `plan/RULES.md` § 0.6–0.8, `plan/00-control.md` and `plan/15-syllabus-digest.md`.
Every task below inherits all of them.

- ⛔ **No vertically centred layout.** `justify-center` inside a `flex-1` region is the exact
  anti-pattern F-011 measured at 67% empty screen and F-016 found again in `/onboarding`.
- ⛔ **No purple gradient. No uniformly rounded corners on every element. No Inter.**
- ⛔ **No invented learning content.** Nothing in this plan is a word pair. `fixture@example.com`
  is an address, not vocabulary — `example.com` is the RFC 2606 reserved domain and belongs to
  nobody.
- ⛔ **No copying from מאל"ו (R-010) or AnkiWeb (R-013).**
- ⛔ `plan/10-pedagogy.md` is off-limits to Dev. Everything needed here is in
  `plan/15-syllabus-digest.md`.
- `/lib/core/` stays pure: no React, no `window`, no `document`, no `localStorage`, no
  `sessionStorage`, no `process.env`, no `fetch`. Enforced by `npm run check:core`.
  (`TextEncoder` and `encodeURIComponent` are ECMAScript/WHATWG globals present in both
  runtimes and are **not** on the forbidden list in `scripts/check-core-purity.mjs` — verified
  against that file's `FORBIDDEN` array while writing this plan.)
- A UI component never touches the database. Everything goes through `/app/api/` and
  `lib/api/client.ts`.
- Mobile-first at 375px · every touch target ≥ 44×44px (`min-h-touch`) · RTL page with
  `unicode-bidi: isolate` around Latin text · PWA intact · TypeScript with no `any`.
- **Every English string rendered in the product goes through `<EnWord>`/`<EnText>`** — they are
  the only place in the tree allowed to write `lang="en"`. TD-14: the negative source scan cannot
  see markup that is *absent*, so **each new English field needs its own positive assertion** in
  `components/EnWord.test.ts`.
- `docs/api-contract.md` is updated in the **same commit** as any endpoint change.
- **Verification command, run fresh in the same message as any success claim:**
  `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
- Commit format: `loop(DEV): C-XXXX <summary>`. Push to `dev`. Never to `main`.
  Never `[skip ci]` (RULES § 0.7).

### Baseline at the time of writing

`git rev-parse HEAD` on `dev` = the C-0015 commit. Suite sizes to compare against:
**229 unit tests · 288 mobile checks.** A task that finishes with fewer of either has deleted
coverage and must explain why.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `lib/core/auth.ts` | password length rules · provider-error mapping · logout destination | 1, 2 |
| `lib/core/auth.test.ts` | unit proof of all of the above | 1, 2 |
| `components/RegisteredAddress.tsx` | **new** — the address band + one-tap correction form | 2 |
| `app/onboarding/page.tsx` | renders the band for the signed-in learner | 2 |
| `app/logout/route.ts` | reads the destination token, resolves it *before* signing out | 2 |
| `app/dev/identity/{page,layout}.tsx` | **new** — noindex layout fixture so the band is measured | 2 |
| `components/LatinField.tsx` | **new** — the single Latin `<input>`: `dir`, keyboard, adornment | 3 |
| `components/AuthForm.tsx` | consumes `LatinField` twice; keeps all submit logic | 3 |
| `components/LatinField.test.ts` | **new** — source scan: no other file configures a Latin input | 3 |
| `components/EnWord.test.ts` | +1 positive TD-14 assertion for the address | 2 |
| `scripts/verify-mobile.mjs` | +1 route, +6 measured checks | 2, 3 |
| `docs/api-contract.md` | `POST /logout` now accepts one field | 2 |

---

## Task 1: The password ceiling, and an honest `validation_failed` (F-009)

**Files:**
- Modify: `lib/core/auth.ts` (`AuthErrorCode` :16-22 · `AUTH_MESSAGES_HE` :37-44 ·
  `isAcceptablePassword` :63-65 · `checkCredentials` :88-110 · `mapAuthError` :118-131)
- Test: `lib/core/auth.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces — later tasks and `components/AuthForm.tsx` rely on these exact names:
  ```ts
  export const PASSWORD_MAX_BYTES = 72;
  export type PasswordLengthProblem = 'weak_password' | 'password_too_long' | null;
  export function passwordByteLength(raw: string): number;
  export function passwordLengthProblem(raw: string): PasswordLengthProblem;
  // AuthErrorCode gains the member 'password_too_long'
  ```

**Why bytes and not characters:** bcrypt hashes at most **72 bytes**, not 72 characters. A
password of 40 Hebrew letters is 40 characters and 80 bytes — `String.length` reads a harmless
40 while the provider rejects it. Counting characters here would leave exactly the bug F-009
describes, just further away.

- [x] **Step 1: Write the failing tests**

Append to `lib/core/auth.test.ts` (and add `AUTH_MESSAGES_HE` is already imported; add
`passwordByteLength`, `passwordLengthProblem` to the import block at the top of the file):

```ts
describe('passwordByteLength — bcrypt counts bytes, not characters (F-009)', () => {
  it('counts an ASCII password by characters', () => {
    expect(passwordByteLength('a'.repeat(72))).toBe(72);
  });

  it('counts a Hebrew password by UTF-8 bytes', () => {
    // 'סיסמה' is 5 characters and 10 bytes. Eight of them is 40 characters —
    // which String.length reports as comfortably short — and 80 bytes, which
    // bcrypt truncates and GoTrue rejects.
    expect('סיסמה'.repeat(8)).toHaveLength(40);
    expect(passwordByteLength('סיסמה'.repeat(8))).toBe(80);
  });
});

describe('passwordLengthProblem', () => {
  it('reports the 8 character floor', () => {
    expect(passwordLengthProblem('1234567')).toBe('weak_password');
  });

  it('accepts a password sitting exactly on the ceiling', () => {
    expect(passwordLengthProblem('a'.repeat(72))).toBe(null);
  });

  it('reports one byte over the ceiling', () => {
    expect(passwordLengthProblem('a'.repeat(73))).toBe('password_too_long');
  });

  it('reports a password that is short in characters and long in bytes', () => {
    expect(passwordLengthProblem('סיסמה'.repeat(8))).toBe('password_too_long');
  });
});

describe('checkCredentials — the ceiling names the right field (F-009)', () => {
  it('blames the password field and leaves the email field alone', () => {
    const result = checkCredentials(
      { email: 'roy@example.com', password: 'a'.repeat(73) },
      'signup',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.password).toBe(AUTH_MESSAGES_HE.password_too_long);
    expect(result.fieldErrors.email).toBeUndefined();
  });

  it('never applies the ceiling on login', () => {
    // bcrypt truncates at 72 bytes, so an account created under other rules with
    // a longer password still authenticates on its first 72 bytes. Enforcing the
    // ceiling on the login screen would lock a learner out of an account that
    // works — the exact shape of harm F-009 is about, pointed the other way.
    const result = checkCredentials(
      { email: 'roy@example.com', password: 'a'.repeat(200) },
      'login',
    );
    expect(result.ok).toBe(true);
  });
});

describe('mapAuthError — validation_failed is ambiguous (F-009)', () => {
  it('does not blame the address for a code GoTrue also uses for password length', () => {
    expect(mapAuthError({ code: 'validation_failed', status: 422 })).toBe('unavailable');
  });

  it('still blames the address when the provider actually names it', () => {
    expect(mapAuthError({ code: 'email_address_invalid', status: 400 })).toBe('invalid_email');
  });
});
```

- [x] **Step 2: Run the tests and confirm they fail for the stated reason**

Run: `npx vitest run lib/core/auth.test.ts`
Expected: failures naming `passwordByteLength is not a function`,
`passwordLengthProblem is not a function`, `expected undefined to be 'הסיסמה ארוכה מדי…'`
(the `password_too_long` message does not exist yet) and
`expected 'invalid_email' to be 'unavailable'`.
⚠️ If the last one *passes* before the implementation, stop: the mapping was already changed and
this plan is out of date.

- [x] **Step 3: Add the constant, the two functions and the message**

In `lib/core/auth.ts`, after `PASSWORD_MIN_LENGTH`:

```ts
/**
 * F-009 — bcrypt hashes at most 72 **bytes**, and GoTrue rejects anything longer
 * with `validation_failed`: the same code it returns for a malformed address.
 * That collision is the finding — a rejected password was displayed under the
 * email field, so the learner corrected a perfectly good address forever. We cap
 * on our side so that ambiguous provider code never has to be interpreted.
 */
export const PASSWORD_MAX_BYTES = 72;
```

Add `'password_too_long'` to the `AuthErrorCode` union, and to `AUTH_MESSAGES_HE`:

```ts
  password_too_long: `הסיסמה ארוכה מדי — עד ${PASSWORD_MAX_BYTES} תווים באנגלית (או 36 בעברית)`,
```

Then replace `isAcceptablePassword` with:

```ts
export type PasswordLengthProblem = 'weak_password' | 'password_too_long' | null;

/** UTF-8 bytes, because that is the unit bcrypt truncates on. `TextEncoder` is a
 *  WHATWG global present in Node and in every browser — no DOM, no polyfill. */
export function passwordByteLength(raw: string): number {
  return new TextEncoder().encode(raw).length;
}

export function passwordLengthProblem(raw: string): PasswordLengthProblem {
  if (raw.length < PASSWORD_MIN_LENGTH) return 'weak_password';
  if (passwordByteLength(raw) > PASSWORD_MAX_BYTES) return 'password_too_long';
  return null;
}

export function isAcceptablePassword(raw: string): boolean {
  return passwordLengthProblem(raw) === null;
}
```

- [x] **Step 4: Use the new rule in `checkCredentials`**

Replace the signup branch (currently `lib/core/auth.ts:100-106`):

```ts
  if (mode === 'signup') {
    const problem = passwordLengthProblem(password);
    if (problem) fieldErrors.password = AUTH_MESSAGES_HE[problem];
  } else if (password.length === 0) {
    fieldErrors.password = AUTH_MESSAGES_HE.invalid_credentials;
  }
```

- [x] **Step 5: Stop `mapAuthError` from guessing**

In `lib/core/auth.ts:126`, split the line that currently maps two codes to one:

```ts
  if (code === 'email_address_invalid') return 'invalid_email';
  // `validation_failed` is GoTrue's code for a malformed address AND for a
  // password over the bcrypt ceiling. It names no field, so neither do we —
  // `unavailable` is the honest answer and it renders as a form-level message
  // instead of an accusation under a field the learner did not get wrong.
  if (code === 'validation_failed') return 'unavailable';
```

- [x] **Step 6: Run the tests and confirm they pass**

Run: `npx vitest run lib/core/auth.test.ts`
Expected: PASS, with the file's count up by 9 from its C-0015 value.

- [x] **Step 7: Stop the signup hint from lying**

`components/AuthForm.tsx:219` currently reads `8 תווים לפחות. בלי כללים נוספים.` — there is now
one more rule. Change that string to:

```tsx
                <span className="text-base text-ink-muted">8 תווים לפחות.</span>
```

- [x] **Step 8: Mutation-check the ceiling before believing it**

Temporarily change `PASSWORD_MAX_BYTES` to `7200`, run `npx vitest run lib/core/auth.test.ts`,
and confirm **two** tests fail (`one byte over the ceiling`, `short in characters and long in
bytes`). Restore `72`. A test that passes under a broken constant is not testing the constant.

- [x] **Step 9: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all five green; unit total ≥ 238; mobile total unchanged at 288.

- [x] **Step 10: Commit**

```bash
git add lib/core/auth.ts lib/core/auth.test.ts components/AuthForm.tsx
git commit -m "loop(DEV): C-XXXX F-009 — password ceiling in bytes, validation_failed no longer blames the address"
```

---

## Task 2: The registered address, shown and fixable in one tap (T-026)

**Files:**
- Modify: `lib/core/auth.ts` (append) · `lib/core/auth.test.ts` (append)
- Create: `components/RegisteredAddress.tsx`
- Create: `app/dev/identity/page.tsx` · `app/dev/identity/layout.tsx`
- Modify: `app/onboarding/page.tsx:32-53` · `app/logout/route.ts` ·
  `components/EnWord.test.ts` · `scripts/verify-mobile.mjs` (`ROUTES` :25-39, checks near :255)
- Modify: `docs/api-contract.md` (`## POST /logout`, line 68)

**Interfaces:**
- Consumes: `normalizeEmail` (already in `lib/core/auth.ts:48`), `EnWord` from
  `components/EnWord.tsx` (default export, props `{ children, className? }`).
- Produces:
  ```ts
  export const LOGOUT_DESTINATION_FIELD = 'destination';
  export const REGISTERED_ADDRESS_LABEL_HE = 'נרשמת עם הכתובת';
  export const FIX_ADDRESS_CTA_HE = 'לא הכתובת שלי — להירשם מחדש';
  export function logoutRedirectPath(
    destination: string | null | undefined,
    email: string | null | undefined,
  ): string;
  ```

**Why a token and not a URL:** the correction control needs to end at `/signup` with the address
prefilled, i.e. logout needs a destination. Accepting a *path* from the page body would be an
open-redirect surface on an unauthenticated POST. The form therefore posts the fixed token
`fix_address`, and the route — not the page — builds the URL. Anything that is not exactly one
of our two tokens collapses to `/`.

**Why the address is read before `signOut`:** after `signOut()` there is no session and
`getUser()` returns nothing, so the address the learner is disowning is only knowable while they
are still signed in. Reading it afterwards would silently produce a bare `/signup`.

- [x] **Step 1: Write the failing tests for the destination rule**

Append to `lib/core/auth.test.ts` (add `logoutRedirectPath` to the import block):

```ts
describe('logoutRedirectPath (T-026)', () => {
  it('sends an ordinary sign-out home', () => {
    expect(logoutRedirectPath('home', 'roy@example.com')).toBe('/');
    expect(logoutRedirectPath(null, null)).toBe('/');
    expect(logoutRedirectPath(undefined, undefined)).toBe('/');
  });

  it('carries the mistyped address back into the signup form, normalised', () => {
    expect(logoutRedirectPath('fix_address', 'ROY@Example.com')).toBe(
      '/signup?email=roy%40example.com',
    );
  });

  it('falls back to a bare signup form when the address is unknown', () => {
    expect(logoutRedirectPath('fix_address', null)).toBe('/signup');
    expect(logoutRedirectPath('fix_address', '')).toBe('/signup');
  });

  it('never turns a supplied destination into a redirect', () => {
    // The field arrives in a POST body, and a POST body is not a trusted input:
    // /logout is reachable by anyone. An enum is the entire defence — nothing
    // that is not one of our two tokens can produce anything but '/'.
    for (const hostile of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/signup',
      'fix_address ',
      'FIX_ADDRESS',
    ]) {
      expect(logoutRedirectPath(hostile, 'roy@example.com')).toBe('/');
    }
  });
});
```

- [x] **Step 2: Run and confirm it fails**

Run: `npx vitest run lib/core/auth.test.ts`
Expected: FAIL — `logoutRedirectPath is not a function`.

- [x] **Step 3: Implement the destination rule**

Append to `lib/core/auth.ts`:

```ts
/**
 * T-026 — the name of the hidden field that tells /logout where the learner is
 * going. Exported so the form and the route cannot drift apart on a string.
 */
export const LOGOUT_DESTINATION_FIELD = 'destination';

export const REGISTERED_ADDRESS_LABEL_HE = 'נרשמת עם הכתובת';
export const FIX_ADDRESS_CTA_HE = 'לא הכתובת שלי — להירשם מחדש';

/**
 * Where a sign-out ends. Deliberately a two-value enum rather than a path: the
 * field arrives in an unauthenticated POST body, so accepting a path would make
 * /logout an open redirect. Only `fix_address` does anything, and even then the
 * URL is built here from an address we read from the session ourselves.
 */
export function logoutRedirectPath(
  destination: string | null | undefined,
  email: string | null | undefined,
): string {
  if (destination !== 'fix_address') return '/';
  const address = email ? normalizeEmail(email) : '';
  return address ? `/signup?email=${encodeURIComponent(address)}` : '/signup';
}
```

- [x] **Step 4: Run and confirm it passes**

Run: `npx vitest run lib/core/auth.test.ts`
Expected: PASS, 4 more tests than Step 2.

- [x] **Step 5: Build the band**

Create `components/RegisteredAddress.tsx`:

```tsx
import EnWord from '@/components/EnWord';
import {
  FIX_ADDRESS_CTA_HE,
  LOGOUT_DESTINATION_FIELD,
  REGISTERED_ADDRESS_LABEL_HE,
} from '@/lib/core/auth';

/**
 * T-026 — the address the learner registered with, on the first screen behind
 * the session wall.
 *
 * While email confirmation is off (Q-001 ⓑ) nothing ever proves the address is
 * real: a learner who typed `gmial.com` has a working account today and no way
 * back into it the moment the session ends. This band is the last place that
 * mistake is still visible to the person who made it, so it names the address
 * and offers exactly one action.
 *
 * A plain <form>, like the sign-out control beside it: it must work with
 * JavaScript disabled, and a POST cannot be triggered by a stray <img> the way a
 * GET can. Not a client component — no state, no handlers.
 */
export default function RegisteredAddress({ email }: { readonly email: string }) {
  return (
    <div
      data-registered-email
      className="flex flex-col gap-2 rounded-xl border border-border-strong bg-surface-raised px-4 py-3"
    >
      <p className="text-base text-ink-muted">
        {REGISTERED_ADDRESS_LABEL_HE}{' '}
        {/* An address is Latin text inside a Hebrew sentence: without isolation
            the trailing period of the sentence jumps to the wrong end of it. */}
        <EnWord className="font-semibold text-ink">{email}</EnWord>
      </p>
      <form action="/logout" method="post">
        <input type="hidden" name={LOGOUT_DESTINATION_FIELD} value="fix_address" />
        <button
          type="submit"
          className="flex min-h-touch items-center text-base font-semibold text-ink underline"
        >
          {FIX_ADDRESS_CTA_HE}
        </button>
      </form>
    </div>
  );
}
```

- [x] **Step 6: Add the positive TD-14 assertion**

Append inside the existing `describe` block in `components/EnWord.test.ts` (after the preview-card
test at :174):

```ts
  it('the registered address is English and is wrapped at its call site (TD-14)', () => {
    // Same lesson as the flashcard headword: a bare <span>{email}</span> renders
    // an address with no lang, no dir and no isolation, and every negative scan
    // in this file stays green because there is nothing to scan for.
    const src = readFileSync(join('components', 'RegisteredAddress.tsx'), 'utf8');
    expect(src, 'the registered address is Latin text in a Hebrew sentence').toMatch(
      /<EnWord[^>]*>\s*\{email\}\s*<\/EnWord>/,
    );
  });
```

- [x] **Step 7: Render it on the real screen**

In `app/onboarding/page.tsx`, import the component and insert it directly under the heading
block, inside the existing top-anchored `flex flex-col gap-4` wrapper (do **not** reintroduce
`justify-center` — F-011/F-016):

```tsx
        {user.email && <RegisteredAddress email={user.email} />}
```

`user.email` is optional on the Supabase `User` type; a session without one (future phone auth)
renders no band rather than an empty one.

- [x] **Step 8: Teach `/logout` the token**

Replace the body of `POST` in `app/logout/route.ts`:

```ts
export async function POST(request: Request) {
  // Read the token before anything else: after signOut() there is no session and
  // the address the learner is disowning becomes unknowable (T-026).
  let destination: string | null = null;
  try {
    const form = await request.formData();
    const raw = form.get(LOGOUT_DESTINATION_FIELD);
    destination = typeof raw === 'string' ? raw : null;
  } catch {
    destination = null;
  }

  let email: string | null = null;
  const env = readSupabaseEnv();
  if (env) {
    const supabase = createRouteClient(env, await cookies());
    if (destination === 'fix_address') {
      const { data } = await supabase.auth.getUser();
      email = data.user?.email ?? null;
    }
    // Failure here still ends in a redirect: a learner who pressed "יציאה" must
    // never be left staring at an error screen.
    await supabase.auth.signOut().catch(() => undefined);
  }

  return NextResponse.redirect(new URL(logoutRedirectPath(destination, email), request.url), {
    status: 303,
  });
}
```

Add `LOGOUT_DESTINATION_FIELD` and `logoutRedirectPath` to the imports from `@/lib/core/auth`.
The existing sign-out form sends no field → `destination === null` → `/`, exactly as before.

- [x] **Step 9: Update the contract in the same commit**

In `docs/api-contract.md`, replace the last sentence of `## POST /logout` (line 72):

```md
מקבלת שדה טופס יחיד ואופציונלי, `destination`. הערך היחיד שיש לו משמעות הוא
`fix_address` (T-026) — יציאה שנועדה לתקן כתובת שגויה, שמסתיימת ב-`303` ל-
`/signup?email=<הכתובת שהייתה בסשן>`. **כל** ערך אחר, לרבות נתיב או כתובת מלאה,
מסתיים ב-`303` ל-`/` — הגוף מגיע מבקשה לא מאומתת, ולכן הוא אסימון ולא יעד.
```

- [x] **Step 10: Create the measurement fixture**

`app/dev/identity/layout.tsx`:

```tsx
import type { Metadata } from 'next';

/** A layout fixture must never be a search result. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevIdentityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

`app/dev/identity/page.tsx`:

```tsx
import RegisteredAddress from '@/components/RegisteredAddress';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * TD-13: the harness runs without Supabase env, so `/onboarding` answers 307 to
 * `/login?expired=1` and every line reporting "ok /onboarding …" is really
 * measuring the login screen. The band would therefore ship unmeasured — the
 * exact F-007 pattern. `fixture@example.com` is nobody: RFC 2606 reserves
 * example.com precisely so that test addresses cannot reach a real person.
 */
export default function DevIdentityPage() {
  return (
    <>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו מסך מוצר</p>
      <RegisteredAddress email="fixture@example.com" />
    </>
  );
}
```

- [x] **Step 11: Measure it**

In `scripts/verify-mobile.mjs`, add `'/dev/identity',` to `ROUTES` (after the `/dev/card/*`
entries), and add this block beside the other route-specific checks (after the password-toggle
block that ends at :324):

```js
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
```

- [x] **Step 12: Prove the new checks can fail**

Temporarily replace `<EnWord className="font-semibold text-ink">{email}</EnWord>` in
`RegisteredAddress.tsx` with `<span className="font-semibold text-ink">{email}</span>`, then run
`npm run build && npm run check:mobile`.
Expected: **3 mobile failures** (`the address travels through <EnWord>` at 320/375/414) **and**
`npx vitest run components/EnWord.test.ts` fails on the new TD-14 assertion. Restore `<EnWord>`.
This is the step that proves TD-14's positive rule is actually being enforced here — C-0015
measured a bare `<span>` leaving 222 unit tests and 219 mobile checks green.

- [x] **Step 13: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all five green; unit total ≥ 243; mobile total ≥ 300 (one new route contributes the
standard per-route checks plus 4 band checks × 3 widths).

- [x] **Step 14: Commit**

```bash
git add lib/core/auth.ts lib/core/auth.test.ts components/RegisteredAddress.tsx \
        components/EnWord.test.ts app/onboarding/page.tsx app/logout/route.ts \
        app/dev/identity scripts/verify-mobile.mjs docs/api-contract.md
git commit -m "loop(DEV): C-XXXX T-026 — the registered address is visible and fixable in one tap"
```

---

## Task 3: One Latin input component (F-015 · TD-5)

**Files:**
- Create: `components/LatinField.tsx`
- Create: `components/LatinField.test.ts`
- Modify: `components/AuthForm.tsx:163-222` (the two `<label>` blocks only — no change to
  `onSubmit`, state, or the submit button)
- Modify: `scripts/verify-mobile.mjs`

**Interfaces:**
- Consumes: `passwordInputType`, `passwordToggleLabel` from `lib/core/auth.ts` (unchanged),
  `FieldErrors` for the error string.
- Produces:
  ```ts
  export interface LatinFieldProps {
    readonly name: 'email' | 'password';
    readonly label: string;
    readonly type: 'email' | 'text' | 'password';
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly autoComplete: string;
    readonly enterKeyHint: 'next' | 'go';   // required on purpose — see below
    readonly inputMode?: 'email';
    readonly invalid: boolean;
    readonly inputClassName?: string;
    readonly adornment?: React.ReactNode;   // rendered inside a relative wrapper
    readonly footer?: React.ReactNode;      // error text or hint, below the field
  }
  export default function LatinField(props: LatinFieldProps): React.JSX.Element;
  ```

**Why this closes TD-5 rather than just moving code:** `enterKeyHint` is a **required** prop, so
the compiler refuses a Latin field that does not declare a keyboard action, and `dir="ltr"` is
written once in a file the `LatinField.test.ts` scan pins there. TD-5 has been open since C-0003
because the attributes live at the call site; a rule enforced at the call site is a rule that the
next call site forgets. `<EnWord>` cannot take this job — it is a `<span>` that wraps text, and
`unicode-bidi: isolate` on a control the learner types into is not what we want (TD-5's own note).

**Keyboard values (F-015):** `next` on the email field (there is a field after it), `go` on the
password field (submitting is what comes next). Nothing else in this product takes Latin input.

- [ ] **Step 1: Write the failing source-scan test**

Create `components/LatinField.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * TD-5 guard, in the same shape as the T-009 guard in EnWord.test.ts: the claim
 * is "every Latin text input in this product is configured in one file", and a
 * render test proves one call site is right while a source scan proves no other
 * call site exists.
 */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const LATIN_FIELD = join('components', 'LatinField.tsx');
/** The typed-production answer box (T-041). It is a card control, not a
 *  credential field, and EnWord.test.ts already holds it to its own rules. */
const FLASHCARD = join('components', 'Flashcard.tsx');
const SOURCES = [...walk('app'), ...walk('components')];

describe('every Latin text input goes through <LatinField> (TD-5)', () => {
  it('scans a non-trivial number of files, including LatinField itself', () => {
    expect(SOURCES.length).toBeGreaterThan(10);
    expect(SOURCES).toContain(LATIN_FIELD);
  });

  it('no file other than LatinField.tsx puts dir="ltr" on an input', () => {
    const offenders = SOURCES.filter((f) => f !== LATIN_FIELD && f !== FLASHCARD).filter((f) => {
      const src = readFileSync(f, 'utf8');
      // Every `<input` opening tag in the file, then: does any of them declare dir?
      return src
        .split('<input')
        .slice(1)
        .some((tail) => /dir\s*=\s*[{'"\s]*['"]?ltr/i.test(tail.slice(0, tail.indexOf('>') + 1)));
    });
    expect(offenders, 'configure the field through <LatinField> instead').toEqual([]);
  });

  it('LatinField declares direction and keyboard together, and requires the hint', () => {
    const src = readFileSync(LATIN_FIELD, 'utf8');
    expect(src).toMatch(/dir="ltr"/);
    expect(src).toMatch(/enterKeyHint=\{enterKeyHint\}/);
    expect(src, 'enterKeyHint must not be optional — that is what closes TD-5').not.toMatch(
      /enterKeyHint\?\s*:/,
    );
  });

  it('AuthForm asks for the two keyboards F-015 specifies', () => {
    const src = readFileSync(join('components', 'AuthForm.tsx'), 'utf8');
    expect(src).toMatch(/name="email"[\s\S]{0,400}enterKeyHint="next"/);
    expect(src).toMatch(/name="password"[\s\S]{0,400}enterKeyHint="go"/);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `npx vitest run components/LatinField.test.ts`
Expected: FAIL — `ENOENT: components/LatinField.tsx`, and the AuthForm test fails because no
`enterKeyHint` exists anywhere yet.

- [ ] **Step 3: Write the component**

Create `components/LatinField.tsx`:

```tsx
'use client';

/**
 * The single Latin text input of this product (TD-5).
 *
 * An email address and a password are Latin runs inside an RTL page, and three
 * things have to be right together or the field is subtly wrong: `dir="ltr"` so
 * the caret and the @ sit where the learner expects, the mobile keyboard hints
 * (`inputMode`, `autoCapitalize`, `spellCheck`), and `enterKeyHint` so the
 * action key says "הבא"/"עבור" instead of a bare Enter (F-015). Scattering them
 * across call sites is how one goes missing — `enterKeyHint` is required by the
 * type below precisely so the compiler catches the next field that forgets it.
 *
 * `<EnWord>` deliberately does NOT cover this: it is a <span> that wraps text,
 * and unicode-bidi: isolate on a control the learner types into is not wanted.
 */
export interface LatinFieldProps {
  readonly name: 'email' | 'password';
  readonly label: string;
  readonly type: 'email' | 'text' | 'password';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly autoComplete: string;
  readonly enterKeyHint: 'next' | 'go';
  readonly inputMode?: 'email';
  readonly invalid: boolean;
  readonly inputClassName?: string;
  readonly adornment?: React.ReactNode;
  readonly footer?: React.ReactNode;
}

const BASE_INPUT =
  'min-h-touch w-full rounded-xl border border-border-strong bg-surface-raised px-4 py-3 text-left text-lg text-ink outline-none focus:border-brand';

export default function LatinField({
  name,
  label,
  type,
  value,
  onChange,
  autoComplete,
  enterKeyHint,
  inputMode,
  invalid,
  inputClassName,
  adornment,
  footer,
}: LatinFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-base font-medium text-ink">{label}</span>
      <div className="relative">
        <input
          type={type}
          name={name}
          dir="ltr"
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={[BASE_INPUT, inputClassName].filter(Boolean).join(' ')}
        />
        {adornment}
      </div>
      {footer}
    </label>
  );
}
```

- [ ] **Step 4: Rewrite the two fields in `AuthForm`**

Replace both `<label>` blocks (`components/AuthForm.tsx:164-222`) with:

```tsx
          <LatinField
            name="email"
            label="אימייל"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            value={email}
            onChange={setEmail}
            invalid={Boolean(fieldErrors.email)}
            footer={
              fieldErrors.email ? (
                <span className="text-base text-red-700">{fieldErrors.email}</span>
              ) : null
            }
          />

          <LatinField
            name="password"
            label="סיסמה"
            type={passwordInputType(passwordVisible)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            enterKeyHint="go"
            value={password}
            onChange={setPassword}
            invalid={Boolean(fieldErrors.password)}
            // Physical right, not logical end: the field is dir="ltr" inside an
            // RTL page, so typed characters run rightwards and the button must
            // not sit on top of them. pr-16 reserves the space; the button is a
            // fixed w-14 because "הסתר" is wider than "הצג" (C-0005, measured).
            inputClassName="pr-16"
            adornment={
              <button
                type="button"
                data-password-toggle
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-pressed={passwordVisible}
                aria-label={passwordToggleLabel(passwordVisible)}
                className="absolute inset-y-0 right-0 flex min-h-touch w-14 items-center justify-center rounded-xl text-base font-medium text-ink-muted active:text-ink"
              >
                {passwordVisible ? 'הסתר' : 'הצג'}
              </button>
            }
            footer={
              fieldErrors.password ? (
                <span className="text-base text-red-700">{fieldErrors.password}</span>
              ) : (
                mode === 'signup' && (
                  <span className="text-base text-ink-muted">8 תווים לפחות.</span>
                )
              )
            }
          />
```

Add `import LatinField from '@/components/LatinField';` at the top.
⚠️ `BASE_INPUT` ends with `px-4`; the password field previously used `py-3 pl-4 pr-16`. Tailwind
resolves the later class, and `inputClassName` is appended after the base — so `pr-16` wins over
the `px-4` right side. Step 6 measures this rather than trusting it.

- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run components/LatinField.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Measure the keyboards and the padding that Step 4 assumed**

In `scripts/verify-mobile.mjs`, inside the existing `if (route === '/signup' || route ===
'/login')` block (the one starting at :275), add before the toggle checks:

```js
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
```

The existing "toggle fits its reserved space" checks (:297-316) already measure `padding-right`
against the button width and will fail on their own if `pr-16` lost to `px-4`.

- [ ] **Step 7: Prove the new checks can fail**

Temporarily change `enterKeyHint="go"` to `enterKeyHint="next"` on the password field, run
`npm run build && npm run check:mobile`, and confirm **3 failures** (`password keyboard offers
"go"` at 320/375/414) plus a failing `AuthForm asks for the two keyboards` unit test. Restore it.

- [ ] **Step 8: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all five green; unit total ≥ 247; mobile total ≥ 309.
⚠️ The pre-existing toggle checks must still pass — that is the regression signal for the
refactor. If `toggle fits its reserved space` fails, the class merge in Step 4 lost; fix by
removing `px-4` from `BASE_INPUT` and passing `px-4` explicitly per field, then re-measure.

- [ ] **Step 9: Commit**

```bash
git add components/LatinField.tsx components/LatinField.test.ts components/AuthForm.tsx \
        scripts/verify-mobile.mjs
git commit -m "loop(DEV): C-XXXX F-015 + TD-5 — one Latin input component, keyboards measured"
```

---

## After the last task

Update in the same tick as Task 3's commit (RULES § 0.7 — plan files move with the code):

- `plan/50-tasks.md`: T-026 → 🟣 with the evidence line.
- `plan/60-findings.md`: F-009 and F-015 → ✅ טופל **only** with the fresh output of the five
  verification commands quoted. Dev marks handled; Dev does not write new findings rows.
- `plan/30-architecture.md`: TD-5 → closed (Task 3); TD-13 → note that the band is now measured
  through `/dev/identity` while `/onboarding` itself is still not.
- `plan/00-control.md`: `NEXT_AGENT: CRITIC`, release the lock, one handoff row.

---

## Self-Review

**1. Coverage.** F-009's two halves (the mis-mapped code and the missing ceiling) are Task 1
Steps 3–5. T-026's two halves ("display the registered address" and "correction in one tap") are
Task 2 Steps 5–8. F-015's two fields are Task 3 Step 4 and are measured in Step 6. TD-5's
"shared field component carrying dir=ltr in one place" is Task 3 Steps 3–4. **Gap accepted on
purpose:** F-008 (see the header) and the `/onboarding` route itself (TD-13 stays open — the
fixture measures the component, not the route).

**2. Placeholders.** No step says "add validation", "handle errors" or "similar to Task N"; the
password copy, the Hebrew CTA and the contract paragraph are written out in full. Every code step
carries the code.

**3. Type consistency.** `passwordLengthProblem` returns the union
`'weak_password' | 'password_too_long' | null`, and both non-null members are keys of
`AUTH_MESSAGES_HE` — which is why `AUTH_MESSAGES_HE[problem]` type-checks in Task 1 Step 4 and
why `'password_too_long'` must be added to `AuthErrorCode` in Step 3 *before* Step 4.
`LOGOUT_DESTINATION_FIELD` is used by name in `RegisteredAddress.tsx` (Step 5) and
`app/logout/route.ts` (Step 8), never as a literal. `logoutRedirectPath(destination, email)` has
the same parameter order at its definition (Step 3) and its call site (Step 8).
`LatinField`'s `onChange` takes a **string**, not an event — both call sites in Task 3 Step 4
pass `setEmail`/`setPassword` directly, which is why the component unwraps `e.target.value`
itself.

**4. Risk left on the table.** Task 3 is the only refactor of code that already works. Its
regression signal is the four pre-existing password-toggle mobile checks, which measure the exact
property the refactor could break (reserved padding vs button width). Task 3 Step 8 says so
explicitly and names the fallback fix.
