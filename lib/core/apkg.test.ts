import { describe, expect, it } from 'vitest';
import {
  FIELD_SEPARATOR, detectScript, stripSoundMarkup, splitFields, parseTags,
  parseAnkiNote, type AnkiNote,
  classifyDeck, apkgIngestDecision, MIN_PARSE_RATE, type CommercialLicence,
} from './apkg';

const f = (...parts: string[]) => parts.join(FIELD_SEPARATOR);

describe('splitFields', () => {
  it('splits on U+001F and preserves empty and whitespace-only fields', () => {
    expect(splitFields(`a${FIELD_SEPARATOR}${FIELD_SEPARATOR}  ${FIELD_SEPARATOR}b`))
      .toEqual(['a', '', '  ', 'b']);
  });

  it('returns one field when there is no separator', () => {
    expect(splitFields('only')).toEqual(['only']);
  });
});

describe('detectScript', () => {
  it.each([
    ['thank you', 'latin'],
    ['תודה רבה', 'hebrew'],
    ['תודה (thanks)', 'mixed'],
    ['12 — 34', 'other'],
    ['   ', 'empty'],
    ['[sound:a.mp3]', 'empty'],
  ])('classifies %j as %s', (input, expected) => {
    expect(detectScript(input)).toBe(expected);
  });
});

describe('stripSoundMarkup', () => {
  it('removes the markup and returns the filename', () => {
    expect(stripSoundMarkup('boker tov [sound:001.mp3]'))
      .toEqual({ text: 'boker tov', audio: '001.mp3' });
  });

  it('strips every occurrence but reports only the first file', () => {
    expect(stripSoundMarkup('[sound:a.mp3]x[sound:b.mp3]'))
      .toEqual({ text: 'x', audio: 'a.mp3' });
  });

  it('reports null when there is no markup, and does not alter the text', () => {
    expect(stripSoundMarkup(' hello ')).toEqual({ text: 'hello', audio: null });
  });
});

describe('parseTags', () => {
  it('splits Anki space-padded tags and drops the padding', () => {
    expect(parseTags(' greetings basic ')).toEqual(['greetings', 'basic']);
  });

  it('returns an empty list for an empty tag string', () => {
    expect(parseTags('  ')).toEqual([]);
  });
});

/** F-019's documented shape: Hebrew first, English second, audio third, translit fourth. */
const teachMeHebrew: AnkiNote = {
  fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
  flds: f('בוקר טוב', 'good morning', '[sound:001.mp3]', 'boker tov'),
  tags: ' greetings ',
};

describe('parseAnkiNote', () => {
  it('puts English on the front even when the deck authored Hebrew first', () => {
    const r = parseAnkiNote(teachMeHebrew);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.card).toEqual({
      front: 'good morning',
      back: 'בוקר טוב',
      audio: '001.mp3',
      translit: 'boker tov',
      tags: ['greetings'],
    });
  });

  it('reads the same note reordered — position carries no meaning', () => {
    const r = parseAnkiNote({
      fieldNames: ['תעתיק', 'Audio', 'English', 'עברית'],
      flds: f('boker tov', '[sound:001.mp3]', 'good morning', 'בוקר טוב'),
      tags: '  ',
    });
    expect(r).toEqual({
      ok: true,
      card: { front: 'good morning', back: 'בוקר טוב', audio: '001.mp3', translit: 'boker tov', tags: [] },
    });
  });

  it('omits audio and translit when the deck has only two fields', () => {
    const r = parseAnkiNote({ fieldNames: ['Front', 'Back'], flds: f('water', 'מים'), tags: '' });
    expect(r).toEqual({ ok: true, card: { front: 'water', back: 'מים', tags: [] } });
  });

  it('rejects when the field names and the field values disagree in count', () => {
    expect(parseAnkiNote({ fieldNames: ['Front'], flds: f('water', 'מים'), tags: '' }))
      .toEqual({ ok: false, reason: 'field_count_mismatch' });
  });

  // ⚠️ DEVIATION FROM THE PLAN, STATED ON PURPOSE. The plan's Task-1 Step-6 listing
  // expects `ambiguous_latin_fields` here, which contradicts its own Rule 4: the
  // Hebrew check runs BEFORE the Latin one, so an English-only deck can only ever
  // reach `no_hebrew_field`. Rule 4 wins — the literal was the error. Had the test
  // won instead, `no_hebrew_field` would be an unreachable value that `classifyDeck`
  // nevertheless counts, i.e. a bucket that can never be non-zero.
  it('rejects an English-only deck rather than inventing a back', () => {
    expect(parseAnkiNote({ fieldNames: ['Front', 'Back'], flds: f('water', 'liquid'), tags: '' }))
      .toEqual({ ok: false, reason: 'no_hebrew_field' });
  });

  it('rejects a Hebrew-only deck rather than inventing a front', () => {
    expect(parseAnkiNote({ fieldNames: ['א', 'ב'], flds: f('מים', 'נוזל'), tags: '' }))
      .toEqual({ ok: false, reason: 'ambiguous_latin_fields' });
  });

  it('rejects two unnamed Latin fields — it will not guess which is the word', () => {
    expect(parseAnkiNote({
      fieldNames: ['One', 'Two', 'Three'],
      flds: f('good morning', 'boker tov', 'בוקר טוב'),
      tags: '',
    })).toEqual({ ok: false, reason: 'ambiguous_latin_fields' });
  });

  it('rejects when the English field is nothing but sound markup', () => {
    expect(parseAnkiNote({
      fieldNames: ['English', 'עברית'],
      flds: f('[sound:001.mp3]', 'מים'),
      tags: '',
    })).toEqual({ ok: false, reason: 'no_latin_field' });
  });

  it('treats a mixed-script field as the Hebrew side', () => {
    const r = parseAnkiNote({
      fieldNames: ['English', 'Hebrew'],
      flds: f('order', 'להזמין (food)'),
      tags: '',
    });
    expect(r).toEqual({ ok: true, card: { front: 'order', back: 'להזמין (food)', tags: [] } });
  });
});

