import LessonScreen, { type LessonItem } from '@/components/LessonScreen';

/**
 * פיקסטורת פריסה ל-`check:mobile`. ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * ⚠️ **בלי הפיקסטורה האנטומיה לעולם אינה נמדדת:** אין עדיין מסלול מוצר לשיעור
 * (T-090 חסומה ב-R-018), ולכן `<LessonScreen>` ⛔ אינו מרונדר בשום מקום שהארנס
 * מגיע אליו. הפיקסטורה מקבלת את הפריטים כ-prop ו⛔ אינה מבקשת מהשרת דבר ⇒
 * ⛔ אין לה רשומה ב-`EXPECTED_CONSOLE`, והשקט הזה הוא ההוכחה.
 *
 * ⛔ **המחרוזות כאן ⛔ אינן תוכן לימודי.** האנגלית היא מילות פריסה, העברית היא
 * תוויות מבנה. ⛔ אין כאן ולו הד אחד לפריט, לניסוח או להסבר של מאל"ו (R-018),
 * ⛔ ואין טענה דקדוקית שאיש לא מדד — «דוגמה א׳» ⛔ אינו כלל לשוני.
 */
const ITEMS: readonly LessonItem[] = [
  {
    id: 'fixture-1',
    prompt: [
      { text: 'The ', isTarget: false },
      { text: 'report', isTarget: true },
      { text: ' was finished on time.', isTarget: false },
    ],
    choices: [
      { id: 'fixture-1-a', text: 'summary', why: 'אפשרות ראשונה — טקסט פריסה' },
      { id: 'fixture-1-b', text: 'document', why: 'אפשרות שנייה — טקסט פריסה' },
      { id: 'fixture-1-c', text: 'schedule', why: 'אפשרות שלישית — טקסט פריסה' },
    ],
  },
  {
    id: 'fixture-2',
    prompt: [
      { text: 'She ', isTarget: false },
      { text: 'decided', isTarget: true },
      { text: ' to wait for the second answer.', isTarget: false },
    ],
    choices: [
      { id: 'fixture-2-a', text: 'agreed', why: 'אפשרות ראשונה — טקסט פריסה' },
      { id: 'fixture-2-b', text: 'refused', why: 'אפשרות שנייה — טקסט פריסה' },
      { id: 'fixture-2-c', text: 'continued', why: 'אפשרות שלישית — טקסט פריסה' },
    ],
  },
  {
    id: 'fixture-3',
    prompt: [
      { text: 'Most of the members ', isTarget: false },
      { text: 'agreed', isTarget: true },
      { text: ' with the plan.', isTarget: false },
    ],
    choices: [
      { id: 'fixture-3-a', text: 'all', why: 'אפשרות ראשונה — טקסט פריסה' },
      { id: 'fixture-3-b', text: 'some', why: 'אפשרות שנייה — טקסט פריסה' },
      { id: 'fixture-3-c', text: 'none', why: 'אפשרות שלישית — טקסט פריסה' },
    ],
  },
];

export default function DevLessonPage() {
  return (
    <LessonScreen
      questionTypeTitle="כותרת סוג השאלה"
      explanation="פסקת הסבר לבדיקת פריסה. השורה הזאת קיימת כדי שהבלוק יקבל גובה אמיתי בשלושת הרוחבים, ⛔ ואינה טענה לשונית."
      items={ITEMS}
      phase="items"
      doneTitle="כותרת הסיום"
      doneExitLabel="חזרה ללימודים"
    />
  );
}
