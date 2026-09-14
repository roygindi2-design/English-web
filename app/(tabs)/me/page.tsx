import MeScreen from '@/components/MeScreen';

// T-264 — the exact string `<MeScreen>`'s own `<h1>` already renders
// (`components/MeScreen.tsx` `HEADING_HE`); the suffix is `app/layout.tsx`'s
// `title.template`.
export const metadata = { title: 'אני' };

/**
 * אני — the learner tab (D-027 · `40-decisions.md` § 4.2ב: "כל מה שהוא **על
 * הלומד** — התקדמות, הגדרות, ייחוס מקורות (D-007), יציאה").
 *
 * 🔴 **T-334 — this route is static now, ⛔ and that is ⛔ not a concession on the
 * gate. המשך של: T-328.**
 * 🔬 **נמדד ב-`npm run build` אחרי `T-328`, ⛔ ולא מהקוד:** `○ /cards` · `○ /world` ·
 * `○ /settings` · `○ /studies` מול **`ƒ /me`** ⇒ ארבע לשוניות מתוך חמש הוגשו מהקצה,
 * והחמישית עשתה הלוך-ושוב לשרת **ול-Supabase** בכל מעבר — **שתי** קריאות, שתיהן
 * ב-`await` לפני שצויר ולו פיקסל אחד. ⇒ **זה** ההבדל המבני שהלומד חווה כ«חלק
 * מהמעברים נטענים וחלק לא», ⛔ ולא תחושה.
 *
 * ⛔ **ומה שהוסר כאן הוא הקריאה, ⛔ ולא ההגנה.** ‏`getUser()` שישב בקובץ הזה
 * ⛔ לא היה מנעול **שני**: הוא היה **שלישי על אותה דלת** ש-`proxy.ts` כבר מחזיק,
 * והוא היה **הקריאה לשרת עצמה**. שני המנעולים, על שתי דלתות שונות בדיוק כפי שלקח
 * F-003 דורש, הם:
 *   ① `proxy.ts` — `/me` נמצא ב-`PROTECTED_SCREENS` ומפנה ל-`/login` לפני שהמסמך
 *     נשלח בכלל. ⚠️ **ו-F-003 נשמר לפי לשונו:** `proxy.ts` נכשל **סגור** כשאין env,
 *     ⛔ ולא פתוח;
 *   ② `GET /api/profile` — הנתיב שבו `<MeScreen>` שולף — בודק סשן בעצמו ומחזיר
 *     `session_expired`, והמסך נושא יציאה לכל ענף כשל.
 * ⇒ נמדד חי ב-T-328 על `next start` עבור `/studies`, אותה צורה בדיוק: **307 ⇒
 * `/login?expired=1`**.
 *
 * ⛔ **ושלוש הקריאות אינן כאן** — `<MeScreen>` קורא אותן בעצמו דרך
 * `GET /api/profile` ו-`GET /api/levels/summary`, בדיוק הדפוס של `<StudiesScreen>`
 * ושל `<LevelMapScreen>`. ⇒ ‏`loading.tsx` ומצב הטעינה של הרכיב שומרים על המקום
 * (`taste-skill § 6.D` — `CLS < 0.1`), ולכן השלד מצויר מייד ו⛔ אינו קופץ כשהתשובה
 * חוזרת.
 *
 * ⚠️ **‏T-301 ⛔ לא נאבד:** `wordsLearned === null` (קריאה שנכשלה) ו-`0` (לומד שטרם
 * למד) הן עדיין **שתי עובדות שונות**, ועכשיו יש שלישית — «בדרך». שלושתן חיות
 * ב-`<MeScreen>`, ו-`<MeWordsLearned>` עדיין הבעלים של המארקאפ של שתי המוגמרות.
 *
 * ⚠️ **‏TD-13 ⛔ אינה משתנה:** המסלול עדיין חסום-סשן ב-`proxy.ts`, עדיין עונה 307
 * בלי env, והגאומטריה עדיין נמדדת דרך `/dev/tabs/me`.
 *
 * ⚠️ § 4.2ב question 4 also names a `פס רמה` (a level bar) for this tab. It is
 * NOT built, and the reason is a missing input rather than a missing hour: the
 * learner has no level. The level test is T-004, which § 4.2ב itself puts out of
 * scope for the shell, and ⛔ `senses.cefr_level` is a property of a word and
 * never of a learner. A bar drawn today would be a claim about the learner that
 * nothing in the database supports. Recorded for the PM in the T-051 row rather
 * than improvised into a third option.
 */
export default function MePage() {
  return <MeScreen />;
}