/** Three notes shaped like F-019's deck: Hebrew in the sort field. */
const f019: readonly AnkiNote[] = [
  { fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
    flds: f('בוקר טוב', 'good morning', '[sound:001.mp3]', 'boker tov'), tags: ' greetings ' },
  { fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
    flds: f('על לא דבר', "you're welcome", '[sound:002.mp3]', 'al lo davar'), tags: ' greetings ' },
  { fieldNames: ['עברית', 'English', 'Audio', 'תעתיק'],
    flds: f('תודה רבה', 'thank you very much', '[sound:003.mp3]', 'toda raba'), tags: '' },
];

describe('classifyDeck', () => {
  it('reports he_to_en for a deck that authored Hebrew in the sort field', () => {
    const s = classifyDeck(f019);
    expect(s.direction).toBe('he_to_en');
    expect(s.notes).toBe(3);
    expect(s.parsed).toBe(3);
    expect(s.cards[0]?.front).toBe('good morning');
  });

  it('reports en_to_he for the mirrored deck', () => {
    const mirrored = f019.map((n) => ({
      ...n,
      fieldNames: ['English', 'עברית', 'Audio', 'תעתיק'],
      flds: (() => {
        const v = splitFields(n.flds);
        return f(v[1] ?? '', v[0] ?? '', v[2] ?? '', v[3] ?? '');
      })(),
    }));
    expect(classifyDeck(mirrored).direction).toBe('en_to_he');
  });

  it('reports unknown when the notes disagree', () => {
    const first = f019[0];
    if (first === undefined) throw new Error('fixture');
    const mixed = [first, {
      fieldNames: ['English', 'עברית'], flds: f('water', 'מים'), tags: '',
    }];
    expect(classifyDeck(mixed).direction).toBe('unknown');
  });

  it('counts every rejection by reason and keeps them out of cards', () => {
    const first = f019[0];
    if (first === undefined) throw new Error('fixture');
    const s = classifyDeck([first, { fieldNames: ['A'], flds: f('x', 'y'), tags: '' }]);
    expect(s.notes).toBe(2);
    expect(s.parsed).toBe(1);
    expect(s.rejected.field_count_mismatch).toBe(1);
    expect(s.rejected.no_hebrew_field).toBe(0);
    expect(s.cards).toHaveLength(1);
  });
});

describe('apkgIngestDecision', () => {
  it('refuses F-019 on both of its grounds at once', () => {
    const d = apkgIngestDecision(classifyDeck(f019), 'unknown');
    expect(d.ingest).toBe(false);
    expect([...d.reasons].sort()).toEqual(['licence_unknown', 'wrong_direction']);
  });

  it('still refuses a correctly-directed deck with no known licence', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const };
    expect(apkgIngestDecision(s, 'unknown')).toEqual({ ingest: false, reasons: ['licence_unknown'] });
  });

  it('refuses a forbidden licence with its own reason', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const };
    expect(apkgIngestDecision(s, 'forbidden')).toEqual({ ingest: false, reasons: ['licence_forbidden'] });
  });

  it('refuses a deck it can only half read', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const, notes: 10, parsed: 3 };
    expect(apkgIngestDecision(s, 'permitted').reasons).toContain('parse_rate_too_low');
  });

  it('accepts only when direction, licence and parse rate all hold', () => {
    const s = { ...classifyDeck(f019), direction: 'en_to_he' as const };
    expect(apkgIngestDecision(s, 'permitted')).toEqual({ ingest: true, reasons: [] });
  });

  // ⚠️ ADDED BEYOND THE PLAN. Plan Task-2 Step-5 mapped mutation 3
  // (`direction !== 'en_to_he'` → `direction === 'he_to_en'`) to the
  // "never reports ingest:true alongside a reason" test — and that mutation SURVIVED:
  // that test only compares `ingest` with `reasons.length`, so it holds for any
  // consistent-but-wrong rule. Without this test an unknown-direction deck ingests.
  it('refuses an unknown-direction deck — only en_to_he is ever accepted', () => {
    const s = { ...classifyDeck(f019), direction: 'unknown' as const };
    expect(apkgIngestDecision(s, 'permitted')).toEqual({ ingest: false, reasons: ['wrong_direction'] });
  });

  it('has no default licence — every call states one', () => {
    // @ts-expect-error licence is required; a deck with no stated licence must not compile through
    apkgIngestDecision(classifyDeck(f019));
  });

  it('never reports ingest:true alongside a reason', () => {
    const licences: CommercialLicence[] = ['permitted', 'forbidden', 'unknown'];
    for (const l of licences) {
      for (const dir of ['en_to_he', 'he_to_en', 'unknown'] as const) {
        const d = apkgIngestDecision({ ...classifyDeck(f019), direction: dir }, l);
        expect(d.ingest, `${dir}/${l}`).toBe(d.reasons.length === 0);
      }
    }
  });

  it('pins the parse-rate floor so a silent loosening fails here', () => {
    expect(MIN_PARSE_RATE).toBe(0.95);
  });
});
