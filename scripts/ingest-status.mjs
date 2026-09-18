#!/usr/bin/env node
/**
 * 🔴 **`npm run ingest:status` — כמה אצוות נכתבו, וכמה מהן באמת הגיעו ללומד.**
 *
 * 🔬 **למה הקובץ הזה קיים, ⛔ וכל מספר בו נמדד.** ב-`C-0712` נמדד שהמסד מחזיק
 * **476 מילים** בעוד אצוות ה-JSONL מחזיקות **1,483** — ⇒ **37 אצוות, חודש שלם של
 * תפוקת CONTENT, ⛔ מעולם ⛔ לא הגיעו ללומד.** הצינור ⛔ לא היה שבור ולו יום אחד:
 * `npm run build:ingest` קרא את כל 46 האצוות, פסל 0 שורות וכתב את ה-SQL. **הוא פשוט
 * ⛔ לא הוחל מאז 16/08**, ו⛔ **שום שער, שום בדיקה ושום סוכן ⛔ לא ידעו לומר זאת** —
 * כי כולם מודדים את הריפו, ו⛔ אף אחד ⛔ לא מדד את **הפער בין הריפו למסד**.
 *
 * ⇒ הכלי הזה מדפיס בדיוק את הפער. הוא ⛔ **אינו** ניגש למסד בעצמו — CI ⛔ אינו
 * יכול — הוא מדפיס את **רשימת האצוות שעל הדיסק**, ואת שאילתת הבדיקה שהסוכן מריץ
 * דרך `mcp__Supabase__execute_sql`. ⇒ שורה אחת בטיק CONTENT, ⛔ ולא חקירה.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join('data', 'generated');
const files = readdirSync(DATA).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort();
const rows = (f) =>
  readFileSync(join(DATA, f), 'utf8').split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('#')).length;

const total = files.reduce((n, f) => n + rows(f), 0);
console.log(`אצוות על הדיסק: ${files.length} · ${total} שורות משמעות`);
console.log('');
console.log('⇒ הרץ את השאילתה הזאת דרך המחבר, והשווה:');
console.log('   select notes from generation_runs order by notes;');
console.log('');
console.log('אצווה שאינה חוזרת בשאילתה ⛔ לא הוחלה, והמילים שבה ⛔ אינן מגיעות ללומד.');
console.log('התיקון: `npm run build:ingest`, ואז הבלוק שלה מ-supabase/seed/0001_content_batches.sql');
console.log('דרך `mcp__Supabase__execute_sql`. הבלוקים אידמפוטנטיים (`on conflict`).');
console.log('');
console.log('הרשימה שעל הדיסק:');
for (const f of files) console.log(`  ${f} · ${rows(f)}`);
