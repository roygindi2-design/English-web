/**
 * `T-380` — הצהרת טיפוסים ל-`walk-expected.mjs`, אותה תבנית בדיוק כמו
 * `walk-errors.d.mts`: הסקריפט רץ ב-Node כ-`.mjs`, והבדיקה מייבאת אותו ב-TypeScript.
 */
export declare const EXPECTED_CONSOLE: Readonly<Record<string, readonly RegExp[]>>;

export declare function splitExpected(
  route: string,
  errors: readonly string[],
): { errors: string[]; expected: string[] };
