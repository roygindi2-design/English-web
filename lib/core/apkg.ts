/**
 * Anki .apkg note parsing (T-044) — the pure half.
 *
 * An .apkg is a ZIP containing collection.anki2 (SQLite). This module never sees
 * either: the caller extracts rows from the `notes` table and hands over `flds`
 * (fields joined by U+001F), `tags`, and the field NAMES from the note type.
 * ⛔ Nothing here touches fs or zip — T-044 puts that in the API layer.
 *
 * ⚠️ FIXTURES ARE NOT THE DECK. Roy's deck (F-019: "100 Basic Hebrew Phrases",
 * 101 notes, fields עברית|English|[sound:*.mp3]|תעתיק) has never been committed —
 * `find . -iname '*apkg*'` returns nothing. The tests reproduce its documented
 * SHAPE from the finding; they do not prove anything about its 101 real rows.
 * plan/03-for-roy.md asks for the file. Until it arrives, no claim in this repo
 * may say the deck "was parsed" — only that a deck of that shape parses.
 *
 * ⛔ This module imports nothing. It is a format reader; wiring it to our content
 * types would make a stranger's deck look like a validated sense.
 */
export const FIELD_SEPARATOR = '\u001F'; // ⛔ the escape, not a literal control char in source

const HEBREW = /[֐-׿]/;
const LATIN = /[A-Za-z]/;
const SOUND = /\[sound:([^\]]+)\]/g;
/** ⛔ Add a name here only when a real deck uses it. No guesses. */
const TRANSLIT_NAME = /translit|transcription|pronun|romani|תעתיק|הגייה/i;

export type Script = 'latin' | 'hebrew' | 'mixed' | 'other' | 'empty';

/** ⛔ Never trims: Anki writes both `""` and `"  "` and they are not the same field. */
export function splitFields(flds: string): readonly string[] {
  return flds.split(FIELD_SEPARATOR);
}

export function parseTags(tags: string): readonly string[] {
  return tags.split(/\s+/).filter((t) => t !== '');
}

/**
 * Strips every `[sound:…]` occurrence and reports the FIRST filename —
 * a card cannot play two files.
 */
export function stripSoundMarkup(value: string): { readonly text: string; readonly audio: string | null } {
  let audio: string | null = null;
  const text = value.replace(SOUND, (_m: string, file: string) => {
    if (audio === null) audio = file.trim();
    return '';
  });
  return { text: text.replace(/\s+/g, ' ').trim(), audio };
}

export function detectScript(value: string): Script {
  const { text } = stripSoundMarkup(value);
  if (text === '') return 'empty';
  const heb = HEBREW.test(text);
  const lat = LATIN.test(text);
  if (heb && lat) return 'mixed';
  if (heb) return 'hebrew';
  if (lat) return 'latin';
  return 'other';
}

export interface AnkiNote {
  readonly fieldNames: readonly string[];
  readonly flds: string;
  readonly tags: string;
}

export interface ApkgCard {
  readonly front: string;      // English, always — our product direction
  readonly back: string;       // Hebrew
  readonly audio?: string;     // filename from [sound:…], without the markup
  readonly translit?: string;  // Latin-script pronunciation aid, when named as one
  readonly tags: readonly string[];
}

export type NoteReject =
  | 'field_count_mismatch' | 'no_hebrew_field' | 'no_latin_field'
  | 'ambiguous_latin_fields' | 'empty_after_markup';

export type NoteResult =
  | { readonly ok: true; readonly card: ApkgCard }
  | { readonly ok: false; readonly reason: NoteReject };

interface Slot {
  readonly name: string;
  readonly text: string;
  readonly audio: string | null;
  readonly script: Script;
}

/**
 * Resolves field ROLES from script and field name — never from position.
 * ⛔ There is no "probably the first one" branch: an unresolvable note is rejected
 * with a named reason. A positional guess would produce cards that typecheck
 * perfectly and teach the wrong direction.
 */
export function parseAnkiNote(note: AnkiNote): NoteResult {
  const values = splitFields(note.flds);
  if (values.length !== note.fieldNames.length) return { ok: false, reason: 'field_count_mismatch' };

  const slots: Slot[] = values.map((raw, i) => {
    const { text, audio } = stripSoundMarkup(raw);
    return { name: note.fieldNames[i] ?? '', text, audio, script: detectScript(raw) };
  });

  const audio = slots.find((s) => s.audio !== null)?.audio ?? undefined;

  const hebrew = slots.filter((s) => s.script === 'hebrew' || s.script === 'mixed');
  if (hebrew.length === 0) return { ok: false, reason: 'no_hebrew_field' };
  const back = pickSingle(hebrew.length === 1 ? hebrew : hebrew.filter((s) => !TRANSLIT_NAME.test(s.name)));
  if (back === null) return { ok: false, reason: 'ambiguous_latin_fields' };

  const latin = slots.filter((s) => s.script === 'latin');
  if (latin.length === 0) return { ok: false, reason: 'no_latin_field' };
  const named = latin.filter((s) => TRANSLIT_NAME.test(s.name));
  const front = pickSingle(latin.length === 1 ? latin : latin.filter((s) => !TRANSLIT_NAME.test(s.name)));
  if (front === null) return { ok: false, reason: 'ambiguous_latin_fields' };

  // Defensive: a slot whose text is empty classifies as `empty` and never reaches
  // the hebrew/latin lists, so this is unreachable today. It stays as the guard that
  // must fire if `detectScript` ever stops stripping markup before classifying.
  if (front.text === '' || back.text === '') return { ok: false, reason: 'empty_after_markup' };

  const first = named[0];
  const card: ApkgCard = {
    front: front.text,
    back: back.text,
    ...(audio !== undefined ? { audio } : {}),
    ...(named.length === 1 && first !== undefined ? { translit: first.text } : {}),
    tags: parseTags(note.tags),
  };
  return { ok: true, card };
}

/** Exactly one, or nothing. ⛔ There is no "pick the first" branch. */
function pickSingle(list: readonly Slot[]): Slot | null {
  return list.length === 1 ? (list[0] ?? null) : null;
}
