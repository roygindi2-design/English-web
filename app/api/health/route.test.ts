import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-053 — the guards that keep `/api/health` honest.
 *
 * Both the route and the contract are read as SOURCE, not called: the route
 * needs live Supabase env to answer, and `docs/api-contract.md` is a document.
 * The cross-file assertion is the point — the contract is required to be
 * updated in the same commit as the route (RULES, Dev § 5).
 *
 * The failure these guard against is the one T-053 exists for: `/api/health`
 * returned `ok:true` while the migrations had never been run, so the post-deploy
 * smoke test of RULES § 0.1.1 ד׳ passed on an empty database.
 */
const ROUTE = readFileSync('app/api/health/route.ts', 'utf8');
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(ROUTE);

describe('GET /api/health — הבריאות נוגעת בטבלה (T-053)', () => {
  it('נוגע בטבלה אמיתית ולא רק ב-ENV', () => {
    expect(CODE).toMatch(/from\('word_progress'\)/);
  });

  it('לעולם אינו מחזיר טקסט שגיאה גולמי ללקוח', () => {
    expect(CODE).not.toMatch(/error\.message[\s\S]{0,80}(NextResponse|detail:)/);
  });

  it('אינו נוגע במפתח service-role', () => {
    expect(CODE).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('החוזה מתעד את הבדיקה הרביעית שהקוד מייצר', () => {
    expect(CONTRACT).toContain('database_schema');
  });
});
